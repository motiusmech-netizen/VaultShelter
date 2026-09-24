import type { Loc } from '../i18n';

export interface MissionDef {
  id: string;
  name: Loc;
  desc: Loc;
  diff: number;
  travel: number;
  team: number;
  officeLevel: number;
  enemies: { name: Loc; kind: 'rat' | 'raider' | 'robot' | 'bug' | 'spike' | 'dog' }[];
  reward: { nuts: [number, number]; rarity: number; crate?: number; pet?: boolean; iso?: number; res?: 'food' | 'water' | 'power' };
  icon: string;
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'm_grocery', icon: 'food', officeLevel: 1, diff: 1, travel: 90, team: 3,
    name: { ru: 'Гастроном «Продукты №1»', en: 'Grocery No. 1' },
    desc: { ru: 'Говорят, на складе магазина остались консервы. И крысы. Много крыс.', en: 'Rumor says canned food is left in the store\'s basement. And rats. Lots of rats.' },
    enemies: [{ name: { ru: 'Мутокрыс', en: 'Mutant Rat' }, kind: 'rat' }],
    reward: { nuts: [80, 160], rarity: 0.1, res: 'food' },
  },
  {
    id: 'm_dog', icon: 'pet', officeLevel: 1, diff: 1.4, travel: 120, team: 2,
    name: { ru: 'Потерявшийся пёс', en: 'The Lost Dog' },
    desc: { ru: 'По радио кто-то скулит. Похоже, это собака. Или очень грустный робот.', en: 'Someone\'s whimpering on the radio. Sounds like a dog. Or a very sad robot.' },
    enemies: [{ name: { ru: 'Дикий пёс', en: 'Wild Dog' }, kind: 'dog' }],
    reward: { nuts: [60, 120], rarity: 0.1, pet: true },
  },
  {
    id: 'm_tower', icon: 'radio', officeLevel: 1, diff: 2, travel: 150, team: 3,
    name: { ru: 'Старая радиовышка', en: 'The Old Radio Tower' },
    desc: { ru: 'Если починить вышку, наш сигнал услышат дальше. Правда, её облюбовали роботы.', en: 'Fix the tower and our signal will reach further. Robots have claimed it, though.' },
    enemies: [{ name: { ru: 'Робот-почтальон', en: 'Mailbot' }, kind: 'robot' }],
    reward: { nuts: [180, 300], rarity: 0.3, iso: 2 },
  },
  {
    id: 'm_caravan', icon: 'nuts', officeLevel: 2, diff: 3, travel: 200, team: 3,
    name: { ru: 'Караван торговцев', en: 'Merchant Caravan' },
    desc: { ru: 'Торговцы просят охрану. Платят гайками и не задают вопросов.', en: 'Merchants need an escort. They pay in nuts and ask no questions.' },
    enemies: [{ name: { ru: 'Мародёр', en: 'Raider' }, kind: 'raider' }],
    reward: { nuts: [350, 550], rarity: 0.35 },
  },
  {
    id: 'm_lair', icon: 'weapon', officeLevel: 2, diff: 3.6, travel: 240, team: 3,
    name: { ru: 'Логово мутожуков', en: 'Bug Lair' },
    desc: { ru: 'Гнездо мутожуков под старым заводом. Выжечь дотла!', en: 'A mutant bug nest under an old factory. Burn it out!' },
    enemies: [{ name: { ru: 'Мутожук', en: 'Mutant Bug' }, kind: 'bug' }],
    reward: { nuts: [250, 420], rarity: 0.6 },
  },
  {
    id: 'm_warehouse', icon: 'crate', officeLevel: 2, diff: 4.5, travel: 300, team: 3,
    name: { ru: 'Склад «АтомУют»', en: 'AtomHome Warehouse' },
    desc: { ru: 'Довоенный склад корпорации. Там наверняка остались ящики снабжения!', en: 'A pre-war corporate warehouse. Surely some supply crates are left!' },
    enemies: [{ name: { ru: 'Охранный робот', en: 'Security Bot' }, kind: 'robot' }],
    reward: { nuts: [300, 500], rarity: 0.4, crate: 1 },
  },
  {
    id: 'm_gang', icon: 'alert', officeLevel: 3, diff: 6, travel: 360, team: 3,
    name: { ru: 'Банда «Ржавый кулак»', en: 'The Rusty Fist Gang' },
    desc: { ru: 'Эта банда терроризирует округу. Пора навести порядок.', en: 'This gang terrorizes the area. Time to restore order.' },
    enemies: [{ name: { ru: 'Громила', en: 'Brute' }, kind: 'raider' }],
    reward: { nuts: [800, 1200], rarity: 0.8, iso: 5 },
  },
  {
    id: 'm_nest', icon: 'weapon', officeLevel: 3, diff: 8, travel: 420, team: 3,
    name: { ru: 'Гнездо шипоспинов', en: 'Spikeback Nest' },
    desc: { ru: 'Самые опасные твари Пустоши. Но и трофеи здесь легендарные.', en: 'The deadliest beasts of the wasteland. The trophies are legendary.' },
    enemies: [{ name: { ru: 'Шипоспин', en: 'Spikeback' }, kind: 'spike' }],
    reward: { nuts: [1200, 1800], rarity: 1.2, crate: 1 },
  },
];

export const MISSION_BY_ID: Record<string, MissionDef> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
