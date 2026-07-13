window.SiltBay = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var birds = [];
    var tideChannels = [];
    var time = 0;

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

    function buildSiltFlats() {
        var siltMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var tileGeo = new THREE.BoxGeometry(5, 0.5, 5);

        for (var x = -25; x < 25; x += 5) {
            for (var z = -20; z < 20; z += 5) {
                addMesh(tileGeo, siltMat, x, -0.25, z);
            }
        }

        var waterPoolMat = new THREE.MeshLambertMaterial({ color: 0x4A5F7F });
        var poolGeo = new THREE.BoxGeometry(3, 0.3, 3);
        addMesh(poolGeo, waterPoolMat, -12, -0.15, 8);
        addMesh(poolGeo, waterPoolMat, 8, -0.15, -12);
        addMesh(poolGeo, waterPoolMat, 5, -0.15, 5);
        addMesh(poolGeo, waterPoolMat, -18, -0.15, -8);
    }

    function buildStrandedShips() {
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var mastMat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });

        var ship1Hull = new THREE.BoxGeometry(8, 3, 2);
        var s1 = addMesh(ship1Hull, hullMat, -18, 1.5, 12);
        s1.rotation.z = 0.3;
        s1.rotation.x = 0.15;

        var mast1Geo = new THREE.CylinderGeometry(0.3, 0.3, 10, 8);
        addMesh(mast1Geo, mastMat, -18, 6, 12);

        var rig1Start = new THREE.Vector3(-18, 6, 12);
        var rig1End = new THREE.Vector3(-14, 2, 15);
        var rigGeo1 = new THREE.BufferGeometry();
        rigGeo1.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            rig1Start.x, rig1Start.y, rig1Start.z,
            rig1End.x, rig1End.y, rig1End.z
        ]), 3));
        var rigMat = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
        var rig1 = new THREE.LineSegments(rigGeo1, rigMat);
        scene.add(rig1);
        objects.push(rig1);

        var ship2Hull = new THREE.BoxGeometry(7, 2.5, 2);
        var s2 = addMesh(ship2Hull, hullMat, 12, 1.25, -15);
        s2.rotation.z = -0.25;
        s2.rotation.x = -0.1;

        var mast2Geo = new THREE.CylinderGeometry(0.25, 0.25, 8, 8);
        addMesh(mast2Geo, mastMat, 12, 5.5, -15);

        var rig2Start = new THREE.Vector3(12, 5.5, -15);
        var rig2End = new THREE.Vector3(15, 1.5, -12);
        var rigGeo2 = new THREE.BufferGeometry();
        rigGeo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            rig2Start.x, rig2Start.y, rig2Start.z,
            rig2End.x, rig2End.y, rig2End.z
        ]), 3));
        var rig2 = new THREE.LineSegments(rigGeo2, rigMat);
        scene.add(rig2);
        objects.push(rig2);

        var ship3Hull = new THREE.BoxGeometry(6, 2, 1.8);
        var s3 = addMesh(ship3Hull, hullMat, 0, 1, -20);
        s3.rotation.z = 0.2;
        s3.rotation.x = 0.05;

        var mast3Geo = new THREE.CylinderGeometry(0.2, 0.2, 7, 8);
        addMesh(mast3Geo, mastMat, 0, 4.5, -20);

        var rig3Start = new THREE.Vector3(0, 4.5, -20);
        var rig3End = new THREE.Vector3(3, 0.5, -18);
        var rigGeo3 = new THREE.BufferGeometry();
        rigGeo3.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            rig3Start.x, rig3Start.y, rig3Start.z,
            rig3End.x, rig3End.y, rig3End.z
        ]), 3));
        var rig3 = new THREE.LineSegments(rigGeo3, rigMat);
        scene.add(rig3);
        objects.push(rig3);
    }

    function buildCoastalBattery() {
        var carriageMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
        var moundMat = new THREE.MeshLambertMaterial({ color: 0x7A6B4D });

        var earthMoundGeo = new THREE.BoxGeometry(20, 2, 20);
        addMesh(earthMoundGeo, moundMat, 15, 1, 8);

        var positions = [
            { x: 8, z: 4 },
            { x: 12, z: 0 },
            { x: 16, z: 2 },
            { x: 20, z: -2 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var carriageGeo = new THREE.BoxGeometry(2, 1.5, 2);
            addMesh(carriageGeo, carriageMat, pos.x, 2.75, pos.z);

            var barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 12);
            var barrel = addMesh(barrelGeo, barrelMat, pos.x, 3.5, pos.z);
            barrel.rotation.z = Math.PI / 8;
        }
    }

    function buildFishingVillage() {
        var cottageMatWall = new THREE.MeshLambertMaterial({ color: 0xCD8D5A });
        var cottageMatRoof = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x5F3D1F });

        var positions = [
            { x: -22, z: -15 },
            { x: -16, z: -18 },
            { x: -10, z: -14 },
            { x: -4, z: -17 },
            { x: 2, z: -12 },
            { x: 8, z: -16 },
            { x: 14, z: -13 },
            { x: 20, z: -18 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];

            var wallGeo = new THREE.BoxGeometry(2.5, 2, 3);
            addMesh(wallGeo, cottageMatWall, pos.x, 1, pos.z);

            var roofGeo = new THREE.BoxGeometry(3, 1, 3.5);
            addMesh(roofGeo, cottageMatRoof, pos.x, 3, pos.z);

            var boatGeo = new THREE.BoxGeometry(3, 0.8, 1.2);
            var boat = addMesh(boatGeo, boatMat, pos.x + 3, 0.4, pos.z + 2);
            boat.rotation.x = 0.1;
        }

        var netMat = new THREE.LineBasicMaterial({ color: 0xBEAD6B });
        var netStartX = -24;
        var netStartZ = -14;
        var netEndX = -20;
        var netEndZ = -12;

        for (var n = 0; n < 3; n++) {
            var nStart = new THREE.Vector3(netStartX + n * 2, 2.5, netStartZ);
            var nEnd = new THREE.Vector3(netEndX + n * 2, 2.5, netEndZ);
            var netGeo = new THREE.BufferGeometry();
            netGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
                nStart.x, nStart.y, nStart.z,
                nEnd.x, nEnd.y, nEnd.z
            ]), 3));
            var net = new THREE.LineSegments(netGeo, netMat);
            scene.add(net);
            objects.push(net);
        }
    }

    function buildTideChannels() {
        var channelMat = new THREE.MeshLambertMaterial({ color: 0x3D5A6F });

        var channel1 = new THREE.BoxGeometry(2, 0.4, 15);
        var c1 = addMesh(channel1, channelMat, -8, -0.2, 0);
        tideChannels.push(c1);

        var channel2 = new THREE.BoxGeometry(3, 0.4, 18);
        var c2 = addMesh(channel2, channelMat, 10, -0.2, -5);
        tideChannels.push(c2);

        var channel3 = new THREE.BoxGeometry(2.5, 0.4, 20);
        var c3 = addMesh(channel3, channelMat, -15, -0.2, 5);
        tideChannels.push(c3);
    }

    function buildSeaBirds() {
        var birdMatBody = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var birdMatWing = new THREE.MeshLambertMaterial({ color: 0x5F5F5F });

        var birdPositions = [
            { x: -20, y: 8, z: 10 },
            { x: -10, y: 12, z: -5 },
            { x: 5, y: 10, z: 15 },
            { x: 15, y: 9, z: -18 },
            { x: -15, y: 11, z: -8 },
            { x: 10, y: 13, z: 8 },
            { x: -5, y: 7, z: 18 },
            { x: 20, y: 14, z: 0 },
            { x: 0, y: 9, z: -12 },
            { x: 8, y: 11, z: 10 },
            { x: -18, y: 10, z: 5 },
            { x: 12, y: 12, z: -8 }
        ];

        for (var i = 0; i < birdPositions.length; i++) {
            var bp = birdPositions[i];

            var bodyGeo = new THREE.BoxGeometry(0.3, 0.2, 0.5);
            var body = addMesh(bodyGeo, birdMatBody, bp.x, bp.y, bp.z);

            var wingGeo = new THREE.BoxGeometry(1.2, 0.1, 0.3);
            addMesh(wingGeo, birdMatWing, bp.x, bp.y, bp.z);

            birds.push({
                mesh: body,
                baseY: bp.y,
                phase: i * 0.5
            });
        }
    }

    function buildMarshReeds() {
        var reedMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });

        var reedPositions = [
            { x: -26, z: -22 },
            { x: -24, z: -20 },
            { x: -25, z: -18 },
            { x: 25, z: -19 },
            { x: 26, z: -21 },
            { x: 24, z: -18 },
            { x: -27, z: 18 },
            { x: -25, z: 20 },
            { x: 27, z: 19 },
            { x: 26, z: 21 }
        ];

        for (var i = 0; i < reedPositions.length; i++) {
            var rp = reedPositions[i];

            for (var j = 0; j < 4; j++) {
                var reedGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 4);
                addMesh(reedGeo, reedMat, rp.x + j * 0.3, 1.25, rp.z + j * 0.2);
            }
        }

        for (var k = 0; k < 5; k++) {
            for (var r = 0; r < 2; r++) {
                var reedGeo2 = new THREE.CylinderGeometry(0.08, 0.08, 2, 4);
                addMesh(reedGeo2, reedMat, -12 + k * 3, 1, 22 + r * 1.5);
            }
        }
    }

    function buildLookoutPost() {
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var platformMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });

        var poleGeo = new THREE.CylinderGeometry(0.4, 0.4, 14, 8);
        addMesh(poleGeo, poleMat, -22, 7, 18);

        var platformGeo = new THREE.BoxGeometry(3, 0.4, 3);
        addMesh(platformGeo, platformMat, -22, 15, 18);

        var railGeo = new THREE.BoxGeometry(3.2, 0.2, 3.2);
        addMesh(railGeo, poleMat, -22, 15.5, 18);

        var ropeMat = new THREE.LineBasicMaterial({ color: 0xD2691E });

        for (var rung = 0; rung < 8; rung++) {
            var ropeY = 1 + rung * 1.75;
            var ropeStart = new THREE.Vector3(-22.4, ropeY, 18);
            var ropeEnd = new THREE.Vector3(-21.6, ropeY, 18);
            var ropeGeo = new THREE.BufferGeometry();
            ropeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
                ropeStart.x, ropeStart.y, ropeStart.z,
                ropeEnd.x, ropeEnd.y, ropeEnd.z
            ]), 3));
            var rope = new THREE.LineSegments(ropeGeo, ropeMat);
            scene.add(rope);
            objects.push(rope);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x88AAAA, 0.6);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xD4AF9F, 0.7);
        directionalLight.position.set(15, 12, -10);
        directionalLight.castShadow = true;
        addLight(directionalLight);

        var rimLight = new THREE.DirectionalLight(0x7899AA, 0.3);
        rimLight.position.set(-20, 8, 15);
        addLight(rimLight);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        birds = [];
        tideChannels = [];
        time = 0;

        buildSiltFlats();
        buildStrandedShips();
        buildCoastalBattery();
        buildFishingVillage();
        buildTideChannels();
        buildSeaBirds();
        buildMarshReeds();
        buildLookoutPost();
        setupLighting();
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < birds.length; i++) {
            var bird = birds[i];
            var bobAmount = Math.sin(time * 2 + bird.phase) * 0.5;
            bird.mesh.position.y = bird.baseY + bobAmount;
        }

        for (var t = 0; t < tideChannels.length; t++) {
            var channel = tideChannels[t];
            var depthVariation = Math.sin(time * 0.5 + t) * 0.08;
            channel.scale.y = 1 + depthVariation;
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
        birds = [];
        tideChannels = [];
        scene = null;
        camera = null;
        time = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
