"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const confettiColors = [
  '#FFD700', // Gold
  '#FF69B4', // Pink
  '#87CEEB', // Sky Blue
  '#98FB98', // Pale Green
  '#DDA0DD', // Plum
  '#F0E68C', // Khaki
  '#FFA07A', // Light Salmon
  '#B0E0E6', // Powder Blue
];

export const WeddingDateConfetti: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Confetti pieces positioned around the date */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: confettiColors[i % confettiColors.length],
            left: `${10 + (i * 12)}%`,
            top: `${20 + (i % 2) * 30}%`,
            zIndex: 1000,
          }}
          initial={{ 
            opacity: 0, 
            scale: 0,
            y: -20,
            rotate: 0 
          }}
          animate={{ 
            opacity: [0, 0.6, 0.6, 0],
            scale: [0, 1, 1, 0],
            y: [-20, 0, 10, 20],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            delay: i * 0.2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Sparkles around the date */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full"
          style={{
            left: `${5 + (i * 15)}%`,
            top: `${15 + (i % 2) * 25}%`,
            zIndex: 1001,
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}
    </div>
  );
};
