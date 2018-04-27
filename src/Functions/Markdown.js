import React from "react";
import { Button, Form, FormGroup, Input, Label } from "reactstrap";
import { PropTypes } from "prop-types";
import { PromiseState } from "react-refetch";
import connect from "./API";
import { Gtag } from "../GA";

class MarkdownFunction extends React.Component {
  static propTypes = {
    convertFetch: PropTypes.instanceOf(PromiseState),
    convert: PropTypes.func.isRequired
  };
  constructor(props) {
    super(props);
    this.state = {
      from:
        "# this is an h1\n* bullet 1\n * bullet 2\n\n```echo 'some code'\n```\n"
    };
  }
  convert = () => {
    Gtag("event", "convert", {
      event_category: "functions.markdown",
      event_label: "markdown"
    });
    this.props.convert(this.state);
  };
  handleChange = e => {
    const deltaState = { [e.target.name]: e.target.value };
    this.setState(deltaState);
  };
  render() {
    const { convertFetch } = this.props;
    return (
      <div className="card">
        <div className="card-header">Function Markdown</div>
        <div className="card-body">
          <h5 className="card-title">Convert Markdown to HTML</h5>
          <p className="card-text">
            Enter your markdown text to view it as HTML
          </p>
          <Form>
            <div className="form-row">
              <FormGroup className="col-md-12">
                <Label for="from">Markdown</Label>
                <Input
                  style={{ minHeight: "10em" }}
                  value={this.state.from}
                  onChange={this.handleChange}
                  type="textarea"
                  name="from"
                />
              </FormGroup>
            </div>
            <div className="form-row">
              <div className="col-md-12">
                <Label>HTML</Label>
                <div
                  className="mb-2"
                  style={{
                    border: "1px solid rgb(223, 223, 223)",
                    borderRadius: "5px",
                    width: "100%",
                    minHeight: "10em"
                  }}
                >
                  {convertFetch &&
                    convertFetch.value && (
                      <div
                        dangerouslySetInnerHTML={{ __html: convertFetch.value }}
                      />
                    )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="col-12">
                <Button
                  type="button"
                  outline
                  color="primary"
                  className="btn-block"
                  disabled={convertFetch && convertFetch.pending}
                  onClick={this.convert}
                >
                  Convert
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    );
  }
}
export default connect(() => ({
  convert: state => ({
    convertFetch: {
      url: "/markdown",
      body: state.from
    }
  })
}))(MarkdownFunction);
