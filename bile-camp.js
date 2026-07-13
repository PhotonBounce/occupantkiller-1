window.BileCamp = (function() {
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
        // Toxic barrel stacks - yellow-green cylinders
        var barrelMat1 = new THREE.MeshLambertMaterial({ color: 0xaaff00 });
        var barrelMat2 = new THREE.MeshLambertMaterial({ color: 0xccff00 });
        var barrelMat3 = new THREE.MeshLambertMaterial({ color: 0x99ee00 });

        // Stack 1: Three barrels at (-25, 0, -20)
        var barrelGeo = new THREE.CylinderGeometry(2, 2, 4, 16);
        var barrel1 = new THREE.Mesh(barrelGeo, barrelMat1);
        barrel1.position.set(-25, 2, -20);
        scene.add(barrel1);
        objects.push(barrel1);

        var barrel2 = new THREE.Mesh(barrelGeo, barrelMat2);
        barrel2.position.set(-25, 6, -20);
        scene.add(barrel2);
        objects.push(barrel2);

        var barrel3 = new THREE.Mesh(barrelGeo, barrelMat3);
        barrel3.position.set(-25, 10, -20);
        scene.add(barrel3);
        objects.push(barrel3);

        // Stack 2: Three barrels at (15, 0, 10)
        var barrel4 = new THREE.Mesh(barrelGeo, barrelMat2);
        barrel4.position.set(15, 2, 10);
        scene.add(barrel4);
        objects.push(barrel4);

        var barrel5 = new THREE.Mesh(barrelGeo, barrelMat1);
        barrel5.position.set(15, 6, 10);
        scene.add(barrel5);
        objects.push(barrel5);

        var barrel6 = new THREE.Mesh(barrelGeo, barrelMat3);
        barrel6.position.set(15, 10, 10);
        scene.add(barrel6);
        objects.push(barrel6);

        // Waste containment pool 1 - dark green box at (-10, 0.5, 5)
        var poolMat = new THREE.MeshLambertMaterial({ color: 0x1a4d1a });
        var poolGeo1 = new THREE.BoxGeometry(12, 1, 10);
        var pool1 = new THREE.Mesh(poolGeo1, poolMat);
        pool1.position.set(-10, 0.5, 5);
        scene.add(pool1);
        objects.push(pool1);

        // Waste containment pool 2 - dark green box at (20, 0.5, -15)
        var poolGeo2 = new THREE.BoxGeometry(14, 1, 8);
        var pool2 = new THREE.Mesh(poolGeo2, poolMat);
        pool2.position.set(20, 0.5, -15);
        scene.add(pool2);
        objects.push(pool2);

        // Contamination warning tower 1 - cone at (-30, 0, 25)
        var warnMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var towerGeo = new THREE.ConeGeometry(1.5, 8, 8);
        var tower1 = new THREE.Mesh(towerGeo, warnMat);
        tower1.position.set(-30, 4, 25);
        scene.add(tower1);
        objects.push(tower1);

        // Contamination warning tower 2 - cone at (28, 0, -25)
        var tower2 = new THREE.Mesh(towerGeo, warnMat);
        tower2.position.set(28, 4, -25);
        scene.add(tower2);
        objects.push(tower2);

        // Hazmat response vehicle 1 - box vehicle at (-8, 1.5, -8)
        var vehicleMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var vehicleBodyGeo = new THREE.BoxGeometry(4, 2, 6);
        var vehicle1 = new THREE.Mesh(vehicleBodyGeo, vehicleMat);
        vehicle1.position.set(-8, 1.5, -8);
        scene.add(vehicle1);
        objects.push(vehicle1);

        // Decontamination shower station 1 - sphere + cylinder at (5, 2, 15)
        var showerMat = new THREE.MeshLambertMaterial({ color: 0x0066ff });
        var showerHeadGeo = new THREE.SphereGeometry(0.8, 16, 16);
        var showerHead1 = new THREE.Mesh(showerHeadGeo, showerMat);
        showerHead1.position.set(5, 4, 15);
        scene.add(showerHead1);
        objects.push(showerHead1);

        var showerPipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        var showerPipe1 = new THREE.Mesh(showerPipeGeo, new THREE.MeshLambertMaterial({ color: 0x444444 }));
        showerPipe1.position.set(5, 2, 15);
        scene.add(showerPipe1);
        objects.push(showerPipe1);

        // Decontamination shower station 2 - sphere + cylinder at (-15, 2, 20)
        var showerHead2 = new THREE.Mesh(showerHeadGeo, showerMat);
        showerHead2.position.set(-15, 4, 20);
        scene.add(showerHead2);
        objects.push(showerHead2);

        var showerPipe2 = new THREE.Mesh(showerPipeGeo, new THREE.MeshLambertMaterial({ color: 0x444444 }));
        showerPipe2.position.set(-15, 2, 20);
        scene.add(showerPipe2);
        objects.push(showerPipe2);

        // Hazmat response vehicle 2 - box vehicle at (12, 1.5, 22)
        var vehicle2 = new THREE.Mesh(vehicleBodyGeo, vehicleMat);
        vehicle2.position.set(12, 1.5, 22);
        scene.add(vehicle2);
        objects.push(vehicle2);

        // Radiation warning sphere at (0, 3, 0)
        var radMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var radGeo = new THREE.SphereGeometry(1.2, 16, 16);
        var radMarker = new THREE.Mesh(radGeo, radMat);
        radMarker.position.set(0, 3, 0);
        scene.add(radMarker);
        objects.push(radMarker);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 25, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Rotate barrels and warning towers
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry.type === 'CylinderGeometry' || objects[i].geometry.type === 'ConeGeometry') {
                objects[i].rotation.y += 0.015;
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
