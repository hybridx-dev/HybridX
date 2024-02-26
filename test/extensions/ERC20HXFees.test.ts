import { expect } from "chai";
import { ethers } from "hardhat";
import {
  ExampleERC20HXFees,
  SimpleERC721PsiHX,
  BurnReentranceTest,
} from "../../typechain-types";

describe("ERC20HXFees", function () {
  let erc20hx: ExampleERC20HXFees;
  let erc721PsiHX: SimpleERC721PsiHX;
  let deployer: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    [deployer, user1, user2, user3] = await ethers.getSigners();

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

    const ftContractParams = [nftContractAddress];
    erc20hx = await ethers.deployContract(
      "ExampleERC20HXFees",
      ftContractParams,
      {
        from: deployer,
      }
    );

    await erc20hx.waitForDeployment();

    const nftContractParams = [
      deployerAddress,
      ftContractAddress,
      "https://localhost:3000/buddynft/v1/",
    ];
    erc721PsiHX = await ethers.deployContract(
      "SimpleERC721PsiHX",
      nftContractParams,
      {
        from: deployer,
      }
    );

    await erc721PsiHX.waitForDeployment();
  });

  describe("Fee Information Management", function () {
    it("Should allow owner to add fee information", async function () {
      await erc20hx
        .connect(deployer)
        .pushFeeInfo([user1.address, user2.address], [10, 20]);

      expect(await erc20hx.feesInfo(0)).to.deep.equal([user1.address, 10n]);
      expect(await erc20hx.feesInfo(1)).to.deep.equal([user2.address, 20n]);
    });

    it("Should not allow non-owner to add fee information", async function () {
      await expect(
        erc20hx.connect(user1).pushFeeInfo([user1.address], [10])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to delete fee information then readd", async function () {
      await erc20hx
        .connect(deployer)
        .pushFeeInfo([user1.address, user2.address], [10, 20]);
      expect(await erc20hx.feesInfo(0)).to.deep.equal([user1.address, 10n]);
      expect(await erc20hx.feesInfo(1)).to.deep.equal([user2.address, 20n]);
      await erc20hx.connect(deployer).deleteFeeInfo();
      await erc20hx
        .connect(deployer)
        .pushFeeInfo([user1.address, user2.address], [20, 50]);
      expect(await erc20hx.feesInfo(0)).to.deep.equal([user1.address, 20n]);
      expect(await erc20hx.feesInfo(1)).to.deep.equal([user2.address, 50n]);
    });

    it("Should not allow non-owner to delete fee information then readd", async function () {
      await erc20hx
        .connect(deployer)
        .pushFeeInfo([user1.address, user2.address], [10, 20]);
      await expect(erc20hx.connect(user1).deleteFeeInfo()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(
        erc20hx
          .connect(user1)
          .pushFeeInfo([user1.address, user2.address], [20, 50])
      ).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await erc20hx.feesInfo(0)).to.deep.equal([user1.address, 10n]);
      expect(await erc20hx.feesInfo(1)).to.deep.equal([user2.address, 20n]);
    });
  });

  describe("Fee Handling", function () {
    beforeEach(async function () {
      // Set up fee information
      await erc20hx
        .connect(deployer)
        .pushFeeInfo([deployer.address, user2.address], [80, 20]);
      await erc20hx
        .connect(deployer)
        .setFeeUnitAmount(ethers.parseEther("0.025"));

      await erc20hx.connect(deployer).mintNFT(10);

      await erc721PsiHX
        .connect(deployer)
        .transferFrom(deployer.address, user1.address, 0);
      await erc721PsiHX
        .connect(deployer)
        .transferFrom(deployer.address, user1.address, 1);
    });

    it("Should correctly calculate burn fee", async function () {
      const burnFee = await erc20hx.burnFee(1);
      expect(burnFee).to.equal(ethers.parseEther("0.025"));

      const burnFee2 = await erc20hx.burnFee(8);
      expect(burnFee2).to.equal(ethers.parseEther("0.20"));
    });

    it("Should correctly calculate burn fee for multiple NFTs", async function () {
      // Assuming setFeeUnitAmount has been called in a beforeEach block or similar setup
      const numberOfNFTs = 5;
      const expectedBurnFee = ethers.parseEther(`${0.025 * numberOfNFTs}`); // Adjust the multiplier according to the fee unit amount set in the contract
      const burnFee = await erc20hx.burnFee(numberOfNFTs);

      expect(burnFee).to.equal(expectedBurnFee);
    });
    it("Should distribute fees", async function () {
      const burnFee = await erc20hx.burnFee(2);
      const initialBalanceBurner = await ethers.provider.getBalance(
        user1.address
      );
      const initialBalanceReceiver0 = await ethers.provider.getBalance(
        deployer
      );
      const initialBalanceReceiver1 = await ethers.provider.getBalance(user2);
      const tx = await erc20hx
        .connect(user1)
        .burnNFT([0, 1], { value: ethers.parseEther("0.05") });
      const receipt = await tx.wait();
      // @ts-ignore
      const gasUsed = receipt?.gasUsed * receipt?.gasPrice;
      const finalBalanceBurner = await ethers.provider.getBalance(
        user1.address
      );
      const finalBalanceReceiver0 = await ethers.provider.getBalance(deployer);
      const finalBalanceReceiver1 = await ethers.provider.getBalance(user2);

      // @ts-ignore
      expect(initialBalanceBurner - (finalBalanceBurner + gasUsed)).to.equal(
        burnFee
      );
      expect(finalBalanceReceiver1 - initialBalanceReceiver1).to.equal(
        ethers.parseEther(`${(0.025 * 2 * 20) / 100}`)
      );
      expect(finalBalanceReceiver0 - initialBalanceReceiver0).to.equal(
        ethers.parseEther(`${(0.025 * 2 * 80) / 100}`)
      );
    });

    it("Should distribute fees and handle refunds", async function () {
      const burnFee = await erc20hx.burnFee(2);
      const initialBalanceBurner = await ethers.provider.getBalance(
        user1.address
      );
      const initialBalanceReceiver0 = await ethers.provider.getBalance(
        deployer
      );
      const initialBalanceReceiver1 = await ethers.provider.getBalance(user2);
      const tx = await erc20hx
        .connect(user1)
        .burnNFT([0, 1], { value: ethers.parseEther("0.073") });
      const receipt = await tx.wait();
      // @ts-ignore
      const gasUsed = receipt?.gasUsed * receipt?.gasPrice;
      const finalBalanceBurner = await ethers.provider.getBalance(
        user1.address
      );
      const finalBalanceReceiver0 = await ethers.provider.getBalance(deployer);
      const finalBalanceReceiver1 = await ethers.provider.getBalance(user2);

      // @ts-ignore
      expect(initialBalanceBurner - (finalBalanceBurner + gasUsed)).to.equal(
        burnFee
      );
      expect(finalBalanceReceiver1 - initialBalanceReceiver1).to.equal(
        ethers.parseEther(`${(0.025 * 2 * 20) / 100}`)
      );
      expect(finalBalanceReceiver0 - initialBalanceReceiver0).to.equal(
        ethers.parseEther(`${(0.025 * 2 * 80) / 100}`)
      );

      expect(initialBalanceBurner - (finalBalanceBurner + gasUsed)).to.equal(
        finalBalanceReceiver1 -
          initialBalanceReceiver1 +
          finalBalanceReceiver0 -
          initialBalanceReceiver0
      );
    });

    // Include more tests to check for fee distribution to multiple addresses and correct handling in various scenarios
  });

  describe("Reentrancy Attack Protection", function () {
    let maliciousContract: BurnReentranceTest;

    beforeEach(async function () {
      // Deploy MaliciousContract after ERC20HXFees
      const MaliciousContract = await ethers.getContractFactory(
        "BurnReentranceTest"
      );
      maliciousContract = await MaliciousContract.deploy(erc20hx);

      await erc20hx.connect(deployer).mintNFT(10);

      await erc721PsiHX
        .connect(deployer)
        .transferFrom(deployer.address, maliciousContract, 0);
      await erc721PsiHX
        .connect(deployer)
        .transferFrom(deployer.address, maliciousContract, 1);
      await erc721PsiHX
        .connect(deployer)
        .transferFrom(deployer.address, maliciousContract, 2);

      // await deployer.sendTransaction({
      //   to: erc20hx,
      //   value: ethers.parseEther("1")
      // })
    });
    it("Should prevent reentrant calls", async function () {
      // Attempt to attack
      await expect(
        maliciousContract
          .connect(user1)
          .attack([0], { value: ethers.parseEther("0.2") })
      ).to.be.revertedWith("ERC20HXFees: Failure to refund"); // Expect the transaction to be reverted due to the nonReentrant modifier
      // Additional checks can be performed here to ensure the state of the ERC20HXFees contract remains consistent
    });
  });
});
