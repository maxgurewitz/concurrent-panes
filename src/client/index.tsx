import 'react-virtualized/styles.css';
import {List, ListRowRenderer} from 'react-virtualized/dist/es/List';
import * as React from "react";
import * as ReactDOM from "react-dom";

interface Source {
  content: string[],
  changedScrollPosition: boolean
}

const FONT_SIZE = 16;

interface State {
  [task: string]: Source
}

function rowRendererFactory(source: Source): ListRowRenderer {
  const rowRenderer: ListRowRenderer = ({
    key,
    index,
    style
  }) => {
    return (
      <div key={ key } style={ style }>
        { index + source.content[index] }
      </div>
    );
  };

  return rowRenderer;
}

interface OnScroll {
  (args: {clientHeight: number, scrollTop: number, scrollHeight: number}): void
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
              previousState[task] = { content: [], changedScrollPosition: false };
            });
            return previousState;
          });
          break;

        case 'output':
          this.setState((previousState: State) => {
            const previousTask = previousState[data.task];
            previousTask.content.push(data.message);;
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

      const onScroll: OnScroll = ({scrollTop, scrollHeight, clientHeight}) => {
        this.setState(previousState => {
          previousState[task].changedScrollPosition = Math.abs(scrollTop - scrollHeight) > Math.abs(clientHeight + FONT_SIZE);
          return previousState;
        });
      };

      const scrollToIndexProp = source.changedScrollPosition ?
        {} :
        { scrollToIndex: source.content.length - 1 };

      return (
          <div key={i}>
            <List
              width={1000}
              height={50}
              rowHeight={FONT_SIZE}
              onScroll={onScroll}
              rowCount={source.content.length}
              rowRenderer={rowRendererFactory(source)}
              {...scrollToIndexProp}
            />
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
