pragma solidity 0.6.2;

import "../utils/ERC1155Receiver.sol";

 // SPDX-License-Identifier: MIT

 ///    @title HTLC for ERC1155 atomic swap

/** 
    @notice    this contract this implements ERC1155Receiver so as to receive token deposits 
 */

 

contract HTLC is ERC1155Receiver {

    /**
        @dev the token contract address to be registered with this HTLC contract

        The atomic swap implementation is unique to this token address only
     */ 

    address private _erc_1155_token;

    /**  @dev    Enum to be used to track the state of an order

        @notice INVALID means the order id doesn't exist
        @notice OPEN    means the order is opened and yet to be closed or expired
        @notice CLOSED  means that the order has been fullfilled
        @notice EXPIRED means that the order has exceeded its validity period

    */
    

    enum AtomicSwapState {

        INVALID,        
        OPEN,
        CLOSED,
        EXPIRED

    }

    /// @dev    The order initiator is used to distinguish the source
    enum OrderInitiator {
        TTOKEN,
        CTOKEN
    }


    /// @dev    struct to store order information
    struct AtomicSwapOrder {


        address         _ctokenReceiver;
        address         _ttokenReceiver;
        bytes32         _secretHash;
        bytes32         _secretKey;
        uint256         _ctokenAmount;
        uint256         _ttokenAmount;
        uint256         _ctokenId;
        uint256         _ttokenId;
        uint256         _ctokenWithdrawalExpiration;
        uint256         _ttokenWithdrawalExpiration;
        uint256         _atomicSwapId;
        bool            _funded;
        OrderInitiator  _orderInitiator;
        AtomicSwapState _atomicSwapState;
        

    }

    /// @dev 

    constructor(address erc_1155_token) public {

        _erc_1155_token = erc_1155_token;
    }


    /**
        @dev order initiator opens the order. The initiator funds the order automatically after approving
        the htlc contract to move the funds from his/her account

        if the order is opened in the non initiator's contract, the entitiy will call the fundOrdr function
        to deposit his/her token

    
     */
    function openOrder() external {



    }

    /**
        @dev the non inittiator of the order calls the fundOrder function to fund the order
     */

    function fundOrder() external {

    }


    function withdrawOrder() external {
        
    }

    function RefundOrder() external {

    }


    /// @notice this function's implementation to receive deposit
    function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data) external override returns(bytes4){
        return this.onERC1155Received.selector;
    }

    ///    @notice this implementation to recieve deposit in batches
    function onERC1155BatchReceived(address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external override returns(bytes4){
        return this.onERC1155BatchReceived.selector;
    }

    

    //  create function to open order
    //  create function to open swap order by an individual
    //  create function for the recipient to withdraw with the secret and close the order       //   the secret will be gotten from the other blockchain network
    //  create function for an order opener to get refunded after expiration

    

}