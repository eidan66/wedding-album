import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { AnimatedHeart } from './AnimatedHeart';

interface ConfirmUploadModalProps {
  mediaFiles: File[];
  onConfirm: () => void;
  onCancel: () => void;
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export const ConfirmUploadModal: React.FC<ConfirmUploadModalProps> = ({
  mediaFiles,
  onConfirm,
  onCancel,
  setMediaFiles,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const handleRemove = (indexToRemove: number) => {
    const updated = mediaFiles.filter((_, i) => i !== indexToRemove);
    setMediaFiles(updated);
  };

  return (
    <ModalBackdrop>
      <ModalContent>
        <Title>להוסיף את הרגעים האלה לאלבום שלנו?</Title>
       {isLoading? (
        <LoaderWrapper>
        <AnimatedHeart />
        <LoadingText>מעלה את הקבצים לאלבום...</LoadingText>
      </LoaderWrapper>
       ):(<> <PreviewGrid>
          {mediaFiles.map((file, index) => {
            const previewUrl = URL.createObjectURL(file);
            const isImage = file.type.startsWith('image');
            return (
              <PreviewItem key={index}>
                <RemoveButton onClick={() => handleRemove(index)}>×</RemoveButton>
                {isImage ? (
                  <img src={previewUrl} alt={`preview-${index}`} />
                ) : (
                  <video src={previewUrl} controls muted playsInline preload="metadata" />
                )}
              </PreviewItem>
            );
          })}
        </PreviewGrid>
          <ModalActions>
            <ModalButton onClick={() => {
              setIsLoading(true);
              onConfirm();
            }}>כן, להעלות 📸</ModalButton>
            <ModalButton onClick={onCancel}>נחכה עם זה</ModalButton>
          </ModalActions></>)}
      </ModalContent>
    </ModalBackdrop>
  );
};

const fadeIn = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.modalBackground};
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  min-height: 25rem;
  text-align: center;
  animation: ${fadeIn} 0.3s ease-out;
  border: 1px solid ${({theme})=>theme.colors.border};
`;

const Title = styled.h3`
  color: ${({ theme }) => theme.colors.primaryText};
  margin-bottom: 3rem;
  font-size: 28px;
`;

const PreviewGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
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
  background: rgba(0, 0, 0, 0.6);
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
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.button};
  color: ${({ theme }) => theme.colors.buttonText};
  font-size: 16px;
  cursor: pointer;
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