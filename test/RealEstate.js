const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};
const ether = tokens;
describe("RealEstate", () => {
  let realEstate, escrow;
  let deployer, seller;
  let nftID = 1;
  let purchasePrice = ether(100);
  let escrowAmount = ether(20);
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    seller = deployer;
    buyer = accounts[1];
    inspector = accounts[2];
    lender = accounts[3];
    const RealEstate = await ethers.getContractFactory("RealEstate");
    const Escrow = await ethers.getContractFactory("Escrow");

    realEstate = await RealEstate.deploy();
    escrow = await Escrow.deploy(
      realEstate.address,
      nftID,
      purchasePrice,
      escrowAmount,
      seller.address,
      buyer.address,
      inspector.address,
      lender.address
    );
    transaction = await realEstate
      .connect(seller)
      .approve(escrow.address, nftID);
    await transaction.wait();
  });
  describe("Deployment", async () => {
    it("sends an NFT to the seller/deployer", async () => {
      expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);
    });
  });
  describe("Selling real estate", async () => {
    it("executes a successful transaction", async () => {
      expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);
      transaction = await escrow
        .connect(buyer)
        .depositEarnest({ value: escrowAmount });
      balance = await escrow.getBalance();
      console.log("Escrow Balance is:", ethers.utils.formatEther(balance));

      transaction = await escrow.connect(inspector).updateInspection(true);
      await transaction.wait();
      console.log("Inspector approved");

      transaction = await escrow.connect(buyer).approveSale();
      await transaction.wait();
      console.log("buyer approved");

      transaction = await escrow.connect(seller).approveSale();
      await transaction.wait();
      console.log("seller approved");

      transaction = await lender.sendTransaction({
        to: escrow.address,
        value: ether(80),
      });

      transaction = await escrow.connect(lender).approveSale();
      await transaction.wait();
      console.log("lender approved");

      transaction = await escrow.connect(buyer).finalizeSale();
      await transaction.wait();
      console.log("Buyer finalizes sale");

      expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address);

      balance = await ethers.provider.getBalance(seller.address);
      console.log("Seller balance:", ethers.utils.formatEther(balance));
      expect(balance).to.be.above(ether(10099));
    });
  });
});
