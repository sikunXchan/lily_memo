import type {
  BattleMon, BattleState, BattleLogEntry, MoveId, OwnedPokemon, SpeciesId,
} from './types';
import { SPECIES, calcStats, generateWildMon } from './species';
import { MOVES } from './moves';

// ── Factory helpers ──────────────────────────────────────────

export function createBattleMon(owned: OwnedPokemon): BattleMon {
  const sp = SPECIES[owned.speciesId];
  const stats = calcStats(owned.speciesId, owned.ivs);
  const cooldowns: Record<MoveId, number> = {} as Record<MoveId, number>;
  for (const mid of sp.moves) cooldowns[mid] = 0;
  return {
    ownedId: owned.id,
    speciesId: owned.speciesId,
    name: owned.nickname ?? sp.name,
    ivs: owned.ivs,
    stats,
    currentHP: stats.maxHP,
    cooldowns,
    drumAttackBuff: false,
    drumDefenseBuff: false,
  };
}

export function createWildBattleMon(speciesId?: SpeciesId): BattleMon {
  return createBattleMon(generateWildMon(speciesId));
}

// ── Damage formula ───────────────────────────────────────────

function calcDamage(
  power: number,
  atk: number,
  def: number,
  atkBuff: boolean,
  defBuff: boolean,
): number {
  const critRoll = Math.random() < 0.1;
  const critMult = critRoll ? 1.5 : 1.0;
  const atkMult = atkBuff ? 1.2 : 1.0;
  const defMult = defBuff ? 1.2 : 1.0;
  // defBuff means the defender has drummed → takes 1.2× damage (actually hurts more)
  return Math.max(1, Math.round(power * (atk / 50) * (50 / def) * critMult * atkMult * defMult));
}

// ── Available moves ──────────────────────────────────────────

export function availableMoves(mon: BattleMon): MoveId[] {
  const sp = SPECIES[mon.speciesId];
  return sp.moves.filter(mid => (mon.cooldowns[mid] ?? 0) === 0);
}

// ── CPU AI ───────────────────────────────────────────────────

export function cpuPickMove(mon: BattleMon): MoveId {
  const avail = availableMoves(mon);
  // Weight: damage moves × 3, others × 1
  const weighted: MoveId[] = [];
  for (const mid of avail) {
    const move = MOVES[mid];
    const weight = move.power ? 3 : 1;
    for (let i = 0; i < weight; i++) weighted.push(mid);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

// ── Cooldown tick ────────────────────────────────────────────

function tickCooldowns(mon: BattleMon): void {
  for (const mid in mon.cooldowns) {
    if (mon.cooldowns[mid as MoveId] > 0) {
      mon.cooldowns[mid as MoveId]--;
    }
  }
}

// ── Apply move usage cooldown ────────────────────────────────

function applyUsageCooldown(mon: BattleMon, moveId: MoveId): void {
  const move = MOVES[moveId];
  mon.cooldowns[moveId] = move.baseCooldown;
}

// ── Turn resolution ──────────────────────────────────────────

export function resolveTurn(state: BattleState): BattleState {
  // Deep clone
  const s: BattleState = JSON.parse(JSON.stringify(state));
  const log: BattleLogEntry[] = [];

  const p1 = s.p1Team[s.p1ActiveIndex];
  const p2 = s.p2Team[s.p2ActiveIndex];
  const m1id = s.p1SelectedMove!;
  const m2id = s.p2SelectedMove!;
  const m1 = MOVES[m1id];
  const m2 = MOVES[m2id];

  // Track dodge flags
  let p1Dodging = m1id === 'kawasu';
  let p2Dodging = m2id === 'kawasu';

  // Apply usage cooldowns immediately
  applyUsageCooldown(p1, m1id);
  applyUsageCooldown(p2, m2id);

  // ── Drumming ──
  if (m1id === 'drumming') {
    p1.drumAttackBuff = true;
    p1.drumDefenseBuff = true;
    log.push({ message: `${p1.name} はドラミングした！ 次の攻防が強化される。`, type: 'status' });
  }
  if (m2id === 'drumming') {
    p2.drumAttackBuff = true;
    p2.drumDefenseBuff = true;
    log.push({ message: `${p2.name} はドラミングした！ 次の攻防が強化される。`, type: 'status' });
  }

  // ── しっけん self-debuff (take 1.1× this turn) ──
  // Handled in damage calculation below via flag

  // ── Damage phase: P1 attacks P2 ──
  if (m1.power) {
    const dodged = p2Dodging && !m1.guaranteed;
    if (dodged) {
      log.push({ message: `${p2.name} はかわした！`, type: 'miss' });
    } else {
      // p2 受け: drumDefenseBuff means p2 drummed → extra incoming
      // shikken self: p2 used shikken so p2 takes 1.1× from p1
      let atkEffective = p1.stats.atk;
      let extraMult = 1.0;

      if (m2id === 'shikken') extraMult *= 1.1; // p2 used shikken → p2 takes more

      const dmg = Math.round(
        calcDamage(m1.power, atkEffective, p2.stats.def, p1.drumAttackBuff, p2.drumDefenseBuff) * extraMult,
      );

      p1.drumAttackBuff = false; // consume buff
      p2.drumDefenseBuff = false; // consume buff

      p2.currentHP = Math.max(0, p2.currentHP - dmg);
      log.push({ message: `${p1.name} の${m1.name}！ ${p2.name} に${dmg}ダメージ！`, type: 'damage' });
    }
  }

  // ── Damage phase: P2 attacks P1 ──
  if (m2.power) {
    const dodged = p1Dodging && !m2.guaranteed;
    if (dodged) {
      log.push({ message: `${p1.name} はかわした！`, type: 'miss' });
    } else {
      let extraMult = 1.0;
      if (m1id === 'shikken') extraMult *= 1.1; // p1 used shikken → p1 takes more

      const dmg = Math.round(
        calcDamage(m2.power, p2.stats.atk, p1.stats.def, p2.drumAttackBuff, p1.drumDefenseBuff) * extraMult,
      );

      p2.drumAttackBuff = false;
      p1.drumDefenseBuff = false;

      p1.currentHP = Math.max(0, p1.currentHP - dmg);
      log.push({ message: `${p2.name} の${m2.name}！ ${p1.name} に${dmg}ダメージ！`, type: 'damage' });
    }
  }

  // ── Kawasu log ──
  if (m1id === 'kawasu' && !m2.power) {
    log.push({ message: `${p1.name} はかわそうとしたが、攻撃がなかった。`, type: 'info' });
  }
  if (m2id === 'kawasu' && !m1.power) {
    log.push({ message: `${p2.name} はかわそうとしたが、攻撃がなかった。`, type: 'info' });
  }

  // ── Tick cooldowns ──
  tickCooldowns(p1);
  tickCooldowns(p2);

  // ── Backflip: subtract 1 from all own CDs (after normal tick) ──
  if (m1id === 'backflip') {
    log.push({ message: `${p1.name} はバックフリップ！ クールダウンが短縮！`, type: 'status' });
    for (const mid in p1.cooldowns) {
      if (p1.cooldowns[mid as MoveId] > 0) p1.cooldowns[mid as MoveId]--;
    }
  }
  if (m2id === 'backflip') {
    log.push({ message: `${p2.name} はバックフリップ！ クールダウンが短縮！`, type: 'status' });
    for (const mid in p2.cooldowns) {
      if (p2.cooldowns[mid as MoveId] > 0) p2.cooldowns[mid as MoveId]--;
    }
  }

  s.log = log;
  s.turn++;

  // ── Faint check ──
  const p1Fainted = p1.currentHP <= 0;
  const p2Fainted = p2.currentHP <= 0;

  // Check if any team has remaining Pokemon
  const p1HasRemaining = s.p1Team.some((m, i) => i !== s.p1ActiveIndex && m.currentHP > 0);
  const p2HasRemaining = s.p2Team.some((m, i) => i !== s.p2ActiveIndex && m.currentHP > 0);

  if (p1Fainted && p2Fainted) {
    // Both fainted simultaneously — check if anyone has backups
    if (!p1HasRemaining && !p2HasRemaining) {
      s.winner = 'p2'; // p2 wins on tie
      s.phase = 'ended';
    } else if (!p1HasRemaining) {
      s.winner = 'p2';
      s.phase = 'ended';
    } else if (!p2HasRemaining) {
      s.winner = 'p1';
      s.phase = 'ended';
    } else {
      // Both have backups — p1 switches first
      s.phase = 'p1-fainted';
    }
  } else if (p1Fainted) {
    if (!p1HasRemaining) {
      s.winner = 'p2';
      s.phase = 'ended';
    } else {
      s.phase = 'p1-fainted';
    }
  } else if (p2Fainted) {
    if (!p2HasRemaining) {
      s.winner = 'p1';
      s.phase = 'ended';
    } else {
      // Auto-switch CPU/p2 to next
      const nextIdx = s.p2Team.findIndex((m, i) => i !== s.p2ActiveIndex && m.currentHP > 0);
      if (nextIdx !== -1) {
        s.p2ActiveIndex = nextIdx;
        log.push({ message: `${s.p2Team[nextIdx].name} が登場！`, type: 'info' });
      }
      s.phase = 'resolving';
    }
  } else {
    s.phase = 'resolving';
  }

  s.p1SelectedMove = null;
  s.p2SelectedMove = null;

  return s;
}

// ── Initial battle state builder ─────────────────────────────

export function buildBattleState(
  mode: 'quest' | 'pvp',
  p1Team: OwnedPokemon[],
  p2Team: OwnedPokemon[],
): BattleState {
  return {
    mode,
    turn: 1,
    phase: 'p1-select',
    p1Team: p1Team.map(createBattleMon),
    p1ActiveIndex: 0,
    p1SelectedMove: null,
    p2Team: p2Team.map(createBattleMon),
    p2ActiveIndex: 0,
    p2SelectedMove: null,
    log: [],
    winner: null,
  };
}
