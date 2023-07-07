// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// import "./FlashLoanReceiver.sol";

interface IReceiver {
    function receiveTokens(address tokenAddress, uint256 amount) external;
}

contract FlashLoan is ReentrancyGuard {
    using SafeMath for uint256;
    Token public token;
    uint256 public poolBalance;

    constructor(address _tokenAddress) {
        token = Token(_tokenAddress);
    }

    function depositTokens(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Must deposit at least one token.");
        token.transferFrom(msg.sender, address(this), _amount);
        poolBalance = poolBalance.add(_amount);
    }

    function flashLoan(uint256 _borrowAmount) external nonReentrant {
        require(_borrowAmount > 0, "Must deposit at least one token");
        uint256 balanceBefore = token.balanceOf(address(this));
        console.log("Before balance = ", balanceBefore);
        require(balanceBefore >= _borrowAmount, "Not enough tokens in pool.");
        // console.log("Borrow Amount", _borrowAmount);
        assert(poolBalance == balanceBefore);
        //send tokens to receiver
        token.transfer(msg.sender, _borrowAmount);
        //Use loan, get paid back
        IReceiver(msg.sender).receiveTokens(address(token), _borrowAmount);
        uint256 balanceAfter = token.balanceOf(address(this));
        require(balanceAfter >= balanceBefore, "FlashLoan has been paid back.");
        console.log("balance after: ", balanceAfter);
        //Ensure loan paid back
    }
}
