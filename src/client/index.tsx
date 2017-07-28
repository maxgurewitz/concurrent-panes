import * as React from "react";
import * as ReactDOM from "react-dom";


interface Source {}

interface State { sources: Source[] }

class App extends React.Component<undefined, State> {
    constructor() {
      super();

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
