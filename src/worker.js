'use strict'
require('dotenv').config()
const Agenda = require('agenda')
const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose')
require('./models/assetModel.js')

const agenda = new Agenda({ lockLimit: 1, defaultLockLimit: 0 })
// When mongoose is connected to MongoDB
mongoose
  .connect(process.env.MONGO_CONN, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => {
    agenda.mongo(mongoose.connection.db, 'agendaJobs')
    const jobTypes = process.env.JOB_TYPES
      ? process.env.JOB_TYPES.split(',')
      : []

    agenda.on('ready', async function () {
      console.log('Agenda is ready')
      agenda._collection.updateMany(
        {
          lockedAt: { $ne: null }
        },
        {
          $unset: {
            lockedAt: undefined,
            lastModifiedBy: undefined,
            lastRunAt: undefined
          },
          $set: {
            nextRunAt: new Date()
          }
        }
      )
      jobTypes.forEach(type => {
        require('./jobs/' + type)(agenda)
        console.log(type)
      })
      if (jobTypes.length) {
        agenda.start()
      }
    })

    // Error reporting and retry logic
    process.on('unhandledRejection', error => {
      console.log(error)
      process.exit()
    })
  })
