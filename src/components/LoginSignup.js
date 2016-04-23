import React, { Component } from 'react';

import CreateAccount from './CreateAccount';
import LoginAccount from './LoginAccount';

export default class LoginSignup extends React.Component {
  render() {
    return <div>
      <CreateAccount {...this.props.createAccount}/>
      <LoginAccount {...this.props.loginAccount}/>
    </div>;
  }
}
