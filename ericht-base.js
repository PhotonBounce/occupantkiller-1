window.ErichtBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        var brownMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var grayMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var darkGrayMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var metalMaterial = new THREE.MeshLambertMaterial({ color: 0xb0b0b0 });
        var darkBlueMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
        var greenMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var redMaterial = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        var yellowMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });

        // Loch shoreline - main base compound box
        var lochBoxGeom = new THREE.BoxGeometry(50, 8, 40);
        var lochBox = new THREE.Mesh(lochBoxGeom, grayMaterial);
        lochBox.position.set(-5, -4, 0);
        lochBox.castShadow = true;
        lochBox.receiveShadow = true;
        scene.add(lochBox);
        objects.push(lochBox);

        // Hydroelectric dam wall - large box structure
        var damWallGeom = new THREE.BoxGeometry(60, 18, 6);
        var damWall = new THREE.Mesh(damWallGeom, darkGrayMaterial);
        damWall.position.set(25, 2, -35);
        damWall.castShadow = true;
        damWall.receiveShadow = true;
        scene.add(damWall);
        objects.push(damWall);

        // Penstock pipe 1 - cylinder
        var penstockGeom = new THREE.CylinderGeometry(3, 3, 25, 16);
        var penstock1 = new THREE.Mesh(penstockGeom, metalMaterial);
        penstock1.position.set(10, -5, -25);
        penstock1.rotation.z = 0.5;
        penstock1.castShadow = true;
        penstock1.receiveShadow = true;
        scene.add(penstock1);
        objects.push(penstock1);

        // Penstock pipe 2 - cylinder
        var penstock2 = new THREE.Mesh(penstockGeom, metalMaterial);
        penstock2.position.set(20, -5, -25);
        penstock2.rotation.z = 0.5;
        penstock2.castShadow = true;
        penstock2.receiveShadow = true;
        scene.add(penstock2);
        objects.push(penstock2);

        // Power station strongpoint - main building box
        var powerStationGeom = new THREE.BoxGeometry(20, 12, 18);
        var powerStation = new THREE.Mesh(powerStationGeom, brownMaterial);
        powerStation.position.set(-20, 1, 15);
        powerStation.castShadow = true;
        powerStation.receiveShadow = true;
        scene.add(powerStation);
        objects.push(powerStation);

        // Turbine 1 - cylinder
        var turbineGeom = new THREE.CylinderGeometry(2.5, 2.5, 8, 16);
        var turbine1 = new THREE.Mesh(turbineGeom, metalMaterial);
        turbine1.position.set(-18, 2, 18);
        turbine1.rotation.x = Math.PI / 2.5;
        turbine1.castShadow = true;
        turbine1.receiveShadow = true;
        scene.add(turbine1);
        objects.push(turbine1);

        // Turbine 2 - cylinder
        var turbine2 = new THREE.Mesh(turbineGeom, metalMaterial);
        turbine2.position.set(-22, 2, 18);
        turbine2.rotation.x = Math.PI / 2.5;
        turbine2.castShadow = true;
        turbine2.receiveShadow = true;
        scene.add(turbine2);
        objects.push(turbine2);

        // Transmission pylon 1 - tall cylinder
        var pylonGeom = new THREE.CylinderGeometry(1.5, 2, 20, 12);
        var pylon1 = new THREE.Mesh(pylonGeom, metalMaterial);
        pylon1.position.set(-28, 5, -10);
        pylon1.castShadow = true;
        pylon1.receiveShadow = true;
        scene.add(pylon1);
        objects.push(pylon1);

        // Transmission pylon 2
        var pylon2 = new THREE.Mesh(pylonGeom, metalMaterial);
        pylon2.position.set(-5, 5, -20);
        pylon2.castShadow = true;
        pylon2.receiveShadow = true;
        scene.add(pylon2);
        objects.push(pylon2);

        // Transmission pylon 3
        var pylon3 = new THREE.Mesh(pylonGeom, metalMaterial);
        pylon3.position.set(20, 5, -15);
        pylon3.castShadow = true;
        pylon3.receiveShadow = true;
        scene.add(pylon3);
        objects.push(pylon3);

        // Power lines between pylons - LineSegments
        var powerLineGeom = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -28, 15, -10,
            -5, 15, -20,
            -5, 15, -20,
            20, 15, -15
        ]);
        powerLineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var powerLine = new THREE.LineSegments(powerLineGeom, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 }));
        scene.add(powerLine);
        objects.push(powerLine);

        // Dam sluice gate - box
        var gateGeom = new THREE.BoxGeometry(8, 6, 2);
        var gate = new THREE.Mesh(gateGeom, darkGrayMaterial);
        gate.position.set(35, -2, -32);
        gate.castShadow = true;
        gate.receiveShadow = true;
        scene.add(gate);
        objects.push(gate);

        // Sluice wheel mechanism - cone
        var wheelGeom = new THREE.ConeGeometry(3, 1.5, 12);
        var wheel = new THREE.Mesh(wheelGeom, metalMaterial);
        wheel.position.set(35, 3, -32);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        scene.add(wheel);
        objects.push(wheel);

        // Underwater boom obstacle cable anchor 1 - box
        var anchorGeom = new THREE.BoxGeometry(3, 2, 3);
        var anchor1 = new THREE.Mesh(anchorGeom, grayMaterial);
        anchor1.position.set(-15, -8, 25);
        anchor1.castShadow = true;
        anchor1.receiveShadow = true;
        scene.add(anchor1);
        objects.push(anchor1);

        // Underwater boom obstacle cable anchor 2 - box
        var anchor2 = new THREE.Mesh(anchorGeom, grayMaterial);
        anchor2.position.set(5, -8, 28);
        anchor2.castShadow = true;
        anchor2.receiveShadow = true;
        scene.add(anchor2);
        objects.push(anchor2);

        // Underwater boom cable - LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cablePos = new Float32Array([
            -15, -7, 25,
            5, -7, 28
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePos, 3));
        var cable = new THREE.LineSegments(cableGeom, new THREE.LineBasicMaterial({ color: 0x554433, linewidth: 2 }));
        scene.add(cable);
        objects.push(cable);

        // Cliff face box
        var cliffGeom = new THREE.BoxGeometry(12, 25, 3);
        var cliff = new THREE.Mesh(cliffGeom, darkGrayMaterial);
        cliff.position.set(-30, 5, 20);
        cliff.castShadow = true;
        cliff.receiveShadow = true;
        scene.add(cliff);
        objects.push(cliff);

        // Abseil ropes down cliff - LineSegments
        var ropeGeom = new THREE.BufferGeometry();
        var ropePositions = new Float32Array([
            -36, 18, 20,
            -36, -8, 20,
            -30, 18, 20,
            -30, -8, 20,
            -24, 18, 20,
            -24, -8, 20
        ]);
        ropeGeom.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
        var ropes = new THREE.LineSegments(ropeGeom, new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 }));
        scene.add(ropes);
        objects.push(ropes);

        // Remote forward supply cache - stacked crate boxes
        var crateGeom = new THREE.BoxGeometry(4, 4, 4);
        var crate1 = new THREE.Mesh(crateGeom, brownMaterial);
        crate1.position.set(15, 2, 8);
        crate1.castShadow = true;
        crate1.receiveShadow = true;
        scene.add(crate1);
        objects.push(crate1);

        var crate2 = new THREE.Mesh(crateGeom, greenMaterial);
        crate2.position.set(20, 2, 8);
        crate2.castShadow = true;
        crate2.receiveShadow = true;
        scene.add(crate2);
        objects.push(crate2);

        var crate3 = new THREE.Mesh(crateGeom, brownMaterial);
        crate3.position.set(17.5, 6, 8);
        crate3.castShadow = true;
        crate3.receiveShadow = true;
        scene.add(crate3);
        objects.push(crate3);

        // Supply spheres
        var supplyGeom = new THREE.SphereGeometry(1.5, 12, 12);
        var supply1 = new THREE.Mesh(supplyGeom, yellowMaterial);
        supply1.position.set(14, 7, 9);
        supply1.castShadow = true;
        supply1.receiveShadow = true;
        scene.add(supply1);
        objects.push(supply1);

        var supply2 = new THREE.Mesh(supplyGeom, redMaterial);
        supply2.position.set(21, 7, 9);
        supply2.castShadow = true;
        supply2.receiveShadow = true;
        scene.add(supply2);
        objects.push(supply2);

        // Lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -60;
        directionalLight.shadow.camera.right = 60;
        directionalLight.shadow.camera.top = 40;
        directionalLight.shadow.camera.bottom = -40;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.0001 * delta;
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
