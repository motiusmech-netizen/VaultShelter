import './ui/fonts';
import './ui/styles.css';
import { render, h } from 'preact';
import { platform } from './platform/sdk';
import { setLang } from './i18n';
import { app } from './app';
import { Root } from './ui/Root';
import { store } from './ui/store';
import { preloadIcons } from './ui/icons';
import { tutorialEvent } from './ui/tutorial';
import { audio } from './audio/audio';

function progress(p: number) {
  const el = document.getElementById('bootbar');
  if (el) el.style.width = Math.round(p * 100) + '%';
}

async function loadFonts() {
  const fonts = ['700 12px Unbounded', '800 12px Unbounded', '400 12px Rubik', '500 12px Rubik', '700 12px Rubik', '600 12px Oswald', '700 12px Oswald'];
  try {
    await Promise.race([Promise.all(fonts.map((f) => document.fonts.load(f, 'АБВabc123'))), new Promise((r) => setTimeout(r, 3500))]);
  } catch {
    /* fonts are optional */
  }
}

async function main() {
  // Block browser gestures that interfere with the game (Yandex requirements)
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('selectstart', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener(
    'touchmove',
    (e) => {
      const tgt = e.target as HTMLElement;
      if (!tgt.closest?.('.sheet-body, .modal-body')) e.preventDefault();
    },
    { passive: false },
  );
  progress(0.1);
  await platform.init();
  setLang(platform.lang);
  progress(0.35);
  await Promise.all([loadFonts(), preloadIcons()]);
  progress(0.6);
  await app.boot();
  app.onTutorialEvent = (ev) => tutorialEvent(ev);
  progress(0.9);
  render(h(Root, {}), document.getElementById('ui')!);
  const params = new URLSearchParams(location.search);
  if (import.meta.env.DEV && params.get('demo')) {
    const { demoState } = await import('../dev/demo');
    app.startGame(demoState(params.get('demo') !== 'small'));
  } else if (import.meta.env.DEV && params.get('autostart') && app.hasSave) {
    app.startGame();
  } else {
    store.set({ screen: 'title' });
  }
  progress(1);
  const boot = document.getElementById('boot');
  if (boot) {
    boot.style.opacity = '0';
    setTimeout(() => boot.remove(), 600);
  }
  platform.loadingReady();
  // First interstitial on start (allowed by Yandex at game launch)
  if (!import.meta.env.DEV) setTimeout(() => app.maybeInterstitial(true), 400);
  window.addEventListener('pointerdown', () => audio.unlock(), { once: false, passive: true });
  (window as any).__done = true;
  (window as any).__app = app;
}

main();
