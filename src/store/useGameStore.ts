import { create } from 'zustand';

interface GameState {
  matchState: 'lobby' | 'betting' | 'playing' | 'ended';
  playerAScore: number;
  playerBScore: number;
  currentRound: number;
  bettingPool: { A: number; Draw: number; B: number };
  isKicking: boolean;
  roundResult: 'NONE' | 'GOAL' | 'SAVE' | 'MISS';
  setMatchState: (state: 'lobby' | 'betting' | 'playing' | 'ended') => void;
  placeBet: (team: 'A' | 'Draw' | 'B', amount: number) => void;
  scoreGoal: (player: 'A' | 'B') => void;
  resetGame: () => void;
  setIsKicking: (kicking: boolean) => void;
  setRoundResult: (result: 'NONE' | 'GOAL' | 'SAVE' | 'MISS') => void;
}

export const useGameStore = create<GameState>((set) => ({
  matchState: 'lobby',
  playerAScore: 0,
  playerBScore: 0,
  currentRound: 1,
  bettingPool: { A: 0, Draw: 0, B: 0 },
  isKicking: false,
  roundResult: 'NONE',

  setMatchState: (state) => set({ matchState: state }),

  placeBet: (team, amount) =>
    set((state) => ({
      bettingPool: {
        ...state.bettingPool,
        [team]: state.bettingPool[team] + amount,
      },
    })),

  scoreGoal: (player) =>
    set((state) => ({
      playerAScore: player === 'A' ? state.playerAScore + 1 : state.playerAScore,
      playerBScore: player === 'B' ? state.playerBScore + 1 : state.playerBScore,
    })),

  resetGame: () =>
    set({
      matchState: 'lobby',
      playerAScore: 0,
      playerBScore: 0,
      currentRound: 1,
      bettingPool: { A: 0, Draw: 0, B: 0 }
    }),
  setIsKicking: (kicking) => set({ isKicking: kicking }),
  setRoundResult: (result) => set({ roundResult: result }),
}));
