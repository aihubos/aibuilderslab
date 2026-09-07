/* Offline brand-film renderer. No canvas or render dependency is shipped to browsers.
   Run: NODE_PATH=<installed node_modules> node scripts/render-brand-motion.cjs
   Preview: append --preview. Reuses the exact logo and Wanted Sans from this site. */
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { writeFile, mkdir, rename } = require('node:fs/promises');
const { join } = require('node:path');
const assert = require('node:assert/strict');

const root = join(__dirname, '..');
const W = 1920, H = 1080, FPS = 30, DURATION = 12;
const ink = '#101121', blue = '#2458F5', paper = '#F5F5F1';
assert(GlobalFonts.registerFromPath(join(root, 'assets/fonts/WantedSansVariable.woff2'), 'Wanted Sans'));
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
const outlineCache = new Map();
const clamp = (n) => Math.min(1, Math.max(0, n));
const ease = (n) => 1 - (1 - clamp(n)) ** 4;

function text(value, x, y, size, color, weight = 700) {
  ctx.font = `${weight} ${size}px "Wanted Sans"`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function repeated(word, y, t, color, direction = 1) {
  // Outline the filled silhouette, not each overlapping contour in a variable font.
  const key = `${word}:${color}`;
  if (!outlineCache.has(key)) {
    ctx.font = '700 218px "Wanted Sans"';
    const width = Math.ceil(ctx.measureText(word).width) + 16;
    const glyph = createCanvas(width, 340);
    const g = glyph.getContext('2d');
    g.font = '700 218px "Wanted Sans"'; g.textBaseline = 'middle'; g.fillStyle = color;
    g.fillText(word, 8, 170);
    const outline = createCanvas(width, 340);
    const o = outline.getContext('2d');
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) o.drawImage(glyph, Math.cos(angle) * 1.5, Math.sin(angle) * 1.5);
    o.globalCompositeOperation = 'destination-out'; o.drawImage(glyph, 0, 0);
    outlineCache.set(key, outline);
  }
  const outline = outlineCache.get(key);
  ctx.save();
  ctx.globalAlpha = 0.23;
  const step = outline.width + 64;
  const offset = ((t * 85 * direction) % step + step) % step;
  for (let x = -step + offset; x < W + step; x += step) ctx.drawImage(outline, x, y - 170);
  ctx.restore();
}

function cornerLabels(label, color, number) {
  text('AI BUILDERS LAB', 84, 72, 25, color, 600);
  ctx.textAlign = 'right';
  text('LEARN. SHARE. GROW.', W - 84, 72, 22, color, 500);
  text(number, W - 84, H - 72, 22, color, 500);
  ctx.textAlign = 'left';
  text(label, 84, H - 72, 22, color, 500);
}

function drawScene(scene, t, logo) {
  const backgrounds = [paper, blue, paper, ink];
  const foregrounds = [ink, '#FFFFFF', ink, '#FFFFFF'];
  const fg = foregrounds[scene];
  ctx.fillStyle = backgrounds[scene];
  ctx.fillRect(0, 0, W, H);
  if (scene === 0) {
    const loopTime = t < 2.25 ? t : t - DURATION;
    repeated('BUILDERS', 235, loopTime, blue);
    repeated('BUILDERS', 866, loopTime, blue, -1);
    ctx.fillStyle = blue;
    ctx.beginPath();
    ctx.moveTo(W - 280, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 280); ctx.closePath(); ctx.fill();
    const pulse = 1 + 0.016 * Math.sin(t * Math.PI / 6);
    ctx.save();
    ctx.translate(W / 2, 532);
    ctx.scale(pulse, pulse);
    ctx.drawImage(logo, -730, -244, 1460, 487);
    ctx.restore();
    ctx.textAlign = 'center';
    text('AI로 만드는 사람들의 시작.', W / 2, 780, 39, ink, 600);
    ctx.textAlign = 'left';
    cornerLabels('IDEAS INTO REALITY.', ink, 'BUILD YOUR NEXT.');
    return;
  }
  const words = ['', '배우고', '나누고', '성장한다'];
  const english = ['', 'LEARN', 'SHARE', 'GROW'];
  const captions = ['', '질문을 넘어, 직접 만들어보는 경험.', '작은 발견이, 다음 사람의 시작이 되도록.', 'AI를 쓰는 사람에서, AI로 만드는 사람으로.'];
  const word = words[scene];
  repeated(english[scene], 238, t, fg);
  repeated(english[scene], 885, t, fg, -1);
  ctx.fillStyle = scene === 1 ? ink : blue;
  const edge = 365 + Math.sin(t * 0.85) * 55;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(edge, 0); ctx.lineTo(0, edge); ctx.closePath(); ctx.fill();
  const start = [0, 2.25, 4.75, 7.25][scene];
  const arrival = ease((t - start) / 0.85);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.translate(W / 2, H / 2 + (1 - arrival) * 105);
  ctx.scale(0.94 + arrival * 0.06, 0.94 + arrival * 0.06);
  text(word, -6, 0, scene === 3 ? 288 : 318, fg);
  ctx.restore();
  ctx.textAlign = 'center';
  text(captions[scene], W / 2, 726, 32, fg, 500);
  ctx.textAlign = 'left';
  cornerLabels(`${english[scene]} WITH AI.`, fg, `0${scene} / 03`);
}

const transitions = [
  { at: 2.25, from: 0, to: 1 },
  { at: 4.75, from: 1, to: 2 },
  { at: 7.25, from: 2, to: 3 },
  { at: 9.75, from: 3, to: 0 },
];

function render(t, logo) {
  const latest = transitions.filter((item) => t >= item.at).at(-1);
  if (!latest) return drawScene(0, t, logo);
  const progress = clamp((t - latest.at) / 0.72);
  if (progress === 1) return drawScene(latest.to, t, logo);
  drawScene(latest.from, t, logo);
  // A diagonal shutter reveals the next scene without a flash or a hard cut.
  const edge = -H + (W + H * 2) * ease(progress);
  ctx.save(); ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(edge, 0); ctx.lineTo(edge - H, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.clip(); drawScene(latest.to, t, logo); ctx.restore();
}

async function main() {
  assert.equal(FPS * DURATION, 360);
  assert(transitions.every((item, i) => !i || item.at > transitions[i - 1].at + 0.72));
  const logo = await loadImage(join(root, 'assets/ai-builders-lab-logo-transparent.png'));
  const previewDir = join(root, '.preview');
  await mkdir(previewDir, { recursive: true });
  for (const t of [0, 3.8, 6.3, 8.8]) {
    render(t, logo);
    await writeFile(join(previewDir, `brand-${t}.jpg`), await canvas.encode('jpeg', 88));
  }
  render(0, logo);
  await writeFile(join(root, 'assets/builderslab-brand-motion-poster.jpg'), await canvas.encode('jpeg', 88));
  if (process.argv.includes('--preview')) return console.log('4 brand-film preview frames rendered.');
  const output = join(root, 'assets/builderslab-brand-motion.mp4');
  const pendingOutput = join(previewDir, 'builderslab-brand-motion.mp4');
  const ffmpeg = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', `${W}x${H}`, '-framerate', String(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', pendingOutput], { stdio: ['pipe', 'inherit', 'inherit'] });
  const completed = once(ffmpeg, 'close');
  ffmpeg.stdin.on('error', () => {});
  for (let frame = 0; frame < FPS * DURATION; frame++) {
    render(frame / FPS, logo);
    const pixels = ctx.getImageData(0, 0, W, H).data;
    if (!ffmpeg.stdin.write(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength))) {
      await Promise.race([once(ffmpeg.stdin, 'drain'), completed.then(() => { throw new Error('Encoder exited before all frames were written'); })]);
    }
    if (frame % 90 === 0) console.log(`Rendering ${frame}/${FPS * DURATION}`);
  }
  ffmpeg.stdin.end();
  const [code] = await completed;
  assert.equal(code, 0, 'MP4 encoding failed');
  await rename(pendingOutput, output);
  console.log(`Rendered ${output}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
