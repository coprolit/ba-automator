// Target unit:
 export interface Target {
  cover: 'n' | 's' | 'h'; // none | soft | hard
  damageValue: number;
  down: boolean;
  building: boolean;
  shield: boolean;
  small: boolean;
}

export interface Unit {
  weapons: WeaponResult[];
}

// Weapon types:
export interface Weapon {
  name: string;
  range: number;
  shots: number;
  pen: number;
  assault: boolean;
}

export interface HitModifiers {
  range: 'c' | 's' | 'l'; // close | short | long
  // moved: boolean; // TODO instead extracted from order dice action?
  loader: boolean;
}
export interface DamageModifiers {
  arc: 'f' | 's' | 'r'; // front, side/top, rear
}
export interface WeaponShooting extends Weapon {
  modifiers: {
    hit: HitModifiers;
    damage: DamageModifiers;
  }
}

export interface WeaponResult extends WeaponShooting {
  shotsResult: Shot[];
}

export interface Action {
  weapons: WeaponResult[];
}

export interface Shot {
  hit?: Score;
  damage?: Score;
}

export interface Score {
  roll: number|string;
  modifier: number;
  success: boolean;
  crit: boolean;
}