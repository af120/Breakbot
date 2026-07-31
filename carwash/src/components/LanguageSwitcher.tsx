import React from 'react';
import { useLang } from '../contexts/LanguageContext';
import { languageNames, type Language } from '../i18n';

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <select className="lang-switcher" value={lang} onChange={e => setLang(e.target.value as Language)}>
      {Object.entries(languageNames).map(([code, name]) => (
        <option key={code} value={code}>{name}</option>
      ))}
    </select>
  );
}
