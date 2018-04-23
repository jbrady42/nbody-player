import React from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import React3 from 'react-three-renderer';

import DisplayBase from '../../DisplayBase';
import Info from '../../components/Info';
import Spheres from '../../components/Spheres';
import TrackballControls from '../../ref/trackball';
import {randomCloud, PointCloud}  from '../../components/PointCloud';
import ApiClient from "./../../api"

const mainCameraName = 'mainCamera';

const spherePosition = new THREE.Vector3(0, 0, 150);

const timeScaleFactor = (10.0 / 1) * 1000; // second / Simulation units scaled to ms
const distanceScale = 500

const maxSnapshots = 200

const cameraStart = new THREE.Vector3(0, 0, 1000)

const initState = {
  paused: true,
  offset: 0,
  pageSize: 50,
  snapshots: [],
  particles: [],
  trails: {},
  direction: 1
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

    this.state = {
      ... this.state,
      mainCameraPosition: cameraStart,
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

  setControls() {
    document.addEventListener('keydown', this._onKeyDown, false);

    const controls = new TrackballControls(this.refs.mainCamera,
      ReactDOM.findDOMNode(this.refs.react3));

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.addEventListener('change', () => {
      this.setState({
        mainCameraPosition: this.refs.mainCamera.position,
      });
    });

    this.controls = controls;
  }

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
        offset: offset + pageSize,
        loading: false
      })

      this.unPause()
    })
  }

  loadInitData(endpoint, fname) {
    this.setState({
      ...initState,
      fname
    }, () => this.loadData(endpoint, fname))
  }

  startNextLoad() {
    if(this.state.loading || this.endOfData) {
      return
    }
    this.setState({
      loading: true
    }, () => this.loadNextData())
  }

  loadNextData() {
    console.log("Load next page")

    const {offset, pageSize, fname, loading} = this.state
    console.log(`Name : ${fname} Offset: ${offset}`)

    this.client.getSnapshots(fname, offset, pageSize)
    .then(this.onUpdateLoad.bind(this))

  }

  onUpdateLoad(data) {
    const {pageSize, offset, currentSnapshotInd} = this.state

    const dataLen = data.Lines.length

    console.log(`Loaded ${dataLen} items`)

    // this.currentTime = 0

    let state = {loading: false, offset}
    if(dataLen > 0) {
      this.outOfSnaps = false

      state.offset += pageSize
      const newLen = this.snapshots.length + dataLen

      if(newLen > maxSnapshots){
        this.snapshots = this.snapshots.concat(data.Lines).slice(-maxSnapshots)
        const dif = newLen - maxSnapshots
        if(dif > 0) {
          state.currentSnapshotInd = currentSnapshotInd - dif
        }
      } else {
         this.snapshots = this.snapshots.concat(data.Lines)
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

  reset() {
    console.log("reset")

    this.pause()
    this.currentTime = 0
    this.setState({
      currentInd: 0
    })
  }


  _onAnimate = () => {
    this.controls.update();

    const {
      paused,
      currentSnapshotInd,
      direction,
      loading,
      pageSize
    } = this.state

    const {endOfData} = this


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

    const debug = false
    if(debug) {
      this.currentTime += 0.001
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
    const maxLoad = maxSnapshots - (2*maxSnapshots/3)
    if((currentInd > maxLoad || snapLen < maxSnapshots) && !loading && !endOfData) {
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

  render() {
    const {
      width,
      height,
    } = this.props;

    const {
      particles,
      paused,
      direction,
      trails
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
        directionClick={() => this.toggleDirection()} />

      <React3
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
          cameraName={mainCameraName}/>

        <scene>

          <perspectiveCamera
            ref="mainCamera"
            name={mainCameraName}
            fov={50}
            aspect={aspectRatio}
            near={1}
            far={10000}
            position={this.state.mainCameraPosition}/>


          {Spheres({vertices: particles})}


        </scene>
      </React3>
    </div>);
  }
}

export default NBodyViewer;
