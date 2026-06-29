/* ============================================================
   CITY-BUILDINGS.JS — Realistic city building blueprints based on
   actual Ukrainian / Russian city landmarks and architecture.
   
   Each city has 30+ building placements with real landmark references.
   Buildings are positioned relative to city center (0,0).
   The voxel-world generator will place them on actual terrain.
   ============================================================ */

const CityBuildings = (function () {
  'use strict';

  // ── Building block palette ────────────────────────────────
  const PAL = {
    AIR: 0,        CONCRETE: 9,   BRICK: 10,    GLASS: 11,    WOOD: 4,
    METAL: 5,      STONE: 3,    PLASTER: 20,  ROOFTILE: 19,
    ASPHALT: 18,   SAND: 7,      DIRT: 1,      GRASS: 2,
    REINFORCED: 14, FENCE: 15,   RUBBLE: 16,   SANDBAG: 17,
    CAR: 28,       DOOR: 29,     BLUE_TILE: 64, WHITE_TILE: 65,
    LIGHT: 27,     BUSH: 26,     FLAG: 38,     BANNER: 39,
    UKR_BLUE: 66,  UKR_YELLOW: 67, UKR_FLAG: 68, UKR_BANNER: 69,
    TRYZUB: 70,    UKR_VEHICLE: 71,
  };

  // ── Building shape templates (voxel dimensions) ─────────
  // Each template returns a function: (ox, oz, groundY) => void
  // that draws the building at the given origin.

  function sovietApartment(ox, oz, gy, w, d, floors, damage) {
    // Standard Soviet panel building (Хрущёвка / Брежневка)
    var h = floors * 3 + 1; // 3 blocks per floor + roof
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          var isFloor = y % 3 === 0 && y > 0 && y < h - 1;
          if (isWall || isRoof || isFloor) {
            var bt = PAL.CONCRETE;
            if (isRoof) bt = PAL.ROOFTILE;
            else if (y === 0) bt = PAL.BRICK; // foundation
            else if (x === 0 || x === w - 1) bt = PAL.PLASTER; // facade
            // Damage: skip some blocks for ruined look
            if (damage > 0 && Math.random() < damage * 0.15) continue;
            setBlock(ox + x, gy + y, oz + z, bt);
          }
          // Windows on upper floors (every other floor, front/back)
          if (isWall && !isRoof && !isFloor && y > 0) {
            if ((y % 3 === 1 || y % 3 === 2) && (x % 3 === 1 || z % 3 === 1)) {
              if (Math.random() > 0.3) {
                setBlock(ox + x, gy + y, oz + z, PAL.GLASS);
              }
            }
          }
        }
      }
    }
    // Balconies on front face
    for (var f = 1; f < floors; f++) {
      var by = gy + f * 3 + 1;
      for (var bx = 1; bx < w - 1; bx++) {
        if (bx % 3 === 1) {
          setBlock(ox + bx, by, oz + d, PAL.CONCRETE);
          setBlock(ox + bx, by, oz + d + 1, PAL.FENCE);
        }
      }
    }
    // Entry door
    setBlock(ox + Math.floor(w / 2), gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2), gy + 1, oz, PAL.AIR);
  }

  function orthodoxChurch(ox, oz, gy, w, d, h) {
    // Central nave + 4 corner towers + onion domes
    var cx = ox + Math.floor(w / 2), cz = oz + Math.floor(d / 2);
    // Main body
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = (y === 0) ? PAL.STONE : PAL.BRICK;
            if (y > h - 3) bt = PAL.PLASTER; // upper walls white
            setBlock(ox + x, gy + y, oz + z, bt);
          }
        }
      }
    }
    // Corner towers (4)
    var towerSize = 3;
    var towers = [
      [0, 0], [w - towerSize, 0],
      [0, d - towerSize], [w - towerSize, d - towerSize]
    ];
    for (var ti = 0; ti < towers.length; ti++) {
      var tx = ox + towers[ti][0], tz = oz + towers[ti][1];
      for (var y = 0; y < h + 4; y++) {
        for (var x = 0; x < towerSize; x++) {
          for (var z = 0; z < towerSize; z++) {
            var isWall = x === 0 || x === towerSize - 1 || z === 0 || z === towerSize - 1;
            if (isWall) setBlock(tx + x, gy + y, tz + z, PAL.BRICK);
          }
        }
      }
      // Onion dome on tower
      var domeY = gy + h + 4;
      setBlock(tx + 1, domeY, tz + 1, PAL.METAL); // gold dome
      setBlock(tx + 1, domeY + 1, tz + 1, PAL.METAL);
      setBlock(tx, domeY, tz + 1, PAL.METAL);
      setBlock(tx + 2, domeY, tz + 1, PAL.METAL);
      setBlock(tx + 1, domeY, tz, PAL.METAL);
      setBlock(tx + 1, domeY, tz + 2, PAL.METAL);
      // Cross
      setBlock(tx + 1, domeY + 2, tz + 1, PAL.METAL);
    }
    // Central dome (larger)
    var domeY = gy + h + 2;
    for (var dx = -2; dx <= 2; dx++) {
      for (var dz = -2; dz <= 2; dz++) {
        for (var dy = 0; dy < 3; dy++) {
          if (Math.abs(dx) + Math.abs(dz) + dy <= 3) {
            setBlock(cx + dx, domeY + dy, cz + dz, PAL.METAL);
          }
        }
      }
    }
    // Entry
    setBlock(cx, gy, oz + d - 1, PAL.AIR);
    setBlock(cx, gy + 1, oz + d - 1, PAL.AIR);
    setBlock(cx, gy + 2, oz + d - 1, PAL.AIR); // tall arch
  }

  function industrialFactory(ox, oz, gy, w, d, h) {
    // Large industrial hall with sawtooth roof
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = PAL.METAL;
            if (y === 0) bt = PAL.CONCRETE;
            // Sawtooth roof pattern
            if (isRoof) {
              var saw = (x + z) % 4 < 2;
              bt = saw ? PAL.METAL : PAL.GLASS; // skylights
            }
            setBlock(ox + x, gy + y, oz + z, bt);
          }
        }
      }
    }
    // Smokestacks
    var sx = ox + Math.floor(w / 3), sz = oz + Math.floor(d / 2);
    for (var y = 0; y < h + 8; y++) {
      setBlock(sx, gy + y, sz, PAL.BRICK);
      setBlock(sx + 1, gy + y, sz, PAL.BRICK);
      setBlock(sx, gy + y, sz + 1, PAL.BRICK);
      setBlock(sx + 1, gy + y, sz + 1, PAL.BRICK);
    }
    // Large doors
    setBlock(ox + Math.floor(w / 2), gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2), gy + 1, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2) + 1, gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2) + 1, gy + 1, oz, PAL.AIR);
  }

  function airportTerminal(ox, oz, gy, w, d, h) {
    // Long rectangular terminal with glass front
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = PAL.CONCRETE;
            if (z === 0 && x > 2 && x < w - 3 && y > 0 && y < h - 1) {
              bt = PAL.GLASS; // glass front
            }
            setBlock(ox + x, gy + y, oz + z, bt);
          }
        }
      }
    }
    // Control tower at one end
    var tx = ox + w - 3, tz = oz + 2;
    for (var y = 0; y < h + 6; y++) {
      for (var x = 0; x < 3; x++) {
        for (var z = 0; z < 3; z++) {
          var isWall = x === 0 || x === 2 || z === 0 || z === 2;
          if (isWall) setBlock(tx + x, gy + y, tz + z, PAL.CONCRETE);
        }
      }
    }
    // Tower observation deck (glass)
    for (var x = 0; x < 3; x++) {
      for (var z = 0; z < 3; z++) {
        setBlock(tx + x, gy + h + 4, tz + z, PAL.GLASS);
      }
    }
  }

  function hangar(ox, oz, gy, w, d, h) {
    // Aircraft hangar with arched roof
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var archHeight = Math.sin((x / (w - 1)) * Math.PI) * (h - 2);
          var isRoof = y >= archHeight && y < h;
          if (isWall || isRoof) {
            setBlock(ox + x, gy + y, oz + z, PAL.METAL);
          }
        }
      }
    }
    // Large sliding doors on both ends
    for (var x = Math.floor(w / 3); x < Math.floor(w * 2 / 3); x++) {
      setBlock(ox + x, gy, oz, PAL.AIR);
      setBlock(ox + x, gy + 1, oz, PAL.AIR);
      setBlock(ox + x, gy, oz + d - 1, PAL.AIR);
      setBlock(ox + x, gy + 1, oz + d - 1, PAL.AIR);
    }
  }

  function controlTower(ox, oz, gy, w, d, h) {
    // Standalone airport control tower with observation cab
    // Shaft
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          if (isWall) {
            setBlock(ox + x, gy + y, oz + z, y < h - 4 ? PAL.CONCRETE : PAL.REINFORCED);
          }
        }
      }
    }
    // Observation cab (glass-enclosed, wider than shaft)
    var cabY = gy + h - 4;
    var cabOverhang = 2;
    for (var cx = -cabOverhang; cx < w + cabOverhang; cx++) {
      for (var cz = -cabOverhang; cz < d + cabOverhang; cz++) {
        for (var cy = 0; cy < 4; cy++) {
          var isCabWall = cx === -cabOverhang || cx === w + cabOverhang - 1 || cz === -cabOverhang || cz === d + cabOverhang - 1;
          var isCabRoof = cy === 3;
          if (isCabWall || isCabRoof) {
            var bt = isCabRoof ? PAL.CONCRETE : PAL.GLASS;
            setBlock(ox + cx, cabY + cy, oz + cz, bt);
          }
        }
      }
    }
    // Radar/antenna on top
    var topY = gy + h + 1;
    for (var ay = 0; ay < 4; ay++) {
      setBlock(ox + Math.floor(w / 2), topY + ay, oz + Math.floor(d / 2), PAL.METAL);
    }
    // Cross-shaped antenna
    setBlock(ox + Math.floor(w / 2) - 1, topY + 2, oz + Math.floor(d / 2), PAL.METAL);
    setBlock(ox + Math.floor(w / 2) + 1, topY + 2, oz + Math.floor(d / 2), PAL.METAL);
    setBlock(ox + Math.floor(w / 2), topY + 2, oz + Math.floor(d / 2) - 1, PAL.METAL);
    setBlock(ox + Math.floor(w / 2), topY + 2, oz + Math.floor(d / 2) + 1, PAL.METAL);
    // Damage: skip some blocks for destroyed look
    for (var dmg = 0; dmg < 3; dmg++) {
      var dmgX = ox + Math.floor(Math.random() * w);
      var dmgY = gy + Math.floor(Math.random() * h);
      var dmgZ = oz + Math.floor(Math.random() * d);
      setBlock(dmgX, dmgY, dmgZ, PAL.AIR);
    }
  }

  function warehouse(ox, oz, gy, w, d, h) {
    // Simple warehouse with corrugated metal walls
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            setBlock(ox + x, gy + y, oz + z, PAL.METAL);
          }
        }
      }
    }
    // Loading dock
    for (var x = 0; x < w; x++) {
      setBlock(ox + x, gy, oz + d, PAL.CONCRETE);
    }
    // Door
    setBlock(ox + Math.floor(w / 2), gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2), gy + 1, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2) + 1, gy, oz, PAL.AIR);
    setBlock(ox + Math.floor(w / 2) + 1, gy + 1, oz, PAL.AIR);
  }

  function officeBuilding(ox, oz, gy, w, d, floors) {
    // Modern/USSR office tower with glass curtain walls
    var h = floors * 3 + 1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            var bt = PAL.CONCRETE;
            if (isWall && y > 0 && y < h - 1) {
              // Curtain wall pattern: vertical concrete mullions, glass panels
              if (x % 2 === 0 || z % 2 === 0) bt = PAL.CONCRETE;
              else bt = PAL.GLASS;
            }
            setBlock(ox + x, gy + y, oz + z, bt);
          }
        }
      }
    }
    // Entrance canopy
    for (var x = -1; x < w + 1; x++) {
      setBlock(ox + x, gy + 2, oz + d, PAL.CONCRETE);
    }
    // Revolving door
    setBlock(ox + Math.floor(w / 2), gy, oz + d - 1, PAL.AIR);
    setBlock(ox + Math.floor(w / 2), gy + 1, oz + d - 1, PAL.AIR);
  }

  function monument(ox, oz, gy, type) {
    // Various monument types
    if (type === 'obelisk') {
      for (var y = 0; y < 12; y++) {
        var sz = Math.max(1, 2 - Math.floor(y / 4));
        for (var x = -sz; x <= sz; x++) {
          for (var z = -sz; z <= sz; z++) {
            setBlock(ox + x, gy + y, oz + z, PAL.STONE);
          }
        }
      }
      // Star on top
      setBlock(ox, gy + 12, oz, PAL.METAL);
      setBlock(ox + 1, gy + 12, oz, PAL.METAL);
      setBlock(ox - 1, gy + 12, oz, PAL.METAL);
      setBlock(ox, gy + 12, oz + 1, PAL.METAL);
      setBlock(ox, gy + 12, oz - 1, PAL.METAL);
      setBlock(ox, gy + 13, oz, PAL.METAL);
    } else if (type === 'tank') {
      // Tank monument on pedestal
      for (var y = 0; y < 3; y++) {
        for (var x = -2; x <= 2; x++) {
          for (var z = -2; z <= 2; z++) {
            setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE);
          }
        }
      }
      // Simplified tank shape
      for (var x = -2; x <= 2; x++) {
        for (var z = -3; z <= 3; z++) {
          setBlock(ox + x, gy + 3, oz + z, PAL.METAL);
        }
      }
      // Turret
      for (var x = -1; x <= 1; x++) {
        for (var z = -1; z <= 1; z++) {
          setBlock(ox + x, gy + 4, oz + z, PAL.METAL);
        }
      }
      // Barrel
      for (var z = 0; z < 5; z++) {
        setBlock(ox, gy + 4, oz + 2 + z, PAL.METAL);
      }
    } else if (type === 'motherland') {
      // Sword-wielding figure (simplified)
      for (var y = 0; y < 15; y++) {
        var sz = Math.max(0, 3 - Math.floor(y / 3));
        for (var x = -sz; x <= sz; x++) {
          for (var z = -sz; z <= sz; z++) {
            setBlock(ox + x, gy + y, oz + z, PAL.STONE);
          }
        }
      }
      // Sword
      for (var y = 5; y < 18; y++) {
        setBlock(ox + 2, gy + y, oz, PAL.METAL);
      }
      // Shield
      for (var x = -2; x <= 0; x++) {
        for (var y = 6; y < 12; y++) {
          setBlock(ox + x, gy + y, oz - 1, PAL.METAL);
        }
      }
    }
  }

  function bridge(ox, oz, gy, length, width, height) {
    // Road bridge with pillars
    for (var x = 0; x < length; x++) {
      for (var z = 0; z < width; z++) {
        setBlock(ox + x, gy + height, oz + z, PAL.ASPHALT);
        // Guardrails
        if (z === 0 || z === width - 1) {
          setBlock(ox + x, gy + height + 1, oz + z, PAL.METAL);
        }
      }
      // Pillars every 8 blocks
      if (x % 8 === 0) {
        for (var y = 0; y < height; y++) {
          for (var z = 0; z < width; z++) {
            setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE);
          }
        }
      }
    }
  }

  function radarStation(ox, oz, gy) {
    // Military radar station with dish
    // Building
    for (var y = 0; y < 4; y++) {
      for (var x = -2; x <= 2; x++) {
        for (var z = -2; z <= 2; z++) {
          var isWall = Math.abs(x) === 2 || Math.abs(z) === 2;
          if (isWall || y === 3) setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE);
        }
      }
    }
    // Dish mount
    for (var y = 4; y < 8; y++) {
      setBlock(ox, gy + y, oz, PAL.METAL);
    }
    // Parabolic dish
    for (var dx = -3; dx <= 3; dx++) {
      for (var dz = -3; dz <= 3; dz++) {
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= 3 && dist >= 1) {
          var dy = Math.floor(dist * 0.8);
          setBlock(ox + dx, gy + 8 - dy, oz + dz, PAL.METAL);
        }
      }
    }
  }

  function bunker(ox, oz, gy) {
    // Underground bunker with surface entrance
    for (var y = 0; y < 3; y++) {
      for (var x = -3; x <= 3; x++) {
        for (var z = -3; z <= 3; z++) {
          var isWall = Math.abs(x) === 3 || Math.abs(z) === 3 || y === 0 || y === 2;
          if (isWall) setBlock(ox + x, gy + y - 2, oz + z, PAL.CONCRETE);
          else setBlock(ox + x, gy + y - 2, oz + z, PAL.AIR); // hollow interior
        }
      }
    }
    // Surface entrance structure
    for (var y = 0; y < 3; y++) {
      for (var x = -1; x <= 1; x++) {
        for (var z = -1; z <= 1; z++) {
          setBlock(ox + x, gy + y, oz + z, PAL.CONCRETE);
        }
      }
    }
    // Door
    setBlock(ox, gy, oz + 1, PAL.AIR);
    setBlock(ox, gy + 1, oz + 1, PAL.AIR);
    // Sandbag perimeter
    for (var sx = -4; sx <= 4; sx++) {
      setBlock(ox + sx, gy, oz - 4, PAL.SANDBAG);
      setBlock(ox + sx, gy, oz + 4, PAL.SANDBAG);
    }
    for (var sz = -4; sz <= 4; sz++) {
      setBlock(ox - 4, gy, oz + sz, PAL.SANDBAG);
      setBlock(ox + 4, gy, oz + sz, PAL.SANDBAG);
    }
  }

  function ruinedBuilding(ox, oz, gy, w, d, h, collapse) {
    // Building with partial collapse / damage
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        for (var z = 0; z < d; z++) {
          var isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          var isRoof = y === h - 1;
          if (isWall || isRoof) {
            // Skip blocks for ruined look
            if (collapse > 0) {
              var distFromCorner = Math.min(x + z, (w - x) + z, x + (d - z), (w - x) + (d - z));
              if (distFromCorner < collapse * 3 && Math.random() < 0.6) continue;
            }
            var bt = (y === 0) ? PAL.BRICK : PAL.CONCRETE;
            if (y > h - 2 && Math.random() < 0.4) bt = PAL.RUBBLE; // damaged roof
            setBlock(ox + x, gy + y, oz + z, bt);
          }
        }
      }
    }
  }

  // ── City Building Blueprints ────────────────────────────────
  // Each city has an array of { type, params, x, z, note }
  // x,z are relative to city center; generator will place on actual terrain

  const CITIES = {};

  // ═══════════════════════════════════════════════════════════
  // 1. HOSTOMEL AIRPORT (Kyiv region) — Antonov Airport / Gostomel
  // Historical references:
  //   • Built 1959, 3.5 km runway (one of Europe's longest), 56 m wide
  //   • Home of Antonov Design Bureau and An-225 Mriya
  //   • Feb 24 2022: ~34 Russian helicopters (Ka-52/Mi-8) assaulted with VDV
  //   • 4th Rapid Reaction Brigade (National Guard) defended with ~200-300 men
  //   • An-225 Mriya destroyed in Hangar 1 on/after Feb 27 2022
  //   • Control tower and administration building destroyed
  //   • Intense fighting south of hangars, front line on division road
  //   • 40% of Hostomel town buildings destroyed (~4,500 of 11,800)
  // ═══════════════════════════════════════════════════════════
  CITIES.hostomel = [
    // ── Airport core buildings (north of town, west of Kyiv) ──
    { type: 'airportTerminal', params: [40, 14, 6], x: -15, z: -25, note: 'Antonov Airport Terminal (admin building, partially destroyed)' },
    { type: 'hangar', params: [32, 22, 14], x: -35, z: 10, note: 'Hangar 1 — An-225 Mriya (destroyed Feb 27, 2022)' },
    { type: 'hangar', params: [28, 18, 10], x: 5, z: 12, note: 'Hangar 2 — An-124 Ruslan / Antonov offices' },
    { type: 'hangar', params: [24, 14, 8], x: 40, z: 8, note: 'Hangar 3 — An-22 Antei / museum storage' },
    { type: 'controlTower', params: [4, 4, 22], x: 25, z: -20, note: 'ATC Tower (destroyed by shelling, Feb 2022)' },
    { type: 'officeBuilding', params: [12, 10, 4], x: -5, z: -45, note: 'Antonov Administration Building (destroyed)' },
    { type: 'warehouse', params: [15, 10, 4], x: 35, z: 15, note: 'Cargo Warehouse' },
    { type: 'warehouse', params: [12, 8, 3], x: 35, z: -5, note: 'Aviation Museum / Spare Parts' },
    { type: 'industrialFactory', params: [18, 12, 5], x: -45, z: -15, note: 'Maintenance Workshop' },
    { type: 'warehouse', params: [14, 10, 4], x: -50, z: 25, note: 'Fuel Depot' },

    // ── Battlefield — VDV assault aftermath (Feb 24-25, 2022) ──
    { type: 'monument', params: ['tank'], x: 0, z: 35, note: 'Destroyed BMD-2 VDV vehicle' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 2.5], x: -15, z: 25, note: 'VDV Mi-8 helicopter wreck (shot down by MANPADS)' },
    { type: 'ruinedBuilding', params: [8, 6, 3, 2.0], x: 15, z: 30, note: 'Burned Russian supply truck' },
    { type: 'ruinedBuilding', params: [6, 4, 2, 1.0], x: 5, z: 45, note: 'BTR wreckage from Ukrainian counter-attack' },
    { type: 'bunker', params: [], x: -20, z: -5, note: 'Ukrainian National Guard trench (4th Rapid Reaction Brigade)' },
    { type: 'bunker', params: [], x: 20, z: -5, note: 'Ukrainian ZU-23-2 anti-air position' },
    { type: 'bunker', params: [], x: 0, z: 20, note: 'Front line trench — division road (Feb 24, 2022)' },
    { type: 'bunker', params: [], x: -35, z: 35, note: 'VDV landing zone foxhole' },
    { type: 'radarStation', params: [], x: 30, z: -40, note: 'Airport radar station' },

    // ── Aircraft destroyed / damaged on the apron ──
    { type: 'ruinedBuilding', params: [14, 10, 4, 2.0], x: -30, z: 45, note: 'An-74 wreckage (destroyed on apron)' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: 10, z: 50, note: 'An-26 wreckage (destroyed on apron)' },
    { type: 'monument', params: ['tank'], x: -50, z: 50, note: 'An-22 Antei memorial wreck' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: -10, z: 55, note: 'Damaged An-124 hangar' },

    // ── Town of Hostomel (south-east of airport, ~17,000 pop) ──
    { type: 'sovietApartment', params: [16, 8, 5, 0.4], x: 50, z: 25, note: 'Soviet apartment (damaged by shelling)' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: 65, z: 15, note: 'Soviet apartment block' },
    { type: 'sovietApartment', params: [14, 7, 4, 0.5], x: 55, z: 40, note: 'Residential block (heavily damaged — 40% of Hostomel destroyed)' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 70, z: 30, note: 'Soviet apartment block' },
    { type: 'officeBuilding', params: [10, 8, 4], x: 60, z: -10, note: 'Hostomel Town Hall' },
    { type: 'warehouse', params: [12, 8, 3], x: 75, z: 20, note: 'Civilian warehouse' },
    { type: 'orthodoxChurch', params: [8, 10, 6], x: 45, z: -35, note: 'St. George Church' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 2.0], x: 80, z: 10, note: 'Destroyed school (4 schools damaged in Hostomel)' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.5], x: 50, z: 55, note: 'Ruined apartment block' },
    { type: 'monument', params: ['obelisk'], x: 65, z: -25, note: 'Hostomel War Memorial' },
    { type: 'bunker', params: [], x: 55, z: 5, note: 'Civil defense shelter' },
    { type: 'warehouse', params: [10, 8, 3], x: 85, z: 35, note: 'Shop (grocery store — 17 stores destroyed)' },
    { type: 'ruinedBuilding', params: [8, 6, 3, 1.5], x: 40, z: 50, note: 'Burned house' },
    { type: 'industrialFactory', params: [15, 10, 4], x: 75, z: -5, note: 'VETROPAK Glass Factory (damaged)' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.8], x: 90, z: 20, note: 'Destroyed kindergarten (2 kindergartens damaged)' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 2. AVDIIVKA (Donetsk region, industrial city)
  // ═══════════════════════════════════════════════════════════
  CITIES.avdiivka = [
    { type: 'industrialFactory', params: [40, 25, 8], x: -20, z: -20, note: 'Avdiivka Coke Plant (AKHZ) main hall — northwest industrial core' },
    { type: 'industrialFactory', params: [30, 15, 6], x: -55, z: -30, note: 'Coke Plant Hall 2 — northwest' },
    { type: 'industrialFactory', params: [25, 15, 6], x: 15, z: -30, note: 'Coke Plant Hall 3 — north' },
    { type: 'industrialFactory', params: [20, 12, 5], x: -20, z: -50, note: 'Chemical processing — north of plant' },
    { type: 'warehouse', params: [30, 12, 5], x: -60, z: 5, note: 'Coal storage — west of plant' },
    { type: 'warehouse', params: [25, 10, 5], x: 15, z: 5, note: 'Product warehouse — east of plant' },
    { type: 'sovietApartment', params: [18, 9, 6, 0.5], x: 10, z: -20, note: 'Apartment block (damaged) — southeast of plant' },
    { type: 'sovietApartment', params: [18, 9, 6, 0.6], x: 30, z: -25, note: 'Apartment block (heavily damaged) — southeast' },
    { type: 'sovietApartment', params: [18, 9, 5, 0.4], x: 50, z: -30, note: 'Apartment block (ruined) — southeast' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: 15, z: -40, note: 'Apartment block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.5], x: 35, z: -35, note: 'Apartment block (damaged) — south' },
    { type: 'sovietApartment', params: [16, 8, 4, 0.2], x: 55, z: -25, note: 'Apartment block — far southeast' },
    { type: 'sovietApartment', params: [14, 7, 4, 0.3], x: -65, z: -10, note: 'Small apartment — west of plant' },
    { type: 'sovietApartment', params: [14, 7, 4, 0.4], x: 65, z: -10, note: 'Small apartment (damaged) — far east' },
    { type: 'officeBuilding', params: [10, 8, 4], x: 0, z: 20, note: 'City administration — south of industrial zone' },
    { type: 'school', params: [12, 10, 3], x: 20, z: 20, note: 'School No. 1 (destroyed) — south' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: 40, z: 20, note: 'Church of the Annunciation — south residential' },
    { type: 'warehouse', params: [12, 8, 3], x: 60, z: 20, note: 'Market warehouse — southeast' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.5], x: 80, z: 20, note: 'Ruined shop — southeast' },
    { type: 'bunker', params: [], x: -40, z: -20, note: 'Plant shelter — AKHZ underground' },
    { type: 'bunker', params: [], x: 0, z: -20, note: 'Underground control room — AKHZ' },
    { type: 'monument', params: ['obelisk'], x: 70, z: 0, note: 'Labor monument — east' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0], x: -45, z: 10, note: 'Ruined factory office — west of plant' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5], x: 50, z: -40, note: 'Ruined house — south' },
    { type: 'industrialFactory', params: [15, 10, 4], x: -30, z: 10, note: 'Brick factory — west' },
    { type: 'warehouse', params: [15, 10, 4], x: 0, z: 10, note: 'Ceramic storage — west' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 2.0], x: 30, z: 10, note: 'Destroyed dormitory — southwest' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2], x: -70, z: 0, note: 'Workers housing — far west' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 2.5], x: 75, z: 15, note: 'Destroyed hospital — southeast' },
    { type: 'bunker', params: [], x: -20, z: 0, note: 'Civil defense bunker — center' },
    { type: 'monument', params: ['tank'], x: -60, z: -50, note: 'WWII tank monument — northwest' },
    { type: 'radarStation', params: [], x: 65, z: -45, note: 'EW radar station — northeast' },
  ];;

  // ═══════════════════════════════════════════════════════════
  // 3. BAKHMUT (Donetsk region, heavily destroyed)
  // ═══════════════════════════════════════════════════════════
  CITIES.bakhmut = [
    { type: 'ruinedBuilding', params: [18, 10, 6, 3.0], x: 0, z: 0, note: 'Bakhmut Fortress ruins — central market and embankment area' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5], x: -20, z: -15, note: 'Ruined apartment — west of fortress' },
    { type: 'ruinedBuilding', params: [16, 9, 6, 2.8], x: 20, z: -15, note: 'Ruined apartment — east of fortress' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: -35, z: -5, note: 'Ruined office — north of center' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5], x: 35, z: -5, note: 'Ruined school — north of center' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 2.0], x: -15, z: 15, note: 'Ruined shop — south of center' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.2], x: 15, z: 15, note: 'Ruined market — south of center' },
    { type: 'ruinedBuilding', params: [16, 10, 6, 3.0], x: -40, z: 10, note: 'Heavily damaged building — west' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5], x: 40, z: 10, note: 'Heavily damaged building — east' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5], x: -25, z: 30, note: 'Ruined house — southwest' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5], x: 25, z: 30, note: 'Ruined house — southeast' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: -50, z: -20, note: 'Ruined building — far west' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: 50, z: -20, note: 'Ruined building — far east' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5], x: -10, z: -30, note: 'Ruined apartment — north of center' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5], x: 10, z: -30, note: 'Ruined apartment — north of center' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0], x: -45, z: 25, note: 'Ruined shop — southwest' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0], x: 45, z: 25, note: 'Ruined shop — southeast' },
    { type: 'ruinedBuilding', params: [16, 10, 6, 2.8], x: 0, z: -45, note: 'Ruined hotel — north' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: -30, z: 40, note: 'Ruined building — southwest' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: 30, z: 40, note: 'Ruined building — southeast' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5], x: -50, z: 40, note: 'Ruined house — far southwest' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5], x: 50, z: 40, note: 'Ruined house — far southeast' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5], x: -20, z: -45, note: 'Ruined apartment — northwest' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5], x: 20, z: -45, note: 'Ruined apartment — northeast' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: -55, z: 0, note: 'Ruined building — west' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: 55, z: 0, note: 'Ruined building — east' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.8], x: -35, z: -35, note: 'Ruined building — northwest' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.8], x: 35, z: -35, note: 'Ruined building — northeast' },
    { type: 'monument', params: ['obelisk'], x: 0, z: 50, note: 'Damaged war memorial — south of center' },
    { type: 'bunker', params: [], x: 0, z: 0, note: 'Bakhmut shelter — fortress area' },
  ];;

  // ═══════════════════════════════════════════════════════════
  // 4. KHERSON (Dnipro river crossing, port city)
  // ═══════════════════════════════════════════════════════════
  CITIES.kherson = [
    { type: 'bridge', params: [40, 6, 4], x: 0, z: 40, note: 'Antonivsky Bridge — crosses Dnipro south of city' },
    { type: 'officeBuilding', params: [12, 10, 5], x: -30, z: -20, note: 'Port administration — Dnipro riverfront, west bank' },
    { type: 'warehouse', params: [25, 12, 5], x: -10, z: -25, note: 'Port warehouse — Dnipro riverfront' },
    { type: 'warehouse', params: [20, 10, 4], x: 15, z: -25, note: 'Cargo storage — Dnipro riverfront' },
    { type: 'industrialFactory', params: [20, 12, 5], x: 40, z: -20, note: 'Shipyard workshop — Dnipro riverfront' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -40, z: -10, note: 'Apartment block — west bank residential' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -20, z: -10, note: 'Apartment block — west bank' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 0, z: -10, note: 'Apartment block — city center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 20, z: -10, note: 'Apartment block — city center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 40, z: -10, note: 'Apartment block — east approach' },
    { type: 'officeBuilding', params: [10, 8, 4], x: -45, z: 10, note: 'City hall — central Kherson' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: -25, z: 10, note: 'St. Catherine Church — central Kherson' },
    { type: 'warehouse', params: [15, 10, 4], x: -5, z: 15, note: 'Market — central Kherson' },
    { type: 'warehouse', params: [12, 8, 4], x: 15, z: 15, note: 'Storage depot — central Kherson' },
    { type: 'officeBuilding', params: [10, 8, 4], x: 35, z: 15, note: 'Bank building — central Kherson' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -40, z: 30, note: 'Residential block — south of center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -20, z: 30, note: 'Residential block — south of center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 0, z: 30, note: 'Residential block — south of center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 20, z: 30, note: 'Residential block — south of center' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 40, z: 30, note: 'Residential block — south of center' },
    { type: 'monument', params: ['obelisk'], x: -50, z: 20, note: 'Suvorov monument — west of center' },
    { type: 'monument', params: ['obelisk'], x: 50, z: 20, note: 'Potemkin monument — east of center' },
    { type: 'warehouse', params: [15, 10, 4], x: -30, z: 45, note: 'Railway depot — south' },
    { type: 'warehouse', params: [15, 10, 4], x: -10, z: 45, note: 'Grain elevator — south' },
    { type: 'industrialFactory', params: [18, 12, 5], x: 15, z: 45, note: 'Factory — south industrial' },
    { type: 'warehouse', params: [12, 8, 4], x: 40, z: 45, note: 'Cold storage — south' },
    { type: 'bunker', params: [], x: -15, z: -5, note: 'River defense bunker — Dnipro embankment' },
    { type: 'bunker', params: [], x: 15, z: -5, note: 'Command bunker — Dnipro embankment' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 1.5], x: -50, z: -30, note: 'Damaged warehouse — port area' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.2], x: 50, z: -30, note: 'Damaged building — port area' },
  ];;

  // ═══════════════════════════════════════════════════════════
  // 5. MARIUPOL STEELWORKS (Azovstal industrial complex)
  // ═══════════════════════════════════════════════════════════
  CITIES.mariupol = [
    { type: 'industrialFactory', params: [50, 30, 10], x: 0, z: -20, note: 'Azovstal Blast Furnace Hall — north of center, industrial heart' },
    { type: 'industrialFactory', params: [40, 20, 8], x: -45, z: -25, note: 'Azovstal Rolling Mill 1 — northwest industrial zone' },
    { type: 'industrialFactory', params: [35, 18, 7], x: 45, z: -25, note: 'Azovstal Rolling Mill 2 — northeast industrial zone' },
    { type: 'industrialFactory', params: [30, 15, 6], x: -40, z: -45, note: 'Azovstal Coking Plant — north' },
    { type: 'industrialFactory', params: [30, 15, 6], x: 40, z: -45, note: 'Azovstal Sinter Plant — north' },
    { type: 'warehouse', params: [40, 15, 6], x: -50, z: -5, note: 'Raw Material Storage — west of Azovstal' },
    { type: 'warehouse', params: [35, 12, 5], x: 50, z: -5, note: 'Finished Steel Warehouse — east of Azovstal' },
    { type: 'industrialFactory', params: [25, 15, 5], x: 0, z: -50, note: 'Azovstal Converter Shop — north' },
    { type: 'industrialFactory', params: [20, 12, 5], x: -25, z: -10, note: 'Azovstal Pipe Mill' },
    { type: 'industrialFactory', params: [20, 12, 5], x: 25, z: -10, note: 'Azovstal Wire Mill' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.5], x: -60, z: 15, note: 'Damaged apartment (east) — residential near industrial zone' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.6], x: -60, z: 35, note: 'Heavily damaged apartment — east residential' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.7], x: -60, z: 55, note: 'Ruined apartment — east residential' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.5], x: 60, z: 15, note: 'Damaged apartment (west) — residential near coast' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.6], x: 60, z: 35, note: 'Heavily damaged apartment — west residential' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.7], x: 60, z: 55, note: 'Ruined apartment — west residential' },
    { type: 'ruinedBuilding', params: [14, 10, 5, 2.5], x: -20, z: 25, note: 'Ruined Drama Theater — city center, Freedom Square area' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: -5, z: 25, note: 'Ruined Kuindzhi Art Center — city center' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0], x: 15, z: 25, note: 'Ruined shop — city center' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: 30, z: 25, note: 'Ruined house — city center' },
    { type: 'ruinedBuilding', params: [14, 8, 5, 2.5], x: 45, z: 25, note: 'Ruined school — city center' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: -30, z: 50, note: 'St. Michael Cathedral (damaged) — near coast' },
    { type: 'monument', params: ['tank'], x: -20, z: 50, note: 'Tank monument — near Sea of Azov coast' },
    { type: 'warehouse', params: [15, 10, 4], x: 0, z: 50, note: 'Port warehouse — Sea of Azov coast' },
    { type: 'warehouse', params: [12, 8, 4], x: 20, z: 50, note: 'Harbor storage — Sea of Azov coast' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0], x: 40, z: 50, note: 'Ruined building — coastal area' },
    { type: 'bunker', params: [], x: -10, z: -10, note: 'Bunker under steelworks' },
    { type: 'bunker', params: [], x: 10, z: -10, note: 'Underground tunnel entrance — Azovstal' },
    { type: 'bunker', params: [], x: -10, z: 10, note: 'Shelter — industrial zone' },
    { type: 'bunker', params: [], x: 10, z: 10, note: 'Ammo storage — industrial zone' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: -55, z: -40, note: 'Ruined building — north industrial' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: 55, z: -40, note: 'Ruined building — north industrial' },
    { type: 'monument', params: ['obelisk'], x: 0, z: 60, note: 'Memorial — Sea of Azov coast' },
  ];;

  // ═══════════════════════════════════════════════════════════
  // 6. CRIMEA BRIDGE (Kerch Strait)
  // ═══════════════════════════════════════════════════════════
  CITIES.crimea = [
    { type: 'bridge', params: [60, 6, 3], x: -30, z: 0, note: 'Crimea Bridge (road)' },
    { type: 'bridge', params: [60, 4, 2], x: -30, z: 8, note: 'Crimea Bridge (rail)' },
    { type: 'industrialFactory', params: [20, 10, 5], x: -40, z: -20, note: 'Bridge control station' },
    { type: 'warehouse', params: [15, 10, 4], x: -40, z: 20, note: 'Toll plaza building' },
    { type: 'warehouse', params: [12, 8, 3], x: 30, z: -20, note: 'Maintenance depot' },
    { type: 'warehouse', params: [12, 8, 3], x: 30, z: 20, note: 'Emergency station' },
    { type: 'bunker', params: [], x: -20, z: -10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: 20, z: -10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: -20, z: 10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: 20, z: 10, note: 'Bridge defense bunker' },
    { type: 'radarStation', params: [], x: -35, z: -30, note: 'Coastal radar' },
    { type: 'radarStation', params: [], x: 35, z: -30, note: 'Coastal radar' },
    { type: 'monument', params: ['obelisk'], x: -50, z: 0, note: 'Taman monument' },
    { type: 'monument', params: ['obelisk'], x: 50, z: 0, note: 'Kerch monument' },
    { type: 'warehouse', params: [10, 8, 3], x: -50, z: -20, note: 'Coastal warehouse' },
    { type: 'warehouse', params: [10, 8, 3], x: 50, z: -20, note: 'Coastal warehouse' },
    { type: 'warehouse', params: [10, 8, 3], x: -50, z: 20, note: 'Coastal warehouse' },
    { type: 'warehouse', params: [10, 8, 3], x: 50, z: 20, note: 'Coastal warehouse' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: -30, z: 30, note: 'Damaged building' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: 30, z: 30, note: 'Damaged building' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2], x: -45, z: 35, note: 'Coastal housing' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2], x: 45, z: 35, note: 'Coastal housing' },
    { type: 'bunker', params: [], x: 0, z: -15, note: 'Underwater defense' },
    { type: 'bunker', params: [], x: 0, z: 15, note: 'Underwater defense' },
    { type: 'industrialFactory', params: [15, 10, 4], x: -15, z: -30, note: 'Port crane base' },
    { type: 'industrialFactory', params: [15, 10, 4], x: 15, z: -30, note: 'Port crane base' },
    { type: 'warehouse', params: [12, 8, 3], x: -15, z: 30, note: 'Port storage' },
    { type: 'warehouse', params: [12, 8, 3], x: 15, z: 30, note: 'Port storage' },
    { type: 'monument', params: ['tank'], x: -40, z: 40, note: 'Coastal defense monument' },
    { type: 'monument', params: ['tank'], x: 40, z: 40, note: 'Coastal defense monument' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 7. CHORNOBYL ZONE (Pripyat, exclusion zone)
  // ═══════════════════════════════════════════════════════════
  CITIES.chornobyl = [
    { type: 'industrialFactory', params: [30, 20, 8], x: 0, z: -40, note: 'Chornobyl NPP Reactor 4' },
    { type: 'industrialFactory', params: [25, 15, 6], x: -35, z: -40, note: 'Reactor 3' },
    { type: 'industrialFactory', params: [25, 15, 6], x: 35, z: -40, note: 'Reactor 2' },
    { type: 'industrialFactory', params: [20, 15, 6], x: -60, z: -40, note: 'Reactor 1' },
    { type: 'industrialFactory', params: [20, 15, 6], x: 60, z: -40, note: 'Reactor 5-6 (unfinished)' },
    { type: 'industrialFactory', params: [15, 10, 6], x: 0, z: -70, note: 'Cooling Tower 1' },
    { type: 'industrialFactory', params: [15, 10, 6], x: 25, z: -70, note: 'Cooling Tower 2' },
    // Pripyat buildings
    { type: 'sovietApartment', params: [18, 10, 8, 0.1], x: -40, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [18, 10, 8, 0.1], x: -20, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [18, 10, 8, 0.1], x: 0, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [18, 10, 8, 0.1], x: 20, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [18, 10, 8, 0.1], x: 40, z: 10, note: 'Pripyat 16-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1], x: -40, z: 30, note: 'Pripyat 9-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1], x: -20, z: 30, note: 'Pripyat 9-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1], x: 0, z: 30, note: 'Pripyat 9-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1], x: 20, z: 30, note: 'Pripyat 9-story block' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1], x: 40, z: 30, note: 'Pripyat 9-story block' },
    { type: 'officeBuilding', params: [12, 8, 4], x: -30, z: 50, note: 'Enerhetyk Palace of Culture' },
    { type: 'officeBuilding', params: [10, 8, 5], x: -10, z: 50, note: 'Polissya Hotel' },
    { type: 'warehouse', params: [12, 10, 3], x: 10, z: 50, note: 'Department Store' },
    { type: 'warehouse', params: [10, 8, 3], x: 30, z: 50, note: 'Pripyat Cafe' },
    { type: 'warehouse', params: [15, 10, 3], x: -50, z: 50, note: 'Swimming Pool' },
    { type: 'warehouse', params: [12, 8, 3], x: 50, z: 50, note: 'Amusement Park' },
    { type: 'school', params: [12, 10, 3], x: -35, z: 65, note: 'School No. 1' },
    { type: 'school', params: [12, 10, 3], x: -15, z: 65, note: 'School No. 2' },
    { type: 'school', params: [12, 10, 3], x: 5, z: 65, note: 'School No. 3' },
    { type: 'school', params: [12, 10, 3], x: 25, z: 65, note: 'School No. 4' },
    { type: 'school', params: [12, 10, 3], x: 45, z: 65, note: 'School No. 5' },
    { type: 'monument', params: ['obelisk'], x: 0, z: 75, note: 'Prometheus statue' },
    { type: 'bunker', params: [], x: -15, z: -20, note: 'Underground shelter' },
    { type: 'bunker', params: [], x: 15, z: -20, note: 'Underground shelter' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 0.5], x: -55, z: 0, note: 'Duga radar base' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 0.5], x: 55, z: 0, note: 'Duga radar base' },
    { type: 'monument', params: ['obelisk'], x: -50, z: -60, note: 'Liquidators memorial' },
    { type: 'monument', params: ['obelisk'], x: 50, z: -60, note: 'Firefighters memorial' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 8. OUTER MOSCOW (Suburbs, FSB/Rosgvardiya defense)
  // ═══════════════════════════════════════════════════════════
  CITIES.moscow = [
    { type: 'kremlinWall', params: [80, 60, 8], x: 0, z: 0, note: 'Kremlin walls — triangular fortification, Moskva River to south' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: -15, z: -5, note: 'Assumption Cathedral — inside Kremlin, west side' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: 0, z: -5, note: 'Archangel Cathedral — inside Kremlin, center' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: 15, z: -5, note: 'Annunciation Cathedral — inside Kremlin, east side' },
    { type: 'officeBuilding', params: [6, 6, 12], x: -8, z: 8, note: 'Ivan the Great Bell Tower — inside Kremlin, tallest structure' },
    { type: 'officeBuilding', params: [14, 10, 5], x: -20, z: 10, note: 'Senate building — inside Kremlin, west' },
    { type: 'officeBuilding', params: [14, 10, 5], x: 20, z: 10, note: 'Presidential residence — inside Kremlin, east' },
    { type: 'orthodoxChurch', params: [10, 10, 8], x: 0, z: 35, note: 'St. Basil\'s Cathedral — south end of Red Square' },
    { type: 'officeBuilding', params: [12, 8, 4], x: -30, z: 30, note: 'State Historical Museum — north of Red Square' },
    { type: 'officeBuilding', params: [12, 8, 4], x: 30, z: 30, note: 'GUM Department Store — east side of Red Square' },
    { type: 'monument', params: ['obelisk'], x: -12, z: 28, note: 'Lenin Mausoleum — against Kremlin wall, Red Square west side' },
    { type: 'monument', params: ['obelisk'], x: 12, z: 28, note: 'Minin & Pozharsky Monument — Red Square, near St. Basil\'s' },
    { type: 'officeBuilding', params: [12, 10, 6], x: -40, z: -20, note: 'Lubyanka FSB HQ — northeast of Kremlin, former KGB' },
    { type: 'officeBuilding', params: [12, 10, 6], x: 40, z: -20, note: 'MVD headquarters — east of Kremlin' },
    { type: 'officeBuilding', params: [12, 10, 6], x: -35, z: -40, note: 'Bolshoi Theatre — north of Kremlin, Theater Square' },
    { type: 'officeBuilding', params: [16, 14, 10], x: -55, z: 55, note: 'Moscow State University Main Building — Sparrow Hills (Vorobyovy Gory), southwest' },
    { type: 'monument', params: ['obelisk'], x: -50, z: 60, note: 'Sparrow Hills observation point — elevated above Moskva River' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1], x: -40, z: -30, note: '9-story apartment — north of Kremlin' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1], x: -20, z: -30, note: '9-story apartment' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1], x: 0, z: -30, note: '9-story apartment' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1], x: 20, z: -30, note: '9-story apartment' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.1], x: 40, z: -30, note: '9-story apartment' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1], x: -50, z: -10, note: '12-story tower — inner ring' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1], x: -25, z: -10, note: '12-story tower' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1], x: 0, z: -10, note: '12-story tower' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1], x: 25, z: -10, note: '12-story tower' },
    { type: 'sovietApartment', params: [16, 8, 12, 0.1], x: 50, z: -10, note: '12-story tower' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: -50, z: 35, note: 'St. Nicholas Church — north of city' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: 50, z: 35, note: 'St. George Church — east of city' },
    { type: 'warehouse', params: [15, 10, 4], x: -30, z: 35, note: 'Supermarket — northeast' },
    { type: 'warehouse', params: [15, 10, 4], x: 0, z: 35, note: 'Shopping center — near Red Square' },
    { type: 'warehouse', params: [15, 10, 4], x: 30, z: 35, note: 'Cinema — east of Red Square' },
    { type: 'school', params: [12, 10, 3], x: -45, z: 50, note: 'School No. 12 — outer ring' },
    { type: 'school', params: [12, 10, 3], x: -15, z: 50, note: 'School No. 15' },
    { type: 'school', params: [12, 10, 3], x: 15, z: 50, note: 'School No. 23' },
    { type: 'school', params: [12, 10, 3], x: 45, z: 50, note: 'School No. 31' },
    { type: 'bunker', params: [], x: -20, z: 0, note: 'Civil defense shelter — inner ring' },
    { type: 'bunker', params: [], x: 20, z: 0, note: 'Civil defense shelter' },
    { type: 'bunker', params: [], x: -20, z: 25, note: 'Civil defense shelter — outer ring' },
    { type: 'bunker', params: [], x: 20, z: 25, note: 'Civil defense shelter' },
    { type: 'monument', params: ['tank'], x: -50, z: -50, note: 'T-72 monument — northwest' },
    { type: 'monument', params: ['tank'], x: 50, z: -50, note: 'T-80 monument — northeast' },
    { type: 'monument', params: ['obelisk'], x: 0, z: -50, note: 'WWII memorial — north of Kremlin' },
    { type: 'industrialFactory', params: [15, 10, 4], x: -35, z: 50, note: 'Garage — outer ring' },
    { type: 'industrialFactory', params: [15, 10, 4], x: 35, z: 50, note: 'Bus depot — outer ring' },
  ];;

  // ═══════════════════════════════════════════════════════════
  // 9. SEVASTOPOL NAVAL BASE (Crimea, Black Sea Fleet)
  // ═══════════════════════════════════════════════════════════
  CITIES.sevastopol = [
    { type: 'industrialFactory', params: [30, 15, 6], x: 0, z: -20, note: 'Shipyard dry dock — Sevastopol Bay, north side' },
    { type: 'industrialFactory', params: [25, 12, 5], x: -35, z: -20, note: 'Repair workshop — Sevastopol Bay, west' },
    { type: 'industrialFactory', params: [25, 12, 5], x: 35, z: -20, note: 'Submarine pen — Sevastopol Bay, east' },
    { type: 'warehouse', params: [20, 10, 4], x: -50, z: -5, note: 'Naval stores — west of bay' },
    { type: 'warehouse', params: [20, 10, 4], x: 50, z: -5, note: 'Ammunition depot — east of bay' },
    { type: 'officeBuilding', params: [12, 10, 5], x: -30, z: 5, note: 'Black Sea Fleet HQ — north shore, west' },
    { type: 'officeBuilding', params: [12, 10, 5], x: 30, z: 5, note: 'Admiralty building — north shore, east' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: -15, z: 5, note: 'St. Vladimir Cathedral — north shore, center-west' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: 15, z: 5, note: 'St. Nicholas Cathedral — north shore, center-east' },
    { type: 'monument', params: ['obelisk'], x: 0, z: 25, note: 'Monument to Sunken Ships — Sevastopol Bay waterfront' },
    { type: 'monument', params: ['obelisk'], x: -40, z: 25, note: 'Nakhimov monument — west waterfront' },
    { type: 'monument', params: ['obelisk'], x: 40, z: 25, note: 'Kornilov monument — east waterfront' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -40, z: 40, note: 'Naval housing — north of city' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -20, z: 40, note: 'Naval housing — north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 0, z: 40, note: 'Naval housing — north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 20, z: 40, note: 'Naval housing — north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 40, z: 40, note: 'Naval housing — north' },
    { type: 'warehouse', params: [15, 10, 4], x: -50, z: 55, note: 'Port warehouse — north' },
    { type: 'warehouse', params: [15, 10, 4], x: -25, z: 55, note: 'Port warehouse — north' },
    { type: 'warehouse', params: [15, 10, 4], x: 0, z: 55, note: 'Port warehouse — north' },
    { type: 'warehouse', params: [15, 10, 4], x: 25, z: 55, note: 'Port warehouse — north' },
    { type: 'warehouse', params: [15, 10, 4], x: 50, z: 55, note: 'Port warehouse — north' },
    { type: 'bunker', params: [], x: -20, z: -5, note: 'Coastal defense bunker — Sevastopol Bay shore' },
    { type: 'bunker', params: [], x: 20, z: -5, note: 'Coastal defense bunker — Sevastopol Bay shore' },
    { type: 'bunker', params: [], x: -15, z: 30, note: 'Underground command center — north' },
    { type: 'bunker', params: [], x: 15, z: 30, note: 'Ammo bunker — north' },
    { type: 'radarStation', params: [], x: -50, z: -40, note: 'Coastal radar — west entrance to bay' },
    { type: 'radarStation', params: [], x: 50, z: -40, note: 'Coastal radar — east entrance to bay' },
    { type: 'monument', params: ['tank'], x: -30, z: -50, note: 'IS-2 tank monument — west coastal defense' },
    { type: 'monument', params: ['tank'], x: 30, z: -50, note: 'T-34 tank monument — east coastal defense' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.0], x: 0, z: 60, note: 'Damaged port building — north' },
  ];;

  // ═══════════════════════════════════════════════════════════
  // 10. DONBAS FINAL PUSH (Mining/industrial region)
  // ═══════════════════════════════════════════════════════════
  CITIES.donbas = [
    { type: 'industrialFactory', params: [35, 20, 8], x: 0, z: 0, note: 'Mine shaft complex' },
    { type: 'industrialFactory', params: [25, 15, 6], x: -40, z: -10, note: 'Processing plant' },
    { type: 'industrialFactory', params: [25, 15, 6], x: 40, z: -10, note: 'Processing plant' },
    { type: 'industrialFactory', params: [20, 12, 5], x: 0, z: -25, note: 'Coal washery' },
    { type: 'warehouse', params: [30, 15, 5], x: -50, z: 15, note: 'Coal storage' },
    { type: 'warehouse', params: [25, 12, 5], x: 50, z: 15, note: 'Equipment depot' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: -40, z: -30, note: 'Miners housing' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: -20, z: -30, note: 'Miners housing' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: 0, z: -30, note: 'Miners housing' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: 20, z: -30, note: 'Miners housing' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: 40, z: -30, note: 'Miners housing' },
    { type: 'officeBuilding', params: [10, 8, 4], x: -30, z: 30, note: 'Mine admin' },
    { type: 'officeBuilding', params: [10, 8, 4], x: 30, z: 30, note: 'Union office' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: -15, z: 30, note: 'Miners church' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: 15, z: 30, note: 'Village church' },
    { type: 'monument', params: ['obelisk'], x: 0, z: 40, note: 'Miners memorial' },
    { type: 'monument', params: ['obelisk'], x: -40, z: 40, note: 'WWII memorial' },
    { type: 'monument', params: ['obelisk'], x: 40, z: 40, note: 'Labor monument' },
    { type: 'bunker', params: [], x: -15, z: -15, note: 'Mine shelter' },
    { type: 'bunker', params: [], x: 15, z: -15, note: 'Mine shelter' },
    { type: 'bunker', params: [], x: -15, z: 15, note: 'Civil defense bunker' },
    { type: 'bunker', params: [], x: 15, z: 15, note: 'Civil defense bunker' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0], x: -50, z: -10, note: 'Ruined workshop' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0], x: 50, z: -10, note: 'Ruined workshop' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 1.5], x: -30, z: 45, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 1.5], x: 30, z: 45, note: 'Ruined house' },
    { type: 'warehouse', params: [12, 8, 3], x: -10, z: 45, note: 'Tool shed' },
    { type: 'warehouse', params: [12, 8, 3], x: 10, z: 45, note: 'Storage' },
    { type: 'industrialFactory', params: [15, 10, 4], x: -50, z: -35, note: 'Power substation' },
    { type: 'industrialFactory', params: [15, 10, 4], x: 50, z: -35, note: 'Power substation' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 11. BELGOROD OFFENSIVE (Russian border city)
  // ═══════════════════════════════════════════════════════════
  CITIES.belgorod = [
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -40, z: -20, note: 'Apartment block — city center north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -20, z: -20, note: 'Apartment block — city center north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 0, z: -20, note: 'Apartment block — city center north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 20, z: -20, note: 'Apartment block — city center north' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 40, z: -20, note: 'Apartment block — city center north' },
    { type: 'officeBuilding', params: [10, 8, 4], x: -40, z: 0, note: 'Admin building — city center' },
    { type: 'officeBuilding', params: [10, 8, 4], x: -20, z: 0, note: 'Police station — city center' },
    { type: 'officeBuilding', params: [10, 8, 4], x: 0, z: 0, note: 'City hall — city center' },
    { type: 'officeBuilding', params: [10, 8, 4], x: 20, z: 0, note: 'Military office — city center' },
    { type: 'officeBuilding', params: [10, 8, 4], x: 40, z: 0, note: 'FSB office — city center' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: -30, z: 20, note: 'St. Trinity Church — city center south' },
    { type: 'orthodoxChurch', params: [8, 10, 5], x: 30, z: 20, note: 'St. Mary Church — city center south' },
    { type: 'warehouse', params: [15, 10, 4], x: -10, z: 20, note: 'Market — city center south' },
    { type: 'warehouse', params: [15, 10, 4], x: 10, z: 20, note: 'Shopping center — city center south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -40, z: 40, note: 'Residential block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -20, z: 40, note: 'Residential block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 0, z: 40, note: 'Residential block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 20, z: 40, note: 'Residential block — south' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 40, z: 40, note: 'Residential block — south' },
    { type: 'monument', params: ['obelisk'], x: -50, z: -40, note: 'Border monument — north, toward Ukraine' },
    { type: 'monument', params: ['tank'], x: 50, z: -40, note: 'T-90 monument — northeast' },
    { type: 'monument', params: ['obelisk'], x: 0, z: -40, note: 'Victory monument — north' },
    { type: 'bunker', params: [], x: -20, z: -10, note: 'Military bunker — north of center' },
    { type: 'bunker', params: [], x: 20, z: -10, note: 'Military bunker — north of center' },
    { type: 'bunker', params: [], x: -20, z: 30, note: 'Civil defense bunker — south' },
    { type: 'bunker', params: [], x: 20, z: 30, note: 'Civil defense bunker — south' },
    { type: 'industrialFactory', params: [15, 10, 4], x: -50, z: 10, note: 'Factory — west' },
    { type: 'industrialFactory', params: [15, 10, 4], x: 50, z: 10, note: 'Factory — east' },
    { type: 'warehouse', params: [12, 8, 3], x: -50, z: 30, note: 'Warehouse — west' },
    { type: 'warehouse', params: [12, 8, 3], x: 50, z: 30, note: 'Warehouse — east' },
  ];;

  // ═══════════════════════════════════════════════════════════
  // 12. KREMLIN SHOWDOWN (Moscow Kremlin & Red Square)
  // ═══════════════════════════════════════════════════════════
  CITIES.kremlin = [
    { type: 'kremlinWall', params: [80, 60, 8], x: 0, z: 0, note: 'Kremlin walls — triangular fortification, Moskva River to south' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: -20, z: -10, note: 'Assumption Cathedral — inside Kremlin, west' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: 0, z: -10, note: 'Archangel Cathedral — inside Kremlin, center' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: 20, z: -10, note: 'Annunciation Cathedral — inside Kremlin, east' },
    { type: 'orthodoxChurch', params: [8, 10, 6], x: -30, z: -10, note: 'Church of the Deposition — inside Kremlin, far west' },
    { type: 'orthodoxChurch', params: [8, 10, 6], x: 30, z: -10, note: 'Church of the Twelve Apostles — inside Kremlin, far east' },
    { type: 'officeBuilding', params: [6, 6, 12], x: -10, z: 5, note: 'Ivan the Great Bell Tower — inside Kremlin' },
    { type: 'officeBuilding', params: [6, 6, 12], x: 10, z: 5, note: 'Tsar Bell Tower — inside Kremlin' },
    { type: 'officeBuilding', params: [14, 10, 5], x: -25, z: 15, note: 'Senate building — inside Kremlin' },
    { type: 'officeBuilding', params: [14, 10, 5], x: 25, z: 15, note: 'Presidential residence — inside Kremlin' },
    { type: 'officeBuilding', params: [10, 8, 4], x: -10, z: 20, note: 'Armory Chamber — inside Kremlin' },
    { type: 'officeBuilding', params: [10, 8, 4], x: 10, z: 20, note: 'Diamond Fund — inside Kremlin' },
    { type: 'orthodoxChurch', params: [10, 10, 8], x: 0, z: 35, note: 'St. Basil\'s Cathedral — south end of Red Square' },
    { type: 'officeBuilding', params: [12, 8, 4], x: -30, z: 35, note: 'State Historical Museum — north of Red Square' },
    { type: 'officeBuilding', params: [12, 8, 4], x: 30, z: 35, note: 'GUM Department Store — east of Red Square' },
    { type: 'monument', params: ['obelisk'], x: -15, z: 35, note: 'Lenin Mausoleum — against Kremlin wall' },
    { type: 'monument', params: ['obelisk'], x: 15, z: 35, note: 'Minin & Pozharsky — Red Square' },
    { type: 'officeBuilding', params: [12, 10, 6], x: -50, z: 0, note: 'Lubyanka FSB HQ — northeast of Kremlin' },
    { type: 'officeBuilding', params: [12, 10, 6], x: 50, z: 0, note: 'MVD headquarters — east of Kremlin' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1], x: -50, z: -30, note: 'Hotel National — northwest' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.1], x: 50, z: -30, note: 'Rossiya Hotel — northeast' },
    { type: 'officeBuilding', params: [10, 8, 5], x: -50, z: 30, note: 'Moscow State University — northwest, near Sparrow Hills' },
    { type: 'officeBuilding', params: [10, 8, 5], x: 50, z: 30, note: 'Bolshoi Theatre — northeast, Theater Square' },
    { type: 'monument', params: ['motherland'], x: 0, z: -50, note: 'Motherland Calls — Victory Park, north of Kremlin' },
    { type: 'monument', params: ['tank'], x: -40, z: 50, note: 'Tank monument — southwest' },
    { type: 'monument', params: ['tank'], x: 40, z: 50, note: 'Tank monument — southeast' },
    { type: 'bunker', params: [], x: -20, z: 0, note: 'Kremlin bunker — inside walls' },
    { type: 'bunker', params: [], x: 20, z: 0, note: 'FSB bunker — near Lubyanka' },
  ];;

  // ═══════════════════════════════════════════════════════════
  // 13. BATTLE OF KYIV (Kyiv city center, Maidan)
  // ═══════════════════════════════════════════════════════════
  CITIES.kyiv = [
    { type: 'monument', params: ['obelisk'], x: 0, z: 0, note: 'Independence Monument — Maidan Nezalezhnosti (center of Kyiv)' },
    { type: 'officeBuilding', params: [14, 10, 8], x: -20, z: -5, note: 'Trade Unions Building — west side of Maidan' },
    { type: 'officeBuilding', params: [12, 10, 6], x: 20, z: -5, note: 'Ukraine Hotel — east side of Maidan' },
    { type: 'officeBuilding', params: [10, 8, 6], x: -30, z: 5, note: 'Globus Shopping — south of Maidan on Khreshchatyk' },
    { type: 'officeBuilding', params: [10, 8, 6], x: 30, z: 5, note: 'TSUM Kyiv — south of Maidan' },
    { type: 'officeBuilding', params: [12, 8, 6], x: -40, z: 15, note: 'Kyiv City Council — west Khreshchatyk' },
    { type: 'officeBuilding', params: [10, 8, 5], x: -20, z: 15, note: 'Post Office — Khreshchatyk' },
    { type: 'officeBuilding', params: [10, 8, 5], x: 0, z: 15, note: 'National Bank — Khreshchatyk' },
    { type: 'officeBuilding', params: [10, 8, 5], x: 20, z: 15, note: 'Ministry Building — Khreshchatyk' },
    { type: 'officeBuilding', params: [14, 10, 6], x: 40, z: 15, note: 'Cabinet of Ministers — east end of Khreshchatyk' },
    { type: 'officeBuilding', params: [16, 12, 6], x: 18, z: -10, note: 'Verkhovna Rada (Parliament) — Hrushevsky St, government quarter' },
    { type: 'officeBuilding', params: [12, 10, 5], x: 15, z: -8, note: 'Cabinet of Ministers — near Parliament' },
    { type: 'orthodoxChurch', params: [12, 14, 8], x: -20, z: -18, note: 'St. Sophia Cathedral — Upper Town, NW of Maidan (UNESCO World Heritage)' },
    { type: 'orthodoxChurch', params: [10, 12, 7], x: -12, z: -15, note: 'St. Michael\'s Golden-Domed Monastery — near St. Sophia, overlooking Maidan' },
    { type: 'orthodoxChurch', params: [8, 10, 6], x: -22, z: -8, note: 'St. Andrew\'s Church — above Andriyivskyy Descent, Upper Town' },
    { type: 'ruinedBuilding', params: [10, 8, 4, 1.0], x: -25, z: -5, note: 'Andriyivskyy Descent — historic cobblestone street to Podil' },
    { type: 'ruinedBuilding', params: [8, 6, 3, 0.5], x: -28, z: 5, note: 'Bulgakov Museum — Podil district' },
    { type: 'orthodoxChurch', params: [14, 16, 10], x: 22, z: 20, note: 'Kyiv Pechersk Lavra — SE of center, on Dnipro uplands (UNESCO)' },
    { type: 'orthodoxChurch', params: [10, 10, 6], x: 18, z: 15, note: 'Church of the Savior at Berestove — near Lavra' },
    { type: 'monument', params: ['motherland'], x: 28, z: 38, note: 'Motherland Monument (62m) — south of Lavra, on Dnipro River slope' },
    { type: 'monument', params: ['obelisk'], x: -50, z: 0, note: 'Taras Shevchenko monument — near university' },
    { type: 'monument', params: ['obelisk'], x: 45, z: 10, note: 'Dnipro River embankment — east of city center' },
    { type: 'monument', params: ['obelisk'], x: 48, z: 25, note: 'Dnipro River embankment — near Pechersk' },
    { type: 'monument', params: ['obelisk'], x: 50, z: 40, note: 'Dnipro River embankment — near Motherland Monument' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -40, z: 30, note: 'Khreshchatyk apartment — Shevchenkivskyi district' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: -20, z: 30, note: 'Khreshchatyk apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 0, z: 30, note: 'Khreshchatyk apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 20, z: 30, note: 'Khreshchatyk apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.2], x: 40, z: 30, note: 'Khreshchatyk apartment' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2], x: -40, z: 45, note: 'Pechersk apartment — near Dnipro' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2], x: -20, z: 45, note: 'Pechersk apartment' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2], x: 0, z: 45, note: 'Pechersk apartment' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2], x: 20, z: 45, note: 'Pechersk apartment' },
    { type: 'sovietApartment', params: [16, 8, 6, 0.2], x: 40, z: 45, note: 'Pechersk apartment' },
    { type: 'bunker', params: [], x: -10, z: 10, note: 'Maidan Metro station — blue line' },
    { type: 'bunker', params: [], x: 10, z: 10, note: 'Khreshchatyk Metro station' },
    { type: 'bunker', params: [], x: -10, z: -10, note: 'Teatralna Metro station' },
    { type: 'bunker', params: [], x: 10, z: -10, note: 'Ploshcha Lva Tolstoho Metro' },
    { type: 'officeBuilding', params: [10, 8, 5], x: 50, z: 15, note: 'Olympic Stadium — east of center, near Dnipro' },
    { type: 'officeBuilding', params: [10, 8, 5], x: 45, z: -5, note: 'VDNG Expo Center — east of Maidan' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 1.5], x: 0, z: -25, note: 'Damaged building — northern approach' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.2], x: 25, z: -25, note: 'Damaged building — near Lavra approach' },
  ];;

  // ═══════════════════════════════════════════════════════════
  // 14. SNAKE ISLAND DEFENSE (Small island, Black Sea)
  // ═══════════════════════════════════════════════════════════
  CITIES.snakeIsland = [
    { type: 'bunker', params: [], x: 0, z: 0, note: 'Main bunker' },
    { type: 'bunker', params: [], x: -10, z: -10, note: 'Coastal defense bunker' },
    { type: 'bunker', params: [], x: 10, z: -10, note: 'Coastal defense bunker' },
    { type: 'bunker', params: [], x: -10, z: 10, note: 'Coastal defense bunker' },
    { type: 'bunker', params: [], x: 10, z: 10, note: 'Coastal defense bunker' },
    { type: 'radarStation', params: [], x: 0, z: -5, note: 'Coastal radar' },
    { type: 'monument', params: ['obelisk'], x: 0, z: 5, note: 'Snake Island monument' },
    { type: 'warehouse', params: [8, 6, 3], x: -5, z: 5, note: 'Supply shed' },
    { type: 'warehouse', params: [8, 6, 3], x: 5, z: 5, note: 'Equipment shed' },
    { type: 'ruinedBuilding', params: [6, 6, 2, 1.0], x: -8, z: 0, note: 'Damaged structure' },
    { type: 'ruinedBuilding', params: [6, 6, 2, 1.0], x: 8, z: 0, note: 'Damaged structure' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 15. SAKY AIRBASE STRIKE (Crimea, military airbase)
  // ═══════════════════════════════════════════════════════════
  CITIES.saky = [
    { type: 'airportTerminal', params: [20, 10, 4], x: 0, z: -20, note: 'Airbase control tower' },
    { type: 'hangar', params: [25, 15, 6], x: -30, z: -10, note: 'Aircraft hangar 1' },
    { type: 'hangar', params: [25, 15, 6], x: 30, z: -10, note: 'Aircraft hangar 2' },
    { type: 'hangar', params: [20, 12, 5], x: -30, z: 10, note: 'Aircraft hangar 3' },
    { type: 'hangar', params: [20, 12, 5], x: 30, z: 10, note: 'Aircraft hangar 4' },
    { type: 'hangar', params: [20, 12, 5], x: -30, z: 30, note: 'Aircraft hangar 5' },
    { type: 'hangar', params: [20, 12, 5], x: 30, z: 30, note: 'Aircraft hangar 6' },
    { type: 'warehouse', params: [15, 10, 4], x: 0, z: 10, note: 'Fuel storage' },
    { type: 'warehouse', params: [15, 10, 4], x: 0, z: 30, note: 'Ammunition depot' },
    { type: 'bunker', params: [], x: -15, z: -5, note: 'Command bunker' },
    { type: 'bunker', params: [], x: 15, z: -5, note: 'Shelter' },
    { type: 'radarStation', params: [], x: -40, z: -30, note: 'Radar station' },
    { type: 'radarStation', params: [], x: 40, z: -30, note: 'Radar station' },
    { type: 'radarStation', params: [], x: 0, z: -40, note: 'Air traffic control radar' },
    { type: 'monument', params: ['obelisk'], x: -50, z: 0, note: 'Air force monument' },
    { type: 'monument', params: ['tank'], x: 50, z: 0, note: 'T-72 monument' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: -20, z: 20, note: 'Damaged hangar' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: 20, z: 20, note: 'Damaged building' },
    { type: 'ruinedBuilding', params: [8, 6, 2, 1.0], x: -10, z: 40, note: 'Craters' },
    { type: 'ruinedBuilding', params: [8, 6, 2, 1.0], x: 10, z: 40, note: 'Craters' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 16. VUHLEDAR TANK GRAVEYARD (Open terrain, minefields)
  // ═══════════════════════════════════════════════════════════
  CITIES.vuhledar = [
    { type: 'sovietApartment', params: [16, 8, 5, 0.5], x: -30, z: -20, note: 'Damaged apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.6], x: -10, z: -20, note: 'Heavily damaged apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.7], x: 10, z: -20, note: 'Ruined apartment' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.5], x: 30, z: -20, note: 'Damaged apartment' },
    { type: 'industrialFactory', params: [20, 12, 5], x: 0, z: 0, note: 'Coal processing plant' },
    { type: 'industrialFactory', params: [15, 10, 4], x: -25, z: 15, note: 'Power station' },
    { type: 'industrialFactory', params: [15, 10, 4], x: 25, z: 15, note: 'Substation' },
    { type: 'warehouse', params: [15, 10, 4], x: -40, z: 30, note: 'Coal storage' },
    { type: 'warehouse', params: [15, 10, 4], x: 40, z: 30, note: 'Equipment depot' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0], x: -20, z: 30, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0], x: 0, z: 30, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 2.0], x: 20, z: 30, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.5], x: -50, z: -10, note: 'Destroyed school' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.5], x: 50, z: -10, note: 'Destroyed hospital' },
    { type: 'bunker', params: [], x: -15, z: -5, note: 'Mine shelter' },
    { type: 'bunker', params: [], x: 15, z: -5, note: 'Mine shelter' },
    { type: 'monument', params: ['obelisk'], x: -40, z: -40, note: 'Miners memorial' },
    { type: 'monument', params: ['tank'], x: 0, z: -40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ['tank'], x: 20, z: -40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ['tank'], x: -20, z: -40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ['tank'], x: 40, z: -40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ['tank'], x: -40, z: 40, note: 'Destroyed tank (wreck)' },
    { type: 'monument', params: ['tank'], x: 40, z: 40, note: 'Destroyed tank (wreck)' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0], x: -30, z: 40, note: 'Ruined apartment' },
    { type: 'ruinedBuilding', params: [14, 8, 4, 2.0], x: 30, z: 40, note: 'Ruined apartment' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5], x: -10, z: 45, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [10, 6, 3, 1.5], x: 10, z: 45, note: 'Ruined house' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 2.0], x: -50, z: 10, note: 'Ruined building' },
    { type: 'ruinedBuilding', params: [12, 8, 3, 2.0], x: 50, z: 10, note: 'Ruined building' },
    { type: 'bunker', params: [], x: 0, z: 15, note: 'Trench bunker' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 17. ANTONOV BRIDGE STRIKE (Kherson, bridge)
  // ═══════════════════════════════════════════════════════════
  CITIES.antonov = [
    { type: 'bridge', params: [50, 6, 4], x: -25, z: 0, note: 'Antonovsky Bridge (damaged)' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: -40, z: -15, note: 'Bridge checkpoint (ruined)' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 2.0], x: 40, z: -15, note: 'Bridge checkpoint (ruined)' },
    { type: 'bunker', params: [], x: -20, z: -10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: 20, z: -10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: -20, z: 10, note: 'Bridge defense bunker' },
    { type: 'bunker', params: [], x: 20, z: 10, note: 'Bridge defense bunker' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: -40, z: -30, note: 'Apartment block' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: -20, z: -30, note: 'Apartment block' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: 0, z: -30, note: 'Apartment block' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: 20, z: -30, note: 'Apartment block' },
    { type: 'sovietApartment', params: [16, 8, 5, 0.3], x: 40, z: -30, note: 'Apartment block' },
    { type: 'warehouse', params: [15, 10, 4], x: -30, z: 20, note: 'River port warehouse' },
    { type: 'warehouse', params: [15, 10, 4], x: -10, z: 20, note: 'Grain elevator' },
    { type: 'warehouse', params: [15, 10, 4], x: 10, z: 20, note: 'Storage depot' },
    { type: 'warehouse', params: [15, 10, 4], x: 30, z: 20, note: 'Cold storage' },
    { type: 'industrialFactory', params: [15, 10, 4], x: -40, z: 35, note: 'Ship repair' },
    { type: 'industrialFactory', params: [15, 10, 4], x: 40, z: 35, note: 'Dockyard' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: -50, z: 0, note: 'Damaged building' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: 50, z: 0, note: 'Damaged building' },
    { type: 'monument', params: ['obelisk'], x: -50, z: -20, note: 'Monument' },
    { type: 'monument', params: ['obelisk'], x: 50, z: -20, note: 'Monument' },
    { type: 'bunker', params: [], x: 0, z: -15, note: 'Bridge command bunker' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: -30, z: 40, note: 'Damaged house' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: 30, z: 40, note: 'Damaged house' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2], x: -50, z: 30, note: 'Small apartment' },
    { type: 'sovietApartment', params: [12, 6, 3, 0.2], x: 50, z: 30, note: 'Small apartment' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 18. REFINERY STRIKE (FPV Drone — oil refinery)
  // ═══════════════════════════════════════════════════════════
  CITIES.refinery = [
    { type: 'industrialFactory', params: [40, 25, 10], x: 0, z: 0, note: 'Main distillation tower' },
    { type: 'industrialFactory', params: [30, 15, 8], x: -35, z: -10, note: 'Cracking unit' },
    { type: 'industrialFactory', params: [30, 15, 8], x: 35, z: -10, note: 'Reforming unit' },
    { type: 'industrialFactory', params: [25, 15, 6], x: -30, z: -35, note: 'Hydrotreater' },
    { type: 'industrialFactory', params: [25, 15, 6], x: 30, z: -35, note: 'Coker unit' },
    { type: 'warehouse', params: [35, 15, 6], x: -50, z: 15, note: 'Crude oil storage' },
    { type: 'warehouse', params: [30, 12, 5], x: 50, z: 15, note: 'Product storage' },
    { type: 'industrialFactory', params: [20, 12, 5], x: 0, z: -30, note: 'Sulfur recovery' },
    { type: 'warehouse', params: [15, 10, 4], x: -25, z: 20, note: 'Tank farm' },
    { type: 'warehouse', params: [15, 10, 4], x: 25, z: 20, note: 'Tank farm' },
    { type: 'bunker', params: [], x: -15, z: -15, note: 'Control bunker' },
    { type: 'bunker', params: [], x: 15, z: -15, note: 'Shelter' },
    { type: 'bunker', params: [], x: -15, z: 15, note: 'Security bunker' },
    { type: 'bunker', params: [], x: 15, z: 15, note: 'Security bunker' },
    { type: 'radarStation', params: [], x: -40, z: -40, note: 'Air defense radar' },
    { type: 'radarStation', params: [], x: 40, z: -40, note: 'Air defense radar' },
    { type: 'monument', params: ['obelisk'], x: -50, z: 0, note: 'Industrial monument' },
    { type: 'monument', params: ['tank'], x: 50, z: 0, note: 'Security monument' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: -30, z: 30, note: 'Damaged tank' },
    { type: 'ruinedBuilding', params: [10, 8, 3, 1.5], x: 30, z: 30, note: 'Damaged tank' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 19. TREELINE ASSAULT (Woodland, trench warfare)
  // ═══════════════════════════════════════════════════════════
  CITIES.treeline = [
    { type: 'bunker', params: [], x: -20, z: -15, note: 'Forward trench bunker' },
    { type: 'bunker', params: [], x: -10, z: -15, note: 'Trench bunker' },
    { type: 'bunker', params: [], x: 0, z: -15, note: 'Trench bunker' },
    { type: 'bunker', params: [], x: 10, z: -15, note: 'Trench bunker' },
    { type: 'bunker', params: [], x: 20, z: -15, note: 'Trench bunker' },
    { type: 'bunker', params: [], x: -20, z: -5, note: 'Trench bunker' },
    { type: 'bunker', params: [], x: -10, z: -5, note: 'Trench bunker' },
    { type: 'bunker', params: [], x: 0, z: -5, note: 'Command bunker' },
    { type: 'bunker', params: [], x: 10, z: -5, note: 'Trench bunker' },
    { type: 'bunker', params: [], x: 20, z: -5, note: 'Trench bunker' },
    { type: 'bunker', params: [], x: -15, z: 5, note: 'Rear bunker' },
    { type: 'bunker', params: [], x: 0, z: 5, note: 'Rear bunker' },
    { type: 'bunker', params: [], x: 15, z: 5, note: 'Rear bunker' },
    { type: 'warehouse', params: [10, 8, 3], x: -30, z: 10, note: 'Supply dump' },
    { type: 'warehouse', params: [10, 8, 3], x: 30, z: 10, note: 'Ammo dump' },
    { type: 'monument', params: ['tank'], x: -40, z: -10, note: 'Burnt-out tank' },
    { type: 'monument', params: ['tank'], x: 40, z: -10, note: 'Burnt-out tank' },
    { type: 'monument', params: ['tank'], x: -40, z: 10, note: 'Burnt-out tank' },
    { type: 'monument', params: ['tank'], x: 40, z: 10, note: 'Burnt-out tank' },
    { type: 'ruinedBuilding', params: [8, 6, 2, 1.0], x: -25, z: 15, note: 'Destroyed hut' },
    { type: 'ruinedBuilding', params: [8, 6, 2, 1.0], x: 25, z: 15, note: 'Destroyed hut' },
  ];

  // ═══════════════════════════════════════════════════════════
  // 20. SIEGE OF MOSCOW (Final battle, Kremlin area)
  // ═══════════════════════════════════════════════════════════
  CITIES.siegeMoscow = [
    { type: 'kremlinWall', params: [80, 60, 8], x: 0, z: 0, note: 'Kremlin walls — final showdown location' },
    { type: 'orthodoxChurch', params: [10, 10, 8], x: 0, z: 35, note: 'St. Basil\'s Cathedral — south end of Red Square' },
    { type: 'officeBuilding', params: [12, 8, 4], x: -30, z: 35, note: 'Historical Museum — north of Red Square' },
    { type: 'officeBuilding', params: [12, 8, 4], x: 30, z: 35, note: 'GUM Department Store — east of Red Square' },
    { type: 'monument', params: ['obelisk'], x: -15, z: 35, note: 'Lenin Mausoleum — against Kremlin wall' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: -20, z: -10, note: 'Assumption Cathedral — inside Kremlin' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: 0, z: -10, note: 'Archangel Cathedral — inside Kremlin' },
    { type: 'orthodoxChurch', params: [10, 12, 8], x: 20, z: -10, note: 'Annunciation Cathedral — inside Kremlin' },
    { type: 'officeBuilding', params: [6, 6, 12], x: -10, z: 5, note: 'Ivan Bell Tower — inside Kremlin' },
    { type: 'officeBuilding', params: [6, 6, 12], x: 10, z: 5, note: 'Tsar Bell Tower — inside Kremlin' },
    { type: 'officeBuilding', params: [14, 10, 5], x: -25, z: 15, note: 'Senate — inside Kremlin' },
    { type: 'officeBuilding', params: [14, 10, 5], x: 25, z: 15, note: 'Presidential Residence — inside Kremlin' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2], x: -50, z: -50, note: 'Moscow high-rise — northwest' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2], x: -25, z: -50, note: 'Moscow high-rise' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2], x: 0, z: -50, note: 'Moscow high-rise' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2], x: 25, z: -50, note: 'Moscow high-rise' },
    { type: 'sovietApartment', params: [18, 10, 12, 0.2], x: 50, z: -50, note: 'Moscow high-rise' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.2], x: -50, z: -30, note: 'Moscow apartment — west' },
    { type: 'sovietApartment', params: [18, 10, 9, 0.2], x: 50, z: -30, note: 'Moscow apartment — east' },
    { type: 'officeBuilding', params: [12, 10, 6], x: -50, z: 0, note: 'Lubyanka FSB — northeast of Kremlin' },
    { type: 'officeBuilding', params: [12, 10, 6], x: 50, z: 0, note: 'MVD HQ — east of Kremlin' },
    { type: 'officeBuilding', params: [12, 10, 6], x: -50, z: 20, note: 'Defense Ministry — northwest' },
    { type: 'officeBuilding', params: [12, 10, 6], x: 50, z: 20, note: 'Foreign Ministry — northeast' },
    { type: 'officeBuilding', params: [12, 10, 6], x: -50, z: 40, note: 'State Duma — northwest' },
    { type: 'officeBuilding', params: [12, 10, 6], x: 50, z: 40, note: 'Federation Council — northeast' },
    { type: 'monument', params: ['motherland'], x: 0, z: -60, note: 'Motherland Calls (62m) — Victory Park' },
    { type: 'monument', params: ['tank'], x: -40, z: 50, note: 'T-14 Armata monument — southwest' },
    { type: 'monument', params: ['tank'], x: 40, z: 50, note: 'T-90 monument — southeast' },
    { type: 'monument', params: ['obelisk'], x: 0, z: 50, note: 'Victory Monument — south of Kremlin' },
    { type: 'bunker', params: [], x: -20, z: 0, note: 'Kremlin nuclear bunker — deep under walls' },
    { type: 'bunker', params: [], x: 20, z: 0, note: 'FSB command bunker — near Lubyanka' },
    { type: 'bunker', params: [], x: -20, z: 25, note: 'Metro-2 secret line — northwest' },
    { type: 'bunker', params: [], x: 20, z: 25, note: 'Metro-2 secret line — northeast' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 1.5], x: -30, z: 50, note: 'Damaged building — southwest approach' },
    { type: 'ruinedBuilding', params: [12, 8, 4, 1.5], x: 30, z: 50, note: 'Damaged building — southeast approach' },
  ];;

  // ── Road Networks ─────────────────────────────────────────
  // Each city has 10 main roads as arrays of waypoints (x, z)
  const ROADS = {};

  ROADS.hostomel = [
    // Road 1: Main runway (east-west, 3.5 km representation)
    [[-60, 0], [-40, 0], [-20, 0], [0, 0], [20, 0], [40, 0], [60, 0]],
    // Road 2: Taxiway from runway to apron (north-south)
    [[-40, -20], [-40, 0], [-40, 20], [-40, 40]],
    // Road 3: Apron service road (east-west along terminal)
    [[-50, 40], [-30, 40], [-10, 40], [10, 40], [30, 40], [50, 40]],
    // Road 4: Highway E373 — Bucha to Horenka approach (west-east)
    [[-70, -50], [-50, -40], [-30, -30], [-10, -20], [10, -20], [30, -30], [50, -40], [70, -50]],
    // Road 5: P02 road — Demydiv approach (south-east)
    [[20, 60], [30, 50], [40, 40], [50, 30], [60, 20], [70, 10]],
    // Road 6: Airport perimeter road (west side)
    [[-60, -50], [-60, -30], [-60, -10], [-60, 10], [-60, 30], [-60, 50]],
    // Road 7: Hostomel town main street (north-south through town)
    [[60, -30], [60, -10], [60, 10], [60, 30], [60, 50], [60, 70]],
    // Road 8: Hostomel town cross street (east-west)
    [[40, 20], [50, 20], [60, 20], [70, 20], [80, 20], [90, 20]],
    // Road 9: Southern parallel (town ring)
    [[40, 50], [50, 50], [60, 50], [70, 50], [80, 50]],
    // Road 10: Northern approach to airport from Kyiv
    [[0, -60], [0, -40], [0, -20], [0, 0]],
  ];

  ROADS.avdiivka = [
    [[[-20, -50], [-20, -30], [-20, -10], [-20, 10], [-20, 30], [-20, 50]]],
    [[[-50, -10], [-30, -10], [-10, -10], [10, -10], [30, -10], [50, -10]]],
    [[[-50, -30], [-30, -30], [-10, -30], [10, -30], [30, -30], [50, -30]]],
    [[[-50, 20], [-30, 20], [-10, 20], [10, 20], [30, 20], [50, 20]]],
    [[[-40, -40], [-40, -20], [-40, 0], [-40, 20], [-40, 40]]],
    [[[40, -40], [40, -20], [40, 0], [40, 20], [40, 40]]],
    [[[-20, -10], [-20, 10], [0, 10], [20, 10], [20, -10]]],
    [[[-50, -40], [-40, -30], [-30, -20], [-20, -10], [-10, 0]]],
    [[[10, 0], [20, 10], [30, 20], [40, 30], [50, 40]]],
    [[[-50, 40], [-25, 40], [0, 40], [25, 40], [50, 40]]],
  ];;

  ROADS.bakhmut = [
    [[[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]]],
    [[[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]]],
    [[[-50, -20], [-25, -20], [0, -20], [25, -20], [50, -20]]],
    [[[-50, 20], [-25, 20], [0, 20], [25, 20], [50, 20]]],
    [[[-50, -40], [-50, -20], [-50, 0], [-50, 20], [-50, 40]]],
    [[[50, -40], [50, -20], [50, 0], [50, 20], [50, 40]]],
    [[[-50, -50], [-40, -40], [-30, -30], [-20, -20], [-10, -10]]],
    [[[10, -10], [20, -20], [30, -30], [40, -40], [50, -50]]],
    [[[-10, 10], [-20, 20], [-30, 30], [-40, 40], [-50, 50]]],
    [[[10, 10], [20, 20], [30, 30], [40, 40], [50, 50]]],
  ];;

  ROADS.kherson = [
    [[[-50, -25], [-30, -25], [-10, -25], [10, -25], [30, -25], [50, -25]]],
    [[[-20, -50], [-20, -30], [-20, -10], [-20, 10], [-20, 30], [-20, 50]]],
    [[[20, -50], [20, -30], [20, -10], [20, 10], [20, 30], [20, 50]]],
    [[[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]]],
    [[[-50, -15], [-30, -15], [-10, -15], [10, -15], [30, -15], [50, -15]]],
    [[[-50, 15], [-30, 15], [-10, 15], [10, 15], [30, 15], [50, 15]]],
    [[[-50, -35], [-30, -35], [-10, -35], [10, -35], [30, -35]]],
    [[[-30, 35], [-10, 35], [10, 35], [30, 35], [50, 35]]],
    [[[-50, -50], [-30, -30], [-10, -10], [10, 10], [30, 30], [50, 50]]],
    [[[50, -50], [30, -30], [10, -10], [-10, 10], [-30, 30], [-50, 50]]],
  ];;

  ROADS.mariupol = [
    [[[-50, 50], [-50, 30], [-50, 10], [-50, -10], [-50, -30], [-50, -50]]],
    [[[-50, 50], [-30, 50], [-10, 50], [10, 50], [30, 50], [50, 50]]],
    [[[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]]],
    [[[50, 50], [50, 30], [50, 10], [50, -10], [50, -30], [50, -50]]],
    [[[-50, 30], [-30, 30], [-10, 30], [10, 30], [30, 30], [50, 30]]],
    [[[-50, -30], [-30, -30], [-10, -30], [10, -30], [30, -30], [50, -30]]],
    [[[-50, -10], [-30, -10], [-10, 0], [10, 0], [30, 10], [50, 20]]],
    [[[-40, -40], [-40, -20], [-40, 0], [-40, 20], [-40, 40]]],
    [[[40, -40], [40, -20], [40, 0], [40, 20], [40, 40]]],
    [[[-50, 40], [-30, 40], [0, 40], [30, 40], [50, 40]]],
  ];;

  ROADS.crimea = [
    // Road 1: Bridge approach (Taman side)
    [[-50, 0], [-40, 0], [-30, 0], [-20, 0]],
    // Road 2: Bridge approach (Kerch side)
    [[20, 0], [30, 0], [40, 0], [50, 0]],
    // Road 3: Taman coastal road
    [[-50, -20], [-40, -20], [-30, -20], [-20, -20]],
    // Road 4: Taman coastal road (south)
    [[-50, 20], [-40, 20], [-30, 20], [-20, 20]],
    // Road 5: Kerch coastal road (north)
    [[20, -20], [30, -20], [40, -20], [50, -20]],
    // Road 6: Kerch coastal road (south)
    [[20, 20], [30, 20], [40, 20], [50, 20]],
    // Road 7: Taman port road
    [[-50, -10], [-40, -10], [-30, -10]],
    // Road 8: Kerch port road
    [[30, -10], [40, -10], [50, -10]],
    // Road 9: Taman ring
    [[-45, -15], [-45, 0], [-45, 15]],
    // Road 10: Kerch ring
    [[45, -15], [45, 0], [45, 15]],
  ];

  ROADS.chornobyl = [
    // Road 1: Pripyat main avenue (Lenin Ave)
    [[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]],
    // Road 2: Pripyat cross avenue (Kurchatov St)
    [[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]],
    // Road 3: NPP access road
    [[-50, -50], [-30, -50], [-10, -50], [10, -50], [30, -50], [50, -50]],
    // Road 4: Northern residential ring
    [[-50, -20], [-30, -20], [-10, -20], [10, -20], [30, -20], [50, -20]],
    // Road 5: Southern residential ring
    [[-50, 20], [-30, 20], [-10, 20], [10, 20], [30, 20], [50, 20]],
    // Road 6: Western ring
    [[-50, -50], [-50, -30], [-50, -10], [-50, 10], [-50, 30], [-50, 50]],
    // Road 7: Eastern ring
    [[50, -50], [50, -30], [50, -10], [50, 10], [50, 30], [50, 50]],
    // Road 8: Cooling pond road
    [[-20, -70], [0, -70], [20, -70]],
    // Road 9: Pripyat to NPP road
    [[-30, 20], [-30, 0], [-30, -20], [-30, -40]],
    // Road 10: Diagonal connector
    [[-50, 50], [-30, 30], [-10, 10], [10, -10], [30, -30], [50, -50]],
  ];

  ROADS.moscow = [
    [[[0, -50], [0, -30], [0, -10], [0, 0], [0, 10], [0, 30], [0, 50]]],
    [[[-50, 0], [-30, 0], [-10, 0], [0, 0], [10, 0], [30, 0], [50, 0]]],
    [[[-30, 30], [-10, 30], [10, 30], [30, 30]]],
    [[[-50, -20], [-25, -20], [0, -20], [25, -20], [50, -20]]],
    [[[-50, 50], [-25, 50], [0, 50], [25, 50], [50, 50]]],
    [[[-50, -50], [-50, -25], [-50, 0], [-50, 25], [-50, 50]]],
    [[[50, -50], [50, -25], [50, 0], [50, 25], [50, 50]]],
    [[[-50, -50], [-25, -50], [0, -50], [25, -50], [50, -50]]],
    [[[-40, -20], [-30, -10], [-20, 0], [-10, 10], [0, 20]]],
    [[[-35, -40], [-25, -30], [-15, -20], [-5, -10]]],
  ];;

  ROADS.sevastopol = [
    [[[-50, -50], [-30, -50], [-10, -50], [10, -50], [30, -50], [50, -50]]],
    [[[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]]],
    [[[-50, -30], [-30, -30], [-10, -30], [10, -30], [30, -30], [50, -30]]],
    [[[-50, 30], [-30, 30], [-10, 30], [10, 30], [30, 30], [50, 30]]],
    [[[-50, -50], [-50, -30], [-50, -10], [-50, 10], [-50, 30], [-50, 50]]],
    [[[50, -50], [50, -30], [50, -10], [50, 10], [50, 30], [50, 50]]],
    [[[-30, -20], [-30, 0], [-30, 20], [-10, 20], [10, 20], [30, 20]]],
    [[[-40, -40], [-20, -40], [0, -40], [20, -40], [40, -40]]],
    [[[-40, 40], [-20, 40], [0, 40], [20, 40], [40, 40]]],
    [[[-50, -10], [-30, -10], [-10, -10], [10, -10], [30, -10], [50, -10]]],
  ];;

  ROADS.donbas = [
    // Road 1: Mining highway (main transport)
    [[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]],
    // Road 2: Cross road (north-south)
    [[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]],
    // Road 3: Northern mining road
    [[-50, -20], [-25, -20], [0, -20], [25, -20], [50, -20]],
    // Road 4: Southern mining road
    [[-50, 20], [-25, 20], [0, 20], [25, 20], [50, 20]],
    // Road 5: Western perimeter
    [[-50, -50], [-50, -25], [-50, 0], [-50, 25], [-50, 50]],
    // Road 6: Eastern perimeter
    [[50, -50], [50, -25], [50, 0], [50, 25], [50, 50]],
    // Road 7: Mine access road (west)
    [[-40, -40], [-40, -20], [-40, 0], [-40, 20], [-40, 40]],
    // Road 8: Mine access road (east)
    [[40, -40], [40, -20], [40, 0], [40, 20], [40, 40]],
    // Road 9: Diagonal supply road
    [[-50, -50], [-25, -25], [0, 0], [25, 25], [50, 50]],
    // Road 10: Diagonal supply road
    [[50, -50], [25, -25], [0, 0], [-25, 25], [-50, 50]],
  ];

  ROADS.belgorod = [
    [[[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]]],
    [[[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]]],
    [[[-50, -20], [-25, -20], [0, -20], [25, -20], [50, -20]]],
    [[[-50, 20], [-25, 20], [0, 20], [25, 20], [50, 20]]],
    [[[-50, -50], [-50, -25], [-50, 0], [-50, 25], [-50, 50]]],
    [[[50, -50], [50, -25], [50, 0], [50, 25], [50, 50]]],
    [[[-30, -40], [-10, -40], [10, -40], [30, -40]]],
    [[[-30, 40], [-10, 40], [10, 40], [30, 40]]],
    [[[-50, -50], [-25, -25], [0, 0], [25, 25], [50, 50]]],
    [[[50, -50], [25, -25], [0, 0], [-25, 25], [-50, 50]]],
  ];;

  ROADS.kremlin = [
    [[[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]]],
    [[[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]]],
    [[[0, -50], [0, -35], [0, -20], [-10, -10], [-20, 0]]],
    [[[-20, -20], [0, -20], [20, -20], [20, 0], [20, 20], [0, 20], [-20, 20], [-20, 0]]],
    [[[-50, -35], [-25, -35], [0, -35], [25, -35], [50, -35]]],
    [[[-50, 35], [-25, 35], [0, 35], [25, 35], [50, 35]]],
    [[[-50, -50], [-50, -25], [-50, 0], [-50, 25], [-50, 50]]],
    [[[50, -50], [50, -25], [50, 0], [50, 25], [50, 50]]],
    [[[-30, -30], [-30, 0], [-30, 30], [0, 30], [30, 30], [30, 0], [30, -30], [0, -30]]],
    [[[-50, -50], [-50, 0], [-50, 50], [0, 50], [50, 50], [50, 0], [50, -50], [0, -50]]],
  ];;

  ROADS.kyiv = [
    [[[-50, 0], [-30, 0], [-10, 0], [0, 0], [10, 0], [30, 0], [50, 0]]],
    [[[0, -50], [0, -30], [0, -10], [0, 0], [0, 10], [0, 30]]],
    [[[15, -50], [15, -30], [15, -10], [15, 10], [15, 30]]],
    [[[45, -50], [45, -30], [45, -10], [45, 10], [45, 30], [45, 50]]],
    [[[-18, -50], [-18, -30], [-18, -10], [-18, 10]]],
    [[[-20, -15], [-22, -5], [-25, 5], [-28, 15]]],
    [[[10, 10], [15, 15], [20, 20], [25, 30], [28, 40]]],
    [[[-50, -20], [-35, -20], [-20, -18], [-15, -15]]],
    [[[30, -20], [40, -10], [45, 0], [48, 20], [50, 40]]],
    [[[-10, 30], [10, 30], [25, 30], [40, 30], [50, 30]]],
  ];;

  ROADS.snakeIsland = [
    // Small island — minimal road network
    [[-10, 0], [0, 0], [10, 0]],
    [[0, -10], [0, 0], [0, 10]],
    [[-8, -8], [0, 0], [8, 8]],
    [[8, -8], [0, 0], [-8, 8]],
    [[-5, -5], [5, -5]],
    [[-5, 5], [5, 5]],
    [[-5, -5], [-5, 5]],
    [[5, -5], [5, 5]],
    [[-10, -5], [-10, 5]],
    [[10, -5], [10, 5]],
  ];

  ROADS.saky = [
    // Road 1: Main runway taxiway
    [[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]],
    // Road 2: Cross taxiway
    [[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]],
    // Road 3: Northern perimeter
    [[-50, -30], [-25, -30], [0, -30], [25, -30], [50, -30]],
    // Road 4: Southern perimeter
    [[-50, 30], [-25, 30], [0, 30], [25, 30], [50, 30]],
    // Road 5: Western perimeter
    [[-50, -50], [-50, -25], [-50, 0], [-50, 25], [-50, 50]],
    // Road 6: Eastern perimeter
    [[50, -50], [50, -25], [50, 0], [50, 25], [50, 50]],
    // Road 7: Hangar access (north)
    [[-30, -20], [-30, 0], [-30, 20]],
    // Road 8: Hangar access (south)
    [[30, -20], [30, 0], [30, 20]],
    // Road 9: Fuel depot road
    [[-20, 20], [0, 20], [20, 20]],
    // Road 10: Command post road
    [[-15, -15], [0, -15], [15, -15]],
  ];

  ROADS.vuhledar = [
    // Road 1: Main mining road
    [[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]],
    // Road 2: Cross road (destroyed)
    [[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]],
    // Road 3: Northern ring (cratered)
    [[-50, -20], [-25, -20], [0, -20], [25, -20], [50, -20]],
    // Road 4: Southern ring (cratered)
    [[-50, 20], [-25, 20], [0, 20], [25, 20], [50, 20]],
    // Road 5: Western approach
    [[-50, -50], [-50, -25], [-50, 0], [-50, 25], [-50, 50]],
    // Road 6: Eastern approach
    [[50, -50], [50, -25], [50, 0], [50, 25], [50, 50]],
    // Road 7: Mine access (north)
    [[-30, -40], [-30, -20], [-30, 0], [-30, 20]],
    // Road 8: Mine access (south)
    [[30, -40], [30, -20], [30, 0], [30, 20]],
    // Road 9: Diagonal (destroyed)
    [[-50, -50], [-25, -25], [0, 0], [25, 25], [50, 50]],
    // Road 10: Diagonal (destroyed)
    [[50, -50], [25, -25], [0, 0], [-25, 25], [-50, 50]],
  ];

  ROADS.antonov = [
    // Road 1: Bridge main road
    [[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]],
    // Road 2: West bank approach
    [[-50, -20], [-30, -20], [-10, -20], [0, -20]],
    // Road 3: East bank approach
    [[0, -20], [10, -20], [30, -20], [50, -20]],
    // Road 4: West bank connector
    [[-50, 0], [-50, -20], [-50, -40]],
    // Road 5: East bank connector
    [[50, 0], [50, -20], [50, -40]],
    // Road 6: River embankment (west)
    [[-50, -30], [-30, -30], [-10, -30]],
    // Road 7: River embankment (east)
    [[10, -30], [30, -30], [50, -30]],
    // Road 8: Port road (west)
    [[-40, 10], [-40, 30], [-40, 50]],
    // Road 9: Port road (east)
    [[40, 10], [40, 30], [40, 50]],
    // Road 10: Cross-river connector
    [[-20, -10], [-20, 10], [-20, 30]],
  ];

  ROADS.refinery = [
    // Road 1: Main plant road (north-south)
    [[0, -50], [0, -30], [0, -10], [0, 10], [0, 30], [0, 50]],
    // Road 2: Main plant road (east-west)
    [[-50, 0], [-30, 0], [-10, 0], [10, 0], [30, 0], [50, 0]],
    // Road 3: Northern perimeter
    [[-50, -30], [-25, -30], [0, -30], [25, -30], [50, -30]],
    // Road 4: Southern perimeter
    [[-50, 30], [-25, 30], [0, 30], [25, 30], [50, 30]],
    // Road 5: Western perimeter
    [[-50, -50], [-50, -25], [-50, 0], [-50, 25], [-50, 50]],
    // Road 6: Eastern perimeter
    [[50, -50], [50, -25], [50, 0], [50, 25], [50, 50]],
    // Road 7: Tank farm access
    [[-30, -20], [-30, 0], [-30, 20]],
    // Road 8: Processing unit access
    [[30, -20], [30, 0], [30, 20]],
    // Road 9: Fuel storage road
    [[-20, 20], [0, 20], [20, 20]],
    // Road 10: Security road
    [[-20, -20], [0, -20], [20, -20]],
  ];

  ROADS.treeline = [
    // Woodland roads — mostly dirt tracks
    [[-30, -30], [-20, -20], [-10, -10], [0, 0], [10, 10], [20, 20]],
    [[-30, 30], [-20, 20], [-10, 10], [0, 0], [10, -10], [20, -20]],
    [[-30, 0], [-20, 0], [-10, 0], [0, 0], [10, 0], [20, 0]],
    [[0, -30], [0, -20], [0, -10], [0, 0], [0, 10], [0, 20]],
    [[-20, -20], [0, -20], [20, -20]],
    [[-20, 20], [0, 20], [20, 20]],
    [[-20, -20], [-20, 0], [-20, 20]],
    [[20, -20], [20, 0], [20, 20]],
    [[-40, -10], [-30, -10], [-20, -10]],
    [[20, 10], [30, 10], [40, 10]],
  ];

  ROADS.siegeMoscow = [
    [[[0, -60], [0, -40], [0, -20], [0, 0], [0, 20], [0, 40], [0, 60]]],
    [[[-60, 0], [-40, 0], [-20, 0], [0, 0], [20, 0], [40, 0], [60, 0]]],
    [[[0, -60], [-10, -50], [-20, -40], [-30, -30]]],
    [[[-30, -30], [-30, 0], [-30, 30], [0, 30], [30, 30], [30, 0], [30, -30], [0, -30]]],
    [[[-50, -50], [-50, 0], [-50, 50], [0, 50], [50, 50], [50, 0], [50, -50], [0, -50]]],
    [[[-60, -40], [-30, -40], [0, -40], [30, -40], [60, -40]]],
    [[[-60, 40], [-30, 40], [0, 40], [30, 40], [60, 40]]],
    [[[-40, -60], [-40, -30], [-40, 0], [-40, 30], [-40, 60]]],
    [[[40, -60], [40, -30], [40, 0], [40, 30], [40, 60]]],
    [[[-60, -60], [-60, 0], [-60, 60], [0, 60], [60, 60], [60, 0], [60, -60], [0, -60]]],
  ];;

  // ── Map stage names to city keys ──────────────────────────
  const STAGE_MAP = {
    'hostomel': 'hostomel',
    'avdiivka': 'avdiivka',
    'bakhmut': 'bakhmut',
    'kherson': 'kherson',
    'mariupol': 'mariupol',
    'crimea': 'crimea',
    'chornobyl': 'chornobyl',
    'moscow': 'moscow',
    'sevastopol': 'sevastopol',
    'donbas': 'donbas',
    'belgorod': 'belgorod',
    'kremlin': 'kremlin',
    'kyiv': 'kyiv',
    'snakeIsland': 'snakeIsland',
    'saky': 'saky',
    'vuhledar': 'vuhledar',
    'antonov': 'antonov',
    'refinery': 'refinery',
    'treeline': 'treeline',
    'siegeMoscow': 'siegeMoscow',
  };

  // ── Treeline / Trench Warfare Templates (Ukraine 2023-2024) ──

  function trenchLine(ox, oz, gy, length, direction) {
    // Zigzag trench pattern with sandbag walls, wooden supports, firing steps
    // direction: angle in radians, perpendicular to trench line
    var perpX = Math.sin(direction), perpZ = Math.cos(direction);
    var segLen = 8; // length of each zigzag segment
    var segCount = Math.floor(length / segLen);
    for (var seg = 0; seg < segCount; seg++) {
      var segOffset = (seg - segCount / 2) * segLen;
      var sx = ox + perpX * segOffset;
      var sz = oz + perpZ * segOffset;
      var zig = (seg % 2 === 0) ? 1 : -1;
      // Trench floor (dug down 1 block)
      for (var t = -2; t <= 2; t++) {
        for (var d = 0; d < 3; d++) {
          var tx = Math.round(sx + perpZ * t * zig);
          var tz = Math.round(sz - perpX * t * zig);
          setBlock(tx, gy - 1, tz, PAL.DIRT);
          if (d === 0) setBlock(tx, gy, tz, PAL.AIR); // walkable floor
        }
      }
      // Sandbag walls on both sides
      for (var sb = -1; sb <= 1; sb += 2) {
        for (var sbi = -2; sbi <= 2; sbi++) {
          var sbx = Math.round(sx + perpZ * sbi + perpX * 2.5 * sb);
          var sbz = Math.round(sz - perpX * sbi + perpZ * 2.5 * sb);
          if (Math.random() < 0.85) {
            setBlock(sbx, gy, sbz, PAL.SANDBAG);
            if (Math.random() < 0.5) setBlock(sbx, gy + 1, sbz, PAL.SANDBAG);
          }
        }
      }
      // Wooden support posts every other segment
      if (seg % 2 === 0) {
        var wx = Math.round(sx), wz = Math.round(sz);
        setBlock(wx, gy, wz, PAL.WOOD);
        setBlock(wx, gy + 1, wz, PAL.WOOD);
      }
      // Firing step (raised dirt on one side)
      for (var fs = -2; fs <= 2; fs++) {
        var fsx = Math.round(sx + perpZ * fs + perpX * 1.8);
        var fsz = Math.round(sz - perpX * fs + perpZ * 1.8);
        setBlock(fsx, gy - 0.5, fsz, PAL.DIRT);
      }
    }
  }

  function dugout(ox, oz, gy) {
    // Covered bunker with firing slit, sandbag roof, wooden supports
    // 5x4x3 hollow structure
    for (var x = -2; x <= 2; x++) {
      for (var z = -2; z <= 2; z++) {
        for (var y = 0; y < 3; y++) {
          var isWall = x === -2 || x === 2 || z === -2 || z === 2;
          var isRoof = y === 2;
          if (isWall || isRoof) {
            var mat = (y === 0) ? PAL.DIRT : ((y === 2) ? PAL.SANDBAG : PAL.WOOD);
            setBlock(ox + x, gy + y, oz + z, mat);
          } else {
            setBlock(ox + x, gy + y, oz + z, PAL.AIR);
          }
        }
      }
    }
    // Firing slit (front wall, 2 blocks wide, 1 high)
    setBlock(ox, gy + 1, oz + 2, PAL.AIR);
    setBlock(ox + 1, gy + 1, oz + 2, PAL.AIR);
    // Sandbag reinforcements around entrance
    setBlock(ox - 1, gy, oz + 3, PAL.SANDBAG);
    setBlock(ox + 2, gy, oz + 3, PAL.SANDBAG);
    setBlock(ox - 1, gy + 1, oz + 3, PAL.SANDBAG);
    setBlock(ox + 2, gy + 1, oz + 3, PAL.SANDBAG);
    // Wooden support beam over entrance
    for (var bx = -1; bx <= 2; bx++) {
      setBlock(ox + bx, gy + 2, oz + 2, PAL.WOOD);
    }
    // Internal ammo crate
    setBlock(ox - 1, gy, oz - 1, PAL.METAL);
  }

  function dragonsTeeth(ox, oz, gy, count, direction) {
    // Concrete anti-tank obstacles ("pyramids") in a staggered line
    // Based on Russian Surovikin line defenses in Zaporizhzhia
    var perpX = Math.sin(direction), perpZ = Math.cos(direction);
    for (var i = 0; i < count; i++) {
      var offset = (i - count / 2) * 3.5;
      var stagger = (i % 2 === 0) ? 0 : 1.5;
      var dx = ox + perpX * offset + perpZ * stagger;
      var dz = oz + perpZ * offset - perpX * stagger;
      // Concrete pyramid (3-high stepped)
      var bx = Math.round(dx), bz = Math.round(dz);
      setBlock(bx, gy, bz, PAL.CONCRETE);
      setBlock(bx + 1, gy, bz, PAL.CONCRETE);
      setBlock(bx, gy, bz + 1, PAL.CONCRETE);
      setBlock(bx + 1, gy, bz + 1, PAL.CONCRETE);
      setBlock(bx, gy + 1, bz, PAL.CONCRETE);
      setBlock(bx + 1, gy + 1, bz, PAL.CONCRETE);
      setBlock(bx, gy + 1, bz + 1, PAL.CONCRETE);
      setBlock(bx + 1, gy + 1, bz + 1, PAL.CONCRETE);
      setBlock(bx, gy + 2, bz, PAL.CONCRETE);
      setBlock(bx + 1, gy + 2, bz, PAL.CONCRETE);
      setBlock(bx, gy + 2, bz + 1, PAL.CONCRETE);
      setBlock(bx + 1, gy + 2, bz + 1, PAL.CONCRETE);
      setBlock(bx, gy + 3, bz, PAL.CONCRETE);
      setBlock(bx + 1, gy + 3, bz, PAL.CONCRETE);
      setBlock(bx, gy + 3, bz + 1, PAL.CONCRETE);
      setBlock(bx + 1, gy + 3, bz + 1, PAL.CONCRETE);
      // Optional: top cap
      if (Math.random() < 0.3) {
        setBlock(bx, gy + 4, bz, PAL.CONCRETE);
      }
    }
  }

  function bunker(ox, oz, gy) {
    // Reinforced concrete bunker with machine gun port
    // 7x6x4 structure with reinforced walls and overhead cover
    for (var x = -3; x <= 3; x++) {
      for (var z = -3; z <= 3; z++) {
        for (var y = 0; y < 4; y++) {
          var isWall = x === -3 || x === 3 || z === -3 || z === 3;
          var isRoof = y === 3;
          var isFloor = y === 0;
          if (isWall || isRoof || isFloor) {
            var mat = isRoof ? PAL.REINFORCED : (isFloor ? PAL.CONCRETE : PAL.CONCRETE);
            // 20% chance of reinforced wall blocks
            if (isWall && !isFloor && Math.random() < 0.3) mat = PAL.REINFORCED;
            setBlock(ox + x, gy + y, oz + z, mat);
          } else {
            setBlock(ox + x, gy + y, oz + z, PAL.AIR);
          }
        }
      }
    }
    // Machine gun port (front, centered, 1x1)
    setBlock(ox, gy + 1, oz + 3, PAL.AIR);
    setBlock(ox, gy + 2, oz + 3, PAL.AIR);
    // Entry (rear, offset)
    setBlock(ox + 2, gy, oz - 3, PAL.AIR);
    setBlock(ox + 2, gy + 1, oz - 3, PAL.AIR);
    // Blast baffle at entry
    setBlock(ox + 2, gy, oz - 4, PAL.SANDBAG);
    setBlock(ox + 2, gy + 1, oz - 4, PAL.SANDBAG);
    // Reinforced firing table inside
    setBlock(ox - 1, gy, oz + 2, PAL.CONCRETE);
    setBlock(ox - 1, gy + 1, oz + 2, PAL.CONCRETE);
    // Overhead earth cover (2 layers of dirt on roof)
    for (var x = -3; x <= 3; x++) {
      for (var z = -3; z <= 3; z++) {
        setBlock(ox + x, gy + 4, oz + z, PAL.DIRT);
        if (Math.random() < 0.5) setBlock(ox + x, gy + 5, oz + z, PAL.DIRT);
      }
    }
    // Camo netting supports (4 corners)
    var corners = [[-3, -3], [3, -3], [-3, 3], [3, 3]];
    for (var ci = 0; ci < corners.length; ci++) {
      var cx = corners[ci][0], cz = corners[ci][1];
      for (var ch = 4; ch <= 6; ch++) {
        setBlock(ox + cx, gy + ch, oz + cz, PAL.WOOD);
      }
    }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    CITIES: CITIES,
    ROADS: ROADS,
    STAGE_MAP: STAGE_MAP,
    // Building template functions (for voxel-world.js to call)
    sovietApartment: sovietApartment,
    orthodoxChurch: orthodoxChurch,
    industrialFactory: industrialFactory,
    airportTerminal: airportTerminal,
    hangar: hangar,
    warehouse: warehouse,
    officeBuilding: officeBuilding,
    controlTower: controlTower,
    monument: monument,
    bridge: bridge,
    radarStation: radarStation,
    trenchLine: trenchLine,
    dugout: dugout,
    dragonsTeeth: dragonsTeeth,
    bunker: bunker,
    ruinedBuilding: ruinedBuilding,
  };
})();

if (typeof window !== 'undefined') {
  window.CityBuildings = CityBuildings;
}
