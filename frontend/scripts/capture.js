import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\gugan\\.gemini\\antigravity-ide\\brain\\c78901b7-6592-477a-93a9-9f4c2d21ff2d';

async function capture() {
  console.log('Launching Chrome with Playwright...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const pagesToCapture = [
    { name: 'dashboard', url: 'http://localhost:5173/student/dashboard' },
    { name: 'study_assistant', url: 'http://localhost:5173/student/study' },
    { name: 'study_documents', url: 'http://localhost:5173/student/study/documents' },
    { name: 'requests', url: 'http://localhost:5173/student/requests' },
    { name: 'announcements', url: 'http://localhost:5173/student/announcements' },
  ];

  for (const item of pagesToCapture) {
    console.log(`Navigating to ${item.name} (${item.url})...`);
    await page.goto(item.url, { waitUntil: 'networkidle' });
    // wait a moment for animations
    await page.waitForTimeout(1000);
    const dest = path.join(ARTIFACT_DIR, `screenshot_${item.name}.png`);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`Captured ${dest}`);
  }

  await browser.close();
  console.log('All screenshots captured successfully.');
}

capture().catch((err) => {
  console.error('Playwright capture error:', err);
  process.exit(1);
});
