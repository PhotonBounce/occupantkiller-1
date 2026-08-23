/**
 * weapon-codex.js — In-game weapon field manual
 * Toggle with F1. Full-screen overlay with weapon list + detail card.
 * IIFE pattern, all var.
 */
window.WeaponCodex = (function () {
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var _overlay = null;
  var _visible = false;
  var _selectedIdx = 0;
  var _weaponList = [];
  var _listItems = [];

  // ── Lore database ─────────────────────────────────────────────────────────
  var LORE = {
    'AK74':         { text: 'Soviet-era 5.45mm assault rifle. The workhorse of Russian ground forces since 1974. Reliable in mud, dust, and sub-zero temperatures. Widely used by both sides.',         tip: 'Tap-fire at range, go full-auto in close quarters.' },
    'AK12':         { text: 'Modernised AK platform with updated ergonomics and Picatinny rails. Standard rifle of the Russian Army since 2018. Encountered across the front lines.',                   tip: 'Improved accuracy over AKM — use short bursts at 200m+.' },
    'AKM':          { text: 'Mass-produced AK-47 variant. 7.62x39mm round hits harder but drops faster. What most Russian conscripts and older units carry. Captured examples are primary loot.',       tip: 'Aim for centre mass — bullet drop is significant past 300m.' },
    'AKS74U':       { text: 'Compact Krinkov carbine variant. Favoured by vehicle crews, paratroopers, and urban operators. Higher muzzle flash and louder than AK-74 due to short barrel.',           tip: 'Devastating inside buildings. Swap to longer rifle outdoors.' },
    'AN94':         { text: 'Russian AN-94 Abakan. Fires a 2-round hyperburst at 1800rpm before cycling. Used by Spetsnaz and elite units. Unusual pulley-delay blowback mechanism.',                  tip: 'First two rounds land almost identically — aim is true then compensate recoil.' },
    'RPK74':        { text: 'Squad automatic weapon version of the AK-74. Longer barrel, heavier, bipod-capable. Provides suppression at the squad level with standard 5.45mm magazines.',             tip: 'Prone + bipod setup gives best accuracy. Conserve ammo — 45-round mag goes fast.' },
    'PKM':          { text: 'Belt-fed 7.62x54mmR machine gun. The backbone of Russian fire support teams. High sustained fire rate but heavy and slow to reposition. Ubiquitous in Ukraine.',           tip: 'Lay suppressing fire to pin enemies while friendlies flank.' },
    'PKPECHENEG':   { text: 'Improved PKM variant with fixed heavy barrel and integral bipod. Better accuracy in sustained fire. Used extensively by Russian forces in Ukraine since 2014.',             tip: 'Fixed barrel means no barrel swaps needed — sustain fire longer than standard PKM.' },
    'SVD':          { text: 'Dragunov sniper rifle. Semi-automatic, fires 7.62x54mmR. The standard Russian designated-marksman rifle since 1963. Reliable, accurate to 800m, widely distributed.', tip: 'Aim for head or upper chest. Semi-auto lets you follow up quickly.' },
    'BARRETTM82':   { text: 'Barrett M82 .50 BMG anti-materiel rifle. Can defeat light vehicles, radar systems, and parked aircraft. Donated to Ukraine. Effective to 1800m.',                        tip: 'One shot can stop vehicles. Use sparingly — ammo is precious.' },
    'MAKAROV':      { text: 'Soviet 9x18mm service pistol since 1951. Simple, robust, and still in widespread use. Officers, tankers, and crew-served weapon teams carry these as sidearms.',           tip: 'Use as a last resort or when reloading primary weapon takes too long.' },
    'GLOCK':        { text: 'Glock 17 9mm. NATO-standard sidearm supplied in large numbers. Polymer frame, 17-round magazine. Reliable in all conditions.',                                            tip: 'Higher magazine capacity than Makarov — prefer it when available.' },
    'MP5':          { text: 'Heckler & Koch MP5 9mm. Classic SMG used by police and special forces worldwide. Compact and controllable. Limited in range but excellent in CQB.',                       tip: 'Ideal for building clearance at under 50m.' },
    'MP7':          { text: 'HK MP7A2 using 4.6x30mm armour-piercing rounds. Supplied by Germany. Compact enough for vehicle crews and special forces. Penetrates CRISAT body armour.',               tip: 'AP rounds partially defeat body armour at close range.' },
    'P90':          { text: 'FN P90 5.7x28mm PDW. 50-round top-loading magazine. Compact, bullpup design originally for vehicle crews and support personnel. Used by special forces.',                 tip: '50-round mag means fewer reloads — keep shooting.' },
    'NLAW':         { text: 'Next-generation Light Anti-Tank Weapon. Single-shot, disposable, Overfly Top Attack mode defeats tank roof armour. Supplied by UK. Over 10,000 sent to Ukraine.',         tip: 'Aim slightly above tank roofs — OTA warhead fires down into thin top armour.' },
    'STUGNA':       { text: 'Ukrainian-produced laser-guided ATGM. Operator stays behind cover and guides via camera system. Proved highly effective against Russian armour in 2022.',                  tip: 'Guide from concealment — you are safe while the missile is in flight.' },
    'JAVELIN':      { text: 'FGM-148 Javelin fire-and-forget ATGM. Top-attack mode. Lock on, fire, and move. The defining weapon of 2022. Over 8,500 delivered to Ukraine by the US alone.',          tip: 'Fire from cover, relocate immediately — the missile guides itself.' },
    'RPG7':         { text: 'RPG-7 — the most widely manufactured anti-tank weapon in history. 40mm rocket, reloadable launcher. Both sides carry these. Effective against light vehicles and infantry.', tip: 'Lead moving targets. Account for the slight rocket climb on launch.' },
    'RPG26':        { text: 'Single-shot disposable 72.5mm rocket. Lighter and simpler than RPG-7 — fire and discard the tube. Used by both sides throughout the conflict.',                           tip: 'No reload possible — make the shot count before engaging.' },
    'RPG29':        { text: 'RPG-29 Vampir. 105mm tandem HEAT warhead defeats ERA-equipped T-72, T-80, and T-90. Two-piece tube design. Used by Russian forces and occasionally by Ukrainian units.', tip: 'Tandem warhead first defeats ERA, second penetrates main armour.' },
    'M72LAW':       { text: 'Lightweight disposable AT rocket from the US/NATO arsenal. One-shot, then drop it. Supplied in large numbers to Ukraine. Simple to operate, effective against APCs.',     tip: 'Easy to carry several — stock up before armour-heavy missions.' },
    'AT4':          { text: 'AT4 recoilless rifle. 84mm projectile, single-shot disposable. Widely supplied. More powerful than M72 LAW. Common on Ukrainian defensive lines.',                       tip: 'Effective against thin-skinned vehicles. Aim for engine compartment.' },
    'PANZERFAUST3': { text: 'German Panzerfaust 3 donated to Ukraine. Tandem-charge warhead defeats ERA-protected tanks. Sophisticated safety system and sighting optics.',                           tip: 'Pre-arm before engagement — safety procedure is critical.' },
    'CARLGUSTAF':   { text: '84mm recoilless rifle supplied by US, Sweden, and others. Versatile multi-role platform — anti-armour, anti-bunker, area denial. Reloadable unlike most RPGs.',         tip: 'Versatile loadout — switch between HEAT and HE rounds for different targets.' },
    'GP25':         { text: 'GP-25 underbarrel grenade launcher for AK family. 40mm VOG grenade, effective to 400m. Gives riflemen indirect fire capability. Standard on many Russian rifles.',       tip: 'Lob rounds over walls and into trenches. Indirect fire wins urban combat.' },
    'AGS17':        { text: 'AGS-17 Plamya automatic grenade launcher. Belt-fed, tripod-mounted. Saturates an area with 30mm grenades. Devastating against infantry in the open.',                   tip: 'Walk fire across enemy positions — accuracy matters less than volume.' },
    'MG3':          { text: 'German MG3 — modern form of the WW2 MG42. Up to 1300rpm. Supplied to Ukraine. Distinctive sound recognisable from hundreds of metres. Extreme firepower.',              tip: 'Ammunition burns fast at maximum rate — train to fire in controlled bursts.' },
    'M240B':        { text: 'NATO 7.62mm belt-fed GPMG. Supplied to Ukraine. Reliable in sustained fire, accurate at 800m. Standard US infantry support weapon since 1977.',                         tip: 'Best at 200-600m against exposed infantry. Prone for best accuracy.' },
    'DSHK':         { text: 'Soviet DShK 12.7mm heavy machine gun. "Dushka" — the Darling. Mounted on vehicles, fortifications, and anti-aircraft tripods. Both sides use these extensively.',       tip: 'Effective against infantry to 2000m and aircraft at lower altitudes.' },
    'NSVHMG':       { text: 'NSV/Utyes 12.7mm HMG. Lighter than DShK, more stable on vehicles. Used by Russian forces on BMP-2, BTR-80 and as ground mounts throughout Ukraine.',                  tip: 'Longer range than PKM — use to suppress at extreme distances.' },
    'KORD':         { text: 'Kord 12.7x108mm HMG. Successor to NSV. Lighter and more accurate than DShK. Found on T-80/T-90/BTR-82A. Effective against infantry and light armour to 2000m.',       tip: 'Vehicle-mounted version allows fire on the move — dismount only if needed.' },
    'BROWNING_M2':  { text: 'M2HB Browning .50 cal. "Ma Deuce" — in service since 1933. Mounted on US-supplied HMMWVs, M113s, and M2 Bradleys in Ukraine. Devastating reliability.',                tip: 'Sustained fire possible — use it. Long burst accuracy degrades at 800m+.' },
    'MINIGUN':      { text: 'M134 Minigun six-barrel Gatling system. Vehicle/helicopter mounted. 6000rpm maximum. Ammunition consumption is phenomenal — supply logistics is the challenge.',          tip: 'Spin-up takes 0.3s — anticipate and trigger early in fast engagements.' },
    'GATLING':      { text: 'Six-barrel electric Gatling machine gun. Extreme fire rate requires constant ammo resupply. Not a weapon for conventional infantry — a force-multiplier emplacement.',   tip: 'Optimal at 50-200m where sheer volume overcomes any cover.' },
    'IGLA':         { text: 'Igla 9K38 MANPADS. Shoulder-fired IR-guided surface-to-air missile. Russian-origin. Both sides employ these against aircraft and helicopter threats.',                    tip: 'Wait for engine tone lock before firing — cold-weather acquisition takes longer.' },
    'STINGER':      { text: 'FIM-92 Stinger MANPADS. American IR-guided SAM. Over 1400 delivered to Ukraine. Shoulder-fired. Heat-seeking. Effective against helicopters and low-flying jets.',      tip: 'Acquire a heat lock before firing — track exhaust signature for best results.' },
    'STARSTREAK':   { text: 'UK Thales Starstreak HVM. Fires 3 laser-guided tungsten darts at Mach 3.5. Supplied to Ukraine for drone and helicopter defence in 2022. High kill probability.',       tip: 'Three simultaneous penetrators make evasion very difficult.' },
    'MALYUK':       { text: 'Ukrainian Malyuk (Vulcan) bullpup. Compact, ergonomic, domestically produced for the UAF. Takes standard AK magazines. Short overall length suits vehicle operators.',   tip: 'Bullpup balance takes adjustment — dry-fire training improves transition speed.' },
    'HK416':        { text: 'German HK416 A5 piston-driven assault rifle. Highly reliable in harsh conditions. Supplied to Ukraine via Germany and NATO partners. Preferred by many special units.',   tip: 'Piston operation runs cleaner than DI — higher sustained accuracy.' },
    'M4A1':         { text: 'M4A1 5.56mm carbine. The standard US infantry rifle. Hundreds of thousands supplied to Ukraine. Lightweight, accurate, with full-auto capability and modular rails.',    tip: 'Full-auto in close quarters only. Mid-range prefers burst or semi.' },
    'SCARH':        { text: 'FN SCAR-H 7.62x51mm. Heavy variant with greater stopping power than 5.56mm. Supplied to Ukrainian special operations forces. 20-round magazine.',                        tip: 'Heavier round retains energy at 500m+ — choose for long-range engagements.' },
    'TAVOR_X95':    { text: 'IWI Tavor X95 Israeli bullpup. Compact 590mm overall, reliable in urban environments. Supplied through various channels. Used by Ukrainian special units.',               tip: 'Short overall length aids in vehicle exfiltration and building entry.' },
    'VSS':          { text: 'VSS Vintorez silent sniper/assault rifle. 9x39mm subsonic. Integral suppressor. Standard kit for Russian FSB and Spetsnaz. Quiet at 50m, audible at 200m.',             tip: 'Sub-sonic round limits range to 300m — close to your target before engaging.' },
    'CROSSBOW':     { text: 'Tactical crossbow. Silent, reusable bolts. Effective at eliminating sentries without alerting nearby positions. Niche but valuable in infiltration operations.',           tip: 'One bolt, one kill. Retrieve bolts after engagement to resupply.' },
    'THROWKNIFE':   { text: 'Throwing knife. Silent, instant, reusable. Infiltration operators carry several. Effective inside 15m against unarmoured targets. No ammunition required.',               tip: 'Headshots instant-kill — practice timing on moving targets.' },
    'DOUBLEBARREL': { text: 'IZh-43 12-gauge double-barrel shotgun. Civilian weapon pressed into service by Territorial Defence Forces in 2022. Devastating inside 20m. Two shots and reload.',       tip: 'Two fast shots then break and reload. Do not miss — there is no third shot.' },
    'KS23':         { text: 'KS-23 4-gauge law-enforcement combat shotgun. Massive 23mm bore. Russian design for prison guards and MVD. Captured examples used by Ukrainian forces.',                  tip: 'Three shells then reload. Each shot stops anything in the open at under 30m.' },
    'FORT500':      { text: 'Fort-500 Ukrainian-made pump-action shotgun. Domestic production by Fort Technologies in Vinnytsia. Armed Territorial Defense Forces and police. Reliable indigenous design.', tip: 'Five-round capacity — use the pump between shots, do not rush.' },
    'MOLOTOV':      { text: 'Improvised incendiary — the iconic Ukrainian resistance weapon of 2022. Petrol in a bottle, cloth wick. Cheap, effective, terrifying. Used by civilian defenders in Kyiv.', tip: 'Throw at the ground in front of enemies — fire spreads on impact.' },
    'FLAMETHROWER': { text: 'RPO-A Shmel thermobaric rocket. Single-shot disposable infantry rocket. Overpressure blast in enclosed spaces is devastating. Vaporises occupants of vehicles and bunkers.', tip: 'Lethal indoors — a single round clears a room or bunker.' },
    'CLAYMORE':     { text: 'M18A1 Claymore directional fragmentation mine. 700 steel balls at 1200m/s across a 60-degree arc. Classic NATO ambush weapon. Supplied to Ukraine.',                    tip: 'FRONT TOWARD ENEMY. Set up at chokepoints and retreat before detonating.' },
    'MINES':        { text: 'Anti-personnel mine. Set and forget. Ukraine and Russia have both laid millions of mines — one of the most persistent hazards of this conflict.',                          tip: 'Mark placement on mental map — friendly forces must know their location.' },
    'SMOKE':        { text: 'Smoke grenade. M18-type. Creates concealment cloud lasting 60-90 seconds. Used for cover during movement, marking, and obscuring optics.',                               tip: 'Throw between you and the threat. Move through smoke, not around it.' },
    'FLASHBANG':    { text: 'M84 stun grenade. 6-8 million candela flash, 170dB bang. Temporarily blinds and deafens. Room entry fundamental for special operations.',                                tip: 'Cook 1 second before throwing into a room. Enter immediately after detonation.' },
    'RGD5':         { text: 'Soviet RGD-5 fragmentation grenade. Standard across former Soviet armies. Effective blast radius ~15m. Both sides carry and use these extensively in trench fighting.',   tip: 'Count 2 seconds after pin pull before throwing to deny enemy time to throw back.' },
    'F1_GRENADE':   { text: 'Soviet F-1 "Limonka" fragmentation grenade. Heavier frag pattern than RGD-5. Lethal radius ~5m, casualty radius ~20m. Thousands stockpiled by both sides.',            tip: 'More powerful than RGD-5 — use in the open, not in buildings you occupy.' },
    'M67_GRENADE':  { text: 'US M67 spherical fragmentation grenade. NATO standard. Over a million delivered to Ukraine. Lethal radius ~5m, casualty radius ~15m.',                                   tip: 'Spherical body rolls after landing — aim uphill or into corners to prevent rolling back.' },
    'AGS17':        { text: 'AGS-17 automatic grenade launcher. 30mm VOG grenades, belt-fed. Devastating against infantry in the open or in light fortifications.',                                   tip: 'Set up in a dominant position and walk fire along enemy trenches.' },
    'C4':           { text: 'C4 plastic explosive. Placed manually, detonated remotely. Ideal for destroying vehicles, bridges, and fortifications. American-supplied demolition charge.',             tip: 'Place on vehicle fuel tanks or ammunition storage for secondary explosions.' },
    'HIMARS':       { text: 'M142 HIMARS. GPS-guided GMLRS rockets to 84km. The decisive strategic weapon of 2022. Destroyed over 400 Russian ammo dumps and command posts in summer 2022.',          tip: 'One shot, one high-value target. Reserve for armoured concentrations and supply depots.' },
    'BM21_GRAD':    { text: 'BM-21 Grad 122mm 40-round MLRS. Russia\'s most-used artillery system in Ukraine — responsible for the majority of civilian casualties. Wide-area saturation fire.',      tip: 'Salvo fire covers an enormous area — use against massed infantry or vehicle parks.' },
    'SPIKE_LR':     { text: 'Spike LR Israeli fire-and-forget ATGM. Lock on, fire and move immediately. Top-attack mode defeats ERA. Range 200-4000m. Extensively used by Ukraine.',                  tip: 'Fire and immediately relocate — the missile is fully autonomous after launch.' },
    'MILAN':        { text: 'Franco-German MILAN wire-guided ATGM. Tandem warhead, SACLOS guidance. Germany, France, and Belgium supplied hundreds to Ukraine. Proven Western AT system.',            tip: 'Guide on a smooth track — jerky inputs cause the missile to miss.' },
    'TOW_BGM71':    { text: 'BGM-71 TOW ATGM. US wire-guided missile. Thousands supplied to Ukraine. BGM-71F warhead penetrates 900mm RHA. Range 3750m. In service since 1970.',                     tip: 'Maintain line-of-sight to target for the full guidance period — do not flinch.' },
    'KORNET':       { text: 'Russian 9M133 Kornet laser-guided ATGM. Dual tandem warhead defeats ERA. Used by Russian forces to destroy Ukrainian armour; captured units used by Ukraine.',           tip: 'Laser beam-riding — hold the beam steady on target until impact.' },
    'SPG9':         { text: 'SPG-9 Kopye 73mm recoilless rifle. Tripod or vehicle-mounted. Both Ukrainian and Russian forces use these for AT and bunker-busting. Widely available.',                 tip: 'Heat signature from backblast reveals position — relocate after firing.' },
    'FPV_DRONE':    { text: 'FPV kamikaze drone carrying RKG-3 grenade or PG-7 warhead. The most prolific weapon of 2024-2025 Ukraine war. Low cost, high lethality. Operator uses FPV goggles.', tip: 'Attack from above or behind where armour is thinnest.' },
    'SWITCHBLADE300': { text: 'AeroVironment Switchblade 300 loitering munition. Tube-launched, electric propulsion. Anti-personnel warhead. Over 700 sent to Ukraine. Operator-guided to target.', tip: 'Circle the target area to acquire before committing to the attack run.' },
    'DRONEJAMMER':  { text: 'EMP pulse rifle designed to disable enemy drone electronics. Fires a directed electromagnetic burst in a forward cone. Disables RF-controlled systems and electronics.', tip: 'Aim at drones flying under 200m — line-of-sight required for effect.' },
    'AXE':          { text: 'Combat axe. High single-hit damage in close quarters. Brutal effectiveness in trench fighting — and silent. Some Ukrainian Territorial Defense units carry hatchets.', tip: 'One heavy swing versus the reload option. Commit fully.' },
    'SHOVEL':       { text: 'MPL-50 military entrenching tool. The iconic Soviet spade-bayonet. Sharpened edges make it a lethal melee weapon in trench warfare. Both sides use these.',             tip: 'Silent and always available. Use when primary weapon is empty or jammed.' },
    'MAXIM1910':    { text: 'WW1-era Maxim M1910 water-cooled machine gun — still seen in Ukraine. Belt-fed, tripod-mounted. Filmed in combat 2022-2024. Soviet doctrine: never discard functional equipment.', tip: 'Water cooling allows indefinite sustained fire — use the belt fully.' },
    'STUGNA':       { text: 'Ukrainian Stugna-P ATGM. Laser beam-riding guidance. Operator stays behind cover watching a camera feed. Proved highly effective in 2022 against Russian column armour.', tip: 'Use remote camera system — keep launcher behind cover, guide via display.' },
    'M134':         { text: 'M134 Minigun. Helicopter or vehicle mounted electrically-driven six-barrel Gatling. 6000rpm. Requires vehicle power source — cannot be man-portable.',                   tip: 'Spin up before engaging — motor takes 0.3 seconds to reach firing speed.' }
  };

  // ── Category mapping ──────────────────────────────────────────────────────
  var CATEGORIES = {
    'ASSAULT': 'ASSAULT RIFLE',
    'RIFLE':   'ASSAULT RIFLE',
    'NATO':    'ASSAULT RIFLE',
    'NATO_HEAVY': 'ASSAULT RIFLE',
    'SMG':     'SMG',
    'PISTOL':  'PISTOL',
    'SNIPER':  'SNIPER',
    'AMR':     'SNIPER',
    'LMG':     'LMG',
    'HMG':     'LMG',
    'HMG_HEAVY': 'LMG',
    'MACHINEGUN': 'LMG',
    'MINIGUN': 'LMG',
    'GATLING': 'LMG',
    'AT':      'LAUNCHER',
    'AT_LIGHT': 'LAUNCHER',
    'AT_HEAVY': 'LAUNCHER',
    'ATGM':    'LAUNCHER',
    'AA':      'LAUNCHER',
    'GRENADE': 'LAUNCHER',
    'MINE':    'SPECIAL',
    'EXPLOSIVE': 'SPECIAL',
    'INCENDIARY': 'SPECIAL',
    'THERMOBARIC': 'SPECIAL',
    'SMOKE':   'SPECIAL',
    'FLASHBANG': 'SPECIAL',
    'SILENT':  'SPECIAL',
    'JAMMER':  'SPECIAL',
    'MELEE':   'SPECIAL',
    'SHOTGUN': 'SPECIAL',
    'CROSSBOW': 'SPECIAL'
  };

  var CATEGORY_ORDER = ['ASSAULT RIFLE', 'SMG', 'PISTOL', 'SNIPER', 'LMG', 'LAUNCHER', 'SPECIAL'];

  var CATEGORY_ICONS = {
    'ASSAULT RIFLE': '⚔',
    'SMG':           '🔫',
    'PISTOL':        '🔒',
    'SNIPER':        '🎯',
    'LMG':           '💥',
    'LAUNCHER':      '🚀',
    'SPECIAL':       '⚡'
  };

  // ── Stat bar renderer ─────────────────────────────────────────────────────
  function renderBar(value, max, filled, empty) {
    var segments = 10;
    var count = Math.round((value / max) * segments);
    if (count < 0) count = 0;
    if (count > segments) count = segments;
    var bar = '';
    for (var i = 0; i < segments; i++) {
      bar += (i < count) ? (filled || '█') : (empty || '░');
    }
    return bar;
  }

  function getRangeLabel(spread) {
    if (spread <= 0.005) return 'EXTREME';
    if (spread <= 0.018) return 'LONG';
    if (spread <= 0.035) return 'MEDIUM';
    return 'CLOSE';
  }

  function getRecoilLabel(recoilY) {
    if (recoilY <= 0.005) return 'NEGLIGIBLE';
    if (recoilY <= 0.015) return 'LOW';
    if (recoilY <= 0.025) return 'MEDIUM';
    if (recoilY <= 0.040) return 'HIGH';
    return 'EXTREME';
  }

  function getAccuracy(spread) {
    // Invert spread into accuracy score 0-100
    var score = Math.max(0, Math.min(100, Math.round((1 - (spread / 0.12)) * 100)));
    return score;
  }

  function getDamageMax(weapons) {
    var max = 0;
    for (var i = 0; i < weapons.length; i++) {
      if (weapons[i].damage > max) max = weapons[i].damage;
    }
    return max;
  }

  // ── Build weapon array from window.Weapons or fallback to built-in list ───
  function buildWeaponList() {
    var list = [];
    if (window.Weapons && typeof window.Weapons.getWeaponCount === 'function') {
      var count = window.Weapons.getWeaponCount();
      for (var i = 0; i < count; i++) {
        var def = window.Weapons.getWeaponDef(i);
        if (def) list.push(def);
      }
    }
    return list;
  }

  // ── CSS injection ─────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('wcodex-style')) return;
    var s = document.createElement('style');
    s.id = 'wcodex-style';
    s.textContent = [
      '#wcodex-overlay {',
      '  display: none;',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);',
      '  border: 1px solid #00ff88;',
      '  font-family: "Courier New", Courier, monospace;',
      '  color: #e0e0e0;',
      '  z-index: 9500;',
      '  flex-direction: column;',
      '  overflow: hidden;',
      '}',
      '#wcodex-overlay.wcodex-visible { display: flex; }',
      '#wcodex-header {',
      '  display: flex;',
      '  justify-content: space-between;',
      '  align-items: center;',
      '  padding: 10px 20px;',
      '  border-bottom: 1px solid #00ff8844;',
      '  background: rgba(0,255,136,0.04);',
      '  flex-shrink: 0;',
      '}',
      '#wcodex-title {',
      '  font-size: 18px;',
      '  font-weight: bold;',
      '  color: #00ff88;',
      '  letter-spacing: 3px;',
      '  text-shadow: 0 0 12px #00ff88aa;',
      '}',
      '#wcodex-hint {',
      '  font-size: 12px;',
      '  color: #666;',
      '  letter-spacing: 1px;',
      '}',
      '#wcodex-body {',
      '  display: flex;',
      '  flex: 1;',
      '  overflow: hidden;',
      '}',
      '#wcodex-list-panel {',
      '  width: 30%;',
      '  border-right: 1px solid #00ff8833;',
      '  overflow-y: auto;',
      '  padding: 10px 0;',
      '  scrollbar-width: thin;',
      '  scrollbar-color: #00ff8844 transparent;',
      '}',
      '#wcodex-list-panel::-webkit-scrollbar { width: 4px; }',
      '#wcodex-list-panel::-webkit-scrollbar-thumb { background: #00ff8844; border-radius: 2px; }',
      '.wcodex-cat-header {',
      '  padding: 8px 16px 4px 16px;',
      '  font-size: 10px;',
      '  letter-spacing: 3px;',
      '  color: #00ff8877;',
      '  border-bottom: 1px solid #00ff8822;',
      '  margin-top: 6px;',
      '}',
      '.wcodex-weapon-entry {',
      '  padding: 7px 16px;',
      '  font-size: 13px;',
      '  cursor: pointer;',
      '  color: #b0b0b0;',
      '  letter-spacing: 0.5px;',
      '  white-space: nowrap;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '  transition: background 0.1s, color 0.1s;',
      '  border-left: 3px solid transparent;',
      '}',
      '.wcodex-weapon-entry:hover {',
      '  background: rgba(0,255,136,0.06);',
      '  color: #e0e0e0;',
      '}',
      '.wcodex-weapon-entry.wcodex-selected {',
      '  background: rgba(0,255,136,0.10);',
      '  color: #00ff88;',
      '  border-left: 3px solid #00ff88;',
      '  text-shadow: 0 0 8px #00ff8866;',
      '}',
      '#wcodex-detail-panel {',
      '  width: 70%;',
      '  overflow-y: auto;',
      '  padding: 20px 28px;',
      '  scrollbar-width: thin;',
      '  scrollbar-color: #00ff8844 transparent;',
      '}',
      '#wcodex-detail-panel::-webkit-scrollbar { width: 4px; }',
      '#wcodex-detail-panel::-webkit-scrollbar-thumb { background: #00ff8844; border-radius: 2px; }',
      '#wcodex-wpn-name {',
      '  font-size: 26px;',
      '  font-weight: bold;',
      '  color: #00ff88;',
      '  letter-spacing: 2px;',
      '  margin-bottom: 4px;',
      '  text-shadow: 0 0 16px #00ff8866;',
      '}',
      '#wcodex-wpn-type {',
      '  font-size: 11px;',
      '  color: #555;',
      '  letter-spacing: 3px;',
      '  margin-bottom: 16px;',
      '}',
      '#wcodex-canvas-wrap {',
      '  height: 130px;',
      '  background: rgba(0,255,136,0.03);',
      '  border: 1px solid #00ff8822;',
      '  border-radius: 4px;',
      '  margin-bottom: 18px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  overflow: hidden;',
      '  position: relative;',
      '}',
      '#wcodex-canvas { display: block; }',
      '#wcodex-stats-grid {',
      '  display: grid;',
      '  grid-template-columns: 1fr 1fr;',
      '  gap: 10px 24px;',
      '  margin-bottom: 20px;',
      '}',
      '.wcodex-stat {',
      '  border-bottom: 1px solid #00ff8811;',
      '  padding-bottom: 8px;',
      '}',
      '.wcodex-stat-label {',
      '  font-size: 10px;',
      '  color: #666;',
      '  letter-spacing: 2px;',
      '  margin-bottom: 3px;',
      '}',
      '.wcodex-stat-value {',
      '  font-size: 14px;',
      '  color: #cccccc;',
      '}',
      '.wcodex-stat-bar {',
      '  font-size: 12px;',
      '  color: #00ff88;',
      '  letter-spacing: 1px;',
      '  font-weight: bold;',
      '}',
      '#wcodex-lore {',
      '  background: rgba(0,255,136,0.03);',
      '  border: 1px solid #00ff8822;',
      '  border-radius: 4px;',
      '  padding: 14px 16px;',
      '  margin-bottom: 14px;',
      '  font-size: 13px;',
      '  line-height: 1.7;',
      '  color: #aaaaaa;',
      '}',
      '#wcodex-tip {',
      '  font-size: 12px;',
      '  color: #00ff88;',
      '  font-style: italic;',
      '  padding: 8px 0 4px 0;',
      '  opacity: 0.8;',
      '}',
      '#wcodex-no-lore {',
      '  font-size: 13px;',
      '  color: #444;',
      '  font-style: italic;',
      '  margin-bottom: 14px;',
      '}',
      '@media (max-height: 600px) {',
      '  #wcodex-canvas-wrap { height: 80px; }',
      '  #wcodex-title { font-size: 14px; }',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── Three.js rotating weapon silhouette ───────────────────────────────────
  var _threeScene = null;
  var _threeCamera = null;
  var _threeRenderer = null;
  var _threeMesh = null;
  var _threeAnim = null;
  var _threeCanvas = null;

  function disposeThreeScene() {
    if (_threeAnim) { cancelAnimationFrame(_threeAnim); _threeAnim = null; }
    if (_threeMesh && _threeScene) {
      _threeScene.remove(_threeMesh);
      if (_threeMesh.geometry) _threeMesh.geometry.dispose();
      if (_threeMesh.material) _threeMesh.material.dispose();
      _threeMesh = null;
    }
    if (_threeRenderer) {
      _threeRenderer.dispose();
      _threeRenderer = null;
    }
    _threeScene = null;
    _threeCamera = null;
  }

  function buildGenericRifleMesh(wDef) {
    // Build a simple weapon silhouette from BoxGeometry parts
    var group = new THREE.Group();
    var mat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var t = wDef ? wDef.type : 'ASSAULT';

    // Receiver / body
    var bodyW = 1.4, bodyH = 0.22, bodyD = 0.18;
    if (t === 'PISTOL') { bodyW = 0.55; bodyH = 0.30; bodyD = 0.12; }
    else if (t === 'SMG') { bodyW = 0.90; bodyH = 0.22; bodyD = 0.15; }
    else if (t === 'SNIPER' || t === 'AMR') { bodyW = 1.8; bodyH = 0.18; bodyD = 0.16; }
    else if (t === 'MELEE') { bodyW = 0.80; bodyH = 0.12; bodyD = 0.12; }
    else if (t === 'AT' || t === 'AT_LIGHT' || t === 'AT_HEAVY' || t === 'ATGM') { bodyW = 1.6; bodyH = 0.22; bodyD = 0.22; }
    else if (t === 'LMG' || t === 'HMG' || t === 'HMG_HEAVY' || t === 'MACHINEGUN' || t === 'MINIGUN' || t === 'GATLING') { bodyW = 1.5; bodyH = 0.20; bodyD = 0.20; }
    else if (t === 'GRENADE' || t === 'MINE' || t === 'EXPLOSIVE' || t === 'INCENDIARY' || t === 'SMOKE' || t === 'FLASHBANG') { bodyW = 0.40; bodyH = 0.40; bodyD = 0.40; }

    var bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
    var body = new THREE.Mesh(bodyGeo, mat);
    group.add(body);

    // Barrel
    if (t !== 'MELEE' && t !== 'MINE' && t !== 'EXPLOSIVE' && t !== 'SMOKE' && t !== 'FLASHBANG') {
      var barrelLen = (t === 'PISTOL') ? 0.25 : (t === 'SNIPER' || t === 'AMR') ? 0.7 : 0.5;
      var barrelGeo = new THREE.BoxGeometry(barrelLen, 0.07, 0.07);
      var barrel = new THREE.Mesh(barrelGeo, mat);
      barrel.position.x = (bodyW + barrelLen) / 2;
      barrel.position.y = 0.02;
      group.add(barrel);
    }

    // Grip
    if (t !== 'MINE' && t !== 'EXPLOSIVE' && t !== 'SMOKE' && t !== 'FLASHBANG') {
      var gripH = (t === 'PISTOL') ? 0.35 : 0.22;
      var gripGeo = new THREE.BoxGeometry(0.10, gripH, 0.12);
      var grip = new THREE.Mesh(gripGeo, mat);
      grip.position.x = (t === 'PISTOL') ? 0.02 : 0.10;
      grip.position.y = -(bodyH / 2 + gripH / 2);
      group.add(grip);
    }

    // Stock
    if (t !== 'PISTOL' && t !== 'MINE' && t !== 'EXPLOSIVE' && t !== 'SMOKE' && t !== 'FLASHBANG' && t !== 'GRENADE' && t !== 'INCENDIARY') {
      var stockGeo = new THREE.BoxGeometry(0.30, 0.15, 0.14);
      var stock = new THREE.Mesh(stockGeo, mat);
      stock.position.x = -(bodyW / 2 + 0.15);
      stock.position.y = -0.03;
      group.add(stock);
    }

    // Magazine (where applicable)
    if (t !== 'MELEE' && t !== 'MINE' && t !== 'EXPLOSIVE' && t !== 'SMOKE' && t !== 'FLASHBANG' && t !== 'PISTOL' && t !== 'AT' && t !== 'AT_LIGHT' && t !== 'AT_HEAVY' && t !== 'ATGM' && t !== 'AA' && t !== 'INCENDIARY') {
      var magH = (t === 'LMG' || t === 'HMG' || t === 'HMG_HEAVY' || t === 'MACHINEGUN') ? 0.35 : 0.25;
      var magGeo = new THREE.BoxGeometry(0.12, magH, 0.14);
      var mag = new THREE.Mesh(magGeo, new THREE.MeshLambertMaterial({ color: 0x333333 }));
      mag.position.x = 0.12;
      mag.position.y = -(bodyH / 2 + magH / 2);
      group.add(mag);
    }

    return group;
  }

  function startThreePreview(container, wDef) {
    disposeThreeScene();

    var W = container.clientWidth || 400;
    var H = container.clientHeight || 130;

    if (typeof THREE === 'undefined') {
      container.innerHTML = '<span style="color:#333;font-size:11px;letter-spacing:2px;">[ 3D PREVIEW UNAVAILABLE ]</span>';
      return;
    }

    _threeScene = new THREE.Scene();
    _threeCamera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    _threeCamera.position.set(0, 0.4, 3.0);
    _threeCamera.lookAt(0, 0, 0);

    _threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    _threeRenderer.setSize(W, H);
    _threeRenderer.setClearColor(0x000000, 0);
    _threeCanvas = _threeRenderer.domElement;
    container.innerHTML = '';
    container.appendChild(_threeCanvas);

    // Lights
    var ambLight = new THREE.AmbientLight(0x404040, 1.2);
    _threeScene.add(ambLight);
    var dirLight = new THREE.DirectionalLight(0x00ff88, 0.8);
    dirLight.position.set(2, 3, 2);
    _threeScene.add(dirLight);
    var dirLight2 = new THREE.DirectionalLight(0x4488ff, 0.4);
    dirLight2.position.set(-2, -1, 1);
    _threeScene.add(dirLight2);

    _threeMesh = buildGenericRifleMesh(wDef);
    _threeScene.add(_threeMesh);

    var t = 0;
    function animate() {
      _threeAnim = requestAnimationFrame(animate);
      t += 0.012;
      _threeMesh.rotation.y = t;
      _threeMesh.rotation.x = Math.sin(t * 0.4) * 0.15;
      _threeRenderer.render(_threeScene, _threeCamera);
    }
    animate();
  }

  // ── Detail card render ────────────────────────────────────────────────────
  function renderDetail(panel, wDef, damageMax) {
    var lore = LORE[wDef.id] || null;
    var cat = CATEGORIES[wDef.type] || wDef.type;

    var fireRateRpm = wDef.fireRate > 0 ? Math.round(60 / wDef.fireRate) : 0;
    var rangeLabel = getRangeLabel(wDef.spread);
    var recoilLabel = getRecoilLabel(wDef.recoilY || 0);
    var accuracy = getAccuracy(wDef.spread);
    var damageBar = renderBar(Math.min(wDef.damage, damageMax), damageMax, '█', '░');
    var accBar = renderBar(accuracy, 100, '█', '░');

    var loreHtml = '';
    if (lore) {
      loreHtml = '<div id="wcodex-lore">' + lore.text + '</div>' +
                 '<div id="wcodex-tip">TIP: ' + lore.tip + '</div>';
    } else {
      var autoStr = wDef.auto ? 'AUTOMATIC' : 'SEMI-AUTO';
      loreHtml = '<div id="wcodex-no-lore">[ No field notes on file for this weapon. ' + autoStr + ' fire mode. ]</div>';
    }

    var reloadStr = wDef.reloadTime > 0 ? (wDef.reloadTime.toFixed(1) + 's') : 'N/A';
    var magazineStr = wDef.clipSize > 0 ? (wDef.clipSize + ' rounds') : 'N/A (melee)';
    var ammoStr = wDef.type || 'UNKNOWN';
    if (wDef.blastRadius) ammoStr += ' / BLAST ' + wDef.blastRadius + 'm';
    var homingStr = wDef.homing ? ' [HOMING]' : '';

    panel.innerHTML =
      '<div id="wcodex-wpn-name">' + wDef.name + '</div>' +
      '<div id="wcodex-wpn-type">' + cat + homingStr + '</div>' +
      '<div id="wcodex-canvas-wrap"></div>' +
      '<div id="wcodex-stats-grid">' +
        '<div class="wcodex-stat">' +
          '<div class="wcodex-stat-label">&#127919; DAMAGE</div>' +
          '<div class="wcodex-stat-value">' + wDef.damage + '</div>' +
          '<div class="wcodex-stat-bar">' + damageBar + '</div>' +
        '</div>' +
        '<div class="wcodex-stat">' +
          '<div class="wcodex-stat-label">&#128301; ACCURACY</div>' +
          '<div class="wcodex-stat-value">' + accuracy + '%</div>' +
          '<div class="wcodex-stat-bar">' + accBar + '</div>' +
        '</div>' +
        '<div class="wcodex-stat">' +
          '<div class="wcodex-stat-label">&#128299; FIRE RATE</div>' +
          '<div class="wcodex-stat-value">' + (fireRateRpm > 0 ? fireRateRpm + ' RPM' : 'MELEE') + '</div>' +
        '</div>' +
        '<div class="wcodex-stat">' +
          '<div class="wcodex-stat-label">&#9889; RECOIL</div>' +
          '<div class="wcodex-stat-value">' + recoilLabel + '</div>' +
        '</div>' +
        '<div class="wcodex-stat">' +
          '<div class="wcodex-stat-label">&#128207; RANGE</div>' +
          '<div class="wcodex-stat-value">' + rangeLabel + '</div>' +
        '</div>' +
        '<div class="wcodex-stat">' +
          '<div class="wcodex-stat-label">&#128260; RELOAD</div>' +
          '<div class="wcodex-stat-value">' + reloadStr + '</div>' +
        '</div>' +
        '<div class="wcodex-stat">' +
          '<div class="wcodex-stat-label">&#128230; MAGAZINE</div>' +
          '<div class="wcodex-stat-value">' + magazineStr + '</div>' +
        '</div>' +
        '<div class="wcodex-stat">' +
          '<div class="wcodex-stat-label">&#128163; AMMO CLASS</div>' +
          '<div class="wcodex-stat-value">' + ammoStr + '</div>' +
        '</div>' +
      '</div>' +
      loreHtml;

    // Start Three.js preview after DOM is updated
    var canvasWrap = document.getElementById('wcodex-canvas-wrap');
    if (canvasWrap) {
      startThreePreview(canvasWrap, wDef);
    }
  }

  // ── List panel render ─────────────────────────────────────────────────────
  function renderList(listPanel, detailPanel, weapons) {
    listPanel.innerHTML = '';
    _listItems = [];

    var byCategory = {};
    for (var i = 0; i < CATEGORY_ORDER.length; i++) {
      byCategory[CATEGORY_ORDER[i]] = [];
    }

    for (var wi = 0; wi < weapons.length; wi++) {
      var w = weapons[wi];
      var cat = CATEGORIES[w.type] || 'SPECIAL';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({ idx: wi, def: w });
    }

    var damageMax = getDamageMax(weapons);
    var globalIdx = 0;

    for (var ci = 0; ci < CATEGORY_ORDER.length; ci++) {
      var catName = CATEGORY_ORDER[ci];
      var entries = byCategory[catName];
      if (!entries || entries.length === 0) continue;

      var catHeader = document.createElement('div');
      catHeader.className = 'wcodex-cat-header';
      catHeader.textContent = (CATEGORY_ICONS[catName] || '') + ' ' + catName;
      listPanel.appendChild(catHeader);

      for (var ei = 0; ei < entries.length; ei++) {
        (function (entry, gIdx) {
          var el = document.createElement('div');
          el.className = 'wcodex-weapon-entry' + (gIdx === _selectedIdx ? ' wcodex-selected' : '');
          el.textContent = entry.def.name;
          el.setAttribute('data-idx', gIdx);
          el.addEventListener('click', function () {
            selectWeapon(gIdx, listPanel, detailPanel, weapons, damageMax);
          });
          listPanel.appendChild(el);
          _listItems.push({ el: el, gIdx: gIdx, def: entry.def });
        })(entries[ei], globalIdx);
        globalIdx++;
      }
    }

    // Render initial detail
    if (weapons.length > 0) {
      renderDetail(detailPanel, weapons[_selectedIdx], damageMax);
    }
  }

  function selectWeapon(idx, listPanel, detailPanel, weapons, damageMax) {
    _selectedIdx = idx;
    // Update list highlight
    for (var i = 0; i < _listItems.length; i++) {
      if (_listItems[i].gIdx === idx) {
        _listItems[i].el.className = 'wcodex-weapon-entry wcodex-selected';
        _listItems[i].el.scrollIntoView({ block: 'nearest' });
      } else {
        _listItems[i].el.className = 'wcodex-weapon-entry';
      }
    }
    renderDetail(detailPanel, weapons[idx], damageMax);
  }

  // ── DOM creation ──────────────────────────────────────────────────────────
  function createOverlay() {
    if (_overlay) return;
    injectStyles();

    _overlay = document.createElement('div');
    _overlay.id = 'wcodex-overlay';

    var header = document.createElement('div');
    header.id = 'wcodex-header';
    header.innerHTML = '<div id="wcodex-title">&#9881; WEAPON FIELD MANUAL</div>' +
                       '<div id="wcodex-hint">F1 TO CLOSE &nbsp;|&nbsp; &#8593;&#8595; NAVIGATE &nbsp;|&nbsp; ESC TO CLOSE</div>';
    _overlay.appendChild(header);

    var body = document.createElement('div');
    body.id = 'wcodex-body';

    var listPanel = document.createElement('div');
    listPanel.id = 'wcodex-list-panel';

    var detailPanel = document.createElement('div');
    detailPanel.id = 'wcodex-detail-panel';

    body.appendChild(listPanel);
    body.appendChild(detailPanel);
    _overlay.appendChild(body);

    document.body.appendChild(_overlay);

    // Populate
    _weaponList = buildWeaponList();
    if (_weaponList.length === 0) {
      listPanel.innerHTML = '<div style="padding:20px;color:#444;font-size:12px;">No weapons loaded yet.<br>Open during gameplay.</div>';
      detailPanel.innerHTML = '<div style="padding:20px;color:#444;font-size:12px;">Start the game to populate the weapon codex.</div>';
    } else {
      renderList(listPanel, detailPanel, _weaponList);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function show() {
    createOverlay();
    // Refresh weapon list each time we open (weapons may have been loaded after init)
    var freshList = buildWeaponList();
    if (freshList.length !== _weaponList.length) {
      _weaponList = freshList;
      var listPanel = document.getElementById('wcodex-list-panel');
      var detailPanel = document.getElementById('wcodex-detail-panel');
      if (listPanel && detailPanel && _weaponList.length > 0) {
        renderList(listPanel, detailPanel, _weaponList);
      }
    }
    _overlay.classList.add('wcodex-visible');
    _visible = true;
  }

  function hide() {
    if (_overlay) {
      _overlay.classList.remove('wcodex-visible');
    }
    disposeThreeScene();
    _visible = false;
  }

  function toggle() {
    if (_visible) { hide(); } else { show(); }
  }

  function handleKeyDown(e) {
    // F1
    if (e.key === 'F1') {
      e.preventDefault();
      toggle();
      return;
    }
    if (!_visible) return;

    if (e.key === 'Escape') {
      hide();
      return;
    }

    var listPanel = document.getElementById('wcodex-list-panel');
    var detailPanel = document.getElementById('wcodex-detail-panel');
    if (!listPanel || !detailPanel || _weaponList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      var next = Math.min(_selectedIdx + 1, _weaponList.length - 1);
      selectWeapon(next, listPanel, detailPanel, _weaponList, getDamageMax(_weaponList));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      var prev = Math.max(_selectedIdx - 1, 0);
      selectWeapon(prev, listPanel, detailPanel, _weaponList, getDamageMax(_weaponList));
    }
  }

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer */

    document.addEventListener('keydown', handleKeyDown);
    // Pre-create overlay silently in background if DOM ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      createOverlay();
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        createOverlay();
      });
    }
  }

  // Auto-init when script loads
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      init();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
  }

  return { init: init, toggle: toggle, show: show, hide: hide };

})();
