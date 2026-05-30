'use client';

import { useState, useEffect, useCallback } from 'react';
import { initNewPlayer, getGameSave, saveTeam, getAllPokemon, addPokemon } from '@/lib/game/gameDb';
import { buildBattleState, createWildBattleMon, cpuPickMove } from '@/lib/game/battle';
import { generateWildMon } from '@/lib/game/species';
import type { OwnedPokemon, BattleState, MoveId, SpeciesId } from '@/lib/game/types';
import GameHome from './GameHome';
import BattleScreen from './BattleScreen';
import CollectionScreen from './CollectionScreen';
import TeamSelectScreen from './TeamSelectScreen';
import QuestEncounterScreen from './QuestEncounterScreen';

type Screen =
  | 'home'
  | 'collection'
  | 'team-select'
  | 'quest'
  | 'pvp-setup'
  | 'battle'
  | 'catch-attempt';

export default function GameApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [allPokemon, setAllPokemon] = useState<OwnedPokemon[]>([]);
  const [team, setTeam] = useState<number[]>([]); // OwnedPokemon IDs
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [battleMode, setBattleMode] = useState<'quest' | 'pvp'>('quest');
  const [wildMon, setWildMon] = useState<OwnedPokemon | null>(null);
  const [catchResult, setCatchResult] = useState<'caught' | 'fled' | null>(null);

  const refresh = useCallback(async () => {
    await initNewPlayer();
    const [save, pokemon] = await Promise.all([getGameSave(), getAllPokemon()]);
    setTeam(save.team);
    setAllPokemon(pokemon);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const teamPokemon = team
    .map(id => allPokemon.find(p => p.id === id))
    .filter((p): p is OwnedPokemon => !!p);

  // ── Quest start ──────────────────────────────────────────────
  const startQuest = () => {
    setScreen('quest');
  };

  const handleQuestFight = () => {
    if (teamPokemon.length === 0) return;
    const wild = generateWildMon();
    setWildMon(wild);
    const wildBattle = [{ ...wild, id: undefined }];
    const state = buildBattleState('quest', teamPokemon, wildBattle);
    // CPU picks move immediately for quest
    const cpuMon = state.p2Team[state.p2ActiveIndex];
    const cpuMove = cpuPickMove(cpuMon);
    const stateWithCpuMove: BattleState = { ...state, p2SelectedMove: cpuMove };
    setBattleState(stateWithCpuMove);
    setBattleMode('quest');
    setScreen('battle');
  };

  // ── PvP start ────────────────────────────────────────────────
  const startPvp = () => {
    setScreen('team-select');
    setBattleMode('pvp');
  };

  // ── Team select confirm ──────────────────────────────────────
  const handleTeamConfirm = async (newTeam: number[]) => {
    await saveTeam(newTeam);
    setTeam(newTeam);
    if (battleMode === 'quest') {
      setScreen('quest');
    } else {
      // PvP: both players use same team (simple implementation)
      const newTeamPokemon = newTeam
        .map(id => allPokemon.find(p => p.id === id))
        .filter((p): p is OwnedPokemon => !!p);
      const state = buildBattleState('pvp', newTeamPokemon, newTeamPokemon);
      setBattleState(state);
      setScreen('battle');
    }
  };

  // ── Battle move select ───────────────────────────────────────
  const handleMoveSelect = useCallback((move: MoveId) => {
    setBattleState(prev => {
      if (!prev) return prev;
      if (prev.phase === 'p1-select') {
        if (prev.mode === 'quest') {
          // Auto-pick CPU move
          const cpuMon = prev.p2Team[prev.p2ActiveIndex];
          const cpuMove = cpuPickMove(cpuMon);
          return { ...prev, p1SelectedMove: move, p2SelectedMove: cpuMove, phase: 'resolving' };
        }
        return { ...prev, p1SelectedMove: move, phase: 'handoff' };
      }
      if (prev.phase === 'p2-select') {
        return { ...prev, p2SelectedMove: move, phase: 'resolving' };
      }
      return prev;
    });
  }, []);

  // ── Handoff confirm ──────────────────────────────────────────
  const handleHandoffConfirm = useCallback(() => {
    setBattleState(prev => {
      if (!prev) return prev;
      return { ...prev, phase: 'p2-select' };
    });
  }, []);

  // ── Next turn (resolve) ──────────────────────────────────────
  const handleNextTurn = useCallback(() => {
    setBattleState(prev => {
      if (!prev) return prev;
      if (prev.phase === 'resolving') {
        if (prev.winner) {
          return { ...prev, phase: 'ended' };
        }
        // Prepare next turn
        const next: BattleState = { ...prev, phase: 'p1-select', log: [], p1SelectedMove: null, p2SelectedMove: null };
        if (next.mode === 'quest') {
          // Pre-pick CPU move for next turn
          const cpuMon = next.p2Team[next.p2ActiveIndex];
          const cpuMove = cpuPickMove(cpuMon);
          return { ...next, p2SelectedMove: cpuMove };
        }
        return next;
      }
      return prev;
    });
  }, []);

  // ── Switch Pokemon ───────────────────────────────────────────
  const handleSwitchPokemon = useCallback((index: number) => {
    setBattleState(prev => {
      if (!prev) return prev;
      if (prev.phase === 'p1-fainted') {
        const next: BattleState = { ...prev, p1ActiveIndex: index, phase: 'resolving' };
        if (next.mode === 'quest') {
          // Also let CPU pick move
          const cpuMon = next.p2Team[next.p2ActiveIndex];
          const cpuMove = cpuPickMove(cpuMon);
          return { ...next, p2SelectedMove: cpuMove };
        }
        return next;
      }
      return prev;
    });
  }, []);

  // ── End battle ───────────────────────────────────────────────
  const handleEndBattle = useCallback(async () => {
    if (!battleState) {
      setScreen('home');
      return;
    }
    const won = battleState.winner === 'p1';
    if (battleMode === 'quest' && won && wildMon) {
      setCatchResult(null);
      setScreen('catch-attempt');
    } else {
      setBattleState(null);
      setScreen('home');
    }
  }, [battleState, battleMode, wildMon]);

  // ── Catch attempt ────────────────────────────────────────────
  const handleCatchAttempt = async () => {
    if (!wildMon) {
      setScreen('home');
      return;
    }
    const caught = Math.random() < 0.5;
    if (caught) {
      const newId = await addPokemon({ speciesId: wildMon.speciesId, ivs: wildMon.ivs });
      setCatchResult('caught');
      await refresh();
      // Auto-add to team if space
      const save = await getGameSave();
      if (save.team.length < 3) {
        await saveTeam([...save.team, newId]);
        setTeam([...save.team, newId]);
      }
    } else {
      setCatchResult('fled');
    }
  };

  const handleCatchDone = () => {
    setBattleState(null);
    setWildMon(null);
    setCatchResult(null);
    setScreen('home');
  };

  // ── Render ───────────────────────────────────────────────────
  if (screen === 'home') {
    return (
      <GameHome
        team={teamPokemon}
        onQuest={startQuest}
        onPvp={startPvp}
        onCollection={() => setScreen('collection')}
      />
    );
  }

  if (screen === 'collection') {
    return (
      <CollectionScreen
        allPokemon={allPokemon}
        team={team}
        onTeamChange={async (newTeam) => {
          await saveTeam(newTeam);
          setTeam(newTeam);
        }}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'team-select') {
    return (
      <TeamSelectScreen
        allPokemon={allPokemon}
        currentTeam={team}
        onConfirm={handleTeamConfirm}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'quest') {
    return (
      <QuestEncounterScreen
        teamSize={teamPokemon.length}
        onFight={handleQuestFight}
        onFlee={() => setScreen('home')}
        onSelectTeam={() => { setBattleMode('quest'); setScreen('team-select'); }}
      />
    );
  }

  if (screen === 'catch-attempt') {
    return (
      <QuestEncounterScreen
        teamSize={teamPokemon.length}
        wildSpeciesId={wildMon?.speciesId}
        catchMode
        catchResult={catchResult}
        onCatchAttempt={handleCatchAttempt}
        onFlee={handleCatchDone}
        onFight={handleQuestFight}
        onSelectTeam={() => setScreen('team-select')}
      />
    );
  }

  if (screen === 'battle' && battleState) {
    return (
      <BattleScreen
        battleState={battleState}
        onBattleStateChange={setBattleState}
        onMoveSelect={handleMoveSelect}
        onHandoffConfirm={handleHandoffConfirm}
        onNextTurn={handleNextTurn}
        onSwitchPokemon={handleSwitchPokemon}
        onEndBattle={handleEndBattle}
      />
    );
  }

  return (
    <GameHome
      team={teamPokemon}
      onQuest={startQuest}
      onPvp={startPvp}
      onCollection={() => setScreen('collection')}
    />
  );
}
