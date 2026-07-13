window.ValeCamp = (function() {
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
        // Valley terrain representation
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var groundGeo = new THREE.BoxGeometry(100, 2, 100);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.y = -1;
        scene.add(ground);
        objects.push(ground);

        // River crossing bridge - planks and pillars
        var plankMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });

        // Bridge planks (5 box planks)
        for (var i = 0; i < 5; i++) {
            var plankGeo = new THREE.BoxGeometry(8, 0.5, 2);
            var plank = new THREE.Mesh(plankGeo, plankMat);
            plank.position.set(-10 + i * 4, 1, 0);
            scene.add(plank);
            objects.push(plank);
        }

        // Bridge pillars (2 cylinder pillars)
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var pillarGeo = new THREE.CylinderGeometry(1, 1.2, 6, 8);
        var pillar1 = new THREE.Mesh(pillarGeo, pillarMat);
        pillar1.position.set(-12, -0.5, 2);
        scene.add(pillar1);
        objects.push(pillar1);

        var pillar2 = new THREE.Mesh(pillarGeo, pillarMat);
        pillar2.position.set(8, -0.5, 2);
        scene.add(pillar2);
        objects.push(pillar2);

        // Ammunition depot - nested box buildings
        var depot1Mat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var depot1Geo = new THREE.BoxGeometry(12, 6, 10);
        var depot1 = new THREE.Mesh(depot1Geo, depot1Mat);
        depot1.position.set(-25, 3, -15);
        scene.add(depot1);
        objects.push(depot1);

        var depot2Mat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var depot2Geo = new THREE.BoxGeometry(10, 5, 8);
        var depot2 = new THREE.Mesh(depot2Geo, depot2Mat);
        depot2.position.set(-25, 2.5, -28);
        scene.add(depot2);
        objects.push(depot2);

        var depot3Mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var depot3Geo = new THREE.BoxGeometry(8, 4, 6);
        var depot3 = new THREE.Mesh(depot3Geo, depot3Mat);
        depot3.position.set(-25, 2, -5);
        scene.add(depot3);
        objects.push(depot3);

        // Riverside fortifications - box walls
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var wallGeo = new THREE.BoxGeometry(30, 4, 1);
        var wall1 = new THREE.Mesh(wallGeo, wallMat);
        wall1.position.set(15, 2, -20);
        scene.add(wall1);
        objects.push(wall1);

        var wall2Geo = new THREE.BoxGeometry(1, 4, 25);
        var wall2 = new THREE.Mesh(wall2Geo, wallMat);
        wall2.position.set(30, 2, -10);
        scene.add(wall2);
        objects.push(wall2);

        // Mortar pits dug into hillside - cylinder holes
        var pitMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var pit1Geo = new THREE.CylinderGeometry(3, 3.5, 4, 16);
        var pit1 = new THREE.Mesh(pit1Geo, pit1Mat);
        pit1.position.set(-20, 0, 25);
        scene.add(pit1);
        objects.push(pit1);

        var pit2Geo = new THREE.CylinderGeometry(2.5, 3, 3.5, 16);
        var pit2 = new THREE.Mesh(pit2Geo, pit1Mat);
        pit2.position.set(-5, 0.5, 28);
        scene.add(pit2);
        objects.push(pit2);

        var pit3Geo = new THREE.CylinderGeometry(2, 2.8, 3, 16);
        var pit3 = new THREE.Mesh(pit3Geo, pit1Mat);
        pit3.position.set(10, 0.8, 26);
        scene.add(pit3);
        objects.push(pit3);

        // Signal fire beacons on ridgeline - cone beacon structures
        var beaconMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var beaconBaseMat = new THREE.MeshLambertMaterial({ color: 0xD2691E });

        // Beacon 1
        var beacon1BasGeo = new THREE.CylinderGeometry(2, 2.5, 3, 12);
        var beacon1Bas = new THREE.Mesh(beacon1BasGeo, beaconBaseMat);
        beacon1Bas.position.set(-30, 5, 30);
        scene.add(beacon1Bas);
        objects.push(beacon1Bas);

        var beacon1FlamGeo = new THREE.ConeGeometry(1.5, 4, 12);
        var beacon1Flam = new THREE.Mesh(beacon1FlamGeo, beaconMat);
        beacon1Flam.position.set(-30, 7.5, 30);
        scene.add(beacon1Flam);
        objects.push(beacon1Flam);

        // Beacon 2
        var beacon2BasGeo = new THREE.CylinderGeometry(2, 2.5, 3, 12);
        var beacon2Bas = new THREE.Mesh(beacon2BasGeo, beaconBaseMat);
        beacon2Bas.position.set(0, 6, 32);
        scene.add(beacon2Bas);
        objects.push(beacon2Bas);

        var beacon2FlamGeo = new THREE.ConeGeometry(1.5, 4, 12);
        var beacon2Flam = new THREE.Mesh(beacon2FlamGeo, beaconMat);
        beacon2Flam.position.set(0, 8.5, 32);
        scene.add(beacon2Flam);
        objects.push(beacon2Flam);

        // Beacon 3
        var beacon3BasGeo = new THREE.CylinderGeometry(1.8, 2.2, 2.5, 12);
        var beacon3Bas = new THREE.Mesh(beacon3BasGeo, beaconBaseMat);
        beacon3Bas.position.set(28, 5.5, 31);
        scene.add(beacon3Bas);
        objects.push(beacon3Bas);

        var beacon3FlamGeo = new THREE.ConeGeometry(1.2, 3.5, 12);
        var beacon3Flam = new THREE.Mesh(beacon3FlamGeo, beaconMat);
        beacon3Flam.position.set(28, 7.8, 31);
        scene.add(beacon3Flam);
        objects.push(beacon3Flam);

        // Spheres for ammunition storage
        var ammoBucketMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var ammoBucket1Geo = new THREE.SphereGeometry(1.5, 16, 16);
        var ammoBucket1 = new THREE.Mesh(ammoBucket1Geo, ammoBucketMat);
        ammoBucket1.position.set(-20, 7, -18);
        scene.add(ammoBucket1);
        objects.push(ammoBucket1);

        var ammoBucket2Geo = new THREE.SphereGeometry(1.2, 12, 12);
        var ammoBucket2 = new THREE.Mesh(ammoBucket2Geo, ammoBucketMat);
        ammoBucket2.position.set(-22, 8, -15);
        scene.add(ammoBucket2);
        objects.push(ammoBucket2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(40, 50, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry.type === 'ConeGeometry') {
                    objects[i].rotation.y += 0.01;
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

    return { init: init, update: update, reset: reset };
}());
