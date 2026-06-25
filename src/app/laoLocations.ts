/*
 * Lao PDR administrative locations — Province → District → Village.
 * DEMO dataset: a representative subset of districts/villages per province so the
 * cascading selects work. Replace with the authoritative MoHA/MoPS gazetteer for
 * production.
 */

export const LAO_LOCATIONS: Record<string, Record<string, string[]>> = {
  "Vientiane Capital": {
    Chanthabouly: ["Ban Phonxay", "Ban Sisavath", "Ban Hatsady", "Ban Anou"],
    Sikhottabong: ["Ban Sithanneua", "Ban Phosy", "Ban Dongpalep"],
    Xaysetha: ["Ban Phonthan", "Ban Nongniang", "Ban Saphanthong"],
    Sisattanak: ["Ban Thapalanxay", "Ban Chommany", "Ban Phaxay"],
    Naxaithong: ["Ban Nonsavang", "Ban Dongmakkhai"],
    Hadxaifong: ["Ban Salakham", "Ban Thanaleng"],
  },
  Phongsali: {
    Phongsali: ["Ban Phongsali", "Ban Komen"],
    "Boun Neua": ["Ban Boun Neua", "Ban Yo"],
    May: ["Ban May", "Ban Namo"],
  },
  "Luang Namtha": {
    "Luang Namtha": ["Ban Luang Namtha", "Ban Vieng Neua"],
    Sing: ["Ban Sing", "Ban Xieng Kok"],
    Long: ["Ban Long", "Ban Namfa"],
  },
  Oudomxay: {
    Xay: ["Ban Xay", "Ban Nahin"],
    La: ["Ban La", "Ban Houayla"],
    Beng: ["Ban Beng", "Ban Pakbeng"],
  },
  Bokeo: {
    Houayxay: ["Ban Houayxay", "Ban Khonkeo"],
    Tonpheung: ["Ban Tonpheung", "Ban Mom"],
    Meung: ["Ban Meung", "Ban Namnyu"],
  },
  "Luang Prabang": {
    "Luang Prabang": ["Ban Xiengthong", "Ban Phonpheng", "Ban Naviengkham"],
    Nan: ["Ban Nan", "Ban Houaykhing"],
    "Pak Ou": ["Ban Pak Ou", "Ban Xianglom"],
    Nambak: ["Ban Nambak", "Ban Phadeng"],
  },
  Houaphan: {
    Xamneua: ["Ban Xamneua", "Ban Naxai"],
    Viengxay: ["Ban Viengxay", "Ban Nakai"],
    Xiengkhor: ["Ban Xiengkhor", "Ban Sopkhao"],
  },
  Xayabury: {
    Xayabury: ["Ban Xayabury", "Ban Nakham"],
    Hongsa: ["Ban Hongsa", "Ban Viengkeo"],
    Paklai: ["Ban Paklai", "Ban Nakok"],
  },
  "Xieng Khouang": {
    Pek: ["Ban Phonsavan", "Ban Phonsvang"],
    Kham: ["Ban Kham", "Ban Nameuang"],
    Nonghet: ["Ban Nonghet", "Ban Phadong"],
  },
  "Vientiane Province": {
    Phonhong: ["Ban Phonhong", "Ban Naxon"],
    Vangvieng: ["Ban Vangvieng", "Ban Phoudindaeng"],
    Thoulakhom: ["Ban Thoulakhom", "Ban Nampheng"],
  },
  Borikhamxay: {
    Pakxan: ["Ban Pakxan", "Ban Phonsy"],
    Thaphabat: ["Ban Thaphabat", "Ban Nathong"],
    Pakkading: ["Ban Pakkading", "Ban Hatkhamphan"],
  },
  Khammouane: {
    Thakhek: ["Ban Thakhek", "Ban Nabo"],
    Nongbok: ["Ban Nongbok", "Ban Khampeng"],
    Mahaxay: ["Ban Mahaxay", "Ban Nakhok"],
  },
  Savannakhet: {
    Kaysone: ["Ban Kaysone", "Ban Thahae", "Ban Lakmuang"],
    Outhoumphone: ["Ban Outhoumphone", "Ban Nong"],
    Atsaphangthong: ["Ban Atsaphangthong", "Ban Dongmuang"],
  },
  Salavan: {
    Salavan: ["Ban Salavan", "Ban Nakhonpheng"],
    "Lao Ngam": ["Ban Lao Ngam", "Ban Beng"],
    Toumlan: ["Ban Toumlan", "Ban Kasy"],
  },
  Xekong: {
    Lamam: ["Ban Lamam", "Ban Houaykong"],
    Thateng: ["Ban Thateng", "Ban Dakcheung"],
    Kaleum: ["Ban Kaleum", "Ban Saseng"],
  },
  Champasak: {
    Pakse: ["Ban Pakse", "Ban Phonsavanh", "Ban Lak Muang"],
    Bachiangchaleunsook: ["Ban Bachiang", "Ban Lak 35"],
    Champasak: ["Ban Champasak", "Ban Wat Phou"],
    Khong: ["Ban Khong", "Ban Done Khong"],
  },
  Attapeu: {
    Samakkhixay: ["Ban Samakkhixay", "Ban Sokamarn"],
    Sanamxay: ["Ban Sanamxay", "Ban Mai"],
    Sanxay: ["Ban Sanxay", "Ban Vangtad"],
  },
  Xaysomboune: {
    Anouvong: ["Ban Anouvong", "Ban Longcheng"],
    Thathom: ["Ban Thathom", "Ban Hom"],
    Hom: ["Ban Hom", "Ban Phoukoud"],
  },
};

export const PROVINCES = Object.keys(LAO_LOCATIONS);

export function getDistricts(province: string): string[] {
  return province && LAO_LOCATIONS[province] ? Object.keys(LAO_LOCATIONS[province]) : [];
}

export function getVillages(province: string, district: string): string[] {
  return province && district && LAO_LOCATIONS[province]?.[district]
    ? LAO_LOCATIONS[province][district]
    : [];
}
