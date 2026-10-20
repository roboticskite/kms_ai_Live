import * as Blockly from "blockly";
import type { RuntimeSpriteState, ProjectData } from "../types";
import { initializeRuntimeState } from "./spriteState";
import { generateSpriteId } from "../utils/helpers";
import { useEditorStore } from "../store/editorStore";

export interface ThreadContext {
  stopped: boolean;
}

export interface BroadcastReceiver {
  block: Blockly.Block;
  sprite: RuntimeSpriteState;
}

export interface RuntimeContext {
  sprites: Record<string, RuntimeSpriteState>;
  clones: RuntimeSpriteState[];
  variables: Record<string, any>;
  lists: Record<string, any[]>;
  functions: Record<string, any>;
  backdrop: number;
  timer: number;
  answer: string;
  running: boolean;
  keysPressed: Set<string>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  gameOver: boolean;
  levelComplete: boolean;
  penCanvas: HTMLCanvasElement | null;
  penCtx: CanvasRenderingContext2D | null;
  audioCtx: AudioContext | null;
  broadcastHandlers: Map<string, BroadcastReceiver[]>;
  stopAll: boolean;
  stopScript: boolean;
  startTime: number;
  cloneCounter: number;
  onStateChange: () => void;
  askCallback: ((question: string) => Promise<string>) | null;
}

export class RuntimeEngine {
  ctx: RuntimeContext;
  project: ProjectData;
  private animationFrame: number | null = null;
  private lastTime: number = 0;
  private runningScripts: { stop: () => void }[] = [];
  private headlessWorkspaces: Blockly.Workspace[] = [];
  private compiledTopBlocks: { sprite: RuntimeSpriteState; block: Blockly.Block }[] = [];
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(project: ProjectData, onStateChange: () => void) {
    this.project = project;
    const state = initializeRuntimeState(project);
    this.ctx = {
      ...state,
      penCanvas: null,
      penCtx: null,
      audioCtx: null,
      broadcastHandlers: new Map(),
      stopAll: false,
      stopScript: false,
      cloneCounter: 0,
      onStateChange,
      askCallback: null,
    };
  }

  setPenCanvas(canvas: HTMLCanvasElement) {
    this.ctx.penCanvas = canvas;
    this.ctx.penCtx = canvas.getContext("2d");
  }

  setAskCallback(cb: (question: string) => Promise<string>) {
    this.ctx.askCallback = cb;
  }

  private getAllSprites(): RuntimeSpriteState[] {
    return [...Object.values(this.ctx.sprites), ...this.ctx.clones];
  }

  private clearHeadless() {
    this.headlessWorkspaces.forEach((ws) => {
      try {
        ws.dispose();
      } catch {}
    });
    this.headlessWorkspaces = [];
    this.compiledTopBlocks = [];
  }

  async run(
    workspace: Blockly.Workspace | null,
    trigger: { type: string; key?: string; spriteId?: string; message?: string },
    activeSpriteId?: string | null
  ) {
    if (trigger.type === "flag" || trigger.type === "start") {
      this.ctx.running = true;
      this.ctx.stopAll = false;
      this.ctx.gameOver = false;
      this.ctx.levelComplete = false;
      this.ctx.startTime = Date.now();
      this.ctx.timer = 0;
      this.ctx.broadcastHandlers.clear();
      this.clearHeadless();

      // Sync active sprite's live workspace XML into project data first
      if (workspace && activeSpriteId) {
        try {
          const dom = Blockly.Xml.workspaceToDom(workspace);
          const xml = Blockly.Xml.domToText(dom);
          const activeSprite = this.project.sprites.find((s) => s.id === activeSpriteId);
          if (activeSprite) activeSprite.blocks = xml;
        } catch {}
      }

      // Compile isolated execution workspaces for EVERY sprite in the project
      for (const spriteData of this.project.sprites) {
        const runtimeSprite = this.ctx.sprites[spriteData.id];
        if (!runtimeSprite) continue;

        if (spriteData.blocks && spriteData.blocks.trim()) {
          try {
            const ws = new Blockly.Workspace();
            this.headlessWorkspaces.push(ws);
            const dom = Blockly.utils.xml.textToDom(spriteData.blocks);
            Blockly.Xml.domToWorkspace(dom, ws);
            const topBlocks = ws.getTopBlocks(false);
            for (const block of topBlocks) {
              this.compiledTopBlocks.push({ sprite: runtimeSprite, block });
              if (block.type === "event_when_receive") {
                const msg = this.getField(block, "MESSAGE");
                const existing = this.ctx.broadcastHandlers.get(msg) || [];
                existing.push({ block, sprite: runtimeSprite });
                this.ctx.broadcastHandlers.set(msg, existing);
              }
            }
          } catch (e) {
            console.warn("Could not compile blocks for sprite:", spriteData.name, e);
          }
        }
      }

      // Launch all green-flag event blocks in parallel for all sprites
      for (const { block, sprite } of this.compiledTopBlocks) {
        if (this.ctx.stopAll) break;
        if (this.matchTrigger(block, trigger, sprite.id)) {
          this.startScript(block, sprite);
        }
      }

      if (!this.animationFrame) {
        this.startGameLoop();
      }
      return;
    }

    // For keypresses, clicks, and other runtime events:
    // Execute matching hat blocks from pre-compiled workspaces without re-parsing XML!
    for (const { block, sprite } of this.compiledTopBlocks) {
      if (this.ctx.stopAll) break;
      if (this.matchTrigger(block, trigger, sprite.id)) {
        this.startScript(block, sprite);
      }
    }
  }

  private matchTrigger(
    block: Blockly.Block,
    trigger: { type: string; key?: string; spriteId?: string; message?: string },
    spriteId: string
  ): boolean {
    switch (block.type) {
      case "event_when_flag":
        return trigger.type === "flag";
      case "event_when_key": {
        if (trigger.type !== "key") return false;
        const keyField = block.getFieldValue("KEY");
        if (keyField === "any") return true;
        if (keyField === " " && (trigger.key === " " || trigger.key === "Space")) return true;
        return keyField.toLowerCase() === trigger.key?.toLowerCase();
      }
      case "event_when_clicked":
        return trigger.type === "clicked" && trigger.spriteId === spriteId;
      case "event_when_start":
        return trigger.type === "start" || trigger.type === "flag";
      case "event_when_receive":
        return trigger.type === "receive" && this.getField(block, "MESSAGE") === trigger.message;
      case "control_when_start_as_clone":
        return trigger.type === "clone";
      default:
        return false;
    }
  }

  private startScript(block: Blockly.Block, sprite: RuntimeSpriteState | null) {
    const thread: ThreadContext = { stopped: false };
    const scriptObj = {
      stop: () => {
        thread.stopped = true;
      },
    };
    this.runningScripts.push(scriptObj);

    (async () => {
      try {
        let current: Blockly.Block | null = block;
        if (this.isHatBlock(block)) {
          current = block.getNextBlock();
        }
        while (current && !thread.stopped && !this.ctx.stopAll) {
          await this.executeBlock(current, sprite, thread);
          current = current.getNextBlock();
        }
      } catch (e) {
        // Script finished or error caught
      }
      this.runningScripts = this.runningScripts.filter((s) => s !== scriptObj);
    })();
  }

  private isHatBlock(block: Blockly.Block): boolean {
    return [
      "event_when_flag",
      "event_when_key",
      "event_when_clicked",
      "event_when_start",
      "event_when_receive",
      "control_when_start_as_clone",
    ].includes(block.type);
  }

  private drawPenLine(sprite: RuntimeSpriteState, x1: number, y1: number, x2: number, y2: number) {
    if (!this.ctx.penCtx || !sprite.penDown) return;
    const ctx = this.ctx.penCtx;
    ctx.save();
    ctx.strokeStyle = sprite.penColor || "#ff0000";
    ctx.lineWidth = Math.max(1, sprite.penSize || 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1 + 240, 180 - y1);
    ctx.lineTo(x2 + 240, 180 - y2);
    ctx.stroke();
    ctx.restore();
  }

  private async executeBlock(block: Blockly.Block, sprite: RuntimeSpriteState | null, thread?: ThreadContext): Promise<any> {
    if (this.ctx.stopAll || (thread && thread.stopped)) return;
    const type = block.type;

    switch (type) {
      // ============ MOTION ============
      case "motion_move_steps": {
        if (sprite) {
          const steps = this.getNumField(block, "STEPS");
          const rad = ((sprite.direction - 90) * Math.PI) / 180;
          const oldX = sprite.x;
          const oldY = sprite.y;
          sprite.x += Math.cos(rad) * steps;
          sprite.y -= Math.sin(rad) * steps;
          this.drawPenLine(sprite, oldX, oldY, sprite.x, sprite.y);
        }
        break;
      }
      case "motion_turn_clockwise": {
        if (sprite) sprite.direction = (sprite.direction + this.getNumField(block, "DEGREES")) % 360;
        break;
      }
      case "motion_turn_counter": {
        if (sprite) sprite.direction = (sprite.direction - this.getNumField(block, "DEGREES") + 360) % 360;
        break;
      }
      case "motion_goto_xy": {
        if (sprite) {
          const oldX = sprite.x;
          const oldY = sprite.y;
          sprite.x = this.getNumField(block, "X");
          sprite.y = this.getNumField(block, "Y");
          this.drawPenLine(sprite, oldX, oldY, sprite.x, sprite.y);
        }
        break;
      }
      case "motion_glide_xy": {
        if (sprite) {
          const targetX = this.getNumField(block, "X");
          const targetY = this.getNumField(block, "Y");
          const secs = Math.max(0.05, this.getNumField(block, "SECS"));
          const startX = sprite.x;
          const startY = sprite.y;
          const steps = Math.max(1, Math.floor(secs * 60));
          let prevX = startX;
          let prevY = startY;
          for (let i = 1; i <= steps; i++) {
            if (this.ctx.stopAll) return;
            const t = i / steps;
            sprite.x = startX + (targetX - startX) * t;
            sprite.y = startY + (targetY - startY) * t;
            this.drawPenLine(sprite, prevX, prevY, sprite.x, sprite.y);
            prevX = sprite.x;
            prevY = sprite.y;
            this.ctx.onStateChange();
            await this.frame();
          }
        }
        break;
      }
      case "motion_change_x": {
        if (sprite) {
          const oldX = sprite.x;
          sprite.x += this.getNumField(block, "DX");
          this.drawPenLine(sprite, oldX, sprite.y, sprite.x, sprite.y);
        }
        break;
      }
      case "motion_change_y": {
        if (sprite) {
          const oldY = sprite.y;
          sprite.y += this.getNumField(block, "DY");
          this.drawPenLine(sprite, sprite.x, oldY, sprite.x, sprite.y);
        }
        break;
      }
      case "motion_set_x": {
        if (sprite) {
          const oldX = sprite.x;
          sprite.x = this.getNumField(block, "X");
          this.drawPenLine(sprite, oldX, sprite.y, sprite.x, sprite.y);
        }
        break;
      }
      case "motion_set_y": {
        if (sprite) {
          const oldY = sprite.y;
          sprite.y = this.getNumField(block, "Y");
          this.drawPenLine(sprite, sprite.x, oldY, sprite.x, sprite.y);
        }
        break;
      }
      case "motion_point_direction": {
        if (sprite) sprite.direction = this.getNumField(block, "DIR");
        break;
      }
      case "motion_x":
        return sprite?.x ?? 0;
      case "motion_y":
        return sprite?.y ?? 0;
      case "motion_direction":
        return sprite?.direction ?? 90;

      // ============ LOOKS ============
      case "looks_say": {
        if (sprite) {
          sprite.saying = this.getField(block, "TEXT");
          this.ctx.onStateChange();
        }
        break;
      }
      case "looks_say_for": {
        if (sprite) {
          sprite.saying = this.getField(block, "TEXT");
          this.ctx.onStateChange();
          const secs = Math.max(0.1, this.getNumField(block, "SECS"));
          await this.wait(secs);
          sprite.saying = null;
          this.ctx.onStateChange();
        }
        break;
      }
      case "looks_show": {
        if (sprite) sprite.visible = true;
        break;
      }
      case "looks_hide": {
        if (sprite) sprite.visible = false;
        break;
      }
      case "looks_change_size": {
        if (sprite) sprite.size = Math.max(5, sprite.size + this.getNumField(block, "SIZE"));
        break;
      }
      case "looks_set_size": {
        if (sprite) sprite.size = Math.max(5, this.getNumField(block, "SIZE"));
        break;
      }
      case "looks_next_costume": {
        if (sprite && sprite.costumes.length > 0) {
          sprite.costumeIndex = (sprite.costumeIndex + 1) % sprite.costumes.length;
        }
        break;
      }
      case "looks_change_costume": {
        if (sprite) {
          const name = this.getField(block, "COSTUME").toLowerCase();
          const idx = sprite.costumes.findIndex((c) => c.name.toLowerCase() === name);
          if (idx >= 0) sprite.costumeIndex = idx;
        }
        break;
      }
      case "looks_change_color": {
        if (sprite) sprite.effects.color = (sprite.effects.color + this.getNumField(block, "EFFECT")) % 100;
        break;
      }
      case "looks_switch_backdrop": {
        const val = this.getField(block, "BACKDROP").trim().toLowerCase();
        if (val === "next") {
          this.ctx.backdrop = (this.ctx.backdrop + 1) % Math.max(1, this.project.backdrops.length);
        } else if (val === "previous" || val === "prev") {
          this.ctx.backdrop =
            (this.ctx.backdrop - 1 + this.project.backdrops.length) % Math.max(1, this.project.backdrops.length);
        } else {
          const idx = this.project.backdrops.findIndex((b) => b.name.toLowerCase() === val);
          if (idx >= 0) {
            this.ctx.backdrop = idx;
          } else {
            const num = parseInt(val, 10);
            if (!isNaN(num) && num >= 0 && num < this.project.backdrops.length) {
              this.ctx.backdrop = num;
            } else {
              this.ctx.backdrop = (this.ctx.backdrop + 1) % Math.max(1, this.project.backdrops.length);
            }
          }
        }
        break;
      }
      case "looks_size":
        return sprite?.size ?? 100;

      // ============ SOUND ============
      case "sound_play":
      case "sound_start": {
        const snd = this.getField(block, "SOUND");
        this.playSound(snd || "pop", 0.3);
        break;
      }
      case "sound_stop_all": {
        this.stopAllSounds();
        break;
      }
      case "sound_change_volume": {
        if (sprite) sprite.volume = Math.max(0, Math.min(100, sprite.volume + this.getNumField(block, "VOLUME")));
        break;
      }
      case "sound_set_volume": {
        if (sprite) sprite.volume = Math.max(0, Math.min(100, this.getNumField(block, "VOLUME")));
        break;
      }
      case "sound_play_note": {
        const note = this.getNumField(block, "NOTE") || 60;
        const beats = this.getNumField(block, "BEATS") || 0.5;
        const freq = 440 * Math.pow(2, (note - 69) / 12);
        this.playSound(freq, beats * 0.5);
        break;
      }

      // ============ EVENTS ============
      case "event_broadcast": {
        const msg = this.getField(block, "MESSAGE");
        this.broadcast(msg, false);
        break;
      }
      case "event_broadcast_wait": {
        const msg = this.getField(block, "MESSAGE");
        await this.broadcast(msg, true);
        break;
      }

      // ============ CONTROL ============
      case "control_wait": {
        await this.wait(this.getNumField(block, "SECS"), thread);
        break;
      }
      case "control_repeat": {
        let times = (await this.evalInput(block, "TIMES", 10, sprite, thread)) as number;
        if (typeof times !== "number" || isNaN(times)) times = 10;
        const doBlock = block.getInput("DO")?.connection?.targetBlock();
        for (let i = 0; i < times; i++) {
          if (this.ctx.stopAll || (thread && thread.stopped)) return;
          await this.runStatementStack(doBlock, sprite, thread);
          await this.frame();
        }
        break;
      }
      case "control_forever": {
        const doBlock = block.getInput("DO")?.connection?.targetBlock();
        while (!this.ctx.stopAll && (!thread || !thread.stopped)) {
          await this.runStatementStack(doBlock, sprite, thread);
          await this.frame();
        }
        return;
      }
      case "control_if": {
        const cond = await this.evalInput(block, "CONDITION", false, sprite, thread);
        if (cond) {
          const doBlock = block.getInput("DO")?.connection?.targetBlock();
          await this.runStatementStack(doBlock, sprite, thread);
        }
        break;
      }
      case "control_if_else": {
        const cond = await this.evalInput(block, "CONDITION", false, sprite, thread);
        const branch = cond ? "DO" : "ELSE";
        const doBlock = block.getInput(branch)?.connection?.targetBlock();
        await this.runStatementStack(doBlock, sprite, thread);
        break;
      }
      case "control_repeat_until": {
        const doBlock = block.getInput("DO")?.connection?.targetBlock();
        let cond = await this.evalInput(block, "CONDITION", false, sprite, thread);
        while (!cond && !this.ctx.stopAll && (!thread || !thread.stopped)) {
          await this.runStatementStack(doBlock, sprite, thread);
          await this.frame();
          cond = await this.evalInput(block, "CONDITION", false, sprite, thread);
        }
        break;
      }
      case "control_stop": {
        const mode = this.getField(block, "STOP");
        if (mode === "all") {
          this.ctx.stopAll = true;
          this.stop();
        } else if (thread) {
          thread.stopped = true;
        }
        break;
      }
      case "control_create_clone": {
        const targetName = this.getField(block, "SPRITE").toLowerCase().trim();
        const target =
          targetName === "myself" || !targetName
            ? sprite
            : this.getAllSprites().find((s) => s.name.toLowerCase() === targetName);

        if (target) {
          const cloneId = generateSpriteId();
          const clone: RuntimeSpriteState = {
            ...target,
            id: cloneId,
            isClone: true,
            parentId: target.id,
            layerOrder: 1000 + this.ctx.cloneCounter++,
            saying: null,
            sayTimer: 0,
            variables: { ...target.variables },
          };
          this.ctx.clones.push(clone);
          this.ctx.onStateChange();

          // Spawn clone scripts
          this.triggerCloneScripts(target.id, clone);
        }
        break;
      }
      case "control_delete_clone": {
        if (sprite?.isClone) {
          const idx = this.ctx.clones.findIndex((c) => c.id === sprite.id);
          if (idx >= 0) this.ctx.clones.splice(idx, 1);
          if (thread) thread.stopped = true;
          this.ctx.onStateChange();
        }
        break;
      }

      // ============ SENSING ============
      case "sensing_key_pressed": {
        const key = this.getField(block, "KEY");
        if (key === "any") return this.ctx.keysPressed.size > 0;
        if (key === " " && (this.ctx.keysPressed.has(" ") || this.ctx.keysPressed.has("Space"))) return true;
        return this.ctx.keysPressed.has(key) || this.ctx.keysPressed.has(key.toLowerCase());
      }
      case "sensing_mouse_down":
        return this.ctx.mouseDown;
      case "sensing_mouse_x":
        return this.ctx.mouseX;
      case "sensing_mouse_y":
        return this.ctx.mouseY;
      case "sensing_touching": {
        if (!sprite) return false;
        const targetName = this.getField(block, "SPRITE").toLowerCase().trim();
        if (targetName === "mouse-pointer" || targetName === "mouse pointer" || targetName === "_mouse_") {
          const costume = sprite.costumes[sprite.costumeIndex];
          const halfW = (((costume?.width ?? 80) * sprite.size) / 100) / 2;
          const halfH = (((costume?.height ?? 80) * sprite.size) / 100) / 2;
          const dx = Math.abs(sprite.x - this.ctx.mouseX);
          const dy = Math.abs(sprite.y - this.ctx.mouseY);
          return dx < halfW && dy < halfH;
        }
        if (targetName === "edge" || targetName === "_edge_") {
          const costume = sprite.costumes[sprite.costumeIndex];
          const halfW = (((costume?.width ?? 80) * sprite.size) / 100) / 2;
          const halfH = (((costume?.height ?? 80) * sprite.size) / 100) / 2;
          return sprite.x - halfW <= -240 || sprite.x + halfW >= 240 || sprite.y - halfH <= -180 || sprite.y + halfH >= 180;
        }
        const targets = this.getAllSprites().filter(
          (s) =>
            s.id !== sprite.id &&
            s.visible &&
            (s.name.toLowerCase().trim() === targetName ||
              s.name.toLowerCase().replace(/\s+/g, "") === targetName.replace(/\s+/g, ""))
        );
        for (const t of targets) {
          if (this.checkCollision(sprite, t)) return true;
        }
        return false;
      }
      case "sensing_touching_color": {
        return false;
      }
      case "sensing_touching_edge": {
        if (!sprite) return false;
        const costume = sprite.costumes[sprite.costumeIndex];
        const halfW = (((costume?.width ?? 80) * sprite.size) / 100) / 2;
        const halfH = (((costume?.height ?? 80) * sprite.size) / 100) / 2;
        return sprite.x - halfW <= -240 || sprite.x + halfW >= 240 || sprite.y - halfH <= -180 || sprite.y + halfH >= 180;
      }
      case "sensing_touching_mouse": {
        if (!sprite) return false;
        const costume = sprite.costumes[sprite.costumeIndex];
        const halfW = (((costume?.width ?? 80) * sprite.size) / 100) / 2;
        const halfH = (((costume?.height ?? 80) * sprite.size) / 100) / 2;
        const dx = Math.abs(sprite.x - this.ctx.mouseX);
        const dy = Math.abs(sprite.y - this.ctx.mouseY);
        return dx < halfW && dy < halfH;
      }
      case "sensing_bounce_off_edge": {
        if (sprite) {
          const costume = sprite.costumes[sprite.costumeIndex];
          const halfW = (((costume?.width ?? 80) * sprite.size) / 100) / 2;
          const halfH = (((costume?.height ?? 80) * sprite.size) / 100) / 2;
          const STAGE_W = 240;
          const STAGE_H = 180;
          if (sprite.x + halfW >= STAGE_W) {
            sprite.x = STAGE_W - halfW;
            sprite.direction = 180 - sprite.direction;
          } else if (sprite.x - halfW <= -STAGE_W) {
            sprite.x = -STAGE_W + halfW;
            sprite.direction = 180 - sprite.direction;
          }
          if (sprite.y + halfH >= STAGE_H) {
            sprite.y = STAGE_H - halfH;
            sprite.direction = -sprite.direction;
          } else if (sprite.y - halfH <= -STAGE_H) {
            sprite.y = -STAGE_H + halfH;
            sprite.direction = -sprite.direction;
          }
          sprite.direction = ((sprite.direction % 360) + 360) % 360;
        }
        break;
      }
      case "sensing_distance": {
        if (!sprite) return 0;
        const targetName = this.getField(block, "SPRITE").toLowerCase().trim();
        const target = this.getAllSprites().find((s) => s.name.toLowerCase() === targetName && s.id !== sprite.id);
        if (!target) return 10000;
        const dx = sprite.x - target.x;
        const dy = sprite.y - target.y;
        return Math.sqrt(dx * dx + dy * dy);
      }
      case "sensing_ask": {
        const question = this.getField(block, "QUESTION") || "What's your name?";
        if (this.ctx.askCallback) {
          this.ctx.answer = await this.ctx.askCallback(question);
        }
        break;
      }
      case "sensing_answer":
        return this.ctx.answer;
      case "sensing_timer":
        return (Date.now() - this.ctx.startTime) / 1000;
      case "sensing_reset_timer":
        this.ctx.startTime = Date.now();
        break;

      // ============ OPERATORS ============
      case "operators_add":
        return (await this.evalInput(block, "A", 0)) + (await this.evalInput(block, "B", 0));
      case "operators_subtract":
        return (await this.evalInput(block, "A", 0)) - (await this.evalInput(block, "B", 0));
      case "operators_multiply":
        return (await this.evalInput(block, "A", 0)) * (await this.evalInput(block, "B", 0));
      case "operators_divide": {
        const b = await this.evalInput(block, "B", 0);
        const a = await this.evalInput(block, "A", 0);
        return b === 0 ? 0 : a / b;
      }
      case "operators_random": {
        const from = this.getNumField(block, "FROM");
        const to = this.getNumField(block, "TO");
        return Math.floor(from + Math.random() * (to - from + 1));
      }
      case "operators_greater":
        return (await this.evalInput(block, "A", 0)) > (await this.evalInput(block, "B", 0));
      case "operators_less":
        return (await this.evalInput(block, "A", 0)) < (await this.evalInput(block, "B", 0));
      case "operators_equal":
        return (await this.evalInput(block, "A", 0)) === (await this.evalInput(block, "B", 0));
      case "operators_and":
        return (await this.evalInput(block, "A", false)) && (await this.evalInput(block, "B", false));
      case "operators_or":
        return (await this.evalInput(block, "A", false)) || (await this.evalInput(block, "B", false));
      case "operators_not":
        return !(await this.evalInput(block, "A", false));
      case "operators_join":
        return this.getField(block, "A") + this.getField(block, "B");
      case "operators_length":
        return this.getField(block, "TEXT").length;
      case "operators_mod": {
        const b = this.getNumField(block, "B");
        return b === 0 ? 0 : this.getNumField(block, "A") % b;
      }
      case "operators_round":
        return Math.round(this.getNumField(block, "NUM"));

      // ============ VARIABLES ============
      case "variables_set": {
        const name = this.getField(block, "VAR");
        const valStr = this.getField(block, "VALUE");
        const val = isNaN(Number(valStr)) ? valStr : Number(valStr);
        this.setVariable(name, val, sprite);
        break;
      }
      case "variables_change": {
        const name = this.getField(block, "VAR");
        const current = this.getVariable(name, sprite);
        const newVal = Number(current) + this.getNumField(block, "VALUE");
        this.setVariable(name, newVal, sprite);
        break;
      }
      case "variables_show": {
        const name = this.getField(block, "VAR");
        const v = this.project.variables.find((x) => x.name === name);
        if (v) v.visible = true;
        break;
      }
      case "variables_hide": {
        const name = this.getField(block, "VAR");
        const v = this.project.variables.find((x) => x.name === name);
        if (v) v.visible = false;
        break;
      }
      case "variables_get": {
        return this.getVariable(this.getField(block, "VAR"), sprite);
      }
      case "variables_create": {
        const name = this.getField(block, "NAME");
        if (!(name in this.ctx.variables)) this.ctx.variables[name] = 0;
        break;
      }

      // ============ FUNCTIONS ============
      case "procedures_def":
        return;
      case "procedures_call": {
        const name = this.getField(block, "NAME");
        const defBlock = this.findFunctionDef(block.workspace, name);
        if (defBlock) {
          await this.runStatementStack(defBlock.getNextBlock(), sprite);
        }
        break;
      }

      // ============ DRAWING ============
      case "drawing_pen_down":
        if (sprite) sprite.penDown = true;
        break;
      case "drawing_pen_up":
        if (sprite) sprite.penDown = false;
        break;
      case "drawing_set_color":
        if (sprite) {
          const col = this.getField(block, "COLOR");
          sprite.penColor = col.startsWith("#") ? col : `#${col}`;
        }
        break;
      case "drawing_set_size":
        if (sprite) sprite.penSize = Math.max(1, this.getNumField(block, "SIZE"));
        break;
      case "drawing_clear":
        this.clearPen();
        break;
      case "drawing_stamp":
        if (sprite) this.stamp(sprite);
        break;

      // ============ GAME ============
      case "game_set_score":
        if (sprite) {
          sprite.score = this.getNumField(block, "SCORE");
          this.ctx.variables["score"] = sprite.score;
        }
        break;
      case "game_change_score":
        if (sprite) {
          sprite.score += this.getNumField(block, "VALUE");
          this.ctx.variables["score"] = (this.ctx.variables["score"] ?? 0) + this.getNumField(block, "VALUE");
        }
        break;
      case "game_score":
        return sprite?.score ?? (this.ctx.variables["score"] || 0);
      case "game_set_health":
        if (sprite) sprite.health = this.getNumField(block, "HEALTH");
        break;
      case "game_change_health":
        if (sprite) sprite.health += this.getNumField(block, "VALUE");
        break;
      case "game_set_lives":
        if (sprite) sprite.lives = this.getNumField(block, "LIVES");
        break;
      case "game_change_lives":
        if (sprite) sprite.lives += this.getNumField(block, "VALUE");
        break;
      case "game_set_gravity":
        if (sprite) sprite.gravity = this.getNumField(block, "GRAVITY");
        break;
      case "game_jump": {
        if (sprite) sprite.vy = Math.abs(this.getNumField(block, "POWER") || 9);
        break;
      }
      case "game_apply_gravity": {
        if (sprite) {
          const grav = sprite.gravity || 0.5;
          sprite.vy -= grav;
          const oldY = sprite.y;
          sprite.y += sprite.vy;
          // Clamp to floor boundary
          if (sprite.y <= -150) {
            sprite.y = -150;
            sprite.vy = 0;
          }
          this.drawPenLine(sprite, sprite.x, oldY, sprite.x, sprite.y);
        }
        break;
      }
      case "game_game_over":
        this.ctx.gameOver = true;
        this.playSound("explosion", 0.5);
        break;
      case "game_level_complete":
        this.ctx.levelComplete = true;
        this.playSound("win", 0.6);
        break;
      case "game_move_player": {
        if (sprite) {
          const dir = this.getField(block, "DIR");
          const speed = this.getNumField(block, "SPEED");
          const oldX = sprite.x;
          const oldY = sprite.y;
          switch (dir) {
            case "left":
              sprite.x -= speed;
              break;
            case "right":
              sprite.x += speed;
              break;
            case "up":
              sprite.y += speed;
              break;
            case "down":
              sprite.y -= speed;
              break;
          }
          this.drawPenLine(sprite, oldX, oldY, sprite.x, sprite.y);
        }
        break;
      }
      case "game_random_move": {
        if (sprite) {
          const speed = this.getNumField(block, "SPEED");
          const angle = Math.random() * Math.PI * 2;
          const oldX = sprite.x;
          const oldY = sprite.y;
          sprite.x += Math.cos(angle) * speed;
          sprite.y += Math.sin(angle) * speed;
          this.drawPenLine(sprite, oldX, oldY, sprite.x, sprite.y);
        }
        break;
      }

      // ============ ADVANCED ============
      case "advanced_js": {
        try {
          const code = this.getField(block, "CODE");
          // eslint-disable-next-line no-new-func
          Function(code)();
        } catch (e) {
          console.error("JS block error:", e);
        }
        break;
      }
      case "advanced_console_log":
        console.log(this.getField(block, "TEXT"));
        break;
      case "advanced_list_create": {
        const name = this.getField(block, "NAME");
        if (!(name in this.ctx.lists)) this.ctx.lists[name] = [];
        break;
      }
      case "advanced_list_add": {
        const listName = this.getField(block, "LIST");
        const item = this.getField(block, "ITEM");
        if (!this.ctx.lists[listName]) this.ctx.lists[listName] = [];
        this.ctx.lists[listName].push(isNaN(Number(item)) ? item : Number(item));
        break;
      }
      case "advanced_list_length": {
        const listName = this.getField(block, "LIST");
        return this.ctx.lists[listName]?.length ?? 0;
      }
      case "advanced_math_func": {
        const func = this.getField(block, "FUNC");
        const num = this.getNumField(block, "NUM");
        const mathFuncs: Record<string, (n: number) => number> = {
          abs: Math.abs,
          floor: Math.floor,
          ceil: Math.ceil,
          sqrt: Math.sqrt,
          sin: Math.sin,
          cos: Math.cos,
          tan: Math.tan,
        };
        return mathFuncs[func]?.(num) ?? 0;
      }
      case "advanced_wait_until": {
        let cond = await this.evalInput(block, "CONDITION", false);
        while (!cond && !this.ctx.stopAll && !this.ctx.stopScript) {
          await this.frame();
          cond = await this.evalInput(block, "CONDITION", false);
        }
        break;
      }

      default:
        break;
    }
  }

  private triggerCloneScripts(parentSpriteId: string, clone: RuntimeSpriteState) {
    const parentSpriteData = this.project.sprites.find((s) => s.id === parentSpriteId);
    if (!parentSpriteData || !parentSpriteData.blocks) return;

    try {
      const ws = new (Blockly as any).Workspace();
      this.headlessWorkspaces.push(ws);
      const dom = Blockly.utils.xml.textToDom(parentSpriteData.blocks);
      Blockly.Xml.domToWorkspace(dom, ws);
      for (const block of ws.getTopBlocks(false)) {
        if (block.type === "control_when_start_as_clone") {
          this.startScript(block, clone);
        }
      }
    } catch (e) {
      console.warn("Clone script error:", e);
    }
  }

  private findFunctionDef(workspace: Blockly.Workspace, name: string): Blockly.Block | null {
    if (!workspace) return null;
    const allBlocks = workspace.getAllBlocks(false);
    return allBlocks.find((b) => b.type === "procedures_def" && b.getFieldValue("NAME") === name) ?? null;
  }

  private async runStatementStack(
    block: Blockly.Block | null | undefined,
    sprite: RuntimeSpriteState | null,
    thread?: ThreadContext
  ) {
    let current = block;
    while (current && !this.ctx.stopAll && (!thread || !thread.stopped)) {
      await this.executeBlock(current, sprite, thread);
      current = current.getNextBlock();
    }
  }

  private async evalInput(
    block: Blockly.Block,
    inputName: string,
    defaultValue: any,
    sprite: RuntimeSpriteState | null = null,
    thread?: ThreadContext
  ): Promise<any> {
    const inputBlock = block.getInput(inputName)?.connection?.targetBlock();
    if (inputBlock) {
      return await this.executeBlock(inputBlock, sprite, thread);
    }
    return defaultValue;
  }

  private getNumField(block: Blockly.Block, name: string): number {
    return Number(block.getFieldValue(name)) || 0;
  }

  private getField(block: Blockly.Block, name: string): string {
    return String(block.getFieldValue(name) ?? "");
  }

  private getVariable(name: string, sprite: RuntimeSpriteState | null): any {
    if (sprite && name in sprite.variables) return sprite.variables[name];
    return this.ctx.variables[name] ?? 0;
  }

  private setVariable(name: string, value: any, sprite: RuntimeSpriteState | null) {
    if (sprite && name in sprite.variables) sprite.variables[name] = value;
    else this.ctx.variables[name] = value;
  }

  private checkCollision(a: RuntimeSpriteState, b: RuntimeSpriteState): boolean {
    const aCostume = a.costumes[a.costumeIndex];
    const bCostume = b.costumes[b.costumeIndex];
    const aW = Math.max(20, ((a.size / 100) * (aCostume?.width ?? 80)) * 0.85);
    const aH = Math.max(20, ((a.size / 100) * (aCostume?.height ?? 80)) * 0.85);
    const bW = Math.max(20, ((b.size / 100) * (bCostume?.width ?? 80)) * 0.85);
    const bH = Math.max(20, ((b.size / 100) * (bCostume?.height ?? 80)) * 0.85);
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx < (aW + bW) / 2 && dy < (aH + bH) / 2;
  }

  private async broadcast(message: string, wait: boolean): Promise<void> {
    const receivers = this.ctx.broadcastHandlers.get(message) || [];
    const promises: Promise<void>[] = [];
    for (const { block, sprite } of receivers) {
      if (this.ctx.stopAll) break;
      const p = new Promise<void>((resolve) => {
        let current: Blockly.Block | null = block.getNextBlock();
        (async () => {
          while (current && !this.ctx.stopAll) {
            await this.executeBlock(current, sprite);
            current = current.getNextBlock();
          }
          resolve();
        })();
      });
      promises.push(p);
    }
    if (wait) {
      await Promise.all(promises);
    }
  }

  private playSound(sound: string | number, duration: number = 0.3) {
    if (!useEditorStore.getState().soundEffectsEnabled) return;
    try {
      if (!this.ctx.audioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx.audioCtx = new AudioCtx();
      }
      const ctx = this.ctx.audioCtx;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (typeof sound === "number") {
        this.playTone(sound, duration, "sine");
        return;
      }

      const s = String(sound).toLowerCase();
      if (s === "pop") {
        this.playTone(850, 0.06, "sine");
      } else if (s === "laser") {
        this.playSweep(950, 150, 0.15);
      } else if (s === "coin") {
        this.playTone(987, 0.08, "triangle");
        setTimeout(() => this.playTone(1318, 0.15, "triangle"), 80);
      } else if (s === "jump") {
        this.playSweep(160, 480, 0.18);
      } else if (s === "boing") {
        this.playTone(320, 0.25, "square");
      } else if (s === "win") {
        [523, 659, 783, 1046].forEach((f, i) => {
          setTimeout(() => this.playTone(f, 0.15, "triangle"), i * 110);
        });
      } else if (s === "explosion") {
        this.playNoise(0.3);
      } else if (s === "meow") {
        this.playSweep(620, 420, 0.32);
      } else {
        const num = parseFloat(s);
        if (!isNaN(num)) this.playTone(num, duration, "sine");
        else this.playTone(440, duration, "sine");
      }
    } catch {}
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "sine") {
    if (!this.ctx.audioCtx) return;
    const ctx = this.ctx.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private playSweep(fromFreq: number, toFreq: number, duration: number) {
    if (!this.ctx.audioCtx) return;
    const ctx = this.ctx.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(fromFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(toFreq, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number) {
    if (!this.ctx.audioCtx) return;
    const ctx = this.ctx.audioCtx;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  private stopAllSounds() {
    if (this.ctx.audioCtx) {
      try {
        this.ctx.audioCtx.close();
      } catch {}
      this.ctx.audioCtx = null;
    }
  }

  private clearPen() {
    if (this.ctx.penCtx && this.ctx.penCanvas) {
      this.ctx.penCtx.clearRect(0, 0, this.ctx.penCanvas.width, this.ctx.penCanvas.height);
    }
  }

  private stamp(sprite: RuntimeSpriteState) {
    if (!this.ctx.penCtx) return;
    const ctx = this.ctx.penCtx;
    const costume = sprite.costumes[sprite.costumeIndex];
    if (!costume || !costume.dataUrl) return;

    let img = this.imageCache.get(costume.dataUrl);
    if (!img) {
      img = new Image();
      img.src = costume.dataUrl;
      this.imageCache.set(costume.dataUrl, img);
    }

    const scale = sprite.size / 100;
    const drawW = (costume.width || 80) * scale;
    const drawH = (costume.height || 80) * scale;
    const canvasX = sprite.x + 240;
    const canvasY = 180 - sprite.y;

    ctx.save();
    ctx.translate(canvasX, canvasY);
    if (sprite.rotationStyle === "all-around") {
      ctx.rotate(((sprite.direction - 90) * Math.PI) / 180);
    } else if (sprite.rotationStyle === "left-right" && sprite.direction < 0) {
      ctx.scale(-1, 1);
    }
    if (sprite.effects.ghost > 0) {
      ctx.globalAlpha = Math.max(0, 1 - sprite.effects.ghost / 100);
    }
    try {
      if (img.complete) {
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      }
    } catch {}
    ctx.restore();
  }

  private async wait(seconds: number, thread?: ThreadContext) {
    const ms = Math.max(0.01, seconds) * 1000;
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (this.ctx.stopAll || (thread && thread.stopped)) return;
      await this.frame();
    }
  }

  private frame(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  private startGameLoop() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.lastTime = performance.now();
    const loop = (time: number) => {
      if (!this.ctx.running) return;
      this.lastTime = time;
      this.ctx.timer = (Date.now() - this.ctx.startTime) / 1000;
      this.ctx.onStateChange();
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  stop() {
    this.ctx.running = false;
    this.ctx.stopAll = true;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.runningScripts.forEach((s) => s.stop());
    this.runningScripts = [];
    this.clearHeadless();
    this.stopAllSounds();
    this.ctx.onStateChange();
  }

  handleKeyDown(key: string) {
    this.ctx.keysPressed.add(key);
  }

  handleKeyUp(key: string) {
    this.ctx.keysPressed.delete(key);
  }

  handleMouseMove(x: number, y: number) {
    this.ctx.mouseX = x;
    this.ctx.mouseY = y;
  }

  handleMouseDown() {
    this.ctx.mouseDown = true;
  }

  handleMouseUp() {
    this.ctx.mouseDown = false;
  }
}
