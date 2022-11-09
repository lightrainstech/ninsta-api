'use strict'
const fp = require('fastify-plugin')
const Agenda = require('agenda')

// Connect to DB
async function agendaConnect(fastify, options) {
  try {
    const mongoConnectionString = process.env.MONGO_CONN
    const agenda = new Agenda({
      db: {
        address: mongoConnectionString,
        options: {
          useUnifiedTopology: true
        }
      }
    })

    if (agenda) {
      agenda.on('start', job => {
        console.log('Job %s starting', job.attrs.name)
      })
      agenda.on('complete', job => {
        console.log(`Job ${job.attrs.name} finished`)
      })

      agenda.on('fail', function (err, job) {
        console.log('-------job failed--------')
        let extraMessage = ''

        if (job.attrs.failCount >= 10) {
          extraMessage = format('too many failures, giving up')
        } else {
          let count = job.attrs.failCount || 1
          let t = new Date()
          t.setSeconds(t.getSeconds() + 10 * count)
          job.attrs.nextRunAt = t

          job.save()
        }

        if (process.env.NODE_ENV !== 'test') {
          console.error(
            'Agenda job [%s] %s failed with [%s] %s failCount:%s',
            job.attrs.name,
            job.attrs._id,
            err.message || 'Unknown error',
            extraMessage,
            job.attrs.failCount
          )
        }
      })

      async function graceful() {
        await agenda.stop()
        process.exit(0)
      }

      process.on('SIGTERM', graceful)
      process.on('SIGINT', graceful)

      fastify.decorate('agenda', agenda)
    } else {
      console.log('Error initializing agenda')
      fastify.decorate('agenda', '')
    }
  } catch (err) {
    console.log(err)
  }
}
module.exports = fp(agendaConnect)
