import { useEffect, useState } from 'preact/hooks';
import { app } from '../app';
import { store, useStore } from './store';
import { Btn, Icon } from './kit';
import { t, getLang, setLang } from '../i18n';
import { audio } from '../audio/audio';
import { platform } from '../platform/sdk';
import { randi } from '../core/util';

const EMBLEM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><radialGradient id="e1" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff3cf"/><stop offset=".55" stop-color="#ffb02e"/><stop offset="1" stop-color="#9a5c08"/></radialGradient>
<linearGradient id="e2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4957"/><stop offset="1" stop-color="#151c24"/></linearGradient></defs>
<g transform="translate(50 50)">
<path d="${gear(46, 40, 16)}" fill="url(#e2)" stroke="#0b0e12" stroke-width="2"/>
<circle r="33" fill="url(#e1)" stroke="#6a3a06" stroke-width="2.5"/>
<g fill="none" stroke="#3a2408" stroke-width="3.2"><ellipse rx="22" ry="8.5"/><ellipse rx="22" ry="8.5" transform="rotate(60)"/><ellipse rx="22" ry="8.5" transform="rotate(-60)"/></g>
<circle r="6" fill="#3a2408"/><circle r="2.4" fill="#ffe27a"/>
</g></svg>`;

function gear(ro: number, ri: number, teeth: number) {
  let d = '';
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? ro : ri;
    d += `${i === 0 ? 'M' : 'L'}${(Math.cos(a0) * r).toFixed(2)} ${(Math.sin(a0) * r).toFixed(2)} L${(Math.cos(a1) * r).toFixed(2)} ${(Math.sin(a1) * r).toFixed(2)} `;
  }
  return d + 'Z';
}

export function TitleScreen() {
  useStore();
  useEffect(() => {
    // gentle camera drift over the surface
    const cam = app.r.cam;
    cam.zoom = Math.max(cam.minZoom, Math.min(1.1, cam.W / 900));
    cam.x = 260;
    cam.y = -40;
    cam.clampPos();
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (store.s.screen !== 'title') return;
      const k = (now - t0) / 1000;
      cam.x = 260 + Math.sin(k * 0.06) * 240;
      cam.clampPos();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const has = app.hasSave;
  return (
    <div class="title-screen" onPointerDown={() => audio.unlock()}>
      <div class="logo">
        <img class="emblem" src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(EMBLEM)} alt="" draggable={false} />
        <h1>{t('game_title')}</h1>
        <div class="sub">{t('game_subtitle')}</div>
        <div class="tag">{t('tagline')}</div>
      </div>
      <div class="title-actions">
        {has ? (
          <>
            <Btn
              size="big"
              wide
              icon="door"
              onClick={() => {
                audio.unlock();
                audio.play('door');
                app.startGame();
              }}
            >
              {t('continue')}
            </Btn>
            <Btn
              kind="steel"
              wide
              onClick={() =>
                store.pushModal({
                  type: 'confirm',
                  danger: true,
                  text: t('settings_reset_confirm'),
                  yes: t('new_game'),
                  onYes: () => store.set({ screen: 'vaultpick' }),
                })
              }
            >
              {t('new_game')}
            </Btn>
          </>
        ) : (
          <Btn
            size="big"
            wide
            icon="door"
            onClick={() => {
              audio.unlock();
              store.set({ screen: 'vaultpick' });
            }}
          >
            {t('play')}
          </Btn>
        )}
        <div class="row" style={{ justifyContent: 'center', gap: '8px' }}>
          <button class={'tab' + (getLang() === 'ru' ? ' on' : '')} style={{ pointerEvents: 'auto' }} onClick={() => { setLang('ru'); app.r.cache.lang = 'ru'; app.r.cache.clear(); store.bump(); }}>
            RU
          </button>
          <button class={'tab' + (getLang() === 'en' ? ' on' : '')} style={{ pointerEvents: 'auto' }} onClick={() => { setLang('en'); app.r.cache.lang = 'en'; app.r.cache.clear(); store.bump(); }}>
            EN
          </button>
        </div>
      </div>
    </div>
  );
}

export function VaultPick() {
  const [digits, setDigits] = useState<number[]>(() => [randi(0, 9), randi(0, 9), randi(1, 9)]);
  const bump = (i: number, d: number) => {
    audio.play('type');
    const n = digits.slice();
    n[i] = (n[i] + d + 10) % 10;
    setDigits(n);
  };
  const num = digits[0] * 100 + digits[1] * 10 + digits[2];
  return (
    <div class="modal-back">
      <div class="modal">
        <div class="modal-hero">
          <Icon n="door" cls="xl" />
          <h2>{t('choose_vault')}</h2>
          <p>{t('choose_vault_hint')}</p>
        </div>
        <div class="modal-body">
          <div class="dials">
            {digits.map((v, i) => (
              <div class="dial">
                <button onClick={() => bump(i, 1)}>
                  <Icon n="arrow_left" style={{ transform: 'rotate(90deg)' }} />
                </button>
                <span class="digit" key={v + '-' + i}>
                  {v}
                </span>
                <button onClick={() => bump(i, -1)}>
                  <Icon n="arrow_left" style={{ transform: 'rotate(-90deg)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div class="modal-foot">
          <Btn kind="steel" onClick={() => store.set({ screen: 'title' })}>
            {t('back')}
          </Btn>
          <Btn
            kind="green"
            icon="check"
            onClick={() => {
              audio.play('door');
              startIntro(num === 0 ? 1 : num);
            }}
          >
            {t('confirm')}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function startIntro(vault: number) {
  app.newGame(vault);
  store.set({ screen: 'intro' });
  const cam = app.r.cam;
  cam.focus(80, 20, Math.max(cam.minZoom, Math.min(1.3, cam.W / 700)), 0.01);
  setTimeout(() => cam.focus(40, 110, Math.max(cam.minZoom, Math.min(1.7, cam.W / 520)), 2.4), 60);
  setTimeout(() => {
    store.set({ screen: 'game' });
    platform.setGameplayWanted(true);
  }, 2700);
}

export function IntroOverlay() {
  return (
    <div class="title-screen" style={{ justifyContent: 'center', background: 'linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,0) 50%, rgba(0,0,0,.35))' }}>
      <div class="logo">
        <h1 style={{ fontSize: 'clamp(28px,7vw,54px)' }}>{t('vault_no', { n: String(app.g.s.vault).padStart(3, '0') })}</h1>
        <div class="tag">{t('tagline')}</div>
      </div>
    </div>
  );
}
