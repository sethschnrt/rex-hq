#!/usr/bin/env python3
"""Check what wall tiles look like for side walls in LimeZu.
Side walls in LimeZu rooms alternate between two tile rows to avoid striping."""
from PIL import Image

T = 32
BASE = "public/assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32"

# The wall PNG at cols 18-20 has multiple row-pairs for different wall sections.
# For side walls (left column = col 18, right = col 20), we need to alternate
# between row pairs to create a non-repetitive pattern.

# Current: W_BL = 779 (row 5, col 18) for ALL left wall tiles - creates striping
# Better: Alternate between row 4 (gid 747) and row 5 (gid 779) for left wall
# Or use a different approach entirely

# Let me check what the wall tiles actually look like in rows 4-5 vs 6-7 etc
img = Image.open(f"{BASE}/Room_Builder_Walls_32x32.png")

# Extract the left/right wall tiles to see if alternating helps
preview = Image.new('RGBA', (4*T, 28*T), (40,40,40,255))

# Show alternating pattern for left wall (col 18)
for r in range(28):
    # Alternate between two row variants
    if r % 2 == 0:
        src_row = 4  # row 4 tile
    else:
        src_row = 5  # row 5 tile
    tile = img.crop((18*T, src_row*T, 19*T, (src_row+1)*T))
    preview.paste(tile, (0, r*T), tile)
    
    # Also show using just row 5
    tile5 = img.crop((18*T, 5*T, 19*T, 6*T))
    preview.paste(tile5, (T, r*T), tile5)
    
    # Right wall col 20 alternating
    if r % 2 == 0:
        src_row = 4
    else:
        src_row = 5
    tile = img.crop((20*T, src_row*T, 21*T, (src_row+1)*T))
    preview.paste(tile, (2*T, r*T), tile)
    
    # Right wall just row 5
    tile5 = img.crop((20*T, 5*T, 21*T, 6*T))
    preview.paste(tile5, (3*T, r*T), tile5)

preview.save("side_wall_preview.png")
print("Saved side_wall_preview.png")
print("Col 0: left wall alternating 4/5, Col 1: left wall row 5 only")
print("Col 2: right wall alternating 4/5, Col 3: right wall row 5 only")
