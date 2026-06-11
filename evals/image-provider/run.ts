import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { buildTryOnPrompt } from "@/lib/generations/prompt";
import { getImageProvider } from "@/lib/image-provider/selected-provider";

interface EvalCase {
  id: string;
  tourSilhouette: "ATP" | "WTA";
  bodyType: string;
  skinTone: string;
  outfitColor: string;
  fullBodyPathEnv: string;
  headshotPathEnv: string;
}

interface CaseFile {
  cases: EvalCase[];
}

const caseFilePath = resolve(process.cwd(), "evals/image-provider/cases.json");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const caseFile = JSON.parse(await readFile(caseFilePath, "utf8")) as CaseFile;

  if (dryRun) {
    console.log(`Loaded ${caseFile.cases.length} image-provider eval cases.`);
    console.log("Dry run only: no provider calls made.");
    return;
  }

  process.env.IMAGE_PROVIDER = process.env.IMAGE_PROVIDER ?? "volcengine-ark";
  const provider = getImageProvider();
  const results = [];
  const outputDir = resolve(process.cwd(), ".eval-output");
  await mkdir(outputDir, { recursive: true });

  for (const evalCase of caseFile.cases) {
    const fullBodyPath = process.env[evalCase.fullBodyPathEnv];
    const headshotPath = process.env[evalCase.headshotPathEnv];
    if (!fullBodyPath || !headshotPath) {
      throw new Error(`Missing private image paths for ${evalCase.id}.`);
    }

    const [fullBodyImage, headshotImage] = await Promise.all([
      readFile(fullBodyPath),
      readFile(headshotPath),
    ]);
    const prompt = buildTryOnPrompt({
      outfitTitle: `${evalCase.tourSilhouette} representative ${evalCase.outfitColor} outfit`,
      outfitItems: [
        `${evalCase.outfitColor} tennis top`,
        `${evalCase.outfitColor} tennis bottom`,
        "white tennis shoes and accessories",
      ],
      identityNotes: `Authorized adult reference, ${evalCase.bodyType} build, ${evalCase.skinTone} skin tone.`,
    });

    const startedAt = performance.now();
    const output = await provider.generate({ prompt, fullBodyImage, headshotImage });
    const durationMs = Math.round(performance.now() - startedAt);
    const outputPath = resolve(outputDir, `${evalCase.id}.png`);
    await writeFile(outputPath, output.image);

    results.push({
      id: evalCase.id,
      providerJobId: output.providerJobId ?? null,
      mimeType: output.mimeType,
      byteSize: output.image.byteLength,
      durationMs,
      outputPath,
    });
  }

  const summaryPath = resolve(outputDir, "summary.json");
  await writeFile(
    summaryPath,
    JSON.stringify({ provider: process.env.IMAGE_PROVIDER, results }, null, 2),
  );
  console.log(`Wrote provider eval summary to ${summaryPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
