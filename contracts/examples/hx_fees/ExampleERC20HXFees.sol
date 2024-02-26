// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../extensions/ERC20HXFees.sol";

contract ExampleERC20HXFees is ERC20HXFees {
    constructor(
        address _nftContractAddress
    ) ERC20("ExampleERC20HXFees", "ExampleERC20HXFees") ERC20Permit("ExampleERC20HXFees") {
        _mint(msg.sender, 10000 * 10 ** decimals());
        _setNFTContract(_nftContractAddress);
    }
}
