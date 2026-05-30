'use client';

import Link from 'next/link';
import { SPECIES } from '@/lib/game/species';
import type { OwnedPokemon } from '@/lib/game/types';

interface GameHomeProps {
  team: OwnedPokemon[];
  onQuest: () => void;
  onPvp: () => void;
  onCollection: () => void;
}

export default function GameHome({ team, onQuest, onPvp, onCollection }: GameHomeProps) {
  return (
    <div className="game-home">
      <div className="bg-overlay" />

      <div className="content">
        {/* Back button */}
        <Link href="/" className="back-btn">
          ← もどる
        </Link>

        {/* Title */}
        <div className="title-block">
          <div className="title-main">ポケバト！</div>
          <div className="title-sub">みんなのバトルゲーム</div>
        </div>

        {/* Team preview */}
        <div className="team-preview">
          <div className="team-label">あなたのチーム</div>
          <div className="team-slots">
            {[0, 1, 2].map(i => {
              const mon = team[i];
              if (mon) {
                const sp = SPECIES[mon.speciesId];
                return (
                  <div key={i} className="team-slot filled">
                    <img
                      src={sp.frontSprite}
                      alt={sp.name}
                      className="team-sprite"
                    />
                    <div className="team-mon-name">{mon.nickname ?? sp.name}</div>
                  </div>
                );
              }
              return (
                <div key={i} className="team-slot empty">
                  <div className="empty-icon">？</div>
                  <div className="team-mon-name">空</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="actions">
          <button className="action-btn quest-btn" onClick={onQuest}>
            <span className="btn-icon">⚔️</span>
            <span className="btn-text">クエスト</span>
            <span className="btn-sub">野生とたたかう</span>
          </button>
          <button className="action-btn pvp-btn" onClick={onPvp}>
            <span className="btn-icon">🆚</span>
            <span className="btn-text">対戦</span>
            <span className="btn-sub">1vs1バトル</span>
          </button>
          <button className="action-btn collection-btn" onClick={onCollection}>
            <span className="btn-icon">📋</span>
            <span className="btn-text">コレクション</span>
            <span className="btn-sub">もちもの一覧</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .game-home {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: var(--font-m-plus-rounded, sans-serif);
        }

        .bg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          z-index: 0;
        }

        .content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          padding: 20px 20px 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          color: rgba(255,255,255,0.65);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          padding: 6px 0;
          transition: color 0.18s;
        }
        .back-btn:hover { color: #fff; }

        .title-block {
          text-align: center;
        }
        .title-main {
          font-size: 52px;
          font-weight: 900;
          color: #fff;
          letter-spacing: -1px;
          text-shadow: 0 0 30px rgba(147, 112, 219, 0.8), 0 4px 20px rgba(0,0,0,0.6);
          line-height: 1;
        }
        .title-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          margin-top: 6px;
          letter-spacing: 0.15em;
        }

        .team-preview {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 16px;
        }
        .team-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .team-slots {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .team-slot {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 10px 6px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .team-slot.empty {
          opacity: 0.4;
        }
        .team-sprite {
          width: 56px;
          height: 56px;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .empty-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: rgba(255,255,255,0.3);
        }
        .team-mon-name {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }
        .action-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .action-btn:active { transform: translateY(0); }

        .quest-btn {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .pvp-btn {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .collection-btn {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .btn-icon {
          font-size: 28px;
          flex-shrink: 0;
          line-height: 1;
        }
        .btn-text {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
          flex: 1;
        }
        .btn-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.75);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
