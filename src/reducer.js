const reducer = function(state, action) {
  var newState = {...state};
  var substate = {...action};
  delete substate.type;
  newState[action.type] = substate;

  return newState;
}

const initialState = {
  initial: {
    loaded: false
  }
}

export { reducer, initialState }