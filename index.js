class Fighter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key, controls, attributes) {
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // atributos customizáveis
        this.health = attributes.health || 100;
        this.maxHealth = this.health;
        this.damage = attributes.damage || 10;
        this.speed = attributes.speed || 200;
        this.jumpPower = attributes.jumpPower || -350;

        this.controls = controls;

        // cria a barra de vida
        this.healthBar = scene.add.graphics();
        this.barX = attributes.barX || 20;   // posição X da barra
        this.barY = attributes.barY || 30;   // posição Y da barra
        this.updateHealthBar();
    }

    move() {
        this.setVelocityX(0);

        if (this.controls.left.isDown) {
            this.setVelocityX(-this.speed);
            this.anims.play('walk', true)
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
        if (Phaser.Input.Keyboard.JustDown(this.controls.attack)) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.getBounds(), target.getBounds())) {
                target.takeDamage(this.damage);
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.updateHealthBar();

        if (this.health <= 0) {
            this.setTint(0xff0000);
            this.setVelocity(0, 0);
        }
    }

    updateHealthBar() {
        this.healthBar.clear();

        // fundo da barra (vermelho)
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(this.barX, this.barY, 200, 20);

        // vida atual (verde)
        this.healthBar.fillStyle(0x00ff00);
        const hpWidth = (this.health / this.maxHealth) * 200;
        this.healthBar.fillRect(this.barX, this.barY, hpWidth, 20);
    }
}

class MyGame extends Phaser.Scene {
    constructor() {
        super('MyGame');
    }

    preload() {
        this.load.image('ground', 'assets/ground.png');
        this.load.spritesheet('player1', 'assets/dog.png', {
    frameWidth: 50, 
    frameHeight: 50  
});

        this.load.image('player2', 'assets/enemy.png');

         this.load.spritesheet('bg', 'assets/cenario.png', {
        frameWidth: 1024,   // largura de cada frame do BG
        frameHeight: 1024   // altura de cada frame do BG
    });
    }

    create() {
        // chão
        const ground = this.physics.add.staticGroup();
        ground.create(400, 580, 'ground').setScale(2).refreshBody();

        // controles Player 1
        const controlsP1 = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        };

        // controles Player 2
        const controlsP2 = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
        };

        // Player 1: rápido, mas menos dano
        this.player1 = new Fighter(this, 200, 450, 'player1', controlsP1, {
            health: 100,
            damage: 8,
            speed: 250,
            jumpPower: -500,
            barX: 50,
            barY: 30
        });

        // Player 2: mais forte, mas mais lento
        this.player2 = new Fighter(this, 600, 450, 'player2', controlsP2, {
            health: 120,
            damage: 15,
            speed: 180,
            jumpPower: -400,
            barX: 550,
            barY: 30
        });

        // colisões com o chão
        this.physics.add.collider(this.player1, ground);
        this.physics.add.collider(this.player2, ground);

        this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('player1', { start: 0, end: 3 }), // depende do seu spritesheet
    frameRate: 10,
    repeat: -1
});

this.background = this.add.sprite(400, 300, 'bg')
.setOrigin(0.5, 0.5)
.setDepth(-1)
    .setScale(12.5, 1.5);

    // cria a animação
    this.anims.create({
        key: 'bgAnim',
        frames: this.anims.generateFrameNumbers('bg', { start: 0, end: 5 }), // depende do spritesheet
        frameRate: 6,
        repeat: -1
    });

    // toca a animação
    this.background.play('bgAnim');

    }

    update() {
        this.player1.move();
        this.player2.move();

        this.player1.attack(this.player2);
        this.player2.attack(this.player1);
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
