import { NextResponse } from 'next/server';
import { WeddingMedia } from '@/Entities/WeddingMedia';
import archiver from 'archiver';

interface MediaItem {
  id: string;
  url?: string;
  media_url?: string;
  type: 'image' | 'video';
  created_date: string;
  title?: string;
  uploader_name: string;
}

// Server-side cache for media items
let cachedMediaItems: MediaItem[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function POST() {
  try {
    // Check if enough time has passed since the wedding (25 hours)
    const weddingDate = new Date('2025-10-20T20:00:00+03:00');
    const downloadDate = new Date(weddingDate.getTime() + (25 * 60 * 60 * 1000));
    const currentTime = new Date();

    if (currentTime < downloadDate) {
      return NextResponse.json(
        { error: 'Download not yet available' },
        { status: 403 }
      );
    }

    console.log('🔄 Processing download request');
    
    // Check if we have valid cached media items
    const now = Date.now();
    if (cachedMediaItems && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('🚀 Using cached media items');
    } else {
      console.log('🔄 Fetching media items from S3');
      
      // Get all media files - we'll need to fetch all pages
      const allMediaItems: MediaItem[] = [];
      let currentPage = 1;
      const limit = 100; // Fetch 100 items per page
      
      while (true) {
        const response = await WeddingMedia.list("-created_date", currentPage, limit);
        
        if (!response.items || response.items.length === 0) {
          break; // No more items
        }
        
        allMediaItems.push(...response.items);
        
        // If we got less than the limit, we've reached the end
        if (response.items.length < limit) {
          break;
        }
        
        currentPage++;
      }
      
      if (allMediaItems.length === 0) {
        return NextResponse.json(
          { error: 'No media files found' },
          { status: 404 }
        );
      }
      
      // Cache the media items
      cachedMediaItems = allMediaItems;
      cacheTimestamp = now;
      console.log(`✅ Found ${allMediaItems.length} media items`);
    }
    
    // Use cached or fresh media items
    const allMediaItems = cachedMediaItems!;

    // Validate media items before processing
    const validMediaItems = allMediaItems.filter(media => {
      if (!media.url && !media.media_url) {
        console.warn(`⚠️ Skipping media item ${media.id}: No URL found`);
        return false;
      }
      if (!media.type || (media.type !== 'image' && media.type !== 'video')) {
        console.warn(`⚠️ Skipping media item ${media.id}: Invalid type: ${media.type}`);
        return false;
      }
      return true;
    });

    if (validMediaItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid media files found for download' },
        { status: 404 }
      );
    }

    console.log(`📁 Processing ${validMediaItems.length} valid files`);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Create a readable stream from the archive
    const stream = archive as unknown as ReadableStream;
    
    // Note: We'll create the final response after processing all files

    // Add files to archive with simplified structure
    let successfullyAddedFiles = 0;
    let failedFiles = 0;
    const failedFileDetails: string[] = [];
    const addedFilesList: string[] = []; // Track all added files
    
    for (let i = 0; i < validMediaItems.length; i++) {
      const media = validMediaItems[i];
      try {
        // Get the file content from S3 or wherever it's stored
        const fileResponse = await fetch(media.url || media.media_url || '');
        
        if (fileResponse.ok) {
          const buffer = await fileResponse.arrayBuffer();
          
          // Create simplified filename structure: type/filename.ext
          const mediaType = media.type === 'image' ? 'תמונות' : 'סרטונים';
          
          // Get the correct file extension from the URL
          const url = media.url || media.media_url || '';
          const urlParts = url.split('.');
          let fileExtension = urlParts.length > 1 ? urlParts[urlParts.length - 1] : 'unknown';
          
          // Clean up the extension (remove query parameters, etc.)
          fileExtension = fileExtension.split('?')[0].split('#')[0];
          
          // Validate file extension based on media type
          if (mediaType === 'תמונות') {
            const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'avif', 'svg'];
            if (!validImageExtensions.includes(fileExtension.toLowerCase())) {
              fileExtension = 'jpg';
            }
          } else if (mediaType === 'סרטונים') {
            const validVideoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ogv'];
            if (!validVideoExtensions.includes(fileExtension.toLowerCase())) {
              fileExtension = 'mp4';
            }
          }
          
          // Remove the wedding-uploads/ prefix from the ID if it exists
          let cleanId = media.id;
          if (cleanId.startsWith('wedding-uploads/')) {
            cleanId = cleanId.replace('wedding-uploads/', '');
          }
          
          // Create a clean filename without the folder prefix
          const filename = `${mediaType}/${cleanId}`;
          
          // Add file to archive
          archive.append(Buffer.from(buffer), { name: filename });
          
          successfullyAddedFiles++;
          addedFilesList.push(filename);
        } else {
          failedFiles++;
          const errorMsg = `Failed to fetch file ${media.id}: ${fileResponse.status} ${fileResponse.statusText}`;
          failedFileDetails.push(errorMsg);
          console.warn(`⚠️ ${errorMsg}`);
        }
      } catch (error) {
        failedFiles++;
        const errorMsg = `Error processing file ${media.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        failedFileDetails.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`📊 ZIP Creation Summary:`);
    console.log(`   - Successfully added: ${successfullyAddedFiles} files`);
    
    if (failedFiles > 0) {
      console.log(`   - Failed to add: ${failedFiles} files`);
      failedFileDetails.forEach(detail => console.log(`     • ${detail}`));
    }

    // Add personal message file
    const personalMessage = `קרין ונועם היקרים!

שמחתי להיות ביום המאושר שלכם ולהעניק לכם את האלבום הדיגיטלי המלא מהחתונה שלכם, 
שכולל את כל התמונות והסרטונים היקרים שהאורחים שלכם העלו.

💝 מה תמצאו כאן:
• תמונות יפות מהאירוע המיוחד שלכם
• סרטונים מרגשים שתזכרו לנצח
• זיכרונות יקרים מכל רגע קסום

🌟 תודה מיוחדת:
תודה לכל האורחים היקרים שלכם שתעדו את הרגעים המיוחדים 
ושיתפו אתכם בזיכרונות היקרים האלה.

💕 ברכות:
אני מאחל לכם זוגיות מאושרת, אהבה אינסופית, 
וחיים מלאים בשמחה, אהבה והצלחה.

📱 פרטי קשר:
📞 טלפון: 050-587-7179

🌐 עמודים עסקיים:
• פייסבוק: https://www.facebook.com/IdanLevianDeveloper
• גוגל עסקי: https://g.page/r/CUn84Fh0Fd-ZEBM/review

⭐ בקשה קטנה:
אם נהניתם מהשירות, אשמח אם תוכלו:
• לכתוב ביקורת על העמודים העסקיים שלי
• להמליץ עליי לחברים שמתחתנים בקרוב

תיהנו מהזיכרונות היקרים האלה!
עידן ❤️

---
אלבום דיגיטלי מהאורחים
ספיר & עידן
18.08.2025
`;

    archive.append(Buffer.from(personalMessage, 'utf8'), { name: 'ברכות-אישיות-מעידן.txt' });

    // Add beautiful HTML message file
    const htmlMessage = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ברכות אישיות - ספיר & עידן</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Heebo', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            max-width: 700px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .header {
            margin-bottom: 30px;
        }
        
        .title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: #718096;
            margin-bottom: 20px;
        }
        
        .message {
            text-align: right;
            line-height: 1.8;
            color: #4a5568;
            margin-bottom: 30px;
        }
        
        .features {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            text-align: right;
        }
        
        .features h3 {
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .features ul {
            list-style: none;
            text-align: right;
        }
        
        .features li {
            margin: 8px 0;
            padding-right: 20px;
            position: relative;
        }
        
        .features li:before {
            content: "💝";
            position: absolute;
            right: -15px;
            top: 0;
        }
        
        .blessing {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            text-align: right;
        }
        
        .contact {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            text-align: right;
        }
        
        .contact h3 {
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: flex-end;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.1rem;
        }
        
        .contact-item a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .contact-item a:hover {
            text-decoration: underline;
            transform: translateY(-2px);
        }
        
        .request {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            text-align: right;
        }
        
        .request h3 {
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .request ul {
            list-style: none;
            text-align: right;
        }
        
        .request li {
            margin: 8px 0;
            padding-right: 20px;
            position: relative;
        }
        
        .request li:before {
            content: "⭐";
            position: absolute;
            right: -15px;
            top: 0;
        }
        
        .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            color: #718096;
        }
        
        .footer {
            margin-top: 20px;
            font-size: 0.9rem;
            color: #a0aec0;
        }
        
        .emoji {
            font-size: 1.5rem;
            margin: 0 5px;
        }
        
        .phone {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 15px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 1.1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">קרין ונועם היקרים!</h1>
        </div>
        
        <div class="message">
            <p>שמחתי להיות ביום המאושר שלכם ולהעניק לכם את האלבום הדיגיטלי המלא מהחתונה שלכם, 
            שכולל את כל התמונות והסרטונים היקרים שהאורחים שלכם העלו.</p>
        </div>
        
        <div class="features">
            <h3>🌟 מה תמצאו כאן:</h3>
            <ul>
                <li>תמונות יפות מהאירוע המיוחד שלכם</li>
                <li>סרטונים מרגשים שתזכרו לנצח</li>
                <li>זיכרונות יקרים מכל רגע קסום</li>
            </ul>
        </div>
        
        <div class="message">
            <p><strong>תודה מיוחדת:</strong><br>
            תודה לכל האורחים היקרים שלכם שתעדו את הרגעים המיוחדים 
            ושיתפו אתכם בזיכרונות היקרים האלה.</p>
        </div>
        
        <div class="blessing">
            <h3>💕 ברכות:</h3>
            <p>אני מאחל לכם זוגיות מאושרת, אהבה אינסופית, 
            וחיים מלאים בשמחה, אהבה והצלחה.</p>
        </div>
        
        <div class="contact">
            <h3>📱 פרטי קשר:</h3>
            <div class="contact-info">
                <div class="contact-item">
                    <span>📞 טלפון:</span>
                    <span class="phone">050-587-7179</span>
                </div>
                <div class="contact-item">
                    <span>🌐 פייסבוק עסקי:</span>
                    <a href="https://www.facebook.com/IdanLevianDeveloper" target="_blank">@IdanLevianDeveloper</a>
                </div>
                <div class="contact-item">
                    <span>🔍 גוגל עסקי:</span>
                    <a href="https://g.page/r/CUn84Fh0Fd-ZEBM/review" target="_blank">עמוד העסק שלי</a>
                </div>
            </div>
        </div>
        
        <div class="request">
            <h3>⭐ בקשה קטנה:</h3>
            <p>אם נהניתם מהשירות, אשמח אם תוכלו:</p>
            <ul>
                <li>לכתוב ביקורת על העמודים העסקיים שלי</li>
                <li>להמליץ עליי לחברים שמתחתנים בקרוב</li>
            </ul>
        </div>
        
        <div class="signature">
            <p><strong>תיהנו מהזיכרונות היקרים האלה!</strong></p>
            <p>עידן <span class="emoji">❤️</span></p>
        </div>
        
        <div class="footer">
            <p>אלבום דיגיטלי מהאורחים | ספיר & עידן | 18.08.2025</p>
        </div>
    </div>
</body>
</html>`;

    archive.append(Buffer.from(htmlMessage, 'utf8'), { name: 'ברכות-אישיות-מעידן.html' });

    // Finalize the archive
    archive.finalize();

    console.log(`📦 ZIP ready for download (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);

    // Update the response headers with actual file counts
    const finalResponse = new Response(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Wedding-Album-Sapir-Idan-20-10-2025.zip"`,
        'Cache-Control': 'no-cache',
        'X-Total-Files-Listed': allMediaItems.length.toString(),
        'X-Valid-Files-Processed': validMediaItems.length.toString(),
        'X-Files-Added-To-ZIP': successfullyAddedFiles.toString(),
        'X-Archive-Size-Bytes': archive.pointer().toString(),
      },
    });

    // Cache the ZIP file
    // The ZIP buffer is now in the 'archive' object, which is finalized.
    // We can't directly get the buffer from 'archive' here as it's already finalized.
    // The caching logic needs to be re-evaluated if we want to cache the final ZIP.
    // For now, we'll just return the response with the stream.
    console.log(`✅ ZIP finalized and stream ready for download.`);

    return finalResponse;

  } catch (error) {
    console.error('Download all error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
