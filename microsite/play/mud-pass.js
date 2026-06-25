window.MudPass = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var raindrops = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        raindrops = [];
        buildMudFloor();
        buildCliffWalls();
        buildConvoyWrecks();
        buildAmbushPositions();
        buildMudPits();
        buildRopeBridges();
        buildSandbagWalls();
        buildRainEffects();
        setupLighting();
    }

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

    function buildMudFloor() {
        var mudMat = new THREE.MeshLambertMaterial({ color: 0x3D2B1A });
        var floorGeo = new THREE.BoxGeometry(10, 0.5, 50);
        addMesh(floorGeo, mudMat, 0, -0.25, 0);

        var tileGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
        var darkMud = new THREE.MeshLambertMaterial({ color: 0x2A1A0A });
        for (var tx = -4; tx <= 4; tx++) {
            for (var tz = -25; tz <= 25; tz++) {
                if ((tx + tz) % 3 === 0) {
                    addMesh(tileGeo, darkMud, tx * 1.2, 0.1, tz * 1.2);
                }
            }
        }

        var wheelRutMat = new THREE.MeshLambertMaterial({ color: 0x1A0F08 });
        var rutGeo = new THREE.BoxGeometry(0.3, 0.1, 50);
        addMesh(rutGeo, wheelRutMat, -2.5, 0.05, 0);
        addMesh(rutGeo, wheelRutMat, 2.5, 0.05, 0);

        var rutMarks = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -3.5, 0.2, -25, -3.5, 0.2, 25,
                    -2.8, 0.2, -25, -2.8, 0.2, 25,
                    2.8, 0.2, -25, 2.8, 0.2, 25,
                    3.5, 0.2, -25, 3.5, 0.2, 25
                ]), 3)),
            new THREE.LineBasicMaterial({ color: 0x0A0A0A })
        );
        scene.add(rutMarks);
        objects.push(rutMarks);
    }

    function buildCliffWalls() {
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var burntRock = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });

        var leftWallGeo = new THREE.BoxGeometry(2, 20, 50);
        addMesh(leftWallGeo, rockMat, -6, 10, 0);

        var rightWallGeo = new THREE.BoxGeometry(2, 20, 50);
        addMesh(rightWallGeo, rockMat, 6, 10, 0);

        var stepGeo = new THREE.BoxGeometry(1.5, 2, 3);
        for (var s = 0; s < 8; s++) {
            var stepZ = -20 + s * 6;
            addMesh(stepGeo, burntRock, -6.5, 5 + s * 1.5, stepZ);
            addMesh(stepGeo, burntRock, 6.5, 5 + s * 1.5, stepZ);
        }

        var crackGeo = new THREE.BoxGeometry(0.2, 4, 8);
        for (var c = 0; c < 6; c++) {
            addMesh(crackGeo, new THREE.MeshLambertMaterial({ color: 0x333333 }),
                -6, 8 + c * 2, -15 + c * 8);
        }
    }

    function buildConvoyWrecks() {
        var truckPositions = [
            { x: -2, z: -15 },
            { x: 1, z: -5 },
            { x: -3, z: 10 },
            { x: 2, z: 20 }
        ];

        var blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var rustMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        for (var t = 0; t < truckPositions.length; t++) {
            var tp = truckPositions[t];

            var chassisGeo = new THREE.BoxGeometry(2.5, 1.2, 5);
            var chassis = addMesh(chassisGeo, blackMat, tp.x, 0.8, tp.z);
            chassis.rotation.z = (Math.random() - 0.5) * 0.3;

            var cabinGeo = new THREE.BoxGeometry(2, 1.8, 1.5);
            var cabin = addMesh(cabinGeo, blackMat, tp.x - 1.2, 2.2, tp.z - 1.5);
            cabin.rotation.x = 0.2;

            var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8);
            addMesh(wheelGeo, rustMat, tp.x - 1, 0.6, tp.z - 2);
            addMesh(wheelGeo, rustMat, tp.x - 1, 0.6, tp.z + 2);
            addMesh(wheelGeo, rustMat, tp.x + 1.2, 0.6, tp.z - 2);
            addMesh(wheelGeo, rustMat, tp.x + 1.2, 0.6, tp.z + 2);

            var debrisGeo = new THREE.BoxGeometry(0.4, 0.3, 0.6);
            for (var d = 0; d < 5; d++) {
                var dx = tp.x + (Math.random() - 0.5) * 3;
                var dz = tp.z + (Math.random() - 0.5) * 3;
                var debris = addMesh(debrisGeo, rustMat, dx, 1.5 + Math.random(), dz);
                debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            }

            var fuelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 6);
            addMesh(fuelGeo, rustMat, tp.x + 1.5, 1.2, tp.z);
        }
    }

    function buildAmbushPositions() {
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xD4AF37 });
        var shellMat = new THREE.MeshLambertMaterial({ color: 0xB8860B });

        var positions = [
            { x: -6.5, y: 12, z: -20 },
            { x: 6.5, y: 12, z: -20 },
            { x: -6.5, y: 13, z: -5 },
            { x: 6.5, y: 13, z: -5 },
            { x: -6.5, y: 14, z: 15 },
            { x: 6.5, y: 14, z: 15 }
        ];

        for (var p = 0; p < positions.length; p++) {
            var pos = positions[p];

            var platformGeo = new THREE.BoxGeometry(3, 0.5, 2.5);
            addMesh(platformGeo, platformMat, pos.x, pos.y, pos.z);

            var wallGeo = new THREE.BoxGeometry(2.8, 1.2, 0.5);
            addMesh(wallGeo, sandbagMat, pos.x, pos.y + 1.2, pos.z - 1.2);

            var shellGeo = new THREE.SphereGeometry(0.08, 4, 4);
            for (var sh = 0; sh < 4; sh++) {
                var sx = pos.x + (Math.random() - 0.5) * 1.5;
                var sz = pos.z + (Math.random() - 0.5) * 1.5;
                addMesh(shellGeo, shellMat, sx, pos.y + 0.8, sz);
            }
        }
    }

    function buildMudPits() {
        var pitMat = new THREE.MeshLambertMaterial({ color: 0x2A1A0A });
        var stickMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });

        var pitPositions = [
            { x: -4, z: -18 },
            { x: 3, z: -8 },
            { x: -2, z: 0 },
            { x: 4, z: 12 },
            { x: -3, z: 22 }
        ];

        for (var pi = 0; pi < pitPositions.length; pi++) {
            var pit = pitPositions[pi];

            var pitGeo = new THREE.BoxGeometry(1.8, 2.5, 1.8);
            addMesh(pitGeo, pitMat, pit.x, -1.5, pit.z);

            var stickGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 4);
            addMesh(stickGeo, stickMat, pit.x - 0.3, 0.8, pit.z - 0.3);
            addMesh(stickGeo, stickMat, pit.x + 0.3, 0.8, pit.z + 0.3);

            var armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4);
            var armL = addMesh(armGeo, stickMat, pit.x - 0.5, 1.8, pit.z);
            armL.rotation.z = 0.4;
            var armR = addMesh(armGeo, stickMat, pit.x + 0.5, 1.8, pit.z);
            armR.rotation.z = -0.4;

            var headGeo = new THREE.SphereGeometry(0.15, 4, 4);
            addMesh(headGeo, stickMat, pit.x, 2.3, pit.z);
        }
    }

    function buildRopeBridges() {
        var plankMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var ropeMat = new THREE.LineBasicMaterial({ color: 0x654321, linewidth: 2 });

        var bridgeZ = [-10, 18];

        for (var b = 0; b < bridgeZ.length; b++) {
            var bz = bridgeZ[b];

            var plankGeo = new THREE.BoxGeometry(0.5, 0.1, 8);
            for (var pl = 0; pl < 8; pl++) {
                addMesh(plankGeo, plankMat, -3 + pl * 1.5, 8, bz);
            }

            var ropeGeo = new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -6, 9, bz, -6, 8, bz,
                    6, 9, bz, 6, 8, bz,
                    -6, 9, bz, 0, 9.5, bz,
                    0, 9.5, bz, 6, 9, bz
                ]), 3));
            var rope = new THREE.LineSegments(ropeGeo, ropeMat);
            scene.add(rope);
            objects.push(rope);
        }
    }

    function buildSandbagWalls() {
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });

        var wallPositions = [
            { x: -5, z: -22 },
            { x: 5, z: -22 },
            { x: -5, z: -10 },
            { x: 5, z: -10 },
            { x: -5, z: 5 },
            { x: 5, z: 5 },
            { x: -5, z: 18 },
            { x: 5, z: 18 }
        ];

        for (var w = 0; w < wallPositions.length; w++) {
            var wpos = wallPositions[w];

            var bagGeo = new THREE.BoxGeometry(1, 0.6, 0.8);
            for (var bg = 0; bg < 3; bg++) {
                addMesh(bagGeo, sandbagMat, wpos.x, 0.5 + bg * 0.7, wpos.z);
            }

            var topBag = new THREE.BoxGeometry(0.9, 0.5, 0.7);
            for (var tb = 0; tb < 2; tb++) {
                addMesh(topBag, sandbagMat, wpos.x - 0.3 + tb * 0.6, 2.8, wpos.z);
            }
        }
    }

    function buildRainEffects() {
        var rainMat = new THREE.LineBasicMaterial({ color: 0xAAAAAA, linewidth: 1 });

        var rainCount = 60;
        for (var r = 0; r < rainCount; r++) {
            var rx = (Math.random() - 0.5) * 12;
            var ry = Math.random() * 25;
            var rz = (Math.random() - 0.5) * 55;

            var rainGeo = new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    rx, ry, rz,
                    rx, ry - 0.8, rz
                ]), 3));
            var rainLine = new THREE.LineSegments(rainGeo, rainMat);
            scene.add(rainLine);
            objects.push(rainLine);
            raindrops.push({ line: rainLine, y: ry, startY: ry, x: rx, z: rz });
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x334433, 0.6);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0x5A7A5A, 0.7);
        directionalLight.position.set(5, 15, -10);
        addLight(directionalLight);

        var pointLight = new THREE.PointLight(0xFFFFFF, 0.4);
        pointLight.position.set(0, 12, 0);
        addLight(pointLight);

        var stormLight = new THREE.PointLight(0xDDDDDD, 0.3);
        stormLight.position.set(-8, 20, -25);
        addLight(stormLight);
    }

    function update(delta) {
        for (var i = 0; i < raindrops.length; i++) {
            var drop = raindrops[i];
            drop.y -= 5 * delta;

            if (drop.y < -5) {
                drop.y = drop.startY;
            }

            var positions = drop.line.geometry.attributes.position.array;
            positions[1] = drop.y;
            positions[4] = drop.y - 0.8;
            drop.line.geometry.attributes.position.needsUpdate = true;
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
        raindrops = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
