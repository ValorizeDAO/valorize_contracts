//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "./@openzeppelin/contracts/access/AccessControl.sol";
import "./@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import {
//     ISuperfluid,
//     ISuperToken,
//     ISuperAgreement
// } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

// import {
//     IConstantFlowAgreementV1
// } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import "hardhat/console.sol";

/**
 * @title Vested Token
 * @author Javier Gonzalez
 * @dev Implementation of a Vested Token.
 * @notice Vested Token is a token that can be minted and vested.
 *         Has a percentage immediately available to the owner, 
 *         the mint function is only callable by a multisig and mints tokens
 *         that are vested for a timelocked period with a cliff.
 *         i.e. TotalSupply is 100,000,000,000 tokens,
 *              owner recieves 20% immediately,
 *              owner can mint 20,000,000 tokens for a timelocked period of 1 year,
 *              the rest of the 80% is vested for 4 years with a cliff of 1 year.
 */
contract VestedToken is ERC20, AccessControl {
    bytes32 public constant VESTEE_ROLE = keccak256("VESTEE");

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address safe,
        address admin
    ) ERC20(name, symbol) {
        _mint(safe, initialSupply);
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }   

    modifier onlyAdmin {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Admin Role required to call");
        _;
    }

    function mint(address _to, uint256 _amount) onlyAdmin public {
        _mint(_to, _amount);
    }
    
    function addVestee(address _vestee) onlyAdmin public {
        _setupRole(VESTEE_ROLE, _vestee);
    }
}

// abstract contract FluidVesting is Ownable {
//     function callAgreement(
//         ISuperAgreement agreementClass,
//         bytes memory callData,
//         bytes memory userData
//     )
//         external override
//         returns(bytes memory returnedData)
//     {
//         return _callAgreement(msg.sender, agreementClass, callData, userData);
//     }

    // enum RecipientState { Registered, Flowing, Stopped }
    
    // struct FlowRecipient {
    //     address recipient;
    //     uint256 flowRate;
    //     bool permanent;
    //     RecipientState state;
    // }

    // event FlowStopped(
    //     address recipient,
    //     uint256 flowRate,
    //     bool wasPermanent
    // );

    // ISuperfluid _host;
    // IConstantFlowAgreementV1 _cfa;
    // ISuperToken public acceptedToken;
   
    // mapping(address => FlowRecipient) _recipients;
    // mapping(address => bool) _permanentRecipients;
    // mapping(address => bool) _impermanentRecipients;
    // mapping(address => uint256) _recipientLastStopped;
    // mapping(address => uint256) _recipientToPauseDuration;
   
    // address admin;
    // uint256 public cliffEnd;
    // uint256 public starttime;
    // uint256 public vestingDuration;
    // bool public vestingActive;

//     constructor(ISuperfluid host, IConstantFlowAgreementV1 cfa, ISuperToken _acceptedToken, uint256 _cliffEnd, uint256 _vestingDuration) {
//         require(address(host) != address(0), "host is zero address");
//         require(address(cfa) != address(0), "cfa is zero address");
//         require(address(_acceptedToken) != address(0), "acceptedToken is zero address");
//         require(_vestingDuration > 0, "vestingDuration must be larger than 0");

//         if(_cliffEnd == 0) _cliffEnd = block.timestamp;
//         _host = host;
//         _cfa = cfa;
//         acceptedToken = _acceptedToken;
//         cliffEnd = _cliffEnd;
//         vestingDuration = _vestingDuration;
//         admin = msg.sender;

//         initializeRecipients();
//     }

//     modifier onlyAdmin() {
//         require(msg.sender == admin, "Only allowed by admin");
//         _;
//     }

//     modifier notRegistered(address adr) {
//         require(!isRecipientRegistered(adr), "Registered Recipient");
//         _;
//     }

//     modifier registeredRecipient(address adr) {
//         require(isRecipientRegistered(adr), "Not Registered Recipient");
//         _;
//     }

    

//     function initializeRecipients() virtual internal;

    

//     function launchVesting(address[] calldata recipientAddresses) public onlyOwner {
//         require(block.timestamp > cliffEnd, "Cliff period not ended.");

//         for(uint i = 0; i < recipientAddresses.length; i++) {
//             openStream(recipientAddresses[i]);
//         }

        

//         if(!vestingActive) {
//             starttime = block.timestamp;
//             vestingActive = true;
//         }
//     }

//     function openStream(address recipient) internal {
//         _host.callAgreement(
//             _cfa,
//             abi.encodeWithSelector(
//                 _cfa.createFlow.selector,
//                 acceptedToken,
//                 recipient,
//                 _recipients[recipient].flowRate,
//                 new bytes(0)
//             ),
//             new bytes(0)
//         );
//         _recipients[recipient].state = RecipientState.Flowing;
//     }

//     function resumeStream() public {
//         if(isRecipientRegistered(msg.sender) && isPermanentRecipient(msg.sender)) {
//             openStream(msg.sender);
//             if(_recipientLastStopped[msg.sender] > 0) {
//                 uint256 lastPauseDuration = block.timestamp - _recipientLastStopped[msg.sender];
//                 _recipientToPauseDuration[msg.sender] = _recipientToPauseDuration[msg.sender] + lastPauseDuration;
//                 _recipientLastStopped[msg.sender] = 0;
//             }
//         } else {
//             revert("Only Stream Recipient can reopen the stream.");
//         }
//     }

//     function elapsedTime() public view returns (uint256) {
//         require(starttime > 0, "Vesting has not yet started.");
//         return block.timestamp.sub(starttime);
//     }

//     function estimateElapsedTokens(address recipient) public view onlyAdmin returns (uint256) {
//         require(vestingActive, "Vesting inactive");
//         uint256 durationEstimate = block.timestamp - starttime * _recipients[recipient].flowRate;
//         uint256 pauseEstimate = _recipientToPauseDuration[recipient] * _recipients[recipient].flowRate;
//         return durationEstimate - pauseEstimate;
//     }

//     function estimateTotalTokens(address recipient) public onlyAdmin view returns (uint256) {
//         return vestingDuration.mul(_recipients[recipient].flowRate);
//     }

//     function estimateRemainingTokens(address recipient) public onlyAdmin  view returns (uint256) {
//         return estimateTotalTokens(recipient).sub(estimateElapsedTokens(recipient));
//     }

//     function getFlowRecipient(address adr) public onlyAdmin view returns (FlowRecipient memory) {
//         return _recipients[adr];
//     }

//     function registerRecipient(address adr, uint256 flowRate, bool isPermanent) public onlyOwner notRegistered(adr) returns (FlowRecipient memory) {
//         FlowRecipient memory newRecipient = FlowRecipient(adr, flowRate, isPermanent, RecipientState.Registered);
//         _recipients[adr] = newRecipient;
//         return newRecipient;
//     }

    

//     function isPermanentRecipient(address adr) internal registeredRecipient(adr) view returns (bool) {
//         return _recipients[adr].permanent;
//     }

    

//     function flowTokenBalance() public view returns (uint256) {
//         return acceptedToken.balanceOf(address(this));
//     }



//     function withdraw(IERC20 token, uint256 amount) public onlyOwner {
//         require(amount <= token.balanceOf(address(this)), "Withdrawal amount exceeds balance");
//         bool transferSuccess = token.transfer(msg.sender, amount);
//         if(!transferSuccess) revert("Token transfer failed");
//     }

// }



// contract InvestorsVesting is FluidVesting {
//     constructor(ISuperfluid host, IConstantFlowAgreementV1 cfa, ISuperToken _acceptedToken, uint256 _cliffEnd, uint256 _vestingDuration) FluidVesting(host, cfa, _acceptedToken, _cliffEnd, _vestingDuration) {}

//     function initializeRecipients() internal override {
//         // Investors (36 months)
//         registerRecipient(0x0caCf3518029666703c08aB7f1F9AD1Aca4C38D1, 317097919800000, true);
//     }
// }

// contract TeamVesting is FluidVesting {

//     constructor(ISuperfluid host, IConstantFlowAgreementV1 cfa, ISuperToken _acceptedToken, uint256 _cliffEnd, uint256 _vestingDuration) FluidVesting(host, cfa, _acceptedToken, _cliffEnd, _vestingDuration) {}

//     function initializeRecipients() internal override {
//         // Team (48 months)
//         registerRecipient(0x6960CcbAe6A13813618f275B10EE0FB55271ce1D, 396372399800000, true);
//     }
// }

// contract StoppableVesting is FluidVesting {

//     constructor(ISuperfluid host, IConstantFlowAgreementV1 cfa, ISuperToken _acceptedToken, uint256 _cliffEnd, uint256 _vestingDuration) FluidVesting(host, cfa, _acceptedToken, _cliffEnd, _vestingDuration) {}

//     function initializeRecipients() internal override {
//         // Stoppable (48 months, no cliff)
//         registerRecipient(0x474B73e8966D61999B1f829704337C0133F77b56, 396372399800000, false);
//     }

//     function closeVesting(address[] calldata recipientAddresses) public onlyOwner {
//         require(vestingActive, "Vesting not started");
//         require(elapsedTime() > vestingDuration, "Vesting duration has not expired yet.");
//         for(uint i = 0; i < recipientAddresses.length; i++) {
//             closeStream(recipientAddresses[i]);
//         }
//     }

//     function closeStream(address recipient) public onlyOwner {
//         require(_recipients[recipient].state == RecipientState.Flowing, "Stream inactive");
        
//         if(elapsedTime() < vestingDuration) {
//             require(!isPermanentRecipient(recipient), "Stream for this receiver is permanent and cannot be closed.");
//         }

//         _host.callAgreement(
//             _cfa,
//             abi.encodeWithSelector(
//                 _cfa.deleteFlow.selector,
//                 acceptedToken,
//                 address(this),
//                 recipient,
//                 new bytes(0)
//             ),
//             new bytes(0)
//         );

//         _recipients[recipient].state = RecipientState.Stopped;
//         _recipientLastStopped[recipient] = block.timestamp;
        
//         emit FlowStopped(recipient,  _recipients[recipient].flowRate, isPermanentRecipient(recipient));
//     }
// }
