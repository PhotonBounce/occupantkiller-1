window.CanterburyWalls = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var BASE_X = 16400;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, mat);
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildCityWalls() {
        var wallColor = 0x555545;
        var towerColor = 0x4A4A3A;

        // 6 wall sections forming the city circuit
        var wallSections = [
            { w: 2,  h: 10, d: 50, x: 0,    y: 5,  z: 25   },
            { w: 50, h: 10, d: 2,  x: 25,   y: 5,  z: 0    },
            { w: 2,  h: 10, d: 40, x: 50,   y: 5,  z: -20  },
            { w: 40, h: 10, d: 2,  x: 25,   y: 5,  z: -40  },
            { w: 2,  h: 10, d: 50, x: 0,    y: 5,  z: -65  },
            { w: 50, h: 10, d: 2,  x: -25,  y: 5,  z: -40  }
        ];

        for (var i = 0; i < wallSections.length; i++) {
            var ws = wallSections[i];
            var wallMesh = makeMesh(new THREE.BoxGeometry(ws.w, ws.h, ws.d), wallColor);
            wallMesh.position.set(BASE_X + ws.x, ws.y, BASE_Z + ws.z);
            addObj(wallMesh);
        }

        // 12 rectangular towers spaced along the walls
        var towers = [
            { x: 0,    z: 0   },
            { x: 0,    z: 50  },
            { x: 0,    z: -50 },
            { x: 16,   z: 0   },
            { x: 32,   z: 0   },
            { x: 50,   z: 0   },
            { x: 50,   z: -20 },
            { x: 50,   z: -40 },
            { x: 25,   z: -40 },
            { x: 0,    z: -40 },
            { x: -25,  z: -40 },
            { x: -25,  z: -20 }
        ];

        for (var t = 0; t < towers.length; t++) {
            var tw = towers[t];
            var towerMesh = makeMesh(new THREE.BoxGeometry(5, 14, 5), towerColor);
            towerMesh.position.set(BASE_X + tw.x, 7, BASE_Z + tw.z);
            addObj(towerMesh);
        }
    }

    function buildWestgateTowers() {
        var stoneColor = 0x6B6B5A;
        var darkColor = 0x1A1A1A;

        // Twin drum towers — CylinderGeometry r=6 h=22 seg=8
        var drumGeoL = new THREE.CylinderGeometry(6, 6, 22, 8);
        var drumL = makeMesh(drumGeoL, stoneColor);
        drumL.position.set(BASE_X - 7, 11, BASE_Z + 80);
        addObj(drumL);

        var drumGeoR = new THREE.CylinderGeometry(6, 6, 22, 8);
        var drumR = makeMesh(drumGeoR, stoneColor);
        drumR.position.set(BASE_X + 7, 11, BASE_Z + 80);
        addObj(drumR);

        // Connecting gate span 14×22×6
        var spanMesh = makeMesh(new THREE.BoxGeometry(14, 22, 6), stoneColor);
        spanMesh.position.set(BASE_X, 11, BASE_Z + 80);
        addObj(spanMesh);

        // Large arch opening dark inset 8×14
        var archMesh = makeMesh(new THREE.BoxGeometry(8, 14, 7), darkColor);
        archMesh.position.set(BASE_X, 7, BASE_Z + 80);
        addObj(archMesh);

        // Crenellated top — 8 merlons BoxGeometry 2×3×2
        for (var c = 0; c < 8; c++) {
            var merlonMesh = makeMesh(new THREE.BoxGeometry(2, 3, 2), stoneColor);
            merlonMesh.position.set(BASE_X - 7 + (c * 2), 23.5, BASE_Z + 80);
            addObj(merlonMesh);
        }
    }

    function buildChristchurchGate() {
        var limestoneColor = 0xD4C5A9;
        var heraldryColor = 0x8B0000;
        var darkColor = 0x1A1A1A;

        // Main gatehouse 16×8d×20h
        var gateMesh = makeMesh(new THREE.BoxGeometry(16, 20, 8), limestoneColor);
        gateMesh.position.set(BASE_X + 60, 10, BASE_Z + 20);
        addObj(gateMesh);

        // Gate arch dark inset
        var gateArchMesh = makeMesh(new THREE.BoxGeometry(6, 10, 9), darkColor);
        gateArchMesh.position.set(BASE_X + 60, 5, BASE_Z + 20);
        addObj(gateArchMesh);

        // 4 heraldic shields 2×3×0.3 in niches
        var shieldOffsets = [
            { x: -5, y: 14 },
            { x: -2, y: 14 },
            { x:  2, y: 14 },
            { x:  5, y: 14 }
        ];
        for (var s = 0; s < shieldOffsets.length; s++) {
            var sp = shieldOffsets[s];
            var shieldMesh = makeMesh(new THREE.BoxGeometry(2, 3, 0.3), heraldryColor);
            shieldMesh.position.set(BASE_X + 60 + sp.x, sp.y, BASE_Z + 16.1);
            addObj(shieldMesh);
        }

        // 2 flanking pinnacles 2×2×8
        var pinnacleL = makeMesh(new THREE.BoxGeometry(2, 8, 2), limestoneColor);
        pinnacleL.position.set(BASE_X + 52, 24, BASE_Z + 20);
        addObj(pinnacleL);

        var pinnacleR = makeMesh(new THREE.BoxGeometry(2, 8, 2), limestoneColor);
        pinnacleR.position.set(BASE_X + 68, 24, BASE_Z + 20);
        addObj(pinnacleR);
    }

    function buildRiverStour() {
        var waterColor = 0x1B6CA8;
        var timberColor = 0xF5DEB3;

        // 3 water tiles 15×0.4×20
        var waterOffsets = [
            { x: -40, z: 10 },
            { x: -40, z: 30 },
            { x: -40, z: 50 }
        ];
        for (var w = 0; w < waterOffsets.length; w++) {
            var wt = waterOffsets[w];
            var waterMesh = makeMesh(new THREE.BoxGeometry(15, 0.4, 20), waterColor);
            waterMesh.position.set(BASE_X + wt.x, 0.2, BASE_Z + wt.z);
            addObj(waterMesh);
        }

        // Weaver's House 12×8×10
        var weaverMesh = makeMesh(new THREE.BoxGeometry(12, 8, 10), timberColor);
        weaverMesh.position.set(BASE_X - 28, 4, BASE_Z + 30);
        addObj(weaverMesh);

        // Overhanging upper storey 13×4×6
        var upperMesh = makeMesh(new THREE.BoxGeometry(13, 4, 6), timberColor);
        upperMesh.position.set(BASE_X - 28, 10, BASE_Z + 30);
        addObj(upperMesh);
    }

    function buildPilgrimsWay() {
        var cobbleColor = 0xC0B0A0;
        var buildingColors = [0xF5DEB3, 0xE8D5B0, 0xDDD0A0];

        // Cobbled street 8×0.3×50
        var streetMesh = makeMesh(new THREE.BoxGeometry(8, 0.3, 50), cobbleColor);
        streetMesh.position.set(BASE_X + 30, 0.15, BASE_Z - 10);
        addObj(streetMesh);

        // 6 medieval buildings flanking the street
        var buildingDefs = [
            { side: -8, z: -30 },
            { side: -8, z: -10 },
            { side: -8, z:  10 },
            { side:  8, z: -30 },
            { side:  8, z: -10 },
            { side:  8, z:  10 }
        ];

        for (var b = 0; b < buildingDefs.length; b++) {
            var bd = buildingDefs[b];
            var bColor = buildingColors[b % 3];

            // Ground floor 8×10×8
            var bMesh = makeMesh(new THREE.BoxGeometry(8, 10, 8), bColor);
            bMesh.position.set(BASE_X + 30 + bd.side, 5, BASE_Z + bd.z);
            addObj(bMesh);

            // Jettied upper floor 9×4×4 overhanging
            var jMesh = makeMesh(new THREE.BoxGeometry(9, 4, 4), bColor);
            jMesh.position.set(BASE_X + 30 + bd.side, 12, BASE_Z + bd.z);
            addObj(jMesh);
        }
    }

    function buildDaneJohnMound() {
        var grassColor = 0x3A7A3A;
        var stoneColor = 0x888877;
        var limestoneColor = 0xD4C5A9;

        // Roman burial mound SphereGeometry r=14 half above ground
        var moundMesh = makeMesh(new THREE.SphereGeometry(14, 16, 16), grassColor);
        moundMesh.position.set(BASE_X - 60, 0, BASE_Z - 60);
        addObj(moundMesh);

        // Column monument CylinderGeometry r=1.5 h=16 seg=6
        var columnMesh = makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 16, 6), stoneColor);
        columnMesh.position.set(BASE_X - 60, 22, BASE_Z - 60);
        addObj(columnMesh);

        // Obelisk BoxGeometry 1×20×1
        var obeliskMesh = makeMesh(new THREE.BoxGeometry(1, 20, 1), limestoneColor);
        obeliskMesh.position.set(BASE_X - 60, 40, BASE_Z - 60);
        addObj(obeliskMesh);
    }

    function buildRomanWalls() {
        var romanColor = 0xD4A574;

        // Low Roman wall sections exposed at base 2×4×40
        var romanDefs = [
            { x: 0,   z: 10,  w: 2,  d: 40 },
            { x: 20,  z: 0,   w: 40, d: 2  },
            { x: 50,  z: -10, w: 2,  d: 40 },
            { x: 20,  z: -40, w: 40, d: 2  }
        ];

        for (var r = 0; r < romanDefs.length; r++) {
            var rd = romanDefs[r];
            var romanMesh = makeMesh(new THREE.BoxGeometry(rd.w, 4, rd.d), romanColor);
            romanMesh.position.set(BASE_X + rd.x, 2, BASE_Z + rd.z);
            addObj(romanMesh);
        }
    }

    function buildStAugustinesAbbey() {
        var stoneColor = 0x888877;
        var darkColor = 0x1A1A1A;
        var grassColor = 0x2D7A2D;

        // 4 low foundation walls 2×5×40
        var foundDefs = [
            { x: 100, z: -80,  w: 2,  d: 40 },
            { x: 120, z: -60,  w: 40, d: 2  },
            { x: 140, z: -80,  w: 2,  d: 40 },
            { x: 120, z: -100, w: 40, d: 2  }
        ];

        for (var f = 0; f < foundDefs.length; f++) {
            var fd = foundDefs[f];
            var fdMesh = makeMesh(new THREE.BoxGeometry(fd.w, 5, fd.d), stoneColor);
            fdMesh.position.set(BASE_X + fd.x, 2.5, BASE_Z + fd.z);
            addObj(fdMesh);
        }

        // 2 standing arch fragments 12×16×2 with dark 8×10 arch insets
        var archPositions = [
            { x: 100, z: -80 },
            { x: 140, z: -80 }
        ];

        for (var a = 0; a < archPositions.length; a++) {
            var ap = archPositions[a];

            var archFrameMesh = makeMesh(new THREE.BoxGeometry(12, 16, 2), stoneColor);
            archFrameMesh.position.set(BASE_X + ap.x, 8, BASE_Z + ap.z);
            addObj(archFrameMesh);

            var archInsetMesh = makeMesh(new THREE.BoxGeometry(8, 10, 3), darkColor);
            archInsetMesh.position.set(BASE_X + ap.x, 6, BASE_Z + ap.z);
            addObj(archInsetMesh);
        }

        // Grass courtyard 40×0.5×30
        var courtyardMesh = makeMesh(new THREE.BoxGeometry(40, 0.5, 30), grassColor);
        courtyardMesh.position.set(BASE_X + 120, 0.25, BASE_Z - 80);
        addObj(courtyardMesh);
    }

    function build() {
        buildCityWalls();
        buildWestgateTowers();
        buildChristchurchGate();
        buildRiverStour();
        buildPilgrimsWay();
        buildDaneJohnMound();
        buildRomanWalls();
        buildStAugustinesAbbey();
    }

    function update(delta) {
        // Static environment — no per-frame updates required
    }

    function reset() {
        for (var i = objects.length - 1; i >= 0; i--) {
            if (scene) {
                scene.remove(objects[i]);
            }
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
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
