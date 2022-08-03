require("chai")
    .use(require("chai-as-promised"))
    .should()

const { hashSecret, REVERTS, stringToHex, swapState } = require("./helper")

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

            describe("order initiated by ctoken receiver", ()=>{

                let chtlc_open_order
                let thtlc_open_order

                beforeEach(async ()=>{
                    //  ctoken receiver approves THTLC to move and deposit his ttokens 
                    await erc1155_ttoken.setApprovalForAll(thtlc.address, true, {from: ctokenReceiver})
                        
                    //  he opens the order
                    chtlc_open_order = await chtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ctokenReceiver})
                    thtlc_open_order = await thtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ctokenReceiver})
                })

                it("emits the opened order event and event data", async()=>{
                    
                    //  event data test for Ctoken HTLC
                    chtlc_open_order.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder")
                    chtlc_open_order.logs[0].args._ctokenReceiver.should.be.equal(ctokenReceiver, "it emits the ctoken receiver's address")
                    chtlc_open_order.logs[0].args._ttokenReceiver.should.be.equal(ttokenReceiver, "it emits the ttoken receiver's address")
                    Number(chtlc_open_order.logs[0].args._ctokenAmount).should.be.equal(10, "it emits the amount of ctoken to be transacted")
                    Number(chtlc_open_order.logs[0].args._ttokenAmount).should.be.equal(10, "it emits the amount of ttoken to be transacted")
                    Number(chtlc_open_order.logs[0].args._ctokenId).should.be.equal(0, "it emits the id of ctoken to be transacted")
                    Number(chtlc_open_order.logs[0].args._ttokenId).should.be.equal(0, "it emits the id of ttoken to be transacted")

                    //  event data test for Ttoken HTLC
                    thtlc_open_order.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder")
                    thtlc_open_order.logs[0].args._ctokenReceiver.should.be.equal(ctokenReceiver, "it emits the ctoken receiver's address")
                    thtlc_open_order.logs[0].args._ttokenReceiver.should.be.equal(ttokenReceiver, "it emits the ttoken receiver's address")
                    Number(thtlc_open_order.logs[0].args._ctokenAmount).should.be.equal(10, "it emits the amount of ctoken to be transacted")
                    Number(thtlc_open_order.logs[0].args._ttokenAmount).should.be.equal(10, "it emits the amount of ttoken to be transacted")
                    Number(thtlc_open_order.logs[0].args._ctokenId).should.be.equal(0, "it emits the id of ctoken to be transacted")
                    Number(thtlc_open_order.logs[0].args._ttokenId).should.be.equal(0, "it emits the id of ttoken to be transacted")
                    

                })

                it("checks the order details for chtlc", async()=>{
                    const checkOrder = await chtlc.checkOrder(1)

                    checkOrder._funded.should.be.equal(false, "the ctoken htlc has not been funded by the ctoken depositor")
                    checkOrder._ctokenReceiver.should.be.equal(ctokenReceiver, "it checks the ctoken receiver")
                    checkOrder._ttokenReceiver.should.be.equal(ttokenReceiver, "it checks the ttoken receiver")
                    checkOrder._atomicSwapState.toString().should.be.equal(swapState.OPEN, "it checks the order state")
                    Number(checkOrder._ctokenId).should.be.equal(0, "it checks the ctoken id")
                    Number(checkOrder._ttokenId).should.be.equal(0, "it checks the ttoken id")

                    const _ctokenReceiverExpiration = checkOrder._ctokenReceiverExpiration
                    const _ttokenReceiverExpiration = checkOrder._ttokenReceiverExpiration

                    Number(_ttokenReceiverExpiration - _ctokenReceiverExpiration).should.be.equal(1800, "the time difference between the two recipients is 30 minutes")

                })

                it("checks the order details for thtlc", async()=>{
                    const checkOrder = await thtlc.checkOrder(1)

                    checkOrder._funded.should.be.equal(true, "the ttoken htlc has been funded by the ttoken depositor, a.k.a ctoken receiver")
                    checkOrder._ctokenReceiver.should.be.equal(ctokenReceiver, "it checks the ctoken receiver")
                    checkOrder._ttokenReceiver.should.be.equal(ttokenReceiver, "it checks the ttoken receiver")
                    checkOrder._atomicSwapState.toString().should.be.equal(swapState.OPEN, "it checks the order state")
                    Number(checkOrder._ctokenId).should.be.equal(0, "it checks the ctoken id")
                    Number(checkOrder._ttokenId).should.be.equal(0, "it checks the ttoken id")
                    
                    const _ctokenReceiverExpiration = checkOrder._ctokenReceiverExpiration
                    const _ttokenReceiverExpiration = checkOrder._ttokenReceiverExpiration

                    Number(_ttokenReceiverExpiration - _ctokenReceiverExpiration).should.be.equal(1800, "the time difference between the two recipients is 30 minutes")
                })

                

            })

            describe("order initiated by ttoken receiver", ()=>{

                let chtlc_open_order
                let thtlc_open_order

                beforeEach(async ()=>{
                    //  ctoken receiver approves THTLC to move and deposit his ttokens 
                    await erc1155_ctoken.setApprovalForAll(chtlc.address, true, {from: ttokenReceiver})
                        
                    //  he opens the order
                    chtlc_open_order = await chtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver})
                    thtlc_open_order = await thtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver})
                })

                it("emits the opened order event and event data", async()=>{
                    
                    //  event data test for Ctoken HTLC
                    chtlc_open_order.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder")
                    chtlc_open_order.logs[0].args._ctokenReceiver.should.be.equal(ctokenReceiver, "it emits the ctoken receiver's address")
                    chtlc_open_order.logs[0].args._ttokenReceiver.should.be.equal(ttokenReceiver, "it emits the ttoken receiver's address")
                    Number(chtlc_open_order.logs[0].args._ctokenAmount).should.be.equal(10, "it emits the amount of ctoken to be transacted")
                    Number(chtlc_open_order.logs[0].args._ttokenAmount).should.be.equal(10, "it emits the amount of ttoken to be transacted")
                    Number(chtlc_open_order.logs[0].args._ctokenId).should.be.equal(0, "it emits the id of ctoken to be transacted")
                    Number(chtlc_open_order.logs[0].args._ttokenId).should.be.equal(0, "it emits the id of ttoken to be transacted")

                    //  event data test for Ttoken HTLC
                    thtlc_open_order.logs[0].event.should.be.equal("OpenedOrder", "it emits the OpenedOrder")
                    thtlc_open_order.logs[0].args._ctokenReceiver.should.be.equal(ctokenReceiver, "it emits the ctoken receiver's address")
                    thtlc_open_order.logs[0].args._ttokenReceiver.should.be.equal(ttokenReceiver, "it emits the ttoken receiver's address")
                    Number(thtlc_open_order.logs[0].args._ctokenAmount).should.be.equal(10, "it emits the amount of ctoken to be transacted")
                    Number(thtlc_open_order.logs[0].args._ttokenAmount).should.be.equal(10, "it emits the amount of ttoken to be transacted")
                    Number(thtlc_open_order.logs[0].args._ctokenId).should.be.equal(0, "it emits the id of ctoken to be transacted")
                    Number(thtlc_open_order.logs[0].args._ttokenId).should.be.equal(0, "it emits the id of ttoken to be transacted")
                    

                })

                it("checks the order details for chtlc", async()=>{
                    const checkOrder = await chtlc.checkOrder(1)

                    checkOrder._funded.should.be.equal(true, "the ctoken htlc has not been funded by the ctoken depositor")
                    checkOrder._ctokenReceiver.should.be.equal(ctokenReceiver, "it checks the ctoken receiver")
                    checkOrder._ttokenReceiver.should.be.equal(ttokenReceiver, "it checks the ttoken receiver")
                    checkOrder._atomicSwapState.toString().should.be.equal(swapState.OPEN, "it checks the order state")
                    Number(checkOrder._ctokenId).should.be.equal(0, "it checks the ctoken id")
                    Number(checkOrder._ttokenId).should.be.equal(0, "it checks the ttoken id")

                    const _ctokenReceiverExpiration = checkOrder._ctokenReceiverExpiration
                    const _ttokenReceiverExpiration = checkOrder._ttokenReceiverExpiration

                    Number(_ctokenReceiverExpiration - _ttokenReceiverExpiration).should.be.equal(1800, "the time difference between the two recipients is 30 minutes")

                })

                it("checks the order details for thtlc", async()=>{
                    const checkOrder = await thtlc.checkOrder(1)

                    checkOrder._funded.should.be.equal(false, "the ttoken htlc has been funded by the ttoken depositor, a.k.a ctoken receiver")
                    checkOrder._ctokenReceiver.should.be.equal(ctokenReceiver, "it checks the ctoken receiver")
                    checkOrder._ttokenReceiver.should.be.equal(ttokenReceiver, "it checks the ttoken receiver")
                    checkOrder._atomicSwapState.toString().should.be.equal(swapState.OPEN, "it checks the order state")
                    Number(checkOrder._ctokenId).should.be.equal(0, "it checks the ctoken id")
                    Number(checkOrder._ttokenId).should.be.equal(0, "it checks the ttoken id")
                    
                    const _ctokenReceiverExpiration = checkOrder._ctokenReceiverExpiration
                    const _ttokenReceiverExpiration = checkOrder._ttokenReceiverExpiration

                    Number(_ctokenReceiverExpiration - _ttokenReceiverExpiration).should.be.equal(1800, "the time difference between the two recipients is 30 minutes")
                })


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


