import './Footer.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitter } from '@fortawesome/free-brands-svg-icons'


class Footer extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
    <footer className="text-muted">
        <div className="container footer-container">
          <div className="row">
            <div className="col-3">
              <a className="clickable footer-link mr-1" href="/terms" target="_self">Terms</a>
              <span className="vr"></span>
              <a className="clickable footer-link ml-1" href="/privacy" target="_self">Privacy</a>
            </div>
            <div className="col-6 footer-copyright"><p>My Podium - 2019</p></div>
            <div className="col-3">
              <a className="clickable footer-twitter" href="https://twitter.com/My_Podium" target="_blank" rel="noopener noreferrer"> 
                <FontAwesomeIcon icon={faTwitter} />
              </a>
            </div>
          </div>
        </div>
    </footer>)
  }
}
export default withRouter(Footer)