import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();

  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();
  const deployerNonce = await deployer.getNonce();

  // assumes FT and NFT contract are deployed sequentially
  const ftContractAddress = ethers.getCreateAddress({
    from: deployerAddress,
    nonce: deployerNonce,
  });

  const nftContractAddress = ethers.getCreateAddress({
    from: deployerAddress,
    nonce: deployerNonce + 1,
  });

  const ftContractParams = [nftContractAddress]
  const ftContract = await ethers.deployContract(
    "SimpleERC20HX",
    ftContractParams,
    {
      from: deployer,
    }
  );

  await ftContract.waitForDeployment();

  const nftContractParams = [deployerAddress, ftContractAddress, "https://localhost:3000/buddynft/v1/"];
  const nftContract = await ethers.deployContract(
    "SimpleERC721PsiHX",
    nftContractParams,
    {
      from: deployer,
    }
  );

  await nftContract.waitForDeployment();

  console.log(
    `
    ftContract deployed to ${ftContract.target} | params: ${ftContractParams}\n
    nftContract deployed to ${nftContract.target} | params: ${nftContractParams}
    `
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
