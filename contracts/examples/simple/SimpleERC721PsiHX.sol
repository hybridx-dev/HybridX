// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../hybridX/ERC721PsiHX.sol";

contract SimpleERC721PsiHX is ERC721PsiHX {
    constructor(
        address _defaultAdmin,
        address _ftContractAddress,
        string memory _tokenBaseURI
    ) ERC721Psi("SimpleERC721PsiHX", "SimpleERC721PsiHX") {
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(MINTER_ROLE, _ftContractAddress);
        _setBaseURI(_tokenBaseURI);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721PsiHX) returns (bool) {
        return ERC721PsiHX.supportsInterface(interfaceId);
    }
}
