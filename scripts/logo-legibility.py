#!/usr/bin/env python3
"""
Render every prepared logo, in a circle, at every size the wall uses.

    python3 scripts/logo-legibility.py [out.png]

Reach for this whenever the mark sizes change or new logos arrive. It answers
one question that no amount of reasoning settles: **at what diameter does a
venture's logo stop being a logo and become a coloured dot?**

── What it found the first time ──

Rendering all eighteen at 40 / 52 / 64 / 81 / 100px showed the threshold sits
around 50px. Below it the wordmarks stop resolving into anything; above it the
main word reads even where a tagline does not. The strip's mark was 40px and
went to 48px on that evidence.

Two things worth remembering when reading the sheet:

- **Recognisable is the bar, not readable.** The venture's name is printed
  beside every mark on every surface, so a mark has to identify a team at a
  glance, not spell its name. That is the deal the circular frame makes.
- **Desk distance flatters everything here.** At six metres a 48px mark on a
  1920 frame subtends about 14 arcminutes — enough for colour and silhouette,
  not for a word. Judge the sheet accordingly.

A logo that is faint at *every* size on this sheet is an artwork problem, not a
framing one, and has to go back to the team. `SLE-C412` is the current example:
pale grey type on white, faint even at 100px.
"""

from __future__ import annotations

import os
import pathlib
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Pillow is required: python3 -m pip install Pillow")

LOGOS = pathlib.Path("public/logos")
# The sizes the wall actually renders: strip, then the three pillar diameters
# across the viewport range, then first place at its largest.
SIZES = [40, 48, 64, 81, 100]
PAD, GAP, HEADER = 24, 18, 22


def circular(image: Image.Image, size: int) -> tuple[Image.Image, Image.Image]:
    """The mark at `size`, and a matching antialiased circular mask."""
    resized = image.resize((size, size), Image.LANCZOS)
    # Drawn at 4x and downsampled: PIL's ellipse has no antialiasing of its own,
    # and a hard-edged mask makes every mark look like a cheap cut-out.
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    return resized, mask.resize((size, size), Image.LANCZOS)


def main() -> int:
    if not LOGOS.is_dir():
        sys.exit(f"no prepared logos at {LOGOS} — run scripts/prepare-logos.py first")
    files = sorted(f for f in os.listdir(LOGOS) if f.endswith(".png"))
    if not files:
        sys.exit(f"{LOGOS} is empty — run scripts/prepare-logos.py first")

    destination = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "logo-legibility.png")
    widest = max(SIZES)
    sheet = Image.new(
        "RGB",
        (PAD * 2 + sum(SIZES) + GAP * len(SIZES) + 90, PAD * 2 + HEADER + len(files) * (widest + GAP)),
        "white",
    )
    draw = ImageDraw.Draw(sheet)

    x = PAD + 90
    for size in SIZES:
        draw.text((x, 6), f"{size}px", fill="black")
        x += size + GAP

    y = PAD + HEADER
    for filename in files:
        source = Image.open(LOGOS / filename).convert("RGB")
        draw.text((PAD, y + widest // 2), filename[:-4], fill="#6E8883")
        x = PAD + 90
        for size in SIZES:
            mark, mask = circular(source, size)
            sheet.paste(mark, (x, y + (widest - size) // 2), mask)
            x += size + GAP
        y += widest + GAP

    sheet.save(destination)
    print(f"{len(files)} logos at {SIZES} -> {destination} ({sheet.size[0]}x{sheet.size[1]})")
    print("Open it at 100%. Anything faint at every size is artwork to redraw, not a frame to retune.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
