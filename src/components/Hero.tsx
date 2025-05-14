import styled from 'styled-components';
import heroImage from '../assets/idan-sapir-hero.jpg';
import bgImage from '../assets/idan_sapir_bg.jpeg'

import RingsIcon from '../assets/svg/wedding-rings.svg';
import { useState, useTransition } from 'react';
import { ConfirmUploadModal } from './Modal';
import type { SupportedFileType } from '../types/upload';
import { useBulkUploader } from '../hooks/useBulkUploader';
import { AnimatedHeart } from './AnimatedHeart';

const Wrapper = styled.div`
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Background = styled.div`
  height: 50vh;
  width: 100vw;
  background-image: url(${bgImage});
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: start;
  justify-content: center;
  filter: blur(3px) drop-shadow(0px 26px 25px #A8C3A4);
  z-index: 1;
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  margin-top: -290px;
`;

const HeroPhoto = styled.img`
  width: 170px;
  height: 170px;
  border-radius: 50%;
  border: 4px solid ${({ theme }) => theme.colors.button};
  object-fit: cover;
  margin-bottom: 1rem;
`;

const HeaderWrapper = styled.div`
  margin-top: -2rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`

const Title = styled.div`
display: flex;
flex-direction:row;
`

const Name = styled.h1`
  font-size: 42px;
  color: ${({ theme }) => theme.colors.primaryText};
  margin: 0 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 8px;
  font-family: 'SuezOne', Inter, sans-serif;

`;

const Description =styled.h2`
color: ${({theme})=>theme.colors.secondaryText};
font-size: 18px;
margin:0;
`

const HiddenInput = styled.input`
  display: none;
`;

const ShareButton = styled.label`
  background: ${({ theme }) => theme.colors.button};
  border: 1px solid ${({ theme }) => theme.colors.button};
  width: 200px;
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  border-radius: 8px;
  cursor: pointer;
`;

const ButtonText = styled.span`
  line-height: 22px;
  color: ${({ theme }) => theme.colors.buttonText};
  font-size: 24px;
`;


const WeddingRings = styled.img``

const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',      
  'image/avif',      
  'video/mp4',
  'video/mov',
  'video/quicktime',
  'video/webm',
  'video/hevc',
  'video/3gpp',      
  'video/x-matroska' 
];

export const Hero = () => {
  const [inputKey, setInputKey] = useState(Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const [isPending, startTransition] = useTransition();

  const { cancelUploads, uploadFiles } = useBulkUploader();

  const mergeUniqueFiles = (existing: File[], incoming: File[]) => {
    const existingNames = new Set(existing.map(f => f.name + f.size + f.lastModified));
    return [...existing, ...incoming.filter(f => !existingNames.has(f.name + f.size + f.lastModified))];
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputKey(Date.now()); 

    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file =>
        SUPPORTED_FILE_TYPES.includes(file.type as SupportedFileType)
      );
  
      if (validFiles.length !== fileArray.length) {
        alert('חלק מהקבצים אינם נתמכים...');
      }
  
      if (validFiles.length > 0) {
        setMediaFiles(prev => mergeUniqueFiles(prev, validFiles));
        setTimeout(() => {
          startTransition(() => {
            setIsModalOpen(true);
          });
        }, 100);
      }
    }
  };
  
  const handleClick = () => {
    setInputKey(Date.now());
  };

  const cancelUpload = () => {
    cancelUploads()
    setIsModalOpen(false);
    setMediaFiles([]);
  };

  const confirmUpload = () => {
    setMediaFiles([]);
    setIsModalOpen(false);
  };

  return (
    <Wrapper>
      <Background/>
      <HeroContent>
        <HeroPhoto src={heroImage} alt="ספיר&ועידן" />
        <HeaderWrapper>
          <Title>
            <Name>ספיר</Name>
            <WeddingRings src={RingsIcon} alt="טבעות נישואין" width={60} height={50}/>
            <Name>עידן</Name>
          </Title>
          <Description>יש לכם תמונה מעולה? אל תחזיקו בבטן!</Description>

          <HiddenInput
            key={inputKey}
            id="mediaUpload"
            type="file"
            accept={SUPPORTED_FILE_TYPES.join(',')}
            multiple
            onChange={handleUpload}
          />
          
          <ShareButton htmlFor="mediaUpload" onClick={handleClick}>
            <ButtonText>שתפו תמונות</ButtonText>
          </ShareButton>
        </HeaderWrapper>
      </HeroContent>
      {isPending && (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AnimatedHeart />
          <span style={{ marginTop: '1rem', fontSize: '16px', color: '#ccc' }}>
            טוען קבצים להצגה...
          </span>
        </div>
      )}
      {isModalOpen && (
        <ConfirmUploadModal
          mediaFiles={mediaFiles}
          setMediaFiles={setMediaFiles}
          onConfirm={confirmUpload}
          cancelUpload={cancelUpload}
          uploadFiles={uploadFiles}
        />
      )}
    </Wrapper>
  );
};
