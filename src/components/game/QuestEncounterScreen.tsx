'use client';

import { useEffect, useState } from 'react';
import { SPECIES } from '@/lib/game/species';
import type { SpeciesId } from '@/lib/game/types';

interface QuestEncounterScreenProps {
  teamSize: number;
  wildSpeciesId?: SpeciesId;
  catchMode?: boolean;
  catchResult?: 'caught' | 'fled' | null;
  onFight: () => void;
  onFlee: () => void;
  onCatchAttempt?: () => void;
  onSelectTeam: () => void;
}

const ALL_SPECIES: SpeciesId[] = ['chakun', 'shikun'];

export default function QuestEncounterScreen({
  teamSize,
  wildSpeciesId,
  catchMode,
  catchResult,
  onFight,
  onFlee,
  onCatchAttempt,
  onSelectTeam,
}: QuestEncounterScreenProps) {
  // Pick a random species to preview if not given
  const [previewSpecies] = useState<SpeciesId>(
    () => wildSpeciesId ?? ALL_SPECIES[Math.floor(Math.random() * ALL_SPECIES.length)]
  );

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const sp = SPECIES[previewSpecies];

  if (catchMode) {
    return (
      <div className="quest-screen">
        <div className={`wild-mon ${animated ? 'show' : ''}`}>
          <img src={sp.frontSprite} alt={sp.name} className="wild-sprite catch-anim" />
        </div>

        {catchResult === null && (
          <>
            <div className="encounter-title">捕まえようとする！</div>
            <div className="encounter-sub">{sp.name}をゲットできるかも！</div>
            <div className="btn-row">
              <button className="action-btn catch-btn" onClick={onCatchAttempt}>
                ボールを投げる！
              </button>
              <button className="action-btn flee-btn" onClick={onFlee}>
                あきらめる
              </button>
            </div>
          </>
        )}

        {catchResult === 'caught' && (
          <>
            <div className="result-emoji">🎉</div>
            <div className="encounter-title caught-title">捕まえた！</div>
            <div className="encounter-sub">{sp.name}があなたのポケモンになった！</div>
            <button className="action-btn done-btn" onClick={onFlee}>
              つづける
            </button>
          </>
        )}

        {catchResult === 'fled' && (
          <>
            <div className="result-emoji">💨</div>
            <div className="encounter-title">逃げられた…</div>
            <div className="encounter-sub">また次回チャレンジしよう！</div>
            <button className="action-btn flee-btn" onClick={onFlee}>
              もどる
            </button>
          </>
        )}

        <style jsx>{`
          .quest-screen {
            position: fixed;
            inset: 0;
            background: linear-gradient(160deg, #0f0c29 0%, #302b63 60%, #24243e 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 32px 24px calc(32px + env(safe-area-inset-bottom));
            font-family: var(--font-m-plus-rounded, sans-serif);
            text-align: center;
          }
          .wild-mon {
            opacity: 0;
            transform: translateY(30px) scale(0.7);
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .wild-mon.show { opacity: 1; transform: translateY(0) scale(1); }
          .wild-sprite {
            width: 140px;
            height: 140px;
            object-fit: contain;
            image-rendering: pixelated;
            filter: drop-shadow(0 0 20px rgba(147,112,219,0.6));
          }
          .catch-anim {
            animation: catchBounce 0.8s ease infinite alternate;
          }
          @keyframes catchBounce {
            from { transform: translateY(0); }
            to { transform: translateY(-12px); }
          }
          .result-emoji { font-size: 64px; }
          .encounter-title {
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 12px rgba(0,0,0,0.5);
          }
          .caught-title { color: #4ade80; }
          .encounter-sub {
            font-size: 15px;
            color: rgba(255,255,255,0.65);
            line-height: 1.5;
          }
          .btn-row {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
            max-width: 320px;
          }
          .action-btn {
            padding: 15px 24px;
            border-radius: 999px;
            font-size: 17px;
            font-weight: 800;
            border: none;
            cursor: pointer;
            font-family: inherit;
            transition: transform 0.15s;
            width: 100%;
          }
          .action-btn:hover { transform: scale(1.03); }
          .catch-btn { background: linear-gradient(135deg, #f093fb, #f5576c); color: #fff; }
          .flee-btn { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15); }
          .done-btn { background: linear-gradient(135deg, #43e97b, #38f9d7); color: #0f0c29; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="quest-screen">
      {teamSize === 0 && (
        <div className="warning-banner">
          ポケモンがいません！チームを選んでください
        </div>
      )}

      <div className={`wild-mon ${animated ? 'show' : ''}`}>
        <div className="silhouette-wrap">
          <img
            src={sp.frontSprite}
            alt="野生のポケモン"
            className="wild-sprite encounter-bounce"
            style={{ filter: 'brightness(0) drop-shadow(0 0 20px rgba(147,112,219,0.8))' }}
          />
        </div>
      </div>

      <div className="encounter-title">野生の{sp.name}が現れた！</div>
      <div className="encounter-sub">どうする？</div>

      <div className="btn-row">
        <button
          className="action-btn fight-btn"
          onClick={onFight}
          disabled={teamSize === 0}
          style={{ opacity: teamSize === 0 ? 0.4 : 1, cursor: teamSize === 0 ? 'not-allowed' : 'pointer' }}
        >
          ⚔️ たたかう！
        </button>
        <button className="action-btn team-btn" onClick={onSelectTeam}>
          👥 チームを変える
        </button>
        <button className="action-btn flee-btn" onClick={onFlee}>
          💨 にげる
        </button>
      </div>

      <style jsx>{`
        .quest-screen {
          position: fixed;
          inset: 0;
          background: linear-gradient(160deg, #0f0c29 0%, #302b63 60%, #24243e 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 32px 24px calc(32px + env(safe-area-inset-bottom));
          font-family: var(--font-m-plus-rounded, sans-serif);
          text-align: center;
        }
        .warning-banner {
          background: rgba(248,113,113,0.2);
          border: 1px solid rgba(248,113,113,0.4);
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          color: #fca5a5;
          width: 100%;
          max-width: 320px;
        }
        .wild-mon {
          opacity: 0;
          transform: translateY(30px) scale(0.7);
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .wild-mon.show { opacity: 1; transform: translateY(0) scale(1); }
        .silhouette-wrap { position: relative; }
        .wild-sprite {
          width: 140px;
          height: 140px;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .encounter-bounce {
          animation: eBounce 1.2s ease-in-out infinite alternate;
        }
        @keyframes eBounce {
          from { transform: translateY(0) rotate(-3deg); }
          to { transform: translateY(-10px) rotate(3deg); }
        }
        .encounter-title {
          font-size: 26px;
          font-weight: 900;
          color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }
        .encounter-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.65);
        }
        .btn-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 320px;
        }
        .action-btn {
          padding: 15px 24px;
          border-radius: 999px;
          font-size: 17px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.15s;
          width: 100%;
        }
        .action-btn:hover:not(:disabled) { transform: scale(1.03); }
        .fight-btn { background: linear-gradient(135deg, #f093fb, #f5576c); color: #fff; }
        .team-btn { background: linear-gradient(135deg, #4facfe, #00f2fe); color: #0f0c29; }
        .flee-btn { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}
