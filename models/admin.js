const bookshelf = require('../bookshelf')

require('./deployment')
require('./volunteer')
require('./base-model')
const Admin = bookshelf.model('BaseModel').extend({
  tableName: 'admins',
  idAttribute: 'fbid',
  deployments: function() {
    return this.belongsToMany('Deployment')
  },
})

module.exports = bookshelf.model('Admin', Admin)