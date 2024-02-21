// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../hybridX/ERC721PsiHX.sol";
import "../hybridX/ERC20HX.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract ERC721PsiHXExample is ERC721PsiHX {
    constructor() ERC721Psi("ERC721PsiHXExample", "ERC721PsiHXExample") {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721PsiHX) returns (bool) {
        return ERC721PsiHX.supportsInterface(interfaceId);
    }
}

contract ERC20HXExample is ERC20HX {
    constructor()
        ERC20("ERC20HXExample", "ERC20HXExample")
        ERC20Permit("ERC20HXExample")
    {
        _mint(msg.sender, 10000 * 10 ** decimals());
    }
}

contract MockAccount is IERC721Receiver {
    function mint(address hxContract, uint256 amount) public {
        ERC20HXExample(hxContract).mintNFT(amount);
    }

    function burn(address hxContract, uint256[] calldata ids) public {
        ERC20HXExample(hxContract).burnNFT(ids);
    }

    function transfer(address hxContract, address to, uint256 amount) public {
        ERC20HXExample(hxContract).transfer(to, amount);
    }

    function transferNFT(address hxContract, address to, uint256[] calldata ids) public {
        for (uint i = 0; i < ids.length; i++) {
            ERC721PsiHX(hxContract).transferFrom(address(this), to, ids[i]);
        }
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns(bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract ERC20HXERC721PsiHXBenchmark {
    ERC20HXExample erc20HXExample;
    ERC721PsiHXExample erc721PsiHXExample;
    MockAccount mockAccount0 = new MockAccount();
    MockAccount mockAccount1 = new MockAccount();

    constructor() {}

    function benchmarkContractDeployment() public {
        erc721PsiHXExample = new ERC721PsiHXExample();
        erc20HXExample = new ERC20HXExample();
    }

    function benchmarkContractSetup() public {
        erc20HXExample.setNFTContract(address(erc721PsiHXExample));
        erc721PsiHXExample.setMinterRole(address(erc20HXExample));
    }

    function benchmarkTransferFTAndMint25NFTs_0_0() public {
        erc20HXExample.transfer(address(mockAccount0), 25 * 10 ** 18);
        mockAccount0.mint(address(erc20HXExample), 25); // id: 0 - 24
    }

    function benchmarkTransferFTAndMint25NFTs_1_0() public {
        erc20HXExample.transfer(address(mockAccount1), 25 * 10 ** 18);
        mockAccount1.mint(address(erc20HXExample), 25); // id: 25 - 49
    }

    function benchmarkTransferFTAndMint25NFTs_0_1() public {
        erc20HXExample.transfer(address(mockAccount0), 25 * 10 ** 18);
        mockAccount0.mint(address(erc20HXExample), 25); // id: 50 - 74
    }

    function benchmarkBurn25NFTTransferFTAndMint25NFTs_0() public {
        uint256[] memory ids = new uint256[](25);
        for (uint256 i = 0; i < 25; i++) {
            ids[i] = i;
        }

        mockAccount0.burn(
            address(erc20HXExample), 
            ids
        );
        mockAccount0.transfer(address(erc20HXExample), address(mockAccount1), 25 * 10 ** 18);
        mockAccount1.mint(address(erc20HXExample), 25); // 75 - 99
    }

    function benchmarkBurn25NFTTransferFTAndMint25NFTs_1() public {
        uint256[] memory ids = new uint256[](25);
        for (uint256 i = 0; i < 25; i++) {
            ids[i] = 25 + i;
        }

        mockAccount1.burn(
            address(erc20HXExample), 
            ids
        );
        mockAccount1.transfer(address(erc20HXExample), address(mockAccount0), 25 * 10 ** 18);
        mockAccount0.mint(address(erc20HXExample), 25); // 100 - 124
    }

    function benchmarkTransferFT_0() public {
        erc20HXExample.transfer(address(mockAccount0), 1 * 10 ** 18);
    }

    function benchmarkMintNFT() public {
        erc20HXExample.transfer(address(mockAccount0), 1 * 10 ** 18);
        mockAccount0.mint(address(erc20HXExample), 1); // 125
    }

    function benchmarkTransferNFT() public {
        uint256[] memory ids = new uint256[](1);
        for (uint256 i = 0; i < ids.length; i++) {
            ids[i] = 125 + i;
        }

        mockAccount0.transferNFT(address(erc721PsiHXExample), address(mockAccount1), ids);
    }

    function benchmarkTransfer25NFTs() public {
        uint256[] memory ids = new uint256[](25);
        for (uint256 i = 0; i < ids.length; i++) {
            ids[i] = 50 + i;
        }

        mockAccount0.transferNFT(address(erc721PsiHXExample), address(mockAccount1), ids);
    }

    function benchmarkBurn25NFTsAndTransferFT() public {
        uint256[] memory ids = new uint256[](25);
        for (uint256 i = 0; i < ids.length; i++) {
            ids[i] = 50 + i;
        }

        mockAccount1.burn(address(erc20HXExample), ids);
        mockAccount1.transfer(address(erc20HXExample), address(mockAccount1), 25 * 10 ** 18);
    }
}
