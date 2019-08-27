var express = require('express');
var config = require('nconf');
var routes = require('require-dir')();

module.exports = function(app, db) {
  'use strict';
  
  // Initialize all routes
  Object.keys(routes).forEach(function(routeName) {
    var router = express.Router();

    require('./' + routeName)(router, db);
    
    app.use('/api/v' + config.get('API_VERSION') + "/" + routeName, router);
  }); 
};

