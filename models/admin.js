require('./deployment')
require('./volunteer')
const bookshelf = require('../bookshelf')

const _ = require('lodash')

const Admin = bookshelf.Model.extend({
  tableName: 'admins',
  idAttribute: 'fbid',
  deployments: function() {
    return this.belongsToMany('Deployment')
  },
})

module.exports = bookshelf.model('Admin', Admin)