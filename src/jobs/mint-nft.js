'use strict'
require('dotenv').config()

const fs = require('fs')
const axios = require('axios')
const mongoose = require('mongoose')
const Asset = mongoose.model('Asset')
const { NFTStorage, File } = require('nft.storage')

const ninstaContract = require('../utils/contract.js')

const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY
const nftstorage = new NFTStorage({ token: NFT_STORAGE_KEY })

module.exports = async function (agenda) {
  agenda.define('mint:nft', async (job, done) => {
    try {
      const {
        name,
        description,
        filePath,
        fileName,
        fileType,
        royalty,
        royaltyPer,
        wallet,
        handle,
        userId
      } = job.attrs.data

      let tokenId, assetUri, media

      if (job.attrs.data?.mintedData) {
        tokenId = job.attrs.data.mintedData?.tokenId
        assetUri = job.attrs.data.mintedData?.assetUri
        media = job.attrs.data.mintedData?.media
      } else {
        if (!job.attrs.data?.isUploaded) {
          console.log('----Uploading------')
          let ipnft = await nftstorage.store({
              name,
              description,
              image: new File(
                [await fs.promises.readFile(`./public/${fileName}`)],
                fileName,
                { type: fileType }
              )
            }),
            url = ipnft.url.split('//')

          assetUri = `https://ipfs.io/ipfs/${url[1]}`

          let response = await axios({
              method: 'get',
              url: assetUri
            }),
            imageUrl = response?.data?.image?.split('//')
          job.attrs.data.isUploaded = true
          media = `https://ipfs.io/ipfs/${imageUrl[1]}`
          job.attrs.data = {
            ...job.attrs.data,
            media: media,
            assetUri: assetUri
          }
        }
        let mintResult = await ninstaContract.mintNFT(wallet, assetUri, handle)
        tokenId = parseInt(mintResult.tokenId)
        job.attrs.data.mintedData = {
          ...job.attrs.data,
          tokenId: tokenId
        }
      }

      let newAsset = await Asset.create({
        user: userId,
        title: name,
        description,
        royalty,
        media: job.attrs.data?.media,
        mediaType: fileType,
        royaltyPer,
        assetUri: job.attrs.data?.assetUri,
        tokenId: job.attrs.data?.mintedData?.tokenId,
        isMinted: true
      })
      console.log(
        `----------Minting Completed--------NINSTA-NFT-${parseInt(
          mintResult.tokenId
        )}`
      )
      job.remove()
      fs.unlinkSync(`./public/${fileName}`)

      done()
    } catch (e) {
      console.log('error', e)
      done()
    }
  })
}
