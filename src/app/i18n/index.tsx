import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { NAMESPACES, type Namespaces } from "./dict";
import type { Lang } from "./types";

export type { Lang } from "./types";
export { ns } from "./types";

const STORAGE_KEY = "lcc-lang";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const Context = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "lo") return saved;
    }
    return "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => setLang(lang === "en" ? "lo" : "en");

  return (
    <Context.Provider value={{ lang, setLang, toggle }}>
      {children}
    </Context.Provider>
  );
}

export function useLang() {
  return useContext(Context);
}

type Params = Record<string, string | number>;

/*
 * Scoped translator. `const t = useT("home")` then `t("greeting")`.
 * Keys are type-checked against the namespace's English table; supports
 * `{name}`-style interpolation via the optional params argument.
 */
export function useT<N extends keyof Namespaces>(nsName: N) {
  const { lang } = useContext(Context);
  return (key: keyof Namespaces[N]["en"], params?: Params): string => {
    const dict = NAMESPACES[nsName] as {
      en: Record<string, string>;
      lo: Record<string, string>;
    };
    let str = dict[lang]?.[key as string] ?? dict.en?.[key as string] ?? String(key);
    if (params) {
      for (const p in params) str = str.split(`{${p}}`).join(String(params[p]));
    }
    return str;
  };
}
