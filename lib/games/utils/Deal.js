const Hand = require('./Hand');

module.exports = Deal;
function Deal(deck) {
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
