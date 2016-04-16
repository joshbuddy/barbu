import React, { Component } from 'react';
import { connect } from 'react-redux';
import { listGames, createGame } from '../actions';
import Chat from './Chat';

function mapStateToProps(state) { return state.games }
function mapDispatchToProps(dispatch) {
  return {
    listGames: () => { dispatch(listGames())},
    createGame: (names) => {
      dispatch(createGame(names))
    }

  }
}

class GameList extends Component {
  constructor(props) {
    super(props);
    this.state = props;
  }

  componentWillMount() {
    this.props.listGames();
  }

  render() {
    return <div>
      {this.renderBody()}

      <Chat />

      <h2>Create game</h2>
      <form onSubmit={(e) => { this.submitCreateGame(e) }}>
        S <input type="text" ref="south"/><br/>
        W <input type="text" ref="west"/><br/>
        N <input type="text" ref="north"/><br/>
        E <input type="text" ref="east"/><br/>
        <input type="submit"/>
      </form>
    </div>
  }

  renderBody() {
    if (this.props.loading) {
      return <div>loading games...</div>;
    } else {
      return <ul>{this.props.list.map((game) => {return <li onClick={this.showGame(game.id)}>{game.id}</li>})}</ul>
    }
  }

  submitCreateGame() {

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GameList);
