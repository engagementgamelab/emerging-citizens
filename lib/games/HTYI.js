 'use strict';

/**
 * Emerging Citizens
 * Developed by Engagement Lab, 2016
 * ==============
 * Hashtag You're It game controller
 *
 * @class lib/games
 * @static
 * @author Johnny Richardson
 * @author Erica Salling
 *
 * ==========
 */
var coreModule = require('learning-games-core'),
    Core = coreModule.Core,
    shuffle = coreModule.ShuffleUtil,
    Sentencer = require('sentencer');

class HashtagLib extends Core {

    constructor() {

        super();

        let randomstring = require('randomstring');

        this._current_tweet,
        this.randomizedHashtags,
        this._real_hashtag,
        
        // ID to indentify "real" hashtag
        this.realId = randomstring.generate(),
        this.currentPlayerIndex = 0,

        this.allHashtags = {},
        this._all_tweets;

    }

    Initialize(gameSession, callback) {
        
        // Invoke common method
        super.Initialize(gameSession, require('keystone'), require('app-root-path'), () => {
            
            var Tweet = this.keystone.list('Tweet').model;

            // Populate content buckets for this session
            Tweet.find({'category': { $in: gameSession.contentCategories}}, (err, result) => {

                // Randomize tweets
                var tweets = shuffle(result);
                
                // Save tweet IDs to the model's 'tweets' key and then cache all tweet data for this session
                this._game_session.tweets = tweets;
                this._all_tweets = tweets;
                
            }).populate("category");
        });
    
    }

    AdvanceRound(socket) {

        // Store and reset hashtags
        this.allHashtags[this._current_round] = this._current_submissions;

        this._current_submissions = {};

        this._players_submitted = [];

        // Attach submissions to game session in order to save progress to DB
        this._game_session.submissions = this.allHashtags;

        // Invoke common method
        super.AdvanceRound(socket);

        if(this._current_round === this._config.roundNumber)
        {
            this.End(socket);
            return;
        }

        // Show next tweet
        this.DisplayTweet(this._current_round, socket);

    }

    CalcPlayerScore(currentPlayer, real) {

        var points = (real === true) ? this._config.voteScoreReal : this._config.voteScoreGuess;

        return super.CalcPlayerScore(currentPlayer, points);        

    }

    StartVoting(socket) {

        // Submit random hashtags for players who did not submit!
        _.each(this._current_players, (player, ind) => {

            // Is player not in array of those who submitted?
            if (!_.contains(this._players_submitted, player)) {
                
                var randomHashtag = Sentencer.make('{{noun}}');
                player.submitted = true;
                
                this._current_submissions[randomHashtag] = {};
                this._current_submissions[randomHashtag].submitters = [ player ];

                // console.log(this._current_submissions, "there is a random hashtag at", this._current_submissions[randomHashtag]);
                socket.to(player.socket_id).emit('hashtag:success', randomHashtag);
            }  
        
        });

        // Add real hashtag
        var realHashtag = this._real_hashtag.replace('#', '');
        this._current_submissions[realHashtag] = {};
        this._current_submissions[realHashtag].submitters = [{ socket_id: this.realId, real: true }];

        // Randomize the hashtag order and make sure all displayed ones for group view are unique
        this.randomizedHashtags = _.shuffle(Object.keys(this._current_submissions));

        var data = {
                        hashtags: this.randomizedHashtags, 
                        tweet: this._current_tweet
                   };

        data.players = { 
                            left: _.first(_.values(this._current_players), this._current_player_cap/2), 
                            right: _.rest(_.values(this._current_players), this._current_player_cap/2) 
                       };
        
        this.Templates.Load('partials/player/htyi/voting', this.randomizedHashtags, (html) => {
            
            socket.to(this.players_id).emit('hashtags:received', html);
            this.SaveState('hashtags:received', html);
        
        });

        this.Templates.Load('partials/group/htyi/voting', data, (html) => {

            socket.to(this.group_id).emit('hashtags:received', html);

            // Begin voting countdown and assign countdown end event
            this.Countdown(socket, {timeLimit: this._config.votingTimeLimit, countdownName: 'votingCountdown'});
            this.eventEmitter.on('countdownEnded', (hashtagData, socket) => {
                this.ShowSubmissions(socket);
            });

        });

        // Reset vote count
        this._votes = 0;

    }

    ShowSubmissions(socket) {

        // Stop countdown
        this.StopCountdown();

        _.each(this._current_submissions, function(hashtag, index) {
            hashtag['votes'] = _.uniq(hashtag['votes'], 'user');
        });

        _.each(this._current_players, function(player) {
            if (!player.score_total) 
                player.score_total = 0;
        });
        
        let lastRound = (this._current_round === this._config.roundNumber - 1);
        let sortedPlayers = _.sortBy(this._current_players, function(player) {return player.score_total}).reverse();
        
        let data = {    
                        hashtags: this._current_submissions,
                        tweet: this._current_tweet,
                        round: this._current_round,
                        players: sortedPlayers,
                        last_round: lastRound,
                        survey: this._config.survey
                   };

        let playerData = {
                            last_round: lastRound, 
                            survey: this._config.survey, 
                            surveyUrl: this._config.surveyUrl
                        };
        
        // GROUP view
        this.Templates.Load('partials/group/htyi/results', data, (html) => {

            socket.to(this.group_id).emit('hashtags:results', html);

        });

        // PLAYER view
        this.Templates.Load('partials/player/htyi/results', playerData, (html) => {
            
            socket.to(this.players_id).emit('game:round_over', {html:html, data:playerData} );
            this.SaveState('game:round_over', html);

        });

    }
    
    StartGame(socket) {

        this._game_in_session = true;

        // First round
        this._current_round = 0;

        this.DisplayTweet(this._current_round, socket);

    };
 
    DisplayTweet(tweetIndex, socket) {

        var data = this._all_tweets[tweetIndex];
        var playerCount = Object.keys(this._current_players).length;

        if(data === undefined)
        {
            // No tweets left, end game
            console.warn('Tweet data for round is undefined! Ending game.');
            this.End(socket, true);
            return;
        }

        // Cache the real hashtag and tweet
        this._real_hashtag = data.hashtag.toLowerCase().replace('#', '');
        this._current_tweet = data.tweetText;

        data.players = { 
                         left: _.first(_.values(this._current_players), this._current_player_cap/2), 
                         right: _.rest(_.values(this._current_players), this._current_player_cap/2) 
                       };

        this.Templates.Load('partials/player/htyi/tweet', data, (html) => {

            socket.to(this.players_id).emit('game:start', html);
            this.SaveState('game:start', html);
        
        });

        this.Templates.Load('partials/group/htyi/tweet', data, (html) => {
            
            socket.to(this.group_id).emit('game:start', {html: html});
        
            // Begin first countdown and assign end event
            this.Countdown(socket, data);
            this.eventEmitter.on('countdownEnded', (hashtagData, socket) => {
                this.StartVoting(socket);
            });  

        });

    }
    
    HashtagSubmitted(playerSocketId, submission, socket, space) {

        // If player has not submitted anything, ask them to try again
        if(!submission || submission.length === 0) {
            socket.emit('hashtag:tryagain', 'You need to submit a hashtag!');
            return;
        }

        // All hashtags should be lower case and not include #
        let thisHashtag = submission.toLowerCase().replace('#', '');
        let thisPlayer = this.GetPlayerById(playerSocketId);

        if(thisPlayer === undefined)
            throw new Error("Player with socket_id '" + playerSocketId + "' NOT found!");
        
        // If player has submitted the real hashtag, ask them to try again
        let realMatch = new RegExp("\\b" + this._real_hashtag + "\\b").test(thisHashtag);
        if(realMatch) {
            socket.emit('hashtag:tryagain', 'You guessed the actual hashtag! Please try again.');
            return;
        }
        // If duplicate hashtag, add to that hashtag array in _current_submissions.submitters object
        if (_.has(this._current_submissions, thisHashtag))
            this._current_submissions[thisHashtag].submitters.push( thisPlayer );
        
        else {
            this._current_submissions[thisHashtag] = {};
            this._current_submissions[thisHashtag].submitters = [thisPlayer];
        }
        
        thisPlayer.submitted = true;

        socket.to(this.group_id).emit('hashtag:success', {id: thisPlayer.uid});
        socket.emit('hashtag:success', thisHashtag);

        this._players_submitted.push( thisPlayer );

        // All hashtags received; voting begins
        if(this._players_submitted.length === this._current_player_cap)
            this.StartVoting(space);

    }
    
    HashtagVote(playerId, hashtag, socket) {

        let thisSubmission = this._current_submissions[hashtag];
        let thisPlayer = this.GetPlayerById(playerId);
        let voteScore = 0;

        for (var submitter of thisSubmission.submitters) {

            // Calculate score for voter if real hashtag, or for submitter if theirs was guessed
            if(submitter.real) 
                voteScore = this.CalcPlayerScore(thisPlayer, true); 
            else
                voteScore = this.CalcPlayerScore(this.GetPlayerById(submitter.socket_id), false);

            thisPlayer.voted = true;

            // Save vote for hashtag
            if(thisSubmission.votes === undefined) {

                thisSubmission.votes = [ { 
                                            user: thisPlayer,
                                            score: voteScore
                                       } ];

            }
            else {

                thisSubmission.votes.push( { 
                                            user: thisPlayer,
                                            score: voteScore
                                          } );

            }
        }

        // socket.to(this.group_id).emit('hashtag:voted', _.pluck(_.where(this._current_players, {voted:true}), 'uid'));

        this._votes++;

        // console.log(thisPlayer.username + ' voted for "' + hashtag);

        // All votes are in, show results
        if(this._votes >= this._current_player_cap)
            this.ShowSubmissions(socket);

    }

};

module.exports = HashtagLib;