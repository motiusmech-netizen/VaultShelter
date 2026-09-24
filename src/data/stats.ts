import type { Loc } from '../i18n';

export const STAT_COUNT = 7;
export const S_STR = 0,
  S_PER = 1,
  S_END = 2,
  S_CHA = 3,
  S_INT = 4,
  S_AGI = 5,
  S_LUC = 6;

export interface StatDef {
  key: string;
  name: Loc;
  short: Loc;
  color: string;
  icon: string;
  desc: Loc;
}

export const STATS: StatDef[] = [
  {
    key: 'str',
    name: { ru: 'Сила', en: 'Strength' },
    short: { ru: 'СИЛ', en: 'STR' },
    color: '#ff6a4d',
    icon: 'stat_str',
    desc: { ru: 'Энергия, реактор, мастерская оружия, урон в ближнем бою', en: 'Power, reactor, weapon workshop, melee damage' },
  },
  {
    key: 'per',
    name: { ru: 'Восприятие', en: 'Perception' },
    short: { ru: 'ВСП', en: 'PER' },
    color: '#39c6e8',
    icon: 'stat_per',
    desc: { ru: 'Вода, очистка, находки в Пустоши, меткость', en: 'Water, purification, wasteland finds, accuracy' },
  },
  {
    key: 'end',
    name: { ru: 'Выносливость', en: 'Endurance' },
    short: { ru: 'ВЫН', en: 'END' },
    color: '#62d17a',
    icon: 'stat_end',
    desc: { ru: 'Здоровье при повышении уровня, склад, стойкость к радиации', en: 'HP gain on level-up, storage, radiation resistance' },
  },
  {
    key: 'cha',
    name: { ru: 'Обаяние', en: 'Charisma' },
    short: { ru: 'ОБА', en: 'CHA' },
    color: '#ff7cc0',
    icon: 'stat_cha',
    desc: { ru: 'Жилой отсек, радио, знакомства, мастерская костюмов', en: 'Living quarters, radio, romance, outfit workshop' },
  },
  {
    key: 'int',
    name: { ru: 'Интеллект', en: 'Intelligence' },
    short: { ru: 'ИНТ', en: 'INT' },
    color: '#7f95ff',
    icon: 'stat_int',
    desc: { ru: 'Медпункт, лаборатория, центр «Рассвет»', en: 'Medbay, science lab, Dawn Center' },
  },
  {
    key: 'agi',
    name: { ru: 'Ловкость', en: 'Agility' },
    short: { ru: 'ЛОВ', en: 'AGI' },
    color: '#ffc23d',
    icon: 'stat_agi',
    desc: { ru: 'Еда, оранжерея, скорость в Пустоши и в бою', en: 'Food, garden, speed in combat and wasteland' },
  },
  {
    key: 'luc',
    name: { ru: 'Удача', en: 'Luck' },
    short: { ru: 'УДЧ', en: 'LCK' },
    color: '#b6e04a',
    icon: 'stat_luc',
    desc: { ru: 'Бонусные гайки, успех ускорений, редкие находки', en: 'Bonus nuts, rush success, rare finds' },
  },
];
