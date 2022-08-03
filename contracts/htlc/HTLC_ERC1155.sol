pragma solidity 0.6.2;

import "../utils/ERC1155Receiver.sol";

 // SPDX-License-Identifier: MIT

 ///    @title HTLC for ERC1155 atomic swap

/** 
    @notice    this contract implements ERC1155Receiver so as to receive token deposits 
 */


/**

    @dev The flow for the atomic swap goes thus;

    1.  An initiator opens order on the two HTLC contracts on the two chains with the same order id
    2.  The initiator automatically deposit tokens to the htlc for his own chain
    3.  The other party gets notified of the order on the other chain and funds the order
    4.  The initiator provides secret to the other party and then withdraws the token provided the secret is correct
    5.  The other party takes the secret and uses it to withdraw the tokens that the initiator deposited during the order opening
    6.  Since the initiator withdraws first, and the other party withdraws last, the other party will need more time to withdraw

 */
 

contract HTLC is ERC1155Receiver {

    /**
        @dev the token contract address to be registered with this HTLC contract

        The atomic swap implementation is unique to this token address only
     */ 

    address private _erc_1155_token_address;

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

    /**  @dev    The order's initiator is used to distinguish the source from whence the order was initiated
        The contract can't automatically determine the source as the contract will be on different chains. 
        Precaution must be taken from the client application that calls the smart contracts to properly identity who initiates the transaction
        The initiator will have less time to withdraw, while the other party will need more time to withdraw
   
    */
    


    /// @dev    struct to store order information
    struct AtomicSwapOrder {


        address         _ctokenReceiver;    //  the reciever of CToken. This is also giver of TToken
        address         _ttokenReceiver;    //  the receiver of TToken. This is also the giver of CToken
        address         _orderInitiator;    //  the order initiator is the creator of the order between the two parties
        bytes32         _secretHash;        //  the hash of the secret to be stored upon order opening. without this, either parties cannot transact
        bytes32         _secretKey;         //  the secret key is secret to the initiator's token. Without this, either parties cannot transact. The secret must match the hash
        uint256         _ctokenAmount;      //  the amount of CToken to be transacted
        uint256         _ttokenAmount;      //  the amount of TToken to be transacted
        uint256         _ctokenId;          //  the CToken id to be transacted
        uint256         _ttokenId;          //  the TToken id to be transacted
        uint256         _ctokenWithdrawalExpiration;    //  the expiration time for CToken withdrawal
        uint256         _ttokenWithdrawalExpiration;    //  the expiration time for TToken withdrawal
        uint256         _atomicSwapId;                  //  the id of the swap order    
        bool            _funded;                        //  the deposit status for the order
        AtomicSwapState _atomicSwapState;               //  the state of the order
        

    }

    mapping(uint256 => AtomicSwapOrder) private _swapOrder;
    mapping(uint256 => AtomicSwapState) private _swapState;          //  default is invalid for all order id

    /// @dev 

    constructor(address erc_1155_token_address) public {

        _erc_1155_token_address = erc_1155_token_address;
    }


    /**
        @dev order initiator opens the order. The initiator funds the order automatically after approving
        the htlc contract to move the funds from his/her account

        if the order is opened in the non initiator's contract, the entitiy will call the fundOrdr function
        to deposit his/her token

        @notice that the _ctokenReceiver must not be the _ttokenReciever
        @notice that the if the _orderInitiator is equal to any of the token receiver, he will be depositing his tokens authomatically for that
        @dev    the above conditions is to ensure that the deployed contracts can properlly apportion time contrainst to each parties

        ----Flow----

        1.  the order id to be created must be invalid
        2.  the secret hash must match the secret key
        3.  the ctoken receiver must not be the token receiver
        4.  the order creator must be either of the tokens receiver
        5.  the order expiration period for the non initiating party must be greater than the initiator with the secret

    
     */
    function openOrder(uint256 _orderId, uint256 _ctokenId, uint256 _ttokenId, uint256 _ctokenAmount, uint256 _ttokenAmount, address _ctokenReceiver, address _ttokenReceiver, bytes32 _secretKey, bytes32 _secretHash) external {

        require(_swapState[_orderId] == AtomicSwapState.INVALID, "existing order id");          //  order id must be a non existing id
        require(_secretHash == sha256(abi.encode(_secretKey)), "invalid secret");               //  check the secret validity
        require(_ctokenReceiver != _ttokenReceiver, "an address can't be the same receiver for the two tokens");        //  ttoken receiver must be different to ctoken receiver
        require(msg.sender == _ctokenReceiver || msg.sender == _ttokenReceiver, "initiator must be a recipient of any of the tokens");      //  only a recipient of the token can initiate the order

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

    /*function checkOrder() external view return() {

    }*/

    


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