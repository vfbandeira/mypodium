const { list } = require('../data/messagesData.js');
const { COLLECTION } = require('radiks-server/app/lib/constants');

module.exports = function (router, db) {
    'use strict';

    const radiksData = db.collection(COLLECTION);

    router.route('/')
    .get(function (req, res, next) {
        list(radiksData, req.query).then((messages) => 
        {
            res.status(200).json(messages).end();
        }).catch((err) => next(err));
    });
};