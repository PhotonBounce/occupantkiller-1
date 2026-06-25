window.YorkshireDales = (function() {
    'use strict';

    var WORLD_X = 2770;
    var WORLD_Z = 2200;

    function createMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function createBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function createCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function createSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildMalhamCove(scene) {
        var ox = WORLD_X - 80;
        var oz = WORLD_Z - 60;

        // Main cliff face
        var cliff = createBox(50, 20, 4, 0xD4D4C8, ox, 10, oz);
        scene.add(cliff);

        // Limestone pavement on top — grykes and clints grid
        var i, j;
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 5; j++) {
                // clint block
                var clint = createBox(4.5, 0.8, 3.5, 0xCCCCBB,
                    ox - 22 + i * 6,
                    20.4,
                    oz - 7 + j * 4);
                scene.add(clint);

                // gryke crack (dark thin box between clints)
                var gryke = createBox(0.4, 0.6, 3.5, 0x888880,
                    ox - 22 + i * 6 + 2.45,
                    20.1,
                    oz - 7 + j * 4);
                scene.add(gryke);
            }
        }

        // Rock debris at base
        var k;
        for (k = 0; k < 6; k++) {
            var rock = createBox(1.5 + k * 0.3, 0.7, 1.2, 0xB8B8AC,
                ox - 20 + k * 7,
                0.35,
                oz + 3 + k * 0.4);
            scene.add(rock);
        }
    }

    function buildRibbleheadViaduct(scene) {
        var ox = WORLD_X + 60;
        var oz = WORLD_Z + 40;

        // Viaduct deck
        var deck = createBox(80, 8, 4, 0x9A8A78, ox, 14, oz);
        scene.add(deck);

        // 24 piers
        var p;
        for (p = 0; p < 24; p++) {
            var pier = createCylinder(0.8, 1.1, 10, 8, 0x9A8A78,
                ox - 38 + p * (76 / 23),
                5,
                oz);
            scene.add(pier);
        }

        // Arch spandrel boxes between piers
        var a;
        for (a = 0; a < 23; a++) {
            var arch = createBox(76 / 23 - 1.6, 3, 3.8, 0x8A7A68,
                ox - 38 + a * (76 / 23) + (76 / 23) / 2,
                11,
                oz);
            scene.add(arch);
        }
    }

    function buildPenyghent(scene) {
        var ox = WORLD_X - 30;
        var oz = WORLD_Z + 120;

        // Three-tier stepped profile
        var tier1 = createBox(30, 12, 28, 0x5A5A5A, ox, 6, oz);
        scene.add(tier1);

        var tier2 = createBox(20, 8, 18, 0x525252, ox, 16, oz);
        scene.add(tier2);

        var tier3 = createBox(12, 6, 10, 0x4A4A4A, ox, 23, oz);
        scene.add(tier3);

        // Rock cap summit
        var cap = createBox(8, 3, 6, 0x3A3A3A, ox, 27.5, oz);
        scene.add(cap);

        // Summit marker rock
        var marker = createBox(1.5, 2, 1.5, 0x2A2A2A, ox, 30, oz);
        scene.add(marker);
    }

    function buildBoltonPriory(scene) {
        var ox = WORLD_X + 10;
        var oz = WORLD_Z - 150;

        // Main nave walls
        var nave = createBox(25, 10, 8, 0xD4A97A, ox, 5, oz);
        scene.add(nave);

        // Roofless — hollow interior hint: side walls thinner
        var wallN = createBox(25, 10, 1, 0xC8A070, ox, 5, oz - 3.5);
        scene.add(wallN);

        var wallS = createBox(25, 10, 1, 0xC8A070, ox, 5, oz + 3.5);
        scene.add(wallS);

        // East gable end
        var gableE = createBox(1.5, 12, 8, 0xCCA068, ox + 12.75, 6, oz);
        scene.add(gableE);

        // West gable end
        var gableW = createBox(1.5, 12, 8, 0xCCA068, ox - 12.75, 6, oz);
        scene.add(gableW);

        // Tower remnant
        var tower = createBox(5, 18, 5, 0xD0A870, ox - 14, 9, oz);
        scene.add(tower);

        // Lancet window arch suggestion — thin tall box cutout area above wall
        var archbox = createBox(2, 4, 0.5, 0x7A6040, ox, 9, oz - 3.8);
        scene.add(archbox);

        // Scattered foundation stones
        var s;
        for (s = 0; s < 5; s++) {
            var stone = createBox(2, 0.5, 1.5, 0xB89060,
                ox - 10 + s * 5,
                0.25,
                oz + 5 + s * 0.5);
            scene.add(stone);
        }
    }

    function buildDrystoneWalls(scene) {
        var ox = WORLD_X;
        var oz = WORLD_Z;

        var wallDefs = [
            // [x, y, z, w, h, d]
            [ox - 100, 0.5, oz - 20,  60, 1, 0.5],
            [ox - 40,  0.5, oz - 20,  60, 1, 0.5],
            [ox + 20,  0.5, oz - 20,  60, 1, 0.5],
            [ox + 80,  0.5, oz - 20,  60, 1, 0.5],
            [ox - 100, 0.5, oz + 40,  60, 1, 0.5],
            [ox - 40,  0.5, oz + 40,  60, 1, 0.5],
            [ox + 20,  0.5, oz + 40,  60, 1, 0.5],
            [ox + 80,  0.5, oz + 40,  60, 1, 0.5],
            // Cross-walls
            [ox - 70,  0.5, oz,        0.5, 1, 80],
            [ox - 10,  0.5, oz,        0.5, 1, 80],
            [ox + 50,  0.5, oz,        0.5, 1, 80],
            [ox + 110, 0.5, oz,        0.5, 1, 80],
            // Additional northern walls
            [ox - 100, 0.5, oz + 100, 60, 1, 0.5],
            [ox + 20,  0.5, oz + 100, 60, 1, 0.5],
            [ox - 30,  0.5, oz + 60,   0.5, 1, 80],
            [ox + 50,  0.5, oz + 60,   0.5, 1, 80]
        ];

        var w;
        for (w = 0; w < wallDefs.length; w++) {
            var wd = wallDefs[w];
            var wall = createBox(wd[3], wd[4], wd[5], 0x888888, wd[0], wd[1], wd[2]);
            scene.add(wall);
        }
    }

    function buildAysgarthFalls(scene) {
        var ox = WORLD_X + 150;
        var oz = WORLD_Z - 20;

        // Stepped waterfall ledges descending in Y and Z
        var stepDefs = [
            [ox, 6,   oz,      18, 1.5, 6, 0x9E9E9E],
            [ox, 4.5, oz + 7,  18, 1.5, 6, 0x9E9E9E],
            [ox, 3,   oz + 14, 18, 1.5, 6, 0x9E9E9E],
            [ox, 1.5, oz + 21, 18, 1.5, 6, 0x9E9E9E],
            [ox, 0,   oz + 28, 18, 1.5, 8, 0xA0A0A0]
        ];

        var f;
        for (f = 0; f < stepDefs.length; f++) {
            var sd = stepDefs[f];
            var ledge = createBox(sd[3], sd[4], sd[5], sd[6], sd[0], sd[1], sd[2]);
            scene.add(ledge);
        }

        // Water-face boxes (light blue-grey)
        var waterDefs = [
            [ox, 5.25,  oz + 3.5,  18, 1, 1,   0xC8D8E8],
            [ox, 3.75,  oz + 10.5, 18, 1, 1,   0xC8D8E8],
            [ox, 2.25,  oz + 17.5, 18, 1, 1,   0xC8D8E8],
            [ox, 0.75,  oz + 24.5, 18, 1, 1,   0xC8D8E8]
        ];

        var wf;
        for (wf = 0; wf < waterDefs.length; wf++) {
            var wfd = waterDefs[wf];
            var waterface = createBox(wfd[3], wfd[4], wfd[5], wfd[6], wfd[0], wfd[1], wfd[2]);
            scene.add(waterface);
        }

        // Spray spheres around the falls
        var sprayPositions = [
            [ox - 6,  2, oz + 10],
            [ox + 6,  2, oz + 10],
            [ox - 4,  1, oz + 22],
            [ox + 4,  1, oz + 22],
            [ox,      3, oz + 5 ],
            [ox - 3,  0.8, oz + 30],
            [ox + 3,  0.8, oz + 30],
            [ox,      1.5, oz + 16]
        ];

        var sp;
        for (sp = 0; sp < sprayPositions.length; sp++) {
            var spos = sprayPositions[sp];
            var spray = createSphere(0.8 + (sp % 3) * 0.3, 6, 6, 0xE0E8F0, spos[0], spos[1], spos[2]);
            scene.add(spray);
        }

        // Riverbed boulders below falls
        var b;
        for (b = 0; b < 7; b++) {
            var boulder = createSphere(0.5 + b * 0.15, 5, 5, 0x909090,
                ox - 7 + b * 2,
                -0.3,
                oz + 32 + b * 0.5);
            scene.add(boulder);
        }
    }

    function buildGroundTerrain(scene) {
        var ox = WORLD_X;
        var oz = WORLD_Z;

        // Moorland base — large flat ground block
        var moor = createBox(400, 1, 400, 0x6B7A4A, ox, -0.5, oz);
        scene.add(moor);

        // Limestone outcrops scattered across moor
        var outcrops = [
            [ox - 50,  0.4, oz + 20,  3, 0.8, 2,   0xC8C8BC],
            [ox + 30,  0.4, oz - 40,  2, 0.6, 1.5, 0xC0C0B4],
            [ox + 90,  0.4, oz + 10,  4, 1.0, 2.5, 0xCACABE],
            [ox - 120, 0.4, oz + 50,  3, 0.7, 2,   0xC4C4B8],
            [ox + 130, 0.4, oz - 60,  2, 0.5, 1.5, 0xBCBCB0],
            [ox - 60,  0.4, oz - 80,  5, 1.2, 3,   0xCCCCC0],
            [ox + 60,  0.4, oz + 80,  3, 0.9, 2,   0xC6C6BA]
        ];

        var oc;
        for (oc = 0; oc < outcrops.length; oc++) {
            var od = outcrops[oc];
            var outcrop = createBox(od[3], od[4], od[5], od[6], od[0], od[1], od[2]);
            scene.add(outcrop);
        }

        // Heather clumps — dark purple-brown low boxes
        var hc;
        for (hc = 0; hc < 12; hc++) {
            var hx = ox - 180 + hc * 32;
            var hz = oz - 30 + (hc % 5) * 18;
            var heather = createBox(3, 0.4, 2.5, 0x6B4E6B, hx, 0.2, hz);
            scene.add(heather);
        }
    }

    function buildScene(scene) {
        buildGroundTerrain(scene);
        buildMalhamCove(scene);
        buildRibbleheadViaduct(scene);
        buildPenyghent(scene);
        buildBoltonPriory(scene);
        buildDrystoneWalls(scene);
        buildAysgarthFalls(scene);
    }

    function getSpawnPoint() {
        return { x: WORLD_X, y: 2, z: WORLD_Z };
    }

    function getName() {
        return 'Yorkshire Dales';
    }

    return {
        buildScene: buildScene,
        getSpawnPoint: getSpawnPoint,
        getName: getName,
        worldX: WORLD_X,
        worldZ: WORLD_Z
    };

}());
