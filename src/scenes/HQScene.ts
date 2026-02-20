import Phaser from 'phaser';

const T = 32;
const MAP_W = 20;
const MAP_H = 22;
const MAP_PX_W = MAP_W * T;
const MAP_PX_H = MAP_H * T;
const SPEED = 100;

const TILESET_BASE = 'assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32';
const THEME_BASE = 'assets/tilesets/limezu/1_Interiors/32x32/Theme_Sorter_32x32';

/* ── Furniture collision config ──
 * Only floor-level obstacles get collision bodies.
 * Chairs, desk tops, monitors, paintings = no collision (Rex walks through/behind).
 */
/* Tiles with NO collision.
 * Wall-mounted items (paintings, monitors) have no floor presence.
 * Desk/table TOP surfaces don't collide — the body row below them does.
 * This prevents Rex's tall sprite (feet 1.5 tiles below center) from
 * getting caught on surfaces when walking in adjacent corridors.
 */
/* ── Per-GID collision shapes ──
 * 'none'    = no collision (wall-mounted, top of multi-tile, surface only)
 * 'full'    = full 32x32 tile
 * 'bottom'  = 32x16 bottom half of tile (standard for base of tall objects)
 * 'chair'   = 16x16 centered (small seat)
 * Default (not listed) = 'full'
 */
type CollisionShape = 'none' | 'full' | 'bottom' | 'chair';

const COLLISION_SHAPES: Record<number, CollisionShape> = {
  // ── Rex's Office ──
  6885: 'none', 6886: 'none', 6887: 'none', 6888: 'none', // r0: desk surface (monitors)
  6889: 'none', 6890: 'none',   // r0: painting top
  6891: 'chair', 6892: 'chair', // r0: chair top
  6895: 'bottom', 6896: 'bottom', 6897: 'bottom', 6898: 'bottom', // r1: desk body mid
  6899: 'none', 6900: 'none',   // r1: painting bottom
  6901: 'chair', 6902: 'chair', // r1: chair bottom
  6905: 'none', 6906: 'none', 6907: 'none', 6908: 'none', // r2: desk body base — removed per Seth
  // Bookshelf (#15-16) — livingroom tileset
  6591: 'none', 6592: 'none', // bookshelf base row — removed per Seth
  6920: 'none',  // r3c5: plant top (pot at row below)
  6930: 'bottom', // r4c5: plant pot

  // ── Lounge ──
  6915: 'none', 6916: 'none',   // r3c0-1: couch top (body below)
  6918: 'none', 6919: 'none',   // r3c3-4: couch top (body below)
  6921: 'bottom', 6922: 'bottom', 6923: 'bottom', // r3c6-8: TV unit top shelf
  6924: 'none',  // r3c9: cactus top (pot below)
  6925: 'none', 6926: 'full',   // r4c0-1: couch middle (6925 collision moved above 6926)
  6928: 'full', 6929: 'full',   // r4c3-4: couch middle
  6931: 'full', 6932: 'full', 6933: 'none', // r4c6-8: TV unit mid (6933 removed per Seth)
  6934: 'bottom', // r4c9: cactus pot
  6935: 'bottom', 6936: 'bottom', // r5c0-1: couch base
  6938: 'bottom', 6939: 'none', // r5c3-4: couch base (6939 removed per Seth)
  6941: 'full', 6942: 'full', 6943: 'none', // r5c6-8: TV unit bottom (6943 removed per Seth)
  6951: 'none', 6952: 'none', 6953: 'none', // r6c6-8: TV unit base — removed per Seth

  // ── Conference ──
  6965: 'full', 6966: 'full', 6967: 'bottom', 6968: 'bottom', // r8c0-3: table top
  6969: 'none', 6970: 'none', 6971: 'none', 6972: 'none', // conference chairs — removed per Seth
  6973: 'none', 6974: 'none', // conference chairs — removed per Seth
  6975: 'bottom', 6976: 'bottom', 6977: 'bottom', 6978: 'bottom', // r9c0-3: table bottom
  6979: 'none', 6980: 'none', // conference chairs — removed per Seth
  6983: 'none', 6984: 'none', // conference chairs — removed per Seth
  6989: 'none', 6990: 'none', // conference chairs — removed per Seth
  6999: 'none', 7000: 'none', // conference chairs — removed per Seth

  // ── Main Office ──
  7005: 'none', 7006: 'none', 7007: 'none', 7008: 'none', // r12: desk surface (monitors)
  7015: 'full', 7016: 'full',   // r13c0-1: desk body (upper pair)
  7017: 'full', 7018: 'full',   // r13c2-3: desk body (lower pair)
  7025: 'chair', 7026: 'chair', 7027: 'none', 7028: 'none', // r14: bottom office chairs — removed per Seth
  7035: 'none', 7036: 'none', 7037: 'none', 7038: 'none', // wall monitors
  7039: 'none', 7040: 'none', 7041: 'none', 7042: 'none',
  7043: 'none', 7044: 'none', 7045: 'none', 7046: 'none',
  7047: 'none', 7048: 'none', 7049: 'none', 7050: 'none',
  7051: 'none', 7052: 'none', 7053: 'none', 7054: 'none',
  // Palms (3 tiles tall each)
  7065: 'none', 7066: 'none', 7067: 'none', // r18: palm top
  7068: 'none', 7069: 'none', 7070: 'none',
  7071: 'none', 7072: 'none', 7073: 'none',
  7075: 'none', 7076: 'none', 7077: 'none', // r19: palm middle
  7078: 'none', 7079: 'none', 7080: 'none',
  7081: 'none', 7082: 'none', 7083: 'none',
  7085: 'none', 7086: 'none', 7087: 'none', // r20: palm pot/base — removed per Seth
  7088: 'none', 7089: 'none', 7090: 'none', // removed per Seth

  // ── Kitchen ──
  7095: 'bottom', // r21c0: counter bottom
  7102: 'none',   // r21c7: fridge top
  7104: 'none',   // r21c9: display fridge top
  7105: 'none', // r22c0: counter base — removed per Seth
  7112: 'full',   // r22c7: fridge middle
  7113: 'full',   // r22c8: display fridge middle
  7115: 'full',   // r23c0: counter middle
  7122: 'bottom', // r23c7: fridge bottom
  7123: 'bottom', // r23c8: display fridge bottom
  7133: 'bottom', // r24c8: display fridge base
  7139: 'full',   // r25c4: counter top row (has cabinet face)
  7141: 'full',   // r25c6: counter top
  7142: 'full',   // r25c7: counter top
  7143: 'none',   // r25c8: counter top surface
  7149: 'full',   // r26c4: counter middle
  7151: 'full',   // r26c6: counter middle
  7152: 'full',   // r26c7: counter middle
  7159: 'none', // r27c4: counter base — removed per Seth
  7160: 'none', // r27c5: counter base — removed per Seth
  7161: 'none', // r27c6: counter base — removed per Seth
  7165: 'none',   // r28c0: kitchen table top
  7166: 'none',   // r28c1: kitchen table top
  7175: 'full',   // r29c0: kitchen table middle
  7176: 'full',   // r29c1: kitchen table middle
  7185: 'none', // r30c0: kitchen table base — removed per Seth
  7186: 'none', // r30c1: kitchen table base — removed per Seth
};

/* ── Glass door animation config ── */
const DOOR_OPEN_DIST = T;           // how far each panel slides (1 tile)
const DOOR_SPEED = 3;               // tiles/sec slide speed
const DOOR_TRIGGER_RADIUS = 2.5;    // tiles from door center to trigger

interface GlassDoor {
  // 4 tile sprites: [topLeft, topRight, bottomLeft, bottomRight]
  sprites: Phaser.GameObjects.Sprite[];
  // Original x positions (closed)
  origX: number[];
  // Collider bodies
  colliders: Phaser.Physics.Arcade.Sprite[];
  // Center of the door (for distance check)
  cx: number;
  cy: number;
  // Animation state
  openAmount: number; // 0 = closed, 1 = fully open
  state: 'closed' | 'opening' | 'open' | 'closing';
}

export class HQScene extends Phaser.Scene {
  public player!: Phaser.Physics.Arcade.Sprite;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private wallLayer!: Phaser.Tilemaps.TilemapLayer;
  private walls3dLayer!: Phaser.Tilemaps.TilemapLayer;
  private glassLayer!: Phaser.Tilemaps.TilemapLayer;
  private furnitureSprites: Phaser.GameObjects.Sprite[] = [];
  private furnitureColliders!: Phaser.Physics.Arcade.StaticGroup;
  private lastDir: string = 'down';
  public doors: GlassDoor[] = [];
  private touchDir = { x: 0, y: 0 };

  constructor() {
    super({ key: 'HQScene' });
  }

  preload() {
    this.load.tilemapTiledJSON('hq-map', 'tiled/hq.json');
    this.load.image('floors', `${TILESET_BASE}/Room_Builder_Floors_32x32.png`);
    this.load.image('walls', `${TILESET_BASE}/Room_Builder_Walls_32x32.png`);
    this.load.image('walls3d', `${TILESET_BASE}/Room_Builder_3d_walls_32x32.png`);
    this.load.image('shadows', `${TILESET_BASE}/Room_Builder_Floor_Shadows_32x32.png`);
    this.load.image('basement', `${THEME_BASE}/14_Basement_32x32.png`);
    this.load.image('glass_door', 'assets/tilesets/limezu/glass_door_closed.png');
    this.load.image('classroom', `${THEME_BASE}/5_Classroom_and_library_32x32.png`);
    this.load.image('generic_theme', `${THEME_BASE}/1_Generic_32x32.png`);
    this.load.image('conference', `${THEME_BASE}/13_Conference_Hall_32x32.png`);
    this.load.image('livingroom', `${THEME_BASE}/2_LivingRoom_32x32.png`);
    this.load.image('furniture_singles', 'assets/tilesets/limezu/furniture_singles.png');

    this.load.spritesheet('rex-walk', 'assets/sprites/rex-walk.png', {
      frameWidth: T,
      frameHeight: T * 2,
    });
    this.load.spritesheet('rex-idle', 'assets/sprites/rex-idle.png', {
      frameWidth: T,
      frameHeight: T * 2,
    });
  }

  create() {
    const map = this.make.tilemap({ key: 'hq-map' });
    const floorTs = map.addTilesetImage('floors', 'floors')!;
    const wallTs = map.addTilesetImage('walls', 'walls')!;
    const w3dTs = map.addTilesetImage('walls3d', 'walls3d')!;
    const shadowsTs = map.addTilesetImage('shadows', 'shadows')!;
    const basementTs = map.addTilesetImage('basement', 'basement')!;
    const doorTs = map.addTilesetImage('glass_door', 'glass_door')!;
    const classTs = map.addTilesetImage('classroom', 'classroom')!;
    const genThemeTs = map.addTilesetImage('generic_theme', 'generic_theme')!;
    const confTs = map.addTilesetImage('conference', 'conference')!;
    const lrTs = map.addTilesetImage('livingroom', 'livingroom')!;
    const furnitureSinglesTs = map.addTilesetImage('furniture_singles', 'furniture_singles')!;

    const allTs = [floorTs, wallTs, w3dTs, shadowsTs, basementTs, doorTs, classTs, genThemeTs, confTs, lrTs, furnitureSinglesTs];

    // Background layers
    map.createLayer('floor', allTs)!.setDepth(0);
    this.wallLayer = map.createLayer('walls', allTs)!.setDepth(1);
    this.walls3dLayer = map.createLayer('walls3d', allTs)!.setDepth(2);
    this.glassLayer = map.createLayer('glass', allTs)!.setDepth(3);

    this.wallLayer.setCollisionByExclusion([-1]);
    this.walls3dLayer.setCollisionByExclusion([-1]);

    // Glass panels are solid walls — enable collision, then exclude door tiles
    // (doors are managed by the GlassDoor system with its own colliders)
    const DOOR_TILE_GIDS = new Set([4140, 4141, 4156, 4157]); // B763, B764, B779, B780
    this.glassLayer.setCollisionByExclusion([-1]);
    this.glassLayer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
      if (tile.index > 0 && DOOR_TILE_GIDS.has(tile.index)) {
        tile.setCollision(false, false, false, false);
      }
    });

    // Remove collision from non-structural tiles on walls3d layer
    // (furniture/decor placed on walls3d for z-index reasons, e.g. monitors, palm tops on glass rows)
    const W3D_FIRST = 1881;
    const W3D_LAST = 3296; // walls3d tileset range
    this.walls3dLayer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
      if (tile.index > 0 && (tile.index < W3D_FIRST || tile.index > W3D_LAST)) {
        tile.setCollision(false, false, false, false);
      }
    });

    // Layer depths match original approved visuals
    // walls=1, walls3d=2, glass=3, furniture sprites=10+ (y-sorted)

    // ── Build canvas lookup for tileset sources ──
    const tileCanvases = new Map<string, HTMLCanvasElement>();
    for (const ts of map.tilesets) {
      const src = this.textures.get(ts.name).getSourceImage() as HTMLImageElement;
      const cvs = document.createElement('canvas');
      cvs.width = src.width;
      cvs.height = src.height;
      cvs.getContext('2d')!.drawImage(src, 0, 0);
      tileCanvases.set(ts.name, cvs);
    }

    // ── Furniture: individual sprites for y-sorting ──
    this.furnitureColliders = this.physics.add.staticGroup();
    const furnitureLayerData = map.getLayer('furniture')!;

    for (let row = 0; row < furnitureLayerData.height; row++) {
      for (let col = 0; col < furnitureLayerData.width; col++) {
        const tileData = furnitureLayerData.data[row][col];
        if (!tileData || tileData.index === -1) continue;

        const gid = tileData.index;
        const flipped = tileData.flipX;

        let tileset: Phaser.Tilemaps.Tileset | null = null;
        for (let i = map.tilesets.length - 1; i >= 0; i--) {
          if (gid >= map.tilesets[i].firstgid) {
            tileset = map.tilesets[i];
            break;
          }
        }
        if (!tileset) continue;

        const localId = gid - tileset.firstgid;
        const tsColumns = tileset.columns;
        const srcX = (localId % tsColumns) * T;
        const srcY = Math.floor(localId / tsColumns) * T;

        const wx = col * T + T / 2;
        const wy = row * T + T / 2;

        const tileKey = `ft_${row}_${col}`;
        const dt = this.textures.createCanvas(tileKey, T, T)!;
        const srcCanvas = tileCanvases.get(tileset.name)!;

        if (flipped) {
          dt.context.save();
          dt.context.scale(-1, 1);
          dt.context.drawImage(srcCanvas, srcX, srcY, T, T, -T, 0, T, T);
          dt.context.restore();
        } else {
          dt.context.drawImage(srcCanvas, srcX, srcY, T, T, 0, 0, T, T);
        }
        dt.refresh();

        const sprite = this.add.sprite(wx, wy, tileKey);
        // Depth = bottom edge of this tile (row+1)*T, offset by 10 to stay above floor layers
        sprite.setDepth(10 + (row + 1) * T);
        this.furnitureSprites.push(sprite);

        // Per-GID collision shape — use explicit world positions
        const shape = COLLISION_SHAPES[gid] ?? 'full';
        if (shape !== 'none') {
          // Tile top-left in world coords
          const tx0 = col * T;
          const ty0 = row * T;
          let bx: number, by: number, bw: number, bh: number;

          if (shape === 'chair') {
            bw = 16; bh = 16;
            bx = tx0 + 8; by = ty0 + 8; // centered
          } else if (shape === 'bottom') {
            bw = T; bh = 16;
            bx = tx0; by = ty0 + 16; // bottom half
          } else {
            bw = T; bh = T;
            bx = tx0; by = ty0;
          }

          // Create a zone at center of collision area, then enable static physics
          const zone = this.add.zone(bx + bw / 2, by + bh / 2, bw, bh);
          this.physics.add.existing(zone, true); // true = static
          (zone.body as Phaser.Physics.Arcade.StaticBody).setSize(bw, bh);
          this.furnitureColliders.add(zone);
        }
      }
    }

    // ── Position-specific collision overrides ──
    // GID 6925 visual at (19,13) but collision belongs at (18,14) — directly above 6926
    {
      const bx = 14 * T, by = 18 * T, bw = T, bh = T;
      const zone = this.add.zone(bx + bw / 2, by + bh / 2, bw, bh);
      this.physics.add.existing(zone, true);
      (zone.body as Phaser.Physics.Arcade.StaticBody).setSize(bw, bh);
      this.furnitureColliders.add(zone);
    }

    // ── Glass Doors ──
    // Door tiles in the glass layer: B763 (top-left), B764 (top-right), B779 (bottom-left), B780 (bottom-right)
    // basement firstgid = 3377
    const DOOR_GIDS = new Set([3377 + 763, 3377 + 764, 3377 + 779, 3377 + 780]);
    const LEFT_GIDS = new Set([3377 + 763, 3377 + 779]);   // left panel tiles
    const TOP_GIDS = new Set([3377 + 763, 3377 + 764]);    // top row tiles

    // Find door groups: each door is a 2x2 block starting at top-left (B763)
    const glassLayerData = map.getLayer('glass')!;
    const doorPositions: { col: number; row: number }[] = [];

    for (let row = 0; row < glassLayerData.height; row++) {
      for (let col = 0; col < glassLayerData.width; col++) {
        const td = glassLayerData.data[row][col];
        if (td && td.index === 3377 + 763) {
          // Found top-left of a door
          doorPositions.push({ col, row });
        }
      }
    }

    for (const dp of doorPositions) {
      const sprites: Phaser.GameObjects.Sprite[] = [];
      const origXs: number[] = [];
      const colliders: Phaser.Physics.Arcade.Sprite[] = [];

      // Extract each of the 4 door tiles as sprites
      const offsets = [
        { dc: 0, dr: 0 }, // top-left (B763)
        { dc: 1, dr: 0 }, // top-right (B764)
        { dc: 0, dr: 1 }, // bottom-left (B779)
        { dc: 1, dr: 1 }, // bottom-right (B780)
      ];

      for (const off of offsets) {
        const tc = dp.col + off.dc;
        const tr = dp.row + off.dr;
        const td = glassLayerData.data[tr][tc];
        if (!td || td.index === -1) continue;

        const gid = td.index;
        let tileset: Phaser.Tilemaps.Tileset | null = null;
        for (let i = map.tilesets.length - 1; i >= 0; i--) {
          if (gid >= map.tilesets[i].firstgid) {
            tileset = map.tilesets[i];
            break;
          }
        }
        if (!tileset) continue;

        const localId = gid - tileset.firstgid;
        const tsColumns = tileset.columns;
        const srcX = (localId % tsColumns) * T;
        const srcY = Math.floor(localId / tsColumns) * T;

        const wx = tc * T + T / 2;
        const wy = tr * T + T / 2;

        // Create canvas texture for this door tile
        const tileKey = `door_${tr}_${tc}`;
        const dt = this.textures.createCanvas(tileKey, T, T)!;
        const srcCanvas = tileCanvases.get(tileset.name)!;
        dt.context.drawImage(srcCanvas, srcX, srcY, T, T, 0, 0, T, T);
        dt.refresh();

        const sprite = this.add.sprite(wx, wy, tileKey);
        sprite.setDepth(3.5); // just above glass layer
        sprites.push(sprite);
        origXs.push(wx);

        // Collider for this tile
        const col = this.furnitureColliders.create(wx, wy) as Phaser.Physics.Arcade.Sprite;
        col.setVisible(false);
        col.body!.setSize(T, T);
        col.refreshBody();
        colliders.push(col);

        // Hide the original tile on the glass layer
        td.setVisible(false);
      }

      // Door center
      const cx = (dp.col + 1) * T; // center between the 2 columns
      const cy = (dp.row + 1) * T; // center between the 2 rows

      this.doors.push({
        sprites,
        origX: origXs,
        colliders,
        cx,
        cy,
        openAmount: 0,
        state: 'closed',
      });
    }

    // ── Rex animations ──
    // Both spritesheets: row 0=down, 1=up, 2=left, 3=right (6 frames each)
    this.anims.create({
      key: 'walk-down',
      frames: this.anims.generateFrameNumbers('rex-walk', { start: 0, end: 5 }),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: 'walk-up',
      frames: this.anims.generateFrameNumbers('rex-walk', { start: 6, end: 11 }),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: 'walk-left',
      frames: this.anims.generateFrameNumbers('rex-walk', { start: 12, end: 17 }),
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: 'walk-right',
      frames: this.anims.generateFrameNumbers('rex-walk', { start: 18, end: 23 }),
      frameRate: 8, repeat: -1,
    });
    // Idle: subtle breathing animation (6 frames per direction)
    this.anims.create({
      key: 'idle-down',
      frames: this.anims.generateFrameNumbers('rex-idle', { start: 0, end: 5 }),
      frameRate: 4, repeat: -1,
    });
    this.anims.create({
      key: 'idle-up',
      frames: this.anims.generateFrameNumbers('rex-idle', { start: 6, end: 11 }),
      frameRate: 4, repeat: -1,
    });
    this.anims.create({
      key: 'idle-left',
      frames: this.anims.generateFrameNumbers('rex-idle', { start: 12, end: 17 }),
      frameRate: 4, repeat: -1,
    });
    this.anims.create({
      key: 'idle-right',
      frames: this.anims.generateFrameNumbers('rex-idle', { start: 18, end: 23 }),
      frameRate: 4, repeat: -1,
    });

    // ── Create Rex ──
    const startX = 5 * T + T / 2;
    const startY = 4 * T + T / 2;
    this.player = this.physics.add.sprite(startX, startY, 'rex-idle', 0);
    // Y-sort depth updated every frame in update()
    this.player.setDepth(10 + startY + 30);
    this.player.setSize(14, 14);
    this.player.setOffset(9, 48);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.wallLayer);
    this.physics.add.collider(this.player, this.walls3dLayer);
    // Glass: disable ALL tilemap collision — we handle it with custom bodies
    this.glassLayer.setCollisionByExclusion([]); // clear all collision
    this.glassLayer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
      tile.setCollision(false, false, false, false);
    });

    // Create custom collision bodies for glass:
    // - Top row (7, 15): NO collision — Rex walks into these from north, appears behind glass
    // - Bottom row (8, 16): Full collision — prevents walking through
    const glassBottomRows = [8, 16];
    const glassColliders = this.physics.add.staticGroup();
    const glassLD = map.getLayer('glass')!;
    for (const row of glassBottomRows) {
      for (let col = 0; col < MAP_W; col++) {
        const td = glassLD.data[row][col];
        if (!td || td.index <= 0) continue;
        // Skip door tiles
        if (DOOR_TILE_GIDS.has(td.index)) continue;
        // Thin 8px strip at the BOTTOM of the bottom glass row
        const stripH = 8;
        const zone = this.add.zone(col * T + T / 2, (row + 1) * T - stripH / 2, T, stripH);
        this.physics.add.existing(zone, true);
        (zone.body as Phaser.Physics.Arcade.StaticBody).setSize(T, stripH);
        glassColliders.add(zone);
      }
    }
    this.physics.add.collider(this.player, glassColliders);
    this.physics.add.collider(this.player, this.furnitureColliders);

    this.physics.world.setBounds(0, 0, MAP_PX_W, MAP_PX_H);

    // ── Input: WASD only (arrow keys conflict with browser scroll) ──
    this.keys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // ── Mobile touch d-pad ──
    this.createTouchControls();

    // Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_PX_W, MAP_PX_H);
    cam.setBackgroundColor('#1a1a2e');
  }

  private createTouchControls() {
    // Only show on touch devices
    if (!('ontouchstart' in window)) return;

    const pad = document.createElement('div');
    pad.id = 'dpad';
    pad.innerHTML = `
      <div class="dpad-row"><button data-dir="up">▲</button></div>
      <div class="dpad-row">
        <button data-dir="left">◀</button>
        <div class="dpad-spacer"></div>
        <button data-dir="right">▶</button>
      </div>
      <div class="dpad-row"><button data-dir="down">▼</button></div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #dpad {
        position: fixed; bottom: 24px; left: 24px; z-index: 9999;
        display: flex; flex-direction: column; align-items: center;
        user-select: none; -webkit-user-select: none;
        touch-action: none;
      }
      .dpad-row { display: flex; align-items: center; }
      .dpad-spacer { width: 56px; height: 56px; }
      #dpad button {
        width: 56px; height: 56px; border: none; border-radius: 10px;
        background: rgba(255,255,255,0.25); color: #fff; font-size: 22px;
        display: flex; align-items: center; justify-content: center;
        margin: 2px; -webkit-tap-highlight-color: transparent;
        touch-action: none;
      }
      #dpad button.active { background: rgba(255,255,255,0.5); }
    `;
    document.head.appendChild(style);
    document.body.appendChild(pad);

    const dirMap: Record<string, { x: number; y: number }> = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
    };

    const activeSet = new Set<string>();

    const update = () => {
      this.touchDir.x = 0;
      this.touchDir.y = 0;
      for (const d of activeSet) {
        this.touchDir.x += dirMap[d].x;
        this.touchDir.y += dirMap[d].y;
      }
    };

    pad.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement;
        const dir = el?.dataset?.dir;
        if (dir) { activeSet.add(dir); el.classList.add('active'); }
      }
      update();
    }, { passive: false });

    pad.addEventListener('touchmove', (e) => {
      e.preventDefault();
      // Clear all, re-detect
      activeSet.clear();
      pad.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      for (const t of Array.from(e.touches)) {
        const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement;
        const dir = el?.dataset?.dir;
        if (dir) { activeSet.add(dir); el.classList.add('active'); }
      }
      update();
    }, { passive: false });

    const endTouch = (e: TouchEvent) => {
      e.preventDefault();
      // Remove ended touches, re-check remaining
      activeSet.clear();
      pad.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      for (const t of Array.from(e.touches)) {
        const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement;
        const dir = el?.dataset?.dir;
        if (dir) { activeSet.add(dir); el.classList.add('active'); }
      }
      update();
    };
    pad.addEventListener('touchend', endTouch, { passive: false });
    pad.addEventListener('touchcancel', endTouch, { passive: false });
  }

  update(_time: number, delta: number) {
    const up = this.keys.W.isDown || this.touchDir.y < 0;
    const down = this.keys.S.isDown || this.touchDir.y > 0;
    const left = this.keys.A.isDown || this.touchDir.x < 0;
    const right = this.keys.D.isDown || this.touchDir.x > 0;

    const mx = (left ? -1 : 0) + (right ? 1 : 0);
    const my = (up ? -1 : 0) + (down ? 1 : 0);

    let vx = mx * SPEED;
    let vy = my * SPEED;

    if (mx !== 0 && my !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.setVelocity(vx, vy);

    // Y-sort: depth based on Rex's feet (bottom of collision box)
    // Sprite origin is center (0.5, 0.5) of 32x64, so top = player.y - 32
    // Collision offset Y from top = 48, height = 14 → feet = player.y - 32 + 48 + 14 = player.y + 30
    this.player.setDepth(10 + this.player.y + 30);

    const moving = mx !== 0 || my !== 0;

    if (moving) {
      if (mx !== 0 && my === 0) {
        this.lastDir = mx < 0 ? 'left' : 'right';
      } else if (my !== 0 && mx === 0) {
        this.lastDir = my < 0 ? 'up' : 'down';
      } else if (mx !== 0 && my !== 0) {
        this.lastDir = mx < 0 ? 'left' : 'right';
      }
      this.player.anims.play('walk-' + this.lastDir, true);
    } else {
      this.player.anims.play('idle-' + this.lastDir, true);
    }

    // Glass z-index: when Rex is inside a glass section, glass renders on top of him.
    // Glass sections: rows 7-8 (Y 224-288), rows 15-16 (Y 480-544)
    // Rex's feet Y = player.y + 30. Check if feet are inside a glass section.
    const feetY = this.player.y + 30;
    const inGlass = (feetY >= 7 * T && feetY < 9 * T) || (feetY >= 15 * T && feetY < 17 * T);
    this.glassLayer.setDepth(inGlass ? this.player.depth + 1 : 3);

    this.updateDoors(delta);
  }

  private updateDoors(delta: number) {
    const px = this.player.x;
    const py = this.player.y;
    const triggerDist = DOOR_TRIGGER_RADIUS * T;
    const step = (DOOR_SPEED * delta) / 1000; // fraction of full open per tick

    for (const door of this.doors) {
      const dist = Phaser.Math.Distance.Between(px, py, door.cx, door.cy);
      const inRange = dist < triggerDist;

      if (inRange && (door.state === 'closed' || door.state === 'closing')) {
        door.state = 'opening';
      } else if (!inRange && (door.state === 'open' || door.state === 'opening')) {
        door.state = 'closing';
      }

      if (door.state === 'opening') {
        door.openAmount = Math.min(door.openAmount + step, 1);
        if (door.openAmount >= 1) { door.openAmount = 1; door.state = 'open'; }
      } else if (door.state === 'closing') {
        door.openAmount = Math.max(door.openAmount - step, 0);
        if (door.openAmount <= 0) { door.openAmount = 0; door.state = 'closed'; }
      }

      // Slide panels: left 2 tiles slide left, right 2 tiles slide right
      // sprites order: [topLeft, topRight, bottomLeft, bottomRight]
      const slide = door.openAmount * DOOR_OPEN_DIST;
      // Ease for smooth feel
      const eased = Phaser.Math.Easing.Quadratic.InOut(door.openAmount) * DOOR_OPEN_DIST;

      door.sprites[0].x = door.origX[0] - eased; // top-left slides left
      door.sprites[1].x = door.origX[1] + eased; // top-right slides right
      door.sprites[2].x = door.origX[2] - eased; // bottom-left slides left
      door.sprites[3].x = door.origX[3] + eased; // bottom-right slides right

      // Colliders follow sprites
      for (let i = 0; i < 4; i++) {
        (door.colliders[i].body as Phaser.Physics.Arcade.StaticBody).x = door.sprites[i].x - T / 2;
        (door.colliders[i].body as Phaser.Physics.Arcade.StaticBody).y = door.sprites[i].y - T / 2;
      }

      // Disable collision once >50% open
      const passable = door.openAmount > 0.5;
      for (const c of door.colliders) {
        c.body!.enable = !passable;
      }
    }
  }
}
