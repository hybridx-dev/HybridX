// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "erc721psi/contracts/ERC721Psi.sol";
import "erc721psi/contracts/extension/ERC721PsiBurnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IERC721HX.sol";

abstract contract ERC721PsiHX is IERC721HX, ERC721Psi, ERC721PsiBurnable, AccessControl {
    string public baseURI;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    function mint(
        address target,
        uint256 quantity
    ) external virtual onlyRole(MINTER_ROLE) {
        _safeMint(target, quantity);
    }

    function burn(
        address origin,
        uint256[] calldata ids
    ) external virtual onlyRole(MINTER_ROLE) {
        uint256 pre = totalSupply();
        for (uint i = 0; i < ids.length; i++) {
            require(origin == ownerOf(ids[i]), "ERC721PsiHX: Not token owner");

            _burn(ids[i]);
        }
        uint256 post = totalSupply();

        require(pre - post == ids.length, "ERC721PsiHX: Burning error");
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721Psi, AccessControl, IERC165) returns (bool) {
        return
            ERC721Psi.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }

    function _exists(
        uint256 id
    ) internal view override(ERC721Psi, ERC721PsiBurnable) returns (bool) {
        return ERC721PsiBurnable._exists(id);
    }

    function totalSupply()
        public
        view
        override(ERC721Psi, ERC721PsiBurnable)
        returns (uint256)
    {
        return ERC721PsiBurnable.totalSupply();
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
