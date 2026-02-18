#!/usr/bin/env python3
"""Build a professional LimeZu-style room map for Rex HQ."""
import json

W = 40   # map width in tiles
H = 30   # map height in tiles
WALL_ROWS = 2  # 2-tile tall back wall

# ── Floor tiles: Style B rows 10-11 (warm diagonal wood planks) ──
# Row 10: gid 155, 156, 157 (3 variants)
# Row 11: gid 170, 171, 172 (3 offset variants)
FLOOR_A = [155, 156, 157]  # even rows
FLOOR_B = [170, 171, 172]  # odd rows

# ── Wall tiles: Cream/beige cols 18-20 ──
# Using rows 4-5 for brighter cream walls
W_TL = 747; W_T = 748; W_TR = 749   # row 4 (back wall top)
W_BL = 779; W_BC = 780; W_BR = 781  # row 5 (back wall bottom)
# Side wall alternation tiles  
W_SIDE_L1 = 747; W_SIDE_R1 = 749   # row 4 variant
W_SIDE_L2 = 779; W_SIDE_R2 = 781   # row 5 variant

# ── Shadow tiles ──
SH_CORNER   = 1935  # r3,c6: inner corner (alpha~20)
SH_TOP      = 1936  # r3,c7: top edge (alpha~15)
SH_TOP_FADE = 1937  # r3,c8: top fade (alpha~8)
SH_LEFT     = 1951  # r4,c6: left edge (alpha~14)

def build_floor():
    """Floor layer: warm diagonal wood planks inside the walls."""
    data = [0] * (W * H)
    for row in range(WALL_ROWS, H - 1):
        for col in range(1, W - 1):
            tiles = FLOOR_A if row % 2 == 0 else FLOOR_B
            data[row * W + col] = tiles[(col + row // 2) % 3]
    return data

def build_walls():
    """Wall layer: 2-tile back wall + side walls + bottom wall."""
    data = [0] * (W * H)
    
    # Back wall top row (row 0)
    data[0] = W_TL
    for c in range(1, W - 1):
        data[c] = W_T
    data[W - 1] = W_TR
    
    # Back wall bottom row (row 1)
    data[W] = W_BL
    for c in range(1, W - 1):
        data[W + c] = W_BC
    data[2 * W - 1] = W_BR
    
    # Left wall (col 0, rows 2 to H-2) - alternate tiles for less striping
    for r in range(WALL_ROWS, H - 1):
        data[r * W] = W_SIDE_L1 if r % 2 == 0 else W_SIDE_L2
    
    # Right wall (col W-1, rows 2 to H-2)
    for r in range(WALL_ROWS, H - 1):
        data[r * W + W - 1] = W_SIDE_R1 if r % 2 == 0 else W_SIDE_R2
    
    # Bottom wall (row H-1)
    data[(H-1)*W] = W_BL
    for c in range(1, W - 1):
        data[(H-1)*W + c] = W_BC
    data[H*W - 1] = W_BR
    
    return data

def build_shadows():
    """Shadow layer: subtle interior shadow overlay."""
    data = [0] * (W * H)
    
    # Shadow below back wall (row 2)
    data[WALL_ROWS * W + 1] = SH_CORNER  # corner where back meets left wall shadow
    for c in range(2, W - 1):
        data[WALL_ROWS * W + c] = SH_TOP
    
    # Shadow right of left wall (col 1, rows 3+)
    for r in range(WALL_ROWS + 1, H - 1):
        data[r * W + 1] = SH_LEFT
    
    return data

# ── Assemble map ──
map_data = {
    "compressionlevel": -1,
    "height": H,
    "width": W,
    "infinite": False,
    "orientation": "orthogonal",
    "renderorder": "right-down",
    "tiledversion": "1.11.2",
    "tilewidth": 32,
    "tileheight": 32,
    "type": "map",
    "version": "1.10",
    "nextlayerid": 5,
    "nextobjectid": 1,
    "tilesets": [
        {
            "firstgid": 1,
            "name": "floors",
            "image": "../public/assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32/Room_Builder_Floors_32x32.png",
            "imagewidth": 480, "imageheight": 1280,
            "tilewidth": 32, "tileheight": 32,
            "tilecount": 600, "columns": 15,
            "margin": 0, "spacing": 0
        },
        {
            "firstgid": 601,
            "name": "walls",
            "image": "../public/assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32/Room_Builder_Walls_32x32.png",
            "imagewidth": 1024, "imageheight": 1280,
            "tilewidth": 32, "tileheight": 32,
            "tilecount": 1280, "columns": 32,
            "margin": 0, "spacing": 0
        },
        {
            "firstgid": 1881,
            "name": "shadows",
            "image": "../public/assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32/Room_Builder_Floor_Shadows_32x32.png",
            "imagewidth": 512, "imageheight": 160,
            "tilewidth": 32, "tileheight": 32,
            "tilecount": 80, "columns": 16,
            "margin": 0, "spacing": 0
        }
    ],
    "layers": [
        {"id":1, "name":"floor", "type":"tilelayer", "width":W, "height":H, "x":0, "y":0, "visible":True, "opacity":1, "data": build_floor()},
        {"id":2, "name":"walls", "type":"tilelayer", "width":W, "height":H, "x":0, "y":0, "visible":True, "opacity":1, "data": build_walls()},
        {"id":3, "name":"shadows", "type":"tilelayer", "width":W, "height":H, "x":0, "y":0, "visible":True, "opacity":1, "data": build_shadows()},
    ]
}

with open("public/tiled/hq.json", 'w') as f:
    json.dump(map_data, f, indent=2)

print("✅ Map rebuilt with diagonal wood plank floors")
f = build_floor(); w = build_walls(); s = build_shadows()
print(f"   Floor tiles: {sum(1 for x in f if x)}, Wall tiles: {sum(1 for x in w if x)}, Shadow tiles: {sum(1 for x in s if x)}")
