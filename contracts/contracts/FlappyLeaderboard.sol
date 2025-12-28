// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FlappyLeaderboard
 * @author Base Mini App Developer
 * @notice On-chain leaderboard for Flappy Bird game on Base network
 * @dev This contract stores player high scores and provides leaderboard functionality.
 * 
 * Key Features:
 * - Players can submit scores, but only higher scores are recorded
 * - Gas-optimized for frequent reads and occasional writes
 * - Supports top-N leaderboard queries
 * 
 * Integration with Base Mini Apps:
 * - Connect via Smart Wallet API
 * - Use wagmi/viem for transaction signing
 * - Scores are immutably stored on Base L2
 */
contract FlappyLeaderboard {
    // ============ State Variables ============
    
    /// @notice Mapping of player address to their highest score
    mapping(address => uint256) public highScores;
    
    /// @notice Array of all players who have submitted scores
    address[] public players;
    
    /// @notice Mapping to check if a player has already played (for gas optimization)
    mapping(address => bool) private hasPlayed;
    
    // ============ Events ============
    
    /// @notice Emitted when a player's score is updated
    /// @param player The address of the player
    /// @param newScore The new high score
    /// @param previousScore The previous high score (0 if first submission)
    event ScoreUpdated(
        address indexed player,
        uint256 newScore,
        uint256 previousScore
    );
    
    /// @notice Emitted when a new player joins the leaderboard
    /// @param player The address of the new player
    /// @param initialScore Their first score
    event NewPlayer(address indexed player, uint256 initialScore);
    
    // ============ Errors ============
    
    /// @notice Thrown when submitted score is not higher than current high score
    error ScoreNotHigher(uint256 currentScore, uint256 submittedScore);
    
    /// @notice Thrown when score is zero
    error ZeroScoreNotAllowed();
    
    /// @notice Thrown when limit parameter is zero
    error InvalidLimit();
    
    // ============ External Functions ============
    
    /**
     * @notice Submit a new score to the leaderboard
     * @dev Only records the score if it's higher than the player's current high score
     * @param score The score to submit (must be > 0 and > current high score)
     * 
     * Gas Optimization:
     * - Early return if score is not higher (saves gas on failed attempts)
     * - Uses custom errors instead of require strings
     * - Minimal storage operations
     */
    function submitScore(uint256 score) external {
        // Validate score is not zero
        if (score == 0) {
            revert ZeroScoreNotAllowed();
        }
        
        uint256 currentScore = highScores[msg.sender];
        
        // Only update if new score is higher
        if (score <= currentScore) {
            revert ScoreNotHigher(currentScore, score);
        }
        
        // Check if this is a new player
        if (!hasPlayed[msg.sender]) {
            hasPlayed[msg.sender] = true;
            players.push(msg.sender);
            emit NewPlayer(msg.sender, score);
        }
        
        // Update the high score
        highScores[msg.sender] = score;
        
        emit ScoreUpdated(msg.sender, score, currentScore);
    }
    
    /**
     * @notice Get the high score for a specific player
     * @param player The address of the player
     * @return The player's high score (0 if never played)
     */
    function getPlayerScore(address player) external view returns (uint256) {
        return highScores[player];
    }
    
    /**
     * @notice Get the total number of players on the leaderboard
     * @return The count of unique players
     */
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    /**
     * @notice Get the top scores from the leaderboard
     * @dev Returns sorted arrays of addresses and scores (descending by score)
     * @param limit Maximum number of results to return
     * @return addresses Array of player addresses
     * @return scores Array of corresponding scores
     * 
     * Gas Considerations:
     * - This is a view function, no gas cost when called off-chain
     * - For large leaderboards, consider pagination or off-chain indexing
     * - Sorting is done in memory to avoid storage costs
     */
    function getTopScores(uint256 limit) 
        external 
        view 
        returns (address[] memory addresses, uint256[] memory scores) 
    {
        if (limit == 0) {
            revert InvalidLimit();
        }
        
        uint256 playerCount = players.length;
        
        // If no players yet, return empty arrays
        if (playerCount == 0) {
            return (new address[](0), new uint256[](0));
        }
        
        // Determine actual result size
        uint256 resultSize = limit > playerCount ? playerCount : limit;
        
        // Create temporary arrays for sorting
        address[] memory tempAddresses = new address[](playerCount);
        uint256[] memory tempScores = new uint256[](playerCount);
        
        // Copy data to temporary arrays
        for (uint256 i = 0; i < playerCount; i++) {
            tempAddresses[i] = players[i];
            tempScores[i] = highScores[players[i]];
        }
        
        // Sort by score (descending) using simple selection sort
        // Note: For very large leaderboards, consider off-chain sorting
        for (uint256 i = 0; i < resultSize; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < playerCount; j++) {
                if (tempScores[j] > tempScores[maxIdx]) {
                    maxIdx = j;
                }
            }
            // Swap if necessary
            if (maxIdx != i) {
                (tempAddresses[i], tempAddresses[maxIdx]) = (tempAddresses[maxIdx], tempAddresses[i]);
                (tempScores[i], tempScores[maxIdx]) = (tempScores[maxIdx], tempScores[i]);
            }
        }
        
        // Create result arrays with correct size
        addresses = new address[](resultSize);
        scores = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            addresses[i] = tempAddresses[i];
            scores[i] = tempScores[i];
        }
        
        return (addresses, scores);
    }
    
    /**
     * @notice Get all players and their scores (paginated)
     * @dev Useful for building complete leaderboard UI
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return addresses Array of player addresses
     * @return scores Array of corresponding scores
     */
    function getPlayersPage(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory addresses, uint256[] memory scores)
    {
        uint256 playerCount = players.length;
        
        // Handle edge cases
        if (offset >= playerCount || limit == 0) {
            return (new address[](0), new uint256[](0));
        }
        
        // Calculate actual result size
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
    
    /**
     * @notice Check if an address has played before
     * @param player The address to check
     * @return True if the player has submitted at least one score
     */
    function hasPlayerPlayed(address player) external view returns (bool) {
        return hasPlayed[player];
    }
}

