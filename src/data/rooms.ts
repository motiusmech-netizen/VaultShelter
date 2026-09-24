import type { Loc } from '../i18n';
import { S_AGI, S_CHA, S_END, S_INT, S_LUC, S_PER, S_STR } from './stats';

export type RoomType =
  | 'door'
  | 'elevator'
  | 'living'
  | 'power'
  | 'diner'
  | 'water'
  | 'storage'
  | 'medbay'
  | 'lab'
  | 'office'
  | 'radio'
  | 'weapons'
  | 'gym'
  | 'armory'
  | 'outfits'
  | 'fitness'
  | 'lounge'
  | 'classroom'
  | 'athletics'
  | 'gameroom'
  | 'reactor'
  | 'garden'
  | 'purifier'
  | 'soda'
  | 'dawn';

export type Produce = 'power' | 'food' | 'water' | 'medkit' | 'antirad' | 'radio' | 'foodwater' | 'dawn' | null;
export type RoomCategory = 'core' | 'prod' | 'hab' | 'train' | 'craft' | 'special';

export interface RoomDef {
  type: RoomType;
  name: Loc;
  desc: Loc;
  stat: number;
  category: RoomCategory;
  unlockPop: number;
  cost: number;
  costStep: number;
  cells: number;
  mergeable: boolean;
  maxLevel: number;
  maxCount: number;
  cap: number;
  produce: Produce;
  store: number;
  rate: number;
  accent: string;
  train?: number;
  craft?: 'weapon' | 'outfit';
  buildable: boolean;
}

const base = {
  cells: 3,
  mergeable: true,
  maxLevel: 3,
  maxCount: 0,
  cap: 2,
  produce: null as Produce,
  store: 0,
  rate: 0,
  buildable: true,
};

export const ROOMS: Record<RoomType, RoomDef> = {
  door: {
    ...base,
    type: 'door',
    name: { ru: 'Гермоворота', en: 'Vault Door' },
    desc: { ru: 'Главный вход. Охранники первыми встречают незваных гостей.', en: 'Main entrance. Guards meet unwanted guests first.' },
    stat: -1,
    category: 'core',
    unlockPop: 0,
    cost: 0,
    costStep: 0,
    mergeable: false,
    maxCount: 1,
    accent: '#ffb02e',
    buildable: false,
  },
  elevator: {
    ...base,
    type: 'elevator',
    name: { ru: 'Лифт', en: 'Elevator' },
    desc: { ru: 'Соединяет этажи. Стройте друг над другом.', en: 'Connects floors. Stack them vertically.' },
    stat: -1,
    category: 'core',
    unlockPop: 0,
    cost: 60,
    costStep: 0,
    cells: 1,
    mergeable: false,
    maxLevel: 1,
    cap: 0,
    accent: '#9fb4c7',
  },
  living: {
    ...base,
    type: 'living',
    name: { ru: 'Жилой отсек', en: 'Living Quarters' },
    desc: { ru: 'Увеличивает вместимость убежища. Здесь жители знакомятся и заводят семьи.', en: 'Raises vault capacity. Dwellers meet and start families here.' },
    stat: S_CHA,
    category: 'hab',
    unlockPop: 0,
    cost: 100,
    costStep: 50,
    accent: '#ff7cc0',
  },
  power: {
    ...base,
    type: 'power',
    name: { ru: 'Электростанция', en: 'Power Generator' },
    desc: { ru: 'Вырабатывает энергию. Без неё комнаты гаснут.', en: 'Generates power. Without it rooms go dark.' },
    stat: S_STR,
    category: 'prod',
    unlockPop: 0,
    cost: 100,
    costStep: 50,
    produce: 'power',
    store: 12,
    rate: 0.026,
    accent: '#ffd23d',
  },
  diner: {
    ...base,
    type: 'diner',
    name: { ru: 'Столовая', en: 'Diner' },
    desc: { ru: 'Готовит еду. Голодные жители теряют здоровье.', en: 'Cooks food. Hungry dwellers lose health.' },
    stat: S_AGI,
    category: 'prod',
    unlockPop: 0,
    cost: 100,
    costStep: 50,
    produce: 'food',
    store: 10,
    rate: 0.026,
    accent: '#ff9b3d',
  },
  water: {
    ...base,
    type: 'water',
    name: { ru: 'Водоочистная', en: 'Water Treatment' },
    desc: { ru: 'Очищает воду. Грязная вода — это радиация.', en: 'Purifies water. Dirty water means radiation.' },
    stat: S_PER,
    category: 'prod',
    unlockPop: 0,
    cost: 100,
    costStep: 50,
    produce: 'water',
    store: 10,
    rate: 0.026,
    accent: '#39c6e8',
  },
  storage: {
    ...base,
    type: 'storage',
    name: { ru: 'Склад', en: 'Storage Room' },
    desc: { ru: 'Место для снаряжения и хлама. Увеличивает запасы ресурсов.', en: 'Room for gear and junk. Raises resource capacity.' },
    stat: S_END,
    category: 'hab',
    unlockPop: 12,
    cost: 300,
    costStep: 75,
    accent: '#c9a26b',
  },
  medbay: {
    ...base,
    type: 'medbay',
    name: { ru: 'Медпункт', en: 'Medbay' },
    desc: { ru: 'Производит аптечки для лечения жителей.', en: 'Produces medkits to heal dwellers.' },
    stat: S_INT,
    category: 'prod',
    unlockPop: 14,
    cost: 400,
    costStep: 100,
    produce: 'medkit',
    store: 1,
    rate: 0.0022,
    accent: '#ff5a6e',
  },
  lab: {
    ...base,
    type: 'lab',
    name: { ru: 'Лаборатория', en: 'Science Lab' },
    desc: { ru: 'Синтезирует антирадин — выводит радиацию.', en: 'Synthesizes Anti-Rad to purge radiation.' },
    stat: S_INT,
    category: 'prod',
    unlockPop: 16,
    cost: 400,
    costStep: 100,
    produce: 'antirad',
    store: 1,
    rate: 0.0022,
    accent: '#b58cff',
  },
  office: {
    ...base,
    type: 'office',
    name: { ru: 'Кабинет смотрителя', en: "Overseer's Office" },
    desc: { ru: 'Открывает вылазки за пределы убежища и дополнительную задачу.', en: 'Unlocks field missions and an extra objective slot.' },
    stat: -1,
    category: 'special',
    unlockPop: 18,
    cost: 800,
    costStep: 0,
    mergeable: false,
    maxCount: 1,
    cap: 0,
    accent: '#ffb02e',
  },
  radio: {
    ...base,
    type: 'radio',
    name: { ru: 'Радиостудия', en: 'Radio Studio' },
    desc: { ru: 'Вещает на Пустошь и привлекает новых жителей. Поднимает настроение.', en: 'Broadcasts to the wasteland, attracting new dwellers. Boosts happiness.' },
    stat: S_CHA,
    category: 'special',
    unlockPop: 20,
    cost: 1500,
    costStep: 500,
    maxCount: 2,
    produce: 'radio',
    store: 1,
    rate: 0.0009,
    accent: '#ff7cc0',
  },
  weapons: {
    ...base,
    type: 'weapons',
    name: { ru: 'Оружейная мастерская', en: 'Weapon Workshop' },
    desc: { ru: 'Создаёт оружие из хлама.', en: 'Crafts weapons from junk.' },
    stat: S_STR,
    category: 'craft',
    unlockPop: 22,
    cost: 1200,
    costStep: 400,
    maxCount: 2,
    craft: 'weapon',
    accent: '#ff6a4d',
  },
  gym: {
    ...base,
    type: 'gym',
    name: { ru: 'Тренажёрный зал', en: 'Weight Room' },
    desc: { ru: 'Тренирует Силу.', en: 'Trains Strength.' },
    stat: S_STR,
    category: 'train',
    unlockPop: 24,
    cost: 600,
    costStep: 200,
    train: S_STR,
    accent: '#ff6a4d',
  },
  armory: {
    ...base,
    type: 'armory',
    name: { ru: 'Тир', en: 'Shooting Range' },
    desc: { ru: 'Тренирует Восприятие.', en: 'Trains Perception.' },
    stat: S_PER,
    category: 'train',
    unlockPop: 26,
    cost: 600,
    costStep: 200,
    train: S_PER,
    accent: '#39c6e8',
  },
  outfits: {
    ...base,
    type: 'outfits',
    name: { ru: 'Швейная мастерская', en: 'Outfit Workshop' },
    desc: { ru: 'Шьёт костюмы, которые повышают характеристики.', en: 'Sews outfits that boost stats.' },
    stat: S_CHA,
    category: 'craft',
    unlockPop: 30,
    cost: 1500,
    costStep: 500,
    maxCount: 2,
    craft: 'outfit',
    accent: '#ff7cc0',
  },
  fitness: {
    ...base,
    type: 'fitness',
    name: { ru: 'Спортзал', en: 'Fitness Room' },
    desc: { ru: 'Тренирует Выносливость.', en: 'Trains Endurance.' },
    stat: S_END,
    category: 'train',
    unlockPop: 32,
    cost: 700,
    costStep: 200,
    train: S_END,
    accent: '#62d17a',
  },
  lounge: {
    ...base,
    type: 'lounge',
    name: { ru: 'Лаунж', en: 'Lounge' },
    desc: { ru: 'Тренирует Обаяние.', en: 'Trains Charisma.' },
    stat: S_CHA,
    category: 'train',
    unlockPop: 36,
    cost: 700,
    costStep: 200,
    train: S_CHA,
    accent: '#ff7cc0',
  },
  classroom: {
    ...base,
    type: 'classroom',
    name: { ru: 'Учебный класс', en: 'Classroom' },
    desc: { ru: 'Тренирует Интеллект.', en: 'Trains Intelligence.' },
    stat: S_INT,
    category: 'train',
    unlockPop: 40,
    cost: 800,
    costStep: 250,
    train: S_INT,
    accent: '#7f95ff',
  },
  athletics: {
    ...base,
    type: 'athletics',
    name: { ru: 'Акробатический зал', en: 'Athletics Room' },
    desc: { ru: 'Тренирует Ловкость.', en: 'Trains Agility.' },
    stat: S_AGI,
    category: 'train',
    unlockPop: 45,
    cost: 800,
    costStep: 250,
    train: S_AGI,
    accent: '#ffc23d',
  },
  gameroom: {
    ...base,
    type: 'gameroom',
    name: { ru: 'Игровая комната', en: 'Game Room' },
    desc: { ru: 'Тренирует Удачу.', en: 'Trains Luck.' },
    stat: S_LUC,
    category: 'train',
    unlockPop: 50,
    cost: 900,
    costStep: 300,
    train: S_LUC,
    accent: '#b6e04a',
  },
  reactor: {
    ...base,
    type: 'reactor',
    name: { ru: 'Атомный реактор', en: 'Nuclear Reactor' },
    desc: { ru: 'Мощный источник энергии для большого убежища.', en: 'Powerful energy source for a large vault.' },
    stat: S_STR,
    category: 'prod',
    unlockPop: 60,
    cost: 2400,
    costStep: 800,
    produce: 'power',
    store: 30,
    rate: 0.032,
    accent: '#8cff6a',
  },
  garden: {
    ...base,
    type: 'garden',
    name: { ru: 'Оранжерея', en: 'Garden' },
    desc: { ru: 'Выращивает много свежей еды.', en: 'Grows plenty of fresh food.' },
    stat: S_AGI,
    category: 'prod',
    unlockPop: 70,
    cost: 2400,
    costStep: 800,
    produce: 'food',
    store: 25,
    rate: 0.032,
    accent: '#7ed957',
  },
  purifier: {
    ...base,
    type: 'purifier',
    name: { ru: 'Водоочистительный комплекс', en: 'Water Purification' },
    desc: { ru: 'Промышленная очистка воды.', en: 'Industrial-scale water purification.' },
    stat: S_PER,
    category: 'prod',
    unlockPop: 80,
    cost: 2400,
    costStep: 800,
    produce: 'water',
    store: 25,
    rate: 0.032,
    accent: '#39c6e8',
  },
  soda: {
    ...base,
    type: 'soda',
    name: { ru: 'Цех газировки «Шипучка»', en: '"Fizz" Soda Plant' },
    desc: { ru: 'Разливает газировку: сразу и еда, и вода.', en: 'Bottles soda: food and water at once.' },
    stat: S_END,
    category: 'prod',
    unlockPop: 100,
    cost: 4000,
    costStep: 1500,
    produce: 'foodwater',
    store: 16,
    rate: 0.03,
    accent: '#ff5a6e',
  },
  dawn: {
    ...base,
    type: 'dawn',
    name: { ru: 'Центр «Рассвет»', en: 'Dawn Center' },
    desc: { ru: 'Сердце проекта по возрождению поверхности.', en: 'Heart of the project to revive the surface.' },
    stat: S_INT,
    category: 'special',
    unlockPop: 55,
    cost: 6000,
    costStep: 0,
    maxCount: 1,
    produce: 'dawn',
    store: 1,
    rate: 0.0016,
    accent: '#ffe27a',
  },
};

export const BUILD_ORDER: RoomType[] = [
  'elevator',
  'power',
  'diner',
  'water',
  'living',
  'storage',
  'medbay',
  'lab',
  'office',
  'radio',
  'weapons',
  'gym',
  'armory',
  'outfits',
  'fitness',
  'lounge',
  'classroom',
  'athletics',
  'gameroom',
  'dawn',
  'reactor',
  'garden',
  'purifier',
  'soda',
];

/** Store amount per cycle multiplier by level. */
export const LVL_STORE = [1, 1.45, 1.9];
/** Speed multiplier by level. */
export const LVL_RATE = [1, 1.12, 1.25];
/** Merge efficiency by size (1..3). */
export const MERGE_BONUS = [1, 1.06, 1.12];
/** Living quarters capacity per size unit by level. */
export const LIVING_CAP = [8, 10, 12];
