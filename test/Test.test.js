const Test = artifacts.require("./Test")

require("chai")
    .use(require("chai-as-promised"))
    .should()

contract("Test contract unit test", ()=>{

    let test

    beforeEach(async()=>{
        test = await Test.new()
    })

    describe("contract address", ()=>{

        it("should have a contract address", ()=>{
            
            test.address.should.not.be.equal("", "it has a contrat address")
        })
    })

    describe("get number", ()=>{

        it("should get the number", async()=>{
            const number  = await test.getNumber(10)
            Number(number).should.be.equal(10, "it returned the correct number")
        })

        it("should revert", async()=>{
            await test.getNumber(2).should.be.rejectedWith("invalid")
            //const number = await test.getNumber(2)
            //Number(number).should.be.equal(10, "it returned the correct number")
        })
    })

})