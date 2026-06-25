window.RustCamp = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var flagMesh = null;
    var flickerLights = [];

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function buildCampGround() {
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var crackMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var weedMat = new THREE.MeshLambertMaterial({ color: 0x4A7A2A });

        for (var i = -5; i < 5; i++) {
            for (var j = -5; j < 5; j++) {
                var x = i * 45;
                var z = j * 45;
                addMesh(new THREE.BoxGeometry(45, 0.5, 45), groundMat, x, -0.25, z);

                if (Math.random() > 0.7) {
                    addMesh(new THREE.BoxGeometry(25, 0.3, 25), crackMat, x + 10, -0.15, z + 10);
                }

                if (Math.random() > 0.8) {
                    var weedGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 4);
                    for (var k = 0; k < 4; k++) {
                        var wx = x + (Math.random() - 0.5) * 40;
                        var wz = z + (Math.random() - 0.5) * 40;
                        addMesh(weedGeo, weedMat, wx, 1, wz);
                    }
                }
            }
        }
    }

    function buildBarracksRow() {
        var barracksMat = new THREE.MeshLambertMaterial({ color: 0x4A5A2A });
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x3A3A2A });

        for (var i = 0; i < 5; i++) {
            var x = -40 + i * 20;
            var barracksMesh = addMesh(new THREE.BoxGeometry(12, 5, 3), barracksMat, x, 2.5, -50);
            barracksMesh.castShadow = true;

            var roofGeo = new THREE.BoxGeometry(13, 1.5, 3.5);
            addMesh(roofGeo, roofMat, x, 6, -50);

            for (var w = 0; w < 3; w++) {
                var wx = x - 5 + w * 4;
                var windowGeo = new THREE.BoxGeometry(1.5, 1.5, 0.2);
                addMesh(windowGeo, windowMat, wx, 3.5, -51.5);

                var gridGeo = new THREE.BufferGeometry();
                var vertices = new Float32Array([
                    -0.5, -0.5, 0, 0.5, -0.5, 0,
                    0.5, -0.5, 0, 0.5, 0.5, 0,
                    0.5, 0.5, 0, -0.5, 0.5, 0,
                    -0.5, 0.5, 0, -0.5, -0.5, 0,
                    0, -0.5, 0, 0, 0.5, 0,
                    -0.5, 0, 0, 0.5, 0, 0
                ]);
                gridGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                var gridMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
                var grid = new THREE.LineSegments(gridGeo, gridMat);
                grid.position.set(wx, 3.5, -51.5);
                scene.add(grid);
                objects.push(grid);
            }
        }
    }

    function buildObstacleCourse() {
        var postMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var barMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        var mudMat = new THREE.MeshLambertMaterial({ color: 0x3A2A1A });
        var ropeMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        var mudPit = addMesh(new THREE.BoxGeometry(20, 2, 15), mudMat, 30, -1, 20);

        var hurdleX = 40;
        var hurdleZ = 10;
        for (var h = 0; h < 5; h++) {
            var hz = hurdleZ + h * 8;
            addMesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 8), postMat, hurdleX, 0, hz);
            addMesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 8), postMat, hurdleX + 4, 0, hz);
            var barGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
            var bar = addMesh(barGeo, barMat, hurdleX + 2, 2, hz);
            bar.rotation.z = Math.PI / 2;
        }

        var ropeX = 50;
        var ropeZ = 5;
        var ropeGeo = new THREE.BufferGeometry();
        var ropeVertices = [];
        for (var r = 0; r < 20; r++) {
            ropeVertices.push(0, r * 0.5, 0);
            ropeVertices.push(0.3, r * 0.5, 0);
        }
        ropeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropeVertices), 3));
        var rope = new THREE.LineSegments(ropeGeo, ropeMat);
        rope.position.set(ropeX, 0, ropeZ);
        scene.add(rope);
        objects.push(rope);

        var beamGeo = new THREE.CylinderGeometry(0.4, 0.4, 25, 8);
        var beam = addMesh(beamGeo, postMat, 60, 2, 15);
        beam.rotation.z = Math.PI / 2;

        for (var t = 0; t < 6; t++) {
            var tireX = 35 + t * 4;
            var tireGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16);
            var tire = addMesh(tireGeo, mudMat, tireX, 0.4, 40);
            tire.rotation.z = Math.PI / 2;
        }
    }

    function buildRifleRange() {
        var postMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var targetMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
        var damageMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        for (var s = 0; s < 8; s++) {
            var standX = -25 + s * 12;
            addMesh(new THREE.CylinderGeometry(0.5, 0.5, 3, 8), postMat, standX, 1.5, 60);
            var target = addMesh(new THREE.BoxGeometry(2, 2, 0.2), targetMat, standX, 3, 60);

            for (var b = 0; b < 3; b++) {
                var bx = standX + (Math.random() - 0.5) * 1.5;
                var by = 2 + Math.random() * 1.5;
                addMesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), damageMat, bx, by, 60.05);
            }
        }

        var wallGeo = new THREE.BoxGeometry(50, 4, 2);
        var wall = addMesh(wallGeo, sandbagMat, 0, 2, 75);

        for (var p = 0; p < 25; p++) {
            var px = (Math.random() - 0.5) * 48;
            var py = 0.5 + Math.random() * 3.5;
            var pz = 74 + (Math.random() - 0.5) * 2;
            addMesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), damageMat, px, py, pz);
        }
    }

    function buildMotorPool() {
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var oilMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        var shedMat = new THREE.MeshLambertMaterial({ color: 0x6B5A3A });

        for (var v = 0; v < 4; v++) {
            var vx = -80 + v * 15;
            addMesh(new THREE.BoxGeometry(8, 3, 4), hullMat, vx, 1.5, -20);
            var roofPart = addMesh(new THREE.BoxGeometry(8, 1, 5), hullMat, vx, 4, -20);
            roofPart.rotation.x = Math.PI / 6;
        }

        var shedGeo = new THREE.BoxGeometry(25, 6, 12);
        var shed = addMesh(shedGeo, shedMat, -80, 3, 0);
        var partialRoof = addMesh(new THREE.BoxGeometry(25, 2, 12), shedMat, -80, 7, -2);
        partialRoof.rotation.x = Math.PI / 8;

        for (var o = 0; o < 5; o++) {
            var ox = -90 + Math.random() * 30;
            var oz = -10 + Math.random() * 20;
            addMesh(new THREE.BoxGeometry(4, 0.3, 6), oilMat, ox, -0.15, oz);
        }
    }

    function buildWaterTower() {
        var legMat = new THREE.MeshLambertMaterial({ color: 0x6B5A3A });
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var ladderMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

        for (var l = 0; l < 4; l++) {
            var lx = 60 + (l % 2) * 6;
            var lz = -60 + Math.floor(l / 2) * 6;
            addMesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), legMat, lx, 10, lz);
        }

        addMesh(new THREE.CylinderGeometry(5, 5, 4, 12), tankMat, 63, 23, -57);

        var ladderGeo = new THREE.BufferGeometry();
        var ladderVerts = [];
        for (var rung = 0; rung < 15; rung++) {
            var ry = rung * 1.3;
            ladderVerts.push(-0.5, ry, 0, 0.5, ry, 0);
            if (rung < 14) {
                ladderVerts.push(-0.5, ry, 0, -0.5, ry + 1.3, 0);
                ladderVerts.push(0.5, ry, 0, 0.5, ry + 1.3, 0);
            }
        }
        ladderGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ladderVerts), 3));
        var ladder = new THREE.LineSegments(ladderGeo, ladderMat);
        ladder.position.set(63, 5, -57);
        ladder.position.y = 2;
        scene.add(ladder);
        objects.push(ladder);
    }

    function buildFlagPole() {
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var flagMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });

        addMesh(new THREE.CylinderGeometry(1, 1, 30, 12), poleMat, 0, 15, 75);

        var flagGeo = new THREE.BoxGeometry(8, 5, 0.3);
        flagMesh = addMesh(flagGeo, flagMat, 5, 25, 75);
    }

    function buildRustPiles() {
        var rustMat = new THREE.MeshLambertMaterial({ color: 0x8B3A00 });
        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x6B3A1A });

        for (var r = 0; r < 12; r++) {
            var rx = -70 + Math.random() * 140;
            var rz = -70 + Math.random() * 140;

            for (var s = 0; s < 5; s++) {
                var sphereGeo = new THREE.SphereGeometry(1 + Math.random() * 2, 6, 6);
                var sx = rx + (Math.random() - 0.5) * 8;
                var sy = s * 1.5;
                var sz = rz + (Math.random() - 0.5) * 8;
                addMesh(sphereGeo, rustMat, sx, sy, sz);
            }

            var debrisGeo = new THREE.BoxGeometry(3, 1, 4);
            addMesh(debrisGeo, debrisMat, rx + 5, 7, rz + 5);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x556655, 0.6);
        addLight(ambientLight);

        var sunLight = new THREE.DirectionalLight(0xCCBBAA, 0.7);
        sunLight.position.set(40, 40, 30);
        sunLight.castShadow = true;
        addLight(sunLight);

        var light1 = new THREE.PointLight(0xFFDD55, 0.4, 60);
        light1.position.set(30, 15, 20);
        addLight(light1);
        flickerLights.push(light1);

        var light2 = new THREE.PointLight(0xFFDD55, 0.4, 60);
        light2.position.set(-30, 15, -20);
        addLight(light2);
        flickerLights.push(light2);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        flickerLights = [];
        flagMesh = null;

        buildCampGround();
        buildBarracksRow();
        buildObstacleCourse();
        buildRifleRange();
        buildMotorPool();
        buildWaterTower();
        buildFlagPole();
        buildRustPiles();
        setupLighting();
    }

    function update(delta) {
        if (flagMesh) {
            flagMesh.rotation.y += 0.4 * delta;
        }

        for (var f = 0; f < flickerLights.length; f++) {
            if (Math.random() > 0.97) {
                flickerLights[f].intensity = flickerLights[f].intensity > 0.3 ? 0.1 : 0.4;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        flickerLights = [];
        flagMesh = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
