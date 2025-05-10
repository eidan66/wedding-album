import { forwardRef } from 'react';
import styled from 'styled-components';

interface PhotoItemProps {
  src: string;
}

export const PhotoItem = forwardRef<HTMLDivElement, PhotoItemProps>(({ src }, ref) => {
  return (
    <Wrapper ref={ref}>
      <StyledImage src={src} alt="photo" loading="lazy" />
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

PhotoItem.displayName = 'PhotoItem';