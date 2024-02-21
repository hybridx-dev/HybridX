# HybridX: ERC20/ERC721 Hybrid Token Standard for NFTs with Native Liquidity
<p align="center">
  <img width="256" height="256" src="(./assets/android-chrome-512x512.png">
</p>
## Background
HybridX introduces a groundbreaking approach to hybrid token standardization, addressing the limitations encountered in existing models. Inspired by the innovative concept of hybrid ERC20/ERC721 tokens introduced by Pandora (ERC404), HybridX aims to refine and enhance this idea, presenting a solution that balances efficiency, safety, and interoperability.

## The Challenge with ERC404
While ERC404 made significant step in enabling NFTs to be traded with inherent liquidity, it fell short in several areas:

**High Gas Costs**: Transactions were often prohibitively expensive, limiting accessibility and scalability.

**Incompatibility With Existing Standards**: Deviations from established token behaviors posed risks and integration challenges, impacting the broader ecosystem's security and functionality.

## Introducing HX Tokens
HybridX proposes a novel standard, the HX Token, designed to seamlessly blend the versatility of ERC20 tokens with ERC721 NFTs, thereby overcoming the drawbacks of ERC404. Key features include:

**Efficient Gas Usage**: Benchmarking demonstrates up to an 87% reduction in gas costs compared to ERC404.

**Enhanced Safety and Compatibility**: By adhering closely to established standards and introducing safe, predictable behaviors, HybridX ensures a secure and smooth integration with existing platforms and services (i.e. Exchanges, DeFi, and DApps).

**Composable and Flexible Design**: The dual-contract architecture, comprising IERC20HX and IERC721HX interfaces, facilitates on-demand NFT minting and burning, enabling a fluid transition between token types without sacrificing effectiveness.

## Features
HybridX's implementation leverages OpenZeppelin Contracts Library for ERC20 functionalities, alongside with ERC721A/ERC721Psi for optimized NFT batch minting.

**Seamless ERC20 Interactions**: Users can trade, swap, and transfer ERC20HX Tokens like standard ERC20.

**On-Demand NFT Minting and Burning**: Through the HybridX Tools (https://tools.hybridx.org), users can effortlessly convert their ERC20 tokens into unique ERC721 NFTs, and vice versa, maintaining liquidity and value continuity.

## Installation
```sh
git clone https://github.com/hybridx-dev/HybridX

npm run install -D
```

## Running Benchmark
```sh
npm run benchmark
```

## Notice
This is experimental software and is provided on an "as is" and "as available" basis. We do not give any warranties and will not be liable for any loss incurred through any use of this codebase.
