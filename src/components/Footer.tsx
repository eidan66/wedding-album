"use client";

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
    <div className="flex flex-col items-center mt-2 mb-2">
      <a
        href="https://wa.me/972505877179?text=Hi%20Idan%2C%20I%20want%20my%20own%20wedding%20album%20website!"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold shadow transition-colors text-base"
        style={{ direction: 'rtl' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.1 3.2 5.077 4.363.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.617h-.001a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.987c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.876 11.876 0 0 0 5.683 1.447h.005c6.555 0 11.892-5.335 11.895-11.892a11.82 11.82 0 0 0-3.484-8.412"/></svg>
        רוצים אתר כזה? דברו איתי בוואטסאפ!
      </a>
    </div>
    <p className="text-xs text-gray-600 mt-1">
      © 2025 כל הזכויות שמורות.
    </p>
  </footer>
);