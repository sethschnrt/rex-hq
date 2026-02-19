import Phaser from 'phaser';

const T = 32;
const MAP_W = 20;
const MAP_H = 22;
const MAP_PX_W = MAP_W * T;
const MAP_PX_H = MAP_H * T;

const TILESET_BASE = 'assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32';
const THEME_BASE = 'assets/tilesets/limezu/1_Interiors/32x32/Theme_Sorter_32x32';

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
    this.load.image('basement', `${THEME_BASE}/14_Basement_32x32.png`);
    this.load.image('glass_door', 'assets/tilesets/limezu/glass_door_closed.png');
    this.load.image('classroom', `${THEME_BASE}/5_Classroom_and_library_32x32.png`);
    this.load.image('generic_theme', `${THEME_BASE}/1_Generic_32x32.png`);
    this.load.image('conference', `${THEME_BASE}/13_Conference_Hall_32x32.png`);
    this.load.image('livingroom', `${THEME_BASE}/2_LivingRoom_32x32.png`);
    this.load.image('furniture_singles', 'assets/tilesets/limezu/furniture_singles.png');
  }

  create() {
    const map = this.make.tilemap({ key: 'hq-map' });
    const floorTs = map.addTilesetImage('floors', 'floors')!;
    const wallTs = map.addTilesetImage('walls', 'walls')!;
    const w3dTs = map.addTilesetImage('walls3d', 'walls3d')!;
    const basementTs = map.addTilesetImage('basement', 'basement')!;
    const doorTs = map.addTilesetImage('glass_door', 'glass_door')!;
    const classTs = map.addTilesetImage('classroom', 'classroom')!;
    const genThemeTs = map.addTilesetImage('generic_theme', 'generic_theme')!;
    const confTs = map.addTilesetImage('conference', 'conference')!;
    const lrTs = map.addTilesetImage('livingroom', 'livingroom')!;
    const furnitureSinglesTs = map.addTilesetImage('furniture_singles', 'furniture_singles')!;

    const allTs = [floorTs, wallTs, w3dTs, basementTs, doorTs, classTs, genThemeTs, confTs, lrTs, furnitureSinglesTs];

    map.createLayer('floor', allTs)!.setDepth(0);
    map.createLayer('walls', allTs)!.setDepth(1);
    map.createLayer('walls3d', allTs)!.setDepth(2);
    map.createLayer('glass', allTs)!.setDepth(3);
    map.createLayer('furniture', allTs)!.setDepth(4);

    this.setupCamera();
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
