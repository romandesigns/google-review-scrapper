import cron from "cron";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
const fsPromises = fs.promises;

// Timeframes
const everyMinute = "* * * * *";
const everyHour = "0 * * * *";
const everyDay = "0 0 * * *";
const everyWeek = "0 0 * * 1";

export const weeklyScraper = new cron.CronJob(everyWeek, function () {
  scrape(process.env.PAGE_TO_CRAWL);
});

export const scrape = async (url) => {
  const languages = ["en", "es", "de"]; // Add more languages if needed

  try {
    for (const lang of languages) {
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
      );

      // Set the language header
      await page.setExtraHTTPHeaders({
        "Accept-Language": lang,
      });

      // Navigate to the URL and perform search
      await page.goto(url);
      await page.type("input#searchboxinput", process.env.BUSINESS_NAME);
      await page.keyboard.press("Enter");
      await page.waitForNavigation();

      // Get business details
      const businessTitle = await page.$eval(
        'h1[class="DUwDvf lfPIob"]',
        (el) => el.textContent
      );
      const businessRating = await page.$eval(
        "div.F7nice span > span",
        (el) => el.textContent
      );

      // Click and wait for navigation
      await page.click('button[jslog="145620; track:click;"]');
      await page.waitForNavigation();

      // Scroll the container to load more reviews
      const containerSelector = 'div[class="m6QErb "]';
      await page.evaluate(async (containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, containerSelector);

      // Wait for a short delay (you can adjust the duration as needed)
      await page.waitForTimeout(10000);

      // Get review elements and extract data
      const reviews = await page.$$eval('div[class="jJc9Ad "]', (elements) =>
        elements.map((el) => {
          const reviewerAvatar =
            el.querySelector('img[class="NBa7we"]')?.getAttribute("src") || "";
          const reviewerName =
            el.querySelector('div[class="d4r55 "]')?.textContent || "";
          const postedTimeAgo =
            el.querySelector('span[class="xRkPPb"]')?.textContent || "";
          const reviewerMessage =
            el.querySelector('span[class="wiI7pd"]')?.textContent || "";
          const locale =
            el.querySelector('div[class="MyEned"]')?.getAttribute("lang") || "";
          const rating =
            el.querySelector('div[class="DU9Pgb"] > span[class="fzvQIb"]')
              .textContent || "";
          const reviwerLink =
            el
              .querySelector('button[class="al6Kxe"]')
              ?.getAttribute("data-href") || "";
          return {
            reviewerName,
            postedTimeAgo,
            reviewerMessage,
            locale,
            rating,
            reviewerAvatar,
            reviwerLink,
          };
        })
      );

      // Create data object
      const data = {
        businessTitle,
        businessRating,
        reviews,
        totalReviews: reviews.length,
        language: lang,
      };

      // Define the directory and file path
      const dir = path.join(process.cwd(), `public/data/index_${lang}.json`);
      // Write the data to the file
      await fsPromises.writeFile(dir, JSON.stringify(data));
      console.log(`File for language ${lang} saved successfully.`);

      // Close the browser
      await browser.close();
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
