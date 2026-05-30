'use client';

import { useState } from 'react';
import { SPECIES, calcStats } from '@/lib/game/species';
import type { OwnedPokemon } from '@/lib/game/types';

interface TeamSelectScreenProps {
  allPokemon: OwnedPokemon[];
  currentTeam: number[];
  onConfirm: (team: number[]) => void;
  onBack: () => void;
}

export default function TeamSelectScreen({
  allPokemon,
  currentTeam,
  onConfirm,
  onBack,
}: TeamSelectScreenProps) {
  const [selected, setSelected] = useState<number[]>(currentTeam.slice(0, 3));

  const toggle = (id: number) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSelected(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= selected.length - 1) return;
    setSelected(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const removeFromSlot = (index: number) => {
    setSelected(prev => prev.filter((_, i) => i !== index));
  };

  const canConfirm = selected.length === 3;

  return (
    <div className="team-select-screen">
      <div className="ts-header">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <div className="ts-title">チームを選ぶ</div>
        <div className="ts-count">{selected.length}/3</div>
      </div>

      {/* Selected slots */}
      <div className="selected-slots">
        {[0, 1, 2].map(i => {
          const id = selected[i];
          const mon = id ? allPokemon.find(p => p.id === id) : undefined;
          return (
            <div key={i} className={`slot ${mon ? 'filled' : 'empty'}`}>
              {mon ? (
                <>
                  <img
                    src={SPECIES[mon.speciesId].frontSprite}
                    alt={mon.nickname ?? SPECIES[mon.speciesId].name}
                    className="slot-sprite"
                  />
                  <div className="slot-name">{mon.nickname ?? SPECIES[mon.speciesId].name}</div>
                  <div className="slot-controls">
                    <button className="slot-ctrl" onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
                    <button className="slot-ctrl" onClick={() => moveDown(i)} disabled={i >= selected.length - 1}>↓</button>
                    <button className="slot-ctrl remove" onClick={() => removeFromSlot(i)}>×</button>
                  </div>
                </>
              ) : (
                <div className="slot-empty-icon">＋</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Collection list */}
      <div className="collection-list">
        <div className="list-label">ポケモンを選ぶ</div>
        {allPokemon.length === 0 && (
          <div className="empty-msg">ポケモンがいません</div>
        )}
        {allPokemon.map(mon => {
          if (!mon.id) return null;
          const sp = SPECIES[mon.speciesId];
          const stats = calcStats(mon.speciesId, mon.ivs);
          const idx = selected.indexOf(mon.id);
          const isSelected = idx !== -1;
          const isFull = selected.length >= 3 && !isSelected;
          return (
            <button
              key={mon.id}
              className={`mon-item ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}`}
              onClick={() => toggle(mon.id!)}
              disabled={isFull}
            >
              <div className="mon-rank">{isSelected ? `#${idx + 1}` : ''}</div>
              <img src={sp.frontSprite} alt={sp.name} className="mon-sprite" />
              <div className="mon-details">
                <div className="mon-name">{mon.nickname ?? sp.name}</div>
                <div className="mon-stats">
                  HP:{stats.maxHP} ATK:{stats.atk} DEF:{stats.def}
                </div>
              </div>
              {isSelected && <div className="check-icon">✓</div>}
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      <div className="confirm-wrap">
        <button
          className={`confirm-btn ${canConfirm ? 'active' : 'inactive'}`}
          onClick={() => canConfirm && onConfirm(selected)}
          disabled={!canConfirm}
        >
          {canConfirm ? 'バトル開始！' : `あと${3 - selected.length}体選ぼう`}
        </button>
      </div>

      <style jsx>{`
        .team-select-screen {
          position: fixed;
          inset: 0;
          background: linear-gradient(160deg, #0f0c29 0%, #302b63 60%, #24243e 100%);
          display: flex;
          flex-direction: column;
          font-family: var(--font-m-plus-rounded, sans-serif);
          overflow: hidden;
        }

        .ts-header {
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
        }
        .back-btn:hover { color: #fff; }
        .ts-title {
          flex: 1;
          font-size: 18px;
          font-weight: 900;
          color: #fff;
        }
        .ts-count {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.08);
          padding: 4px 10px;
          border-radius: 999px;
        }

        .selected-slots {
          display: flex;
          gap: 10px;
          padding: 14px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .slot {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 10px 6px;
          min-height: 100px;
          justify-content: center;
        }
        .slot.filled {
          border-color: rgba(74,222,128,0.35);
          background: rgba(74,222,128,0.05);
        }
        .slot-sprite {
          width: 50px;
          height: 50px;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .slot-name {
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          line-height: 1.2;
        }
        .slot-controls {
          display: flex;
          gap: 3px;
        }
        .slot-ctrl {
          font-size: 11px;
          padding: 3px 5px;
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 5px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-family: inherit;
        }
        .slot-ctrl:disabled { opacity: 0.25; cursor: default; }
        .slot-ctrl.remove { color: #f87171; background: rgba(248,113,113,0.15); }
        .slot-empty-icon {
          font-size: 24px;
          color: rgba(255,255,255,0.2);
        }

        .collection-list {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 10px 14px 0;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .list-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .empty-msg {
          font-size: 14px;
          color: rgba(255,255,255,0.4);
          text-align: center;
          padding: 20px;
        }
        .mon-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: background 0.15s;
          width: 100%;
        }
        .mon-item.selected {
          background: rgba(74,222,128,0.08);
          border-color: rgba(74,222,128,0.35);
        }
        .mon-item.disabled { opacity: 0.35; cursor: not-allowed; }
        .mon-item:hover:not(.disabled) { background: rgba(255,255,255,0.1); }

        .mon-rank {
          font-size: 12px;
          font-weight: 800;
          color: #4ade80;
          min-width: 20px;
          text-align: center;
        }
        .mon-sprite {
          width: 44px;
          height: 44px;
          object-fit: contain;
          image-rendering: pixelated;
          flex-shrink: 0;
        }
        .mon-details { flex: 1; min-width: 0; }
        .mon-name { font-size: 15px; font-weight: 800; color: #fff; }
        .mon-stats { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }
        .check-icon { font-size: 18px; color: #4ade80; font-weight: 900; flex-shrink: 0; }

        .confirm-wrap {
          padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
          flex-shrink: 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .confirm-btn {
          width: 100%;
          padding: 16px;
          border-radius: 18px;
          font-size: 17px;
          font-weight: 900;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.15s, opacity 0.15s;
        }
        .confirm-btn.active {
          background: linear-gradient(135deg, #f093fb, #f5576c);
          color: #fff;
          box-shadow: 0 6px 20px rgba(240,147,251,0.35);
        }
        .confirm-btn.active:hover { transform: scale(1.02); }
        .confirm-btn.inactive {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.35);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
