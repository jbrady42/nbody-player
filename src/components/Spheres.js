import React from 'react';
import * as THREE from 'three';


function Spheres({vertices}) {
  const color = 0x00AA00
  return vertices.map((v, i) => {
    return <object3D key={i}>
      <mesh position={v}>
        <sphereGeometry
          radius={3}
          widthSegments={16}
          heightSegments={8} />

        <meshBasicMaterial
          color={color}
          wireframe />
      </mesh>
    </object3D>
  })
}

export default Spheres
