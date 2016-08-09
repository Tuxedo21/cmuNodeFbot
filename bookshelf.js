var pg = require('pg')
pg.defaults.ssl = false
const config = require('./config')
const knex = require('knex')(config.DB_CONFIG)
const bookshelf = require('bookshelf')(knex)
bookshelf.plugin('registry')
bookshelf.plugin('virtuals')
module.exports = bookshelf
