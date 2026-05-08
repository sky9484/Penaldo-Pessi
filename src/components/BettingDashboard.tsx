import React from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { useGameStore } from '../store/useGameStore';

// Assuming the contract is deployed. We use a placeholder here for the hackathon preview.
const PREDICTION_POOL_ADDRESS = '0x1234567890123456789012345678901234567890'; // Placeholder

// Simplistic ABI for our PredictionPool
const predictionPoolABI = [
  {
    inputs: [{ internalType: 'uint8', name: 'teamId', type: 'uint8' }],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

export function BettingDashboard() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  const { bettingPool, placeBet, setMatchState } = useGameStore();
  const { writeContractAsync, isPending } = useWriteContract();

  const handleBet = async (teamId: 1 | 2 | 3, teamName: 'A' | 'Draw' | 'B') => {
    if (!isConnected) {
      alert("Please connect your wallet to Monad Testnet first!");
      return;
    }
    
    try {
      // In a real execution, we'd send real MON.
      // For this preview, we simulate the wagmi call and update local state!
      
      // await writeContractAsync({
      //   address: PREDICTION_POOL_ADDRESS,
      //   abi: predictionPoolABI,
      //   functionName: 'placeBet',
      //   args: [teamId],
      //   value: parseEther('0.1'),
      // });

      placeBet(teamName, 0.1);
      alert(`Placed 0.1 MON bet on ${teamName}`);
      
    } catch (err) {
      console.error(err);
      alert("Bet failed. Make sure you're on Monad Testnet.");
    }
  };

  const totalPool = bettingPool.A + bettingPool.Draw + bettingPool.B;

  return (
    <>
      {/* Betting Header */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg font-bold flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          Prediction Pool
        </h2>
        <p className="text-sm text-slate-400 mt-1 italic leading-relaxed">Winnings are paid out automatically on Monad after the shootout ends.</p>

        <div className="mt-4">
        {isConnected ? (
          <button 
            onClick={() => disconnect()}
            className="w-full text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Disconnect {address?.slice(0,6)}...
          </button>
        ) : (
          <button 
            onClick={() => connect({ connector: connectors[0] })}
            className="w-full text-xs bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
          >
            Connect Wallet
          </button>
        )}
        </div>
      </div>

      {/* Pool Stats */}
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total Pool</div>
            <div className="text-xl font-black text-white">{totalPool.toFixed(1)} <span className="text-xs text-indigo-400">MON</span></div>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Awaiting</div>
            <div className="text-xl font-black text-white">Bets</div>
          </div>
        </div>

        {/* Betting Options */}
        <div className="space-y-3">
          <button onClick={() => handleBet(1, 'A')} disabled={isPending} className="w-full group relative overflow-hidden bg-slate-800 hover:bg-indigo-600 transition-colors p-4 rounded-xl border border-slate-700 text-left">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">STRIKER WINS (A)</span>
              <span className="text-xs font-mono text-indigo-400 group-hover:text-white">Bet 0.1 MON</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${totalPool > 0 ? (bettingPool.A / totalPool) * 100 : 33}%` }}></div>
            </div>
          </button>

          <button onClick={() => handleBet(2, 'Draw')} disabled={isPending} className="w-full group relative overflow-hidden bg-slate-800 hover:bg-indigo-600 transition-colors p-4 rounded-xl border border-slate-700 text-left">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">DRAW / POST</span>
              <span className="text-xs font-mono text-indigo-400 group-hover:text-white">Bet 0.1 MON</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-slate-500" style={{ width: `${totalPool > 0 ? (bettingPool.Draw / totalPool) * 100 : 33}%` }}></div>
            </div>
          </button>

          <button onClick={() => handleBet(3, 'B')} disabled={isPending} className="w-full group relative overflow-hidden bg-slate-800 hover:bg-indigo-600 transition-colors p-4 rounded-xl border border-slate-700 text-left">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">GOALIE SAVE (B)</span>
              <span className="text-xs font-mono text-indigo-400 group-hover:text-white">Bet 0.1 MON</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-slate-500" style={{ width: `${totalPool > 0 ? (bettingPool.B / totalPool) * 100 : 33}%` }}></div>
            </div>
          </button>
        </div>
      </div>

      {/* Start Button */}
      <div className="mt-auto border-t border-slate-800 bg-slate-950/50 p-6">
        <button 
          onClick={() => setMatchState('playing')}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-4 rounded-xl shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-sm transition-transform active:scale-95"
        >
          Start Shootout
        </button>
      </div>
    </>
  );
}
