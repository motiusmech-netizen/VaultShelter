import { useEffect, useState } from 'preact/hooks';
import { app } from '../app';
import { store, useStore, useTicker } from './store';
import { Icon } from './kit';
import { audio } from '../audio/audio';
import { t } from '../i18n';
import { fmtShort, fmtInt } from '../core/util';
import { TUTORIAL_DONE } from '../sim/game';
import { roomX, roomW, roomY } from '../render/world';
import type { ResKey } from '../sim/types';

function Gauge({ k, icon, color }: { k: ResKey; icon: string; color: string }) {
  const g = app.g;
  const v = g.s.res[k];
  const cap = g.resCap(k);
  const frac = cap > 0 ? v / cap : 0;
  const low = frac < 0.15;
  const pulse = Date.now() - (store.s.hudPulse[k] ?? 0) < 450;
  return (
    <div
      class={'gauge' + (low ? ' low' : '') + (pulse ? ' pulse' : '')}
      data-hud={k}
      onClick={() => {
        audio.play('click');
        const prod = k === 'power' ? g.powerConsumption() : k === 'food' ? g.foodConsumption() : g.waterConsumption();
        store.toast(`${t(('res_' + k) as any)}: ${fmtInt(v)} / ${fmtInt(cap)} · −${(prod * 60).toFixed(1)}/${t('min')}`, 'info', icon);
      }}
    >
      <Icon n={icon} />
      <div class="track">
        <div class="fill" style={{ width: `${Math.max(2, frac * 100)}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
      </div>
      <span class="val">{fmtShort(v)}</span>
    </div>
  );
}

export function Hud() {
  useStore();
  useTicker(200);
  const g = app.g;
  const s = g.s;
  const pop = g.population();
  const cap = g.capacity();
  const happy = Math.round(g.happiness());
  const pulse = (k: string) => (Date.now() - (store.s.hudPulse[k] ?? 0) < 450 ? ' pulse' : '');
  const tut = s.tutorial < TUTORIAL_DONE;
  return (
    <>
      <div class="hud-top">
        <div class="hud-left">
          <div class={'chip' + pulse('dweller')} data-hud="dweller" onClick={() => open({ type: 'dwellers' })}>
            <Icon n="people" />
            {pop}
            <small>/{cap}</small>
          </div>
          <div class="chip" onClick={() => store.toast(`${t('happiness')}: ${happy}%`, 'info', happy >= 50 || pop === 0 ? 'happy' : 'sad')}>
            <Icon n={happy >= 50 || pop === 0 ? 'happy' : 'sad'} />
            {pop === 0 ? '—' : happy + '%'}
          </div>
        </div>
        <div class="hud-res">
          <Gauge k="power" icon="power" color="#ffd23d" />
          <Gauge k="food" icon="food" color="#ff9b3d" />
          <Gauge k="water" icon="water" color="#39c6e8" />
        </div>
        <div class="hud-right">
          <div class={'chip' + pulse('nuts')} data-hud="nuts" onClick={() => !tut && open({ type: 'shop' })}>
            <Icon n="nuts" />
            {fmtShort(s.nuts)}
          </div>
          <div class={'chip' + pulse('iso')} data-hud="iso" onClick={() => !tut && open({ type: 'shop' })}>
            <Icon n="iso" />
            {fmtShort(s.iso)}
          </div>
        </div>
        <span data-hud="medkit" style={{ position: 'fixed', right: '60px', top: '60px', width: '1px', height: '1px' }} />
        <span data-hud="antirad" style={{ position: 'fixed', right: '60px', top: '60px', width: '1px', height: '1px' }} />
        <span data-hud="dawn" style={{ position: 'fixed', right: '50%', bottom: '40px', width: '1px', height: '1px' }} />
      </div>
      <SideWidgets />
      {!store.s.buildMode && <Dock />}
    </>
  );
}

function open(p: Parameters<typeof store.openPanel>[0]) {
  audio.play('open');
  app.exitBuild();
  store.openPanel(p);
}

function Dock() {
  const st = store.s;
  const g = app.g;
  const tut = g.s.tutorial < TUTORIAL_DONE;
  const readyObj = g.s.objectives.filter((o) => g.objectiveReady(o)).length;
  const exploring = g.s.expeditions.length;
  const doneExp = g.s.expeditions.some((e) => e.ko);
  const pulse = (k: string) => (Date.now() - (st.hudPulse[k] ?? 0) < 1500 ? ' pulse' : '');
  const p = st.panel?.type;
  const dailyOrFree = g.dailyAvailable() || (g.s.adCd.crate ?? 0) <= Date.now();
  return (
    <div class="dock" data-tut="dock">
      <button class={'dbtn' + (p === 'dwellers' ? ' active' : '')} onClick={() => open({ type: 'dwellers' })} data-tut="dwellers">
        <Icon n="people" />
        <span class="lbl">{t('btn_dwellers')}</span>
      </button>
      <button class={'dbtn' + (p === 'storage' ? ' active' : '')} onClick={() => open({ type: 'storage' })}>
        <Icon n="storage" />
        <span class="lbl">{t('btn_storage')}</span>
      </button>
      <button class={'dbtn' + (p === 'wasteland' ? ' active' : '')} onClick={() => open({ type: 'wasteland' })}>
        <Icon n="wasteland" />
        <span class="lbl">{t('btn_wasteland')}</span>
        {exploring > 0 && <span class={'badge' + (doneExp ? '' : ' green')}>{exploring}</span>}
      </button>
      <button class={'dbtn main' + pulse('build')} onClick={() => open({ type: 'build' })} data-tut="build">
        <Icon n="hammer" />
      </button>
      <button class={'dbtn' + (p === 'objectives' ? ' active' : '') + pulse('objectives')} onClick={() => open({ type: 'objectives' })} data-tut="objectives">
        <Icon n="objectives" />
        <span class="lbl">{t('btn_objectives')}</span>
        {readyObj > 0 && <span class="badge">{readyObj}</span>}
      </button>
      <button class={'dbtn' + (p === 'shop' ? ' active' : '')} onClick={() => !tut && open({ type: 'shop' })}>
        <Icon n="gift" />
        <span class="lbl">{t('btn_shop')}</span>
        {!tut && dailyOrFree && <span class="badge dot" />}
      </button>
      <button class={'dbtn' + (p === 'settings' || p === 'dawn' || p === 'missions' ? ' active' : '') + pulse('missions')} onClick={() => open({ type: 'settings' })}>
        <Icon n="menu" />
        <span class="lbl">{t('btn_menu')}</span>
        {g.s.missions.some((m) => m.phase === 'ready') && <span class="badge dot" />}
      </button>
    </div>
  );
}

function SideWidgets() {
  const g = app.g;
  const [, setN] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setN((v) => v + 1), 500);
    return () => clearInterval(i);
  }, []);
  const inc = g.s.rooms.filter((r) => r.incident);
  const waiting = g.waiting();
  const readyMission = g.s.missions.find((m) => m.phase === 'ready');
  const koExp = g.s.expeditions.find((e) => e.ko);
  const tut = g.s.tutorial < TUTORIAL_DONE;
  return (
    <>
      <div class="side-stack">
        {inc.length > 0 && (
          <button
            class="fab alert"
            onClick={() => {
              audio.play('click');
              const r = inc[0];
              app.r.focusRoom(r);
              app.r.selectedRoom = r.id;
              store.openPanel({ type: 'room', id: r.id });
            }}
          >
            <Icon n="alert" />
            {inc.length > 1 && <span class="badge">{inc.length}</span>}
          </button>
        )}
        {waiting.length > 0 && (
          <button
            class="fab glow"
            data-tut="gate"
            onClick={() => {
              audio.play('click');
              app.r.cam.focus(-40, 110, Math.max(app.r.cam.zoom, 1.3));
              app.r.selectedDweller = waiting[0].id;
              store.openPanel({ type: 'dweller', id: waiting[0].id });
            }}
          >
            <Icon n="door" />
            <span class="badge">{waiting.length}</span>
          </button>
        )}
        {g.s.crates > 0 && (
          <button
            class="fab glow"
            data-tut="crate"
            onClick={() => {
              const cards = g.openCrate();
              if (cards) {
                audio.play('crate');
                store.pushModal({ type: 'crate', cards });
              }
            }}
          >
            <Icon n="crate" />
            <span class="badge">{g.s.crates}</span>
          </button>
        )}
        {readyMission && (
          <button
            class="fab glow"
            onClick={() => {
              audio.play('open');
              store.pushModal({ type: 'battle', run: readyMission });
            }}
          >
            <Icon n="mission" />
          </button>
        )}
        {koExp && (
          <button class="fab alert" onClick={() => store.openPanel({ type: 'wasteland' })}>
            <Icon n="heart" />
          </button>
        )}
        {!tut && g.dailyAvailable() && (
          <button
            class="fab glow"
            onClick={() => {
              audio.play('open');
              store.pushModal({ type: 'daily' });
            }}
          >
            <Icon n="gift" />
          </button>
        )}
      </div>
      {g.catRoom && (
        <div class="side-stack right">
          <button
            class="fab glow"
            onClick={() => {
              const r = g.catRoom;
              if (r) app.r.cam.focus(roomX(r) + roomW(r) * 0.72, roomY(r) + 70, Math.max(app.r.cam.zoom, 1.4), 0.4);
            }}
          >
            <Icon n="cat" />
          </button>
        </div>
      )}
    </>
  );
}
