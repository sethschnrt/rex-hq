#!/usr/bin/env python3
"""Understand the LimeZu wall tile structure.

LimeZu walls have this vertical structure per 3-col group:
- Row pair 0-1: Top face of wall (what you see from above angle)  
- Row pair 2-3: Middle face variations
- Row pair 4-5: Front face of wall (what faces the player)
- Row pair 6-7: Another section
- Row pair 8-9: Yet another section

Each pair: row N = 3 tiles (TL/T/TR or L/C/R), row N+1 = 3 tiles

Actually let me re-examine. The wall PNG has 32 columns and 40 rows.
Walls come in 3-column groups (10+ groups per row set).
Each style has MULTIPLE rows for the wall structure.

The key insight: for LimeZu pre-built rooms with 2-tile tall walls:
- Row 0 of the wall = top of wall (the cap/top edge facing up)  
- Row 1 = front face of wall (what the player sees)

Then rows 2-3 are a second pairing (maybe another wall variant).
Rows 4-5 = third, rows 6-7 = fourth, rows 8-9 = fifth.

Each pair gives [L, C, R] in the 3 columns.

Let me check: for the gray set (cols 0-2):
Row 0: TL/T/TR top edge
Row 1: another row of wall  
Row 2: wall face left/center/right
Row 3: bottom edge?

Actually the pattern repeats every 2 rows with 3 columns each.
"""
from PIL import Image
import os

T = 32
BASE = "public/assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32"

def get_tile_avg(img, col, row):
    tile = img.crop((col * T, row * T, (col + 1) * T, (row + 1) * T))
    pixels = list(tile.getdata())
    return tuple(sum(p[i] for p in pixels) // len(pixels) for i in range(4))

def has_bottom_border(img, col, row):
    """Check if the bottom few pixels of a tile have a distinct line."""
    tile = img.crop((col * T, row * T, (col + 1) * T, (row + 1) * T))
    # Check last 4 pixel rows
    bottom_pixels = [tile.getpixel((x, T-1)) for x in range(T)]
    top_pixels = [tile.getpixel((x, 0)) for x in range(T)]
    bottom_avg = tuple(sum(p[i] for p in bottom_pixels) // len(bottom_pixels) for i in range(4))
    top_avg = tuple(sum(p[i] for p in top_pixels) // len(top_pixels) for i in range(4))
    return bottom_avg, top_avg

# The LimeZu Room Builder wall structure is:
# For each wall "style" (3 cols wide), there are rows arranged as:
# Rows 0-1: Wall variation 1 (2 tiles tall = standard room wall)
# Rows 2-3: Wall variation 2
# Rows 4-5: Wall variation 3  
# etc.
# 
# Within each 2-row block:
# Col 0 = left edge, Col 1 = center/fill, Col 2 = right edge
#
# For building a room:
# - Back wall top row: use row N, col 0 (left corner), col 1 (repeat), col 2 (right corner) 
# - Back wall bottom row: use row N+1, col 0, col 1, col 2
# - Side walls: these need a separate approach (or the same tiles rotated)
#
# Actually in LimeZu, the walls are purely facing the player. 
# Side walls = left column (col 0) for left wall, right column (col 2) for right wall
# The wall is 2 tiles tall, top row + bottom row.

# Let's look at how the current map USES the wall tiles
# Current map wall layer:
# Row 0: 793, 794x38, 795  (TL, T repeated, TR)
# Row 1: 825, 826x38, 827  (L, C repeated, R) 
# Row 2: 825, 858x38, 827  (L, base repeated, R)
# Row 3+: 825, 0x38, 827   (L, empty, R)

# So the current approach:
# gid 793 = wall TL (row 6, col 0) 
# gid 794 = wall T  (row 6, col 1)
# gid 795 = wall TR (row 6, col 2)
# gid 825 = wall L  (row 7, col 0)
# gid 826 = wall C  (row 7, col 1)  
# gid 827 = wall R  (row 7, col 2)
# gid 858 = baseboard center (row 8, col 1)

# For 2-tile walls, I need rows 6-7 ONLY (no row 8 baseboard)
# Row 6 = top of wall, Row 7 = bottom of wall
# This gives a 2-tile wall facing the player.

# For the CREAM/BEIGE version, I'll use the cols 18-20 group:
# Top row: gid 811 (TL), 812 (T), 813 (TR)  -- row 6
# Bottom row: gid 843 (L), 844 (C), 845 (R) -- row 7

# But wait - we need to understand which row pairs are for 
# TOP of wall vs BOTTOM of wall vs FRONT face

# Let me check border characteristics
img = Image.open(f"{BASE}/Room_Builder_Walls_32x32.png")

print("=== Gray wall border analysis (cols 0-2) ===")
for r in range(12):
    for c in range(3):
        avg = get_tile_avg(img, c, r)
        if avg[3] > 50:
            bottom, top = has_bottom_border(img, c, r)
            idx = r * 32 + c
            gid = idx + 601
            print(f"  r={r} c={c} gid={gid}: avg={avg}, top_row={top[:3]}, bottom_row={bottom[:3]}")

# Let me also check which shadow tiles are which  
print("\n=== Shadow tile mapping ===")
shadow_img = Image.open(f"{BASE}/Room_Builder_Floor_Shadows_32x32.png")
sw, sh = shadow_img.size
scols = sw // T
srows = sh // T
print(f"Shadow sheet: {scols} cols x {srows} rows")

# Need: top shadow (below back wall), left shadow (right of left wall), corner shadow (TL)
# Let me extract tiles and check their alpha patterns

for r in range(srows):
    for c in range(scols):
        avg = get_tile_avg(shadow_img, c, r)
        if avg[3] > 3:
            tile = shadow_img.crop((c*T, r*T, (c+1)*T, (r+1)*T))
            # Check which edges have more alpha
            left_alpha = sum(tile.getpixel((0, y))[3] for y in range(T)) / T
            right_alpha = sum(tile.getpixel((T-1, y))[3] for y in range(T)) / T
            top_alpha = sum(tile.getpixel((x, 0))[3] for x in range(T)) / T
            bottom_alpha = sum(tile.getpixel((x, T-1))[3] for x in range(T)) / T
            idx = r * scols + c
            gid = idx + 1881
            print(f"  r={r} c={c} gid={gid}: avg_alpha={avg[3]}, edges: L={left_alpha:.0f} R={right_alpha:.0f} T={top_alpha:.0f} B={bottom_alpha:.0f}")
