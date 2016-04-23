const Card = require('./Card');

module.exports = Hand;

function Hand(cardsInHand) {
  this.sorted = {'C': [], 'D': [], 'H': [], 'S': []};
  for (var i = 0; i < cardsInHand.length; i++) {
    var card = cardsInHand[i];
    this.sorted[card.charAt(0)].push(card);
  }
  for (var suit of Card.SUITS) {
    this.sorted[suit] = this.sorted[suit].sort(Card.compare);
  }
}

Hand.prototype.playCard = function(card) {
  this.sorted[card.charAt(0)].splice(this.sorted[card.charAt(0)].indexOf(card), 1);
}

Hand.prototype.allCards = function() {
  var cards = [];
  for (var suit of Card.SUITS) {
    cards = cards.concat(this.sorted[suit]);
  }
  return cards;
}

Hand.prototype.allCardsButHeartsUnlessHeartsOnly = function() {
  var nonHearts = [];
  for (var suit of Card.SUITS) {
    if (suit == 'H') {
      continue;
    }
    for (var j=0; j<this.sorted[suit].length; j++) {
      nonHearts.push(this.sorted[suit][j]);
    }
  }
  if (nonHearts.length > 0) {
    return nonHearts;
  }

  return this.sorted['H'];
}

