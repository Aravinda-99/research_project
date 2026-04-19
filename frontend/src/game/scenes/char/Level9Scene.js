/**
 * Level9Scene — "Char Restructuring: Char Manipulation Lab" (Restructuring Phase)
 * ================================================================================
 * Mechanic: Top-down RPG Lab Exploration
 * - Player (scientist) navigates a research lab to 3 interactive stations
 * - Station 1: Escape Sequence Identifier — match escape sequences to meanings
 * - Station 2: Case Converter — predict ASCII case conversion results
 * - Station 3: String Builder — understand char-to-string operations
 * - Each station has 5 sub-questions presented via DOM overlay panels
 * - Complete all 3 stations with ≥80% accuracy to earn Char Wizard badge
 *
 * Schema Theory: Restructuring — applying char manipulation knowledge
 */

import Phaser from "phaser";
import { GameManager } from "../../GameManager.js";
import { BadgeSystem } from "../../BadgeSystem.js";
import { ProgressTracker } from "../../ProgressTracker.js";

/* ───────── Constants ───────── */
const W = 800;
const H = 600;
const PLAYER_SPEED = 150;
const ACCURACY_THRESHOLD = 80;
const MAX_LIVES = 3;
const QUESTIONS_PER_STATION = 5;
const TOTAL_QUESTIONS = QUESTIONS_PER_STATION * 3;

/* ───────── Question Banks ───────── */
const STATION1_QUESTIONS = [
  { code: "\\n", answer: "New Line", options: ["New Line", "Tab", "Backslash", "Null"] },
  { code: "\\t", answer: "Tab", options: ["New Line", "Tab", "Backspace", "Return"] },
  { code: "\\\\", answer: "Backslash", options: ["Forward Slash", "Backslash", "New Line", "Null"] },
  { code: "\\'", answer: "Single Quote", options: ["Double Quote", "Single Quote", "Apostrophe Escape", "Tab"] },
  { code: "\\\"", answer: "Double Quote", options: ["Single Quote", "Double Quote", "Escape", "Backslash"] },
];

const STATION2_QUESTIONS = [
  { code: "char c = 'a';  c = c - 32;", question: "What is c?", answer: "'A'", options: ["'A'", "'a'", "'!'", "'Z'"] },
  { code: "char c = 'Z';  c = c + 32;", question: "What is c?", answer: "'z'", options: ["'z'", "'Z'", "'a'", "'A'"] },
  { code: "char c = 'D';  c = c + 32;", question: "What is c?", answer: "'d'", options: ["'d'", "'D'", "'E'", "'e'"] },
  { code: "char c = 'm';  c = c - 32;", question: "What is c?", answer: "'M'", options: ["'M'", "'m'", "'N'", "'n'"] },
  { code: "char c = 'G';", question: "Is 'G' uppercase or lowercase?", answer: "Uppercase", options: ["Uppercase", "Lowercase", "Neither", "Both"] },
];

const STATION3_QUESTIONS = [
  { code: "char a='H'; char b='i';\nPrint a then b.", question: "What is produced?", answer: "Hi", options: ["Hi", "iH", "HI", "hi"] },
  { code: "char c = 'A' + 1;", question: "What is c?", answer: "'B'", options: ["'B'", "'A'", "'C'", "'1'"] },
  { code: "char x = '5';", question: "Is x a number or character?", answer: "Character", options: ["Number", "Character", "Both", "Neither"] },
  { code: "char c = 65;", question: "What character is stored?", answer: "'A'", options: ["'A'", "'a'", "'6'", "'5'"] },
  { code: "'Z' - 'A' + 1", question: "What is the result?", answer: "26", options: ["25", "26", "27", "90"] },
];

/* ───────── Station Definitions ───────── */
const STATION_DEFS = [
  {
    x: 150, y: 300, label: "ESCAPE LAB", color: 0x4ade80, colorHex: "#4ade80",
    title: "ESCAPE SEQUENCE IDENTIFIER", subtitle: "Match each escape sequence to its meaning",
    questions: STATION1_QUESTIONS,
  },
  {
    x: 650, y: 300, label: "CASE CONVERTER", color: 0x60a5fa, colorHex: "#60a5fa",
    title: "CASE CONVERTER", subtitle: "Convert between uppercase and lowercase using ASCII arithmetic",
    questions: STATION2_QUESTIONS,
  },
  {
    x: 400, y: 480, label: "STRING BUILDER", color: 0xc084fc, colorHex: "#c084fc",
    title: "STRING BUILDER", subtitle: "Build and predict strings from individual chars",
    questions: STATION3_QUESTIONS,
  },
];

/* ───────── Helpers ───────── */
function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/* ═══════════════════════════════════════════════════════════════
 *  LEVEL 9 SCENE
 * ═══════════════════════════════════════════════════════════════ */
export class Level9Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Level9Scene" });
  }

  create() {
    this.physics.world.gravity.y = 0;
    this.physics.world.setBounds(0, 0, W, H);

    /* ── State ── */
    this.stationsSolved = 0;
    this.correctAnswers = 0;
    this.totalQuestions = 0;
    this.lives = MAX_LIVES;
    this.score = 0;
    this.isComplete = false;
    this.gameStarted = false;
    this.panelOpen = false;
    this.activeStationIdx = -1;
    this.activeDom = null;
    this._panelOverlay = null;
    this.startTime = 0;

    this._drawLabBackground();
    this._genTextures();
    this._createHolographicDisplay();
    this._createStations();
    this._createPlayer();
    this._createHUD();
    this._createParticles();
    this._createAmbientParticles();

    const uiScene = this.scene.get("UIScene");
    if (uiScene && uiScene.setLevelLabel) {
      uiScene.setLevelLabel("Level 9: Restructuring — Char Manipulation Lab!");
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this._showIntro();
  }

  /* ─────────────────────────────────────────────────────────────
   *  LAB BACKGROUND
   * ───────────────────────────────────────────────────────────── */
  _drawLabBackground() {
    const g = this.add.graphics().setDepth(0);

    g.fillStyle(0x0a0f1a, 1);
    g.fillRect(0, 0, W, H);

    g.lineStyle(1, 0x1a2744, 0.2);
    for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.strokePath(); }
    for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath(); }

    g.lineStyle(1, 0x4ade80, 0.04);
    g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.strokePath();
    g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.strokePath();

    const corners = [[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]];
    corners.forEach(([cx, cy]) => {
      g.lineStyle(2, 0x4ade80, 0.1);
      g.strokeCircle(cx, cy, 8);
    });

    g.lineStyle(2, 0x1a3a5c, 0.4);
    g.strokeRect(10, 10, W - 20, H - 20);

    // Lab wall decorations — subtle equipment silhouettes
    g.fillStyle(0x0f1828, 0.6);
    g.fillRoundedRect(20, 170, 40, 80, 4);
    g.fillRoundedRect(20, 380, 40, 80, 4);
    g.fillRoundedRect(W - 60, 170, 40, 80, 4);
    g.fillRoundedRect(W - 60, 380, 40, 80, 4);

    // Hazard stripes near stations (subtle)
    g.lineStyle(1, 0xfbbf24, 0.06);
    for (let i = 0; i < 5; i++) {
      const offset = i * 12;
      g.beginPath(); g.moveTo(100 + offset, 260); g.lineTo(110 + offset, 250); g.strokePath();
      g.beginPath(); g.moveTo(600 + offset, 260); g.lineTo(610 + offset, 250); g.strokePath();
      g.beginPath(); g.moveTo(350 + offset, 440); g.lineTo(360 + offset, 430); g.strokePath();
    }

    // Floor lane markers leading to stations
    g.lineStyle(1, 0x4ade80, 0.03);
    g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(150, 300); g.strokePath();
    g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(650, 300); g.strokePath();
    g.beginPath(); g.moveTo(W / 2, H / 2); g.lineTo(400, 480); g.strokePath();
  }

  /* ─────────────────────────────────────────────────────────────
   *  TEXTURES
   * ───────────────────────────────────────────────────────────── */
  _genTextures() {
    const makeCircle = (key, color) => {
      if (this.textures.exists(key)) return;
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture(key, 8, 8);
      g.destroy();
    };
    makeCircle("greenSpark", 0x4ade80);
    makeCircle("blueSpark", 0x60a5fa);
    makeCircle("purpleSpark", 0xc084fc);
    makeCircle("confettiSpark", 0xfbbf24);
    makeCircle("cyanSpark", 0x00d4ff);

    if (!this.textures.exists("scientistBody")) {
      const g = this.add.graphics();
      g.fillStyle(0xf5c6aa, 1);
      g.fillCircle(16, 8, 7);
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(6, 14, 20, 22, 4);
      g.lineStyle(1, 0xcccccc, 0.5);
      g.strokeRoundedRect(6, 14, 20, 22, 4);
      g.fillStyle(0x4ade80, 1);
      g.fillRect(12, 18, 8, 3);
      g.fillStyle(0x1e3a5f, 1);
      g.fillRect(8, 36, 6, 10);
      g.fillRect(18, 36, 6, 10);
      g.generateTexture("scientistBody", 32, 48);
      g.destroy();
    }
  }

  /* ─────────────────────────────────────────────────────────────
   *  HOLOGRAPHIC DISPLAY — center-top area
   * ───────────────────────────────────────────────────────────── */
  _createHolographicDisplay() {
    const cx = W / 2, cy = 120;

    this.holoOuter = this.add.rectangle(cx, cy, 280, 70, 0x0a1a2e, 0.6).setDepth(5);
    this.holoOuter.setStrokeStyle(2, 0x4ade80, 0.5);

    this.holoInner = this.add.rectangle(cx, cy, 260, 50, 0x0a2a1a, 0.3).setDepth(6);
    this.holoInner.setStrokeStyle(1, 0x4ade80, 0.3);

    this.holoTitle = this.add.text(cx, cy - 10, "CHAR MANIPULATION LAB", {
      fontFamily: "monospace", fontSize: "14px", color: "#4ade80", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(7);

    this.holoProgress = this.add.text(cx, cy + 14, "Stations Solved: 0 / 3", {
      fontFamily: "monospace", fontSize: "11px", color: "#86efac",
    }).setOrigin(0.5).setDepth(7);

    this.tweens.add({
      targets: this.holoInner, alpha: 0.15, yoyo: true, repeat: -1, duration: 1200,
    });
    this.tweens.add({
      targets: this.holoOuter, scaleX: 1.02, scaleY: 1.04, yoyo: true, repeat: -1, duration: 1800,
    });
  }

  /* ─────────────────────────────────────────────────────────────
   *  STATIONS — 3 lab terminals
   * ───────────────────────────────────────────────────────────── */
  _createStations() {
    this.stations = [];
    const stationW = 80, stationH = 60;

    STATION_DEFS.forEach((def, i) => {
      const bg = this.add.rectangle(def.x, def.y, stationW, stationH, 0x0f1a2e, 0.9).setDepth(8);
      bg.setStrokeStyle(2, def.color, 0.6);

      const icon = this.add.text(def.x, def.y - 8, ">_", {
        fontFamily: "Courier New", fontSize: "18px",
        color: def.colorHex, fontStyle: "bold",
      }).setOrigin(0.5).setDepth(9);

      const label = this.add.text(def.x, def.y + stationH / 2 + 14, def.label, {
        fontFamily: "monospace", fontSize: "9px", color: "#64748b", align: "center",
      }).setOrigin(0.5).setDepth(9);

      const beacon = this.add.circle(
        def.x + stationW / 2 - 6, def.y - stationH / 2 + 6, 4, 0x333333
      ).setDepth(10);

      const glow = this.add.circle(def.x, def.y, 50, def.color, 0.04).setDepth(4);
      this.tweens.add({
        targets: glow, alpha: 0.08, yoyo: true, repeat: -1, duration: 2000,
      });

      this.tweens.add({
        targets: bg, alpha: 0.6, yoyo: true, repeat: -1, duration: 1500,
      });

      const zone = this.add.zone(def.x, def.y, stationW + 24, stationH + 24).setDepth(1);
      this.physics.add.existing(zone, true);

      // Inner terminal screen effect
      const screen = this.add.rectangle(def.x, def.y - 2, stationW - 20, stationH - 24, def.color, 0.06).setDepth(8);
      this.tweens.add({
        targets: screen, alpha: 0.12, yoyo: true, repeat: -1, duration: 800 + i * 200,
      });

      // Station number label
      const numLabel = this.add.text(def.x - stationW / 2 + 8, def.y - stationH / 2 + 4, `S${i + 1}`, {
        fontFamily: "monospace", fontSize: "8px", color: def.colorHex, fontStyle: "bold",
      }).setDepth(10).setAlpha(0.5);

      this.stations.push({
        bg, icon, label, beacon, glow, zone, screen, numLabel,
        solved: false, def, idx: i,
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
   *  PLAYER
   * ───────────────────────────────────────────────────────────── */
  _createPlayer() {
    this.player = this.physics.add.sprite(W / 2, H / 2 + 40, "scientistBody");
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(300);
    this.player.body.setAllowGravity(false);
    this.player.body.setSize(20, 24, true);
    this.player.setDepth(30);

    this.playerGlow = this.add.circle(this.player.x, this.player.y, 18, 0x4ade80, 0.06).setDepth(29);

    this.playerLabel = this.add.text(this.player.x, this.player.y - 30, "YOU", {
      fontFamily: "monospace", fontSize: "8px", color: "#4ade80", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(31).setAlpha(0.6);

    // Approach prompts (shown near unsolved stations)
    this.stations.forEach(s => {
      s.approachTxt = this.add.text(s.def.x, s.def.y - 50, "[ INTERACT ]", {
        fontFamily: "monospace", fontSize: "9px", color: s.def.colorHex, fontStyle: "bold",
      }).setOrigin(0.5).setDepth(12).setAlpha(0);

      this.tweens.add({
        targets: s.approachTxt, y: s.def.y - 55, yoyo: true, repeat: -1, duration: 1200,
      });
    });

    this.stations.forEach(s => {
      this.physics.add.overlap(this.player, s.zone, () => {
        if (!s.solved && !this.panelOpen && !this.isComplete && this.gameStarted) {
          this._openStation(s.idx);
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
   *  HUD
   * ───────────────────────────────────────────────────────────── */
  _createHUD() {
    const dp = 100;

    this.add.rectangle(W / 2, 28, W, 56, 0x0a0f1a, 0.92).setDepth(dp);

    this.scoreText = this.add.text(16, 12, "Score: 0", {
      fontFamily: "monospace", fontSize: "14px", color: "#ffffff", fontStyle: "bold",
    }).setDepth(dp + 1);

    this.livesText = this.add.text(16, 32, `Lives: ${"❤️".repeat(this.lives)}`, {
      fontFamily: "monospace", fontSize: "13px", color: "#ef4444",
    }).setDepth(dp + 1);

    this.add.text(W / 2, 14, "Stations Completed", {
      fontFamily: "monospace", fontSize: "11px", color: "#64748b",
    }).setOrigin(0.5).setDepth(dp + 1);

    this.progressBg = this.add.rectangle(W / 2, 34, 200, 10, 0x1e293b).setStrokeStyle(1, 0x334155).setDepth(dp + 1);
    this.progressFill = this.add.rectangle(W / 2 - 100, 34, 0, 8, 0x4ade80).setOrigin(0, 0.5).setDepth(dp + 2);
    this.progressTxt = this.add.text(W / 2, 34, "0 / 3", {
      fontFamily: "monospace", fontSize: "9px", color: "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(dp + 3);

    this.accuracyText = this.add.text(W - 16, 20, "Accuracy: --", {
      fontFamily: "monospace", fontSize: "12px", color: "#94a3b8",
    }).setOrigin(1, 0.5).setDepth(dp + 1);

    this.hintTxt = this.add.text(W / 2, H - 16, "Walk to a station to interact", {
      fontFamily: "monospace", fontSize: "11px", color: "#475569",
    }).setOrigin(0.5).setDepth(dp);
  }

  _updateHUD() {
    this.progressFill.width = 200 * (this.stationsSolved / 3);
    this.progressTxt.setText(`${this.stationsSolved} / 3`);
    this.scoreText.setText(`Score: ${this.score}`);
    this.livesText.setText(`Lives: ${"❤️".repeat(Math.max(0, this.lives))}`);
    this.holoProgress.setText(`Stations Solved: ${this.stationsSolved} / 3`);
    if (this.totalQuestions > 0) {
      const acc = Math.round((this.correctAnswers / this.totalQuestions) * 100);
      this.accuracyText.setText(`Accuracy: ${acc}%`);
    }
  }

  /* ─────────────────────────────────────────────────────────────
   *  PARTICLES
   * ───────────────────────────────────────────────────────────── */
  _createParticles() {
    this.greenParticles = this.add.particles(0, 0, "greenSpark", {
      speed: { min: 60, max: 200 }, scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 }, lifespan: 600, blendMode: "ADD", emitting: false,
    }).setDepth(50);

    this.blueParticles = this.add.particles(0, 0, "blueSpark", {
      speed: { min: 60, max: 200 }, scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 }, lifespan: 600, blendMode: "ADD", emitting: false,
    }).setDepth(50);

    this.purpleParticles = this.add.particles(0, 0, "purpleSpark", {
      speed: { min: 60, max: 200 }, scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 }, lifespan: 600, blendMode: "ADD", emitting: false,
    }).setDepth(50);

    this.confettiParticles = this.add.particles(0, 0, "confettiSpark", {
      speed: { min: 80, max: 350 }, scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 }, lifespan: 1200, blendMode: "ADD", emitting: false,
    }).setDepth(50);
  }

  _createAmbientParticles() {
    this.ambientDots = [];
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(20, W - 20);
      const y = Phaser.Math.Between(60, H - 20);
      const colors = [0x4ade80, 0x00d4ff];
      const color = colors[i % 2];
      const dot = this.add.circle(x, y, Phaser.Math.Between(1, 3), color, 0.15).setDepth(2);
      this.ambientDots.push({
        obj: dot,
        baseX: x,
        baseY: y,
        speedX: Phaser.Math.FloatBetween(-0.15, 0.15),
        speedY: Phaser.Math.FloatBetween(-0.1, 0.1),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
   *  INTRO OVERLAY
   * ───────────────────────────────────────────────────────────── */
  _showIntro() {
    const els = [];
    const track = (e) => { els.push(e); return e; };

    track(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(200)).setInteractive();

    const pg = track(this.add.graphics().setDepth(201));
    pg.fillStyle(0x0a0f1a, 0.98);
    pg.fillRoundedRect(70, 40, 660, 510, 16);
    pg.lineStyle(3, 0xc084fc);
    pg.strokeRoundedRect(70, 40, 660, 510, 16);

    track(this.add.text(400, 75, "MISSION 9: CHAR MANIPULATION LAB", {
      fontFamily: "Arial Black", fontSize: "21px", color: "#c084fc", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202));

    track(this.add.text(400, 105, "Master escape sequences, case conversion & char building", {
      fontFamily: "Arial", fontSize: "14px", color: "#e9d5ff", fontStyle: "italic",
    }).setOrigin(0.5).setDepth(202));

    const desc =
      "\nYou are a scientist in the Char Manipulation Lab.\n" +
      "Navigate to 3 lab stations and solve their challenges!\n\n" +
      "STATION 1  —  Escape Lab          (Escape Sequences)\n" +
      "STATION 2  —  Case Converter      (ASCII Arithmetic)\n" +
      "STATION 3  —  String Builder      (Char Operations)\n\n" +
      "Walk to each station with Arrow Keys or WASD.\n" +
      "Each station has 5 questions — answer correctly!\n\n" +
      "You have 3 lives. Wrong answers cost 1 life.\n" +
      "Complete all 3 stations to become a Char Wizard!";

    track(this.add.text(400, 145, desc, {
      fontFamily: "Arial", fontSize: "13px", color: "#cbd5e1",
      align: "center", lineSpacing: 6, wordWrap: { width: 560 },
    }).setOrigin(0.5, 0).setDepth(202));

    const learnTitle = track(this.add.text(400, 390, "What You'll Learn:", {
      fontFamily: "Arial", fontSize: "14px", color: "#c084fc", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202));

    const bullets =
      "• Escape sequences: \\n, \\t, \\\\, \\', \\\"\n" +
      "• Case conversion using ASCII arithmetic (+/- 32)\n" +
      "• How individual chars combine into strings\n" +
      "• Difference between char values and numbers";

    track(this.add.text(400, 415, bullets, {
      fontFamily: "Arial", fontSize: "12px", color: "#94a3b8",
      align: "center", lineSpacing: 5, wordWrap: { width: 480 },
    }).setOrigin(0.5, 0).setDepth(202));

    const btnBg = track(this.add.rectangle(400, 510, 240, 44, 0x581c87).setDepth(210));
    btnBg.setStrokeStyle(2, 0xc084fc);
    track(this.add.text(400, 510, ">>  ENTER THE LAB", {
      fontFamily: "Arial", fontSize: "17px", color: "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(211));

    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on("pointerover", () => btnBg.setFillStyle(0xc084fc));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0x581c87));
    btnBg.on("pointerup", () => {
      els.forEach(e => { try { e.destroy(); } catch (_) {} });
      this.gameStarted = true;
      this.startTime = this.time.now;
    });
  }

  /* ═══════════════════════════════════════════════════════════════
   *  STATION INTERACTION — DOM Panels
   * ═══════════════════════════════════════════════════════════════ */
  _openStation(idx) {
    if (this.panelOpen || this.stations[idx].solved) return;
    this.panelOpen = true;
    this.activeStationIdx = idx;
    this.player.body.setVelocity(0, 0);

    this._buildQuestionPanel(idx, 0, 0);
  }

  _closePanel() {
    if (this.activeDom) {
      this.activeDom.destroy();
      this.activeDom = null;
    }
    if (this._panelOverlay) {
      this._panelOverlay.destroy();
      this._panelOverlay = null;
    }
    this.panelOpen = false;
    this.activeStationIdx = -1;
  }

  /* ─────────────────────────────────────────────────────────────
   *  BUILD QUESTION PANEL — shared across all 3 stations
   * ───────────────────────────────────────────────────────────── */
  _buildQuestionPanel(stationIdx, questionIdx, stationCorrect) {
    if (this.activeDom) { this.activeDom.destroy(); this.activeDom = null; }
    if (this._panelOverlay) { this._panelOverlay.destroy(); this._panelOverlay = null; }

    const def = STATION_DEFS[stationIdx];
    const q = def.questions[questionIdx];
    const qNum = questionIdx + 1;

    this._panelOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(150).setInteractive();

    const isStation1 = stationIdx === 0;
    const codeDisplay = isStation1
      ? q.code
      : q.code;
    const questionText = isStation1
      ? "What does this escape sequence represent?"
      : q.question;

    const optionsHtml = q.options.map((opt, i) => `
      <button class="q9opt" data-idx="${i}" style="
        background: rgba(30, 40, 60, 0.9);
        border: 2px solid #334155;
        border-radius: 12px;
        padding: 12px 20px;
        color: #e2e8f0;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 120px;
        text-align: center;
        font-family: 'Courier New', monospace;
      ">${opt}</button>
    `).join("");

    const html = `
      <div style="
        width: 560px;
        background: rgba(10, 15, 26, 0.97);
        border: 2px solid ${def.colorHex};
        border-radius: 16px;
        padding: 30px;
        font-family: Arial, sans-serif;
        color: #e2e8f0;
        box-shadow: 0 0 40px ${def.colorHex}33;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="
            color: ${def.colorHex};
            font-size: 16px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
          ">${def.title}</div>
          <div style="
            color: #64748b;
            font-size: 12px;
            font-family: monospace;
          ">Q${qNum} / ${QUESTIONS_PER_STATION}</div>
        </div>
        <div style="
          color: #94a3b8;
          font-size: 13px;
          margin-bottom: 18px;
        ">${def.subtitle}</div>
        <div style="
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 14px;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          color: ${def.colorHex};
          text-align: center;
          white-space: pre-wrap;
          line-height: 1.6;
        ">${codeDisplay}</div>
        <div style="
          color: #cbd5e1;
          font-size: 14px;
          margin-bottom: 16px;
          text-align: center;
          font-weight: bold;
        ">${questionText}</div>
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        ">${optionsHtml}</div>
        <div id="q9feedback" style="
          color: #94a3b8;
          font-size: 13px;
          text-align: center;
          min-height: 22px;
          font-family: monospace;
        "></div>
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        ">
          <div style="color: #64748b; font-size: 11px; font-family: monospace;">
            Station ${stationIdx + 1} of 3  •  Correct: ${stationCorrect}/${questionIdx}
          </div>
          <div style="color: #ef4444; font-size: 12px; font-family: monospace;">
            Lives: ${"❤️".repeat(Math.max(0, this.lives))}
          </div>
        </div>
      </div>
    `;

    this.activeDom = this.add.dom(W / 2, H / 2).createFromHTML(html).setDepth(160);

    const el = this.activeDom.node;
    let answered = false;

    el.querySelectorAll(".q9opt").forEach(btn => {
      btn.addEventListener("mouseenter", () => {
        if (!answered) {
          btn.style.borderColor = def.colorHex;
          btn.style.background = "rgba(50, 60, 80, 0.95)";
        }
      });
      btn.addEventListener("mouseleave", () => {
        if (!answered) {
          btn.style.borderColor = "#334155";
          btn.style.background = "rgba(30, 40, 60, 0.9)";
        }
      });

      btn.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        this.totalQuestions++;

        const selectedOption = btn.textContent.trim();
        const isCorrect = selectedOption === q.answer;

        if (isCorrect) {
          stationCorrect++;
          this.correctAnswers++;
          this.score += 25;
          GameManager.addScore(25);

          btn.style.borderColor = "#4ade80";
          btn.style.background = "rgba(74, 222, 128, 0.2)";
          btn.style.color = "#4ade80";

          el.querySelector("#q9feedback").innerHTML =
            `<span style="color:#4ade80; font-weight:bold;">✓ Correct! +25</span>`;

          this._showFloatingScore(W / 2, H / 2 - 60, "+25", 0x4ade80);
        } else {
          this.lives--;
          GameManager.loseLife();

          btn.style.borderColor = "#ef4444";
          btn.style.background = "rgba(239, 68, 68, 0.2)";
          btn.style.color = "#ef4444";

          const correctBtn = el.querySelectorAll(".q9opt");
          correctBtn.forEach(b => {
            if (b.textContent.trim() === q.answer) {
              b.style.borderColor = "#4ade80";
              b.style.background = "rgba(74, 222, 128, 0.15)";
              b.style.color = "#4ade80";
            }
          });

          el.querySelector("#q9feedback").innerHTML =
            `<span style="color:#ef4444;">✗ Wrong!</span> The answer is <span style="color:#4ade80; font-weight:bold;">${q.answer}</span>`;

          this.cameras.main.shake(150, 0.008);
        }

        this._updateHUD();

        if (this.lives <= 0) {
          this.time.delayedCall(1200, () => {
            this._closePanel();
            this._gameOver();
          });
          return;
        }

        const nextIdx = questionIdx + 1;
        if (nextIdx < QUESTIONS_PER_STATION) {
          this.time.delayedCall(isCorrect ? 800 : 1500, () => {
            this._buildQuestionPanel(stationIdx, nextIdx, stationCorrect);
          });
        } else {
          this.time.delayedCall(isCorrect ? 1000 : 1500, () => {
            this._showStationComplete(stationIdx, stationCorrect);
          });
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
   *  STATION COMPLETE — brief celebration, then close panel
   * ───────────────────────────────────────────────────────────── */
  _showStationComplete(stationIdx, stationCorrect) {
    if (this.activeDom) { this.activeDom.destroy(); this.activeDom = null; }

    const def = STATION_DEFS[stationIdx];
    const stationLessons = [
      "You identified all major C escape sequences!",
      "You mastered ASCII arithmetic for case conversion!",
      "You understand how chars combine into strings!",
    ];
    const perfLabel = stationCorrect === QUESTIONS_PER_STATION ? "PERFECT!" :
      stationCorrect >= 4 ? "Great work!" :
      stationCorrect >= 3 ? "Good job!" : "Completed!";
    const perfColor = stationCorrect === QUESTIONS_PER_STATION ? "#fbbf24" : "#4ade80";

    const html = `
      <div style="
        width: 420px;
        background: rgba(10, 15, 26, 0.97);
        border: 2px solid ${def.colorHex};
        border-radius: 16px;
        padding: 36px;
        text-align: center;
        font-family: Arial, sans-serif;
        box-shadow: 0 0 50px ${def.colorHex}44;
      ">
        <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
        <div style="
          font-size: 22px;
          font-weight: bold;
          color: ${def.colorHex};
          margin-bottom: 6px;
        ">Station ${stationIdx + 1} Complete!</div>
        <div style="
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 12px;
        ">${def.label}</div>
        <div style="
          color: #cbd5e1;
          font-size: 16px;
          font-family: monospace;
          margin-bottom: 6px;
        ">Score: ${stationCorrect} / ${QUESTIONS_PER_STATION}</div>
        <div style="
          color: ${perfColor};
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 14px;
        ">${perfLabel}</div>
        <div style="
          color: #64748b;
          font-size: 12px;
          font-style: italic;
          line-height: 1.5;
        ">${stationLessons[stationIdx]}</div>
      </div>
    `;

    this.activeDom = this.add.dom(W / 2, H / 2).createFromHTML(html).setDepth(160);

    this.time.delayedCall(1800, () => {
      this._markStationSolved(stationIdx);
    });
  }

  /* ─────────────────────────────────────────────────────────────
   *  MARK STATION SOLVED — visual updates
   * ───────────────────────────────────────────────────────────── */
  _markStationSolved(idx) {
    const s = this.stations[idx];
    s.solved = true;
    this.stationsSolved++;
    this.score += 100;
    GameManager.addScore(100);
    GameManager.addXP(200);

    s.beacon.setFillStyle(s.def.color);
    s.bg.setStrokeStyle(3, s.def.color, 1);
    s.bg.setAlpha(1);
    this.tweens.killTweensOf(s.bg);

    s.icon.setText("✓");
    s.icon.setFontSize("22px");

    s.glow.setAlpha(0.15);
    this.tweens.add({
      targets: s.glow, alpha: 0.25, yoyo: true, repeat: -1, duration: 1000,
    });

    const particleEmitter = idx === 0 ? this.greenParticles
      : idx === 1 ? this.blueParticles
      : this.purpleParticles;
    particleEmitter.emitParticleAt(s.def.x, s.def.y, 30);

    const flashColors = [
      [0, 255, 100],
      [0, 100, 255],
      [150, 50, 255],
    ];
    const fc = flashColors[idx];
    this.cameras.main.flash(300, fc[0], fc[1], fc[2]);

    this._updateHUD();
    this._closePanel();

    if (this.stationsSolved === 3) {
      this.time.delayedCall(800, () => this._victorySequence());
    }
  }

  /* ─────────────────────────────────────────────────────────────
   *  FLOATING SCORE POPUP
   * ───────────────────────────────────────────────────────────── */
  _showFloatingScore(x, y, text, color) {
    const colorStr = "#" + color.toString(16).padStart(6, "0");
    const txt = this.add.text(x, y, text, {
      fontFamily: "Arial Black", fontSize: "22px", color: colorStr, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(170);

    this.tweens.add({
      targets: txt, y: y - 40, alpha: 0, duration: 800, ease: "Power2",
      onComplete: () => txt.destroy(),
    });
  }

  /* ═══════════════════════════════════════════════════════════════
   *  VICTORY SEQUENCE
   * ═══════════════════════════════════════════════════════════════ */
  _victorySequence() {
    this.isComplete = true;

    this.tweens.killTweensOf(this.holoInner);
    this.tweens.killTweensOf(this.holoOuter);

    this.holoTitle.setText("ALL STATIONS COMPLETE!");
    this.holoTitle.setColor("#fbbf24");
    this.holoProgress.setText("LAB FULLY OPERATIONAL");
    this.holoProgress.setColor("#fbbf24");

    this.holoOuter.setStrokeStyle(3, 0xfbbf24, 0.9);
    this.holoInner.setFillStyle(0x2a1a00, 0.5);
    this.tweens.add({
      targets: this.holoInner, alpha: 0.3, yoyo: true, repeat: -1, duration: 600,
    });

    this.cameras.main.flash(600, 74, 222, 128);
    this.cameras.main.shake(400, 0.012);

    this.stations.forEach(s => {
      const emitter = s.idx === 0 ? this.greenParticles
        : s.idx === 1 ? this.blueParticles
        : this.purpleParticles;
      emitter.emitParticleAt(s.def.x, s.def.y, 40);
    });

    const holoCX = W / 2, holoCY = 120;
    this.stations.forEach((s, i) => {
      this.time.delayedCall(i * 300, () => {
        const lineGfx = this.add.graphics().setDepth(7);
        const color = s.def.color;

        lineGfx.lineStyle(2, color, 0.5);
        lineGfx.beginPath();
        lineGfx.moveTo(s.def.x, s.def.y);
        lineGfx.lineTo(holoCX, holoCY);
        lineGfx.strokePath();

        lineGfx.lineStyle(8, color, 0.08);
        lineGfx.beginPath();
        lineGfx.moveTo(s.def.x, s.def.y);
        lineGfx.lineTo(holoCX, holoCY);
        lineGfx.strokePath();

        // Spark trail along the connection line
        const steps = 6;
        for (let j = 0; j <= steps; j++) {
          const frac = j / steps;
          const px = s.def.x + (holoCX - s.def.x) * frac;
          const py = s.def.y + (holoCY - s.def.y) * frac;
          this.time.delayedCall(j * 50, () => {
            const emitter = i === 0 ? this.greenParticles
              : i === 1 ? this.blueParticles
              : this.purpleParticles;
            emitter.emitParticleAt(px, py, 4);
          });
        }
      });
    });

    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 150, () => {
        this.confettiParticles.emitParticleAt(
          Phaser.Math.Between(100, W - 100),
          Phaser.Math.Between(0, 80),
          15
        );
      });
    }

    const accuracy = this.totalQuestions > 0
      ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
      : 0;
    const passed = accuracy >= ACCURACY_THRESHOLD;

    if (passed) {
      GameManager.completeLevel(8, accuracy);
      BadgeSystem.unlock("char_wizard");
      ProgressTracker.saveProgress(GameManager.getState());
      GameManager.addXP(500);
    }

    this.time.delayedCall(1800, () => this._showEndScreen(passed, accuracy));
  }

  /* ═══════════════════════════════════════════════════════════════
   *  END SCREEN
   * ═══════════════════════════════════════════════════════════════ */
  _showEndScreen(passed, accuracy) {
    const elapsed = Math.round((this.time.now - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(200);

    const panelG = this.add.graphics().setDepth(201);
    const panelColor = passed ? 0x0a1a2e : 0x4a1e1e;
    const borderColor = passed ? 0xc084fc : 0xe74c3c;
    panelG.fillStyle(panelColor, 0.96);
    panelG.fillRoundedRect(W / 2 - 290, 50, 580, 490, 16);
    panelG.lineStyle(3, borderColor);
    panelG.strokeRoundedRect(W / 2 - 290, 50, 580, 490, 16);

    const titleText = passed ? "LEVEL 9 COMPLETE!" : "ACCURACY TOO LOW";
    const titleColor = passed ? "#c084fc" : "#e74c3c";

    const title = this.add.text(W / 2, 88, titleText, {
      fontFamily: "Arial Black", fontSize: "28px", color: titleColor, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202).setAlpha(0).setScale(0.5);

    this.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 600, ease: "Back.out" });

    this.add.text(W / 2, 120, passed ? "All lab stations solved successfully!" : "Review and try again.", {
      fontFamily: "Arial", fontSize: "14px", color: "#cbd5e1",
    }).setOrigin(0.5).setDepth(202);

    if (passed) {
      const badgeG = this.add.graphics().setDepth(202);
      badgeG.fillStyle(0x0f172a, 0.95);
      badgeG.fillRoundedRect(W / 2 - 170, 145, 340, 65, 12);
      badgeG.lineStyle(2, 0xc084fc);
      badgeG.strokeRoundedRect(W / 2 - 170, 145, 340, 65, 12);

      this.add.text(W / 2, 163, "CHAR WIZARD", {
        fontFamily: "Arial Black", fontSize: "20px", color: "#c084fc",
      }).setOrigin(0.5).setDepth(203);
      this.add.text(W / 2, 190, "Badge Unlocked: Char Wizard!", {
        fontFamily: "Arial", fontSize: "12px", color: "#e9d5ff",
      }).setOrigin(0.5).setDepth(203);
    }

    const statsY = passed ? 230 : 160;
    const stats = [
      `Stations Solved: ${this.stationsSolved} / 3`,
      `Total Correct: ${this.correctAnswers} / ${this.totalQuestions}`,
      `Accuracy: ${accuracy}%`,
      `Score: ${this.score}`,
      `Time: ${timeStr}`,
      `Lives Remaining: ${Math.max(0, this.lives)}`,
    ];

    stats.forEach((s, i) => {
      this.add.text(W / 2, statsY + i * 26, s, {
        fontFamily: "monospace", fontSize: "15px", color: "#ecf0f1",
      }).setOrigin(0.5).setDepth(202);
    });

    const breakdownY = statsY + stats.length * 26 + 14;
    this.add.text(W / 2, breakdownY, "Station Breakdown:", {
      fontFamily: "Arial", fontSize: "13px", color: "#94a3b8", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(202);

    STATION_DEFS.forEach((def, i) => {
      const solved = this.stations[i].solved;
      const icon = solved ? "✅" : "❌";
      this.add.text(W / 2, breakdownY + 20 + i * 22, `${icon}  ${def.label}`, {
        fontFamily: "monospace", fontSize: "13px", color: solved ? def.colorHex : "#64748b",
      }).setOrigin(0.5).setDepth(202);
    });

    const learnY = breakdownY + 20 + 3 * 22 + 10;

    if (passed) {
      this.add.text(W / 2, learnY, "What You Mastered:", {
        fontFamily: "Arial", fontSize: "13px", color: "#c084fc", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(202);

      const learnings =
        "✅ Escape sequences: \\n (newline), \\t (tab), \\\\\\ (backslash)\n" +
        "✅ Case conversion via ASCII arithmetic (+/- 32)\n" +
        "✅ Char vs string — individual chars build strings\n" +
        "✅ ASCII code-to-character mapping (e.g., 65 = 'A')";
      this.add.text(W / 2, learnY + 18, learnings, {
        fontFamily: "Arial", fontSize: "11px", color: "#94a3b8",
        align: "center", lineSpacing: 4, wordWrap: { width: 460 },
      }).setOrigin(0.5, 0).setDepth(202);
    } else {
      this.add.text(W / 2, learnY, "Tips for Next Attempt:", {
        fontFamily: "Arial", fontSize: "13px", color: "#fbbf24", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(202);

      const tips =
        "• Remember: \\n = New Line, \\t = Tab, \\\\\\ = Backslash\n" +
        "• Uppercase to lowercase: add 32 to ASCII value\n" +
        "• Lowercase to uppercase: subtract 32 from ASCII value\n" +
        "• '0'-'9' are char digits, not actual numbers!";
      this.add.text(W / 2, learnY + 18, tips, {
        fontFamily: "Arial", fontSize: "11px", color: "#94a3b8",
        align: "center", lineSpacing: 4, wordWrap: { width: 460 },
      }).setOrigin(0.5, 0).setDepth(202);
    }

    const btnY = 500;
    if (passed) {
      this._createEndButton(W / 2 - 130, btnY, "Finish Module", 0x581c87, 0xc084fc, () => {
        this.scene.stop("UIScene");
        this.scene.start("MenuScene");
      });
      this._createEndButton(W / 2 + 130, btnY, "REPLAY", 0x1e293b, 0x60a5fa, () => {
        GameManager.resetLevel();
        this.scene.restart();
      });
    } else {
      this._createEndButton(W / 2 - 100, btnY, "TRY AGAIN", 0x7f1d1d, 0xe74c3c, () => {
        GameManager.resetLevel();
        this.scene.restart();
      });
      this._createEndButton(W / 2 + 100, btnY, "MENU", 0x1e293b, 0x64748b, () => {
        this.scene.stop("UIScene");
        this.scene.start("MenuScene");
      });
    }
  }

  _createEndButton(x, y, text, bgColor, borderColor, callback) {
    const bg = this.add.rectangle(x, y, 200, 44, bgColor, 1).setDepth(210);
    bg.setStrokeStyle(2, borderColor);
    const colorHex = "#" + borderColor.toString(16).padStart(6, "0");
    const txt = this.add.text(x, y, text, {
      fontFamily: "Arial", fontSize: "15px", color: colorHex, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(211);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      bg.setFillStyle(borderColor);
      txt.setColor("#ffffff");
      this.tweens.add({ targets: [bg, txt], scaleX: 1.06, scaleY: 1.06, duration: 100 });
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(bgColor);
      txt.setColor(colorHex);
      this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 100 });
    });
    bg.on("pointerup", callback);
  }

  /* ═══════════════════════════════════════════════════════════════
   *  GAME OVER
   * ═══════════════════════════════════════════════════════════════ */
  _gameOver() {
    this.isComplete = true;

    this.cameras.main.shake(500, 0.02);
    this.cameras.main.flash(300, 255, 0, 0);

    this.time.delayedCall(600, () => {
      const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(200);

      const panelG = this.add.graphics().setDepth(201);
      panelG.fillStyle(0x2a0000, 0.96);
      panelG.fillRoundedRect(W / 2 - 240, H / 2 - 150, 480, 300, 16);
      panelG.lineStyle(3, 0xef4444);
      panelG.strokeRoundedRect(W / 2 - 240, H / 2 - 150, 480, 300, 16);

      this.add.text(W / 2, H / 2 - 100, "EXPERIMENT FAILED", {
        fontFamily: "Arial Black", fontSize: "30px", color: "#ef4444", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(202);

      this.add.text(W / 2, H / 2 - 55, "Too many wrong answers!", {
        fontFamily: "Arial", fontSize: "18px", color: "#fca5a5",
      }).setOrigin(0.5).setDepth(202);

      const accuracy = this.totalQuestions > 0
        ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
        : 0;

      this.add.text(W / 2, H / 2 - 15, `Stations Solved: ${this.stationsSolved} / 3`, {
        fontFamily: "monospace", fontSize: "15px", color: "#ecf0f1",
      }).setOrigin(0.5).setDepth(202);

      this.add.text(W / 2, H / 2 + 12, `Correct Answers: ${this.correctAnswers} / ${this.totalQuestions}  •  Accuracy: ${accuracy}%`, {
        fontFamily: "monospace", fontSize: "13px", color: "#94a3b8",
      }).setOrigin(0.5).setDepth(202);

      this._createEndButton(W / 2 - 110, H / 2 + 80, "TRY AGAIN", 0x7f1d1d, 0xef4444, () => {
        GameManager.resetLevel();
        this.scene.restart();
      });
      this._createEndButton(W / 2 + 110, H / 2 + 80, "MENU", 0x1e293b, 0x64748b, () => {
        this.scene.stop("UIScene");
        this.scene.start("MenuScene");
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
   *  UPDATE LOOP
   * ═══════════════════════════════════════════════════════════════ */
  update(time, delta) {
    this._updateAmbient(time);

    if (!this.gameStarted || this.isComplete) return;

    /* ── Player movement (blocked when panel open) ── */
    if (this.panelOpen) {
      this.player.setVelocity(0, 0);
    } else {
      let vx = 0, vy = 0;

      const left = this.cursors.left.isDown || this.wasd.left.isDown;
      const right = this.cursors.right.isDown || this.wasd.right.isDown;
      const up = this.cursors.up.isDown || this.wasd.up.isDown;
      const down = this.cursors.down.isDown || this.wasd.down.isDown;

      if (left) vx = -PLAYER_SPEED;
      else if (right) vx = PLAYER_SPEED;
      if (up) vy = -PLAYER_SPEED;
      else if (down) vy = PLAYER_SPEED;

      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
      this.player.setVelocity(vx, vy);
    }

    /* ── Player glow & label follow ── */
    if (this.playerGlow?.active) {
      this.playerGlow.setPosition(this.player.x, this.player.y);
    }
    if (this.playerLabel?.active) {
      this.playerLabel.setPosition(this.player.x, this.player.y - 30);
    }

    /* ── Approach prompts & hint text ── */
    if (!this.panelOpen) {
      let nearStation = false;
      this.stations.forEach(s => {
        if (!s.solved) {
          const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y, s.def.x, s.def.y
          );
          const isNear = dist < 100;
          if (isNear) nearStation = true;
          if (s.approachTxt?.active) {
            s.approachTxt.setAlpha(isNear ? 0.9 : 0);
          }
        } else {
          if (s.approachTxt?.active) s.approachTxt.setAlpha(0);
        }
      });
      if (this.hintTxt?.active) {
        this.hintTxt.setText(nearStation ? "Walk into the station to interact!" : "Walk to a station to interact");
        this.hintTxt.setColor(nearStation ? "#c084fc" : "#475569");
      }
    } else {
      this.stations.forEach(s => {
        if (s.approachTxt?.active) s.approachTxt.setAlpha(0);
      });
    }
  }

  _updateAmbient(time) {
    if (!this.ambientDots) return;
    const t = time / 1000;
    this.ambientDots.forEach(d => {
      d.obj.x = d.baseX + Math.sin(t * 0.5 + d.phase) * 12 * (d.speedX > 0 ? 1 : -1);
      d.obj.y = d.baseY + Math.cos(t * 0.3 + d.phase) * 8 * (d.speedY > 0 ? 1 : -1);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
   *  SHUTDOWN
   * ═══════════════════════════════════════════════════════════════ */
  shutdown() {
    this._closePanel();
    this.ambientDots = [];
  }
}
