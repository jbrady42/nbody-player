import React from 'react';
import sizeMe from 'react-sizeme';

import NBodyViewer from './';

function splitSize({size, ...rest}) {
  return <div id="viewer">
    <NBodyViewer width={size.width} height={size.height} {...rest} />
  </div>
}

export default sizeMe({ monitorHeight: true, refreshRate: 100 })(splitSize);
