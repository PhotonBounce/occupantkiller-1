window.CarnoustiePost = (function() {
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
        var baseX = 260;
        var baseZ = 170;

        buildClubhouse(baseX, baseZ);
        buildDunes(baseX, baseZ);
        buildObservationTower(baseX + 40, baseZ + 50);
        buildBunkers(baseX - 20, baseZ + 30);
        buildRadarDish(baseX + 60, baseZ + 20);
        buildSupplyDepot(baseX + 80, baseZ - 40);
        buildMedicalTent(baseX - 50, baseZ + 15);
        buildFencePerimeter(baseX, baseZ);
    }

    function buildClubhouse(x, z) {
        var geometry = new THREE.BoxGeometry(8, 6, 4);
        var material = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 3, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildDunes(x, z) {
        var dunePositions = [
            [x - 30, z - 20],
            [x - 20, z + 10],
            [x + 25, z - 30],
            [x + 35, z + 5],
            [x - 15, z + 40],
            [x + 50, z - 10]
        ];

        for (var i = 0; i < dunePositions.length; i++) {
            var pos = dunePositions[i];
            var width = 12 + Math.random() * 8;
            var depth = 10 + Math.random() * 6;
            var height = 5 + Math.random() * 4;

            var geometry = new THREE.BoxGeometry(width, height, depth);
            var material = new THREE.MeshLambertMaterial({ color: 0xC2B280 });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(pos[0], height / 2, pos[1]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildObservationTower(x, z) {
        var geometry = new THREE.CylinderGeometry(2, 2.5, 12, 8);
        var material = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 6, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);

        var platformGeometry = new THREE.BoxGeometry(5, 0.5, 5);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(x, 12.5, z);
        platform.castShadow = true;
        platform.receiveShadow = true;
        scene.add(platform);
        objects.push(platform);
    }

    function buildBunkers(centerX, centerZ) {
        var bunkerCount = 4;
        var radius = 25;

        for (var i = 0; i < bunkerCount; i++) {
            var angle = (i / bunkerCount) * Math.PI;
            var bx = centerX + Math.cos(angle) * radius;
            var bz = centerZ + Math.sin(angle) * radius;

            var geometry = new THREE.BoxGeometry(6, 2, 8);
            var material = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(bx, 1, bz);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildRadarDish(x, z) {
        var poleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
        var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, 7.5, z);
        pole.castShadow = true;
        pole.receiveShadow = true;
        scene.add(pole);
        objects.push(pole);

        var dishGeometry = new THREE.SphereGeometry(4, 16, 12);
        var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var dish = new THREE.Mesh(dishGeometry, dishMaterial);
        dish.position.set(x, 16, z);
        dish.scale.set(1, 0.6, 1);
        dish.castShadow = true;
        dish.receiveShadow = true;
        scene.add(dish);
        objects.push(dish);
    }

    function buildSupplyDepot(x, z) {
        var containerPositions = [
            [x - 5, z],
            [x + 5, z],
            [x, z + 8]
        ];

        for (var i = 0; i < containerPositions.length; i++) {
            var pos = containerPositions[i];
            var geometry = new THREE.BoxGeometry(4, 4, 6);
            var material = new THREE.MeshLambertMaterial({ color: 0x6B6B2F });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(pos[0], 2, pos[1]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildMedicalTent(x, z) {
        var tentGeometry = new THREE.BoxGeometry(6, 5, 8);
        var tentMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var tent = new THREE.Mesh(tentGeometry, tentMaterial);
        tent.position.set(x, 2.5, z);
        tent.castShadow = true;
        tent.receiveShadow = true;
        scene.add(tent);
        objects.push(tent);

        var crossGeometry = new THREE.BoxGeometry(1, 2, 0.2);
        var crossMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });

        var crossH = new THREE.Mesh(crossGeometry, crossMaterial);
        crossH.position.set(x, 5.5, z);
        crossH.castShadow = true;
        scene.add(crossH);
        objects.push(crossH);

        var crossV = new THREE.Mesh(crossGeometry, crossMaterial);
        crossV.position.set(x, 5.5, z);
        crossV.rotation.z = Math.PI / 2;
        crossV.castShadow = true;
        scene.add(crossV);
        objects.push(crossV);
    }

    function buildFencePerimeter(x, z) {
        var fenceDistance = 60;
        var gridSpacing = 6;
        var fenceHeight = 2;
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0x404040, linewidth: 2 });

        var corners = [
            [-fenceDistance, -fenceDistance],
            [fenceDistance, -fenceDistance],
            [fenceDistance, fenceDistance],
            [-fenceDistance, fenceDistance],
            [-fenceDistance, -fenceDistance]
        ];

        var lineGeometry = new THREE.BufferGeometry();
        var points = [];

        for (var i = 0; i < corners.length; i++) {
            var corner = corners[i];
            points.push(new THREE.Vector3(x + corner[0], 0, z + corner[1]));
            points.push(new THREE.Vector3(x + corner[0], fenceHeight, z + corner[1]));
        }

        lineGeometry.setFromPoints(points);
        var fence = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(fence);
        objects.push(fence);

        var gridX = -fenceDistance;
        while (gridX <= fenceDistance) {
            var gridGeometry = new THREE.BufferGeometry();
            var gridPoints = [
                new THREE.Vector3(x + gridX, 0, z - fenceDistance),
                new THREE.Vector3(x + gridX, fenceHeight, z - fenceDistance),
                new THREE.Vector3(x + gridX, 0, z + fenceDistance),
                new THREE.Vector3(x + gridX, fenceHeight, z + fenceDistance)
            ];
            gridGeometry.setFromPoints(gridPoints);
            var gridLine = new THREE.LineSegments(gridGeometry, lineMaterial);
            scene.add(gridLine);
            objects.push(gridLine);
            gridX += gridSpacing;
        }

        var gridZ = -fenceDistance;
        while (gridZ <= fenceDistance) {
            var gridGeometry = new THREE.BufferGeometry();
            var gridPoints = [
                new THREE.Vector3(x - fenceDistance, 0, z + gridZ),
                new THREE.Vector3(x - fenceDistance, fenceHeight, z + gridZ),
                new THREE.Vector3(x + fenceDistance, 0, z + gridZ),
                new THREE.Vector3(x + fenceDistance, fenceHeight, z + gridZ)
            ];
            gridGeometry.setFromPoints(gridPoints);
            var gridLine = new THREE.LineSegments(gridGeometry, lineMaterial);
            scene.add(gridLine);
            objects.push(gridLine);
            gridZ += gridSpacing;
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
