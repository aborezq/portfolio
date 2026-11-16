# Assembles the frames _src/readme.js captured into an animated GIF.
#   python3 _src/readme_gif.py <frames dir> <out.gif>
# The frames dir holds frame-NNN.png and frames.json:
#   {"bg": "#0d1117", "inks": ["#d9b36a", ...], "frames": [[file, milliseconds], ...]}
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

frames_dir, out = Path(sys.argv[1]), sys.argv[2]
plan = json.loads((frames_dir / "frames.json").read_text())

images, durations = [], []
for name, ms in plan["frames"]:
    im = Image.open(frames_dir / name).convert("RGB")
    # Identical neighbours (a held word, a steady caret) become one longer frame.
    if images and im.tobytes() == images[-1].tobytes():
        durations[-1] += ms
        continue
    images.append(im)
    durations.append(ms)

# The palette is built, not guessed: the exact page colour (so the GIF has no
# visible box on GitHub), each text colour, and every blend between page and
# ink that anti-aliased letter edges use.
hex_rgb = lambda h: tuple(int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
bg, inks = hex_rgb(plan["bg"]), [hex_rgb(c) for c in plan["inks"]]
steps = 255 // len(inks)
colours = [bg] + [tuple(round(b + (k / (steps - 1)) * (c - b)) for b, c in zip(bg, ink)) for ink in inks for k in range(1, steps)]
table = np.array(colours, dtype=np.int32)
flat_palette = [v for colour in colours for v in colour]


def to_palette(im):
    # Exact nearest colour. Pillow's own mapping is approximate, and with many
    # near-white blends in the palette it turned the page white off-white.
    rgb = np.asarray(im, dtype=np.int32).reshape(-1, 3)
    unique, inverse = np.unique(rgb, axis=0, return_inverse=True)
    nearest = ((unique[:, None, :] - table[None, :, :]) ** 2).sum(-1).argmin(1)
    out = Image.fromarray(nearest[inverse.ravel()].astype(np.uint8).reshape(im.height, im.width), mode="P")
    out.putpalette(flat_palette)
    return out


frames = [to_palette(im) for im in images]
frames[0].save(out, save_all=True, append_images=frames[1:], duration=durations, loop=0, optimize=False, disposal=1)
print(f"{out}: {len(frames)} frames, {sum(durations) / 1000:.1f} s loop")
