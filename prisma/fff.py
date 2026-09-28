
import json
import argparse
import requests
import time
import random

from pathlib import Path

LIBRETRANSLATE_URL = "http://127.0.0.1:5000/translate"

REQUEST_DELAY = 2
MAX_RETRIES = 10

session = requests.Session()

translation_cache = {}


def save_json(path, data):
    """Save JSON safely using UTF-8."""
    temp_path = path.with_suffix(path.suffix + ".tmp")

    with temp_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    temp_path.replace(path)


def translate_text(text: str) -> str:
    text = text.strip()

    if not text:
        return text

    if text in translation_cache:
        return translation_cache[text]

    for attempt in range(MAX_RETRIES):
        try:
            response = session.post(
                LIBRETRANSLATE_URL,
                json={
                    "q": text,
                    "source": "ro",
                    "target": "en",
                    "format": "text",
                },
                timeout=120,
            )

            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")

                try:
                    wait = float(retry_after)
                except (TypeError, ValueError):
                    wait = min(5 * (2 ** attempt), 120)

                wait += random.uniform(1, 3)

                print(
                    f"429 Rate limited. "
                    f"Waiting {wait:.1f}s "
                    f"({attempt + 1}/{MAX_RETRIES})"
                )

                time.sleep(wait)
                continue

            if response.status_code in (500, 502, 503, 504):
                wait = min(5 * (2 ** attempt), 120)

                print(f"Server error. Retrying in {wait}s")
                time.sleep(wait)
                continue

            if not response.ok:
                print(f"HTTP {response.status_code}")
                print(f"Response: {response.text}")
                response.raise_for_status()

            translated = response.json()["translatedText"]

            translation_cache[text] = translated

            print(f"RO: {text[:100]}")
            print(f"EN: {translated[:100]}")
            print("-" * 50)

            time.sleep(REQUEST_DELAY)

            return translated

        except requests.RequestException as error:
            wait = min(5 * (2 ** attempt), 120)

            print(f"Request failed: {error}")

            if attempt < MAX_RETRIES - 1:
                time.sleep(wait)

    print(f"FAILED after retries: {text[:100]}")

    # Keep original text if translation fails
    return text


def translate_json(data):
    if isinstance(data, dict):
        return {
            key: translate_json(value)
            for key, value in data.items()
        }

    if isinstance(data, list):
        return [
            translate_json(item)
            for item in data
        ]

    if isinstance(data, str):
        return translate_text(data)

    # Preserve numbers, booleans, and null
    return data


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("input", help="Input JSON file")

    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Output JSON file",
    )

    args = parser.parse_args()

    input_path = Path(args.input)

    output_path = Path(
        args.output
        or input_path.with_name(
            f"{input_path.stem}.en{input_path.suffix}"
        )
    )

    cache_path = output_path.with_suffix(".cache.json")

    if not input_path.exists():
        raise FileNotFoundError(input_path)

    with input_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    # Restore previous translations
    if cache_path.exists():
        with cache_path.open("r", encoding="utf-8") as file:
            translation_cache.update(json.load(file))

        print(f"Loaded {len(translation_cache)} cached translations")

    print(f"Input: {input_path}")
    print(f"Output: {output_path}")

    translated_data = translate_json(data)

    save_json(output_path, translated_data)
    save_json(cache_path, translation_cache)

    print("\nTranslation completed.")
    print(f"Output: {output_path}")
    print(f"Cached translations: {len(translation_cache)}")


if __name__ == "__main__":
    main()