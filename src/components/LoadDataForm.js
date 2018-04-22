import React from 'react';

class DataForm extends React.Component  {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    // alert('A name was submitted: ' + this.input.value);
    event.preventDefault();
    this.props.onSubmit({
      endpoint: this.urlInput.value,
      fname: this.input.value
    })
  }

  render() {
    const {
      defaultUrl,
      defaultFile
    } = this.props

    return <form onSubmit={this.handleSubmit}>
      <label>
        Data Url:
        <input type="text" defaultValue={defaultUrl} ref={(input) => this.urlInput = input} />
        File Name:
        <input type="text" defaultValue={defaultFile} ref={(input) => this.input = input} />
      </label>
      <input type="submit" value="Load" />
    </form>
  }
}

export default DataForm;
