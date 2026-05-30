// ============================================================
// Pokemon Battle Game – Core Types
// ============================================================

// ── Species ─────────────────────────────────────────────────

export type SpeciesId = 'chakun' | 'shikun';

export interface Species {
  id: SpeciesId;
  name: string;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  moves: MoveId[];
  frontSprite: string;
  backSprite: string;
  backFlip?: boolean; // use scaleX(-1) for back sprite
}

// ── Moves ────────────────────────────────────────────────────

export type MoveId =
  | 'kawasu'
  | 'chakken'
  | 'drumming'
  | 'shikken'
  | 'backflip';

export interface Move {
  id: MoveId;
  name: string;
  baseCooldown: number; // turns to wait after use
  power?: number;       // if undefined, not a damage move
  guaranteed?: boolean; // true = cannot be dodged
  description: string;
}

// ── Individual Values ────────────────────────────────────────

export interface IVs {
  hp: number;   // 0-31
  atk: number;  // 0-31
  def: number;  // 0-31
}

// ── Computed Stats ───────────────────────────────────────────

export interface Stats {
  maxHP: number;
  atk: number;
  def: number;
}

// ── Owned Pokemon (persisted) ────────────────────────────────

export interface OwnedPokemon {
  id?: number;
  speciesId: SpeciesId;
  nickname?: string;
  ivs: IVs;
}

// ── Battle Mon (runtime) ─────────────────────────────────────

export interface BattleMon {
  ownedId?: number;     // undefined for wild/CPU
  speciesId: SpeciesId;
  name: string;
  ivs: IVs;
  stats: Stats;
  currentHP: number;
  cooldowns: Record<MoveId, number>;
  // Drumming flags
  drumAttackBuff: boolean;
  drumDefenseBuff: boolean;
}

// ── Battle State ─────────────────────────────────────────────

export type BattlePhase =
  | 'p1-select'
  | 'handoff'
  | 'p2-select'
  | 'resolving'
  | 'p1-fainted'
  | 'p2-fainted'
  | 'ended';

export type BattleMode = 'quest' | 'pvp';

export interface BattleLogEntry {
  message: string;
  type: 'damage' | 'miss' | 'status' | 'info' | 'catch';
}

export interface BattleState {
  mode: BattleMode;
  turn: number;
  phase: BattlePhase;

  // Player 1
  p1Team: BattleMon[];
  p1ActiveIndex: number;
  p1SelectedMove: MoveId | null;

  // Player 2 / CPU
  p2Team: BattleMon[];
  p2ActiveIndex: number;
  p2SelectedMove: MoveId | null;

  log: BattleLogEntry[];
  winner: 'p1' | 'p2' | null;

  // Quest-specific
  wildCaught?: boolean;
  wildSpeciesId?: SpeciesId;
}

// ── Game Save ────────────────────────────────────────────────

export interface GameSave {
  id: 1;
  team: number[];           // OwnedPokemon IDs (up to 3)
  questLastAttempt: number; // timestamp
}
