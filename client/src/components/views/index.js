import { RawDataView } from "./rawDataView";
import { TableView } from "./tableView";
import { JsonDataView } from "./jsonDataView";
import { MarkdownView } from "./markdownView";
import { BarChartView } from "./barChartView";
import { AreaChartView } from "./areaChartView";
import { PieChartView } from "./pieChartView";
import { NumberDataView } from "./numberDataView";
import { ProgressView } from "./progressView";

const views = [
  JsonDataView,
  // MapView, // issues with loading this
  MarkdownView,
  TableView,
  PieChartView,
  BarChartView,
  AreaChartView,
  NumberDataView,
  ProgressView,
  RawDataView
];
export default views;