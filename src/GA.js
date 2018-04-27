import React from "react";
import { withRouter } from "react-router-dom";

/* Gtag('event', 'compile', {event_category: 'functions.playground', label: 'golang'}) */
export const Gtag = (...args) => {
  if (typeof window.gtag !== "function") {
    console.log("skipping gtag");
    return;
  }
  window.gtag(...args);
};

class GoogleAnalytics extends React.Component {
  componentWillUpdate({ location, history }) {
    if (location.pathname === this.props.location.pathname) {
      // don't log identical link clicks (nav links likely)
      return;
    }

    if (history.action !== "PUSH") {
      return;
    }
    Gtag("config", window.GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname
    });
  }

  render() {
    return null;
  }
}

export default withRouter(GoogleAnalytics);
