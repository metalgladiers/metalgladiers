class Fighter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key, controls, attributes) {
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.originalTint = attributes.tint || 0xffffff;
        this.setTint(this.originalTint);
        this.baseTextureKey = key;
        this.specialAttackUsing = false;

        this.health = attributes.health || 100;
        this.maxHealth = this.health;
        this.damage = attributes.damage || 10;
        this.speed = attributes.speed || 200;
        this.jumpPower = attributes.jumpPower || -350;

        this.energy = attributes.energy || 100;
        this.maxEnergy = this.energy;
        this.energyRegenRate = attributes.energyRegenRate || 10;

        this.special = {
            cost: attributes.specialCost || 20,
            damage: attributes.specialDamage || 20,
            velocity: attributes.specialVelocity || 400
        };

        this.hidden = {
            cost: attributes.hiddenCost || 40,
            damage: attributes.hiddenDamage || 50,
            velocity: attributes.hiddenVelocity || 600,
            color: attributes.hiddenColor || 0xffff00
        };

        this.controls = controls;
        this.scene = scene;

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
                this.specialAttackUsing = true;
            }
        }
    }

    shootSpecial(target) 
    { this.energy -= this.special.cost; 
        if (this.energy < 0) this.energy = 0; 
        this.updateEnergyBar(); 
       const projectile = this.scene.physics.add.sprite(this.x, this.y - 20, 'poder');
if (this === this.scene.player1)
    this.scene.projectilesP1.add(projectile);
else
    this.scene.projectilesP2.add(projectile);

        projectile.play('poder_anim'); this.scene.physics.add.existing(projectile); 
        projectile.body.allowGravity = false; 
        const velocity = this.flipX ? -this.special.velocity : this.special.velocity; 
        projectile.body.setVelocityX(velocity); if (this.flipX) projectile.flipX = true; 
        this.scene.physics.add.overlap(projectile, target, (proj, targetHit) => { targetHit.takeDamage(this.special.damage); proj.destroy(); }); this.scene.time.delayedCall(2000, () => { if (projectile.active) projectile.destroy(); }); 
    }

    shootHidden(target) {
        if (this.specialAttackUsing === false) {
            this.energy -= this.hidden.cost;
            if (this.energy < 0) this.energy = 0;
            this.updateEnergyBar();

            this.setVelocity(0, 0);
            this.play('specialanim');

            this.once('animationcomplete-specialanim', () => {
                const hiddenPower = this.scene.add.sprite(this.x, this.y - 10, 'hiddenpower');
                this.scene.physics.add.existing(hiddenPower);
if (this === this.scene.player1)
    this.scene.projectilesP1.add(hiddenPower);
else
    this.scene.projectilesP2.add(hiddenPower);

                hiddenPower.play('hidden_anim');

                this.scene.physics.add.existing(hiddenPower);
                hiddenPower.body.allowGravity = false;

                const velocity = this.flipX ? -this.hidden.velocity : this.hidden.velocity;
                hiddenPower.body.setVelocityX(velocity);
                if (this.flipX) hiddenPower.flipX = true;

                this.scene.physics.add.overlap(hiddenPower, target, (proj, targetHit) => {
                    targetHit.takeDamage(this.hidden.damage);
                    proj.destroy();
                });

                this.scene.time.delayedCall(2500, () => {
                    if (hiddenPower.active) hiddenPower.destroy();
                });

                this.anims.stop();
                this.setTexture(this.baseTextureKey);
                this.setFrame(0);
                this.setTint(this.originalTint);
                this.specialAttackUsing = false;
            });
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.updateHealthBar();

        if (this.health <= 0) {
            if (this.scene && this.scene.events) {
                this.scene.events.emit('fighterDead', this);
            }

            this.scene.time.delayedCall(200, () => {
                if (this.healthBar) this.healthBar.clear();
                if (this.energyBar) this.energyBar.clear();
                if (this.active) this.destroy();
            });
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


const CHAR_ATTRIBUTES = {
    char1: { health: 7000, damage: 30, speed: 160, jumpPower: -500, specialDamage: 200, hiddenDamage: 4000, specialCost: 1 },
    char2: { health: 1000, damage: 8, speed: 220, jumpPower: -550, specialDamage: 25, hiddenDamage: 35 },
    char3: { health: 900, damage: 12, speed: 300, jumpPower: -600, specialDamage: 15, hiddenDamage: 45 },
    char4: { health: 650, damage: 6, speed: 180, jumpPower: -450, specialDamage: 30, hiddenDamage: 50 },
    char5: { health: 800, damage: 9, speed: 260, jumpPower: -500, specialDamage: 18, hiddenDamage: 42 },
    char6: { health: 600, damage: 15, speed: 320, jumpPower: -650, specialDamage: 22, hiddenDamage: 55 }
};


class CharacterSelect extends Phaser.Scene {
    constructor() { super('CharacterSelect'); }

    preload() {
        this.load.image('bg', 'assets/floresta.png');

        this.load.image('char1', 'assets/players/PlayerBlue.png');
        this.load.image('char2', 'assets/players/PlayerViolet.png');
        this.load.image('char3', 'assets/players/PlayerGreen.png');
        this.load.image('char4', 'assets/players/PlayerCyan.png');
        this.load.image('char5', 'assets/players/PlayerRed.png');
        this.load.image('char6', 'assets/players/PlayerOrange.png');
    }

    create() {
        this.add.sprite(400, 300, 'bg').setDepth(-5).setScale(1.5);
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

        this.load.image('char1', 'assets/players/PlayerBlue.png');
        this.load.image('char2', 'assets/players/PlayerViolet.png');
        this.load.image('char3', 'assets/players/PlayerGreen.png');
        this.load.spritesheet('char4', 'assets/players/PlayerCyanSheet.png', {
            frameWidth: 160,
            frameHeight: 160
        })
        this.load.image('char5', 'assets/players/PlayerRed.png');
        this.load.image('char6', 'assets/players/PlayerOrange.png');

        this.load.spritesheet('poder', 'assets/poder.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.spritesheet('hiddenpower', 'assets/HiddenPower.png', {
            frameWidth: 96,
            frameHeight: 96
        })

        this.load.spritesheet('poderAnimation', 'assets/poderAnimation.png', {
            frameWidth: 160,
            frameHeight: 160
        })

        this.load.audio('trilhafight', 'assets/Musics/Trilha Jogo.mp3')

    }

    create(data) {
        this.trilha = this.sound.add('trilhafight', { loop: true, volume: 0.5 });
this.trilha.play();

        this.add.sprite(400, 300, 'bg').setDepth(-5).setScale(1.5);

        // Grupos para armazenar projéteis
this.projectilesP1 = this.physics.add.group();
this.projectilesP2 = this.physics.add.group();

this.anims.create({
    key: 'char4_idle',
    frames: this.anims.generateFrameNumbers('char4', { start: 0, end: 8 }),
    frameRate: 8,
    repeat: -1
});


// Colisão entre projéteis dos jogadores
this.physics.add.collider(this.projectilesP1, this.projectilesP2, (p1, p2) => {
    p1.destroy();
    p2.destroy();
});

        this.anims.create({
            key: 'specialanim',
            frames: this.anims.generateFrameNumbers('poderAnimation', { start: 0, end: 20 }),
            frameRate: 20,
            repeat: 0
        })

        this.anims.create({
            key: 'poder_anim',
            frames: this.anims.generateFrameNumbers('poder', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'hidden_anim',
            frames: this.anims.generateFrameNumbers('hiddenpower', { start: 0, end: 8 }),
            frameRate: 8,
            repeat: -1
        })

        const controlsP1 = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            specialAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            hiddenAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        };

        const controlsP2 = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
            specialAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
            hiddenAttack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
        };


        this.player1 = new Fighter(this, 200, 450, data.p1, controlsP1, {
            ...CHAR_ATTRIBUTES[data.p1],
            barX: 50, barY: 30, barEnergyX: 50, barEnergyY: 60
        });
        this.player1.body.setSize(this.player1.width * 0.6, this.player1.height * 0.8);
        this.player1.body.setOffset(this.player1.width * 0.2, this.player1.height * 0.1);


        this.player2 = new Fighter(this, 600, 450, data.p2, controlsP2, {
            ...CHAR_ATTRIBUTES[data.p2],
            barX: 550, barY: 30, barEnergyX: 550, barEnergyY: 60
        });

        if (data.p1 === 'char4') this.player1.play('char4_idle');
if (data.p2 === 'char4') this.player2.play('char4_idle');


        this.player2.body.setSize(this.player2.width * 0.6, this.player2.height * 0.8);
        this.player2.body.setOffset(this.player2.width * 0.2, this.player2.height * 0.1);

        this.events.on('fighterDead', (fighter) => {
            this.time.delayedCall(1000, () => {
                this.scene.start('CharacterSelect');
            });
        });

        this.add.text(330, 40, 'Reiniciar', { fontSize: '24px', fill: '#000000' })
        .setInteractive({ useHandCursor: true })
.on('pointerdown', () => {
    this.scene.restart(); 
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
        arcade: { gravity: { y: 1100 }, debug: true }
    },
    scene: [CharacterSelect, MyGame]
};

new Phaser.Game(config);
