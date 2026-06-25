window.LondonEye = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var wheelGroup = null;
    var allObjects = [];
    var OFFSET_X = 16640;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeWheelRim() {
        var rimGroup = new THREE.Group();
        for (var i = 0; i < 32; i++) {
            var angle = (i / 32) * Math.PI * 2;
            var geo = new THREE.BoxGeometry(1, 1, 6);
            var mat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(Math.cos(angle) * 28, Math.sin(angle) * 28 + 30, 0);
            mesh.rotation.z = angle;
            rimGroup.add(mesh);
        }
        return rimGroup;
    }

    function makeSpokes() {
        var spokeGroup = new THREE.Group();
        for (var i = 0; i < 16; i++) {
            var angle = (i / 16) * Math.PI * 2;
            var geo = new THREE.BoxGeometry(0.5, 0.5, 28);
            var mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var spoke = new THREE.Mesh(geo, mat);
            spoke.rotation.z = angle;
            spoke.position.set(0, 30, 0);
            spokeGroup.add(spoke);
        }
        return spokeGroup;
    }

    function makeHub() {
        var hubGroup = new THREE.Group();
        var axleGeo = new THREE.CylinderGeometry(3, 3, 3, 8);
        var axleMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var axle = new THREE.Mesh(axleGeo, axleMat);
        axle.position.set(0, 30, 0);
        hubGroup.add(axle);

        var capGeo = new THREE.CylinderGeometry(5, 5, 1, 8);
        var capMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, 30, 0);
        hubGroup.add(cap);

        return hubGroup;
    }

    function makeCapsules() {
        var capsuleGroup = new THREE.Group();
        for (var i = 0; i < 32; i++) {
            var angle = (i / 32) * Math.PI * 2;
            var geo = new THREE.SphereGeometry(2.5, 8, 6);
            var mat = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
            var pod = new THREE.Mesh(geo, mat);
            pod.position.set(Math.cos(angle) * 28, Math.sin(angle) * 28 + 30, 0);
            capsuleGroup.add(pod);
        }
        return capsuleGroup;
    }

    function makeSupportLegs() {
        var legGroup = new THREE.Group();

        var leftGeo = new THREE.BoxGeometry(2, 2, 40);
        var leftMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var leftLeg = new THREE.Mesh(leftGeo, leftMat);
        leftLeg.position.set(-10, 10, 0);
        leftLeg.rotation.z = Math.PI / 6;
        legGroup.add(leftLeg);

        var rightGeo = new THREE.BoxGeometry(2, 2, 40);
        var rightMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var rightLeg = new THREE.Mesh(rightGeo, rightMat);
        rightLeg.position.set(10, 10, 0);
        rightLeg.rotation.z = -Math.PI / 6;
        legGroup.add(rightLeg);

        var leftGeo2 = new THREE.BoxGeometry(2, 2, 40);
        var leftMat2 = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var leftLeg2 = new THREE.Mesh(leftGeo2, leftMat2);
        leftLeg2.position.set(-10, 10, 4);
        leftLeg2.rotation.z = Math.PI / 6;
        legGroup.add(leftLeg2);

        var rightGeo2 = new THREE.BoxGeometry(2, 2, 40);
        var rightMat2 = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var rightLeg2 = new THREE.Mesh(rightGeo2, rightMat2);
        rightLeg2.position.set(10, 10, 4);
        rightLeg2.rotation.z = -Math.PI / 6;
        legGroup.add(rightLeg2);

        return legGroup;
    }

    function makeSouthBankWalkway() {
        var walkGroup = new THREE.Group();

        for (var t = 0; t < 3; t++) {
            var tileGeo = new THREE.BoxGeometry(25, 0.5, 12);
            var tileMat = new THREE.MeshLambertMaterial({ color: 0xC0B0A0 });
            var tile = new THREE.Mesh(tileGeo, tileMat);
            tile.position.set(t * 26 - 26, 0, 20);
            walkGroup.add(tile);
        }

        for (var p = 0; p < 10; p++) {
            var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
            var postMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var post = new THREE.Mesh(postGeo, postMat);
            post.position.set(p * 8 - 36, 4, 14);
            walkGroup.add(post);

            var globeGeo = new THREE.SphereGeometry(1, 6, 5);
            var globeMat = new THREE.MeshLambertMaterial({ color: 0xFFFF99 });
            var globe = new THREE.Mesh(globeGeo, globeMat);
            globe.position.set(p * 8 - 36, 8.5, 14);
            walkGroup.add(globe);
        }

        return walkGroup;
    }

    function makeRiverThames() {
        var riverGroup = new THREE.Group();

        for (var w = 0; w < 4; w++) {
            var waterGeo = new THREE.BoxGeometry(30, 0.5, 20);
            var waterMat = new THREE.MeshLambertMaterial({ color: 0x1A4A7A });
            var water = new THREE.Mesh(waterGeo, waterMat);
            water.position.set(w * 31 - 46, -0.5, 50);
            riverGroup.add(water);
        }

        var wallGeo = new THREE.BoxGeometry(80, 4, 2);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, 2, 38);
        riverGroup.add(wall);

        return riverGroup;
    }

    function makeJubileeGardens() {
        var gardenGroup = new THREE.Group();

        var treePositions = [
            [-40, 0, -20],
            [-50, 0, -10],
            [-45, 0, 5],
            [-55, 0, -25],
            [-35, 0, -15]
        ];

        for (var tr = 0; tr < 5; tr++) {
            var pos = treePositions[tr];
            var trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 5, 6);
            var trunkMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
            var trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(pos[0], 2.5, pos[2]);
            gardenGroup.add(trunk);

            var canopyGeo = new THREE.SphereGeometry(4, 7, 6);
            var canopyMat = new THREE.MeshLambertMaterial({ color: 0x2D7A2D });
            var canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.set(pos[0], 8, pos[2]);
            gardenGroup.add(canopy);
        }

        var benchPositions = [
            [-38, 0, -5],
            [-48, 0, -8],
            [-42, 0, -18],
            [-52, 0, 2]
        ];

        for (var b = 0; b < 4; b++) {
            var bpos = benchPositions[b];
            var benchGeo = new THREE.BoxGeometry(3, 1, 1);
            var benchMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
            var bench = new THREE.Mesh(benchGeo, benchMat);
            bench.position.set(bpos[0], 0.5, bpos[2]);
            gardenGroup.add(bench);
        }

        var tentGeo = new THREE.BoxGeometry(12, 8, 10);
        var tentMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var tent = new THREE.Mesh(tentGeo, tentMat);
        tent.position.set(-30, 4, -30);
        gardenGroup.add(tent);

        return gardenGroup;
    }

    function build() {
        wheelGroup = new THREE.Group();

        var rim = makeWheelRim();
        wheelGroup.add(rim);

        var spokes = makeSpokes();
        wheelGroup.add(spokes);

        var hub = makeHub();
        wheelGroup.add(hub);

        var capsules = makeCapsules();
        wheelGroup.add(capsules);

        wheelGroup.position.set(OFFSET_X, 0, OFFSET_Z);
        scene.add(wheelGroup);
        allObjects.push(wheelGroup);

        var legs = makeSupportLegs();
        legs.position.set(OFFSET_X, 0, OFFSET_Z);
        scene.add(legs);
        allObjects.push(legs);

        var walkway = makeSouthBankWalkway();
        walkway.position.set(OFFSET_X, 0, OFFSET_Z);
        scene.add(walkway);
        allObjects.push(walkway);

        var river = makeRiverThames();
        river.position.set(OFFSET_X, 0, OFFSET_Z);
        scene.add(river);
        allObjects.push(river);

        var gardens = makeJubileeGardens();
        gardens.position.set(OFFSET_X, 0, OFFSET_Z);
        scene.add(gardens);
        allObjects.push(gardens);
    }

    function update(delta) {
        if (wheelGroup) {
            wheelGroup.rotation.z += delta * 0.1;
        }
    }

    function reset() {
        for (var i = 0; i < allObjects.length; i++) {
            scene.remove(allObjects[i]);
        }
        allObjects = [];
        wheelGroup = null;
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
