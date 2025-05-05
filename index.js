const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.get("/", (req, res) => {
    res.send("Server çalışıyor!");
});

app.use(express.json());

app.post('/search', async (req, res) => {
    const imageUrl = req.body.imageUrl;

    if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl is required' });
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        await page.goto('https://images.google.com');
        await page.waitForSelector('.ZaFO0');
        await page.click('.ZaFO0');

        await page.waitForSelector('[aria-label="Paste image link"]');
        await page.click('[aria-label="Paste image link"]');

        await page.waitForSelector('input[name="image_url"]');
        await page.type('input[name="image_url"]', imageUrl);

        await page.keyboard.press('Enter');

        await page.waitForSelector('.g', { timeout: 15000 });

        const results = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.g'));
            return items.map(item => {
                const titleEl = item.querySelector('h3');
                const linkEl = item.querySelector('a');
                return {
                    title: titleEl ? titleEl.textContent : null,
                    link: linkEl ? linkEl.href : null
                };
            }).filter(item => item.title && item.link);
        });

        await browser.close();
        res.json({ results });

    } catch (error) {
        console.error("Search error:", error);
        await browser.close();
        res.status(500).json({ error: "Search failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

