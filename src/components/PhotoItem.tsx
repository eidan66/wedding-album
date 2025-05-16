import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { createPortal } from 'react-dom';

interface MediaPreviewModalProps {
  mediaItems: { src: string; type: 'image' | 'video'; alt?: string }[];
  initialIndex: number;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  mediaItems,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  },[mediaItems.length]);

  const handleNext =useCallback( () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  },[mediaItems.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    },
    [handleNext, handlePrev, onClose]
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'media-preview-backdrop') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const media = mediaItems[currentIndex];

  return createPortal(
    <Backdrop id="media-preview-backdrop" onClick={handleBackdropClick}>
      <ModalContainer>
        <CloseButton onClick={onClose} aria-label="סגור תצוגה">×</CloseButton>

        {media.type === 'image' ? (
          <StyledImage src={media.src} alt={media.alt || 'תמונה מוגדלת'} />
        ) : (
          <StyledVideo
            src={media.src}
            controls
            autoPlay
            playsInline
            muted={false}
            controlsList="nodownload"
            aria-label={media.alt || 'סרטון מוגדל'}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {mediaItems.length > 1 && (
          <>
            <NavButtonLeft onClick={handlePrev} aria-label="הקודם">←</NavButtonLeft>
            <NavButtonRight onClick={handleNext} aria-label="הבא">→</NavButtonRight>
          </>
        )}
      </ModalContainer>
    </Backdrop>,
    document.getElementById('modal-root')!
  );
};

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContainer = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  animation: ${fadeIn} 0.3s ease-out;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0px;
  right: 0px;
  border: none;
  background: transparent;
  color: white;
  font-size: 24px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  z-index: 10;
`;

const StyledImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  display: block;
  object-fit: contain;
`;

const StyledVideo = styled.video`
  max-width: 100%;
  max-height: 100%;
  display: block;
  object-fit: contain;
  background: black;
  outline: none;
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 36px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  cursor: pointer;
  z-index: 5;
  padding: 0.5rem 1rem;
  border-radius: 8px;
`;

const NavButtonLeft = styled(NavButton)`
  left: 10px;
`;

const NavButtonRight = styled(NavButton)`
  right: 10px;
`;