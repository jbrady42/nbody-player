import React from 'react';
import { NavLink } from 'react-router-dom';

import Viewer from './NBodyViewer/Viewer';
import LoadDataForm from '../components/LoadDataForm';

const defaultEndpoint ="/data/"
const defaultFile = "run_100.out.xz"

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
