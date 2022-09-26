// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev simply create a Mock version of the Dai token for testing purposes
 *      functions transfer and transferFrom are overriten to fit the Dai token
 *      added public mint and burn for simplicity
 */
contract DaiTokenMock is ERC20 {
    constructor() ERC20("DaiToken", "Dai") {
        _mint(msg.sender, 20000);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }

    function transfer(address dst, uint wad) public override returns (bool) {
        _transfer(msg.sender, dst, wad);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }
}
