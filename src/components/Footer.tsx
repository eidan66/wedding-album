import React from 'react';

export const Footer: React.FC = () => (
  <footer className="text-center py-4 text-lg text-gray-600 mt-8">
    האתר נבנה באהבה על ידי{' '}
    <a
      href="https://idanlevian.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-emerald-600 font-bold no-underline hover:text-emerald-700 transition-colors"
    >
      עידן לויאן
    </a>
    <br />
    © 2025 כל הזכויות שמורות.
  </footer>
);