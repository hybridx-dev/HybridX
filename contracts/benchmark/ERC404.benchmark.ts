import { ethers } from "hardhat";
import { ERC404Benchmark } from "../../typechain-types";
describe("Benchmark", () => {
  let benchmarker: any;
  let benchmarkingContract: ERC404Benchmark;
  
  before(async () => {
    [benchmarker] = await ethers.getSigners();

    benchmarkingContract = await ethers.deployContract(
      "ERC404Benchmark",
      {
        from: benchmarker,
      }
    );
  });

  it("Deploying Contracts", async () => {
    await benchmarkingContract.benchmarkContractDeployment();
  });

  it("Setup Contracts", async () => {
    await benchmarkingContract.benchmarkContractSetup();
  });

  it("Transfer FT and Mint 25 NFTs 0 0", async () => {
    await benchmarkingContract.benchmarkTransferFTAndMint25NFTs_0_0();
  });

  it("Transfer FT and Mint 25 NFTs 1 0", async () => {
    await benchmarkingContract.benchmarkTransferFTAndMint25NFTs_1_0();
  });

  it("Transfer FT and Mint 25 NFTs 0 1", async () => {
    await benchmarkingContract.benchmarkTransferFTAndMint25NFTs_0_1();
  });

  it("Burn 25 NFTs, Transfer FT and Mint 25 NFTs 0", async () => {
    await benchmarkingContract.benchmarkBurn25NFTTransferFTAndMint25NFTs_0();
  });

  it("Burn 25 NFTs, Transfer FT and Mint 25 NFTs 1", async () => {
    await benchmarkingContract.benchmarkBurn25NFTTransferFTAndMint25NFTs_1();
  });

  it("Transfer FT", async () => {
    await benchmarkingContract.benchmarkTransferFT_0();
  });

  it("Mint Single NFT", async () => {
    await benchmarkingContract.benchmarkMintNFT();
  });

  it("Transfer Single NFT", async () => {
    console.log()
    await benchmarkingContract.benchmarkTransferNFT();
  });

  it("Transfer 25 NFTs", async () => {
    await benchmarkingContract.benchmarkTransfer25NFTs();
  });

  it("Burn 25 NFTs and Transfer FT", async () => {
    // for (let i = 0; i < 25; i++) console.log(await benchmarkingContract.ownerOf(1))
    await benchmarkingContract.benchmarkBurn25NFTsAndTransferFT();
  });
  
});
