'use strict'
require('dotenv').config()

const fs = require('fs')
const pinataSDK = require('@pinata/sdk')
const mongoose = require('mongoose')
const Asset = mongoose.model('Asset')

const ninstaContract = require('../utils/contract.js')

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET
)
module.exports = async function (agenda) {
  agenda.define('mintnft', async (job, done) => {
    try {
      const {
        name,
        description,
        fileName,
        fileType,
        royalty,
        royaltyPer,
        wallet,
        handle,
        userId
      } = job.attrs.data
      let tokenId
      if (!job.attrs.data?.isMinted) {
        if (!job.attrs.data?.isMediaUploaded) {
          let media = await uploadImage(`./public/${fileName}`, name)
          job.attrs.data.isMediaUploaded = true
          job.attrs.data.media = media
        }
        if (!job.attrs.data?.isMetaUploaded) {
          let jsonData = {
              name,
              description,
              image: job.attrs.data.media
            },
            metaData = await uploadJson(jsonData),
            assetUri = `https://ipfs.io/ipfs/${metaData}`

          job.attrs.data.isMetaUploaded = true
          job.attrs.data.assetUri = assetUri
          let mintResult = await ninstaContract.mintNFT(
            wallet,
            assetUri,
            handle
          )
          tokenId = parseInt(mintResult.tokenId)
          job.attrs.data.isMinted = true
          job.attrs.data.tokenId = tokenId
        }
      }
      let newAsset = await Asset.create({
        user: userId,
        title: name,
        description,
        royalty,
        media: { path: job.attrs.data?.media, mimeType: fileType },
        royaltyPer,
        assetUri: job.attrs.data?.assetUri,
        tokenId: job.attrs.data?.tokenId || tokenId,
        wallet: await ninstaContract.checkSumAddress(wallet),
        isMinted: true
      })

      console.log(`----------Data saved-------NINSTA-NFT`)
      job.remove()
      done()
    } catch (e) {
      console.log('error', e)
      throw e
      done()
    }
  })
}

const uploadImage = async (filePath, name) => {
  try {
    console.log('----Uploading Media------')
    let pinataStatus = await pinata.testAuthentication()
    const readableStreamForFile = fs.createReadStream(filePath),
      options = {
        pinataMetadata: {
          name: name
        }
      },
      { IpfsHash } = await pinata.pinFileToIPFS(readableStreamForFile, options)
    let imageUrl = 'https://gateway.pinata.cloud/ipfs/${IpfsHash}'
    console.log(`-------------Media uploaded-----------`)
    fs.unlinkSync(filePath)
    return imageUrl
  } catch (e) {
    console.log(`----------failed to upload media-------`)
    throw e
  }
}

const uploadJson = async data => {
  try {
    console.log('----Uploading Meta data------')
    let pinataStatus = await pinata.testAuthentication()
    const options = {
      pinataMetadata: {
        name: data.name
      }
    }
    let result = await pinata.pinJSONToIPFS(data, options)
    return result?.IpfsHash
  } catch (e) {
    console.log(`----------failed to upload metadata-------`)
    throw e
  }
}
