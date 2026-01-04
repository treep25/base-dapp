// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract FlappyLeaderboard is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    uint256 public constant MAX_SCORE = 9999;
    uint256 public constant SIGNATURE_EXPIRY = 5 minutes;
    uint256 public constant SKIN_JESSE = 1;

    mapping(address => uint256) public highScores;
    address[] public players;
    mapping(address => bool) private hasPlayed;

    address public owner;
    address public pendingOwner;
    address public signerAddress;

    mapping(address => mapping(uint256 => bool)) public ownedSkins;
    mapping(bytes32 => bool) public usedNonces;

    event ScoreUpdated(
        address indexed player,
        uint256 newScore,
        uint256 previousScore
    );

    event NewPlayer(address indexed player, uint256 initialScore);

    event SkinClaimed(
        address indexed player,
        uint256 indexed skinId
    );

    event OwnershipTransferStarted(
        address indexed previousOwner,
        address indexed newOwner
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event SignerUpdated(
        address indexed previousSigner,
        address indexed newSigner
    );

    error ScoreNotHigher(uint256 currentScore, uint256 submittedScore);
    error ZeroScoreNotAllowed();
    error ScoreTooHigh(uint256 score, uint256 maxScore);
    error InvalidLimit();
    error SkinAlreadyOwned();
    error InvalidSkin();
    error InvalidSignature();
    error SignatureExpired();
    error NonceAlreadyUsed();
    error NotOwner();
    error NotPendingOwner();
    error ZeroAddress();

    constructor(address _signerAddress) {
        if (_signerAddress == address(0)) revert ZeroAddress();
        owner = msg.sender;
        signerAddress = _signerAddress;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function submitScore(
        uint256 score,
        uint256 timestamp,
        bytes32 nonce,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        if (score == 0) revert ZeroScoreNotAllowed();
        if (score > MAX_SCORE) revert ScoreTooHigh(score, MAX_SCORE);
        if (block.timestamp > timestamp + SIGNATURE_EXPIRY) revert SignatureExpired();
        if (usedNonces[nonce]) revert NonceAlreadyUsed();

        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, score, timestamp, nonce)
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedHash.recover(signature);

        if (recoveredSigner != signerAddress) revert InvalidSignature();

        usedNonces[nonce] = true;

        uint256 currentScore = highScores[msg.sender];
        if (score <= currentScore) revert ScoreNotHigher(currentScore, score);

        if (!hasPlayed[msg.sender]) {
            hasPlayed[msg.sender] = true;
            players.push(msg.sender);
            emit NewPlayer(msg.sender, score);
        }

        highScores[msg.sender] = score;
        emit ScoreUpdated(msg.sender, score, currentScore);
    }

    function claimSkin(uint256 skinId) external nonReentrant whenNotPaused {
        if (skinId == 0 || skinId > 10) revert InvalidSkin();
        if (ownedSkins[msg.sender][skinId]) revert SkinAlreadyOwned();

        ownedSkins[msg.sender][skinId] = true;
        emit SkinClaimed(msg.sender, skinId);
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
        if (limit == 0) revert InvalidLimit();

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

    function hasSkin(address player, uint256 skinId) external view returns (bool) {
        return ownedSkins[player][skinId];
    }

    function getOwnedSkins(address player) external view returns (bool[] memory) {
        bool[] memory skins = new bool[](10);
        for (uint256 i = 0; i < 10; i++) {
            skins[i] = ownedSkins[player][i + 1];
        }
        return skins;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    function setSignerAddress(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerUpdated(signerAddress, newSigner);
        signerAddress = newSigner;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
