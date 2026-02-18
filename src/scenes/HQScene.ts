import Phaser from 'phaser';

const T = 32;
const ROOM_W = 14;
const ROOM_H = 11;
const ROOM_PX_W = ROOM_W * T;
const ROOM_PX_H = ROOM_H * T;

const TILESET_BASE = 'assets/tilesets/limezu/1_Interiors/32x32';
const SINGLES = `${TILESET_BASE}/Theme_Sorter_Singles_32x32`;
const CHAR_BASE = 'assets/tilesets/limezu/2_Characters/Character_Generator/0_Premade_Characters/32x32';

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
    // Tilemap (floor + walls)
    this.load.tilemapTiledJSON('hq-map', 'tiled/hq.json');
    const rb = `${TILESET_BASE}/Room_Bulder_subfiles_32x32`;
    this.load.image('floors', `${rb}/Room_Builder_Floors_32x32.png`);
    this.load.image('walls', `${rb}/Room_Builder_Walls_32x32.png`);
    this.load.image('walls3d', `${rb}/Room_Builder_3d_walls_32x32.png`);

    // Furniture singles
    const conf = `${SINGLES}/13_Conference_Hall_Singles_32x32/Conference_Hall_Singles_32x32`;
    const cls = `${SINGLES}/5_Classroom_and_Library_Singles_32x32/Classroom_and_Library_Singles_32x32`;
    const lr = `${SINGLES}/2_Living_Room_Singles_32x32/Living_Room_Singles_32x32`;
    const tv = `${SINGLES}/23_Television_and_Film_Studio_SIngles_32x32/Television_and_FIlm_Studio_Singles_32x32`;

    // Desks with computers
    this.load.image('desk-pc-1', `${lr}_111.png`);    // 64x96 desk with monitor
    this.load.image('desk-pc-2', `${lr}_112.png`);    // 64x96 bookshelf/desk

    // Conference table (3 pieces)
    this.load.image('table-L', `${conf}_63.png`);     // 32x32
    this.load.image('table-M', `${conf}_64.png`);     // 32x32
    this.load.image('table-R', `${conf}_65.png`);     // 32x32

    // Whiteboard
    this.load.image('whiteboard', `${cls}_150.png`);   // 32x32

    // Monitors
    this.load.image('monitor', `${conf}_18.png`);      // 32x48

    // Plants & decor
    this.load.image('palm', `${lr}_14.png`);           // 64x64
    this.load.image('plant', `${lr}_15.png`);          // 32x64
    this.load.image('lamp', `${lr}_91.png`);           // 64x80

    // Chairs
    this.load.image('chair', `${conf}_57.png`);        // 32x32

    // Characters (32x32 tiles but characters span 2 rows = 32x64 effective)
    // We load as 32x32 and composite in create()
    this.load.spritesheet('char01', `${CHAR_BASE}/Premade_Character_32x32_01.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('char02', `${CHAR_BASE}/Premade_Character_32x32_02.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('char03', `${CHAR_BASE}/Premade_Character_32x32_03.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('char04', `${CHAR_BASE}/Premade_Character_32x32_04.png`, { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    // Tilemap layers
    const map = this.make.tilemap({ key: 'hq-map' });
    const floorTs = map.addTilesetImage('floors', 'floors')!;
    const wallTs = map.addTilesetImage('walls', 'walls')!;
    const w3dTs = map.addTilesetImage('walls3d', 'walls3d')!;

    map.createLayer('floor', [floorTs])!.setDepth(0);
    map.createLayer('walls', [wallTs])!.setDepth(1);
    map.createLayer('walls3d', [w3dTs])!.setDepth(2);

    this.placeFurniture();
    this.placeCharacters();
    this.setupCamera();
  }

  private placeFurniture() {
    // Helper: place sprite at tile coords, origin bottom-center for y-sorting
    const put = (key: string, tileX: number, tileY: number) => {
      const s = this.add.image(tileX * T, tileY * T, key);
      s.setOrigin(0, 1); // left-bottom anchor for precise tile placement
      s.setDepth(tileY * T); // y-sort: things further down are in front
      return s;
    };

    // === BACK WALL — conference table + monitors ===
    // Conference table against back wall (row 4)
    put('table-L', 5, 4);
    put('table-M', 6, 4);
    put('table-M', 7, 4);
    put('table-R', 8, 4);

    // Monitors on the wall above table (row 3, inside wall face)
    put('monitor', 5, 3);
    put('monitor', 8, 3);

    // Whiteboard on back wall left
    put('whiteboard', 3, 3);

    // === WORKSTATIONS — left and right sides ===
    // Left workstations
    put('desk-pc-1', 2, 7);
    put('desk-pc-1', 2, 10);

    // Right workstations
    put('desk-pc-1', 10, 7);
    put('desk-pc-1', 10, 10);

    // === CENTER — chairs around conference table ===
    put('chair', 5, 5);
    put('chair', 7, 5);

    // === DECOR ===
    // Palm trees near back corners (inside room)
    put('palm', 1, 5);
    put('palm', 11, 5);

    // Plants near front
    put('plant', 2, 3);
    put('plant', 11, 3);

    // Floor lamps mid-room sides
    put('lamp', 4, 9);
    put('lamp', 9, 9);
  }

  private placeCharacters() {
    // Characters are 2-row sprites in a 56-column sheet
    // Front-facing idle: head = col 4 row 0 (frame 4), body = col 4 row 1 (frame 60)
    const COLS = 56;
    const HEAD_FRAME = 4;  // front-facing idle head
    const BODY_FRAME = HEAD_FRAME + COLS; // same column, next row

    const agents = [
      { name: 'Rex', sheet: 'char01', x: 7, y: 7 },
      { name: 'Claude', sheet: 'char02', x: 2, y: 7 },
      { name: 'Codex', sheet: 'char03', x: 12, y: 7 },
      { name: 'Gemini', sheet: 'char04', x: 7, y: 9 },
    ];

    for (const agent of agents) {
      const px = agent.x * T + T / 2;
      const py = agent.y * T;

      // Head (top half)
      const head = this.add.sprite(px, py - T, agent.sheet, HEAD_FRAME);
      head.setOrigin(0.5, 1);
      head.setDepth(py + 5);

      // Body (bottom half)
      const body = this.add.sprite(px, py, agent.sheet, BODY_FRAME);
      body.setOrigin(0.5, 1);
      body.setDepth(py + 5);

      // Gentle idle bob on both parts
      const dur = 1400 + Math.random() * 400;
      this.tweens.add({
        targets: [head, body],
        y: '-=1.5',
        duration: dur,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Name label
      this.add.text(px, py + 4, agent.name, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5, 0).setDepth(9999);
    }
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, ROOM_PX_W, ROOM_PX_H);
    cam.centerOn(ROOM_PX_W / 2, ROOM_PX_H / 2);

    const fitZoom = Math.max(cam.width / ROOM_PX_W, cam.height / ROOM_PX_H);
    cam.setZoom(fitZoom);

    this.input.on('wheel', (_p: any, _go: any, _dx: number, dy: number) => {
      const minZ = Math.min(cam.width / ROOM_PX_W, cam.height / ROOM_PX_H);
      cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.002, minZ, 5));
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
