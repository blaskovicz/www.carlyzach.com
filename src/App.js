import React, { Component } from "react";
import {
  BrowserRouter as Router,
  //HashRouter as Router,
  Route,
  NavLink,
  Link,
  Switch,
  Redirect
} from "react-router-dom";
import FontAwesome from "react-fontawesome";
import "./App.css";

// routes
import Home from "./Home";
import Functions from "./Functions";

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <header>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
              <Link to="/" className="navbar-brand">
                CarlyZach
              </Link>
              <button
                className="navbar-toggler"
                type="button"
                data-toggle="collapse"
                data-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon" />
              </button>
              <div
                className="collapse navbar-collapse"
                id="navbarSupportedContent"
              >
                <ul className="navbar-nav mr-auto">
                  <li className="nav-item">
                    <NavLink exact className="nav-link" to="/">
                      Home
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink exact className="nav-link" to="/functions">
                      Functions
                    </NavLink>
                  </li>
                </ul>
              </div>
            </nav>
          </header>
          <main id="App" className="App container">
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/functions" component={Functions} />
              <Redirect to="/" />
            </Switch>
          </main>
          <footer className="footer">
            <div className="container">
              <span className="text-muted">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/blaskovicz"
                >
                  <FontAwesome name="github" className="pr-1" />
                  CarlyZach on Github
                </a>
              </span>
            </div>
          </footer>
        </div>
      </Router>
    );
  }
}

export default App;
