window.CarradaleBase = (function() {
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
        // Carradale House converted command HQ (box country house)
        var houseGeom = new THREE.BoxGeometry(8, 6, 10);
        var houseMat = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        var house = new THREE.Mesh(houseGeom, houseMat);
        house.position.set(-20, 3, -15);
        scene.add(house);
        objects.push(house);

        // Carradale House stables (box)
        var stablesGeom = new THREE.BoxGeometry(6, 4, 8);
        var stablesMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var stables = new THREE.Mesh(stablesGeom, stablesMat);
        stables.position.set(-14, 2, -25);
        scene.add(stables);
        objects.push(stables);

        // Water tower (cylinder)
        var towerGeom = new THREE.CylinderGeometry(2, 2.5, 12, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-25, 6, -5);
        scene.add(tower);
        objects.push(tower);

        // Fishing harbor pier (box)
        var pierGeom = new THREE.BoxGeometry(20, 2, 4);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var pier = new THREE.Mesh(pierGeom, pierMat);
        pier.position.set(15, 1, 10);
        scene.add(pier);
        objects.push(pier);

        // Fishing boat hull 1 (box)
        var boatGeom1 = new THREE.BoxGeometry(6, 3, 12);
        var boatMat1 = new THREE.MeshLambertMaterial({ color: 0x000080 });
        var boat1 = new THREE.Mesh(boatGeom1, boatMat1);
        boat1.position.set(8, 1.5, 22);
        scene.add(boat1);
        objects.push(boat1);

        // Fishing boat hull 2 (box)
        var boatGeom2 = new THREE.BoxGeometry(5, 2.5, 10);
        var boatMat2 = new THREE.MeshLambertMaterial({ color: 0x1C1C3C });
        var boat2 = new THREE.Mesh(boatGeom2, boatMat2);
        boat2.position.set(18, 1.2, 18);
        scene.add(boat2);
        objects.push(boat2);

        // Boat mast 1 (cylinder)
        var mast1Geom = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var mast1 = new THREE.Mesh(mast1Geom, mastMat);
        mast1.position.set(8, 9, 22);
        scene.add(mast1);
        objects.push(mast1);

        // Boat mast 2 (cylinder)
        var mast2 = new THREE.Mesh(mast1Geom, mastMat);
        mast2.position.set(18, 8, 18);
        scene.add(mast2);
        objects.push(mast2);

        // Carradale Point ancient fort walls (box)
        var fortWallGeom = new THREE.BoxGeometry(14, 3, 3);
        var fortMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var fortWall = new THREE.Mesh(fortWallGeom, fortMat);
        fortWall.position.set(25, 15, -20);
        scene.add(fortWall);
        objects.push(fortWall);

        // Carradale Point lookout post (cylinder)
        var lookoutGeom = new THREE.CylinderGeometry(2, 2.2, 10, 16);
        var lookoutMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var lookout = new THREE.Mesh(lookoutGeom, lookoutMat);
        lookout.position.set(30, 20, -15);
        scene.add(lookout);
        objects.push(lookout);

        // Kilbrannan Sound clifftop hut (box)
        var hutGeom = new THREE.BoxGeometry(5, 4, 6);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(-8, 12, 28);
        scene.add(hut);
        objects.push(hut);

        // Kilbrannan Sound acoustic buoys in sea (sphere)
        var buoyGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(-15, 0.5, 18);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(-5, 0.5, 22);
        scene.add(buoy2);
        objects.push(buoy2);

        // Torrisdale Bay concrete defense blocks (box)
        var blockGeom = new THREE.BoxGeometry(4, 2, 4);
        var blockMat = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });
        var block1 = new THREE.Mesh(blockGeom, blockMat);
        block1.position.set(3, 1, -10);
        scene.add(block1);
        objects.push(block1);

        var block2 = new THREE.Mesh(blockGeom, blockMat);
        block2.position.set(-2, 1, -8);
        scene.add(block2);
        objects.push(block2);

        // Sheepfold stone fold walls (box)
        var foldGeom = new THREE.BoxGeometry(10, 2, 12);
        var foldMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var fold = new THREE.Mesh(foldGeom, foldMat);
        fold.position.set(10, 1, -22);
        scene.add(fold);
        objects.push(fold);

        // Sheepfold elevated shooting platform (box)
        var platformGeom = new THREE.BoxGeometry(6, 1.5, 6);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(12, 8, -20);
        scene.add(platform);
        objects.push(platform);

        // Distress rocket launcher tube (cylinder)
        var launcherGeom = new THREE.CylinderGeometry(1.5, 1.7, 8, 12);
        var launcherMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var launcher = new THREE.Mesh(launcherGeom, launcherMat);
        launcher.position.set(-30, 4, 5);
        scene.add(launcher);
        objects.push(launcher);

        // Distress rocket (cone)
        var rocketGeom = new THREE.ConeGeometry(0.8, 3, 8);
        var rocketMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var rocket = new THREE.Mesh(rocketGeom, rocketMat);
        rocket.position.set(-30, 12, 5);
        scene.add(rocket);
        objects.push(rocket);

        // Rocket launcher mounting (box)
        var mountGeom = new THREE.BoxGeometry(3, 2, 3);
        var mountMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mount = new THREE.Mesh(mountGeom, mountMat);
        mount.position.set(-30, 1, 5);
        scene.add(mount);
        objects.push(mount);

        // Sensor cables using LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cablePoints = [
            new THREE.Vector3(-8, 12, 28),
            new THREE.Vector3(-15, 1, 18),
            new THREE.Vector3(-8, 12, 28),
            new THREE.Vector3(-5, 1, 22),
            new THREE.Vector3(-8, 12, 28),
            new THREE.Vector3(0, 2, 25)
        ];
        cableGeom.setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 2 });
        var cables = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Add lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                // Gentle rotation for beacon elements
                if (i === 9 || i === 10) {
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

    return { init: init, update: update, reset: reset };
}());
