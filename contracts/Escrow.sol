// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

contract Escrow {
    address public nftAddress;
    uint256 public nftID;
    uint256 public purchasePrice;
    uint256 public escrowAmount;
    address payable public seller;
    address payable public buyer;
    address public inspector;
    address public lender;

    bool public inspectionPassed = false;
    mapping(address => bool) public approval;

    modifier onlyBuyer() {
        require(msg.sender == buyer, "You can't pay.");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "You can't inspect.");
        _;
    }

    receive() external payable {}

    constructor(
        address _nftAddress,
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount,
        address payable _seller,
        address payable _buyer,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        nftID = _nftID;
        purchasePrice = _purchasePrice;
        escrowAmount = _escrowAmount;
        seller = _seller;
        buyer = _buyer;
        inspector = _inspector;
        lender = _lender;
    }

    function updateInspection(bool _passed) public onlyInspector {
        inspectionPassed = _passed;
    }

    function depositEarnest() public payable onlyBuyer {
        require(msg.value >= escrowAmount, "Less money");
    }

    function approveSale() public {
        approval[msg.sender] = true;
    }

    function canselSale() public {
        if (inspectionPassed == false) {
            payable(buyer).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function finalizeSale() public {
        require(inspectionPassed, "Must pass inspection.");
        require(approval[buyer], "Must be approved by buyer.");
        require(approval[seller], "Must be approved by seller.");
        require(approval[lender], "Must be approved by lender.");
        require(address(this).balance >= purchasePrice);
        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success);
        IERC721(nftAddress).transferFrom(seller, buyer, nftID);
    }
}
