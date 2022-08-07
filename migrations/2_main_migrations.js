//  Eth migration
//  deploy ttoken and thtlc on ethereum
/*const TTOKEN = artifacts.require("TTOKEN");
const THTLC = artifacts.require("HTLC")

module.exports = async function (deployer) {
  
  await deployer.deploy(TTOKEN)
  await deployer.deploy(THTLC, TTOKEN.address)

};*/


//  Avalaunch migration
//  deploy ctoken and chtlc on avalaunche
const CTOKEN = artifacts.require("CTOKEN");
const CHTLC = artifacts.require("HTLC")

module.exports = async function (deployer) {
  
  await deployer.deploy(CTOKEN)
  await deployer.deploy(CHTLC, CTOKEN.address)

};
