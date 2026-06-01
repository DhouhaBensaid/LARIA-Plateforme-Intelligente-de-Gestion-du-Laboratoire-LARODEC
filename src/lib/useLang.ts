import { useState, useEffect } from "react";
import { type Lang, translations } from "./i18n";

export function useLang() {
  const getStored = (): Lang => {
    try {
      const v = localStorage.getItem("larodec_lang");
      return v === "en" ? "en" : "fr";
    } catch {
      return "fr";
    }
  };

  const [lang, setLangState] = useState<Lang>(getStored);

  useEffect(() => {
    const handler = () => setLangState(getStored());
    window.addEventListener("larodec_lang_change", handler);
    return () => window.removeEventListener("larodec_lang_change", handler);
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem("larodec_lang", l);
    setLangState(l);
    window.dispatchEvent(new Event("larodec_lang_change"));
  };

  return { lang, setLang, t: translations[lang] };
}
