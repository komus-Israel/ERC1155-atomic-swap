pragma solidity 0.6.2;

interface IERCToken {

    function safeTransferFrom(address from,address to,uint256 id,uint256 amount,bytes calldata data) external;
    function isApprovedForAll(address account, address operator) external view returns (bool);
    function name() external view returns (string memory);

}