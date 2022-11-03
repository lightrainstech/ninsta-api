'use strict'
require('dotenv').config()

const fs = require('fs')
const util = require('util')
const path = require('path')
const { pipeline } = require('stream')
const pump = util.promisify(pipeline)
const axios = require('axios')

const { NFTStorage, File } = require('nft.storage')
const mime = require('mime')

const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY
const nftstorage = new NFTStorage({ token: NFT_STORAGE_KEY })

const Asset = require('../models/assetModel.js')
const assetPayload = require('../payload/assetPayload.js')

const ninstaContract = require('../utils/contract.js')

const assetModal = new Asset()

async function fileFromPath(filePath) {
  // let fixedPath = path.join(__dirname, '../', '../', filePath)
  const content = await fs.promises.readFile(filePath)
  const type = mime.getType(filePath)
  return new File([content], path.basename(filePath), { type })
}

module.exports = async function (fastify, opts) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.error(err)
    }
  })

  fastify.post(
    '/',
    { schema: assetPayload.assetSchema },
    async (request, reply) => {
      const {
        title,
        description,
        royalty,
        royaltyPer,
        assetUri,
        media,
        mediaType,
        wallet,
        handle
      } = request.body
      let { userId } = request.user
      try {
        let mintResult = await ninstaContract.mintNFT(wallet, assetUri, handle)
        let newAsset = await Asset.create({
          user: userId,
          title,
          description,
          royalty,
          media,
          mediaType,
          royaltyPer,
          assetUri,
          tokenId: parseInt(mintResult.tokenId),
          isMinted: true
        })
        reply.success({
          message: 'Asset added, waiting to be minted!',
          asset: newAsset
        })
      } catch (error) {
        console.log(error)
        reply.error({ message: 'Unable to add asset, please retry!' })
      }
    }
  ),
    fastify.post(
      '/upload',
      //{ schema: assetPayload.uploadSchema },
      async (req, reply) => {
        try {
          const { file, title, description } = req.body
          const fileName = `${Number(new Date())}-${file.filename}`
          await pump(file.file, fs.createWriteStream(`./public/${fileName}`))

          if (file.file.truncated) {
            fs.rmSync(`./public/${fileName}`)
            reply.error({
              message: 'Unable to upload file, please retry!'
            })
          } else {
            const image = await fileFromPath(`./public/${fileName}`)
            let ipnft = await nftstorage.store({
                name: title.value,
                description: description.value,
                image: new File(
                  [await fs.promises.readFile(`./public/${fileName}`)],
                  fileName,
                  { type: file.mimetype }
                )
              }),
              url = ipnft.url.split('//'),
              response = await axios({
                method: 'get',
                url: `https://ipfs.io/ipfs/${url[1]}`
              })
            reply.success({
              fileName,
              filePath: fileName,
              mimeType: file.mimetype,
              ipnft,
              assetUri: `https://ipfs.io/ipfs/${url[1]}`,
              image: response.data.image
            })
          }
        } catch (error) {
          console.log(error)
          reply.error({
            message: 'Unable to upload file, please retry!',
            error
          })
        }
      }
    )
}

module.exports.autoPrefix = '/assets'
