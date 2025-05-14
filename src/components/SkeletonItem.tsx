import React from 'react';
import styled, { keyframes, useTheme } from 'styled-components';

export const SkeletonItem: React.FC = () => {
  const theme = useTheme();

  return <Skeleton $baseColor={theme.colors.button} $highlightColor={theme.colors.border} />;
};

const shimmer = keyframes`
  0% {
    background-position: 400px 0;
  }
  100% {
    background-position: -400px 0;
  }
`;

const Skeleton = styled.div<{
  $baseColor: string;
  $highlightColor: string;
}>`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    ${({ $baseColor }) => $baseColor} 25%,
    ${({ $highlightColor }) => $highlightColor} 50%,
    ${({ $baseColor }) => $baseColor} 75%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.2s infinite linear;
`;