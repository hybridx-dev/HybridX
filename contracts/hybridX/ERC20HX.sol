// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20HX.sol";
import "./interfaces/IERC721HX.sol";

abstract contract ERC20HX is IERC20HX, ERC20, ERC20Permit, Ownable {
    IERC721HX nftContract;

    function _setNFTContract(address _nftContract) internal {
        nftContract = IERC721HX(_nftContract);

        emit SetNFTContract(nftContract);
    }

    function setNFTContract(address _nftContract) public onlyOwner {
        _setNFTContract(_nftContract);
    }

    function getNFTContractAddress() public view returns (IERC721HX) {
        return nftContract;
    }

    function mintNFTFrom(address from, address to, uint256 amountNFT) public {
        uint256 amountFT = amountNFT * 10 ** decimals();
        require(
            allowance(from, _msgSender()) >= amountFT,
            "ERC20HX: Insufficient allowance"
        );

        _mintNFTFrom(from, to, amountNFT);
    }

    function mintNFT(uint256 amountNFT) public {
        address spender = _msgSender();
        _mintNFTFrom(spender, spender, amountNFT);
    }

    function _mintNFTFrom(
        address spender,
        address to,
        uint256 amountNFT
    ) virtual internal {
        uint256 amountFT = amountNFT * 10 ** decimals();

        ERC20._burn(spender, amountFT);
        nftContract.mint(to, amountNFT);

        emit MintNFT(to, amountNFT);
    }

    function burnNFTFrom(
        address from,
        address to,
        uint256[] calldata nftIds
    ) public {
        require(
            nftContract.isApprovedForAll(from, _msgSender()),
            "ERC20HX: NFT not approved"
        );
        address owner = from;
        _burnNFTFrom(owner, to, nftIds);
    }

    function burnNFT(uint256[] calldata nftIds) public {
        address owner = _msgSender();
        _burnNFTFrom(owner, owner, nftIds);
    }

    function _burnNFTFrom(
        address owner,
        address to,
        uint256[] calldata nftIds
    ) virtual internal {
        uint256 amountFT = (nftIds.length) * 10 ** decimals();

        nftContract.burn(owner, nftIds);
        ERC20._mint(to, amountFT);

        emit BurnNFT(owner, nftIds);
    }
}
