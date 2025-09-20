import { faTerminal, faTable, faFile, faMapLocation, faChartSimple, faBarsProgress, faHashtag, faColumns, faCode, faGlobe, faLayerGroup, faServer, faPhone, faQrcode, faEdit, faPlus, faTrash, faMobile, faClock, faEye } from "@fortawesome/free-solid-svg-icons";
import { faJs, faPython, faReact } from "@fortawesome/free-brands-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

// for page navigation & to sort on leftbar
export type EachRoute = {
  title: string;
  href: string;
  icon?: IconProp;
  noLink?: true; // noLink will create a route segment (section) but cannot be navigated
  items?: EachRoute[];
};

export const ROUTES: EachRoute[] = [
  { title: "Introduction", href: "/introduction" },
  {
    title: "Getting Started",
    href: "/getting-started", // note: redirects to /getting-started/django via next.config.mjs
    items: [
      { title: "Django", href: "/django", icon: faGlobe },
      { title: "Python", href: "/python", icon: faPython },
      { title: "Node / Next / React", href: "/node-next-react", icon: faReact },
      { title: "Client-side JS", href: "/client-side-js", icon: faJs },
    ],
  },
  {
    title: "Visualizations",
    href: "/visualizations",
    items: [
      { title: "Logs", href: "#logs", icon: faTerminal },
      { title: "Tables", href: "#tables", icon: faTable },
      { title: "JSON", href: "#json", icon: faCode },
      { title: "Stack", href: "#stack", icon: faLayerGroup },
      { title: "Cards", href: "#cards", icon: faColumns },
      { title: "Text", href: "#text", icon: faHashtag },
      { title: "Progress", href: "#progress", icon: faBarsProgress },
      { title: "Charts", href: "#charts", icon: faChartSimple },
      { title: "Location", href: "#location", icon: faMapLocation },
      { title: "Raw", href: "#raw-data", icon: faFile },
    ],
  },
  {
    title: "Advanced Usage",
    href: "/advanced",
    items: [
      { title: "Replacing Values", href: "#replacing-existing-values", icon: faEdit },
      { title: "Appending Data", href: "#appending-to-existing-data", icon: faPlus },
      { title: "Clearing Data", href: "#clearing-data", icon: faTrash },
      { title: "Command Line Interface", href: "#command-line-interface", icon: faTerminal },
      { title: "Phone as Second Screen", href: "#using-your-phone-as-a-second-screen", icon: faMobile },
      { title: "Waiting for User", href: "#waiting-until-data-is-viewed", icon: faClock },
    ],
  },
  { title: "API Reference", href: "/api" },
  { title: "Server", href: "/server" },
  { title: "Release Notes", href: "/release-notes" },
];

type Page = { title: string; href: string };

function getRecurrsiveAllLinks(node: EachRoute) {
  const ans: Page[] = [];
  if (!node.noLink) {
    ans.push({ title: node.title, href: node.href });
  }
  node.items?.forEach((subNode) => {
    const temp = { ...subNode, href: `${node.href}${subNode.href}` };
    ans.push(...getRecurrsiveAllLinks(temp));
  });
  return ans;
}

export const page_routes = ROUTES.map((it) => getRecurrsiveAllLinks(it)).flat();
