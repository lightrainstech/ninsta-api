'use strict'
require('dotenv').config()

const fs = require('fs')
const util = require('util')
const path = require('path')
const { pipeline } = require('stream')
const pump = util.promisify(pipeline)

const { NFTStorage, File } = require('nft.storage')
const mime = require('mime')

const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY
const nftstorage = new NFTStorage({ token: NFT_STORAGE_KEY })

const Asset = require('../models/assetModel.js')
const assetPayload = require('../payload/assetPayload.js')

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
      const { title, description, royalty, royaltyPer, media, mediaType } =
        request.body
      let { userId } = request.user
      try {
        let newAsset = await Asset.create({
          user: userId,
          title,
          description,
          royalty,
          media,
          mediaType,
          royaltyPer
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
      { schema: assetPayload.uploadSchema },
      async (req, reply) => {
        console.log(req.body)
        try {
          const data = await req.file()

          const fileName = `${Number(new Date())}-${data.filename}`
          await pump(data.file, fs.createWriteStream(`../public/${fileName}`))

          if (data.file.truncated) {
            fs.rmSync(`../public/${fileName}`)
            reply.error({
              message: 'Unable to upload file, please retry!'
            })
          } else {
            const image = await fileFromPath(`../public/${fileName}`)
            let ipnft = await nftstorage.store({
              image,
              name: 'name 01',
              description: 'desc'
            })
            reply.success({
              fileName,
              filePath: fileName,
              mimeType: data.mimetype,
              ipnft
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
