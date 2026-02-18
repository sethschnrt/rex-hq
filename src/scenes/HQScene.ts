import Phaser from 'phaser';

const T = 32;
const ROOM_W = 16;
const ROOM_H = 12;
const ROOM_PX_W = ROOM_W * T;
const ROOM_PX_H = ROOM_H * T;
const WALL_TOP = 3; // first floor row (after 3D wall top)

// ── Asset paths ──
const TILESET_BASE = 'assets/tilesets/limezu/1_Interiors/32x32';
const SINGLES = `${TILESET_BASE}/Theme_Sorter_Singles_32x32`;
const CHAR_PATH = 'assets/tilesets/limezu/2_Characters/Character_Generator/0_Premade_Characters/32x32/Premade_Character_32x32_01.png';

const lr = (n: number) => `${SINGLES}/2_Living_Room_Singles_32x32/Living_Room_Singles_32x32_${n}.png`;
const cl = (n: number) => `${SINGLES}/5_Classroom_and_Library_Singles_32x32/Classroom_and_Library_Singles_32x32_${n}.png`;
const ki = (n: number) => `${SINGLES}/12_Kitchen_Singles_32x32/Kitchen_Singles_32x32_${n}.png`;
const ch = (n: number) => `${SINGLES}/13_Conference_Hall_Singles_32x32/Conference_Hall_Singles_32x32_${n}.png`;
const tv = (n: number) => `${SINGLES}/23_Television_and_Film_Studio_SIngles_32x32/Television_and_FIlm_Studio_Singles_32x32_${n}.png`;

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
    this.load.image('walls3d', `${rb}/Room_Builder_3d_walls_32x32.png`);

    this.load.spritesheet('char01', CHAR_PATH, { frameWidth: 32, frameHeight: 32 });

    // Classroom: whiteboard, desks with agents
    for (const n of [150, 155, 156, 157, 158, 159]) {
      this.load.image(`cl${n}`, cl(n));
    }
    // Conference Hall: blue tables, armchairs, monitors
    for (const n of [18, 19, 40, 41, 53, 56, 57, 63, 64, 65]) {
      this.load.image(`ch${n}`, ch(n));
    }
    // Living Room: plants, lamps, computer desk
    for (const n of [12, 14, 15, 91, 111]) {
      this.load.image(`lr${n}`, lr(n));
    }
    // Kitchen: fridge, shelving
    for (const n of [117, 127, 159]) {
      this.load.image(`ki${n}`, ki(n));
    }
  }

  create() {
    const map = this.make.tilemap({ key: 'hq-map' });

    const floorTs = map.addTilesetImage('floors', 'floors')!;
    const wallTs = map.addTilesetImage('walls', 'walls')!;
    const w3dTs = map.addTilesetImage('walls3d', 'walls3d')!;

    map.createLayer('floor', [floorTs])!.setDepth(0);
    map.createLayer('walls', [wallTs])!.setDepth(1);
    map.createLayer('walls3d', [w3dTs])!.setDepth(2);

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

    const wb = WALL_TOP + 0.5; // against back wall (just below 3D wall shadow row)

    // ═══ BACK WALL — monitors + shelves, densely packed ═══
    put('lr14', 2, wb);           // palm left
    put('ch40', 3.5, wb);         // kiosk/cabinet
    put('ch18', 5, wb);           // blue monitor
    put('cl150', 7.5, wb);        // whiteboard (main screen)
    put('ch19', 10, wb);          // blue monitor
    put('ch40', 11.5, wb);        // kiosk/cabinet
    put('ch53', 13, wb);          // side table
    put('lr15', 14.5, wb);        // plant right

    // ═══ BOSS DESK (center, row 5) ═══
    put('cl155', 6.5, 5.5);       // person reading
    put('cl156', 9.5, 5.5);       // wooden desk
    put('ch57', 8, 5.5);          // armchair

    // ═══ WORKSTATIONS (rows 7-8) — 2 rows of desks ═══
    put('cl157', 3, 7.5);         // double desk + agents
    put('cl158', 6, 7.5);
    put('cl157', 10, 7.5);
    put('cl158', 13, 7.5);

    put('lr111', 3, 9.5);         // computer desk
    put('lr111', 6, 9.5);
    put('lr111', 10, 9.5);
    put('lr111', 13, 9.5);

    // ═══ SIDE ITEMS ═══
    put('lr91', 2, 6.5);          // floor lamp left
    put('ki159', 14, 6.5);        // fridge right
    put('lr12', 8, 10.5);         // light/plant center

    // ═══ BOTTOM CORNERS ═══
    put('lr14', 2, 11);           // palm BL
    put('lr15', 14.5, 11);        // plant BR
  }

  private placeCharacter() {
    const px = 8 * T;
    const py = 7 * T;
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

    const fitZoom = Math.max(
      cam.width / ROOM_PX_W,
      cam.height / ROOM_PX_H,
    );
    cam.setZoom(fitZoom);

    this.input.on('wheel', (_p: any, _go: any, _dx: number, dy: number) => {
      cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.001, fitZoom * 0.8, 4));
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
