import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

// Import all translations
import enUS from "./en-US.json";
import es419 from "./es-419.json";
import zhCN from "./zh-CN.json";
import ptBR from "./pt-BR.json";
import jaJP from "./ja-JP.json";
import ruRU from "./ru-RU.json";
import frFR from "./fr-FR.json";
import enGB from "./en-GB.json";
import esES from "./es-ES.json";
import deDE from "./de-DE.json";
import zhTW from "./zh-TW.json";
import frCA from "./fr-CA.json";
import ptPT from "./pt-PT.json";
import ukUA from "./uk-UA.json";
import itIT from "./it-IT.json";
import plPL from "./pl-PL.json";
import nlNL from "./nl-NL.json";

// Get user's preferred language order from device settings
function getUserLanguagePreferences(): string[] {
  const deviceLocales = getLocales();
  const preferences: string[] = [];
  
  // Add user's preferred languages in order
  for (const locale of deviceLocales) {
    if (locale.languageCode) {
      // Add full locale (e.g., 'es-MX')
      if (locale.regionCode) {
        preferences.push(`${locale.languageCode}-${locale.regionCode}`);
      }
      // Add language-only (e.g., 'es')
      if (!preferences.includes(locale.languageCode)) {
        preferences.push(locale.languageCode);
      }
    }
  }
  
  // English as final fallback
  if (!preferences.includes('en')) {
    preferences.push('en');
  }
  
  return preferences.length ? preferences : ['en'];
}

const userLanguagePreferences = getUserLanguagePreferences();

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'es-419': { translation: es419 },
    'zh-CN': { translation: zhCN },
    'pt-BR': { translation: ptBR },
    'ja-JP': { translation: jaJP },
    'ru-RU': { translation: ruRU },
    'fr-FR': { translation: frFR },
    'en-GB': { translation: enGB },
    'es-ES': { translation: esES },
    'de-DE': { translation: deDE },
    'zh-TW': { translation: zhTW },
    'fr-CA': { translation: frCA },
    'pt-PT': { translation: ptPT },
    'uk-UA': { translation: ukUA },
    'it-IT': { translation: itIT },
    'pl-PL': { translation: plPL },
    'nl-NL': { translation: nlNL },
    // Language-only fallbacks for i18next
    'en': { translation: enUS },
    'es': { translation: es419 }, // Default Spanish to Latin America
    'zh': { translation: zhCN }, // Default Chinese to Simplified
    'pt': { translation: ptBR }, // Default Portuguese to Brazil
    'fr': { translation: frFR }, // Default French to France
    'de': { translation: deDE },
    'ja': { translation: jaJP },
    'ru': { translation: ruRU },
    'uk': { translation: ukUA },
    'it': { translation: itIT },
    'pl': { translation: plPL },
    'nl': { translation: nlNL },
  },
  lng: userLanguagePreferences[0], // Primary language preference
  fallbackLng: userLanguagePreferences.slice(1), // Remaining preferences as fallbacks
  interpolation: {
    escapeValue: false,
  },
  // Enable clean key separation
  keySeparator: '.',
  nsSeparator: false, // Disable namespace separator since we're not using namespaces
});

export default i18n;
