import React, { Component } from 'react';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import ReactDOM from 'react-dom'
import createLogger from 'redux-logger';
import { reducer, initialState } from './reducer';
import Index from './components/Index';
import axios from 'axios';
import { initialize } from './actions';

const logger = createLogger();
const createStoreWithMiddleware = applyMiddleware(thunk, logger)(createStore);
function configureStore(reducer) {
  const store = createStoreWithMiddleware(reducer, initialState);
  return store;
}

const store = configureStore(reducer);

store.dispatch(initialize());

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Index/>
      </Provider>
    );
  }
}




ReactDOM.render(
  <App />,
  document.getElementById('root')
);

