import Dexie, { type Table } from 'dexie';
import type { OwnedPokemon, GameSave } from './types';
import { randomIVs } from './species';

// ── Database ─────────────────────────────────────────────────

class PokemonGameDatabase extends Dexie {
  ownedPokemon!: Table<OwnedPokemon, number>;
  gameSave!: Table<GameSave, number>;

  constructor() {
    super('PokemonGameDB');
    this.version(1).stores({
      ownedPokemon: '++id, speciesId',
      gameSave: 'id',
    });
  }
}

export const gameDb = new PokemonGameDatabase();

// ── Helper functions ─────────────────────────────────────────

export async function getGameSave(): Promise<GameSave> {
  const save = await gameDb.gameSave.get(1);
  if (save) return save;
  const fresh: GameSave = { id: 1, team: [], questLastAttempt: 0 };
  await gameDb.gameSave.put(fresh);
  return fresh;
}

export async function saveTeam(team: number[]): Promise<void> {
  const save = await getGameSave();
  await gameDb.gameSave.put({ ...save, team });
}

export async function addPokemon(pokemon: Omit<OwnedPokemon, 'id'>): Promise<number> {
  return (await gameDb.ownedPokemon.add(pokemon as OwnedPokemon)) as number;
}

export async function getAllPokemon(): Promise<OwnedPokemon[]> {
  return gameDb.ownedPokemon.toArray();
}

export async function initNewPlayer(): Promise<void> {
  const all = await getAllPokemon();
  if (all.length === 0) {
    const starterId = await addPokemon({
      speciesId: 'chakun',
      ivs: randomIVs(),
    });
    await saveTeam([starterId]);
  }
}
