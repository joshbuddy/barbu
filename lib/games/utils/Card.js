var SUITS = ["C", "D", "H", "S"];
var RANK = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

module.exports = Card;

function Card() {
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
