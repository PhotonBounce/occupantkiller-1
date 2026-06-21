// Minimal THEMES object for robust QA/headless/test harness
const THEMES = {
  grassland: {
    fogColor: 0xBFD8FF,
    heightScale: 1.0,
    surfaceBlock: typeof BLOCK !== 'undefined' ? BLOCK.GRASS : 2,
    subBlock: typeof BLOCK !== 'undefined' ? BLOCK.DIRT : 1
  },
  urban: {
    fogColor: 0x8F877C,
    heightScale: 0.65,
    surfaceBlock: typeof BLOCK !== 'undefined' ? BLOCK.CONCRETE : 9,
    subBlock: typeof BLOCK !== 'undefined' ? BLOCK.BRICK : 10
  },
  industrial: {
    fogColor: 0x5D626B,
    heightScale: 0.55,
    surfaceBlock: typeof BLOCK !== 'undefined' ? BLOCK.ASPHALT : 18,
    subBlock: typeof BLOCK !== 'undefined' ? BLOCK.METAL : 5
  },
  coastal: {
    fogColor: 0x87B4D8,
    heightScale: 0.8,
    surfaceBlock: typeof BLOCK !== 'undefined' ? BLOCK.SAND : 7,
    subBlock: typeof BLOCK !== 'undefined' ? BLOCK.DIRT : 1
  },
  wasteland: {
    fogColor: 0x807255,
    heightScale: 0.9,
    surfaceBlock: typeof BLOCK !== 'undefined' ? BLOCK.DIRT : 1,
    subBlock: typeof BLOCK !== 'undefined' ? BLOCK.STONE : 3
  },
  cityscape: {
    fogColor: 0x6E727A,
    heightScale: 0.45,
    surfaceBlock: typeof BLOCK !== 'undefined' ? BLOCK.CONCRETE : 9,
    subBlock: typeof BLOCK !== 'undefined' ? BLOCK.STONE : 3
  }
};
// Ensure window.BLOCK and window.VoxelWorld are always defined before any code runs (robust for QA/headless)
if (typeof window !== 'undefined') {
  if (typeof window.BLOCK === 'undefined') window.BLOCK = {};
  if (typeof window.VoxelWorld === 'undefined') window.VoxelWorld = {};
  if (typeof window.WORLD_CHUNKS === 'undefined') window.WORLD_CHUNKS = 32;
  if (typeof window.CHUNK_SIZE === 'undefined') window.CHUNK_SIZE = 32;
  if (typeof window.CHUNK_HEIGHT === 'undefined') window.CHUNK_HEIGHT = 64;
  if (typeof window.BLOCK_SIZE === 'undefined') window.BLOCK_SIZE = 1;
}
const WORLD_CHUNKS = typeof window !== 'undefined' ? window.WORLD_CHUNKS : 32;
const CHUNK_SIZE = typeof window !== 'undefined' ? window.CHUNK_SIZE : 32;
const CHUNK_HEIGHT = typeof window !== 'undefined' ? window.CHUNK_HEIGHT : 64;
const BLOCK_SIZE = typeof window !== 'undefined' ? window.BLOCK_SIZE : 1;
// (Removed: window.BLOCK export here; handled at end of file)
  function generateRoundabout(ox, oz, radius) {
    // Draw a circular asphalt road
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const rx = Math.round(ox + Math.cos(angle) * radius);
      const rz = Math.round(oz + Math.sin(angle) * radius);
      setBlock(rx, getTerrainHeight(rx, rz), rz, BLOCK.ASPHALT);
      // Center garden
      if (angle % 0.3 < 0.1) setBlock(ox + Math.round(Math.cos(angle) * (radius - 2)), 3, oz + Math.round(Math.sin(angle) * (radius - 2)), BLOCK.BUSH);
    }
    // Connect roads in 4 directions
    generateRoad(ox - radius, oz, ox - radius - 8, oz, 3);
    generateRoad(ox + radius, oz, ox + radius + 8, oz, 3);
    generateRoad(ox, oz - radius, ox, oz - radius - 8, 3);
    generateRoad(ox, oz + radius, ox, oz + radius + 8, 3);
  }













// Universal Module Definition for VoxelWorld
window.VoxelWorld = (function () {
  const BLOCK = Object.freeze({
    AIR:         0,
    DIRT:        1,
    GRASS:       2,
    STONE:       3,
    WOOD:        4,
    METAL:       5,
    ELECTRONICS: 6,
    SAND:        7,
    WATER:       8,
    CONCRETE:    9,
    BRICK:       10,
    GLASS:       11,
    FUEL_BARREL: 12,
    CRATE:       13,
    REINFORCED:  14,
    FENCE:       15,
    RUBBLE:      16,
    SANDBAG:     17,
    ASPHALT:     18,
    ROOFTILE:    19,
    PLASTER:     20,
    CARPET:      21,
    LINOLEUM:    22,
    WALLPAPER:   23,
    CERAMIC:     24,
    SHINGLE:     25,
    BUSH:        26,
    LIGHT:       27,
    CAR:         28,
    DOOR:        29,
    LADDER:      30,
    LAMPPOST:    31,
    STREETLIGHT: 32,
    BENCH:       33,
    SIGN:        34,
    BRIDGE:      35,
    TUNNEL:      36,
    FIRE:        37,
    FLAG:        38,
    BANNER:      39,
    LOOT_CRATE:  40,
    ROOFTOP_HATCH: 41,
    BREAKABLE_FENCE: 42,
    ZIPLINE:     43,
    TRUCK:       44,
    BUS:         45,
    SHOP_SIGN:   46,
    SHELF:       47,
    COUNTER:     48,
    MAILBOX:     49,
    STREET_SIGN: 50,
    BUS_STOP:    51,
    PARK_TREE:   52,
    SLIDE:       53,
    SWING:       54,
    STATUE:      55,
    UMBRELLA:    56,
    GOALPOST:    57,
    TABLE:       58,
    SANDBOX:     59,
    CONFETTI:    60,
    CROWD:       61,
    FIREWORK:    62,
    PARADE_VEHICLE: 63,
    BLUE_TILE:   64,
    WHITE_TILE:  65,
  });
  if (typeof window !== 'undefined') window.BLOCK = BLOCK;

  const chunks = new Map();

  function chunkKey(cx, cz) {
    return cx + ',' + cz;
  }

  function blockIndex(lx, ly, lz) {
    return ly * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE + lx;
  }

  function worldToChunk(wx, wz) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { cx, cz, lx, lz };
  }

  function getChunk(cx, cz) {
    return chunks.get(chunkKey(cx, cz)) || null;
  }

  function createChunk(cx, cz) {
    const chunk = {
      cx: cx,
      cz: cz,
      data: new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE),
      mesh: null,
      waterMesh: null,
      dirty: true,
    };
    chunks.set(chunkKey(cx, cz), chunk);
    return chunk;
  }

  function getBlock(wx, wy, wz) {
    const iy = Math.floor(wy);
    if (iy < 0 || iy >= CHUNK_HEIGHT) return BLOCK.AIR;
    const world = worldToChunk(Math.floor(wx), Math.floor(wz));
    const chunk = getChunk(world.cx, world.cz);
    if (!chunk) return BLOCK.AIR;
    return chunk.data[blockIndex(world.lx, iy, world.lz)] || BLOCK.AIR;
  }

  function setBlock(wx, wy, wz, type) {
    const iy = Math.floor(wy);
    if (iy < 0 || iy >= CHUNK_HEIGHT) return false;
    const world = worldToChunk(Math.floor(wx), Math.floor(wz));
    let chunk = getChunk(world.cx, world.cz);
    if (!chunk) chunk = createChunk(world.cx, world.cz);
    chunk.data[blockIndex(world.lx, iy, world.lz)] = type;
    chunk.dirty = true;
    if (world.lx === 0) markDirty(world.cx - 1, world.cz);
    if (world.lx === CHUNK_SIZE - 1) markDirty(world.cx + 1, world.cz);
    if (world.lz === 0) markDirty(world.cx, world.cz - 1);
    if (world.lz === CHUNK_SIZE - 1) markDirty(world.cx, world.cz + 1);
    return true;
  }

  // --- Collision helpers (hoisted for closure order) ---
  function isSolid(wx, wy, wz) {
    const b = getBlock(Math.floor(wx), Math.floor(wy), Math.floor(wz));
    return b !== BLOCK.AIR && b !== BLOCK.WATER;
  }

  // --- Terrain Themes (hoisted for closure order) ---
  let _theme = {
    name: 'grassland',
    isSolid: isSolid,

    // Expose new terrain/prop features as part of the API if needed
    generateOverpass,
    placeBench,
    placeFountain,
    placeStreetlight,
    placePond,
    placePark,
    generateLuxuryVilla,
    generateRoundabout
  };
  // --- Orphaned functions moved inside IIFE ---
  function generateOverpass(ox, oz, length, height) {
    // Elevated road
    for (let i = 0; i < length; i++) {
      for (let h = 0; h < height; h++) {
        setBlock(ox + i, getTerrainHeight(ox + i, oz) + h + 2, oz, h === height - 1 ? BLOCK.ASPHALT : BLOCK.CONCRETE);
      }
    }
  }

  function placeBench(wx, wy, wz) {
    (typeof setBlock !== 'undefined' ? setBlock : (typeof VoxelWorld !== 'undefined' ? VoxelWorld.setBlock : null))(wx, wy, wz, BLOCK.BENCH);
  }


  function placeStreetlight(wx, wy, wz) {
    setBlock(wx, wy, wz, BLOCK.STREETLIGHT);
    setBlock(wx, wy + 1, wz, BLOCK.LAMPPOST);
  }

  function placeMailbox(wx, wy, wz) {
    // Short post + box on top
    setBlock(wx, wy, wz, BLOCK.LAMPPOST);
    setBlock(wx, wy + 1, wz, BLOCK.METAL);
  }

  function placeStreetSign(wx, wy, wz) {
    // Pole + sign-block on top
    setBlock(wx, wy, wz, BLOCK.LAMPPOST);
    setBlock(wx, wy + 1, wz, BLOCK.GLASS);
  }

  function placeBusStop(wx, wy, wz) {
    // Simple shelter: 3 wall blocks + roof
    setBlock(wx, wy, wz, BLOCK.GLASS);
    setBlock(wx, wy + 1, wz, BLOCK.GLASS);
    setBlock(wx, wy + 2, wz, BLOCK.METAL);
  }

  // Russian dugout / trench position. Carves a pit, lines it with sandbags,
  // adds a couple wood plank covers, and spits out a center anchor for spawning a garrison.
  function placeDugout(wx, wy, wz, length) {
    var L = Math.max(3, length || 5);
    var W = 3;
    var depth = 2;
    // Carve trench
    for (var dx = 0; dx < L; dx++) {
      for (var dz = 0; dz < W; dz++) {
        for (var dy = 0; dy < depth; dy++) {
          setBlock(wx + dx, wy - dy, wz + dz, BLOCK.AIR);
        }
        // floor = dirt
        setBlock(wx + dx, wy - depth, wz + dz, BLOCK.DIRT);
      }
    }
    // Sandbag walls along long edges (top of trench)
    for (var i = 0; i < L; i++) {
      setBlock(wx + i, wy + 1, wz - 1, BLOCK.SANDBAG);
      setBlock(wx + i, wy + 1, wz + W, BLOCK.SANDBAG);
      if (i % 2 === 0) {
        setBlock(wx + i, wy + 2, wz - 1, BLOCK.SANDBAG);
        setBlock(wx + i, wy + 2, wz + W, BLOCK.SANDBAG);
      }
    }
    // Wood plank covers (partial)
    if (BLOCK.WOOD !== undefined) {
      setBlock(wx + 1, wy + 1, wz, BLOCK.WOOD);
      setBlock(wx + 1, wy + 1, wz + 1, BLOCK.WOOD);
      setBlock(wx + L - 2, wy + 1, wz + 1, BLOCK.WOOD);
      setBlock(wx + L - 2, wy + 1, wz + 2, BLOCK.WOOD);
    }
    // Mark dirt mound at end of trench (entry)
    setBlock(wx, wy, wz - 1, BLOCK.DIRT);
    setBlock(wx + L - 1, wy, wz + W, BLOCK.DIRT);
    return {
      x: wx + Math.floor(L / 2),
      y: wy - depth + 1,
      z: wz + Math.floor(W / 2),
      length: L, width: W, depth: depth
    };
  }

  function placeFountain(wx, wy, wz) {
    setBlock(wx, wy, wz, BLOCK.WATER);
    setBlock(wx, wy + 1, wz, BLOCK.GLASS);
    setBlock(wx, wy + 2, wz, BLOCK.STONE);
  }


  function placePond(wx, wy, wz, r) {
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (dx*dx + dz*dz <= r*r) setBlock(wx + dx, wy, wz + dz, BLOCK.WATER);
    }
  }

  function placePark(wx, wy, wz, w, d) {
    for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) setBlock(wx + x, wy, wz + z, BLOCK.GRASS);
    if (w > 3 && d > 3) placeFountain(wx + Math.floor(w/2), wy, wz + Math.floor(d/2));
    for (let t = 0; t < 3; t++) placeTree(wx + 1 + t*2, wy + 1, wz + 1 + t*2, t % 3);
  }

  function generateLuxuryVilla(ox, oz, w, d) {
    // Large, modern house with glass, pool, and garden
    const h = 4;
    // Main structure: white concrete walls, lots of glass
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) {
      const isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
      if (isWall) setBlock(ox + x, getTerrainHeight(ox + x, oz + z) + y, oz + z, BLOCK.CONCRETE);
      else if (y === h - 1) setBlock(ox + x, getTerrainHeight(ox + x, oz + z) + y, oz + z, BLOCK.ROOFTILE);
      else if (x % 2 === 0 && z % 2 === 0 && y === 1) setBlock(ox + x, getTerrainHeight(ox + x, oz + z) + y, oz + z, BLOCK.GLASS);
    }
    // Pool in the yard
    for (let px = 2; px < w - 2; px++) for (let pz = d; pz < d + 3; pz++) {
      setBlock(ox + px, getTerrainHeight(ox + px, oz + pz), oz + pz, BLOCK.WATER);
    }
  }

  // Each vehicle is an object: { type, pos: {x,y,z}, dir, speed, waypointIdx }
  let _activeVehicles = [];
  function spawnVehicle(type, startPos, dir, speed) {
    const vehicle = {
      type: type || 'truck',
      pos: startPos ? { x: startPos.x || 0, y: startPos.y || 0, z: startPos.z || 0 } : { x: 0, y: 0, z: 0 },
      dir: dir || 0,
      speed: speed || 0,
      waypointIdx: 0
    };
    _activeVehicles.push(vehicle);
    return vehicle;
  }
  // Expose global no-op for test harness
  if (typeof window !== 'undefined') window.spawnVehicle = spawnVehicle;

  function updateVehicles(dt) {
    const delta = Number.isFinite(dt) ? dt : 0;
    if (!delta || _activeVehicles.length === 0) return;
    for (const vehicle of _activeVehicles) {
      vehicle.pos.x += Math.cos(vehicle.dir) * vehicle.speed * delta;
      vehicle.pos.z += Math.sin(vehicle.dir) * vehicle.speed * delta;
    }
  }

  function getActiveVehicles() {
    return _activeVehicles.slice();
  }

  function clearVehicles() {
    _activeVehicles.length = 0;
  }

  // Moved BLOCK_COLORS inside IIFE
  const BLOCK_COLORS = {
    [BLOCK.DIRT]:       0x7A5A3A,
    [BLOCK.GRASS]:      0x005BBB,
    [BLOCK.STONE]:      0x7F7F86,
    [BLOCK.WOOD]:       0x8B5A2B,
    [BLOCK.METAL]:      0x6F7C85,
    [BLOCK.ELECTRONICS]:0x3A5F8C,
    [BLOCK.SAND]:       0xC9B27C,
    [BLOCK.WATER]:      0x3D7FB3,
    [BLOCK.CONCRETE]:   0xA4A7AC,
    [BLOCK.BRICK]:      0xA54B3F,
    [BLOCK.GLASS]:      0xA9D8E8,
    [BLOCK.FUEL_BARREL]:0xB2472F,
    [BLOCK.CRATE]:      0x8A6A3C,
    [BLOCK.REINFORCED]: 0x545B66,
    [BLOCK.FENCE]:      0x857A6A,
    [BLOCK.RUBBLE]:     0x6F6256,
    [BLOCK.SANDBAG]:    0xA89A72,
    [BLOCK.ASPHALT]:    0x34363A,
    [BLOCK.ROOFTILE]:   0x78433B,
    [BLOCK.PLASTER]:    0xD7D2C8,
    [BLOCK.CARPET]:     0x8A2F2F,
    [BLOCK.LINOLEUM]:   0x8E8A74,
    [BLOCK.WALLPAPER]:  0xC7C19E,
    [BLOCK.CERAMIC]:    0xD9DDD8,
    [BLOCK.SHINGLE]:    0x4D535C,
    [BLOCK.BUSH]:       0x0057A0,
    [BLOCK.LIGHT]:      0xFFE8A3,
    [BLOCK.CAR]:        0x2C4B7C,
    [BLOCK.DOOR]:       0x6B4627,
    [BLOCK.LADDER]:     0x8D6B3F,
    [BLOCK.LAMPPOST]:   0x4F545B,
    [BLOCK.STREETLIGHT]:0xD6C26E,
    [BLOCK.BENCH]:      0x7B5632,
    [BLOCK.SIGN]:       0xC8C39B,
    [BLOCK.BRIDGE]:     0x70757D,
    [BLOCK.TUNNEL]:     0x595146,
    [BLOCK.FIRE]:       0xFF6A00,
    [BLOCK.FLAG]:       0x2F65C7,
    [BLOCK.BANNER]:     0xB33A3A,
    [BLOCK.LOOT_CRATE]: 0x9A793A,
    [BLOCK.ROOFTOP_HATCH]: 0x5A6068,
    [BLOCK.BREAKABLE_FENCE]: 0x9B8A6E,
    [BLOCK.ZIPLINE]:    0xC8B45A,
    [BLOCK.TRUCK]:      0x444444,  // dark gray truck
    [BLOCK.BUS]:        0xFFD700,  // yellow bus
    [BLOCK.SHOP_SIGN]:  0xFFD700,  // yellow shop sign
    [BLOCK.SHELF]:      0x8B5A2B,  // brown shelf
    [BLOCK.COUNTER]:    0xC2B280,  // tan counter
    [BLOCK.MAILBOX]:    0x1E90FF,  // blue mailbox
    [BLOCK.STREET_SIGN]:0x228B22,  // green sign
    [BLOCK.BUS_STOP]:   0xAAAAAA,  // gray bus stop
    [BLOCK.PARK_TREE]:  0x228B22,  // green tree
    [BLOCK.SLIDE]:      0xFFD700,  // yellow slide
    [BLOCK.SWING]:      0x2222FF,  // blue swing
    [BLOCK.STATUE]:     0xCCCCCC,  // gray statue
    [BLOCK.UMBRELLA]:   0xFF69B4,  // pink umbrella
    [BLOCK.GOALPOST]:   0xFFFFFF,  // white goalpost
    [BLOCK.TABLE]:      0x8B4513,  // brown table
    [BLOCK.SANDBOX]:    0xFFF8DC,  // sand color
    [BLOCK.BLUE_TILE]:  0x0057B8,  // Ukrainian blue tile (hallways)
    [BLOCK.WHITE_TILE]: 0xF0F0F0,  // white tile (upper hallway walls)
  };
  // Expose BLOCK_COLORS globally for legacy/stray references
  if (typeof window !== 'undefined') window.BLOCK_COLORS = BLOCK_COLORS;

  // --- New Feature Placement Functions ---
  // ── Military Checkpoint Feature ──
  function generateMilitaryCheckpoint(ox, oz) {
    // Sandbag barriers
    for (let i = 0; i < 7; i++) {
      setBlock(ox + i, getTerrainHeight(ox + i, oz), oz, BLOCK.SANDBAG);
      setBlock(ox + i, getTerrainHeight(ox + i, oz + 4), oz + 4, BLOCK.SANDBAG);
    }
    for (let j = 1; j < 4; j++) {
      setBlock(ox, getTerrainHeight(ox, oz + j), oz + j, BLOCK.SANDBAG);
      setBlock(ox + 6, getTerrainHeight(ox + 6, oz + j), oz + j, BLOCK.SANDBAG);
    }
    // Guard hut
    for (let y = 0; y < 3; y++) for (let x = 2; x < 5; x++) for (let z = 1; z < 4; z++) {
      setBlock(ox + x, getTerrainHeight(ox + x, oz + z) + y, oz + z, y === 2 ? BLOCK.METAL : BLOCK.CONCRETE);
    }
    // Barriers
    setBlock(ox + 3, getTerrainHeight(ox + 3, oz) + 1, oz, BLOCK.FENCE);
    setBlock(ox + 3, getTerrainHeight(ox + 3, oz + 4) + 1, oz + 4, BLOCK.FENCE);
  }

  // ── City Event System (moved to top level for global access) ──
  let activeEvents = [];
  function triggerCityEvent(type) {
            // Ensure triggerCityEvent is available globally immediately after definition
            if (typeof window !== 'undefined') window.triggerCityEvent = triggerCityEvent;
            if (type === 'abduction') {
              // Random beams of light, missing props, floating cows
              for (let i = 0; i < 8; i++) {
                const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
                const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
                for (let y = 0; y < 8; y++) setBlock(ox, getTerrainHeight(ox, oz) + y, oz, BLOCK.LIGHT);
                // Remove random prop
                if (Math.random() < 0.5) setBlock(ox, getTerrainHeight(ox, oz), oz, BLOCK.AIR);
                // Floating cow (use CAR block as placeholder)
                if (Math.random() < 0.3) setBlock(ox, getTerrainHeight(ox, oz) + 9, oz, BLOCK.CAR);
              }
            }
                else if (type === 'abduction') {
                  // Remove beams and floating cows
                  for (let j = 0; j < 10; j++) {
                    const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
                    const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
                    for (let y = 0; y < 8; y++) if (getBlock(ox, getTerrainHeight(ox, oz) + y, oz) === BLOCK.LIGHT) setBlock(ox, getTerrainHeight(ox, oz) + y, oz, BLOCK.AIR);
                    if (getBlock(ox, getTerrainHeight(ox, oz) + 9, oz) === BLOCK.CAR) setBlock(ox, getTerrainHeight(ox, oz) + 9, oz, BLOCK.AIR);
                  }
                }
        if (type === 'sandstorm') {
          // Reduce visibility, tint sky, spawn sand piles
          if (typeof WeatherSystem !== 'undefined' && WeatherSystem.setWeather)
            WeatherSystem.setWeather('sandstorm');
          for (let i = 0; i < 30; i++) {
            const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
            const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
            for (let h = 0; h < 3 + Math.floor(Math.random() * 3); h++) {
              setBlock(ox, getTerrainHeight(ox, oz) + h, oz, BLOCK.SAND);
            }
          }
        }
    // Example: fire, flood, festival, parade
    let duration = 30 + Math.random() * 30;
    if (type === 'festival' || type === 'parade') duration = 45 + Math.random() * 30;
    activeEvents.push({ type, timer: duration });
    if (type === 'fire') {
      // Ignite several burning ruins
      for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        generateBurningRuin(ox, oz);
      }
    } else if (type === 'flood') {
      // Flood low-lying areas with water blocks
      for (let i = 0; i < 10; i++) {
        const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        const surfH = getTerrainHeight(ox, oz);
        for (let h = 0; h < 2 + Math.floor(Math.random() * 2); h++) {
          setBlock(ox, surfH + h, oz, BLOCK.WATER);
        }
      }
    } else if (type === 'festival') {
      // Place festival decorations and crowds
      for (let i = 0; i < 6; i++) {
        const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        setBlock(ox, getTerrainHeight(ox, oz) + 1, oz, BLOCK.FLAG);
        setBlock(ox + 1, getTerrainHeight(ox + 1, oz) + 1, oz, BLOCK.CROWD);
      }
      // Fireworks: place colored blocks in the sky
      for (let i = 0; i < 8; i++) {
        const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        setBlock(ox, getTerrainHeight(ox, oz) + 8 + Math.floor(Math.random() * 6), oz, BLOCK.FIREWORK);
      }
    } else if (type === 'meteor') {
      // Meteor strike: spawn craters and fire
      for (let i = 0; i < 5; i++) {
        const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        for (let r = 2; r < 5; r++) for (let a = 0; a < 360; a += 20) {
          const rad = a * Math.PI / 180;
          const x = ox + Math.round(Math.cos(rad) * r);
          const z = oz + Math.round(Math.sin(rad) * r);
          setBlock(x, getTerrainHeight(x, z), z, BLOCK.AIR);
          setBlock(x, getTerrainHeight(x, z) - 1, z, BLOCK.FIRE);
        }
      }
    } else if (type === 'parade') {
      // Place parade vehicles and banners
      for (let i = 0; i < 4; i++) {
        const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        setBlock(ox, getTerrainHeight(ox, oz) + 1, oz, BLOCK.PARADE_VEHICLE);
        setBlock(ox, getTerrainHeight(ox, oz) + 2, oz, BLOCK.BANNER);
      }
      // Confetti: sprinkle colored blocks
      for (let i = 0; i < 20; i++) {
        const ox = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        const oz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.8);
        setBlock(ox, getTerrainHeight(ox, oz) + 3 + Math.floor(Math.random() * 3), oz, BLOCK.CONFETTI);
      }
    }
  }
  // (Removed stray/partial duplicate updateCityEvents stub)
  function clearCityEvents() { activeEvents = []; }
        // ── Rooftop, Ladder, Zipline Placement ──
        function placeLadder(x, y, z, height = 4) {
          for (let i = 0; i < height; i++) setBlock(x, y + i, z, BLOCK.LADDER);
        }

        function placeZipline(x1, y1, z1, x2, y2, z2) {
          // Place ZIPLINE blocks between two points (simple straight line)
          const steps = Math.max(Math.abs(x2-x1), Math.abs(y2-y1), Math.abs(z2-z1));
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.round(x1 + (x2-x1)*t);
            const y = Math.round(y1 + (y2-y1)*t);
            const z = Math.round(z1 + (z2-z1)*t);
            setBlock(x, y, z, BLOCK.ZIPLINE);
          }
        }

        function placeRooftopHatch(x, y, z) {
          setBlock(x, y, z, BLOCK.ROOFTOP_HATCH);
        }

      function closeDoor(x, y, z) {
        // Close door (set to DOOR, play anim, trigger event)
        if (getBlock(x, y, z) === BLOCK.AIR) {
          setBlock(x, y, z, BLOCK.DOOR);
          if (typeof window.AudioSystem !== 'undefined') {
            window.AudioSystem.playImpact && window.AudioSystem.playImpact(4); // Wood impact
          }
          // Trigger event: could dispatch a custom event if needed
        }
      }

      function openCrate(x, y, z) {
        // Open loot crate (set to AIR, spawn loot)
        if (getBlock(x, y, z) === BLOCK.LOOT_CRATE) {
          setBlock(x, y, z, BLOCK.AIR);
          spawnLoot(x, y, z);
          if (typeof window.AudioSystem !== 'undefined') {
            window.AudioSystem.playImpact && window.AudioSystem.playImpact(11); // Glass impact
          }
          // Trigger event: could dispatch a custom event if needed
        }
      }

      function breakFence(x, y, z) {
        // Break fence (set to AIR, spawn debris)
        if (getBlock(x, y, z) === BLOCK.BREAKABLE_FENCE) {
          setBlock(x, y, z, BLOCK.AIR);
          spawnDebris(x, y, z, BLOCK.BREAKABLE_FENCE);
          if (typeof window.AudioSystem !== 'undefined') {
            window.AudioSystem.playRicochet && window.AudioSystem.playRicochet();
          }
          // Trigger event: could dispatch a custom event if needed
        }
      }

      // --- Road Types: Bridge & Tunnel Placement ---
      function placeBridge(x, y, z, length, width) {
        for (let i = 0; i < length; i++) {
          for (let w = 0; w < width; w++) {
            setBlock(x + i, y, z + w, BLOCK.BRIDGE);
          }
        }
      }

      function placeTunnel(x, y, z, length, height, width) {
        for (let i = 0; i < length; i++) {
          for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
              setBlock(x + i, y + h, z + w, BLOCK.TUNNEL);
            }
          }
        }
      }

  const BLOCK_HARDNESS = {
    [BLOCK.DIRT]:        1,
    [BLOCK.GRASS]:       1,
    [BLOCK.STONE]:       3,
    [BLOCK.WOOD]:        2,
    [BLOCK.METAL]:       4,
    [BLOCK.ELECTRONICS]: 2,
    [BLOCK.SAND]:        0.5,
    [BLOCK.WATER]:       0,
    [BLOCK.CONCRETE]:    4,
    [BLOCK.BRICK]:       3,
    [BLOCK.GLASS]:       0.5,
    [BLOCK.FUEL_BARREL]: 2,
    [BLOCK.CRATE]:       1.5,
    [BLOCK.REINFORCED]:  6,
    [BLOCK.FENCE]:       1,
    [BLOCK.RUBBLE]:      2,
    [BLOCK.SANDBAG]:     1,
    [BLOCK.ASPHALT]:    3,
    [BLOCK.ROOFTILE]:   2,
    [BLOCK.PLASTER]:    1.5,
    [BLOCK.CARPET]:     0.5,
    [BLOCK.LINOLEUM]:   0.5,
    [BLOCK.WALLPAPER]:  1,
    [BLOCK.CERAMIC]:    2,
    [BLOCK.SHINGLE]:    2,
    [BLOCK.BENCH]:      1.2,
    [BLOCK.STREETLIGHT]:2.5,
    [BLOCK.LAMPPOST]:   2.5,
    [BLOCK.BUSH]:       0.3,
    [BLOCK.CAR]:        2.0,
    [BLOCK.BLUE_TILE]:  2,
    [BLOCK.WHITE_TILE]: 1.5,
  // (global export block moved to end of file)
  };

  const BLOCK_TRANSPARENT = new Set([BLOCK.AIR, BLOCK.WATER, BLOCK.GLASS]);

  // ── Cover Degradation System ────────────────────────────────
  // Blocks track accumulated damage. When damage exceeds HP → block breaks.
  // HP = BLOCK_HARDNESS * 30 (soft blocks break fast, reinforced takes sustained fire)
  const _blockDamage = {};  // key "x,y,z" → { hp: remaining, maxHp: initial }
  const _damageDecayRate = 2;  // HP restored per second (cover slowly "recovers" if not shot)
  const _damageDecayDelay = 3; // seconds of no hits before decay starts
  const _blockLastHit = {};    // key → timestamp of last hit

  function _blockKey(x, y, z) { return x + ',' + y + ',' + z; }

  function damageBlock(x, y, z, weaponDamage) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    var blockType = getBlock(x, y, z);
    if (!blockType || blockType === BLOCK.AIR || blockType === BLOCK.WATER) return false;
    var hardness = BLOCK_HARDNESS[blockType] || 1;
    var maxHp = hardness * 30;
    var key = _blockKey(x, y, z);
    if (!_blockDamage[key]) _blockDamage[key] = { hp: maxHp, maxHp: maxHp };
    var dmg = _blockDamage[key];
    // Weapon damage scales inversely with hardness (high-caliber breaks hard cover faster)
    var effectiveDmg = Math.max(1, weaponDamage / hardness);
    dmg.hp -= effectiveDmg;
    _blockLastHit[key] = performance.now() / 1000;
    if (dmg.hp <= 0) {
      // Block destroyed — convert to rubble or air
      delete _blockDamage[key];
      delete _blockLastHit[key];
      if (hardness >= 3 && blockType !== BLOCK.GLASS) {
        setBlock(x, y, z, BLOCK.RUBBLE);
      } else {
        setBlock(x, y, z, BLOCK.AIR);
      }
      return true; // block broke
    }
    return false;
  }

  function updateCoverDegradation(delta) {
    var now = performance.now() / 1000;
    var keysToRemove = [];
    for (var key in _blockDamage) {
      var lastHit = _blockLastHit[key] || 0;
      if (now - lastHit > _damageDecayDelay) {
        var dmg = _blockDamage[key];
        dmg.hp = Math.min(dmg.maxHp, dmg.hp + _damageDecayRate * delta);
        if (dmg.hp >= dmg.maxHp) keysToRemove.push(key);
      }
    }
    for (var i = 0; i < keysToRemove.length; i++) {
      delete _blockDamage[keysToRemove[i]];
      delete _blockLastHit[keysToRemove[i]];
    }
  }

  function getBlockDamageRatio(x, y, z) {
    var key = _blockKey(Math.floor(x), Math.floor(y), Math.floor(z));
    var dmg = _blockDamage[key];
    if (!dmg) return 0;
    return 1 - (dmg.hp / dmg.maxHp);
  }

  function placeBush(wx, wy, wz) {
    setBlock(wx, wy, wz, BLOCK.BUSH);
    setBlock(wx, wy + 1, wz, BLOCK.BUSH);
  }

  function placeCar(wx, wy, wz) {
    setBlock(wx, wy, wz, BLOCK.CAR);
    setBlock(wx + 1, wy, wz, BLOCK.CAR);
  }
  function placeTruck(wx, wy, wz) {
    setBlock(wx, wy, wz, BLOCK.TRUCK);
    setBlock(wx + 1, wy, wz, BLOCK.TRUCK);
  }
  function placeBus(wx, wy, wz) {
    setBlock(wx, wy, wz, BLOCK.BUS);
    setBlock(wx + 1, wy, wz, BLOCK.BUS);
    setBlock(wx + 2, wy, wz, BLOCK.BUS);
  }
    function placeFountain(wx, wy, wz) {
      setBlock(wx, wy, wz, BLOCK.WATER);
      setBlock(wx, wy + 1, wz, BLOCK.GLASS);
      setBlock(wx, wy + 2, wz, BLOCK.STONE);
    }
    // ...existing code for roundabout...

  // --- House Type Generators ---
  function generateCottage(ox, oz, w, d) {
    // Small house, wood walls, sloped roof
    // Simple implementation: rectangle with wood walls, peaked roof
    const h = 3;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          const isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          if (isWall) setBlock(ox + x, getTerrainHeight(ox + x, oz + z) + y, oz + z, BLOCK.WOOD);
          else if (y === h - 1) setBlock(ox + x, getTerrainHeight(ox + x, oz + z) + y, oz + z, BLOCK.ROOFTILE);
        }
      }
    }
    // Door
    setBlock(ox + Math.floor(w / 2), getTerrainHeight(ox + Math.floor(w / 2), oz), oz, BLOCK.DOOR);
    // Simple peaked roof
    for (let x = -1; x <= w; x++) {
      for (let z = -1; z <= d; z++) {
        setBlock(ox + x, getTerrainHeight(ox + x, oz + z) + h, oz + z, BLOCK.ROOFTILE);
      }
    }
    // Add a window
    setBlock(ox + 1, getTerrainHeight(ox + 1, oz + Math.floor(d / 2)) + 1, oz + Math.floor(d / 2), BLOCK.GLASS);
    // Add a bush outside
    if (typeof placeBush !== 'undefined') placeBush(ox - 1, 2, oz + 1);
  }

  function markDirty(cx, cz) {
    const c = getChunk(cx, cz);
    if (c) c.dirty = true;
  }


  // Theme setter/getter
  function setTheme(themeName) {
    _theme = Object.assign({ seed: 0 }, THEMES[themeName] || THEMES.grassland);
  }
  function getTheme() { return _theme; }

  /* ── Terrain Generation ──────────────────────────────────────────── */
  // Simple heightmap with value noise
  function seededRandom(x, z) {
    let n = Math.sin((x + _theme.seed) * 12.9898 + (z + _theme.seed) * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  function smoothNoise(x, z, scale) {
    const sx = x / scale, sz = z / scale;
    const ix = Math.floor(sx), iz = Math.floor(sz);
    const fx = sx - ix, fz = sz - iz;
    const a = seededRandom(ix, iz);
    const b = seededRandom(ix + 1, iz);
    const c = seededRandom(ix, iz + 1);
    const d = seededRandom(ix + 1, iz + 1);
    const u = fx * fx * (3 - 2 * fx);
    const v = fz * fz * (3 - 2 * fz);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }

  function getHeight(wx, wz) {

    const hs = _theme.heightScale;
    const n1 = smoothNoise(wx, wz, 32) * 8 * hs;
    const n2 = smoothNoise(wx + 100, wz + 100, 16) * 4 * hs;
    const n3 = smoothNoise(wx + 200, wz + 200, 8) * 2 * hs;
    return Math.floor(2 + n1 + n2 + n3);
  }

  // Exported terrain height function for test harness and modules
  function getTerrainHeight(wx, wz) {
    return getHeight(wx, wz);
  }

  // Returns the Y coordinate of the topmost solid block at (wx, wz).
  // Unlike getTerrainHeight (which returns the procedural noise height and
  // ignores carved craters / placed structures), this scans actual voxel
  // state from the world ceiling downward. Use this for player spawn
  // placement and ground-snap correctness so the camera can never end up
  // beneath solid geometry.
  function getTopSolidY(wx, wz) {
    var ix = Math.floor(wx);
    var iz = Math.floor(wz);
    // Start a few blocks above the noise height to cover placed structures.
    var startY = Math.min(CHUNK_HEIGHT - 1, getHeight(ix, iz) + 24);
    for (var y = startY; y >= 0; y--) {
      if (isSolid(ix, y, iz)) return y + 1; // top surface = first AIR above solid
    }
    return getHeight(ix, iz) + 1;
  }


  function generateChunkTerrain(chunk) {
    const ox = chunk.cx * CHUNK_SIZE;
    const oz = chunk.cz * CHUNK_SIZE;

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = ox + lx;
        const wz = oz + lz;
        const h = Math.min(getHeight(wx, wz), CHUNK_HEIGHT - 1);

        for (let ly = 0; ly <= h; ly++) {
          let type;
          if (ly === h) {
            type = _theme.surfaceBlock;
          } else if (ly >= h - 3) {
            type = _theme.subBlock;
          } else {
            type = BLOCK.STONE;
          }
          chunk.data[blockIndex(lx, ly, lz)] = type;
        }
      }
    }
    chunk.dirty = true;
  }

  /* ── Mesh Building (greedy-ish per-block face culling) ───────────── */
  const _faceNormals = [
    { dir: [ 1,  0,  0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] }, // +X
    { dir: [-1,  0,  0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] }, // -X
    { dir: [ 0,  1,  0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] }, // +Y
    { dir: [ 0, -1,  0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] }, // -Y
    { dir: [ 0,  0,  1], corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]] }, // +Z
    { dir: [ 0,  0, -1], corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]] }, // -Z
  ];

  function isTransparent(wx, wy, wz) {
    return BLOCK_TRANSPARENT.has(getBlock(wx, wy, wz));
  }

  function buildChunkMesh(chunk, scene) {
    if (chunk.mesh) {
      if (scene) scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      chunk.mesh = null;
    }
    if (chunk.waterMesh) {
      if (scene) scene.remove(chunk.waterMesh);
      chunk.waterMesh.geometry.dispose();
      chunk.waterMesh = null;
    }

    const positions = [];
    const normals   = [];
    const colors    = [];
    const indices   = [];
    let vertCount   = 0;

    // Separate arrays for water geometry
    const wPositions = [];
    const wNormals   = [];
    const wColors    = [];
    const wIndices   = [];
    let wVertCount   = 0;

    const ox = chunk.cx * CHUNK_SIZE;
    const oz = chunk.cz * CHUNK_SIZE;

    // AO darkening factors: index = occlusion level (0=full shadow, 3=no shadow)
    const AO_CURVE = [0.32, 0.55, 0.78, 1.0];

    for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const bt = chunk.data[blockIndex(lx, ly, lz)];
          if (bt === BLOCK.AIR) continue;

          const wx = ox + lx;
          const wz = oz + lz;
          const col = new THREE.Color(BLOCK_COLORS[bt] || 0xFF00FF);
          const isWater = (bt === BLOCK.WATER);

          for (const face of _faceNormals) {
            const fnx = face.dir[0], fny = face.dir[1], fnz = face.dir[2];
            const nbx = wx + fnx;
            const nby = ly + fny;
            const nbz = wz + fnz;

            const nb = getBlock(nbx, nby, nbz);
            // For water blocks: only draw face if neighbor is AIR (skip water-to-water)
            if (isWater) {
              if (nb !== BLOCK.AIR) continue;
            } else {
              if (!BLOCK_TRANSPARENT.has(nb)) continue;
            }

            // Pick target arrays (water vs solid)
            const tPos = isWater ? wPositions : positions;
            const tNrm = isWater ? wNormals : normals;
            const tCol = isWater ? wColors : colors;
            const tIdx = isWater ? wIndices : indices;
            let tVert = isWater ? wVertCount : vertCount;

            // Determine the two tangent axes for AO sampling
            let t0, t1;
            if (fnx !== 0) { t0 = 1; t1 = 2; }
            else if (fny !== 0) { t0 = 0; t1 = 2; }
            else { t0 = 0; t1 = 1; }

            const aoVals = [];
            for (const c of face.corners) {
              // Direction from face center to this corner along each tangent
              const d0 = c[t0] === 0 ? -1 : 1;
              const d1 = c[t1] === 0 ? -1 : 1;

              // Three AO neighbor offsets from the face-neighbor block
              const s1 = [0, 0, 0]; s1[t0] = d0;
              const s2 = [0, 0, 0]; s2[t1] = d1;

              const side1 = isTransparent(nbx + s1[0], nby + s1[1], nbz + s1[2]) ? 0 : 1;
              const side2 = isTransparent(nbx + s2[0], nby + s2[1], nbz + s2[2]) ? 0 : 1;
              const corn  = isTransparent(nbx + s1[0] + s2[0], nby + s1[1] + s2[1], nbz + s1[2] + s2[2]) ? 0 : 1;

              const ao = (side1 && side2) ? 0 : 3 - (side1 + side2 + corn);
              aoVals.push(ao);
              const f = isWater ? 1.0 : AO_CURVE[ao]; // no AO darkening on water

              tPos.push(
                (lx + c[0]) * BLOCK_SIZE,
                (ly + c[1]) * BLOCK_SIZE,
                (lz + c[2]) * BLOCK_SIZE
              );
              tNrm.push(fnx, fny, fnz);
              tCol.push(col.r * f, col.g * f, col.b * f);
            }

            // Flip quad when AO is anisotropic to avoid ugly diagonal artifact
            if (aoVals[0] + aoVals[2] > aoVals[1] + aoVals[3]) {
              tIdx.push(
                tVert, tVert + 1, tVert + 2,
                tVert, tVert + 2, tVert + 3
              );
            } else {
              tIdx.push(
                tVert + 1, tVert + 2, tVert + 3,
                tVert + 1, tVert + 3, tVert
              );
            }
            if (isWater) { wVertCount += 4; } else { vertCount += 4; }
          }
        }
      }
    }


    if (vertCount === 0 && wVertCount === 0) { chunk.dirty = false; return; }

    // Solid terrain mesh
    if (vertCount > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(indices);
      geo.computeBoundingSphere();

      const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox * BLOCK_SIZE, 0, oz * BLOCK_SIZE);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.isVoxelTerrain = true;

      if (scene) scene.add(mesh);
      else console.warn('[VoxelWorld] Skipped mesh add: scene is null', mesh);
      chunk.mesh = mesh;
    }

    // Transparent water mesh
    if (wVertCount > 0) {
      const wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPositions, 3));
      wGeo.setAttribute('normal',   new THREE.Float32BufferAttribute(wNormals, 3));
      wGeo.setAttribute('color',    new THREE.Float32BufferAttribute(wColors, 3));
      wGeo.setIndex(wIndices);
      wGeo.computeBoundingSphere();

      const wMat = new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.position.set(ox * BLOCK_SIZE, 0, oz * BLOCK_SIZE);
      if (scene) scene.add(wMesh);
      else console.warn('[VoxelWorld] Skipped water mesh add: scene is null', wMesh);
      chunk.waterMesh = wMesh;
    }

    chunk.dirty = false;
  }

  /* ── World Init & Update ─────────────────────────────────────────── */
  let _scene = null;
  const HALF = Math.floor(WORLD_CHUNKS / 2);

  function init(scene) {
    _scene = scene || null;
    chunks.clear();

    // Generate terrain chunks
    for (let cx = -HALF; cx < HALF; cx++) {
      for (let cz = -HALF; cz < HALF; cz++) {
        const chunk = createChunk(cx, cz);
        generateChunkTerrain(chunk);
      }
    }

    // Build all meshes
    rebuildAll();
    if (Math.random() < 0.2) triggerCityEvent('fire');
  }

  function regenerate() {
    // Remove all existing chunk meshes
    for (const chunk of chunks.values()) {
      if (chunk.mesh) {
        _scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
        chunk.mesh.material.dispose();
        chunk.mesh = null;
      }
      if (chunk.waterMesh) {
        _scene.remove(chunk.waterMesh);
        chunk.waterMesh.geometry.dispose();
        chunk.waterMesh.material.dispose();
        chunk.waterMesh = null;
      }
    }
    chunks.clear();
    _roadWaypoints.length = 0;

    // Regenerate with current theme
    for (let cx = -HALF; cx < HALF; cx++) {
      for (let cz = -HALF; cz < HALF; cz++) {
        const chunk = createChunk(cx, cz);
        generateChunkTerrain(chunk);
      }
    }
    rebuildAll();
  }

  function rebuildAll() {
    // PRELOAD: build every chunk synchronously up-front. The budgeted
    // updateDirtyChunks() path is for runtime block edits only — using it
    // here causes visible pop-in on spawn (only 4 chunks/frame appear).
    for (const chunk of chunks.values()) {
      chunk.dirty = true;
    }
    if (typeof chunks !== 'object' || !chunks.values) return;
    for (const chunk of chunks.values()) {
      if (chunk.dirty) buildChunkMesh(chunk, _scene);
    }
  }

  let _rebuildBudget = 4; // max chunks to rebuild per frame (runtime edits only)
  function updateDirtyChunks() {
    let count = 0;
    if (typeof chunks !== 'object' || !chunks.values) {
      console.warn('[VoxelWorld] updateDirtyChunks called with invalid context:', this);
      return {};
    }
    for (const chunk of chunks.values()) {
      if (chunk.dirty) {
        buildChunkMesh(chunk, _scene);
        count++;
        if (count >= _rebuildBudget) break;
      }
    }
    // Update city events/disasters
    if (typeof updateCityEvents === 'function') updateCityEvents(1/60); // assume 60fps step
    // No return value needed; function is for side effects only
  }

  /* ── Raycast Helpers for Block Interaction ────────────────────────── */
  function raycastBlock(camera, maxDist) {
    maxDist = maxDist || 8;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const pos = camera.position.clone();

    const step = 0.1;
    for (let d = 0; d < maxDist; d += step) {
      const px = Math.floor(pos.x + dir.x * d);
      const py = Math.floor(pos.y + dir.y * d);
      const pz = Math.floor(pos.z + dir.z * d);
      const block = getBlock(px, py, pz);
      if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
        // Previous position for placement
        const prevD = d - step;
        const prevX = Math.floor(pos.x + dir.x * prevD);
        const prevY = Math.floor(pos.y + dir.y * prevD);
        const prevZ = Math.floor(pos.z + dir.z * prevD);
        return {
          hit: { x: px, y: py, z: pz, block },
          place: { x: prevX, y: prevY, z: prevZ }
        };
      }
    }
    return null;
  }


  // (Removed duplicate/broken getTerrainHeight definition)

  /* ── Scatter resources on terrain ────────────────────────────────── */
  function scatterResources(type, density) {
    const total = Math.floor(WORLD_CHUNKS * CHUNK_SIZE * WORLD_CHUNKS * CHUNK_SIZE * density);
    const minX = -HALF * CHUNK_SIZE, maxX = HALF * CHUNK_SIZE;
    const minZ = -HALF * CHUNK_SIZE, maxZ = HALF * CHUNK_SIZE;
    let placed = 0;
    for (let i = 0; i < total * 3 && placed < total; i++) {
      const wx = Math.floor(minX + Math.random() * (maxX - minX));
      const wz = Math.floor(minZ + Math.random() * (maxZ - minZ));
      const h = getTerrainHeight(wx, wz);
      if (h > 1 && h < CHUNK_HEIGHT - 2) {
        setBlock(wx, h, wz, type);
        if (type === BLOCK.WOOD) {
          // Place a small tree (trunk + canopy)
          for (let ty = 1; ty <= 4; ty++) setBlock(wx, h + ty, wz, BLOCK.WOOD);
          for (let dx = -1; dx <= 1; dx++)
            for (let dz = -1; dz <= 1; dz++)
              for (let dy = 3; dy <= 5; dy++)
                if (!(dx === 0 && dz === 0 && dy <= 4))
                  setBlock(wx + dx, h + dy, wz + dz, BLOCK.GRASS);
          placed++;
        } else {
          placed++;
        }
      }
    }
  }

  /* ── Level Definitions ────────────────────────────────────────────── */
  const LEVELS = [
    { id: 'HOSTOMEL',  name: 'Hostomel Airport',    desc: 'Stop the airborne assault',  theme: 'grassland', wavesPerLevel: 7, difficulty: 1.0, fogColor: 0xD4A017, spawnCandidates: [{ x: 0, z: -22 }, { x: -10, z: -22 }, { x: 10, z: -22 }, { x: -6, z: -26 }, { x: 6, z: -26 }, { x: 0, z: -16 }], spawnLookTarget: { x: 0, z: 18 } },
    { id: 'AVDIIVKA',  name: 'Avdiivka Industrial Zone', desc: 'Hold the coking plant',  theme: 'urban',     wavesPerLevel: 7, difficulty: 1.3, fogColor: 0x3a3028, spawnCandidates: [{ x: -10, z: 25 }, { x: 10, z: 25 }, { x: 0, z: 30 }, { x: -35, z: -5 }, { x: 35, z: -5 }, { x: -22, z: 15 }, { x: 22, z: 15 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'BAKHMUT',   name: 'Bakhmut Ruins',        desc: 'Defend the city',             theme: 'urban',     wavesPerLevel: 7, difficulty: 1.6, fogColor: 0x2a2a2a, spawnCandidates: [{ x: -18, z: -5 }, { x: 18, z: -5 }, { x: 0, z: -18 }, { x: -12, z: 10 }, { x: 12, z: 10 }, { x: -35, z: 0 }, { x: 35, z: 0 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'KHERSON',   name: 'Kherson Bridgehead',   desc: 'Cross the Dnipro',            theme: 'grassland', wavesPerLevel: 7, difficulty: 1.9, fogColor: 0xD4A017, spawnCandidates: [{ x: -20, z: -35 }, { x: 20, z: -35 }, { x: 0, z: -40 }, { x: -30, z: -20 }, { x: 30, z: -20 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'MARIUPOL',  name: 'Mariupol Steelworks',  desc: 'Fight through Azovstal',      theme: 'industrial', wavesPerLevel: 7, difficulty: 2.2, fogColor: 0x1a1a20, spawnCandidates: [{ x: -12, z: -28 }, { x: 12, z: -28 }, { x: 0, z: -35 }, { x: -30, z: 8 }, { x: 30, z: 8 }, { x: -30, z: -20 }, { x: 30, z: -20 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'CRIMEA',    name: 'Crimea Bridge',        desc: 'Cut the supply line',         theme: 'coastal',   wavesPerLevel: 7, difficulty: 2.5, fogColor: 0x5577aa, spawnCandidates: [{ x: -20, z: -30 }, { x: 20, z: -30 }, { x: -35, z: -15 }, { x: 35, z: -15 }, { x: 0, z: -42 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'CHORNOBYL', name: 'Chornobyl Zone',       desc: 'Irradiated exclusion zone',   theme: 'wasteland', wavesPerLevel: 7, difficulty: 2.8, fogColor: 0x3a3520, spawnCandidates: [{ x: -18, z: -25 }, { x: 18, z: -25 }, { x: 0, z: -32 }, { x: -28, z: -12 }, { x: 28, z: -12 }, { x: -15, z: -40 }, { x: 15, z: -40 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'MOSCOW',    name: 'Moscow Finale',        desc: 'End it at the Kremlin',       theme: 'cityscape', wavesPerLevel: 9, difficulty: 3.5, fogColor: 0x222228, spawnCandidates: [{ x: 0, z: -35 }, { x: -30, z: 0 }, { x: 30, z: 0 }, { x: 0, z: 35 }, { x: -25, z: -25 }, { x: 25, z: -25 }, { x: -25, z: 25 }, { x: 25, z: 25 }, { x: -45, z: 0 }, { x: 45, z: 0 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'SEVASTOPOL', name: 'Sevastopol Naval Base', desc: 'Destroy the Black Sea Fleet', theme: 'coastal',  wavesPerLevel: 7, difficulty: 3.8, fogColor: 0x3355aa, spawnCandidates: [{ x: -15, z: 8 }, { x: 15, z: 5 }, { x: 0, z: -18 }, { x: -18, z: -10 }, { x: 18, z: -10 }, { x: -35, z: 8 }, { x: 35, z: 5 }], spawnLookTarget: { x: 0, z: 20 } },
    { id: 'DONBAS',    name: 'Donbas Final Push',     desc: 'Liberate the last stronghold', theme: 'urban',   wavesPerLevel: 8, difficulty: 4.2, fogColor: 0x2a2020, spawnCandidates: [{ x: -20, z: -12 }, { x: 20, z: -12 }, { x: 0, z: -20 }, { x: -35, z: 0 }, { x: 35, z: 0 }, { x: -15, z: 15 }, { x: 15, z: 15 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'BELGOROD',  name: 'Belgorod Offensive',    desc: 'Cross into enemy territory',   theme: 'grassland', wavesPerLevel: 8, difficulty: 4.6, fogColor: 0xD4A017, spawnCandidates: [{ x: -15, z: -12 }, { x: 15, z: -12 }, { x: 0, z: -20 }, { x: -30, z: -5 }, { x: 30, z: -5 }, { x: -12, z: 15 }, { x: 12, z: 15 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'KREMLIN',   name: 'Kremlin Showdown',      desc: 'The final battle for peace',   theme: 'cityscape', wavesPerLevel: 10, difficulty: 5.0, fogColor: 0x111118, spawnCandidates: [{ x: -18, z: 52 }, { x: 18, z: 52 }, { x: -32, z: 22 }, { x: 32, z: 22 }, { x: 0, z: 55 }, { x: -32, z: -10 }, { x: 32, z: -10 }, { x: 0, z: -25 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'KYIV',      name: 'Siege of Kyiv',         desc: 'Ambush the Russian armored convoy', theme: 'urban', wavesPerLevel: 8, difficulty: 1.5, fogColor: 0x6a7080, tankFocus: true, spawnCandidates: [{ x: 0, z: -24 }, { x: -8, z: -24 }, { x: 8, z: -24 }, { x: -4, z: -28 }, { x: 4, z: -28 }], spawnLookTarget: { x: 0, z: 22 } },
    { id: 'SNAKE',     name: 'Snake Island Defense',  desc: '"Russian warship, go fuck yourself."', theme: 'coastal', wavesPerLevel: 6, difficulty: 1.4, fogColor: 0x4a6680, spawnCandidates: [{ x: -16, z: 0 }, { x: 16, z: 0 }, { x: 0, z: 16 }, { x: 0, z: -20 }, { x: -12, z: 12 }, { x: 12, z: -12 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'SAKY',      name: 'Saky Airbase Strike',   desc: 'Crimea airbase — ground every Su-24', theme: 'coastal', wavesPerLevel: 7, difficulty: 1.7, fogColor: 0x886644, spawnCandidates: [{ x: -30, z: -20 }, { x: -20, z: -30 }, { x: 0, z: -35 }, { x: 30, z: -20 }, { x: -35, z: 10 }, { x: 35, z: 10 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'VUHLEDAR',  name: 'Vuhledar Tank Graveyard', desc: 'Bury the 155th in the minefield', theme: 'wasteland', wavesPerLevel: 8, difficulty: 1.9, fogColor: 0x4a4030, tankFocus: true, spawnCandidates: [{ x: -15, z: 12 }, { x: 15, z: 12 }, { x: 0, z: 20 }, { x: -25, z: 5 }, { x: 25, z: 5 }, { x: 0, z: -20 }], spawnLookTarget: { x: 0, z: 0 } },
    { id: 'ANTONOV',   name: 'Antonov Bridge Strike', desc: 'HIMARS the supply line into Kherson', theme: 'urban', wavesPerLevel: 7, difficulty: 2.0, fogColor: 0x556677, spawnCandidates: [{ x: -5, z: 25 }, { x: 5, z: 25 }, { x: -15, z: 20 }, { x: 15, z: 20 }, { x: 0, z: 30 }, { x: -25, z: 15 }, { x: 25, z: 15 }], spawnLookTarget: { x: 0, z: -20 } },
    { id: 'REFINERY',  name: 'Refinery Strike (FPV)', desc: 'Fly an FPV drone into the oil refinery', theme: 'industrial', wavesPerLevel: 1, difficulty: 1.6, fogColor: 0x2a2620, droneOnly: true, spawnCandidates: [{ x: 0, z: 50 }], spawnLookTarget: { x: 0, z: 0 } },
  ];

  const PROC_CITIES = ['Mariupol','Severodonetsk','Lysychansk','Bucha','Irpin','Izium','Kupyansk','Robotyne','Vuhledar','Kharkiv','Odessa','Zaporizhzhia','Mykolaiv'];

  function getLevelDef(index) {
    if (index >= 0 && index < LEVELS.length) return LEVELS[index];
    const cityIdx = (index - LEVELS.length) % PROC_CITIES.length;
    const themeNames = Object.keys(THEMES);
    const theme = themeNames[Math.floor(seededRandom(index * 7, index * 13) * themeNames.length)];
    return {
      id: 'PROC_' + index,
      name: PROC_CITIES[cityIdx],
      desc: 'Liberate ' + PROC_CITIES[cityIdx],
      theme: theme,
      wavesPerLevel: 7,
      difficulty: 1.0 + index * 0.35,
      fogColor: THEMES[theme].fogColor,
    };
  }

  /* ── Terrain Feature Generators ─────────────────────────────────── */
  const worldMin = -HALF * CHUNK_SIZE;
  const worldMax =  HALF * CHUNK_SIZE;

  function randInWorld() {
    return Math.floor(worldMin + Math.random() * (worldMax - worldMin));
  }

  function generateTrenches() {
    const segments = 5 + Math.floor(Math.random() * 4);
    let cx = randInWorld() * 0.5;
    let cz = randInWorld() * 0.5;
    const trenchWidth = 1 + Math.floor(Math.random() * 2);
    const trenchDepth = 2 + Math.floor(Math.random() * 2);

    for (let seg = 0; seg < segments; seg++) {
      const len = 8 + Math.floor(Math.random() * 12);
      const horizontal = seg % 2 === 0;

      for (let i = 0; i < len; i++) {
        const wx = horizontal ? cx + i : cx;
        const wz = horizontal ? cz : cz + i;

        for (let tw = 0; tw < trenchWidth; tw++) {
          const bx = horizontal ? wx : wx + tw;
          const bz = horizontal ? wz + tw : wz;
          const surfH = getTerrainHeight(bx, bz);

          // Dig the trench
          for (let d = 0; d < trenchDepth; d++) {
            setBlock(bx, surfH - 1 - d, bz, BLOCK.AIR);
          }

          // Reinforced walls on sides
          if (tw === 0 || tw === trenchWidth - 1) {
            for (let d = 0; d < trenchDepth; d++) {
              const wallOff = tw === 0 ? -1 : 1;
              const wallX = horizontal ? bx : bx + wallOff;
              const wallZ = horizontal ? bz + wallOff : bz;
              if (getBlock(wallX, surfH - 1 - d, wallZ) !== BLOCK.AIR) {
                setBlock(wallX, surfH - 1 - d, wallZ, BLOCK.SANDBAG);
              }
            }
          }
        }
      }
      // Zigzag: advance perpendicular
      if (horizontal) { cz += (Math.random() > 0.5 ? 1 : -1) * (3 + Math.floor(Math.random() * 4)); cx += len; }
      else            { cx += (Math.random() > 0.5 ? 1 : -1) * (3 + Math.floor(Math.random() * 4)); cz += len; }
    }
  }

  function generateCraters(count) {
    for (let c = 0; c < count; c++) {
      const cx = randInWorld();
      const cz = randInWorld();
      const radius = 2 + Math.floor(Math.random() * 4);
      const depth = 1 + Math.floor(Math.random() * 3);
      const surfH = getTerrainHeight(cx, cz);

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= radius) {
            const localDepth = Math.floor(depth * (1 - dist / radius));
            for (let d = 0; d <= localDepth; d++) {
              setBlock(cx + dx, surfH - d, cz + dz, BLOCK.AIR);
            }
            // Rim: pile rubble at edge
            if (dist > radius - 1.5 && dist <= radius) {
              setBlock(cx + dx, surfH + 1, cz + dz, BLOCK.RUBBLE);
            }
          }
        }
      }
    }
  }

  function generateRuins(count) {
    for (let r = 0; r < count; r++) {
      const ox = randInWorld();
      const oz = randInWorld();
      const w = 4 + Math.floor(Math.random() * 6);
      const d = 4 + Math.floor(Math.random() * 6);
      const h = 3 + Math.floor(Math.random() * 5);
      const surfH = getTerrainHeight(ox, oz);
      const wallBlock = Math.random() > 0.5 ? BLOCK.BRICK : BLOCK.CONCRETE;

      // Four walls with random gaps
      for (let y = 0; y < h; y++) {
        for (let i = 0; i < w; i++) {
          if (Math.random() > 0.25) setBlock(ox + i, surfH + y, oz, wallBlock);
          if (Math.random() > 0.25) setBlock(ox + i, surfH + y, oz + d - 1, wallBlock);
        }
        for (let j = 0; j < d; j++) {
          if (Math.random() > 0.25) setBlock(ox, surfH + y, oz + j, wallBlock);
          if (Math.random() > 0.25) setBlock(ox + w - 1, surfH + y, oz + j, wallBlock);
        }
      }

      // Rubble inside
      const rubbleCount = Math.floor(w * d * 0.2);
      for (let rb = 0; rb < rubbleCount; rb++) {
        const rx = ox + 1 + Math.floor(Math.random() * (w - 2));
        const rz = oz + 1 + Math.floor(Math.random() * (d - 2));
        setBlock(rx, surfH, rz, BLOCK.RUBBLE);
      }
    }
  }

  function generateDugouts(count) {
    for (let dg = 0; dg < count; dg++) {
      const ox = randInWorld();
      const oz = randInWorld();
      const rw = 3 + Math.floor(Math.random() * 3);
      const rd = 3 + Math.floor(Math.random() * 3);
      const surfH = getTerrainHeight(ox, oz);
      const roomY = Math.max(1, surfH - 3);

      // Hollow out room underground
      for (let dx = 0; dx < rw; dx++) {
        for (let dz = 0; dz < rd; dz++) {
          for (let dy = 0; dy < 3; dy++) {
            setBlock(ox + dx, roomY + dy, oz + dz, BLOCK.AIR);
          }
        }
      }

      // Reinforce ceiling
      for (let dx = 0; dx < rw; dx++) {
        for (let dz = 0; dz < rd; dz++) {
          setBlock(ox + dx, roomY + 3, oz + dz, BLOCK.REINFORCED);
        }
      }

      // Entrance: stairs down from surface
      for (let s = 0; s < 3; s++) {
        setBlock(ox - 1, surfH - s, oz + Math.floor(rd / 2), BLOCK.AIR);
        setBlock(ox - 1, surfH - s + 1, oz + Math.floor(rd / 2), BLOCK.AIR);
      }
    }
  }

  function generateBrokenTrees(count) {
    for (let t = 0; t < count; t++) {
      const tx = randInWorld();
      const tz = randInWorld();
      const surfH = getTerrainHeight(tx, tz);
      if (surfH <= 1) continue;
      const trunkH = 2 + Math.floor(Math.random() * 3);
      for (let y = 0; y < trunkH; y++) {
        setBlock(tx, surfH + y, tz, BLOCK.WOOD);
      }
    }
  }

  function generateRunway(ox, oz, length, width) {
    for (let x = ox; x < ox + length; x++) {
      for (let z = oz; z < oz + width; z++) {
        const h = getTerrainHeight(x, z);
        setBlock(x, h, z, BLOCK.CONCRETE);
      }
    }
  }

  function levelArea(minX, maxX, minZ, maxZ, surfaceY, topBlock, fillBlock) {
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let y = 0; y < surfaceY; y++) {
          setBlock(x, y, z, fillBlock);
        }
        setBlock(x, surfaceY, z, topBlock);
        for (let y = surfaceY + 1; y <= surfaceY + 18; y++) {
          setBlock(x, y, z, BLOCK.AIR);
        }
      }
    }
  }

  function generateBuilding(ox, oz, w, d, h, blockType) {
    const surfH = getTerrainHeight(ox, oz);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          const isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          const isRoof = y === h - 1;
          if (isWall || isRoof) {
            setBlock(ox + x, surfH + y, oz + z, blockType);
          }
        }
      }
    }
    // Door
    setBlock(ox + Math.floor(w / 2), surfH, oz, BLOCK.AIR);
    setBlock(ox + Math.floor(w / 2), surfH + 1, oz, BLOCK.AIR);
  }

  function generateControlTower(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Base
    generateBuilding(ox, oz, 5, 5, 4, BLOCK.CONCRETE);
    // Tower column
    for (let y = 4; y < 10; y++) {
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          setBlock(ox + x, surfH + y, oz + z, BLOCK.METAL);
        }
      }
    }
    // Glass observation deck
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 5; z++) {
        const isEdge = x === 0 || x === 4 || z === 0 || z === 4;
        setBlock(ox + x, surfH + 10, oz + z, BLOCK.CONCRETE);
        if (isEdge) {
          setBlock(ox + x, surfH + 11, oz + z, BLOCK.GLASS);
          setBlock(ox + x, surfH + 12, oz + z, BLOCK.GLASS);
        }
        setBlock(ox + x, surfH + 13, oz + z, BLOCK.CONCRETE);
      }
    }
  }

  function generateRiver(startX, width) {
    for (let z = worldMin; z < worldMax; z++) {
      const waver = Math.floor(Math.sin(z * 0.08) * 3);
      for (let w = 0; w < width; w++) {
        const rx = startX + waver + w;
        const surfH = getTerrainHeight(rx, z);
        // Carve and fill with water
        for (let y = surfH; y >= Math.max(0, surfH - 2); y--) {
          setBlock(rx, y, z, BLOCK.WATER);
        }
      }
    }
  }

  function generateBridge(x, z, length, width) {
    for (let i = 0; i < length; i++) {
      const surfH = getTerrainHeight(x + i, z);
      const bridgeY = surfH + 2;
      for (let w = 0; w < width; w++) {
        setBlock(x + i, bridgeY, z + w, BLOCK.CONCRETE);
      }
      // Railings
      if (i % 2 === 0) {
        setBlock(x + i, bridgeY + 1, z, BLOCK.FENCE);
        setBlock(x + i, bridgeY + 1, z + width - 1, BLOCK.FENCE);
      }
    }
    // Support pillars
    for (let p = 0; p < length; p += 4) {
      const pH = getTerrainHeight(x + p, z);
      for (let y = pH; y <= pH + 2; y++) {
        setBlock(x + p, y, z + Math.floor(width / 2), BLOCK.CONCRETE);
      }
    }
  }

  function generateDefensivePosition(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Sandbag ring
    for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
      const r = 3;
      const bx = ox + Math.round(Math.cos(angle) * r);
      const bz = oz + Math.round(Math.sin(angle) * r);
      setBlock(bx, surfH, bz, BLOCK.SANDBAG);
      setBlock(bx, surfH + 1, bz, BLOCK.SANDBAG);
    }
  }

  // Replaces old grid with new variety grid
  // Usage: generateStreetGridVariety(ox, oz, gridW, gridD, blockSize);

  /* ── Road Generation System ─────────────────────────────────────── */
  // Stores road waypoints for vehicle AI to follow
  const _roadWaypoints = [];
  let _levelSpawnPoint = { x: 0, y: 0, z: 0 };

  function hasStableSpawnFooting(x, z, groundY) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const localY = getTerrainHeight(x + dx, z + dz);
        if (Math.abs(localY - groundY) > 1) return false;
      }
    }
    return true;
  }

  function isSpawnAreaClear(x, z, groundY, lookTarget) {
    const baseY = Math.floor(groundY) + 1;
    const ix = Math.round(x);
    const iz = Math.round(z);

    if (!hasStableSpawnFooting(ix, iz, groundY)) return false;

    // Require a wider clear bubble around the player body.
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (isSolid(ix + dx, baseY, iz + dz) || isSolid(ix + dx, baseY + 1, iz + dz)) {
          return false;
        }
      }
    }

    // Require generous headroom so spawn framing doesn't start under eaves/roofs.
    for (let dy = 2; dy <= 5; dy++) {
      if (isSolid(ix, baseY + dy, iz)) return false;
    }

    let dirX = 0;
    let dirZ = 1;
    if (lookTarget && isFinite(lookTarget.x) && isFinite(lookTarget.z)) {
      const dx = lookTarget.x - x;
      const dz = lookTarget.z - z;
      const len = Math.hypot(dx, dz);
      if (len > 0.001) {
        dirX = dx / len;
        dirZ = dz / len;
      }
    }

    // Keep the immediate view corridor open in the direction the stage intro camera will face.
    for (let step = 1; step <= 12; step++) {
      for (let lateral = -3; lateral <= 3; lateral++) {
        const sampleX = Math.round(x + dirX * step + dirZ * lateral);
        const sampleZ = Math.round(z + dirZ * step - dirX * lateral);
        if (isSolid(sampleX, baseY + 1, sampleZ)) return false;
        if (isSolid(sampleX, baseY + 2, sampleZ)) return false;
      }
    }

    return true;
  }

  function scoreSpawnCandidate(x, z, originX, originZ) {
    const centerH = getTerrainHeight(x, z);
    let variance = 0;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        variance += Math.abs(getTerrainHeight(x + dx, z + dz) - centerH);
      }
    }
    const distPenalty = Math.abs(x - originX) + Math.abs(z - originZ);
    return variance + distPenalty * 0.15;
  }

  function resolveLevelSpawnPoint(level) {
    const preferred = level && Array.isArray(level.spawnCandidates) ? level.spawnCandidates : [];
    const fallback = [
      { x: 0, z: 0 },
      { x: 0, z: 8 },
      { x: 8, z: 0 },
      { x: -8, z: 0 },
      { x: 0, z: -8 },
      { x: 16, z: 8 },
      { x: -16, z: 8 },
      { x: 12, z: -12 },
      { x: -12, z: -12 },
    ];
    const candidates = preferred.concat(fallback);
    const anchor = candidates[0] || { x: 0, z: 0 };
    let best = null;
    let bestScore = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const groundY = getTerrainHeight(candidate.x, candidate.z);
      if (!isSpawnAreaClear(candidate.x, candidate.z, groundY, level && level.spawnLookTarget)) continue;

      const score = scoreSpawnCandidate(candidate.x, candidate.z, anchor.x, anchor.z);
      if (score < bestScore) {
        bestScore = score;
        best = { x: candidate.x, y: groundY, z: candidate.z };
      }
    }

    if (best) return best;

    const fallbackGround = getTerrainHeight(0, 0);
    return { x: 0, y: fallbackGround, z: 0 };
  }

  function getSpawnPoint() {
    return { x: _levelSpawnPoint.x, y: _levelSpawnPoint.y, z: _levelSpawnPoint.z };
  }

  /**
   * Generate an asphalt road between two points using Bresenham-style line with width.
   * Also registers waypoints for vehicle AI road-following.
   * @param {number} x1 - Start X
   * @param {number} z1 - Start Z
   * @param {number} x2 - End X
   * @param {number} z2 - End Z
   * @param {number} [width=3] - Road width in blocks
   */
  function generateRoad(x1, z1, x2, z2, width) {
    const w = width || 3;
    const hw = Math.floor(w / 2);
    const dx = x2 - x1;
    const dz = z2 - z1;
    const steps = Math.max(Math.abs(dx), Math.abs(dz));
    if (steps === 0) return;
      if (steps === 0) return undefined;
    const xInc = dx / steps;
    const zInc = dz / steps;

    for (let s = 0; s <= steps; s++) {
      const cx = Math.round(x1 + xInc * s);
      const cz = Math.round(z1 + zInc * s);
      for (let wx = -hw; wx <= hw; wx++) {
        for (let wz = -hw; wz <= hw; wz++) {
          // Only place blocks along the perpendicular width (not diagonal fill)
          if (Math.abs(dx) >= Math.abs(dz)) {
            // Primarily horizontal road — expand in Z
            const bx = cx + 0;
            const bz = cz + wx;
            const h = getTerrainHeight(bx, bz);
            setBlock(bx, h, bz, BLOCK.ASPHALT);
            // Place props along the road
            if (wx === -hw && s % 12 === 0 && Math.random() > 0.7) placeBench(bx - 1, h + 1, bz);
            if (wx === hw && s % 16 === 0 && Math.random() > 0.8) {
              if (Math.random() > 0.5) placeCar(bx + 1, h + 1, bz);
              else if (Math.random() > 0.5) placeTruck(bx + 1, h + 1, bz);
              else placeBus(bx + 1, h + 1, bz);
            }
            if (wx === 0 && s % 10 === 0 && Math.random() > 0.6) {
              placeBush(bx, h + 1, bz + 1);
              if (Math.random() > 0.7) placeMailbox(bx, h + 1, bz);
              if (Math.random() > 0.8) placeStreetSign(bx, h + 1, bz + 2);
              if (Math.random() > 0.85) placeBusStop(bx, h + 1, bz - 1);
            }
          } else {
            // Primarily vertical road — expand in X
            const bx = cx + wx;
            const bz = cz + 0;
            const h = getTerrainHeight(bx, bz);
            setBlock(bx, h, bz, BLOCK.ASPHALT);
            // Place props along the road
            if (wz === -hw && s % 12 === 0 && Math.random() > 0.7) placeBench(bx, h + 1, bz - 1);
            if (wz === hw && s % 16 === 0 && Math.random() > 0.8) {
              if (Math.random() > 0.5) placeCar(bx, h + 1, bz + 1);
              else if (Math.random() > 0.5) placeTruck(bx, h + 1, bz + 1);
              else placeBus(bx, h + 1, bz + 1);
            }
            if (wz === 0 && s % 10 === 0 && Math.random() > 0.6) {
              placeBush(bx + 1, h + 1, bz);
              if (Math.random() > 0.7) placeMailbox(bx + 2, h + 1, bz);
              if (Math.random() > 0.8) placeStreetSign(bx, h + 1, bz + 2);
              if (Math.random() > 0.85) placeBusStop(bx - 1, h + 1, bz);
            }
          }
        }
      }
      // Register waypoints every 8 blocks for vehicle road-following
      if (s % 8 === 0) {
        const h = getTerrainHeight(cx, cz);
        _roadWaypoints.push(new THREE.Vector3(cx, h + 0.5, cz));
        // Place streetlights at major waypoints
        if (Math.random() > 0.5) placeStreetlight(cx, h + 1, cz);
      }
    }
  }

  /**
   * Generate a road network for a level. Accepts an array of road segments.
   * Each segment is [x1, z1, x2, z2, width].
   */
  function generateRoadNetwork(segments) {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      generateRoad(seg[0], seg[1], seg[2], seg[3], seg[4] || 3);
    }
  }

  function generateMarsh(count) {
    for (let m = 0; m < count; m++) {
      const mx = randInWorld();
      const mz = randInWorld();
      const radius = 3 + Math.floor(Math.random() * 5);
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx * dx + dz * dz <= radius * radius) {
            const h = getTerrainHeight(mx + dx, mz + dz);
            setBlock(mx + dx, h, mz + dz, BLOCK.WATER);
          }
        }
      }
    }
  }

  /* ── NEW Terrain Feature Generators (25 Level Improvement Ideas) ── */

  // IDEA 1: Soviet apartment blocks (5-9 story panel buildings)
  function generateApartmentBlock(ox, oz, floors) {
    const surfH = getTerrainHeight(ox, oz);
    const w = 10 + Math.floor(Math.random() * 6);
    const d = 6;
    const floorH = 3;
    floors = floors || (5 + Math.floor(Math.random() * 5));
    // Cap floors so building doesn't exceed chunk height
    const maxFloors = Math.floor((CHUNK_HEIGHT - surfH - 2) / floorH);
    floors = Math.min(floors, maxFloors);
    if (floors < 2) return; // Not enough room for a building
      if (floors < 2) return undefined; // Not enough room for a building
    const totalH = floors * floorH;

    for (let y = 0; y < totalH; y++) {
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          const isWall = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          const isFloor = y % floorH === 0;
          if (isWall || isFloor) {
            // Random damage on upper floors
            if (y > floorH * 2 && Math.random() < 0.15) continue;
            setBlock(ox + x, surfH + y, oz + z, BLOCK.CONCRETE);
          }
        }
      }
      // Windows every 2 blocks on walls (air gaps)
      if (y % floorH === 1 || y % floorH === 2) {
        for (let x = 2; x < w - 2; x += 3) {
          setBlock(ox + x, surfH + y, oz, BLOCK.AIR);
          setBlock(ox + x, surfH + y, oz + d - 1, BLOCK.AIR);
        }
      }
    }
    // Roof
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        setBlock(ox + x, surfH + totalH, oz + z, BLOCK.CONCRETE);
      }
    }
    // Stairwell (internal column)
    for (let y = 0; y < totalH; y++) {
      setBlock(ox + Math.floor(w / 2), surfH + y, oz + 2, BLOCK.CONCRETE);
      setBlock(ox + Math.floor(w / 2), surfH + y, oz + 3, BLOCK.CONCRETE);
    }
    // Entrance
    setBlock(ox + Math.floor(w / 2), surfH, oz, BLOCK.AIR);
    setBlock(ox + Math.floor(w / 2), surfH + 1, oz, BLOCK.AIR);
    setBlock(ox + Math.floor(w / 2), surfH + 2, oz, BLOCK.AIR);
  }

  /* ── Ukrainian Apartment Building (6 or 12 stories, full interior) ── */
  function generateUkrainianApartment(ox, oz, stories) {
    const surfH = getTerrainHeight(ox, oz);
    const W = 18;   // width (x axis)
    const D = 10;   // depth (z axis)
    const FH = 3;   // floor height (slab-to-slab)
    stories = stories || 6;

    // Cap floors to chunk height
    const maxFloors = Math.floor((CHUNK_HEIGHT - surfH - 2) / FH);
    stories = Math.min(stories, maxFloors);
    if (stories < 3) return;

    // Register this building so missions (CLEAR_BUILDING) can target it.
    _buildings.push({
      kind: 'apartment',
      x: ox, z: oz, w: W, d: D,
      baseY: surfH, floorH: FH, floors: stories,
      // Hallway center for enemy placement
      cx: ox + Math.floor(W / 2),
      cz: oz + Math.floor(D / 2),
    });

    // Hallway runs at z-center: z offsets 4 and 5 (2-block wide corridor)
    const hallZ1 = 4;
    const hallZ2 = 5;
    // Stairwell zone at x=1..3
    const stairX1 = 1;
    const stairX2 = 3;
    // Apartment dividing walls (x positions)
    const dividers = [6, 11, 15];
    // Door positions into apartments (centered in each bay)
    const doorXPositions = [4, 8, 13, 16];

    for (let floor = 0; floor < stories; floor++) {
      const baseY = surfH + floor * FH;

      // ─── Floor slab ───
      for (let x = 0; x < W; x++) {
        for (let z = 0; z < D; z++) {
          setBlock(ox + x, baseY, oz + z, BLOCK.CONCRETE);
        }
      }

      // ─── Clear interior air (between slabs) ───
      for (let dy = 1; dy < FH; dy++) {
        for (let x = 1; x < W - 1; x++) {
          for (let z = 1; z < D - 1; z++) {
            setBlock(ox + x, baseY + dy, oz + z, BLOCK.AIR);
          }
        }
      }

      // ─── Exterior walls ───
      for (let dy = 1; dy < FH; dy++) {
        for (let x = 0; x < W; x++) {
          setBlock(ox + x, baseY + dy, oz, BLOCK.CONCRETE);           // front
          setBlock(ox + x, baseY + dy, oz + D - 1, BLOCK.CONCRETE);   // back
        }
        for (let z = 0; z < D; z++) {
          setBlock(ox, baseY + dy, oz + z, BLOCK.CONCRETE);           // left
          setBlock(ox + W - 1, baseY + dy, oz + z, BLOCK.CONCRETE);   // right
        }
      }

      // ─── Hallway walls (blue bottom / white top) ───
      for (let x = 1; x < W - 1; x++) {
        // Skip stairwell area
        if (x >= stairX1 && x <= stairX2 + 1) continue;
        // South hallway wall (z = hallZ1 - 1 = 3)
        setBlock(ox + x, baseY + 1, oz + hallZ1 - 1, BLOCK.BLUE_TILE);
        if (FH > 2) setBlock(ox + x, baseY + 2, oz + hallZ1 - 1, BLOCK.WHITE_TILE);
        // North hallway wall (z = hallZ2 + 1 = 6)
        setBlock(ox + x, baseY + 1, oz + hallZ2 + 1, BLOCK.BLUE_TILE);
        if (FH > 2) setBlock(ox + x, baseY + 2, oz + hallZ2 + 1, BLOCK.WHITE_TILE);
      }

      // ─── Apartment dividing walls ───
      for (var di = 0; di < dividers.length; di++) {
        var dx = dividers[di];
        if (dx >= W - 1) continue;
        for (let dy = 1; dy < FH; dy++) {
          // South-side apartments (z = 1..hallZ1-2)
          for (let z = 1; z <= hallZ1 - 2; z++) {
            setBlock(ox + dx, baseY + dy, oz + z, BLOCK.PLASTER);
          }
          // North-side apartments (z = hallZ2+2..D-2)
          for (let z = hallZ2 + 2; z <= D - 2; z++) {
            setBlock(ox + dx, baseY + dy, oz + z, BLOCK.PLASTER);
          }
        }
      }

      // ─── Apartment doorways to hallway ───
      for (var ddi = 0; ddi < doorXPositions.length; ddi++) {
        var ddx = doorXPositions[ddi];
        if (ddx <= stairX2 + 1 || ddx >= W - 1) continue;
        // South apartment doors
        setBlock(ox + ddx, baseY + 1, oz + hallZ1 - 1, BLOCK.AIR);
        setBlock(ox + ddx, baseY + 2, oz + hallZ1 - 1, BLOCK.AIR);
        // North apartment doors
        setBlock(ox + ddx, baseY + 1, oz + hallZ2 + 1, BLOCK.AIR);
        setBlock(ox + ddx, baseY + 2, oz + hallZ2 + 1, BLOCK.AIR);
      }

      // ─── Windows (exterior) — alternate open/glass for war-zone look ───
      var _winIdx = 0;
      for (let x = 2; x < W - 2; x += 3) {
        var _isOpen = (_winIdx % 2 === 0);  // every other window blown out = open
        var _winBlock = _isOpen ? BLOCK.AIR : BLOCK.GLASS;
        // Front windows (south)
        setBlock(ox + x, baseY + 1, oz, _winBlock);
        if (FH > 2) setBlock(ox + x, baseY + 2, oz, _winBlock);
        // Back windows (north)
        setBlock(ox + x, baseY + 1, oz + D - 1, _winBlock);
        if (FH > 2) setBlock(ox + x, baseY + 2, oz + D - 1, _winBlock);
        _winIdx++;
      }
      // Side windows
      for (let z = 2; z < D - 2; z += 3) {
        setBlock(ox, baseY + 1, oz + z, BLOCK.GLASS);
        if (FH > 2) setBlock(ox, baseY + 2, oz + z, BLOCK.GLASS);
        setBlock(ox + W - 1, baseY + 1, oz + z, BLOCK.GLASS);
        if (FH > 2) setBlock(ox + W - 1, baseY + 2, oz + z, BLOCK.GLASS);
      }

      // ─── Sniper windows: remove glass on upper floors for shooting ───
      if (floor >= 3) {
        // Open a few windows on each upper floor (front and back only)
        var sniperX = 5 + (floor % 3) * 4;
        if (sniperX < W - 2) {
          setBlock(ox + sniperX, baseY + 1, oz, BLOCK.AIR);
          if (FH > 2) setBlock(ox + sniperX, baseY + 2, oz, BLOCK.AIR);
          setBlock(ox + sniperX, baseY + 1, oz + D - 1, BLOCK.AIR);
          if (FH > 2) setBlock(ox + sniperX, baseY + 2, oz + D - 1, BLOCK.AIR);
        }
      }

      // ─── Stairwell ───
      // Stairwell walls (blue tiles)
      for (let dy = 1; dy < FH; dy++) {
        // East stairwell wall separating from hallway
        for (let z = hallZ1 - 1; z <= hallZ2 + 1; z++) {
          setBlock(ox + stairX2 + 1, baseY + dy, oz + z, BLOCK.BLUE_TILE);
        }
        // Blue accent on side walls inside stairwell
        for (let x = stairX1; x <= stairX2; x++) {
          setBlock(ox + x, baseY + 1, oz + hallZ1 - 1, BLOCK.BLUE_TILE);
          setBlock(ox + x, baseY + 1, oz + hallZ2 + 1, BLOCK.BLUE_TILE);
        }
      }

      // Stairwell door from hallway
      setBlock(ox + stairX2 + 1, baseY + 1, oz + hallZ1, BLOCK.AIR);
      setBlock(ox + stairX2 + 1, baseY + 2, oz + hallZ1, BLOCK.AIR);

      // Ladder blocks (alternating sides each floor for realism)
      if (floor % 2 === 0) {
        setBlock(ox + stairX1, baseY + 1, oz + hallZ1, BLOCK.LADDER);
        setBlock(ox + stairX1, baseY + 2, oz + hallZ1, BLOCK.LADDER);
        // Hole in ceiling above ladder for floor access
        if (floor < stories - 1) {
          setBlock(ox + stairX1, baseY + FH, oz + hallZ1, BLOCK.AIR);
        }
      } else {
        setBlock(ox + stairX2, baseY + 1, oz + hallZ2, BLOCK.LADDER);
        setBlock(ox + stairX2, baseY + 2, oz + hallZ2, BLOCK.LADDER);
        if (floor < stories - 1) {
          setBlock(ox + stairX2, baseY + FH, oz + hallZ2, BLOCK.AIR);
        }
      }
      // Also open the opposite side's ceiling hole for descent
      if (floor > 0) {
        if (floor % 2 === 0) {
          setBlock(ox + stairX2, baseY, oz + hallZ2, BLOCK.AIR);
        } else {
          setBlock(ox + stairX1, baseY, oz + hallZ1, BLOCK.AIR);
        }
      }
    }

    // ─── Roof slab ───
    var roofY = surfH + stories * FH;
    for (let x = 0; x < W; x++) {
      for (let z = 0; z < D; z++) {
        setBlock(ox + x, roofY, oz + z, BLOCK.CONCRETE);
      }
    }
    // Roof access hatch
    setBlock(ox + stairX1 + 1, roofY, oz + hallZ1 + 1, BLOCK.AIR);

    // ─── Ground floor entrances ───
    // Front entrance (centered)
    var entranceX = Math.floor(W / 2);
    setBlock(ox + entranceX, surfH, oz, BLOCK.AIR);
    setBlock(ox + entranceX, surfH + 1, oz, BLOCK.AIR);
    setBlock(ox + entranceX, surfH + 2, oz, BLOCK.AIR);
    setBlock(ox + entranceX + 1, surfH, oz, BLOCK.AIR);
    setBlock(ox + entranceX + 1, surfH + 1, oz, BLOCK.AIR);
    setBlock(ox + entranceX + 1, surfH + 2, oz, BLOCK.AIR);
    // Back entrance
    setBlock(ox + entranceX, surfH, oz + D - 1, BLOCK.AIR);
    setBlock(ox + entranceX, surfH + 1, oz + D - 1, BLOCK.AIR);
    setBlock(ox + entranceX, surfH + 2, oz + D - 1, BLOCK.AIR);
    // Side entrance (stairwell)
    setBlock(ox, surfH, oz + hallZ1, BLOCK.AIR);
    setBlock(ox, surfH + 1, oz + hallZ1, BLOCK.AIR);
    setBlock(ox, surfH + 2, oz + hallZ1, BLOCK.AIR);
  }

  // IDEA 2: Industrial complex (coking plant for Avdiivka)
  function generateIndustrialComplex(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Main factory hall
    const hallW = 20, hallD = 12, hallH = 8;
    for (let y = 0; y < hallH; y++) {
      for (let x = 0; x < hallW; x++) {
        for (let z = 0; z < hallD; z++) {
          const isWall = x === 0 || x === hallW - 1 || z === 0 || z === hallD - 1;
          const isRoof = y === hallH - 1;
          if (isWall || isRoof) {
            if (Math.random() < 0.12) continue; // Battle damage
            setBlock(ox + x, surfH + y, oz + z, BLOCK.METAL);
          }
        }
      }
    }
    // Smokestacks (tall chimneys)
    for (let i = 0; i < 3; i++) {
      const sx = ox + 4 + i * 6;
      const sz = oz + hallD + 2;
      for (let y = 0; y < 14; y++) {
        setBlock(sx, surfH + y, sz, BLOCK.BRICK);
        setBlock(sx + 1, surfH + y, sz, BLOCK.BRICK);
        setBlock(sx, surfH + y, sz + 1, BLOCK.BRICK);
        setBlock(sx + 1, surfH + y, sz + 1, BLOCK.BRICK);
      }
    }
    // Storage silos
    for (let i = 0; i < 2; i++) {
      const cx = ox - 5 + i * (hallW + 8);
      const cz = oz + 3;
      for (let y = 0; y < 6; y++) {
        for (let a = 0; a < Math.PI * 2; a += 0.4) {
          const bx = Math.round(Math.cos(a) * 2.5);
          const bz = Math.round(Math.sin(a) * 2.5);
          setBlock(cx + bx, surfH + y, cz + bz, BLOCK.METAL);
        }
      }
      // Cap
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (dx * dx + dz * dz <= 6) {
            setBlock(cx + dx, surfH + 6, cz + dz, BLOCK.METAL);
          }
        }
      }
    }
    // Loading dock
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 4; z++) {
        setBlock(ox + hallW + 1 + x, surfH, oz + z, BLOCK.CONCRETE);
      }
      setBlock(ox + hallW + 1 + x, surfH + 1, oz, BLOCK.CONCRETE);
    }
    // Pipe network (connecting buildings)
    for (let x = 0; x < hallW + 10; x++) {
      setBlock(ox + x, surfH + hallH + 1, oz + Math.floor(hallD / 2), BLOCK.METAL);
    }
    // Rubble around (battle damage)
    for (let rb = 0; rb < 30; rb++) {
      const rx = ox + Math.floor(Math.random() * (hallW + 10)) - 3;
      const rz = oz + Math.floor(Math.random() * (hallD + 8)) - 3;
      const h = getTerrainHeight(rx, rz);
      if (h > 0) setBlock(rx, h, rz, BLOCK.RUBBLE);
    }
  }

  // Kremlin Presidential Palace — used in the KREMLIN final stage
  function generateKremlinPalace(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var pw = 30, pd = 22, ph = 9; // main palace footprint and height
    var hx = Math.round(-pw / 2), hz = Math.round(-pd / 2);
    // Main palace block (hollow, BRICK walls)
    for (var py = 0; py < ph; py++) {
      for (var px = 0; px < pw; px++) {
        for (var pz = 0; pz < pd; pz++) {
          var isWall = (px === 0 || px === pw - 1 || pz === 0 || pz === pd - 1);
          var isRoof = (py === ph - 1);
          var isFloor = (py === 0);
          if (isWall || isRoof || isFloor) {
            setBlock(ox + hx + px, h + py + 1, oz + hz + pz, BLOCK.BRICK);
          }
        }
      }
    }
    // Plaster interior walls visible through doorways
    for (var iy = 1; iy < ph - 1; iy++) {
      for (var iz = 2; iz < pd - 2; iz += 4) {
        setBlock(ox + hx + 1, h + iy + 1, oz + hz + iz, BLOCK.PLASTER);
        setBlock(ox + hx + pw - 2, h + iy + 1, oz + hz + iz, BLOCK.PLASTER);
      }
    }
    // Grand windows along facade (front and back)
    for (var wy = 2; wy < ph - 1; wy += 3) {
      for (var wz = 3; wz < pd - 3; wz += 5) {
        setBlock(ox + hx, h + wy + 1, oz + hz + wz, BLOCK.GLASS);
        setBlock(ox + hx, h + wy + 2, oz + hz + wz, BLOCK.GLASS);
        setBlock(ox + hx + pw - 1, h + wy + 1, oz + hz + wz, BLOCK.GLASS);
        setBlock(ox + hx + pw - 1, h + wy + 2, oz + hz + wz, BLOCK.GLASS);
      }
    }
    // Front entrance arch — clear a wide doorway
    var frontZ = oz + hz;
    for (var dh = 0; dh < 4; dh++) {
      for (var dw = -2; dw <= 2; dw++) {
        setBlock(ox + dw, h + dh + 1, frontZ, BLOCK.AIR);
      }
    }
    // Classical columns along front facade
    for (var col = -10; col <= 10; col += 5) {
      for (var cy = 0; cy < ph + 2; cy++) {
        setBlock(ox + col, h + cy + 1, oz + hz - 2, BLOCK.CONCRETE);
        setBlock(ox + col + 1, h + cy + 1, oz + hz - 2, BLOCK.CONCRETE);
      }
      // Column capital
      for (var ccx = -1; ccx <= 2; ccx++) {
        setBlock(ox + col + ccx, h + ph + 3, oz + hz - 2, BLOCK.CONCRETE);
        setBlock(ox + col + ccx, h + ph + 3, oz + hz - 3, BLOCK.CONCRETE);
      }
    }
    // Corner towers (3×3 footprint, taller than palace)
    var towerH = ph + 5;
    var corners = [[-pw/2, -pd/2], [pw/2 - 3, -pd/2], [-pw/2, pd/2 - 3], [pw/2 - 3, pd/2 - 3]];
    corners.forEach(function(c) {
      var tx = Math.round(ox + c[0]), tz = Math.round(oz + c[1]);
      for (var ty = 0; ty < towerH; ty++) {
        for (var tbx = 0; tbx <= 3; tbx++) {
          for (var tbz = 0; tbz <= 3; tbz++) {
            var isEdge = (tbx === 0 || tbx === 3 || tbz === 0 || tbz === 3);
            if (isEdge || ty === towerH - 1) {
              setBlock(tx + tbx, h + ty + 1, tz + tbz, BLOCK.BRICK);
            }
          }
        }
      }
      // Tower spire
      setBlock(tx + 1, h + towerH + 1, tz + 1, BLOCK.METAL);
      setBlock(tx + 1, h + towerH + 2, tz + 1, BLOCK.METAL);
    });
    // Central golden dome (the iconic Kremlin dome)
    var domeR = 5;
    for (var dy = 0; dy < 8; dy++) {
      var r = Math.round(domeR * Math.cos((dy / 8) * Math.PI * 0.5));
      for (var dx = -r; dx <= r; dx++) {
        for (var dz2 = -r; dz2 <= r; dz2++) {
          if (dx * dx + dz2 * dz2 <= r * r + 1) {
            var blockT = (dy < 2) ? BLOCK.CONCRETE : BLOCK.METAL;
            setBlock(ox + dx, h + ph + dy + 1, oz + dz2, blockT);
          }
        }
      }
    }
    // Dome spire / flag
    setBlock(ox, h + ph + 9, oz, BLOCK.METAL);
    setBlock(ox, h + ph + 10, oz, BLOCK.METAL);
    setBlock(ox, h + ph + 11, oz, BLOCK.FLAG);
    // Red star on front gable
    setBlock(ox, h + ph + 2, oz + hz - 1, BLOCK.FIRE);
    // Register building
    _buildings.push({ kind: 'kremlin_palace', x: ox + hx, z: oz + hz, w: pw, d: pd, baseY: h, floorH: 3, floors: 3, cx: ox, cz: oz });
  }

  // St. Basil's Cathedral — Moscow's iconic Red Square cathedral with its
  // cluster of colourful onion domes. One tall central tent-roof tower ringed
  // by eight chapels, each capped with a differently-coloured bulbous dome.
  function generateStBasils(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;

    // Filled horizontal disc of a single block type (for round dome layers)
    function _disc(cx, y, cz, r, blockType) {
      if (r <= 0) { setBlock(cx, y, cz, blockType); return; }
      for (var dx = -r; dx <= r; dx++) {
        for (var dz = -r; dz <= r; dz++) {
          if (dx * dx + dz * dz <= r * r + 1) setBlock(cx + dx, y, cz + dz, blockType);
        }
      }
    }

    // A bulbous onion dome on a drum, capped with a golden finial + cross
    function _onionDome(cx, baseY, cz, R, domeBlock) {
      // Cylindrical drum the dome sits on
      for (var dy = 0; dy < 2; dy++) _disc(cx, baseY + dy, cz, Math.max(1, Math.round(R * 0.55)), BLOCK.WHITE_TILE);
      // Bulb profile (radius multiplier per layer — swells then tapers to a point)
      var profile = [0.65, 0.85, 1.0, 1.0, 0.85, 0.6, 0.35, 0.15];
      for (var i = 0; i < profile.length; i++) {
        _disc(cx, baseY + 2 + i, cz, Math.max(0, Math.round(R * profile[i])), domeBlock);
      }
      // Golden finial + orthodox cross
      var topY = baseY + 2 + profile.length;
      setBlock(cx, topY, cz, BLOCK.BUS);          // gold ball
      setBlock(cx, topY + 1, cz, BLOCK.METAL);    // cross post
      setBlock(cx, topY + 2, cz, BLOCK.METAL);
      setBlock(cx - 1, topY + 1, cz, BLOCK.METAL); // cross arms
      setBlock(cx + 1, topY + 1, cz, BLOCK.METAL);
    }

    // A square brick chapel tower topped with a coloured onion dome
    function _chapel(cx, cz, towerH, R, domeBlock, half) {
      for (var ty = 0; ty < towerH; ty++) {
        for (var bx = -half; bx <= half; bx++) {
          for (var bz = -half; bz <= half; bz++) {
            var isWall = (Math.abs(bx) === half || Math.abs(bz) === half);
            if (isWall || ty === towerH - 1 || ty === 0) {
              setBlock(cx + bx, h + ty + 1, cz + bz, BLOCK.BRICK);
            }
          }
        }
      }
      // Tall windows on each face
      for (var wy = 2; wy < towerH - 1; wy += 3) {
        setBlock(cx, h + wy + 1, cz - half, BLOCK.GLASS);
        setBlock(cx, h + wy + 1, cz + half, BLOCK.GLASS);
        setBlock(cx - half, h + wy + 1, cz, BLOCK.GLASS);
        setBlock(cx + half, h + wy + 1, cz, BLOCK.GLASS);
      }
      _onionDome(cx, h + towerH + 1, cz, R, domeBlock);
    }

    // Raised stone plinth the whole cathedral sits on
    for (var px = -13; px <= 13; px++) {
      for (var pz = -13; pz <= 13; pz++) {
        if (px * px + pz * pz <= 13 * 13) setBlock(ox + px, h + 1, oz + pz, BLOCK.STONE);
      }
    }

    // Central tent-roof tower (tallest, gold dome)
    var cTowerH = 16;
    _chapel(ox, oz, cTowerH, 3, BLOCK.BUS, 3);
    // Tent-roof red ring just below the central drum for the signature silhouette
    _disc(ox, h + cTowerH + 1, oz, 4, BLOCK.BANNER);

    // Eight surrounding chapels — alternating bold dome colours like the real cathedral
    // Cardinal chapels (taller, larger domes)
    var cardinalColors = [BLOCK.STREET_SIGN, BLOCK.BLUE_TILE, BLOCK.BANNER, BLOCK.BUS]; // green, blue, red, gold
    var cardinals = [[0, -9], [9, 0], [0, 9], [-9, 0]];
    for (var ci = 0; ci < cardinals.length; ci++) {
      _chapel(ox + cardinals[ci][0], oz + cardinals[ci][1], 11, 2.6, cardinalColors[ci], 2);
    }
    // Diagonal chapels (shorter, smaller domes, contrasting colours)
    var diagColors = [BLOCK.BLUE_TILE, BLOCK.BANNER, BLOCK.BUS, BLOCK.STREET_SIGN];
    var diagonals = [[-7, -7], [7, -7], [7, 7], [-7, 7]];
    for (var di = 0; di < diagonals.length; di++) {
      _chapel(ox + diagonals[di][0], oz + diagonals[di][1], 8, 2.0, diagColors[di], 2);
    }

    // Grand entrance staircase / porch on the south face
    for (var sx = -2; sx <= 2; sx++) {
      setBlock(ox + sx, h + 1, oz - 14, BLOCK.STONE);
      setBlock(ox + sx, h + 2, oz - 13, BLOCK.STONE);
    }

    _buildings.push({ kind: 'st_basils', x: ox - 13, z: oz - 13, w: 26, d: 26, baseY: h, floorH: 3, floors: 4, cx: ox, cz: oz });
  }

  // Lenin's Mausoleum — the dark-red stepped granite pyramid on Red Square,
  // pressed against the Kremlin south wall. Three receding tiers with black
  // accent bands, mirroring the real structure's silhouette.
  function generateLeninMausoleum(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    // Stone plaza plinth the mausoleum sits on
    for (var px = -7; px <= 7; px++) {
      for (var pz = -5; pz <= 5; pz++) {
        setBlock(ox + px, h, oz + pz, BLOCK.STONE);
      }
    }
    // Tier 1 — widest base (14 × 10, 2 blocks tall), dark red
    for (var bx = -6; bx <= 6; bx++) {
      for (var bz = -4; bz <= 4; bz++) {
        setBlock(ox + bx, h + 1, oz + bz, BLOCK.BANNER);
        setBlock(ox + bx, h + 2, oz + bz, BLOCK.BANNER);
      }
    }
    // Black accent band between tier 1 and 2
    for (var bx = -6; bx <= 6; bx++) {
      for (var bz = -4; bz <= 4; bz++) {
        setBlock(ox + bx, h + 3, oz + bz, BLOCK.METAL);
      }
    }
    // Tier 2 — middle (10 × 6, 2 blocks tall), dark red
    for (var bx = -4; bx <= 4; bx++) {
      for (var bz = -3; bz <= 3; bz++) {
        setBlock(ox + bx, h + 4, oz + bz, BLOCK.BANNER);
        setBlock(ox + bx, h + 5, oz + bz, BLOCK.BANNER);
      }
    }
    // Black accent band between tier 2 and 3
    for (var bx = -4; bx <= 4; bx++) {
      for (var bz = -3; bz <= 3; bz++) {
        setBlock(ox + bx, h + 6, oz + bz, BLOCK.METAL);
      }
    }
    // Tier 3 — top (6 × 4, 2 blocks), red body + stone roof deck
    for (var bx = -3; bx <= 3; bx++) {
      for (var bz = -2; bz <= 2; bz++) {
        setBlock(ox + bx, h + 7, oz + bz, BLOCK.BANNER);
        setBlock(ox + bx, h + 8, oz + bz, BLOCK.STONE);
      }
    }
    // Entrance pillars on the north face (facing Red Square / palace)
    setBlock(ox - 3, h + 1, oz - 5, BLOCK.CONCRETE);
    setBlock(ox - 3, h + 2, oz - 5, BLOCK.CONCRETE);
    setBlock(ox + 3, h + 1, oz - 5, BLOCK.CONCRETE);
    setBlock(ox + 3, h + 2, oz - 5, BLOCK.CONCRETE);
    _buildings.push({ kind: 'mausoleum', x: ox - 6, z: oz - 4, w: 13, d: 9, baseY: h, floorH: 8, floors: 1, cx: ox, cz: oz });
  }

  /* ════════════════════════════════════════════════════════════════════
   *  LANDMARK BUILDINGS — recognizable real-world architecture per map.
   *  Modeled on actual buildings (GTA-style) so each city reads as itself.
   *  Shared voxel helpers kept local so each generator is self-contained.
   * ════════════════════════════════════════════════════════════════════ */

  // Filled horizontal disc of one block type (round dome / tower layers).
  function _lmDisc(cx, y, cz, r, blockType) {
    if (r <= 0) { setBlock(cx, y, cz, blockType); return; }
    for (var dx = -r; dx <= r; dx++) {
      for (var dz = -r; dz <= r; dz++) {
        if (dx * dx + dz * dz <= r * r + 1) setBlock(cx + dx, y, cz + dz, blockType);
      }
    }
  }

  // Hollow ring (round wall) of one block type.
  function _lmRing(cx, y, cz, r, blockType) {
    for (var a = 0; a < 360; a += 8) {
      var rad = a * Math.PI / 180;
      var rx = Math.round(cx + Math.cos(rad) * r);
      var rz = Math.round(cz + Math.sin(rad) * r);
      setBlock(rx, y, rz, blockType);
    }
  }

  // Bulbous golden onion dome on a drum, capped with finial + orthodox cross.
  function _lmOnionDome(cx, baseY, cz, R, domeBlock) {
    for (var dy = 0; dy < 2; dy++) _lmDisc(cx, baseY + dy, cz, Math.max(1, Math.round(R * 0.55)), BLOCK.WHITE_TILE);
    var profile = [0.65, 0.85, 1.0, 1.0, 0.85, 0.6, 0.35, 0.15];
    for (var i = 0; i < profile.length; i++) {
      _lmDisc(cx, baseY + 2 + i, cz, Math.max(0, Math.round(R * profile[i])), domeBlock);
    }
    var topY = baseY + 2 + profile.length;
    setBlock(cx, topY, cz, BLOCK.BUS);
    setBlock(cx, topY + 1, cz, BLOCK.METAL);
    setBlock(cx, topY + 2, cz, BLOCK.METAL);
    setBlock(cx - 1, topY + 1, cz, BLOCK.METAL);
    setBlock(cx + 1, topY + 1, cz, BLOCK.METAL);
  }

  // ── KYIV: Motherland Monument (Батьківщина-Мати) ───────────────────────
  // Colossal silver titanium statue holding sword + shield on a museum plinth.
  function generateMotherlandMonument(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    // Museum pedestal — broad concrete base block
    for (var px = -8; px <= 8; px++) {
      for (var pz = -8; pz <= 8; pz++) {
        for (var py = 0; py < 7; py++) {
          var isShell = (px === -8 || px === 8 || pz === -8 || pz === 8 || py === 0 || py === 6);
          if (isShell) setBlock(ox + px, h + py + 1, oz + pz, BLOCK.STONE);
        }
      }
    }
    // Entrance arch on the south face
    for (var dw = -2; dw <= 2; dw++) {
      for (var dh = 0; dh < 4; dh++) setBlock(ox + dw, h + dh + 1, oz - 8, BLOCK.AIR);
    }
    var sb = h + 8; // statue base height (on top of pedestal)
    // Legs / lower robe — tapering metal column
    for (var ly = 0; ly < 10; ly++) {
      var lr = 3 - Math.floor(ly / 5);
      for (var lx = -lr; lx <= lr; lx++) {
        for (var lz = -lr; lz <= lr; lz++) {
          setBlock(ox + lx, sb + ly, oz + lz, BLOCK.METAL);
        }
      }
    }
    var torsoY = sb + 10;
    // Torso (2×2 core, broad shoulders)
    for (var ty = 0; ty < 8; ty++) {
      for (var tx = -1; tx <= 1; tx++) {
        for (var tz = -1; tz <= 1; tz++) setBlock(ox + tx, torsoY + ty, oz + tz, BLOCK.METAL);
      }
    }
    // Shoulders
    for (var sx = -3; sx <= 3; sx++) setBlock(ox + sx, torsoY + 7, oz, BLOCK.METAL);
    // Head
    setBlock(ox, torsoY + 8, oz, BLOCK.METAL);
    setBlock(ox, torsoY + 9, oz, BLOCK.METAL);
    // Right arm raised high holding the sword (east side, reaching up)
    var armX = ox + 4;
    for (var ay = 0; ay < 6; ay++) setBlock(armX, torsoY + 7 + ay, oz, BLOCK.METAL);
    // Sword blade soaring above (the monument's silhouette)
    for (var bl = 0; bl < 16; bl++) setBlock(armX, torsoY + 13 + bl, oz, BLOCK.METAL);
    setBlock(armX - 1, torsoY + 14, oz, BLOCK.METAL); // crossguard
    setBlock(armX + 1, torsoY + 14, oz, BLOCK.METAL);
    // Left arm extended holding the shield (west side)
    var shX = ox - 4;
    for (var ay2 = 0; ay2 < 3; ay2++) setBlock(ox - 1 - ay2, torsoY + 6, oz, BLOCK.METAL);
    // Shield slab (flat vertical panel) with red emblem
    for (var shy = 0; shy < 7; shy++) {
      for (var shz = -2; shz <= 2; shz++) setBlock(shX, torsoY + 2 + shy, oz + shz, BLOCK.METAL);
    }
    setBlock(shX - 1, torsoY + 5, oz, BLOCK.BANNER); // emblem face
    _buildings.push({ kind: 'landmark_motherland', x: ox - 8, z: oz - 8, w: 17, d: 17, baseY: h, floorH: 6, floors: 1, cx: ox, cz: oz });
  }

  // ── KYIV: St. Sophia Cathedral ─────────────────────────────────────────
  // White-walled Byzantine cathedral crowned with golden onion domes, a green
  // accent roof, and a tall baroque bell tower beside it.
  function generateStSophia(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var bw = 18, bd = 12, bh = 8;
    var hx = -Math.floor(bw / 2), hz = -Math.floor(bd / 2);
    // White cathedral body (hollow shell)
    for (var py = 0; py < bh; py++) {
      for (var px = 0; px < bw; px++) {
        for (var pz = 0; pz < bd; pz++) {
          var isWall = (px === 0 || px === bw - 1 || pz === 0 || pz === bd - 1);
          if (isWall || py === 0 || py === bh - 1) setBlock(ox + hx + px, h + py + 1, oz + hz + pz, BLOCK.WHITE_TILE);
        }
      }
    }
    // Green cornice ring just under the roofline
    for (var cx2 = 0; cx2 < bw; cx2++) {
      setBlock(ox + hx + cx2, h + bh, oz + hz, BLOCK.STREET_SIGN);
      setBlock(ox + hx + cx2, h + bh, oz + hz + bd - 1, BLOCK.STREET_SIGN);
    }
    // Arched windows along facade
    for (var wy = 2; wy < bh - 1; wy += 3) {
      for (var wz = 2; wz < bd - 2; wz += 3) {
        setBlock(ox + hx, h + wy + 1, oz + hz + wz, BLOCK.GLASS);
        setBlock(ox + hx + bw - 1, h + wy + 1, oz + hz + wz, BLOCK.GLASS);
      }
    }
    // Central tall golden dome + four flanking smaller domes (13-dome cathedral)
    _lmOnionDome(ox, h + bh + 1, oz, 3, BLOCK.BUS);
    _lmOnionDome(ox - 6, h + bh, oz - 3, 2, BLOCK.BUS);
    _lmOnionDome(ox + 6, h + bh, oz - 3, 2, BLOCK.BUS);
    _lmOnionDome(ox - 6, h + bh, oz + 3, 2, BLOCK.BUS);
    _lmOnionDome(ox + 6, h + bh, oz + 3, 2, BLOCK.BUS);
    // Entrance doorway (south)
    for (var dw2 = -1; dw2 <= 1; dw2++) {
      for (var dh2 = 0; dh2 < 3; dh2++) setBlock(ox + dw2, h + dh2 + 1, oz + hz, BLOCK.DOOR);
    }
    // Baroque bell tower beside the cathedral (west)
    var btx = ox + hx - 6, btH = 16;
    for (var by = 0; by < btH; by++) {
      var taper = by > 11 ? 1 : 2;
      for (var bx2 = -taper; bx2 <= taper; bx2++) {
        for (var bz2 = -taper; bz2 <= taper; bz2++) {
          var edge = (Math.abs(bx2) === taper || Math.abs(bz2) === taper);
          if (edge || by === 0) setBlock(btx + bx2, h + by + 1, oz + bz2, BLOCK.WHITE_TILE);
        }
      }
    }
    _lmOnionDome(btx, h + btH + 1, oz, 2, BLOCK.BUS);
    _buildings.push({ kind: 'landmark_st_sophia', x: ox + hx, z: oz + hz, w: bw, d: bd, baseY: h, floorH: 3, floors: 2, cx: ox, cz: oz });
  }

  // ── KYIV: Kyiv Pechersk Lavra Great Bell Tower ─────────────────────────
  // Tall tiered baroque tower (the tallest free-standing bell tower), gold dome.
  function generateLavraBellTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var tiers = [
      { r: 5, hh: 6, block: BLOCK.WHITE_TILE },
      { r: 4, hh: 6, block: BLOCK.WHITE_TILE },
      { r: 3, hh: 6, block: BLOCK.PLASTER },
      { r: 2, hh: 5, block: BLOCK.WHITE_TILE },
    ];
    var y = h + 1;
    for (var ti = 0; ti < tiers.length; ti++) {
      var t = tiers[ti];
      for (var ly = 0; ly < t.hh; ly++) {
        for (var lx = -t.r; lx <= t.r; lx++) {
          for (var lz = -t.r; lz <= t.r; lz++) {
            var edge = (Math.abs(lx) === t.r || Math.abs(lz) === t.r);
            if (edge || ly === 0) setBlock(ox + lx, y + ly, oz + lz, t.block);
          }
        }
      }
      // Arched bell openings on each face of every tier
      var midY = y + Math.floor(t.hh / 2);
      setBlock(ox, midY, oz - t.r, BLOCK.AIR);
      setBlock(ox, midY, oz + t.r, BLOCK.AIR);
      setBlock(ox - t.r, midY, oz, BLOCK.AIR);
      setBlock(ox + t.r, midY, oz, BLOCK.AIR);
      // Gold cornice band at top of each tier
      for (var gx = -t.r; gx <= t.r; gx++) {
        setBlock(ox + gx, y + t.hh - 1, oz - t.r, BLOCK.BUS);
        setBlock(ox + gx, y + t.hh - 1, oz + t.r, BLOCK.BUS);
      }
      y += t.hh;
    }
    // Crowning golden dome
    _lmOnionDome(ox, y, oz, 2, BLOCK.BUS);
    _buildings.push({ kind: 'landmark_lavra', x: ox - 5, z: oz - 5, w: 11, d: 11, baseY: h, floorH: 6, floors: 4, cx: ox, cz: oz });
  }

  // ── KYIV: Verkhovna Rada (Ukrainian Parliament) ─────────────────────────
  // Neoclassical 1939 parliament in Lypky district. White colonnade, low dome,
  // stone steps. Defended by soldiers during the Russian advance, Feb 2022.
  function generateVerkhovnaRada(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var bw = 22, bd = 14, bh = 10;
    // Main PLASTER body (shell)
    for (var py = 0; py < bh; py++) {
      for (var px = -Math.floor(bw/2); px <= Math.floor(bw/2); px++) {
        for (var pz = -Math.floor(bd/2); pz <= Math.floor(bd/2); pz++) {
          var edge = (Math.abs(px) === Math.floor(bw/2) || Math.abs(pz) === Math.floor(bd/2));
          if (edge || py === 0 || py === bh - 1) setBlock(ox + px, h + py + 1, oz + pz, BLOCK.PLASTER);
        }
      }
    }
    // GLASS window grid on side walls every 2 blocks
    for (var wy = 2; wy < bh - 2; wy += 3) {
      for (var wx = -9; wx <= 9; wx += 3) {
        setBlock(ox + wx, h + wy + 1, oz - Math.floor(bd/2), BLOCK.GLASS);
        setBlock(ox + wx, h + wy + 1, oz + Math.floor(bd/2), BLOCK.GLASS);
      }
    }
    // 8 STONE columns across south colonnade (public face)
    for (var ci = -7; ci <= 7; ci += 2) {
      for (var cy = 0; cy < bh + 2; cy++) setBlock(ox + ci, h + cy + 1, oz - Math.floor(bd/2) - 3, BLOCK.STONE);
    }
    // Triangular pediment above colonnade
    for (var pi = -8; pi <= 8; pi++) {
      var pHeight = Math.max(0, 3 - Math.abs(pi) / 3);
      for (var ph = 0; ph <= pHeight; ph++) setBlock(ox + pi, h + bh + 1 + ph, oz - Math.floor(bd/2) - 2, BLOCK.STONE);
    }
    // Low LIGHT dome on roof (gold-tinted rotunda)
    for (var dr = 0; dr < 3; dr++) {
      var dR = 3 - dr;
      _lmRing(ox, h + bh + 1 + dr, oz, dR, BLOCK.WHITE_TILE);
    }
    _lmDisc(ox, h + bh + 4, oz, 2, BLOCK.LIGHT);
    setBlock(ox, h + bh + 5, oz, BLOCK.LIGHT);
    // Wide stone entrance steps (south side)
    for (var st = 0; st < 4; st++) {
      for (var sx = -5 + st; sx <= 5 - st; sx++) {
        setBlock(ox + sx, h + st + 1, oz - Math.floor(bd/2) - 3 - (3 - st), BLOCK.STONE);
      }
    }
    // Iron FENCE perimeter around grounds
    for (var fx = -12; fx <= 12; fx++) {
      setBlock(ox + fx, h + 1, oz - 9, BLOCK.FENCE);
      setBlock(ox + fx, h + 1, oz + 9, BLOCK.FENCE);
    }
    for (var fz = -9; fz <= 9; fz++) {
      setBlock(ox - 12, h + 1, oz + fz, BLOCK.FENCE);
      setBlock(ox + 12, h + 1, oz + fz, BLOCK.FENCE);
    }
    _buildings.push({ kind: 'landmark_rada', x: ox - 11, z: oz - 7, w: bw, d: bd, baseY: h, floorH: 5, floors: 2, cx: ox, cz: oz });
  }

  // ── KYIV: NSC Olimpiyskiy (Olympic Stadium) ────────────────────────────
  // Ukraine's national 70k-seat stadium. Oval CONCRETE bowl, 4 floodlight towers.
  // Hosted Euro 2012 final. Now used for civil defense briefings — 2022 siege.
  function generateNSCOlimpiyskiy(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    // Outer oval retaining wall (22×16 semi-ellipse using _lmRing approx)
    var aR = 14, bR = 10;
    for (var a = 0; a < 360; a += 8) {
      var rad = a * Math.PI / 180;
      var wx = Math.round(Math.cos(rad) * aR);
      var wz = Math.round(Math.sin(rad) * bR);
      for (var wy2 = 0; wy2 < 8; wy2++) setBlock(ox + wx, h + wy2 + 1, oz + wz, BLOCK.CONCRETE);
    }
    // Tiered inner seating bowl (3 tiers)
    for (var tier = 0; tier < 3; tier++) {
      var tA = aR - 3 - tier * 3, tB = bR - 2 - tier * 2, tY = h + 3 + tier * 2;
      for (var ta = 0; ta < 360; ta += 6) {
        var trad = ta * Math.PI / 180;
        var tx = Math.round(Math.cos(trad) * tA);
        var tz = Math.round(Math.sin(trad) * tB);
        setBlock(ox + tx, tY, oz + tz, BLOCK.STONE);
      }
    }
    // 4 floodlight towers at quadrants
    var ftPos = [[aR + 2, 0], [-aR - 2, 0], [0, bR + 2], [0, -bR - 2]];
    for (var fi = 0; fi < ftPos.length; fi++) {
      var ftx = ox + ftPos[fi][0], ftz = oz + ftPos[fi][1];
      for (var fh = 0; fh < 18; fh++) setBlock(ftx, h + fh + 1, ftz, BLOCK.METAL);
      // Light boom
      for (var fl = -2; fl <= 2; fl++) {
        setBlock(ftx + fl, h + 18, ftz, BLOCK.METAL);
        setBlock(ftx + fl, h + 18, ftz + (ftPos[fi][1] !== 0 ? 0 : 1), BLOCK.LIGHT);
      }
    }
    // Main south entrance arch
    for (var eh = 0; eh < 5; eh++) {
      setBlock(ox - 2, h + eh + 1, oz + bR, BLOCK.CONCRETE);
      setBlock(ox + 2, h + eh + 1, oz + bR, BLOCK.CONCRETE);
    }
    for (var ea = -2; ea <= 2; ea++) setBlock(ox + ea, h + 6, oz + bR, BLOCK.CONCRETE);
    _buildings.push({ kind: 'landmark_olimpiyskiy', x: ox - aR, z: oz - bR, w: aR*2, d: bR*2, baseY: h, floorH: 4, floors: 2, cx: ox, cz: oz });
  }

  // ── KYIV: St. Michael's Golden-Domed Monastery ─────────────────────────
  // Baroque blue-and-white monastery rebuilt 1997 (Soviet-destroyed in 1936).
  // 7 golden domes. Served as shelter and morgue for Maidan protesters, 2014.
  function generateStMichaelMonastery(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var bw = 14, bd = 10, bh = 8;
    // Blue-white body (WHITE_TILE approximates the cream/white walls)
    for (var py = 0; py < bh; py++) {
      for (var px = -Math.floor(bw/2); px <= Math.floor(bw/2); px++) {
        for (var pz = -Math.floor(bd/2); pz <= Math.floor(bd/2); pz++) {
          var edge = (Math.abs(px) === Math.floor(bw/2) || Math.abs(pz) === Math.floor(bd/2));
          if (edge || py === 0 || py === bh - 1) setBlock(ox + px, h + py + 1, oz + pz, BLOCK.WHITE_TILE);
        }
      }
    }
    // Arched GLASS windows on north and south faces
    for (var wz2 = -3; wz2 <= 3; wz2 += 3) {
      for (var wy3 = 2; wy3 < bh - 1; wy3 += 3) {
        setBlock(ox - Math.floor(bw/2), h + wy3 + 1, oz + wz2, BLOCK.GLASS);
        setBlock(ox + Math.floor(bw/2), h + wy3 + 1, oz + wz2, BLOCK.GLASS);
      }
    }
    // 7 golden onion domes — large central + 6 flanking
    _lmOnionDome(ox, h + bh + 1, oz, 3, BLOCK.BUS);         // central large
    _lmOnionDome(ox - 5, h + bh, oz - 3, 2, BLOCK.BUS);
    _lmOnionDome(ox + 5, h + bh, oz - 3, 2, BLOCK.BUS);
    _lmOnionDome(ox - 5, h + bh, oz + 3, 2, BLOCK.BUS);
    _lmOnionDome(ox + 5, h + bh, oz + 3, 2, BLOCK.BUS);
    _lmOnionDome(ox - 2, h + bh, oz - 5, 1, BLOCK.BUS);
    _lmOnionDome(ox + 2, h + bh, oz - 5, 1, BLOCK.BUS);
    // Separate WHITE_TILE bell tower to the west
    var btx = ox - Math.floor(bw/2) - 6;
    for (var by = 0; by < 14; by++) {
      var taper = by > 10 ? 1 : 2;
      for (var bx = -taper; bx <= taper; bx++) {
        for (var bz = -taper; bz <= taper; bz++) {
          if (Math.abs(bx) === taper || Math.abs(bz) === taper || by === 0) {
            setBlock(btx + bx, h + by + 1, oz + bz, BLOCK.WHITE_TILE);
          }
        }
      }
    }
    _lmOnionDome(btx, h + 15, oz, 2, BLOCK.BUS);
    // Low STONE monastery wall enclosure
    var mw = 22, md = 18;
    for (var mx = -Math.floor(mw/2); mx <= Math.floor(mw/2); mx++) {
      setBlock(ox + mx, h + 1, oz - Math.floor(md/2), BLOCK.STONE);
      setBlock(ox + mx, h + 2, oz - Math.floor(md/2), BLOCK.STONE);
      setBlock(ox + mx, h + 1, oz + Math.floor(md/2), BLOCK.STONE);
      setBlock(ox + mx, h + 2, oz + Math.floor(md/2), BLOCK.STONE);
    }
    for (var mz = -Math.floor(md/2); mz <= Math.floor(md/2); mz++) {
      setBlock(ox - Math.floor(mw/2), h + 1, oz + mz, BLOCK.STONE);
      setBlock(ox - Math.floor(mw/2), h + 2, oz + mz, BLOCK.STONE);
      setBlock(ox + Math.floor(mw/2), h + 1, oz + mz, BLOCK.STONE);
      setBlock(ox + Math.floor(mw/2), h + 2, oz + mz, BLOCK.STONE);
    }
    _buildings.push({ kind: 'landmark_st_michael', x: ox - 11, z: oz - 9, w: mw, d: md, baseY: h, floorH: 4, floors: 2, cx: ox, cz: oz });
  }

  // ── KYIV: Kyiv Arsenal (Арсенал, 1764) ────────────────────────────────
  // Oldest continuously operating industrial enterprise in Kyiv. Tsarist brick
  // fortress-factory. Workers revolted here in 1918. Now a contemporary art museum.
  function generateKyivArsenal(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var bw = 24, bd = 10, bh = 6;
    // Thick BRICK perimeter walls (fortress-gauge, ~2 blocks thick)
    for (var py = 0; py < bh; py++) {
      for (var px = -Math.floor(bw/2); px <= Math.floor(bw/2); px++) {
        for (var pz = -Math.floor(bd/2); pz <= Math.floor(bd/2); pz++) {
          var edge = (Math.abs(px) >= Math.floor(bw/2) - 1 || Math.abs(pz) >= Math.floor(bd/2) - 1);
          if (edge || py === 0) setBlock(ox + px, h + py + 1, oz + pz, BLOCK.BRICK);
        }
      }
    }
    // 4 corner bastion towers (square, 2 stories taller than main wall)
    var corners = [[-Math.floor(bw/2), -Math.floor(bd/2)], [Math.floor(bw/2), -Math.floor(bd/2)],
                   [-Math.floor(bw/2), Math.floor(bd/2)], [Math.floor(bw/2), Math.floor(bd/2)]];
    for (var ci2 = 0; ci2 < corners.length; ci2++) {
      var cx3 = ox + corners[ci2][0], cz3 = oz + corners[ci2][1];
      for (var cy2 = 0; cy2 < bh + 3; cy2++) {
        for (var bx = -2; bx <= 2; bx++) {
          for (var bz = -2; bz <= 2; bz++) {
            if (Math.abs(bx) === 2 || Math.abs(bz) === 2 || cy2 === 0 || cy2 === bh + 2) {
              setBlock(cx3 + bx, h + cy2 + 1, cz3 + bz, BLOCK.STONE);
            }
          }
        }
      }
    }
    // 2 tall BRICK chimneys (factory history)
    for (var chy = 0; chy < 14; chy++) setBlock(ox - 6, h + chy + bh, oz, BLOCK.BRICK);
    for (var chy2 = 0; chy2 < 14; chy2++) setBlock(ox + 6, h + chy2 + bh, oz, BLOCK.BRICK);
    setBlock(ox - 6, h + bh + 14, oz, BLOCK.LIGHT);
    setBlock(ox + 6, h + bh + 14, oz, BLOCK.LIGHT);
    // Arched STONE gateway on north face (vehicle entrance)
    for (var gw = -2; gw <= 2; gw++) {
      for (var gh = 0; gh < 4; gh++) setBlock(ox + gw, h + gh + 1, oz - Math.floor(bd/2), BLOCK.AIR);
    }
    setBlock(ox - 3, h + 4, oz - Math.floor(bd/2), BLOCK.STONE);
    setBlock(ox + 3, h + 4, oz - Math.floor(bd/2), BLOCK.STONE);
    for (var ga = -2; ga <= 2; ga++) setBlock(ox + ga, h + 5, oz - Math.floor(bd/2), BLOCK.STONE);
    // Cannon courtyard paving (flat CONCRETE floor inside)
    for (var cpx = -Math.floor(bw/2) + 2; cpx <= Math.floor(bw/2) - 2; cpx++) {
      for (var cpz = -Math.floor(bd/2) + 2; cpz <= Math.floor(bd/2) - 2; cpz++) {
        setBlock(ox + cpx, h + 1, oz + cpz, BLOCK.CONCRETE);
      }
    }
    _buildings.push({ kind: 'landmark_arsenal', x: ox - Math.floor(bw/2), z: oz - Math.floor(bd/2), w: bw, d: bd, baseY: h, floorH: bh, floors: 1, cx: ox, cz: oz });
  }

  // ── MOSCOW: Ostankino TV Tower ─────────────────────────────────────────
  // Towering tapered concrete needle with an observation-deck bulge + antenna.
  function generateOstankinoTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    // Splayed base feet
    _lmDisc(ox, h + 1, oz, 5, BLOCK.CONCRETE);
    _lmDisc(ox, h + 2, oz, 4, BLOCK.CONCRETE);
    // Tapering shaft
    var shaftH = 44;
    for (var sy = 0; sy < shaftH; sy++) {
      var r = Math.max(1, Math.round(3 - (sy / shaftH) * 2));
      _lmRing(ox, h + 3 + sy, oz, r, BLOCK.CONCRETE);
      if (sy % 6 === 0) _lmRing(ox, h + 3 + sy, oz, r, BLOCK.GLASS); // ribbon windows
    }
    // Observation-deck bulge (the famous restaurant ring)
    var deckY = h + 3 + 30;
    for (var dy = 0; dy < 4; dy++) {
      _lmRing(ox, deckY + dy, oz, 4, dy === 1 || dy === 2 ? BLOCK.GLASS : BLOCK.CONCRETE);
    }
    // Antenna mast spire
    var topY = h + 3 + shaftH;
    for (var ay = 0; ay < 14; ay++) setBlock(ox, topY + ay, oz, BLOCK.METAL);
    setBlock(ox, topY + 14, oz, BLOCK.LIGHT); // aircraft warning light
    _buildings.push({ kind: 'landmark_ostankino', x: ox - 5, z: oz - 5, w: 11, d: 11, baseY: h, floorH: 6, floors: 8, cx: ox, cz: oz });
  }

  // ── MOSCOW: Stalin Skyscraper ("Seven Sisters" / MSU main building) ────
  // Symmetric stepped Stalinist high-rise with wings and a central spire.
  function generateSevenSisters(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    function box(cx, cz, w, d, hh, block) {
      var hxx = -Math.floor(w / 2), hzz = -Math.floor(d / 2);
      for (var yy = 0; yy < hh; yy++) {
        for (var xx = 0; xx < w; xx++) {
          for (var zz = 0; zz < d; zz++) {
            var edge = (xx === 0 || xx === w - 1 || zz === 0 || zz === d - 1);
            if (edge || yy === hh - 1) setBlock(cx + hxx + xx, h + yy + 1, cz + hzz + zz, block);
            // window rows
            if (edge && yy % 2 === 0 && yy > 1 && yy < hh - 1) {
              if ((xx + zz) % 2 === 0) setBlock(cx + hxx + xx, h + yy + 1, cz + hzz + zz, BLOCK.GLASS);
            }
          }
        }
      }
    }
    // Low side wings
    box(ox - 12, oz, 8, 10, 10, BLOCK.STONE);
    box(ox + 12, oz, 8, 10, 10, BLOCK.STONE);
    // Mid setback blocks
    box(ox - 7, oz, 6, 8, 18, BLOCK.STONE);
    box(ox + 7, oz, 6, 8, 18, BLOCK.STONE);
    // Central tower (tallest)
    box(ox, oz, 10, 10, 30, BLOCK.STONE);
    // Stepped crown setbacks
    box(ox, oz, 8, 8, 34, BLOCK.STONE);
    box(ox, oz, 5, 5, 38, BLOCK.STONE);
    // Spire with red star
    for (var spy = 0; spy < 8; spy++) setBlock(ox, h + 39 + spy, oz, BLOCK.METAL);
    setBlock(ox, h + 47, oz, BLOCK.BANNER); // red star finial
    _buildings.push({ kind: 'landmark_seven_sisters', x: ox - 17, z: oz - 5, w: 34, d: 10, baseY: h, floorH: 3, floors: 12, cx: ox, cz: oz });
  }

  // ── MOSCOW: Cathedral of Christ the Saviour ────────────────────────────
  // Massive white cathedral with one huge gold dome + four corner gold domes.
  function generateChristSaviour(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var s = 9; // half-extent of the square body
    for (var py = 0; py < 12; py++) {
      for (var px = -s; px <= s; px++) {
        for (var pz = -s; pz <= s; pz++) {
          var isWall = (Math.abs(px) === s || Math.abs(pz) === s);
          if (isWall || py === 0 || py === 11) setBlock(ox + px, h + py + 1, oz + pz, BLOCK.WHITE_TILE);
        }
      }
    }
    // Gold cornice band
    for (var bx = -s; bx <= s; bx++) {
      setBlock(ox + bx, h + 12, oz - s, BLOCK.BUS);
      setBlock(ox + bx, h + 12, oz + s, BLOCK.BUS);
      setBlock(ox - s, h + 12, oz + bx, BLOCK.BUS);
      setBlock(ox + s, h + 12, oz + bx, BLOCK.BUS);
    }
    // Tall arched windows
    for (var wy = 3; wy < 10; wy += 3) {
      for (var wo = -5; wo <= 5; wo += 5) {
        setBlock(ox + wo, h + wy + 1, oz - s, BLOCK.GLASS);
        setBlock(ox + wo, h + wy + 1, oz + s, BLOCK.GLASS);
        setBlock(ox - s, h + wy + 1, oz + wo, BLOCK.GLASS);
        setBlock(ox + s, h + wy + 1, oz + wo, BLOCK.GLASS);
      }
    }
    // Huge central gold dome on a drum
    for (var dr = 0; dr < 3; dr++) _lmRing(ox, h + 12 + dr, oz, 4, BLOCK.WHITE_TILE);
    var domeProfile = [4, 4, 3, 3, 2, 1];
    for (var di = 0; di < domeProfile.length; di++) _lmDisc(ox, h + 15 + di, oz, domeProfile[di], BLOCK.BUS);
    setBlock(ox, h + 15 + domeProfile.length, oz, BLOCK.METAL);
    setBlock(ox, h + 16 + domeProfile.length, oz, BLOCK.METAL);
    // Four corner gold domes
    var corners = [[-6, -6], [6, -6], [-6, 6], [6, 6]];
    for (var ci = 0; ci < corners.length; ci++) {
      _lmOnionDome(ox + corners[ci][0], h + 12, oz + corners[ci][1], 2, BLOCK.BUS);
    }
    // Entrance portico (south)
    for (var dw3 = -2; dw3 <= 2; dw3++) {
      for (var dh3 = 0; dh3 < 4; dh3++) setBlock(ox + dw3, h + dh3 + 1, oz - s, BLOCK.DOOR);
    }
    _buildings.push({ kind: 'landmark_christ_saviour', x: ox - s, z: oz - s, w: 2 * s + 1, d: 2 * s + 1, baseY: h, floorH: 4, floors: 3, cx: ox, cz: oz });
  }

  // ── CHORNOBYL: New Safe Confinement (reactor sarcophagus arch) ─────────
  // The vast silver steel arch sealing Reactor No. 4 — a barrel-vault hangar.
  function generateChornobylSarcophagus(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    // Concrete reactor base under the arch
    for (var bx = -9; bx <= 9; bx++) {
      for (var bz = -8; bz <= 8; bz++) {
        for (var by = 0; by < 5; by++) {
          var shell = (bx === -9 || bx === 9 || bz === -8 || bz === 8 || by === 0 || by === 4);
          if (shell) setBlock(ox + bx, h + by + 1, oz + bz, BLOCK.CONCRETE);
        }
      }
    }
    // The great arch — semicircular METAL ribs swept along z (a half-cylinder)
    var R = 11;
    for (var z = -9; z <= 9; z++) {
      var ribFull = (((z + 9) % 3) === 0); // solid ribs every 3 blocks, ribbon between
      for (var deg = 0; deg <= 180; deg += 4) {
        var rad = deg * Math.PI / 180;
        var ax = Math.round(ox + Math.cos(rad) * R);
        var ay = Math.round(h + 1 + Math.sin(rad) * R);
        if (ribFull) {
          setBlock(ax, ay, oz + z, BLOCK.METAL);
          // double-skin the rib for thickness
          var ax2 = Math.round(ox + Math.cos(rad) * (R - 1));
          var ay2 = Math.round(h + 1 + Math.sin(rad) * (R - 1));
          setBlock(ax2, ay2, oz + z, BLOCK.METAL);
        } else if (deg % 12 === 0) {
          setBlock(ax, ay, oz + z, BLOCK.METAL); // longitudinal ties
        }
      }
    }
    // Closed end walls (north + south) — metal cladding with vent louvers
    for (var deg2 = 0; deg2 <= 180; deg2 += 4) {
      var rd = deg2 * Math.PI / 180;
      for (var rr = 0; rr <= R; rr++) {
        var ex = Math.round(ox + Math.cos(rd) * rr);
        var ey = Math.round(h + 1 + Math.sin(rd) * rr);
        var blk = (deg2 % 16 === 0) ? BLOCK.GLASS : BLOCK.METAL;
        setBlock(ex, ey, oz - 9, blk);
        setBlock(ex, ey, oz + 9, BLOCK.METAL);
      }
    }
    // Ventilation stack beside the hall (the classic red-white chimney)
    for (var sy = 0; sy < 22; sy++) {
      setBlock(ox + 13, h + sy + 1, oz, ((sy >> 1) & 1) ? BLOCK.BANNER : BLOCK.WHITE_TILE);
    }
    setBlock(ox + 13, h + 23, oz, BLOCK.LIGHT);
    _buildings.push({ kind: 'landmark_sarcophagus', x: ox - 11, z: oz - 9, w: 23, d: 19, baseY: h, floorH: 5, floors: 2, cx: ox, cz: oz });
  }

  // ── CHORNOBYL (Pripyat): the abandoned amusement-park Ferris wheel ──────
  function generatePripyatFerrisWheel(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var cy = h + 12;       // hub height
    var R = 9;             // wheel radius
    // A-frame support legs (in the X-Y plane, straddling the hub)
    for (var ly = 0; ly < 12; ly++) {
      var spread = Math.round((1 - ly / 12) * 5);
      setBlock(ox - spread, h + ly + 1, oz - 1, BLOCK.METAL);
      setBlock(ox + spread, h + ly + 1, oz - 1, BLOCK.METAL);
      setBlock(ox - spread, h + ly + 1, oz + 1, BLOCK.METAL);
      setBlock(ox + spread, h + ly + 1, oz + 1, BLOCK.METAL);
    }
    // Hub
    setBlock(ox, cy, oz, BLOCK.METAL);
    // Wheel rim + spokes + gondolas (vertical circle at z = oz)
    var cabins = 8;
    for (var i = 0; i < 48; i++) {
      var a = (i / 48) * Math.PI * 2;
      var wx = Math.round(ox + Math.cos(a) * R);
      var wy = Math.round(cy + Math.sin(a) * R);
      setBlock(wx, wy, oz, BLOCK.METAL);          // rim
      var wx2 = Math.round(ox + Math.cos(a) * (R - 1));
      var wy2 = Math.round(cy + Math.sin(a) * (R - 1));
      setBlock(wx2, wy2, oz, BLOCK.METAL);        // inner rim
    }
    for (var s = 0; s < cabins; s++) {
      var sa = (s / cabins) * Math.PI * 2;
      // spoke
      for (var sp = 1; sp < R; sp++) {
        setBlock(Math.round(ox + Math.cos(sa) * sp), Math.round(cy + Math.sin(sa) * sp), oz, BLOCK.METAL);
      }
      // yellow gondola hanging just outside the rim
      var gx = Math.round(ox + Math.cos(sa) * (R + 1));
      var gy = Math.round(cy + Math.sin(sa) * (R + 1));
      setBlock(gx, gy, oz - 1, BLOCK.BUS);
      setBlock(gx, gy, oz + 1, BLOCK.BUS);
      setBlock(gx, gy, oz, BLOCK.BUS);
      setBlock(gx, gy - 1, oz, BLOCK.BUS);
    }
    _buildings.push({ kind: 'landmark_ferris_wheel', x: ox - R, z: oz - 2, w: 2 * R + 1, d: 5, baseY: h, floorH: 12, floors: 1, cx: ox, cz: oz });
  }

  // ── CHORNOBYL: Duga over-the-horizon radar ("Russian Woodpecker") ──────
  // Colossal lattice wall of horizontal antenna elements on tall masts.
  function generateDugaRadar(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var halfLen = 22, wallH = 38;
    // Vertical lattice masts every 4 blocks
    for (var x = -halfLen; x <= halfLen; x += 4) {
      for (var y = 0; y < wallH; y++) {
        setBlock(ox + x, h + y + 1, oz, BLOCK.METAL);
        setBlock(ox + x, h + y + 1, oz + 2, BLOCK.METAL); // depth (twin plane)
      }
    }
    // Horizontal antenna elements (the iconic stacked rows)
    for (var ry = 4; ry < wallH; ry += 4) {
      for (var rx = -halfLen; rx <= halfLen; rx++) {
        setBlock(ox + rx, h + ry + 1, oz, BLOCK.METAL);
      }
    }
    // Cross-bracing diagonals (sparse, for the lattice look)
    for (var bx = -halfLen; bx < halfLen; bx += 4) {
      for (var d = 0; d < 4; d++) {
        setBlock(ox + bx + d, h + d + 4 + 1, oz + 1, BLOCK.METAL);
      }
    }
    // Connect the twin planes top + bottom
    for (var cx2 = -halfLen; cx2 <= halfLen; cx2 += 8) {
      setBlock(ox + cx2, h + wallH, oz + 1, BLOCK.METAL);
      setBlock(ox + cx2, h + 1, oz + 1, BLOCK.METAL);
    }
    _buildings.push({ kind: 'landmark_duga', x: ox - halfLen, z: oz - 1, w: 2 * halfLen + 1, d: 4, baseY: h, floorH: wallH, floors: 1, cx: ox, cz: oz });
  }

  // ── MARIUPOL: Drama Theatre ────────────────────────────────────────────
  // Neoclassical theatre with a grand columned portico + pediment. A white
  // memorial plaza recalls the "ДЕТИ" (CHILDREN) sign laid before the strike.
  function generateMariupolDramaTheatre(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var bw = 22, bd = 14, bh = 10;
    var hx = -Math.floor(bw / 2), hz = -Math.floor(bd / 2);
    // Theatre body (white neoclassical block)
    for (var py = 0; py < bh; py++) {
      for (var px = 0; px < bw; px++) {
        for (var pz = 0; pz < bd; pz++) {
          var isWall = (px === 0 || px === bw - 1 || pz === 0 || pz === bd - 1);
          if (isWall || py === 0 || py === bh - 1) setBlock(ox + hx + px, h + py + 1, oz + hz + pz, BLOCK.WHITE_TILE);
        }
      }
    }
    // Tall windows
    for (var wy = 3; wy < bh - 1; wy += 3) {
      for (var wx2 = 3; wx2 < bw - 3; wx2 += 3) {
        setBlock(ox + hx + wx2, h + wy + 1, oz + hz, BLOCK.GLASS);
        setBlock(ox + hx + wx2, h + wy + 1, oz + hz + bd - 1, BLOCK.GLASS);
      }
    }
    // Grand portico: row of columns across the south front
    var frontZ = oz + hz - 2;
    for (var col = -8; col <= 8; col += 4) {
      for (var cyy = 0; cyy < bh + 1; cyy++) setBlock(ox + col, h + cyy + 1, frontZ, BLOCK.CONCRETE);
    }
    // Architrave + triangular pediment over the columns
    for (var ax = -9; ax <= 9; ax++) setBlock(ox + ax, h + bh + 1, frontZ, BLOCK.WHITE_TILE);
    for (var pr = 0; pr < 5; pr++) {
      for (var pxx = -(4 - pr); pxx <= (4 - pr); pxx++) {
        setBlock(ox + pxx, h + bh + 2 + pr, frontZ, BLOCK.WHITE_TILE);
      }
    }
    // Roof ridge / low attic
    for (var rx = hx + 2; rx <= hx + bw - 3; rx++) setBlock(ox + rx, h + bh + 1, oz, BLOCK.ROOFTILE);
    // Memorial plaza in front with the white "ДЕТИ" lettering on the ground
    var plazaZ = oz + hz - 8;
    for (var qx = -10; qx <= 10; qx++) {
      for (var qz = -3; qz <= 2; qz++) setBlock(ox + qx, h + 1, plazaZ + qz, BLOCK.CONCRETE);
    }
    // Block letters Д Е Т И (5 tall, laid flat) in WHITE_TILE on the plaza
    var lz0 = plazaZ - 2;
    function _mark(lx, lz) { setBlock(ox + lx, h + 2, lz0 + lz, BLOCK.WHITE_TILE); }
    // Д
    _mark(-9,0);_mark(-8,0);_mark(-7,0);_mark(-9,1);_mark(-7,1);_mark(-9,2);_mark(-7,2);_mark(-9,3);_mark(-8,3);_mark(-7,3);_mark(-9,4);_mark(-7,4);
    // Е
    _mark(-5,0);_mark(-4,0);_mark(-3,0);_mark(-5,1);_mark(-5,2);_mark(-4,2);_mark(-5,3);_mark(-5,4);_mark(-4,4);_mark(-3,4);
    // Т
    _mark(-1,0);_mark(0,0);_mark(1,0);_mark(0,1);_mark(0,2);_mark(0,3);_mark(0,4);
    // И
    _mark(3,0);_mark(3,1);_mark(3,2);_mark(3,3);_mark(3,4);_mark(5,0);_mark(5,1);_mark(5,2);_mark(5,3);_mark(5,4);_mark(4,2);
    _buildings.push({ kind: 'landmark_drama_theatre', x: ox + hx, z: oz + hz, w: bw, d: bd, baseY: h, floorH: 3, floors: 3, cx: ox, cz: oz });
  }

  // ── SEVASTOPOL: Defense Panorama (round neoclassical rotunda museum) ────
  function generateSevastopolPanorama(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var R = 9, wallH = 9;
    // Round drum wall
    for (var y = 0; y < wallH; y++) {
      _lmRing(ox, h + y + 1, oz, R, BLOCK.WHITE_TILE);
    }
    // Floor
    _lmDisc(ox, h + 1, oz, R, BLOCK.STONE);
    // Encircling colonnade just outside the wall
    for (var a = 0; a < 360; a += 30) {
      var rad = a * Math.PI / 180;
      var cxp = Math.round(ox + Math.cos(rad) * (R + 1));
      var czp = Math.round(oz + Math.sin(rad) * (R + 1));
      for (var cyy = 0; cyy < wallH; cyy++) setBlock(cxp, h + cyy + 1, czp, BLOCK.CONCRETE);
    }
    // Windows around the drum
    for (var a2 = 0; a2 < 360; a2 += 30) {
      var rad2 = a2 * Math.PI / 180;
      setBlock(Math.round(ox + Math.cos(rad2) * R), h + 4, Math.round(oz + Math.sin(rad2) * R), BLOCK.GLASS);
      setBlock(Math.round(ox + Math.cos(rad2) * R), h + 5, Math.round(oz + Math.sin(rad2) * R), BLOCK.GLASS);
    }
    // Shallow green dome roof (conical)
    var domeProfile = [9, 8, 6, 4, 2, 1];
    for (var di = 0; di < domeProfile.length; di++) {
      _lmDisc(ox, h + wallH + 1 + di, oz, domeProfile[di], di < 2 ? BLOCK.STREET_SIGN : BLOCK.METAL);
    }
    setBlock(ox, h + wallH + 1 + domeProfile.length, oz, BLOCK.FLAG);
    // Entrance portico
    for (var dw = -1; dw <= 1; dw++) {
      for (var dh = 0; dh < 4; dh++) setBlock(ox + dw, h + dh + 1, oz - R, BLOCK.DOOR);
    }
    _buildings.push({ kind: 'landmark_panorama', x: ox - R, z: oz - R, w: 2 * R + 1, d: 2 * R + 1, baseY: h, floorH: 4, floors: 2, cx: ox, cz: oz });
  }

  // ── HOSTOMEL: Antonov An-225 "Mriya" ───────────────────────────────────
  // The world's largest aircraft, destroyed in its hangar at Hostomel in 2022.
  // Built here as a battle-damaged hulk in Ukrainian blue/yellow livery.
  function generateAN225Mriya(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var fy = h + 4;        // fuselage centre height (sitting on gear)
    // Fuselage — long horizontal tube along X
    for (var x = -22; x <= 22; x++) {
      var rr = (x < -18) ? 1 : 2; // taper at the tail
      for (var dy = -rr; dy <= rr; dy++) {
        for (var dz = -rr; dz <= rr; dz++) {
          if (dy * dy + dz * dz <= rr * rr + 1) {
            // Blue belly stripe / white upper (Ukrainian livery)
            var blk = (dy <= -1) ? BLOCK.BLUE_TILE : BLOCK.WHITE_TILE;
            setBlock(ox + x, fy + dy, oz + dz, blk);
          }
        }
      }
    }
    // Cockpit hump near the nose
    for (var cx2 = 18; cx2 <= 21; cx2++) {
      setBlock(ox + cx2, fy + 3, oz, BLOCK.GLASS);
      setBlock(ox + cx2, fy + 2, oz - 1, BLOCK.GLASS);
      setBlock(ox + cx2, fy + 2, oz + 1, BLOCK.GLASS);
    }
    // Nose cone
    setBlock(ox + 23, fy, oz, BLOCK.WHITE_TILE);
    // Main wing — large swept slab through mid-fuselage (spans Z)
    for (var wx = -6; wx <= 8; wx++) {
      var sweep = Math.round((8 - wx) * 0.4); // leading-edge sweep
      for (var wz = -20; wz <= 20; wz++) {
        if (Math.abs(wz) < 3) continue; // wing roots meet fuselage
        var taper = Math.abs(wz) > 14 ? 1 : 0; // thinner wingtips
        if (taper && wx > 5) continue;
        setBlock(ox + wx - sweep, fy - 1, oz + wz, BLOCK.WHITE_TILE);
      }
    }
    // Yellow wingtip accents (livery)
    setBlock(ox - 2, fy - 1, oz - 20, BLOCK.LIGHT);
    setBlock(ox - 2, fy - 1, oz + 20, BLOCK.LIGHT);
    // Six engine pods under the wings (3 per side)
    var engZ = [-16, -11, -6, 6, 11, 16];
    for (var ei = 0; ei < engZ.length; ei++) {
      for (var ex = 0; ex <= 3; ex++) {
        setBlock(ox + ex - 1, fy - 3, oz + engZ[ei], BLOCK.METAL);
      }
      setBlock(ox - 2, fy - 3, oz + engZ[ei], BLOCK.ELECTRONICS); // intake fan
    }
    // Twin vertical tail fins (the An-225's signature)
    for (var ty = 0; ty < 7; ty++) {
      setBlock(ox - 20, fy + 2 + ty, oz - 6, BLOCK.BLUE_TILE);
      setBlock(ox - 20, fy + 2 + ty, oz + 6, BLOCK.BLUE_TILE);
    }
    // Horizontal stabiliser connecting the tails
    for (var sz = -7; sz <= 7; sz++) setBlock(ox - 20, fy + 2, oz + sz, BLOCK.WHITE_TILE);
    // Landing gear (rows of wheels)
    for (var gz = -3; gz <= 3; gz += 2) {
      for (var gx = -4; gx <= 6; gx += 2) {
        setBlock(ox + gx, h + 1, oz + gz, BLOCK.METAL);
        setBlock(ox + gx, h + 2, oz + gz, BLOCK.METAL);
      }
    }
    // Battle damage — the hulk is broken and burning around the left wing
    setBlock(ox + 2, fy - 1, oz - 14, BLOCK.FIRE);
    setBlock(ox + 1, fy - 1, oz - 17, BLOCK.FIRE);
    setBlock(ox - 1, fy, oz - 19, BLOCK.RUBBLE);
    setBlock(ox + 4, fy - 1, oz - 11, BLOCK.RUBBLE);
    _buildings.push({ kind: 'landmark_an225', x: ox - 22, z: oz - 20, w: 46, d: 41, baseY: h, floorH: 4, floors: 1, cx: ox, cz: oz });
  }

  // ── SNAKE ISLAND: the Zmiinyi Island lighthouse ────────────────────────
  // Tall round red/white-banded tower with a glazed lantern room + keeper hut.
  function generateLighthouse(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var towerH = 22, R = 2;
    for (var y = 0; y < towerH; y++) {
      var band = ((y >> 1) & 1); // alternating bands every 2 blocks
      var blk = band ? BLOCK.BANNER : BLOCK.WHITE_TILE;
      for (var dx = -R; dx <= R; dx++) {
        for (var dz = -R; dz <= R; dz++) {
          if (dx * dx + dz * dz <= R * R + 1) {
            var edge = (dx * dx + dz * dz > (R - 1) * (R - 1));
            if (edge || y === 0) setBlock(ox + dx, h + y + 1, oz + dz, blk);
          }
        }
      }
    }
    // Gallery deck below the lantern
    _lmDisc(ox, h + towerH + 1, oz, R + 1, BLOCK.METAL);
    // Glazed lantern room
    for (var ly = 0; ly < 3; ly++) {
      _lmRing(ox, h + towerH + 2 + ly, oz, R, BLOCK.GLASS);
    }
    // Light + roof
    setBlock(ox, h + towerH + 5, oz, BLOCK.LIGHT);
    _lmDisc(ox, h + towerH + 6, oz, R, BLOCK.METAL);
    setBlock(ox, h + towerH + 7, oz, BLOCK.FLAG);
    // Keeper's building at the base (small stone hut)
    for (var bx = 3; bx <= 8; bx++) {
      for (var bz = -3; bz <= 3; bz++) {
        for (var by = 0; by < 4; by++) {
          var shell = (bx === 3 || bx === 8 || bz === -3 || bz === 3 || by === 0 || by === 3);
          if (shell) setBlock(ox + bx, h + by + 1, oz + bz, BLOCK.STONE);
        }
      }
    }
    setBlock(ox + 3, h + 2, oz, BLOCK.DOOR);
    _buildings.push({ kind: 'landmark_lighthouse', x: ox - R, z: oz - R, w: 12, d: 7, baseY: h, floorH: towerH, floors: 1, cx: ox, cz: oz });
  }

  // ── DONBAS: terikon (coal-mine slag heap) ──────────────────────────────
  // The signature flat-topped cones that dominate the Donbas skyline.
  function generateTerikon(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var baseR = 12, peakH = 15;
    for (var y = 0; y < peakH; y++) {
      var r = Math.round(baseR * (1 - y / peakH));
      for (var dx = -r; dx <= r; dx++) {
        for (var dz = -r; dz <= r; dz++) {
          if (dx * dx + dz * dz <= r * r + 1) {
            // Dark spoil: mostly dirt/stone with rubble flecks; smouldering top
            var blk = BLOCK.DIRT;
            var hsh = ((dx * 7 + dz * 13 + y * 5) & 7);
            if (hsh === 0) blk = BLOCK.STONE;
            else if (hsh === 1) blk = BLOCK.RUBBLE;
            setBlock(ox + dx, h + y + 1, oz + dz, blk);
          }
        }
      }
    }
    // Smouldering vents near the summit (terikons often burn internally)
    setBlock(ox, h + peakH, oz, BLOCK.FIRE);
    setBlock(ox + 2, h + peakH - 1, oz - 1, BLOCK.FIRE);
    // Old mine conveyor stub climbing one flank
    for (var c = 0; c < 8; c++) {
      setBlock(ox + baseR - c, h + c + 1, oz + 1, BLOCK.METAL);
    }
    _buildings.push({ kind: 'landmark_terikon', x: ox - baseR, z: oz - baseR, w: 2 * baseR + 1, d: 2 * baseR + 1, baseY: h, floorH: peakH, floors: 1, cx: ox, cz: oz });
  }

  // ── SAKY: destroyed Su-24 fighter-bomber on the apron ──────────────────
  // A blackened swept-wing jet wreck — the kind Ukraine hit at Saky in 2022.
  function generateDestroyedJet(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var fy = h + 2;
    // Fuselage along X (charred metal)
    for (var x = -8; x <= 8; x++) {
      var rr = (x > 5) ? 0 : 1; // pointed nose
      for (var dy = -rr; dy <= rr; dy++) {
        for (var dz = -rr; dz <= rr; dz++) {
          setBlock(ox + x, fy + dy, oz + dz, BLOCK.METAL);
        }
      }
    }
    // Cockpit canopy
    setBlock(ox + 5, fy + 1, oz, BLOCK.GLASS);
    // Variable-sweep wings (Su-24 swing-wings, here swept back) — one wing broken
    for (var wx = -4; wx <= 2; wx++) {
      for (var wz = 2; wz <= 9; wz++) {
        if (wz - 2 > (wx + 4) + 2) continue; // swept trailing edge
        setBlock(ox + wx, fy - 1, oz + wz, BLOCK.METAL);          // intact right wing
        if (wz <= 6) setBlock(ox + wx, fy - 1, oz - wz, BLOCK.RUBBLE); // shattered left wing
      }
    }
    // Twin tail fins
    for (var ty = 0; ty < 4; ty++) {
      setBlock(ox - 7, fy + 1 + ty, oz - 1, BLOCK.METAL);
      setBlock(ox - 7, fy + 1 + ty, oz + 1, BLOCK.METAL);
    }
    // Twin engine exhausts
    setBlock(ox - 8, fy, oz - 1, BLOCK.FUEL_BARREL);
    setBlock(ox - 8, fy, oz + 1, BLOCK.FUEL_BARREL);
    // Burning wreckage + scorch
    setBlock(ox - 1, fy, oz - 3, BLOCK.FIRE);
    setBlock(ox + 1, fy - 1, oz + 4, BLOCK.FIRE);
    setBlock(ox - 3, h + 1, oz - 5, BLOCK.RUBBLE);
    _buildings.push({ kind: 'landmark_destroyed_jet', x: ox - 8, z: oz - 9, w: 17, d: 19, baseY: h, floorH: 3, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: AKHZ Coke Oven Battery — Avdiivka's iconic blast-furnace chimneys
  function generateAKHZBlastFurnace(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Coke battery: 22W × 6D × 8H BRICK shell (the long coke oven house)
    for (var y = 0; y < 8; y++) {
      for (var x = -11; x <= 10; x++) {
        for (var z = -3; z <= 2; z++) {
          if (y === 0 || x === -11 || x === 10 || z === -3 || z === 2)
            setBlock(ox + x, base + y, oz + z, BLOCK.BRICK);
        }
      }
    }
    // Roof slab
    for (var rx = -10; rx <= 9; rx++) for (var rz = -2; rz <= 1; rz++)
      setBlock(ox + rx, base + 8, oz + rz, BLOCK.CONCRETE);
    // Coke-oven push-doors: METAL grilles on south face every 3 blocks
    for (var dx = -9; dx <= 8; dx += 3) {
      setBlock(ox + dx, base + 1, oz + 2, BLOCK.METAL);
      setBlock(ox + dx, base + 2, oz + 2, BLOCK.METAL);
      setBlock(ox + dx, base + 3, oz + 2, BLOCK.METAL);
      setBlock(ox + dx, base + 4, oz + 2, BLOCK.METAL);
    }
    // Floor-division band (CONCRETE stripe at mid-height on north, METAL on south oven side)
    for (var fb = -11; fb <= 10; fb++) {
      setBlock(ox + fb, base + 4, oz - 3, BLOCK.CONCRETE);
      setBlock(ox + fb, base + 4, oz + 2, BLOCK.METAL);
    }
    // 3 massive chimneys (BRICK 2×2, 26 tall above roof)
    var chX = [ox - 8, ox, ox + 8];
    for (var ci = 0; ci < 3; ci++) {
      var cx = chX[ci];
      for (var cy = 0; cy < 26; cy++) {
        setBlock(cx,     base + 9 + cy, oz - 1, BLOCK.BRICK);
        setBlock(cx + 1, base + 9 + cy, oz - 1, BLOCK.BRICK);
        setBlock(cx,     base + 9 + cy, oz,     BLOCK.BRICK);
        setBlock(cx + 1, base + 9 + cy, oz,     BLOCK.BRICK);
        if (cy % 6 === 5) {
          setBlock(cx,     base + 9 + cy, oz - 1, BLOCK.CONCRETE);
          setBlock(cx + 1, base + 9 + cy, oz - 1, BLOCK.CONCRETE);
          setBlock(cx,     base + 9 + cy, oz,     BLOCK.CONCRETE);
          setBlock(cx + 1, base + 9 + cy, oz,     BLOCK.CONCRETE);
        }
      }
      setBlock(cx,     base + 35, oz - 1, BLOCK.FIRE);
      setBlock(cx + 1, base + 35, oz,     BLOCK.FIRE);
    }
    // Coal conveyor arm (METAL, extends north from plant)
    for (var arm = -15; arm <= -11; arm++) {
      setBlock(ox + arm, base + 6, oz - 5, BLOCK.METAL);
      setBlock(ox + arm, base + 5, oz - 5, BLOCK.METAL);
    }
    // Coal stockpile (RUBBLE mound north of plant)
    for (var hx = -3; hx <= 3; hx++) {
      for (var hz = -4; hz <= -1; hz++) {
        if (hx * hx + hz * hz <= 12) {
          var mh = Math.max(0, Math.round(2 - (hx * hx + hz * hz) / 5));
          for (var hy = 0; hy <= mh; hy++) setBlock(ox + hx, h + hy, oz + hz - 5, BLOCK.RUBBLE);
        }
      }
    }
    _buildings.push({ kind: 'landmark_akhz', x: ox - 11, z: oz - 10, w: 22, d: 13, baseY: h, floorH: 8, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Artemivsk Winery — red-brick champagne factory used by Wagner as HQ (Bakhmut)
  function generateArtemivskWinery(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var bW = 8, bD = 4, fh = 4;
    // Main body: 17W × 9D × 12H BRICK shell
    for (var y = 0; y < 12; y++) {
      for (var x = -bW; x <= bW; x++) {
        for (var z = -bD; z <= bD; z++) {
          if (y === 0 || x === -bW || x === bW || z === -bD || z === bD)
            setBlock(ox + x, base + y, oz + z, BLOCK.BRICK);
        }
      }
    }
    // Roof parapet
    for (var rx = -bW; rx <= bW; rx++) for (var rz = -bD; rz <= bD; rz++)
      setBlock(ox + rx, base + 12, oz + rz, BLOCK.BRICK);
    // Floor dividers (CONCRETE stripe at fh intervals)
    for (var fd = -bW; fd <= bW; fd++) {
      setBlock(ox + fd, base + fh,     oz - bD, BLOCK.CONCRETE);
      setBlock(ox + fd, base + fh * 2, oz - bD, BLOCK.CONCRETE);
      setBlock(ox + fd, base + fh,     oz + bD, BLOCK.CONCRETE);
      setBlock(ox + fd, base + fh * 2, oz + bD, BLOCK.CONCRETE);
    }
    // Arched windows: GLASS every 3 on N + S faces, 2 per floor
    for (var wfl = 0; wfl < 3; wfl++) {
      for (var wx = -6; wx <= 5; wx += 3) {
        setBlock(ox + wx, base + wfl * fh + 1, oz - bD, BLOCK.GLASS);
        setBlock(ox + wx, base + wfl * fh + 2, oz - bD, BLOCK.GLASS);
        setBlock(ox + wx, base + wfl * fh + 1, oz + bD, BLOCK.GLASS);
        setBlock(ox + wx, base + wfl * fh + 2, oz + bD, BLOCK.GLASS);
      }
    }
    // NW corner tower: 4×4 BRICK, 5 extra floors above main body (20 total)
    var tox = ox - bW, toz = oz - bD;
    for (var ty = 0; ty < 20; ty++) {
      setBlock(tox,     base + ty, toz,     BLOCK.BRICK);
      setBlock(tox + 1, base + ty, toz,     BLOCK.BRICK);
      setBlock(tox,     base + ty, toz + 1, BLOCK.BRICK);
      setBlock(tox + 1, base + ty, toz + 1, BLOCK.BRICK);
    }
    // Tower stepped pinnacle
    setBlock(tox,     base + 20, toz,     BLOCK.STONE);
    setBlock(tox + 1, base + 20, toz,     BLOCK.STONE);
    setBlock(tox,     base + 20, toz + 1, BLOCK.STONE);
    setBlock(tox + 1, base + 20, toz + 1, BLOCK.STONE);
    setBlock(tox,     base + 21, toz,     BLOCK.STONE);
    // Entrance (clear 2×2 on S face centre)
    setBlock(ox,     base,     oz + bD, BLOCK.AIR);
    setBlock(ox - 1, base,     oz + bD, BLOCK.AIR);
    setBlock(ox,     base + 1, oz + bD, BLOCK.AIR);
    setBlock(ox - 1, base + 1, oz + bD, BLOCK.AIR);
    // Cellar steps — the legendary chalk-tunnel entrance
    setBlock(ox + 3, h,     oz + bD + 1, BLOCK.STONE);
    setBlock(ox + 3, h - 1, oz + bD + 2, BLOCK.STONE);
    _buildings.push({ kind: 'landmark_artemivsk_winery', x: ox - bW, z: oz - bD, w: bW * 2 + 1, d: bD * 2 + 1, baseY: h, floorH: fh, floors: 3, cx: ox, cz: oz });
  }

  // LANDMARK: Kherson Railway Station — Soviet neoclassical station with clock tower
  function generateKhersonStation(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Main hall: 22W × 8D × 9H PLASTER (white stucco) shell
    for (var y = 0; y < 9; y++) {
      for (var x = -11; x <= 10; x++) {
        for (var z = -4; z <= 3; z++) {
          if (y === 0 || x === -11 || x === 10 || z === -4 || z === 3)
            setBlock(ox + x, base + y, oz + z, BLOCK.PLASTER);
        }
      }
    }
    // Roof
    for (var rx = -10; rx <= 9; rx++) for (var rz = -3; rz <= 2; rz++)
      setBlock(ox + rx, base + 9, oz + rz, BLOCK.CONCRETE);
    // Windows on track (north) face
    for (var wx = -9; wx <= 7; wx += 3) {
      setBlock(ox + wx, base + 2, oz - 4, BLOCK.GLASS);
      setBlock(ox + wx, base + 3, oz - 4, BLOCK.GLASS);
      setBlock(ox + wx, base + 5, oz - 4, BLOCK.GLASS);
      setBlock(ox + wx, base + 6, oz - 4, BLOCK.GLASS);
    }
    // Entrance colonnade: 6 CONCRETE columns on south face
    for (var col = -8; col <= 7; col += 3) {
      for (var cy = 0; cy < 8; cy++) setBlock(ox + col, base + cy, oz + 4, BLOCK.CONCRETE);
    }
    for (var ex = -9; ex <= 8; ex++) setBlock(ox + ex, base + 8, oz + 4, BLOCK.CONCRETE);
    // Central clock tower: 4×4 WHITE_TILE, 15 high above roof
    for (var ty = 0; ty < 15; ty++) {
      for (var tx = -2; tx <= 1; tx++) {
        for (var tz = -2; tz <= 1; tz++) {
          if (tx === -2 || tx === 1 || tz === -2 || tz === 1)
            setBlock(ox + tx, base + 9 + ty, oz + tz, BLOCK.WHITE_TILE);
        }
      }
    }
    // Clock faces (GLASS, near top, N + S)
    setBlock(ox - 1, base + 20, oz - 2, BLOCK.GLASS);
    setBlock(ox,     base + 20, oz - 2, BLOCK.GLASS);
    setBlock(ox - 1, base + 20, oz + 1, BLOCK.GLASS);
    setBlock(ox,     base + 20, oz + 1, BLOCK.GLASS);
    // Tower cap + flag
    _lmDisc(ox, base + 24, oz, 1, BLOCK.CONCRETE);
    setBlock(ox, base + 25, oz, BLOCK.FLAG);
    // Platform: STONE slab extending north (track side)
    for (var pi = -8; pi <= 11; pi++) {
      for (var pz = -7; pz <= -5; pz++) setBlock(ox + pi, h + 1, oz + pz, BLOCK.STONE);
    }
    // Platform awning (METAL beam overhead)
    for (var pp = -6; pp <= 8; pp += 5) {
      for (var pa = 1; pa <= 4; pa++) setBlock(ox + pp, base + pa, oz - 5, BLOCK.METAL);
    }
    for (var pb = -7; pb <= 9; pb++) setBlock(ox + pb, base + 4, oz - 5, BLOCK.METAL);
    _buildings.push({ kind: 'landmark_kherson_station', x: ox - 11, z: oz - 7, w: 22, d: 12, baseY: h, floorH: 9, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Kerch Fortress (Yeni-Kale) — Ottoman-Russian fortification on the Kerch Strait
  function generateKerchFortress(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var R = 10;
    // Outer walls: STONE 2 thick, 6 high
    for (var x = -R; x <= R; x++) {
      for (var y = 0; y < 6; y++) {
        setBlock(ox + x, base + y, oz - R,     BLOCK.STONE);
        setBlock(ox + x, base + y, oz - R + 1, BLOCK.STONE);
        setBlock(ox + x, base + y, oz + R,     BLOCK.STONE);
        setBlock(ox + x, base + y, oz + R - 1, BLOCK.STONE);
      }
    }
    for (var z = -R; z <= R; z++) {
      for (var wy = 0; wy < 6; wy++) {
        setBlock(ox - R,     base + wy, oz + z, BLOCK.STONE);
        setBlock(ox - R + 1, base + wy, oz + z, BLOCK.STONE);
        setBlock(ox + R,     base + wy, oz + z, BLOCK.STONE);
        setBlock(ox + R - 1, base + wy, oz + z, BLOCK.STONE);
      }
    }
    // Corner bastions: ring r=3, 8 high, with merlons on top
    var corners = [[-R, -R], [R, -R], [-R, R], [R, R]];
    for (var ci = 0; ci < corners.length; ci++) {
      var bcx = ox + corners[ci][0], bcz = oz + corners[ci][1];
      for (var by = 0; by < 8; by++) _lmRing(bcx, base + by, bcz, 3, BLOCK.STONE);
      for (var ma = 0; ma < 360; ma += 45) {
        var mrad = ma * Math.PI / 180;
        setBlock(Math.round(bcx + Math.cos(mrad) * 3), base + 8, Math.round(bcz + Math.sin(mrad) * 3), BLOCK.STONE);
      }
    }
    // Gate (S wall centre, 2W × 4H opening)
    for (var gy = 0; gy < 4; gy++) {
      setBlock(ox - 1, base + gy, oz + R,     BLOCK.AIR);
      setBlock(ox,     base + gy, oz + R,     BLOCK.AIR);
      setBlock(ox - 1, base + gy, oz + R - 1, BLOCK.AIR);
      setBlock(ox,     base + gy, oz + R - 1, BLOCK.AIR);
    }
    setBlock(ox - 1, base + 4, oz + R, BLOCK.STONE);
    setBlock(ox,     base + 4, oz + R, BLOCK.STONE);
    // Central keep: 6×6 STONE shell, 12 high
    for (var kx = -3; kx <= 2; kx++) {
      for (var kz = -3; kz <= 2; kz++) {
        for (var ky = 0; ky < 12; ky++) {
          if (kx === -3 || kx === 2 || kz === -3 || kz === 2 || ky === 0)
            setBlock(ox + kx, base + ky, oz + kz, BLOCK.STONE);
        }
      }
    }
    // Keep battlements
    for (var bx = -3; bx <= 2; bx++) {
      setBlock(ox + bx, base + 12, oz - 3, BLOCK.STONE);
      setBlock(ox + bx, base + 12, oz + 2, BLOCK.STONE);
    }
    for (var bz = -2; bz <= 1; bz++) {
      setBlock(ox - 3, base + 12, oz + bz, BLOCK.STONE);
      setBlock(ox + 2, base + 12, oz + bz, BLOCK.STONE);
    }
    setBlock(ox, base + 13, oz, BLOCK.FLAG);
    // Crumbling wall sections (age + battle damage)
    for (var wr = 3; wr <= 6; wr++) {
      setBlock(ox + wr, base + 5 - (wr - 3), oz - R, BLOCK.RUBBLE);
      setBlock(ox - wr, base + 4 - Math.floor((wr - 3) / 2), oz + R, BLOCK.RUBBLE);
    }
    _buildings.push({ kind: 'landmark_kerch_fortress', x: ox - R, z: oz - R, w: R * 2 + 1, d: R * 2 + 1, baseY: h, floorH: 6, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Belgorod WWII Memorial — eternal flame + obelisk (city-centre monument)
  function generateBelgorodMemorial(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Plaza: CONCRETE ground (12×12)
    for (var x = -6; x <= 5; x++) for (var z = -6; z <= 5; z++)
      setBlock(ox + x, h, oz + z, BLOCK.CONCRETE);
    // Obelisk (north): 2×2 CONCRETE 18 high, tapered top + Soviet star
    for (var oy = 0; oy < 18; oy++) {
      setBlock(ox - 1, base + oy, oz - 3, BLOCK.CONCRETE);
      setBlock(ox,     base + oy, oz - 3, BLOCK.CONCRETE);
      setBlock(ox - 1, base + oy, oz - 2, BLOCK.CONCRETE);
      setBlock(ox,     base + oy, oz - 2, BLOCK.CONCRETE);
    }
    setBlock(ox, base + 18, oz - 3, BLOCK.CONCRETE);
    setBlock(ox, base + 19, oz - 3, BLOCK.CONCRETE);
    setBlock(ox, base + 20, oz - 3, BLOCK.METAL);  // star finial
    // Flame pedestal (south): 4×4 × 3 CONCRETE
    for (var py = 0; py < 3; py++) {
      for (var px = -2; px <= 1; px++) for (var pz = 1; pz <= 4; pz++)
        setBlock(ox + px, base + py, oz + pz, BLOCK.CONCRETE);
    }
    // Eternal flame
    setBlock(ox - 1, base + 3, oz + 2, BLOCK.FIRE);
    setBlock(ox,     base + 3, oz + 2, BLOCK.FIRE);
    setBlock(ox - 1, base + 3, oz + 3, BLOCK.FIRE);
    setBlock(ox,     base + 3, oz + 3, BLOCK.FIRE);
    // Decorative FENCE ring around flame
    for (var fa = 0; fa < 360; fa += 30) {
      var frad = fa * Math.PI / 180;
      setBlock(Math.round(ox + Math.cos(frad) * 4), base, Math.round(oz + 2 + Math.sin(frad) * 3), BLOCK.FENCE);
    }
    _buildings.push({ kind: 'landmark_belgorod_memorial', x: ox - 6, z: oz - 6, w: 12, d: 12, baseY: h, floorH: 3, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Coal Mine Headframe — Donbas/Vuhledar kopyor (mine winding tower + spoil heap)
  function generateMineShaftTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Shaft house base: 6×6 CONCRETE shell, 4 high
    for (var sx = -3; sx <= 2; sx++) {
      for (var sz = -3; sz <= 2; sz++) {
        for (var sy = 0; sy < 4; sy++) {
          if (sx === -3 || sx === 2 || sz === -3 || sz === 2 || sy === 0)
            setBlock(ox + sx, base + sy, oz + sz, BLOCK.CONCRETE);
        }
      }
    }
    // Two A-frame METAL legs rising 18 blocks, converging at apex
    for (var ly = 0; ly < 18; ly++) {
      var lxOff = Math.round(-4 + ly * 4 / 18);
      var rxOff = Math.round(4  - ly * 4 / 18);
      setBlock(ox + lxOff, base + 4 + ly, oz,     BLOCK.METAL);
      setBlock(ox + lxOff, base + 4 + ly, oz + 1, BLOCK.METAL);
      setBlock(ox + rxOff, base + 4 + ly, oz,     BLOCK.METAL);
      setBlock(ox + rxOff, base + 4 + ly, oz + 1, BLOCK.METAL);
    }
    // Cross-bracing every 4 levels
    for (var br = 0; br < 18; br += 4) {
      var brW = Math.round(4 - br * 4 / 18);
      for (var bri = -brW; bri <= brW; bri++) setBlock(ox + bri, base + 4 + br, oz, BLOCK.METAL);
    }
    // Winding wheel at apex (METAL ring)
    _lmRing(ox, base + 22, oz, 2, BLOCK.METAL);
    setBlock(ox, base + 22, oz, BLOCK.METAL);
    // Spoil heap (RUBBLE mound to the side)
    for (var hx = -7; hx <= -3; hx++) {
      for (var hz = -2; hz <= 2; hz++) {
        var hd = (hx + 5) * (hx + 5) + hz * hz;
        if (hd <= 6) {
          var mh = Math.max(0, Math.round(3 - hd / 2));
          for (var hy = 0; hy <= mh; hy++) setBlock(ox + hx, h + hy, oz + hz, BLOCK.RUBBLE);
        }
      }
    }
    _buildings.push({ kind: 'landmark_mine_shaft', x: ox - 5, z: oz - 3, w: 10, d: 7, baseY: h, floorH: 4, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Kherson Pokrovska Cathedral — white walls, blue onion dome, bell tower
  function generateKhersonCathedral(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var bW = 6, bD = 5, bodyH = 12;
    // Main body: 13W × 11D × 12H WHITE_TILE shell
    for (var y = 0; y < bodyH; y++) {
      for (var x = -bW; x <= bW; x++) {
        for (var z = -bD; z <= bD; z++) {
          if (y === 0 || x === -bW || x === bW || z === -bD || z === bD)
            setBlock(ox + x, base + y, oz + z, BLOCK.WHITE_TILE);
        }
      }
    }
    // Roof slab
    for (var rx = -bW; rx <= bW; rx++) for (var rz = -bD; rz <= bD; rz++)
      setBlock(ox + rx, base + bodyH, oz + rz, BLOCK.WHITE_TILE);
    // Arched windows (GLASS) on N + S faces
    for (var wfl = 0; wfl < 2; wfl++) {
      for (var wx = -4; wx <= 3; wx += 3) {
        setBlock(ox + wx, base + wfl * 6 + 2, oz - bD, BLOCK.GLASS);
        setBlock(ox + wx, base + wfl * 6 + 3, oz - bD, BLOCK.GLASS);
        setBlock(ox + wx, base + wfl * 6 + 2, oz + bD, BLOCK.GLASS);
        setBlock(ox + wx, base + wfl * 6 + 3, oz + bD, BLOCK.GLASS);
      }
    }
    // Central blue onion dome
    _lmOnionDome(ox, base + bodyH, oz, 4, BLOCK.BLUE_TILE);
    // Bell tower (NW corner): 4×4 WHITE_TILE, 20 high
    var ttox = ox - bW, ttoz = oz - bD;
    for (var ty = 0; ty < 20; ty++) {
      setBlock(ttox,     base + ty, ttoz,     BLOCK.WHITE_TILE);
      setBlock(ttox + 1, base + ty, ttoz,     BLOCK.WHITE_TILE);
      setBlock(ttox,     base + ty, ttoz + 1, BLOCK.WHITE_TILE);
      setBlock(ttox + 1, base + ty, ttoz + 1, BLOCK.WHITE_TILE);
    }
    _lmOnionDome(ttox, base + 20, ttoz, 2, BLOCK.BLUE_TILE);
    // Entrance colonnade: 4 CONCRETE columns on south face
    for (var col = -3; col <= 3; col += 2) {
      for (var cy = 0; cy < 8; cy++) setBlock(ox + col, base + cy, oz + bD + 1, BLOCK.CONCRETE);
    }
    for (var ex = -4; ex <= 4; ex++) setBlock(ox + ex, base + 8, oz + bD + 1, BLOCK.CONCRETE);
    _buildings.push({ kind: 'landmark_kherson_cathedral', x: ox - bW, z: oz - bD, w: bW * 2 + 1, d: bD * 2 + 2, baseY: h, floorH: 6, floors: 2, cx: ox, cz: oz });
  }

  // LANDMARK: Kherson Fortress — 18th-century star-shaped fortification (Staryi Bazar district)
  function generateKhersonFortress(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var R = 11;
    // Perimeter curtain walls — BRICK, 5 high
    for (var wx = -R; wx <= R; wx++) {
      for (var wy = 0; wy < 5; wy++) {
        setBlock(ox + wx, base + wy, oz - R, BLOCK.BRICK);
        setBlock(ox + wx, base + wy, oz + R, BLOCK.BRICK);
      }
    }
    for (var wz = -R; wz <= R; wz++) {
      for (var wy2 = 0; wy2 < 5; wy2++) {
        setBlock(ox - R, base + wy2, oz + wz, BLOCK.BRICK);
        setBlock(ox + R, base + wy2, oz + wz, BLOCK.BRICK);
      }
    }
    // Merlons atop wall
    for (var mx = -R; mx <= R; mx += 2) {
      setBlock(ox + mx, base + 5, oz - R, BLOCK.BRICK);
      setBlock(ox + mx, base + 5, oz + R, BLOCK.BRICK);
    }
    for (var mz = -R; mz <= R; mz += 2) {
      setBlock(ox - R, base + 5, oz + mz, BLOCK.BRICK);
      setBlock(ox + R, base + 5, oz + mz, BLOCK.BRICK);
    }
    // Corner bastions — solid STONE towers, 8 high, 3×3
    var corners = [[-R, -R], [R, -R], [-R, R], [R, R]];
    for (var ci = 0; ci < corners.length; ci++) {
      for (var cy = 0; cy < 8; cy++) {
        for (var ctx = -1; ctx <= 1; ctx++) {
          for (var ctz = -1; ctz <= 1; ctz++) {
            var isEdge = Math.abs(ctx) === 1 || Math.abs(ctz) === 1;
            if (isEdge || cy === 0 || cy === 7)
              setBlock(ox + corners[ci][0] + ctx, base + cy, oz + corners[ci][1] + ctz, BLOCK.STONE);
          }
        }
      }
    }
    // South gate opening (wide enough to enter)
    for (var gy = 0; gy < 4; gy++) {
      for (var gx2 = -2; gx2 <= 2; gx2++) setBlock(ox + gx2, base + gy, oz + R, BLOCK.AIR);
    }
    // Inner ruins — rubble patches, broken walls
    _lmDisc(ox - 5, base, oz + 3, 3, BLOCK.RUBBLE);
    _lmDisc(ox + 4, base, oz - 4, 2, BLOCK.RUBBLE);
    // Central stone well
    for (var wel = 0; wel < 2; wel++) {
      setBlock(ox + 1, base + wel, oz,     BLOCK.STONE);
      setBlock(ox - 1, base + wel, oz,     BLOCK.STONE);
      setBlock(ox,     base + wel, oz + 1, BLOCK.STONE);
      setBlock(ox,     base + wel, oz - 1, BLOCK.STONE);
    }
    // Ukrainian flag at north-east tower
    setBlock(ox + R - 1, base + 9, oz - R + 1, BLOCK.FLAG);
    _buildings.push({ kind: 'landmark_kherson_fortress', x: ox - R - 1, z: oz - R - 1, w: R * 2 + 3, d: R * 2 + 3, baseY: h, floorH: 5, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Kherson Port Terminal — Dnipro river commercial port
  function generateKhersonPortTerminal(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Concrete quay wall running east–west, 3 high
    for (var qx = -14; qx <= 14; qx++) {
      for (var qy = 0; qy < 3; qy++) {
        setBlock(ox + qx, base + qy, oz,     BLOCK.CONCRETE);
        setBlock(ox + qx, base + qy, oz - 1, BLOCK.CONCRETE);
      }
    }
    // Warehouse A (east side)
    for (var ay = 0; ay < 8; ay++) {
      for (var ax = 4; ax <= 13; ax++) {
        for (var az = 2; az <= 8; az++) {
          if (ax === 4 || ax === 13 || az === 2 || az === 8)
            setBlock(ox + ax, base + ay, oz + az, BLOCK.CONCRETE);
          else if (ay === 7) setBlock(ox + ax, base + ay, oz + az, BLOCK.METAL);
        }
      }
    }
    // Warehouse B (west side)
    for (var by2 = 0; by2 < 8; by2++) {
      for (var bx3 = -13; bx3 <= -4; bx3++) {
        for (var bz3 = 2; bz3 <= 8; bz3++) {
          if (bx3 === -13 || bx3 === -4 || bz3 === 2 || bz3 === 8)
            setBlock(ox + bx3, base + by2, oz + bz3, BLOCK.CONCRETE);
          else if (by2 === 7) setBlock(ox + bx3, base + by2, oz + bz3, BLOCK.METAL);
        }
      }
    }
    // Gantry crane legs + crossbar
    for (var gl = 0; gl < 13; gl++) {
      setBlock(ox - 2, base + gl, oz - 3, BLOCK.METAL);
      setBlock(ox + 2, base + gl, oz - 3, BLOCK.METAL);
    }
    for (var gbx = -5; gbx <= 5; gbx++) setBlock(ox + gbx, base + 13, oz - 3, BLOCK.METAL);
    // Boom arm slanting up
    for (var bm2 = 0; bm2 < 5; bm2++) setBlock(ox + 5 + bm2, base + 13 + bm2, oz - 3, BLOCK.METAL);
    // Oil/grain storage silos (3 cylinders)
    for (var si = 0; si < 3; si++) {
      var six = ox - 8 + si * 8;
      for (var sy = 0; sy < 8; sy++) _lmDisc(six, base + sy, oz + 13, 3, BLOCK.CONCRETE);
    }
    _buildings.push({ kind: 'landmark_kherson_port', x: ox - 14, z: oz - 3, w: 29, d: 18, baseY: h, floorH: 8, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Snake Island Border Guard Barracks — Ukrainian garrison building
  function generateSnakeIslandBarracks(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // 2-story CONCRETE building 12×6
    for (var y = 0; y < 8; y++) {
      for (var x = -6; x <= 5; x++) {
        for (var z = -3; z <= 2; z++) {
          var isWall = x === -6 || x === 5 || z === -3 || z === 2;
          if (isWall || y === 0 || y === 4 || y === 7)
            setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
        }
      }
    }
    // Windows on north and south faces
    for (var wfl = 0; wfl < 2; wfl++) {
      for (var wx2 = -4; wx2 <= 3; wx2 += 3) {
        setBlock(ox + wx2, base + wfl * 4 + 2, oz - 3, BLOCK.GLASS);
        setBlock(ox + wx2, base + wfl * 4 + 2, oz + 2, BLOCK.GLASS);
      }
    }
    // Entrance door south face
    for (var dy = 0; dy < 3; dy++) {
      setBlock(ox - 1, base + 1 + dy, oz - 3, BLOCK.AIR);
      setBlock(ox,     base + 1 + dy, oz - 3, BLOCK.AIR);
    }
    // Rooftop satellite dish
    setBlock(ox + 3, base + 8,  oz,     BLOCK.METAL);
    setBlock(ox + 3, base + 9,  oz,     BLOCK.METAL);
    setBlock(ox + 2, base + 9,  oz,     BLOCK.METAL);
    setBlock(ox + 4, base + 9,  oz,     BLOCK.METAL);
    setBlock(ox + 3, base + 9,  oz - 1, BLOCK.METAL);
    // Ukrainian flag on roof
    setBlock(ox - 3, base + 8,  oz, BLOCK.METAL);
    setBlock(ox - 3, base + 9,  oz, BLOCK.METAL);
    setBlock(ox - 3, base + 10, oz, BLOCK.FLAG);
    // Sandbag positions around the building
    for (var sb2 = -7; sb2 <= -6; sb2++) {
      setBlock(ox + sb2, base,     oz - 4, BLOCK.DIRT);
      setBlock(ox + sb2, base + 1, oz - 4, BLOCK.DIRT);
    }
    for (var sb3 = 6; sb3 <= 7; sb3++) {
      setBlock(ox + sb3, base,     oz + 3, BLOCK.DIRT);
      setBlock(ox + sb3, base + 1, oz + 3, BLOCK.DIRT);
    }
    _buildings.push({ kind: 'landmark_snake_barracks', x: ox - 7, z: oz - 4, w: 13, d: 7, baseY: h, floorH: 4, floors: 2, cx: ox, cz: oz });
  }

  // ── MOSCOW CITY (MIBC) — modern glass skyscraper generators ──────────────

  // Helper: glass curtain-wall tower shell (columns every 4 floors, glass infill)
  function _glassShell(ox, oz, hW, hD, h0, h1) {
    for (var y = h0; y < h1; y++) {
      var isFloor = (y % 4 === 0);
      for (var x = -hW; x <= hW; x++) {
        for (var z = -hD; z <= hD; z++) {
          if (x === -hW || x === hW || z === -hD || z === hD) {
            setBlock(ox + x, y, oz + z, isFloor ? BLOCK.CONCRETE : BLOCK.GLASS);
          }
        }
      }
      setBlock(ox - hW, y, oz - hD, BLOCK.CONCRETE);
      setBlock(ox + hW, y, oz - hD, BLOCK.CONCRETE);
      setBlock(ox - hW, y, oz + hD, BLOCK.CONCRETE);
      setBlock(ox + hW, y, oz + hD, BLOCK.CONCRETE);
    }
  }

  // LANDMARK: Pripyat MsCh-126 Hospital — 3-storey Soviet hospital, iconic exclusion zone ruin
  // Famous for the basement where highly-radioactive PPE and liquidator gear was left behind
  function generatePripyatHospital(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Main building 18×10, 3 floors, PLASTER white walls
    for (var mbx = 0; mbx <= 18; mbx++) {
      for (var mbz = 0; mbz <= 10; mbz++) {
        for (var mby = 1; mby <= 12; mby++) {
          if (mbx === 0 || mbx === 18 || mbz === 0 || mbz === 10 || (mby % 4 === 0)) {
            setBlock(ox + mbx, base + mby, oz + mbz, BLOCK.PLASTER);
          }
        }
      }
    }
    // Window openings (hospital windows — 2 wide × 2 tall, regularly spaced)
    for (var wf = 0; wf < 3; wf++) {
      for (var wx2 = 3; wx2 <= 15; wx2 += 5) {
        setBlock(ox + wx2,     base + 2 + wf * 4, oz,      BLOCK.GLASS);
        setBlock(ox + wx2 + 1, base + 2 + wf * 4, oz,      BLOCK.GLASS);
        setBlock(ox + wx2,     base + 2 + wf * 4, oz + 10, BLOCK.GLASS);
        setBlock(ox + wx2 + 1, base + 2 + wf * 4, oz + 10, BLOCK.GLASS);
        setBlock(ox + wx2,     base + 3 + wf * 4, oz,      BLOCK.GLASS);
        setBlock(ox + wx2 + 1, base + 3 + wf * 4, oz,      BLOCK.GLASS);
        setBlock(ox + wx2,     base + 3 + wf * 4, oz + 10, BLOCK.GLASS);
        setBlock(ox + wx2 + 1, base + 3 + wf * 4, oz + 10, BLOCK.GLASS);
      }
    }
    // Entrance: clear 3-wide doorway on south face
    for (var ea = 7; ea <= 10; ea++) {
      setBlock(ox + ea, base + 1, oz, BLOCK.AIR);
      setBlock(ox + ea, base + 2, oz, BLOCK.AIR);
    }
    // Red cross on roof (internationally recognized medical marker)
    var ry = base + 13;
    setBlock(ox + 9, ry, oz + 5, BLOCK.LIGHT);
    for (var rci = 7; rci <= 11; rci++) setBlock(ox + rci, ry, oz + 5, BLOCK.LIGHT);
    for (var rcj = 3; rcj <= 7; rcj++) setBlock(ox + 9, ry, oz + rcj, BLOCK.LIGHT);
    // Collapsed east wing (rubble — radiation-damaged structural failure)
    for (var cbx = 15; cbx <= 18; cbx++) {
      for (var cbz = 2; cbz <= 8; cbz++) {
        if (Math.random() < 0.6) setBlock(ox + cbx, base + 1, oz + cbz, BLOCK.RUBBLE);
      }
    }
    // Hospital yard debris (radioactive PPE, stretchers abandoned in haste)
    setBlock(ox + 2,  base, oz - 2, BLOCK.RUBBLE);
    setBlock(ox + 12, base, oz - 2, BLOCK.RUBBLE);
    setBlock(ox + 6,  base, oz + 12, BLOCK.RUBBLE);
    _buildings.push({ kind: 'pripyat_hospital', x: ox, z: oz, w: 19, d: 11, baseY: h, floorH: 4, floors: 3, cx: ox + 9, cz: oz + 5 });
  }

  // LANDMARK: Bakhmut Sports Arena — local multipurpose hall repurposed as staging position
  // The Bakhmut Palace of Culture / sports complex became a tactical position during siege
  // LANDMARK: Donbas Arena — Shakhtar Donetsk's modern UEFA 5-star stadium
  // Opened 2009 for Euro 2012, 52,000 seats. Struck by Russian shells Aug 2022.
  // Distinctive: oval concrete bowl with steel canopy roof and glass panels.
  function generateDonbasArena(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var R = 12, rInner = 8;
    // Outer concourse ring — CONCRETE bowl walls, 8 blocks high
    for (var y = 0; y < 8; y++) {
      _lmRing(ox, base + y, oz, R, BLOCK.CONCRETE);
    }
    // Entrance portals on N/S/E/W — 3-wide archways (clear bottom 5 blocks)
    var portals = [[0, -R], [0, R], [-R, 0], [R, 0]];
    for (var pi = 0; pi < portals.length; pi++) {
      var pdx = portals[pi][0], pdz = portals[pi][1];
      for (var ph = 0; ph < 5; ph++) {
        setBlock(ox + pdx, base + ph, oz + pdz, BLOCK.AIR);
        if (pdz === 0) {
          setBlock(ox + pdx, base + ph, oz + pdz - 1, BLOCK.AIR);
          setBlock(ox + pdx, base + ph, oz + pdz + 1, BLOCK.AIR);
        } else {
          setBlock(ox + pdx - 1, base + ph, oz + pdz, BLOCK.AIR);
          setBlock(ox + pdx + 1, base + ph, oz + pdz, BLOCK.AIR);
        }
      }
    }
    // Seating tiers: 3 rings stepped toward centre (STONE)
    for (var tier = 0; tier < 4; tier++) {
      _lmRing(ox, base + tier * 2, oz, rInner + tier, BLOCK.STONE);
    }
    // Pitch surface (flat GRASS disc)
    _lmDisc(ox, base, oz, rInner - 1, BLOCK.GRASS);
    // Roof canopy — METAL ring at height 10, bridged by METAL beams every 30°
    _lmRing(ox, base + 10, oz, R, BLOCK.METAL);
    for (var a = 0; a < 360; a += 30) {
      var rad = a * Math.PI / 180;
      for (var rb = 8; rb <= 12; rb++) {
        var bx = Math.round(ox + Math.cos(rad) * rb);
        var bz = Math.round(oz + Math.sin(rad) * rb);
        setBlock(bx, base + 10, bz, BLOCK.METAL);
      }
      // GLASS panels between beam midpoints
      var rad2 = (a + 15) * Math.PI / 180;
      for (var rg = 9; rg <= 11; rg++) {
        setBlock(Math.round(ox + Math.cos(rad2) * rg), base + 10, Math.round(oz + Math.sin(rad2) * rg), BLOCK.GLASS);
      }
    }
    // Scoreboard towers — METAL+CONCRETE pillars at NW and SE, floodlights on top
    var towers = [[-R + 2, -R + 2], [R - 2, R - 2]];
    for (var ti = 0; ti < towers.length; ti++) {
      var tx = ox + towers[ti][0], tz = oz + towers[ti][1];
      for (var ty = 0; ty < 14; ty++) setBlock(tx, base + ty, tz, BLOCK.METAL);
      setBlock(tx, base + 14, tz, BLOCK.LIGHT);
      setBlock(tx + 1, base + 14, tz, BLOCK.LIGHT);
      setBlock(tx, base + 14, tz + 1, BLOCK.LIGHT);
    }
    // Battle damage — collapsed SE sector (Russian shells hit roof support)
    for (var da = 30; da < 90; da += 10) {
      var drad = da * Math.PI / 180;
      var dx = Math.round(ox + Math.cos(drad) * R);
      var dz = Math.round(oz + Math.sin(drad) * R);
      for (var dy = 6; dy <= 10; dy++) {
        if (Math.random() < 0.7) setBlock(dx, base + dy, dz, BLOCK.RUBBLE);
      }
    }
    for (var rc = 0; rc < 6; rc++) {
      var rdx = Math.round((Math.random() - 0.5) * 6);
      var rdz = Math.round((Math.random() - 0.5) * 6);
      setBlock(ox + R - 2 + rdx, base, oz - 2 + rdz, BLOCK.RUBBLE);
    }
    _buildings.push({ kind: 'landmark_donbas_arena', x: ox - R, z: oz - R, w: R * 2 + 1, d: R * 2 + 1, baseY: h, floorH: 5, floors: 2, cx: ox, cz: oz });
  }

  function generateBakhmutArena(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Arena main hall — wide flat CONCRETE building (16×20) with high ceiling
    for (var ax2 = 0; ax2 <= 16; ax2++) {
      for (var az2 = 0; az2 <= 20; az2++) {
        for (var ay = 1; ay <= 10; ay++) {
          if (ax2 === 0 || ax2 === 16 || az2 === 0 || az2 === 20 || ay === 10) {
            setBlock(ox + ax2, base + ay, oz + az2, BLOCK.CONCRETE);
          }
        }
      }
    }
    // Large windows on sides (arena skylighting)
    for (var wz3 = 3; wz3 <= 17; wz3 += 4) {
      for (var wy3 = 3; wy3 <= 7; wy3++) {
        setBlock(ox,      base + wy3, oz + wz3,     BLOCK.GLASS);
        setBlock(ox,      base + wy3, oz + wz3 + 1, BLOCK.GLASS);
        setBlock(ox + 16, base + wy3, oz + wz3,     BLOCK.GLASS);
        setBlock(ox + 16, base + wy3, oz + wz3 + 1, BLOCK.GLASS);
      }
    }
    // Main entrance (south face, 4 wide × 5 tall)
    for (var ea2 = 6; ea2 <= 10; ea2++) {
      for (var ey = 1; ey <= 5; ey++) setBlock(ox + ea2, base + ey, oz, BLOCK.AIR);
    }
    // Arched barrel roof (visible above the flat wall line)
    for (var aax = -1; aax <= 17; aax++) {
      var archH = Math.round(3 - (aax - 8) * (aax - 8) / 70.0);
      if (archH > 0) {
        for (var aaz = 0; aaz <= 20; aaz++) {
          setBlock(ox + aax, base + 10 + archH, oz + aaz, BLOCK.CONCRETE);
        }
      }
    }
    // Battle damage — shelled sections
    setBlock(ox + 2,  base + 6, oz + 5,  BLOCK.RUBBLE);
    setBlock(ox + 14, base + 4, oz + 15, BLOCK.RUBBLE);
    setBlock(ox + 14, base + 5, oz + 15, BLOCK.AIR);
    // Ukrainian graffiti position (window facing enemy approach)
    setBlock(ox + 16, base + 6, oz + 10, BLOCK.AIR);
    _buildings.push({ kind: 'bakhmut_arena', x: ox, z: oz, w: 17, d: 21, baseY: h, floorH: 10, floors: 1, cx: ox + 8, cz: oz + 10 });
  }

  // LANDMARK: Mercury City Tower — slim diamond-plan glass needle (tallest in MIBC)
  function generateMercuryTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var H = 55;
    // Diamond cross-section: rotated square, 4×4 diagonal footprint
    for (var y = 0; y < H; y++) {
      var taper = Math.floor(y / 14); // taper every 14 floors
      var r = Math.max(2, 4 - taper);
      var isFloor = (y % 4 === 0);
      for (var x = -r; x <= r; x++) {
        for (var z = -(r - Math.abs(x)); z <= (r - Math.abs(x)); z++) {
          if (Math.abs(x) + Math.abs(z) === r || y === 0)
            setBlock(ox + x, base + y, oz + z, isFloor ? BLOCK.CONCRETE : BLOCK.GLASS);
        }
      }
    }
    // Needle spire
    for (var s = 0; s < 6; s++) setBlock(ox, base + H + s, oz, BLOCK.METAL);
    _buildings.push({ kind: 'landmark_mercury_tower', x: ox - 4, z: oz - 4, w: 9, d: 9, baseY: h, floorH: 4, floors: 14, cx: ox, cz: oz });
  }

  // LANDMARK: Federation Towers — twin rectangular glass slabs (East + West)
  function generateFederationTowers(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // West tower: 6×4 × 50H
    _glassShell(ox - 5, oz, 3, 2, base, base + 50);
    for (var rwx = -8; rwx <= -2; rwx++) setBlock(ox + rwx, base + 50, oz, BLOCK.CONCRETE);
    setBlock(ox - 5, base + 51, oz, BLOCK.METAL); setBlock(ox - 5, base + 52, oz, BLOCK.METAL);
    // East tower: 5×3 × 52H (slightly taller)
    _glassShell(ox + 5, oz, 2, 2, base, base + 52);
    for (var rex = 3; rex <= 7; rex++) setBlock(ox + rex, base + 52, oz, BLOCK.CONCRETE);
    setBlock(ox + 5, base + 53, oz, BLOCK.METAL); setBlock(ox + 5, base + 54, oz, BLOCK.METAL);
    // Shared glass podium connecting both towers
    for (var py = 0; py < 5; py++) {
      for (var px = -8; px <= 7; px++) {
        if (px === -8 || px === 7) setBlock(ox + px, base + py, oz, BLOCK.CONCRETE);
        else if (py === 0 || py === 4) setBlock(ox + px, base + py, oz, BLOCK.CONCRETE);
        else setBlock(ox + px, base + py, oz, BLOCK.GLASS);
      }
    }
    _buildings.push({ kind: 'landmark_federation', x: ox - 8, z: oz - 2, w: 16, d: 5, baseY: h, floorH: 4, floors: 13, cx: ox, cz: oz });
  }

  // LANDMARK: OKO Tower — wide glass slab with dramatic diagonal-sliced top
  function generateOkoTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var H = 46;
    _glassShell(ox, oz, 5, 3, base, base + H);
    // Diagonal sliced top: starts full width, narrows diagonally
    for (var ds = 0; ds < 10; ds++) {
      for (var dx = -(5 - ds); dx <= (5 - ds); dx++) {
        setBlock(ox + dx, base + H + ds, oz - 3, BLOCK.GLASS);
        setBlock(ox + dx, base + H + ds, oz + 3, BLOCK.GLASS);
      }
    }
    // Roof cap
    for (var rx = -5; rx <= 5; rx++) setBlock(ox + rx, base + H, oz, BLOCK.CONCRETE);
    _buildings.push({ kind: 'landmark_oko_tower', x: ox - 5, z: oz - 3, w: 11, d: 7, baseY: h, floorH: 4, floors: 11, cx: ox, cz: oz });
  }

  // LANDMARK: Evolution Tower — twisted glass tower (rotates ~90° from base to top)
  function generateEvolutionTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var H = 44;
    for (var y = 0; y < H; y++) {
      // Offset walls gradually (1 block shift every 11 floors = 4 × 90° over full height)
      var twist = Math.floor(y / 5.5); // 0..7
      var xOff = (twist < 4) ? twist : 8 - twist; // 0→4→0 zigzag = full rotation
      var zOff = (twist < 4) ? 0 : twist - 4;      // stays 0 first half, then shifts
      var isFloor = (y % 4 === 0);
      var block = isFloor ? BLOCK.CONCRETE : BLOCK.GLASS;
      var W = 4, D = 3;
      for (var x = -W; x <= W; x++) {
        setBlock(ox + x + xOff, base + y, oz - D + zOff, block);
        setBlock(ox + x + xOff, base + y, oz + D + zOff, block);
      }
      for (var z = -D; z <= D; z++) {
        setBlock(ox - W + xOff, base + y, oz + z + zOff, block);
        setBlock(ox + W + xOff, base + y, oz + z + zOff, block);
      }
    }
    setBlock(ox + 2, base + H + 1, oz + 1, BLOCK.METAL);
    _buildings.push({ kind: 'landmark_evolution', x: ox - 4, z: oz - 3, w: 12, d: 10, baseY: h, floorH: 4, floors: 11, cx: ox, cz: oz });
  }

  // LANDMARK: Neva Towers — pair of cylindrical glass towers side by side
  function generateNevaTowers(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // South cylinder: radius 3, 42 high
    for (var sy = 0; sy < 42; sy++) {
      var isFloor = (sy % 4 === 0);
      _lmRing(ox - 5, base + sy, oz, 3, isFloor ? BLOCK.CONCRETE : BLOCK.GLASS);
    }
    _lmDisc(ox - 5, base + 42, oz, 3, BLOCK.CONCRETE);
    // North cylinder: radius 3, 38 high
    for (var ny = 0; ny < 38; ny++) {
      var isFloor2 = (ny % 4 === 0);
      _lmRing(ox + 5, base + ny, oz, 3, isFloor2 ? BLOCK.CONCRETE : BLOCK.GLASS);
    }
    _lmDisc(ox + 5, base + 38, oz, 3, BLOCK.CONCRETE);
    // Connecting sky bridge
    for (var bx = -2; bx <= 2; bx++) {
      setBlock(ox + bx, base + 30, oz, BLOCK.GLASS);
      setBlock(ox + bx, base + 31, oz, BLOCK.GLASS);
    }
    _buildings.push({ kind: 'landmark_neva_towers', x: ox - 8, z: oz - 3, w: 16, d: 6, baseY: h, floorH: 4, floors: 10, cx: ox, cz: oz });
  }

  // LANDMARK: Eurasia Tower — tapered glass needle with gold crown
  function generateEurasiaTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var H = 38;
    for (var y = 0; y < H; y++) {
      var taper = y < H / 2 ? 0 : Math.floor((y - H / 2) / 6);
      var W = Math.max(1, 4 - taper), D = Math.max(1, 3 - taper);
      var isFloor = (y % 4 === 0);
      for (var x = -W; x <= W; x++) {
        for (var z = -D; z <= D; z++) {
          if (x === -W || x === W || z === -D || z === D || y === 0)
            setBlock(ox + x, base + y, oz + z, isFloor ? BLOCK.CONCRETE : BLOCK.GLASS);
        }
      }
    }
    // Gold crown bands
    for (var cs = 0; cs < 4; cs++) setBlock(ox, base + H + cs, oz, BLOCK.METAL);
    _buildings.push({ kind: 'landmark_eurasia', x: ox - 4, z: oz - 3, w: 9, d: 7, baseY: h, floorH: 4, floors: 9, cx: ox, cz: oz });
  }

  // LANDMARK: City of Capitals — stepped glass complex (two stepped towers on shared podium)
  function generateCityOfCapitals(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Shared podium: 14×8×5 GLASS
    _glassShell(ox, oz, 7, 4, base, base + 5);
    for (var px = -7; px <= 7; px++) for (var pz = -4; pz <= 4; pz++) setBlock(ox + px, base + 5, oz + pz, BLOCK.CONCRETE);
    // East tower: 5×3 × 32H stepped at top
    _glassShell(ox + 4, oz, 2, 2, base + 5, base + 32);
    for (var ex = 2; ex <= 6; ex++) setBlock(ox + ex, base + 32, oz, BLOCK.CONCRETE);
    _glassShell(ox + 4, oz, 1, 1, base + 32, base + 40);
    // West tower: 5×3 × 28H
    _glassShell(ox - 4, oz, 2, 2, base + 5, base + 28);
    for (var wx2 = -6; wx2 <= -2; wx2++) setBlock(ox + wx2, base + 28, oz, BLOCK.CONCRETE);
    _glassShell(ox - 4, oz, 1, 1, base + 28, base + 34);
    _buildings.push({ kind: 'landmark_capital_city', x: ox - 7, z: oz - 4, w: 15, d: 9, baseY: h, floorH: 4, floors: 10, cx: ox, cz: oz });
  }

  // LANDMARK: Moscow River (Moskva) — embankment strip with blue water channel
  function generateMoskovaRiver(ox, oz, length) {
    var h = getTerrainHeight(ox, oz) || 0;
    for (var i = 0; i < length; i++) {
      // Embankment walls (STONE)
      setBlock(ox + i, h, oz,         BLOCK.STONE);
      setBlock(ox + i, h, oz + 1,     BLOCK.STONE);
      setBlock(ox + i, h, oz + 10,    BLOCK.STONE);
      setBlock(ox + i, h, oz + 11,    BLOCK.STONE);
      // River channel: BLUE_TILE
      for (var rz = 2; rz <= 9; rz++) {
        setBlock(ox + i, h - 1, oz + rz, BLOCK.BLUE_TILE);
        setBlock(ox + i, h,     oz + rz, BLOCK.BLUE_TILE);
      }
    }
  }

  // ── CITY ARCHITECTURE BATCH 6: Recognisable real-world landmark buildings ──

  // LANDMARK: Azovstal Iron & Steel Works — Mariupol's blast furnace complex
  function generateAzovsteelWorks(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Main furnace building: 16W × 10D × 10H METAL shell
    for (var y = 0; y < 10; y++) {
      for (var x = -8; x <= 7; x++) {
        for (var z = -5; z <= 4; z++) {
          if (y === 0 || x === -8 || x === 7 || z === -5 || z === 4)
            setBlock(ox + x, base + y, oz + z, BLOCK.METAL);
        }
      }
    }
    // 3 blast furnace stacks: ring shell, 20 high, FIRE top
    var furnPos = [[-5, 0], [0, 0], [5, 0]];
    for (var fi = 0; fi < furnPos.length; fi++) {
      var fx = furnPos[fi][0], fz = furnPos[fi][1];
      for (var fy = 0; fy < 20; fy++) {
        for (var fa = 0; fa < 360; fa += 90) {
          var fr = fa * Math.PI / 180;
          var fbx = Math.round(fx + Math.cos(fr)); var fbz = Math.round(fz + Math.sin(fr));
          setBlock(ox + fbx, base + 10 + fy, oz + fbz, BLOCK.BRICK);
        }
        setBlock(ox + fx - 1, base + 10 + fy, oz + fz - 1, BLOCK.BRICK);
        setBlock(ox + fx + 1, base + 10 + fy, oz + fz - 1, BLOCK.BRICK);
        setBlock(ox + fx - 1, base + 10 + fy, oz + fz + 1, BLOCK.BRICK);
        setBlock(ox + fx + 1, base + 10 + fy, oz + fz + 1, BLOCK.BRICK);
      }
      setBlock(ox + fx, base + 30, oz + fz, BLOCK.FIRE);
      _lmRing(ox + fx, base + 28, oz + fz, 2, BLOCK.CONCRETE);
    }
    // Access walkway between stacks
    for (var bx = -4; bx <= 4; bx++) setBlock(ox + bx, base + 18, oz, BLOCK.METAL);
    // Rubble / scorch at ground
    for (var rx = -9; rx <= 8; rx += 3) {
      if (Math.random() < 0.5) setBlock(ox + rx, base, oz - 6, BLOCK.RUBBLE);
    }
    _buildings.push({ kind: 'landmark_azovstal', x: ox - 8, z: oz - 5, w: 16, d: 10, baseY: h, floorH: 5, floors: 2, cx: ox, cz: oz });
  }

  // LANDMARK: Port Cargo Crane — steel gantry crane (Mariupol / Sevastopol quayside)
  function generatePortCrane(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Portal legs
    for (var cy = 0; cy < 14; cy++) {
      setBlock(ox - 5, base + cy, oz,     BLOCK.METAL);
      setBlock(ox - 5, base + cy, oz + 1, BLOCK.METAL);
      setBlock(ox + 5, base + cy, oz,     BLOCK.METAL);
      setBlock(ox + 5, base + cy, oz + 1, BLOCK.METAL);
    }
    // Top girder
    for (var gx = -6; gx <= 6; gx++) {
      setBlock(ox + gx, base + 14, oz,     BLOCK.METAL);
      setBlock(ox + gx, base + 14, oz + 1, BLOCK.METAL);
    }
    // Boom arm
    for (var bm = 0; bm <= 8; bm++) {
      setBlock(ox + 6 + bm, base + 14 + bm, oz,     BLOCK.METAL);
      setBlock(ox + 6 + bm, base + 14 + bm, oz + 1, BLOCK.METAL);
    }
    // Counterweight
    for (var cm = 0; cm <= 3; cm++) setBlock(ox - 6 - cm, base + 14 + cm, oz, BLOCK.METAL);
    // Operator cab
    for (var cby = 0; cby < 3; cby++) {
      setBlock(ox + 5, base + 11 + cby, oz,     BLOCK.GLASS);
      setBlock(ox + 5, base + 11 + cby, oz + 1, BLOCK.GLASS);
      setBlock(ox + 6, base + 11 + cby, oz,     BLOCK.GLASS);
      setBlock(ox + 6, base + 11 + cby, oz + 1, BLOCK.GLASS);
    }
    // Concrete quay
    for (var qx = -7; qx <= 7; qx++) for (var qz = -1; qz <= 2; qz++)
      setBlock(ox + qx, h, oz + qz, BLOCK.CONCRETE);
    _buildings.push({ kind: 'landmark_port_crane', x: ox - 6, z: oz - 1, w: 14, d: 4, baseY: h, floorH: 14, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Soviet Admin/City Hall — 5-floor columned facade (Mariupol/Bakhmut style)
  function generateSovietAdminBuilding(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var bW = 9, bD = 5, bH = 16;
    for (var y = 0; y < bH; y++) {
      for (var x = -bW; x <= bW; x++) {
        for (var z = -bD; z <= bD; z++) {
          if (y === 0 || x === -bW || x === bW || z === -bD || z === bD)
            setBlock(ox + x, base + y, oz + z, BLOCK.PLASTER);
        }
      }
    }
    // Floor ledges
    for (var fl = 4; fl < bH; fl += 4) {
      for (var flx = -bW - 1; flx <= bW + 1; flx++) setBlock(ox + flx, base + fl, oz - bD, BLOCK.CONCRETE);
    }
    // South colonnade
    for (var col = -6; col <= 6; col += 3) {
      for (var coly = 1; coly < 8; coly++) setBlock(ox + col, base + coly, oz + bD + 1, BLOCK.CONCRETE);
    }
    for (var entx = -7; entx <= 7; entx++) setBlock(ox + entx, base + 8, oz + bD + 1, BLOCK.CONCRETE);
    // Windows
    for (var wfl = 0; wfl < 3; wfl++) {
      for (var wx = -7; wx <= 7; wx += 3) {
        setBlock(ox + wx, base + wfl * 4 + 2, oz + bD, BLOCK.GLASS);
        setBlock(ox + wx, base + wfl * 4 + 3, oz + bD, BLOCK.GLASS);
      }
    }
    // Entrance opening
    for (var ey = 1; ey <= 3; ey++) {
      setBlock(ox - 1, base + ey, oz + bD, BLOCK.AIR);
      setBlock(ox,     base + ey, oz + bD, BLOCK.AIR);
    }
    // Roof flag
    setBlock(ox, base + bH + 1, oz, BLOCK.FLAG);
    _buildings.push({ kind: 'landmark_soviet_admin', x: ox - bW, z: oz - bD, w: bW * 2 + 1, d: bD * 2 + 1, baseY: h, floorH: 4, floors: 4, cx: ox, cz: oz });
  }

  // LANDMARK: Airport Control Tower — slim tower with glass cab (Hostomel/Saky style)
  function generateAirportControlTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Base building: 8×6×4 CONCRETE
    for (var by = 0; by < 4; by++) {
      for (var bx = -4; bx <= 3; bx++) for (var bz = -3; bz <= 2; bz++) {
        if (by === 0 || bx === -4 || bx === 3 || bz === -3 || bz === 2)
          setBlock(ox + bx, base + by, oz + bz, BLOCK.CONCRETE);
      }
    }
    // Shaft: 2×2 CONCRETE, 20 high
    for (var sy = 1; sy < 22; sy++) {
      setBlock(ox - 1, base + sy, oz - 1, BLOCK.CONCRETE);
      setBlock(ox,     base + sy, oz - 1, BLOCK.CONCRETE);
      setBlock(ox - 1, base + sy, oz,     BLOCK.CONCRETE);
      setBlock(ox,     base + sy, oz,     BLOCK.CONCRETE);
    }
    // Observation deck ring
    for (var dx = -3; dx <= 2; dx++) {
      setBlock(ox + dx, base + 22, oz - 3, BLOCK.CONCRETE);
      setBlock(ox + dx, base + 22, oz + 2, BLOCK.CONCRETE);
    }
    for (var dz = -2; dz <= 1; dz++) {
      setBlock(ox - 3, base + 22, oz + dz, BLOCK.CONCRETE);
      setBlock(ox + 2, base + 22, oz + dz, BLOCK.CONCRETE);
    }
    // Glass cab: 4×4×4
    for (var cy = 0; cy < 4; cy++) {
      for (var ccx = -2; ccx <= 1; ccx++) for (var ccz = -2; ccz <= 1; ccz++) {
        if (ccx === -2 || ccx === 1 || ccz === -2 || ccz === 1 || cy === 0 || cy === 3)
          setBlock(ox + ccx, base + 22 + cy, oz + ccz, BLOCK.GLASS);
      }
    }
    // Antenna mast
    for (var am = 0; am < 6; am++) setBlock(ox, base + 26 + am, oz, BLOCK.METAL);
    _buildings.push({ kind: 'landmark_control_tower', x: ox - 4, z: oz - 3, w: 8, d: 6, baseY: h, floorH: 10, floors: 3, cx: ox, cz: oz });
  }

  // LANDMARK: Aircraft Hangar — giant sliding-door hangar (Hostomel/Antonov style)
  function generateAircraftHangar(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var hW = 15, hD = 10, hH = 12;
    for (var y = 0; y < hH; y++) {
      for (var x = -hW; x <= hW; x++) {
        for (var z = -hD; z <= hD; z++) {
          if (y === 0) setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
          else if (x === -hW || x === hW || z === hD) setBlock(ox + x, base + y, oz + z, BLOCK.METAL);
          else if (z === -hD && (x % 5 === 0 || y === 0 || y === hH - 1))
            setBlock(ox + x, base + y, oz + z, BLOCK.METAL);
          else if (z === -hD && y > 2 && y < hH - 1 && x % 5 !== 0)
            setBlock(ox + x, base + y, oz + z, BLOCK.GLASS);
        }
      }
    }
    // Barrel-vault roof
    for (var ay = 0; ay < 5; ay++) {
      for (var ax = -hW; ax <= hW; ax++) {
        setBlock(ox + ax, base + hH + ay, oz - hD + ay, BLOCK.METAL);
        setBlock(ox + ax, base + hH + ay, oz + hD - ay, BLOCK.METAL);
      }
    }
    _buildings.push({ kind: 'landmark_aircraft_hangar', x: ox - hW, z: oz - hD, w: hW * 2 + 1, d: hD * 2 + 1, baseY: h, floorH: hH, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Cargo / Freight Terminal — airport/port warehouse with loading bays
  function generateCargoTerminal(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var wW = 12, wD = 4, wH = 8;
    for (var y = 0; y < wH; y++) {
      for (var x = -wW; x <= wW; x++) {
        for (var z = -wD; z <= wD; z++) {
          if (y === 0) setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
          else if (x === -wW || x === wW || z === wD) setBlock(ox + x, base + y, oz + z, BLOCK.METAL);
          else if (z === -wD && (x % 6 === 0 || y === 0 || y === wH - 1))
            setBlock(ox + x, base + y, oz + z, BLOCK.METAL);
        }
      }
    }
    // Loading bays (4 openings on N face)
    for (var bay = -9; bay <= 9; bay += 6) {
      for (var bh = 1; bh < 5; bh++) {
        setBlock(ox + bay - 1, base + bh, oz - wD, BLOCK.AIR);
        setBlock(ox + bay,     base + bh, oz - wD, BLOCK.AIR);
        setBlock(ox + bay + 1, base + bh, oz - wD, BLOCK.AIR);
      }
    }
    // Gable roof
    for (var gy = 0; gy < 4; gy++) {
      var gw = wW - gy;
      for (var gx = -gw; gx <= gw; gx++) {
        setBlock(ox + gx, base + wH + gy, oz - wD + gy, BLOCK.METAL);
        setBlock(ox + gx, base + wH + gy, oz + wD - gy, BLOCK.METAL);
      }
    }
    _buildings.push({ kind: 'landmark_cargo_terminal', x: ox - wW, z: oz - wD, w: wW * 2 + 1, d: wD * 2 + 1, baseY: h, floorH: wH, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Oil Refinery Distillation Column — tall column + pipe rack + flare
  function generateRefineryDistillationTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Main column: 2×2 METAL, 32 high with white safety bands
    for (var ty = 0; ty < 32; ty++) {
      var colBlock = (ty % 8 === 0) ? BLOCK.WHITE_TILE : BLOCK.METAL;
      setBlock(ox - 1, base + ty, oz - 1, colBlock);
      setBlock(ox,     base + ty, oz - 1, colBlock);
      setBlock(ox - 1, base + ty, oz,     colBlock);
      setBlock(ox,     base + ty, oz,     colBlock);
    }
    // Pipe rack: METAL running north
    for (var pz = 2; pz <= 8; pz++) {
      setBlock(ox - 1, base + 8, oz + pz, BLOCK.METAL);
      setBlock(ox,     base + 8, oz + pz, BLOCK.METAL);
    }
    // Support columns for pipe rack
    for (var scz = 2; scz <= 8; scz += 3) {
      for (var scy = 0; scy < 8; scy++) setBlock(ox - 1, base + scy, oz + scz, BLOCK.METAL);
    }
    // Heat-exchanger drums (offset)
    for (var dr = 0; dr < 3; dr++) {
      for (var dz = 0; dz < 4; dz++) setBlock(ox + 3, base + dr * 2, oz + dz, BLOCK.METAL);
    }
    // Flare stack
    for (var fly = 0; fly < 28; fly++) setBlock(ox + 7, base + fly, oz, BLOCK.METAL);
    setBlock(ox + 7, base + 28, oz, BLOCK.FIRE);
    // Concrete berm
    for (var bex = -2; bex <= 2; bex++) for (var bez = -2; bez <= 2; bez++)
      setBlock(ox + bex, h, oz + bez, BLOCK.CONCRETE);
    _buildings.push({ kind: 'landmark_refinery_tower', x: ox - 2, z: oz - 2, w: 12, d: 12, baseY: h, floorH: 8, floors: 4, cx: ox, cz: oz });
  }

  // LANDMARK: Spherical LPG Storage Tank — large ball-shaped petroleum vessel
  function generateRefinerySphere(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var R = 6;
    for (var sy = -R; sy <= R; sy++) {
      var sr = Math.round(Math.sqrt(R * R - sy * sy));
      _lmDisc(ox, h + 1 + R + sy, oz, sr, BLOCK.METAL);
    }
    // 4 support legs
    for (var ly = 0; ly < R; ly++) {
      setBlock(ox - 4, h + 1 + ly, oz - 4, BLOCK.CONCRETE);
      setBlock(ox + 4, h + 1 + ly, oz - 4, BLOCK.CONCRETE);
      setBlock(ox - 4, h + 1 + ly, oz + 4, BLOCK.CONCRETE);
      setBlock(ox + 4, h + 1 + ly, oz + 4, BLOCK.CONCRETE);
    }
    _buildings.push({ kind: 'landmark_refinery_sphere', x: ox - R - 1, z: oz - R - 1, w: R * 2 + 2, d: R * 2 + 2, baseY: h, floorH: R * 2, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Cooling Tower — hyperbolic concrete cooling tower (Chornobyl / refinery)
  function generateCoolingTower(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var towerH = 28;
    for (var ty = 0; ty < towerH; ty++) {
      var tr = Math.round(8 + (ty < towerH / 2 ? (towerH / 2 - ty) * 0.25 : (ty - towerH / 2) * 0.1));
      _lmRing(ox, h + 1 + ty, oz, tr, BLOCK.CONCRETE);
    }
    // Steam plume (GLASS = mist effect)
    for (var sm = 0; sm < 3; sm++) _lmDisc(ox, h + 1 + towerH + sm, oz, 5 - sm, BLOCK.GLASS);
    _buildings.push({ kind: 'landmark_cooling_tower', x: ox - 10, z: oz - 10, w: 20, d: 20, baseY: h, floorH: towerH, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Bakhmut Hotel — 7-floor Soviet-era concrete hotel (partially collapsed)
  function generateBakhmutHotel(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var bW = 7, bD = 4, bH = 20;
    for (var y = 0; y < bH; y++) {
      for (var x = -bW; x <= bW; x++) {
        for (var z = -bD; z <= bD; z++) {
          if (y === 0 || x === -bW || x === bW || z === -bD || z === bD)
            setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
        }
      }
    }
    // Balconies on S face
    for (var bfl = 3; bfl < bH; bfl += 3) {
      for (var bbx = -5; bbx <= 5; bbx++) setBlock(ox + bbx, base + bfl, oz + bD + 1, BLOCK.CONCRETE);
    }
    // Windows
    for (var wfl = 0; wfl < 6; wfl++) {
      for (var wx = -5; wx <= 5; wx += 3) {
        setBlock(ox + wx, base + wfl * 3 + 1, oz + bD, BLOCK.GLASS);
        setBlock(ox + wx, base + wfl * 3 + 2, oz + bD, BLOCK.GLASS);
      }
    }
    // Partial collapse on NW corner
    for (var dy = bH - 6; dy < bH; dy++) {
      for (var ddx = -bW; ddx <= -bW + 2; ddx++) {
        setBlock(ox + ddx, base + dy, oz - bD, Math.random() < 0.4 ? BLOCK.RUBBLE : BLOCK.AIR);
      }
    }
    _buildings.push({ kind: 'landmark_bakhmut_hotel', x: ox - bW, z: oz - bD, w: bW * 2 + 1, d: bD * 2 + 1, baseY: h, floorH: 3, floors: 7, cx: ox, cz: oz });
  }

  // LANDMARK: Saky Airbase — control tower, revetment, explosion craters (Aug 2022 strike)
  function generateSakyAirbase(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Tower: 3×3 CONCRETE, 16 high
    for (var ty = 0; ty < 16; ty++) {
      for (var tx = -1; tx <= 1; tx++) for (var tz = -1; tz <= 1; tz++)
        setBlock(ox + tx, base + ty, oz + tz, BLOCK.CONCRETE);
    }
    // Glass cab
    for (var cy = 0; cy < 3; cy++) {
      for (var ccx = -2; ccx <= 2; ccx++) for (var ccz = -2; ccz <= 2; ccz++) {
        if (ccx === -2 || ccx === 2 || ccz === -2 || ccz === 2 || cy === 0)
          setBlock(ox + ccx, base + 16 + cy, oz + ccz, BLOCK.GLASS);
      }
    }
    _lmDisc(ox, base + 20, oz, 2, BLOCK.METAL);
    // Revetment: U-shaped CONCRETE walls
    for (var ry = 0; ry < 8; ry++) {
      for (var rrz = 0; rrz < 10; rrz++) {
        setBlock(ox + 12,     base + ry, oz - 8 + rrz, BLOCK.CONCRETE);
        setBlock(ox + 12 + 9, base + ry, oz - 8 + rrz, BLOCK.CONCRETE);
      }
      for (var rrx = 0; rrx < 10; rrx++)
        setBlock(ox + 12 + rrx, base + ry, oz - 8, BLOCK.CONCRETE);
    }
    // Explosion craters (Ukraine's August 2022 strike on Saky)
    var craters = [[-8, 10], [5, 14], [-5, 20], [10, 5]];
    for (var ci = 0; ci < craters.length; ci++) {
      _lmDisc(ox + craters[ci][0], h, oz + craters[ci][1], 3, BLOCK.RUBBLE);
      setBlock(ox + craters[ci][0], h + 1, oz + craters[ci][1], BLOCK.FIRE);
    }
    _buildings.push({ kind: 'landmark_saky_airbase', x: ox - 3, z: oz - 10, w: 25, d: 30, baseY: h, floorH: 8, floors: 2, cx: ox, cz: oz });
  }

  // LANDMARK: Antonov Production Hall — where AN-124 / AN-225 were built
  function generateAntonovFactory(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var fW = 18, fD = 12, fH = 14;
    for (var y = 0; y < fH; y++) {
      for (var x = -fW; x <= fW; x++) {
        for (var z = -fD; z <= fD; z++) {
          if (y === 0) setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
          else if (x === -fW || x === fW) setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
          else if (z === -fD || z === fD) {
            if (x % 6 === 0 || y === 0 || y === fH - 1) setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
            else if (y > 2 && y < fH - 1) setBlock(ox + x, base + y, oz + z, BLOCK.GLASS);
          }
        }
      }
    }
    // Overhead crane rails
    for (var crx = -fW; crx <= fW; crx++) {
      setBlock(ox + crx, base + fH - 1, oz - fD + 3, BLOCK.METAL);
      setBlock(ox + crx, base + fH - 1, oz + fD - 3, BLOCK.METAL);
    }
    // Sawtooth roof
    for (var ry = 0; ry < 4; ry++) {
      for (var rrx = -fW; rrx <= fW; rrx++) {
        setBlock(ox + rrx, base + fH + ry, oz - fD + ry * 3,     BLOCK.METAL);
        setBlock(ox + rrx, base + fH + ry, oz - fD + ry * 3 + 1, BLOCK.GLASS);
        setBlock(ox + rrx, base + fH + ry, oz - fD + ry * 3 + 2, BLOCK.GLASS);
      }
    }
    // Large east door opening (10H × 12W)
    for (var dy = 1; dy < 10; dy++) for (var ddz = -6; ddz <= 6; ddz++)
      setBlock(ox + fW, base + dy, oz + ddz, BLOCK.AIR);
    // Antonov FLAG
    setBlock(ox, base + fH + 4, oz - fD - 1, BLOCK.FLAG);
    _buildings.push({ kind: 'landmark_antonov_factory', x: ox - fW, z: oz - fD, w: fW * 2 + 1, d: fD * 2 + 1, baseY: h, floorH: fH, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Sevastopol "Monument to the Sunken Ships" — Corinthian column in bay
  function generateSevastopolMonument(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    _lmDisc(ox, h, oz, 5, BLOCK.STONE);
    // 4 plinths
    for (var pa = 0; pa < 4; pa++) {
      var prad = pa * Math.PI / 2;
      var ppx = Math.round(ox + Math.cos(prad) * 3);
      var ppz = Math.round(oz + Math.sin(prad) * 3);
      setBlock(ppx, base,     ppz, BLOCK.CONCRETE);
      setBlock(ppx, base + 1, ppz, BLOCK.CONCRETE);
    }
    // Column: 2×2 PLASTER, 16 high
    for (var coly = 0; coly < 16; coly++) {
      setBlock(ox - 1, base + coly, oz - 1, BLOCK.PLASTER);
      setBlock(ox,     base + coly, oz - 1, BLOCK.PLASTER);
      setBlock(ox - 1, base + coly, oz,     BLOCK.PLASTER);
      setBlock(ox,     base + coly, oz,     BLOCK.PLASTER);
    }
    // Capital (wider)
    for (var capx = -2; capx <= 1; capx++) for (var capz = -2; capz <= 1; capz++)
      setBlock(ox + capx, base + 16, oz + capz, BLOCK.PLASTER);
    // Eagle finial (METAL)
    _lmDisc(ox, base + 18, oz, 2, BLOCK.METAL);
    setBlock(ox, base + 19, oz, BLOCK.METAL);
    // Chain fence perimeter
    for (var cf = 0; cf < 360; cf += 30) {
      var cfrad = cf * Math.PI / 180;
      setBlock(Math.round(ox + Math.cos(cfrad) * 6), base, Math.round(oz + Math.sin(cfrad) * 6), BLOCK.FENCE);
    }
    _buildings.push({ kind: 'landmark_sevastopol_monument', x: ox - 6, z: oz - 6, w: 12, d: 12, baseY: h, floorH: 18, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Snake Island Fort — ancient fortification (Ottoman/Russian ruins on Zmiiny Island)
  function generateSnakeIslandFort(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var wR = 8;
    // Curtain walls
    for (var wy = 0; wy < 5; wy++) {
      for (var wwx = -wR; wwx <= wR; wwx++) {
        setBlock(ox + wwx, base + wy, oz - wR, BLOCK.STONE);
        setBlock(ox + wwx, base + wy, oz + wR, BLOCK.STONE);
        setBlock(ox - wR, base + wy, oz + wwx, BLOCK.STONE);
        setBlock(ox + wR, base + wy, oz + wwx, BLOCK.STONE);
      }
    }
    // Merlons
    for (var mx = -wR; mx <= wR; mx += 2) {
      setBlock(ox + mx, base + 5, oz - wR, BLOCK.STONE);
      setBlock(ox + mx, base + 5, oz + wR, BLOCK.STONE);
      setBlock(ox - wR, base + 5, oz + mx, BLOCK.STONE);
      setBlock(ox + wR, base + 5, oz + mx, BLOCK.STONE);
    }
    // Corner bastions
    var corners = [[-wR, -wR], [wR, -wR], [-wR, wR], [wR, wR]];
    for (var ci = 0; ci < corners.length; ci++) {
      for (var bty = 0; bty < 7; bty++) {
        for (var btx = -1; btx <= 1; btx++) for (var btz = -1; btz <= 1; btz++)
          setBlock(ox + corners[ci][0] + btx, base + bty, oz + corners[ci][1] + btz, BLOCK.STONE);
      }
    }
    // Central gun battery
    for (var gx = -4; gx <= 3; gx++) for (var gz = -4; gz <= 3; gz++) {
      setBlock(ox + gx, base,     oz + gz, BLOCK.CONCRETE);
      setBlock(ox + gx, base + 1, oz + gz, BLOCK.CONCRETE);
    }
    // NE lighthouse tower: BRICK, 12 high
    for (var lty = 0; lty < 12; lty++) {
      setBlock(ox + wR,     base + lty, oz - wR,     BLOCK.BRICK);
      setBlock(ox + wR + 1, base + lty, oz - wR,     BLOCK.BRICK);
      setBlock(ox + wR,     base + lty, oz - wR + 1, BLOCK.BRICK);
    }
    setBlock(ox + wR, base + 13, oz - wR, BLOCK.FLAG);
    // Rubble (fortress in ruins)
    _lmDisc(ox + 4, base, oz - 3, 2, BLOCK.RUBBLE);
    _lmDisc(ox - 5, base, oz + 5, 2, BLOCK.RUBBLE);
    _buildings.push({ kind: 'landmark_snake_fort', x: ox - wR - 1, z: oz - wR - 1, w: wR * 2 + 3, d: wR * 2 + 3, baseY: h, floorH: 5, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Soviet-era train station — large stone terminus building + platform canopy
  function generateTrainStation(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var bW = 10, bD = 6, bH = 10;
    // Main building shell
    for (var y = 0; y < bH; y++) {
      for (var x = -bW; x <= bW; x++) {
        for (var z = -bD; z <= bD; z++) {
          if (y === 0) setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
          else if (x === -bW || x === bW || z === -bD || z === bD || y === bH - 1)
            setBlock(ox + x, base + y, oz + z, BLOCK.PLASTER);
        }
      }
    }
    // Arched windows on south facade (z = -bD)
    for (var wx = -bW + 2; wx <= bW - 2; wx += 3) {
      for (var wy = 1; wy <= 6; wy++) setBlock(ox + wx, base + wy, oz - bD, BLOCK.GLASS);
    }
    // Facade columns (pilasters) on south face
    for (var col = -bW; col <= bW; col += 4) {
      for (var cy = 1; cy < bH; cy++) setBlock(ox + col, base + cy, oz - bD - 1, BLOCK.PLASTER);
      setBlock(ox + col, base + bH, oz - bD - 1, BLOCK.PLASTER);
    }
    // Central clock tower (5W × 5D × 6H above main roof)
    for (var ty = 0; ty < 7; ty++) {
      for (var tx = -2; tx <= 2; tx++) for (var tz = -2; tz <= 2; tz++) {
        if (tx === -2 || tx === 2 || tz === -2 || tz === 2) setBlock(ox + tx, base + bH + ty, oz + tz, BLOCK.PLASTER);
      }
    }
    // Clock face glass on all four tower sides
    setBlock(ox, base + bH + 3, oz - 3, BLOCK.GLASS);
    setBlock(ox, base + bH + 3, oz + 3, BLOCK.GLASS);
    setBlock(ox - 3, base + bH + 3, oz, BLOCK.GLASS);
    setBlock(ox + 3, base + bH + 3, oz, BLOCK.GLASS);
    setBlock(ox, base + bH + 8, oz, BLOCK.FLAG);
    // Platform surface (STONE) north of building
    for (var ppx = -bW + 1; ppx < bW; ppx++) {
      for (var ppz = bD + 1; ppz <= bD + 8; ppz++) {
        setBlock(ox + ppx, base, oz + ppz, BLOCK.STONE);
      }
    }
    // Platform canopy (METAL roof over platform)
    for (var px = -bW; px <= bW; px++) {
      for (var pz = bD; pz <= bD + 9; pz++) {
        if (px === -bW || px === bW || pz === bD + 9) setBlock(ox + px, base + bH, oz + pz, BLOCK.METAL);
      }
    }
    // Support pillars for platform canopy
    for (var sp = -bW + 2; sp <= bW - 2; sp += 4) {
      setBlock(ox + sp, base + bH - 1, oz + bD + 9, BLOCK.METAL);
    }
    // Entrance steps
    for (var sx = -4; sx <= 4; sx++) {
      setBlock(ox + sx, base,     oz - bD - 1, BLOCK.STONE);
      setBlock(ox + sx, base - 1, oz - bD - 2, BLOCK.STONE);
    }
    _buildings.push({ kind: 'landmark_train_station', x: ox - bW, z: oz - bD, w: bW * 2 + 1, d: bD + 10, baseY: h, floorH: bH, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Coal washing plant — mine processing facility with conveyor tower + settling pond
  function generateCoalWashingPlant(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var hW = 8, hD = 5, hH = 12;
    // Main washing hall (METAL-frame shed)
    for (var y = 0; y < hH; y++) {
      for (var x = -hW; x <= hW; x++) {
        for (var z = -hD; z <= hD; z++) {
          if (y === 0) setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
          else if (x === -hW || x === hW || z === -hD || z === hD || y === hH - 1)
            setBlock(ox + x, base + y, oz + z, BLOCK.METAL);
          else if ((x === -hW + 3 || x === hW - 3) && y < hH - 1)
            setBlock(ox + x, base + y, oz + z === oz - hD || z === hD ? BLOCK.METAL : BLOCK.AIR, BLOCK.AIR);
        }
      }
    }
    // Elevated conveyor tower (east of hall)
    for (var ty = 0; ty < 20; ty++) {
      setBlock(ox + hW + 2, base + ty, oz, BLOCK.METAL);
      setBlock(ox + hW + 3, base + ty, oz, BLOCK.METAL);
    }
    // Slanted conveyor gallery from ground to tower top
    for (var ci = 0; ci < 14; ci++) {
      setBlock(ox + hW - ci, base + Math.floor(ci * 14 / 13), oz + 1, BLOCK.METAL);
    }
    // Settling pond (BLUE_TILE) south of hall
    for (var px = -4; px <= 4; px++) {
      for (var pz = hD + 2; pz <= hD + 6; pz++) {
        setBlock(ox + px, base, oz + pz, BLOCK.BLUE_TILE);
      }
    }
    // Hopper bins on top of main hall
    for (var hi = -1; hi <= 1; hi++) {
      _lmDisc(ox + hi * 5, base + hH, oz, 2, BLOCK.CONCRETE);
      setBlock(ox + hi * 5, base + hH + 1, oz, BLOCK.STONE);
    }
    _buildings.push({ kind: 'landmark_coal_plant', x: ox - hW, z: oz - hD, w: hW * 2 + 4, d: hD * 2 + 7, baseY: h, floorH: hH, floors: 1, cx: ox, cz: oz });
  }

  // LANDMARK: Soviet school — 3-story PLASTER school with colonnaded entrance and window strips
  function generateSovietSchool(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var bW = 9, bD = 4, bH = 9;
    // Main structure
    for (var y = 0; y < bH; y++) {
      for (var x = -bW; x <= bW; x++) {
        for (var z = -bD; z <= bD; z++) {
          if (y === 0) { setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE); continue; }
          var isEdge = (x === -bW || x === bW || z === -bD || z === bD || y === bH - 1);
          if (isEdge) {
            var isWindow = (z === -bD || z === bD) && y > 0 && y < bH - 1 && Math.abs(x) % 3 !== 0;
            setBlock(ox + x, base + y, oz + z, isWindow ? BLOCK.GLASS : BLOCK.PLASTER);
          }
        }
      }
    }
    // Entrance portico (south face projecting columns)
    for (var ey = 0; ey < 5; ey++) {
      for (var ex = -3; ex <= 3; ex++) {
        if (ex === -3 || ex === 0 || ex === 3 || ey === 4)
          setBlock(ox + ex, base + ey, oz - bD - 1, BLOCK.PLASTER);
      }
    }
    // Steps
    for (var sx = -3; sx <= 3; sx++) {
      setBlock(ox + sx, base,     oz - bD - 2, BLOCK.STONE);
      setBlock(ox + sx, base - 1, oz - bD - 3, BLOCK.STONE);
    }
    setBlock(ox, base + bH, oz - bD, BLOCK.FLAG);
    _buildings.push({ kind: 'landmark_soviet_school', x: ox - bW, z: oz - bD - 1, w: bW * 2 + 1, d: bD * 2 + 2, baseY: h, floorH: 3, floors: 3, cx: ox, cz: oz });
  }

  // LANDMARK: Naval barracks — 2-story CONCRETE barracks block with parade ground
  function generateNavalBarracks(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var bW = 8, bD = 4, bH = 7;
    // Building
    for (var y = 0; y < bH; y++) {
      for (var x = -bW; x <= bW; x++) {
        for (var z = -bD; z <= bD; z++) {
          if (y === 0) { setBlock(ox + x, base, oz + z, BLOCK.CONCRETE); continue; }
          var isEdge = x === -bW || x === bW || z === -bD || z === bD || y === bH - 1 || y === Math.floor(bH / 2);
          if (isEdge) setBlock(ox + x, base + y, oz + z, BLOCK.CONCRETE);
        }
      }
    }
    // Alternating windows on long facades
    for (var wy = 1; wy < bH - 1; wy++) {
      for (var wx = -bW + 2; wx < bW - 1; wx += 3) {
        setBlock(ox + wx, base + wy, oz + bD, BLOCK.GLASS);
        setBlock(ox + wx, base + wy, oz - bD, BLOCK.GLASS);
      }
    }
    // Parade ground (BLUE_TILE in front)
    for (var px = -bW; px <= bW; px++) {
      for (var pz = bD + 1; pz <= bD + 7; pz++) {
        setBlock(ox + px, base, oz + pz, BLOCK.BLUE_TILE);
      }
    }
    // Flagpole
    for (var fp = 1; fp <= 5; fp++) setBlock(ox, base + bH + fp, oz + bD + 4, BLOCK.METAL);
    setBlock(ox, base + bH + 6, oz + bD + 4, BLOCK.FLAG);
    _buildings.push({ kind: 'landmark_naval_barracks', x: ox - bW, z: oz - bD, w: bW * 2 + 1, d: bD + 8, baseY: h, floorH: Math.floor(bH / 2), floors: 2, cx: ox, cz: oz });
  }

  // LANDMARK: Submarine dry dock — reinforced concrete pen with BLUE_TILE water lane + overhead gantry
  function generateSubmarineDock(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var dLen = 16, dW = 4, dH = 8;
    // Side walls
    for (var y = 0; y < dH; y++) {
      for (var i = -dLen; i <= dLen; i++) {
        setBlock(ox + i, base + y, oz - dW, BLOCK.CONCRETE);
        setBlock(ox + i, base + y, oz + dW, BLOCK.CONCRETE);
      }
    }
    // Back wall (west end)
    for (var bky = 0; bky < dH; bky++) {
      for (var bkz = -dW; bkz <= dW; bkz++) {
        setBlock(ox - dLen, base + bky, oz + bkz, BLOCK.CONCRETE);
      }
    }
    // Water lane floor (BLUE_TILE)
    for (var wi = -dLen + 1; wi <= dLen; wi++) {
      for (var ww = -dW + 1; ww <= dW - 1; ww++) {
        setBlock(ox + wi, base, oz + ww, BLOCK.BLUE_TILE);
      }
    }
    // Overhead gantry rails + crane trolleys
    for (var gi = -dLen; gi <= dLen; gi++) {
      setBlock(ox + gi, base + dH, oz - dW, BLOCK.METAL);
      setBlock(ox + gi, base + dH, oz + dW, BLOCK.METAL);
      if (gi % 6 === 0) {
        setBlock(ox + gi, base + dH, oz - 1, BLOCK.METAL);
        setBlock(ox + gi, base + dH, oz,     BLOCK.METAL);
        setBlock(ox + gi, base + dH, oz + 1, BLOCK.METAL);
      }
    }
    // Concrete dock edge lip
    for (var li = -dLen; li <= dLen; li++) {
      setBlock(ox + li, base + 1, oz - dW - 1, BLOCK.CONCRETE);
      setBlock(ox + li, base + 1, oz + dW + 1, BLOCK.CONCRETE);
    }
    _buildings.push({ kind: 'landmark_submarine_dock', x: ox - dLen, z: oz - dW - 1, w: dLen * 2 + 1, d: dW * 2 + 3, baseY: h, floorH: dH, floors: 1, cx: ox, cz: oz });
  }

  // IDEA 3: Railway tracks
  function generateRailway(startX, startZ, length, horizontal) {
    for (let i = 0; i < length; i++) {
      const wx = horizontal ? startX + i : startX;
      const wz = horizontal ? startZ : startZ + i;
      const h = getTerrainHeight(wx, wz);
      // Rail bed (stone)
      for (let w = -1; w <= 1; w++) {
        const rx = horizontal ? wx : wx + w;
        const rz = horizontal ? wz + w : wz;
        setBlock(rx, h, rz, BLOCK.STONE);
      }
      // Rails (metal on top)
      if (i % 2 === 0) {
        const r1x = horizontal ? wx : wx - 1;
        const r1z = horizontal ? wz - 1 : wz;
        const r2x = horizontal ? wx : wx + 1;
        const r2z = horizontal ? wz + 1 : wz;
        setBlock(r1x, h + 1, r1z, BLOCK.METAL);
        setBlock(r2x, h + 1, r2z, BLOCK.METAL);
      }
      // Sleepers (wood crossbars every 3 blocks)
      if (i % 3 === 0) {
        for (let w = -1; w <= 1; w++) {
          const sx = horizontal ? wx : wx + w;
          const sz = horizontal ? wz + w : wz;
          setBlock(sx, h + 1, sz, BLOCK.WOOD);
        }
      }
    }
  }

  // IDEA 4: Destroyed vehicles as cover
  function generateDestroyedVehicles(count) {
    for (let v = 0; v < count; v++) {
      const vx = randInWorld();
      const vz = randInWorld();
      const h = getTerrainHeight(vx, vz);
      if (h <= 1) continue;
      const r = Math.random();
      if (r < 0.30)      generateWreckedTank(vx, vz);
      else if (r < 0.50) generateWreckedAPC(vx, vz);
      else if (r < 0.70) generateWreckedCar(vx, vz);
      else if (r < 0.85) generateWreckedTruck(vx, vz);
      else if (r < 0.95) generateWreckedBus(vx, vz);
      else               generateWreckedAmbulance(vx, vz);
    }
  }

  // ── Wrecked T-72 / BMP-style tank: hull, blown turret, broken track,
  //    open hatch, scorched hull, oil/fuel rubble, ammo cookoff blast ring.
  function generateWreckedTank(ox, oz) {
    const h = getTerrainHeight(ox, oz);
    if (h < 1) return;
    // Hull (6x3x2) — METAL
    for (let x = 0; x < 6; x++) {
      for (let z = 0; z < 3; z++) {
        setBlock(ox + x, h + 1, oz + z, BLOCK.METAL);
        if (x > 0 && x < 5) setBlock(ox + x, h + 2, oz + z, BLOCK.METAL);
      }
    }
    // Tracks — left & right rows, partly blown off
    for (let x = 0; x < 6; x++) {
      if (Math.random() < 0.7) setBlock(ox + x, h + 1, oz - 1, BLOCK.METAL);
      if (Math.random() < 0.7) setBlock(ox + x, h + 1, oz + 3, BLOCK.METAL);
    }
    // Turret BLOWN OFF — landed beside hull, upside-down
    const turX = ox + 3 + (Math.random() < 0.5 ? -5 : 5);
    const turZ = oz + (Math.random() < 0.5 ? -3 : 4);
    for (let x = 0; x < 3; x++) for (let z = 0; z < 2; z++) {
      setBlock(turX + x, h + 1, turZ + z, BLOCK.METAL);
    }
    // Gun barrel sticking from displaced turret
    for (let i = 0; i < 4; i++) setBlock(turX - 1 - i, h + 1, turZ, BLOCK.METAL);
    // Hatch hole (open) on top of hull
    setBlock(ox + 2, h + 3, oz + 1, BLOCK.AIR);
    // Scorch/oil ring
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 2 + Math.random() * 4;
      const rx = ox + 3 + Math.floor(Math.cos(ang) * rad);
      const rz = oz + 1 + Math.floor(Math.sin(ang) * rad);
      const rh = getTerrainHeight(rx, rz);
      if (rh > 0) setBlock(rx, rh + 1, rz, BLOCK.RUBBLE);
    }
    // Fire pocket on hull (cookoff)
    if (Math.random() < 0.6) setBlock(ox + 2, h + 3, oz + 1, BLOCK.FIRE);
  }

  // ── Wrecked BTR / MT-LB APC: 8-wheeled-style wider hull, blown roof, no turret.
  function generateWreckedAPC(ox, oz) {
    const h = getTerrainHeight(ox, oz);
    if (h < 1) return;
    for (let x = 0; x < 7; x++) {
      for (let z = 0; z < 3; z++) {
        setBlock(ox + x, h + 1, oz + z, BLOCK.METAL);
        if (x > 0 && x < 6 && Math.random() > 0.15) setBlock(ox + x, h + 2, oz + z, BLOCK.METAL);
      }
    }
    // Roof blown — random gaps
    for (let x = 1; x < 6; x++) for (let z = 0; z < 3; z++) {
      if (Math.random() < 0.4) setBlock(ox + x, h + 2, oz + z, BLOCK.AIR);
    }
    // Wheels (visible as METAL pylons on each side)
    for (let i = 0; i < 4; i++) {
      const wx = ox + 1 + i * 1.5 | 0;
      if (Math.random() < 0.7) setBlock(wx, h + 1, oz - 1, BLOCK.METAL);
      if (Math.random() < 0.7) setBlock(wx, h + 1, oz + 3, BLOCK.METAL);
    }
    // Debris ring
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 2 + Math.random() * 3;
      const rx = ox + 3 + Math.floor(Math.cos(ang) * rad);
      const rz = oz + 1 + Math.floor(Math.sin(ang) * rad);
      const rh = getTerrainHeight(rx, rz);
      if (rh > 0) setBlock(rx, rh + 1, rz, BLOCK.RUBBLE);
    }
    if (Math.random() < 0.4) setBlock(ox + 3, h + 2, oz + 1, BLOCK.FIRE);
  }

  // ── Wrecked civilian car: small, flipped, smashed glass.
  function generateWreckedCar(ox, oz) {
    const h = getTerrainHeight(ox, oz);
    if (h < 1) return;
    const flipped = Math.random() < 0.4;
    // Body 3x2
    for (let x = 0; x < 3; x++) for (let z = 0; z < 2; z++) {
      setBlock(ox + x, h + 1, oz + z, BLOCK.METAL);
    }
    if (!flipped) {
      // Roof / cabin
      for (let x = 1; x < 3; x++) {
        setBlock(ox + x, h + 2, oz, Math.random() < 0.6 ? BLOCK.METAL : BLOCK.GLASS);
        setBlock(ox + x, h + 2, oz + 1, Math.random() < 0.6 ? BLOCK.METAL : BLOCK.GLASS);
      }
      // Hood blown open (RUBBLE on engine)
      setBlock(ox, h + 1, oz, BLOCK.RUBBLE);
    } else {
      // Flipped: wheels up
      setBlock(ox, h + 2, oz, BLOCK.METAL);
      setBlock(ox + 2, h + 2, oz, BLOCK.METAL);
      setBlock(ox, h + 2, oz + 1, BLOCK.METAL);
      setBlock(ox + 2, h + 2, oz + 1, BLOCK.METAL);
    }
    // Glass shards around
    for (let i = 0; i < 5; i++) {
      const rx = ox + Math.floor((Math.random() - 0.5) * 6);
      const rz = oz + Math.floor((Math.random() - 0.5) * 6);
      const rh = getTerrainHeight(rx, rz);
      if (rh > 0) setBlock(rx, rh + 1, rz, Math.random() < 0.4 ? BLOCK.GLASS : BLOCK.RUBBLE);
    }
    if (Math.random() < 0.25) setBlock(ox + 1, h + 2, oz, BLOCK.FIRE);
  }

  // ── Wrecked civilian truck (fuel/grain truck): longer, cargo bed crushed.
  function generateWreckedTruck(ox, oz) {
    const h = getTerrainHeight(ox, oz);
    if (h < 1) return;
    // Cab 2x2
    for (let x = 0; x < 2; x++) for (let z = 0; z < 2; z++) {
      setBlock(ox + x, h + 1, oz + z, BLOCK.METAL);
      setBlock(ox + x, h + 2, oz + z, x === 0 ? BLOCK.GLASS : BLOCK.METAL);
    }
    // Cargo bed 4x2 (some crushed)
    for (let x = 2; x < 6; x++) for (let z = 0; z < 2; z++) {
      setBlock(ox + x, h + 1, oz + z, BLOCK.METAL);
      if (Math.random() < 0.7) setBlock(ox + x, h + 2, oz + z, BLOCK.RUBBLE);
    }
    // Wheels visual hint
    for (let x = 0; x < 6; x += 2) {
      setBlock(ox + x, h + 1, oz - 1, BLOCK.METAL);
      setBlock(ox + x, h + 1, oz + 2, BLOCK.METAL);
    }
    // Fuel spill / scorch
    for (let i = 0; i < 8; i++) {
      const rx = ox + Math.floor((Math.random() - 0.5) * 8);
      const rz = oz + Math.floor((Math.random() - 0.5) * 8);
      const rh = getTerrainHeight(rx, rz);
      if (rh > 0) setBlock(rx, rh + 1, rz, BLOCK.RUBBLE);
    }
    if (Math.random() < 0.5) setBlock(ox + 3, h + 2, oz + 1, BLOCK.FIRE);
  }

  // ── Wrecked bus (yellow/marshrutka style): long hull, broken windows row.
  function generateWreckedBus(ox, oz) {
    const h = getTerrainHeight(ox, oz);
    if (h < 1) return;
    for (let x = 0; x < 8; x++) for (let z = 0; z < 2; z++) {
      setBlock(ox + x, h + 1, oz + z, BLOCK.METAL);
      // Window row — half blown out
      if (Math.random() < 0.45) setBlock(ox + x, h + 2, oz + z, BLOCK.GLASS);
      // Roof (some collapsed)
      if (Math.random() < 0.5) setBlock(ox + x, h + 3, oz + z, BLOCK.METAL);
    }
    // Wheels
    for (let x = 1; x < 8; x += 3) {
      setBlock(ox + x, h + 1, oz - 1, BLOCK.METAL);
      setBlock(ox + x, h + 1, oz + 2, BLOCK.METAL);
    }
    // Glass shards & rubble
    for (let i = 0; i < 12; i++) {
      const rx = ox + Math.floor((Math.random() - 0.5) * 10);
      const rz = oz + Math.floor((Math.random() - 0.5) * 6);
      const rh = getTerrainHeight(rx, rz);
      if (rh > 0) setBlock(rx, rh + 1, rz, Math.random() < 0.4 ? BLOCK.GLASS : BLOCK.RUBBLE);
    }
    if (Math.random() < 0.4) setBlock(ox + 4, h + 3, oz + 1, BLOCK.FIRE);
  }

  // ── Wrecked ambulance / civilian van: shorter than bus, RED-CROSS hint via FLAG block.
  function generateWreckedAmbulance(ox, oz) {
    const h = getTerrainHeight(ox, oz);
    if (h < 1) return;
    for (let x = 0; x < 5; x++) for (let z = 0; z < 2; z++) {
      setBlock(ox + x, h + 1, oz + z, BLOCK.METAL);
      setBlock(ox + x, h + 2, oz + z, x < 2 ? BLOCK.GLASS : BLOCK.METAL);
    }
    // Red cross marker (SIGN block on side if available)
    setBlock(ox + 3, h + 2, oz - 1, BLOCK.SIGN || BLOCK.METAL);
    // Wheels
    setBlock(ox, h + 1, oz - 1, BLOCK.METAL);
    setBlock(ox + 4, h + 1, oz - 1, BLOCK.METAL);
    setBlock(ox, h + 1, oz + 2, BLOCK.METAL);
    setBlock(ox + 4, h + 1, oz + 2, BLOCK.METAL);
    // Rubble ring
    for (let i = 0; i < 6; i++) {
      const rx = ox + Math.floor((Math.random() - 0.5) * 7);
      const rz = oz + Math.floor((Math.random() - 0.5) * 5);
      const rh = getTerrainHeight(rx, rz);
      if (rh > 0) setBlock(rx, rh + 1, rz, BLOCK.RUBBLE);
    }
    if (Math.random() < 0.3) setBlock(ox + 2, h + 2, oz + 1, BLOCK.FIRE);
  }

  // Convoy cluster: 2-4 wrecks lined up along an axis (ambushed column).
  function generateWreckedConvoy(ox, oz) {
    const horizontal = Math.random() < 0.5;
    const cnt = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < cnt; i++) {
      const off = i * (8 + Math.floor(Math.random() * 4));
      const cx = ox + (horizontal ? off : 0);
      const cz = oz + (horizontal ? 0 : off);
      const r = Math.random();
      if (r < 0.4)      generateWreckedTank(cx, cz);
      else if (r < 0.7) generateWreckedAPC(cx, cz);
      else              generateWreckedTruck(cx, cz);
    }
  }

  // IDEA 5: Power line towers
  function generatePowerLines(ox, oz, count) {
    for (let i = 0; i < count; i++) {
      const px = ox + i * 16;
      const h = getTerrainHeight(px, oz);
      // Tower base
      setBlock(px, h, oz, BLOCK.METAL);
      setBlock(px + 1, h, oz, BLOCK.METAL);
      setBlock(px, h, oz + 1, BLOCK.METAL);
      setBlock(px + 1, h, oz + 1, BLOCK.METAL);
      // Tower shaft
      for (let y = 1; y < 10; y++) {
        setBlock(px, h + y, oz, BLOCK.METAL);
        setBlock(px + 1, h + y, oz + 1, BLOCK.METAL);
      }
      // Cross arms
      for (let a = -2; a <= 3; a++) {
        setBlock(px + a, h + 9, oz, BLOCK.METAL);
        setBlock(px + a, h + 10, oz, BLOCK.METAL);
      }
      // Some towers damaged (broken top)
      if (Math.random() < 0.3) {
        for (let y = 7; y <= 10; y++) {
          setBlock(px, h + y, oz, BLOCK.AIR);
          setBlock(px + 1, h + y, oz + 1, BLOCK.AIR);
        }
        setBlock(px, h + 7, oz, BLOCK.RUBBLE);
      }
    }
  }

  // IDEA 6: Grain silos (for Kherson agricultural theme)
  function generateGrainSilo(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    const radius = 3;
    const height = 10;
    // Cylindrical silo
    for (let y = 0; y < height; y++) {
      for (let a = 0; a < Math.PI * 2; a += 0.3) {
        const bx = Math.round(Math.cos(a) * radius);
        const bz = Math.round(Math.sin(a) * radius);
        setBlock(ox + bx, surfH + y, oz + bz, BLOCK.METAL);
      }
    }
    // Conical roof
    for (let r = radius; r >= 0; r--) {
      const y = surfH + height + (radius - r);
      for (let a = 0; a < Math.PI * 2; a += 0.3) {
        const bx = Math.round(Math.cos(a) * r);
        const bz = Math.round(Math.sin(a) * r);
        setBlock(ox + bx, y, oz + bz, BLOCK.METAL);
      }
    }
    // Access door
    setBlock(ox + radius, surfH, oz, BLOCK.AIR);
    setBlock(ox + radius, surfH + 1, oz, BLOCK.AIR);
  }

  // IDEA 7: Salt mine entrance (for Bakhmut/Soledar)
  function generateSaltMine(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Entrance structure
    for (let x = 0; x < 6; x++) {
      for (let z = 0; z < 4; z++) {
        setBlock(ox + x, surfH, oz + z, BLOCK.CONCRETE);
        setBlock(ox + x, surfH + 3, oz + z, BLOCK.CONCRETE);
        if (x === 0 || x === 5 || z === 0 || z === 3) {
          setBlock(ox + x, surfH + 1, oz + z, BLOCK.CONCRETE);
          setBlock(ox + x, surfH + 2, oz + z, BLOCK.CONCRETE);
        }
      }
    }
    // Entrance opening
    for (let x = 2; x <= 3; x++) {
      for (let y = 0; y < 3; y++) {
        setBlock(ox + x, surfH + y, oz, BLOCK.AIR);
      }
    }
    // Tunnel going underground
    for (let depth = 1; depth <= 12; depth++) {
      const ty = surfH - depth;
      if (ty < 1) break;
      for (let x = 1; x <= 4; x++) {
        for (let z = 0; z < 4; z++) {
          setBlock(ox + x, ty, oz + z - depth, BLOCK.AIR);
        }
        // Support beams
        if (depth % 3 === 0) {
          setBlock(ox + 1, ty, oz - depth, BLOCK.WOOD);
          setBlock(ox + 4, ty, oz - depth, BLOCK.WOOD);
          for (let bx = 1; bx <= 4; bx++) {
            setBlock(ox + bx, ty + 3, oz - depth, BLOCK.WOOD);
          }
        }
      }
    }
    // Mining cart tracks
    for (let d = 0; d < 10; d++) {
      const ty = surfH - d;
      if (ty < 1) break;
      setBlock(ox + 2, ty, oz - d, BLOCK.METAL);
      setBlock(ox + 3, ty, oz - d, BLOCK.METAL);
    }
  }

  // IDEA 8: Water tower
  function generateWaterTower(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Support legs (4 corners)
    for (let y = 0; y < 8; y++) {
      setBlock(ox, surfH + y, oz, BLOCK.METAL);
      setBlock(ox + 3, surfH + y, oz, BLOCK.METAL);
      setBlock(ox, surfH + y, oz + 3, BLOCK.METAL);
      setBlock(ox + 3, surfH + y, oz + 3, BLOCK.METAL);
    }
    // Cross bracing
    for (let y = 3; y < 8; y += 3) {
      for (let x = 0; x <= 3; x++) {
        setBlock(ox + x, surfH + y, oz, BLOCK.METAL);
        setBlock(ox + x, surfH + y, oz + 3, BLOCK.METAL);
      }
    }
    // Tank (cylindrical)
    for (let y = 0; y < 4; y++) {
      for (let dx = -1; dx <= 4; dx++) {
        for (let dz = -1; dz <= 4; dz++) {
          const cx = dx - 1.5, cz = dz - 1.5;
          if (cx * cx + cz * cz <= 7) {
            setBlock(ox + dx, surfH + 8 + y, oz + dz, BLOCK.METAL);
          }
        }
      }
    }
  }

  // IDEA 9: Checkpoint/roadblock
  function generateCheckpoint(ox, oz, horizontal) {
    const surfH = getTerrainHeight(ox, oz);
    // Concrete barriers
    for (let i = 0; i < 6; i++) {
      const bx = horizontal ? ox + i : ox;
      const bz = horizontal ? oz : oz + i;
      setBlock(bx, surfH, bz, BLOCK.CONCRETE);
      setBlock(bx, surfH + 1, bz, BLOCK.CONCRETE);
    }
    // Gap in middle for passage
    const mx = horizontal ? ox + 3 : ox;
    const mz = horizontal ? oz : oz + 3;
    setBlock(mx, surfH, mz, BLOCK.AIR);
    setBlock(mx, surfH + 1, mz, BLOCK.AIR);
    // Sandbag positions on sides
    for (let s = -2; s <= -1; s++) {
      const sx = horizontal ? ox + s : ox;
      const sz = horizontal ? oz : oz + s;
      setBlock(sx, surfH, sz, BLOCK.SANDBAG);
      setBlock(sx, surfH + 1, sz, BLOCK.SANDBAG);
    }
    for (let s = 7; s <= 8; s++) {
      const sx = horizontal ? ox + s : ox;
      const sz = horizontal ? oz : oz + s;
      setBlock(sx, surfH, sz, BLOCK.SANDBAG);
      setBlock(sx, surfH + 1, sz, BLOCK.SANDBAG);
    }
    // Guard booth
    const gx = horizontal ? ox - 3 : ox - 2;
    const gz = horizontal ? oz - 2 : oz - 3;
    generateBuilding(gx, gz, 3, 3, 3, BLOCK.WOOD);
  }

  // IDEA 10: Barbed wire obstacles
  function generateBarbedWire(ox, oz, length, horizontal) {
    for (let i = 0; i < length; i++) {
      const wx = horizontal ? ox + i : ox;
      const wz = horizontal ? oz : oz + i;
      const h = getTerrainHeight(wx, wz);
      // Posts
      if (i % 3 === 0) {
        setBlock(wx, h, wz, BLOCK.WOOD);
        setBlock(wx, h + 1, wz, BLOCK.WOOD);
      }
      // Wire (fence blocks)
      setBlock(wx, h + 1, wz, BLOCK.FENCE);
    }
  }

  // IDEA 11: Anti-tank hedgehogs (Czech hedgehogs)
  function generateAntiTankHedgehogs(count) {
    for (let i = 0; i < count; i++) {
      const hx = randInWorld();
      const hz = randInWorld();
      const h = getTerrainHeight(hx, hz);
      if (h <= 1) continue;
      // X-shaped metal structure
      setBlock(hx, h, hz, BLOCK.METAL);
      setBlock(hx, h + 1, hz, BLOCK.METAL);
      setBlock(hx - 1, h, hz, BLOCK.METAL);
      setBlock(hx + 1, h, hz, BLOCK.METAL);
      setBlock(hx, h, hz - 1, BLOCK.METAL);
      setBlock(hx, h, hz + 1, BLOCK.METAL);
    }
  }

  // IDEA 12: Ammunition depot
  function generateAmmoDepot(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Bunker-style building
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 6; z++) {
        setBlock(ox + x, surfH, oz + z, BLOCK.REINFORCED);
        setBlock(ox + x, surfH + 3, oz + z, BLOCK.REINFORCED);
        if (x === 0 || x === 7 || z === 0 || z === 5) {
          for (let y = 1; y < 3; y++) {
            setBlock(ox + x, surfH + y, oz + z, BLOCK.REINFORCED);
          }
        }
      }
    }
    // Door
    setBlock(ox + 4, surfH + 1, oz, BLOCK.AIR);
    setBlock(ox + 4, surfH + 2, oz, BLOCK.AIR);
    // Crates inside
    for (let c = 0; c < 6; c++) {
      const cx = ox + 2 + Math.floor(Math.random() * 4);
      const cz = oz + 1 + Math.floor(Math.random() * 4);
      setBlock(cx, surfH + 1, cz, BLOCK.CRATE);
      if (Math.random() > 0.5) setBlock(cx, surfH + 2, cz, BLOCK.CRATE);
    }
    // Sandbag perimeter
    for (let i = -1; i <= 8; i++) {
      setBlock(ox + i, surfH, oz - 1, BLOCK.SANDBAG);
      setBlock(ox + i, surfH + 1, oz - 1, BLOCK.SANDBAG);
    }
  }

  // IDEA 13: Field hospital tent
  function generateFieldHospital(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Tent structure (fabric represented by wood blocks for color)
    for (let x = 0; x < 6; x++) {
      for (let z = 0; z < 8; z++) {
        // Floor
        setBlock(ox + x, surfH, oz + z, BLOCK.CONCRETE);
        // Roof (peaked)
        const peakY = x < 3 ? x : 5 - x;
        setBlock(ox + x, surfH + 2 + peakY, oz + z, BLOCK.WOOD);
      }
    }
    // Side walls (partial)
    for (let z = 0; z < 8; z++) {
      setBlock(ox, surfH + 1, oz + z, BLOCK.WOOD);
      setBlock(ox + 5, surfH + 1, oz + z, BLOCK.WOOD);
    }
    // Entrance (open ends)
    // Crates inside for supplies
    for (let c = 0; c < 3; c++) {
      setBlock(ox + 1 + c * 2, surfH + 1, oz + 2, BLOCK.CRATE);
    }
  }

  // IDEA 14: Communication tower/antenna
  function generateCommTower(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Base building
    generateBuilding(ox - 1, oz - 1, 4, 4, 3, BLOCK.CONCRETE);
    // Tower (tall metal lattice)
    for (let y = 0; y < 16; y++) {
      setBlock(ox, surfH + 3 + y, oz, BLOCK.METAL);
      setBlock(ox + 1, surfH + 3 + y, oz + 1, BLOCK.METAL);
      // Cross members every 4 blocks
      if (y % 4 === 0) {
        setBlock(ox + 1, surfH + 3 + y, oz, BLOCK.METAL);
        setBlock(ox, surfH + 3 + y, oz + 1, BLOCK.METAL);
      }
    }
    // Dish at top
    setBlock(ox - 1, surfH + 18, oz, BLOCK.METAL);
    setBlock(ox + 2, surfH + 18, oz, BLOCK.METAL);
    setBlock(ox, surfH + 19, oz, BLOCK.METAL);
    setBlock(ox + 1, surfH + 19, oz, BLOCK.METAL);
  }

  // IDEA 15: Underground bunker command post
  function generateUndergroundBunker(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    const roomY = Math.max(1, surfH - 5);
    // Large underground room
    for (let dx = 0; dx < 8; dx++) {
      for (let dz = 0; dz < 8; dz++) {
        for (let dy = 0; dy < 4; dy++) {
          setBlock(ox + dx, roomY + dy, oz + dz, BLOCK.AIR);
        }
        // Reinforced ceiling
        setBlock(ox + dx, roomY + 4, oz + dz, BLOCK.REINFORCED);
        // Reinforced floor
        setBlock(ox + dx, roomY - 1, oz + dz, BLOCK.REINFORCED);
      }
    }
    // Support pillars
    for (let px = 2; px <= 5; px += 3) {
      for (let pz = 2; pz <= 5; pz += 3) {
        for (let y = 0; y < 4; y++) {
          setBlock(ox + px, roomY + y, oz + pz, BLOCK.REINFORCED);
        }
      }
    }
    // Entrance stairwell
    for (let s = 0; s <= 5; s++) {
      setBlock(ox - 1, surfH - s, oz + 3, BLOCK.AIR);
      setBlock(ox - 1, surfH - s, oz + 4, BLOCK.AIR);
      setBlock(ox - 1, surfH - s + 1, oz + 3, BLOCK.AIR);
      setBlock(ox - 1, surfH - s + 1, oz + 4, BLOCK.AIR);
    }
    // Equipment inside
    setBlock(ox + 1, roomY, oz + 1, BLOCK.ELECTRONICS);
    setBlock(ox + 2, roomY, oz + 1, BLOCK.ELECTRONICS);
    setBlock(ox + 6, roomY, oz + 1, BLOCK.CRATE);
    setBlock(ox + 6, roomY, oz + 6, BLOCK.CRATE);
  }

  // IDEA 16: Bridge fortifications
  function generateBridgeFortification(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Flag (blue + yellow blocks) - Ukrainian colors
    // Blue stripe (top)
    setBlock(ox + 1, surfH + 7, oz, BLOCK.WATER);
    setBlock(ox + 2, surfH + 7, oz, BLOCK.WATER);
    setBlock(ox + 1, surfH + 6, oz, BLOCK.WATER);
    setBlock(ox + 2, surfH + 6, oz, BLOCK.WATER);
    // Yellow stripe (bottom)
    setBlock(ox + 1, surfH + 5, oz, BLOCK.SAND);
    setBlock(ox + 2, surfH + 5, oz, BLOCK.SAND);
    setBlock(ox + 1, surfH + 4, oz, BLOCK.SAND);
    setBlock(ox + 2, surfH + 4, oz, BLOCK.SAND);
  }

  // IDEA 19: Propaganda signs / billboards
  function generateBillboard(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Support posts
    setBlock(ox, surfH, oz, BLOCK.METAL);
    setBlock(ox, surfH + 1, oz, BLOCK.METAL);
    setBlock(ox, surfH + 2, oz, BLOCK.METAL);
    setBlock(ox, surfH + 3, oz, BLOCK.METAL);
    setBlock(ox + 5, surfH, oz, BLOCK.METAL);
    setBlock(ox + 5, surfH + 1, oz, BLOCK.METAL);
    setBlock(ox + 5, surfH + 2, oz, BLOCK.METAL);
    setBlock(ox + 5, surfH + 3, oz, BLOCK.METAL);
    // Board surface
    for (let x = 0; x <= 5; x++) {
      setBlock(ox + x, surfH + 4, oz, BLOCK.WOOD);
      setBlock(ox + x, surfH + 5, oz, BLOCK.WOOD);
      setBlock(ox + x, surfH + 6, oz, BLOCK.WOOD);
    }
  }

  // IDEA 20: Church/memorial
  function generateChurch(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Main structure
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 8; x++) {
        for (let z = 0; z < 6; z++) {
          const isWall = x === 0 || x === 7 || z === 0 || z === 5;
          const isRoof = y === 5;
          if (isWall || isRoof) {
            setBlock(ox + x, surfH + y, oz + z, BLOCK.BRICK);
          }
        }
      }
    }
    // Peaked roof
    for (let r = 0; r < 3; r++) {
      for (let z = 0; z < 6; z++) {
        setBlock(ox + 2 + r, surfH + 6 + r, oz + z, BLOCK.BRICK);
        setBlock(ox + 5 - r, surfH + 6 + r, oz + z, BLOCK.BRICK);
      }
    }
    // Bell tower/steeple
    for (let y = 0; y < 4; y++) {
      setBlock(ox + 3, surfH + 9 + y, oz + 2, BLOCK.BRICK);
      setBlock(ox + 4, surfH + 9 + y, oz + 2, BLOCK.BRICK);
      setBlock(ox + 3, surfH + 9 + y, oz + 3, BLOCK.BRICK);
      setBlock(ox + 4, surfH + 9 + y, oz + 3, BLOCK.BRICK);
    }
    // Cross on top
    setBlock(ox + 3, surfH + 13, oz + 2, BLOCK.METAL);
    setBlock(ox + 3, surfH + 14, oz + 2, BLOCK.METAL);
    setBlock(ox + 2, surfH + 13, oz + 2, BLOCK.METAL);
    setBlock(ox + 4, surfH + 13, oz + 2, BLOCK.METAL);
    // Windows (glass on walls)
    for (let y = 2; y <= 3; y++) {
      setBlock(ox, surfH + y, oz + 2, BLOCK.GLASS);
      setBlock(ox + 7, surfH + y, oz + 2, BLOCK.GLASS);
      setBlock(ox, surfH + y, oz + 3, BLOCK.GLASS);
      setBlock(ox + 7, surfH + y, oz + 3, BLOCK.GLASS);
    }
    // Entrance
    setBlock(ox + 3, surfH, oz, BLOCK.AIR);
    setBlock(ox + 3, surfH + 1, oz, BLOCK.AIR);
    setBlock(ox + 3, surfH + 2, oz, BLOCK.AIR);
    setBlock(ox + 4, surfH, oz, BLOCK.AIR);
    setBlock(ox + 4, surfH + 1, oz, BLOCK.AIR);
    setBlock(ox + 4, surfH + 2, oz, BLOCK.AIR);
  }

  // LANDMARK: Derzhprom (Palace of Industry) — Kharkiv, constructivist icon, 1928
  // One of the first Soviet skyscrapers: 3 main blocks 13 stories each, linked by glass skywalks.
  // Now Ukraine's government HQ in Kharkiv — repeatedly targeted by Russian bombs 2022-24.
  function generateDerzhprom(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Central block — tallest (13 floors CONCRETE)
    for (var cy = 0; cy < 13; cy++) {
      for (var cx = -3; cx <= 3; cx++) {
        for (var cz = -5; cz <= 5; cz++) {
          if (cx === -3 || cx === 3 || cz === -5 || cz === 5 || cy === 12) {
            setBlock(ox + cx, base + cy, oz + cz, BLOCK.CONCRETE);
          }
        }
      }
    }
    // GLASS windows — every 2 floors, 3 wide on N/S faces
    for (var wf = 0; wf < 12; wf += 2) {
      for (var wx = -2; wx <= 2; wx++) {
        setBlock(ox + wx, base + wf, oz - 5, BLOCK.GLASS);
        setBlock(ox + wx, base + wf, oz + 5, BLOCK.GLASS);
        setBlock(ox - 3, base + wf, oz + wx, BLOCK.GLASS);
        setBlock(ox + 3, base + wf, oz + wx, BLOCK.GLASS);
      }
    }
    // Left wing (8 floors, offset west)
    for (var ly = 0; ly < 8; ly++) {
      for (var lx = -9; lx <= -4; lx++) {
        for (var lz = -4; lz <= 4; lz++) {
          if (lx === -9 || lx === -4 || lz === -4 || lz === 4 || ly === 7) {
            setBlock(ox + lx, base + ly, oz + lz, BLOCK.CONCRETE);
          }
        }
      }
    }
    // Right wing (8 floors, offset east)
    for (var ry = 0; ry < 8; ry++) {
      for (var rx = 4; rx <= 9; rx++) {
        for (var rz = -4; rz <= 4; rz++) {
          if (rx === 4 || rx === 9 || rz === -4 || rz === 4 || ry === 7) {
            setBlock(ox + rx, base + ry, oz + rz, BLOCK.CONCRETE);
          }
        }
      }
    }
    // Connecting skybridge at floor 8 (METAL walkway between central and wings)
    for (var sb = -9; sb <= 9; sb++) {
      setBlock(ox + sb, base + 8, oz, BLOCK.METAL);
      setBlock(ox + sb, base + 9, oz, BLOCK.GLASS);
    }
    // Battle damage — Russian airstrike caved in the SW corner (2022)
    for (var bd = 0; bd < 5; bd++) {
      setBlock(ox - 9 + bd, base + 5 + bd, oz - 4, BLOCK.RUBBLE);
      setBlock(ox - 9 + bd, base + 5 + bd, oz - 3, BLOCK.AIR);
    }
    _buildings.push({ kind: 'landmark_derzhprom', x: ox - 9, z: oz - 5, w: 19, d: 11, baseY: h, floorH: 4, floors: 4, cx: ox, cz: oz });
  }

  // LANDMARK: Odessa National Opera and Ballet Theatre — 1887 neo-baroque masterpiece
  // Horseshoe interior, ornate facade, gilded dome. UNESCO-protected. 3km from front line.
  function generateOdessaOperaHouse(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Main auditorium hall — horseshoe PLASTER box, 14×10, 6 floors
    for (var wy = 0; wy < 10; wy++) {
      for (var wx2 = -7; wx2 <= 7; wx2++) {
        for (var wz2 = -5; wz2 <= 5; wz2++) {
          if (wx2 === -7 || wx2 === 7 || wz2 === -5 || wz2 === 5 || wy === 9) {
            setBlock(ox + wx2, base + wy, oz + wz2, BLOCK.PLASTER);
          }
        }
      }
    }
    // Grand facade columns — 6 STONE pillars across the front (south face)
    for (var pc = -6; pc <= 6; pc += 3) {
      for (var ph = 0; ph < 10; ph++) setBlock(ox + pc, base + ph, oz - 6, BLOCK.STONE);
      for (var ph2 = 0; ph2 < 10; ph2++) setBlock(ox + pc, base + ph2, oz - 7, BLOCK.STONE);
    }
    // Pediment triangular gable above columns
    for (var pg = 0; pg <= 6; pg++) {
      var pgW = 6 - pg;
      for (var pgx = -pgW; pgx <= pgW; pgx++) {
        setBlock(ox + pgx, base + 10 + pg, oz - 6, BLOCK.PLASTER);
      }
    }
    // Side GLASS windows (arched, 2 per floor on E+W faces)
    for (var wfl2 = 1; wfl2 < 9; wfl2 += 3) {
      setBlock(ox - 7, base + wfl2, oz - 2, BLOCK.GLASS);
      setBlock(ox - 7, base + wfl2 + 1, oz - 2, BLOCK.GLASS);
      setBlock(ox - 7, base + wfl2, oz + 2, BLOCK.GLASS);
      setBlock(ox - 7, base + wfl2 + 1, oz + 2, BLOCK.GLASS);
      setBlock(ox + 7, base + wfl2, oz - 2, BLOCK.GLASS);
      setBlock(ox + 7, base + wfl2 + 1, oz - 2, BLOCK.GLASS);
      setBlock(ox + 7, base + wfl2, oz + 2, BLOCK.GLASS);
      setBlock(ox + 7, base + wfl2 + 1, oz + 2, BLOCK.GLASS);
    }
    // Gilded dome (LIGHT-block dome on top center)
    var dProfile = [5, 4, 3, 2, 1];
    for (var di = 0; di < dProfile.length; di++) {
      _lmDisc(ox, base + 10 + di, oz, dProfile[di], di === 0 ? BLOCK.CONCRETE : BLOCK.LIGHT);
    }
    setBlock(ox, base + 16, oz, BLOCK.LIGHT);
    // Entrance steps (south)
    for (var es = 0; es < 3; es++) {
      for (var ex = -4 + es; ex <= 4 - es; ex++) {
        setBlock(ox + ex, h + es, oz - 8 - es, BLOCK.STONE);
      }
    }
    _buildings.push({ kind: 'landmark_odessa_opera', x: ox - 7, z: oz - 7, w: 15, d: 13, baseY: h, floorH: 4, floors: 2, cx: ox, cz: oz });
  }

  // LANDMARK: Zaporizhzhia Nuclear Power Plant (ZNPP) — Europe's largest NPP
  // 6 VVER-1000 reactor blocks in a row, captured by Russia March 2022, shelled repeatedly.
  // Famous for: nuclear standoff, firefight at plant gates, ongoing occupation risk.
  function generateZaporizhzhiaNPP(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Turbine hall — long CONCRETE structure housing all 6 units, 36 blocks long × 8 wide × 8 high
    for (var ty = 0; ty < 8; ty++) {
      for (var tx = -18; tx <= 18; tx++) {
        for (var tz = -4; tz <= 4; tz++) {
          if (tx === -18 || tx === 18 || tz === -4 || tz === 4 || ty === 7) {
            setBlock(ox + tx, base + ty, oz + tz, BLOCK.CONCRETE);
          }
        }
      }
    }
    // 6 Reactor containment domes spaced 6 units apart (REINFORCED cylinder + CONCRETE dome)
    var reactorX = [-15, -9, -3, 3, 9, 15];
    for (var ri2 = 0; ri2 < 6; ri2++) {
      var rx2 = ox + reactorX[ri2];
      // Containment cylinder (3 floors, radius 2)
      for (var ry2 = 0; ry2 < 6; ry2++) {
        _lmRing(rx2, base + 8 + ry2, oz, 3, BLOCK.REINFORCED);
      }
      // Dome cap (CONCRETE disc shrinking profile)
      _lmDisc(rx2, base + 14, oz, 3, BLOCK.CONCRETE);
      _lmDisc(rx2, base + 15, oz, 2, BLOCK.CONCRETE);
      _lmDisc(rx2, base + 16, oz, 1, BLOCK.CONCRETE);
      // Cooling water pipes on south side
      setBlock(rx2, base + 4, oz + 5, BLOCK.METAL);
      setBlock(rx2, base + 5, oz + 5, BLOCK.METAL);
    }
    // Cooling towers (2 hyperbolic towers, west end of site)
    _lmRing(ox - 22, base, oz, 4, BLOCK.CONCRETE);
    for (var ct2 = 0; ct2 < 12; ct2++) {
      var ctR = Math.max(2, 4 - Math.floor(ct2 * 0.3));
      _lmRing(ox - 22, base + ct2, oz, ctR, BLOCK.CONCRETE);
    }
    _lmDisc(ox - 22, base + 13, oz, 3, BLOCK.CONCRETE);
    _lmRing(ox + 22, base, oz, 4, BLOCK.CONCRETE);
    for (var ct3 = 0; ct3 < 12; ct3++) {
      var ctR2 = Math.max(2, 4 - Math.floor(ct3 * 0.3));
      _lmRing(ox + 22, base + ct3, oz, ctR2, BLOCK.CONCRETE);
    }
    _lmDisc(ox + 22, base + 13, oz, 3, BLOCK.CONCRETE);
    // Perimeter security fence (FENCE blocks, full rectangle)
    for (var fx = -25; fx <= 25; fx++) {
      setBlock(ox + fx, base, oz - 8, BLOCK.FENCE);
      setBlock(ox + fx, base, oz + 8, BLOCK.FENCE);
    }
    for (var fz = -8; fz <= 8; fz++) {
      setBlock(ox - 25, base, oz + fz, BLOCK.FENCE);
      setBlock(ox + 25, base, oz + fz, BLOCK.FENCE);
    }
    // Warning: radiation sign (LIGHT blocks at main gate)
    setBlock(ox, base + 1, oz + 9, BLOCK.LIGHT);
    _buildings.push({ kind: 'landmark_znpp', x: ox - 25, z: oz - 8, w: 51, d: 17, baseY: h, floorH: 5, floors: 3, cx: ox, cz: oz });
  }

  // LANDMARK: Mykolaiv Shipyard (Black Sea Shipbuilding Plant)
  // Built Soviet warships and submarines; now heavily bombed. Distinctive large drydocks + gantry cranes.
  function generateMykolaivShipyard(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Main assembly hall — large industrial shed (20×12, 10 floors)
    for (var sy = 0; sy < 10; sy++) {
      for (var sx = -10; sx <= 10; sx++) {
        for (var sz = -6; sz <= 6; sz++) {
          if (sx === -10 || sx === 10 || sz === -6 || sz === 6 || sy === 9) {
            setBlock(ox + sx, base + sy, oz + sz, BLOCK.METAL);
          }
        }
      }
    }
    // Sawtooth roof (industrial clerestory windows on S side)
    for (var sr = -9; sr <= 9; sr += 4) {
      for (var sh = 0; sh < 3; sh++) {
        setBlock(ox + sr, base + 10 + sh, oz - 6, BLOCK.GLASS);
        setBlock(ox + sr, base + 10 + sh, oz + 6, BLOCK.GLASS);
      }
    }
    // Drydock pits (2 parallel trenches cut into terrain, STONE lined)
    for (var dk = -8; dk <= 8; dk++) {
      for (var dd = 0; dd < 4; dd++) {
        setBlock(ox + dk, h - dd, oz - 10, BLOCK.STONE);
        setBlock(ox + dk, h - dd, oz + 10, BLOCK.STONE);
      }
    }
    // Gantry crane towers (METAL, 15 blocks high with horizontal arm)
    var craneX = [-8, 8];
    for (var ci = 0; ci < 2; ci++) {
      for (var cry = 0; cry < 15; cry++) setBlock(ox + craneX[ci], base + cry, oz, BLOCK.METAL);
      // Horizontal jib arm
      for (var cra = -4; cra <= 4; cra++) setBlock(ox + craneX[ci] + cra, base + 14, oz, BLOCK.METAL);
      setBlock(ox + craneX[ci], base + 15, oz, BLOCK.LIGHT); // Warning light
    }
    // Administration building (3-storey CONCRETE, west)
    for (var ay = 0; ay < 6; ay++) {
      for (var ax = -14; ax <= -11; ax++) {
        setBlock(ax + (ox + 14), base + ay, oz + 2, BLOCK.CONCRETE);
        setBlock(ax + (ox + 14), base + ay, oz - 2, BLOCK.CONCRETE);
      }
      setBlock(ox - 14, base + ay, oz + 2, BLOCK.CONCRETE);
      setBlock(ox - 14, base + ay, oz - 2, BLOCK.CONCRETE);
      setBlock(ox - 11, base + ay, oz + 2, BLOCK.CONCRETE);
      setBlock(ox - 11, base + ay, oz - 2, BLOCK.CONCRETE);
    }
    // Battle damage — Russian cruise missile strikes (2022)
    setBlock(ox + 5, base + 8, oz - 5, BLOCK.RUBBLE);
    setBlock(ox + 6, base + 8, oz - 5, BLOCK.RUBBLE);
    setBlock(ox + 7, base + 7, oz - 4, BLOCK.RUBBLE);
    setBlock(ox + 6, base + 7, oz - 4, BLOCK.AIR);
    _buildings.push({ kind: 'landmark_mykolaiv_shipyard', x: ox - 14, z: oz - 12, w: 29, d: 24, baseY: h, floorH: 5, floors: 2, cx: ox, cz: oz });
  }

  // LANDMARK: Golden Gate (Zoloti Vorota) — 11th-century Byzantine city gate, reconstructed 1982
  // White STONE tower with archway passage + small chapel on top, iconic western entrance to old Kyiv
  function generateGoldenGate(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    var W = 10, D = 8;
    for (var wx = 0; wx <= W; wx++) {
      for (var wz = 0; wz <= D; wz++) {
        for (var wy = 1; wy <= 12; wy++) {
          if (wx === 0 || wx === W || wz === 0 || wz === D || wy === 12) {
            setBlock(ox + wx, base + wy, oz + wz, BLOCK.STONE);
          }
        }
      }
    }
    // Central archway passage (3 wide × 6 tall)
    for (var az = 0; az <= D; az++) {
      for (var ax = 3; ax <= 7; ax++) {
        for (var ay = 1; ay <= 6; ay++) setBlock(ox + ax, base + ay, oz + az, BLOCK.AIR);
      }
    }
    // Chapel room on top
    for (var cx2 = 2; cx2 <= 8; cx2++) {
      for (var cz2 = 2; cz2 <= 6; cz2++) {
        for (var cy = 13; cy <= 16; cy++) {
          if (cx2 === 2 || cx2 === 8 || cz2 === 2 || cz2 === 6 || cy === 16) {
            setBlock(ox + cx2, base + cy, oz + cz2, BLOCK.BRICK);
          }
        }
      }
    }
    // Golden dome on chapel
    for (var gd = -1; gd <= 1; gd++) {
      for (var gdz = -1; gdz <= 1; gdz++) {
        if (gd * gd + gdz * gdz <= 1) setBlock(ox + 5 + gd, base + 17, oz + 4 + gdz, BLOCK.LIGHT);
      }
    }
    setBlock(ox + 5, base + 18, oz + 4, BLOCK.LIGHT);
    setBlock(ox + 5, base + 19, oz + 4, BLOCK.METAL);
    // Crenellations atop gate tower
    for (var mi = 0; mi <= W; mi += 2) {
      setBlock(ox + mi, base + 13, oz, BLOCK.STONE);
      setBlock(ox + mi, base + 13, oz + D, BLOCK.STONE);
    }
    _buildings.push({ kind: 'golden_gate', x: ox, z: oz, w: W + 1, d: D + 1, baseY: h, floorH: 6, floors: 2, cx: ox + 5, cz: oz + 4 });
  }

  // LANDMARK: Kyiv Central Railway Station (Tsentralnyi Vokzal, 1932)
  // Stalinist neoclassical building with central clock tower — main rail hub of the city
  function generateKyivCentralStation(ox, oz) {
    var h = getTerrainHeight(ox, oz) || 0;
    var base = h + 1;
    // Wide main hall (PLASTER walls, 8 floors)
    for (var mbx = 0; mbx <= 20; mbx++) {
      for (var mbz = 0; mbz <= 12; mbz++) {
        for (var mby = 1; mby <= 8; mby++) {
          if (mbx === 0 || mbx === 20 || mbz === 0 || mbz === 12 || mby === 8) {
            setBlock(ox + mbx, base + mby, oz + mbz, BLOCK.PLASTER);
          }
        }
      }
    }
    // Arched windows on north facade
    for (var wc = 2; wc <= 18; wc += 4) {
      for (var wy2 = 2; wy2 <= 6; wy2++) {
        setBlock(ox + wc, base + wy2, oz, BLOCK.GLASS);
        setBlock(ox + wc + 1, base + wy2, oz, BLOCK.GLASS);
      }
    }
    // Grand entrance arch (centre, 5 wide)
    for (var eax = 8; eax <= 12; eax++) {
      for (var eay = 1; eay <= 5; eay++) setBlock(ox + eax, base + eay, oz, BLOCK.AIR);
    }
    // Central clock tower
    for (var cth = 9; cth <= 15; cth++) {
      for (var ctx = 8; ctx <= 12; ctx++) {
        for (var ctz = 4; ctz <= 8; ctz++) {
          if (ctx === 8 || ctx === 12 || ctz === 4 || ctz === 8) {
            setBlock(ox + ctx, base + cth, oz + ctz, BLOCK.STONE);
          }
        }
      }
    }
    // Clock face glass insets on each side
    setBlock(ox + 10, base + 12, oz + 4, BLOCK.GLASS);
    setBlock(ox + 10, base + 12, oz + 8, BLOCK.GLASS);
    setBlock(ox + 8, base + 12, oz + 6, BLOCK.GLASS);
    setBlock(ox + 12, base + 12, oz + 6, BLOCK.GLASS);
    // Tower spire
    setBlock(ox + 10, base + 16, oz + 6, BLOCK.METAL);
    setBlock(ox + 10, base + 17, oz + 6, BLOCK.METAL);
    // Platform awning (canopy over tracks)
    for (var pax = -2; pax <= 22; pax++) {
      setBlock(ox + pax, base + 5, oz + 12, BLOCK.CONCRETE);
    }
    // Railway tracks heading south
    for (var trz = 13; trz <= 20; trz++) {
      for (var trx = 2; trx <= 18; trx += 6) {
        setBlock(ox + trx, base, oz + trz, BLOCK.METAL);
        setBlock(ox + trx + 1, base, oz + trz, BLOCK.METAL);
      }
    }
    _buildings.push({ kind: 'kyiv_central_station', x: ox - 2, z: oz, w: 25, d: 21, baseY: h, floorH: 8, floors: 2, cx: ox + 10, cz: oz + 6 });
  }

  // ─── Kyiv Maidan Nezalezhnosti — historical recreation ─────────────
  // Recreates the Independence Square / Khreshchatyk approach where
  // Russian armored columns were stopped on the road into Kyiv (Feb–Mar 2022).
  // Layout (looking down, +Z is south = player side, -Z is north = tank approach):
  //   z=-45..-15  approach highway flanked by 9-story Soviet apartments
  //   z=-15..+10  central plaza with Independence Monument + roundabout
  //   z=+5..+15   gold-domed Orthodox church (east) + government building (west)
  //   z=+18..+22  Ukrainian defensive line: hedgehogs, sandbags, parked busses
  function generateKyivMaidanSquare(ox, oz) {
    var bx = ox, bz = oz; // origin = plaza center
    function gh(x, z) { return getTerrainHeight(x, z); }

    // ── 1. North–South main avenue (Khreshchatyk-style boulevard, 10 wide)
    for (var z = -45; z <= 25; z++) {
      for (var x = -5; x <= 5; x++) {
        var ay = gh(bx + x, bz + z);
        setBlock(bx + x, ay, bz + z, BLOCK.ASPHALT);
      }
      // Center white road markings (dashed)
      if ((z % 3) === 0) {
        var my = gh(bx, bz + z);
        setBlock(bx, my, bz + z, BLOCK.WHITE_TILE);
      }
      // Yellow shoulder lines (every block, edge of asphalt)
      var sy = gh(bx - 5, bz + z);
      setBlock(bx - 5, sy, bz + z, BLOCK.WHITE_TILE);
      setBlock(bx + 5, sy, bz + z, BLOCK.WHITE_TILE);
    }

    // ── 2. East–West cross avenue at plaza (8 wide)
    for (var x2 = -30; x2 <= 30; x2++) {
      for (var z2 = -2; z2 <= 5; z2++) {
        var ay2 = gh(bx + x2, bz + z2);
        setBlock(bx + x2, ay2, bz + z2, BLOCK.ASPHALT);
      }
      if ((x2 % 3) === 0) setBlock(bx + x2, gh(bx + x2, bz + 1), bz + 1, BLOCK.WHITE_TILE);
    }

    // ── 3. Crosswalks at intersection (zebra stripes)
    function crosswalk(cx, cz, dir) {
      // dir 'h' = horizontal stripes across z, 'v' = vertical
      for (var i = 0; i < 8; i++) {
        if (dir === 'h') {
          if (i % 2 === 0) {
            for (var k = -4; k <= 4; k++) {
              setBlock(cx + k, gh(cx + k, cz + i - 4), cz + i - 4, BLOCK.WHITE_TILE);
            }
          }
        } else {
          if (i % 2 === 0) {
            for (var k2 = -4; k2 <= 4; k2++) {
              setBlock(cx + i - 4, gh(cx + i - 4, cz + k2), cz + k2, BLOCK.WHITE_TILE);
            }
          }
        }
      }
    }
    crosswalk(bx, bz - 8, 'h');
    crosswalk(bx, bz + 10, 'h');

    // ── 4. Stoplights at the four corners of the intersection
    function stoplight(sx, sz) {
      var y = gh(bx + sx, bz + sz);
      setBlock(bx + sx, y + 1, bz + sz, BLOCK.METAL);
      setBlock(bx + sx, y + 2, bz + sz, BLOCK.METAL);
      setBlock(bx + sx, y + 3, bz + sz, BLOCK.METAL);
      setBlock(bx + sx, y + 4, bz + sz, BLOCK.METAL);
      setBlock(bx + sx, y + 5, bz + sz, BLOCK.LIGHT); // light fixture
    }
    stoplight(-7, -4); stoplight(7, -4);
    stoplight(-7, 7);  stoplight(7, 7);

    // ── 5. Independence Square center: Monument (column with statue)
    var cy = gh(bx, bz + 1);
    // Circular roundabout base (10 radius)
    for (var rx = -10; rx <= 10; rx++) {
      for (var rz = -8; rz <= 8; rz++) {
        var d = Math.sqrt(rx * rx + rz * rz);
        if (d > 7 && d < 9) {
          var py = gh(bx + rx, bz + rz);
          setBlock(bx + rx, py, bz + rz, BLOCK.WHITE_TILE);
        }
      }
    }
    // Monument column (Berehynia-style — 12 high)
    for (var my2 = 0; my2 < 12; my2++) {
      setBlock(bx, cy + 1 + my2, bz + 1, BLOCK.CONCRETE);
    }
    // Gold orb on top (statue)
    setBlock(bx, cy + 13, bz + 1, BLOCK.METAL);
    setBlock(bx, cy + 14, bz + 1, BLOCK.LIGHT);
    setBlock(bx - 1, cy + 13, bz + 1, BLOCK.METAL);
    setBlock(bx + 1, cy + 13, bz + 1, BLOCK.METAL);
    // Pedestal (4x4 concrete base)
    for (var pbx = -1; pbx <= 1; pbx++) {
      for (var pbz = 0; pbz <= 2; pbz++) {
        setBlock(bx + pbx, cy + 1, bz + pbz, BLOCK.CONCRETE);
      }
    }

    // ── 6. Soviet 9-story apartments lining the approach (west + east)
    // West side
    generateUkrainianApartment(bx - 24, bz - 38, 9);
    generateUkrainianApartment(bx - 24, bz - 22, 9);
    generateUkrainianApartment(bx - 24, bz - 6, 6);
    // East side
    generateUkrainianApartment(bx + 12, bz - 38, 9);
    generateUkrainianApartment(bx + 12, bz - 22, 9);
    generateUkrainianApartment(bx + 12, bz - 6, 6);

    // ── 7. Hotel Ukraina-style tall building at north end of plaza
    var hx = bx - 6, hz = bz - 18;
    var hy = gh(hx, hz);
    for (var hbx = 0; hbx < 12; hbx++) {
      for (var hbz = 0; hbz < 8; hbz++) {
        for (var hby = 0; hby < 18; hby++) {
          var isShell = hbx === 0 || hbx === 11 || hbz === 0 || hbz === 7 || hby === 17;
          if (isShell) {
            setBlock(hx + hbx, hy + hby, hz + hbz, BLOCK.CONCRETE);
          } else if (hby > 0 && hby < 17 && hby % 3 === 0 && (hbx === 0 || hbx === 11)) {
            setBlock(hx + hbx, hy + hby, hz + hbz, BLOCK.GLASS);
          }
        }
      }
    }
    // Hotel entrance
    setBlock(hx + 5, hy, hz + 7, BLOCK.AIR);
    setBlock(hx + 5, hy + 1, hz + 7, BLOCK.AIR);
    setBlock(hx + 6, hy, hz + 7, BLOCK.AIR);
    setBlock(hx + 6, hy + 1, hz + 7, BLOCK.AIR);

    // ── 8. Gold-domed Orthodox church (east of plaza)
    generateChurch(bx + 14, bz + 8);
    // Replace church steeple metal cross with gold dome (LIGHT block = bright/gold)
    var churchSurfH = gh(bx + 14, bz + 8);
    for (var dy = 0; dy < 2; dy++) {
      for (var ddx = -1; ddx <= 1; ddx++) {
        for (var ddz = -1; ddz <= 1; ddz++) {
          if (Math.abs(ddx) + Math.abs(ddz) <= 1) {
            setBlock(bx + 14 + 3 + ddx, churchSurfH + 12 + dy, bz + 8 + 2 + ddz, BLOCK.LIGHT);
          }
        }
      }
    }

    // ── 9. Government building (west of plaza)
    var gx = bx - 18, gz = bz + 6;
    var gy = gh(gx, gz);
    for (var gbx = 0; gbx < 14; gbx++) {
      for (var gbz = 0; gbz < 8; gbz++) {
        for (var gby = 0; gby < 8; gby++) {
          var isGShell = gbx === 0 || gbx === 13 || gbz === 0 || gbz === 7 || gby === 7;
          if (isGShell) setBlock(gx + gbx, gy + gby, gz + gbz, BLOCK.STONE);
          else if (gby >= 2 && gby <= 5 && gbx % 2 === 0 && (gbz === 0 || gbz === 7)) {
            setBlock(gx + gbx, gy + gby, gz + gbz, BLOCK.GLASS);
          }
        }
      }
    }
    // Pillared facade (classical Soviet style)
    for (var pIdx = 0; pIdx < 5; pIdx++) {
      var pcx = gx + 1 + pIdx * 3;
      for (var pcy = 0; pcy < 6; pcy++) {
        setBlock(pcx, gy + pcy, gz - 1, BLOCK.STONE);
      }
    }
    // Ukrainian flag on top
    setBlock(gx + 6, gy + 8, gz + 3, BLOCK.METAL);
    setBlock(gx + 6, gy + 9, gz + 3, BLOCK.METAL);
    setBlock(gx + 6, gy + 10, gz + 3, BLOCK.FLAG);

    // ── 10. Civilian vehicles parked along avenue + on approach road
    function placeVehicle(vx, vz, type) {
      var vy = gh(bx + vx, bz + vz);
      var b = (type === 'bus') ? BLOCK.BUS : (type === 'truck') ? BLOCK.TRUCK : BLOCK.CAR;
      var len = (type === 'bus') ? 5 : (type === 'truck') ? 4 : 3;
      for (var vi = 0; vi < len; vi++) {
        setBlock(bx + vx + vi, vy + 1, bz + vz, b);
        if (type === 'bus' || type === 'truck') {
          setBlock(bx + vx + vi, vy + 2, bz + vz, b);
        }
      }
    }
    placeVehicle(-9, -36, 'bus');
    placeVehicle(7, -32, 'truck');
    placeVehicle(-9, -28, 'car');
    placeVehicle(7, -24, 'car');
    placeVehicle(-9, -20, 'truck');
    placeVehicle(7, -16, 'bus');
    placeVehicle(-9, 12, 'car');
    placeVehicle(7, 14, 'bus');

    // ── 11. Streetlights every 8 along the avenue
    for (var slz = -40; slz <= 20; slz += 8) {
      var sly1 = gh(bx - 6, bz + slz);
      var sly2 = gh(bx + 6, bz + slz);
      for (var sly = 1; sly <= 4; sly++) {
        setBlock(bx - 6, sly1 + sly, bz + slz, BLOCK.STREETLIGHT);
        setBlock(bx + 6, sly2 + sly, bz + slz, BLOCK.STREETLIGHT);
      }
      setBlock(bx - 6, sly1 + 5, bz + slz, BLOCK.LIGHT);
      setBlock(bx + 6, sly2 + 5, bz + slz, BLOCK.LIGHT);
    }

    // ── 12. Ukrainian defensive line (south = player side)
    // Anti-tank hedgehogs (Czech hedgehogs) blocking the avenue
    var hedgePositions = [[-4, 18], [-2, 19], [0, 18], [2, 19], [4, 18], [-3, 20], [3, 20]];
    for (var hp = 0; hp < hedgePositions.length; hp++) {
      var hgx = bx + hedgePositions[hp][0];
      var hgz = bz + hedgePositions[hp][1];
      var hgy = gh(hgx, hgz);
      setBlock(hgx, hgy + 1, hgz, BLOCK.METAL);
      setBlock(hgx, hgy + 2, hgz, BLOCK.METAL);
    }
    // Sandbag emplacements at flanks
    function sandbagWall(sgx, sgz, len, horiz) {
      for (var sgi = 0; sgi < len; sgi++) {
        var sgX = bx + sgx + (horiz ? sgi : 0);
        var sgZ = bz + sgz + (horiz ? 0 : sgi);
        var sgy = gh(sgX, sgZ);
        setBlock(sgX, sgy + 1, sgZ, BLOCK.SANDBAG);
        setBlock(sgX, sgy + 2, sgZ, BLOCK.SANDBAG);
      }
    }
    sandbagWall(-12, 21, 6, true);
    sandbagWall(7, 21, 6, true);
    sandbagWall(-12, 17, 5, false);
    sandbagWall(11, 17, 5, false);

    // ── 13. Bus stops, billboards, bench seating along avenue
    generateBillboard(bx - 14, bz - 10);
    generateBillboard(bx + 8, bz - 14);
    // Bus stop shelters (BUS_STOP block)
    function busShelter(bsx, bsz) {
      var bsy = gh(bx + bsx, bz + bsz);
      setBlock(bx + bsx, bsy + 1, bz + bsz, BLOCK.BUS_STOP);
      setBlock(bx + bsx + 1, bsy + 1, bz + bsz, BLOCK.BUS_STOP);
      setBlock(bx + bsx, bsy + 2, bz + bsz, BLOCK.GLASS);
      setBlock(bx + bsx + 1, bsy + 2, bz + bsz, BLOCK.GLASS);
    }
    busShelter(-9, -10);
    busShelter(7, -8);

    // ── 14. Park trees + benches around plaza
    for (var pti = 0; pti < 10; pti++) {
      var ang = (pti / 10) * Math.PI * 2;
      var ptx = bx + Math.round(Math.cos(ang) * 11);
      var ptz = bz + Math.round(Math.sin(ang) * 9) + 1;
      var pty = gh(ptx, ptz);
      // Skip trees that would land on the road
      if (Math.abs(ptx - bx) < 6 && ptz < bz - 2) continue;
      setBlock(ptx, pty + 1, ptz, BLOCK.PARK_TREE);
      setBlock(ptx, pty + 2, ptz, BLOCK.PARK_TREE);
      setBlock(ptx, pty + 3, ptz, BLOCK.LEAVES || BLOCK.BUSH);
    }

    // ── 15. Add this square to road waypoint list so vehicles can drive in
    for (var wpz = -40; wpz <= 20; wpz += 6) {
      _roadWaypoints.push(new THREE.Vector3(bx, gh(bx, bz + wpz) + 0.5, bz + wpz));
    }

    // ── 16. Northern approach corridor — suburban apartment blocks ────────────
    // Lines the convoy approach (z=30..100) with residential blocks on both sides.
    var _approachSlots = [30, 50, 70, 90];
    for (var _ai = 0; _ai < _approachSlots.length; _ai++) {
      var _az = bz + _approachSlots[_ai];
      generateUkrainianApartment(bx - 22, _az, 5 + (_ai % 2));
      generateUkrainianApartment(bx + 8,  _az, 5 + ((1 - _ai) % 2 + 1));
    }
  }

  // ── Kyiv City Extension: landmarks, suburbs, river, approach ──────────
  function generateKyivCityExtension(ox, oz) {
    function gh(x, z) { return getTerrainHeight(x, z); }

    // ── A. St. Sophia Cathedral (NW of Maidan, x=-12, z=-32) ─────────────
    // Iconic 11th-century cathedral with 13 golden domes
    var sfx = ox - 12, sfz = oz - 32;
    for (var sbx = 0; sbx < 12; sbx++) {
      for (var sbz = 0; sbz < 10; sbz++) {
        for (var sby = 1; sby <= 8; sby++) {
          var isSwall = sbx === 0 || sbx === 11 || sbz === 0 || sbz === 9 || sby === 8;
          if (isSwall) setBlock(sfx + sbx, gh(sfx, sfz) + sby, sfz + sbz, BLOCK.STONE);
          else if (sby >= 3 && sby <= 6 && sbx % 3 === 1 && (sbz === 0 || sbz === 9)) {
            setBlock(sfx + sbx, gh(sfx, sfz) + sby, sfz + sbz, BLOCK.GLASS);
          }
        }
      }
    }
    // Golden domes (5 on main cathedral, LIGHT block = gold)
    var sfDomes = [[5, 4, 12], [2, 2, 10], [9, 2, 10], [2, 7, 10], [9, 7, 10]];
    for (var di = 0; di < sfDomes.length; di++) {
      var ddx = sfDomes[di][0], ddz = sfDomes[di][1], ddH = sfDomes[di][2];
      var dby = gh(sfx, sfz) + ddH;
      setBlock(sfx + ddx, dby,     sfz + ddz, BLOCK.CONCRETE);
      setBlock(sfx + ddx, dby + 1, sfz + ddz, BLOCK.LIGHT);
      setBlock(sfx + ddx, dby + 2, sfz + ddz, BLOCK.LIGHT);
      setBlock(sfx + ddx - 1, dby + 1, sfz + ddz, BLOCK.LIGHT);
      setBlock(sfx + ddx + 1, dby + 1, sfz + ddz, BLOCK.LIGHT);
      setBlock(sfx + ddx, dby + 1, sfz + ddz - 1, BLOCK.LIGHT);
      setBlock(sfx + ddx, dby + 1, sfz + ddz + 1, BLOCK.LIGHT);
      setBlock(sfx + ddx, dby + 3, sfz + ddz, BLOCK.METAL);
    }

    // ── B. Verkhovna Rada (Parliament, east side x=38, z=10) ─────────────
    var rdx = ox + 38, rdz = oz + 10;
    var rdby = gh(rdx, rdz);
    for (var rbx = 0; rbx < 28; rbx++) {
      for (var rbz = 0; rbz < 12; rbz++) {
        for (var rby = 1; rby <= 10; rby++) {
          var isRwall = rbx === 0 || rbx === 27 || rbz === 0 || rbz === 11 || rby === 10;
          if (isRwall) setBlock(rdx + rbx, rdby + rby, rdz + rbz, BLOCK.STONE);
          else if (rby >= 3 && rby <= 7 && rbx % 3 === 0 && (rbz === 0 || rbz === 11)) {
            setBlock(rdx + rbx, rdby + rby, rdz + rbz, BLOCK.GLASS);
          }
        }
      }
    }
    // Classical colonnade
    for (var col = 0; col < 7; col++) {
      var colX = rdx + 3 + col * 4;
      for (var coly = 1; coly <= 8; coly++) setBlock(colX, rdby + coly, rdz - 1, BLOCK.STONE);
    }
    // Ukrainian flag on Rada
    setBlock(rdx + 13, rdby + 11, rdz + 5, BLOCK.METAL);
    setBlock(rdx + 13, rdby + 12, rdz + 5, BLOCK.METAL);
    setBlock(rdx + 13, rdby + 13, rdz + 5, BLOCK.METAL);
    setBlock(rdx + 14, rdby + 12, rdz + 5, BLOCK.CONCRETE); // blue
    setBlock(rdx + 15, rdby + 12, rdz + 5, BLOCK.CONCRETE);
    setBlock(rdx + 14, rdby + 13, rdz + 5, BLOCK.LIGHT);    // yellow
    setBlock(rdx + 15, rdby + 13, rdz + 5, BLOCK.LIGHT);

    // ── B2. Saint Michael's Golden-Domed Monastery (NW, x=-26, z=-42) ──
    // Blue-walled monastery with golden domes — northwest of Maidan
    var smx = ox - 26, smz = oz - 42;
    var smby = gh(smx, smz);
    for (var smbx = 0; smbx < 14; smbx++) {
      for (var smbz = 0; smbz < 10; smbz++) {
        for (var smby2 = 1; smby2 <= 9; smby2++) {
          var smIsWall = smbx === 0 || smbx === 13 || smbz === 0 || smbz === 9 || smby2 === 9;
          if (smIsWall) setBlock(smx + smbx, smby + smby2, smz + smbz, BLOCK.CONCRETE); // blue-ish (concrete)
          else if (smby2 >= 3 && smby2 <= 6 && smbx % 4 === 1 && (smbz === 0 || smbz === 9)) {
            setBlock(smx + smbx, smby + smby2, smz + smbz, BLOCK.GLASS);
          }
        }
      }
    }
    // 7 golden domes across the roof
    var smDomes = [[1,4],[3,4],[5,4],[7,4],[9,4],[11,4],[7,8]];
    for (var sdm = 0; sdm < smDomes.length; sdm++) {
      var sdmX = smx + smDomes[sdm][0], sdmZ = smz + smDomes[sdm][1];
      var sdmY = smby + 9;
      setBlock(sdmX, sdmY,     sdmZ, BLOCK.STONE);
      setBlock(sdmX, sdmY + 1, sdmZ, BLOCK.LIGHT);
      setBlock(sdmX - 1, sdmY + 1, sdmZ, BLOCK.LIGHT);
      setBlock(sdmX + 1, sdmY + 1, sdmZ, BLOCK.LIGHT);
      setBlock(sdmX, sdmY + 1, sdmZ - 1, BLOCK.LIGHT);
      setBlock(sdmX, sdmY + 1, sdmZ + 1, BLOCK.LIGHT);
      setBlock(sdmX, sdmY + 2, sdmZ, BLOCK.METAL); // cross finial
    }

    // ── B3. Rodina-Mat (Motherland Statue, x=50, z=52) — 22 blocks ──
    // The 62m titanium statue east of Lavra — iconic Kyiv skyline landmark
    var rmx = ox + 50, rmz = oz + 52;
    var rmby = gh(rmx, rmz);
    // Pedestal base (wide, concrete, 5 high)
    for (var rpx = -4; rpx <= 4; rpx++) {
      for (var rpz = -4; rpz <= 4; rpz++) {
        for (var rpy = 1; rpy <= 5; rpy++) {
          var rpIsOuter = Math.abs(rpx) === 4 || Math.abs(rpz) === 4 || rpy === 5;
          if (rpIsOuter) setBlock(rmx + rpx, rmby + rpy, rmz + rpz, BLOCK.CONCRETE);
        }
      }
    }
    // Figure legs and torso (narrow column above pedestal)
    for (var rfh = 6; rfh <= 18; rfh++) {
      var rfW = rfh < 10 ? 2 : rfh < 15 ? 1 : 1;
      for (var rfx = -rfW; rfx <= rfW; rfx++) {
        for (var rfz = -rfW; rfz <= rfW; rfz++) {
          if (Math.abs(rfx) === rfW || Math.abs(rfz) === rfW) {
            setBlock(rmx + rfx, rmby + rfh, rmz + rfz, BLOCK.METAL);
          }
        }
      }
    }
    // Raised sword arm (extending east + up from torso at height ~14)
    for (var rsh = 0; rsh <= 6; rsh++) {
      setBlock(rmx + 2 + rsh, rmby + 16 - rsh, rmz, BLOCK.METAL);
    }
    // Shield arm (west side)
    for (var rsw = 0; rsw <= 3; rsw++) {
      setBlock(rmx - 2 - rsw, rmby + 14 + rsw, rmz, BLOCK.REINFORCED);
    }
    // Head (top, small block cluster)
    setBlock(rmx, rmby + 19, rmz, BLOCK.CONCRETE);
    setBlock(rmx, rmby + 20, rmz, BLOCK.CONCRETE);
    setBlock(rmx - 1, rmby + 20, rmz, BLOCK.CONCRETE);
    setBlock(rmx + 1, rmby + 20, rmz, BLOCK.CONCRETE);
    setBlock(rmx, rmby + 21, rmz, BLOCK.METAL); // spire tip

    // ── C. Pechersk Lavra Bell Tower (x=22, z=46) — 30 blocks tall ───────
    // The Great Bell Tower of the Kyiv-Pechersk Lavra monastery
    var lbx = ox + 22, lbz = oz + 46;
    var lby = gh(lbx, lbz);
    for (var lth = 1; lth <= 28; lth++) {
      var ltW = lth < 8 ? 4 : lth < 20 ? 3 : 2;
      for (var ltx = -ltW; ltx <= ltW; ltx++) {
        for (var ltz = -ltW; ltz <= ltW; ltz++) {
          if (Math.abs(ltx) === ltW || Math.abs(ltz) === ltW) {
            setBlock(lbx + ltx, lby + lth, lbz + ltz, BLOCK.STONE);
          }
        }
      }
      // Bell openings at floor 18-22
      if (lth >= 18 && lth <= 22) {
        setBlock(lbx - 2, lby + lth, lbz, BLOCK.AIR);
        setBlock(lbx + 2, lby + lth, lbz, BLOCK.AIR);
        setBlock(lbx, lby + lth, lbz - 2, BLOCK.AIR);
        setBlock(lbx, lby + lth, lbz + 2, BLOCK.AIR);
      }
    }
    // Baroque golden dome on top
    for (var brd = -2; brd <= 2; brd++) {
      for (var brdz = -2; brdz <= 2; brdz++) {
        if (brd * brd + brdz * brdz <= 5) {
          setBlock(lbx + brd, lby + 29, lbz + brdz, BLOCK.LIGHT);
        }
      }
    }
    setBlock(lbx, lby + 30, lbz, BLOCK.LIGHT);
    setBlock(lbx, lby + 31, lbz, BLOCK.METAL);

    // ── C2. NSC Olimpiysky Stadium (x=-8, z=-80) — south of Maidan ──────
    // Ukraine's national stadium, 70,000 capacity. Hosted Euro 2012.
    var stx = ox - 8, stz = oz - 80;
    var stby = gh(stx, stz);
    // Outer stadium bowl (oval ring structure, concrete)
    for (var stA = 0; stA < 16; stA++) {
      var stAng = (stA / 16) * Math.PI * 2;
      var stEx = Math.round(Math.cos(stAng) * 20);
      var stEz = Math.round(Math.sin(stAng) * 14);
      for (var stH = 1; stH <= 8; stH++) {
        setBlock(stx + stEx, stby + stH, stz + stEz, BLOCK.CONCRETE);
        setBlock(stx + stEx + Math.round(Math.cos(stAng)), stby + stH, stz + stEz + Math.round(Math.sin(stAng)), BLOCK.CONCRETE);
      }
    }
    // Iconic roof arch — steel arches over the long axis
    for (var archX2 = -22; archX2 <= 22; archX2++) {
      var archH2 = Math.round(10 - (archX2 * archX2) / 55.0);
      if (archH2 >= 6) {
        setBlock(stx + archX2, stby + archH2, stz - 14, BLOCK.METAL);
        setBlock(stx + archX2, stby + archH2, stz + 14, BLOCK.METAL);
      }
    }
    // Field interior (grass)
    for (var fx2 = -16; fx2 <= 16; fx2++) {
      for (var fz2 = -10; fz2 <= 10; fz2++) {
        if ((fx2 * fx2) / 256.0 + (fz2 * fz2) / 100.0 < 1.0) {
          setBlock(stx + fx2, stby, stz + fz2, BLOCK.GRASS);
        }
      }
    }

    // ── D. Extended Khreshchatyk south (more city behind player) ─────────
    for (var ks = oz - 80; ks < oz - 45; ks++) {
      for (var kx = ox - 5; kx <= ox + 5; kx++) {
        setBlock(kx, gh(kx, ks), ks, BLOCK.ASPHALT);
      }
      if ((ks + 80) % 3 === 0) setBlock(ox, gh(ox, ks), ks, BLOCK.WHITE_TILE);
    }
    // City blocks south of Maidan
    generateUkrainianApartment(ox - 22, oz - 72, 9);
    generateUkrainianApartment(ox - 22, oz - 56, 9);
    generateUkrainianApartment(ox + 12, oz - 70, 9);
    generateUkrainianApartment(ox + 12, oz - 54, 9);
    // More east blocks (Pechersk district)
    generateUkrainianApartment(ox + 35, oz - 40, 6);
    generateUkrainianApartment(ox + 35, oz - 22, 12);
    generateUkrainianApartment(ox + 35, oz - 4, 9);

    // ── E. Dnipro River (east side, water channel x=60-76) ───────────────
    for (var drz = oz - 80; drz <= oz + 50; drz++) {
      for (var drx = ox + 60; drx <= ox + 76; drx++) {
        var dry = gh(drx, drz);
        setBlock(drx, dry, drz, BLOCK.WATER);
      }
      // Riverbanks (dirt/grass)
      setBlock(ox + 59, gh(ox + 59, drz), drz, BLOCK.DIRT);
      setBlock(ox + 77, gh(ox + 77, drz), drz, BLOCK.DIRT);
    }

    // ── F. Irpin/Bucha suburban housing (z=130-195) ──────────────────────
    var subLayout = [
      [ox - 18, oz + 135], [ox + 6,  oz + 137], [ox - 18, oz + 156],
      [ox + 6,  oz + 158], [ox - 16, oz + 178], [ox + 8,  oz + 180],
    ];
    for (var si = 0; si < subLayout.length; si++) {
      var sx = subLayout[si][0], sz = subLayout[si][1];
      var shy = gh(sx, sz);
      for (var sbbx = 0; sbbx < 8; sbbx++) {
        for (var sbbz = 0; sbbz < 6; sbbz++) {
          for (var sbby = 1; sbby <= 4; sbby++) {
            if (sbbx === 0 || sbbx === 7 || sbbz === 0 || sbbz === 5 || sbby === 4) {
              setBlock(sx + sbbx, shy + sbby, sz + sbbz, BLOCK.BRICK);
            }
          }
        }
      }
      // Roof
      for (var srx = 0; srx < 8; srx++) {
        for (var srz = 0; srz < 6; srz++) setBlock(sx + srx, shy + 5, sz + srz, BLOCK.ROOFTILE);
      }
      // Yard gate
      setBlock(sx + 3, shy, sz, BLOCK.FENCE);
      setBlock(sx + 4, shy, sz, BLOCK.FENCE);
    }
    // Road through the suburbs
    for (var subRz = oz + 125; subRz <= oz + 200; subRz++) {
      for (var subRx = ox - 2; subRx <= ox + 2; subRx++) {
        setBlock(subRx, gh(subRx, subRz), subRz, BLOCK.ASPHALT);
      }
      if (subRz % 3 === 0) setBlock(ox, gh(ox, subRz), subRz, BLOCK.WHITE_TILE);
      _roadWaypoints.push(new THREE.Vector3(ox, gh(ox, subRz) + 0.5, subRz));
    }

    // ── G. Irpin River crossing (z=240-252, water channel) ───────────────
    for (var irx = ox - 35; irx <= ox + 35; irx++) {
      for (var irw = 0; irw < 10; irw++) {
        var iry = gh(irx, oz + 242 + irw);
        setBlock(irx, iry, oz + 242 + irw, BLOCK.WATER);
      }
      // Banks
      setBlock(irx, gh(irx, oz + 241), oz + 241, BLOCK.DIRT);
      setBlock(irx, gh(irx, oz + 252), oz + 252, BLOCK.DIRT);
    }
    // Romanivska Bridge (partially destroyed — 2022)
    for (var brx = ox - 3; brx <= ox + 3; brx++) {
      for (var brz = oz + 240; brz <= oz + 254; brz++) {
        var bry = gh(brx, brz);
        if (brz >= oz + 244 && brz <= oz + 250) {
          setBlock(brx, bry + 1, brz, BLOCK.BRIDGE);
          setBlock(brx, bry + 2, brz, BLOCK.BRIDGE);
        }
      }
      // Destroyed span (collapsed section)
      setBlock(brx, gh(brx, oz + 247), oz + 247, BLOCK.RUBBLE);
      setBlock(brx, gh(brx, oz + 248), oz + 248, BLOCK.RUBBLE);
    }

    // ── H. Extended highway approach north of Irpin (z=255-400) ─────────
    for (var ehz = oz + 255; ehz <= oz + 400; ehz++) {
      for (var ehx = ox - 3; ehx <= ox + 3; ehx++) {
        setBlock(ehx, gh(ehx, ehz), ehz, BLOCK.ASPHALT);
      }
      if (ehz % 3 === 0) setBlock(ox, gh(ox, ehz), ehz, BLOCK.WHITE_TILE);
      if (ehz % 8 === 0) {
        setBlock(ox - 5, gh(ox - 5, ehz) + 1, ehz, BLOCK.PARK_TREE);
        setBlock(ox - 5, gh(ox - 5, ehz) + 2, ehz, BLOCK.PARK_TREE);
        setBlock(ox + 5, gh(ox + 5, ehz) + 1, ehz, BLOCK.PARK_TREE);
        setBlock(ox + 5, gh(ox + 5, ehz) + 2, ehz, BLOCK.PARK_TREE);
      }
      _roadWaypoints.push(new THREE.Vector3(ox, gh(ox, ehz) + 0.5, ehz));
    }

    // ── I0. Trench / defensive fighting positions at player line (z=12-18) ─
    // Ukrainian TDF dug in here during the Kyiv defense — sandbag parapets
    // and firing bays overlooking the northern approach road.
    for (var tsx = ox - 16; tsx <= ox + 16; tsx++) {
      var tsy = gh(tsx, oz + 14);
      // Main parapet wall (sandbags front face)
      if (tsx !== ox - 1 && tsx !== ox && tsx !== ox + 1) { // gap for player position
        setBlock(tsx, tsy + 1, oz + 14, BLOCK.SANDBAG);
        setBlock(tsx, tsy + 2, oz + 14, BLOCK.SANDBAG);
      }
      // Firing step (concrete floor behind sandbag)
      setBlock(tsx, tsy,     oz + 15, BLOCK.CONCRETE);
      setBlock(tsx, tsy,     oz + 16, BLOCK.CONCRETE);
      // Back wall
      if (tsx % 5 === 0) {
        setBlock(tsx, tsy + 1, oz + 17, BLOCK.SANDBAG);
        setBlock(tsx, tsy + 2, oz + 17, BLOCK.SANDBAG);
      }
    }
    // Traverse walls (divide trench into bays to limit blast propagation)
    for (var bay = -3; bay <= 3; bay += 3) {
      var basx = ox + bay * 4;
      var bayY = gh(basx, oz + 15);
      for (var bayZ = 14; bayZ <= 17; bayZ++) {
        setBlock(basx, bayY + 1, oz + bayZ, BLOCK.SANDBAG);
        setBlock(basx, bayY + 2, oz + bayZ, BLOCK.SANDBAG);
      }
    }

    // ── I1. ZU-23-2 anti-aircraft emplacement near Maidan ────────────
    // Ukrainian forces placed ZU-23-2s on rooftops and at street positions
    // to shoot down low-flying helicopters and Shahed drones.
    var zuX = ox - 22, zuZ = oz + 8;
    var zuY = gh(zuX, zuZ);
    // Sandbag ring (radius ~3)
    for (var zuA = 0; zuA < 8; zuA++) {
      var zuAx = zuX + Math.round(Math.cos(zuA * Math.PI / 4) * 3);
      var zuAz = zuZ + Math.round(Math.sin(zuA * Math.PI / 4) * 3);
      setBlock(zuAx, gh(zuAx, zuAz) + 1, zuAz, BLOCK.SANDBAG);
      setBlock(zuAx, gh(zuAx, zuAz) + 2, zuAz, BLOCK.SANDBAG);
    }
    // Gun pad (concrete circle inside)
    for (var zpx = -2; zpx <= 2; zpx++) {
      for (var zpz = -2; zpz <= 2; zpz++) {
        if (zpx * zpx + zpz * zpz <= 5) {
          setBlock(zuX + zpx, zuY, zuZ + zpz, BLOCK.CONCRETE);
        }
      }
    }
    // ZU-23-2 gun body (METAL block representation)
    setBlock(zuX, zuY + 1, zuZ, BLOCK.METAL);
    setBlock(zuX, zuY + 1, zuZ - 1, BLOCK.METAL);
    setBlock(zuX, zuY + 1, zuZ - 2, BLOCK.METAL); // barrel

    // ── I2. Artillery craters in the approach corridor ───────────────
    // Russian Grad/Uragan strikes left scattered impact craters along
    // the Kyiv-Hostomel highway approach.
    var craterPositions = [
      { x: ox - 6, z: oz + 55 },  { x: ox + 12, z: oz + 63 },
      { x: ox - 14, z: oz + 72 }, { x: ox + 4, z: oz + 85 },
      { x: ox - 3,  z: oz + 94 }, { x: ox + 16, z: oz + 103 },
      { x: ox - 10, z: oz + 115 },{ x: ox + 8,  z: oz + 122 },
    ];
    for (var cri = 0; cri < craterPositions.length; cri++) {
      var cp = craterPositions[cri];
      var crY = gh(cp.x, cp.z);
      // Rubble/debris ring around crater
      for (var crx2 = -3; crx2 <= 3; crx2++) {
        for (var crz2 = -3; crz2 <= 3; crz2++) {
          var cdist = Math.sqrt(crx2 * crx2 + crz2 * crz2);
          if (cdist > 1.8 && cdist <= 3.0) {
            var crBlock = (Math.abs(crx2 + crz2) % 3 === 0) ? BLOCK.RUBBLE : BLOCK.DIRT;
            setBlock(cp.x + crx2, crY + 1, cp.z + crz2, crBlock);
          }
        }
      }
      // Scorch center
      setBlock(cp.x, crY, cp.z, BLOCK.RUBBLE);
      // Occasional still-burning spot (every other crater)
      if (cri % 2 === 0) setBlock(cp.x, crY + 1, cp.z, BLOCK.FIRE);
    }

    // ── I. Czech hedgehog anti-tank barriers along the approach ─────────
    // Iconic concrete/metal X-shaped barriers placed by Ukraine across entry roads
    var hedgehogPositions = [
      { x: ox - 7,  z: oz + 22 }, { x: ox + 7,  z: oz + 24 },
      { x: ox - 9,  z: oz + 30 }, { x: ox + 9,  z: oz + 32 },
      { x: ox - 7,  z: oz + 38 }, { x: ox + 7,  z: oz + 40 },
      { x: ox - 10, z: oz + 48 }, { x: ox + 10, z: oz + 50 },
      { x: ox - 8,  z: oz + 60 }, { x: ox + 8,  z: oz + 62 },
    ];
    for (var hi = 0; hi < hedgehogPositions.length; hi++) {
      var hgp = hedgehogPositions[hi];
      var hgy = gh(hgp.x, hgp.z);
      // Horizontal beam
      setBlock(hgp.x - 1, hgy + 1, hgp.z, BLOCK.REINFORCED);
      setBlock(hgp.x,     hgy + 1, hgp.z, BLOCK.REINFORCED);
      setBlock(hgp.x + 1, hgy + 1, hgp.z, BLOCK.REINFORCED);
      // Vertical post
      setBlock(hgp.x, hgy + 2, hgp.z, BLOCK.REINFORCED);
      // Diagonal cross-beam (z axis)
      setBlock(hgp.x, hgy + 1, hgp.z - 1, BLOCK.REINFORCED);
      setBlock(hgp.x, hgy + 1, hgp.z + 1, BLOCK.REINFORCED);
      // Sandbag pile at base
      setBlock(hgp.x - 1, hgy + 1, hgp.z + 1, BLOCK.SANDBAG);
      setBlock(hgp.x + 1, hgy + 1, hgp.z - 1, BLOCK.SANDBAG);
    }

    // ── J. Wrecked Russian vehicles in approach corridor ─────────────
    // Destroyed T-72 and BTR-82A hulks from the Kyiv offensive, 2022
    // These serve as obstacles and cover for the player
    function spawnWreckedTank(wx, wz) {
      var wy = gh(wx, wz);
      // Hull (T-72 style, 8 long × 4 wide × 2 high)
      for (var thx = 0; thx < 8; thx++) {
        for (var thz = 0; thz < 4; thz++) {
          for (var thy = 1; thy <= 2; thy++) {
            var isOuter = thx === 0 || thx === 7 || thz === 0 || thz === 3 || thy === 2;
            if (isOuter) setBlock(wx + thx, wy + thy, wz + thz, BLOCK.METAL);
          }
        }
      }
      // Turret (shifted right + raised)
      for (var ttx = 2; ttx <= 5; ttx++) {
        for (var ttz = 0; ttz <= 3; ttz++) {
          setBlock(wx + ttx, wy + 3, wz + ttz, BLOCK.METAL);
          if (ttx === 3 && ttz === 1) setBlock(wx + ttx, wy + 4, wz + ttz, BLOCK.METAL); // commander hatch
        }
      }
      // Gun barrel (blasted off, broken)
      setBlock(wx + 5, wy + 3, wz + 1, BLOCK.METAL);
      setBlock(wx + 6, wy + 3, wz + 1, BLOCK.METAL);
      // Rubble/blast damage around the wreck
      for (var rbx2 = -1; rbx2 <= 9; rbx2++) {
        for (var rbz2 = -1; rbz2 <= 5; rbz2++) {
          if ((rbx2 === -1 || rbx2 === 9) || (rbz2 === -1 || rbz2 === 5)) {
            if (Math.abs(rbx2 + rbz2) % 3 === 0) {
              setBlock(wx + rbx2, wy + 1, wz + rbz2, BLOCK.RUBBLE);
            }
          }
        }
      }
      // Fire from engine compartment (rear)
      setBlock(wx + 7, wy + 2, wz + 1, BLOCK.FIRE);
      setBlock(wx + 7, wy + 3, wz + 1, BLOCK.FIRE);
    }

    function spawnWreckedBTR(wx, wz) {
      var wy = gh(wx, wz);
      // BTR-82A hull (6 long × 3 wide × 2 high, more rounded than tank)
      for (var btrx = 0; btrx < 6; btrx++) {
        for (var btrz = 0; btrz < 3; btrz++) {
          for (var btry = 1; btry <= 2; btry++) {
            var isOuter2 = btrx === 0 || btrx === 5 || btrz === 0 || btrz === 2 || btry === 2;
            if (isOuter2) setBlock(wx + btrx, wy + btry, wz + btrz, BLOCK.METAL);
          }
        }
      }
      // Small turret (23mm cannon mount)
      setBlock(wx + 3, wy + 3, wz + 1, BLOCK.METAL);
      setBlock(wx + 4, wy + 3, wz + 1, BLOCK.METAL);
      // Rubble and scorch marks
      setBlock(wx + 2, wy + 1, wz - 1, BLOCK.RUBBLE);
      setBlock(wx + 4, wy + 1, wz + 3, BLOCK.RUBBLE);
      setBlock(wx + 5, wy + 2, wz + 1, BLOCK.FIRE);
    }

    // Place wrecks at historically-authentic positions along the Kyiv approach
    spawnWreckedTank(ox + 10, oz + 32);    // blocking right lane at hedgehog line
    spawnWreckedTank(ox - 18, oz + 68);   // overturned on roadside
    spawnWreckedTank(ox + 12, oz + 98);   // mid-corridor choke point
    spawnWreckedBTR(ox - 12, oz + 45);    // BTR-82A in left lane
    spawnWreckedBTR(ox + 6,  oz + 78);    // second BTR near apartment blocks
    spawnWreckedBTR(ox - 8,  oz + 112);   // near entrance to Irpin suburbs

    // ── K. Arsenalna metro station entrance (deepest in world) ──────
    // In real Kyiv this is on Khreshchatyk — here near Maidan (x=8, z=-18)
    var mx = ox + 8, mz = oz - 18;
    var mby = gh(mx, mz);
    // Staircase surround (concrete walls)
    for (var msx = 0; msx < 6; msx++) {
      setBlock(mx + msx, mby + 1, mz,     BLOCK.CONCRETE);
      setBlock(mx + msx, mby + 1, mz + 4, BLOCK.CONCRETE);
    }
    setBlock(mx,     mby + 1, mz + 1, BLOCK.CONCRETE);
    setBlock(mx,     mby + 1, mz + 2, BLOCK.CONCRETE);
    setBlock(mx,     mby + 1, mz + 3, BLOCK.CONCRETE);
    setBlock(mx + 5, mby + 1, mz + 1, BLOCK.CONCRETE);
    setBlock(mx + 5, mby + 1, mz + 2, BLOCK.CONCRETE);
    setBlock(mx + 5, mby + 1, mz + 3, BLOCK.CONCRETE);
    // Staircase steps (descending into ground)
    setBlock(mx + 1, mby,     mz + 1, BLOCK.WHITE_TILE);
    setBlock(mx + 2, mby,     mz + 2, BLOCK.WHITE_TILE);
    setBlock(mx + 3, mby,     mz + 2, BLOCK.WHITE_TILE);
    setBlock(mx + 4, mby,     mz + 3, BLOCK.WHITE_TILE);
    // "M" metro sign post
    setBlock(mx + 2, mby + 1, mz - 1, BLOCK.METAL);
    setBlock(mx + 2, mby + 2, mz - 1, BLOCK.METAL);
    setBlock(mx + 2, mby + 3, mz - 1, BLOCK.LIGHT);  // blue metro light
    setBlock(mx + 3, mby + 3, mz - 1, BLOCK.LIGHT);

    // ── L. Kyiv Funicular — upper and lower stations (x=-28, z=-55) ──
    // The cable funicular connects Podil (lower city) to the Upper city.
    // Built 1905, it runs up the steep Volodymyrska Hill.
    var fuX = ox - 28, fuZ = oz - 55;
    var fuYup = gh(fuX, fuZ) + 1;
    // Upper station building (concrete, 5×4×5)
    for (var fux = 0; fux < 5; fux++) {
      for (var fuz = 0; fuz < 4; fuz++) {
        for (var fuy = 1; fuy <= 5; fuy++) {
          var fuWall = fux === 0 || fux === 4 || fuz === 0 || fuz === 3 || fuy === 5;
          if (fuWall) setBlock(fuX + fux, fuYup + fuy, fuZ + fuz, BLOCK.CONCRETE);
        }
      }
    }
    // Glass windows on upper station
    setBlock(fuX + 1, fuYup + 2, fuZ,     BLOCK.GLASS);
    setBlock(fuX + 2, fuYup + 2, fuZ,     BLOCK.GLASS);
    setBlock(fuX + 3, fuYup + 2, fuZ,     BLOCK.GLASS);
    // Roof tiles
    for (var frx = 0; frx < 5; frx++) {
      for (var frz = 0; frz < 4; frz++) {
        setBlock(fuX + frx, fuYup + 6, fuZ + frz, BLOCK.ROOFTILE);
      }
    }
    // Lower station (8 blocks downslope along z — simulate the hill slope)
    var flX = fuX - 2, flZ = fuZ + 8;
    var fuYlo = Math.max(fuYup - 3, gh(flX, flZ) + 1);
    for (var flx = 0; flx < 5; flx++) {
      for (var flz = 0; flz < 4; flz++) {
        for (var fly = 1; fly <= 4; fly++) {
          var flWall = flx === 0 || flx === 4 || flz === 0 || flz === 3 || fly === 4;
          if (flWall) setBlock(flX + flx, fuYlo + fly, flZ + flz, BLOCK.BRICK);
        }
      }
    }
    setBlock(flX + 1, fuYlo + 2, flZ,     BLOCK.GLASS);
    setBlock(flX + 2, fuYlo + 2, flZ,     BLOCK.GLASS);
    // Cable support posts (METAL, spaced 4 apart up the slope)
    for (var fp = 0; fp < 3; fp++) {
      var fpZ = fuZ + 4 + fp * 4;
      var fpY = gh(fuX + 1, fpZ);
      setBlock(fuX + 1, fpY + 1, fpZ, BLOCK.METAL);
      setBlock(fuX + 1, fpY + 2, fpZ, BLOCK.METAL);
      setBlock(fuX + 1, fpY + 3, fpZ, BLOCK.METAL);
    }
    // Track rails (ASPHALT strip connecting upper and lower stations)
    for (var ftr = 0; ftr < 10; ftr++) {
      var ftrZ = fuZ + ftr;
      var ftrY = gh(fuX + 2, ftrZ);
      setBlock(fuX + 1, ftrY, ftrZ, BLOCK.ASPHALT);
      setBlock(fuX + 3, ftrY, ftrZ, BLOCK.ASPHALT);
    }

    // ── N. Kyiv TV Tower (struck March 2022, northeast of Maidan) ───
    // Tall lattice tower near Babyn Yar — iconic skyline feature.
    // The adjacent broadcast infrastructure was hit by a Russian missile
    // on 1 March 2022, killing 5 people near Babyn Yar Memorial.
    var tvx = ox + 22, tvz = oz - 60;
    var tvby = gh(tvx, tvz);
    // Tripod base legs (concrete, 3 legs at 120° each)
    for (var tvLi = 0; tvLi < 3; tvLi++) {
      var tvAng = (tvLi / 3) * Math.PI * 2;
      var tvLx = tvx + Math.round(Math.cos(tvAng) * 3);
      var tvLz = tvz + Math.round(Math.sin(tvAng) * 3);
      for (var tvLh = 1; tvLh <= 5; tvLh++) {
        setBlock(tvLx, tvby + tvLh, tvLz, BLOCK.CONCRETE);
      }
    }
    // Central column from top of tripod
    for (var tvCy = 6; tvCy <= 12; tvCy++) {
      setBlock(tvx, tvby + tvCy, tvz, BLOCK.CONCRETE);
    }
    // Main lattice shaft (METAL, with cross-brace rings every 4 blocks)
    for (var tvH = 13; tvH <= 38; tvH++) {
      setBlock(tvx, tvby + tvH, tvz, BLOCK.METAL);
      if (tvH % 4 === 1) {
        setBlock(tvx - 1, tvby + tvH, tvz, BLOCK.METAL);
        setBlock(tvx + 1, tvby + tvH, tvz, BLOCK.METAL);
        setBlock(tvx, tvby + tvH, tvz - 1, BLOCK.METAL);
        setBlock(tvx, tvby + tvH, tvz + 1, BLOCK.METAL);
      }
    }
    // Broadcast deck at height 32 (3×3 platform)
    for (var tvDx = -1; tvDx <= 1; tvDx++) {
      for (var tvDz = -1; tvDz <= 1; tvDz++) {
        setBlock(tvx + tvDx, tvby + 32, tvz + tvDz, BLOCK.METAL);
      }
    }
    // Top spire (above deck)
    for (var tvSp = 39; tvSp <= 44; tvSp++) {
      setBlock(tvx, tvby + tvSp, tvz, BLOCK.METAL);
    }
    // Aviation warning lights (FIRE = red beacon — realistic aviation marking)
    setBlock(tvx, tvby + 26, tvz, BLOCK.FIRE);
    setBlock(tvx, tvby + 44, tvz, BLOCK.FIRE);
    // Blast damage (missile strike rubble at base, north side)
    setBlock(tvx + 2, tvby + 1, tvz - 3, BLOCK.RUBBLE);
    setBlock(tvx - 1, tvby + 1, tvz - 4, BLOCK.RUBBLE);
    setBlock(tvx + 1, tvby + 2, tvz - 3, BLOCK.RUBBLE);
    setBlock(tvx + 3, tvby + 1, tvz - 2, BLOCK.RUBBLE);

    // ── O. Damaged apartment blocks in approach corridor (flanks) ───
    // Multi-story residential buildings partially collapsed from shelling.
    // Offset from the road (x±12-16) so they flank the approach.
    var aptLayout = [
      { x: ox - 15, z: oz + 28 }, { x: ox + 12, z: oz + 42 },
      { x: ox - 16, z: oz + 58 }, { x: ox + 11, z: oz + 74 },
    ];
    for (var aI = 0; aI < aptLayout.length; aI++) {
      var apos = aptLayout[aI];
      var apy = gh(apos.x, apos.z);
      var btype = (aI % 2 === 0) ? BLOCK.CONCRETE : BLOCK.BRICK;
      // 5-story block (10 wide × 5 deep × 14 high)
      for (var abx = 0; abx < 10; abx++) {
        for (var abz = 0; abz < 5; abz++) {
          for (var aby = 1; aby <= 14; aby++) {
            // Upper floors randomly missing (shell damage)
            if (aby > 9 && Math.random() < 0.45) continue;
            var isWall = abx === 0 || abx === 9 || abz === 0 || abz === 4;
            var isFloor = (aby === 4 || aby === 8 || aby === 12);
            if (!isWall && !isFloor) continue;
            // Window openings (leave AIR every 3 columns, on alternating floor levels)
            if (isWall && (aby === 2 || aby === 5 || aby === 9 || aby === 12) && abx % 3 === 1) continue;
            // Upper-floor damage: mix of rubble blocks
            var blk2 = btype;
            if (aby > 8 && Math.random() < 0.38) blk2 = BLOCK.RUBBLE;
            setBlock(apos.x + abx, apy + aby, apos.z + abz, blk2);
          }
        }
      }
      // Rubble scatter at base
      for (var rdx2 = -1; rdx2 <= 10; rdx2++) {
        for (var rdz2 = -1; rdz2 <= 5; rdz2++) {
          if (Math.random() < 0.18) setBlock(apos.x + rdx2, apy + 1, apos.z + rdz2, BLOCK.RUBBLE);
        }
      }
      // Fire pockets in even-indexed buildings
      if (aI % 2 === 0) {
        setBlock(apos.x + 3, apy + 7, apos.z, BLOCK.FIRE);
        setBlock(apos.x + 6, apy + 11, apos.z, BLOCK.FIRE);
      }
    }

    // ── P. Shipping container barrier wall at city entrance (z=20) ──
    // Ukraine stacked steel shipping containers across major roads into Kyiv
    // (Khreshchatyk, Peremohy Ave) as hardened vehicle barriers.
    var ctZ = oz + 20;
    var ctSegments = [
      { x: ox - 15, w: 4 }, { x: ox - 10, w: 3 },
      { x: ox - 2,  w: 5 }, // road gap — narrowed but passable
      { x: ox + 4,  w: 3 }, { x: ox + 8,  w: 4 },
    ];
    for (var cti = 0; cti < ctSegments.length; cti++) {
      var ct = ctSegments[cti];
      var ctBy = gh(ct.x, ctZ);
      // Ground-level container (3 blocks high, 2 deep)
      for (var ctx = 0; ctx < ct.w; ctx++) {
        for (var ctz = 0; ctz < 2; ctz++) {
          for (var cty = 1; cty <= 3; cty++) {
            var ctOuter = ctx === 0 || ctx === ct.w - 1 || ctz === 0 || ctz === 1 || cty === 3;
            if (ctOuter) setBlock(ct.x + ctx, ctBy + cty, ctZ + ctz, BLOCK.METAL);
          }
        }
      }
      // Stacked second container (offset segments for stagger effect)
      if (cti % 2 === 1) {
        for (var ctx2 = 0; ctx2 < ct.w; ctx2++) {
          for (var ctz2 = 0; ctz2 < 2; ctz2++) {
            for (var cty2 = 4; cty2 <= 6; cty2++) {
              var ctOuter2 = ctx2 === 0 || ctx2 === ct.w - 1 || ctz2 === 0 || ctz2 === 1 || cty2 === 6;
              if (ctOuter2) setBlock(ct.x + ctx2, ctBy + cty2, ctZ + ctz2, BLOCK.METAL);
            }
          }
        }
      }
      // Sandbag fill between containers at ground
      for (var sbc = 0; sbc < ct.w; sbc++) {
        setBlock(ct.x + sbc, ctBy + 1, ctZ + 2, BLOCK.SANDBAG);
      }
    }

    // ── Q. Rooftop MG nests (north-facing, covering approach road) ──
    // Ukrainian TDF placed MG teams on rooftops of Maidan-area buildings
    // to provide elevated fire coverage of Khreshchatyk / approach roads.
    var mgRooftops = [
      { x: ox + 12, z: oz - 4 },
      { x: ox - 12, z: oz + 2 },
    ];
    for (var mri = 0; mri < mgRooftops.length; mri++) {
      var mgr = mgRooftops[mri];
      // Find a rooftop height (assume building ~7 blocks)
      var mgrY = gh(mgr.x, mgr.z) + 7;
      // Sandbag parapet (3-side U-shape, open south for access)
      for (var psx = -1; psx <= 1; psx++) {
        setBlock(mgr.x + psx, mgrY + 1, mgr.z - 1, BLOCK.SANDBAG); // north face
        setBlock(mgr.x + psx, mgrY + 2, mgr.z - 1, BLOCK.SANDBAG);
      }
      setBlock(mgr.x - 1, mgrY + 1, mgr.z,     BLOCK.SANDBAG); // west side
      setBlock(mgr.x - 1, mgrY + 2, mgr.z,     BLOCK.SANDBAG);
      setBlock(mgr.x + 1, mgrY + 1, mgr.z,     BLOCK.SANDBAG); // east side
      setBlock(mgr.x + 1, mgrY + 2, mgr.z,     BLOCK.SANDBAG);
      // Floor slab (CONCRETE)
      setBlock(mgr.x - 1, mgrY, mgr.z - 1, BLOCK.CONCRETE);
      setBlock(mgr.x,     mgrY, mgr.z - 1, BLOCK.CONCRETE);
      setBlock(mgr.x + 1, mgrY, mgr.z - 1, BLOCK.CONCRETE);
      setBlock(mgr.x - 1, mgrY, mgr.z,     BLOCK.CONCRETE);
      setBlock(mgr.x,     mgrY, mgr.z,     BLOCK.CONCRETE);
      setBlock(mgr.x + 1, mgrY, mgr.z,     BLOCK.CONCRETE);
      // MG (METAL block on makeshift mount)
      setBlock(mgr.x, mgrY + 1, mgr.z,     BLOCK.METAL); // gun body
      setBlock(mgr.x, mgrY + 2, mgr.z,     BLOCK.METAL); // elevated mount
    }

    // ── R. Dragon's teeth anti-tank obstacles (z=14-16) ─────────────
    // Kyiv approach roads were blocked with concrete pyramid obstacles —
    // "dragon's teeth" — to channel armour into kill zones.
    var dtZ = oz + 15;
    for (var dtx = ox - 18; dtx <= ox + 18; dtx += 3) {
      if (Math.abs(dtx - ox) < 3) continue; // road gap
      var dtY = gh(dtx, dtZ);
      // Pyramid pair (two CONCRETE staggered peaks simulate the zigzag pattern)
      setBlock(dtx,     dtY + 1, dtZ,     BLOCK.CONCRETE);
      setBlock(dtx,     dtY + 2, dtZ,     BLOCK.CONCRETE);
      setBlock(dtx + 1, dtY + 1, dtZ + 1, BLOCK.CONCRETE);
      setBlock(dtx + 1, dtY + 2, dtZ + 1, BLOCK.CONCRETE);
      setBlock(dtx,     dtY + 1, dtZ + 2, BLOCK.CONCRETE);
    }
    // Second staggered row 2m behind
    for (var dtx2 = ox - 17; dtx2 <= ox + 17; dtx2 += 3) {
      if (Math.abs(dtx2 - ox) < 2) continue;
      var dtY2 = gh(dtx2, dtZ + 3);
      setBlock(dtx2, dtY2 + 1, dtZ + 3, BLOCK.CONCRETE);
      setBlock(dtx2, dtY2 + 2, dtZ + 3, BLOCK.CONCRETE);
    }

    // ── S. Kyiv metro station entrance (Arsenalna-style, deepest station) ──
    // Ukrainian civilians spent weeks sheltering in Kyiv metro during the siege.
    // Build an above-ground entrance kiosk on the city block.
    var msx = ox + 8, msz = oz - 8;
    var msY = gh(msx, msz);
    // Red-brick entrance pavilion (classic Soviet metro kiosk)
    for (var msb = 0; msb < 5; msb++) {
      for (var msbz = 0; msbz < 5; msbz++) {
        // Walls only
        if (msb === 0 || msb === 4 || msbz === 0 || msbz === 4) {
          for (var msh = 1; msh <= 4; msh++) {
            setBlock(msx + msb, msY + msh, msz + msbz, BLOCK.BRICK);
          }
        }
      }
    }
    // Roof (concrete slab)
    for (var mrx = 0; mrx < 5; mrx++) {
      for (var mrz = 0; mrz < 5; mrz++) {
        setBlock(msx + mrx, msY + 5, msz + mrz, BLOCK.CONCRETE);
      }
    }
    // Entrance opening (remove 2 blocks from south wall — facade facing street)
    setBlock(msx + 2, msY + 1, msz + 4, BLOCK.AIR);
    setBlock(msx + 2, msY + 2, msz + 4, BLOCK.AIR);
    // Down-escalator portal (dark interior floor — glass tiles light it)
    setBlock(msx + 2, msY + 1, msz + 3, BLOCK.GLASS);
    setBlock(msx + 2, msY + 1, msz + 2, BLOCK.WHITE_TILE);
    // Blue metro "M" sign pillars
    setBlock(msx + 1, msY + 5, msz + 2, BLOCK.METAL);
    setBlock(msx + 3, msY + 5, msz + 2, BLOCK.METAL);
    setBlock(msx + 2, msY + 6, msz + 2, BLOCK.METAL);
    // Civilian shelter sign (flag)
    setBlock(msx + 2, msY + 7, msz + 2, BLOCK.FLAG);
    // Sandbag protection ring around entrance
    for (var sb2 = -1; sb2 <= 5; sb2++) {
      setBlock(msx + sb2, msY + 1, msz - 1, BLOCK.SANDBAG);
      setBlock(msx + sb2, msY + 1, msz + 5, BLOCK.SANDBAG);
    }
    setBlock(msx - 1, msY + 1, msz,     BLOCK.SANDBAG);
    setBlock(msx - 1, msY + 1, msz + 1, BLOCK.SANDBAG);
    setBlock(msx - 1, msY + 1, msz + 2, BLOCK.SANDBAG);
    setBlock(msx + 5, msY + 1, msz,     BLOCK.SANDBAG);
    setBlock(msx + 5, msY + 1, msz + 1, BLOCK.SANDBAG);
    setBlock(msx + 5, msY + 1, msz + 2, BLOCK.SANDBAG);

    // ── Z. Artillery/missile impact craters (approach field) ─────────
    // Russian TOS-1A, Grad, and Iskander strikes left craters throughout
    // the Kyiv northern approaches at Hostomel, Bucha, and Irpin.
    var craterPositions = [
      { x: ox + 12, z: oz + 35 }, { x: ox - 8, z: oz + 40 },
      { x: ox + 20, z: oz + 32 }, { x: ox - 18, z: oz + 45 },
      { x: ox + 5,  z: oz + 42 },
    ];
    for (var cri = 0; cri < craterPositions.length; cri++) {
      var cr = craterPositions[cri];
      var crY = gh(cr.x, cr.z);
      // Crater hole (AIR replacing ground blocks)
      setBlock(cr.x,     crY, cr.z,     BLOCK.AIR);
      setBlock(cr.x + 1, crY, cr.z,     BLOCK.AIR);
      setBlock(cr.x,     crY, cr.z + 1, BLOCK.AIR);
      // Ejected earth rim (DIRT mound around edge)
      setBlock(cr.x - 1, crY + 1, cr.z,     BLOCK.DIRT);
      setBlock(cr.x + 2, crY + 1, cr.z,     BLOCK.DIRT);
      setBlock(cr.x,     crY + 1, cr.z - 1, BLOCK.DIRT);
      setBlock(cr.x + 1, crY + 1, cr.z + 2, BLOCK.DIRT);
      // Rubble scatter
      setBlock(cr.x - 1, crY + 1, cr.z + 2, BLOCK.RUBBLE);
      setBlock(cr.x + 2, crY + 1, cr.z - 1, BLOCK.RUBBLE);
    }

    // ── AA. Military checkpoint gate (controlled access point) ───────
    // Ukrainian Territorial Defense Forces set up checkpoint gates
    // with concrete barriers and guard booths on all approach roads.
    var cpX = ox, cpZ = oz + 36;
    var cpY = gh(cpX, cpZ);
    // Concrete barriers either side of road (left flank)
    for (var cb = 0; cb < 3; cb++) {
      setBlock(cpX - 8 + cb, cpY + 1, cpZ, BLOCK.CONCRETE);
      setBlock(cpX - 8 + cb, cpY + 2, cpZ, BLOCK.CONCRETE);
    }
    // Right flank concrete barriers
    for (var cb2 = 0; cb2 < 3; cb2++) {
      setBlock(cpX + 6 + cb2, cpY + 1, cpZ, BLOCK.CONCRETE);
      setBlock(cpX + 6 + cb2, cpY + 2, cpZ, BLOCK.CONCRETE);
    }
    // Guard booth (BRICK, 3×3)
    for (var gbx = 0; gbx < 3; gbx++) {
      for (var gbz = 0; gbz < 3; gbz++) {
        if (gbx === 0 || gbx === 2 || gbz === 0 || gbz === 2) {
          setBlock(cpX - 12 + gbx, cpY + 1, cpZ + gbz, BLOCK.BRICK);
          setBlock(cpX - 12 + gbx, cpY + 2, cpZ + gbz, BLOCK.BRICK);
        }
      }
    }
    // Booth roof
    for (var grx = 0; grx < 3; grx++) {
      for (var grz = 0; grz < 3; grz++) {
        setBlock(cpX - 12 + grx, cpY + 3, cpZ + grz, BLOCK.CONCRETE);
      }
    }
    // Barrier pole across road (METAL, single block span)
    setBlock(cpX - 5, cpY + 2, cpZ, BLOCK.METAL);
    setBlock(cpX - 4, cpY + 2, cpZ, BLOCK.METAL);
    setBlock(cpX - 3, cpY + 2, cpZ, BLOCK.METAL);
    setBlock(cpX - 2, cpY + 2, cpZ, BLOCK.METAL);
    setBlock(cpX - 1, cpY + 2, cpZ, BLOCK.METAL);
    setBlock(cpX,     cpY + 2, cpZ, BLOCK.METAL);
    // Sandbag protection for guards
    setBlock(cpX - 11, cpY + 1, cpZ + 4, BLOCK.SANDBAG);
    setBlock(cpX - 10, cpY + 1, cpZ + 4, BLOCK.SANDBAG);
    // Ukrainian flag at checkpoint
    setBlock(cpX - 10, cpY + 4, cpZ + 1, BLOCK.FLAG);

    // ── X. CONCRETE pillbox / sniper OP on elevated position ────────
    // Ukrainian snipers used rooftop concrete OPs to observe approach roads.
    // Small fortified observation post with loophole and flag.
    var opX = ox + 18, opZ = oz - 6;
    var opY = gh(opX, opZ) + 6; // elevated on existing building height
    // 3×3 pillbox (concrete walls, open top for observation)
    for (var px = 0; px < 3; px++) {
      for (var pz = 0; pz < 3; pz++) {
        if (px === 0 || px === 2 || pz === 0 || pz === 2) {
          setBlock(opX + px, opY + 1, opZ + pz, BLOCK.CONCRETE);
          setBlock(opX + px, opY + 2, opZ + pz, BLOCK.CONCRETE);
        }
      }
    }
    // Loophole (opening facing north = enemy direction)
    setBlock(opX + 1, opY + 1, opZ, BLOCK.AIR); // viewport
    // Sandbag fill on remaining open top
    setBlock(opX + 1, opY + 3, opZ + 1, BLOCK.SANDBAG);
    // Ukrainian flag pole
    setBlock(opX + 2, opY + 3, opZ + 2, BLOCK.METAL);
    setBlock(opX + 2, opY + 4, opZ + 2, BLOCK.FLAG);

    // ── Y. Civilian car roadblock (burnt cars across road) ───────────
    // Ukraine placed civilian cars — often burnt — across roads as a
    // low-tech barrier to slow Russian vehicle advances in suburbs.
    var cbZ = oz + 30;
    var carPositions = [
      { x: ox - 6 }, { x: ox - 3 }, { x: ox + 3 }, { x: ox + 6 },
    ];
    for (var ci = 0; ci < carPositions.length; ci++) {
      var cbx = carPositions[ci].x;
      var cbY = gh(cbx, cbZ);
      // Car body (METAL, burnt)
      setBlock(cbx,     cbY + 1, cbZ,     BLOCK.METAL);
      setBlock(cbx + 1, cbY + 1, cbZ,     BLOCK.METAL);
      setBlock(cbx,     cbY + 1, cbZ + 1, BLOCK.METAL);
      setBlock(cbx + 1, cbY + 1, cbZ + 1, BLOCK.METAL);
      setBlock(cbx,     cbY + 2, cbZ,     BLOCK.METAL);
      setBlock(cbx + 1, cbY + 2, cbZ,     BLOCK.METAL);
      setBlock(cbx,     cbY + 2, cbZ + 1, BLOCK.METAL);
      setBlock(cbx + 1, cbY + 2, cbZ + 1, BLOCK.METAL);
      // Fire in some cars
      if (ci % 2 === 0) {
        setBlock(cbx,     cbY + 3, cbZ,     BLOCK.FIRE);
        setBlock(cbx + 1, cbY + 3, cbZ + 1, BLOCK.FIRE);
      }
      // Rubble scatter
      setBlock(cbx - 1, cbY + 1, cbZ,     BLOCK.RUBBLE);
      setBlock(cbx + 2, cbY + 1, cbZ + 1, BLOCK.RUBBLE);
    }

    // ── V. Destroyed Russian BMP-2 wreck (in approach corridor) ─────
    // Burnt-out Russian IFVs and tanks were left on Kyiv approach roads
    // as monuments to the failed assault and defensive fire success.
    var bmpX = ox + 3, bmpZ = oz + 24;
    var bmpY = gh(bmpX, bmpZ);
    // Burnt hull (METAL, dark from fire)
    for (var bhx = 0; bhx < 5; bhx++) {
      for (var bhz = 0; bhz < 3; bhz++) {
        if (bhx === 0 || bhx === 4 || bhz === 0 || bhz === 2) {
          setBlock(bmpX + bhx, bmpY + 1, bmpZ + bhz, BLOCK.METAL);
        }
      }
      setBlock(bmpX + bhx, bmpY + 1, bmpZ + 1, BLOCK.RUBBLE);
    }
    // Turret remnant (skewed off to one side — knocked off by explosion)
    setBlock(bmpX + 2, bmpY + 2, bmpZ,     BLOCK.METAL);
    setBlock(bmpX + 3, bmpY + 2, bmpZ - 1, BLOCK.METAL);
    setBlock(bmpX + 4, bmpY + 2, bmpZ - 1, BLOCK.METAL);
    // Barrel (still pointing forward)
    setBlock(bmpX + 5, bmpY + 2, bmpZ - 1, BLOCK.METAL);
    setBlock(bmpX + 6, bmpY + 2, bmpZ - 1, BLOCK.METAL);
    // Fire pockets
    setBlock(bmpX + 1, bmpY + 2, bmpZ + 1, BLOCK.FIRE);
    setBlock(bmpX + 3, bmpY + 2, bmpZ + 1, BLOCK.FIRE);
    // Rubble scatter around (from detonation)
    for (var rs = 0; rs < 6; rs++) {
      var rsx = bmpX + Math.floor(rs * 2.3 % 7) - 2;
      var rsz = bmpZ + Math.floor(rs * 1.7 % 5) - 1;
      if (rsx !== bmpX + rs % 5) setBlock(rsx, gh(rsx, rsz) + 1, rsz, BLOCK.RUBBLE);
    }

    // ── W. Field hospital / CCP (casualty collection point) ─────────
    // Ukrainian military medics set up aid stations in church basements
    // and apartments — marked with red crosses for Geneva Convention.
    var fhX = ox - 14, fhZ = oz - 14;
    var fhY = gh(fhX, fhZ);
    // White tent structure (WHITE_TILE for the tarp walls)
    for (var fhw = 0; fhw < 4; fhw++) {
      setBlock(fhX + fhw, fhY + 1, fhZ,     BLOCK.WHITE_TILE);
      setBlock(fhX + fhw, fhY + 2, fhZ,     BLOCK.WHITE_TILE);
      setBlock(fhX + fhw, fhY + 1, fhZ + 3, BLOCK.WHITE_TILE);
      setBlock(fhX + fhw, fhY + 2, fhZ + 3, BLOCK.WHITE_TILE);
    }
    setBlock(fhX,     fhY + 1, fhZ + 1, BLOCK.WHITE_TILE);
    setBlock(fhX,     fhY + 2, fhZ + 1, BLOCK.WHITE_TILE);
    setBlock(fhX + 3, fhY + 1, fhZ + 1, BLOCK.WHITE_TILE);
    setBlock(fhX + 3, fhY + 2, fhZ + 1, BLOCK.WHITE_TILE);
    setBlock(fhX,     fhY + 1, fhZ + 2, BLOCK.WHITE_TILE);
    setBlock(fhX,     fhY + 2, fhZ + 2, BLOCK.WHITE_TILE);
    setBlock(fhX + 3, fhY + 1, fhZ + 2, BLOCK.WHITE_TILE);
    setBlock(fhX + 3, fhY + 2, fhZ + 2, BLOCK.WHITE_TILE);
    // Roof (white)
    for (var frx = 0; frx < 4; frx++) {
      for (var frz = 0; frz < 4; frz++) {
        setBlock(fhX + frx, fhY + 3, fhZ + frz, BLOCK.WHITE_TILE);
      }
    }
    // Red cross on roof (FIRE blocks — bright red)
    setBlock(fhX + 1, fhY + 4, fhZ + 1, BLOCK.FIRE); // center
    setBlock(fhX + 2, fhY + 4, fhZ + 1, BLOCK.FIRE); // arm
    setBlock(fhX + 1, fhY + 4, fhZ + 2, BLOCK.FIRE); // arm
    setBlock(fhX + 2, fhY + 4, fhZ + 2, BLOCK.FIRE); // center
    // Entrance (open south wall)
    setBlock(fhX + 1, fhY + 1, fhZ + 3, BLOCK.AIR);
    setBlock(fhX + 2, fhY + 1, fhZ + 3, BLOCK.AIR);
    // Sandbag protection (half-ring on south)
    setBlock(fhX - 1, fhY + 1, fhZ + 3, BLOCK.SANDBAG);
    setBlock(fhX + 4, fhY + 1, fhZ + 3, BLOCK.SANDBAG);
    setBlock(fhX,     fhY + 1, fhZ + 4, BLOCK.SANDBAG);
    setBlock(fhX + 1, fhY + 1, fhZ + 4, BLOCK.SANDBAG);
    setBlock(fhX + 2, fhY + 1, fhZ + 4, BLOCK.SANDBAG);
    setBlock(fhX + 3, fhY + 1, fhZ + 4, BLOCK.SANDBAG);

    // ── T. Hedgehog obstacles (welded rail sections) ─────────────────
    // Thousands of steel "hedgehog" or "Czech hedgehog" anti-tank traps
    // were welded from railway rails and placed throughout Kyiv suburbs.
    var hhPositions = [
      { x: ox - 8, z: oz + 10 }, { x: ox - 5, z: oz + 11 },
      { x: ox + 5, z: oz + 10 }, { x: ox + 8, z: oz + 12 },
      { x: ox - 10, z: oz + 8 }, { x: ox + 10, z: oz + 9 },
      { x: ox - 6, z: oz + 13 }, { x: ox + 6, z: oz + 13 },
    ];
    for (var hhi = 0; hhi < hhPositions.length; hhi++) {
      var hh = hhPositions[hhi];
      var hhY = gh(hh.x, hh.z);
      // Cross-shaped METAL base block
      setBlock(hh.x, hhY + 1, hh.z, BLOCK.METAL);
      // The "arms" radiating in 4 horizontal directions simulate the X cross
      setBlock(hh.x - 1, hhY + 1, hh.z,     BLOCK.METAL);
      setBlock(hh.x + 1, hhY + 1, hh.z,     BLOCK.METAL);
      setBlock(hh.x,     hhY + 1, hh.z - 1, BLOCK.METAL);
      setBlock(hh.x,     hhY + 1, hh.z + 1, BLOCK.METAL);
      // Vertical spike through center
      setBlock(hh.x, hhY + 2, hh.z, BLOCK.METAL);
    }

    // ── U. Artillery battery position (M777 / D-30 emplacement) ─────
    // Ukrainian artillery batteries were dug in behind berms on the
    // northern approaches to provide indirect fire support.
    var abx = ox - 16, abz = oz - 20;
    var abY = gh(abx, abz);
    // Earth berm (DIRT + SANDBAG) protecting gun crew
    for (var abw = 0; abw < 8; abw++) {
      setBlock(abx + abw, abY + 1, abz - 2, BLOCK.DIRT);
      setBlock(abx + abw, abY + 2, abz - 2, BLOCK.DIRT);
      setBlock(abx + abw, abY + 3, abz - 2, BLOCK.SANDBAG);
      // Side berms
      if (abw < 3 || abw > 5) {
        setBlock(abx + abw, abY + 1, abz + 1, BLOCK.DIRT);
        setBlock(abx + abw, abY + 2, abz + 1, BLOCK.DIRT);
      }
    }
    setBlock(abx - 1, abY + 1, abz - 2, BLOCK.DIRT);
    setBlock(abx + 8, abY + 1, abz - 2, BLOCK.DIRT);
    setBlock(abx - 1, abY + 2, abz - 2, BLOCK.DIRT);
    setBlock(abx + 8, abY + 2, abz - 2, BLOCK.DIRT);
    // Gun trail / baseplate (METAL rectangle representing gun base)
    setBlock(abx + 2, abY + 1, abz,     BLOCK.METAL);
    setBlock(abx + 3, abY + 1, abz,     BLOCK.METAL);
    setBlock(abx + 4, abY + 1, abz,     BLOCK.METAL);
    setBlock(abx + 5, abY + 1, abz,     BLOCK.METAL);
    // Barrel pointing toward enemy (METAL column along z-axis)
    setBlock(abx + 3, abY + 2, abz,     BLOCK.METAL);
    setBlock(abx + 4, abY + 2, abz,     BLOCK.METAL);
    setBlock(abx + 3, abY + 2, abz - 4, BLOCK.METAL);
    setBlock(abx + 4, abY + 2, abz - 4, BLOCK.METAL);
    setBlock(abx + 3, abY + 2, abz - 5, BLOCK.METAL);
    setBlock(abx + 4, abY + 2, abz - 5, BLOCK.METAL);
    // Ammo crates beside gun (WOOD blocks)
    setBlock(abx + 1, abY + 1, abz + 2, BLOCK.WOOD);
    setBlock(abx + 6, abY + 1, abz + 2, BLOCK.WOOD);
    setBlock(abx + 2, abY + 1, abz + 2, BLOCK.WOOD);
    setBlock(abx + 5, abY + 1, abz + 2, BLOCK.WOOD);
    // Crew shelter (2 × 2 × 2 CONCRETE foxhole behind battery)
    for (var csx = 0; csx < 2; csx++) {
      setBlock(abx + csx, abY + 1, abz + 3, BLOCK.CONCRETE);
      setBlock(abx + csx, abY + 2, abz + 3, BLOCK.CONCRETE);
      setBlock(abx + csx, abY + 1, abz + 4, BLOCK.CONCRETE);
      setBlock(abx + csx, abY + 2, abz + 4, BLOCK.CONCRETE);
    }
    // Ukrainian flag on antenna pole
    setBlock(abx + 7, abY + 1, abz + 2, BLOCK.METAL);
    setBlock(abx + 7, abY + 2, abz + 2, BLOCK.METAL);
    setBlock(abx + 7, abY + 3, abz + 2, BLOCK.METAL);
    setBlock(abx + 7, abY + 4, abz + 2, BLOCK.FLAG);

    // ── M. Friendly T-64BV tank behind defensive trench ────────────
    // The T-64BV was Ukraine's primary MBT during the Kyiv defense.
    // Kontakt-1 ERA (explosive reactive armour) brick modules on hull sides.
    var t64x = ox + 4, t64z = oz + 6;
    var t64y = gh(t64x, t64z);
    // Hull (T-64 is shorter and wider than T-72: 8 long × 4 wide × 2 high)
    for (var t4hx = 0; t4hx < 8; t4hx++) {
      for (var t4hz = 0; t4hz < 4; t4hz++) {
        for (var t4hy = 1; t4hy <= 2; t4hy++) {
          var t4outer = t4hx === 0 || t4hx === 7 || t4hz === 0 || t4hz === 3 || t4hy === 2;
          if (t4outer) setBlock(t64x + t4hx, t64y + t4hy, t64z + t4hz, BLOCK.METAL);
        }
      }
    }
    // Turret (T-64 has a distinctive low, rounded turret)
    for (var t4tx = 2; t4tx <= 5; t4tx++) {
      for (var t4tz = 0; t4tz <= 3; t4tz++) {
        setBlock(t64x + t4tx, t64y + 3, t64z + t4tz, BLOCK.METAL);
      }
    }
    // Commander hatch
    setBlock(t64x + 3, t64y + 4, t64z + 1, BLOCK.METAL);
    // 125mm gun barrel (pointing north, toward enemy)
    setBlock(t64x + 7, t64y + 3, t64z + 1, BLOCK.METAL);
    setBlock(t64x + 8, t64y + 3, t64z + 1, BLOCK.METAL);
    setBlock(t64x + 9, t64y + 3, t64z + 1, BLOCK.METAL);
    // Kontakt-1 ERA bricks on hull sides (REINFORCED blocks in row — distinctive boxes)
    for (var eraX = 1; eraX <= 6; eraX++) {
      setBlock(t64x + eraX, t64y + 2, t64z - 1, BLOCK.REINFORCED);  // left skirt
      setBlock(t64x + eraX, t64y + 2, t64z + 4, BLOCK.REINFORCED);  // right skirt
    }
    // Ukrainian flag on turret side (blue = CONCRETE, yellow = LIGHT)
    setBlock(t64x + 4, t64y + 3, t64z - 1, BLOCK.CONCRETE); // blue stripe
    setBlock(t64x + 5, t64y + 3, t64z - 1, BLOCK.LIGHT);    // yellow stripe

    // ── BB. Blown Irpin bridge (deliberate demolition, March 2022) ────
    // Ukraine blew the Irpin river bridges to slow Russian armored advance.
    // The main Irpin bridge was destroyed by Ukrainian sappers on March 1.
    var bdX = ox + 28, bdZ = oz + 48;
    var bdY = gh(bdX, bdZ);
    // Surviving bridge abutment on south side (CONCRETE stump)
    for (var bax = 0; bax < 5; bax++) {
      setBlock(bdX + bax, bdY + 1, bdZ,     BLOCK.CONCRETE);
      setBlock(bdX + bax, bdY + 2, bdZ,     BLOCK.CONCRETE);
      setBlock(bdX + bax, bdY + 3, bdZ,     BLOCK.CONCRETE);
    }
    // Blown central span — collapsed girder (METAL debris in water/mud)
    for (var bms = 0; bms < 6; bms++) {
      setBlock(bdX + bms, bdY,     bdZ + 3 + bms, BLOCK.METAL);
      setBlock(bdX + bms, bdY - 1, bdZ + 3 + bms, BLOCK.METAL);
    }
    // Rebar splinters sticking up from collapse
    setBlock(bdX + 1, bdY + 1, bdZ + 4, BLOCK.METAL);
    setBlock(bdX + 3, bdY + 1, bdZ + 6, BLOCK.METAL);
    setBlock(bdX + 4, bdY + 2, bdZ + 5, BLOCK.METAL);
    // North abutment stump (still standing)
    for (var bnx = 0; bnx < 5; bnx++) {
      setBlock(bdX + bnx, bdY + 1, bdZ + 10, BLOCK.CONCRETE);
      setBlock(bdX + bnx, bdY + 2, bdZ + 10, BLOCK.CONCRETE);
    }
    // Water fill under bridge (indicates river/mud at collapse point)
    for (var bwx = 0; bwx < 5; bwx++) {
      for (var bwz = 1; bwz < 10; bwz++) {
        setBlock(bdX + bwx, bdY - 1, bdZ + bwz, BLOCK.WATER);
      }
    }
    // Rubble from the blast on south bank
    for (var brr = 0; brr < 5; brr++) {
      setBlock(bdX - 1 + brr, bdY + 1, bdZ + 1, BLOCK.RUBBLE);
      setBlock(bdX - 1 + brr, bdY + 1, bdZ + 2, BLOCK.RUBBLE);
    }

    // ── CC. Supply truck graveyard (Russian convoy wreckage) ──────────
    // Russia's 64-km convoy north of Kyiv was halted and destroyed by
    // Ukrainian forces (TB2 strikes, NLAW teams, and fuel shortages).
    // Multiple supply trucks and fuel tankers burnt out on the Hostomel road.
    var sgX = ox - 22, sgZ = oz + 52;
    var sgY = gh(sgX, sgZ);
    // 3 destroyed supply trucks in a row along the road
    var truckOffsets = [0, 8, 16];
    for (var tri = 0; tri < truckOffsets.length; tri++) {
      var txz = sgZ + truckOffsets[tri];
      var txy = gh(sgX, txz);
      // Truck cab (METAL, 2×2)
      setBlock(sgX,     txy + 1, txz,     BLOCK.METAL);
      setBlock(sgX + 1, txy + 1, txz,     BLOCK.METAL);
      setBlock(sgX,     txy + 1, txz + 1, BLOCK.METAL);
      setBlock(sgX + 1, txy + 1, txz + 1, BLOCK.METAL);
      setBlock(sgX,     txy + 2, txz,     BLOCK.METAL);
      setBlock(sgX + 1, txy + 2, txz,     BLOCK.METAL);
      setBlock(sgX,     txy + 2, txz + 1, BLOCK.METAL);
      setBlock(sgX + 1, txy + 2, txz + 1, BLOCK.METAL);
      // Truck bed (METAL, 2×4 longer)
      for (var tbz = 2; tbz < 6; tbz++) {
        setBlock(sgX,     txy + 1, txz + tbz, BLOCK.METAL);
        setBlock(sgX + 1, txy + 1, txz + tbz, BLOCK.METAL);
        setBlock(sgX,     txy + 2, txz + tbz, BLOCK.METAL);
        setBlock(sgX + 1, txy + 2, txz + tbz, BLOCK.METAL);
      }
      // Fire (middle trucks burning; first one fully burnt out)
      if (tri > 0) {
        setBlock(sgX,     txy + 3, txz + 1, BLOCK.FIRE);
        setBlock(sgX + 1, txy + 3, txz + 3, BLOCK.FIRE);
      }
      // Rubble of scattered cargo
      setBlock(sgX - 1, txy + 1, txz + 2, BLOCK.RUBBLE);
      setBlock(sgX + 2, txy + 1, txz + 3, BLOCK.RUBBLE);
      setBlock(sgX - 1, txy + 1, txz + 4, BLOCK.RUBBLE);
    }
    // Burnt fuel tanker (cylindrical shape — wider METAL box)
    var ftX = sgX + 4, ftZ = sgZ + 6;
    var ftY = gh(ftX, ftZ);
    for (var ftx = 0; ftx < 3; ftx++) {
      for (var ftz = 0; ftz < 7; ftz++) {
        setBlock(ftX + ftx, ftY + 1, ftZ + ftz, BLOCK.METAL);
        if (ftz < 6) setBlock(ftX + ftx, ftY + 2, ftZ + ftz, BLOCK.METAL);
      }
    }
    // Tanker still burning (catastrophic fuel fire)
    setBlock(ftX,     ftY + 3, ftZ + 2, BLOCK.FIRE);
    setBlock(ftX + 1, ftY + 3, ftZ + 3, BLOCK.FIRE);
    setBlock(ftX + 2, ftY + 3, ftZ + 4, BLOCK.FIRE);
    // Scattered WOOD cargo crates (food/ammo supply)
    setBlock(ftX - 2, ftY + 1, ftZ,     BLOCK.WOOD);
    setBlock(ftX - 2, ftY + 1, ftZ + 2, BLOCK.WOOD);
    setBlock(ftX + 4, ftY + 1, ftZ + 1, BLOCK.WOOD);
    setBlock(ftX + 4, ftY + 1, ftZ + 4, BLOCK.WOOD);

    // ── DD. HIMARS firing position (M270/MLRS battery) ────────────────
    // Ukraine's HIMARS batteries operate from concealed positions and
    // displace immediately after firing ("shoot-and-scoot"). This shows
    // a hasty rearm position with sandbag revetments and ammo pods.
    var hmX = ox - 30, hmZ = oz - 32;
    var hmY = gh(hmX, hmZ);
    // Earthen revetment berm (U-shaped, opens toward the enemy / north)
    for (var hrx = 0; hrx < 10; hrx++) {
      setBlock(hmX + hrx, hmY + 1, hmZ + 5, BLOCK.DIRT);
      setBlock(hmX + hrx, hmY + 2, hmZ + 5, BLOCK.DIRT);
      setBlock(hmX + hrx, hmY + 3, hmZ + 5, BLOCK.SANDBAG);
    }
    setBlock(hmX - 1, hmY + 1, hmZ + 3, BLOCK.DIRT);
    setBlock(hmX - 1, hmY + 2, hmZ + 3, BLOCK.DIRT);
    setBlock(hmX - 1, hmY + 1, hmZ + 4, BLOCK.DIRT);
    setBlock(hmX - 1, hmY + 2, hmZ + 4, BLOCK.DIRT);
    setBlock(hmX + 10, hmY + 1, hmZ + 3, BLOCK.DIRT);
    setBlock(hmX + 10, hmY + 2, hmZ + 3, BLOCK.DIRT);
    setBlock(hmX + 10, hmY + 1, hmZ + 4, BLOCK.DIRT);
    setBlock(hmX + 10, hmY + 2, hmZ + 4, BLOCK.DIRT);
    // HIMARS truck body (cab + rocket pod frame — METAL on CONCRETE pad)
    for (var hcx = 0; hcx < 2; hcx++) {
      setBlock(hmX + 2 + hcx, hmY + 1, hmZ + 1, BLOCK.METAL);
      setBlock(hmX + 2 + hcx, hmY + 1, hmZ + 2, BLOCK.METAL);
      setBlock(hmX + 2 + hcx, hmY + 2, hmZ + 1, BLOCK.METAL);
      setBlock(hmX + 2 + hcx, hmY + 2, hmZ + 2, BLOCK.METAL);
    }
    // Rocket pod (elevated block on top — distinctive HIMARS silhouette)
    for (var rpx = 0; rpx < 4; rpx++) {
      setBlock(hmX + 2 + rpx, hmY + 3, hmZ + 1, BLOCK.METAL);
      setBlock(hmX + 2 + rpx, hmY + 3, hmZ + 2, BLOCK.METAL);
    }
    // Spare M31 GMLRS pod crates beside launcher (WOOD)
    setBlock(hmX + 7, hmY + 1, hmZ + 1, BLOCK.WOOD);
    setBlock(hmX + 7, hmY + 1, hmZ + 2, BLOCK.WOOD);
    setBlock(hmX + 8, hmY + 1, hmZ + 1, BLOCK.WOOD);
    // Comms antenna (METAL pole + FLAG)
    setBlock(hmX + 1, hmY + 1, hmZ + 3, BLOCK.METAL);
    setBlock(hmX + 1, hmY + 2, hmZ + 3, BLOCK.METAL);
    setBlock(hmX + 1, hmY + 3, hmZ + 3, BLOCK.METAL);
    setBlock(hmX + 1, hmY + 4, hmZ + 3, BLOCK.FLAG);
    // Camouflage net frames (WOOD poles forming overhead frame)
    setBlock(hmX + 3, hmY + 4, hmZ,     BLOCK.WOOD);
    setBlock(hmX + 6, hmY + 4, hmZ,     BLOCK.WOOD);

    // ── EE. Shelled apartment block (civilian infrastructure strike) ───
    // Russia systematically targeted residential high-rises in Kyiv
    // suburbs. This shows a partially collapsed 9-storey block with
    // fire damage, exposed concrete skeleton, and refugee rubble.
    var apX = ox + 30, apZ = oz - 18;
    var apY = gh(apX, apZ);
    // Standing facade (BRICK walls, large cross-section — 8×10 footprint)
    for (var apx = 0; apx < 8; apx++) {
      for (var apz = 0; apz < 3; apz++) {
        for (var apy = 1; apy <= 9; apy++) {
          var isWall = apx === 0 || apx === 7 || apz === 0 || apz === 2;
          // Collapse damage: upper floors lose blocks randomly
          if (apy > 5 && ((apx + apz + apy) % 3 === 0)) continue;
          if (isWall) setBlock(apX + apx, apY + apy, apZ + apz, BLOCK.BRICK);
        }
      }
    }
    // Blown-out windows (AIR gaps in wall at each floor)
    for (var wf = 1; wf <= 9; wf++) {
      if (wf % 2 === 0) {
        setBlock(apX + 2, apY + wf, apZ,     BLOCK.AIR);
        setBlock(apX + 5, apY + wf, apZ,     BLOCK.AIR);
      } else {
        setBlock(apX + 3, apY + wf, apZ + 2, BLOCK.AIR);
      }
    }
    // Collapsed section (right side floors 6-9 — pancaked down)
    for (var clf = 6; clf <= 9; clf++) {
      setBlock(apX + 6, apY + clf, apZ + 1, BLOCK.RUBBLE);
      setBlock(apX + 7, apY + clf, apZ + 1, BLOCK.RUBBLE);
    }
    // Fire in upper floors (missile strike entry point)
    setBlock(apX + 4, apY + 7, apZ + 1, BLOCK.FIRE);
    setBlock(apX + 5, apY + 8, apZ + 1, BLOCK.FIRE);
    setBlock(apX + 3, apY + 6, apZ,     BLOCK.FIRE);
    // Debris field at base (concrete and brick chunks)
    for (var dbx = 0; dbx < 8; dbx++) {
      setBlock(apX + dbx, apY + 1, apZ + 3, BLOCK.RUBBLE);
      if (dbx % 2 === 0) setBlock(apX + dbx, apY + 1, apZ + 4, BLOCK.RUBBLE);
    }
    // Exposed rebar floor slabs (CONCRETE visible through breach)
    setBlock(apX + 1, apY + 5, apZ + 1, BLOCK.CONCRETE);
    setBlock(apX + 2, apY + 5, apZ + 1, BLOCK.CONCRETE);
    setBlock(apX + 3, apY + 5, apZ + 1, BLOCK.CONCRETE);

  // ── FF. Patriot PAC-3 battery (US-supplied air defense, 2023) ────────
  // Ukraine's Patriot shot down the first-ever Kinzhal hypersonic missile
  // on May 4 2023. Battery: AN/MPQ-65 radar, 2x M903 launchers, C2 post.
  {
    var ptX = ox - 50, ptZ = oz + 15;
    var ptY = gh(ptX, ptZ);
    // Perimeter sandbag revetment
    for (var pbx = 0; pbx < 16; pbx++) {
      setBlock(ptX + pbx, ptY + 1, ptZ,      BLOCK.SANDBAG);
      setBlock(ptX + pbx, ptY + 2, ptZ,      BLOCK.SANDBAG);
      setBlock(ptX + pbx, ptY + 1, ptZ + 12, BLOCK.SANDBAG);
      setBlock(ptX + pbx, ptY + 2, ptZ + 12, BLOCK.SANDBAG);
    }
    for (var pbz = 0; pbz <= 12; pbz++) {
      setBlock(ptX,      ptY + 1, ptZ + pbz, BLOCK.SANDBAG);
      setBlock(ptX,      ptY + 2, ptZ + pbz, BLOCK.SANDBAG);
      setBlock(ptX + 15, ptY + 1, ptZ + pbz, BLOCK.SANDBAG);
      setBlock(ptX + 15, ptY + 2, ptZ + pbz, BLOCK.SANDBAG);
    }
    // Concrete operations pad inside berm
    for (var ppx = 1; ppx < 15; ppx++) {
      for (var ppz = 1; ppz <= 11; ppz++) {
        setBlock(ptX + ppx, ptY, ptZ + ppz, BLOCK.CONCRETE);
      }
    }
    // AN/MPQ-65 radar truck body
    for (var ry = 1; ry <= 3; ry++) {
      for (var rrz = 0; rrz < 4; rrz++) {
        setBlock(ptX + 2, ptY + ry, ptZ + 2 + rrz, BLOCK.METAL);
        setBlock(ptX + 3, ptY + ry, ptZ + 2 + rrz, BLOCK.METAL);
        setBlock(ptX + 4, ptY + ry, ptZ + 2 + rrz, BLOCK.METAL);
      }
    }
    // Phased-array radar face (ELECTRONICS block)
    setBlock(ptX + 2, ptY + 4, ptZ + 3, BLOCK.ELECTRONICS);
    setBlock(ptX + 3, ptY + 4, ptZ + 3, BLOCK.ELECTRONICS);
    setBlock(ptX + 4, ptY + 4, ptZ + 3, BLOCK.ELECTRONICS);
    setBlock(ptX + 3, ptY + 5, ptZ + 3, BLOCK.ELECTRONICS);
    // Radar mast
    setBlock(ptX + 3, ptY + 6, ptZ + 3, BLOCK.METAL);
    setBlock(ptX + 3, ptY + 7, ptZ + 3, BLOCK.METAL);
    // M903 Launching Station 1 — angled toward north threat axis
    for (var la = 1; la <= 2; la++) {
      setBlock(ptX + 7, ptY + la, ptZ + 2, BLOCK.METAL);
      setBlock(ptX + 8, ptY + la, ptZ + 2, BLOCK.METAL);
    }
    setBlock(ptX + 7, ptY + 3, ptZ + 1, BLOCK.METAL);
    setBlock(ptX + 8, ptY + 3, ptZ + 1, BLOCK.METAL);
    setBlock(ptX + 7, ptY + 4, ptZ,     BLOCK.METAL);
    setBlock(ptX + 8, ptY + 4, ptZ,     BLOCK.METAL);
    // M903 Launching Station 2
    for (var lb = 1; lb <= 2; lb++) {
      setBlock(ptX + 7, ptY + lb, ptZ + 9,  BLOCK.METAL);
      setBlock(ptX + 8, ptY + lb, ptZ + 9,  BLOCK.METAL);
    }
    setBlock(ptX + 7, ptY + 3, ptZ + 10, BLOCK.METAL);
    setBlock(ptX + 8, ptY + 3, ptZ + 10, BLOCK.METAL);
    setBlock(ptX + 7, ptY + 4, ptZ + 11, BLOCK.METAL);
    setBlock(ptX + 8, ptY + 4, ptZ + 11, BLOCK.METAL);
    // AN/MSQ-132 Command Post
    for (var cy = 1; cy <= 3; cy++) {
      for (var cpz = 0; cpz < 3; cpz++) {
        setBlock(ptX + 11, ptY + cy, ptZ + 4 + cpz, BLOCK.METAL);
        setBlock(ptX + 12, ptY + cy, ptZ + 4 + cpz, BLOCK.METAL);
        setBlock(ptX + 13, ptY + cy, ptZ + 4 + cpz, BLOCK.METAL);
      }
    }
    // Ukrainian flag on command post
    setBlock(ptX + 12, ptY + 4, ptZ + 5, BLOCK.METAL);
    setBlock(ptX + 12, ptY + 5, ptZ + 5, BLOCK.FLAG);
    // Power generator
    setBlock(ptX + 2, ptY + 1, ptZ + 9, BLOCK.METAL);
    setBlock(ptX + 2, ptY + 2, ptZ + 9, BLOCK.METAL);
    setBlock(ptX + 3, ptY + 1, ptZ + 9, BLOCK.METAL);
    setBlock(ptX + 3, ptY + 2, ptZ + 9, BLOCK.METAL);
    // Spare PAC-3 missile canisters (stacked near launcher)
    setBlock(ptX + 6, ptY + 1, ptZ + 2, BLOCK.CRATE);
    setBlock(ptX + 6, ptY + 1, ptZ + 3, BLOCK.CRATE);
    setBlock(ptX + 6, ptY + 2, ptZ + 2, BLOCK.CRATE);
  }

  // ── GG. Anti-tank ditch (outer Kyiv defense ring, north approach) ────
  // Ukrainian engineers dug AT ditches across all roads and fields north
  // of Kyiv in Feb-March 2022 to stop Russian BMP and T-72 columns.
  {
    var dtX = ox - 20, dtZ = oz + 90;
    var dtY = gh(dtX, dtZ);
    // Main ditch (40 wide x 3 deep x 5 north-south — impassable to vehicles)
    for (var dtx = 0; dtx < 40; dtx++) {
      for (var ddy = 0; ddy <= 2; ddy++) {
        for (var ddz = 0; ddz < 5; ddz++) {
          setBlock(dtX + dtx, dtY - ddy, dtZ + ddz, BLOCK.AIR);
        }
      }
      // South berm (defender side — spoil earth piled high)
      setBlock(dtX + dtx, dtY + 1, dtZ + 5, BLOCK.DIRT);
      setBlock(dtX + dtx, dtY + 2, dtZ + 5, BLOCK.DIRT);
      if (dtx % 2 === 0) setBlock(dtX + dtx, dtY + 3, dtZ + 5, BLOCK.DIRT);
      // North berm (attacker side — smaller mound)
      setBlock(dtX + dtx, dtY + 1, dtZ - 1, BLOCK.DIRT);
    }
    // Infantry crossing points (2-block CONCRETE causeways)
    for (var xz = 1; xz < 4; xz++) {
      setBlock(dtX + 8,  dtY, dtZ + xz, BLOCK.CONCRETE);
      setBlock(dtX + 9,  dtY, dtZ + xz, BLOCK.CONCRETE);
      setBlock(dtX + 28, dtY, dtZ + xz, BLOCK.CONCRETE);
      setBlock(dtX + 29, dtY, dtZ + xz, BLOCK.CONCRETE);
    }
    // Czech hedgehog obstacles flanking the ditch
    for (var dhx = 0; dhx < 8; dhx++) {
      setBlock(dtX - 2 + dhx, dtY + 1, dtZ - 2, BLOCK.METAL);
      setBlock(dtX + 32 + dhx, dtY + 1, dtZ - 2, BLOCK.METAL);
    }
    // Mine-warning posts on enemy approach (north face)
    setBlock(dtX + 5,  dtY + 1, dtZ - 4, BLOCK.FENCE);
    setBlock(dtX + 5,  dtY + 2, dtZ - 4, BLOCK.SIGN);
    setBlock(dtX + 15, dtY + 1, dtZ - 4, BLOCK.FENCE);
    setBlock(dtX + 15, dtY + 2, dtZ - 4, BLOCK.SIGN);
    setBlock(dtX + 25, dtY + 1, dtZ - 4, BLOCK.FENCE);
    setBlock(dtX + 25, dtY + 2, dtZ - 4, BLOCK.SIGN);
    // CONCRETE firing position bunker behind south berm
    setBlock(dtX + 18, dtY + 1, dtZ + 7, BLOCK.CONCRETE);
    setBlock(dtX + 18, dtY + 2, dtZ + 7, BLOCK.CONCRETE);
    setBlock(dtX + 18, dtY + 3, dtZ + 7, BLOCK.CONCRETE);
    setBlock(dtX + 19, dtY + 1, dtZ + 7, BLOCK.CONCRETE);
    setBlock(dtX + 19, dtY + 2, dtZ + 7, BLOCK.CONCRETE);
    setBlock(dtX + 19, dtY + 3, dtZ + 7, BLOCK.CONCRETE);
    // Ukrainian flags on south berm
    setBlock(dtX + 4,  dtY + 1, dtZ + 6, BLOCK.FENCE);
    setBlock(dtX + 4,  dtY + 2, dtZ + 6, BLOCK.FLAG);
    setBlock(dtX + 20, dtY + 1, dtZ + 6, BLOCK.FENCE);
    setBlock(dtX + 20, dtY + 2, dtZ + 6, BLOCK.FLAG);
    // Pre-registered artillery craters north of ditch
    setBlock(dtX + 7,  dtY, dtZ - 8,  BLOCK.RUBBLE);
    setBlock(dtX + 14, dtY, dtZ - 12, BLOCK.RUBBLE);
    setBlock(dtX + 22, dtY, dtZ - 7,  BLOCK.RUBBLE);
    setBlock(dtX + 30, dtY, dtZ - 10, BLOCK.RUBBLE);
  }
  }

  // IDEA 21: Evacuation bus/civilian vehicles
  function generateEvacVehicles(count) {
    for (let v = 0; v < count; v++) {
      const vx = randInWorld();
      const vz = randInWorld();
      const h = getTerrainHeight(vx, vz);
      if (h <= 1) continue;
      // Bus shape
      for (let x = 0; x < 6; x++) {
        for (let z = 0; z < 2; z++) {
          setBlock(vx + x, h, vz + z, BLOCK.METAL);
          setBlock(vx + x, h + 1, vz + z, BLOCK.METAL);
          if (x >= 1 && x <= 4) {
            setBlock(vx + x, h + 2, vz + z, BLOCK.GLASS); // windows
          }
          setBlock(vx + x, h + 3, vz + z, BLOCK.METAL); // roof
        }
      }
    }
  }

  // IDEA 22: Minefield warning signs
  function generateMinefieldSigns(count) {
    for (let m = 0; m < count; m++) {
      const mx = randInWorld();
      const mz = randInWorld();
      const h = getTerrainHeight(mx, mz);
      if (h <= 1) continue;
      // Warning post
      setBlock(mx, h, mz, BLOCK.WOOD);
      setBlock(mx, h + 1, mz, BLOCK.WOOD);
      // Sign (red block = danger)
      setBlock(mx, h + 2, mz, BLOCK.BRICK);
      // Scattered disturbed dirt around (mines beneath)
      for (let d = 0; d < 8; d++) {
        const dx = mx + Math.floor(Math.random() * 10) - 5;
        const dz = mz + Math.floor(Math.random() * 10) - 5;
        const dh = getTerrainHeight(dx, dz);
        if (dh > 1) setBlock(dx, dh, dz, BLOCK.DIRT);
      }
    }
  }

  // IDEA 23: Sniper nest in ruins
  function generateSniperNest(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Tall ruined building
    const h = 7 + Math.floor(Math.random() * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 5; z++) {
          const isWall = x === 0 || x === 4 || z === 0 || z === 4;
          if (isWall) {
            if (Math.random() < 0.1 && y > 3) continue; // damage
            setBlock(ox + x, surfH + y, oz + z, BLOCK.CONCRETE);
          }
        }
      }
    }
    // Observation slit at top
    setBlock(ox + 2, surfH + h - 1, oz, BLOCK.AIR);
    setBlock(ox + 2, surfH + h - 2, oz, BLOCK.AIR);
    // Floor at top
    for (let x = 1; x < 4; x++) {
      for (let z = 1; z < 4; z++) {
        setBlock(ox + x, surfH + h - 3, oz + z, BLOCK.CONCRETE);
      }
    }
    // Sandbag firing position
    setBlock(ox + 1, surfH + h - 2, oz + 1, BLOCK.SANDBAG);
    setBlock(ox + 3, surfH + h - 2, oz + 1, BLOCK.SANDBAG);
    // Internal stairs
    for (let y = 0; y < h - 3; y++) {
      setBlock(ox + 1, surfH + y, oz + 3, BLOCK.STONE);
    }
    // Entrance
    setBlock(ox + 2, surfH, oz, BLOCK.AIR);
    setBlock(ox + 2, surfH + 1, oz, BLOCK.AIR);
  }

  // IDEA 24: Farm buildings (for Kherson)
  function generateFarmBuilding(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Barn
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 8; x++) {
        for (let z = 0; z < 6; z++) {
          const isWall = x === 0 || x === 7 || z === 0 || z === 5;
          const isRoof = y === 4;
          if (isWall || isRoof) {
            setBlock(ox + x, surfH + y, oz + z, BLOCK.WOOD);
          }
        }
      }
    }
    // Peaked roof
    for (let r = 0; r < 3; r++) {
      for (let z = 0; z < 6; z++) {
        setBlock(ox + 2 + r, surfH + 5, oz + z, BLOCK.WOOD);
        setBlock(ox + 5 - r, surfH + 5, oz + z, BLOCK.WOOD);
      }
    }
    // Barn door
    for (let y = 0; y < 3; y++) {
      setBlock(ox + 3, surfH + y, oz, BLOCK.AIR);
      setBlock(ox + 4, surfH + y, oz, BLOCK.AIR);
    }
    // Haystacks next to barn
    for (let hx = 0; hx < 3; hx++) {
      setBlock(ox + 9 + hx, surfH, oz + 2, BLOCK.SAND);
      setBlock(ox + 9 + hx, surfH + 1, oz + 2, BLOCK.SAND);
      setBlock(ox + 10, surfH + 2, oz + 2, BLOCK.SAND);
    }
    // Fence around area
    for (let f = -2; f < 12; f++) {
      setBlock(ox + f, surfH, oz - 2, BLOCK.FENCE);
      setBlock(ox + f, surfH + 1, oz - 2, BLOCK.FENCE);
      setBlock(ox + f, surfH, oz + 8, BLOCK.FENCE);
      setBlock(ox + f, surfH + 1, oz + 8, BLOCK.FENCE);
    }
  }

  // IDEA 25: Burning/fire ruins (visual only - rubble with "fire" colored blocks)
  function generateBurningRuin(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    const w = 5 + Math.floor(Math.random() * 4);
    const d = 5 + Math.floor(Math.random() * 4);
    // Collapsed structure
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        setBlock(ox + x, surfH, oz + z, BLOCK.RUBBLE);
        if (Math.random() > 0.5) {
          setBlock(ox + x, surfH + 1, oz + z, BLOCK.RUBBLE);
        }
        // "Fire" represented by fuel barrel blocks (orange color)
        if (Math.random() < 0.15) {
          setBlock(ox + x, surfH + 1, oz + z, BLOCK.FUEL_BARREL);
          if (Math.random() < 0.3) {
            setBlock(ox + x, surfH + 2, oz + z, BLOCK.FUEL_BARREL);
          }
        }
      }
    }
    // Remaining wall fragments
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < w; x++) {
        if (Math.random() < 0.3) {
          setBlock(ox + x, surfH + y + 1, oz, BLOCK.BRICK);
        }
      }
    }
  }

  // ── New Terrain Generators ──────────────────────────────────────

  function generateMortarPit(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Dig a circular pit
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (dx * dx + dz * dz <= 5) {
          setBlock(ox + dx, surfH, oz + dz, BLOCK.AIR);
          setBlock(ox + dx, surfH - 1, oz + dz, BLOCK.DIRT);
        }
      }
    }
    // Sandbag ring
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const d = dx * dx + dz * dz;
        if (d >= 7 && d <= 10) {
          setBlock(ox + dx, surfH, oz + dz, BLOCK.SANDBAG);
          setBlock(ox + dx, surfH + 1, oz + dz, BLOCK.SANDBAG);
        }
      }
    }
    // Mortar tube (metal block stack)
    setBlock(ox, surfH, oz, BLOCK.METAL);
    setBlock(ox, surfH + 1, oz, BLOCK.METAL);
  }

  function generateWatchtower(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // 4 legs
    for (let y = 0; y < 8; y++) {
      setBlock(ox - 1, surfH + y + 1, oz - 1, BLOCK.WOOD);
      setBlock(ox + 1, surfH + y + 1, oz - 1, BLOCK.WOOD);
      setBlock(ox - 1, surfH + y + 1, oz + 1, BLOCK.WOOD);
      setBlock(ox + 1, surfH + y + 1, oz + 1, BLOCK.WOOD);
    }
    // Platform
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        setBlock(ox + dx, surfH + 8, oz + dz, BLOCK.WOOD);
      }
    }
    // Railing
    for (let dx = -2; dx <= 2; dx++) {
      setBlock(ox + dx, surfH + 9, oz - 2, BLOCK.FENCE);
      setBlock(ox + dx, surfH + 9, oz + 2, BLOCK.FENCE);
    }
    for (let dz = -2; dz <= 2; dz++) {
      setBlock(ox - 2, surfH + 9, oz + dz, BLOCK.FENCE);
      setBlock(ox + 2, surfH + 9, oz + dz, BLOCK.FENCE);
    }
    // Ladder
    for (let y = 1; y <= 8; y++) {
      setBlock(ox, surfH + y, oz - 2, BLOCK.WOOD);
    }
  }

  function generateAmmoCache(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Small enclosed ammo storage
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        setBlock(ox + dx, surfH + 1, oz + dz, BLOCK.CRATE);
        if (Math.random() < 0.5) setBlock(ox + dx, surfH + 2, oz + dz, BLOCK.CRATE);
      }
    }
    // Sandbag surround
    for (let dx = -2; dx <= 2; dx++) {
      setBlock(ox + dx, surfH + 1, oz - 2, BLOCK.SANDBAG);
      setBlock(ox + dx, surfH + 1, oz + 2, BLOCK.SANDBAG);
    }
    for (let dz = -1; dz <= 1; dz++) {
      setBlock(ox - 2, surfH + 1, oz + dz, BLOCK.SANDBAG);
      setBlock(ox + 2, surfH + 1, oz + dz, BLOCK.SANDBAG);
    }
  }

  function generateRazorWireMaze(ox, oz, segments) {
    // Zigzag fence wire pattern; segments = number of zigzag legs
    let cx = ox, cz = oz;
    for (let seg = 0; seg < segments; seg++) {
      const len = 4 + Math.floor(Math.random() * 6);
      const horizontal = seg % 2 === 0;
      for (let i = 0; i < len; i++) {
        const wx = horizontal ? cx + i : cx;
        const wz = horizontal ? cz : cz + i;
        const h = getTerrainHeight(wx, wz);
        setBlock(wx, h + 1, wz, BLOCK.FENCE);
      }
      if (horizontal) cx += len; else cz += len;
    }
  }

  function generateSupplyTent(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Green canvas tent (using grass blocks as proxy)
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const roofH = 3 - Math.abs(dx);
        setBlock(ox + dx, surfH + roofH, oz + dz, BLOCK.GRASS);
      }
    }
    // Support poles
    setBlock(ox - 2, surfH + 1, oz - 3, BLOCK.WOOD);
    setBlock(ox + 2, surfH + 1, oz - 3, BLOCK.WOOD);
    setBlock(ox - 2, surfH + 1, oz + 3, BLOCK.WOOD);
    setBlock(ox + 2, surfH + 1, oz + 3, BLOCK.WOOD);
    // Crates inside
    setBlock(ox, surfH + 1, oz, BLOCK.CRATE);
    setBlock(ox + 1, surfH + 1, oz, BLOCK.CRATE);
    setBlock(ox - 1, surfH + 1, oz + 1, BLOCK.CRATE);
  }

  // ── ROUND 2: New Terrain Generators ──────────────────────────

  function generateUndergroundTunnel(ox, oz, length) {
    // Dig a tunnel 2 blocks below surface, length blocks long
    const surfH = getTerrainHeight(ox, oz);
    const tunnelY = surfH - 2;
    const dir = Math.random() > 0.5; // true=X, false=Z
    for (let i = 0; i < (length || 12); i++) {
      const tx = dir ? ox + i : ox;
      const tz = dir ? oz : oz + i;
      // Tunnel bore: 2 wide, 2 tall
      for (let dx = 0; dx < 2; dx++) {
        setBlock(tx + (dir ? 0 : dx), tunnelY, tz + (dir ? dx : 0), BLOCK.AIR);
        setBlock(tx + (dir ? 0 : dx), tunnelY + 1, tz + (dir ? dx : 0), BLOCK.AIR);
      }
      // Timber supports every 3 blocks
      if (i % 3 === 0) {
        setBlock(tx, tunnelY - 1, tz, BLOCK.WOOD);
        setBlock(tx, tunnelY + 2, tz, BLOCK.WOOD);
        setBlock(tx + (dir ? 0 : 1), tunnelY + 2, tz + (dir ? 1 : 0), BLOCK.WOOD);
      }
    }
    // Entrance: open hole in surface with sandbag cover
    setBlock(ox, surfH, oz, BLOCK.AIR);
    setBlock(ox, surfH - 1, oz, BLOCK.AIR);
    setBlock(ox - 1, surfH, oz, BLOCK.SANDBAG);
    setBlock(ox + 1, surfH, oz, BLOCK.SANDBAG);
    setBlock(ox, surfH, oz - 1, BLOCK.SANDBAG);
    setBlock(ox, surfH, oz + 1, BLOCK.SANDBAG);
    // Exit hole at far end
    const ex = dir ? ox + (length || 12) : ox;
    const ez = dir ? oz : oz + (length || 12);
    setBlock(ex, getTerrainHeight(ex, ez), ez, BLOCK.AIR);
    setBlock(ex, getTerrainHeight(ex, ez) - 1, ez, BLOCK.AIR);
  }

  function generateCollapsedBridge(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Two intact bridge supports (concrete pillars)
    for (let y = 0; y < 6; y++) {
      for (let dz = -1; dz <= 1; dz++) {
        setBlock(ox - 6, surfH + y, oz + dz, BLOCK.CONCRETE);
        setBlock(ox + 6, surfH + y, oz + dz, BLOCK.CONCRETE);
      }
    }
    // Collapsed middle section — rubble spanning the gap
    for (let x = -5; x <= 5; x++) {
      for (let dz = -2; dz <= 2; dz++) {
        // Sagging middle: higher near supports, lower in center
        const height = Math.max(1, 5 - Math.abs(x) * 0.6);
        for (let y = 0; y < height; y++) {
          const block = y === 0 ? BLOCK.RUBBLE : (Math.random() < 0.4 ? BLOCK.RUBBLE : BLOCK.CONCRETE);
          setBlock(ox + x, surfH + y, oz + dz, block);
        }
      }
    }
    // Rebar sticking out (metal blocks)
    setBlock(ox - 3, surfH + 3, oz, BLOCK.METAL);
    setBlock(ox + 2, surfH + 4, oz, BLOCK.METAL);
    setBlock(ox, surfH + 2, oz - 1, BLOCK.METAL);
    // Debris around base
    for (let i = 0; i < 6; i++) {
      const rx = ox + Math.floor((Math.random() - 0.5) * 14);
      const rz = oz + Math.floor((Math.random() - 0.5) * 6);
      const rh = getTerrainHeight(rx, rz);
      setBlock(rx, rh + 1, rz, BLOCK.RUBBLE);
    }
  }

  function generateFuelDepot(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Concrete pad
    for (let x = -3; x <= 3; x++) {
      for (let z = -2; z <= 2; z++) {
        setBlock(ox + x, surfH, oz + z, BLOCK.CONCRETE);
      }
    }
    // Fuel barrel clusters (orange blocks)
    for (let x = -2; x <= 2; x += 2) {
      for (let z = -1; z <= 1; z++) {
        setBlock(ox + x, surfH + 1, oz + z, BLOCK.FUEL_BARREL);
        if (Math.random() < 0.5) setBlock(ox + x, surfH + 2, oz + z, BLOCK.FUEL_BARREL);
      }
    }
    // Metal roof cover
    for (let x = -3; x <= 3; x++) {
      for (let z = -2; z <= 2; z++) {
        setBlock(ox + x, surfH + 4, oz + z, BLOCK.METAL);
      }
    }
    // Support pillars
    setBlock(ox - 3, surfH + 1, oz - 2, BLOCK.METAL);
    setBlock(ox - 3, surfH + 2, oz - 2, BLOCK.METAL);
    setBlock(ox - 3, surfH + 3, oz - 2, BLOCK.METAL);
    setBlock(ox + 3, surfH + 1, oz + 2, BLOCK.METAL);
    setBlock(ox + 3, surfH + 2, oz + 2, BLOCK.METAL);
    setBlock(ox + 3, surfH + 3, oz + 2, BLOCK.METAL);
    setBlock(ox + 3, surfH + 1, oz - 2, BLOCK.METAL);
    setBlock(ox + 3, surfH + 2, oz - 2, BLOCK.METAL);
    setBlock(ox + 3, surfH + 3, oz - 2, BLOCK.METAL);
    setBlock(ox - 3, surfH + 1, oz + 2, BLOCK.METAL);
    setBlock(ox - 3, surfH + 2, oz + 2, BLOCK.METAL);
    setBlock(ox - 3, surfH + 3, oz + 2, BLOCK.METAL);
    // Warning sign (fence block)
    setBlock(ox, surfH + 1, oz - 3, BLOCK.FENCE);
    setBlock(ox, surfH + 2, oz - 3, BLOCK.FENCE);
  }

  function generateArtilleryBattery(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // 3 gun emplacements in a line
    for (let gun = 0; gun < 3; gun++) {
      const gx = ox + gun * 6;
      const gz = oz;
      // Circular pit
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (dx * dx + dz * dz <= 5) {
            setBlock(gx + dx, surfH, gz + dz, BLOCK.DIRT);
          }
        }
      }
      // Sandbag wall around pit
      for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
          const d = dx * dx + dz * dz;
          if (d >= 7 && d <= 10) {
            setBlock(gx + dx, surfH + 1, gz + dz, BLOCK.SANDBAG);
          }
        }
      }
      // Gun barrel (metal stack)
      setBlock(gx, surfH + 1, gz, BLOCK.METAL);
      setBlock(gx, surfH + 2, gz, BLOCK.METAL);
      setBlock(gx + 1, surfH + 2, gz, BLOCK.METAL);
      setBlock(gx + 2, surfH + 2, gz, BLOCK.METAL);
    }
    // Ammo crates behind guns
    for (let c = 0; c < 3; c++) {
      setBlock(ox + c * 6, surfH + 1, oz + 4, BLOCK.CRATE);
      setBlock(ox + c * 6 + 1, surfH + 1, oz + 4, BLOCK.CRATE);
    }
  }

  function generateRadarTower(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Square concrete base
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        setBlock(ox + x, surfH + 1, oz + z, BLOCK.CONCRETE);
      }
    }
    // Steel tower (4 legs)
    for (let y = 2; y < 12; y++) {
      setBlock(ox - 1, surfH + y, oz - 1, BLOCK.METAL);
      setBlock(ox + 1, surfH + y, oz - 1, BLOCK.METAL);
      setBlock(ox - 1, surfH + y, oz + 1, BLOCK.METAL);
      setBlock(ox + 1, surfH + y, oz + 1, BLOCK.METAL);
    }
    // Cross-bracing every 3 levels
    for (let y = 4; y < 12; y += 3) {
      setBlock(ox, surfH + y, oz - 1, BLOCK.METAL);
      setBlock(ox, surfH + y, oz + 1, BLOCK.METAL);
      setBlock(ox - 1, surfH + y, oz, BLOCK.METAL);
      setBlock(ox + 1, surfH + y, oz, BLOCK.METAL);
    }
    // Radar platform at top
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        setBlock(ox + x, surfH + 12, oz + z, BLOCK.METAL);
      }
    }
    // Radar dish (electronics blocks)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        setBlock(ox + dx, surfH + 13, oz + dz, BLOCK.ELECTRONICS);
      }
    }
    setBlock(ox, surfH + 14, oz, BLOCK.ELECTRONICS);
    // Railing
    for (let x = -2; x <= 2; x++) {
      setBlock(ox + x, surfH + 13, oz - 2, BLOCK.FENCE);
      setBlock(ox + x, surfH + 13, oz + 2, BLOCK.FENCE);
    }
    for (let z = -2; z <= 2; z++) {
      setBlock(ox - 2, surfH + 13, oz + z, BLOCK.FENCE);
      setBlock(ox + 2, surfH + 13, oz + z, BLOCK.FENCE);
    }
  }

  /* ── Military Structure Generators ────────────────────────────── */

  function generateBunker(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // Dig out 6x6 underground room, 4 blocks deep
    for (let x = 0; x < 6; x++) {
      for (let z = 0; z < 6; z++) {
        for (let d = 1; d <= 4; d++) {
          setBlock(cx + x, surfH - d, cz + z, BLOCK.AIR);
        }
        // Concrete walls (perimeter only)
        if (x === 0 || x === 5 || z === 0 || z === 5) {
          for (let d = 1; d <= 4; d++) {
            setBlock(cx + x, surfH - d, cz + z, BLOCK.CONCRETE);
          }
        }
        // Concrete floor
        setBlock(cx + x, surfH - 4, cz + z, BLOCK.CONCRETE);
        // Reinforced roof at surface level
        setBlock(cx + x, surfH, cz + z, BLOCK.REINFORCED);
      }
    }
    // Entry ramp on the south side (z=0), dirt steps going down
    for (let s = 0; s < 4; s++) {
      setBlock(cx + 2, surfH - s, cz - 1 - s, BLOCK.DIRT);
      setBlock(cx + 3, surfH - s, cz - 1 - s, BLOCK.DIRT);
      setBlock(cx + 2, surfH - s + 1, cz - 1 - s, BLOCK.AIR);
      setBlock(cx + 3, surfH - s + 1, cz - 1 - s, BLOCK.AIR);
    }
    // Interior: crate for ammo, metal table
    setBlock(cx + 2, surfH - 3, cz + 2, BLOCK.CRATE);
    setBlock(cx + 3, surfH - 3, cz + 4, BLOCK.METAL);
  }

  function generateMGNest(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // Concrete floor 5x3
    for (let x = -2; x <= 2; x++) {
      for (let z = -1; z <= 1; z++) {
        setBlock(cx + x, surfH, cz + z, BLOCK.CONCRETE);
      }
    }
    // Semi-circle of sandbags on the front and sides, 3 blocks tall
    for (let angle = -Math.PI / 2; angle <= Math.PI / 2; angle += 0.35) {
      const bx = cx + Math.round(Math.cos(angle) * 2.5);
      const bz = cz + Math.round(Math.sin(angle) * 2.5);
      for (let y = 1; y <= 3; y++) {
        setBlock(bx, surfH + y, bz, BLOCK.SANDBAG);
      }
    }
    // Metal "gun" in center: metal on metal
    setBlock(cx, surfH + 1, cz, BLOCK.METAL);
    setBlock(cx, surfH + 2, cz, BLOCK.METAL);
  }

  function generateFoxhole(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // 2x2 hole, 2 blocks deep
    for (let x = 0; x < 2; x++) {
      for (let z = 0; z < 2; z++) {
        setBlock(cx + x, surfH, cz + z, BLOCK.AIR);
        setBlock(cx + x, surfH - 1, cz + z, BLOCK.AIR);
        setBlock(cx + x, surfH - 2, cz + z, BLOCK.DIRT);
      }
    }
    // Sandbag rim on 3 sides (north, east, west — south open as entrance)
    for (let x = -1; x <= 2; x++) {
      setBlock(cx + x, surfH, cz + 2, BLOCK.SANDBAG);
      setBlock(cx + x, surfH + 1, cz + 2, BLOCK.SANDBAG);
    }
    for (let z = -1; z <= 2; z++) {
      setBlock(cx - 1, surfH, cz + z, BLOCK.SANDBAG);
      setBlock(cx + 2, surfH, cz + z, BLOCK.SANDBAG);
      setBlock(cx - 1, surfH + 1, cz + z, BLOCK.SANDBAG);
      setBlock(cx + 2, surfH + 1, cz + z, BLOCK.SANDBAG);
    }
  }

  function generateMinefield(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // 8x8 dirt area with scattered mine markers (FUEL_BARREL)
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        setBlock(cx + x, surfH, cz + z, BLOCK.DIRT);
        // Scatter mines roughly every 3rd cell with some randomness
        if ((x + z) % 3 === 0 && Math.random() > 0.4) {
          setBlock(cx + x, surfH + 1, cz + z, BLOCK.FUEL_BARREL);
        }
      }
    }
    // Warning sign: FENCE post with CRATE on top at corner
    setBlock(cx - 1, surfH + 1, cz - 1, BLOCK.FENCE);
    setBlock(cx - 1, surfH + 2, cz - 1, BLOCK.FENCE);
    setBlock(cx - 1, surfH + 3, cz - 1, BLOCK.CRATE);
  }

  function generateFieldHospitalTent(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // 6x4 wood frame
    for (let x = 0; x < 6; x++) {
      for (let z = 0; z < 4; z++) {
        setBlock(cx + x, surfH, cz + z, BLOCK.CONCRETE);
      }
    }
    // Corner posts
    for (let y = 1; y <= 3; y++) {
      setBlock(cx, surfH + y, cz, BLOCK.WOOD);
      setBlock(cx + 5, surfH + y, cz, BLOCK.WOOD);
      setBlock(cx, surfH + y, cz + 3, BLOCK.WOOD);
      setBlock(cx + 5, surfH + y, cz + 3, BLOCK.WOOD);
    }
    // GLASS "tent" roof
    for (let x = 0; x < 6; x++) {
      for (let z = 0; z < 4; z++) {
        setBlock(cx + x, surfH + 3, cz + z, BLOCK.GLASS);
      }
    }
    // Interior: 2 CRATE beds
    setBlock(cx + 1, surfH + 1, cz + 1, BLOCK.CRATE);
    setBlock(cx + 2, surfH + 1, cz + 1, BLOCK.CRATE);
    setBlock(cx + 1, surfH + 1, cz + 2, BLOCK.CRATE);
    setBlock(cx + 2, surfH + 1, cz + 2, BLOCK.CRATE);
    // ELECTRONICS medical equipment
    setBlock(cx + 4, surfH + 1, cz + 1, BLOCK.ELECTRONICS);
    setBlock(cx + 4, surfH + 1, cz + 2, BLOCK.ELECTRONICS);
    // Red cross on front wall using BRICK blocks (cross pattern)
    setBlock(cx + 3, surfH + 2, cz, BLOCK.BRICK);
    setBlock(cx + 2, surfH + 1, cz, BLOCK.BRICK);
    setBlock(cx + 3, surfH + 1, cz, BLOCK.BRICK);
    setBlock(cx + 4, surfH + 1, cz, BLOCK.BRICK);
  }

  function generateCommandPost(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // 5x5 reinforced walls, 3 high
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 5; z++) {
        if (x === 0 || x === 4 || z === 0 || z === 4) {
          for (let y = 1; y <= 3; y++) {
            setBlock(cx + x, surfH + y, cz + z, BLOCK.REINFORCED);
          }
        }
        // Flat concrete roof
        setBlock(cx + x, surfH + 4, cz + z, BLOCK.CONCRETE);
      }
    }
    // Door
    setBlock(cx + 2, surfH + 1, cz, BLOCK.AIR);
    setBlock(cx + 2, surfH + 2, cz, BLOCK.AIR);
    // Antenna: metal pole 3 high on roof
    for (let y = 5; y <= 7; y++) {
      setBlock(cx + 2, surfH + y, cz + 2, BLOCK.METAL);
    }
    // Interior: ELECTRONICS (radio), CRATE (maps table)
    setBlock(cx + 1, surfH + 1, cz + 3, BLOCK.ELECTRONICS);
    setBlock(cx + 3, surfH + 1, cz + 3, BLOCK.CRATE);
    // Sandbag perimeter 2 blocks out
    for (let x = -2; x <= 6; x++) {
      setBlock(cx + x, surfH, cz - 2, BLOCK.SANDBAG);
      setBlock(cx + x, surfH + 1, cz - 2, BLOCK.SANDBAG);
      setBlock(cx + x, surfH, cz + 6, BLOCK.SANDBAG);
      setBlock(cx + x, surfH + 1, cz + 6, BLOCK.SANDBAG);
    }
    for (let z = -1; z <= 5; z++) {
      setBlock(cx - 2, surfH, cz + z, BLOCK.SANDBAG);
      setBlock(cx - 2, surfH + 1, cz + z, BLOCK.SANDBAG);
      setBlock(cx + 6, surfH, cz + z, BLOCK.SANDBAG);
      setBlock(cx + 6, surfH + 1, cz + z, BLOCK.SANDBAG);
    }
  }

  function generateAntiAirPosition(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // Circular sandbag wall (radius 3)
    for (let angle = 0; angle < Math.PI * 2; angle += 0.35) {
      const bx = cx + Math.round(Math.cos(angle) * 3);
      const bz = cz + Math.round(Math.sin(angle) * 3);
      setBlock(bx, surfH + 1, bz, BLOCK.SANDBAG);
      setBlock(bx, surfH + 2, bz, BLOCK.SANDBAG);
    }
    // Central metal pedestal 2 high
    setBlock(cx, surfH + 1, cz, BLOCK.METAL);
    setBlock(cx, surfH + 2, cz, BLOCK.METAL);
    // "Gun barrel" = metal blocks extending up and out at angle
    setBlock(cx, surfH + 3, cz, BLOCK.METAL);
    setBlock(cx, surfH + 4, cz - 1, BLOCK.METAL);
    setBlock(cx, surfH + 5, cz - 2, BLOCK.METAL);
  }

  function generateAmmoDumpBerm(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // 4x4 earthen berm: dirt walls 2 high around
    for (let x = 0; x < 4; x++) {
      for (let z = 0; z < 4; z++) {
        if (x === 0 || x === 3 || z === 0 || z === 3) {
          setBlock(cx + x, surfH + 1, cz + z, BLOCK.DIRT);
          setBlock(cx + x, surfH + 2, cz + z, BLOCK.DIRT);
        }
      }
    }
    // Interior filled with CRATE blocks
    for (let x = 1; x <= 2; x++) {
      for (let z = 1; z <= 2; z++) {
        setBlock(cx + x, surfH + 1, cz + z, BLOCK.CRATE);
        setBlock(cx + x, surfH + 2, cz + z, BLOCK.CRATE);
      }
    }
    // METAL roof
    for (let x = 0; x < 4; x++) {
      for (let z = 0; z < 4; z++) {
        setBlock(cx + x, surfH + 3, cz + z, BLOCK.METAL);
      }
    }
  }

  function generateObservationPost(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // 4 WOOD corner posts going up 8 blocks
    for (let y = 1; y <= 8; y++) {
      setBlock(cx, surfH + y, cz, BLOCK.WOOD);
      setBlock(cx + 2, surfH + y, cz, BLOCK.WOOD);
      setBlock(cx, surfH + y, cz + 2, BLOCK.WOOD);
      setBlock(cx + 2, surfH + y, cz + 2, BLOCK.WOOD);
    }
    // Platform at top (wood floor 3x3)
    for (let x = 0; x <= 2; x++) {
      for (let z = 0; z <= 2; z++) {
        setBlock(cx + x, surfH + 8, cz + z, BLOCK.WOOD);
      }
    }
    // FENCE railing
    for (let x = 0; x <= 2; x++) {
      setBlock(cx + x, surfH + 9, cz, BLOCK.FENCE);
      setBlock(cx + x, surfH + 9, cz + 2, BLOCK.FENCE);
    }
    for (let z = 0; z <= 2; z++) {
      setBlock(cx, surfH + 9, cz + z, BLOCK.FENCE);
      setBlock(cx + 2, surfH + 9, cz + z, BLOCK.FENCE);
    }
    // Ladder: METAL blocks on one side going up
    for (let y = 1; y <= 8; y++) {
      setBlock(cx - 1, surfH + y, cz, BLOCK.METAL);
    }
  }

  function generateDestroyedTank(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // 5x3x2 hull of METAL blocks
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 3; z++) {
        setBlock(cx + x, surfH + 1, cz + z, BLOCK.METAL);
        setBlock(cx + x, surfH + 2, cz + z, BLOCK.METAL);
      }
    }
    // Turret: 2x2 METAL on top
    setBlock(cx + 2, surfH + 3, cz, BLOCK.METAL);
    setBlock(cx + 3, surfH + 3, cz, BLOCK.METAL);
    setBlock(cx + 2, surfH + 3, cz + 1, BLOCK.METAL);
    setBlock(cx + 3, surfH + 3, cz + 1, BLOCK.METAL);
    // Angled "barrel" extending forward
    setBlock(cx + 4, surfH + 3, cz, BLOCK.METAL);
    setBlock(cx + 5, surfH + 4, cz, BLOCK.METAL);
    // Damaged: remove random blocks from hull
    for (let i = 0; i < 3; i++) {
      const rx = cx + Math.floor(Math.random() * 5);
      const rz = cz + Math.floor(Math.random() * 3);
      setBlock(rx, surfH + 2, rz, BLOCK.AIR);
    }
    // Add RUBBLE around
    for (let i = 0; i < 6; i++) {
      const rx = cx - 1 + Math.floor(Math.random() * 7);
      const rz = cz - 1 + Math.floor(Math.random() * 5);
      setBlock(rx, surfH, rz, BLOCK.RUBBLE);
    }
    // Burning: FUEL_BARREL block inside
    setBlock(cx + 2, surfH + 2, cz + 1, BLOCK.FUEL_BARREL);
  }

  function generateTrenchNetwork(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // Z-shaped trench, 2 blocks deep, 2 wide
    // Segment 1: east-west
    for (let x = 0; x < 8; x++) {
      for (let w = 0; w < 2; w++) {
        setBlock(cx + x, surfH, cz + w, BLOCK.AIR);
        setBlock(cx + x, surfH - 1, cz + w, BLOCK.AIR);
        setBlock(cx + x, surfH - 2, cz + w, BLOCK.DIRT);
        // Occasional wooden duckboard floor
        if (x % 3 === 0) setBlock(cx + x, surfH - 2, cz + w, BLOCK.WOOD);
      }
      // Sandbag parapets on top edges
      setBlock(cx + x, surfH + 1, cz - 1, BLOCK.SANDBAG);
      setBlock(cx + x, surfH + 1, cz + 2, BLOCK.SANDBAG);
    }
    // Segment 2: diagonal connector (north-south)
    for (let z = 2; z < 8; z++) {
      for (let w = 0; w < 2; w++) {
        setBlock(cx + 7 + w, surfH, cz + z, BLOCK.AIR);
        setBlock(cx + 7 + w, surfH - 1, cz + z, BLOCK.AIR);
        setBlock(cx + 7 + w, surfH - 2, cz + z, BLOCK.DIRT);
        if (z % 3 === 0) setBlock(cx + 7 + w, surfH - 2, cz + z, BLOCK.WOOD);
      }
      setBlock(cx + 6, surfH + 1, cz + z, BLOCK.SANDBAG);
      setBlock(cx + 9, surfH + 1, cz + z, BLOCK.SANDBAG);
    }
    // Segment 3: east-west return
    for (let x = 0; x < 8; x++) {
      for (let w = 0; w < 2; w++) {
        setBlock(cx + x, surfH, cz + 8 + w, BLOCK.AIR);
        setBlock(cx + x, surfH - 1, cz + 8 + w, BLOCK.AIR);
        setBlock(cx + x, surfH - 2, cz + 8 + w, BLOCK.DIRT);
        if (x % 3 === 0) setBlock(cx + x, surfH - 2, cz + 8 + w, BLOCK.WOOD);
      }
      setBlock(cx + x, surfH + 1, cz + 7, BLOCK.SANDBAG);
      setBlock(cx + x, surfH + 1, cz + 10, BLOCK.SANDBAG);
    }
  }

  function generateRazorWireField(cx, cz) {
    const surfH = getTerrainHeight(cx, cz);
    // 10x3 area of FENCE blocks at ground+1 level, spaced every other block
    for (let x = 0; x < 10; x++) {
      for (let z = 0; z < 3; z++) {
        if ((x + z) % 2 === 0) {
          setBlock(cx + x, surfH + 1, cz + z, BLOCK.FENCE);
        }
      }
    }
  }

  /* ── Prebuilt: Complete Avdiivka Residential Home ────────────────── */
  function generateAvdiivkaHome(ox, oz, variant) {
    variant = variant || 0;
    const surfH = getTerrainHeight(ox, oz);
    const floors = 2 + (variant % 2);  // 2-3 story homes
    const w = 6 + (variant % 3);       // 6-8 wide
    const d = 5 + (variant % 2);       // 5-6 deep
    const floorH = 3;                  // 3 blocks per floor

    for (let floor = 0; floor < floors; floor++) {
      const baseY = surfH + 1 + floor * floorH;

      // Floor surface
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          let floorBlock = floor === 0 ? BLOCK.LINOLEUM : BLOCK.CARPET;
          if (variant % 3 === 1 && floor > 0) floorBlock = BLOCK.WOOD;
          setBlock(ox + x, baseY, oz + z, floorBlock);
        }
      }

      // Walls — brick exterior, wallpaper/plaster interior
      for (let y = 1; y <= floorH - 1; y++) {
        for (let x = 0; x < w; x++) {
          // Front and back walls
          setBlock(ox + x, baseY + y, oz, BLOCK.BRICK);
          setBlock(ox + x, baseY + y, oz + d - 1, BLOCK.BRICK);
        }
        for (let z = 0; z < d; z++) {
          // Side walls
          setBlock(ox, baseY + y, oz + z, BLOCK.BRICK);
          setBlock(ox + w - 1, baseY + y, oz + z, BLOCK.BRICK);
        }

        // Interior wallpaper lining (1 block inside exterior walls)
        if (y <= floorH - 2) {
          for (let x = 1; x < w - 1; x++) {
            setBlock(ox + x, baseY + y, oz + 1, BLOCK.WALLPAPER);
            setBlock(ox + x, baseY + y, oz + d - 2, BLOCK.WALLPAPER);
          }
          for (let z = 1; z < d - 1; z++) {
            setBlock(ox + 1, baseY + y, oz + z, BLOCK.WALLPAPER);
            setBlock(ox + w - 2, baseY + y, oz + z, BLOCK.WALLPAPER);
          }
        }

        // Interior partition wall (divides rooms)
        const partX = Math.floor(w / 2);
        for (let z = 1; z < d - 1; z++) {
          if (z !== Math.floor(d / 2)) { // doorway gap
            setBlock(ox + partX, baseY + y, oz + z, BLOCK.PLASTER);
          }
        }
      }

      // Windows (glass panes in walls) — front and back
      for (let x = 2; x < w - 2; x += 2) {
        setBlock(ox + x, baseY + 1, oz, BLOCK.GLASS);
        setBlock(ox + x, baseY + 1, oz + d - 1, BLOCK.GLASS);
      }
      // Side windows
      for (let z = 2; z < d - 2; z += 2) {
        setBlock(ox, baseY + 1, oz + z, BLOCK.GLASS);
        setBlock(ox + w - 1, baseY + 1, oz + z, BLOCK.GLASS);
      }

      // Door on ground floor front
      if (floor === 0) {
        setBlock(ox + Math.floor(w / 2), baseY + 1, oz, BLOCK.AIR);
        setBlock(ox + Math.floor(w / 2), baseY + 2, oz, BLOCK.AIR);
      }

      // Kitchen area (ceramic tiles on ground floor in one room)
      if (floor === 0) {
        for (let x = 1; x < partX; x++) {
          for (let z = 1; z < d - 1; z++) {
            setBlock(ox + x, baseY, oz + z, BLOCK.CERAMIC);
          }
        }
      }
    }

    // Roof — pitched with rooftiles
    const roofBaseY = surfH + 1 + floors * floorH;
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        setBlock(ox + x, roofBaseY, oz + z, BLOCK.ROOFTILE);
      }
    }
    // Peaked ridge
    const midZ = Math.floor(d / 2);
    for (let x = 0; x < w; x++) {
      setBlock(ox + x, roofBaseY + 1, oz + midZ, BLOCK.SHINGLE);
    }

    // Battle damage — random holes in walls (war-torn effect)
    const holeCount = 2 + (variant % 3);
    for (let h = 0; h < holeCount; h++) {
      const hx = ox + 1 + Math.floor(Math.random() * (w - 2));
      const hy = surfH + 2 + Math.floor(Math.random() * (floors * floorH - 2));
      const hz = (Math.random() > 0.5) ? oz : oz + d - 1;
      setBlock(hx, hy, hz, BLOCK.AIR);
      if (Math.random() > 0.5) setBlock(hx + 1, hy, hz, BLOCK.AIR);
      // Rubble below
      setBlock(hx, surfH, hz + (hz === oz ? -1 : 1), BLOCK.RUBBLE);
    }
  }

  /* ── Prebuilt: Hostomel Airport Terminal (full voxel) ──────────── */
  function generateHostomelTerminal(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    // Main terminal building: 24 wide x 12 deep x 5 high
    const tw = 24, td = 12, th = 5;


    // Foundation pad (concrete)
    for (let x = -2; x < tw + 2; x++) {
      for (let z = -2; z < td + 2; z++) {
        setBlock(ox + x, surfH, oz + z, BLOCK.CONCRETE);
      }
    }

    // Terminal floor — linoleum/ceramic
    for (let x = 0; x < tw; x++) {
      for (let z = 0; z < td; z++) {
        setBlock(ox + x, surfH + 1, oz + z, (x + z) % 4 < 2 ? BLOCK.CERAMIC : BLOCK.LINOLEUM);
      }
    }


    // Terminal walls — reinforced concrete with glass curtain wall front
    for (let y = 1; y <= th; y++) {
      for (let x = 0; x < tw; x++) {
        // Back wall (solid concrete)
        setBlock(ox + x, surfH + 1 + y, oz + td - 1, BLOCK.CONCRETE);
        // Front wall (glass curtain wall with concrete columns every 4 blocks)
        if (x % 4 === 0) {
          setBlock(ox + x, surfH + 1 + y, oz, BLOCK.REINFORCED);
        } else if (y <= th - 1) {
          setBlock(ox + x, surfH + 1 + y, oz, BLOCK.GLASS);
        } else {
          setBlock(ox + x, surfH + 1 + y, oz, BLOCK.CONCRETE);
        }
      }
      for (let z = 0; z < td; z++) {
        // Side walls (concrete)
        setBlock(ox, surfH + 1 + y, oz + z, BLOCK.CONCRETE);
        setBlock(ox + tw - 1, surfH + 1 + y, oz + z, BLOCK.CONCRETE);
      }
    }

    // Entrances (3 double doors in front glass wall)
    for (let door = 0; door < 3; door++) {
      const doorX = ox + 4 + door * 8;
      for (let dx = 0; dx < 2; dx++) {
        setBlock(doorX + dx, surfH + 2, oz, BLOCK.AIR);
        setBlock(doorX + dx, surfH + 3, oz, BLOCK.AIR);
      }
    }

    // Interior columns (reinforced pillars every 6 blocks)
    for (let x = 3; x < tw; x += 6) {
      for (let z = 3; z < td; z += 6) {
        for (let y = 2; y <= th; y++) {
          setBlock(ox + x, surfH + y, oz + z, BLOCK.REINFORCED);
        }
      }
    }

    // Interior partition walls (check-in counters, security)
    // Check-in counter row at z=3
    for (let x = 2; x < tw - 2; x++) {
      setBlock(ox + x, surfH + 2, oz + 3, BLOCK.METAL);
      setBlock(ox + x, surfH + 3, oz + 3, BLOCK.ELECTRONICS);
    }
    // Gap for walkthrough every 4 blocks
    for (let x = 5; x < tw - 2; x += 5) {
      setBlock(ox + x, surfH + 2, oz + 3, BLOCK.AIR);
      setBlock(ox + x, surfH + 3, oz + 3, BLOCK.AIR);
    }

    // Security screening at z=6
    for (let x = 4; x < tw - 4; x += 3) {
      setBlock(ox + x, surfH + 2, oz + 6, BLOCK.METAL);
      setBlock(ox + x + 1, surfH + 2, oz + 6, BLOCK.METAL);
    }

    // Gate waiting areas (bench rows)
    for (let gateZ = 8; gateZ <= 10; gateZ += 2) {
      for (let x = 2; x < tw - 2; x += 4) {
        setBlock(ox + x, surfH + 2, oz + gateZ, BLOCK.WOOD);
        setBlock(ox + x + 1, surfH + 2, oz + gateZ, BLOCK.WOOD);
      }
    }

    // Flat roof (reinforced + metal)
    for (let x = -1; x < tw + 1; x++) {
      for (let z = -1; z < td + 1; z++) {
        setBlock(ox + x, surfH + 1 + th + 1, oz + z, BLOCK.REINFORCED);
      }
    }

    // Boarding bridges (2 jetways extending from back wall)
    for (let jw = 0; jw < 2; jw++) {
      const jwX = ox + 6 + jw * 12;
      for (let z = td; z < td + 6; z++) {
        setBlock(jwX, surfH + 3, oz + z, BLOCK.METAL);
        setBlock(jwX + 1, surfH + 3, oz + z, BLOCK.METAL);
        setBlock(jwX, surfH + 4, oz + z, BLOCK.METAL);
        setBlock(jwX + 1, surfH + 4, oz + z, BLOCK.METAL);
        // Floor of jetway
        setBlock(jwX, surfH + 2, oz + z, BLOCK.LINOLEUM);
        setBlock(jwX + 1, surfH + 2, oz + z, BLOCK.LINOLEUM);
        // Roof
        setBlock(jwX, surfH + 5, oz + z, BLOCK.METAL);
        setBlock(jwX + 1, surfH + 5, oz + z, BLOCK.METAL);
      }
    }

    // Battle damage — shell holes in terminal
    for (let dmg = 0; dmg < 5; dmg++) {
      const dmgX = ox + 2 + Math.floor(Math.random() * (tw - 4));
      const dmgY = surfH + 2 + Math.floor(Math.random() * th);
      const dmgZ = Math.random() > 0.5 ? oz : oz + td - 1;
      setBlock(dmgX, dmgY, dmgZ, BLOCK.AIR);
      setBlock(dmgX + 1, dmgY, dmgZ, BLOCK.AIR);
      // Rubble scatter
      setBlock(dmgX, surfH, dmgZ + (dmgZ === oz ? -1 : 1), BLOCK.RUBBLE);
    }
  }

  /* ── Prebuilt: Full Hostomel Airport Complex ───────────────────── */
  function generateHostomelAirport(ox, oz) {
    // ─── Flatten entire airport footprint ────────────────────────────────
    var lSamples = [];
    for (var ls = -6; ls <= 6; ls++) {
      lSamples.push(getTerrainHeight(ox + ls * 11, oz));
      lSamples.push(getTerrainHeight(ox, oz + ls * 9));
    }
    var base = Math.round(lSamples.reduce(function(a, b) { return a + b; }, 0) / lSamples.length);
    levelArea(ox - 72, ox + 72, oz - 52, oz + 64, base, BLOCK.DIRT, BLOCK.DIRT);
    var by = base;
    function sf(x, z, blk) { setBlock(x, by, z, blk); }

    // ─── 1. MAIN RUNWAY (130 long × 6 wide) ─────────────────────────────
    for (var rx = ox - 65; rx <= ox + 65; rx++) {
      for (var rw = -3; rw <= 2; rw++) { sf(rx, oz + rw, BLOCK.ASPHALT); }
      if (Math.abs(rx - ox) % 4 < 2) setBlock(rx, by, oz, BLOCK.WHITE_TILE);
      if (rx >= ox - 65 && rx <= ox - 58 || rx >= ox + 58 && rx <= ox + 65) {
        for (var tb = -3; tb <= 2; tb++) {
          if ((tb + 3) % 2 === 0) setBlock(rx, by, oz + tb, BLOCK.WHITE_TILE);
        }
      }
    }

    // ─── 2. PARALLEL SECONDARY RUNWAY (110 × 4) ─────────────────────────
    for (var rx2 = ox - 55; rx2 <= ox + 55; rx2++) {
      for (var rw2 = 0; rw2 <= 3; rw2++) { sf(rx2, oz + 14 + rw2, BLOCK.ASPHALT); }
      if (Math.abs(rx2 - ox) % 3 === 0) setBlock(rx2, by, oz + 16, BLOCK.WHITE_TILE);
    }

    // ─── 3. EAST/WEST TAXIWAYS (runways → apron) ────────────────────────
    for (var tz = oz; tz <= oz + 38; tz++) {
      for (var tw = 0; tw < 4; tw++) {
        sf(ox + 52 + tw, tz, BLOCK.ASPHALT);
        sf(ox - 55 + tw, tz, BLOCK.ASPHALT);
      }
    }

    // ─── 4. CONCRETE APRON ───────────────────────────────────────────────
    for (var ax = ox - 52; ax <= ox + 54; ax++) {
      for (var az = oz + 20; az <= oz + 40; az++) { sf(ax, az, BLOCK.CONCRETE); }
    }
    for (var st = 0; st < 9; st++) {
      var stx = ox - 48 + st * 12;
      for (var stz = oz + 21; stz <= oz + 24; stz++) {
        sf(stx, stz, BLOCK.WHITE_TILE); sf(stx + 1, stz, BLOCK.WHITE_TILE);
      }
    }

    // ─── 5. MAIN PASSENGER TERMINAL (40×14×7) ───────────────────────────
    var tmx = ox - 17, tmz = oz + 42;
    for (var tbx = 0; tbx < 40; tbx++) {
      for (var tbz = 0; tbz < 14; tbz++) {
        for (var tby = 1; tby <= 7; tby++) {
          var isTwall = (tbx === 0 || tbx === 39 || tbz === 0 || tbz === 13 || tby === 7);
          if (isTwall) {
            setBlock(tmx + tbx, by + tby, tmz + tbz, BLOCK.CONCRETE);
          } else if (tby >= 2 && tby <= 6 && tbx % 4 === 1 && (tbz === 0 || tbz === 13)) {
            setBlock(tmx + tbx, by + tby, tmz + tbz, BLOCK.GLASS);
          }
        }
      }
    }
    for (var tfx = 1; tfx < 39; tfx++) {
      for (var tfz = 1; tfz < 13; tfz++) { setBlock(tmx + tfx, by, tmz + tfz, BLOCK.LINOLEUM); }
    }
    for (var cx2 = tmx + 8; cx2 <= tmx + 32; cx2++) {
      setBlock(cx2, by + 8, tmz, BLOCK.GLASS);
      setBlock(cx2, by + 8, tmz - 1, BLOCK.GLASS);
    }
    for (var dri = 0; dri < 4; dri++) {
      var drx = tmx + 8 + dri * 8;
      setBlock(drx, by + 1, tmz, BLOCK.AIR); setBlock(drx, by + 2, tmz, BLOCK.AIR);
      setBlock(drx + 1, by + 1, tmz, BLOCK.AIR); setBlock(drx + 1, by + 2, tmz, BLOCK.AIR);
    }

    // ─── 6. AN-225 MRIYA MEGA HANGAR (32×22×14) ─────────────────────────
    // The Antonov An-225 was destroyed here on 27 Feb 2022.
    var hgx = ox - 70, hgz = oz + 40;
    for (var hbx = 0; hbx < 32; hbx++) {
      for (var hbz = 0; hbz < 22; hbz++) {
        for (var hby = 1; hby <= 14; hby++) {
          if (hbx === 0 || hbx === 31 || hbz === 0 || hbz === 21 || hby === 14) {
            setBlock(hgx + hbx, by + hby, hgz + hbz, BLOCK.METAL);
          }
        }
      }
    }
    for (var hrx = 1; hrx < 31; hrx++) {
      for (var hrz = 1; hrz < 21; hrz++) { setBlock(hgx + hrx, by + 14, hgz + hrz, BLOCK.SHINGLE); }
    }
    for (var hdx = 3; hdx < 29; hdx++) {
      for (var hdy = 1; hdy <= 12; hdy++) { setBlock(hgx + hdx, by + hdy, hgz, BLOCK.AIR); }
    }
    for (var hfx = 1; hfx < 31; hfx++) {
      for (var hfz = 1; hfz < 21; hfz++) { setBlock(hgx + hfx, by, hgz + hfz, BLOCK.CONCRETE); }
    }
    // AN-225 wreckage (fuselage + wings + fire at nose)
    for (var fn = 0; fn < 26; fn++) {
      setBlock(hgx + 3 + fn, by + 1, hgz + 10, BLOCK.RUBBLE);
      setBlock(hgx + 3 + fn, fn < 20 ? by + 3 : by + 2, hgz + 10, BLOCK.RUBBLE);
    }
    for (var wn = 0; wn < 14; wn++) {
      setBlock(hgx + 10, by + 1, hgz + 4 + wn, BLOCK.RUBBLE);
      setBlock(hgx + 10, by + 2, hgz + 4 + wn, BLOCK.RUBBLE);
    }
    for (var np = -1; np <= 1; np++) {
      setBlock(hgx + 4, by + 1, hgz + 10 + np, BLOCK.FIRE);
      setBlock(hgx + 5, by + 2, hgz + 10 + np, BLOCK.FIRE);
    }

    // ─── 7. FIVE CARGO HANGARS (south of runways) ───────────────────────
    for (var hni = 0; hni < 5; hni++) {
      var sHx = ox - 60 + hni * 26, sHz = oz - 24;
      for (var shby = 1; shby <= 7; shby++) {
        for (var shbx = 0; shbx < 12; shbx++) {
          setBlock(sHx + shbx, by + shby, sHz, BLOCK.METAL);
          setBlock(sHx + shbx, by + shby, sHz + 9, BLOCK.METAL);
          if (shbx === 0 || shbx === 11) {
            for (var shz = 0; shz < 10; shz++) setBlock(sHx + shbx, by + shby, sHz + shz, BLOCK.METAL);
          }
        }
        for (var srx = 0; srx < 12; srx++) {
          for (var srz = 0; srz < 10; srz++) setBlock(sHx + srx, by + 8, sHz + srz, BLOCK.SHINGLE);
        }
      }
      for (var shdx = 2; shdx < 10; shdx++) {
        for (var shdy = 1; shdy <= 5; shdy++) setBlock(sHx + shdx, by + shdy, sHz + 9, BLOCK.AIR);
      }
      for (var shfx = 1; shfx < 11; shfx++) {
        for (var shfz = 1; shfz < 9; shfz++) setBlock(sHx + shfx, by, sHz + shfz, BLOCK.CONCRETE);
      }
    }

    // ─── 8. CONTROL TOWER (4×4 shaft, 22 high + 8×8 cab) ───────────────
    var ctX = ox + 28, ctZ = oz + 44;
    for (var cty = 1; cty <= 22; cty++) {
      for (var ctx = 0; ctx < 4; ctx++) {
        for (var ctz = 0; ctz < 4; ctz++) {
          if (ctx === 0 || ctx === 3 || ctz === 0 || ctz === 3) {
            setBlock(ctX + ctx, by + cty, ctZ + ctz, BLOCK.REINFORCED);
          }
        }
      }
    }
    for (var odx = -2; odx < 6; odx++) {
      for (var odz = -2; odz < 6; odz++) {
        setBlock(ctX + odx, by + 23, ctZ + odz, BLOCK.REINFORCED);
        if (odx === -2 || odx === 5 || odz === -2 || odz === 5) {
          setBlock(ctX + odx, by + 24, ctZ + odz, BLOCK.GLASS);
          setBlock(ctX + odx, by + 25, ctZ + odz, BLOCK.GLASS);
          setBlock(ctX + odx, by + 26, ctZ + odz, BLOCK.REINFORCED);
        }
      }
    }
    setBlock(ctX + 1, by + 27, ctZ + 1, BLOCK.METAL);
    setBlock(ctX + 1, by + 28, ctZ + 1, BLOCK.ELECTRONICS);
    setBlock(ctX + 2, by + 28, ctZ + 2, BLOCK.METAL);
    setBlock(ctX, by + 28, ctZ + 2, BLOCK.METAL);

    // ─── 9. VDV HELICOPTER PADS (3 circular pads, south of runways) ─────
    // Mi-8 assault landing zones from Feb 24, 2022
    var padPos = [[ox - 28, oz - 40], [ox, oz - 42], [ox + 28, oz - 40]];
    for (var pi = 0; pi < 3; pi++) {
      var ppx = padPos[pi][0], ppz = padPos[pi][1];
      for (var pdx = -7; pdx <= 7; pdx++) {
        for (var pdz = -7; pdz <= 7; pdz++) {
          var dd = pdx * pdx + pdz * pdz;
          if (dd <= 49) sf(ppx + pdx, ppz + pdz, BLOCK.ASPHALT);
          if (dd >= 44 && dd <= 51) setBlock(ppx + pdx, by, ppz + pdz, BLOCK.WHITE_TILE);
        }
      }
      for (var hi2 = -3; hi2 <= 3; hi2++) {
        sf(ppx - 2, ppz + hi2, BLOCK.WHITE_TILE); sf(ppx + 2, ppz + hi2, BLOCK.WHITE_TILE);
      }
      sf(ppx - 1, ppz, BLOCK.WHITE_TILE); sf(ppx, ppz, BLOCK.WHITE_TILE); sf(ppx + 1, ppz, BLOCK.WHITE_TILE);
    }

    // ─── 10. PERIMETER FENCE ─────────────────────────────────────────────
    for (var pfx = ox - 70; pfx <= ox + 70; pfx++) {
      setBlock(pfx, by, oz - 50, BLOCK.FENCE); setBlock(pfx, by + 1, oz - 50, BLOCK.FENCE);
      setBlock(pfx, by, oz + 62, BLOCK.FENCE); setBlock(pfx, by + 1, oz + 62, BLOCK.FENCE);
    }
    for (var pfz = oz - 50; pfz <= oz + 62; pfz++) {
      setBlock(ox - 70, by, pfz, BLOCK.FENCE); setBlock(ox - 70, by + 1, pfz, BLOCK.FENCE);
      setBlock(ox + 70, by, pfz, BLOCK.FENCE); setBlock(ox + 70, by + 1, pfz, BLOCK.FENCE);
    }
    // Main gate (north approach)
    for (var go = -4; go <= 4; go++) {
      setBlock(ox + go, by, oz - 50, BLOCK.ASPHALT);
      setBlock(ox + go, by + 1, oz - 50, BLOCK.AIR);
      setBlock(ox + go, by + 2, oz - 50, BLOCK.AIR);
    }
    for (var gph = 1; gph <= 3; gph++) {
      for (var gpx = -8; gpx <= -5; gpx++) setBlock(ox + gpx, by + gph, oz - 50, BLOCK.CONCRETE);
      for (var gpx2 = 5; gpx2 <= 8; gpx2++) setBlock(ox + gpx2, by + gph, oz - 50, BLOCK.CONCRETE);
    }

    // ─── 11. FUEL DEPOT ──────────────────────────────────────────────────
    for (var fdi = 0; fdi < 4; fdi++) {
      for (var fdj = 0; fdj < 3; fdj++) {
        setBlock(ox + 38 + fdi * 3, by + 1, oz + 52 + fdj * 3, BLOCK.FUEL_BARREL);
      }
    }
    for (var ftbx = 0; ftbx < 10; ftbx++) {
      for (var ftbz = 0; ftbz < 8; ftbz++) {
        if (ftbx === 0 || ftbx === 9 || ftbz === 0 || ftbz === 7) {
          setBlock(ox + 35 + ftbx, by + 1, oz + 49 + ftbz, BLOCK.METAL);
          setBlock(ox + 35 + ftbx, by + 2, oz + 49 + ftbz, BLOCK.METAL);
        }
      }
    }

    // ─── 12. ROAD WAYPOINTS ──────────────────────────────────────────────
    for (var wpx = ox - 60; wpx <= ox + 60; wpx += 10) {
      _roadWaypoints.push(new THREE.Vector3(wpx, by + 0.5, oz));
    }
    for (var wpz2 = oz - 45; wpz2 <= oz + 55; wpz2 += 10) {
      _roadWaypoints.push(new THREE.Vector3(ox, by + 0.5, wpz2));
    }
  }

  /* ── Drone Nest Generator ──────────────────────────────────────── */
  var _droneNestPositions = [];
  // Track every clearable building generated this level (for mission targeting).
  var _buildings = [];

  function generateDroneNest(cx, cz) {
    var surfH = getTerrainHeight(cx, cz);
    // 5x5 concrete bunker with camo netting (metal roof)
    for (var y = 0; y < 3; y++) {
      for (var x = -2; x <= 2; x++) {
        for (var z = -2; z <= 2; z++) {
          var isWall = Math.abs(x) === 2 || Math.abs(z) === 2;
          var isRoof = y === 2;
          if (isWall || isRoof) {
            setBlock(cx + x, surfH + y, cz + z, isRoof ? BLOCK.METAL : BLOCK.CONCRETE);
          }
        }
      }
    }
    // Door opening on south side
    setBlock(cx, surfH, cz - 2, BLOCK.AIR);
    setBlock(cx, surfH + 1, cz - 2, BLOCK.AIR);
    // Antenna mast on roof
    for (var ay = 3; ay < 7; ay++) {
      setBlock(cx + 1, surfH + ay, cz + 1, BLOCK.METAL);
    }
    // Red signal light at top
    setBlock(cx + 1, surfH + 7, cz + 1, BLOCK.BRICK);
    // Control equipment inside (table)
    setBlock(cx - 1, surfH, cz, BLOCK.WOOD);
    setBlock(cx - 1, surfH + 1, cz, BLOCK.METAL);
    // Sandbag perimeter
    for (var sx = -3; sx <= 3; sx++) {
      setBlock(cx + sx, surfH, cz - 3, BLOCK.SAND);
      setBlock(cx + sx, surfH, cz + 3, BLOCK.SAND);
    }
    for (var sz = -3; sz <= 3; sz++) {
      setBlock(cx - 3, surfH, cz + sz, BLOCK.SAND);
      setBlock(cx + 3, surfH, cz + sz, BLOCK.SAND);
    }
    _droneNestPositions.push({ x: cx, y: surfH, z: cz });
  }

  /* ── Level Generation ──────────────────────────────────────────── */
  /* ════════════════════════════════════════════════════════════════
   *  WAR-ZONE RUINED-BUILDINGS GENERATOR
   *  Real-reference: post-strike apartment blocks, blown-out shop fronts,
   *  sheared-off facades, exposed reinforced-concrete floor slabs, twisted
   *  rebar columns, smashed glass, smoking craters, scattered debris.
   * ═════════════════════════════════════════════════════════════════ */

  // A single ruined HOUSE (1-2 storey, residential): partial walls, blown
  // roof, broken windows, scorched, rubble pile inside, debris around.
  function generateRuinedHouse(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    const w = 5 + Math.floor(Math.random() * 3);          // 5-7 wide
    const d = 5 + Math.floor(Math.random() * 3);          // 5-7 deep
    const storeys = 1 + (Math.random() < 0.5 ? 1 : 0);    // 1-2 floors
    const wallMat = Math.random() < 0.5 ? BLOCK.BRICK : BLOCK.PLASTER;
    const collapseSide = Math.floor(Math.random() * 4);   // 0=N,1=S,2=E,3=W

    for (let s = 0; s < storeys; s++) {
      const floorY = surfH + s * 4;
      // Floor slab (reinforced concrete) — partially broken on upper storeys
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          if (s > 0 && Math.random() < 0.30) continue;    // collapsed slab tiles
          setBlock(ox + x, floorY, oz + z, BLOCK.CONCRETE);
        }
      }
      // Walls — perimeter, with damage
      for (let y = 1; y <= 3; y++) {
        for (let x = 0; x < w; x++) {
          for (let z = 0; z < d; z++) {
            const isWall = (x === 0 || x === w - 1 || z === 0 || z === d - 1);
            if (!isWall) continue;
            // Mark a "blown-out" side: skip large chunk of that wall
            if (collapseSide === 0 && z === 0      && y >= 2 && Math.random() < 0.75) continue;
            if (collapseSide === 1 && z === d - 1  && y >= 2 && Math.random() < 0.75) continue;
            if (collapseSide === 2 && x === w - 1  && y >= 2 && Math.random() < 0.75) continue;
            if (collapseSide === 3 && x === 0      && y >= 2 && Math.random() < 0.75) continue;
            // Random shrapnel holes
            if (Math.random() < 0.18) continue;
            // Window slots row at y=2
            if (y === 2 && (x === Math.floor(w / 2) || z === Math.floor(d / 2))) {
              if (Math.random() < 0.4) continue;          // broken window = hole
              setBlock(ox + x, floorY + y, oz + z, BLOCK.GLASS);
              continue;
            }
            setBlock(ox + x, floorY + y, oz + z, wallMat);
          }
        }
      }
    }
    // Rubble pile inside (1-3 high)
    const rubbleN = 6 + Math.floor(Math.random() * 6);
    for (let r = 0; r < rubbleN; r++) {
      const rx = ox + 1 + Math.floor(Math.random() * (w - 2));
      const rz = oz + 1 + Math.floor(Math.random() * (d - 2));
      const rh = 1 + Math.floor(Math.random() * 2);
      for (let yy = 0; yy < rh; yy++) {
        setBlock(rx, surfH + 1 + yy, rz, BLOCK.RUBBLE);
      }
    }
    // Twisted rebar (vertical METAL columns sticking up where roof failed)
    for (let r = 0; r < 3 + Math.floor(Math.random() * 3); r++) {
      const rx = ox + 1 + Math.floor(Math.random() * (w - 2));
      const rz = oz + 1 + Math.floor(Math.random() * (d - 2));
      const rh = 2 + Math.floor(Math.random() * 3);
      for (let yy = 0; yy < rh; yy++) {
        setBlock(rx, surfH + 4 + yy, rz, BLOCK.METAL);
      }
    }
    // Scorch / soot ring (RUBBLE blocks scattered around perimeter)
    for (let r = 0; r < 14; r++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = (Math.max(w, d) / 2) + 1 + Math.random() * 3;
      const rx = ox + Math.floor(w / 2) + Math.floor(Math.cos(ang) * rad);
      const rz = oz + Math.floor(d / 2) + Math.floor(Math.sin(ang) * rad);
      const rh = getTerrainHeight(rx, rz);
      if (rh > 0) setBlock(rx, rh + 1, rz, BLOCK.RUBBLE);
    }
    // Doorway hole (front face)
    setBlock(ox + Math.floor(w / 2), surfH + 1, oz, BLOCK.AIR);
    setBlock(ox + Math.floor(w / 2), surfH + 2, oz, BLOCK.AIR);
    // Burning fire pocket inside (small, ~25% chance)
    if (Math.random() < 0.25) {
      setBlock(ox + 1, surfH + 1, oz + 1, BLOCK.FIRE);
    }
  }

  // A single ruined COMMERCIAL building (shop / office): wider, shop-front
  // glass mostly shattered, signage block, sheared upper floors, more rubble.
  function generateRuinedCommercial(ox, oz) {
    const surfH = getTerrainHeight(ox, oz);
    const w = 8 + Math.floor(Math.random() * 5);          // 8-12 wide
    const d = 6 + Math.floor(Math.random() * 4);          // 6-9 deep
    const storeys = 2 + Math.floor(Math.random() * 2);    // 2-3 floors
    const collapseSide = Math.floor(Math.random() * 4);

    for (let s = 0; s < storeys; s++) {
      const floorY = surfH + s * 4;
      // Concrete floor slab (with damage on upper floors)
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          if (s > 0 && Math.random() < 0.40) continue;    // upper floor partially gone
          setBlock(ox + x, floorY, oz + z, BLOCK.CONCRETE);
        }
      }
      // Walls — mostly concrete
      for (let y = 1; y <= 3; y++) {
        for (let x = 0; x < w; x++) {
          for (let z = 0; z < d; z++) {
            const isWall = (x === 0 || x === w - 1 || z === 0 || z === d - 1);
            if (!isWall) continue;
            // Blown-out face on collapse side, upper half
            if (collapseSide === 0 && z === 0     && y >= 2 && Math.random() < 0.85) continue;
            if (collapseSide === 1 && z === d - 1 && y >= 2 && Math.random() < 0.85) continue;
            if (collapseSide === 2 && x === w - 1 && y >= 2 && Math.random() < 0.85) continue;
            if (collapseSide === 3 && x === 0     && y >= 2 && Math.random() < 0.85) continue;
            // Ground floor = shop-front: alternate glass and concrete pillars
            if (s === 0 && y === 1 && (z === 0 || z === d - 1)) {
              const isPillar = (x % 3 === 0);
              if (isPillar) {
                setBlock(ox + x, floorY + y, oz + z, BLOCK.CONCRETE);
              } else if (Math.random() < 0.35) {
                setBlock(ox + x, floorY + y, oz + z, BLOCK.GLASS);
              } // else hole (smashed shopfront)
              continue;
            }
            // Upper floors: random window grid
            if (y === 2 && Math.random() < 0.30) continue; // blown window
            // Random shrapnel holes
            if (Math.random() < 0.14) continue;
            setBlock(ox + x, floorY + y, oz + z, BLOCK.CONCRETE);
          }
        }
      }
    }
    // Hanging signage (METAL block at front-top)
    setBlock(ox + Math.floor(w / 2), surfH + storeys * 4 - 1, oz - 1, BLOCK.SIGN || BLOCK.METAL);

    // Big rubble pile inside (15-25 blocks)
    const rubbleN = 15 + Math.floor(Math.random() * 11);
    for (let r = 0; r < rubbleN; r++) {
      const rx = ox + 1 + Math.floor(Math.random() * (w - 2));
      const rz = oz + 1 + Math.floor(Math.random() * (d - 2));
      const rh = 1 + Math.floor(Math.random() * 3);
      for (let yy = 0; yy < rh; yy++) {
        setBlock(rx, surfH + 1 + yy, rz, BLOCK.RUBBLE);
      }
    }
    // Twisted rebar (vertical METAL stalks)
    for (let r = 0; r < 6; r++) {
      const rx = ox + 1 + Math.floor(Math.random() * (w - 2));
      const rz = oz + 1 + Math.floor(Math.random() * (d - 2));
      const rh = 3 + Math.floor(Math.random() * 4);
      for (let yy = 0; yy < rh; yy++) {
        setBlock(rx, surfH + storeys * 4 + yy - 2, rz, BLOCK.METAL);
      }
    }
    // Glass shards & broken-window debris around
    for (let r = 0; r < 25; r++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = (Math.max(w, d) / 2) + 1 + Math.random() * 4;
      const rx = ox + Math.floor(w / 2) + Math.floor(Math.cos(ang) * rad);
      const rz = oz + Math.floor(d / 2) + Math.floor(Math.sin(ang) * rad);
      const rh = getTerrainHeight(rx, rz);
      if (rh > 0) setBlock(rx, rh + 1, rz, Math.random() < 0.3 ? BLOCK.GLASS : BLOCK.RUBBLE);
    }
    // 1-2 fire pockets inside
    for (let f = 0; f < 1 + Math.floor(Math.random() * 2); f++) {
      const fx = ox + 1 + Math.floor(Math.random() * (w - 2));
      const fz = oz + 1 + Math.floor(Math.random() * (d - 2));
      setBlock(fx, surfH + 1, fz, BLOCK.FIRE);
    }
    // Doorway / smashed entrance
    for (let dx = -1; dx <= 1; dx++) {
      setBlock(ox + Math.floor(w / 2) + dx, surfH + 1, oz, BLOCK.AIR);
      setBlock(ox + Math.floor(w / 2) + dx, surfH + 2, oz, BLOCK.AIR);
    }
  }

  // Distribute many ruined homes + commercial buildings across the map,
  // avoiding the central ~25 m radius (player spawn) and any existing
  // friendly outpost area. Real-zone density: 25-40 ruins per stage.
  function generateWarZoneRuins(opts) {
    opts = opts || {};
    const homeCount       = opts.homes       || (18 + Math.floor(Math.random() * 8));   // 18-25
    const commercialCount = opts.commercial  || (8  + Math.floor(Math.random() * 6));   // 8-13
    const minR            = opts.minR        || 22;   // keep clear of player spawn
    const maxR            = opts.maxR        || (WORLD_CHUNKS * CHUNK_SIZE * 0.42);

    function pick(size) {
      // Try a few times to find a flat spot
      for (let attempt = 0; attempt < 6; attempt++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = minR + Math.random() * (maxR - minR);
        const ox = Math.floor(Math.cos(ang) * rad);
        const oz = Math.floor(Math.sin(ang) * rad);
        // Avoid water
        const h = getTerrainHeight(ox, oz);
        if (h < 1) continue;
        // Avoid already-occupied spots (cheap test: top block isn't AIR)
        const top = getBlock(ox, h + 1, oz);
        if (top !== BLOCK.AIR) continue;
        return { ox, oz };
      }
      return null;
    }

    for (let i = 0; i < homeCount; i++) {
      const p = pick(7);
      if (p) generateRuinedHouse(p.ox, p.oz);
    }
    for (let i = 0; i < commercialCount; i++) {
      const p = pick(12);
      if (p) generateRuinedCommercial(p.ox, p.oz);
    }
    // Bonus: a "destroyed block" cluster — 3-4 ruins close together (city block hit hard)
    for (let cluster = 0; cluster < 2; cluster++) {
      const center = pick(20);
      if (!center) continue;
      const cnt = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < cnt; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r   = 8 + Math.random() * 10;
        const cx  = center.ox + Math.floor(Math.cos(ang) * r);
        const cz  = center.oz + Math.floor(Math.sin(ang) * r);
        if (Math.random() < 0.5) generateRuinedHouse(cx, cz);
        else                     generateRuinedCommercial(cx, cz);
      }
    }
  }

  function generateLevel(index) {
    const level = getLevelDef(index);
    setTheme(level.theme);
    _theme.seed = index * 3137;

    regenerate();
    _droneNestPositions.length = 0; // Reset nests for this level
    _buildings.length = 0;          // Reset clearable building registry

    // Main road network — every stage gets visible asphalt arteries so
    // the world doesn't look like an empty sandbox. User reported "no
    // roads"; previously roads only existed at outpost rims.
    generateRoadNetwork([
      [-120,   0,  120,   0, 4],   // east-west main road
      [   0,-120,    0, 120, 4],   // north-south main road
      [ -60, -60,   60, -60, 3],   // southern parallel
      [ -60,  60,   60,  60, 3],   // northern parallel
      [ -80,   0,  -80, -80, 3],   // west connector
      [  80,   0,   80,  80, 3],   // east connector
    ]);
    if (level.id === 'HOSTOMEL') {
      generateHostomelAirport(0, 0);
      // Town of Hostomel — residential district east/west of the airport
      // Russian VDV captured and held this for weeks Feb–Mar 2022
      generateUkrainianApartment(80, -30, 6);
      generateUkrainianApartment(80, -50, 9);
      generateUkrainianApartment(80, -68, 6);
      generateUkrainianApartment(95, -40, 9);
      generateUkrainianApartment(62, -55, 6);
      generateUkrainianApartment(108, -55, 6);
      generateUkrainianApartment(-80, -35, 6);   // West side of Hostomel
      generateUkrainianApartment(-80, -55, 9);
      generateUkrainianApartment(-95, -45, 6);
      generateUkrainianApartment(-65, -60, 6);
      // Antonov logistics offices and assembly buildings (south of main runway)
      generateIndustrialComplex(50, -40);        // Antonov factory complex
      generateIndustrialComplex(-50, -38);       // Logistics center
      generateCommTower(-70, -20);               // Antonov comms tower
      generateControlTower(65, -20);             // Secondary control building
      // Hostomel town center (church, water tower, commercial)
      generateChurch(88, -80);                   // Local church on main road
      generateChurch(-88, -75);
      // Antonov An-225 "Mriya" — the world's largest plane, destroyed here in 2022
      generateAN225Mriya(0, 30);
      generateWaterTower(70, -75);               // District water tower
      generateLuxuryVilla(-75, -80, 8, 6);       // Hostomel administration building
      // Fuel/supply depot at airport (Russian used it as re-supply point)
      generateFuelDepot(65, 45);
      generateFuelDepot(-68, 42);
      generateAmmoDepot(80, 45);
      // Russian VDV defensive fortifications around the airport perimeter
      generateAntiAirPosition(-30, 35);          // S-300 battery on north runway end
      generateAntiAirPosition(30, 35);
      generateAntiAirPosition(0, 55);
      generateAntiAirPosition(75, 20);           // Outer perimeter AA
      generateAntiAirPosition(-72, 22);
      generateDefensivePosition(-55, 10);
      generateDefensivePosition(55, 12);
      generateDefensivePosition(0, 70);
      generateDefensivePosition(-40, -30);
      generateDefensivePosition(42, -28);
      generateBunker(-60, 30);
      generateBunker(58, 32);
      generateBunker(-25, 60);
      generateBunker(25, 60);
      generateCheckpoint(0, 75, false);          // North approach road
      generateCheckpoint(100, 0, true);          // East perimeter
      generateCheckpoint(-100, 0, true);         // West perimeter
      generateBarbedWire(0, 40, 60, true);       // Perimeter wire along runway north
      generateAntiTankHedgehogs(12);             // Road blockades
      generateTrenchNetwork(-45, 15);
      generateTrenchNetwork(45, 18);
      generateMortarPit(-70, 5);
      generateMortarPit(68, 8);
      generateSniperNest(0, -50);                // Sniper in destroyed terminal area
      // Battle damage — fierce Ukrainian counterattacks 26 Feb–30 Mar 2022
      generateBurningRuin(-70, -45);
      generateBurningRuin(72, -42);
      generateBurningRuin(-20, -20);
      generateBurningRuin(18, -22);
      generateBurningRuin(0, -48);
      generateRuinedHouse(85, -90);
      generateRuinedHouse(-85, -88);
      generateRuinedCommercial(60, -90);
      generateWreckedTank(-65, 18);
      generateWreckedTank(62, 16);
      generateWreckedAPC(-48, -35);
      generateWreckedConvoy(85, -20);
      generateWreckedConvoy(-85, -22);
      generateCraters(8);
      // Radar + comms for Russian coordination
      generateRadarTower(-75, 30);
      generateRadarTower(72, 28);
      // Drone nests at corners of the airport perimeter
      generateDroneNest(80, -20);
      generateDroneNest(-80, -18);
      generateDroneNest(85, 50);
      generateDroneNest(-85, 50);
      // Hostomel airport infrastructure landmarks
      generateAirportControlTower(20, -30);   // ATC tower east of main terminal
      generateAircraftHangar(-50, -25);        // Antonov cargo hangar (NW apron)
      generateCargoTerminal(60, 15);           // Freight terminal (east end)
    } else if (level.id === 'AVDIIVKA') {
      // Avdiivka Coke and Chemical Plant — industrial fortress, most fortified Ukrainian position
      // The coking plant (AKHZ) was Europe's largest — defended for 2+ years
      // Industrial core: the AKHZ plant itself
      generateIndustrialComplex(0, 0);          // AKHZ main coke battery
      generateIndustrialComplex(-18, -20);      // By-product plant
      generateIndustrialComplex(18, -20);       // Coal crushing facility
      generateGrainSilo(-30, -10);              // Industrial silo tower
      generateGrainSilo(28, -8);
      generatePowerLines(0, 0, 6);              // High-voltage industrial lines
      generateRailway(-10, -30, 40, false);     // Coke transport railway
      // City residential blocks (east + west of the plant)
      generateUkrainianApartment(-20, -20, 6);
      generateUkrainianApartment(-20, -42, 12);
      generateUkrainianApartment(10, -25, 6);
      generateUkrainianApartment(10, -47, 12);
      generateUkrainianApartment(-38, -15, 9);
      generateUkrainianApartment(-38, -38, 6);
      generateUkrainianApartment(30, -20, 9);
      generateUkrainianApartment(30, -42, 6);
      generateUkrainianApartment(-20, 10, 6);
      generateUkrainianApartment(10, 15, 9);
      generateUkrainianApartment(-50, -25, 6);
      generateUkrainianApartment(42, -28, 6);
      generateUkrainianApartment(-15, -58, 6);
      generateUkrainianApartment(12, -60, 6);
      // Avdiivka-specific worker homes (pre-war residential texture)
      generateAvdiivkaHome(-32, -55, 1);
      generateAvdiivkaHome(-32, -68, 2);
      generateAvdiivkaHome(28, -55, 0);
      generateAvdiivkaHome(28, -68, 1);
      generateAvdiivkaHome(-50, -42, 2);
      generateAvdiivkaHome(42, -42, 0);
      // Fortification network (AKHZ was a prepared fortress)
      generateTrenchNetwork(-15, 10);
      generateTrenchNetwork(15, 10);
      generateTrenchNetwork(0, -55);
      generateMortarPit(-25, 20);
      generateMortarPit(22, 20);
      generateBunker(-35, 5);
      generateBunker(32, 5);
      generateSniperNest(-40, -25);
      generateSniperNest(38, -22);
      generateDefensivePosition(-10, 20);
      generateDefensivePosition(8, 22);
      generateDefensivePosition(-45, -50);
      generateDefensivePosition(42, -50);
      generateCheckpoint(-5, 28, false);       // North checkpoint (Supply road)
      generateCheckpoint(-5, -65, false);      // South perimeter
      generateCheckpoint(50, -15, true);       // East flank
      generateCheckpoint(-50, -15, true);      // West flank
      generateAntiAirPosition(-40, 20);
      generateAntiAirPosition(38, 22);
      // Battle damage
      generateBurningRuin(-22, -60);
      generateBurningRuin(12, -62);
      generateBurningRuin(-5, -30);
      generateBurningRuin(24, 12);
      generateBurningRuin(-42, -42);
      generateBurningRuin(40, -40);
      generateRuinedHouse(-45, -58);
      generateRuinedHouse(38, -58);
      generateRuinedCommercial(-10, -68);
      generateWreckedTank(-12, -48);
      generateWreckedAPC(15, -38);
      generateWreckedConvoy(-38, -45);
      generateWreckedTruck(35, -50);
      // Ammo
      generateAmmoDepot(-30, 5);
      generateAmmoDepot(28, 8);
      generateAmmoCache(-5, -62);
      // Drone nests (the plant's observation towers become drone launch points)
      generateDroneNest(48, -42);
      generateDroneNest(-48, -55);
      generateDroneNest(30, 22);
      generateDroneNest(-30, 22);
      // AKHZ landmark: the iconic blast-furnace battery with tall chimneys
      generateAKHZBlastFurnace(5, -50);    // South edge of plant — AKHZ coke oven battery
      // Avdiivka city landmarks
      generateCoalWashingPlant(-15, -65);  // Coal preparation plant (Avdiivka coal basin)
      generateMineShaftTower(-50, -38);    // Mine headframe (local Donbas coal shaft)
      generateTrainStation(-22, 12);       // Avdiivka railway junction (critical supply node)
      generateSovietAdminBuilding(0, 18);  // City administration building
      generateChurch(35, -60);             // Orthodox church (still standing during siege)
    } else if (level.id === 'BAKHMUT') {
      // Bakhmut — the most destroyed city in modern warfare history
      // Once a city of 70,000 — now rubble after 224+ days of siege
      // Apartment blocks stand as shattered shells (some standing, many ruins)
      generateUkrainianApartment(-25, -20, 6);
      generateUkrainianApartment(-25, -42, 6);
      generateUkrainianApartment(15, -15, 12);
      generateUkrainianApartment(15, -37, 6);
      generateUkrainianApartment(-42, -25, 9);
      generateUkrainianApartment(-42, -48, 6);
      generateUkrainianApartment(33, -18, 6);
      generateUkrainianApartment(33, -40, 9);
      generateUkrainianApartment(-10, 12, 6);
      generateUkrainianApartment(12, 18, 9);
      generateUkrainianApartment(-48, 5, 6);
      generateUkrainianApartment(45, 12, 6);
      generateUkrainianApartment(-12, -62, 6);
      generateUkrainianApartment(18, -62, 6);
      // Massive ruin field — every block has burning wreckage
      generateBurningRuin(-28, -60);
      generateBurningRuin(16, -55);
      generateBurningRuin(-5, -65);
      generateBurningRuin(38, -48);
      generateBurningRuin(-45, -35);
      generateBurningRuin(-20, 5);
      generateBurningRuin(28, 8);
      generateBurningRuin(0, -45);
      generateBurningRuin(-38, 18);
      generateBurningRuin(40, 22);
      generateRuinedHouse(-35, -58);
      generateRuinedHouse(25, -62);
      generateRuinedHouse(-18, -32);
      generateRuinedHouse(30, -28);
      generateRuinedHouse(-45, 8);
      generateRuinedCommercial(-8, -50);
      generateRuinedCommercial(10, -48);
      generateRuinedCommercial(-28, 20);
      generateCollapsedBridge(0, -35);          // Bakhmutka River bridge
      generateCollapsedBridge(-15, -38);
      // Wagner Group trench / assault positions (they took the city)
      generateTrenchNetwork(0, -25);
      generateTrenchNetwork(-20, 20);
      generateMortarPit(-30, -30);
      generateMortarPit(22, -30);
      generateMortarPit(38, -55);
      generateBunker(-20, -68);
      generateBunker(20, -70);
      generateSniperNest(-35, -15);
      generateSniperNest(30, -15);
      generateSniperNest(0, -55);
      generateDefensivePosition(-48, -48);
      generateDefensivePosition(45, -45);
      generateDefensivePosition(0, 30);
      generateAmmoDepot(38, 28);
      generateAmmoDepot(-40, 25);
      generateAmmoDepot(-48, -55);
      generateBakhmutArena(-5, 22);              // Bakhmut Sports Arena/Palace of Culture (tactical strongpoint)
      // Railway (Bakhmut is a railway junction city)
      generateRailway(-20, -30, 35, true);
      generateRailway(0, 10, 30, false);
      generateWreckedTank(-18, -28);
      generateWreckedTank(22, -32);
      generateWreckedAPC(-35, -15);
      generateWreckedConvoy(30, -20);
      generateWreckedTruck(-5, -62);
      generateWreckedBus(-38, -40);
      // Drone nests
      generateDroneNest(48, -38);
      generateDroneNest(-48, -18);
      generateDroneNest(25, 35);
      generateDroneNest(-25, 35);
      // Artemivsk Winery landmark — Wagner HQ, the famous chalk-cellar champagne factory
      generateArtemivskWinery(20, 35);     // NE outskirts, near where Wagner staged their assault
      // Bakhmut city centre landmarks
      generateBakhmutHotel(30, -30);       // Hotel Bakhmut (Wagner commanders' HQ)
      generateSovietAdminBuilding(0, -50); // City hall / administrative building
      generateSovietSchool(-32, -18);      // Bakhmut school (shelled into rubble)
      generateTrainStation(-15, 30);       // Bakhmut railway junction station
      generateChurch(-30, 5);              // Orthodox church (still standing amid ruins)
    } else if (level.id === 'KHERSON') {
      // Kherson city — Dnipro river port, Soviet housing estates, occupation frontline
      // City center: admin buildings + apartment blocks flanking the main boulevard
      generateLuxuryVilla(-5, -10, 14, 10);    // Kherson Oblast Admin HQ
      generateLuxuryVilla(10, -8, 10, 8);     // Regional government offices
      generateUkrainianApartment(-30, -25, 12); // North residential block
      generateUkrainianApartment(-30, -47, 9);  // North-west apartments
      generateUkrainianApartment(20, -30, 9);   // East residential
      generateUkrainianApartment(20, -52, 6);   // Far east block
      generateUkrainianApartment(-15, -55, 6);  // South block
      generateUkrainianApartment(5, -58, 9);    // South-east apartments
      generateUkrainianApartment(-45, -15, 6);  // West fringe
      generateUkrainianApartment(38, -15, 6);   // East fringe
      // Port/docks district (Dnipro riverbank features)
      generateIndustrialComplex(-35, -55);      // Port warehouses
      generateGrainSilo(-42, -30);              // Kherson grain terminal
      generateGrainSilo(30, -55);               // Second grain silo
      generateRailway(-20, -45, 25, true);      // Port railway spur
      // Churches (Kherson has several orthodox parishes)
      generateChurch(-22, -8);
      generateChurch(30, -22);
      // Urban infrastructure
      generateWaterTower(-48, -38);
      generateWaterTower(42, -40);
      generatePowerLines(0, 0, 4);
      generateFieldHospital(8, 10);             // Humanitarian corridor medical post
      // Military occupation features
      generateCheckpoint(0, -62, false);        // South road checkpoint (toward Skadovsk)
      generateCheckpoint(0, 12, false);         // North Dnipro approach
      generateCheckpoint(44, -30, true);        // East road to Crimea
      generateDefensivePosition(-20, 5);
      generateDefensivePosition(22, 0);
      generateDefensivePosition(0, -65);
      generateArtilleryBattery(-40, -60);
      generateArtilleryBattery(38, 10);
      generateAntiAirPosition(-30, 8);
      generateAntiAirPosition(32, -58);
      generateBarbedWire(0, 0, 30, false);
      generateAntiTankHedgehogs(10);
      // Battle damage
      generateBurningRuin(-18, -22);
      generateBurningRuin(12, -45);
      generateBurningRuin(-38, -48);
      generateWreckedTank(-10, -35);
      generateWreckedAPC(15, -18);
      generateWreckedConvoy(35, -38);
      generateWreckedCar(-25, -60);
      generateWreckedCar(28, -65);
      generateBillboard(-35, -30);
      generateBillboard(25, -42);
      generateDroneNest(44, -50);
      generateDroneNest(-42, -58);
      generateDroneNest(0, 15);
      // Kherson landmarks: railway station, cathedral, fortress, port
      generateKhersonStation(-30, 22);          // Kherson Railway Station (NW city)
      generateKhersonCathedral(25, -18);        // Pokrovska Cathedral (city centre)
      generateKhersonFortress(18, -52);         // 18th-century star fort (old town SE)
      generateKhersonPortTerminal(-5, -80);     // Dnipro river commercial port (south)
    } else if (level.id === 'KYIV') {
      // Real-map recreation: Maidan Nezalezhnosti / Khreshchatyk approach
      // where Russian armored columns were stopped on the road into Kyiv
      generateKyivMaidanSquare(0, 0);
      generateKyivCityExtension(0, 0);
      // ── Kyiv landmarks — recognizable city icons on the flanks ──
      generateMotherlandMonument(50, -40);  // Батьківщина-Мати: titanium statue, Pechersk hills (SE)
      generateStSophia(-55, -38);           // St. Sophia Cathedral — gold domes + bell tower (NW old town)
      generateLavraBellTower(52, 28);       // Kyiv Pechersk Lavra Great Bell Tower (E)
      generateGoldenGate(-38, -12);         // Zoloti Vorota — 11th-century medieval city gate (SW of Maidan)
      generateKyivCentralStation(-62, 48);  // Kyiv Central Station — clock tower, 1932 neoclassical (NW)
      generateVerkhovnaRada(38, -18);       // Ukrainian Parliament — neoclassical 1939, Lypky district (SE)
      generateNSCOlimpiyskiy(-28, -58);     // Olympic Stadium — 70k-seat, Euro 2012 final (SW)
      generateStMichaelMonastery(-52, -62); // St. Michael's Golden-Domed Monastery (W old town)
      generateKyivArsenal(55, 8);           // Kyiv Arsenal 1764 factory-fortress, contemporary art museum (E)
      // Drone nests along enemy approach corridor
      generateDroneNest(36, -40);
      generateDroneNest(-36, -40);
      // ── Capital-defense line (Battle of Kyiv) ──
      // Checkpoints flanking the boulevard just north of the Maidan zone
      generateCheckpoint(-8, 16, true);
      generateCheckpoint(3, 16, true);
      // Anti-tank hedgehog ring guarding the defended plaza (manual ring —
      // the generic generator scatters randomly)
      (function () {
        var ringR = 14;
        for (var ai = 0; ai < 8; ai++) {
          var aa = (ai / 8) * Math.PI * 2;
          var hx = Math.round(Math.cos(aa) * ringR);
          var hz = Math.round(1 + Math.sin(aa) * ringR);
          var hh = getTerrainHeight(hx, hz);
          if (hh <= 1) continue;
          setBlock(hx, hh, hz, BLOCK.METAL);
          setBlock(hx, hh + 1, hz, BLOCK.METAL);
          setBlock(hx - 1, hh, hz, BLOCK.METAL);
          setBlock(hx + 1, hh, hz, BLOCK.METAL);
          setBlock(hx, hh, hz - 1, BLOCK.METAL);
          setBlock(hx, hh, hz + 1, BLOCK.METAL);
        }
      })();
      // Sandbag walls across the boulevard at the defense line (z=18..22)
      // — two rows of concrete sandbagging covering the approach axis
      (function () {
        for (var sx = -9; sx <= 9; sx++) {
          if (Math.abs(sx) <= 4) continue; // leave center lane open for player
          var sy = getTerrainHeight(sx, 20);
          setBlock(sx, sy,     20, BLOCK.CONCRETE);
          setBlock(sx, sy + 1, 20, BLOCK.CONCRETE);
          setBlock(sx, sy + 2, 20, BLOCK.CONCRETE);
          // second row
          setBlock(sx, sy,     22, BLOCK.CONCRETE);
          setBlock(sx, sy + 1, 22, BLOCK.CONCRETE);
        }
        // Flanking sandbag corners (good cover angles)
        for (var sz2 = 18; sz2 <= 24; sz2++) {
          var sy2 = getTerrainHeight(-9, sz2);
          setBlock(-9, sy2,     sz2, BLOCK.CONCRETE);
          setBlock(-9, sy2 + 1, sz2, BLOCK.CONCRETE);
          sy2 = getTerrainHeight(9, sz2);
          setBlock(9, sy2,     sz2, BLOCK.CONCRETE);
          setBlock(9, sy2 + 1, sz2, BLOCK.CONCRETE);
        }
      })();
      // Overturned bus barricades — solid cover on both flanks
      (function () {
        for (var bx2 = -22; bx2 <= -16; bx2++) {
          var by2 = getTerrainHeight(bx2, 19);
          setBlock(bx2, by2,     19, BLOCK.METAL);
          setBlock(bx2, by2 + 1, 19, BLOCK.METAL);
          setBlock(bx2, by2 + 2, 19, BLOCK.METAL);
          setBlock(bx2, by2 + 3, 19, BLOCK.METAL);
        }
        for (var bx3 = 16; bx3 <= 22; bx3++) {
          var by3 = getTerrainHeight(bx3, 19);
          setBlock(bx3, by3,     19, BLOCK.METAL);
          setBlock(bx3, by3 + 1, 19, BLOCK.METAL);
          setBlock(bx3, by3 + 2, 19, BLOCK.METAL);
          setBlock(bx3, by3 + 3, 19, BLOCK.METAL);
        }
      })();
      // Burned-out civilian cars along the northern approach (cover) +
      // more wrecks deeper in the approach corridor for wave cover
      generateWreckedCar(-5, 34);
      generateWreckedCar(4, 48);
      generateWreckedCar(-3, 62);
      generateWreckedCar(6, 78);
      generateWreckedCar(-7, 90);
      generateWreckedCar(3, 105);
      // Bomb craters along the approach
      (function () {
        var craterPositions = [[-4, 55], [6, 70], [-6, 85], [2, 100]];
        for (var ci2 = 0; ci2 < craterPositions.length; ci2++) {
          var cx2 = craterPositions[ci2][0], cz2 = craterPositions[ci2][1];
          for (var cr = 0; cr < 3; cr++) {
            for (var crz = -1; crz <= 1; crz++) {
              setBlock(cx2 + cr - 1, 1, cz2 + crz, BLOCK.DIRT);
            }
          }
        }
      })();
      // Ukrainian flag pole at the defended zone (Maidan is the symbolic heart)
      (function () {
        var fy = getTerrainHeight(12, 6);
        for (var fp = 0; fp < 8; fp++) setBlock(12, fy + 1 + fp, 6, BLOCK.METAL);
        // Blue lower half, yellow upper half of flag
        setBlock(13, fy + 6, 6, BLOCK.CONCRETE);   // blue (sky)
        setBlock(14, fy + 6, 6, BLOCK.CONCRETE);
        setBlock(15, fy + 6, 6, BLOCK.CONCRETE);
        setBlock(13, fy + 7, 6, BLOCK.LIGHT);       // yellow (wheat) — LIGHT block = gold
        setBlock(14, fy + 7, 6, BLOCK.LIGHT);
        setBlock(15, fy + 7, 6, BLOCK.LIGHT);
      })();
      // Artillery battery hidden behind the Hotel Ukraina building —
      // the player can use it as a backstop firing position
      generateDefensivePosition(-20, 26);
      generateDefensivePosition(18, 26);
      // ── Second fallback defense line at z=37-40 ──────────────
      // Sandbag wall with shooting gaps, flanked by concrete extensions
      (function () {
        for (var sl = -13; sl <= 13; sl++) {
          if (Math.abs(sl) <= 3) continue; // keep center lane open
          var slh = getTerrainHeight(sl, 38);
          setBlock(sl, slh,     38, BLOCK.SANDBAG);
          setBlock(sl, slh + 1, 38, BLOCK.SANDBAG);
          setBlock(sl, slh + 2, 38, BLOCK.CONCRETE);
          setBlock(sl, slh,     40, BLOCK.SANDBAG);
          setBlock(sl, slh + 1, 40, BLOCK.SANDBAG);
        }
        for (var sl2 = 37; sl2 <= 42; sl2++) {
          var slhL = getTerrainHeight(-13, sl2);
          setBlock(-13, slhL, sl2, BLOCK.CONCRETE);
          setBlock(-13, slhL + 1, sl2, BLOCK.CONCRETE);
          var slhR = getTerrainHeight(13, sl2);
          setBlock(13, slhR, sl2, BLOCK.CONCRETE);
          setBlock(13, slhR + 1, sl2, BLOCK.CONCRETE);
        }
      })();
      // ── Anti-tank earthwork ditch at z=56-57 ─────────────────
      // Berm of DIRT + SANDBAG on the south (player) side
      (function () {
        for (var dd = -14; dd <= 14; dd++) {
          var ddh = getTerrainHeight(dd, 56);
          // Carve two-block ditch
          setBlock(dd, ddh, 56, 0);
          setBlock(dd, ddh, 57, 0);
          // Defensive berm facing enemy approach
          setBlock(dd, ddh,     55, BLOCK.DIRT);
          setBlock(dd, ddh + 1, 55, BLOCK.SANDBAG);
          setBlock(dd, ddh + 2, 55, BLOCK.SANDBAG);
        }
      })();
      // ── Outer defensive infantry positions ───────────────────
      generateDefensivePosition(-18, 40);
      generateDefensivePosition(18, 40);
      generateDefensivePosition(0, 46);
      // ── Additional bomb craters in the deep approach corridor ─
      (function () {
        var deepCraters = [[3, 118], [-5, 130], [7, 142], [-2, 152], [5, 163], [-8, 176]];
        for (var dc = 0; dc < deepCraters.length; dc++) {
          var dcx = deepCraters[dc][0], dcz = deepCraters[dc][1];
          for (var dcr = -1; dcr <= 1; dcr++) {
            for (var dcz2 = -1; dcz2 <= 1; dcz2++) {
              setBlock(dcx + dcr, 1, dcz + dcz2, BLOCK.DIRT);
            }
          }
        }
      })();
      // ── Elevated sniper platform on the roof of the left flank building ──
      (function () {
        var spBase = getTerrainHeight(-15, 4) + 9;
        for (var spx = -17; spx <= -13; spx++) {
          for (var spz = 3; spz <= 6; spz++) {
            setBlock(spx, spBase, spz, BLOCK.CONCRETE);
          }
        }
        // Sandbag parapet on three sides (open toward enemy north)
        for (var pi = -17; pi <= -13; pi++) {
          setBlock(pi, spBase + 1, 3, BLOCK.SANDBAG);
        }
        setBlock(-17, spBase + 1, 4, BLOCK.SANDBAG);
        setBlock(-17, spBase + 1, 5, BLOCK.SANDBAG);
        setBlock(-13, spBase + 1, 4, BLOCK.SANDBAG);
        setBlock(-13, spBase + 1, 5, BLOCK.SANDBAG);
        setBlock(-15, spBase + 2, 3, BLOCK.SANDBAG); // raised center parapet for prone firing
      })();
      // ── Mirror observation post on the right flank ───────────────
      (function () {
        var opBase = getTerrainHeight(15, 4) + 9;
        for (var opx = 13; opx <= 17; opx++) {
          for (var opz = 3; opz <= 6; opz++) {
            setBlock(opx, opBase, opz, BLOCK.CONCRETE);
          }
        }
        for (var opi = 13; opi <= 17; opi++) {
          setBlock(opi, opBase + 1, 3, BLOCK.SANDBAG);
        }
        setBlock(13, opBase + 1, 4, BLOCK.SANDBAG);
        setBlock(13, opBase + 1, 5, BLOCK.SANDBAG);
        setBlock(17, opBase + 1, 4, BLOCK.SANDBAG);
        setBlock(17, opBase + 1, 5, BLOCK.SANDBAG);
        setBlock(15, opBase + 2, 3, BLOCK.SANDBAG);
      })();
      // ── Tank hull-down berms — dug-in firing positions for vehicles ──
      // Two berms flanking the center, z=28-30, vehicles crest the berm to fire
      (function () {
        var sides = [[-12, 29], [12, 29], [-12, 45], [12, 45]];
        for (var bmi = 0; bmi < sides.length; bmi++) {
          var bmx = sides[bmi][0], bmz = sides[bmi][1];
          var bmh = getTerrainHeight(bmx, bmz);
          // Build a 3×3 raised earth mound
          for (var dx = -1; dx <= 1; dx++) {
            for (var dz = 0; dz <= 2; dz++) {
              setBlock(bmx + dx, bmh,     bmz + dz, BLOCK.DIRT);
              setBlock(bmx + dx, bmh + 1, bmz + dz, BLOCK.SANDBAG);
            }
          }
          // Hull-down lip (one extra row higher at front)
          for (var dx2 = -1; dx2 <= 1; dx2++) {
            setBlock(bmx + dx2, bmh + 2, bmz, BLOCK.SANDBAG);
          }
        }
      })();
      // ── Third fortified line at z=67-70 ──────────────────────────
      // Mixed concrete wall with METAL reinforced corners
      (function () {
        for (var tl = -15; tl <= 15; tl++) {
          if (Math.abs(tl) <= 3) continue;
          var tlh = getTerrainHeight(tl, 68);
          setBlock(tl, tlh,     68, BLOCK.CONCRETE);
          setBlock(tl, tlh + 1, 68, BLOCK.CONCRETE);
          setBlock(tl, tlh + 2, 68, BLOCK.CONCRETE);
          setBlock(tl, tlh,     70, BLOCK.SANDBAG);
          setBlock(tl, tlh + 1, 70, BLOCK.SANDBAG);
        }
        // METAL corner bastions for extra protection
        for (var tlz = 66; tlz <= 72; tlz++) {
          var tlhL = getTerrainHeight(-15, tlz);
          setBlock(-15, tlhL,     tlz, BLOCK.METAL);
          setBlock(-15, tlhL + 1, tlz, BLOCK.METAL);
          var tlhR = getTerrainHeight(15, tlz);
          setBlock(15, tlhR,     tlz, BLOCK.METAL);
          setBlock(15, tlhR + 1, tlz, BLOCK.METAL);
        }
      })();
      // ── Additional defensive positions at third line ─────────────
      generateDefensivePosition(-12, 67);
      generateDefensivePosition(12, 67);
      // ── Minefield markers (METAL spikes) scattered across wide approach ──
      // Danger zone: z=80-110, both flanks beyond x=±10
      (function () {
        var minePositions = [
          [-14, 82], [14, 85], [-16, 91], [18, 94], [-12, 103],
          [16, 88], [-18, 97], [12, 108], [-13, 115], [17, 112],
        ];
        for (var mi = 0; mi < minePositions.length; mi++) {
          var mx = minePositions[mi][0], mz = minePositions[mi][1];
          var mh = getTerrainHeight(mx, mz);
          setBlock(mx, mh, mz, BLOCK.METAL);
          setBlock(mx, mh + 1, mz, BLOCK.METAL); // stake
        }
      })();
      // ── Fourth deep fallback line at z=96-98 ─────────────────────
      (function () {
        for (var fl = -12; fl <= 12; fl++) {
          if (Math.abs(fl) <= 2) continue;
          var flh = getTerrainHeight(fl, 97);
          setBlock(fl, flh,     97, BLOCK.SANDBAG);
          setBlock(fl, flh + 1, 97, BLOCK.SANDBAG);
          setBlock(fl, flh,     99, BLOCK.DIRT);
          setBlock(fl, flh + 1, 99, BLOCK.SANDBAG);
        }
      })();
      generateDefensivePosition(-8, 96);
      generateDefensivePosition(8, 96);
      // ── Wrecked supply trucks — additional cover in approach zone ─
      generateWreckedCar(-9, 74);
      generateWreckedCar(8, 80);
      generateWreckedCar(-6, 92);
      // ── Extended Kyiv residential districts (supplement CityExtension) ──
      // Western corridor (Shevchenkivskyi district)
      generateUkrainianApartment(-45, -25, 9);
      generateUkrainianApartment(-45, 5, 12);
      generateUkrainianApartment(-45, 35, 9);
      generateUkrainianApartment(-60, -10, 6);
      generateUkrainianApartment(-60, 20, 9);
      // Northern approach boulevard flanking buildings
      generateUkrainianApartment(-22, 55, 9);
      generateUkrainianApartment(18, 55, 12);
      generateUkrainianApartment(-22, 80, 6);
      generateUkrainianApartment(18, 80, 9);
      // Deep north (Obolon district — Soviet-era tall blocks)
      generateUkrainianApartment(-30, 110, 12);
      generateUkrainianApartment(0, 115, 9);
      generateUkrainianApartment(25, 110, 12);
      // Burning ruins from Russian bombardment
      generateBurningRuin(-48, -50);
      generateBurningRuin(42, -52);
      generateBurningRuin(-5, 95);
    } else if (level.id === 'MARIUPOL') {
      // Mariupol / Azovstal Steelworks — total industrial destruction, urban holocaust
      // The Azovstal plant: massive sprawling steel mill (multiple industrial complexes)
      generateIndustrialComplex(0, 0);          // Azovstal main blast furnace
      generateIndustrialComplex(-20, -15);      // Coking plant
      generateIndustrialComplex(22, -18);       // Rolling mill
      generateIndustrialComplex(-18, 18);       // Port industrial zone
      generateIndustrialComplex(20, 20);        // Steel casting hall
      // Civilian city: bombed into rubble
      generateUkrainianApartment(-38, -30, 9);  // Western residential — half-destroyed
      generateUkrainianApartment(-38, -5, 6);
      generateUkrainianApartment(35, -32, 9);
      generateUkrainianApartment(35, -5, 6);
      generateUkrainianApartment(-15, -48, 9);
      generateUkrainianApartment(12, -48, 6);
      generateUkrainianApartment(-40, 28, 6);
      generateUkrainianApartment(38, 28, 6);
      // Mariupol Drama Theatre — neoclassical theatre + "ДЕТИ" memorial plaza
      generateMariupolDramaTheatre(-2, -38);
      // Extensive burning ruins (the city was 90%+ destroyed)
      generateBurningRuin(-20, -20);
      generateBurningRuin(20, 20);
      generateBurningRuin(-15, 25);
      generateBurningRuin(25, -38);
      generateBurningRuin(-35, 18);
      generateBurningRuin(8, -55);
      generateBurningRuin(-42, -48);
      generateBurningRuin(40, -48);
      generateBurningRuin(0, 38);
      generateBurningRuin(-28, 38);
      generateRuinedHouse(-32, -42);
      generateRuinedHouse(30, -44);
      generateRuinedHouse(-12, 42);
      generateRuinedCommercial(-8, -38);
      generateRuinedCommercial(10, 35);
      // Port and railway (Mariupol is a major steel export port)
      generateGrainSilo(-45, -20);              // Port silo
      generateRailway(-10, -30, 40, false);     // Steel railway to port
      generateBridge(0, 40, 30, 4);             // Port bridge
      generateCollapsedBridge(15, -45);         // Bombed crossing
      // Russian siege infrastructure
      generateArtilleryBattery(30, -30);
      generateArtilleryBattery(-30, 35);
      generateArtilleryBattery(40, -10);
      generateAmmoDepot(-30, 30);
      generateAmmoDepot(32, 42);
      generateFuelDepot(-40, 0);
      generateAmmoDumpBerm(28, -15);
      generateDefensivePosition(0, -55);
      generateDefensivePosition(-48, 15);
      generateDefensivePosition(45, 12);
      generateAntiAirPosition(-30, -42);
      generateAntiAirPosition(32, 42);
      // Wrecked military hardware
      generateWreckedTank(-10, -28);
      generateWreckedTank(25, 30);
      generateWreckedAPC(-28, -35);
      generateWreckedConvoy(35, -55);
      generateWreckedTruck(-44, -28);
      generateWreckedBus(18, -52);
      // Drone nests
      generateDroneNest(48, 48);
      generateDroneNest(-48, -48);
      generateDroneNest(48, -48);
      generateDroneNest(-48, 48);
      // Mariupol city landmarks
      generateAzovsteelWorks(38, -32);        // Azovstal Iron & Steel blast furnace complex
      generatePortCrane(42, 8);               // Mariupol port loading crane
      generateSovietAdminBuilding(-12, -38);  // Mariupol city hall (Leninska Square)
      generateSovietSchool(25, -20);          // Mariupol school (bombed)
    } else if (level.id === 'CRIMEA') {
      // Kerch Strait Bridge — 19km span connecting Russia to occupied Crimea
      // Attacked twice: truck bomb (Oct 2022) and sea drones (Jul 2023)
      generateBridge(0, 0, 60, 6);             // Main road span
      generateBridge(-10, 0, 60, 4);           // Railway span running parallel
      generateBridge(20, 0, 40, 5);            // Taman approach viaduct
      generateCollapsedBridge(-5, -20);        // Damaged span from 2022 attack
      generateCollapsedBridge(8, 25);          // Damaged section from 2023 sea-drone attack
      // Bridge fortifications and access control
      generateBridgeFortification(10, 10);
      generateBridgeFortification(-10, -10);
      generateBridgeFortification(0, -35);     // Crimean (Kerch) end
      generateBridgeFortification(0, 35);      // Taman (Russian) end
      generateBridgeFortification(-15, 20);
      generateCheckpoint(25, 0, true);
      generateCheckpoint(-20, -45, false);     // Kerch end gate
      generateCheckpoint(0, 48, false);        // Taman end gate
      generateAntiTankHedgehogs(18);
      // Kerch city (Crimean side — ancient fortress city, now occupied)
      generateUkrainianApartment(-35, -20, 6);
      generateUkrainianApartment(30, -25, 6);
      generateUkrainianApartment(-32, -42, 5);
      generateUkrainianApartment(28, -42, 5);
      generateUkrainianApartment(0, -48, 6);
      generateLuxuryVilla(-8, -15, 10, 8);      // Kerch administrative buildings
      generateLuxuryVilla(8, -15, 8, 8);
      generateChurch(-20, -8);                  // Ancient Kerch Orthodox Cathedral
      generateChurch(18, -12);
      generateWaterTower(-38, -8);
      generateIndustrialComplex(-42, -42);      // Kerch Port industrial zone
      generateIndustrialComplex(38, -38);       // Crimean ferry terminal
      // Taman side (Russian) logistics and fuel
      generateFuelDepot(-30, 38);
      generateFuelDepot(28, 38);
      generateAmmoDepot(-35, 0);
      generateAmmoDepot(32, 0);
      generateAmmoDumpBerm(-25, 42);
      // AA batteries (bridge was a priority air-defense target)
      generateAntiAirPosition(-42, 20);
      generateAntiAirPosition(40, 18);
      generateAntiAirPosition(0, -42);
      generateAntiAirPosition(-20, 42);
      generateAntiAirPosition(20, -42);
      // Radar and communications
      generateRadarTower(-25, -28);
      generateRadarTower(22, 30);
      generateCommTower(0, -38);
      // Military defensive ring around bridge approaches
      generateDefensivePosition(-25, 8);
      generateDefensivePosition(25, -8);
      generateDefensivePosition(0, 22);
      generateBunker(-15, -30);
      generateBunker(14, -30);
      generateBunker(-15, 30);
      generateBunker(14, 30);
      generateWatchtower(-42, -42);
      generateWatchtower(40, -42);
      generateWatchtower(-42, 42);
      generateWatchtower(40, 42);
      // Battle damage — multiple strikes on bridge infrastructure
      generateBurningRuin(-18, 18);
      generateBurningRuin(15, -18);
      generateCraters(8);
      generateWreckedTank(-12, -25);
      generateWreckedAPC(10, 22);
      generateWreckedTruck(-28, 12);
      generateWreckedConvoy(22, -30);
      generateDestroyedVehicles(10);
      // Artillery batteries defending the strait
      generateArtilleryBattery(-38, 38);
      generateArtilleryBattery(36, -38);
      // Russian propaganda billboards on bridge approaches
      generateBillboard(-8, -52);
      generateBillboard(6, -52);
      generateBillboard(-10, 52);
      generateBillboard(8, 52);
      generateDroneNest(48, 48);
      generateDroneNest(-48, 48);
      generateDroneNest(48, -48);
      generateDroneNest(-48, -48);
      // Kerch Fortress landmark — ancient Ottoman-Russian fortification on the strait
      generateKerchFortress(-30, -40);     // Kerch (Crimean) side, south-west
      // Kerch city landmarks
      generateTrainStation(35, -50);       // Kerch railway station (built 1944, major hub)
      generatePortCrane(-42, -38);         // Kerch ferry terminal crane
      generateSovietAdminBuilding(-20, -28);// Kerch city administration
      generateNavalBarracks(40, -28);      // Russian naval support facility
    } else if (level.id === 'CHORNOBYL') {
      // Chornobyl Exclusion Zone — 30km dead zone, ghost city of Pripyat, irradiated reactor
      // Reactor No. 4 / New Safe Confinement area (center)
      generateChornobylSarcophagus(0, 0);       // New Safe Confinement steel arch over Reactor 4
      generateIndustrialComplex(-14, 10);       // Turbine hall
      generateIndustrialComplex(14, -10);       // Reactor 3 (sister unit)
      generateCommTower(0, -22);               // Chornobyl TV tower
      generateDugaRadar(-24, -16);             // Duga over-the-horizon radar wall
      generateWaterTower(-30, 0);              // Cooling water tower
      generateWaterTower(30, 0);
      // Pripyat ghost city — abandoned in 1986, nature taking over
      // City center: residential blocks with trees growing through them
      generateUkrainianApartment(-30, -25, 9);  // Pripyat microrayon 5 (9-storey)
      generateUkrainianApartment(-30, -45, 9);
      generateUkrainianApartment(22, -28, 9);   // Microrayon 4 (east side)
      generateUkrainianApartment(22, -48, 6);
      generateUkrainianApartment(-48, -15, 6);  // Outer blocks
      generateUkrainianApartment(38, -15, 6);
      generateUkrainianApartment(-15, -60, 6);
      generateUkrainianApartment(10, -60, 6);
      generateApartmentBlock(-15, -12, 5);      // Hotel Polissya (city center hotel)
      generateApartmentBlock(15, -10, 5);       // Energetik culture palace
      generateLuxuryVilla(-5, -5, 12, 10);      // Pripyat Executive Committee (city hall)
      generateChurch(-25, -5);                  // Pripyat orthodox church (still standing)
      generateChurch(22, 8);                    // Chornobyl town church
      generatePripyatHospital(-38, 32);         // MsCh-126 Hospital — famous radioactive ruin, Pripyat ghost city
      // Amusement park (never opened — famous for the rusty yellow Ferris wheel)
      generatePripyatFerrisWheel(18, 28);       // Pripyat amusement-park Ferris wheel
      generateWatchtower(-18, 25);
      // Abandoned exclusion zone infrastructure
      generateBrokenTrees(25);                  // Irradiated forest ("Red Forest")
      generateCraters(12);                      // Liquidator vehicle craters
      generateRuins(10);                        // Collapsed structures
      generateRuinedHouse(-38, -38);
      generateRuinedHouse(32, -42);
      generateRuinedHouse(-20, 35);
      generateRuinedHouse(18, 38);
      generateRuinedCommercial(-10, -38);
      generateRuinedCommercial(8, -35);
      generateRuinedCommercial(-30, 30);
      generateCollapsedBridge(-8, -25);         // Road bridge buried under vegetation
      generateBurningRuin(-40, -50);            // Fires from current combat
      generateBurningRuin(35, -50);
      generateBurningRuin(0, 40);
      // Military infrastructure (Russians used this as staging ground Feb 2022)
      generateBunker(-22, -22);
      generateBunker(20, 20);
      generateBunker(-22, 20);
      generateBunker(20, -22);
      generateBunker(-42, 0);
      generateBunker(40, 0);
      generateWatchtower(0, -42);
      generateWatchtower(0, 40);
      generateWatchtower(-42, -40);
      generateWatchtower(40, 40);
      generateTrenchNetwork(-18, 18);           // Russian dug-in positions
      generateTrenchNetwork(18, -18);
      generateMortarPit(-30, 10);
      generateMortarPit(28, -12);
      generateDefensivePosition(-12, 30);
      generateDefensivePosition(10, 30);
      generateCheckpoint(0, 50, false);
      generateCheckpoint(0, -50, false);
      generateCheckpoint(48, 0, true);
      generateCheckpoint(-48, 0, true);
      generateAntiAirPosition(-35, 35);
      generateAntiAirPosition(32, -35);
      generateAmmoDepot(-32, -10);
      generateAmmoDepot(28, 12);
      generateFuelDepot(0, -35);
      // Wrecked liquidator vehicles + Russian armor
      generateWreckedTank(-12, -30);
      generateWreckedAPC(12, 28);
      generateWreckedConvoy(-35, 25);
      generateWreckedTruck(30, -22);
      generateDestroyedVehicles(15);            // Russian vehicles irradiated/abandoned
      generatePowerLines(0, 0, 5);              // Exclusion zone power infrastructure
      generateRailway(-10, -20, 30, true);      // Chornobyl railway spur
      generateDroneNest(48, -48);
      generateDroneNest(-48, -48);
      generateDroneNest(48, 48);
    } else if (level.id === 'MOSCOW') {
      // ── MOSCOW CITY (MIBC) — International Business Center glass skyscraper district ──
      // Based on real Moscow-City: 12+ glass towers on Presnenskaya Embankment
      // Peninsula formed by Moskva River bend, Kutuzovsky Prospekt to the north

      // ── MOSKVA RIVER — southern embankment ──────────────────────────────
      generateMoskovaRiver(-55, 38, 110);   // River runs W→E along south edge

      // ── MIBC TOWER CLUSTER (center) ─────────────────────────────────────
      // Mercury City Tower: slim diamond-plan glass needle — tallest MIBC tower
      generateMercuryTower(-14, -8);
      // Federation Towers: E+W twin rectangular glass slabs
      generateFederationTowers(5, -14);
      // OKO Tower: wide glass slab, diagonal-sliced roof
      generateOkoTower(16, 2);
      // Evolution Tower: slowly twisting glass tower
      generateEvolutionTower(0, 6);
      // Neva Towers: pair of cylindrical glass towers
      generateNevaTowers(-8, 10);
      // Eurasia Tower: tapered glass needle with gold crown
      generateEurasiaTower(20, -10);
      // City of Capitals: stepped glass complex with two sub-towers
      generateCityOfCapitals(-20, 4);
      // Imperia Tower: rectangular glass slab, square plan
      generateOstankinoTower(-28, -20);  // Ostankino — moved to NW corner (correct Moscow location)
      // Three additional mid-rise MIBC towers to fill the cluster
      generateSevenSisters(-35, 35);   // Seven Sisters Stalin tower at far south
      generateChristSaviour(-35, -35); // Cathedral at NW (correct position relative to Kremlin)

      // ── SURROUNDING URBAN CONTEXT — Soviet residential rings ─────────────
      // Inner residential ring: 8 khrushchevka stalinka blocks around MIBC
      generateUkrainianApartment(-35, -10, 10);
      generateUkrainianApartment(35, -10, 10);
      generateUkrainianApartment(-35, 15, 9);
      generateUkrainianApartment(35, 15, 9);
      generateUkrainianApartment(-12, -32, 11);
      generateUkrainianApartment(12, -32, 11);
      generateUkrainianApartment(-25, -28, 9);
      generateUkrainianApartment(25, -28, 9);
      // Mid-ring: more residential blocks
      generateApartmentBlock(-42, -28, 6);
      generateApartmentBlock(42, -28, 6);
      generateApartmentBlock(-42, 20, 5);
      generateApartmentBlock(42, 20, 5);
      generateApartmentBlock(0, -42, 5);
      generateApartmentBlock(-20, 28, 5);
      generateApartmentBlock(20, 28, 5);
      // Kutuzovsky Prospekt north boulevard
      generateLuxuryVilla(-12, -40, 14, 6);   // Government ministry block
      generateLuxuryVilla(12, -40, 12, 6);    // Adjacent ministry

      // ── MILITARY FORTIFICATION RING (defending Moscow) ─────────────────
      generateCheckpoint(0, -44, false);
      generateCheckpoint(44, 0, true);
      generateCheckpoint(-44, 0, true);
      generateDefensivePosition(-30, 0);
      generateDefensivePosition(30, 0);
      generateDefensivePosition(0, -30);
      generateDefensivePosition(-22, -22);
      generateDefensivePosition(22, 22);
      generateAntiAirPosition(-40, 20);
      generateAntiAirPosition(40, -20);
      generateAntiAirPosition(20, 40);
      generateAntiAirPosition(-20, -40);
      generateBarbedWire(0, 0, 25, true);
      generateBarbedWire(0, 0, 25, false);
      generateAntiTankHedgehogs(18);
      generateArtilleryBattery(40, 40);
      generateArtilleryBattery(-40, -40);
      generateAmmoDepot(32, -32);
      generateAmmoDepot(-32, 32);
      generateWreckedTank(-12, -28);
      generateWreckedTank(14, 26);
      generateWreckedAPC(-28, 14);
      generateWreckedConvoy(28, -14);
      generateBurningRuin(-18, -40);
      generateBurningRuin(20, 38);
      generateDroneNest(48, 48);
      generateDroneNest(-48, 48);
      generateDroneNest(48, -48);
      generateDroneNest(-48, -48);
    } else if (level.id === 'SEVASTOPOL') {
      // Sevastopol Black Sea Fleet HQ — massive naval base, coastal city, fortifications
      // Naval infrastructure (Inkerman Bay / Severnaya Bay docks)
      generateBridge(0, 20, 40, 5);            // Severnaya Bay bridge
      generateBridgeFortification(0, 40);
      generateBridgeFortification(-15, 35);
      generateIndustrialComplex(-30, -30);     // Shipyard dry docks
      generateIndustrialComplex(28, -28);      // Naval repair facility
      generateIndustrialComplex(-25, 28);      // Submarine pen
      generateRadarTower(-10, -15);            // Naval radar
      generateRadarTower(12, -20);             // Air defense radar
      generateCommTower(-30, 15);              // Fleet communications
      // Coastal fortifications
      generateAntiAirPosition(-25, 25);
      generateAntiAirPosition(30, 20);
      generateAntiAirPosition(-38, -15);
      generateAntiAirPosition(35, -40);
      generateDefensivePosition(-20, -40);
      generateDefensivePosition(22, -42);
      generateDefensivePosition(-40, 20);
      generateDefensivePosition(40, 5);
      generateBridgeFortification(-35, -35);   // Balaklava coastal battery area
      generateCheckpoint(0, 48, false);        // North road Simferopol highway
      generateCheckpoint(0, -48, false);       // South coastal road
      generateCheckpoint(44, 0, true);         // East approach
      generateCheckpoint(-44, 0, true);        // West bays road
      // City buildings (Sevastopol has Soviet housing + historic center)
      generateUkrainianApartment(-35, -45, 9);
      generateUkrainianApartment(-35, -22, 6);
      generateUkrainianApartment(30, -48, 9);
      generateUkrainianApartment(30, -25, 6);
      generateUkrainianApartment(-15, -55, 6);
      generateUkrainianApartment(10, -55, 6);
      generateLuxuryVilla(-8, -8, 12, 10);     // Fleet HQ command building
      generateLuxuryVilla(8, -8, 10, 8);       // Naval admiralty offices
      generateChurch(-25, 5);                  // Cathedral of SS Peter and Paul
      generateChurch(22, 12);                  // Vladimir Cathedral (famous in Sevastopol)
      generateSevastopolPanorama(15, 38);      // Defense of Sevastopol Panorama — round rotunda museum
      // Ammo + fuel
      generateAmmoDepot(30, 30);
      generateAmmoDepot(-28, -8);
      generateAmmoDumpBerm(38, -20);
      generateFuelDepot(0, -38);
      generateArtilleryBattery(42, 28);
      generateArtilleryBattery(-42, -42);
      // Wrecked vehicles
      generateWreckedConvoy(18, -35);
      generateWreckedTank(-15, -28);
      generateWreckedAPC(25, 18);
      generateWreckedTruck(-30, 35);
      generateBillboard(-20, -30);
      generateBillboard(20, 30);
      generatePowerLines(0, 0, 5);
      // Drone nests at bay entrances
      generateDroneNest(48, 0);
      generateDroneNest(-48, 0);
      generateDroneNest(0, -48);
      generateDroneNest(0, 48);
      // Sevastopol city landmarks
      generateSevastopolMonument(0, -30);   // Monument to the Sunken Ships — Corinthian column in bay
      generateSovietAdminBuilding(-22, -15);// Naval HQ / Black Sea Fleet command building
      generatePortCrane(35, -10);           // Shipyard gantry crane
      generateNavalBarracks(-42, 32);       // Black Sea Fleet enlisted barracks
      generateSubmarineDock(-12, -45);      // Balaklava-style submarine bay
      generateTrainStation(35, -38);        // Sevastopol railway terminus (historic 1875 station)
    } else if (level.id === 'DONBAS') {
      // Donbas final push — mining heartland, trench warfare, urban fringe towns
      // Industrial core: coal mines, salt mines, slag heaps
      generateSaltMine(30, -30);          // Soledar salt mine (Putin's prize)
      generateTerikon(12, -36);           // Coal-mine slag heap — the Donbas skyline signature
      generateIndustrialComplex(-30, 30); // Donetsk coal processing
      generateIndustrialComplex(25, 28);  // Steel mill (Alchevsk)
      generateIndustrialComplex(-28, -28);// Coke plant
      generateGrainSilo(-42, -30);        // Agricultural silo
      generateGrainSilo(40, 32);
      generatePowerLines(0, 0, 6);        // High-voltage power grid
      generateRailway(0, -20, 45, false); // Donbas railway network
      generateRailway(-25, 0, 40, true);  // East-west rail line
      // Deep trench networks (Wagner/VDV prepared positions)
      generateTrenchNetwork(0, 0);
      generateTrenchNetwork(-20, 20);
      generateTrenchNetwork(22, -18);
      generateTrenchNetwork(-35, -15);
      generateTrenchNetwork(32, 18);
      generateMortarPit(-15, 12);
      generateMortarPit(18, -15);
      generateMortarPit(-38, 22);
      generateMortarPit(35, -28);
      // Minefields (extensive Donbas mining history + military)
      generateMinefield(-20, -20);
      generateMinefield(20, 20);
      generateMinefield(-40, 10);
      generateMinefield(38, -12);
      generateMinefieldSigns(12);
      // Urban fringe: workers' towns (Toretsk, Marinka, Novomykhailivka)
      generateUkrainianApartment(-48, -20, 9);
      generateUkrainianApartment(-48, 5, 6);
      generateUkrainianApartment(35, -18, 9);
      generateUkrainianApartment(35, 8, 6);
      generateUkrainianApartment(-15, -50, 9);
      generateUkrainianApartment(10, -50, 6);
      generateUkrainianApartment(-48, -45, 6);
      generateUkrainianApartment(38, -45, 6);
      generateUkrainianApartment(-15, 45, 6);
      generateUkrainianApartment(12, 45, 6);
      generateRuinedHouse(-38, -50);
      generateRuinedHouse(32, -52);
      generateRuinedHouse(-18, 48);
      generateRuinedCommercial(12, 48);
      generateRuinedCommercial(-42, 30);
      // Fortification ring (entrench-everything doctrine)
      generateBunker(-30, -35);
      generateBunker(28, -38);
      generateBunker(-32, 38);
      generateBunker(30, 40);
      generateSniperNest(-50, 0);
      generateSniperNest(48, 0);
      generateSniperNest(0, -52);
      generateSniperNest(0, 48);
      generateDefensivePosition(-22, 0);
      generateDefensivePosition(20, 0);
      generateDefensivePosition(0, -22);
      generateDefensivePosition(0, 22);
      generateAntiAirPosition(-42, -42);
      generateAntiAirPosition(40, 40);
      generateCheckpoint(0, 55, false);
      generateCheckpoint(0, -55, false);
      generateCheckpoint(52, 0, true);
      generateCheckpoint(-52, 0, true);
      generateArtilleryBattery(-40, -45);
      generateArtilleryBattery(38, 42);
      generateAmmoDepot(-35, 0);
      generateAmmoDepot(32, 0);
      generateFuelDepot(-12, -42);
      generateFuelDepot(10, 40);
      // Battle damage
      generateBurningRuin(-50, -40);
      generateBurningRuin(36, -38);
      generateBurningRuin(-18, -32);
      generateBurningRuin(20, 30);
      generateBurningRuin(0, -50);
      generateWreckedTank(-25, -30);
      generateWreckedTank(22, 32);
      generateWreckedAPC(-42, 25);
      generateWreckedConvoy(38, -22);
      generateWreckedTruck(-10, -55);
      generateWreckedBus(8, 52);
      generateBillboard(-30, -18);
      generateBillboard(28, 20);
      generateDroneNest(48, -48);
      generateDroneNest(-48, 48);
      generateDroneNest(48, 48);
      generateDroneNest(-48, -48);
      // Additional Donbas industrial / civic landmarks
      generateCoalWashingPlant(-42, -28);  // Coal preparation plant (Donetsk basin)
      generateMineShaftTower(-30, -45);    // Second mine headframe (Donetsk coal country)
      generateTrainStation(0, -38);        // Donetsk main railway station
      generateSovietAdminBuilding(0, -22); // City administration building
      generateChurch(-28, 28);             // Orthodox church (damaged in fighting)
      generateDonbasArena(12, -22);         // Donbas Arena — Shakhtar Donetsk stadium, struck by Russian shells 2022
    } else if (level.id === 'BELGOROD') {
      // Belgorod Oblast offensive — Russian border region, the fight taken to the aggressor
      // Russian border villages, military depots, border crossing fortifications
      // City outskirts: Russian provincial town (Belgorod city fringe)
      generateLuxuryVilla(-5, -8, 12, 9);    // Oblast admin building
      generateLuxuryVilla(8, -8, 10, 8);     // Security forces HQ
      generateUkrainianApartment(-30, -25, 9);
      generateUkrainianApartment(-30, -45, 6);
      generateUkrainianApartment(28, -28, 9);
      generateUkrainianApartment(28, -48, 6);
      generateUkrainianApartment(-15, -55, 6);
      generateUkrainianApartment(12, -55, 6);
      generateChurch(-22, -5);               // Russian orthodox church (prominent in Belgorod)
      generateChurch(20, 8);
      // Border crossing fortification (heavy defensive build-up)
      generateRazorWireField(0, 0);
      generateRazorWireMaze(-20, 0, 6);
      generateRazorWireMaze(20, 0, 6);
      generateBarbedWire(0, 0, 40, true);
      generateBarbedWire(0, 0, 40, false);
      generateAntiTankHedgehogs(18);
      generateBunker(-20, -20);
      generateBunker(20, 20);
      generateBunker(-20, 20);
      generateBunker(20, -20);
      generateBunker(-38, 0);
      generateBunker(38, 0);
      generateBunker(0, -38);
      generateBunker(0, 38);
      // Checkpoints (Grayvoron / Shebekino border crossing routes)
      generateCheckpoint(0, 44, false);
      generateCheckpoint(0, -44, false);
      generateCheckpoint(42, 0, true);
      generateCheckpoint(-42, 0, true);
      // Russian military staging areas (major artillery grouping northwest of Belgorod)
      generateArtilleryBattery(-38, -38);
      generateArtilleryBattery(36, 36);
      generateArtilleryBattery(-38, 36);
      generateArtilleryBattery(36, -38);
      generateAmmoDepot(-28, 0);
      generateAmmoDepot(25, 0);
      generateAmmoDepot(0, -30);
      generateAmmoDumpBerm(0, 30);
      generateFuelDepot(-40, 20);
      generateFuelDepot(38, -22);
      // Command infrastructure
      generateRadarTower(-48, -15);
      generateRadarTower(45, 18);
      generateCommandPost(-42, 42);
      generateCommandPost(40, -40);
      generateFieldHospital(0, -48);
      // Trench network (Russia dug in for fear of cross-border raids)
      generateTrenchNetwork(-18, 18);
      generateTrenchNetwork(18, -18);
      generateMortarPit(-30, 10);
      generateMortarPit(28, -12);
      generateSniperNest(-45, 0);
      generateSniperNest(42, 0);
      generateDefensivePosition(-12, 30);
      generateDefensivePosition(10, 30);
      generateAntiAirPosition(-28, -30);
      generateAntiAirPosition(25, 30);
      // Battle damage from partisan raids and drone strikes
      generateBurningRuin(-20, -32);
      generateBurningRuin(18, 30);
      generateBurningRuin(-38, 0);
      generateBurningRuin(35, 5);
      generateWreckedTank(-15, -28);
      generateWreckedAPC(12, 25);
      generateWreckedConvoy(-35, 28);
      generateWreckedTruck(30, -32);
      generateMinefield(-35, -18);
      generateMinefield(32, 20);
      generateCraters(8);
      generateBillboard(-25, -18);
      generateBillboard(22, 20);
      generateDroneNest(48, 48);
      generateDroneNest(-48, -48);
      generateDroneNest(48, -48);
      generateDroneNest(-48, 48);
      // Belgorod WWII memorial — eternal flame obelisk in the city centre
      generateBelgorodMemorial(0, 20);     // City-centre plaza memorial
      // Additional Belgorod city landmarks
      generateTrainStation(-15, 42);        // Belgorod central railway station
      generateSovietSchool(35, 32);         // Soviet-era school building
      generateSovietAdminBuilding(-38, 28); // Oblast court / administration
      generateGrainSilo(32, -38);           // Agricultural storage (Belgorod grain region)
      generateIndustrialComplex(-38, -8);   // Energomash rocket plant
    } else if (level.id === 'KREMLIN') {
      // KREMLIN SHOWDOWN — Final stage. The full Red Square / Moscow city center under assault.
      // The zombie president boss spawns from inside the Kremlin palace.
      generateKremlinPalace(0, 0);
      // Lenin's Mausoleum — stepped dark-red pyramid pressed against the
      // Kremlin south wall, on the north edge of Red Square.
      generateLeninMausoleum(0, 15);
      // St. Basil's Cathedral — the iconic colourful onion domes of Red Square,
      // standing just south of the palace where the player approaches the finale.
      generateStBasils(0, 40);
      // Kremlin walls: Red Square buildings (GUM, State Duma, Historical Museum)
      generateLuxuryVilla(-18, -10, 12, 8);   // GUM department store replica
      generateLuxuryVilla(18, -10, 10, 8);    // State Historical Museum
      generateLuxuryVilla(0, -20, 16, 10);    // State Duma / government bloc
      generateLuxuryVilla(-12, 15, 10, 8);    // Kremlin admin wing
      generateLuxuryVilla(12, 15, 10, 8);     // Presidential admin building
      // Inner ring: Stalinka apartment blocks surrounding Red Square
      generateUkrainianApartment(-30, -28, 14);
      generateUkrainianApartment(30, -28, 14);
      generateUkrainianApartment(-30, 28, 14);
      generateUkrainianApartment(30, 28, 14);
      generateUkrainianApartment(-48, 0, 10);
      generateUkrainianApartment(48, 0, 10);
      generateUkrainianApartment(0, -48, 10);
      // (south apartment relocated to a corner — St. Basil's Cathedral now occupies the south-centre)
      generateUkrainianApartment(-52, 48, 10);
      // Orthodox churches (Moscow has many — Kremlin grounds have Assumption Cathedral etc.)
      generateChurch(-22, 20);                // Assumption Cathedral (within Kremlin)
      generateChurch(22, 20);                 // Archangel Cathedral
      generateChurch(-38, -15);              // Church of St. George (outer)
      generateChristSaviour(44, -20);        // Cathedral of Christ the Saviour — gold-domed white cathedral
      generateOstankinoTower(-56, 42);       // Ostankino TV Tower needle on the NW skyline
      // Massive defensive fortification — last stand of the occupant
      generateRazorWireField(0, 0);
      generateRazorWireMaze(-25, 0, 5);
      generateRazorWireMaze(25, 0, 5);
      generateAntiTankHedgehogs(20);
      generateBarbedWire(0, 0, 35, false);
      generateBarbedWire(0, 0, 35, true);
      generateCheckpoint(0, 52, false);
      generateCheckpoint(0, -52, false);
      generateCheckpoint(52, 0, true);
      generateCheckpoint(-52, 0, true);
      generateDefensivePosition(-22, -22);
      generateDefensivePosition(22, -22);
      generateDefensivePosition(-22, 22);
      generateDefensivePosition(22, 22);
      generateDefensivePosition(-40, 0);
      generateDefensivePosition(40, 0);
      generateDefensivePosition(0, -40);
      // (south defensive position removed — St. Basil's Cathedral stands here)
      generateBunker(-35, 35);
      generateBunker(35, -35);
      generateBunker(-35, -35);
      generateBunker(35, 35);
      // Elite artillery + AA (regime's last defense)
      generateArtilleryBattery(35, 35);
      generateArtilleryBattery(-35, -35);
      generateArtilleryBattery(35, -35);
      generateArtilleryBattery(-35, 35);
      generateAntiAirPosition(20, -20);
      generateAntiAirPosition(-20, 20);
      generateAntiAirPosition(25, 42);
      generateAntiAirPosition(-25, -42);
      generateRadarTower(-48, 30);
      generateRadarTower(48, -30);
      generateCommTower(0, -35);              // Kremlin command comms
      // Ammo/fuel for the final stand
      generateAmmoDepot(42, 22);
      generateAmmoDepot(-42, -22);
      generateAmmoDumpBerm(28, -45);
      generateFuelDepot(-28, 45);
      generateCommandPost(-42, 42);           // General's command post
      generateCommandPost(42, -42);
      // Battle damage — some areas already hit
      generateBurningRuin(-25, -38);
      generateBurningRuin(25, 38);
      generateBurningRuin(0, -55);
      generateWreckedTank(-18, -35);
      generateWreckedTank(20, 30);
      generateWreckedAPC(-38, 18);
      generateWreckedConvoy(36, -18);
      generateWreckedTruck(-5, 52);
      // Propaganda / Z-symbol billboards
      generateBillboard(-30, -45);
      generateBillboard(30, 45);
      generateBillboard(-48, -48);
      generateBillboard(48, 48);
      // Drone nests (all 4 corners + cardinal points)
      generateDroneNest(56, 0);
      generateDroneNest(-56, 0);
      generateDroneNest(0, 56);
      generateDroneNest(0, -56);
      generateDroneNest(40, 40);
      generateDroneNest(-40, -40);
    } else if (level.id === 'SNAKE') {
      // Snake Island — iconic Black Sea outpost ("Russian warship, go fuck yourself!")
      // Small rocky outcrop: lighthouse, gun positions, communications relay
      generateLighthouse(0, 0);         // Zmiinyi Island lighthouse — the island's iconic landmark
      generateCommTower(8, 12);         // Strategic comms relay (reason Russia wanted it)
      generateRadarTower(-8, -12);      // Coastal radar
      generateDefensivePosition(-15, -15);
      generateDefensivePosition(15, 15);
      generateDefensivePosition(-10, 15);
      generateDefensivePosition(10, -15);
      generateAntiAirPosition(-20, 5);  // Man-portable AA (MANPADS)
      generateAntiAirPosition(18, -8);
      generateAmmoDepot(-10, 10);
      generateAmmoDepot(10, -10);
      generateAmmoCache(0, -20);        // Cache of shoulder-launched weapons
      generateAmmoCache(-5, 18);
      generateBunker(-18, 0);           // Garrison bunker for the 13 defenders
      generateBunker(16, 5);
      generateWatchtower(0, -25);       // Watch post toward the fleet approach
      generateWatchtower(-22, 8);
      generateCheckpoint(0, 20, false); // Only road access from landing zone
      generateBarbedWire(0, 0, 18, true);
      generateBarbedWire(0, 0, 18, false);
      // Battle damage from the Russian naval bombardment
      generateBurningRuin(12, 18);
      generateBurningRuin(-14, -18);
      generateWreckedTruck(-8, 22);
      generateDroneNest(25, 25);
      generateDroneNest(-25, -25);
      generateDroneNest(25, -25);
      // Snake Island fort ruins (historic fortification + lighthouse)
      generateSnakeIslandFort(0, 0);              // Ottoman/Russian fortress ruins surrounding the island
      generateSnakeIslandBarracks(-14, -22);      // Ukrainian border guard barracks (13 defenders' post)
      // Coastal artillery emplacements — historic naval guns still on the island
      (function () {
        var guns = [[20, 8], [-20, -8], [8, 22]];
        for (var gi = 0; gi < guns.length; gi++) {
          var gx = guns[gi][0], gz = guns[gi][1];
          var gh = getTerrainHeight(gx, gz) || 1;
          // Circular CONCRETE gun platform
          for (var pa = 0; pa < 360; pa += 45) {
            var pr = pa * Math.PI / 180;
            setBlock(Math.round(gx + Math.cos(pr) * 3), gh + 1, Math.round(gz + Math.sin(pr) * 3), BLOCK.CONCRETE);
          }
          _lmDisc(gx, gh + 1, gz, 2, BLOCK.CONCRETE);
          // Gun barrel (METAL pointing out to sea)
          setBlock(gx, gh + 2, gz, BLOCK.METAL);
          setBlock(gx, gh + 2, gz - 1, BLOCK.METAL);
          setBlock(gx, gh + 2, gz - 2, BLOCK.METAL);
          setBlock(gx, gh + 2, gz - 3, BLOCK.METAL);
          setBlock(gx, gh + 3, gz, BLOCK.METAL); // gun mount pivot
        }
      })();
      // Naval pier (Ukrainian Border Guard patrol boat dock)
      (function () {
        var px2 = 0, pz2 = -28;
        var ph = getTerrainHeight(px2, pz2) || 1;
        // Pier deck extending north into the sea
        for (var pd = 0; pd < 10; pd++) {
          setBlock(px2 - 1, ph, pz2 - pd, BLOCK.WOOD);
          setBlock(px2,     ph, pz2 - pd, BLOCK.WOOD);
          setBlock(px2 + 1, ph, pz2 - pd, BLOCK.WOOD);
        }
        // Pier posts below
        for (var pp = 0; pp < 3; pp += 3) {
          setBlock(px2 - 1, ph - 1, pz2 - pp, BLOCK.WOOD);
          setBlock(px2 + 1, ph - 1, pz2 - pp, BLOCK.WOOD);
        }
        // Patrol boat silhouette at dock (hull METAL, cabin CONCRETE)
        for (var bx2 = -2; bx2 <= 2; bx2++) {
          setBlock(px2 + bx2, ph + 1, pz2 - 7, BLOCK.METAL);
          setBlock(px2 + bx2, ph + 2, pz2 - 7, BLOCK.METAL);
        }
        setBlock(px2, ph + 3, pz2 - 6, BLOCK.CONCRETE); // bridge/cabin
        setBlock(px2, ph + 3, pz2 - 5, BLOCK.CONCRETE);
        setBlock(px2, ph + 4, pz2 - 6, BLOCK.CONCRETE);
      })();
      // Helicopter landing pad (CONCRETE square with H marking, LIGHT corners)
      (function () {
        var hx = 18, hz = 20;
        var hh = getTerrainHeight(hx, hz) || 1;
        // Pad surface
        for (var hpx = -4; hpx <= 4; hpx++) {
          for (var hpz = -4; hpz <= 4; hpz++) {
            setBlock(hx + hpx, hh, hz + hpz, BLOCK.CONCRETE);
          }
        }
        // H marking in LIGHT blocks
        setBlock(hx - 2, hh + 1, hz, BLOCK.LIGHT);
        setBlock(hx - 1, hh + 1, hz, BLOCK.LIGHT);
        setBlock(hx,     hh + 1, hz, BLOCK.LIGHT);
        setBlock(hx + 1, hh + 1, hz, BLOCK.LIGHT);
        setBlock(hx + 2, hh + 1, hz, BLOCK.LIGHT);
        setBlock(hx - 2, hh + 1, hz - 2, BLOCK.LIGHT);
        setBlock(hx - 2, hh + 1, hz - 1, BLOCK.LIGHT);
        setBlock(hx - 2, hh + 1, hz + 1, BLOCK.LIGHT);
        setBlock(hx - 2, hh + 1, hz + 2, BLOCK.LIGHT);
        setBlock(hx + 2, hh + 1, hz - 2, BLOCK.LIGHT);
        setBlock(hx + 2, hh + 1, hz - 1, BLOCK.LIGHT);
        setBlock(hx + 2, hh + 1, hz + 1, BLOCK.LIGHT);
        setBlock(hx + 2, hh + 1, hz + 2, BLOCK.LIGHT);
        // Corner lights
        setBlock(hx - 4, hh + 1, hz - 4, BLOCK.LIGHT);
        setBlock(hx + 4, hh + 1, hz - 4, BLOCK.LIGHT);
        setBlock(hx - 4, hh + 1, hz + 4, BLOCK.LIGHT);
        setBlock(hx + 4, hh + 1, hz + 4, BLOCK.LIGHT);
      })();
    } else if (level.id === 'SAKY') {
      // Saky Airbase, Crimea — Russia's largest military air base in Crimea
      // Ukraine struck this in August 2022 — Su-24, Su-30 fighters destroyed on ground
      generateRunway(0, 0, 80, 10);           // Main runway 2100m (scaled)
      generateRunway(-10, 30, 50, 6);         // Secondary taxiway
      // Destroyed Su-24 fighter-bombers on the apron — the Aug 2022 strike
      generateDestroyedJet(-8, 14);
      generateDestroyedJet(12, -14);
      generateControlTower(10, 15);            // ATC tower
      generateRadarTower(-30, -25);            // Air defense radar
      generateRadarTower(30, -25);             // Early warning radar
      generateCommTower(0, -40);              // Base communications
      // Aircraft hangars (hardened shelters — HAS)
      generateIndustrialComplex(-22, -22);     // Hardened aircraft shelter A
      generateIndustrialComplex(22, -22);      // Hardened aircraft shelter B
      generateIndustrialComplex(-22, 22);      // Maintenance hangar
      generateIndustrialComplex(22, 22);       // Fueling complex
      // Fuel & ammo dumps (multiple ones — that's what exploded in Aug 2022)
      generateFuelDepot(-40, 0);              // Aviation fuel depot
      generateFuelDepot(40, 0);              // Reserve fuel depot
      generateFuelDepot(0, -50);             // Bulk fuel storage
      generateAmmoDepot(30, -40);            // Aviation ordnance storage
      generateAmmoDepot(-30, -40);           // Missile depot
      generateAmmoDumpBerm(35, 40);          // Bunkered ammo cache
      // Air defense systems
      generateAntiAirPosition(-35, 30);
      generateAntiAirPosition(35, 30);
      generateAntiAirPosition(-48, -10);
      generateAntiAirPosition(48, -10);
      // Barracks / support buildings
      generateLuxuryVilla(-15, 35, 12, 8);    // Officers' quarters
      generateLuxuryVilla(15, 35, 10, 8);     // Enlisted barracks
      generateLuxuryVilla(0, 48, 14, 10);     // Command center
      generateFieldHospital(-28, 42);
      // Security checkpoints around the base perimeter
      generateCheckpoint(0, 55, false);
      generateCheckpoint(0, -55, false);
      generateCheckpoint(52, 0, true);
      generateCheckpoint(-52, 0, true);
      generateBarbedWire(0, 0, 50, true);     // Perimeter fence north-south
      generateBarbedWire(0, 0, 50, false);    // Perimeter fence east-west
      // Battle damage (Kerch/SCALP missile strikes)
      generateBurningRuin(18, -28);
      generateBurningRuin(-18, -28);
      generateBurningRuin(0, -35);
      generateBurningRuin(40, 5);
      generateWreckedAPC(-40, 15);
      generateWreckedTruck(38, -45);
      generateWreckedConvoy(-42, -38);
      generateDroneNest(48, 48);
      generateDroneNest(-48, 48);
      generateDroneNest(48, -48);
      generateDroneNest(-48, -48);
      // Saky military airbase landmarks (Aug 2022 explosion site)
      generateSakyAirbase(0, -20);           // ATC tower + revetment + explosion craters
      generateAircraftHangar(-40, -35);      // Hardened aircraft shelter (HAS)
      generateAircraftHangar(38, -35);       // Second hardened shelter
    } else if (level.id === 'VUHLEDAR') {
      // Vuhledar — Russia's worst defeat. The 155th Marine Brigade lost 300+ tanks
      // in minefield corridors. Nicknamed "the Russian tank graveyard."
      // Sprawling tank wreckage field
      generateDestroyedVehicles(30);       // Random destroyed vehicle scatter
      generateDestroyedTank(-15, -15);     // Named tank kills
      generateDestroyedTank(15, 15);
      generateDestroyedTank(-15, 15);
      generateDestroyedTank(15, -15);
      generateDestroyedTank(-30, 0);
      generateDestroyedTank(30, 0);
      generateDestroyedTank(0, -30);
      generateDestroyedTank(0, 30);
      generateWreckedTank(-22, -22);       // More wrecks
      generateWreckedTank(22, 22);
      generateWreckedTank(-25, 10);
      generateWreckedTank(22, -12);
      generateWreckedAPC(-10, -28);
      generateWreckedAPC(12, 28);
      generateWreckedAPC(-28, -5);
      generateWreckedAPC(25, 5);
      generateWreckedConvoy(-32, 20);      // Ambushed column
      generateWreckedConvoy(30, -22);
      generateWreckedTruck(-38, 5);
      generateWreckedTruck(35, -8);
      // Massive minefield network (what stopped the 155th Brigade)
      generateMinefield(-25, -25);
      generateMinefield(25, 25);
      generateMinefield(-28, 12);
      generateMinefield(25, -14);
      generateMinefield(0, -38);
      generateMinefield(0, 35);
      generateMinefield(-42, -10);
      generateMinefield(40, 12);
      generateMinefieldSigns(16);          // Warning signs scattered throughout
      // Craters from failed armor pushes
      generateCraters(18);
      // Ukrainian defensive trenches (held the high ground successfully)
      generateTrenchNetwork(0, 0);
      generateTrenchNetwork(-18, 18);
      generateTrenchNetwork(18, -18);
      generateMortarPit(-25, 0);
      generateMortarPit(22, 0);
      generateMortarPit(0, -25);
      generateMortarPit(0, 22);
      generateSniperNest(-38, -38);
      generateSniperNest(35, -38);
      generateSniperNest(-38, 35);
      generateSniperNest(35, 35);
      generateBunker(-20, 20);
      generateBunker(20, -20);
      generateBunker(-40, 0);
      generateBunker(38, 0);
      // Ukrainian observation posts (they had great line of sight from hills)
      generateWatchtower(0, -42);
      generateWatchtower(-42, 0);
      generateWatchtower(0, 40);
      generateWatchtower(40, 0);
      generateObservationPost(-30, -30);
      generateObservationPost(28, 30);
      // Vuhledar town (mining community on the ridge)
      generateUkrainianApartment(-45, -20, 6);
      generateUkrainianApartment(-45, 5, 6);
      generateUkrainianApartment(38, -22, 6);
      generateUkrainianApartment(38, 8, 6);
      generateBurningRuin(-42, -42);
      generateBurningRuin(40, -40);
      generateBurningRuin(-10, -52);
      generateBurningRuin(12, 50);
      generateDefensivePosition(-15, 28);
      generateDefensivePosition(12, 28);
      generateCheckpoint(0, 48, false);
      generateCheckpoint(0, -48, false);
      generateCheckpoint(45, 0, true);
      generateCheckpoint(-45, 0, true);
      generateAntiAirPosition(-32, 35);
      generateAntiAirPosition(30, -35);
      generateAmmoDepot(-28, 28);
      generateAmmoDepot(25, -30);
      generateDroneNest(48, 0);
      generateDroneNest(-48, 0);
      generateDroneNest(0, 48);
      generateDroneNest(0, -48);
      // Vuhledar mining landmarks — coal mine headframe + extra terikon slag heap
      generateMineShaftTower(38, -40);     // Kopyor winding tower (NE edge — Vuhledar was coal country)
      generateTerikon(-32, 35);            // Second slag heap (NW — visible for miles)
      // Additional Vuhledar town landmarks
      generateCoalWashingPlant(-12, -45);  // Coal preparation plant (mine processing)
      generateMineShaftTower(-40, -18);    // Second mine headframe (town had multiple shafts)
      generateSovietSchool(5, 45);         // Vuhledar School #1 (destroyed in siege)
      generateSovietAdminBuilding(0, 32);  // Vuhledar city hall / administration
      generateChurch(-38, 22);             // Orthodox church (damaged in fighting)
      generateFieldHospital(28, -12);      // Vuhledar district hospital (heavily shelled 2022-23)
      generateWaterTower(15, -22);         // Municipal water supply tower
      generateUkrainianApartment(-15, -8, 5); // Soviet 5-story residential block
      generateUkrainianApartment(22, -8, 5);  // Second residential block (east side)
    } else if (level.id === 'ANTONOV') {
      // Antonov Bridge / Kherson Oblast — HIMARS supply line interdiction
      // The bridge over the Dnipro was struck repeatedly to cut Russian supplies
      // Main bridge (scaled from ~2km to game units)
      generateBridge(0, 0, 60, 8);             // Main Antonov highway bridge
      generateBridge(-8, 0, 60, 4);            // Rail bridge alongside
      generateCollapsedBridge(20, 0);           // Already-bombed section
      generateBridgeFortification(25, 0);
      generateBridgeFortification(-25, 0);
      generateBridgeFortification(0, 30);       // Mid-bridge AA emplacement
      // Supply staging area (Russian logistics hub north side)
      generateAmmoDepot(-30, 30);
      generateAmmoDepot(30, 30);
      generateFuelDepot(0, 45);
      generateFuelDepot(-35, 45);
      generateFuelDepot(32, 42);
      generateAmmoDumpBerm(-22, 50);
      generateWreckedConvoy(15, 48);            // Destroyed supply trucks
      generateWreckedTruck(-18, 45);
      generateWreckedTruck(22, 52);
      // South (Ukrainian) side: Kherson city outskirts
      generateCheckpoint(32, -15, true);
      generateCheckpoint(-32, -15, true);
      generateCheckpoint(0, -40, false);
      generateUkrainianApartment(-48, -22, 9);
      generateUkrainianApartment(-48, 8, 6);
      generateUkrainianApartment(35, -20, 9);
      generateUkrainianApartment(35, 10, 6);
      generateUkrainianApartment(-18, -52, 9);
      generateUkrainianApartment(12, -52, 6);
      generateUkrainianApartment(-50, -45, 6);
      generateUkrainianApartment(38, -45, 6);
      generateChurch(-28, -10);                // Kherson south bank cathedral
      generateGrainSilo(-42, 25);              // Port grain elevator
      generateIndustrialComplex(-38, -30);     // Kherson port facility
      // Bridge defense fortifications
      generateAntiAirPosition(-35, 35);
      generateAntiAirPosition(32, 35);
      generateAntiAirPosition(-42, 0);
      generateAntiAirPosition(40, 0);
      generateDefensivePosition(-20, 20);
      generateDefensivePosition(18, 22);
      generateDefensivePosition(-15, -15);
      generateDefensivePosition(12, -15);
      generateMortarPit(-28, 40);
      generateMortarPit(25, 42);
      generateSniperNest(-40, -10);             // Sniper nests covering the bridge
      generateSniperNest(38, -12);
      generateSniperNest(0, -35);
      generateWatchtower(-5, -28);              // Observation post toward bridge
      generateWatchtower(-22, 25);
      generateWatchtower(20, 28);
      generateRadarTower(-42, 38);
      generateCommTower(0, 55);
      // Surrounding battle damage
      generateBurningRuin(-48, -42);
      generateBurningRuin(35, -40);
      generateBurningRuin(-10, 38);
      generateBurningRuin(12, 40);
      generateWreckedTank(-22, -30);
      generateWreckedAPC(20, -32);
      generateWreckedCar(-5, -50);
      generateWreckedCar(8, -48);
      generatePowerLines(0, 0, 4);
      generateBillboard(-30, -20);
      generateBillboard(28, 22);
      // Drone nests (both sides of the crossing)
      generateDroneNest(48, 48);
      generateDroneNest(-48, 48);
      generateDroneNest(48, -48);
      generateDroneNest(-48, -48);
      // Kherson Pokrovska Cathedral — white walls + blue dome visible from the Dnipro
      generateKhersonCathedral(-20, -42);  // South (Kherson city) side, near the bank
      // Antonov aircraft factory landmarks (Hostomel/Kyiv Oblast)
      generateAntonovFactory(0, -25);       // Primary production hall + sawtooth roof
      generateAircraftHangar(30, 10);       // Secondary assembly hangar
    } else if (level.id === 'REFINERY') {
      // Russian-held oil refinery — Lukoil/Gazprom facility in occupied territory
      // Drone strikes by Ukraine repeatedly hit refineries throughout 2023-2024
      // Central processing units (distillation towers, cracking units)
      generateIndustrialComplex(0, 0);          // Primary distillation unit
      generateIndustrialComplex(15, -15);       // Cracking unit 2
      generateIndustrialComplex(-15, 15);       // Processing unit 3
      generateIndustrialComplex(20, 15);        // Hydrodesulfurization block
      generateIndustrialComplex(-18, -18);      // Catalytic converter block
      // Fuel storage farm (distinctive white cylindrical tanks)
      generateFuelDepot(0, 0);
      generateFuelDepot(20, 20);
      generateFuelDepot(-20, -20);
      generateFuelDepot(32, 0);
      generateFuelDepot(-32, 0);
      generateFuelDepot(0, 32);
      generateFuelDepot(0, -32);
      generateFuelDepot(28, -28);
      generateFuelDepot(-28, 28);
      // Control and communications towers (flare stacks, monitoring masts)
      generateControlTower(0, 30);
      generateControlTower(-15, 30);
      generateControlTower(15, 30);
      generateCommTower(0, -30);
      generateRadarTower(-30, -15);
      generateRadarTower(28, 15);
      generateWaterTower(-28, 25);             // Cooling water towers
      generateWaterTower(25, -28);
      generateWaterTower(-10, -35);
      // Ammo/supply dumps (Russian forces fortified the facility)
      generateAmmoDepot(30, 0);
      generateAmmoDepot(-28, 12);
      generateAmmoDepot(22, -32);
      generateAmmoDumpBerm(-22, 32);
      // Anti-air — refineries are prime drone/air strike targets
      generateAntiAirPosition(-38, -25);
      generateAntiAirPosition(38, 22);
      generateAntiAirPosition(-20, 38);
      generateAntiAirPosition(18, -40);
      // Perimeter security — checkpoints, defensive positions, bunkers
      generateCheckpoint(0, 44, false);
      generateCheckpoint(0, -44, false);
      generateCheckpoint(44, 0, true);
      generateCheckpoint(-44, 0, true);
      generateDefensivePosition(-30, 0);
      generateDefensivePosition(30, 0);
      generateDefensivePosition(0, -30);
      generateDefensivePosition(0, 30);
      generateDefensivePosition(-22, -22);
      generateDefensivePosition(22, 22);
      generateBunker(-38, -38);
      generateBunker(38, -38);
      generateBunker(-38, 38);
      generateBunker(38, 38);
      generateWatchtower(-48, -25);
      generateWatchtower(48, 22);
      generateWatchtower(-25, 48);
      generateWatchtower(22, -48);
      generateBarbedWire(0, 0, 30, true);
      generateBarbedWire(0, 0, 30, false);
      generateAntiTankHedgehogs(15);
      // Artillery defending the refinery perimeter
      generateArtilleryBattery(-42, 15);
      generateArtilleryBattery(40, -18);
      // Battle damage — Ukrainian drone strikes hit multiple tank farms and towers
      generateBurningRuin(-10, 10);
      generateBurningRuin(12, -12);
      generateBurningRuin(-25, -5);
      generateBurningRuin(22, 8);
      generateBurningRuin(0, -22);
      generateCraters(10);
      generateRuins(6);
      generateWreckedTank(-18, -30);
      generateWreckedTank(16, 28);
      generateWreckedAPC(-28, 18);
      generateWreckedConvoy(30, -20);
      generateDestroyedVehicles(12);
      // Worker/guard facilities (Soviet-era refinery industrial compound)
      generateApartmentBlock(-35, -48, 4);     // Worker barracks/housing
      generateApartmentBlock(32, -48, 4);
      generateLuxuryVilla(-8, -48, 10, 8);     // Administrative HQ building
      // Power and rail infrastructure
      generatePowerLines(0, 0, 5);
      generateRailway(-15, 0, 40, false);      // Loading rail yard
      generateDroneNest(48, 48);
      generateDroneNest(-48, 48);
      generateDroneNest(48, -48);
      generateDroneNest(-48, -48);
      // Refinery landmark structures (distillation tower, LPG sphere, cooling tower)
      generateRefineryDistillationTower(-5, -38);  // Primary distillation column + flare stack
      generateRefinerySphere(20, -28);              // LPG spherical storage tank on legs
      generateCoolingTower(-32, 12);               // Industrial hyperbolic cooling tower
    }

    // ── PROC_CITIES: distinct content for each procedural city ─────────────
    // Cities are: Mariupol, Severodonetsk, Lysychansk, Bucha, Irpin,
    //             Izium, Kupyansk, Robotyne, Vuhledar  (repeat after 9)
    if (level.id && level.id.startsWith('PROC_')) {
      var cityName = level.name;
      if (cityName === 'Bucha') {
        // Bucha suburb of Kyiv — site of documented Russian war crimes March 2022
        // Residential neighbourhood: villas with gardens, Soviet-era apartment rows
        generateLuxuryVilla(-8, -12, 8, 6);    // Irpin'ska Street villas (suburb)
        generateLuxuryVilla(10, -14, 7, 5);
        generateLuxuryVilla(-20, -20, 9, 7);
        generateLuxuryVilla(18, -22, 8, 6);
        generateLuxuryVilla(-5, -30, 7, 5);
        generateLuxuryVilla(22, -35, 8, 6);
        generateLuxuryVilla(-28, -35, 9, 7);
        generateLuxuryVilla(32, -18, 7, 5);
        generateUkrainianApartment(-38, -18, 5);
        generateUkrainianApartment(-38, -38, 5);
        generateUkrainianApartment(28, -42, 5);
        generateChurch(-12, -42);               // St Andrew's Church (historic landmark)
        generateTrainStation(30, 20);           // Bucha railway station (Kyiv–Kovel line)
        generateFieldHospital(0, 15);           // MSF / Ukrainian humanitarian point
        generateWaterTower(40, -28);
        generatePowerLines(0, 0, 4);
        generateRailway(15, 0, 35, false);
        generateBurningRuin(-18, -8);           // Villas burned by occupation forces
        generateBurningRuin(15, -10);
        generateBurningRuin(-30, -12);
        generateBurningRuin(8, -38);
        generateWreckedCar(-8, -18);            // Civilians' cars on Yablunska Street
        generateWreckedCar(5, -25);
        generateWreckedCar(-22, -28);
        generateWreckedAmbulance(12, -30);
        generateWreckedConvoy(-15, 5);          // Russian convoy that retreated
        generateRuinedHouse(-42, -28);
        generateRuinedHouse(35, -35);
        generateSniperNest(-38, 8);             // Russian sniper positions
        generateSniperNest(38, 12);
        generateBunker(-25, 10);
        generateBunker(20, 10);
        generateDroneNest(48, 48);
        generateDroneNest(-48, 48);
        generateDroneNest(0, -48);
      } else if (cityName === 'Irpin') {
        // Irpin — satellite city of Kyiv, famous evacuation/river crossing Feb–Mar 2022
        // The blown Irpin bridge became a global image of the war
        generateCollapsedBridge(0, 0);          // The Irpin evacuation bridge (destroyed to slow advance)
        generateCollapsedBridge(-15, -5);       // Second river crossing (blown)
        generateLuxuryVilla(-12, -18, 8, 6);   // Residential district villas
        generateLuxuryVilla(10, -20, 7, 5);
        generateLuxuryVilla(-22, -30, 9, 7);
        generateLuxuryVilla(20, -32, 8, 6);
        generateLuxuryVilla(-5, -42, 7, 5);
        generateLuxuryVilla(28, -22, 8, 6);
        generateLuxuryVilla(32, -38, 9, 7);
        generateLuxuryVilla(-35, -20, 7, 5);
        generateUkrainianApartment(-30, -48, 6);
        generateUkrainianApartment(25, -50, 6);
        generateUkrainianApartment(-45, -35, 5);
        generateChurch(0, -35);                 // Local orthodox church used as shelter
        generateWaterTower(-40, -12);
        generateFieldHospital(15, 12);
        generatePowerLines(0, 0, 4);
        generateBurningRuin(8, -22);
        generateBurningRuin(-18, -25);
        generateBurningRuin(25, -40);
        generateBurningRuin(-35, -42);
        generateWreckedTank(-10, -12);          // Russian T-72 abandoned on evacuation route
        generateWreckedTank(18, -15);
        generateWreckedAPC(-25, -18);
        generateWreckedCar(5, -28);
        generateWreckedCar(-15, -30);
        generateWreckedAmbulance(22, -28);
        generateWreckedConvoy(-20, 8);
        generateRuinedHouse(38, -28);
        generateRuinedHouse(-38, -48);
        generateBarbedWire(0, 0, 25, true);     // Ukrainian defensive line
        generateAntiTankHedgehogs(12);
        generateCheckpoint(0, 20, false);       // Evacuation corridor checkpoint
        generateBunker(-15, 18);
        generateBunker(15, 18);
        generateDroneNest(48, -48);
        generateDroneNest(-48, -48);
        generateDroneNest(0, 48);
      } else if (cityName === 'Severodonetsk') {
        // Severodonetsk — industrial twin city of Lysychansk, chemical plant city
        // Destroyed May–June 2022 in the longest single-city siege of the war
        generateIndustrialComplex(0, 0);        // Azot chemical plant — largest nitrogen plant in Ukraine
        generateIndustrialComplex(-20, -10);    // Azot processing block 2
        generateIndustrialComplex(22, 12);      // Azot block 3 (Azovstal of the north)
        generateCoolingTower(-35, 5);           // Azot cooling towers (visible from city)
        generateCoolingTower(35, -15);
        generateRefineryDistillationTower(15, -20); // Chemical distillation column
        generateCommTower(0, -30);              // Industrial comms mast
        generateWaterTower(-30, 28);
        generateWaterTower(30, -35);
        generateUkrainianApartment(-30, -30, 9); // Khimik microdistrict (chemical workers' housing)
        generateUkrainianApartment(-30, -50, 6);
        generateUkrainianApartment(22, -32, 9);
        generateUkrainianApartment(22, -52, 6);
        generateUkrainianApartment(-15, -60, 5);
        generateUkrainianApartment(12, -60, 5);
        generateUkrainianApartment(-48, -12, 6);
        generateUkrainianApartment(42, -12, 6);
        generateSovietAdminBuilding(0, -22);    // City hall on Lenin Square
        generateChurch(-25, -8);
        generateChurch(22, 5);
        generateTrainStation(-35, 30);
        generateBridge(0, 20, 30, 4);          // Siversky Donets river crossing
        generateCollapsedBridge(15, 25);        // Blown secondary bridge
        generateRailway(-15, 0, 45, false);
        generateAmmoDepot(-28, -18);
        generateAmmoDepot(25, -20);
        generateArtilleryBattery(38, -38);
        generateArtilleryBattery(-38, 35);
        generateTrenchNetwork(-15, 15);
        generateTrenchNetwork(15, -15);
        generateBunker(-28, 28);
        generateBunker(25, 25);
        generateBurningRuin(-18, -18);
        generateBurningRuin(15, 20);
        generateBurningRuin(-35, -35);
        generateBurningRuin(35, 35);
        generateWreckedTank(-12, -25);
        generateWreckedAPC(18, -22);
        generateWreckedConvoy(-38, 18);
        generateDroneNest(48, 48);
        generateDroneNest(-48, -48);
        generateDroneNest(48, -48);
        generateDroneNest(-48, 48);
      } else if (cityName === 'Lysychansk') {
        // Lysychansk — hilltop city above the Siversky Donets, twin of Severodonetsk
        // Last Ukrainian-held city before it fell 3 July 2022
        // Famous for: Lysychansk Oil Refinery (huge complex), hilltop positions
        generateRefineryDistillationTower(0, 0);   // Lysychansk Oil Refinery — primary column
        generateRefineryDistillationTower(-15, -8);// Secondary distillation
        generateRefinerySphere(20, 15);             // LPG sphere
        generateCoolingTower(-30, 8);               // Refinery cooling tower
        generateCoolingTower(30, -5);
        generateIndustrialComplex(12, -20);         // Refinery processing units
        generateIndustrialComplex(-18, -18);
        generateGrainSilo(35, 20);                  // Agricultural silo (Luhansk Oblast grain)
        generateGrainSilo(-35, -22);
        generateWaterTower(0, -35);
        generateUkrainianApartment(-28, -30, 9);    // Lysychansk residential
        generateUkrainianApartment(-28, -52, 6);
        generateUkrainianApartment(22, -28, 9);
        generateUkrainianApartment(22, -50, 6);
        generateUkrainianApartment(-15, -62, 5);
        generateUkrainianApartment(12, -62, 5);
        generateApartmentBlock(-45, -15, 4);
        generateApartmentBlock(38, -15, 4);
        generateSovietAdminBuilding(0, -18);        // Lysychansk city administration
        generateChurch(-22, -5);
        generateTrainStation(30, 30);
        generateRailway(-10, 20, 40, false);
        generateRailway(-20, 0, 35, true);
        generateSniperNest(-40, 0);                 // Ukrainian hilltop sniper positions
        generateSniperNest(40, 0);
        generateSniperNest(0, -48);
        generateBunker(-20, -22);
        generateBunker(20, 20);
        generateArtilleryBattery(-38, 32);
        generateArtilleryBattery(35, -35);
        generateAmmoDepot(-32, 12);
        generateAmmoDepot(28, -12);
        generateTrenchNetwork(-18, 18);
        generateTrenchNetwork(18, -18);
        generateBurningRuin(-18, -12);
        generateBurningRuin(15, 18);
        generateBurningRuin(35, -30);
        generateWreckedTank(-15, 22);
        generateWreckedAPC(18, -18);
        generateWreckedConvoy(38, 28);
        generateCraters(10);
        generateDroneNest(48, 48);
        generateDroneNest(-48, -48);
        generateDroneNest(48, -48);
        generateDroneNest(-48, 48);
      } else if (cityName === 'Izium') {
        // Izium (Izyum) — city in Kharkiv Oblast, occupied Mar–Sep 2022
        // Known for: discovered mass graves after liberation, WWII memorial city
        generateLuxuryVilla(-8, -10, 10, 8);    // City administration (Soborna Square)
        generateChurch(-20, -5);                 // Izium cathedral (bombed)
        generateChurch(18, 8);                   // Second parish church
        generateUkrainianApartment(-30, -25, 9);
        generateUkrainianApartment(-30, -45, 6);
        generateUkrainianApartment(25, -28, 9);
        generateUkrainianApartment(25, -48, 6);
        generateUkrainianApartment(-15, -55, 5);
        generateUkrainianApartment(12, -55, 5);
        generateTrainStation(-35, 25);
        generateRailway(-20, 10, 35, false);
        generateBridge(0, 10, 35, 5);            // Siversky Donets bridge
        generateWaterTower(38, -30);
        generateWaterTower(-38, -30);
        generateSovietAdminBuilding(0, -25);
        generateBelgorodMemorial(5, 22);         // WWII memorial (re-used for new graves 2022)
        generateBunker(-22, -18);
        generateBunker(20, -20);
        generateTrenchNetwork(-15, 15);
        generateTrenchNetwork(15, -15);
        generateArtilleryBattery(-38, -35);
        generateArtilleryBattery(35, 35);
        generateBurningRuin(-15, -18);
        generateBurningRuin(12, 18);
        generateBurningRuin(-30, -30);
        generateBurningRuin(28, -28);
        generateWreckedTank(-12, -22);
        generateWreckedAPC(18, 15);
        generateWreckedConvoy(-35, 25);
        generateCraters(8);
        generateDroneNest(48, -48);
        generateDroneNest(-48, 48);
        generateDroneNest(0, 48);
      } else if (cityName === 'Kupyansk') {
        // Kupyansk — railway junction city in Kharkiv Oblast, key logistics hub
        // Occupied Feb 2022, liberated Sep 2022, contested again 2024
        generateTrainStation(0, 0);             // Kupyansk-Uzlovyi major railway junction
        generateRailway(-20, 5, 50, true);      // East-west rail line (main axis)
        generateRailway(5, -15, 40, false);     // North-south spur
        generateRailway(-10, 15, 35, true);     // Second east-west line
        generateGrainSilo(-35, -20);            // Agricultural grain terminal (Oskil region)
        generateGrainSilo(32, -25);
        generateBridge(0, 20, 30, 4);           // Oskil River bridge
        generateCollapsedBridge(15, 25);        // Second bridge (blown)
        generateUkrainianApartment(-28, -32, 9);
        generateUkrainianApartment(-28, -52, 6);
        generateUkrainianApartment(22, -35, 9);
        generateUkrainianApartment(22, -52, 6);
        generateUkrainianApartment(-48, -10, 5);
        generateUkrainianApartment(42, -10, 5);
        generateLuxuryVilla(-5, -18, 10, 8);   // City hall (Maydan square area)
        generateChurch(-22, -8);
        generateWaterTower(-40, 30);
        generatePowerLines(0, 0, 5);
        generateIndustrialComplex(35, -15);     // Mechanical plant
        generateAmmoDepot(-28, 12);
        generateAmmoDepot(25, 10);
        generateArtilleryBattery(-40, -38);
        generateArtilleryBattery(38, 35);
        generateCheckpoint(0, 45, false);       // Main highway N26
        generateCheckpoint(0, -45, false);
        generateBunker(-20, 18);
        generateBunker(18, 18);
        generateTrenchNetwork(-18, 20);
        generateTrenchNetwork(18, -20);
        generateBurningRuin(-18, -15);
        generateBurningRuin(15, 15);
        generateWreckedTank(-12, -18);
        generateWreckedConvoy(35, -30);
        generateDroneNest(48, 48);
        generateDroneNest(-48, -48);
        generateDroneNest(48, -48);
      } else if (cityName === 'Robotyne') {
        // Robotyne (Robotynne) — small village, key 2023 counteroffensive breakthrough
        // Just farmland, one church, grain silos, extensive minefields
        generateChurch(0, 0);                   // Village orthodox church (the only landmark)
        generateGrainSilo(18, -12);             // Village grain store
        generateGrainSilo(-15, 15);
        generateFarmBuilding(-20, -18);         // Farm outbuildings
        generateFarmBuilding(22, 18);
        generateFarmBuilding(-25, 20);
        generateWaterTower(-30, -10);           // Village water tower
        generateUkrainianApartment(-10, -28, 3); // Small 3-storey block (collective farm housing)
        generateUkrainianApartment(8, -30, 3);
        generateWreckedTank(-18, -8);           // Russian T-80 graveyard (2023 assault)
        generateWreckedTank(15, -5);
        generateWreckedTank(28, 12);
        generateWreckedAPC(-25, 5);
        generateWreckedAPC(20, -18);
        generateWreckedConvoy(-38, -22);
        // Extensive minefields — Robotyne was defended by 3 mine belts
        generateMinefield(-25, -25);
        generateMinefield(25, 25);
        generateMinefield(-40, 5);
        generateMinefield(38, -8);
        generateMinefield(0, -35);
        generateMinefieldSigns(15);
        generateTrenchNetwork(-12, 12);
        generateTrenchNetwork(12, -12);
        generateTrenchNetwork(-30, 30);
        generateTrenchNetwork(30, -30);
        generateBunker(-15, -15);
        generateBunker(15, 15);
        generateBunker(-35, 0);
        generateBunker(35, 0);
        generateMortarPit(-28, -12);
        generateMortarPit(25, 10);
        generateDefensivePosition(-10, 20);
        generateDefensivePosition(10, -20);
        generateAntiTankHedgehogs(20);
        generateBurningRuin(-8, -8);
        generateBurningRuin(10, 10);
        generateBurningRuin(-22, 18);
        generateBurningRuin(20, -22);
        generateCraters(15);
        generateDroneNest(45, 45);
        generateDroneNest(-45, -45);
        generateDroneNest(45, -45);
        generateDroneNest(-45, 45);
      } else if (cityName === 'Kharkiv') {
        // Kharkiv — Ukraine's second city, closest major city to the Russian border
        // Bombarded from Feb 2022, Freedom Square hit multiple times
        // Derzhprom (Palace of Industry) — constructivist icon on Freedom Square, Europe's largest square
        generateDerzhprom(-5, -5);                 // Heart of Freedom Square (Maidan Svobody)
        generateLuxuryVilla(12, -8, 12, 10);       // Kharkiv City Administration (Soviet neoclassical)
        generateLuxuryVilla(-20, -10, 10, 8);      // Oblast State Administration (bombed facade)
        generateUkrainianApartment(-30, -30, 12);  // Saltivka microdistrict (most bombed in Europe 2022)
        generateUkrainianApartment(-30, -52, 12);
        generateUkrainianApartment(22, -32, 12);
        generateUkrainianApartment(22, -52, 9);
        generateUkrainianApartment(-15, -65, 9);
        generateUkrainianApartment(12, -65, 9);
        generateUkrainianApartment(-48, -18, 9);
        generateUkrainianApartment(42, -18, 9);
        generateUkrainianApartment(-50, -40, 6);
        generateUkrainianApartment(38, -42, 6);
        generateChurch(-22, -5);                   // Assumption Cathedral (bombed 2022)
        generateChurch(20, 5);                     // Annunciation Cathedral
        generateTrainStation(35, 30);              // Kharkiv Central Railway Station
        generateIndustrialComplex(-35, -35);       // Turboatom turbine plant (defense industry)
        generateIndustrialComplex(30, -30);        // Morozov Design Bureau (tank plant)
        generateWaterTower(-42, 15);
        generateWaterTower(40, -12);
        generateGrainSilo(-38, -55);
        generateGrainSilo(32, -58);
        generateCommTower(0, -40);                 // Kharkiv TV tower
        generateSovietAdminBuilding(0, -25);
        generatePowerLines(0, 0, 5);
        generateRailway(-20, 0, 45, true);
        generateRailway(0, -20, 40, false);
        generateArtilleryBattery(-40, -50);
        generateArtilleryBattery(38, 40);
        generateBunker(-20, 20);
        generateBunker(20, -20);
        generateTrenchNetwork(-15, 15);
        generateTrenchNetwork(15, -15);
        generateBurningRuin(-18, -18);
        generateBurningRuin(15, 18);
        generateBurningRuin(-40, -35);
        generateBurningRuin(35, -35);
        generateWreckedTank(-12, -22);
        generateWreckedAPC(18, 15);
        generateWreckedConvoy(-35, 22);
        generateCraters(12);
        generateDroneNest(48, 48);
        generateDroneNest(-48, -48);
        generateDroneNest(48, -48);
        generateDroneNest(-48, 48);
      } else if (cityName === 'Odessa') {
        // Odessa — major Black Sea port, UNESCO heritage center, cultural capital
        // Famous: opera house, Potemkin Steps, catacombs; struck by Iranian Shaheds
        generateOdessaOperaHouse(0, -5);           // Odessa National Opera House — 1887 neo-baroque
        generateLuxuryVilla(-10, -12, 12, 10);     // Odessa City Hall (neoclassical)
        generateLuxuryVilla(12, -15, 10, 8);       // Regional Administration
        generateUkrainianApartment(-30, -28, 9);
        generateUkrainianApartment(-30, -48, 6);
        generateUkrainianApartment(25, -30, 9);
        generateUkrainianApartment(25, -50, 6);
        generateUkrainianApartment(-15, -58, 5);
        generateUkrainianApartment(12, -58, 5);
        generateUkrainianApartment(-48, -15, 5);
        generateUkrainianApartment(42, -15, 5);
        generateLighthouse(30, 25);                // Vorontsov Lighthouse (Black Sea harbor)
        generateChurch(-22, -5);                   // Odessa Cathedral (Preobrazhensky)
        generateChurch(20, 8);                     // Assumption Church
        generateTrainStation(-30, 30);             // Odessa Central Station (Moorish style)
        generatePortCrane(40, 15);                 // Commercial Port of Odessa crane
        generatePortCrane(45, 5);
        generateNavalBarracks(-35, -30);           // Black Sea Fleet (former) base
        generateBridge(-5, 35, 25, 3);             // Odessa harbor viaduct
        generateIndustrialComplex(-38, -42);       // Port freight terminal
        generateGrainSilo(-42, -22);               // Odessa grain export terminal
        generateWaterTower(40, -35);
        generatePowerLines(0, 0, 4);
        generateBurningRuin(-18, -22);
        generateBurningRuin(15, 20);
        generateBurningRuin(35, -30);
        generateWreckedCar(-8, -35);
        generateWreckedCar(5, -40);
        generateWreckedConvoy(-30, 18);
        generateCraters(8);
        generateAntiAirPosition(-35, 35);          // Patriot/NASAMS batteries
        generateAntiAirPosition(32, -35);
        generateBunker(-20, 22);
        generateBunker(18, -22);
        generateCheckpoint(0, 48, false);
        generateDroneNest(48, 48);
        generateDroneNest(-48, -48);
        generateDroneNest(0, 48);
      } else if (cityName === 'Zaporizhzhia') {
        // Zaporizhzhia — industrial city, Europe's largest NPP nearby (occupied by Russia)
        // The ZNPP (Enerhodar) is 50km south; city itself was bombarded nightly in 2022
        generateZaporizhzhiaNPP(0, 0);             // ZNPP — 6 reactor units (iconic site)
        generateCoolingTower(-30, -20);            // NPP cooling towers (pair)
        generateCoolingTower(30, -20);
        generateIndustrialComplex(-20, -30);       // Zaporizhstal steel plant
        generateIndustrialComplex(20, 25);         // Motor Sich aircraft engine plant
        generateIndustrialComplex(-35, 18);        // Dniprospetsstal specialty steel
        generateUkrainianApartment(-40, -38, 12);  // Zaporizhzhia city residential blocks
        generateUkrainianApartment(-40, -58, 9);
        generateUkrainianApartment(28, -40, 9);
        generateUkrainianApartment(28, -58, 6);
        generateUkrainianApartment(-20, -68, 6);
        generateUkrainianApartment(15, -68, 6);
        generateUkrainianApartment(-48, -15, 5);
        generateUkrainianApartment(40, -18, 5);
        generateSovietAdminBuilding(0, -22);       // City hall (Maydan Nezalezhnosti sq.)
        generateChurch(-25, -8);
        generateChurch(22, 5);
        generateBridge(0, 30, 40, 5);              // Dnieper river bridge (Preobrazhensky Bri.)
        generateCollapsedBridge(15, 35);           // Road closure for NPP security zone
        generateTrainStation(-30, 35);
        generateRailway(-15, 20, 40, false);
        generateGrainSilo(-38, -42);
        generateWaterTower(38, 30);
        generatePowerLines(0, 0, 6);
        generateArtilleryBattery(-40, -50);
        generateArtilleryBattery(38, 42);
        generateAntiAirPosition(-32, 38);
        generateAntiAirPosition(30, -38);
        generateBunker(-18, 18);
        generateBunker(18, -18);
        generateCheckpoint(0, 50, false);
        generateBurningRuin(-22, -22);
        generateBurningRuin(18, 20);
        generateBurningRuin(35, -30);
        generateWreckedTank(-15, -28);
        generateWreckedConvoy(35, 22);
        generateCraters(10);
        generateDroneNest(48, 48);
        generateDroneNest(-48, -48);
        generateDroneNest(48, -48);
        generateDroneNest(-48, 48);
      } else if (cityName === 'Mykolaiv') {
        // Mykolaiv — shipbuilding city on Southern Bug River; shelled nightly March–Nov 2022
        // Famous for: Black Sea Shipbuilding Plant, destroyed Mykolaiv Region Administration (direct hit)
        generateMykolaivShipyard(0, 0);            // BSZ Black Sea Shipbuilding Plant
        generatePortCrane(20, -10);                // Shipyard gantry crane
        generatePortCrane(28, -5);
        generateNavalBarracks(-25, -30);           // Naval base (77th Naval Brigade)
        generateSubmarineDock(-15, -45);           // Ship construction drydock
        generateLuxuryVilla(-5, -15, 12, 10);     // Mykolaiv Oblast Administration (crater+facade blown)
        generateLuxuryVilla(12, -18, 10, 8);      // City Hall (Mayor Kim's HQ)
        generateUkrainianApartment(-30, -30, 9);
        generateUkrainianApartment(-30, -50, 6);
        generateUkrainianApartment(22, -32, 9);
        generateUkrainianApartment(22, -50, 6);
        generateUkrainianApartment(-15, -60, 5);
        generateUkrainianApartment(12, -60, 5);
        generateUkrainianApartment(-48, -12, 5);
        generateUkrainianApartment(42, -15, 5);
        generateChurch(-22, -5);                   // Mykolaiv Cathedral
        generateChurch(20, 8);
        generateBridge(0, 25, 35, 5);             // Inhulska crossing (Southern Bug)
        generateTrainStation(-32, 28);
        generateRailway(-18, 15, 40, false);
        generateGrainSilo(-38, -22);               // Grain port (Southern Ukraine grain hub)
        generateGrainSilo(35, -25);
        generateIndustrialComplex(-35, -38);       // Mykolaiv engine plant
        generateWaterTower(40, 20);
        generatePowerLines(0, 0, 4);
        generateArtilleryBattery(-40, -45);
        generateArtilleryBattery(38, 40);
        generateAntiAirPosition(-30, 35);
        generateAntiAirPosition(28, -35);
        generateBunker(-18, 18);
        generateBunker(18, -18);
        generateBurningRuin(-20, -20);
        generateBurningRuin(15, 18);
        generateBurningRuin(-38, -30);
        generateBurningRuin(35, -28);
        generateWreckedTank(-12, -25);
        generateWreckedAPC(18, 12);
        generateWreckedConvoy(-35, 20);
        generateCraters(10);
        generateDroneNest(48, 48);
        generateDroneNest(-48, -48);
        generateDroneNest(48, -48);
        generateDroneNest(-48, 48);
      } else {
        // Generic proc city (Mariupol/Vuhledar repeats, or any future addition)
        generateUkrainianApartment(-25, -25, 6);
        generateUkrainianApartment(-25, -45, 6);
        generateUkrainianApartment(20, -28, 6);
        generateUkrainianApartment(20, -48, 6);
        generateUkrainianApartment(-15, -55, 5);
        generateUkrainianApartment(12, -55, 5);
        generateUkrainianApartment(-45, -10, 5);
        generateUkrainianApartment(38, -10, 5);
        generateSovietAdminBuilding(0, -20);
        generateChurch(-22, -5);
        generateChurch(20, 8);
        generateTrainStation(30, 30);
        generateWaterTower(-35, 28);
        generateIndustrialComplex(-30, -30);
        generateIndustrialComplex(28, -30);
        generateGrainSilo(35, -18);
        generateAmmoDepot(-28, 10);
        generateBunker(-20, 20);
        generateBunker(20, -20);
        generateTrenchNetwork(-15, 15);
        generateTrenchNetwork(15, -15);
        generateBurningRuin(-18, -18);
        generateBurningRuin(18, 18);
        generateWreckedTank(-12, -22);
        generateWreckedAPC(18, 15);
        generateDroneNest(45, 45);
        generateDroneNest(-45, -45);
        generateDroneNest(45, -45);
        generateDroneNest(-45, 45);
      }
    }

    // ── War-zone ruined homes & commercial buildings (every stage) ──
    // Real Ukraine war reference: Mariupol, Bakhmut, Avdiivka districts
    // after months of bombardment — partial walls, blown roofs, exposed
    // rebar, smashed shopfronts, rubble piles, scorched ruins, fire pockets.
    try {
      generateWarZoneRuins({
        homes:      18 + Math.floor(Math.random() * 8),
        commercial:  8 + Math.floor(Math.random() * 6),
      });
    } catch (e) { console.warn('warZoneRuins generation skipped:', e); }
    // Ruined military + civilian vehicles scattered + 2 ambushed convoys.
    // Real Ukraine reference: shattered armoured columns near Hostomel,
    // burnt marshrutky and ambulances near Bakhmut, civilian wrecks on
    // every approach road.
    try {
      generateDestroyedVehicles(14 + Math.floor(Math.random() * 8));
      // Ambushed convoy clusters along axis lines (off-road)
      for (let c = 0; c < 2; c++) {
        const cx = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.7);
        const cz = Math.floor((Math.random() - 0.5) * WORLD_CHUNKS * CHUNK_SIZE * 0.7);
        if (getTerrainHeight(cx, cz) > 0) generateWreckedConvoy(cx, cz);
      }
    } catch (e) { console.warn('destroyedVehicles generation skipped:', e); }
    rebuildAll();
    _levelSpawnPoint = resolveLevelSpawnPoint(level);
    return level;
  }

  function dispose() {
    // Dispose all chunk meshes/materials
    for (const chunk of chunks.values()) {
      if (chunk.mesh && chunk.mesh.geometry) chunk.mesh.geometry.dispose();
      if (chunk.mesh && chunk.mesh.material) chunk.mesh.material.dispose();
      if (chunk.waterMesh && chunk.waterMesh.geometry) chunk.waterMesh.geometry.dispose();
      if (chunk.waterMesh && chunk.waterMesh.material) chunk.waterMesh.material.dispose();
    }
    chunks.clear();
  }

  /* ── Public API ──────────────────────────────────────────────────── */

  // (Removed duplicate return block)
  return {
    BLOCK,
    BLOCK_COLORS,
    BLOCK_HARDNESS,
    CHUNK_SIZE,
    CHUNK_HEIGHT,
    BLOCK_SIZE,
    THEMES,
    init: typeof init === 'function' ? init : function () {},
    regenerate: typeof regenerate === 'function' ? regenerate : function () {},
    dispose: typeof dispose === 'function' ? dispose : function () {},
    setTheme: typeof setTheme === 'function' ? setTheme : function () {},
    getTheme: typeof getTheme === 'function' ? getTheme : function () { return THEMES.grassland; },
    getBlock: typeof getBlock === 'function' ? getBlock : function () { return BLOCK.AIR; },
    setBlock: typeof setBlock === 'function' ? setBlock : function () { return false; },
    getTerrainHeight: typeof getTerrainHeight === 'function' ? getTerrainHeight : function () { return 0; },
    getTopSolidY: typeof getTopSolidY === 'function' ? getTopSolidY : function (x, z) { return (typeof getTerrainHeight === 'function' ? getTerrainHeight(x, z) : 0) + 1; },
    raycastBlock: typeof raycastBlock === 'function' ? raycastBlock : function () { return null; },
    updateDirtyChunks: typeof updateDirtyChunks === 'function' ? updateDirtyChunks : function () {},
    rebuildAll: typeof rebuildAll === 'function' ? rebuildAll : function () {},
    scatterResources,
    worldToChunk,
    getLevelDef,
    getSpawnPoint,
    generateLevel: typeof generateLevel === 'function' ? generateLevel : function () { return null; },
    getRoadWaypoints: function () { return _roadWaypoints.slice(); },
    getDroneNestPositions: function () { return _droneNestPositions.slice(); },
    getBuildings: function () { return _buildings.slice(); },
    spawnVehicle,
    updateVehicles,
    getActiveVehicles,
    clearVehicles,
    placeDugout: typeof placeDugout === 'function' ? placeDugout : function () { return null; },
    isSolid: typeof isSolid === 'function' ? isSolid : function () { return false; },
    // Cover degradation
    damageBlock: damageBlock,
    updateCoverDegradation: updateCoverDegradation,
    getBlockDamageRatio: getBlockDamageRatio,
  };

})();


// Ensure isSolid is always exported to window, even if VoxelWorld is not yet defined
if (typeof window !== 'undefined') {
  // If VoxelWorld is defined, use its isSolid; otherwise, fallback to the local isSolid
  window.isSolid = (window.VoxelWorld && window.VoxelWorld.isSolid) ? window.VoxelWorld.isSolid : function () { return false; };
}




// --- GUARANTEED GLOBAL EXPORTS: BLOCK and isSolid ---
// These must be assigned AFTER the VoxelWorld IIFE is fully defined
if (typeof window !== 'undefined' && window.VoxelWorld) {
  window.BLOCK = window.VoxelWorld.BLOCK;
  window.isSolid = window.VoxelWorld.isSolid;
}







