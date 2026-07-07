// RapidAPI Instagram Scraper Service
// Fetches raw .mp4 video and .jpg thumbnail URLs from an Instagram post.

interface InstagramData {
  videoUrl: string;
  thumbnailUrl: string;
  captionText?: string;
}

/**
 * Fetch video and thumbnail URLs for a given Instagram post/reel URL.
 *
 * ⚠️  Fill in YOUR_RAPIDAPI_KEY and YOUR_RAPIDAPI_HOST below.
 * ⚠️  Update `ENDPOINT_URL` to match the endpoint of the RapidAPI you subscribed to.
 */
export async function fetchInstagramData(url: string): Promise<InstagramData> {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-key": process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "",
      "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
    },
  };

  try {
    // Endpoint: "Detailed Reel Data" from Instagram Scraper Stable API
    const ENDPOINT_URL = `https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data.php?reel_post_code_or_url=${encodeURIComponent(url)}&type=reel`;

    console.log("Fetching Instagram data from:", ENDPOINT_URL);
    const response = await fetch(ENDPOINT_URL, options);

    if (!response.ok) {
      console.warn("Instagram API request failed:", response.status);
      return { videoUrl: "", thumbnailUrl: "" };
    }

    const data = await response.json();
    console.log("Instagram API response:", JSON.stringify(data, null, 2));

    // Extract video URL — try common response field patterns
    const videoUrl =
      data.video_url ??
      data.video_versions?.[0]?.url ??
      data.media?.video_versions?.[0]?.url ??
      data.items?.[0]?.video_versions?.[0]?.url ??
      "";

    // Extract thumbnail URL — try common response field patterns
    const thumbnailUrl =
      data.thumbnail_src ??
      data.display_url ??
      data.image_versions2?.candidates?.[0]?.url ??
      data.media?.image_versions2?.candidates?.[0]?.url ??
      data.items?.[0]?.image_versions2?.candidates?.[0]?.url ??
      data.thumbnail_url ??
      "";

    // Extract caption text
    const captionText =
      data.caption?.text ??
      data.items?.[0]?.caption?.text ??
      data.edge_media_to_caption?.edges?.[0]?.node?.text ??
      "";

    console.log("Extracted videoUrl:", videoUrl);
    console.log("Extracted thumbnailUrl:", thumbnailUrl);
    console.log("Extracted caption:", captionText ? "Yes" : "No");

    return { videoUrl, thumbnailUrl, captionText };
  } catch (error) {
    console.error("fetchInstagramData error:", error);
    return { videoUrl: "", thumbnailUrl: "", captionText: "" };
  }
}

/**
 * Send the extracted caption to Groq API to get a structured summary.
 */
export async function generateGroqSummary(caption: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_GROQ_API_KEY in .env");
  }

  const prompt = `You are a helpful assistant that extracts and formats information from Instagram reel captions.
If the caption is for a recipe, format it as a clean step-by-step recipe with ingredients.
If it is a workout, format it as a structured routine with sets and reps.
If it is something else, summarize the key points clearly.
Keep it concise and do not add any conversational filler. Just the summary.

Caption:
${caption}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
