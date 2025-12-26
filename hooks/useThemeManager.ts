import { useEffect, useMemo, useState } from 'react';
import { Theme } from '../types';
import { getUserTheme, saveUserTheme } from '../services/storageService';

export const useThemeManager = (themes: Theme[]) => {
  const [currentThemeId, setCurrentThemeId] = useState<string>('theme-default'); // Default fallback

  // Load initial theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await getUserTheme();
        setCurrentThemeId(savedTheme);
      } catch (error) {
        console.warn('Failed to load user theme:', error);
      }
    };

    loadTheme();
  }, []);

  // Apply theme classes and CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Remove previous theme classes
    themes.forEach(t => root.classList.remove(t.id));

    // Add current theme class
    root.classList.add(currentThemeId);

    // Set CSS variables for extended color system
    const theme = themes.find(t => t.id === currentThemeId);
    if (theme) {
      const colors = theme.colors;

      // Set basic theme variables
      root.style.setProperty('--color-brand-primary', colors.brand);
      root.style.setProperty('--color-bg-primary', colors.bg);

      // Set extended theme variables with defaults
      root.style.setProperty('--color-bg-secondary', colors.surface || 'rgba(15, 23, 42, 0.8)');
      root.style.setProperty('--color-bg-tertiary', colors.surface || 'rgba(15, 23, 42, 0.7)');
      root.style.setProperty('--color-bg-accent', colors.surface || 'rgba(15, 23, 42, 0.5)');

      root.style.setProperty('--color-text-primary', colors.text || '#ffffff');
      root.style.setProperty('--color-text-secondary', colors.text || 'rgb(203, 213, 225)');
      root.style.setProperty('--color-text-tertiary', colors.text || 'rgb(148, 163, 184)');
      root.style.setProperty('--color-text-muted', colors.muted || 'rgb(100, 116, 139)');

      root.style.setProperty('--color-border-primary', colors.border || 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--color-border-secondary', colors.border || 'rgba(255, 255, 255, 0.15)');

      root.style.setProperty('--color-brand-secondary', `${colors.brand}26`); // 15% opacity
      root.style.setProperty('--color-brand-border', `${colors.brand}4D`); // 30% opacity
      root.style.setProperty('--color-brand-hover', `${colors.brand}3F`); // 25% opacity
    }

    const saveTheme = async () => {
      try {
        await saveUserTheme(currentThemeId);
      } catch (error) {
        console.warn('Failed to save user theme:', error);
      }
    };

    saveTheme();
  }, [currentThemeId, themes]);

  const currentThemeObj = useMemo(
    () => themes.find(t => t.id === currentThemeId) || themes[0],
    [currentThemeId, themes]
  );

  return { currentThemeId, setCurrentThemeId, currentThemeObj };
};


