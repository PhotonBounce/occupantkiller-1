window.ObanPier = (function() {
    'use strict';

    var BASE_X = 1690;
    var BASE_Z = 2200;

    function createMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, mat);
    }

    function addToScene(scene, mesh, x, y, z) {
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function buildMcCaigsRing(scene) {
        var radius = 12;
        var count = 12;
        var color = 0xD4A97A;
        var i, angle, px, pz, box, geo;
        for (i = 0; i < count; i++) {
            angle = (i / count) * Math.PI * 2;
            px = BASE_X + Math.cos(angle) * radius;
            pz = BASE_Z - 60 + Math.sin(angle) * radius;
            geo = new THREE.BoxGeometry(2, 8, 2);
            box = createMesh(geo, color);
            addToScene(scene, box, px, 4, pz);
        }
    }

    function buildMcCaigsArches(scene) {
        var radius = 12;
        var count = 12;
        var color = 0xD4A97A;
        var i, angle, px, pz, geo, lintel;
        for (i = 0; i < count; i++) {
            angle = ((i + 0.5) / count) * Math.PI * 2;
            px = BASE_X + Math.cos(angle) * radius;
            pz = BASE_Z - 60 + Math.sin(angle) * radius;
            geo = new THREE.BoxGeometry(2, 1, 2);
            lintel = createMesh(geo, color);
            addToScene(scene, lintel, px, 8.5, pz);
        }
    }

    function buildMcCaigsHillBase(scene) {
        var geo = new THREE.CylinderGeometry(14, 16, 3, 12);
        var base = createMesh(geo, 0xC8A060);
        addToScene(scene, base, BASE_X, 1.5, BASE_Z - 60);
    }

    function buildRailwayPier(scene) {
        var geo = new THREE.BoxGeometry(40, 2, 8);
        var pier = createMesh(geo, 0x5C3D1E);
        addToScene(scene, pier, BASE_X, 1, BASE_Z + 30);
    }

    function buildPierDecking(scene) {
        var geo = new THREE.BoxGeometry(38, 0.3, 6);
        var deck = createMesh(geo, 0x7A5230);
        addToScene(scene, deck, BASE_X, 2.15, BASE_Z + 30);
    }

    function buildIronBollards(scene) {
        var startX = BASE_X - 18;
        var pierZ = BASE_Z + 30;
        var i, bx, geo, bollard;
        for (i = 0; i < 8; i++) {
            bx = startX + i * 5;
            geo = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 6);
            bollard = createMesh(geo, 0x2A2A2A);
            addToScene(scene, bollard, bx, 2.6, pierZ + 3.5);
            geo = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 6);
            bollard = createMesh(geo, 0x2A2A2A);
            addToScene(scene, bollard, bx, 2.6, pierZ - 3.5);
        }
    }

    function buildBollardTops(scene) {
        var startX = BASE_X - 18;
        var pierZ = BASE_Z + 30;
        var i, bx, geo, top;
        for (i = 0; i < 8; i++) {
            bx = startX + i * 5;
            geo = new THREE.SphereGeometry(0.28, 6, 4);
            top = createMesh(geo, 0x2A2A2A);
            addToScene(scene, top, bx, 3.3, pierZ + 3.5);
            geo = new THREE.SphereGeometry(0.28, 6, 4);
            top = createMesh(geo, 0x2A2A2A);
            addToScene(scene, top, bx, 3.3, pierZ - 3.5);
        }
    }

    function buildFerryTerminal(scene) {
        var geo = new THREE.BoxGeometry(20, 8, 12);
        var shed = createMesh(geo, 0x4A4A8A);
        addToScene(scene, shed, BASE_X + 5, 4, BASE_Z + 15);
    }

    function buildTerminalRoof(scene) {
        var geo = new THREE.BoxGeometry(21, 1, 13);
        var roof = createMesh(geo, 0x3A3A7A);
        addToScene(scene, roof, BASE_X + 5, 8.5, BASE_Z + 15);
    }

    function buildTerminalDoors(scene) {
        var geo = new THREE.BoxGeometry(3, 5, 0.4);
        var door = createMesh(geo, 0x222266);
        addToScene(scene, door, BASE_X - 2, 2.5, BASE_Z + 9);
        geo = new THREE.BoxGeometry(3, 5, 0.4);
        door = createMesh(geo, 0x222266);
        addToScene(scene, door, BASE_X + 2, 2.5, BASE_Z + 9);
    }

    function buildDistilleryTower(scene) {
        var geo = new THREE.CylinderGeometry(2, 2.2, 16, 10);
        var tower = createMesh(geo, 0xB8A070);
        addToScene(scene, tower, BASE_X - 20, 8, BASE_Z - 10);
    }

    function buildPagodaCone(scene) {
        var geo = new THREE.ConeGeometry(3, 4, 8);
        var cone = createMesh(geo, 0x8A7050);
        addToScene(scene, cone, BASE_X - 20, 18, BASE_Z - 10);
    }

    function buildDistilleryBody(scene) {
        var geo = new THREE.BoxGeometry(10, 6, 8);
        var body = createMesh(geo, 0xC8B890);
        addToScene(scene, body, BASE_X - 20, 3, BASE_Z - 5);
    }

    function buildDistilleryWarehouses(scene) {
        var geo = new THREE.BoxGeometry(14, 5, 10);
        var warehouse = createMesh(geo, 0xBBAA80);
        addToScene(scene, warehouse, BASE_X - 28, 2.5, BASE_Z - 8);
    }

    function buildHotel(scene, offsetX) {
        var geo = new THREE.BoxGeometry(10, 10, 8);
        var hotel = createMesh(geo, 0xF5D58A);
        addToScene(scene, hotel, BASE_X + offsetX, 5, BASE_Z - 20);
    }

    function buildHotelRoof(scene, offsetX) {
        var geo = new THREE.BoxGeometry(10, 1.5, 8);
        var roof = createMesh(geo, 0xE0C070);
        addToScene(scene, roof, BASE_X + offsetX, 10.75, BASE_Z - 20);
    }

    function buildHotelDormers(scene, offsetX) {
        var geo = new THREE.BoxGeometry(2, 2, 1);
        var dormer = createMesh(geo, 0xF5D58A);
        addToScene(scene, dormer, BASE_X + offsetX - 2, 12, BASE_Z - 20.5);
        geo = new THREE.BoxGeometry(2, 2, 1);
        dormer = createMesh(geo, 0xF5D58A);
        addToScene(scene, dormer, BASE_X + offsetX + 2, 12, BASE_Z - 20.5);
    }

    function buildSeafrontHotels(scene) {
        var offsets = [-22, -11, 0];
        var i;
        for (i = 0; i < offsets.length; i++) {
            buildHotel(scene, offsets[i]);
            buildHotelRoof(scene, offsets[i]);
            buildHotelDormers(scene, offsets[i]);
        }
    }

    function buildBatteryHilltop(scene) {
        var geo = new THREE.BoxGeometry(20, 2, 12);
        var platform = createMesh(geo, 0x7A7A6A);
        addToScene(scene, platform, BASE_X + 35, 9, BASE_Z - 40);
    }

    function buildGunEmbrasure(scene, offsetX) {
        var geo = new THREE.BoxGeometry(4, 3, 4);
        var emplacement = createMesh(geo, 0x6A6A5A);
        addToScene(scene, emplacement, BASE_X + 35 + offsetX, 11, BASE_Z - 40);
    }

    function buildGunBarrel(scene, offsetX) {
        var geo = new THREE.CylinderGeometry(0.3, 0.35, 4, 6);
        var barrel = createMesh(geo, 0x3A3A3A);
        barrel.rotation.x = Math.PI / 2;
        addToScene(scene, barrel, BASE_X + 35 + offsetX, 12, BASE_Z - 42);
    }

    function buildGunWheel(scene, offsetX, side) {
        var geo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 8);
        var wheel = createMesh(geo, 0x2A2A2A);
        wheel.rotation.z = Math.PI / 2;
        addToScene(scene, wheel, BASE_X + 35 + offsetX + side, 10.8, BASE_Z - 41);
    }

    function buildBatteryWall(scene) {
        var geo = new THREE.BoxGeometry(22, 3, 1.5);
        var wall = createMesh(geo, 0x7A7A6A);
        addToScene(scene, wall, BASE_X + 35, 11.5, BASE_Z - 46);
    }

    function buildBatteryPositions(scene) {
        buildBatteryHilltop(scene);
        buildGunEmbrasure(scene, -5);
        buildGunEmbrasure(scene, 5);
        buildGunBarrel(scene, -5);
        buildGunBarrel(scene, 5);
        buildGunWheel(scene, -5, -1.5);
        buildGunWheel(scene, -5, 1.5);
        buildGunWheel(scene, 5, -1.5);
        buildGunWheel(scene, 5, 1.5);
        buildBatteryWall(scene);
    }

    function buildHillSlope(scene) {
        var geo = new THREE.BoxGeometry(30, 4, 20);
        var slope = createMesh(geo, 0x5A7A3A);
        addToScene(scene, slope, BASE_X + 25, 7, BASE_Z - 48);
    }

    function buildPierPilings(scene) {
        var i, geo, piling;
        for (i = 0; i < 5; i++) {
            geo = new THREE.CylinderGeometry(0.3, 0.4, 4, 6);
            piling = createMesh(geo, 0x4A2E10);
            addToScene(scene, piling, BASE_X - 16 + i * 8, -1, BASE_Z + 30);
        }
    }

    function buildSeawall(scene) {
        var geo = new THREE.BoxGeometry(60, 4, 3);
        var wall = createMesh(geo, 0x9A8A6A);
        addToScene(scene, wall, BASE_X, 2, BASE_Z + 5);
    }

    function buildSeawallCapping(scene) {
        var geo = new THREE.BoxGeometry(60, 0.5, 3.5);
        var cap = createMesh(geo, 0xB0A07A);
        addToScene(scene, cap, BASE_X, 4.25, BASE_Z + 5);
    }

    function buildLighthouse(scene) {
        var geo = new THREE.CylinderGeometry(0.8, 1.0, 6, 8);
        var tower = createMesh(geo, 0xFFFFEE);
        addToScene(scene, tower, BASE_X + 22, 3, BASE_Z + 32);
    }

    function buildLighthouseLight(scene) {
        var geo = new THREE.SphereGeometry(0.7, 8, 6);
        var light = createMesh(geo, 0xFFFF88);
        addToScene(scene, light, BASE_X + 22, 7, BASE_Z + 32);
    }

    function buildLighthouseRail(scene) {
        var geo = new THREE.CylinderGeometry(1.1, 1.1, 0.3, 8);
        var rail = createMesh(geo, 0xCCCCCC);
        addToScene(scene, rail, BASE_X + 22, 6.15, BASE_Z + 32);
    }

    function buildHarbourWall(scene) {
        var geo = new THREE.BoxGeometry(3, 5, 45);
        var wall = createMesh(geo, 0x9A8A6A);
        addToScene(scene, wall, BASE_X - 32, 2.5, BASE_Z + 10);
    }

    function buildHarbourWallCap(scene) {
        var geo = new THREE.BoxGeometry(3.5, 0.6, 45);
        var cap = createMesh(geo, 0xB0A07A);
        addToScene(scene, cap, BASE_X - 32, 5.3, BASE_Z + 10);
    }

    function buildFishingBoatHull(scene, offsetX, offsetZ) {
        var geo = new THREE.BoxGeometry(5, 2, 2);
        var hull = createMesh(geo, 0x4466AA);
        addToScene(scene, hull, BASE_X + offsetX, 1, BASE_Z + offsetZ);
    }

    function buildFishingBoatCabin(scene, offsetX, offsetZ) {
        var geo = new THREE.BoxGeometry(2, 1.5, 1.5);
        var cabin = createMesh(geo, 0xEEEECC);
        addToScene(scene, cabin, BASE_X + offsetX + 1, 2.75, BASE_Z + offsetZ);
    }

    function buildFishingBoatMast(scene, offsetX, offsetZ) {
        var geo = new THREE.CylinderGeometry(0.08, 0.1, 4, 4);
        var mast = createMesh(geo, 0x8B6914);
        addToScene(scene, mast, BASE_X + offsetX - 1, 4, BASE_Z + offsetZ);
    }

    function buildFishingBoats(scene) {
        buildFishingBoatHull(scene, -26, 20);
        buildFishingBoatCabin(scene, -26, 20);
        buildFishingBoatMast(scene, -26, 20);
        buildFishingBoatHull(scene, -18, 22);
        buildFishingBoatCabin(scene, -18, 22);
        buildFishingBoatMast(scene, -18, 22);
    }

    function buildRoadSurface(scene) {
        var geo = new THREE.BoxGeometry(50, 0.2, 6);
        var road = createMesh(geo, 0x444444);
        addToScene(scene, road, BASE_X - 5, 0.1, BASE_Z - 5);
    }

    function buildPavementStrip(scene) {
        var geo = new THREE.BoxGeometry(50, 0.3, 2);
        var pavement = createMesh(geo, 0xCCBB99);
        addToScene(scene, pavement, BASE_X - 5, 0.15, BASE_Z - 9);
    }

    function buildLampPost(scene, offsetX) {
        var geo = new THREE.CylinderGeometry(0.1, 0.15, 5, 5);
        var post = createMesh(geo, 0x333333);
        addToScene(scene, post, BASE_X + offsetX, 2.5, BASE_Z - 8);
    }

    function buildLampHead(scene, offsetX) {
        var geo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
        var head = createMesh(geo, 0x555500);
        addToScene(scene, head, BASE_X + offsetX, 5.2, BASE_Z - 8);
    }

    function buildStreetLamps(scene) {
        var offsets = [-20, -10, 0, 10, 20];
        var i;
        for (i = 0; i < offsets.length; i++) {
            buildLampPost(scene, offsets[i]);
            buildLampHead(scene, offsets[i]);
        }
    }

    function buildGroundBase(scene) {
        var geo = new THREE.BoxGeometry(120, 1, 120);
        var ground = createMesh(geo, 0x5A7A3A);
        addToScene(scene, ground, BASE_X, -0.5, BASE_Z - 20);
    }

    function buildWaterSurface(scene) {
        var geo = new THREE.BoxGeometry(120, 0.5, 50);
        var water = createMesh(geo, 0x1A3A5C);
        addToScene(scene, water, BASE_X, 0.25, BASE_Z + 40);
    }

    function buildMcCaigsInnerWall(scene) {
        var geo = new THREE.CylinderGeometry(10, 10, 1, 12);
        var innerRing = createMesh(geo, 0xC8A060);
        addToScene(scene, innerRing, BASE_X, 0.5, BASE_Z - 60);
    }

    function buildRailwaySheds(scene) {
        var geo = new THREE.BoxGeometry(15, 5, 8);
        var shed = createMesh(geo, 0x6A5A4A);
        addToScene(scene, shed, BASE_X + 18, 2.5, BASE_Z + 14);
    }

    function buildRailwayShedRoof(scene) {
        var geo = new THREE.BoxGeometry(16, 0.8, 9);
        var roof = createMesh(geo, 0x5A4A3A);
        addToScene(scene, roof, BASE_X + 18, 5.4, BASE_Z + 14);
    }

    function buildCargoBoxes(scene) {
        var geo, box;
        geo = new THREE.BoxGeometry(3, 2, 2);
        box = createMesh(geo, 0xFF6622);
        addToScene(scene, box, BASE_X + 2, 3.0, BASE_Z + 25);
        geo = new THREE.BoxGeometry(3, 2, 2);
        box = createMesh(geo, 0x2266FF);
        addToScene(scene, box, BASE_X + 6, 3.0, BASE_Z + 25);
        geo = new THREE.BoxGeometry(3, 2, 2);
        box = createMesh(geo, 0x22AA44);
        addToScene(scene, box, BASE_X + 4, 5.0, BASE_Z + 25);
    }

    function build(scene) {
        buildGroundBase(scene);
        buildWaterSurface(scene);
        buildMcCaigsHillBase(scene);
        buildMcCaigsRing(scene);
        buildMcCaigsArches(scene);
        buildMcCaigsInnerWall(scene);
        buildRailwayPier(scene);
        buildPierDecking(scene);
        buildIronBollards(scene);
        buildBollardTops(scene);
        buildPierPilings(scene);
        buildFerryTerminal(scene);
        buildTerminalRoof(scene);
        buildTerminalDoors(scene);
        buildDistilleryTower(scene);
        buildPagodaCone(scene);
        buildDistilleryBody(scene);
        buildDistilleryWarehouses(scene);
        buildSeafrontHotels(scene);
        buildBatteryPositions(scene);
        buildHillSlope(scene);
        buildSeawall(scene);
        buildSeawallCapping(scene);
        buildLighthouse(scene);
        buildLighthouseLight(scene);
        buildLighthouseRail(scene);
        buildHarbourWall(scene);
        buildHarbourWallCap(scene);
        buildFishingBoats(scene);
        buildRoadSurface(scene);
        buildPavementStrip(scene);
        buildStreetLamps(scene);
        buildRailwaySheds(scene);
        buildRailwayShedRoof(scene);
        buildCargoBoxes(scene);
    }

    return {
        build: build
    };
}());
