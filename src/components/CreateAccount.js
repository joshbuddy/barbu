import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createAccount } from '../actions';

function mapStateToProps(state) { return state.createAccount; }
function mapDispatchToProps(dispatch) {
  return {
    create: (user, password) => { dispatch(createAccount(user, password)) }
  }
}

class CreateAccount extends React.Component {
  render() {
    return <div>
      <h2>Signup</h2>

      {this.props.error ? <div style={{color: 'red'}}>{this.props.error}</div> : ''}

      <form onSubmit={ (e) => { this.submitLogin(e) }}>
        name <input type='text' ref='name' /><br />
        pass <input type='password' ref='password' /><br />
        <input type='submit' />
      </form>
    </div>;
  }

  submitLogin(e) {
    e.preventDefault();
    const name = this.refs.name.value;
    const password = this.refs.password.value;
    this.props.create(name, password);
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateAccount);
