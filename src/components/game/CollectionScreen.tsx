'use client';

import { SPECIES, calcStats } from '@/lib/game/species';
import type { OwnedPokemon } from '@/lib/game/types';

interface CollectionScreenProps {
  allPokemon: OwnedPokemon[];
  team: number[];
  onTeamChange: (newTeam: number[]) => Promise<void>;
  onBack: () => void;
}

function StarRating({ value, max = 31 }: { value: number; max?: number }) {
  const stars = Math.round((value / max) * 10);
  return (
    <div className="stars">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className={`star ${i < stars ? 'filled' : ''}`}>★</span>
      ))}
      <style jsx>{`
        .stars { display: flex; gap: 1px; }
        .star { font-size: 8px; color: rgba(255,255,255,0.15); line-height: 1; }
        .star.filled { color: #facc15; }
      `}</style>
    </div>
  );
}

export default function CollectionScreen({
  allPokemon,
  team,
  onTeamChange,
  onBack,
}: CollectionScreenProps) {
  const toggleTeam = async (id: number) => {
    if (!id) return;
    if (team.includes(id)) {
      await onTeamChange(team.filter(t => t !== id));
    } else {
      if (team.length >= 3) return; // team full
      await onTeamChange([...team, id]);
    }
  };

  return (
    <div className="collection-screen">
      <div className="col-header">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <div className="col-title">コレクション</div>
        <div className="team-count">{team.length}/3</div>
      </div>

      <div className="pokemon-grid">
        {allPokemon.length === 0 && (
          <div className="empty-msg">ポケモンがいません<br />クエストで捕まえよう！</div>
        )}
        {allPokemon.map(mon => {
          if (!mon.id) return null;
          const sp = SPECIES[mon.speciesId];
          const stats = calcStats(mon.speciesId, mon.ivs);
          const inTeam = team.includes(mon.id);
          const teamFull = team.length >= 3 && !inTeam;
          return (
            <div key={mon.id} className={`pokemon-card ${inTeam ? 'in-team' : ''}`}>
              <div className="card-sprite-wrap">
                <img src={sp.frontSprite} alt={sp.name} className="card-sprite" />
                {inTeam && <div className="in-team-badge">チーム</div>}
              </div>
              <div className="card-info">
                <div className="card-name">{mon.nickname ?? sp.name}</div>
                <div className="iv-section">
                  <div className="iv-row">
                    <span className="iv-label">HP</span>
                    <StarRating value={mon.ivs.hp} />
                    <span className="iv-num">{mon.ivs.hp}</span>
                  </div>
                  <div className="iv-row">
                    <span className="iv-label">ATK</span>
                    <StarRating value={mon.ivs.atk} />
                    <span className="iv-num">{mon.ivs.atk}</span>
                  </div>
                  <div className="iv-row">
                    <span className="iv-label">DEF</span>
                    <StarRating value={mon.ivs.def} />
                    <span className="iv-num">{mon.ivs.def}</span>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="stat-chip">HP <strong>{stats.maxHP}</strong></div>
                  <div className="stat-chip">ATK <strong>{stats.atk}</strong></div>
                  <div className="stat-chip">DEF <strong>{stats.def}</strong></div>
                </div>
                <button
                  className={`team-toggle-btn ${inTeam ? 'remove' : 'add'} ${teamFull ? 'disabled' : ''}`}
                  onClick={() => toggleTeam(mon.id!)}
                  disabled={teamFull}
                >
                  {inTeam ? 'チームから外す' : teamFull ? 'チームが満員' : 'チームに追加'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .collection-screen {
          position: fixed;
          inset: 0;
          background: linear-gradient(160deg, #0f0c29 0%, #302b63 60%, #24243e 100%);
          display: flex;
          flex-direction: column;
          font-family: var(--font-m-plus-rounded, sans-serif);
          overflow: hidden;
        }

        .col-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 16px 12px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .back-btn {
          color: rgba(255,255,255,0.65);
          font-size: 14px;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 4px 0;
        }
        .back-btn:hover { color: #fff; }
        .col-title {
          flex: 1;
          font-size: 18px;
          font-weight: 900;
          color: #fff;
        }
        .team-count {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.08);
          padding: 4px 10px;
          border-radius: 999px;
        }

        .pokemon-grid {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty-msg {
          text-align: center;
          color: rgba(255,255,255,0.5);
          font-size: 15px;
          font-weight: 600;
          padding: 40px 20px;
          line-height: 1.8;
        }

        .pokemon-card {
          display: flex;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 14px;
          transition: border-color 0.2s;
        }
        .pokemon-card.in-team {
          border-color: rgba(74,222,128,0.4);
          background: rgba(74,222,128,0.05);
        }

        .card-sprite-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .card-sprite {
          width: 72px;
          height: 72px;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .in-team-badge {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          background: #4ade80;
          color: #0f0c29;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .card-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .card-name {
          font-size: 16px;
          font-weight: 900;
          color: #fff;
        }

        .iv-section { display: flex; flex-direction: column; gap: 3px; }
        .iv-row { display: flex; align-items: center; gap: 6px; }
        .iv-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.45); width: 28px; flex-shrink: 0; letter-spacing: 0.05em; }
        .iv-num { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.6); min-width: 20px; }

        .stats-row { display: flex; gap: 6px; }
        .stat-chip { font-size: 11px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.07); border-radius: 8px; padding: 3px 8px; }
        .stat-chip strong { color: #fff; font-weight: 800; }

        .team-toggle-btn {
          align-self: flex-start;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.15s, transform 0.12s;
        }
        .team-toggle-btn:hover:not(.disabled) { transform: scale(1.04); }
        .team-toggle-btn.add { background: linear-gradient(135deg, #4facfe, #00f2fe); color: #0f0c29; }
        .team-toggle-btn.remove { background: rgba(248,113,113,0.2); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
        .team-toggle-btn.disabled { opacity: 0.4; cursor: not-allowed; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
      `}</style>
    </div>
  );
}
