// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../hybridX/ERC20HX.sol";

/* assume fees to be paid in ETH */
abstract contract ERC20HXFees is ERC20HX, ReentrancyGuard {
    uint256 feeUnitAmount;

    struct FeesInfo {
        address payable receiver;
        uint96 weight;
    }

    FeesInfo[] public feesInfo;

    function _totalWeight() internal view virtual returns (uint96) {
        uint96 totalWeight = 0; 
        for (uint i = 0; i < feesInfo.length; i++) totalWeight += feesInfo[i].weight;

        return totalWeight;
    }

    function _pushFeeInfo(address payable receiver, uint96 feeNumerator) internal virtual {
        require(receiver != address(0), "ERC20HXFees: Invalid parameters");

        feesInfo.push(FeesInfo(receiver, feeNumerator));
    }

    function pushFeeInfo(address payable[] calldata receivers, uint96[] calldata weights) public virtual onlyOwner() {
        require(receivers.length == weights.length, "ERC20HXFees: receivers length must be equal to feeumerators");
        
        for (uint i = 0; i < receivers.length; i++) _pushFeeInfo(receivers[i], weights[i]);
    }

    function deleteFeeInfo() public virtual onlyOwner {
        delete feesInfo;
    }

    function setFeeUnitAmount(uint256 weiFormatAmount) public onlyOwner() {
        feeUnitAmount = weiFormatAmount;
    }

    function burnFee(uint256 amount) public view virtual returns (uint256) {
        uint256 burnFeeAmount = (amount * feeUnitAmount);

        return burnFeeAmount;
    }

    function _handleFeesEth(uint256 _burnFee) private {
        require(msg.value >= _burnFee, "ERC20HXFees: Insufficient fees");

        if(msg.value > _burnFee) {
            uint256 refund = (msg.value - _burnFee);
            (bool sent, ) = _msgSender().call{value: refund}("");

            require(sent, "ERC20HXFees: Failure to refund");
        }

        uint256 totalWeight = _totalWeight();
        for(uint i = 0; i < feesInfo.length; i++) {
            uint256 recv = (_burnFee * feesInfo[i].weight) / totalWeight;
            (bool sent, ) = (feesInfo[i].receiver).call{value: recv}("");

            require(sent, "ERC20HXFees: Failure to transfer ETH");
        }
    }

    function burnNFT(uint256[] calldata nftIds) payable override public nonReentrant() {
        uint256 _burnFee = burnFee(nftIds.length);

        _handleFeesEth(_burnFee);

        address owner = _msgSender();
        _burnNFTFrom(owner, owner, nftIds);
    }
}