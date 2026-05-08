// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PredictionPool
 * @dev Prediction market for the penalty shootout on Monad Testnet
 */
contract PredictionPool {
    address public owner;
    
    uint256 public poolA;
    uint256 public poolDraw;
    uint256 public poolB;
    
    // 0 = Undecided, 1 = Team A, 2 = Draw, 3 = Team B
    uint8 public winningTeam = 0; 
    bool public isResolved = false;

    // track bets: address => teamId => amount
    mapping(address => mapping(uint8 => uint256)) public bets;

    event BetPlaced(address indexed user, uint8 teamId, uint256 amount);
    event MatchResolved(uint8 winningTeam);
    event WinningsClaimed(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Place a bet on a team (1 = A, 2 = Draw, 3 = B)
     */
    function placeBet(uint8 teamId) external payable {
        require(!isResolved, "Match already resolved");
        require(teamId >= 1 && teamId <= 3, "Invalid team ID");
        require(msg.value > 0, "Bet amount must be > 0");

        bets[msg.sender][teamId] += msg.value;

        if (teamId == 1) poolA += msg.value;
        else if (teamId == 2) poolDraw += msg.value;
        else if (teamId == 3) poolB += msg.value;

        emit BetPlaced(msg.sender, teamId, msg.value);
    }

    /**
     * @dev Resolve the match
     */
    function resolveMatch(uint8 _winningTeam) external onlyOwner {
        require(!isResolved, "Already resolved");
        require(_winningTeam >= 1 && _winningTeam <= 3, "Invalid team ID");

        winningTeam = _winningTeam;
        isResolved = true;

        emit MatchResolved(winningTeam);
    }

    /**
     * @dev Claim winnings 
     */
    function claimWinnings() external {
        require(isResolved, "Match not resolved yet");
        
        uint256 userBet = bets[msg.sender][winningTeam];
        require(userBet > 0, "No winning bets");

        // Calculate payout
        uint256 winningPoolSize = 0;
        if (winningTeam == 1) winningPoolSize = poolA;
        else if (winningTeam == 2) winningPoolSize = poolDraw;
        else if (winningTeam == 3) winningPoolSize = poolB;

        uint256 totalPool = poolA + poolDraw + poolB;

        // User gets proportional share of the total pool
        uint256 payout = (userBet * totalPool) / winningPoolSize;

        // Reset user bet to prevent double claim
        bets[msg.sender][winningTeam] = 0;

        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(msg.sender, payout);
    }
}
