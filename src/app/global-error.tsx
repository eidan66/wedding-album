"use client";

import * as Sentry from "@sentry/nextjs";
// import NextError from "next/error"; // Not needed anymore
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">שגיאה</h1>
        <p className="text-gray-600 mb-4">אירעה שגיאה לא צפויה</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          רענן את הדף
        </button>
      </div>
    </div>
  );
}