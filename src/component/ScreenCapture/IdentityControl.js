import React, { Component } from 'react';

class IdentityControl extends Component {
  constructor(props) {
    super(props)
    this.state = {identity: ''}
  }

  handleChange = e => {
    this.setState({identity: e.target.value})
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.setIdentity(this.state.identity)
  }

  render() {
    return (
      <div id="identity-controls">
        <p className="instructions">Name:</p>
        <input id="identity" type="text" placeholder="Enter your name" onChange={this.handleChange} />
        <button id="identity-connect" onClick={this.handleSubmit}>Connect</button>
      </div>
    )
  }
}

export default IdentityControl;