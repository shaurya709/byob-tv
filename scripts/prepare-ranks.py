"""
Turn the supplied rank numerals into tintable masks.

    python3 scripts/prepare-ranks.py

Reads the three screenshots in `public/assets/` — heavy black `1`, `2`, `3` on
white — and writes `public/ranks/{1,2,3}.png`: the same glyphs, trimmed, with
**alpha carrying the shape and the colour thrown away**.

── Why a mask and not a coloured PNG ──

The numerals have to sit on two different surfaces. On the board as it ships they
land on a white page and want to be dark; on the green treatment under
consideration they land on Deep Forest Green and want to be white. A baked
colour would mean two assets per numeral and a decision at every call site.

An alpha-only mask has no colour to be wrong. `mask-image` in CSS takes the
shape from this file and the paint from `background-color`, so one asset serves
both surfaces and the colour stays a token in `mesa-tv.css` — which is also what
keeps the never-hardcode-a-hex rule intact for something that is, in the source,
a black pixel.

── The alpha comes from luminance, not from a threshold ──

`alpha = 255 - luminance`, so a mid-grey antialiased edge pixel becomes a
mid-alpha edge pixel. Thresholding instead would give a hard-edged glyph that
crawls at the sizes the wall draws it — these are rendered around 40px on a
board read from six metres, which is exactly where aliasing shows.

The source is a screenshot, so it carries a white margin of no fixed size. Each
glyph is trimmed to its own ink before it is written, which is what lets the
component position all three by the same rule.
"""

import os
import re
from PIL import Image

SRC = "public/assets"
OUT = "public/ranks"


def mask_of(path):
    """The glyph as pure alpha, trimmed to its ink."""
    im = Image.open(path).convert("L")
    # Dark ink on a light ground: invert, so ink becomes opaque.
    alpha = Image.eval(im, lambda v: 255 - v)
    box = alpha.getbbox()
    if box is not None:
        alpha = alpha.crop(box)
    out = Image.new("RGBA", alpha.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    # The screenshots are named by capture time, and the three were taken in
    # rank order — 1, then 2, then 3. Sorting by name therefore sorts by rank.
    shots = sorted(f for f in os.listdir(SRC) if re.match(r"screenshot.*\.png$", f, re.I))
    if len(shots) != 3:
        print(f"expected 3 numeral screenshots in {SRC}/, found {len(shots)}:")
        for f in shots:
            print(f"  {f}")
        return

    for rank, name in enumerate(shots, start=1):
        mask = mask_of(os.path.join(SRC, name))
        mask.save(os.path.join(OUT, f"{rank}.png"))
        print(f"{name}  ->  {OUT}/{rank}.png  {mask.size}")


if __name__ == "__main__":
    main()
