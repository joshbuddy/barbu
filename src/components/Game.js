import React, { Component } from 'react';
import { connect } from 'react-redux';
import { sendMove, updateGame } from '../actions';

function mapStateToProps(state) { return state.showGame }
function mapDispatchToProps(dispatch) {
  return {
    sendMove: (option) => {dispatch(sendMove(option))},
    updateGame: (id, state) => {dispatch(updateGame(id, state))}
  }
}

class Game extends Component {

  componentWillMount() {
    this.eventSource = new EventSource('/games/'+this.props.id);
    this.eventSource.onmessage = (message) => {
      var parsedMessage = JSON.parse(message.data);
      switch(parsedMessage.type) {
        case 'update':
        console.error('parsedMessage.body', parsedMessage.body)
          this.props.updateGame(this.props.id, parsedMessage.body);
          break;
        default:
          console.error('OH NO', parsedMessage);
      }
    }

    this.eventSource.onerror = function(err) {
      console.error('error!', err);
    }
  }

  componentWillUnmount() {
    this.eventSource.close();
  }

  render() {
    return <div>
      <h2>Game</h2>
      {this.renderBody()}
    </div>
  }


  renderBody() {
    if (this.props.loading) {
      return <div>Loading!</div>;
    } else {
      return <div>{JSON.stringify(this.props.state)}</div>
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Game);
