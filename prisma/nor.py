
import json
import re
import argparse

from pathlib import Path


# Fix dates and times:
# 2022-05-14 15: 04: 37 -> 2022-05-14 15:04:37
DATETIME_PATTERN = re.compile(
    r"\b(\d{4})\s*-\s*(\d{2})\s*-\s*(\d{2})"
    r"\s+(\d{1,2})\s*:\s*(\d{2})\s*:\s*(\d{2})\b"
)

# Fix dates without time:
# 2022 - 05 - 14 -> 2022-05-14
DATE_PATTERN = re.compile(
    r"\b(\d{4})\s*-\s*(\d{2})\s*-\s*(\d{2})\b"
)

# Fix time only:
# 15: 04: 37 -> 15:04:37
TIME_PATTERN = re.compile(
    r"\b(\d{1,2})\s*:\s*(\d{2})\s*:\s*(\d{2})\b"
)

# Fix HTML tags:
# < h1 > -> <h1>
# < / h1 > -> </h1>
# < p > -> <p>
TAG_PATTERN = re.compile(r"<\s*(/?)\s*([a-zA-Z][\w:-]*)\b(.*?)>", re.DOTALL)


def normalize_datetime(text):
    def replace_datetime(match):
        year, month, day, hour, minute, second = match.groups()

        return (
            f"{year}-{month}-{day} "
            f"{int(hour):02d}:{minute}:{second}"
        )

    text = DATETIME_PATTERN.sub(replace_datetime, text)

    text = DATE_PATTERN.sub(
        lambda m: f"{m.group(1)}-{m.group(2)}-{m.group(3)}",
        text,
    )

    text = TIME_PATTERN.sub(
        lambda m: (
            f"{int(m.group(1)):02d}:"
            f"{m.group(2)}:{m.group(3)}"
        ),
        text,
    )

    return text


def normalize_html(text):
    def fix_tag(match):
        closing = match.group(1)
        tag_name = match.group(2)
        attributes = match.group(3)

        # Normalize CSS property names and values.
        attributes = re.sub(
            r"(?<=\w)\s*-\s*(?=[a-zA-Z])",
            "-",
            attributes,
        )

        # Fix spaces around CSS punctuation.
        attributes = re.sub(
            r"\s*:\s*",
            ": ",
            attributes,
        )

        attributes = re.sub(
            r"\s*;\s*",
            "; ",
            attributes,
        )

        attributes = re.sub(
            r"\s*,\s*",
            ", ",
            attributes,
        )

        # Normalize attribute equals signs.
        attributes = re.sub(
            r"\s*=\s*",
            "=",
            attributes,
        )

        attributes = attributes.strip()

        if attributes:
            return f"<{closing}{tag_name} {attributes}>"

        return f"<{closing}{tag_name}>"

    return TAG_PATTERN.sub(fix_tag, text)

def normalize_image_paths(text):
    # Fix spaces around image filename separators
    text = re.sub(
        r'\s*/\s*',
        '/',
        text,
    )

    # Fix spaces before image extensions
    text = re.sub(
        r'\s*\.\s*(jpg|jpeg|png|webp|gif|svg|avif|bmp)\b',
        r'.\1',
        text,
        flags=re.IGNORECASE,
    )

    return text

def normalize_text(text):
    text = normalize_datetime(text)
    text = normalize_html(text)
    text = normalize_image_paths(text)

    return text


def normalize_json(data):
    if isinstance(data, dict):
        return {
            key: normalize_json(value)
            for key, value in data.items()
        }

    if isinstance(data, list):
        return [
            normalize_json(item)
            for item in data
        ]

    if isinstance(data, str):
        return normalize_text(data)

    # Preserve numbers, booleans and null
    return data


def main():
    parser = argparse.ArgumentParser(
        description="Normalize JSON date/time and HTML spacing."
    )

    parser.add_argument(
        "input",
        help="Input JSON file",
    )

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
            f"{input_path.stem}.normalized{input_path.suffix}"
        )
    )

    if not input_path.exists():
        raise FileNotFoundError(input_path)

    with input_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    normalized = normalize_json(data)

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(
            normalized,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print("Normalization completed.")
    print(f"Input:  {input_path}")
    print(f"Output: {output_path}")


if __name__ == "__main__":
    main()