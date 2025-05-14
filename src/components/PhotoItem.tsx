import { forwardRef } from 'react';
import styled from 'styled-components';

interface PhotoItemProps {
  src: string;
  type: 'image' | 'video';
}

export const PhotoItem = forwardRef<HTMLDivElement, PhotoItemProps>(({ src, type }, ref) => {
  return (
    <Wrapper ref={ref}>
      {type === 'video' ? (
        <StyledVideo src={src} controls muted playsInline />
      ) : (
        <StyledImage src={src} alt="photo" loading="lazy" />
      )}
    </Wrapper>
  );
});

const Wrapper = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ccc;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

PhotoItem.displayName = 'PhotoItem';