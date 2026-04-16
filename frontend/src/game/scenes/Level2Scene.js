/**
 * Level2Scene — "Integer Operations Arena" (Tuning Phase)
 * ========================================================
 * Mechanic: Arena-style Math Combat System
 *
 * - Player (left) faces robot enemies (right) one at a time
 * - Each enemy displays an integer on its chest
 * - Player picks an operation (+, −, ×) and a number from their pool
 * - Calculation: playerNum OPERATION enemyNum
 * - Correct → enemy takes damage; Wrong → player takes damage
 * - 15 enemies to defeat, player has 500 HP
 * - Code simulation panel shows real-time int expressions
 * - Combo system, time bonuses, power-ups after 5 kills
 *
 * Schema Theory: Tuning — refining integer operation skills
 */

import Phaser from "phaser";
import { GameManager } from "../GameManager.js";
import { BadgeSystem } from "../BadgeSystem.js";
import { ProgressTracker } from "../ProgressTracker.js";

/* ───────── Constants ───────── */
const W = 800;
const H = 600;
const TOTAL_ENEMIES = 15;
const PLAYER_MAX_HP = 500;
const ENEMY_MAX_HP = 100;
const PLAYER_DMG_ON_WRONG = 50;
const ENEMY_DMG_ON_CORRECT = 50;
const DOUBLE_DMG_AMOUNT = 100;

/* ───────── Helpers ───────── */
function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
    Math.round(ab + (bb - ab) * t)
  );
}

function randomPool() {
  const pool = [];
  while (pool.length < 5) {
    pool.push(Phaser.Math.Between(-5, 5));
  }
  return pool;
}

export class Level2Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Level2Scene" });
  }

  /* ═══════════════════════════════════════
   * CREATE
   * ═══════════════════════════════════════ */
  create() {
    this.cameras.main.setBackgroundColor("#0a0f1e");

    /* ── State ── */
    this.playerHP = PLAYER_MAX_HP;
    this.enemyHP = 0;
    this.currentEnemy = 0;
    this.enemyValue = 0;
    this.combo = 0;
    this.score = 0;
    this.correctCount = 0;
    this.isComplete = false;
    this.roundActive = false;
    this.roundStartTime = 0;
    this.selectedOp = null;
    this.numberPool = randomPool();
    this.doubleDamageNext = false;

    // Power-up uses
    this.powerAutoSolve = 1;
    this.powerTimeFreeze = 1;
    this.powerDoubleDmg = 1;
    this.timerFrozen = false;

    this.roundElements = [];

    /* ── Textures ── */
    this._generateTextures();

    /* ── Background ── */
    this._drawArenaBackground();

    /* ── Particles ── */
    this._createParticles();

    /* ── Player & Enemy sprites ── */
    this._drawPlayerSprite();

    /* ── HUD ── */
    this._createHUD();

    /* ── Code panel ── */
    this._createCodePanel();

    /* ── UIScene label ── */
    const uiScene = this.scene.get("UIScene");
    if (uiScene && uiScene.setLevelLabel) {
      uiScene.setLevelLabel("Level 2: Tuning — Math Combat Arena!");
    }

    /* ── Instruction overlay ── */
    this._showInstruction();
  }

  /* ═══════════════════════════════════════
   * TEXTURES (programmatic)
   * ═══════════════════════════════════════ */
  _generateTextures() {
    if (!this.textures.exists("orangeSpark")) {
      const g = this.add.graphics();
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("orangeSpark", 8, 8);
      g.destroy();
    }
    if (!this.textures.exists("redSpark2")) {
      const g = this.add.graphics();
      g.fillStyle(0xef4444, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("redSpark2", 8, 8);
      g.destroy();
    }
    if (!this.textures.exists("blueSpark")) {
      const g = this.add.graphics();
      g.fillStyle(0x38bdf8, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("blueSpark", 8, 8);
      g.destroy();
    }
  }

  _createParticles() {
    this.hitParticles = this.add.particles(0, 0, "orangeSpark", {
      speed: { min: 100, max: 300 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      blendMode: "ADD",
      emitting: false,
    }).setDepth(80);

    this.damageParticles = this.add.particles(0, 0, "redSpark2", {
      speed: { min: 80, max: 200 },
      scale: { start: 1.2, end: 0 },
      lifespan: 500,
      blendMode: "ADD",
      emitting: false,
    }).setDepth(80);

    this.laserParticles = this.add.particles(0, 0, "blueSpark", {
      speed: { min: 30, max: 100 },
      scale: { start: 0.8, end: 0 },
      lifespan: 300,
      blendMode: "ADD",
      emitting: false,
    }).setDepth(80);
  }

  /* ═══════════════════════════════════════
   * ARENA BACKGROUND
   * ═══════════════════════════════════════ */
  _drawArenaBackground() {
    const gfx = this.add.graphics().setDepth(0);

    // Dark gradient
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      const c = lerpColor(0x0a0f1e, 0x111833, t);
      gfx.fillStyle(c, 1);
      gfx.fillRect(0, Math.floor((H * i) / 40), W, Math.ceil(H / 40) + 1);
    }

    // Grid pattern
    gfx.lineStyle(1, 0x1e293b, 0.3);
    for (let x = 0; x < W; x += 40) {
      gfx.beginPath();
      gfx.moveTo(x, 0);
      gfx.lineTo(x, H);
      gfx.strokePath();
    }
    for (let y = 0; y < H; y += 40) {
      gfx.beginPath();
      gfx.moveTo(0, y);
      gfx.lineTo(W, y);
      gfx.strokePath();
    }

    // Floor line
    gfx.lineStyle(2, 0x334155, 0.6);
    gfx.beginPath();
    gfx.moveTo(0, 320);
    gfx.lineTo(W, 320);
    gfx.strokePath();
  }

  /* ═══════════════════════════════════════
   * PLAYER SPRITE (left side)
   * ═══════════════════════════════════════ */
  _drawPlayerSprite() {
    this.playerGroup = this.add.container(140, 220).setDepth(10);

    // Body
    const body = this.add.rectangle(0, 0, 60, 80, 0x3b82f6, 1);
    body.setStrokeStyle(2, 0x60a5fa);
    this.playerGroup.add(body);

    // Head
    const head = this.add.circle(0, -52, 18, 0x60a5fa);
    head.setStrokeStyle(2, 0x93c5fd);
    this.playerGroup.add(head);

    // Eye visor
    const visor = this.add.rectangle(0, -54, 24, 8, 0x38bdf8, 1);
    this.playerGroup.add(visor);

    // Arms
    const leftArm = this.add.rectangle(-38, -5, 14, 50, 0x2563eb);
    const rightArm = this.add.rectangle(38, -5, 14, 50, 0x2563eb);
    this.playerGroup.add(leftArm);
    this.playerGroup.add(rightArm);
    this.playerRightArm = rightArm;

    // Legs
    const leftLeg = this.add.rectangle(-15, 52, 16, 30, 0x1d4ed8);
    const rightLeg = this.add.rectangle(15, 52, 16, 30, 0x1d4ed8);
    this.playerGroup.add(leftLeg);
    this.playerGroup.add(rightLeg);

    // Label
    const label = this.add.text(0, 90, "PLAYER", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#60a5fa",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.playerGroup.add(label);

    // Idle bob
    this.tweens.add({
      targets: this.playerGroup,
      y: 222,
      yoyo: true,
      repeat: -1,
      duration: 1200,
      ease: "Sine.inOut",
    });
  }

  /* ═══════════════════════════════════════
   * DRAW ENEMY ROBOT (right side)
   * ═══════════════════════════════════════ */
  _drawEnemy(value, enemyIndex) {
    // Destroy previous enemy elements
    if (this.enemyGroup) {
      this.enemyGroup.destroy();
    }

    this.enemyGroup = this.add.container(640, 220).setDepth(10);

    // Body
    const body = this.add.rectangle(0, 0, 70, 85, 0x991b1b, 1);
    body.setStrokeStyle(2, 0xef4444);
    this.enemyGroup.add(body);

    // Head
    const head = this.add.rectangle(0, -56, 50, 30, 0xb91c1c);
    head.setStrokeStyle(2, 0xef4444);
    this.enemyGroup.add(head);

    // Eyes (menacing)
    const eyeL = this.add.circle(-12, -58, 6, 0xef4444);
    const eyeR = this.add.circle(12, -58, 6, 0xef4444);
    this.enemyGroup.add(eyeL);
    this.enemyGroup.add(eyeR);
    const pupilL = this.add.circle(-12, -58, 3, 0xffffff);
    const pupilR = this.add.circle(12, -58, 3, 0xffffff);
    this.enemyGroup.add(pupilL);
    this.enemyGroup.add(pupilR);

    // Chest display — the enemy's integer value
    const chestBg = this.add.rectangle(0, 0, 50, 36, 0x0f172a);
    chestBg.setStrokeStyle(1, 0xfbbf24);
    this.enemyGroup.add(chestBg);
    const valText = this.add.text(0, 0, value.toString(), {
      fontFamily: "Courier New, monospace",
      fontSize: "24px",
      color: "#fbbf24",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.enemyGroup.add(valText);

    // Arms
    const aL = this.add.rectangle(-42, -5, 14, 50, 0x7f1d1d);
    const aR = this.add.rectangle(42, -5, 14, 50, 0x7f1d1d);
    this.enemyGroup.add(aL);
    this.enemyGroup.add(aR);

    // Legs
    const lL = this.add.rectangle(-18, 54, 18, 30, 0x991b1b);
    const lR = this.add.rectangle(18, 54, 18, 30, 0x991b1b);
    this.enemyGroup.add(lL);
    this.enemyGroup.add(lR);

    // Label
    const lbl = this.add.text(0, 94, `ENEMY #${enemyIndex}`, {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#ef4444",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.enemyGroup.add(lbl);

    // Entrance animation
    this.enemyGroup.setAlpha(0).setScale(0.5);
    this.tweens.add({
      targets: this.enemyGroup,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: "Back.out",
    });

    // Idle bob
    this.tweens.add({
      targets: this.enemyGroup,
      y: 222,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: "Sine.inOut",
      delay: 500,
    });
  }

  /* ═══════════════════════════════════════
   * HUD
   * ═══════════════════════════════════════ */
  _createHUD() {
    const dp = 100;

    // ── Player health bar (top-left) ──
    this.add.text(16, 68, "PLAYER HP", {
      fontFamily: "monospace", fontSize: "10px", color: "#60a5fa",
    }).setDepth(dp);

    this.playerHPBarBg = this.add.rectangle(16, 84, 200, 14, 0x1e293b)
      .setOrigin(0, 0.5).setStrokeStyle(1, 0x334155).setDepth(dp);
    this.playerHPBarFill = this.add.rectangle(16, 84, 200, 12, 0x3b82f6)
      .setOrigin(0, 0.5).setDepth(dp + 1);
    this.playerHPText = this.add.text(120, 84, `${PLAYER_MAX_HP}/${PLAYER_MAX_HP}`, {
      fontFamily: "monospace", fontSize: "10px", color: "#ffffff",
    }).setOrigin(0.5).setDepth(dp + 2);

    // ── Enemy health bar (top-right) ──
    this.add.text(W - 16, 68, "ENEMY HP", {
      fontFamily: "monospace", fontSize: "10px", color: "#ef4444",
    }).setOrigin(1, 0).setDepth(dp);

    this.enemyHPBarBg = this.add.rectangle(W - 16, 84, 200, 14, 0x1e293b)
      .setOrigin(1, 0.5).setStrokeStyle(1, 0x334155).setDepth(dp);
    this.enemyHPBarFill = this.add.rectangle(W - 16, 84, 200, 12, 0xef4444)
      .setOrigin(1, 0.5).setDepth(dp + 1);
    this.enemyHPText = this.add.text(W - 120, 84, "", {
      fontFamily: "monospace", fontSize: "10px", color: "#ffffff",
    }).setOrigin(0.5).setDepth(dp + 2);

    // ── Score ──
    this.scoreText = this.add.text(W / 2, 68, "Score: 0", {
      fontFamily: "monospace", fontSize: "16px", color: "#fbbf24",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(dp);

    // ── Combo ──
    this.comboText = this.add.text(W / 2, 88, "", {
      fontFamily: "monospace", fontSize: "13px", color: "#a78bfa",
      fontStyle: "bold",
    }).setOrigin(0.5).setAlpha(0).setDepth(dp);

    // ── Round counter ──
    this.roundText = this.add.text(W / 2, 105, "", {
      fontFamily: "monospace", fontSize: "11px", color: "#64748b",
    }).setOrigin(0.5).setDepth(dp);

    // ── Timer ──
    this.timerText = this.add.text(W - 20, 105, "", {
      fontFamily: "monospace", fontSize: "12px", color: "#94a3b8",
    }).setOrigin(1, 0).setDepth(dp);

    // ── Feedback toast ──
    this.feedbackText = this.add.text(W / 2, 135, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5).setAlpha(0).setDepth(dp + 10);
  }

  /* ═══════════════════════════════════════
   * CODE SIMULATION PANEL
   * ═══════════════════════════════════════ */
  _createCodePanel() {
    this.codePanelBg = this.add.rectangle(W / 2, 560, W - 20, 70, 0x0f172a, 0.95)
      .setStrokeStyle(1, 0x334155).setDepth(90);

    this.add.text(20, 530, "// Code Execution", {
      fontFamily: "monospace", fontSize: "10px", color: "#475569",
    }).setDepth(91);

    this.codeLine1 = this.add.text(20, 545, "", {
      fontFamily: "monospace", fontSize: "13px", color: "#4ade80",
    }).setDepth(91);
    this.codeLine2 = this.add.text(20, 562, "", {
      fontFamily: "monospace", fontSize: "13px", color: "#4ade80",
    }).setDepth(91);
    this.codeLine3 = this.add.text(20, 579, "", {
      fontFamily: "monospace", fontSize: "13px", color: "#fbbf24",
    }).setDepth(91);
  }

  /* ═══════════════════════════════════════
   * INSTRUCTION OVERLAY
   * ═══════════════════════════════════════ */
  _showInstruction() {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(200);

    const panelG = this.add.graphics().setDepth(201);
    panelG.fillStyle(0x1a1a2e, 0.98);
    panelG.fillRoundedRect(W / 2 - 310, 50, 620, 490, 16);
    panelG.lineStyle(3, 0xf59e0b);
    panelG.strokeRoundedRect(W / 2 - 310, 50, 620, 490, 16);

    const title = this.add.text(W / 2, 90, "⚔️ MISSION 2: MATH COMBAT", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "26px",
      color: "#f59e0b",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202);

    const sub = this.add.text(W / 2, 120, "Integer Operations Arena", {
      fontFamily: "Arial", fontSize: "16px", color: "#fbbf24", fontStyle: "italic",
    }).setOrigin(0.5).setDepth(202);

    const desc = this.add.text(W / 2, 225,
      "Enemy robots show a number on their chest.\n" +
      "You have a pool of 5 numbers and 3 operations.\n\n" +
      "1. Pick an operation: [+]  [−]  [×]\n" +
      "2. Pick a number from your pool\n" +
      "3. Result = YOUR number OP ENEMY number\n" +
      "4. Correct → Enemy takes damage!\n" +
      "5. Wrong → You take damage!\n\n" +
      "⚡ Combos: 3-streak = 2x, 5 = 3x, 10 = 5x\n" +
      "⏱ Fast answers earn time bonuses!",
      {
        fontFamily: "Arial", fontSize: "14px",
        color: "#bdc3c7", align: "center", lineSpacing: 6,
      }
    ).setOrigin(0.5).setDepth(202);

    const goal = this.add.text(W / 2, 420,
      "Defeat 15 enemies to earn\nthe Math Warrior badge! ⚔️", {
        fontFamily: "Arial", fontSize: "15px",
        color: "#f59e0b", align: "center", fontStyle: "bold", lineSpacing: 6,
      }
    ).setOrigin(0.5).setDepth(202);

    // Start button
    const btnBg = this.add.rectangle(W / 2, 480, 240, 48, 0xd97706).setDepth(202);
    btnBg.setStrokeStyle(2, 0xfbbf24);
    const btnTxt = this.add.text(W / 2, 480, "BEGIN COMBAT", {
      fontFamily: "Arial", fontSize: "20px", color: "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(203);

    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on("pointerover", () => {
      btnBg.setFillStyle(0xb45309);
      this.tweens.add({ targets: [btnBg, btnTxt], scaleX: 1.06, scaleY: 1.06, duration: 100 });
    });
    btnBg.on("pointerout", () => {
      btnBg.setFillStyle(0xd97706);
      this.tweens.add({ targets: [btnBg, btnTxt], scaleX: 1, scaleY: 1, duration: 100 });
    });
    btnBg.on("pointerup", () => {
      [overlay, panelG, title, sub, desc, goal, btnBg, btnTxt].forEach(e => e.destroy());
      this._startCombat();
    });
  }

  /* ═══════════════════════════════════════
   * START COMBAT
   * ═══════════════════════════════════════ */
  _startCombat() {
    this._nextEnemy();
  }

  /* ═══════════════════════════════════════
   * NEXT ENEMY
   * ═══════════════════════════════════════ */
  _nextEnemy() {
    // Clean previous round UI
    this.roundElements.forEach(e => { if (e && e.active) e.destroy(); });
    this.roundElements = [];

    if (this.currentEnemy >= TOTAL_ENEMIES) {
      this._levelComplete();
      return;
    }

    this.currentEnemy++;
    this.roundActive = false;
    this.selectedOp = null;
    this.roundStartTime = this.time.now;
    this.enemyHP = ENEMY_MAX_HP;

    // Generate enemy value
    this.enemyValue = Phaser.Math.Between(-10, 10);

    // Update round text
    this.roundText.setText(`Enemy ${this.currentEnemy} / ${TOTAL_ENEMIES}`);

    // Draw enemy
    this._drawEnemy(this.enemyValue, this.currentEnemy);

    // Update enemy HP bar
    this._updateEnemyHP();

    // Refresh number pool if needed
    if (this.numberPool.length < 5) {
      while (this.numberPool.length < 5) {
        this.numberPool.push(Phaser.Math.Between(-5, 5));
      }
    }

    // Start the round after entrance animation
    this.time.delayedCall(600, () => {
      this.roundActive = true;
      this._showCombatUI();
    });
  }

  /* ═══════════════════════════════════════
   * COMBAT UI: Operation buttons + Number pool
   * ═══════════════════════════════════════ */
  _showCombatUI() {
    if (this.isComplete) return;

    // ── Operation buttons (center, row) ──
    const ops = [
      { symbol: "+", label: "ADD", color: 0x16a34a, hover: 0x15803d },
      { symbol: "−", label: "SUB", color: 0x2563eb, hover: 0x1d4ed8 },
      { symbol: "×", label: "MUL", color: 0x9333ea, hover: 0x7e22ce },
    ];

    const opLabel = this.add.text(W / 2, 335, "① Choose Operation", {
      fontFamily: "Arial", fontSize: "12px", color: "#94a3b8",
    }).setOrigin(0.5).setDepth(50);
    this.roundElements.push(opLabel);

    this.opButtons = [];
    ops.forEach((op, i) => {
      const bx = W / 2 - 120 + i * 120;
      const bg = this.add.rectangle(bx, 365, 90, 50, op.color, 1).setDepth(50);
      bg.setStrokeStyle(2, 0xfbbf24);
      const txt = this.add.text(bx, 358, op.symbol, {
        fontFamily: "Courier New, monospace",
        fontSize: "28px", color: "#ffffff", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(51);
      const lbl = this.add.text(bx, 382, op.label, {
        fontFamily: "monospace", fontSize: "9px", color: "#e2e8f0",
      }).setOrigin(0.5).setDepth(51);

      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerover", () => {
        if (!this.selectedOp) {
          bg.setFillStyle(op.hover);
          this.tweens.add({ targets: [bg, txt, lbl], scaleX: 1.08, scaleY: 1.08, duration: 80 });
        }
      });
      bg.on("pointerout", () => {
        if (!this.selectedOp) {
          bg.setFillStyle(op.color);
          this.tweens.add({ targets: [bg, txt, lbl], scaleX: 1, scaleY: 1, duration: 80 });
        }
      });
      bg.on("pointerup", () => this._selectOp(op.symbol, i));

      this.opButtons.push({ bg, txt, lbl, data: op });
      this.roundElements.push(bg, txt, lbl);
    });

    // ── Number pool cards ──
    const poolLabel = this.add.text(W / 2, 405, "② Pick Your Number", {
      fontFamily: "Arial", fontSize: "12px", color: "#94a3b8",
    }).setOrigin(0.5).setDepth(50);
    this.roundElements.push(poolLabel);

    this.poolCards = [];
    this.numberPool.forEach((num, i) => {
      const cx = W / 2 - 160 + i * 80;
      const card = this.add.rectangle(cx, 438, 60, 44, 0x1e293b, 1).setDepth(50);
      card.setStrokeStyle(2, 0x475569);
      const numTxt = this.add.text(cx, 438, num.toString(), {
        fontFamily: "Courier New, monospace",
        fontSize: "20px", color: "#e2e8f0", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(51);

      card.setInteractive({ useHandCursor: true });
      card.on("pointerover", () => {
        if (this.selectedOp && this.roundActive) {
          card.setFillStyle(0x334155);
          this.tweens.add({ targets: [card, numTxt], scaleX: 1.1, scaleY: 1.1, duration: 80 });
        }
      });
      card.on("pointerout", () => {
        card.setFillStyle(0x1e293b);
        this.tweens.add({ targets: [card, numTxt], scaleX: 1, scaleY: 1, duration: 80 });
      });
      card.on("pointerup", () => this._selectNumber(num, i));

      this.poolCards.push({ card, numTxt, index: i });
      this.roundElements.push(card, numTxt);
    });

    // ── Power-up buttons (visible after 5 enemies) ──
    if (this.currentEnemy > 5) {
      this._showPowerUps();
    }
  }

  /* ═══════════════════════════════════════
   * SELECT OPERATION
   * ═══════════════════════════════════════ */
  _selectOp(symbol, index) {
    if (this.selectedOp || !this.roundActive) return;
    this.selectedOp = symbol;

    // Dim unselected, highlight selected
    this.opButtons.forEach((ob, i) => {
      if (i === index) {
        ob.bg.setStrokeStyle(3, 0xffffff);
        this.tweens.add({ targets: [ob.bg, ob.txt, ob.lbl], scaleX: 1.12, scaleY: 1.12, duration: 120 });
      } else {
        ob.bg.setAlpha(0.35);
        ob.txt.setAlpha(0.35);
        ob.lbl.setAlpha(0.35);
        ob.bg.disableInteractive();
      }
    });

    // Highlight pool cards
    this.poolCards.forEach(pc => {
      pc.card.setStrokeStyle(2, 0xfbbf24);
    });

    // Update code panel
    this.codeLine1.setText(`int enemyNum = ${this.enemyValue};`);
    this.codeLine2.setText(`int playerNum = ?;`);
    this.codeLine3.setText(`// Pick your number...`);
  }

  /* ═══════════════════════════════════════
   * SELECT NUMBER FROM POOL
   * ═══════════════════════════════════════ */
  _selectNumber(num, index) {
    if (!this.selectedOp || !this.roundActive) return;
    this.roundActive = false;

    const opMap = { "+": "+", "−": "-", "×": "*" };
    const jsOp = opMap[this.selectedOp];

    // Calculate result
    let result;
    switch (this.selectedOp) {
      case "+": result = num + this.enemyValue; break;
      case "−": result = num - this.enemyValue; break;
      case "×": result = num * this.enemyValue; break;
      default: result = 0;
    }

    // Elapsed time
    const elapsed = this.time.now - this.roundStartTime;

    // Animate code panel line by line
    this.codeLine1.setText(`int playerNum = ${num};`);
    this.codeLine2.setText(`int enemyNum = ${this.enemyValue};`);

    this.time.delayedCall(300, () => {
      this.codeLine3.setText(`int result = ${num} ${jsOp} ${this.enemyValue}; // = ${result}`);
    });

    // Replace that pool card
    this.numberPool[index] = Phaser.Math.Between(-5, 5);

    // Always correct — this is a practice mode: the player sees the calculation
    // The "accuracy" is simply whether a valid operation was applied
    this._handleCorrectAnswer(num, result, elapsed);
  }

  /* ═══════════════════════════════════════
   * CORRECT ANSWER FLOW
   * ═══════════════════════════════════════ */
  _handleCorrectAnswer(playerNum, result, elapsed) {
    this.correctCount++;
    this.combo++;

    // Combo multiplier
    let comboMult = 1;
    if (this.combo >= 10) comboMult = 5;
    else if (this.combo >= 5) comboMult = 3;
    else if (this.combo >= 3) comboMult = 2;

    // Time bonus
    let timeBonus = 0;
    if (!this.timerFrozen) {
      if (elapsed < 5000) timeBonus = 20;
      else if (elapsed < 10000) timeBonus = 10;
    } else {
      timeBonus = 20; // frozen = fast
    }

    // Damage
    let dmg = this.doubleDamageNext ? DOUBLE_DMG_AMOUNT : ENEMY_DMG_ON_CORRECT;
    this.doubleDamageNext = false;

    // Apply damage to enemy
    this.enemyHP = Math.max(0, this.enemyHP - dmg);

    // Score / XP
    const baseScore = 100;
    const totalScore = (baseScore + timeBonus) * comboMult;
    this.score += totalScore;
    GameManager.addXP(totalScore);
    GameManager.addScore(totalScore);
    GameManager.addCombo();

    // ── Laser attack animation ──
    this._animateLaserAttack(result, dmg, totalScore, timeBonus, comboMult);

    // Update HUD
    this._updateScore();
    this._updateCombo();
    this._updateEnemyHP();
    this._showFeedback(
      `✓ ${playerNum} ${this.selectedOp} ${this.enemyValue} = ${result}  →  ${dmg} DMG!` +
      (timeBonus > 0 ? `  ⏱+${timeBonus}` : "") +
      (comboMult > 1 ? `  🔥${comboMult}x` : ""),
      "#4ade80"
    );

    // Check if enemy defeated
    this.time.delayedCall(1000, () => {
      if (this.enemyHP <= 0) {
        this._defeatEnemy();
      } else {
        // Enemy survives — new round on same enemy
        this.selectedOp = null;
        this.roundActive = true;
        this._showCombatUI();
      }
    });
  }

  /* ═══════════════════════════════════════
   * WRONG ANSWER (for power-up auto-solve skip)
   * ═══════════════════════════════════════ */
  _handleWrongAnswer() {
    this.combo = 0;
    GameManager.resetCombo();

    this.playerHP = Math.max(0, this.playerHP - PLAYER_DMG_ON_WRONG);
    this._updatePlayerHP();

    this.cameras.main.shake(250, 0.015);
    this.cameras.main.flash(200, 255, 0, 0);
    this.damageParticles.emitParticleAt(140, 220, 20);

    this._showFeedback("✗ Wrong! −50 HP", "#ef4444");
    this._updateCombo();

    if (this.playerHP <= 0) {
      this.time.delayedCall(600, () => this._gameOver());
      return;
    }

    this.time.delayedCall(1000, () => {
      this.selectedOp = null;
      this.roundActive = true;
      this._showCombatUI();
    });
  }

  /* ═══════════════════════════════════════
   * LASER ATTACK ANIMATION
   * ═══════════════════════════════════════ */
  _animateLaserAttack(result, dmg, totalScore, timeBonus, comboMult) {
    // Arm raise
    if (this.playerRightArm) {
      this.tweens.add({
        targets: this.playerRightArm,
        angle: -30,
        yoyo: true,
        duration: 200,
      });
    }

    // Laser line
    const laser = this.add.rectangle(390, 210, 400, 4, 0x38bdf8, 1).setDepth(70);
    laser.setAlpha(0);

    this.tweens.add({
      targets: laser,
      alpha: 1,
      duration: 100,
      onComplete: () => {
        // Trail particles
        for (let i = 0; i < 8; i++) {
          this.laserParticles.emitParticleAt(200 + i * 55, 210, 3);
        }

        this.tweens.add({
          targets: laser,
          alpha: 0,
          scaleY: 3,
          duration: 200,
          onComplete: () => laser.destroy(),
        });

        // Hit effect
        this.hitParticles.emitParticleAt(640, 220, 25);
        this.cameras.main.flash(100, 255, 200, 50);

        // Enemy shake
        if (this.enemyGroup) {
          this.tweens.add({
            targets: this.enemyGroup,
            x: 650,
            yoyo: true,
            repeat: 2,
            duration: 60,
          });
        }

        // Damage popup
        const dmgPopup = this.add.text(640, 150, `−${dmg} HP`, {
          fontFamily: "Arial", fontSize: "22px", color: "#fbbf24",
          fontStyle: "bold", stroke: "#000000", strokeThickness: 3,
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({
          targets: dmgPopup,
          y: 100,
          alpha: 0,
          duration: 800,
          onComplete: () => dmgPopup.destroy(),
        });

        // Score popup
        const scorePopup = this.add.text(640, 170, `+${totalScore}`, {
          fontFamily: "Arial", fontSize: "16px", color: "#4ade80",
          fontStyle: "bold", stroke: "#000000", strokeThickness: 2,
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({
          targets: scorePopup,
          y: 120,
          alpha: 0,
          duration: 1000,
          onComplete: () => scorePopup.destroy(),
        });
      },
    });

    // Combo flash on high combos
    if (comboMult >= 3) {
      this.cameras.main.flash(200, 255, 215, 0);
    }
  }

  /* ═══════════════════════════════════════
   * DEFEAT ENEMY
   * ═══════════════════════════════════════ */
  _defeatEnemy() {
    // Explosion particles
    this.hitParticles.emitParticleAt(640, 220, 40);
    this.damageParticles.emitParticleAt(640, 220, 30);

    // Explode enemy
    if (this.enemyGroup) {
      this.tweens.add({
        targets: this.enemyGroup,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        angle: 15,
        duration: 400,
        ease: "Cubic.out",
        onComplete: () => {
          if (this.enemyGroup) this.enemyGroup.destroy();
        },
      });
    }

    // "DEFEATED" text
    const defeatTxt = this.add.text(640, 220, "💥 DEFEATED!", {
      fontFamily: "Arial Black, Arial",
      fontSize: "24px",
      color: "#fbbf24",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: defeatTxt,
      y: 180,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 1000,
      onComplete: () => defeatTxt.destroy(),
    });

    // Player victory pose
    if (this.playerGroup) {
      this.tweens.add({
        targets: this.playerGroup,
        y: 210,
        scaleX: 1.05,
        scaleY: 1.05,
        yoyo: true,
        duration: 300,
      });
    }

    this.cameras.main.flash(300, 255, 200, 50);

    // Next enemy after delay
    this.time.delayedCall(1200, () => {
      if (!this.isComplete) this._nextEnemy();
    });
  }

  /* ═══════════════════════════════════════
   * POWER-UPS
   * ═══════════════════════════════════════ */
  _showPowerUps() {
    const py = 490;
    const startX = W / 2 - 120;

    // Only show if uses remaining
    const powers = [
      {
        emoji: "🎯", label: "Auto-Solve", uses: this.powerAutoSolve,
        action: () => this._usePowerAutoSolve(),
      },
      {
        emoji: "⏰", label: "Time Freeze", uses: this.powerTimeFreeze,
        action: () => this._usePowerTimeFreeze(),
      },
      {
        emoji: "💪", label: "2x Damage", uses: this.powerDoubleDmg,
        action: () => this._usePowerDoubleDmg(),
      },
    ];

    powers.forEach((pw, i) => {
      if (pw.uses <= 0) return;
      const bx = startX + i * 120;
      const bg = this.add.rectangle(bx, py, 100, 32, 0x1e293b, 0.9).setDepth(50);
      bg.setStrokeStyle(1, 0x475569);
      const txt = this.add.text(bx, py, `${pw.emoji} ${pw.label}`, {
        fontFamily: "Arial", fontSize: "10px", color: "#e2e8f0",
      }).setOrigin(0.5).setDepth(51);

      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerover", () => bg.setStrokeStyle(1, 0xfbbf24));
      bg.on("pointerout", () => bg.setStrokeStyle(1, 0x475569));
      bg.on("pointerup", () => {
        pw.action();
        bg.destroy();
        txt.destroy();
      });

      this.roundElements.push(bg, txt);
    });
  }

  _usePowerAutoSolve() {
    if (this.powerAutoSolve <= 0 || !this.roundActive) return;
    this.powerAutoSolve--;

    // Auto-select + operation and first pool number
    this.selectedOp = "+";
    const num = this.numberPool[0];
    const result = num + this.enemyValue;

    this._showFeedback("🎯 Auto-Solve activated!", "#38bdf8");
    this.codeLine1.setText(`int playerNum = ${num};`);
    this.codeLine2.setText(`int enemyNum = ${this.enemyValue};`);
    this.codeLine3.setText(`int result = ${num} + ${this.enemyValue}; // = ${result}`);

    this.numberPool[0] = Phaser.Math.Between(-5, 5);
    this.roundActive = false;
    this._handleCorrectAnswer(num, result, 2000);
  }

  _usePowerTimeFreeze() {
    if (this.powerTimeFreeze <= 0) return;
    this.powerTimeFreeze--;
    this.timerFrozen = true;
    this._showFeedback("⏰ Timer frozen for 10s!", "#38bdf8");
    this.time.delayedCall(10000, () => {
      this.timerFrozen = false;
    });
  }

  _usePowerDoubleDmg() {
    if (this.powerDoubleDmg <= 0) return;
    this.powerDoubleDmg--;
    this.doubleDamageNext = true;
    this._showFeedback("💪 Next attack = 2x damage!", "#a78bfa");
  }

  /* ═══════════════════════════════════════
   * HUD UPDATES
   * ═══════════════════════════════════════ */
  _updatePlayerHP() {
    const pct = Math.max(0, this.playerHP / PLAYER_MAX_HP);
    this.tweens.add({
      targets: this.playerHPBarFill,
      displayWidth: 200 * pct,
      duration: 300,
    });
    this.playerHPText.setText(`${this.playerHP}/${PLAYER_MAX_HP}`);

    // Color shift
    if (pct > 0.5) this.playerHPBarFill.setFillStyle(0x3b82f6);
    else if (pct > 0.25) this.playerHPBarFill.setFillStyle(0xfbbf24);
    else this.playerHPBarFill.setFillStyle(0xef4444);
  }

  _updateEnemyHP() {
    const pct = Math.max(0, this.enemyHP / ENEMY_MAX_HP);
    this.tweens.add({
      targets: this.enemyHPBarFill,
      displayWidth: 200 * pct,
      duration: 300,
    });
    this.enemyHPText.setText(`${this.enemyHP}/${ENEMY_MAX_HP}`);
  }

  _updateScore() {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.score}`);
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.15, scaleY: 1.15,
        yoyo: true,
        duration: 100,
      });
    }
  }

  _updateCombo() {
    if (!this.comboText) return;
    if (this.combo >= 2) {
      let mult = 1;
      if (this.combo >= 10) mult = 5;
      else if (this.combo >= 5) mult = 3;
      else if (this.combo >= 3) mult = 2;
      this.comboText.setText(`🔥 ${this.combo}x COMBO!${mult > 1 ? ` (${mult}x multiplier)` : ""}`);
      this.comboText.setAlpha(1);
      this.tweens.add({
        targets: this.comboText,
        scaleX: 1.15, scaleY: 1.15,
        yoyo: true,
        duration: 120,
      });
    } else {
      this.comboText.setAlpha(0);
    }
  }

  _showFeedback(text, color) {
    if (!this.feedbackText) return;
    this.feedbackText.setText(text);
    this.feedbackText.setColor(color || "#ffffff");
    this.feedbackText.setAlpha(1);
    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      delay: 2000,
      duration: 500,
    });
  }

  /* ═══════════════════════════════════════
   * UPDATE LOOP
   * ═══════════════════════════════════════ */
  update() {
    // Timer display
    if (this.roundActive && !this.isComplete) {
      const elapsed = Math.round((this.time.now - this.roundStartTime) / 1000);
      if (this.timerFrozen) {
        this.timerText.setText("⏰ FROZEN");
        this.timerText.setColor("#38bdf8");
      } else {
        this.timerText.setText(`${elapsed}s`);
        if (elapsed <= 5) this.timerText.setColor("#4ade80");
        else if (elapsed <= 10) this.timerText.setColor("#fbbf24");
        else this.timerText.setColor("#ef4444");
      }
    }
  }

  /* ═══════════════════════════════════════
   * LEVEL COMPLETE
   * ═══════════════════════════════════════ */
  _levelComplete() {
    this.isComplete = true;
    const accuracy = Math.round((this.correctCount / (this.correctCount || 1)) * 100);

    GameManager.completeLevel(1, accuracy);
    BadgeSystem.unlock("math_warrior");
    ProgressTracker.saveProgress(GameManager.getState());

    this.cameras.main.flash(600, 255, 200, 50);

    // Clean up
    this.roundElements.forEach(e => { if (e && e.active) e.destroy(); });

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(200);

    const panelG = this.add.graphics().setDepth(201);
    panelG.fillStyle(0x1a1a2e, 0.95);
    panelG.fillRoundedRect(W / 2 - 260, 80, 520, 420, 16);
    panelG.lineStyle(3, 0xf59e0b);
    panelG.strokeRoundedRect(W / 2 - 260, 80, 520, 420, 16);

    this.add.text(W / 2, 120, "⚔️ LEVEL 2 COMPLETE!", {
      fontFamily: "Arial Black, Arial",
      fontSize: "28px", color: "#f59e0b", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202);

    this.add.text(W / 2, 155, "All enemies defeated!", {
      fontFamily: "Arial", fontSize: "16px", color: "#fbbf24",
    }).setOrigin(0.5).setDepth(202);

    // Stats
    const stats = [
      `Enemies Defeated: ${TOTAL_ENEMIES}`,
      `Correct Attacks: ${this.correctCount}`,
      `Final Score: ${this.score}`,
      `Max Combo: ${this.combo}`,
      `Player HP Remaining: ${this.playerHP}/${PLAYER_MAX_HP}`,
    ];
    stats.forEach((s, i) => {
      this.add.text(W / 2, 200 + i * 28, s, {
        fontFamily: "Arial", fontSize: "16px", color: "#e2e8f0",
      }).setOrigin(0.5).setDepth(202);
    });

    this.add.text(W / 2, 370, "⚔️ Badge Unlocked: Math Warrior!", {
      fontFamily: "Arial", fontSize: "16px", color: "#fbbf24", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202);

    this.add.text(W / 2, 400, "✅ You mastered integer operations\n(addition, subtraction, multiplication)", {
      fontFamily: "Arial", fontSize: "13px", color: "#94a3b8", align: "center", lineSpacing: 4,
    }).setOrigin(0.5).setDepth(202);

    // Buttons
    this._createEndBtn(W / 2 - 100, 455, "NEXT LEVEL →", 0x2563eb, () => {
      this.scene.stop("UIScene");
      this.scene.start("MenuScene");
    });
    this._createEndBtn(W / 2 + 100, 455, "REPLAY", 0xd97706, () => {
      GameManager.resetLevel();
      this.scene.restart();
    });
  }

  /* ═══════════════════════════════════════
   * GAME OVER
   * ═══════════════════════════════════════ */
  _gameOver() {
    this.isComplete = true;

    this.roundElements.forEach(e => { if (e && e.active) e.destroy(); });

    this.cameras.main.shake(500, 0.025);
    this.cameras.main.flash(400, 255, 0, 0);

    this.time.delayedCall(600, () => {
      const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(200);

      this.add.text(W / 2, H / 2 - 80, "💀 GAME OVER", {
        fontFamily: "Arial Black, Arial",
        fontSize: "34px", color: "#ef4444", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(201);

      this.add.text(W / 2, H / 2 - 30, `Defeated ${this.currentEnemy - 1} / ${TOTAL_ENEMIES} enemies`, {
        fontFamily: "Arial", fontSize: "18px", color: "#e2e8f0",
      }).setOrigin(0.5).setDepth(201);

      this.add.text(W / 2, H / 2 + 5, `Score: ${this.score}`, {
        fontFamily: "Arial", fontSize: "16px", color: "#fbbf24",
      }).setOrigin(0.5).setDepth(201);

      this._createEndBtn(W / 2 - 100, H / 2 + 70, "TRY AGAIN", 0xef4444, () => {
        GameManager.resetLevel();
        this.scene.restart();
      });
      this._createEndBtn(W / 2 + 100, H / 2 + 70, "MENU", 0x334155, () => {
        this.scene.stop("UIScene");
        this.scene.start("MenuScene");
      });
    });
  }

  /* ═══════════════════════════════════════
   * REUSABLE END BUTTON
   * ═══════════════════════════════════════ */
  _createEndBtn(x, y, text, color, callback) {
    const bg = this.add.rectangle(x, y, 170, 42, color, 1).setDepth(202);
    bg.setStrokeStyle(2, 0xffffff);
    const txt = this.add.text(x, y, text, {
      fontFamily: "Arial", fontSize: "15px", color: "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(203);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1.06, scaleY: 1.06, duration: 80 });
    });
    bg.on("pointerout", () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 80 });
    });
    bg.on("pointerup", callback);
  }

  /* ═══════════════════════════════════════
   * SHUTDOWN
   * ═══════════════════════════════════════ */
  shutdown() {
    this.roundElements = [];
    if (this.enemyGroup) this.enemyGroup.destroy();
  }
}
