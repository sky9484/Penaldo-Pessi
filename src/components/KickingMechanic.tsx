import React, { useRef } from 'react';
import { RapierRigidBody } from '@react-three/rapier';

import { useGameStore } from '../store/useGameStore';

interface KickingMechanicProps {
  ballRef: React.RefObject<RapierRigidBody | null>;
  onKickCallback?: () => void;
}

export function KickingMechanic({ ballRef, onKickCallback }: KickingMechanicProps) {
  const { setIsKicking } = useGameStore();
  
  const kickBall = (targetX: number, targetY: number) => {
    if (!ballRef.current) return;
    
    // Start kickoff animation
    setIsKicking(true);

    // Delay actual physics impulse to sync with leg swing and run-up
    setTimeout(() => {
      if (!ballRef.current) return;
      
      // Wake up the rigid body if it's sleeping
      ballRef.current.wakeUp();

      // Standard impulse strength baseline
      const power = 15;
      const forwardImpulse = -18; // Kick along negative Z axis towards goal

      // Apply the impulse calculations
      ballRef.current.applyImpulse({
        x: targetX * 5, // horizontal spread
        y: targetY * 4, // vertical lift
        z: forwardImpulse
      }, true);
      
      // Add some spin for realism (torque)
      ballRef.current.applyTorqueImpulse({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1
      }, true);

      if (onKickCallback) onKickCallback();
      
      // Reset kicking animation state after follow-through
      setTimeout(() => setIsKicking(false), 800);
      
      // Resolve the kick outcome after a short delay
      setTimeout(() => {
        const state = useGameStore.getState();
        if (state.roundResult === 'NONE') {
           useGameStore.getState().setRoundResult('SAVE'); // Miss or save
        }
      }, 3500); // Wait 3.5s to see if it entered the goal
    }, 600); // 600ms run up + wind up time
  };

  const resetBall = () => {
    if (!ballRef.current) return;
    useGameStore.getState().setRoundResult('NONE');
    ballRef.current.setTranslation({ x: 0, y: 0.5, z: 4 }, true);
    ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  return (
    <footer className="h-24 bg-slate-900 border-t border-slate-800 flex items-center px-8 space-x-8 z-30 relative pointer-events-auto">
      <div className="flex-shrink-0">
        <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Strike Direction</span>
        <div className="flex space-x-2">
          <button onClick={() => kickBall(-1, 1)} className="w-12 h-12 rounded-lg border-2 border-slate-700 flex items-center justify-center hover:bg-indigo-600 transition-all font-black">↖</button>
          <button onClick={() => kickBall(0, 1)} className="w-12 h-12 rounded-lg border-2 border-slate-700 flex items-center justify-center hover:bg-indigo-600 transition-all font-black">↑</button>
          <button onClick={() => kickBall(1, 1)} className="w-12 h-12 rounded-lg border-2 border-slate-700 flex items-center justify-center hover:bg-indigo-600 transition-all font-black">↗</button>
          <button onClick={() => kickBall(-1.2, 0.2)} className="w-12 h-12 rounded-lg border-2 border-slate-700 flex items-center justify-center hover:bg-indigo-600 transition-all font-black">↙</button>
          <button onClick={() => kickBall(0, 0.4)} className="w-12 h-12 rounded-lg border-2 border-slate-700 flex items-center justify-center hover:bg-indigo-600 text-[10px] transition-all font-black" title="Panenka">PAN</button>
          <button onClick={() => kickBall(1.2, 0.2)} className="w-12 h-12 rounded-lg border-2 border-slate-700 flex items-center justify-center hover:bg-indigo-600 transition-all font-black">↘</button>
        </div>
      </div>
      <div className="flex-1"></div>
      <div className="flex items-center space-x-4">
        <button onClick={resetBall} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-12 py-4 rounded-xl shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-sm transition-transform active:scale-95">
          Reset Ball
        </button>
      </div>
    </footer>
  );
}
