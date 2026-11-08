export const genreLabels: Record<string, string> = {
  electronic: "Электроника",
  indie: "Инди",
  pop: "Поп",
  acoustic: "Акустика",
  children: "Детская музыка",
};

// ID жанров используются алгоритмом, подписи — интерфейсом.
export type DemoTrack = {
  id: number;
  artistId: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  lyrics: string;
  color: string;
  genres: string[];
  audioSrc?: string;
};

const baseTracks: DemoTrack[] = [
  { id: 1, artistId: "demo-artist", title: "Тихий вечер", artist: "Тестовый исполнитель", album: "Домой", duration: "3:15", lyrics: "За окном засыпает город.\nМы оставим свет на кухне.\nЭтот вечер нам так дорог.", color: "bg-[#e0e7df] text-[#8b9f8c]", genres: ["indie", "acoustic"] },
  { id: 2, artistId: "northern-lights", title: "За горизонт", artist: "Северный свет", album: "Первый свет", duration: "3:42", lyrics: "Там, где небо встречает море,\nНас ведёт за собою рассвет.\nМы забудем о каждом споре.", color: "bg-[#e1e8ed] text-[#8fa4b4]", genres: ["electronic", "indie"] },
  { id: 3, artistId: "lines", title: "Тёплый воздух", artist: "Линии", album: "Без спешки", duration: "2:58", lyrics: "Солнце прячется в ладонях.\nПо знакомым улицам идём.\nЛето тихо нас догонит.", color: "bg-[#eee6dc] text-[#b5a28d]", genres: ["indie", "pop"] },
  { id: 4, artistId: "semitone", title: "Между нами", artist: "Полутон", album: "Отражения", duration: "4:06", lyrics: "На стекле рисую звёзды.\nНаши письма сохранит дождь.\nГоворить ещё не поздно.", color: "bg-[#e8e3ed] text-[#a296b0]", genres: ["pop"] },
  { id: 13, artistId: "pulse-city", title: "Ночной импульс", artist: "Пульс города", album: "После полуночи", duration: "3:32", lyrics: "Неоновые линии ведут меня домой.\nГород дышит в ритме, оставайся здесь со мной.", color: "bg-[#e4dff1] text-[#9b89bf]", genres: ["electronic"] },
  { id: 16, artistId: "quiet-shore", title: "Утро у реки", artist: "Тихий берег", album: "Ближе к лету", duration: "2:51", lyrics: "Утро у реки встречает первый свет.\nСлышно только струны, суеты здесь нет.", color: "bg-[#e4e9dd] text-[#91a17f]", genres: ["acoustic"] },
  { id: 19, artistId: "little-orbit", title: "Облако-котёнок", artist: "Маленькая орбита", album: "Добрые истории", duration: "2:12", lyrics: "Облако-котёнок прыгает во сне.\nСолнышко смеётся, улыбнись и мне.\nВместе мы построим замок на луне.", color: "bg-[#f2e8d8] text-[#c3a36d]", genres: ["children"] },
];

// Локальные демонстрационные исполнители; статистика и биографии вымышлены.
export const artists = [
  {
    id: "demo-artist", name: "Тестовый исполнитель", listeners: 12480,
    color: "bg-[#e0e7df] text-[#8b9f8c]", genre: "Инди-поп", year: "2026",
    bio: "Неспешные мелодии о простых вещах: дороге домой, знакомых улицах и тихих вечерах. Мягкий вокал и акустические инструменты создают тёплое, камерное звучание.",
    playlists: ["Тихие вечера", "Акустика для тебя"],
    extraTracks: [{ id: 5, lyrics: "В окнах напротив погасли огни.\nТихо проходят последние дни.", title: "Окна напротив", duration: "3:28" }, { id: 6, lyrics: "Дорога домой начинается здесь.\nВ знакомом окне ещё светится весть.", title: "Дорога домой", duration: "2:54" }],
    similarIds: ["lines", "semitone"],
  },
  {
    id: "northern-lights", name: "Северный свет", listeners: 85420,
    color: "bg-[#e1e8ed] text-[#8fa4b4]", genre: "Инди-электроника", year: "2026",
    bio: "Атмосферная электроника с живыми гитарами и мечтательным вокалом. Песни о путешествиях, северном небе и поиске своего пути звучат как саундтрек к долгой дороге.",
    playlists: ["В дороге", "Новые горизонты"],
    extraTracks: [{ id: 7, lyrics: "Над нами сияние медленно тает.\nПолярная ночь наши сны охраняет.", title: "Полярная ночь", duration: "4:12" }, { id: 8, lyrics: "На дальнем причале дежурит маяк.\nЕго огонёк нам укажет сквозь мрак.", title: "Маяк", duration: "3:36" }],
    similarIds: ["semitone", "lines"],
  },
  {
    id: "lines", name: "Линии", listeners: 36200,
    color: "bg-[#eee6dc] text-[#b5a28d]", genre: "Инди-поп", year: "2025",
    bio: "Лёгкие гитарные ритмы, тёплые синтезаторы и истории о городе. Музыка для прогулок без спешки и встреч, которые хочется запомнить.",
    playlists: ["Для хорошего настроения", "Городские прогулки"],
    extraTracks: [{ id: 9, lyrics: "На остановке встречаем трамвай.\nЭтот короткий момент сохраняй.", title: "На остановке", duration: "3:09" }, { id: 10, lyrics: "Солнечный луч на пустой мостовой.\nСнова идём по проспекту с тобой.", title: "Солнечная сторона", duration: "2:47" }],
    similarIds: ["demo-artist", "northern-lights"],
  },
  {
    id: "semitone", name: "Полутон", listeners: 21950,
    color: "bg-[#e8e3ed] text-[#a296b0]", genre: "Альтернативный поп", year: "2026",
    bio: "Минималистичные аранжировки и выразительные мелодии. В центре каждой песни — небольшая личная история, рассказанная через голос, клавиши и электронные текстуры.",
    playlists: ["Вечерние отражения", "Для учёбы"],
    extraTracks: [{ id: 11, lyrics: "Капли на стёклах рисуют пути.\nНам остаётся друг друга найти.", title: "На стекле", duration: "3:41" }, { id: 12, lyrics: "Старые письма лежат на столе.\nГолос знакомый звучит в тишине.", title: "Письма", duration: "3:18" }],
    similarIds: ["northern-lights", "demo-artist"],
  },
  {
    id: "pulse-city", name: "Пульс города", listeners: 18760,
    color: "bg-[#e4dff1] text-[#9b89bf]", genre: "Электроника", year: "2026",
    bio: "Электронные ритмы, мягкий бас и сияние ночного города. Музыка о движении и моментах, когда улицы становятся тише, а мелодии — ярче.",
    playlists: ["Ночной маршрут", "Электронные открытия"],
    extraTracks: [{ id: 14, lyrics: "По проспекту тянется электрический свет.\nКаждый новый поворот оставляет след.", title: "Электрический свет", duration: "3:48" }, { id: 15, lyrics: "На частоте рассвета мы поймаем новый день.\nВ переулках растворится уходящая тень.", title: "Частота рассвета", duration: "4:03" }],
    similarIds: ["northern-lights", "semitone"],
  },
  {
    id: "quiet-shore", name: "Тихий берег", listeners: 9200,
    color: "bg-[#e4e9dd] text-[#91a17f]", genre: "Акустика", year: "2026",
    bio: "Акустическая гитара, живой голос и короткие истории о природе. Простые мелодии для спокойного утра и дороги за город.",
    playlists: ["Утро без спешки", "Тёплая акустика"],
    extraTracks: [{ id: 17, lyrics: "В траве дрожит роса, на струнах новый день.\nОт старого моста ложится в воду тень.", title: "Роса", duration: "3:07" }, { id: 18, lyrics: "За околицей поля, над дорогою закат.\nЯ сыграю для тебя то, о чём не говорят.", title: "За околицей", duration: "3:24" }],
    similarIds: ["demo-artist", "lines"],
  },
  {
    id: "little-orbit", name: "Маленькая орбита", listeners: 14300,
    color: "bg-[#f2e8d8] text-[#c3a36d]", genre: "Детская музыка", year: "2026",
    bio: "Добрые вымышленные истории о дружбе, космосе и маленьких открытиях. Демонстрационные песни, которые удобно включить в гостевом режиме для ребёнка.",
    playlists: ["Добрые истории", "Пора мечтать"],
    extraTracks: [{ id: 20, lyrics: "Паровозик из подушек отправляется в полёт.\nНа далёкую планету он друзей своих везёт.", title: "Паровозик к звёздам", duration: "2:31" }, { id: 21, lyrics: "Спи, мой маленький маяк, звёзды светят просто так.\nМесяц лодочку качает, добрых снов тебе желает.", title: "Маленький маяк", duration: "2:44" }],
    similarIds: [],
  },
];

// Все отображаемые треки имеют постоянный ID и доступны по /track/[id].
export const tracks: DemoTrack[] = [
  ...baseTracks,
  ...artists.flatMap((artist) => {
    const albumTrack = baseTracks.find((track) => track.artistId === artist.id)!;
    return artist.extraTracks.map((track) => ({
      ...albumTrack,
      ...track,
      audioSrc: undefined,
    }));
  }),
].sort((a, b) => a.id - b.id);

export type DemoArtist = (typeof artists)[number];
// Например: audioSrc: "/audio/quiet-evening.mp3" для public/audio/quiet-evening.mp3.
