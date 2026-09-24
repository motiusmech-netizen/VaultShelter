import { useEffect, useState } from 'preact/hooks';
import type { Card } from '../sim/crates';
import type { Expedition, MissionRun } from '../sim/types';
import type { OfflineReport } from '../sim/game';

export type Panel =
  | { type: 'room'; id: number }
  | { type: 'dweller'; id: number }
  | { type: 'build' }
  | { type: 'dwellers'; pickFor?: { room?: number; explore?: boolean; mission?: string } }
  | { type: 'storage'; tab?: string; pick?: { dweller: number; slot: 'weapon' | 'outfit' | 'pet' } }
  | { type: 'wasteland' }
  | { type: 'objectives' }
  | { type: 'shop' }
  | { type: 'dawn' }
  | { type: 'missions' }
  | { type: 'settings' }
  | { type: 'rock'; id: number }
  | { type: 'robots' }
  | { type: 'explore'; dweller: number }
  | { type: 'assign'; dweller: number }
  | { type: 'craft'; room: number }
  | { type: 'item'; uid: number }
  | { type: 'help' };

export type Modal =
  | { type: 'crate'; cards: Card[]; legendary?: boolean }
  | { type: 'welcome'; report: OfflineReport }
  | { type: 'explorer'; exp: Expedition; name: string }
  | { type: 'confirm'; text: string; onYes: () => void; yes?: string; danger?: boolean }
  | { type: 'message'; title: string; text: string; icon?: string }
  | { type: 'battle'; run: MissionRun }
  | { type: 'missionResult'; run: MissionRun }
  | { type: 'dawnStage'; stage: number }
  | { type: 'rename'; dweller: number }
  | { type: 'daily' };

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'good' | 'bad' | 'great';
  icon?: string;
  t: number;
}

export interface UIState {
  screen: 'loading' | 'title' | 'vaultpick' | 'intro' | 'game';
  panel: Panel | null;
  modals: Modal[];
  toasts: Toast[];
  buildMode: string | null;
  robotAssign: number | null;
  hudPulse: Record<string, number>;
  version: number;
}

class Store {
  s: UIState = {
    screen: 'loading',
    panel: null,
    modals: [],
    toasts: [],
    buildMode: null,
    robotAssign: null,
    hudPulse: {},
    version: 0,
  };
  private subs = new Set<() => void>();
  private toastId = 1;

  set(p: Partial<UIState>) {
    Object.assign(this.s, p);
    this.bump();
  }
  bump() {
    this.s.version++;
    for (const f of this.subs) f();
  }
  subscribe(f: () => void) {
    this.subs.add(f);
    return () => this.subs.delete(f);
  }
  openPanel(p: Panel | null) {
    this.s.panel = p;
    this.bump();
  }
  pushModal(m: Modal) {
    this.s.modals = [...this.s.modals, m];
    this.bump();
  }
  popModal() {
    this.s.modals = this.s.modals.slice(0, -1);
    this.bump();
  }
  toast(text: string, kind: Toast['kind'] = 'info', icon?: string) {
    const id = this.toastId++;
    // de-duplicate identical recent toasts
    if (this.s.toasts.some((t) => t.text === text)) return;
    this.s.toasts = [...this.s.toasts.slice(-3), { id, text, kind, icon, t: Date.now() }];
    this.bump();
    setTimeout(() => {
      this.s.toasts = this.s.toasts.filter((t) => t.id !== id);
      this.bump();
    }, 3600);
  }
  pulse(key: string) {
    this.s.hudPulse = { ...this.s.hudPulse, [key]: Date.now() };
  }
}

export const store = new Store();

/** Re-render on store changes. */
export function useStore(): UIState {
  const [, set] = useState(0);
  const seen = store.s.version;
  useEffect(() => {
    const un = store.subscribe(() => set((v) => v + 1));
    // catch updates that happened between render and subscription
    if (store.s.version !== seen) set((v) => v + 1);
    return un;
  }, []);
  return store.s;
}

/** Re-render periodically (for timers). */
export function useTicker(ms = 250) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((v) => v + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}
