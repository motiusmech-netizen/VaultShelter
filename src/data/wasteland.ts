import type { Loc } from '../i18n';

/* Templates use {name}, {enemy}, {n}, {item}, {place} and Russian gender forms {male|female}. */

export const W_START: Loc[] = [
  { ru: '{name} {вышел|вышла} за гермоворота и прищурился от солнца. Пустошь ждёт!', en: '{name} stepped out of the vault door, squinting at the sun. The wasteland awaits!' },
  { ru: '{name} {поправил|поправила} рюкзак и {зашагал|зашагала} навстречу приключениям.', en: '{name} adjusted the backpack and marched off toward adventure.' },
  { ru: '{name}: «Я только за хлебом. Вернусь через пять минут». Классика.', en: '{name}: "Just popping out for bread. Back in five." Classic.' },
  { ru: '{name} {помахал|помахала} охране и {скрылся|скрылась} в пыльной дымке.', en: '{name} waved to the guards and vanished into the dusty haze.' },
];

export const W_NUTS: Loc[] = [
  { ru: '{name} {нашёл|нашла} под камнем банку с гайками: +{n}.', en: '{name} found a jar of nuts under a rock: +{n}.' },
  { ru: '{name} {обшарил|обшарила} старый почтовый ящик. Писем нет, зато +{n} гаек.', en: '{name} searched an old mailbox. No letters, but +{n} nuts.' },
  { ru: 'В бардачке ржавого автобуса {name} {обнаружил|обнаружила} {n} гаек.', en: 'In the glovebox of a rusty bus {name} found {n} nuts.' },
  { ru: '{name} {выиграл|выиграла} {n} гаек у скелета в карты. Скелет не возражал.', en: '{name} won {n} nuts from a skeleton at cards. The skeleton didn\'t object.' },
  { ru: 'Торговый автомат выдал {name} {n} гаек сдачи. Щедрый автомат.', en: 'A vending machine gave {name} {n} nuts in change. Generous machine.' },
  { ru: '{name} {разобрал|разобрала} сломанную карусель на детали: +{n} гаек.', en: '{name} dismantled a broken carousel for parts: +{n} nuts.' },
  { ru: 'У заброшенной заправки {name} {насобирал|насобирала} {n} гаек.', en: 'At an abandoned gas station {name} collected {n} nuts.' },
  { ru: '{name} {нашёл|нашла} копилку-хрюшку. Внутри {n} гаек. Хрюшку жалко.', en: '{name} found a piggy bank with {n} nuts inside. Poor piggy.' },
];

export const W_JUNK: Loc[] = [
  { ru: '{name} {подобрал|подобрала}: {item}. В хозяйстве пригодится.', en: '{name} picked up: {item}. Could come in handy.' },
  { ru: 'Среди мусора {name} {разглядел|разглядела} {item}.', en: 'Among the trash {name} spotted: {item}.' },
  { ru: '{name} {выменял|выменяла} у бродячего торговца {item}.', en: '{name} traded a wandering merchant for: {item}.' },
  { ru: 'В разрушенной мастерской нашлось кое-что полезное: {item}.', en: 'A ruined workshop yielded something useful: {item}.' },
];

export const W_GEAR: Loc[] = [
  { ru: '{name} {нашёл|нашла} в сейфе: {item}!', en: '{name} found in a safe: {item}!' },
  { ru: 'На манекене в разбитой витрине висело: {item}. Теперь это наше.', en: 'A mannequin in a broken shop window wore: {item}. It\'s ours now.' },
  { ru: '{name} {откопал|откопала} ящик. Внутри — {item}.', en: '{name} dug up a crate. Inside: {item}.' },
  { ru: 'Под сиденьем брошенного броневика: {item}.', en: 'Under the seat of an abandoned armored car: {item}.' },
  { ru: '{name} {победил|победила} в конкурсе, где {был|была} единственным участником. Приз: {item}.', en: '{name} won a contest with a single contestant — themselves. Prize: {item}.' },
];

export const W_ENEMIES: Loc[] = [
  { ru: 'мутокрыс', en: 'a mutant rat' },
  { ru: 'стая диких псов', en: 'a pack of wild dogs' },
  { ru: 'сбрендивший робот-почтальон', en: 'a deranged mailbot' },
  { ru: 'гигантский слепень', en: 'a giant horsefly' },
  { ru: 'банда мародёров', en: 'a gang of raiders' },
  { ru: 'радиоактивный богомол', en: 'a radioactive mantis' },
  { ru: 'двухголовый козёл', en: 'a two-headed goat' },
  { ru: 'кабан-мутант', en: 'a mutant boar' },
  { ru: 'одичавший робот-газонокосильщик', en: 'a feral lawnmower robot' },
  { ru: 'шипоспин', en: 'a spikeback' },
  { ru: 'светящийся таракан размером с чемодан', en: 'a glowing suitcase-sized cockroach' },
  { ru: 'злой гусь', en: 'an angry goose' },
];

export const W_FIGHT_WIN: Loc[] = [
  { ru: 'На {name} {напал|напала} {enemy}. {name} {победил|победила}, потеряв {n} здоровья.', en: '{name} was attacked by {enemy}. {name} won, losing {n} HP.' },
  { ru: '{name} {встретил|встретила}: {enemy}. Короткая схватка, −{n} здоровья, но победа!', en: '{name} ran into {enemy}. A short fight, −{n} HP, but victory!' },
  { ru: 'Противник ({enemy}) недооценил жителя убежища. Зря. {name}: −{n} здоровья.', en: '{enemy} underestimated a vault dweller. Big mistake. {name}: −{n} HP.' },
  { ru: '{name} {отбился|отбилась} от напасти («{enemy}»). Синяки: −{n} здоровья.', en: '{name} fought off {enemy}. Bruises: −{n} HP.' },
];

export const W_FIGHT_EASY: Loc[] = [
  { ru: 'Противник ({enemy}) увидел {name} и в ужасе сбежал. Опыт!', en: '{enemy} saw {name} and fled in terror. XP!' },
  { ru: '{name} {победил|победила} противника («{enemy}») без единой царапины.', en: '{name} defeated {enemy} without a scratch.' },
];

export const W_RAD: Loc[] = [
  { ru: '{name} {напился|напилась} из светящейся лужи. Зря. +{n} радиации.', en: '{name} drank from a glowing puddle. Bad idea. +{n} rads.' },
  { ru: 'Радиоактивная пыльная буря! {name}: +{n} радиации.', en: 'Radioactive dust storm! {name}: +{n} rads.' },
  { ru: '{name} {срезал|срезала} путь через кратер. +{n} радиации.', en: '{name} took a shortcut through a crater. +{n} rads.' },
  { ru: '{name} {съел|съела} подозрительно блестящее яблоко. +{n} радиации.', en: '{name} ate a suspiciously shiny apple. +{n} rads.' },
  { ru: 'Счётчик Гейгера {name} запел песню. +{n} радиации.', en: '{name}\'s Geiger counter started singing. +{n} rads.' },
];

export const W_HEAL: Loc[] = [
  { ru: '{name} {использовал|использовала} аптечку. Как новенький!', en: '{name} used a medkit. Good as new!' },
  { ru: '{name} {принял|приняла} антирадин. Свечение уменьшилось.', en: '{name} took Anti-Rad. The glow faded.' },
];

export const W_FUN: Loc[] = [
  { ru: '{name} {поспорил|поспорила} с кактусом. Кактус победил.', en: '{name} argued with a cactus. The cactus won.' },
  { ru: '{name} {нашёл|нашла} табличку «Осторожно, радиация». Табличка светилась.', en: '{name} found a "Caution: Radiation" sign. The sign was glowing.' },
  { ru: '{name} полчаса {ждал|ждала} автобус на заброшенной остановке. По привычке.', en: '{name} waited half an hour at an abandoned bus stop. Out of habit.' },
  { ru: '{name} {сочинил|сочинила} песню о Пустоши. Три куплета про пыль.', en: '{name} wrote a song about the wasteland. Three verses about dust.' },
  { ru: '{name} {пытался|пыталась} погладить двухголового пса. Обе головы были против.', en: '{name} tried to pet a two-headed dog. Both heads objected.' },
  { ru: '{name} {увидел|увидела} закат. Красиво, хоть и немного радиоактивно.', en: '{name} watched the sunset. Beautiful, if slightly radioactive.' },
  { ru: '{name} {нашёл|нашла} старый телевизор и час {смотрел|смотрела} в пустой экран. Лучше, чем новости.', en: '{name} found an old TV and stared at the blank screen for an hour. Better than the news.' },
  { ru: 'Торговец предложил {name} купить воздух. «Свежий, довоенный!» {name} {отказался|отказалась}.', en: 'A merchant offered {name} a jar of "fresh pre-war air". {name} declined.' },
  { ru: '{name} {встретил|встретила} философа в бочке. Он попросил отойти от солнца.', en: '{name} met a philosopher living in a barrel. He asked them to stop blocking the sun.' },
  { ru: '{name} {заблудился|заблудилась}, но {сделал|сделала} вид, что так и задумано.', en: '{name} got lost but pretended it was all part of the plan.' },
  { ru: '{name} {нашёл|нашла} открытку «С Новым годом!». Датирована двести лет назад.', en: '{name} found a "Happy New Year!" card, dated two hundred years ago.' },
  { ru: '{name} {научил|научила} ворону говорить «Смотритель». Ворона научила {name} каркать.', en: '{name} taught a crow to say "Overseer". The crow taught {name} to caw.' },
  { ru: '{name} {построил|построила} снеговика из песка. Он растаял. Как?', en: '{name} built a snowman out of sand. It melted. How?' },
  { ru: 'Робот-экскурсовод провёл для {name} экскурсию по руинам. Оценка: пять звёзд.', en: 'A tour-guide robot gave {name} a tour of the ruins. Rating: five stars.' },
  { ru: '{name} {нашёл|нашла} куклу-неваляшку. Она покачала головой. Осуждающе.', en: '{name} found a roly-poly doll. It shook its head. Judgmentally.' },
  { ru: '{name} {решил|решила} искупаться в озере. Озеро решило иначе.', en: '{name} decided to swim in a lake. The lake decided otherwise.' },
  { ru: '{name} {обнаружил|обнаружила} бункер другой компании. Дверь с надписью «Не АтомУют». Прошёл мимо с гордостью.', en: '{name} found a rival company\'s bunker, labeled "Not AtomHome". Walked past proudly.' },
  { ru: '{name} {сыграл|сыграла} в шахматы с роботом. Ничья: оба уснули.', en: '{name} played chess with a robot. A draw: both fell asleep.' },
  { ru: '{name} {увидел|увидела} мираж: холодный квас. Мираж был тёплый.', en: '{name} saw a mirage of cold lemonade. The mirage was warm.' },
  { ru: '{name} {подружился|подружилась} с перекати-полем и назвал его Гоша. Гоша укатился.', en: '{name} befriended a tumbleweed named Gary. Gary rolled away.' },
  { ru: 'Старый громкоговоритель объявил {name}: «Сохраняйте спокойствие». {name} сохраняет.', en: 'An old loudspeaker told {name}: "Remain calm." {name} remains calm.' },
  { ru: '{name} {нашёл|нашла} книгу «Как выжить в Пустоши». Последняя страница вырвана.', en: '{name} found a book "How to Survive the Wasteland". The last page is torn out.' },
  { ru: '{name} {нарисовал|нарисовала} смайлик на стене. Стена улыбнулась в ответ. Наверное, показалось.', en: '{name} drew a smiley on a wall. The wall smiled back. Probably imagined it.' },
  { ru: '{name} {встретил|встретила} другого путника. Они молча кивнули друг другу. Мужское уважение. Или женское.', en: '{name} met another traveler. They nodded silently. Wasteland respect.' },
];

export const W_PLACES: Loc[] = [
  { ru: 'заброшенный гастроном «Продукты №1»', en: 'the abandoned "Grocery No. 1"' },
  { ru: 'руины кинотеатра «Космос»', en: 'the ruins of the "Cosmos" cinema' },
  { ru: 'брошенную военную базу', en: 'an abandoned military base' },
  { ru: 'старый парк аттракционов', en: 'an old amusement park' },
  { ru: 'затопленную станцию метро', en: 'a flooded subway station' },
  { ru: 'обсерваторию на холме', en: 'a hilltop observatory' },
  { ru: 'разрушенный завод газировки', en: 'a ruined soda factory' },
  { ru: 'библиотеку, где всё ещё тихо', en: 'a library where it\'s still quiet' },
  { ru: 'городок роботов-официантов', en: 'a town of waiter robots' },
  { ru: 'маяк посреди пустыни', en: 'a lighthouse in the middle of the desert' },
  { ru: 'старую телебашню', en: 'an old TV tower' },
  { ru: 'заброшенное убежище конкурентов', en: 'an abandoned rival vault' },
];

export const W_PLACE: Loc[] = [
  { ru: '{name} {обнаружил|обнаружила} {place}! Обыск принёс {n} гаек и кое-что ещё.', en: '{name} discovered {place}! A search yielded {n} nuts and more.' },
  { ru: 'Удача! {name} {наткнулся|наткнулась} на {place}. Добыча: {n} гаек и трофей.', en: 'Lucky! {name} stumbled upon {place}. Loot: {n} nuts and a trophy.' },
];

export const W_PET: Loc[] = [
  { ru: 'За {name} увязался бездомный зверь. Кажется, это любовь! Питомец: {item}.', en: 'A stray followed {name} home. Looks like love! Pet: {item}.' },
];

export const W_KO: Loc[] = [
  { ru: '{name} {потерял|потеряла} сознание. Нужна помощь смотрителя!', en: '{name} passed out. The Overseer\'s help is needed!' },
];

export const W_RETURN: Loc[] = [
  { ru: '{name} {развернулся|развернулась} и {направился|направилась} домой. Скучаю по макаронам.', en: '{name} turned around and headed home. Missing the pasta.' },
  { ru: '{name} получает сигнал смотрителя и идёт обратно.', en: '{name} got the Overseer\'s signal and is heading back.' },
];

export const W_HOME: Loc[] = [
  { ru: '{name} {вернулся|вернулась} в убежище!', en: '{name} is back in the vault!' },
];

/** Chatter bubbles for dwellers inside the vault. */
export const CHATTER: Loc[] = [
  { ru: 'Кто-нибудь видел мою ложку?', en: 'Has anyone seen my spoon?' },
  { ru: 'Опять макароны?..', en: 'Pasta again?..' },
  { ru: 'Скучаю по солнцу. Наверное.', en: 'I miss the sun. Probably.' },
  { ru: 'Этот генератор на меня смотрит.', en: 'That generator is staring at me.' },
  { ru: 'Уют на тысячу лет!', en: 'Coziness for a thousand years!' },
  { ru: 'Смотритель сегодня в ударе!', en: 'The Overseer is on fire today!' },
  { ru: 'Хочу в Пустошь. Нет, не хочу.', en: 'I want to go outside. No, I don\'t.' },
  { ru: 'Лифт опять скрипит.', en: 'The elevator is squeaking again.' },
  { ru: 'Кот Шрёдингера — он есть?', en: 'Schrödinger\'s cat — is it real?' },
  { ru: 'Отличный день под землёй!', en: 'Great day underground!' },
  { ru: 'Кузя опять пылесосил ночью.', en: 'Kuzya was vacuuming at night again.' },
  { ru: 'Мне бы отпуск... наверх.', en: 'I need a vacation... upstairs.' },
  { ru: 'Держим курс на процветание!', en: 'Steering toward prosperity!' },
  { ru: 'А кто выключил свет?', en: 'Who turned off the lights?' },
  { ru: 'Хорошо сидим!', en: 'This is nice!' },
  { ru: 'Слышали новый хит на радио?', en: 'Heard the new hit on the radio?' },
];

export const CHATTER_HUNGRY: Loc[] = [
  { ru: 'Есть хочется...', en: "I'm so hungry..." },
  { ru: 'Живот урчит громче генератора.', en: 'My stomach is louder than the generator.' },
];
export const CHATTER_THIRSTY: Loc[] = [
  { ru: 'Пить... хоть из лужи...', en: 'Water... even a puddle...' },
  { ru: 'Почему вода светится?', en: 'Why is the water glowing?' },
];
export const CHATTER_DARK: Loc[] = [
  { ru: 'Темно, как в шахте!', en: "It's dark as a mine!" },
  { ru: 'Дайте свет!', en: 'Lights, please!' },
];
export const CHATTER_LOVE: Loc[] = [
  { ru: 'Какие у тебя глаза...', en: 'Your eyes are lovely...' },
  { ru: 'Потанцуем?', en: 'Shall we dance?' },
  { ru: 'Ты сегодня прекрасна!', en: 'You look wonderful today!' },
  { ru: 'Ты такой смешной!', en: "You're so funny!" },
  { ru: 'Расскажи ещё про генераторы!', en: 'Tell me more about generators!' },
];
