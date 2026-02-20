#!/usr/bin/env python3
"""Generate collision map overlay on top of the actual game render."""
import json, os, struct
from PIL import Image, ImageDraw, ImageFont

T = 32
SCALE = 4
ST = T * SCALE
MAP_W, MAP_H = 20, 22

with open('public/tiled/hq.json') as f:
    m = json.load(f)

layers = {l['name']: l for l in m['layers']}
tilesets_info = m['tilesets']

# Load tileset images
tileset_images = {}
for ts in tilesets_info:
    src = ts.get('image', '')
    if not src:
        continue
    path = os.path.join('public/tiled', src)
    if os.path.exists(path):
        tileset_images[ts['name']] = {
            'img': Image.open(path).convert('RGBA'),
            'firstgid': ts['firstgid'],
            'columns': ts.get('columns', 1),
            'tilewidth': ts.get('tilewidth', 32),
            'tileheight': ts.get('tileheight', 32),
        }

def get_tile_image(gid):
    """Get a 32x32 tile image from the appropriate tileset."""
    if gid <= 0:
        return None
    raw_gid = gid
    flipped_h = bool(gid & 0x80000000)
    flipped_v = bool(gid & 0x40000000)
    flipped_d = bool(gid & 0x20000000)
    gid = gid & 0x1FFFFFFF
    
    # Find tileset
    ts_info = None
    for ts in reversed(tilesets_info):
        if gid >= ts['firstgid']:
            ts_name = ts['name']
            if ts_name in tileset_images:
                ts_info = tileset_images[ts_name]
            break
    if not ts_info:
        return None
    
    local_id = gid - ts_info['firstgid']
    cols = ts_info['columns']
    tw = ts_info['tilewidth']
    th = ts_info['tileheight']
    sx = (local_id % cols) * tw
    sy = (local_id // cols) * th
    
    tile = ts_info['img'].crop((sx, sy, sx + tw, sy + th))
    
    if flipped_h:
        tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
    if flipped_v:
        tile = tile.transpose(Image.FLIP_TOP_BOTTOM)
    
    return tile

# Render the full map
W = MAP_W * ST
H = MAP_H * ST

# First render at native resolution, then scale up
native = Image.new('RGBA', (MAP_W * T, MAP_H * T), (30, 30, 40, 255))

layer_order = ['floor', 'walls', 'walls3d', 'glass', 'furniture']
for lname in layer_order:
    if lname not in layers:
        continue
    data = layers[lname]['data']
    for r in range(MAP_H):
        for c in range(MAP_W):
            gid = data[r * MAP_W + c]
            if gid <= 0:
                continue
            tile = get_tile_image(gid)
            if tile:
                native.paste(tile, (c * T, r * T), tile)

# Scale up
img = native.resize((W, H), Image.NEAREST)
draw = ImageDraw.Draw(img)

try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    font_sm = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 11)
except:
    font = ImageFont.load_default()
    font_sm = font

# Border colors (bright, visible over game art)
BORDER = {
    'wall': (180, 180, 200, 200),
    'walls3d': (160, 160, 190, 200),
    'glass_strip': (0, 200, 255, 255),
    'glass_none': (0, 100, 180, 120),
    'full': (255, 50, 50, 255),
    'bottom': (255, 180, 0, 255),
    'chair': (255, 255, 0, 255),
    'none_furn': (80, 80, 80, 0),  # invisible — no border for 'none'
    'door': (0, 255, 100, 255),
}
BORDER_W = 3

COLLISION_SHAPES = {
    6885:'none',6886:'none',6887:'none',6888:'none',6889:'none',6890:'none',
    6891:'chair',6892:'chair',6895:'bottom',6896:'bottom',6897:'bottom',6898:'bottom',
    6899:'none',6900:'none',6901:'chair',6902:'chair',6905:'none',6906:'none',
    6907:'none',6908:'none',6591:'none',6592:'none',6920:'none',6930:'bottom',
    6915:'none',6916:'none',6918:'none',6919:'none',6921:'bottom',6922:'bottom',6923:'bottom',
    6924:'none',6925:'none',6926:'full',6928:'full',6929:'full',6931:'full',6932:'full',
    6933:'none',6934:'bottom',6935:'bottom',6936:'bottom',6938:'bottom',6939:'bottom',
    6941:'full',6942:'full',6943:'none',6951:'none',6952:'none',6953:'none',
    6965:'bottom',6966:'bottom',6967:'bottom',6968:'bottom',6969:'chair',6970:'chair',
    6971:'chair',6972:'chair',6973:'chair',6974:'chair',6975:'bottom',6976:'bottom',
    6977:'bottom',6978:'bottom',6979:'chair',6980:'chair',6983:'chair',6984:'chair',
    6989:'chair',6990:'chair',6999:'chair',7000:'chair',7005:'none',7006:'none',
    7007:'none',7008:'none',7015:'full',7016:'full',7017:'full',7018:'full',
    7025:'chair',7026:'chair',7027:'none',7028:'none',
    7035:'none',7036:'none',7037:'none',7038:'none',7039:'none',7040:'none',
    7041:'none',7042:'none',7043:'none',7044:'none',7045:'none',7046:'none',
    7047:'none',7048:'none',7049:'none',7050:'none',7051:'none',7052:'none',
    7053:'none',7054:'none',7065:'none',7066:'none',7067:'none',7068:'none',
    7069:'none',7070:'none',7071:'none',7072:'none',7073:'none',7075:'none',
    7076:'none',7077:'none',7078:'none',7079:'none',7080:'none',7081:'none',
    7082:'none',7083:'none',
    7085:'none',7086:'none',7087:'none',  # removed per Seth
    7088:'bottom',7089:'bottom',7090:'bottom',
    7091:'none',7092:'none',7093:'none',
    7095:'bottom',7102:'none',7104:'none',
    7105:'bottom',7112:'full',7113:'full',7115:'full',
    7122:'bottom',7123:'bottom',7133:'bottom',
    7139:'full',7141:'full',7142:'full',7143:'none',
    7149:'full',7151:'full',7152:'full',
    7159:'none',7160:'none',7161:'none',
    7165:'none',7166:'none',7175:'full',7176:'full',
    7185:'none',7186:'none',
}

DOOR_GIDS = {4140, 4141, 4156, 4157}
W3D_FIRST, W3D_LAST = 1881, 3296

def draw_border(row, col, color, shape='full', label=None):
    x = col * ST
    y = row * ST
    bw = BORDER_W
    
    if shape == 'full':
        draw.rectangle([x+bw, y+bw, x+ST-bw-1, y+ST-bw-1], outline=color, width=bw)
    elif shape == 'bottom':
        draw.rectangle([x+bw, y+ST//2, x+ST-bw-1, y+ST-bw-1], outline=color, width=bw)
    elif shape == 'chair':
        cx, cy = x + ST//2, y + ST//2
        s = ST//4
        draw.rectangle([cx-s, cy-s, cx+s, cy+s], outline=color, width=bw)
    elif shape == 'strip_bottom':
        strip_h = int(8 * SCALE)
        draw.rectangle([x+bw, y+ST-strip_h-1, x+ST-bw-1, y+ST-bw-1], outline=color, width=bw)
    
    if label:
        text = str(label)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = x + (ST - tw) // 2
        ty = y + (ST - th) // 2
        # Dark background for readability
        draw.rectangle([tx-2, ty-1, tx+tw+2, ty+th+1], fill=(0, 0, 0, 180))
        draw.text((tx, ty), text, fill=(255, 255, 255), font=font)

tile_num = 1

# 1. Walls
wall_data = layers['walls']['data']
for r in range(MAP_H):
    for c in range(MAP_W):
        if wall_data[r * MAP_W + c] > 0:
            draw_border(r, c, BORDER['wall'], 'full')

# 2. Walls3d structural
w3d_data = layers['walls3d']['data']
for r in range(MAP_H):
    for c in range(MAP_W):
        raw_gid = w3d_data[r * MAP_W + c]
        if raw_gid <= 0:
            continue
        gid = raw_gid & 0x1FFFFFFF
        if W3D_FIRST <= gid <= W3D_LAST:
            draw_border(r, c, BORDER['walls3d'], 'full')

# 3. Glass
glass_data = layers['glass']['data']
glass_bottom_rows = {8, 16}
for r in range(MAP_H):
    for c in range(MAP_W):
        gid = glass_data[r * MAP_W + c]
        if gid <= 0:
            continue
        if gid in DOOR_GIDS:
            draw_border(r, c, BORDER['door'], 'full', 'D')
        elif r in glass_bottom_rows:
            draw_border(r, c, BORDER['glass_strip'], 'strip_bottom')
        else:
            draw_border(r, c, BORDER['glass_none'], 'full')

# 4. Furniture
furn_data = layers['furniture']['data']
for r in range(MAP_H):
    for c in range(MAP_W):
        gid = furn_data[r * MAP_W + c]
        if gid <= 0:
            continue
        shape = COLLISION_SHAPES.get(gid, 'full')
        if shape == 'none':
            continue  # no border for no-collision
        elif shape == 'full':
            draw_border(r, c, BORDER['full'], 'full', tile_num)
            tile_num += 1
        elif shape == 'bottom':
            draw_border(r, c, BORDER['bottom'], 'bottom', tile_num)
            tile_num += 1
        elif shape == 'chair':
            draw_border(r, c, BORDER['chair'], 'chair', tile_num)
            tile_num += 1

# Position-specific collision overrides (visual at one spot, collision at another)
# GID 6925 collision moved from (19,13) to (18,14)
draw_border(18, 14, BORDER['full'], 'full', tile_num)
tile_num += 1

# Legend at bottom
ly = H - 30
items = [
    ("Wall", BORDER['wall']),
    ("Glass 8px", BORDER['glass_strip']),
    ("Full", BORDER['full']),
    ("Bottom", BORDER['bottom']),
    ("Chair", BORDER['chair']),
    ("Door", BORDER['door']),
]
# Semi-transparent legend bar
overlay = Image.new('RGBA', (W, 35), (0, 0, 0, 160))
img.paste(Image.alpha_composite(Image.new('RGBA', (W, 35), (0,0,0,0)), overlay), (0, H - 35), overlay)
lx = 10
for label, color in items:
    draw.rectangle([lx, ly, lx+14, ly+14], outline=color, width=2)
    draw.text((lx+18, ly), label, fill=(220, 220, 230), font=font_sm)
    lx += 110

img.save('collision-map.png')
print(f'Saved collision-map.png ({W}x{H}), {tile_num - 1} numbered furniture tiles')
