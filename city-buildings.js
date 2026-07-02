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

  // ── sovietApartment ──
  function sovietApartment(ox, oz, gy, w, d, floors, damage, color) {
    color = color || PAL.CONCRETE;
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
            if (damage > 0 && Math.random() < damage * 0.15) continue;
            setBlock(ox + x, gy + y, oz + z, bt);
          }
          if (isWall && !isRoof && !isFloor && y > 0) {
            if ((y % 3 === 1 || y % 3 === 2) && (x % 3 === 1 || z % 3 === 1)) {
              if (Math.random() > 0.3) setBlock(ox + x, gy + y, oz + z, PAL.GLASS);
            }
          }
        }
      }
    }
    for (var f = 1; f < floors; f++) {
      var by = gy + f * 3 + 1;
      for (var bx = 1; bx < w - 1; bx++) {
        if (bx % 3 === 1) {
          setBlock(ox + bx, by, oz + d, PAL.CONCRETE);
          setBlock(ox + bx, by, oz + d + 1, PAL.FENCE);
        }
      }
    }
    setBlock(ox + Math.floor(w / 2), gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2), gy + 1, oz, PAL.AIR);
    for (var sy = 1; sy < h - 1; sy++) {
      if (sy % 3 === 1) setBlock(ox + w - 1, gy + sy, oz + Math.floor(d / 2), PAL.GLASS);
    }
  }

  // ── orthodoxChurch ──
  function orthodoxChurch(ox, oz, gy, w, d, h, color) { color = color || PAL.BRICK;
    var cx = ox + Math.floor(w / 2), cz = oz + Math.floor(d / 2);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = (y === 0) ? PAL.STONE : color;
            if (y > h - 3) bt = PAL.PLASTER;
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
            if (isWall) setBlock(tx + x, gy + y, tz + z, color);
          }
        }
      }
      var domeY = gy + h + 4;
      setBlock(tx + 1, domeY, tz + 1, PAL.METAL); setBlock(tx + 1, domeY + 1, tz + 1, PAL.METAL);
      setBlock(tx, domeY, tz + 1, PAL.METAL); setBlock(tx + 2, domeY, tz + 1, PAL.METAL);
      setBlock(tx + 1, domeY, tz, PAL.METAL); setBlock(tx + 1, domeY, tz + 2, PAL.METAL);
      setBlock(tx + 1, domeY + 2, tz + 1, PAL.METAL);
    }
    var domeY = gy + h + 2;
    for (var dx = -2; dx <= 2; dx++) {
      for (var dz = -2; dz <= 2; dz++) {
        for (var dy = 0; dy < 3; dy++) {
          if (Math.abs(dx) + Math.abs(dz) + dy <= 3) setBlock(cx + dx, domeY + dy, cz + dz, PAL.METAL);
        }
      }
    }
    setBlock(cx, gy, oz + d - 1, PAL.AIR); setBlock(cx, gy + 1, oz + d - 1, PAL.AIR); setBlock(cx, gy + 2, oz + d - 1, PAL.AIR);
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
    var cx = ox + 8, cz = oz + 8;
    for (var y = 0; y < 14; y++) { var radius = Math.max(1, 3 - Math.floor(y / 4)); for (var x = -radius; x <= radius; x++) { for (var z = -radius; z <= radius; z++) setBlock(cx + x, gy + y, cz + z, PAL.BRICK); } }
    for (var y = 0; y < 8; y++) { var radius = Math.max(0, 2 - Math.floor(y / 3)); for (var x = -radius; x <= radius; x++) { for (var z = -radius; z <= radius; z++) setBlock(cx + x, gy + 14 + y, cz + z, PAL.ROOFTILE); } }
    var chapelColors = [PAL.BRICK, PAL.ROOFTILE, PAL.BLUE_TILE, PAL.METAL, PAL.BRICK, PAL.ROOFTILE, PAL.BLUE_TILE, PAL.METAL];
    var chapelOffsets = [[-5,-5],[5,-5],[5,5],[-5,5],[0,-7],[7,0],[0,7],[-7,0]];
    for (var ci = 0; ci < 8; ci++) {
      var cox = cx + chapelOffsets[ci][0], coz = cz + chapelOffsets[ci][1];
      for (var y = 0; y < 8; y++) { for (var x = -2; x <= 2; x++) { for (var z = -2; z <= 2; z++) { var isWall = Math.abs(x) === 2 || Math.abs(z) === 2; if (isWall || y === 7) setBlock(cox + x, gy + y, coz + z, PAL.BRICK); } } }
      var col = chapelColors[ci];
      for (var dy = 0; dy < 4; dy++) { var radius = (dy < 2) ? 2 - dy : 1; for (var dxx = -radius; dxx <= radius; dxx++) { for (var dzz = -radius; dzz <= radius; dzz++) { if (Math.abs(dxx) + Math.abs(dzz) <= radius + 1) setBlock(cox + dxx, gy + 8 + dy, coz + dzz, col); } } }
      setBlock(cox, gy + 12, coz, PAL.METAL);
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
  function industrialFactory(ox, oz, gy, w, d, h, color) { color = color || PAL.METAL;
    for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (y === 0) bt = PAL.CONCRETE; if (isRoof) { var saw = (x + z) % 4 < 2; bt = saw ? PAL.METAL : PAL.GLASS; } setBlock(ox + x, gy + y, oz + z, bt); } } } }
    for (var si = 0; si < 2; si++) { var sx = ox + Math.floor(w / 3) + si * Math.floor(w / 3); var sz = oz + Math.floor(d / 2); for (var y = 0; y < h + 12; y++) { var bt = (y % 4 < 2) ? PAL.BRICK : PAL.WHITE_TILE; setBlock(sx, gy + y, sz, bt); setBlock(sx + 1, gy + y, sz, bt); setBlock(sx, gy + y, sz + 1, bt); setBlock(sx + 1, gy + y, sz + 1, bt); } }
    for (var x = 2; x < w - 2; x += 4) { setBlock(ox + x, gy + h, oz + 2, PAL.METAL); setBlock(ox + x, gy + h + 1, oz + 2, PAL.METAL); }
    setBlock(ox + Math.floor(w / 2), gy, oz, PAL.AIR); setBlock(ox + Math.floor(w / 2), gy + 1, oz, PAL.AIR); setBlock(ox + Math.floor(w / 2) + 1, gy, oz, PAL.AIR); setBlock(ox + Math.floor(w / 2) + 1, gy + 1, oz, PAL.AIR);
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
  function officeBuilding(ox, oz, gy, w, d, floors, color) { color = color || PAL.CONCRETE; var h = floors * 3 + 1; for (var y = 0; y < h; y++) { for (var x = 0; x < w; x++) { for (var z = 0; z < d; z++) { var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1; var isRoof = y === h - 1; if (isWall || isRoof) { var bt = color; if (isWall && y > 0 && y < h - 1) { if (x % 2 === 0 || z % 2 === 0) bt = color; else bt = PAL.GLASS; } setBlock(ox + x, gy + y, oz + z, bt); } } } } for (var x = -1; x < w + 1; x++) setBlock(ox + x, gy + 2, oz + d, PAL.CONCRETE); setBlock(ox + Math.floor(w / 2), gy, oz + d - 1, PAL.AIR); setBlock(ox + Math.floor(w / 2), gy + 1, oz + d - 1, PAL.AIR); }

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
{ type: 'airportTerminal', params: [40, 14, 6, 9], x: -15, z: -25, note: 'Antonov Airport Terminal (admin building, partially destroyed)' },
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
    { type: 'metroEntrance', params: [64], x: -15, z: 25, note: 'Metro Arsenalna (world's deepest)' },
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
{ type: 'sarcophagus', params: [], x: 0, z: -40, note: 'Chornobyl NPP Reactor 4 — New Safe Confinement (steel arch)' },
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
{ type: 'kremlinWall', params: [80, 60, 8, 9], x: 0, z: 0, note: 'Kremlin walls — triangular fortification, red brick, towers with green roofs and ruby stars' },
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
  ROADS.hostomel = [[[-60,0],[-40,0],[-20,0],[0,0],[20,0],[40,0],[60,0]],[[-40,-20],[-40,0],[-40,20],[-40,40]],[[-50,40],[-30,40],[-10,40],[10,40],[30,40],[50,40]],[[-70,-50],[-50,-40],[-30,-30],[-10,-20],[10,-20],[30,-30],[50,-40],[70,-50]],[[20,60],[30,50],[40,40],[50,30],[60,20],[70,10]],[[-60,-50],[-60,-30],[-60,-10],[-60,10],[-60,30],[-60,50]],[[60,-30],[60,-10],[60,10],[60,30],[60,50],[60,70]],[[40,20],[50,20],[60,20],[70,20],[80,20],[90,20]],[[40,50],[50,50],[60,50],[70,50],[80,50]],[[0,-60],[0,-40],[0,-20],[0,0]]],
[[-80, 0], [-60, 0], [-40, 0]],
[[40, 0], [60, 0], [80, 0]],
[[-80, -30], [-60, -20], [-40, -10]],
[[80, -30], [60, -20], [40, -10]],
[[-80, 30], [-60, 20], [-40, 10]],
[[80, 30], [60, 20], [40, 10]],
[[-80, -50], [-60, -40], [-40, -30]],
[[80, -50], [60, -40], [40, -30]],
[[-80, 50], [-60, 40], [-40, 30]],
[[80, 50], [60, 40], [40, 30]]];
  ROADS.avdiivka = [[[-20,-50],[-20,-30],[-20,-10],[-20,10],[-20,30],[-20,50]],[[-50,-10],[-30,-10],[-10,-10],[10,-10],[30,-10],[50,-10]],[[-50,-30],[-30,-30],[-10,-30],[10,-30],[30,-30],[50,-30]],[[-50,20],[-30,20],[-10,20],[10,20],[30,20],[50,20]],[[-40,-40],[-40,-20],[-40,0],[-40,20],[-40,40]],[[40,-40],[40,-20],[40,0],[40,20],[40,40]],[[-20,-10],[-20,10],[0,10],[20,10],[20,-10]],[[-50,-40],[-40,-30],[-30,-20],[-20,-10],[-10,0]],[[10,0],[20,10],[30,20],[40,30],[50,40]],[[-50,40],[-25,40],[0,40],[25,40],[50,40]]],
[[-80, -20], [-60, -20], [-40, -20]],
[[80, -20], [60, -20], [40, -20]],
[[-80, 30], [-60, 30], [-40, 30]],
[[80, 30], [60, 30], [40, 30]],
[[-80, -40], [-60, -40], [-40, -40]],
[[80, -40], [60, -40], [40, -40]],
[[-80, 0], [-60, 0], [-40, 0]],
[[80, 0], [60, 0], [40, 0]],
[[-80, 50], [-60, 50], [-40, 50]],
[[80, 50], [60, 50], [40, 50]]];
  ROADS.bakhmut = [[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[-50,-20],[-25,-20],[0,-20],[25,-20],[50,-20]],[[-50,20],[-25,20],[0,20],[25,20],[50,20]],[[-50,-40],[-50,-20],[-50,0],[-50,20],[-50,40]],[[50,-40],[50,-20],[50,0],[50,20],[50,40]],[[-50,-50],[-40,-40],[-30,-30],[-20,-20],[-10,-10]],[[10,-10],[20,-20],[30,-30],[40,-40],[50,-50]],[[-10,10],[-20,20],[-30,30],[-40,40],[-50,50]],[[10,10],[20,20],[30,30],[40,40],[50,50]]],
[[-70, 0], [-60, 0], [-50, 0]],
[[50, 0], [60, 0], [70, 0]],
[[0, -70], [0, -60], [0, -50]],
[[0, 50], [0, 60], [0, 70]],
[[-70, -30], [-60, -30], [-50, -30]],
[[50, -30], [60, -30], [70, -30]],
[[-70, 30], [-60, 30], [-50, 30]],
[[50, 30], [60, 30], [70, 30]],
[[-70, -50], [-60, -50], [-50, -50]],
[[50, -50], [60, -50], [70, -50]]];
  ROADS.kherson = [[[-50,-25],[-30,-25],[-10,-25],[10,-25],[30,-25],[50,-25]],[[-20,-50],[-20,-30],[-20,-10],[-20,10],[-20,30],[-20,50]],[[20,-50],[20,-30],[20,-10],[20,10],[20,30],[20,50]],[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[-50,-15],[-30,-15],[-10,-15],[10,-15],[30,-15],[50,-15]],[[-50,15],[-30,15],[-10,15],[10,15],[30,15],[50,15]],[[-50,-35],[-30,-35],[-10,-35],[10,-35],[30,-35]],[[-30,35],[-10,35],[10,35],[30,35],[50,35]],[[-50,-50],[-30,-30],[-10,-10],[10,10],[30,30],[50,50]],[[50,-50],[30,-30],[10,-10],[-10,10],[-30,30],[-50,50]]],
[[-60, -35], [-50, -30], [-40, -25]],
[[60, -35], [50, -30], [40, -25]],
[[-60, 35], [-50, 30], [-40, 25]],
[[60, 35], [50, 30], [40, 25]],
[[-60, -45], [-50, -35], [-40, -25]],
[[60, -45], [50, -35], [40, -25]],
[[-60, 45], [-50, 35], [-40, 25]],
[[60, 45], [50, 35], [40, 25]],
[[-30, 50], [-20, 45], [-10, 40]],
[[30, 50], [20, 45], [10, 40]]];
  ROADS.mariupol = [[[-50,50],[-50,30],[-50,10],[-50,-10],[-50,-30],[-50,-50]],[[-50,50],[-30,50],[-10,50],[10,50],[30,50],[50,50]],[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[50,50],[50,30],[50,10],[50,-10],[50,-30],[50,-50]],[[-50,30],[-30,30],[-10,30],[10,30],[30,30],[50,30]],[[-50,-30],[-30,-30],[-10,-30],[10,-30],[30,-30],[50,-30]],[[-50,-10],[-30,-10],[-10,0],[10,0],[30,10],[50,20]],[[-40,-40],[-40,-20],[-40,0],[-40,20],[-40,40]],[[40,-40],[40,-20],[40,0],[40,20],[40,40]],[[-50,40],[-30,40],[0,40],[30,40],[50,40]]],
[[-70, -50], [-60, -50], [-50, -50]],
[[70, -50], [60, -50], [50, -50]],
[[-70, 60], [-60, 60], [-50, 60]],
[[70, 60], [60, 60], [50, 60]],
[[-70, -30], [-60, -30], [-50, -30]],
[[70, -30], [60, -30], [50, -30]],
[[-70, 0], [-60, 0], [-50, 0]],
[[70, 0], [60, 0], [50, 0]],
[[-70, 30], [-60, 30], [-50, 30]],
[[70, 30], [60, 30], [50, 30]]];
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
[[60, -40], [50, -30], [40, -20]]];
  ROADS.chornobyl = [[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[-50,-50],[-30,-50],[-10,-50],[10,-50],[30,-50],[50,-50]],[[-50,-20],[-30,-20],[-10,-20],[10,-20],[30,-20],[50,-20]],[[-50,20],[-30,20],[-10,20],[10,20],[30,20],[50,20]],[[-50,-50],[-50,-30],[-50,-10],[-50,10],[-50,30],[-50,50]],[[50,-50],[50,-30],[50,-10],[50,10],[50,30],[50,50]],[[-20,-70],[0,-70],[20,-70]],[[-30,20],[-30,0],[-30,-20],[-30,-40]],[[-50,50],[-30,30],[-10,10],[10,-10],[30,-30],[50,-50]]],
[[-70, -70], [-50, -70], [-30, -70]],
[[70, -70], [50, -70], [30, -70]],
[[-70, 70], [-50, 70], [-30, 70]],
[[70, 70], [50, 70], [30, 70]],
[[-70, -40], [-50, -40], [-30, -40]],
[[70, -40], [50, -40], [30, -40]],
[[-70, 40], [-50, 40], [-30, 40]],
[[70, 40], [50, 40], [30, 40]],
[[-70, 0], [-50, 0], [-30, 0]],
[[70, 0], [50, 0], [30, 0]]];
  ROADS.moscow = [[[0,-50],[0,-30],[0,-10],[0,0],[0,10],[0,30],[0,50]],[[-50,0],[-30,0],[-10,0],[0,0],[10,0],[30,0],[50,0]],[[-30,30],[-10,30],[10,30],[30,30]],[[-50,-20],[-25,-20],[0,-20],[25,-20],[50,-20]],[[-50,50],[-25,50],[0,50],[25,50],[50,50]],[[-50,-50],[-50,-25],[-50,0],[-50,25],[-50,50]],[[50,-50],[50,-25],[50,0],[50,25],[50,50]],[[-50,-50],[-25,-50],[0,-50],[25,-50],[50,-50]],[[-40,-20],[-30,-10],[-20,0],[-10,10],[0,20]],[[-35,-40],[-25,-30],[-15,-20],[-5,-10]]],
[[-70, -30], [-60, -20], [-50, -10]],
[[70, -30], [60, -20], [50, -10]],
[[-70, 30], [-60, 20], [-50, 10]],
[[70, 30], [60, 20], [50, 10]],
[[-70, -50], [-60, -40], [-50, -30]],
[[70, -50], [60, -40], [50, -30]],
[[-70, 50], [-60, 40], [-50, 30]],
[[70, 50], [60, 40], [50, 30]],
[[-70, 0], [-60, 0], [-50, 0]],
[[70, 0], [60, 0], [50, 0]]];
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
[[70, 20], [60, 20], [50, 20]]];
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
[[70, 0], [60, 0], [50, 0]]];
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
[[70, 0], [60, 0], [50, 0]]];
  ROADS.kremlin = [[[0,-50],[0,-30],[0,-10],[0,10],[0,30],[0,50]],[[-50,0],[-30,0],[-10,0],[10,0],[30,0],[50,0]],[[0,-50],[0,-35],[0,-20],[-10,-10],[-20,0]],[[-20,-20],[0,-20],[20,-20],[20,0],[20,20],[0,20],[-20,20],[-20,0]],[[-50,-35],[-25,-35],[0,-35],[25,-35],[50,-35]],[[-50,35],[-25,35],[0,35],[25,35],[50,35]],[[-50,-50],[-50,-25],[-50,0],[-50,25],[-50,50]],[[50,-50],[50,-25],[50,0],[50,25],[50,50]],[[-30,-30],[-30,0],[-30,30],[0,30],[30,30],[30,0],[30,-30],[0,-30]],[[-50,-50],[-50,0],[-50,50],[0,50],[50,50],[50,0],[50,-50],[0,-50]]],
[[-70, -50], [-60, -40], [-50, -30]],
[[70, -50], [60, -40], [50, -30]],
[[-70, 50], [-60, 40], [-50, 30]],
[[70, 50], [60, 40], [50, 30]],
[[-70, -20], [-60, -20], [-50, -20]],
[[70, -20], [60, -20], [50, -20]],
[[-70, 20], [-60, 20], [-50, 20]],
[[70, 20], [60, 20], [50, 20]],
[[-70, -50], [-70, 0], [-70, 50]],
[[70, -50], [70, 0], [70, 50]]];
  ROADS.kyiv = [[[-50,0],[-30,0],[-10,0],[0,0],[10,0],[30,0],[50,0]],[[0,-50],[0,-30],[0,-10],[0,10],[0,30]],[[15,-50],[15,-30],[15,-10],[15,10],[15,30]],[[45,-50],[45,-30],[45,-10],[45,10],[45,30],[45,50]],[[-18,-50],[-18,-30],[-18,-10],[-18,10]],[[-20,-15],[-22,-5],[-25,5],[-28,15]],[[10,10],[15,15],[20,20],[25,30],[28,40]],[[-50,-20],[-35,-20],[-20,-18],[-15,-15]],[[30,-20],[40,-10],[45,0],[48,20],[50,40]],[[-10,30],[10,30],[25,30],[40,30],[50,30]]],
[[-70, -30], [-60, -20], [-50, -10]],
[[70, -30], [60, -20], [50, -10]],
[[-70, 30], [-60, 20], [-50, 10]],
[[70, 30], [60, 20], [50, 10]],
[[-70, -50], [-60, -40], [-50, -30]],
[[70, -50], [60, -40], [50, -30]],
[[-70, 50], [-60, 40], [-50, 30]],
[[70, 50], [60, 40], [50, 30]],
[[-70, 0], [-60, 0], [-50, 0]],
[[70, 0], [60, 0], [50, 0]]];
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
[[-5, 15], [0, 10], [5, 5]]];
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
[[70, 0], [60, 0], [50, 0]]];
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
[[70, 0], [60, 0], [50, 0]]];
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
[[70, 0], [60, 0], [50, 0]]];
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
[[70, 0], [60, 0], [50, 0]]];
  ROADS.treeline = [[[-30,-30],[-20,-20],[-10,-10],[0,0],[10,10],[20,20]],[[-30,30],[-20,20],[-10,10],[0,0],[10,-10],[20,-20]],[[-30,0],[-20,0],[-10,0],[0,0],[10,0],[20,0]],[[0,-30],[0,-20],[0,-10],[0,0],[0,10],[0,20]],[[-20,-20],[0,-20],[20,-20]],[[-20,20],[0,20],[20,20]],[[-20,-20],[-20,0],[-20,20]],[[20,-20],[20,0],[20,20]],[[-40,-10],[-30,-10],[-20,-10]],[[20,10],[30,10],[40,10]]],
[[-50, -40], [-40, -30], [-30, -20]],
[[50, -40], [40, -30], [30, -20]],
[[-50, 40], [-40, 30], [-30, 20]],
[[50, 40], [40, 30], [30, 20]],
[[-50, -50], [-30, -30], [-10, -10]],
[[50, -50], [30, -30], [10, -10]],
[[-50, 50], [-30, 30], [-10, 10]],
[[50, 50], [30, 30], [10, 10]],
[[-40, 0], [-20, 0], [0, 0]],
[[40, 0], [20, 0], [0, 0]]];
  ROADS.siegeMoscow = [[[0,-60],[0,-40],[0,-20],[0,0],[0,20],[0,40],[0,60]],[[-60,0],[-40,0],[-20,0],[0,0],[20,0],[40,0],[60,0]],[[0,-60],[-10,-50],[-20,-40],[-30,-30]],[[-30,-30],[-30,0],[-30,30],[0,30],[30,30],[30,0],[30,-30],[0,-30]],[[-50,-50],[-50,0],[-50,50],[0,50],[50,50],[50,0],[50,-50],[0,-50]],[[-60,-40],[-30,-40],[0,-40],[30,-40],[60,-40]],[[-60,40],[-30,40],[0,40],[30,40],[60,40]],[[-40,-60],[-40,-30],[-40,0],[-40,30],[-40,60]],[[40,-60],[40,-30],[40,0],[40,30],[40,60]],[[-60,-60],[-60,0],[-60,60],[0,60],[60,60],[60,0],[60,-60],[0,-60]]],
[[-70, -60], [-60, -50], [-50, -40]],
[[70, -60], [60, -50], [50, -40]],
[[-70, 60], [-60, 50], [-50, 40]],
[[70, 60], [60, 50], [50, 40]],
[[-70, -30], [-60, -30], [-50, -30]],
[[70, -30], [60, -30], [50, -30]],
[[-70, 30], [-60, 30], [-50, 30]],
[[70, 30], [60, 30], [50, 30]],
[[-70, 0], [-60, 0], [-50, 0]],
[[70, 0], [60, 0], [50, 0]]];

  // ── Map stage names to city keys ──────────────────────────
  const STAGE_MAP = { HOSTOMEL:'hostomel', AVDIIVKA:'avdiivka', BAKHMUT:'bakhmut', KHERSON:'kherson', MARIUPOL:'mariupol', CRIMEA:'crimea', CHORNOBYL:'chornobyl', MOSCOW:'moscow', SEVASTOPOL:'sevastopol', DONBAS:'donbas', BELGOROD:'belgorod', KREMLIN:'kremlin', KYIV:'kyiv', SNAKE:'snakeIsland', SAKY:'saky', VUHLEDAR:'vuhledar', ANTONOV:'antonov', REFINERY:'refinery', TREELINE:'treeline', SIEGE:'siegeMoscow' };

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
    officeBuilding: officeBuilding, controlTower: controlTower, monument: monument,
    bridge: bridge, radarStation: radarStation, bunker: bunker,
    ruinedBuilding: ruinedBuilding, school: school,
    trenchLine: trenchLine, dugout: dugout, wheatField: wheatField, dragonsTeeth: dragonsTeeth,
    smokestack: smokestack, damagedBuilding: damagedBuilding, sandbagWall: sandbagWall,
    observationPost: observationPost, flareStack: flareStack, lighthouse: lighthouse,
    barricade: barricade, tankTrap: tankTrap, propagandaBillboard: propagandaBillboard,
    mineHeadframe: mineHeadframe, spoilTip: spoilTip, portCrane: portCrane,
    metroEntrance: metroEntrance, fountain: fountain,
  };
})();
if (typeof window !== 'undefined') { window.CityBuildings = CityBuildings; }
