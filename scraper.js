const { chromium } = require('playwright');
const fs = require('fs');

async function runSearch(companyName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const query = `site:linkedin.com/in/ "${companyName}"`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

  const results = await page.$$eval('div.g', (divs, company) => {
    return divs.map(div => {
      const link = div.querySelector('a')?.href;
      const text = div.innerText;
      if (!link || !link.includes('linkedin.com/in')) return null;
      const lines = text.split('\n');
      const name = lines[0] || "";
      const titleLine = lines.find(l => l.toLowerCase().includes(company.toLowerCase()));
      const title = titleLine || "";
      return {
        name,
        title,
        company,
        link
      };
    }).filter(Boolean);
  }, companyName);

  fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} results to results.json`);

  await browser.close();
}

if (require.main === module) {
  const company = process.argv[2] || "Namos Solutions";
  runSearch(company);
}
