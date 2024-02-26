// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../hybridX/interfaces/IERC20HX.sol";
import "hardhat/console.sol";

contract BurnReentranceTest {
    IERC20HX public targetContract;
    uint256 public reentryAttempts = 0;

    constructor(address _targetContract) {
        targetContract = IERC20HX(_targetContract);
    }

    // Fallback function used to attempt re-entry
    receive() external payable {
        reentryAttempts += 1;
        uint256[] memory params = new uint256[](reentryAttempts);
        params[0] = reentryAttempts;
        console.log(reentryAttempts);
        targetContract.burnNFT{value: msg.value}(params);
    }

    function attack(uint256[] calldata nftIds) external payable {
        targetContract.burnNFT{value: msg.value/2}(nftIds);
    }
}