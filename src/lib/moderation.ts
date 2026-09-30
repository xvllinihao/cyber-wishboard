import "server-only";

// Screens text and images with OpenAI's free moderation endpoint.
// Without OPENAI_API_KEY, or if the call fails, content is allowed through
// so posting never breaks because of the moderation service.
export async function isFlagged({ text, imageUrls = [] }: { text: string; imageUrls?: string[] }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  const input = [
    { type: "text", text },
    ...imageUrls.map((url) => ({ type: "image_url", image_url: { url } })),
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "omni-moderation-latest", input }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("moderation request failed", response.status, await response.text());
      return false;
    }
    const data = (await response.json()) as { results: { flagged: boolean }[] };
    return data.results.some((result) => result.flagged);
  } catch (error) {
    console.error("moderation request failed", error);
    return false;
  }
}
