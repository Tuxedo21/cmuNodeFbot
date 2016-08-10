const request = require('request')

const bookshelf = require('../bookshelf')
require('./deployment')
require('./volunteer')
require('./base-model')

const Task = bookshelf.model('BaseModel').extend({
  tableName: 'tasks',
  deployment: function() {
    return this.belongsTo('Deployment')
  },
  assignedVolunteer: function() {
    return this.belongsTo('Volunteer', 'volunteer_fbid')
  },
  dependencies: function() {
    return this.belongsToMany('Task', 'dependencies', 'parent', 'child')
  },
  start: function() {
      return this.save({startTime: new Date()})
  },
  finish: function() {
      return this.save({completed: true, doneTime: new Date()}, {patch: true})
      .then(() => {
        const webhook = this.get('completedWebhook')
        if (webhook) {
          request.post({url: webhook, data: this.serialize({shallow: true})})
        }
      })
  },
  virtuals: {
    hasOutstandingDependancies: function() {
    return this.related('dependencies').filter((t) => !t.completed).length
    },
    estimatedTimeMin: function() {
      const int = _.defaults(this.get('estimatedTime'), {hours: 0, minutes: 0, seconds: 0})
      return int.hours * 60 + int.minutes + int.seconds / 60
    },
    estimatedTimeSec: function() {
      return this.estimatedTimeMin * 60
    }
  }
})

module.exports = bookshelf.model('Task', Task)

// task types:
// positioning beacons
// positioning checking
// fingerprint checking
// fingerprinting

// later moment:
// sweeping
// battery replacement