// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC404} from "./erc404/ERC404.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ERC404Example is ERC404, Context {
    constructor() ERC404("Example", "EXM", 18, 10_000, _msgSender()) {
        balanceOf[_msgSender()] = totalSupply;
    }

    function tokenURI(uint256 id) public pure override returns (string memory) {
        return Strings.toString(id);
    }
}

contract MockAccount is IERC721Receiver {
    function transfer(address erc404contract, address to, uint256 amount) public {
        ERC404Example(erc404contract).transfer(to, amount);
    }

    function transferNFT(
        address erc404contract,
        address to,
        uint256[] calldata ids
    ) public {
        for (uint i = 0; i < ids.length; i++) {
            ERC404Example(erc404contract).transferFrom(address(this), to, ids[i]);
        }
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract ERC404Benchmark {
    ERC404Example erc404Example;
    MockAccount mockAccount0 = new MockAccount();
    MockAccount mockAccount1 = new MockAccount();

    constructor() {}

    function benchmarkContractDeployment() public {
        erc404Example = new ERC404Example();
    }

    function benchmarkContractSetup() public {
        erc404Example.setWhitelist(address(this), true);
    }

    function benchmarkTransferFTAndMint25NFTs_0_0() public {
        erc404Example.transfer(address(mockAccount0), 25 * 10 ** 18); 
    }

    function benchmarkTransferFTAndMint25NFTs_1_0() public {
        erc404Example.transfer(address(mockAccount1), 25 * 10 ** 18); 
    }

    function benchmarkTransferFTAndMint25NFTs_0_1() public {
        erc404Example.transfer(address(mockAccount0), 25 * 10 ** 18); 
    }

    function benchmarkBurn25NFTTransferFTAndMint25NFTs_0() public {
        mockAccount0.transfer(
            address(erc404Example),
            address(mockAccount1),
            25 * 10 ** 18
        ); 
    }

    function benchmarkBurn25NFTTransferFTAndMint25NFTs_1() public {
        mockAccount1.transfer(
            address(erc404Example),
            address(mockAccount0),
            25 * 10 ** 18
        ); 
    }

    function benchmarkTransferFT_0() public {
        erc404Example.transfer(address(mockAccount0), 0.998 * 10 ** 18);
    }

    function benchmarkMintNFT() public {
        erc404Example.transfer(address(mockAccount0), 1 * 10 ** 18); 
    }

    function benchmarkTransferNFT() public {
        uint256[] memory ids = new uint256[](1);
        for (uint256 i = 0; i < ids.length; i++) {
            ids[i] = 125 + i;
        }

        mockAccount0.transferNFT(address(erc404Example), address(mockAccount1), ids);
    }

    function benchmarkTransfer25NFTs() public {
        uint256[] memory ids = new uint256[](25);
        for (uint256 i = 0; i < ids.length; i++) {
            ids[i] = 1 + i;
        }

        mockAccount0.transferNFT(address(erc404Example), address(mockAccount1), ids);
    }

    function benchmarkBurn25NFTsAndTransferFT() public {
        uint256[] memory ids = new uint256[](25);
        for (uint256 i = 0; i < ids.length; i++) {
            ids[i] = 1 + i;
        }

        mockAccount1.transferNFT(
            address(erc404Example),
            address(this),
            ids
        );
    }
}
