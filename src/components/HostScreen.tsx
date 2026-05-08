import React, { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Web3Provider } from './Web3Provider';
import { BettingDashboard } from './BettingDashboard';
import { StadiumScene } from './StadiumScene';
import { useGameStore } from '../store/useGameStore';
import { RapierRigidBody } from '@react-three/rapier';

export function HostScreen() {
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
      setMatchState('betting');
      // After betting phase, we transition to playing internally if we want, or wait for players.
      // Easiest is to set betting then switch to playing when play_animation comes, or auto timer.
      setTimeout(() => {
        setMatchState('playing');
      }, 5000); // 5 seconds betting phase before playing
    });

    s.on('play_animation', ({ matchId, playerAAction, playerBAction }) => {
      if (currentMatch && matchId === currentMatch.matchId) {
        // Trigger the 3D Animation!
        useGameStore.getState().setIsKicking(true); // Initiate kick
        
        // Wait for kicking mechanics to finish (around 4-5 seconds based on our previous logic)
        // KickingMechanic will update roundResult "GOAL" or "SAVE". 
        // We'll hook into that in another useEffect or let it run.
        setTimeout(() => {
          // Tell server round complete
          const result = useGameStore.getState().roundResult;
          s.emit('round_complete', { matchId, result });
          setCurrentMatch(null);
          setMatchState('lobby');
        }, 5000); // Wait for animation + result
      }
    });

    return () => {
      s.disconnect();
    };
  }, [currentMatch]);

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
      {/* Header / HUD */}
      <header className="flex-none p-6 border-b border-white/10 bg-black/40 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center">
                <span className="font-bold text-white tracking-widest px-2">PS</span>
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight text-white/90">Web3 Penalty Shootout</h1>
               <div className="flex items-center gap-2 mt-1 opacity-70 text-xs tracking-wider">
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                 LIVE ON BASE SEPOLIA
               </div>
             </div>
          </div>
          
          {/* Match Score Display */}
          <div className="flex items-center gap-6 bg-slate-900/80 rounded-2xl px-6 py-2 border border-white/5 mx-auto">
             <div className="text-center">
                <p className="text-blue-400 font-medium tracking-wide text-xs mb-1 uppercase">Striker {currentMatch ? `(${currentMatch.playerA})` : ''}</p>
                <span className="text-3xl font-black">{playerAScore}</span>
             </div>
             <div className="text-slate-600 font-black text-xl mb-1">-</div>
             <div className="text-center">
                <p className="text-rose-400 font-medium tracking-wide text-xs mb-1 uppercase">Goalie {currentMatch ? `(${currentMatch.playerB})` : ''}</p>
                <span className="text-3xl font-black">{playerBScore}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Queue Display */}
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Queue ({queueQueue.length})</p>
              <div className="text-sm font-medium">
                 {queueQueue.length === 0 ? 'Empty' : queueQueue.slice(0, 3).join(', ') + (queueQueue.length > 3 ? '...' : '')}
              </div>
            </div>
            <Web3Provider />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex">
        {/* Betting Sidebar */}
        <aside className="w-[380px] h-full flex flex-col border-r border-white/5 bg-slate-900/40 backdrop-blur-md relative z-10 shrink-0">
          <BettingDashboard />
        </aside>

        {/* 3D Game View */}
        <section className="flex-1 relative bg-black">
          <div className="absolute inset-0 z-0">
             <StadiumScene ballRef={ballRef} />
          </div>
          
          {/* Visual Overlays */}
          {matchState === 'betting' && (
             <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none transition-all duration-1000">
                <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-8 max-w-md text-center shadow-2xl">
                   <h2 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      PLACE YOUR BETS
                   </h2>
                   <p className="text-slate-300 font-medium mb-6">Round phase starting soon...</p>
                   <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
                   </div>
                </div>
             </div>
          )}
          {roundResult && roundResult !== 'NONE' && (
             <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className={`px-10 py-4 rounded-xl backdrop-blur-md font-black text-4xl tracking-widest shadow-2xl border ${
                  roundResult === 'GOAL' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-rose-500/20'
                }`}>
                  {roundResult}
                </div>
             </div>
          )}
        </section>
      </main>
    </div>
  );
}
