import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

const baseUrl = () =>
  (process.env.TRANSLATION_API_URL || "http://libretranslate:5000").replace(
    /\/$/,
    "",
  );

const apiKey = () => process.env.TRANSLATION_API_KEY || "";

type Language = {
  code: string;
  name: string;
  targets?: string[];
};

let languagesCache: {
  data: Language[];
  expiresAt: number;
} | null = null;

/**
 * Get supported languages from LibreTranslate.
 * Cache the language list in memory for 60 seconds.
 */
async function getLanguages(): Promise<Language[]> {
  if (languagesCache && languagesCache.expiresAt > Date.now()) {
    return languagesCache.data;
  }

  const response = await fetch(`${baseUrl()}/languages`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve supported languages");
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid languages response");
  }

  const languages = data.filter(
    (item): item is Language =>
      typeof item?.code === "string" && typeof item?.name === "string",
  );

  languagesCache = {
    data: languages,
    expiresAt: Date.now() + 60_000,
  };

  return languages;
}

/**
 * Normalize user-supplied language codes.
 *
 * Accepts:
 * ar, AR, en-US, zh-CN, pt-BR, Arabic, English.
 *
 * Returns a language code supported by LibreTranslate.
 */
function resolveLanguage(
  requested: string,
  languages: Language[],
): string | null {
  const normalized = requested.trim().replace(/_/g, "-").toLowerCase();

  if (normalized === "auto") {
    return "auto";
  }

  // Exact language-code match.
  const exact = languages.find(
    (language) => language.code.toLowerCase() === normalized,
  );

  if (exact) {
    return exact.code;
  }

  // Match regional variants, e.g. en-US -> en.
  const base = normalized.split("-")[0];

  const baseMatch = languages.find(
    (language) => language.code.toLowerCase() === base,
  );

  if (baseMatch) {
    return baseMatch.code;
  }

  // Match language names, e.g. Arabic -> ar.
  const nameMatch = languages.find(
    (language) => language.name.toLowerCase() === normalized,
  );

  if (nameMatch) {
    return nameMatch.code;
  }

  return null;
}

async function getCachedTranslation(
  source: string,
  target: string,
  text: string,
): Promise<string | null> {
  const textHash = getTextHash(text);

  try {
    const cached = await prisma.translationCache.findUnique({
      where: {
        source_target_textHash: {
          source,
          target,
          textHash,
        },
      },
    });

    // Verify original text as an additional collision safeguard.
    if (!cached || cached.originalText !== text) {
      return null;
    }

    return cached.translatedText;
  } catch (error) {
    console.error("Translation cache lookup failed:", error);
    return null;
  }
}

async function saveCachedTranslation(
  source: string,
  target: string,
  originalText: string,
  translatedText: string,
): Promise<void> {
  const textHash = getTextHash(originalText);

  try {
    await prisma.translationCache.upsert({
      where: {
        source_target_textHash: {
          source,
          target,
          textHash,
        },
      },
      create: {
        source,
        target,
        textHash,
        originalText,
        translatedText,
      },
      update: {
        originalText,
        translatedText,
      },
    });
  } catch (error) {
    console.error("Failed to save translation cache:", error);
  }
}

/**
 * GET /api/translate
 *
 * Returns supported languages.
 */
export async function GET() {
  try {
    const languages = await getLanguages();

    return NextResponse.json(languages, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "LibreTranslate is unreachable. Check TRANSLATION_API_URL and service status.",
      },
      { status: 503 },
    );
  }
}

const schema = z
  .object({
    q: z.string().min(1).max(5000).optional(),

    texts: z.array(z.string().min(1).max(1500)).max(40).optional(),

    source: z.string().default("en"),

    target: z.string().min(2).max(12),
  })
  .refine((data) => !!data.q || !!data.texts?.length);

/**
 * POST /api/translate
 *
 * Supports:
 *
 * Single:
 * {
 *   "q": "Hello",
 *   "source": "en",
 *   "target": "ar"
 * }
 *
 * Batch:
 * {
 *   "texts": ["Hello", "Welcome"],
 *   "source": "en",
 *   "target": "ar"
 * }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid translation request" },
      { status: 400 },
    );
  }

  const { q, texts, source, target } = parsed.data;

  try {
    const languages = await getLanguages();

    const resolvedSource = resolveLanguage(source, languages);
    const resolvedTarget = resolveLanguage(target, languages);

    if (!resolvedSource) {
      return NextResponse.json(
        {
          error: `Source language '${source}' is not supported.`,
          supportedLanguages: languages.map((language) => ({
            code: language.code,
            name: language.name,
          })),
        },
        { status: 400 },
      );
    }

    if (!resolvedTarget || resolvedTarget === "auto") {
      return NextResponse.json(
        {
          error: `Target language '${target}' is not supported.`,
          supportedLanguages: languages.map((language) => ({
            code: language.code,
            name: language.name,
          })),
        },
        { status: 400 },
      );
    }

    // Validate whether the installed models support this language pair.
    const sourceLanguage = languages.find(
      (language) => language.code === resolvedSource,
    );

    if (
      resolvedSource !== "auto" &&
      sourceLanguage?.targets?.length &&
      !sourceLanguage.targets.some(
        (code) => code.toLowerCase() === resolvedTarget.toLowerCase(),
      )
    ) {
      return NextResponse.json(
        {
          error: `Translation from '${resolvedSource}' to '${resolvedTarget}' is not supported by the installed models.`,
          source: resolvedSource,
          target: resolvedTarget,
        },
        { status: 422 },
      );
    }

    /**
     * Translate one piece of text.
     *
     * 1. Check persistent cache.
     * 2. Return cached translation if found.
     * 3. Call LibreTranslate on cache miss.
     * 4. Save successful translation.
     * 5. Return translated text.
     */
    const translate = async (text: string): Promise<string> => {
      // Preserve empty or whitespace-only content.
      if (!text.trim()) {
        return text;
      }

      // Check cache first. Cache failures must not prevent translation.
      try {
        const cached = await getCachedTranslation(
          resolvedSource,
          resolvedTarget,
          text,
        );

        if (cached !== null) {
          return cached;
        }
      } catch (error) {
        console.error("Translation cache lookup failed:", error);
      }

      // Cache miss: request translation from LibreTranslate.
      const response = await fetch(`${baseUrl()}/translate`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          q: text,
          source: resolvedSource,
          target: resolvedTarget,
          format: "text",
          ...(apiKey() ? { api_key: apiKey() } : {}),
        }),

        cache: "no-store",

        signal: AbortSignal.timeout(60000),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || typeof data.translatedText !== "string") {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : `Translation failed (${response.status})`,
        );
      }

      const translatedText: string = data.translatedText;

      // Store successful translation for future requests.
      try {
        await saveCachedTranslation(
          resolvedSource,
          resolvedTarget,
          text,
          translatedText,
        );
      } catch (error) {
        // Return the translation even if saving to cache fails.
        console.error("Failed to save translation cache:", error);
      }

      return translatedText;
    };

    // Single-text translation.
    if (q !== undefined) {
      const translatedText = await translate(q);

      return NextResponse.json({
        translatedText,
        source: resolvedSource,
        target: resolvedTarget,
        provider: "LibreTranslate",
      });
    }

    // Batch translation.
    const translations: string[] = [];

    for (const text of texts ?? []) {
      translations.push(await translate(text));
    }

    return NextResponse.json({
      translations,
      source: resolvedSource,
      target: resolvedTarget,
      provider: "LibreTranslate",
    });
  } catch (error) {
    console.error("Translation API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Translation service unavailable",
      },
      { status: 502 },
    );
  }
}

function getTextHash(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
