// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SimpleERC721LockMirror is ERC721 {
    constructor() ERC721("SimpleERC721", "SimpleERC721") {
        _mint(_msgSender(), 1);
        _mint(_msgSender(), 2);
        _mint(_msgSender(), 3);
        _mint(_msgSender(), 4);
        _mint(_msgSender(), 5);
        _mint(_msgSender(), 6);
        _mint(_msgSender(), 7);
        _mint(_msgSender(), 8);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://kongz.herokuapp.com/api/metadata/";
    }
}
