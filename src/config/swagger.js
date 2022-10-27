const Package = require('../../package.json')
require('dotenv').config()

exports.options = {
  routePrefix: '/docs',
  exposeRoute: true,
  swagger: {
    info: {
      title: Package.name,
      description: `${Package.description} </br>`,
      version: Package.version
    },
    host:
      process.env.SWAGGER_DOMAIN ||
      `${process.env.HOST || process.env.SWAGGER_IP}:${process.env.PORT}`,
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
}
