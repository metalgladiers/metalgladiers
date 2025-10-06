class Fighter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key, controls, attributes) {
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.originalTint = attributes.tint || 0xffffff;
        this.setTint(this.originalTint);

        this.health = attributes.health || 100;
        this.maxHealth = this.health;
        this.damage = attributes.damage || 10;
        this.speed = attributes.speed || 200;
        this.jumpPower = attributes.jumpPower || -350;

        this.controls = controls;
        this.scene = scene;

        this.healthBar = scene.add.graphics();
        this.barX = attributes.barX || 20;
        this.barY = attributes.barY || 30;
        this.updateHealthBar();
    }

    move() {
        if (!this.active) return;

        this.setVelocityX(0);

        if (this.controls.left.isDown) {
            this.setVelocityX(-this.speed);
            this.flipX = true;
        } else if (this.controls.right.isDown) {
            this.setVelocityX(this.speed);
            this.flipX = false;
        }

        if (this.controls.jump.isDown && this.body.onFloor()) {
            this.setVelocityY(this.jumpPower);
        }
    }

    attack(target) {
        if (!this.active) return;

        if (Phaser.Input.Keyboard.JustDown(this.controls.attack)) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.getBounds(), target.getBounds())) {
                target.takeDamage(this.damage);
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.controls.specialAttack)) {
            this.shootProjectile();
        }
    }

    shootProjectile() {
    const projectile = this.scene.physics.add.sprite(this.x, this.y, 'projectile');
    projectile.setCollideWorldBounds(true);
    projectile.body.onWorldBounds = true;

    projectile.play('projectileAnim');

    const velocity = this.flipX ? -400 : 400;
    projectile.setVelocityX(velocity);

    this.scene.physics.add.overlap(
        projectile,
        this.scene.player1 === this ? this.scene.player2 : this.scene.player1,
        (proj, target) => {
            target.takeDamage(20);
            proj.destroy();
        }
    );

    this.scene.physics.add.collider(projectile, this.scene.ground, () => {
        projectile.destroy();
    });

    this.scene.time.delayedCall(2000, () => {
        if (projectile.active) projectile.destroy();
    });
}


    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.updateHealthBar();

        if (this.health <= 0) {
            this.destroy();
            this.healthBar.clear();
            console.log(`${this.texture.key} foi derrotado!`);
        } else {
            this.setTint(0xff0000);
            this.scene.time.delayedCall(150, () => {
                this.setTint(this.originalTint);
            });
        }
    }

    updateHealthBar() {
        this.healthBar.clear();
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(this.barX, this.barY, 200, 20);

        this.healthBar.fillStyle(0x00ff00);
        const hpWidth = (this.health / this.maxHealth) * 200;
        this.healthBar.fillRect(this.barX, this.barY, hpWidth, 20);

        this.healthBar.lineStyle(2, 0xffffff);
        this.healthBar.strokeRect(this.barX, this.barY, 200, 20);
        this.healthBar.setScrollFactor(0);
    }
}


class MyGame extends Phaser.Scene {
    constructor() {
        super('MyGame');
    }

    preload() {
        this.load.image('bg', 'assets/floresta.png');
        this.load.image('ground', 'assets/ground.png');

        this.load.spritesheet('projectile', 'assets/poder.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.textures.generate('player1', { data: ['2'], pixelWidth: 64, pixelHeight: 64 });
        this.textures.generate('player2', { data: ['2'], pixelWidth: 64, pixelHeight: 64 });
    }

    create() {
        this.background = this.add.sprite(400, 300, 'bg')
            .setDepth(-5)
            .setScale(1.5);

        this.ground = this.physics.add.staticGroup();
        this.ground.create(400, 580, 'ground').setScale(2).refreshBody();

        this.anims.create({
    key: 'projectileAnim',
    frames: this.anims.generateFrameNumbers('projectile', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
});


        const controlsP1 = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
            specialAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
        };

        const controlsP2 = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            specialAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
        };

        this.player1 = new Fighter(this, 200, 450, 'player1', controlsP1, {
            tint: 0x0000ff,
            health: 100,
            damage: 8,
            speed: 250,
            jumpPower: -500,
            barX: 50,
            barY: 30
        });

        this.player2 = new Fighter(this, 600, 450, 'player2', controlsP2, {
            tint: 0xff0000,
            health: 120,
            damage: 15,
            speed: 180,
            jumpPower: -900,
            barX: 550,
            barY: 30
        });

        this.physics.add.collider(this.player1, this.ground);
        this.physics.add.collider(this.player2, this.ground);
    }

    update() {
        if (this.player1.active) {
            this.player1.move();
            this.player1.attack(this.player2);
        }
        if (this.player2.active) {
            this.player2.move();
            this.player2.attack(this.player1);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 1100 }, debug: false }
    },
    scene: MyGame
};

new Phaser.Game(config);
