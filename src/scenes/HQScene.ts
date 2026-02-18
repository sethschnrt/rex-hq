import Phaser from 'phaser';

const T = 32;
const ROOM_W = 30;
const ROOM_H = 22;
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

    // Living Room: plants, lamps, sofas, piano
    for (const n of [14, 15, 71, 87, 91, 111, 63, 64, 12, 22, 23, 24, 34, 59]) {
      this.load.image(`lr${n}`, lr(n));
    }
    // Classroom: whiteboard, desks with students, bookshelves
    for (const n of [150, 155, 156, 157, 158, 159, 166, 167, 171, 180, 181]) {
      this.load.image(`cl${n}`, cl(n));
    }
    // Conference Hall: tables, chairs, monitors, panels, cabinets
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 18, 19, 25, 26, 27, 37, 38, 39, 40, 41, 43, 51, 52, 53, 56, 57, 63, 64, 65]) {
      this.load.image(`ch${n}`, ch(n));
    }
    // Kitchen: fridge, coffee, counter
    for (const n of [50, 51, 117, 127, 159]) {
      this.load.image(`ki${n}`, ki(n));
    }
    // TV Studio: monitors, cameras, screens
    const tv = (n: number) => `${SINGLES}/23_Television_and_Film_Studio_SIngles_32x32/Television_and_FIlm_Studio_Singles_32x32_${n}.png`;
    for (const n of [1, 2, 28, 29, 30, 55, 56, 57, 58, 59, 60, 61, 62, 71]) {
      this.load.image(`tv${n}`, tv(n));
    }
    // Condominium: modern shelves
    const cd = (n: number) => `${SINGLES}/26_Condominium_Singles_32x32/Condominium_Singles_32x32_${n}.png`;
    for (const n of [1, 2, 3, 41, 42, 53, 77, 78]) {
      this.load.image(`cd${n}`, cd(n));
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

    const wb = WALL_ROWS + 1.5; // against back wall

    // ═══ BACK WALL — monitors, shelves, tech ═══
    put('lr14', 1.5, wb);         // palm left
    put('cd41', 3, wb);           // metal shelf
    put('ch53', 4.5, wb);         // side table (small)
    put('ch18', 6, wb);           // blue monitor
    put('cl150', 8.5, wb);        // whiteboard / big screen
    put('ch19', 11, wb);          // blue monitor
    put('cl180', 13, wb);         // red keyboard/synth
    put('cl166', 15, wb);         // red keyboard
    put('cl150', 17.5, wb);       // whiteboard / big screen
    put('cl167', 20, wb);         // keyboard/piano
    put('ch18', 22, wb);          // blue monitor
    put('cd42', 24, wb);          // metal shelf
    put('ch53', 25.5, wb);        // side table
    put('cd41', 27, wb);          // metal shelf
    put('lr15', 29, wb);          // plant right

    // ═══ BOSS STATION (center, row 5-6) ═══
    put('cl155', 13, 6);          // person reading at desk
    put('cl156', 17, 6);          // wooden desk
    put('ch57', 15, 6);           // armchair (boss seat)

    // ═══ WORKSTATIONS LEFT (rows 7.5-10.5) ═══
    put('cl157', 3, 8);           // double desk w/ agents
    put('cl158', 6.5, 8);
    put('cl157', 3, 10.5);
    put('cl159', 6.5, 10.5);

    // ═══ WORKSTATIONS RIGHT (rows 7.5-10.5) ═══
    put('cl157', 22, 8);
    put('cl158', 25.5, 8);
    put('cl159', 22, 10.5);
    put('cl157', 25.5, 10.5);

    // ═══ CENTER DESKS (individual, rows 8-10.5) ═══
    put('lr111', 11, 8.5);        // desk + computer
    put('lr111', 11, 10.5);
    put('lr111', 18.5, 8.5);
    put('lr111', 18.5, 10.5);

    // ═══ CONFERENCE TABLE (rows 13-16) — blue table ch63-65 ═══
    put('ch63', 12, 14.5);        // table left
    put('ch64', 13.5, 14.5);      // table mid
    put('ch64', 15, 14.5);        // table mid
    put('ch65', 16.5, 14.5);      // table right
    put('ch57', 12, 13.5);        // armchair top
    put('ch57', 14, 13.5);
    put('ch57', 16, 13.5);
    put('ch57', 12, 16);          // armchair bottom
    put('ch57', 14, 16);
    put('ch57', 16, 16);

    // ═══ LOUNGE (bottom-left, rows 13-18) ═══
    put('lr91', 1.5, 14);         // floor lamp
    put('ch56', 3.5, 16);         // bench/couch
    put('ch57', 6, 16);           // armchair
    put('ch53', 3.5, 17.5);       // side table (coffee table)
    put('tv71', 2, 14);           // monitor on wall

    // ═══ BREAK AREA (bottom-right, rows 13-18) ═══
    put('ki159', 28.5, 14);       // fridge
    put('ki117', 26.5, 14);       // shelving
    put('ki127', 28.5, 16);       // shelf w items
    put('ki50', 26.5, 16.5);      // red counter
    put('lr91', 25, 15);          // floor lamp

    // ═══ BOTTOM WORKSTATIONS (rows 18-20) ═══
    put('cl157', 9, 19);
    put('cl158', 12.5, 19);
    put('cl157', 17, 19);
    put('cl158', 20.5, 19);

    // ═══ PLANTS & DECOR ═══
    put('lr14', 1.5, 20.5);       // palm bottom-left
    put('lr15', 29, 20.5);        // plant bottom-right
    put('lr12', 9.5, 12);         // light fixture
    put('lr12', 20, 12);          // light fixture
  }

  private placeCharacter() {
    const px = 14.5 * T;
    const py = 8 * T;
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
