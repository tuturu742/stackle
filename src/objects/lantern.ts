// Round paper lanterns, shared by the picnic string and the farmhouse. Each is
// switched on or off with its own tap, and glows at night when on.

/** Half the size of a lantern's paper body. */
export const LANTERN_R = 15;

/** A lantern hanging from (x, y): its body sits just below. `lit` warms its colour. */
export function drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, lit: boolean, angle = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#6b5a4e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 6);
  ctx.stroke();
  const cy = 6 + LANTERN_R;
  ctx.fillStyle = lit ? '#fff3c4' : color;
  ctx.beginPath();
  ctx.ellipse(0, cy, LANTERN_R, LANTERN_R * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  if (lit) {
    // Lit, the paper shows its colour round a bright middle.
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, cy, LANTERN_R - 2.5, LANTERN_R * 1.05 - 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1.5;
  for (const k of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(0, cy, LANTERN_R * Math.abs(k) + 0.1, LANTERN_R * 1.05, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#6b5a4e';
  ctx.fillRect(-6, 4, 12, 4);
  ctx.fillRect(-6, cy + LANTERN_R - 2, 12, 4);
  ctx.restore();
}

/** The glow round a lit lantern, drawn over the darkened landscape at night. */
export function drawLanternGlow(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, night: number, angle = 0): void {
  if (night <= 0) return;
  const cx = x - Math.sin(angle) * (6 + LANTERN_R);
  const cy = y + Math.cos(angle) * (6 + LANTERN_R);
  const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60);
  glow.addColorStop(0, `rgba(255, 236, 170, ${0.55 * night})`);
  glow.addColorStop(1, 'rgba(255, 236, 170, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = night;
  drawLantern(ctx, x, y, color, true, angle);
  ctx.restore();
}
