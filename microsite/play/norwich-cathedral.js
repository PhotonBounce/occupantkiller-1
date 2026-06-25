window.NorwichCathedral = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 15960;
    var OFFSET_Z = 0;

    function makeBox(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        return mesh;
    }

    function addToScene(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildNave() {
        // Long Norman nave: 50w x 18d x 22h
        var nave = makeBox(50, 22, 18, 0xE8D5B8, 0, 11, 0, 0, 0, 0);
        addToScene(nave);

        // Nave roof ridge along the top
        var roof = makeBox(50, 4, 6, 0xD8C5A8, 0, 24, 0, 0, 0, 0);
        addToScene(roof);

        // Transept crossing — widening the nave at mid-point
        var transept = makeBox(30, 20, 40, 0xE8D5B8, 0, 10, 0, 0, 0, 0);
        addToScene(transept);
    }

    function buildSpire() {
        // Base tower: 8w x 8d x 50h
        var tower = makeBox(8, 50, 8, 0xD8C5A8, 0, 47, 10, 0, 0, 0);
        addToScene(tower);

        // Tower second stage
        var towerStage2 = makeBox(7, 10, 7, 0xD0C8B0, 0, 77, 10, 0, 0, 0);
        addToScene(towerStage2);

        // Spire cone on top: r=5 h=24
        var spire = makeCone(5, 24, 8, 0xD0BDA0, 0, 94, 10, 0, 0, 0);
        addToScene(spire);

        // Corner turrets on tower
        var turretPositions = [
            [3, 3], [3, -3], [-3, 3], [-3, -3]
        ];
        for (var i = 0; i < turretPositions.length; i++) {
            var tp = turretPositions[i];
            var turret = makeBox(2, 14, 2, 0xD8C5A8, tp[0], 75, 10 + tp[1], 0, 0, 0);
            addToScene(turret);
            var turretCap = makeCone(1.2, 5, 6, 0xC8B898, tp[0], 84, 10 + tp[1], 0, 0, 0);
            addToScene(turretCap);
        }
    }

    function buildCloisters() {
        // 4 corridor sections forming a square, each 40x8x5
        var corridorDefs = [
            { x: 0,  z: 60, w: 40, d: 8,  rx: 0, ry: 0 },
            { x: 0,  z: 96, w: 40, d: 8,  rx: 0, ry: 0 },
            { x: -24, z: 78, w: 8,  d: 40, rx: 0, ry: 0 },
            { x: 24,  z: 78, w: 8,  d: 40, rx: 0, ry: 0 }
        ];

        for (var i = 0; i < corridorDefs.length; i++) {
            var cd = corridorDefs[i];
            var corridor = makeBox(cd.w, 5, cd.d, 0xE0CEB5, cd.x, 2.5, cd.z, 0, 0, 0);
            addToScene(corridor);
        }

        // Column pairs per side — 12 per side along north/south corridors
        var colColor = 0xD0BEA5;
        for (var j = 0; j < 12; j++) {
            var colX = -18 + j * 3.3;
            // North corridor columns
            var colN1 = makeBox(1, 6, 1, colColor, colX, 3, 57, 0, 0, 0);
            addToScene(colN1);
            var colN2 = makeBox(1, 6, 1, colColor, colX, 3, 63, 0, 0, 0);
            addToScene(colN2);
            // South corridor columns
            var colS1 = makeBox(1, 6, 1, colColor, colX, 3, 93, 0, 0, 0);
            addToScene(colS1);
            var colS2 = makeBox(1, 6, 1, colColor, colX, 3, 99, 0, 0, 0);
            addToScene(colS2);
        }

        // Column pairs per side — 12 per side along east/west corridors
        for (var k = 0; k < 12; k++) {
            var colZ = 60 + k * 3.3;
            var colE1 = makeBox(1, 6, 1, colColor, -21, 3, colZ, 0, 0, 0);
            addToScene(colE1);
            var colE2 = makeBox(1, 6, 1, colColor, -27, 3, colZ, 0, 0, 0);
            addToScene(colE2);
            var colW1 = makeBox(1, 6, 1, colColor, 21, 3, colZ, 0, 0, 0);
            addToScene(colW1);
            var colW2 = makeBox(1, 6, 1, colColor, 27, 3, colZ, 0, 0, 0);
            addToScene(colW2);
        }

        // Rib-vaulted ceiling implied by X-crossing BoxGeometry 0.5x0.5x40 at y=5
        var ribNS = makeBox(0.5, 0.5, 40, 0xC8B89A, 0, 5, 78, 0, 0, 0);
        addToScene(ribNS);
        var ribEW = makeBox(40, 0.5, 0.5, 0xC8B89A, 0, 5, 78, 0, 0, 0);
        addToScene(ribEW);
    }

    function buildFlyingButtresses() {
        // 8 angled support arms: BoxGeometry 1x1x12 rotated 30deg on X
        var buttressColor = 0xD0C0A0;
        var thirtyDeg = Math.PI / 6;

        var buttressPositions = [
            { x: -28, z: -5 },
            { x: -28, z:  5 },
            { x:  28, z: -5 },
            { x:  28, z:  5 },
            { x: -15, z: -12 },
            { x: -15, z:  12 },
            { x:  15, z: -12 },
            { x:  15, z:  12 }
        ];

        for (var i = 0; i < buttressPositions.length; i++) {
            var bp = buttressPositions[i];
            var buttress = makeBox(1, 1, 12, buttressColor, bp.x, 14, bp.z, thirtyDeg, 0, 0);
            addToScene(buttress);

            // Outer pier
            var pier = makeBox(2, 10, 2, buttressColor, bp.x + (bp.x > 0 ? 5 : -5), 5, bp.z, 0, 0, 0);
            addToScene(pier);
        }
    }

    function buildBishopGate() {
        // Ornate gatehouse: 12w x 4d x 18h
        var gate = makeBox(12, 18, 4, 0xD4A574, -40, 9, 0, 0, 0, 0);
        addToScene(gate);

        // Central arch opening implied by darker cutout overlay: 5w x 10h
        var archFill = makeBox(5, 10, 0.5, 0x2A1A0A, -40, 5, -2, 0, 0, 0);
        addToScene(archFill);

        // Arch top curve implied by box
        var archTop = makeBox(5, 2, 0.5, 0x2A1A0A, -40, 11, -2, 0, 0, 0);
        addToScene(archTop);

        // 2 flanking niches: BoxGeometry 2x4x0.5
        var nicheL = makeBox(2, 4, 0.5, 0xBBAA90, -44, 12, -2.1, 0, 0, 0);
        addToScene(nicheL);
        var nicheR = makeBox(2, 4, 0.5, 0xBBAA90, -36, 12, -2.1, 0, 0, 0);
        addToScene(nicheR);

        // 4 carved pinnacles at top corners
        var pinnaclePositions = [
            { x: -46, z: -1 },
            { x: -34, z: -1 },
            { x: -46, z:  1 },
            { x: -34, z:  1 }
        ];
        for (var i = 0; i < pinnaclePositions.length; i++) {
            var pp = pinnaclePositions[i];
            var pinnacleBase = makeBox(1.5, 4, 1.5, 0xD4A574, pp.x, 20, pp.z, 0, 0, 0);
            addToScene(pinnacleBase);
            var pinnacleCap = makeCone(0.8, 3, 6, 0xC49060, pp.x, 23.5, pp.z, 0, 0, 0);
            addToScene(pinnacleCap);
        }

        // Decorative bands on gatehouse
        var bandTop = makeBox(12, 1, 4.5, 0xC89060, -40, 18.5, 0, 0, 0, 0);
        addToScene(bandTop);
        var bandMid = makeBox(12, 0.5, 4.5, 0xC89060, -40, 9, 0, 0, 0, 0);
        addToScene(bandMid);
    }

    function buildNorwichMarket() {
        // 8 stall canopies in 3 rows, alternating colors
        var canopyColors = [0xFF6600, 0x0066FF, 0xFF0000, 0xFFCC00];
        var stallStartX = -30;
        var stallStartZ = -50;

        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 8; col++) {
                var stallX = stallStartX + col * 7;
                var stallZ = stallStartZ + row * 8;
                var colorIdx = (col + row) % 4;
                var canopyColor = canopyColors[colorIdx];

                // Canopy: 6x0.3x5
                var canopy = makeBox(6, 0.3, 5, canopyColor, stallX, 4, stallZ, 0, 0, 0);
                addToScene(canopy);

                // Counter under each: 6x1x2
                var counter = makeBox(6, 1, 2, 0xD4C5A9, stallX, 1, stallZ - 1, 0, 0, 0);
                addToScene(counter);

                // Canopy support poles
                var poleL = makeBox(0.2, 4, 0.2, 0x888888, stallX - 2.5, 2, stallZ - 2, 0, 0, 0);
                addToScene(poleL);
                var poleR = makeBox(0.2, 4, 0.2, 0x888888, stallX + 2.5, 2, stallZ - 2, 0, 0, 0);
                addToScene(poleR);
            }
        }
    }

    function buildForum() {
        // The Forum modern library: 40w x 20d x 16h
        var forumMain = makeBox(40, 16, 20, 0x87CEEB, 60, 8, -20, 0, 0, 0);
        addToScene(forumMain);

        // Curved glass facade implied by angled BoxGeometry 40x16x4 at 15deg tilt
        var fifteenDeg = Math.PI / 12;
        var forumFacade = makeBox(40, 16, 4, 0x6BB8E0, 60, 8, -31, fifteenDeg, 0, 0);
        addToScene(forumFacade);

        // Forum interior floor plates visible through glass
        var floorPlate1 = makeBox(38, 0.5, 18, 0xC0D8E8, 60, 5, -20, 0, 0, 0);
        addToScene(floorPlate1);
        var floorPlate2 = makeBox(38, 0.5, 18, 0xC0D8E8, 60, 10, -20, 0, 0, 0);
        addToScene(floorPlate2);

        // Forum entrance canopy
        var entranceCanopy = makeBox(20, 0.5, 6, 0x5A9AC0, 60, 3, -32, 0, 0, 0);
        addToScene(entranceCanopy);

        // Support columns for entrance
        var fColPositions = [
            { x: 48, z: -33 },
            { x: 60, z: -33 },
            { x: 72, z: -33 }
        ];
        for (var i = 0; i < fColPositions.length; i++) {
            var fc = fColPositions[i];
            var fCol = makeBox(1, 3, 1, 0x4A8AB0, fc.x, 1.5, fc.z, 0, 0, 0);
            addToScene(fCol);
        }
    }

    function buildRiverWensum() {
        // 4 flat water tiles: 15x0.3x15 color 0x1B6CA8
        var waterPositions = [
            { x: 80, z: 30 },
            { x: 95, z: 25 },
            { x: 110, z: 20 },
            { x: 125, z: 15 }
        ];

        for (var i = 0; i < waterPositions.length; i++) {
            var wp = waterPositions[i];
            var water = makeBox(15, 0.3, 15, 0x1B6CA8, wp.x, 0.15, wp.z, 0, 0, 0);
            addToScene(water);
        }

        // River banks
        var bankPositions = [
            { x: 80,  z: 45, w: 16, d: 4 },
            { x: 95,  z: 40, w: 16, d: 4 },
            { x: 110, z: 35, w: 16, d: 4 },
            { x: 125, z: 30, w: 16, d: 4 },
            { x: 80,  z: 15, w: 16, d: 4 },
            { x: 95,  z: 10, w: 16, d: 4 },
            { x: 110, z: 5,  w: 16, d: 4 },
            { x: 125, z: 0,  w: 16, d: 4 }
        ];

        for (var j = 0; j < bankPositions.length; j++) {
            var bk = bankPositions[j];
            var bank = makeBox(bk.w, 0.5, bk.d, 0x6B8E4E, bk.x, 0.25, bk.z, 0, 0, 0);
            addToScene(bank);
        }

        // Willow trees along river: trunk CylinderGeometry r=1 h=12 + SphereGeometry r=6
        var willowPositions = [
            { x: 78, z: 48 },
            { x: 95, z: 43 },
            { x: 112, z: 38 },
            { x: 78, z: 12 },
            { x: 97, z: 7 },
            { x: 114, z: 2 }
        ];

        for (var k = 0; k < willowPositions.length; k++) {
            var ww = willowPositions[k];
            // Trunk
            var trunk = makeCylinder(1, 1, 12, 8, 0x5C3D11, ww.x, 6, ww.z);
            addToScene(trunk);
            // Drooping canopy — sphere offset low for drooping shape
            var canopy = makeSphere(6, 10, 8, 0x4A7C3F, ww.x, 9, ww.z);
            addToScene(canopy);
            // Extra low drooping sphere clusters
            var droop1 = makeSphere(3.5, 8, 6, 0x3D6B32, ww.x + 3, 6, ww.z + 2);
            addToScene(droop1);
            var droop2 = makeSphere(3.5, 8, 6, 0x3D6B32, ww.x - 3, 6, ww.z - 2);
            addToScene(droop2);
            var droop3 = makeSphere(3, 8, 6, 0x3D6B32, ww.x, 5, ww.z + 4);
            addToScene(droop3);
        }
    }

    function buildGroundPlate() {
        // Ground plate for the whole complex
        var ground = makeBox(300, 0.5, 300, 0x7A8A6A, 30, -0.25, 20, 0, 0, 0);
        addToScene(ground);

        // Cathedral close (grassed area)
        var close = makeBox(120, 0.3, 100, 0x6B8A5A, 0, 0.15, 20, 0, 0, 0);
        addToScene(close);

        // Pathways
        var pathN = makeBox(4, 0.2, 60, 0xC8B89A, 0, 0.3, 30, 0, 0, 0);
        addToScene(pathN);
        var pathE = makeBox(60, 0.2, 4, 0xC8B89A, 30, 0.3, 0, 0, 0, 0);
        addToScene(pathE);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function build() {
        buildGroundPlate();
        buildNave();
        buildSpire();
        buildCloisters();
        buildFlyingButtresses();
        buildBishopGate();
        buildNorwichMarket();
        buildForum();
        buildRiverWensum();
    }

    function update(delta) {
        // Static environment — no per-frame animation needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) objects[i].geometry.dispose();
            if (objects[i].material) objects[i].material.dispose();
        }
        objects = [];
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
