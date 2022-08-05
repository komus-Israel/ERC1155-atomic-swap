pragma solidity 0.6.2;

import "../utils/ERC1155Receiver.sol";
import "../utils/IERCToken.sol";


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
        @dev the token contract addresses to be registered with this HTLC contract


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

    IERCToken ERC1155_TOKEN;             //  declare ctoken interface
    //IERCToken ERC1155_TTOKEN;             //  declare ttoken interface

    constructor(address erc_1155_token_address) public {

        _erc_1155_token_address = erc_1155_token_address;     //  ctoken address initialization
        //_erc_1155_ttoken_address = erc_1155_ttoken_address;     //  ttoken address initialization
        
        ERC1155_TOKEN = IERCToken(_erc_1155_token_address);   //  register ctoken with the interface
        //ERC1155_TTOKEN = IERCToken(_erc_1155_ttoken_address);   //  register ttoken with the interface
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
        

        uint256 _ctokenReceiverExpiration;
        uint256 _ttokenReceiverExpiration;
        bool _fundedStatus;
        

        /**
            @dev    this if else condition detects the initiator of the contract, and apportions time accordingly
            since the initiator a.k.a msg.sender withdraws first, he has 30 minutes to withdraw
            since the other party is the last the withdraw, he has additional 30 minutes to withdraw, with total time of 1 hour
        */

            
        if (_ctokenReceiver == msg.sender){

            _ctokenReceiverExpiration = now + 30 minutes;     //  assign 30 to the initiator
            _ttokenReceiverExpiration = now + 1 hours;        //  assign 1hr to the other party
            
            /**
                @dev    if initiator is receiving ctoken, then he is giving token, hence the need to deposit ttoken 
            */


            if (keccak256(abi.encodePacked((ERC1155_TOKEN.name()))) == keccak256(abi.encodePacked(("TTOKEN")))) {
                require(ERC1155_TOKEN.isApprovedForAll(msg.sender, address(this)), "contract yet to be approved to move ttokens");
                ERC1155_TOKEN.safeTransferFrom(msg.sender, address(this), _ttokenId, _ttokenAmount, "");
                _fundedStatus = true;
            }        

        }

            
        if (_ttokenReceiver == msg.sender) {

            _ctokenReceiverExpiration = now + 1 hours;        //  assign 1 hour to the other party
            _ttokenReceiverExpiration = now + 30 minutes;     //  assign 30 minutes to the initiator

            /**
                @dev    if initiator is receiving ttoken, then he is giving ctoken, hence the need to deposit ttoken 
            */


            if (keccak256(abi.encodePacked((ERC1155_TOKEN.name()))) == keccak256(abi.encodePacked(("CTOKEN")))) {
                require(ERC1155_TOKEN.isApprovedForAll(msg.sender, address(this)), "contract yet to be approved to move ctokens");
                ERC1155_TOKEN.safeTransferFrom(msg.sender, address(this), _ctokenId, _ctokenAmount, "");
                _fundedStatus = true;
            }   

        }



        _swapState[_orderId] = AtomicSwapState.OPEN;     //  update the order state to open
        _swapOrder[_orderId] = AtomicSwapOrder(_ctokenReceiver, _ttokenReceiver, msg.sender, _secretHash, 
                                                bytes32(0), _ctokenAmount, _ttokenAmount, _ctokenId,  _ttokenId, _ctokenReceiverExpiration, 
                                                _ttokenReceiverExpiration, _orderId, _fundedStatus, _swapState[_orderId]);


        //  emit the opened order
        AtomicSwapOrder memory _order = _swapOrder[_orderId];       //  emit event data from struct to prevent stack too deep error
        emit OpenedOrder(_order._ctokenReceiver, _order._ttokenReceiver, _order._ctokenAmount, _order._ttokenAmount, _order._ctokenId, _order._ttokenId, _order._atomicSwapId);

    }

    /**
        @dev the non initiator of the order calls the fundOrder function to fund the order

        //  order must be opened
        //  order must not be expired
    */

    function depositOrder(uint256 _orderId) external {

        require(_swapState[_orderId] == AtomicSwapState.OPEN, "order not opened");          //  order id must be a non existing id
        AtomicSwapOrder memory _order = _swapOrder[_orderId];
        require(msg.sender != _order._orderInitiator, "invalid depositor");
        

        if(msg.sender == _order._ctokenReceiver) {

            //  require that the withdrawal time for ttoken is yet to expire so that 
            //  the depositor can proceed with funding the ttoken
            require (now < _order._ttokenWithdrawalExpiration, "expired order");
            require(_order._funded == false, "funded order");
            if (keccak256(abi.encodePacked((ERC1155_TOKEN.name()))) == keccak256(abi.encodePacked(("TTOKEN")))) {
                require(ERC1155_TOKEN.isApprovedForAll(msg.sender, address(this)), "contract yet to be approved to move ttokens");
                ERC1155_TOKEN.safeTransferFrom(msg.sender, address(this), _order._ttokenId, _order._ttokenAmount, "");
                _swapOrder[_orderId]._funded = true;
            }

            emit DepositedOrder(msg.sender, address(this), _orderId, _order._ttokenId, _order._ttokenAmount);   

        }

        if(msg.sender == _order._ttokenReceiver) {

            //  require that the withdrawal time for ctoken is yet to expire so that 
            //  the depositor can proceed with funding the ctoken
            require (now < _order._ctokenWithdrawalExpiration, "expired order");
            require(_order._funded == false, "funded order");
            if (keccak256(abi.encodePacked((ERC1155_TOKEN.name()))) == keccak256(abi.encodePacked(("CTOKEN")))) {
                require(ERC1155_TOKEN.isApprovedForAll(msg.sender, address(this)), "contract yet to be approved to move ctokens");
                ERC1155_TOKEN.safeTransferFrom(msg.sender, address(this), _order._ctokenId, _order._ctokenAmount, "");
                _swapOrder[_orderId]._funded = true;
            }

            emit DepositedOrder(msg.sender, address(this), _orderId, _order._ctokenId, _order._ctokenAmount);   
        }

        


    }

    /**
        @dev    withdrawal function for individual parties to place withdawal
                order must be OPEN
                secret must match
                order must be funded
                withdrawee must be the correct recipient
                order has not expired
                close the order
     */

    function withdrawOrder(uint256 _orderId, bytes32 _secretKey) external {
        
        require(_swapState[_orderId] == AtomicSwapState.OPEN, "order not opened");
        AtomicSwapOrder memory _order = _swapOrder[_orderId];
        require(_order._secretHash == sha256(abi.encode(_secretKey)), "invalid secret");               //  check the secret validity
        require(_order._funded == true, "order not funded");
        uint256 _amount;
        uint256 _tokenId;
        
        //  use the token name to detect the valid recipient
        if (keccak256(abi.encodePacked((ERC1155_TOKEN.name()))) == keccak256(abi.encodePacked(("TTOKEN")))) {
            
            require(msg.sender == _order._ttokenReceiver, "invalid withdrawee");
            ERC1155_TOKEN.safeTransferFrom(address(this), _order._ttokenReceiver, _order._ttokenId, _order._ttokenAmount, "");
            _amount = _order._ttokenAmount;
            _tokenId = _order._ttokenId;
        }


        if (keccak256(abi.encodePacked((ERC1155_TOKEN.name()))) == keccak256(abi.encodePacked(("CTOKEN")))) {
            
            require(msg.sender == _order._ctokenReceiver, "invalid withdrawee");
            ERC1155_TOKEN.safeTransferFrom(address(this), _order._ctokenReceiver, _order._ctokenId, _order._ctokenAmount, "");
            _amount = _order._ctokenAmount;
            _tokenId = _order._ctokenId;
        }

        
        _swapOrder[_orderId]._secretKey = _secretKey;
        _swapState[_orderId] = AtomicSwapState.CLOSED;

        emit ClosedOrder(msg.sender, _amount , _tokenId);

    }

    function RefundOrder() external {

    }

    /**
        @dev    function to fetch order details by id
        @param  _orderId is the id of the order to be queried

     */
    function checkOrder(uint256 _orderId) external view returns(address _ctokenReceiver, address _ttokenReceiver, uint256 _ctokenReceiverExpiration, uint256 _ttokenReceiverExpiration, uint256 _ctokenAmount, uint256 _ttokenAmount, uint256 _ctokenId, uint256 _ttokenId, AtomicSwapState _atomicSwapState, bool _funded, bytes32 _secretKey) {

            require(_swapState[_orderId] != AtomicSwapState.INVALID, "invalid Id");
            AtomicSwapOrder memory _order = _swapOrder[_orderId];

            return (_order._ctokenReceiver, _order._ttokenReceiver, _order._ctokenWithdrawalExpiration, _order._ttokenWithdrawalExpiration, _order._ctokenAmount, _order._ttokenAmount, _order._ctokenId, _order._ttokenId, _order._atomicSwapState, _order._funded, _order._secretKey); 

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

    


    /**
        @dev    Events
    */

    event OpenedOrder (address indexed _ctokenReceiver, address indexed _ttokenReceiver, uint256 _ctokenAmount, uint256 _ttokenAmount, uint256 _ctokenId, uint256 _ttokenId, uint256 _orderId);
    event DepositedOrder (address indexed _depositor, address indexed _receivingContract, uint256 _orderId, uint256 _tokenId, uint256 _tokenAmount);
    event ClosedOrder(address indexed _withdrawee, uint256 _amount, uint256 _tokenId);
}