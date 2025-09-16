import { faTerminal, faTable, faJson, faCard, faText, faProgress, faChart, faLocation, faRaw, faFile, faMapLocation, faChartSimple, faBarsProgress, faHashtag, faColumns, faCode, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { faJs, faNodeJs, faPython, faReact } from "@fortawesome/free-brands-svg-icons";

// for page navigation & to sort on leftbar
export type EachRoute = {
  title: string;
  href: string;
  noLink?: true; // noLink will create a route segment (section) but cannot be navigated
  items?: EachRoute[];
};

export const ROUTES: EachRoute[] = [
  { title: "Introduction", href: "/introduction" },
  { title: "Getting Started", href: "/getting-started" },
  {
    title: "Integration",
    href: "/integration",
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
      { title: "Cards", href: "#cards", icon: faColumns },
      { title: "Text", href: "#text", icon: faHashtag },
      { title: "Progress", href: "#progress", icon: faBarsProgress },
      { title: "Charts", href: "#charts", icon: faChartSimple },
      { title: "Location", href: "#location", icon: faMapLocation },
      { title: "Raw", href: "#raw-data", icon: faFile },
    ],
  },
  { title: "Examples", href: "/examples" },
  { title: "Troubleshooting", href: "/troubleshooting" },
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
