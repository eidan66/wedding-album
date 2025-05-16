import React from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';

interface GenericModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const GenericModal: React.FC<GenericModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <Backdrop>
      <ModalContent>
        <CloseButton onClick={onClose}>×</CloseButton>
        {children}
      </ModalContent>
    </Backdrop>,
    document.getElementById('modal-root')!
  );
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
direction: rtl;
  background: ${({ theme }) => theme.colors.modalBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  padding: 2rem 1rem;
  width: 90%;
  max-width: 420px;
  min-height: 250px;
  max-height: 90vh;
  overflow-y: auto;
  text-align: center;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 24px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.buttonText};
  cursor: pointer;
`;
