import React, { Component } from 'react';
import './index.css';
import Video from 'twilio-video'
import IdentityControl from './IdentityControl';
import RoomControl from './RoomControl';
import LocalVideo from './LocalVideo';

class ScreenCapture extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showIdentityControls: true,
      showRoomControls: false,
      userName: null,
      roomName: null,
      isJoined: false,
      isInProgress: false,
      identity: null
    }
  }

  isFirefox = () => {
    var mediaSourceSupport = !!navigator.mediaDevices.getSupportedConstraints()
      .mediaSource;
    var matchData = navigator.userAgent.match(/Firefox\/(\d+)/);
    var firefoxVersion = 0;
    if (matchData && matchData[1]) {
      firefoxVersion = parseInt(matchData[1], 10);
    }
    return mediaSourceSupport && firefoxVersion >= 52;
  }

  isChrome = () => {
    return 'chrome' in window;
  }
  

  getUserScreen = () => {
    var extensionId = 'phpejjjolljdehnkjilkkdgeohngnkam';
    // if (!canScreenShare()) {
    //   return;
    // }
    if (this.isChrome()) {
      return new Promise((resolve, reject) => {
        const request = {
          sources: ['screen']
        };
        window.chrome.runtime.sendMessage(extensionId, request, response => {
          if (response && response.type === 'success') {
            resolve({ streamId: response.streamId });
          } else {
            reject(new Error('Could not get stream'));
          }
        });
      }).then(response => {
        return navigator.mediaDevices.getUserMedia({
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: response.streamId
            }
          }
        });
      });
    } else if (this.isFirefox()) {
      return navigator.mediaDevices.getUserMedia({
        video: {
          mediaSource: 'screen'
        }
      });
    }
  }

  setIdentityObj = identity => {
    this.setState({ identity })
  }

  setIdentity = userName => {
    this.setState({ userName, showIdentityControls: false, showRoomControls: true })
  }

  joinRoom = roomName => {
    this.setState({ roomName })
    this.log("Joining room '" + roomName + "'...");
    var connectOptions = {
      name: roomName,
      logLevel: 'debug'
    };

    // Join the Room with the token from the server and the
    // LocalParticipant's Tracks.
    Video.connect(this.state.identity.token, connectOptions).then(this.roomJoined, error => {
      this.log('Could not connect to Twilio: ' + error.message);
    });
  }

  log = message => {
    var logDiv = document.getElementById('log');
    logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  roomJoined = room => {
    window.room = room;
  
    this.log("Joined as '" + this.state.identity.identity + "'");
    this.setState({isJoined: true})

    var previewContainer = document.getElementById('local-media');
    if (!previewContainer.querySelector('video')) {
      this.attachParticipantTracks(room.localParticipant, previewContainer);
    }
  
    // Attach the Tracks of the Room's Participants.
    room.participants.forEach(participant => {
      this.log("Already in Room: '" + participant.identity + "'");
      var previewContainer = document.getElementById('remote-media');
      this.attachParticipantTracks(participant, previewContainer);
    });
  
    // When a Participant joins the Room, log the event.
    room.on('participantConnected', participant => {
      this.log("Joining: '" + participant.identity + "'");
    });
  
    // When a Participant adds a Track, attach it to the DOM.
    room.on('trackAdded', (track, participant) => {
      this.log(participant.identity + ' added track: ' + track.kind);
      var previewContainer = document.getElementById('remote-media');
      this.attachTracks([track], previewContainer);
    });
  
    // When a Participant removes a Track, detach it from the DOM.
    room.on('trackRemoved', (track, participant) => {
      this.log(participant.identity + ' removed track: ' + track.kind);
      this.detachTracks([track]);
    });
  
    // When a Participant leaves the Room, detach its Tracks.
    room.on('participantDisconnected', participant => {
      this.log("Participant '" + participant.identity + "' left the room");
      this.detachParticipantTracks(participant);
    });
  
    // Once the LocalParticipant leaves the room, detach the Tracks
    // of all Participants, including that of the LocalParticipant.
    room.on('disconnected', () => {
      this.log('Left');
      this.detachParticipantTracks(room.localParticipant);
      room.participants.forEach(this.detachParticipantTracks);
      this.setState({isJoined: false})
    });
  }

  shareScreen = () => {
    this.getUserScreen().then( stream => {
      let screenTrack = stream.getVideoTracks()[0];
      window.room.localParticipant.publishTrack(screenTrack);
      this.setState({isInProgress: true})
    })
  }
  

  // Attach the Tracks to the DOM.
  attachTracks(tracks, container) {
    tracks.forEach(function(track) {
      container.appendChild(track.attach());
    });
  }

  // Attach the Participant's Tracks to the DOM.
  attachParticipantTracks(participant, container) {
    var tracks = Array.from(participant.tracks.values());
    this.attachTracks(tracks, container);
  }

  // Detach the Tracks from the DOM.
  detachTracks(tracks) {
    tracks.forEach(function(track) {
      track.detach().forEach(function(detachedElement) {
        detachedElement.remove();
      });
    });
  }

  // Detach the Participant's Tracks from the DOM.
  detachParticipantTracks(participant) {
    var tracks = Array.from(participant.tracks.values());
    this.detachTracks(tracks);
  }

  render() {
    return (
      <div>
          <div id="remote-media"></div>
          <div id="controls">
            <LocalVideo />
            {this.state.showIdentityControls && <IdentityControl setIdentity={ this.setIdentity }/>}
            {this.state.showRoomControls && <RoomControl 
              setIdentityObj={this.setIdentityObj} 
              joinRoom = { this.joinRoom } 
              isJoined={this.state.isJoined} 
              isInProgress={this.state.isInProgress} 
              identity={ this.state.identity } 
              userName = {this.state.userName}
              logConsole={ this.log }
              shareScreen = {this.shareScreen}/>}
            <div id="log"></div>
          </div>
      </div>
    );
  }
}

export default ScreenCapture;