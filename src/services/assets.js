'use strict'
require('dotenv').config()

const fs = require('fs')
const util = require('util')
const path = require('path')
const { pipeline } = require('stream')
const pump = util.promisify(pipeline)
const axios = require('axios')

const mime = require('mime')

const Asset = require('../models/assetModel.js')
const assetPayload = require('../payload/assetPayload.js')

const ninstaContract = require('../utils/contract.js')

const assetModal = new Asset()
const { uploadImage, uploadJson } = require('../utils')
const assetModel = require('../models/assetModel.js')

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
    //{ schema: assetPayload.assetSchema },
    async (req, reply) => {
      try {
        const { title, description, wallet, handle, royalty, royaltyPer } =
          req.body
        let file = await req.body.file
        const { userId } = req.user
        let { limit, isMature } = await ninstaContract.getLimit(wallet.value),
          royaltyWallet =
            royalty.value || '0x0000000000000000000000000000000000000000'
        royaltyWallet = await ninstaContract.checkSumAddress(royalty.value)
        if ((isMature && limit > 0) || !isMature) {
          const fileName = `${Number(new Date())}-${file.filename}`
          fs.writeFileSync(`./public/${fileName}`, await file.toBuffer())
          if (Number(royaltyPer.value) >= 10000) {
            return reply.error({
              message:
                'Royalty percentage limit exceedes. Must be less than 10000'
            })
          }

          if (file.file.truncated) {
            fs.rmSync(`./public/${fileName}`)
            return reply.error({
              message: 'Unable to upload file, please retry!'
            })
          } else {
            let newAsset = await Asset.create({
              user: userId,
              title: title.value,
              description: description.value,
              royalty: await ninstaContract.checkSumAddress(royalty.value),
              royaltyPer: royaltyPer.value,
              wallet: await ninstaContract.checkSumAddress(wallet.value),
              contractAddress: process.env.NINSTA_CONTRACT_ADDRESS
            })

            let jobData = {
                docId: newAsset._id,
                name: title.value,
                description: description.value,
                fileName: fileName,
                fileType: file.mimetype,
                royalty: royaltyWallet,
                royaltyPer: Number(royaltyPer.value) || 0,
                wallet: wallet.value,
                handle: handle.value,
                userId,
                isMinted: false,
                isMediaUploaded: false,
                isMetaUploaded: false,
                tokenId: null
              },
              job = fastify.agenda.create('mintnft', jobData)
            let scheduletime =
              process.env.MINTING_SCHEDULE_TIME || 'in 2 seconds'
            job.schedule(scheduletime).save()
            return reply.success({
              message: 'Your NFT is minting',
              data: {
                name: title.value,
                description: description.value,
                royalty: royalty.value || '',
                royaltyPer: royaltyPer.value || 0,
                wallet: wallet.value,
                handle: handle.value
              }
            })
          }
        } else {
          return reply.error({
            message: 'You reached maximum limit for minting free NFTs'
          })
        }
      } catch (error) {
        return reply.error({
          message: `Failed to mint: ${error}`
        })
      }
    }
  ),
    fastify.get(
      '/',
      { schema: assetPayload.getAssetSchema },
      async function (req, reply) {
        const { userId } = req.user
        try {
          let assetModel = new Asset(),
            assets = await assetModel.getUserAsset(userId)
          reply.success({
            message: 'Success',
            data: assets
          })
        } catch (error) {
          return reply.error({
            message: `Failed to fetch assets: ${error}`
          })
        }
        return reply
      }
    ),
    fastify.post(
      '/metadata',
      //{ schema: assetPayload.assetSchema },
      async (req, reply) => {
        try {
          const { title, description, wallet, handle, royalty, royaltyPer } =
            req.body
          let file = await req.body.file
          const { userId } = req.user
          let { limit, isMature } = await ninstaContract.getLimit(wallet.value),
            royaltyWallet =
              royalty.value || '0x0000000000000000000000000000000000000000'
          royaltyWallet = await ninstaContract.checkSumAddress(royalty.value)
          if ((isMature && limit > 0) || !isMature) {
            const fileName = `${Number(new Date())}-${file.filename}`
            fs.writeFileSync(`./public/${fileName}`, await file.toBuffer())
            if (Number(royaltyPer.value) >= 10000) {
              return reply.error({
                message:
                  'Royalty percentage limit exceedes. Must be less than 10000'
              })
            }

            if (file.file.truncated) {
              fs.rmSync(`./public/${fileName}`)
              return reply.error({
                message: 'Unable to upload file, please retry!'
              })
            } else {
              let image = await uploadImage(
                  `./public/${fileName}`,
                  title.value
                ),
                data = {
                  name: title.value,
                  description: description.value,
                  image: image
                },
                assetUri = await uploadJson(data)
              let newAsset = await Asset.create({
                user: userId,
                title: title.value,
                description: description.value,
                royalty: await ninstaContract.checkSumAddress(royalty.value),
                royaltyPer: royaltyPer.value,
                wallet: await ninstaContract.checkSumAddress(wallet.value),
                contractAddress: process.env.NINSTA_CONTRACT_ADDRESS,
                media: {
                  path: image,
                  mimeType: file.mimetype
                },
                assetUri
              })

              return reply.success({
                message: 'Your NFT is minting',
                data: newAsset
              })
            }
          } else {
            return reply.error({
              message: 'You reached maximum limit for minting free NFTs'
            })
          }
        } catch (error) {
          return reply.error({
            message: `Failed to mint: ${error}`
          })
        }
      }
    ),
    fastify.put(
      '/',
      { schema: assetPayload.assetUpdateSchema },
      async (req, reply) => {
        try {
          const { docId, tokenId } = req.body,
            { userId } = req.user,
            assetModel = new Asset(),
            update = await assetModel.updateAssetId({
              docId,
              tokenId,
              user: userId
            })
          return reply.success({
            message: 'NFT Id updated',
            data: update
          })
        } catch (error) {
          return reply.error({
            message: `Failed to update NFT Id: ${error}`
          })
        }
      }
    )
}

module.exports.autoPrefix = '/assets'
