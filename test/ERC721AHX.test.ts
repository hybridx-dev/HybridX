import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleERC721AHX } from "../typechain-types";

describe("ERC721AHX", function () {
  let erc721AHX: SimpleERC721AHX;
  let deployer: any;
  let minter: any;
  let user1: any;
  let user2: any;
  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

  beforeEach(async function () {
    [deployer, minter, user1, user2] = await ethers.getSigners();

    const deployerAddress = await deployer.getAddress();
    const minterAddress = await minter.getAddress();

    const nftContractParams = [
      deployerAddress,
      minterAddress,
      "https://localhost:3000/buddynft/v1/",
    ];
    erc721AHX = await ethers.deployContract("SimpleERC721AHX", nftContractParams, {
      from: deployer,
    });

    await erc721AHX.waitForDeployment();
  });

  describe("Role Management", function () {
    it("should assign the deployer as the default admin", async function () {
      const isAdmin = await erc721AHX.hasRole(
        DEFAULT_ADMIN_ROLE,
        deployer.address
      );
      expect(isAdmin).to.be.true;
    });

    it("should allow the admin to grant the minter role", async function () {
      await erc721AHX.grantRole(MINTER_ROLE, user1.address);
      const isMinter = await erc721AHX.hasRole(MINTER_ROLE, user1.address);
      expect(isMinter).to.be.true;
    });
  });

  describe("Minting", function () {
    it("should allow minter to mint tokens", async function () {
      await erc721AHX.connect(minter).mint(user1.address, 1);
      const balance = await erc721AHX.balanceOf(user1.address);
      expect(balance).to.equal(1);
    });

    it("should fail when non-minter tries to mint", async function () {
      await expect(
        erc721AHX.connect(user1).mint(user2.address, 1)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await erc721AHX.connect(minter).mint(user1.address, 1);
    });

    it("should allow burning of tokens by minter", async function () {
      await erc721AHX.connect(minter).mint(minter.address, 1);
      await erc721AHX.connect(minter)["burn(address,uint256[])"](user1.address, [0]);
      const balance = await erc721AHX.balanceOf(user1.address);
      expect(balance).to.equal(0);
    });

    it("should fail when non-minter tries to burn", async function () {
      await erc721AHX.connect(minter).mint(minter.address, 1);
      await expect(
        erc721AHX.connect(user1)["burn(address,uint256[])"](user1.address, [0])
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
      const balance = await erc721AHX.balanceOf(user1.address);
      expect(balance).to.equal(1);
    });
  });
  describe("Base URI Management", function () {
    it("should allow the admin to update the base URI", async function () {
      const newBaseURI = "https://localhost:3001/buddynft/v1/";
      await erc721AHX.setBaseURI(newBaseURI);
      const updatedBaseURI = await erc721AHX.baseURI();
      expect(updatedBaseURI).to.equal(newBaseURI);
    });

    it("should prevent non-admins from updating the base URI", async function () {
      const newBaseURI = "https://localhost:3001/buddynft/v1/";
      await expect(
        erc721AHX.connect(user1).setBaseURI(newBaseURI)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
      await expect(
        erc721AHX.connect(minter).setBaseURI(newBaseURI)
      ).to.be.revertedWith(
        `AccessControl: account ${minter.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
    });
  });

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await erc721AHX.grantRole(
        await erc721AHX.MINTER_ROLE(),
        minter.address
      );
    });

    it("should fail to mint zero tokens", async function () {
      await expect(erc721AHX.connect(minter).mint(user1.address, 0)).to.be
        .reverted;
    });

    it("should fail to burn a token not owned by the caller", async function () {
      await erc721AHX.connect(minter).mint(user1.address, 1);
      await expect(erc721AHX.connect(user2)["burn(address,uint256[])"](user1.address, [1])).to.be
        .reverted;
    });

    it("should maintain consistency when burning multiple tokens", async function () {
      await erc721AHX.connect(minter).mint(user1.address, 2);
      await erc721AHX.connect(minter)["burn(address,uint256[])"](user1.address, [0, 1]);

      const totalSupplyAfterBurn = await erc721AHX.totalSupply();
      expect(totalSupplyAfterBurn).to.equal(0);
    });
  });

  describe("Potential Attack Vectors", function () {
    it("should immediately revoke a role when requested", async function () {
      await erc721AHX.grantRole(
        await erc721AHX.MINTER_ROLE(),
        minter.address
      );
      await erc721AHX.revokeRole(
        await erc721AHX.MINTER_ROLE(),
        minter.address
      );
      const isMinter = await erc721AHX.hasRole(
        await erc721AHX.MINTER_ROLE(),
        minter.address
      );
      expect(isMinter).to.be.false;
    });
  });

  describe("Token URI", function () {
    beforeEach(async function () {
      // Assuming the minter role has already been granted to the minter address in a previous test or the beforeEach block
      await erc721AHX.connect(minter).mint(user1.address, 1);
    });

    it("should return the correct token URI for a given token", async function () {
      const baseURI = await erc721AHX.baseURI();
      const tokenId = 0;
      const expectedTokenURI = `${baseURI}${tokenId}`;

      const actualTokenURI = await erc721AHX.tokenURI(tokenId);

      expect(actualTokenURI).to.equal(expectedTokenURI);
    });

    it("should revert for a non-existent token", async function () {
      const nonExistentTokenId = 999; // Assuming this token ID has not been minted
      await expect(erc721AHX.tokenURI(nonExistentTokenId)).to.be.reverted;
    });
  });

  describe("ERC721 Compliance", function () {
    it("supports ERC721 interface", async function () {
      // ERC721 interface ID is 0x80ac58cd
      expect(await erc721AHX.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("supports ERC721 Metadata extension", async function () {
      // ERC721 Metadata extension interface ID is 0x5b5e139f
      expect(await erc721AHX.supportsInterface("0x5b5e139f")).to.be.true;
    });

    it("does not support a random interface", async function () {
      // Using a random interface ID to check that supportsInterface returns false for unsupported interfaces
      expect(await erc721AHX.supportsInterface("0xabcdef12")).to.be.false;
    });
  });
});
