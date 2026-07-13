window.PeatBog = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var gasBubbles = [];

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

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        gasBubbles = [];

        buildBogFloor();
        buildPeatPools();
        buildAncientRemains();
        buildExtractionRigs();
        buildWoodenCauseway();
        buildResearchTent();
        buildBogGas();
        buildPerimeterMarkers();
        setupLighting();
    }

    function buildBogFloor() {
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x1A0D05 });
        var tileGeo = new THREE.BoxGeometry(40, 2, 40);

        for (var x = -120; x <= 120; x += 40) {
            for (var z = -120; z <= 120; z += 40) {
                var offsetY = Math.random() * 0.5 - 0.25;
                addMesh(tileGeo, floorMat, x, offsetY, z);
            }
        }
    }

    function buildPeatPools() {
        var poolMat = new THREE.MeshLambertMaterial({ color: 0x0D0705 });
        var poolGeo = new THREE.BoxGeometry(30, 1.5, 30);

        var poolPositions = [
            [-60, 0.75, -60],
            [-20, 0.75, -80],
            [40, 0.75, -50],
            [70, 0.75, -20],
            [-70, 0.75, 20],
            [10, 0.75, 50],
            [50, 0.75, 40],
            [20, 0.75, -20]
        ];

        for (var i = 0; i < poolPositions.length; i++) {
            var pos = poolPositions[i];
            addMesh(poolGeo, poolMat, pos[0], pos[1], pos[2]);
            buildPoolBubbles(pos[0], pos[1] + 1, pos[2]);
        }
    }

    function buildPoolBubbles(px, py, pz) {
        var bubbleMat = new THREE.MeshLambertMaterial({ color: 0x0A0A0A });
        var bubbleGeo = new THREE.SphereGeometry(0.3, 4, 4);

        for (var i = 0; i < 6; i++) {
            var offsetX = (Math.random() - 0.5) * 20;
            var offsetZ = (Math.random() - 0.5) * 20;
            var bx = px + offsetX;
            var by = py + Math.random() * 0.5;
            var bz = pz + offsetZ;
            var bubble = addMesh(bubbleGeo, bubbleMat, bx, by, bz);
            gasBubbles.push({
                mesh: bubble,
                startY: by,
                velocity: 0.5 + Math.random() * 1.0,
                radius: 15 + Math.random() * 10,
                resetY: py + 0.5
            });
        }
    }

    function buildAncientRemains() {
        var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2A1A0A });

        var bodyPositions = [
            [-50, 1, -50],
            [30, 1, -40],
            [60, 1, 20],
            [-30, 1, 50],
            [10, 1, 30],
            [-80, 1, -70],
            [75, 1, 60],
            [-70, 1, 70],
            [40, 1, -70]
        ];

        for (var i = 0; i < bodyPositions.length; i++) {
            var pos = bodyPositions[i];
            buildBogBody(pos[0], pos[1], pos[2], bodyMat);
        }
    }

    function buildBogBody(x, y, z, mat) {
        var torsoGeo = new THREE.BoxGeometry(3, 8, 2);
        addMesh(torsoGeo, mat, x, y + 4, z);

        var limbGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 6);
        addMesh(limbGeo, mat, x - 3, y + 2, z);
        addMesh(limbGeo, mat, x + 3, y + 2, z);

        var legGeo = new THREE.CylinderGeometry(0.7, 0.7, 7, 6);
        addMesh(legGeo, mat, x - 2.5, y - 2, z);
        addMesh(legGeo, mat, x + 2.5, y - 2, z);

        var headGeo = new THREE.SphereGeometry(1.2, 5, 5);
        addMesh(headGeo, mat, x, y + 7, z);
    }

    function buildExtractionRigs() {
        buildExtractionRig(-40, 0, 30);
        buildExtractionRig(50, 0, -60);
        buildExtractionRig(20, 0, 70);
    }

    function buildExtractionRig(x, y, z) {
        var frameMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        var drillMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var brickMat = new THREE.MeshLambertMaterial({ color: 0x3A2A1A });

        var frameGeo = new THREE.BoxGeometry(15, 20, 8);
        addMesh(frameGeo, frameMat, x, y + 10, z);

        var drillGeo = new THREE.CylinderGeometry(1, 1.2, 12, 8);
        addMesh(drillGeo, drillMat, x, y + 8, z);

        var conveyorGeo = new THREE.BoxGeometry(20, 1, 3);
        addMesh(conveyorGeo, drillMat, x, y + 6, z);

        for (var i = 0; i < 6; i++) {
            for (var j = 0; j < 6; j++) {
                var brickGeo = new THREE.BoxGeometry(2, 1.5, 2);
                addMesh(brickGeo, brickMat, x + 10 + (i * 2.5), y + 1 + (j * 1.8), z - 5 + (j * 1.2));
            }
        }
    }

    function buildWoodenCauseway() {
        var plankMat = new THREE.MeshLambertMaterial({ color: 0x5A3A1A });
        var pileMat = new THREE.MeshLambertMaterial({ color: 0x4A2A0A });

        var path = [
            [-60, 0.5, -80],
            [-40, 0.5, -50],
            [0, 0.5, -40],
            [40, 0.5, -20],
            [60, 0.5, 30],
            [20, 0.5, 60]
        ];

        for (var i = 0; i < path.length - 1; i++) {
            var p1 = path[i];
            var p2 = path[i + 1];
            var mx = (p1[0] + p2[0]) / 2;
            var mz = (p1[2] + p2[2]) / 2;
            var dx = p2[0] - p1[0];
            var dz = p2[2] - p1[2];
            var dist = Math.sqrt(dx * dx + dz * dz);

            var plankGeo = new THREE.BoxGeometry(dist, 0.5, 3);
            var plank = addMesh(plankGeo, plankMat, mx, 2, mz);
            var angle = Math.atan2(dz, dx);
            plank.rotation.y = angle;

            var pileGeo = new THREE.CylinderGeometry(0.8, 1.2, 4, 8);
            addMesh(pileGeo, pileMat, p1[0], 2, p1[2]);
            addMesh(pileGeo, pileMat, p2[0], 2, p2[2]);
        }
    }

    function buildResearchTent() {
        var tentMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var frameMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
        var jarMat = new THREE.MeshLambertMaterial({ color: 0x3A3A5A });
        var tableMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });

        var tentGeo = new THREE.BoxGeometry(25, 15, 20);
        addMesh(tentGeo, tentMat, -80, 7.5, 60);

        var tableGeo = new THREE.BoxGeometry(12, 1, 8);
        addMesh(tableGeo, tableMat, -80, 2, 60);

        for (var i = 0; i < 12; i++) {
            var jarGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
            addMesh(jarGeo, jarMat, -85 + (i * 1.5), 3.5, 55);
        }

        for (var i = 0; i < 12; i++) {
            var notesGeo = new THREE.BoxGeometry(2, 3, 1);
            addMesh(notesGeo, frameMat, -75 + (i * 1.5), 3, 65);
        }

        var supportGeo = new THREE.CylinderGeometry(0.6, 0.6, 10, 6);
        addMesh(supportGeo, frameMat, -95, 5, 60);
        addMesh(supportGeo, frameMat, -65, 5, 60);
        addMesh(supportGeo, frameMat, -80, 5, 45);
        addMesh(supportGeo, frameMat, -80, 5, 75);
        addMesh(supportGeo, frameMat, -100, 5, 60);
        addMesh(supportGeo, frameMat, -60, 5, 60);

        for (var i = 0; i < 8; i++) {
            var shelfGeo = new THREE.BoxGeometry(20, 1, 2);
            addMesh(shelfGeo, frameMat, -80, 3 + (i * 1.5), 70);
        }
    }

    function buildBogGas() {
        var gasMat = new THREE.MeshLambertMaterial({ color: 0x88FF44 });
        var gasGeo = new THREE.SphereGeometry(0.4, 6, 6);

        for (var i = 0; i < 40; i++) {
            var gx = (Math.random() - 0.5) * 150;
            var gy = 1 + Math.random() * 8;
            var gz = (Math.random() - 0.5) * 150;
            var bubble = addMesh(gasGeo, gasMat, gx, gy, gz);
            gasBubbles.push({
                mesh: bubble,
                startX: gx,
                startY: gy,
                velocity: 0.3 + Math.random() * 0.8,
                radius: 30 + Math.random() * 40,
                resetY: 0.5
            });
        }
    }

    function buildPerimeterMarkers() {
        var postMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        var warnMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });

        var markerPositions = [
            [-120, 0, -120],
            [-120, 0, -60],
            [-120, 0, 0],
            [-120, 0, 60],
            [-120, 0, 120],
            [0, 0, -120],
            [0, 0, 120],
            [120, 0, -120],
            [120, 0, -60],
            [120, 0, 0],
            [120, 0, 60],
            [120, 0, 120],
            [-60, 0, -120],
            [-60, 0, 120],
            [60, 0, -120],
            [60, 0, 120]
        ];

        for (var i = 0; i < markerPositions.length; i++) {
            var pos = markerPositions[i];
            var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 5, 6);
            addMesh(postGeo, postMat, pos[0], 2.5, pos[1]);

            buildHazardTape(pos[0], 3, pos[1]);
        }
    }

    function buildHazardTape(x, y, z) {
        var tapeMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var points = [];
        points.push(new THREE.Vector3(x - 20, y, z - 20));
        points.push(new THREE.Vector3(x + 20, y, z - 20));
        points.push(new THREE.Vector3(x + 20, y, z + 20));
        points.push(new THREE.Vector3(x - 20, y, z + 20));
        points.push(new THREE.Vector3(x - 20, y, z - 20));

        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var line = new THREE.LineSegments(geo, tapeMat);
        scene.add(line);
        objects.push(line);
    }

    function setupLighting() {
        var ambMat = new THREE.MeshLambertMaterial({ color: 0x1A2A0A });
        var ambLight = new THREE.AmbientLight(0x1A2A0A, 0.5);
        addLight(ambLight);

        var dirLight = new THREE.DirectionalLight(0xAAAAAA, 0.6);
        dirLight.position.set(50, 80, 50);
        addLight(dirLight);

        var work1 = new THREE.PointLight(0x00AA00, 0.8, 80);
        work1.position.set(-50, 12, 30);
        addLight(work1);

        var work2 = new THREE.PointLight(0x00AA00, 0.8, 80);
        work2.position.set(50, 12, -60);
        addLight(work2);

        var work3 = new THREE.PointLight(0x00AA00, 0.7, 100);
        work3.position.set(-80, 10, 60);
        addLight(work3);
    }

    function update(delta) {
        for (var i = 0; i < gasBubbles.length; i++) {
            var bubble = gasBubbles[i];
            bubble.mesh.position.y += bubble.velocity * delta;

            if (bubble.mesh.position.y > bubble.startY + 25) {
                bubble.mesh.position.y = bubble.resetY;
            }

            var wobble = Math.sin(bubble.mesh.position.y * 0.1) * 0.3;
            bubble.mesh.position.x = bubble.startX + wobble;
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
        gasBubbles = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
