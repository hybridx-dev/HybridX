// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../hybridX/ERC721PsiHXLockMirror-experimental.sol";

contract SimpleERC721PsiHXLockMirror is ERC721PsiHXLockMirror {
    constructor(
        address _defaultAdmin,
        address _srcNFT
    ) ERC721Psi("SimpleERC721PsiHXLockMirror", "SimpleERC721PsiHXLockMirror") {
        srcNFT = _srcNFT;
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    }
}