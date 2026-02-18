#!/usr/bin/env python3
"""Extract specific floor tile samples for visual comparison."""
from PIL import Image

T = 32
BASE = "public/assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32"

img = Image.open(f"{BASE}/Room_Builder_Floors_32x32.png")

# Build a comparison grid of candidate floor tiles
# Each row in preview = one candidate style
candidates = [
    ("A r6-7 (current)", [(0,6),(1,6),(2,6),(0,7),(1,7),(2,7)]),
    ("B r6-7 (current)", [(4,6),(5,6),(6,6),(4,7),(5,7),(6,7)]),
    ("B r10-11 diag?", [(4,10),(5,10),(6,10),(4,11),(5,11),(6,11)]),
    ("A r10-11 diag?", [(0,10),(1,10),(2,10),(0,11),(1,11),(2,11)]),
    ("B r2-3 light", [(4,2),(5,2),(6,2),(4,3),(5,3),(6,3)]),
    ("B r4-5 med", [(4,4),(5,4),(6,4),(4,5),(5,5),(6,5)]),
    ("B r8-9 dark", [(4,8),(5,8),(6,8),(4,9),(5,9),(6,9)]),
    ("A r12-13 gold", [(0,12),(1,12),(2,12),(0,13),(1,13),(2,13)]),
]

# Make a large preview: 6 tiles wide x len(candidates) tall, with labels
preview_w = 6 * T
preview_h = len(candidates) * T
preview = Image.new('RGBA', (preview_w, preview_h), (40, 40, 40, 255))

for i, (name, tiles) in enumerate(candidates):
    for j, (c, r) in enumerate(tiles):
        tile = img.crop((c*T, r*T, (c+1)*T, (r+1)*T))
        preview.paste(tile, (j * T, i * T), tile)

preview.save("floor_candidates.png")
print("Saved floor_candidates.png")

# Also make a 6x6 tiled preview of each candidate to see repeating pattern
for i, (name, tiles) in enumerate(candidates):
    tiled = Image.new('RGBA', (6*T, 6*T), (40,40,40,255))
    for row in range(6):
        for col in range(6):
            # The tiles alternate: use first 3 for even rows, second 3 for odd rows
            if row % 2 == 0:
                tidx = col % 3
            else:
                tidx = 3 + (col % 3)
            if tidx < len(tiles):
                c, r = tiles[tidx]
                tile = img.crop((c*T, r*T, (c+1)*T, (r+1)*T))
                tiled.paste(tile, (col*T, row*T), tile)
    tiled.save(f"floor_tiled_{i}.png")
    print(f"Saved floor_tiled_{i}.png - {name}")
