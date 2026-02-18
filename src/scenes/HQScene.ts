import Phaser from 'phaser';

const T = 32;
const ROOM_W = 352;  // 11 tiles
const ROOM_H = 320;  // 10 tiles

const DESIGN = 'assets/tilesets/limezu/6_Home_Designs/TV_Studio_Designs/32x32';
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
    // Pre-built room layers (artist-made, pixel-perfect)
    this.load.image('room-layer1', `${DESIGN}/Tv_Studio_Design_layer_1_32x32.png`);
    this.load.image('room-layer2', `${DESIGN}/Tv_Studio_Design_layer_2_32x32.png`);
    this.load.image('room-layer3', `${DESIGN}/Tv_Studio_Design_layer_3_32x32.png`);

    // Character spritesheets
    this.load.spritesheet('char01', `${CHAR_BASE}/Premade_Character_32x32_01.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('char02', `${CHAR_BASE}/Premade_Character_32x32_02.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('char03', `${CHAR_BASE}/Premade_Character_32x32_03.png`, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('char04', `${CHAR_BASE}/Premade_Character_32x32_04.png`, { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    // Layer 1: floor, walls, structure
    this.add.image(0, 0, 'room-layer1').setOrigin(0, 0).setDepth(0);

    // Layer 2: furniture, objects
    this.add.image(0, 0, 'room-layer2').setOrigin(0, 0).setDepth(1);

    // Layer 3: overlay (lights, effects above furniture)
    this.add.image(0, 0, 'room-layer3').setOrigin(0, 0).setDepth(3);

    // Characters sit between layer 2 and 3
    this.placeCharacters();
    this.setupCamera();
  }

  private placeCharacters() {
    // Place agents at workstation positions in the room
    // TV Studio has a row of stations around tile row 5-6

    const agents = [
      { name: 'Rex', sheet: 'char01', x: 5.5, y: 6 },
      { name: 'Claude', sheet: 'char02', x: 3.5, y: 6 },
      { name: 'Codex', sheet: 'char03', x: 7.5, y: 6 },
      { name: 'Gemini', sheet: 'char04', x: 5.5, y: 8 },
    ];

    for (const agent of agents) {
      const px = agent.x * T;
      const py = agent.y * T;

      const sprite = this.add.sprite(px, py, agent.sheet, 0);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(2); // between furniture (1) and overlay (3)

      // Gentle breathing animation
      this.tweens.add({
        targets: sprite,
        y: py - 1.5,
        duration: 1400 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Name label
      const label = this.add.text(px, py + 4, agent.name, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      });
      label.setOrigin(0.5, 0);
      label.setDepth(4);
    }
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, ROOM_W, ROOM_H);
    cam.centerOn(ROOM_W / 2, ROOM_H / 2);

    // Zoom to fill viewport
    const fitZoom = Math.max(cam.width / ROOM_W, cam.height / ROOM_H);
    cam.setZoom(fitZoom);

    // Scroll zoom
    this.input.on('wheel', (_p: any, _go: any, _dx: number, dy: number) => {
      const minZoom = Math.min(cam.width / ROOM_W, cam.height / ROOM_H);
      cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.002, minZoom, 5));
    });

    // Pan
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
