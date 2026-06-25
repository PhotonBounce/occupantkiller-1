window.ArrocharBase = (function() {
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
        // Loch Long submarine anchorage
        var concretePierGeo = new THREE.BoxGeometry(8, 1, 20);
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var concretePier = new THREE.Mesh(concretePierGeo, concreteMat);
        concretePier.position.set(-25, 0, 0);
        scene.add(concretePier);
        objects.push(concretePier);

        var submarineGeo = new THREE.CylinderGeometry(2, 2, 15, 8);
        var blackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var submarine = new THREE.Mesh(submarineGeo, blackMat);
        submarine.position.set(-25, 2, 0);
        submarine.rotation.z = Math.PI / 2;
        scene.add(submarine);
        objects.push(submarine);

        var torpedoGeo = new THREE.BoxGeometry(6, 4, 10);
        var darkGrayMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var torpedo = new THREE.Mesh(torpedoGeo, darkGrayMat);
        torpedo.position.set(-25, 2, 15);
        scene.add(torpedo);
        objects.push(torpedo);

        // Mooring cables
        var cablePoints = [new THREE.Vector3(-25, 3, 0), new THREE.Vector3(-20, 0, 5)];
        var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var lineMat = new THREE.LineBasicMaterial({ color: 0x444444 });
        var cable = new THREE.LineSegments(cableGeo, lineMat);
        scene.add(cable);
        objects.push(cable);

        // The Cobbler mountain artillery position
        var emplacementGeo = new THREE.BoxGeometry(7, 2, 7);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var emplacement = new THREE.Mesh(emplacementGeo, stoneMat);
        emplacement.position.set(20, 1, -20);
        scene.add(emplacement);
        objects.push(emplacement);

        var gunBarrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var gunBarrel = new THREE.Mesh(gunBarrelGeo, gunMat);
        gunBarrel.position.set(20, 3, -20);
        gunBarrel.rotation.z = Math.PI / 3;
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        var shellBunkerGeo = new THREE.BoxGeometry(5, 3, 8);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var shellBunker = new THREE.Mesh(shellBunkerGeo, bunkerMat);
        shellBunker.position.set(20, 1.5, -30);
        scene.add(shellBunker);
        objects.push(shellBunker);

        // Arrochar village fortified line
        var barrierGeo = new THREE.BoxGeometry(2, 1.5, 12);
        var concreteLightMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var barrier = new THREE.Mesh(barrierGeo, concreteLightMat);
        barrier.position.set(0, 0.75, 20);
        scene.add(barrier);
        objects.push(barrier);

        var guardTowerGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 6);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var guardTower = new THREE.Mesh(guardTowerGeo, towerMat);
        guardTower.position.set(10, 4, 25);
        scene.add(guardTower);
        objects.push(guardTower);

        var sandbagGeo = new THREE.BoxGeometry(3, 1, 4);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var sandbag = new THREE.Mesh(sandbagGeo, sandbagMat);
        sandbag.position.set(-10, 0.5, 20);
        scene.add(sandbag);
        objects.push(sandbag);

        // Glen Croe pass control point
        var stoneCuttingGeo = new THREE.BoxGeometry(15, 3, 4);
        var grayMat = new THREE.MeshLambertMaterial({ color: 0x757575 });
        var stoneCutting = new THREE.Mesh(stoneCuttingGeo, grayMat);
        stoneCutting.position.set(5, 1.5, -15);
        scene.add(stoneCutting);
        objects.push(stoneCutting);

        var checkpointGeo = new THREE.BoxGeometry(4, 2, 6);
        var checkpointMat = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
        var checkpoint = new THREE.Mesh(checkpointGeo, checkpointMat);
        checkpoint.position.set(-5, 1, -15);
        scene.add(checkpoint);
        objects.push(checkpoint);

        var iedGeo = new THREE.SphereGeometry(0.8, 4, 4);
        var redMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        var ied = new THREE.Mesh(iedGeo, redMat);
        ied.position.set(0, 0.8, -20);
        scene.add(ied);
        objects.push(ied);

        // Succoth Lodge command center
        var houseGeo = new THREE.BoxGeometry(6, 5, 8);
        var houseMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var house = new THREE.Mesh(houseGeo, houseMat);
        house.position.set(-30, 2.5, 10);
        scene.add(house);
        objects.push(house);

        var generatorGeo = new THREE.BoxGeometry(3, 2, 4);
        var genMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var generator = new THREE.Mesh(generatorGeo, genMat);
        generator.position.set(-30, 1, 18);
        scene.add(generator);
        objects.push(generator);

        var mastGeo = new THREE.CylinderGeometry(0.3, 0.3, 14, 4);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(-30, 7, 10);
        scene.add(mast);
        objects.push(mast);

        // Loch Goil approach sensors
        var sonarGeo = new THREE.SphereGeometry(0.6, 4, 4);
        var yellowMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var sonar1 = new THREE.Mesh(sonarGeo, yellowMat);
        sonar1.position.set(30, 1, -10);
        scene.add(sonar1);
        objects.push(sonar1);

        var sonar2 = new THREE.Mesh(sonarGeo, yellowMat);
        sonar2.position.set(30, 1, 0);
        scene.add(sonar2);
        objects.push(sonar2);

        // Cable grid
        var gridPoints = [new THREE.Vector3(30, 0.5, -10), new THREE.Vector3(25, 0.5, -5)];
        var gridGeo = new THREE.BufferGeometry().setFromPoints(gridPoints);
        var gridLine = new THREE.LineSegments(gridGeo, lineMat);
        scene.add(gridLine);
        objects.push(gridLine);

        var hutGeo = new THREE.BoxGeometry(4, 2, 5);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var hut = new THREE.Mesh(hutGeo, hutMat);
        hut.position.set(30, 1, 10);
        scene.add(hut);
        objects.push(hut);

        // Rest and Be Thankful pass OP
        var opGeo = new THREE.BoxGeometry(5, 2, 5);
        var opMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var op = new THREE.Mesh(opGeo, opMat);
        op.position.set(-15, 1, -25);
        scene.add(op);
        objects.push(op);

        var signalMastGeo = new THREE.CylinderGeometry(0.25, 0.25, 10, 4);
        var signalMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var signalMast = new THREE.Mesh(signalMastGeo, signalMat);
        signalMast.position.set(-15, 5, -25);
        scene.add(signalMast);
        objects.push(signalMast);

        var weatherGeo = new THREE.SphereGeometry(0.9, 5, 5);
        var weatherMat = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
        var weatherDome = new THREE.Mesh(weatherGeo, weatherMat);
        weatherDome.position.set(-15, 6.5, -25);
        scene.add(weatherDome);
        objects.push(weatherDome);

        // Butterbridge glen cache
        var shielingGeo = new THREE.BoxGeometry(4, 2, 5);
        var ruinMat = new THREE.MeshLambertMaterial({ color: 0x8b7765 });
        var shielings = new THREE.Mesh(shielingGeo, ruinMat);
        shielings.position.set(15, 1, 30);
        scene.add(shielings);
        objects.push(shielings);

        var cratesGeo = new THREE.BoxGeometry(3, 2, 3);
        var cratesMat = new THREE.MeshLambertMaterial({ color: 0xa4734b });
        var crates = new THREE.Mesh(cratesGeo, cratesMat);
        crates.position.set(15, 1, 25);
        scene.add(crates);
        objects.push(crates);

        var markerGeo = new THREE.ConeGeometry(0.6, 3, 4);
        var markerMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(15, 1.5, 35);
        scene.add(marker);
        objects.push(marker);

        // Lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 40, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    objects[i].rotation.y += 0.0001;
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
