import { expect } from "chai";
import { ethers } from "hardhat";
import { FlappyLeaderboard } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test Suite for FlappyLeaderboard Smart Contract
 * 
 * Tests cover:
 * - Score submission logic
 * - Leaderboard retrieval
 * - Edge cases and error handling
 * - Gas optimization verification
 */
describe("FlappyLeaderboard", function () {
  let leaderboard: FlappyLeaderboard;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;
  let players: SignerWithAddress[];

  beforeEach(async function () {
    // Get signers
    [owner, player1, player2, player3, ...players] = await ethers.getSigners();

    // Deploy contract
    const FlappyLeaderboard = await ethers.getContractFactory("FlappyLeaderboard");
    leaderboard = await FlappyLeaderboard.deploy();
    await leaderboard.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with zero players", async function () {
      expect(await leaderboard.getPlayerCount()).to.equal(0);
    });

    it("Should return empty arrays for top scores when no players", async function () {
      const [addresses, scores] = await leaderboard.getTopScores(10);
      expect(addresses.length).to.equal(0);
      expect(scores.length).to.equal(0);
    });
  });

  describe("Score Submission", function () {
    it("Should allow first score submission", async function () {
      await expect(leaderboard.connect(player1).submitScore(100))
        .to.emit(leaderboard, "NewPlayer")
        .withArgs(player1.address, 100)
        .and.to.emit(leaderboard, "ScoreUpdated")
        .withArgs(player1.address, 100, 0);

      expect(await leaderboard.getPlayerScore(player1.address)).to.equal(100);
      expect(await leaderboard.getPlayerCount()).to.equal(1);
    });

    it("Should update score when new score is higher", async function () {
      await leaderboard.connect(player1).submitScore(100);
      
      await expect(leaderboard.connect(player1).submitScore(200))
        .to.emit(leaderboard, "ScoreUpdated")
        .withArgs(player1.address, 200, 100);

      expect(await leaderboard.getPlayerScore(player1.address)).to.equal(200);
      // Player count should remain 1
      expect(await leaderboard.getPlayerCount()).to.equal(1);
    });

    it("Should reject score that is not higher than current", async function () {
      await leaderboard.connect(player1).submitScore(100);

      await expect(leaderboard.connect(player1).submitScore(50))
        .to.be.revertedWithCustomError(leaderboard, "ScoreNotHigher")
        .withArgs(100, 50);
    });

    it("Should reject equal score", async function () {
      await leaderboard.connect(player1).submitScore(100);

      await expect(leaderboard.connect(player1).submitScore(100))
        .to.be.revertedWithCustomError(leaderboard, "ScoreNotHigher")
        .withArgs(100, 100);
    });

    it("Should reject zero score", async function () {
      await expect(leaderboard.connect(player1).submitScore(0))
        .to.be.revertedWithCustomError(leaderboard, "ZeroScoreNotAllowed");
    });

    it("Should handle multiple players independently", async function () {
      await leaderboard.connect(player1).submitScore(100);
      await leaderboard.connect(player2).submitScore(200);
      await leaderboard.connect(player3).submitScore(150);

      expect(await leaderboard.getPlayerScore(player1.address)).to.equal(100);
      expect(await leaderboard.getPlayerScore(player2.address)).to.equal(200);
      expect(await leaderboard.getPlayerScore(player3.address)).to.equal(150);
      expect(await leaderboard.getPlayerCount()).to.equal(3);
    });
  });

  describe("Leaderboard Retrieval", function () {
    beforeEach(async function () {
      // Setup: Create leaderboard with multiple players
      await leaderboard.connect(player1).submitScore(100);
      await leaderboard.connect(player2).submitScore(300);
      await leaderboard.connect(player3).submitScore(200);
    });

    it("Should return top scores in descending order", async function () {
      const [addresses, scores] = await leaderboard.getTopScores(10);

      expect(addresses.length).to.equal(3);
      expect(scores.length).to.equal(3);

      // Verify descending order
      expect(addresses[0]).to.equal(player2.address);
      expect(scores[0]).to.equal(300);

      expect(addresses[1]).to.equal(player3.address);
      expect(scores[1]).to.equal(200);

      expect(addresses[2]).to.equal(player1.address);
      expect(scores[2]).to.equal(100);
    });

    it("Should limit results to requested count", async function () {
      const [addresses, scores] = await leaderboard.getTopScores(2);

      expect(addresses.length).to.equal(2);
      expect(scores.length).to.equal(2);

      // Only top 2
      expect(scores[0]).to.equal(300);
      expect(scores[1]).to.equal(200);
    });

    it("Should handle limit larger than player count", async function () {
      const [addresses, scores] = await leaderboard.getTopScores(100);

      expect(addresses.length).to.equal(3);
      expect(scores.length).to.equal(3);
    });

    it("Should revert with InvalidLimit for zero limit", async function () {
      await expect(leaderboard.getTopScores(0))
        .to.be.revertedWithCustomError(leaderboard, "InvalidLimit");
    });
  });

  describe("Pagination", function () {
    beforeEach(async function () {
      // Add 5 players
      for (let i = 0; i < 5; i++) {
        await leaderboard.connect(players[i]).submitScore((i + 1) * 100);
      }
    });

    it("Should return correct page of players", async function () {
      const [addresses, scores] = await leaderboard.getPlayersPage(0, 3);

      expect(addresses.length).to.equal(3);
      expect(scores.length).to.equal(3);
    });

    it("Should handle offset correctly", async function () {
      const [addresses1, ] = await leaderboard.getPlayersPage(0, 2);
      const [addresses2, ] = await leaderboard.getPlayersPage(2, 2);

      // No overlap
      expect(addresses1[0]).to.not.equal(addresses2[0]);
      expect(addresses1[1]).to.not.equal(addresses2[1]);
    });

    it("Should handle offset beyond player count", async function () {
      const [addresses, scores] = await leaderboard.getPlayersPage(100, 10);

      expect(addresses.length).to.equal(0);
      expect(scores.length).to.equal(0);
    });

    it("Should handle partial last page", async function () {
      const [addresses, scores] = await leaderboard.getPlayersPage(3, 10);

      expect(addresses.length).to.equal(2); // Only 2 remaining
      expect(scores.length).to.equal(2);
    });
  });

  describe("Player Status", function () {
    it("Should return false for player who never played", async function () {
      expect(await leaderboard.hasPlayerPlayed(player1.address)).to.equal(false);
    });

    it("Should return true after first score submission", async function () {
      await leaderboard.connect(player1).submitScore(100);
      expect(await leaderboard.hasPlayerPlayed(player1.address)).to.equal(true);
    });

    it("Should return zero score for player who never played", async function () {
      expect(await leaderboard.getPlayerScore(player1.address)).to.equal(0);
    });
  });

  describe("Gas Optimization", function () {
    it("Should not add duplicate player entries", async function () {
      await leaderboard.connect(player1).submitScore(100);
      await leaderboard.connect(player1).submitScore(200);
      await leaderboard.connect(player1).submitScore(300);

      // Player count should still be 1
      expect(await leaderboard.getPlayerCount()).to.equal(1);

      // Only one entry in players array
      const [addresses, ] = await leaderboard.getTopScores(10);
      expect(addresses.length).to.equal(1);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very large scores", async function () {
      const largeScore = ethers.parseUnits("1", 77); // Very large number
      await leaderboard.connect(player1).submitScore(largeScore);
      expect(await leaderboard.getPlayerScore(player1.address)).to.equal(largeScore);
    });

    it("Should handle many players", async function () {
      // Add 10 players
      for (let i = 0; i < 10; i++) {
        await leaderboard.connect(players[i]).submitScore((i + 1) * 10);
      }

      expect(await leaderboard.getPlayerCount()).to.equal(10);

      const [, scores] = await leaderboard.getTopScores(5);
      expect(scores[0]).to.equal(100); // Highest score
      expect(scores[4]).to.equal(60);  // 5th highest
    });
  });
});

