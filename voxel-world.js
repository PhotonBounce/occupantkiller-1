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
    { id: 'AVDIIVKA',  name: 'Avdiivka Industrial Zone', desc: 'Hold the coking plant',  theme: 'urban',     wavesPerLevel: 7, difficulty: 1.3, fogColor: 0x3a3028 },
    { id: 'BAKHMUT',   name: 'Bakhmut Ruins',        desc: 'Defend the city',             theme: 'urban',     wavesPerLevel: 7, difficulty: 1.6, fogColor: 0x2a2a2a },
    { id: 'KHERSON',   name: 'Kherson Bridgehead',   desc: 'Cross the Dnipro',            theme: 'grassland', wavesPerLevel: 7, difficulty: 1.9, fogColor: 0xD4A017 },
    { id: 'MARIUPOL',  name: 'Mariupol Steelworks',  desc: 'Fight through Azovstal',      theme: 'industrial', wavesPerLevel: 7, difficulty: 2.2, fogColor: 0x1a1a20 },
    { id: 'CRIMEA',    name: 'Crimea Bridge',        desc: 'Cut the supply line',         theme: 'coastal',   wavesPerLevel: 7, difficulty: 2.5, fogColor: 0x5577aa },
    { id: 'CHORNOBYL', name: 'Chornobyl Zone',       desc: 'Irradiated exclusion zone',   theme: 'wasteland', wavesPerLevel: 7, difficulty: 2.8, fogColor: 0x3a3520 },
    { id: 'MOSCOW',    name: 'Moscow Finale',        desc: 'End it at the Kremlin',       theme: 'cityscape', wavesPerLevel: 9, difficulty: 3.5, fogColor: 0x222228 },
    { id: 'SEVASTOPOL', name: 'Sevastopol Naval Base', desc: 'Destroy the Black Sea Fleet', theme: 'coastal',  wavesPerLevel: 7, difficulty: 3.8, fogColor: 0x3355aa },
    { id: 'DONBAS',    name: 'Donbas Final Push',     desc: 'Liberate the last stronghold', theme: 'urban',   wavesPerLevel: 8, difficulty: 4.2, fogColor: 0x2a2020 },
    { id: 'BELGOROD',  name: 'Belgorod Offensive',    desc: 'Cross into enemy territory',   theme: 'grassland', wavesPerLevel: 8, difficulty: 4.6, fogColor: 0xD4A017 },
    { id: 'KREMLIN',   name: 'Kremlin Showdown',      desc: 'The final battle for peace',   theme: 'cityscape', wavesPerLevel: 10, difficulty: 5.0, fogColor: 0x111118 },
    { id: 'KYIV',      name: 'Siege of Kyiv',         desc: 'Ambush the Russian armored convoy', theme: 'urban', wavesPerLevel: 8, difficulty: 1.5, fogColor: 0x6a7080, tankFocus: true, spawnCandidates: [{ x: 0, z: -24 }, { x: -8, z: -24 }, { x: 8, z: -24 }, { x: -4, z: -28 }, { x: 4, z: -28 }], spawnLookTarget: { x: 0, z: 22 } },
    { id: 'SNAKE',     name: 'Snake Island Defense',  desc: '"Russian warship, go fuck yourself."', theme: 'coastal', wavesPerLevel: 6, difficulty: 1.4, fogColor: 0x4a6680 },
    { id: 'SAKY',      name: 'Saky Airbase Strike',   desc: 'Crimea airbase — ground every Su-24', theme: 'coastal', wavesPerLevel: 7, difficulty: 1.7, fogColor: 0x886644 },
    { id: 'VUHLEDAR',  name: 'Vuhledar Tank Graveyard', desc: 'Bury the 155th in the minefield', theme: 'wasteland', wavesPerLevel: 8, difficulty: 1.9, fogColor: 0x4a4030, tankFocus: true },
    { id: 'ANTONOV',   name: 'Antonov Bridge Strike', desc: 'HIMARS the supply line into Kherson', theme: 'urban', wavesPerLevel: 7, difficulty: 2.0, fogColor: 0x556677 },
    { id: 'REFINERY',  name: 'Refinery Strike (FPV)', desc: 'Fly an FPV drone into the oil refinery', theme: 'industrial', wavesPerLevel: 1, difficulty: 1.6, fogColor: 0x2a2620, droneOnly: true, spawnCandidates: [{ x: 0, z: 50 }], spawnLookTarget: { x: 0, z: 0 } },
  ];

  const PROC_CITIES = ['Mariupol','Severodonetsk','Lysychansk','Bucha','Irpin','Izium','Kupyansk','Robotyne','Vuhledar'];

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
    } else if (level.id === 'KYIV') {
      // Real-map recreation: Maidan Nezalezhnosti / Khreshchatyk approach
      // where Russian armored columns were stopped on the road into Kyiv
      generateKyivMaidanSquare(0, 0);
      generateKyivCityExtension(0, 0);
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
    } else if (level.id === 'CHORNOBYL') {
      // Chornobyl Exclusion Zone — 30km dead zone, ghost city of Pripyat, irradiated reactor
      // Reactor No. 4 / New Safe Confinement area (center)
      generateIndustrialComplex(0, 0);          // Reactor building (scaled)
      generateIndustrialComplex(-12, 8);        // Turbine hall
      generateIndustrialComplex(12, -8);        // Reactor 3 (sister unit)
      generateCommTower(0, -20);               // Chornobyl TV tower
      generateRadarTower(-20, -15);            // Duga radar (massive over-horizon)
      generateRadarTower(20, -15);             // Second Duga mast
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
      // Amusement park (never opened — famous for rusty Ferris wheel)
      generateWatchtower(18, 25);               // Ferris wheel (scaled as watchtower)
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
      // ── MOSCOW OUTSKIRTS — real street grid density ──────────────────────
      // Based on Moscow's concentric ring road layout:
      //   Center: Red Square / government buildings
      //   Inner ring: Sadovoye Koltso (~Boulevard Ring, radius ~20)
      //   Outer ring: TTK / Third Ring Road (radius ~40)
      //
      // Building types used:
      //   generateUkrainianApartment = Soviet 9-story khrushchevka/stalinka blocks
      //   generateApartmentBlock     = standard 5-story residential
      //   generateLuxuryVilla        = government/prestige office buildings
      //   generateIndustrialComplex  = factory/logistics (outer ring)
      //   generateChurch             = orthodox churches (authentic Moscow)
      //   generateWaterTower         = district water towers
      //   generateBillboard          = propaganda/military billboards
      //   generateCommTower          = Ostankino-style antenna mast
      //   generateRoadNetwork        = street grid between blocks
      //
      // ── INNER RING (Sadovoye Koltso, radius 20-30) ────────────────────
      // North axis — major arterial road (like Tverskaya St)
      generateUkrainianApartment(-10, -22, 12);  // tall stalinka flanking Tverskaya
      generateUkrainianApartment(10, -22, 12);
      generateUkrainianApartment(-10, 22, 10);
      generateUkrainianApartment(10, 22, 10);
      // East/West axis (like Novy Arbat / Kutuzovsky)
      generateUkrainianApartment(-22, -10, 11);
      generateUkrainianApartment(-22, 10, 9);
      generateUkrainianApartment(22, -10, 11);
      generateUkrainianApartment(22, 10, 9);
      // Diagonal blocks (filling in the quarter-grid)
      generateApartmentBlock(-16, -16, 5);
      generateApartmentBlock(16, -16, 5);
      generateApartmentBlock(-16, 16, 5);
      generateApartmentBlock(16, 16, 5);
      // Central government district (south of Red Square)
      generateLuxuryVilla(-8, -5, 12, 8);    // Federal ministry bloc
      generateLuxuryVilla(8, -5, 10, 8);     // State Duma-adjacent
      generateLuxuryVilla(0, -18, 14, 10);   // GUM-sized government building
      // Orthodox churches (authentic Moscow — one per district block)
      generateChurch(-25, -5);    // Khram Khrista Spasitelya area
      generateChurch(25, 5);      // Kremlin area church
      generateChurch(5, 28);      // Eastern orthodox parish
      generateChurch(-5, -28);    // South district
      // Water tower + comm infrastructure
      generateWaterTower(-28, -25);
      generateWaterTower(28, 25);
      generateCommTower(0, 0);    // Red Square comm mast

      // ── OUTER RING (TTK / Third Ring Road, radius 30-48) ────────────────
      // Soviet-era khrushchevka residential estates (microrayons)
      generateUkrainianApartment(-35, -20, 9);
      generateUkrainianApartment(-35, 0, 9);
      generateUkrainianApartment(-35, 20, 9);
      generateUkrainianApartment(35, -20, 9);
      generateUkrainianApartment(35, 0, 9);
      generateUkrainianApartment(35, 20, 9);
      generateUkrainianApartment(-20, -35, 9);
      generateUkrainianApartment(0, -35, 9);
      generateUkrainianApartment(20, -35, 9);
      generateUkrainianApartment(-20, 35, 9);
      generateUkrainianApartment(0, 35, 9);
      generateUkrainianApartment(20, 35, 9);
      // Industrial nodes on outer ring (Baumanskiy / Lyublino industrial areas)
      generateIndustrialComplex(-42, -42);
      generateIndustrialComplex(42, 42);
      generateIndustrialComplex(-42, 42);
      // Billboard grid (military propaganda / Z-symbols)
      generateBillboard(-18, -30);
      generateBillboard(18, -30);
      generateBillboard(-30, 18);
      generateBillboard(30, -18);
      generateBillboard(0, -40);
      generateBillboard(40, 0);

      // ── MILITARY FORTIFICATION RING (defending Moscow) ─────────────────
      // Checkpoints on all 4 main approach roads
      generateCheckpoint(0, 44, false);    // North highway (Leningradskoye Sh.)
      generateCheckpoint(0, -44, false);   // South (Kashirskoye Sh.)
      generateCheckpoint(44, 0, true);     // East (Entuziastov Sh.)
      generateCheckpoint(-44, 0, true);    // West (Kutuzovsky)
      // Russian National Guard defensive positions (inner perimeter)
      generateDefensivePosition(-30, 0);
      generateDefensivePosition(30, 0);
      generateDefensivePosition(0, -30);
      generateDefensivePosition(0, 30);
      generateDefensivePosition(-22, -22);
      generateDefensivePosition(22, 22);
      // Anti-air positions (S-300/S-400 batteries on city outskirts)
      generateAntiAirPosition(-40, 20);
      generateAntiAirPosition(40, -20);
      generateAntiAirPosition(20, 40);
      generateAntiAirPosition(-20, -40);
      // Barricades blocking major roads (improvised Russian city defence)
      generateBarbedWire(0, 0, 25, true);
      generateBarbedWire(0, 0, 25, false);
      generateAntiTankHedgehogs(18);
      // Artillery + ammo
      generateArtilleryBattery(40, 40);
      generateArtilleryBattery(-40, -40);
      generateAmmoDepot(32, -32);
      generateAmmoDepot(-32, 32);
      // Burned/wrecked military vehicles on main streets
      generateWreckedTank(-12, -28);
      generateWreckedTank(14, 26);
      generateWreckedAPC(-28, 14);
      generateWreckedConvoy(28, -14);
      generateBurningRuin(-18, -40);
      generateBurningRuin(20, 38);
      // Drone nests at all 4 outer corners
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
    } else if (level.id === 'DONBAS') {
      // Donbas final push — mining heartland, trench warfare, urban fringe towns
      // Industrial core: coal mines, salt mines, slag heaps
      generateSaltMine(30, -30);          // Soledar salt mine (Putin's prize)
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
    } else if (level.id === 'KREMLIN') {
      // KREMLIN SHOWDOWN — Final stage. The full Red Square / Moscow city center under assault.
      // The zombie president boss spawns from inside the Kremlin palace.
      generateKremlinPalace(0, 0);
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
      generateUkrainianApartment(0, 48, 10);
      // Orthodox churches (Moscow has many — Kremlin grounds have Assumption Cathedral etc.)
      generateChurch(-22, 20);                // Assumption Cathedral (within Kremlin)
      generateChurch(22, 20);                 // Archangel Cathedral
      generateChurch(-38, -15);              // Church of St. George (outer)
      generateChurch(38, -15);               // Cathedral of Christ the Saviour area
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
      generateDefensivePosition(0, 40);
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
      generateCommTower(0, 0);          // Strategic comms relay (reason Russia wanted it)
      generateCommTower(8, 12);         // Backup antenna mast
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
    } else if (level.id === 'SAKY') {
      // Saky Airbase, Crimea — Russia's largest military air base in Crimea
      // Ukraine struck this in August 2022 — Su-24, Su-30 fighters destroyed on ground
      generateRunway(0, 0, 80, 10);           // Main runway 2100m (scaled)
      generateRunway(-10, 30, 50, 6);         // Secondary taxiway
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







