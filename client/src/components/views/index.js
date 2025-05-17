import { RawDataView } from "./rawDataView";
import { TableView } from "./tableView";
import { JsonDataView } from "./jsonDataView";
import { MarkdownView } from "./markdownView";
import { BarChartView } from "./barChartView";
import { AreaChartView } from "./areaChartView";
import { PieChartView } from "./pieChartView";
import { NumberDataView } from "./numberDataView";
import { ProgressView } from "./progressView";
import { LocationView } from "./locationView";
import { CardView } from "./cardView";
import { LogView } from "./logView";
import { StackView } from "./stackView";

const views = [
  LogView,
  JsonDataView,
  MarkdownView,
  TableView,
  CardView,
  BarChartView,
  AreaChartView,
  PieChartView,
  NumberDataView,
  ProgressView,
  LocationView,
  RawDataView,
  StackView
];
export default views;