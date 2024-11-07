import { RawDataView } from "./rawDataView";
import { TableView } from "./tableView";
import { JsonDataView } from "./jsonDataView";
import { MarkdownView } from "./markdownView";
import { PieChartView } from "./pieChartView";
import { AreaChartView } from "./areaChartView";
import { NumberDataView } from "./numberDataView";
import { ProgressView } from "./progressView";

export default [
  JsonDataView,
  // MapView, // issues with loading this
  MarkdownView,
  TableView,
  PieChartView,
  AreaChartView,
  NumberDataView,
  ProgressView,
  RawDataView
];