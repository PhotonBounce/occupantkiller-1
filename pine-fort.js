window.PineFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var campfires = [];
    var swayingTrees = [];
    var startTime = Date.now();

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

    function buildForestFloor() {
        var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2A3D1A });
        var tileSize = 5;
        var tileCount = 9;
        var startPos = -(tileCount * tileSize) / 2;

        for (var x = 0; x < tileCount; x++) {
            for (var z = 0; z < tileCount; z++) {
                var tileGeo = new THREE.BoxGeometry(tileSize, 0.3, tileSize);
                var tileX = startPos + x * tileSize + tileSize / 2;
                var tileZ = startPos + z * tileSize + tileSize / 2;
                addMesh(tileGeo, groundMaterial, tileX, -0.15, tileZ);
            }
        }

        var needleMaterial = new THREE.MeshLambertMaterial({ color: 0x1F2A0F });
        for (var i = 0; i < 40; i++) {
            var needleGeo = new THREE.BoxGeometry(0.8, 0.05, 1.2);
            var needleX = Math.random() * 40 - 20;
            var needleZ = Math.random() * 40 - 20;
            var needleRotation = Math.random() * Math.PI;
            var needleMesh = addMesh(needleGeo, needleMaterial, needleX, 0.02, needleZ);
            needleMesh.rotation.y = needleRotation;
        }
    }

    function buildPineTrees() {
        var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5C3317 });
        var foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x1A4A1A });

        var treePositions = [
            [-18, -15], [-12, -20], [-8, -12], [-15, -5], [-22, -8],
            [8, -18], [14, -22], [10, -10], [18, -15], [20, -5],
            [-5, 15], [5, 18], [15, 20], [-12, 18], [12, 10],
            [-20, 5], [-18, 12], [20, 8], [18, 18], [-10, -25],
            [12, -28], [22, 15], [-25, 20], [25, 25], [-20, -28],
            [8, 8], [-15, 10], [16, -20], [-8, 22], [10, 25],
            [20, 20], [-18, -28], [14, 15], [-12, 25], [22, -10]
        ];

        for (var i = 0; i < treePositions.length; i++) {
            var treeX = treePositions[i][0];
            var treeZ = treePositions[i][1];
            var treeHeight = 10 + Math.random() * 8;

            var trunkGeo = new THREE.CylinderGeometry(0.6, 1.0, treeHeight * 0.4, 8);
            var trunk = addMesh(trunkGeo, trunkMaterial, treeX, treeHeight * 0.2, treeZ);
            swayingTrees.push(trunk);

            var tier1Geo = new THREE.ConeGeometry(3.5, treeHeight * 0.35, 16);
            var tier1 = addMesh(tier1Geo, foliageMaterial, treeX, treeHeight * 0.6, treeZ);
            swayingTrees.push(tier1);

            var tier2Geo = new THREE.ConeGeometry(2.5, treeHeight * 0.3, 16);
            var tier2 = addMesh(tier2Geo, foliageMaterial, treeX, treeHeight * 0.9, treeZ);
            swayingTrees.push(tier2);

            var tier3Geo = new THREE.ConeGeometry(1.8, treeHeight * 0.25, 16);
            var tier3 = addMesh(tier3Geo, foliageMaterial, treeX, treeHeight * 1.1, treeZ);
            swayingTrees.push(tier3);
        }
    }

    function buildLogPalisade() {
        var logMaterial = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
        var palisadeRadius = 30;
        var postSpacing = 3;
        var postHeight = 6;
        var postSegments = Math.floor((2 * Math.PI * palisadeRadius) / postSpacing);

        for (var i = 0; i < postSegments; i++) {
            var angle = (i / postSegments) * Math.PI * 2;
            var posX = Math.cos(angle) * palisadeRadius;
            var posZ = Math.sin(angle) * palisadeRadius;

            var logGeo = new THREE.CylinderGeometry(0.25, 0.3, postHeight, 12);
            var post = addMesh(logGeo, logMaterial, posX, postHeight / 2, posZ);

            var sharpenGeo = new THREE.ConeGeometry(0.3, 0.8, 12);
            addMesh(sharpenGeo, logMaterial, posX, postHeight + 0.4, posZ);
        }
    }

    function buildWatchtowers() {
        var towerPositions = [
            { x: 25, z: 25, angle: -Math.PI / 4 },
            { x: -25, z: 25, angle: -3 * Math.PI / 4 },
            { x: -25, z: -25, angle: 3 * Math.PI / 4 },
            { x: 25, z: -25, angle: Math.PI / 4 }
        ];

        var logMaterial = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x7A5230 });

        for (var i = 0; i < towerPositions.length; i++) {
            var tower = towerPositions[i];
            var tX = tower.x;
            var tZ = tower.z;

            for (var leg = 0; leg < 4; leg++) {
                var legAngle = (leg / 4) * Math.PI * 2;
                var legX = tX + Math.cos(legAngle) * 2;
                var legZ = tZ + Math.sin(legAngle) * 2;
                var legGeo = new THREE.CylinderGeometry(0.35, 0.45, 8, 12);
                addMesh(legGeo, logMaterial, legX, 4, legZ);
            }

            var platformGeo = new THREE.BoxGeometry(5, 0.5, 5);
            addMesh(platformGeo, platformMaterial, tX, 8.5, tZ);

            var roofGeo = new THREE.ConeGeometry(3.5, 3, 8);
            addMesh(roofGeo, logMaterial, tX, 10.5, tZ);

            var searchlightGeo = new THREE.CylinderGeometry(0.4, 0.35, 1.5, 16);
            var searchlight = addMesh(searchlightGeo, platformMaterial, tX, 9.2, tZ);
            searchlight.rotation.z = 0.4;
        }
    }

    function buildBarracks() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x7A5230 });
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x5C3317 });

        var barracksPositions = [
            { x: -10, z: 5 },
            { x: 0, z: 10 },
            { x: 10, z: 3 }
        ];

        for (var i = 0; i < barracksPositions.length; i++) {
            var bPos = barracksPositions[i];
            var bX = bPos.x;
            var bZ = bPos.z;

            var buildingGeo = new THREE.BoxGeometry(6, 4, 8);
            addMesh(buildingGeo, wallMaterial, bX, 2, bZ);

            var roofGeo = new THREE.ConeGeometry(5, 2.5, 4);
            addMesh(roofGeo, roofMaterial, bX, 5.5, bZ);

            for (var w = 0; w < 2; w++) {
                var windowX = bX - 1.5 + w * 3;
                var windowZ = bZ - 4;
                var windowGap = new THREE.BoxGeometry(1, 1.2, 0.1);
                addMesh(windowGap, roofMaterial, windowX, 3, windowZ);
            }
        }
    }

    function buildArmory() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3520 });
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x3D3D3D });
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x5C3317 });

        var armoryGeo = new THREE.BoxGeometry(5, 3.5, 7);
        addMesh(armoryGeo, wallMaterial, 0, 1.75, -12);

        var roofGeo = new THREE.ConeGeometry(4, 2, 4);
        addMesh(roofGeo, roofMaterial, 0, 4.75, -12);

        for (var row = 0; row < 2; row++) {
            for (var col = 0; col < 3; col++) {
                var barrelX = -1.8 + col * 1.8;
                var barrelY = 0.8 + row * 1.2;
                var barrelZ = -12.2;
                var barrelGeo = new THREE.CylinderGeometry(0.35, 0.4, 1.2, 12);
                addMesh(barrelGeo, barrelMaterial, barrelX, barrelY, barrelZ);
            }
        }

        var barGeo = new THREE.BoxGeometry(5.2, 3.7, 0.15);
        var barMesh = new THREE.LineSegments(
            new THREE.EdgesGeometry(barGeo),
            new THREE.LineBasicMaterial({ color: 0x1A1A1A, linewidth: 2 })
        );
        barMesh.position.set(0, 1.75, -15.5);
        scene.add(barMesh);
        objects.push(barMesh);
    }

    function buildCampfires() {
        var firePositions = [
            { x: -15, z: 8 },
            { x: 8, z: -18 },
            { x: -8, z: 15 },
            { x: 15, z: 12 },
            { x: 2, z: -5 }
        ];

        var emberMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var logMaterial = new THREE.MeshLambertMaterial({ color: 0x6B4226 });

        for (var i = 0; i < firePositions.length; i++) {
            var fPos = firePositions[i];
            var fX = fPos.x;
            var fZ = fPos.z;

            for (var log = 0; log < 2; log++) {
                var logGeo = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
                var logMesh = addMesh(logGeo, logMaterial, fX - 1 + log * 2, 0.15, fZ);
                logMesh.rotation.z = Math.PI / 4;
            }

            var emberGeo = new THREE.SphereGeometry(0.8, 12, 12);
            var ember = addMesh(emberGeo, emberMaterial, fX, 0.8, fZ);
            campfires.push({ mesh: ember, baseScale: 0.8 });

            var glowGeo = new THREE.SphereGeometry(1.2, 12, 12);
            var glowMaterial = new THREE.MeshLambertMaterial({
                color: 0xFF6600,
                emissive: 0xFF3300
            });
            var glow = addMesh(glowGeo, glowMaterial, fX, 0.8, fZ);
            campfires.push({ mesh: glow, baseScale: 1.2 });
        }
    }

    function buildTrapLines() {
        var spikePositions = [
            { x: -35, z: -20 },
            { x: 35, z: 20 },
            { x: -35, z: 20 },
            { x: 35, z: -20 }
        ];

        var spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });

        for (var i = 0; i < spikePositions.length; i++) {
            var sPos = spikePositions[i];
            var trapX = sPos.x;
            var trapZ = sPos.z;

            var linePoints = [
                new THREE.Vector3(trapX - 3, 0.3, trapZ),
                new THREE.Vector3(trapX + 3, 0.3, trapZ)
            ];
            var lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
            var lineMaterial = new THREE.LineBasicMaterial({ color: 0x5C3317, linewidth: 3 });
            var tripwire = new THREE.LineSegments(lineGeo, lineMaterial);
            scene.add(tripwire);
            objects.push(tripwire);

            for (var spike = 0; spike < 5; spike++) {
                var spikeX = trapX - 2.5 + spike * 1.2;
                var spikePitGeo = new THREE.BoxGeometry(0.6, 1.5, 0.6);
                addMesh(spikePitGeo, spikeMaterial, spikeX, 0.75, trapZ);

                var spikePointGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
                addMesh(spikePointGeo, spikeMaterial, spikeX, 1.6, trapZ);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x3D5A1A, 0.6);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xF5D5A8, 0.5);
        directionalLight.position.set(20, 25, 15);
        addLight(directionalLight);

        for (var i = 0; i < campfires.length; i++) {
            if (i % 2 === 0) {
                var pointLight = new THREE.PointLight(0xFF6600, 1.5, 20);
                pointLight.position.set(
                    campfires[i].mesh.position.x,
                    campfires[i].mesh.position.y + 1,
                    campfires[i].mesh.position.z
                );
                addLight(pointLight);
            }
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        campfires = [];
        swayingTrees = [];
        startTime = Date.now();

        buildForestFloor();
        buildPineTrees();
        buildLogPalisade();
        buildWatchtowers();
        buildBarracks();
        buildArmory();
        buildCampfires();
        buildTrapLines();
        setupLighting();
    }

    function update(delta) {
        var elapsedTime = (Date.now() - startTime) * 0.001;

        for (var i = 0; i < campfires.length; i++) {
            var campfire = campfires[i];
            var flicker = 0.1 * Math.sin(elapsedTime * 3);
            campfire.mesh.scale.set(1 + flicker, 1 + flicker, 1 + flicker);
        }

        for (var i = 0; i < swayingTrees.length; i++) {
            var tree = swayingTrees[i];
            var sway = 0.02 * Math.sin(elapsedTime * 0.8 + i);
            tree.position.x += sway;
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
        campfires = [];
        swayingTrees = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
