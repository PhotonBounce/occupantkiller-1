window.ScudPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        var i;

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 60, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);

        // 1. Concrete blast deflector walls - vertical boxes
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var wallGeom1 = new THREE.BoxGeometry(60, 12, 3);
        var wall1 = new THREE.Mesh(wallGeom1, wallMaterial);
        wall1.position.set(-15, 6, -35);
        scene.add(wall1);
        objects.push(wall1);

        var wallGeom2 = new THREE.BoxGeometry(60, 12, 3);
        var wall2 = new THREE.Mesh(wallGeom2, wallMaterial);
        wall2.position.set(15, 6, 35);
        scene.add(wall2);
        objects.push(wall2);

        var wallGeom3 = new THREE.BoxGeometry(3, 12, 70);
        var wall3 = new THREE.Mesh(wallGeom3, wallMaterial);
        wall3.position.set(-30, 6, 0);
        scene.add(wall3);
        objects.push(wall3);

        // 2. SCUD missile transporter-erector-launcher - main box chassis
        var chassisMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var chassisGeom = new THREE.BoxGeometry(8, 4, 25);
        var chassis = new THREE.Mesh(chassisGeom, chassisMaterial);
        chassis.position.set(-10, 2, 8);
        scene.add(chassis);
        objects.push(chassis);

        // 3. SCUD missile - long angled cylinder on erector
        var missileGeom = new THREE.CylinderGeometry(0.8, 0.8, 18, 16);
        var missileMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var missile = new THREE.Mesh(missileGeom, missileMaterial);
        missile.position.set(-10, 12, 8);
        missile.rotation.z = 0.5;
        scene.add(missile);
        objects.push(missile);

        // 4. Missile nose cone - small sphere
        var noseGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var noseMaterial = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        var nose = new THREE.Mesh(noseGeom, noseMaterial);
        nose.position.set(0, 20, 15);
        scene.add(nose);
        objects.push(nose);

        // 5. Fuel tanker truck 1 - chassis
        var tankerChassis1Geom = new THREE.BoxGeometry(6, 3, 20);
        var tankerMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var tankerChassis1 = new THREE.Mesh(tankerChassis1Geom, tankerMaterial);
        tankerChassis1.position.set(20, 1.5, -15);
        scene.add(tankerChassis1);
        objects.push(tankerChassis1);

        // 6. Fuel tanker truck 1 - cylinder tank
        var tankGeom1 = new THREE.CylinderGeometry(3, 3, 16, 16);
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        var tank1 = new THREE.Mesh(tankGeom1, tankMaterial);
        tank1.position.set(20, 5, -15);
        tank1.rotation.z = 1.57;
        scene.add(tank1);
        objects.push(tank1);

        // 7. Fuel tanker truck 2 - chassis
        var tankerChassis2Geom = new THREE.BoxGeometry(6, 3, 20);
        var tankerChassis2 = new THREE.Mesh(tankerChassis2Geom, tankerMaterial);
        tankerChassis2.position.set(20, 1.5, 10);
        scene.add(tankerChassis2);
        objects.push(tankerChassis2);

        // 8. Fuel tanker truck 2 - cylinder tank
        var tankGeom2 = new THREE.CylinderGeometry(3, 3, 16, 16);
        var tank2 = new THREE.Mesh(tankGeom2, tankMaterial);
        tank2.position.set(20, 5, 10);
        tank2.rotation.z = 1.57;
        scene.add(tank2);
        objects.push(tank2);

        // 9. Launch control bunker - fortified box
        var bunkerGeom = new THREE.BoxGeometry(12, 6, 10);
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMaterial);
        bunker.position.set(-25, 3, 20);
        scene.add(bunker);
        objects.push(bunker);

        // 10. Bunker roof reinforcement - box
        var roofGeom = new THREE.BoxGeometry(14, 2, 12);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var roof = new THREE.Mesh(roofGeom, roofMaterial);
        roof.position.set(-25, 8, 20);
        scene.add(roof);
        objects.push(roof);

        // 11. Radar tracking dish - cylindrical pole 1
        var radarPole1Geom = new THREE.CylinderGeometry(1.5, 1.5, 20, 12);
        var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var radarPole1 = new THREE.Mesh(radarPole1Geom, poleMaterial);
        radarPole1.position.set(-20, 10, -25);
        scene.add(radarPole1);
        objects.push(radarPole1);

        // 12. Radar tracking dish - cylindrical pole 2
        var radarPole2Geom = new THREE.CylinderGeometry(1.5, 1.5, 20, 12);
        var radarPole2 = new THREE.Mesh(radarPole2Geom, poleMaterial);
        radarPole2.position.set(10, 10, -25);
        scene.add(radarPole2);
        objects.push(radarPole2);

        // 13. Radar dish frame - box structure
        var dishFrameGeom = new THREE.BoxGeometry(25, 15, 2);
        var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xffa500 });
        var dishFrame = new THREE.Mesh(dishFrameGeom, dishMaterial);
        dishFrame.position.set(-5, 22, -25);
        scene.add(dishFrame);
        objects.push(dishFrame);

        // 14. Ground base platform - large box
        var groundGeom = new THREE.BoxGeometry(100, 1, 100);
        var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x6b7c59 });
        var ground = new THREE.Mesh(groundGeom, groundMaterial);
        ground.position.set(0, 0, 0);
        scene.add(ground);
        objects.push(ground);

        // 15. Supply shelter - cone roof structure
        var shelterGeom = new THREE.ConeGeometry(5, 8, 8);
        var shelterMaterial = new THREE.MeshLambertMaterial({ color: 0xcd853f });
        var shelter = new THREE.Mesh(shelterGeom, shelterMaterial);
        shelter.position.set(30, 4, 25);
        scene.add(shelter);
        objects.push(shelter);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].userData && objects[i].userData.rotating) {
                objects[i].rotation.y += delta * 0.5;
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
