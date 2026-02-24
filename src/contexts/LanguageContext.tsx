import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations from '@/i18n/translations';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /**
   * Translate text. Supports two modes:
   * 1. Key-based:   t('nav.home')          → looks up in translations dictionary
   * 2. Inline:      t('Home', 'Inicio')    → uses provided Spanish text (legacy)
   */
  t: (keyOrEnglish: string, spanishText?: string | null) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = sessionStorage.getItem('staff_language');
    return (stored === 'es' ? 'es' : 'en') as Language;
  });

  useEffect(() => {
    sessionStorage.setItem('staff_language', language);
  }, [language]);

  const t = (keyOrEnglish: string, spanishText?: string | null) => {
    // 1. Check dictionary first (key-based lookup)
    const entry = translations[keyOrEnglish];
    if (entry) {
      return language === 'es' ? entry.es : entry.en;
    }

    // 2. Fallback to inline mode (legacy t('English', 'Spanish'))
    if (language === 'es' && spanishText) {
      return spanishText;
    }
    return keyOrEnglish;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
