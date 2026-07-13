window.MerePost = (function() {
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
        // Central observation post platform (main stilted platform)
        var platformGeom = new THREE.BoxGeometry(20, 2, 20);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(0, 8, 0);
        scene.add(platform);
        objects.push(platform);

        // Main support stilts
        var stiltGeom = new THREE.CylinderGeometry(1.2, 1.2, 12, 8);
        var stiltMat = new THREE.MeshLambertMaterial({ color: 0x654321 });

        var stilt1 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt1.position.set(-8, 4, -8);
        scene.add(stilt1);
        objects.push(stilt1);

        var stilt2 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt2.position.set(8, 4, -8);
        scene.add(stilt2);
        objects.push(stilt2);

        var stilt3 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt3.position.set(-8, 4, 8);
        scene.add(stilt3);
        objects.push(stilt3);

        var stilt4 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt4.position.set(8, 4, 8);
        scene.add(stilt4);
        objects.push(stilt4);

        // Observation tower (central cylinder)
        var towerGeom = new THREE.CylinderGeometry(3, 3, 6, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(0, 13, 0);
        scene.add(tower);
        objects.push(tower);

        // Reed bed camouflage screen cluster 1
        var reedGeom1 = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
        var reedMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
        var reed1 = new THREE.Mesh(reedGeom1, reedMat);
        reed1.position.set(-25, 2, -20);
        scene.add(reed1);
        objects.push(reed1);

        // Reed bed camouflage screen cluster 2
        var reed2 = new THREE.Mesh(reedGeom1, reedMat);
        reed2.position.set(22, 2, 15);
        scene.add(reed2);
        objects.push(reed2);

        // Reed bed camouflage screen cluster 3
        var reed3 = new THREE.Mesh(reedGeom1, reedMat);
        reed3.position.set(-18, 2, 25);
        scene.add(reed3);
        objects.push(reed3);

        // Punt-style patrol boat 1 (low flat box hull)
        var boatGeom = new THREE.BoxGeometry(5, 1.2, 12);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var boat1 = new THREE.Mesh(boatGeom, boatMat);
        boat1.position.set(-28, 0.5, -8);
        scene.add(boat1);
        objects.push(boat1);

        // Punt-style patrol boat 2
        var boat2 = new THREE.Mesh(boatGeom, boatMat);
        boat2.position.set(26, 0.5, 5);
        scene.add(boat2);
        objects.push(boat2);

        // Lily pad mine decoy 1 (sphere green pad)
        var lilyGeom = new THREE.SphereGeometry(2, 16, 16);
        var lilyMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var lily1 = new THREE.Mesh(lilyGeom, lilyMat);
        lily1.position.set(-15, 0.2, -12);
        scene.add(lily1);
        objects.push(lily1);

        // Lily pad mine decoy 2
        var lily2 = new THREE.Mesh(lilyGeom, lilyMat);
        lily2.position.set(12, 0.2, -18);
        scene.add(lily2);
        objects.push(lily2);

        // Lily pad mine decoy 3
        var lily3 = new THREE.Mesh(lilyGeom, lilyMat);
        lily3.position.set(8, 0.2, 22);
        scene.add(lily3);
        objects.push(lily3);

        // Dragonfly drone launching rail (angled box ramp)
        var rampGeom = new THREE.BoxGeometry(3, 1, 15);
        var rampMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var ramp = new THREE.Mesh(rampGeom, rampMat);
        ramp.position.set(0, 14, 8);
        ramp.rotation.z = 0.4;
        scene.add(ramp);
        objects.push(ramp);

        // Guide rails for drone ramp (LineSegments)
        var railGeom = new THREE.BufferGeometry();
        var railPositions = new Float32Array([
            -1.5, 14, 0, -1.5, 15.5, 15,
            1.5, 14, 0, 1.5, 15.5, 15
        ]);
        railGeom.setAttribute('position', new THREE.BufferAttribute(railPositions, 3));
        var railMat = new THREE.LineBasicMaterial({ color: 0xFFD700, linewidth: 2 });
        var rails = new THREE.LineSegments(railGeom, railMat);
        scene.add(rails);
        objects.push(rails);

        // Cone-shaped radar installation on tower top
        var radarGeom = new THREE.ConeGeometry(2.5, 3, 12);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        var radar = new THREE.Mesh(radarGeom, radarMat);
        radar.position.set(0, 17, 0);
        scene.add(radar);
        objects.push(radar);

        // Add directional light
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 25, 30);
        scene.add(dirLight);
        lights.push(dirLight);

        // Add ambient light
        var ambLight = new THREE.AmbientLight(0x888888, 0.5);
        scene.add(ambLight);
        lights.push(ambLight);
    }

    function update(delta) {
        // Simple animation: rotate radar
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry && objects[i].geometry.type === 'ConeGeometry') {
                    objects[i].rotation.y += delta * 1.5;
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
