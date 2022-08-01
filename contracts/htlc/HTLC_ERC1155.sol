pragma solidity 0.6.2;

import "../utils/ERC1155Receiver.sol";

 // SPDX-License-Identifier: MIT

 ///    @title HTLC for ERC1155 atomic swap

/** 
    @notice    this contract this implements ERC1155Receiver so as to receive token deposits 
 */

 

contract HTLC is ERC1155Receiver {

    address private _erc_1155_token;

    constructor(address erc_1155_token) public {

        _erc_1155_token = erc_1155_token;
    }

    function openOrder() external {

    }

    function fullfillOrder() external {

    }

    function withdrawOrder() external {
        
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