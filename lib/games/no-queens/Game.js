'use strict';

const Card = require('../utils/Card');
const Trick = require('../utils/Trick');
const Deck = require('../utils/Deck');
const Deal = require('../utils/Deal');
const Hand = require('../utils/Hand');

module.exports = class NoQueens {

  static initialState() {
    var deck = new Deck();
    deck.shuffle();
    var deal = new Deal(deck);
    return {deal: [deal.hands[0].allCards(), deal.hands[1].allCards(), deal.hands[2].allCards(), deal.hands[3].allCards()], tricks: [], scores: [0, 0, 0, 0], currentTrick: null, question: {position: 0, values: deal.hands[0].allCards(), type: "lead"}};
  }

  nextQuestion(state) {
    return state.question;
  }

  playerState(state, position) {
    return {hand: state.deal[position], score: state.score[position]};
  }

  answer(state, response) {
    var deal = new Deal(state.deal);
    var player = state.question.position;
    var currentTrick = state.currentTrick;
    if (currentTrick == null) {
      currentTrick = new Trick(response.charAt(0));
    } else {
      currentTrick = new Trick(state.currentTrick.suit);
      currentTrick.playedCards = state.currentTrick.playedCards;
      currentTrick.played = state.currentTrick.playedCount;
    }
    currentTrick.playCard(response, player);
    var playerHand = deal.hands[player];
    playerHand.playCard(response);
    deal.hands[player] = new Hand(playerHand.allCards());
    var scores = state.scores.slice();
    var tricks = state.tricks.slice();
    var question;
    if (currentTrick.played == 4) {

      // score trick
      var queens = 0;
      for (var i=0; i<4; i++) {
        if (Card.getRank(currentTrick.playedCards[i]) == 12) {
          queens = queens + 1;
        }
      }
      var trickWinner = currentTrick.trickWinner();
      scores[trickWinner] = scores[trickWinner] - (8 * queens);
      tricks.push({suit: currentTrick.suit, playedCards: currentTrick.playedCards, leadPosition: (state.question.position + 1) % 4});
      currentTrick = null;
      // check if all 4 queens have been played
      if (scores.reduce(function(a,b) {return a+b}) > -32) {
        question = {position: trickWinner, values: deal.hands[trickWinner].allCards(), type: "lead"};
      } else {
        // game over!
        question = null;
      }
    } else {
      var validPlays = deal.hands[(player + 1) % 4].sorted[currentTrick.suit];
      // check if they can follow suit
      if (validPlays.length == 0) {
        validPlays = deal.hands[(player + 1) % 4].allCards();
      }
      question = {position: (player + 1) % 4, values: validPlays, type: "follow"};
    }
    if (currentTrick != null) {
      currentTrick = {suit: currentTrick.suit, playedCards: currentTrick.playedCards, playedCount: currentTrick.played};
    }
    return {deal: [deal.hands[0].allCards(), deal.hands[1].allCards(), deal.hands[2].allCards(), deal.hands[3].allCards()], tricks: tricks, scores: scores, currentTrick: currentTrick, question: question};
  }
}
