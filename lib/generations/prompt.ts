export interface TryOnPromptInput {
  outfitTitle: string;
  outfitItems: string[];
  identityNotes: string;
  username?: string;
  privateObjectKeys?: string[];
}

const courtPanels = [
  "Australian hard court, bright summer daylight, athletic forehand action",
  "French red clay court, warm afternoon light, sliding backhand action",
  "Wimbledon grass court, clean natural light, serve follow-through action",
  "US night hard court, stadium lighting, explosive volley action",
];

export function buildTryOnPrompt(input: TryOnPromptInput): string {
  const outfit = input.outfitItems.join("; ");

  return [
    "Create one photorealistic sports photography four-panel tennis try-on image.",
    "Keep the same person, face, hair, skin tone, body proportions, and outfit consistent across all panels.",
    `Identity notes from approved user photos: ${input.identityNotes}.`,
    `Selected outfit: ${input.outfitTitle}. Items: ${outfit}.`,
    "Do not add tournament logos, sponsor marks, watermarks, usernames, file names, storage keys, or UI text.",
    "Panel 1: " + courtPanels[0] + ".",
    "Panel 2: " + courtPanels[1] + ".",
    "Panel 3: " + courtPanels[2] + ".",
    "Panel 4: " + courtPanels[3] + ".",
    "Use realistic tennis movement, natural fabric folds, accurate shoes and accessories, and a clean 2x2 grid layout.",
  ].join("\n");
}
