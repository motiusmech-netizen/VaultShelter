import type { Loc } from '../i18n';
import type { RoomType } from './rooms';

export type DawnReq =
  | { kind: 'pop'; n: number }
  | { kind: 'room'; room: RoomType; level: number }
  | { kind: 'counter'; key: string; n: number; label: Loc }
  | { kind: 'donate'; res: 'nuts' | 'power' | 'food' | 'water'; n: number }
  | { kind: 'charge'; n: number };

export interface DawnStage {
  name: Loc;
  desc: Loc;
  reqs: DawnReq[];
  reward: { nuts: number; iso: number; crate: number };
}

export const DAWN_STAGES: DawnStage[] = [
  {
    name: { ru: 'Разведка поверхности', en: 'Surface Survey' },
    desc: {
      ru: 'Разведчики должны нанести на карту окрестности, а инженеры — собрать метеостанцию. Пыльные бури утихнут.',
      en: 'Scouts must map the surroundings and engineers must build a weather station. The dust storms will calm down.',
    },
    reqs: [
      { kind: 'pop', n: 20 },
      { kind: 'counter', key: 'explore_min', n: 30, label: { ru: 'Минут в Пустоши', en: 'Minutes in the wasteland' } },
      { kind: 'donate', res: 'nuts', n: 1500 },
    ],
    reward: { nuts: 500, iso: 5, crate: 1 },
  },
  {
    name: { ru: 'Очистка воды', en: 'Water Cleanup' },
    desc: {
      ru: 'Фильтры убежища начнут очищать грунтовые воды. Небо станет чище, у ворот появится первый пруд.',
      en: 'The vault filters will start cleaning groundwater. The sky will clear and the first pond will appear by the door.',
    },
    reqs: [
      { kind: 'pop', n: 35 },
      { kind: 'room', room: 'water', level: 3 },
      { kind: 'donate', res: 'water', n: 600 },
      { kind: 'donate', res: 'nuts', n: 3000 },
    ],
    reward: { nuts: 1000, iso: 8, crate: 1 },
  },
  {
    name: { ru: 'Семенной банк', en: 'Seed Bank' },
    desc: {
      ru: 'Высадим первые семена на поверхности. Появится трава и кусты.',
      en: 'We will plant the first seeds on the surface. Grass and bushes will appear.',
    },
    reqs: [
      { kind: 'pop', n: 50 },
      { kind: 'room', room: 'diner', level: 3 },
      { kind: 'counter', key: 'babies', n: 5, label: { ru: 'Родилось малышей', en: 'Babies born' } },
      { kind: 'donate', res: 'food', n: 900 },
      { kind: 'donate', res: 'nuts', n: 6000 },
    ],
    reward: { nuts: 2000, iso: 10, crate: 2 },
  },
  {
    name: { ru: 'Реактор возрождения', en: 'Revival Reactor' },
    desc: {
      ru: 'Построим Центр «Рассвет» и накопим энергию. На поверхности вырастут деревья и вернутся птицы.',
      en: 'Build the Dawn Center and store energy. Trees will grow on the surface and the birds will return.',
    },
    reqs: [
      { kind: 'pop', n: 60 },
      { kind: 'room', room: 'dawn', level: 1 },
      { kind: 'room', room: 'power', level: 3 },
      { kind: 'donate', res: 'power', n: 1200 },
      { kind: 'donate', res: 'nuts', n: 10000 },
    ],
    reward: { nuts: 3000, iso: 15, crate: 2 },
  },
  {
    name: { ru: 'Запуск «Рассвета»', en: 'Launch Dawn' },
    desc: {
      ru: 'Финальный этап. Зарядите Центр «Рассвет» и запустите терраформер. Мир снова станет зелёным!',
      en: 'The final stage. Charge the Dawn Center and launch the terraformer. The world will be green again!',
    },
    reqs: [
      { kind: 'pop', n: 75 },
      { kind: 'charge', n: 120 },
      { kind: 'donate', res: 'nuts', n: 15000 },
    ],
    reward: { nuts: 10000, iso: 50, crate: 5 },
  },
];
