import Phaser from 'phaser';

const T = 32;
const ROOM_W = 14;
const ROOM_H = 11;
const ROOM_PX_W = ROOM_W * T;
const ROOM_PX_H = ROOM_H * T;

const TILESET_BASE = 'assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32';

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
  }

  create() {
    const map = this.make.tilemap({ key: 'hq-map' });
    const floorTs = map.addTilesetImage('floors', 'floors')!;
    const wallTs = map.addTilesetImage('walls', 'walls')!;
    const w3dTs = map.addTilesetImage('walls3d', 'walls3d')!;

    map.createLayer('floor', [floorTs])!.setDepth(0);
    map.createLayer('walls', [wallTs])!.setDepth(1);
    map.createLayer('walls3d', [w3dTs])!.setDepth(2);

    this.setupCamera();
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, ROOM_PX_W, ROOM_PX_H);
    cam.centerOn(ROOM_PX_W / 2, ROOM_PX_H / 2);
    // Fit entire room in viewport (no clipping)
    const fitZoom = Math.min(cam.width / ROOM_PX_W, cam.height / ROOM_PX_H);
    cam.setZoom(fitZoom);
    cam.setBackgroundColor('#1a1a2e');

    this.input.on('wheel', (_p: any, _go: any, _dx: number, dy: number) => {
      const minZ = Math.min(cam.width / ROOM_PX_W, cam.height / ROOM_PX_H);
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
