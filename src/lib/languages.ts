import type { LanguageCode } from "./schema";

export interface LanguageInfo {
  code: LanguageCode;
  /** English name, used in prompts */
  name: string;
  /** Native name, used in the UI */
  native: string;
  /** BCP-47 tag for speech synthesis / recognition */
  speech: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", native: "English", speech: "en-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", speech: "ta-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", speech: "te-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", speech: "bn-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", speech: "mr-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", speech: "kn-IN" },
];

export function language(code: string): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
