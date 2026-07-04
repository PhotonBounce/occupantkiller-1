/* ============================================================
   CITY-BUILDINGS.JS — Realistic city building blueprints based on
   actual Ukrainian / Russian city landmarks and architecture.
   REBUILD v2.0 — Photo-reference accuracy pass (2024).
   ============================================================ */
const CityBuildings = (function () {
  'use strict';
  const PAL = { AIR:0, CONCRETE:9, BRICK:10, GLASS:11, WOOD:4, METAL:5, STONE:3, PLASTER:20, ROOFTILE:19, ASPHALT:18, SAND:7, DIRT:1, GRASS:2, REINFORCED:14, FENCE:15, RUBBLE:16, SANDBAG:17, CAR:28, DOOR:29, BLUE_TILE:64, WHITE_TILE:65, LIGHT:27, BUSH:26, FLAG:38, BANNER:39,
    UKR_BLUE:66, UKR_YELLOW:67, UKR_FLAG:68, UKR_BANNER:69, TRYZUB:70, UKR_VEHICLE:71,
    BRICK_DARK_RED:72, BRICK_RED:73, BRICK_BROWN:74, BRICK_YELLOW:75, BRICK_ORANGE:76, BRICK_PINK:77, BRICK_GREY:78, BRICK_WHITE:79,
    CONCRETE_LIGHT:80, CONCRETE_DARK:81, CONCRETE_BEIGE:82, CONCRETE_WARM:83,
    PLASTER_WHITE:84, PLASTER_CREAM:85, PLASTER_YELLOW:86, PLASTER_PEACH:87, PLASTER_SALMON:88, PLASTER_BLUE:89, PLASTER_GREEN:90, PLASTER_LAVENDER:91,
    METAL_SILVER:92, METAL_DARK:93, METAL_RUST:94, METAL_COPPER:95, METAL_BRONZE:96,
    ROOF_TERRACOTTA:97, ROOF_DARK_BROWN:98, ROOF_GREEN:99, ROOF_BLUE:100, ROOF_BLACK:101,
    GLASS_BLUE:102, GLASS_GREEN:103, GLASS_DARK:104,
    STONE_LIMESTONE:105, STONE_SANDSTONE:106, STONE_GRANITE:107, STONE_MARBLE:108,
    WOOD_DARK:109, WOOD_LIGHT:110, WOOD_RED:111,
    FACADE_BEIGE:112, FACADE_GREY:113, FACADE_GREEN:114, FACADE_BLUE:115, FACADE_PINK:116, FACADE_OCHRE:117, FACADE_TERRA:118, FACADE_SAND:119, FACADE_MINT:120, FACADE_LAVENDER:121, FACADE_CORAL:122, FACADE_OLIVE:123, FACADE_TEAL:124, FACADE_MUSTARD:125, FACADE_CINNAMON:126, FACADE_INDIGO:127
  };
  var CITIES = {};

  // ── Global detail level (can be overridden per-building) ──
  var GLOBAL_DETAIL = (typeof window !== 'undefined' && window.detailLevel) || 0;
  var GLOBAL_DAMAGE = (typeof window !== 'undefined' && window.destructionLevel) || 0;

  // ── Helpers: interiors, damage, rooftops, ground details ──
  function _isDamagedSkip(damage, x, y, z, w, h, d) {
    if (!damage || damage <= 0) return false;
    // Concentrate damage toward corners and center
    var cx = w / 2, cz = d / 2, cy = h / 2;
    var distFromCenter = Math.abs(x - cx) + Math.abs(z - cz) + Math.abs(y - cy) * 0.5;
    if (distFromCenter < 4 && Math.random() < damage * 0.5) return true;
    if (Math.random() < damage * 0.15) return true;
    return false;
  }
  function _addRubble(ox, gy, oz, w, d, damage) {
    if (!damage || damage <= 0) return;
    var count = Math.floor(damage * 20);
    for (var i = 0; i < count; i++) {
      var rx = ox + Math.floor(Math.random() * w);
      var rz = oz + Math.floor(Math.random() * d);
      var bt = (Math.random() < 0.5) ? PAL.RUBBLE : PAL.DIRT;
      setBlock(rx, gy - 1, rz, bt);
      if (Math.random() < 0.3) setBlock(rx, gy - 2, rz, bt);
      if (Math.random() < 0.2) setBlock(rx + 1, gy - 1, rz, bt);
      if (Math.random() < 0.2) setBlock(rx, gy - 1, rz + 1, bt);
    }
  }
  function _addRooftopAC(ox, gy, oz, w, d) {
    var acX = ox + 2, acZ = oz + 2;
    if (acX < ox + w - 2 && acZ < oz + d - 2) {
      setBlock(acX, gy, acZ, PAL.METAL);
      setBlock(acX + 1, gy, acZ, PAL.METAL);
      setBlock(acX, gy, acZ + 1, PAL.METAL);
      setBlock(acX + 1, gy, acZ + 1, PAL.METAL);
      setBlock(acX, gy + 1, acZ, PAL.METAL_DARK);
      setBlock(acX + 1, gy + 1, acZ + 1, PAL.METAL_DARK);
      // Fan grille
      setBlock(acX, gy + 1, acZ + 1, PAL.FENCE);
      setBlock(acX + 1, gy + 1, acZ, PAL.FENCE);
    }
  }
  function _addRooftopWaterTank(ox, gy, oz, w, d) {
    var tx = ox + w - 3, tz = oz + d - 3;
    if (tx > ox + 2 && tz > oz + 2) {
      setBlock(tx, gy, tz, PAL.CONCRETE);
      setBlock(tx + 1, gy, tz, PAL.CONCRETE);
      setBlock(tx, gy, tz + 1, PAL.CONCRETE);
      setBlock(tx + 1, gy, tz + 1, PAL.CONCRETE);
      setBlock(tx, gy + 1, tz, PAL.CONCRETE);
      setBlock(tx + 1, gy + 1, tz + 1, PAL.CONCRETE);
    }
  }
  function _addRooftopAntenna(ox, gy, oz, w, d) {
    var ax = ox + Math.floor(w / 2), az = oz + Math.floor(d / 2);
    for (var ay = 0; ay < 4 + Math.floor(Math.random() * 3); ay++) setBlock(ax, gy + ay, az, PAL.METAL);
    setBlock(ax + 1, gy + 2, az, PAL.METAL);
    setBlock(ax - 1, gy + 2, az, PAL.METAL);
    setBlock(ax, gy + 2, az + 1, PAL.METAL);
    setBlock(ax, gy + 2, az - 1, PAL.METAL);
  }
  function _addRooftopSatelliteDish(ox, gy, oz, w, d) {
    var sx = ox + w - 2, sz = oz + 2;
    if (sx > ox + 1) {
      setBlock(sx, gy, sz, PAL.METAL);
      setBlock(sx, gy + 1, sz, PAL.METAL);
      setBlock(sx + 1, gy + 1, sz, PAL.METAL);
      setBlock(sx - 1, gy + 1, sz, PAL.METAL);
      setBlock(sx, gy + 1, sz + 1, PAL.METAL);
      setBlock(sx, gy + 1, sz - 1, PAL.METAL);
    }
  }
  function _addRooftopElevatorRoom(ox, gy, oz, w, d) {
    var ex = ox + Math.floor(w / 2) - 1, ez = oz + d - 2;
    if (ex > ox && ez > oz) {
      for (var x = 0; x < 3; x++) {
        for (var z = 0; z < 2; z++) {
          setBlock(ex + x, gy, ez + z, PAL.CONCRETE);
          if (x === 0 || x === 2 || z === 0) {
            setBlock(ex + x, gy + 1, ez + z, PAL.CONCRETE);
          } else {
            setBlock(ex + x, gy + 1, ez + z, PAL.GLASS);
          }
        }
      }
      setBlock(ex, gy + 2, ez, PAL.CONCRETE);
      setBlock(ex + 2, gy + 2, ez, PAL.CONCRETE);
      setBlock(ex, gy + 2, ez + 1, PAL.CONCRETE);
      setBlock(ex + 2, gy + 2, ez + 1, PAL.CONCRETE);
    }
  }
  function _addHelipad(ox, gy, oz, w, d) {
    if (w >= 12 && d >= 10) {
      var hx = ox + Math.floor(w / 2) - 2, hz = oz + Math.floor(d / 2) - 2;
      for (var x = 0; x < 5; x++) {
        for (var z = 0; z < 5; z++) {
          setBlock(hx + x, gy, hz + z, (x === 2 || z === 2) ? PAL.WHITE_TILE : PAL.ASPHALT);
        }
      }
      // H mark
      setBlock(hx + 1, gy + 1, hz + 2, PAL.WHITE_TILE);
      setBlock(hx + 3, gy + 1, hz + 2, PAL.WHITE_TILE);
      setBlock(hx + 2, gy + 1, hz + 1, PAL.WHITE_TILE);
      setBlock(hx + 2, gy + 1, hz + 3, PAL.WHITE_TILE);
    }
  }
  function _addGroundSteps(ox, gy, oz, w, d) {
    var mx = ox + Math.floor(w / 2);
    setBlock(mx - 1, gy - 1, oz - 1, PAL.STONE);
    setBlock(mx, gy - 1, oz - 1, PAL.STONE);
    setBlock(mx + 1, gy - 1, oz - 1, PAL.STONE);
  }
  function _addGroundTrashBins(ox, gy, oz, w, d) {
    setBlock(ox + 1, gy, oz + d + 1, PAL.METAL_DARK);
    setBlock(ox + w - 2, gy, oz + d + 1, PAL.METAL_DARK);
  }
  function _addGroundStreetLamp(ox, gy, oz, w, d) {
    var lx = ox + w + 1, lz = oz + Math.floor(d / 2);
    setBlock(lx, gy, lz, PAL.METAL);
    setBlock(lx, gy + 1, lz, PAL.METAL);
    setBlock(lx, gy + 2, lz, PAL.METAL);
    setBlock(lx, gy + 3, lz, PAL.LIGHT);
  }
  function _addGroundBollards(ox, gy, oz, w, d) {
    setBlock(ox - 1, gy, oz + 1, PAL.CONCRETE);
    setBlock(ox - 1, gy, oz + d - 2, PAL.CONCRETE);
    setBlock(ox + w, gy, oz + 1, PAL.CONCRETE);
    setBlock(ox + w, gy, oz + d - 2, PAL.CONCRETE);
  }
  function _addGroundBench(ox, gy, oz, w, d) {
    var bx = ox + 2, bz = oz + d + 1;
    setBlock(bx, gy, bz, PAL.WOOD);
    setBlock(bx + 1, gy, bz, PAL.WOOD);
    setBlock(bx + 2, gy, bz, PAL.WOOD);
    setBlock(bx, gy, bz + 1, PAL.METAL_DARK);
    setBlock(bx + 2, gy, bz + 1, PAL.METAL_DARK);
  }
  function _addGroundFence(ox, gy, oz, w, d) {
    for (var x = 0; x < w; x += 2) {
      setBlock(ox + x, gy, oz + d + 1, PAL.FENCE);
    }
  }


  // ── sovietApartment ──
  function sovietApartment(ox, oz, gy, w, d, floors, damage, color, detailLevel) {
    color = color || PAL.CONCRETE;
    detailLevel = detailLevel || GLOBAL_DETAIL;
    damage = (typeof damage === 'number') ? damage : GLOBAL_DAMAGE;
    var h = floors * 3 + 1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          var isFloor = y % 3 === 0 && y > 0 && y < h - 1;
          if (isWall || isRoof || isFloor) {
            var bt = color;
            if (isRoof) bt = PAL.ROOFTILE;
            else if (y === 0) bt = PAL.BRICK;
            else if ((x === 3 || x === w - 4) && (z === 0 || z === d - 1)) bt = PAL.CONCRETE;
            // Soviet texture: rust stains on concrete
            if (bt === PAL.CONCRETE && Math.random() < 0.15) bt = PAL.METAL_RUST;
            if (bt === PAL.CONCRETE && y > 0 && Math.random() < 0.1) bt = PAL.CONCRETE_DARK;
            // Damage
            if (_isDamagedSkip(damage, x, y, z, w, h, d)) continue;
            setBlock(ox + x, gy + y, oz + z, bt);
          }
          // Windows with glass panes
          if (isWall && !isRoof && !isFloor && y > 0) {
            if ((y % 3 === 1 || y % 3 === 2) && (x % 3 === 1 || z % 3 === 1)) {
              if (Math.random() > 0.3) {
                if (damage > 0 && Math.random() < damage * 0.5) {
                  // Broken window - missing glass or exposed rebar
                  if (Math.random() < 0.3) setBlock(ox + x, gy + y, oz + z, PAL.REINFORCED);
                } else {
                  setBlock(ox + x, gy + y, oz + z, PAL.GLASS);
                }
              }
            }
          }
        }
      }
    }
    // Interior: hollow with floors, rooms, staircases
    if (detailLevel >= 1) {
      for (var f = 1; f < floors; f++) {
        var fy = gy + f * 3;
        // Floor slabs
        for (var x = 1; x < w - 1; x++) {
          for (var z = 1; z < d - 1; z++) {
            setBlock(ox + x, fy, oz + z, PAL.CONCRETE);
          }
        }
        // Interior walls creating rooms (every 4 blocks)
        for (var x = 4; x < w - 1; x += 4) {
          for (var z = 1; z < d - 1; z++) {
            if (z % 3 !== 0) { // doorways every 3 blocks
              setBlock(ox + x, fy + 1, oz + z, PAL.CONCRETE_LIGHT);
              setBlock(ox + x, fy + 2, oz + z, PAL.CONCRETE_LIGHT);
            }
          }
        }
        // Staircase in center
        var sx = Math.floor(w / 2);
        var sz = Math.floor(d / 2);
        setBlock(ox + sx, fy + 1, oz + sz, PAL.CONCRETE);
        setBlock(ox + sx, fy + 2, oz + sz, PAL.CONCRETE);
        setBlock(ox + sx + 1, fy + 1, oz + sz, PAL.CONCRETE);
        setBlock(ox + sx + 1, fy + 2, oz + sz, PAL.CONCRETE);
      }
    }
    // Balconies (existing)
    for (var f = 1; f < floors; f++) {
      var by = gy + f * 3 + 1;
      for (var bx = 1; bx < w - 1; bx++) {
        if (bx % 3 === 1) {
          setBlock(ox + bx, by, oz + d, PAL.CONCRETE);
          setBlock(ox + bx, by, oz + d + 1, PAL.FENCE);
        }
      }
    }
    // Entrance
    setBlock(ox + Math.floor(w / 2), gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2), gy + 1, oz, PAL.AIR);
    // Stairwell window
    for (var sy = 1; sy < h - 1; sy++) {
      if (sy % 3 === 1) setBlock(ox + w - 1, gy + sy, oz + Math.floor(d / 2), PAL.GLASS);
    }
    // Rooftop details
    if (detailLevel >= 1) {
      _addRooftopAC(ox, gy + h, oz, w, d);
      _addRooftopWaterTank(ox, gy + h, oz, w, d);
      _addRooftopAntenna(ox, gy + h, oz, w, d);
      if (floors >= 5) _addHelipad(ox, gy + h, oz, w, d);
    }
    // Ground-level details
    if (detailLevel >= 1) {
      _addGroundSteps(ox, gy, oz, w, d);
      _addGroundTrashBins(ox, gy, oz, w, d);
      _addGroundStreetLamp(ox, gy, oz, w, d);
    }
    // Damage: rubble piles at base
    _addRubble(ox, gy, oz, w, d, damage);
  }


  // ── orthodoxChurch ──
  function orthodoxChurch(ox, oz, gy, w, d, h, color, detailLevel, damaged) {
    color = color || PAL.BRICK;
    detailLevel = detailLevel || GLOBAL_DETAIL;
    var damage = damaged ? 0.6 : (GLOBAL_DAMAGE || 0);
    var cx = ox + Math.floor(w / 2), cz = oz + Math.floor(d / 2);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = (y === 0) ? PAL.STONE : color;
            if (y > h - 3) bt = PAL.PLASTER;
            // Church textures: gold domes, brick walls
            if (y > h - 4 && y < h - 1) bt = PAL.BRICK_YELLOW; // gold accent band
            if (isWall && y > 1 && y < h - 3 && Math.random() < 0.08) bt = PAL.BRICK_DARK_RED;
            // Damage
            if (_isDamagedSkip(damage, x, y, z, w, h, d)) continue;
            setBlock(ox + x, gy + y, oz + z, bt);
          }
        }
      }
    }
    var towerSize = 3;
    var towers = [[0,0],[w-towerSize,0],[0,d-towerSize],[w-towerSize,d-towerSize]];
    for (var ti = 0; ti < towers.length; ti++) {
      var tx = ox + towers[ti][0], tz = oz + towers[ti][1];
      for (var y = 0; y < h + 4; y++) {
        for (var x = 0; x < towerSize; x++) {
          for (var z = 0; z < towerSize; z++) {
            var isWall = x === 0 || x === towerSize - 1 || z === 0 || z === towerSize - 1;
            if (isWall) {
              if (damage > 0 && Math.random() < damage * 0.1) continue;
              setBlock(tx + x, gy + y, tz + z, color);
            }
          }
        }
      }
      var domeY = gy + h + 4;
      setBlock(tx + 1, domeY, tz + 1, PAL.METAL); setBlock(tx + 1, domeY + 1, tz + 1, PAL.METAL);
      setBlock(tx, domeY, tz + 1, PAL.METAL); setBlock(tx + 2, domeY, tz + 1, PAL.METAL);
      setBlock(tx + 1, domeY, tz, PAL.METAL); setBlock(tx + 1, domeY, tz + 2, PAL.METAL);
      setBlock(tx + 1, domeY + 2, tz + 1, PAL.METAL);
      // Cross on each tower dome
      if (detailLevel >= 1) {
        setBlock(tx + 1, domeY + 3, tz + 1, PAL.METAL);
        setBlock(tx + 1, domeY + 4, tz + 1, PAL.METAL);
        setBlock(tx, domeY + 3, tz + 1, PAL.METAL);
        setBlock(tx + 2, domeY + 3, tz + 1, PAL.METAL);
      }
    }
    var domeY = gy + h + 2;
    for (var dx = -2; dx <= 2; dx++) {
      for (var dz = -2; dz <= 2; dz++) {
        for (var dy = 0; dy < 3; dy++) {
          if (Math.abs(dx) + Math.abs(dz) + dy <= 3) {
            var bt = PAL.METAL;
            if (dy < 2 && detailLevel >= 1) bt = PAL.BRICK_YELLOW; // gold dome
            if (damage > 0 && Math.random() < damage * 0.15) continue;
            setBlock(cx + dx, domeY + dy, cz + dz, bt);
          }
        }
      }
    }
    // Cross on main dome
    if (detailLevel >= 1) {
      setBlock(cx, domeY + 3, cz, PAL.METAL);
      setBlock(cx, domeY + 4, cz, PAL.METAL);
      setBlock(cx - 1, domeY + 3, cz, PAL.METAL);
      setBlock(cx + 1, domeY + 3, cz, PAL.METAL);
    }
    // Interior: nave, altar, pews
    if (detailLevel >= 1) {
      // Nave floor
      for (var x = 1; x < w - 1; x++) {
        for (var z = 1; z < d - 1; z++) {
          setBlock(ox + x, gy, oz + z, PAL.STONE_MARBLE);
        }
      }
      // Altar at far end
      for (var x = cx - 1; x <= cx + 1; x++) {
        setBlock(x, gy + 1, oz + 2, PAL.STONE);
        setBlock(x, gy + 2, oz + 2, PAL.STONE);
      }
      // Pews (wooden benches)
      for (var z = 4; z < d - 3; z += 2) {
        for (var x = 1; x < w - 1; x++) {
          if (x % 3 === 1) {
            setBlock(ox + x, gy + 1, oz + z, PAL.WOOD_DARK);
            setBlock(ox + x, gy + 1, oz + z + 1, PAL.WOOD_DARK);
          }
        }
      }
      // Interior columns
      for (var y = 1; y < h - 3; y++) {
        setBlock(ox + 2, gy + y, oz + 2, PAL.STONE_MARBLE);
        setBlock(ox + w - 3, gy + y, oz + 2, PAL.STONE_MARBLE);
        setBlock(ox + 2, gy + y, oz + d - 3, PAL.STONE_MARBLE);
        setBlock(ox + w - 3, gy + y, oz + d - 3, PAL.STONE_MARBLE);
      }
    }
    // Entrance
    setBlock(cx, gy, oz + d - 1, PAL.AIR); setBlock(cx, gy + 1, oz + d - 1, PAL.AIR); setBlock(cx, gy + 2, oz + d - 1, PAL.AIR);
    // Ground-level details
    if (detailLevel >= 1) {
      _addGroundSteps(ox, gy, oz, w, d);
      _addGroundBench(ox, gy, oz, w, d);
      _addGroundFence(ox, gy, oz, w, d);
    }
    // Damage rubble
    _addRubble(ox, gy, oz, w, d, damage);
  }


  // ── kyivBaroqueChurch ──
  function kyivBaroqueChurch(ox, oz, gy, w, d, h, domeCount) {
    domeCount = domeCount || 5;
    var cx = ox + Math.floor(w / 2), cz = oz + Math.floor(d / 2);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = PAL.BRICK;
            if (y === 0) bt = PAL.STONE;
            if (isRoof) bt = PAL.ROOFTILE;
            setBlock(ox + x, gy + y, oz + z, bt);
          }
        }
      }
    }
    var domePositions = [[cx, cz]];
    if (domeCount >= 5) {
      domePositions.push([ox + 2, oz + 2], [ox + w - 3, oz + 2], [ox + 2, oz + d - 3], [ox + w - 3, oz + d - 3]);
    }
    for (var di = 0; di < domePositions.length; di++) {
      var dx = domePositions[di][0], dz = domePositions[di][1];
      var domeY = gy + h;
      for (var dy = 0; dy < 4; dy++) {
        var radius = (dy < 2) ? 2 - dy : 1;
        for (var dxx = -radius; dxx <= radius; dxx++) {
          for (var dzz = -radius; dzz <= radius; dzz++) {
            if (Math.abs(dxx) + Math.abs(dzz) <= radius + 1) setBlock(dx + dxx, domeY + dy, dz + dzz, PAL.METAL);
          }
        }
      }
      setBlock(dx, domeY + 4, dz, PAL.METAL); setBlock(dx, domeY + 5, dz, PAL.METAL);
    }
    var bx = ox + w, bz = oz + Math.floor(d / 2);
    for (var y = 0; y < h + 6; y++) {
      for (var tx = 0; tx < 3; tx++) {
        for (var tz = 0; tz < 3; tz++) {
          var isWall = tx === 0 || tx === 2 || tz === 0 || tz === 2;
          if (isWall) { var bt = (y % 4 < 2) ? PAL.BLUE_TILE : PAL.WHITE_TILE; setBlock(bx + tx, gy + y, bz + tz, bt); }
        }
      }
    }
    setBlock(bx + 1, gy + h + 6, bz + 1, PAL.METAL); setBlock(bx + 1, gy + h + 7, bz + 1, PAL.METAL);
    setBlock(cx, gy, oz + d - 1, PAL.AIR); setBlock(cx, gy + 1, oz + d - 1, PAL.AIR); setBlock(cx, gy + 2, oz + d - 1, PAL.AIR);
  }

  // ── stBasilCathedral ──
  function stBasilCathedral(ox, oz, gy) {
    // Real: Pokrovsky Sobor, 1555-1561, Red Square, Moscow
    // 9 colorful onion domes - white/red striped body, colorful domes
    var cx = ox + 8, cz = oz + 8;
    // Main tower - white/red striped
    for (var y = 0; y < 14; y++) { var radius = Math.max(1, 3 - Math.floor(y / 4)); for (var x = -radius; x <= radius; x++) { for (var z = -radius; z <= radius; z++) {
      var isWhite = ((x + y + z) % 2 === 0);
      setBlock(cx + x, gy + y, cz + z, isWhite ? PAL.STONE_MARBLE : PAL.BRICK_RED);
    } } }
    // Main dome - blue with gold
    for (var y = 0; y < 8; y++) { var radius = Math.max(0, 2 - Math.floor(y / 3)); for (var x = -radius; x <= radius; x++) { for (var z = -radius; z <= radius; z++) setBlock(cx + x, gy + 14 + y, cz + z, PAL.BLUE_TILE); } }
    setBlock(cx, gy + 22, cz, PAL.METAL_COPPER); setBlock(cx, gy + 23, cz, PAL.METAL_COPPER);
    // 8 chapels with realistic colors: green, blue, gold, red, white stripes
    var chapelColors = [PAL.ROOF_GREEN, PAL.BLUE_TILE, PAL.METAL_COPPER, PAL.BRICK_RED, PAL.STONE_MARBLE, PAL.ROOF_TERRACOTTA, PAL.GLASS_BLUE, PAL.ROOF_GREEN];
    var chapelOffsets = [[-5,-5],[5,-5],[5,5],[-5,5],[0,-7],[7,0],[0,7],[-7,0]];
    for (var ci = 0; ci < 8; ci++) {
      var cox = cx + chapelOffsets[ci][0], coz = cz + chapelOffsets[ci][1];
      // Chapel body - white/red striped
      for (var y = 0; y < 8; y++) { for (var x = -2; x <= 2; x++) { for (var z = -2; z <= 2; z++) { var isWall = Math.abs(x) === 2 || Math.abs(z) === 2; if (isWall || y === 7) { var isWhite = ((x + y + z) % 2 === 0); setBlock(cox + x, gy + y, coz + z, isWhite ? PAL.STONE_MARBLE : PAL.BRICK_RED); } } } }
      var col = chapelColors[ci];
      for (var dy = 0; dy < 4; dy++) { var radius = (dy < 2) ? 2 - dy : 1; for (var dxx = -radius; dxx <= radius; dxx++) { for (var dzz = -radius; dzz <= radius; dzz++) { if (Math.abs(dxx) + Math.abs(dzz) <= radius + 1) setBlock(cox + dxx, gy + 8 + dy, coz + dzz, col); } } }
      setBlock(cox, gy + 12, coz, PAL.METAL_COPPER); setBlock(cox, gy + 13, coz, PAL.METAL_COPPER);
    }
    // Arched walkway between chapels
    for (var i = 0; i < 8; i++) {
      var o1 = chapelOffsets[i]; var o2 = chapelOffsets[(i + 1) % 8];
      var mx = cx + Math.round((o1[0] + o2[0]) / 2); var mz = cz + Math.round((o1[1] + o2[1]) / 2);
      for (var y = 0; y < 4; y++) setBlock(mx, gy + y, mz, PAL.BRICK_RED);
    }
    setBlock(cx, gy, cz + 9, PAL.AIR); setBlock(cx, gy + 1, cz + 9, PAL.AIR); setBlock(cx, gy + 2, cz + 9, PAL.AIR);
  }

  // ── motherlandMonument ──
  function motherlandMonument(ox, oz, gy) {
    for (var y = 0; y < 20; y++) { for (var x = -6; x <= 6; x++) { for (var z = -4; z <= 4; z++) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE); } }
    for (var y = 0; y < 30; y++) { var sz = Math.max(1, 4 - Math.floor(y / 8)); for (var x = -sz; x <= sz; x++) { for (var z = -sz; z <= sz; z++) setBlock(ox + x, gy + 20 + y, oz + z, PAL.METAL); } }
    for (var i = 0; i < 10; i++) { setBlock(ox + 4 + Math.floor(i / 3), gy + 35 + i, oz, PAL.METAL); setBlock(ox + 5 + Math.floor(i / 3), gy + 35 + i, oz, PAL.METAL); }
    for (var x = -6; x <= -2; x++) { for (var y = 28; y < 36; y++) setBlock(ox + x, gy + y, oz - 3, PAL.METAL); }
    setBlock(ox - 4, gy + 32, oz - 4, PAL.BRICK); setBlock(ox - 4, gy + 33, oz - 4, PAL.BRICK); setBlock(ox - 4, gy + 34, oz - 4, PAL.BRICK);
    setBlock(ox - 5, gy + 32, oz - 4, PAL.BRICK); setBlock(ox - 3, gy + 32, oz - 4, PAL.BRICK);
    for (var sx = -7; sx <= 7; sx++) { setBlock(ox + sx, gy, oz + 5, PAL.STONE); setBlock(ox + sx, gy + 1, oz + 6, PAL.STONE); }
  }

  // ── kremlinWall ──
  function kremlinWall(ox, oz, gy, w, d, h) {
    for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isEdge = x === 0 || x === w - 1 || z === 0 || z === d - 1; if (isEdge) { for (var y = 0; y < h; y++) { var bt = PAL.BRICK; if (y === h - 1 && (x + z) % 2 === 0) bt = PAL.AIR; setBlock(ox + x, gy + y, oz + z, bt); } } } }
    var towerPositions = [[0,0],[Math.floor(w/2),0],[w-1,0],[0,Math.floor(d/2)],[w-1,Math.floor(d/2)],[0,d-1],[Math.floor(w/2),d-1],[w-1,d-1]];
    for (var ti = 0; ti < towerPositions.length; ti++) {
      var tx = ox + towerPositions[ti][0], tz = oz + towerPositions[ti][1];
      for (var y = 0; y < h + 6; y++) { for (var dx = -1; dx <= 1; dx++) { for (var dz = -1; dz <= 1; dz++) { var bt = PAL.BRICK; if (y > h + 2) bt = PAL.ROOFTILE; setBlock(tx + dx, gy + y, tz + dz, bt); } } }
      setBlock(tx, gy + h + 6, tz, PAL.METAL); setBlock(tx + 1, gy + h + 6, tz, PAL.METAL); setBlock(tx - 1, gy + h + 6, tz, PAL.METAL); setBlock(tx, gy + h + 6, tz + 1, PAL.METAL); setBlock(tx, gy + h + 6, tz - 1, PAL.METAL);
      if (ti === 1) { setBlock(tx, gy + h + 2, tz + 2, PAL.WHITE_TILE); setBlock(tx + 1, gy + h + 2, tz + 2, PAL.WHITE_TILE); setBlock(tx - 1, gy + h + 2, tz + 2, PAL.WHITE_TILE); setBlock(tx, gy + h + 3, tz + 2, PAL.WHITE_TILE); setBlock(tx, gy + h + 1, tz + 2, PAL.WHITE_TILE); }
    }
  }

  // ── moscowStateUniversity ──
  function moscowStateUniversity(ox, oz, gy) {
    for (var y = 0; y < 35; y++) { var w = Math.max(4, 10 - Math.floor(y / 5)); for (var x = -w; x <= w; x++) { for (var z = -w; z <= w; z++) { var isWall = Math.abs(x) === w || Math.abs(z) === w; if (isWall || y === 34) { var bt = (y === 0) ? PAL.STONE : PAL.CONCRETE; if (y === 34) bt = PAL.METAL; setBlock(ox + x, gy + y, oz + z, bt); } } } }
    setBlock(ox, gy + 35, oz, PAL.METAL); setBlock(ox + 1, gy + 35, oz, PAL.METAL); setBlock(ox - 1, gy + 35, oz, PAL.METAL); setBlock(ox, gy + 35, oz + 1, PAL.METAL); setBlock(ox, gy + 35, oz - 1, PAL.METAL); setBlock(ox, gy + 36, oz, PAL.METAL);
    var wingOffsets = [[-12,0],[12,0],[0,-12],[0,12]];
    for (var wi = 0; wi < 4; wi++) { var wx = ox + wingOffsets[wi][0], wz = oz + wingOffsets[wi][1]; for (var y = 0; y < 20; y++) { var ww = Math.max(3, 6 - Math.floor(y / 6)); for (var x = -ww; x <= ww; x++) { for (var z = -ww; z <= ww; z++) { var isWall = Math.abs(x) === ww || Math.abs(z) === ww; if (isWall || y === 19) setBlock(wx + x, gy + y, wz + z, PAL.CONCRETE); } } } }
    for (var col = 0; col < 6; col++) { for (var y = 0; y < 6; y++) setBlock(ox - 5 + col * 2, gy + y, oz + 8, PAL.STONE); }
  }

  // ── industrialFactory ──
  function industrialFactory(ox, oz, gy, w, d, h, color, detailLevel, damaged) {
    color = color || PAL.METAL;
    detailLevel = detailLevel || GLOBAL_DETAIL;
    var damage = damaged ? 0.6 : (GLOBAL_DAMAGE || 0);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = color;
            if (y === 0) bt = PAL.CONCRETE;
            if (isRoof) { var saw = (x + z) % 4 < 2; bt = saw ? PAL.METAL : PAL.GLASS; }
            // Industrial textures: corrugated metal, rust
            if (bt === PAL.METAL && Math.random() < 0.2) bt = PAL.METAL_RUST;
            if (isWall && y > 1 && Math.random() < 0.1) bt = PAL.CONCRETE_DARK;
            // Damage
            if (_isDamagedSkip(damage, x, y, z, w, h, d)) continue;
            setBlock(ox + x, gy + y, oz + z, bt);
          }
        }
      }
    }
    // Smokestacks
    for (var si = 0; si < 2; si++) {
      var sx = ox + Math.floor(w / 3) + si * Math.floor(w / 3);
      var sz = oz + Math.floor(d / 2);
      for (var y = 0; y < h + 12; y++) {
        var bt = (y % 4 < 2) ? PAL.BRICK : PAL.WHITE_TILE;
        if (damage > 0 && Math.random() < damage * 0.1) continue;
        setBlock(sx, gy + y, sz, bt);
        setBlock(sx + 1, gy + y, sz, bt);
        setBlock(sx, gy + y, sz + 1, bt);
        setBlock(sx + 1, gy + y, sz + 1, bt);
      }
      // Smokestack tops with fire if damaged
      if (damage > 0) {
        setBlock(sx, gy + h + 12, sz, PAL.FIRE);
        setBlock(sx + 1, gy + h + 12, sz, PAL.FIRE);
      }
    }
    // Roof pipes
    for (var x = 2; x < w - 2; x += 4) {
      setBlock(ox + x, gy + h, oz + 2, PAL.METAL);
      setBlock(ox + x, gy + h + 1, oz + 2, PAL.METAL);
    }
    // Interior: machinery, pipes
    if (detailLevel >= 1) {
      // Interior machinery blocks
      for (var x = 2; x < w - 2; x += 3) {
        for (var z = 2; z < d - 2; z += 3) {
          setBlock(ox + x, gy + 1, oz + z, PAL.METAL_DARK);
          setBlock(ox + x, gy + 2, oz + z, PAL.METAL_DARK);
          // Pipe connections
          if (x < w - 4) setBlock(ox + x + 1, gy + 2, oz + z, PAL.METAL_RUST);
          if (z < d - 4) setBlock(ox + x, gy + 2, oz + z + 1, PAL.METAL_RUST);
        }
      }
      // Overhead pipes
      for (var x = 2; x < w - 2; x++) {
        setBlock(ox + x, gy + h - 2, oz + Math.floor(d / 2), PAL.METAL_RUST);
      }
    }
    // Entrance
    setBlock(ox + Math.floor(w / 2), gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2), gy + 1, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2) + 1, gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2) + 1, gy + 1, oz, PAL.AIR);
    // Ground-level details
    if (detailLevel >= 1) {
      _addGroundBollards(ox, gy, oz, w, d);
      _addGroundSteps(ox, gy, oz, w, d);
    }
    // Damage rubble
    _addRubble(ox, gy, oz, w, d, damage);
  }


  // ── azovstalComplex ──
  function azovstalComplex(ox, oz, gy, w, d, h, color) { color = color || PAL.METAL;
    for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (y === 0) bt = PAL.CONCRETE; if (isRoof) bt = PAL.ROOFTILE; setBlock(ox + x, gy + y, oz + z, bt); } } } }
    var bfX = ox + Math.floor(w / 2), bfZ = oz + Math.floor(d / 3);
    for (var y = 0; y < h + 15; y++) { var radius = (y < h) ? 4 : Math.max(2, 4 - Math.floor((y - h) / 4)); for (var dx = -radius; dx <= radius; dx++) { for (var dz = -radius; dz <= radius; dz++) { if (dx * dx + dz * dz <= radius * radius + 1) setBlock(bfX + dx, gy + y, bfZ + dz, PAL.METAL); } } }
    for (var ci = 0; ci < 2; ci++) { var cx = ox + 5 + ci * (w - 10), cz = oz + d - 8; for (var y = 0; y < 18; y++) { var radius = 3 + Math.floor(Math.sin(y * 0.15) * 2); for (var dx = -radius; dx <= radius; dx++) { for (var dz = -radius; dz <= radius; dz++) { if (dx * dx + dz * dz <= radius * radius + 1) setBlock(cx + dx, gy + y, cz + dz, PAL.CONCRETE); } } } }
    for (var si = 0; si < 4; si++) { var sx = ox + 3 + si * Math.floor(w / 4); var sz = oz + Math.floor(d / 2) + 5; for (var y = 0; y < h + 10; y++) { var bt = (y % 4 < 2) ? PAL.BRICK : PAL.WHITE_TILE; setBlock(sx, gy + y, sz, bt); setBlock(sx + 1, gy + y, sz, bt); setBlock(sx, gy + y, sz + 1, bt); setBlock(sx + 1, gy + y, sz + 1, bt); } }
    for (var x = 0; x < w; x += 3) { setBlock(ox + x, gy + h, oz + Math.floor(d / 2), PAL.METAL); setBlock(ox + x, gy + h + 1, oz + Math.floor(d / 2), PAL.METAL); }
  }

  // ── coolingTower ──
  function coolingTower(ox, oz, gy, h) { h = h || 18; for (var y = 0; y < h; y++) { var radius = 3 + Math.floor(Math.sin(y * 0.15) * 2); for (var dx = -radius; dx <= radius; dx++) { for (var dz = -radius; dz <= radius; dz++) { if (dx * dx + dz * dz <= radius * radius + 1) setBlock(ox + dx, gy + y, oz + dz, PAL.CONCRETE); } } } }

  // ── distillationTower ──
  function distillationTower(ox, oz, gy, h) { h = h || 16; for (var y = 0; y < h; y++) { var w = (y < h / 2) ? 3 : 2; for (var x = -w; x <= w; x++) { for (var z = -w; z <= w; z++) { var isWall = Math.abs(x) === w || Math.abs(z) === w; if (isWall) setBlock(ox + x, gy + y, oz + z, PAL.METAL); } } } for (var py = 4; py < h; py += 4) { for (var x = -4; x <= 4; x++) setBlock(ox + x, gy + py, oz, PAL.METAL); } setBlock(ox, gy + h, oz, PAL.FIRE); setBlock(ox, gy + h + 1, oz, PAL.FIRE); }

  // ── storageTank ──
  function storageTank(ox, oz, gy, radius, h) { radius = radius || 5; h = h || 6; for (var y = 0; y < h; y++) { for (var dx = -radius; dx <= radius; dx++) { for (var dz = -radius; dz <= radius; dz++) { var dist = Math.sqrt(dx * dx + dz * dz); if (dist <= radius && dist >= radius - 1) { var bt = (y === h - 1) ? PAL.METAL : PAL.CONCRETE; setBlock(ox + dx, gy + y, oz + dz, bt); } if (dist < radius - 1 && y === 0) setBlock(ox + dx, gy + y, oz + dz, PAL.CONCRETE); } } } }

  // ── parliamentBuilding ──
  function parliamentBuilding(ox, oz, gy, w, d, h, color) { color = color || PAL.CONCRETE; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (y === 0) bt = PAL.STONE; if (isRoof) bt = PAL.ROOFTILE; setBlock(ox + x, gy + y, oz + z, bt); } } } } for (var col = 0; col < 6; col++) { for (var y = 0; y < h; y++) setBlock(ox + 2 + col * 2, gy + y, oz + d, PAL.STONE); } for (var sx = 0; sx < w; sx++) { setBlock(ox + sx, gy, oz + d + 1, PAL.STONE); setBlock(ox + sx, gy - 1, oz + d + 2, PAL.STONE); } for (var y = 0; y < 8; y++) setBlock(ox + Math.floor(w / 2), gy + h + y, oz + d - 2, PAL.METAL); setBlock(ox + Math.floor(w / 2), gy + h + 8, oz + d - 2, PAL.FLAG); for (var y = 2; y < h - 1; y += 2) { for (var x = 2; x < w - 2; x += 2) setBlock(ox + x, gy + y, oz + d - 1, PAL.GLASS); } }

  // ── lubyankaBuilding ──
  function lubyankaBuilding(ox, oz, gy, w, d, h, color) { color = color || PAL.PLASTER; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (y === 0) bt = PAL.STONE; if (isRoof) bt = PAL.ROOFTILE; setBlock(ox + x, gy + y, oz + z, bt); } } } } for (var y = 0; y < 4; y++) { for (var x = -2; x <= 2; x++) setBlock(ox + Math.floor(w / 2) + x, gy + y, oz + d, PAL.STONE); } setBlock(ox + Math.floor(w / 2), gy, oz + d - 1, PAL.AIR); setBlock(ox + Math.floor(w / 2), gy + 1, oz + d - 1, PAL.AIR); }

  // ── bolshoiTheatre ──
  function bolshoiTheatre(ox, oz, gy, w, d, h, color) { color = color || PAL.WHITE_TILE; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (y === 0) bt = PAL.STONE; if (isRoof) bt = PAL.ROOFTILE; setBlock(ox + x, gy + y, oz + z, bt); } } } } for (var col = 0; col < 8; col++) { for (var y = 0; y < h - 1; y++) setBlock(ox + 1 + col * 2, gy + y, oz + d, PAL.WHITE_TILE); } for (var py = 0; py < 4; py++) { for (var x = py; x < w - py; x++) setBlock(ox + x, gy + h + py, oz + d, PAL.WHITE_TILE); } setBlock(ox + Math.floor(w / 2), gy + h + 4, oz + d, PAL.METAL); setBlock(ox + Math.floor(w / 2) - 1, gy + h + 4, oz + d, PAL.METAL); setBlock(ox + Math.floor(w / 2) + 1, gy + h + 4, oz + d, PAL.METAL); }

  // ── leninMausoleum ──
  function leninMausoleum(ox, oz, gy) { for (var y = 0; y < 6; y++) { var sz = 4 - Math.floor(y / 2); for (var x = -sz; x <= sz; x++) { for (var z = -sz; z <= sz; z++) setBlock(ox + x, gy + y, oz + z, PAL.BRICK); } } setBlock(ox, gy, oz + 3, PAL.AIR); setBlock(ox, gy + 1, oz + 3, PAL.AIR); }

  // ── gumDepartmentStore ──
  function gumDepartmentStore(ox, oz, gy, w, d, h, color) { color = color || PAL.CONCRETE; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (isRoof) bt = PAL.GLASS; setBlock(ox + x, gy + y, oz + z, bt); } } } } for (var y = 1; y < h - 1; y++) { for (var x = 2; x < w - 2; x++) { for (var z = 2; z < d - 2; z++) setBlock(ox + x, gy + y, oz + z, PAL.AIR); } } for (var x = 0; x < w; x++) { if (x % 2 === 0) { setBlock(ox + x, gy + 1, oz + d, PAL.STONE); setBlock(ox + x, gy + 2, oz + d, PAL.STONE); } } }

  // ── stateHistoricalMuseum ──
  function stateHistoricalMuseum(ox, oz, gy, w, d, h, color) { color = color || PAL.BRICK; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (x === 0 || x === w - 1 || y === h - 1) bt = PAL.WHITE_TILE; setBlock(ox + x, gy + y, oz + z, bt); } } } } var corners = [[0,0],[w-1,0],[0,d-1],[w-1,d-1]]; for (var ci = 0; ci < 4; ci++) { var cx = ox + corners[ci][0], cz = oz + corners[ci][1]; for (var y = 0; y < 5; y++) setBlock(cx, gy + h + y, cz, PAL.WHITE_TILE); setBlock(cx, gy + h + 5, cz, PAL.METAL); } }

  // ── dugaRadar ──
  function dugaRadar(ox, oz, gy) { for (var side = 0; side < 2; side++) { var dx = side === 0 ? -1 : 1; for (var y = 0; y < 20; y++) { var offset = Math.floor(y * 0.6); setBlock(ox + dx * offset, gy + y, oz, PAL.METAL); setBlock(ox + dx * offset, gy + y, oz + 1, PAL.METAL); setBlock(ox + dx * offset, gy + y, oz - 1, PAL.METAL); if (y % 3 === 0) { for (var bx = 0; bx <= offset; bx++) setBlock(ox + dx * bx, gy + y, oz, PAL.METAL); } } } for (var y = 0; y < 15; y++) { setBlock(ox, gy + y, oz, PAL.METAL); setBlock(ox, gy + y, oz + 1, PAL.METAL); } }

  // ── sarcophagus ──
  function sarcophagus(ox, oz, gy) { for (var y = 0; y < 12; y++) { for (var x = -12; x <= 12; x++) { for (var z = -8; z <= 8; z++) { var archHeight = Math.sqrt(144 - x * x) * 0.6; if (y < archHeight && Math.abs(z) === 8) setBlock(ox + x, gy + y, oz + z, PAL.METAL); if (y >= archHeight - 1 && y < archHeight + 1 && Math.abs(x) <= 12) setBlock(ox + x, gy + y, oz + z, PAL.METAL); } } } for (var y = 0; y < 6; y++) { for (var x = -8; x <= 8; x++) { for (var z = -5; z <= 5; z++) setBlock(ox + x, gy - 6 + y, oz + z, PAL.CONCRETE); } } }

  // ── pripyatFerrisWheel ──
  function pripyatFerrisWheel(ox, oz, gy) { for (var y = 0; y < 12; y++) setBlock(ox, gy + y, oz, PAL.METAL); for (var angle = 0; angle < Math.PI * 2; angle += 0.2) { var wx = Math.round(Math.cos(angle) * 6); var wy = Math.round(Math.sin(angle) * 6); setBlock(ox + wx, gy + 12 + wy, oz, PAL.METAL); if (angle % 0.6 < 0.2) setBlock(ox + wx, gy + 12 + wy - 1, oz, PAL.GLASS); } for (var y = 0; y < 12; y++) { setBlock(ox + 3, gy + y, oz, PAL.METAL); setBlock(ox - 3, gy + y, oz, PAL.METAL); } }

  // ── crimeaBridge ──
  function crimeaBridge(ox, oz, gy, length, width, height) { length = length || 60; width = width || 6; height = height || 3; for (var x = 0; x < length; x++) { for (var z = 0; z < width; z++) { setBlock(ox + x, gy + height, oz + z, PAL.ASPHALT); if (z === 0 || z === width - 1) setBlock(ox + x, gy + height + 1, oz + z, PAL.METAL); } if (x % 12 === 0) { for (var y = 0; y < height; y++) { for (var z = 0; z < width; z++) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE); } } } for (var x = 0; x < length; x++) { for (var z = -2; z < width + 2; z++) setBlock(ox + x, gy + height - 2, oz + z, PAL.METAL); } }

  // ── dramaTheater ──
  function dramaTheater(ox, oz, gy, w, d, h, color) { color = color || PAL.WHITE_TILE; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (isRoof) bt = PAL.ROOFTILE; if (x > w / 2 && y > h / 2 && Math.random() < 0.5) continue; setBlock(ox + x, gy + y, oz + z, bt); } } } } for (var sx = 2; sx < w - 2; sx++) setBlock(ox + sx, gy + h - 2, oz + d, PAL.WHITE_TILE); setBlock(ox + Math.floor(w / 2), gy, oz + d - 1, PAL.AIR); setBlock(ox + Math.floor(w / 2), gy + 1, oz + d - 1, PAL.AIR); setBlock(ox + Math.floor(w / 2) + 1, gy, oz + d - 1, PAL.AIR); setBlock(ox + Math.floor(w / 2) + 1, gy + 1, oz + d - 1, PAL.AIR); }

  // ── antonovskyBridge ──
  function antonovskyBridge(ox, oz, gy, length, width, height) { length = length || 50; width = width || 6; height = height || 5; for (var x = 0; x < length; x++) { for (var z = 0; z < width; z++) { if (x > 20 && x < 30) continue; setBlock(ox + x, gy + height, oz + z, PAL.ASPHALT); if (z === 0 || z === width - 1) setBlock(ox + x, gy + height + 1, oz + z, PAL.METAL); } if (x === 10 || x === 40) { for (var y = 0; y < height + 12; y++) { for (var pz = -1; pz <= 1; pz++) setBlock(ox + x, gy + y, oz + Math.floor(width / 2) + pz, PAL.CONCRETE); } for (var c = 0; c < 10; c++) { setBlock(ox + x + c, gy + height + 10 - c, oz + Math.floor(width / 2), PAL.METAL); setBlock(ox + x - c, gy + height + 10 - c, oz + Math.floor(width / 2), PAL.METAL); } } if (x % 10 === 0) { for (var y = 0; y < height; y++) { for (var z = 0; z < width; z++) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE); } } } }

  // ── trenches ──
  function trenches(ox, oz, gy, length) { length = length || 20; for (var i = 0; i < length; i++) { var tx = ox + i; var tz = oz + (i % 4 < 2 ? 0 : 2); setBlock(tx, gy, tz, PAL.DIRT); setBlock(tx, gy, tz + 1, PAL.DIRT); setBlock(tx, gy + 1, tz, PAL.DIRT); setBlock(tx, gy + 1, tz + 1, PAL.DIRT); setBlock(tx, gy - 1, tz, PAL.DIRT); setBlock(tx, gy - 1, tz + 1, PAL.DIRT); setBlock(tx, gy + 2, tz - 1, PAL.SANDBAG); setBlock(tx, gy + 2, tz + 2, PAL.SANDBAG); } }

  // ── dragonTeeth ──
  function dragonTeeth(ox, oz, gy, count) { count = count || 10; for (var i = 0; i < count; i++) { var tx = ox + i * 2; var tz = oz + (i % 2 === 0 ? 0 : 1); for (var dx = 0; dx <= 1; dx++) { for (var dz = 0; dz <= 1; dz++) { for (var dy = 0; dy < 4; dy++) setBlock(tx + dx, gy + dy, tz + dz, PAL.CONCRETE); } } setBlock(tx, gy + 4, tz, PAL.CONCRETE); } }

  // ── coastalFort ──
  function coastalFort(ox, oz, gy) { for (var angle = 0; angle < Math.PI * 2; angle += 0.15) { var rx = Math.round(Math.cos(angle) * 8); var rz = Math.round(Math.sin(angle) * 8); for (var y = 0; y < 4; y++) setBlock(ox + rx, gy + y, oz + rz, PAL.STONE); if (angle % 1.0 < 0.3) setBlock(ox + rx, gy + 3, oz + rz, PAL.METAL); } for (var y = 0; y < 5; y++) { for (var x = -2; x <= 2; x++) { for (var z = -2; z <= 2; z++) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE); } } }

  // ── monumentToSunkenShips ──
  function monumentToSunkenShips(ox, oz, gy) { for (var y = 0; y < 10; y++) { var sz = Math.max(1, 2 - Math.floor(y / 4)); for (var x = -sz; x <= sz; x++) { for (var z = -sz; z <= sz; z++) setBlock(ox + x, gy + y, oz + z, PAL.STONE); } } for (var y = 0; y < 12; y++) { setBlock(ox, gy + 10 + y, oz, PAL.STONE); setBlock(ox + 1, gy + 10 + y, oz, PAL.STONE); setBlock(ox, gy + 10 + y, oz + 1, PAL.STONE); setBlock(ox + 1, gy + 10 + y, oz + 1, PAL.STONE); } setBlock(ox, gy + 22, oz, PAL.METAL); setBlock(ox, gy + 23, oz, PAL.METAL); setBlock(ox + 1, gy + 22, oz, PAL.METAL); setBlock(ox - 1, gy + 22, oz, PAL.METAL); }

  // ── snakeIslandBorderPost ──
  function snakeIslandBorderPost(ox, oz, gy) { for (var y = 0; y < 3; y++) { for (var x = -1; x <= 1; x++) { for (var z = -1; z <= 1; z++) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE); } } for (var y = 0; y < 6; y++) setBlock(ox, gy + 3 + y, oz, PAL.METAL); setBlock(ox, gy + 9, oz, PAL.FLAG); setBlock(ox + 1, gy + 9, oz, PAL.FLAG); setBlock(ox - 1, gy + 9, oz, PAL.FLAG); setBlock(ox + 2, gy, oz + 2, PAL.STONE); setBlock(ox + 2, gy + 1, oz + 2, PAL.STONE); setBlock(ox + 2, gy + 2, oz + 2, PAL.STONE); }

  // ── airportTerminal ──
  function airportTerminal(ox, oz, gy, w, d, h, color) { color = color || PAL.CONCRETE; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (z === 0 && x > 2 && x < w - 3 && y > 0 && y < h - 1) bt = PAL.GLASS; setBlock(ox + x, gy + y, oz + z, bt); } } } } var tx = ox + w - 3, tz = oz + 2; for (var y = 0; y < h + 6; y++) { for (var x = 0; x < 3; x++) { for (var z = 0; z < 3; z++) { var isWall = x === 0 || x === 2 || z === 0 || z === 2; if (isWall) setBlock(tx + x, gy + y, tz + z, PAL.CONCRETE); } } } for (var x = 0; x < 3; x++) { for (var z = 0; z < 3; z++) setBlock(tx + x, gy + h + 4, tz + z, PAL.GLASS); } }

  // ── hangar ──
  function hangar(ox, oz, gy, w, d, h, color) { color = color || PAL.METAL; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var archHeight = Math.sin((x / (w - 1)) * Math.PI) * (h - 2); var isRoof = y >= archHeight && y < h; if (isWall || isRoof) setBlock(ox + x, gy + y, oz + z, color); } } } for (var x = Math.floor(w / 3); x < Math.floor(w * 2 / 3); x++) { setBlock(ox + x, gy, oz, PAL.AIR); setBlock(ox + x, gy + 1, oz, PAL.AIR); setBlock(ox + x, gy, oz + d - 1, PAL.AIR); setBlock(ox + x, gy + 1, oz + d - 1, PAL.AIR); } }

  // ── controlTower ──
  function controlTower(ox, oz, gy, w, d, h, color) { color = color || PAL.CONCRETE; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; if (isWall) setBlock(ox + x, gy + y, oz + z, y < h - 4 ? color : PAL.REINFORCED); } } } var cabY = gy + h - 4; var cabOverhang = 2; for (var cx = -cabOverhang; cx < w + cabOverhang; cx++) { for (var cz = -cabOverhang; cz < d + cabOverhang; cz++) { for (var cy = 0; cy < 4; cy++) { var isCabWall = cx === -cabOverhang || cx === w + cabOverhang - 1 || cz === -cabOverhang || cz === d + cabOverhang - 1; var isCabRoof = cy === 3; if (isCabWall || isCabRoof) { var bt = isCabRoof ? PAL.CONCRETE : PAL.GLASS; setBlock(ox + cx, cabY + cy, oz + cz, bt); } } } } var topY = gy + h + 1; for (var ay = 0; ay < 4; ay++) setBlock(ox + Math.floor(w / 2), topY + ay, oz + Math.floor(d / 2), PAL.METAL); setBlock(ox + Math.floor(w / 2) - 1, topY + 2, oz + Math.floor(d / 2), PAL.METAL); setBlock(ox + Math.floor(w / 2) + 1, topY + 2, oz + Math.floor(d / 2), PAL.METAL); setBlock(ox + Math.floor(w / 2), topY + 2, oz + Math.floor(d / 2) - 1, PAL.METAL); setBlock(ox + Math.floor(w / 2), topY + 2, oz + Math.floor(d / 2) + 1, PAL.METAL); for (var dmg = 0; dmg < 3; dmg++) { var dmgX = ox + Math.floor(Math.random() * w); var dmgY = gy + Math.floor(Math.random() * h); var dmgZ = oz + Math.floor(Math.random() * d); setBlock(dmgX, dmgY, dmgZ, PAL.AIR); } }

  // ── warehouse ──
  function warehouse(ox, oz, gy, w, d, h, color) { color = color || PAL.METAL; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) setBlock(ox + x, gy + y, oz + z, color); } } } for (var x = 0; x < w; x++) setBlock(ox + x, gy, oz + d, PAL.CONCRETE); setBlock(ox + Math.floor(w / 2), gy, oz, PAL.AIR); setBlock(ox + Math.floor(w / 2), gy + 1, oz, PAL.AIR); setBlock(ox + Math.floor(w / 2) + 1, gy, oz, PAL.AIR); setBlock(ox + Math.floor(w / 2) + 1, gy + 1, oz, PAL.AIR); }

  // ── officeBuilding ──
  function officeBuilding(ox, oz, gy, w, d, floors, color, detailLevel, damaged) {
    color = color || PAL.CONCRETE;
    detailLevel = detailLevel || GLOBAL_DETAIL;
    var damage = damaged ? 0.6 : (GLOBAL_DAMAGE || 0);
    var h = floors * 3 + 1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = color;
            if (isWall && y > 0 && y < h - 1) {
              if (x % 2 === 0 || z % 2 === 0) bt = color;
              else bt = PAL.GLASS;
            }
            // Office textures: glass curtain walls, reflective surfaces
            if (bt === PAL.CONCRETE && Math.random() < 0.15) bt = PAL.CONCRETE_LIGHT;
            if (bt === PAL.GLASS && Math.random() < 0.3) bt = PAL.GLASS_BLUE;
            // Damage
            if (_isDamagedSkip(damage, x, y, z, w, h, d)) continue;
            setBlock(ox + x, gy + y, oz + z, bt);
          }
          // Broken glass for damaged buildings
          if (isWall && !isRoof && y > 0 && y < h - 1) {
            if ((x % 2 !== 0 && z % 2 !== 0) && damage > 0 && Math.random() < damage * 0.4) {
              setBlock(ox + x, gy + y, oz + z, PAL.AIR);
            }
          }
        }
      }
    }
    // Interior: cubicle floors, glass walls
    if (detailLevel >= 1) {
      for (var f = 1; f < floors; f++) {
        var fy = gy + f * 3;
        // Floor slabs
        for (var x = 1; x < w - 1; x++) {
          for (var z = 1; z < d - 1; z++) {
            setBlock(ox + x, fy, oz + z, PAL.CONCRETE_LIGHT);
          }
        }
        // Cubicle walls (glass partitions)
        for (var x = 2; x < w - 2; x += 3) {
          for (var z = 1; z < d - 1; z++) {
            if (z % 2 !== 0) {
              setBlock(ox + x, fy + 1, oz + z, PAL.GLASS_BLUE);
              setBlock(ox + x, fy + 2, oz + z, PAL.GLASS_BLUE);
            }
          }
        }
        // Central elevator shaft
        var ex = Math.floor(w / 2);
        var ez = Math.floor(d / 2);
        setBlock(ox + ex, fy + 1, oz + ez, PAL.METAL_DARK);
        setBlock(ox + ex, fy + 2, oz + ez, PAL.METAL_DARK);
      }
    }
    // Entrance canopy
    for (var x = -1; x < w + 1; x++) setBlock(ox + x, gy + 2, oz + d, PAL.CONCRETE);
    // Entrance
    setBlock(ox + Math.floor(w / 2), gy, oz + d - 1, PAL.AIR);
    setBlock(ox + Math.floor(w / 2), gy + 1, oz + d - 1, PAL.AIR);
    // Rooftop details
    if (detailLevel >= 1) {
      _addRooftopAC(ox, gy + h, oz, w, d);
      _addRooftopWaterTank(ox, gy + h, oz, w, d);
      _addRooftopAntenna(ox, gy + h, oz, w, d);
      if (floors >= 6) _addHelipad(ox, gy + h, oz, w, d);
    }
    // Ground-level details
    if (detailLevel >= 1) {
      _addGroundSteps(ox, gy, oz, w, d);
      _addGroundBollards(ox, gy, oz, w, d);
      _addGroundStreetLamp(ox, gy, oz, w, d);
    }
    // Damage rubble
    _addRubble(ox, gy, oz, w, d, damage);
  }


  // ── residentialHouse ──
  function residentialHouse(ox, oz, gy, w, d, h, color, detailLevel, damaged) {
    color = color || PAL.BRICK;
    detailLevel = detailLevel || GLOBAL_DETAIL;
    var damage = damaged ? 0.6 : (GLOBAL_DAMAGE || 0);
    // Main house shell
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = (y === 0) ? PAL.STONE : color;
            if (isRoof) bt = PAL.ROOFTILE;
            // Residential textures: brick, wood trim, colorful balconies
            if (isWall && y > 0 && y < h - 1 && Math.random() < 0.1) bt = PAL.WOOD;
            if (isWall && y > 1 && y < h - 2 && x % 4 === 0) bt = PAL.WOOD_LIGHT; // wood trim
            if (isRoof && Math.random() < 0.15) bt = PAL.ROOF_DARK_BROWN;
            // Damage
            if (_isDamagedSkip(damage, x, y, z, w, h, d)) continue;
            setBlock(ox + x, gy + y, oz + z, bt);
          }
        }
      }
    }
    // Interior: rooms, furniture blocks
    if (detailLevel >= 1) {
      // Floor
      for (var x = 1; x < w - 1; x++) {
        for (var z = 1; z < d - 1; z++) {
          setBlock(ox + x, gy, oz + z, PAL.WOOD_LIGHT);
        }
      }
      // Interior walls (living room / kitchen / bedroom)
      for (var y = 1; y < h - 1; y++) {
        // Wall dividing living room and kitchen
        for (var z = 1; z < d - 1; z++) {
          if (z !== Math.floor(d / 2)) {
            setBlock(ox + Math.floor(w / 2), gy + y, oz + z, PAL.WOOD);
          }
        }
        // Wall for bedroom
        for (var x = 1; x < w - 1; x++) {
          if (x !== Math.floor(w / 3)) {
            setBlock(ox + x, gy + y, oz + Math.floor(d / 2), PAL.WOOD);
          }
        }
      }
      // Furniture: table in kitchen
      setBlock(ox + 2, gy + 1, oz + 2, PAL.WOOD_DARK);
      setBlock(ox + 2, gy + 1, oz + 3, PAL.WOOD_DARK);
      // Bed in bedroom
      setBlock(ox + w - 3, gy + 1, oz + d - 3, PAL.WOOD_RED);
      setBlock(ox + w - 2, gy + 1, oz + d - 3, PAL.WOOD_RED);
      // Windows with glass
      for (var y = 1; y < h - 1; y++) {
        setBlock(ox + 1, gy + y, oz + d - 1, PAL.GLASS);
        setBlock(ox + w - 2, gy + y, oz + d - 1, PAL.GLASS);
      }
    }
    // Chimney
    var cx = ox + Math.floor(w / 2) + 1;
    var cz = oz + Math.floor(d / 2) + 1;
    for (var y = h; y < h + 3; y++) {
      setBlock(cx, gy + y, cz, PAL.BRICK);
    }
    // Entrance
    setBlock(ox + Math.floor(w / 2), gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2), gy + 1, oz, PAL.AIR);
    // Rooftop details
    if (detailLevel >= 1) {
      _addRooftopAntenna(ox, gy + h + 3, oz, w, d);
      _addRooftopSatelliteDish(ox, gy + h + 3, oz, w, d);
    }
    // Ground-level details
    if (detailLevel >= 1) {
      _addGroundSteps(ox, gy, oz, w, d);
      _addGroundBench(ox, gy, oz, w, d);
      _addGroundFence(ox, gy, oz, w, d);
      // Flower pots
      setBlock(ox + 1, gy, oz + d + 1, PAL.BUSH);
      setBlock(ox + w - 2, gy, oz + d + 1, PAL.BUSH);
    }
    // Damage rubble
    _addRubble(ox, gy, oz, w, d, damage);
  }

  // ── monument ──
  function monument(ox, oz, gy, type) { if (type === 'obelisk') { for (var y = 0; y < 12; y++) { var sz = Math.max(1, 2 - Math.floor(y / 4)); for (var x = -sz; x <= sz; x++) { for (var z = -sz; z <= sz; z++) setBlock(ox + x, gy + y, oz + z, PAL.STONE); } } setBlock(ox, gy + 12, oz, PAL.METAL); setBlock(ox + 1, gy + 12, oz, PAL.METAL); setBlock(ox - 1, gy + 12, oz, PAL.METAL); setBlock(ox, gy + 12, oz + 1, PAL.METAL); setBlock(ox, gy + 12, oz - 1, PAL.METAL); setBlock(ox, gy + 13, oz, PAL.METAL); } else if (type === 'tank') { for (var y = 0; y < 3; y++) { for (var x = -2; x <= 2; x++) { for (var z = -2; z <= 2; z++) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE); } } for (var x = -2; x <= 2; x++) { for (var z = -3; z <= 3; z++) setBlock(ox + x, gy + 3, oz + z, PAL.METAL); } for (var x = -1; x <= 1; x++) { for (var z = -1; z <= 1; z++) setBlock(ox + x, gy + 4, oz + z, PAL.METAL); } for (var z = 0; z < 5; z++) setBlock(ox, gy + 4, oz + 2 + z, PAL.METAL); } else if (type === 'motherland') { for (var y = 0; y < 15; y++) { var sz = Math.max(0, 3 - Math.floor(y / 3)); for (var x = -sz; x <= sz; x++) { for (var z = -sz; z <= sz; z++) setBlock(ox + x, gy + y, oz + z, PAL.STONE); } } for (var y = 5; y < 18; y++) setBlock(ox + 2, gy + y, oz, PAL.METAL); for (var x = -2; x <= 0; x++) { for (var y = 6; y < 12; y++) setBlock(ox + x, gy + y, oz - 1, PAL.METAL); } } }

  // ── bridge ──
  function bridge(ox, oz, gy, length, width, height) { for (var x = 0; x < length; x++) { for (var z = 0; z < width; z++) { setBlock(ox + x, gy + height, oz + z, PAL.ASPHALT); if (z === 0 || z === width - 1) setBlock(ox + x, gy + height + 1, oz + z, PAL.METAL); } if (x % 8 === 0) { for (var y = 0; y < height; y++) { for (var z = 0; z < width; z++) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE); } } } }

  // ── radarStation ──
  function radarStation(ox, oz, gy) { for (var y = 0; y < 4; y++) { for (var x = -2; x <= 2; x++) { for (var z = -2; z <= 2; z++) { var isWall = Math.abs(x) === 2 || Math.abs(z) === 2; if (isWall || y === 3) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE); } } } for (var y = 4; y < 8; y++) setBlock(ox, gy + y, oz, PAL.METAL); for (var dx = -3; dx <= 3; dx++) { for (var dz = -3; dz <= 3; dz++) { var dist = Math.sqrt(dx * dx + dz * dz); if (dist <= 3 && dist >= 1) { var dy = Math.floor(dist * 0.8); setBlock(ox + dx, gy + 8 - dy, oz + dz, PAL.METAL); } } } }

  // ── bunker ──
  function bunker(ox, oz, gy) { for (var y = 0; y < 3; y++) { for (var x = -3; x <= 3; x++) { for (var z = -3; z <= 3; z++) { var isWall = Math.abs(x) === 3 || Math.abs(z) === 3 || y === 0 || y === 2; if (isWall) setBlock(ox + x, gy + y - 2, oz + z, PAL.CONCRETE); else setBlock(ox + x, gy + y - 2, oz + z, PAL.AIR); } } } for (var y = 0; y < 3; y++) { for (var x = -1; x <= 1; x++) { for (var z = -1; z <= 1; z++) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE); } } setBlock(ox, gy, oz + 1, PAL.AIR); setBlock(ox, gy + 1, oz + 1, PAL.AIR); for (var sx = -4; sx <= 4; sx++) { setBlock(ox + sx, gy, oz - 4, PAL.SANDBAG); setBlock(ox + sx, gy, oz + 4, PAL.SANDBAG); } for (var sz = -4; sz <= 4; sz++) { setBlock(ox - 4, gy, oz + sz, PAL.SANDBAG); setBlock(ox + 4, gy, oz + sz, PAL.SANDBAG); } }

  // ── ruinedBuilding ──
  function ruinedBuilding(ox, oz, gy, w, d, h, collapse, color) { color = color || PAL.CONCRETE; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { if (collapse > 0) { var distFromCorner = Math.min(x + z, (w - x) + z, x + (d - z), (w - x) + (d - z)); if (distFromCorner < collapse * 3 && Math.random() < 0.6) continue; } var bt = (y === 0) ? PAL.BRICK : color; if (y > h - 2 && Math.random() < 0.4) bt = PAL.RUBBLE; setBlock(ox + x, gy + y, oz + z, bt); } } } } }

  // ── school ──
  function school(ox, oz, gy, w, d, h, color) { color = color || PAL.CONCRETE; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = (y === 0) ? PAL.BRICK : color; if (isRoof) bt = PAL.ROOFTILE; setBlock(ox + x, gy + y, oz + z, bt); } } } } for (var y = 2; y < h - 1; y += 2) { for (var x = 1; x < w - 1; x += 2) setBlock(ox + x, gy + y, oz + d - 1, PAL.GLASS); } setBlock(ox + Math.floor(w / 2), gy, oz + d - 1, PAL.AIR); setBlock(ox + Math.floor(w / 2), gy + 1, oz + d - 1, PAL.AIR); setBlock(ox + Math.floor(w / 2) - 1, gy, oz + d, PAL.STONE); setBlock(ox + Math.floor(w / 2), gy, oz + d, PAL.STONE); setBlock(ox + Math.floor(w / 2) + 1, gy, oz + d, PAL.STONE); }

  // ── trenchLine (alias for trenches with more control) ──
  function trenchLine(ox, oz, gy, length, angle) {
    length = length || 20;
    for (var i = 0; i < length; i++) {
      var tx = ox + Math.cos(angle || 0) * i;
      var tz = oz + Math.sin(angle || 0) * i;
      var ix = Math.round(tx), iz = Math.round(tz);
      setBlock(ix, gy, iz, PAL.DIRT);
      setBlock(ix, gy, iz + 1, PAL.DIRT);
      setBlock(ix, gy + 1, iz, PAL.DIRT);
      setBlock(ix, gy + 1, iz + 1, PAL.DIRT);
      setBlock(ix, gy - 1, iz, PAL.DIRT);
      setBlock(ix, gy - 1, iz + 1, PAL.DIRT);
      setBlock(ix, gy + 2, iz - 1, PAL.SANDBAG);
      setBlock(ix, gy + 2, iz + 2, PAL.SANDBAG);
    }
  }

  // ── dugout (covered fighting position) ──
  function dugout(ox, oz, gy) {
    for (var y = 0; y < 3; y++) {
      for (var x = -2; x <= 2; x++) {
        for (var z = -2; z <= 2; z++) {
          var isWall = Math.abs(x) === 2 || Math.abs(z) === 2 || y === 0;
          if (isWall) setBlock(ox + x, gy + y - 1, oz + z, PAL.DIRT);
          else setBlock(ox + x, gy + y - 1, oz + z, PAL.AIR);
        }
      }
    }
    // Roof cover (wood/logs)
    for (var x = -2; x <= 2; x++) {
      for (var z = -2; z <= 2; z++) {
        setBlock(ox + x, gy + 2, oz + z, PAL.WOOD);
      }
    }
    // Sandbag parapet on front
    for (var x = -2; x <= 2; x++) {
      setBlock(ox + x, gy + 1, oz + 2, PAL.SANDBAG);
      setBlock(ox + x, gy + 2, oz + 2, PAL.SANDBAG);
    }
  }

  // ── wheatField (golden wheat blocks) ──
  function wheatField(ox, oz, gy, width, depth) {
    width = width || 20;
    depth = depth || 20;
    for (var x = 0; x < width; x++) {
      for (var z = 0; z < depth; z++) {
        var wx = ox + x, wz = oz + z;
        // Slight height variation for natural look
        var h = gy + Math.floor(Math.random() * 2);
        setBlock(wx, h, wz, PAL.WOOD); // golden wheat color
        // Add some taller stalks
        if (Math.random() < 0.15) {
          setBlock(wx, h + 1, wz, PAL.WOOD);
        }
      }
    }
  }

  // ── dragonsTeeth (alias for dragonTeeth) ──
  function dragonsTeeth(ox, oz, gy, count, angle) {
    dragonTeeth(ox, oz, gy, count);
  }

// ── smokestack ──
function smokestack(ox, oz, gy, h, color) {
  color = color || PAL.BRICK;
  h = h || 20;
  for (var y = 0; y < h; y++) {
    var w = (y < 4) ? 3 : (y < h - 4) ? 2 : 1;
    for (var x = -w; x <= w; x++) {
      for (var z = -w; z <= w; z++) {
        var isWall = Math.abs(x) === w || Math.abs(z) === w;
        if (isWall) setBlock(ox + x, gy + y, oz + z, color);
      }
    }
  }
  setBlock(ox, gy + h, oz, PAL.LIGHT);
}

// ── damagedBuilding ──
function damagedBuilding(ox, oz, gy, w, d, h, color) {
  color = color || PAL.CONCRETE;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      for (var z = 0; z < d; z++) {
        var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
        var isRoof = y === h - 1;
        if (isWall || isRoof) {
          var distFromCenter = Math.abs(x - w/2) + Math.abs(z - d/2) + Math.abs(y - h/2);
          if (distFromCenter < 4 && Math.random() < 0.5) continue;
          if (Math.random() < 0.2) continue;
          var bt = (y === 0) ? PAL.BRICK : color;
          if (isRoof && Math.random() < 0.5) bt = PAL.RUBBLE;
          setBlock(ox + x, gy + y, oz + z, bt);
        }
      }
    }
  }
}

// ── sandbagWall ──
function sandbagWall(ox, oz, gy, length, color) {
  color = color || PAL.SANDBAG;
  length = length || 10;
  for (var i = 0; i < length; i++) {
    setBlock(ox + i, gy, oz, color);
    setBlock(ox + i, gy + 1, oz, color);
    if (i % 2 === 0) setBlock(ox + i, gy + 2, oz, color);
    setBlock(ox + i, gy, oz + 1, color);
    setBlock(ox + i, gy + 1, oz + 1, color);
  }
}

// ── observationPost ──
function observationPost(ox, oz, gy, h, color) {
  color = color || PAL.WOOD;
  h = h || 6;
  for (var y = 0; y < h; y++) {
    setBlock(ox - 1, gy + y, oz - 1, color);
    setBlock(ox + 1, gy + y, oz - 1, color);
    setBlock(ox - 1, gy + y, oz + 1, color);
    setBlock(ox + 1, gy + y, oz + 1, color);
  }
  for (var x = -2; x <= 2; x++) {
    for (var z = -2; z <= 2; z++) {
      setBlock(ox + x, gy + h, oz + z, color);
      setBlock(ox + x, gy + h + 1, oz + z, PAL.SANDBAG);
    }
  }
  for (var x = -1; x <= 1; x++) {
    for (var z = -1; z <= 1; z++) {
      setBlock(ox + x, gy + h + 2, oz + z, PAL.METAL);
    }
  }
}

// ── flareStack ──
function flareStack(ox, oz, gy, h) {
  h = h || 12;
  for (var y = 0; y < h; y++) {
    var w = (y < 3) ? 2 : 1;
    for (var x = -w; x <= w; x++) {
      for (var z = -w; z <= w; z++) {
        if (Math.abs(x) === w || Math.abs(z) === w) setBlock(ox + x, gy + y, oz + z, PAL.METAL);
      }
    }
  }
  setBlock(ox, gy + h, oz, PAL.FIRE);
  setBlock(ox, gy + h + 1, oz, PAL.FIRE);
  setBlock(ox + 1, gy + h, oz, PAL.FIRE);
  setBlock(ox - 1, gy + h, oz, PAL.FIRE);
}

// ── lighthouse ──
function lighthouse(ox, oz, gy, h) {
  h = h || 15;
  for (var y = 0; y < h; y++) {
    var w = (y < 4) ? 3 : (y < h - 4) ? 2 : 3;
    for (var x = -w; x <= w; x++) {
      for (var z = -w; z <= w; z++) {
        var isWall = Math.abs(x) === w || Math.abs(z) === w;
        if (isWall) {
          var bt = (y < 4) ? PAL.STONE : (y < h - 4) ? PAL.CONCRETE : PAL.GLASS;
          setBlock(ox + x, gy + y, oz + z, bt);
        }
      }
    }
  }
  setBlock(ox, gy + h, oz, PAL.LIGHT);
}

// ── barricade ──
function barricade(ox, oz, gy, length) {
  length = length || 8;
  for (var i = 0; i < length; i++) {
    setBlock(ox + i, gy, oz, PAL.CONCRETE);
    setBlock(ox + i, gy + 1, oz, PAL.CONCRETE);
    if (i % 3 === 0) setBlock(ox + i, gy + 2, oz, PAL.METAL);
  }
}

// ── tankTrap ──
function tankTrap(ox, oz, gy, count) {
  count = count || 6;
  for (var i = 0; i < count; i++) {
    var tx = ox + (i % 3) * 3;
    var tz = oz + Math.floor(i / 3) * 3;
    for (var y = 0; y < 3; y++) {
      for (var x = 0; x < 2; x++) {
        for (var z = 0; z < 2; z++) {
          setBlock(tx + x, gy + y, tz + z, PAL.CONCRETE);
        }
      }
    }
    setBlock(tx, gy + 3, tz, PAL.METAL);
    setBlock(tx + 1, gy + 3, tz + 1, PAL.METAL);
  }
}

// ── propagandaBillboard ──
function propagandaBillboard(ox, oz, gy, w, h) {
  w = w || 8; h = h || 4;
  for (var y = 0; y < h + 2; y++) {
    setBlock(ox, gy + y, oz, PAL.METAL);
    setBlock(ox + w - 1, gy + y, oz, PAL.METAL);
  }
  for (var x = 0; x < w; x++) {
    for (var y = 2; y < h + 2; y++) {
      setBlock(ox + x, gy + y, oz, PAL.BANNER);
    }
  }
}

// ── mineHeadframe ──
function mineHeadframe(ox, oz, gy, h) {
  h = h || 14;
  for (var y = 0; y < h; y++) {
    var spread = Math.floor((h - y) / 3);
    setBlock(ox - spread, gy + y, oz, PAL.METAL);
    setBlock(ox + spread, gy + y, oz, PAL.METAL);
    setBlock(ox - spread, gy + y, oz + 2, PAL.METAL);
    setBlock(ox + spread, gy + y, oz + 2, PAL.METAL);
  }
  for (var x = -4; x <= 4; x++) {
    setBlock(ox + x, gy + h - 1, oz + 1, PAL.METAL);
  }
  setBlock(ox, gy + h - 2, oz + 1, PAL.METAL);
}

// ── spoilTip ──
function spoilTip(ox, oz, gy, w, h) {
  w = w || 12; h = h || 8;
  for (var y = 0; y < h; y++) {
    var radius = Math.floor(w * (1 - y / h) / 2);
    for (var x = -radius; x <= radius; x++) {
      for (var z = -radius; z <= radius; z++) {
        if (x*x + z*z <= radius*radius + 2) {
          setBlock(ox + x, gy + y, oz + z, PAL.DIRT);
        }
      }
    }
  }
}

// ── portCrane ──
function portCrane(ox, oz, gy, h) {
  h = h || 12;
  for (var y = 0; y < h; y++) {
    setBlock(ox, gy + y, oz, PAL.METAL);
    setBlock(ox + 1, gy + y, oz, PAL.METAL);
    setBlock(ox, gy + y, oz + 1, PAL.METAL);
    setBlock(ox + 1, gy + y, oz + 1, PAL.METAL);
  }
  for (var x = 0; x < 10; x++) {
    setBlock(ox + 2 + x, gy + h - 2, oz, PAL.METAL);
  }
  for (var x = 0; x < 4; x++) {
    setBlock(ox - 1 - x, gy + h - 2, oz, PAL.METAL);
  }
  setBlock(ox + 8, gy + h - 4, oz, PAL.METAL);
}

// ── metroEntrance ──
function metroEntrance(ox, oz, gy, color) {
  color = color || PAL.BLUE_TILE;
  for (var x = -2; x <= 2; x++) {
    for (var z = 0; z <= 3; z++) {
      setBlock(ox + x, gy + 3, oz + z, PAL.METAL);
    }
  }
  for (var y = 0; y < 3; y++) {
    for (var x = -1; x <= 1; x++) {
      setBlock(ox + x, gy + y, oz, color);
      setBlock(ox + x, gy + y, oz + 2, color);
    }
  }
  setBlock(ox, gy + 4, oz + 1, color);
  setBlock(ox - 1, gy + 3, oz + 1, color);
  setBlock(ox + 1, gy + 3, oz + 1, color);
}

// ── fountain ──
function fountain(ox, oz, gy) {
  for (var x = -2; x <= 2; x++) {
    for (var z = -2; z <= 2; z++) {
      setBlock(ox + x, gy, oz + z, PAL.STONE);
    }
  }
  setBlock(ox, gy + 1, oz, PAL.WATER);
  setBlock(ox, gy + 2, oz, PAL.STONE);
}


  // ═══════════════════════════════════════════════════════════
  // HOSTOMEL
  // ═══════════════════════════════════════════════════════════
  CITIES.hostomel = [
{ type: 'airportTerminal', params: [40, 14, 6, 9], x: -15, z: -25, note: 'Antonov Airport Terminal — real: 3,500m east-west runway, 56m wide, no passenger terminal (cargo/testing facility)' },
    { type: 'hangar', params: [32, 22, 14, 9], x: -35, z: 10, note: 'Hangar 1 — An-225 Mriya (destroyed Feb 27, 2022)' },
    { type: 'hangar', params: [28, 18, 10, 9], x: 5, z: 12, note: 'Hangar 2 — An-124 Ruslan / Antonov offices' },
    { type: 'hangar', params: [24, 14, 8, 9], x: 40, z: 8, note: 'Hangar 3 — An-22 Antei / museum storage' },
    { type: 'controlTower', params: [4, 4, 22, 9], x: 25, z: -20, note: 'ATC Tower (destroyed by shelling, Feb 2022)' },
    { type: 'officeBuilding', params: [12, 10, 4, 9], x: -5, z: -45, note: 'Antonov Administration Building (destroyed)' },
    { type: 'warehouse', params: [15, 10, 4, 5], x: 35, z: 15, note: 'Cargo Warehouse' },
    { type: 'warehouse', params: [12, 8, 3, 94], x: 35, z: -5, note: 'Aviation Museum / Spare Parts' },
    { type: 'industrialFactory', params: [18, 12, 5, 5], x: -45, z: -15, note: 'Maintenance Workshop' },
    { type: 'warehouse', params: [14, 10, 4, 93], x: -50, z: 25, note: 'Fuel Depot' },
    { type: 'monument', params: ["tank", 9], x: 0, z: 35, note: 'Destroyed BMD-2 VDV vehicle' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 2.5, 16], x: -15, z: 25, note: 'VDV Mi-8 helicopter wreck (shot down by MANPADS)' },
    { type: 'ruinedBuilding', params: [8, 6, 3, 2.0, 9], x: 15, z: 30, note: 'Burned Russian supply truck' },
    { type: 'ruinedBuilding', params: [6, 4, 2, 1.0, 10], x: 5, z: 45, note: 'BTR wreckage from Ukrainian counter-attack' },
    { type: 'bunker', params: [], x: -20, z: -5, note: 'Ukrainian National Guard trench (4th Rapid Reaction Brigade)' },
    { type: 'bunker', params: [], x: 20, z: -5, note: 'Ukrainian ZU-23-2 anti-air position' },
    { type: 'bunker', params: [], x: 0, z: 20, note: 'Front line trench — division road (Feb 24, 2022)' },
    { type: 'bunker', params: [], x: -35, z: 35, note: 'VDV landing zone foxhole' },
    { type: 'radarStation', params: [], x: 30, z: -40, note: 'Airport radar station' },
    { type: 'ruinedBuilding', params: [14, 10, 4, 2.0, 72], x: -30, z: 45, note: 'An-74 wreckage (destroyed on apron)' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 81], x: 10, z: 50, note: 'An-26 wreckage (destroyed on apron)' },
    { type: 'monument', params: ["tank", 9], x: -50, z: 50, note: 'An-22 Antei memorial wreck' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 113], x: -10, z: 55, note: 'Damaged An-124 hangar' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.4, 9], x: 50, z: 25, note: 'Soviet apartment (damaged by shelling)' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 80], x: 65, z: 15, note: 'Soviet apartment block' },
    { type: 'sovietApartment', params: [14, 7, 4, 0.5, 81], x: 55, z: 40, note: 'Residential block (heavily damaged — 40% of Hostomel destroyed)' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 82], x: 70, z: 30, note: 'Soviet apartment block' },
    { type: 'officeBuilding', params: [10, 8, 4, 80], x: 60, z: -10, note: 'Hostomel Town Hall' },
    { type: 'warehouse', params: [12, 8, 3, 95], x: 75, z: 20, note: 'Civilian warehouse' },
    { type: 'kyivBaroqueChurch', params: [10, 12, 6, 5, 10], x: 45, z: -35, note: 'St. George Church (Kyiv baroque: green roof, golden domes, blue/white bell tower)' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 2.0, 16], x: 80, z: 10, note: 'Destroyed school (4 schools damaged in Hostomel)' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.5, 9], x: 50, z: 55, note: 'Ruined apartment block' },
    { type: 'monument', params: ["obelisk", 9], x: 65, z: -25, note: 'Hostomel War Memorial' },
    { type: 'bunker', params: [], x: 55, z: 5, note: 'Civil defense shelter' },
    { type: 'warehouse', params: [10, 8, 3, 10], x: 85, z: 35, note: 'Shop (grocery store — 17 stores destroyed)' },
    { type: 'ruinedBuilding', params: [8, 6, 3, 1.5, 10], x: 40, z: 50, note: 'Burned house' },
    { type: 'industrialFactory', params: [15, 10, 4, 92], x: 75, z: -5, note: 'VETROPAK Glass Factory (damaged)' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.8, 72], x: 90, z: 20, note: 'Destroyed kindergarten (2 kindergartens damaged)' },
    { type: 'smokestack', params: [25, 92], x: -55, z: -35, note: 'Power plant smokestack' },
    { type: 'smokestack', params: [20, 93], x: -52, z: -35, note: 'Power plant smokestack 2' },
    { type: 'hangar', params: [20, 14, 6, 5], x: -60, z: 10, note: 'Aircraft revetment' },
    { type: 'hangar', params: [20, 14, 6, 93], x: 55, z: 10, note: 'Aircraft revetment 2' },
    { type: 'damagedBuilding', params: [12, 8, 4, 16], x: -25, z: -50, note: 'Ruined airport hotel' },
    { type: 'damagedBuilding', params: [10, 6, 3, 9], x: 35, z: -50, note: 'Ruined cafeteria' },
    { type: 'sandbagWall', params: [15, 17], x: -10, z: -35, note: 'Perimeter sandbag wall' },
    { type: 'sandbagWall', params: [12, 17], x: 10, z: -35, note: 'Checkpoint sandbag wall' },
    { type: 'observationPost', params: [8, 109], x: 45, z: -30, note: 'Guard tower' },
    { type: 'observationPost', params: [8, 109], x: -45, z: -30, note: 'Guard tower 2' }
  ];

  // ═══════════════════════════════════════════════════════════
  // KYIV
  // ═══════════════════════════════════════════════════════════
  CITIES.kyiv = [
{ type: 'monument', params: ["obelisk", 9], x: 0, z: 0, note: 'Independence Monument — Maidan Nezalezhnosti (center of Kyiv)' },
    { type: 'officeBuilding', params: [14, 10, 8, 9], x: -20, z: -5, note: 'Trade Unions Building — west side of Maidan' },
    { type: 'officeBuilding', params: [12, 10, 6, 80], x: 20, z: -5, note: 'Ukraine Hotel — east side of Maidan' },
    { type: 'officeBuilding', params: [10, 8, 6, 82], x: -30, z: 5, note: 'Globus Shopping — south of Maidan on Khreshchatyk' },
    { type: 'officeBuilding', params: [10, 8, 6, 83], x: 30, z: 5, note: 'TSUM Kyiv — south of Maidan' },
    { type: 'officeBuilding', params: [12, 8, 6, 84], x: -40, z: 15, note: 'Kyiv City Council — west Khreshchatyk' },
    { type: 'officeBuilding', params: [10, 8, 5, 85], x: -20, z: 15, note: 'Post Office — Khreshchatyk' },
    { type: 'officeBuilding', params: [10, 8, 5, 89], x: 0, z: 15, note: 'National Bank — Khreshchatyk' },
    { type: 'officeBuilding', params: [10, 8, 5, 90], x: 20, z: 15, note: 'Ministry Building — Khreshchatyk' },
    { type: 'officeBuilding', params: [14, 10, 6, 91], x: 40, z: 15, note: 'Cabinet of Ministers — east end of Khreshchatyk' },
    { type: 'parliamentBuilding', params: [16, 12, 6, 9], x: 18, z: -10, note: 'Verkhovna Rada (Parliament) — Hrushevsky St, government quarter' },
    { type: 'officeBuilding', params: [12, 10, 5, 11], x: 15, z: -8, note: 'Cabinet of Ministers — near Parliament' },
    { type: 'kyivBaroqueChurch', params: [14, 16, 10, 5, 10], x: -20, z: -18, note: 'St. Sophia Cathedral — Upper Town, NW of Maidan (UNESCO, green roof, golden domes, 76m blue bell tower)' },
    { type: 'kyivBaroqueChurch', params: [12, 14, 8, 5, 20], x: -12, z: -15, note: 'St. Michael’s Golden-Domed Monastery — near St. Sophia, golden domes, blue walls' },
    { type: 'orthodoxChurch', params: [8, 10, 6, 10], x: -22, z: -8, note: 'St. Andrew’s Church — above Andriyivskyy Descent, Upper Town' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 1.0, 16], x: -25, z: -5, note: 'Andriyivskyy Descent — historic cobblestone street to Podil' },
    { type: 'ruinedBuilding', params: [8, 6, 3, 0.5, 9], x: -28, z: 5, note: 'Bulgakov Museum — Podil district' },
    { type: 'kyivBaroqueChurch', params: [16, 18, 12, 7, 65], x: 22, z: 20, note: 'Kyiv Pechersk Lavra — SE of center, on Dnipro uplands (UNESCO, 96m Great Lavra Bell Tower, golden domes, Dormition Cathedral)' },
    { type: 'orthodoxChurch', params: [10, 10, 6, 20], x: 18, z: 15, note: 'Church of the Savior at Berestove — near Lavra' },
    { type: 'motherlandMonument', params: [], x: 28, z: 38, note: 'Motherland Monument (62m, sword + shield, stainless steel) — south of Lavra, on Dnipro River slope' },
    { type: 'monument', params: ["obelisk", 9], x: -50, z: 0, note: 'Taras Shevchenko monument — near university' },
    { type: 'monument', params: ["obelisk", 9], x: 45, z: 10, note: 'Dnipro River embankment — east of city center' },
    { type: 'monument', params: ["obelisk", 9], x: 48, z: 25, note: 'Dnipro River embankment — near Pechersk' },
    { type: 'monument', params: ["obelisk", 9], x: 50, z: 40, note: 'Dnipro River embankment — near Motherland Monument' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 9], x: -40, z: 30, note: 'Khreshchatyk apartment — Shevchenkivskyi district' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 80], x: -20, z: 30, note: 'Khreshchatyk apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 81], x: 0, z: 30, note: 'Khreshchatyk apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 82], x: 20, z: 30, note: 'Khreshchatyk apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 83], x: 40, z: 30, note: 'Khreshchatyk apartment' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2, 20], x: -40, z: 45, note: 'Pechersk apartment — near Dnipro' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2, 84], x: -20, z: 45, note: 'Pechersk apartment' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2, 85], x: 0, z: 45, note: 'Pechersk apartment' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2, 86], x: 20, z: 45, note: 'Pechersk apartment' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2, 87], x: 40, z: 45, note: 'Pechersk apartment' },
    { type: 'bunker', params: [], x: -10, z: 10, note: 'Maidan Metro station — blue line' },
    { type: 'bunker', params: [], x: 10, z: 10, note: 'Khreshchatyk Metro station' },
    { type: 'bunker', params: [], x: -10, z: -10, note: 'Teatralna Metro station' },
    { type: 'bunker', params: [], x: 10, z: -10, note: 'Ploshcha Lva Tolstoho Metro' },
    { type: 'officeBuilding', params: [10, 8, 5, 102], x: 50, z: 15, note: 'Olympic Stadium — east of center, near Dnipro' },
    { type: 'officeBuilding', params: [10, 8, 5, 103], x: 45, z: -5, note: 'VDNG Expo Center — east of Maidan' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 1.5, 10], x: 0, z: -25, note: 'Damaged building — northern approach' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.2, 72], x: 25, z: -25, note: 'Damaged building — near Lavra approach' },
    { type: 'metroEntrance', params: [64], x: -15, z: 25, note: "Metro Arsenalna (world's deepest)" },
    { type: 'metroEntrance', params: [64], x: 15, z: 25, note: 'Metro Pecherska' },
    { type: 'fountain', params: [], x: -5, z: 5, note: 'Maidan fountain' },
    { type: 'fountain', params: [], x: 5, z: 5, note: 'Maidan fountain 2' },
    { type: 'bridge', params: [25, 6, 3], x: 45, z: 30, note: 'Dnipro embankment bridge' },
    { type: 'portCrane', params: [10], x: 48, z: 15, note: 'Dnipro river port crane' },
    { type: 'damagedBuilding', params: [12, 8, 4, 84], x: -45, z: 30, note: 'Khreshchatyk building (damaged)' },
    { type: 'damagedBuilding', params: [12, 8, 4, 85], x: 35, z: 30, note: 'Khreshchatyk building (damaged) 2' },
    { type: 'officeBuilding', params: [10, 8, 6, 89], x: -55, z: 10, note: 'TV Tower base' },
    { type: 'monument', params: ["obelisk", 9], x: 55, z: 25, note: 'Dnipro hills monument' }
  ];

  // ═══════════════════════════════════════════════════════════
  // MOSCOW
  // ═══════════════════════════════════════════════════════════
  CITIES.moscow = [
{ type: 'kremlinWall', params: [80, 60, 8, 9], x: 0, z: 0, note: 'Kremlin walls — triangular fortification, red brick, towers with green roofs and ruby stars, Spasskaya Tower with clock' },
    { type: 'orthodoxChurch', params: [10, 12, 8, 10], x: -15, z: -5, note: 'Assumption Cathedral — inside Kremlin, west side' },
    { type: 'orthodoxChurch', params: [10, 12, 8, 20], x: 0, z: -5, note: 'Archangel Cathedral — inside Kremlin, center' },
    { type: 'orthodoxChurch', params: [10, 12, 8, 65], x: 15, z: -5, note: 'Annunciation Cathedral — inside Kremlin, east side' },
    { type: 'officeBuilding', params: [6, 6, 12, 9], x: -8, z: 8, note: 'Ivan the Great Bell Tower — inside Kremlin, tallest structure' },
    { type: 'officeBuilding', params: [14, 10, 5, 80], x: -20, z: 10, note: 'Senate building — inside Kremlin, west' },
    { type: 'officeBuilding', params: [14, 10, 5, 82], x: 20, z: 10, note: 'Presidential residence — inside Kremlin, east' },
    { type: 'stBasilCathedral', params: [], x: 0, z: 35, note: 'St. Basil’s Cathedral — south end of Red Square (9 colorful onion domes, 1555-1561, Ivan the Terrible)' },
    { type: 'stateHistoricalMuseum', params: [12, 8, 4, 10], x: -30, z: 30, note: 'State Historical Museum — north of Red Square (red brick, white trim, pointed towers)' },
    { type: 'gumDepartmentStore', params: [12, 8, 4, 9], x: 30, z: 30, note: 'GUM Department Store — east side of Red Square (glass roof arcade)' },
    { type: 'leninMausoleum', params: [], x: -12, z: 28, note: 'Lenin Mausoleum — against Kremlin wall, Red Square west side (red granite pyramid)' },
    { type: 'monument', params: ["obelisk", 9], x: 12, z: 28, note: 'Minin & Pozharsky Monument — Red Square, near St. Basil’s' },
    { type: 'lubyankaBuilding', params: [12, 10, 6, 20], x: -40, z: -20, note: 'Lubyanka FSB HQ — northeast of Kremlin, former KGB (yellow neo-baroque)' },
    { type: 'officeBuilding', params: [12, 10, 6, 83], x: 40, z: -20, note: 'MVD headquarters — east of Kremlin' },
    { type: 'bolshoiTheatre', params: [12, 10, 6, 65], x: -35, z: -40, note: 'Bolshoi Theatre — north of Kremlin, Theater Square (white columns, pediment, Apollo chariot)' },
    { type: 'moscowStateUniversity', params: [], x: -55, z: 55, note: 'Moscow State University Main Building — Sparrow Hills (Vorobyovy Gory), Stalinist skyscraper with star on top' },
    { type: 'monument', params: ["obelisk", 9], x: -50, z: 60, note: 'Sparrow Hills observation point — elevated above Moskva River' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1, 9], x: -40, z: -30, note: '9-story apartment — north of Kremlin' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1, 80], x: -20, z: -30, note: '9-story apartment' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1, 81], x: 0, z: -30, note: '9-story apartment' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1, 82], x: 20, z: -30, note: '9-story apartment' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1, 83], x: 40, z: -30, note: '9-story apartment' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1, 20], x: -50, z: -10, note: '12-story tower — inner ring' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1, 84], x: -25, z: -10, note: '12-story tower' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1, 85], x: 0, z: -10, note: '12-story tower' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1, 86], x: 25, z: -10, note: '12-story tower' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1, 87], x: 50, z: -10, note: '12-story tower' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 3], x: -50, z: 35, note: 'St. Nicholas Church — north of city' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 105], x: 50, z: 35, note: 'St. George Church — east of city' },
    { type: 'warehouse', params: [15, 10, 4, 5], x: -30, z: 35, note: 'Supermarket — northeast' },
    { type: 'warehouse', params: [15, 10, 4, 94], x: 0, z: 35, note: 'Shopping center — near Red Square' },
    { type: 'warehouse', params: [15, 10, 4, 93], x: 30, z: 35, note: 'Cinema — east of Red Square' },
    { type: 'school', params: [12, 10, 3, 9], x: -45, z: 50, note: 'School No. 12 — outer ring' },
    { type: 'school', params: [12, 10, 3, 82], x: -15, z: 50, note: 'School No. 15' },
    { type: 'school', params: [12, 10, 3, 20], x: 15, z: 50, note: 'School No. 23' },
    { type: 'school', params: [12, 10, 3, 86], x: 45, z: 50, note: 'School No. 31' },
    { type: 'bunker', params: [], x: -20, z: 0, note: 'Civil defense shelter — inner ring' },
    { type: 'bunker', params: [], x: 20, z: 0, note: 'Civil defense shelter' },
    { type: 'bunker', params: [], x: -20, z: 25, note: 'Civil defense shelter — outer ring' },
    { type: 'bunker', params: [], x: 20, z: 25, note: 'Civil defense shelter' },
    { type: 'monument', params: ["tank", 9], x: -50, z: -50, note: 'T-72 monument — northwest' },
    { type: 'monument', params: ["tank", 9], x: 50, z: -50, note: 'T-80 monument — northeast' },
    { type: 'monument', params: ["obelisk", 9], x: 0, z: -50, note: 'WWII memorial — north of Kremlin' },
    { type: 'industrialFactory', params: [15, 10, 4, 5], x: -35, z: 50, note: 'Garage — outer ring' },
    { type: 'industrialFactory', params: [15, 10, 4, 92], x: 35, z: 50, note: 'Bus depot — outer ring' },
    { type: 'metroEntrance', params: [64], x: -35, z: -5, note: 'Metro entrance (Arbatskaya)' },
    { type: 'metroEntrance', params: [64], x: 35, z: -5, note: 'Metro entrance (Kurskaya)' },
    { type: 'metroEntrance', params: [64], x: -35, z: 25, note: 'Metro entrance (Taganskaya)' },
    { type: 'metroEntrance', params: [64], x: 35, z: 25, note: 'Metro entrance (Okhotny Ryad)' },
    { type: 'industrialFactory', params: [18, 12, 5, 92], x: -60, z: -20, note: 'Factory (northwest)' },
    { type: 'industrialFactory', params: [18, 12, 5, 93], x: 60, z: -20, note: 'Factory (northeast)' },
    { type: 'officeBuilding', params: [10, 8, 4, 94], x: -55, z: 35, note: 'Police station' },
    { type: 'officeBuilding', params: [10, 8, 4, 95], x: 55, z: 35, note: 'Police station 2' },
    { type: 'propagandaBillboard', params: [8, 4], x: -45, z: 15, note: 'Propaganda billboard' },
    { type: 'propagandaBillboard', params: [8, 4], x: 45, z: 15, note: 'Propaganda billboard 2' }
  ];

  // ═══════════════════════════════════════════════════════════
  // MARIUPOL
  // ═══════════════════════════════════════════════════════════
  CITIES.mariupol = [
{ type: 'azovstalComplex', params: [50, 30, 10, 9], x: 0, z: -20, note: 'Azovstal Blast Furnace Hall — north of center, industrial heart (blast furnaces, cooling towers, smokestacks)' },
    { type: 'dramaTheater', params: [14, 10, 5, 65], x: -20, z: 25, note: 'Ruined Drama Theater — city center, Freedom Square area (modernist, bombed March 16 2022 with CHILDREN sign painted outside)' },
    { type: 'azovstalComplex', params: [40, 20, 8, 9], x: -45, z: -25, note: 'Azovstal Rolling Mill 1 — northwest industrial zone' },
    { type: 'azovstalComplex', params: [35, 18, 7, 9], x: 45, z: -25, note: 'Azovstal Rolling Mill 2 — northeast industrial zone' },
    { type: 'industrialFactory', params: [30, 15, 6, 5], x: -40, z: -45, note: 'Azovstal Coking Plant — north' },
    { type: 'industrialFactory', params: [30, 15, 6, 92], x: 40, z: -45, note: 'Azovstal Sinter Plant — north' },
    { type: 'warehouse', params: [40, 15, 6, 5], x: -50, z: -5, note: 'Raw Material Storage — west of Azovstal' },
    { type: 'warehouse', params: [35, 12, 5, 94], x: 50, z: -5, note: 'Finished Steel Warehouse — east of Azovstal' },
    { type: 'industrialFactory', params: [25, 15, 5, 93], x: 0, z: -50, note: 'Azovstal Converter Shop — north' },
    { type: 'industrialFactory', params: [20, 12, 5, 94], x: -25, z: -10, note: 'Azovstal Pipe Mill' },
    { type: 'industrialFactory', params: [20, 12, 5, 95], x: 25, z: -10, note: 'Azovstal Wire Mill' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.5, 9], x: -60, z: 15, note: 'Damaged apartment (east) — residential near industrial zone' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.6, 80], x: -60, z: 35, note: 'Heavily damaged apartment — east residential' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.7, 81], x: -60, z: 55, note: 'Ruined apartment — east residential' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.5, 82], x: 60, z: 15, note: 'Damaged apartment (west) — residential near coast' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.6, 83], x: 60, z: 35, note: 'Heavily damaged apartment — west residential' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.7, 20], x: 60, z: 55, note: 'Ruined apartment — west residential' },
    { type: 'dramaTheater', params: [14, 10, 5, 65], x: -20, z: 25, note: 'Ruined Drama Theater — city center, Freedom Square area (modernist, bombed with CHILDREN sign)' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 16], x: -5, z: 25, note: 'Ruined Kuindzhi Art Center — city center (white building)' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0, 9], x: 15, z: 25, note: 'Ruined shop — city center' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 10], x: 30, z: 25, note: 'Ruined house — city center' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5, 72], x: 45, z: 25, note: 'Ruined school — city center' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 10], x: -30, z: 50, note: 'St. Michael Cathedral (damaged) — near coast' },
    { type: 'monument', params: ["tank", 9], x: -20, z: 50, note: 'Tank monument — near Sea of Azov coast' },
    { type: 'warehouse', params: [15, 10, 4, 93], x: 0, z: 50, note: 'Port warehouse — Sea of Azov coast' },
    { type: 'warehouse', params: [12, 8, 4, 95], x: 20, z: 50, note: 'Harbor storage — Sea of Azov coast' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0, 81], x: 40, z: 50, note: 'Ruined building — coastal area' },
    { type: 'bunker', params: [], x: -10, z: -10, note: 'Bunker under steelworks' },
    { type: 'bunker', params: [], x: 10, z: -10, note: 'Underground tunnel entrance — Azovstal' },
    { type: 'bunker', params: [], x: -10, z: 10, note: 'Shelter — industrial zone' },
    { type: 'bunker', params: [], x: 10, z: 10, note: 'Ammo storage — industrial zone' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 113], x: -55, z: -40, note: 'Ruined building — north industrial' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 16], x: 55, z: -40, note: 'Ruined building — north industrial' },
    { type: 'monument', params: ["obelisk", 9], x: 0, z: 60, note: 'Memorial — Sea of Azov coast' },
    { type: 'smokestack', params: [30, 93], x: -15, z: -55, note: 'Azovstal smokestack 1' },
    { type: 'smokestack', params: [30, 94], x: -5, z: -55, note: 'Azovstal smokestack 2' },
    { type: 'smokestack', params: [30, 95], x: 5, z: -55, note: 'Azovstal smokestack 3' },
    { type: 'smokestack', params: [30, 92], x: 15, z: -55, note: 'Azovstal smokestack 4' },
    { type: 'damagedBuilding', params: [20, 12, 6, 16], x: -35, z: -5, note: 'Blast furnace building (ruined)' },
    { type: 'damagedBuilding', params: [20, 12, 6, 9], x: 35, z: -5, note: 'Steel mill (ruined)' },
    { type: 'damagedBuilding', params: [16, 10, 5, 72], x: -55, z: 10, note: 'Residential ruins (east)' },
    { type: 'damagedBuilding', params: [16, 10, 5, 81], x: 55, z: 10, note: 'Residential ruins (west)' },
    { type: 'damagedBuilding', params: [14, 8, 4, 113], x: -20, z: 35, note: 'Factory office ruins' },
    { type: 'damagedBuilding', params: [14, 8, 4, 78], x: 20, z: 35, note: 'Factory workshop ruins' }
  ];

  // ═══════════════════════════════════════════════════════════
  // AVDIIVKA
  // ═══════════════════════════════════════════════════════════
  CITIES.avdiivka = [
{ type: 'industrialFactory', params: [40, 25, 8, 5], x: -20, z: -20, note: 'Avdiivka Coke Plant (AKHZ) main hall — northwest industrial core' },
    { type: 'industrialFactory', params: [30, 15, 6, 92], x: -55, z: -30, note: 'Coke Plant Hall 2 — northwest' },
    { type: 'industrialFactory', params: [25, 15, 6, 93], x: 15, z: -30, note: 'Coke Plant Hall 3 — north' },
    { type: 'industrialFactory', params: [20, 12, 5, 94], x: -20, z: -50, note: 'Chemical processing — north of plant' },
    { type: 'warehouse', params: [30, 12, 5, 5], x: -60, z: 5, note: 'Coal storage — west of plant' },
    { type: 'warehouse', params: [25, 10, 5, 94], x: 15, z: 5, note: 'Product warehouse — east of plant' },
    { type: 'sovietApartment', params: [18, 9, 6, 0.5, 9], x: 10, z: -20, note: 'Apartment block (damaged) — southeast of plant' },
    { type: 'sovietApartment', params: [18, 9, 6, 0.6, 80], x: 30, z: -25, note: 'Apartment block (heavily damaged) — southeast' },
    { type: 'sovietApartment', params: [18, 9, 5, 0.4, 81], x: 50, z: -30, note: 'Apartment block (ruined) — southeast' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 82], x: 15, z: -40, note: 'Apartment block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.5, 83], x: 35, z: -35, note: 'Apartment block (damaged) — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 20], x: 55, z: -25, note: 'Apartment block — far southeast' },
    { type: 'sovietApartment', params: [14, 7, 4, 0.3, 84], x: -65, z: -10, note: 'Small apartment — west of plant' },
    { type: 'sovietApartment', params: [14, 7, 4, 0.4, 85], x: 65, z: -10, note: 'Small apartment (damaged) — far east' },
    { type: 'officeBuilding', params: [10, 8, 4, 9], x: 0, z: 20, note: 'City administration — south of industrial zone' },
    { type: 'school', params: [12, 10, 3, 9], x: 20, z: 20, note: 'School No. 1 (destroyed) — south' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 10], x: 40, z: 20, note: 'Church of the Annunciation — south residential' },
    { type: 'warehouse', params: [12, 8, 3, 93], x: 60, z: 20, note: 'Market warehouse — southeast' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.5, 16], x: 80, z: 20, note: 'Ruined shop — southeast' },
    { type: 'bunker', params: [], x: -40, z: -20, note: 'Plant shelter — AKHZ underground' },
    { type: 'bunker', params: [], x: 0, z: -20, note: 'Underground control room — AKHZ' },
    { type: 'monument', params: ["obelisk", 9], x: 70, z: 0, note: 'Labor monument — east' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0, 9], x: -45, z: 10, note: 'Ruined factory office — west of plant' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5, 10], x: 50, z: -40, note: 'Ruined house — south' },
    { type: 'industrialFactory', params: [15, 10, 4, 95], x: -30, z: 10, note: 'Brick factory — west' },
    { type: 'warehouse', params: [15, 10, 4, 95], x: 0, z: 10, note: 'Ceramic storage — west' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 2.0, 72], x: 30, z: 10, note: 'Destroyed dormitory — southwest' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2, 86], x: -70, z: 0, note: 'Workers housing — far west' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 2.5, 81], x: 75, z: 15, note: 'Destroyed hospital — southeast' },
    { type: 'bunker', params: [], x: -20, z: 0, note: 'Civil defense bunker — center' },
    { type: 'monument', params: ["tank", 9], x: -60, z: -50, note: 'WWII tank monument — northwest' },
    { type: 'radarStation', params: [], x: 65, z: -45, note: 'EW radar station — northeast' },
    { type: 'smokestack', params: [28, 72], x: -30, z: -40, note: 'Coke plant smokestack 1' },
    { type: 'smokestack', params: [28, 73], x: -25, z: -40, note: 'Coke plant smokestack 2' },
    { type: 'smokestack', params: [28, 74], x: -20, z: -40, note: 'Coke plant smokestack 3' },
    { type: 'smokestack', params: [28, 78], x: -15, z: -40, note: 'Coke plant smokestack 4' },
    { type: 'industrialFactory', params: [30, 6, 4, 94], x: -10, z: -40, note: 'Conveyor belt structure' },
    { type: 'damagedBuilding', params: [14, 10, 5, 80], x: -5, z: 30, note: 'Administrative building (damaged)' },
    { type: 'damagedBuilding', params: [10, 8, 6, 81], x: 25, z: 30, note: 'Water tower base' },
    { type: 'warehouse', params: [20, 12, 5, 93], x: -50, z: 30, note: 'Central warehouse' },
    { type: 'sandbagWall', params: [18, 17], x: -5, z: 45, note: 'Factory perimeter sandbags' },
    { type: 'bunker', params: [], x: 10, z: -40, note: 'Coke plant shelter' }
  ];

  // ═══════════════════════════════════════════════════════════
  // BAKHMUT
  // ═══════════════════════════════════════════════════════════
  CITIES.bakhmut = [
{ type: 'ruinedBuilding', params: [18, 10, 6, 3.0, 16], x: 0, z: 0, note: 'Freedom Square — historic heart of Bakhmut, now completely ruined (City Culture Center, city hall, market)' },
    { type: 'industrialFactory', params: [18, 12, 5, 5], x: -30, z: -30, note: 'Salt processing plant — Bakhmut is the largest salt center in Ukraine (rock salt deposits)' },
    { type: 'ruinedBuilding', params: [18, 10, 6, 3.0, 16], x: 0, z: 0, note: 'Bakhmut Fortress ruins — central market and embankment area (18th century)' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5, 9], x: -20, z: -15, note: 'Ruined apartment — west of fortress' },
    { type: 'ruinedBuilding', params: [16, 9, 6, 2.8, 10], x: 20, z: -15, note: 'Ruined apartment — east of fortress' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 72], x: -35, z: -5, note: 'Ruined office — north of center' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5, 81], x: 35, z: -5, note: 'Ruined school — north of center' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 2.0, 113], x: -15, z: 15, note: 'Ruined shop — south of center' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.2, 16], x: 15, z: 15, note: 'Ruined market — south of center' },
    { type: 'ruinedBuilding', params: [16, 10, 6, 3.0, 9], x: -40, z: 10, note: 'Heavily damaged building — west' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5, 10], x: 40, z: 10, note: 'Heavily damaged building — east' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5, 72], x: -25, z: 30, note: 'Ruined house — southwest' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5, 81], x: 25, z: 30, note: 'Ruined house — southeast' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 113], x: -50, z: -20, note: 'Ruined building — far west' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 16], x: 50, z: -20, note: 'Ruined building — far east' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5, 9], x: -10, z: -30, note: 'Ruined apartment — north of center' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5, 10], x: 10, z: -30, note: 'Ruined apartment — north of center' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0, 72], x: -45, z: 25, note: 'Ruined shop — southwest' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0, 81], x: 45, z: 25, note: 'Ruined shop — southeast' },
    { type: 'ruinedBuilding', params: [16, 10, 6, 2.8, 113], x: 0, z: -45, note: 'Ruined hotel — north' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 16], x: -30, z: 40, note: 'Ruined building — southwest' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 9], x: 30, z: 40, note: 'Ruined building — southeast' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5, 10], x: -50, z: 40, note: 'Ruined house — far southwest' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5, 72], x: 50, z: 40, note: 'Ruined house — far southeast' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5, 81], x: -20, z: -45, note: 'Ruined apartment — northwest' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5, 113], x: 20, z: -45, note: 'Ruined apartment — northeast' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 16], x: -55, z: 0, note: 'Ruined building — west' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 9], x: 55, z: 0, note: 'Ruined building — east' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.8, 10], x: -35, z: -35, note: 'Ruined building — northwest' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.8, 72], x: 35, z: -35, note: 'Ruined building — northeast' },
    { type: 'monument', params: ["obelisk", 9], x: 0, z: 50, note: 'Damaged war memorial — south of center' },
    { type: 'bunker', params: [], x: 0, z: 0, note: 'Bakhmut shelter — fortress area' },
    { type: 'school', params: [10, 8, 3, 9], x: -10, z: -20, note: 'Museum of Local Lore (destroyed)' },
    { type: 'ruinedBuilding', params: [8, 6, 3, 2.0, 81], x: 15, z: -20, note: 'Destroyed apartment (post-2022)' },
    { type: 'damagedBuilding', params: [18, 10, 6, 16], x: -10, z: -15, note: 'Ruined apartment block (heavy shelling)' },
    { type: 'damagedBuilding', params: [18, 10, 6, 9], x: 10, z: -15, note: 'Ruined apartment block (collapsed)' },
    { type: 'damagedBuilding', params: [16, 8, 5, 10], x: 0, z: 15, note: 'Ruined apartment (roof collapse)' },
    { type: 'damagedBuilding', params: [14, 8, 5, 72], x: -30, z: 15, note: 'Ruined school (direct hit)' },
    { type: 'damagedBuilding', params: [14, 8, 5, 81], x: 30, z: 15, note: 'Ruined hospital (direct hit)' },
    { type: 'damagedBuilding', params: [12, 6, 4, 113], x: -15, z: 30, note: 'Collapsed house' },
    { type: 'damagedBuilding', params: [12, 6, 4, 78], x: 15, z: 30, note: 'Collapsed house 2' },
    { type: 'damagedBuilding', params: [10, 6, 3, 16], x: 0, z: 35, note: 'Shell crater ruin' },
    { type: 'damagedBuilding', params: [10, 6, 3, 9], x: -25, z: -30, note: 'Burned-out shop' },
    { type: 'damagedBuilding', params: [10, 6, 3, 10], x: 25, z: -30, note: 'Burned-out shop 2' }
  ];

  // ═══════════════════════════════════════════════════════════
  // KHERSON
  // ═══════════════════════════════════════════════════════════
  CITIES.kherson = [
{ type: 'antonovskyBridge', params: [50, 6, 4, 9], x: 0, z: 40, note: 'Antonivsky Bridge — crosses Dnipro south of city (cable-stayed, bombed)' },
    { type: 'officeBuilding', params: [12, 10, 5, 9], x: -30, z: -20, note: 'Port administration — Dnipro riverfront, west bank' },
    { type: 'warehouse', params: [25, 12, 5, 5], x: -10, z: -25, note: 'Port warehouse — Dnipro riverfront' },
    { type: 'warehouse', params: [20, 10, 4, 94], x: 15, z: -25, note: 'Cargo storage — Dnipro riverfront' },
    { type: 'industrialFactory', params: [20, 12, 5, 5], x: 40, z: -20, note: 'Shipyard workshop — Dnipro riverfront' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 9], x: -40, z: -10, note: 'Apartment block — west bank residential' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 80], x: -20, z: -10, note: 'Apartment block — west bank' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 81], x: 0, z: -10, note: 'Apartment block — city center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 82], x: 20, z: -10, note: 'Apartment block — city center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 83], x: 40, z: -10, note: 'Apartment block — east approach' },
    { type: 'officeBuilding', params: [10, 8, 4, 80], x: -45, z: 10, note: 'City hall — central Kherson' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 10], x: -25, z: 10, note: 'St. Catherine Church — central Kherson (baroque)' },
    { type: 'warehouse', params: [15, 10, 4, 93], x: -5, z: 15, note: 'Market — central Kherson' },
    { type: 'warehouse', params: [12, 8, 4, 95], x: 15, z: 15, note: 'Storage depot — central Kherson' },
    { type: 'officeBuilding', params: [10, 8, 4, 82], x: 35, z: 15, note: 'Bank building — central Kherson' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 20], x: -40, z: 30, note: 'Residential block — south of center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 84], x: -20, z: 30, note: 'Residential block — south of center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 85], x: 0, z: 30, note: 'Residential block — south of center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 86], x: 20, z: 30, note: 'Residential block — south of center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 87], x: 40, z: 30, note: 'Residential block — south of center' },
    { type: 'monument', params: ["obelisk", 9], x: -50, z: 20, note: 'Suvorov monument — west of center' },
    { type: 'monument', params: ["obelisk", 9], x: 50, z: 20, note: 'Potemkin monument — east of center' },
    { type: 'warehouse', params: [15, 10, 4, 10], x: -30, z: 45, note: 'Railway depot — south' },
    { type: 'warehouse', params: [15, 10, 4, 74], x: -10, z: 45, note: 'Grain elevator — south' },
    { type: 'industrialFactory', params: [18, 12, 5, 92], x: 15, z: 45, note: 'Factory — south industrial' },
    { type: 'warehouse', params: [12, 8, 4, 9], x: 40, z: 45, note: 'Cold storage — south' },
    { type: 'bunker', params: [], x: -15, z: -5, note: 'River defense bunker — Dnipro embankment' },
    { type: 'bunker', params: [], x: 15, z: -5, note: 'Command bunker — Dnipro embankment' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 1.5, 16], x: -50, z: -30, note: 'Damaged warehouse — port area' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.2, 9], x: 50, z: -30, note: 'Damaged building — port area' },
    { type: 'bridge', params: [30, 6, 3], x: -15, z: 30, note: 'Dnipro embankment bridge' },
    { type: 'portCrane', params: [12], x: -20, z: -35, note: 'Port crane 1' },
    { type: 'portCrane', params: [12], x: 0, z: -35, note: 'Port crane 2' },
    { type: 'portCrane', params: [12], x: 20, z: -35, note: 'Port crane 3' },
    { type: 'monument', params: ["obelisk", 9], x: 0, z: -45, note: 'Soviet monument on embankment' },
    { type: 'damagedBuilding', params: [14, 8, 4, 80], x: -30, z: 35, note: 'Ferry terminal (damaged)' },
    { type: 'damagedBuilding', params: [12, 8, 4, 81], x: 30, z: 35, note: 'River station (damaged)' },
    { type: 'bridge', params: [20, 4, 2], x: -10, z: 50, note: 'Pier walkway' },
    { type: 'bunker', params: [], x: -35, z: 25, note: 'Dnipro riverbank bunker' },
    { type: 'bunker', params: [], x: 35, z: 25, note: 'Dnipro riverbank bunker 2' }
  ];

  // ═══════════════════════════════════════════════════════════
  // CRIMEA
  // ═══════════════════════════════════════════════════════════
  CITIES.crimea = [
{ type: 'crimeaBridge', params: [60, 6, 3, 9], x: -30, z: 0, note: 'Crimea Bridge (road) — Kerch Strait, 19km, road + rail' },
    { type: 'crimeaBridge', params: [60, 4, 2, 9], x: -30, z: 8, note: 'Crimea Bridge (rail) — Kerch Strait' },
    { type: 'industrialFactory', params: [20, 10, 5, 5], x: -40, z: -20, note: 'Bridge control station' },
    { type: 'warehouse', params: [15, 10, 4, 5], x: -40, z: 20, note: 'Toll plaza building' },
    { type: 'warehouse', params: [12, 8, 3, 94], x: 30, z: -20, note: 'Maintenance depot' },
    { type: 'warehouse', params: [12, 8, 3, 93], x: 30, z: 20, note: 'Emergency station' },
    { type: 'bunker', params: [], x: -20, z: -10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: 20, z: -10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: -20, z: 10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: 20, z: 10, note: 'Bridge defense bunker' },
    { type: 'radarStation', params: [], x: -35, z: -30, note: 'Coastal radar' },
    { type: 'radarStation', params: [], x: 35, z: -30, note: 'Coastal radar' },
    { type: 'monument', params: ["obelisk", 9], x: -50, z: 0, note: 'Taman monument' },
    { type: 'monument', params: ["obelisk", 9], x: 50, z: 0, note: 'Kerch monument' },
    { type: 'warehouse', params: [10, 8, 3, 95], x: -50, z: -20, note: 'Coastal warehouse' },
    { type: 'warehouse', params: [10, 8, 3, 10], x: 50, z: -20, note: 'Coastal warehouse' },
    { type: 'warehouse', params: [10, 8, 3, 74], x: -50, z: 20, note: 'Coastal warehouse' },
    { type: 'warehouse', params: [10, 8, 3, 9], x: 50, z: 20, note: 'Coastal warehouse' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 16], x: -30, z: 30, note: 'Damaged building' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 9], x: 30, z: 30, note: 'Damaged building' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2, 9], x: -45, z: 35, note: 'Coastal housing' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2, 80], x: 45, z: 35, note: 'Coastal housing' },
    { type: 'bunker', params: [], x: 0, z: -15, note: 'Underwater defense' },
    { type: 'bunker', params: [], x: 0, z: 15, note: 'Underwater defense' },
    { type: 'industrialFactory', params: [15, 10, 4, 92], x: -15, z: -30, note: 'Port crane base' },
    { type: 'industrialFactory', params: [15, 10, 4, 93], x: 15, z: -30, note: 'Port crane base' },
    { type: 'warehouse', params: [12, 8, 3, 81], x: -15, z: 30, note: 'Port storage' },
    { type: 'warehouse', params: [12, 8, 3, 113], x: 15, z: 30, note: 'Port storage' },
    { type: 'monument', params: ["tank", 9], x: -40, z: 40, note: 'Coastal defense monument' },
    { type: 'monument', params: ["tank", 9], x: 40, z: 40, note: 'Coastal defense monument' },
    { type: 'lighthouse', params: [15], x: -50, z: -50, note: 'Kerch Strait lighthouse' },
    { type: 'coastalFort', params: [], x: 50, z: -50, note: 'Coastal fortification (east)' },
    { type: 'coastalFort', params: [], x: -50, z: 50, note: 'Coastal fortification (west)' },
    { type: 'coastalFort', params: [], x: 50, z: 50, note: 'Coastal fortification (south)' },
    { type: 'damagedBuilding', params: [16, 10, 5, 9], x: -30, z: -30, note: 'Naval base (damaged)' },
    { type: 'damagedBuilding', params: [16, 10, 5, 80], x: 30, z: -30, note: 'Naval base (damaged) 2' },
    { type: 'bunker', params: [], x: 0, z: -30, note: 'Bridge support bunker' },
    { type: 'radarStation', params: [], x: 0, z: 40, note: 'Southern radar station' },
    { type: 'sandbagWall', params: [14, 17], x: -20, z: 25, note: 'Bridge defense sandbags' },
    { type: 'sandbagWall', params: [14, 17], x: 20, z: 25, note: 'Bridge defense sandbags 2' }
  ];

  // ═══════════════════════════════════════════════════════════
  // CHORNOBYL
  // ═══════════════════════════════════════════════════════════
  CITIES.chornobyl = [
{ type: 'sarcophagus', params: [], x: 0, z: -40, note: 'Chornobyl NPP Reactor 4 — New Safe Confinement (steel arch, 2016)' },
    { type: 'industrialFactory', params: [20, 12, 4, 81], x: 50, z: 70, note: 'Jupiter factory — abandoned military electronics plant in Pripyat' },
    { type: 'damagedBuilding', params: [16, 10, 5, 80], x: -50, z: 50, note: 'Pripyat swimming pool (Lazurny) — abandoned, empty basin' },
    { type: 'industrialFactory', params: [25, 15, 6, 5], x: -35, z: -40, note: 'Reactor 3' },
    { type: 'industrialFactory', params: [25, 15, 6, 92], x: 35, z: -40, note: 'Reactor 2' },
    { type: 'industrialFactory', params: [20, 15, 6, 93], x: -60, z: -40, note: 'Reactor 1' },
    { type: 'industrialFactory', params: [20, 15, 6, 94], x: 60, z: -40, note: 'Reactor 5-6 (unfinished)' },
    { type: 'coolingTower', params: [18, 9], x: 0, z: -70, note: 'Cooling Tower 1' },
    { type: 'coolingTower', params: [18, 9], x: 25, z: -70, note: 'Cooling Tower 2' },
    { type: 'sovietApartment', params: [18, 10, 8, 0.1, 9], x: -40, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [18, 10, 8, 0.1, 80], x: -20, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [18, 10, 8, 0.1, 81], x: 0, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [18, 10, 8, 0.1, 82], x: 20, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [18, 10, 8, 0.1, 83], x: 40, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1, 20], x: -40, z: 30, note: 'Pripyat 9-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1, 84], x: -20, z: 30, note: 'Pripyat 9-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1, 85], x: 0, z: 30, note: 'Pripyat 9-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1, 86], x: 20, z: 30, note: 'Pripyat 9-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1, 87], x: 40, z: 30, note: 'Pripyat 9-story block' },
    { type: 'officeBuilding', params: [12, 8, 4, 9], x: -30, z: 50, note: 'Enerhetyk Palace of Culture' },
    { type: 'officeBuilding', params: [10, 8, 5, 80], x: -10, z: 50, note: 'Polissya Hotel' },
    { type: 'warehouse', params: [12, 10, 3, 5], x: 10, z: 50, note: 'Department Store' },
    { type: 'warehouse', params: [10, 8, 3, 94], x: 30, z: 50, note: 'Pripyat Cafe' },
    { type: 'warehouse', params: [15, 10, 3, 93], x: -50, z: 50, note: 'Swimming Pool' },
    { type: 'pripyatFerrisWheel', params: [], x: 50, z: 50, note: 'Amusement Park — Pripyat Ferris Wheel' },
    { type: 'school', params: [12, 10, 3, 9], x: -35, z: 65, note: 'School No. 1' },
    { type: 'school', params: [12, 10, 3, 82], x: -15, z: 65, note: 'School No. 2' },
    { type: 'school', params: [12, 10, 3, 20], x: 5, z: 65, note: 'School No. 3' },
    { type: 'school', params: [12, 10, 3, 86], x: 25, z: 65, note: 'School No. 4' },
    { type: 'school', params: [12, 10, 3, 10], x: 45, z: 65, note: 'School No. 5' },
    { type: 'monument', params: ["obelisk", 9], x: 0, z: 75, note: 'Prometheus statue' },
    { type: 'bunker', params: [], x: -15, z: -20, note: 'Underground shelter' },
    { type: 'bunker', params: [], x: 15, z: -20, note: 'Underground shelter' },
    { type: 'dugaRadar', params: [], x: -55, z: 0, note: 'Duga radar base (Chernobyl-2)' },
    { type: 'dugaRadar', params: [], x: 55, z: 0, note: 'Duga radar base (Chernobyl-2)' },
    { type: 'monument', params: ["obelisk", 9], x: -50, z: -60, note: 'Liquidators memorial' },
    { type: 'monument', params: ["obelisk", 9], x: 50, z: -60, note: 'Firefighters memorial' },
    { type: 'coolingTower', params: [18, 9], x: -25, z: -70, note: 'Cooling Tower 3' },
    { type: 'coolingTower', params: [18, 9], x: 25, z: -70, note: 'Cooling Tower 4' },
    { type: 'damagedBuilding', params: [14, 10, 4, 16], x: -60, z: 50, note: 'Pripyat swimming pool (abandoned)' },
    { type: 'damagedBuilding', params: [12, 8, 3, 9], x: 60, z: 50, note: 'Pripyat kindergarten (abandoned)' },
    { type: 'damagedBuilding', params: [16, 10, 5, 80], x: -50, z: 70, note: 'Pripyat hospital (abandoned)' },
    { type: 'damagedBuilding', params: [20, 12, 4, 81], x: 50, z: 70, note: 'Jupiter factory (abandoned)' },
    { type: 'bunker', params: [], x: -30, z: -20, note: 'Shelter near Reactor 3' },
    { type: 'bunker', params: [], x: 30, z: -20, note: 'Shelter near Reactor 2' },
    { type: 'monument', params: ["obelisk", 9], x: 0, z: 85, note: 'Pripyat sign monument' },
    { type: 'monument', params: ["obelisk", 9], x: -70, z: 0, note: 'Duga memorial' }
  ];

  // ═══════════════════════════════════════════════════════════
  // SEVASTOPOL
  // ═══════════════════════════════════════════════════════════
  CITIES.sevastopol = [
{ type: 'industrialFactory', params: [30, 15, 6, 5], x: 0, z: -20, note: 'Shipyard dry dock — Sevastopol Bay, north side' },
    { type: 'industrialFactory', params: [25, 12, 5, 92], x: -35, z: -20, note: 'Repair workshop — Sevastopol Bay, west' },
    { type: 'industrialFactory', params: [25, 12, 5, 93], x: 35, z: -20, note: 'Submarine pen — Sevastopol Bay, east' },
    { type: 'warehouse', params: [20, 10, 4, 5], x: -50, z: -5, note: 'Naval stores — west of bay' },
    { type: 'warehouse', params: [20, 10, 4, 94], x: 50, z: -5, note: 'Ammunition depot — east of bay' },
    { type: 'officeBuilding', params: [12, 10, 5, 9], x: -30, z: 5, note: 'Black Sea Fleet HQ — north shore, west (grandiose naval building)' },
    { type: 'officeBuilding', params: [12, 10, 5, 80], x: 30, z: 5, note: 'Admiralty building — north shore, east' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 10], x: -15, z: 5, note: 'St. Vladimir Cathedral — north shore, center-west' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 20], x: 15, z: 5, note: 'St. Nicholas Cathedral — north shore, center-east' },
    { type: 'monumentToSunkenShips', params: [], x: 0, z: 25, note: 'Monument to Sunken Ships — Sevastopol Bay waterfront' },
    { type: 'monument', params: ["obelisk", 9], x: -40, z: 25, note: 'Nakhimov monument — west waterfront' },
    { type: 'monument', params: ["obelisk", 9], x: 40, z: 25, note: 'Kornilov monument — east waterfront' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 9], x: -40, z: 40, note: 'Naval housing — north of city' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 80], x: -20, z: 40, note: 'Naval housing — north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 81], x: 0, z: 40, note: 'Naval housing — north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 82], x: 20, z: 40, note: 'Naval housing — north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 83], x: 40, z: 40, note: 'Naval housing — north' },
    { type: 'warehouse', params: [15, 10, 4, 93], x: -50, z: 55, note: 'Port warehouse — north' },
    { type: 'warehouse', params: [15, 10, 4, 95], x: -25, z: 55, note: 'Port warehouse — north' },
    { type: 'warehouse', params: [15, 10, 4, 10], x: 0, z: 55, note: 'Port warehouse — north' },
    { type: 'warehouse', params: [15, 10, 4, 74], x: 25, z: 55, note: 'Port warehouse — north' },
    { type: 'warehouse', params: [15, 10, 4, 9], x: 50, z: 55, note: 'Port warehouse — north' },
    { type: 'bunker', params: [], x: -20, z: -5, note: 'Coastal defense bunker — Sevastopol Bay shore' },
    { type: 'bunker', params: [], x: 20, z: -5, note: 'Coastal defense bunker — Sevastopol Bay shore' },
    { type: 'bunker', params: [], x: -15, z: 30, note: 'Underground command center — north' },
    { type: 'bunker', params: [], x: 15, z: 30, note: 'Ammo bunker — north' },
    { type: 'radarStation', params: [], x: -50, z: -40, note: 'Coastal radar — west entrance to bay' },
    { type: 'radarStation', params: [], x: 50, z: -40, note: 'Coastal radar — east entrance to bay' },
    { type: 'coastalFort', params: [], x: -30, z: -50, note: 'Coastal battery — west' },
    { type: 'coastalFort', params: [], x: 30, z: -50, note: 'Coastal battery — east' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.0, 16], x: 0, z: 60, note: 'Damaged port building — north' },
    { type: 'hangar', params: [25, 15, 6, 5], x: -55, z: -30, note: 'Submarine pen (west)' },
    { type: 'hangar', params: [25, 15, 6, 92], x: 55, z: -30, note: 'Submarine pen (east)' },
    { type: 'portCrane', params: [12], x: -40, z: -5, note: 'Harbor crane 1' },
    { type: 'portCrane', params: [12], x: 40, z: -5, note: 'Harbor crane 2' },
    { type: 'portCrane', params: [12], x: -40, z: 15, note: 'Harbor crane 3' },
    { type: 'portCrane', params: [12], x: 40, z: 15, note: 'Harbor crane 4' },
    { type: 'kremlinWall', params: [30, 20, 5, 105], x: -20, z: 60, note: 'Fortress walls (north)' },
    { type: 'kremlinWall', params: [30, 20, 5, 105], x: 20, z: 60, note: 'Fortress walls (northeast)' },
    { type: 'officeBuilding', params: [14, 10, 4, 9], x: 0, z: 55, note: 'Command center' },
    { type: 'bunker', params: [], x: -30, z: 40, note: 'Naval command bunker' }
  ];

  // ═══════════════════════════════════════════════════════════
  // DONBAS
  // ═══════════════════════════════════════════════════════════
  CITIES.donbas = [
{ type: 'industrialFactory', params: [35, 20, 8, 5], x: 0, z: 0, note: 'Mine shaft complex' },
    { type: 'industrialFactory', params: [25, 15, 6, 92], x: -40, z: -10, note: 'Processing plant' },
    { type: 'industrialFactory', params: [25, 15, 6, 93], x: 40, z: -10, note: 'Processing plant' },
    { type: 'industrialFactory', params: [20, 12, 5, 94], x: 0, z: -25, note: 'Coal washery' },
    { type: 'warehouse', params: [30, 15, 5, 5], x: -50, z: 15, note: 'Coal storage' },
    { type: 'warehouse', params: [25, 12, 5, 94], x: 50, z: 15, note: 'Equipment depot' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 9], x: -40, z: -30, note: 'Miners housing' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 80], x: -20, z: -30, note: 'Miners housing' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 81], x: 0, z: -30, note: 'Miners housing' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 82], x: 20, z: -30, note: 'Miners housing' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 83], x: 40, z: -30, note: 'Miners housing' },
    { type: 'officeBuilding', params: [10, 8, 4, 9], x: -30, z: 30, note: 'Mine admin' },
    { type: 'officeBuilding', params: [10, 8, 4, 80], x: 30, z: 30, note: 'Union office' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 10], x: -15, z: 30, note: 'Miners church' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 20], x: 15, z: 30, note: 'Village church' },
    { type: 'monument', params: ["obelisk", 9], x: 0, z: 40, note: 'Miners memorial' },
    { type: 'monument', params: ["obelisk", 9], x: -40, z: 40, note: 'WWII memorial' },
    { type: 'monument', params: ["obelisk", 9], x: 40, z: 40, note: 'Labor monument' },
    { type: 'bunker', params: [], x: -15, z: -15, note: 'Mine shelter' },
    { type: 'bunker', params: [], x: 15, z: -15, note: 'Mine shelter' },
    { type: 'bunker', params: [], x: -15, z: 15, note: 'Civil defense bunker' },
    { type: 'bunker', params: [], x: 15, z: 15, note: 'Civil defense bunker' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0, 16], x: -50, z: -10, note: 'Ruined workshop' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0, 9], x: 50, z: -10, note: 'Ruined workshop' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 1.5, 10], x: -30, z: 45, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 1.5, 72], x: 30, z: 45, note: 'Ruined house' },
    { type: 'warehouse', params: [12, 8, 3, 93], x: -10, z: 45, note: 'Tool shed' },
    { type: 'warehouse', params: [12, 8, 3, 95], x: 10, z: 45, note: 'Storage' },
    { type: 'industrialFactory', params: [15, 10, 4, 95], x: -50, z: -35, note: 'Power substation' },
    { type: 'industrialFactory', params: [15, 10, 4, 96], x: 50, z: -35, note: 'Power substation' },
    { type: 'mineHeadframe', params: [14], x: -20, z: -15, note: 'Mine headframe 1' },
    { type: 'mineHeadframe', params: [14], x: 20, z: -15, note: 'Mine headframe 2' },
    { type: 'mineHeadframe', params: [12], x: 0, z: -35, note: 'Mine headframe 3' },
    { type: 'spoilTip', params: [14, 8], x: -45, z: -5, note: 'Spoil tip (west)' },
    { type: 'spoilTip', params: [14, 8], x: 45, z: -5, note: 'Spoil tip (east)' },
    { type: 'industrialFactory', params: [20, 10, 4, 94], x: -30, z: -45, note: 'Coal processing (west)' },
    { type: 'industrialFactory', params: [20, 10, 4, 95], x: 30, z: -45, note: 'Coal processing (east)' },
    { type: 'warehouse', params: [18, 8, 3, 93], x: -10, z: -45, note: 'Rail loading facility' },
    { type: 'warehouse', params: [18, 8, 3, 96], x: 10, z: -45, note: 'Rail loading facility 2' },
    { type: 'bunker', params: [], x: 0, z: -55, note: 'Mine shaft shelter' }
  ];

  // ═══════════════════════════════════════════════════════════
  // BELGOROD
  // ═══════════════════════════════════════════════════════════
  CITIES.belgorod = [
{ type: 'sovietApartment', params: [16, 8, 5, 0.2, 9], x: -40, z: -20, note: 'Apartment block — city center north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 80], x: -20, z: -20, note: 'Apartment block — city center north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 81], x: 0, z: -20, note: 'Apartment block — city center north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 82], x: 20, z: -20, note: 'Apartment block — city center north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 83], x: 40, z: -20, note: 'Apartment block — city center north' },
    { type: 'officeBuilding', params: [10, 8, 4, 9], x: -40, z: 0, note: 'Admin building — city center' },
    { type: 'officeBuilding', params: [10, 8, 4, 80], x: -20, z: 0, note: 'Police station — city center' },
    { type: 'officeBuilding', params: [10, 8, 4, 82], x: 0, z: 0, note: 'City hall — city center' },
    { type: 'officeBuilding', params: [10, 8, 4, 83], x: 20, z: 0, note: 'Military office — city center' },
    { type: 'officeBuilding', params: [10, 8, 4, 84], x: 40, z: 0, note: 'FSB office — city center' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 10], x: -30, z: 20, note: 'Trinity Cathedral — city center south' },
    { type: 'orthodoxChurch', params: [8, 10, 5, 20], x: 30, z: 20, note: 'St. Mary Church — city center south' },
    { type: 'warehouse', params: [15, 10, 4, 5], x: -10, z: 20, note: 'Market — city center south' },
    { type: 'warehouse', params: [15, 10, 4, 94], x: 10, z: 20, note: 'Shopping center — city center south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 20], x: -40, z: 40, note: 'Residential block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 84], x: -20, z: 40, note: 'Residential block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 85], x: 0, z: 40, note: 'Residential block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 86], x: 20, z: 40, note: 'Residential block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2, 87], x: 40, z: 40, note: 'Residential block — south' },
    { type: 'monument', params: ["obelisk", 9], x: -50, z: -40, note: 'Border monument — north, toward Ukraine' },
    { type: 'monument', params: ["tank", 9], x: 50, z: -40, note: 'T-90 monument — northeast' },
    { type: 'monument', params: ["obelisk", 9], x: 0, z: -40, note: 'Victory monument — north' },
    { type: 'bunker', params: [], x: -20, z: -10, note: 'Military bunker — north of center' },
    { type: 'bunker', params: [], x: 20, z: -10, note: 'Military bunker — north of center' },
    { type: 'bunker', params: [], x: -20, z: 30, note: 'Civil defense bunker — south' },
    { type: 'bunker', params: [], x: 20, z: 30, note: 'Civil defense bunker — south' },
    { type: 'industrialFactory', params: [15, 10, 4, 5], x: -50, z: 10, note: 'Factory — west' },
    { type: 'industrialFactory', params: [15, 10, 4, 92], x: 50, z: 10, note: 'Factory — east' },
    { type: 'warehouse', params: [12, 8, 3, 93], x: -50, z: 30, note: 'Warehouse — west' },
    { type: 'warehouse', params: [12, 8, 3, 95], x: 50, z: 30, note: 'Warehouse — east' },
    { type: 'kremlinWall', params: [20, 8, 4, 9], x: -60, z: -20, note: 'Border checkpoint gate' },
    { type: 'hangar', params: [20, 12, 4, 5], x: -55, z: 10, note: 'Military barracks (west)' },
    { type: 'hangar', params: [20, 12, 4, 92], x: 55, z: 10, note: 'Military barracks (east)' },
    { type: 'warehouse', params: [25, 15, 5, 93], x: -55, z: -40, note: 'Supply depot' },
    { type: 'warehouse', params: [25, 15, 5, 94], x: 55, z: -40, note: 'Supply depot 2' },
    { type: 'radarStation', params: [], x: -40, z: -50, note: 'Air defense radar' },
    { type: 'radarStation', params: [], x: 40, z: -50, note: 'Air defense radar 2' },
    { type: 'officeBuilding', params: [14, 10, 4, 95], x: -30, z: -45, note: 'Railway station' },
    { type: 'officeBuilding', params: [14, 10, 4, 96], x: 30, z: -45, note: 'Railway station 2' },
    { type: 'sandbagWall', params: [20, 17], x: -10, z: -55, note: 'Border sandbag wall' }
  ];

  // ═══════════════════════════════════════════════════════════
  // KREMLIN
  // ═══════════════════════════════════════════════════════════
  CITIES.kremlin = [
{ type: 'kremlinWall', params: [80, 60, 8, 9], x: 0, z: 0, note: 'Kremlin walls — triangular fortification, red brick, towers with green roofs and ruby stars (Spasskaya Tower has clock + red star)' },
    { type: 'orthodoxChurch', params: [10, 12, 8, 10], x: -20, z: -10, note: 'Assumption Cathedral — inside Kremlin, west' },
    { type: 'orthodoxChurch', params: [10, 12, 8, 20], x: 0, z: -10, note: 'Archangel Cathedral — inside Kremlin, center' },
    { type: 'orthodoxChurch', params: [10, 12, 8, 65], x: 20, z: -10, note: 'Annunciation Cathedral — inside Kremlin, east' },
    { type: 'orthodoxChurch', params: [8, 10, 6, 3], x: -30, z: -10, note: 'Church of the Deposition — inside Kremlin, far west' },
    { type: 'orthodoxChurch', params: [8, 10, 6, 105], x: 30, z: -10, note: 'Church of the Twelve Apostles — inside Kremlin, far east' },
    { type: 'officeBuilding', params: [6, 6, 12, 9], x: -10, z: 5, note: 'Ivan the Great Bell Tower — inside Kremlin' },
    { type: 'officeBuilding', params: [6, 6, 12, 80], x: 10, z: 5, note: 'Tsar Bell Tower — inside Kremlin' },
    { type: 'officeBuilding', params: [14, 10, 5, 82], x: -25, z: 15, note: 'Senate building — inside Kremlin' },
    { type: 'officeBuilding', params: [14, 10, 5, 83], x: 25, z: 15, note: 'Presidential residence — inside Kremlin' },
    { type: 'officeBuilding', params: [10, 8, 4, 84], x: -10, z: 20, note: 'Armory Chamber — inside Kremlin' },
    { type: 'officeBuilding', params: [10, 8, 4, 85], x: 10, z: 20, note: 'Diamond Fund — inside Kremlin' },
    { type: 'stBasilCathedral', params: [], x: 0, z: 35, note: 'St. Basil’s Cathedral — south end of Red Square' },
    { type: 'stateHistoricalMuseum', params: [12, 8, 4, 10], x: -30, z: 35, note: 'State Historical Museum — north of Red Square' },
    { type: 'gumDepartmentStore', params: [12, 8, 4, 9], x: 30, z: 35, note: 'GUM Department Store — east of Red Square' },
    { type: 'leninMausoleum', params: [], x: -15, z: 35, note: 'Lenin Mausoleum — against Kremlin wall' },
    { type: 'monument', params: ["obelisk", 9], x: 15, z: 35, note: 'Minin & Pozharsky — Red Square' },
    { type: 'lubyankaBuilding', params: [12, 10, 6, 20], x: -50, z: 0, note: 'Lubyanka FSB HQ — northeast of Kremlin' },
    { type: 'officeBuilding', params: [12, 10, 6, 89], x: 50, z: 0, note: 'MVD headquarters — east of Kremlin' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1, 9], x: -50, z: -30, note: 'Hotel National — northwest' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1, 80], x: 50, z: -30, note: 'Rossiya Hotel — northeast' },
    { type: 'bolshoiTheatre', params: [10, 8, 5, 65], x: -50, z: 30, note: 'Moscow State University — northwest, near Sparrow Hills' },
    { type: 'bolshoiTheatre', params: [10, 8, 5, 108], x: 50, z: 30, note: 'Bolshoi Theatre — northeast, Theater Square' },
    { type: 'motherlandMonument', params: [], x: 0, z: -50, note: 'Motherland Calls — Victory Park, north of Kremlin' },
    { type: 'monument', params: ["tank", 9], x: -40, z: 50, note: 'Tank monument — southwest' },
    { type: 'monument', params: ["tank", 9], x: 40, z: 50, note: 'Tank monument — southeast' },
    { type: 'bunker', params: [], x: -20, z: 0, note: 'Kremlin bunker — inside walls' },
    { type: 'bunker', params: [], x: 20, z: 0, note: 'FSB bunker — near Lubyanka' },
    { type: 'monument', params: ["obelisk", 9], x: -40, z: 35, note: 'Red Square podium' },
    { type: 'monument', params: ["obelisk", 9], x: 40, z: 35, note: 'Red Square podium 2' },
    { type: 'monument', params: ["obelisk", 9], x: -25, z: 35, note: 'Red Square podium 3' },
    { type: 'monument', params: ["obelisk", 9], x: 25, z: 35, note: 'Red Square podium 4' },
    { type: 'officeBuilding', params: [8, 6, 10, 3], x: -35, z: -10, note: 'Spasskaya Tower (red star)' },
    { type: 'officeBuilding', params: [8, 6, 10, 105], x: 35, z: -10, note: 'Trinity Tower' },
    { type: 'officeBuilding', params: [8, 6, 10, 10], x: -35, z: 10, note: 'Nikolskaya Tower' },
    { type: 'officeBuilding', params: [8, 6, 10, 20], x: 35, z: 10, note: 'Troitskaya Tower' },
    { type: 'fountain', params: [], x: -10, z: 45, note: 'Red Square fountain' },
    { type: 'fountain', params: [], x: 10, z: 45, note: 'Red Square fountain 2' }
  ];

  // ═══════════════════════════════════════════════════════════
  // SNAKEISLAND
  // ═══════════════════════════════════════════════════════════
  CITIES.snakeIsland = [
{ type: 'bunker', params: [], x: 0, z: 0, note: 'Main bunker' },
    { type: 'bunker', params: [], x: -10, z: -10, note: 'Coastal defense bunker' },
    { type: 'bunker', params: [], x: 10, z: -10, note: 'Coastal defense bunker' },
    { type: 'bunker', params: [], x: -10, z: 10, note: 'Coastal defense bunker' },
    { type: 'bunker', params: [], x: 10, z: 10, note: 'Coastal defense bunker' },
    { type: 'radarStation', params: [], x: 0, z: -5, note: 'Coastal radar' },
    { type: 'snakeIslandBorderPost', params: [], x: 0, z: 5, note: 'Snake Island border post — Ukrainian border marker' },
    { type: 'warehouse', params: [8, 6, 3], x: -5, z: 5, note: 'Supply shed' },
    { type: 'warehouse', params: [8, 6, 3], x: 5, z: 5, note: 'Equipment shed' },
    { type: 'ruinedBuilding', params: [6, 6, 2, 1.0], x: -8, z: 0, note: 'Damaged structure' },
    { type: 'ruinedBuilding', params: [6, 6, 2, 1.0], x: 8, z: 0, note: 'Damaged structure' },
    { type: 'lighthouse', params: [10], x: 5, z: -5, note: 'Snake Island lighthouse' },
    { type: 'damagedBuilding', params: [6, 6, 2, 16], x: -5, z: -5, note: 'Small garrison building' },
    { type: 'ukrainianFlag', params: [3, 3, 3], x: 0, z: 8, note: 'Ukrainian flagpole' },
    { type: 'coastalFort', params: [], x: -8, z: 8, note: 'Coastal defense (west)' },
    { type: 'coastalFort', params: [], x: 8, z: 8, note: 'Coastal defense (east)' },
    { type: 'coastalFort', params: [], x: -8, z: -8, note: 'Coastal defense (northwest)' },
    { type: 'coastalFort', params: [], x: 8, z: -8, note: 'Coastal defense (northeast)' },
    { type: 'sandbagWall', params: [8, 17], x: -4, z: 0, note: 'Garrison sandbag wall' },
    { type: 'observationPost', params: [6, 109], x: 0, z: -8, note: 'Observation post' },
    { type: 'bunker', params: [], x: 5, z: 5, note: 'Ammo bunker' }
  ];

  // ═══════════════════════════════════════════════════════════
  // SAKY
  // ═══════════════════════════════════════════════════════════
  CITIES.saky = [
{ type: 'airportTerminal', params: [20, 10, 4, 9], x: 0, z: -20, note: 'Airbase control tower' },
    { type: 'hangar', params: [25, 15, 6, 9], x: -30, z: -10, note: 'Aircraft hangar 1' },
    { type: 'hangar', params: [25, 15, 6, 9], x: 30, z: -10, note: 'Aircraft hangar 2' },
    { type: 'hangar', params: [20, 12, 5, 9], x: -30, z: 10, note: 'Aircraft hangar 3' },
    { type: 'hangar', params: [20, 12, 5, 9], x: 30, z: 10, note: 'Aircraft hangar 4' },
    { type: 'hangar', params: [20, 12, 5, 9], x: -30, z: 30, note: 'Aircraft hangar 5' },
    { type: 'hangar', params: [20, 12, 5, 9], x: 30, z: 30, note: 'Aircraft hangar 6' },
    { type: 'warehouse', params: [15, 10, 4, 5], x: 0, z: 10, note: 'Fuel storage' },
    { type: 'warehouse', params: [15, 10, 4, 94], x: 0, z: 30, note: 'Ammunition depot' },
    { type: 'bunker', params: [], x: -15, z: -5, note: 'Command bunker' },
    { type: 'bunker', params: [], x: 15, z: -5, note: 'Shelter' },
    { type: 'radarStation', params: [], x: -40, z: -30, note: 'Radar station' },
    { type: 'radarStation', params: [], x: 40, z: -30, note: 'Radar station' },
    { type: 'radarStation', params: [], x: 0, z: -40, note: 'Air traffic control radar' },
    { type: 'monument', params: ["obelisk", 9], x: -50, z: 0, note: 'Air force monument' },
    { type: 'monument', params: ["tank", 9], x: 50, z: 0, note: 'T-72 monument' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 16], x: -20, z: 20, note: 'Damaged hangar' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 9], x: 20, z: 20, note: 'Damaged building' },
    { type: 'ruinedBuilding', params: [8, 6, 2, 1.0, 10], x: -10, z: 40, note: 'Craters' },
    { type: 'ruinedBuilding', params: [8, 6, 2, 1.0, 72], x: 10, z: 40, note: 'Craters' },
    { type: 'smokestack', params: [15, 92], x: -15, z: 40, note: 'Airfield smokestack' },
    { type: 'hangar', params: [18, 10, 4, 9], x: -20, z: 50, note: 'Aircraft shelter 1' },
    { type: 'hangar', params: [18, 10, 4, 9], x: 0, z: 50, note: 'Aircraft shelter 2' },
    { type: 'hangar', params: [18, 10, 4, 9], x: 20, z: 50, note: 'Aircraft shelter 3' },
    { type: 'damagedBuilding', params: [10, 8, 3, 16], x: -35, z: 40, note: 'Fuel depot (damaged)' },
    { type: 'damagedBuilding', params: [10, 8, 3, 9], x: 35, z: 40, note: 'Fuel depot (damaged) 2' },
    { type: 'bunker', params: [], x: -10, z: 40, note: 'Ammunition bunker' },
    { type: 'bunker', params: [], x: 10, z: 40, note: 'Ammunition bunker 2' },
    { type: 'sandbagWall', params: [12, 17], x: -15, z: -40, note: 'Perimeter sandbag wall' },
    { type: 'sandbagWall', params: [12, 17], x: 15, z: -40, note: 'Perimeter sandbag wall 2' }
  ];

  // ═══════════════════════════════════════════════════════════
  // VUHLEDAR
  // ═══════════════════════════════════════════════════════════
  CITIES.vuhledar = [
{ type: 'sovietApartment', params: [16, 8, 5, 0.5, 9], x: -30, z: -20, note: 'Damaged apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.6, 80], x: -10, z: -20, note: 'Heavily damaged apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.7, 81], x: 10, z: -20, note: 'Ruined apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.5, 82], x: 30, z: -20, note: 'Damaged apartment' },
    { type: 'industrialFactory', params: [20, 12, 5, 5], x: 0, z: 0, note: 'Coal processing plant' },
    { type: 'industrialFactory', params: [15, 10, 4, 92], x: -25, z: 15, note: 'Power station' },
    { type: 'industrialFactory', params: [15, 10, 4, 93], x: 25, z: 15, note: 'Substation' },
    { type: 'warehouse', params: [15, 10, 4, 5], x: -40, z: 30, note: 'Coal storage' },
    { type: 'warehouse', params: [15, 10, 4, 94], x: 40, z: 30, note: 'Equipment depot' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0, 16], x: -20, z: 30, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0, 9], x: 0, z: 30, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0, 10], x: 20, z: 30, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.5, 72], x: -50, z: -10, note: 'Destroyed school' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.5, 81], x: 50, z: -10, note: 'Destroyed hospital' },
    { type: 'bunker', params: [], x: -15, z: -5, note: 'Mine shelter' },
    { type: 'bunker', params: [], x: 15, z: -5, note: 'Mine shelter' },
    { type: 'monument', params: ["obelisk", 9], x: -40, z: -40, note: 'Miners memorial' },
    { type: 'monument', params: ["tank", 9], x: 0, z: -40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ["tank", 9], x: 20, z: -40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ["tank", 9], x: -20, z: -40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ["tank", 9], x: 40, z: -40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ["tank", 9], x: -40, z: 40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ["tank", 9], x: 40, z: 40, note: 'Destroyed tank (wreck)' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0, 113], x: -30, z: 40, note: 'Ruined apartment' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0, 16], x: 30, z: 40, note: 'Ruined apartment' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5, 9], x: -10, z: 45, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5, 10], x: 10, z: 45, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 2.0, 72], x: -50, z: 10, note: 'Ruined building' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 2.0, 81], x: 50, z: 10, note: 'Ruined building' },
    { type: 'bunker', params: [], x: 0, z: 15, note: 'Trench bunker' },
    { type: 'mineHeadframe', params: [12], x: -15, z: -5, note: 'Coal mine shaft 1' },
    { type: 'mineHeadframe', params: [12], x: 15, z: -5, note: 'Coal mine shaft 2' },
    { type: 'spoilTip', params: [12, 6], x: -40, z: -15, note: 'Mine tailings (west)' },
    { type: 'spoilTip', params: [12, 6], x: 40, z: -15, note: 'Mine tailings (east)' },
    { type: 'warehouse', params: [20, 8, 3, 93], x: -30, z: 40, note: 'Rail loading facility' },
    { type: 'warehouse', params: [20, 8, 3, 94], x: 30, z: 40, note: 'Rail loading facility 2' },
    { type: 'damagedBuilding', params: [14, 8, 4, 16], x: -20, z: 40, note: 'Worker housing (ruined)' },
    { type: 'damagedBuilding', params: [14, 8, 4, 9], x: 0, z: 40, note: 'Worker housing (ruined) 2' },
    { type: 'damagedBuilding', params: [14, 8, 4, 10], x: 20, z: 40, note: 'Worker housing (ruined) 3' },
    { type: 'bunker', params: [], x: 0, z: 20, note: 'Mine shelter' }
  ];

  // ═══════════════════════════════════════════════════════════
  // ANTONOV
  // ═══════════════════════════════════════════════════════════
  CITIES.antonov = [
{ type: 'antonovskyBridge', params: [50, 6, 4, 9], x: -25, z: 0, note: 'Antonovsky Bridge (damaged) — cable-stayed, bombed sections' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 16], x: -40, z: -15, note: 'Bridge checkpoint (ruined)' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0, 9], x: 40, z: -15, note: 'Bridge checkpoint (ruined)' },
    { type: 'bunker', params: [], x: -20, z: -10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: 20, z: -10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: -20, z: 10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: 20, z: 10, note: 'Bridge defense bunker' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 9], x: -40, z: -30, note: 'Apartment block' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 80], x: -20, z: -30, note: 'Apartment block' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 81], x: 0, z: -30, note: 'Apartment block' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 82], x: 20, z: -30, note: 'Apartment block' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3, 83], x: 40, z: -30, note: 'Apartment block' },
    { type: 'warehouse', params: [15, 10, 4, 5], x: -30, z: 20, note: 'River port warehouse' },
    { type: 'warehouse', params: [15, 10, 4, 94], x: -10, z: 20, note: 'Grain elevator' },
    { type: 'warehouse', params: [15, 10, 4, 93], x: 10, z: 20, note: 'Storage depot' },
    { type: 'warehouse', params: [15, 10, 4, 95], x: 30, z: 20, note: 'Cold storage' },
    { type: 'industrialFactory', params: [15, 10, 4, 5], x: -40, z: 35, note: 'Ship repair' },
    { type: 'industrialFactory', params: [15, 10, 4, 92], x: 40, z: 35, note: 'Dockyard' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 10], x: -50, z: 0, note: 'Damaged building' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 72], x: 50, z: 0, note: 'Damaged building' },
    { type: 'monument', params: ["obelisk", 9], x: -50, z: -20, note: 'Monument' },
    { type: 'monument', params: ["obelisk", 9], x: 50, z: -20, note: 'Monument' },
    { type: 'bunker', params: [], x: 0, z: -15, note: 'Bridge command bunker' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 81], x: -30, z: 40, note: 'Damaged house' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 113], x: 30, z: 40, note: 'Damaged house' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2, 20], x: -50, z: 30, note: 'Small apartment' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2, 84], x: 50, z: 30, note: 'Small apartment' },
    { type: 'bridge', params: [30, 6, 3], x: -15, z: -20, note: 'Bridge approach (west)' },
    { type: 'bridge', params: [30, 6, 3], x: -15, z: 20, note: 'Bridge approach (east)' },
    { type: 'damagedBuilding', params: [10, 6, 3, 16], x: -50, z: -15, note: 'Checkpoint (west)' },
    { type: 'damagedBuilding', params: [10, 6, 3, 9], x: 50, z: -15, note: 'Checkpoint (east)' },
    { type: 'damagedBuilding', params: [8, 6, 2, 10], x: -50, z: 15, note: 'River bank ruin' },
    { type: 'damagedBuilding', params: [8, 6, 2, 72], x: 50, z: 15, note: 'River bank ruin 2' },
    { type: 'bunker', params: [], x: -35, z: -5, note: 'Bridge pillar bunker' },
    { type: 'bunker', params: [], x: 35, z: -5, note: 'Bridge pillar bunker 2' },
    { type: 'bunker', params: [], x: -35, z: 5, note: 'Bridge pillar bunker 3' },
    { type: 'bunker', params: [], x: 35, z: 5, note: 'Bridge pillar bunker 4' }
  ];

  // ═══════════════════════════════════════════════════════════
  // REFINERY
  // ═══════════════════════════════════════════════════════════
  CITIES.refinery = [
{ type: 'distillationTower', params: [20, 9], x: 0, z: 0, note: 'Main distillation tower' },
    { type: 'distillationTower', params: [16, 9], x: -25, z: -10, note: 'Cracking unit' },
    { type: 'distillationTower', params: [16, 9], x: 25, z: -10, note: 'Reforming unit' },
    { type: 'industrialFactory', params: [25, 15, 6, 5], x: -30, z: -35, note: 'Hydrotreater' },
    { type: 'industrialFactory', params: [25, 15, 6, 92], x: 30, z: -35, note: 'Coker unit' },
    { type: 'storageTank', params: [6, 8, 9], x: -40, z: 15, note: 'Crude oil storage tank' },
    { type: 'storageTank', params: [6, 8, 9], x: -28, z: 15, note: 'Crude oil storage tank' },
    { type: 'storageTank', params: [5, 6, 9], x: 40, z: 15, note: 'Product storage tank' },
    { type: 'storageTank', params: [5, 6, 9], x: 28, z: 15, note: 'Product storage tank' },
    { type: 'industrialFactory', params: [20, 12, 5, 93], x: 0, z: -30, note: 'Sulfur recovery' },
    { type: 'storageTank', params: [5, 6, 9], x: -25, z: 25, note: 'Tank farm' },
    { type: 'storageTank', params: [5, 6, 9], x: 25, z: 25, note: 'Tank farm' },
    { type: 'bunker', params: [], x: -15, z: -15, note: 'Control bunker' },
    { type: 'bunker', params: [], x: 15, z: -15, note: 'Shelter' },
    { type: 'bunker', params: [], x: -15, z: 15, note: 'Security bunker' },
    { type: 'bunker', params: [], x: 15, z: 15, note: 'Security bunker' },
    { type: 'radarStation', params: [], x: -40, z: -40, note: 'Air defense radar' },
    { type: 'radarStation', params: [], x: 40, z: -40, note: 'Air defense radar' },
    { type: 'monument', params: ["obelisk", 9], x: -50, z: 0, note: 'Industrial monument' },
    { type: 'monument', params: ["tank", 9], x: 50, z: 0, note: 'Security monument' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 16], x: -30, z: 30, note: 'Damaged tank' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5, 9], x: 30, z: 30, note: 'Damaged tank' },
    { type: 'flareStack', params: [12], x: -15, z: -50, note: 'Flare stack 1' },
    { type: 'flareStack', params: [12], x: 15, z: -50, note: 'Flare stack 2' },
    { type: 'flareStack', params: [10], x: 0, z: -55, note: 'Flare stack 3' },
    { type: 'storageTank', params: [5, 6, 9], x: -35, z: 35, note: 'Oil storage tank 5' },
    { type: 'storageTank', params: [5, 6, 9], x: -20, z: 35, note: 'Oil storage tank 6' },
    { type: 'storageTank', params: [5, 6, 9], x: 20, z: 35, note: 'Oil storage tank 7' },
    { type: 'storageTank', params: [5, 6, 9], x: 35, z: 35, note: 'Oil storage tank 8' },
    { type: 'damagedBuilding', params: [12, 8, 4, 80], x: -10, z: 45, note: 'Control room (damaged)' },
    { type: 'damagedBuilding', params: [12, 8, 4, 81], x: 10, z: 45, note: 'Pipeline control (damaged)' },
    { type: 'industrialFactory', params: [25, 4, 3, 93], x: -30, z: 0, note: 'Pipeline network' }
  ];

  // ═══════════════════════════════════════════════════════════
  // TREELINE
  // ═══════════════════════════════════════════════════════════
  CITIES.treeline = [
{ type: 'wheatField', params: [60, 40], x: -30, z: -20, note: 'Wheat field — approach to treeline' },
    { type: 'trenches', params: [20, 9], x: -20, z: -15, note: 'Forward trench line' },
    { type: 'trenches', params: [20, 9], x: -10, z: -15, note: 'Forward trench line' },
    { type: 'trenches', params: [20, 9], x: 0, z: -15, note: 'Forward trench line' },
    { type: 'trenches', params: [20, 9], x: 10, z: -15, note: 'Forward trench line' },
    { type: 'trenches', params: [20, 9], x: 20, z: -15, note: 'Forward trench line' },
    { type: 'dugout', params: [], x: -20, z: -5, note: 'Covered fighting position' },
    { type: 'dugout', params: [], x: -10, z: -5, note: 'Covered fighting position' },
    { type: 'bunker', params: [], x: 0, z: -5, note: 'Command bunker' },
    { type: 'dugout', params: [], x: 10, z: -5, note: 'Covered fighting position' },
    { type: 'dugout', params: [], x: 20, z: -5, note: 'Covered fighting position' },
    { type: 'bunker', params: [], x: -15, z: 5, note: 'Rear bunker' },
    { type: 'bunker', params: [], x: 0, z: 5, note: 'Rear bunker' },
    { type: 'bunker', params: [], x: 15, z: 5, note: 'Rear bunker' },
    { type: 'warehouse', params: [10, 8, 3, 5], x: -30, z: 10, note: 'Supply dump' },
    { type: 'warehouse', params: [10, 8, 3, 94], x: 30, z: 10, note: 'Ammo dump' },
    { type: 'dragonTeeth', params: [10, 9], x: -40, z: -5, note: 'Anti-tank obstacles' },
    { type: 'dragonTeeth', params: [10, 9], x: 40, z: -5, note: 'Anti-tank obstacles' },
    { type: 'dragonTeeth', params: [10, 9], x: -40, z: 10, note: 'Anti-tank obstacles' },
    { type: 'dragonTeeth', params: [10, 9], x: 40, z: 10, note: 'Anti-tank obstacles' },
    { type: 'ruinedBuilding', params: [8, 6, 3, 0.4, 16], x: -25, z: 15, note: 'Burned-out farmhouse' },
    { type: 'ruinedBuilding', params: [6, 6, 2, 0.6, 16], x: 25, z: 15, note: 'Destroyed shed' },
    { type: 'trenches', params: [15, 9], x: -15, z: 25, note: 'Secondary trench' },
    { type: 'trenches', params: [15, 9], x: 15, z: 25, note: 'Secondary trench' },
    { type: 'observationPost', params: [6, 109], x: -25, z: -20, note: 'Forward observation post' },
    { type: 'observationPost', params: [6, 109], x: 25, z: -20, note: 'Forward observation post 2' },
    { type: 'sandbagWall', params: [20, 17], x: -30, z: -15, note: 'Main sandbag wall' },
    { type: 'sandbagWall', params: [20, 17], x: 30, z: -15, note: 'Main sandbag wall 2' },
    { type: 'sandbagWall', params: [15, 17], x: -15, z: 20, note: 'Rear sandbag wall' },
    { type: 'sandbagWall', params: [15, 17], x: 15, z: 20, note: 'Rear sandbag wall 2' },
    { type: 'wheatField', params: [30, 20], x: -50, z: -30, note: 'Wheat field (west)' },
    { type: 'wheatField', params: [30, 20], x: 50, z: -30, note: 'Wheat field (east)' },
    { type: 'bunker', params: [], x: -25, z: 5, note: 'Command bunker' },
    { type: 'bunker', params: [], x: 25, z: 5, note: 'Command bunker 2' }
  ];

  // ═══════════════════════════════════════════════════════════
  // SIEGEMOSCOW
  // ═══════════════════════════════════════════════════════════
  CITIES.siegeMoscow = [
{ type: 'kremlinWall', params: [80, 60, 8], x: 0, z: 0, note: 'Kremlin walls — final showdown location' },
    { type: 'stBasilCathedral', params: [], x: 0, z: 35, note: 'St. Basil’s Cathedral — south end of Red Square' },
    { type: 'stateHistoricalMuseum', params: [12, 8, 4], x: -30, z: 35, note: 'Historical Museum — north of Red Square' },
    { type: 'gumDepartmentStore', params: [12, 8, 4], x: 30, z: 35, note: 'GUM Department Store — east of Red Square' },
    { type: 'leninMausoleum', params: [], x: -15, z: 35, note: 'Lenin Mausoleum — against Kremlin wall' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: -20, z: -10, note: 'Assumption Cathedral — inside Kremlin' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: 0, z: -10, note: 'Archangel Cathedral — inside Kremlin' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: 20, z: -10, note: 'Annunciation Cathedral — inside Kremlin' },
    { type: 'officeBuilding', params: [6, 6, 12], x: -10, z: 5, note: 'Ivan Bell Tower — inside Kremlin' },
    { type: 'officeBuilding', params: [6, 6, 12], x: 10, z: 5, note: 'Tsar Bell Tower — inside Kremlin' },
    { type: 'officeBuilding', params: [14, 10, 5], x: -25, z: 15, note: 'Senate — inside Kremlin' },
    { type: 'officeBuilding', params: [14, 10, 5], x: 25, z: 15, note: 'Presidential Residence — inside Kremlin' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2, 9], x: -50, z: -50, note: 'Moscow high-rise — northwest' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2, 9], x: -25, z: -50, note: 'Moscow high-rise' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2, 9], x: 0, z: -50, note: 'Moscow high-rise' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2, 9], x: 25, z: -50, note: 'Moscow high-rise' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2, 9], x: 50, z: -50, note: 'Moscow high-rise' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.2, 9], x: -50, z: -30, note: 'Moscow apartment — west' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.2, 9], x: 50, z: -30, note: 'Moscow apartment — east' },
    { type: 'lubyankaBuilding', params: [12, 10, 6], x: -50, z: 0, note: 'Lubyanka FSB — northeast of Kremlin' },
    { type: 'officeBuilding', params: [12, 10, 6], x: 50, z: 0, note: 'MVD HQ — east of Kremlin' },
    { type: 'officeBuilding', params: [12, 10, 6], x: -50, z: 20, note: 'Defense Ministry — northwest' },
    { type: 'officeBuilding', params: [12, 10, 6], x: 50, z: 20, note: 'Foreign Ministry — northeast' },
    { type: 'officeBuilding', params: [12, 10, 6], x: -50, z: 40, note: 'State Duma — northwest' },
    { type: 'officeBuilding', params: [12, 10, 6], x: 50, z: 40, note: 'Federation Council — northeast' },
    { type: 'motherlandMonument', params: [], x: 0, z: -60, note: 'Motherland Calls (62m) — Victory Park, prominent final stage landmark' },
    { type: 'monument', params: ["tank"], x: -40, z: 50, note: 'T-14 Armata monument — southwest' },
    { type: 'monument', params: ["tank"], x: 40, z: 50, note: 'T-90 monument — southeast' },
    { type: 'monument', params: ["obelisk"], x: 0, z: 50, note: 'Victory Monument — south of Kremlin' },
    { type: 'bunker', params: [], x: -20, z: 0, note: 'Kremlin nuclear bunker — deep under walls' },
    { type: 'bunker', params: [], x: 20, z: 0, note: 'FSB command bunker — near Lubyanka' },
    { type: 'bunker', params: [], x: -20, z: 25, note: 'Metro-2 secret line — northwest' },
    { type: 'bunker', params: [], x: 20, z: 25, note: 'Metro-2 secret line — northeast' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 1.5], x: -30, z: 50, note: 'Damaged building — southwest approach' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 1.5], x: 30, z: 50, note: 'Damaged building — southeast approach' },
    { type: 'propagandaBillboard', params: [10, 5], x: -35, z: 30, note: 'Propaganda screen (west)' },
    { type: 'propagandaBillboard', params: [10, 5], x: 35, z: 30, note: 'Propaganda screen (east)' },
    { type: 'propagandaBillboard', params: [10, 5], x: -20, z: 45, note: 'Propaganda screen (southwest)' },
    { type: 'propagandaBillboard', params: [10, 5], x: 20, z: 45, note: 'Propaganda screen (southeast)' },
    { type: 'barricade', params: [12], x: -30, z: 40, note: 'Barricade (southwest)' },
    { type: 'barricade', params: [12], x: 30, z: 40, note: 'Barricade (southeast)' },
    { type: 'barricade', params: [12], x: -15, z: 50, note: 'Barricade (south)' },
    { type: 'tankTrap', params: [6], x: -40, z: 45, note: 'Tank traps (southwest)' },
    { type: 'tankTrap', params: [6], x: 40, z: 45, note: 'Tank traps (southeast)' },
    { type: 'tankTrap', params: [6], x: 0, z: 55, note: 'Tank traps (south)' }
  ];

  // ── Road Networks ─────────────────────────────────────────
  const ROADS = {};
  ROADS.hostomel = [
    // Main runway (Antonov Airport — Hostomel's 3500m runway, east-west)
    [[-55,0],[-40,0],[-25,0],[-10,0],[0,0],[10,0],[25,0],[40,0],[55,0]],
    // Parallel taxiway (north of runway)
    [[-50,8],[-35,8],[-20,8],[-5,8],[10,8],[25,8],[40,8],[50,8]],
    // South taxiway (for runway access)
    [[-50,-8],[-35,-8],[-20,-8],[-5,-8],[10,-8],[25,-8],[40,-8],[50,-8]],
    // Terminal apron (main parking area near terminal)
    [[-10,12],[0,12],[10,12],[20,12],[30,12]],
    // Antonov factory access (north of airport, where the An-225 was built)
    [[-20,20],[-20,30],[-20,40],[-20,50]],
    // Perimeter road (follows airport fence, roughly rectangular)
    [[-45,-30],[-45,-15],[-45,0],[-45,15],[-45,30],[-35,40],[-20,45],[0,45],[20,45],[35,40],[45,30],[45,15],[45,0],[45,-15],[45,-30],[35,-40],[20,-45],[0,-45],[-20,-45],[-35,-40],[-45,-30]],
    // Vokzalna St approach (town access from south)
    [[0,-50],[0,-40],[0,-30],[0,-20],[0,-10]],
    // Kyiv–Hostomel highway (Bucha road, northwest approach)
    [[-50,-20],[-40,-15],[-30,-10],[-20,-5],[-10,0]],
    // Irpin river bridge access (southwest)
    [[-30,-50],[-25,-40],[-20,-30],[-15,-20]],
    // Air traffic control tower access spur
    [[30,10],[35,15],[40,20],[42,25]]
  ],
  [
    [[-70, 0], [-60, 0], [-55, 0]],
    [[70, 0], [60, 0], [55, 0]],
    [[-70, 8], [-60, 8], [-50, 8]],
    [[70, 8], [60, 8], [50, 8]],
    [[-70, -30], [-60, -30], [-50, -30]],
    [[70, -30], [60, -30], [50, -30]],
    [[-70, 50], [-60, 50], [-50, 50]],
    [[70, 50], [60, 50], [50, 50]],
    [[0, -60], [0, -55], [0, -50]],
    [[-40, -50], [-35, -45], [-30, -40]]
  ];
  ROADS.avdiivka = [[[-20,-50],[-20,-30],[-20,-10],[-20,10],[-20,30],[-20,50]],[[-50,-10],[-30,-10],[-10,-10],[10,-10],[30,-10],[50,-10]],[[-50,-30],[-30,-30],[-10,-30],[10,-30],[30,-30],[50,-30]],[[-50,20],[-30,20],[-10,20],[10,20],[30,20],[50,20]],[[-40,-40],[-40,-20],[-40,0],[-40,20],[-40,40]],[[40,-40],[40,-20],[40,0],[40,20],[40,40]],[[-20,-10],[-20,10],[0,10],[20,10],[20,-10]],[[-50,-40],[-40,-30],[-30,-20],[-20,-10],[-10,0]],[[10,0],[20,10],[30,20],[40,30],[50,40]],[[-50,40],[-25,40],[0,40],[25,40],[50,40]]];
  ROADS.bakhmut = [
    // H32 highway (Bakhmut–Lysychansk) — main east-west road through city
    [[-55,0],[-40,0],[-25,0],[-10,0],[0,0],[10,0],[25,0],[40,0],[55,0]],
    // Bakhmutovka River (runs north-south, divides city) — road follows riverbank
    [[0,-55],[0,-40],[0,-25],[0,-10],[0,0],[0,10],[0,25],[0,40],[0,55]],
    // River crossing bridges (east-west over Bakhmutovka)
    [[-20,-15],[0,-15],[20,-15]],
    [[-20,15],[0,15],[20,15]],
    // Patrice Lumumba St (north-south, main residential artery)
    [[-25,-50],[-25,-30],[-25,-10],[-25,0],[-25,10],[-25,30],[-25,50]],
    // Levanevskoho St (parallel, east side)
    [[25,-50],[25,-30],[25,-10],[25,0],[25,10],[25,30],[25,50]],
    // Artem St (diagonal, industrial district northeast)
    [[-40,-40],[-30,-30],[-20,-20],[-10,-10],[0,0],[10,10],[20,20],[30,30],[40,40]],
    // Chaykovskoho / market ring (historic center, near city council)
    [[-10,-10],[-5,-5],[0,0],[5,-5],[10,-10],[5,-15],[0,-20],[-5,-15],[-10,-10]],
    // Eastern industrial access (towards Soledar)
    [[40,-30],[45,-20],[50,-10],[55,0],[50,10],[45,20],[40,30]],
    // Southern approach (Kramatorsk road)
    [[0,40],[0,50],[0,60]]
  ],
  [
    [[-70, 0], [-60, 0], [-55, 0]],
    [[70, 0], [60, 0], [55, 0]],
    [[0, -70], [0, -60], [0, -55]],
    [[0, 70], [0, 60], [0, 55]],
    [[-70, -30], [-60, -30], [-50, -30]],
    [[70, -30], [60, -30], [50, -30]],
    [[-70, 30], [-60, 30], [-50, 30]],
    [[70, 30], [60, 30], [50, 30]],
    [[-70, -50], [-60, -50], [-50, -50]],
    [[70, -50], [60, -50], [50, -50]]
  ];
  ROADS.kherson = [[[-50,-25],[-30,-25],[-10,-25],[10,-25],[30,-25],[50,-25]],[[-20,-50],[-20,-30],[-20,-10],[-20,10],[-20,30],[-20,50]],[[20,-50],[20,-30],[20,-10],[20,10],[20,30],[20,50]],[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[-50,-15],[-30,-15],[-10,-15],[10,-15],[30,-15],[50,-15]],[[-50,15],[-30,15],[-10,15],[10,15],[30,15],[50,15]],[[-50,-35],[-30,-35],[-10,-35],[10,-35],[30,-35]],[[-30,35],[-10,35],[10,35],[30,35],[50,35]],[[-50,-50],[-30,-30],[-10,-10],[10,10],[30,30],[50,50]],[[50,-50],[30,-30],[10,-10],[-10,10],[-30,30],[-50,50]]];
  ROADS.mariupol = [
    // Azovstal steelworks main east-west internal road (works transport)
    [[-50,0],[-35,0],[-20,0],[-5,0],[10,0],[25,0],[40,0],[50,0]],
    // North-south internal plant road (crosses the main east-west)
    [[0,-50],[0,-35],[0,-20],[0,-5],[0,10],[0,25],[0,40],[0,50]],
    // Port access road — leads south to Sea of Azov
    [[-20,30],[-18,40],[-15,50],[-12,60]],
    // Coastal highway (Mariupol–Berdyansk, runs east-west along shore)
    [[-50,55],[-30,55],[-10,55],[10,55],[30,55],[50,55]],
    // Kalmius River crossing (north of steelworks)
    [[-50,-25],[-30,-25],[-10,-25],[10,-25],[30,-25],[50,-25]],
    // M14 highway (Dnipro–Mariupol) — approaches from north
    [[0,-55],[0,-45],[0,-35],[0,-25]],
    // Factory rail siding (straight industrial spur)
    [[-40,-15],[-30,-15],[-20,-15],[-10,-15],[0,-15],[10,-15],[20,-15],[30,-15],[40,-15]],
    // Residential access (Levoberezhny district)
    [[-35,25],[-25,30],[-15,35],[-5,40]],
    // Central city market ring (historic center near Drama Theatre)
    [[-15,-15],[-10,-10],[-5,-5],[0,0],[-5,5],[-10,10],[-15,15],[-20,10],[-25,5],[-30,0],[-25,-5],[-20,-10],[-15,-15]],
    // Steelworks loading dock spur (west side)
    [[-45,-5],[-45,5],[-45,15],[-45,25]]
  ],
  [
    [[-70, 0], [-60, 0], [-55, 0]],
    [[70, 0], [60, 0], [55, 0]],
    [[-70, 55], [-60, 55], [-50, 55]],
    [[70, 55], [60, 55], [50, 55]],
    [[-70, -25], [-60, -25], [-50, -25]],
    [[70, -25], [60, -25], [50, -25]],
    [[-70, -55], [-60, -55], [-50, -55]],
    [[70, -55], [60, -55], [50, -55]],
    [[0, 65], [0, 60], [0, 55]],
    [[-30, 65], [-25, 60], [-20, 55]]
  ];
  ROADS.crimea = [[[-50,0],[-40,0],[-30,0],[-20,0]],[[20,0],[30,0],[40,0],[50,0]],[[-50,-20],[-40,-20],[-30,-20],[-20,-20]],[[-50,20],[-40,20],[-30,20],[-20,20]],[[20,-20],[30,-20],[40,-20],[50,-20]],[[20,20],[30,20],[40,20],[50,20]],[[-50,-10],[-40,-10],[-30,-10]],[[30,-10],[40,-10],[50,-10]],[[-45,-15],[-45,0],[-45,15]],[[45,-15],[45,0],[45,15]]],
[[-70, -30], [-60, -20], [-50, -10]],
[[70, -30], [60, -20], [50, -10]],
[[-70, 30], [-60, 20], [-50, 10]],
[[70, 30], [60, 20], [50, 10]],
[[-70, -50], [-60, -40], [-50, -30]],
[[70, -50], [60, -40], [50, -30]],
[[-70, 50], [-60, 40], [-50, 30]],
[[70, 50], [60, 40], [50, 30]],
[[-60, -40], [-50, -30], [-40, -20]],
  ROADS.chornobyl = [
    // Pripyat central avenue (Lenina Prospekt) — main east-west through ghost city
    [[-55,0],[-40,0],[-25,0],[-10,0],[0,0],[10,0],[25,0],[40,0],[55,0]],
    // Kurchatova St — north-south (to the NPP, reactor access road)
    [[0,-55],[0,-40],[0,-25],[0,-10],[0,0],[0,10],[0,25],[0,40],[0,55]],
    // Duga radar access road (northeast, leading to the steel over-the-horizon array)
    [[40,40],[45,35],[50,30],[55,25],[60,20],[65,15],[70,10]],
    // Pripyat northern road (to the NPP, past the Jupiter factory)
    [[-30,-40],[-20,-45],[-10,-50],[0,-52],[10,-50],[20,-45],[30,-40]],
    // Southern forest road (Red Forest edge, radiation zone perimeter)
    [[-50,40],[-35,45],[-20,48],[0,50],[20,48],[35,45],[50,40]],
    // Eastern approach (Kyiv–Chernobyl highway, P-02)
    [[-55,-20],[-45,-25],[-35,-30],[-25,-35],[-15,-40]],
    // Western approach (Belarus border, abandoned checkpoint road)
    [[55,-20],[45,-25],[35,-30],[25,-35],[15,-40]],
    // Stadium "Avanhard" access (northwest Pripyat)
    [[-40,-10],[-35,-5],[-30,0],[-25,5],[-20,10]],
    // Palace of Culture "Energetik" ring (central Pripyat plaza)
    [[-5,-5],[0,-8],[5,-5],[8,0],[5,5],[0,8],[-5,5],[-8,0],[-5,-5]],
    // Chernobyl-2 military town access (Duga workers' settlement)
    [[55,10],[60,15],[65,20],[70,25]]
  ],
  [
    [[-70, -70], [-60, -70], [-50, -70]],
    [[70, -70], [60, -70], [50, -70]],
    [[-70, 70], [-60, 70], [-50, 70]],
    [[70, 70], [60, 70], [50, 70]],
    [[-70, -40], [-60, -40], [-50, -40]],
    [[70, -40], [60, -40], [50, -40]],
    [[-70, 40], [-60, 40], [-50, 40]],
    [[70, 40], [60, 40], [50, 40]],
    [[-70, 0], [-60, 0], [-50, 0]],
    [[70, 0], [60, 0], [50, 0]]
  ];
  ROADS.moscow = [
    // Tverskaya — main north-south spine (Red Square to Belorussky)
    [[0,-55],[0,-40],[0,-25],[0,-10],[0,0],[0,10],[0,25],[0,40],[0,55]],
    // Garden Ring (Sadovoye Koltso) — circular boulevard around center
    [[-40,-40],[-30,-48],[-15,-52],[0,-54],[15,-52],[30,-48],[40,-40],[48,-30],[52,-15],[54,0],[52,15],[48,30],[40,40],[30,48],[15,52],[0,54],[-15,52],[-30,48],[-40,40],[-48,30],[-52,15],[-54,0],[-52,-15],[-48,-30],[-40,-40]],
    // Arbat — historic west-east diagonal (Old Arbat)
    [[-45,-15],[-35,-10],[-25,-5],[-15,0],[-5,5],[5,10],[15,15],[25,20],[35,25]],
    // Novy Arbat — parallel modern avenue
    [[-45,-25],[-35,-20],[-25,-15],[-15,-10],[-5,-5],[5,0],[15,5],[25,10],[35,15]],
    // Kutuzovsky Prospekt — westward (Moscow's Champs-Élysées)
    [[-50,-20],[-40,-20],[-30,-20],[-20,-20],[-10,-20],[0,-20],[10,-20],[20,-20],[30,-20],[40,-20],[50,-20]],
    // Leningradsky Prospekt — northwest radial
    [[-35,-35],[-25,-30],[-15,-25],[-5,-20],[0,-15],[5,-10]],
    // Taganskaya / Volgogradsky — southeast radial
    [[35,35],[25,30],[15,25],[5,20],[0,15],[-5,10]],
    // Ostozhenka — south-west cultural district
    [[-30,20],[-20,25],[-10,30],[0,35],[10,40],[20,45]],
    // MKAD segment (Moscow Ring Road) — outer ring partial
    [[-55,-30],[-50,-40],[-40,-50],[-30,-55]],
    // Sparrow Hills access (Vorobyovy Gory) — southwest
    [[-50,50],[-45,55],[-40,60],[-35,65]]
  ],
  [
    [[-70, -30], [-60, -20], [-55, -10]],
    [[70, -30], [60, -20], [55, -10]],
    [[-70, 30], [-60, 20], [-55, 10]],
    [[70, 30], [60, 20], [55, 10]],
    [[-70, -50], [-60, -40], [-55, -30]],
    [[70, -50], [60, -40], [55, -30]],
    [[-70, 50], [-60, 40], [-55, 30]],
    [[70, 50], [60, 40], [55, 30]],
    [[-70, 0], [-60, 0], [-55, 0]],
    [[70, 0], [60, 0], [55, 0]]
  ];
  ROADS.sevastopol = [[[-50,-50],[-30,-50],[-10,-50],[10,-50],[30,-50],[50,-50]],[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[-50,-30],[-30,-30],[-10,-30],[10,-30],[30,-30],[50,-30]],[[-50,30],[-30,30],[-10,30],[10,30],[30,30],[50,30]],[[-50,-50],[-50,-30],[-50,-10],[-50,10],[-50,30],[-50,50]],[[50,-50],[50,-30],[50,-10],[50,10],[50,30],[50,50]],[[-30,-20],[-30,0],[-30,20],[-10,20],[10,20],[30,20]],[[-40,-40],[-20,-40],[0,-40],[20,-40],[40,-40]],[[-40,40],[-20,40],[0,40],[20,40],[40,40]],[[-50,-10],[-30,-10],[-10,-10],[10,-10],[30,-10],[50,-10]]],
[[-70, -50], [-60, -50], [-50, -50]],
[[70, -50], [60, -50], [50, -50]],
[[-70, 70], [-60, 70], [-50, 70]],
[[70, 70], [60, 70], [50, 70]],
[[-70, -20], [-60, -20], [-50, -20]],
[[70, -20], [60, -20], [50, -20]],
[[-70, 0], [-60, 0], [-50, 0]],
[[70, 0], [60, 0], [50, 0]],
[[-70, 20], [-60, 20], [-50, 20]],
  ROADS.donbas = [[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[-50,-20],[-25,-20],[0,-20],[25,-20],[50,-20]],[[-50,20],[-25,20],[0,20],[25,20],[50,20]],[[-50,-50],[-50,-25],[-50,0],[-50,25],[-50,50]],[[50,-50],[50,-25],[50,0],[50,25],[50,50]],[[-40,-40],[-40,-20],[-40,0],[-40,20],[-40,40]],[[40,-40],[40,-20],[40,0],[40,20],[40,40]],[[-50,-50],[-25,-25],[0,0],[25,25],[50,50]],[[50,-50],[25,-25],[0,0],[-25,25],[-50,50]]],
[[-70, -40], [-60, -30], [-50, -20]],
[[70, -40], [60, -30], [50, -20]],
[[-70, 40], [-60, 30], [-50, 20]],
[[70, 40], [60, 30], [50, 20]],
[[-70, -60], [-60, -50], [-50, -40]],
[[70, -60], [60, -50], [50, -40]],
[[-70, 60], [-60, 50], [-50, 40]],
[[70, 60], [60, 50], [50, 40]],
[[-70, 0], [-60, 0], [-50, 0]],
  ROADS.belgorod = [[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[-50,-20],[-25,-20],[0,-20],[25,-20],[50,-20]],[[-50,20],[-25,20],[0,20],[25,20],[50,20]],[[-50,-50],[-50,-25],[-50,0],[-50,25],[-50,50]],[[50,-50],[50,-25],[50,0],[50,25],[50,50]],[[-30,-40],[-10,-40],[10,-40],[30,-40]],[[-30,40],[-10,40],[10,40],[30,40]],[[-50,-50],[-25,-25],[0,0],[25,25],[50,50]],[[50,-50],[25,-25],[0,0],[-25,25],[-50,50]]],
[[-70, -30], [-60, -20], [-50, -10]],
[[70, -30], [60, -20], [50, -10]],
[[-70, 30], [-60, 20], [-50, 10]],
[[70, 30], [60, 20], [50, 10]],
[[-70, -50], [-60, -40], [-50, -30]],
[[70, -50], [60, -40], [50, -30]],
[[-70, 50], [-60, 40], [-50, 30]],
[[70, 50], [60, 40], [50, 30]],
[[-70, 0], [-60, 0], [-50, 0]],
  ROADS.kremlin = [
    // Red Square perimeter (rectangle around the square, south of Kremlin wall)
    [[-20,-20],[-20,-10],[-20,0],[-20,10],[-20,20]],
    [[20,-20],[20,-10],[20,0],[20,10],[20,20]],
    [[-20,-20],[-10,-20],[0,-20],[10,-20],[20,-20]],
    [[-20,20],[-10,20],[0,20],[10,20],[20,20]],
    // Kremlin wall inner ring (cathedral square, internal Kremlin roads)
    [[-15,-15],[-15,-5],[-15,5],[-15,15]],
    [[15,-15],[15,-5],[15,5],[15,15]],
    [[-15,-15],[-5,-15],[5,-15],[15,-15]],
    [[-15,15],[-5,15],[5,15],[15,15]],
    // Kitay-gorod wall road (outer ring, medieval merchant quarter)
    [[-35,-35],[-35,-20],[-35,0],[-35,20],[-35,35]],
    [[35,-35],[35,-20],[35,0],[35,20],[35,35]],
    [[-35,-35],[-20,-35],[0,-35],[20,-35],[35,-35]],
    [[-35,35],[-20,35],[0,35],[20,35],[35,35]],
    // Tverskaya approach (main road to Red Square, north)
    [[0,-50],[0,-40],[0,-30],[0,-20],[0,-10]],
    // Volkhonka / Znamenka (southwest approach, toward Moscow River)
    [[-25,-35],[-20,-25],[-15,-15],[-10,-10],[-5,-5]],
    // Varvarka St (east of Kremlin, Kitay-gorod merchant street)
    [[25,-35],[20,-25],[15,-15],[10,-10],[5,-5]],
    // Bol'shaya Ordynka (southern approach)
    [[0,30],[0,40],[0,50]],
    // Moskvoretskaya embankment (along the river, south)
    [[-40,50],[-20,50],[0,50],[20,50],[40,50]]
  ],
  [
    [[-70, -50], [-60, -40], [-50, -30]],
    [[70, -50], [60, -40], [50, -30]],
    [[-70, 50], [-60, 40], [-50, 30]],
    [[70, 50], [60, 40], [50, 30]],
    [[-70, -20], [-60, -20], [-50, -20]],
    [[70, -20], [60, -20], [50, -20]],
    [[-70, 20], [-60, 20], [-50, 20]],
    [[70, 20], [60, 20], [50, 20]],
    [[-70, -50], [-70, 0], [-70, 50]],
    [[70, -50], [70, 0], [70, 50]]
  ];
  ROADS.kyiv = [
    // Khreshchatyk — main east-west avenue (wide boulevard)
    [[-55,0],[-40,0],[-25,0],[-10,0],[0,0],[10,0],[25,0],[40,0],[55,0]],
    // Maidan Nezalezhnosti — ring around Independence Square
    [[-12,-12],[-8,-15],[0,-16],[8,-15],[12,-12],[15,-8],[16,0],[15,8],[12,12],[8,15],[0,16],[-8,15],[-12,12],[-15,8],[-16,0],[-15,-8],[-12,-12]],
    // Volodymyrska — north-south arterial (left of Maidan)
    [[-20,-50],[-20,-30],[-20,-10],[-20,0],[-20,10],[-20,30],[-20,50]],
    // Instytutska — north-south (right of Maidan, leads to Govt quarter)
    [[20,-50],[20,-30],[20,-10],[20,0],[20,10],[20,30],[20,50]],
    // Hrushevskoho — east-west south of Maidan (govt district)
    [[-50,15],[-30,15],[-10,15],[0,15],[10,15],[30,15],[50,15]],
    // Lavra hill access — winding road up to Pechersk Lavra (southeast)
    [[30,30],[35,25],[38,18],[40,10],[42,0],[40,-10],[38,-20],[35,-30]],
    // Dnipro river embankment — south edge
    [[-50,55],[-30,55],[-10,55],[0,55],[10,55],[30,55],[50,55]],
    // Metro bridge approach (north-south overpass)
    [[0,30],[0,40],[0,50],[0,55]],
    // Bessarabska Square — small diagonal market area
    [[-10,30],[-5,25],[0,20],[5,15]],
    // Arsenalna (world\'s deepest metro) — south of Lavra
    [[30,-40],[30,-30],[30,-20],[35,-15],[40,-10]]
  ],
  [
    // Edge spurs extending outward
    [[-70,0],[-60,0],[-55,0]],
    [[55,0],[60,0],[70,0]],
    [[-70,15],[-60,15],[-50,15]],
    [[70,15],[60,15],[50,15]],
    [[-20,-60],[-20,-50],[-20,-40]],
    [[20,-60],[20,-50],[20,-40]],
    [[-20,60],[-20,50],[-20,40]],
    [[20,60],[20,50],[20,40]],
    [[30,60],[35,50],[38,40]],
    [[-50,65],[-30,65],[-10,65]]
  ];
  ROADS.snakeIsland = [[[-10,0],[0,0],[10,0]],[[0,-10],[0,0],[0,10]],[[-8,-8],[0,0],[8,8]],[[8,-8],[0,0],[-8,8]],[[-5,-5],[5,-5]],[[-5,5],[5,5]],[[-5,-5],[-5,5]],[[5,-5],[5,5]],[[-10,-5],[-10,5]],[[10,-5],[10,5]]],
[[-15, -5], [-10, 0], [-5, 5]],
[[15, -5], [10, 0], [5, 5]],
[[-15, 5], [-10, 0], [-5, -5]],
[[15, 5], [10, 0], [5, -5]],
[[-12, -12], [-6, -6], [0, 0]],
[[12, -12], [6, -6], [0, 0]],
[[-12, 12], [-6, 6], [0, 0]],
[[12, 12], [6, 6], [0, 0]],
[[-5, -15], [0, -10], [5, -5]],
  ROADS.saky = [[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[-50,-30],[-25,-30],[0,-30],[25,-30],[50,-30]],[[-50,30],[-25,30],[0,30],[25,30],[50,30]],[[-50,-50],[-50,-25],[-50,0],[-50,25],[-50,50]],[[50,-50],[50,-25],[50,0],[50,25],[50,50]],[[-30,-20],[-30,0],[-30,20]],[[30,-20],[30,0],[30,20]],[[-20,20],[0,20],[20,20]],[[-15,-15],[0,-15],[15,-15]]],
[[-70, -50], [-60, -40], [-50, -30]],
[[70, -50], [60, -40], [50, -30]],
[[-70, 50], [-60, 40], [-50, 30]],
[[70, 50], [60, 40], [50, 30]],
[[-70, -20], [-60, -20], [-50, -20]],
[[70, -20], [60, -20], [50, -20]],
[[-70, 20], [-60, 20], [-50, 20]],
[[70, 20], [60, 20], [50, 20]],
[[-70, 0], [-60, 0], [-50, 0]],
  ROADS.vuhledar = [[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[-50,-20],[-25,-20],[0,-20],[25,-20],[50,-20]],[[-50,20],[-25,20],[0,20],[25,20],[50,20]],[[-50,-50],[-50,-25],[-50,0],[-50,25],[-50,50]],[[50,-50],[50,-25],[50,0],[50,25],[50,50]],[[-30,-40],[-30,-20],[-30,0],[-30,20]],[[30,-40],[30,-20],[30,0],[30,20]],[[-50,-50],[-25,-25],[0,0],[25,25],[50,50]],[[50,-50],[25,-25],[0,0],[-25,25],[-50,50]]],
[[-70, -40], [-60, -30], [-50, -20]],
[[70, -40], [60, -30], [50, -20]],
[[-70, 40], [-60, 30], [-50, 20]],
[[70, 40], [60, 30], [50, 20]],
[[-70, -60], [-60, -50], [-50, -40]],
[[70, -60], [60, -50], [50, -40]],
[[-70, 60], [-60, 50], [-50, 40]],
[[70, 60], [60, 50], [50, 40]],
[[-70, 0], [-60, 0], [-50, 0]],
  ROADS.antonov = [[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[-50,-20],[-30,-20],[-10,-20],[0,-20]],[[0,-20],[10,-20],[30,-20],[50,-20]],[[-50,0],[-50,-20],[-50,-40]],[[50,0],[50,-20],[50,-40]],[[-50,-30],[-30,-30],[-10,-30]],[[10,-30],[30,-30],[50,-30]],[[-40,10],[-40,30],[-40,50]],[[40,10],[40,30],[40,50]],[[-20,-10],[-20,10],[-20,30]]],
[[-70, -30], [-60, -20], [-50, -10]],
[[70, -30], [60, -20], [50, -10]],
[[-70, 30], [-60, 20], [-50, 10]],
[[70, 30], [60, 20], [50, 10]],
[[-70, -50], [-60, -40], [-50, -30]],
[[70, -50], [60, -40], [50, -30]],
[[-70, 50], [-60, 40], [-50, 30]],
[[70, 50], [60, 40], [50, 30]],
[[-70, 0], [-60, 0], [-50, 0]],
  ROADS.refinery = [[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[-50,-30],[-25,-30],[0,-30],[25,-30],[50,-30]],[[-50,30],[-25,30],[0,30],[25,30],[50,30]],[[-50,-50],[-50,-25],[-50,0],[-50,25],[-50,50]],[[50,-50],[50,-25],[50,0],[50,25],[50,50]],[[-30,-20],[-30,0],[-30,20]],[[30,-20],[30,0],[30,20]],[[-20,20],[0,20],[20,20]],[[-20,-20],[0,-20],[20,-20]]],
[[-70, -50], [-60, -40], [-50, -30]],
[[70, -50], [60, -40], [50, -30]],
[[-70, 50], [-60, 40], [-50, 30]],
[[70, 50], [60, 40], [50, 30]],
[[-70, -20], [-60, -20], [-50, -20]],
[[70, -20], [60, -20], [50, -20]],
[[-70, 20], [-60, 20], [-50, 20]],
[[70, 20], [60, 20], [50, 20]],
[[-70, 0], [-60, 0], [-50, 0]],
  ROADS.treeline = [
    // Main east-west rural road (gravel farm track, approaches the treeline)
    [[-55, -20], [-40, -20], [-25, -20], [-10, -20], [0, -20], [10, -20], [25, -20], [40, -20], [55, -20]],
    // North-south logging trail (cuts through the tree line)
    [[0, -40], [0, -30], [0, -20], [0, -10], [0, 0], [0, 10], [0, 20], [0, 30]],
    // Access track to dragon's teeth line (perpendicular to treeline)
    [[-20, -5], [-10, 0], [0, 5], [10, 10], [20, 15]],
    // Dugout access path (zigzag to fighting positions)
    [[-25, 10], [-20, 12], [-15, 15], [-10, 18], [-5, 20]],
    [[5, 20], [10, 18], [15, 15], [20, 12], [25, 10]],
    // Farm track (south of wheat field, parallel to main road)
    [[-50, -35], [-35, -35], [-20, -35], [-5, -35], [10, -35], [25, -35], [40, -35], [50, -35]],
    // Forward observation post track (angled toward enemy line)
    [[-30, -10], [-20, 0], [-10, 10], [0, 20], [10, 30]],
    // Supply truck fallback route (curved, away from direct fire)
    [[30, -10], [35, 0], [40, 10], [45, 20], [50, 30]],
    // Artillery battery access (spur from logging trail)
    [[-15, 30], [-10, 35], [-5, 40], [0, 45]],
    // Perimeter patrol path (follows edge of treeline)
    [[-40, -4], [-30, -3], [-20, -2], [-10, -1], [0, 0], [10, -1], [20, -2], [30, -3], [40, -4]]
  ],
  [
    [[-65, -20], [-60, -20], [-55, -20]],
    [[65, -20], [60, -20], [55, -20]],
    [[0, -50], [0, -45], [0, -40]],
    [[0, 40], [0, 45], [0, 50]],
    [[-50, -50], [-40, -45], [-30, -40]],
    [[50, -50], [40, -45], [30, -40]],
    [[-50, 50], [-40, 45], [-30, 40]],
    [[50, 50], [40, 45], [30, 40]],
    [[-40, 0], [-20, 0], [0, 0]],
    [[40, 0], [20, 0], [0, 0]]
  ];
  ROADS.siegeMoscow = [[[0,-60],[0,-40],[0,-20],[0,0],[0,20],[0,40],[0,60]],[[-60,0],[-40,0],[-20,0],[0,0],[20,0],[40,0],[60,0]],[[0,-60],[-10,-50],[-20,-40],[-30,-30]],[[-30,-30],[-30,0],[-30,30],[0,30],[30,30],[30,0],[30,-30],[0,-30]],[[-50,-50],[-50,0],[-50,50],[0,50],[50,50],[50,0],[50,-50],[0,-50]],[[-60,-40],[-30,-40],[0,-40],[30,-40],[60,-40]],[[-60,40],[-30,40],[0,40],[30,40],[60,40]],[[-40,-60],[-40,-30],[-40,0],[-40,30],[-40,60]],[[40,-60],[40,-30],[40,0],[40,30],[40,60]],[[-60,-60],[-60,0],[-60,60],[0,60],[60,60],[60,0],[60,-60],[0,-60]]];

  // ── Map stage names to city keys ──────────────────────────
  const STAGE_MAP = { HOSTOMEL:'hostomel', AVDIIVKA:'avdiivka', BAKHMUT:'bakhmut', KHERSON:'kherson', MARIUPOL:'mariupol', CRIMEA:'crimea', CHORNOBYL:'chornobyl', MOSCOW:'moscow', SEVASTOPOL:'sevastopol', DONBAS:'donbas', BELGOROD:'belgorod', KREMLIN:'kremlin', KYIV:'kyiv', SNAKE:'snakeIsland', SAKY:'saky', VUHLEDAR:'vuhledar', ANTONOV:'antonov', REFINERY:'refinery', TREELINE:'treeline', SIEGE:'siegeMoscow' };

  // Stub for wrecked BTR vehicles used in treeline/urban missions
  function generateWreckedBTR(x, z) {
    if (typeof setBlock === 'undefined') return;
    var gy = (typeof getTerrainHeight === 'function') ? getTerrainHeight(x, z) : 0;
    var h = 3, w = 5, d = 3;
    var color = PAL.RUST || PAL.BRICK;
    for (var bx = 0; bx < w; bx++) {
      for (var bz = 0; bz < d; bz++) {
        for (var by = 0; by < h; by++) {
          if (bx === 0 || bx === w-1 || bz === 0 || bz === d-1 || by === h-1 || by === 0) {
            setBlock(x + bx, gy + by, z + bz, color);
          }
        }
      }
    }
    // Wheels
    setBlock(x, gy, z + 1, PAL.METAL_DARK);
    setBlock(x + w - 1, gy, z + 1, PAL.METAL_DARK);
  }

function fuelStorageTank(gx, gy, gz, scale) {
    var r = 4 * scale, h = 10 * scale;
    for (var y = 0; y <= h; y++) {
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r) {
            if (y === 0 || y === h || x*x + z*z >= (r-1)*(r-1)) {
              setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
            }
          }
        }
      }
    }
    setBlock(gx, gy + h + 1, gz, BLOCK.RUBBLE);
  }

  function fireStation(gx, gy, gz, scale) {
    var w = 6 * scale, d = 4 * scale, h = 5 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var y = 0; y <= h + 4 * scale; y++) {
      setBlock(gx, gy + y, gz - d - 1, BLOCK.BRICK);
    }
    setBlock(gx + 1, gy + h + 4 * scale, gz - d - 1, BLOCK.BRICK);
    setBlock(gx - 1, gy + h + 4 * scale, gz - d - 1, BLOCK.BRICK);
  }

  function parkingGarage(gx, gy, gz, scale) {
    var w = 8 * scale, d = 6 * scale, h = 4 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (y === 0 || y === h || Math.abs(x) === w || Math.abs(z) === d) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
          }
          if (y % 2 === 0 && (Math.abs(x) < w && Math.abs(z) < d)) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
          }
        }
      }
    }
    for (var z = -d; z <= d; z++) {
      setBlock(gx + w + 1, gy, gz + z, BLOCK.ASPHALT);
    }
  }

  function aircraftMonument(gx, gy, gz, scale) {
    for (var x = -5 * scale; x <= 5 * scale; x++) {
      setBlock(gx + x, gy + 1 + Math.abs(x) * 0.5, gz, BLOCK.STEEL);
    }
    setBlock(gx - 3 * scale, gy + 2, gz + 2, BLOCK.STEEL);
    setBlock(gx - 3 * scale, gy + 2, gz - 2, BLOCK.STEEL);
    setBlock(gx + 3 * scale, gy + 2, gz + 2, BLOCK.STEEL);
    setBlock(gx + 3 * scale, gy + 2, gz - 2, BLOCK.STEEL);
    setBlock(gx, gy + 5, gz, BLOCK.STEEL);
    for (var y = 0; y <= 8 * scale; y++) {
      setBlock(gx, gy + y, gz, BLOCK.BRICK);
    }
  }

  function radarDome(gx, gy, gz, scale) {
    var r = 5 * scale;
    for (var y = 0; y <= r; y++) {
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + y*y + z*z <= r*r && x*x + y*y + z*z >= (r-1)*(r-1)) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
          }
        }
      }
    }
    for (var y = 0; y <= 3 * scale; y++) {
      setBlock(gx, gy + y, gz, BLOCK.BRICK);
    }
  }

  function independenceMonument(gx, gy, gz, scale) {
    // Real: 62m tall white marble column with golden Berehynia statue
    // Based on Maidan Nezalezhnosti, Kyiv
    var colH = 16 * scale; // tall column
    var baseR = 3 * scale;
    var colR = 1 * scale;
    
    // Stepped marble base (Zaborovsky gate inspired)
    for (var by = 0; by < 3 * scale; by++) {
      var br = baseR - Math.floor(by / scale);
      for (var x = -br; x <= br; x++) {
        for (var z = -br; z <= br; z++) {
          setBlock(gx + x, gy + by, gz + z, PAL.STONE_MARBLE);
        }
      }
    }
    
    // White marble column (tapered slightly)
    for (var y = 3 * scale; y < colH; y++) {
      var taper = (y > colH - 2 * scale) ? 1 : 0;
      var r = colR - taper;
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r + 1) {
            setBlock(gx + x, gy + y, gz + z, PAL.STONE_MARBLE);
          }
        }
      }
      // Decorative rings every 4 blocks
      if (y % (4 * scale) === 0 && y > 3 * scale) {
        for (var x = -r-1; x <= r+1; x++) {
          for (var z = -r-1; z <= r+1; z++) {
            if (x*x + z*z <= (r+1)*(r+1) + 1) {
              setBlock(gx + x, gy + y, gz + z, PAL.STONE_MARBLE);
            }
          }
        }
      }
    }
    
    // Golden Berehynia statue (winged female figure with guelder-rose branch)
    var sy = gy + colH;
    // Statue body
    for (var y = 0; y < 3 * scale; y++) {
      var sr = (y < scale) ? 2 : 1;
      for (var x = -sr; x <= sr; x++) {
        for (var z = -sr; z <= sr; z++) {
          setBlock(gx + x, sy + y, gz + z, PAL.METAL_COPPER); // gold/copper color
        }
      }
    }
    // Raised arms with branch
    setBlock(gx - 2, sy + 1, gz, PAL.METAL_COPPER);
    setBlock(gx - 3, sy + 2, gz, PAL.METAL_COPPER);
    setBlock(gx + 2, sy + 1, gz, PAL.METAL_COPPER);
    setBlock(gx + 3, sy + 2, gz, PAL.METAL_COPPER);
    // Wings
    setBlock(gx - 1, sy + 2, gz + 1, PAL.METAL_COPPER);
    setBlock(gx + 1, sy + 2, gz + 1, PAL.METAL_COPPER);
    setBlock(gx - 1, sy + 2, gz - 1, PAL.METAL_COPPER);
    setBlock(gx + 1, sy + 2, gz - 1, PAL.METAL_COPPER);
    
    // Globe base under statue
    for (var x = -2; x <= 2; x++) {
      for (var z = -2; z <= 2; z++) {
        if (x*x + z*z <= 5) {
          setBlock(gx + x, sy, gz + z, PAL.STONE_MARBLE);
        }
      }
    }
    
    // Uplighting at base (small light blocks)
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var lx = Math.round(Math.cos(angle) * (baseR + 1));
      var lz = Math.round(Math.sin(angle) * (baseR + 1));
      setBlock(gx + lx, gy + 1, gz + lz, PAL.LIGHT);
    }
  }

  function goldenGate(gx, gy, gz, scale) {
    for (var y = 0; y <= 10 * scale; y++) {
      setBlock(gx - 3 * scale, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 3 * scale, gy + y, gz, BLOCK.BRICK);
    }
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      setBlock(gx + x, gy + 10 * scale, gz, BLOCK.BRICK);
    }
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      setBlock(gx + x, gy + 8 * scale, gz, BLOCK.BRICK);
    }
    for (var y = 0; y <= 6 * scale; y++) {
      setBlock(gx - 3 * scale, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx + 3 * scale, gy + y, gz + 1, BLOCK.BRICK);
    }
  }

  function governmentHouse(gx, gy, gz, scale) {
    var w = 7 * scale, d = 4 * scale, h = 6 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
          if (y === Math.floor(h/2) && Math.abs(x) < w) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.WOOD);
          }
        }
      }
    }
    for (var x = -1; x <= 1; x++) {
      for (var z = -d - 1; z <= d + 1; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
  }

  function olympicStadium(gx, gy, gz, scale) {
    var r = 12 * scale, h = 3 * scale;
    for (var y = 0; y <= h; y++) {
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r && x*x + z*z >= (r-2)*(r-2)) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
          }
          if (x*x + z*z < (r-2)*(r-2) && y === 0) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.ASPHALT);
          }
        }
      }
    }
    for (var y = 0; y <= h + 2 * scale; y++) {
      setBlock(gx - r + 2, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + r - 2, gy + y, gz, BLOCK.BRICK);
    }
  }

  function embankmentBuilding(gx, gy, gz, scale) {
    var w = 5 * scale, d = 3 * scale, h = 7 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy + 1, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function spasskayaTower(gx, gy, gz, scale) {
    // Real: Spasskaya Tower, Kremlin, Moscow - 71m tall, red star, clock
    // Red brick body with white stone details, clock face, red star on top
    var h = 16 * scale;
    for (var y = 0; y <= h; y++) {
      var r = (y > 12 * scale) ? 2 : 1;
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          var isWhite = (y === 0 || y === h || y === 8 * scale || y === 12 * scale || Math.abs(x) === r || Math.abs(z) === r);
          setBlock(gx + x, gy + y, gz + z, isWhite ? PAL.STONE_MARBLE : PAL.BRICK_RED);
        }
      }
    }
    // Clock face (white circle with gold details)
    for (var x = -1; x <= 1; x++) {
      for (var z = -1; z <= 1; z++) {
        setBlock(gx + x, gy + 9 * scale, gz + z, PAL.STONE_MARBLE);
      }
    }
    setBlock(gx, gy + 9 * scale, gz + 2, PAL.METAL_COPPER); // clock hands
    // Upper tier (wider)
    for (var y = 12 * scale; y <= h; y++) {
      for (var x = -2; x <= 2; x++) {
        for (var z = -2; z <= 2; z++) {
          if (Math.abs(x) === 2 || Math.abs(z) === 2 || y === h) {
            setBlock(gx + x, gy + y, gz + z, PAL.BRICK_RED);
          }
        }
      }
    }
    // Red star on top
    setBlock(gx, gy + h + 1, gz, PAL.METAL_COPPER);
    setBlock(gx + 1, gy + h + 1, gz, PAL.METAL_COPPER);
    setBlock(gx - 1, gy + h + 1, gz, PAL.METAL_COPPER);
    setBlock(gx, gy + h + 1, gz + 1, PAL.METAL_COPPER);
    setBlock(gx, gy + h + 1, gz - 1, PAL.METAL_COPPER);
    setBlock(gx, gy + h + 2, gz, PAL.METAL_COPPER);
  }

  function gumDepartmentStore(gx, gy, gz, scale) {
    var w = 8 * scale, d = 3 * scale, h = 4 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy + 1, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function christSaviorCathedral(gx, gy, gz, scale) {
    var r = 6 * scale, h = 12 * scale;
    for (var y = 0; y <= h; y++) {
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r) {
            if (y === 0 || y === h || x*x + z*z >= (r-1)*(r-1)) {
              setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
            }
          }
        }
      }
    }
    for (var y = 0; y <= 4 * scale; y++) {
      var cr = (4 * scale) - y;
      for (var x = -cr; x <= cr; x++) {
        for (var z = -cr; z <= cr; z++) {
          if (x*x + z*z <= cr*cr) {
            setBlock(gx + x, gy + h + 1 + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
  }

  function ostankinoTower(gx, gy, gz, scale) {
    for (var y = 0; y <= 18 * scale; y++) {
      var r = Math.max(1, Math.floor((18 * scale - y) / 6));
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
          }
        }
      }
    }
    setBlock(gx, gy + 18 * scale + 1, gz, BLOCK.STEEL);
  }

  function redSquarePlaza(gx, gy, gz, scale) {
    for (var x = -15 * scale; x <= 15 * scale; x++) {
      for (var z = -15 * scale; z <= 15 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    for (var x = -15 * scale; x <= 15 * scale; x += 5) {
      for (var z = -15 * scale; z <= 15 * scale; z++) {
        setBlock(gx + x, gy + 1, gz + z, BLOCK.BRICK);
      }
    }
  }

  function portCrane(gx, gy, gz, scale) {
    for (var y = 0; y <= 10 * scale; y++) {
      setBlock(gx, gy + y, gz, BLOCK.STEEL);
    }
    for (var x = -5 * scale; x <= 5 * scale; x++) {
      setBlock(gx + x, gy + 10 * scale, gz, BLOCK.STEEL);
    }
    for (var y = 5 * scale; y <= 10 * scale; y++) {
      setBlock(gx + 3 * scale, gy + y, gz, BLOCK.STEEL);
    }
    setBlock(gx + 3 * scale, gy + 10 * scale, gz + 1, BLOCK.STEEL);
    setBlock(gx + 3 * scale, gy + 10 * scale, gz - 1, BLOCK.STEEL);
  }

  function shippingContainer(gx, gy, gz, scale) {
    var w = 4 * scale, d = 2 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
          }
        }
      }
    }
  }

  function lighthouse(gx, gy, gz, scale) {
    for (var y = 0; y <= 12 * scale; y++) {
      var r = Math.max(1, Math.floor((12 * scale - y) / 4));
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    setBlock(gx, gy + 12 * scale + 1, gz, BLOCK.BRICK);
  }

  function grainElevator(gx, gy, gz, scale) {
    for (var y = 0; y <= 10 * scale; y++) {
      for (var x = -3 * scale; x <= 3 * scale; x++) {
        for (var z = -3 * scale; z <= 3 * scale; z++) {
          if (Math.abs(x) === 3 * scale || Math.abs(z) === 3 * scale || y === 0 || y === 10 * scale) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
          }
        }
      }
    }
    for (var y = 0; y <= 2 * scale; y++) {
      for (var x = -4 * scale; x <= 4 * scale; x++) {
        for (var z = -4 * scale; z <= 4 * scale; z++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
        }
      }
    }
  }

  function bakhmutFortress(gx, gy, gz, scale) {
    // Real: Bakhmut Fortress, 17th century, stone walls with ramparts
    // Stone walls with corner towers, central courtyard, gatehouse
    var wallR = 8 * scale;
    var wallH = 5 * scale;
    
    // Main stone walls
    for (var y = 0; y <= wallH; y++) {
      for (var x = -wallR; x <= wallR; x++) {
        for (var z = -wallR; z <= wallR; z++) {
          if (Math.abs(x) === wallR || Math.abs(z) === wallR) {
            // Crenellations (battlements) at top
            if (y === wallH && (x + z) % 2 === 0) {
              setBlock(gx + x, gy + y + 1, gz + z, PAL.STONE_SANDSTONE);
            }
            setBlock(gx + x, gy + y, gz + z, PAL.STONE_SANDSTONE);
          }
        }
      }
    }
    
    // Corner towers (4 round towers, taller)
    var corners = [[-wallR, -wallR], [wallR, -wallR], [-wallR, wallR], [wallR, wallR]];
    for (var ci = 0; ci < 4; ci++) {
      var cx = gx + corners[ci][0], cz = gz + corners[ci][1];
      for (var y = 0; y <= wallH + 3 * scale; y++) {
        var tr = (y > wallH) ? 1 : 2;
        for (var tx = -tr; tx <= tr; tx++) {
          for (var tz = -tr; tz <= tr; tz++) {
            if (tx*tx + tz*tz <= tr*tr + 1) {
              setBlock(cx + tx, gy + y, cz + tz, PAL.STONE_SANDSTONE);
            }
          }
        }
      }
      // Tower roof (conical)
      for (var y = 0; y < 2 * scale; y++) {
        var roofR = 2 - y;
        for (var tx = -roofR; tx <= roofR; tx++) {
          for (var tz = -roofR; tz <= roofR; tz++) {
            if (tx*tx + tz*tz <= roofR*roofR + 1) {
              setBlock(cx + tx, gy + wallH + 3 * scale + y, cz + tz, PAL.ROOF_TERRACOTTA);
            }
          }
        }
      }
    }
    
    // Gatehouse (entrance)
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      for (var z = 0; z <= 2; z++) {
        for (var y = 0; y <= wallH; y++) {
          if (Math.abs(x) > 1 || z > 0) { // archway opening
            setBlock(gx + x, gy + y, gz + wallR + z, PAL.STONE_SANDSTONE);
          }
        }
      }
    }
    // Gatehouse roof (triangular)
    for (var y = 0; y < 2 * scale; y++) {
      for (var x = -3 * scale + y; x <= 3 * scale - y; x++) {
        setBlock(gx + x, gy + wallH + 1 + y, gz + wallR + 2, PAL.ROOF_TERRACOTTA);
      }
    }
    
    // Central courtyard (grass/dirt floor)
    for (var x = -wallR + 1; x <= wallR - 1; x++) {
      for (var z = -wallR + 1; z <= wallR - 1; z++) {
        setBlock(gx + x, gy, gz + z, PAL.DIRT);
      }
    }
    // Small well in courtyard
    setBlock(gx, gy + 1, gz, PAL.STONE_SANDSTONE);
    setBlock(gx, gy + 2, gz, PAL.STONE_SANDSTONE);
  }

  function railwayStation(gx, gy, gz, scale) {
    var w = 10 * scale, d = 4 * scale, h = 4 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var z = -d; z <= d; z++) {
      setBlock(gx + w + 1, gy, gz + z, BLOCK.ASPHALT);
      setBlock(gx - w - 1, gy, gz + z, BLOCK.ASPHALT);
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function saltMineEntrance(gx, gy, gz, scale) {
    for (var y = 0; y <= 2 * scale; y++) {
      for (var x = -2 * scale; x <= 2 * scale; x++) {
        for (var z = -2 * scale; z <= 2 * scale; z++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    for (var y = 0; y >= -4 * scale; y--) {
      for (var x = -1; x <= 1; x++) {
        for (var z = -1; z <= 1; z++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
  }

  function marketHall(gx, gy, gz, scale) {
    var w = 6 * scale, d = 4 * scale, h = 3 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function grandKremlinPalace(gx, gy, gz, scale) {
    var w = 8 * scale, d = 5 * scale, h = 6 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -2; x <= 2; x++) {
      for (var z = -d - 1; z <= d + 1; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
  }

  function tsarCannon(gx, gy, gz, scale) {
    for (var y = 0; y <= 2 * scale; y++) {
      for (var x = -1; x <= 1; x++) {
        for (var z = -1; z <= 1; z++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    for (var x = 0; x <= 3 * scale; x++) {
      setBlock(gx + x, gy + 2 * scale, gz, BLOCK.STEEL);
    }
    setBlock(gx + 3 * scale, gy + 2 * scale + 1, gz, BLOCK.STEEL);
  }

  function tsarBell(gx, gy, gz, scale) {
    for (var y = 0; y <= 4 * scale; y++) {
      var r = 2 * scale + Math.floor(y / 2);
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r && x*x + z*z >= (r-1)*(r-1)) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -1; x <= 1; x++) {
      for (var z = -1; z <= 1; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.BRICK);
      }
    }
  }

  function kremlinSenate(gx, gy, gz, scale) {
    var w = 6 * scale, d = 4 * scale, h = 4 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -2; x <= 2; x++) {
      for (var z = -d - 1; z <= d + 1; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
  }

  function kremlinArsenal(gx, gy, gz, scale) {
    var w = 7 * scale, d = 3 * scale, h = 3 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function forestRangerStation(gx, gy, gz, scale) {
    var w = 3 * scale, d = 2 * scale, h = 3 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.WOOD);
          }
        }
      }
    }
    setBlock(gx, gy + h + 1, gz, BLOCK.WOOD);
  }

  function huntingLodge(gx, gy, gz, scale) {
    var w = 3 * scale, d = 3 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.WOOD);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function sawmill(gx, gy, gz, scale) {
    var w = 4 * scale, d = 3 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.WOOD);
          }
        }
      }
    }
    setBlock(gx - w - 1, gy, gz, BLOCK.WOOD);
    setBlock(gx - w - 2, gy, gz, BLOCK.WOOD);
    setBlock(gx - w - 3, gy, gz, BLOCK.WOOD);
  }

  function woodenChurch(gx, gy, gz, scale) {
    for (var y = 0; y <= 6 * scale; y++) {
      for (var x = -2 * scale; x <= 2 * scale; x++) {
        for (var z = -2 * scale; z <= 2 * scale; z++) {
          if (Math.abs(x) === 2 * scale || Math.abs(z) === 2 * scale || y === 0) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.WOOD);
          }
        }
      }
    }
    for (var y = 0; y <= 3 * scale; y++) {
      var r = 3 * scale - y;
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r) {
            setBlock(gx + x, gy + 6 * scale + 1 + y, gz + z, BLOCK.WOOD);
          }
        }
      }
    }
  }

  function windmill(gx, gy, gz, scale) {
    for (var y = 0; y <= 8 * scale; y++) {
      setBlock(gx, gy + y, gz, BLOCK.WOOD);
    }
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      setBlock(gx + x, gy + 8 * scale, gz, BLOCK.WOOD);
    }
    for (var z = -3 * scale; z <= 3 * scale; z++) {
      setBlock(gx, gy + 8 * scale, gz + z, BLOCK.WOOD);
    }
    for (var y = 0; y <= 2 * scale; y++) {
      for (var x = -2 * scale; x <= 2 * scale; x++) {
        for (var z = -2 * scale; z <= 2 * scale; z++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.WOOD);
        }
      }
    }
  }

  function farmhouse(gx, gy, gz, scale) {
    var w = 3 * scale, d = 2 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.WOOD);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function barn(gx, gy, gz, scale) {
    var w = 4 * scale, d = 3 * scale, h = 3 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.WOOD);
          }
        }
      }
    }
    for (var y = 0; y <= h; y++) {
      setBlock(gx + w + 1, gy + y, gz, BLOCK.WOOD);
    }
  }

  function well(gx, gy, gz, scale) {
    for (var y = 0; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        for (var z = -1; z <= 1; z++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    setBlock(gx, gy + 2, gz, BLOCK.BRICK);
    setBlock(gx, gy + 3, gz, BLOCK.WOOD);
  }

  function abandonedPripyatApartment(gx, gy, gz, scale) {
    var w = 4 * scale, d = 3 * scale, h = 7 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.random() > 0.3) {
            if (Math.abs(x) === w || Math.abs(z) === d || y === 0) {
              setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
            }
          }
        }
      }
    }
  }

  function abandonedSchool(gx, gy, gz, scale) {
    var w = 6 * scale, d = 4 * scale, h = 3 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.random() > 0.2) {
            if (Math.abs(x) === w || Math.abs(z) === d || y === 0) {
              setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
            }
          }
        }
      }
    }
  }

  function abandonedHotel(gx, gy, gz, scale) {
    var w = 5 * scale, d = 3 * scale, h = 8 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.random() > 0.25) {
            if (Math.abs(x) === w || Math.abs(z) === d || y === 0) {
              setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
            }
          }
        }
      }
    }
  }

  function amusementPark(gx, gy, gz, scale) {
    for (var x = -8 * scale; x <= 8 * scale; x++) {
      for (var z = -8 * scale; z <= 8 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    for (var y = 0; y <= 6 * scale; y++) {
      setBlock(gx, gy + y, gz, BLOCK.BRICK);
    }
    for (var x = -4 * scale; x <= 4 * scale; x++) {
      setBlock(gx + x, gy + 6 * scale, gz, BLOCK.BRICK);
    }
    for (var z = -4 * scale; z <= 4 * scale; z++) {
      setBlock(gx, gy + 6 * scale, gz + z, BLOCK.BRICK);
    }
  }

  function swimmingPool(gx, gy, gz, scale) {
    for (var x = -4 * scale; x <= 4 * scale; x++) {
      for (var z = -3 * scale; z <= 3 * scale; z++) {
        for (var y = 0; y >= -2 * scale; y--) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    for (var x = -4 * scale; x <= 4 * scale; x++) {
      for (var z = -3 * scale; z <= 3 * scale; z++) {
        setBlock(gx + x, gy - 2 * scale, gz + z, BLOCK.BRICK);
      }
    }
  }

  function abandonedSupermarket(gx, gy, gz, scale) {
    var w = 5 * scale, d = 3 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.random() > 0.3) {
            if (Math.abs(x) === w || Math.abs(z) === d || y === 0) {
              setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
            }
          }
        }
      }
    }
  }

  function watchtower(gx, gy, gz, scale) {
    for (var y = 0; y <= 8 * scale; y++) {
      setBlock(gx, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz, BLOCK.BRICK);
      setBlock(gx, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz + 1, BLOCK.BRICK);
    }
    for (var y = 6 * scale; y <= 8 * scale; y++) {
      setBlock(gx - 1, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 2, gy + y, gz, BLOCK.BRICK);
      setBlock(gx - 1, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx + 2, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx, gy + y, gz - 1, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz - 1, BLOCK.BRICK);
      setBlock(gx, gy + y, gz + 2, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz + 2, BLOCK.BRICK);
    }
  }

  function beachHotel(gx, gy, gz, scale) {
    var w = 4 * scale, d = 3 * scale, h = 5 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function borderCheckpoint(gx, gy, gz, scale) {
    var w = 2 * scale, d = 1 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
    for (var y = 0; y <= h; y++) {
      setBlock(gx + w + 1, gy + y, gz, BLOCK.BRICK);
      setBlock(gx - w - 1, gy + y, gz, BLOCK.BRICK);
    }
  }

  function tollBooth(gx, gy, gz, scale) {
    var w = 1 * scale, d = 1 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy + h, gz + d + 1, BLOCK.BRICK);
    }
  }

  function riverPort(gx, gy, gz, scale) {
    for (var x = -6 * scale; x <= 6 * scale; x++) {
      for (var z = -3 * scale; z <= 3 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    for (var x = -6 * scale; x <= 6 * scale; x++) {
      setBlock(gx + x, gy + 1, gz - 3 * scale, BLOCK.BRICK);
    }
    for (var y = 0; y <= 2 * scale; y++) {
      setBlock(gx - 6 * scale, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 6 * scale, gy + y, gz, BLOCK.BRICK);
    }
  }

  function ferryTerminal(gx, gy, gz, scale) {
    for (var x = -4 * scale; x <= 4 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    for (var x = -4 * scale; x <= 4 * scale; x++) {
      setBlock(gx + x, gy + 1, gz - 2 * scale, BLOCK.BRICK);
    }
    for (var y = 0; y <= 2 * scale; y++) {
      setBlock(gx - 4 * scale, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 4 * scale, gy + y, gz, BLOCK.BRICK);
    }
  }

  function theater(gx, gy, gz, scale) {
    var w = 5 * scale, d = 4 * scale, h = 4 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      for (var y = 0; y <= 2 * scale; y++) {
        setBlock(gx + x, gy + y, gz + d + 1, BLOCK.BRICK);
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 2, BLOCK.ASPHALT);
    }
  }

  function shipyard(gx, gy, gz, scale) {
    for (var x = -8 * scale; x <= 8 * scale; x++) {
      for (var z = -4 * scale; z <= 4 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    for (var x = -8 * scale; x <= 8 * scale; x++) {
      setBlock(gx + x, gy + 1, gz - 4 * scale, BLOCK.BRICK);
    }
    for (var y = 0; y <= 3 * scale; y++) {
      setBlock(gx - 8 * scale, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 8 * scale, gy + y, gz, BLOCK.BRICK);
    }
    for (var x = -2 * scale; x <= 2 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        setBlock(gx + x, gy + 1, gz + z, BLOCK.BRICK);
      }
    }
  }

  function cokeOven(gx, gy, gz, scale) {
    for (var y = 0; y <= 4 * scale; y++) {
      for (var x = -3 * scale; x <= 3 * scale; x++) {
        for (var z = -3 * scale; z <= 3 * scale; z++) {
          if (Math.abs(x) === 3 * scale || Math.abs(z) === 3 * scale || y === 0 || y === 4 * scale) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var y = 0; y <= 2 * scale; y++) {
      setBlock(gx, gy + y, gz - 3 * scale - 1, BLOCK.BRICK);
    }
  }

  function powerSubstation(gx, gy, gz, scale) {
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        for (var y = 0; y <= 2 * scale; y++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    for (var y = 0; y <= 4 * scale; y++) {
      setBlock(gx - 3 * scale, gy + y, gz - 2 * scale, BLOCK.BRICK);
      setBlock(gx + 3 * scale, gy + y, gz - 2 * scale, BLOCK.BRICK);
    }
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      setBlock(gx + x, gy + 4 * scale, gz - 2 * scale, BLOCK.BRICK);
    }
  }

  function navalHQ(gx, gy, gz, scale) {
    var w = 5 * scale, d = 4 * scale, h = 4 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -2; x <= 2; x++) {
      for (var z = -d - 1; z <= d + 1; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
  }

  function submarineBase(gx, gy, gz, scale) {
    for (var x = -6 * scale; x <= 6 * scale; x++) {
      for (var z = -4 * scale; z <= 4 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    for (var x = -6 * scale; x <= 6 * scale; x++) {
      setBlock(gx + x, gy + 1, gz - 4 * scale, BLOCK.BRICK);
    }
    for (var y = 0; y <= 3 * scale; y++) {
      setBlock(gx - 6 * scale, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 6 * scale, gy + y, gz, BLOCK.BRICK);
    }
    for (var x = -1; x <= 1; x++) {
      for (var z = -1; z <= 1; z++) {
        setBlock(gx + x, gy + 1, gz + z, BLOCK.BRICK);
      }
    }
  }

  function panoramaMuseum(gx, gy, gz, scale) {
    var w = 6 * scale, d = 3 * scale, h = 3 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function coastalFortress(gx, gy, gz, scale) {
    for (var y = 0; y <= 4 * scale; y++) {
      for (var x = -8 * scale; x <= 8 * scale; x++) {
        for (var z = -8 * scale; z <= 8 * scale; z++) {
          if (Math.abs(x) === 8 * scale || Math.abs(z) === 8 * scale) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var y = 0; y <= 6 * scale; y++) {
      setBlock(gx - 8 * scale, gy + y, gz - 8 * scale, BLOCK.BRICK);
      setBlock(gx + 8 * scale, gy + y, gz - 8 * scale, BLOCK.BRICK);
      setBlock(gx - 8 * scale, gy + y, gz + 8 * scale, BLOCK.BRICK);
      setBlock(gx + 8 * scale, gy + y, gz + 8 * scale, BLOCK.BRICK);
    }
  }

  function slagHeap(gx, gy, gz, scale) {
    for (var y = 0; y <= 5 * scale; y++) {
      var r = 5 * scale - y;
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.DIRT);
          }
        }
      }
    }
  }

  function boilerHouse(gx, gy, gz, scale) {
    var w = 3 * scale, d = 3 * scale, h = 3 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var y = 0; y <= 5 * scale; y++) {
      setBlock(gx, gy + h + y, gz, BLOCK.BRICK);
    }
  }

  function bathhouse(gx, gy, gz, scale) {
    var w = 3 * scale, d = 2 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function canteen(gx, gy, gz, scale) {
    var w = 4 * scale, d = 3 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function victoryArch(gx, gy, gz, scale) {
    for (var y = 0; y <= 10 * scale; y++) {
      setBlock(gx - 3 * scale, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 3 * scale, gy + y, gz, BLOCK.BRICK);
    }
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      setBlock(gx + x, gy + 10 * scale, gz, BLOCK.BRICK);
    }
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      setBlock(gx + x, gy + 8 * scale, gz, BLOCK.BRICK);
    }
  }

  function militaryBarracks(gx, gy, gz, scale) {
    var w = 5 * scale, d = 3 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function pier(gx, gy, gz, scale) {
    for (var x = -2 * scale; x <= 2 * scale; x++) {
      for (var z = -1 * scale; z <= 4 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.WOOD);
      }
    }
    for (var y = 0; y <= 2 * scale; y++) {
      setBlock(gx - 2 * scale, gy + y, gz + 4 * scale, BLOCK.WOOD);
      setBlock(gx + 2 * scale, gy + y, gz + 4 * scale, BLOCK.WOOD);
    }
  }

  function helipad(gx, gy, gz, scale) {
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      for (var z = -3 * scale; z <= 3 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    setBlock(gx, gy + 1, gz, BLOCK.BRICK);
    setBlock(gx + 1, gy + 1, gz, BLOCK.BRICK);
    setBlock(gx - 1, gy + 1, gz, BLOCK.BRICK);
    setBlock(gx, gy + 1, gz + 1, BLOCK.BRICK);
    setBlock(gx, gy + 1, gz - 1, BLOCK.BRICK);
  }

  function storageBunker(gx, gy, gz, scale) {
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        for (var y = 0; y <= 2 * scale; y++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    for (var x = -1; x <= 1; x++) {
      for (var y = 0; y <= 1; y++) {
        setBlock(gx + x, gy + y, gz - 2 * scale - 1, BLOCK.BRICK);
      }
    }
  }

  function memorialPlaque(gx, gy, gz, scale) {
    for (var y = 0; y <= 2 * scale; y++) {
      setBlock(gx, gy + y, gz, BLOCK.BRICK);
    }
    for (var x = -1; x <= 1; x++) {
      setBlock(gx + x, gy + 2 * scale, gz, BLOCK.BRICK);
    }
    for (var x = -2; x <= 2; x++) {
      for (var z = -1; z <= 1; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.BRICK);
      }
    }
  }

  function runway(gx, gy, gz, scale) {
    for (var x = -20 * scale; x <= 20 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    for (var x = -20 * scale; x <= 20 * scale; x += 5) {
      setBlock(gx + x, gy + 1, gz, BLOCK.BRICK);
    }
  }

  function officerClub(gx, gy, gz, scale) {
    var w = 4 * scale, d = 3 * scale, h = 3 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function ammoBunker(gx, gy, gz, scale) {
    for (var x = -2 * scale; x <= 2 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        for (var y = 0; y <= 2 * scale; y++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    for (var x = -1; x <= 1; x++) {
      for (var y = 0; y <= 1; y++) {
        setBlock(gx + x, gy + y, gz - 2 * scale - 1, BLOCK.BRICK);
      }
    }
  }

  function guardPost(gx, gy, gz, scale) {
    for (var y = 0; y <= 2 * scale; y++) {
      setBlock(gx, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz, BLOCK.BRICK);
      setBlock(gx, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz + 1, BLOCK.BRICK);
    }
    for (var y = 1 * scale; y <= 2 * scale; y++) {
      setBlock(gx - 1, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 2, gy + y, gz, BLOCK.BRICK);
      setBlock(gx - 1, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx + 2, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx, gy + y, gz - 1, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz - 1, BLOCK.BRICK);
      setBlock(gx, gy + y, gz + 2, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz + 2, BLOCK.BRICK);
    }
  }

  function culturePalace(gx, gy, gz, scale) {
    var w = 5 * scale, d = 4 * scale, h = 4 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -3 * scale; x <= 3 * scale; x++) {
      for (var y = 0; y <= 2 * scale; y++) {
        setBlock(gx + x, gy + y, gz + d + 1, BLOCK.BRICK);
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 2, BLOCK.ASPHALT);
    }
  }

  function hospital(gx, gy, gz, scale) {
    var w = 5 * scale, d = 4 * scale, h = 4 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -2; x <= 2; x++) {
      for (var z = -d - 1; z <= d + 1; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    setBlock(gx, gy + h + 1, gz, BLOCK.BRICK);
    setBlock(gx + 1, gy + h + 1, gz, BLOCK.BRICK);
    setBlock(gx - 1, gy + h + 1, gz, BLOCK.BRICK);
  }

  function shoppingCenter(gx, gy, gz, scale) {
    var w = 6 * scale, d = 4 * scale, h = 3 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function suspensionBridge(gx, gy, gz, scale) {
    for (var x = -15 * scale; x <= 15 * scale; x++) {
      setBlock(gx + x, gy, gz, BLOCK.ASPHALT);
    }
    for (var y = 0; y <= 8 * scale; y++) {
      setBlock(gx - 15 * scale, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 15 * scale, gy + y, gz, BLOCK.BRICK);
    }
    for (var x = -15 * scale; x <= 15 * scale; x++) {
      setBlock(gx + x, gy + 8 * scale, gz, BLOCK.BRICK);
    }
    for (var x = -15 * scale; x <= 15 * scale; x += 3) {
      setBlock(gx + x, gy + 7 * scale, gz, BLOCK.BRICK);
      setBlock(gx + x, gy + 6 * scale, gz, BLOCK.BRICK);
    }
  }

  function observationTower(gx, gy, gz, scale) {
    for (var y = 0; y <= 10 * scale; y++) {
      setBlock(gx, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz, BLOCK.BRICK);
      setBlock(gx, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz + 1, BLOCK.BRICK);
    }
    for (var y = 8 * scale; y <= 10 * scale; y++) {
      setBlock(gx - 1, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 2, gy + y, gz, BLOCK.BRICK);
      setBlock(gx - 1, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx + 2, gy + y, gz + 1, BLOCK.BRICK);
      setBlock(gx, gy + y, gz - 1, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz - 1, BLOCK.BRICK);
      setBlock(gx, gy + y, gz + 2, BLOCK.BRICK);
      setBlock(gx + 1, gy + y, gz + 2, BLOCK.BRICK);
    }
    setBlock(gx + 0.5, gy + 11 * scale, gz + 0.5, BLOCK.BRICK);
  }

  function pontoonBridge(gx, gy, gz, scale) {
    for (var x = -10 * scale; x <= 10 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.WOOD);
      }
    }
    for (var x = -10 * scale; x <= 10 * scale; x += 5) {
      for (var y = 0; y >= -2 * scale; y--) {
        setBlock(gx + x, gy + y, gz, BLOCK.WOOD);
      }
    }
  }

  function monitoringStation(gx, gy, gz, scale) {
    for (var x = -2 * scale; x <= 2 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        for (var y = 0; y <= 2 * scale; y++) {
          setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
        }
      }
    }
    for (var y = 0; y <= 4 * scale; y++) {
      setBlock(gx, gy + 2 * scale + y, gz, BLOCK.BRICK);
    }
    setBlock(gx + 1, gy + 6 * scale, gz, BLOCK.BRICK);
    setBlock(gx - 1, gy + 6 * scale, gz, BLOCK.BRICK);
    setBlock(gx, gy + 6 * scale, gz + 1, BLOCK.BRICK);
    setBlock(gx, gy + 6 * scale, gz - 1, BLOCK.BRICK);
  }

  function catalyticCracker(gx, gy, gz, scale) {
    for (var y = 0; y <= 8 * scale; y++) {
      var r = Math.max(1, Math.floor((8 * scale - y) / 3));
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
          }
        }
      }
    }
    setBlock(gx, gy + 8 * scale + 1, gz, BLOCK.STEEL);
  }

  function burningBuilding(gx, gy, gz, scale) {
    var w = 3 * scale, d = 3 * scale, h = 5 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.random() > 0.4) {
            if (Math.abs(x) === w || Math.abs(z) === d || y === 0) {
              setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
            }
          }
        }
      }
    }
    setBlock(gx, gy + h + 1, gz, BLOCK.FUEL_BARREL);
  }

  function fishMarket(gx, gy, gz, scale) {
    var w = 4 * scale, d = 3 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function dryDock(gx, gy, gz, scale) {
    for (var x = -8 * scale; x <= 8 * scale; x++) {
      for (var z = -3 * scale; z <= 3 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    for (var x = -8 * scale; x <= 8 * scale; x++) {
      setBlock(gx + x, gy + 1, gz - 3 * scale, BLOCK.BRICK);
    }
    for (var y = 0; y <= 2 * scale; y++) {
      setBlock(gx - 8 * scale, gy + y, gz, BLOCK.BRICK);
      setBlock(gx + 8 * scale, gy + y, gz, BLOCK.BRICK);
    }
  }

  function seasidePromenade(gx, gy, gz, scale) {
    for (var x = -15 * scale; x <= 15 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.ASPHALT);
      }
    }
    for (var x = -15 * scale; x <= 15 * scale; x += 5) {
      setBlock(gx + x, gy + 1, gz + 2 * scale, BLOCK.BRICK);
      setBlock(gx + x, gy + 1, gz - 2 * scale, BLOCK.BRICK);
    }
  }

  function defensivePosition(gx, gy, gz, scale) {
    for (var x = -5 * scale; x <= 5 * scale; x++) {
      for (var z = -2 * scale; z <= 2 * scale; z++) {
        setBlock(gx + x, gy, gz + z, BLOCK.DIRT);
      }
    }
    for (var x = -5 * scale; x <= 5 * scale; x++) {
      setBlock(gx + x, gy + 1, gz - 2 * scale, BLOCK.DIRT);
      setBlock(gx + x, gy + 1, gz + 2 * scale, BLOCK.DIRT);
    }
    for (var y = 0; y <= 2 * scale; y++) {
      setBlock(gx - 5 * scale, gy + y, gz, BLOCK.DIRT);
      setBlock(gx + 5 * scale, gy + y, gz, BLOCK.DIRT);
    }
  }

  function tractorShed(gx, gy, gz, scale) {
    var w = 4 * scale, d = 3 * scale, h = 2 * scale;
    for (var x = -w; x <= w; x++) {
      for (var z = -d; z <= d; z++) {
        for (var y = 0; y <= h; y++) {
          if (Math.abs(x) === w || Math.abs(z) === d || y === 0 || y === h) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.BRICK);
          }
        }
      }
    }
    for (var x = -w; x <= w; x++) {
      setBlock(gx + x, gy, gz + d + 1, BLOCK.ASPHALT);
    }
  }

  function stadium(gx, gy, gz, scale) {
    var r = 12 * scale, h = 4 * scale;
    for (var y = 0; y <= h; y++) {
      for (var x = -r; x <= r; x++) {
        for (var z = -r; z <= r; z++) {
          if (x*x + z*z <= r*r && x*x + z*z >= (r-2)*(r-2)) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.CONCRETE);
          }
          if (x*x + z*z < (r-2)*(r-2) && y === 0) {
            setBlock(gx + x, gy + y, gz + z, BLOCK.ASPHALT);
          }
        }
      }
    }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    CITIES: CITIES, ROADS: ROADS, STAGE_MAP: STAGE_MAP,
    sovietApartment: sovietApartment, orthodoxChurch: orthodoxChurch, kyivBaroqueChurch: kyivBaroqueChurch,
    stBasilCathedral: stBasilCathedral, motherlandMonument: motherlandMonument, kremlinWall: kremlinWall,
    moscowStateUniversity: moscowStateUniversity, industrialFactory: industrialFactory, azovstalComplex: azovstalComplex,
    coolingTower: coolingTower, distillationTower: distillationTower, storageTank: storageTank,
    parliamentBuilding: parliamentBuilding, lubyankaBuilding: lubyankaBuilding, bolshoiTheatre: bolshoiTheatre,
    leninMausoleum: leninMausoleum, gumDepartmentStore: gumDepartmentStore, stateHistoricalMuseum: stateHistoricalMuseum,
    dugaRadar: dugaRadar, sarcophagus: sarcophagus, pripyatFerrisWheel: pripyatFerrisWheel,
    crimeaBridge: crimeaBridge, dramaTheater: dramaTheater, antonovskyBridge: antonovskyBridge,
    trenches: trenches, dragonTeeth: dragonTeeth, coastalFort: coastalFort,
    monumentToSunkenShips: monumentToSunkenShips, snakeIslandBorderPost: snakeIslandBorderPost,
    airportTerminal: airportTerminal, hangar: hangar, warehouse: warehouse,
    officeBuilding: officeBuilding, residentialHouse: residentialHouse, controlTower: controlTower, monument: monument,
    bridge: bridge, radarStation: radarStation, bunker: bunker,
    ruinedBuilding: ruinedBuilding, school: school,
    trenchLine: trenchLine, dugout: dugout, wheatField: wheatField, dragonsTeeth: dragonsTeeth,
    smokestack: smokestack, damagedBuilding: damagedBuilding, sandbagWall: sandbagWall,
    observationPost: observationPost, flareStack: flareStack, lighthouse: lighthouse,
    barricade: barricade, tankTrap: tankTrap, propagandaBillboard: propagandaBillboard,
    mineHeadframe: mineHeadframe, spoilTip: spoilTip, portCrane: portCrane,
    metroEntrance: metroEntrance, fountain: fountain,
    fuelStorageTank: fuelStorageTank, fireStation: fireStation, parkingGarage: parkingGarage, aircraftMonument: aircraftMonument, radarDome: radarDome, independenceMonument: independenceMonument, goldenGate: goldenGate, governmentHouse: governmentHouse, olympicStadium: olympicStadium, embankmentBuilding: embankmentBuilding, spasskayaTower: spasskayaTower, gumDepartmentStore: gumDepartmentStore, christSaviorCathedral: christSaviorCathedral, ostankinoTower: ostankinoTower, redSquarePlaza: redSquarePlaza, portCrane: portCrane, shippingContainer: shippingContainer, lighthouse: lighthouse, grainElevator: grainElevator, bakhmutFortress: bakhmutFortress, railwayStation: railwayStation, saltMineEntrance: saltMineEntrance, marketHall: marketHall, grandKremlinPalace: grandKremlinPalace, tsarCannon: tsarCannon, tsarBell: tsarBell, kremlinSenate: kremlinSenate, kremlinArsenal: kremlinArsenal, forestRangerStation: forestRangerStation, huntingLodge: huntingLodge, sawmill: sawmill, woodenChurch: woodenChurch, windmill: windmill, farmhouse: farmhouse, barn: barn, well: well, abandonedPripyatApartment: abandonedPripyatApartment, abandonedSchool: abandonedSchool, abandonedHotel: abandonedHotel, amusementPark: amusementPark, swimmingPool: swimmingPool, abandonedSupermarket: abandonedSupermarket, watchtower: watchtower, beachHotel: beachHotel, borderCheckpoint: borderCheckpoint, tollBooth: tollBooth, riverPort: riverPort, ferryTerminal: ferryTerminal, theater: theater, shipyard: shipyard, cokeOven: cokeOven, powerSubstation: powerSubstation, navalHQ: navalHQ, submarineBase: submarineBase, panoramaMuseum: panoramaMuseum, coastalFortress: coastalFortress, slagHeap: slagHeap, boilerHouse: boilerHouse, bathhouse: bathhouse, canteen: canteen, victoryArch: victoryArch, militaryBarracks: militaryBarracks, pier: pier, helipad: helipad, storageBunker: storageBunker, memorialPlaque: memorialPlaque, runway: runway, officerClub: officerClub, ammoBunker: ammoBunker, guardPost: guardPost, culturePalace: culturePalace, hospital: hospital, shoppingCenter: shoppingCenter, suspensionBridge: suspensionBridge, observationTower: observationTower, pontoonBridge: pontoonBridge, monitoringStation: monitoringStation, catalyticCracker: catalyticCracker, burningBuilding: burningBuilding, fishMarket: fishMarket, dryDock: dryDock, seasidePromenade: seasidePromenade, defensivePosition: defensivePosition, tractorShed: tractorShed, stadium: stadium,
  };
})();
if (typeof window !== 'undefined') { window.CityBuildings = CityBuildings; }
