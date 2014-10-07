var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: false,
  // link: function() {
  //   return this.belongsTo(Link, 'link_id');
  // }
});

module.exports = User;
