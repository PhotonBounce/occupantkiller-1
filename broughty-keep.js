window.BroughtyKeep = (function() {
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
        var baseX = 240;
        var baseZ = 140;

        buildMainTower(baseX, baseZ);
        buildCastleWalls(baseX, baseZ);
        buildBattlements(baseX, baseZ);
        buildMachineGunNest(baseX, baseZ);
        buildRockyPromontory(baseX, baseZ);
        buildDrawbridge(baseX, baseZ);
        buildBannerPoles(baseX, baseZ);
        buildCoastalWire(baseX, baseZ);
    }

    function buildMainTower(baseX, baseZ) {
        var geometry = new THREE.CylinderGeometry(4, 4, 12, 16);
        var material = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var tower = new THREE.Mesh(geometry, material);
        tower.position.set(baseX, 6, baseZ);
        scene.add(tower);
        objects.push(tower);
    }

    function buildCastleWalls(baseX, baseZ) {
        var wallPositions = [
            { x: baseX + 8, z: baseZ },
            { x: baseX - 8, z: baseZ },
            { x: baseX, z: baseZ + 8 },
            { x: baseX, z: baseZ - 8 }
        ];

        for (var i = 0; i < wallPositions.length; i++) {
            var pos = wallPositions[i];
            var geometry = new THREE.BoxGeometry(8, 6, 1);
            var material = new THREE.MeshLambertMaterial({ color: 0x808080 });
            var wall = new THREE.Mesh(geometry, material);
            wall.position.set(pos.x, 3, pos.z);
            scene.add(wall);
            objects.push(wall);
        }
    }

    function buildBattlements(baseX, baseZ) {
        var cornerPositions = [
            { x: baseX + 10, z: baseZ + 10 },
            { x: baseX - 10, z: baseZ + 10 },
            { x: baseX + 10, z: baseZ - 10 },
            { x: baseX - 10, z: baseZ - 10 }
        ];

        for (var i = 0; i < cornerPositions.length; i++) {
            var pos = cornerPositions[i];
            var geometry = new THREE.BoxGeometry(2, 3, 2);
            var material = new THREE.MeshLambertMaterial({ color: 0x707070 });
            var battlement = new THREE.Mesh(geometry, material);
            battlement.position.set(pos.x, 7.5, pos.z);
            scene.add(battlement);
            objects.push(battlement);
        }
    }

    function buildMachineGunNest(baseX, baseZ) {
        var geometry = new THREE.BoxGeometry(3, 1, 3);
        var material = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var sandbag = new THREE.Mesh(geometry, material);
        sandbag.position.set(baseX, 12.5, baseZ);
        scene.add(sandbag);
        objects.push(sandbag);

        var barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 6;
        barrel.position.set(baseX + 1, 13.5, baseZ);
        scene.add(barrel);
        objects.push(barrel);
    }

    function buildRockyPromontory(baseX, baseZ) {
        var rockPositions = [
            { x: baseX - 12, z: baseZ - 12 },
            { x: baseX + 12, z: baseZ - 12 },
            { x: baseX - 15, z: baseZ + 10 },
            { x: baseX + 14, z: baseZ + 12 },
            { x: baseX, z: baseZ - 18 }
        ];

        for (var i = 0; i < rockPositions.length; i++) {
            var pos = rockPositions[i];
            var geometry = new THREE.BoxGeometry(3 + i % 2, 2.5, 4);
            var material = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var rock = new THREE.Mesh(geometry, material);
            rock.position.set(pos.x, 1.25, pos.z);
            rock.rotation.y = Math.random() * Math.PI;
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildDrawbridge(baseX, baseZ) {
        var geometry = new THREE.BoxGeometry(4, 0.5, 2);
        var material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var gate = new THREE.Mesh(geometry, material);
        gate.position.set(baseX, 3.5, baseZ - 11);
        scene.add(gate);
        objects.push(gate);

        var portcullisPoints = [];
        for (var row = 0; row < 6; row++) {
            for (var col = 0; col < 8; col++) {
                var x = baseX - 1.5 + (col * 0.5);
                var y = 2.5 + (row * 0.4);
                portcullisPoints.push(new THREE.Vector3(x, y, baseZ - 11));
                if (col < 7) {
                    portcullisPoints.push(new THREE.Vector3(x + 0.5, y, baseZ - 11));
                }
            }
        }

        var geometry2 = new THREE.BufferGeometry();
        geometry2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(portcullisPoints.length * 3), 3));
        var positions = geometry2.attributes.position.array;
        for (var i = 0; i < portcullisPoints.length; i++) {
            positions[i * 3] = portcullisPoints[i].x;
            positions[i * 3 + 1] = portcullisPoints[i].y;
            positions[i * 3 + 2] = portcullisPoints[i].z;
        }

        var lineSegments = new THREE.LineSegments(geometry2, new THREE.LineBasicMaterial({ color: 0x444444 }));
        scene.add(lineSegments);
        objects.push(lineSegments);
    }

    function buildBannerPoles(baseX, baseZ) {
        var polePositions = [
            { x: baseX - 6, z: baseZ - 5 },
            { x: baseX + 6, z: baseZ - 5 }
        ];

        for (var i = 0; i < polePositions.length; i++) {
            var pos = polePositions[i];

            var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
            var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 4, pos.z);
            scene.add(pole);
            objects.push(pole);

            var flagGeometry = new THREE.BoxGeometry(2, 1.5, 0.1);
            var flagMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
            var flag = new THREE.Mesh(flagGeometry, flagMaterial);
            flag.position.set(pos.x + 1.2, 7, pos.z);
            scene.add(flag);
            objects.push(flag);
        }
    }

    function buildCoastalWire(baseX, baseZ) {
        var wirePoints = [];
        var radius = 25;
        var segments = 12;

        for (var i = 0; i < segments; i++) {
            var angle1 = (i / segments) * Math.PI * 2;
            var angle2 = ((i + 1) / segments) * Math.PI * 2;

            var x1 = baseX + Math.cos(angle1) * radius;
            var z1 = baseZ + Math.sin(angle1) * radius;
            var x2 = baseX + Math.cos(angle2) * radius;
            var z2 = baseZ + Math.sin(angle2) * radius;

            wirePoints.push(new THREE.Vector3(x1, 1, z1));
            wirePoints.push(new THREE.Vector3(x2, 1, z2));

            wirePoints.push(new THREE.Vector3(x1, 1.5, z1));
            wirePoints.push(new THREE.Vector3(x1, 0.5, z1));
        }

        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePoints.length * 3), 3));
        var positions = geometry.attributes.position.array;
        for (var i = 0; i < wirePoints.length; i++) {
            positions[i * 3] = wirePoints[i].x;
            positions[i * 3 + 1] = wirePoints[i].y;
            positions[i * 3 + 2] = wirePoints[i].z;
        }

        var wireSegments = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x8B4513 }));
        scene.add(wireSegments);
        objects.push(wireSegments);
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
