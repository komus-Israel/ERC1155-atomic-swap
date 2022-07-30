pragma solidity >=0.4.16 <0.9.0;

import '../utils/Erc1155_6_6.sol';

//import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
// SPDX-License-Identifier: MIT

contract CTOKEN is ERC1155  {
   
    
    string constant public name = "CTOKEN";
    string constant public symbol = "CTOKEN";
    uint8 constant public decimals = 5;
    
    uint256  public responseFromAPI;
    uint256 public volume;
    uint256 public nextTokenID;    

    mapping(uint256 => uint256) private _totalSupply;
    
    event LogConstructorInitiated(string nextStep);
    event LogPriceUpdated(string price);
    event LogNewProvableQuery(string description);
    
    event RecordedData(address acct, string description, string data);
    
    address public contractOwner;
    
    //modifier to restrict calling the function other than contract_owner
    modifier onlyContractOwner {
        require(
            msg.sender == contractOwner,
            "Only contractOwner can call this function."
        );
        _;
    }

     // constructor of the class for KOVAN
        constructor() public ERC1155("CTOKEN") {
            //address _oracle, string memory _jobId, uint256 _fee
        contractOwner = msg.sender;
        //setPublicChainlinkToken();
      
    }
    /*add signature message as another parameter to restrict only authorized user can execute this method*/

    // minting token can only be called by contractOwner 
     function createToken (address account, uint256 tokencount , string memory uri ,bytes memory data) public { 
         require(msg.sender == account || msg.sender == contractOwner,"Only authorized user can mint");

             _mint (account, nextTokenID, tokencount, uri,data);             
                
            _totalSupply[nextTokenID] += tokencount;
            nextTokenID++;
         }
    // function to burn the token can only be called by contractOwner or _walletApproved
    function burnToken(address account,uint256 tokenID, uint256 amount) public {
        require(balanceOf(account, tokenID) > 0, "No tokens to burn in this wallet");

        _burn(account,tokenID,amount);
        _totalSupply[tokenID] -= amount;
    }
    
    
        /**
     * @dev Total amount of tokens in with a given companyID.
     */
    function totalSupply(uint256 tokenID) public view  returns (uint256) {
        return _totalSupply[tokenID];
    }
    
    function nextTokenId() public view  returns (uint256) {
        return nextTokenID;
    }
    /**
     * @dev Indicates weither any token exist with a given id, or not.
     */
    function exists(uint256 tokenID) public view  returns (bool) {
        return totalSupply(tokenID) > 0;
    }
    
        /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {safeTransferFrom}.
     *
     * Emits a {TransferBatch} event.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
     * acceptance magic value.
     */
    function safeBatchTransferFrom(address from,address to,uint256[] memory ids,uint256[] memory amounts,bytes memory data) public override {
        require(from == _msgSender() || isApprovedForAll(from, _msgSender()),"ERC1155: transfer caller is not owner nor approved" );
        
            _safeBatchTransferFrom(from, to, ids, amounts, data);
        
    }
          /**
     * @dev Transfers `amount` tokens of token type `id` from `from` to `to`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If the caller is not `from`, it must be have been approved to spend ``from``'s tokens via {setApprovalForAll}.
     * - `from` must have a balance of tokens of type `id` of at least `amount`.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
     /*add signature message as another parameter to restrict only authorized user can execute this method*/
    function safeTransferFrom(address from,address to,uint256 id,uint256 amount,bytes memory data) public virtual override {
        require(msg.sender == contractOwner || msg.sender == from || from == _msgSender() || isApprovedForAll(from, _msgSender()),"ERC1155: caller is not owner nor approved");
        
            _safeTransferFrom(from, to, id, amount, data);
    }
    
     
     // contract recieving ether
     //The function cannot have arguments, cannot return anything and must have external visibility and payable state mutability.
     receive() external payable {
            // React to receiving ether
        }
    /**
     * Receive the response in the form of uint256
     */ 
    //function fulfill(bytes32 _requestId, uint256 _volume) public recordChainlinkFulfillment(_requestId)
    //{
    //    responseFromAPI = _volume;
    //}
    
    //getting Rate of interest from api
    function responseInterestFromApi() public view returns (uint256)
    {
        return responseFromAPI;
    }
    
    function transferContractownership(address _address) public onlyContractOwner
    {
        contractOwner = _address;
    }
    
   
    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
    bytes memory tempEmptyStringTest = bytes(source);
    if (tempEmptyStringTest.length == 0) {
        return 0x0;
    }

    assembly {
        result := mload(add(source, 32))
    }
}
    
    
}