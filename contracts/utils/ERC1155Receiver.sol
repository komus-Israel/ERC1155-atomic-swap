pragma solidity 0.6.2;

import "../utils/Erc1155_6_6.sol";

abstract contract ERC1155Receiver is ERC165, IERC1155Receiver{

    constructor() public {
        _registerInterface(

            ERC1155Receiver(0).onERC1155Received.selector ^ 
            ERC1155Receiver(0).onERC1155BatchReceived.selector
        );
    }

}