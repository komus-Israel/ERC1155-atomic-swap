require("chai")
    .use(require("chai-as-promised"))
    .should()

const HTLC = artifacts.require("./HTLC")
const ERC1155_TOKEN = artifacts.require("./CTOKEN")

contract("HTLC contract unit test for ERC1155", ()=>{

    let htlc
    let erc1155_ctoken 

    beforeEach(async()=>{
        erc1155_ctoken = await ERC1155_TOKEN.new()
        htlc = await HTLC.new(erc1155_ctoken.address)
    })

    describe("contract deployment", ()=>{

        it("should have address for the deployed contracts", ()=>{
            erc1155_ctoken.address.should.not.be.equal("", "ctoken has a contract address")
            htlc.address.should.not.be.equal("", "htlc contract has an address")
        })

    })

})



