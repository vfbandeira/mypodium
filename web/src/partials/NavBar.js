import './NavBar.css'
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router-dom'
import BlockstackManager from '../util/blockstackManager'
import { server_error } from '../util/sweetalert'
import SignIn from './SignIn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faUserCircle } from '@fortawesome/free-solid-svg-icons'
import { faMicrophone } from '@fortawesome/free-solid-svg-icons'

class NavBar extends Component {
  constructor(props){
    super(props)
		this.state = {
      person: null,
      showSignIn: false
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.userSession && this.props.userSession.isUserSignedIn() && this.state.person === null) {
		  this.componentWillMount()
		}
  }
  
  componentWillMount() {
    if (this.props.userSession && this.props.userSession.isUserSignedIn()) {
      BlockstackManager.getUserProfile(this.props.userSession.loadUserData().username).then((person) => 
      {
        this.setState({ person: person })
      }).catch((err) => server_error(err))
    }
  }

  onCloseSignIn(redirect) {
    this.setState({ showSignIn: false })
    if (redirect) {
      this.props.signIn(window.location.href)
    }
  }

  render() {
    var username = null
    var userImage = null
    if (this.props.userSession && this.props.userSession.isUserSignedIn()) {
      username = this.state.person && this.state.person.name ? this.state.person.name : this.props.userSession.loadUserData().username
      userImage = this.state.person && this.state.person.avatarUrl
    }
    return (
      <nav className="navbar navbar-expand-lg navbar-dark">
        {this.state.showSignIn && 
        <SignIn 
          userSession={this.props.userSession} 
          message={this.state.signinMessage}
          onHide={(redirect) => this.onCloseSignIn(redirect)}
        />} 
        <div className="container">
          <Link className="link-nav clickable" to={`/`}>
            HOME
          </Link>
          {username && 
          <a href={"/"+username} className="btn btn-light btn-rounded btn-record"><span>
            <FontAwesomeIcon icon={faMicrophone} />&nbsp;Record</span>
          </a>
          }
          <Link className="logo-link clickable d-none d-md-block" to={`/`}>
            <img src="/Logo1.png" alt="MyPodium" />
          </Link>
          <img className="top-img d-none d-md-block" src="/Img1.png" alt="" />
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarResponsive">
            <ul className="navbar-nav ml-auto">
              {username &&
                <li className="nav-item dropdown">                  
                  <a className="dropdown-toggle nav-link clickable" id="navbarProfile" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <div className="user-nav-container">
                      <div className="user-nav-wrap">
                        {userImage ? <img src={userImage} className="user-img-nav" alt={username} /> : <FontAwesomeIcon icon={faUserCircle} className="mr-1" /> }
                        <span>{username}</span>
                      </div>
                    </div>
                  </a>
                  <div className="dropdown-menu" aria-labelledby="navbarProfile">
                    <a className="dropdown-item clickable" href={"/"+username}>PROFILE</a>
                    <a className="dropdown-item clickable" onClick={() => this.props.signOut()}>SIGN OUT</a>
                  </div>
                </li>
              }
              {!username && 
                <li className="nav-item mx-lg-2">
                  <div className="nav-link link-nav underline clickable" onClick={() => this.setState({ signinMessage: "Log in to get started.", showSignIn: true })}>SIGN IN</div>
                </li>
              }
            </ul>
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link twitter-nav clickable" rel="noopener noreferrer" href="https://twitter.com/My_Podium" target="_blank"><FontAwesomeIcon icon={faTwitter} title="Follow on Twitter" /></a>
              </li>
            </ul>
          </div>
        </div>
      </nav>)   
  }
}
export default withRouter(NavBar)
