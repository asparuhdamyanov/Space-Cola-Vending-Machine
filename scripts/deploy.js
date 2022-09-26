const { ethers } = require("hardhat");

async function main() {
  [deployer] = await ethers.getSigners();

  const Dai = await (await ethers.getContractFactory("DaiTokenMock")).deploy();
  console.log(
    "  >>> Dai Token Mock deployed to:                         ",
    Dai.address
  );

  let DaiAddress = await Dai.address.toString();

  const ColaMachine = await (
    await ethers.getContractFactory("ColaMachine")
  ).deploy(DaiAddress);
  console.log(
    "  >>> Cola Machine deployed to:                         ",
    ColaMachine.address
  );
  console.log("Dear operator, remember to setPrice() and addStock()..!");
  //   let daiPrice = 100;
  //   let ethPrice = 70000;
  //   await ColaMachine.setPrice(ethPrice, daiPrice);
  //   await ColaMachine.addStock(19);

  //   await Dai.approve(ColaMachine.address, 20000);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
