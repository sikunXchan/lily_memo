import type { Move, MoveId } from './types';

export const MOVES: Record<MoveId, Move> = {
  kawasu: {
    id: 'kawasu',
    name: 'かわす',
    baseCooldown: 1,
    description: 'この番の非確定攻撃を回避する。',
  },
  chakken: {
    id: 'chakken',
    name: 'ちゃっけん',
    baseCooldown: 0,
    power: 50,
    description: '素早い一撃。毎ターン使える。',
  },
  drumming: {
    id: 'drumming',
    name: 'ドラミング',
    baseCooldown: 1,
    description: '次の攻撃と受けるダメージが1.2倍になる。',
  },
  shikken: {
    id: 'shikken',
    name: 'しっけん',
    baseCooldown: 1,
    power: 70,
    description: '強力な一撃。このターン自分が受けるダメージ1.1倍。',
  },
  backflip: {
    id: 'backflip',
    name: 'バックフリップ',
    baseCooldown: 2,
    description: '自分の全クールダウンを1追加で短縮する。',
  },
};
