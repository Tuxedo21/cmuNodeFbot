const _ = require('lodash')
const s = require("underscore.string")

const bookshelf = require('../bookshelf')

const BaseModel = bookshelf.Model.extend({
    // convert snake_case to camelCase
    parse: function(attrs) {
        return _.reduce(attrs, function(memo, val, key) {
            memo[s.camelize(key)] = val
            return memo
        }, {})
    },

    // convert camelCase to snake_case
    format: function(attrs) {
        return _.reduce(attrs, function(memo, val, key) {
            memo[s.underscored(key)] = val
            return memo
        }, {})
    }
})

module.export = bookshelf.model('BaseModel', BaseModel)
