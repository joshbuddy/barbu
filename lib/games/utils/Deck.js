module.exports = Deck;

function Deck() {
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
