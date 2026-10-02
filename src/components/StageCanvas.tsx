import { useEffect, useRef, useCallback } from "react";
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
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const penCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const backdropCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

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

      // Convert stage coords to canvas coords
      // Stage: center is (0,0), x range: -240 to 240, y range: -180 to 180
      const canvasX = sprite.x + W / 2;
      const canvasY = H / 2 - sprite.y;

      ctx.save();
      ctx.translate(canvasX, canvasY);

      // Apply rotation
      if (sprite.rotationStyle === "all-around") {
        ctx.rotate(((sprite.direction - 90) * Math.PI) / 180);
      } else if (sprite.rotationStyle === "left-right" && sprite.direction < 0) {
        ctx.scale(-1, 1);
      }

      // Apply ghost effect
      if (sprite.effects.ghost > 0) {
        ctx.globalAlpha = Math.max(0, 1 - sprite.effects.ghost / 100);
      }

      // Apply color filter
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
      ctx.font = "13px Inter, sans-serif";
      const metrics = ctx.measureText(text);
      const padding = 8;
      const boxW = metrics.width + padding * 2;
      const boxH = 24;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.roundRect(10, varY, boxW, boxH, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(text, 10 + padding, varY + 16);
      varY += 30;
    }

    // Draw game over / level complete overlay
    if (runtimeState.gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 48px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", W / 2, H / 2);
      ctx.textAlign = "left";
    }
    if (runtimeState.levelComplete) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#4caf50";
      ctx.font = "bold 48px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Level Complete!", W / 2, H / 2);
      ctx.textAlign = "left";
    }

    // Draw ask prompt
    if (runtimeState.asking) {
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(20, H - 60, W - 40, 40);
      ctx.fillStyle = "#fff";
      ctx.font = "14px Inter, sans-serif";
      ctx.fillText(runtimeState.asking, 30, H - 35);
      ctx.fillStyle = "#3385fc";
      ctx.fillRect(W - 100, H - 55, 60, 30);
      ctx.fillStyle = "#fff";
      ctx.fillText("Answer", W - 90, H - 35);
    }
  }, [project, runtimeState, loadImage, visibleVariables]);

  useEffect(() => {
    draw();
  }, [draw, runtimeState]);

  // Initialize pen canvas
  useEffect(() => {
    const penCanvas = penCanvasRef.current;
    if (penCanvas) {
      penCanvas.width = stageSize.width;
      penCanvas.height = stageSize.height;
    }
  }, [stageSize]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Check which sprite was clicked (reverse order - top sprites first)
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
    <div
      className={`relative overflow-hidden bg-gray-900 ${fullscreen ? "" : "rounded-lg"}`}
      style={fullscreen ? {
        width: `min(100vw, ${(stageSize.width / stageSize.height) * 100}vh)`,
        aspectRatio: `${stageSize.width} / ${stageSize.height}`,
      } : undefined}
    >
      <canvas
        ref={canvasRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        className="w-full h-full"
        style={{ imageRendering: "auto" }}
      />
      <canvas
        ref={penCanvasRef}
        width={stageSize.width}
        height={stageSize.height}
        className="hidden"
      />
    </div>
  );
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.font = "13px Inter, sans-serif";
  const metrics = ctx.measureText(text);
  const padding = 8;
  const w = metrics.width + padding * 2;
  const h = 28;
  const bx = x - w / 2;
  const by = y - h;

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
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

  ctx.fillStyle = "#333";
  ctx.textAlign = "center";
  ctx.fillText(text, x, by + 18);
  ctx.textAlign = "left";
}
