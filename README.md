# Encrypted Fighter NFT

A privacy-preserving NFT gaming platform that leverages Fully Homomorphic Encryption (FHE) to create fighters with encrypted attributes, enabling fair and strategic gameplay where stats remain confidential until revealed by their owners.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Why Encrypted Fighters?](#why-encrypted-fighters)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Problems Solved](#problems-solved)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Smart Contract Interaction](#smart-contract-interaction)
  - [Frontend Application](#frontend-application)
- [Development](#development)
  - [Running Tests](#running-tests)
  - [Deployment](#deployment)
  - [Available Tasks](#available-tasks)
- [Smart Contract Overview](#smart-contract-overview)
- [Security Considerations](#security-considerations)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

Encrypted Fighter NFT is a groundbreaking blockchain gaming project that combines the collectibility of NFTs with the privacy guarantees of Fully Homomorphic Encryption. Each fighter is represented as an ERC721 token with three core attributes - **agility**, **strength**, and **stamina** - that are encrypted on-chain using FHEVM technology by Zama.

Unlike traditional blockchain games where all data is publicly visible, Encrypted Fighter NFT ensures that your fighter's attributes remain private, preventing opponents from analyzing your strategy and creating a more balanced, unpredictable gaming environment.

## Key Features

### Privacy-First Gaming
- **Encrypted Attributes**: Fighter stats (agility, strength, stamina) are stored as encrypted values using FHE
- **Selective Disclosure**: Only the owner can decrypt and view their fighter's attributes
- **Granular Access Control**: Owners can grant viewing permissions to specific addresses
- **On-Chain Confidentiality**: All data remains on-chain while maintaining privacy

### Full ERC721 Compliance
- Standard NFT functionality (transfer, approve, etc.)
- ERC721 metadata support
- Enumerable ownership tracking
- Safe transfer mechanisms

### Dynamic Attribute System
- **10-Point Distribution**: Each fighter has exactly 10 points distributed across three attributes
- **Updateable Stats**: Owners can modify their fighter's attributes (useful for training/leveling)
- **Attribute Validation**: Smart contract enforces attribute ranges (0-10) and total sum constraints

### Developer-Friendly Tools
- **Hardhat Tasks**: Pre-built CLI commands for minting, viewing, updating fighters
- **TypeScript Support**: Full type safety with TypeChain
- **Comprehensive Testing**: Extensive test suite covering all functionality
- **Frontend Integration**: React-based UI with RainbowKit wallet connection

## Why Encrypted Fighters?

Traditional blockchain games suffer from a fundamental transparency problem: all game state is publicly visible. This creates several issues:

1. **Strategic Disadvantage**: Opponents can analyze your assets before battles
2. **Meta-Gaming**: Players optimize based on visible statistics, reducing diversity
3. **Front-Running**: Malicious actors can exploit visible pending transactions
4. **Lack of Surprise**: No element of uncertainty or hidden information

Encrypted Fighter NFT solves these problems by using Fully Homomorphic Encryption, allowing computations on encrypted data without revealing the underlying values. This enables:

- **Fair Competition**: Players can't scout opponent stats before matches
- **Strategic Depth**: Hidden information creates meaningful decision-making
- **Anti-Cheating**: Prevents exploitation of visible game state
- **True Ownership**: Players own their fighters with guaranteed privacy

## Technology Stack

### Blockchain & Smart Contracts
- **Solidity**: ^0.8.24 - Smart contract development
- **FHEVM**: Zama's Fully Homomorphic Encryption Virtual Machine
- **@fhevm/solidity**: ^0.8.0 - FHE libraries for Solidity
- **Hardhat**: ^2.26.0 - Development environment and testing framework
- **Ethers.js**: ^6.15.0 - Ethereum interaction library
- **TypeChain**: ^8.3.2 - TypeScript bindings for contracts

### Frontend
- **React**: ^19.1.1 - UI framework
- **TypeScript**: ~5.8.3 - Type safety
- **Vite**: ^7.1.6 - Build tool and dev server
- **RainbowKit**: ^2.2.8 - Wallet connection UI
- **Wagmi**: ^2.17.0 - React hooks for Ethereum
- **Viem**: ^2.37.6 - TypeScript interface for Ethereum
- **@tanstack/react-query**: ^5.89.0 - Data fetching and caching

### Development Tools
- **@fhevm/hardhat-plugin**: ^0.1.0 - FHE development support
- **hardhat-deploy**: ^0.11.45 - Deployment management
- **hardhat-gas-reporter**: ^2.3.0 - Gas usage analytics
- **@zama-fhe/relayer-sdk**: ^0.2.0 - Decryption oracle integration
- **Mocha + Chai**: Testing framework
- **Solhint + ESLint**: Code linting
- **Prettier**: Code formatting

### Infrastructure
- **Sepolia Testnet**: Primary deployment target
- **Infura**: RPC provider
- **Etherscan**: Contract verification

## Architecture

### Smart Contract Architecture

```
FighterNFT (ERC721 + FHE)
├── Core ERC721 Functions
│   ├── Minting & Burning
│   ├── Transfer Mechanisms
│   ├── Approval Management
│   └── Ownership Tracking
├── Encrypted Attributes
│   ├── FighterAttributes Struct
│   │   ├── euint32 agility
│   │   ├── euint32 strength
│   │   └── euint32 stamina
│   ├── Attribute Creation
│   ├── Attribute Updates
│   └── Attribute Encryption/Decryption
└── Access Control
    ├── Contract-Level Permissions
    ├── Owner Permissions
    └── Viewer Grants
```

### Data Flow

1. **Minting**: User creates encrypted input → Contract receives encrypted handles → Fighter NFT minted with encrypted attributes
2. **Viewing**: Owner requests attributes → FHEVM decrypts with user's permission → Stats revealed only to authorized viewer
3. **Updating**: Owner encrypts new values → Contract validates and updates → New encrypted attributes stored
4. **Transfer**: NFT ownership changes → Viewing permissions automatically granted to new owner

### Frontend Architecture

```
React Application
├── Wallet Integration (RainbowKit)
├── Smart Contract Interaction (Wagmi + Ethers)
├── FHE Operations (Zama Relayer SDK)
└── UI Components
    ├── Fighter Display
    ├── Attribute Management
    ├── Minting Interface
    └── Transfer Controls
```

## Problems Solved

### 1. Privacy in Blockchain Gaming
**Problem**: Traditional blockchain games expose all player data publicly, destroying strategic gameplay.
**Solution**: FHE encrypts fighter attributes on-chain, ensuring privacy while maintaining blockchain transparency and verifiability.

### 2. Front-Running and MEV Attacks
**Problem**: Visible pending transactions allow attackers to front-run strategic moves.
**Solution**: Encrypted attributes prevent attackers from extracting value from transaction ordering since they can't see the underlying stats.

### 3. Meta-Gaming and Optimization
**Problem**: When all data is visible, players converge on optimal strategies, reducing game diversity.
**Solution**: Hidden information forces players to make decisions under uncertainty, creating more varied and interesting gameplay.

### 4. Fair Competition
**Problem**: Stronger players can avoid weaker opponents by analyzing public stats.
**Solution**: Encrypted attributes ensure competitors enter matches without prior knowledge of opponent strength.

### 5. Ownership and Privacy Rights
**Problem**: Traditional NFTs force users to choose between ownership and privacy.
**Solution**: FHEVM allows users to truly own their assets with guaranteed privacy - data stays on-chain but remains encrypted.

### 6. Scalable Privacy
**Problem**: Previous privacy solutions (zero-knowledge proofs) require complex proof generation.
**Solution**: FHE provides "always encrypted" privacy without user-side proof generation complexity.

## Getting Started

### Prerequisites

- **Node.js**: >= 20.x
- **npm**: >= 7.0.0
- **Git**: Latest version
- **Wallet**: MetaMask or compatible Ethereum wallet
- **Testnet ETH**: Sepolia testnet tokens (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fighters.git
cd fighters
```

2. **Install dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd ui
npm install
cd ..
```

### Configuration

1. **Create environment file**
```bash
cp .env.example .env
```

2. **Configure environment variables**
```bash
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Infura API key for Sepolia
INFURA_API_KEY=your_infura_api_key

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

3. **Network Configuration**
The project is pre-configured for:
- **Hardhat Network**: Local development (chainId: 31337)
- **Sepolia Testnet**: Public testnet deployment (chainId: 11155111)

## Usage

### Smart Contract Interaction

#### Compile Contracts
```bash
npm run compile
```

#### Run Tests
```bash
npm test
```

#### Deploy to Sepolia
```bash
npm run deploy:sepolia
```

#### Mint a Fighter
```bash
npx hardhat fighter:mint --agility 4 --strength 3 --stamina 3 --network sepolia
```

#### View Fighter Attributes
```bash
npx hardhat fighter:attributes --tokenid 1 --network sepolia
```

#### Update Fighter Attributes
```bash
npx hardhat fighter:update --tokenid 1 --agility 2 --strength 5 --stamina 3 --network sepolia
```

#### Grant Viewer Access
```bash
npx hardhat fighter:allow --tokenid 1 --viewer 0x... --network sepolia
```

### Frontend Application

1. **Start development server**
```bash
cd ui
npm run dev
```

2. **Build for production**
```bash
npm run build
```

3. **Preview production build**
```bash
npm run preview
```

The frontend provides:
- Wallet connection via RainbowKit
- Fighter minting interface
- Attribute viewing and management
- NFT transfer functionality
- Real-time blockchain interaction

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run tests on Sepolia testnet
npm run test:sepolia
```

### Deployment

1. **Deploy to localhost**
```bash
# Terminal 1: Start local node
npm run chain

# Terminal 2: Deploy contracts
npm run deploy:localhost
```

2. **Deploy to Sepolia**
```bash
npm run deploy:sepolia
```

3. **Verify on Etherscan**
```bash
npm run verify:sepolia
```

### Available Tasks

```bash
# View all accounts
npx hardhat accounts

# Get FighterNFT contract address
npx hardhat fighter:address --network sepolia

# Mint a fighter with custom attributes
npx hardhat fighter:mint \
  --agility 5 \
  --strength 2 \
  --stamina 3 \
  --network sepolia

# View encrypted attributes (only works if you have permission)
npx hardhat fighter:attributes \
  --tokenid 1 \
  --network sepolia

# Update fighter attributes
npx hardhat fighter:update \
  --tokenid 1 \
  --agility 3 \
  --strength 4 \
  --stamina 3 \
  --network sepolia

# Grant viewing permission to another address
npx hardhat fighter:allow \
  --tokenid 1 \
  --viewer 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \
  --network sepolia
```

### Code Quality

```bash
# Lint Solidity
npm run lint:sol

# Lint TypeScript
npm run lint:ts

# Format code
npm run prettier:write

# Check formatting
npm run prettier:check
```

## Smart Contract Overview

### FighterNFT.sol

The core contract implements:

#### State Variables
- `_TOKEN_NAME`: "Encrypted Fighter"
- `_TOKEN_SYMBOL`: "eFGT"
- `_nextTokenId`: Auto-incrementing token ID counter
- `_fighterAttributes`: Mapping of tokenId to encrypted attributes

#### Core Functions

**Minting**
```solidity
function mintFighter(
    externalEuint32 agilityHandle,
    externalEuint32 strengthHandle,
    externalEuint32 staminaHandle,
    bytes calldata inputProof
) external returns (uint256 tokenId)
```

**Attribute Retrieval**
```solidity
function getEncryptedAttributes(uint256 tokenId)
    external view
    returns (euint32 agility, euint32 strength, euint32 stamina)
```

**Attribute Updates**
```solidity
function updateAttributes(
    uint256 tokenId,
    externalEuint32 agilityHandle,
    externalEuint32 strengthHandle,
    externalEuint32 staminaHandle,
    bytes calldata inputProof
) external
```

**Access Control**
```solidity
function allowViewer(uint256 tokenId, address viewer) external
```

#### Security Features
- **Input Validation**: Ensures attribute values are within acceptable ranges
- **Permission Checks**: Only owners/approved addresses can modify fighters
- **Encryption**: All attributes stored as encrypted euint32 values
- **Access Control Lists**: Managed by FHEVM ACL system

## Security Considerations

### Smart Contract Security
- **Tested**: Comprehensive test coverage for all functions
- **Standard Compliance**: Full ERC721 implementation
- **Access Control**: Modifier-based permission system
- **Reentrancy Protection**: Following checks-effects-interactions pattern

### Cryptographic Security
- **FHE Guarantees**: Attributes are encrypted using Zama's FHEVM
- **Key Management**: Decryption keys managed by FHEVM infrastructure
- **Permission System**: ACL-based access control for encrypted data

### Best Practices
- Always validate environment variables before deployment
- Use hardware wallets for production deployments
- Verify contracts on Etherscan after deployment
- Never commit private keys to version control
- Use multisig wallets for contract ownership in production

## Future Roadmap

### Phase 1: Core Battle System (Q2 2025)
- [ ] Implement battle mechanics using encrypted attributes
- [ ] Add combat resolution system with FHE computations
- [ ] Create matchmaking algorithm
- [ ] Develop battle history tracking

### Phase 2: Advanced Gameplay (Q3 2025)
- [ ] Tournament system with prize pools
- [ ] Leaderboard and ranking system
- [ ] Training mechanics to improve fighter attributes
- [ ] Special abilities and equipment system

### Phase 3: Economic Layer (Q4 2025)
- [ ] Breeding system for new fighters
- [ ] Marketplace for fighter trading
- [ ] Staking and rewards mechanism
- [ ] DAO governance for game parameters

### Phase 4: Expansion (2026)
- [ ] Multi-chain deployment (Polygon, Arbitrum)
- [ ] Mobile application (iOS/Android)
- [ ] 3D fighter visualization
- [ ] Cross-game interoperability
- [ ] AI-powered training opponents

### Technical Improvements
- [ ] Gas optimization for minting and battles
- [ ] Enhanced frontend UX/UI
- [ ] GraphQL API for game data
- [ ] Real-time battle animations
- [ ] Social features (guilds, chat)
- [ ] Achievement and quest system

### Research & Innovation
- [ ] Zero-knowledge proof integration for additional privacy
- [ ] Layer 2 scaling solutions
- [ ] Cross-chain bridge for fighter portability
- [ ] Advanced FHE operations for complex game logic

## Contributing

We welcome contributions from the community! Here's how you can help:

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep commits atomic and well-described

### Areas for Contribution
- Bug fixes and issue resolution
- Documentation improvements
- Test coverage expansion
- Frontend UI/UX enhancements
- Gas optimization
- New game mechanics
- Translation and localization

## License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

### Important Note
In addition to the rights carried by this license, ZAMA grants to the user a non-exclusive, free and non-commercial license on all patents filed in its name relating to the open-source code for the sole purpose of evaluation, development, research, prototyping and experimentation.

## Support

### Documentation
- **FHEVM Documentation**: [https://docs.zama.ai](https://docs.zama.ai)
- **FHEVM Hardhat Guide**: [https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- **FHEVM Testing**: [https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)

### Community
- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Zama Discord**: [https://discord.gg/zama](https://discord.gg/zama)
- **Twitter**: Follow [@zama_fhe](https://twitter.com/zama_fhe) for updates

### Getting Help
If you encounter issues:
1. Check existing GitHub issues
2. Review FHEVM documentation
3. Ask in Zama Discord community
4. Open a new issue with detailed description

---

**Built with ❤️ using FHEVM by Zama**

*Bringing privacy to blockchain gaming, one encrypted fighter at a time.*
