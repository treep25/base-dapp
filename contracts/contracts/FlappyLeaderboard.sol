// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FlappyLeaderboard {
    mapping(address => uint256) public highScores;
    address[] public players;
    mapping(address => bool) private hasPlayed;

    event ScoreUpdated(
        address indexed player,
        uint256 newScore,
        uint256 previousScore
    );

    event NewPlayer(address indexed player, uint256 initialScore);

    error ScoreNotHigher(uint256 currentScore, uint256 submittedScore);
    error ZeroScoreNotAllowed();
    error InvalidLimit();

    function submitScore(uint256 score) external {
        if (score == 0) {
            revert ZeroScoreNotAllowed();
        }
        
        uint256 currentScore = highScores[msg.sender];

        if (score <= currentScore) {
            revert ScoreNotHigher(currentScore, score);
        }

        if (!hasPlayed[msg.sender]) {
            hasPlayed[msg.sender] = true;
            players.push(msg.sender);
            emit NewPlayer(msg.sender, score);
        }

        highScores[msg.sender] = score;
        emit ScoreUpdated(msg.sender, score, currentScore);
    }

    function getPlayerScore(address player) external view returns (uint256) {
        return highScores[player];
    }

    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }

    function getTopScores(uint256 limit) 
        external 
        view 
        returns (address[] memory addresses, uint256[] memory scores) 
    {
        if (limit == 0) {
            revert InvalidLimit();
        }
        
        uint256 playerCount = players.length;
        
        if (playerCount == 0) {
            return (new address[](0), new uint256[](0));
        }
        
        uint256 resultSize = limit > playerCount ? playerCount : limit;
        
        address[] memory tempAddresses = new address[](playerCount);
        uint256[] memory tempScores = new uint256[](playerCount);
        
        for (uint256 i = 0; i < playerCount; i++) {
            tempAddresses[i] = players[i];
            tempScores[i] = highScores[players[i]];
        }
        
        for (uint256 i = 0; i < resultSize; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < playerCount; j++) {
                if (tempScores[j] > tempScores[maxIdx]) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                (tempAddresses[i], tempAddresses[maxIdx]) = (tempAddresses[maxIdx], tempAddresses[i]);
                (tempScores[i], tempScores[maxIdx]) = (tempScores[maxIdx], tempScores[i]);
            }
        }
        
        addresses = new address[](resultSize);
        scores = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            addresses[i] = tempAddresses[i];
            scores[i] = tempScores[i];
        }
        
        return (addresses, scores);
    }

    function getPlayersPage(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory addresses, uint256[] memory scores)
    {
        uint256 playerCount = players.length;
        
        if (offset >= playerCount || limit == 0) {
            return (new address[](0), new uint256[](0));
        }
        
        uint256 remaining = playerCount - offset;
        uint256 resultSize = limit > remaining ? remaining : limit;
        
        addresses = new address[](resultSize);
        scores = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            address player = players[offset + i];
            addresses[i] = player;
            scores[i] = highScores[player];
        }
        
        return (addresses, scores);
    }

    function hasPlayerPlayed(address player) external view returns (bool) {
        return hasPlayed[player];
    }
}
