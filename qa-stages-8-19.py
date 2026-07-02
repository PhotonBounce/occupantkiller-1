import asyncio
import os
import time
from playwright.async_api import async_playwright

QA_DIR = "D:\\occupantkiller\\occupantkiller\\qa-screenshots"
os.makedirs(QA_DIR, exist_ok=True)

# Stages 8-19 (remaining 12 stages)
STAGES = [
    (8,  "sevastopol", "Sevastopol Naval Base"),
    (9,  "donbas",     "Donbas Final Push"),
    (10, "belgorod",   "Belgorod Offensive"),
    (11, "kremlin",    "Kremlin Showdown"),
    (12, "kyiv",       "Battle of Kyiv"),
    (13, "snake",      "Snake Island Defense"),
    (14, "saky",       "Saky Airbase Strike"),
    (15, "vuhledar",   "Vuhledar Tank Graveyard"),
    (16, "antonov",    "Antonov Bridge Strike"),
    (17, "refinery",   "Refinery Strike — FPV Drone"),
    (18, "treeline",   "Treeline Assault"),
    (19, "siege",      "Siege of Moscow"),
]

screenshots = []
errors = []
stage_results = []

async def safe_shot(page, name):
    try:
        path = os.path.join(QA_DIR, f"qa-{name}.png")
        await page.screenshot(path=path, timeout=5000)
        screenshots.append(name)
        return True
    except Exception as e:
        errors.append(f"shot {name}: {str(e)[:120]}")
        return False

async def load_stage(page, stage_idx):
    """Directly load a stage via QA mode — bypasses all UI."""
    await page.evaluate(f"""
        window.__QA_MODE = true;
        window.__QA_START_STAGE = {stage_idx};
        window.__chosenDroneType = 'recon';
        if (typeof GameManager !== 'undefined' && GameManager.startGame) {{
            GameManager.startGame();
        }}
    """)
    await asyncio.sleep(8)  # Wait for world generation + initial spawn

async def test_stage(page, stage_idx, stage_id, stage_name):
    print(f"[QA] === STAGE {stage_idx}: {stage_name} ===")
    
    # Load stage
    await load_stage(page, stage_idx)
    await safe_shot(page, f"s{stage_idx:02d}-{stage_id}-load")
    
    # Toggle god mode (via G key and UI button)
    print(f"[QA]   Toggling god mode...")
    await page.keyboard.press("g")
    await asyncio.sleep(1)
    await safe_shot(page, f"s{stage_idx:02d}-{stage_id}-god-on")
    
    # Move around for 20 seconds, screenshot every 4 seconds
    print(f"[QA]   Moving around for 20s...")
    for i in range(5):
        await safe_shot(page, f"s{stage_idx:02d}-{stage_id}-move-{i:02d}")
        await asyncio.sleep(4)
        # Move around
        for key in ["w", "a", "s", "d"]:
            await page.keyboard.press(key)
            await asyncio.sleep(0.3)
        # Look around
        await page.mouse.move(800, 450)
        await asyncio.sleep(0.2)
        await page.mouse.move(1100, 600)
        await asyncio.sleep(0.2)
    
    # Toggle god mode off
    await page.keyboard.press("g")
    await asyncio.sleep(0.5)
    
    # Return to menu
    print(f"[QA]   Returning to menu...")
    await page.evaluate("""
        if(typeof GameManager !== 'undefined' && GameManager.togglePause) GameManager.togglePause();
        window.__QA_MODE = false;
        window.__QA_START_STAGE = null;
        gameState = 0;
        var menu = document.getElementById('main-menu');
        if(menu) menu.style.display = 'flex';
    """)
    await asyncio.sleep(3)
    await safe_shot(page, f"s{stage_idx:02d}-{stage_id}-menu-return")
    
    print(f"[QA]   Stage {stage_idx} done.")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        page.on("pageerror", lambda err: errors.append(f"PAGE: {str(err)[:150]}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE {msg.type}: {msg.text[:150]}") if msg.type == "error" else None)
        
        # Load game
        await page.goto("http://127.0.0.1:3000", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(5)
        await safe_shot(page, "000-menu-main")
        
        for stage_idx, stage_id, stage_name in STAGES:
            try:
                await test_stage(page, stage_idx, stage_id, stage_name)
                stage_results.append({"stage": stage_idx, "name": stage_name, "status": "PASS", "errors": []})
            except Exception as e:
                err_msg = f"Stage {stage_idx} ({stage_name}): {str(e)[:200]}"
                errors.append(err_msg)
                stage_results.append({"stage": stage_idx, "name": stage_name, "status": "FAIL", "errors": [err_msg]})
                print(f"[QA] ERROR: {err_msg}")
        
        await browser.close()
        
        print(f"\n[QA] COMPLETE: {len(screenshots)} screenshots, {len(errors)} errors")
        print(f"[QA] Saved to: {QA_DIR}")
        
        # Print summary
        print("\n[QA] STAGE RESULTS:")
        for r in stage_results:
            status = "✅" if r["status"] == "PASS" else "❌"
            print(f"  {status} Stage {r['stage']:2d}: {r['name']}")
            if r["errors"]:
                for e in r["errors"]:
                    print(f"      Error: {e}")
        
        if errors:
            print(f"\n[QA] ERRORS ({len(errors)}):")
            for e in errors[:20]:
                print(f"  - {e}")

if __name__ == "__main__":
    asyncio.run(main())
