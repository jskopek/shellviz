import { buttonVariants } from "@/components/ui/button";
import { page_routes } from "@/lib/routes-config";
import { MoveUpRightIcon, TerminalSquareIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const SimpleCopy = (header: string, subheader: string) => (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4 sm:text-6xl">{header}</h1>
      <p className="mb-8 sm:text-xl max-w-[800px] text-muted-foreground mx-auto">{subheader}</p>
    </div>
  )
  const copy = [
    (
      <div key='copyVariant'>
        <div className="bg-gray-100 text-gray-900 p-6 rounded-lg font-mono mb-8">
          <h1 className="text-2xl font-bold m-0">
            <span className="text-green-400">{'>>>'}</span> print(&quotthere must be a better way to see your data&quot)
          </h1>
        </div>

        <p className="text-muted-foreground sm:text-xl text-base max-w-[800px] mb-8">
          Now there is! Transform your Python outputs into interactive, browser-based visualizations. Free, open-source, and zero dependencies.
        </p>
      </div>
    ),
    (SimpleCopy('Interactive tables, charts, collapsible JSON, and more', 'Create interactive visualizations from your Python outputs. No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
    (SimpleCopy('Create interactive visualizations from your Python scripts', 'No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
    (SimpleCopy('See your Python data in your browser', 'No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
    (SimpleCopy('The zero-effort way to see your Python data in action with live browser-based visuals.', 'No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
    (SimpleCopy('From code to browser—Shellviz makes exploring and visualizing data fast, simple, and beautiful', 'No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
    (SimpleCopy('Shellviz brings your Python data to life with real-time, zero-config visualizations in a snap', 'No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
    (SimpleCopy('Transform cluttered outputs into stunning, live visualizations with Shellviz, right in your browser', 'No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
    (SimpleCopy('Shellviz: Your Python data, reimagined as dynamic, interactive visuals—no setup, no hassle.', 'No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
    (SimpleCopy('Effortlessly explore your data with Shellviz, the Python tool for real-time, browser-based visualizations.', 'No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
    (SimpleCopy('Shellviz turns your Python data into live, interactive visuals—straight from your script to your browser.', 'No more scrolling through endless print() outputs. Free, open-source, and zero dependencies.')),
  ]
  let Copy = copy[copy.length - 1];
  Copy = copy[Math.floor(Math.random() * copy.length)];

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[85vh]">
      {Copy}

      <div className="flex flex-row items-center gap-5">
        <Link
          href={`/docs${page_routes[0].href}`}
          className={buttonVariants({ className: "px-6", size: "lg" })}
        >
          Learn More
        </Link>
        <Link
          href="https://www.loom.com/share/ce1e0e74ee824196a3959b5116dda793?sid=cf6ca201-4947-40aa-9b6a-8c54458f1d0c"
          target="_blank"
          className={buttonVariants({
            variant: "secondary",
            className: "px-6",
            size: "lg",
          })}
        >
          Watch Video (3 min)
        </Link>
      </div>

      <div className="flex text-muted-foreground font-code text-base font-medium mt-8 mb-8">
        <TerminalSquareIcon className="w-5 h-5 mr-1 mt-0.5" />
        pip install shellviz
      </div>


    </div>
  );
}