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
      type: String
    },
    assetUri: {
      type: String,
      default: '--'
    },
    wallet: {
      type: String,
      default: '--'
    }
  },
  {
    timestamps: true
  }
)

AssetSchema.methods = {
  getUserAsset: async function (userId) {
    const Asset = mongoose.model('Asset')
    try {
      return await Asset.find({ user: userId })
    } catch (e) {
      throw e
    }
  },
  updateAsset: async function (args) {
    const Asset = mongoose.model('Asset')
    let { docId, userId, media, assetUri, tokenId } = args
    try {
      return await Asset.findOneAndUpdate(
        { _id: docId, user: userId },
        {
          $set: {
            media: media,
            assetUri: assetUri,
            tokenId: tokenId,
            isMinted: true
          }
        },
        { new: true }
      )
    } catch (e) {
      throw e
    }
  }
}

AssetSchema.statics = {
  load: function (options, cb) {
    options.select =
      options.select || 'title description royalty royaltyPer media'
    return this.findOne(options.criteria).select(options.select).exec(cb)
  },

  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page - 1
    const limit = parseInt(options.limit) || 12
    const select =
      options.select ||
      'user title description royalty royaltyPer media assetUri tokenId wallet createdAt -__v'
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
