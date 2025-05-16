import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AnimatedHeart } from './AnimatedHeart';
import { useAlbum } from '../hooks/useAlbum';

interface ConfirmUploadModalProps {
  mediaFiles: File[];
  onConfirm: () => void;
  cancelUpload: () => void;
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploadFiles: (files: File[]) => Promise<void>;
}

export const ConfirmUploadModal: React.FC<ConfirmUploadModalProps> = ({
  mediaFiles,
  onConfirm,
  setMediaFiles,
  cancelUpload,
  uploadFiles,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { refresh } = useAlbum();

  const confirmUpload = async () => {
    if (isLocked) return;
    setIsLoading(true);
    try {
      await uploadFiles(mediaFiles);
      await refresh();
      onConfirm();
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage((err as Error).message || 'העלאה נכשלה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = mediaFiles.filter((_, i) => i !== indexToRemove);
    setMediaFiles(updated);
  };

  const handleClose = () => {
    cancelUpload();
  };

  useEffect(() => {
    if (mediaFiles.length === 0) {
      setShowEmptyMessage(true);
      setIsLocked(true);

      const timeout = setTimeout(() => {
        setShowEmptyMessage(false);
        cancelUpload();
      }, 3500);

      return () => clearTimeout(timeout);
    }
  }, [mediaFiles, cancelUpload]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <Title>להוסיף את הרגעים האלה לאלבום שלנו?</Title>

      {isLoading ? (
        <LoaderWrapper>
          <AnimatedHeart />
          <LoadingText>מעלה את הקבצים לאלבום...</LoadingText>
        </LoaderWrapper>
      ) : (
        <>
          {showEmptyMessage && (
            <EmptyNotice>😢 אין קבצים להצגה... נחזור להתחלה בעוד רגע</EmptyNotice>
          )}
          <PreviewGrid>
            {mediaFiles.map((file, index) => {
              const previewUrl = URL.createObjectURL(file);
              const isImage = file.type.startsWith('image');
              return (
                <PreviewItem key={index}>
                  <RemoveButton onClick={() => handleRemove(index)}>×</RemoveButton>
                  {isImage ? (
                    <img src={previewUrl} alt={`preview-${index}`} loading="lazy" />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      autoPlay={false}
                      loop={false}
                    />
                  )}
                </PreviewItem>
              );
            })}
          </PreviewGrid>

          <ModalActions>
            <ModalButton onClick={confirmUpload} disabled={isLocked}>
              כן, להעלות 📸
            </ModalButton>
            <ModalButton onClick={handleClose} disabled={isLocked}>
              נחכה עם זה
            </ModalButton>
          </ModalActions>
        </>
      )}

      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </>
  );
};

const Title = styled.h3`
  color: ${({ theme }) => theme.colors.primaryText};
  margin: 0 0 1rem;
  font-size: 28px;
`;

const PreviewGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-height: 45vh;
  overflow-y: auto;
  padding-right: 1rem;
  margin-bottom: 1.5rem;
`;

const PreviewItem = styled.div`
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ddd;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(47, 23, 23, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 16px;
  line-height: 22px;
  text-align: center;
  padding: 0;
  cursor: pointer;
  z-index: 2;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ModalButton = styled.button<{ disabled?: boolean }>`
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.button};
  color: ${({ theme }) => theme.colors.buttonText};
  font-size: 16px;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
`;

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
`;

const LoadingText = styled.span`
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 14px;
  opacity: 0.75;
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 14px;
  margin-top: 1rem;
`;

const EmptyNotice = styled.p`
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 16px;
  text-align: center;
  margin-bottom: 1rem;
`;