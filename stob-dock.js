window.StobDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        // Palisade stake perimeter - dense sharpened stakes at slight angles
        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var x = Math.cos(angle) * 35;
            var z = Math.sin(angle) * 35;
            var tiltX = Math.sin(angle) * 0.15;
            var tiltZ = Math.cos(angle) * 0.15;

            var stakeGeom = new THREE.CylinderGeometry(0.4, 0.5, 8, 8);
            var stakeMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            var stake = new THREE.Mesh(stakeGeom, stakeMat);
            stake.position.set(x, 4, z);
            stake.rotation.x = tiltX;
            stake.rotation.z = tiltZ;
            scene.add(stake);
            objects.push(stake);
        }

        // Anti-swimmer barbed wire on submerged cylinder stakes
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var x = Math.cos(angle) * 32;
            var z = Math.sin(angle) * 32;

            var wireStakeGeom = new THREE.CylinderGeometry(0.3, 0.3, 5, 6);
            var wireStakeMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
            var wireStake = new THREE.Mesh(wireStakeGeom, wireStakeMat);
            wireStake.position.set(x, -1.5, z);
            scene.add(wireStake);
            objects.push(wireStake);

            // Barbed wire as LineSegments
            var wireGeom = new THREE.BufferGeometry();
            var wirePositions = new Float32Array([
                x - 4, -1, z - 4,
                x + 4, -1, z + 4,
                x - 4, -2, z + 4,
                x + 4, -2, z - 4
            ]);
            wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
            var wireMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
            var wireLine = new THREE.LineSegments(wireGeom, wireMat);
            scene.add(wireLine);
            objects.push(wireLine);
        }

        // Dock loading platform - box deck on cylinder piers
        for (var i = 0; i < 6; i++) {
            var pierX = -15 + (i * 6);
            var pierGeom = new THREE.CylinderGeometry(0.8, 1.0, 6, 8);
            var pierMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
            var pier = new THREE.Mesh(pierGeom, pierMat);
            pier.position.set(pierX, 0, 0);
            scene.add(pier);
            objects.push(pier);
        }

        // Platform deck
        var deckGeom = new THREE.BoxGeometry(20, 1, 8);
        var deckMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var deck = new THREE.Mesh(deckGeom, deckMat);
        deck.position.set(0, 3.5, 0);
        scene.add(deck);
        objects.push(deck);

        // Fuel barge - box hull
        var bargeGeom = new THREE.BoxGeometry(16, 4, 10);
        var bargeMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var barge = new THREE.Mesh(bargeGeom, bargeMat);
        barge.position.set(-20, 2, 15);
        scene.add(barge);
        objects.push(barge);

        // Fuel drums on barge
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 2; j++) {
                var drumX = -24 + (i * 4);
                var drumZ = 12 + (j * 4);
                var drumGeom = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 12);
                var drumMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
                var drum = new THREE.Mesh(drumGeom, drumMat);
                drum.position.set(drumX, 4.5, drumZ);
                scene.add(drum);
                objects.push(drum);
            }
        }

        // Crane lift post - tall cylinder
        var cranePostGeom = new THREE.CylinderGeometry(1.5, 2.0, 14, 10);
        var cranePostMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var cranePost = new THREE.Mesh(cranePostGeom, cranePostMat);
        cranePost.position.set(15, 7, -10);
        scene.add(cranePost);
        objects.push(cranePost);

        // Crane boom arm - box
        var boomGeom = new THREE.BoxGeometry(12, 1.2, 1.2);
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var boom = new THREE.Mesh(boomGeom, boomMat);
        boom.position.set(21, 12, -10);
        boom.rotation.z = 0.1;
        scene.add(boom);
        objects.push(boom);

        // Hook cable - LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            21, 12, -10,
            22, 8, -8,
            20, 8, -12
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x8B8B8B, linewidth: 3 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Dock security gatehouse - box walls + cone roof
        var gateBoxGeom = new THREE.BoxGeometry(6, 4, 6);
        var gateBoxMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var gateBox = new THREE.Mesh(gateBoxGeom, gateBoxMat);
        gateBox.position.set(-25, 2, -20);
        scene.add(gateBox);
        objects.push(gateBox);

        // Gatehouse cone roof
        var gateRoofGeom = new THREE.ConeGeometry(4.5, 3, 8);
        var gateRoofMat = new THREE.MeshLambertMaterial({ color: 0xCD5C5C });
        var gateRoof = new THREE.Mesh(gateRoofGeom, gateRoofMat);
        gateRoof.position.set(-25, 6.5, -20);
        scene.add(gateRoof);
        objects.push(gateRoof);

        // Supply crate stack - stacked boxes
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 2; j++) {
                var crateX = 10 + (j * 3);
                var crateY = 1.5 + (i * 3);
                var crateGeom = new THREE.BoxGeometry(2.5, 2.5, 2.5);
                var crateColors = [0xBF8F00, 0xA0826D, 0x8B4513];
                var crateMat = new THREE.MeshLambertMaterial({ color: crateColors[i] });
                var crate = new THREE.Mesh(crateGeom, crateMat);
                crate.position.set(crateX, crateY, -25);
                scene.add(crate);
                objects.push(crate);
            }
        }

        // Warning beacon post - cylinder + sphere red beacon
        var beaconPostGeom = new THREE.CylinderGeometry(0.6, 0.8, 10, 8);
        var beaconPostMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var beaconPost = new THREE.Mesh(beaconPostGeom, beaconPostMat);
        beaconPost.position.set(25, 5, 20);
        scene.add(beaconPost);
        objects.push(beaconPost);

        // Red beacon sphere
        var beaconGeom = new THREE.SphereGeometry(1.5, 16, 16);
        var beaconMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var beacon = new THREE.Mesh(beaconGeom, beaconMat);
        beacon.position.set(25, 12, 20);
        scene.add(beacon);
        objects.push(beacon);

        // Additional decorative elements - scattered supply crates
        var crate2Geom = new THREE.BoxGeometry(2, 2, 2);
        var crate2Mat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var crate2 = new THREE.Mesh(crate2Geom, crate2Mat);
        crate2.position.set(-10, 1, 25);
        scene.add(crate2);
        objects.push(crate2);

        var crate3Geom = new THREE.BoxGeometry(2, 2, 2);
        var crate3Mat = new THREE.MeshLambertMaterial({ color: 0xBF8F00 });
        var crate3 = new THREE.Mesh(crate3Geom, crate3Mat);
        crate3.position.set(5, 1, 28);
        scene.add(crate3);
        objects.push(crate3);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 25, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Beacon beacon pulsing animation
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry && objects[i].geometry.type === 'SphereGeometry') {
                    var intensity = 0.3 + 0.7 * Math.sin(Date.now() * 0.004);
                    if (objects[i].material && objects[i].material.emissive) {
                        objects[i].material.emissive.setHSL(0, 1, intensity * 0.3);
                    }
                }
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
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
