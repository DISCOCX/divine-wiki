import { i18n } from "./i18n";
import en from "../../messages/en.json";

export type Messages = typeof en;
const messages: Record<string, Messages> = { en };

export function getLocale(routeLang?: string) {
  const isSupported = (l?: string): l is (typeof i18n.languages)[number] => {
    return !!l && (i18n.languages as string[]).includes(l);
  };
  if (routeLang && isSupported(routeLang)) return routeLang;

  return i18n.defaultLanguage;
}

export function localizeHref(href: string, routeLang?: string) {
  const locale = getLocale(routeLang);
  const defaultLang = i18n.defaultLanguage;
  if (locale === defaultLang) return href;
  return `/${locale}${href.startsWith("/") ? href : "/" + href}`;
}

export function getMessages(locale?: string): Messages {
  const validLocale = getLocale(locale);
  if (!messages[validLocale]) loadLanguage(validLocale);
  return messages[validLocale] || messages.en;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(override)) return base;
  if (!isPlainObject(base)) return override as T;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    out[key] = deepMerge(
      (base as Record<string, unknown>)[key] as unknown,
      (override as Record<string, unknown>)[key],
    );
  }
  return out as T;
}

export function loadLanguage(locale: string) {
  const validLocale = getLocale(locale);
  if (validLocale === "en") return;

  try {
    const loadedMessages = require(`../../messages/${validLocale}.json`);
    // Locale files are Crowdin-managed and often partial (sometimes just
    // `displayName` before the first sync). Merge over English so every key
    // in the Messages shape is populated — otherwise `messages.nav.title`
    // and similar deep reads blow up with "cannot read properties of
    // undefined" before Crowdin fills them in.
    messages[validLocale] = deepMerge(en, loadedMessages);
  } catch {}
}
