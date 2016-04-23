module.exports = Deck;

function Deck() {
  var SUITS = ['S', 'H', 'D', 'C'];
  var RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
  this.cards = [];
  for (var i=0; i<SUITS.length; i++) {
    for (var j=0; j<RANKS.length; j++) {
      this.cards.push(SUITS[i].concat(RANKS[j]));
    }
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
