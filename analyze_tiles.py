#!/usr/bin/env python3
"""Analyze LimeZu tilesets to find correct tile indices for the HQ room."""
from PIL import Image
import json

T = 32
BASE = "public/assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32"

def get_tile_avg(img, col, row):
    """Get average RGBA color of a tile."""
    tile = img.crop((col * T, row * T, (col + 1) * T, (row + 1) * T))
    pixels = list(tile.getdata())
    if not pixels:
        return (0, 0, 0, 0)
    avg = tuple(sum(p[i] for p in pixels) // len(pixels) for i in range(4))
    return avg

def analyze_floors():
    """Find warm wood floor tiles."""
    img = Image.open(f"{BASE}/Room_Builder_Floors_32x32.png")
    w, h = img.size
    cols = w // T  # 15
    rows = h // T  # 40
    print(f"=== FLOORS: {cols} cols x {rows} rows ===")
    
    # Scan rows 2-15 for wood-colored tiles
    for r in range(2, 16):
        for c in range(cols):
            avg = get_tile_avg(img, c, r)
            if avg[3] > 200:  # Not transparent
                # Check if it's brown/tan/wood colored
                is_warm = avg[0] > 100 and avg[1] > 60 and avg[2] < avg[0] - 20
                label = "WOOD" if is_warm else "other"
                idx = r * cols + c  # 0-based tile index
                gid = idx + 1  # 1-based GID for Tiled
                print(f"  Row {r}, Col {c}: idx={idx}, gid={gid}, avg=RGBA{avg} [{label}]")

def analyze_walls():
    """Find cream/beige wall tiles."""
    img = Image.open(f"{BASE}/Room_Builder_Walls_32x32.png")
    w, h = img.size
    cols = w // T  # 32
    rows = h // T  # 40
    print(f"\n=== WALLS: {cols} cols x {rows} rows ===")
    
    # Wall tiles come in groups. Scan for cream/beige groups
    # Check rows 0-12, looking for groups of 3x3
    for r in range(0, 15):
        for c in range(0, cols, 3):
            # Check center tile of each 3x3 group
            if c + 2 < cols:
                avg = get_tile_avg(img, c + 1, r)
                if avg[3] > 200:
                    # Cream/beige: R > 180, G > 160, B > 130, not too gray
                    is_cream = avg[0] > 170 and avg[1] > 150 and avg[2] > 120 and (avg[0] - avg[2]) > 10
                    if is_cream:
                        idx = r * cols + c
                        gid = idx + 601  # walls firstgid
                        print(f"  Row {r}, Col {c}: center avg=RGBA{avg} [CREAM wall group]")
                        # Print all 9 tiles in the 3x3 block
                        for dr in range(3):
                            for dc in range(3):
                                tidx = (r + dr) * cols + (c + dc)
                                tgid = tidx + 601
                                tavg = get_tile_avg(img, c + dc, r + dr)
                                pos = ["TL","T","TR","L","C","R","BL","B","BR"][dr*3+dc]
                                print(f"    {pos}: col={c+dc} row={r+dr} idx={tidx} gid={tgid} avg=RGBA{tavg}")

def analyze_walls_detailed():
    """More detailed wall scan - look at every tile."""
    img = Image.open(f"{BASE}/Room_Builder_Walls_32x32.png")
    w, h = img.size
    cols = w // T  # 32
    rows = h // T  # 40
    print(f"\n=== WALLS DETAILED (rows 0-8): {cols} cols x {rows} rows ===")
    
    for r in range(0, 9):
        for c in range(cols):
            avg = get_tile_avg(img, c, r)
            if avg[3] > 100:
                idx = r * cols + c
                gid = idx + 601
                # Is it cream/beige?
                is_cream = avg[0] > 160 and avg[1] > 140 and avg[2] > 100
                is_gray = abs(avg[0] - avg[1]) < 15 and abs(avg[1] - avg[2]) < 15
                label = "CREAM" if (is_cream and not is_gray) else ("GRAY" if is_gray else "COLORED")
                print(f"  r={r} c={c}: gid={gid} RGBA{avg} [{label}]")

def analyze_shadows():
    """Find shadow tiles."""
    img = Image.open(f"{BASE}/Room_Builder_Floor_Shadows_32x32.png")
    w, h = img.size
    cols = w // T  # 16
    rows = h // T  # 5
    print(f"\n=== SHADOWS: {cols} cols x {rows} rows ===")
    
    for r in range(rows):
        for c in range(cols):
            avg = get_tile_avg(img, c, r)
            if avg[3] > 5:  # Any non-transparent
                idx = r * cols + c
                gid = idx + 1881  # shadows firstgid
                print(f"  Row {r}, Col {c}: idx={idx}, gid={gid}, avg=RGBA{avg}")

# Run all analyses
analyze_floors()
analyze_walls_detailed()
analyze_shadows()
