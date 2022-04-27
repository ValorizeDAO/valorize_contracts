//SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "hardhat/console.sol";

contract Deployer is AccessControl{
    struct DeployedContractInfo {
        address deploymentAddress;
        string  contractType;
    }
    struct ContractDeployParameters {
        bytes32 byteCodeHash;
        uint    price;
    }
    mapping(string => ContractDeployParameters) contractParamsByKey;
    mapping(address => DeployedContractInfo[])  contractsDeloyedByEOA;
    uint256 discountPercentage;
    address NFTDiscountContract;

    /*
     * @dev Deploys a contract and returns the address of the deployed contract
     * @param _contractDeployPrice The price (in wei) that users must pay to deploy a contract
     * @param _admin The address that can call the admin functions
     * @return The address of the deployed contract
     */
    constructor(address admin) {
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
        (bool success, ContractDeployParameters memory c) = getContractByteCodeHash(contractType);
        if (!success || c.byteCodeHash != keccak256(bytecode)) {
            revert("Incorrect contract name");
        }
        require(
            msg.value >= c.price,
            "Insufficient payment to deploy"
        );
        if(salt == 0x0) {
            salt = keccak256(abi.encode(getDeployed(msg.sender).length));
        }
        bytes memory code = abi.encodePacked(
            bytecode,
            params
        );
        address contractAddress;
        assembly {
            contractAddress := create2(0, add(code, 0x20), mload(code), salt)
            if iszero(extcodesize(contractAddress)) {
                revert(0, "Error deploying contract")
            }
        }
        DeployedContractInfo memory ci = DeployedContractInfo(contractAddress, contractType);
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
        returns (DeployedContractInfo[] memory contractsDeployed)
    {
        contractsDeployed = contractsDeloyedByEOA[deployer];
    }

    /*
     * @dev Gets the bytecode of a contract by name
     * @param contractKey The key used to reference the contract
     * @returns Boolean flag and the contract info
     */
    function getContractByteCodeHash(string calldata contractKey)
        public
        view
        returns (bool success, ContractDeployParameters memory contractParams)
    {
        contractParams = contractParamsByKey[contractKey];
        if(contractParams.byteCodeHash.length == 0) {
            return (false, contractParams);
        }
        return (true, contractParams);
    }

    /*
     * @dev Sets the bytecode of a contract by name
     * @param contractKey The key which must be used to access the bytecode
     * @param bytecode The bytecode to store
     * @param uint contractDeployPrice The price (in wei) that users must pay to deploy a contract
     */
    function setContractByteCode(
        string calldata contractKey,
        bytes calldata byteCode,
        uint contractDeployPrice
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        contractParamsByKey[contractKey] = ContractDeployParameters(
            keccak256(byteCode),
            contractDeployPrice
        );
    }

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(address(msg.sender)).transfer(address(this).balance);
    }
}
