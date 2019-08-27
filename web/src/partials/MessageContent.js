import "./MessageContent.css"
import { withRouter } from 'react-router-dom'
import React, { Component } from "react"
import fromNow from 'fromnow'
import Reaction from "../models/Reaction"
import { server_error, confirm } from "../util/sweetalert"
import BlockstackManager from "../util/blockstackManager"
import AudioManager from "../util/audioManager"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faTimes, faUserCircle, faShareAlt } from '@fortawesome/free-solid-svg-icons'
import Audio from './Audio'


class MessageContent extends Component {
	constructor(props) {
		super(props)
		this.state = {
            clapAmount: 0,
            booAmount: 0,
            lolAmount: 0,
            userReaction: null,
            reacting: false,
            deleting: false,
            audioUrl: null,
            profile: null
		}
    }

    getTimeAgo() {
        return fromNow(this.props.message.attrs.createdAt, { max: 1, suffix: true })
    }

    componentDidMount() {
        var clapAmount = 0, booAmount = 0, lolAmount = 0
        var userReaction = null
        if (this.props.message && this.props.message.attrs && this.props.message.attrs.reactions) {
            for (var i = 0; i < this.props.message.attrs.reactions.length; ++i) {
                if (this.props.message.attrs.reactions[i].type === 1) {
                    clapAmount += 1
                } else if (this.props.message.attrs.reactions[i].type === 2) {
                    booAmount += 1
                } else if (this.props.message.attrs.reactions[i].type === 3) {
                    lolAmount += 1
                }
                if (this.props.user && this.props.user.attrs && this.props.user.attrs._id === this.props.message.attrs.reactions[i].username) {
                    userReaction = this.props.message.attrs.reactions[i]
                }
            }
        }
        this.setState({
            clapAmount: clapAmount,
            booAmount: booAmount,
            lolAmount: lolAmount,
            userReaction: userReaction
        })
        
        BlockstackManager.getUserProfile(this.props.message.attrs.createdBy).then(response => this.setState({profile: response}))
        this.setAudioData(clapAmount, lolAmount, booAmount)
    }

    componentDidUpdate(prevProps) {
        if ((!prevProps.user && this.props.user) || (prevProps.user && !this.props.user) ||
            (this.props.user && prevProps.user && this.props.user.attrs._id !== prevProps.user.attrs._id)) {
            this.componentDidMount()
        }
    }

    setAudioData(clapAmount, lolAmount, booAmount) {
        if (this.props.message && this.props.message.attrs && this.props.message.attrs.contentId) {
            BlockstackManager.getAudio(this.props.message.attrs.contentId, this.props.message.attrs.createdBy).then((file) =>
            {
                if (file) {
                    AudioManager.getAudioUrl(file, clapAmount, lolAmount, booAmount).then((audioUrl) =>
                    {
                        if (audioUrl) {
                            this.setState({audioUrl: audioUrl})
                        }
                    }).catch((err) => server_error(err))  
                } 
            }).catch((err) => server_error(err))
        }
    }

    onReact(type) {
        if (!this.props.user || !this.props.user.attrs || !this.props.user.attrs._id) {
            this.props.showSignIn()
        } else if (!this.state.deleting && !this.state.reacting) {
            this.setState({reacting: type}, () =>
            {
                if (this.state.userReaction) {
                    var oldReactionType = this.state.userReaction.type
                    new Reaction(this.state.userReaction).destroy().then(() =>
                    {
                        var clapAmount = this.state.clapAmount, booAmount = this.state.booAmount, lolAmount = this.state.lolAmount
                        if (this.state.userReaction.type === 1) {
                            clapAmount -= 1
                        } else if (this.state.userReaction.type === 2) {
                            booAmount -= 1
                        } else if (this.state.userReaction.type === 3) {
                            lolAmount -= 1
                        }
                        this.setState({
                            clapAmount: clapAmount,
                            booAmount: booAmount,
                            lolAmount: lolAmount,
                            userReaction: null}, () =>
                        {
                            if (oldReactionType !== type) {
                                this.setNewReaction(type)
                            } else {
                                this.setAudioData(clapAmount, lolAmount, booAmount)
                                this.setState({ reacting: false })
                            }
                        })
                    }).catch((err) => 
                    {
                        this.setState({ reacting: false })
                        server_error(err)
                    })
                } else {
                    this.setNewReaction(type)
                }
            })
        }
    }

    setNewReaction(type) {
        var reaction = new Reaction({
            messageId: this.props.message.attrs._id,
            username: this.props.user.attrs._id,
            type: type
        })
        reaction.save().then((newReaction) => 
        {
            var clapAmount = this.state.clapAmount, booAmount = this.state.booAmount, lolAmount = this.state.lolAmount
            if (type === 1) {
                clapAmount += 1
            } else if (type === 2) {
                booAmount += 1
            } else if (type === 3) {
                lolAmount += 1
            }
            newReaction.attrs._id = newReaction._id
            this.setState({ 
                reacting: false, 
                userReaction: newReaction.attrs,
                clapAmount: clapAmount,
                booAmount: booAmount,
                lolAmount: lolAmount
            })
            this.setAudioData(clapAmount, lolAmount, booAmount)
        }).catch((err) => 
        {
            this.setState({ reacting: false })
            server_error(err)
        })
    }

    onDeleteMessage() {
        if (!this.state.deleting && !this.state.reacting) {
            confirm("The audio will be deleted.", (result) => {
                if (result) {
                    this.setState({deleting: true}, () =>
                    {
                        var message = this.props.message
                        this.props.message.destroy().then(() =>
                        {
                            BlockstackManager.deleteAudio(message.attrs.contentId)
                            this.props.onDeleteMessage(message)                            
                        }).catch((err) => 
                        {
                            this.setState({deleting: false})
                            server_error(err)
                        })
                    })
                }
            })
        } 
    }

    onClickShare(id) {
        var width  = 575,
        height = 400,
        left   = (window.innerWidth - width)  / 2,
        top    = (window.innerHeight - height) / 2,
        opts   = 'status=1' +
                 ',width='  + width  +
                 ',height=' + height +
                 ',top='    + top    +
                 ',left='   + left
        var text = "I just published a new audio to @My_Podium. Go listen it on: ";
        var url = window.location.origin + "/message/" + id
        var link = "https://twitter.com/share?text=" + text + "&url=" + url
        window.open(link, 'share', opts)
    }

    render() {
        var name = this.state.profile && this.state.profile.name ? this.state.profile.name : this.props.message.attrs.createdBy
        return (
        <div className="message-content-container">
            {this.props.message && this.props.message.attrs && this.props.message.attrs.contentId &&
            <div className="message-content-wrapper">

                <div className="message-content-user-container">
                    <div className="message-content-user-wrapper">
                        {this.state.profile && this.state.profile.avatarUrl ? 
                            <img src={this.state.profile.avatarUrl} 
                                className="message-content-user-img clickable" 
                                alt={this.props.message.attrs.createdBy} 
                                onClick={() => this.props.history.push('/' + this.props.message.attrs.createdBy)} /> : 
                            <FontAwesomeIcon icon={faUserCircle} 
                                className="message-content-user-img clickable"
                                onClick={() => this.props.history.push('/' + this.props.message.attrs.createdBy)}/>}

                        <div className="message-content-user-profile clickable" onClick={() => this.props.history.push('/' + this.props.message.attrs.createdBy)}>
                            <div className="message-content-user-name" title={name}>{name}</div>
                            {this.state.profile && this.state.profile.name && 
                            <div className="message-content-user-username" title={this.props.message.attrs.createdBy}>
                                {this.props.message.attrs.createdBy}
                            </div>}
                        </div>
                    </div>

                    <div className="message-content-time clickable" onClick={() => this.props.history.push('/message/' + this.props.message.attrs._id)}>
                        {this.getTimeAgo()}
                    </div>
                </div>

                <div className="message-content">
                    <div className="message-content-delete">
                        {this.props.user && this.props.user.attrs && this.props.message.attrs.createdBy === this.props.user.attrs._id && 
                        <FontAwesomeIcon title="Delete audio" icon={faTimes} className="clickable" onClick={() => this.onDeleteMessage()} />}
                    </div>
                    <div className="message-content-audio">
                        {this.state.audioUrl && <Audio audioUrl={this.state.audioUrl}></Audio>}
                        {!this.state.audioUrl && <div className="message-content-loading"><FontAwesomeIcon icon={faSpinner} className="fa-spin" />&nbsp;Loading...</div>}
                    </div>
                    <div className="message-content-actions">
                        <div className="message-content-reactions-wrapper">
                            <div className="message-content-reaction-container">
                            <div onClick={() => this.onReact(1)} className={"message-content-reaction clickable" + (this.state.userReaction && this.state.userReaction.type === 1 ? " reaction-selected" : "")}>
                                {this.state.reacting !== 1 && <img src="/clap.png" alt="CLAPS" className="message-content-reaction-icon" />}
                                {this.state.reacting === 1 && <FontAwesomeIcon icon={faSpinner} className="fa-spin message-content-reaction-icon" />}
                                <div className="message-content-reaction-amount">
                                    {this.state.clapAmount}
                                </div>
                            </div>
                            </div>
                            <div className="message-content-reaction-container">
                            <div onClick={() => this.onReact(2)} className={"message-content-reaction clickable" + (this.state.userReaction && this.state.userReaction.type === 2 ? " reaction-selected" : "")}>
                                {this.state.reacting !== 2 && <img src="/booing.png" alt="BOO" className="message-content-reaction-icon" />}
                                {this.state.reacting === 2 && <FontAwesomeIcon icon={faSpinner} className="fa-spin message-content-reaction-icon" />}
                                <div className="message-content-reaction-amount">
                                    {this.state.booAmount}
                                </div>
                            </div>
                            </div>
                            <div className="message-content-reaction-container">
                            <div onClick={() => this.onReact(3)} className={"message-content-reaction clickable" + (this.state.userReaction && this.state.userReaction.type === 3 ? " reaction-selected" : "")}>
                                {this.state.reacting !== 3 && <img src="/laugh.png" alt="HAHAHA" className="message-content-reaction-icon" />}
                                {this.state.reacting === 3 && <FontAwesomeIcon icon={faSpinner} className="fa-spin message-content-reaction-icon" />}
                                <div className="message-content-reaction-amount">
                                    {this.state.lolAmount}
                                </div>
                            </div>
                            </div>
                        </div>
                        <div className="message-content-share clickable" onClick={() => this.onClickShare(this.props.message.attrs._id)}>
                            <FontAwesomeIcon icon={faShareAlt} />
                        </div>
                    </div>
                </div>
            </div>}
        </div>
        )
    }
}
export default withRouter(MessageContent)