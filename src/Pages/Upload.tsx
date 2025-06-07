import React, { useState, useRef } from "react";
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
import { useBulkUploader } from "../hooks/useBulkUploader"; // Import hook and types

export default function Upload() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState("");
  const [caption, setCaption] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploads, uploadFiles } = useBulkUploader(); // Use the hook

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    // Use the uploadFiles function from the hook, passing metadata
    // The hook will manage the upload process and call WeddingMedia.create internally after S3 upload
    await uploadFiles(selectedFiles, uploaderName, caption);
      
    // Success animation and navigation will be triggered by the useEffect based on uploads state
  };

  // Determine if currently uploading based on the hook's state
  const isUploading = uploads.some(upload => upload.status === 'uploading' || upload.status === 'pending'); // Include pending state
  
  // Automatically show success animation and navigate after all uploads are done and successful
  React.useEffect(() => {
    // Determine if all uploads are successful to show success animation
    const allUploadsSuccessful = uploads.length > 0 && uploads.every(upload => upload.status === 'success');
    const anyUploadFailed = uploads.some(upload => upload.status === 'error');

    if (allUploadsSuccessful) {
      setShowSuccess(true);
      setTimeout(() => {
        setSelectedFiles([]);
        setUploaderName(""); // Reset uploader name
        setCaption(""); // Reset caption
        setShowSuccess(false);
        navigate(createPageUrl("Gallery")); // Navigate to gallery after success
      }, 2500);
    }
    // We also need to consider the error state - if any upload fails, don't navigate
    if (anyUploadFailed) {
      // Handle error state if necessary, maybe show a global error message
      console.error("One or more uploads failed.", uploads.filter(upload => upload.status === 'error'));
      // Optionally reset uploads or show a retry option
    }

  }, [uploads, navigate]); // Added uploads to dependencies, removed anyUploadFailed


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
            <h1 className="text-3xl font-bold from-emerald-700 to-gold-400 bg-clip-text text-emerald-700">
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
                fileInputRef={fileInputRef}
              />
            </div>

            {/* File Preview - Use selectedFiles for initial preview, uploads for status/progress if needed in preview items */}
            {selectedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-3xl p-6 border border-gold-200"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-600" />
                  קבצים שנבחרו ({selectedFiles.length})
                </h3>
                {/* Pass selectedFiles to preview component as it expects File objects for previewing */}
                <UploadPreview 
                  files={selectedFiles}
                  onRemove={removeFile}
                  // If UploadPreview needs to show progress/status, it would need to be updated to accept 'uploads' alongside 'files'
                  // or map 'selectedFiles' to the corresponding 'uploads' state within the component.
                />
              </motion.div>
            )}

            {/* Details Form */}
            {selectedFiles.length > 0 && (
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
                  disabled={isUploading || selectedFiles.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      מעלה את הזיכרון שלכם...
                    </div>
                  ) : (
                    `שתפו ${selectedFiles.length} ${selectedFiles.length === 1 ? 'זיכרון' : 'זכרונות'}`
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}