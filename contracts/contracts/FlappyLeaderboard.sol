// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FlappyLeaderboard {
    mapping(address => uint256) public highScores;
    address[] public players;
    mapping(address => bool) private hasPlayed;

    address public owner;
    mapping(address => mapping(uint256 => bool)) public ownedSkins;
    mapping(uint256 => uint256) public skinPrices;

    uint256 public constant SKIN_JESSE = 1;

    event ScoreUpdated(
        address indexed player,
        uint256 newScore,
        uint256 previousScore
    );

    event NewPlayer(address indexed player, uint256 initialScore);

    event SkinPurchased(
        address indexed buyer,
        uint256 indexed skinId,
        uint256 price
    );

    error ScoreNotHigher(uint256 currentScore, uint256 submittedScore);
    error ZeroScoreNotAllowed();
    error InvalidLimit();
    error InsufficientPayment(uint256 required, uint256 sent);
    error SkinAlreadyOwned();
    error InvalidSkin();
    error WithdrawFailed();

    constructor() {
        owner = msg.sender;
        skinPrices[SKIN_JESSE] = 0.001 ether;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

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

    function buySkin(uint256 skinId) external payable {
        uint256 price = skinPrices[skinId];
        if (price == 0) {
            revert InvalidSkin();
        }
        if (ownedSkins[msg.sender][skinId]) {
            revert SkinAlreadyOwned();
        }
        if (msg.value < price) {
            revert InsufficientPayment(price, msg.value);
        }

        ownedSkins[msg.sender][skinId] = true;
        emit SkinPurchased(msg.sender, skinId, price);

        if (msg.value > price) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(success, "Refund failed");
        }
    }

    function hasSkin(address player, uint256 skinId) external view returns (bool) {
        return ownedSkins[player][skinId];
    }

    function getSkinPrice(uint256 skinId) external view returns (uint256) {
        return skinPrices[skinId];
    }

    function setSkinPrice(uint256 skinId, uint256 price) external onlyOwner {
        skinPrices[skinId] = price;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner).call{value: address(this).balance}("");
        if (!success) {
            revert WithdrawFailed();
        }
    }

    function getOwnedSkins(address player) external view returns (bool[] memory) {
        bool[] memory skins = new bool[](10);
        for (uint256 i = 0; i < 10; i++) {
            skins[i] = ownedSkins[player][i];
        }
        return skins;
    }
}
