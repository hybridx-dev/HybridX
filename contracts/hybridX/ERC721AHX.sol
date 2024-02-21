// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC721HX.sol";
import "erc721a/contracts/ERC721A.sol";
import "erc721a/contracts/extensions/ERC721ABurnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract ERC721AHX is ERC721A, ERC721ABurnable, AccessControl {
    string public baseURI;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    function mint(
        address target,
        uint256 quantity
    ) external onlyRole(MINTER_ROLE) {
        _safeMint(target, quantity);
    }

    function burn(
        address origin,
        uint256[] calldata ids
    ) external onlyRole(MINTER_ROLE) {
        uint256 pre = totalSupply();
        for (uint i = 0; i < ids.length; i++) {
            require(origin == ownerOf(ids[i]), "ERC721AHX: Not token owner");

            _burn(ids[i]);
        }
        uint256 post = totalSupply();

        require(pre - post == ids.length, "ERC721AHX: Burning error");
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControl, ERC721A, IERC721A)
        returns (bool)
    {
        return
            ERC721A.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }

    function _exists(
        uint256 id
    ) internal view override(ERC721A) returns (bool) {
        return ERC721A._exists(id);
    }

    function totalSupply()
        public
        view
        override(ERC721A, IERC721A)
        returns (uint256)
    {
        return ERC721A.totalSupply();
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(
        string memory newBaseURI
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setBaseURI(newBaseURI);
    }

    function _setBaseURI(string memory _newBaseURI) internal virtual {
        baseURI = _newBaseURI;
    }

    function setMinterRole(
        address ftContractAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, ftContractAddress);
    }
}
