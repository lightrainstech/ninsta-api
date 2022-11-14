'use strict'

const User = require('../models/userModel.js')
const Affiliate = require('../models/affiliateModel.js')
const userPayload = require('../payload/userPayload.js')

const userModal = new User()

module.exports = async function (fastify, opts) {
  fastify.post('/signup', { schema: userPayload.otpSchema }, async function (
    request,
    reply
  ) {
    const otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000
    const { name, email, affCode } = request.body
    let user = await userModal.getUserByEmail(email.trim().toLowerCase())
    try {
      if (user === null) {
        user = await User.create({
          name,
          email: email.toLowerCase().trim(),
          otp
        })
        const accessToken = fastify.jwt.sign(
          {
            userId: user._id,
            isVerified: user.isVerified,
            email: user.email,
            affiliateCode: user.affiliateCode
          },
          { expiresIn: '7d' }
        )

        reply.success({
          message: 'Sign up successful, please verify your phone number.',
          otp: otp,
          accessToken,
          affiliateCode: user.affiliateCode
        })
      } else {
        const accessToken = fastify.jwt.sign(
          {
            userId: user._id,
            isVerified: user.isVerified,
            email: user.email,
            affiliateCode: user.affiliateCode
          },
          { expiresIn: '7d' }
        )
        reply.success({
          message: 'Sign up successful, please verify your phone number.',
          accessToken,
          affiliateCode: user.affiliateCode,
          email: user.email
        })
      }

      if (affCode) {
        Affiliate.create({
          user: user._id,
          affiliateCode: affCode
        })
      }
    } catch (error) {
      console.log(error)
      reply.error({ message: 'Unable to create, please retry!' })
    }
  }),
    fastify.post(
      '/otpresend',
      { schema: userPayload.otpResendSchema },
      async function (request, reply) {
        const otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000
        const { phone, country } = request.body
        let user = await userModal.resetOtp(otp, phone, country)
        if (user === null) {
          reply.error({ message: 'No such user exists, please sign up.' })
        } else {
          reply.success({
            message: 'New OTP has been sent successfully',
            otp: otp
          })
        }
      }
    )
  fastify.post(
    '/otpverify',
    { schema: userPayload.otpVerifySchema },
    async function (request, reply) {
      const { phone, country, otp } = request.body
      let user = await userModal.verifyOtp(otp, phone, country)
      if (user === null) {
        reply.error({ message: 'OTP is invalid or already verified' })
      } else {
        const accessToken = fastify.jwt.sign(
          { userId: user._id, isVerified: user.isVerified },
          { expiresIn: '7d' }
        )
        reply.success({
          message: 'OTP has been verified successfully',
          accessToken: accessToken
        })
      }
    }
  )
  fastify.get(
    '/me',
    { schema: userPayload.getMeSchema, onRequest: [fastify.authenticate] },
    async function (request, reply) {
      reply.success({
        message: 'Success'
      })
    }
  )
}

module.exports.autoPrefix = '/user'
