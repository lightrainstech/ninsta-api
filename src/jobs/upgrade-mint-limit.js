'use strict'
require('dotenv').config()

const mongoose = require('mongoose')
const Affiliate = mongoose.model('Affiliate')

const ninstaContract = require('../utils/contract.js')
const EXTRA_MINT = process.env.EXTRA_MINT || 1

module.exports = async function (agenda) {
  agenda.define('upgrade-freemint', async (job, done) => {
    try {
      const { wallet, userId } = job.attrs.data,
        affiliateModel = new Affiliate()
      let result = await ninstaContract.updateFreeMintLimit(
        wallet,
        Number(EXTRA_MINT)
      )
      if (result) {
        await affiliateModel.updateUserMintUpgrade(userId)
      }
      job.remove()
      done()
    } catch (e) {
      job.attrs.nextRunAt = new Date(
        new Date().setMinutes(new Date().getMinutes() + 0.1)
      )
      throw e
      done()
    }
  })
}
