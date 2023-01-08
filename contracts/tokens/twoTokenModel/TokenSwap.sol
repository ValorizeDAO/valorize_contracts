//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@prb/math/src/UD60x18.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IERC20 {

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract TokenSwap is Context, AccessControl {

    uint256 public weight = 1*10**1;
    uint256 public completeSupply;
    uint256 constant DECIMALS = 1*10**18;
    address public ttVault;
    bytes32 public VAULT_ROLE;
    IERC20 public TradableToken;
    IERC20 public ExperienceToken;

    event Swap(address contributor, uint256 amountIn, uint256 amountOut);

    /** 
     * @notice Launches contract and sets up the admin and vault roles.
     * @param _ttVault the address of the vault that holds Tradable Tokens. 
     */
    constructor(
        address _ttVault
    ) {
        ttVault = _ttVault;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(VAULT_ROLE, ttVault);
    }

    /**
     * @dev allows another address to receive the admin role. Can only be called by an admin.
     * @param newAdminAddress the address of the new admin.
     */
    function addAdmin(address newAdminAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!hasRole(DEFAULT_ADMIN_ROLE, newAdminAddress), "Address has admin role already");
        grantRole(DEFAULT_ADMIN_ROLE, newAdminAddress);
    }

    /**
     * @dev sets the Experience Token address. Can only be called by admin.
     * @param experienceToken the address of the Experience Token smart contract
     */
    function setExperienceTokenAddress(address experienceToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ExperienceToken = IERC20(experienceToken);
    }

    /**
     * @dev sets the Tradable Token address. Can only be called by admin.
     * @param tradableToken the address of the Tradable Token smart contract
     */
    function setTradableTokenAddress(address tradableToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TradableToken = IERC20(tradableToken);
    }

    /**
     * @dev returns the sum of the total supplies of 
     * Experience and Tradable Tokens that are part of the Two-Token Model.
     */
    function getModelTotalSupply() public returns (uint256) {
        completeSupply = TradableToken.totalSupply() + ExperienceToken.totalSupply();
        return completeSupply;
    }

    /**
     * @dev returns the logarithm of a given amount of Experience Tokens.
     * @param amountOfExpTokens the amount of provided Experience Tokens.
     */
    function _logarithm(uint256 amountOfExpTokens) internal pure returns (UD60x18) {
        UD60x18 result = log10(toUD60x18(amountOfExpTokens));
        return result;
    }

    /**
     * @dev returns the square root of the logarithm of a given input.
     * @param amountOfExpTokens the amount of provided Experience Tokens.
     */
    function _squareRootFromLogarithm(uint256 amountOfExpTokens) internal pure returns (uint256) {
        uint256 output = fromUD60x18(_logarithm(amountOfExpTokens));
        return output;
    }

    /**
     * @dev returns the square root of the logarithm of a given input.
     * @param amountOfExpTokens the amount of provided Experience Tokens.
     */
    function _calculateAboveTheLine(uint256 amountOfExpTokens) internal pure returns (uint256) {
        uint256 output = DECIMALS * _squareRootFromLogarithm(amountOfExpTokens);
        return output;
    } 

    /**
     * @dev returns the total supply of the Two-Token Model
     */
    function _calculateBelowTheLine() internal returns (UD60x18) {
        UD60x18 returnValue = toUD60x18(getModelTotalSupply());
        return returnValue;
    } 

    /**
     * @dev adjusts the weight of the token swap, by default set to 10. Can only be called by admin.
     * @param newWeight the weight that determines how many Tradable Tokens you will receive 
     */
    function adjustWeight(uint256 newWeight) public onlyRole(DEFAULT_ADMIN_ROLE) {
        weight = newWeight;
    }

    /**
     * @dev calculates the amount of Tradable Tokens the contributor will receive 
     * based on the amount of Experience Tokens 
     * @param amountIn the number of Experience Tokens the contributor wants to swap
     */
    function calculateAmount(uint256 amountIn) public returns (uint256) {
        uint256 amountOut = 
                
                weight * fromUD60x18(div(toUD60x18(amountIn * _calculateAboveTheLine(amountIn)),
                _calculateBelowTheLine()
                
                ));
        
        return amountOut;
    }
 
    /**
     * @dev swaps Valorize's Experience Tokens for Tradable Tokens according to the formula described 
     * here: https://www.notion.so/valorize/Two-Token-Model-Proposal-f8b992423cbb4a73859181371c65b53d
     * @param amountIn the amount of Experience Tokens the contributor wants to swap
     */
    function swap(uint256 amountIn) public {

        ExperienceToken.transferFrom(_msgSender(), address(this), amountIn);

        uint256 amountOut = calculateAmount(amountIn);
        
        TradableToken.transferFrom(ttVault, _msgSender(), amountOut); 
        
        emit Swap(_msgSender(), amountIn, amountOut);
    }
}
