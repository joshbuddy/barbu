module.exports = Card;

function Card() {
}

Card.SUITS = ['C', 'D', 'H', 'S'];

Card.getRank = function(card) {
  var cardRankChar = card.charAt(1);
  var cardRank;
  if (!isNaN(parseInt(cardRankChar))) {
    cardRank = parseInt(cardRankChar);
  } else {
    switch(cardRankChar) {
      case 'T':
        cardRank = 10;
      break;
      case 'J':
        cardRank = 11;
      break;
      case 'Q':
        cardRank = 12;
      break;
      case 'K':
        cardRank = 13;
      break;
      case 'A':
        cardRank = 14;
      break;
      default:
        throw "Invalid Card";
    }
  }

  return cardRank;
}

Card.compare = function(a, b) {
  return Card.getRank(a) < Card.getRank(b);
}


Card.compareWithSuit = function(a, b, suit) {
  if (a.charAt(0) == b.charAt(0)) {
    return Card.compare(a,b);
  }
  if (a.charAt(0) == suit) {
    return -1;
  }
  if (b.charAt(0) == suit) {
    return 1;
  }
  return 0;
}
