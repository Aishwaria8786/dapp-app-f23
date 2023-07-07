const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reentrancy", () => {
  let deployer;
  let bank, attackerContract;
  beforeEach(async () => {
    // accounts = await ethers.getSigners();
    // deployer = accounts[0];
    // user = accounts[1];
    // attacker = accounts[2];
    [deployer, user, attacker] = await ethers.getSigners();
    const Bank = await ethers.getContractFactory("Bank", deployer);
    bank = await Bank.deploy();
    await bank.deposit({ value: ethers.utils.parseEther("100") });
    await bank.connect(user).deposit({ value: ethers.utils.parseEther("50") });

    const Attacker = await ethers.getContractFactory("Attacker", attacker);
    attackerContract = await Attacker.deploy(bank.address);
  });
  describe("Facilitates deposits and withdraws", () => {
    it("accepts deposits", async () => {
      //Check deposit balance
      const deployerBalance = await bank.balanceOf(deployer.address);
      const userBalance = await bank.balanceOf(user.address);
      expect(deployerBalance).to.equal(ethers.utils.parseEther("100"));
      expect(userBalance).to.equal(ethers.utils.parseEther("50"));
    });
    it("accepts withdraws", async () => {
      await bank.withdraw();
      const deployerBalance = await bank.balanceOf(deployer.address);
      const userBalance = await bank.balanceOf(user.address);

      expect(deployerBalance).to.eq(0);
      expect(userBalance).to.eq(ethers.utils.parseEther("50"));
    });
    it("Allows attacker to drain funds from #withdraw()", async () => {
      console.log("***Before***");
      console.log(
        `Bank Balance: ${ethers.utils.formatEther(
          await ethers.provider.getBalance(bank.address)
        )}`
      );
      console.log(
        `Attacker Balance: ${ethers.utils.formatEther(
          await ethers.provider.getBalance(attacker.address)
        )}`
      );
      //Perform attack
      await attackerContract.attack({ value: ethers.utils.parseEther("10") });
      console.log("***After***");
      console.log(
        `Bank Balance: ${ethers.utils.formatEther(
          await ethers.provider.getBalance(bank.address)
        )}`
      );
      console.log(
        `Attacker Balance: ${ethers.utils.formatEther(
          await ethers.provider.getBalance(attacker.address)
        )}`
      );

      expect(await ethers.provider.getBalance(bank.address)).to.eq(0);
    });
  });
});
