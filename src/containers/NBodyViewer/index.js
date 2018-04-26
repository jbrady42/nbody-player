import React from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import React3 from 'react-three-renderer';

import DisplayBase from '../../DisplayBase';
import Info from '../../components/Info';
import Spheres from '../../components/Spheres';
import {randomCloud, PointCloud}  from '../../components/PointCloud';
import ApiClient from "./../../api"
import OC from 'three-orbit-controls'
const OrbitControls = OC(THREE)

const distanceScale = 500

const maxSnapshots = 200

const cameraStart = new THREE.Vector3(0, 0, 1000)

const debug = false

const initState = {
  paused: true,
  offset: 0,
  dstart: 0,
  dend: 0,
  pageSize: 50,
  snapshots: [],
  particles: [],
  trails: {},
  direction: 1,
  dtValue: 60
}

function posVec(state) {
  const {pos} = state
  return new THREE.Vector3(pos[0], pos[1],pos[2]).multiplyScalar(distanceScale)
}

class NBodyViewer extends DisplayBase {
  constructor(props, context) {
    super(props, context);

    this.prevTime = Date.now()
    this.currentTime = 0.0
    this.setTimeSpeed(initState.dtValue)

    this.state = {
      ... this.state,
      cameraPosition: cameraStart,
      cameraRotation: new THREE.Euler(),
      pointVerticies: randomCloud(),
      ...initState
    };
  }

  componentWillReceiveProps(next) {
    const {endpoint, fname} = next
    if(fname != this.state.fname) {
      this.loadInitData(endpoint, fname)
    }
  }

  componentDidMount() {
    this.setControls()
  }

  setTimeSpeed = (percent) => {
    const range = 30
    const sec = range * (100 - percent) / 100.0 + 1
    this.timeScaleFactor = (sec / 1) * 1000; // second / Simulation units scaled to ms
    console.log(this.timeScaleFactor)
  }

  setControls() {
    document.addEventListener('keydown', this._onKeyDown, false);

    const controls = new OrbitControls(this.refs.camera, this.react3);

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.addEventListener('change', () => this._onTrackballChange());

    this.controls = controls;
  }

  _onTrackballChange = () => {
    this.setState({
      cameraPosition: this.refs.camera.position.clone(),
      cameraRotation: this.refs.camera.rotation.clone(),
    });
  };

  componentWillUnmount() {
    document.removeEventListener('keydown', this._onKeyDown, false);

    this.controls.dispose();
    delete this.controls;
  }

  addTrails(frame) {
    const {trails} = this.state

    frame.bodies.map((s) => {
      if(!(s.id in trails)) {
        trails[s.id] = []
      }
      trails[s.id].push(posVec(s))
    })
    // console.log(trails)
    this.setState({
      trails
    })
  }

  loadData(endpoint, fname) {
    const {offset, pageSize} = this.state
    this.client = new ApiClient(endpoint)

    console.log("Load data")

    this.client.getSnapshots(fname, offset, pageSize)
    .then((data) => {
      this.snapshots = data.Lines

      console.log(`Loaded ${data.Lines.length} items`)

      this.currentTime = 0
      this.endOfData = false

      this.setState({
        currentSnapshotInd: 0,
        offset: 0,
        dstart: offset,
        dend: offset + pageSize,
        loading: false
      })

      this.unPause()
    })
  }

  resetCurrent() {
    const {fname} = this.state
    this.setTimeSpeed(initState.dtValue)
    this.loadInitData(this.client.baseUrl, fname)
  }

  loadInitData(endpoint, fname) {
    this.setState({
      ...initState,
      fname
    }, () => this.loadData(endpoint, fname))
  }

  startNextLoad() {
    const {
      offset,
      pageSize,
      direction,
      currentSnapshotInd,
      dend,
      dstart
    } = this.state
    if(this.state.loading || this.endOfData) {
      return
    }
    let newOff = dend
    // Pull prev data in reverse
    if(direction < 0) {
      newOff = dstart - pageSize
      if(newOff < 0) {
        newOff = 0
      }
    }

    if(newOff == 0 && offset == 0) {
      console.log("Hit start of data")
      this.endOfData = true
      return
    }
    this.setState({
      loading: true,
      offset: newOff
    }, () => this.loadNextData(direction))
  }

  loadNextData(direction) {
    console.log("Load next page")

    const {offset, pageSize, fname, loading} = this.state
    console.log(`Name : ${fname} Offset: ${offset}`)

    this.client.getSnapshots(fname, offset, pageSize)
    .then(this.onUpdateLoad.bind(this, direction))

  }

  onUpdateLoad(direction, data) {
    const {
      offset,
      pageSize,
      currentSnapshotInd,
      dend,
      dstart
    } = this.state

    const dataLen = data.Lines.length

    console.log(`Loaded ${dataLen} items`)

    let state = {loading: false, offset}
    if(dataLen > 0) {
      this.outOfSnaps = false

      const newLen = this.snapshots.length + dataLen
      const dif = newLen - maxSnapshots

      if(direction > 0) {
        state.dend = dend + dataLen
        if(newLen > maxSnapshots){
          this.snapshots = this.snapshots.concat(data.Lines).slice(-maxSnapshots)
          if(dif > 0) {
            state.currentSnapshotInd = currentSnapshotInd - dif
            state.dstart = dstart + dif
          }
        } else {
          this.snapshots = this.snapshots.concat(data.Lines)
        }
      } else {
        this.snapshots = data.Lines.concat(this.snapshots).slice(0, maxSnapshots)
        state.currentSnapshotInd = currentSnapshotInd + dataLen
        state.dstart = dstart - dataLen
        state.dend = dend - dif
      }

      // If there is still more data, increase page size to prevent pausing
      if(this.state.paused) {
        // state.pageSize = Math.round(pageSize * 1.5)
        // this.unPause()
      }
    } else {
      this.endOfData = true
    }

    this.setState(state, function() {
      if(this.state.paused) {
        this.unPause()
      }
    }.bind(this))
  }

  toggleDirection() {
    const {direction} = this.state
    this.endOfData = false
    this.setState({
      direction: direction * -1
    })
  }

  unPause() {
    this.setState({
      paused: false,
    });
    this.prevTime = Date.now()
  }

  pause(f=null) {
    this.setState({
      paused: true,
    }, f);
  }

  _onKeyDown = (event) => {
    switch (event.keyCode) {
      default:
        break;
      case 79: // O
        // this.setState({
        //   activeCameraName: orthographicCameraName,
        // });
        break;
      case 80: // P
        // this.setState({
        //   activeCameraName: perspectiveCameraName,
        // });

        break;
    }
  };

  _onAnimate = () => {
    this.controls.update();

    const {
      paused,
      currentSnapshotInd,
      direction,
      loading,
      pageSize
    } = this.state

    const {
      endOfData,
      timeScaleFactor
    } = this


    if (paused) {
      return
    }


    const snapLen = this.snapshots.length
    // console.log(`Snap Len: ${snapLen}`)


    if(snapLen == 0) {
      return
    }

    const nowTime = Date.now()
    const stepTime = nowTime - this.prevTime // in milliseconds
    this.prevTime = nowTime

    if(debug) {
      this.currentTime += 0.001 * direction
    } else {
      this.currentTime += (stepTime / timeScaleFactor) * direction
    }

    let currentInd = currentSnapshotInd
    // console.log(`Current Ind before: ${currentInd}`)

    const allowedDiff = 0.01
    while(Math.abs(this.currentTime - this.snapshots[currentInd].time) > allowedDiff) {
      // console.log(`Current: ${this.currentTime} Snaphost: ${this.snapshots[currentInd].time} `)
      currentInd += direction

      // console.log(`Current: ${currentInd} len: ${this.snapshots.length} `)

      if(currentInd >= snapLen || currentInd < 0) {
        // reset sim
        console.log("Out of data")
        this.outOfSnaps = true
        this.setState({
          paused: true
        }, () => {
        } )
        if(!endOfData && !loading) {
          this.startNextLoad()
        }
        return
      }
    }


    // console.log(`Current Ind after: ${currentInd}`)
    const maxLoad = (2*maxSnapshots/3)
    const needLoading = (direction > 0 && currentInd > maxLoad) || (direction < 0 && currentInd < maxSnapshots - maxLoad)
    if((needLoading || snapLen < maxSnapshots) && !loading && !endOfData) {
      this.startNextLoad()
    }


    const currentSnapshot = this.snapshots[currentInd]

    this.addTrails(currentSnapshot)


    if(currentInd == this.state.currentInd) {
      return
    }

    const particles = currentSnapshot.bodies.map((b) => {return posVec(b)})

    this.setState({
      particles,
      currentSnapshotInd: currentInd
    });
  };

  onTimeSpeedUpdate = (percent) => {
    this.setTimeSpeed(percent)
    this.setState({dtValue: percent})
  }

  _pause = () => {

    this.setState({
      paused: !this.state.paused,
    });
    this.prevTime = Date.now()

  };

  _frame = () => {
    this.setState({
      paused: false,
    }, () => {
      this._onAnimate();
      this.setState({
        paused: true,
      });
    });
  };

  _react3Ref = (react3) => {
    this.react3 = react3  ;
  };

  render() {
    const {
      width,
      height,
    } = this.props;

    const {
      particles,
      paused,
      direction,
      trails,
      cameraPosition,
      cameraRotation,
      dtValue
    } = this.state;



    const aspectRatio = 0.5 * width / height;
    //
    // const pTrails = Object.keys(trails).map((k) => {
    //   console.log(trails[k])
    //   return <PointCloud key={k} vertices={trails[k]}/>
    // })
    // console.log(trails["1"])
    // console.log(randomCloud())
    // const pTrails = <PointCloud vertices={trails["1"]}/>

    return (<div>
      <Info
        pause={this._pause}
        paused={paused}
        currentTime={this.currentTime}
        forward={direction == 1}
        directionClick={this.toggleDirection.bind(this)}
        resetClick={this.resetCurrent.bind(this)}
        onTimeUpdate={this.onTimeSpeedUpdate.bind(this)}
        dtValue={dtValue}/>

      <React3
        canvasRef={this._react3Ref}
        ref="react3"
        width={width}
        height={height}
        antialias
        onAnimate={this._onAnimate}>

        <viewport
          x={0}
          y={0}
          width={width}
          height={height}
          cameraName="mainCamera"/>

        <scene>

          <perspectiveCamera
            ref="camera"
            name="mainCamera"
            fov={100}
            aspect={aspectRatio}
            near={1}
            far={100000}
            position={cameraPosition}
            rotation={cameraRotation} />


          {Spheres({vertices: particles})}


        </scene>
      </React3>
    </div>);
  }
}

export default NBodyViewer;
