// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../hybridX/ERC20HX.sol";

abstract contract ERC20HXBurnTaxable is ERC20HX {
    struct BurnTaxInfo {
        address receiver;
        uint96 fraction;
    }

    BurnTaxInfo private _burnTaxInfo;

    function _feeDenominator() internal pure virtual returns (uint96) {
        return 10000;
    }

    function _setBurnTax(address receiver, uint96 feeNumerator) internal virtual {
        require(feeNumerator <= _feeDenominator(), "ERC20HXBurnTax: Exceeds amounts");
        require(receiver != address(0), "ERC20HXBurnTax: Invalid parameters");

        _burnTaxInfo = BurnTaxInfo(receiver, feeNumerator);
    }

    function setBurnTax(address receiver, uint96 feeNumerator) public virtual onlyOwner() {
        _setBurnTax(receiver, feeNumerator);
    }

    function burnFee(uint256 amount) public view virtual returns (address, uint256) {
        uint256 burnFeeAmount = (amount * _burnTaxInfo.fraction) / _feeDenominator();

        return (_burnTaxInfo.receiver, burnFeeAmount);
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