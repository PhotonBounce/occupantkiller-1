import asyncio
import os
import time
from playwright.async_api import async_playwright

QA_DIR = "D:\\occupantkiller\\occupantkiller\\qa-screenshots"
os.makedirs(QA_DIR, exist_ok=True)

STAGES = [
    ("hostomel", "Hostomel Airport"),
    ("avdiivka", "Avdiivka Coke Plant"),
    ("bakhmut", "Bakhmut Fortress"),
    ("kherson", "Kherson Dnipro"),
    ("mariupol", "Mariupol Azovstal"),
    ("crimea", "Crimea Bridge"),
    ("chornobyl", "Chornobyl Exclusion"),
    ("moscow", "Outer Moscow"),
    ("sevastopol", "Sevastopol Naval"),
    ("donbas", "Donbas Mining"),
    ("belgorod", "Belgorod Offensive"),
    ("kremlin", "Kremlin Showdown"),
    ("kyiv", "Kyiv Capital"),
    ("snake", "Snake Island"),
    ("saky", "Saky Airbase"),
    ("vuhledar", "Vuhledar Coal"),
    ("antonov", "Antonov Bridge"),
    ("refinery", "Oil Refinery"),
    ("treeline", "Treeline Assault"),
    ("siege", "Siege of Moscow"),
]

screenshots = []
errors = []

async def safe_shot(page, name):
    try:
        path = os.path.join(QA_DIR, f"qa-{name}.png")
        await page.screenshot(path=path, timeout=2000)
        screenshots.append(name)
        return True
    except Exception as e:
        errors.append(f"shot {name}: {str(e)[:80]}")
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
    await asyncio.sleep(6)  # Wait for world generation + initial spawn

async def screenshot_burst(page, prefix, count=15, interval=4):
    """Take a burst of screenshots with movement."""
    for i in range(count):
        await safe_shot(page, f"{prefix}-{i:02d}")
        await asyncio.sleep(interval)
        # Move around
        for key in ["w", "a", "s", "d"]:
            await page.keyboard.press(key)
            await asyncio.sleep(0.3)
        # Look around
        await page.mouse.move(800, 450)
        await asyncio.sleep(0.2)
        await page.mouse.move(1100, 600)
        await asyncio.sleep(0.2)

async def test_weapons(page, prefix):
    """Cycle through weapons 1-9 and take screenshots."""
    for w in ["1", "2", "3", "4", "5", "6", "7", "8", "9"]:
        await page.keyboard.press(w)
        await asyncio.sleep(0.8)
        await safe_shot(page, f"{prefix}-weapon-{w}")
        await page.mouse.click(960, 540)
        await asyncio.sleep(0.3)

async def test_drone(page, prefix):
    """Enter drone mode, take screenshots, exit."""
    await page.keyboard.press("q")
    await asyncio.sleep(2)
    await safe_shot(page, f"{prefix}-drone-enter")
    for i in range(3):
        await asyncio.sleep(4)
        await safe_shot(page, f"{prefix}-drone-{i:02d}")
    await page.keyboard.press("q")
    await asyncio.sleep(1)

async def test_vehicle(page, prefix):
    """Try to mount vehicle."""
    await page.keyboard.press("g")
    await asyncio.sleep(2)
    await safe_shot(page, f"{prefix}-vehicle-try")
    await page.keyboard.press("w")
    await asyncio.sleep(1)
    await safe_shot(page, f"{prefix}-vehicle-drive")

async def test_pause(page, prefix):
    """Test pause menu."""
    await page.keyboard.press("Escape")
    await asyncio.sleep(1)
    await safe_shot(page, f"{prefix}-pause")
    await page.keyboard.press("Escape")
    await asyncio.sleep(1)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        page.on("pageerror", lambda err: errors.append(f"PAGE: {str(err)[:150]}"))
        
        # Load game
        await page.goto("http://127.0.0.1:3000", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(5)
        await safe_shot(page, "000-menu-main")
        
        count = 1
        
        for stage_idx, (stage_id, stage_name) in enumerate(STAGES):
            print(f"[QA] === STAGE {stage_idx}: {stage_name} ===")
            
            # --- NORMAL MODE ---
            print(f"[QA]   Loading stage (normal)...")
            await load_stage(page, stage_idx)
            await safe_shot(page, f"{count:04d}-s{stage_idx:02d}-{stage_id}-normal-load")
            count += 1
            
            print(f"[QA]   Normal gameplay burst...")
            await screenshot_burst(page, f"{count:04d}-s{stage_idx:02d}-{stage_id}-normal", count=15, interval=4)
            count += 15
            
            # --- GOD MODE ---
            print(f"[QA]   Toggling god mode...")
            await page.evaluate("if(typeof GameManager !== 'undefined' && GameManager.toggleGodMode) GameManager.toggleGodMode()")
            await asyncio.sleep(1)
            await safe_shot(page, f"{count:04d}-s{stage_idx:02d}-{stage_id}-god-on")
            count += 1
            
            await screenshot_burst(page, f"{count:04d}-s{stage_idx:02d}-{stage_id}-god", count=10, interval=4)
            count += 10
            
            # Turn off god mode
            await page.evaluate("if(typeof GameManager !== 'undefined' && GameManager.toggleGodMode) GameManager.toggleGodMode()")
            await asyncio.sleep(0.5)
            
            # --- WEAPONS ---
            print(f"[QA]   Weapon cycling...")
            await test_weapons(page, f"{count:04d}-s{stage_idx:02d}-{stage_id}")
            count += 9
            
            # --- DRONE ---
            print(f"[QA]   Drone mode...")
            await test_drone(page, f"{count:04d}-s{stage_idx:02d}-{stage_id}")
            count += 5
            
            # --- VEHICLE ---
            print(f"[QA]   Vehicle test...")
            await test_vehicle(page, f"{count:04d}-s{stage_idx:02d}-{stage_id}")
            count += 2
            
            # --- PAUSE ---
            print(f"[QA]   Pause menu...")
            await test_pause(page, f"{count:04d}-s{stage_idx:02d}-{stage_id}")
            count += 1
            
            # --- RETURN TO MENU ---
            print(f"[QA]   Back to menu...")
            await page.evaluate("""
                if(typeof GameManager !== 'undefined' && GameManager.togglePause) GameManager.togglePause();
                window.__QA_MODE = false;
                window.__QA_START_STAGE = null;
                gameState = 0;
                var menu = document.getElementById('main-menu');
                if(menu) menu.style.display = 'flex';
            """)
            await asyncio.sleep(3)
            await safe_shot(page, f"{count:04d}-s{stage_idx:02d}-{stage_id}-menu-return")
            count += 1
            
            print(f"[QA]   Stage done. Total: {len(screenshots)}")
        
        await browser.close()
        
        print(f"\n[QA] COMPLETE: {len(screenshots)} screenshots, {len(errors)} errors")
        print(f"[QA] Saved to: {QA_DIR}")
        print(f"[QA] First errors: {errors[:5]}")

if __name__ == "__main__":
    asyncio.run(main())
