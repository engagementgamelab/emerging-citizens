/**
 * Emerging Citizens
 * 
 * GameSession Model
 * @module models
 * @class GameSession
 * @author Johnny Richardson
 * 
 * ==========
 */
"use strict";

var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * GameSession Model
 * ==========
 */
var GameSession = new keystone.List('GameSession', {
		editable: false,
		cancreate: false,
    track: true
});
/**
 * Model Fields
 * @main GameSession
 */
GameSession.add({

  name: { type: String, required: true, initial: true },
  accessCode: { type: String, required: true, initial: true },
  timeLimit: { type: Number, required: true, initial: true },
  playerCap: { type: Number, required: true, initial: true },
  gameType: { type: String, required: true, initial: true }

});

/**
 * Registration
 */
GameSession.register();
exports = module.exports = GameSession;
