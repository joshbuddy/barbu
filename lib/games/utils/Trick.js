const Card = require('./Card');

module.exports = Trick;

function Trick(suit) {
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
    if (this.playedCards[i].charAt(0) == this.suit) {
      var cardRank = Card.getRank(this.playedCards[i]);
      if (cardRank > highestRank) {
        winner = i;
        highestRank = cardRank;
      }
    }
  }
  if (winner < 0) {
    console.log("ERROR: Failed to find trick winner. Suit was: "+ this.suit);
  }
  return winner;
}
