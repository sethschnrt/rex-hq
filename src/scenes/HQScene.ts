import Phaser from 'phaser';

const T = 32;
const ROOM_W = 40;
const ROOM_H = 30;
const ROOM_PX_W = ROOM_W * T;
const ROOM_PX_H = ROOM_H * T;
const WALL_ROWS = 2;

// ── Asset paths ──
const TILESET_BASE = 'assets/tilesets/limezu/1_Interiors/32x32';
const SINGLES = `${TILESET_BASE}/Theme_Sorter_Singles_32x32`;
const CHAR_PATH = 'assets/tilesets/limezu/2_Characters/Character_Generator/0_Premade_Characters/32x32/Premade_Character_32x32_01.png';

const lr = (n: number) => `${SINGLES}/2_Living_Room_Singles_32x32/Living_Room_Singles_32x32_${n}.png`;
const cl = (n: number) => `${SINGLES}/5_Classroom_and_Library_Singles_32x32/Classroom_and_Library_Singles_32x32_${n}.png`;
const ki = (n: number) => `${SINGLES}/12_Kitchen_Singles_32x32/Kitchen_Singles_32x32_${n}.png`;
const ch = (n: number) => `${SINGLES}/13_Conference_Hall_Singles_32x32/Conference_Hall_Singles_32x32_${n}.png`;

export class HQScene extends Phaser.Scene {
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private camStartX = 0;
  private camStartY = 0;

  constructor() {
    super({ key: 'HQScene' });
  }

  preload() {
    this.load.tilemapTiledJSON('hq-map', 'tiled/hq.json');

    const rb = `${TILESET_BASE}/Room_Bulder_subfiles_32x32`;
    this.load.image('floors', `${rb}/Room_Builder_Floors_32x32.png`);
    this.load.image('walls', `${rb}/Room_Builder_Walls_32x32.png`);
    this.load.image('shadows', `${rb}/Room_Builder_Floor_Shadows_32x32.png`);

    this.load.spritesheet('char01', CHAR_PATH, { frameWidth: 32, frameHeight: 32 });

    for (const n of [1, 2, 12, 14, 15, 21, 22, 23, 24, 25, 34, 59, 62, 63, 64, 71, 87, 91, 111]) {
      this.load.image(`lr${n}`, lr(n));
    }
    for (const n of [150, 155, 156, 157, 158, 159, 166, 167, 171, 180, 181]) {
      this.load.image(`cl${n}`, cl(n));
    }
    for (const n of [1, 2, 3, 11, 12, 13, 14, 29, 47, 48]) {
      this.load.image(`ch${n}`, ch(n));
    }
    for (const n of [50, 51, 117, 127, 159]) {
      this.load.image(`ki${n}`, ki(n));
    }
  }

  create() {
    const map = this.make.tilemap({ key: 'hq-map' });

    const floorTs = map.addTilesetImage('floors', 'floors')!;
    const wallTs = map.addTilesetImage('walls', 'walls')!;
    const shadowTs = map.addTilesetImage('shadows', 'shadows')!;

    map.createLayer('floor', [floorTs])!.setDepth(0);
    map.createLayer('walls', [wallTs])!.setDepth(1);
    map.createLayer('shadows', [shadowTs])!.setDepth(2);

    this.placeFurniture();
    this.placeCharacter();
    this.setupCamera();
  }

  private placeFurniture() {
    const put = (key: string, tileX: number, tileY: number) => {
      const s = this.add.image(tileX * T, tileY * T, key);
      s.setOrigin(0.5, 1);
      s.setDepth(tileY * T + 10);
      return s;
    };

    // Wall bottom is at row 2. "Against wall" = y ≈ 3.5
    const wb = WALL_ROWS + 1.5; // 3.5

    // ═══════════════════════════════════════════════════
    // BACK WALL (left to right, densely packed)
    // ═══════════════════════════════════════════════════
    put('lr14', 2, wb);           // palm corner-left
    put('lr1', 4, wb);            // bookshelf
    put('lr1', 6, wb);            // bookshelf
    put('lr91', 8, wb);           // shelving
    put('cl180', 10.5, wb);       // library shelf L
    put('cl166', 13, wb);         // control panel L
    put('cl150', 15.5, wb);       // whiteboard
    put('cl167', 18, wb);         // control panel R
    put('cl181', 20.5, wb);       // library shelf R
    put('cl171', 23, wb);         // filing cabinet
    put('lr1', 25, wb);           // bookshelf
    put('lr91', 27, wb);          // shelving
    put('lr1', 29, wb);           // bookshelf
    put('lr1', 31, wb);           // bookshelf
    put('lr1', 33, wb);           // bookshelf
    put('lr1', 35, wb);           // bookshelf
    put('lr91', 37, wb);          // shelving
    put('lr15', 38.5, wb);        // tall palm corner-right

    // ═══════════════════════════════════════════════════
    // BOSS DESK (row 6, centered under command station)
    // ═══════════════════════════════════════════════════
    put('cl155', 14, 7);          // boss desk left
    put('cl156', 17, 7);          // boss desk right

    // ═══════════════════════════════════════════════════
    // LEFT WALL ITEMS (pushed against left wall, col 2-3)
    // ═══════════════════════════════════════════════════
    put('lr71', 2, 7);            // floor lamp
    put('lr2', 2, 10);            // cabinet
    put('lr12', 2, 12.5);         // small plant
    put('lr2', 2, 15);            // cabinet

    // ═══════════════════════════════════════════════════
    // WORKSTATION CLUSTER A (left side, rows 8-13)
    // 3 columns of 2 rows = 6 desks
    // ═══════════════════════════════════════════════════
    put('cl157', 5, 9.5);
    put('cl158', 8.5, 9.5);
    put('cl159', 5, 12.5);
    put('lr62', 8.5, 12.5);

    // ═══════════════════════════════════════════════════
    // WORKSTATION CLUSTER B (right side, rows 8-13)
    // ═══════════════════════════════════════════════════
    put('lr63', 24, 9.5);
    put('lr21', 27.5, 9.5);
    put('lr25', 31, 9.5);
    put('cl157', 35, 9.5);
    put('cl158', 24, 12.5);
    put('lr62', 27.5, 12.5);
    put('lr63', 31, 12.5);
    put('lr21', 35, 12.5);

    // ═══════════════════════════════════════════════════
    // WORKSTATION CLUSTER C (left-center, rows 15-18)
    // ═══════════════════════════════════════════════════
    put('cl159', 5, 16);
    put('lr25', 8.5, 16);
    put('lr21', 5, 19);
    put('cl157', 8.5, 19);

    // ═══════════════════════════════════════════════════
    // CONFERENCE TABLE (center, rows 16-20)
    // ═══════════════════════════════════════════════════
    put('ch11', 15, 19);
    put('ch12', 16.5, 19);
    put('ch13', 18, 19);
    put('ch14', 19.5, 19);
    // Chairs top side
    put('ch1', 15, 18);
    put('ch2', 17, 18);
    put('ch3', 19, 18);
    // Chairs bottom side
    put('ch1', 15, 20.5);
    put('ch2', 17, 20.5);
    put('ch3', 19, 20.5);

    // ═══════════════════════════════════════════════════
    // LOUNGE (bottom-left, rows 22-27)
    // ═══════════════════════════════════════════════════
    put('lr71', 2, 23);           // floor lamp by wall
    put('lr87', 3, 23);           // TV 
    put('lr22', 3, 25.5);         // couch left
    put('lr23', 5, 25.5);         // couch middle
    put('lr24', 7, 25.5);         // couch right
    put('lr34', 5, 27);           // coffee table
    put('lr111', 9, 26);          // armchair
    put('lr12', 10, 24);          // small plant

    // ═══════════════════════════════════════════════════
    // BREAK AREA (right side, rows 15-27, against right wall)
    // ═══════════════════════════════════════════════════
    put('ki159', 38, 16);         // fridge
    put('ki117', 36, 16);         // coffee maker next to fridge
    put('ki50', 38, 18);          // counter
    put('ki51', 38, 19.5);        // counter 2
    put('ki127', 36, 18.5);       // water cooler
    put('lr64', 34, 17.5);        // small table

    // ═══════════════════════════════════════════════════
    // WORKSTATION CLUSTER D (bottom-right, rows 22-27)
    // ═══════════════════════════════════════════════════
    put('lr25', 24, 24);
    put('cl158', 27.5, 24);
    put('lr62', 31, 24);
    put('cl159', 35, 24);

    // ═══════════════════════════════════════════════════
    // DIVIDER PLANTS (between zones)
    // ═══════════════════════════════════════════════════
    put('lr2', 12, 15.5);         // cabinet divider left
    put('lr12', 13, 15);          // plant on divider
    put('lr2', 22, 15.5);         // cabinet divider right
    put('lr12', 23, 15);          // plant

    // ═══════════════════════════════════════════════════
    // CORNER PLANTS (bottom)
    // ═══════════════════════════════════════════════════
    put('lr14', 2, 28.5);         // palm bottom-left
    put('lr15', 38, 28.5);        // tall palm bottom-right
  }

  private placeCharacter() {
    const px = 16 * T;
    const py = 8.5 * T;
    const rex = this.add.sprite(px, py, 'char01', 0);
    rex.setScale(1.5);
    rex.setOrigin(0.5, 1);
    rex.setDepth(py + 10);

    this.tweens.add({
      targets: rex,
      y: py - 2,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, ROOM_PX_W, ROOM_PX_H);
    cam.centerOn(ROOM_PX_W / 2, ROOM_PX_H / 2);

    const fitZoom = Math.min(cam.width / ROOM_PX_W, cam.height / ROOM_PX_H);
    cam.setZoom(Math.max(fitZoom, 0.5));

    this.input.on('wheel', (_p: any, _go: any, _dx: number, dy: number) => {
      cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.001, fitZoom * 0.8, 3));
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = p.x;
      this.dragStartY = p.y;
      this.camStartX = cam.scrollX;
      this.camStartY = cam.scrollY;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      cam.scrollX = this.camStartX + (this.dragStartX - p.x) / cam.zoom;
      cam.scrollY = this.camStartY + (this.dragStartY - p.y) / cam.zoom;
    });
    this.input.on('pointerup', () => { this.isDragging = false; });
  }
}
