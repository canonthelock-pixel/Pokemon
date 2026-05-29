// Type definitions for the Pokémon battle engine

export type PokemonType = 
  | "normal" | "fire" | "water" | "electric" | "grass" | "ice" 
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug" 
  | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";

export type Gender = "male" | "female";
export type MoveCategory = "physical" | "special" | "status";
export type StatusCondition = "none" | "burn" | "poison" | "paralysis" | "sleep" | "freeze" | "badly_poisoned";

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export interface TypeMatchup {
  type: PokemonType;
  multiplier: number;
}

export interface Fighter {
  id: string;
  name: string;
  types: PokemonType[];
  gender: Gender;
  stats: Stats;
  ability: string;
  item: string;
  moves: string[];
  weaknesses: TypeMatchup[];
  resistances: TypeMatchup[];
  immunities: PokemonType[];
}

export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number | null;
  accuracy: number;
  priority: number;
  effect?: string;
  description: string;
}

export interface StatStages {
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
  accuracy: number;
  evasion: number;
}

export interface BattleFighter {
  fighter: Fighter;
  currentHp: number;
  maxHp: number;
  statStages: StatStages;
  status: StatusCondition;
  statusTurns: number;
  toxicCounter: number;
}

export interface BattleTeam {
  fighters: BattleFighter[];
  currentIndex: number;
}

export interface BattleState {
  player1: BattleTeam;
  player2: BattleTeam;
  turn: number;
  battleLog: string[];
  isOver: boolean;
  winner?: "player1" | "player2" | "draw";
  isSwitching: boolean;
}

export interface DamageResult {
  damage: number;
  effectiveness: "immune" | "not_very_effective" | "neutral" | "super_effective";
  isCritical: boolean;
  moveAccuracy: boolean;
}

export interface BattleAction {
  type: "move" | "switch" | "forfeit";
  moveId?: string;
  switchIndex?: number;
}
