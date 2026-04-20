// scripts/downloadHiffinProducts.js
import fs from "fs/promises";

const BASE_URL = "https://www.hiffin.in";

async function fetchPage(page = 1, limit = 250) {
  const res = await fetch(`${BASE_URL}/products.json?limit=${limit}&page=${page}`, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      accept: "application/json,text/plain,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed page ${page}: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function main() {
  const allProducts = [];
  let page = 1;
  const limit = 250;

  while (true) {
    console.log(`Fetching page ${page}...`);
    const data = await fetchPage(page, limit);
    const products = Array.isArray(data?.products) ? data.products : [];

    if (!products.length) break;

    allProducts.push(...products);

    if (products.length < limit) break;
    page += 1;
  }

  await fs.writeFile(
    "./scripts/hiffin-products-raw.json",
    JSON.stringify(
      {
        source: "https://www.hiffin.in/products.json",
        fetchedAt: new Date().toISOString(),
        total: allProducts.length,
        products: allProducts,
      },
      null,
      2
    )
  );

  console.log(`Done. Saved ${allProducts.length} products to scripts/hiffin-products-raw.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});