import type { Species, SpeciesId, IVs, Stats, OwnedPokemon } from './types';

export const SPECIES: Record<SpeciesId, Species> = {
  chakun: {
    id: 'chakun',
    name: 'ちゃくん',
    baseHP: 160,
    baseATK: 50,
    baseDEF: 60,
    moves: ['kawasu', 'chakken', 'drumming'],
    frontSprite: '/chakun.png',
    backSprite: '/chakun_behind.png',
  },
  shikun: {
    id: 'shikun',
    name: 'しくん',
    baseHP: 140,
    baseATK: 65,
    baseDEF: 45,
    moves: ['kawasu', 'shikken', 'backflip'],
    frontSprite: '/shikun.png',
    backSprite: '/shikun_behind.png',
  },
};

export function calcStats(speciesId: SpeciesId, ivs: IVs): Stats {
  const sp = SPECIES[speciesId];
  return {
    maxHP: sp.baseHP + ivs.hp * 2,
    atk: sp.baseATK + Math.floor(ivs.atk / 2),
    def: sp.baseDEF + Math.floor(ivs.def / 2),
  };
}

export function randomIVs(): IVs {
  return {
    hp: Math.floor(Math.random() * 32),
    atk: Math.floor(Math.random() * 32),
    def: Math.floor(Math.random() * 32),
  };
}

export function generateWildMon(speciesId?: SpeciesId): OwnedPokemon {
  const ids: SpeciesId[] = ['chakun', 'shikun'];
  const sid = speciesId ?? ids[Math.floor(Math.random() * ids.length)];
  return {
    speciesId: sid,
    ivs: randomIVs(),
  };
}
