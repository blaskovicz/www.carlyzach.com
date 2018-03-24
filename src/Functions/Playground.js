import React from "react";
import MonacoEditor from "react-monaco-editor";
import { Button, Input, Alert } from "reactstrap";
import { PropTypes } from "prop-types";
import { PromiseState } from "react-refetch";
import connect from "./API";

class PlaygroundFunction extends React.Component {
  static options = {
    selectOnLineNumbers: true
  };

  static requireConfig = {
    url:
      "https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.1/require.min.js",
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.11.1/min/vs"
    }
  };

  static propTypes = {
    formatFetch: PropTypes.instanceOf(PromiseState),
    format: PropTypes.func.isRequired,
    compileFetch: PropTypes.instanceOf(PromiseState),
    compile: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.updateWindowSize = this.updateWindowSize.bind(this);

    this.state = {
      width: 0,
      height: 0,
      bounds: null,
      errors: [],
      language: { editor: "go", function: "golang" },
      code: `package main

import (
    "fmt"
)

func main() {
    fmt.Println("Hello, carlyzach playground")
}            
`
    };
  }

  componentDidMount() {
    this.updateWindowSize();
    window.addEventListener("resize", this.updateWindowSize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowSize);
  }

  updateWindowSize() {
    if (
      window.innerHeight === this.state.height &&
      window.innerWidth === this.state.width
    )
      return;
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
      bounds: this.getBounds()
    });
  }

  editorDidMount = (editor, monaco) => {
    editor.focus();
  };

  onChange = (code, e) => {
    this.setState({ code });
  };

  formatCode = () => {
    this.setState({ errors: [] });
    this.props.format(this.state);
  };

  runCode = () => {
    this.setState({ errors: [] });
    this.props.compile(this.state);
  };
  static noPx(px) {
    return +px.replace("px", "");
  }
  getBounds() {
    const appElement = document.getElementById("App");
    if (!appElement) return null;
    const s = window.getComputedStyle(appElement);
    return [
      this.constructor.noPx(s.paddingTop) + this.constructor.noPx(s.marginTop), // top,
      this.constructor.noPx(s.paddingRight) +
        this.constructor.noPx(s.marginRight), // right,
      this.constructor.noPx(s.paddingBottom) +
        this.constructor.noPx(s.marginBottom), // bottom,
      this.constructor.noPx(s.paddingLeft) + this.constructor.noPx(s.marginLeft) // left,
    ];
  }

  componentWillReceiveProps(nextProps) {
    // format changed, update code and errors
    let fetchWas = this.props.formatFetch;
    let fetchIs = nextProps.formatFetch;
    if (
      fetchIs &&
      fetchIs.fulfilled &&
      (!fetchWas || !fetchWas.fulfilled || fetchWas.value !== fetchIs.value)
    ) {
      this.setState({
        code: fetchIs.value.Body === "" ? this.state.code : fetchIs.value.Body,
        errors: [fetchIs.value.Error].filter(e => e !== "" && e !== null)
      });
    }

    // compile changed, update code and errors
    fetchWas = this.props.compileFetch;
    fetchIs = nextProps.compileFetch;
    if (fetchIs && fetchIs.fulfilled && (!fetchWas || !fetchWas.fulfilled)) {
      this.setState({
        errors: [fetchIs.value.Errors].filter(e => e !== "" && e !== null)
      });
    }
  }

  render() {
    const { code, language, errors, width, height, bounds } = this.state;
    const { compileFetch, formatFetch } = this.props;

    const compiling = compileFetch && compileFetch.pending;
    const formatting = formatFetch && formatFetch.pending;

    let editorWidth = width;
    let editorHeight = height / 2;
    // 0 top, 1 right, 2 bottom, 3 left
    if (bounds !== null) {
      editorWidth = editorWidth - bounds[1] - bounds[3];
    }

    return (
      <div>
        <div className="row mb-1">
          <div className="col-3">
            <Input type="select" disabled>
              <option>Golang</option>
            </Input>
          </div>
          <div className="col-9">
            <Button
              type="button"
              onClick={this.runCode}
              outline
              color="primary"
              className="mr-2"
              disabled={compiling || formatting}
            >
              Run
            </Button>
            <Button
              type="button"
              onClick={this.formatCode}
              outline
              color="primary"
              disabled={compiling || formatting}
            >
              Format
            </Button>
          </div>
        </div>
        <div className="row">
          <div className="col-12 mx-auto" style={{ height: editorHeight }}>
            <MonacoEditor
              className="mx-auto"
              height={editorHeight}
              width={editorWidth}
              language={language.editor}
              theme="vs-dark"
              value={code}
              options={this.constructor.options}
              onChange={this.onChange}
              editorDidMount={this.editorDidMount}
              requireConfig={this.constructor.requireConfig}
            />
          </div>
        </div>
        <div className="row mt-1">
          <div className="col-12 mx-auto">
            <div
              className="mb-2"
              style={{
                whiteSpace: "pre",
                wordBreak: "break-all",
                border: "1px solid rgb(223, 223, 223)",
                borderRadius: "5px",
                minHeight: "10em",
                width: editorWidth,
                fontFamily: "monospace"
              }}
            >
              {compileFetch &&
                compileFetch.value &&
                compileFetch.value.Events &&
                compileFetch.value.Events.map(e => (
                  <div
                    key={e.Message + e.Kind + e.Delay}
                    style={{ color: e.Kind === "stderr" && "#d60404" }}
                  >
                    [{e.Kind}]{" "}
                    {e.Message !== "" ? e.Message : JSON.stringify(e)}
                  </div>
                ))}
            </div>
          </div>
        </div>
        {errors &&
          errors.length > 0 && (
            <div className="row mt-2">
              <div className="col-md-12">
                <Alert color="danger">
                  <ul>{errors.map(e => <li key={e}>{e}</li>)}</ul>
                </Alert>
              </div>
            </div>
          )}
        {formatFetch &&
          formatFetch.rejected && (
            <div className="row mt-2">
              <div className="col-md-12">
                <Alert color="danger">{formatFetch.reason.toString()}</Alert>
              </div>
            </div>
          )}
        {compileFetch &&
          compileFetch.rejected && (
            <div className="row mt-2">
              <div className="col-md-12">
                <Alert color="danger">{compileFetch.reason.toString()}</Alert>
              </div>
            </div>
          )}
      </div>
    );
  }
}

export default connect(() => ({
  compile: state => ({
    compileFetch: {
      url: `/playground-${state.language.function}`,
      body: { Mode: "compile", Body: state.code }
    }
  }),
  format: state => ({
    formatFetch: {
      url: `/playground-${state.language.function}`,
      body: { Mode: "format", Body: state.code, Imports: "true" }
    }
  })
}))(PlaygroundFunction);
