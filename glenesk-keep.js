window.GleneskKeep = (function() {
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
        var baseX = 380;
        var baseZ = 340;

        buildKeepTower(baseX, baseZ);
        buildCurtainWall(baseX, baseZ);
        buildGlenBarricade(baseX, baseZ);
        buildRockyOutcrops(baseX, baseZ);
        buildWatchtower(baseX, baseZ);
        buildSupplyZoneMarkings(baseX, baseZ);
        buildBarracks(baseX, baseZ);
        buildSteppingStones(baseX, baseZ);
    }

    function buildKeepTower(baseX, baseZ) {
        var geometry = new THREE.CylinderGeometry(4, 4, 14, 16);
        var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var tower = new THREE.Mesh(geometry, material);
        tower.position.set(baseX, 7, baseZ);
        tower.castShadow = true;
        tower.receiveShadow = true;
        scene.add(tower);
        objects.push(tower);
    }

    function buildCurtainWall(baseX, baseZ) {
        var wallPositions = [
            { x: baseX, z: baseZ - 10 },
            { x: baseX + 10, z: baseZ },
            { x: baseX, z: baseZ + 10 },
            { x: baseX - 10, z: baseZ }
        ];

        for (var i = 0; i < wallPositions.length; i++) {
            var pos = wallPositions[i];
            var geometry = new THREE.BoxGeometry(10, 5, 1);
            var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var wall = new THREE.Mesh(geometry, material);
            wall.position.set(pos.x, 2.5, pos.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);
            objects.push(wall);
        }
    }

    function buildGlenBarricade(baseX, baseZ) {
        var barricadeZ = baseZ - 25;
        var barrierSpacing = 5;

        for (var i = 0; i < 3; i++) {
            var geometry = new THREE.BoxGeometry(8, 3, 1.5);
            var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var barrier = new THREE.Mesh(geometry, material);
            barrier.position.set(baseX + (i - 1) * barrierSpacing, 1.5, barricadeZ);
            barrier.rotation.y = Math.PI / 6;
            barrier.castShadow = true;
            barrier.receiveShadow = true;
            scene.add(barrier);
            objects.push(barrier);
        }
    }

    function buildRockyOutcrops(baseX, baseZ) {
        var rockConfigs = [
            { x: baseX + 20, z: baseZ - 15, size: 6 },
            { x: baseX - 18, z: baseZ - 20, size: 5 },
            { x: baseX + 15, z: baseZ + 22, size: 7 },
            { x: baseX - 22, z: baseZ + 18, size: 4.5 },
            { x: baseX + 25, z: baseZ + 5, size: 5.5 },
            { x: baseX - 20, z: baseZ - 5, size: 6.5 }
        ];

        for (var i = 0; i < rockConfigs.length; i++) {
            var cfg = rockConfigs[i];
            var scale = cfg.size / 5;
            var geometry = new THREE.BoxGeometry(cfg.size * 0.8, cfg.size, cfg.size * 0.6);
            var material = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var rock = new THREE.Mesh(geometry, material);
            rock.position.set(cfg.x, cfg.size / 2, cfg.z);
            rock.rotation.x = Math.random() * 0.3;
            rock.rotation.z = Math.random() * 0.3;
            rock.castShadow = true;
            rock.receiveShadow = true;
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildWatchtower(baseX, baseZ) {
        var watchX = baseX + 30;
        var watchZ = baseZ + 25;

        var cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 12);
        var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var cylinder = new THREE.Mesh(cylinderGeometry, material);
        cylinder.position.set(watchX, 5, watchZ);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        scene.add(cylinder);
        objects.push(cylinder);

        var platformGeometry = new THREE.BoxGeometry(6, 1, 6);
        var platform = new THREE.Mesh(platformGeometry, material);
        platform.position.set(watchX, 10, watchZ);
        platform.castShadow = true;
        platform.receiveShadow = true;
        scene.add(platform);
        objects.push(platform);
    }

    function buildSupplyZoneMarkings(baseX, baseZ) {
        var supplyX = baseX - 25;
        var supplyZ = baseZ + 30;

        var coneGeometry = new THREE.ConeGeometry(1.5, 2, 8);
        var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });

        var cone1 = new THREE.Mesh(coneGeometry, markerMaterial);
        cone1.position.set(supplyX - 5, 1, supplyZ);
        scene.add(cone1);
        objects.push(cone1);

        var cone2 = new THREE.Mesh(coneGeometry, markerMaterial);
        cone2.position.set(supplyX + 5, 1, supplyZ);
        scene.add(cone2);
        objects.push(cone2);

        var linePoints = [
            new THREE.Vector3(supplyX - 8, 0.1, supplyZ - 8),
            new THREE.Vector3(supplyX + 8, 0.1, supplyZ + 8),
            new THREE.Vector3(supplyX - 8, 0.1, supplyZ + 8),
            new THREE.Vector3(supplyX + 8, 0.1, supplyZ - 8)
        ];

        var lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFAA00, linewidth: 2 });
        var lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lineSegments);
        objects.push(lineSegments);
    }

    function buildBarracks(baseX, baseZ) {
        var barracksX = baseX - 30;
        var barracksZ = baseZ - 30;

        var geometry = new THREE.BoxGeometry(6, 3, 4);
        var material = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        var barracks = new THREE.Mesh(geometry, material);
        barracks.position.set(barracksX, 1.5, barracksZ);
        barracks.castShadow = true;
        barracks.receiveShadow = true;
        scene.add(barracks);
        objects.push(barracks);

        var roofGeometry = new THREE.ConeGeometry(4.5, 2, 4);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(barracksX, 4, barracksZ);
        roof.castShadow = true;
        roof.receiveShadow = true;
        scene.add(roof);
        objects.push(roof);
    }

    function buildSteppingStones(baseX, baseZ) {
        var riverX = baseX - 40;
        var riverStartZ = baseZ - 40;
        var stoneCount = 8;
        var stoneSpacing = 4;

        for (var i = 0; i < stoneCount; i++) {
            var geometry = new THREE.BoxGeometry(2, 0.8, 2);
            var material = new THREE.MeshLambertMaterial({ color: 0x777777 });
            var stone = new THREE.Mesh(geometry, material);

            var offsetX = Math.sin(i * 0.5) * 3;
            stone.position.set(riverX + offsetX, 0.4, riverStartZ + i * stoneSpacing);
            stone.castShadow = true;
            stone.receiveShadow = true;
            scene.add(stone);
            objects.push(stone);
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
