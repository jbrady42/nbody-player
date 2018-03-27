import React from 'react';
import * as THREE from 'three';

export function randomCloud() {
  const pointCloudVertices = [];

  for (let i = 0; i < 10000; i++) {
    const vertex = new THREE.Vector3();

    vertex.x = THREE.Math.randFloatSpread(2000);
    vertex.y = THREE.Math.randFloatSpread(2000);
    vertex.z = THREE.Math.randFloatSpread(2000);

    pointCloudVertices.push(vertex);
  }

  return pointCloudVertices
}

export function PointCloud({vertices}) {
  return <points>
    <geometry vertices={vertices}/>
    <pointsMaterial color={0x888888}/>
  </points>
}

export function MeshCloud({vertices}) {
  return vertices.map((v, i) => {
    return <object3D key={i}>
      <mesh position={v}>
        <sphereGeometry
          radius={3}
          widthSegments={16}
          heightSegments={8} />

        <meshBasicMaterial
          color={0xffffff}
          wireframe />
      </mesh>
    </object3D>
  })
}
