'use strict'
// External Dependencies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const { customAlphabet } = require('nanoid')
const nanoidLong = customAlphabet(
  '5eDVbMmnXU9GRaF3H4Cl2vwSzYsqfrLdyOIKWZ78hkJPgTN6xEjcQtABpu',
  8
)

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    name: { type: String, default: '--' },
    affiliateCode: { type: String, default: null },
    otp: {
      type: Number,
      required: true,
      default: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

UserSchema.pre('save', async function (next) {
  this.affiliateCode = nanoidLong()
  next()
})

UserSchema.methods = {
  getUserById: async function (id) {
    const User = mongoose.model('User')
    let query = { _id: id }
    const options = {
      criteria: query
    }
    return User.load(options)
  },
  getUserByEmail: async function (email) {
    const User = mongoose.model('User')
    let query = { email }
    const options = {
      criteria: query
    }
    return User.load(options)
  },
  resetOtp: async function (otp, phone, country) {
    const User = mongoose.model('User')
    return await User.findOneAndUpdate(
      { phone: phone, country: country },
      {
        $set: {
          otp: otp
        }
      },
      { new: true }
    )
  },
  verifyOtp: async function (otp, phone, country) {
    const User = mongoose.model('User')
    return await User.findOneAndUpdate(
      { phone: phone, country: country, otp: otp, isVerified: false },
      {
        $set: {
          otp: 0,
          isVerified: true
        }
      },
      { new: true }
    )
  }
}

UserSchema.statics = {
  load: async function (options, cb) {
    options.select = options.select || 'email name isVerified affiliateCode'
    let u = await this.find(options.criteria)
      .select(options.select)
      .limit(1)
      .exec(cb)
    return u[0] || null
  },

  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page - 1
    const limit = parseInt(options.limit) || 12
    const select = options.select || 'email name createdAt affiliateCode -__v'
    return this.find(criteria)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec()
  }
}

UserSchema.index({ email: 1 })

UserSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', UserSchema)
