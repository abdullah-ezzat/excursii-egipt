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
  translations?: unknown;
  translatedText?: unknown;
  error?: unknown;
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

const rtlLanguages = ["ar", "he", "fa", "ur", "ps", "sd", "ug", "yi"];

const BATCH_SIZE = 10;
const MAX_TEXT_LENGTH = 4500;
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000;
const REQUEST_TIMEOUT = 20000;
const LANGUAGE_TIMEOUT = 10000;
const MIN_SPINNER_DURATION = 500;
const SCAN_DEBOUNCE = 400;
const MAX_CACHE_ENTRIES = 3000;

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

function isEnglish(code: string): boolean {
  const normalized = normalizeCode(code);
  return normalized === "en" || normalized.startsWith("en-");
}

function getFlag(code: string): string {
  const normalized = normalizeCode(code);
  const region = languageRegions[normalized.split("-")[0]];

  if (!region || !/^[A-Z]{2}$/i.test(region)) {
    return "🌐";
  }

  try {
    return String.fromCodePoint(
      ...region
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0)),
    );
  } catch {
    return "🌐";
  }
}

function applyDirection(language: string): void {
  try {
    if (typeof document === "undefined") return;

    const base = normalizeCode(language).split("-")[0];

    document.documentElement.lang = language || "en";
    document.documentElement.dir = rtlLanguages.includes(base) ? "rtl" : "ltr";
  } catch {
    // Direction is cosmetic. Never break the page.
  }
}

function isTranslatableText(text: string): boolean {
  const trimmed = text.trim();

  return (
    trimmed.length >= 2 &&
    /\p{L}/u.test(trimmed) &&
    trimmed.length <= MAX_TEXT_LENGTH
  );
}

function shouldIgnore(node: Text): boolean {
  try {
    const parent = node.parentElement;

    if (!parent || !node.isConnected) return true;

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
          "[role='status']",
          "[role='alert']",
        ].join(","),
      )
    ) {
      return true;
    }

    const text = node.data || "";

    if (
      text.includes("self.__next_r") ||
      text.includes("self.__next_f") ||
      text.includes("__next_f.push") ||
      text.includes("__next_r=")
    ) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

function cacheKeyFor(source: string, target: string, text: string): string {
  return `${source}:${target}:${text}`;
}

function addToCache(
  cache: Map<string, string>,
  key: string,
  value: string,
): void {
  cache.delete(key);
  cache.set(key, value);

  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;

    if (oldest === undefined) break;

    cache.delete(oldest);
  }
}

function readSavedLanguage(): string {
  try {
    if (typeof document === "undefined") return "en";

    const match = document.cookie.match(/(?:^|;\s*)site_lang=([^;]+)/);

    if (!match?.[1]) return "en";

    const code = normalizeCode(decodeURIComponent(match[1]));

    return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(code) ? code : "en";
  } catch {
    return "en";
  }
}

function saveLanguage(code: string): void {
  try {
    document.cookie =
      `site_lang=${encodeURIComponent(code)}; ` +
      "path=/; max-age=31536000; samesite=lax";
  } catch {
    // Cookie restrictions must not break language selection.
  }
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 300);
  }

  return "An unexpected translation error occurred.";
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();

  const externalSignal = options.signal;

  const abortFromExternal = () => controller.abort();

  if (externalSignal?.aborted) {
    controller.abort();
  } else {
    externalSignal?.addEventListener("abort", abortFromExternal, {
      once: true,
    });
  }

  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);

    externalSignal?.removeEventListener("abort", abortFromExternal);
  }
}

async function fetchSupportedLanguages(): Promise<Language[]> {
  const response = await fetchWithTimeout(
    "/api/translate/languages",
    { method: "GET" },
    LANGUAGE_TIMEOUT,
  );

  if (!response.ok) {
    throw new Error(`Languages API returned ${response.status}`);
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error("Languages API returned invalid JSON");
  }

  if (!Array.isArray(data)) {
    throw new Error("Languages API returned an invalid response");
  }

  const models: Language[] = [];

  for (const item of data) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("code" in item) ||
      typeof item.code !== "string"
    ) {
      continue;
    }

    const code = normalizeCode(item.code);

    if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(code)) {
      continue;
    }

    const name =
      "name" in item && typeof item.name === "string"
        ? item.name.trim()
        : code.toUpperCase();

    const targets =
      "targets" in item && Array.isArray(item.targets)
        ? item.targets.filter(
            (target: any): target is string => typeof target === "string",
          )
        : [];

    models.push({ code, name, targets });
  }

  const availableTargets = new Set<string>();

  for (const model of models) {
    for (const target of model.targets ?? []) {
      availableTargets.add(normalizeCode(target));
    }
  }

  const supported = models.filter((model) =>
    availableTargets.has(normalizeCode(model.code)),
  );

  const unique = new Map<string, Language>();

  for (const model of supported) {
    if (!unique.has(model.code)) {
      unique.set(model.code, model);
    }
  }

  return Array.from(unique.values());
}

async function translateBatch(
  texts: string[],
  source: string,
  target: string,
  signal: AbortSignal,
): Promise<string[]> {
  if (!texts.length) return [];

  const response = await fetchWithTimeout(
    "/api/translate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        texts,
        source,
        target,
      }),
    },
    REQUEST_TIMEOUT,
  );

  if (!response.ok) {
    let message = "";

    try {
      const body = await response.text();
      message = body.slice(0, 300);
    } catch {
      message = "";
    }

    throw new Error(
      `Translation API returned ${response.status}` +
        (message ? `: ${message}` : ""),
    );
  }

  let data: TranslateResponse;

  try {
    data = (await response.json()) as TranslateResponse;
  } catch {
    throw new Error("Translation API returned invalid JSON");
  }

  if (data.error) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Translation API error",
    );
  }

  // Support both the custom array API and the standard
  // LibreTranslate single-text response.
  if (Array.isArray(data.translations)) {
    return data.translations.map((value) =>
      typeof value === "string" ? value : "",
    );
  }

  if (typeof data.translatedText === "string" && texts.length === 1) {
    return [data.translatedText];
  }

  throw new Error("Translation API returned no translations");
}

export function LanguageSelector() {
  const [lang, setLang] = useState("en");
  const [busy, setBusy] = useState(false);
  const [langs, setLangs] = useState<LanguageOption[]>([]);
  const [languageError, setLanguageError] = useState("");

  const mountedRef = useRef(false);
  const initializedRef = useRef(false);

  const currentLangRef = useRef("en");
  const requestIdRef = useRef(0);

  const originalsRef = useRef(new WeakMap<Text, string>());
  const translatedValuesRef = useRef(new WeakMap<Text, string>());

  const cacheRef = useRef(new Map<string, string>());
  const failuresRef = useRef(new Map<string, number>());

  const busyRef = useRef(false);
  const busyStartedAtRef = useRef(0);
  const scanAgainRef = useRef(false);

  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const scanAndTranslateRef = useRef<(language?: string) => Promise<void>>(
    async () => {},
  );

  const clearTimer = useCallback(
    (ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    },
    [],
  );

  const restoreOriginals = useCallback(() => {
    if (typeof document === "undefined" || !document.body) return;

    try {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );

      let current: Node | null;

      while ((current = walker.nextNode())) {
        const node = current as Text;
        const translated = translatedValuesRef.current.get(node);

        if (translated === undefined) continue;

        const original = originalsRef.current.get(node);

        // Never overwrite text that React or another script changed.
        if (original !== undefined && node.data === translated) {
          node.data = original;
        }

        translatedValuesRef.current.delete(node);
      }
    } catch (error) {
      console.error("Could not restore translated text:", error);
    }
  }, []);

  const getOriginalText = useCallback((node: Text): string => {
    const current = node.data;
    const translated = translatedValuesRef.current.get(node);
    let original = originalsRef.current.get(node);

    if (translated !== undefined && current === translated) {
      return original ?? current;
    }

    if (original === undefined || current !== original) {
      original = current;
      originalsRef.current.set(node, original);
      translatedValuesRef.current.delete(node);
    }

    return original;
  }, []);

  const showSpinner = useCallback(() => {
    clearTimer(busyTimerRef);

    if (busyRef.current) return;

    busyRef.current = true;
    busyStartedAtRef.current = Date.now();

    if (mountedRef.current) {
      setBusy(true);
    }
  }, [clearTimer]);

  const scheduleScan = useCallback(
    (delay = SCAN_DEBOUNCE) => {
      if (!mountedRef.current) return;

      clearTimer(scanTimerRef);

      scanTimerRef.current = setTimeout(() => {
        scanTimerRef.current = null;

        if (mountedRef.current) {
          void scanAndTranslateRef.current();
        }
      }, delay);
    },
    [clearTimer],
  );

  const hideSpinner = useCallback(() => {
    clearTimer(busyTimerRef);

    const remaining = Math.max(
      0,
      MIN_SPINNER_DURATION - (Date.now() - busyStartedAtRef.current),
    );

    busyTimerRef.current = setTimeout(() => {
      busyTimerRef.current = null;
      busyRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }

      if (scanAgainRef.current && mountedRef.current) {
        scanAgainRef.current = false;
        scheduleScan(150);
      }
    }, remaining);
  }, [clearTimer, scheduleScan]);

  const scanAndTranslate = useCallback(
    async (requestedLanguage?: string): Promise<void> => {
      if (
        !mountedRef.current ||
        typeof document === "undefined" ||
        !document.body
      ) {
        return;
      }

      const target = normalizeCode(requestedLanguage || currentLangRef.current);

      if (!target) return;

      if (isEnglish(target)) {
        restoreOriginals();
        return;
      }

      if (busyRef.current) {
        scanAgainRef.current = true;
        return;
      }

      showSpinner();
      scanAgainRef.current = false;

      const requestId = ++requestIdRef.current;
      const controller = new AbortController();

      abortControllerRef.current = controller;

      const isCurrent = () =>
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

        while ((current = walker.nextNode())) {
          if (!isCurrent()) break;

          const node = current as Text;
          const translated = translatedValuesRef.current.get(node);

          if (translated !== undefined && node.data === translated) {
            continue;
          }

          const original = getOriginalText(node);

          if (!isTranslatableText(original)) continue;

          const key = cacheKeyFor("en", target, original);
          const cached = cacheRef.current.get(key);

          if (cached !== undefined) {
            if (
              node.isConnected &&
              !shouldIgnore(node) &&
              node.data === original &&
              isCurrent()
            ) {
              node.data = cached;
              translatedValuesRef.current.set(node, cached);
            }

            continue;
          }

          if ((failuresRef.current.get(key) ?? 0) >= MAX_RETRIES) {
            continue;
          }

          pending.push({
            node,
            original,
            cacheKey: key,
          });
        }

        for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
          if (!isCurrent()) break;

          const batch = pending.slice(offset, offset + BATCH_SIZE);

          // Split oversized batches further to avoid server body limits.
          const safeBatch = batch.filter(
            (item) => item.original.length <= MAX_TEXT_LENGTH,
          );

          if (!safeBatch.length) continue;

          try {
            const translations = await translateBatch(
              safeBatch.map((item) => item.original),
              "en",
              target,
              controller.signal,
            );

            if (!isCurrent()) break;

            for (let index = 0; index < safeBatch.length; index++) {
              const item = safeBatch[index];
              const translated = translations[index];

              if (typeof translated !== "string" || !translated.trim()) {
                failuresRef.current.set(
                  item.cacheKey,
                  (failuresRef.current.get(item.cacheKey) ?? 0) + 1,
                );

                continue;
              }

              addToCache(cacheRef.current, item.cacheKey, translated);
              failuresRef.current.delete(item.cacheKey);

              if (!item.node.isConnected || shouldIgnore(item.node)) {
                continue;
              }

              // React may have updated or replaced the text during fetch.
              if (
                item.node.data !== item.original ||
                originalsRef.current.get(item.node) !== item.original ||
                !isCurrent()
              ) {
                continue;
              }

              item.node.data = translated;
              translatedValuesRef.current.set(item.node, translated);
            }
          } catch (error) {
            if (controller.signal.aborted) break;

            console.error("Translation batch failed:", safeErrorMessage(error));

            for (const item of safeBatch) {
              failuresRef.current.set(
                item.cacheKey,
                (failuresRef.current.get(item.cacheKey) ?? 0) + 1,
              );
            }
          }
        }

        if (isCurrent()) {
          const retryable = pending.some(
            (item) =>
              (failuresRef.current.get(item.cacheKey) ?? 0) < MAX_RETRIES,
          );

          if (retryable) {
            clearTimer(retryTimerRef);

            retryTimerRef.current = setTimeout(() => {
              retryTimerRef.current = null;

              if (mountedRef.current && target === currentLangRef.current) {
                scheduleScan(100);
              }
            }, RETRY_DELAY);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Translation scan failed:", safeErrorMessage(error));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          abortControllerRef.current = null;
          hideSpinner();
        }
      }
    },
    [
      clearTimer,
      getOriginalText,
      hideSpinner,
      restoreOriginals,
      scheduleScan,
      showSpinner,
    ],
  );

  useEffect(() => {
    scanAndTranslateRef.current = scanAndTranslate;
  }, [scanAndTranslate]);

  // Mount/unmount lifecycle.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      requestIdRef.current++;

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      observerRef.current?.disconnect();
      observerRef.current = null;

      clearTimer(scanTimerRef);
      clearTimer(retryTimerRef);
      clearTimer(busyTimerRef);

      busyRef.current = false;
      scanAgainRef.current = false;
    };
  }, [clearTimer]);

  // Load supported languages with a safe fallback.
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

        if (!options.length) {
          throw new Error("No supported languages returned");
        }

        if (!cancelled) setLanguageError("");
      } catch (error) {
        console.error(
          "Could not load translation languages:",
          safeErrorMessage(error),
        );

        options = fallbackLangs.map((item) => ({
          ...item,
          code: normalizeCode(item.code),
          flag: getFlag(item.code),
        }));

        if (!cancelled) {
          setLanguageError(
            "Translation service unavailable. Some languages may not work.",
          );
        }
      }

      if (cancelled) return;

      if (!options.some((item) => item.code === "en")) {
        options.unshift({
          code: "en",
          name: "English",
          flag: getFlag("en"),
        });
      }

      const unique = new Map<string, LanguageOption>();

      for (const option of options) {
        const code = normalizeCode(option.code);

        if (!unique.has(code)) {
          unique.set(code, { ...option, code });
        }
      }

      const finalOptions = Array.from(unique.values());

      setLangs(finalOptions);

      const saved = readSavedLanguage();

      const selected = finalOptions.some((item) => item.code === saved)
        ? saved
        : "en";

      currentLangRef.current = selected;
      setLang(selected);
      applyDirection(selected);

      initializedRef.current = true;

      if (!isEnglish(selected)) {
        scheduleScan(200);
      }
    }

    void loadLanguages();

    return () => {
      cancelled = true;
    };
  }, [scheduleScan]);

  // Observe dynamic React content.
  useEffect(() => {
    if (
      typeof document === "undefined" ||
      !document.body ||
      typeof MutationObserver === "undefined"
    ) {
      return;
    }

    try {
      const observer = new MutationObserver((mutations) => {
        if (!mountedRef.current) return;

        let hasNewContent = false;

        for (const mutation of mutations) {
          if (mutation.type === "characterData") {
            const node = mutation.target as Text;
            const translated = translatedValuesRef.current.get(node);

            if (translated !== undefined && node.data === translated) {
              continue;
            }

            if (!shouldIgnore(node) && isTranslatableText(node.data)) {
              hasNewContent = true;
              break;
            }
          }

          if (mutation.type === "childList" && mutation.addedNodes.length) {
            for (const added of mutation.addedNodes) {
              if (added.nodeType === Node.TEXT_NODE) {
                const node = added as Text;

                if (!shouldIgnore(node) && isTranslatableText(node.data)) {
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

                      return !shouldIgnore(textNode) &&
                        isTranslatableText(textNode.data)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
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

          if (hasNewContent) break;
        }

        if (hasNewContent) {
          if (busyRef.current) {
            scanAgainRef.current = true;
          } else {
            scheduleScan();
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      observerRef.current = observer;

      if (initializedRef.current) {
        scheduleScan(100);
      }

      return () => {
        observer.disconnect();

        if (observerRef.current === observer) {
          observerRef.current = null;
        }
      };
    } catch (error) {
      console.error("Translation observer unavailable:", error);
    }
  }, [scheduleScan]);

  const changeLanguage = useCallback(
    async (language: string) => {
      const target = normalizeCode(language);

      if (!target || target === currentLangRef.current) return;

      // Ignore values that do not exist in the selector.
      if (!langs.some((item) => item.code === target)) {
        return;
      }

      requestIdRef.current++;

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      clearTimer(scanTimerRef);
      clearTimer(retryTimerRef);
      clearTimer(busyTimerRef);

      busyRef.current = false;
      scanAgainRef.current = false;

      currentLangRef.current = target;

      setLang(target);
      setBusy(false);

      failuresRef.current.clear();

      saveLanguage(target);
      applyDirection(target);

      // Restore before translating into a different language.
      restoreOriginals();

      if (isEnglish(target)) {
        return;
      }

      await scanAndTranslate(target);
    },
    [clearTimer, langs, restoreOriginals, scanAndTranslate],
  );

  return (
    <div className="relative flex min-w-0 items-center gap-2" data-no-translate>
      <select
        id="language-picker"
        aria-label="Select language"
        value={lang}
        onChange={(event) => {
          void changeLanguage(event.target.value);
        }}
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
          "
        >
          <span
            aria-hidden="true"
            className="
              absolute inset-0
              animate-pulse
              bg-gradient-to-r from-transparent
              via-white/[0.07] to-transparent
            "
          />

          <span
            aria-hidden="true"
            className="relative flex size-[18px] shrink-0 items-center justify-center"
          >
            <span className="absolute inset-0 rounded-full border-2 border-white/15" />

            <span
              className="
                absolute inset-0 rounded-full
                border-2 border-transparent
                border-t-[#e8bd83]
                border-r-[#e8bd83]
                animate-spin
              "
              style={{ animationDuration: "700ms" }}
            />

            <span className="size-1 rounded-full bg-[#e8bd83]" />
          </span>

          <span className="relative whitespace-nowrap">Translating...</span>
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
