import React, { useRef, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Web3Provider } from './components/Web3Provider';
import { BettingDashboard } from './components/BettingDashboard';
import { StadiumScene } from './components/StadiumScene';
import { KickingMechanic } from './components/KickingMechanic';
import { useGameStore } from './store/useGameStore';
import { RapierRigidBody } from '@react-three/rapier';
import { PlayerScreen } from './components/PlayerScreen';

function HostScreen() {
  const { matchState, setMatchState, playerAScore, playerBScore, roundResult } = useGameStore();
  const ballRef = useRef<RapierRigidBody>(null);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [queueQueue, setQueueQueue] = useState<string[]>([]);
  const [currentMatch, setCurrentMatch] = useState<{playerA: string, playerB: string, matchId: string} | null>(null);

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on('update_queue_display', (queueUsers: string[]) => {
      setQueueQueue(queueUsers);
    });

    s.on('match_started', (info: {playerA: string, playerB: string, matchId: string}) => {
      setCurrentMatch(info);
      setMatchState('playing');
    });

    s.on('play_animation', ({ matchId, playerAAction, playerBAction }) => {
      if (currentMatch && matchId === currentMatch.matchId) {
        // Trigger kicking mechanics from socket action
        useGameStore.getState().setIsKicking(true); 
        
        // This simulates the user click for the kicking mechanic component
        // we'll update to let the kicking mechanism know directly, or just let StadiumScene handle it
        setTimeout(() => {
          const result = useGameStore.getState().roundResult;
          s.emit('round_complete', { matchId, result });
          setCurrentMatch(null);
          setMatchState('lobby');
        }, 5000); 
      }
    });

    return () => {
      s.disconnect();
    };
  }, [currentMatch, setMatchState]);

  useEffect(() => {
    if (roundResult === 'GOAL') {
      const audio = new Audio('/goal.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio playback requires interaction:', e));
    } else if (roundResult === 'SAVE' || roundResult === 'MISS') {
      const audio = new Audio('/miss.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio playback requires interaction:', e));
    }
  }, [roundResult]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">M</div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">Monad <span className="text-indigo-400">Blitz</span></h1>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Up Next</span>
            <span className="text-sm font-medium text-white">
              {queueQueue.length === 0 ? 'Empty Queue' : queueQueue.slice(0, 3).join(', ')}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Network</span>
            <span className="text-sm font-medium flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> Monad Testnet
            </span>
          </div>
          {matchState === 'playing' && (
            <>
              <div className="h-8 w-px bg-slate-800"></div>
              <button 
                onClick={() => setMatchState('betting')}
                className="bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur text-white px-4 py-2 rounded-xl text-sm transition-colors border border-slate-600 font-medium"
              >
                ← Back to Betting
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* 3D Scene Simulation */}
        <div className="relative flex-grow bg-gradient-to-b from-slate-900 to-indigo-950 overflow-hidden">
          {/* Stadium Lighting / Atmospheric Effect */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.4),transparent)] pointer-events-none z-10"></div>
          
          {/* 3D Canvas Layer */}
          <div className="absolute inset-0">
            <StadiumScene ballRef={ballRef} />
          </div>

          {/* Scoreboard Overlay */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-2xl z-20 pointer-events-none">
            <div className="flex flex-col items-center px-6">
              <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Striker</span>
              <span className="text-2xl font-black">{currentMatch ? currentMatch.playerA : 'PLAYER A'}</span>
            </div>
            <div className="flex items-center space-x-4 px-8 border-x border-white/10">
              <span className="text-5xl font-black italic text-indigo-400">{playerAScore}</span>
              <span className="text-xl font-bold text-slate-500">VS</span>
              <span className="text-5xl font-black italic text-white">{playerBScore}</span>
            </div>
            <div className="flex flex-col items-center px-6">
              <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Keeper</span>
              <span className="text-2xl font-black">{currentMatch ? currentMatch.playerB : 'PLAYER B'}</span>
            </div>
          </div>
          
          {/* UI Interaction Overlay status */}
          <div className="absolute bottom-10 left-10 flex flex-col space-y-4 pointer-events-none z-20">
            <div className="bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 p-4 rounded-xl">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Status</div>
              <div className="text-lg font-bold uppercase">{currentMatch ? 'AWAITING ACTIONS' : 'WAITING FOR PLAYERS'}</div>
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        {(matchState === 'betting' || matchState === 'lobby') && (
          <aside className="w-[380px] bg-slate-900 border-l border-slate-800 flex flex-col z-30">
            <BettingDashboard />
          </aside>
        )}
      </main>

      {/* Gameplay Controls Footer */}
      {matchState === 'playing' && !currentMatch && (
        <KickingMechanic ballRef={ballRef} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/host" />} />
          <Route path="/host" element={<HostScreen />} />
          <Route path="/play" element={<PlayerScreen />} />
        </Routes>
      </BrowserRouter>
    </Web3Provider>
  );
}

