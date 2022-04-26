//SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "hardhat/console.sol";

contract Deployer is AccessControl{
    struct ContractInfo {
        address deploymentAddress;
        string contractType;
    }
    mapping(string => bytes32) contractByteCodesByKey;
    mapping(address => ContractInfo[]) contractsDeloyedByEOA;
    uint256 public contractDeployPrice;
    uint256 discountPercentage;
    address NFTDiscountContract;

    /*
     * @dev Deploys a contract and returns the address of the deployed contract
     * @param _contractDeployPrice The price (in wei) that users must pay to deploy a contract
     * @param _admin The address that can call the admin functions
     * @return The address of the deployed contract
     */
    constructor(uint256 _contractDeployPrice, address admin) {
        contractDeployPrice = _contractDeployPrice;
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /*
     * @dev Deploys a contract and returns the address of the deployed contract
     * @param contractKey The key to get the bytecode of the contract
     * @param salt A parameter to make the contract deploy unique
     */
    function deployContract(
        string calldata contractType,
        bytes calldata bytecode,
        bytes calldata params,
        bytes32 salt
    ) public payable {
        require(
            msg.value >= contractDeployPrice,
            "Insufficient payment to deploy"
        );
        if(salt == 0x0) {
            salt = keccak256(abi.encode(getDeployed(msg.sender).length));
        }
        (bool success, bytes32 hash) = getContractByteCodeHash(contractType);
        if (!success || hash != keccak256(bytecode)) {
            revert("Incorrect contract name");
        }
        bytes memory code = abi.encodePacked(
            bytecode,
            params
        );
        address c;
        assembly {
            c := create2(0, add(code, 0x20), mload(code), salt)
            if iszero(extcodesize(c)) {
                revert(0, "Error deploying contract")
            }
        }
        ContractInfo memory ci = ContractInfo(c, contractType);
        contractsDeloyedByEOA[msg.sender].push(ci);
    }

    /*
     * @dev Returns contract info deployed by the given address
     * @param deployer address to lookup
     * @return array of contracts deployed by deployer
     */
    function getDeployed(address deployer)
        public
        view
        returns (ContractInfo[] memory contractsDeployed)
    {
        contractsDeployed = contractsDeloyedByEOA[deployer];
    }

    /*
     * @dev Sets the price to deploy a contract
     * @param newPrice The new price (in wei)
     */
    function setContractDeployPrice(uint256 newPrice) external {
        contractDeployPrice = newPrice;
    }

    /*
     * @dev Gets the bytecode of a contract by name
     * @param contractKey The key used to reference the contract
     * @returns Boolean flag and the bytecode of the contract
     */
    function getContractByteCodeHash(string calldata contractKey)
        public
        view
        returns (bool success, bytes32 hash)
    {
        hash = contractByteCodesByKey[contractKey];

        if(hash.length == 0) {
            return (false, hash);
        }
        return (true, hash);
    }

    /*
     * @dev Sets the bytecode of a contract by name
     * @param contractKey The key which must be used to access the bytecode
     * @param bytecode The bytecode to store
     */
    function setContractByteCode(
        string calldata contractKey,
        bytes calldata byteCode
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        contractByteCodesByKey[contractKey] = keccak256(byteCode);
    }

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(address(msg.sender)).transfer(address(this).balance);
    }
}
