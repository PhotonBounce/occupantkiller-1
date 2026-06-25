window.EdzellPost = (function() {
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
        var baseX = 400;
        var baseZ = 370;

        buildCastleTower(baseX, baseZ);
        buildWalledGarden(baseX + 40, baseZ - 20);
        buildSigintAntennaFarm(baseX - 50, baseZ + 30);
        buildOpsCenter(baseX, baseZ + 50);
        buildSecurityFence(baseX - 80, baseZ);
        buildSatelliteTrackingDish(baseX + 60, baseZ - 60);
        buildGeneratorBlocks(baseX - 30, baseZ - 40);
        buildFlagpole(baseX + 80, baseZ);
    }

    function buildCastleTower(x, z) {
        var towerGeom = new THREE.CylinderGeometry(6, 7, 8, 12);
        var sandstone = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var tower = new THREE.Mesh(towerGeom, sandstone);
        tower.position.set(x, 4, z);
        tower.castShadow = true;
        tower.receiveShadow = true;
        scene.add(tower);
        objects.push(tower);

        var roofGeom = new THREE.ConeGeometry(6.5, 3, 12);
        var roof = new THREE.Mesh(roofGeom, sandstone);
        roof.position.set(x, 9.5, z);
        roof.scale.y = 0.3;
        roof.castShadow = true;
        roof.receiveShadow = true;
        scene.add(roof);
        objects.push(roof);

        var ruinCol1Geom = new THREE.BoxGeometry(0.8, 4, 0.8);
        var ruinCol1 = new THREE.Mesh(ruinCol1Geom, sandstone);
        ruinCol1.position.set(x - 5.5, 6, z + 5.5);
        ruinCol1.castShadow = true;
        scene.add(ruinCol1);
        objects.push(ruinCol1);

        var ruinCol2Geom = new THREE.BoxGeometry(0.8, 3, 0.8);
        var ruinCol2 = new THREE.Mesh(ruinCol2Geom, sandstone);
        ruinCol2.position.set(x + 5.5, 5.5, z - 5.5);
        ruinCol2.castShadow = true;
        scene.add(ruinCol2);
        objects.push(ruinCol2);
    }

    function buildWalledGarden(x, z) {
        var redSandstone = new THREE.MeshLambertMaterial({ color: 0xA0522D });

        var wall1Geom = new THREE.BoxGeometry(12, 4, 1);
        var wall1 = new THREE.Mesh(wall1Geom, redSandstone);
        wall1.position.set(x, 2, z);
        wall1.castShadow = true;
        wall1.receiveShadow = true;
        scene.add(wall1);
        objects.push(wall1);

        var wall2Geom = new THREE.BoxGeometry(12, 4, 1);
        var wall2 = new THREE.Mesh(wall2Geom, redSandstone);
        wall2.position.set(x, 2, z + 20);
        wall2.castShadow = true;
        wall2.receiveShadow = true;
        scene.add(wall2);
        objects.push(wall2);

        var wall3Geom = new THREE.BoxGeometry(1, 4, 20);
        var wall3 = new THREE.Mesh(wall3Geom, redSandstone);
        wall3.position.set(x - 6, 2, z + 10);
        wall3.castShadow = true;
        wall3.receiveShadow = true;
        scene.add(wall3);
        objects.push(wall3);

        var wall4Geom = new THREE.BoxGeometry(1, 4, 20);
        var wall4 = new THREE.Mesh(wall4Geom, redSandstone);
        wall4.position.set(x + 6, 2, z + 10);
        wall4.castShadow = true;
        wall4.receiveShadow = true;
        scene.add(wall4);
        objects.push(wall4);
    }

    function buildSigintAntennaFarm(x, z) {
        var metalGray = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var positions = [
            { x: 0, z: 0, h: 15 },
            { x: 8, z: 5, h: 18 },
            { x: -8, z: 5, h: 14 },
            { x: 12, z: -8, h: 16 },
            { x: -12, z: -8, h: 17 },
            { x: 0, z: -12, h: 19 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, pos.h, 8);
            var pole = new THREE.Mesh(poleGeom, metalGray);
            pole.position.set(x + pos.x, pos.h / 2, z + pos.z);
            pole.castShadow = true;
            pole.receiveShadow = true;
            scene.add(pole);
            objects.push(pole);

            var dishGeom = new THREE.SphereGeometry(1.2, 12, 8);
            var dish = new THREE.Mesh(dishGeom, metalGray);
            dish.position.set(x + pos.x, pos.h + 1.5, z + pos.z);
            dish.scale.z = 0.4;
            dish.castShadow = true;
            dish.receiveShadow = true;
            scene.add(dish);
            objects.push(dish);
        }
    }

    function buildOpsCenter(x, z) {
        var whiteHarled = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
        var buildingGeom = new THREE.BoxGeometry(8, 5, 4);
        var building = new THREE.Mesh(buildingGeom, whiteHarled);
        building.position.set(x, 2.5, z);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);
        objects.push(building);

        var roofGeom = new THREE.BoxGeometry(8.5, 0.5, 4.5);
        var roof = new THREE.Mesh(roofGeom, new THREE.MeshLambertMaterial({ color: 0x4A4A4A }));
        roof.position.set(x, 5.3, z);
        roof.castShadow = true;
        scene.add(roof);
        objects.push(roof);
    }

    function buildSecurityFence(x, z) {
        var fenceColor = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var fenceGeom = new THREE.BufferGeometry();
        var fencePositions = [
            x, 0, z,
            x + 50, 0, z,
            x + 50, 0, z + 50,
            x, 0, z + 50,
            x, 0, z
        ];
        fenceGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fencePositions), 3));

        var fenceLines = new THREE.LineSegments(fenceGeom, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 }));
        scene.add(fenceLines);
        objects.push(fenceLines);

        var towerHeight = 6;
        var corners = [
            { x: x, z: z },
            { x: x + 50, z: z },
            { x: x + 50, z: z + 50 },
            { x: x, z: z + 50 }
        ];

        for (var i = 0; i < corners.length; i++) {
            var corner = corners[i];
            var towerGeom = new THREE.CylinderGeometry(1.5, 1.5, towerHeight, 8);
            var tower = new THREE.Mesh(towerGeom, fenceColor);
            tower.position.set(corner.x, towerHeight / 2, corner.z);
            tower.castShadow = true;
            tower.receiveShadow = true;
            scene.add(tower);
            objects.push(tower);

            var topGeom = new THREE.SphereGeometry(1, 8, 8);
            var top = new THREE.Mesh(topGeom, fenceColor);
            top.position.set(corner.x, towerHeight + 0.5, corner.z);
            top.scale.set(1, 0.5, 1);
            top.castShadow = true;
            scene.add(top);
            objects.push(top);
        }
    }

    function buildSatelliteTrackingDish(x, z) {
        var metalGray = new THREE.MeshLambertMaterial({ color: 0x696969 });

        var mountGeom = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
        var mount = new THREE.Mesh(mountGeom, metalGray);
        mount.position.set(x, 1.5, z);
        mount.castShadow = true;
        mount.receiveShadow = true;
        scene.add(mount);
        objects.push(mount);

        var dishGeom = new THREE.SphereGeometry(8, 20, 10);
        var dish = new THREE.Mesh(dishGeom, metalGray);
        dish.position.set(x, 6.5, z);
        dish.scale.set(1, 0.5, 1);
        dish.castShadow = true;
        dish.receiveShadow = true;
        scene.add(dish);
        objects.push(dish);

        var rimGeom = new THREE.CylinderGeometry(8.2, 8.2, 0.3, 32);
        var rim = new THREE.Mesh(rimGeom, metalGray);
        rim.position.set(x, 3.2, z);
        rim.castShadow = true;
        scene.add(rim);
        objects.push(rim);
    }

    function buildGeneratorBlocks(x, z) {
        var yellowOrange = new THREE.MeshLambertMaterial({ color: 0xFFA500 });
        var positions = [
            { x: 0, z: 0 },
            { x: 5, z: 0 },
            { x: -5, z: 0 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var blockGeom = new THREE.BoxGeometry(3, 2.5, 3);
            var block = new THREE.Mesh(blockGeom, yellowOrange);
            block.position.set(x + pos.x, 1.25, z + pos.z);
            block.castShadow = true;
            block.receiveShadow = true;
            scene.add(block);
            objects.push(block);

            var ventGeom = new THREE.BoxGeometry(0.4, 1.2, 2.8);
            var vent = new THREE.Mesh(ventGeom, new THREE.MeshLambertMaterial({ color: 0x333333 }));
            vent.position.set(x + pos.x + 1.2, 1.8, z + pos.z);
            vent.castShadow = true;
            scene.add(vent);
            objects.push(vent);
        }
    }

    function buildFlagpole(x, z) {
        var metalGray = new THREE.MeshLambertMaterial({ color: 0x808080 });

        var poleGeom = new THREE.CylinderGeometry(0.25, 0.25, 22, 8);
        var pole = new THREE.Mesh(poleGeom, metalGray);
        pole.position.set(x, 11, z);
        pole.castShadow = true;
        pole.receiveShadow = true;
        scene.add(pole);
        objects.push(pole);

        var baseGeom = new THREE.CylinderGeometry(1.5, 1.8, 0.8, 8);
        var base = new THREE.Mesh(baseGeom, metalGray);
        base.position.set(x, 0.4, z);
        base.castShadow = true;
        base.receiveShadow = true;
        scene.add(base);
        objects.push(base);

        var topCapGeom = new THREE.ConeGeometry(0.4, 0.8, 8);
        var topCap = new THREE.Mesh(topCapGeom, metalGray);
        topCap.position.set(x, 22.5, z);
        topCap.castShadow = true;
        scene.add(topCap);
        objects.push(topCap);

        var crossBarGeom = new THREE.CylinderGeometry(0.15, 0.15, 4, 6);
        var crossBar = new THREE.Mesh(crossBarGeom, metalGray);
        crossBar.rotation.z = Math.PI / 2;
        crossBar.position.set(x, 19, z);
        crossBar.castShadow = true;
        scene.add(crossBar);
        objects.push(crossBar);
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
