require("chai")
    .use(require("chai-as-promised"))
    .should()

const { hashSecret, REVERTS } = require("./helper")

const HTLC = artifacts.require("./HTLC")
const ERC1155_CTOKEN = artifacts.require("./CTOKEN")
const ERC1155_TTOKEN = artifacts.require("./TTOKEN")

contract("HTLC contract unit test for ERC1155", ([deployer, ctokenReceiver, ttokenReceiver])=>{

    let chtlc
    let thtlc
    let erc1155_ctoken
    let erc1155_ttoken 

    beforeEach(async()=>{
        erc1155_ctoken = await ERC1155_CTOKEN.new()     //  deploy ctoken
        erc1155_ttoken = await ERC1155_TTOKEN.new()     //  deploy ttoken
        chtlc = await HTLC.new(erc1155_ctoken.address)  //  deploy htlc for ctoken
        thtlc = await HTLC.new(erc1155_ttoken.address)  //  deploy htlc for ttoken
    })

    describe("contract deployment", ()=>{

        it("should have address for the deployed contracts", ()=>{
            erc1155_ctoken.address.should.not.be.equal("", "ctoken has a contract address")
            erc1155_ttoken.address.should.not.be.equal("", "ttoken has a contract address")
            chtlc.address.should.not.be.equal("", "chtlc contract has an address")
            thtlc.address.should.not.be.equal("", "thtlc contract has an address")
        })

    })

    /*describe ("transfer of token to the htlc", ()=>{

        beforeEach(async()=>{
            await erc1155_ctoken.createToken(deployer, 100, "", web3.utils.asciiToHex(""), {from: deployer})
        })

        it("increments the balance of the deployer", async()=>{
            const balance = await erc1155_ctoken.balanceOf(deployer, 0)
            Number(balance).should.be.equal(100, "the deployer got the minted token")
        })

        it("fails to send token to", async()=>{
            await erc1155_ctoken.safeTransferFrom(deployer, chtlc.address,  0, 1, web3.utils.asciiToHex(""))
            const balance = await erc1155_ctoken.balanceOf(deployer, 0)
            Number(balance).should.be.equal(99, "the deployer's balance was decreased after transfer")
        })


    })*/


    describe("opening order", ()=>{

        describe("success", ()=>{


        })

        describe("failure", ()=>{

            let secretPhrase = "access"
            let secretKey
            let secrethash

            beforeEach(async()=>{
                secretKey =  hashSecret(secretPhrase).secretHex
                secretHash = hashSecret(secretPhrase).secretHash 
            })

            it("fails to open if the secrethash doesn't match the secret", async()=>{
                
                wrongSecret = hashSecret("sdvdvdfb").secretHex
                await chtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, wrongSecret, secretHash, {from: ttokenReceiver}).should.be.rejectedWith(REVERTS.INVALID_SECRET)
                
            })

            it("fails to open order if the initiator is not a recipient of any of the tokens", async()=>{
                await chtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: deployer}).should.be.rejectedWith(REVERTS.INVALID_INITIATOR)
            })

            it("fails to open order if the recipient of both tokens are the same address", async()=>{
                await chtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ctokenReceiver, secretKey, secretHash, {from: ctokenReceiver}).should.be.rejectedWith(REVERTS.SAME_RECIPIENT)
                await chtlc.openOrder(1, 0, 0, 10, 10, ttokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ctokenReceiver}).should.be.rejectedWith(REVERTS.SAME_RECIPIENT)
            })

        })

    })
})



