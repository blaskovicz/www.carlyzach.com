import React from "react";
import Markdown from "./Markdown";
import RmbToUsd from "./RmbToUsd";
import { Switch, Route, Link } from "react-router-dom";
import PropTypes from "prop-types";
const Functions = ({ match: { url } }) => {
  return (
    <div className="row">
      <div className="col">
        <div className="row">
          <Switch>
            <Route path={`${url}`} exact>
              <h1>Functions</h1>
            </Route>
            <Route>
              <h1>
                <Link to={`${url}`}>{"←"} Functions</Link>
              </h1>
            </Route>
          </Switch>
        </div>
        <div className="row">
          <div className="col-12">
            <Switch>
              <Route path={`${url}/markdown`} exact component={Markdown} />
              <Route path={`${url}/rmb-to-usd`} exact component={RmbToUsd} />
              <Route path={`${url}`} exact>
                <ul className="list-group">
                  <Link
                    to={`${url}/rmb-to-usd`}
                    className="list-group-item list-group-item-action"
                  >
                    Convert RMB to USD
                  </Link>
                  <Link
                    to={`${url}/markdown`}
                    className="list-group-item list-group-item-action"
                  >
                    Render Markdown as HTML
                  </Link>
                </ul>
              </Route>
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
};
Functions.propTypes = {
  match: PropTypes.shape({
    url: PropTypes.string.isRequired
  }).isRequired
};
export default Functions;
