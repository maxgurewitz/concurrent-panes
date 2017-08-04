import 'react-virtualized/styles.css';
import 'react-tabs/style/react-tabs.css';
import './styles.css';
import {List, ListRowRenderer} from 'react-virtualized/dist/es/List';
import {AutoSizer} from 'react-virtualized/dist/es/AutoSizer';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import * as React from "react";
import * as ReactDOM from "react-dom";

interface Source {
  content: string[],
  changedScrollPosition: boolean
}

const FONT_SIZE = 16;

interface State {
  sources: {
    [task: string]: Source
  },
  tabIndex: number;
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
              previousState.sources[task] = { content: [], changedScrollPosition: false };
            });
            return previousState;
          });
          break;

        case 'output':
          this.setState((previousState: State) => {
            const previousTask = previousState.sources[data.task];
            previousTask.content.push(data.message);;
            return previousState;
          });
          break;
      }
    }

    this.state = {
      sources: {},
      tabIndex: 0
    };
  }

  onTabSelect(tabIndex: number) {
    this.setState(previousState => {
      previousState.tabIndex = tabIndex;
      return previousState;
    });
  }

  render() {
    const tabPanels = Object.keys(this.state.sources).map((task, i) => {
      const source = this.state.sources[task];

      const onScroll: OnScroll = ({scrollTop, scrollHeight, clientHeight}) => {
        this.setState(previousState => {
          const changedScrollPosition = Math.abs(scrollTop - scrollHeight) > Math.abs(clientHeight + FONT_SIZE);
          previousState.sources[task].changedScrollPosition = changedScrollPosition;
          return previousState;
        });
      };

      const scrollToIndexProp = !source.changedScrollPosition ?
        { scrollToIndex: source.content.length - 1 } :
        {};

      let className = 'tab-panel-container';

      if (i === this.state.tabIndex) {
        className = className + ' selected';
      }

      return (
          <div key={i} className={className}>
            <TabPanel className="tab-panel">
              <AutoSizer>
                {({ height, width }) =>
                  (<List
                    width={width}
                    height={height}
                    rowHeight={FONT_SIZE}
                    onScroll={onScroll}
                    rowCount={source.content.length}
                    rowRenderer={rowRendererFactory(source)}
                    {...scrollToIndexProp}
                  />
                )}
              </AutoSizer>
            </TabPanel>
          </div>
      );
    });

    const tabs = Object.keys(this.state.sources).map((task, i) => {
      return (
        <Tab key={i}> {task} </Tab>
      );
    });

    return (
      <Tabs selectedIndex={this.state.tabIndex} onSelect={this.onTabSelect.bind(this)}>
        <TabList>
          { tabs }
        </TabList>
        <div style={{ height: '80%' }}>
          { tabPanels }
        </div>
      </Tabs>
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
