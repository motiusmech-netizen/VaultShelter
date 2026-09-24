import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { iconSvg } from './icons';
import { audio } from '../audio/audio';
import { drawCharacter, DEFAULT_POSE, drawWeapon } from '../render/dwellerArt';
import type { Dweller, Item } from '../sim/types';
import { app } from '../app';
import { outfitOf } from '../render/actors';
import { OUTFIT_BY_ID, PET_BY_ID, WEAPON_BY_ID, JUNK_BY_ID, RARITY_COLORS } from '../data/items';
import { drawPet } from '../render/creatures';
import { STATS } from '../data/stats';
import { L, t } from '../i18n';
import { statTotal } from '../sim/dwellers';
import { store } from './store';
import { makeCanvas } from '../render/gfx';
import { paintRoomStatic } from '../render/roomArt';
import type { RoomType } from '../data/rooms';
import { ROOMS } from '../data/rooms';
import { CELL_W, FLOOR_H } from '../render/world';

const uriCache = new Map<string, string>();
function iconUri(name: string) {
  let u = uriCache.get(name);
  if (!u) {
    u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(iconSvg(name));
    uriCache.set(name, u);
  }
  return u;
}

export function Icon({ n, cls = '', style }: { n: string; cls?: string; style?: JSX.CSSProperties }) {
  const svg = iconSvg(n);
  if (svg.includes('currentColor')) return <span class={'ic ic-inline ' + cls} style={style} dangerouslySetInnerHTML={{ __html: svg }} />;
  return <img class={'ic ' + cls} src={iconUri(n)} style={style} draggable={false} alt="" />;
}

export function Btn(props: {
  children?: ComponentChildren;
  onClick?: () => void;
  kind?: 'amber' | 'steel' | 'green' | 'red' | 'ad' | 'ghost';
  size?: 'small' | 'big';
  wide?: boolean;
  disabled?: boolean;
  icon?: string;
  ad?: boolean;
  cls?: string;
  sound?: boolean;
}) {
  const k = props.ad ? 'ad' : props.kind && props.kind !== 'amber' ? props.kind : '';
  return (
    <button
      class={`btn ${k} ${props.size ?? ''} ${props.wide ? 'wide' : ''} ${props.disabled ? 'disabled' : ''} ${props.cls ?? ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (props.disabled) {
          audio.play('error');
          return;
        }
        if (props.sound !== false) audio.play('click');
        props.onClick?.();
      }}
    >
      {props.ad && <Icon n="video" />}
      {props.icon && !props.ad && <Icon n={props.icon} />}
      {props.children}
      {props.ad && <span class="ad-tag">{t('ad_label')}</span>}
    </button>
  );
}

export function IconBtn({ n, onClick, title }: { n: string; onClick: () => void; title?: string }) {
  return (
    <button
      class="iconbtn"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        audio.play('click');
        onClick();
      }}
    >
      <Icon n={n} />
    </button>
  );
}

export function Bar({ k, color, thick, text }: { k: number; color: string; thick?: boolean; text?: string }) {
  return (
    <div class={'bar' + (thick ? ' thick' : '')}>
      <i style={{ width: `${Math.max(0, Math.min(1, k)) * 100}%`, background: color }} />
      {text && <span class="bar-txt">{text}</span>}
    </div>
  );
}

export function Sheet(props: { title: ComponentChildren; sub?: ComponentChildren; accent?: string; icon?: string; children: ComponentChildren; foot?: ComponentChildren; tabs?: ComponentChildren; compact?: boolean; onClose?: () => void }) {
  const close = () => {
    audio.play('close');
    if (props.onClose) props.onClose();
    else app.closePanels();
  };
  return (
    <div class="sheet-wrap">
      <div class={'sheet' + (props.compact ? ' compact' : '')} onPointerDown={(e) => e.stopPropagation()}>
        <div class="sheet-head">
          {props.accent && <div class="accent" style={{ background: props.accent, color: props.accent }} />}
          {props.icon && <Icon n={props.icon} cls="lg" />}
          <h2>
            {props.title}
            {props.sub && <small>{props.sub}</small>}
          </h2>
          <IconBtn n="close" onClick={close} />
        </div>
        {props.tabs && <div class="tabs">{props.tabs}</div>}
        <div class="sheet-body">{props.children}</div>
        {props.foot && <div class="sheet-foot">{props.foot}</div>}
      </div>
    </div>
  );
}

export function Modal(props: { children: ComponentChildren; hero?: ComponentChildren; foot?: ComponentChildren; onClose?: () => void; cls?: string }) {
  return (
    <div class="modal-back" onPointerDown={(e) => e.stopPropagation()}>
      <div class={'modal ' + (props.cls ?? '')}>
        {props.hero && (
          <div class="modal-hero">
            {props.hero}
            {props.onClose && (
              <div class="x">
                <IconBtn n="close" onClick={props.onClose} />
              </div>
            )}
          </div>
        )}
        <div class="modal-body">{props.children}</div>
        {props.foot && <div class="modal-foot">{props.foot}</div>}
      </div>
    </div>
  );
}

/** Canvas portrait of a dweller. */
export function Avatar({ d, big, cls }: { d: Dweller; big?: boolean; cls?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = `${d.id}|${d.outfit}|${d.happy > 70 ? 1 : d.happy < 35 ? 2 : 0}|${d.ko}|${d.child}|${d.look.hair}|${d.look.hairColor}`;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const w = big ? 96 : 58;
    const h = big ? 112 : 64;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const s = (big ? 2.9 : 1.75) * (d.child ? 1.25 : 1);
    ctx.translate(w / 2, h + (big ? 37 : 23) * (d.child ? 0.4 : 1));
    ctx.scale(s, s);
    drawCharacter(
      ctx,
      d.look,
      outfitOf(app.g, d),
      { ...DEFAULT_POSE, mouth: d.ko ? 'open' : d.happy >= 70 ? 'happy' : d.happy < 35 ? 'sad' : 'neutral', eyes: d.ko ? 'x' : 'open', child: d.child },
      d.gender,
    );
  }, [key, big]);
  return (
    <div class={'avatar' + (big ? ' big' : '') + ' ' + (cls ?? '')}>
      <canvas ref={ref} />
      {!big && <span class="lvl">{d.level}</span>}
    </div>
  );
}

/** Canvas picture of an item. */
export function ItemPic({ it, size = 58 }: { it: Item; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const w = size;
    const h = Math.round(size * 0.8);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    drawItemPic(ctx, it, w, h);
  }, [it.uid, it.def, size]);
  return <canvas ref={ref} style={{ width: size + 'px', height: Math.round(size * 0.8) + 'px' }} />;
}

export function drawItemPic(ctx: CanvasRenderingContext2D, it: Item, w: number, h: number) {
  if (it.kind === 'weapon') {
    const wd = WEAPON_BY_ID[it.def];
    if (!wd) return;
    ctx.save();
    ctx.translate(w / 2 - 12 * (w / 58), h / 2 + 2);
    ctx.scale(2.2 * (w / 58), 2.2 * (w / 58));
    drawWeapon(ctx, wd, 0, 0, false);
    ctx.restore();
  } else if (it.kind === 'outfit') {
    const o = OUTFIT_BY_ID[it.def];
    if (!o) return;
    ctx.save();
    ctx.translate(w / 2, h + 26 * (w / 58));
    const s = 1.55 * (w / 58);
    ctx.scale(s, s);
    drawCharacter(ctx, { skin: 1, hair: 0, hairColor: 1, beard: 0, glasses: false, face: 0 }, o, { ...DEFAULT_POSE, mouth: 'happy' }, 'm');
    ctx.restore();
  } else if (it.kind === 'pet') {
    const p = PET_BY_ID[it.def];
    if (!p) return;
    ctx.save();
    ctx.translate(w / 2 - 4, h - 6);
    ctx.scale(2.4 * (w / 58), 2.4 * (w / 58));
    drawPet(ctx, p.species, p.color, p.color2, 0, false);
    ctx.restore();
  } else {
    const j = JUNK_BY_ID[it.def];
    if (!j) return;
    drawJunk(ctx, j.icon, w / 2, h / 2, Math.min(w, h) * 0.42, RARITY_COLORS[j.rarity]);
  }
}

function drawJunk(ctx: CanvasRenderingContext2D, icon: string, cx: number, cy: number, r: number, rc: string) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = r / 10;
  ctx.scale(s, s);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#1b1410';
  const fill = (c: string) => {
    ctx.fillStyle = c;
    ctx.fill();
    ctx.stroke();
  };
  ctx.beginPath();
  switch (icon) {
    case 'tape':
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      fill('#9aa7b0');
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      fill('#3a3f45');
      break;
    case 'glue':
      ctx.rect(-5, -6, 10, 14);
      fill('#f4efe0');
      ctx.beginPath();
      ctx.rect(-2, -10, 4, 4);
      fill('#e8453c');
      break;
    case 'gears':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.lineTo(Math.cos(a + 0.2) * 6.5, Math.sin(a + 0.2) * 6.5);
        ctx.lineTo(Math.cos(a + 0.58) * 6.5, Math.sin(a + 0.58) * 6.5);
      }
      ctx.closePath();
      fill('#c9a24a');
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      fill('#3a2a0e');
      break;
    case 'wire':
      ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
      fill('#c9772f');
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2);
      fill('#6a3a14');
      break;
    case 'bulb':
      ctx.arc(0, -2, 6.5, 0, Math.PI * 2);
      fill('#fff4b0');
      ctx.beginPath();
      ctx.rect(-3, 4, 6, 5);
      fill('#9aa7b0');
      break;
    case 'cloth':
      ctx.moveTo(-9, -6);
      ctx.lineTo(8, -8);
      ctx.lineTo(9, 7);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      fill('#c0504d');
      break;
    case 'steel':
      ctx.rect(-9, -4, 18, 8);
      fill('#8a949e');
      break;
    case 'spring':
      ctx.moveTo(-8, 6);
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(-6 + i * 3, i % 2 ? -6 : 6);
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#aab4bd';
      ctx.stroke();
      break;
    case 'clock':
      ctx.arc(0, 1, 7.5, 0, Math.PI * 2);
      fill('#e8453c');
      ctx.beginPath();
      ctx.arc(0, 1, 5.5, 0, Math.PI * 2);
      fill('#f4efe0');
      ctx.beginPath();
      ctx.arc(-5, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -6, 2.5, 0, Math.PI * 2);
      fill('#c9a24a');
      break;
    case 'teapot':
      ctx.ellipse(0, 2, 8, 6, 0, 0, Math.PI * 2);
      fill('#5fb8ff');
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(11, -4);
      ctx.lineTo(10, -1);
      ctx.closePath();
      fill('#5fb8ff');
      break;
    case 'circuit':
      ctx.rect(-8, -6, 16, 12);
      fill('#2f7a4a');
      ctx.fillStyle = '#ffcf4a';
      ctx.fillRect(-5, -3, 3, 3);
      ctx.fillRect(2, 1, 4, 2);
      break;
    case 'lens':
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      fill('#8fd8ff');
      ctx.beginPath();
      ctx.arc(-3, -3, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      break;
    case 'magnet':
      ctx.arc(0, -1, 7, Math.PI, 0);
      ctx.lineTo(7, 8);
      ctx.lineTo(3, 8);
      ctx.lineTo(3, -1);
      ctx.arc(0, -1, 3, 0, Math.PI, true);
      ctx.lineTo(-3, 8);
      ctx.lineTo(-7, 8);
      ctx.closePath();
      fill('#e8453c');
      break;
    case 'phone':
      ctx.rect(-8, -2, 16, 9);
      fill('#2a2a2a');
      ctx.beginPath();
      ctx.arc(0, 2.5, 3.5, 0, Math.PI * 2);
      fill('#f4efe0');
      ctx.beginPath();
      ctx.rect(-9, -7, 18, 4);
      fill('#2a2a2a');
      break;
    case 'crystal':
      ctx.moveTo(0, -10);
      ctx.lineTo(6, -2);
      ctx.lineTo(3, 9);
      ctx.lineTo(-3, 9);
      ctx.lineTo(-6, -2);
      ctx.closePath();
      fill('#d9c2ff');
      break;
    case 'core':
      ctx.rect(-5, -9, 10, 18);
      fill('#3a424b');
      ctx.beginPath();
      ctx.rect(-3, -6, 6, 12);
      fill('#6aff8c');
      break;
    case 'chip':
      ctx.rect(-7, -7, 14, 14);
      fill('#3a2a6a');
      ctx.fillStyle = '#ffcf4a';
      for (let i = -5; i <= 5; i += 3.3) {
        ctx.fillRect(i, -10, 1.2, 3);
        ctx.fillRect(i, 7, 1.2, 3);
      }
      break;
    case 'gold':
      ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
      fill('#ffcf4a');
      break;
    default:
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      fill('#9aa7b0');
  }
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.3);
  g.addColorStop(0, rc + '44');
  g.addColorStop(1, rc + '00');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6);
  ctx.restore();
}

/** Stat rows with pips (base + bonus). */
export function StatList({ d, highlight }: { d: Dweller; highlight?: number }) {
  return (
    <div class="stats">
      {STATS.map((s, i) => {
        const base = d.stats[i];
        const total = statTotal(app.g.s, d, i);
        const bonus = total - base;
        return (
          <div class="stat" style={{ '--c': s.color, opacity: highlight != null && highlight !== i ? 0.55 : 1 } as any}>
            <Icon n={s.icon} />
            <div class="col" style={{ gap: '3px' }}>
              <div class="row small" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: highlight === i ? 700 : 500 }}>{L(s.name)}</span>
              </div>
              <div class="pips">
                {Array.from({ length: 10 }, (_, k) => (
                  <i class={k < base ? 'on' : k < Math.min(10, total) ? 'bonus' : ''} />
                ))}
              </div>
            </div>
            <div class="v">
              {base}
              {bonus > 0 && <b> +{bonus}</b>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StatMini({ stat, v }: { stat: number; v: number }) {
  return (
    <span class="statmini" style={{ color: STATS[stat].color }}>
      <Icon n={STATS[stat].icon} />
      {v}
    </span>
  );
}

/** Room preview canvas for build cards. */
const thumbCache = new Map<string, string>();
export function RoomThumb({ type }: { type: RoomType }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    let url = thumbCache.get(type);
    if (!url) {
      const cells = ROOMS[type].cells;
      const w = cells * CELL_W;
      const scale = type === 'elevator' ? 1.2 : 1.1;
      const [c, ctx] = makeCanvas(210 * scale, FLOOR_H * scale);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#12161b';
      ctx.fillRect(0, 0, 210, FLOOR_H);
      ctx.save();
      ctx.translate((210 - w) / 2, 0);
      paintRoomStatic(ctx, type, 1, 1, w, false, false, app.r?.cache.lang ?? 'ru', app.g?.s.vault ?? 111);
      ctx.restore();
      url = c.toDataURL('image/jpeg', 0.82);
      thumbCache.set(type, url);
    }
    if (ref.current) ref.current.src = url;
  }, [type]);
  return <img ref={ref} class="thumb" draggable={false} alt="" />;
}

export function Price({ n, icon = 'nuts', bad }: { n: number | string; icon?: string; bad?: boolean }) {
  return (
    <span class="price" style={bad ? { color: '#ffb0a8' } : undefined}>
      <Icon n={icon} cls="sm" />
      {n}
    </span>
  );
}

export function useClose() {
  return () => store.openPanel(null);
}
