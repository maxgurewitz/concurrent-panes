import '../../node_modules/react-virtualized/styles.css';
import * as React from "react";
import * as ReactDOM from "react-dom";

interface Source {
  content: string
}

interface State {
  [task: string]: Source
}

class App extends React.Component<undefined, State> {

  constructor() {
    super();

    const websocket: WebSocket = new WebSocket('ws://localhost:3001');

    websocket.onmessage = event => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'init':
          this.setState((previousState: State) => {
            data.tasks.forEach((task: string) => {
              previousState[task] = { content: '' };
            });
            return previousState;
          });
          break;

        case 'output':
          this.setState((previousState: State) => {
            const previousTask = previousState[data.task];
            previousTask.content = previousTask.content + data.message;
            return previousState;
          });
          break;
      }
    }

    this.state = {};
  }

  render() {
    const panes = Object.keys(this.state).map((task, i) => {
      const source = this.state[task];
      return (
        <div key={i}>
          <div> { task } </div>
          <div>
            { source.content }
          </div>
        </div>
      );
    });

    return (
      <div>
        <div> concurrent-panes </div>
        <div>
          { panes }
        </div>
      </div>
    );
  }
}

const el = document.createElement("div");
el.id = 'app';

document.body.appendChild(el);

ReactDOM.render(
  <App />,
  el
);
