class Fighter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key, controls, attributes) {
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.originalTint = attributes.tint || 0xffffff;
        this.setTint(this.originalTint);

        // Atributos principais
        this.health = attributes.health || 100;
        this.maxHealth = this.health;
        this.damage = attributes.damage || 10;
        this.speed = attributes.speed || 200;
        this.jumpPower = attributes.jumpPower || -350;

        // Energia
        this.energy = attributes.energy || 100;
        this.maxEnergy = this.energy;
        this.energyRegenRate = attributes.energyRegenRate || 10;

        // Poder especial
        this.special = {
            cost: attributes.specialCost || 20,
            damage: attributes.specialDamage || 20,
            velocity: attributes.specialVelocity || 400
        };

        // Poder oculto
        this.hidden = {
            cost: attributes.hiddenCost || 40,
            damage: attributes.hiddenDamage || 50,
            velocity: attributes.hiddenVelocity || 600,
            color: attributes.hiddenColor || 0xffff00
        };

        this.controls = controls;
        this.scene = scene;

        // Barras de vida e energia
        this.healthBar = scene.add.graphics();
        this.barX = attributes.barX || 20;
        this.barY = attributes.barY || 30;

        this.energyBar = scene.add.graphics();
        this.barEnergyX = attributes.barEnergyX || 20;
        this.barEnergyY = attributes.barEnergyY || 60;

        this.updateEnergyBar();
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
            if (this.energy >= this.special.cost) {
                this.shootSpecial(target);
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.controls.hiddenAttack)) {
            if (this.energy >= this.hidden.cost) {
                this.shootHidden(target);
            }
        }
    }

    shootSpecial(target) {
        this.energy -= this.special.cost;
        if (this.energy < 0) this.energy = 0;
        this.updateEnergyBar();

        const projectile = this.scene.add.sprite(this.x, this.y - 20, 'poder').setScale(4);
        projectile.play('poder_anim');
        this.scene.physics.add.existing(projectile);
        projectile.body.allowGravity = false;

        const velocity = this.flipX ? -this.special.velocity : this.special.velocity;
        projectile.body.setVelocityX(velocity);
        if (this.flipX) projectile.flipX = true;

        this.scene.physics.add.overlap(projectile, target, (proj, targetHit) => {
            targetHit.takeDamage(this.special.damage);
            proj.destroy();
        });

        this.scene.time.delayedCall(2000, () => {
            if (projectile.active) projectile.destroy();
        });
    }

    shootHidden(target) {
        this.energy -= this.hidden.cost;
        if (this.energy < 0) this.energy = 0;
        this.updateEnergyBar();

        const hiddenPower = this.scene.add.rectangle(
            this.x,
            this.y - 10,
            30,
            15,
            this.hidden.color
        );
        this.scene.physics.add.existing(hiddenPower);
        hiddenPower.body.allowGravity = false;

        const velocity = this.flipX ? -this.hidden.velocity : this.hidden.velocity;
        hiddenPower.body.setVelocityX(velocity);

        this.scene.physics.add.overlap(hiddenPower, target, (proj, targetHit) => {
            targetHit.takeDamage(this.hidden.damage);
            proj.destroy();
        });

        this.scene.time.delayedCall(2500, () => {
            if (hiddenPower.active) hiddenPower.destroy();
        });
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.updateHealthBar();

        if (this.health <= 0) {
            this.destroy();
            this.healthBar.clear();
            this.energyBar.clear();
        } else {
            this.setTint(0xff0000);
            this.scene.time.delayedCall(150, () => {
                this.setTint(this.originalTint);
            });
        }
    }

    regenEnergy(delta) {
        this.energy += (this.energyRegenRate * delta) / 600;
        if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
        this.updateEnergyBar();
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

    updateEnergyBar() {
        this.energyBar.clear();
        this.energyBar.fillStyle(0x330000);
        this.energyBar.fillRect(this.barEnergyX, this.barEnergyY, 200, 10);

        const energyWidth = (this.energy / this.maxEnergy) * 200;
        this.energyBar.fillStyle(0x00ffff);
        this.energyBar.fillRect(this.barEnergyX, this.barEnergyY, energyWidth, 10);

        this.energyBar.lineStyle(2, 0xffffff);
        this.energyBar.strokeRect(this.barEnergyX, this.barEnergyY, 200, 10);
        this.energyBar.setScrollFactor(0);
    }
}


// atributos dos personagens
const CHAR_ATTRIBUTES = {
    char1: { health: 500, damage: 30, speed: 160, jumpPower: -500, specialDamage: 20, hiddenDamage: 400, specialCost: 1 },
    char2: { health: 1120, damage: 8,  speed: 220, jumpPower: -550, specialDamage: 25, hiddenDamage: 35 },
    char3: { health: 90,  damage: 12, speed: 300, jumpPower: -600, specialDamage: 15, hiddenDamage: 45 },
    char4: { health: 150, damage: 6,  speed: 180, jumpPower: -450, specialDamage: 30, hiddenDamage: 50 },
    char5: { health: 110, damage: 9,  speed: 260, jumpPower: -500, specialDamage: 18, hiddenDamage: 42 },
    char6: { health: 890,  damage: 15, speed: 320, jumpPower: -650, specialDamage: 22, hiddenDamage: 55 }
};


class CharacterSelect extends Phaser.Scene {
    constructor() { super('CharacterSelect'); }

    preload() {
        this.load.image('bg', 'assets/floresta.png');
        
        // carrega os 6 sprites únicos
        this.load.image('char1', 'assets/players/PlayerBlue.png');
        this.load.image('char2', 'assets/players/PlayerViolet.png');
        this.load.image('char3', 'assets/players/PlayerGreen.png');
        this.load.image('char4', 'assets/players/PlayerCyan.png');
        this.load.image('char5', 'assets/players/PlayerRed.png');
        this.load.image('char6', 'assets/players/PlayerOrange.png');
    }

    create() {
        this.add.text(200, 40, 'Escolha 2 Personagens', { fontSize: '24px', fill: '#fff' });

        this.selectedP1 = null;
        this.selectedP2 = null;

        const positions = [
            { x: 150, y: 200 },
            { x: 300, y: 200 },
            { x: 450, y: 200 },
            { x: 600, y: 200 },
            { x: 225, y: 400 },
            { x: 525, y: 400 }
        ];

        for (let i = 1; i <= 6; i++) {
            const pos = positions[i - 1];
            const sprite = this.add.sprite(pos.x, pos.y, 'char' + i).setInteractive();

            sprite.on('pointerdown', () => {
                if (!this.selectedP1) {
                    this.selectedP1 = 'char' + i;
                    sprite.setTint(0x0000ff);
                } else if (!this.selectedP2 && this.selectedP1 !== 'char' + i) {
                    this.selectedP2 = 'char' + i;
                    sprite.setTint(0xff0000);
                }

                if (this.selectedP1 && this.selectedP2) {
                    this.scene.start('MyGame', { p1: this.selectedP1, p2: this.selectedP2 });
                }
            });
        }
    }
}


class MyGame extends Phaser.Scene {
    constructor() { super('MyGame'); }

    preload() {
        this.load.image('bg', 'assets/floresta.png');

        // cada personagem com seu sprite único (mesmo mapeamento que no CharacterSelect)
        this.load.image('char1', 'assets/players/PlayerBlue.png');
        this.load.image('char2', 'assets/players/PlayerViolet.png');
        this.load.image('char3', 'assets/players/PlayerGreen.png');
        this.load.image('char4', 'assets/players/PlayerCyan.png');
        this.load.image('char5', 'assets/players/PlayerRed.png');
        this.load.image('char6', 'assets/players/PlayerOrange.png');

        // spritesheet do poder
        this.load.spritesheet('poder', 'assets/poder.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create(data) {
        this.add.sprite(400, 300, 'bg').setDepth(-5).setScale(1.5);

        this.anims.create({
            key: 'poder_anim',
            frames: this.anims.generateFrameNumbers('poder', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Controles P1
const controlsP1 = {
    left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
    specialAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    hiddenAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
};

// Controles P2
const controlsP2 = {
    left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
    right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
    attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
    specialAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
    hiddenAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
};


        // Player 1
        this.player1 = new Fighter(this, 200, 450, data.p1, controlsP1, {
            ...CHAR_ATTRIBUTES[data.p1],
            barX: 50, barY: 30, barEnergyX: 50, barEnergyY: 60
        });

        // Player 2
        this.player2 = new Fighter(this, 600, 450, data.p2, controlsP2, {
            ...CHAR_ATTRIBUTES[data.p2],
            barX: 550, barY: 30, barEnergyX: 550, barEnergyY: 60
        });
    }

    update(time, delta) {
        if (this.player1.active) {
            this.player1.move();
            this.player1.attack(this.player2);
            this.player1.regenEnergy(delta);
        }
        if (this.player2.active) {
            this.player2.move();
            this.player2.attack(this.player1);
            this.player2.regenEnergy(delta);
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
    scene: [CharacterSelect, MyGame]
};

new Phaser.Game(config);
