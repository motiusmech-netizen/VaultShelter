import type { Loc } from '../i18n';

export const RU_MALE = [
  'Иван', 'Пётр', 'Алексей', 'Николай', 'Дмитрий', 'Сергей', 'Андрей', 'Михаил', 'Павел', 'Егор',
  'Василий', 'Фёдор', 'Григорий', 'Артём', 'Тимофей', 'Степан', 'Лев', 'Матвей', 'Кирилл', 'Роман',
  'Олег', 'Борис', 'Глеб', 'Семён', 'Аркадий', 'Геннадий', 'Виктор', 'Юрий', 'Ярослав', 'Всеволод',
  'Никита', 'Данила', 'Захар', 'Максим', 'Константин', 'Эдуард', 'Анатолий', 'Валерий', 'Прохор', 'Савелий',
];
export const RU_FEMALE = [
  'Анна', 'Мария', 'Екатерина', 'Ольга', 'Наталья', 'Елена', 'Ирина', 'Светлана', 'Татьяна', 'Вера',
  'Надежда', 'Любовь', 'Дарья', 'Алиса', 'Полина', 'Ксения', 'Варвара', 'Софья', 'Валентина', 'Зоя',
  'Галина', 'Людмила', 'Марина', 'Юлия', 'Алёна', 'Василиса', 'Ульяна', 'Милана', 'Кира', 'Нина',
  'Лидия', 'Тамара', 'Вероника', 'Евгения', 'Арина', 'Злата', 'Серафима', 'Таисия', 'Стефания', 'Раиса',
];
/** [male, female] */
export const RU_LAST: [string, string][] = [
  ['Иванов', 'Иванова'], ['Смирнов', 'Смирнова'], ['Кузнецов', 'Кузнецова'], ['Попов', 'Попова'], ['Соколов', 'Соколова'],
  ['Лебедев', 'Лебедева'], ['Козлов', 'Козлова'], ['Новиков', 'Новикова'], ['Морозов', 'Морозова'], ['Волков', 'Волкова'],
  ['Соловьёв', 'Соловьёва'], ['Васильев', 'Васильева'], ['Зайцев', 'Зайцева'], ['Павлов', 'Павлова'], ['Семёнов', 'Семёнова'],
  ['Голубев', 'Голубева'], ['Виноградов', 'Виноградова'], ['Богданов', 'Богданова'], ['Воробьёв', 'Воробьёва'], ['Фёдоров', 'Фёдорова'],
  ['Медведев', 'Медведева'], ['Ершов', 'Ершова'], ['Никитин', 'Никитина'], ['Сорокин', 'Сорокина'], ['Гусев', 'Гусева'],
  ['Ковалёв', 'Ковалёва'], ['Ильин', 'Ильина'], ['Гаврилов', 'Гаврилова'], ['Белов', 'Белова'], ['Комаров', 'Комарова'],
  ['Орлов', 'Орлова'], ['Киселёв', 'Киселёва'], ['Макаров', 'Макарова'], ['Андреев', 'Андреева'], ['Ковалевский', 'Ковалевская'],
  ['Жуков', 'Жукова'], ['Тихонов', 'Тихонова'], ['Калинин', 'Калинина'], ['Пирожков', 'Пирожкова'], ['Гвоздев', 'Гвоздева'],
  ['Шестерёнкин', 'Шестерёнкина'], ['Болтов', 'Болтова'], ['Ламповый', 'Ламповая'], ['Подземный', 'Подземная'], ['Тушёнкин', 'Тушёнкина'],
];

export const EN_MALE = [
  'John', 'Peter', 'Alex', 'Nick', 'Dmitri', 'Sam', 'Andrew', 'Mike', 'Paul', 'George',
  'Frank', 'Henry', 'Arthur', 'Tim', 'Steve', 'Leo', 'Matt', 'Chris', 'Roman', 'Oliver',
  'Ben', 'Gleb', 'Walter', 'Victor', 'Eddie', 'Tony', 'Hank', 'Jack', 'Max', 'Owen',
  'Carl', 'Dean', 'Earl', 'Felix', 'Gus', 'Harvey', 'Ike', 'Jim', 'Ken', 'Lou',
];
export const EN_FEMALE = [
  'Anna', 'Mary', 'Kate', 'Olga', 'Natalie', 'Helen', 'Irene', 'Lana', 'Tanya', 'Vera',
  'Nadia', 'Lucy', 'Daria', 'Alice', 'Polly', 'Sophie', 'Barbara', 'Zoe', 'Grace', 'Ruby',
  'Mila', 'Marina', 'Julia', 'Ella', 'Rose', 'Kira', 'Nina', 'Lydia', 'Tammy', 'Violet',
  'Betty', 'Clara', 'Dolly', 'Edna', 'Fay', 'Gloria', 'Hazel', 'Iris', 'June', 'Maggie',
];
export const EN_LAST = [
  'Smith', 'Cooper', 'Baker', 'Miller', 'Walker', 'Hughes', 'Carter', 'Fisher', 'Turner', 'Parker',
  'Brooks', 'Porter', 'Hayes', 'Palmer', 'Webb', 'Bolton', 'Gearson', 'Wrench', 'Bunker', 'Deepwell',
  'Stone', 'Cole', 'Nutley', 'Rivet', 'Lampwick', 'Burrows', 'Dugan', 'Hollow', 'Pipers', 'Sparks',
];

export interface LegendDef {
  id: string;
  first: Loc;
  last: Loc;
  gender: 'm' | 'f';
  stats: number[];
  outfit: string;
  weapon?: string;
  look: { skin: number; hair: number; hairColor: number; beard: number; glasses: boolean };
  bio: Loc;
}

export const LEGENDS: LegendDef[] = [
  {
    id: 'l_gaykin', first: { ru: 'Профессор', en: 'Professor' }, last: { ru: 'Гайкин', en: 'Nutsby' }, gender: 'm',
    stats: [3, 7, 5, 4, 10, 4, 6], outfit: 'o_professor', look: { skin: 1, hair: 8, hairColor: 6, beard: 3, glasses: true },
    bio: { ru: 'Изобрёл вечный двигатель. Дважды. Оба раза потерял чертежи.', en: 'Invented a perpetual motion machine. Twice. Lost the blueprints both times.' },
  },
  {
    id: 'l_zina', first: { ru: 'Бабушка', en: 'Granny' }, last: { ru: 'Зина', en: 'Zina' }, gender: 'f',
    stats: [5, 6, 10, 9, 5, 4, 8], outfit: 'o_granny', weapon: 'w_rollpin', look: { skin: 0, hair: 9, hairColor: 6, beard: 0, glasses: true },
    bio: { ru: 'Варит лучший борщ в Пустоши. Скалкой владеет лучше, чем вы — чем угодно.', en: 'Cooks the best borscht in the wasteland. Wields a rolling pin better than you wield anything.' },
  },
  {
    id: 'l_shtopor', first: { ru: 'Полковник', en: 'Colonel' }, last: { ru: 'Штопор', en: 'Corkscrew' }, gender: 'm',
    stats: [10, 8, 9, 5, 4, 6, 4], outfit: 'o_military', weapon: 'w_hunting', look: { skin: 2, hair: 1, hairColor: 5, beard: 2, glasses: false },
    bio: { ru: 'Прошёл три войны и одну очередь в поликлинику.', en: 'Survived three wars and one hospital queue.' },
  },
  {
    id: 'l_vasya', first: { ru: 'Кибер-', en: 'Cyber' }, last: { ru: 'Вася', en: 'Vasya' }, gender: 'm',
    stats: [4, 8, 5, 5, 9, 9, 7], outfit: 'o_engineer', weapon: 'w_laserp', look: { skin: 1, hair: 3, hairColor: 7, beard: 0, glasses: false },
    bio: { ru: 'Говорит, что наполовину робот. Роботы это отрицают.', en: 'Claims to be half robot. The robots deny it.' },
  },
  {
    id: 'l_diesel', first: { ru: 'Капитан', en: 'Captain' }, last: { ru: 'Дизель', en: 'Diesel' }, gender: 'm',
    stats: [9, 6, 10, 6, 5, 5, 5], outfit: 'o_mechanic', weapon: 'w_wrench', look: { skin: 3, hair: 0, hairColor: 0, beard: 1, glasses: false },
    bio: { ru: 'Может починить что угодно. Кроме своего характера.', en: 'Can fix anything. Except his temper.' },
  },
  {
    id: 'l_roza', first: { ru: 'Тётя', en: 'Aunt' }, last: { ru: 'Роза', en: 'Rosa' }, gender: 'f',
    stats: [4, 6, 6, 10, 6, 5, 9], outfit: 'o_evening', look: { skin: 2, hair: 5, hairColor: 3, beard: 0, glasses: false },
    bio: { ru: 'Её улыбка поднимает настроение всему этажу.', en: 'Her smile lifts the mood of a whole floor.' },
  },
  {
    id: 'l_liza', first: { ru: 'Лиза', en: 'Liza' }, last: { ru: 'Молния', en: 'Lightning' }, gender: 'f',
    stats: [5, 9, 6, 6, 5, 10, 7], outfit: 'o_athlete', weapon: 'w_crossbow', look: { skin: 0, hair: 6, hairColor: 4, beard: 0, glasses: false },
    bio: { ru: 'Пробежала Пустошь за выходные. Туда и обратно.', en: 'Ran across the wasteland over a weekend. And back.' },
  },
  {
    id: 'l_doc', first: { ru: 'Док', en: 'Doc' }, last: { ru: 'Пилюлькин', en: 'Pillsbury' }, gender: 'm',
    stats: [3, 7, 7, 6, 10, 5, 6], outfit: 'o_medic', look: { skin: 4, hair: 2, hairColor: 1, beard: 4, glasses: true },
    bio: { ru: 'Лечит всё, кроме привычки опаздывать.', en: 'Cures everything except being late.' },
  },
  {
    id: 'l_aurora', first: { ru: 'Сестра', en: 'Sister' }, last: { ru: 'Аврора', en: 'Aurora' }, gender: 'f',
    stats: [6, 8, 7, 8, 8, 6, 6], outfit: 'o_cosmo', weapon: 'w_plasma', look: { skin: 3, hair: 4, hairColor: 2, beard: 0, glasses: false },
    bio: { ru: 'Утверждает, что прилетела с орбиты. Скафандр подтверждает.', en: 'Claims she came from orbit. The spacesuit agrees.' },
  },
];
