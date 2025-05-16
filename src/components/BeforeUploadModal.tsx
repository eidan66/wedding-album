import React from 'react';
import styled from 'styled-components';

interface BeforeUploadModalProps {
    onContinue: () => Promise<void>
}

export const BeforeUploadModal: React.FC<BeforeUploadModalProps> = ({ onContinue }) => {
  return(
    <>
        <Message>וואו! הולך להיות פה רגע היסטורי 🎉</Message>
        <SubMessage><span style={{fontSize:22}}>שימו לב!</span> ניתן להעלות עד <strong style={{fontSize:22}}>10</strong> קבצים כל פעם.</SubMessage>
        <ActionButton onClick={onContinue}>יאללה, בחרו תמונות</ActionButton>
    </>
  );
};

const Message = styled.h3`
  color: ${({ theme }) => theme.colors.primaryText};
  font-size: 22px;
  margin: 0.5rem 0;
`;

const SubMessage = styled.p`
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 14px;
  padding-top: 1rem;
  margin-bottom: 2rem;
`;

const ActionButton = styled.button`
  background-color: ${({ theme }) => theme.colors.button};
  color: ${({ theme }) => theme.colors.buttonText};
  font-size: 18px;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
`