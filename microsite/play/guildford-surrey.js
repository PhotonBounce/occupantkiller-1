window.GuildfordSurrey = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildCastle() {
        var ox = 10240;
        var oz = -80;
        var stoneColor = 0x8B8682;
        var darkStone = 0x6B6560;

        // Castle keep base — square tower 10x10x14
        addMesh(makeBox(10, 14, 10, stoneColor, ox, 7, oz));

        // Keep inner floor details (darker band)
        addMesh(makeBox(10, 1, 10, darkStone, ox, 14, oz));

        // Crenellated parapet — 8 merlons around top
        var merlonColor = 0x7A7570;
        var merlonPositions = [
            [ox - 4, 15.5, oz - 4],
            [ox - 1.5, 15.5, oz - 4],
            [ox + 1.5, 15.5, oz - 4],
            [ox + 4, 15.5, oz - 4],
            [ox - 4, 15.5, oz + 4],
            [ox - 1.5, 15.5, oz + 4],
            [ox + 1.5, 15.5, oz + 4],
            [ox + 4, 15.5, oz + 4],
            [ox - 4, 15.5, oz - 1.5],
            [ox - 4, 15.5, oz + 1.5],
            [ox + 4, 15.5, oz - 1.5],
            [ox + 4, 15.5, oz + 1.5]
        ];
        for (var mi = 0; mi < merlonPositions.length; mi++) {
            addMesh(makeBox(2, 2, 2, merlonColor, merlonPositions[mi][0], merlonPositions[mi][1], merlonPositions[mi][2]));
        }

        // Castle entrance arch base
        addMesh(makeBox(3, 6, 1, darkStone, ox, 3, oz + 5));

        // Inner bailey walls — four walls forming enclosure
        addMesh(makeBox(30, 5, 1, stoneColor, ox, 2.5, oz + 18));
        addMesh(makeBox(30, 5, 1, stoneColor, ox, 2.5, oz - 18));
        addMesh(makeBox(1, 5, 36, stoneColor, ox - 15, 2.5, oz));
        addMesh(makeBox(1, 5, 36, stoneColor, ox + 15, 2.5, oz));

        // Bailey corner towers
        var corners = [
            [ox - 15, oz - 18],
            [ox + 15, oz - 18],
            [ox - 15, oz + 18],
            [ox + 15, oz + 18]
        ];
        for (var ci = 0; ci < corners.length; ci++) {
            addMesh(makeBox(3, 7, 3, stoneColor, corners[ci][0], 3.5, corners[ci][1]));
        }

        // Castle mound / earthwork
        addMesh(makeCylinder(12, 18, 4, 8, 0x5C4A2A, ox, -2, oz));
    }

    function buildGuildhall() {
        var ox = 10240;
        var oz = 40;
        var timberColor = 0x3D2B1F;
        var plasterColor = 0xF5F0E0;
        var roofColor = 0x4A3728;

        // Main building body
        addMesh(makeBox(12, 8, 6, plasterColor, ox, 4, oz));

        // Timber frame verticals (front)
        for (var tf = -5; tf <= 5; tf += 2.5) {
            addMesh(makeBox(0.3, 8, 0.3, timberColor, ox + tf, 4, oz - 3));
        }

        // Timber frame horizontals (front)
        addMesh(makeBox(12, 0.3, 0.3, timberColor, ox, 2, oz - 3));
        addMesh(makeBox(12, 0.3, 0.3, timberColor, ox, 5, oz - 3));
        addMesh(makeBox(12, 0.3, 0.3, timberColor, ox, 8, oz - 3));

        // Upper floor — jettied (overhanging)
        addMesh(makeBox(13, 4, 6.5, plasterColor, ox, 10, oz));

        // Upper timber frame
        for (var utf = -5.5; utf <= 5.5; utf += 2.75) {
            addMesh(makeBox(0.3, 4, 0.3, timberColor, ox + utf, 10, oz - 3.2));
        }

        // Roof — pitched
        addMesh(makeCone(9, 4, 4, roofColor, ox, 14, oz));

        // Clock bracket projecting over street
        addMesh(makeBox(0.3, 0.3, 3, timberColor, ox - 2, 9, oz - 4.5));
        addMesh(makeBox(0.3, 0.3, 3, timberColor, ox + 2, 9, oz - 4.5));
        addMesh(makeBox(5, 0.3, 0.3, timberColor, ox, 9, oz - 6));
        // Clock face
        addMesh(makeSphere(1, 8, 8, 0xD4AF37, ox, 9.5, oz - 6));
        // Clock support arm
        addMesh(makeBox(0.2, 2, 0.2, timberColor, ox, 8, oz - 6));

        // Windows — arched top suggestion via stacked boxes
        addMesh(makeBox(1.5, 2, 0.2, 0x87CEEB, ox - 3, 4, oz - 3.1));
        addMesh(makeBox(1.5, 2, 0.2, 0x87CEEB, ox, 4, oz - 3.1));
        addMesh(makeBox(1.5, 2, 0.2, 0x87CEEB, ox + 3, 4, oz - 3.1));

        // Doorway
        addMesh(makeBox(2, 3, 0.2, timberColor, ox, 1.5, oz - 3.1));

        // Steps up to entrance
        addMesh(makeBox(4, 0.4, 1, 0x888888, ox, 0.2, oz - 3.5));
        addMesh(makeBox(3, 0.4, 1, 0x888888, ox, 0.6, oz - 4.0));
    }

    function buildHighStreet() {
        var ox = 10240;
        var oz = 120;
        var shopColors = [0xD2691E, 0xBC8F5F, 0xCD853F, 0xA0785A, 0xC4956A, 0xB8860B];
        var roofColors = [0x8B0000, 0x6B4423, 0x8B4513, 0x7A3B1E, 0x6B3A2A, 0x5C2E1A];
        var cobbleColor = 0x888070;
        var plasterColor = 0xF0E8D0;

        // Cobbled road surface
        addMesh(makeBox(60, 0.2, 10, cobbleColor, ox, 0.1, oz));

        // Cobble texture suggestion — rows of stones
        for (var csi = 0; csi < 12; csi++) {
            addMesh(makeBox(58, 0.1, 0.4, 0x706860, ox, 0.25, oz - 4.5 + csi * 0.8));
        }

        // 6 shops on left side
        for (var sl = 0; sl < 6; sl++) {
            var shopX = ox - 22.5 + sl * 9;
            var shopColor = shopColors[sl];
            var roofColor = roofColors[sl];

            // Shop body
            addMesh(makeBox(8, 6, 8, plasterColor, shopX, 3, oz - 9));

            // Timber frame accent
            addMesh(makeBox(8, 0.3, 0.3, 0x3D2B1F, shopX, 4.5, oz - 5));
            addMesh(makeBox(0.3, 6, 0.3, 0x3D2B1F, shopX - 3.8, 3, oz - 5));
            addMesh(makeBox(0.3, 6, 0.3, 0x3D2B1F, shopX + 3.8, 3, oz - 5));

            // Bow window — projecting forward
            addMesh(makeBox(3, 2.5, 1.5, shopColor, shopX, 2.5, oz - 4.2));
            addMesh(makeBox(3, 2.5, 0.1, 0x87CEEB, shopX, 2.5, oz - 3.45));

            // Shop sign board
            addMesh(makeBox(4, 0.8, 0.1, shopColor, shopX, 5.5, oz - 4.9));

            // Roof pitched
            addMesh(makeCone(6, 3.5, 4, roofColor, shopX, 7.75, oz - 9));

            // Chimney
            addMesh(makeBox(0.8, 2, 0.8, 0x6B6560, shopX + 2, 9, oz - 9));
        }

        // 6 shops on right side
        for (var sr = 0; sr < 6; sr++) {
            var shopXr = ox - 22.5 + sr * 9;
            var shopColorR = shopColors[5 - sr];
            var roofColorR = roofColors[5 - sr];

            // Shop body
            addMesh(makeBox(8, 6, 8, plasterColor, shopXr, 3, oz + 9));

            // Timber frame accent
            addMesh(makeBox(8, 0.3, 0.3, 0x3D2B1F, shopXr, 4.5, oz + 5));
            addMesh(makeBox(0.3, 6, 0.3, 0x3D2B1F, shopXr - 3.8, 3, oz + 5));
            addMesh(makeBox(0.3, 6, 0.3, 0x3D2B1F, shopXr + 3.8, 3, oz + 5));

            // Bow window
            addMesh(makeBox(3, 2.5, 1.5, shopColorR, shopXr, 2.5, oz + 4.2));
            addMesh(makeBox(3, 2.5, 0.1, 0x87CEEB, shopXr, 2.5, oz + 3.45));

            // Shop sign board
            addMesh(makeBox(4, 0.8, 0.1, shopColorR, shopXr, 5.5, oz + 4.9));

            // Roof pitched
            addMesh(makeCone(6, 3.5, 4, roofColorR, shopXr, 7.75, oz + 9));

            // Chimney
            addMesh(makeBox(0.8, 2, 0.8, 0x6B6560, shopXr - 2, 9, oz + 9));
        }
    }

    function buildRiverWey() {
        var ox = 10240;
        var oz = 220;
        var waterColor = 0x2E6EA6;
        var stoneColor = 0x8B8682;
        var pathColor = 0xC8B89A;

        // River water — wide blue strip
        addMesh(makeBox(80, 0.2, 16, waterColor, ox, 0.05, oz));

        // River banks — stone edges
        addMesh(makeBox(82, 0.8, 1, stoneColor, ox, 0.4, oz - 8));
        addMesh(makeBox(82, 0.8, 1, stoneColor, ox, 0.4, oz + 8));

        // Riverside path — north bank
        addMesh(makeBox(80, 0.2, 6, pathColor, ox, 0.1, oz - 11));

        // Riverside path — south bank
        addMesh(makeBox(80, 0.2, 6, pathColor, ox, 0.1, oz + 11));

        // Path edging stones
        addMesh(makeBox(80, 0.3, 0.4, stoneColor, ox, 0.15, oz - 13.8));
        addMesh(makeBox(80, 0.3, 0.4, stoneColor, ox, 0.15, oz + 13.8));

        // Stone bridge — 3 arches spanning river
        // Bridge deck
        addMesh(makeBox(14, 1, 6, stoneColor, ox, 2, oz));

        // Bridge parapets
        addMesh(makeBox(14, 1, 0.4, stoneColor, ox, 2.5, oz - 3));
        addMesh(makeBox(14, 1, 0.4, stoneColor, ox, 2.5, oz + 3));

        // Bridge piers (3 arches = 2 piers in water)
        addMesh(makeBox(1.5, 3, 5, stoneColor, ox - 3.5, 1.5, oz));
        addMesh(makeBox(1.5, 3, 5, stoneColor, ox + 3.5, 1.5, oz));

        // Arch soffits — dark underside blocks
        addMesh(makeBox(2.5, 1, 4.5, 0x5A5550, ox - 7, 1, oz));
        addMesh(makeBox(2.5, 1, 4.5, 0x5A5550, ox, 1, oz));
        addMesh(makeBox(2.5, 1, 4.5, 0x5A5550, ox + 7, 1, oz));

        // Abutments — bridge ends meeting banks
        addMesh(makeBox(3, 3, 6, stoneColor, ox - 8.5, 1.5, oz));
        addMesh(makeBox(3, 3, 6, stoneColor, ox + 8.5, 1.5, oz));

        // Bridge approach ramp north
        addMesh(makeBox(6, 0.5, 6, stoneColor, ox, 1, oz - 11));
        // Bridge approach ramp south
        addMesh(makeBox(6, 0.5, 6, stoneColor, ox, 1, oz + 11));

        // Riverside benches
        for (var bi = 0; bi < 4; bi++) {
            addMesh(makeBox(2, 0.3, 0.6, 0x8B6914, ox - 20 + bi * 13, 0.45, oz - 13));
            addMesh(makeBox(0.2, 0.8, 0.6, 0x8B6914, ox - 21 + bi * 13, 0.4, oz - 13));
            addMesh(makeBox(0.2, 0.8, 0.6, 0x8B6914, ox - 19 + bi * 13, 0.4, oz - 13));
        }
    }

    function buildStMarysChurch() {
        var ox = 10240;
        var oz = -200;
        var flintColor = 0x6B6B5E;
        var mortarColor = 0xA09888;
        var roofColor = 0x4A4A3E;
        var leadsColor = 0x708090;

        // Nave body
        addMesh(makeBox(24, 8, 12, flintColor, ox, 4, oz));

        // Nave roof — pitched lead
        addMesh(makeCone(15, 4, 4, leadsColor, ox, 10, oz));

        // Chancel — east end extension
        addMesh(makeBox(10, 7, 10, flintColor, ox + 17, 3.5, oz));
        addMesh(makeCone(7, 3.5, 4, leadsColor, ox + 17, 8.75, oz));

        // Flint stone tower — square, tall
        addMesh(makeBox(8, 22, 8, flintColor, ox - 16, 11, oz));

        // Tower darker stone banding
        addMesh(makeBox(8, 0.4, 8, mortarColor, ox - 16, 6, oz));
        addMesh(makeBox(8, 0.4, 8, mortarColor, ox - 16, 12, oz));
        addMesh(makeBox(8, 0.4, 8, mortarColor, ox - 16, 18, oz));

        // Tower belfry openings
        addMesh(makeBox(1.5, 2.5, 0.2, 0x222222, ox - 16, 20, oz - 4.1));
        addMesh(makeBox(1.5, 2.5, 0.2, 0x222222, ox - 16, 20, oz + 4.1));
        addMesh(makeBox(0.2, 2.5, 1.5, 0x222222, ox - 20.1, 20, oz));
        addMesh(makeBox(0.2, 2.5, 1.5, 0x222222, ox - 11.9, 20, oz));

        // Tower crenellations
        var towerMerlonX = ox - 16;
        var towerMerlonY = 23.5;
        var towerMerlonZ = oz;
        var towerMerlons = [
            [towerMerlonX - 3, towerMerlonY, towerMerlonZ - 3],
            [towerMerlonX - 1, towerMerlonY, towerMerlonZ - 3],
            [towerMerlonX + 1, towerMerlonY, towerMerlonZ - 3],
            [towerMerlonX + 3, towerMerlonY, towerMerlonZ - 3],
            [towerMerlonX - 3, towerMerlonY, towerMerlonZ + 3],
            [towerMerlonX - 1, towerMerlonY, towerMerlonZ + 3],
            [towerMerlonX + 1, towerMerlonY, towerMerlonZ + 3],
            [towerMerlonX + 3, towerMerlonY, towerMerlonZ + 3],
            [towerMerlonX - 3, towerMerlonY, towerMerlonZ - 1],
            [towerMerlonX - 3, towerMerlonY, towerMerlonZ + 1],
            [towerMerlonX + 3, towerMerlonY, towerMerlonZ - 1],
            [towerMerlonX + 3, towerMerlonY, towerMerlonZ + 1]
        ];
        for (var tm = 0; tm < towerMerlons.length; tm++) {
            addMesh(makeBox(1.5, 1.5, 1.5, flintColor, towerMerlons[tm][0], towerMerlons[tm][1], towerMerlons[tm][2]));
        }

        // Porch entrance
        addMesh(makeBox(4, 5, 3, flintColor, ox - 4, 2.5, oz - 7.5));
        addMesh(makeCone(3, 2, 4, leadsColor, ox - 4, 6, oz - 7.5));

        // Flying buttress suggestion — angled box supports either side of nave
        var buttressPositions = [
            [ox - 8, 5, oz - 7],
            [ox, 5, oz - 7],
            [ox + 8, 5, oz - 7],
            [ox - 8, 5, oz + 7],
            [ox, 5, oz + 7],
            [ox + 8, 5, oz + 7]
        ];
        for (var bp = 0; bp < buttressPositions.length; bp++) {
            addMesh(makeBox(1.5, 6, 2, flintColor, buttressPositions[bp][0], buttressPositions[bp][1], buttressPositions[bp][2]));
        }

        // Stained glass windows — colored panels in nave
        var windowColors = [0x4169E1, 0x8B0000, 0x006400, 0x8B008B, 0x8B4513, 0xFF8C00];
        for (var wi = 0; wi < 6; wi++) {
            addMesh(makeBox(0.2, 2.5, 1.8, windowColors[wi], ox - 10 + wi * 4, 5, oz - 6.1));
            addMesh(makeBox(0.2, 2.5, 1.8, windowColors[5 - wi], ox - 10 + wi * 4, 5, oz + 6.1));
        }

        // Churchyard wall
        addMesh(makeBox(50, 1.5, 0.6, flintColor, ox, 0.75, oz - 20));
        addMesh(makeBox(50, 1.5, 0.6, flintColor, ox, 0.75, oz + 20));
        addMesh(makeBox(0.6, 1.5, 40, flintColor, ox - 25, 0.75, oz));
        addMesh(makeBox(0.6, 1.5, 40, flintColor, ox + 25, 0.75, oz));

        // Churchyard gate pillars
        addMesh(makeBox(0.8, 2.5, 0.8, mortarColor, ox - 2, 1.25, oz - 20));
        addMesh(makeBox(0.8, 2.5, 0.8, mortarColor, ox + 2, 1.25, oz - 20));

        // Grave markers
        for (var gi = 0; gi < 8; gi++) {
            addMesh(makeBox(0.3, 1.2, 0.1, mortarColor, ox - 18 + gi * 5, 0.6, oz - 15));
            addMesh(makeBox(0.3, 1.0, 0.1, mortarColor, ox - 16 + gi * 5, 0.5, oz - 13));
        }
    }

    function buildGroundPlane() {
        var groundColor = 0x5A7A3A;
        var pathColor = 0xC8B89A;
        var ox = 10240;

        // Main ground area
        addMesh(makeBox(300, 0.2, 300, groundColor, ox, -0.1, 0));

        // Castle grounds — gravel
        addMesh(makeBox(40, 0.15, 50, 0xC8B89A, ox, 0.05, -70));

        // High Street pavement north
        addMesh(makeBox(62, 0.15, 4, pathColor, ox, 0.05, 110));
        // High Street pavement south
        addMesh(makeBox(62, 0.15, 4, pathColor, ox, 0.05, 130));

        // Town square area
        addMesh(makeBox(30, 0.15, 30, 0xD2C9A0, ox, 0.05, 40));

        // Street lamp posts along High Street
        for (var lp = 0; lp < 6; lp++) {
            addMesh(makeCylinder(0.1, 0.15, 5, 6, 0x2C2C2C, ox - 24 + lp * 9, 2.5, 108));
            addMesh(makeSphere(0.3, 6, 6, 0xFFFFCC, ox - 24 + lp * 9, 5.2, 108));
            addMesh(makeCylinder(0.1, 0.15, 5, 6, 0x2C2C2C, ox - 24 + lp * 9, 2.5, 132));
            addMesh(makeSphere(0.3, 6, 6, 0xFFFFCC, ox - 24 + lp * 9, 5.2, 132));
        }

        // Trees along riverside
        for (var tr = 0; tr < 8; tr++) {
            var treeX = ox - 35 + tr * 10;
            addMesh(makeCylinder(0.3, 0.4, 4, 6, 0x5C3A1E, treeX, 2, 205));
            addMesh(makeSphere(2.5, 7, 6, 0x2D6A2D, treeX, 5.5, 205));
        }

        // Trees near castle
        for (var ct = 0; ct < 5; ct++) {
            addMesh(makeCylinder(0.25, 0.35, 3.5, 6, 0x5C3A1E, ox - 30 + ct * 8, 1.75, -50));
            addMesh(makeSphere(2, 7, 6, 0x2D6A2D, ox - 30 + ct * 8, 4.5, -50));
        }
    }

    function build() {
        buildGroundPlane();
        buildCastle();
        buildGuildhall();
        buildHighStreet();
        buildRiverWey();
        buildStMarysChurch();
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
