import React from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import React3 from 'react-three-renderer';

import ExampleBase from './../ExampleBase';
import Info from './Info';
import TrackballControls from '../../ref/trackball';
import {randomCloud, PointCloud, MeshCloud}  from './PointCloud';
import {getSnapshots} from "./api"

const mainCameraName = 'mainCamera';

const spherePosition = new THREE.Vector3(0, 0, 150);

const timeScaleFactor = (10.0 / 1) * 1000; // second / Simulation units scaled to ms
const distanceScale = 500

const cameraStart = new THREE.Vector3(0, 0, 1000)

function posVec(state) {
  const {pos} = state
  return new THREE.Vector3(pos[0], pos[1],pos[2]).multiplyScalar(distanceScale)
}

class NBodyViewer extends ExampleBase {
  constructor(props, context) {
    super(props, context);

    this.prevTime = Date.now()
    this.currentTime = 0.0

    this.state = {
      ... this.state,
      paused: true,
      mainCameraPosition: cameraStart,
      pointVerticies: randomCloud(),
      offset: 0,
      pageSize: 10000,
      snapshots: [],
      particles: [],
      trails: {},
      direction: 1
    };
  }

  componentWillReceiveProps(next) {
    const {endpoint, fname} = next
    this.loadData(endpoint, fname)
  }

  componentDidMount() {
    this.setControls()

    // this.loadData()
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
    console.log("Load data")
    const {offset, pageSize} = this.state
    getSnapshots(endpoint, fname, offset, pageSize)
    .then((data) => {
      this.snapshots = data.Lines

      console.log(data)

      this.currentTime = 0

      this.setState({
        currentSnapshotInd: 0,
      })

      this.unPause()
    })
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

  pause() {
    this.setState({
      paused: true,
    });
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
      direction
    } = this.state

    if (paused) {
      return
    }

    const nowTime = Date.now()
    const stepTime = nowTime - this.prevTime // in milliseconds
    this.prevTime = nowTime



    if(this.snapshots.length == 0) {
      return
    }

    this.currentTime += (stepTime / timeScaleFactor) * direction

    let currentInd = currentSnapshotInd
    const allowedDiff = 0.01
    while(Math.abs(this.currentTime - this.snapshots[currentInd].time) > allowedDiff) {
      // console.log(`Current: ${this.currentTime} Snaphost: ${this.snapshots[currentInd].time} `)
      currentInd += direction

      // console.log(`Current: ${currentInd} len: ${this.snapshots.length} `)

      if(currentInd >= this.snapshots.length || currentInd < 0) {
        // reset sim
        this.reset()
        return
      }
    }

    console.log(currentInd)



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


          {MeshCloud({vertices: particles})}


        </scene>
      </React3>
    </div>);
  }
}

export default NBodyViewer;
