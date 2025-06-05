import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Heart } from "lucide-react";
import { motion } from "framer-motion";

import UploadZone from "../components/upload/UploadZone";
import UploadPreview from "../components/upload/UploadPreview";
import SuccessAnimation from "../components/upload/SuccessAnimation";
import { useBulkUploader } from "../hooks/useBulkUploader";

export const Upload = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploads, uploadFiles, cancelUploads, initializeUploads } = useBulkUploader();

  const isUploading = uploads.some(upload => upload.status === 'uploading' || upload.status === 'pending');
  const isUploadComplete = uploads.length > 0 && uploads.every(upload => upload.status !== 'pending' && upload.status !== 'uploading' && upload.status !== 'error');
  const hasUploadErrors = uploads.some(upload => upload.status === 'error');

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });
    
    setSelectedFiles(validFiles);
    initializeUploads(validFiles);
    cancelUploads();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    
    await uploadFiles(selectedFiles, uploaderName, caption);
  };

  useEffect(() => {
    if (isUploadComplete && !hasUploadErrors) {
      setShowSuccess(true);

      setTimeout(() => {
        setSelectedFiles([]);
        setUploaderName("");
        setCaption("");
        setShowSuccess(false);
      }, 2500);
    } else if (hasUploadErrors) {
      console.error("Bulk upload finished with errors.", uploads.filter(u => u.status === 'error'));
    }

    if (uploads.length === 0 && selectedFiles.length > 0 && !isUploading) {
      setSelectedFiles([]);
    }
  }, [isUploadComplete, hasUploadErrors, uploads.length]);

  useEffect(() => {
    if(uploads.length === 0 && selectedFiles.length > 0 && !isUploading) {
      setSelectedFiles([]);
      setUploaderName("");
      setCaption("");
    }
  }, [uploads.length]);

  return (
    <div className="min-h-screen wedding-gradient">
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Gallery"))}
            className="hover:bg-gold-100 transition-colors duration-300"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-emerald-700 from-emerald-700 to-gold-400 bg-clip-text">
              שתפו את הזיכרון שלכם
            </h1>
            <p className="text-gray-600 mt-1">
              עזרו לנו לתפוס כל רגע יפה מהיום המיוחד הזה
            </p>
          </div>
        </motion.div>

        {showSuccess ? (
          <SuccessAnimation />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Upload Zone */}
            <div className="glass-effect rounded-3xl p-8 border border-gold-200">
              <UploadZone
                onFileSelect={handleFileSelect}
                selectedFiles={selectedFiles}
                fileInputRef={fileInputRef}
              />
            </div>

            {/* File Preview */}
            {uploads.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-3xl p-6 border border-gold-200"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-600" />
                  קבצים שנבחרו ({uploads.length})
                </h3>
                <UploadPreview 
                  uploads={uploads}
                  onRemove={removeFile}
                />
              </motion.div>
            )}

            {/* Details Form */}
            {uploads.length > 0 && !isUploadComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-3xl p-8 border border-gold-200 space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  הוסיפו פרטים
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      השם שלכם (אופציונלי)
                    </label>
                    <Input
                      value={uploaderName}
                      onChange={(e) => setUploaderName(e.target.value)}
                      placeholder="בואו נדע מי משתף את הזיכרון הזה"
                      className="border-gold-200 focus:border-emerald-400 focus:ring-emerald-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      תיאור (אופציונלי)
                    </label>
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="שתפו מה הופך את הרגע הזה למיוחד..."
                      className="border-gold-200 focus:border-emerald-400 focus:ring-emerald-200 h-24"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={isUploading || uploads.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      מעלה את הזיכרון שלכם...
                    </div>
                  ) : (
                    `שתפו ${uploads.length} ${uploads.length === 1 ? 'זיכרון' : 'זכרונות'}`
                  )}
                </Button>

                {isUploading && (
                   <Button
                      onClick={cancelUploads}
                      variant="outline"
                      className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-300"
                   >
                      בטל העלאות
                   </Button>
                )}

              </motion.div>
            )}

            {hasUploadErrors && (
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                   className="glass-effect rounded-3xl p-6 border border-red-400 bg-red-50 text-red-800 space-y-2"
               >
                   <h3 className="text-lg font-semibold">שגיאות בהעלאה</h3>
                   {uploads.filter(u => u.status === 'error').map((upload, index) => (
                      <p key={index} className="text-sm">{upload.file.name}: {upload.error || 'שגיאה לא ידועה'}</p>
                   ))}
                   <Button
                       onClick={() => {
                          cancelUploads();
                          setSelectedFiles([]);
                          setUploaderName("");
                          setCaption("");
                       }}
                       variant="ghost"
                       className="text-red-800 hover:bg-red-100"
                   >
                       נקה שגיאות
                   </Button>
               </motion.div>
            )}

          </motion.div>
        )}
      </div>
    </div>
  );
}