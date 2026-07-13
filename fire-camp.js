window.FireCamp = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var flames = [];

    function buildBurningTrees() {
        var positions = [
            [-15, 0, -20], [-8, 0, -25], [5, 0, -22], [18, 0, -18],
            [-20, 0, 5], [12, 0, 8], [-12, 0, 25], [8, 0, 28]
        ];

        for (var i = 0; i < positions.length; i++) {
            var trunkGeo = new THREE.CylinderGeometry(1.2, 1.5, 12, 8);
            var trunkMat = new THREE.MeshLambertMaterial({ color: 0x1a0f0a });
            var trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(positions[i][0], 6, positions[i][2]);
            scene.add(trunk);
            objects.push(trunk);

            var flameGeo = new THREE.SphereGeometry(2.5, 8, 8);
            var flameMat = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff3300 });
            var flame = new THREE.Mesh(flameGeo, flameMat);
            flame.position.set(positions[i][0], 13, positions[i][2]);
            flame.scale.set(1, 1.3, 1);
            scene.add(flame);
            objects.push(flame);
            flames.push({ mesh: flame, baseScale: 1, time: Math.random() * 10 });

            var fireLight = new THREE.PointLight(0xff8833, 1.2, 20);
            fireLight.position.set(positions[i][0], 13, positions[i][2]);
            scene.add(fireLight);
            lights.push(fireLight);
        }
    }

    function buildBarricades() {
        var positions = [
            [[-12, 0, -8], 30], [[10, 0, -12], 25], [[-5, 0, 15], 35],
            [[15, 0, 12], 20], [[-18, 0, 18], 28]
        ];

        for (var i = 0; i < positions.length; i++) {
            var x = positions[i][0][0];
            var z = positions[i][0][2];
            var count = positions[i][1];

            for (var j = 0; j < 3; j++) {
                var logGeo = new THREE.CylinderGeometry(0.4, 0.4, count / 10, 6);
                var logMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
                var log = new THREE.Mesh(logGeo, logMat);
                log.position.set(x, 0.5 + j * 0.9, z);
                log.rotation.z = 0.3 + j * 0.2;
                scene.add(log);
                objects.push(log);
            }
        }
    }

    function buildCampfires() {
        var positions = [
            [-10, 0, 0], [6, 0, 5], [2, 0, -15], [-15, 0, 20], [14, 0, -5]
        ];

        for (var i = 0; i < positions.length; i++) {
            for (var j = 0; j < 4; j++) {
                var fireGeo = new THREE.SphereGeometry(0.5, 6, 6);
                var fireMat = new THREE.MeshLambertMaterial({ color: 0xff7700, emissive: 0xff4400 });
                var fire = new THREE.Mesh(fireGeo, fireMat);
                var angle = (j / 4) * Math.PI * 2;
                fire.position.set(
                    positions[i][0] + Math.cos(angle) * 0.8,
                    0.8 + Math.random() * 0.4,
                    positions[i][2] + Math.sin(angle) * 0.8
                );
                fire.scale.set(0.8 + Math.random() * 0.3, 1.2, 0.8 + Math.random() * 0.3);
                scene.add(fire);
                objects.push(fire);
                flames.push({ mesh: fire, baseScale: 1, time: Math.random() * 10 });
            }

            var fireLight = new THREE.PointLight(0xffaa33, 1.5, 18);
            fireLight.position.set(positions[i][0], 1.5, positions[i][2]);
            scene.add(fireLight);
            lights.push(fireLight);
        }
    }

    function buildSniperNests() {
        var positions = [
            [[-20, 0, -15], 0.4], [[16, 0, 20], 0.3], [[-8, 0, -28], 0.35]
        ];

        for (var i = 0; i < positions.length; i++) {
            var x = positions[i][0][0];
            var z = positions[i][0][2];
            var scale = positions[i][1];

            for (var j = 0; j < 4; j++) {
                var supportGeo = new THREE.CylinderGeometry(0.35 * scale, 0.4 * scale, 8, 6);
                var supportMat = new THREE.MeshLambertMaterial({ color: 0x2d1f0f });
                var support = new THREE.Mesh(supportGeo, supportMat);
                var angle = (j / 4) * Math.PI * 2;
                support.position.set(
                    x + Math.cos(angle) * 1.2 * scale,
                    4,
                    z + Math.sin(angle) * 1.2 * scale
                );
                scene.add(support);
                objects.push(support);
            }

            var platformGeo = new THREE.BoxGeometry(3 * scale, 0.5 * scale, 3 * scale);
            var platformMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
            var platform = new THREE.Mesh(platformGeo, platformMat);
            platform.position.set(x, 8.5, z);
            scene.add(platform);
            objects.push(platform);
        }
    }

    function buildTents() {
        var positions = [
            [-6, 0, 10], [11, 0, -8], [4, 0, 20], [-16, 0, -5]
        ];

        for (var i = 0; i < positions.length; i++) {
            var roofGeo = new THREE.ConeGeometry(1.8, 2.5, 8);
            var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
            var roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(positions[i][0], 1.5, positions[i][2]);
            scene.add(roof);
            objects.push(roof);

            var baseGeo = new THREE.BoxGeometry(2, 1.2, 2);
            var baseMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
            var base = new THREE.Mesh(baseGeo, baseMat);
            base.position.set(positions[i][0], 0.6, positions[i][2]);
            scene.add(base);
            objects.push(base);
        }
    }

    function buildBarrelFires() {
        var positions = [
            [-22, 0, 2], [20, 0, -10], [-3, 0, -22], [18, 0, 15]
        ];

        for (var i = 0; i < positions.length; i++) {
            var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 8);
            var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a1810 });
            var barrel = new THREE.Mesh(barrelGeo, barrelMat);
            barrel.position.set(positions[i][0], 0.6, positions[i][2]);
            scene.add(barrel);
            objects.push(barrel);

            var flameGeo = new THREE.SphereGeometry(0.7, 6, 6);
            var flameMat = new THREE.MeshLambertMaterial({ color: 0xffaa22, emissive: 0xff5500 });
            var flame = new THREE.Mesh(flameGeo, flameMat);
            flame.position.set(positions[i][0], 1.5, positions[i][2]);
            flame.scale.set(1, 1.4, 1);
            scene.add(flame);
            objects.push(flame);
            flames.push({ mesh: flame, baseScale: 1, time: Math.random() * 10 });

            var fireLight = new THREE.PointLight(0xffaa44, 1.3, 16);
            fireLight.position.set(positions[i][0], 1.5, positions[i][2]);
            scene.add(fireLight);
            lights.push(fireLight);
        }
    }

    function buildSandbags() {
        var positions = [
            [-14, 0, 8], [8, 0, 12], [-2, 0, -10], [16, 0, 5],
            [-10, 0, -18], [12, 0, 22], [-18, 0, 12], [6, 0, -20]
        ];

        for (var i = 0; i < positions.length; i++) {
            for (var j = 0; j < 3; j++) {
                var bagGeo = new THREE.BoxGeometry(0.8, 0.6, 0.6);
                var bagMat = new THREE.MeshLambertMaterial({ color: 0x9d8b6b });
                var bag = new THREE.Mesh(bagGeo, bagMat);
                bag.position.set(positions[i][0] + j * 0.7, 0.3 + j * 0.6, positions[i][2]);
                scene.add(bag);
                objects.push(bag);
            }
        }
    }

    function buildRopes() {
        var gridStart = [-18, -20];
        var gridEnd = [18, 25];
        var spacing = 5;

        for (var x = gridStart[0]; x <= gridEnd[0]; x += spacing) {
            var points = [
                new THREE.Vector3(x, 0.3, gridStart[1]),
                new THREE.Vector3(x, 0.3, gridEnd[1])
            ];
            var geometry = new THREE.BufferGeometry().setFromPoints(points);
            var lineMat = new THREE.LineBasicMaterial({ color: 0x666655, linewidth: 1 });
            var line = new THREE.LineSegments(geometry, lineMat);
            scene.add(line);
            objects.push(line);
        }

        for (var z = gridStart[1]; z <= gridEnd[1]; z += spacing) {
            var points = [
                new THREE.Vector3(gridStart[0], 0.3, z),
                new THREE.Vector3(gridEnd[0], 0.3, z)
            ];
            var geometry = new THREE.BufferGeometry().setFromPoints(points);
            var lineMat = new THREE.LineBasicMaterial({ color: 0x666655, linewidth: 1 });
            var line = new THREE.LineSegments(geometry, lineMat);
            scene.add(line);
            objects.push(line);
        }
    }

    function buildTripwires() {
        var positions = [
            [[-15, -12], [8, -8]], [[-5, 15], [12, 18]], [[10, -15], [18, 8]],
            [[-20, 10], [-12, 20]], [[5, 5], [14, 12]]
        ];

        for (var i = 0; i < positions.length; i++) {
            var fromX = positions[i][0][0];
            var fromZ = positions[i][0][1];
            var toX = positions[i][1][0];
            var toZ = positions[i][1][1];

            var points = [
                new THREE.Vector3(fromX, 0.4, fromZ),
                new THREE.Vector3(toX, 0.4, toZ)
            ];
            var geometry = new THREE.BufferGeometry().setFromPoints(points);
            var wireMat = new THREE.LineBasicMaterial({ color: 0x990000, linewidth: 2 });
            var wire = new THREE.LineSegments(geometry, wireMat);
            scene.add(wire);
            objects.push(wire);
        }
    }

    function buildWeaponsCaches() {
        var positions = [
            [-12, -5], [10, 10], [-8, 20], [16, -12], [2, 8],
            [-18, 5], [14, 15], [-5, -18]
        ];

        for (var i = 0; i < positions.length; i++) {
            var boxGeo = new THREE.BoxGeometry(1.5, 1, 1.2);
            var boxMat = new THREE.MeshLambertMaterial({ color: 0x5d5d5d });
            var box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(positions[i][0], 0.5, positions[i][1]);
            box.rotation.y = Math.random() * Math.PI;
            scene.add(box);
            objects.push(box);

            var lidGeo = new THREE.BoxGeometry(1.6, 0.2, 1.3);
            var lidMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var lid = new THREE.Mesh(lidGeo, lidMat);
            lid.position.set(positions[i][0], 1.1, positions[i][1]);
            scene.add(lid);
            objects.push(lid);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        flames = [];

        buildBurningTrees();
        buildBarricades();
        buildCampfires();
        buildSniperNests();
        buildTents();
        buildBarrelFires();
        buildSandbags();
        buildRopes();
        buildTripwires();
        buildWeaponsCaches();

        var ambientLight = new THREE.AmbientLight(0x4a4a3a, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        for (var i = 0; i < flames.length; i++) {
            var flame = flames[i];
            flame.time += delta;
            var flicker = flame.baseScale + Math.sin(flame.time * 3) * 0.15 + Math.sin(flame.time * 7) * 0.1;
            flame.mesh.scale.x = flicker;
            flame.mesh.scale.z = flicker;
            flame.mesh.scale.y = flicker * 1.3;
        }

        for (var j = 0; j < lights.length; j++) {
            if (lights[j].intensity !== undefined && lights[j].intensity > 0.5) {
                var originalIntensity = lights[j].userData.originalIntensity || lights[j].intensity;
                lights[j].userData.originalIntensity = originalIntensity;
                lights[j].intensity = originalIntensity + Math.sin(Date.now() * 0.003) * originalIntensity * 0.3;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var j = 0; j < lights.length; j++) {
            scene.remove(lights[j]);
        }
        objects = [];
        lights = [];
        flames = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
