import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PhotoItem } from './PhotoItem';
import { SkeletonItem } from './SkeletonItem';
import { usePhotos } from '../hooks/usePhotos';

export const PhotoGrid: React.FC = () => {
  const { photos, loadMore, loading } = usePhotos();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPhotoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) {
        loadMore();
      }
    });
    if (lastPhotoRef.current) {
      observer.current.observe(lastPhotoRef.current);
    }
  }, [photos, loadMore, loading]);

  return (
    <Grid>
      {photos.map((url, index) => (
        <PhotoItem
          key={index}
          src={url}
          ref={index === photos.length - 1 ? lastPhotoRef : null}
        />
      ))}
      {loading &&
        [...Array(6)].map((_, i) => <SkeletonItem key={`skeleton-${i}`} />)}
    </Grid>
  );
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 16px;
`;