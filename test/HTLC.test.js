require("chai")
    .use(require("chai-as-promised"))
    .should()

const { hashSecret, REVERTS, stringToHex } = require("./helper")

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


        //  mint ctoken and ttoken
        await erc1155_ctoken.createToken(deployer, 1000, "", stringToHex("").hex, {from: deployer})
        await erc1155_ttoken.createToken(deployer, 1000, "", stringToHex("").hex, {from: deployer})

        //  transfer ttoken to htlc ctoken reciever
        await erc1155_ttoken.safeTransferFrom(deployer, ctokenReceiver, 0, 100, stringToHex("").hex, {from: deployer})
        
        //  transfer ctoken to htlc ttoken receiver
        await erc1155_ctoken.safeTransferFrom(deployer, ttokenReceiver, 0, 100, stringToHex("").hex, {from: deployer})
    
    })


    describe("balances", ()=>{

        it("updates the balances of the deployer and the token recipients", async()=>{
            ctokenReceiver_ttokenBalance  = await erc1155_ttoken.balanceOf(ctokenReceiver, 0)
            ttokenReceiver_ctokenBalance  = await erc1155_ctoken.balanceOf(ttokenReceiver, 0)

            Number(ctokenReceiver_ttokenBalance).should.be.equal(100, "ctoken receiver received some ttokens")
            Number(ttokenReceiver_ctokenBalance).should.be.equal(100, "ttoken receiver received some ctokens")
            
        })

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

            let secretPhrase = "access"
            let secretKey
            let secrethash

            beforeEach(async()=>{

                secretKey =  hashSecret(secretPhrase).secretHex
                secretHash = hashSecret(secretPhrase).secretHash


            })

            it("opens the order successfully when ctoken receiver is the initiator", async()=>{

                //  ctoken receiver approves THTLC to move the tokens 
                await erc1155_ttoken.setApprovalForAll(thtlc.address, true, {from: ctokenReceiver})

                //  open the order
                await chtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ctokenReceiver})
                await thtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ctokenReceiver})


            })


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

            it("fails to open if the order initiator fails to approve the contract to move the token he is depositing", async()=>{
                

                //  simulate opening order as ctokenReceiver
                await chtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ctokenReceiver})
                await thtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ctokenReceiver}).should.be.rejectedWith(REVERTS.UNAPPROVED_TTOKEN, "unapproved ttoken")
               

                //  simulate opening order as ttokenReceiver
                await chtlc.openOrder(2, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver}).should.be.rejectedWith(REVERTS.UNAPPROVED_CTOKEN, "unapproved ctoken")
                await thtlc.openOrder(2, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver})
            })

        })

    })
})


