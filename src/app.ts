import { platform } from './platform/sdk';
import { Game, TUTORIAL_DONE } from './sim/game';
import type { GameState, Room, Dweller, Item } from './sim/types';
import { SaveManager } from './core/save';
import { Renderer } from './render/renderer';
import { Input } from './render/input';
import { audio } from './audio/audio';
import { store } from './ui/store';
import { L, t, getLang, setLang } from './i18n';
import { ROOMS, type RoomType } from './data/rooms';
import { STATS } from './data/stats';
import { INCIDENT_NAMES } from './sim/incidents';
import { dwellerName } from './sim/dwellers';
import { roomW, roomX, roomY, FLOOR_H } from './render/world';
import { MISSION_BY_ID } from './data/missions';
import { fmtInt } from './core/util';

const STEP = 0.1;

export class App {
  g!: Game;
  r!: Renderer;
  input!: Input;
  saves = new SaveManager();
  private last = 0;
  private acc = 0;
  private saveT = 0;
  private hiddenAt = 0;
  private alarmT = 0;
  private lastInterstitial = Date.now();
  private started = false;
  private unsub: (() => void)[] = [];
  canvas: HTMLCanvasElement;
  onTutorialEvent: (ev: string, payload?: any) => void = () => undefined;

  constructor() {
    this.canvas = document.getElementById('world') as HTMLCanvasElement;
  }

  hasSave = false;
  pendingState: GameState | null = null;

  async boot() {
    this.pendingState = await this.saves.load();
    this.hasSave = !!this.pendingState;
    if (this.pendingState?.settings.lang === 'ru' || this.pendingState?.settings.lang === 'en') setLang(this.pendingState.settings.lang as any);
    // a preview game behind the title screen
    const s = this.pendingState ?? Game.newState(111);
    this.attach(new Game(s), !this.pendingState);
    platform.onPauseChange((paused, reason) => this.onPause(paused, reason));
    requestAnimationFrame(this.loop);
  }

  private attach(g: Game, preview: boolean) {
    for (const u of this.unsub) u();
    this.unsub = [];
    this.g = g;
    if (!this.r) {
      this.r = new Renderer(this.canvas, g);
      this.r.resize();
      window.addEventListener('resize', () => this.r.resize());
      this.input = new Input(this.canvas, this.r, {
        onTap: (hit, sx, sy) => this.onTap(hit, sx, sy),
        canDrag: (d) => !d.exploring && !d.child && store.s.screen === 'game',
        onDrop: (d, room, wx) => this.onDrop(d, room, wx),
        onInteract: () => audio.unlock(),
      });
    } else this.r.setGame(g);
    this.r.hudTarget = hudTarget;
    this.r.quality = g.s.settings.quality;
    this.applySettings();
    if (!preview) this.wire();
    // start camera at the vault entrance
    this.r.cam.zoom = this.defaultZoom();
    this.r.cam.x = 170;
    this.r.cam.y = 110;
    this.r.cam.clampPos();
  }

  /** Comfortable zoom: about one room wide in portrait, four to five rooms on desktop. */
  defaultZoom() {
    const cam = this.r.cam;
    const portrait = cam.H > cam.W;
    const z = portrait ? cam.W / 300 : Math.min(cam.W / 620, cam.H / 420);
    return Math.max(cam.minZoom, Math.min(1.7, z));
  }

  applySettings() {
    const st = this.g.s.settings;
    audio.setVolumes(st.sfx, st.music);
    audio.setMusic(st.music > 0);
    this.r.quality = st.quality;
    this.r.resize();
  }

  /** Start playing a (new or loaded) game. */
  startGame(state?: GameState) {
    const s = state ?? this.pendingState!;
    const g = new Game(s);
    this.attach(g, false);
    this.started = true;
    // offline progress
    const away = (Date.now() - (s.realLast || Date.now())) / 1000;
    if (away > 45 && s.tutorial >= TUTORIAL_DONE) {
      const rep = g.simulateOffline(away);
      if (rep && away > 240) store.pushModal({ type: 'welcome', report: rep });
    }
    g.fillObjectives();
    this.saveNow();
    store.set({ screen: 'game' });
    platform.setGameplayWanted(true);
    if (g.dailyAvailable() && s.tutorial >= TUTORIAL_DONE) setTimeout(() => store.toast(t('toast_daily'), 'great', 'gift'), 2500);
  }

  newGame(vault: number) {
    const s = Game.newState(vault);
    s.settings.lang = getLang();
    this.pendingState = s;
    this.startGame(s);
  }

  private wire() {
    const g = this.g;
    const ev = g.ev;
    const on = <K extends Parameters<typeof ev.on>[0]>(k: K, f: (p: any) => void) => this.unsub.push(ev.on(k as any, f));
    on('toast', (p) => {
      store.toast(p.text, p.kind === 'good' ? 'good' : p.kind, p.icon);
      if (p.kind === 'bad') audio.play('error');
    });
    on('collect', (p) => this.fxCollect(p.room, p.items, p.bonus, p.auto));
    on('build_start', (p) => {
      audio.play('build');
      this.r.shake = 0.25;
      const r: Room = p.room;
      for (let i = 0; i < 12; i++) this.r.fx.emit('dust', roomX(r) + Math.random() * roomW(r), roomY(r) + 100, 1);
      this.dirty();
    });
    on('built', (p) => {
      audio.play('built');
      const r: Room = p.room;
      this.r.fx.emit('confetti', roomX(r) + roomW(r) / 2, roomY(r) + 40, 16);
      if (r.type !== 'elevator') store.toast(t('built_room', { room: L(ROOMS[r.type].name) }), 'good', 'hammer');
      this.onTutorialEvent('built', r);
      this.checkUnlocks();
      this.dirty();
    });
    on('merged', (p) => {
      store.toast(t('merged_room'), 'great', 'upgrade');
      const r: Room = p.room;
      this.r.fx.emit('star', roomX(r) + roomW(r) / 2, roomY(r) + 60, 14);
    });
    on('upgraded', (p) => {
      audio.play('upgrade');
      const r: Room = p.room;
      this.r.fx.emit('star', roomX(r) + roomW(r) / 2, roomY(r) + 60, 18);
      this.dirty();
    });
    on('levelup', (p) => {
      const d: Dweller = p.d;
      audio.play('levelup');
      const a = this.r.actors.get(d.id);
      if (a) this.r.fx.emit('star', a.x, a.y - 44, 8);
    });
    on('statup', (p) => {
      const d: Dweller = p.d;
      audio.play('statup');
      const a = this.r.actors.get(d.id);
      if (a) this.r.fx.floatText(a.x, a.y - 52, `+1 ${L(STATS[p.stat].short)}`, STATS[p.stat].color);
    });
    on('arrive', () => {
      audio.play('toast');
      this.dirty();
    });
    on('admitted', () => {
      audio.play('door');
      this.onTutorialEvent('admitted');
      this.checkUnlocks();
    });
    on('assign', (p) => this.onTutorialEvent('assign', p));
    on('baby', (p) => {
      audio.play('baby');
      const a = this.r.actors.get(p.mom.id);
      if (a) this.r.fx.emit('confetti', a.x, a.y - 30, 20);
      this.checkUnlocks();
    });
    on('grown', (p) => store.toast(t('toast_grown', { n: p.d.first }), 'good', 'dweller'));
    on('pregnant', (p) => {
      store.toast(t('toast_pregnant', { a: p.dad.first, b: p.mom.first }), 'great', 'heart');
      const a = this.r.actors.get(p.mom.id);
      if (a) this.r.fx.emit('heart', a.x, a.y - 40, 10);
    });
    on('incident', (p) => {
      audio.play('alarm');
      const r: Room = p.room;
      store.toast(t('toast_incident', { k: L(INCIDENT_NAMES[p.kind as keyof typeof INCIDENT_NAMES]) }), 'bad', 'alert');
      this.r.shake = 0.35;
      void r;
    });
    on('incident_end', (p) => {
      audio.play('objective');
      store.toast(t('toast_incident_end', { n: p.reward }), 'good', 'nuts');
      const r: Room = p.room;
      this.r.fx.floatText(roomX(r) + roomW(r) / 2, roomY(r) + 40, '+' + p.reward, '#ffe27a', 'nuts');
    });
    on('revived', (p) => {
      audio.play('heal');
      store.toast(t('toast_revived', { n: dwellerName(p.d) }), 'good', 'heart');
    });
    on('heal', (p) => {
      audio.play('heal');
      const a = this.r.actors.get(p.d.id);
      if (a) this.r.fx.emit('heart', a.x, a.y - 40, 5);
    });
    on('rush', (p) => {
      const r: Room = p.room;
      if (p.ok) {
        audio.play('rush_ok');
        this.r.fx.floatText(roomX(r) + roomW(r) / 2, roomY(r) + 50, '+' + p.bonus, '#ffe27a', 'nuts');
        this.r.fx.emit('star', roomX(r) + roomW(r) / 2, roomY(r) + 60, 10);
      } else {
        audio.play('rush_fail');
        this.r.shake = 0.6;
        store.toast(t('toast_rush_fail'), 'bad', 'alert');
      }
      this.onTutorialEvent('rush', p);
    });
    on('explore_start', () => audio.play('explore'));
    on('explorer_home', (p) => {
      audio.play('home');
      store.pushModal({ type: 'explorer', exp: p.e, name: dwellerName(p.d) });
    });
    on('cat', (p) => {
      if (p.room) {
        audio.play('cat');
        store.toast(t('toast_cat'), 'great', 'cat');
      }
    });
    on('cat_caught', (p) => {
      audio.play('coin');
      const r: Room = p.room;
      this.r.fx.emit('confetti', roomX(r) + roomW(r) * 0.72, roomY(r) + 80, 24);
      this.r.fx.floatText(roomX(r) + roomW(r) * 0.72, roomY(r) + 60, '+' + p.nuts, '#ffe27a', 'nuts');
      store.toast(t('toast_cat_caught', { n: p.nuts }), 'great', 'cat');
      const s = this.r.cam.toScreen(roomX(r) + roomW(r) * 0.72, roomY(r) + 80);
      const hud = hudTarget('nuts');
      if (hud) this.r.fx.fly(s.x, s.y, hud.x, hud.y, 'nuts', 10);
    });
    on('objective_ready', () => {
      audio.play('objective');
      store.toast(t('obj_ready'), 'great', 'objectives');
      store.pulse('objectives');
    });
    on('dawn_stage', (p) => {
      audio.play('legendary');
      store.pushModal({ type: 'dawnStage', stage: p.stage });
    });
    on('power', (p) => {
      if (!p.on) store.toast(t('toast_blackout'), 'bad', 'power');
      else store.toast(t('toast_power_back'), 'good', 'power');
    });
    on('rock_cleared', (p) => {
      this.r.bg.forgetRock(p.rock.id);
      for (let i = 0; i < 24; i++) this.r.fx.emit('dust', p.rock.col * 70 + Math.random() * p.rock.w * 70, roomYFloor(p.rock.floor) + 30 + Math.random() * 70, 1);
      audio.play('build');
      store.toast(p.text ?? t('toast_rock'), p.text ? 'great' : 'good', 'hammer');
    });
    on('craft_done', () => {
      store.toast(t('toast_craft_done'), 'good', 'craft');
      audio.play('objective');
    });
    on('robot_collect', (p) => this.r.robotGoTo(p.robot, p.room));
    on('chatter', (p) => this.r.onChatter(p.d, p.text));
    on('mission_arrived', () => {
      store.toast(t('toast_mission_arrived'), 'great', 'mission');
      audio.play('objective');
      store.pulse('missions');
    });
    on('ko', () => audio.play('error'));
    on('equip', () => this.dirty());
  }

  private lastUnlockPop = -1;
  checkUnlocks() {
    const pop = this.g.maxPopReached();
    if (this.lastUnlockPop < 0) {
      this.lastUnlockPop = pop;
      return;
    }
    for (const tp of Object.keys(ROOMS) as RoomType[]) {
      const u = ROOMS[tp].unlockPop;
      if (u > this.lastUnlockPop && u <= pop && ROOMS[tp].buildable) {
        store.toast(t('toast_new_room', { n: L(ROOMS[tp].name) }), 'great', 'hammer');
        store.pulse('build');
      }
    }
    this.lastUnlockPop = pop;
  }

  private fxCollect(r: Room, items: { kind: string; amount: number }[], bonus: number, auto: boolean) {
    const x = roomX(r) + roomW(r) / 2;
    const y = roomY(r) + 40;
    const s = this.r.cam.toScreen(x, y);
    let dy = 0;
    for (const it of items) {
      const icon = it.kind === 'medkit' ? 'medkit' : it.kind === 'antirad' ? 'antirad' : it.kind === 'dawn' ? 'dawn' : it.kind;
      this.r.fx.floatText(x, y - dy, '+' + fmtInt(it.amount), '#ffffff', icon);
      dy += 18;
      const hud = hudTarget(icon);
      if (hud) this.r.fx.fly(s.x, s.y, hud.x, hud.y, icon, auto ? 2 : 5, () => store.pulse(icon));
    }
    if (bonus) {
      this.r.fx.floatText(x, y - dy, '+' + bonus, '#ffe27a', 'nuts');
      const hud = hudTarget('nuts');
      if (hud) this.r.fx.fly(s.x, s.y, hud.x, hud.y, 'nuts', 4);
      audio.play('coin');
    }
    const k = items[0]?.kind;
    audio.play(k === 'power' ? 'collect_power' : k === 'food' ? 'collect_food' : k === 'water' ? 'collect_water' : 'collect_med');
    if (!auto) this.r.celebrateRoom(r);
    this.onTutorialEvent('collect', r);
  }

  // ---------------------------------------------------------------- input routing
  private onTap(hit: ReturnType<Renderer['hitTest']>, sx: number, sy: number) {
    if (store.s.screen !== 'game') return;
    const g = this.g;
    // robot floor assignment mode
    if (store.s.robotAssign != null) {
      if (hit && hit.kind === 'room') {
        const rb = g.s.robots.find((x) => x.id === store.s.robotAssign);
        if (rb) {
          for (const o of g.s.robots) if (o.floor === hit.room.floor && o !== rb) o.floor = -1;
          rb.floor = hit.room.floor;
          audio.play('built');
          store.toast(t('robot_floor', { n: hit.room.floor + 1 }), 'good', 'robot');
        }
      }
      this.r.robotPick = false;
      store.set({ robotAssign: null });
      return;
    }
    if (store.s.buildMode) {
      if (hit?.kind === 'spot') {
        const tp = store.s.buildMode as RoomType;
        const tut = g.s.tutorial < TUTORIAL_DONE;
        const room = g.build(tp, hit.floor, hit.col, tut && tp !== 'elevator');
        if (room) {
          this.exitBuild();
          this.saveNow();
        } else {
          audio.play('error');
          store.toast(t('toast_no_nuts'), 'bad', 'nuts');
        }
        return;
      }
      if (!hit || hit.kind !== 'bubble') {
        this.exitBuild();
        return;
      }
    }
    if (!hit) {
      audio.play('click');
      this.closePanels();
      return;
    }
    switch (hit.kind) {
      case 'bubble':
        g.collect(hit.room);
        break;
      case 'craft': {
        const it = g.collectCraft(hit.room);
        if (it) {
          const x = roomX(hit.room) + roomW(hit.room) / 2;
          this.r.fx.floatText(x, roomY(hit.room) + 40, g.itemName(it), '#ffe27a', it.kind === 'weapon' ? 'weapon' : 'outfit');
          this.r.fx.emit('star', x, roomY(hit.room) + 50, 12);
          audio.play('built');
        }
        break;
      }
      case 'cat':
        g.catchCat();
        break;
      case 'dweller': {
        audio.play('click');
        const d = hit.d;
        if (d.lvlPending > 0 && g.ackLevel(d)) {
          const a = this.r.actors.get(d.id);
          if (a) {
            a.celebrate = 1.4;
            this.r.fx.emit('confetti', a.x, a.y - 40, 14);
          }
          store.toast(t('toast_levelup', { n: dwellerName(d), l: d.level }), 'great', 'levelup');
          audio.play('upgrade');
        }
        this.r.selectedDweller = d.id;
        this.r.selectedRoom = null;
        store.openPanel({ type: 'dweller', id: d.id });
        this.onTutorialEvent('tap_dweller', d);
        break;
      }
      case 'room':
        audio.play('open');
        this.r.selectedRoom = hit.room.id;
        this.r.selectedDweller = null;
        store.openPanel({ type: 'room', id: hit.room.id });
        this.onTutorialEvent('tap_room', hit.room);
        break;
      case 'rock':
        audio.play('click');
        store.openPanel({ type: 'rock', id: hit.id });
        break;
      case 'robot':
        audio.play('click');
        store.openPanel({ type: 'robots' });
        break;
      case 'spot':
        break;
    }
    void sx;
    void sy;
  }

  private onDrop(d: Dweller, room: Room | undefined, wx: number) {
    const g = this.g;
    audio.play('drop');
    if (!room) return;
    const ok = g.canAssign(d, room) ? g.assign(d, room) : g.swapInto(d, room);
    if (!ok) {
      audio.play('error');
      store.toast(room.type === 'elevator' || g.roomCap(room) === 0 ? t('toast_cant_assign') : d.room === -1 && g.population() >= g.capacity() ? t('toast_vault_full') : t('toast_room_full'), 'bad');
      return;
    }
    const a = this.r.actors.get(d.id);
    if (a) {
      this.r.actors.placeInRoom(a, room, wx);
      a.celebrate = 0.8;
    }
    this.r.fx.emit('dust', wx, roomY(room) + 106, 6);
    this.dirty();
  }

  enterBuild(type: RoomType) {
    const g = this.g;
    const spots = g.buildSpots(type);
    if (!spots.length) {
      store.toast(t('no_spots'), 'bad');
      return;
    }
    this.r.buildType = type;
    this.r.buildSpots = spots;
    store.set({ buildMode: type, panel: null });
    // make sure the most relevant spot is on screen
    const cam = this.r.cam;
    const v = cam.viewRect();
    const w = ROOMS[type].cells * 70;
    const inView = (s: { floor: number; col: number }) => s.col * 70 >= v.l && s.col * 70 + w <= v.r && roomYFloor(s.floor) >= v.t + 60 / cam.zoom && roomYFloor(s.floor) + FLOOR_H <= v.b - 90 / cam.zoom;
    const best = g.s.tutorial < TUTORIAL_DONE ? spots[0] : spots.slice().sort((a, b) => Math.hypot(a.col * 70 + w / 2 - cam.x, roomYFloor(a.floor) + 60 - cam.y) - Math.hypot(b.col * 70 + w / 2 - cam.x, roomYFloor(b.floor) + 60 - cam.y))[0];
    if (!inView(best)) cam.focus(best.col * 70 + w / 2, roomYFloor(best.floor) + 60, Math.max(cam.zoom, Math.min(1.2, cam.W / 700)), 0.5);
  }

  exitBuild() {
    this.r.buildType = null;
    this.r.buildSpots = [];
    store.set({ buildMode: null });
  }

  closePanels() {
    this.r.selectedRoom = null;
    this.r.selectedDweller = null;
    store.openPanel(null);
  }

  // ---------------------------------------------------------------- ads
  async rewarded(): Promise<boolean> {
    audio.setMuted(true);
    platform.setGameplayWanted(false);
    const res = await platform.showRewarded();
    platform.setGameplayWanted(store.s.screen === 'game');
    audio.setMuted(platform.paused);
    this.lastInterstitial = Date.now();
    if (!res.rewarded) store.toast(t('ad_failed'), 'bad', 'video');
    return res.rewarded;
  }

  /** Interstitial at natural pauses only. */
  async maybeInterstitial(force = false) {
    if (this.g.s.tutorial < TUTORIAL_DONE && !force) return;
    if (!force && Date.now() - this.lastInterstitial < 210_000) return;
    if (!platform.canShowFullscreen() && !force) return;
    this.lastInterstitial = Date.now();
    this.saveNow();
    audio.setMuted(true);
    platform.setGameplayWanted(false);
    await platform.showFullscreen(force);
    platform.setGameplayWanted(store.s.screen === 'game');
    audio.setMuted(platform.paused);
  }

  // ---------------------------------------------------------------- lifecycle
  private onPause(paused: boolean, reason: string) {
    audio.setMuted(paused);
    if (paused && reason === 'hidden') {
      this.hiddenAt = Date.now();
      if (this.started) this.saveNow(true);
    }
    if (!paused && this.hiddenAt && this.started) {
      const away = (Date.now() - this.hiddenAt) / 1000;
      this.hiddenAt = 0;
      if (away > 20) {
        const rep = this.g.simulateOffline(away);
        if (rep && away > 600) store.pushModal({ type: 'welcome', report: rep });
      }
      this.last = performance.now();
    }
  }

  private dirtyFlag = false;
  dirty() {
    this.dirtyFlag = true;
  }

  saveNow(immediate = false) {
    if (!this.started) return;
    this.g.s.settings.lang = getLang();
    // keep the save compact: trim expedition logs
    for (const e of this.g.s.expeditions) if (e.log.length > 40) e.log.splice(0, e.log.length - 40);
    this.saves.save(this.g.s, immediate);
  }

  private loop = (now: number) => {
    requestAnimationFrame(this.loop);
    let dt = (now - (this.last || now)) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25;
    if (platform.paused && document.hidden) return;
    const paused = platform.paused;
    if (this.started && !paused && store.s.screen === 'game') {
      this.acc += dt;
      let n = 0;
      while (this.acc >= STEP && n < 10) {
        this.g.tick(STEP);
        this.acc -= STEP;
        n++;
      }
      // incident alarm loop
      if (this.g.s.rooms.some((r) => r.incident)) {
        this.alarmT -= dt;
        if (this.alarmT <= 0) {
          this.alarmT = 2.4;
          audio.play('alarm');
        }
      }
      this.saveT += dt;
      if (this.saveT > 15 || (this.dirtyFlag && this.saveT > 3)) {
        this.saveT = 0;
        this.dirtyFlag = false;
        this.saveNow();
      }
      this.submitT -= dt;
      if (this.submitT <= 0) {
        this.submitT = 120;
        platform.submitScore(this.g.rating());
      }
    }
    this.input.update(dt);
    this.r.frame(paused ? 0 : dt);
  };
  private submitT = 60;

  // ---------------------------------------------------------------- helpers used by UI
  itemsFor(slot: 'weapon' | 'outfit' | 'pet'): Item[] {
    return this.g.storedItems().filter((i) => i.kind === slot);
  }

  focusRoom(r: Room) {
    this.r.focusRoom(r);
  }

  missionName(id: string) {
    return L(MISSION_BY_ID[id]?.name);
  }
}

function roomYFloor(f: number) {
  return 46 + f * FLOOR_H;
}

/** HUD element screen centers (css px) for fly-to-HUD effects. */
export function hudTarget(kind: string): { x: number; y: number } | null {
  const el = document.querySelector(`[data-hud="${kind}"]`) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width) return null;
  return { x: r.left + Math.min(r.width / 2, 18), y: r.top + r.height / 2 };
}

export const app = new App();
