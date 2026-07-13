window.ReelDock = (function() {
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
        var i;

        // Large cable reel drums (cylinders) - the main dockyard features
        var reelMaterial1 = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var reelGeom1 = new THREE.CylinderGeometry(8, 8, 4, 32);
        var reel1 = new THREE.Mesh(reelGeom1, reelMaterial1);
        reel1.position.set(-25, 4, -20);
        reel1.rotation.z = Math.PI / 6;
        scene.add(reel1);
        objects.push(reel1);

        var reelMaterial2 = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var reelGeom2 = new THREE.CylinderGeometry(7, 7, 3.5, 32);
        var reel2 = new THREE.Mesh(reelGeom2, reelMaterial2);
        reel2.position.set(20, 3.5, -15);
        reel2.rotation.z = Math.PI / 4;
        scene.add(reel2);
        objects.push(reel2);

        var reelMaterial3 = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var reelGeom3 = new THREE.CylinderGeometry(6, 6, 3, 32);
        var reel3 = new THREE.Mesh(reelGeom3, reelMaterial3);
        reel3.position.set(-10, 3, 15);
        reel3.rotation.z = -Math.PI / 5;
        scene.add(reel3);
        objects.push(reel3);

        // Winch tower structures (stacked cylinders and boxes)
        var towerBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var towerBaseGeom = new THREE.CylinderGeometry(2, 3, 1, 16);
        var towerBase1 = new THREE.Mesh(towerBaseGeom, towerBaseMaterial);
        towerBase1.position.set(15, 0.5, 5);
        scene.add(towerBase1);
        objects.push(towerBase1);

        var towerColMaterial = new THREE.MeshLambertMaterial({ color: 0x778899 });
        var towerColGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        var towerCol1 = new THREE.Mesh(towerColGeom, towerColMaterial);
        towerCol1.position.set(15, 7, 5);
        scene.add(towerCol1);
        objects.push(towerCol1);

        var towerTopMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var towerTopGeom = new THREE.BoxGeometry(3, 1, 3);
        var towerTop1 = new THREE.Mesh(towerTopGeom, towerTopMaterial);
        towerTop1.position.set(15, 13.5, 5);
        scene.add(towerTop1);
        objects.push(towerTop1);

        // Spool warehouse boxes
        var warehouseMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var warehouseGeom = new THREE.BoxGeometry(6, 4, 5);
        var warehouse1 = new THREE.Mesh(warehouseGeom, warehouseMaterial);
        warehouse1.position.set(-20, 2, 5);
        scene.add(warehouse1);
        objects.push(warehouse1);

        var warehouse2 = new THREE.Mesh(warehouseGeom, warehouseMaterial);
        warehouse2.position.set(10, 2, -25);
        scene.add(warehouse2);
        objects.push(warehouse2);

        // Underwater cable deployment equipment (cones and spheres)
        var deployMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var deployGeom = new THREE.ConeGeometry(2, 5, 16);
        var deploy1 = new THREE.Mesh(deployGeom, deployMaterial);
        deploy1.position.set(-15, 3, -8);
        scene.add(deploy1);
        objects.push(deploy1);

        var deployGeom2 = new THREE.ConeGeometry(1.5, 4, 12);
        var deploy2 = new THREE.Mesh(deployGeom2, deployMaterial);
        deploy2.position.set(5, 2.5, 20);
        scene.add(deploy2);
        objects.push(deploy2);

        // Cable laying ship structures (boxes and cylinders)
        var shipMaterial = new THREE.MeshLambertMaterial({ color: 0xDC143C });
        var shipHullGeom = new THREE.BoxGeometry(8, 3, 3);
        var shipHull1 = new THREE.Mesh(shipHullGeom, shipMaterial);
        shipHull1.position.set(25, 2, 10);
        scene.add(shipHull1);
        objects.push(shipHull1);

        var shipCabinGeom = new THREE.BoxGeometry(4, 3, 3);
        var shipCabin1 = new THREE.Mesh(shipCabinGeom, shipMaterial);
        shipCabin1.position.set(28, 5, 10);
        scene.add(shipCabin1);
        objects.push(shipCabin1);

        // Spherical buoys and floats
        var buoyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var buoyGeom = new THREE.SphereGeometry(1.5, 16, 16);
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy1.position.set(-5, 1.5, -10);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy2.position.set(8, 1.5, 8);
        scene.add(buoy2);
        objects.push(buoy2);

        // Steel framework structures
        var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var frameGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 6);
        var frame1 = new THREE.Mesh(frameGeom, frameMaterial);
        frame1.position.set(-30, 5, 0);
        scene.add(frame1);
        objects.push(frame1);

        var frame2 = new THREE.Mesh(frameGeom, frameMaterial);
        frame2.position.set(30, 5, -5);
        scene.add(frame2);
        objects.push(frame2);

        // Storage containers (boxes)
        var containerMaterial = new THREE.MeshLambertMaterial({ color: 0x191970 });
        var containerGeom = new THREE.BoxGeometry(3, 3, 3);
        var container1 = new THREE.Mesh(containerGeom, containerMaterial);
        container1.position.set(0, 1.5, -20);
        scene.add(container1);
        objects.push(container1);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                if (i % 3 === 0) {
                    objects[i].rotation.y += delta * 0.1;
                }
                if (i % 5 === 0) {
                    objects[i].position.y += Math.sin(Date.now() * 0.001 + i) * delta * 0.05;
                }
            }
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
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
