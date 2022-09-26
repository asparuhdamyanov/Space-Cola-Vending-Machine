const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { assert, expect } = require("chai");
const { ethers } = require("hardhat");
const { assertHardhatInvariant } = require("hardhat/internal/core/errors");

describe("The Cola Machine", function () {
  async function deployColaMachineFixture() {
    let DaiAddress = "0xaD6Db97C844Ec7Bb4c0641d436AA0D395fDD3f45";
    const [operator1, randomAccount, randomAccount2, randomAccount3] =
      await ethers.getSigners();
    this.ColaMachine = await (
      await ethers.getContractFactory("ColaMachine")
    ).deploy(DaiAddress);
    //const colaMachine = await ColaMachine.deploy(DaiAddress);

    return {
      ColaMachine,
      operator1,
      randomAccount,
      DaiAddress,
      randomAccount2,
      randomAccount3,
    };
  }

  describe("Deployment", function () {
    it("Should give the Operator Role to the Deployer", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );
      const operatorRole = await ColaMachine.OPERATOR_ROLE();
      expect(
        await ColaMachine.hasRole(operatorRole, operator1.address)
      ).to.equal(true);
    });
    it("Should set the right Dai Token Address", async function () {
      const { ColaMachine, DaiAddress } = await loadFixture(
        deployColaMachineFixture
      );

      assert.equal(await ColaMachine.daitoken(), DaiAddress);
    });
    it("Should set the right Token Name", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);

      assert.equal(await ColaMachine.name(), "SpaceColaBottleToken");
    });
    it("Should set the right Token Symbol", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);

      assert.equal(await ColaMachine.symbol(), "SCBT");
    });
  });

  describe("Setting Price", function () {
    it("Should set the right price for a bottle of Cola in ETH and DAI", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);
      let ethPrice = 70000;
      let daiPrice = 1;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      assert.equal(await ColaMachine.checkPriceInETH(), ethPrice);
      assert.equal(await ColaMachine.checkPriceInDAI(), daiPrice);
    });
    it("Aliens can check the current price of a bottle before buying.", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );
      let daiPrice = 1;
      let ethPrice = 70000;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      await ColaMachine.checkPriceInETH();
      await ColaMachine.checkPriceInDAI();
    });
    it("Should revert if Cola Machine is not empty", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);
      let ethPrice = 70000;
      let daiPrice = 1;
      await ColaMachine.addStock(1);
      await expect(
        ColaMachine.setPrice(ethPrice, daiPrice)
      ).to.be.revertedWithCustomError(ColaMachine, "Unavailable");
    });

    it("Should revert if not called by Operator", async function () {
      const { ColaMachine, randomAccount } = await loadFixture(
        deployColaMachineFixture
      );
      let ethPrice = 70000;
      let daiPrice = 1;
      await expect(
        ColaMachine.connect(randomAccount).setPrice(ethPrice, daiPrice)
      ).to.be.revertedWith(
        "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929"
      );
    });
    it("Should emit an event for Price Change in ETH", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);
      let ethPrice = 70000;
      let daiPrice = 1;
      await expect(ColaMachine.setPrice(ethPrice, daiPrice))
        .to.emit(ColaMachine, "PriceInETHChanged")
        .withArgs(0, ethPrice);
    });
    it("Should emit an event for Price Change in DAI", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);
      let ethPrice = 70000;
      let daiPrice = 1;
      await expect(ColaMachine.setPrice(ethPrice, daiPrice))
        .to.emit(ColaMachine, "PriceInDAIChanged")
        .withArgs(0, daiPrice);
    });
  });
  describe("Adding Stock", function () {
    it("Should add stock", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);
      await ColaMachine.addStock(19);
      await expect(await ColaMachine.checkStock()).to.equal(19);
    });
    it("Aliens can check how many bottles are in stock", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);
      await ColaMachine.addStock(19);
      await expect(await ColaMachine.checkStock()).to.equal(19);
      assert.equal(await ColaMachine.checkStock(), 19);
    });
    it("Should revert if Operator tries to restock more than the machine's capacity (20 bottles)", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);

      await expect(ColaMachine.addStock(21)).to.be.revertedWithCustomError(
        ColaMachine,
        "OverStocking"
      );
    });
    it("When the operator restocks the machine tokens are minted.", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);

      let contractAddress = ColaMachine.address;
      //emit Transfer(address(0), account, amount);
      await expect(ColaMachine.addStock(19))
        .to.emit(ColaMachine, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          contractAddress,
          19
        );
    });
    it("Should emit a MachineRestocked event", async function () {
      const { ColaMachine } = await loadFixture(deployColaMachineFixture);
      await expect(ColaMachine.addStock(19))
        .to.emit(ColaMachine, "MachineRestocked")
        .withArgs(19);
    });

    it("Should revert if not called by Operator", async function () {
      const { ColaMachine, randomAccount } = await loadFixture(
        deployColaMachineFixture
      );

      await expect(
        ColaMachine.connect(randomAccount).addStock(19)
      ).to.be.revertedWith(
        "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929"
      );
    });
  });
  describe("Adding Operators", function () {
    it("Should add Operators", async function () {
      const { ColaMachine, randomAccount, randomAccount2, randomAccount3 } =
        await loadFixture(deployColaMachineFixture);

      await ColaMachine.addOperator(randomAccount.address);
    });
    it("Should revert if you try to add more than 3 Operators", async function () {
      const { ColaMachine, randomAccount, randomAccount2, randomAccount3 } =
        await loadFixture(deployColaMachineFixture);

      await ColaMachine.addOperator(randomAccount.address);
      await ColaMachine.addOperator(randomAccount2.address);

      await expect(
        ColaMachine.addOperator(randomAccount3.address)
      ).to.be.revertedWithCustomError(ColaMachine, "TooManyOperators");
    });
    it("Should revert if not called by Operator", async function () {
      const { ColaMachine, randomAccount } = await loadFixture(
        deployColaMachineFixture
      );

      await expect(
        ColaMachine.connect(randomAccount).addStock(19)
      ).to.be.revertedWith(
        "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929"
      );
    });
    it("Should revert if try to add/remove your own address from the Operator role", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );

      await expect(
        ColaMachine.addOperator(operator1.address)
      ).to.be.revertedWithCustomError(ColaMachine, "CantManageYourself");
    });
  });
  describe("Buying Space Cola with Ethereum", function () {
    it("Successfully buys a bottle of Cola and updates parameters", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );
      let daiPrice = 1;
      let ethPrice = 70000;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      await ColaMachine.addStock(19);
      let _value = ethPrice;
      await expect(ColaMachine.buyColaETH(1, { value: _value }));
      assert.equal(await ColaMachine.colaBought(operator1.address), 1);
      assert.equal(await ColaMachine.checkBottlesSold(), 1);
      assert.equal(await ColaMachine.balanceOf(operator1.address), 1);
      assert.equal(await ColaMachine.checkStock(), 18);
    });
    it("Buying 1 bottle of Cola should emit a SCBT token Transfer event", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );
      let daiPrice = 1;
      let ethPrice = 70000;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      await ColaMachine.addStock(19);
      let _value = ethPrice;
      await expect(ColaMachine.buyColaETH(1, { value: _value }))
        .to.emit(ColaMachine, "Transfer")
        .withArgs(ColaMachine.address, operator1.address, 1);
    });
    it("Buying != 5) bottles of Cola should emit a BuyCola event", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );
      let daiPrice = 1;
      let ethPrice = 70000;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      await ColaMachine.addStock(19);
      let _value = ethPrice;
      await expect(ColaMachine.buyColaETH(1, { value: _value }))
        .to.emit(ColaMachine, "BuyCola")
        .withArgs(operator1.address, 1);
    });
    it("Reverts when you try to input 0 as buying amount", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );

      await expect(ColaMachine.buyColaETH(0)).to.be.revertedWithCustomError(
        ColaMachine,
        "InvalidAmount"
      );
    });
    it("Reverts when you try to buy more cola, then it's available", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );

      await expect(ColaMachine.buyColaETH(21)).to.be.revertedWithCustomError(
        ColaMachine,
        "NotEnoughStock"
      );
    });
    it("Successfully buys 5 bottles of Cola on a discount", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );
      let daiPrice = 1;
      let ethPrice = 70000;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      await ColaMachine.addStock(19);
      let _value = ethPrice * 5;
      let _newValue = _value / 100;
      _value = _newValue * 85;
      await expect(ColaMachine.buyColaETH(5, { value: _value }));
      assert.equal(await ColaMachine.colaBought(operator1.address), 5);
      assert.equal(await ColaMachine.colaBought(operator1.address), 5);
      assert.equal(await ColaMachine.checkBottlesSold(), 5);
      assert.equal(await ColaMachine.balanceOf(operator1.address), 5);
    });
    it("Buying 5 bottles of Cola should also emit a SCBT token Transfer & BuyCola events", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );
      let daiPrice = 1;
      let ethPrice = 70000;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      await ColaMachine.addStock(19);
      let _value = ethPrice * 5;
      let _newValue = _value / 100;
      _value = _newValue * 85;
      await expect(ColaMachine.buyColaETH(5, { value: _value }))
        .to.emit(ColaMachine, "Transfer")
        .withArgs(ColaMachine.address, operator1.address, 5);
      await expect(ColaMachine.buyColaETH(5, { value: _value }))
        .to.emit(ColaMachine, "BuyCola")
        .withArgs(operator1.address, 5);
    });
    it("Reverts when you try to pay invalid amount of ETH", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );
      let daiPrice = 1;
      let ethPrice = 70000;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      await ColaMachine.addStock(19);
      let _value = ethPrice * 7;
      await expect(
        ColaMachine.buyColaETH(9, { value: _value })
      ).to.be.revertedWithCustomError(ColaMachine, "InvalidValue");
    });

    it("Operators can check how many bottles have been sold in total", async function () {
      const { ColaMachine, operator1 } = await loadFixture(
        deployColaMachineFixture
      );
      let daiPrice = 1;
      let ethPrice = 70000;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      await ColaMachine.addStock(19);
      let _value = ethPrice * 7;
      await ColaMachine.buyColaETH(7, { value: _value });
      assert.equal(await ColaMachine.checkBottlesSold(), 7);
    });
    describe("Returning bottles", function () {
      it("Aliens who previously bought Space Cola can return a bottle for 50% off their next bottle. (This can stack)", async function () {
        const { ColaMachine, operator1 } = await loadFixture(
          deployColaMachineFixture
        );
        let daiPrice = 1;
        let ethPrice = 70000;
        await ColaMachine.setPrice(ethPrice, daiPrice);
        await ColaMachine.addStock(19);
        let _value = ethPrice * 3;
        await expect(ColaMachine.buyColaETH(3, { value: _value }))
          .to.emit(ColaMachine, "BuyCola")
          .withArgs(operator1.address, 3);
        await expect(ColaMachine.returnBottle(3))
          .to.emit(ColaMachine, "BottlesReturned")
          .withArgs(operator1.address, 3);
        let _newValue = _value / 2; //105000
        assert.equal(
          await ColaMachine.addressToDiscountedAmount(operator1.address),
          3
        );
        await expect(await ColaMachine.buyColaETH(3, { value: _newValue }))
          .to.emit(ColaMachine, "PurchaseDiscounted")
          .withArgs(operator1.address, 3);
      });
      it("Aliens who previously bought Space Cola can return a bottle for 50% off their next 5 bottles + a 5 bottle discount", async function () {
        const { ColaMachine, operator1 } = await loadFixture(
          deployColaMachineFixture
        );
        let daiPrice = 1;
        let ethPrice = await ethers.utils.parseEther("0.0005");
        await ColaMachine.setPrice(ethPrice, daiPrice);
        await ColaMachine.addStock(19);
        let _value = ethPrice * 5;
        let _newValue3 = _value / 100;
        _value = _newValue3 * 85;
        await expect(ColaMachine.buyColaETH(5, { value: _value }))
          .to.emit(ColaMachine, "BuyCola")
          .withArgs(operator1.address, 5);
        await expect(ColaMachine.returnBottle(5))
          .to.emit(ColaMachine, "BottlesReturned")
          .withArgs(operator1.address, 5);
        let _newValue = _value / 2; //105000

        assert.equal(
          await ColaMachine.addressToDiscountedAmount(operator1.address),
          5
        );

        await expect(await ColaMachine.buyColaETH(5, { value: _newValue }))
          .to.emit(ColaMachine, "PurchaseDiscounted")
          .withArgs(operator1.address, 5);
      });
      it("Should revert when you try to input Invalid Amount", async function () {
        const { ColaMachine, operator1 } = await loadFixture(
          deployColaMachineFixture
        );
        let daiPrice = 1;
        let ethPrice = await ethers.utils.parseEther("0.0005");
        let _value = ethPrice * 6;
        await ColaMachine.setPrice(ethPrice, daiPrice);
        await ColaMachine.addStock(19);
        await expect(ColaMachine.returnBottle(6)).to.be.revertedWithCustomError(
          ColaMachine,
          "InvalidAmount"
        );
        await expect(ColaMachine.buyColaETH(6, { value: _value }))
          .to.emit(ColaMachine, "BuyCola")
          .withArgs(operator1.address, 6);
        await expect(ColaMachine.returnBottle(7)).to.be.revertedWithCustomError(
          ColaMachine,
          "InvalidAmount"
        );
      });
      it("When bottles are returned, the SCBT tokens are burned.", async function () {
        const { ColaMachine, operator1 } = await loadFixture(
          deployColaMachineFixture
        );
        let daiPrice = 1;
        let ethPrice = await ethers.utils.parseEther("0.0005");
        await ColaMachine.setPrice(ethPrice, daiPrice);
        await ColaMachine.addStock(19);
        let _value = ethPrice * 5;
        let _newValue3 = _value / 100;
        _value = _newValue3 * 85;
        await expect(ColaMachine.buyColaETH(5, { value: _value }))
          .to.emit(ColaMachine, "BuyCola")
          .withArgs(operator1.address, 5);
        await expect(ColaMachine.returnBottle(5))
          .to.emit(ColaMachine, "Transfer")
          .withArgs(
            operator1.address,
            "0x0000000000000000000000000000000000000000",
            5
          );
      });
    });
    describe("Should let Operators withdraw ETH ", function () {
      it("Should withdraw ETH", async function () {
        const { ColaMachine, operator1 } = await loadFixture(
          deployColaMachineFixture
        );
        let daiPrice = 1;
        let ethPrice = 70000;
        await ColaMachine.setPrice(ethPrice, daiPrice);
        await ColaMachine.addStock(19);
        let _value = ethPrice;
        await expect(ColaMachine.buyColaETH(1, { value: _value }));
        assert.equal(await ColaMachine.colaBought(operator1.address), 1);
        assert.equal(await ColaMachine.checkBottlesSold(), 1);
        assert.equal(await ColaMachine.balanceOf(operator1.address), 1);
        assert.equal(await ColaMachine.checkStock(), 18);
        /// withdrawing
        // const provider = ethers.getDefaultProvider();
        // let wallet = ColaMachine.address;
        // const balance = await provider.getBalance(wallet);
        // //let balance1 = balance.toString();
        // const balanceInEth = ethers.utils.formatEther(balance);
        // await console.log(balanceInEth.toString());

        await expect(ColaMachine.withdrawETH())
          .to.emit(ColaMachine, "Withdraw")
          .withArgs(operator1.address, 70000);
      });
    });
  });
  describe("Buying Space Cola with Dai", function () {
    async function deployDaiTestingFixture() {
      const [operator1, randomAccount, randomAccount2, randomAccount3] =
        await ethers.getSigners();

      // const Dai = await ethers.getContract("DaiTokenMock"); // Returns a new connection to the DaiTokenMock contract

      const Dai = await (
        await ethers.getContractFactory("DaiTokenMock")
      ).deploy();

      let DaiAddress = await Dai.address.toString();

      this.ColaMachine = await (
        await ethers.getContractFactory("ColaMachine")
      ).deploy(DaiAddress);
      //const colaMachine = await ColaMachine.deploy(DaiAddress);

      let daiPrice = 100;
      let ethPrice = 70000;
      await ColaMachine.setPrice(ethPrice, daiPrice);
      await ColaMachine.addStock(19);

      await Dai.approve(ColaMachine.address, 20000);

      return {
        ColaMachine,
        operator1,
        randomAccount,
        DaiAddress,
        randomAccount2,
        randomAccount3,
        Dai,
      };
    }
    it("Successfully buys a bottle of Cola with Dai and updates parameters", async function () {
      const { ColaMachine, operator1, Dai } = await loadFixture(
        deployDaiTestingFixture
      );

      // console.log(await Dai.balanceOf(operator1.address));
      assert.equal(await Dai.balanceOf(operator1.address), 20000);

      await expect(ColaMachine.buyColaDAI(1))
        .to.emit(ColaMachine, "BuyCola")
        .withArgs(operator1.address, 1);
      assert.equal(await ColaMachine.colaBought(operator1.address), 1);
      assert.equal(await ColaMachine.checkBottlesSold(), 1);
      assert.equal(await ColaMachine.balanceOf(operator1.address), 1);
      assert.equal(await ColaMachine.checkStock(), 18);

      assert.equal(await Dai.balanceOf(operator1.address), 19900);
      assert.equal(await Dai.balanceOf(ColaMachine.address), 100);
      //console.log(await ColaMachine.checkMachineDaiBalance());

      //console.log(await ColaMachine.checkMachineDaiBalance(), 1);
    });
    it("Aliens who previously bought Space Cola can with Dai can return a bottle for 50% off their next 5 bottles + a 5 bottle discount", async function () {
      const { ColaMachine, operator1, Dai } = await loadFixture(
        deployDaiTestingFixture
      );

      // console.log(await Dai.balanceOf(operator1.address));
      assert.equal(await Dai.balanceOf(operator1.address), 20000);

      await expect(ColaMachine.buyColaDAI(5))
        .to.emit(ColaMachine, "BuyCola")
        .withArgs(operator1.address, 5);

      await expect(ColaMachine.returnBottle(5))
        .to.emit(ColaMachine, "BottlesReturned")
        .withArgs(operator1.address, 5);

      assert.equal(
        await ColaMachine.addressToDiscountedAmount(operator1.address),
        5
      );

      await expect(await ColaMachine.buyColaDAI(5))
        .to.emit(ColaMachine, "PurchaseDiscounted")
        .withArgs(operator1.address, 5);
      //console.log(await ColaMachine.checkMachineDaiBalance());
    });
    describe("Should let Operators withdraw Dai", function () {
      it("Should withdraw Dai", async function () {
        const { ColaMachine, operator1, Dai } = await loadFixture(
          deployDaiTestingFixture
        );

        await expect(ColaMachine.buyColaDAI(4))
          .to.emit(ColaMachine, "BuyCola")
          .withArgs(operator1.address, 4);
        assert.equal(await Dai.balanceOf(ColaMachine.address), 400);
        await expect(ColaMachine.withdrawDAI())
          .to.emit(ColaMachine, "Withdraw")
          .withArgs(operator1.address, 400);
        assert.equal(await Dai.balanceOf(ColaMachine.address), 0);
      });
    });
  });

  describe("Removing Operators", function () {
    it("Should successfully remove Operators", async function () {
      const { ColaMachine, operator1, randomAccount } = await loadFixture(
        deployColaMachineFixture
      );
      let OPERATOR_ROLE = await ColaMachine.OPERATOR_ROLE();
      await ColaMachine.addOperator(randomAccount.address);
      await expect(
        ColaMachine.connect(randomAccount).renounceRole(
          OPERATOR_ROLE,
          operator1.address
        )
      );
    });
    it("Should revert if not called by Operator", async function () {
      const { ColaMachine, randomAccount, operator1 } = await loadFixture(
        deployColaMachineFixture
      );

      let OPERATOR_ROLE = await ColaMachine.OPERATOR_ROLE();

      await expect(
        ColaMachine.connect(randomAccount).renounceRole(
          OPERATOR_ROLE,
          operator1.address
        )
      ).to.be.revertedWith(
        "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929"
      );
    });
  });
});
