const Package = require('../../package.json')
require('dotenv').config()

exports.options = {
  routePrefix: '/docs',
  exposeRoute: true,
  swagger: {
    info: {
      title: Package.name,
      description: Package.description,
      version: Package.version
    },
    host:
      process.env.SWAGGER_DOMAIN ||
      `${process.env.HOST || process.env.SWAGGER_IP}:${process.env.PORT}`,
    schemes: ['http', 'https'],
    consumes: ['application/json', 'multipart/form-data'],
    produces: ['application/json'],
    securityDefinitions: {
      Bearer: {
        type: 'apiKey',
        in: 'header',
        scheme: 'bearer',
        name: 'Authorization',
        bearerFormat: 'JWT'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token'
      }
    }
  }
}
