"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Language = {
  code: string;
  name: string;
  targets?: string[];
};

type LanguageOption = Language & {
  flag: string;
};

type TranslateResponse = {
  translations?: string[];
  error?: string;
};

const fallbackLangs: Language[] = [
  { code: "en", name: "English" },
  { code: "ru", name: "Russian" },
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
  { code: "ro", name: "Romanian" },
  { code: "es", name: "Spanish" },
  { code: "ar", name: "Arabic" },
  { code: "de", name: "German" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
  { code: "uk", name: "Ukrainian" },
  { code: "hi", name: "Hindi" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "pt", name: "Portuguese" },
  { code: "el", name: "Greek" },
  { code: "cs", name: "Czech" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "hu", name: "Hungarian" },
  { code: "id", name: "Indonesian" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "he", name: "Hebrew" },
  { code: "fa", name: "Persian" },
  { code: "ur", name: "Urdu" },
  { code: "bn", name: "Bengali" },
  { code: "ms", name: "Malay" },
  { code: "sw", name: "Swahili" },
  { code: "ca", name: "Catalan" },
  { code: "hr", name: "Croatian" },
  { code: "sr", name: "Serbian" },
  { code: "sk", name: "Slovak" },
  { code: "bg", name: "Bulgarian" },
  { code: "sq", name: "Albanian" },
  { code: "az", name: "Azerbaijani" },
];

const countryCodes = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT
BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR
CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER
ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL
GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU
ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH
KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU
LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR
MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP
NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW
PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ
SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG
TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US
UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW
`
  .trim()
  .split(/\s+/);

const rtlLanguages = ["ar", "he", "fa", "ur", "ps", "sd", "ug", "yi"];

const languageRegions: Record<string, string> = {
  en: "GB",
  sq: "AL",
  ar: "EG",
  az: "AZ",
  pt: "PT",
  zh: "CN",
  es: "ES",
  fr: "FR",
  de: "DE",
  ru: "RU",
  it: "IT",
  ro: "RO",
  nl: "NL",
  pl: "PL",
  tr: "TR",
  uk: "UA",
  hi: "IN",
  ja: "JP",
  ko: "KR",
  he: "IL",
  fa: "IR",
  ur: "PK",
  bn: "BD",
  ms: "MY",
  id: "ID",
  vi: "VN",
  th: "TH",
  el: "GR",
  cs: "CZ",
  sv: "SE",
  da: "DK",
  fi: "FI",
  no: "NO",
  hr: "HR",
  sr: "RS",
  sk: "SK",
  bg: "BG",
  sw: "KE",
  ca: "ES",
  hu: "HU",
};

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) {
    return "🌐";
  }

  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0)),
  );
}

function getFlag(code: string): string {
  const normalized = normalizeCode(code);
  const parts = normalized.split("-");

  if (parts.length > 1) {
    const region = parts[parts.length - 1].toUpperCase();

    if (countryCodes.includes(region)) {
      return countryFlag(region);
    }
  }

  const region = languageRegions[normalized] || "";

  return region ? countryFlag(region) : "🌐";
}

function isEnglish(language: string): boolean {
  const code = normalizeCode(language);

  return code === "en" || code.startsWith("en-");
}

function applyDirection(language: string): void {
  const base = normalizeCode(language).split("-")[0];

  document.documentElement.lang = language;
  document.documentElement.dir = rtlLanguages.includes(base) ? "rtl" : "ltr";
}

function shouldIgnore(node: Text): boolean {
  const parent = node.parentElement;

  if (!parent) {
    return true;
  }

  if (
    parent.closest(
      [
        "[data-no-translate]",
        "[translate='no']",
        "script",
        "style",
        "noscript",
        "code",
        "pre",
        "textarea",
        "input",
        "select",
        "option",
        "svg",
        "math",
        "iframe",
        "canvas",
        "[contenteditable]",
        "[aria-hidden='true']",
      ].join(","),
    )
  ) {
    return true;
  }

  const text = node.data || "";

  if (!text.trim()) {
    return true;
  }

  // Skip Next.js internal payloads.
  if (
    text.includes("self.__next_r") ||
    text.includes("self.__next_f") ||
    text.includes("__next_f.push") ||
    text.includes("__next_r=")
  ) {
    return true;
  }

  return false;
}

function isTranslatableText(text: string): boolean {
  const trimmed = text.trim();

  if (trimmed.length < 2) {
    return false;
  }

  return /\p{L}/u.test(trimmed);
}

/**
 * Fetch supported destination languages through Next.js.
 *
 * The browser must not call 127.0.0.1:5000 directly.
 */
async function fetchSupportedLanguages(): Promise<Language[]> {
  const response = await fetch("/api/translate/languages", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load translation languages: ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid translation languages response");
  }

  const models = data.filter(
    (item): item is Language =>
      typeof item === "object" &&
      item !== null &&
      "code" in item &&
      typeof item.code === "string" &&
      "targets" in item &&
      Array.isArray(item.targets),
  );

  const availableTargets = new Set<string>();

  for (const model of models) {
    for (const target of model.targets ?? []) {
      if (typeof target === "string") {
        availableTargets.add(normalizeCode(target));
      }
    }
  }

  // Only offer languages the server supports as targets.
  const supported = models.filter((model) =>
    availableTargets.has(normalizeCode(model.code)),
  );

  const unique = new Map<string, Language>();

  for (const model of supported) {
    const code = normalizeCode(model.code);

    if (!unique.has(code)) {
      unique.set(code, {
        ...model,
        code,
      });
    }
  }

  return Array.from(unique.values());
}

/**
 * Translate a batch using the Next.js API route.
 */
async function translateBatch(
  texts: string[],
  source: string,
  target: string,
  signal?: AbortSignal,
): Promise<string[]> {
  if (texts.length === 0) {
    return [];
  }

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal,
    body: JSON.stringify({
      texts,
      source,
      target,
    }),
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(`Translation failed (${response.status}): ${message}`);
  }

  const data: TranslateResponse = await response.json();

  if (!Array.isArray(data.translations)) {
    throw new Error(data.error || "Invalid translation response");
  }

  return data.translations;
}

type PendingTranslation = {
  node: Text;
  original: string;
  cacheKey: string;
};

export function LanguageSelector() {
  const [lang, setLang] = useState("en");
  const [busy, setBusy] = useState(false);
  const [langs, setLangs] = useState<LanguageOption[]>([]);
  const [languageError, setLanguageError] = useState("");

  // The original English content for each DOM text node.
  const originalsRef = useRef(new WeakMap<Text, string>());

  // Last translated value written by this component.
  const translatedValuesRef = useRef(new WeakMap<Text, string>());

  // Cache translations across scans and language changes.
  const cacheRef = useRef(new Map<string, string>());

  const currentLangRef = useRef("en");
  const busyRef = useRef(false);
  const mountedRef = useRef(false);

  const scanAgainRef = useRef(false);
  const requestIdRef = useRef(0);

  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const observerRef = useRef<MutationObserver | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Schedule one debounced scan.
   */
  const scheduleScan = useCallback((delay = 500) => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
    }

    scanTimerRef.current = setTimeout(() => {
      scanTimerRef.current = null;

      if (mountedRef.current) {
        void scanAndTranslateRef.current();
      }
    }, delay);
  }, []);

  /**
   * Restore original text without overwriting changes
   * made by React or other scripts.
   */
  const restoreOriginals = useCallback(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );

    let current: Node | null;

    while ((current = walker.nextNode())) {
      const node = current as Text;
      const translated = translatedValuesRef.current.get(node);

      if (translated === undefined) {
        continue;
      }

      const original = originalsRef.current.get(node);

      if (original !== undefined && node.data === translated) {
        node.data = original;
      }

      translatedValuesRef.current.delete(node);
    }
  }, []);

  /**
   * Translate the current page into the requested language.
   */
  const scanAndTranslate = useCallback(
    async (requestedLanguage?: string) => {
      if (!mountedRef.current) {
        return;
      }

      if (busyRef.current) {
        scanAgainRef.current = true;
        return;
      }

      const target = normalizeCode(requestedLanguage || currentLangRef.current);

      if (!target || isEnglish(target)) {
        restoreOriginals();
        return;
      }

      busyRef.current = true;
      setBusy(true);

      scanAgainRef.current = false;

      const requestId = ++requestIdRef.current;
      const controller = new AbortController();

      abortControllerRef.current = controller;

      const isCurrentRequest = () =>
        mountedRef.current &&
        requestId === requestIdRef.current &&
        target === currentLangRef.current &&
        !controller.signal.aborted;

      try {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode(node) {
              const textNode = node as Text;

              if (shouldIgnore(textNode)) {
                return NodeFilter.FILTER_REJECT;
              }

              if (!isTranslatableText(textNode.data)) {
                return NodeFilter.FILTER_REJECT;
              }

              return NodeFilter.FILTER_ACCEPT;
            },
          },
        );

        const pending: PendingTranslation[] = [];

        let current: Node | null;

        while ((current = walker.nextNode())) {
          const node = current as Text;
          const currentText = node.data;

          const previousTranslated = translatedValuesRef.current.get(node);

          // Already translated into the active language.
          if (
            previousTranslated !== undefined &&
            currentText === previousTranslated
          ) {
            continue;
          }

          let original = originalsRef.current.get(node);

          // New text node or React changed the text.
          if (
            original === undefined ||
            (previousTranslated !== undefined &&
              currentText !== previousTranslated)
          ) {
            original = currentText;

            originalsRef.current.set(node, original);
            translatedValuesRef.current.delete(node);
          }

          if (!isTranslatableText(original)) {
            continue;
          }

          const source = "en";
          const cacheKey = `${source}:${target}:${original}`;

          const cached = cacheRef.current.get(cacheKey);

          if (cached !== undefined) {
            if (
              node.isConnected &&
              !shouldIgnore(node) &&
              node.data === original &&
              isCurrentRequest()
            ) {
              node.data = cached;
              translatedValuesRef.current.set(node, cached);
            }

            continue;
          }

          pending.push({
            node,
            original,
            cacheKey,
          });
        }

        const batchSize = 20;

        for (let i = 0; i < pending.length; i += batchSize) {
          if (!isCurrentRequest()) {
            break;
          }

          const batch = pending.slice(i, i + batchSize);

          const translations = await translateBatch(
            batch.map((item) => item.original),
            "en",
            target,
            controller.signal,
          );

          if (!isCurrentRequest()) {
            break;
          }

          for (let index = 0; index < batch.length; index++) {
            const item = batch[index];
            const translated = translations[index];

            if (typeof translated !== "string" || !translated.trim()) {
              continue;
            }

            // Cache even when the node has been removed.
            cacheRef.current.set(item.cacheKey, translated);

            // Do not overwrite a removed or excluded node.
            if (!item.node.isConnected || shouldIgnore(item.node)) {
              continue;
            }

            // Only write if React has not changed the node.
            if (item.node.data !== item.original) {
              continue;
            }

            if (originalsRef.current.get(item.node) !== item.original) {
              continue;
            }

            item.node.data = translated;

            translatedValuesRef.current.set(item.node, translated);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Translation scan failed:", error);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          busyRef.current = false;
          abortControllerRef.current = null;

          if (mountedRef.current) {
            setBusy(false);
          }

          if (scanAgainRef.current && mountedRef.current) {
            scanAgainRef.current = false;
            scheduleScan(300);
          }
        }
      }
    },
    [restoreOriginals, scheduleScan],
  );

  // Keep a stable reference for the observer and timers.
  const scanAndTranslateRef = useRef(scanAndTranslate);

  useEffect(() => {
    scanAndTranslateRef.current = scanAndTranslate;
  }, [scanAndTranslate]);

  /**
   * Load available languages and restore the saved choice.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadLanguages() {
      try {
        const supported = await fetchSupportedLanguages();

        if (cancelled) {
          return;
        }

        const options: LanguageOption[] = supported.map((item) => ({
          ...item,
          flag: getFlag(item.code),
        }));

        // Ensure English is available as the default.
        if (!options.some((item) => item.code === "en")) {
          options.unshift({
            code: "en",
            name: "English",
            flag: getFlag("en"),
          });
        }

        setLangs(options);

        const cookie = document.cookie.match(/(?:^|;\s*)site_lang=([^;]+)/);

        let saved = "en";

        if (cookie?.[1]) {
          try {
            saved = normalizeCode(decodeURIComponent(cookie[1]));
          } catch {
            saved = "en";
          }
        }

        const selected = options.some((item) => item.code === saved)
          ? saved
          : "en";

        currentLangRef.current = selected;

        setLang(selected);
        applyDirection(selected);

        setLanguageError("");
      } catch (error) {
        console.error("Could not load translation languages:", error);

        if (cancelled) {
          return;
        }

        const options: LanguageOption[] = fallbackLangs.map((item) => ({
          ...item,
          code: normalizeCode(item.code),
          flag: getFlag(item.code),
        }));

        setLangs(options);

        const cookie = document.cookie.match(/(?:^|;\s*)site_lang=([^;]+)/);

        let saved = "en";

        if (cookie?.[1]) {
          try {
            saved = normalizeCode(decodeURIComponent(cookie[1]));
          } catch {
            saved = "en";
          }
        }

        const selected = options.some((item) => item.code === saved)
          ? saved
          : "en";

        currentLangRef.current = selected;

        setLang(selected);
        applyDirection(selected);

        setLanguageError(
          "Could not load supported languages. Using the fallback list.",
        );
      }
    }

    void loadLanguages();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Start observing dynamic content.
   */
  useEffect(() => {
    mountedRef.current = true;

    if (!document.body) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      let hasNewContent = false;

      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const node = mutation.target as Text;

          const translated = translatedValuesRef.current.get(node);

          // Ignore our own translation writes.
          if (translated !== undefined && node.data === translated) {
            continue;
          }

          if (!shouldIgnore(node)) {
            hasNewContent = true;
            break;
          }
        }

        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const added of mutation.addedNodes) {
            if (added.nodeType === Node.TEXT_NODE) {
              const textNode = added as Text;

              if (!shouldIgnore(textNode)) {
                hasNewContent = true;
                break;
              }
            }

            if (added.nodeType === Node.ELEMENT_NODE) {
              const element = added as Element;

              if (
                element.matches("[data-no-translate]") ||
                element.closest("[data-no-translate]")
              ) {
                continue;
              }

              const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                  acceptNode(node) {
                    const textNode = node as Text;

                    return shouldIgnore(textNode)
                      ? NodeFilter.FILTER_REJECT
                      : NodeFilter.FILTER_ACCEPT;
                  },
                },
              );

              if (walker.nextNode()) {
                hasNewContent = true;
                break;
              }
            }
          }
        }

        if (hasNewContent) {
          break;
        }
      }

      if (hasNewContent) {
        scheduleScan(500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    observerRef.current = observer;

    // Initial scan. English mode leaves content unchanged.
    void scanAndTranslateRef.current();

    return () => {
      mountedRef.current = false;

      observer.disconnect();
      observerRef.current = null;

      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      requestIdRef.current++;
      busyRef.current = false;
      scanAgainRef.current = false;
    };
  }, [scheduleScan]);

  /**
   * Change the current language.
   */
  const changeLanguage = useCallback(
    async (language: string) => {
      const target = normalizeCode(language);

      if (target === currentLangRef.current) {
        return;
      }

      // Invalidate and cancel the previous translation request.
      requestIdRef.current++;

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      busyRef.current = false;
      scanAgainRef.current = false;

      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }

      currentLangRef.current = target;

      setLang(target);
      setBusy(false);

      document.cookie =
        `site_lang=${encodeURIComponent(target)}; ` +
        "path=/; max-age=31536000; samesite=lax";

      applyDirection(target);

      // Restore the page before translating into the new language.
      restoreOriginals();

      if (isEnglish(target)) {
        return;
      }

      await scanAndTranslate(target);
    },
    [restoreOriginals, scanAndTranslate],
  );

  return (
    <div className="relative flex items-center gap-2" data-no-translate>
      <select
        id="language-picker"
        aria-label="Select language"
        value={lang}
        onChange={(event) => void changeLanguage(event.target.value)}
        className="max-w-32 rounded-full border border-white/25 bg-[#2b211c] px-3 py-2 text-xs text-white outline-none transition-colors hover:border-white/50 focus-visible:ring-2 focus-visible:ring-white/50"
      >
        {langs.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.name}
          </option>
        ))}
      </select>

      {busy && (
        <span
          className="whitespace-nowrap text-[10px] text-white/80"
          aria-live="polite"
          role="status"
        >
          Translating…
        </span>
      )}

      {languageError && (
        <span className="sr-only" role="status">
          {languageError}
        </span>
      )}
    </div>
  );
}
