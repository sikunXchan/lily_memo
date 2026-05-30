'use client';

import { useState, useEffect } from 'react';
import { resolveTurn } from '@/lib/game/battle';
import { MOVES } from '@/lib/game/moves';
import { SPECIES } from '@/lib/game/species';
import type { BattleState, BattleMon, MoveId } from '@/lib/game/types';

interface BattleScreenProps {
  battleState: BattleState;
  onBattleStateChange: (s: BattleState) => void;
  onMoveSelect: (move: MoveId) => void;
  onHandoffConfirm: () => void;
  onNextTurn: () => void;
  onSwitchPokemon: (index: number) => void;
  onEndBattle: () => void;
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? '#4ade80' : pct > 25 ? '#facc15' : '#f87171';
  return (
    <div className="hp-bar-wrap">
      <div className="hp-bar-bg">
        <div className="hp-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="hp-text">{current}/{max}</div>
      <style jsx>{`
        .hp-bar-wrap { display: flex; align-items: center; gap: 6px; }
        .hp-bar-bg { flex: 1; height: 8px; background: rgba(0,0,0,0.3); border-radius: 999px; overflow: hidden; }
        .hp-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
        .hp-text { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.85); white-space: nowrap; min-width: 48px; text-align: right; }
      `}</style>
    </div>
  );
}

function TeamDots({ team, activeIndex }: { team: BattleMon[]; activeIndex: number }) {
  return (
    <div className="team-dots">
      {team.map((mon, i) => (
        <div
          key={i}
          className={`dot ${i === activeIndex ? 'active' : ''} ${mon.currentHP <= 0 ? 'fainted' : ''}`}
        />
      ))}
      <style jsx>{`
        .team-dots { display: flex; gap: 5px; align-items: center; }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.25); border: 1.5px solid rgba(255,255,255,0.3); }
        .dot.active { background: #4ade80; border-color: #4ade80; }
        .dot.fainted { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}

function MonCard({
  mon,
  isBack,
  label,
}: {
  mon: BattleMon;
  isBack: boolean;
  label: string;
}) {
  const sp = SPECIES[mon.speciesId];
  const sprite = isBack ? sp.backSprite : sp.frontSprite;
  return (
    <div className="mon-card">
      <div className="mon-info">
        <div className="mon-name">{mon.name}<span className="mon-label">{label}</span></div>
        <HpBar current={mon.currentHP} max={mon.stats.maxHP} />
      </div>
      <img
        src={sprite}
        alt={mon.name}
        className="mon-sprite"
        style={{ transform: isBack ? 'scaleX(-1)' : 'none' }}
      />
      <style jsx>{`
        .mon-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.06);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .mon-info { flex: 1; min-width: 0; }
        .mon-name { font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
        .mon-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: 0.08em; }
        .mon-sprite { width: 72px; height: 72px; object-fit: contain; flex-shrink: 0; image-rendering: pixelated; }
      `}</style>
    </div>
  );
}

export default function BattleScreen({
  battleState,
  onBattleStateChange,
  onMoveSelect,
  onHandoffConfirm,
  onNextTurn,
  onSwitchPokemon,
  onEndBattle,
}: BattleScreenProps) {
  const [logIndex, setLogIndex] = useState(0);

  const { phase, mode, turn, log } = battleState;

  // Reset log index when log changes (new turn)
  useEffect(() => {
    setLogIndex(0);
  }, [log]);

  // Determine perspective: in p2-select, swap for PvP
  const isPvpP2 = mode === 'pvp' && phase === 'p2-select';
  const bottomTeam = isPvpP2 ? battleState.p2Team : battleState.p1Team;
  const bottomIndex = isPvpP2 ? battleState.p2ActiveIndex : battleState.p1ActiveIndex;
  const topTeam = isPvpP2 ? battleState.p1Team : battleState.p2Team;
  const topIndex = isPvpP2 ? battleState.p1ActiveIndex : battleState.p2ActiveIndex;

  const bottomMon = bottomTeam[bottomIndex];
  const topMon = topTeam[topIndex];

  const bottomLabel = isPvpP2 ? 'P2' : 'P1';
  const topLabel = isPvpP2 ? 'P1' : (mode === 'quest' ? '野生' : 'P2');

  // Available moves for current player
  const activeMoves: MoveId[] = (() => {
    const mon = isPvpP2 ? battleState.p2Team[battleState.p2ActiveIndex] : battleState.p1Team[battleState.p1ActiveIndex];
    const sp = SPECIES[mon.speciesId];
    return sp.moves;
  })();

  const getMoveAvailable = (moveId: MoveId): boolean => {
    const mon = isPvpP2 ? battleState.p2Team[battleState.p2ActiveIndex] : battleState.p1Team[battleState.p1ActiveIndex];
    return (mon.cooldowns[moveId] ?? 0) === 0;
  };

  // Resolve turn when both moves are selected and phase is 'resolving' but state hasn't been resolved yet
  useEffect(() => {
    if (
      phase === 'resolving' &&
      battleState.p1SelectedMove !== null &&
      battleState.p2SelectedMove !== null &&
      battleState.log.length === 0
    ) {
      const resolved = resolveTurn(battleState);
      onBattleStateChange(resolved);
    }
  }, [battleState, phase, onBattleStateChange]);

  // ── Handoff screen ──────────────────────────────────────────
  if (phase === 'handoff') {
    return (
      <div className="battle-screen handoff">
        <div className="handoff-content">
          <div className="handoff-emoji">🔄</div>
          <div className="handoff-title">プレイヤー2に渡してください</div>
          <div className="handoff-sub">プレイヤー1が技を選びました</div>
          <button className="handoff-btn" onClick={onHandoffConfirm}>
            ▶ つぎへ
          </button>
        </div>
        <style jsx>{`
          .battle-screen { position: fixed; inset: 0; background: #0f0c29; display: flex; align-items: center; justify-content: center; font-family: var(--font-m-plus-rounded, sans-serif); }
          .handoff-content { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px; }
          .handoff-emoji { font-size: 64px; }
          .handoff-title { font-size: 24px; font-weight: 900; color: #fff; }
          .handoff-sub { font-size: 14px; color: rgba(255,255,255,0.6); }
          .handoff-btn { margin-top: 16px; padding: 16px 40px; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 999px; font-size: 20px; font-weight: 800; color: #fff; border: none; cursor: pointer; font-family: inherit; transition: transform 0.15s; }
          .handoff-btn:hover { transform: scale(1.05); }
        `}</style>
      </div>
    );
  }

  // ── Ended screen ─────────────────────────────────────────────
  if (phase === 'ended') {
    const won = battleState.winner === 'p1';
    return (
      <div className="battle-screen ended">
        <div className="ended-content">
          <div className="ended-emoji">{won ? '🎉' : '😢'}</div>
          <div className="ended-title">
            {mode === 'pvp'
              ? `プレイヤー${battleState.winner === 'p1' ? 1 : 2}の勝ち！`
              : won ? 'たおした！' : 'まけてしまった…'}
          </div>
          <button className="ended-btn" onClick={onEndBattle}>
            {mode === 'quest' && won ? '捕まえようとする！' : 'ゲームを終了'}
          </button>
        </div>
        <style jsx>{`
          .battle-screen { position: fixed; inset: 0; background: linear-gradient(160deg, #0f0c29, #302b63); display: flex; align-items: center; justify-content: center; font-family: var(--font-m-plus-rounded, sans-serif); }
          .ended-content { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 32px; }
          .ended-emoji { font-size: 72px; }
          .ended-title { font-size: 28px; font-weight: 900; color: #fff; }
          .ended-btn { padding: 16px 36px; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 999px; font-size: 18px; font-weight: 800; color: #fff; border: none; cursor: pointer; font-family: inherit; transition: transform 0.15s; }
          .ended-btn:hover { transform: scale(1.05); }
        `}</style>
      </div>
    );
  }

  // ── Faint: switch Pokemon ─────────────────────────────────────
  if (phase === 'p1-fainted') {
    return (
      <div className="battle-screen faint-screen">
        <div className="faint-content">
          <div className="faint-emoji">💀</div>
          <div className="faint-title">たおれた！</div>
          <div className="faint-sub">次のポケモンを選ぶ</div>
          <div className="switch-list">
            {battleState.p1Team.map((mon, i) => {
              if (mon.currentHP <= 0 || i === battleState.p1ActiveIndex) return null;
              const sp = SPECIES[mon.speciesId];
              return (
                <button key={i} className="switch-btn" onClick={() => onSwitchPokemon(i)}>
                  <img src={sp.frontSprite} alt={mon.name} className="switch-sprite" />
                  <div>
                    <div className="switch-name">{mon.name}</div>
                    <div className="switch-hp">HP: {mon.currentHP}/{mon.stats.maxHP}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <style jsx>{`
          .battle-screen { position: fixed; inset: 0; background: linear-gradient(160deg, #0f0c29, #302b63); display: flex; align-items: center; justify-content: center; font-family: var(--font-m-plus-rounded, sans-serif); }
          .faint-content { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; width: 100%; max-width: 360px; }
          .faint-emoji { font-size: 48px; }
          .faint-title { font-size: 28px; font-weight: 900; color: #fff; }
          .faint-sub { font-size: 14px; color: rgba(255,255,255,0.6); }
          .switch-list { display: flex; flex-direction: column; gap: 10px; width: 100%; }
          .switch-btn { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.15); border-radius: 14px; cursor: pointer; color: #fff; font-family: inherit; transition: background 0.15s; }
          .switch-btn:hover { background: rgba(255,255,255,0.15); }
          .switch-sprite { width: 48px; height: 48px; object-fit: contain; image-rendering: pixelated; }
          .switch-name { font-size: 16px; font-weight: 800; text-align: left; }
          .switch-hp { font-size: 12px; color: rgba(255,255,255,0.6); text-align: left; }
        `}</style>
      </div>
    );
  }

  const isSelectPhase = phase === 'p1-select' || phase === 'p2-select';
  const currentLog = log[logIndex];

  return (
    <div className="battle-screen main">
      {/* Header */}
      <div className="battle-header">
        <div className="turn-info">ターン {turn}</div>
        <div className="mode-badge">{mode === 'quest' ? 'クエスト' : 'PvP'}</div>
      </div>

      {/* Opponent area (top) */}
      <div className="mon-area top">
        <MonCard mon={topMon} isBack={false} label={topLabel} />
        <TeamDots team={topTeam} activeIndex={topIndex} />
      </div>

      {/* Player area (bottom) */}
      <div className="mon-area bottom">
        <MonCard mon={bottomMon} isBack={true} label={bottomLabel} />
        <TeamDots team={bottomTeam} activeIndex={bottomIndex} />
      </div>

      {/* Battle log */}
      <div className="battle-log">
        {phase === 'resolving' && log.length > 0 && (
          <div className={`log-message log-${currentLog?.type ?? 'info'}`}>
            {currentLog?.message ?? ''}
          </div>
        )}
        {phase === 'resolving' && (
          <div className="log-nav">
            {logIndex < log.length - 1 ? (
              <button className="log-next-btn" onClick={() => setLogIndex(i => i + 1)}>
                つぎ ▶
              </button>
            ) : (
              <button className="log-next-btn primary" onClick={onNextTurn}>
                次のターンへ ▶
              </button>
            )}
          </div>
        )}
        {isSelectPhase && (
          <div className="select-prompt">
            {isPvpP2 ? 'プレイヤー2' : 'プレイヤー1'}の技を選んでください
          </div>
        )}
      </div>

      {/* Move buttons */}
      {isSelectPhase && (
        <div className="move-buttons">
          {activeMoves.map(moveId => {
            const move = MOVES[moveId];
            const mon = isPvpP2 ? battleState.p2Team[battleState.p2ActiveIndex] : battleState.p1Team[battleState.p1ActiveIndex];
            const cd = mon.cooldowns[moveId] ?? 0;
            const avail = getMoveAvailable(moveId);
            return (
              <button
                key={moveId}
                className={`move-btn ${avail ? 'avail' : 'unavail'}`}
                onClick={() => avail && onMoveSelect(moveId)}
                disabled={!avail}
              >
                <div className="move-name">{move.name}</div>
                <div className="move-meta">
                  {move.power ? <span className="move-power">威力 {move.power}</span> : <span className="move-power">—</span>}
                  <span className={`move-cd ${avail ? 'ready' : 'waiting'}`}>
                    {avail ? '使える！' : `あと${cd}ターン`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .battle-screen {
          position: fixed;
          inset: 0;
          background: linear-gradient(160deg, #0f0c29 0%, #302b63 60%, #24243e 100%);
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
          font-family: var(--font-m-plus-rounded, sans-serif);
          overflow: hidden;
        }

        .battle-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .turn-info {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
        }
        .mode-badge {
          font-size: 11px;
          font-weight: 800;
          color: rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.08);
          padding: 4px 10px;
          border-radius: 999px;
          letter-spacing: 0.06em;
        }

        .mon-area {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
        }
        .mon-area.top { }
        .mon-area.bottom { }

        .battle-log {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px;
          background: rgba(0,0,0,0.2);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          min-height: 80px;
        }
        .log-message {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          line-height: 1.5;
        }
        .log-damage { color: #f87171; }
        .log-miss { color: #facc15; }
        .log-status { color: #60a5fa; }
        .log-info { color: rgba(255,255,255,0.8); }
        .log-catch { color: #34d399; }

        .log-nav { display: flex; justify-content: center; }
        .log-next-btn {
          padding: 10px 24px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 999px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .log-next-btn.primary { background: linear-gradient(135deg, #4facfe, #00f2fe); border-color: transparent; }
        .log-next-btn:hover { background: rgba(255,255,255,0.2); }
        .log-next-btn.primary:hover { opacity: 0.9; }

        .select-prompt {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          text-align: center;
        }

        .move-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        .move-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 16px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.12s, opacity 0.15s;
          text-align: left;
        }
        .move-btn.avail {
          background: rgba(255,255,255,0.12);
          border: 1.5px solid rgba(255,255,255,0.2);
        }
        .move-btn.avail:hover { transform: translateX(3px); background: rgba(255,255,255,0.18); }
        .move-btn.unavail {
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.06);
          opacity: 0.5;
          cursor: not-allowed;
        }
        .move-name { font-size: 16px; font-weight: 800; color: #fff; }
        .move-meta { display: flex; gap: 8px; align-items: center; }
        .move-power { font-size: 11px; color: rgba(255,255,255,0.55); font-weight: 600; }
        .move-cd { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
        .move-cd.ready { background: rgba(74,222,128,0.2); color: #4ade80; }
        .move-cd.waiting { background: rgba(248,113,113,0.15); color: #f87171; }
      `}</style>
    </div>
  );
}
