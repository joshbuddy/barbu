import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addChat, sendChat } from '../actions';

function mapStateToProps(state) { return {messages: state.chat.messages}; }
function mapDispatchToProps(dispatch) {
  return {
    addChat: (from, message) => {dispatch(addChat(from, message))},
    sendChat: (message) => { dispatch(sendChat(message))},
  }
}

class Chat extends Component {

  componentWillMount() {
    this.eventSource = new EventSource('/chat');
    this.eventSource.onmessage = (message) => {
      var parsedMessage = JSON.parse(message.data);
      this.props.addChat(parsedMessage.from.name, parsedMessage.message);
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
      <h2>Chat</h2>
      {this.props.messages.map(message => <div><span>{message.from}</span> {message.message}</div>)}
      <input ref="message" onKeyUp={(e) => this._sendMessage(e)}/>
    </div>
  }

  _sendMessage(e) {
    if (e.keyCode !== 13) return;

    this.props.sendChat(this.refs.message.value);
    this.refs.message.value = '';
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
