import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { storage, CACHE_KEYS } from '@/lib/storage';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  colors: typeof Colors.light;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme() || 'light';
  const [theme, setThemeState] = useState<Theme>('system');
  
  const colorScheme: ColorScheme = theme === 'system' ? systemColorScheme : theme;
  const colors = Colors[colorScheme];

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const savedTheme = await storage.getItem(CACHE_KEYS.THEME);
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await storage.setItem(CACHE_KEYS.THEME, newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}