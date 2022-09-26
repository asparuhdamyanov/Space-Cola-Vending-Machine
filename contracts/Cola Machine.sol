// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ColaERC20.sol";

error CantManageYourself();
error TooManyOperators();
error OverStocking();
error NotEnoughStock();
error InvalidAmount();
error InvalidValue();
error Unavailable();
error TransactionFailed();

/**
 * @author Asparuh Damyanov
 * @notice Vending Machine contract
 * @notice Allows buying Space Cola with Eth and Dai
 * @dev Interface is used for Dai logic implementation.
 *      Consider giving the correct Dai token address when deploying.
 *      For testing purposes I've made a Dai mock.
 * @dev Implements ERC20 from ColaERC20.sol, which mints and burns SCBT tokens
 *      when purchasing/returning bottles of Cola
 * @dev Implements AccessControl for role regulation
 *
 * @notice Storyline:
 * It is the year 3033. Humans and aliens live and thrive together in the Great Cosmic Metaverse.
 * Aliens love the humans for their cool inventions, one of which is fizzy drinks.
 * Having noticed the flourishing soda economy, you decide to start your own vending machine business.
 * You want to sell bottles of Space Cola to aliens in the metaverse.
 */
interface DaiToken {
    function transfer(address dst, uint wad) external returns (bool);

    function transferFrom(
        address src,
        address dst,
        uint wad
    ) external returns (bool);

    function balanceOf(address guy) external view returns (uint);

    function approve(address usr, uint wad) external returns (bool);
}

contract ColaMachine is ColaERC20, AccessControl {
    mapping(address => uint256) public colaBought;
    /// @notice stores the bottles, which can be returned by an Alien
    mapping(address => uint256) public bottlesBought;
    /// @notice stores the Discounted Amount used by an Alien.
    mapping(address => uint256) public addressToDiscountedAmount;

    DaiToken public daitoken;

    // Create a new role identifier for the operator role
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint32 public operators = 1;
    uint32 private stock;
    uint256 public PRICE;
    uint256 public PRICE_DAI;
    uint256 private totalColaSold;

    event OperatorAdded(address indexed newOperator);
    event OperatorRemoved(address indexed newOperator);
    event MachineRestocked(uint32 indexed restockAmount);
    event BuyCola(address indexed buyer, uint32 indexed amount);
    event Withdraw(address indexed withrawer, uint256 indexed amount);
    event BottlesReturned(address indexed alien, uint256 indexed amount);
    event PurchaseDiscounted(address indexed sender, uint256 indexed amount);
    event PriceInETHChanged(
        uint256 indexed oldPriceInETH,
        uint256 indexed newPriceInETH
    );
    event PriceInDAIChanged(
        uint256 indexed oldPriceInDAI,
        uint256 indexed newPriceInDAI
    );

    /**
     * DAI token from BlueJay Faucet on Rinkeby: 0xaD6Db97C844Ec7Bb4c0641d436AA0D395fDD3f45
     * @notice  Grant the contract deployer the default operator role: it can
     *   add another operator or remove an existing operator, but not themselves
     */
    constructor(address _daiTokenAddress)
        ColaERC20("SpaceColaBottleToken", "SCBT")
    {
        _setupRole(OPERATOR_ROLE, msg.sender);
        daitoken = DaiToken(_daiTokenAddress);
    }

    /**
     * @notice Buys Space Cola with Ethereum
     * @notice Can buy discounted Cola, if conditions are met.
     *         See _buyDiscountedCola & if Aliens buy 5 bottles at once they get a 15% discount.
     * @dev Bottles of Space Cola are represented by an ERC20 token.
     */
    function buyColaETH(uint32 _amount) public payable returns (bool) {
        if (_amount == 0) revert InvalidAmount();
        if (stock < _amount) revert NotEnoughStock();
        uint256 _value = _amount * PRICE;
        if (_amount != 5) {
            if (addressToDiscountedAmount[msg.sender] != 0) {
                _value = _buyDiscountedCola(_value, _amount, PRICE);
            }
            if (msg.value != _value) revert InvalidValue();
            _buyCola(_amount);
            return true;
        } else {
            if (addressToDiscountedAmount[msg.sender] != 0) {
                _value = _buyDiscountedCola(_value, _amount, PRICE);
            }
            uint256 _newValue = _value * 85;
            _value = _newValue / 100;
            if (msg.value != _value) revert InvalidValue();
            _buyCola(_amount);
            return true;
        }
    }

    /**
     * @notice Simply implements the buy Cola logic
     */
    function _buyCola(uint32 _amount) private {
        stock -= _amount;
        colaBought[msg.sender] += _amount;
        bottlesBought[msg.sender] += _amount;
        totalColaSold += _amount;
        _transfer(address(this), msg.sender, _amount);
        emit BuyCola(msg.sender, _amount);
    }

    /**
     * @notice Function that implements buying logic:
     * "Aliens who previously bought Space Cola can return a bottle for 50% off their next bottle. This can stack"
     * @dev this function covers two cases:
     *
     * -> if an alien tries to buy X amount of cola,
     *  where it had enough bottles returned to get discount on the whole purchase.
     *
     * -> if an alien tries to buy X amount of cola,
     *  where it had returned only a portion of the bottles.
     *  So it gets a discount on X bottles of cola from its next purchase.
     *
     * @dev before function is implement a check is mandatory
     * if (addressToDiscountedAmount[msg.sender] != 0)
     */
    function _buyDiscountedCola(
        uint256 _value,
        uint32 _BuyAmount,
        uint256 _price
    ) private returns (uint256) {
        if (addressToDiscountedAmount[msg.sender] >= _BuyAmount) {
            uint256 _discountedAmount = _BuyAmount;
            _value = (_discountedAmount * _price) / 2;
            addressToDiscountedAmount[msg.sender] -= _discountedAmount;
            emit PurchaseDiscounted(msg.sender, _BuyAmount);
            return _value;
        } else {
            //if(addressToDiscountedAmount[msg.sender] < _BuyAmount)
            uint256 _discountedAmount = addressToDiscountedAmount[msg.sender];
            uint256 _nonDiscountedAmount = _BuyAmount - _discountedAmount;
            _value =
                ((_discountedAmount * _price) / 2) +
                (_nonDiscountedAmount * _price);
            addressToDiscountedAmount[msg.sender] -= _discountedAmount;
            emit PurchaseDiscounted(msg.sender, _BuyAmount);
            return _value;
        }
    }

    /**
     * @notice Function to buy Space Cola with Dai
     * @notice To use this function Aliens need to invoke
     *          Dai's Approve() and pass it this contract address and _amount
     * @notice Can buy discounted Cola, if conditions are met.
     *         See _buyDiscountedCola & if Aliens buy 5 bottles at once they get a 15% discount.
     * @dev Bottles of Space Cola are represented by an ERC20 token.
     * @dev Implements buying logic with Dai following requirements.
     */
    function buyColaDAI(uint32 _amount) public returns (bool) {
        if (_amount == 0) revert InvalidAmount();
        if (stock < _amount) revert NotEnoughStock();
        uint256 _value = _amount * PRICE_DAI;

        if (_amount != 5) {
            if (addressToDiscountedAmount[msg.sender] != 0) {
                _value = _buyDiscountedCola(_value, _amount, PRICE_DAI);
            }
            if (daitoken.balanceOf(msg.sender) < _value) revert InvalidValue();
            bool success = daitoken.transferFrom(
                msg.sender,
                address(this),
                _value
            );
            if (!success) revert TransactionFailed();
            _buyCola(_amount);
            return true;
        } else {
            if (addressToDiscountedAmount[msg.sender] != 0) {
                _value = _buyDiscountedCola(_value, _amount, PRICE_DAI);
            }
            uint256 _newValue = _value * 85;
            _value = _newValue / 100;
            if (daitoken.balanceOf(msg.sender) < _value) revert InvalidValue();
            bool success = daitoken.transferFrom(
                msg.sender,
                address(this),
                _value
            );
            if (!success) revert TransactionFailed();
            _buyCola(_amount);
            return true;
        }
    }

    /**
     * @notice Aliens who previously bought Space Cola can return a bottle for 50% off their next bottle.
     * This can stack, for example they can return 15 bottles for 50% off their next 15 bottles.
     */

    function returnBottle(uint256 _amount) public {
        if (bottlesBought[msg.sender] == 0) revert InvalidAmount();
        if (bottlesBought[msg.sender] < _amount) revert InvalidAmount();
        addressToDiscountedAmount[msg.sender] += _amount;
        bottlesBought[msg.sender] -= _amount;
        _burn(msg.sender, _amount);
        emit BottlesReturned(msg.sender, _amount);
    }

    /**
     * @notice Restocks the machine
     * @notice Maximum machine capacity is 20 bottles
     * @dev mints new SCBT tokens when invoked
     */
    function addStock(uint32 _amount) public onlyRole(OPERATOR_ROLE) {
        if (stock + _amount > 20) revert OverStocking();
        stock += _amount;
        _mint(address(this), _amount);
        emit MachineRestocked(_amount);
    }

    /**
     * @notice Function that sets Cola price in the Machine
     * @dev currently this function sets price in both ETH and DAI
     * @notice Operators can set the price of a bottle in ETH but only when the Cola Machine is empty.
     */
    function setPrice(uint256 _newPriceInETH, uint256 _newPriceInDAI)
        public
        onlyRole(OPERATOR_ROLE)
        returns (bool)
    {
        if (stock > 0) revert Unavailable();
        emit PriceInETHChanged(PRICE, _newPriceInETH);
        PRICE = _newPriceInETH;
        emit PriceInDAIChanged(PRICE_DAI, _newPriceInDAI);
        PRICE_DAI = _newPriceInDAI;
        return true;
    }

    /**
     * @notice Gives Operator Role to User
     * @notice An operator can add another operator or remove an existing operator, but not themselves.
     * @notice There can be up to 3 operators at the same time.
     * @dev Emits OperatorAdded event
     */
    function addOperator(address _operatorAddress)
        public
        onlyRole(OPERATOR_ROLE)
        returns (bool)
    {
        if (_operatorAddress == msg.sender) revert CantManageYourself();
        if (operators >= 3) revert TooManyOperators();
        ++operators;
        _grantRole(OPERATOR_ROLE, _operatorAddress);
        emit OperatorAdded(_operatorAddress);
        return true;
    }

    /**
     * @notice Removes Operator Role from User
     * @notice Operators are not able to remove themselves from Operator Role
     * @dev Overrides "renounceRole" from Acess Control.
     * @dev Emits a OperatorRemoved event
     */
    function renounceRole(bytes32 role, address account)
        public
        override
        onlyRole(OPERATOR_ROLE)
    {
        if (account == msg.sender) revert CantManageYourself();

        --operators;
        _revokeRole(role, account);
        emit OperatorRemoved(account);
    }

    /**
     * @notice Allows Operators to withdraw Ethereum to their own address
     */
    function withdrawETH() public onlyRole(OPERATOR_ROLE) returns (bool) {
        uint256 _balance = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: _balance}("");
        if (!success) revert TransactionFailed();
        emit Withdraw(msg.sender, _balance);
        return true;
    }

    /**
     * @notice Allows Operators to withdraw Dai to their own address
     * @notice If you want to check the Machine's Dai balance go to checkMachineDaiBalance()
     */
    function withdrawDAI() public onlyRole(OPERATOR_ROLE) returns (bool) {
        uint256 _balance = daitoken.balanceOf(address(this));
        // require(_balance >= withdraw_amount,
        //     "Insufficient balance in faucet for withdrawal request");
        bool success = daitoken.transfer(msg.sender, _balance);
        if (!success) revert TransactionFailed();
        emit Withdraw(msg.sender, _balance);
        return true;
    }

    /**
     * @notice returns the current stock in the machine
     */
    function checkStock() external view returns (uint32) {
        return stock;
    }

    /**
     * @notice Checks the Machine's Dai balance
     */
    function checkMachineDaiBalance()
        external
        view
        onlyRole(OPERATOR_ROLE)
        returns (uint256)
    {
        return daitoken.balanceOf(address(this));
    }

    /**
     * @notice Aliens can check the price of a bottle before buying.
     * @notice returns price in Eth
     */
    function checkPriceInETH() external view returns (uint256) {
        return PRICE;
    }

    /**
     * @notice Aliens can check the price of a bottle before buying.
     * @notice returns price in Dai
     */
    function checkPriceInDAI() external view returns (uint256) {
        return PRICE_DAI;
    }

    /**
     * @notice Operators can check the total amount of Space Cola sold
     */
    function checkBottlesSold()
        external
        view
        onlyRole(OPERATOR_ROLE)
        returns (uint256)
    {
        return totalColaSold;
    }

    fallback() external payable {}
}
