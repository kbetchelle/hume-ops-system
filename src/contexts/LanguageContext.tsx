import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (englishText: string, spanishText?: string | null) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, ...props }: { children: ReactNode }) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/074fc952-a0d0-47df-950e-fd07947807af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LanguageContext.tsx:13',message:'LanguageProvider render with props',data:{hasRef:!!props.ref,propsKeys:Object.keys(props)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  const [language, setLanguage] = useState<Language>(() => {
    const stored = sessionStorage.getItem('staff_language');
    return (stored === 'es' ? 'es' : 'en') as Language;
  });

  useEffect(() => {
    sessionStorage.setItem('staff_language', language);
  }, [language]);

  const t = (englishText: string, spanishText?: string | null) => {
    if (language === 'es' && spanishText) {
      return spanishText;
    }
    return englishText;
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
