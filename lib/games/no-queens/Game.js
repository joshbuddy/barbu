'use strict';

var SUITS = ["C", "D", "H", "S"];
var RANK = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

var Card = function() {
}

Card.short = function(card) {
  return SUITS[Math.floor(card/13)] + RANK[card % 13];
}

Card.getFromShort = function(card) {
  var card = 0;
  switch(card.charAt(1)) {
    case 'S':
      card = 3 * 13;
    break;
    case 'H':
      card = 2 * 13;
    break;
    case 'D':
      card = 13;
    break;
    case 'C':
    break;
  }
  switch(card.charAt(0)) {
    case "2":
    break;
    case "3":
      card = card + 1;
    break;
    case "4":
      card = card + 2;
    break;
    case "5":
      card = card + 3;
    break;
    case "6":
      card = card + 4;
    break;
    case "7":
      card = card + 5;
    break;
    case "8":
      card = card + 6;
    break;
    case "9":
      card = card + 7;
    break;
    case "T":
      card = card + 8;
    break;
    case "J":
      card = card + 9;
    break;
    case "Q":
      card = card + 10;
    break;
    case "K":
      card = card + 11;
    break;
    case "A":
      card = card + 12;
    break;
  }
  return card;
}

var Deck = function() {
  this.cards = [];
  for (var i = 0; i < 52; i++) {
    this.cards.push(i);
  }
}

Deck.prototype.shuffle = function() {
  for (var i =  this.cards.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = this.cards[i];
    this.cards[i] = this.cards[j];
    this.cards[j] = temp;
  }
}

var Hand = function(cardsInHand) {
  this.sorted = [[], [], [], []];
  for (var i = 0; i < cardsInHand.length; i++) {
    var card = cardsInHand[i];
    this.sorted[Math.floor(card / 13)].push(card);
  }
  for (i=0; i<4; i++) {
    this.sorted[i] = this.sorted[i].sort(function(a,b) {return a<b;});
  }
}

Hand.prototype.playCard = function(card) {
  this.sorted[Math.floor(card / 13)].splice(this.sorted[Math.floor(card / 13)].indexOf(card), 1);
}

Hand.prototype.allCards = function() {
  return this.sorted.reduce(function(a, b) {
  return a.concat(b);
});
}

Hand.prototype.allCardsButHeartsUnlessHeartsOnly = function() {
  var nonHearts = [];
  for (var i=0; i<4; i++) {
    if (i == 2) {
      continue;
    }
    for (var j=0; j<this.sorted[i].length; j++) {
      nonHearts.push(i*13 + j);
    }
  }
  if (nonHearts.length > 0) {
    return nonHearts;
  }

  return this.sorted[2].map(function(a) {return a+26})
}

var Deal = function(deck) {
  this.hands = [];
  if (deck.cards) {
    this.hands[0] = new Hand(deck.cards.slice(0,13));
    this.hands[1] = new Hand(deck.cards.slice(13,26));
    this.hands[2] = new Hand(deck.cards.slice(26,39));
    this.hands[3] = new Hand(deck.cards.slice(39,52));
  } else if (deck.length == 4) {
    this.hands[0] = new Hand(deck[0]);
    this.hands[1] = new Hand(deck[1]);
    this.hands[2] = new Hand(deck[2]);
    this.hands[3] = new Hand(deck[3]);
  } else {
    throw new Exception("bad deal declaration!");
  }
}
var Trick = function(suit) {
  this.suit = suit;
  this.playedCards = {};
  this.played = 0;
}

Trick.prototype.playCard = function(card, player) {
  this.playedCards[player] = card;
  this.played = this.played + 1;
}

Trick.prototype.trickWinner = function() {
  var winner = -1;
  var highestRank = -1;
  for (var i = 0; i < 4; i++) {
    if (Math.floor(this.playedCards[i] / 13) == this.suit) {
      if (this.playedCards[i] % 13 > highestRank) {
        winner = i;
        highestRank = this.playedCards[i] % 13;
      }
    }
  }
  if (winner < 0) {
    console.log("ERROR: Failed to find trick winner. Suit was: "+suit);
  }
  return winner;
}

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
      currentTrick = new Trick(Math.floor(response / 13));
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
        if (currentTrick.playedCards[i] % 13 == 10) {
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
