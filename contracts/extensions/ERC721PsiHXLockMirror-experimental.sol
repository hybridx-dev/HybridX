// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../hybridX/ERC721PsiHX.sol";

abstract contract ERC721PsiHXLockMirror is ERC721PsiHX, IERC721Receiver {
    address public srcNFT;
    mapping(uint256 hxTokenId => uint256 srcTokenId) public tokenIdMap;
    uint256[] public unallocatedSrcTokenIds;

    event LockMint(
        uint256 indexed locked,
        address indexed nftContract,
        uint256 indexed mint
    );

    event BurnRelease(
        uint256 indexed burn,
        address indexed nftContract,
        uint256 indexed release
    );

    function getTokenIdMapping(
        uint256 hxTokenId
    ) public view returns (uint256) {
        return _getTokenIdMapping(hxTokenId);
    }

    function _getTokenIdMapping(
        uint256 hxTokenId
    ) internal view returns (uint256) {
        require(
            hxTokenId < _nextTokenId(),
            "ERC721HXLockMirror: Invalid token id"
        );

        return tokenIdMap[hxTokenId];
    }

    function _setTokenIdMapping(
        uint256 hxTokenId,
        uint256 srcTokenId
    ) internal {
        require(
            hxTokenId < _nextTokenId(),
            "ERC721HXLockMirror: Invalid token id"
        );

        tokenIdMap[hxTokenId] = srcTokenId;
    }

    function _unsetTokenIdMapping(uint256 hxTokenId) internal {
        require(
            hxTokenId < _nextTokenId(),
            "ERC721HXLockMirror: Invalid token id"
        );

        delete tokenIdMap[hxTokenId];
    }

    function setSrcNFT(address _srcNFT) public onlyRole(DEFAULT_ADMIN_ROLE) {
        srcNFT = _srcNFT;
    }

    function lockMint(uint256 _srcTokenId) public {
        uint256 nextTokenId = _nextTokenId();

        IERC721(srcNFT).transferFrom(_msgSender(), address(this), _srcTokenId);

        _setTokenIdMapping(nextTokenId, _srcTokenId);

        _safeMint(_msgSender(), 1);

        emit LockMint(_srcTokenId, srcNFT, nextTokenId);
    }

    function burnRelease(uint256 _hxTokenId) public {
        require(
            _msgSender() == ownerOf(_hxTokenId),
            "ERC721HXLockMirror: Not token owner"
        );

        uint256 srcTokenId = _getTokenIdMapping(_hxTokenId);

        _burn(_hxTokenId);

        IERC721(srcNFT).transferFrom(address(this), _msgSender(), srcTokenId);

        _unsetTokenIdMapping(_hxTokenId);

        emit BurnRelease(_hxTokenId, srcNFT, srcTokenId);
    }

    function mint(
        address target,
        uint256 quantity
    ) external override onlyRole(MINTER_ROLE) {
        uint256 lastIndex = unallocatedSrcTokenIds.length;
        uint256 srcTokenId = unallocatedSrcTokenIds[lastIndex - 1];
        unallocatedSrcTokenIds.pop();

        uint256 nextTokenId = _nextTokenId();

        _setTokenIdMapping(nextTokenId, srcTokenId);

        _safeMint(target, quantity);
    }

    function burn(
        address origin,
        uint256[] calldata ids
    ) external override onlyRole(MINTER_ROLE) {
        uint256 pre = totalSupply();
        for (uint i = 0; i < ids.length; i++) {
            require(origin == ownerOf(ids[i]), "ERC721AHX: Not token owner");
            uint256 srcTokenId = _getTokenIdMapping(tokenIdMap[ids[i]]);

            unallocatedSrcTokenIds.push(srcTokenId);

            _unsetTokenIdMapping(tokenIdMap[ids[i]]);

            _burn(ids[i]);
        }
        uint256 post = totalSupply();

        require(pre - post == ids.length, "ERC721AHX: Burning error");
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        return IERC721Metadata(srcNFT).tokenURI(_getTokenIdMapping(id));
    }

    function name() public view override returns (string memory) {
        return IERC721Metadata(srcNFT).name();
    }

    function symbol() public view override returns (string memory) {
        return IERC721Metadata(srcNFT).symbol();
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
