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
      { title: "Django", href: "/django" },
      { title: "Python", href: "/python" },
      { title: "Node / Next / React", href: "/node-next-react" },
      { title: "Client-side JS", href: "/client-side-js" },
    ],
  },
  {
    title: "Visualizations",
    href: "/visualizations",
    items: [
      { title: "Logs", href: "#logs" },
      { title: "Tables", href: "#tables" },
      { title: "JSON", href: "#json" },
      { title: "Cards", href: "#cards" },
      { title: "Text", href: "#text" },
      { title: "Progress", href: "#progress" },
      { title: "Charts", href: "#charts" },
      { title: "Location", href: "#location" },
      { title: "Raw", href: "#raw-data" },
    ],
  },
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
