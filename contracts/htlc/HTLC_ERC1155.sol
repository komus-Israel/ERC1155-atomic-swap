pragma solidity 0.6.2;

contract HTLC {

    address private _erc_1155_token;

    constructor(address erc_1155_token) public {
        _erc_1155_token = erc_1155_token;
    }

    function getToken() external view returns (address) {
        return _erc_1155_token;
    }

}