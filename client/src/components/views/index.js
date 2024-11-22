import { RawDataView } from "./rawDataView";
import { TableView } from "./tableView";
import { JsonDataView } from "./jsonDataView";
import { MarkdownView } from "./markdownView";
import { BarChartView } from "./barChartView";
import { AreaChartView } from "./areaChartView";
import { PieChartView } from "./pieChartView";
import { NumberDataView } from "./numberDataView";
import { ProgressView } from "./progressView";
import { CardView } from "./cardView";
import { LogView } from "./logView";

const views = [
  LogView,
  JsonDataView,
  // MapView, // issues with loading this
  MarkdownView,
  TableView,
  CardView,
  BarChartView,
  AreaChartView,
  PieChartView,
  NumberDataView,
  ProgressView,
  RawDataView
];
export default views;