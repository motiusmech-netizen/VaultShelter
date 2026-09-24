/*
 * Yandex Games SDK wrapper.
 * - Loads /sdk.js (served by Yandex Games) with a timeout; falls back to a local mock for dev / other portals.
 * - Handles LoadingAPI.ready, GameplayAPI start/stop markup, game_api_pause/resume,
 *   fullscreen & rewarded ads (with pause + mute), cloud saves, language, leaderboards, review.
 */

type AnyFn = (...args: any[]) => any;

export interface AdResult {
  shown: boolean;
  rewarded: boolean;
}

interface PauseListener {
  (paused: boolean, reason: string): void;
}

const FULLSCREEN_MIN_INTERVAL = 185_000; // our own guard in addition to the SDK's

class Platform {
  ysdk: any = null;
  player: any = null;
  lang: 'ru' | 'en' = 'ru';
  isMock = true;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'tv' = 'desktop';

  private pauseReasons = new Set<string>();
  private pauseListeners: PauseListener[] = [];
  private gameplayActive = false;
  private lastFullscreenAt = 0;
  private adInProgress = false;
  private loadingReadySent = false;

  async init(): Promise<void> {
    this.detectLangFallback();
    this.deviceType = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    try {
      await this.loadScript('/sdk.js', 4000);
      const YaGames = (window as any).YaGames;
      if (YaGames && typeof YaGames.init === 'function') {
        this.ysdk = await withTimeout(YaGames.init(), 6000);
        this.isMock = false;
      }
    } catch {
      this.ysdk = null;
    }
    if (this.ysdk) {
      try {
        const l = String(this.ysdk.environment?.i18n?.lang || 'ru').toLowerCase();
        this.lang = ['ru', 'be', 'kk', 'uk', 'uz', 'ky', 'tg', 'hy', 'az'].includes(l) ? 'ru' : 'en';
      } catch { /* keep fallback */ }
      try {
        const dt = this.ysdk.deviceInfo?.type;
        if (dt) this.deviceType = dt;
      } catch { /* ignore */ }
      try {
        this.ysdk.on?.('game_api_pause', () => this.setPaused('platform', true));
        this.ysdk.on?.('game_api_resume', () => this.setPaused('platform', false));
      } catch { /* older sdk */ }
      try {
        this.player = await withTimeout(this.ysdk.getPlayer({ scopes: false }), 5000);
      } catch {
        this.player = null;
      }
    }
    document.addEventListener('visibilitychange', () => {
      this.setPaused('hidden', document.hidden);
    });
  }

  private detectLangFallback() {
    const nav = (navigator.language || 'ru').toLowerCase();
    const params = new URLSearchParams(location.search);
    const forced = params.get('lang');
    if (forced === 'en' || forced === 'ru') {
      this.lang = forced;
      return;
    }
    this.lang = nav.startsWith('ru') || nav.startsWith('uk') || nav.startsWith('be') || nav.startsWith('kk') ? 'ru' : 'en';
  }

  private loadScript(src: string, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (location.protocol === 'file:') return reject(new Error('file protocol'));
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      const t = setTimeout(() => reject(new Error('sdk timeout')), timeout);
      s.onload = () => {
        clearTimeout(t);
        resolve();
      };
      s.onerror = () => {
        clearTimeout(t);
        reject(new Error('sdk load error'));
      };
      document.head.appendChild(s);
    });
  }

  /** Call once when the game is fully loaded and interactive. */
  loadingReady() {
    if (this.loadingReadySent) return;
    this.loadingReadySent = true;
    try {
      this.ysdk?.features?.LoadingAPI?.ready?.();
    } catch { /* ignore */ }
  }

  // ---------------- gameplay markup & pause ----------------
  onPauseChange(fn: PauseListener) {
    this.pauseListeners.push(fn);
  }

  get paused() {
    return this.pauseReasons.size > 0;
  }

  /** Reasons: 'hidden' | 'ad' | 'platform' */
  setPaused(reason: string, on: boolean) {
    const was = this.paused;
    if (on) this.pauseReasons.add(reason);
    else this.pauseReasons.delete(reason);
    const now = this.paused;
    if (was !== now) {
      for (const l of this.pauseListeners) l(now, reason);
    }
    this.syncGameplay();
  }

  /** Whether the player is actually interacting with gameplay (not a menu / ad / hidden tab). */
  private wantGameplay = false;
  setGameplayWanted(on: boolean) {
    this.wantGameplay = on;
    this.syncGameplay();
  }

  private syncGameplay() {
    const shouldRun = this.wantGameplay && !this.paused;
    if (shouldRun === this.gameplayActive) return;
    this.gameplayActive = shouldRun;
    try {
      const api = this.ysdk?.features?.GameplayAPI;
      if (api) shouldRun ? api.start() : api.stop();
    } catch { /* ignore */ }
  }

  // ---------------- ads ----------------
  canShowFullscreen(): boolean {
    return !this.adInProgress && Date.now() - this.lastFullscreenAt >= FULLSCREEN_MIN_INTERVAL;
  }

  /** Interstitial. Only call at logical pauses. Resolves when closed. */
  async showFullscreen(force = false): Promise<AdResult> {
    if (!force && !this.canShowFullscreen()) return { shown: false, rewarded: false };
    if (this.adInProgress) return { shown: false, rewarded: false };
    this.lastFullscreenAt = Date.now();
    if (!this.ysdk?.adv) return { shown: false, rewarded: false };
    this.adInProgress = true;
    return new Promise<AdResult>((resolve) => {
      let opened = false;
      const done = (shown: boolean) => {
        this.adInProgress = false;
        this.setPaused('ad', false);
        resolve({ shown, rewarded: false });
      };
      try {
        this.ysdk.adv.showFullscreenAdv({
          callbacks: {
            onOpen: () => {
              opened = true;
              this.setPaused('ad', true);
            },
            onClose: (wasShown: boolean) => done(wasShown ?? opened),
            onError: () => done(false),
            onOffline: () => done(false),
          },
        });
      } catch {
        done(false);
      }
    });
  }

  /** Rewarded video. Resolves with rewarded=true only if onRewarded fired. */
  async showRewarded(): Promise<AdResult> {
    if (this.adInProgress) return { shown: false, rewarded: false };
    if (!this.ysdk?.adv) {
      // Dev / portal without ads: simulate a short ad so all flows are testable.
      this.adInProgress = true;
      this.setPaused('ad', true);
      await mockAdOverlay(this.lang);
      this.setPaused('ad', false);
      this.adInProgress = false;
      return { shown: true, rewarded: true };
    }
    this.adInProgress = true;
    return new Promise<AdResult>((resolve) => {
      let rewarded = false;
      let finished = false;
      const done = (shown: boolean) => {
        if (finished) return;
        finished = true;
        this.adInProgress = false;
        this.setPaused('ad', false);
        // Rewarded video resets the interstitial timer on Yandex's side as well.
        this.lastFullscreenAt = Date.now();
        resolve({ shown, rewarded });
      };
      try {
        this.ysdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => this.setPaused('ad', true),
            onRewarded: () => {
              rewarded = true;
            },
            onClose: () => done(true),
            onError: () => done(false),
          },
        });
      } catch {
        done(false);
      }
    });
  }

  // ---------------- saves ----------------
  async cloudLoad(): Promise<any | null> {
    if (!this.player?.getData) return null;
    try {
      const data: any = await withTimeout<any>(this.player.getData(['save']), 5000);
      return data?.save ?? null;
    } catch {
      return null;
    }
  }

  private cloudPending: any = null;
  private cloudTimer: any = 0;
  private lastCloudWrite = 0;
  cloudSave(save: any, immediate = false) {
    if (!this.player?.setData) return;
    this.cloudPending = save;
    const flush = () => {
      this.cloudTimer = 0;
      const payload = this.cloudPending;
      this.cloudPending = null;
      if (!payload) return;
      this.lastCloudWrite = Date.now();
      try {
        this.player.setData({ save: payload }, immediate).catch(() => undefined);
      } catch { /* ignore */ }
    };
    if (immediate) {
      if (this.cloudTimer) clearTimeout(this.cloudTimer);
      flush();
      return;
    }
    if (this.cloudTimer) return;
    const wait = Math.max(0, 20_000 - (Date.now() - this.lastCloudWrite));
    this.cloudTimer = setTimeout(flush, wait);
  }

  // ---------------- misc ----------------
  async submitScore(value: number) {
    try {
      const lb = this.ysdk?.leaderboards ?? (await this.ysdk?.getLeaderboards?.());
      await lb?.setScore?.('vaultRating', Math.floor(value));
      await lb?.setLeaderboardScore?.('vaultRating', Math.floor(value));
    } catch { /* leaderboard may not be configured */ }
  }

  async canReview(): Promise<boolean> {
    try {
      const r = await this.ysdk?.feedback?.canReview?.();
      return !!r?.value;
    } catch {
      return false;
    }
  }

  async requestReview() {
    try {
      await this.ysdk?.feedback?.requestReview?.();
    } catch { /* ignore */ }
  }

  serverTime(): number {
    try {
      const t = this.ysdk?.serverTime?.();
      if (typeof t === 'number' && t > 0) return t;
    } catch { /* ignore */ }
    return Date.now();
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Local stand-in for a rewarded video (dev builds / portals without SDK). */
function mockAdOverlay(lang: string): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'mock-ad';
    el.innerHTML = `<div class="mock-ad-box"><div class="mock-ad-title">${lang === 'ru' ? 'Реклама (тест)' : 'Ad (test)'}</div><div class="mock-ad-bar"><i></i></div></div>`;
    document.body.appendChild(el);
    const bar = el.querySelector('i') as HTMLElement;
    requestAnimationFrame(() => {
      bar.style.transition = 'width 1.2s linear';
      bar.style.width = '100%';
    });
    setTimeout(() => {
      el.remove();
      resolve();
    }, 1300);
  });
}

export const platform = new Platform();
export type { AnyFn };
