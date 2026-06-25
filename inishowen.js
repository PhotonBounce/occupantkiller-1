window.Inishowen = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var turbineBlades = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        turbineBlades = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        buildTerrain();
        buildSea();
        buildMalinHead();
        buildGriananaileach();
        buildDunreeFort();
        buildCarndonagh();
        buildMalinVillage();
        buildWindFarm();
        buildPeatBogs();
        buildRoads();
        buildSeaStacks();
        buildLoughFoyle();
    }

    // --- TERRAIN BASE ---
    function buildTerrain() {
        // Main peninsula ground platform
        var geo = new THREE.BoxGeometry(3200, 18, 2400);
        makeMesh(geo, 0x4a6741, 18160, -9, 0);

        // Highland interior rolling hills - stacked box hills
        var hillGeo1 = new THREE.BoxGeometry(400, 80, 300);
        makeMesh(hillGeo1, 0x3d5c35, 17800, 40, -300);

        var hillGeo2 = new THREE.BoxGeometry(350, 100, 280);
        makeMesh(hillGeo2, 0x3d5c35, 18100, 50, 200);

        var hillGeo3 = new THREE.BoxGeometry(500, 120, 400);
        makeMesh(hillGeo3, 0x3d5c35, 18500, 60, -100);

        var hillGeo4 = new THREE.BoxGeometry(300, 60, 250);
        makeMesh(hillGeo4, 0x4a6741, 17400, 30, 400);

        var hillGeo5 = new THREE.BoxGeometry(420, 90, 320);
        makeMesh(hillGeo5, 0x3d5c35, 18900, 45, 300);

        // Urris Hills mass
        var urrisBase = new THREE.BoxGeometry(600, 150, 500);
        makeMesh(urrisBase, 0x3d5c35, 17200, 75, -600);

        var urrisPeak = new THREE.BoxGeometry(300, 80, 250);
        makeMesh(urrisPeak, 0x566b4e, 17200, 190, -600);

        // Slieve Snaght - highest peak
        var snagtBase = new THREE.BoxGeometry(500, 160, 400);
        makeMesh(snagtBase, 0x3d5c35, 18200, 80, -400);

        var snagtMid = new THREE.BoxGeometry(320, 120, 260);
        makeMesh(snagtMid, 0x566b4e, 18200, 220, -400);

        var snagtPeak = new THREE.BoxGeometry(180, 80, 140);
        makeMesh(snagtPeak, 0x7a8c73, 18200, 370, -400);
    }

    // --- SEA (west and north Atlantic) ---
    function buildSea() {
        // West Atlantic coast sea
        var westSea = new THREE.BoxGeometry(1200, 8, 2600);
        makeMesh(westSea, 0x1E6BA8, 16360, -4, 0);

        // North Atlantic sea
        var northSea = new THREE.BoxGeometry(3800, 8, 1400);
        makeMesh(northSea, 0x1E6BA8, 18160, -4, -1700);

        // Offshore waves / shallow shelf (lighter tone)
        var shallowGeo = new THREE.BoxGeometry(800, 6, 2200);
        makeMesh(shallowGeo, 0x2980b9, 16760, -3, 0);
    }

    // --- LOUGH FOYLE (east) ---
    function buildLoughFoyle() {
        // Main lough body
        var loughMain = new THREE.BoxGeometry(1000, 6, 1800);
        makeMesh(loughMain, 0x006994, 19760, -3, 400);

        // Lough inlet narrowing northward
        var loughNarrow = new THREE.BoxGeometry(600, 6, 600);
        makeMesh(loughNarrow, 0x006994, 19860, -3, -300);

        // Mudflats at low tide (grey-brown)
        var mudflat1 = new THREE.BoxGeometry(200, 4, 400);
        makeMesh(mudflat1, 0x7a6652, 19360, -2, 300);

        var mudflat2 = new THREE.BoxGeometry(180, 4, 300);
        makeMesh(mudflat2, 0x7a6652, 19380, -2, -100);
    }

    // --- MALIN HEAD ---
    function buildMalinHead() {
        var cx = 18060;
        var cz = -1080;

        // Headland platform
        var headlandBase = new THREE.BoxGeometry(500, 60, 400);
        makeMesh(headlandBase, 0x808080, cx, 30, cz);

        // Dramatic cliff slabs - north face
        var cliff1 = new THREE.BoxGeometry(120, 180, 30);
        makeMesh(cliff1, 0x808080, cx - 160, 90, cz - 195);

        var cliff2 = new THREE.BoxGeometry(150, 220, 30);
        makeMesh(cliff2, 0x696969, cx, 110, cz - 200);

        var cliff3 = new THREE.BoxGeometry(130, 190, 30);
        makeMesh(cliff3, 0x808080, cx + 160, 95, cz - 198);

        // West cliff face
        var cliffW1 = new THREE.BoxGeometry(30, 160, 120);
        makeMesh(cliffW1, 0x696969, cx - 240, 80, cz - 60);

        var cliffW2 = new THREE.BoxGeometry(30, 140, 100);
        makeMesh(cliffW2, 0x808080, cx - 242, 70, cz + 80);

        // Weather station - cylindrical tower
        var stationTower = new THREE.CylinderGeometry(12, 14, 60, 8);
        makeMesh(stationTower, 0xcccccc, cx + 80, 90, cz + 60);

        var stationRoof = new THREE.ConeGeometry(14, 20, 8);
        makeMesh(stationRoof, 0x888888, cx + 80, 150, cz + 60);

        var stationBase = new THREE.BoxGeometry(32, 8, 32);
        makeMesh(stationBase, 0xaaaaaa, cx + 80, 63, cz + 60);

        // Equipment dome on station
        var equipDome = new THREE.SphereGeometry(8, 8, 6);
        makeMesh(equipDome, 0xdddddd, cx + 80, 130, cz + 60);

        // Napoleonic signal tower ruins
        var towerBase = new THREE.BoxGeometry(28, 24, 28);
        makeMesh(towerBase, 0x808080, cx - 60, 72, cz + 40);

        var towerUpper = new THREE.BoxGeometry(22, 30, 22);
        makeMesh(towerUpper, 0x696969, cx - 60, 111, cz + 40);

        // Ruined wall sections
        var ruinWall1 = new THREE.BoxGeometry(40, 18, 8);
        makeMesh(ruinWall1, 0x808080, cx - 90, 69, cz + 20);

        var ruinWall2 = new THREE.BoxGeometry(8, 24, 36);
        makeMesh(ruinWall2, 0x777777, cx - 44, 72, cz + 60);

        // EIRE sign (war era neutral marker) - flat stone slab
        var eireSlab = new THREE.BoxGeometry(60, 6, 18);
        makeMesh(eireSlab, 0x9a9a9a, cx + 20, 61, cz + 120);
    }

    // --- GRIANAN OF AILEACH ---
    function buildGriananaileach() {
        var cx = 19200;
        var cz = 600;
        var hilltopY = 200;

        // Hillfort hill - stacked platforms
        var hillBase = new THREE.BoxGeometry(560, 100, 520);
        makeMesh(hillBase, 0x3d5c35, cx, 50, cz);

        var hillMid = new THREE.BoxGeometry(380, 80, 360);
        makeMesh(hillMid, 0x566b4e, cx, 140, cz);

        var hillTop = new THREE.BoxGeometry(260, 60, 240);
        makeMesh(hillTop, 0x6b7c62, cx, 210, cz);

        // Outer ring wall - 8 arc segments (BoxGeometry segments arranged in ring)
        var wallH = 40;
        var wallW = 20;
        var r = 100;
        var segments = 8;
        for (var i = 0; i < segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            var nextAngle = ((i + 0.5) / segments) * Math.PI * 2;
            var midAngle = (angle + nextAngle) / 2;
            var wx = cx + Math.cos(midAngle) * r;
            var wz = cz + Math.sin(midAngle) * r;
            var segLen = 2 * r * Math.sin(Math.PI / segments) * 1.1;
            var wallGeo = new THREE.BoxGeometry(segLen, wallH, wallW);
            var mat = new THREE.MeshLambertMaterial({ color: 0x808080 });
            var mesh = new THREE.Mesh(wallGeo, mat);
            mesh.position.set(wx, hilltopY + wallH / 2, wz);
            mesh.rotation.y = -midAngle;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Inner ring wall
        var r2 = 65;
        for (var j = 0; j < 6; j++) {
            var ang2 = (j / 6) * Math.PI * 2;
            var nAng2 = ((j + 0.5) / 6) * Math.PI * 2;
            var mAng2 = (ang2 + nAng2) / 2;
            var wx2 = cx + Math.cos(mAng2) * r2;
            var wz2 = cz + Math.sin(mAng2) * r2;
            var segLen2 = 2 * r2 * Math.sin(Math.PI / 6) * 1.1;
            var wallGeo2 = new THREE.BoxGeometry(segLen2, 30, 16);
            var mat2 = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var mesh2 = new THREE.Mesh(wallGeo2, mat2);
            mesh2.position.set(wx2, hilltopY + 15, wz2);
            mesh2.rotation.y = -mAng2;
            scene.add(mesh2);
            objects.push(mesh2);
        }

        // Central courtyard floor
        var courtyard = new THREE.BoxGeometry(120, 8, 110);
        makeMesh(courtyard, 0x9a8870, cx, hilltopY + 4, cz);

        // Central altar/mound
        var altar = new THREE.BoxGeometry(30, 20, 30);
        makeMesh(altar, 0x808080, cx, hilltopY + 18, cz);
    }

    // --- DUNREE FORT ---
    function buildDunreeFort() {
        var cx = 17400;
        var cz = -500;
        var baseY = 40;

        // Sea cliff base
        var cliffBase = new THREE.BoxGeometry(300, 80, 200);
        makeMesh(cliffBase, 0x808080, cx, 40, cz);

        // Fort outer wall - thick Napoleonic walls
        var wallN = new THREE.BoxGeometry(200, 30, 14);
        makeMesh(wallN, 0x888878, cx, baseY + 56, cz - 90);

        var wallS = new THREE.BoxGeometry(200, 30, 14);
        makeMesh(wallS, 0x888878, cx, baseY + 56, cz + 90);

        var wallE = new THREE.BoxGeometry(14, 30, 180);
        makeMesh(wallE, 0x888878, cx + 100, baseY + 56, cz);

        var wallW = new THREE.BoxGeometry(14, 30, 180);
        makeMesh(wallW, 0x888878, cx - 100, baseY + 56, cz);

        // Fort interior courtyard
        var courtFloor = new THREE.BoxGeometry(172, 6, 162);
        makeMesh(courtFloor, 0x9a9080, cx, baseY + 42, cz);

        // Corner bastions
        var bastion1 = new THREE.BoxGeometry(30, 36, 30);
        makeMesh(bastion1, 0x808070, cx - 107, baseY + 63, cz - 97);

        var bastion2 = new THREE.BoxGeometry(30, 36, 30);
        makeMesh(bastion2, 0x808070, cx + 107, baseY + 63, cz - 97);

        var bastion3 = new THREE.BoxGeometry(30, 36, 30);
        makeMesh(bastion3, 0x808070, cx - 107, baseY + 63, cz + 97);

        var bastion4 = new THREE.BoxGeometry(30, 36, 30);
        makeMesh(bastion4, 0x808070, cx + 107, baseY + 63, cz + 97);

        // Cannon platforms (box slabs)
        var cannon1 = new THREE.BoxGeometry(40, 10, 20);
        makeMesh(cannon1, 0x555555, cx - 60, baseY + 78, cz - 88);

        var cannon2 = new THREE.BoxGeometry(40, 10, 20);
        makeMesh(cannon2, 0x555555, cx + 60, baseY + 78, cz - 88);

        // Cannon barrels (horizontal cylinders)
        var barrelGeo1 = new THREE.CylinderGeometry(3, 4, 24, 6);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrel1 = new THREE.Mesh(barrelGeo1, barrelMat);
        barrel1.rotation.x = Math.PI / 2;
        barrel1.position.set(cx - 60, baseY + 90, cz - 100);
        scene.add(barrel1);
        objects.push(barrel1);

        var barrelGeo2 = new THREE.CylinderGeometry(3, 4, 24, 6);
        var barrel2 = new THREE.Mesh(barrelGeo2, barrelMat.clone());
        barrel2.rotation.x = Math.PI / 2;
        barrel2.position.set(cx + 60, baseY + 90, cz - 100);
        scene.add(barrel2);
        objects.push(barrel2);

        // Lighthouse
        var lighthouseTower = new THREE.CylinderGeometry(8, 11, 80, 8);
        makeMesh(lighthouseTower, 0xf0f0f0, cx + 140, baseY + 82, cz - 60);

        var lighthouseLantern = new THREE.CylinderGeometry(10, 10, 16, 8);
        makeMesh(lighthouseLantern, 0xdddd00, cx + 140, baseY + 162, cz - 60);

        var lighthouseCap = new THREE.ConeGeometry(11, 20, 8);
        makeMesh(lighthouseCap, 0xcc2222, cx + 140, baseY + 178, cz - 60);

        // Main barrack building
        var barracks = new THREE.BoxGeometry(80, 24, 40);
        makeMesh(barracks, 0x9a8c7a, cx - 20, baseY + 54, cz + 20);

        var barracksRoof = new THREE.BoxGeometry(84, 12, 44);
        makeMesh(barracksRoof, 0x7a6a58, cx - 20, baseY + 72, cz + 20);
    }

    // --- CARNDONAGH ---
    function buildCarndonagh() {
        var cx = 18800;
        var cz = 400;

        // Town square / main street cluster of buildings
        var house1 = new THREE.BoxGeometry(28, 22, 20);
        makeMesh(house1, 0xCD5C5C, cx, 11, cz);

        var roof1 = new THREE.BoxGeometry(30, 10, 22);
        makeMesh(roof1, 0x8B3333, cx, 27, cz);

        var house2 = new THREE.BoxGeometry(24, 20, 18);
        makeMesh(house2, 0xc04040, cx + 36, 10, cz);

        var roof2 = new THREE.BoxGeometry(26, 9, 20);
        makeMesh(roof2, 0x8B3333, cx + 36, 25, cz);

        var house3 = new THREE.BoxGeometry(26, 18, 20);
        makeMesh(house3, 0xb03030, cx - 36, 9, cz);

        var roof3 = new THREE.BoxGeometry(28, 9, 22);
        makeMesh(roof3, 0x7a2828, cx - 36, 23, cz);

        var house4 = new THREE.BoxGeometry(22, 20, 18);
        makeMesh(house4, 0xCD5C5C, cx + 70, 10, cz + 10);

        var house5 = new THREE.BoxGeometry(24, 18, 20);
        makeMesh(house5, 0xc04040, cx - 70, 9, cz - 10);

        // Church
        var churchBody = new THREE.BoxGeometry(30, 30, 60);
        makeMesh(churchBody, 0x888878, cx + 20, 15, cz - 80);

        var churchTower = new THREE.BoxGeometry(14, 50, 14);
        makeMesh(churchTower, 0x888878, cx + 20, 40, cz - 110);

        var churchSpire = new THREE.ConeGeometry(8, 30, 4);
        makeMesh(churchSpire, 0x666666, cx + 20, 80, cz - 110);

        // 5th century HIGH CROSS - thin tall BoxGeometry cross
        // Vertical shaft
        var crossShaft = new THREE.BoxGeometry(5, 60, 5);
        makeMesh(crossShaft, 0xb0a090, cx + 20, 30, cz - 60);

        // Horizontal arms
        var crossArms = new THREE.BoxGeometry(30, 5, 5);
        makeMesh(crossArms, 0xb0a090, cx + 20, 50, cz - 60);

        // Ring halo of Celtic cross
        var crossRingN = new THREE.BoxGeometry(5, 14, 5);
        makeMesh(crossRingN, 0xb0a090, cx + 20, 55, cz - 60);

        var crossRingE = new THREE.BoxGeometry(14, 5, 5);
        makeMesh(crossRingE, 0xb0a090, cx + 27, 50, cz - 60);

        var crossRingW = new THREE.BoxGeometry(14, 5, 5);
        makeMesh(crossRingW, 0xb0a090, cx + 13, 50, cz - 60);

        // Cross base plinth
        var crossBase = new THREE.BoxGeometry(14, 8, 14);
        makeMesh(crossBase, 0x9a8a78, cx + 20, 4, cz - 60);

        // Market square cobbles (low slab)
        var marketSquare = new THREE.BoxGeometry(80, 3, 60);
        makeMesh(marketSquare, 0x888880, cx + 10, 1.5, cz + 20);
    }

    // --- MALIN VILLAGE + HARBOUR ---
    function buildMalinVillage() {
        var cx = 18200;
        var cz = -800;

        // White cottages cluster
        var c1 = new THREE.BoxGeometry(20, 16, 14);
        makeMesh(c1, 0xFFFFF0, cx, 8, cz);

        var r1 = new THREE.BoxGeometry(22, 8, 16);
        makeMesh(r1, 0xddddcc, cx, 20, cz);

        var c2 = new THREE.BoxGeometry(18, 14, 12);
        makeMesh(c2, 0xFFFFF0, cx + 30, 7, cz + 10);

        var r2 = new THREE.BoxGeometry(20, 7, 14);
        makeMesh(r2, 0xccccbb, cx + 30, 18, cz + 10);

        var c3 = new THREE.BoxGeometry(22, 16, 14);
        makeMesh(c3, 0xfffff0, cx - 30, 8, cz - 10);

        var r3 = new THREE.BoxGeometry(24, 8, 16);
        makeMesh(r3, 0xddddcc, cx - 30, 20, cz - 10);

        var c4 = new THREE.BoxGeometry(16, 14, 12);
        makeMesh(c4, 0xFFFFF0, cx + 55, 7, cz - 20);

        var c5 = new THREE.BoxGeometry(18, 15, 13);
        makeMesh(c5, 0xfffff8, cx - 55, 7, cz + 15);

        // Harbour wall / pier
        var pierMain = new THREE.BoxGeometry(120, 8, 16);
        makeMesh(pierMain, 0x888878, cx - 80, 4, cz - 70);

        var pierSide = new THREE.BoxGeometry(16, 8, 80);
        makeMesh(pierSide, 0x888878, cx - 132, 4, cz - 30);

        // Harbour light (CylinderGeometry)
        var harbourLight = new THREE.CylinderGeometry(4, 5, 30, 8);
        makeMesh(harbourLight, 0xFFFFF0, cx - 132, 23, cz - 70);

        var harbourLens = new THREE.SphereGeometry(5, 8, 6);
        makeMesh(harbourLens, 0xffffaa, cx - 132, 40, cz - 70);

        // Fishing boats (box hulls)
        var boat1 = new THREE.BoxGeometry(14, 5, 6);
        makeMesh(boat1, 0x2244aa, cx - 110, 6, cz - 55);

        var boat2 = new THREE.BoxGeometry(12, 5, 5);
        makeMesh(boat2, 0xaa2222, cx - 120, 6, cz - 42);

        // Boat masts
        var mast1 = new THREE.BoxGeometry(2, 22, 2);
        makeMesh(mast1, 0x8B6914, cx - 110, 19, cz - 55);

        var mast2 = new THREE.BoxGeometry(2, 18, 2);
        makeMesh(mast2, 0x8B6914, cx - 120, 17, cz - 42);

        // Village pub / shop
        var pub = new THREE.BoxGeometry(26, 20, 18);
        makeMesh(pub, 0x228B22, cx + 10, 10, cz + 50);

        var pubRoof = new THREE.BoxGeometry(28, 9, 20);
        makeMesh(pubRoof, 0x1a6b1a, cx + 10, 25, cz + 50);

        // Malin village green (low grass slab)
        var green = new THREE.BoxGeometry(50, 2, 40);
        makeMesh(green, 0x3a7a30, cx, 1, cz + 30);
    }

    // --- WIND FARM ---
    function buildWindFarm() {
        var cx = 17900;
        var cz = 200;
        var positions = [
            [cx, cz],
            [cx + 80, cz - 120],
            [cx - 80, cz - 100],
            [cx + 160, cz + 60],
            [cx - 160, cz + 80]
        ];

        for (var t = 0; t < positions.length; t++) {
            var tx = positions[t][0];
            var tz = positions[t][1];

            // Tower
            var tower = new THREE.CylinderGeometry(5, 9, 120, 8);
            makeMesh(tower, 0xF5F5F5, tx, 60, tz);

            // Nacelle (box housing at top)
            var nacelle = new THREE.BoxGeometry(20, 12, 12);
            makeMesh(nacelle, 0xeeeeee, tx, 126, tz);

            // Hub
            var hub = new THREE.SphereGeometry(6, 6, 6);
            makeMesh(hub, 0xdddddd, tx, 126, tz - 8);

            // 3 blades - thin BoxGeometry
            var blade1Geo = new THREE.BoxGeometry(4, 60, 2);
            var bladeMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });
            var blade1 = new THREE.Mesh(blade1Geo, bladeMat);
            blade1.position.set(tx, 126 + 30, tz - 8);
            scene.add(blade1);
            objects.push(blade1);
            turbineBlades.push({ mesh: blade1, cx: tx, cy: 126, cz: tz - 8, axis: 'z' });

            var blade2Geo = new THREE.BoxGeometry(4, 60, 2);
            var blade2 = new THREE.Mesh(blade2Geo, bladeMat.clone());
            blade2.position.set(tx - 26, 126 - 15, tz - 8);
            blade2.rotation.z = (2 * Math.PI) / 3;
            scene.add(blade2);
            objects.push(blade2);
            turbineBlades.push({ mesh: blade2, cx: tx, cy: 126, cz: tz - 8, axis: 'z', offset: (2 * Math.PI) / 3 });

            var blade3Geo = new THREE.BoxGeometry(4, 60, 2);
            var blade3 = new THREE.Mesh(blade3Geo, bladeMat.clone());
            blade3.position.set(tx + 26, 126 - 15, tz - 8);
            blade3.rotation.z = (4 * Math.PI) / 3;
            scene.add(blade3);
            objects.push(blade3);
            turbineBlades.push({ mesh: blade3, cx: tx, cy: 126, cz: tz - 8, axis: 'z', offset: (4 * Math.PI) / 3 });
        }
    }

    // --- PEAT BOGS ---
    function buildPeatBogs() {
        var bog1 = new THREE.BoxGeometry(400, 4, 300);
        makeMesh(bog1, 0x8B4513, 18400, 2, 100);

        var bog2 = new THREE.BoxGeometry(300, 4, 250);
        makeMesh(bog2, 0x7a3d11, 18700, 2, -200);

        var bog3 = new THREE.BoxGeometry(350, 4, 280);
        makeMesh(bog3, 0x8B4513, 17600, 2, 300);

        // Peat cutting banks (low box ridges)
        var bank1 = new THREE.BoxGeometry(120, 10, 8);
        makeMesh(bank1, 0x6b3410, 18420, 7, 80);

        var bank2 = new THREE.BoxGeometry(100, 10, 8);
        makeMesh(bank2, 0x6b3410, 18440, 7, 100);

        var bank3 = new THREE.BoxGeometry(110, 10, 8);
        makeMesh(bank3, 0x5a2c0e, 18460, 7, 120);

        // Turf stack (stacked cut peat)
        var turfStack = new THREE.BoxGeometry(16, 20, 14);
        makeMesh(turfStack, 0x5a2c0e, 18380, 12, 60);

        var turfTop = new THREE.BoxGeometry(14, 8, 12);
        makeMesh(turfTop, 0x6b3410, 18380, 26, 60);
    }

    // --- ROADS ---
    function buildRoads() {
        // Main R238 road running north-south along peninsula spine
        var road1 = new THREE.BoxGeometry(12, 2, 1800);
        makeMesh(road1, 0x555555, 18500, 1, -100);

        // Road to Malin Head
        var road2 = new THREE.BoxGeometry(10, 2, 600);
        makeMesh(road2, 0x555555, 18200, 1, -700);

        // Road bend/junction (box)
        var junction1 = new THREE.BoxGeometry(20, 2, 20);
        makeMesh(junction1, 0x555555, 18200, 1, -400);

        // Road to Carndonagh
        var road3 = new THREE.BoxGeometry(600, 2, 10);
        makeMesh(road3, 0x555555, 18700, 1, 400);

        // Coastal road west
        var road4 = new THREE.BoxGeometry(10, 2, 900);
        makeMesh(road4, 0x555555, 17400, 1, -200);

        // Road connecting to Dunree
        var road5 = new THREE.BoxGeometry(300, 2, 10);
        makeMesh(road5, 0x555555, 17550, 1, -500);

        // Rural track to wind farm
        var track1 = new THREE.BoxGeometry(8, 2, 400);
        makeMesh(track1, 0x666655, 17900, 1, 0);
    }

    // --- SEA STACKS ---
    function buildSeaStacks() {
        // Tall stone columns off Atlantic coast
        var stack1 = new THREE.BoxGeometry(18, 90, 18);
        makeMesh(stack1, 0x696969, 16500, 45, -600);

        var stack2 = new THREE.BoxGeometry(14, 70, 16);
        makeMesh(stack2, 0x696969, 16480, 35, -500);

        var stack3 = new THREE.BoxGeometry(20, 110, 20);
        makeMesh(stack3, 0x606060, 16460, 55, -700);

        var stack4 = new THREE.BoxGeometry(12, 60, 14);
        makeMesh(stack4, 0x696969, 16520, 30, -780);

        // Northern sea stacks near Malin Head
        var stack5 = new THREE.BoxGeometry(16, 80, 16);
        makeMesh(stack5, 0x696969, 17900, 40, -1300);

        var stack6 = new THREE.BoxGeometry(12, 65, 14);
        makeMesh(stack6, 0x606060, 17940, 32, -1350);

        // Stack tops (slightly different stone)
        var stackTop1 = new THREE.BoxGeometry(20, 10, 20);
        makeMesh(stackTop1, 0x777777, 16500, 94, -600);

        var stackTop3 = new THREE.BoxGeometry(22, 12, 22);
        makeMesh(stackTop3, 0x777777, 16460, 114, -700);
    }

    // --- UPDATE (animate turbine blades) ---
    function update(delta) {
        var rotSpeed = 0.8;
        for (var i = 0; i < turbineBlades.length; i++) {
            var b = turbineBlades[i];
            var offset = b.offset || 0;
            // rotate around hub point
            var elapsed = (Date.now() * 0.001) * rotSpeed;
            var angle = elapsed + offset;
            var radius = 30;
            b.mesh.position.x = b.cx + Math.sin(angle) * 0;
            b.mesh.position.y = b.cy + Math.cos(angle) * radius;
            // Actually rotate the blade group around the hub
            b.mesh.rotation.z = angle;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        turbineBlades = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
