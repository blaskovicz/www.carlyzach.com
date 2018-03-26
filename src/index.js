import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "jquery/dist/jquery.slim.js";
import "popper.js/dist/umd/popper.js";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import "font-awesome/css/font-awesome.css";
import App from "./App";
import { unregister } from "./registerServiceWorker";

ReactDOM.render(<App />, document.getElementById("root"));
unregister(); // TODO register() seems buggy, make sure nginx conf is correct
