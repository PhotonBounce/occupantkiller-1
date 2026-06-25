window.FlakTower = (function() {
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
        buildTower();
    }

    function buildTower() {
        // Main concrete tower core
        var coreGeom = new THREE.BoxGeometry(40, 60, 40);
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var coreMesh = new THREE.Mesh(coreGeom, concreteMat);
        coreMesh.position.set(0, 30, 0);
        coreMesh.castShadow = true;
        scene.add(coreMesh);
        objects.push(coreMesh);

        // Reinforced concrete corner pillars
        var pillarGeom = new THREE.BoxGeometry(8, 70, 8);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var pillar1 = new THREE.Mesh(pillarGeom, pillarMat);
        pillar1.position.set(-18, 35, -18);
        scene.add(pillar1);
        objects.push(pillar1);

        var pillar2 = new THREE.Mesh(pillarGeom, pillarMat);
        pillar2.position.set(18, 35, -18);
        scene.add(pillar2);
        objects.push(pillar2);

        var pillar3 = new THREE.Mesh(pillarGeom, pillarMat);
        pillar3.position.set(-18, 35, 18);
        scene.add(pillar3);
        objects.push(pillar3);

        var pillar4 = new THREE.Mesh(pillarGeom, pillarMat);
        pillar4.position.set(18, 35, 18);
        scene.add(pillar4);
        objects.push(pillar4);

        // Gun platform deck
        var deckGeom = new THREE.BoxGeometry(50, 4, 50);
        var deckMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var deckMesh = new THREE.Mesh(deckGeom, deckMat);
        deckMesh.position.set(0, 70, 0);
        scene.add(deckMesh);
        objects.push(deckMesh);

        // Gun turret bases on platform
        var turretGeom = new THREE.CylinderGeometry(6, 8, 5, 16);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var turret1 = new THREE.Mesh(turretGeom, turretMat);
        turret1.position.set(-15, 73, -15);
        scene.add(turret1);
        objects.push(turret1);

        var turret2 = new THREE.Mesh(turretGeom, turretMat);
        turret2.position.set(15, 73, -15);
        scene.add(turret2);
        objects.push(turret2);

        var turret3 = new THREE.Mesh(turretGeom, turretMat);
        turret3.position.set(-15, 73, 15);
        scene.add(turret3);
        objects.push(turret3);

        var turret4 = new THREE.Mesh(turretGeom, turretMat);
        turret4.position.set(15, 73, 15);
        scene.add(turret4);
        objects.push(turret4);

        // Searchlight tower 1
        var searchLightGeom = new THREE.CylinderGeometry(3, 4, 45, 12);
        var searchMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var search1 = new THREE.Mesh(searchLightGeom, searchMat);
        search1.position.set(-28, 22, -28);
        scene.add(search1);
        objects.push(search1);

        // Searchlight tower 2
        var search2 = new THREE.Mesh(searchLightGeom, searchMat);
        search2.position.set(28, 22, 28);
        scene.add(search2);
        objects.push(search2);

        // Ammunition bunker chamber 1
        var bunkerGeom = new THREE.BoxGeometry(18, 12, 18);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var bunker1 = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker1.position.set(-25, 6, 0);
        scene.add(bunker1);
        objects.push(bunker1);

        // Ammunition bunker chamber 2
        var bunker2 = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker2.position.set(25, 6, 0);
        scene.add(bunker2);
        objects.push(bunker2);

        // Bomb crater depression 1
        var craterGeom = new THREE.SphereGeometry(12, 8, 8);
        var craterMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var crater1 = new THREE.Mesh(craterGeom, craterMat);
        crater1.position.set(-30, 2, 25);
        crater1.scale.y = 0.4;
        scene.add(crater1);
        objects.push(crater1);

        // Bomb crater depression 2
        var crater2 = new THREE.Mesh(craterGeom, craterMat);
        crater2.position.set(30, 2, -25);
        crater2.scale.y = 0.4;
        scene.add(crater2);
        objects.push(crater2);

        // Anti-aircraft gun barrel on turret
        var barrelGeom = new THREE.CylinderGeometry(0.8, 1, 20, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var barrel1 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel1.position.set(-15, 82, -15);
        barrel1.rotation.z = Math.PI / 6;
        scene.add(barrel1);
        objects.push(barrel1);

        // Command observation cupola
        var cupolaGeom = new THREE.ConeGeometry(5, 8, 8);
        var cupolaMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var cupola = new THREE.Mesh(cupolaGeom, cupolaMat);
        cupola.position.set(0, 78, 0);
        scene.add(cupola);
        objects.push(cupola);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (searchlight simulation)
        var directionalLight = new THREE.DirectionalLight(0xeeeecc, 0.8);
        directionalLight.position.set(40, 80, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Rotate command cupola slowly
        if (objects.length > 15) {
            objects[15].rotation.y += delta * 0.3;
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
