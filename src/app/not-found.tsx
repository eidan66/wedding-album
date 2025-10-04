import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen wedding-gradient flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            הדף לא נמצא
          </h2>
          <p className="text-gray-600 mb-8">
            נראה שהדף שחיפשת לא קיים. אולי הוא הועבר או נמחק.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/gallery"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            חזרה לגלריה
          </Link>
          
          <div className="text-sm text-gray-500">
            או{' '}
            <Link href="/upload" className="text-emerald-600 hover:text-emerald-700 underline">
              שתפו זיכרון חדש
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
