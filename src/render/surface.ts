/* Hand-placed surface set dressing: bunker entrance, canyon road, plateau landmarks. World units, y = ground. */
import { box, fillRR, glow, hazard, hgrad, mix, rgba, rgrad, shade, vgrad, type Ctx } from './gfx';

/** Colour helper for daylight: blends toward a night tint. */
export function litFn(light: number) {
  const night = '#141620';
  return (c: string, k = 0.88) => mix(c, night, (1 - light) * k);
}

type Lit = ReturnType<typeof litFn>;

// ------------------------------------------------------------------ bunker entrance (canyon side)
export function bunkerPortal(ctx: Ctx, lit: Lit, doorTop: number, groundY: number, light: number, t: number, lang: string) {
  // massive angled concrete buttresses around the door opening in the cliff
  const top = doorTop - 26;
  ctx.fillStyle = vgrad(ctx, top, groundY, [
    [0, lit('#a4a6a8')],
    [1, lit('#6a6c70')],
  ]);
  ctx.beginPath();
  ctx.moveTo(-70, groundY);
  ctx.lineTo(-58, top + 8);
  ctx.lineTo(-6, top);
  ctx.lineTo(-2, top + 12);
  ctx.lineTo(-2, groundY);
  ctx.closePath();
  ctx.fill();
  // inner recess shadow
  ctx.fillStyle = rgba('#000', 0.35);
  ctx.beginPath();
  ctx.moveTo(-48, groundY);
  ctx.lineTo(-44, top + 22);
  ctx.lineTo(-2, top + 18);
  ctx.lineTo(-2, groundY);
  ctx.fill();
  // concrete panel seams
  ctx.strokeStyle = rgba('#000', 0.25);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    const y = top + ((groundY - top) * i) / 4;
    ctx.moveTo(-68 + i * 2, y);
    ctx.lineTo(-48, y);
  }
  ctx.moveTo(-58, top + 8);
  ctx.lineTo(-48, groundY);
  ctx.stroke();
  // steel lintel with hazard stripes
  box(ctx, -60, top - 2, 60, 10, lit('#4a5058'), 1.2);
  hazard(ctx, -58, top + 1, 56, 4, lit('#f2b632'), lit('#26282b'), 4);
  // stencil plate above
  const label = lang === 'ru' ? 'УБЕЖИЩЕ' : 'SHELTER';
  box(ctx, -58, top - 20, 52, 16, lit('#2f6fb8'), 2);
  ctx.font = '800 6.4px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = lit('#f2c230');
  ctx.fillText(label, -32, top - 12);
  // floodlights on arms
  for (const [fx, dir] of [
    [-62, -1],
    [-6, 1],
  ] as const) {
    ctx.strokeStyle = lit('#3a3f45');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(fx, top + 4);
    ctx.lineTo(fx + dir * 8, top - 6);
    ctx.stroke();
    fillRR(ctx, fx + dir * 8 - 4, top - 10, 8, 5, 1.2, lit('#2a2d31'));
    if (light < 0.7) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const k = (0.7 - light) / 0.7;
      const g = ctx.createLinearGradient(fx + dir * 8, top - 6, fx + dir * 8 - 30 * dir, groundY);
      g.addColorStop(0, rgba('#fff0c8', 0.35 * k));
      g.addColorStop(1, rgba('#fff0c8', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(fx + dir * 8 - 3, top - 6);
      ctx.lineTo(fx + dir * 8 + 3, top - 6);
      ctx.lineTo(fx + dir * 8 - 20 * dir + 24, groundY);
      ctx.lineTo(fx + dir * 8 - 20 * dir - 24, groundY);
      ctx.fill();
      glow(ctx, fx + dir * 8, top - 7, 16, '#fff0c8', 0.6 * k);
      ctx.restore();
    }
  }
  // blinking beacon
  const blink = Math.sin(t * 4.5) > 0;
  ctx.fillStyle = blink ? '#ffb02e' : '#6a4a10';
  ctx.beginPath();
  ctx.arc(-4, top - 22, 3, Math.PI, 0);
  ctx.fill();
  if (blink) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, -4, top - 23, 34, '#ffb02e', light < 0.7 ? 0.45 : 0.2);
    ctx.restore();
  }
}

export function apron(ctx: Ctx, lit: Lit, x0: number, x1: number, y: number, light: number, lang: string) {
  // concrete slab with painted guide line
  fillRR(ctx, x0, y - 3, x1 - x0, 7, 1.5, vgrad(ctx, y - 3, y + 4, [
    [0, lit('#b5b1a6')],
    [1, lit('#6a6760')],
  ]));
  ctx.fillStyle = rgba(lit('#f2b632'), 0.8);
  for (let x = x0 + 4; x < x1 - 8; x += 16) ctx.fillRect(x, y - 2.6, 8, 1.1);
  ctx.fillStyle = rgba('#000', 0.18);
  for (let x = x0 + 30; x < x1; x += 30) ctx.fillRect(x, y - 3, 0.7, 7);
  // doormat gag
  fillRR(ctx, x1 - 30, y - 3.6, 22, 2.4, 0.6, lit('#8a5a36'));
  ctx.font = '700 2px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = lit('#f4e0b0');
  ctx.fillText(lang === 'ru' ? 'ВЫТИРАЙТЕ НОГИ' : 'WIPE YOUR FEET', x1 - 19, y - 2);
  void light;
}

export function lampPost(ctx: Ctx, lit: Lit, x: number, y: number, light: number, t: number) {
  ctx.fillStyle = lit('#3a3d44');
  ctx.fillRect(x - 1, y - 52, 2, 52);
  fillRR(ctx, x - 3.5, y - 2, 7, 2, 0.6, lit('#2a2d31'));
  ctx.strokeStyle = lit('#3a3d44');
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y - 52);
  ctx.quadraticCurveTo(x, y - 58, x + 7, y - 58);
  ctx.stroke();
  fillRR(ctx, x + 4, y - 60, 8, 4, 1.6, lit('#2a2d31'));
  const on = light < 0.65;
  ctx.fillStyle = on ? '#fff0c8' : lit('#8a8470');
  ctx.fillRect(x + 5, y - 56.4, 6, 1);
  if (on) {
    const flicker = Math.sin(t * 17 + x) > 0.97 ? 0.4 : 1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const k = ((0.65 - light) / 0.65) * flicker;
    const g = ctx.createLinearGradient(0, y - 56, 0, y);
    g.addColorStop(0, rgba('#ffe2a8', 0.3 * k));
    g.addColorStop(1, rgba('#ffe2a8', 0.02));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + 5, y - 56);
    ctx.lineTo(x + 11, y - 56);
    ctx.lineTo(x + 30, y);
    ctx.lineTo(x - 14, y);
    ctx.fill();
    glow(ctx, x + 8, y - 55, 20, '#ffe2a8', 0.6 * k);
    ctx.restore();
  }
}

export function mailbox(ctx: Ctx, lit: Lit, x: number, y: number, lang: string, t: number) {
  ctx.fillStyle = lit('#5a4a3a');
  ctx.fillRect(x - 0.8, y - 16, 1.6, 16);
  fillRR(ctx, x - 6, y - 24, 12, 8, [4, 4, 0.6, 0.6], lit('#2f6fb8'));
  ctx.fillStyle = lit('#f4efe0');
  ctx.font = '700 2.4px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(lang === 'ru' ? 'ПОЧТА' : 'MAIL', x, y - 18.6);
  // flag pops up now and then (gag: it's always junk mail)
  const up = Math.sin(t * 0.3) > 0.6;
  ctx.fillStyle = lit('#d6453c');
  if (up) ctx.fillRect(x + 6, y - 30, 1, 8);
  ctx.fillRect(x + 6, up ? y - 30 : y - 22, 4, 2.4);
}

export function welcomeSign(ctx: Ctx, lit: Lit, x: number, y: number, light: number, t: number, lang: string) {
  for (const px of [x - 36, x + 34]) {
    ctx.fillStyle = lit('#4a3a2a');
    ctx.fillRect(px, y - 46, 2.4, 46);
  }
  // retro sign board with a bulb border
  fillRR(ctx, x - 44, y - 74, 88, 32, 4, vgrad(ctx, y - 74, y - 42, [
    [0, lit('#f4e3b8')],
    [1, lit('#d9c08a')],
  ]));
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = lit('#c7433b');
  ctx.strokeRect(x - 42, y - 72, 84, 28);
  const on = light < 0.75;
  for (let i = 0; i < 22; i++) {
    const a = i / 22;
    const per = 2 * (84 + 28);
    let d = a * per;
    let bx;
    let by;
    if (d < 84) {
      bx = x - 42 + d;
      by = y - 72;
    } else if ((d -= 84) < 28) {
      bx = x + 42;
      by = y - 72 + d;
    } else if ((d -= 28) < 84) {
      bx = x + 42 - d;
      by = y - 44;
    } else {
      d -= 84;
      bx = x - 42;
      by = y - 44 - d;
    }
    const lit2 = on && (Math.floor(t * 4) + i) % 3 !== 0;
    ctx.fillStyle = lit2 ? '#fff4c8' : lit('#9a8a60');
    ctx.beginPath();
    ctx.arc(bx, by, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  if (on) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y - 58, 60, '#ffe2a8', 0.14 * (0.75 - light));
    ctx.restore();
  }
  ctx.font = '800 7px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = lit('#c7433b');
  ctx.fillText(lang === 'ru' ? 'ДОБРО ПОЖАЛОВАТЬ!' : 'WELCOME!', x, y - 64);
  ctx.font = '600 4.6px Oswald, sans-serif';
  ctx.fillStyle = lit('#2a1a0a');
  ctx.fillText(lang === 'ru' ? 'Убежище → 300 м   ·   Мутантам вход воспрещён' : 'Shelter → 300 m   ·   No mutants allowed', x, y - 52);
}

export function roadSign(ctx: Ctx, lit: Lit, x: number, y: number, lang: string) {
  ctx.fillStyle = lit('#8a939a');
  ctx.fillRect(x - 0.8, y - 34, 1.6, 34);
  ctx.beginPath();
  ctx.arc(x, y - 40, 7, 0, Math.PI * 2);
  ctx.fillStyle = lit('#f4f4f0');
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = lit('#d6453c');
  ctx.stroke();
  ctx.font = '800 5px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = lit('#1a1a1a');
  ctx.fillText('5', x, y - 40);
  // bent bullet-holed plate below
  ctx.save();
  ctx.translate(x, y - 26);
  ctx.rotate(0.12);
  fillRR(ctx, -9, -3, 18, 6, 0.8, lit('#f2c230'));
  ctx.font = '700 2.6px Oswald, sans-serif';
  ctx.fillStyle = lit('#1a1a1a');
  ctx.fillText(lang === 'ru' ? 'ОСТОРОЖНО, КРОТЫ' : 'MOLES CROSSING', 0, 0.2);
  ctx.fillStyle = rgba('#000', 0.6);
  ctx.beginPath();
  ctx.arc(5, -1.4, 0.6, 0, Math.PI * 2);
  ctx.arc(-6, 1.6, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function gasStation(ctx: Ctx, lit: Lit, x: number, y: number, lang: string, t: number) {
  // canopy on two pillars
  for (const px of [x + 10, x + 96]) {
    ctx.fillStyle = lit('#c9c3b3');
    ctx.fillRect(px, y - 54, 5, 54);
  }
  ctx.save();
  ctx.translate(x + 60, y - 58);
  ctx.rotate(-0.04);
  fillRR(ctx, -62, -8, 124, 10, 1.4, lit('#e8e2d4'));
  ctx.fillStyle = lit('#c7433b');
  ctx.fillRect(-62, -2, 124, 3);
  // broken corner hanging
  ctx.restore();
  ctx.fillStyle = lit('#9a948a');
  ctx.beginPath();
  ctx.moveTo(x + 116, y - 62);
  ctx.lineTo(x + 124, y - 50);
  ctx.lineTo(x + 120, y - 48);
  ctx.lineTo(x + 112, y - 58);
  ctx.fill();
  // pumps
  for (const px of [x + 34, x + 64]) {
    fillRR(ctx, px, y - 26, 14, 26, 2, lit('#d6453c'));
    fillRR(ctx, px + 2, y - 22, 10, 7, 1, lit('#f4f1e8'));
    ctx.fillStyle = lit('#1a1a1a');
    ctx.fillRect(px + 3, y - 20, 8, 1);
    ctx.fillRect(px + 3, y - 18, 5, 1);
    ctx.strokeStyle = lit('#1a1a1a');
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(px + 14, y - 14);
    ctx.quadraticCurveTo(px + 22, y - 6, px + 18, y - 22);
    ctx.stroke();
  }
  // tall price sign with rotating joke
  ctx.fillStyle = lit('#4a4f55');
  ctx.fillRect(x + 128, y - 90, 3, 90);
  fillRR(ctx, x + 112, y - 108, 36, 24, 2, lit('#f4e3b8'));
  ctx.font = '800 5.2px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = lit('#c7433b');
  ctx.fillText(lang === 'ru' ? 'БЕНЗИН' : 'GAS', x + 130, y - 101);
  ctx.font = '700 4px Oswald, sans-serif';
  ctx.fillStyle = lit('#1a1a1a');
  const jokes = lang === 'ru' ? ['НЕТ', 'НЕ БУДЕТ', '∞ ₽/Л'] : ['NONE', 'NEVER', '∞ $/GAL'];
  ctx.fillText(jokes[Math.floor(t / 3) % 3], x + 130, y - 92);
  // little shop ruin
  fillRR(ctx, x - 40, y - 36, 44, 36, 1.4, lit('#c9b48a'));
  ctx.fillStyle = lit('#2a2622');
  ctx.fillRect(x - 34, y - 26, 12, 10);
  ctx.fillRect(x - 16, y - 24, 10, 24);
  ctx.fillStyle = lit('#8a7a60');
  ctx.beginPath();
  ctx.moveTo(x - 42, y - 36);
  ctx.lineTo(x + 6, y - 36);
  ctx.lineTo(x - 2, y - 44);
  ctx.lineTo(x - 30, y - 42);
  ctx.fill();
}

export function tirePile(ctx: Ctx, lit: Lit, x: number, y: number) {
  const pos = [
    [0, 0],
    [9, 0],
    [18, 0],
    [4.5, -6],
    [13.5, -6],
    [9, -12],
  ];
  for (const [dx, dy] of pos) {
    ctx.beginPath();
    ctx.ellipse(x + dx, y - 3 + dy, 5, 3.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = lit('#1e1c1a');
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + dx, y - 3 + dy, 2.2, 1.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = lit('#4a4038');
    ctx.fill();
  }
}

export function busWreck(ctx: Ctx, lit: Lit, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.05);
  fillRR(ctx, 0, -30, 110, 26, 5, vgrad(ctx, -30, -4, [
    [0, lit('#e0b040')],
    [1, lit('#8a6a20')],
  ]));
  ctx.fillStyle = lit('#1e2226');
  for (let i = 0; i < 6; i++) fillRR(ctx, 8 + i * 16, -26, 12, 9, 1, lit(i === 3 ? '#3a4a52' : '#1e2226'));
  ctx.fillStyle = lit('#2a2622');
  ctx.fillRect(0, -12, 110, 2);
  for (const wx of [20, 88]) {
    ctx.beginPath();
    ctx.arc(wx, -4, 6, 0, Math.PI * 2);
    ctx.fillStyle = lit('#141210');
    ctx.fill();
  }
  // rust holes
  ctx.fillStyle = rgba(lit('#6a3a1a'), 0.8);
  ctx.beginPath();
  ctx.ellipse(60, -8, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '700 4px Oswald, sans-serif';
  ctx.fillStyle = lit('#2a1a0a');
  ctx.textAlign = 'left';
  ctx.fillText('№ 13', 90, -14);
  ctx.restore();
}

// ------------------------------------------------------------------ plateau landmarks
export function ventStack(ctx: Ctx, lit: Lit, x: number, y: number, h: number, t: number) {
  ctx.fillStyle = hgrad(ctx, x - 5, x + 5, [
    [0, lit('#4a5058')],
    [0.4, lit('#9aa3aa')],
    [1, lit('#3a3f45')],
  ]);
  ctx.fillRect(x - 5, y - h, 10, h);
  fillRR(ctx, x - 8, y - h - 5, 16, 6, 2, lit('#5a646e'));
  ctx.fillStyle = lit('#2a2d31');
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 7, y - h - 3.6 + i * 1.6, 14, 0.6);
  hazard(ctx, x - 5, y - 8, 10, 3, lit('#f2b632'), lit('#26282b'), 3);
  // steam from the vault below
  for (let i = 0; i < 5; i++) {
    const ph = (t * 0.25 + i / 5 + x * 0.001) % 1;
    ctx.beginPath();
    ctx.arc(x + Math.sin(ph * 5 + i) * 4 + ph * 16, y - h - 8 - ph * 50, 4 + ph * 12, 0, Math.PI * 2);
    ctx.fillStyle = rgba('#f4f4f0', 0.22 * (1 - ph));
    ctx.fill();
  }
}

export function periscope(ctx: Ctx, lit: Lit, x: number, y: number, t: number) {
  // gag: someone in the vault keeps an eye on the surface
  const rise = Math.max(0, Math.sin(t * 0.35)) * 12;
  const look = Math.sin(t * 0.9) > 0 ? 1 : -1;
  ctx.fillStyle = lit('#5a646e');
  ctx.fillRect(x - 1.6, y - 8 - rise, 3.2, 8 + rise);
  ctx.save();
  ctx.translate(x, y - 10 - rise);
  ctx.scale(look, 1);
  fillRR(ctx, -2, -3, 7, 4, 1, lit('#6a747c'));
  ctx.fillStyle = lit('#8fd8ff');
  ctx.fillRect(4.4, -2.4, 0.8, 2.6);
  ctx.restore();
  // mound
  ctx.beginPath();
  ctx.ellipse(x, y, 8, 3, 0, Math.PI, 0);
  ctx.fillStyle = lit('#8a6a45');
  ctx.fill();
}

export function waterTower(ctx: Ctx, lit: Lit, x: number, y: number, lang: string) {
  ctx.strokeStyle = lit('#4a4f55');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x - 12, y - 70);
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + 12, y - 70);
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x - 4, y - 70);
  ctx.moveTo(x + 6, y);
  ctx.lineTo(x + 4, y - 70);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const yy = y - 18 - i * 18;
    ctx.moveTo(x - 18 + i * 2, yy);
    ctx.lineTo(x + 18 - i * 2, yy - 16);
    ctx.moveTo(x + 18 - i * 2, yy);
    ctx.lineTo(x - 18 + i * 2, yy - 16);
  }
  ctx.stroke();
  // tank
  fillRR(ctx, x - 24, y - 110, 48, 40, 10, hgrad(ctx, x - 24, x + 24, [
    [0, lit('#6a747c')],
    [0.35, lit('#c9d2d9')],
    [1, lit('#4a5058')],
  ]));
  ctx.beginPath();
  ctx.moveTo(x - 26, y - 108);
  ctx.quadraticCurveTo(x, y - 130, x + 26, y - 108);
  ctx.fillStyle = lit('#8a939a');
  ctx.fill();
  ctx.font = '800 7px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = lit('#2f6fb8');
  ctx.fillText(lang === 'ru' ? 'ВОДА' : 'WATER', x, y - 92);
  ctx.fillStyle = rgba(lit('#6a3a1a'), 0.5);
  ctx.fillRect(x + 8, y - 86, 3, 14);
}

export function ruinedHouse(ctx: Ctx, lit: Lit, x: number, y: number) {
  const wall = lit('#b8a78a');
  // walls with a broken top edge
  ctx.fillStyle = vgrad(ctx, y - 60, y, [
    [0, wall],
    [1, shade(wall, -0.25)],
  ]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 50);
  ctx.lineTo(x + 20, y - 62);
  ctx.lineTo(x + 34, y - 54);
  ctx.lineTo(x + 40, y - 58);
  ctx.lineTo(x + 52, y - 44);
  ctx.lineTo(x + 70, y - 46);
  ctx.lineTo(x + 76, y - 30);
  ctx.lineTo(x + 90, y - 34);
  ctx.lineTo(x + 90, y);
  ctx.closePath();
  ctx.fill();
  // roof remains
  ctx.strokeStyle = lit('#5a3a2a');
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 50);
  ctx.lineTo(x + 26, y - 72);
  ctx.lineTo(x + 40, y - 62);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 2 + i * 6, y - 52 - i * 4);
    ctx.lineTo(x + 8 + i * 6, y - 48 - i * 4);
    ctx.stroke();
  }
  // windows & door
  ctx.fillStyle = lit('#1e1c1a');
  ctx.fillRect(x + 10, y - 38, 14, 12);
  ctx.fillRect(x + 56, y - 30, 12, 10);
  ctx.fillRect(x + 34, y - 26, 12, 26);
  ctx.strokeStyle = lit('#7a5a3a');
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 10, y - 38, 14, 12);
  ctx.beginPath();
  ctx.moveTo(x + 17, y - 38);
  ctx.lineTo(x + 17, y - 26);
  ctx.moveTo(x + 10, y - 32);
  ctx.lineTo(x + 24, y - 32);
  ctx.stroke();
  // white picket fence remains
  ctx.fillStyle = lit('#e8e2d4');
  for (let i = 0; i < 9; i++) {
    if (i === 4 || i === 6) continue;
    const px = x + 96 + i * 5;
    const h = 10 - (i % 3) * 2;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y - h);
    ctx.lineTo(px + 1.2, y - h - 1.6);
    ctx.lineTo(px + 2.4, y - h);
    ctx.lineTo(px + 2.4, y);
    ctx.fill();
  }
  ctx.fillRect(x + 96, y - 6, 42, 1.2);
  // pink flamingo gag
  ctx.strokeStyle = lit('#ff8ab0');
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 150, y);
  ctx.lineTo(x + 150, y - 8);
  ctx.stroke();
  ctx.fillStyle = lit('#ff8ab0');
  ctx.beginPath();
  ctx.ellipse(x + 151, y - 10, 3.4, 2.2, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 153, y - 11);
  ctx.quadraticCurveTo(x + 157, y - 16, x + 154, y - 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 154, y - 18.6, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

export function powerPoles(ctx: Ctx, lit: Lit, x0: number, x1: number, y: number, step: number) {
  const tops: [number, number][] = [];
  for (let x = x0, i = 0; x <= x1; x += step, i++) {
    const lean = ((i * 37) % 7 - 3) * 0.02;
    const top = y - 62;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.fillStyle = lit('#5a3e2a');
    ctx.fillRect(-1.6, -62, 3.2, 62);
    ctx.fillRect(-12, -56, 24, 2.4);
    for (const dx of [-10, 0, 10]) {
      ctx.fillStyle = lit('#9ad0e0');
      ctx.fillRect(dx - 0.8, -58.4, 1.6, 2.4);
    }
    ctx.restore();
    tops.push([x + Math.sin(lean) * -62, top + 4]);
  }
  ctx.strokeStyle = lit('#1a1614');
  ctx.lineWidth = 0.6;
  for (let k = -1; k <= 1; k++) {
    ctx.beginPath();
    for (let i = 0; i < tops.length - 1; i++) {
      const [ax, ay] = tops[i];
      const [bx, by] = tops[i + 1];
      if (i === 2 && k === 1) continue; // a snapped wire
      ctx.moveTo(ax + k * 10, ay);
      ctx.quadraticCurveTo((ax + bx) / 2 + k * 10, ay + 14, bx + k * 10, by);
    }
    ctx.stroke();
  }
  // the snapped wire dangling
  if (tops.length > 3) {
    const [ax, ay] = tops[2];
    ctx.beginPath();
    ctx.moveTo(ax + 10, ay);
    ctx.quadraticCurveTo(ax + 20, ay + 30, ax + 14, y - 4);
    ctx.stroke();
  }
}

export function satelliteDish(ctx: Ctx, lit: Lit, x: number, y: number, t: number) {
  ctx.fillStyle = lit('#4a4f55');
  ctx.fillRect(x - 2, y - 24, 4, 24);
  fillRR(ctx, x - 8, y - 4, 16, 4, 1, lit('#3a3f45'));
  ctx.save();
  ctx.translate(x, y - 28);
  ctx.rotate(-0.6 + Math.sin(t * 0.1) * 0.15);
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 7, 0, 0, Math.PI);
  ctx.fillStyle = hgrad(ctx, -20, 20, [
    [0, lit('#8a939a')],
    [0.5, lit('#e8eef0')],
    [1, lit('#6a747c')],
  ]);
  ctx.fill();
  ctx.strokeStyle = lit('#3a3f45');
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-14, 3);
  ctx.lineTo(0, -12);
  ctx.lineTo(14, 3);
  ctx.stroke();
  ctx.fillStyle = Math.sin(t * 3) > 0 ? '#ff4a3a' : lit('#5a1a14');
  ctx.beginPath();
  ctx.arc(0, -12, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function rocketDiner(ctx: Ctx, lit: Lit, x: number, y: number, light: number, lang: string) {
  // roadside rocket sign of an abandoned diner — a retro landmark
  ctx.fillStyle = lit('#4a4f55');
  ctx.fillRect(x - 1.5, y - 40, 3, 40);
  ctx.save();
  ctx.translate(x, y - 76);
  ctx.fillStyle = hgrad(ctx, -9, 9, [
    [0, lit('#8a939a')],
    [0.45, lit('#f4f6f8')],
    [1, lit('#6a747c')],
  ]);
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.quadraticCurveTo(10, -20, 9, 20);
  ctx.lineTo(-9, 20);
  ctx.quadraticCurveTo(-10, -20, 0, -38);
  ctx.fill();
  ctx.fillStyle = lit('#c7433b');
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 9, 6);
    ctx.lineTo(s * 18, 26);
    ctx.lineTo(s * 9, 20);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-3, -30);
  ctx.quadraticCurveTo(0, -40, 3, -30);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -8, 4, 0, Math.PI * 2);
  ctx.fillStyle = lit('#5fb8e8');
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = lit('#3a3f45');
  ctx.stroke();
  ctx.restore();
  fillRR(ctx, x - 24, y - 50, 48, 12, 2, lit('#2a2230'));
  ctx.font = '800 5px Unbounded, Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const on = light < 0.7;
  ctx.fillStyle = on ? '#ff6ad0' : lit('#8a3a70');
  ctx.fillText(lang === 'ru' ? 'КАФЕ «ОРБИТА»' : 'ORBIT DINER', x, y - 44);
  if (on) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y - 44, 30, '#ff6ad0', 0.3 * (0.7 - light));
    ctx.restore();
  }
}

export function skull(ctx: Ctx, lit: Lit, x: number, y: number, s = 1) {
  ctx.fillStyle = lit('#e8dcc0');
  ctx.beginPath();
  ctx.ellipse(x, y - 3 * s, 3.4 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 1.8 * s, y - 1 * s, 3.6 * s, 1.6 * s);
  ctx.fillStyle = lit('#2a2622');
  ctx.beginPath();
  ctx.arc(x - 1.2 * s, y - 3.2 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.arc(x + 1.2 * s, y - 3.2 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.fill();
}

export function sandbags(ctx: Ctx, lit: Lit, x: number, y: number, n: number) {
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < n - r; i++) {
      const sx = x + i * 11 + r * 5.5;
      const sy = y - 4 - r * 5;
      ctx.beginPath();
      ctx.ellipse(sx + 5.5, sy + 2, 6, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgrad(ctx, sx + 4, sy, 0, 8, [
        [0, lit('#d9c29a')],
        [1, lit('#8a7650')],
      ]);
      ctx.fill();
    }
  }
}
