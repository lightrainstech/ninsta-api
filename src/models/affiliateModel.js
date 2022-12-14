'use strict'
// External Dependencies
const mongoose = require('mongoose')

const AffiliateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    affiliateCode: { type: String, default: '--' },
    isRefererMintProcessed: { type: Boolean, default: false },
    isUserMintProcessed: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)

AffiliateSchema.methods = {
  getUserById: async function (id) {
    const Affiliate = mongoose.model('Affiliate')
    let query = { _id: id }
    const options = {
      criteria: query
    }
    return Affiliate.load(options)
  },
  getDataByuserId: async function (user) {
    const Affiliate = mongoose.model('Affiliate')
    let query = { user: user }
    const options = {
      criteria: query
    }
    return Affiliate.load(options)
  },
  updateUserMintUpgrade: async function (user) {
    const Affiliate = mongoose.model('Affiliate')
    return Affiliate.findOneAndUpdate(
      { user },
      { $set: { isUserMintProcessed: true } },
      { new: true }
    )
  }
}

AffiliateSchema.statics = {
  load: function (options, cb) {
    options.select =
      options.select ||
      'user affiliateCode isUserMintProcessed isRefererMintProcessed'
    return this.findOne(options.criteria).select(options.select).exec(cb)
  },

  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page - 1
    const limit = parseInt(options.limit) || 12
    const select = options.select || 'user affiliateCode createdAt -__v'
    return this.find(criteria)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec()
  }
}

AffiliateSchema.index({ affiliateCode: 1 })

module.exports = mongoose.model('Affiliate', AffiliateSchema)
