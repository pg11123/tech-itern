// Display names for data records. The JSON `name` is the English name; other languages list
// their translations here by record id. A missing translation falls back to the JSON name.
import { DEFAULT_LANGUAGE } from '../config/constants';

export const DATA_NAMES = {
  pl: {
    skill: {
      attack: 'Atak',
      attack_magic: 'Iskra',
      shield_bash: 'Uderzenie tarczą',
      taunt: 'Prowokacja',
      guard_up: 'Osłona',
      rage_slam: 'Wściekłe uderzenie',
      arc_bolt: 'Błyskawica',
      chain_lightning: 'Łańcuch piorunów',
      firestorm: 'Burza ognia',
      tempest: 'Nawałnica',
      healing_light: 'Światło uzdrowienia',
      rally: 'Zagrzewanie',
      purify: 'Oczyszczenie',
      sanctuary: 'Sanktuarium',
      blast: 'Wybuch',
      fuse_strike: 'Cios lontem',
      powder_keg: 'Beczka prochu',
      big_bang: 'Wielki wybuch',
      triple_peck: 'Potrójne dziobnięcie',
      flank: 'Flankowanie',
      scatter_shot: 'Rozrzut',
      blue_blitz: 'Niebieski blitz',
      club_smash: 'Cios pałką',
      sling_shot: 'Strzał z procy',
      pebble_spray: 'Grad kamyków',
      pig_mend: 'Świńskie leczenie',
      war_drum: 'Bęben wojenny',
      skull_crack: 'Rozbicie czaszki',
      royal_strike: 'Królewski cios',
      war_cry: 'Okrzyk bojowy',
      royal_quake: 'Królewskie trzęsienie',
    },
    status: {
      stun: 'Ogłuszenie',
      bleed: 'Krwawienie',
      shield: 'Tarcza',
      taunt: 'Prowokacja',
      buffAtk: 'Atak w górę',
      buffDef: 'Obrona w górę',
      weak: 'Osłabienie',
      defend: 'Obrona',
    },
    item: {
      potion: 'Mikstura',
      focus_tonic: 'Tonik skupienia',
      fire_pepper: 'Ognista papryczka',
      revive_feather: 'Pióro wskrzeszenia',
    },
    enemy: {
      grunt: 'Piechur',
      slinger: 'Procarz',
      shaman: 'Szaman',
      brute: 'Osiłek',
      chieftain: 'Wódz',
    },
  },
};

// kind: 'skill' | 'status' | 'item' | 'enemy' | 'hero'
export function localName(language, kind, record) {
  if (!record) return '';
  if (language === DEFAULT_LANGUAGE) return record.name;
  return DATA_NAMES[language]?.[kind]?.[record.id] ?? record.name;
}
