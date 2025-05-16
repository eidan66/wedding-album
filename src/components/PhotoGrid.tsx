import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { SkeletonItem } from './SkeletonItem';
import { useAlbum } from '../hooks/useAlbum';
import { EmptyGrid } from './EmptyGrid';
import { MediaPreviewModal } from './PhotoItem';

export const PhotoGrid: React.FC = () => {
  const { items, loadMore, loading, hasMore } = useAlbum();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        loadMore();
      }
    });
    if (lastItemRef.current) {
      observer.current.observe(lastItemRef.current);
    }
  }, [items, loadMore, loading, hasMore]);

  if (!loading && items.length === 0) {
    return <EmptyGrid />;
  }

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <Grid>
        {items.map((item, index) => (
          <Item
            key={item.id}
            ref={index === items.length - 1 ? lastItemRef : null}
            onClick={() => openPreview(index)}
          >
            {item.type === 'image' ? (
              <StyledImg src={item.url} alt={`תמונה ${index + 1}`} />
            ) : (
              <StyledVideo src={item.url} preload="metadata" muted />
            )}
          </Item>
        ))}
        {loading &&
          [...Array(6)].map((_, i) => <SkeletonItem key={`skeleton-${i}`} />)}
      </Grid>

      {isPreviewOpen && (
        <MediaPreviewModal
          mediaItems={items.map(({ url, type }) => ({ src: url, type }))}
          initialIndex={previewIndex}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 16px;
`;

const Item = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ccc;
  cursor: pointer;
`;

const StyledImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;