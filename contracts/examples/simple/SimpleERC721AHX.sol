// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../hybridX/ERC721AHX.sol";

contract SimpleERC721AHX is ERC721AHX {
    constructor(
        address _defaultAdmin,
        address _ftContractAddress,
        string memory _tokenBaseURI
    ) ERC721A("SimpleERC721AHX", "SimpleERC721AHX") {
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(MINTER_ROLE, _ftContractAddress);
        _setBaseURI(_tokenBaseURI);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721AHX) returns (bool) {
        return ERC721AHX.supportsInterface(interfaceId);
    }
}
