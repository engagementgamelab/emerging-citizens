/**
 * Emerging Citizens
 * Developed by Engagement Lab, 2016
 * ==============
 * Game player view controller.
 *
 * Help: http://keystonejs.com/docs/getting-started/#routesviews-firstview
 *
 * @class game
 * @static
 * @author Johnny Richardson
 *
 * ==========
 */
var keystone = require('keystone'),
    appRoot = require('app-root-path'),
    GameSession = keystone.list('GameSession'),
    Session = require(appRoot + '/lib/SessionManager');

exports = module.exports = function(req, res) {

    var data = (req.method == 'POST') ? req.body : req.query;

    var locals = res.locals;
    var template;
    var accessCode = data.code.toUpperCase().replace(/ /g,'');

    locals.game_not_found = false;

    // locals.section is used to set the currently selected
    // item in the header navigation.
    locals.section = 'player';

    if(Session.Get(accessCode) !== undefined) {
        if(Session.Get(accessCode).IsFull()) {
           res.send({error_code: 'session_full', msg: 'Sorry! This game is full!'});
           return;
        }
        else if(data.name === undefined || data.name.length === 0) {
           res.send({error_code: 'no_username', msg: 'You need to enter a username!'});
           return;
        }
        else if(!Session.Get(accessCode).UsernameAvailable(data.name)) {
           res.send({error_code: 'username_taken', msg: 'Sorry! This username is taken!'});
           return;
        }
        else if(Session.Get(accessCode).GameInSession()) {
           res.send({error_code: 'game_active', msg: 'Sorry! This game has already started!'});
           return;
        }
    }

    GameSession.model.findOne({ accessCode: accessCode }, function (err, game) {

        if(game === null || game === undefined || Session.Get(accessCode) === undefined) {
            locals.game_not_found = true;
            res.send({error_code: 'wrong_code', msg: 'Game for room code "' + accessCode + '" not found.'});

            return;
        }
        else
            locals.game = game;
            
        res.send({code: game.accessCode});

    });

};
