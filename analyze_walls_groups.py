#!/usr/bin/env python3
"""Analyze wall tiles in 3-column groups to find complete wall sets."""
from PIL import Image

T = 32
BASE = "public/assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32"

def get_tile_avg(img, col, row):
    tile = img.crop((col * T, row * T, (col + 1) * T, (row + 1) * T))
    pixels = list(tile.getdata())
    if not pixels:
        return (0, 0, 0, 0)
    return tuple(sum(p[i] for p in pixels) // len(pixels) for i in range(4))

img = Image.open(f"{BASE}/Room_Builder_Walls_32x32.png")
w, h = img.size
cols = w // T  # 32
rows = h // T  # 40

# The existing map uses gids 793-827 which maps to:
# 793 - 601 = 192 -> idx 192 -> row 6 (192/32=6), col 0 (192%32=0)
# 794 - 601 = 193 -> row 6, col 1
# 795 - 601 = 194 -> row 6, col 2
# 825 - 601 = 224 -> row 7, col 0
# 826 - 601 = 225 -> row 7, col 1
# 827 - 601 = 226 -> row 7, col 2
# 858 - 601 = 257 -> row 8 (257/32=8), col 1 (257%32=1)

print("=== Current wall tiles used (rows 6-8, cols 0-2): GRAY walls ===")
for r in range(6, 9):
    for c in range(3):
        idx = r * cols + c
        gid = idx + 601
        avg = get_tile_avg(img, c, r)
        print(f"  r={r} c={c}: gid={gid} RGBA{avg}")

# Now the cream/beige walls. Let's look at col 18-20 rows 6-8  
# (the group with CREAM labels from before)
print("\n=== Cream/beige wall group at cols 18-20: ===")
for r in range(6, 9):
    for c in range(18, 21):
        idx = r * cols + c
        gid = idx + 601
        avg = get_tile_avg(img, c, r)
        print(f"  r={r} c={c}: gid={gid} RGBA{avg}")

# Look at cols 11-13 (also had CREAM labels)
print("\n=== Another group at cols 11-13: ===")
for r in range(6, 9):
    for c in range(11, 14):
        idx = r * cols + c
        gid = idx + 601
        avg = get_tile_avg(img, c, r)
        print(f"  r={r} c={c}: gid={gid} RGBA{avg}")

# Now I need to understand the wall tile layout
# Walls come in groups: each group occupies 3 cols and some rows
# Let me look at walls rows 6-8, where the current gray walls are
# Row 6 = top row of wall, Row 7 = middle, Row 8 = bottom
# Cols 0-2 = TL/T/TR pattern

# For a room, I need:
# - Top-left corner wall (TL)
# - Top edge wall (T) 
# - Top-right corner wall (TR)
# - Left edge wall (L)
# - Right edge wall (R)
# - Bottom-left corner (BL)
# - Bottom edge (B)
# - Bottom-right corner (BR)
# 
# Looking at the layout: each 3-col group is one "style"
# Within each 3-col group, rows 6-8 appear to be the main wall face
# Row 6 = top of wall, Row 7 = mid, Row 8 = bottom

# Actually the wall PNG is organized differently. Let me look at more rows
print("\n=== Cream walls (cols 18-20) extended rows 0-11: ===")
for r in range(0, 12):
    for c in range(18, 21):
        idx = r * cols + c
        gid = idx + 601
        avg = get_tile_avg(img, c, r)
        if avg[3] > 50:
            print(f"  r={r} c={c}: gid={gid} RGBA{avg}")

# Gray walls (cols 0-2) extended
print("\n=== Gray walls (cols 0-2) extended rows 0-11: ===")
for r in range(0, 12):
    for c in range(3):
        idx = r * cols + c
        gid = idx + 601
        avg = get_tile_avg(img, c, r)
        if avg[3] > 50:
            print(f"  r={r} c={c}: gid={gid} RGBA{avg}")

# Check what the 3x3 groups look like for gray walls (cols 0-9)
# cols 0-2 = style 1, cols 3-5 = same style variant?, cols 6-8 = another variant?
# Each set: cols 0-2 have corner patterns, cols 3-5 have edge patterns, cols 6-8 have alternate corners

print("\n=== FULL gray wall area cols 0-9, rows 6-8: ===")
for r in range(6, 9):
    for c in range(10):
        idx = r * cols + c
        gid = idx + 601
        avg = get_tile_avg(img, c, r)
        if avg[3] > 50:
            print(f"  r={r} c={c}: gid={gid} RGBA{avg}")

# Let me look at what the cream/beige wall FULL set looks like
# The cream set starts at col 18. Let me check cols 18-20 rows 0-8 more carefully
print("\n=== Cream wall FULL cols 18-20, rows 0-11: ===")
for r in range(12):
    row_tiles = []
    for c in range(18, 21):
        avg = get_tile_avg(img, c, r)
        idx = r * cols + c
        gid = idx + 601
        if avg[3] > 50:
            row_tiles.append(f"c{c}:gid={gid} RGBA{avg}")
    if row_tiles:
        print(f"  r={r}: {', '.join(row_tiles)}")
