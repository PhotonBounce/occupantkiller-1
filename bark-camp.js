window.BarkCamp = (function() {
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
        // Log pile 1 - stacked horizontal logs
        var logMaterial1 = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var logGeo1 = new THREE.CylinderGeometry(1.2, 1.2, 8, 16);
        var log1 = new THREE.Mesh(logGeo1, logMaterial1);
        log1.position.set(-25, 1.2, -20);
        log1.rotation.z = Math.PI / 2;
        scene.add(log1);
        objects.push(log1);

        var log2 = new THREE.Mesh(logGeo1, logMaterial1);
        log2.position.set(-25, 3.6, -20);
        log2.rotation.z = Math.PI / 2;
        scene.add(log2);
        objects.push(log2);

        var log3 = new THREE.Mesh(logGeo1, logMaterial1);
        log3.position.set(-25, 6.0, -20);
        log3.rotation.z = Math.PI / 2;
        scene.add(log3);
        objects.push(log3);

        // Log pile 2 - different stack
        var logMaterial2 = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var logGeo2 = new THREE.CylinderGeometry(1.0, 1.0, 7, 16);
        var log4 = new THREE.Mesh(logGeo2, logMaterial2);
        log4.position.set(15, 1.0, -15);
        log4.rotation.z = Math.PI / 2;
        scene.add(log4);
        objects.push(log4);

        var log5 = new THREE.Mesh(logGeo2, logMaterial2);
        log5.position.set(15, 3.0, -15);
        log5.rotation.z = Math.PI / 2;
        scene.add(log5);
        objects.push(log5);

        // Sawmill building - main structure
        var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var buildingGeo = new THREE.BoxGeometry(12, 8, 10);
        var building = new THREE.Mesh(buildingGeo, buildingMaterial);
        building.position.set(0, 4, 10);
        scene.add(building);
        objects.push(building);

        // Sawmill roof peak
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
        var roofGeo = new THREE.ConeGeometry(6.5, 4, 4);
        var roof = new THREE.Mesh(roofGeo, roofMaterial);
        roof.position.set(0, 12, 10);
        scene.add(roof);
        objects.push(roof);

        // Bark stripping station 1 - work platform
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var platformGeo = new THREE.BoxGeometry(5, 0.5, 4);
        var platform1 = new THREE.Mesh(platformGeo, platformMaterial);
        platform1.position.set(-15, 3, 5);
        scene.add(platform1);
        objects.push(platform1);

        // Support posts for platform
        var postMaterial = new THREE.MeshLambertMaterial({ color: 0x704214 });
        var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
        var post1 = new THREE.Mesh(postGeo, postMaterial);
        post1.position.set(-17, 1.5, 3);
        scene.add(post1);
        objects.push(post1);

        var post2 = new THREE.Mesh(postGeo, postMaterial);
        post2.position.set(-13, 1.5, 3);
        scene.add(post2);
        objects.push(post2);

        // Bark stripping station 2
        var platform2 = new THREE.Mesh(platformGeo, platformMaterial);
        platform2.position.set(20, 3, 0);
        scene.add(platform2);
        objects.push(platform2);

        var post3 = new THREE.Mesh(postGeo, postMaterial);
        post3.position.set(18, 1.5, -2);
        scene.add(post3);
        objects.push(post3);

        var post4 = new THREE.Mesh(postGeo, postMaterial);
        post4.position.set(22, 1.5, -2);
        scene.add(post4);
        objects.push(post4);

        // Wood chip mound 1
        var chipMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var chipGeo = new THREE.ConeGeometry(5, 4, 12);
        var chipMound1 = new THREE.Mesh(chipGeo, chipMaterial);
        chipMound1.position.set(-20, 2, 20);
        scene.add(chipMound1);
        objects.push(chipMound1);

        // Wood chip mound 2
        var chipMound2 = new THREE.Mesh(chipGeo, chipMaterial);
        chipMound2.position.set(25, 2, 25);
        scene.add(chipMound2);
        objects.push(chipMound2);

        // Timber frame under construction - vertical beams
        var beamMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var beamGeo = new THREE.CylinderGeometry(0.6, 0.6, 6, 8);
        var beam1 = new THREE.Mesh(beamGeo, beamMaterial);
        beam1.position.set(-5, 3, -25);
        scene.add(beam1);
        objects.push(beam1);

        var beam2 = new THREE.Mesh(beamGeo, beamMaterial);
        beam2.position.set(5, 3, -25);
        scene.add(beam2);
        objects.push(beam2);

        // Lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0xffa500, 1.0, 50);
        pointLight.position.set(0, 8, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Subtle animation - logs rotating slowly
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry instanceof THREE.CylinderGeometry) {
                objects[i].rotation.x += delta * 0.1;
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
