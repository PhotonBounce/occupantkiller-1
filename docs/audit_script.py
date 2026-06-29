import re
import os

def main(ctx):
    filepath = r"D:\occupantkiller\occupantkiller\game-manager.js"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = content.split('\n')
    total_lines = len(lines)
    
    issues = []
    
    # ── 1. Very long functions ──
    func_matches = []
    for m in re.finditer(r'function\s+(\w+)\s*\([^)]*\)\s*\{', content):
        func_matches.append((m.start(), m.end(), m.group(1), 'named'))
    for m in re.finditer(r'(?:let|const|var)\s+(\w+)\s*=\s*function\s*\([^)]*\)\s*\{', content):
        func_matches.append((m.start(), m.end(), m.group(1), 'var_func'))
    
    def find_block_end(start_pos):
        depth = 1
        i = start_pos
        while i < len(content) and depth > 0:
            c = content[i]
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
            elif c == '"':
                i += 1
                while i < len(content) and content[i] != '"':
                    if content[i] == '\\': i += 1
                    i += 1
            elif c == "'":
                i += 1
                while i < len(content) and content[i] != "'":
                    if content[i] == '\\': i += 1
                    i += 1
            elif c == '`':
                i += 1
                while i < len(content) and content[i] != '`':
                    if content[i] == '\\': i += 1
                    i += 1
            elif c == '/' and i + 1 < len(content) and content[i+1] == '/':
                while i < len(content) and content[i] != '\n':
                    i += 1
            elif c == '/' and i + 1 < len(content) and content[i+1] == '*':
                i += 2
                while i + 1 < len(content) and not (content[i] == '*' and content[i+1] == '/'):
                    i += 1
                i += 1
            i += 1
        return i
    
    long_funcs = []
    for start, end_pos, name, typ in func_matches:
        block_end = find_block_end(end_pos)
        line_start = content[:start].count('\n') + 1
        line_end = content[:block_end].count('\n') + 1
        length = line_end - line_start + 1
        if length > 200:
            long_funcs.append((name, line_start, line_end, length))
    
    for name, ls, le, length in long_funcs:
        issues.append({
            'severity': 'High',
            'category': 'Long Function',
            'line': ls,
            'message': f"Function '{name}' is {length} lines (>200). Consider splitting into smaller functions."
        })
    
    # ── 2. Per-frame object allocation in update/threatBehind ──
    # Line 216: _updateThreatBehind creates new THREE.Vector3 every frame
    issues.append({
        'severity': 'High',
        'category': 'Performance',
        'line': 216,
        'message': "`_updateThreatBehind` allocates `new THREE.Vector3()` every frame for `getWorldDirection()`. Use a cached `_gmTmp` vector instead."
    })
    
    # Line 170: _spawnFootstepPuff creates new MeshBasicMaterial every time
    issues.append({
        'severity': 'High',
        'category': 'Performance',
        'line': 170,
        'message': "`_spawnFootstepPuff` creates `new THREE.MeshBasicMaterial()` on every footstep. Use a shared material with `opacity`/`color` tweaks, or a pre-allocated material pool."
    })
    
    # ── 3. Duplicate code in blockToMaterialName / blockToEconomyResource ──
    issues.append({
        'severity': 'Medium',
        'category': 'Duplicate Code',
        'line': 571,
        'message': "`blockToMaterialName` and `blockToEconomyResource` (lines 571, 582) share identical switch/mapping logic. Extract a single lookup table."
    })
    
    # ── 4. Duplicate spawn patterns in battlefield events ──
    issues.append({
        'severity': 'Medium',
        'category': 'Duplicate Code',
        'line': 344,
        'message': "`triggerBattlefieldEvent` (489 lines) contains ~12 nearly identical spawn loops (`Math.cos/sin * dist`). Extract a `spawnInCircle(type, count, radius)` helper."
    })
    
    # ── 5. beginWave is extremely long ──
    # Already captured by long function scan, but let's check if it's in the list
    begin_wave = [f for f in long_funcs if f[0] == 'beginWave']
    if not begin_wave:
        issues.append({
            'severity': 'Critical',
            'category': 'Long Function',
            'line': 3683,
            'message': "Function 'beginWave' is 923+ lines. This is a massive single function containing all stage-specific spawn logic. Extract stage-specific spawners into a dictionary or separate functions."
        })
    
    # ── 6. setupInput is extremely long ──
    setup_input = [f for f in long_funcs if f[0] == 'setupInput']
    if not setup_input:
        issues.append({
            'severity': 'Critical',
            'category': 'Long Function',
            'line': 1688,
            'message': "Function 'setupInput' is 825+ lines. Contains keyboard, mouse, touch, and gamepad handlers. Split into `setupKeyboard`, `setupMouse`, `setupTouch`, `setupGamepad`."
        })
    
    # ── 7. Unused / potentially unused variables ──
    unused_checks = [
        ('_waveStartTimer', 155, 'Declared but never referenced in code (grep shows no other usage)'),
        ('_musicIntTimer', 158, 'Declared but never referenced in code'),
        ('_defeatReason', 156, 'Declared but usage is minimal; verify if fully wired'),
    ]
    for name, line, msg in unused_checks:
        issues.append({
            'severity': 'Low',
            'category': 'Unused Variable',
            'line': line,
            'message': f"`{name}` — {msg}"
        })
    
    # ── 8. Magic numbers in main update loop ──
    # Check specific lines in the update loop
    magic_numbers = [
        (6395, '24', '_dropBy = (avgFps < 24) ? 2 : ... — "24" and "2" are magic numbers for FPS thresholds'),
        (6402, '3', '_highFpsStreak >= 3 — magic number for streak count'),
        (6444, '3', 'player.hp - 3 * delta — 3 HP/sec bleed is magic'),
        (6471, '3.0', 'player._radTimer >= 3.0 — radiation interval is magic'),
        (6493, '4.0', 'player._fireTimer >= 4.0 + Math.random() * 2 — fire interval is magic'),
        (6496, '0.25', 'Math.random() < 0.25 — fire exposure chance is magic'),
    ]
    for line, num, msg in magic_numbers:
        issues.append({
            'severity': 'Low',
            'category': 'Magic Number',
            'line': line,
            'message': f"Magic number `{num}`: {msg}. Should be a named constant."
        })
    
    # ── 9. Object allocation in beginWave / updateCombat ──
    # Find lines with new THREE.Vector3 in what appears to be the update loop or wave logic
    alloc_lines = []
    for i, line in enumerate(lines, 1):
        if 'new THREE.Vector3(' in line and i > 6370 and i < 8000:  # update loop range
            alloc_lines.append(i)
    if alloc_lines:
        issues.append({
            'severity': 'High',
            'category': 'Performance',
            'line': alloc_lines[0],
            'message': f"`new THREE.Vector3()` allocated {len(alloc_lines)} times inside the main game loop / updateCombat (lines {alloc_lines[0]}-{alloc_lines[-1]}). Use pre-allocated temp vectors."
        })
    
    # ── 10. beginWave has massive duplicate spawn logic ──
    # Count spawnSingle calls in beginWave
    spawn_single_count = 0
    for i in range(3683, 4607):
        if i < len(lines) and 'Enemies.spawnSingle(' in lines[i-1]:
            spawn_single_count += 1
    if spawn_single_count > 40:
        issues.append({
            'severity': 'Medium',
            'category': 'Duplicate Code',
            'line': 3683,
            'message': f"`beginWave` contains {spawn_single_count}+ `Enemies.spawnSingle()` calls with nearly identical position calculations. Extract per-stage spawn descriptors into data tables."
        })
    
    # ── 11. STAGES array hard-codes 7 waves for most stages ──
    issues.append({
        'severity': 'Low',
        'category': 'Magic Number',
        'line': 639,
        'message': "STAGES array hard-codes `wavesPerStage: 7` for 12 out of 20 stages. Most stages share identical lighting values too. Extract a `DEFAULT_STAGE` base object and use `Object.assign`."
    })
    
    # ── 12. `getWorldDirection(new THREE.Vector3())` in updateHandGrenades ──
    issues.append({
        'severity': 'Medium',
        'category': 'Performance',
        'line': 8722,
        'message': "`updateHandGrenades` allocates `new THREE.Vector3()` for `getWorldDirection()`. Use a cached temp vector."
    })
    
    # ── 13. `new THREE.Vector3()` in update loop line 7037 ──
    issues.append({
        'severity': 'High',
        'category': 'Performance',
        'line': 7037,
        'message': "`new THREE.Vector3()` allocated inside `update()` (dust particle position). Use a pre-allocated temp vector."
    })
    
    # ── 14. `updatePlayer` and `updateCombat` length ──
    update_player = [f for f in long_funcs if f[0] == 'updatePlayer']
    if update_player:
        issues.append({
            'severity': 'High',
            'category': 'Long Function',
            'line': update_player[0][1],
            'message': f"`updatePlayer` is {update_player[0][3]} lines. Contains movement, physics, camera, swimming, mantling, and vehicle logic. Split into sub-functions."
        })
    
    update_combat = [f for f in long_funcs if f[0] == 'updateCombat']
    if update_combat:
        issues.append({
            'severity': 'High',
            'category': 'Long Function',
            'line': update_combat[0][1],
            'message': f"`updateCombat` is {update_combat[0][3]} lines. Contains shooting, reloading, melee, heat, mantling, bayonet, and cover logic. Split into sub-functions."
        })
    
    # ── 15. `onWaveComplete` is very long ──
    on_wave = [f for f in long_funcs if f[0] == 'onWaveComplete']
    if on_wave:
        issues.append({
            'severity': 'High',
            'category': 'Long Function',
            'line': on_wave[0][1],
            'message': f"`onWaveComplete` is {on_wave[0][3]} lines. Handles scoring, loot drops, stage transitions, and narrative. Split into smaller lifecycle hooks."
        })
    
    # Sort by severity
    severity_order = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}
    issues.sort(key=lambda x: severity_order.get(x['severity'], 99))
    
    # Deduplicate by message
    seen = set()
    deduped = []
    for issue in issues:
        key = issue['message'][:80]
        if key not in seen:
            seen.add(key)
            deduped.append(issue)
    
    top_issues = deduped[:15]
    
    # Build report
    report_lines = [
        "# Code Quality Audit — `game-manager.js`",
        "",
        f"**File:** `D:\\occupantkiller\\occupantkiller\\game-manager.js`  ",
        f"**Lines:** {total_lines}  ",
        f"**Issues Found:** {len(deduped)} (top {len(top_issues)} shown)  ",
        "",
        "| # | Severity | Category | Line | Issue |",
        "|---|----------|----------|------|-------|",
    ]
    for idx, issue in enumerate(top_issues, 1):
        msg = issue['message'].replace('|', '\\|')
        report_lines.append(f"| {idx} | {issue['severity']} | {issue['category']} | {issue['line']} | {msg} |")
    
    report_lines.extend([
        "",
        "## Summary of Top 5 Concerns",
        "",
        "1. **Massive Functions (`beginWave` ~923 lines, `setupInput` ~825 lines):** These are impossible to unit-test and extremely brittle. `beginWave` should use a data-driven spawn table per stage. `setupInput` should be split by input type.",
        "",
        "2. **Per-Frame Object Allocation (`new THREE.Vector3` in `updateThreatBehind`, `update` loop):** Creating Vector3 objects inside the main loop and threat detection causes GC stutter. Use the pre-allocated `_gmTmp1–3` vectors instead.",
        "",
        "3. **Per-Event Material Allocation (`_spawnFootstepPuff`):** Every footstep spawns a new `MeshBasicMaterial`. With 24 puffs max, this creates unnecessary GPU memory pressure. Pool materials and vary opacity.",
        "",
        "4. **Duplicate Spawn Logic:** `triggerBattlefieldEvent` and `beginWave` repeat the same `Math.cos/sin * radius` spawn pattern dozens of times. Extract `spawnCircle(count, type, radius)` and `spawnLine(count, type, spacing)` helpers.",
        "",
        "5. **Dead Code / Unused Variables:** `_waveStartTimer`, `_musicIntTimer` are declared but never wired. They add cognitive load and suggest unfinished features that should be removed or implemented.",
        "",
        "## Recommendations",
        "",
        "- **Refactor `beginWave`**: Replace the giant switch/if ladder with a `STAGE_SPAWN_CONFIGS` array of descriptors. Each descriptor lists enemy types, counts, and formations. A single loop reads the config and spawns.",
        "- **Extract input handlers**: `setupInput` → `setupKeyboard()`, `setupMouse()`, `setupTouch()`, `setupGamepad()`. Each returns a cleanup function.",
        "- **Use object pools**: For footstep puffs, loot particles, and temporary vectors, create pools at init time rather than allocating per frame.",
        "- **Magic number constants**: Define `const FPS_SEVERE = 24`, `const FPS_HIGH = 52`, `const BLEED_DPS = 3`, etc. in a `CONFIG` block at the top.",
    ])
    
    os.makedirs(r"D:\occupantkiller\occupantkiller\docs", exist_ok=True)
    report_path = r"D:\occupantkiller\occupantkiller\docs\code-quality-audit.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report_lines))
    
    return {
        'report_path': report_path,
        'total_lines': total_lines,
        'issues_found': len(deduped),
        'top_issues': top_issues[:5]
    }
