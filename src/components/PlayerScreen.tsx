import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export function PlayerScreen() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [matchState, setMatchState] = useState<'login' | 'queued' | 'playing' | 'ended'>('login');
  const [username, setUsername] = useState('');
  const [queuePosition, setQueuePosition] = useState(0);
  const [matchInfo, setMatchInfo] = useState<{ role: 'A' | 'B', opponent: string, matchId: string } | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useEffect(() => {
    const s = io(); // Connects to the same host
    setSocket(s);

    s.on('queue_joined', (pos: number) => {
      setMatchState('queued');
      setQueuePosition(pos);
    });

    s.on('queue_position', (pos: number) => {
      setQueuePosition(pos);
    });

    s.on('match_found', (info) => {
      setMatchInfo(info);
      setMatchState('playing');
      setSelectedAction(null);
    });

    s.on('match_ended', (result) => {
      setMatchState('ended');
      setTimeout(() => {
        setMatchState('login'); // go back to start
      }, 3000);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (username.trim() && socket) {
      socket.emit('join_queue', username);
    }
  };

  const handleAction = (dir: string) => {
    if (socket && matchInfo && !selectedAction) {
      setSelectedAction(dir);
      socket.emit('player_action', {
        matchId: matchInfo.matchId,
        role: matchInfo.role,
        action: dir
      });
    }
  };

  if (matchState === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">Penalty Shootout</h1>
        <div className="w-full max-w-sm space-y-4">
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <button
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
            onClick={handleJoin}
            disabled={!username.trim()}
          >
            Join Queue
          </button>
        </div>
      </div>
    );
  }

  if (matchState === 'queued') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-6"></div>
        <h2 className="text-2xl font-bold text-center">Waiting for opponent...</h2>
        <p className="mt-4 text-slate-400">Your position in queue: {queuePosition}</p>
      </div>
    );
  }

  if (matchState === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <h2 className="text-3xl font-bold text-center mb-4">Match Ended</h2>
        <p className="text-slate-400">Returning to lobby...</p>
      </div>
    );
  }

  // Playing state
  const directions = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center', label: 'Center' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' }
  ];

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-slate-900 text-white p-6">
      <div className="w-full text-center py-4 bg-slate-800 rounded-xl mb-4">
        <p className="text-sm text-slate-400">You are playing as {matchInfo?.role === 'A' ? 'Striker' : 'Goalie'}</p>
        <h2 className="text-xl font-bold mt-1 text-blue-400">vs {matchInfo?.opponent}</h2>
      </div>

      <div className="flex-grow flex flex-col justify-center items-center w-full max-w-sm space-y-6">
        {!selectedAction ? (
          <>
            <h3 className="text-2xl font-semibold mb-2">Choose Direction</h3>
            <div className="w-full grid grid-cols-2 gap-4">
              <button onClick={() => handleAction('top-left')} className="p-6 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold">Top Left</button>
              <button onClick={() => handleAction('top-right')} className="p-6 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold">Top Right</button>
              <button onClick={() => handleAction('bottom-left')} className="p-6 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold">Bottom Left</button>
              <button onClick={() => handleAction('bottom-right')} className="p-6 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold">Bottom Right</button>
            </div>
            <button onClick={() => handleAction('center')} className="w-full p-6 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold">Center</button>
          </>
        ) : (
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-green-400 mb-2">Action Locked!</h3>
            <p className="text-slate-400">Waiting for {matchInfo?.opponent}...</p>
          </div>
        )}
      </div>
    </div>
  );
}
