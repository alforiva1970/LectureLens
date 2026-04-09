import { chromium } from 'playwright';
import * as fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://ai.google.dev/gemini-api/docs/document-processing?lang=rest');
  
  // Wait for the specific section about "Uploading PDFs using the Files API"
  await page.waitForSelector('text=Uploading PDFs using the Files API');
  
  const text = await page.evaluate(() => {
    return document.body.innerText;
  });
  
  fs.writeFileSync('docs.txt', text);
  
  await browser.close();
})();
