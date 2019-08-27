import './UserPage.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { server_error } from '../util/sweetalert'
import Message from '../models/Message'
import ServerManager from '../util/serverManager'
import MessageContent from '../partials/MessageContent'
import SignIn from '../partials/SignIn'
import Recorder from '../partials/Recorder'
import BlockstackManager from '../util/blockstackManager'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserCircle, faSpinner } from '@fortawesome/free-solid-svg-icons'


class UserPage extends Component {
  constructor(props){
    super(props)
    this.state = {
      messages: [],
      audioMessages: [],
      clapMessages: [],
      booingMessages: [],
      laughMessages: [],
      loadingMore: false,
      loading: true,
      hasMoreMessages: false,
      profile: null,
      showSignIn: false,
      reactionType: null
    }
  }

  componentWillMount() {
    if (!this.props.match.params.username) {
      this.props.history.push('/')
    } else {
      BlockstackManager.getUserProfile(this.props.match.params.username).then(response => this.setState({profile: response}))
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location && prevProps.location.hash !== window.location.hash) {
      this.componentDidMount();
    }
  }

  componentDidMount() {
    var reactionType = null
    if (window.location.hash === "#claps" || this.props.match.params.tab === "claps") {
      reactionType = 1
    } else if (window.location.hash === "#booing"  || this.props.match.params.tab === "booing") {
      reactionType = 2
    } else if (window.location.hash === "#laughs"  || this.props.match.params.tab === "laughs") {
      reactionType = 3
    }
    
    this.setState({reactionType: reactionType, loading: true}, () => this.listMessages(false))
  }

  listMessages(isLoadingMore) {
    var createdBy = this.props.match.params.username
    var reactionBy = null
    var lesserThan = null
    if (this.state.reactionType) {
      createdBy = null
      reactionBy = this.props.match.params.username
    }
    if (isLoadingMore) {
      var lastMessage = this.state.messages && this.state.messages.length && this.state.messages[this.state.messages.length - 1]
      lesserThan = lastMessage && lastMessage.createdAt
      ServerManager.listMessages(createdBy, lesserThan, this.state.reactionType, reactionBy).then((messages) => 
      {
        this.setNewMessages(messages)
      }).catch((err) => server_error(err))
    } else {
      var messages = null
      if (this.state.reactionType === 1) {
        messages = this.state.clapMessages
      } else if (this.state.reactionType === 2) {
        messages = this.state.booingMessages
      } else if (this.state.reactionType === 3) {
        messages = this.state.laughMessages
      } else {
        messages = this.state.audioMessages
      }
      if (messages.length === 0) {
        ServerManager.listMessages(createdBy, null, this.state.reactionType, reactionBy).then((messages) => 
        {
          this.setNewMessages(messages)
        }).catch((err) => server_error(err))
      } else {
        this.setState({messages: messages, hasMoreMessages: messages.length % 10 === 0, loading: false, loadingMore: false})
      }
    }
  }

  setNewMessages(newMessages) {
    var messages = []
    if (this.state.reactionType === 1) {
      messages = this.state.clapMessages.concat(newMessages)
      this.setState({clapMessages: messages})
    } else if (this.state.reactionType === 2) {
      messages = this.state.booingMessages.concat(newMessages)
      this.setState({booingMessages: messages})
    } else if (this.state.reactionType === 3) {
      messages = this.state.laughMessages.concat(newMessages)
      this.setState({laughMessages: messages})
    } else {
      messages = this.state.audioMessages.concat(newMessages)
      this.setState({audioMessages: messages})
    }
    var hasMoreMessages = newMessages.length === 10
    this.setState({messages: messages, hasMoreMessages: hasMoreMessages, loading: false, loadingMore: false})
  }

  loadMoreMessages() {
    if (!this.state.loadingMore) {
      this.setState({loadingMore: true}, () => this.listMessages(true))
    }
  }
  
  onCloseSignIn(redirect) {
    this.setState({ showSignIn: false })
    if (redirect) {
      this.props.signIn(window.location.href)
    }
  }

  onClickTab(tabName) {
    this.props.history.push("/" + this.props.match.params.username + "#" + tabName)
  }

  onDeleteMessage(message) {
      if (this.state.reactionType === 1) {
        this.setState({clapMessages: this.removeMessage(message._id, this.state.clapMessages)})
      } else if (this.state.reactionType === 2) {
        this.setState({booingMessages: this.removeMessage(message._id, this.state.booingMessages)})
      } else if (this.state.reactionType === 3) {
        this.setState({laughMessages: this.removeMessage(message._id, this.state.laughMessages)})
      } else {
        this.setState({audioMessages: this.removeMessage(message._id, this.state.audioMessages)})
      }
      this.setState({messages: this.removeMessage(message._id, this.state.messages)})
  }

  removeMessage(id, list) {
    for (var i = 0; i < list.length; ++i) {
      if (list[i]._id === id) {
        list.splice(i, 1)
        break
      }
    }
    return list
  }

  onNewMessage(message) {
    if (this.props.user && this.props.match.params.username === this.props.user._id) {
      this.state.audioMessages.unshift(message)
      this.setState({audioMessages: this.state.audioMessages})
      if (!this.state.reactionType) {
        this.state.messages.unshift(message)
        this.setState({messages: this.state.messages, audioMessages: this.state.audioMessages})
      }
    }
  }

  isLoggedUser(){
    return this.props.userSession.isUserSignedIn() && this.props.userSession.loadUserData().username === this.props.match.params.username;
  }

  render() {
    var name = this.state.profile && this.state.profile.name ? this.state.profile.name : this.props.match.params.username
    return (
      <div>
        <div className="container">
          <div className="user-page-container">
              <div className="user-page-user-wrapper d-none d-md-flex">
                {this.state.profile && this.state.profile.avatarUrl ? 
                  <img src={this.state.profile.avatarUrl} 
                      className="user-page-user-img" 
                      alt={this.props.match.params.username} /> : 
                  <FontAwesomeIcon icon={faUserCircle} 
                      className="user-page-user-img" />}

                <div className="user-page-user-profile">
                  <div className="user-page-user-name" title={name}>{name}</div>
                  {this.state.profile && this.state.profile.name && 
                  <div className="message-content-user-username" title={this.props.match.params.username}>
                    {this.props.match.params.username}
                  </div>}
                </div>
              </div>
              <div className="user-page-right-container">
                {this.isLoggedUser() &&
                  <Recorder 
                    userSession={this.props.userSession} 
                    signIn={(href) => this.props.signIn(href)}
                    onNewMessage={(message) => this.onNewMessage(message)}
                  ></Recorder>
                }
                <ul className="user-page-nav nav" role="tablist">
                  <li onClick={() => this.onClickTab("audios")} className={"user-page-nav-item" + (!this.state.reactionType ? " user-page-nav-active" : "")}>
                    <img src="/audio.png" alt="AUDIOS" />
                    <a className={!this.state.reactionType ? "user-page-nav-link-active" : ""} data-toggle="tab" href="#audios" role="tab" aria-controls="audios">AUDIOS</a>
                  </li>
                  <li onClick={() => this.onClickTab("claps")} className={"user-page-nav-item" + (this.state.reactionType === 1 ? " user-page-nav-active" : "")}>
                    <img src="/clap.png" alt="CLAPPED" />
                    <a className={this.state.reactionType === 1 ? "user-page-nav-link-active" : ""} data-toggle="tab" href="#claps" role="tab" aria-controls="claps">CLAPPED</a>
                  </li>
                  <li onClick={() => this.onClickTab("booing")} className={"user-page-nav-item" + (this.state.reactionType === 2 ? " user-page-nav-active" : "")}>
                    <img src="/booing.png" alt="BOOED" />
                    <a className={this.state.reactionType === 2 ? "user-page-nav-link-active" : ""} data-toggle="tab" href="#booing" role="tab" aria-controls="booing">BOOED</a>
                  </li>
                  <li onClick={() => this.onClickTab("laughs")} className={"user-page-nav-item" + (this.state.reactionType === 3 ? " user-page-nav-active" : "")}>
                    <img src="/laugh.png" alt="LAUGHED" />
                    <a className={this.state.reactionType === 3 ? "user-page-nav-link-active" : ""} data-toggle="tab" href="#laughs" role="tab" aria-controls="laughs">LAUGHED</a>
                  </li>
                </ul>

                {this.state.loading && 
                <div className="user-page-text-center">
                  <FontAwesomeIcon icon={faSpinner} className="fa-spin" />&nbsp;Loading...
                </div>}

                {!this.state.loading && 
                  <div className="user-page-container-messages">
                    {this.state.messages && this.state.messages.map((message) => 
                      <MessageContent 
                        key={message._id} 
                        user={this.props.user} 
                        showSignIn={() => this.setState({showSignIn: true})} 
                        onDeleteMessage={(message) => this.onDeleteMessage(message)} 
                        message={new Message(message)} />
                    )}
                    {this.state.messages && this.state.messages.length === 0 && <div className="user-page-text-center">No audios here.</div>}
                    {this.state.hasMoreMessages && 
                    <div className="loadmore"><span onClick={() => this.loadMoreMessages()}>{this.state.loadingMore && <FontAwesomeIcon icon={faSpinner} className="fa-spin" />}Load More</span></div>}
                  </div>}
              </div>
            </div>
        </div>
      {this.state.showSignIn && 
      <SignIn 
        userSession={this.props.userSession} 
        message="Login to get started."
        onHide={(redirect) => this.onCloseSignIn(redirect)}
      />}
    </div>
    )
  }
}
export default withRouter(UserPage)
