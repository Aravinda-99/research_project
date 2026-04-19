/**
 * Level8Scene — "Char Tuning: ASCII Code Breaker" (Tuning Phase)
 * ================================================================
 * Mechanic: Cyber Hacking Lab / Code-Breaking Terminal
 * - 5 challenge rounds testing ASCII value knowledge
 * - Round 1: Match char → ASCII value
 * - Round 2: Match ASCII value → char
 * - Round 3: Compare two chars by ASCII value
 * - Round 4: Identify valid single chars
 * - Round 5: Predict code output involving char arithmetic
 *
 * Schema Theory: Tuning — refining char/ASCII understanding
 */

import Phaser from "phaser";
import { GameManager } from "../../GameManager.js";
import { BadgeSystem } from "../../BadgeSystem.js";
import { ProgressTracker } from "../../ProgressTracker.js";

/* ───────── Constants ───────── */
const W = 800;
const H = 600;
const ACCURACY_THRESHOLD = 80;
const TOTAL_ROUNDS = 5;
const QUESTIONS_PER_ROUND = 5;
const TOTAL_QUESTIONS = TOTAL_ROUNDS * QUESTIONS_PER_ROUND;
const MAX_LIVES = 3;

/* ───────── Question Banks ───────── */
const ROUND1_QUESTIONS = [
  { question: "'A'", options: ["65", "97", "66", "48"], correctIndex: 0, explanation: "'A' has ASCII value 65" },
  { question: "'a'", options: ["65", "97", "98", "96"], correctIndex: 1, explanation: "'a' has ASCII value 97 (lowercase = uppercase + 32)" },
  { question: "'Z'", options: ["122", "90", "91", "88"], correctIndex: 1, explanation: "'Z' has ASCII value 90" },
  { question: "'0'", options: ["0", "30", "48", "57"], correctIndex: 2, explanation: "'0' (digit char) has ASCII value 48, not 0!" },
  { question: "'!'", options: ["21", "33", "64", "35"], correctIndex: 1, explanation: "'!' has ASCII value 33" },
];

const ROUND2_QUESTIONS = [
  { question: "65", options: ["'A'", "'a'", "'B'", "'@'"], correctIndex: 0, explanation: "ASCII 65 = 'A' (first uppercase letter)" },
  { question: "97", options: ["'A'", "'a'", "'z'", "'1'"], correctIndex: 1, explanation: "ASCII 97 = 'a' (first lowercase letter)" },
  { question: "48", options: ["'0'", "'9'", "'A'", "' '"], correctIndex: 0, explanation: "ASCII 48 = '0' (first digit character)" },
  { question: "32", options: ["'0'", "'!'", "' '", "'@'"], correctIndex: 2, explanation: "ASCII 32 = ' ' (space character)" },
  { question: "64", options: ["'A'", "'@'", "'a'", "'#'"], correctIndex: 1, explanation: "ASCII 64 = '@' (at symbol)" },
];

const ROUND3_QUESTIONS = [
  { chars: ["'A'", "'a'"], asciiVals: [65, 97], correctIndex: 0, explanation: "'A'=65 < 'a'=97 — uppercase letters have LOWER ASCII values!" },
  { chars: ["'Z'", "'A'"], asciiVals: [90, 65], correctIndex: 1, explanation: "'A'=65 < 'Z'=90 — earlier letters have lower values" },
  { chars: ["'0'", "'A'"], asciiVals: [48, 65], correctIndex: 0, explanation: "'0'=48 < 'A'=65 — digits come before letters in ASCII" },
  { chars: ["'z'", "'a'"], asciiVals: [122, 97], correctIndex: 1, explanation: "'a'=97 < 'z'=122 — same pattern as uppercase" },
  { chars: ["' '", "'!'"], asciiVals: [32, 33], correctIndex: 0, explanation: "' '=32 < '!'=33 — space is the lowest printable ASCII" },
];

const ROUND4_QUESTIONS = [
  { value: "'A'", isValid: true, explanation: "Single letter in single quotes — valid char!" },
  { value: "\"AB\"", isValid: false, explanation: "\"AB\" is a STRING (double quotes, multiple chars) — not a char!" },
  { value: "65", isValid: false, explanation: "65 is an INTEGER — chars use single quotes like 'A'!" },
  { value: "' '", isValid: true, explanation: "Space in single quotes — valid char! (ASCII 32)" },
  { value: "'XY'", isValid: false, explanation: "'XY' has TWO characters — a char holds exactly ONE!" },
];

const ROUND5_QUESTIONS = [
  { code: "char c = 'A';\nc = c + 1;", options: ["'A'", "'B'", "'C'", "66"], correctIndex: 1, explanation: "'A' is 65, +1 = 66 = 'B'" },
  { code: "char c = '0' + 5;", options: ["'5'", "'0'", "5", "53"], correctIndex: 0, explanation: "'0' is ASCII 48, +5 = 53 = '5'" },
  { code: "int x = 'Z' - 'A';", options: ["25", "26", "0", "90"], correctIndex: 0, explanation: "'Z'=90, 'A'=65, difference = 25" },
  { code: "char c = 'a';\nc = c - 32;", options: ["'A'", "'a'", "'!'", "65"], correctIndex: 0, explanation: "'a'=97, -32 = 65 = 'A' (lowercase→uppercase trick!)" },
  { code: "int x = 'B' - 'A';", options: ["0", "1", "2", "'B'"], correctIndex: 1, explanation: "'B'=66, 'A'=65, difference = 1" },
];

const ROUND_NAMES = [
  "ASCII Decoder",
  "Reverse Decoder",
  "Char Comparator",
  "Type Identifier",
  "Code Output",
];

/* ───────── Helper ───────── */
function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/* ═══════════════════════════════════════════════════════════════
 *  LEVEL 8 SCENE
 * ═══════════════════════════════════════════════════════════════ */
export class Level8Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Level8Scene" });
  }

  create() {
    this.physics.world.gravity.y = 0;

    /* ── State ── */
    this.currentRound = 0;
    this.currentQuestion = 0;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.isComplete = false;
    this.gameStarted = false;
    this.startTime = 0;
    this.answered = false;
    this.retryAvailable = false;
    this.roundElements = [];

    this._drawCyberBackground();
    this._generateTextures();
    this._createParticles();
    this._createAmbientBinary();
    this._createHUD();

    const uiScene = this.scene.get("UIScene");
    if (uiScene && uiScene.setLevelLabel) {
      uiScene.setLevelLabel("Level 8: Tuning — ASCII Code Breaker!");
    }

    this._showInstruction();
  }

  /* ═══════════════════════════════════════════════════════════════
   *  CYBER BACKGROUND
   * ═══════════════════════════════════════════════════════════════ */
  _drawCyberBackground() {
    const gfx = this.add.graphics().setDepth(0);
    const topColor = 0x0a0f1a;
    const botColor = 0x0d1117;
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const c = lerpColor(topColor, botColor, t);
      gfx.fillStyle(c, 1);
      gfx.fillRect(0, Math.floor((H * i) / steps), W, Math.ceil(H / steps) + 1);
    }

    /* Grid lines — faint cyan, slowly scrolling */
    this.gridGfx = this.add.graphics().setDepth(1).setAlpha(0.06);
    this._drawGrid(0);

    this.gridOffset = 0;

    /* Scan line overlay — CRT style */
    const scanGfx = this.add.graphics().setDepth(2).setAlpha(0.03);
    for (let y = 0; y < H; y += 3) {
      scanGfx.fillStyle(0x000000, 1);
      scanGfx.fillRect(0, y, W, 1);
    }

    /* Screen flicker (subtle alpha flash) */
    this.flickerOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x00ffff, 0).setDepth(3);
    this.time.addEvent({
      delay: Phaser.Math.Between(4000, 8000),
      callback: () => {
        if (this.flickerOverlay && this.flickerOverlay.active) {
          this.tweens.add({
            targets: this.flickerOverlay,
            alpha: 0.03,
            duration: 60,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              if (this.flickerOverlay && this.flickerOverlay.active) {
                this.flickerOverlay.setAlpha(0);
              }
            },
          });
        }
        this.time.addEvent({
          delay: Phaser.Math.Between(4000, 8000),
          callback: arguments.callee,
          callbackScope: this,
        });
      },
      callbackScope: this,
    });
  }

  _drawGrid(offset) {
    this.gridGfx.clear();
    this.gridGfx.lineStyle(1, 0x00ffff, 1);
    const spacing = 40;
    for (let x = 0; x < W; x += spacing) {
      this.gridGfx.beginPath();
      this.gridGfx.moveTo(x, 0);
      this.gridGfx.lineTo(x, H);
      this.gridGfx.strokePath();
    }
    const yOff = offset % spacing;
    for (let y = -spacing + yOff; y < H + spacing; y += spacing) {
      this.gridGfx.beginPath();
      this.gridGfx.moveTo(0, y);
      this.gridGfx.lineTo(W, y);
      this.gridGfx.strokePath();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   *  TEXTURES
   * ═══════════════════════════════════════════════════════════════ */
  _generateTextures() {
    if (!this.textures.exists("cyanSpark")) {
      const g = this.add.graphics();
      g.fillStyle(0x00ffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("cyanSpark", 8, 8);
      g.destroy();
    }
    if (!this.textures.exists("greenSpark")) {
      const g = this.add.graphics();
      g.fillStyle(0x00ff88, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("greenSpark", 8, 8);
      g.destroy();
    }
    if (!this.textures.exists("redSpark")) {
      const g = this.add.graphics();
      g.fillStyle(0xe74c3c, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("redSpark", 8, 8);
      g.destroy();
    }
    if (!this.textures.exists("confettiSpark")) {
      const g = this.add.graphics();
      g.fillStyle(0xffd700, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("confettiSpark", 8, 8);
      g.destroy();
    }
    if (!this.textures.exists("binarySpark")) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(2, 2, 2);
      g.generateTexture("binarySpark", 4, 4);
      g.destroy();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   *  PARTICLES
   * ═══════════════════════════════════════════════════════════════ */
  _createParticles() {
    this.correctParticles = this.add.particles(0, 0, "greenSpark", {
      speed: { min: 80, max: 250 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 700,
      blendMode: "ADD",
      emitting: false,
    }).setDepth(160);

    this.wrongParticles = this.add.particles(0, 0, "redSpark", {
      speed: { min: 60, max: 180 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      blendMode: "ADD",
      emitting: false,
    }).setDepth(160);

    this.cyanParticles = this.add.particles(0, 0, "cyanSpark", {
      speed: { min: 40, max: 120 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 900,
      blendMode: "ADD",
      emitting: false,
    }).setDepth(160);

    this.confettiParticles = this.add.particles(0, 0, "confettiSpark", {
      speed: { min: 40, max: 180 },
      angle: { min: 230, max: 310 },
      scale: { start: 1, end: 0.3 },
      alpha: { start: 1, end: 0 },
      lifespan: 2500,
      gravityY: 120,
      emitting: false,
    }).setDepth(160);
  }

  /* ═══════════════════════════════════════════════════════════════
   *  AMBIENT BINARY RAIN
   * ═══════════════════════════════════════════════════════════════ */
  _createAmbientBinary() {
    this.binaryDigits = [];
    for (let i = 0; i < 35; i++) {
      const x = Phaser.Math.Between(10, W - 10);
      const y = Phaser.Math.Between(0, H);
      const digit = Math.random() > 0.5 ? "1" : "0";
      const alpha = Phaser.Math.FloatBetween(0.04, 0.15);
      const size = Phaser.Math.Between(10, 16);
      const txt = this.add.text(x, y, digit, {
        fontFamily: "Courier New, monospace",
        fontSize: `${size}px`,
        color: "#00ffff",
      }).setAlpha(alpha).setDepth(2);
      this.binaryDigits.push({
        obj: txt,
        speed: Phaser.Math.FloatBetween(0.3, 1.2),
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   *  HUD — persistent across rounds
   * ═══════════════════════════════════════════════════════════════ */
  _createHUD() {
    const dp = 100;

    /* Top bar background */
    this.add.rectangle(W / 2, 30, W, 50, 0x0a0f1a, 0.85).setDepth(dp - 1);
    this.add.rectangle(W / 2, 55, W, 1, 0x00ffff, 0.15).setDepth(dp - 1);

    /* Score */
    this.scoreText = this.add.text(16, 18, "SCORE: 0", {
      fontFamily: "Courier New, monospace",
      fontSize: "16px",
      color: "#00ffff",
      fontStyle: "bold",
    }).setDepth(dp);

    /* Round indicator */
    this.roundText = this.add.text(W / 2, 18, "ROUND 1/5", {
      fontFamily: "Courier New, monospace",
      fontSize: "16px",
      color: "#00ff88",
      fontStyle: "bold",
    }).setOrigin(0.5, 0).setDepth(dp);

    /* Lives */
    this.livesText = this.add.text(W - 16, 18, "♥♥♥", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ff4444",
      fontStyle: "bold",
    }).setOrigin(1, 0).setDepth(dp);

    /* Accuracy */
    this.accuracyText = this.add.text(W - 16, 38, "ACC: 100%", {
      fontFamily: "Courier New, monospace",
      fontSize: "12px",
      color: "#aaaaaa",
    }).setOrigin(1, 0).setDepth(dp);

    /* Combo */
    this.comboText = this.add.text(16, 38, "", {
      fontFamily: "Courier New, monospace",
      fontSize: "12px",
      color: "#fbbf24",
      fontStyle: "bold",
    }).setAlpha(0).setDepth(dp);

    /* Progress dots (bottom) */
    this.progressDots = [];
    const dotStartX = W / 2 - (TOTAL_ROUNDS - 1) * 20;
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const dot = this.add.circle(dotStartX + i * 40, H - 20, 8, 0x333333, 0.8).setDepth(dp);
      dot.setStrokeStyle(1.5, 0x00ffff, 0.4);
      this.progressDots.push(dot);
    }
    this.add.text(W / 2, H - 38, "ROUNDS", {
      fontFamily: "Courier New, monospace",
      fontSize: "9px",
      color: "#555555",
    }).setOrigin(0.5).setDepth(dp);
  }

  _updateHUD() {
    if (this.scoreText && this.scoreText.active) {
      this.scoreText.setText(`SCORE: ${this.score}`);
    }
    if (this.roundText && this.roundText.active) {
      this.roundText.setText(`ROUND ${this.currentRound + 1}/${TOTAL_ROUNDS}`);
    }
    if (this.livesText && this.livesText.active) {
      let hearts = "";
      for (let i = 0; i < MAX_LIVES; i++) {
        hearts += i < this.lives ? "♥" : "♡";
      }
      this.livesText.setText(hearts);
    }
    if (this.accuracyText && this.accuracyText.active) {
      const total = this.correctAnswers + this.wrongAnswers;
      const acc = total > 0 ? Math.round((this.correctAnswers / total) * 100) : 100;
      this.accuracyText.setText(`ACC: ${acc}%`);
    }
    if (this.comboText && this.comboText.active) {
      if (this.combo >= 2) {
        this.comboText.setText(`${this.combo}x COMBO`);
        this.comboText.setAlpha(1);
      } else {
        this.comboText.setAlpha(0);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   *  INSTRUCTION OVERLAY
   * ═══════════════════════════════════════════════════════════════ */
  _showInstruction() {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(200);

    const panelG = this.add.graphics().setDepth(201);
    panelG.fillStyle(0x0d1b2a, 0.98);
    panelG.fillRoundedRect(W / 2 - 320, 30, 640, 530, 16);
    panelG.lineStyle(3, 0x00ffff);
    panelG.strokeRoundedRect(W / 2 - 320, 30, 640, 530, 16);

    const title = this.add.text(W / 2, 68, "🔤 MISSION 8: ASCII CODE BREAKER", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "24px",
      color: "#00ffff",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202);

    const sub = this.add.text(W / 2, 98, "Master the numbers behind characters", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#4ecdc4",
      fontStyle: "italic",
    }).setOrigin(0.5).setDepth(202);

    const desc = this.add.text(W / 2, 195,
      "Every character has a secret number called its ASCII value!\n" +
      "You must decode, convert, and compare these values.\n\n" +
      "Quick Reference:\n" +
      "  A = 65    a = 97    0 = 48    space = 32\n" +
      "  Z = 90    z = 122   9 = 57    ! = 33\n\n" +
      "5 Rounds — 5 Questions Each:\n" +
      "  R1: Match char → ASCII value\n" +
      "  R2: Match ASCII value → char\n" +
      "  R3: Compare two chars\n" +
      "  R4: Identify valid chars\n" +
      "  R5: Predict code output",
      {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        color: "#bdc3c7",
        align: "center",
        lineSpacing: 5,
      }
    ).setOrigin(0.5).setDepth(202);

    const goal = this.add.text(W / 2, 410, "Score 80%+ accuracy to unlock the\nASCII Master badge! 🔤", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#f1c40f",
      align: "center",
      fontStyle: "bold",
      lineSpacing: 6,
    }).setOrigin(0.5).setDepth(202);

    const warn = this.add.text(W / 2, 455, "⚠ 3 lives only — each wrong answer costs 1 life!", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#e74c3c",
      align: "center",
    }).setOrigin(0.5).setDepth(202);

    const btnBg = this.add.rectangle(W / 2, 505, 260, 48, 0x004d40, 1).setDepth(202);
    btnBg.setStrokeStyle(2, 0x00ffff);
    const btnTxt = this.add.text(W / 2, 505, "BEGIN HACKING", {
      fontFamily: "Courier New, monospace",
      fontSize: "20px",
      color: "#00ffff",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(203);

    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on("pointerover", () => {
      btnBg.setFillStyle(0x00796b);
      this.tweens.add({ targets: [btnBg, btnTxt], scaleX: 1.08, scaleY: 1.08, duration: 120 });
    });
    btnBg.on("pointerout", () => {
      btnBg.setFillStyle(0x004d40);
      this.tweens.add({ targets: [btnBg, btnTxt], scaleX: 1, scaleY: 1, duration: 120 });
    });
    btnBg.on("pointerup", () => {
      [overlay, panelG, title, sub, desc, goal, warn, btnBg, btnTxt].forEach(e => e.destroy());
      this._startGame();
    });
  }

  /* ═══════════════════════════════════════════════════════════════
   *  START GAME
   * ═══════════════════════════════════════════════════════════════ */
  _startGame() {
    this.gameStarted = true;
    this.startTime = this.time.now;
    GameManager.set("lives", MAX_LIVES);
    this._showRound();
  }

  /* ═══════════════════════════════════════════════════════════════
   *  ROUND DISPLAY
   * ═══════════════════════════════════════════════════════════════ */
  _showRound() {
    this._clearRoundElements();
    this.currentQuestion = 0;
    this.answered = false;
    this.retryAvailable = false;
    this._updateHUD();

    /* Round header transition */
    const headerBg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(140);
    const headerText = this.add.text(W / 2, H / 2 - 20,
      `ROUND ${this.currentRound + 1}/${TOTAL_ROUNDS}`, {
      fontFamily: "Courier New, monospace",
      fontSize: "36px",
      color: "#00ffff",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(141);
    const nameText = this.add.text(W / 2, H / 2 + 25, ROUND_NAMES[this.currentRound], {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#4ecdc4",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(141);

    headerText.setScale(0);
    nameText.setAlpha(0);

    this.tweens.add({
      targets: headerText,
      scaleX: 1, scaleY: 1,
      duration: 400,
      ease: "Back.out",
    });
    this.tweens.add({
      targets: nameText,
      alpha: 1,
      duration: 400,
      delay: 200,
    });

    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: [headerBg, headerText, nameText],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          headerBg.destroy();
          headerText.destroy();
          nameText.destroy();
          this._showQuestion();
        },
      });
    });
  }

  _clearRoundElements() {
    this.roundElements.forEach(el => {
      if (el && el.active) {
        this.tweens.killTweensOf(el);
        el.destroy();
      }
    });
    this.roundElements = [];
  }

  /* ═══════════════════════════════════════════════════════════════
   *  QUESTION DISPLAY — dispatches to the right round handler
   * ═══════════════════════════════════════════════════════════════ */
  _showQuestion() {
    this._clearRoundElements();
    this.answered = false;
    this.retryAvailable = false;

    if (this.isComplete) return;

    /* Round progress bar */
    const progBg = this.add.rectangle(W / 2, 70, 300, 10, 0x1a2332, 0.8).setDepth(110);
    progBg.setStrokeStyle(1, 0x00ffff, 0.3);
    const progFill = this.add.rectangle(W / 2 - 150, 70, 300 * (this.currentQuestion / QUESTIONS_PER_ROUND), 8, 0x00ffff, 0.6)
      .setOrigin(0, 0.5).setDepth(111);
    const progLabel = this.add.text(W / 2, 84, `Q${this.currentQuestion + 1}/${QUESTIONS_PER_ROUND}: ${ROUND_NAMES[this.currentRound]}`, {
      fontFamily: "Courier New, monospace",
      fontSize: "11px",
      color: "#00ffff",
    }).setOrigin(0.5).setDepth(111);
    this.roundElements.push(progBg, progFill, progLabel);

    switch (this.currentRound) {
      case 0: this._showRound1Question(); break;
      case 1: this._showRound2Question(); break;
      case 2: this._showRound3Question(); break;
      case 3: this._showRound4Question(); break;
      case 4: this._showRound5Question(); break;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   *  CENTRAL DISPLAY PANEL (reused by all rounds)
   * ═══════════════════════════════════════════════════════════════ */
  _createCentralPanel(yPos, panelH) {
    const panelW = 520;
    const px = W / 2 - panelW / 2;
    const py = yPos;

    const panel = this.add.graphics().setDepth(110);
    panel.fillStyle(0x0d1b2a, 0.95);
    panel.fillRoundedRect(px, py, panelW, panelH, 12);
    panel.lineStyle(2, 0x00ffff, 0.7);
    panel.strokeRoundedRect(px, py, panelW, panelH, 12);
    this.roundElements.push(panel);

    return { x: W / 2, y: py + panelH / 2, w: panelW, h: panelH, top: py };
  }

  /* ═══════════════════════════════════════════════════════════════
   *  ANSWER BUTTONS (4-button grid or 2-button row)
   * ═══════════════════════════════════════════════════════════════ */
  _createAnswerButtons(options, correctIndex, onAnswerCallback, yStart) {
    const btnW = 170;
    const btnH = 48;
    const gapX = 20;
    const gapY = 14;
    const cols = options.length <= 2 ? options.length : 2;
    const rows = Math.ceil(options.length / cols);

    const totalW = cols * btnW + (cols - 1) * gapX;
    const startX = W / 2 - totalW / 2 + btnW / 2;

    const buttons = [];

    options.forEach((opt, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * (btnW + gapX);
      const by = yStart + row * (btnH + gapY);

      const bg = this.add.rectangle(bx, by, btnW, btnH, 0x1a2332, 0.9).setDepth(120);
      bg.setStrokeStyle(2, 0x00ffff, 0.5);

      const fontSize = opt.length > 15 ? "12px" : opt.length > 8 ? "14px" : "18px";
      const txt = this.add.text(bx, by, opt, {
        fontFamily: "Courier New, monospace",
        fontSize,
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: btnW - 16 },
      }).setOrigin(0.5).setDepth(121);

      bg.setInteractive({ useHandCursor: true });

      bg.on("pointerover", () => {
        if (this.answered) return;
        bg.setStrokeStyle(2, 0x00ffff, 1);
        this.tweens.add({ targets: [bg, txt], scaleX: 1.05, scaleY: 1.05, duration: 80 });
      });
      bg.on("pointerout", () => {
        if (this.answered) return;
        bg.setStrokeStyle(2, 0x00ffff, 0.5);
        this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 80 });
      });
      bg.on("pointerup", () => {
        if (this.answered) return;
        onAnswerCallback(i, bg, txt, buttons);
      });

      this.roundElements.push(bg, txt);
      buttons.push({ bg, txt, index: i });
    });

    return buttons;
  }

  /* ═══════════════════════════════════════════════════════════════
   *  HANDLE ANSWER
   * ═══════════════════════════════════════════════════════════════ */
  _handleAnswer(selectedIndex, correctIndex, explanation, selectedBg, selectedTxt, allButtons) {
    this.answered = true;
    const isCorrect = selectedIndex === correctIndex;

    if (isCorrect) {
      this._onCorrectAnswer(selectedBg, selectedTxt, allButtons, correctIndex, explanation);
    } else {
      this._onWrongAnswer(selectedBg, selectedTxt, allButtons, correctIndex, explanation);
    }
  }

  _onCorrectAnswer(selectedBg, selectedTxt, allButtons, correctIndex, explanation) {
    this.correctAnswers++;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    const multiplier = this.combo >= 5 ? 3 : this.combo >= 3 ? 2 : 1;
    const points = this.retryAvailable ? 10 : 25 * multiplier;
    this.score += points;

    GameManager.addXP(points);
    GameManager.addScore(points);
    GameManager.addCombo();

    /* Visual feedback */
    selectedBg.setFillStyle(0x004d40, 1);
    selectedBg.setStrokeStyle(3, 0x00ff88, 1);

    this.correctParticles.emitParticleAt(selectedBg.x, selectedBg.y, 20);
    this.cyanParticles.emitParticleAt(selectedBg.x, selectedBg.y - 30, 10);

    this._showPopup(selectedBg.x, selectedBg.y - 40, this.retryAvailable ? "✓ +10" : `✓ +${points}`, "#00ff88");

    /* Show explanation */
    const expTxt = this.add.text(W / 2, 520, explanation, {
      fontFamily: "Courier New, monospace",
      fontSize: "12px",
      color: "#4ecdc4",
      align: "center",
      wordWrap: { width: 500 },
    }).setOrigin(0.5).setDepth(130).setAlpha(0);
    this.roundElements.push(expTxt);
    this.tweens.add({ targets: expTxt, alpha: 1, duration: 300 });

    /* Grey out other buttons */
    allButtons.forEach(btn => {
      if (btn.index !== correctIndex) {
        btn.bg.setAlpha(0.3);
        btn.txt.setAlpha(0.3);
      }
    });

    this._updateHUD();

    /* Advance after delay */
    this.time.delayedCall(1200, () => this._advanceQuestion());
  }

  _onWrongAnswer(selectedBg, selectedTxt, allButtons, correctIndex, explanation) {
    this.wrongAnswers++;
    this.combo = 0;
    this.lives--;

    GameManager.resetCombo();
    GameManager.loseLife();

    /* Visual feedback */
    selectedBg.setFillStyle(0x4a1e1e, 1);
    selectedBg.setStrokeStyle(3, 0xff4444, 1);

    this.wrongParticles.emitParticleAt(selectedBg.x, selectedBg.y, 15);
    this.cameras.main.shake(200, 0.012);
    this.cameras.main.flash(150, 255, 50, 0);

    this._showPopup(selectedBg.x, selectedBg.y - 40, "✗ WRONG", "#ff4444");

    /* Highlight correct answer */
    const correctBtn = allButtons.find(b => b.index === correctIndex);
    if (correctBtn) {
      correctBtn.bg.setFillStyle(0x004d40, 1);
      correctBtn.bg.setStrokeStyle(3, 0x00ff88, 1);
      this.tweens.add({
        targets: [correctBtn.bg, correctBtn.txt],
        scaleX: 1.1, scaleY: 1.1,
        duration: 200,
        yoyo: true,
        repeat: 1,
      });
    }

    /* Show explanation */
    const expTxt = this.add.text(W / 2, 520, explanation, {
      fontFamily: "Courier New, monospace",
      fontSize: "12px",
      color: "#ff8888",
      align: "center",
      wordWrap: { width: 500 },
    }).setOrigin(0.5).setDepth(130).setAlpha(0);
    this.roundElements.push(expTxt);
    this.tweens.add({ targets: expTxt, alpha: 1, duration: 300 });

    this._updateHUD();

    /* Check game over */
    if (this.lives <= 0) {
      this.time.delayedCall(1000, () => this._gameOver());
      return;
    }

    /* Advance after delay */
    this.time.delayedCall(1500, () => this._advanceQuestion());
  }

  _advanceQuestion() {
    this.currentQuestion++;
    if (this.currentQuestion >= QUESTIONS_PER_ROUND) {
      this._completeRound();
    } else {
      this._showQuestion();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   *  ROUND COMPLETE
   * ═══════════════════════════════════════════════════════════════ */
  _completeRound() {
    this._clearRoundElements();

    /* Light up progress dot */
    if (this.progressDots[this.currentRound]) {
      this.progressDots[this.currentRound].setFillStyle(0x00ffff, 0.9);
      this.tweens.add({
        targets: this.progressDots[this.currentRound],
        scaleX: 1.4, scaleY: 1.4,
        duration: 200,
        yoyo: true,
      });
    }

    this.currentRound++;

    if (this.currentRound >= TOTAL_ROUNDS) {
      this.time.delayedCall(500, () => this._levelComplete());
      return;
    }

    /* Round complete transition */
    const compBg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(140);
    const compText = this.add.text(W / 2, H / 2 - 10, "ROUND COMPLETE", {
      fontFamily: "Courier New, monospace",
      fontSize: "28px",
      color: "#00ff88",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(141);
    const scoreShow = this.add.text(W / 2, H / 2 + 30, `Score: ${this.score}`, {
      fontFamily: "Courier New, monospace",
      fontSize: "18px",
      color: "#00ffff",
    }).setOrigin(0.5).setDepth(141);

    compText.setScale(0);
    this.tweens.add({
      targets: compText,
      scaleX: 1, scaleY: 1,
      duration: 300,
      ease: "Back.out",
    });

    this.cyanParticles.emitParticleAt(W / 2, H / 2, 25);

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: [compBg, compText, scoreShow],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          compBg.destroy();
          compText.destroy();
          scoreShow.destroy();
          this._showRound();
        },
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
   *  ROUND 1: Match char → ASCII value
   * ═══════════════════════════════════════════════════════════════ */
  _showRound1Question() {
    const q = ROUND1_QUESTIONS[this.currentQuestion];
    const panel = this._createCentralPanel(100, 180);

    /* Prompt label */
    const label = this.add.text(panel.x, panel.top + 25, "What is the ASCII value of:", {
      fontFamily: "Courier New, monospace",
      fontSize: "14px",
      color: "#aaaaaa",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(label);

    /* Character display */
    const charDisplay = this.add.text(panel.x, panel.top + 85, q.question, {
      fontFamily: "Courier New, monospace",
      fontSize: "52px",
      color: "#00ffff",
      fontStyle: "bold",
      stroke: "#0d1b2a",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(charDisplay);

    /* Glow pulse on the char */
    this.tweens.add({
      targets: charDisplay,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    /* Decorative brackets */
    const leftBracket = this.add.text(panel.x - 80, panel.top + 85, "[", {
      fontFamily: "Courier New, monospace",
      fontSize: "52px",
      color: "#335566",
    }).setOrigin(0.5).setDepth(114);
    const rightBracket = this.add.text(panel.x + 80, panel.top + 85, "]", {
      fontFamily: "Courier New, monospace",
      fontSize: "52px",
      color: "#335566",
    }).setOrigin(0.5).setDepth(114);
    this.roundElements.push(leftBracket, rightBracket);

    /* Subtitle */
    const subLabel = this.add.text(panel.x, panel.top + 145, "SELECT THE CORRECT ASCII CODE", {
      fontFamily: "Courier New, monospace",
      fontSize: "10px",
      color: "#556677",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(subLabel);

    /* Answer buttons */
    this._createAnswerButtons(q.options, q.correctIndex, (i, bg, txt, buttons) => {
      this._handleAnswer(i, q.correctIndex, q.explanation, bg, txt, buttons);
    }, 330);
  }

  /* ═══════════════════════════════════════════════════════════════
   *  ROUND 2: Match ASCII value → char
   * ═══════════════════════════════════════════════════════════════ */
  _showRound2Question() {
    const q = ROUND2_QUESTIONS[this.currentQuestion];
    const panel = this._createCentralPanel(100, 180);

    const label = this.add.text(panel.x, panel.top + 25, "Which character has ASCII value:", {
      fontFamily: "Courier New, monospace",
      fontSize: "14px",
      color: "#aaaaaa",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(label);

    /* ASCII value display */
    const valDisplay = this.add.text(panel.x, panel.top + 85, q.question, {
      fontFamily: "Courier New, monospace",
      fontSize: "52px",
      color: "#ff6bcb",
      fontStyle: "bold",
      stroke: "#0d1b2a",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(valDisplay);

    this.tweens.add({
      targets: valDisplay,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    /* ASCII prefix */
    const prefix = this.add.text(panel.x - 70, panel.top + 55, "ASCII", {
      fontFamily: "Courier New, monospace",
      fontSize: "12px",
      color: "#556677",
    }).setOrigin(0.5).setDepth(114);
    this.roundElements.push(prefix);

    const subLabel = this.add.text(panel.x, panel.top + 145, "SELECT THE MATCHING CHARACTER", {
      fontFamily: "Courier New, monospace",
      fontSize: "10px",
      color: "#556677",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(subLabel);

    this._createAnswerButtons(q.options, q.correctIndex, (i, bg, txt, buttons) => {
      this._handleAnswer(i, q.correctIndex, q.explanation, bg, txt, buttons);
    }, 330);
  }

  /* ═══════════════════════════════════════════════════════════════
   *  ROUND 3: Char Comparator
   * ═══════════════════════════════════════════════════════════════ */
  _showRound3Question() {
    const q = ROUND3_QUESTIONS[this.currentQuestion];
    const panel = this._createCentralPanel(100, 160);

    const label = this.add.text(panel.x, panel.top + 22, "Which has the LOWER ASCII value?", {
      fontFamily: "Courier New, monospace",
      fontSize: "15px",
      color: "#f1c40f",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(label);

    /* Two chars side by side */
    const char1 = this.add.text(panel.x - 80, panel.top + 90, q.chars[0], {
      fontFamily: "Courier New, monospace",
      fontSize: "42px",
      color: "#00ffff",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(115);

    const vsText = this.add.text(panel.x, panel.top + 90, "vs", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#555555",
      fontStyle: "italic",
    }).setOrigin(0.5).setDepth(115);

    const char2 = this.add.text(panel.x + 80, panel.top + 90, q.chars[1], {
      fontFamily: "Courier New, monospace",
      fontSize: "42px",
      color: "#ff6bcb",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(char1, vsText, char2);

    /* Hidden ASCII values (shown after answer) */
    const asciiHint1 = this.add.text(panel.x - 80, panel.top + 130, `(${q.asciiVals[0]})`, {
      fontFamily: "Courier New, monospace",
      fontSize: "12px",
      color: "#00ffff",
    }).setOrigin(0.5).setDepth(115).setAlpha(0);
    const asciiHint2 = this.add.text(panel.x + 80, panel.top + 130, `(${q.asciiVals[1]})`, {
      fontFamily: "Courier New, monospace",
      fontSize: "12px",
      color: "#ff6bcb",
    }).setOrigin(0.5).setDepth(115).setAlpha(0);
    this.roundElements.push(asciiHint1, asciiHint2);

    /* Two answer buttons */
    const options = q.chars;
    this._createAnswerButtons(options, q.correctIndex, (i, bg, txt, buttons) => {
      /* Reveal ASCII values */
      this.tweens.add({ targets: asciiHint1, alpha: 1, duration: 300 });
      this.tweens.add({ targets: asciiHint2, alpha: 1, duration: 300 });
      this._handleAnswer(i, q.correctIndex, q.explanation, bg, txt, buttons);
    }, 320);
  }

  /* ═══════════════════════════════════════════════════════════════
   *  ROUND 4: Type Identifier
   * ═══════════════════════════════════════════════════════════════ */
  _showRound4Question() {
    const q = ROUND4_QUESTIONS[this.currentQuestion];
    const panel = this._createCentralPanel(100, 180);

    const label = this.add.text(panel.x, panel.top + 22, "Is this a VALID single char?", {
      fontFamily: "Courier New, monospace",
      fontSize: "15px",
      color: "#f1c40f",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(label);

    /* Value display */
    const valDisplay = this.add.text(panel.x, panel.top + 95, q.value, {
      fontFamily: "Courier New, monospace",
      fontSize: "40px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#0d1b2a",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(valDisplay);

    this.tweens.add({
      targets: valDisplay,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    const subLabel = this.add.text(panel.x, panel.top + 150, "Can this fit in a char variable?", {
      fontFamily: "Courier New, monospace",
      fontSize: "10px",
      color: "#556677",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(subLabel);

    /* Two buttons: VALID / INVALID */
    const correctIndex = q.isValid ? 0 : 1;
    const options = ["VALID CHAR ✓", "INVALID ✗"];
    this._createAnswerButtons(options, correctIndex, (i, bg, txt, buttons) => {
      this._handleAnswer(i, correctIndex, q.explanation, bg, txt, buttons);
    }, 340);
  }

  /* ═══════════════════════════════════════════════════════════════
   *  ROUND 5: Code Output Prediction
   * ═══════════════════════════════════════════════════════════════ */
  _showRound5Question() {
    const q = ROUND5_QUESTIONS[this.currentQuestion];
    const panel = this._createCentralPanel(95, 210);

    const label = this.add.text(panel.x, panel.top + 18, "What does this code produce?", {
      fontFamily: "Courier New, monospace",
      fontSize: "13px",
      color: "#aaaaaa",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(label);

    /* Code display — syntax colored */
    const lines = q.code.split("\n");
    lines.forEach((line, idx) => {
      const coloredLine = this._syntaxHighlight(line);
      const lineText = this.add.text(panel.x, panel.top + 55 + idx * 28, coloredLine.text, {
        fontFamily: "Courier New, monospace",
        fontSize: "17px",
        color: coloredLine.color,
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(115);
      this.roundElements.push(lineText);
    });

    /* Line numbers */
    lines.forEach((_, idx) => {
      const lineNum = this.add.text(panel.x - 220, panel.top + 55 + idx * 28, `${idx + 1}`, {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        color: "#334455",
      }).setOrigin(0.5).setDepth(114);
      this.roundElements.push(lineNum);
    });

    /* Output prompt */
    const outputLabel = this.add.text(panel.x, panel.top + 55 + lines.length * 28 + 20, "OUTPUT = ?", {
      fontFamily: "Courier New, monospace",
      fontSize: "14px",
      color: "#f1c40f",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(115);
    this.roundElements.push(outputLabel);

    /* Answer buttons */
    this._createAnswerButtons(q.options, q.correctIndex, (i, bg, txt, buttons) => {
      this._handleAnswer(i, q.correctIndex, q.explanation, bg, txt, buttons);
    }, 360);
  }

  _syntaxHighlight(line) {
    if (line.includes("char") || line.includes("int")) {
      return { text: line, color: "#56b6c2" };
    }
    return { text: line, color: "#e06c75" };
  }

  /* ═══════════════════════════════════════════════════════════════
   *  POPUP
   * ═══════════════════════════════════════════════════════════════ */
  _showPopup(x, y, text, color) {
    const popup = this.add.text(x, y, text, {
      fontFamily: "Courier New, monospace",
      fontSize: "22px",
      color,
      fontStyle: "bold",
      stroke: "#0a0f1a",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(170);

    this.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 800,
      ease: "Cubic.out",
      onComplete: () => popup.destroy(),
    });
  }

  /* ═══════════════════════════════════════════════════════════════
   *  LEVEL COMPLETE
   * ═══════════════════════════════════════════════════════════════ */
  _levelComplete() {
    this.isComplete = true;
    this._clearRoundElements();

    const total = this.correctAnswers + this.wrongAnswers;
    const accuracy = total > 0 ? Math.round((this.correctAnswers / total) * 100) : 100;
    const passed = accuracy >= ACCURACY_THRESHOLD;

    const elapsed = Math.round((this.time.now - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

    if (passed) {
      GameManager.completeLevel(7, accuracy);
      BadgeSystem.unlock("ascii_master");
      ProgressTracker.saveProgress(GameManager.getState());
      this.cameras.main.flash(600, 0, 200, 255);

      for (let i = 0; i < 8; i++) {
        this.time.delayedCall(i * 200, () => {
          this.confettiParticles.emitParticleAt(
            Phaser.Math.Between(100, W - 100),
            Phaser.Math.Between(0, 50),
            15
          );
        });
      }
    }

    this.time.delayedCall(passed ? 600 : 300, () => {
      this._showEndScreen(passed, accuracy, timeStr);
    });
  }

  _showEndScreen(passed, accuracy, timeStr) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(200);

    const panelG = this.add.graphics().setDepth(201);
    const panelColor = passed ? 0x0d1b2a : 0x4a1e1e;
    const borderColor = passed ? 0x00ffff : 0xe74c3c;
    panelG.fillStyle(panelColor, 0.97);
    panelG.fillRoundedRect(W / 2 - 280, 40, 560, 510, 16);
    panelG.lineStyle(3, borderColor);
    panelG.strokeRoundedRect(W / 2 - 280, 40, 560, 510, 16);

    const titleText = passed ? "🎉 LEVEL 8 COMPLETE!" : "❌ ACCURACY TOO LOW";
    const titleColor = passed ? "#00ffff" : "#e74c3c";

    this.add.text(W / 2, 80, titleText, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "28px",
      color: titleColor,
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202);

    const statsY = 125;
    const stats = [
      `Rounds Completed: ${Math.min(this.currentRound, TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}`,
      `Correct Answers: ${this.correctAnswers} / ${TOTAL_QUESTIONS}`,
      `Accuracy: ${accuracy}%`,
      `Score: ${this.score}`,
      `Time: ${timeStr}`,
      `Max Combo: ${this.maxCombo}x`,
      `Lives Remaining: ${this.lives} / ${MAX_LIVES}`,
    ];

    stats.forEach((s, i) => {
      this.add.text(W / 2, statsY + i * 26, s, {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#ecf0f1",
      }).setOrigin(0.5).setDepth(202);
    });

    if (passed) {
      const badgeY = statsY + stats.length * 26 + 15;
      this.add.text(W / 2, badgeY, "🔤 Badge Unlocked: ASCII Master!", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#f1c40f",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(202);

      const learnY = badgeY + 30;
      const bullets = [
        "✅ Every char has a unique ASCII number",
        "✅ Uppercase A-Z = 65-90, lowercase a-z = 97-122",
        "✅ Digits '0'-'9' = 48-57 (not 0-9!)",
        "✅ Char arithmetic: 'A'+1 = 'B', 'a'-32 = 'A'",
      ];
      bullets.forEach((b, i) => {
        this.add.text(W / 2, learnY + i * 20, b, {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#bdc3c7",
        }).setOrigin(0.5).setDepth(202);
      });

      const btnY = learnY + bullets.length * 20 + 25;
      this._createEndButton(W / 2 - 130, btnY, "NEXT LEVEL →", 0x004d40, () => {
        this.scene.stop("UIScene");
        this.scene.start("MenuScene");
      });
      this._createEndButton(W / 2 + 130, btnY, "REPLAY", 0x1a3a4a, () => {
        GameManager.resetLevel();
        this.scene.restart();
      });
    } else {
      const failY = statsY + stats.length * 26 + 15;
      this.add.text(W / 2, failY, `Need ${ACCURACY_THRESHOLD}%+ accuracy to pass!`, {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ff8888",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(202);

      this.add.text(W / 2, failY + 25, "Review ASCII values and try again.", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#aaaaaa",
      }).setOrigin(0.5).setDepth(202);

      const btnY = failY + 70;
      this._createEndButton(W / 2 - 100, btnY, "TRY AGAIN", 0xe74c3c, () => {
        GameManager.resetLevel();
        this.scene.restart();
      });
      this._createEndButton(W / 2 + 100, btnY, "MENU", 0x34495e, () => {
        this.scene.stop("UIScene");
        this.scene.start("MenuScene");
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   *  GAME OVER (lives exhausted)
   * ═══════════════════════════════════════════════════════════════ */
  _gameOver() {
    this.isComplete = true;
    this._clearRoundElements();

    this.cameras.main.shake(500, 0.02);
    this.cameras.main.flash(300, 255, 0, 0);

    this.time.delayedCall(600, () => {
      const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(200);

      const panelG = this.add.graphics().setDepth(201);
      panelG.fillStyle(0x3a0000, 0.95);
      panelG.fillRoundedRect(W / 2 - 260, H / 2 - 170, 520, 340, 16);
      panelG.lineStyle(3, 0xe74c3c);
      panelG.strokeRoundedRect(W / 2 - 260, H / 2 - 170, 520, 340, 16);

      this.add.text(W / 2, H / 2 - 120, "💀 SYSTEM LOCKED OUT", {
        fontFamily: "Courier New, monospace",
        fontSize: "28px",
        color: "#e74c3c",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(202);

      this.add.text(W / 2, H / 2 - 70, "All lives lost — access denied!", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#ff8888",
      }).setOrigin(0.5).setDepth(202);

      const total = this.correctAnswers + this.wrongAnswers;
      const acc = total > 0 ? Math.round((this.correctAnswers / total) * 100) : 0;

      this.add.text(W / 2, H / 2 - 30, [
        `Round: ${this.currentRound + 1} / ${TOTAL_ROUNDS}`,
        `Correct: ${this.correctAnswers}  |  Wrong: ${this.wrongAnswers}`,
        `Accuracy: ${acc}%  |  Score: ${this.score}`,
      ].join("\n"), {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        color: "#aaaaaa",
        align: "center",
        lineSpacing: 6,
      }).setOrigin(0.5).setDepth(202);

      /* Glitch effect on game over title */
      const glitchText = this.add.text(W / 2, H / 2 - 120, "💀 SYSTEM LOCKED OUT", {
        fontFamily: "Courier New, monospace",
        fontSize: "28px",
        color: "#ff0000",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(203).setAlpha(0);

      this.time.addEvent({
        delay: 300,
        repeat: 5,
        callback: () => {
          if (glitchText && glitchText.active) {
            glitchText.setAlpha(0.5);
            glitchText.setX(W / 2 + Phaser.Math.Between(-3, 3));
            this.time.delayedCall(60, () => {
              if (glitchText && glitchText.active) {
                glitchText.setAlpha(0);
                glitchText.setX(W / 2);
              }
            });
          }
        },
      });

      this._createEndButton(W / 2 - 100, H / 2 + 100, "TRY AGAIN", 0xe74c3c, () => {
        GameManager.resetLevel();
        this.scene.restart();
      });
      this._createEndButton(W / 2 + 100, H / 2 + 100, "MENU", 0x34495e, () => {
        this.scene.stop("UIScene");
        this.scene.start("MenuScene");
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
   *  END BUTTON FACTORY
   * ═══════════════════════════════════════════════════════════════ */
  _createEndButton(x, y, text, color, callback) {
    const bg = this.add.rectangle(x, y, 200, 44, color, 1).setDepth(202);
    bg.setStrokeStyle(2, Phaser.Display.Color.IntegerToColor(color).brighten(30).color);
    const txt = this.add.text(x, y, text, {
      fontFamily: "Courier New, monospace",
      fontSize: "15px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(203);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1.08, scaleY: 1.08, duration: 100 });
    });
    bg.on("pointerout", () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 100 });
    });
    bg.on("pointerup", callback);
  }

  /* ═══════════════════════════════════════════════════════════════
   *  UPDATE LOOP
   * ═══════════════════════════════════════════════════════════════ */
  update(time, delta) {
    /* Grid scroll animation */
    if (this.gridGfx && this.gridGfx.active) {
      this.gridOffset += delta * 0.008;
      this._drawGrid(this.gridOffset);
    }

    /* Binary rain */
    if (this.binaryDigits) {
      this.binaryDigits.forEach(bd => {
        bd.obj.y += bd.speed;
        if (bd.obj.y > H + 20) {
          bd.obj.y = -20;
          bd.obj.x = Phaser.Math.Between(10, W - 10);
          bd.obj.setText(Math.random() > 0.5 ? "1" : "0");
        }
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
   *  SHUTDOWN
   * ═══════════════════════════════════════════════════════════════ */
  shutdown() {
    this._clearRoundElements();
    this.binaryDigits = [];
  }
}
