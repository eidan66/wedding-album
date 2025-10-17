"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { WeddingMedia } from '@/Entities/WeddingMedia';
import { logger } from '@/lib/logger';

export default function DownloadPage() {
  const [accessCode, setAccessCode] = useState('');
  const [showDownloadSection, setShowDownloadSection] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  const [actualDownloadedFiles, setActualDownloadedFiles] = useState(0);
  const [error, setError] = useState('');
  const [hasDownloadedOnce, setHasDownloadedOnce] = useState(false);
  const [isLoadingFileCount, setIsLoadingFileCount] = useState(false);

  // Log page load
  useEffect(() => {
    logger.info('Download page loaded', {
      component: 'DownloadPage',
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Check if enough time has passed since the wedding (25 hours)
  useEffect(() => {
    const weddingDate = new Date('2025-10-20T20:00:00+03:00');
    const downloadDate = new Date(weddingDate.getTime() + (25 * 60 * 60 * 1000));
    const now = new Date();

    if (now < downloadDate) {
      logger.info('Download page accessed too early - redirecting to gallery', {
        component: 'DownloadPage',
        weddingDate: weddingDate.toISOString(),
        downloadDate: downloadDate.toISOString(),
        currentTime: now.toISOString(),
      });
      // Redirect to gallery if not enough time has passed
      window.location.href = '/gallery';
    }
  }, []);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logger.userAction('Download access code submitted', {
      component: 'DownloadPage',
      hasAccessCode: !!accessCode.trim(),
    });
    
    // Client-side validation
    if (!accessCode.trim()) {
      setError('אנא הזינו קוד גישה');
      logger.warn('Download access code validation failed - empty code', {
        component: 'DownloadPage',
      });
      return;
    }
    
    // Clear previous errors
    setError('');
    
    try {
      logger.apiRequest('POST', '/api/download/verify', {
        component: 'DownloadPage',
        accessCodeLength: accessCode.length,
      });
      
      // Verify access code server-side
      const response = await fetch('/api/download/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });

      if (response.ok) {
        setShowDownloadSection(true);
        setError('');
        
        // Get file count immediately after successful verification
        await fetchFileCount();
      } else {
        const errorData = await response.json();
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          const remainingTime = errorData.remainingTime || 0;
          const attempts = errorData.attempts || 0;
          
          if (remainingTime > 60000) { // More than 1 minute
            const minutes = Math.ceil(remainingTime / 60000);
            setError(`יותר מדי ניסיונות כושלים (${attempts}/5). אנא המתן ${minutes} דקות לפני ניסיון נוסף.`);
          } else {
            const seconds = Math.ceil(remainingTime / 1000);
            setError(`יותר מדי ניסיונות כושלים (${attempts}/5). אנא המתן ${seconds} שניות לפני ניסיון נוסף.`);
          }
        } else {
          setError(errorData.error || 'קוד גישה שגוי. אנא נסה שוב.');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('שגיאה בבדיקת הקוד. אנא נסה שוב.');
    }
  };

  const fetchFileCount = async () => {
    try {
      setIsLoadingFileCount(true);
      const mediaData = await WeddingMedia.list("-created_date", 1, 1000); // Get all files
      const files = mediaData.items || [];
      setTotalFiles(files.length);
    } catch (error) {
      console.error('Error fetching file count:', error);
      setError('שגיאה בקבלת כמות הקבצים');
    } finally {
      setIsLoadingFileCount(false);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setError('');
    setActualDownloadedFiles(0); // Reset actual count for new download
    
    try {
      // First, get the list of files to show progress
      const mediaData = await WeddingMedia.list("-created_date", 1, 1000); // Get all files
      const files = mediaData.items || [];
      setTotalFiles(files.length);
      
      // Start the actual download
      const downloadResponse = await fetch('/api/download/all', {
        method: 'POST'
      });
      
      if (downloadResponse.ok) {
        // Get the response headers to check if we have file count info
        // Note: We'll use custom headers to get file count information
        
        // Try to get actual file count from response if available
        try {
          // Read custom headers with file count information
          const filesAddedToZip = downloadResponse.headers.get('X-Files-Added-To-ZIP');
          
          if (filesAddedToZip) {
            const actualCount = parseInt(filesAddedToZip);
            setActualDownloadedFiles(actualCount);
            
            // Show warning if there's a discrepancy
            if (actualCount !== files.length) {
              console.warn(`⚠️ File count discrepancy: Expected ${files.length}, got ${actualCount}`);
            }
          } else {
            setActualDownloadedFiles(files.length);
          }
        } catch {
          setActualDownloadedFiles(files.length);
        }
        
        // If this is not the first download, skip progress simulation
        if (!hasDownloadedOnce) {
          // Simulate progress updates while downloading
          const progressInterval = setInterval(() => {
            setCompletedFiles(prev => {
              const newCount = Math.min(prev + Math.floor(Math.random() * 5) + 1, files.length);
              return newCount;
            });
          }, 300);
          
          // Wait a bit to show some progress
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Clear progress interval
          clearInterval(progressInterval);
        }
        
        // Mark all as completed
        setCompletedFiles(files.length);
        
        // Mark that we've downloaded once
        setHasDownloadedOnce(true);
        
        // Automatically trigger download
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Wedding-Album-Sapir-Idan-20-10-2025.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Reset progress indicator after a short delay
        setTimeout(() => {
          setCompletedFiles(0);
        }, 2000);
        
        // Show success message
        setTimeout(() => {
          // The download should have started by now
        }, 1000);
      } else {
        const errorData = await downloadResponse.json();
        setError(errorData.error || 'שגיאה בהורדה');
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('שגיאה בהורדה. אנא נסה שוב.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-gold-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 px-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-700 via-gold-400 to-emerald-600 bg-clip-text text-transparent mb-3 sm:mb-4">
              הורדת הזיכרונות שלנו
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              כאן תוכלו להוריד את כל התמונות והסרטונים מהחתונה שלנו באיכות הגבוהה ביותר
            </p>
          </div>

          {/* Access Code Section */}
          {!showDownloadSection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-8 border border-gold-200 dark:border-slate-600"
            >
              <div className="text-center mb-6">
                <Lock className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-emerald-700 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  קוד גישה נדרש
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 px-2">
                  אנא הזינו את הקוד שקיבלתם כדי לגשת להורדה
                </p>
                
                {/* Disclaimer */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-6 mx-2">
                  <div className="text-right" dir="rtl">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      💡 רק הזוג יכול להוריד את כל התמונות. אורחים יכולים להוריד תמונות בודדות דרך הגלריה.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCodeSubmit} className="max-w-sm mx-auto px-4">
                <div className="mb-4">
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="הזינו קוד גישה"
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-center text-base sm:text-lg font-mono border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!accessCode.trim()}
                  className={`w-full py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 ${
                    !accessCode.trim()
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white hover:scale-105'
                  }`}
                >
                  כניסה להורדה
                </button>
              </form>

              {/* Error Message - Always shown below the form */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-center"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* WhatsApp Contact Section - Only shown on code entry screen */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-600">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    לא קיבלתם קוד גישה או איבדתם אותו?
                  </p>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const weddingDate = '20-10-2025';
                      const coupleNames = 'ספיר & עידן';
                      const accessTime = now.toLocaleString('he-IL', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      const message = `שלום עידן!

אני פונה אליך לגבי גישה לתמונות החתונה שלנו.

*פרטי הזוג:* ${coupleNames}
*תאריך החתונה:* ${weddingDate}
*זמן ניסיון הגישה:* ${accessTime}

*הסיבה:* אני צריך קוד גישה להורדת התמונות והסרטונים מהחתונה שלנו.

תודה מראש!`;

                      const encodedMessage = encodeURIComponent(message);
                      const whatsappUrl = `https://wa.me/9720505877179?text=${encodedMessage}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    פנייה לווטסאפ
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    שלחו הודעה מוכנה עם כל הפרטים הנדרשים
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Download Section */}
          <AnimatePresence>
            {showDownloadSection && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-gold-200 dark:border-slate-600"
              >
                <div className="text-center mb-6 sm:mb-8">
                  <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-emerald-500 mx-auto mb-3 sm:mb-4" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    גישה אושרה!
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
                    אתם מוכנים להוריד את כל הזיכרונות שלנו
                  </p>
                </div>

                {/* Download Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-2">
                  <div className="text-center p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-600">
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                      {isLoadingFileCount ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                          <span className="text-base sm:text-lg">טוען...</span>
                        </div>
                      ) : (
                        totalFiles
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-300">
                      {isLoadingFileCount ? 'בודק קבצים...' : 'קבצים זמינים'}
                    </div>
                  </div>
                  
                  {actualDownloadedFiles > 0 && actualDownloadedFiles !== totalFiles && (
                    <div className="text-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-600">
                      <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-300">
                        {actualDownloadedFiles}
                      </div>
                      <div className="text-xs sm:text-sm text-amber-600 dark:text-amber-300">
                        קבצים בפועל ב-ZIP
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 sm:mt-4 mb-3 sm:mb-4 text-center px-2">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    💡 <strong>חשוב:</strong> ייתכן וההורדה תקח מעט זמן, תלוי בכמות התמונות והסרטונים שהאורחים העלו. ההמלצה להוריד מהמחשב
                  </p>
                </div>
                {/* Download Button */}
                <div className="text-center px-2">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading || isLoadingFileCount}
                    className={`px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 flex items-center gap-2 sm:gap-3 mx-auto ${
                      isDownloading || isLoadingFileCount
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 hover:scale-105'
                    } text-white shadow-lg`}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        מוריד...
                      </>
                    ) : hasDownloadedOnce ? (
                      <>
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        הורד שוב
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        התחל הורדה
                      </>
                    )}
                  </button>
                                    
                  {isDownloading && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3">
                      ההורדה תתחיל בקרוב. אנא אל תסגרו את הדף.
                    </p>
                  )}
                </div>

                {/* Main Progress Bar */}
                {isDownloading && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        התקדמות ההורדה
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{completedFiles} מתוך {totalFiles} קבצים</span>
                      <span>ההורדה פעילה...</span>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {!isDownloading && completedFiles > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 text-center"
                  >
                    <div className="inline-flex items-center gap-3 px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-600 rounded-lg">
                      <div className="text-left">
                        <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-center">
                          הורדה הושלמה בהצלחה!
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 text-sm text-center">
                          הקובץ יורד למחשב שלכם
                        </p>
                        {actualDownloadedFiles > 0 && actualDownloadedFiles !== totalFiles && (
                          <p className="text-amber-600 dark:text-amber-400 text-sm text-center mt-2">
                            📁 הקובץ מכיל {actualDownloadedFiles} קבצים מתוך {totalFiles} שהוצגו
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}


                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-center mt-4"
                  >
                    {error}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
