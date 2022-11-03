'use strict'
// External Dependencies
const mongoose = require('mongoose')

const AssetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    title: { type: String, default: '--' },
    description: { type: String, default: '--' },
    royalty: { type: String, default: '--' },
    royaltyPer: { type: Number, default: 0 },
    media: {
      path: {
        type: String,
        default: '--'
      },
      mimeType: {
        type: String,
        default: 'image/jpeg'
      }
    },
    isMinted: {
      type: Boolean,
      default: false
    },
    tokenId: {
      type: String,
      unique: true
    },
    assetUri: {
      type: String,
      default: '--'
    }
  },
  {
    timestamps: true
  }
)

AssetSchema.methods = {
  getUserById: async function (id) {
    const User = mongoose.model('User')
    let query = { _id: id }
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
  }
}

AssetSchema.statics = {
  load: function (options, cb) {
    options.select =
      options.select || 'title, description, royalty, royaltyPer media'
    return this.findOne(options.criteria).select(options.select).exec(cb)
  },

  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page - 1
    const limit = parseInt(options.limit) || 12
    const select =
      options.select ||
      'user title, description, royalty, royaltyPer, media, createdAt -__v'
    return this.find(criteria)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec()
  }
}

AssetSchema.index({ user: 1 })

module.exports = mongoose.model('Asset', AssetSchema)
