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
const distanceScale = 200

const cameraStart = new THREE.Vector3(0, 0, 1000)


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
    };
  }

  componentDidMount() {
    this.setControls()

    this.loadData()
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

  loadData() {
    console.log("Load data")
    const {offset, pageSize} = this.state
    getSnapshots(offset, pageSize)
    .then((data) => {
      this.snapshots = data.Lines

      console.log( data)

      this.setState({
        paused: false,
        currentSnapshotInd: 0,
      })
    })
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

    this.currentTime += stepTime / timeScaleFactor

    let currentInd = currentSnapshotInd
    while(this.snapshots[currentInd].time < this.currentTime) {
      // console.log(`Current: ${this.currentTime} Snaphost: ${this.snapshots[currentInd].time} `)
      currentInd ++

      // console.log(`Current: ${currentInd} len: ${this.snapshots.length} `)

      if(currentInd >= this.snapshots.length) {
        // reset sim
        console.log("reset")
        currentInd = 0
        this.currentTime = 0
        break
      }
    }

    console.log(currentInd)

    const currentSnapshot = this.snapshots[currentInd]
    const positions = currentSnapshot.bodies.map((b) => {return b.pos})
    const particles = positions.map((p) => {
      return new THREE.Vector3(p[0], p[1],p[2]).multiplyScalar(distanceScale)
    })

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
    } = this.state;



    const aspectRatio = 0.5 * width / height;

    return (<div>
      <Info
        pause={this._pause}
        paused={paused}
        currentTime={this.currentTime} />

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


          {false && <PointCloud vertices={particles}/>}

        </scene>
      </React3>
    </div>);
  }
}

export default NBodyViewer;
