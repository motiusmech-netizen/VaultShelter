import { useState } from 'preact/hooks';
import { app } from '../app';
import { store, useStore, useTicker } from './store';
import { Avatar, Bar, Btn, Icon, Price, RoomThumb, Sheet, StatList, StatMini } from './kit';
import { L, t, getLang } from '../i18n';
import { ROOMS, BUILD_ORDER, type RoomType, type RoomCategory } from '../data/rooms';
import { STATS } from '../data/stats';
import { OUTFIT_BY_ID, PET_BY_ID, WEAPON_BY_ID, PET_BONUS_TEXT, RARITY_COLORS } from '../data/items';
import { RECIPES, RECIPE_BY_ID } from '../data/recipes';
import { fmtTime, fmtInt, clamp } from '../core/util';
import { audio } from '../audio/audio';
import { bestStats, dwellerName, effMaxHp, itemByUid, statTotal, xpNeeded, weaponDamage } from '../sim/dwellers';
import type { Dweller, Room } from '../sim/types';
import { INCIDENT_NAMES } from '../sim/incidents';
import { TUTORIAL_DONE } from '../sim/game';

const lang = () => getLang();

export function statusText(d: Dweller): string {
  const g = app.g;
  if (d.ko) return t('d_ko');
  if (d.room === -1) return t('d_at_gate');
  if (d.exploring) return g.s.missions.some((m) => m.team.includes(d.id)) ? t('d_mission') : t('d_exploring');
  if (d.child) return t('d_child') + ' · ' + t('d_grows_in', { t: fmtTime(d.growAt - g.s.time, lang()) });
  const r = d.room > 0 ? g.room(d.room) : undefined;
  let s = r ? L(ROOMS[r.type].name) : t('d_unassigned');
  if (d.babyAt) s += ' · ' + t('d_expecting');
  return s;
}

function thoughts(d: Dweller): string {
  const g = app.g;
  const ru = lang() === 'ru';
  if (d.ko) return ru ? 'Нужна помощь. Срочно.' : 'Needs help. Urgently.';
  if (g.starving) return ru ? 'Голодаю… Где еда?' : 'Starving… Where is the food?';
  if (g.thirsty) return ru ? 'Вода какая-то светящаяся.' : 'The water is glowing a bit.';
  if (d.child) return ru ? 'Когда вырасту — стану смотрителем!' : "When I grow up I'll be the Overseer!";
  if (d.babyAt) return ru ? 'Скоро нас станет больше!' : "We'll be one more soon!";
  if (d.partner) return ru ? 'Кажется, я влюбился… или влюбилась.' : "I think I'm in love.";
  const r = d.room > 0 ? g.room(d.room) : undefined;
  if (!r) return ru ? 'Хочу быть полезным убежищу. Дайте работу!' : 'I want to be useful. Give me a job!';
  if (g.needsPower(r) && !r.powered) return ru ? 'Кто-нибудь, включите свет!' : 'Someone turn on the lights!';
  const def = ROOMS[r.type];
  if (def.category === 'train') return d.stats[def.train!] >= 10 ? (ru ? 'Я достиг совершенства здесь.' : "I've mastered this.") : ru ? 'Становлюсь лучше с каждым днём!' : 'Getting better every day!';
  if (def.stat >= 0) {
    const best = bestStats(g.s, d)[0];
    if (statTotal(g.s, d, def.stat) >= statTotal(g.s, d, best)) return ru ? 'Работа мечты! Я на своём месте.' : "Dream job! I'm where I belong.";
    return ru ? `Мне бы подошла работа, где нужна ${L(STATS[best].name).toLowerCase()}.` : `I'd be better at a job needing ${L(STATS[best].name)}.`;
  }
  if (d.happy > 75) return ru ? 'Жизнь под землёй прекрасна!' : 'Life underground is great!';
  return ru ? 'Всё нормально. Наверное.' : "Everything's fine. Probably.";
}

// ------------------------------------------------------------------ ROOM PANEL
export function RoomPanel({ id }: { id: number }) {
  useStore();
  useTicker(250);
  const g = app.g;
  const r = g.room(id);
  if (!r) {
    app.closePanels();
    return null;
  }
  const def = ROOMS[r.type];
  const ws = g.dwellersIn(r).filter((d) => !d.child);
  const kids = g.dwellersIn(r).filter((d) => d.child);
  const cap = g.roomCap(r);
  const stat = def.stat;
  const building = r.buildLeft > 0 && r.buildTotal > 2.3;
  const stars = '★'.repeat(r.level) + '☆'.repeat(Math.max(0, def.maxLevel - r.level));
  const upCost = g.upgradeCost(r);
  const canUp = r.level < def.maxLevel && r.type !== 'elevator';
  const risk = Math.round(g.rushRisk(r) * 100);
  const tut = g.s.tutorial < TUTORIAL_DONE;

  const assignSlot = () => {
    store.openPanel({ type: 'dwellers', pickFor: { room: r.id } });
  };

  let status: preact.JSX.Element | null = null;
  if (building) {
    status = (
      <div class="card">
        <div class="row small">
          <Icon n="hammer" /> {t('room_building')}
          <span class="grow" />
          <span class="num">{fmtTime(r.buildLeft, lang())}</span>
        </div>
        <div style={{ marginTop: '8px' }}>
          <Bar k={1 - r.buildLeft / r.buildTotal} color="#ffcf4a" thick />
        </div>
      </div>
    );
  } else if (r.incident) {
    const inc = r.incident;
    status = (
      <div class="card" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,90,78,.5)', background: 'rgba(255,60,40,.08)' }}>
        <div class="row">
          <Icon n="alert" cls="lg" />
          <div class="grow">
            <div class="title">{t('toast_incident', { k: L(INCIDENT_NAMES[inc.kind]) })}</div>
            <div class="small muted">{r.type === 'door' && inc.kind === 'raiders' && r.doorHp > 0 ? t('room_door_hp') : L({ ru: 'Отправьте сюда бойцов с оружием!', en: 'Send armed fighters here!' })}</div>
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>
          {r.type === 'door' && inc.kind === 'raiders' && r.doorHp > 0 ? (
            <Bar k={r.doorHp / g.doorMaxHp(r)} color="#ffb02e" thick />
          ) : (
            <Bar k={inc.hp / inc.maxHp} color="#ff5a4e" thick />
          )}
        </div>
      </div>
    );
  } else if (def.produce && def.produce !== 'radio') {
    const store2 = g.roomStore(r);
    const left = g.roomTimeLeft(r);
    const icon = def.produce === 'foodwater' ? 'food' : def.produce;
    status = (
      <div class="card">
        <div class="row">
          <Icon n={icon === 'medkit' ? 'medkit' : icon} cls="lg" />
          <div class="grow">
            <div class="row small" style={{ justifyContent: 'space-between' }}>
              <span>{r.ready ? t('room_ready') : ws.length === 0 ? t('room_no_workers') : !r.powered && g.needsPower(r) ? t('room_no_power') : t('room_producing')}</span>
              <span class="num">{r.ready ? '' : isFinite(left) ? fmtTime(left, lang()) : '—'}</span>
            </div>
            <div style={{ marginTop: '6px' }}>
              <Bar k={r.prog / store2} color={def.accent} thick text={`+${fmtInt(store2)}${def.produce === 'foodwater' ? ' / +' + fmtInt(store2) : ''}`} />
            </div>
          </div>
        </div>
        {r.ready && (
          <div style={{ marginTop: '10px' }}>
            <Btn kind="green" wide icon={icon === 'medkit' ? 'medkit' : icon} onClick={() => g.collect(r)}>
              {t('room_collect')}
            </Btn>
          </div>
        )}
      </div>
    );
  } else if (def.produce === 'radio') {
    status = (
      <div class="card">
        <div class="row small">
          <Icon n="dweller" /> {t('room_next_arrival')}
          <span class="grow" />
          <span class="num">{g.population() + g.waiting().length >= g.capacity() ? t('d_vault_full') : isFinite(g.roomTimeLeft(r)) ? fmtTime(g.roomTimeLeft(r), lang()) : '—'}</span>
        </div>
        <div style={{ marginTop: '6px' }}>
          <Bar k={r.prog / g.roomStore(r)} color={def.accent} thick />
        </div>
        <div class="small muted" style={{ marginTop: '8px' }}>
          {t('room_radio_bonus', { n: Math.round(g.radioBonus) })}
        </div>
      </div>
    );
  } else if (def.category === 'train') {
    status = (
      <div class="card row">
        <Icon n={STATS[def.train!].icon} cls="lg" />
        <div class="grow small">{t('room_training', { stat: L(STATS[def.train!].name) })}</div>
      </div>
    );
  } else if (def.craft) {
    status = <CraftStatus r={r} />;
  } else if (r.type === 'living') {
    const couples = ws.filter((d) => d.partner && d.gender === 'm').length;
    status = (
      <div class="card">
        <div class="row small">
          <Icon n="people" /> {t('room_capacity')}
          <span class="grow" />
          <span class="num">
            {g.population()} / {g.capacity()}
          </span>
        </div>
        <div class="small muted" style={{ marginTop: '6px' }}>
          {t('room_living_info')}
          {couples > 0 && ' ♥ ' + couples}
          {kids.length > 0 && ` · ${t('d_child')}: ${kids.length}`}
        </div>
      </div>
    );
  } else if (r.type === 'door') {
    status = (
      <div class="card">
        <div class="row small">
          <Icon n="door" /> {t('room_door_hp')}
          <span class="grow" />
          <span class="num">
            {Math.round(r.doorHp)} / {g.doorMaxHp(r)}
          </span>
        </div>
        <div style={{ marginTop: '6px' }}>
          <Bar k={r.doorHp / g.doorMaxHp(r)} color="#ffb02e" thick />
        </div>
      </div>
    );
  } else if (r.type === 'elevator') {
    status = <div class="card small muted">{t('room_elevator_info')}</div>;
  } else if (r.type === 'office') {
    status = (
      <div class="card">
        <div class="small muted">{t('room_office_info')}</div>
        <div style={{ marginTop: '10px' }}>
          <Btn wide icon="mission" onClick={() => store.openPanel({ type: 'missions' })}>
            {t('btn_missions')}
          </Btn>
        </div>
      </div>
    );
  } else if (r.type === 'storage') {
    status = (
      <div class="card row small">
        <Icon n="storage" /> {t('storage_used', { a: g.storageUsed(), b: g.storageCap() })}
      </div>
    );
  }

  const injured = ws.some((d) => !d.ko && d.hp < effMaxHp(d) - 1);
  return (
    <Sheet
      compact
      accent={def.accent}
      title={
        <span>
          {L(def.name)} <span class="stars">{r.type !== 'elevator' ? stars : ''}</span>
        </span>
      }
      sub={
        <span class="row" style={{ gap: '6px' }}>
          {stat >= 0 && <StatMini stat={stat} v={ws.reduce((a, d) => a + statTotal(g.s, d, stat), 0)} />}
          {r.size > 1 && <span class="pill">×{r.size}</span>}
          <span>{t('floor', { n: r.floor + 1 })}</span>
        </span>
      }
      foot={
        r.type === 'elevator' ? (
          <Btn kind="steel" icon="trash" onClick={() => destroyRoom(r)}>
            {t('room_destroy')}
          </Btn>
        ) : (
          <>
            {def.produce && !building && (
              <>
                <Btn kind="steel" icon="rush" cls="tut-rush" disabled={!g.canRush(r)} onClick={() => g.rush(r)}>
                  {t('room_rush')} <span class="sub">{tut ? '0%' : risk + '%'}</span>
                </Btn>
                {!tut && (
                  <Btn
                    ad
                    disabled={!g.canRush(r)}
                    onClick={async () => {
                      if (await app.rewarded()) g.rush(r, true);
                    }}
                  >
                    {t('room_rush_safe')}
                  </Btn>
                )}
              </>
            )}
            {canUp && !building && (
              <Btn kind="green" icon="upgrade" disabled={g.s.nuts < upCost || !!r.incident} onClick={() => g.upgrade(r)}>
                {t('room_upgrade')} <Price n={fmtInt(upCost)} />
              </Btn>
            )}
            {r.incident && injured && (
              <Btn kind="red" icon="medkit" disabled={g.s.medkits <= 0} onClick={() => ws.forEach((d) => g.useMedkit(d))}>
                {t('heal_all')} ({g.s.medkits})
              </Btn>
            )}
            {r.type !== 'door' && !building && (
              <Btn kind="steel" icon="trash" onClick={() => destroyRoom(r)} cls="icon-only" />
            )}
          </>
        )
      }
    >
      {status}
      {cap > 0 && (
        <>
          <div class="label">
            {r.type === 'door' ? t('room_guards') : t('room_workers')} · {ws.length}/{cap}
          </div>
          <div class="slots">
            {Array.from({ length: cap }, (_, i) => {
              const d = ws[i];
              if (!d)
                return (
                  <div class="slot empty" onClick={assignSlot} data-tut="slot">
                    <div class="avatar">
                      <Icon n="plus" />
                    </div>
                    <span class="nm">{t('room_empty_slot')}</span>
                  </div>
                );
              return (
                <div
                  class="slot"
                  onClick={() => {
                    audio.play('click');
                    app.r.selectedDweller = d.id;
                    store.openPanel({ type: 'dweller', id: d.id });
                  }}
                >
                  <Avatar d={d} />
                  <span class="nm">
                    {stat >= 0 ? <StatMini stat={stat} v={statTotal(g.s, d, stat)} /> : d.first}
                  </span>
                  {def.category === 'train' && (
                    <div style={{ width: '56px' }}>
                      <Bar k={d.stats[def.train!] >= 10 ? 1 : d.trainProg} color={STATS[def.train!].color} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {r.size < 3 && def.mergeable && <div class="small muted" style={{ marginTop: '10px' }}>{t('room_merge_hint')}</div>}
        </>
      )}
    </Sheet>
  );
}

function destroyRoom(r: Room) {
  const g = app.g;
  if (!g.canDestroy(r)) {
    audio.play('error');
    store.toast(t('room_cannot_destroy'), 'bad');
    return;
  }
  store.pushModal({
    type: 'confirm',
    danger: true,
    text: t('room_destroy_confirm', { room: L(ROOMS[r.type].name) }),
    yes: t('room_destroy'),
    onYes: () => {
      g.destroy(r);
      app.closePanels();
    },
  });
}

function CraftStatus({ r }: { r: Room }) {
  const g = app.g;
  const c = r.craft;
  if (!c)
    return (
      <div class="card">
        <div class="small muted">{L(ROOMS[r.type].desc)}</div>
        <div style={{ marginTop: '10px' }}>
          <Btn wide icon="craft" onClick={() => store.openPanel({ type: 'craft', room: r.id })}>
            {t('room_craft_btn')}
          </Btn>
        </div>
      </div>
    );
  const name = L((c.kind === 'weapon' ? WEAPON_BY_ID[c.def] : OUTFIT_BY_ID[c.def])?.name);
  return (
    <div class="card">
      <div class="row small">
        <Icon n={c.kind === 'weapon' ? 'weapon' : 'outfit'} /> <b>{name}</b>
        <span class="grow" />
        <span class="num">{c.done ? t('room_ready') : fmtTime(c.left / Math.max(0.1, 0.6), lang())}</span>
      </div>
      <div style={{ marginTop: '6px' }}>
        <Bar k={1 - c.left / c.total} color="#ffcf4a" thick />
      </div>
      {c.done && (
        <div style={{ marginTop: '10px' }}>
          <Btn
            kind="green"
            wide
            onClick={() => {
              const it = g.collectCraft(r);
              if (it) {
                audio.play('built');
                store.toast(g.itemName(it), 'great', it.kind === 'weapon' ? 'weapon' : 'outfit');
              }
            }}
          >
            {t('room_craft_collect')}
          </Btn>
        </div>
      )}
    </div>
  );
}

export function CraftPanel({ room }: { room: number }) {
  useStore();
  const g = app.g;
  const r = g.room(room);
  const [sel, setSel] = useState<string | null>(null);
  if (!r) return null;
  const kind = ROOMS[r.type].craft!;
  const list = RECIPES.filter((x) => x.kind === kind).sort((a, b) => a.rarity - b.rarity || a.nuts - b.nuts);
  const selR = sel ? RECIPE_BY_ID[sel] : null;
  const check = selR ? g.canCraft(r, selR.def) : null;
  const reasons: Record<string, string> = {
    busy: L({ ru: 'Мастерская занята', en: 'Workshop is busy' }),
    level: L({ ru: 'Нужен более высокий уровень мастерской', en: 'Needs a higher workshop level' }),
    nuts: t('not_enough_nuts'),
    storage: t('storage_full'),
    junk: L({ ru: 'Не хватает хлама', en: 'Not enough junk' }),
    workers: t('room_no_workers'),
  };
  return (
    <Sheet
      title={t('room_craft_choose')}
      icon="craft"
      onClose={() => store.openPanel({ type: 'room', id: room })}
      foot={
        selR && (
          <Btn
            kind="green"
            wide
            disabled={!check?.ok}
            onClick={() => {
              if (g.startCraft(r, selR.def)) {
                audio.play('build');
                store.openPanel({ type: 'room', id: room });
              }
            }}
          >
            {t('room_craft_btn')} <Price n={fmtInt(selR.nuts)} />
          </Btn>
        )
      }
    >
      {selR && !check?.ok && check?.reason && <div class="card small bad" style={{ marginBottom: '8px' }}>{reasons[check.reason]}</div>}
      <div class="items">
        {list.map((rc) => {
          const def = rc.kind === 'weapon' ? WEAPON_BY_ID[rc.def] : OUTFIT_BY_ID[rc.def];
          const locked = r.level < rc.level;
          return (
            <div class={`itile r${rc.rarity} ${sel === rc.def ? 'sel' : ''}`} style={locked ? { opacity: 0.45 } : undefined} onClick={() => setSel(rc.def)}>
              <div class="pic">
                <Icon n={rc.kind === 'weapon' ? 'weapon' : 'outfit'} cls="xl" />
              </div>
              <div class="nm">{L(def.name)}</div>
              <div class="meta">
                {rc.kind === 'weapon' ? `${(def as any).dmg[0]}–${(def as any).dmg[1]}` : bonusText((def as any).bonus)}
              </div>
              <div class="row small" style={{ gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {rc.junk.map((j) => (
                  <span class={'pill ' + (g.junkCount(j) > 0 ? 'green' : 'red')} style={{ fontSize: '10px', padding: '1px 6px' }}>
                    {L((require_junk(j) as any).name)}
                  </span>
                ))}
              </div>
              {locked && <span class="count">{t('room_level', { n: rc.level })}</span>}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

import { JUNK_BY_ID } from '../data/items';
function require_junk(id: string) {
  return JUNK_BY_ID[id];
}

export function bonusText(b: number[]) {
  return b
    .map((v, i) => (v ? `${L(STATS[i].short)}+${v}` : ''))
    .filter(Boolean)
    .join(' ');
}

// ------------------------------------------------------------------ DWELLER PANEL
export function DwellerPanel({ id }: { id: number }) {
  useStore();
  useTicker(400);
  const g = app.g;
  const d = g.dweller(id);
  if (!d) {
    app.closePanels();
    return null;
  }
  const eff = effMaxHp(d);
  const room = d.room > 0 ? g.room(d.room) : undefined;
  const highlight = room && ROOMS[room.type].stat >= 0 ? (ROOMS[room.type].category === 'train' ? ROOMS[room.type].train : ROOMS[room.type].stat) : undefined;
  const wIt = itemByUid(g.s, d.weapon);
  const oIt = itemByUid(g.s, d.outfit);
  const pIt = itemByUid(g.s, d.pet);
  const w = wIt ? WEAPON_BY_ID[wIt.def] : null;
  const o = oIt ? OUTFIT_BY_ID[oIt.def] : null;
  const p = pIt ? PET_BY_ID[pIt.def] : null;
  const tut = g.s.tutorial < TUTORIAL_DONE;
  const exp = g.s.expeditions.find((e) => e.dweller === d.id);

  const actions: preact.JSX.Element[] = [];
  if (d.room === -1) {
    actions.push(
      <Btn
        kind="green"
        icon="door"
        disabled={g.population() >= g.capacity()}
        onClick={() => {
          if (!g.admit(d)) store.toast(t('d_vault_full'), 'bad');
        }}
      >
        {t('d_let_in')}
      </Btn>,
    );
  }
  if (d.ko) {
    actions.push(
      <Btn kind="green" icon="heart" disabled={g.s.nuts < g.reviveCost(d)} onClick={() => g.revive(d)}>
        {t('d_revive')} <Price n={g.reviveCost(d)} />
      </Btn>,
    );
    actions.push(
      <Btn
        ad
        onClick={async () => {
          if (await app.rewarded()) g.revive(d, true);
        }}
      >
        {t('d_revive_free')}
      </Btn>,
    );
  } else if (!d.exploring && !d.child) {
    actions.push(
      <Btn icon="hammer" onClick={() => store.openPanel({ type: 'assign', dweller: d.id })} cls="" >
        {t('d_assign_to')}
      </Btn>,
    );
    if (!tut && d.room !== -1 && !d.babyAt)
      actions.push(
        <Btn kind="steel" icon="wasteland" onClick={() => store.openPanel({ type: 'explore', dweller: d.id })}>
          {t('d_explore')}
        </Btn>,
      );
  }
  if (exp) {
    actions.push(
      <Btn kind="steel" icon="wasteland" onClick={() => store.openPanel({ type: 'wasteland' })}>
        {t('waste_title')}
      </Btn>,
    );
  }

  return (
    <Sheet
      title={
        <span class="row" style={{ gap: '8px' }}>
          <span class="ellip">{dwellerName(d)}</span>
          {d.legend && <span class="pill gold">★</span>}
        </span>
      }
      sub={`${t('d_level', { n: d.level })} · ${statusText(d)}`}
      foot={actions.length ? <>{actions}</> : undefined}
    >
      <div class="row" style={{ alignItems: 'stretch' }}>
        <Avatar d={d} big />
        <div class="grow col" style={{ gap: '8px', justifyContent: 'center' }}>
          <div>
            <div class="row small" style={{ justifyContent: 'space-between' }}>
              <span>
                <Icon n="heart" cls="sm" /> {t('d_hp')}
              </span>
              <span class="num">
                {Math.ceil(d.hp)} / {Math.ceil(eff)}
              </span>
            </div>
            <div class="bar thick" style={{ marginTop: '3px' }}>
              <i style={{ width: `${(d.hp / d.maxHp) * 100}%`, background: 'linear-gradient(90deg,#3fcf6a,#8cff9a)' }} />
              {d.rad > 0 && <i style={{ left: 'auto', right: 0, width: `${(d.rad / d.maxHp) * 100}%`, background: '#e84a3c' }} />}
            </div>
          </div>
          <div>
            <div class="row small" style={{ justifyContent: 'space-between' }}>
              <span>
                <Icon n="xp" cls="sm" /> {t('d_xp')}
              </span>
              <span class="num">{d.level >= 50 ? 'MAX' : `${Math.floor(d.xp)} / ${xpNeeded(d.level)}`}</span>
            </div>
            <div style={{ marginTop: '3px' }}>
              <Bar k={d.level >= 50 ? 1 : d.xp / xpNeeded(d.level)} color="#ffd23d" />
            </div>
          </div>
          <div>
            <div class="row small" style={{ justifyContent: 'space-between' }}>
              <span>
                <Icon n={d.happy >= 50 ? 'happy' : 'sad'} cls="sm" /> {t('d_happy')}
              </span>
              <span class="num">{Math.round(d.happy)}%</span>
            </div>
            <div style={{ marginTop: '3px' }}>
              <Bar k={d.happy / 100} color="#ffb02e" />
            </div>
          </div>
        </div>
      </div>
      <div class="card small" style={{ marginTop: '10px', fontStyle: 'italic', color: 'var(--txt2)' }}>
        «{thoughts(d)}»
      </div>
      {!d.ko && !d.exploring && (d.hp < eff - 1 || d.rad > 1) && (
        <div class="row" style={{ marginTop: '8px' }}>
          {d.hp < eff - 1 && (
            <Btn kind="steel" size="small" icon="medkit" disabled={g.s.medkits <= 0} onClick={() => g.useMedkit(d)}>
              {t('d_heal')} ({g.s.medkits})
            </Btn>
          )}
          {d.rad > 1 && (
            <Btn kind="steel" size="small" icon="antirad" disabled={g.s.antirads <= 0} onClick={() => g.useAntirad(d)}>
              {t('d_antirad')} ({g.s.antirads})
            </Btn>
          )}
        </div>
      )}
      <div class="label">{t('d_stats')}</div>
      <StatList d={d} highlight={highlight} />
      {!d.child && (
        <>
          <div class="label">{t('d_weapon')} · {t('d_outfit')} · {t('d_pet')}</div>
          <div class="col" style={{ gap: '6px' }}>
            <EquipRow icon="weapon" name={w ? L(w.name) : t('d_none')} meta={w ? `${t('dmg')} ${w.dmg[0]}–${w.dmg[1]}` : `${t('dmg')} ${weaponDamage(g.s, d).toFixed(1)}`} color={w ? RARITY_COLORS[w.rarity] : undefined} onClick={() => store.openPanel({ type: 'storage', tab: 'weapon', pick: { dweller: d.id, slot: 'weapon' } })} />
            <EquipRow icon="outfit" name={o ? L(o.name) : t('d_none')} meta={o ? bonusText(o.bonus) : ''} color={o ? RARITY_COLORS[o.rarity] : undefined} onClick={() => store.openPanel({ type: 'storage', tab: 'outfit', pick: { dweller: d.id, slot: 'outfit' } })} />
            <EquipRow icon="pet" name={p ? L(p.name) : t('d_none')} meta={p && pIt ? L(PET_BONUS_TEXT[p.bonus], { v: p.value[pIt.r ?? 0] }) : ''} color={p && pIt ? RARITY_COLORS[pIt.r ?? 0] : undefined} onClick={() => store.openPanel({ type: 'storage', tab: 'pet', pick: { dweller: d.id, slot: 'pet' } })} />
          </div>
        </>
      )}
      <div class="row" style={{ marginTop: '14px', justifyContent: 'space-between' }}>
        <Btn kind="ghost" size="small" icon="pin" onClick={() => app.r.focusDweller(d)}>
          {t('d_go_to')}
        </Btn>
        <Btn kind="ghost" size="small" onClick={() => store.pushModal({ type: 'rename', dweller: d.id })}>
          ✎ {t('d_rename')}
        </Btn>
        {!tut && !d.exploring && (
          <Btn
            kind="ghost"
            size="small"
            onClick={() =>
              store.pushModal({
                type: 'confirm',
                danger: true,
                text: t('d_evict_confirm', { n: dwellerName(d) }),
                yes: t('d_evict'),
                onYes: () => {
                  g.evict(d);
                  app.closePanels();
                },
              })
            }
          >
            <span class="bad">{t('d_evict')}</span>
          </Btn>
        )}
      </div>
    </Sheet>
  );
}

function EquipRow({ icon, name, meta, color, onClick }: { icon: string; name: string; meta: string; color?: string; onClick: () => void }) {
  return (
    <div
      class="lrow"
      onClick={() => {
        audio.play('click');
        onClick();
      }}
    >
      <Icon n={icon} cls="lg" />
      <div class="grow">
        <div style={{ fontWeight: 700, color: color ?? 'var(--muted)' }} class="ellip">
          {name}
        </div>
        {meta && <div class="small muted">{meta}</div>}
      </div>
      <span class="pill">{t('d_change')}</span>
    </div>
  );
}

// ------------------------------------------------------------------ ASSIGN (room picker for a dweller)
export function AssignPanel({ dweller }: { dweller: number }) {
  useStore();
  const g = app.g;
  const d = g.dweller(dweller);
  if (!d) return null;
  const rooms = g.s.rooms.filter((r) => g.roomCap(r) > 0 && (r.buildLeft <= 0 || r.buildTotal <= 3));
  const score = (r: Room) => {
    const st = ROOMS[r.type].category === 'train' ? ROOMS[r.type].train! : ROOMS[r.type].stat;
    return st >= 0 ? statTotal(g.s, d, st) : 0;
  };
  rooms.sort((a, b) => score(b) - score(a));
  return (
    <Sheet title={t('d_assign_to')} sub={dwellerName(d)} onClose={() => store.openPanel({ type: 'dweller', id: d.id })}>
      {rooms.map((r) => {
        const def = ROOMS[r.type];
        const occ = g.dwellersIn(r).filter((x) => !x.child).length;
        const cap = g.roomCap(r);
        const st = def.category === 'train' ? def.train! : def.stat;
        const here = d.room === r.id;
        return (
          <div
            class={'lrow' + (here ? ' sel' : '')}
            onClick={() => {
              const ok = g.canAssign(d, r) ? g.assign(d, r) : g.swapInto(d, r);
              if (ok) {
                audio.play('drop');
                app.r.focusRoom(r);
                app.r.selectedRoom = r.id;
                store.openPanel({ type: 'room', id: r.id });
              } else {
                audio.play('error');
                store.toast(d.room === -1 && g.population() >= g.capacity() ? t('d_vault_full') : t('toast_room_full'), 'bad');
              }
            }}
          >
            <div style={{ width: '6px', alignSelf: 'stretch', borderRadius: '3px', background: def.accent }} />
            <div class="grow">
              <div style={{ fontWeight: 700 }}>
                {L(def.name)} <span class="stars">{'★'.repeat(r.level)}</span>
              </div>
              <div class="small muted">
                {t('floor', { n: r.floor + 1 })} · {occ}/{cap}
              </div>
            </div>
            {st >= 0 && <StatMini stat={st} v={statTotal(g.s, d, st)} />}
          </div>
        );
      })}
    </Sheet>
  );
}

// ------------------------------------------------------------------ BUILD
const CATS: (RoomCategory | 'all')[] = ['all', 'prod', 'hab', 'train', 'craft', 'special'];
export function BuildPanel() {
  useStore();
  const g = app.g;
  const [cat, setCat] = useState<RoomCategory | 'all'>('all');
  const tut = g.s.tutorial < TUTORIAL_DONE;
  const list = BUILD_ORDER.filter((tp) => cat === 'all' || ROOMS[tp].category === cat || (cat === 'special' && ROOMS[tp].category === 'core'));
  const seen = g.s.flags;
  return (
    <Sheet
      title={t('build_title')}
      sub={t('build_hint')}
      icon="hammer"
      tabs={CATS.map((c) => (
        <button class={'tab' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
          {t(('cat_' + c) as any)}
        </button>
      ))}
    >
      <div class="bgrid">
        {list.map((tp) => {
          const def = ROOMS[tp];
          const can = g.canBuildType(tp);
          const cost = g.buildCost(tp, 1);
          const locked = can.reason === 'locked';
          const maxed = can.reason === 'max';
          const isNew = !locked && def.unlockPop > 0 && !seen['seen_' + tp];
          return (
            <div
              class={'bcard' + (locked || maxed ? ' locked' : '')}
              data-tut={'build-' + tp}
              onClick={() => {
                if (locked || maxed) {
                  audio.play('error');
                  return;
                }
                if (g.s.nuts < cost) {
                  audio.play('error');
                  store.toast(t('not_enough_nuts'), 'bad', 'nuts');
                  return;
                }
                g.s.flags['seen_' + tp] = 1;
                audio.play('click');
                app.enterBuild(tp as RoomType);
              }}
            >
              <RoomThumb type={tp} />
              {isNew && !tut && <span class="newtag">{t('new_badge')}</span>}
              <div class="info">
                <div class="nm">{L(def.name)}</div>
                <div class="meta">
                  {def.stat >= 0 ? <StatMini stat={def.category === 'train' ? def.train! : def.stat} v={g.countType(tp)} /> : <span class="muted small">{g.countType(tp) || ''}</span>}
                  <Price n={fmtInt(cost)} bad={g.s.nuts < cost} />
                </div>
              </div>
              {(locked || maxed) && (
                <div class="lockmsg">
                  <Icon n="lock" cls="lg" />
                  {locked ? t('unlock_at', { n: def.unlockPop }) : t('max_built')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------------ DWELLERS LIST (also picker)
export function DwellersPanel({ pickFor }: { pickFor?: { room?: number; explore?: boolean; mission?: string } }) {
  useStore();
  useTicker(1000);
  const g = app.g;
  const [sort, setSort] = useState<'name' | 'level' | 'happy' | 'hp' | 'stat'>(pickFor?.room ? 'stat' : 'level');
  const [idle, setIdle] = useState(false);
  const room = pickFor?.room ? g.room(pickFor.room) : undefined;
  const st = room ? (ROOMS[room.type].category === 'train' ? ROOMS[room.type].train! : ROOMS[room.type].stat) : -1;
  let list = g.s.dwellers.slice();
  if (pickFor) list = list.filter((d) => !d.exploring && !d.child && !d.ko);
  if (pickFor?.explore) list = list.filter((d) => !d.babyAt && d.room !== -1);
  if (room) list = list.filter((d) => d.room !== room.id);
  if (idle) list = list.filter((d) => d.room <= 0 && !d.exploring);
  list.sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.first.localeCompare(b.first);
      case 'happy':
        return b.happy - a.happy;
      case 'hp':
        return a.hp / effMaxHp(a) - b.hp / effMaxHp(b);
      case 'stat':
        return st >= 0 ? statTotal(g.s, b, st) - statTotal(g.s, a, st) : b.level - a.level;
      default:
        return b.level - a.level;
    }
  });
  const title = room ? t('room_assign') + ': ' + L(ROOMS[room.type].name) : pickFor?.explore ? t('waste_pick') : t('list_title');
  const sorts: [typeof sort, string][] = [
    ...(st >= 0 ? ([['stat', L(STATS[st].name)]] as [typeof sort, string][]) : []),
    ['level', t('sort_level')],
    ['happy', t('sort_happy')],
    ['hp', t('sort_hp')],
    ['name', t('sort_name')],
  ];
  return (
    <Sheet
      title={title}
      sub={`${g.population()} / ${g.capacity()}`}
      icon={pickFor ? undefined : 'people'}
      onClose={() => (room ? store.openPanel({ type: 'room', id: room.id }) : pickFor?.explore ? store.openPanel({ type: 'wasteland' }) : app.closePanels())}
      tabs={
        <>
          {sorts.map(([k, lbl]) => (
            <button class={'tab' + (sort === k ? ' on' : '')} onClick={() => setSort(k)}>
              {lbl}
            </button>
          ))}
          {!pickFor && (
            <button class={'tab' + (idle ? ' on' : '')} onClick={() => setIdle(!idle)}>
              {t('filter_idle')}
            </button>
          )}
        </>
      }
    >
      {list.length === 0 && (
        <div class="empty">
          <Icon n="people" />
          <div>{pickFor?.explore ? t('waste_nobody') : t('storage_empty')}</div>
        </div>
      )}
      {list.map((d) => {
        const inRoom = room && d.room === room.id;
        return (
          <div
            class={'lrow' + (inRoom ? ' sel' : '')}
            onClick={() => {
              audio.play('click');
              if (room) {
                const ok = g.canAssign(d, room) ? g.assign(d, room) : g.swapInto(d, room);
                if (!ok) {
                  audio.play('error');
                  store.toast(d.room === -1 && g.population() >= g.capacity() ? t('d_vault_full') : t('toast_room_full'), 'bad');
                  return;
                }
                audio.play('drop');
                store.openPanel({ type: 'room', id: room.id });
                return;
              }
              if (pickFor?.explore) {
                store.openPanel({ type: 'explore', dweller: d.id });
                return;
              }
              app.r.selectedDweller = d.id;
              if (d.room !== -1 && !d.exploring) app.r.focusDweller(d);
              store.openPanel({ type: 'dweller', id: d.id });
            }}
          >
            <Avatar d={d} />
            <div class="grow">
              <div class="row" style={{ gap: '6px' }}>
                <b class="ellip">{dwellerName(d)}</b>
                {d.lvlPending > 0 && <Icon n="levelup" cls="sm" />}
                {d.legend && <span class="pill gold" style={{ padding: '0 6px' }}>★</span>}
              </div>
              <div class="small muted ellip">{statusText(d)}</div>
              <div class="row" style={{ gap: '8px', marginTop: '3px' }}>
                {bestStats(g.s, d)
                  .slice(0, 3)
                  .map((i) => (
                    <StatMini stat={i} v={statTotal(g.s, d, i)} />
                  ))}
              </div>
            </div>
            <div class="col" style={{ alignItems: 'flex-end', gap: '4px' }}>
              {st >= 0 ? (
                <span style={{ transform: 'scale(1.35)', transformOrigin: 'right' }}>
                  <StatMini stat={st} v={statTotal(g.s, d, st)} />
                </span>
              ) : (
                <Icon n={d.happy >= 50 ? 'happy' : 'sad'} />
              )}
              <div style={{ width: '48px' }}>
                <Bar k={d.hp / d.maxHp} color={d.hp / effMaxHp(d) < 0.35 ? '#ff5a4e' : '#5ee27f'} />
              </div>
            </div>
          </div>
        );
      })}
    </Sheet>
  );
}

// ------------------------------------------------------------------ ROCK
export function RockPanel({ id }: { id: number }) {
  useStore();
  const g = app.g;
  const rk = g.s.rocks.find((r) => r.id === id);
  if (!rk) {
    app.closePanels();
    return null;
  }
  const cost = g.rockCost(rk);
  let reach = false;
  for (let c = rk.col - 1; c <= rk.col + rk.w; c++) if (g.roomAt(rk.floor, c) || g.roomAt(rk.floor - 1, c) || g.roomAt(rk.floor + 1, c)) reach = true;
  return (
    <Sheet
      compact
      title={t('rock_title')}
      sub={t('floor', { n: rk.floor + 1 })}
      icon="wasteland"
      foot={
        <Btn
          kind="green"
          wide
          icon="hammer"
          disabled={!reach || g.s.nuts < cost || rk.clearing > 0}
          onClick={() => {
            if (g.clearRock(rk)) {
              audio.play('build');
              app.closePanels();
            }
          }}
        >
          {t('rock_clear')} <Price n={fmtInt(cost)} />
        </Btn>
      }
    >
      <div class="card small">{t('rock_desc')}</div>
      {!reach && <div class="card small bad">{t('rock_not_reachable')}</div>}
    </Sheet>
  );
}

// ------------------------------------------------------------------ ROBOTS
export function RobotsPanel() {
  useStore();
  const g = app.g;
  return (
    <Sheet title={t('robot_title')} icon="robot">
      <div class="card small muted">{t('robot_desc')}</div>
      {g.s.robots.length === 0 && (
        <div class="empty">
          <Icon n="robot" />
          <div>{L({ ru: 'Роботов пока нет. Их можно найти в ящиках снабжения.', en: 'No robots yet. Find them in supply crates.' })}</div>
        </div>
      )}
      {g.s.robots.map((rb, i) => (
        <div class="lrow" style={{ marginTop: '8px' }}>
          <Icon n="robot" cls="lg" />
          <div class="grow">
            <b>
              {L({ ru: 'Кузя', en: 'Kuzya' })} №{i + 1}
            </b>
            <div class="small muted">{rb.floor >= 0 ? t('robot_floor', { n: rb.floor + 1 }) : t('robot_unassigned')}</div>
          </div>
          <Btn
            size="small"
            onClick={() => {
              app.closePanels();
              app.r.robotPick = true;
              store.set({ robotAssign: rb.id });
              store.toast(t('robot_pick_floor'), 'info', 'robot');
            }}
          >
            {t('robot_assign')}
          </Btn>
        </div>
      ))}
    </Sheet>
  );
}

export { clamp };
