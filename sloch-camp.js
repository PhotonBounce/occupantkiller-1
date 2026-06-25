window.SlochCamp = (function() {
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
        // Bowl terrain walls - forming hollow
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        // North wall
        var northWallGeo = new THREE.BoxGeometry(60, 8, 4);
        var northWall = new THREE.Mesh(northWallGeo, wallMaterial);
        northWall.position.set(0, 4, -28);
        scene.add(northWall);
        objects.push(northWall);

        // South wall
        var southWallGeo = new THREE.BoxGeometry(60, 8, 4);
        var southWall = new THREE.Mesh(southWallGeo, wallMaterial);
        southWall.position.set(0, 4, 28);
        scene.add(southWall);
        objects.push(southWall);

        // East wall
        var eastWallGeo = new THREE.BoxGeometry(4, 8, 60);
        var eastWall = new THREE.Mesh(eastWallGeo, wallMaterial);
        eastWall.position.set(28, 4, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        // West wall
        var westWallGeo = new THREE.BoxGeometry(4, 8, 60);
        var westWall = new THREE.Mesh(westWallGeo, wallMaterial);
        westWall.position.set(-28, 4, 0);
        scene.add(westWall);
        objects.push(westWall);

        // Camouflage overhead net support poles
        var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var poleGeo = new THREE.CylinderGeometry(1.5, 1.5, 12, 16);

        var pole1 = new THREE.Mesh(poleGeo, poleMaterial);
        pole1.position.set(-15, 6, -15);
        scene.add(pole1);
        objects.push(pole1);

        var pole2 = new THREE.Mesh(poleGeo, poleMaterial);
        pole2.position.set(15, 6, -15);
        scene.add(pole2);
        objects.push(pole2);

        var pole3 = new THREE.Mesh(poleGeo, poleMaterial);
        pole3.position.set(-15, 6, 15);
        scene.add(pole3);
        objects.push(pole3);

        var pole4 = new THREE.Mesh(poleGeo, poleMaterial);
        pole4.position.set(15, 6, 15);
        scene.add(pole4);
        objects.push(pole4);

        // Camouflage net wireframe (LineSegments)
        var netPoints = [];
        netPoints.push(new THREE.Vector3(-15, 12, -15));
        netPoints.push(new THREE.Vector3(15, 12, -15));
        netPoints.push(new THREE.Vector3(15, 12, 15));
        netPoints.push(new THREE.Vector3(-15, 12, 15));
        netPoints.push(new THREE.Vector3(-15, 12, -15));
        netPoints.push(new THREE.Vector3(15, 12, 15));
        netPoints.push(new THREE.Vector3(15, 12, -15));
        netPoints.push(new THREE.Vector3(-15, 12, 15));

        var netGeo = new THREE.BufferGeometry().setFromPoints(netPoints);
        var netLine = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0x228B22 }));
        scene.add(netLine);
        objects.push(netLine);

        // Mortar pit
        var pitMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var pitGeo = new THREE.CylinderGeometry(6, 7, 3, 32);
        var pit = new THREE.Mesh(pitGeo, pitMaterial);
        pit.position.set(-20, 1.5, -20);
        scene.add(pit);
        objects.push(pit);

        // Mortar barrel
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var barrelGeo = new THREE.CylinderGeometry(1.2, 1.5, 8, 16);
        var barrel = new THREE.Mesh(barrelGeo, barrelMaterial);
        barrel.position.set(-20, 7, -20);
        barrel.rotation.z = 0.6;
        scene.add(barrel);
        objects.push(barrel);

        // Generator bunker
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x704214 });
        var bunkerGeo = new THREE.BoxGeometry(8, 6, 10);
        var bunker = new THREE.Mesh(bunkerGeo, bunkerMaterial);
        bunker.position.set(20, 3, -18);
        scene.add(bunker);
        objects.push(bunker);

        // Generator exhaust pipe
        var exhaustGeo = new THREE.CylinderGeometry(1, 1, 6, 12);
        var exhaust = new THREE.Mesh(exhaustGeo, barrelMaterial);
        exhaust.position.set(24, 9, -18);
        scene.add(exhaust);
        objects.push(exhaust);

        // Command tent base
        var tentBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var tentGeo = new THREE.BoxGeometry(10, 5, 10);
        var tentBase = new THREE.Mesh(tentGeo, tentBaseMaterial);
        tentBase.position.set(0, 2.5, 0);
        scene.add(tentBase);
        objects.push(tentBase);

        // Command tent cone roof
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var roofGeo = new THREE.ConeGeometry(6, 6, 32);
        var roof = new THREE.Mesh(roofGeo, roofMaterial);
        roof.position.set(0, 8, 0);
        scene.add(roof);
        objects.push(roof);

        // Foxhole rifle pit 1
        var foxholeMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4E37 });
        var foxholeGeo = new THREE.BoxGeometry(4, 2, 4);

        var foxhole1 = new THREE.Mesh(foxholeGeo, foxholeMaterial);
        foxhole1.position.set(-25, 1, 5);
        scene.add(foxhole1);
        objects.push(foxhole1);

        // Foxhole rifle pit 2
        var foxhole2 = new THREE.Mesh(foxholeGeo, foxholeMaterial);
        foxhole2.position.set(25, 1, 5);
        scene.add(foxhole2);
        objects.push(foxhole2);

        // Foxhole rifle pit 3
        var foxhole3 = new THREE.Mesh(foxholeGeo, foxholeMaterial);
        foxhole3.position.set(-25, 1, -5);
        scene.add(foxhole3);
        objects.push(foxhole3);

        // Foxhole rifle pit 4
        var foxhole4 = new THREE.Mesh(foxholeGeo, foxholeMaterial);
        foxhole4.position.set(25, 1, -5);
        scene.add(foxhole4);
        objects.push(foxhole4);

        // Signals antenna tower base cylinder
        var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var antennaBaseGeo = new THREE.CylinderGeometry(1.5, 2, 10, 16);
        var antennaBase = new THREE.Mesh(antennaBaseGeo, antennaMaterial);
        antennaBase.position.set(-10, 5, 20);
        scene.add(antennaBase);
        objects.push(antennaBase);

        // Antenna mast
        var mastGeo = new THREE.CylinderGeometry(0.5, 0.5, 18, 12);
        var mast = new THREE.Mesh(mastGeo, antennaMaterial);
        mast.position.set(-10, 15, 20);
        scene.add(mast);
        objects.push(mast);

        // Antenna wire stays (LineSegments)
        var antennaPoints = [];
        antennaPoints.push(new THREE.Vector3(-10, 24, 20));
        antennaPoints.push(new THREE.Vector3(-16, 10, 20));
        antennaPoints.push(new THREE.Vector3(-10, 24, 20));
        antennaPoints.push(new THREE.Vector3(-4, 10, 20));
        antennaPoints.push(new THREE.Vector3(-10, 24, 20));
        antennaPoints.push(new THREE.Vector3(-10, 10, 14));
        antennaPoints.push(new THREE.Vector3(-10, 24, 20));
        antennaPoints.push(new THREE.Vector3(-10, 10, 26));

        var antennaGeo = new THREE.BufferGeometry().setFromPoints(antennaPoints);
        var antennaWires = new THREE.LineSegments(antennaGeo, new THREE.LineBasicMaterial({ color: 0xAAAAAA }));
        scene.add(antennaWires);
        objects.push(antennaWires);

        // Equipment parachute cache - sphere bundles
        var parachuteMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var parachuteGeo = new THREE.SphereGeometry(3, 16, 16);

        var chute1 = new THREE.Mesh(parachuteGeo, parachuteMaterial);
        chute1.position.set(10, 3, -25);
        scene.add(chute1);
        objects.push(chute1);

        var chute2 = new THREE.Mesh(parachuteGeo, parachuteMaterial);
        chute2.position.set(18, 3, -25);
        scene.add(chute2);
        objects.push(chute2);

        // Equipment containers
        var containerMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var containerGeo = new THREE.BoxGeometry(6, 4, 6);

        var container1 = new THREE.Mesh(containerGeo, containerMaterial);
        container1.position.set(10, 2, -20);
        scene.add(container1);
        objects.push(container1);

        var container2 = new THREE.Mesh(containerGeo, containerMaterial);
        container2.position.set(18, 2, -20);
        scene.add(container2);
        objects.push(container2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate antenna rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.CylinderGeometry) {
                if (objects[i].position.y > 14 && objects[i].position.y < 16) {
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
