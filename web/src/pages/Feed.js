import './Feed.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { server_error } from '../util/sweetalert'
import Message from '../models/Message'
import ServerManager from '../util/serverManager'
import SignIn from '../partials/SignIn'
import Recorder from '../partials/Recorder'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import MessageContent from '../partials/MessageContent'


class Feed extends Component {
  constructor(props){
    super(props)
    this.state = {
      messages: [],
      loadingMore: false,
      loading: false,
      hasMoreMessages: false,
      showSignIn: false
    }
  }

  componentWillMount() {
    if (window.location.pathname !== '/') {
      this.props.history.push('/')
    }
    this.loadMessages()
  }

  loadMessages() {
    this.setState({loading: true}, () =>
    {
      ServerManager.listMessages().then((messages) => 
      {
        this.setState({messages: messages, loading: false, hasMoreMessages: messages.length === 10})
      }).catch((err) => server_error(err))
    })
  }

  loadMoreMessages() {
    if (!this.state.loadingMore) {
      this.setState({loadingMore: true}, () =>
      {
        var lastMessage = this.state.messages && this.state.messages.length && this.state.messages[this.state.messages.length - 1]
        var lesserThan = lastMessage && lastMessage.createdAt
        ServerManager.listMessages(null, lesserThan).then((messages) => 
        {
          var hasMoreMessages = messages.length === 10
          this.state.messages.concat(messages)
          this.setState({messages: this.state.messages, hasMoreMessages: hasMoreMessages, loadingMore: false})
        }).catch((err) => server_error(err))
      })
    }
  }

  onNewMessage(message) {
    this.state.messages.unshift(message)
    this.setState({messages: this.state.messages})
  }

  onCloseSignIn(redirect) {
    this.setState({ showSignIn: false })
    if (redirect) {
      this.props.signIn(window.location.href)
    }
  }

  onDeleteMessage(message) {
    for (var i = 0; i < this.state.messages.length; ++i) {
      if (this.state.messages[i]._id === message._id) {
        this.state.messages.splice(i, 1)
        break
      }
    }
    this.setState({messages: this.state.messages})
}

  render() {
    return (
      <div>
        <div className="container">
          <section>
            <Recorder 
              userSession={this.props.userSession} 
              signIn={(href) => this.props.signIn(href)}
              onNewMessage={(message) => this.onNewMessage(message)}
            ></Recorder>
          </section>
          <section>
            <div className="feed-message-container">
              {this.state.loading && <div className="loading-feed"><FontAwesomeIcon icon={faSpinner} className="fa-spin" />&nbsp;Loading...</div>}
              {!this.state.loading && this.state.messages && this.state.messages.map((message) => <MessageContent key={message._id} showSignIn={() => this.setState({showSignIn: true})} user={this.props.user} onDeleteMessage={(message) => this.onDeleteMessage(message)} message={new Message(message)} />)}
              {!this.state.loading && this.state.hasMoreMessages && <div className="loadmore"><span onClick={() => this.loadMoreMessages()}>{this.state.loadingMore && <FontAwesomeIcon icon={faSpinner} className="fa-spin" />}Load More</span></div>}
            </div>
          </section>
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
export default withRouter(Feed)
