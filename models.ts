// Weapon types:
export interface Weapon {
  range: number;
  shots: number;
  pen: number;
}

export interface Model {
  weapon: Weapon
}

export interface Units {
  name: string;
  models: Model[];
  toHit: number;
  damageValue: number;
  cost: number;
}

export interface Army {
  name: string;
  units: Units[]
}