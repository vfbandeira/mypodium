import './Recorder.css'
import ReactDOM from 'react-dom'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import SignIn from './SignIn'
import AudioManager from '../util/audioManager'
import { server_error, success } from '../util/sweetalert'
import Message from '../models/Message'
import BlockstackManager from '../util/blockstackManager'
import Audio from './Audio'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import WaveSurfer from 'wavesurfer.js'
import MicrophonePlugin from 'wavesurfer.js/src/plugin/microphone.js'


class Recorder extends Component {
  constructor(props){
    super(props)
    this.state = {
      showSignIn: false,
      audioManager: null,
      isRecording: false,
      isSaving: false,
      recordingTime: -60,
      recorderContentUrl: null,
      effectContentUrl: null,
      effect: null,
      wavesurfer: null
    }
  }

  componentWillUnmount() {
    if (this.state.audioManager) {
      this.state.audioManager.cancelRecording();
    }
    if (this.state.wavesurfer) {
      try {
        this.state.wavesurfer.destroy()
      } catch {}
    }
  }

  onCompleteRecorder(urlContent) {
    this.setState({ recorderContentUrl: urlContent })
  }

  onStartRecorder() {
    if (!this.props.userSession || !this.props.userSession.isUserSignedIn()) {
	    this.setState({ showSignIn: true })
    } else {
      this.setState({ audioManager: new AudioManager() }, () =>
      {
        var wavesurfer = WaveSurfer.create({
          container: ReactDOM.findDOMNode(this.waverecord),
          interact: false,
          height: 65,
          cursorWidth: 0,
          waveColor: "#383f48",
          plugins: [
            MicrophonePlugin.create()
          ]
        })
        this.state.audioManager.startRecorder((urlContent) => this.onCompleteRecorder(urlContent)).then(() =>
        {
          this.setState({wavesurfer: wavesurfer, isRecording: this.state.audioManager.isRecording()}, () =>
          {
            this.state.wavesurfer.on('error', (error) => console.error(error))
            setTimeout(() => this.state.wavesurfer.microphone.start(), 100)
            this.setRecorderTime()
          })          
        }).catch((err) => server_error(err))
      })
    }
  }

  onStopRecorder() {
    if (this.state.audioManager && this.state.isRecording) {
      this.state.audioManager.stopRecording()
      this.state.wavesurfer.microphone.stop()
      this.state.wavesurfer.microphone.destroy()
      this.state.wavesurfer.destroy()
      this.setState({ isRecording: false, wavesurfer: null })
    }
  }

  onCancelRecorder() {
    if (this.state.audioManager && this.state.isRecording) {
      this.state.audioManager.cancelRecording()
      this.state.wavesurfer.microphone.stop()
      this.state.wavesurfer.microphone.destroy()
      this.state.wavesurfer.destroy()
      this.clearStateData()
    }
  }

  onDeleteRecorder() {
    if (this.state.audioManager && this.state.recorderContentUrl) {
      if (this.state.effectContentUrl) {
        window.URL.revokeObjectURL(this.state.effectContentUrl)
      }
      window.URL.revokeObjectURL(this.state.recorderContentUrl)
      if (this.state.effectContentUrl) {
        window.URL.revokeObjectURL(this.state.effectContentUrl)
      }
      this.clearStateData()
    }
  }

  clearStateData() {
    this.setState({ 
      audioManager: null, 
      isRecording: false, 
      isSaving: false, 
      recorderContentUrl: null, 
      effect: null, 
      effectContentUrl: null,
      recordingTime: -60,
      wavesurfer: null
    })
  }

  onEffect(name) {
    if (this.state.recorderContentUrl) {
      this.setState({effect: name, effectContentUrl: null}, () =>
      {
        if (name === "noeffect") {
          this.setState({effectContentUrl: this.state.recorderContentUrl})
        } else {
          AudioManager.transformAudio(this.state.recorderContentUrl, name).then((effectUrl) =>
          {
            this.setState({effectContentUrl: effectUrl})
          }).catch((err) => 
          {
            this.setState({effect: null})
            server_error(err)
          })
        }
      })
    }
  }

  onConfirmRecorder() {
    if (this.state.recorderContentUrl) {
      var url = (this.state.effectContentUrl ? this.state.effectContentUrl : this.state.recorderContentUrl)
      this.setState({ isSaving: true, effectContentUrl: null, effect: null }, () =>
      {
        fetch(url).then((res) => 
        {
          res.arrayBuffer().then((buffer) =>
          {
            BlockstackManager.storeAudio(buffer).then((contentId) =>
            {
              var message = new Message({
                contentId,
                reactions: [],
                createdBy: this.props.userSession.loadUserData().username
              })
              message.save().then((newMessage) => 
              {
                this.onDeleteRecorder()
                if (this.props.onNewMessage) {
                  newMessage.attrs._id = newMessage._id
                  this.props.onNewMessage(newMessage.attrs)
                }
                success("Audio published.")
              }).catch((err) => 
              {
                this.setState({ isSaving: false })
                server_error(err)
              })
            }).catch((err) => {
              this.setState({ isSaving: false })
              server_error(err)
            })
          }).catch((err) => {
            this.setState({ isSaving: false })
            server_error(err)
          })
        }).catch((err) => {
          this.setState({ isSaving: false })
          server_error(err)
        })
      })
    } else {
      this.onDeleteRecorder()
    }
  }

  setRecorderTime() {
    if (this.state.isRecording) {
      var time = this.state.audioManager.recordingTime() | 0
      if (time < 60) {
        this.setState({ recordingTime: -1 * (60 - time) })
        setTimeout(() => this.setRecorderTime(), 1000)
      } else {
        this.onStopRecorder()  
      }
    } 
  }

  onCloseSignIn(redirect) {
    this.setState({ showSignIn: false })
    if (redirect) {
      this.props.signIn(window.location.href)
    }
  }

  render() {
    var isLogged = this.props.userSession && this.props.userSession.isUserSignedIn()
    return (
    <div>
        {!isLogged && 
        <div className="join-container my-4">
            <h1 className="mb-3">Share your voice and be prepared to get booed or cheered</h1>
            <div className="action-btn clickable" onClick={() => this.setState({ showSignIn: true })}>JOIN NOW</div>
        </div>}
        {isLogged &&
        <div className="recorder-container">
          <div className="width100">
            
              <div className={"recorder-rec-container" + ((!this.state.audioManager || this.state.isRecording) ? " recorder-rec-container-active" : "")}>
                  {(!this.state.audioManager || this.state.isRecording) &&
                  <div className="recorder-rec-btn-container">
                    <div className={"recorder-btn clickable" + (this.state.isRecording ? " pulse-animation" : "")} onClick={() => ((this.state.audioManager && this.state.isRecording) ? this.onStopRecorder() : this.onStartRecorder())}><div className="recorder-btn-internal"></div></div>
                    <div className="record-text">{this.state.isRecording ? "Stop" : "Record"}</div>
                  </div>}
                  <div className={"recorder-line" + ((this.state.audioManager && !this.state.isRecording) ? " recorder-line-inactive" : (!this.state.audioManager ? " recorder-line-empty" : ""))} ref={(waverecord) => this.waverecord = waverecord}></div>
                  {(!this.state.audioManager || this.state.isRecording) &&
                  <div className="recorder-duration">{this.state.recordingTime}&nbsp;Sec</div>}
              </div>

              {((this.state.audioManager && !this.state.isRecording && !this.state.recorderContentUrl) || this.state.isSaving) &&
              <div className="recorder-loading"><FontAwesomeIcon icon={faSpinner} className="fa-spin" />&nbsp;Loading...</div>}

              {this.state.audioManager && !this.state.isRecording && this.state.recorderContentUrl && !this.state.isSaving &&
              <div className="recorder-confirm-container">
                
                  {this.state.effect && !this.state.effectContentUrl && 
                    <div className="recorder-loading"><FontAwesomeIcon icon={faSpinner} className="fa-spin" />&nbsp;Loading...</div>}
                    
                  {!this.state.effectContentUrl && !this.state.effect &&
                    <Audio className="width100" audioUrl={this.state.recorderContentUrl}></Audio>}
                  {this.state.effectContentUrl && this.state.effect &&
                    <Audio className="width100" audioUrl={this.state.effectContentUrl} autoplay={true}></Audio>} 

                  <div className="recorder-effects-divider-container">
                    <div className="recorder-effects-divider"></div>
                    <div className="recorder-add-effect">Add Effect</div>
                    <div className="recorder-effects-divider"></div>
                  </div>
                  <div className="recorder-effects-container">
                    <div onClick={() => this.onEffect("noeffect")} className={"recorder-noeffect clickable" + ((!this.state.effect || this.state.effect === "noeffect") ? " recorder-effect-active" : "")}>
                      No effect
                    </div>
                    <div onClick={() => this.onEffect("robot")} title="Robot" className={"recorder-effect clickable" + (this.state.effect === "robot" ? " recorder-effect-active" : "")}>
                      <img src="/robot.png" alt="Robot" className="recorder-effect-icon" />
                    </div>
                    <div onClick={() => this.onEffect("astronaut")} title="Astronaut" className={"recorder-effect clickable" + (this.state.effect === "astronaut" ? " recorder-effect-active" : "")}>
                      <img src="/astronaut.png" alt="Astronaut" className="recorder-effect-icon" />
                    </div>
                    <div onClick={() => this.onEffect("bane")} title="Bane" className={"recorder-effect clickable" + (this.state.effect === "bane" ? " recorder-effect-active" : "")}>
                      <img src="/bane.png" alt="Bane" className="recorder-effect-icon" /> 
                    </div>
                    <div onClick={() => this.onEffect("monster")} title="Monster" className={"recorder-effect clickable" + (this.state.effect === "monster" ? " recorder-effect-active" : "")}>
                      <img src="/monster.png" alt="Monster" className="recorder-effect-icon" />
                    </div>
                    <div onClick={() => this.onEffect("fast")} title="Fast" className={"recorder-effect clickable" + (this.state.effect === "fast" ? " recorder-effect-active" : "")}>
                      <img src="/fast.png" alt="Fast" className="recorder-effect-icon" />
                    </div>
                    <div onClick={() => this.onEffect("slow")} title="Slow" className={"recorder-effect clickable" + (this.state.effect === "slow" ? " recorder-effect-active" : "")}>
                      <img src="/slow.png" alt="Slow" className="recorder-effect-icon" />
                    </div>
                  </div>
                  <div className="recorder-divider"></div>
                  <div className="recorder-actions">
                    <div className="recorder-discard clickable" onClick={() => this.onDeleteRecorder()}>Discard</div>
                    <div className="action-btn clickable" onClick={() => this.onConfirmRecorder()}>Publish</div>
                  </div>
              </div>}
          </div>
        </div>}
        {this.state.showSignIn && 
        <SignIn 
          userSession={this.props.userSession} 
          message="Login to get started."
          onHide={(redirect) => this.onCloseSignIn(redirect)}
        />}
    </div>)
  }
}
export default withRouter(Recorder)
