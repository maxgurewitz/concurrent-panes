import * as React from "react";
import * as ReactDOM from "react-dom";

interface Source {}

interface State { sources: Source[] }

class App extends React.Component<undefined, State> {

  websocket: WebSocket;

  constructor() {
    super();

    console.log('loc1');
    this.websocket = new WebSocket('ws://localhost:3001');

    this.state = {
      sources: []
    };
  }

  render() {
    return <h1>hello world</h1>;
  }
}

ReactDOM.render(
  <App />,
  document.getElementById("js-app")
);
