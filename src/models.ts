// Weapon types:
export interface Weapon {
  name: string;
  range: number;
  shots: number;
  pen: number;
}

export interface ShootingWeapon extends Weapon {
  modifiers?: {
    range: 'c' | 's' | 'l';
    moved: boolean;
    loader: boolean;
  }
}

export interface Model {
  weapon: Weapon,
  weapon2?: Weapon,
  crewman?: boolean;
}

export interface Unit {
  name: string;
  models: Array<Model>;
  toHit: number;
  damageValue: number;
  cost: number;
}

export interface Army {
  name: string;
  units: Unit[]
}

export interface Selections {
  unit: Unit | null;
  range: number;
  cover: number;
  target: number;
  down: number;
}

export interface Score {
  roll: number|string;
  modifier: number;
  success: boolean;
  crit: boolean;
}
export interface Shot {
  weapon: Weapon;
  hit?: Score;
  damage?: Score;
}