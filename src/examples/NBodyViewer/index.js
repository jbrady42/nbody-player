import React from 'react';
import ReactDOM from 'react-dom';

import * as THREE from 'three';
import ExampleBase from './../ExampleBase';

import React3 from 'react-three-renderer';

import Info from './Info';

import {randomCloud, PointCloud, MeshCloud}  from './PointCloud';

import TrackballControls from '../../ref/trackball';

const mainCameraName = 'mainCamera';

const spherePosition = new THREE.Vector3(0, 0, 150);

const timeScaleFactor = (10.0 / 1) * 1000; // second / Simulation units scaled to ms

class NBodyViewer extends ExampleBase {
  constructor(props, context) {
    super(props, context);

    const r = Date.now() * 0.0005;
    this.prevTime = Date.now()
    this.currentTime = 0.0

    this.state = {
      ... this.state,
      meshPosition: new THREE.Vector3(Math.cos(r), Math.sin(r), Math.sin(r)).multiplyScalar(700),
      paused: false,
      mainCameraPosition: new THREE.Vector3(0, 0, 2500),
      pointVerticies: randomCloud()
    };
  }

  componentDidMount() {
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

    if (this.state.paused) {
      return;
    }

    const nowTime = Date.now()
    const stepTime = nowTime - this.prevTime // in milliseconds
    this.prevTime = nowTime


    this.currentTime += stepTime / timeScaleFactor

    const r = nowTime * 0.0005;
    console.log(this.currentTime)

    this.setState({
      r,
      meshPosition: new THREE.Vector3(Math.cos(r), Math.sin(r), Math.sin(r)).multiplyScalar(700),
    });
  };

  _pause = () => {
    this.setState({
      paused: !this.state.paused,
    });
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
      meshPosition,
      r,
      pointVerticies
    } = this.state;

    const aspectRatio = 0.5 * width / height;

    return (<div>
      <Info
        pause={this._pause}
        frame={this._frame} />

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


          {MeshCloud({vertices: [meshPosition]})}


          {false && <PointCloud vertices={pointVerticies}/>}

        </scene>
      </React3>
    </div>);
  }
}

export default NBodyViewer;
