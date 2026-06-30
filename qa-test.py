import asyncio, os
from playwright.async_api import async_playwright

def main(ctx):
    qa_dir = "D:\\occupantkiller\\occupantkiller\\qa-screenshots"
    os.makedirs(qa_dir, exist_ok=True)
    
    async def test():
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--disable-cache", "--incognito", "--disk-cache-size=0", "--disable-application-cache"])
            context = await browser.new_context(viewport={"width": 1920, "height": 1080})
            page = await context.new_page()
            
            # Force cache bypass with random query parameter
            await page.goto("http://127.0.0.1:3000?_nocache=" + str(os.urandom(4).hex()), wait_until="networkidle", timeout=60000)
            await asyncio.sleep(5)
            
            # Load Hostomel with god mode
            await page.evaluate("""
                window.__QA_MODE = true;
                window.__QA_START_STAGE = 0;
                window.__chosenDroneType = 'recon';
                if (typeof GameManager !== 'undefined' && GameManager.startGame) {
                    GameManager.startGame();
                }
                setTimeout(function() {
                    if (typeof GameManager !== 'undefined' && GameManager.toggleGodMode) {
                        GameManager.toggleGodMode();
                    }
                }, 1500);
            """)
            await asyncio.sleep(15)
            
            # Move around to see buildings
            for _ in range(6):
                await page.keyboard.press("w")
                await asyncio.sleep(0.5)
                await page.keyboard.press("a")
                await asyncio.sleep(0.5)
            
            path = os.path.join(qa_dir, "qa-buildings-hostomel-nocache.png")
            await page.screenshot(path=path, type="png", timeout=30000)
            
            await browser.close()
            return {"screenshot": path}
    
    try:
        return asyncio.run(test())
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}
