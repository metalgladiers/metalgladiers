class Fighter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key, controls, attributes) {
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.originalTint = attributes.tint || 0xffffff;
        this.setTint(this.originalTint);

        // ======== ATRIBUTOS ========
        this.health = attributes.health || 100;
        this.maxHealth = this.health;
        this.damage = attributes.damage || 10;
        this.speed = attributes.speed || 200;
        this.jumpPower = attributes.jumpPower || -350;

        // ======== ENERGIA ========
        this.energy = attributes.energy || 100;
        this.maxEnergy = this.energy;
        this.energyRegenRate = 10;

        // ======== SPECIAL ATTACK ========
        this.special = {
            cost: attributes.specialCost || 20,
            damage: attributes.specialDamage || 20,
            velocity: attributes.specialVelocity || 400,
            color: attributes.specialColor || 0xffffff,
            width: attributes.specialWidth || 20,
            height: attributes.specialHeight || 10
        };

        this.controls = controls;
        this.scene = scene;

        // ======== BARRAS ========
        this.healthBar = scene.add.graphics();
        this.barX = attributes.barX || 20;
        this.barY = attributes.barY || 30;

        this.energyBar = scene.add.graphics();
        this.barEnergyX = attributes.barEnergyX || 10;
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
                this.shootProjectile();
            } else {
                console.log(`${this.texture.key} sem energia!`);
            }
        }
    }

    shootProjectile() {
        // Gasta energia
        this.energy -= this.special.cost;
        if (this.energy < 0) this.energy = 0;
        this.updateEnergyBar();

        // Cria um retângulo colorido como poder
        const projectile = this.scene.add.rectangle(
            this.x,
            this.y,
            this.special.width,
            this.special.height,
            this.special.color
        );

        this.scene.physics.add.existing(projectile);
        projectile.body.allowGravity = false;

        const velocity = this.flipX ? -this.special.velocity : this.special.velocity;
        projectile.body.setVelocityX(velocity);

        // Detecta colisão com o oponente
        const target = this.scene.player1 === this ? this.scene.player2 : this.scene.player1;
        this.scene.physics.add.overlap(projectile, target, (proj, targetHit) => {
            targetHit.takeDamage(this.special.damage);
            proj.destroy();
        });

        // Destrói após 2 segundos
        this.scene.time.delayedCall(2000, () => {
            if (projectile.active) projectile.destroy();
        });

        const hiddenPower = this.scene.add.rectangle(
            this.x,
            this.y,
            this.hidden.width,
            this.hidden.height,
            this.hidden.color
        );

        this.scene.physics.add.existing(hiddenPower);
            hiddenPower.body.allowGravity = false;

            hiddenPower.body.setVelocityX(velocity + 10);

            this.scene.physics.add.overlap(hiddenPower, target)
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.updateHealthBar();

        if (this.health <= 0) {
            this.destroy();
            this.healthBar.clear();
            this.energyBar.clear();
            console.log(`${this.texture.key} foi derrotado!`);
        } else {
            this.setTint(0xff0000);
            this.scene.time.delayedCall(150, () => {
                this.setTint(this.originalTint);
            });
        }
    }

    regenEnergy(delta) {
        this.energy += (this.energyRegenRate * delta) / 1000;
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


// ===================== CENA PRINCIPAL =====================

class MyGame extends Phaser.Scene {
    constructor() {
        super('MyGame');
    }

    preload() {
        this.load.image('bg', 'assets/floresta.png');
        this.textures.generate('player1', { data: ['2'], pixelWidth: 64, pixelHeight: 64 });
        this.textures.generate('player2', { data: ['2'], pixelWidth: 64, pixelHeight: 64 });
    }

    create() {
        // ======== BOTÃO DE REINICIAR ========
const restartButton = this.add.text(370, 10, '🔄', {
    fontSize: '28px',
    fill: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 3, y: 5 },
    fontStyle: 'bold'
})
.setInteractive()
.setScrollFactor(0); // Fixa na tela (UI)

// Efeito visual de hover
restartButton.on('pointerover', () => {
    restartButton.setStyle({ fill: '#00ff00', backgroundColor: '#222222' });
});
restartButton.on('pointerout', () => {
    restartButton.setStyle({ fill: '#ffffff', backgroundColor: '#000000' });
});

// Ao clicar — reinicia a cena
restartButton.on('pointerdown', () => {
    this.scene.restart(); // 👈 Reinicia tudo
});

        this.add.sprite(400, 300, 'bg').setDepth(-5).setScale(1.5);

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

        // ======== PLAYER 1 ========
        this.player1 = new Fighter(this, 200, 450, 'player1', controlsP1, {
            tint: 0x0000ff,
            health: 100,
            damage: 8,
            speed: 250,
            jumpPower: -500,
            barX: 50,
            barY: 30,
            barEnergyX: 50,
            barEnergyY: 60,
            specialDamage: 15,
            specialCost: 15,
            specialVelocity: 500,
            specialColor: 0x00ffff // azul-claro
        });

        // ======== PLAYER 2 ========
        this.player2 = new Fighter(this, 600, 450, 'player2', controlsP2, {
            tint: 0xff0000,
            health: 120,
            damage: 15,
            speed: 180,
            jumpPower: -900,
            barX: 550,
            barY: 30,
            barEnergyX: 550,
            barEnergyY: 60,
            specialDamage: 35,
            specialCost: 30,
            specialVelocity: 300,
            specialColor: 0xff6600 // laranja-fogo
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


// ===================== CONFIGURAÇÃO DO JOGO =====================

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
