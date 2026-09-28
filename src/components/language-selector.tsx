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

type PendingTranslation = {
  node: Text;
  original: string;
  cacheKey: string;
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

const BATCH_SIZE = 20;
const MIN_SPINNER_DURATION = 700;
const SCAN_DEBOUNCE = 500;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;
const MAX_CACHE_ENTRIES = 5000;

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

  return trimmed.length >= 2 && /\p{L}/u.test(trimmed);
}

function cacheKeyFor(source: string, target: string, text: string): string {
  return `${source}:${target}:${text}`;
}

function addToCache(
  cache: Map<string, string>,
  key: string,
  value: string,
): void {
  // Refresh insertion order for basic LRU behavior.
  cache.delete(key);
  cache.set(key, value);

  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
}

/**
 * Fetch supported languages through the Next.js API.
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
 * Translate a batch through the Next.js API route.
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

function readSavedLanguage(): string {
  const cookie = document.cookie.match(/(?:^|;\s*)site_lang=([^;]+)/);

  if (!cookie?.[1]) {
    return "en";
  }

  try {
    return normalizeCode(decodeURIComponent(cookie[1]));
  } catch {
    return "en";
  }
}

export function LanguageSelector() {
  const [lang, setLang] = useState("en");
  const [busy, setBusy] = useState(false);
  const [langs, setLangs] = useState<LanguageOption[]>([]);
  const [languageError, setLanguageError] = useState("");

  // Original text for every text node modified by this component.
  const originalsRef = useRef(new WeakMap<Text, string>());

  // Last translated value written by this component.
  const translatedValuesRef = useRef(new WeakMap<Text, string>());

  // Successful translations only.
  const cacheRef = useRef(new Map<string, string>());

  // Prevent simultaneous scans.
  const busyRef = useRef(false);
  const busyStartedAtRef = useRef(0);

  const busyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mountedRef = useRef(false);
  const initializedRef = useRef(false);

  const currentLangRef = useRef("en");
  const scanAgainRef = useRef(false);

  const requestIdRef = useRef(0);

  const observerRef = useRef<MutationObserver | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Tracks failures per language/text pair to avoid infinite retries.
  const failuresRef = useRef(new Map<string, number>());

  // Stable scan reference for observers and timers.
  const scanAndTranslateRef = useRef<
    (requestedLanguage?: string) => Promise<void>
  >(async () => {});

  /**
   * Show spinner without flicker.
   */
  const showTranslationSpinner = useCallback(() => {
    if (busyTimerRef.current) {
      clearTimeout(busyTimerRef.current);
      busyTimerRef.current = null;
    }

    if (busyRef.current) {
      return;
    }

    busyRef.current = true;
    busyStartedAtRef.current = Date.now();

    if (mountedRef.current) {
      setBusy(true);
    }
  }, []);

  /**
   * Hide spinner after a minimum visible duration.
   */
  const hideTranslationSpinner = useCallback(() => {
    if (busyTimerRef.current) {
      clearTimeout(busyTimerRef.current);
    }

    const elapsed = Date.now() - busyStartedAtRef.current;

    const remaining = Math.max(0, MIN_SPINNER_DURATION - elapsed);

    busyTimerRef.current = setTimeout(() => {
      busyTimerRef.current = null;
      busyRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }

      // If new content arrived while the spinner was visible,
      // start another scan after the current one has finished.
      if (scanAgainRef.current && mountedRef.current) {
        scanAgainRef.current = false;
        scheduleScan(150);
      }
    }, remaining);
  }, []);

  /**
   * Schedule a debounced translation scan.
   */
  const scheduleScan = useCallback((delay = SCAN_DEBOUNCE) => {
    if (!mountedRef.current) {
      return;
    }

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
   * Restore original text without overwriting React changes.
   */
  const restoreOriginals = useCallback(() => {
    if (!document.body) {
      return;
    }

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
   * Get the original text for a node.
   *
   * React can update the contents of an existing text node,
   * so the original must be refreshed when its text changes.
   */
  const getOriginalText = useCallback((node: Text): string => {
    const currentText = node.data;

    const translated = translatedValuesRef.current.get(node);

    let original = originalsRef.current.get(node);

    if (translated !== undefined && currentText === translated) {
      return original ?? currentText;
    }

    // A changed node is treated as new original content.
    if (original === undefined || currentText !== original) {
      original = currentText;

      originalsRef.current.set(node, original);
      translatedValuesRef.current.delete(node);
    }

    return original;
  }, []);

  /**
   * Translate all currently untranslated text.
   */
  const scanAndTranslate = useCallback(
    async (requestedLanguage?: string): Promise<void> => {
      if (!mountedRef.current || !document.body) {
        return;
      }

      const target = normalizeCode(requestedLanguage || currentLangRef.current);

      if (!target) {
        return;
      }

      // English is the source language. Restore translated nodes
      // and leave all page text in its original form.
      if (isEnglish(target)) {
        restoreOriginals();
        return;
      }

      if (busyRef.current) {
        scanAgainRef.current = true;
        return;
      }

      showTranslationSpinner();

      scanAgainRef.current = false;

      const requestId = ++requestIdRef.current;

      const controller = new AbortController();

      abortControllerRef.current = controller;

      const isCurrentRequest = () =>
        mountedRef.current &&
        requestId === requestIdRef.current &&
        target === currentLangRef.current &&
        !controller.signal.aborted;

      const pending: PendingTranslation[] = [];

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

        let current: Node | null;

        // First pass: find untranslated text and apply cache.
        while ((current = walker.nextNode())) {
          if (!isCurrentRequest()) {
            break;
          }

          const node = current as Text;

          const previousTranslated = translatedValuesRef.current.get(node);

          // Already translated into the active language.
          if (
            previousTranslated !== undefined &&
            node.data === previousTranslated
          ) {
            continue;
          }

          const original = getOriginalText(node);

          if (!isTranslatableText(original)) {
            continue;
          }

          const source = "en";

          const cacheKey = cacheKeyFor(source, target, original);

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

          // Skip text that has exhausted its retry allowance.
          const failures = failuresRef.current.get(cacheKey) ?? 0;

          if (failures >= MAX_RETRIES) {
            continue;
          }

          pending.push({
            node,
            original,
            cacheKey,
          });
        }

        // Second pass: send translation batches.
        for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
          if (!isCurrentRequest()) {
            break;
          }

          const batch = pending.slice(offset, offset + BATCH_SIZE);

          try {
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

              // Do not cache or apply empty responses.
              if (typeof translated !== "string" || !translated.trim()) {
                failuresRef.current.set(
                  item.cacheKey,
                  (failuresRef.current.get(item.cacheKey) ?? 0) + 1,
                );

                continue;
              }

              const result = translated;

              // A valid translation is cached even if the
              // corresponding node has been removed.
              addToCache(cacheRef.current, item.cacheKey, result);

              failuresRef.current.delete(item.cacheKey);

              // Do not overwrite removed or excluded nodes.
              if (!item.node.isConnected || shouldIgnore(item.node)) {
                continue;
              }

              // React may have changed this node while the
              // network request was in progress.
              if (item.node.data !== item.original) {
                continue;
              }

              if (originalsRef.current.get(item.node) !== item.original) {
                continue;
              }

              if (!isCurrentRequest()) {
                break;
              }

              item.node.data = result;

              translatedValuesRef.current.set(item.node, result);
            }
          } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
              break;
            }

            console.error("Translation batch failed:", error);

            // Increment failure counts for this batch.
            // Failed items will be retried on the next scan.
            for (const item of batch) {
              const failures = failuresRef.current.get(item.cacheKey) ?? 0;

              failuresRef.current.set(item.cacheKey, failures + 1);
            }

            // Do not stop translating other batches when
            // one batch fails.
          }
        }

        // Schedule one automatic retry if failed text remains.
        // Retry only a limited number of times.
        if (isCurrentRequest()) {
          const hasRetryableFailures = pending.some(
            (item) =>
              (failuresRef.current.get(item.cacheKey) ?? 0) < MAX_RETRIES,
          );

          if (hasRetryableFailures) {
            if (retryTimerRef.current) {
              clearTimeout(retryTimerRef.current);
            }

            retryTimerRef.current = setTimeout(() => {
              retryTimerRef.current = null;

              if (mountedRef.current && target === currentLangRef.current) {
                scheduleScan(100);
              }
            }, RETRY_DELAY);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Translation scan failed:", error);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          abortControllerRef.current = null;

          hideTranslationSpinner();
        }
      }
    },
    [
      getOriginalText,
      hideTranslationSpinner,
      restoreOriginals,
      scheduleScan,
      showTranslationSpinner,
    ],
  );

  // Update stable scan reference.
  useEffect(() => {
    scanAndTranslateRef.current = scanAndTranslate;
  }, [scanAndTranslate]);

  /**
   * Load supported languages and restore saved language.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadLanguages() {
      let options: LanguageOption[];

      try {
        const supported = await fetchSupportedLanguages();

        options = supported.map((item) => ({
          ...item,
          flag: getFlag(item.code),
        }));

        setLanguageError("");
      } catch (error) {
        console.error("Could not load translation languages:", error);

        options = fallbackLangs.map((item) => ({
          ...item,
          code: normalizeCode(item.code),
          flag: getFlag(item.code),
        }));

        setLanguageError(
          "Could not load supported languages. Using the fallback list.",
        );
      }

      if (cancelled) {
        return;
      }

      // Always provide English as a selectable language.
      if (!options.some((item) => item.code === "en")) {
        options.unshift({
          code: "en",
          name: "English",
          flag: getFlag("en"),
        });
      }

      // Deduplicate language options.
      const unique = new Map<string, LanguageOption>();

      for (const option of options) {
        const code = normalizeCode(option.code);

        if (!unique.has(code)) {
          unique.set(code, {
            ...option,
            code,
          });
        }
      }

      options = Array.from(unique.values());

      setLangs(options);

      const saved = readSavedLanguage();

      const selected = options.some((item) => item.code === saved)
        ? saved
        : "en";

      currentLangRef.current = selected;

      setLang(selected);

      applyDirection(selected);

      initializedRef.current = true;

      // Automatically translate on initial load when the
      // saved language is not English.
      if (!isEnglish(selected)) {
        scheduleScan(100);
      }
    }

    void loadLanguages();

    return () => {
      cancelled = true;
    };
  }, [scheduleScan]);

  /**
   * Observe React and dynamically inserted page content.
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

          // Ignore mutations caused by our own translations.
          if (translated !== undefined && node.data === translated) {
            continue;
          }

          if (!shouldIgnore(node) && isTranslatableText(node.data)) {
            hasNewContent = true;
            break;
          }
        }

        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const added of mutation.addedNodes) {
            if (added.nodeType === Node.TEXT_NODE) {
              const textNode = added as Text;

              if (
                !shouldIgnore(textNode) &&
                isTranslatableText(textNode.data)
              ) {
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
        if (busyRef.current) {
          scanAgainRef.current = true;
        } else {
          scheduleScan(SCAN_DEBOUNCE);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    observerRef.current = observer;

    // Initial scan after observer is active.
    if (initializedRef.current) {
      void scanAndTranslateRef.current();
    }

    return () => {
      mountedRef.current = false;

      observer.disconnect();
      observerRef.current = null;

      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      if (busyTimerRef.current) {
        clearTimeout(busyTimerRef.current);
        busyTimerRef.current = null;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      requestIdRef.current++;

      busyRef.current = false;
      scanAgainRef.current = false;
    };
  }, [scheduleScan]);

  /**
   * Change language and safely cancel previous requests.
   */
  const changeLanguage = useCallback(
    async (language: string) => {
      const target = normalizeCode(language);

      if (target === currentLangRef.current) {
        return;
      }

      // Invalidate any active request.
      requestIdRef.current++;

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      // Cancel scheduled scans and retries.
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      if (busyTimerRef.current) {
        clearTimeout(busyTimerRef.current);
        busyTimerRef.current = null;
      }

      busyRef.current = false;
      scanAgainRef.current = false;

      currentLangRef.current = target;

      setLang(target);
      setBusy(false);

      // Reset failure counts for the newly selected language.
      failuresRef.current.clear();

      document.cookie =
        `site_lang=${encodeURIComponent(target)}; ` +
        "path=/; max-age=31536000; samesite=lax";

      applyDirection(target);

      // Restore original text before changing languages.
      restoreOriginals();

      if (isEnglish(target)) {
        return;
      }

      await scanAndTranslate(target);
    },
    [restoreOriginals, scanAndTranslate],
  );

  return (
    <div className="relative flex min-w-0 items-center gap-2" data-no-translate>
      <select
        id="language-picker"
        aria-label="Select language"
        value={lang}
        onChange={(event) => void changeLanguage(event.target.value)}
        className="
          max-w-32 min-w-0 rounded-full
          border border-white/25
          bg-[#2b211c]
          px-3 py-2
          text-xs text-white
          outline-none
          transition-colors
          hover:border-white/50
          focus-visible:ring-2
          focus-visible:ring-white/50
        "
      >
        {langs.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.name}
          </option>
        ))}
      </select>

      {busy && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Translating page"
          className="
            relative inline-flex shrink-0 items-center gap-2.5
            overflow-hidden rounded-full
            border border-white/15
            bg-white/[0.08]
            px-3 py-2
            text-[11px] font-medium tracking-wide text-white/90
            shadow-lg shadow-black/10
            backdrop-blur-xl
            animate-in fade-in duration-300
          "
        >
          {/* Subtle animated background */}
          <span
            aria-hidden="true"
            className="
              absolute inset-0
              bg-gradient-to-r from-transparent
              via-white/[0.07] to-transparent
              animate-pulse
            "
          />

          {/* Spinner */}
          <span
            aria-hidden="true"
            className="
              relative flex size-[18px] shrink-0
              items-center justify-center
            "
          >
            <span
              className="
                absolute inset-0 rounded-full
                border-2 border-white/15
              "
            />

            <span
              className="
                absolute inset-0 rounded-full
                border-2 border-transparent
                border-t-[#e8bd83]
                border-r-[#e8bd83]
                animate-spin
              "
              style={{
                animationDuration: "700ms",
              }}
            />

            <span
              className="
                size-1 rounded-full
                bg-[#e8bd83]
                shadow-[0_0_8px_rgba(232,189,131,0.8)]
              "
            />
          </span>

          {/* Loading label */}
          <span className="relative whitespace-nowrap">
            Translating
            <span className="inline-flex w-5 justify-start">
              <span className="animate-pulse">...</span>
            </span>
          </span>
        </div>
      )}

      {languageError && (
        <span className="sr-only" role="status">
          {languageError}
        </span>
      )}
    </div>
  );
}
