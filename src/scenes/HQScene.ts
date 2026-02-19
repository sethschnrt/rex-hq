import Phaser from 'phaser';

const T = 32;
const MAP_W = 20;
const MAP_H = 22;
const MAP_PX_W = MAP_W * T;
const MAP_PX_H = MAP_H * T;
const SPEED = 120;

const TILESET_BASE = 'assets/tilesets/limezu/1_Interiors/32x32/Room_Bulder_subfiles_32x32';
const THEME_BASE = 'assets/tilesets/limezu/1_Interiors/32x32/Theme_Sorter_32x32';

export class HQScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private wallLayer!: Phaser.Tilemaps.TilemapLayer;
  private walls3dLayer!: Phaser.Tilemaps.TilemapLayer;
  private furnitureLayer!: Phaser.Tilemaps.TilemapLayer;

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

    // Rex spritesheet: 6 frames x 4 directions (down, up, left, right)
    this.load.spritesheet('rex', 'assets/sprites/rex-walk.png', {
      frameWidth: T,
      frameHeight: T,
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

    // Create layers with depth
    map.createLayer('floor', allTs)!.setDepth(0);
    this.wallLayer = map.createLayer('walls', allTs)!.setDepth(1);
    this.walls3dLayer = map.createLayer('walls3d', allTs)!.setDepth(2);
    map.createLayer('glass', allTs)!.setDepth(3);
    this.furnitureLayer = map.createLayer('furniture', allTs)!.setDepth(4);

    // Set collision on walls and furniture
    this.wallLayer.setCollisionByExclusion([-1]);
    this.walls3dLayer.setCollisionByExclusion([-1]);
    this.furnitureLayer.setCollisionByExclusion([-1]);

    // Create Rex animations
    this.anims.create({
      key: 'walk-down',
      frames: this.anims.generateFrameNumbers('rex', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'walk-up',
      frames: this.anims.generateFrameNumbers('rex', { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'walk-left',
      frames: this.anims.generateFrameNumbers('rex', { start: 12, end: 17 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'walk-right',
      frames: this.anims.generateFrameNumbers('rex', { start: 18, end: 23 }),
      frameRate: 10,
      repeat: -1,
    });

    // Idle animations (just first frame of each direction)
    this.anims.create({ key: 'idle-down', frames: [{ key: 'rex', frame: 0 }], frameRate: 1 });
    this.anims.create({ key: 'idle-up', frames: [{ key: 'rex', frame: 6 }], frameRate: 1 });
    this.anims.create({ key: 'idle-left', frames: [{ key: 'rex', frame: 12 }], frameRate: 1 });
    this.anims.create({ key: 'idle-right', frames: [{ key: 'rex', frame: 18 }], frameRate: 1 });

    // Create Rex sprite — start in Rex's office (center of room 0,0,10,7)
    const startX = 5 * T + T / 2;
    const startY = 4 * T + T / 2;
    this.player = this.physics.add.sprite(startX, startY, 'rex', 0);
    this.player.setDepth(3.5); // Between glass and furniture
    this.player.setSize(16, 16); // Smaller collision box
    this.player.setOffset(8, 14); // Offset to feet area
    this.player.setCollideWorldBounds(true);

    // Collide with walls and furniture
    this.physics.add.collider(this.player, this.wallLayer);
    this.physics.add.collider(this.player, this.walls3dLayer);
    this.physics.add.collider(this.player, this.furnitureLayer);

    // Set world bounds
    this.physics.world.setBounds(0, 0, MAP_PX_W, MAP_PX_H);

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Camera follows Rex
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_PX_W, MAP_PX_H);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setZoom(3);
    cam.setBackgroundColor('#1a1a2e');
  }

  update() {
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;

    let vx = 0;
    let vy = 0;

    if (left) vx = -SPEED;
    else if (right) vx = SPEED;
    if (up) vy = -SPEED;
    else if (down) vy = SPEED;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.setVelocity(vx, vy);

    // Animation
    if (vx < 0) {
      this.player.anims.play('walk-left', true);
    } else if (vx > 0) {
      this.player.anims.play('walk-right', true);
    } else if (vy < 0) {
      this.player.anims.play('walk-up', true);
    } else if (vy > 0) {
      this.player.anims.play('walk-down', true);
    } else {
      // Idle — play idle for last direction
      const currentAnim = this.player.anims.currentAnim?.key || '';
      if (currentAnim.startsWith('walk-')) {
        const dir = currentAnim.replace('walk-', '');
        this.player.anims.play('idle-' + dir, true);
      } else if (!currentAnim.startsWith('idle-')) {
        this.player.anims.play('idle-down', true);
      }
    }
  }
}
