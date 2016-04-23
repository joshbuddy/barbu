import React, { Component } from 'react';
import { connect } from 'react-redux';
import { listGames, createGame, showGame } from '../actions';
import Chat from './Chat';

function mapStateToProps(state) { return state.games }
function mapDispatchToProps(dispatch) {
  return {
    listGames: () => { dispatch(listGames())},
    createGame: (names) => {
      dispatch(createGame(names))
    },
    showGame: (id) => {dispatch(showGame(id))}
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
    } else if (this.props.error) {
      return <div>Error {this.props.error}</div>;
    } else {
      return <ul>{this.props.list.map((game) => {return <li key={game.id} onClick={() => this.showGame(game.id)}>{game.id}</li>})}</ul>
    }
  }

  showGame(id) {
    this.props.showGame(id);
  }

  submitCreateGame(e) {
    e.preventDefault();
    const south = this.refs.south.value;
    const west = this.refs.west.value;
    const north = this.refs.north.value;
    const east = this.refs.east.value;
    this.props.createGame([south, west, north, east]);
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GameList);
