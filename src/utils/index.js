'use strict'
require('dotenv').config()

const fs = require('fs')
const pinataSDK = require('@pinata/sdk')

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET
)

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
    let { IpfsHash } = await pinata.pinJSONToIPFS(data, options)
    console.log(`-------------Meta uploaded-----------`)
    return `https://ipfs.io/ipfs/${IpfsHash}`
  } catch (e) {
    console.log(`----------failed to upload metadata-------`)
    throw e
  }
}

module.exports = {
  uploadImage,
  uploadJson
}
