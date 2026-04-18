import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";
import { DocsFooter } from "./docs-banner";
import { localizePageTree } from "@/lib/tree-localization";

export default async function Layout({
  params,
  children,
}: LayoutProps<"/[lang]/docs">) {
  const { lang } = await params;
  // Non-English locales fall back to the English page tree until Crowdin
  // lands translated content. `source.pageTree[lang]` can be undefined for
  // locales with no content dir yet.
  const rawTree = source.pageTree[lang] ?? source.pageTree["en"];
  const tree = localizePageTree(rawTree, lang, {
    translateName: true,
    translateTitle: true,
    translateIndex: false,
    translateChildren: true,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <DocsLayout
        tree={tree}
        {...baseOptions(lang, true)}
        githubUrl="https://github.com/DivineSkins/divine-wiki"
      >
        {children}
        <DocsFooter />
      </DocsLayout>
    </div>
  );
}
