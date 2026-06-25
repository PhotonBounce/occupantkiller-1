window.BogFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var fogSpheres = [];
    var bubbles = [];
    var time = 0;

    function buildBogGround() {
        var geometry = new THREE.BoxGeometry(200, 8, 200);
        var material = new THREE.MeshLambertMaterial({ color: 0x3d3d2d });
        var ground = new THREE.Mesh(geometry, material);
        ground.position.y = -5;
        scene.add(ground);
        objects.push(ground);

        var geometry2 = new THREE.BoxGeometry(180, 3, 180);
        var material2 = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var mud1 = new THREE.Mesh(geometry2, material2);
        mud1.position.set(-30, -2, 40);
        scene.add(mud1);
        objects.push(mud1);

        var geometry3 = new THREE.BoxGeometry(160, 2, 160);
        var material3 = new THREE.MeshLambertMaterial({ color: 0x2d3d2d });
        var mud2 = new THREE.Mesh(geometry3, material3);
        mud2.position.set(50, -3, -50);
        scene.add(mud2);
        objects.push(mud2);

        var geometry4 = new THREE.BoxGeometry(140, 2.5, 140);
        var material4 = new THREE.MeshLambertMaterial({ color: 0x3d4d3d });
        var mud3 = new THREE.Mesh(geometry4, material4);
        mud3.position.set(-40, -2.5, -60);
        scene.add(mud3);
        objects.push(mud3);
    }

    function buildFortWalls() {
        var wallPositions = [
            { x: -60, z: 0 },
            { x: -50, z: -50 },
            { x: 0, z: -70 },
            { x: 50, z: -60 },
            { x: 60, z: 0 },
            { x: 50, z: 60 },
            { x: 0, z: 70 },
            { x: -50, z: 60 }
        ];

        for (var i = 0; i < wallPositions.length; i++) {
            var pos = wallPositions[i];
            for (var j = 0; j < 8; j++) {
                var logGeo = new THREE.CylinderGeometry(1.2, 1.2, 12, 8);
                var logMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
                var log = new THREE.Mesh(logGeo, logMat);
                log.position.set(pos.x + j * 2.5, 6, pos.z);
                log.castShadow = true;
                scene.add(log);
                objects.push(log);
            }
        }
    }

    function buildWoodTowers() {
        var towerPositions = [
            { x: -70, z: -70 },
            { x: 70, z: -70 },
            { x: 70, z: 70 },
            { x: -70, z: 70 }
        ];

        for (var i = 0; i < towerPositions.length; i++) {
            var pos = towerPositions[i];

            for (var k = 0; k < 4; k++) {
                var pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
                var pillarMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
                var pillar = new THREE.Mesh(pillarGeo, pillarMat);
                pillar.position.set(pos.x + k % 2 * 6 - 3, 10, pos.z + Math.floor(k / 2) * 6 - 3);
                scene.add(pillar);
                objects.push(pillar);
            }

            var platformGeo = new THREE.BoxGeometry(14, 2, 14);
            var platformMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
            var platform = new THREE.Mesh(platformGeo, platformMat);
            platform.position.set(pos.x, 20, pos.z);
            scene.add(platform);
            objects.push(platform);

            var railGeo = new THREE.CylinderGeometry(0.8, 0.8, 14, 6);
            var railMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
            for (var r = 0; r < 4; r++) {
                var rail = new THREE.Mesh(railGeo, railMat);
                rail.rotation.z = Math.PI / 2;
                if (r === 0) rail.position.set(pos.x - 7, 23, pos.z);
                else if (r === 1) rail.position.set(pos.x + 7, 23, pos.z);
                else if (r === 2) rail.position.set(pos.x, 23, pos.z - 7);
                else rail.position.set(pos.x, 23, pos.z + 7);
                scene.add(rail);
                objects.push(rail);
            }
        }
    }

    function buildCauseway() {
        var plankPositions = [
            { x: 0, z: -35 },
            { x: 0, z: -25 },
            { x: 0, z: -15 },
            { x: 0, z: -5 },
            { x: 0, z: 5 },
            { x: 0, z: 15 },
            { x: 0, z: 25 },
            { x: 0, z: 35 }
        ];

        for (var i = 0; i < plankPositions.length; i++) {
            var pos = plankPositions[i];
            var plankGeo = new THREE.BoxGeometry(12, 1.5, 8);
            var plankMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
            var plank = new THREE.Mesh(plankGeo, plankMat);
            plank.position.set(pos.x, 3, pos.z);
            scene.add(plank);
            objects.push(plank);

            for (var j = 0; j < 3; j++) {
                var supportGeo = new THREE.CylinderGeometry(1, 1, 6, 8);
                var supportMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
                var support = new THREE.Mesh(supportGeo, supportMat);
                support.position.set(pos.x + j * 6 - 6, 0.5, pos.z);
                scene.add(support);
                objects.push(support);
            }
        }

        var handrailGeo = new THREE.CylinderGeometry(0.5, 0.5, 100, 6);
        var handrailMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var handrail1 = new THREE.Mesh(handrailGeo, handrailMat);
        handrail1.rotation.z = Math.PI / 2;
        handrail1.position.set(0, 5, -35);
        scene.add(handrail1);
        objects.push(handrail1);

        var handrail2 = new THREE.Mesh(handrailGeo, handrailMat);
        handrail2.rotation.z = Math.PI / 2;
        handrail2.position.set(0, 5, 35);
        scene.add(handrail2);
        objects.push(handrail2);
    }

    function buildBunkers() {
        var bunkerPositions = [
            { x: -15, z: -40 },
            { x: 15, z: -40 }
        ];

        for (var i = 0; i < bunkerPositions.length; i++) {
            var pos = bunkerPositions[i];

            var moundGeo = new THREE.BoxGeometry(10, 4, 10);
            var moundMat = new THREE.MeshLambertMaterial({ color: 0x6a6a5a });
            var mound = new THREE.Mesh(moundGeo, moundMat);
            mound.position.set(pos.x, 2, pos.z);
            scene.add(mound);
            objects.push(mound);

            var parapetGeo = new THREE.BoxGeometry(12, 2, 1.5);
            var parapetMat = new THREE.MeshLambertMaterial({ color: 0xc4b5a0 });
            var parapet1 = new THREE.Mesh(parapetGeo, parapetMat);
            parapet1.position.set(pos.x, 6, pos.z - 5.5);
            scene.add(parapet1);
            objects.push(parapet1);

            var parapet2 = new THREE.Mesh(parapetGeo, parapetMat);
            parapet2.position.set(pos.x, 6, pos.z + 5.5);
            scene.add(parapet2);
            objects.push(parapet2);

            var parapetSideGeo = new THREE.BoxGeometry(1.5, 2, 12);
            var parapet3 = new THREE.Mesh(parapetSideGeo, parapetMat);
            parapet3.position.set(pos.x - 5.5, 6, pos.z);
            scene.add(parapet3);
            objects.push(parapet3);

            var parapet4 = new THREE.Mesh(parapetSideGeo, parapetMat);
            parapet4.position.set(pos.x + 5.5, 6, pos.z);
            scene.add(parapet4);
            objects.push(parapet4);
        }
    }

    function buildFloatingPlatforms() {
        var platformSpecs = [
            { x: -45, z: 45, size: 10 },
            { x: 45, z: 45, size: 9 },
            { x: -45, z: -45, size: 8 },
            { x: 45, z: -45, size: 10 },
            { x: -30, z: 30, size: 7 },
            { x: 30, z: 30, size: 8 }
        ];

        for (var i = 0; i < platformSpecs.length; i++) {
            var spec = platformSpecs[i];

            for (var j = 0; j < 4; j++) {
                var stiltGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
                var stiltMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
                var stilt = new THREE.Mesh(stiltGeo, stiltMat);
                var offsetX = (j % 2) * (spec.size - 2) - (spec.size - 2) / 2;
                var offsetZ = Math.floor(j / 2) * (spec.size - 2) - (spec.size - 2) / 2;
                stilt.position.set(spec.x + offsetX, 1, spec.z + offsetZ);
                scene.add(stilt);
                objects.push(stilt);
            }

            var platformGeo = new THREE.BoxGeometry(spec.size, 1, spec.size);
            var platformMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
            var platform = new THREE.Mesh(platformGeo, platformMat);
            platform.position.set(spec.x, 4.5, spec.z);
            scene.add(platform);
            objects.push(platform);
        }
    }

    function buildStumps() {
        var stumpPositions = [
            { x: -35, z: 20 },
            { x: 35, z: -20 },
            { x: -20, z: -35 },
            { x: 20, z: 35 },
            { x: -55, z: 10 },
            { x: 55, z: -10 },
            { x: 10, z: -55 },
            { x: -10, z: 55 }
        ];

        for (var i = 0; i < stumpPositions.length; i++) {
            var pos = stumpPositions[i];

            var trunkGeo = new THREE.CylinderGeometry(1.5, 1.8, 5, 8);
            var trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
            var trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(pos.x, 2.5, pos.z);
            scene.add(trunk);
            objects.push(trunk);

            var topGeo = new THREE.SphereGeometry(1.2, 6, 6);
            var topMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
            var top = new THREE.Mesh(topGeo, topMat);
            top.position.set(pos.x, 5.5, pos.z);
            scene.add(top);
            objects.push(top);

            var tipGeo = new THREE.ConeGeometry(0.8, 2, 6);
            var tipMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
            var tip = new THREE.Mesh(tipGeo, tipMat);
            tip.position.set(pos.x, 6.8, pos.z);
            scene.add(tip);
            objects.push(tip);
        }
    }

    function buildWatchtower() {
        var baseX = -20;
        var baseZ = -20;

        for (var i = 0; i < 4; i++) {
            var pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, 30, 8);
            var pillarMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
            var pillar = new THREE.Mesh(pillarGeo, pillarMat);
            var offsetX = (i % 2) * 8 - 4;
            var offsetZ = Math.floor(i / 2) * 8 - 4;
            pillar.position.set(baseX + offsetX, 15, baseZ + offsetZ);
            scene.add(pillar);
            objects.push(pillar);
        }

        var towerGeo = new THREE.BoxGeometry(10, 8, 10);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(baseX, 24, baseZ);
        scene.add(tower);
        objects.push(tower);

        var observationGeo = new THREE.CylinderGeometry(6, 6, 2, 12);
        var observationMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
        var observation = new THREE.Mesh(observationGeo, observationMat);
        observation.position.set(baseX, 29, baseZ);
        scene.add(observation);
        objects.push(observation);

        var railGeo = new THREE.CylinderGeometry(0.6, 0.6, 12, 6);
        var railMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        for (var r = 0; r < 4; r++) {
            var rail = new THREE.Mesh(railGeo, railMat);
            rail.rotation.z = Math.PI / 2;
            if (r === 0) rail.position.set(baseX - 6, 30, baseZ);
            else if (r === 1) rail.position.set(baseX + 6, 30, baseZ);
            else if (r === 2) rail.position.set(baseX, 30, baseZ - 6);
            else rail.position.set(baseX, 30, baseZ + 6);
            scene.add(rail);
            objects.push(rail);
        }
    }

    function buildAmmoCache() {
        var cacheX = 20;
        var cacheZ = 20;

        for (var i = 0; i < 2; i++) {
            var pillarGeo = new THREE.CylinderGeometry(1, 1, 15, 8);
            var pillarMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
            var pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(cacheX + i * 12 - 6, 8, cacheZ);
            scene.add(pillar);
            objects.push(pillar);
        }

        var baseGeo = new THREE.BoxGeometry(16, 1, 8);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
        var base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(cacheX, 15.5, cacheZ);
        scene.add(base);
        objects.push(base);

        var crateGeo = new THREE.BoxGeometry(4, 4, 4);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0xc4b5a0 });
        for (var c = 0; c < 4; c++) {
            var crate = new THREE.Mesh(crateGeo, crateMat);
            crate.position.set(cacheX + c * 4 - 6, 18, cacheZ);
            scene.add(crate);
            objects.push(crate);
        }

        var roofGeo = new THREE.BoxGeometry(18, 2, 10);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(cacheX, 21, cacheZ);
        scene.add(roof);
        objects.push(roof);
    }

    function buildObsPosts() {
        var postPositions = [
            { x: 0, z: 50 },
            { x: -50, z: 0 },
            { x: 50, z: 0 },
            { x: 0, z: -50 }
        ];

        for (var i = 0; i < postPositions.length; i++) {
            var pos = postPositions[i];

            var poleGeo = new THREE.CylinderGeometry(0.8, 0.8, 18, 6);
            var poleMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
            var pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(pos.x, 9, pos.z);
            scene.add(pole);
            objects.push(pole);

            var nestGeo = new THREE.BoxGeometry(5, 3, 5);
            var nestMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
            var nest = new THREE.Mesh(nestGeo, nestMat);
            nest.position.set(pos.x, 19, pos.z);
            scene.add(nest);
            objects.push(nest);

            var railGeo = new THREE.CylinderGeometry(0.4, 0.4, 5, 4);
            var railMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
            for (var r = 0; r < 4; r++) {
                var rail = new THREE.Mesh(railGeo, railMat);
                rail.rotation.z = Math.PI / 2;
                if (r === 0) rail.position.set(pos.x - 2.5, 20.5, pos.z);
                else if (r === 1) rail.position.set(pos.x + 2.5, 20.5, pos.z);
                else if (r === 2) rail.position.set(pos.x, 20.5, pos.z - 2.5);
                else rail.position.set(pos.x, 20.5, pos.z + 2.5);
                scene.add(rail);
                objects.push(rail);
            }
        }
    }

    function buildMist() {
        for (var i = 0; i < 40; i++) {
            var fogGeo = new THREE.SphereGeometry(3 + Math.random() * 2, 4, 4);
            var fogMat = new THREE.MeshLambertMaterial({ color: 0xd0d0d0, transparent: true, opacity: 0.3 });
            var fog = new THREE.Mesh(fogGeo, fogMat);
            fog.position.set((Math.random() - 0.5) * 200, Math.random() * 3, (Math.random() - 0.5) * 200);
            fog.userData.vx = (Math.random() - 0.5) * 0.02;
            fog.userData.vz = (Math.random() - 0.5) * 0.02;
            scene.add(fog);
            objects.push(fog);
            fogSpheres.push(fog);
        }

        for (var i = 0; i < 30; i++) {
            var bubbleGeo = new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 6, 6);
            var bubbleMat = new THREE.MeshLambertMaterial({ color: 0x90b0c0, transparent: true, opacity: 0.6 });
            var bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
            bubble.position.set((Math.random() - 0.5) * 150, -4, (Math.random() - 0.5) * 150);
            bubble.userData.vy = 0.02 + Math.random() * 0.02;
            bubble.userData.startY = bubble.position.y;
            scene.add(bubble);
            objects.push(bubble);
            bubbles.push(bubble);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight1.position.set(50, 40, 50);
        dirLight1.target.position.set(0, 0, 0);
        scene.add(dirLight1);
        lights.push(dirLight1);

        var dirLight2 = new THREE.DirectionalLight(0x8899aa, 0.3);
        dirLight2.position.set(-50, 30, -50);
        scene.add(dirLight2);
        lights.push(dirLight2);

        var pointLight1 = new THREE.PointLight(0xffcc88, 0.5, 60);
        pointLight1.position.set(0, 25, 0);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xccccff, 0.3, 80);
        pointLight2.position.set(-70, 28, -70);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0xccccff, 0.3, 80);
        pointLight3.position.set(70, 28, 70);
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        fogSpheres = [];
        bubbles = [];
        time = 0;

        buildBogGround();
        buildFortWalls();
        buildWoodTowers();
        buildCauseway();
        buildBunkers();
        buildFloatingPlatforms();
        buildStumps();
        buildWatchtower();
        buildAmmoCache();
        buildObsPosts();
        buildMist();
        setupLighting();
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < fogSpheres.length; i++) {
            var fog = fogSpheres[i];
            fog.position.x += fog.userData.vx;
            fog.position.z += fog.userData.vz;

            if (fog.position.x > 110) fog.position.x = -110;
            if (fog.position.x < -110) fog.position.x = 110;
            if (fog.position.z > 110) fog.position.z = -110;
            if (fog.position.z < -110) fog.position.z = 110;
        }

        for (var i = 0; i < bubbles.length; i++) {
            var bubble = bubbles[i];
            bubble.position.y += bubble.userData.vy;

            if (bubble.position.y > bubble.userData.startY + 8) {
                bubble.position.y = bubble.userData.startY;
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
        fogSpheres = [];
        bubbles = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
