// config/initializers/server.js

var express = require('express');
var path = require('path');
// Local dependecies
var config = require('nconf');

// create the express app
// configure middlewares
var bodyParser = require('body-parser');
var logger = require('winston');
var cors = require('cors');
const { setup } = require('radiks-server');
var app;

var start = async function (cb) {
  'use strict';
  // Configure express 
  app = express();
  app.use(cors());
  app.options('*', cors());

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: '*/*' }));

  logger.info('[SERVER] Initializing routes');

  require('../../app/helpers/authenticationHelper')(app);
  
  var mongoConnection = config.get('MONGO_DB');
  var RadiksController= await setup({ mongoDBUrl: mongoConnection });
  logger.info('[SERVER] Setup Radiks server.');
  app.use('/radiks', RadiksController);

  require('../../app/resources/index')(app, RadiksController.DB);

  app.use(express.static(path.join(__dirname, 'public')));

  logger.info('[SERVER] Routes initialized.');

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: typeof(err) === "string" ? err : err.message,
      error: app.get('env') === 'dev' ? err : {}
    });
    next(err);
  });

  app.listen(process.env.PORT || config.get('NODE_PORT'));
  logger.info('[SERVER] Listening on port ' + (process.env.PORT || config.get('NODE_PORT')));

  if (cb) {
    return cb();
  }
};

module.exports = start;

