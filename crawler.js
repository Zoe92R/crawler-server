import axios from "axios";
import { load } from "cheerio";
import { writeFileSync } from "fs";

async function crawl(url, depth, results, visited) {
  if (depth === 0 || visited.has(url)) {
    return;
  }
  try {
    const response = await axios.get(url);
    if (response.status >= 200 && response.status < 300) {
      const $ = load(response.data);
      // Extract image URLs from the current page
      $("img").each((_, element) => {
        const imageUrl = $(element).attr("src");
        results.push({ imageUrl, sourceUrl: url, depth });
      });
      // Extract links from the current page and  crawl them
      $("a").each((_, element) => {
        const link = $(element).attr("href");
        if (
          link &&
          (link.startsWith("http://") || link.startsWith("https://"))
        ) {
          crawl(link, depth - 1, results, visited);
        }
      });

      visited.add(url);
    } else {
      console.error(
        `Error crawling ${url}: Received HTTP status ${response.status}`
      );
    }
  } catch (error) {
    console.error(`Error crawling ${url}: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error("Usage: node crawler.js <url: string> <depth: number>");
    return;
  }

  const url = args[0];
  const depth = parseInt(args[1]);

  if (isNaN(depth) || depth < 0) {
    console.error(
      "Invalid depth. Please provide a non-negative number for depth."
    );
    return;
  }

  const results = [];
  const visited = new Set();

  await crawl(url, depth, results, visited);

  // Save results to a JSON file
  const data = { results };
  writeFileSync("results.json", JSON.stringify(data, null, 2));
  console.log("Crawling completed. Results saved to results.json.");
}

main();
