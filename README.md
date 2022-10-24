## https://spacecolavendingmachine.web.app/#/
# The Space Cola Vending Machine
Payments with ETH and Dai, ERC20, Ethers, Chai, OpenZeppelin libraries and much more!
## Storyline
**It is the year 3033. Humans and aliens live and thrive together in the Great Cosmic Metaverse.**

**Aliens love the humans for their cool inventions, one of which is fizzy drinks.**

**Having noticed the flourishing soda economy, you decide to start your own vending machine business.**

**You want to sell bottles of Space Cola to aliens in the metaverse...**

## Technologies

* **ERC20** tokens representing cola bottles! They are minted and burned by the machine.

* Implemented **Dai** and created a Dai Mock for testing

* Added **OpenZeppelin**'s **SafeERC20** for *Dai* token and future Stablecoin transfers. (some of which are non ERC20 complient!)

* Implemented **OpenZeppelin**'s **Acess Control** for Operators

* **Hardhat** enviroment. **Ethers.js** , **Chai** , **Slither**, **Gas reporter**
<br>Thorough Hardhat tests, covering 93%.<br>
Smart contract best practices and patterns are used.

## Implementation
**The Space Cola Vending Machine consists of 3 entities The Vending Machine, The Aliens and The Operators.**

The Cola Machine is a Solidity smart contract that implements the following functionality:

#### The Machine:

* It should accommodate for 2 types of users: operators and aliens.

* The Cola Machine sells bottles of Space Cola. 

* The Cola Machine holds up to 20 bottles.

* The Cola Machine keeps track of who bought how many bottles.

* Bottles can also be bought with DAI. This price does not need to reflect current market conditions. 

* Bottles of Space Cola are represented by an **ERC20** token.
  *  For each bottle, aliens receive a token. When bottles are returned, the tokens are burned. 
  *  When the operator restocks the machine tokens are minted. 
  *  Implemented via the ERC20 interface.

#### Operators:

* Initially there is one operator - you, the deployer of the contract.

* An operator can add another operator or remove an existing operator, but not themselves.

* There can be up to 3 operators at the same time.

* An operator can stock the Cola Machine at any time, increasing the number of bottles available.

* Operators can set the price of a bottle in ETH but only when the Cola Machine is empty.

* Operators can withdraw their profits from the Cola Machine.

* Operators can check how many bottles have been sold in total.

* Operators can withdraw the ETH and DAI.

#### Aliens:

* Aliens can check how many bottles are in stock.

* Aliens can check the current price of a bottle before buying.

* Aliens can buy a bottle of Space Cola with ETH.

* Aliens can buy 5 bottles at once and get a 15% discount.



## Notes

Dai token is ERC20 complient, so SafeERC20 is not necessary needed.

Implementation is aimed at scaling for future stablecoin updates like Teather and increasing overall security.

Currently the machine is ERC20 complient, but Operators must know that it's intended for Dai only.

Have fun and remember to initialize the correct Dai token address!
<br>~~*DANGER THE MACHINE DOES A LOT OF MATH o_O*~~ <br>

## Contracts

### Cola Machine.sol

Implements main logic.

### ColaERC20.sol

Implements IERC20 contract logic

### DaiTokenMock.sol

A mock contract used for creating local tests.

Contracts and Natspec:
https://spacecolavendingmachine.web.app/#/

## Setup

1. `git clone`
2. `yarn`
3. `npx hardhat run scripts/deploy.js`
4. `npx hardhat test` or `yarn hardhat test`

## To run with solidity coverage:

1. `npm install --save-dev solidity-coverage`

2. `npx hardhat coverage`



## To run with gas reporter

1. npm install hardhat-gas-reporter --save-dev

2. npx hardhat test


## To add Slither:

https://github.com/crytic/slither#how-to-install

To run:

```
slither .
```
