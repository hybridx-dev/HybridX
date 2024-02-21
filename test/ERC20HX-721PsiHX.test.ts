import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleERC20HX, SimpleERC721PsiHX} from "../typechain-types";

describe("ERC20HX-ERC721PsiHX", function () {
  let erc20hx: SimpleERC20HX;
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
    erc20hx = await ethers.deployContract("SimpleERC20HX", ftContractParams, {
      from: deployer,
    });

    await erc20hx.waitForDeployment();

    const nftContractParams = [
      deployerAddress,
      ftContractAddress,
      "https://localhost:3000/buddynft/v1/",
    ];
    erc721PsiHX = await ethers.deployContract("SimpleERC721PsiHX", nftContractParams, {
      from: deployer,
    });

    await erc721PsiHX.waitForDeployment();
  });

  describe("Minting NFTs", function () {
    beforeEach(async () => {
      // Pre-fund the user account with ERC20 tokens
      await erc20hx
        .connect(deployer)
        .transfer(user1.address, ethers.parseUnits("100", 18));
    });
    it("should burn ERC20 tokens and mint NFT", async function () {
      // User burns ERC20 tokens to mint NFT
      await erc20hx.connect(user1).mintNFT(1);

      // Verify ERC20 balance decrease and NFT minting
      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("99", 18)
      );
      expect(await erc721PsiHX.ownerOf(0)).to.equal(user1.address);
    });

    it("should burn 10 ERC20 tokens and mint 10 NFTs", async function () {
      // User burns ERC20 tokens to mint NFT
      await erc20hx.connect(user1).mintNFT(10);

      // Verify ERC20 balance decrease and NFT minting
      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("90", 18)
      );
      for (let i = 0; i < 10; i++) {
        expect(await erc721PsiHX.ownerOf(i)).to.equal(user1.address);
      }
    });

    it("should emit MintNFT event", async function () {
      await expect(erc20hx.connect(user1).mintNFT(1))
        .to.emit(erc20hx, "MintNFT")
        .withArgs(user1.address, 1);
    });

    it("should revert when trying to mint NFTs with insufficient ERC20 tokens", async function () {
      // Attempt to mint more NFTs than the ERC20 token balance
      await expect(erc20hx.connect(user2).mintNFT(1)).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );
    });

    it("should revert when trying to mint NFTs with zero ERC20 tokens", async function () {
      // Attempt to mint NFT with zero ERC20 tokens
      await expect(erc20hx.connect(user1).mintNFT(0)).to.be.revertedWith(
        "ERC721Psi: quantity must be greater 0"
      );
    });

    it("should ensure atomicity in minting process", async function () {
      // Attempt to mint an amount of NFTs that is known to fail, e.g., due to exceeding balance or cap
      const excessiveAmount = ethers.parseUnits("101", 18); // Assuming the user only has 100 tokens

      // The transaction should revert due to insufficient ERC20 balance
      await expect(
        erc20hx.connect(user1).mintNFT(excessiveAmount)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");

      // Verify that no NFTs were minted and ERC20 balance remains unchanged
      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("100", 18)
      );
      await expect(erc721PsiHX.ownerOf(0)).to.be.revertedWith(
        "ERC721Psi: owner query for nonexistent token"
      );
    });

    it("should receive ERC20 tokens and then mint NFTs", async function () {
      // User2 receives ERC20 tokens
      const receiveAmount = ethers.parseUnits("10", 18); // User2 receives 10 ERC20 tokens
      await erc20hx.connect(deployer).transfer(user2.address, receiveAmount);

      // Verify user2's ERC20 token balance
      expect(await erc20hx.balanceOf(user2.address)).to.equal(receiveAmount);

      // User2 mints NFTs using the received ERC20 tokens
      const mintAmount = 10; // User2 decides to mint 5 NFTs
      await erc20hx.connect(user2).mintNFT(mintAmount);

      // Verify user2's new ERC20 token balance after minting
      expect(await erc20hx.balanceOf(user2.address)).to.equal(0);

      // Verify NFT ownership for minted NFTs
      for (let i = 0; i < mintAmount; i++) {
        expect(await erc721PsiHX.ownerOf(i)).to.equal(user2.address);
      }
    });
  });

  describe("Burning NFTs", function () {
    beforeEach(async () => {
      // Pre-fund the user account with ERC20 tokens
      await erc20hx
        .connect(deployer)
        .transfer(user1.address, ethers.parseUnits("100", 18));
    });

    it("should burn NFT and mint ERC20 tokens", async function () {
      // Setup: User mints an NFT
      await erc20hx.connect(user1).mintNFT(1);

      // User burns the NFT to receive ERC20 tokens
      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("99", 18)
      );
      await erc20hx.connect(user1).burnNFT([0]);

      // Verify NFT burning and ERC20 balance increase
      await expect(erc721PsiHX.ownerOf(0)).to.be.reverted;
      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("100", 18)
      );
    });

    it("should burn 10 NFTs and mint 10 ERC20 tokens", async function () {
      // Setup: User mints an NFT
      await erc20hx.connect(user1).mintNFT(20);

      // User burns the NFT to receive ERC20 tokens
      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("80", 18)
      );
      await erc20hx
        .connect(user1)
        .burnNFT([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

      // Verify NFT burning and ERC20 balance increase
      for (let i = 10; i < 20; i++) {
        await expect(erc721PsiHX.ownerOf(i)).to.be.reverted;
      }

      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("90", 18)
      );
    });

    it("should emit BurnNFT event", async function () {
      // Setup: User mints an NFT
      await erc20hx.connect(user1).mintNFT(2);

      await expect(erc20hx.connect(user1).burnNFT([0, 1]))
        .to.emit(erc20hx, "BurnNFT")
        .withArgs(user1.address, [0, 1]);
    });

    it("should revert when a non-owner tries to burn NFT", async function () {
      await erc20hx.connect(user1).mintNFT(1);
      await expect(erc20hx.connect(user2).burnNFT([0])).to.be.revertedWith(
        "ERC721PsiHX: Not token owner"
      );
    });

    it("should allow batch burning all owned NFTs", async function () {
      await erc20hx.connect(user1).mintNFT(10);

      await expect(
        erc20hx.connect(user1).burnNFT([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      ).not.to.be.reverted;

      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("100", 18)
      ); // Restored to initial balance
    });
    it("should allow burning all owned NFTs", async function () {
      await erc20hx.connect(user1).mintNFT(10);
      for (let i = 0; i < 10; i++) {
        await expect(erc20hx.connect(user1).burnNFT([i])).not.to.be.reverted;
      }
      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("100", 18)
      ); // Restored to initial balance
    });

    it("should ensure atomicity in burning process, case: (ERC721PsiHX: Not token owner)", async function () {
      // Setup: User mints 10 NFTs
      await erc20hx.connect(user1).mintNFT(10);
      await erc20hx.connect(deployer).mintNFT(10);

      const invalidTokenIds = [...Array(15).keys()]; // User only has 10 NFTs

      // The transaction should revert due to trying to burn nonexistent NFTs
      await expect(
        erc20hx.connect(user1).burnNFT(invalidTokenIds)
      ).to.be.revertedWith("ERC721PsiHX: Not token owner");

      // Verify that no NFTs were burned and all previously minted NFTs still exist
      for (let i = 0; i < 10; i++) {
        expect(await erc721PsiHX.ownerOf(i)).to.equal(user1.address);
      }
    });
    it("should ensure atomicity in burning process, case: (ERC721Psi: owner query for nonexistent token)", async function () {
      // Setup: User mints 10 NFTs
      await erc20hx.connect(user1).mintNFT(10);

      const invalidTokenIds = [...Array(15).keys()]; // User only has 10 NFTs

      // The transaction should revert due to trying to burn nonexistent NFTs
      await expect(
        erc20hx.connect(user1).burnNFT(invalidTokenIds)
      ).to.be.revertedWith("ERC721Psi: owner query for nonexistent token");

      // Verify that no NFTs were burned and all previously minted NFTs still exist
      for (let i = 0; i < 10; i++) {
        expect(await erc721PsiHX.ownerOf(i)).to.equal(user1.address);
      }
    });

    it("should receive NFTs and then burn them for ERC20 tokens", async function () {
      // Setup: Mint NFTs to user1
      const mintAmount = 3;
      await erc20hx.connect(deployer).mintNFT(mintAmount); // Assuming deployer can mint NFTs for testing

      // Transfer NFTs from deployer to user2
      for (let i = 0; i < mintAmount; i++) {
        await erc721PsiHX
          .connect(deployer)
          .transferFrom(deployer.address, user2.address, i);
      }

      // Verify NFT ownership for transferred NFTs
      for (let i = 0; i < mintAmount; i++) {
        expect(await erc721PsiHX.ownerOf(i)).to.equal(user2.address);
      }

      // User2 burns the received NFTs
      const nftIdsToBurn = [0, 1, 2]; // User2 decides to burn all received NFTs
      await erc20hx.connect(user2).burnNFT(nftIdsToBurn); // Assuming `burnNFT` can be called by NFT owner

      // Verify NFTs are burned
      for (const id of nftIdsToBurn) {
        await expect(erc721PsiHX.ownerOf(id)).to.be.revertedWith(
          "ERC721Psi: owner query for nonexistent token"
        );
      }

      // Verify user2's ERC20 token balance increase after burning NFTs
      const expectedERC20BalanceAfterBurn = ethers.parseUnits(
        String(nftIdsToBurn.length),
        18
      ); // Assuming 1:1 mint rate
      expect(await erc20hx.balanceOf(user2.address)).to.equal(
        expectedERC20BalanceAfterBurn
      );
    });
  });

  describe("Boundary Conditions", function () {
    it("should handle minting the maximum number of NFTs", async function () {
      // Assuming there's a maximum limit to the number of NFTs a user can mint in one transaction
      const MAX_MINT_AMOUNT = 10000; // Replace this with your contract's actual limit

      // Ensure user1 has enough ERC20 tokens to mint the maximum number of NFTs
      const requiredERC20Balance = ethers.parseUnits(
        String(MAX_MINT_AMOUNT),
        18
      );
      await erc20hx
        .connect(deployer)
        .transfer(user1.address, requiredERC20Balance);

      // Attempt to mint the maximum number of NFTs
      await erc20hx.connect(user1).mintNFT(MAX_MINT_AMOUNT);

      // Verify that the correct number of NFTs have been minted and the ERC20 balance is updated accordingly
      const newERC20Balance = await erc20hx.balanceOf(user1.address);
      expect(newERC20Balance).to.equal(0); // Assuming 1:1 burn rate for simplicity
    });

    it("should revert when minting more than the maximum number of NFTs", async function () {
      const MAX_MINT_AMOUNT = 10000; // Use your contract's actual limit
      const OVER_LIMIT_AMOUNT = MAX_MINT_AMOUNT + 1;

      // Ensure user1 has enough ERC20 tokens to attempt an over-limit mint
      const requiredERC20Balance = ethers.parseUnits(
        String(MAX_MINT_AMOUNT),
        18
      );
      await erc20hx
        .connect(deployer)
        .transfer(user1.address, requiredERC20Balance);

      // Attempt to mint more than the maximum allowed NFTs, which should revert
      await expect(
        erc20hx.connect(user1).mintNFT(OVER_LIMIT_AMOUNT)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance"); // Replace with your contract's actual revert message
    });

    it("should correctly handle the edge case of minting with the last token ID after max minted amount", async function () {
      const MAX_MINT_AMOUNT = 10000; // Replace this with your contract's actual limit

      // Ensure user1 has enough ERC20 tokens to mint the maximum number of NFTs
      const requiredERC20Balance = ethers.parseUnits(
        String(MAX_MINT_AMOUNT),
        18
      );
      await erc20hx
        .connect(deployer)
        .transfer(user1.address, requiredERC20Balance);

      // Attempt to mint the maximum number of NFTs then burn
      await erc20hx.connect(user1).mintNFT(MAX_MINT_AMOUNT);
      await erc20hx.connect(user1).burnNFT([0, 55, 32]);

      await erc20hx.connect(user1).mintNFT(3);

      // Verify that the last NFT can be minted without issues
      expect(await erc721PsiHX.ownerOf(MAX_MINT_AMOUNT - 1 + 3)).to.equal(
        user1.address
      );
    });
  });

  describe("mintNFTFrom", function () {
    const amountNFT = 5;
    const requiredERC20Balance = ethers.parseUnits(String(amountNFT), 18); // Assuming 1:1 burn rate for simplicity

    beforeEach(async () => {
      // Pre-fund the 'from' account with enough ERC20 tokens for minting
      await erc20hx
        .connect(deployer)
        .transfer(user1.address, requiredERC20Balance);
    });
    it("should allow minting NFTs from one address to another", async function () {
      // Approve the contract to spend user1's ERC20 tokens
      await erc20hx.connect(user1).approve(user2.address, requiredERC20Balance);

      // Mint NFTs from user1 to user2
      await erc20hx
        .connect(user2)
        .mintNFTFrom(user1.address, user2.address, amountNFT);

      // Verify ERC20 balance decrease in 'from' account and NFT ownership in 'to' account
      expect(await erc20hx.balanceOf(user1.address)).to.equal(0);
      for (let i = 0; i < amountNFT; i++) {
        expect(await erc721PsiHX.ownerOf(i)).to.equal(user2.address);
      }
    });

    it("should allow minting NFTs from one address to third-party", async function () {
      // Approve the contract to spend user1's ERC20 tokens
      await erc20hx.connect(user1).approve(user2.address, requiredERC20Balance);

      // Mint NFTs from user1 to user2
      await erc20hx
        .connect(user2)
        .mintNFTFrom(user1.address, user3.address, amountNFT);

      // Verify ERC20 balance decrease in 'from' account and NFT ownership in 'to' account
      expect(await erc20hx.balanceOf(user1.address)).to.equal(0);
      for (let i = 0; i < amountNFT; i++) {
        expect(await erc721PsiHX.ownerOf(i)).to.equal(user3.address);
      }
    });

    it("should revert if 'from' account does not have enough ERC20 tokens", async function () {
      // Attempt to mint more NFTs than the ERC20 token balance in 'from' account
      const largerAmountNFT = 10; // More than user1's balance

      // Approve the contract to spend user1's ERC20 tokens
      await erc20hx
        .connect(user1)
        .approve(user2.address, ethers.parseUnits(String(largerAmountNFT), 18));

      await expect(
        erc20hx
          .connect(user2)
          .mintNFTFrom(user1.address, user2.address, largerAmountNFT)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("should revert if 'from' account has not approved enough ERC20 tokens", async function () {
      // User1 approves less than the necessary amount
      const approvedERC20Balance = ethers.parseUnits("1", 18); // Approving only 1 token
      const amountNFT = 5; // Attempting to mint 5 NFTs
      await erc20hx.connect(user1).approve(user2.address, approvedERC20Balance);

      // Attempt to mint with insufficient approval should fail
      await expect(
        erc20hx
          .connect(user2)
          .mintNFTFrom(user1.address, user2.address, amountNFT)
      ).to.be.revertedWith("ERC20HX: Insufficient allowance");
    });

    it("should emit a MintNFT event with correct parameters", async function () {
      await erc20hx
        .connect(deployer)
        .transfer(user1.address, requiredERC20Balance);
      await erc20hx.connect(user1).approve(user2.address, requiredERC20Balance);

      // Expect the MintNFT event to be emitted with correct parameters
      await expect(
        erc20hx
          .connect(user2)
          .mintNFTFrom(user1.address, user2.address, amountNFT)
      )
        .to.emit(erc20hx, "MintNFT")
        .withArgs(user2.address, amountNFT); // Assuming the event emits the recipient address and the amount of NFTs minted
    });

    it("should revert if called by an unauthorized third party", async function () {
      // User3 (unauthorized) tries to call mintNFTFrom for user1
      const amountNFT = 1;
      await expect(
        erc20hx
          .connect(user3)
          .mintNFTFrom(user1.address, user2.address, amountNFT)
      ).to.be.revertedWith("ERC20HX: Insufficient allowance");
    });
  });

  describe("burnNFTFrom", function () {
    beforeEach(async function () {
      // Setup: Mint some NFTs to user1 for testing burn functionality
      const mintAmount = 5;
      const requiredERC20Balance = ethers.parseUnits(String(mintAmount), 18); // Assuming 1:1 burn rate for simplicity
      await erc20hx
        .connect(deployer)
        .transfer(user1.address, requiredERC20Balance);
      await erc20hx.connect(user1).mintNFT(mintAmount);
    });

    it("should allow burning NFTs from one address and crediting another", async function () {
      const nftIds = [0, 1, 2]; // Assuming these NFTs exist and are owned by user1

      await erc721PsiHX.connect(user1).setApprovalForAll(user2, true);

      // Burn NFTs from user1 and credit ERC20 tokens to user2
      await erc20hx
        .connect(user2)
        .burnNFTFrom(user1.address, user2.address, nftIds);

      // Verify NFTs are burned and user2's ERC20 balance is increased
      for (const id of nftIds) {
        await expect(erc721PsiHX.ownerOf(id)).to.be.reverted; // NFTs should be burned
      }
      for (const id of [3, 4]) {
        expect(await erc721PsiHX.ownerOf(id)).to.equal(user1.address); // NFTs should be burned
      }
      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits(String(0), 18)
      );
      expect(await erc20hx.balanceOf(user2.address)).to.equal(
        ethers.parseUnits(String(nftIds.length), 18)
      ); // Assuming 1:1 burn rate
    });
    it("should allow burning NFTs from one address and crediting third-party", async function () {
      const nftIds = [0, 1, 2]; // Assuming these NFTs exist and are owned by user1

      await erc721PsiHX.connect(user1).setApprovalForAll(user2, true);

      // Burn NFTs from user1 and credit ERC20 tokens to user2
      await erc20hx
        .connect(user2)
        .burnNFTFrom(user1.address, user3.address, nftIds);

      // Verify NFTs are burned and user2's ERC20 balance is increased
      for (const id of nftIds) {
        await expect(erc721PsiHX.ownerOf(id)).to.be.reverted; // NFTs should be burned
      }
      for (const id of [3, 4]) {
        expect(await erc721PsiHX.ownerOf(id)).to.equal(user1.address); // NFTs should be burned
      }
      expect(await erc20hx.balanceOf(user1.address)).to.equal(
        ethers.parseUnits(String(0), 18)
      );
      expect(await erc20hx.balanceOf(user3.address)).to.equal(
        ethers.parseUnits(String(nftIds.length), 18)
      ); // Assuming 1:1 burn rate
    });

    it("should revert if 'from' account does not own the NFTs", async function () {
      const mintAmount = 5;
      const requiredERC20Balance = ethers.parseUnits(String(mintAmount), 18); // Assuming 1:1 burn rate for simplicity
      await erc20hx
        .connect(deployer)
        .transfer(user3.address, requiredERC20Balance);
      await erc20hx.connect(user3).mintNFT(mintAmount);

      const nftIds = [5, 6]; // Assuming these NFTs are not owned by user1

      await erc721PsiHX.connect(user1).setApprovalForAll(user2, true);

      await expect(
        erc20hx.connect(user2).burnNFTFrom(user1.address, user2.address, nftIds)
      ).to.be.revertedWith("ERC721PsiHX: Not token owner");
    });

    it("should revert if NFTs are not approved for burning", async function () {
      const nftIds = [0, 1]; // Assuming these NFTs exist and are owned by user1
      // Attempt to burn without approving
      await expect(
        erc20hx.connect(user2).burnNFTFrom(user1.address, user2.address, nftIds)
      ).to.be.revertedWith("ERC20HX: NFT not approved");
    });

    it("should emit a BurnNFT event with correct parameters", async function () {
      const nftIds = [0, 1];
      // Approve NFTs for burning
      await erc721PsiHX.connect(user1).setApprovalForAll(user2.address, true);

      // Expect the BurnNFT event to be emitted with correct parameters
      await expect(
        erc20hx.connect(user2).burnNFTFrom(user1.address, user2.address, nftIds)
      )
        .to.emit(erc20hx, "BurnNFT")
        .withArgs(user1.address, nftIds); // Assuming the event emits the owner address and the array of NFT IDs
    });

    it("should revert if called by an unauthorized third party", async function () {
      const nftIds = [2, 3]; // Assuming these NFTs exist and are owned by user1
      // User1 approves user2 to burn their NFTs
      // Approve NFTs for burning
      await erc721PsiHX.connect(user1).setApprovalForAll(user2.address, true);

      // User3 (unauthorized) tries to call burnNFTFrom for user1
      await expect(
        erc20hx.connect(user3).burnNFTFrom(user1.address, user2.address, nftIds)
      ).to.be.revertedWith("ERC20HX: NFT not approved"); // Replace "Unauthorized" with your contract's actual revert message for unauthorized calls
    });
  });
});
