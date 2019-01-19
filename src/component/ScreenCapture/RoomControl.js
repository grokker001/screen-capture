import React, { Component } from 'react';
import $ from 'jquery';
window.jQuery = window.$ = $;

class RoomControl extends Component {
  constructor(props) {
    super(props)
    this.state = {roomName: ''}
  }

  componentDidMount() {
    $.getJSON('http://192.168.0.24:3001/token?identity=' + encodeURIComponent(this.props.userName), data => {
      let identity = data.identity;
      this.props.logConsole("Ready and connected as '" + identity + "'...");
      this.props.setIdentityObj(data);
    });
  }

  handleChange = e => {
    this.setState({roomName: e.target.value})
  }

  setRoomName = e => {
    e.preventDefault();
    this.props.joinRoom(this.state.roomName)
  }

  shareScreen = e => {
    this.props.shareScreen()
  }

  render() {
    if (!this.props.identity) 
      return (
        <div>
          Fetching token...
        </div>
      )
    else
      return (
        <div id="room-controls">
          <p className="instructions">Room Name:</p>
          <input id="room-name" type="text" placeholder="Enter a room name" onChange={this.handleChange}/>
          {!this.props.isJoined && <button id="button-join" onClick={this.setRoomName}>Join Room</button> }
          {this.props.isJoined && <button id="button-leave">Leave Room</button> }
          {!this.props.isInProgress && <button id="button-share-screen" onClick={this.shareScreen}>Share screen</button> }
          {this.props.isInProgress && <button id="button-unshare-screen">Unshare screen</button> }
        </div>
    )
  }
}

export default RoomControl;