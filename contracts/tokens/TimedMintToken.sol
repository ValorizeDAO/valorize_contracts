//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./standards/ERC20TimedMint.sol";
import "../utils/MerkleProof.sol";
import "../utils/Airdroppable.sol";

//import "hardhat/console.sol";

/**
 * @title Timed Mint Token
 * @author Javier Gonzalez
 * @notice Scheduled On-Chain Token Distribution
 */
contract TimedMintToken is ERC20TimedMint, AccessControl, Airdroppable {
    uint256 public immutable initialSupply;
    address public vault;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER");

    event VaultUpdated(address oldVault, address newVault);
    event NewMintGuard(uint256 nextAllowedMintTime, uint256 maxMintAmount);

    /**
     * @notice Launches contract, mints tokens for a vault and for an airdrop
     * @param _freeSupply The number of tokens to issue to the contract deployer
     * @param _airdropSupply The number of tokens to reserve for the airdrop
     * @param _vault The address to send the free supply to
     * @param _timeDelay how many seconds should span until user can mint again
     * @param _mintCap how many coins can be minted each minting period
     * @param name The ERC20 token name
     * @param symbol The ERC20 token symbol
     * @param admins A list of addresses that are able to call admin functions
     */
    constructor(
        uint256 _freeSupply,
        uint256 _airdropSupply,
        address _vault,
        uint256 _timeDelay,
        uint256 _mintCap,
        string memory name,
        string memory symbol,
        address[] memory admins
    ) ERC20TimedMint(name, symbol) {
        _mint(_vault, _freeSupply);
        _mint(address(this), _airdropSupply);
        initialSupply = _freeSupply + _airdropSupply;
        _setMintGuard(_timeDelay, _mintCap);
        _updateVault(_vault);
        for (uint256 i = 0; i < admins.length; i++) {
            _setupRole(DEFAULT_ADMIN_ROLE, admins[i]);
        }
    }

    function getInitialSupply() public view returns (uint256) {
        return initialSupply;
    }

    /**
     * @dev Sets vault to a new address
     * @param _vault Address which will be the recipient of new mints
     */
    function _updateVault(address _vault) internal {
        address oldVault = vault;
        vault = _vault;
        emit VaultUpdated(oldVault, vault);
    }

    /**
     * @notice Updates vault to new address
     * @param vault Address which will be the recipient of new mints
     */
    function updateVault(address vault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _updateVault(vault);
    }


    /**
     * @dev Set timeDelay and mintCap at once
     * @param _timeDelay Seconds until next allowable mint
     * @param _mintCap Maximum allowed mint amount
     */
    function _setMintGuard(uint256 _timeDelay, uint256 _mintCap) internal {
        _setTimeDelay(_timeDelay);
        _setMintCap(_mintCap);
        emit NewMintGuard(nextAllowedMintTime, _mintCap);
    }

    /**
     * @notice sets a time delay and a maximum mint amount
     * @param _timeDelay Seconds until next allowable mint
     * @param _mintCap Maximum allowed mint amount
     */
    function setMintGuard(uint256 _timeDelay, uint256 _mintCap) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setMintGuard(_timeDelay, _mintCap);
    }

    /**
     * @notice mints tokens to the vault address
     * @dev requires minter role to call this function
     * @param amount Number of tokens to send to the vault
     */
    function mint(uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(vault, amount);
    }
    
    function setMinter(address minter) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setupRole(MINTER_ROLE, minter);
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function newAirdrop(bytes32 _merkleRoot, uint256 _timeLimit)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint256 airdropId)
    {
        return _newAirdrop(_merkleRoot, _timeLimit);
    }

    function completeAirdrop() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _completeAirdrop();
    }

    function sweepTokens(address _destination)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _sweepTokens(_destination, balanceOf(address(this)));
    }

    function _sweep(address to, uint256 amount) internal virtual override {
        _transfer(address(this), to, amount);
    }
}
