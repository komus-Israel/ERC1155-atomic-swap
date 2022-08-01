require("chai")
    .use(require("chai-as-promised"))
    .should()

const HTLC = artifacts.require("./HTLC")
const ERC1155_TOKEN = artifacts.require("./CTOKEN")

contract("HTLC contract unit test for ERC1155", ([deployer])=>{

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

    describe ("transfer of token to the htlc", ()=>{

        beforeEach(async()=>{
            await erc1155_ctoken.createToken(deployer, 100, "", web3.utils.asciiToHex(""), {from: deployer})
        })

        it("increments the balance of the deployer", async()=>{
            const balance = await erc1155_ctoken.balanceOf(deployer, 0)
            Number(balance).should.be.equal(100, "the deployer got the minted token")
        })

        it("fails to send token to", async()=>{
            await erc1155_ctoken.safeTransferFrom(deployer, htlc.address,  0, 1, web3.utils.asciiToHex("")).should.be.rejected
            const balance = await erc1155_ctoken.balanceOf(deployer, 0)
            Number(balance).should.be.equal(100, "the deployer's balance was retained")
        })


    })

})



