import React, { Component } from 'react';
import GameList from './GameList';
import { connect } from 'react-redux';
import LoginSignup from './LoginSignup';

function mapStateToProps(state) { return state; }
function mapDispatchToProps(dispatch) {
  return {
  }
}

class Index extends React.Component {
  render() {
    return <div>
<h1>Barbu</h1>

{this.renderBody()}

</div>;
  }

  renderBody() {
    if (!this.props.initial.loaded) {
      return <div>loading...</div>;
    } else if (this.props.user.loggedIn) {
      return <GameList/>;
    } else {
      return <LoginSignup/>;
    }
  }
}

export default connect(mapStateToProps)(Index);
