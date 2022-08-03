pragma solidity 0.6.2;

interface IERCToken {

    function safeBatchTransferFrom(address from,address to,uint256[] calldata ids,uint256[] calldata amounts,bytes calldata data) external;

}