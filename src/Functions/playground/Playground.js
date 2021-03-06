import React from "react";
import MonacoEditor from "react-monaco-editor";
import { Button, Input } from "reactstrap";
import { PropTypes } from "prop-types";
import { PromiseState } from "react-refetch";
import FontAwesome from "react-fontawesome";
import GitHub from "github-api";
import { withRouter } from "react-router-dom";
import connect from "../API";
import { Gtag } from "../../GA";
import { parse } from "querystring";
import "./Playground.css";
import { starterCode } from "./starter-code";

class PlaygroundFunction extends React.Component {
  static options = {
    selectOnLineNumbers: true
  };
  static langToFunction = {
    go: "golang",
    javascript: "nodejs",
    typescript: "nodejs"
  };
  static starterEditor = "javascript";

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
    }),
    location: PropTypes.shape({
      search: PropTypes.string.isRequired
    }),
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired
  };

  constructor(props) {
    super(props);
    const {
      match: {
        params: { id }
      },
      history
    } = props;
    this.updateWindowSize = this.updateWindowSize.bind(this);
    this.errorRanges = [];
    let editor = this.param("language");
    if (!editor || !this.constructor.langToFunction[editor]) {
      editor = localStorage.getItem("editor");
      if (!editor || !this.constructor.langToFunction[editor]) {
        editor = this.constructor.starterEditor;
        console.log(`Editor set to default ${editor}`);
      } else {
        console.log(`Loaded editor ${editor} from localStorage`);
      }
    } else {
      console.log(`Loaded editor ${editor} from queryParams`);
    }

    if (this.param("language") !== editor) {
      history.push(`?language=${editor}`); // ?language=go
    }

    let code = localStorage.getItem("code");
    if (!code || id) {
      code = starterCode[editor];
    } else {
      console.log("Loaded code from localStorage");
      Gtag("event", "load", {
        event_category: "functions.playground",
        event_label: "code"
      });
    }
    const func = this.constructor.langToFunction[editor];
    this.state = {
      token: null,
      width: 0,
      height: 0,
      offsetLeft: 0,
      events: null,
      errors: null,
      gistError: null,
      gist: null,
      currentUser: null,
      gists: [],
      language: { editor, function: func },
      code
    };

    // cascading load of gist if in id
    this.loadAuth();
  }

  param = param => {
    let {
      location: { search }
    } = this.props;
    if (search && search[0] === "?") {
      search = search.substring(1);
    }
    return parse(search)[param];
  };

  loadRelatedGists = () => {
    this.gh
      .getUser()
      .listGists()
      .then(g => {
        Gtag("event", "load", {
          event_category: "functions.playground",
          event_label: "related-gists"
        });
        this.handleGistList(g);
      })
      .catch(err => {
        console.warn("Failed load of related gists:", err);
        Gtag("event", "exception", {
          description: err,
          fatal: false
        });
      });
  };

  loadGist = e => {
    const {
      match: {
        params: { id }
      },
      history
    } = this.props;
    const {
      language: { editor }
    } = this.state;
    let gistID;
    if (e === undefined || e.target.value === undefined) {
      if (id === undefined) return;
      gistID = id;
    } else {
      gistID = e.target.value;
      if (gistID === "") {
        // de-selected the gist, so reset code back to what it was
        this.clearGist();
        const code = localStorage.getItem("code");
        if (code) {
          this.setState({ code });
        }
        return;
      }
    }
    this.setState({
      events: null,
      errors: null,
      gist: null,
      gistError: null
    });
    this.gh
      .getGist(gistID)
      .read()
      .then(g => this.handleGist(g))
      .then(() => {
        Gtag("event", "load", {
          event_category: "functions.playground",
          event_label: `gist/${gistID}`
        });
        const newPath = `/functions/playground/${gistID}`;
        if (history.location.pathname.endsWith(newPath)) return;
        history.push(`${newPath}?language=${editor}`); // ... -> playground/:id?language=go
      })
      .catch(err => {
        this.setState({ gistError: err });
        console.warn(`Failed load of gist ${gistID}:`, err);
        Gtag("event", "exception", {
          description: err,
          fatal: false
        });
      });
  };

  loadUser = () => {
    this.gh
      .getUser()
      .getProfile()
      .then(u => {
        Gtag("event", "load", {
          event_category: "functions.playground",
          event_label: `user/${u.login}`
        });
        this.handleUser(u);
      })
      .catch(err => {
        console.warn(`Failed load of user:`, err);
        Gtag("event", "exception", {
          description: err,
          fatal: false
        });
      });
  };

  handleUser = ({ data }) => {
    this.setState({ currentUser: data.login });
  };

  setToken = token => {
    if (!token) token = null;
    this.gh = new GitHub({ token });
    this.setState({ token });
  };

  loadAuth = () => {
    return (process.env.REACT_APP_ACCESS_TOKEN
      ? new Promise((resolve, reject) => {
          console.debug(
            `Using access_token ${process.env.REACT_APP_ACCESS_TOKEN}`
          );
          return resolve({ access_token: process.env.REACT_APP_ACCESS_TOKEN });
        })
      : fetch("/oauth2/token", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Cache: "no-cache"
          },
          credentials: "same-origin"
        }).then(resp => {
          return resp.json();
        })
    )
      .then(resp => {
        Gtag("event", "load", {
          event_category: "functions.playground",
          event_label: `oauth-token`
        });
        this.setToken(resp.access_token);
        this.loadUser();
        this.loadGist();
        this.loadRelatedGists();
      })
      .catch(err => {
        console.warn("Failed to load token:", err);
        this.setToken(null);
        this.loadGist();
        Gtag("event", "exception", {
          description: err,
          fatal: false
        });
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
    const appElem = document.getElementById("App");
    if (appElem === null) return;
    const { paddingLeft } = window.getComputedStyle(appElem) || {};
    const { width } = appElem.getBoundingClientRect();
    const height = window.innerHeight;
    if (
      height === this.state.height &&
      width === this.state.width &&
      paddingLeft === this.state.offsetLeft
    )
      return;
    this.setState({
      width,
      height,
      offsetLeft: paddingLeft
    });
  }

  isDefaultCode = () => {
    const {
      code,
      language: { editor }
    } = this.state;
    return code === starterCode[editor];
  };

  localSave = () => {
    const {
      code,
      language: { editor }
    } = this.state;
    if (!this.isDefaultCode()) {
      console.log("Saving code to localStorage");
      Gtag("event", "save", {
        event_category: "functions.playground",
        event_label: `code`
      });
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
  onUnload = () => {
    const {
      match: {
        params: { id }
      }
    } = this.props;

    // if we have a gist, we're using remote saves.
    // local saves are reserved for no gist.
    if (id) return;
    this.localSave();
  };

  startLoginFlow = () => {
    const {
      match: { url }
    } = this.props;
    window.location = `https://www.carlyzach.com/oauth2/start?rd=${encodeURIComponent(
      url
    )}`;
  };

  handleGistList = ({ data }) => {
    this.setState({ gists: data });
  };

  handleGist = ({ data }) => {
    this.onUnload();
    this.annotateGist(data);
    if (!data || !data.files) return;
    let code = "";
    for (let info of Object.values(data.files)) {
      const filePrefix = `// file=${info.filename}\n`;
      if (!info.content.startsWith(filePrefix)) {
        code += filePrefix;
      }
      code += info.content;
    }
    if (code === "") return;
    this.setState({ code, gist: data });
  };

  editorPrefix() {
    switch (this.state.language.editor) {
      case "go":
        return "go";
      case "javascript":
        return "js";
      case "typescript":
        return "ts";
      default:
        return "txt";
    }
  }

  updateGist = () => {
    const { gist, code } = this.state;
    this.setState({ gistError: null });
    // TODO allow saving non-owned gists via forking

    // parse file names from comments
    const filePrefixRe = RegExp("// file=(.+)");
    const files = {};
    for (let fileName of Object.keys(gist.files)) {
      files[fileName] = null;
    }
    const lines = code.split("\n");
    let fileName = `prog.${this.editorPrefix()}`;
    for (let line of lines) {
      let [, lFileName] = line.match(filePrefixRe) || [];
      if (lFileName) {
        fileName = lFileName;
        continue;
      }
      if (!files[fileName]) {
        files[fileName] = { content: "" };
      }
      files[fileName].content += line + "\n";
    }

    let anyChanges = false;
    for (let fileName of Object.keys(files)) {
      if (files[fileName] === null) continue;
      // trim newlines
      files[fileName].content = files[fileName].content.trim() + "\n";
      if (
        gist.files[fileName] &&
        gist.files[fileName].content === files[fileName].content
      ) {
        continue;
      }
      anyChanges = true;
    }

    // deleted or added a file
    if (!anyChanges) {
      if (Object.keys(files).length !== Object.keys(gist.files).length) {
        anyChanges = true;
      }
    }

    if (!anyChanges) return;

    this.gh
      .getGist(gist.id)
      .update({ files })
      .then(g => {
        Gtag("event", "update", {
          event_category: "functions.playground",
          event_label: `gist/${gist.id}`
        });
        this.handleGist(g);
      })
      .catch(err => {
        this.setState({ gistError: err });
        console.warn("Failed to update gist:", err);
        Gtag("event", "exception", {
          description: err,
          fatal: false
        });
      });
  };

  annotateGist = data => {
    if (!this.gh || this.state.token === null || !data || !data.id) return;
    const {
      language: { editor }
    } = this.state;
    const playgroundLink = `https://www.carlyzach.com/functions/playground/${
      data.id
    }?language=${editor}`;
    const commentBody = `**[:computer: Edit](${playgroundLink})** or **[:play_or_pause_button: run](${playgroundLink})** this Gist on the **[www.CarlyZach.com code playground :computer:](${playgroundLink})**`;
    const gistID = data.id;
    const gist = this.gh.getGist(gistID);
    gist
      .listComments()
      .then(({ data }) => {
        for (let comment of data) {
          if (comment.body.includes(playgroundLink)) {
            return;
          }
        }
        return gist.createComment(commentBody);
      })
      .then(({ data } = { data: null }) => {
        if (!data) return;
        console.log(`Successfully annotated gist ${gistID}:`, data);
      })
      .catch(err => {
        console.warn(`Failed to annotate gist ${gistID}:`, err);
        Gtag("event", "exception", {
          description: err,
          fatal: false
        });
      });
  };

  shareGist = () => {
    const {
      match: { url },
      history
    } = this.props;
    const {
      language: { editor },
      code
    } = this.state;
    let gist = this.gh.getGist();
    this.setState({ gistError: null });
    gist
      .create({
        public: false,
        description: `:writing_hand: Created on the www.CarlyZach.com code playground :computer:`,
        files: {
          [`prog.${this.editorPrefix()}`]: {
            content: code
          }
        }
      })
      .then(({ data }) => {
        console.log(`Successfully created gist:`, data);
        return gist.read();
      })
      .then(g => {
        Gtag("event", "create", {
          event_category: "functions.playground",
          event_label: `gist/${g.data.id}`
        });
        this.handleGist(g);
        history.push(`${url}/${g.data.id}?language=${editor}`); // playground -> playground/:id
      })
      .catch(err => {
        this.setState({ gistError: err });
        console.warn("Failed to load gist after share:", err);
        Gtag("event", "exception", {
          description: err,
          fatal: false
        });
      });
  };

  resetCode = () => {
    Gtag("event", "reset", {
      event_category: "functions.playground",
      event_label: this.state.language.function
    });
    const {
      match: {
        params: { id }
      }
    } = this.props;
    this.decorateMonacoErrors([]);
    if (id) {
      this.loadGist();
    } else {
      this.clearGist();
    }
  };

  clearGist = () => {
    const {
      match: { url },
      history
    } = this.props;
    const {
      language: { editor }
    } = this.state;
    Gtag("event", "clear", {
      event_category: "functions.playground",
      event_label: this.state.language.function
    });
    this.setState({
      code: starterCode[editor],
      events: null,
      errors: null,
      gistError: null,
      gist: null
    });
    if (history.location.pathname.endsWith("/playground")) return;
    let urlParts = url.replace(/\/+$/, "").split("/");
    urlParts.pop();
    history.push(`${urlParts.join("/")}?language=${editor}`); // playground/:id -> playground
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
    const lines = [];
    switch (this.state.language.editor) {
      case "go":
        const regex = /prog.go:([0-9]+)/g;
        let r = regex.exec(error);
        while (r) {
          lines.push(+r[1]);
          r = regex.exec(error);
        }
        break;
      default:
        if (error) {
          lines.push(1);
        }
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

  setLanguage = e => {
    const { history } = this.props;
    const editor = e.target.value;
    const newState = {
      language: { editor, function: this.constructor.langToFunction[editor] }
    };
    if (this.isDefaultCode()) {
      newState.code = starterCode[editor];
    }
    this.setState(newState);
    history.push(`?language=${editor}`); // ?language=go
  };

  formatCode = () => {
    Gtag("event", "format", {
      event_category: "functions.playground",
      event_label: this.state.language.function
    });
    this.setState({ errors: [] });
    this.props.format(this.state);
  };

  runCode = () => {
    Gtag("event", "compile", {
      event_category: "functions.playground",
      event_label: this.state.language.function
    });
    this.setState({ errors: [] });
    this.props.compile(this.state);
  };

  componentWillReceiveProps(nextProps) {
    // TODO reload gist if props.match.id changes (eg: back was pressed)

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
      token,
      gists,
      offsetLeft,
      gistError,
      gist,
      currentUser
    } = this.state;
    const {
      compileFetch,
      formatFetch,
      match: {
        params: { id }
      }
    } = this.props;

    const codeIsDefault = this.isDefaultCode();

    const compiling = compileFetch && compileFetch.pending;
    const formatting = formatFetch && formatFetch.pending;
    const compiled = compileFetch && !compileFetch.pending;
    const formatted = formatFetch && !formatFetch.pending;

    const isGistOwner = gist !== null && gist.owner.login === currentUser;

    const editorWidth = width;
    const editorHeight = height * 0.5;

    return (
      <div style={{ left: `-${offsetLeft}`, position: "relative" }}>
        <div className="row mb-1">
          <div className="col-2">
            <Input
              type="select"
              style={{ paddingTop: "1px" }}
              onChange={this.setLanguage}
              value={language.editor}
            >
              <option value="go">Golang 1.10</option>
              <option value="javascript">NodeJS 10</option>
              <option value="typescript">Typescript 3 and NodeJS 10</option>
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
                  className={`btn ${
                    gistError ? "btn-danger" : "btn-outline-primary"
                  }`}
                  target="_blank"
                  title={gistError ? gistError.toString() : ""}
                  rel="noopener noreferer"
                  href={`https://gist.github.com/${id}`}
                >
                  <FontAwesome name="github" /> Gist{" "}
                  {gistError
                    ? "Error"
                    : String(id).substring(0, 6) +
                      (gist ? `, rev ${gist.history.length}` : "")}
                </a>
              </span>
            )}
            {!id &&
              token != null && (
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
            {id &&
              token != null &&
              isGistOwner && (
                <Button
                  type="button"
                  onClick={this.updateGist}
                  outline
                  color="primary"
                  className="ml-2"
                  disabled={compiling || formatting || codeIsDefault}
                >
                  <FontAwesome name="github" /> Save
                </Button>
              )}
            {token != null && (
              <div style={{ display: "inline-block" }} className="ml-2">
                <Input
                  onChange={this.loadGist}
                  type="select"
                  style={{ paddingTop: "1px" }}
                  value={id}
                >
                  <option value={""}>-- select gist to load --</option>
                  {!isGistOwner &&
                    gist !== null && (
                      <option
                        key={gist.id}
                        value={gist.id}
                        title={gist.description}
                        disabled
                      >
                        {(gist.description.length > 20
                          ? gist.description.substring(0, 20) + "..."
                          : gist.description) + ` (by ${gist.owner.login})`}
                      </option>
                    )}
                  {gists.map(g => (
                    <option
                      key={g.id}
                      value={g.id}
                      title={g.description}
                      disabled={id && String(id) === String(g.id)}
                    >
                      {g.description.length > 20
                        ? g.description.substring(0, 20) + "..."
                        : g.description}
                    </option>
                  ))}
                </Input>
              </div>
            )}
            {token == null && (
              <Button
                type="button"
                onClick={this.startLoginFlow}
                outline
                color="primary"
                className="ml-2"
                disabled={compiling || formatting}
              >
                <FontAwesome name="github" /> Login
                {!id && " to share"}
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
                    {errors.map((e, i) => (
                      <div className="error" key={i}>
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
        body: {
          Mode: "compile",
          Body: state.code,
          Language: state.language.editor === "typescript" ? "ts" : undefined
        }
      }
    }),
    format: state => ({
      formatFetch: {
        url: `/playground-${state.language.function}`,
        body: {
          Mode: "format",
          Body: state.code,
          Imports: "true",
          Language: state.language.editor === "typescript" ? "ts" : undefined
        }
      }
    })
  }))(PlaygroundFunction)
);
