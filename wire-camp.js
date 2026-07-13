window.WireCamp = (function() {
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
        // Ground marker - dark green cylinder base
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var groundGeo = new THREE.CylinderGeometry(50, 50, 0.5, 32);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(0, -0.5, 0);
        ground.receiveShadow = true;
        scene.add(ground);
        objects.push(ground);

        // Command tent 1 - box frame at -20, 0, -20
        var tentMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var tentGeo = new THREE.BoxGeometry(12, 8, 10);
        var tent1 = new THREE.Mesh(tentGeo, tentMat);
        tent1.position.set(-20, 4, -20);
        scene.add(tent1);
        objects.push(tent1);

        // Command tent 2 - smaller tent at 15, 0, -25
        var tent2Geo = new THREE.BoxGeometry(10, 7, 8);
        var tent2 = new THREE.Mesh(tent2Geo, tentMat);
        tent2.position.set(15, 3.5, -25);
        scene.add(tent2);
        objects.push(tent2);

        // Radio antenna tower 1 - tall cylinder at -30, 0, 10
        var antennaMatBase = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var antennaBaseGeo = new THREE.CylinderGeometry(1.5, 2, 4, 16);
        var antennaBase1 = new THREE.Mesh(antennaBaseGeo, antennaMatBase);
        antennaBase1.position.set(-30, 2, 10);
        scene.add(antennaBase1);
        objects.push(antennaBase1);

        // Antenna tower pole
        var poleGeo = new THREE.CylinderGeometry(0.4, 0.4, 18, 8);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var pole1 = new THREE.Mesh(poleGeo, poleMat);
        pole1.position.set(-30, 11, 10);
        scene.add(pole1);
        objects.push(pole1);

        // Antenna top sphere
        var antennaSphereMat = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
        var antennaSphereGeo = new THREE.SphereGeometry(0.8, 16, 16);
        var antennaSphere1 = new THREE.Mesh(antennaSphereGeo, antennaSphereMat);
        antennaSphere1.position.set(-30, 20, 10);
        scene.add(antennaSphere1);
        objects.push(antennaSphere1);

        // Radio antenna tower 2 - at 25, 0, 5
        var antennaBase2 = new THREE.Mesh(antennaBaseGeo, antennaMatBase);
        antennaBase2.position.set(25, 2, 5);
        scene.add(antennaBase2);
        objects.push(antennaBase2);

        var pole2 = new THREE.Mesh(poleGeo, poleMat);
        pole2.position.set(25, 11, 5);
        scene.add(pole2);
        objects.push(pole2);

        var antennaSphere2 = new THREE.Mesh(antennaSphereGeo, antennaSphereMat);
        antennaSphere2.position.set(25, 20, 5);
        scene.add(antennaSphere2);
        objects.push(antennaSphere2);

        // Sandbag wall 1 - stacked boxes at -25, 0, 20
        var sandMat = new THREE.MeshLambertMaterial({ color: 0xc2b280 });
        var sandbagGeo = new THREE.BoxGeometry(3, 2, 3);
        var sandbag1 = new THREE.Mesh(sandbagGeo, sandMat);
        sandbag1.position.set(-25, 1, 20);
        scene.add(sandbag1);
        objects.push(sandbag1);

        var sandbag2 = new THREE.Mesh(sandbagGeo, sandMat);
        sandbag2.position.set(-25, 3, 20);
        scene.add(sandbag2);
        objects.push(sandbag2);

        var sandbag3 = new THREE.Mesh(sandbagGeo, sandMat);
        sandbag3.position.set(-22, 1, 20);
        scene.add(sandbag3);
        objects.push(sandbag3);

        // Sandbag wall 2 - at 20, 0, 25
        var sandbag4 = new THREE.Mesh(sandbagGeo, sandMat);
        sandbag4.position.set(20, 1, 25);
        scene.add(sandbag4);
        objects.push(sandbag4);

        var sandbag5 = new THREE.Mesh(sandbagGeo, sandMat);
        sandbag5.position.set(20, 3, 25);
        scene.add(sandbag5);
        objects.push(sandbag5);

        // Generator unit 1 - box at -10, 0, -10
        var genMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var genGeo = new THREE.BoxGeometry(6, 5, 5);
        var generator1 = new THREE.Mesh(genGeo, genMat);
        generator1.position.set(-10, 2.5, -10);
        scene.add(generator1);
        objects.push(generator1);

        // Generator exhaust pipe - cylinder on top
        var pipeGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
        var pipeMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var pipe1 = new THREE.Mesh(pipeGeo, pipeMat);
        pipe1.position.set(-10, 6.5, -10);
        scene.add(pipe1);
        objects.push(pipe1);

        // Generator unit 2 - at 8, 0, 15
        var generator2 = new THREE.Mesh(genGeo, genMat);
        generator2.position.set(8, 2.5, 15);
        scene.add(generator2);
        objects.push(generator2);

        var pipe2 = new THREE.Mesh(pipeGeo, pipeMat);
        pipe2.position.set(8, 6.5, 15);
        scene.add(pipe2);
        objects.push(pipe2);

        // Barbed wire perimeter - use LineSegments to represent wire fence
        var wireMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        var wireGeo = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            -45, 3, -45,
            45, 3, -45,
            45, 3, -45,
            45, 3, 45,
            45, 3, 45,
            -45, 3, 45,
            -45, 3, 45,
            -45, 3, -45
        ]);
        wireGeo.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wirePerimeter = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wirePerimeter);
        objects.push(wirePerimeter);

        // Additional barbed wire posts - cones along perimeter
        var wireMesh = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var postGeo = new THREE.ConeGeometry(0.3, 2, 8);

        var wirePost1 = new THREE.Mesh(postGeo, wireMesh);
        wirePost1.position.set(-45, 1, 0);
        scene.add(wirePost1);
        objects.push(wirePost1);

        var wirePost2 = new THREE.Mesh(postGeo, wireMesh);
        wirePost2.position.set(0, 1, -45);
        scene.add(wirePost2);
        objects.push(wirePost2);

        var wirePost3 = new THREE.Mesh(postGeo, wireMesh);
        wirePost3.position.set(45, 1, 0);
        scene.add(wirePost3);
        objects.push(wirePost3);

        var wirePost4 = new THREE.Mesh(postGeo, wireMesh);
        wirePost4.position.set(0, 1, 45);
        scene.add(wirePost4);
        objects.push(wirePost4);

        // Water tank - cylinder at 0, 0, -15
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
        var tankGeo = new THREE.CylinderGeometry(2, 2, 6, 16);
        var waterTank = new THREE.Mesh(tankGeo, tankMat);
        waterTank.position.set(0, 3, -15);
        scene.add(waterTank);
        objects.push(waterTank);

        // Fuel drums - stacked cylinders at 10, 0, -5
        var drumMat = new THREE.MeshLambertMaterial({ color: 0xcc6600 });
        var drumGeo = new THREE.CylinderGeometry(1, 1, 2, 8);
        var drum1 = new THREE.Mesh(drumGeo, drumMat);
        drum1.position.set(10, 1, -5);
        scene.add(drum1);
        objects.push(drum1);

        var drum2 = new THREE.Mesh(drumGeo, drumMat);
        drum2.position.set(10, 3, -5);
        scene.add(drum2);
        objects.push(drum2);

        // Supply crate - box at -5, 0, 10
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var crateGeo = new THREE.BoxGeometry(4, 4, 4);
        var crate = new THREE.Mesh(crateGeo, crateMat);
        crate.position.set(-5, 2, 10);
        scene.add(crate);
        objects.push(crate);

        // Lighting
        var lightColor1 = 0xffffff;
        var light1 = new THREE.PointLight(lightColor1, 1, 100);
        light1.position.set(-30, 15, 10);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.PointLight(lightColor1, 1, 100);
        light2.position.set(25, 15, 5);
        scene.add(light2);
        lights.push(light2);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        // Animate antenna spheres with slow rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry.type === 'SphereGeometry') {
                objects[i].rotation.y += 0.5 * delta;
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
