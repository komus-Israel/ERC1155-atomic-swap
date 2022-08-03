const moment = require("moment");


//  function to create delay in seconds
const wait=(seconds)=>{
    const milliseconds= seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

//  an object that map numbers to state 
const swapState = {

    INVALID: "0",
    OPEN: "1",
    CLOSED: "2",
    EXPIRED:  "3"

}



//  function to genere secret Hash

const hashSecret =(secretPhrase)=>{

    const secretHex = stringToHex(secretPhrase).hex
    const dataHex = web3.eth.abi.encodeParameter("bytes32", secretHex)
    const secretHash = ethers.utils.sha256(dataHex)

    //  return the secret phrase and its encoded data
    return { secretHex, secretHash}

}

//  convert string to hex (bytes32)

const stringToHex = (string)=>{

    const hex = web3.utils.asciiToHex(string)
    return { string, hex }

}
