import { useEffect, useRef, useState } from 'preact/hooks';
import { app } from '../app';
import { store, useStore, type Modal as M } from './store';
import { Avatar, Btn, Icon, ItemPic, Modal, Price } from './kit';
import { L, t, getLang } from '../i18n';
import { fmtInt, fmtTime, rand, clamp } from '../core/util';
import { audio } from '../audio/audio';
import { RARITY_COLORS, RARITY_NAMES, PET_BY_ID } from '../data/items';
import { DAWN_STAGES } from '../data/dawn';
import { MISSION_BY_ID } from '../data/missions';
import { LEGENDS } from '../data/names';
import type { Card } from '../sim/crates';
import type { Item, MissionRun } from '../sim/types';
import { dwellerName, statTotal, weaponDamage } from '../sim/dwellers';
import { S_AGI, S_STR, S_PER } from '../data/stats';
import { drawCharacter, DEFAULT_POSE, muzzlePoint } from '../render/dwellerArt';
import { outfitOf, weaponOf } from '../render/actors';
import { drawBug, drawMole, drawPet, drawRobot, drawSpikeback, raiderSpec, type RaiderSpec } from '../render/creatures';
import { FISTS, isMelee, weaponProfile } from '../render/weaponArt';
import type { WeaponDef } from '../data/items';
import { RewardChips } from './panelsMeta';
import { Game } from '../sim/game';

export function Modals() {
  const st = useStore();
  const m = st.modals[st.modals.length - 1];
  if (!m) return null;
  switch (m.type) {
    case 'crate':
      return <CrateModal m={m} />;
    case 'welcome':
      return <WelcomeModal m={m} />;
    case 'explorer':
      return <ExplorerModal m={m} />;
    case 'confirm':
      return <ConfirmModal m={m} />;
    case 'message':
      return (
        <Modal hero={<><Icon n={m.icon ?? 'info'} cls="xl" /><h2>{m.title}</h2></>} foot={<Btn onClick={() => store.popModal()}>{t('ok')}</Btn>}>
          <p class="small" style={{ textAlign: 'center', color: 'var(--txt2)' }}>{m.text}</p>
        </Modal>
      );
    case 'battle':
      return <BattleModal run={m.run} />;
    case 'missionResult':
      return <MissionResultModal run={m.run} />;
    case 'dawnStage':
      return <DawnStageModal stage={m.stage} />;
    case 'rename':
      return <RenameModal id={m.dweller} />;
    case 'daily':
      return <DailyModal />;
  }
  return null;
}

function close() {
  audio.play('close');
  store.popModal();
}

// ------------------------------------------------------------------ crate
function cardIcon(c: Card): string {
  switch (c.kind) {
    case 'nuts':
      return 'nuts';
    case 'res':
      return c.res!;
    case 'iso':
      return 'iso';
    case 'medkit':
      return 'medkit';
    case 'antirad':
      return 'antirad';
    case 'robot':
      return 'robot';
    default:
      return 'star';
  }
}

function cardName(c: Card): string {
  const g = app.g;
  switch (c.kind) {
    case 'nuts':
      return t('nuts');
    case 'res':
      return t(('res_' + c.res) as any);
    case 'iso':
      return t('iso');
    case 'medkit':
      return t('medkits');
    case 'antirad':
      return t('antirads');
    case 'robot':
      return t('robot_title');
    case 'dweller': {
      const d = c.ref ? g.dweller(c.ref) : undefined;
      return d ? dwellerName(d) : '';
    }
    default: {
      const it = c.ref ? g.s.items.find((i) => i.uid === c.ref) : undefined;
      return it ? g.itemName(it) : '';
    }
  }
}

function CrateModal({ m }: { m: Extract<M, { type: 'crate' }> }) {
  const [opened, setOpened] = useState(false);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false, false]);
  const all = flipped.every(Boolean);
  const g = app.g;
  const flip = (i: number) => {
    if (flipped[i]) return;
    const c = m.cards[i];
    audio.play(c.rarity === 2 ? 'legendary' : 'card');
    const f = flipped.slice();
    f[i] = true;
    setFlipped(f);
    app.onTutorialEvent('card');
  };
  return (
    <div class="modal-back" onPointerDown={(e) => e.stopPropagation()}>
      <div class="crate-scene">
        <div class="modal-hero" style={{ background: 'none', padding: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', margin: 0, fontSize: '22px' }}>{m.legendary ? t('crate_legendary') : t('crate')}</h2>
          {!opened && <p class="muted" style={{ margin: '6px 0 0' }}>{t('crate_tap')}</p>}
        </div>
        {!opened ? (
          <img
            class="crate-box"
            src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(CRATE_SVG)}
            onClick={() => {
              audio.play('whoosh');
              setOpened(true);
            }}
            alt=""
            draggable={false}
          />
        ) : (
          <>
            <div class="cards">
              {m.cards.map((c, i) => (
                <div class={`pcard r${c.rarity} ${flipped[i] ? 'flipped' : ''}`} onClick={() => flip(i)} style={{ animation: `sheetIn .4s var(--ease) ${i * 0.08}s both` }}>
                  <div class="face back" />
                  <div class="face front">
                    <span class="rar" style={{ color: RARITY_COLORS[c.rarity] }}>
                      {L(RARITY_NAMES[c.rarity])}
                    </span>
                    <CardVisual c={c} />
                    <span class="nm">{cardName(c)}</span>
                    {c.amount ? <span class="amt">+{fmtInt(c.amount)}</span> : null}
                    {c.kind === 'dweller' && c.legend && <span class="pill gold">{L({ ru: 'Легенда', en: 'Legend' })}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div class="row" style={{ gap: '10px' }}>
              {!all && (
                <Btn kind="steel" onClick={() => m.cards.forEach((_, i) => setTimeout(() => flip(i), i * 160))}>
                  {L({ ru: 'Открыть все', en: 'Reveal all' })}
                </Btn>
              )}
              {all && (
                <Btn
                  kind="green"
                  size="big"
                  onClick={() => {
                    store.popModal();
                    app.saveNow();
                    app.onTutorialEvent('crate_closed');
                    app.maybeInterstitial();
                  }}
                >
                  {t('crate_take')}
                </Btn>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
  void g;
}

function CardVisual({ c }: { c: Card }) {
  const g = app.g;
  if (c.kind === 'dweller') {
    const d = c.ref ? g.dweller(c.ref) : undefined;
    return d ? <Avatar d={d} /> : <Icon n="dweller" />;
  }
  if (c.kind === 'weapon' || c.kind === 'outfit' || c.kind === 'junk' || c.kind === 'pet') {
    const it = c.ref ? g.s.items.find((i) => i.uid === c.ref) : undefined;
    return it ? <ItemPic it={it} size={72} /> : <Icon n="star" />;
  }
  return <Icon n={cardIcon(c)} />;
}

const CRATE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 150">
<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f9ae0"/><stop offset="1" stop-color="#2b5f9a"/></linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e0a020"/></linearGradient>
<radialGradient id="g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf4a" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="85" cy="75" rx="85" ry="70" fill="url(#g)"/>
<rect x="18" y="52" width="134" height="88" rx="10" fill="url(#a)" stroke="#16304f" stroke-width="4"/>
<path d="M12 50 L30 22 H140 L158 50 Z" fill="#7fb3f0" stroke="#16304f" stroke-width="4" stroke-linejoin="round"/>
<rect x="72" y="22" width="26" height="118" fill="url(#b)" stroke="#16304f" stroke-width="3"/>
<circle cx="85" cy="88" r="17" fill="#fff4c8" stroke="#16304f" stroke-width="3"/>
<g stroke="#b8740f" stroke-width="3" fill="none"><ellipse cx="85" cy="88" rx="11" ry="4.5"/><ellipse cx="85" cy="88" rx="11" ry="4.5" transform="rotate(60 85 88)"/><ellipse cx="85" cy="88" rx="11" ry="4.5" transform="rotate(-60 85 88)"/></g>
<rect x="26" y="62" width="40" height="6" rx="3" fill="#ffffff" opacity=".25"/>
</svg>`;

// ------------------------------------------------------------------ welcome back
function WelcomeModal({ m }: { m: Extract<M, { type: 'welcome' }> }) {
  const r = m.report;
  const [doubled, setDoubled] = useState(false);
  const g = app.g;
  const lines: [string, string][] = [];
  if (r.ready) lines.push(['power', t('away_ready', { n: r.ready })]);
  if (r.babies) lines.push(['baby', t('away_babies', { n: r.babies })]);
  if (r.statups) lines.push(['stat_str', t('away_statups', { n: r.statups })]);
  if (r.levelups) lines.push(['levelup', t('away_levelups', { n: r.levelups })]);
  if (r.wasteNuts) lines.push(['wasteland', t('away_waste', { n: r.wasteNuts })]);
  const done = () => {
    store.popModal();
    app.maybeInterstitial();
  };
  return (
    <Modal
      hero={
        <>
          <Icon n="door" cls="xl" />
          <h2>{t('welcome_back')}</h2>
          <p>{t('away_for', { t: fmtTime(r.seconds, getLang()) })}</p>
        </>
      }
      foot={
        <>
          {!doubled && r.nuts > 0 && (
            <Btn
              ad
              onClick={async () => {
                if (await app.rewarded()) {
                  g.s.nuts += r.nuts;
                  store.pulse('nuts');
                  audio.play('coin');
                  setDoubled(true);
                }
              }}
            >
              {t('away_double')} <Price n={'+' + fmtInt(r.nuts)} />
            </Btn>
          )}
          <Btn kind="green" onClick={done}>
            {t('away_take')}
          </Btn>
        </>
      }
    >
      <div class="card row" style={{ justifyContent: 'center' }}>
        <span class="muted small">{t('away_nuts')}</span>
        <span class="rchip">
          <Icon n="nuts" />+{fmtInt(doubled ? r.nuts * 2 : r.nuts)}
        </span>
      </div>
      {lines.map(([ic, s]) => (
        <div class="card row small">
          <Icon n={ic} />
          {s}
        </div>
      ))}
    </Modal>
  );
}

// ------------------------------------------------------------------ explorer returned
function ExplorerModal({ m }: { m: Extract<M, { type: 'explorer' }> }) {
  const e = m.exp;
  return (
    <Modal
      hero={
        <>
          <Icon n="wasteland" cls="xl" />
          <h2>{t('waste_home_title')}</h2>
          <p>{t('waste_home_text', { n: m.name })}</p>
        </>
      }
      foot={
        <Btn
          kind="green"
          wide
          onClick={() => {
            store.popModal();
            app.maybeInterstitial();
          }}
        >
          {t('ok')}
        </Btn>
      }
    >
      <div class="reward-row">
        <span class="rchip">
          <Icon n="nuts" />+{fmtInt(e.nuts)}
        </span>
        <span class="rchip">
          <Icon n="xp" />+{fmtInt(e.xp)}
        </span>
        <span class="rchip">
          <Icon n="clock" />
          {fmtTime(e.elapsed, getLang())}
        </span>
      </div>
      {e.loot.length > 0 && (
        <>
          <div class="label">{t('waste_found')}</div>
          <div class="items">
            {e.loot.slice(0, 24).map((it: Item) => (
              <div class={`itile r${app.g.itemRarity(it)}`} style={{ minHeight: '96px' }}>
                <div class="pic">
                  <ItemPic it={it} />
                </div>
                <div class="nm" style={{ color: RARITY_COLORS[app.g.itemRarity(it)] }}>
                  {app.g.itemName(it)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {e.log.length > 0 && (
        <>
          <div class="label">{t('waste_log')}</div>
          <div class="log">
            {e.log
              .filter((l) => l.kind === 'fun' || l.kind === 'great')
              .slice(-4)
              .map((l) => (
                <div class={'e ' + l.kind}>
                  <span class="tm">•</span>
                  <span class="tx">{l.text}</span>
                </div>
              ))}
          </div>
        </>
      )}
    </Modal>
  );
}

function ConfirmModal({ m }: { m: Extract<M, { type: 'confirm' }> }) {
  return (
    <Modal
      hero={
        <>
          <Icon n={m.danger ? 'alert' : 'info'} cls="xl" />
          <h2 style={{ fontSize: '16px' }}>{m.text}</h2>
        </>
      }
      foot={
        <>
          <Btn kind="steel" onClick={close}>
            {t('cancel')}
          </Btn>
          <Btn
            kind={m.danger ? 'red' : 'green'}
            onClick={() => {
              store.popModal();
              m.onYes();
            }}
          >
            {m.yes ?? t('yes')}
          </Btn>
        </>
      }
    >
      {null}
    </Modal>
  );
}

function RenameModal({ id }: { id: number }) {
  const d = app.g.dweller(id);
  const [first, setFirst] = useState(d?.first ?? '');
  const [last, setLast] = useState(d?.last ?? '');
  if (!d) return null;
  return (
    <Modal
      hero={
        <>
          <Avatar d={d} />
          <h2>{t('d_rename')}</h2>
        </>
      }
      foot={
        <>
          <Btn kind="steel" onClick={close}>
            {t('cancel')}
          </Btn>
          <Btn
            kind="green"
            onClick={() => {
              app.g.rename(d, first.trim(), last.trim());
              store.popModal();
            }}
          >
            {t('confirm')}
          </Btn>
        </>
      }
    >
      <div class="col" style={{ gap: '8px' }}>
        <input class="text" value={first} maxLength={18} onInput={(e) => setFirst((e.target as HTMLInputElement).value)} />
        <input class="text" value={last} maxLength={22} onInput={(e) => setLast((e.target as HTMLInputElement).value)} />
      </div>
    </Modal>
  );
}

function DailyModal() {
  const g = app.g;
  const avail = g.dailyAvailable();
  const yesterday = Game.todayKey(Date.now() - 86400000);
  const day = avail ? (g.s.daily.last === yesterday ? (g.s.daily.day + 1) % 7 : 0) : g.s.daily.day;
  return (
    <Modal
      hero={
        <>
          <Icon n="gift" cls="xl" />
          <h2>{t('shop_daily')}</h2>
          <p>{t('shop_daily_day', { n: day + 1 })}</p>
        </>
      }
      onClose={close}
      foot={
        <Btn
          kind="green"
          wide
          disabled={!avail}
          onClick={() => {
            const res = g.claimDaily();
            store.popModal();
            if (res) {
              audio.play('objective');
              store.toast(t('shop_claimed') + '!', 'great', 'gift');
              if (res.reward.legendary) {
                const cards = g.openCrate(true);
                if (cards) store.pushModal({ type: 'crate', cards, legendary: true });
              }
            }
          }}
        >
          {t('shop_claim')}
        </Btn>
      }
    >
      <RewardChips r={DAILY_R(day)} />
    </Modal>
  );
}
import { DAILY_REWARDS } from '../sim/game';
const DAILY_R = (d: number) => DAILY_REWARDS[d];

// ------------------------------------------------------------------ dawn stage
function DawnStageModal({ stage }: { stage: number }) {
  const st = DAWN_STAGES[stage - 1];
  const final = stage >= DAWN_STAGES.length;
  useEffect(() => {
    const x = window.innerWidth / 2;
    for (let i = 0; i < 6; i++) setTimeout(() => app.r.fx.emit('confetti', app.r.cam.x, app.r.cam.y - 60, 30), i * 200);
    app.r.cam.focus(400, -60, Math.max(app.r.cam.minZoom, Math.min(1, app.r.cam.W / 1200)), 1.4);
    void x;
  }, []);
  return (
    <Modal
      hero={
        <>
          <Icon n="dawn" cls="xl" />
          <h2>{final ? t('dawn_done_all') : t('dawn_stage_done', { n: L(st.name) })}</h2>
          <p>{final ? L({ ru: 'Посмотрите на поверхность: жизнь вернулась! Спасибо, Смотритель.', en: 'Look at the surface: life is back! Thank you, Overseer.' }) : L(DAWN_STAGES[stage - 1].desc)}</p>
        </>
      }
      foot={
        <Btn
          kind="green"
          wide
          onClick={() => {
            store.popModal();
            app.closePanels();
          }}
        >
          {t('ok')}
        </Btn>
      }
    >
      <RewardChips r={{ nuts: st.reward.nuts, iso: st.reward.iso, crate: st.reward.crate }} />
    </Modal>
  );
}

// ------------------------------------------------------------------ mission battle
interface Fighter {
  side: 0 | 1;
  hp: number;
  max: number;
  dmg: number;
  cd: number;
  x: number;
  y: number;
  kind: string;
  id?: number;
  hitT: number;
  flash: number;
  /** attack animation 0..1, -1 idle */
  atk: number;
  /** who is being attacked (index into fs) */
  tgt: number;
  spec?: RaiderSpec;
}

interface ArenaShot {
  x: number;
  y: number;
  tx: number;
  ty: number;
  t: number;
  life: number;
  kind: string;
  color: string;
}

const easeQ = (u: number) => u * u * (3 - 2 * u);
/** 0..1 how far a melee attacker has dashed towards its target */
function dashOf(atk: number) {
  if (atk < 0) return 0;
  return atk < 0.42 ? easeQ(atk / 0.42) : atk < 0.62 ? 1 : 1 - easeQ((atk - 0.62) / 0.38);
}

function BattleModal({ run }: { run: MissionRun }) {
  const g = app.g;
  const gearOf = (f: Fighter): WeaponDef | null => (f.side === 0 ? (f.id ? weaponOf(g, g.dweller(f.id)!) : null) : f.spec?.weapon ?? null);
  const m = MISSION_BY_ID[run.id];
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'fight' | 'win' | 'lose'>('fight');
  const [crits, setCrits] = useState(0);
  const sim = useRef<{ fs: Fighter[]; ring: number; floats: { x: number; y: number; s: string; t: number; c: string }[]; over: boolean; crit: number; auto: boolean; shots: ArenaShot[] }>();
  if (!sim.current) {
    const fs: Fighter[] = [];
    run.team.forEach((id, i) => {
      const d = g.dweller(id);
      if (!d) return;
      fs.push({
        side: 0,
        hp: Math.max(20, d.hp),
        max: d.maxHp,
        dmg: weaponDamage(g.s, d) * 1.3 + d.level * 0.4 + statTotal(g.s, d, S_STR) * 0.35 + statTotal(g.s, d, S_PER) * 0.2,
        cd: 0.4 + i * 0.3,
        x: 0.14 + i * 0.1,
        y: 0.8 - (i % 2) * 0.06,
        kind: 'd',
        id,
        hitT: 0,
        flash: 0,
        atk: -1,
        tgt: -1,
      });
    });
    const n = m.diff < 2 ? 2 : 3;
    for (let i = 0; i < n; i++)
      fs.push({ side: 1, hp: 18 * m.diff, max: 18 * m.diff, dmg: 2.4 * m.diff, cd: 0.8 + i * 0.35, x: 0.66 + i * 0.1, y: 0.8 - (i % 2) * 0.06, kind: m.enemies[0].kind, hitT: 0, flash: 0, atk: -1, tgt: -1, spec: m.enemies[0].kind === 'raider' ? raiderSpec(i * 17 + m.diff * 3 + 5) : undefined });
    sim.current = { fs, ring: 0, floats: [], over: false, crit: 0, auto: false, shots: [] };
  }
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    let last = performance.now();
    let tt = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tt += dt;
      const S = sim.current!;
      const W = c.clientWidth;
      const H = c.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== W * dpr) {
        c.width = W * dpr;
        c.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // update
      S.ring = (S.ring + dt * 0.9) % 1;
      if (!S.over) {
        for (const f of S.fs) {
          if (f.hp <= 0) continue;
          f.cd -= dt;
          f.hitT = Math.max(0, f.hitT - dt);
          f.flash = Math.max(0, f.flash - dt);
          if (f.cd <= 0) {
            const foes = S.fs.filter((o) => o.side !== f.side && o.hp > 0);
            if (!foes.length) break;
            const tgt = foes[Math.floor(Math.random() * foes.length)];
            let dmg = f.dmg * rand(0.8, 1.2);
            if (f.side === 0 && S.crit > 0) {
              dmg *= 3;
              S.crit--;
              S.floats.push({ x: tgt.x * W, y: tgt.y * H - 70, s: 'CRIT!', t: 0, c: '#ffcf4a' });
            }
            tgt.hp -= dmg;
            tgt.hitT = 0.2;
            f.flash = 0.1;
            f.atk = 0;
            f.tgt = S.fs.indexOf(tgt);
            const w = gearOf(f);
            if (w && !isMelee(w)) {
              const sc = Math.min(W / 180, 2.6);
              const m = muzzlePoint(w);
              const dir = f.side === 0 ? 1 : -1;
              const prof = weaponProfile(w);
              S.shots.push({ x: f.x * W + m[0] * sc * dir, y: f.y * H + m[1] * sc, tx: tgt.x * W, ty: tgt.y * H - 20 * sc, t: 0, life: prof.shot === 'laser' || prof.shot === 'gauss' || prof.shot === 'tesla' || prof.shot === 'cryo' ? 0.14 : 0.16, kind: prof.shot, color: w.glow ?? '#ffe08a' });
            }
            S.floats.push({ x: tgt.x * W + rand(-8, 8), y: tgt.y * H - 50, s: '-' + Math.round(dmg), t: 0, c: f.side === 0 ? '#ffffff' : '#ff8a7a' });
            audio.play('hit');
            f.cd = f.side === 0 ? 1.1 - Math.min(0.5, (g.dweller(f.id!) ? statTotal(g.s, g.dweller(f.id!)!, S_AGI) : 0) * 0.04) : 1.3;
          }
        }
        const aliveA = S.fs.some((f) => f.side === 0 && f.hp > 0);
        const aliveB = S.fs.some((f) => f.side === 1 && f.hp > 0);
        if (!aliveA || !aliveB) {
          S.over = true;
          setState(aliveA ? 'win' : 'lose');
          audio.play(aliveA ? 'levelup' : 'rush_fail');
        }
      }
      for (const f of S.fs) if (f.atk >= 0) f.atk = f.atk + dt / 0.6 >= 1 ? -1 : f.atk + dt / 0.6;
      for (const sh of S.shots) sh.t += dt;
      S.shots = S.shots.filter((sh) => sh.t < sh.life);
      // draw
      const ground = H * 0.82;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, ground, W, H - ground);
      for (const f of S.fs) {
        ctx.save();
        const w = gearOf(f);
        const melee = !w || isMelee(w);
        const tg = f.tgt >= 0 ? S.fs[f.tgt] : null;
        const dash = melee && tg && f.kind !== 'robot' ? dashOf(f.atk) * (tg.x - f.x) * W * 0.62 : 0;
        ctx.translate(f.x * W + dash, f.y * H);
        const sc = Math.min(W / 180, 2.6);
        ctx.scale(sc, sc);
        if (f.hp <= 0 && (f.side === 0 || f.kind === 'raider')) {
          ctx.globalAlpha = 0.45;
          ctx.rotate(f.side === 0 ? -1.4 : 1.4);
        }
        if (f.hitT > 0) ctx.translate(f.side === 0 ? -2 : 2, 0);
        const atk = f.atk >= 0 && f.hp > 0 ? f.atk : undefined;
        if (f.side === 0) {
          const d = g.dweller(f.id!);
          if (d)
            drawCharacter(ctx, d.look, outfitOf(g, d), { ...DEFAULT_POSE, view: 'side', aim: f.hp > 0, weapon: w ?? FISTS, attack: atk, mouth: 'open', eyes: f.hp <= 0 ? 'x' : f.hitT > 0 ? 'closed' : 'open', legA: 0.32, legB: -0.28, kneeA: 0.3, kneeB: 0.2 }, d.gender);
        } else {
          ctx.scale(-1, 1);
          const st = { t: tt + S.fs.indexOf(f), seed: S.fs.indexOf(f) * 7, move: dash !== 0 ? 1 : 0, atk, hurt: f.hitT > 0 && f.hp > 0 ? f.hitT * 5 : 0, dead: f.hp <= 0 ? 1 : 0 };
          switch (f.kind) {
            case 'raider':
              if (f.spec) drawCharacter(ctx, f.spec.look, f.spec.outfit, { ...DEFAULT_POSE, view: 'side', aim: f.hp > 0, weapon: f.spec.weapon, attack: atk, mouth: 'grin', eyes: f.hp <= 0 ? 'x' : 'open', legA: 0.32, legB: -0.28, kneeA: 0.3, kneeB: 0.2 }, f.spec.gender);
              break;
            case 'robot':
              ctx.translate(0, -16);
              ctx.scale(1.3, 1.3);
              drawRobot(ctx, tt, 1, true);
              break;
            case 'bug':
              ctx.scale(1.3, 1.3);
              drawBug(ctx, st);
              break;
            case 'spike':
              drawSpikeback(ctx, st);
              break;
            case 'dog':
              ctx.scale(2, 2);
              drawPet(ctx, 'dog', '#6a5a4a', '#3a2a1a', tt, false);
              break;
            default:
              ctx.scale(1.1, 1.1);
              drawMole(ctx, st);
          }
        }
        ctx.restore();
        // hp bar
        if (f.hp > 0) {
          const bw = 44;
          ctx.fillStyle = 'rgba(0,0,0,.6)';
          ctx.fillRect(f.x * W - bw / 2, f.y * H + 6, bw, 5);
          ctx.fillStyle = f.side === 0 ? '#5ee27f' : '#ff5a4e';
          ctx.fillRect(f.x * W - bw / 2, f.y * H + 6, bw * clamp(f.hp / f.max, 0, 1), 5);
        }
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const sh of S.shots) {
        const u = sh.t / sh.life;
        const beam = sh.kind === 'laser' || sh.kind === 'gauss' || sh.kind === 'tesla' || sh.kind === 'cryo';
        if (beam) {
          ctx.strokeStyle = sh.color;
          ctx.globalAlpha = 1 - u;
          ctx.lineWidth = sh.kind === 'gauss' ? 5 : 3;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(sh.tx, sh.ty);
          ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          const x = sh.x + (sh.tx - sh.x) * u;
          const y = sh.y + (sh.ty - sh.y) * u;
          const ang = Math.atan2(sh.ty - sh.y, sh.tx - sh.x);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = sh.color;
          ctx.lineWidth = sh.kind === 'plasma' || sh.kind === 'flare' || sh.kind === 'rocket' ? 6 : 2.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(ang) * 22, y - Math.sin(ang) * 22);
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      for (const fl of S.floats) {
        fl.t += dt;
        ctx.globalAlpha = Math.max(0, 1 - fl.t / 1.1);
        ctx.font = '800 16px Rubik, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(fl.s, fl.x, fl.y - fl.t * 30);
        ctx.fillStyle = fl.c;
        ctx.fillText(fl.s, fl.x, fl.y - fl.t * 30);
        ctx.globalAlpha = 1;
      }
      S.floats = S.floats.filter((f) => f.t < 1.1);
      // crit ring
      if (!S.over) {
        const cx = W - 56;
        const cy = H - 56;
        ctx.beginPath();
        ctx.arc(cx, cy, 38, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10,14,20,.75)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(94,226,127,.35)';
        ctx.fill();
        const r = 38 - S.ring * 34;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2, r), 0, Math.PI * 2);
        ctx.strokeStyle = r < 19 && r > 10 ? '#5ee27f' : '#ffcf4a';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '800 11px Rubik, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('CRIT', cx, cy + 4);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tapCrit = () => {
    const S = sim.current!;
    if (S.over) return;
    const r = 38 - S.ring * 34;
    if (r < 19 && r > 10) {
      S.crit++;
      setCrits((c) => c + 1);
      audio.play('rush_ok');
    } else audio.play('error');
    S.ring = 0;
  };

  const finish = () => {
    const S = sim.current!;
    for (const f of S.fs) {
      if (f.side === 0 && f.id) {
        const d = g.dweller(f.id);
        if (d) d.hp = Math.max(1, Math.min(d.hp, f.hp));
      }
    }
    g.resolveMission(run, state === 'win', crits);
    store.popModal();
    store.pushModal({ type: 'missionResult', run });
  };

  return (
    <div class="modal-back" onPointerDown={(e) => e.stopPropagation()}>
      <div class="battle col" style={{ gap: '12px' }}>
        <div class="row" style={{ justifyContent: 'space-between' }}>
          <h2 class="title" style={{ margin: 0, fontSize: '18px' }}>{L(m.name)}</h2>
          <span class="pill gold">CRIT ×{crits}</span>
        </div>
        <div class="battle-stage" onClick={tapCrit}>
          <canvas ref={ref} />
        </div>
        <div class="small muted" style={{ textAlign: 'center' }}>{t('mission_tap_crit')}</div>
        {state !== 'fight' && (
          <Btn kind={state === 'win' ? 'green' : 'steel'} size="big" wide onClick={finish}>
            {state === 'win' ? t('mission_win') : t('mission_lose')}
          </Btn>
        )}
      </div>
    </div>
  );
}

function MissionResultModal({ run }: { run: MissionRun }) {
  const r = run.result!;
  const m = MISSION_BY_ID[run.id];
  return (
    <Modal
      hero={
        <>
          <Icon n={r.win ? 'star' : 'alert'} cls="xl" />
          <h2>{r.win ? t('mission_win') : t('mission_lose')}</h2>
          <p>{L(m.name)} · {t('mission_returning')}</p>
        </>
      }
      foot={
        <Btn
          kind="green"
          wide
          onClick={() => {
            store.popModal();
            app.maybeInterstitial();
          }}
        >
          {t('ok')}
        </Btn>
      }
    >
      <div class="reward-row">
        <span class="rchip">
          <Icon n="nuts" />+{r.nuts}
        </span>
        <span class="rchip">
          <Icon n="xp" />+{r.xp}
        </span>
        {r.win && m.reward.crate && (
          <span class="rchip">
            <Icon n="crate" />+{m.reward.crate}
          </span>
        )}
        {r.win && m.reward.iso && (
          <span class="rchip">
            <Icon n="iso" />+{m.reward.iso}
          </span>
        )}
      </div>
      {r.loot.length > 0 && (
        <div class="items" style={{ marginTop: '10px' }}>
          {r.loot.map((it) => (
            <div class={`itile r${app.g.itemRarity(it)}`} style={{ minHeight: '96px' }}>
              <div class="pic">
                <ItemPic it={it} />
              </div>
              <div class="nm">{app.g.itemName(it)}</div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export { LEGENDS, PET_BY_ID };
