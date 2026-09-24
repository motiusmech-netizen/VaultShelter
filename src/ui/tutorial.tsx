import { useEffect, useState } from 'preact/hooks';
import { app } from '../app';
import { store, useStore } from './store';
import { Btn } from './kit';
import { t } from '../i18n';
import { TUTORIAL_DONE } from '../sim/game';
import type { RoomType } from '../data/rooms';
import { roomW, roomX, roomY, FLOOR_H } from '../render/world';
import { audio } from '../audio/audio';

interface Step {
  text: string;
  next?: boolean;
  build?: RoomType;
  assign?: RoomType;
}

const STEPS: Step[] = [
  { text: 'tut_welcome', next: true },
  { text: 'tut_gate', next: true },
  { text: 'tut_build_power', build: 'power' },
  { text: 'tut_assign_power', assign: 'power' },
  { text: 'tut_build_diner', build: 'diner' },
  { text: 'tut_assign_diner', assign: 'diner' },
  { text: 'tut_build_water', build: 'water' },
  { text: 'tut_assign_water', assign: 'water' },
  { text: 'tut_collect' },
  { text: 'tut_rush' },
  { text: 'tut_living', build: 'living' },
  { text: 'tut_objectives' },
  { text: 'tut_done', next: true },
];

const KUZYA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><radialGradient id="k1" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#aab6c0"/><stop offset="1" stop-color="#5f6b76"/></radialGradient></defs>
<ellipse cx="32" cy="60" rx="12" ry="3" fill="#7fd3ff" opacity=".5"/>
<path d="M10 30 4 40M54 30l6 10" stroke="#6d7680" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="32" cy="32" rx="24" ry="21" fill="url(#k1)" stroke="#2a3036" stroke-width="2"/>
<rect x="9" y="39" width="46" height="3.5" fill="#ffb02e"/>
<rect x="17" y="20" width="30" height="17" rx="8" fill="#16222b"/>
<circle cx="26" cy="28.5" r="3.4" fill="#6aff8c"/><circle cx="38" cy="28.5" r="3.4" fill="#6aff8c"/>
<path d="M27 33.5q5 3 10 0" stroke="#6aff8c" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M32 11V5" stroke="#2a3036" stroke-width="2"/><circle cx="32" cy="4" r="3" fill="#ff5a4a"/>
</svg>`;

let lastStep = -1;
let focusedKey = '';

function stepDone(step: number): boolean {
  const g = app.g;
  const s = STEPS[step];
  if (!s) return true;
  if (s.build) return g.s.rooms.some((r) => r.type === s.build && r.buildLeft <= 0);
  if (s.assign) {
    const r = g.s.rooms.find((x) => x.type === s.assign);
    return !!r && g.dwellersIn(r).filter((d) => !d.child).length >= 2;
  }
  return false;
}

export function advanceTutorial(force = false) {
  const g = app.g;
  if (g.s.tutorial >= TUTORIAL_DONE) return;
  const cur = g.s.tutorial;
  if (force || stepDone(cur)) {
    g.s.tutorial = cur + 1;
    onEnter(g.s.tutorial);
    if (g.s.tutorial >= STEPS.length) finishTutorial();
    store.bump();
    // chain automatically completed steps
    if (!force && stepDone(g.s.tutorial)) advanceTutorial();
  }
}

function onEnter(step: number) {
  const g = app.g;
  audio.play('toast');
  if (step === 1) app.r.cam.focus(-30, 110, Math.max(app.r.cam.zoom, 1.4));
  if (step === 8) {
    // speed up the first collection
    const r = g.s.rooms.find((x) => x.type === 'power');
    if (r && !r.ready) r.prog = g.roomStore(r) * 0.92;
  }
  if (step === 11) {
    g.s.crates += 1;
    store.pulse('objectives');
  }
}

export function finishTutorial() {
  const g = app.g;
  g.s.tutorial = TUTORIAL_DONE;
  for (const d of g.waiting()) if (g.population() < g.capacity()) g.admit(d);
  g.fillObjectives();
  app.r.highlight = null;
  app.saveNow();
  store.bump();
}

/** Game events relevant to the tutorial. */
export function tutorialEvent(ev: string) {
  const g = app.g;
  if (g.s.tutorial >= TUTORIAL_DONE) return;
  const step = g.s.tutorial;
  if (step === 8 && ev === 'collect') advanceTutorial(true);
  else if (step === 9 && ev === 'rush') advanceTutorial(true);
  else if (step === 11 && ev === 'crate_closed') advanceTutorial(true);
  else advanceTutorial();
}

export function Tutorial() {
  const st = useStore();
  const g = app.g;
  const [, tick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => {
      advanceTutorial();
      tick((v) => v + 1);
    }, 400);
    return () => clearInterval(i);
  }, []);
  if (g.s.tutorial >= TUTORIAL_DONE || st.screen !== 'game') {
    app.r.highlight = null;
    return null;
  }
  const step = g.s.tutorial;
  const s = STEPS[step];
  if (!s) return null;
  if (lastStep !== step) lastStep = step;

  // compute target
  let target: DOMRect | null = null;
  let world: { x: number; y: number; w: number; h: number } | null = null;
  const q = (sel: string) => (document.querySelector(sel) as HTMLElement | null)?.getBoundingClientRect() ?? null;
  const panel = st.panel;
  if (s.build) {
    if (st.buildMode === s.build) {
      const spot = app.r.buildSpots[0];
      if (spot) world = { x: spot.col * 70, y: 46 + spot.floor * FLOOR_H, w: 210, h: FLOOR_H };
    } else if (panel?.type === 'build') target = q(`[data-tut="build-${s.build}"]`);
    else target = q('[data-tut="build"]');
  } else if (s.assign) {
    const r = g.s.rooms.find((x) => x.type === s.assign);
    if (panel?.type === 'dwellers') target = null;
    else if (panel?.type === 'room' && r && panel.id === r.id) target = q('[data-tut="slot"]');
    else if (r) world = { x: roomX(r), y: roomY(r), w: roomW(r), h: FLOOR_H };
  } else if (step === 8) {
    const r = g.s.rooms.find((x) => x.ready);
    if (r) world = { x: roomX(r), y: roomY(r), w: roomW(r), h: FLOOR_H };
  } else if (step === 9) {
    if (panel?.type === 'room') target = q('.tut-rush');
    else {
      const r = g.s.rooms.find((x) => x.type === 'diner') ?? g.s.rooms.find((x) => x.type === 'water');
      if (r) world = { x: roomX(r), y: roomY(r), w: roomW(r), h: FLOOR_H };
    }
  } else if (step === 11) {
    target = q('[data-tut="crate"]');
  }
  app.r.highlight = world;
  // keep world targets on screen
  if (world && !st.panel && !st.buildMode) {
    const key = step + ':' + world.x + ':' + world.y;
    const cam = app.r.cam;
    const a = cam.toScreen(world.x, world.y);
    const b = cam.toScreen(world.x + world.w, world.y + world.h);
    const off = a.x < 0 || b.x > cam.W || a.y < 150 || b.y > cam.H - 90;
    if (off && focusedKey !== key && !cam.animating) {
      focusedKey = key;
      cam.focus(world.x + world.w / 2, world.y + world.h / 2 - 20, Math.max(cam.zoom, Math.min(1.3, cam.W / (world.w + 120))), 0.6);
    }
  }
  let arrow: { x: number; y: number } | null = null;
  if (target && target.width) arrow = { x: target.left + target.width / 2 - 22, y: target.top - 50 };
  else if (world) {
    const p = app.r.cam.toScreen(world.x + world.w / 2, world.y);
    arrow = { x: p.x - 22, y: p.y - 46 };
  }
  // in portrait an open sheet covers the lower screen: lift the bubble over the HUD instead
  const overHud = st.panel != null && window.innerHeight > window.innerWidth;
  const low = false;
  return (
    <>
      <div class={'tut' + (low ? ' low' : '') + (overHud ? ' over-hud' : '')} onPointerDown={(e) => e.stopPropagation()}>
        <img class="kuzya" src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(KUZYA)} alt="" draggable={false} />
        <div class="bubble">
          {t(s.text as any)}
          <div class="acts">
            {step < 3 && (
              <Btn
                kind="ghost"
                size="small"
                onClick={() => {
                  finishTutorial();
                }}
              >
                <span style={{ color: '#6a5a4a' }}>{t('tut_skip')}</span>
              </Btn>
            )}
            {s.next && (
              <Btn size="small" onClick={() => advanceTutorial(true)}>
                {t('tut_next')}
              </Btn>
            )}
          </div>
        </div>
      </div>
      {arrow && (
        <svg class="pointer-arrow" style={{ left: arrow.x + 'px', top: arrow.y + 'px' }} viewBox="0 0 44 44">
          <path d="M22 40 6 20h10V4h12v16h10z" fill="#ffb02e" stroke="#6a3a06" stroke-width="2.5" stroke-linejoin="round" />
        </svg>
      )}
    </>
  );
}
