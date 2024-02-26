// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ERC20HX.sol";

abstract contract ERC20HXBurnFee is ERC20HX {
    struct BurnFeeInfo {
        address receiver;
        uint96 fraction;
    }

    BurnFeeInfo private _burnFeeInfo;

    function _feeDenominator() internal pure virtual returns (uint96) {
        return 10000;
    }

    function _setBurnFee(address receiver, uint96 feeNumerator) internal virtual {
        require(feeNumerator <= _feeDenominator(), "ERC20HXBurnFee: Exceeds amounts");
        require(receiver != address(0), "ERC20HXBurnFee: Invalid parameters");

        _burnFeeInfo = BurnFeeInfo(receiver, feeNumerator);
    }

    function setBurnFee(address receiver, uint96 feeNumerator) public virtual onlyOwner() {
        _setBurnFee(receiver, feeNumerator);
    }

    function burnFee(uint256 amount) public view virtual returns (address, uint256) {
        uint256 burnFeeAmount = (amount * _burnFeeInfo.fraction) / _feeDenominator();

        return (_burnFeeInfo.receiver, burnFeeAmount);
    }

    function _burnNFTFrom(
        address owner,
        address to,
        uint256[] calldata nftIds
    ) internal override {
        uint256 amountFT = (nftIds.length) * 10 ** decimals();
        (address feeReceiver, uint256 amountFeeFT) = burnFee(amountFT);

        nftContract.burn(owner, nftIds);
        ERC20._mint(to, amountFT - amountFeeFT);
        ERC20._mint(feeReceiver, amountFeeFT);

        emit BurnNFT(owner, nftIds);
    }
}