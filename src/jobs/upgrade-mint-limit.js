'use strict'
require('dotenv').config()

const mongoose = require('mongoose')
const Affiliate = mongoose.model('Affiliate')

const ninstaContract = require('../utils/contract.js')
const EXTRA_MINT = process.env.EXTRA_MINT || 1

module.exports = async function (agenda) {
  agenda.define('upgrade-freemint', async (job, done) => {
    try {
      let isMinted = job.attrs.data?.isMinted || false
      const { wallet, user } = job.attrs.data,
        affiliateModel = new Affiliate()
      if (!isMinted) {
        let result = await ninstaContract.updateFreeMintLimit(
          wallet,
          Number(EXTRA_MINT)
        )
        if (result) {
          job.attrs.data.isMinted = true
          isMinted = true
        }
      }
      if (isMinted) {
        await affiliateModel.updateUserMintUpgrade(user)
      }
      console.log('------done-----')
      job.remove()
      done()
    } catch (e) {
      job.attrs.nextRunAt = new Date(
        new Date().setMinutes(new Date().getMinutes() + 0.1)
      )
      console.log(e)
      done()
    }
  })
}
