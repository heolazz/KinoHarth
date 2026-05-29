const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://anime.streamxtv.tech/anime/199?play=true&episode=1', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for an iframe to appear
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    const iframes = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(i => i.src);
    });
    
    console.log("Iframe URLs found:");
    console.log(iframes);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
})();
