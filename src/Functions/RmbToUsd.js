import React from "react";
import { Button, Form, FormGroup, Input, Label } from "reactstrap";
import { PropTypes } from "prop-types";
import { PromiseState } from "react-refetch";
import connect from "./API";
import { Gtag } from "../GA";

class RmbToUsdFunction extends React.Component {
  static propTypes = {
    convertFetch: PropTypes.instanceOf(PromiseState),
    convert: PropTypes.func.isRequired
  };
  static conversions = ["USD", "RMB"];
  constructor(props) {
    super(props);
    this.state = {
      from: this.constructor.conversions[0],
      to: this.constructor.conversions[1],
      ammount: 1
    };
  }
  convert = () => {
    Gtag("event", "convert", {
      event_category: "functions.rmb-to-usd",
      event_label: this.state.from
    });
    this.props.convert(this.state);
  };
  handleChange = e => {
    const deltaState = { [e.target.name]: e.target.value };
    if (e.target.type === "number" && e.target.value < 1) return;
    else if (e.target.name === "from") {
      // grab other choice to update second select box
      deltaState.to = this.constructor.conversions.find(
        v => v !== e.target.value
      );
    }
    this.setState(deltaState);
  };
  render() {
    const { convertFetch } = this.props;
    return (
      <div className="card">
        <div className="card-header">Function RMB to USD</div>
        <div className="card-body">
          <h5 className="card-title">
            Convert RMB (Renminbi, aka CNY, or Chinese Yuan) to USD (United
            States Dollars)
          </h5>
          <p className="card-text">
            Try making some selections and then pressing 'convert' below.
          </p>
          <Form>
            <div className="form-row">
              <FormGroup className="col-md-6">
                <Label for="from">From</Label>
                <Input
                  value={this.state.from}
                  onChange={this.handleChange}
                  type="select"
                  name="from"
                >
                  {this.constructor.conversions.map(c => (
                    <option value={c} key={c}>
                      {c}
                    </option>
                  ))}
                </Input>
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="to">To</Label>
                <Input type="select" name="to" value={this.state.to} disabled>
                  {this.constructor.conversions.map(c => (
                    <option value={c} key={c}>
                      {c}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </div>
            <div className="form-row">
              <FormGroup className="col-md-6">
                <Label for="ammount">Ammount</Label>
                <Input
                  onChange={this.handleChange}
                  type="number"
                  name="ammount"
                  value={this.state.ammount}
                />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="value">Value</Label>
                <Input
                  valid={convertFetch && convertFetch.fulfilled}
                  type="number"
                  name="ammount"
                  disabled
                  value={
                    (convertFetch &&
                      convertFetch.value &&
                      convertFetch.value.value) ||
                    ""
                  }
                />
              </FormGroup>
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
      url: "/rmb-to-usd",
      body: { to: state.to, ammount: state.ammount }
    }
  })
}))(RmbToUsdFunction);
