window.EtiveDock = (function() {
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
        // Bonawe Iron Furnace - Box furnace building
        var furnaceGeo = new THREE.BoxGeometry(8, 6, 5);
        var furnaceMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var furnace = new THREE.Mesh(furnaceGeo, furnaceMat);
        furnace.position.set(-25, 3, -20);
        scene.add(furnace);
        objects.push(furnace);

        // Blast furnace tower - Cylinder
        var blastGeo = new THREE.CylinderGeometry(2, 2.5, 12, 8);
        var blastMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var blast = new THREE.Mesh(blastGeo, blastMat);
        blast.position.set(-20, 6, -18);
        scene.add(blast);
        objects.push(blast);

        // Granite quarry extraction platform - Box quarry face
        var quarryFaceGeo = new THREE.BoxGeometry(15, 10, 3);
        var quarryFaceMat = new THREE.MeshLambertMaterial({ color: 0x8b7765 });
        var quarryFace = new THREE.Mesh(quarryFaceGeo, quarryFaceMat);
        quarryFace.position.set(15, 5, -25);
        scene.add(quarryFace);
        objects.push(quarryFace);

        // Quarry crane jib - Cylinder
        var craneGeo = new THREE.CylinderGeometry(0.8, 0.8, 18, 6);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var crane = new THREE.Mesh(craneGeo, craneMat);
        crane.position.set(18, 10, -22);
        crane.rotation.z = Math.PI / 4;
        scene.add(crane);
        objects.push(crane);

        // Granite block barricade - Box massive stone block 1
        var blockGeo = new THREE.BoxGeometry(4, 3, 4);
        var blockMat = new THREE.MeshLambertMaterial({ color: 0x9d8b7e });
        var block1 = new THREE.Mesh(blockGeo, blockMat);
        block1.position.set(-10, 1.5, 5);
        scene.add(block1);
        objects.push(block1);

        // Granite block barricade block 2
        var block2 = new THREE.Mesh(blockGeo, blockMat);
        block2.position.set(-5, 1.5, 6);
        scene.add(block2);
        objects.push(block2);

        // Granite block barricade block 3
        var block3 = new THREE.Mesh(blockGeo, blockMat);
        block3.position.set(0, 1.5, 5);
        scene.add(block3);
        objects.push(block3);

        // Underwater rock blast sabotage charge - Sphere shaped charge
        var chargeGeo = new THREE.SphereGeometry(1.2, 6, 6);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        var charge = new THREE.Mesh(chargeGeo, chargeMat);
        charge.position.set(8, -2, -10);
        scene.add(charge);
        objects.push(charge);

        // Detonation cord - LineSegments
        var cordGeo = new THREE.BufferGeometry();
        var cordPositions = new Float32Array([
            8, -2, -10,
            8, 1, -10,
            8, 1, -8,
            10, 1, -8
        ]);
        cordGeo.setAttribute('position', new THREE.BufferAttribute(cordPositions, 3));
        var cordMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        var cord = new THREE.LineSegments(cordGeo, cordMat);
        scene.add(cord);
        objects.push(cord);

        // Hydroelectric cofferdam - Box cofferdam
        var cofferdamGeo = new THREE.BoxGeometry(12, 4, 8);
        var cofferdamMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var cofferdam = new THREE.Mesh(cofferdamGeo, cofferdamMat);
        cofferdam.position.set(-5, 2, 15);
        scene.add(cofferdam);
        objects.push(cofferdam);

        // Penstock cylinder
        var penstockGeo = new THREE.CylinderGeometry(1.5, 1.5, 16, 8);
        var penstockMat = new THREE.MeshLambertMaterial({ color: 0x4a5568 });
        var penstock = new THREE.Mesh(penstockGeo, penstockMat);
        penstock.position.set(-3, 8, 18);
        penstock.rotation.z = Math.PI / 3;
        scene.add(penstock);
        objects.push(penstock);

        // Mountain goat path stepping stone 1
        var stonGeo = new THREE.BoxGeometry(2, 0.5, 2);
        var stonMat = new THREE.MeshLambertMaterial({ color: 0xa9a9a9 });
        var stone1 = new THREE.Mesh(stonGeo, stonMat);
        stone1.position.set(25, 2, -15);
        scene.add(stone1);
        objects.push(stone1);

        // Mountain goat path stepping stone 2
        var stone2 = new THREE.Mesh(stonGeo, stonMat);
        stone2.position.set(28, 4, -12);
        scene.add(stone2);
        objects.push(stone2);

        // Mountain goat path stepping stone 3
        var stone3 = new THREE.Mesh(stonGeo, stonMat);
        stone3.position.set(30, 6, -8);
        scene.add(stone3);
        objects.push(stone3);

        // Falls of Lora observation platform - Box platform
        var platformGeo = new THREE.BoxGeometry(6, 1, 8);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x704214 });
        var platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(20, 3, 22);
        scene.add(platform);
        objects.push(platform);

        // Tidal race marker buoy - Sphere
        var buoyGeo = new THREE.SphereGeometry(0.8, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        var buoy = new THREE.Mesh(buoyGeo, buoyMat);
        buoy.position.set(22, 1, 28);
        scene.add(buoy);
        objects.push(buoy);

        // Additional context element - Loch rock outcrop
        var rockGeo = new THREE.ConeGeometry(3, 5, 6);
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x6b5d4f });
        var rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(-30, 2.5, 10);
        scene.add(rock);
        objects.push(rock);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for landscape
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 20, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Gentle animation of buoy
        if (objects.length > 0) {
            var lastObj = objects[objects.length - 1];
            if (lastObj.geometry.type === 'SphereGeometry') {
                lastObj.position.y = 1 + Math.sin(Date.now() * 0.003) * 0.3;
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
