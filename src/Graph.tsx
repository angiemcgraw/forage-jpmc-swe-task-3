import React, { Component } from 'react';
import {Table, TableData} from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}
class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      // Stock 1
      price_abc: 'float',
      // Stock 2
      price_def: 'float',
      // Ratio between Stock 1 and Stock 2
      ratio: 'float',
      timestamp: 'date',
      upper_bound: 'float',
      lower_bound: 'float',
      // Alert when upper and lower bounds cross
      trigger_alert: 'float',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      elem.setAttribute('row-pivots', '["timestamp"]');
      // What we're tracking with our graph
      elem.setAttribute('columns', '["ratio", "lower_bound", "upper_bound", "trigger_alert"]');
      // Aggregates handles any duplicate data
      // Consider a data point unique if it has a timestamp
      // Otherwise, average the values of the other non-unique fields that the duplicate data points share
      elem.setAttribute('aggregates', JSON.stringify({
        price_abc: 'avg',
        price_def: 'avg',
        ratio: 'avg',
        timestamp: 'distinct count',
        upper_bound: 'avg',
        lower_bound: 'avg',
        trigger_alert: 'avg',
      }));
    }
  }

  // Executes when the graph gets new data
  componentDidUpdate() {
    if (this.table) {
      this.table.update([
          DataManipulator.generateRow(this.props.data),
      ] as unknown as TableData);
    }
  }
}

export default Graph;
