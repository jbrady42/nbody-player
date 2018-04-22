import React from 'react';

import PropTypes from 'prop-types';

function Info({
  pause,
  paused,
  currentTime,
  directionClick,
  forward
}) {
  const sty = {
    position: 'absolute',
    textAlign: 'center',
    top: 0,
    width: '100%',
    padding: 5,
    color: 'white',
    zIndex: 100,
  }

  return <div style={sty}>
    <button onClick={pause}>{paused ? "Resume" : "Pause"}</button>

    <button onClick={directionClick}>{forward ? "Forward" : "Reverse"}</button>

    Simulation time:

    <b style={{color: 'lightgreen',}}>
      {currentTime.toFixed(5)}
    </b>
  </div>
}

Info.prototype.propTypes = {
  pause: PropTypes.func.isRequired,
  frame: PropTypes.func.isRequired,
};

export default Info;
