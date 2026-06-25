window.NessCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        // Rocky headland base (large box promontory)
        var headlandGeo = new THREE.BoxGeometry(80, 20, 60);
        var headlandMat = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
        var headland = new THREE.Mesh(headlandGeo, headlandMat);
        headland.position.set(0, -10, 0);
        scene.add(headland);
        objects.push(headland);

        // Clifftop machine-gun nest emplacement (stacked boxes)
        var nestBaseMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var nestBaseGeo = new THREE.BoxGeometry(20, 3, 20);
        var nestBase = new THREE.Mesh(nestBaseGeo, nestBaseMat);
        nestBase.position.set(-25, 15, -15);
        scene.add(nestBase);
        objects.push(nestBase);

        var sandbagGeo = new THREE.BoxGeometry(22, 4, 12);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var sandbag1 = new THREE.Mesh(sandbagGeo, sandbagMat);
        sandbag1.position.set(-25, 19, -15);
        scene.add(sandbag1);
        objects.push(sandbag1);

        var sandbag2 = new THREE.Mesh(sandbagGeo, sandbagMat);
        sandbag2.position.set(-25, 23, -15);
        scene.add(sandbag2);
        objects.push(sandbag2);

        // Sea cave arms cache entrance (box opening + sphere crates)
        var caveGeo = new THREE.BoxGeometry(15, 12, 8);
        var caveMat = new THREE.MeshLambertMaterial({ color: 0x36454F });
        var cave = new THREE.Mesh(caveGeo, caveMat);
        cave.position.set(20, 5, 25);
        scene.add(cave);
        objects.push(cave);

        var crateGeo = new THREE.SphereGeometry(3, 8, 8);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var crate1 = new THREE.Mesh(crateGeo, crateMat);
        crate1.position.set(18, 8, 25);
        scene.add(crate1);
        objects.push(crate1);

        var crate2 = new THREE.Mesh(crateGeo, crateMat);
        crate2.position.set(22, 8, 25);
        scene.add(crate2);
        objects.push(crate2);

        var crate3 = new THREE.Mesh(crateGeo, crateMat);
        crate3.position.set(20, 12, 25);
        scene.add(crate3);
        objects.push(crate3);

        // SIGINT listening post hut (box structure)
        var hutGeo = new THREE.BoxGeometry(18, 12, 16);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var hut = new THREE.Mesh(hutGeo, hutMat);
        hut.position.set(-20, 8, 10);
        scene.add(hut);
        objects.push(hut);

        // Multiple cylinder antennas
        var antennaGeo = new THREE.CylinderGeometry(0.8, 0.8, 25, 8);
        var antennaMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var antenna1 = new THREE.Mesh(antennaGeo, antennaMat);
        antenna1.position.set(-20, 25, 10);
        scene.add(antenna1);
        objects.push(antenna1);

        var antenna2 = new THREE.Mesh(antennaGeo, antennaMat);
        antenna2.position.set(-14, 28, 8);
        scene.add(antenna2);
        objects.push(antenna2);

        var antenna3 = new THREE.Mesh(antennaGeo, antennaMat);
        antenna3.position.set(-26, 27, 12);
        scene.add(antenna3);
        objects.push(antenna3);

        // LineSegments wires connecting antennas
        var wireGeometry = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -20, 25, 10,  -14, 28, 8,
            -14, 28, 8,   -26, 27, 12,
            -26, 27, 12,  -20, 25, 10
        ]);
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        var wires = new THREE.LineSegments(wireGeometry, wireMat);
        scene.add(wires);
        objects.push(wires);

        // Inflatable boat launch ramp (sloped box)
        var rampGeo = new THREE.BoxGeometry(30, 3, 20);
        var rampMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var ramp = new THREE.Mesh(rampGeo, rampMat);
        ramp.position.set(25, -5, -20);
        ramp.rotation.z = 0.3;
        scene.add(ramp);
        objects.push(ramp);

        // Supply submarine contact point quay (box structure)
        var quayGeo = new THREE.BoxGeometry(25, 4, 35);
        var quayMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var quay = new THREE.Mesh(quayGeo, quayMat);
        quay.position.set(-15, -8, -25);
        scene.add(quay);
        objects.push(quay);

        // Cylinder mooring bollards
        var bollardGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 8);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var bollard1 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard1.position.set(-5, -6, -20);
        scene.add(bollard1);
        objects.push(bollard1);

        var bollard2 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard2.position.set(-25, -6, -20);
        scene.add(bollard2);
        objects.push(bollard2);

        var bollard3 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard3.position.set(-5, -6, -30);
        scene.add(bollard3);
        objects.push(bollard3);

        // Observation loophole tower (tall box)
        var towerGeo = new THREE.BoxGeometry(12, 35, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(10, 10, 5);
        scene.add(tower);
        objects.push(tower);

        // Window voids as small boxes (slit windows)
        var windowGeo = new THREE.BoxGeometry(2, 2, 0.5);
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var window1 = new THREE.Mesh(windowGeo, windowMat);
        window1.position.set(10, 20, 5.3);
        scene.add(window1);
        objects.push(window1);

        var window2 = new THREE.Mesh(windowGeo, windowMat);
        window2.position.set(10, 5, 5.3);
        scene.add(window2);
        objects.push(window2);

        // Emergency escape rope system (LineSegments from cliff top to sea)
        var ropeGeometry = new THREE.BufferGeometry();
        var ropePositions = new Float32Array([
            -25, 30, -15,  -25, -10, -15,
            -30, 28, 0,    -30, -10, 0,
            -20, 32, 5,    -20, -10, 5
        ]);
        ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
        var ropeMat = new THREE.LineBasicMaterial({ color: 0xA0522D });
        var ropes = new THREE.LineSegments(ropeGeometry, ropeMat);
        scene.add(ropes);
        objects.push(ropes);

        // Cone-shaped water tank storage
        var tankGeo = new THREE.ConeGeometry(4, 8, 8);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0, 5, 20);
        scene.add(tank);
        objects.push(tank);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(40, 40, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate antenna rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.CylinderGeometry) {
                if (objects[i].position.y > 20) {
                    objects[i].rotation.y += delta * 0.5;
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
