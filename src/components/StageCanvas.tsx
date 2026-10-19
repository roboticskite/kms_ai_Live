import { useEffect, useRef, useCallback, useState } from "react";
import type { RuntimeSpriteState, ProjectData } from "../types";

interface Props {
  project: ProjectData;
  runtimeState: {
    sprites: Record<string, RuntimeSpriteState>;
    clones: RuntimeSpriteState[];
    backdrop: number;
    variables: Record<string, any>;
    gameOver: boolean;
    levelComplete: boolean;
    answer: string;
    asking: string | null;
  };
  onSpriteClick: (spriteId: string) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
  fullscreen: boolean;
  stageSize: { width: number; height: number };
  visibleVariables: { name: string; value: any }[];
  onMountPenCanvas?: (canvas: HTMLCanvasElement) => void;
  onAnswerSubmit?: (answer: string) => void;
}

export default function StageCanvas({
  project,
  runtimeState,
  onSpriteClick,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  fullscreen,
  stageSize,
  visibleVariables,
  onMountPenCanvas,
  onAnswerSubmit,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const penCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const backdropCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [answerInput, setAnswerInput] = useState("");

  const loadImage = useCallback((dataUrl: string, cache: Map<string, HTMLImageElement>): HTMLImageElement => {
    if (cache.has(dataUrl)) return cache.get(dataUrl)!;
    const img = new Image();
    img.src = dataUrl;
    cache.set(dataUrl, img);
    return img;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Draw backdrop
    const backdrop = project.backdrops[runtimeState.backdrop] ?? project.backdrops[project.currentBackdrop];
    if (backdrop) {
      const img = loadImage(backdrop.dataUrl, backdropCacheRef.current);
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, W, H);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
    }

    // Draw pen layer
    const penCanvas = penCanvasRef.current;
    if (penCanvas) {
      ctx.drawImage(penCanvas, 0, 0, W, H);
    }

    // Collect all sprites (original + clones)
    const allSprites: RuntimeSpriteState[] = [
      ...Object.values(runtimeState.sprites),
      ...runtimeState.clones,
    ];
    allSprites.sort((a, b) => a.layerOrder - b.layerOrder);

    // Draw sprites
    for (const sprite of allSprites) {
      if (!sprite.visible) continue;

      const costume = sprite.costumes[sprite.costumeIndex];
      if (!costume) continue;

      const img = loadImage(costume.dataUrl, imageCacheRef.current);
      if (!img.complete || img.naturalWidth === 0) continue;

      const scale = sprite.size / 100;
      const drawW = (costume.width || img.naturalWidth) * scale;
      const drawH = (costume.height || img.naturalHeight) * scale;

      const canvasX = sprite.x + W / 2;
      const canvasY = H / 2 - sprite.y;

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

      if (sprite.effects.color !== 0) {
        ctx.filter = `hue-rotate(${sprite.effects.color * 3.6}deg)`;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Draw speech bubble
      if (sprite.saying) {
        drawSpeechBubble(ctx, canvasX, canvasY - drawH / 2 - 10, sprite.saying);
      }

      // Draw health bar for game sprites
      if (sprite.health < 100 && sprite.health > 0) {
        const barW = 40;
        const barH = 4;
        const barX = canvasX - barW / 2;
        const barY = canvasY - drawH / 2 - 6;
        ctx.fillStyle = "#333";
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = sprite.health > 50 ? "#4caf50" : sprite.health > 25 ? "#ff9800" : "#f44336";
        ctx.fillRect(barX, barY, (barW * sprite.health) / 100, barH);
      }
    }

    // Draw visible variables
    let varY = 20;
    for (const v of visibleVariables) {
      const text = `${v.name}: ${v.value}`;
      ctx.font = "bold 13px Inter, sans-serif";
      const metrics = ctx.measureText(text);
      const padding = 10;
      const boxW = metrics.width + padding * 2;
      const boxH = 26;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(10, varY, boxW, boxH, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(text, 10 + padding, varY + 18);
      varY += 32;
    }

    // Draw game over / level complete overlay
    if (runtimeState.gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 44px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", W / 2, H / 2);
      ctx.textAlign = "left";
    }
    if (runtimeState.levelComplete) {
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 44px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Level Complete! 🏆", W / 2, H / 2);
      ctx.textAlign = "left";
    }
  }, [project, runtimeState, loadImage, visibleVariables]);

  useEffect(() => {
    draw();
  }, [draw, runtimeState]);

  // Initialize pen canvas & notify parent
  useEffect(() => {
    const penCanvas = penCanvasRef.current;
    if (penCanvas) {
      penCanvas.width = stageSize.width;
      penCanvas.height = stageSize.height;
      if (onMountPenCanvas) {
        onMountPenCanvas(penCanvas);
      }
    }
  }, [stageSize, onMountPenCanvas]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const allSprites: RuntimeSpriteState[] = [
      ...Object.values(runtimeState.sprites),
      ...runtimeState.clones,
    ].sort((a, b) => b.layerOrder - a.layerOrder);

    for (const sprite of allSprites) {
      if (!sprite.visible) continue;
      const costume = sprite.costumes[sprite.costumeIndex];
      if (!costume) continue;
      const scale = sprite.size / 100;
      const drawW = (costume.width || 80) * scale;
      const drawH = (costume.height || 80) * scale;
      const cx = sprite.x + canvas.width / 2;
      const cy = canvas.height / 2 - sprite.y;
      if (Math.abs(x - cx) < drawW / 2 && Math.abs(y - cy) < drawH / 2) {
        onSpriteClick(sprite.id);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) - canvas.width / 2;
    const y = canvas.height / 2 - (e.clientY - rect.top) * (canvas.height / rect.height);
    onMouseMove(x, y);
  };

  return (
    <div className={`relative flex items-center justify-center ${fullscreen ? "w-full h-full" : "w-full h-full"}`}>
      <canvas
        ref={canvasRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        style={fullscreen ? undefined : { maxHeight: "270px", aspectRatio: `${stageSize.width}/${stageSize.height}` }}
        className={`rounded-xl shadow-md border border-gray-200 bg-white cursor-pointer ${
          fullscreen ? "max-h-full max-w-full object-contain" : "max-w-full h-auto object-contain"
        }`}
      />
      <canvas
        ref={penCanvasRef}
        width={stageSize.width}
        height={stageSize.height}
        className="hidden"
      />

      {/* Interactive Ask Prompt Overlay */}
      {runtimeState.asking && (
        <form
          className="absolute bottom-4 left-4 right-4 z-40 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-2xl backdrop-blur-md animate-slide-up"
          onSubmit={(e) => {
            e.preventDefault();
            if (onAnswerSubmit) onAnswerSubmit(answerInput);
            setAnswerInput("");
          }}
        >
          <div className="shrink-0 text-xs font-bold text-gray-800 px-2 max-w-[200px] truncate">
            {runtimeState.asking}
          </div>
          <input
            autoFocus
            type="text"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-kite-500"
            placeholder="Type your answer here..."
          />
          <button type="submit" className="btn-primary shrink-0 px-3 py-1.5 text-xs font-bold">
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.font = "13px Inter, sans-serif";
  const metrics = ctx.measureText(text);
  const padding = 10;
  const w = metrics.width + padding * 2;
  const h = 28;
  const bx = x - w / 2;
  const by = y - h;

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(x - 5, by + h);
  ctx.lineTo(x + 5, by + h);
  ctx.lineTo(x, by + h + 6);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fill();

  ctx.fillStyle = "#1e293b";
  ctx.textAlign = "center";
  ctx.fillText(text, x, by + 18);
  ctx.textAlign = "left";
}
