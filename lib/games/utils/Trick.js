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
