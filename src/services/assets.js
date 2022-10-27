'use strict'

const Asset = require('../models/assetModel.js')
const assetPayload = require('../payload/assetPayload.js')

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
    { schema: assetPayload.assetSchema },
    async function (request, reply) {
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
  )
}

module.exports.autoPrefix = '/assets'
