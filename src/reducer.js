const reducer = function(state, action) {
  var type = action.type;
  var newState = {...state}
  var substate = {...action};
  delete substate.type;

  switch(type) {
    case 'chat':
      newState.chat.messages = state.chat.messages.slice().concat([substate]);
      break;
    default:
      newState[action.type] = substate;
  }

  return newState;
}

const initialState = {
  initial: {
    loaded: false
  },
  games: {
    list: []
  },
  chat: {
    messages: []
  }
}

export { reducer, initialState }
