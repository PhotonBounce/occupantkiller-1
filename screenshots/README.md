# OccupantKiller Screenshot Gallery — What to Capture

The WebBridge browser extension was not available during this session, so screenshots could not be taken automatically. Below is a checklist of what to screenshot manually by opening the game at `http://localhost:3000`.

## Start Menu Screenshots

1. **Start Menu — Main Screen**
   - Navigate to `http://localhost:3000`
   - Screenshot the full start menu with voxel-style background, title, and buttons
   - Expected: Dark background with animated voxel grid, "OCCUPANT KILLER" title, 6 buttons

2. **Start Menu — Hover Effects**
   - Hover over each button and screenshot the glow/scale animation

3. **Start Menu — Settings Panel**
   - Click "SETTINGS" button
   - Screenshot the settings sub-panel

4. **Start Menu — Leaderboard Panel**
   - Click "LEADERBOARD" button
   - Screenshot the leaderboard sub-panel

5. **Start Menu — Credits Panel**
   - Click "CREDITS" button
   - Screenshot the credits sub-panel

## Pause Menu Screenshots

6. **Pause Menu — In-Game**
   - Start a new game, press ESC
   - Screenshot the pause overlay with blur backdrop
   - Expected: "PAUSED" title, resume/restart/settings/inventory/quit buttons

7. **Pause Menu — Stats Panel**
   - Look at the right-side stats panel showing wave, kills, score, time

8. **Pause Menu — Mission Objectives Panel**
   - Look at the left-side mission objectives panel

## Weapon Screenshots

9. **Weapon — AK-74 in Hand**
   - Start game, select AK-74 (default weapon)
   - Screenshot the detailed voxel model with stock, magazine, sights

10. **Weapon — AK-74 Zoom/ADS Mode**
    - Right-click to zoom in
    - Screenshot the ADS view showing the improved sight alignment (no size decrease)

11. **Weapon — RPG-7**
    - Switch to RPG-7
    - Screenshot the launcher with heat shield, optic, grip details

12. **Weapon — PKM Machine Gun**
    - Switch to PKM
    - Screenshot with bipod, belt feed, stock details

13. **Weapon — SVD Sniper**
    - Switch to SVD
    - Screenshot with scope mount, wood stock, long barrel

14. **Weapon — Recoil Animation**
    - Fire a weapon and screenshot mid-recoil showing bolt/slide movement

## City/Building Screenshots

15. **Hostomel Airport — Terminal**
    - Select Hostomel Airport stage
    - Screenshot the Antonov Airport Terminal building

16. **Hostomel Airport — Hangar 1 (An-225)**
    - Screenshot Hangar 1 with burned earth around it

17. **Hostomel Airport — Control Tower**
    - Screenshot the damaged control tower

18. **Hostomel Airport — Battlefield Wrecks**
    - Screenshot BMD/BTR wrecks and Mi-8 helicopter wreck

19. **Hostomel Airport — Trenches**
    - Screenshot Ukrainian defensive trenches and sandbag positions

20. **Kyiv — Maidan + St. Sophia**
    - Select Kyiv stage
    - Screenshot Maidan Nezalezhnosti with Independence Monument
    - Screenshot St. Sophia Cathedral

21. **Kyiv — Pechersk Lavra**
    - Screenshot the Pechersk Lavra complex

22. **Kyiv — Motherland Monument**
    - Screenshot the Motherland Monument (62m tall in game)

23. **Kyiv — Dnipro River**
    - Screenshot the Dnipro River with hills on west bank

24. **Moscow — Kremlin + Red Square**
    - Select Moscow stage
    - Screenshot Kremlin walls with cathedrals inside
    - Screenshot St. Basil's Cathedral on Red Square

25. **Moscow — Lubyanka FSB**
    - Screenshot the Lubyanka building

26. **Mariupol — Azovstal Plant**
    - Select Mariupol stage
    - Screenshot the Azovstal blast furnace hall

27. **Mariupol — Drama Theater (Ruins)**
    - Screenshot the ruined Drama Theater

28. **Mariupol — Sea of Azov Coast**
    - Screenshot the coastline with water

29. **Bakhmut — Fortress Ruins**
    - Select Bakhmut stage
    - Screenshot the heavily ruined cityscape

30. **Kherson — Antonivsky Bridge**
    - Select Kherson stage
    - Screenshot the Antonivsky Bridge over Dnipro

31. **Sevastopol — Naval Base**
    - Select Sevastopol stage
    - Screenshot shipyard dry docks and submarine pens

## Road/Vehicle Screenshots

32. **Roads — Kyiv Khreshchatyk**
    - Screenshot the main road with asphalt and guardrails

33. **Vehicle on Road — Tank**
    - Wait for enemy tank to spawn (wave 3+)
    - Screenshot tank driving on road (not on random terrain)

34. **Vehicle on Road — BMP Convoy**
    - Screenshot multiple BMPs following road waypoints

## Mission Screenshots

35. **Mission — Hostomel VDV Defense**
    - Screenshot the mission tracker showing "Defend Antonov Airport from VDV Assault"

36. **Mission — Kyiv St. Sophia Defense**
    - Screenshot mission showing "Defend St. Sophia Cathedral"

## Performance/HUD Screenshots

37. **HUD — Extended Display**
    - Screenshot the full HUD with health, ammo, compass, minimap, mission tracker

38. **HUD — Damage Effects**
    - Take damage and screenshot the blood drops + screen shake + suppression blur

39. **HUD — Kill Streak Banner**
    - Get 3+ rapid kills and screenshot the streak banner

40. **HUD — Wave Clear**
    - Complete a wave and screenshot the wave clear overlay

---

## How to Take Screenshots

### Option 1: Browser DevTools
1. Open `http://localhost:3000` in Chrome/Edge
2. Press F12 to open DevTools
3. Click the "..." menu → "Run command" → type "screenshot" → "Capture full size screenshot"

### Option 2: Windows Snipping Tool
1. Press `Win + Shift + S`
2. Select the game area
3. Save to this folder

### Option 3: Game Built-in (if available)
Check if the game has a screenshot key (often `F12` or `PrtScn`)

---

Save all screenshots to this folder with descriptive names:
`01-start-menu-main.png`, `02-pause-menu.png`, `03-weapon-ak74.png`, etc.

## Expected Results After Recent Changes

- **Buildings**: 600+ realistic buildings across 20 cities with landmark references
- **Roads**: 200+ road networks, tanks/BMPs restricted to roads only
- **Weapons**: Detailed voxel models with ~40-60 extra mesh primitives per gun, recoiling bolt/slide parts, realistic ADS alignment
- **Menus**: Modern voxel-style start/pause menus with animated backgrounds
- **Terrain**: Dnipro River in Kyiv, Moskva River in Moscow, Sea of Azov in Mariupol, Bakhmutka River in Bakhmut
- **Missions**: City-aware landmark missions ("Defend St. Sophia", "Clear Azovstal")
