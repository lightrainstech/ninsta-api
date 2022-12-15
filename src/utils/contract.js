const Web3 = require('web3')
var ethers = require('ethers')
const fs = require('fs')
const nftAbi = require('../../abi/ninsta.json')
const axios = require('axios')

const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC)

const privateKey = process.env.PRIVATE_KEY
const wallet = new ethers.Wallet(privateKey)
wallet.provider = provider
const signer = wallet.connect(provider)

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.JSON_RPC))
const Contract = web3.eth.Contract

//const nftAbi = JSON.parse(nftAbiJson)
const ninstaContract = new ethers.Contract(
  process.env.NINSTA_CONTRACT_ADDRESS,
  nftAbi,
  signer
)
let iface = new ethers.utils.Interface(nftAbi)
const mintNFT = (
  toAddress,
  assetUri,
  handle,
  royaltyWallet,
  royaltyPercentage
) =>
  new Promise((resolve, reject) =>
    calculateGas()
      .then(feeData =>
        ninstaContract
          .adminMint(
            toAddress,
            assetUri,
            handle,
            royaltyWallet,
            royaltyPercentage,
            {
              gasPrice: feeData
            }
          )
          .then(tx => {
            console.log('Waiting for confirmation....')
            return tx.wait()
          })
          .then(receipt => {
            console.log(`---------Minting Completed---------`)
            let log = iface.parseLog(receipt.logs[0])
            return resolve({
              tokenId: log.args.tokenId,
              status: receipt.status
            })
          })
          .catch(e => reject(e))
      )
      .catch(e => reject(e))
  )

const calculateGas = async () => {
  try {
    const { data } = await axios({
      method: 'get',
      url: process.env.MATIC_GAS_STATION
    })

    let maxFeePerGas = web3.utils.toWei(
      Math.ceil(data.fast.maxFee) + '',
      'gwei'
    )
    return maxFeePerGas
  } catch (error) {
    return 60000000000
  }
}

const getLimit = async account => {
  try {
    const address = web3.utils.toChecksumAddress(account)
    let data = await ninstaContract.getFreeMinting(address)
    return { limit: parseInt(data[0]), isMature: data[1] }
  } catch (error) {
    throw error
  }
}

const updateFreeMintLimit = (toAddress, limit) =>
  new Promise((resolve, reject) =>
    calculateGas()
      .then(feeData =>
        ninstaContract
          .setFreeMinting(toAddress, limit, {
            gasPrice: feeData
          })
          .then(tx => {
            console.log('Waiting for confirmation....')
            return tx.wait()
          })
          .then(receipt => {
            console.log(`---------Limit updated---------`)
            return resolve(receipt)
          })
          .catch(e => reject(e))
      )
      .catch(e => reject(e))
  )

const checkSumAddress = async account => {
  return web3.utils.toChecksumAddress(account)
}

module.exports = {
  mintNFT,
  getLimit,
  checkSumAddress,
  updateFreeMintLimit
}
