import { store, useStore } from './store';
import { Hud } from './Hud';
import { Modals } from './modals';
import { Tutorial } from './tutorial';
import { TitleScreen, VaultPick, IntroOverlay } from './screens';
import { Icon, Btn } from './kit';
import { app } from '../app';
import { t, L } from '../i18n';
import { ROOMS } from '../data/rooms';
import { Price } from './kit';
import { fmtInt } from '../core/util';
import {
  AssignPanel, BuildPanel, CraftPanel, DwellerPanel, DwellersPanel, RobotsPanel, RockPanel, RoomPanel,
} from './panelsVault';
import {
  DawnPanel, ExplorePanel, HelpPanel, MissionsPanel, ObjectivesPanel, SettingsPanel, ShopPanel, StoragePanel, WastelandPanel,
} from './panelsMeta';

function Panel() {
  const p = store.s.panel;
  if (!p) return null;
  switch (p.type) {
    case 'room':
      return <RoomPanel id={p.id} />;
    case 'dweller':
      return <DwellerPanel id={p.id} />;
    case 'build':
      return <BuildPanel />;
    case 'dwellers':
      return <DwellersPanel pickFor={p.pickFor} />;
    case 'storage':
      return <StoragePanel tab={p.tab} pick={p.pick} />;
    case 'wasteland':
      return <WastelandPanel />;
    case 'objectives':
      return <ObjectivesPanel />;
    case 'shop':
      return <ShopPanel />;
    case 'dawn':
      return <DawnPanel />;
    case 'missions':
      return <MissionsPanel />;
    case 'settings':
      return <SettingsPanel />;
    case 'rock':
      return <RockPanel id={p.id} />;
    case 'robots':
      return <RobotsPanel />;
    case 'explore':
      return <ExplorePanel dweller={p.dweller} />;
    case 'assign':
      return <AssignPanel dweller={p.dweller} />;
    case 'craft':
      return <CraftPanel room={p.room} />;
    case 'help':
      return <HelpPanel />;
  }
  return null;
}

function BuildBar() {
  const tp = store.s.buildMode;
  if (!tp) return null;
  const def = ROOMS[tp as keyof typeof ROOMS];
  return (
    <div class="buildbar">
      <Icon n="hammer" cls="lg" />
      <div class="col" style={{ gap: '2px' }}>
        <b>{L(def.name)}</b>
        <span class="small muted">{t('build_place_hint')}</span>
      </div>
      <Price n={fmtInt(app.g.buildCost(tp as any, 1))} />
      <Btn kind="steel" size="small" onClick={() => app.exitBuild()}>
        {t('build_cancel')}
      </Btn>
    </div>
  );
}

function Toasts() {
  const st = store.s;
  return (
    <div class="toasts">
      {st.toasts.map((to) => (
        <div class={'toast ' + to.kind} key={to.id}>
          {to.icon && <Icon n={to.icon} />}
          <span>{to.text}</span>
        </div>
      ))}
    </div>
  );
}

export function Root() {
  const st = useStore();
  return (
    <>
      <div class="vignette" />
      {st.screen === 'title' && <TitleScreen />}
      {st.screen === 'vaultpick' && <VaultPick />}
      {st.screen === 'intro' && <IntroOverlay />}
      {st.screen === 'game' && (
        <>
          <Hud />
          <Panel />
          <BuildBar />
          <Tutorial />
        </>
      )}
      <Toasts />
      <Modals />
    </>
  );
}
