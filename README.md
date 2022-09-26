# Vending Machine Task

It is the year 3033. Humans and aliens live and thrive together in the Great Cosmic Metaverse. Aliens love the humans for their cool inventions, one of which is fizzy drinks. Having noticed the flourishing soda economy, you decide to start your own vending machine business. You want to sell bottles of Space Cola to aliens in the metaverse.

## Setup

1. `git clone`
2. `yarn`
3. `npx hardhat run scripts/deploy.js`
4. `npx hardhat test` or `yarn hardhat test`

## To run with solidity coverage:

1. `npm install --save-dev solidity-coverage`

2. `npx hardhat coverage`

\*Current coverage for the Cola Machine contract is ~ 93%

## To run with gas reporter

1. npm install hardhat-gas-reporter --save-dev

2. npx hardhat test

## Contracts

### Cola Machine.sol

Allows buying Space Cola with Eth and Dai

Implements ERC20 from ColaERC20.sol, which mints and burns SCBT tokens
when purchasing/returning bottles of Cola

Implements AccessControl for role regulation

### ColaERC20.sol

Implements IERC20 contract logic

### DaiTokenMock.sol

A mock contract used for creating local tests.

## To add Slither:

https://github.com/crytic/slither#how-to-install

To run:

```
slither .
```
