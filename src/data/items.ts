import type { Loc } from '../i18n';

export type Rarity = 0 | 1 | 2; // common, rare, legendary
export const RARITY_COLORS = ['#b9c3cc', '#5fb8ff', '#ffc53d'];
export const RARITY_NAMES: Loc[] = [
  { ru: 'Обычный', en: 'Common' },
  { ru: 'Редкий', en: 'Rare' },
  { ru: 'Легендарный', en: 'Legendary' },
];

export type WeaponKind = 'melee' | 'blade' | 'pistol' | 'rifle' | 'shotgun' | 'laser' | 'plasma' | 'heavy' | 'sling' | 'guitar';

export interface WeaponDef {
  id: string;
  name: Loc;
  dmg: [number, number];
  rarity: Rarity;
  kind: WeaponKind;
  color: string;
  glow?: string;
}

export type OutfitStyle = 'jumpsuit' | 'coat' | 'suit' | 'dress' | 'armor' | 'space' | 'sport' | 'overalls' | 'robe' | 'casual' | 'ninja';
export type HatKind = 'none' | 'helmet' | 'cap' | 'chef' | 'hood' | 'beret' | 'hardhat' | 'tophat' | 'bandana' | 'goggles' | 'crown';

export interface OutfitDef {
  id: string;
  name: Loc;
  bonus: number[]; // 7 stats
  rarity: Rarity;
  style: OutfitStyle;
  top: string;
  bottom: string;
  accent: string;
  hat: HatKind;
  hatColor?: string;
}

export interface JunkDef {
  id: string;
  name: Loc;
  rarity: Rarity;
  value: number;
  icon: string;
}

export type PetBonus = 'prod' | 'xp' | 'train' | 'dmg' | 'hp' | 'loot' | 'return' | 'happy' | 'nuts';

export interface PetDef {
  id: string;
  name: Loc;
  species: 'dog' | 'cat' | 'hedgehog' | 'raccoon' | 'parrot' | 'turtle';
  color: string;
  color2: string;
  bonus: PetBonus;
  value: [number, number, number]; // by rarity
}

const b = (s = 0, p = 0, e = 0, c = 0, i = 0, a = 0, l = 0) => [s, p, e, c, i, a, l];

export const WEAPONS: WeaponDef[] = [
  // common
  { id: 'w_spoon', name: { ru: 'Боевая ложка', en: 'Battle Spoon' }, dmg: [1, 2], rarity: 0, kind: 'melee', color: '#c9d2d9' },
  { id: 'w_rollpin', name: { ru: 'Скалка', en: 'Rolling Pin' }, dmg: [1, 3], rarity: 0, kind: 'melee', color: '#c79a62' },
  { id: 'w_sling', name: { ru: 'Рогатка', en: 'Slingshot' }, dmg: [1, 3], rarity: 0, kind: 'sling', color: '#a8733f' },
  { id: 'w_wrench', name: { ru: 'Разводной ключ', en: 'Pipe Wrench' }, dmg: [2, 3], rarity: 0, kind: 'melee', color: '#9aa7b0' },
  { id: 'w_knife', name: { ru: 'Кухонный нож', en: 'Kitchen Knife' }, dmg: [1, 4], rarity: 0, kind: 'blade', color: '#d8dee3' },
  { id: 'w_bat', name: { ru: 'Бейсбольная бита', en: 'Baseball Bat' }, dmg: [2, 4], rarity: 0, kind: 'melee', color: '#d2a466' },
  { id: 'w_pipe', name: { ru: 'Самопальный пистолет', en: 'Pipe Pistol' }, dmg: [2, 5], rarity: 0, kind: 'pistol', color: '#7a6a5a' },
  { id: 'w_air', name: { ru: 'Пневматическая винтовка', en: 'Air Rifle' }, dmg: [3, 5], rarity: 0, kind: 'rifle', color: '#6d7f63' },
  { id: 'w_revolver', name: { ru: 'Старый револьвер', en: 'Old Revolver' }, dmg: [3, 6], rarity: 0, kind: 'pistol', color: '#5c6670' },
  { id: 'w_hunting', name: { ru: 'Охотничье ружьё', en: 'Hunting Rifle' }, dmg: [4, 7], rarity: 0, kind: 'rifle', color: '#7b5a3a' },
  // rare
  { id: 'w_shotgun', name: { ru: 'Двустволка', en: 'Double Barrel' }, dmg: [5, 9], rarity: 1, kind: 'shotgun', color: '#6b4b32' },
  { id: 'w_smg', name: { ru: 'Пистолет-пулемёт', en: 'Submachine Gun' }, dmg: [5, 8], rarity: 1, kind: 'rifle', color: '#3f474f' },
  { id: 'w_nailgun', name: { ru: 'Гвоздомёт', en: 'Nail Gun' }, dmg: [5, 8], rarity: 1, kind: 'pistol', color: '#e3b33d' },
  { id: 'w_laserp', name: { ru: 'Лазерный пистолет «Луч»', en: '"Ray" Laser Pistol' }, dmg: [6, 9], rarity: 1, kind: 'laser', color: '#b8c2cc', glow: '#ff4b4b' },
  { id: 'w_sledge', name: { ru: 'Кувалда', en: 'Sledgehammer' }, dmg: [7, 10], rarity: 1, kind: 'melee', color: '#6f7a83' },
  { id: 'w_lasr', name: { ru: 'Лазерная винтовка', en: 'Laser Rifle' }, dmg: [8, 11], rarity: 1, kind: 'laser', color: '#8c969f', glow: '#ff4b4b' },
  { id: 'w_crossbow', name: { ru: 'Арбалет', en: 'Crossbow' }, dmg: [7, 11], rarity: 1, kind: 'rifle', color: '#6e4d2c' },
  // legendary
  { id: 'w_plasma', name: { ru: 'Плазменная винтовка «Заря»', en: '"Dawn" Plasma Rifle' }, dmg: [11, 15], rarity: 2, kind: 'plasma', color: '#4f5d58', glow: '#6aff8c' },
  { id: 'w_gauss', name: { ru: 'Гаусс-винтовка', en: 'Gauss Rifle' }, dmg: [12, 16], rarity: 2, kind: 'rifle', color: '#46505a', glow: '#5fd3ff' },
  { id: 'w_tesla', name: { ru: 'Тесла-пушка', en: 'Tesla Cannon' }, dmg: [13, 17], rarity: 2, kind: 'heavy', color: '#5b6470', glow: '#8fd8ff' },
  { id: 'w_hammer', name: { ru: 'Молот Смотрителя', en: "Overseer's Hammer" }, dmg: [12, 18], rarity: 2, kind: 'melee', color: '#c79a3d' },
  { id: 'w_guitar', name: { ru: 'Электрогитара «Аккорд»', en: '"Chord" Electric Guitar' }, dmg: [11, 17], rarity: 2, kind: 'guitar', color: '#d9432e' },
  { id: 'w_ladle', name: { ru: 'Золотой половник', en: 'Golden Ladle' }, dmg: [14, 18], rarity: 2, kind: 'melee', color: '#ffcf4a' },
  { id: 'w_minigun', name: { ru: 'Миниган «Ураган»', en: '"Hurricane" Minigun' }, dmg: [14, 20], rarity: 2, kind: 'heavy', color: '#3a4148' },
];

export const OUTFITS: OutfitDef[] = [
  // common
  { id: 'o_work', name: { ru: 'Рабочая роба', en: 'Work Clothes' }, bonus: b(1), rarity: 0, style: 'overalls', top: '#8c6a45', bottom: '#5b4a3a', accent: '#d9b35f', hat: 'none' },
  { id: 'o_lab', name: { ru: 'Лабораторный халат', en: 'Lab Coat' }, bonus: b(0, 0, 0, 0, 1), rarity: 0, style: 'coat', top: '#eef2f4', bottom: '#4d5f78', accent: '#9fb4c7', hat: 'none' },
  { id: 'o_sport', name: { ru: 'Спортивный костюм', en: 'Tracksuit' }, bonus: b(0, 0, 0, 0, 0, 1), rarity: 0, style: 'sport', top: '#2f6fd6', bottom: '#2a3f7a', accent: '#f4f4f4', hat: 'none' },
  { id: 'o_casual', name: { ru: 'Повседневная одежда', en: 'Casual Wear' }, bonus: b(0, 0, 0, 1), rarity: 0, style: 'casual', top: '#d0584a', bottom: '#3e5673', accent: '#f1e2c4', hat: 'none' },
  { id: 'o_rain', name: { ru: 'Дождевик', en: 'Raincoat' }, bonus: b(0, 1), rarity: 0, style: 'coat', top: '#f2c230', bottom: '#46505a', accent: '#c99a1a', hat: 'hood', hatColor: '#f2c230' },
  { id: 'o_mechanic', name: { ru: 'Комбинезон механика', en: 'Mechanic Jumpsuit' }, bonus: b(1, 0, 1), rarity: 0, style: 'jumpsuit', top: '#4b6b3f', bottom: '#4b6b3f', accent: '#d9a441', hat: 'cap', hatColor: '#3a522f' },
  { id: 'o_farmer', name: { ru: 'Одежда фермера', en: 'Farmer Clothes' }, bonus: b(0, 1, 0, 0, 0, 1), rarity: 0, style: 'overalls', top: '#c9463d', bottom: '#3b5f95', accent: '#e8d7b0', hat: 'none' },
  { id: 'o_medic', name: { ru: 'Медицинская форма', en: 'Medic Scrubs' }, bonus: b(0, 0, 0, 0, 2), rarity: 0, style: 'casual', top: '#56c2a8', bottom: '#56c2a8', accent: '#ffffff', hat: 'none' },
  { id: 'o_builder', name: { ru: 'Спецовка строителя', en: 'Builder Outfit' }, bonus: b(1, 0, 1), rarity: 0, style: 'overalls', top: '#f08a24', bottom: '#44515c', accent: '#f5e04f', hat: 'hardhat', hatColor: '#f5c524' },
  // rare
  { id: 'o_military', name: { ru: 'Военная форма', en: 'Military Fatigues' }, bonus: b(2, 1, 2), rarity: 1, style: 'jumpsuit', top: '#5d6a3a', bottom: '#4c5731', accent: '#2e3520', hat: 'beret', hatColor: '#6b2f2a' },
  { id: 'o_tux', name: { ru: 'Смокинг', en: 'Tuxedo' }, bonus: b(0, 0, 0, 3), rarity: 1, style: 'suit', top: '#23262d', bottom: '#1b1d22', accent: '#f4f4f4', hat: 'none' },
  { id: 'o_evening', name: { ru: 'Вечернее платье', en: 'Evening Gown' }, bonus: b(0, 0, 0, 3, 0, 0, 1), rarity: 1, style: 'dress', top: '#b2244b', bottom: '#8d1c3b', accent: '#ffd36b', hat: 'none' },
  { id: 'o_engineer', name: { ru: 'Костюм инженера', en: 'Engineer Suit' }, bonus: b(2, 0, 0, 0, 2), rarity: 1, style: 'jumpsuit', top: '#e0a13a', bottom: '#5b6470', accent: '#30363d', hat: 'goggles', hatColor: '#3a3f46' },
  { id: 'o_scientist', name: { ru: 'Костюм учёного', en: 'Scientist Suit' }, bonus: b(0, 1, 0, 0, 3), rarity: 1, style: 'coat', top: '#f4f6f8', bottom: '#2c3e57', accent: '#5fb8ff', hat: 'goggles', hatColor: '#5a6b7a' },
  { id: 'o_athlete', name: { ru: 'Форма атлета', en: 'Athlete Uniform' }, bonus: b(0, 0, 1, 0, 0, 3), rarity: 1, style: 'sport', top: '#e23c3c', bottom: '#f4f4f4', accent: '#1f3c88', hat: 'bandana', hatColor: '#e23c3c' },
  { id: 'o_combat', name: { ru: 'Боевая броня', en: 'Combat Armor' }, bonus: b(1, 0, 3), rarity: 1, style: 'armor', top: '#50565d', bottom: '#3a3f45', accent: '#8b949c', hat: 'helmet', hatColor: '#50565d' },
  { id: 'o_hazmat', name: { ru: 'Химзащита', en: 'Hazmat Suit' }, bonus: b(0, 2, 2), rarity: 1, style: 'space', top: '#e8d23a', bottom: '#e8d23a', accent: '#3c3c3c', hat: 'hood', hatColor: '#e8d23a' },
  { id: 'o_gambler', name: { ru: 'Костюм игрока', en: "Gambler's Suit" }, bonus: b(0, 0, 0, 1, 0, 0, 3), rarity: 1, style: 'suit', top: '#2e6b4f', bottom: '#1f2a26', accent: '#e9c46a', hat: 'tophat', hatColor: '#1f2326' },
  { id: 'o_chef', name: { ru: 'Костюм шеф-повара', en: 'Chef Outfit' }, bonus: b(0, 0, 0, 1, 0, 2, 1), rarity: 1, style: 'coat', top: '#f7f7f2', bottom: '#2b2b2b', accent: '#d64541', hat: 'chef', hatColor: '#ffffff' },
  // legendary
  { id: 'o_exo', name: { ru: 'Силовой экзоскелет', en: 'Power Exosuit' }, bonus: b(5, 0, 2), rarity: 2, style: 'armor', top: '#9a6b2f', bottom: '#6d4b22', accent: '#ffcf4a', hat: 'helmet', hatColor: '#9a6b2f' },
  { id: 'o_cosmo', name: { ru: 'Скафандр космонавта', en: 'Cosmonaut Suit' }, bonus: b(0, 3, 4), rarity: 2, style: 'space', top: '#eef1f4', bottom: '#dfe4ea', accent: '#d9432e', hat: 'helmet', hatColor: '#eef1f4' },
  { id: 'o_professor', name: { ru: 'Мантия профессора', en: "Professor's Robe" }, bonus: b(0, 0, 0, 0, 6), rarity: 2, style: 'robe', top: '#2a2f6b', bottom: '#1f2350', accent: '#ffcf4a', hat: 'none' },
  { id: 'o_lucky', name: { ru: 'Счастливый пиджак', en: 'Lucky Blazer' }, bonus: b(0, 0, 0, 1, 0, 0, 6), rarity: 2, style: 'suit', top: '#3fa34d', bottom: '#223326', accent: '#ffe27a', hat: 'tophat', hatColor: '#2b6a33' },
  { id: 'o_ninja', name: { ru: 'Костюм ниндзя', en: 'Ninja Garb' }, bonus: b(0, 1, 0, 0, 0, 6), rarity: 2, style: 'ninja', top: '#20232a', bottom: '#191b20', accent: '#c0392b', hat: 'bandana', hatColor: '#20232a' },
  { id: 'o_rock', name: { ru: 'Костюм рок-звезды', en: 'Rock Star Outfit' }, bonus: b(0, 0, 0, 5, 0, 0, 2), rarity: 2, style: 'casual', top: '#1c1c1f', bottom: '#2c2c33', accent: '#ff3d7f', hat: 'none' },
  { id: 'o_overseer', name: { ru: 'Мундир смотрителя', en: "Overseer's Uniform" }, bonus: b(1, 1, 1, 2, 2, 0, 1), rarity: 2, style: 'suit', top: '#1f4e8c', bottom: '#183d6d', accent: '#ffcf4a', hat: 'cap', hatColor: '#1f4e8c' },
  { id: 'o_granny', name: { ru: 'Халат бабушки Зины', en: "Granny Zina's Robe" }, bonus: b(0, 0, 3, 3, 0, 0, 1), rarity: 2, style: 'dress', top: '#7b4aa0', bottom: '#5e3780', accent: '#ffe27a', hat: 'bandana', hatColor: '#e8553d' },
];

export const JUNK: JunkDef[] = [
  { id: 'j_tape', name: { ru: 'Изолента', en: 'Duct Tape' }, rarity: 0, value: 4, icon: 'tape' },
  { id: 'j_glue', name: { ru: 'Клей', en: 'Glue' }, rarity: 0, value: 4, icon: 'glue' },
  { id: 'j_gears', name: { ru: 'Шестерёнки', en: 'Gears' }, rarity: 0, value: 5, icon: 'gears' },
  { id: 'j_wire', name: { ru: 'Медная проволока', en: 'Copper Wire' }, rarity: 0, value: 5, icon: 'wire' },
  { id: 'j_bulb', name: { ru: 'Лампочка', en: 'Light Bulb' }, rarity: 0, value: 3, icon: 'bulb' },
  { id: 'j_cloth', name: { ru: 'Ткань', en: 'Cloth' }, rarity: 0, value: 3, icon: 'cloth' },
  { id: 'j_steel', name: { ru: 'Сталь', en: 'Steel Scrap' }, rarity: 0, value: 4, icon: 'steel' },
  { id: 'j_spring', name: { ru: 'Пружина', en: 'Spring' }, rarity: 0, value: 3, icon: 'spring' },
  { id: 'j_clock', name: { ru: 'Будильник', en: 'Alarm Clock' }, rarity: 0, value: 6, icon: 'clock' },
  { id: 'j_teapot', name: { ru: 'Чайник', en: 'Teapot' }, rarity: 0, value: 6, icon: 'teapot' },
  { id: 'j_circuit', name: { ru: 'Микросхема', en: 'Circuit Board' }, rarity: 1, value: 20, icon: 'circuit' },
  { id: 'j_lens', name: { ru: 'Оптическая линза', en: 'Optic Lens' }, rarity: 1, value: 18, icon: 'lens' },
  { id: 'j_magnet', name: { ru: 'Магнит', en: 'Magnet' }, rarity: 1, value: 18, icon: 'magnet' },
  { id: 'j_phone', name: { ru: 'Дисковый телефон', en: 'Rotary Phone' }, rarity: 1, value: 22, icon: 'phone' },
  { id: 'j_crystal', name: { ru: 'Кварц', en: 'Quartz' }, rarity: 1, value: 24, icon: 'crystal' },
  { id: 'j_core', name: { ru: 'Ядерный сердечник', en: 'Fission Core' }, rarity: 2, value: 90, icon: 'core' },
  { id: 'j_chip', name: { ru: 'Квантовый чип', en: 'Quantum Chip' }, rarity: 2, value: 100, icon: 'chip' },
  { id: 'j_gold', name: { ru: 'Золотая нить', en: 'Gold Thread' }, rarity: 2, value: 80, icon: 'gold' },
];

export const PETS: PetDef[] = [
  { id: 'p_shepherd', name: { ru: 'Овчарка', en: 'Shepherd' }, species: 'dog', color: '#8a5a2b', color2: '#2b2016', bonus: 'dmg', value: [1, 3, 6] },
  { id: 'p_dachshund', name: { ru: 'Такса', en: 'Dachshund' }, species: 'dog', color: '#9b4f25', color2: '#6b3419', bonus: 'loot', value: [10, 25, 50] },
  { id: 'p_husky', name: { ru: 'Хаски', en: 'Husky' }, species: 'dog', color: '#d9dde2', color2: '#5b6670', bonus: 'return', value: [10, 25, 45] },
  { id: 'p_mutt', name: { ru: 'Дворняга Шарик', en: 'Sharik the Mutt' }, species: 'dog', color: '#c9a26b', color2: '#f1e2c4', bonus: 'happy', value: [5, 10, 20] },
  { id: 'p_ginger', name: { ru: 'Рыжий кот', en: 'Ginger Cat' }, species: 'cat', color: '#e8893a', color2: '#f7d9b5', bonus: 'prod', value: [5, 12, 25] },
  { id: 'p_siamese', name: { ru: 'Сиамская кошка', en: 'Siamese Cat' }, species: 'cat', color: '#efe2cc', color2: '#5b4636', bonus: 'xp', value: [10, 25, 50] },
  { id: 'p_mainecoon', name: { ru: 'Мейн-кун', en: 'Maine Coon' }, species: 'cat', color: '#6b5646', color2: '#c4ad94', bonus: 'hp', value: [1, 3, 5] },
  { id: 'p_hedgehog', name: { ru: 'Ёжик', en: 'Hedgehog' }, species: 'hedgehog', color: '#7b6450', color2: '#e8d5bb', bonus: 'train', value: [10, 20, 40] },
  { id: 'p_raccoon', name: { ru: 'Енот-воришка', en: 'Trash Panda' }, species: 'raccoon', color: '#7d8388', color2: '#2a2d30', bonus: 'nuts', value: [10, 25, 50] },
  { id: 'p_parrot', name: { ru: 'Попугай Кеша', en: 'Kesha the Parrot' }, species: 'parrot', color: '#3fbf5a', color2: '#ffcf4a', bonus: 'happy', value: [5, 12, 25] },
  { id: 'p_turtle', name: { ru: 'Черепаха Тортилла', en: 'Tortilla the Turtle' }, species: 'turtle', color: '#5f8a4a', color2: '#b59a5b', bonus: 'hp', value: [2, 4, 7] },
];

export const PET_BONUS_TEXT: Record<PetBonus, Loc> = {
  prod: { ru: '+{v}% к производству', en: '+{v}% production' },
  xp: { ru: '+{v}% к опыту', en: '+{v}% XP' },
  train: { ru: '+{v}% к скорости тренировок', en: '+{v}% training speed' },
  dmg: { ru: '+{v} к урону', en: '+{v} damage' },
  hp: { ru: '+{v} здоровья за уровень', en: '+{v} HP per level' },
  loot: { ru: '+{v}% находок в Пустоши', en: '+{v}% wasteland finds' },
  return: { ru: '−{v}% времени возвращения', en: '−{v}% return time' },
  happy: { ru: '+{v}% к настроению', en: '+{v}% happiness' },
  nuts: { ru: '+{v}% гаек в Пустоши', en: '+{v}% wasteland nuts' },
};

export const WEAPON_BY_ID: Record<string, WeaponDef> = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));
export const OUTFIT_BY_ID: Record<string, OutfitDef> = Object.fromEntries(OUTFITS.map((o) => [o.id, o]));
export const JUNK_BY_ID: Record<string, JunkDef> = Object.fromEntries(JUNK.map((j) => [j.id, j]));
export const PET_BY_ID: Record<string, PetDef> = Object.fromEntries(PETS.map((p) => [p.id, p]));

/** Default vault jumpsuit look (no outfit equipped). */
export const VAULT_SUIT: OutfitDef = {
  id: 'o_vault',
  name: { ru: 'Комбинезон «АтомУют»', en: 'AtomHome Jumpsuit' },
  bonus: b(),
  rarity: 0,
  style: 'jumpsuit',
  top: '#2b7fb8',
  bottom: '#2b7fb8',
  accent: '#ffb02e',
  hat: 'none',
};

export function weaponSellValue(w: WeaponDef) {
  return [8, 40, 150][w.rarity] + Math.round((w.dmg[0] + w.dmg[1]) * 2);
}
export function outfitSellValue(o: OutfitDef) {
  return [10, 50, 200][o.rarity] + o.bonus.reduce((a, c) => a + c, 0) * 4;
}
