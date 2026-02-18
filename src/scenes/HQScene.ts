import Phaser from 'phaser';

const T = 32;
const MAP_W = 28;
const MAP_H = 16;
const MAP_PX_W = MAP_W * T;
const MAP_PX_H = MAP_H * T;

const TILESET_BASE = 'assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32';
const ANIM_BASE = 'assets/tilesets/limezu/3_Animated_objects/32x32/spritesheets';

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
    this.load.image('floors', `${TILESET_BASE}/Room_Builder_Floors_32x32.png`);
    this.load.image('walls', `${TILESET_BASE}/Room_Builder_Walls_32x32.png`);
    this.load.image('walls3d', `${TILESET_BASE}/Room_Builder_3d_walls_32x32.png`);
    // Glass door spritesheets (16 frames, 32x96 each = 512x96 total)
    this.load.spritesheet('door-glass-left', `${ANIM_BASE}/animated_door_glass_vertical_left_32x32.png`, {
      frameWidth: 32, frameHeight: 96
    });
    this.load.spritesheet('door-glass-right', `${ANIM_BASE}/animated_door_glass_vertical_right_32x32.png`, {
      frameWidth: 32, frameHeight: 96
    });
  }

  create() {
    const map = this.make.tilemap({ key: 'hq-map' });
    const floorTs = map.addTilesetImage('floors', 'floors')!;
    const wallTs = map.addTilesetImage('walls', 'walls')!;
    const w3dTs = map.addTilesetImage('walls3d', 'walls3d')!;

    map.createLayer('floor', [floorTs])!.setDepth(0);
    map.createLayer('walls', [wallTs])!.setDepth(1);
    map.createLayer('walls3d', [w3dTs])!.setDepth(2);

    this.placeDoors();
    this.setupCamera();
  }

  private placeDoors() {
    // Door sprites are 32x96 (1x3 tiles). Origin top-left.
    // Placed at the wall opening between rooms. Frame 0 = closed.
    // Left wall doors (Main ↔ Rex, Main ↔ Kitchen): use glass-left
    // Right wall doors (Main ↔ Conference, Main ↔ Lounge): use glass-right

    const doors: { key: string; col: number; row: number }[] = [
      // Left doors (between Rex/Kitchen and Main)
      { key: 'door-glass-left', col: 8, row: 4 },   // Rex ↔ Main
      { key: 'door-glass-left', col: 8, row: 12 },   // Kitchen ↔ Main
      // Right doors (between Main and Conference/Lounge)
      { key: 'door-glass-right', col: 19, row: 4 },  // Main ↔ Conference
      { key: 'door-glass-right', col: 19, row: 12 }, // Main ↔ Lounge
    ];

    for (const d of doors) {
      const sprite = this.add.sprite(d.col * T, d.row * T, d.key, 0);
      sprite.setOrigin(0, 0);
      sprite.setDepth(3);
    }
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_PX_W, MAP_PX_H);
    cam.centerOn(MAP_PX_W / 2, MAP_PX_H / 2);
    const fitZoom = Math.min(cam.width / MAP_PX_W, cam.height / MAP_PX_H);
    cam.setZoom(fitZoom);
    cam.setBackgroundColor('#1a1a2e');

    this.input.on('wheel', (_p: any, _go: any, _dx: number, dy: number) => {
      const minZ = Math.min(cam.width / MAP_PX_W, cam.height / MAP_PX_H);
      cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.002, minZ, 5));
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = p.x; this.dragStartY = p.y;
      this.camStartX = cam.scrollX; this.camStartY = cam.scrollY;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      cam.scrollX = this.camStartX + (this.dragStartX - p.x) / cam.zoom;
      cam.scrollY = this.camStartY + (this.dragStartY - p.y) / cam.zoom;
    });
    this.input.on('pointerup', () => { this.isDragging = false; });
  }
}
