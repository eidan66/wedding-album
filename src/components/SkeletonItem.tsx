import React from 'react';
import styled, { keyframes } from 'styled-components';

export const SkeletonItem: React.FC = () => {
  return <Skeleton />;
};

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
`;

const Skeleton = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    #e0e0e0 25%,
    #f5f5f5 50%,
    #e0e0e0 75%
  );
  background-size: 400% 100%;
  animation: ${shimmer} 1.2s infinite;
`;
