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

function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";

  return String.fromCodePoint(
    ...[...code].map((c) => 127397 + c.charCodeAt(0)),
  );
}

function getFlag(code: string): string {
  const normalized = code.toLowerCase();
  const parts = normalized.split("-");

  // Regional language codes, such as en-US.
  if (parts.length > 1) {
    const region = parts[parts.length - 1].toUpperCase();

    if (countryCodes.includes(region)) {
      return countryFlag(region);
    }
  }

  const region = languageRegions[normalized] || "";

  return region ? countryFlag(region) : "🌐";
}

function normalizeCode(code: string) {
  return code.trim().toLowerCase();
}

function applyDirection(language: string) {
  const base = language.split("-")[0].toLowerCase();

  document.documentElement.lang = language;
  document.documentElement.dir = rtlLanguages.includes(base) ? "rtl" : "ltr";
}

function isEnglish(language: string) {
  return (
    normalizeCode(language) === "en" ||
    normalizeCode(language).startsWith("en-")
  );
}

function shouldIgnore(node: Text): boolean {
  const parent = node.parentElement;

  if (!parent) return true;

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
        "[contenteditable='true']",
      ].join(","),
    )
  ) {
    return true;
  }

  const text = node.data || "";

  if (!text.trim()) return true;

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

function isTranslatableText(text: string) {
  const trimmed = text.trim();

  if (trimmed.length < 2) return false;

  // Skip strings without letters.
  if (!/\p{L}/u.test(trimmed)) return false;

  return true;
}

// Use the supported language models returned by LibreTranslate.
// The server's /languages response contains source models,
// each with the targets that model can translate into.
async function fetchSupportedLanguages(): Promise<Language[]> {
  const response = await fetch("http://127.0.0.1:5000/languages", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load translation models: ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid LibreTranslate languages response");
  }

  const models = data.filter(
    (item: any) =>
      item && typeof item.code === "string" && Array.isArray(item.targets),
  ) as Language[];

  // Only offer destination languages supported
  // by at least one loaded source model.
  const availableTargets = new Set<string>();

  for (const model of models) {
    for (const target of model.targets ?? []) {
      availableTargets.add(normalizeCode(target));
    }
  }

  // English can be offered only if the server
  // supports it as a destination.
  const supported = models
    .filter((model) => availableTargets.has(normalizeCode(model.code)))
    .map((model) => ({
      ...model,
      code: normalizeCode(model.code),
    }));

  // Merge duplicate model entries by code.
  const unique = new Map<string, Language>();

  for (const model of supported) {
    if (!unique.has(model.code)) {
      unique.set(model.code, model);
    }
  }

  return Array.from(unique.values());
}

// Translation API proxy.
// The source is "auto" for English destination,
// otherwise the original content is assumed English.
async function translateBatch(
  texts: string[],
  source: string,
  target: string,
): Promise<string[]> {
  if (!texts.length) return [];

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

export function LanguageSelector() {
  const [lang, setLang] = useState("en");

  const [busy, setBusy] = useState(false);

  const [langs, setLangs] = useState<LanguageOption[]>([]);

  // Keep the original text for each text node.
  const originalsRef = useRef(new WeakMap<Text, string>());

  // Records the last translated value applied
  // by this component.
  const translatedValuesRef = useRef(new WeakMap<Text, string>());

  // Avoid repeatedly translating identical strings.
  const cacheRef = useRef(new Map<string, string>());

  const currentLangRef = useRef("en");

  const busyRef = useRef(false);

  const scanAgainRef = useRef(false);

  const observerRef = useRef<MutationObserver | null>(null);

  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestIdRef = useRef(0);

  // Load languages from the LibreTranslate models.
  useEffect(() => {
    let cancelled = false;

    async function loadLanguages() {
      try {
        const supported = await fetchSupportedLanguages();

        if (cancelled) return;

        const options: LanguageOption[] = supported.map((item) => ({
          ...item,
          flag: getFlag(item.code),
        }));

        setLangs(options);

        const savedCookie = document.cookie.match(/(?:^|; )site_lang=([^;]+)/);

        const saved = savedCookie ? decodeURIComponent(savedCookie[1]) : "en";

        const selected = options.some(
          (item) => normalizeCode(item.code) === normalizeCode(saved),
        )
          ? normalizeCode(saved)
          : "en";

        currentLangRef.current = selected;

        setLang(selected);

        applyDirection(selected);
      } catch (error) {
        console.error("Could not load LibreTranslate models:", error);

        if (cancelled) return;

        // Fallback list is deduplicated and filtered
        // against the known available model list.
        const fallback = new Map<string, LanguageOption>();

        for (const item of fallbackLangs) {
          const code = normalizeCode(item.code);

          if (!fallback.has(code)) {
            fallback.set(code, {
              ...item,
              code,
              flag: getFlag(code),
            });
          }
        }

        setLangs(Array.from(fallback.values()));
      }
    }

    void loadLanguages();

    return () => {
      cancelled = true;
    };
  }, []);

  const scanAndTranslate = useCallback(async (requestedLanguage?: string) => {
    if (busyRef.current) {
      scanAgainRef.current = true;
      return;
    }

    const target = requestedLanguage || currentLangRef.current;

    if (!target) return;

    busyRef.current = true;
    setBusy(true);

    scanAgainRef.current = false;

    const requestId = ++requestIdRef.current;

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

      const pending: {
        node: Text;
        original: string;
        cacheKey: string;
      }[] = [];

      let current: Node | null;

      while ((current = walker.nextNode())) {
        const node = current as Text;

        const currentText = node.data;

        const previousTranslated = translatedValuesRef.current.get(node);

        // The current text is already the
        // translated output from this component.
        if (
          previousTranslated !== undefined &&
          currentText === previousTranslated
        ) {
          continue;
        }

        let original = originalsRef.current.get(node);

        // This node is new, or React replaced
        // its content since the previous scan.
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

        const source = isEnglish(target) ? "auto" : "en";

        const cacheKey = `${source}:${target}:${original}`;

        const cached = cacheRef.current.get(cacheKey);

        if (cached !== undefined) {
          if (node.isConnected) {
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

      // Process in small batches.
      const batchSize = 20;

      for (let i = 0; i < pending.length; i += batchSize) {
        if (
          requestId !== requestIdRef.current ||
          target !== currentLangRef.current
        ) {
          break;
        }

        const batch = pending.slice(i, i + batchSize);

        const source = isEnglish(target) ? "auto" : "en";

        const translations = await translateBatch(
          batch.map((item) => item.original),
          source,
          target,
        );

        if (
          requestId !== requestIdRef.current ||
          target !== currentLangRef.current
        ) {
          break;
        }

        batch.forEach((item, index) => {
          const translated = translations[index];

          if (typeof translated !== "string" || !translated.trim()) {
            return;
          }

          const result = translated;

          cacheRef.current.set(item.cacheKey, result);

          if (!item.node.isConnected || shouldIgnore(item.node)) {
            return;
          }

          // Avoid overwriting a node that React
          // or another script has changed.
          const savedOriginal = originalsRef.current.get(item.node);

          if (savedOriginal !== item.original) {
            return;
          }

          // In English mode, preserve the original
          // if LibreTranslate returns it unchanged.
          // It may already be English.
          if (isEnglish(target) && result.trim() === item.original.trim()) {
            return;
          }

          item.node.data = result;

          translatedValuesRef.current.set(item.node, result);
        });
      }
    } catch (error) {
      console.error("Translation scan failed:", error);
    } finally {
      busyRef.current = false;
      setBusy(false);

      if (scanAgainRef.current) {
        scanAgainRef.current = false;

        if (scanTimerRef.current) {
          clearTimeout(scanTimerRef.current);
        }

        scanTimerRef.current = setTimeout(() => {
          void scanAndTranslate();
        }, 400);
      }
    }
  }, []);

  const restoreOriginals = useCallback(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );

    let current: Node | null;

    while ((current = walker.nextNode())) {
      const node = current as Text;

      const lastTranslated = translatedValuesRef.current.get(node);

      if (lastTranslated === undefined) {
        continue;
      }

      const original = originalsRef.current.get(node);

      // Restore only text that still matches
      // our own last translated value.
      if (original !== undefined && node.data === lastTranslated) {
        node.data = original;
      }

      translatedValuesRef.current.delete(node);
    }
  }, []);

  const changeLanguage = useCallback(
    async (language: string) => {
      const target = normalizeCode(language);

      if (target === currentLangRef.current) {
        return;
      }

      // Do not allow a previous request to apply
      // translations after the language changes.
      requestIdRef.current++;

      currentLangRef.current = target;

      setLang(target);

      document.cookie = `site_lang=${encodeURIComponent(target)};path=/;max-age=31536000;samesite=lax`;

      applyDirection(target);

      restoreOriginals();

      await scanAndTranslate(target);
    },
    [restoreOriginals, scanAndTranslate],
  );

  // Watch for dynamic React content.
  useEffect(() => {
    if (!document.body) return;

    const scheduleScan = () => {
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }

      scanTimerRef.current = setTimeout(() => {
        void scanAndTranslate();
      }, 600);
    };

    const observer = new MutationObserver((mutations) => {
      let newContent = false;

      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const node = mutation.target as Text;

          // Ignore text changes made by our
          // own translator.
          const lastTranslated = translatedValuesRef.current.get(node);

          if (lastTranslated !== undefined && node.data === lastTranslated) {
            continue;
          }

          if (!shouldIgnore(node)) {
            newContent = true;
            break;
          }
        }

        if (mutation.type === "childList" && mutation.addedNodes.length) {
          for (const added of mutation.addedNodes) {
            if (added.nodeType === Node.TEXT_NODE) {
              const textNode = added as Text;

              if (!shouldIgnore(textNode)) {
                newContent = true;
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
                newContent = true;
                break;
              }
            }
          }
        }

        if (newContent) break;
      }

      if (newContent) {
        scheduleScan();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    observerRef.current = observer;

    // Initial translation once languages are ready.
    void scanAndTranslate(currentLangRef.current);

    // Periodic scan catches content missed by
    // mutation observation or client-side updates.
    intervalRef.current = setInterval(() => {
      void scanAndTranslate(currentLangRef.current);
    }, 5000);

    return () => {
      observer.disconnect();

      observerRef.current = null;

      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scanAndTranslate]);

  return (
    <div className="relative flex items-center gap-2" data-no-translate>
      <select
        id="language-picker"
        aria-label="Select language"
        value={lang}
        disabled={busy}
        onChange={(event) => changeLanguage(event.target.value)}
        className="max-w-32 rounded-full border border-white/25 bg-[#2b211c] px-3 py-2 text-xs text-white"
      >
        {langs.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.name}
          </option>
        ))}
      </select>

      {busy && (
        <span className="text-[10px] text-white" aria-live="polite">
          Translating…
        </span>
      )}
    </div>
  );
}
