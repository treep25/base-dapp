# Flappy Bird Base Mini App

A Web3-enabled Flappy Bird game with an on-chain leaderboard, built as a Base Mini App.

![Base](https://img.shields.io/badge/Built%20on-Base-0052FF?style=flat-square)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Phaser](https://img.shields.io/badge/Phaser-3.70-orange?style=flat-square)

## What is this?

This is a **Base Mini App** - a web application that runs inside the Base social app. It features:

- **Playable Flappy Bird game** - Built with Phaser 3 game engine
- **On-chain leaderboard** - Scores are stored on Base blockchain
- **Smart Wallet integration** - Connect via Coinbase Smart Wallet
- **Mobile-first design** - Optimized for the Base app experience

### About Base Mini Apps

Base Mini Apps are web applications embedded inside the Base social app. They use the Smart Wallet API to connect with users' wallets and sign transactions directly inside Base.

Learn more:
- [Base Mini Apps Overview](https://docs.base.org/build/mini-apps/introduction/overview)
- [Base Developer Docs](https://base.org/build)

## Project Structure

```
baseapp/
├── contracts/                    # Hardhat project (Solidity)
│   ├── contracts/
│   │   └── FlappyLeaderboard.sol # Smart contract
│   ├── test/
│   │   └── FlappyLeaderboard.test.ts
│   ├── scripts/
│   │   └── deploy.ts
│   └── hardhat.config.ts
│
├── frontend/                     # React + Phaser app
│   ├── src/
│   │   ├── game/                 # Phaser game code
│   │   ├── components/           # React UI components
│   │   ├── hooks/                # Web3 hooks
│   │   ├── config/               # wagmi & contract config
│   │   └── App.tsx
│   └── public/
│       └── manifest.json         # Mini App manifest
│
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd baseapp

# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Local Development

#### Start the Smart Contract (Terminal 1)

```bash
cd contracts

# Start local Hardhat node
npm run node

# In another terminal, deploy the contract
npm run deploy:local
```

Copy the deployed contract address and update `frontend/src/config/contract.ts`:

```typescript
31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
```

#### Start the Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### 3. Play the Game

1. Click anywhere or press SPACE to make the bird jump
2. Avoid the pipes
3. Connect your wallet to submit scores
4. Compete on the on-chain leaderboard!

## Smart Contract

### FlappyLeaderboard.sol

The contract stores player high scores on-chain with the following features:

- **submitScore(uint256 score)** - Submit a new score (only records if higher than current)
- **getTopScores(uint256 limit)** - Get the top N players and scores
- **getPlayerScore(address player)** - Get a specific player's high score
- **getPlayerCount()** - Total number of players

### Running Tests

```bash
cd contracts
npm test
```

### Deployment

#### Base Sepolia (Testnet)

```bash
cd contracts

# Set environment variables
export PRIVATE_KEY="your-private-key"
export BASESCAN_API_KEY="your-basescan-api-key"

# Deploy
npm run deploy:base-sepolia
```

#### Base Mainnet

```bash
npm run deploy:base-mainnet
```

After deployment:
1. Copy the contract address
2. Update `frontend/src/config/contract.ts` with the new address
3. The ABI is already in `frontend/src/abi/FlappyLeaderboard.json`

## Frontend

### Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Phaser 3** - Game engine
- **wagmi + viem** - Web3 integration
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Key Components

| Component | Description |
|-----------|-------------|
| `GameContainer` | Phaser game wrapper |
| `WalletButton` | Wallet connection UI |
| `Leaderboard` | On-chain leaderboard display |
| `SubmitScore` | Score submission modal |

### Web3 Hooks

| Hook | Description |
|------|-------------|
| `useSubmitScore` | Submit score transaction |
| `useLeaderboard` | Fetch top scores |
| `usePlayerScore` | Get current player's score |

### Building for Production

```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`.

## Deploying as a Mini App

### 1. Deploy Frontend

Deploy the `frontend/dist/` folder to any static hosting:
- Vercel
- Netlify
- IPFS
- Any CDN

### 2. Update Manifest

Edit `frontend/public/manifest.json` with your production URLs:

```json
{
  "name": "Flappy Bird",
  "homeUrl": "https://your-app-url.com",
  "iconUrl": "https://your-app-url.com/favicon.svg"
}
```

### 3. Register Mini App

Follow the [Base Mini App registration guide](https://docs.base.org/build/mini-apps/introduction/overview) to register your app in the Base ecosystem.

## Environment Variables

### Contracts

Create a `.env` file in the `contracts/` directory:

```env
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key
```

### Frontend

The frontend uses public RPC endpoints by default. For production, consider using:
- [Alchemy](https://www.alchemy.com/)
- [Infura](https://infura.io/)
- [QuickNode](https://www.quicknode.com/)

## Game Mechanics

### Controls
- **Click/Tap** - Bird jumps
- **Spacebar** - Bird jumps (keyboard)

### Scoring
- +1 point for each pipe passed
- Score is saved locally
- Submit to blockchain for permanent record

### Physics
- Gravity: 800 units/s²
- Jump velocity: -300 units/s
- Pipe speed: 200 units/s
- Pipe gap: 120 units

## Customization

### Adding Custom Sprites

Place your assets in `frontend/public/assets/`:
- `bird.png` - Bird sprite (32x32)
- `pipe.png` - Pipe texture
- `background.png` - Background image

Update the texture loading in `MenuScene.ts`.

### Modifying Game Difficulty

Edit `frontend/src/game/config.ts`:

```typescript
export const GRAVITY = 800;        // Increase = harder
export const JUMP_VELOCITY = -300; // Decrease (more negative) = higher jump
export const PIPE_SPEED = 200;     // Increase = harder
export const PIPE_GAP = 120;       // Decrease = harder
```

## Security Considerations

### Smart Contract
- Only higher scores are recorded (prevents spam)
- No admin functions (fully decentralized)
- Gas-optimized for Base L2

### Frontend
- No private keys stored
- All transactions require user signature
- Uses official wagmi/viem libraries

## License

MIT License - feel free to use this as a template for your own Base Mini Apps!

## Resources

- [Base Documentation](https://docs.base.org)
- [Mini Apps Guide](https://docs.base.org/build/mini-apps/introduction/overview)
- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [wagmi Documentation](https://wagmi.sh/)
- [Hardhat Documentation](https://hardhat.org/docs)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with love for the Base ecosystem.

