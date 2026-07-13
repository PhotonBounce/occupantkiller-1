window.AshTower = (function() {
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
        var ashColor = 0x888888;
        var darkAshColor = 0x555555;
        var lightAshColor = 0xaaaaaa;
        var metalColor = 0x444444;

        // Main watchtower structure - central cylinder
        var towerGeom = new THREE.CylinderGeometry(8, 8.5, 35, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: ashColor });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(0, 17.5, 0);
        scene.add(tower);
        objects.push(tower);

        // Tower cap cone
        var capGeom = new THREE.ConeGeometry(8, 6, 16);
        var capMat = new THREE.MeshLambertMaterial({ color: darkAshColor });
        var cap = new THREE.Mesh(capGeom, capMat);
        cap.position.set(0, 38, 0);
        scene.add(cap);
        objects.push(cap);

        // Base cylinder for watchtower
        var baseGeom = new THREE.CylinderGeometry(12, 12, 4, 16);
        var baseMat = new THREE.MeshLambertMaterial({ color: lightAshColor });
        var base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(0, 2, 0);
        scene.add(base);
        objects.push(base);

        // Ventilation shaft 1 - left side
        var ventGeom1 = new THREE.CylinderGeometry(2.5, 2.5, 15, 8);
        var ventMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var vent1 = new THREE.Mesh(ventGeom1, ventMat);
        vent1.position.set(-15, 22, -8);
        scene.add(vent1);
        objects.push(vent1);

        // Ventilation shaft 2 - right side
        var ventGeom2 = new THREE.CylinderGeometry(2.5, 2.5, 15, 8);
        var vent2 = new THREE.Mesh(ventGeom2, ventMat);
        vent2.position.set(15, 22, 8);
        scene.add(vent2);
        objects.push(vent2);

        // Ash drift 1 - wedge shape using box
        var driftGeom1 = new THREE.BoxGeometry(8, 3, 12);
        var driftMat = new THREE.MeshLambertMaterial({ color: ashColor });
        var drift1 = new THREE.Mesh(driftGeom1, driftMat);
        drift1.position.set(-20, 1.5, 15);
        drift1.rotation.z = 0.3;
        scene.add(drift1);
        objects.push(drift1);

        // Ash drift 2 - wedge shape using box
        var driftGeom2 = new THREE.BoxGeometry(6, 2.5, 10);
        var drift2 = new THREE.Mesh(driftGeom2, driftMat);
        drift2.position.set(25, 1.25, -18);
        drift2.rotation.z = -0.25;
        scene.add(drift2);
        objects.push(drift2);

        // Buried vehicle outline 1 - elongated box
        var vehicleGeom1 = new THREE.BoxGeometry(4, 2, 10);
        var vehicleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var vehicle1 = new THREE.Mesh(vehicleGeom1, vehicleMat);
        vehicle1.position.set(-25, 1, -20);
        scene.add(vehicle1);
        objects.push(vehicle1);

        // Buried vehicle outline 2 - elongated box
        var vehicleGeom2 = new THREE.BoxGeometry(3.5, 1.8, 8);
        var vehicle2 = new THREE.Mesh(vehicleGeom2, vehicleMat);
        vehicle2.position.set(20, 0.9, 22);
        scene.add(vehicle2);
        objects.push(vehicle2);

        // Partially collapsed building 1 - tilted box
        var collapsedGeom1 = new THREE.BoxGeometry(10, 12, 8);
        var collapsedMat = new THREE.MeshLambertMaterial({ color: darkAshColor });
        var collapsed1 = new THREE.Mesh(collapsedGeom1, collapsedMat);
        collapsed1.position.set(-28, 6, 8);
        collapsed1.rotation.z = 0.4;
        scene.add(collapsed1);
        objects.push(collapsed1);

        // Partially collapsed building 2 - tilted box
        var collapsedGeom2 = new THREE.BoxGeometry(8, 10, 6);
        var collapsed2 = new THREE.Mesh(collapsedGeom2, collapsedMat);
        collapsed2.position.set(28, 5, -12);
        collapsed2.rotation.z = -0.35;
        scene.add(collapsed2);
        objects.push(collapsed2);

        // Ground ash layer - sphere slightly buried
        var groundGeom = new THREE.SphereGeometry(35, 32, 16);
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var ground = new THREE.Mesh(groundGeom, groundMat);
        ground.position.set(0, -30, 0);
        ground.scale.set(1, 0.15, 1);
        scene.add(ground);
        objects.push(ground);

        // Ash plume remnant - cone shape
        var plumeGeom = new THREE.ConeGeometry(5, 8, 8);
        var plumeMat = new THREE.MeshLambertMaterial({ color: lightAshColor });
        var plume = new THREE.Mesh(plumeGeom, plumeMat);
        plume.position.set(-18, 12, -25);
        scene.add(plume);
        objects.push(plume);

        // Small rubble pile 1 - box cluster effect
        var rubbleGeom1 = new THREE.BoxGeometry(5, 3, 5);
        var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var rubble1 = new THREE.Mesh(rubbleGeom1, rubbleMat);
        rubble1.position.set(8, 1.5, -28);
        scene.add(rubble1);
        objects.push(rubble1);

        // Small rubble pile 2 - box cluster effect
        var rubbleGeom2 = new THREE.BoxGeometry(4, 2.5, 4);
        var rubble2 = new THREE.Mesh(rubbleGeom2, rubbleMat);
        rubble2.position.set(-12, 1.25, 26);
        scene.add(rubble2);
        objects.push(rubble2);

        // Directional light - ashlight from above
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(40, 50, 40);
        dirLight.target.position.set(0, 10, 0);
        scene.add(dirLight);
        scene.add(dirLight.target);
        lights.push(dirLight);

        // Ambient light - ash atmosphere
        var ambLight = new THREE.AmbientLight(0xaaaaaa, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);
    }

    function update(delta) {
        // Gentle rotation of main tower and structures
        if (objects[0]) {
            objects[0].rotation.y += delta * 0.05;
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
