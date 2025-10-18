"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { logger } from "@/lib/logger";

import UploadZone from "../../components/upload/UploadZone";
import UploadPreview from "../../components/upload/UploadPreview";
import SuccessAnimation from "../../components/upload/SuccessAnimation";
import UploadProgressIndicator from "../../components/upload/UploadProgressIndicator";
import UploadErrorMessage from "../../components/upload/UploadErrorMessage";
import { useBulkUploader } from "../../hooks/useBulkUploader";
import { useToast } from "@/components/ui/toast";
import type { ErrorReport } from "@/utils/errorLogger";

export default function UploadPage() {
  const navigate = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState("");
  const [caption, setCaption] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);
  const [errorReport, setErrorReport] = useState<ErrorReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);

  const { uploads, uploadFiles, retryUpload, isUploading } = useBulkUploader();
  const { show: showToast } = useToast();

  // Log page load
  useEffect(() => {
    logger.info('Upload page loaded', {
      component: 'UploadPage',
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    
    logger.userAction('Files selected for upload', {
      component: 'UploadPage',
      totalFiles: files.length,
      validFiles: validFiles.length,
      fileTypes: validFiles.map(f => f.type),
      fileSizes: validFiles.map(f => f.size),
    });
    
    // Check if adding these files would exceed the limit - COMMENTED OUT FOR UNLIMITED FILES
    // const currentCount = selectedFiles.length;
    // const newCount = currentCount + validFiles.length;
    
    // if (newCount > 10) {
    //   // Only add files up to the limit
    //   const remainingSlots = 10 - currentCount;
    //   const filesToAdd = validFiles.slice(0, remainingSlots);
    //   setSelectedFiles(prev => [...prev, ...filesToAdd]);
      
    //   // Show warning if some files were not added
    //   if (validFiles.length > remainingSlots) {
    //     showToast(`ניתן להעלות עד 10 קבצים בכל פעם. נוספו ${remainingSlots} קבצים מתוך ${validFiles.length}`, 'info');
    //   }
    // } else {
    //   setSelectedFiles(prev => [...prev, ...validFiles]);
    // }
    
    // Add all files without limit
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Auto-scroll to the selected items section when files are added
  useEffect(() => {
    if (selectedFiles.length > 0) {
      firstItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedFiles.length]);



  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    await uploadFiles(selectedFiles, uploaderName, caption);
  };

  useEffect(() => {
    // Only run this effect if we have uploads and we're not already showing success
    if (uploads.length === 0 || hasShownSuccessToast) return;

    const allUploadsSuccessful = uploads.every(upload => upload.status === 'success');
    const anyUploadFailed = uploads.some(upload => upload.status === 'error');

    if (allUploadsSuccessful) {
      setHasShownSuccessToast(true);
      setErrorReport(null); // Clear any previous errors
      showToast('העלאה הושלמה! 🎉', 'success');
      setShowSuccess(true);
      setTimeout(async () => {
        setSelectedFiles([]);
        setUploaderName("");
        setCaption("");
        setShowSuccess(false);
        setHasShownSuccessToast(false);
        
        // CRITICAL: Invalidate cache before navigation
        // TanStack Query will automatically refetch fresh data when gallery mounts
        try {
          const { queryClient } = await import('@/providers/QueryProvider');
          const { mediaQueryKeys } = await import('@/hooks/useMediaQueries');
          await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
          logger.info('Cache invalidated before navigation to gallery');
        } catch (error) {
          logger.warn('Failed to invalidate cache before navigation', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
        
        navigate.push(createPageUrl("Gallery"));
      }, 4500);
    } else if (anyUploadFailed) {
      setHasShownSuccessToast(true);
      showToast('חלק מהקבצים לא הועלו. נסו שוב 🙏', 'error');
      console.error("One or more uploads failed.", uploads.filter(upload => upload.status === 'error'));
      
      // Find the first failed upload with an error report
      const failedUpload = uploads.find(u => u.status === 'error' && u.errorReport);
      if (failedUpload?.errorReport) {
        setErrorReport(failedUpload.errorReport);
      }
    }
  }, [uploads, navigate, showToast, hasShownSuccessToast]);

  return (
    <div className="min-h-screen wedding-gradient">
      <div className="max-w-4xl mx-auto px-2 md:px-4 py-6 pb-24 md:pb-8">
        {showSuccess ? (
          <SuccessAnimation />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="glass-effect rounded-3xl p-8 pt-0 border border-gold-200">
              <UploadZone 
                onFileSelect={handleFileSelect} 
                fileInputRef={fileInputRef}
                // currentFileCount={selectedFiles.length} - COMMENTED OUT FOR UNLIMITED FILES
                // maxFiles={10} - COMMENTED OUT FOR UNLIMITED FILES
              />
            </div>

            {selectedFiles.length > 0 && (
              <motion.div ref={firstItemRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-3xl p-6 border border-gold-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-600" />
                    קבצים שנבחרו
                  </h3>
                  {/* <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {selectedFiles.length}/10
                  </div> */}
                </div>
                <UploadPreview files={selectedFiles} onRemove={removeFile} isUploading={isUploading} />
              </motion.div>
            )}

            {/* Upload Progress Indicator */}
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-3xl p-6 border border-gold-200"
              >
                <UploadProgressIndicator uploads={uploads} isUploading={isUploading} onRetry={retryUpload} />
              </motion.div>
            )}

            {selectedFiles.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-3xl p-8 border border-gold-200 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">הוסיפו פרטים</h3>
                  {/* <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {selectedFiles.length}/10
                  </div> */}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">השם שלכם (אופציונלי)</label>
                    <Input 
                      value={uploaderName} 
                      onChange={(e) => setUploaderName(e.target.value)} 
                      placeholder="בואו נדע מי משתף את הזיכרון הזה" 
                      className="border-gold-200 focus:border-emerald-400 focus:ring-emerald-200" 
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">תיאור (אופציונלי)</label>
                    <Textarea 
                      value={caption} 
                      onChange={(e) => setCaption(e.target.value)} 
                      placeholder="שתפו מה הופך את הרגע הזה למיוחד..." 
                      className="border-gold-200 focus:border-emerald-400 focus:ring-emerald-200 h-24" 
                      disabled={isUploading}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {/* <div className="text-center text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    ניתן להעלות עד 10 קבצים בכל פעם. אם יש לכם יותר קבצים, תוכלו להעלות אותם בחלקים
                  </div> */}
                  
                  <div className="text-center text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    ההעלאה עשויה לקחת זמן, תלוי בקצב האינטרנט וגודל הקבצים. סרטונים לוקחים זמן רב יותר - אנא המתינו בסבלנות
                  </div>
                  
                  <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        מעלה את הזיכרון שלכם...
                      </div>
                    ) : (
                      `שתפו ${selectedFiles.length} ${selectedFiles.length === 1 ? 'זיכרון' : 'זכרונות'}`
                    )}
                  </Button>
                </div>


              </motion.div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Error Message with Log Export */}
      {errorReport && (
        <UploadErrorMessage 
          errorReport={errorReport} 
          onClose={() => setErrorReport(null)}
        />
      )}
    </div>
  );
}