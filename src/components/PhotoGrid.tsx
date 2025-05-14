import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PhotoItem } from './PhotoItem';
import { SkeletonItem } from './SkeletonItem';
import { useAlbum } from '../hooks/useAlbum';
import { EmptyGrid } from './EmptyGrid';


export const PhotoGrid: React.FC = () => {
  const { items, loadMore, loading, hasMore } = useAlbum();

  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

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
    return (
     <EmptyGrid/>
    );
  }


  return (
    <Grid>
      {items.map((item, index) => (
        <PhotoItem
          key={item.id}
          src={item.url}
          type={item.type}
          ref={index === items.length - 1 ? lastItemRef : null}
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
