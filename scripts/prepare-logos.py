#!/usr/bin/env python3
"""
Normalise the venture logos into square marks the wall can put in a circle.

Run once whenever `public/assets/Team Logos/` changes:

    python3 scripts/prepare-logos.py

── Why this exists ──

The logos arrive as whatever each team exported: 18 files for 42 teams, aspect
ratios from 0.77:1 to 5.35:1, seventeen opaque JPEGs and one transparent PNG,
on backgrounds ranging from near-black to pure white. The wall renders every
mark in a circle, and a 5.35:1 wordmark inscribed in a circle occupies about
18% of its height with empty space above and below.

Measured across all 18 files, **seventeen have a perfectly uniform background**
— the four corners sample to the same value, channel spread zero. That is what
makes this approach work: pad each logo out to a square *in its own background
colour*, and the circle fills with the brand's colour rather than showing a
letterboxed strip floating in white. Nothing is cropped, and the disc reads as
one deliberate object.

The venture name is printed directly under the mark on every surface, so a
logo has to be recognisable, not readable. That is the trade being made here.

── What it does, per file ──

1. Sample the four corners for the background colour.
2. Flatten transparency onto that colour (one file needs it).
3. Trim the uniform border away, so the artwork fills the square as much as it
   can rather than inheriting whatever padding the exporter left.
4. Pad back out to a square in the background colour, centred.
5. Resize to 512x512 and write `public/logos/<TEAM_ID>.png`.

── The mapping is an assumption ──

Files are named "Team 17", not "SLE-C417". `TEAM_NUMBER_TO_ID` below encodes
the obvious reading — team N is workbook SLE-C4NN — and it is **unverified**.
Putting the wrong venture's mark on the wall is worse than showing none, so
confirm this against `Team Links` before the wall goes live. It is one dict.
"""

# Python 3.9 is what ships on macOS; `int | None` needs this.
from __future__ import annotations

import os
import pathlib
import sys

try:
    from PIL import Image, ImageChops
except ImportError:
    sys.exit("Pillow is required: python3 -m pip install Pillow")

SOURCE = pathlib.Path("public/assets/Team Logos")
DEST = pathlib.Path("public/logos")
SIZE = 512

# How many pixels in from each edge to sample. A hair inside, because exporters
# occasionally leave a single stray row at the very edge.
INSET_DIVISOR = 40


def team_id(number: int) -> str:
    """Team N is workbook SLE-C4NN. **Unverified — see the module docstring.**"""
    return f"SLE-C4{number:02d}"


def number_from(filename: str) -> int | None:
    """`Team 6 .jpeg` really does carry a trailing space. Parse tolerantly."""
    stem = pathlib.Path(filename).stem.strip()
    if not stem.lower().startswith("team"):
        return None
    digits = stem[4:].strip()
    return int(digits) if digits.isdigit() else None


def background_of(image: Image.Image) -> tuple[int, int, int]:
    """
    The colour the four corners agree on, or the most common of them.

    **Transparent corners mean white, not black.** Converting an RGBA image to
    RGB paints every fully transparent pixel black, so sampling the converted
    copy reported `#000000` for the one file with an alpha channel — and
    flattening its dark navy wordmark onto black very nearly erased it. A logo
    drawn on transparency was drawn to sit on a light page, which is what this
    wall is.
    """
    if image.mode in ("RGBA", "LA", "P"):
        rgba = image.convert("RGBA")
        width, height = rgba.size
        inset = max(1, min(width, height) // INSET_DIVISOR)
        if rgba.getpixel((inset, inset))[3] < 8:
            return (255, 255, 255)

    image = image.convert("RGB")
    width, height = image.size
    inset = max(1, min(width, height) // INSET_DIVISOR)
    corners = [
        image.getpixel((inset, inset)),
        image.getpixel((width - 1 - inset, inset)),
        image.getpixel((inset, height - 1 - inset)),
        image.getpixel((width - 1 - inset, height - 1 - inset)),
    ]
    # Averaging would invent a colour that appears nowhere in the file and
    # would band against the real background. Take the most common corner.
    return max(set(corners), key=corners.count)


def trimmed(image: Image.Image, background: tuple[int, int, int]) -> Image.Image:
    """
    Drop the uniform margin the exporter left.

    Falls back to the original when the difference mask is empty — an image
    that is entirely its own background has nothing to trim and `getbbox()`
    would return `None`.
    """
    flat = Image.new("RGB", image.size, background)
    box = ImageChops.difference(image, flat).convert("L").point(lambda v: 255 if v > 12 else 0).getbbox()
    return image if box is None else image.crop(box)


def squared(image: Image.Image, background: tuple[int, int, int]) -> Image.Image:
    """
    Centre the artwork on a square of its own background.

    A small breathing margin, because a circular mask cuts the corners off a
    square and a wordmark run edge to edge would lose its first and last
    letters to the mask.
    """
    width, height = image.size
    side = int(max(width, height) * 1.06)
    canvas = Image.new("RGB", (side, side), background)
    canvas.paste(image, ((side - width) // 2, (side - height) // 2))
    return canvas


def main() -> int:
    if not SOURCE.is_dir():
        sys.exit(f"no source directory at {SOURCE}")
    DEST.mkdir(parents=True, exist_ok=True)

    written: list[tuple[str, str, str]] = []
    skipped: list[str] = []

    for filename in sorted(os.listdir(SOURCE)):
        if filename.startswith("."):
            continue
        number = number_from(filename)
        if number is None:
            skipped.append(f"{filename} (cannot read a team number)")
            continue

        opened = Image.open(SOURCE / filename)
        background = background_of(opened)

        if opened.mode in ("RGBA", "LA", "P"):
            rgba = opened.convert("RGBA")
            flattened = Image.new("RGB", rgba.size, background)
            flattened.paste(rgba, mask=rgba.getchannel("A"))
            image = flattened
        else:
            image = opened.convert("RGB")

        mark = squared(trimmed(image, background), background)
        mark = mark.resize((SIZE, SIZE), Image.LANCZOS)

        identifier = team_id(number)
        mark.save(DEST / f"{identifier}.png", "PNG", optimize=True)
        written.append((identifier, filename, "#%02X%02X%02X" % background))

    for identifier, filename, background in written:
        print(f"  {identifier}  <-  {filename:16}  bg {background}")
    for note in skipped:
        print(f"  skipped: {note}")

    print(f"\n{len(written)} marks written to {DEST}/")
    print("\nPaste into config.ts LOGOS:")
    print("  " + ",\n  ".join(f"'{identifier}'" for identifier, _, _ in sorted(written)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
