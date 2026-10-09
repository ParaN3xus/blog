import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { resolve } from "path";

const projectRoot = resolve(
  import.meta.dirname,
  import.meta.env.DEV ? "../../" : "../../../"
);

const compiler = NodeCompiler.create({
  workspace: resolve(projectRoot, "typ/templates"),
});

const pdfCompiler = NodeCompiler.create({
  workspace: projectRoot,
  fontArgs: [{ fontPaths: [resolve(projectRoot, "assets/fonts/")] }],
});

export async function renderPdf(mainFileContent: string): Promise<Buffer> {
  return pdfCompiler.pdf({
    mainFileContent: mainFileContent,
    inputs: {
      "build-kind": "monthly",
    },
  });
}
