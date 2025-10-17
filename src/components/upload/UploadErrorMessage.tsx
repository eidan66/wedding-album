"use client";

import React, { useState } from 'react';
import { AlertCircle, Copy, Download, CheckCircle } from 'lucide-react';
import { errorLogger, ErrorReport } from '@/utils/errorLogger';

interface UploadErrorMessageProps {
  errorReport: ErrorReport;
  onClose?: () => void;
}

export default function UploadErrorMessage({ errorReport, onClose }: UploadErrorMessageProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = async () => {
    const success = await errorLogger.copyReportToClipboard(errorReport);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownload = () => {
    errorLogger.downloadReport(errorReport, 'txt');
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-red-500 p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              העלאה נכשלה
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {errorReport.errorMessage}
            </p>
          </div>
        </div>

        {/* File Details (if available) */}
        {errorReport.fileDetails && (
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>קובץ:</strong> {errorReport.fileDetails.name}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>גודל:</strong> {(errorReport.fileDetails.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            💡 לעזרה בפתרון הבעיה, אנא שלחו את הלוגים למפתח דרך WhatsApp
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={copied}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                הועתק!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                העתק לוגים
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloaded}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {downloaded ? (
              <>
                <CheckCircle className="w-4 h-4" />
                הורד!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                הורד קובץ
              </>
            )}
          </button>
        </div>

        {/* WhatsApp Link */}
        <a
          href={`https://wa.me/972505877179?text=${encodeURIComponent(
            `שלום! נתקלתי בבעיה בהעלאת קבצים באלבום החתונה.\nהשגיאה: ${errorReport.errorMessage}\n\nאשלח את הלוגים המלאים בהודעה הבאה.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          📱 פנה למפתח ב-WhatsApp
        </a>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            סגור
          </button>
        )}
      </div>
    </div>
  );
}

