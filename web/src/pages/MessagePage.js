import './MessagePage.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import Message from '../models/Message'
import SignIn from '../partials/SignIn'
import Recorder from '../partials/Recorder'
import { server_error } from '../util/sweetalert'
import Reaction from '../models/Reaction'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import MessageContent from '../partials/MessageContent'


class MessagePage extends Component {
  constructor(props){
    super(props)
    this.state = {
      message: null,
      loading: true,
      showSignIn: false
    }
  }

  componentWillMount() {
    if (!this.props.match.params.id) {
      this.props.history.push('/')
    } else {
      Message.findById(this.props.match.params.id, { decrypt: false }).then((message) =>
      {
        if (message && message.attrs) {
          Reaction.fetchList({messageId: message.attrs._id}, {decrypt: false}).then(reactions =>
            {
              if (reactions) {
                for (var i = 0; i < reactions.length; ++ i) {
                  message.attrs.reactions.push(reactions[i].attrs)
                }
              }
              this.setState({message: message.attrs, loading: false})
            }).catch((err) => server_error(err))
        } else {
          this.setState({loading: false})
        }
      }).catch((err) => server_error(err))
    }
  }

  onCloseSignIn(redirect) {
    this.setState({ showSignIn: false })
    if (redirect) {
      this.props.signIn(window.location.href)
    }
  }

  onDeleteMessage(message) {
    this.props.history.push('/')
  }

  render() {
    return (
      <div>
        <div className="container">
          <section>
            <div className="message-page-container">
            {this.state.loading && <div><FontAwesomeIcon icon={faSpinner} className="fa-spin" />&nbsp;Loading...</div>}
            {!this.state.loading && this.state.message && <MessageContent key={this.state.message._id} user={this.props.user} showSignIn={() => this.setState({showSignIn: true})} onDeleteMessage={(message) => this.onDeleteMessage(message)} message={new Message(this.state.message)} />}
            {!this.state.loading && !this.state.message && <div>Message not found :(</div>}
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
export default withRouter(MessagePage)
