module.exports = Hand;

function Hand(cardsInHand) {
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

