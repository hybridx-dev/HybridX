// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC721.sol";

interface IERC721HX is IERC721 {
    function MINTER_ROLE() external returns (bytes32);

    /**
     * @dev Mints `quantity` tokens and assigns them to `target`, increasing
     * the total supply.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address target, uint256 quantity) external;

    /**
     * @dev Burns `ids` tokens from `origin`, decreasing the total supply.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     * - `origin` must be the owner of the tokens in `ids`.
     */
    function burn(address origin, uint256[] calldata ids) external;

    /**
     * @dev Sets the Minter role to ERC20HX contract address
     *
     * Requirements:
     *
     * - the caller must have the `DEFAULT_ADMIN_ROLE` or `Owner`.
     * - `ftContractAddress` must be the ERC20HX contract address.
     */
    function setMinterRole(address ftContractAddress) external;
}
