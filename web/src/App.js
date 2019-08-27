import './App.css'
import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import { UserSession } from 'blockstack'
import Feed from './pages/Feed'
import NavBar from './partials/NavBar'
import MessagePage from './pages/MessagePage'
import UserPage from './pages/UserPage'
import { appConfig, server_url } from './util/constants'
import { withRouter } from 'react-router-dom'
import { server_error } from './util/sweetalert'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import { configure, User, getConfig } from 'radiks'
import Footer from './partials/Footer'


class App extends Component {
  constructor() {
    super()
    var userSession = new UserSession({ appConfig })
    configure({
      apiServer: server_url,
      userSession: userSession
    })
    this.state = {
      user: null
    }
  }

  getUserSession() {
    const { userSession } = getConfig()
    return userSession
  }

  componentWillMount() {
    var userSession = this.getUserSession()
    if (!userSession.isUserSignedIn() && userSession.isSignInPending()) {
      var href = window.location.pathname
      userSession.handlePendingSignIn()
      .then((userData) => {
        if(!userData.username) {
          throw new Error('This app requires a username.')
        }
        this.props.history.push(!!href ? href : '/')
        User.createWithCurrentUser().then((user) => this.setUser(user)).catch((err) => server_error(err))
      }).catch((err) => server_error(err))
    } else if (userSession.isUserSignedIn() && !this.state.user) {
      var user = null
      if (window && window["userBlockstackData"] && window["userBlockstackData"].getUser) {
        user = window["userBlockstackData"].getUser()
      }
      if (user != null) {
        this.setUser(user)
      } else {
        this.setUser(User.currentUser())
      }
    }
  }

  setUser(user) {
    if (window && window["userBlockstackData"] && window["userBlockstackData"].setUser) {
      window["userBlockstackData"].setUser(user)
    }
    this.setState({user: user})
  }

  signIn(href) {
    var origin = window.location.origin
    var redirect = !!href ? href : origin
    redirect = redirect.replace("#","/")
    setTimeout(() => this.getUserSession().redirectToSignIn(redirect, origin + '/manifest.json', ['store_write', 'publish_data', 'email']), 0)
  }

  signOut() {
    this.getUserSession().signUserOut(window.location.origin)
    this.setUser(null)
  }

  render() {
    return (
      <main role="main">
        <NavBar 
          userSession={this.getUserSession()} 
          user={this.state.user}
          signOut={() => this.signOut()} 
          signIn={(href) => this.signIn(href)}
        />
        <div className="app-content">
        <Switch>
          <Route 
            path={`/privacy`} 
            render={ routeProps => <Privacy {...routeProps} /> }
          />
          <Route 
            path={`/terms`} 
            render={ routeProps => <Terms {...routeProps} /> }
          />
          <Route 
            path={`/message/:id`} 
            render={ routeProps => <MessagePage {...routeProps} 
              userSession={this.getUserSession()}
              user={this.state.user}
              signIn={(href) => this.signIn(href)} /> }
          />
          <Route 
            path={`/:username/:tab?`} 
            render={ routeProps => <UserPage {...routeProps} 
              userSession={this.getUserSession()}
              user={this.state.user}
              signIn={(href) => this.signIn(href)} /> }
          />
          <Route 
            path={`/`} 
            render={ routeProps => <Feed {...routeProps} 
              userSession={this.getUserSession()}
              user={this.state.user}
              signIn={(href) => this.signIn(href)} /> }
          />
        </Switch>
        </div>
        <Footer />
      </main>
    );
  }
}
export default withRouter(App)
