import { useState } from 'preact/hooks';
import { app } from '../app';
import { store, useStore, useTicker } from './store';
import { Avatar, Bar, Btn, Icon, ItemPic, Price, Sheet, StatMini } from './kit';
import { L, t, getLang, setLang } from '../i18n';
import { OUTFIT_BY_ID, PET_BY_ID, WEAPON_BY_ID, JUNK_BY_ID, PET_BONUS_TEXT, RARITY_COLORS, RARITY_NAMES } from '../data/items';
import { DAWN_STAGES } from '../data/dawn';
import { MISSIONS, MISSION_BY_ID } from '../data/missions';
import { ROOMS } from '../data/rooms';
import { fmtTime, fmtInt, fmtClock } from '../core/util';
import { audio } from '../audio/audio';
import { dwellerName, effMaxHp, statTotal, weaponDamage } from '../sim/dwellers';
import { objectiveProgress, objectiveText } from '../sim/objectives';
import { expeditionDepthLabel } from '../sim/explore';
import type { Item, Reward, Dweller } from '../sim/types';
import { bonusText } from './panelsVault';
import { DAILY_REWARDS, Game } from '../sim/game';
import { S_END, S_STR, S_AGI } from '../data/stats';

const lang = () => getLang();

// ------------------------------------------------------------------ STORAGE
export function StoragePanel({ tab: tab0, pick }: { tab?: string; pick?: { dweller: number; slot: 'weapon' | 'outfit' | 'pet' } }) {
  useStore();
  const g = app.g;
  const [tab, setTab] = useState(tab0 ?? 'weapon');
  const [sel, setSel] = useState<number | null>(null);
  const d = pick ? g.dweller(pick.dweller) : undefined;
  const items = (pick ? g.s.items.filter((i) => i.kind === pick.slot) : g.storedItems().filter((i) => i.kind === tab)).slice();
  items.sort((a, b) => g.itemRarity(b) - g.itemRarity(a) || g.itemValue(b) - g.itemValue(a));
  // group junk
  const groups = new Map<string, Item[]>();
  if (tab === 'junk' && !pick) {
    for (const it of items) {
      const arr = groups.get(it.def) ?? [];
      arr.push(it);
      groups.set(it.def, arr);
    }
  }
  const selIt = sel != null ? g.s.items.find((i) => i.uid === sel) : undefined;
  const eqBy = (it: Item) => g.s.dwellers.find((x) => x.weapon === it.uid || x.outfit === it.uid || x.pet === it.uid);
  const tabs: [string, string, string][] = [
    ['weapon', 'tab_weapons', 'weapon'],
    ['outfit', 'tab_outfits', 'outfit'],
    ['junk', 'tab_junk', 'junk'],
    ['pet', 'tab_pets', 'pet'],
  ];
  const detail = (it: Item) => {
    if (it.kind === 'weapon') {
      const w = WEAPON_BY_ID[it.def];
      return `${t('dmg')} ${w.dmg[0]}–${w.dmg[1]}`;
    }
    if (it.kind === 'outfit') return bonusText(OUTFIT_BY_ID[it.def].bonus);
    if (it.kind === 'pet') {
      const p = PET_BY_ID[it.def];
      return L(PET_BONUS_TEXT[p.bonus], { v: p.value[it.r ?? 0] });
    }
    return L(RARITY_NAMES[g.itemRarity(it)]);
  };
  const back = () => (pick ? store.openPanel({ type: 'dweller', id: pick.dweller }) : app.closePanels());
  const cur = d && pick ? d[pick.slot] : 0;
  return (
    <Sheet
      title={pick ? t('pick_item') : t('storage_title')}
      sub={pick && d ? dwellerName(d) : t('storage_used', { a: g.storageUsed(), b: g.storageCap() })}
      icon="storage"
      onClose={back}
      tabs={
        pick
          ? undefined
          : tabs.map(([k, lbl, ic]) => (
              <button
                class={'tab' + (tab === k ? ' on' : '')}
                onClick={() => {
                  setTab(k);
                  setSel(null);
                }}
              >
                <Icon n={ic} cls="sm" /> {t(lbl as any)}
              </button>
            ))
      }
      foot={
        selIt ? (
          pick && d ? (
            <>
              {cur ? (
                <Btn kind="steel" onClick={() => { g.equip(d, null, pick.slot); back(); }}>
                  {t('d_unequip')}
                </Btn>
              ) : null}
              <Btn kind="green" onClick={() => { g.equip(d, selIt, pick.slot); audio.play('upgrade'); back(); }}>
                {t('d_equip')}
              </Btn>
            </>
          ) : (
            <>
              <Btn
                kind="red"
                disabled={!!eqBy(selIt)}
                onClick={() => {
                  const v = g.sell(selIt);
                  if (v) {
                    audio.play('coin');
                    store.toast('+' + v, 'good', 'nuts');
                    setSel(null);
                  }
                }}
              >
                {t('sell_for', { n: g.itemValue(selIt) })}
              </Btn>
            </>
          )
        ) : pick && cur ? (
          <Btn kind="steel" wide onClick={() => { g.equip(d!, null, pick.slot); back(); }}>
            {t('d_unequip')}
          </Btn>
        ) : undefined
      }
    >
      {g.storageUsed() > g.storageCap() && <div class="card small bad" style={{ marginBottom: '8px' }}>{t('storage_full')}</div>}
      {items.length === 0 && (
        <div class="empty">
          <Icon n={pick?.slot ?? tab} />
          <div>{t('storage_empty')}</div>
        </div>
      )}
      <div class="items">
        {tab === 'junk' && !pick
          ? [...groups.entries()].map(([def, arr]) => {
              const it = arr[0];
              return (
                <div class={`itile r${g.itemRarity(it)} ${sel === it.uid ? 'sel' : ''}`} onClick={() => setSel(it.uid)}>
                  <span class="count">×{arr.length}</span>
                  <div class="pic">
                    <ItemPic it={it} />
                  </div>
                  <div class="nm">{L(JUNK_BY_ID[def].name)}</div>
                  <div class="meta">
                    <Price n={g.itemValue(it)} />
                  </div>
                </div>
              );
            })
          : items.map((it) => {
              const who = eqBy(it);
              return (
                <div class={`itile r${g.itemRarity(it)} ${sel === it.uid ? 'sel' : ''}`} onClick={() => setSel(it.uid)}>
                  <div class="pic">
                    <ItemPic it={it} />
                  </div>
                  <div class="nm" style={{ color: RARITY_COLORS[g.itemRarity(it)] }}>
                    {g.itemName(it)}
                  </div>
                  <div class="meta">{detail(it)}</div>
                  {who && <div class="small muted ellip" style={{ maxWidth: '100%' }}>{who.first}</div>}
                </div>
              );
            })}
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------------ WASTELAND
export function WastelandPanel() {
  useStore();
  useTicker(500);
  const g = app.g;
  const [open, setOpen] = useState<number | null>(g.s.expeditions[0]?.dweller ?? null);
  return (
    <Sheet
      title={t('waste_title')}
      icon="wasteland"
      foot={
        <Btn wide icon="wasteland" onClick={() => store.openPanel({ type: 'dwellers', pickFor: { explore: true } })}>
          {t('waste_send')}
        </Btn>
      }
    >
      {g.s.expeditions.length === 0 && (
        <div class="empty">
          <Icon n="wasteland" />
          <div>{t('waste_empty')}</div>
        </div>
      )}
      {g.s.expeditions.map((e) => {
        const d = g.dweller(e.dweller);
        if (!d) return null;
        const isOpen = open === e.dweller;
        return (
          <div class="card">
            <div class="row" onClick={() => setOpen(isOpen ? null : e.dweller)} style={{ cursor: 'pointer' }}>
              <Avatar d={d} />
              <div class="grow">
                <b class="ellip">{dwellerName(d)}</b>
                <div class="small muted">
                  {e.ko ? <span class="bad">{t('waste_ko')}</span> : e.returning ? `${t('waste_returning')} · ${fmtClock(e.returnLeft)}` : `${t('waste_elapsed')} ${fmtClock(e.elapsed)} · ${t('waste_depth', { n: expeditionDepthLabel(e) })}`}
                </div>
                <div class="row" style={{ gap: '8px', marginTop: '4px' }}>
                  <span class="statmini">
                    <Icon n="nuts" cls="sm" />
                    {e.nuts}
                  </span>
                  <span class="statmini">
                    <Icon n="storage" cls="sm" />
                    {e.loot.length}
                  </span>
                  <span class="statmini">
                    <Icon n="medkit" cls="sm" />
                    {e.medkits}
                  </span>
                  <span class="statmini">
                    <Icon n="antirad" cls="sm" />
                    {e.antirads}
                  </span>
                </div>
              </div>
              <div style={{ width: '64px' }}>
                <div class="bar">
                  <i style={{ width: `${(d.hp / d.maxHp) * 100}%`, background: '#5ee27f' }} />
                  <i style={{ left: 'auto', right: 0, width: `${(d.rad / d.maxHp) * 100}%`, background: '#e84a3c' }} />
                </div>
              </div>
            </div>
            {isOpen && (
              <>
                <div class="row" style={{ marginTop: '10px', flexWrap: 'wrap' }}>
                  {e.ko ? (
                    <>
                      <Btn kind="green" size="small" icon="heart" disabled={g.s.nuts < g.reviveCost(d)} onClick={() => g.revive(d)}>
                        {t('d_revive')} <Price n={g.reviveCost(d)} />
                      </Btn>
                      <Btn ad size="small" onClick={async () => { if (await app.rewarded()) g.revive(d, true); }}>
                        {t('d_revive_free')}
                      </Btn>
                    </>
                  ) : !e.returning ? (
                    <Btn kind="steel" size="small" icon="door" onClick={() => g.recall(e)}>
                      {t('waste_recall')}
                    </Btn>
                  ) : null}
                  {!e.ko && (
                    <Btn ad size="small" onClick={async () => { if (await app.rewarded()) g.instantReturn(e); }}>
                      {t('waste_instant')}
                    </Btn>
                  )}
                  {!e.ko && g.s.iso >= 3 && (
                    <Btn kind="steel" size="small" onClick={() => { g.s.iso -= 3; g.instantReturn(e); }}>
                      {t('waste_instant')} <Price n={3} icon="iso" />
                    </Btn>
                  )}
                </div>
                <div class="label">{t('waste_log')}</div>
                <div class="log">
                  {e.log
                    .slice(-25)
                    .reverse()
                    .map((l) => (
                      <div class={'e ' + l.kind}>
                        <span class="tm">{fmtClock(l.t)}</span>
                        <span class="tx">{l.text}</span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </Sheet>
  );
}

export function ExplorePanel({ dweller }: { dweller: number }) {
  useStore();
  const g = app.g;
  const d = g.dweller(dweller);
  const [med, setMed] = useState(Math.min(g.s.medkits, 5));
  const [rad, setRad] = useState(Math.min(g.s.antirads, 3));
  if (!d) return null;
  const Step = ({ v, set, max, icon, label }: { v: number; set: (n: number) => void; max: number; icon: string; label: string }) => (
    <div class="card row">
      <Icon n={icon} cls="lg" />
      <div class="grow">
        <b>{label}</b>
        <div class="small muted">
          {v} / {max}
        </div>
      </div>
      <div class="stepper">
        <Btn kind="steel" size="small" disabled={v <= 0} onClick={() => set(Math.max(0, v - 1))}>
          −
        </Btn>
        <span class="v">{v}</span>
        <Btn kind="steel" size="small" disabled={v >= max} onClick={() => set(Math.min(max, v + 1))}>
          +
        </Btn>
      </div>
    </div>
  );
  return (
    <Sheet
      title={t('d_explore')}
      sub={dwellerName(d)}
      icon="wasteland"
      onClose={() => store.openPanel({ type: 'dweller', id: d.id })}
      foot={
        <Btn
          kind="green"
          wide
          icon="wasteland"
          onClick={() => {
            if (g.sendExplore(d, med, rad)) {
              store.openPanel({ type: 'wasteland' });
            }
          }}
        >
          {t('waste_go')}
        </Btn>
      }
    >
      <div class="row">
        <Avatar d={d} />
        <div class="grow">
          <div class="row" style={{ gap: '10px' }}>
            <StatMini stat={1} v={statTotal(g.s, d, 1)} />
            <StatMini stat={S_END} v={statTotal(g.s, d, S_END)} />
            <StatMini stat={S_STR} v={statTotal(g.s, d, S_STR)} />
            <StatMini stat={S_AGI} v={statTotal(g.s, d, S_AGI)} />
            <StatMini stat={6} v={statTotal(g.s, d, 6)} />
          </div>
          <div class="small muted" style={{ marginTop: '4px' }}>
            {t('d_hp')}: {Math.ceil(d.hp)}/{Math.ceil(effMaxHp(d))} · {t('dmg')}: {weaponDamage(g.s, d).toFixed(1)}
          </div>
        </div>
      </div>
      <div class="label">{t('waste_supplies')}</div>
      <Step v={med} set={setMed} max={Math.min(25, g.s.medkits)} icon="medkit" label={t('medkits')} />
      <Step v={rad} set={setRad} max={Math.min(25, g.s.antirads)} icon="antirad" label={t('antirads')} />
      <div class="card small muted" style={{ marginTop: '8px' }}>
        {t('help_5')}
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------------ OBJECTIVES
export function RewardChips({ r }: { r: Reward }) {
  return (
    <div class="reward-row">
      {r.nuts ? (
        <span class="rchip">
          <Icon n="nuts" />
          {fmtInt(r.nuts)}
        </span>
      ) : null}
      {r.iso ? (
        <span class="rchip">
          <Icon n="iso" />
          {r.iso}
        </span>
      ) : null}
      {r.crate ? (
        <span class="rchip">
          <Icon n="crate" />
          {r.crate}
        </span>
      ) : null}
      {r.medkits ? (
        <span class="rchip">
          <Icon n="medkit" />
          {r.medkits}
        </span>
      ) : null}
    </div>
  );
}

export function ObjectivesPanel() {
  useStore();
  useTicker(500);
  const g = app.g;
  const today = Game.todayKey();
  const freeSkip = g.s.objSkipDay !== today;
  return (
    <Sheet title={t('obj_title')} icon="objectives" sub={freeSkip ? t('obj_skip_free') : undefined}>
      {g.s.objectives.map((o) => {
        const p = Math.min(o.target, objectiveProgress(g, o));
        const ready = p >= o.target;
        return (
          <div class="card" data-tut={ready ? 'obj-ready' : undefined} style={ready ? { boxShadow: 'inset 0 0 0 1.5px rgba(94,226,127,.6)', background: 'rgba(94,226,127,.07)' } : undefined}>
            <div class="row">
              <Icon n={ready ? 'check' : 'objectives'} cls="lg" />
              <div class="grow">
                <b>{objectiveText(o)}</b>
                <div style={{ marginTop: '6px' }}>
                  <Bar k={p / o.target} color={ready ? '#5ee27f' : '#ffb02e'} text={`${fmtInt(Math.max(0, p))} / ${fmtInt(o.target)}`} />
                </div>
              </div>
            </div>
            <div class="row" style={{ marginTop: '10px', justifyContent: 'space-between' }}>
              <RewardChips r={o.reward} />
              {ready ? (
                <Btn
                  kind="green"
                  size="small"
                  onClick={() => {
                    const rw = g.claimObjective(o);
                    if (rw) {
                      audio.play('objective');
                      if (rw.nuts) store.pulse('nuts');
                      if (rw.iso) store.pulse('iso');
                      store.toast(t('toast_objective', { n: objectiveText(o) }), 'great', 'check');
                      app.onTutorialEvent('claim');
                    }
                  }}
                >
                  {t('obj_claim')}
                </Btn>
              ) : freeSkip ? (
                <Btn kind="steel" size="small" icon="swap" onClick={() => { g.skipObjective(o); g.s.objSkipDay = today; }}>
                  {t('obj_skip')}
                </Btn>
              ) : (
                <Btn ad size="small" onClick={async () => { if (await app.rewarded()) g.skipObjective(o); }}>
                  {t('obj_skip')}
                </Btn>
              )}
            </div>
          </div>
        );
      })}
    </Sheet>
  );
}

// ------------------------------------------------------------------ SHOP / SUPPLIES
const OFFERS = [
  { key: 'crate', icon: 'crate', cd: 20 * 60, title: () => t('shop_free_crate') },
  { key: 'iso', icon: 'iso', cd: 10 * 60, title: () => t('shop_iso', { n: 5 }) },
  { key: 'nuts', icon: 'nuts', cd: 5 * 60, title: () => t('shop_nuts', { n: nutsOffer() }) },
  { key: 'supplies', icon: 'medkit', cd: 8 * 60, title: () => L({ ru: '+3 аптечки и +2 антирадина', en: '+3 medkits & +2 Anti-Rad' }) },
];
function nutsOffer() {
  return Math.round((150 + app.g.population() * 12) / 10) * 10;
}

export function ShopPanel() {
  useStore();
  useTicker(1000);
  const g = app.g;
  const now = Date.now();
  return (
    <Sheet title={t('shop_title')} icon="gift">
      <DailyCard />
      <div class="label">{t('crates')}</div>
      <div class="card row">
        <Icon n="crate" cls="xl" />
        <div class="grow">
          <b>{t('crate')}</b>
          <div class="small muted">{t('shop_crates_have', { n: g.s.crates })}</div>
        </div>
        <Btn
          disabled={g.s.crates <= 0}
          onClick={() => {
            const cards = g.openCrate();
            if (cards) {
              audio.play('crate');
              store.pushModal({ type: 'crate', cards });
            }
          }}
        >
          {t('crate_open')}
        </Btn>
      </div>
      <div class="label">{L({ ru: 'Бесплатно за просмотр рекламы', en: 'Free for watching an ad' })}</div>
      {OFFERS.map((o) => {
        const ready = (g.s.adCd[o.key] ?? 0) <= now;
        return (
          <div class="card row">
            <Icon n={o.icon} cls="xl" />
            <div class="grow">
              <b>{o.title()}</b>
              {!ready && <div class="small muted">{t('shop_ready_in', { t: fmtTime(((g.s.adCd[o.key] ?? 0) - now) / 1000, lang()) })}</div>}
            </div>
            <Btn
              ad
              disabled={!ready}
              onClick={async () => {
                if (!(await app.rewarded())) return;
                g.s.adCd[o.key] = Date.now() + o.cd * 1000;
                switch (o.key) {
                  case 'crate': {
                    g.s.crates++;
                    const cards = g.openCrate();
                    if (cards) {
                      audio.play('crate');
                      store.pushModal({ type: 'crate', cards });
                    }
                    break;
                  }
                  case 'iso':
                    g.s.iso += 5;
                    store.pulse('iso');
                    audio.play('coin');
                    break;
                  case 'nuts':
                    g.s.nuts += nutsOffer();
                    store.pulse('nuts');
                    audio.play('coin');
                    break;
                  case 'supplies':
                    g.s.medkits += 3;
                    g.s.antirads += 2;
                    audio.play('heal');
                    break;
                }
                app.saveNow();
              }}
            >
              {t('shop_watch')}
            </Btn>
          </div>
        );
      })}
      <div class="label">{t('iso')}</div>
      <div class="card small muted">
        {L({
          ru: 'Изотопы мгновенно возвращают разведчиков, ускоряют тренировки, ожидание малышей и крафт. Их дают за задачи, этапы «Рассвета» и в ящиках.',
          en: 'Isotopes instantly return explorers and speed up training, babies and crafting. Earn them from objectives, Dawn stages and crates.',
        })}
      </div>
    </Sheet>
  );
}

function DailyCard() {
  const g = app.g;
  const avail = g.dailyAvailable();
  const yesterday = Game.todayKey(Date.now() - 86400000);
  const nextDay = avail ? (g.s.daily.last === yesterday ? (g.s.daily.day + 1) % 7 : 0) : g.s.daily.day;
  return (
    <div class="card">
      <div class="row">
        <Icon n="gift" cls="lg" />
        <b class="grow">{t('shop_daily')}</b>
        <Btn
          kind="green"
          size="small"
          disabled={!avail}
          onClick={() => {
            const res = g.claimDaily();
            if (res) {
              audio.play('objective');
              store.toast(t('shop_claimed') + '!', 'great', 'gift');
              if (res.reward.legendary && g.s.crates > 0) {
                const cards = g.openCrate(true);
                if (cards) store.pushModal({ type: 'crate', cards, legendary: true });
              }
            }
          }}
        >
          {avail ? t('shop_claim') : t('shop_claimed')}
        </Btn>
      </div>
      <div class="daily" style={{ marginTop: '10px' }}>
        {DAILY_REWARDS.map((r, i) => {
          const done = avail ? i < nextDay : i <= nextDay;
          const today = avail && i === nextDay;
          const icon = r.crate ? 'crate' : r.iso ? 'iso' : r.medkits ? 'medkit' : 'nuts';
          return (
            <div class={'dday' + (done ? ' done' : '') + (today ? ' today' : '')}>
              <span>{t('shop_daily_day', { n: i + 1 })}</span>
              <Icon n={icon} />
              <span class="num">{r.crate ? (r.legendary ? '★' : '×1') : r.iso ? r.iso : r.nuts ?? r.medkits}</span>
            </div>
          );
        })}
      </div>
      {!avail && <div class="small muted" style={{ marginTop: '8px', textAlign: 'center' }}>{t('shop_come_back')}</div>}
    </div>
  );
}

// ------------------------------------------------------------------ DAWN PROJECT
export function DawnPanel() {
  useStore();
  useTicker(1000);
  const g = app.g;
  const stage = g.s.dawn.stage;
  const st = DAWN_STAGES[stage];
  return (
    <Sheet title={t('dawn_title')} icon="dawn" sub={st ? t('dawn_stage', { n: stage + 1, m: DAWN_STAGES.length }) : undefined} onClose={() => store.openPanel({ type: 'settings' })}>
      <div class="row" style={{ gap: '4px', marginBottom: '12px' }}>
        {DAWN_STAGES.map((_, i) => (
          <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: i < stage ? 'linear-gradient(90deg,#ffcf4a,#6fbf5a)' : i === stage ? 'rgba(255,207,74,.35)' : 'rgba(255,255,255,.08)' }} />
        ))}
      </div>
      {!st ? (
        <div class="empty">
          <Icon n="dawn" cls="xl" />
          <div class="title" style={{ fontSize: '18px', color: 'var(--txt)' }}>{t('dawn_done_all')}</div>
        </div>
      ) : (
        <>
          <div class="card">
            <div class="title" style={{ fontSize: '16px' }}>{L(st.name)}</div>
            <div class="small muted" style={{ marginTop: '6px' }}>{L(st.desc)}</div>
          </div>
          <div class="label">{t('dawn_intro')}</div>
          {st.reqs.map((req) => {
            const v = g.dawnReqValue(req);
            const done = v.cur >= v.need;
            let label = '';
            let icon = 'check';
            switch (req.kind) {
              case 'pop':
                label = t('dawn_req_pop');
                icon = 'people';
                break;
              case 'room':
                label = t('dawn_req_room', { room: L(ROOMS[req.room].name), n: req.level });
                icon = 'hammer';
                break;
              case 'counter':
                label = L(req.label);
                icon = 'objectives';
                break;
              case 'donate':
                label = req.res === 'nuts' ? t('nuts') : t(('res_' + req.res) as any);
                icon = req.res;
                break;
              case 'charge':
                label = t('dawn_req_charge');
                icon = 'dawn';
                break;
            }
            return (
              <div class="card">
                <div class="row">
                  <Icon n={done ? 'check' : icon} cls="lg" />
                  <div class="grow">
                    <b>{label}</b>
                    <div style={{ marginTop: '5px' }}>
                      <Bar k={v.cur / v.need} color={done ? '#5ee27f' : '#ffb02e'} text={`${fmtInt(Math.min(v.cur, v.need))} / ${fmtInt(v.need)}`} />
                    </div>
                  </div>
                  {req.kind === 'donate' && !done && (
                    <Btn
                      size="small"
                      onClick={() => {
                        const n = g.donate(req.res, req.n);
                        if (n > 0) {
                          audio.play('coin');
                          store.toast('−' + fmtInt(n), 'info', req.res);
                        } else audio.play('error');
                      }}
                    >
                      {t('dawn_donate')}
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
          <div class="label">{t('dawn_reward')}</div>
          <RewardChips r={{ nuts: st.reward.nuts, iso: st.reward.iso, crate: st.reward.crate }} />
          <div style={{ marginTop: '14px' }}>
            <Btn kind="green" wide size="big" icon="dawn" disabled={!g.dawnStageReady()} onClick={() => g.completeDawnStage()}>
              {t('dawn_complete')}
            </Btn>
          </div>
        </>
      )}
    </Sheet>
  );
}

// ------------------------------------------------------------------ MISSIONS
export function MissionsPanel() {
  useStore();
  useTicker(500);
  const g = app.g;
  const office = g.roomsOfType('office').find((r) => r.buildLeft <= 0);
  const [pick, setPick] = useState<string | null>(null);
  const [team, setTeam] = useState<number[]>([]);
  if (pick) {
    const m = MISSION_BY_ID[pick];
    const cands = g.s.dwellers.filter((d) => !d.exploring && !d.child && !d.ko && !d.babyAt && d.room !== -1);
    cands.sort((a, b) => b.level - a.level);
    return (
      <Sheet
        title={L(m.name)}
        sub={`${t('mission_team')}: ${team.length}/${m.team}`}
        icon="mission"
        onClose={() => { setPick(null); setTeam([]); }}
        foot={
          <Btn
            kind="green"
            wide
            icon="mission"
            disabled={!team.length}
            onClick={() => {
              const ds = team.map((id) => g.dweller(id)).filter(Boolean) as Dweller[];
              if (g.startMission(m, ds)) {
                audio.play('explore');
                setPick(null);
                setTeam([]);
              }
            }}
          >
            {t('mission_go')}
          </Btn>
        }
      >
        <div class="card small muted">{L(m.desc)}</div>
        <div style={{ marginTop: '8px' }}>
          {cands.map((d) => {
            const on = team.includes(d.id);
            return (
              <div
                class={'lrow' + (on ? ' sel' : '')}
                onClick={() => {
                  audio.play('click');
                  if (on) setTeam(team.filter((x) => x !== d.id));
                  else if (team.length < m.team) setTeam([...team, d.id]);
                }}
              >
                <Avatar d={d} />
                <div class="grow">
                  <b class="ellip">{dwellerName(d)}</b>
                  <div class="small muted">
                    {t('d_level', { n: d.level })} · {t('dmg')} {weaponDamage(g.s, d).toFixed(1)}
                  </div>
                </div>
                {on && <Icon n="check" cls="lg" />}
              </div>
            );
          })}
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet title={t('missions_title')} icon="mission" onClose={() => store.openPanel({ type: 'settings' })}>
      {!office && <div class="card small">{t('missions_need_office')}</div>}
      {MISSIONS.map((m) => {
        const run = g.s.missions.find((x) => x.id === m.id);
        const cd = (g.s.missionCd[m.id] ?? 0) - g.s.time;
        const locked = !office || office.level < m.officeLevel;
        return (
          <div class="card" style={locked ? { opacity: 0.55 } : undefined}>
            <div class="row">
              <Icon n={m.icon} cls="lg" />
              <div class="grow">
                <b>{L(m.name)}</b>
                <div class="small muted">
                  {t('mission_diff')}: {'☠'.repeat(Math.ceil(m.diff / 2))} · {fmtTime(m.travel, lang())} · 👥{m.team}
                </div>
              </div>
            </div>
            <div class="row" style={{ marginTop: '8px', justifyContent: 'space-between' }}>
              <div class="reward-row" style={{ justifyContent: 'flex-start' }}>
                <span class="rchip">
                  <Icon n="nuts" />
                  {m.reward.nuts[0]}–{m.reward.nuts[1]}
                </span>
                {m.reward.crate && (
                  <span class="rchip">
                    <Icon n="crate" />
                  </span>
                )}
                {m.reward.pet && (
                  <span class="rchip">
                    <Icon n="pet" />
                  </span>
                )}
                {m.reward.iso && (
                  <span class="rchip">
                    <Icon n="iso" />
                    {m.reward.iso}
                  </span>
                )}
              </div>
              {locked ? (
                <span class="pill">{t('mission_locked', { n: m.officeLevel })}</span>
              ) : run ? (
                run.phase === 'ready' ? (
                  <Btn kind="red" size="small" onClick={() => store.pushModal({ type: 'battle', run })}>
                    {t('mission_fight')}
                  </Btn>
                ) : (
                  <span class="pill blue">
                    {run.phase === 'travel' ? t('mission_travel') : t('mission_returning')} {fmtClock(run.left)}
                  </span>
                )
              ) : cd > 0 ? (
                <span class="pill">{t('mission_cooldown', { t: fmtTime(cd, lang()) })}</span>
              ) : (
                <Btn size="small" onClick={() => setPick(m.id)}>
                  {t('mission_team')}
                </Btn>
              )}
            </div>
          </div>
        );
      })}
    </Sheet>
  );
}

// ------------------------------------------------------------------ SETTINGS / MENU
const RANKS = [0, 250, 700, 1500, 3000, 6000, 10000];
export function rankOf(score: number) {
  let r = 0;
  for (let i = 0; i < RANKS.length; i++) if (score >= RANKS[i]) r = i;
  return r;
}

export function SettingsPanel() {
  useStore();
  const g = app.g;
  const st = g.s.settings;
  const score = g.rating();
  const rank = rankOf(score);
  const tile = (icon: string, label: string, onClick: () => void, badge?: boolean) => (
    <div class="bcard" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }} onClick={() => { audio.play('click'); onClick(); }}>
      <Icon n={icon} cls="xl" />
      <b class="small">{label}</b>
      {badge && <span class="badge dot" />}
    </div>
  );
  return (
    <Sheet title={t('vault_no', { n: String(g.s.vault).padStart(3, '0') })} icon="door" sub={`${t('settings_rank')}: ${t(('rank_' + rank) as any)} · ${t('settings_rating')}: ${fmtInt(score)}`}>
      <div class="bgrid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))' }}>
        {tile('dawn', t('btn_dawn'), () => store.openPanel({ type: 'dawn' }), g.dawnStageReady())}
        {tile('mission', t('btn_missions'), () => store.openPanel({ type: 'missions' }), g.s.missions.some((m) => m.phase === 'ready'))}
        {tile('robot', t('robots'), () => store.openPanel({ type: 'robots' }))}
        {tile('info', t('settings_help'), () => store.openPanel({ type: 'help' }))}
      </div>
      <div class="label">{t('settings_title')}</div>
      <div class="card">
        <div class="row">
          <Icon n="sound" />
          <span class="grow">{t('settings_sfx')}</span>
          <input
            class="slider"
            style={{ width: '50%' }}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={st.sfx}
            onInput={(e) => {
              st.sfx = Number((e.target as HTMLInputElement).value);
              app.applySettings();
            }}
            onChange={() => audio.play('click')}
          />
        </div>
        <div class="row" style={{ marginTop: '12px' }}>
          <Icon n="music" />
          <span class="grow">{t('settings_music')}</span>
          <input
            class="slider"
            style={{ width: '50%' }}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={st.music}
            onInput={(e) => {
              st.music = Number((e.target as HTMLInputElement).value);
              app.applySettings();
            }}
          />
        </div>
        <div class="row" style={{ marginTop: '12px' }}>
          <span class="grow">{t('settings_lang')}</span>
          <button class={'tab' + (getLang() === 'ru' ? ' on' : '')} onClick={() => { setLang('ru'); st.lang = 'ru'; app.r.cache.lang = 'ru'; app.r.cache.clear(); store.bump(); }}>
            Русский
          </button>
          <button class={'tab' + (getLang() === 'en' ? ' on' : '')} onClick={() => { setLang('en'); st.lang = 'en'; app.r.cache.lang = 'en'; app.r.cache.clear(); store.bump(); }}>
            English
          </button>
        </div>
        <div class="row" style={{ marginTop: '12px' }}>
          <span class="grow">{t('settings_quality')}</span>
          <button class={'tab' + (st.quality < 1 ? ' on' : '')} onClick={() => { st.quality = 0.6; app.applySettings(); app.r.cache.clear(); store.bump(); }}>
            {t('quality_low')}
          </button>
          <button class={'tab' + (st.quality >= 1 ? ' on' : '')} onClick={() => { st.quality = 1; app.applySettings(); app.r.cache.clear(); store.bump(); }}>
            {t('quality_high')}
          </button>
        </div>
      </div>
      <div style={{ marginTop: '14px' }}>
        <Btn
          kind="ghost"
          wide
          onClick={() =>
            store.pushModal({
              type: 'confirm',
              danger: true,
              text: t('settings_reset_confirm'),
              yes: t('settings_reset'),
              onYes: () => {
                app.saves.wipe();
                location.reload();
              },
            })
          }
        >
          <span class="bad">{t('settings_reset')}</span>
        </Btn>
      </div>
    </Sheet>
  );
}

export function HelpPanel() {
  const tips = ['help_1', 'help_2', 'help_3', 'help_4', 'help_5', 'help_6', 'help_7'];
  const icons = ['hammer', 'people', 'power', 'rush', 'wasteland', 'stat_end', 'dawn'];
  return (
    <Sheet title={t('help_title')} icon="info" onClose={() => store.openPanel({ type: 'settings' })}>
      {tips.map((k, i) => (
        <div class="card row">
          <Icon n={icons[i]} cls="lg" />
          <div class="grow small">{t(k as any)}</div>
        </div>
      ))}
    </Sheet>
  );
}

export { RARITY_COLORS };
