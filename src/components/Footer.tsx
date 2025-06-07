import React from 'react';

export const Footer: React.FC = () => (
  <footer className="wedding-gradient border-t border-gold-200 text-center py-8 text-gray-700">
    <p className="text-sm font-medium">
      האתר נבנה באהבה על ידי{' '}
      <a
        href="https://idanlevian.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-600 font-bold no-underline hover:text-emerald-700 transition-colors"
      >
        עידן לויאן
      </a>
    </p>
    <p className="text-xs text-gray-600 mt-1">
      © 2025 כל הזכויות שמורות.
    </p>
  </footer>
);