
const SEARCH_ENDPOINT = ""; 
// Add your deployed search worker URL here.
// Example: https://your-search-worker.workers.dev

export async function searchWeb(query) {
  if (!SEARCH_ENDPOINT) {
    throw new Error("Search API endpoint is not configured.");
  }

  const response = await fetch(
    `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`,
    {headers:{"Accept":"application/json"}}
  );

  if (!response.ok) throw new Error("Search failed.");

  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

