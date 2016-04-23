import axios from 'axios';

function initialize() {
  return (dispatch) => {
    axios.get('/games').then((response) => {
      console.log('repsonse', response);
      dispatch({type: 'user', loggedIn: true});
      dispatch({type: 'initial', loaded: true});
    }).catch((response) => {
      if (response.status === 401) {
        dispatch({type: 'user', loggedIn: false});
        dispatch({type: 'initial', loaded: true});
      }
      console.error("uncaught error!", response);
    });
  }
}

function loginAccount(name, password) {
  return (dispatch) => {
    dispatch({type: 'loginAccount', loading: true});
    axios.post('/login', {name: name, password: password}).then((response) => {
      if (response.status !== 200) return console.error('unexpected response', response);
      dispatch({type: 'loginAccount', loading: false});
      dispatch({type: 'user', loggedIn: true});
    }).catch((response) => {
      switch(response.status) {
        case 400:
          return dispatch({type: 'loginAccount', loading: false, error: response.data});
        case 401:
          return dispatch({type: 'loginAccount', loading: false, error: 'unauthorized'});
        default:
          return dispatch({type: 'loginAccount', loading: false, error: `unexpected error ${response.data} (${response.status})`});
      }
    });
  }
}

function createAccount(name, password) {
  return (dispatch) => {
    dispatch({type: 'createAccount', loading: true});
    axios.post('/users', {name: name, password: password}).then((response) => {
      if (response.status !== 201) return console.error('unexpected response', response);
      dispatch({type: 'createAccount', loading: false});
      dispatch({type: 'user', loggedIn: true});
    }).catch((response) => {
      switch(response.status) {
        case 400:
          return dispatch({type: 'createAccount', loading: false, error: response.data});
        case 401:
          return dispatch({type: 'createAccount', loading: false, error: 'unauthorized'});
        default:
          return dispatch({type: 'createAccount', loading: false, error: `unexpected error ${response.data} (${response.status})`});
      }
    });
  }
}

function createGame(names) {
  return (dispatch) => {
    dispatch({type: 'createGame', loading: true})
    axios.post('/games', {users: names, name: 'pick-a-number'}).then((response) => {
      console.log('repsonse', response);
      dispatch({type: 'games', list: response.data.games, loading: false});
    }).catch((response) => {
      dispatch({type: 'games', loading: false, error: String(response.data)});
    });
  }
}

function listGames() {
  return (dispatch) => {
    dispatch({type: 'games', loading: true})
    axios.get('/games').then((response) => {
      console.log('repsonse', response);
      dispatch({type: 'games', list: response.data.games, loading: false});
    }).catch((response) => {
      console.error('error', response)
      dispatch({type: 'games', loading: false, error: String(response.data)});
    });
  }
}

function showGame(id) {
  return {type: 'showGame', id: id, loading: true};
}

function addChat(from, message) {
  return {type: 'chat', message: message, from: from};
}

function sendChat(message) {
  return (dispatch) => {
    axios.post('/chat', {message: message}).then((response) => {
      console.error('response', response)
    }).catch((response) => {
      console.error('response!', response)
    });
  }
}

function updateGame(id, state) {
  return {type:'showGame', id: id, state: state}
}

function sendMove() {

}

export { initialize, loginAccount, createAccount, listGames, createGame,
  addChat, sendChat, showGame, sendMove, updateGame };
