// Target unit:
 export interface Target {
  cover: 'n' | 's' | 'h'; // none | soft | hard
  damageValue: number;
  down: boolean;
}

// Weapon types:
export interface Weapon {
  name: string;
  range: number;
  shots: number;
  pen: number;
}

export interface WeaponShooting extends Weapon {
  modifiers: {
    range: 'c' | 's' | 'l'; // close | short | long
    moved: boolean;
    loader: boolean;
  }
}

export interface WeaponResult extends WeaponShooting {
  shotsResult: Shot[]
}

export interface WeaponHistory {
  
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