"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { useCallback, useMemo, useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDark = theme === 'dark';

  const containerClass = useMemo(
    () => `theme-toggle-fancy select-none`,
    []
  );

  // In dark mode show moon (default). In light mode show sun/day classes
  const tdnnClass = useMemo(
    () => `tdnn ${!isDark ? 'day' : ''}`,
    [isDark]
  );

  const moonClass = useMemo(
    () => `moon ${!isDark ? 'sun' : ''}`,
    [isDark]
  );

  const onClick = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="theme-toggle-fancy" style={{ fontSize: '10%' }} />;
  }

  return (
    <div
      className={containerClass}
      style={{ fontSize: '10%' }}
      onClick={onClick}
      role="button"
      aria-label="Toggle theme"
    >
      <div className={tdnnClass}>
        <div className={moonClass} />
      </div>
    </div>
  );
}
