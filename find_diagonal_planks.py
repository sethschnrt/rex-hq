#!/usr/bin/env python3
"""Find the diagonal plank floor tiles in the LimeZu floor tileset."""
from PIL import Image
import numpy as np

T = 32
BASE = "public/assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32"

img = Image.open(f"{BASE}/Room_Builder_Floors_32x32.png")
w, h = img.size
cols = w // T  # 15
rows = h // T  # 40

print(f"Floor tileset: {cols} cols x {rows} rows")
print(f"Each group of 4 cols (separated by transparent col) = one floor style")
print(f"Cols 0-2: style A, Col 3: separator")
print(f"Cols 4-6: style B, Col 7: separator")
print(f"Cols 8-10: style C, Col 11: separator")  
print(f"Cols 12-14: style D\n")

# The floor tileset layout: each style has 3 tiles per group arranged as
# light/medium/dark variants (for edge matching)
# Rows come in pairs: row N = pattern A, row N+1 = pattern B
# These alternate to create seamless tiling

# The issue: current tiles (row 6 col 4-6) create a checkerboard
# We need DIAGONAL PLANK tiles

# Let me examine all floor tiles to find diagonal patterns
# Diagonal planks have a distinctive angled edge pattern

def has_diagonal(img, col, row):
    """Check if tile has diagonal patterns by analyzing pixel transitions."""
    tile = img.crop((col*T, row*T, (col+1)*T, (row+1)*T))
    # Check the diagonal from top-left to bottom-right
    # Sample pixels along the diagonal
    diag_colors = [tile.getpixel((i, i)) for i in range(T)]
    # Check for color variation along diagonal (planks have wood grain)
    if diag_colors[0][3] < 50:
        return None
    
    # Check horizontal vs diagonal variance
    row_colors = [tile.getpixel((i, T//2)) for i in range(T)]
    
    # Count distinct color boundaries in the diagonal
    transitions = 0
    for i in range(1, len(diag_colors)):
        diff = sum(abs(diag_colors[i][j] - diag_colors[i-1][j]) for j in range(3))
        if diff > 30:
            transitions += 1
    
    return transitions

# Let me look at ALL warm wood styles and find the diagonal plank ones
# The floor styles in the tileset use groups of 3 columns
# with rows 2-3 being the lightest, then getting darker

# Let me save sample tiles as images to examine them
for style_name, col_start in [("A", 0), ("B", 4), ("C", 8), ("D", 12)]:
    print(f"=== Style {style_name} (cols {col_start}-{col_start+2}) ===")
    for r in range(2, 16):
        avgs = []
        for c in range(col_start, min(col_start + 3, cols)):
            tile = img.crop((c*T, r*T, (c+1)*T, (r+1)*T))
            pixels = list(tile.getdata())
            avg = tuple(sum(p[i] for p in pixels) // len(pixels) for i in range(4))
            if avg[3] > 200:
                diag = has_diagonal(img, c, r)
                idx = r * cols + c
                gid = idx + 1
                avgs.append(f"c{c}:gid={gid} RGB({avg[0]},{avg[1]},{avg[2]}) diag={diag}")
        if avgs:
            print(f"  Row {r}: {' | '.join(avgs)}")

# Save visual preview of the warm wood groups
preview = Image.new('RGBA', (4*3*T + 3*T, 14*T), (0,0,0,0))
for si, col_start in enumerate([0, 4, 8, 12]):
    for r in range(2, 16):
        for ci, c in enumerate(range(col_start, min(col_start+3, cols))):
            tile = img.crop((c*T, r*T, (c+1)*T, (r+1)*T))
            preview.paste(tile, ((si*3+ci+si)*T, (r-2)*T))

preview.save("floor_preview.png")
print("\nSaved floor_preview.png for visual inspection")
