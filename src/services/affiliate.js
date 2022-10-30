'use strict'

const affiliatePayload = require('../payload/affiliatePayload.js')
const User = require('../models/userModel.js')
const userModal = new User()

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
    { schema: affiliatePayload.affSchema },
    async (request, reply) => {
      const { affEmail } = request.body
      let { email } = request.user
      if (affEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
        reply.error({
          message:
            'Make sure you are using the same email as the one you have signed up on Ninsta'
        })
        return reply
      }
      try {
        const user = await userModal.getUserByEmail(email.trim().toLowerCase())
        reply.success({
          message: 'Valid affiliate user!',
          user: user
        })
      } catch (error) {
        console.log(error)
        reply.error({ message: 'Invalid affiliate user, please try sign up' })
      }
    }
  )
}

module.exports.autoPrefix = '/affiliates'
