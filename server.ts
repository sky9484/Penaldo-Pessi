import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // --- Game State & Lobby System ---
  interface Player {
    id: string;
    username: string;
  }
  
  let queue: Player[] = [];
  const activeMatches = new Map();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join Queue
    socket.on('join_queue', (username: string) => {
      // Avoid duplicate matching if already in queue
      if (queue.find(p => p.id === socket.id)) return;
      
      queue.push({ id: socket.id, username });
      socket.emit('queue_joined', queue.length);
      io.emit('update_queue_display', queue.map(p => p.username));

      // Matchmaking check
      if (queue.length >= 2) {
        const playerA = queue.shift()!;
        const playerB = queue.shift()!;
        const matchId = `match_${playerA.id}_${playerB.id}`;

        const match = {
          id: matchId,
          playerA,
          playerB,
          actions: { A: null, B: null },
        };
        
        activeMatches.set(matchId, match);
        
        // Notify both players
        io.to(playerA.id).emit('match_found', { role: 'A', opponent: playerB.username, matchId });
        io.to(playerB.id).emit('match_found', { role: 'B', opponent: playerA.username, matchId });
        
        // Notify host
        io.emit('update_queue_display', queue.map(p => p.username));
        io.emit('match_started', { playerA: playerA.username, playerB: playerB.username, matchId });
      } else {
        // Everyone in queue gets updated position
        queue.forEach((p, idx) => {
          io.to(p.id).emit('queue_position', idx + 1);
        });
      }
    });

    // Player action
    socket.on('player_action', ({ matchId, role, action }) => {
      const match = activeMatches.get(matchId);
      if (!match) return;

      if (role === 'A') match.actions.A = action;
      if (role === 'B') match.actions.B = action;

      // Both players submitted
      if (match.actions.A && match.actions.B) {
        io.emit('play_animation', { 
          matchId,
          playerAAction: match.actions.A, 
          playerBAction: match.actions.B 
        });
      }
    });

    socket.on('round_complete', ({ matchId, result }) => {
      const match = activeMatches.get(matchId);
      if (!match) return;
      
      // Cleanup match and resolve
      activeMatches.delete(matchId);
      io.to(match.playerA.id).emit('match_ended', result);
      io.to(match.playerB.id).emit('match_ended', result);
    });

    socket.on('disconnect', () => {
      queue = queue.filter(p => p.id !== socket.id);
      io.emit('update_queue_display', queue.map(p => p.username));
      
      // Notify opponents if disconnected during match
      for (const [matchId, match] of activeMatches.entries()) {
        if (match.playerA.id === socket.id || match.playerB.id === socket.id) {
           const winner = match.playerA.id === socket.id ? 'B' : 'A';
           activeMatches.delete(matchId);
           io.to(match.playerA.id).emit('match_ended', { reason: 'opponent_disconnected' });
           io.to(match.playerB.id).emit('match_ended', { reason: 'opponent_disconnected' });
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Need dist index setup here if we were doing production, but preview is handled for us typically.
    // Assuming standard static serving
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
