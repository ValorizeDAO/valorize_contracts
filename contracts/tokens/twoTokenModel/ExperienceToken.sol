//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "contracts/utils/Airdroppable.sol";
import "@prb/math/src/UD60x18.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
@title Soul-Bound Experience Token
@author Marco Huberts
@dev Implementation of an Experience Token.
*/

contract ExperienceToken is IERC20, AccessControl, Airdroppable {
    using SafeMath for uint256;

    uint256 constant CONSTANT = 10**18;

    mapping(address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;
    mapping(address => bool) public contributors;

    uint256 private _totalSupply;

    address swapContract;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor()
    {
        _name = "ExperienceToken";
        _symbol = "EXPT";
        _decimals = 18;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is
     * called.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view returns (uint8) {
        return _decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev adds contributors to the mapping. Can only be called by admin.
     * @param _contributors array of contributors that are added.
     */
    function addContributors(address[] memory _contributors) public onlyRole(DEFAULT_ADMIN_ROLE) {
        for(uint256 i=0; i < _contributors.length; i++) {
            contributors[_contributors[i]] = true;
        }
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
     * @dev creates a new airdrop given a merkleroot and time limit
     * @param _merkleRoot hash of the root of the merkle tree
     * @param _timeLimit the amount of time the airdrop is active  
     */ 
    function newAirdrop(bytes32 _merkleRoot, uint256 _timeLimit) external onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint256 airdropId)
    {
        return _newAirdrop(_merkleRoot, _timeLimit);
    }

    /**
     * @dev divides the amount of tokens by 10**18.
     * @param amount the amount of tokens.
     */
    function divideByDecimals(uint256 amount) internal pure returns (uint256) {
        uint256 tokenAmount = amount / CONSTANT;
        return tokenAmount;
    }

    /**
     * @dev multiplies the amount of tokens by 10**18.
     * @param amount the amount of tokens.
     */
    function multiplyByDecimals(uint256 amount) internal pure returns (uint256) {
        uint256 tokenAmount = amount * CONSTANT;
        return tokenAmount;
    }
    
    /**
     * @dev calculates the amount of Experience Tokens that will be minted.
     * @param amount the amount of Experience Tokens.
     */
    function _calculateMintAmount(uint256 amount) internal pure returns (uint256) {
        uint256 mintTokenAmount = divideByDecimals(amount) ** 2;
        uint256 mintAmount = multiplyByDecimals(mintTokenAmount);
        return mintAmount;
    }
    
    /**
     * @dev mints the amount of tokens following the formula described 
     * here: https://www.notion.so/valorize/Two-Token-Model-Proposal-f8b992423cbb4a73859181371c65b53d 
     * @param amount the amount of Experience Tokens.
     */
    function mint(uint256 amount) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Not an admin");
        _mint(_calculateMintAmount(amount));
    }

    /**
    * @dev Mints tokens to the contract
    * @param amount of tokens that will be minted per year
    */
    function _mint(uint256 amount) internal {

        _beforeTokenTransfer(address(0), address(this), amount);

        _totalSupply += amount;
        unchecked {
            _balances[address(this)] += amount;
        }

        emit Transfer(address(0), address(this), amount);
    }

    /**
     * @dev sets the swap contract address. Can only be called by the admin.
     * @param _swapContract is the address of the swap contract. 
     */
    function setSwapContractAddress(address _swapContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        swapContract = _swapContract;
    }

    /**
    * @dev Transfer of tokens from smart contract to contributors. 
    * @param from issuer of tokens.
    * @param to token recipient address.
    * @param amount the amount of tokens that need to be transferred. 
    */
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(_balances[from] >= amount, "{from} address holds less EXP than {amount}.");
        
        _beforeTokenTransfer(from, to, amount);

        _balances[from] -= amount;
        _balances[to] += amount;
        
        emit Transfer(from, to, amount);
    }

    /**
     * @dev Transfers tokens from contract address to a contributor
     * @param receiver contributor's address
     * @param amount token amount that will be transferred to the contributor
     */
    //merkletree for the contributors
    function transfer(address receiver, uint256 amount) public returns (bool) {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Not an admin");
        require(contributors[receiver] == true, "{receiver} is not a contributor");
        _transfer(address(this), receiver, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     * @param from the contributor address.
     * @param to the address of the swap contract.
     * @param amount the amount of Experience Tokens transferred.
     */
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(contributors[from] == true, "{from} is not a contributor");
        require(to == swapContract, "Cannot transfer to other addresses");
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
    }

    /**
     * @dev burns the given amount of Experience Tokens held by the swap contract. Can only be called by the admin.
     * @param amount the amount of Experience Tokens that will be burned.
     */
    function burn(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(amount);
    }

    /**
     * @dev burns the given amount of Experience Tokens held by the swap contract. 
     * @param amount the amount of Experience Tokens that will be burned.
     */
    function _burn(uint256 amount) internal {      
        _beforeTokenTransfer(swapContract, address(0), amount);

        _totalSupply -= amount;
        unchecked {
            _balances[swapContract] -= amount;
        }

        emit Transfer(swapContract, address(0), amount);
    }

    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be to transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual { }
}