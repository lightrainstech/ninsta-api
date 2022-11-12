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
        const {
          file,
          title,
          description,
          wallet,
          handle,
          royalty,
          royaltyPer
        } = req.body
        const { userId } = req.user
        let limit = await ninstaContract.getLimit(wallet.value)
        console.log(limit)
        if (limit <= 3) {
          const fileName = `${Number(new Date())}-${file.filename}`
          await pump(file.file, fs.createWriteStream(`./public/${fileName}`))

          if (file.file.truncated) {
            fs.rmSync(`./public/${fileName}`)
            reply.error({
              message: 'Unable to upload file, please retry!'
            })
          } else {
            let jobData = {
                name: title.value,
                description: description.value,
                fileName: fileName,
                fileType: file.mimetype,
                royalty: royalty.value || '',
                royaltyPer: royaltyPer.value || 0,
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
            reply.success({
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
          reply.error({
            message: 'You reached maximum limit for minting free NFTs'
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
