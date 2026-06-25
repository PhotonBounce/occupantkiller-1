window.GuernseyIsland = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 22440;
    var OY = 0;
    var OZ = 0;

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return mesh;
    }

    function addMesh(geo, color, x, y, z) {
        var mesh = makeMesh(geo, color, x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addMeshRot(geo, color, x, y, z, rx, ry, rz) {
        var mesh = makeMesh(geo, color, x, y, z);
        mesh.rotation.set(rx, ry, rz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildTerrain();
        buildSea();
        buildCastleCornet();
        buildStPeterPort();
        buildHauteville();
        buildGermanFortifications();
        buildGuernseyMuseum();
        buildLittleChapel();
        buildRocquaineBay();
        buildGreenhouses();
        buildValeCastle();
        buildLihouIsland();
    }

    // ---- Terrain base ----
    function buildTerrain() {
        // Main island body (flat box approximation)
        addMesh(new THREE.BoxGeometry(420, 8, 320), 0x5A8A3C, 0, -4, 0);
        // Cliff edges west
        addMesh(new THREE.BoxGeometry(12, 30, 280), 0x8B7355, -208, 5, 0);
        // Cliff edges south
        addMesh(new THREE.BoxGeometry(380, 22, 10), 0x8B7355, 0, 1, 158);
        // Cliff edges north
        addMesh(new THREE.BoxGeometry(380, 18, 10), 0x8B7355, 0, 1, -158);
        // Inland hills east
        addMesh(new THREE.BoxGeometry(80, 18, 70), 0x4A7A2C, 140, 5, -40);
        addMesh(new THREE.BoxGeometry(60, 12, 50), 0x4A7A2C, 90, 4, 50);
        // Coastal shelf east (St Peter Port side)
        addMesh(new THREE.BoxGeometry(40, 6, 160), 0x6A9A4C, 185, -1, 0);
    }

    // ---- Sea / harbour water ----
    function buildSea() {
        // Main sea east of island (St Peter Port harbour)
        addMesh(new THREE.BoxGeometry(180, 2, 320), 0x006994, 300, -3, 0);
        // Little Russell channel
        addMesh(new THREE.BoxGeometry(60, 2, 200), 0x005580, 280, -3, -60);
        // West coast sea
        addMesh(new THREE.BoxGeometry(120, 2, 320), 0x006994, -270, -3, 0);
        // Rocquaine Bay water (south-west)
        addMesh(new THREE.BoxGeometry(140, 2, 80), 0x006994, -220, -2, 110);
        // Harbour inner (calm blue-green)
        addMesh(new THREE.BoxGeometry(60, 2, 80), 0x008B8B, 218, -2, 30);
    }

    // ---- Castle Cornet ----
    function buildCastleCornet() {
        var cx = 220, cz = 20;
        // Tidal islet base
        addMesh(new THREE.BoxGeometry(36, 6, 36), 0x9B8B6B, cx, -1, cz);
        // Curtain wall north
        addMesh(new THREE.BoxGeometry(36, 12, 3), 0x888888, cx, 7, cz - 17);
        // Curtain wall south
        addMesh(new THREE.BoxGeometry(36, 12, 3), 0x888888, cx, 7, cz + 17);
        // Curtain wall west
        addMesh(new THREE.BoxGeometry(3, 12, 34), 0x888888, cx - 17, 7, cz);
        // Curtain wall east
        addMesh(new THREE.BoxGeometry(3, 12, 34), 0x888888, cx + 17, 7, cz);
        // Main keep tower
        addMesh(new THREE.BoxGeometry(10, 26, 10), 0x888888, cx - 5, 10, cz - 5);
        // Keep battlements top
        addMesh(new THREE.BoxGeometry(12, 3, 12), 0x777777, cx - 5, 24, cz - 5);
        // Corner tower NW
        addMesh(new THREE.CylinderGeometry(3, 3.5, 20, 8), 0x888888, cx - 16, 8, cz - 16);
        // Corner tower NE
        addMesh(new THREE.CylinderGeometry(3, 3.5, 20, 8), 0x888888, cx + 16, 8, cz - 16);
        // Corner tower SW
        addMesh(new THREE.CylinderGeometry(3, 3.5, 20, 8), 0x888888, cx - 16, 8, cz + 16);
        // Corner tower SE
        addMesh(new THREE.CylinderGeometry(3, 3.5, 20, 8), 0x888888, cx + 16, 8, cz + 16);
        // Gatehouse
        addMesh(new THREE.BoxGeometry(8, 14, 6), 0x777777, cx, 5, cz + 14);
        // Causeway to mainland
        addMesh(new THREE.BoxGeometry(24, 2, 5), 0x9B8B6B, cx - 28, -1, cz);
        // Inner courtyard surface
        addMesh(new THREE.BoxGeometry(28, 1, 28), 0xAA9977, cx, 2, cz);
        // Magazine building inside
        addMesh(new THREE.BoxGeometry(8, 5, 6), 0x888888, cx + 4, 3, cz + 4);
    }

    // ---- St Peter Port ----
    function buildStPeterPort() {
        var px = 170, pz = 10;
        // Town Church (Victorian) main body
        addMesh(new THREE.BoxGeometry(14, 20, 30), 0xD4C8A0, px, 8, pz);
        // Church tower
        addMesh(new THREE.BoxGeometry(7, 36, 7), 0xC8BC94, px - 6, 16, pz - 10);
        // Church spire
        addMesh(new THREE.ConeGeometry(4, 14, 4), 0xB8AC84, px - 6, 38, pz - 10);
        // Harbour front row buildings
        addMesh(new THREE.BoxGeometry(10, 14, 8), 0xD4C8A0, px + 10, 5, pz - 20);
        addMesh(new THREE.BoxGeometry(10, 16, 8), 0xCCC0A0, px + 20, 6, pz - 20);
        addMesh(new THREE.BoxGeometry(10, 12, 8), 0xD4C8A0, px + 30, 4, pz - 20);
        addMesh(new THREE.BoxGeometry(10, 18, 8), 0xBEB29C, px + 40, 7, pz - 20);
        // Second row up the cliff
        addMesh(new THREE.BoxGeometry(12, 14, 8), 0xD4C8A0, px + 5, 9, pz - 5);
        addMesh(new THREE.BoxGeometry(12, 16, 8), 0xC8BC9C, px + 18, 9, pz - 5);
        addMesh(new THREE.BoxGeometry(12, 13, 8), 0xD4C8A0, px + 31, 9, pz - 5);
        // Cliff road terrace
        addMesh(new THREE.BoxGeometry(80, 2, 5), 0xB8B0A0, px + 18, 3, pz - 14);
        // Harbour wall / quay
        addMesh(new THREE.BoxGeometry(90, 5, 4), 0xAAA090, px + 18, 0, pz - 28);
        // Harbour steps
        addMesh(new THREE.BoxGeometry(8, 6, 8), 0xB8B0A0, px + 12, 0, pz - 24);
        // Market building
        addMesh(new THREE.BoxGeometry(20, 12, 15), 0xD4C8A0, px - 5, 4, pz + 20);
        // Market colonnade pillars
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 10, 6), 0xCCBBA0, px - 12, 3, pz + 14);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 10, 6), 0xCCBBA0, px - 8, 3, pz + 14);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 10, 6), 0xCCBBA0, px - 4, 3, pz + 14);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 10, 6), 0xCCBBA0, px, 3, pz + 14);
        // Cobbled street (represented as low box)
        addMesh(new THREE.BoxGeometry(5, 1, 40), 0x9A9080, px - 2, 1, pz);
        addMesh(new THREE.BoxGeometry(5, 1, 30), 0x9A9080, px + 8, 1, pz + 5);
        // Lighthouse at harbour entrance
        addMesh(new THREE.CylinderGeometry(2, 2.5, 22, 8), 0xFFFFEE, px + 55, 9, pz - 22);
        addMesh(new THREE.CylinderGeometry(3, 3, 2, 8), 0xDD2222, px + 55, 21, pz - 22);
    }

    // ---- Hauteville House (Victor Hugo) ----
    function buildHauteville() {
        var hx = 140, hz = -30;
        // Main house body — tall Georgian/Victorian terrace
        addMesh(new THREE.BoxGeometry(14, 22, 10), 0xD4C8A0, hx, 9, hz);
        // Top storey lookout (glass room / crystal room)
        addMesh(new THREE.BoxGeometry(12, 5, 8), 0x88CCFF, hx, 21, hz);
        // Roof
        addMesh(new THREE.BoxGeometry(15, 3, 11), 0xAA9977, hx, 24, hz);
        // Garden wall
        addMesh(new THREE.BoxGeometry(22, 4, 2), 0xBBAA88, hx, 0, hz + 8);
        addMesh(new THREE.BoxGeometry(2, 4, 16), 0xBBAA88, hx - 10, 0, hz + 1);
        // Garden trees (green spheres)
        addMesh(new THREE.SphereGeometry(3, 6, 6), 0x2D6B2D, hx - 6, 6, hz + 12);
        addMesh(new THREE.SphereGeometry(2.5, 6, 6), 0x2D6B2D, hx + 4, 5, hz + 12);
        // Nearby terrace house
        addMesh(new THREE.BoxGeometry(12, 18, 10), 0xCFC3A0, hx + 16, 7, hz);
    }

    // ---- German WWII Fortifications ----
    function buildGermanFortifications() {
        // Bunker 1 — north coast gun emplacement
        var b1x = -60, b1z = -130;
        addMesh(new THREE.BoxGeometry(18, 5, 14), 0x666666, b1x, 1, b1z);
        addMesh(new THREE.BoxGeometry(20, 2, 16), 0x555555, b1x, 5, b1z);
        addMesh(new THREE.CylinderGeometry(5, 5, 3, 8), 0x666666, b1x, 5, b1z);
        // Gun barrel
        addMeshRot(new THREE.CylinderGeometry(0.6, 0.6, 14, 6), 0x444444, b1x + 5, 7, b1z, 0, 0, Math.PI / 2);

        // Bunker 2 — west coast observation tower
        var b2x = -190, b2z = 0;
        addMesh(new THREE.BoxGeometry(8, 18, 8), 0x666666, b2x, 7, b2z);
        addMesh(new THREE.BoxGeometry(10, 2, 10), 0x555555, b2x, 17, b2z);
        // Observation slit
        addMesh(new THREE.BoxGeometry(6, 1, 1), 0x333333, b2x, 14, b2z - 5);

        // Bunker 3 — south coast artillery casemate
        var b3x = 20, b3z = 145;
        addMesh(new THREE.BoxGeometry(22, 6, 16), 0x666666, b3x, 1, b3z);
        addMesh(new THREE.BoxGeometry(24, 2, 18), 0x555555, b3x, 6, b3z);
        addMesh(new THREE.BoxGeometry(8, 4, 4), 0x555555, b3x + 10, 3, b3z - 6);

        // Underground entrance tunnel entrance
        addMesh(new THREE.BoxGeometry(6, 5, 4), 0x444444, b3x - 6, 1, b3z - 10);

        // Anti-tank wall segments
        addMesh(new THREE.BoxGeometry(40, 4, 3), 0x666666, -80, 0, 148);
        addMesh(new THREE.BoxGeometry(3, 4, 30), 0x666666, -100, 0, 133);

        // Todt bunker (larger command post)
        var btx = -30, btz = -100;
        addMesh(new THREE.BoxGeometry(24, 8, 20), 0x666666, btx, 2, btz);
        addMesh(new THREE.BoxGeometry(26, 2, 22), 0x555555, btx, 8, btz);
        addMesh(new THREE.BoxGeometry(10, 6, 8), 0x666666, btx + 14, 2, btz + 6);
    }

    // ---- Guernsey Museum at Candie Gardens ----
    function buildGuernseyMuseum() {
        var mx = 100, mz = -60;
        // Main museum building (octagonal style with box approximation)
        addMesh(new THREE.BoxGeometry(24, 10, 20), 0xDEB887, mx, 3, mz);
        // Central dome
        addMesh(new THREE.SphereGeometry(8, 8, 6), 0xD2A870, mx, 14, mz);
        // Entrance portico
        addMesh(new THREE.BoxGeometry(10, 8, 6), 0xDEB887, mx, 2, mz + 13);
        // Portico columns
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 6), 0xCCAA77, mx - 3, 2, mz + 16);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 6), 0xCCAA77, mx + 3, 2, mz + 16);
        // Bandstand in Candie Gardens (Victorian cast-iron)
        addMesh(new THREE.CylinderGeometry(6, 6, 1, 8), 0x88AA66, mx - 20, 0, mz - 10);
        addMesh(new THREE.ConeGeometry(7, 5, 8), 0x667755, mx - 20, 5, mz - 10);
        // Garden paths
        addMesh(new THREE.BoxGeometry(3, 0.5, 30), 0xC8B090, mx - 10, 0.3, mz);
        addMesh(new THREE.BoxGeometry(30, 0.5, 3), 0xC8B090, mx, 0.3, mz - 10);
        // Garden trees
        addMesh(new THREE.SphereGeometry(4, 6, 6), 0x3A7A3A, mx + 16, 5, mz - 14);
        addMesh(new THREE.SphereGeometry(3.5, 6, 6), 0x3A7A3A, mx - 26, 4, mz - 14);
        // Statue plinth (Victor Hugo statue in Candie Gardens)
        addMesh(new THREE.BoxGeometry(3, 6, 3), 0xCCBB99, mx - 16, 1, mz + 8);
        addMesh(new THREE.CylinderGeometry(1, 0.8, 5, 6), 0xAA9977, mx - 16, 8, mz + 8);
    }

    // ---- Little Chapel (Les Vauxbelets) ----
    function buildLittleChapel() {
        var lx = -10, lz = 40;
        // Tiny chapel body — the smallest chapel in the world
        addMesh(new THREE.BoxGeometry(5, 4, 7), 0xF5F5DC, lx, 0, lz);
        // Shell/mosaic covering (slightly different color overlay boxes)
        addMesh(new THREE.BoxGeometry(5.2, 4.2, 7.2), 0xFFE4C4, lx, 0, lz);
        // Chapel apse (rounded end)
        addMesh(new THREE.CylinderGeometry(2.2, 2.2, 4, 8), 0xF5F5DC, lx, 0, lz - 4);
        // Bell tower (tiny)
        addMesh(new THREE.BoxGeometry(2, 5, 2), 0xF5F5DC, lx, 3, lz + 2);
        // Cross on top
        addMesh(new THREE.BoxGeometry(2, 0.4, 0.4), 0xFFFFFF, lx, 8, lz + 2);
        addMesh(new THREE.BoxGeometry(0.4, 3, 0.4), 0xFFFFFF, lx, 7, lz + 2);
        // Small arched doorway representation
        addMesh(new THREE.BoxGeometry(1.2, 2, 0.4), 0xEEDCB0, lx, 0, lz + 3.6);
        // Garden grotto wall
        addMesh(new THREE.BoxGeometry(12, 3, 2), 0xEEE8CC, lx, 0, lz + 7);
        addMesh(new THREE.BoxGeometry(2, 3, 12), 0xEEE8CC, lx + 6, 0, lz + 1);
        addMesh(new THREE.BoxGeometry(2, 3, 12), 0xEEE8CC, lx - 6, 0, lz + 1);
    }

    // ---- Rocquaine Bay & Fort Grey ----
    function buildRocquaineBay() {
        var rx = -180, rz = 110;
        // Bay beach strip
        addMesh(new THREE.BoxGeometry(100, 1, 30), 0xF4E4B0, rx, -0.5, rz - 10);
        // Fort Grey — "cup and saucer" fortress on islet
        // Islet
        addMesh(new THREE.CylinderGeometry(14, 16, 4, 10), 0x9B8B6B, rx - 30, -1, rz + 20);
        // Lower circular wall (the "saucer")
        addMesh(new THREE.CylinderGeometry(12, 12, 5, 12), 0x888880, rx - 30, 3, rz + 20);
        // Inner keep (the "cup")
        addMesh(new THREE.CylinderGeometry(6, 6, 12, 10), 0x808078, rx - 30, 7, rz + 20);
        // Keep roof/parapet
        addMesh(new THREE.CylinderGeometry(7, 7, 2, 10), 0x707068, rx - 30, 14, rz + 20);
        // Martello tower type roof detail
        addMesh(new THREE.ConeGeometry(6.5, 4, 10), 0x666660, rx - 30, 16, rz + 20);
        // Causeway to fort
        addMesh(new THREE.BoxGeometry(20, 1, 4), 0x9A9070, rx - 19, -0.5, rz + 20);
        // Coastal rocks
        addMesh(new THREE.BoxGeometry(8, 3, 6), 0x777766, rx - 50, -1, rz + 5);
        addMesh(new THREE.BoxGeometry(5, 2, 4), 0x888877, rx - 44, -1, rz + 12);
        addMesh(new THREE.SphereGeometry(3, 5, 5), 0x777766, rx - 55, -1, rz + 25);
        // Lifeboat station on shore
        addMesh(new THREE.BoxGeometry(10, 6, 8), 0xCC4444, rx + 10, 1, rz - 5);
        addMesh(new THREE.BoxGeometry(12, 2, 9), 0x994444, rx + 10, 6, rz - 5);
    }

    // ---- Guernsey Greenhouses ----
    function buildGreenhouses() {
        var gx = 60, gz = 60;
        // Greenhouse complex — long low glass structures
        // Greenhouse 1
        addMesh(new THREE.BoxGeometry(30, 5, 12), 0x88CCFF, gx, 1.5, gz);
        addMeshRot(new THREE.BoxGeometry(30, 1, 7), 0xAADDFF, gx, 4, gz - 3, -0.3, 0, 0);
        addMeshRot(new THREE.BoxGeometry(30, 1, 7), 0xAADDFF, gx, 4, gz + 3, 0.3, 0, 0);
        // Ridge beam
        addMesh(new THREE.BoxGeometry(30, 0.5, 0.5), 0xCCEEFF, gx, 4.5, gz);
        // Greenhouse 2
        addMesh(new THREE.BoxGeometry(30, 5, 12), 0x88CCFF, gx, 1.5, gz + 16);
        addMeshRot(new THREE.BoxGeometry(30, 1, 7), 0xAADDFF, gx, 4, gz + 13, -0.3, 0, 0);
        addMeshRot(new THREE.BoxGeometry(30, 1, 7), 0xAADDFF, gx, 4, gz + 19, 0.3, 0, 0);
        // Greenhouse 3 (smaller)
        addMesh(new THREE.BoxGeometry(18, 4, 10), 0x88CCFF, gx + 34, 1.5, gz + 8);
        // Boiler house
        addMesh(new THREE.BoxGeometry(8, 8, 8), 0xBB8866, gx - 20, 2, gz + 8);
        // Chimney
        addMesh(new THREE.CylinderGeometry(1, 1.2, 12, 6), 0x884444, gx - 20, 10, gz + 8);
        // Packing shed
        addMesh(new THREE.BoxGeometry(16, 7, 10), 0xCCBB88, gx + 36, 2, gz - 6);
        // Water tank on legs
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 5, 8), 0x8899AA, gx + 24, 10, gz + 2);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), 0x8899AA, gx + 22, 4, gz + 2);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), 0x8899AA, gx + 26, 4, gz + 2);
    }

    // ---- Vale Castle ----
    function buildValeCastle() {
        var vx = -20, vz = -110;
        // Clifftop base mound
        addMesh(new THREE.BoxGeometry(50, 10, 50), 0x7A8A5A, vx, 3, vz);
        // Curtain wall circuit
        addMesh(new THREE.BoxGeometry(50, 8, 3), 0xAAAAAA, vx, 11, vz - 24);
        addMesh(new THREE.BoxGeometry(50, 8, 3), 0xAAAAAA, vx, 11, vz + 24);
        addMesh(new THREE.BoxGeometry(3, 8, 48), 0xAAAAAA, vx - 24, 11, vz);
        addMesh(new THREE.BoxGeometry(3, 8, 48), 0xAAAAAA, vx + 24, 11, vz);
        // Ruined keep (partial walls)
        addMesh(new THREE.BoxGeometry(14, 16, 3), 0xAAAAAA, vx - 4, 14, vz - 10);
        addMesh(new THREE.BoxGeometry(3, 16, 10), 0xAAAAAA, vx - 10, 14, vz - 6);
        // Crumbled sections (lower)
        addMesh(new THREE.BoxGeometry(8, 6, 3), 0x999999, vx + 8, 11, vz + 10);
        // Corner towers (ruined)
        addMesh(new THREE.CylinderGeometry(3.5, 4, 14, 7), 0xAAAAAA, vx - 24, 13, vz - 24);
        addMesh(new THREE.CylinderGeometry(3.5, 4, 10, 7), 0x999999, vx + 24, 11, vz - 24);
        addMesh(new THREE.CylinderGeometry(3.5, 4, 8, 7), 0x999999, vx - 24, 11, vz + 24);
        // Chapel ruin inside
        addMesh(new THREE.BoxGeometry(8, 7, 3), 0xBBBBAA, vx + 5, 11, vz + 5);
        addMesh(new THREE.BoxGeometry(3, 7, 8), 0xBBBBAA, vx + 8, 11, vz + 2);
    }

    // ---- Lihou Island ----
    function buildLihouIsland() {
        var lx = -220, lz = -20;
        // Tidal island landmass
        addMesh(new THREE.BoxGeometry(60, 5, 50), 0x8AB55A, lx, -2, lz);
        // Rocky shore
        addMesh(new THREE.BoxGeometry(64, 3, 4), 0x776655, lx, -1, lz - 26);
        addMesh(new THREE.BoxGeometry(64, 3, 4), 0x776655, lx, -1, lz + 26);
        // Tidal causeway
        addMesh(new THREE.BoxGeometry(5, 1, 30), 0x9A8A6A, lx + 32, -2, lz);
        // Notre Dame de Lihou Priory ruins
        // Priory nave walls
        addMesh(new THREE.BoxGeometry(16, 8, 3), 0xBBAA88, lx - 5, 2, lz - 10);
        addMesh(new THREE.BoxGeometry(16, 8, 3), 0xBBAA88, lx - 5, 2, lz + 10);
        addMesh(new THREE.BoxGeometry(3, 8, 20), 0xBBAA88, lx - 12, 2, lz);
        // Chancel (partially collapsed)
        addMesh(new THREE.BoxGeometry(8, 6, 3), 0xBBAA88, lx + 5, 2, lz - 7);
        addMesh(new THREE.BoxGeometry(3, 5, 8), 0xBBAA88, lx + 8, 2, lz - 3);
        // Priory cottage (modern residence)
        addMesh(new THREE.BoxGeometry(10, 6, 8), 0xCCBB99, lx + 14, 1, lz + 12);
        addMeshRot(new THREE.BoxGeometry(11, 2, 9), 0xAA9977, lx + 14, 5, lz + 12, -0.2, 0, 0);
        // Standing stones / prehistoric site
        addMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0x998877, lx - 16, 2, lz + 18);
        addMesh(new THREE.BoxGeometry(1.5, 3, 1.5), 0x998877, lx - 20, 2, lz + 14);
        addMesh(new THREE.BoxGeometry(1.5, 5, 1.5), 0x998877, lx - 22, 2, lz + 20);
        // Seabird colony rocks
        addMesh(new THREE.SphereGeometry(4, 6, 5), 0x887766, lx - 26, -2, lz - 18);
        addMesh(new THREE.SphereGeometry(3, 6, 5), 0x887766, lx - 30, -2, lz - 10);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) {
        // Static environment — no animation needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
