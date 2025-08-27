import { ModeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import Search from "./search";
import Anchor from "./anchor";
import Image from "next/image";
import { SheetLeftbar } from "./leftbar";
import { page_routes } from "@/lib/routes-config";
import { SheetClose } from "@/components/ui/sheet";
import { GithubIcon } from "lucide-react";

export const NAVLINKS = [
  {
    title: "Documentation",
    href: `${page_routes[0].href}`,
  },
  
];

export function Navbar() {
  return (
    <nav className="w-full border-b h-16 sticky top-0 z-50 bg-background">
      <div className="sm:container mx-auto w-[95vw] h-full flex items-center justify-between md:gap-2">
        <SheetLeftbar />
        <div className="sm:flex hidden">
          <Logo />
        </div>

        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          <div className="lg:flex hidden gap-4 items-center">
            <NavMenu />
            <Search />
          </div>
          <div className="flex sm:ml-0">
            <Link
              href="https://github.com/jskopek/shellviz"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
            >
              <GithubIcon className="h-[1.1rem] w-[1.1rem]" />
            </Link>
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image src="/icon.png" alt="Shellviz Logo" width={50} height={50} />
      <h2 className="text-md font-bold font-code">Shellviz</h2>
    </Link>
  );
}

export function NavMenu({ isSheet = false }) {
  return (
    <>
      {NAVLINKS.map((item) => {
        const Comp = (
          <Anchor
            key={item.title + item.href}
            activeClassName="!text-primary md:font-semibold font-medium"
            absolute
            className="flex items-center gap-1 dark:text-stone-300/85 text-stone-800"
            href={item.href}
          >
            {item.title}
          </Anchor>
        );
        return isSheet ? (
          <SheetClose key={item.title + item.href} asChild>
            {Comp}
          </SheetClose>
        ) : (
          Comp
        );
      })}
    </>
  );
}
