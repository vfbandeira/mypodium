import "./Audio.css"
import ReactDOM from 'react-dom'
import { withRouter } from 'react-router-dom'
import React, { Component } from "react"
import WaveSurfer from 'wavesurfer.js'
import Slider from 'react-slider-simple'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faVolumeUp, faVolumeDown, faVolumeOff, faVolumeMute, faPlay, faPause, faSpinner } from "@fortawesome/free-solid-svg-icons"


class Audio extends Component {
	constructor(props) {
		super(props)
		this.state = {
            loadStatus: 1,
            wavesurfer: null,
            playing: false,
            volume: 100,
            volumeStyle: 3,
            muted: false,
            duration: null
		}
    }

    componentWillUnmount() {
        if (this.state.wavesurfer) {
            try {
                this.state.wavesurfer.destroy()
            } catch {}
            this.setState({
                loadStatus: 1,
                wavesurfer: null,
                playing: false,
                volume: 100,
                volumeStyle: 3,
                muted: false,
                duration: null
            })
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.audioUrl !== prevProps.audioUrl) {
            this.componentWillUnmount()
            setTimeout(() => this.componentDidMount(), 200)
        }
    }
    
    componentDidMount() {
        var wavesurfer = WaveSurfer.create({
            container: ReactDOM.findDOMNode(this.waveref),
            closeAudioContext: true,
            hideScrollbar: true,
            height: 65,
            cursorColor: "#32333a",
            waveColor: "#a6a6a6",
            progressColor: "#383f48",
            maxCanvasWidth: 382,
            barWidth: 2,

        })
        this.setState({wavesurfer: wavesurfer}, () =>
        {
            this.state.wavesurfer.on('error', (error) => console.error(error))
            this.state.wavesurfer.on('loading', (progress) => 
            {
                if (progress === 100) {
                    setTimeout(() => 
                    {
                        var durationInSeconds = Math.round(this.state.wavesurfer.getDuration())
                        if (durationInSeconds === 0) {
                            this.componentWillUnmount()
                        } else {
                            if (this.props.autoplay) {
                                this.state.wavesurfer.play(0)
                                this.setState({playing: true, loadStatus: 2, duration: durationInSeconds})
                            } else {
                                this.setState({duration: durationInSeconds, loadStatus: 2})
                            }
                        }
                    }, 200)
                }
            })
            this.state.wavesurfer.on('finish', () => this.setState({playing: false}))
            
            this.state.wavesurfer.load(this.props.audioUrl)
        })
    }

    togglePlay() {
        if (this.state.playing) {
            this.state.wavesurfer.pause()
        } else {
            var currentTime = this.state.wavesurfer.getCurrentTime()
            if (this.state.wavesurfer.getDuration() > currentTime) {
                this.state.wavesurfer.play(currentTime)
            } else {
                this.state.wavesurfer.play(0)
            }
        }
        this.setState({playing: !this.state.playing})
    }

    toggleMute() {
        this.state.wavesurfer.setMute(!this.state.muted)
        this.setState({muted: !this.state.muted}, () => this.setVolume())
    }

    onVolumeChange(volume) {
        this.setState({volume: volume}, () => this.setVolume())
    }

    setVolume() {
        var volumeStyle = 0
        if (!this.state.muted) {
            if (this.state.volume >= 50) {
                volumeStyle = 3
            } else if (this.state.volume >= 1) {
                volumeStyle = 2
            } else {
                volumeStyle = 1
            }
            this.state.wavesurfer.setVolume(this.state.volume / 100.0)
        }
        this.setState({volumeStyle: volumeStyle})
    }

    render() {
        return (
            <div className="audio-container">
                {this.state.loadStatus === 1 && 
                <div className="audio-text-center audio-text"><FontAwesomeIcon icon={faSpinner} className="fa-spin" />&nbsp;Loading...</div>}
                
                {this.state.loadStatus === 3 && 
                <div className="audio-text-center audio-text">Error on loading the audio :(</div>}

                <div className="audio-wrapper">
                    {this.state.loadStatus === 2 && 
                    <div className="audio-play-pause clickable" onClick={() => this.togglePlay()}>
                        {!this.state.playing && <FontAwesomeIcon icon={faPlay} />}
                        {this.state.playing && <FontAwesomeIcon icon={faPause} />}
                    </div>}

                    <div className="audio-wave-volume-wrapper">
                        <div className="audio-wave" ref={(waveref) => this.waveref = waveref}></div>

                        {this.state.loadStatus === 2 && 
                        <div className="audio-volume-wrapper">                        
                            <FontAwesomeIcon className="audio-volume-icon clickable" 
                                icon={this.state.volumeStyle === 0 ? faVolumeMute : 
                                this.state.volumeStyle === 1 ? faVolumeOff : 
                                this.state.volumeStyle === 2 ? faVolumeDown : 
                                faVolumeUp} onClick={() => this.toggleMute()} />
                            <Slider 
                                className="audio-volume-slider"
                                defaultValue={100}
                                value={this.state.volume}
                                onChange={(percent) => this.onVolumeChange(percent)}
                                thumbColor="#000000"
                                shadowColor="#000000"
                                sliderPathColor="#a6a6a6" />
                        </div>}
                    </div>
                    
                    {this.state.loadStatus === 2 && <div className="audio-duration">{this.state.duration}&nbsp;Sec</div>}
                </div>
            </div>
        )
    }
}
export default withRouter(Audio)