// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../hybridX/ERC20HX.sol";

contract SimpleERC20HXLockMirror is ERC20HX {
    constructor(
        address _nftContractAddress
    ) ERC20("SimpleERC20HX", "SimpleERC20HX") ERC20Permit("SimpleERC20HX") {
        // _mint(msg.sender, 10000 * 10 ** decimals());
        _setNFTContract(_nftContractAddress);
    }
}
