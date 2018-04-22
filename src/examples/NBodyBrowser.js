import React from 'react';
import { NavLink } from 'react-router-dom';
import Viewer from './Viewer';

import SimpleExample from './Simple/index';
import NBodyViewer from './NBodyViewer';
import LoadDataForm from './LoadDataForm';

const examples = [
  {
    name: 'NBody',
    component: NBodyViewer,
    url: 'NBodyViewer/index',
    slug: 'nbody',
  }
];

const defaultEndpoint ="http://localhost:9090/"
const defaultFile = "run_20.out.xz"

class ExampleBrowser extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      loadData: false
    }
  }

  onSubmit(d) {
    console.log(d)
    this.setState({
      ...d,
      loadData: true
    })
  }


  render() {
    const { params } = this.props.match;
    const activeExample = params.slug && examples.find(example => example.slug === params.slug);

    const {
      endpoint,
      fname,
      loadData
    } = this.state

    return (
      <div>
        <div id="panel" className="collapsed">
          <h1>NBody Viewer</h1>
          <div id="content">
            <div>
              <LoadDataForm
                defaultUrl={defaultEndpoint}
                defaultFile={defaultFile}
                onSubmit={(d) => this.onSubmit(d)} />
            </div>
          </div>
        </div>
        {loadData && <Viewer endpoint={endpoint} fname={fname}/>}
      </div>
    );
  }
}

ExampleBrowser.propTypes = {
  match: React.PropTypes.object.isRequired,
};

export default ExampleBrowser;
