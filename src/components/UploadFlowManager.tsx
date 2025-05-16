import React, { useState } from 'react';
import { GenericModal } from './GenericModal';
import { AnimatedHeart } from './AnimatedHeart';
import { ConfirmUploadModal } from './ConfirmUploadModal';
import styled from 'styled-components';
import { BeforeUploadModal } from './BeforeUploadModal';

interface UploadFlowManagerProps {
  mediaFiles: File[];
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploadFiles: (files: File[]) => Promise<void>;
  cancelUpload: () => void;
  onClose: () => void;
  onConfirm: () => void;
  triggerFilePicker: () => Promise<File[]>;
}

export const UploadFlowManager: React.FC<UploadFlowManagerProps> = ({
  mediaFiles,
  setMediaFiles,
  uploadFiles,
  cancelUpload,
  onClose,
  onConfirm,
  triggerFilePicker,
}) => {
  const [step, setStep] = useState<'intro' | 'loading' | 'preview' | 'error'>('intro');
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

const handleFullClose = () => {
  if (loadingTimeout) clearTimeout(loadingTimeout);
  setStep('intro');
  setErrorMessage(null);
  cancelUpload();
  onClose();
};

  const handleContinue = async () => {
    try {
      const selectedFiles = await triggerFilePicker();
      if (selectedFiles.length === 0) return;

      if (selectedFiles.length > 10) {
        setErrorMessage([
        'אנחנו מקבלים עד 10 קבצים כל פעם.',
        'תבחרו את הרגעים הכי קסומים ותנסו שוב 💫'
        ].join('\n'));        setStep('error');
        return;
      }

      setMediaFiles(selectedFiles);
      setStep('loading');

      const preloadPromises = selectedFiles.map((file) => {
        return new Promise<void>((resolve) => {
          const isImage = file.type.startsWith('image');
          const element = isImage ? new Image() : document.createElement('video');

          element.onload = () => resolve();
          element.onerror = () => resolve();
          if (!isImage) element.onloadeddata = () => resolve();

          const objectUrl = URL.createObjectURL(file);
          element.src = objectUrl;

          setTimeout(() => resolve(), 3000);
        });
      });

      const timeout = setTimeout(() => {
        setStep('preview');
      }, 3000);
      setLoadingTimeout(timeout);

      Promise.all(preloadPromises).then(() => {
        clearTimeout(timeout);
        setStep('preview');
      });
    } catch (err) {
      console.error('File selection canceled or failed', err);
      onClose();
    }
  };

    const handleCancel = () => {
    if (loadingTimeout) clearTimeout(loadingTimeout);
    cancelUpload();
    onClose();
    };

  const handleCloseError = () => {
    setStep('intro');
    setErrorMessage(null);
  };

  if (step === 'intro') {
    return (
      <GenericModal isOpen onClose={handleFullClose}>
        <BeforeUploadModal onContinue={handleContinue}/>
      </GenericModal>
    );
  }

  if (step === 'loading') {
    return (
      <GenericModal isOpen onClose={handleFullClose}>
        <AnimatedHeart />
        <p style={{ marginTop: '1rem', color: '#ccc' }}>
          טוען קבצים... ייתכן וזה ייקח זמן, תלוי במשקל התמונות והסרטונים 💡
        </p>
        <ModalButton style={{ marginTop: '1.5rem' }} onClick={handleCancel}>
          בטלו העלאה
        </ModalButton>
      </GenericModal>
    );
  }

  if (step === 'error' && errorMessage) {
    return (
      <GenericModal isOpen onClose={handleCloseError}>
        <ErrorMessageTitle>וואו! יותר מדי אהבה בבת אחת 💥</ErrorMessageTitle>
        <ErrorMessage style={{ }}>{errorMessage}</ErrorMessage>
        <ModalButton onClick={handleCloseError}>בחירה מחדש</ModalButton>
      </GenericModal>
    );
  }

  if (step === 'preview') {
    return (
    <GenericModal isOpen onClose={handleFullClose}>
      <ConfirmUploadModal
        mediaFiles={mediaFiles}
        setMediaFiles={setMediaFiles}
        uploadFiles={uploadFiles}
        cancelUpload={handleCancel}
        onConfirm={() => {
          onConfirm();
          onClose();
        }}
      />
      </GenericModal>
    );
  }

  return null;
};

const ErrorMessageTitle = styled.h2`
`

const ErrorMessage = styled.p`
    color: ${({ theme }) => theme.colors.secondaryText};
    white-space: pre-line; 
    text-align: center ;
`

const ModalButton = styled.button`
  background-color: ${({ theme }) => theme.colors.button};
  color: ${({ theme }) => theme.colors.buttonText};
  font-size: 18px;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1.5rem;
  min-width:8rem;
`;