import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Persistence for language
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('vog_lang') || 'tr';
  });

  // Demo user management
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('vog_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Failed to parse vog_user from localStorage", e);
      return null;
    }
  });

  // Persist themeMode (light/dark)
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('vog_theme_mode') || 'light';
  });

  const toggleThemeMode = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const brandThemes = {
    'SEAT': { primary: '#FF9F0A', accent: '#FF9F0A', name: 'SEAT', font: "'Inter', sans-serif" }, 
    'ZARA': { primary: '#FFFFFF', accent: '#FFFFFF', name: 'ZARA', font: "'Space Grotesk', sans-serif" },
    'FORD': { primary: '#0066FF', accent: '#0066FF', name: 'FORD', font: "'Inter', sans-serif" },
    'AUDI': { primary: '#E50914', accent: '#E50914', name: 'AUDI', font: "'Space Grotesk', sans-serif" },
    'VOG': { primary: '#00E5FF', accent: '#00E5FF', name: 'VOG Tekstil', font: "'Space Grotesk', sans-serif" }
  };

  const getThemeForBrand = (brandName) => {
    const key = (brandName || 'VOG').toUpperCase();
    return brandThemes[key] || brandThemes['VOG'];
  };

  const [theme, setTheme] = useState(() => getThemeForBrand(currentUser?.brand));

  useEffect(() => {
    setTheme(getThemeForBrand(currentUser?.brand));
  }, [currentUser]);

  useEffect(() => {
    if (!theme) return;
    // Inject CSS variables for branding
    let primaryColor = '#D4AF37'; // Elite Gold overriding brand for now
    if (themeMode === 'light') { 
      primaryColor = '#B28900'; 
    }
    
    document.documentElement.style.setProperty('--accent', primaryColor);
    document.documentElement.style.setProperty('--accent-glow', `${primaryColor}66`);
  }, [theme, themeMode]);

  useEffect(() => {
    localStorage.setItem('vog_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('vog_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('vog_theme_mode', themeMode);
    if (themeMode === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [themeMode]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'tr' ? 'en' : 'tr'));
  };

  const setLanguage = (newLang) => {
    if (translations[newLang]) setLang(newLang);
  };

  // Translation helper function
  const t = (path) => {
    const keys = path.split('.');
    let result = translations[lang];
    for (const key of keys) {
      if (result[key] === undefined) return path;
      result = result[key];
    }
    return result;
  };

  const value = {
    lang,
    toggleLanguage,
    setLanguage,
    t,
    currentUser,
    setCurrentUser,
    theme,
    brandThemes,
    themeMode,
    toggleThemeMode
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
