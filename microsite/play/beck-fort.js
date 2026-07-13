window.BeckFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Longhouse fortress hall - main structure
        var hallBody = new THREE.Mesh(
            new THREE.BoxGeometry(40, 12, 18),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        hallBody.position.set(-5, 6, 0);
        scene.add(hallBody);
        objects.push(hallBody);

        // Longhouse roof ridge - box geometry slanted effect (long cylinder ridge)
        var roofRidge = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 40, 8),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        roofRidge.rotation.z = Math.PI / 2;
        roofRidge.position.set(-5, 18, 0);
        scene.add(roofRidge);
        objects.push(roofRidge);

        // Roof ridge support posts
        var postLeft = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 16, 8),
            new THREE.MeshLambertMaterial({ color: 0x704020 })
        );
        postLeft.position.set(-5, 12, 8);
        scene.add(postLeft);
        objects.push(postLeft);

        var postRight = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 16, 8),
            new THREE.MeshLambertMaterial({ color: 0x704020 })
        );
        postRight.position.set(-5, 12, -8);
        scene.add(postRight);
        objects.push(postRight);

        // Stream-powered forge - box forge chamber
        var forgeBox = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 6),
            new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        );
        forgeBox.position.set(20, 3, -15);
        scene.add(forgeBox);
        objects.push(forgeBox);

        // Forge bellows stack - cylinder
        var bellows = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
        );
        bellows.position.set(25, 8, -15);
        scene.add(bellows);
        objects.push(bellows);

        // Drakkar longship hull - long box
        var shipHull = new THREE.Mesh(
            new THREE.BoxGeometry(30, 4, 5),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        shipHull.position.set(15, 2, 20);
        scene.add(shipHull);
        objects.push(shipHull);

        // Drakkar mast - cylinder
        var mast = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 16, 12),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        mast.position.set(15, 10, 20);
        scene.add(mast);
        objects.push(mast);

        // Drakkar sail spar - cylinder horizontal
        var sailSpar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        sailSpar.rotation.z = Math.PI / 2;
        sailSpar.position.set(15, 12, 20);
        scene.add(sailSpar);
        objects.push(sailSpar);

        // Drakkar rigging - LineSegments
        var riggingGeometry = new THREE.BufferGeometry();
        var riggingPositions = new Float32Array([
            15, 16, 20,  15, 2, 15,
            15, 16, 20,  15, 2, 25,
            15, 14, 20,  0, 5, 20,
            15, 14, 20,  30, 5, 20
        ]);
        riggingGeometry.setAttribute('position', new THREE.BufferAttribute(riggingPositions, 3));
        var riggingMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
        var rigging = new THREE.LineSegments(riggingGeometry, riggingMaterial);
        scene.add(rigging);
        objects.push(rigging);

        // Runic stone weapon cache marker 1 - tall box obelisk
        var runestone1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 8, 2),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        runestone1.position.set(-25, 4, -20);
        scene.add(runestone1);
        objects.push(runestone1);

        // Runic stone weapon cache marker 2
        var runestone2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 8, 2),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        runestone2.position.set(30, 4, -25);
        scene.add(runestone2);
        objects.push(runestone2);

        // Palisade fence wall - row of cylinder poles
        var polePositions = [-30, -20, -10, 0, 10, 20, 30];
        for (var i = 0; i < polePositions.length; i++) {
            var pole = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 10, 8),
                new THREE.MeshLambertMaterial({ color: 0x654321 })
            );
            pole.position.set(polePositions[i], 5, -30);
            scene.add(pole);
            objects.push(pole);
        }

        // Palisade cross-beams - box geometry
        var beam = new THREE.Mesh(
            new THREE.BoxGeometry(65, 1, 1),
            new THREE.MeshLambertMaterial({ color: 0x5C3D2E })
        );
        beam.position.set(0, 10, -30);
        scene.add(beam);
        objects.push(beam);

        // Water stream feature - long thin box channel
        var streamChannel = new THREE.Mesh(
            new THREE.BoxGeometry(35, 0.5, 3),
            new THREE.MeshLambertMaterial({ color: 0x4169E1 })
        );
        streamChannel.position.set(10, 0.25, 12);
        scene.add(streamChannel);
        objects.push(streamChannel);

        // Storage silo - cone near forge
        var silo = new THREE.Mesh(
            new THREE.ConeGeometry(3, 7, 12),
            new THREE.MeshLambertMaterial({ color: 0x8B6F47 })
        );
        silo.position.set(28, 3.5, -8);
        scene.add(silo);
        objects.push(silo);

        // Tool rack sphere accent at forge
        var toolRack = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        toolRack.position.set(20, 10, -8);
        scene.add(toolRack);
        objects.push(toolRack);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation updates can be added here
        if (objects && objects.length > 0) {
            // Gentle rotation of mast if needed
            for (var i = 0; i < objects.length; i++) {
                if (objects[i] && objects[i].position.x > 10 && objects[i].position.z > 15) {
                    // Slight animation for ship elements
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
