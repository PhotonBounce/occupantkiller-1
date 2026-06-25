window.PooleQuay = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z, ry) {
        var geo = new THREE.BoxGeometry(w, h, d);
        return addMesh(geo, color, x, y, z, 0, ry || 0, 0);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z, ry) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
        return addMesh(geo, color, x, y, z, 0, ry || 0, 0);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws || 8, hs || 8);
        return addMesh(geo, color, x, y, z);
    }

    function makeCone(r, h, segs, color, x, y, z, ry) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        return addMesh(geo, color, x, y, z, 0, ry || 0, 0);
    }

    function buildQuayFloor() {
        // Main quay cobblestone ground
        makeBox(300, 1, 80, 0x8B7355, 13480, -0.5, 0);
        // Quay edge sea wall
        makeBox(300, 4, 3, 0x9E8B6E, 13480, 2, 40);
        // Quay extension pier
        makeBox(60, 2, 30, 0x8B7355, 13460, 0, 55);
        makeBox(60, 2, 30, 0x8B7355, 13520, 0, 55);
    }

    function buildMerchantBuildings() {
        // Row of 18th century merchant buildings along quay
        var positions = [
            [13350, 0, -10],
            [13370, 0, -10],
            [13390, 0, -10],
            [13410, 0, -10],
            [13430, 0, -10],
            [13450, 0, -10],
            [13470, 0, -10],
            [13490, 0, -10],
            [13510, 0, -10],
            [13530, 0, -10],
            [13550, 0, -10],
            [13570, 0, -10]
        ];
        var colors = [
            0xC4956A, 0xB8860B, 0xCD853F, 0xD2691E,
            0xBC8B5E, 0xC19A6B, 0xB5835A, 0xCC9966,
            0xC48A4A, 0xBF8C5A, 0xCA9060, 0xC49A6C
        ];
        var heights = [14, 12, 16, 13, 15, 12, 14, 13, 16, 12, 14, 15];
        for (var i = 0; i < positions.length; i++) {
            var px = positions[i][0];
            var py = positions[i][1];
            var pz = positions[i][2];
            var h = heights[i];
            // Building body
            makeBox(16, h, 14, colors[i], px, h / 2, pz);
            // Roof
            makeCone(12, 5, 4, 0x8B3A3A, px, h + 2.5, pz, 0.785);
            // Chimney
            makeCylinder(0.4, 0.4, 3, 6, 0x555555, px + 3, h + 5 + 1.5, pz);
            // Windows row 1
            makeBox(2.5, 2, 0.3, 0xADD8E6, px - 4, h * 0.35, pz - 7.1);
            makeBox(2.5, 2, 0.3, 0xADD8E6, px, h * 0.35, pz - 7.1);
            makeBox(2.5, 2, 0.3, 0xADD8E6, px + 4, h * 0.35, pz - 7.1);
            // Windows row 2
            makeBox(2.5, 2, 0.3, 0xADD8E6, px - 4, h * 0.65, pz - 7.1);
            makeBox(2.5, 2, 0.3, 0xADD8E6, px, h * 0.65, pz - 7.1);
            makeBox(2.5, 2, 0.3, 0xADD8E6, px + 4, h * 0.65, pz - 7.1);
            // Door
            makeBox(3, 4, 0.3, 0x4A2F1A, px, 2, pz - 7.1);
        }
    }

    function buildCustomsHouse() {
        // Grand customs house - larger, more ornate
        makeBox(30, 18, 18, 0xE8D5A3, 13480, 9, -30);
        // Portico columns
        makeCylinder(0.8, 0.8, 18, 8, 0xF5F5DC, 13468, 9, -39);
        makeCylinder(0.8, 0.8, 18, 8, 0xF5F5DC, 13474, 9, -39);
        makeCylinder(0.8, 0.8, 18, 8, 0xF5F5DC, 13480, 9, -39);
        makeCylinder(0.8, 0.8, 18, 8, 0xF5F5DC, 13486, 9, -39);
        makeCylinder(0.8, 0.8, 18, 8, 0xF5F5DC, 13492, 9, -39);
        // Pediment
        makeBox(32, 4, 2, 0xE8D5A3, 13480, 19, -39);
        makeCone(16, 5, 4, 0xD4AF82, 13480, 23.5, -39, 0.785);
        // Roof
        makeBox(32, 3, 20, 0x8B7355, 13480, 19, -30);
        // Cupola / dome on top
        makeSphere(3, 8, 8, 0x6B8E23, 13480, 23, -30);
        // Flagpole
        makeCylinder(0.15, 0.15, 8, 6, 0xAAAAAA, 13480, 27, -30);
        makeCone(1.5, 2, 4, 0xCC0000, 13480, 32, -30);
        // Windows
        makeBox(3, 3, 0.3, 0xADD8E6, 13470, 8, -39.1);
        makeBox(3, 3, 0.3, 0xADD8E6, 13480, 8, -39.1);
        makeBox(3, 3, 0.3, 0xADD8E6, 13490, 8, -39.1);
        makeBox(3, 3, 0.3, 0xADD8E6, 13470, 14, -39.1);
        makeBox(3, 3, 0.3, 0xADD8E6, 13480, 14, -39.1);
        makeBox(3, 3, 0.3, 0xADD8E6, 13490, 14, -39.1);
        // Main door
        makeBox(5, 6, 0.3, 0x4A2F1A, 13480, 3, -39.1);
    }

    function buildFishMarket() {
        // Open fish market structure with pillars
        makeBox(40, 1, 20, 0x9E8B6E, 13600, 0.5, 5);
        // Roof
        makeBox(42, 1, 22, 0x7A5C3A, 13600, 7, 5);
        // Support pillars
        var fishPillars = [
            [13582, 5, -4], [13582, 5, 14],
            [13592, 5, -4], [13592, 5, 14],
            [13602, 5, -4], [13602, 5, 14],
            [13612, 5, -4], [13612, 5, 14],
            [13618, 5, -4], [13618, 5, 14]
        ];
        for (var i = 0; i < fishPillars.length; i++) {
            makeCylinder(0.5, 0.5, 7, 6, 0x8B7355, fishPillars[i][0], fishPillars[i][1], fishPillars[i][2]);
        }
        // Fish stalls / crates
        makeBox(4, 1.5, 3, 0x8B4513, 13588, 1.25, 0);
        makeBox(4, 1.5, 3, 0x8B4513, 13596, 1.25, 0);
        makeBox(4, 1.5, 3, 0x8B4513, 13604, 1.25, 0);
        makeBox(4, 1.5, 3, 0x8B4513, 13612, 1.25, 0);
        // Ice/fish displays (blue-white spheres)
        makeSphere(0.8, 6, 6, 0x88CCEE, 13588, 2.5, 0);
        makeSphere(0.8, 6, 6, 0x88CCEE, 13596, 2.5, 0);
        makeSphere(0.8, 6, 6, 0x88CCEE, 13604, 2.5, 0);
    }

    function buildHarbourMaster() {
        // Harbour master's office - small but official
        makeBox(16, 10, 14, 0xC8B860, 13640, 5, -10);
        // Roof
        makeBox(18, 1.5, 16, 0x8B3A3A, 13640, 10.75, -10);
        makeCone(10, 4, 4, 0x8B3A3A, 13640, 12.5, -10, 0.785);
        // Flagpole
        makeCylinder(0.2, 0.2, 10, 6, 0x888888, 13640, 15, -10);
        makeCone(1, 1.5, 4, 0x0033CC, 13640, 20.75, -10);
        // Windows
        makeBox(3, 2.5, 0.3, 0xADD8E6, 13634, 6, -17.1);
        makeBox(3, 2.5, 0.3, 0xADD8E6, 13640, 6, -17.1);
        makeBox(3, 2.5, 0.3, 0xADD8E6, 13646, 6, -17.1);
        // Door
        makeBox(3, 5, 0.3, 0x2F1A0A, 13640, 2.5, -17.1);
        // Observation deck railing
        makeBox(18, 1, 1, 0x888888, 13640, 10.5, -3.5);
    }

    function buildFishingBoats() {
        var boatData = [
            [13460, 0, 50, 0x2244AA],
            [13490, 0, 52, 0xCC3333],
            [13520, 0, 51, 0x336622],
            [13545, 0, 53, 0x997722],
            [13570, 0, 50, 0x553388]
        ];
        for (var i = 0; i < boatData.length; i++) {
            var bx = boatData[i][0];
            var by = boatData[i][1];
            var bz = boatData[i][2];
            var bc = boatData[i][3];
            // Hull
            makeBox(12, 3, 5, bc, bx, by + 1.5, bz);
            // Cabin
            makeBox(6, 3, 4, 0xEEEECC, bx - 1, by + 4.5, bz);
            // Mast
            makeCylinder(0.15, 0.15, 12, 6, 0xAAAAAA, bx, by + 12, bz);
            // Boom
            makeBox(8, 0.2, 0.2, 0xAAAAAA, bx + 2, by + 10, bz);
            // Fender spheres
            makeSphere(0.5, 5, 5, 0x333333, bx - 5.5, by + 1, bz - 2);
            makeSphere(0.5, 5, 5, 0x333333, bx - 5.5, by + 1, bz + 2);
        }
    }

    function buildYachts() {
        var yachtData = [
            [13600, 0, 55, 0xFFFFFF],
            [13625, 0, 57, 0xFFEECC],
            [13650, 0, 54, 0xFFFFFF],
            [13670, 0, 56, 0xDDEEFF]
        ];
        for (var i = 0; i < yachtData.length; i++) {
            var yx = yachtData[i][0];
            var yy = yachtData[i][1];
            var yz = yachtData[i][2];
            var yc = yachtData[i][3];
            // Hull
            makeBox(14, 2.5, 4.5, yc, yx, yy + 1.25, yz);
            // Cabin
            makeBox(7, 2.5, 3.5, yc, yx, yy + 3.75, yz);
            // Tall mast
            makeCylinder(0.12, 0.12, 18, 6, 0xCCCCCC, yx, yy + 15, yz);
            // Sail (cone approximation)
            makeCone(4, 14, 4, 0xFFFFFF, yx, yy + 14, yz, 0.785);
        }
    }

    function buildHarbourWater() {
        // Poole Harbour — vast shallow water body
        makeBox(800, 0.5, 600, 0x1A6B8A, 13480, -1, 200);
        // Shallow mud banks
        makeBox(60, 0.4, 40, 0x8B7355, 13380, -0.5, 180);
        makeBox(80, 0.4, 50, 0x9B8565, 13560, -0.5, 220);
        makeBox(50, 0.4, 35, 0x8B7355, 13620, -0.5, 150);
        makeBox(40, 0.4, 30, 0x9B8565, 13320, -0.5, 250);
    }

    function buildChannelMarkers() {
        // Buoys and channel markers in harbour
        var markerData = [
            [13430, 0, 100, 0xCC0000],
            [13470, 0, 130, 0x006600],
            [13510, 0, 160, 0xCC0000],
            [13450, 0, 190, 0x006600],
            [13490, 0, 220, 0xCC0000],
            [13530, 0, 250, 0x006600],
            [13400, 0, 120, 0xFF8800],
            [13560, 0, 140, 0xFF8800]
        ];
        for (var i = 0; i < markerData.length; i++) {
            var mx = markerData[i][0];
            var mz = markerData[i][2];
            var mc = markerData[i][3];
            // Float
            makeCylinder(1.2, 1.2, 2, 8, mc, mx, 1.5, mz);
            // Topmark cone
            makeCone(0.8, 1.5, 6, mc, mx, 3.25, mz);
            // Anchor chain (cylinder going down)
            makeCylinder(0.1, 0.1, 3, 4, 0x555555, mx, -0.5, mz);
        }
    }

    function buildOysterBeds() {
        // Oyster bed frames visible at low tide
        var oysterPos = [
            [13350, 0, 280],
            [13370, 0, 295],
            [13390, 0, 280],
            [13340, 0, 310],
            [13360, 0, 320]
        ];
        for (var i = 0; i < oysterPos.length; i++) {
            var ox = oysterPos[i][0];
            var oz = oysterPos[i][2];
            makeBox(15, 0.3, 3, 0x8B7355, ox, -0.3, oz);
            makeBox(3, 0.3, 12, 0x8B7355, ox - 6, -0.3, oz + 2);
            makeBox(3, 0.3, 12, 0x8B7355, ox + 6, -0.3, oz + 2);
        }
    }

    function buildChainFerry() {
        // Chain ferry crossing between Sandbanks and Shell Bay
        // Ferry vessel
        makeBox(20, 3, 10, 0x888888, 13780, 1.5, 350);
        makeBox(20, 2, 8, 0xCCCCCC, 13780, 4, 350);
        // Control cabin
        makeBox(6, 4, 6, 0xAAAA88, 13780, 7, 350);
        // Funnel
        makeCylinder(0.8, 1, 3, 8, 0x333333, 13780, 9.5, 350);
        // Chain (line of small cylinders)
        for (var ci = 0; ci < 20; ci++) {
            makeCylinder(0.2, 0.2, 4, 4, 0x666666, 13700 + ci * 8, -0.2, 350);
        }
        // Ferry terminal ramps both sides
        makeBox(20, 0.5, 8, 0x888888, 13770, 0.25, 340);
        makeBox(20, 0.5, 8, 0x888888, 13790, 0.25, 362);
    }

    function buildSandbanks() {
        // Sandbanks peninsula — narrow sand spit
        // Sand ground
        makeBox(180, 1, 60, 0xF4D070, 13760, -0.5, 420);
        // Golden sand beach
        makeBox(180, 0.5, 20, 0xF5DEB3, 13760, -0.3, 450);
        // Water on other side (Shell Bay)
        makeBox(180, 0.3, 40, 0x1A7AA0, 13760, -0.6, 395);

        // Expensive beach houses
        var houseData = [
            [13690, 0, 430, 0xF5F5DC],
            [13710, 0, 428, 0xE8D5B0],
            [13730, 0, 432, 0xDDCCAA],
            [13750, 0, 430, 0xF0E8D0],
            [13770, 0, 428, 0xEEDDCC],
            [13790, 0, 430, 0xF5ECD8],
            [13810, 0, 432, 0xE8D5B0],
            [13830, 0, 430, 0xF0E0C8]
        ];
        for (var i = 0; i < houseData.length; i++) {
            var hx = houseData[i][0];
            var hz = houseData[i][2];
            var hc = houseData[i][3];
            // House body
            makeBox(14, 8, 12, hc, hx, 4, hz);
            // Flat/low-pitch roof (modern beach house)
            makeBox(16, 1, 14, 0x888888, hx, 8.5, hz);
            // Large windows (floor to ceiling - beach house style)
            makeBox(6, 5, 0.3, 0xAADDFF, hx - 2, 5, hz - 6.1);
            makeBox(6, 5, 0.3, 0xAADDFF, hx + 2, 5, hz - 6.1);
            // Balcony
            makeBox(14, 0.3, 4, 0xAAAAAA, hx, 8.7, hz + 5);
            // Garage
            makeBox(7, 5, 6, 0xCCBBA8, hx - 8.5, 2.5, hz - 3);
        }

        // Chain ferry terminal on Sandbanks side
        makeBox(25, 2, 12, 0x888888, 13770, 1, 385);
        makeBox(12, 6, 10, 0xCCCC88, 13770, 4, 382);
        makeCone(7, 3, 4, 0xAA8844, 13770, 7.5, 382, 0.785);
    }

    function buildBrownsea() {
        // Brownsea Island — in harbour
        // Island ground mass
        makeSphere(90, 12, 8, 0x3A7A3A, 13200, -5, 300);
        makeBox(140, 8, 100, 0x4A8A4A, 13200, -1, 300);
        // Beach/shoreline
        makeBox(140, 0.5, 15, 0xF4D070, 13200, 0.2, 345);
        makeBox(140, 0.5, 15, 0xF4D070, 13200, 0.2, 253);

        // Brownsea Castle
        makeBox(20, 14, 18, 0xC8A87A, 13180, 7, 290);
        // Castle towers
        makeCylinder(3.5, 3.5, 16, 8, 0xBB9966, 13170, 8, 282);
        makeCylinder(3.5, 3.5, 16, 8, 0xBB9966, 13190, 8, 282);
        makeCylinder(3.5, 3.5, 16, 8, 0xBB9966, 13170, 8, 298);
        makeCylinder(3.5, 3.5, 16, 8, 0xBB9966, 13190, 8, 298);
        // Castle battlements
        makeBox(24, 2, 2, 0xBB9966, 13180, 17, 282);
        makeBox(24, 2, 2, 0xBB9966, 13180, 17, 298);
        makeBox(2, 2, 20, 0xBB9966, 13168, 17, 290);
        makeBox(2, 2, 20, 0xBB9966, 13192, 17, 290);
        // Castle gate
        makeBox(5, 6, 0.5, 0x4A2F1A, 13180, 3, 282.3);

        // Scout camp site - BP memorial area
        // Camp fire pit
        makeCylinder(2, 2.5, 0.5, 8, 0x555555, 13230, 0.25, 320);
        makeCone(1, 3, 6, 0xFF6600, 13230, 1.75, 320);
        // Tents
        var tentPos = [
            [13235, 0, 315],
            [13240, 0, 325],
            [13245, 0, 312],
            [13225, 0, 328],
            [13220, 0, 315]
        ];
        for (var i = 0; i < tentPos.length; i++) {
            makeCone(2.5, 3, 4, 0x8B6914, tentPos[i][0], 1.5, tentPos[i][2]);
            makeBox(4, 0.2, 5, 0x7A5C14, tentPos[i][0], 0.1, tentPos[i][2]);
        }
        // Baden-Powell memorial stone
        makeBox(2, 3, 2, 0x888888, 13228, 1.5, 306);
        makeBox(3, 0.4, 3, 0x999999, 13228, 3.2, 306);

        // Woodland trees
        var treePos = [
            [13150, 0, 270], [13160, 0, 290], [13170, 0, 310],
            [13155, 0, 330], [13165, 0, 285], [13200, 0, 265],
            [13210, 0, 275], [13215, 0, 330], [13205, 0, 340],
            [13240, 0, 270], [13250, 0, 265], [13245, 0, 340],
            [13260, 0, 280], [13255, 0, 305], [13248, 0, 325]
        ];
        for (var i = 0; i < treePos.length; i++) {
            makeCylinder(0.5, 0.7, 7, 6, 0x5C3A1A, treePos[i][0], 3.5, treePos[i][2]);
            makeSphere(4, 7, 6, 0x2A6A2A, treePos[i][0], 9, treePos[i][2]);
        }

        // Red squirrel habitat signs (small posts)
        makeBox(0.3, 2, 0.3, 0x8B4513, 13220, 1, 298);
        makeBox(2, 1.5, 0.1, 0xDD4422, 13220, 2.75, 298);
        makeBox(0.3, 2, 0.3, 0x8B4513, 13240, 1, 302);
        makeBox(2, 1.5, 0.1, 0xDD4422, 13240, 2.75, 302);

        // Brownsea lighthouse
        makeCylinder(2.5, 3, 18, 8, 0xFFFFFF, 13255, 9, 275);
        makeCylinder(3, 3, 1, 8, 0xFFFFFF, 13255, 18.5, 275);
        makeCylinder(1.5, 1.5, 3, 8, 0xFFDD00, 13255, 20, 275);
        makeCone(3, 3, 8, 0xCC3333, 13255, 22.5, 275);
    }

    function buildPooleMuseum() {
        // Medieval merchant's warehouse converted to museum
        // Main building - old warehouse style
        makeBox(35, 16, 22, 0xC8A878, 13420, 8, -45);
        // Older stone base
        makeBox(37, 4, 24, 0x9A8A6A, 13420, 2, -45);
        // Warehouse roof - pitched
        makeBox(37, 1, 24, 0x6A4A2A, 13420, 16.5, -45);
        makeCone(18, 6, 4, 0x5A3A1A, 13420, 19.5, -45, 0.785);
        // Loading hoist beam
        makeBox(4, 0.5, 0.5, 0x5C3A1A, 13432, 17, -55.5);
        makeBox(0.5, 6, 0.5, 0x5C3A1A, 13432, 14.5, -56);
        // Old Cellars lower level
        makeBox(35, 4, 22, 0x7A6A5A, 13420, -2, -45);
        // Museum entrance
        makeBox(6, 8, 0.5, 0x4A3A2A, 13420, 4, -56.5);
        makeBox(8, 1, 3, 0x8B7355, 13420, 8.5, -57);
        // Museum sign
        makeBox(8, 2, 0.3, 0x2A4A7A, 13420, 11, -56.6);
        // Medieval arched windows
        makeBox(3, 4, 0.3, 0xADD8E6, 13408, 9, -56.6);
        makeBox(3, 4, 0.3, 0xADD8E6, 13414, 9, -56.6);
        makeBox(3, 4, 0.3, 0xADD8E6, 13426, 9, -56.6);
        makeBox(3, 4, 0.3, 0xADD8E6, 13432, 9, -56.6);
        // Artifacts outside - anchor
        makeCylinder(0.3, 0.3, 6, 6, 0x555555, 13408, 3, -58);
        makeSphere(1, 6, 6, 0x555555, 13408, 6.3, -58);
        // Old cannon
        makeCylinder(0.6, 0.8, 5, 8, 0x333333, 13432, 1.5, -58);
        makeBox(5, 1, 2, 0x6B4226, 13432, 0.8, -58);
    }

    function buildTwinSailsBridge() {
        // Twin Sails Bridge — modern bascule bridge with two triangular sails
        var bridgeX = 13480;
        var bridgeZ = 80;

        // Bridge deck
        makeBox(80, 2, 12, 0x888888, bridgeX, 1, bridgeZ);
        // Road surface
        makeBox(78, 0.3, 10, 0x555555, bridgeX, 2.15, bridgeZ);

        // Bridge bascule sections (the lifting parts - shown in raised position as sails)
        // Left sail - triangular bascule raised at angle
        makeBox(2, 30, 3, 0x999999, bridgeX - 18, 17, bridgeZ - 4);
        makeBox(2, 30, 3, 0x999999, bridgeX - 18, 17, bridgeZ + 4);
        makeBox(20, 2, 3, 0x999999, bridgeX - 28, 32, bridgeZ - 4);
        makeBox(20, 2, 3, 0x999999, bridgeX - 28, 32, bridgeZ + 4);
        // Left sail diagonal strut
        makeBox(32, 2, 3, 0xAAAAAA, bridgeX - 23, 17, bridgeZ - 4, 0, 0, 0.6);
        makeBox(32, 2, 3, 0xAAAAAA, bridgeX - 23, 17, bridgeZ + 4, 0, 0, 0.6);

        // Right sail - mirrored
        makeBox(2, 30, 3, 0x999999, bridgeX + 18, 17, bridgeZ - 4);
        makeBox(2, 30, 3, 0x999999, bridgeX + 18, 17, bridgeZ + 4);
        makeBox(20, 2, 3, 0x999999, bridgeX + 28, 32, bridgeZ - 4);
        makeBox(20, 2, 3, 0x999999, bridgeX + 28, 32, bridgeZ + 4);
        // Right sail diagonal strut
        makeBox(32, 2, 3, 0xAAAAAA, bridgeX + 23, 17, bridgeZ - 4, 0, 0, -0.6);
        makeBox(32, 2, 3, 0xAAAAAA, bridgeX + 23, 17, bridgeZ + 4, 0, 0, -0.6);

        // Bridge piers / abutments
        makeBox(10, 6, 14, 0x777777, bridgeX - 38, 3, bridgeZ);
        makeBox(10, 6, 14, 0x777777, bridgeX + 38, 3, bridgeZ);
        makeBox(8, 6, 14, 0x777777, bridgeX - 12, 3, bridgeZ);
        makeBox(8, 6, 14, 0x777777, bridgeX + 12, 3, bridgeZ);

        // Safety railings
        makeBox(80, 0.5, 0.3, 0xAAAAAA, bridgeX, 3.25, bridgeZ - 6);
        makeBox(80, 0.5, 0.3, 0xAAAAAA, bridgeX, 3.25, bridgeZ + 6);
    }

    function buildStreetFurniture() {
        // Lampposts along quay
        var lampPos = [
            13340, 13360, 13380, 13400, 13420, 13440,
            13460, 13480, 13500, 13520, 13540, 13560,
            13580, 13600, 13620, 13640
        ];
        for (var i = 0; i < lampPos.length; i++) {
            makeCylinder(0.15, 0.2, 6, 6, 0x444444, lampPos[i], 3, 36);
            makeSphere(0.6, 6, 6, 0xFFEE88, lampPos[i], 6.5, 36);
        }
        // Mooring bollards
        var bollardPos = [
            [13440, 0, 42], [13450, 0, 42], [13460, 0, 42],
            [13470, 0, 42], [13480, 0, 42], [13490, 0, 42],
            [13500, 0, 42], [13510, 0, 42], [13520, 0, 42],
            [13530, 0, 42], [13540, 0, 42]
        ];
        for (var i = 0; i < bollardPos.length; i++) {
            makeCylinder(0.6, 0.5, 1.2, 6, 0x333333, bollardPos[i][0], 0.6, bollardPos[i][2]);
            makeSphere(0.7, 5, 5, 0x222222, bollardPos[i][0], 1.5, bollardPos[i][2]);
        }
        // Heritage information boards
        makeBox(3, 2, 0.2, 0x2A4A2A, 13480, 2, 35);
        makeBox(0.2, 2.5, 0.2, 0x333333, 13479, 1.25, 35);
        makeBox(0.2, 2.5, 0.2, 0x333333, 13481, 1.25, 35);
        // Benches
        makeBox(4, 0.4, 1, 0x8B6914, 13455, 0.8, 37);
        makeBox(0.2, 1.5, 1, 0x8B6914, 13453, 1, 37);
        makeBox(0.2, 1.5, 1, 0x8B6914, 13457, 1, 37);
        makeBox(4, 0.4, 1, 0x8B6914, 13500, 0.8, 37);
        makeBox(0.2, 1.5, 1, 0x8B6914, 13498, 1, 37);
        makeBox(0.2, 1.5, 1, 0x8B6914, 13502, 1, 37);
        // Heritage anchor monument
        makeCylinder(0.8, 0.8, 5, 8, 0x555555, 13480, 2.5, 30);
        makeBox(8, 0.6, 0.6, 0x444444, 13480, 1, 30);
        makeBox(0.6, 0.6, 4, 0x444444, 13480, 3.5, 30);
        makeSphere(1.2, 6, 6, 0x333333, 13480, 5.6, 30);
    }

    function buildOldTown() {
        // Old Town area behind quay - additional medieval buildings
        var oldTownData = [
            [13350, 0, -55, 0xCC9966, 14, 18],
            [13375, 0, -60, 0xBB8855, 16, 16],
            [13395, 0, -55, 0xDD9977, 13, 20],
            [13415, 0, -62, 0xCC8866, 15, 17],
            [13435, 0, -58, 0xBB9A6A, 12, 15],
            [13455, 0, -60, 0xCC8855, 14, 18]
        ];
        for (var i = 0; i < oldTownData.length; i++) {
            var ox = oldTownData[i][0];
            var oz = oldTownData[i][2];
            var oc = oldTownData[i][3];
            var ow = oldTownData[i][4];
            var oh = oldTownData[i][5];
            makeBox(ow, oh, 14, oc, ox, oh / 2, oz);
            makeCone(ow * 0.7, 5, 4, 0x7A3A3A, ox, oh + 2.5, oz, 0.785);
            makeCylinder(0.4, 0.4, 2.5, 6, 0x444444, ox + 3, oh + 5.75, oz);
        }
        // St James Church
        makeBox(18, 20, 22, 0xC8C0B0, 13355, 10, -80);
        // Bell tower
        makeBox(7, 28, 7, 0xC8C0B0, 13344, 14, -80);
        makeCone(4, 8, 4, 0x555555, 13344, 29, -80, 0.785);
        // Church windows (arched - approximated)
        makeBox(3, 5, 0.3, 0x88AACC, 13348, 12, -91.1);
        makeBox(3, 5, 0.3, 0x88AACC, 13355, 12, -91.1);
        makeBox(3, 5, 0.3, 0x88AACC, 13362, 12, -91.1);
        // Church graveyard
        makeBox(40, 0.2, 25, 0x3A5A3A, 13355, 0.1, -100);
        // Headstones
        for (var g = 0; g < 8; g++) {
            makeBox(1, 1.5, 0.2, 0x888888, 13340 + g * 4, 0.75, -98);
            makeBox(1, 1.5, 0.2, 0x888888, 13340 + g * 4, 0.75, -103);
        }
    }

    function build() {
        buildQuayFloor();
        buildMerchantBuildings();
        buildCustomsHouse();
        buildFishMarket();
        buildHarbourMaster();
        buildFishingBoats();
        buildYachts();
        buildHarbourWater();
        buildChannelMarkers();
        buildOysterBeds();
        buildChainFerry();
        buildSandbanks();
        buildBrownsea();
        buildPooleMuseum();
        buildTwinSailsBridge();
        buildStreetFurniture();
        buildOldTown();
    }

    function update(delta) {
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
