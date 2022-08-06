require("chai")
    .use(require("chai-as-promised"))
    .should()

const { hashSecret, REVERTS, stringToHex, swapState, BYTES_0, hexToUtf8, wait } = require("./helper")

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

        it("should have addresses for the deployed contracts", ()=>{
            erc1155_ctoken.address.should.not.be.equal("", "ctoken has a contract address")
            erc1155_ttoken.address.should.not.be.equal("", "ttoken has a contract address")
            chtlc.address.should.not.be.equal("", "chtlc contract has an address")
            thtlc.address.should.not.be.equal("", "thtlc contract has an address")
        })

    })

    describe("balances", ()=>{

        it("updates the balances of the deployer and the token recipients", async()=>{
            ctokenReceiver_ttokenBalance  = await erc1155_ttoken.balanceOf(ctokenReceiver, 0)
            ttokenReceiver_ctokenBalance  = await erc1155_ctoken.balanceOf(ttokenReceiver, 0)

            Number(ctokenReceiver_ttokenBalance).should.be.equal(100, "ctoken receiver received some ttokens")
            Number(ttokenReceiver_ctokenBalance).should.be.equal(100, "ttoken receiver received some ctokens")
            
        })

    })

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
                    checkOrder._secretKey.should.be.equal(BYTES_0, "the secret isn't revealed publicly")
                    Number(checkOrder._ctokenId).should.be.equal(0, "it checks the ctoken id")
                    Number(checkOrder._ttokenId).should.be.equal(0, "it checks the ttoken id")

                    const _ctokenReceiverExpiration = checkOrder._ctokenReceiverExpiration
                    const _ttokenReceiverExpiration = checkOrder._ttokenReceiverExpiration

                    Number(_ttokenReceiverExpiration - _ctokenReceiverExpiration).should.be.equal(1800, "the time difference between the two recipients is 30 minutes")

                    checkOrder._

                })

                it("checks the order details for thtlc", async()=>{
                    const checkOrder = await thtlc.checkOrder(1)

                    checkOrder._funded.should.be.equal(true, "the ttoken htlc has been funded by the ttoken depositor, a.k.a ctoken receiver")
                    checkOrder._ctokenReceiver.should.be.equal(ctokenReceiver, "it checks the ctoken receiver")
                    checkOrder._ttokenReceiver.should.be.equal(ttokenReceiver, "it checks the ttoken receiver")
                    checkOrder._atomicSwapState.toString().should.be.equal(swapState.OPEN, "it checks the order state")
                    checkOrder._secretKey.should.be.equal(BYTES_0, "the secret isn't revealed publicly")
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
                    checkOrder._secretKey.should.be.equal(BYTES_0, "the secret isn't revealed publicly")
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
                    checkOrder._secretKey.should.be.equal(BYTES_0, "the secret isn't revealed publicly")
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

    describe("order funding", ()=>{

        let secretPhrase = "access"
            let secretKey
            let secrethash

            beforeEach(async()=>{

                secretKey =  hashSecret(secretPhrase).secretHex
                secretHash = hashSecret(secretPhrase).secretHash


            })

        

        describe("initiated order by ctoken receiver", ()=>{

            let chtlc_open_order
            let thtlc_open_order

            beforeEach(async ()=>{
                //  ctoken receiver approves THTLC to move and deposit his ttokens 
                await erc1155_ttoken.setApprovalForAll(thtlc.address, true, {from: ctokenReceiver})
                    
                //  he opens the order
                chtlc_open_order = await chtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ctokenReceiver})
                thtlc_open_order = await thtlc.openOrder(1, 0, 0, 10, 10, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ctokenReceiver})
            })

            describe("fund status",  ()=>{

                let checkCHTLCOrder 
                let checkTHTLCOrder 

                beforeEach(async()=>{
                    checkCHTLCOrder = await chtlc.checkOrder(1)
                    checkTHTLCOrder = await thtlc.checkOrder(1)
                })

                describe("check funded order status before funding by the other party", ()=>{

                    it("checks the funded status of the htlcs", ()=>{
                        checkCHTLCOrder._funded.should.be.equal(false,  "order yet to be funded by the ctoken giver aka ttoken receiver")
                        checkTHTLCOrder._funded.should.be.equal(true,  "order funded by the ttoken giver aka ctoken receiver")
                    
                    })

                describe("funding", ()=>{

                    let chtlc_funding

                    beforeEach(async()=>{

                        await erc1155_ctoken.setApprovalForAll(chtlc.address, true, {from: ttokenReceiver})
                        chtlc_funding = await chtlc.depositOrder(1, {from: ttokenReceiver})
                    })

                    describe("success", ()=>{

                        it("emits the DepositedOrder event", ()=>{
                            chtlc_funding.logs[0].event.should.be.equal("DepositedOrder", "it emits the deposited order event")
                            chtlc_funding.logs[0].args._depositor.should.be.equal(ttokenReceiver, "the emits the depositor of the order")
                            chtlc_funding.logs[0].args._receivingContract.should.be.equal(chtlc.address, "the emits the recipient contract")
                            Number(chtlc_funding.logs[0].args._orderId).should.be.equal(1, "it emits the order id")
                            Number(chtlc_funding.logs[0].args._tokenId).should.be.equal(0, "it emits the token id")
                            Number(chtlc_funding.logs[0].args._tokenAmount).should.be.equal(10, "it emits the token deposited")

                            
                        })

                        it("checks the order", async()=>{
                            checkCHTLCOrder = await chtlc.checkOrder(1)
                            checkCHTLCOrder._funded.should.be.equal(true,  "order funded by the ctoken giver aka ttoken receiver")
                        })

                    })

                    describe("failure", ()=>{

                        beforeEach(async()=>{

                            //  approves htlc to move the token
                            await erc1155_ctoken.setApprovalForAll(chtlc.address, true, {from: ttokenReceiver})


                            //  he opens the order
                            chtlc_open_order = await chtlc.openOrder(2, 0, 0, 10, 20, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver})
                            thtlc_open_order = await thtlc.openOrder(2, 0, 0, 10, 20, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver})
                        })

                        it("fails to fund a funded order", async()=>{
                            await chtlc.depositOrder(1, {from: ttokenReceiver}).should.be.rejectedWith(REVERTS.FUNDED_ORDER)
                            
                        })

                        it("fails to fund an unopened order", async()=>{
                            await chtlc.depositOrder(3, {from: ttokenReceiver}).should.be.rejectedWith(REVERTS.NOT_OPENED)
                        })

                        it("fails to accept deposit from an invalid depositor", async()=>{
                            await thtlc.depositOrder(2, {from: ttokenReceiver}).should.be.rejectedWith(REVERTS.INVALID_DEPOSITOR)
                        })

                        it("fails to accept deposit from if contract has not been approved", async()=>{
                            await erc1155_ttoken.setApprovalForAll(thtlc.address, false, {from: ctokenReceiver})
                            await thtlc.depositOrder(2, {from: ctokenReceiver}).should.be.rejectedWith(REVERTS.UNAPPROVED_TTOKEN)
                        })

                        it("fails to fund an expired order", async()=>{

                            await wait(31)      // wait for 30 seconds for the order to expire
                            await thtlc.depositOrder(2, {from: ctokenReceiver}).should.be.rejectedWith(REVERTS.EXPIRED_ORDER)

                        })


                    })

                })

                    


                })
                
            })
        })

        describe("initiated order by ttoken receiver", ()=>{

            let chtlc_open_order
            let thtlc_open_order

            beforeEach(async ()=>{
                //  ttoken receiver approves CHTLC to move and deposit his ctokens 
                await erc1155_ctoken.setApprovalForAll(chtlc.address, true, {from: ttokenReceiver})
                    
                //  he opens the order
                chtlc_open_order = await chtlc.openOrder(1, 0, 0, 10, 20, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver})
                thtlc_open_order = await thtlc.openOrder(1, 0, 0, 10, 20, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver})
            })

            describe("order status", ()=>{

                let checkCHTLCOrder 
                let checkTHTLCOrder 

                beforeEach(async()=>{
                    checkCHTLCOrder = await chtlc.checkOrder(1)
                    checkTHTLCOrder = await thtlc.checkOrder(1)
                })

                describe("fund status", ()=>{

                    it("checks the fund status of the two htlc contracts", async()=>{
                        checkCHTLCOrder._funded.should.be.equal(true, "ctoken has been deposited by the ttoken receiver")
                        checkTHTLCOrder._funded.should.be.equal(false, "ttoken  has not been deposited by the ctoken receiver")
                        
                    })

                })

                describe("funding", ()=>{

                    let thtlc_funding

                    beforeEach(async()=>{
                        
                        await erc1155_ttoken.setApprovalForAll(thtlc.address, true, {from: ctokenReceiver})
                        thtlc_funding = await thtlc.depositOrder(1, {from: ctokenReceiver})
                    })

                    describe("order cheking after token deposit", ()=>{

                        it("updates the funding status after depositing", async()=>{
                            
                            checkTHTLCOrder = await thtlc.checkOrder(1)

                            checkTHTLCOrder._funded.should.be.equal(true, "ctoken deposited")
                        })

                        it("emits event and event data", async()=>{
                            thtlc_funding.logs[0].event.should.be.equal("DepositedOrder", "it emits the event after token deposit")
                            thtlc_funding.logs[0].args._depositor.should.be.equal(ctokenReceiver, "it emits the depositor of the order")
                            thtlc_funding.logs[0].args._receivingContract.should.be.equal(thtlc.address, "it emits the recipient contract of the deposit")
                            Number(thtlc_funding.logs[0].args._orderId).should.be.equal(1, "it emits the order ID")
                            Number(thtlc_funding.logs[0].args._tokenId).should.be.equal(0, "it emits the token id")
                            Number(thtlc_funding.logs[0].args._tokenAmount).should.be.equal(20, "it emits the amount deposited")
                        })

                    })

                })
            })

        })

       

    })

    describe("order withdrawal", ()=>{

            let secretPhrase = "access"
            let secretKey
            let secrethash

            beforeEach(async()=>{
                secretKey =  hashSecret(secretPhrase).secretHex
                secretHash = hashSecret(secretPhrase).secretHash 

                await erc1155_ctoken.setApprovalForAll(chtlc.address, true, {from: ttokenReceiver})


                chtlc_open_order = await chtlc.openOrder(1, 0, 0, 10, 20, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver})
                thtlc_open_order = await thtlc.openOrder(1, 0, 0, 10, 20, ctokenReceiver, ttokenReceiver, secretKey, secretHash, {from: ttokenReceiver})
            })

        describe("failed withdrawal", ()=>{

            it("fails to withdraw a non opened order", async()=>{
                await chtlc.withdrawOrder(2, secretKey, {from: ctokenReceiver}).should.be.rejectedWith(REVERTS.NOT_OPENED)
            })

            it("fails to withdraw with an invalid secret", async()=>{
                await chtlc.withdrawOrder(1, stringToHex("wrong").hex, {from: ctokenReceiver}).should.be.rejectedWith(REVERTS.INVALID_SECRET)
            })

            it("fails to withdraw to an invalid withdrawee", async()=>{
                await chtlc.withdrawOrder(1, stringToHex("access").hex, {from: ttokenReceiver}).should.be.rejectedWith(REVERTS.INVALID_WITHDRAWEE)
                await chtlc.withdrawOrder(1, stringToHex("access").hex, {from: deployer}).should.be.rejectedWith(REVERTS.INVALID_WITHDRAWEE)
            })

            it("fails to withdraw a non funded order", async()=>{
                await thtlc.withdrawOrder(1, stringToHex("access").hex, {from: ttokenReceiver}).should.be.rejectedWith(REVERTS.NOT_FUNDED)
            })

            it("fails to withdraw an expired order", async()=>{

                //  ctoken receiver funds the order
                await erc1155_ttoken.setApprovalForAll(thtlc.address, true, {from: ctokenReceiver})
                await thtlc.depositOrder(1, {from: ctokenReceiver})

                //  withdrawal expires
                await wait(31)

                //  withdrawal fails
                await thtlc.withdrawOrder(1, stringToHex("access").hex, {from: ttokenReceiver}).should.be.rejectedWith(REVERTS.EXPIRED_ORDER)

            })

        })

        describe("successful withdrawal", ()=>{

            //  ctoken receiver deposits ttoken
            beforeEach(async()=>{

                await erc1155_ttoken.setApprovalForAll(thtlc.address, true, {from: ctokenReceiver})
                await thtlc.depositOrder(1, {from: ctokenReceiver})

            })

            /**
             * ctokenReceiver deposits ttokens 
             * ttokenReceiver withdraws ttoken by providing secret
             * cctoken Receiver takes secret and uses it to withdraw ctokens
             */

            describe("first withdrawal by the order initiator and secret holder", ()=>{

                let ttoken_withdrawal
                let checkTHTLCOrderBeforeWithdrawal

                beforeEach(async()=>{
                    checkTHTLCOrderBeforeWithdrawal = await thtlc.checkOrder(1)
                    ttoken_withdrawal = await thtlc.withdrawOrder(1, secretKey, {from: ttokenReceiver})
                })

            

                it("emits the ClosedOrder event and event data", async()=>{
                    
                    ttoken_withdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
                    ttoken_withdrawal.logs[0].args._withdrawee.should.be.equal(ttokenReceiver, "it emits the withdrawee/ttoken receiver's address")
                    Number(ttoken_withdrawal.logs[0].args._amount).should.be.equal(20, "it emits the amount of tokens withdrawn")
                    Number(ttoken_withdrawal.logs[0].args._tokenId).should.be.equal(0, "it emits the id of  the token withdrawn")

                })

                it("reveals the secret after successful withdrawal", async()=>{
                    const checkTHTLCOrderAfterWithdrawal = await thtlc.checkOrder(1)

                    hexToUtf8(checkTHTLCOrderBeforeWithdrawal._secretKey).should.be.equal("", "secret not revealed before withdrawal by order initiator")
                    hexToUtf8(checkTHTLCOrderAfterWithdrawal._secretKey).should.be.equal(secretPhrase, "secret revealed after withdrawal by order initiator")

                })


                it("updates the order state to CLOSED",  async()=>{
                    const checkTHTLCOrderAfterWithdrawal = await thtlc.checkOrder(1)
                    checkTHTLCOrderAfterWithdrawal._atomicSwapState.toString().should.be.equal(swapState.CLOSED, "it updates the state of the order to CLOSED")
                })

            })

            describe("withdrawal by the secret recipient", ()=>{

                let ctoken_withdrawal
                let checkCHTLCOrderBeforeWithdrawal

                beforeEach(async()=>{

                    checkCHTLCOrderBeforeWithdrawal = await chtlc.checkOrder(1)
                    ctoken_withdrawal = await chtlc.withdrawOrder(1, secretKey, {from: ctokenReceiver})
                })

                 it("emits the ClosedOrder event and event data", async()=>{
                    
                    ctoken_withdrawal.logs[0].event.should.be.equal("ClosedOrder", "it emits the closed order event")
                    ctoken_withdrawal.logs[0].args._withdrawee.should.be.equal(ctokenReceiver, "it emits the withdrawee/ctoken receiver's address")
                    Number(ctoken_withdrawal.logs[0].args._amount).should.be.equal(10, "it emits the amount of tokens withdrawn")
                    Number(ctoken_withdrawal.logs[0].args._tokenId).should.be.equal(0, "it emits the id of  the token withdrawn")

                })

                it("reveals secret on the initiator's order after final withdrawal", async()=>{
                    const checkCHTLCOrderAfterWithdrawal = await chtlc.checkOrder(1)

                    hexToUtf8(checkCHTLCOrderBeforeWithdrawal._secretKey).should.be.equal("", "secret not reflecting on the initiator's order before withdrawal by secret recipient")
                    hexToUtf8(checkCHTLCOrderAfterWithdrawal._secretKey).should.be.equal(secretPhrase, "secret reflect on the initiator's order after withdrawal by order recipient")

                })

                it("updates the order state to CLOSED",  async()=>{
                    const checkCHTLCOrderAfterWithdrawal = await chtlc.checkOrder(1)
                    checkCHTLCOrderAfterWithdrawal._atomicSwapState.toString().should.be.equal(swapState.CLOSED, "it updates the state of the order to CLOSED")
                })

                

            })

        })
        
    })
})


