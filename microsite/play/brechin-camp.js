window.BrechinCamp = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        build();
    }

    function build() {
        var baseX = 320;
        var baseZ = 260;

        var sandstone = 0xD2B48C;
        var oliveDrab = 0x6B8E23;
        var green = 0x00AA00;
        var red = 0xFF0000;
        var white = 0xFFFFFF;

        buildRoundTower(baseX, 0, baseZ);
        buildCathedralRuins(baseX + 20, 0, baseZ - 25);
        buildCampPerimeterFence(baseX, 0, baseZ);
        buildTacticalHQ(baseX + 22, 3, baseZ - 22);
        buildMortarBattery(baseX - 30, 0, baseZ + 30);
        buildSupplyTents(baseX + 35, 0, baseZ + 25);
        buildRiverCheckpoint(baseX - 40, 0, baseZ);
        buildCommunicationsRelay(baseX - 35, 0, baseZ - 40);
    }

    function buildRoundTower(x, y, z) {
        var towerGeometry = new THREE.CylinderGeometry(2, 2, 16, 8);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(x, y + 8, z);
        scene.add(tower);
        objects.push(tower);

        var roofGeometry = new THREE.ConeGeometry(2.2, 4, 8);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, y + 18, z);
        scene.add(roof);
        objects.push(roof);
    }

    function buildCathedralRuins(x, y, z) {
        var naveGeometry = new THREE.BoxGeometry(10, 12, 20);
        var naveMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var nave = new THREE.Mesh(naveGeometry, naveMaterial);
        nave.position.set(x, y + 6, z);
        scene.add(nave);
        objects.push(nave);

        var leftWallGeometry = new THREE.BoxGeometry(1, 10, 20);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xB8956A });
        var leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(x - 5.5, y + 5, z);
        scene.add(leftWall);
        objects.push(leftWall);

        var rightWallGeometry = new THREE.BoxGeometry(1, 10, 20);
        var rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
        rightWall.position.set(x + 5.5, y + 5, z);
        scene.add(rightWall);
        objects.push(rightWall);
    }

    function buildCampPerimeterFence(x, y, z) {
        var linePoints = [];

        linePoints.push(new THREE.Vector3(x - 50, y + 2, z - 50));
        linePoints.push(new THREE.Vector3(x + 50, y + 2, z - 50));

        linePoints.push(new THREE.Vector3(x + 50, y + 2, z - 50));
        linePoints.push(new THREE.Vector3(x + 50, y + 2, z + 50));

        linePoints.push(new THREE.Vector3(x + 50, y + 2, z + 50));
        linePoints.push(new THREE.Vector3(x - 50, y + 2, z + 50));

        var lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0x654321, linewidth: 2 });
        var fence = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(fence);
        objects.push(fence);

        for (var i = -50; i <= 50; i += 10) {
            var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 4);
            var postMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            var post1 = new THREE.Mesh(postGeometry, postMaterial);
            post1.position.set(x + i, y + 1.5, z - 50);
            scene.add(post1);
            objects.push(post1);

            var post2 = new THREE.Mesh(postGeometry, postMaterial);
            post2.position.set(x + i, y + 1.5, z + 50);
            scene.add(post2);
            objects.push(post2);

            var post3 = new THREE.Mesh(postGeometry, postMaterial);
            post3.position.set(x + 50, y + 1.5, z + i);
            scene.add(post3);
            objects.push(post3);
        }
    }

    function buildTacticalHQ(x, y, z) {
        var hqGeometry = new THREE.BoxGeometry(6, 5, 8);
        var hqMaterial = new THREE.MeshLambertMaterial({ color: 0x00AA00 });
        var hq = new THREE.Mesh(hqGeometry, hqMaterial);
        hq.position.set(x, y + 2.5, z);
        scene.add(hq);
        objects.push(hq);
    }

    function buildMortarBattery(x, y, z) {
        var mortarHeight = 4;
        var positions = [
            { x: x, z: z },
            { x: x - 5, z: z + 4 },
            { x: x + 5, z: z + 4 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var mortarGeometry = new THREE.CylinderGeometry(0.4, 0.4, mortarHeight, 6);
            var mortarMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var mortar = new THREE.Mesh(mortarGeometry, mortarMaterial);
            mortar.position.set(positions[i].x, y + 2, positions[i].z);
            mortar.rotation.z = 0.3;
            scene.add(mortar);
            objects.push(mortar);
        }
    }

    function buildSupplyTents(x, y, z) {
        var positions = [
            { x: x, z: z },
            { x: x + 6, z: z },
            { x: x, z: z + 6 },
            { x: x + 6, z: z + 6 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var tentGeometry = new THREE.BoxGeometry(4, 3, 4);
            var tentMaterial = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
            var tent = new THREE.Mesh(tentGeometry, tentMaterial);
            tent.position.set(positions[i].x, y + 1.5, positions[i].z);
            scene.add(tent);
            objects.push(tent);
        }
    }

    function buildRiverCheckpoint(x, y, z) {
        var gateWidth = 3;
        var gateHeight = 4;
        var gateDepth = 1;

        var leftGateGeometry = new THREE.BoxGeometry(gateWidth, gateHeight, gateDepth);
        var redMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

        var leftGate = new THREE.Mesh(leftGateGeometry, redMaterial);
        leftGate.position.set(x - 2, y + 2, z);
        scene.add(leftGate);
        objects.push(leftGate);

        var stripe1Geometry = new THREE.BoxGeometry(0.8, gateHeight, gateDepth);
        var stripe1 = new THREE.Mesh(stripe1Geometry, whiteMaterial);
        stripe1.position.set(x - 2.5, y + 2, z + 0.5);
        scene.add(stripe1);
        objects.push(stripe1);

        var rightGate = new THREE.Mesh(leftGateGeometry, redMaterial);
        rightGate.position.set(x + 2, y + 2, z);
        scene.add(rightGate);
        objects.push(rightGate);

        var stripe2Geometry = new THREE.BoxGeometry(0.8, gateHeight, gateDepth);
        var stripe2 = new THREE.Mesh(stripe2Geometry, whiteMaterial);
        stripe2.position.set(x + 1.5, y + 2, z + 0.5);
        scene.add(stripe2);
        objects.push(stripe2);
    }

    function buildCommunicationsRelay(x, y, z) {
        var towerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 6);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(x, y + 6, z);
        scene.add(tower);
        objects.push(tower);

        var dishPositions = [
            { x: 0, y: 10, z: 3 },
            { x: 2.6, y: 9, z: -1.5 },
            { x: -2.6, y: 9, z: -1.5 }
        ];

        for (var i = 0; i < dishPositions.length; i++) {
            var dishGeometry = new THREE.SphereGeometry(1.2, 8, 6);
            var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
            var dish = new THREE.Mesh(dishGeometry, dishMaterial);
            dish.position.set(x + dishPositions[i].x, y + dishPositions[i].y, z + dishPositions[i].z);
            scene.add(dish);
            objects.push(dish);
        }
    }

    function update(delta) {
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
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
