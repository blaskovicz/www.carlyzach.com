import React from "react";
import MonacoEditor from "react-monaco-editor";
import { Button, Input } from "reactstrap";
import { PropTypes } from "prop-types";
import { PromiseState } from "react-refetch";
import FontAwesome from "react-fontawesome";
import GitHub from "github-api";
import { withRouter } from "react-router-dom";
import connect from "./API";
import "./Playground.css";

class PlaygroundFunction extends React.Component {
  static options = {
    selectOnLineNumbers: true
  };
  static langToFunction = {
    go: "golang"
  };
  static starterEditor = "go";
  static starterCode = {
    go: `package main

import (
    "fmt"
)

func main() {
    fmt.Println("Hello, carlyzach playground")
}
`
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
    compile: PropTypes.func.isRequired,
    match: PropTypes.shape({
      params: PropTypes.shape({ id: PropTypes.string }),
      url: PropTypes.string.isRequired
    })
  };

  constructor(props) {
    super(props);
    this.updateWindowSize = this.updateWindowSize.bind(this);
    this.errorRanges = [];
    let editor = localStorage.getItem("editor");
    if (!editor || !this.constructor.langToFunction[editor]) {
      editor = this.constructor.starterEditor;
    } else {
      console.log("Loaded code from localStorage");
    }
    let code = localStorage.getItem("code");
    if (!code) {
      code = this.constructor.starterCode[editor];
    } else {
      console.log("Loaded editor from localStorage");
    }
    const func = this.constructor.langToFunction[editor];
    this.state = {
      token: null,
      width: 0,
      height: 0,
      bounds: null,
      events: null,
      errors: null,
      language: { editor, function: func },
      code
    };
    this.loadAuth();
  }

  loadGist = () => {
    const { match: { params: { id } } } = this.props;
    if (id === undefined) return;
    this.gh
      .getGist(id)
      .read()
      .then(g => this.handleGist(g))
      .catch(err => {
        console.warn("Failed initial load of gist:", err);
      });
  };

  setToken = token => {
    this.gh = new GitHub({ token });
    this.setState({ token });
  };

  loadAuth = () => {
    return fetch("/oauth2/token")
      .then(resp => {
        return resp.json();
      })
      .then(resp => {
        this.setToken(resp.access_token);
        this.loadGist();
      })
      .catch(err => {
        console.warn("Failed to load token:", err);
        this.setToken(null);
        this.loadGist();
      });
  };

  componentDidMount() {
    this.updateWindowSize();
    window.addEventListener("beforeunload", this.onUnload);
    window.addEventListener("resize", this.updateWindowSize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowSize);
    window.removeEventListener("beforeunload", this.onUnload);
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

  isDefaultCode = () => {
    const { code, language: { editor } } = this.state;
    return code === this.constructor.starterCode[editor];
  };

  onUnload = () => {
    const { code, language: { editor } } = this.state;
    if (!this.isDefaultCode()) {
      console.log("Saving code to localStorage");
      localStorage.setItem("code", code);
    } else {
      localStorage.removeItem("code");
    }
    if (editor !== this.constructor.starterEditor) {
      console.log("Saving editor to localStorage");
      localStorage.setItem("editor", editor);
    } else {
      localStorage.removeItem("editor");
    }
  };

  startLoginFlow = () => {
    const { match: { url } } = this.props;
    window.location = `https://www.carlyzach.com/oauth2/start?rd=${encodeURIComponent(
      url
    )}`;
  };

  handleGist = ({ data }) => {
    this.onUnload(); // save whatever we had

    if (!data || !data.files) return;
    let code = "";
    for (let info of Object.values(data.files)) {
      code += `// ${info.filename}\n${info.content}`;
    }
    if (code === "") return;
    this.setState({ code });
  };

  shareGist = () => {
    const { match: { url }, history } = this.props;
    let gist = this.gh.getGist();
    gist
      .create({
        public: false,
        description:
          "Code-share from https://www.carlyzach.com/functions/playground",
        files: {
          "prog.go": {
            content: this.state.code
          }
        }
      })
      .then(() => gist.read())
      .then(g => {
        this.handleGist(g);
        history.push(`${url}/${g.data.id}`); // playground -> playground/:id
      })
      .catch(err => {
        console.warn("Failed to load gist after share:", err);
      });
  };

  resetCode = () => {
    const { match: { url, params: { id } }, history } = this.props;
    this.decorateMonacoErrors([]);
    this.setState({
      events: null,
      errors: null,
      code: this.constructor.starterCode[this.state.language.editor]
    });
    if (id) {
      let urlParts = url.replace(/\/+$/, "").split("/");
      urlParts.pop();
      history.push(urlParts.join("/")); // playground/:id -> playground
    }
  };

  // https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-line-and-inline-decorations
  decorateMonacoErrors(errors) {
    // map all errors to all sub-error arrays, then unfurl
    const decorations = errors
      .map(e => this.lineHighlight(e))
      .filter(e => e !== null);
    const newRanges = [];
    for (let lineArray of decorations) {
      for (let line of lineArray) {
        newRanges.push({
          range: new this.monaco.Range(line, 1, line, 1),
          options: {
            isWholeLine: true,
            linesDecorationsClassName: "error-line"
          }
        });
      }
    }

    // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodel.html#deltadecorations
    this.errorRanges = this.editor.deltaDecorations(
      this.errorRanges,
      newRanges
    );
  }

  // one error may span multiple lines, so return lines in an array
  lineHighlight(error) {
    if (this.state.language.editor !== "go") return null;
    const regex = /prog.go:([0-9]+)/g;
    let r = regex.exec(error);
    const lines = [];
    while (r) {
      lines.push(+r[1]);
      r = regex.exec(error);
    }
    return lines.length === 0 ? null : lines;
  }

  editorDidMount = (editor, monaco) => {
    // for later use since we can't pass the component props directly
    if (!this.editor) this.editor = editor;
    if (!this.monaco) this.monaco = monaco;
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
      const errors = [fetchIs.value.Error].filter(e => e !== "" && e !== null);
      this.decorateMonacoErrors(errors);
      this.setState({
        events: null,
        code: fetchIs.value.Body === "" ? this.state.code : fetchIs.value.Body,
        errors
      });
    } else if (
      fetchIs &&
      fetchIs.rejected &&
      (!fetchWas || !fetchWas.rejected)
    ) {
      this.setState({
        events: null,
        errors: [fetchIs.reason.toString()].filter(e => e !== "" && e !== null)
      });
    } else if (fetchIs && fetchIs.pending && (!fetchWas || !fetchWas.pending)) {
      this.setState({ events: null, errors: null });
    }

    // compile changed, update code and errors
    fetchWas = this.props.compileFetch;
    fetchIs = nextProps.compileFetch;
    if (
      fetchIs &&
      fetchIs.fulfilled &&
      (!fetchWas || !fetchWas.fulfilled || fetchWas.value !== fetchIs.value)
    ) {
      const errors = [fetchIs.value.Errors].filter(e => e !== "" && e !== null);
      this.decorateMonacoErrors(errors);
      this.setState({
        events: fetchIs.value.Events,
        errors
      });
    } else if (
      fetchIs &&
      fetchIs.rejected &&
      (!fetchWas || !fetchWas.rejected)
    ) {
      this.setState({
        events: null,
        errors: [fetchIs.reason.toString()].filter(e => e !== "" && e !== null)
      });
    } else if (fetchIs && fetchIs.pending && (!fetchWas || !fetchWas.pending)) {
      this.setState({ events: null, errors: null });
    }
  }

  render() {
    const {
      code,
      events,
      language,
      errors,
      width,
      height,
      bounds,
      token
    } = this.state;
    const { compileFetch, formatFetch, match: { params: { id } } } = this.props;

    const codeIsDefault = this.isDefaultCode();

    const compiling = compileFetch && compileFetch.pending;
    const formatting = formatFetch && formatFetch.pending;
    const compiled = compileFetch && !compileFetch.pending;
    const formatted = formatFetch && !formatFetch.pending;

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
              className="mr-2"
              color="primary"
              disabled={compiling || formatting}
            >
              Format
            </Button>
            <Button
              type="button"
              onClick={this.resetCode}
              outline
              color="primary"
              disabled={compiling || formatting || codeIsDefault}
            >
              Reset
            </Button>
            {id && (
              <span className="ml-2">
                <a
                  className=""
                  target="_blank"
                  rel="noopener noreferer"
                  href={`https://gist.github.com/${id}`}
                >
                  <FontAwesome name="github" /> Gist {id}
                </a>
              </span>
            )}
            {!id &&
              token && (
                <Button
                  type="button"
                  onClick={this.shareGist}
                  outline
                  color="primary"
                  className="ml-2"
                  disabled={compiling || formatting || codeIsDefault}
                >
                  <FontAwesome name="github" /> Share
                </Button>
              )}
            {!id &&
              !token && (
                <Button
                  type="button"
                  onClick={this.startLoginFlow}
                  outline
                  color="primary"
                  className="ml-2"
                  disabled={compiling || formatting || codeIsDefault}
                >
                  <FontAwesome name="github" /> Login & Share
                </Button>
              )}
            {(compiling || formatting) && (
              <FontAwesome className="ml-2" name="spinner" spin />
            )}
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
              className="mb-2 output pl-2"
              style={{
                width: editorWidth
              }}
            >
              {errors &&
                errors.length !== 0 && (
                  <div>
                    {errors.map(e => (
                      <div className="error" key={e}>
                        {e}
                      </div>
                    ))}
                  </div>
                )}
              {events && (
                <div>
                  {events.map(e => (
                    <div
                      key={e.Message + e.Kind + e.Delay}
                      className={e.Kind === "stderr" ? "error" : undefined}
                    >
                      [{e.Kind}]{" "}
                      {e.Message !== "" ? e.Message : JSON.stringify(e)}
                    </div>
                  ))}
                </div>
              )}
              {(compiled || formatted) &&
                (!compiling && !formatting) && (
                  <div className="completed">
                    <FontAwesome name="angle-double-right" className="pr-1" />
                    Program exited.
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(
  connect(() => ({
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
  }))(PlaygroundFunction)
);
