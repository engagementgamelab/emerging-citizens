/**
 * Emerging Citizens
 * 
 * GameConfig Model
 * @module models
 * @class GameConfig
 * @author Johnny Richardson
 * 
 * For field docs: http://keystonejs.com/docs/database/
 *
 * ==========
 */
var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * GameConfig Model
 * ==========
 */

var GameConfig = new keystone.List('GameConfig', {
		label: 'Games Config',
    track: true,
    candelete: false
});

GameConfig.add({

		name: { type: String, required: true, default: "Global Game Config" },
		enabled: { type: Boolean, label: "Game Is Running?", note: "Disabling game will show 'coming soon'/signup page." }

	},

	"Hashtag You're It", {

	  playerCap: { type: Number, label: "Player Cap", required: true, initial: true },
	  timeLimit: { type: Number, label: "Time Limit", required: true, initial: true },
		roundNumber: { type: Number, label: "Number of Rounds", required: true, initial: true },
		voteScoreGuess: { type: Number, label: "Score per Vote for guess", required: true, initial: true },
		voteScoreReal: { type: Number, label: "Score per Vote for real", required: true, initial: true }

	}

);

/**
 * Registration
 */

GameConfig.defaultColumns = 'name';
GameConfig.register();
