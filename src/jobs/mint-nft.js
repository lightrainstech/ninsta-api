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
        docId,
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
      let { tokenId, assetUri } = job.attrs.data

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
          metaData = await uploadJson(jsonData)
        assetUri = `https://ipfs.io/ipfs/${metaData}`

        job.attrs.data.isMetaUploaded = true
        job.attrs.data.assetUri = assetUri
      }
      if (!job.attrs.data?.isMinted) {
        console.log(
          '---------Minting-------',
          wallet,
          assetUri,
          handle,
          royalty,
          royaltyPer
        )
        let mintResult = await ninstaContract.mintNFT(
          wallet,
          assetUri,
          handle,
          royalty,
          royaltyPer
        )
        tokenId = parseInt(mintResult.tokenId)
        job.attrs.data.isMinted = true
        job.attrs.data.tokenId = tokenId
      }
      console.log('-------saving-------')
      let assetModel = new Asset(),
        update = await assetModel.updateAsset({
          docId,
          user: userId,
          media: { path: job.attrs.data?.media, mimeType: fileType },
          tokenId: job.attrs.data?.tokenId || tokenId,
          assetUri: job.attrs.data?.assetUri,
          isMinted: true
        })
      console.log(`----------Data saved-------NINSTA-NFT----${tokenId}`)
      job.remove()
      done()
    } catch (e) {
      job.attrs.nextRunAt = new Date(
        new Date().setMinutes(new Date().getMinutes() + 5)
      )
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
          name: `image:${name}`
        }
      },
      { IpfsHash } = await pinata.pinFileToIPFS(readableStreamForFile, options)
    let imageUrl = `https://ipfs.io/ipfs/${IpfsHash}`
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
    console.log(`-------------Meta uploaded-----------`)
    return result?.IpfsHash
  } catch (e) {
    console.log(`----------failed to upload metadata-------`)
    throw e
  }
}
