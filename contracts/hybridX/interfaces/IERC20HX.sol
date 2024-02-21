// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./IERC721HX.sol";

interface IERC20HX is IERC20 {
    // Events
    event MintNFT(address indexed from, uint256 amount);
    event BurnNFT(address indexed from, uint256[] ids);
    event SetNFTContract(IERC721HX nftContract);
    
    // Function to get the NFT contract address associated with the ERC20HX contract
    function getNFTContractAddress() external view returns (IERC721HX);

    // Mint NFT by burning ERC20 tokens
    function mintNFTFrom(address from, address to, uint256 amountNFT) external;

    // Mint NFT for the sender by burning sender's ERC20 tokens
    function mintNFT(uint256 amountNFT) external;

    // Burn NFTs from a specified address and credit ERC20 tokens to another address
    function burnNFTFrom(address from, address to, uint256[] calldata nftIds) external;

    // Burn sender's NFTs and credit ERC20 tokens to the sender
    function burnNFT(uint256[] calldata nftIds) external;
}
