import { DocsRenderer, generateDocsMetadata } from "@/components/docs-renderer";
import { page_routes } from "@/lib/routes-config";

type PageProps = {
  params: { slug: string[] };
};

export default async function Page({ params: { slug = [] } }: PageProps) {
  const pathName = slug.join("/");
  return <DocsRenderer pathName={pathName} />;
}

export async function generateMetadata({ params: { slug = [] } }: PageProps) {
    const pathName = slug.join("/");
    return await generateDocsMetadata({pathName});
}

export function generateStaticParams() {
  return page_routes.map((item) => ({
    slug: item.href.split("/").slice(1),
  }));
}