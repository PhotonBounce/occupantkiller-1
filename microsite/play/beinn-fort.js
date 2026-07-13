window.BeinnFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Add lighting
        var ambientLight = new THREE.DirectionalLight(0xffffff, 0.8);
        ambientLight.position.set(50, 80, 50);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var accentLight = new THREE.PointLight(0xff4444, 0.6);
        accentLight.position.set(-40, 60, -40);
        scene.add(accentLight);
        lights.push(accentLight);

        // Main snow-capped peak cone
        var peakGeometry = new THREE.ConeGeometry(25, 60, 32);
        var peakMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var peak = new THREE.Mesh(peakGeometry, peakMaterial);
        peak.position.set(0, 30, 0);
        peak.castShadow = true;
        scene.add(peak);
        objects.push(peak);

        // Snow cap sphere on peak
        var snowCapGeometry = new THREE.SphereGeometry(18, 32, 16);
        var snowCapMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var snowCap = new THREE.Mesh(snowCapGeometry, snowCapMaterial);
        snowCap.position.set(0, 65, 0);
        snowCap.castShadow = true;
        scene.add(snowCap);
        objects.push(snowCap);

        // Rocky summit outcrop cluster - sphere rocks
        var rockGeometry1 = new THREE.SphereGeometry(8, 16, 16);
        var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x7A6E5D });
        var rock1 = new THREE.Mesh(rockGeometry1, rockMaterial);
        rock1.position.set(15, 35, 10);
        rock1.castShadow = true;
        scene.add(rock1);
        objects.push(rock1);

        var rock2 = new THREE.Mesh(rockGeometry1, rockMaterial);
        rock2.position.set(-18, 38, -8);
        rock2.castShadow = true;
        scene.add(rock2);
        objects.push(rock2);

        var rock3 = new THREE.Mesh(rockGeometry1, rockMaterial);
        rock3.position.set(8, 42, -20);
        rock3.castShadow = true;
        scene.add(rock3);
        objects.push(rock3);

        // Summit command pillbox - box bunker
        var pillboxGeometry = new THREE.BoxGeometry(12, 6, 10);
        var pillboxMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var pillbox = new THREE.Mesh(pillboxGeometry, pillboxMaterial);
        pillbox.position.set(0, 48, 0);
        pillbox.castShadow = true;
        scene.add(pillbox);
        objects.push(pillbox);

        // Slit windows on pillbox - LineSegments
        var slitGeometry = new THREE.BufferGeometry();
        var slitPositions = new Float32Array([
            -5, 48, 5, -5, 52, 5,
            5, 48, 5, 5, 52, 5,
            0, 48, -5, 0, 52, -5
        ]);
        slitGeometry.setAttribute('position', new THREE.BufferAttribute(slitPositions, 3));
        var slitMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var slits = new THREE.LineSegments(slitGeometry, slitMaterial);
        scene.add(slits);
        objects.push(slits);

        // Anti-aircraft battery - cylinder barrel on box mount
        var barrelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 18, 16);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(25, 55, 15);
        barrel.rotation.z = 0.6;
        barrel.castShadow = true;
        scene.add(barrel);
        objects.push(barrel);

        var mountGeometry = new THREE.BoxGeometry(6, 4, 6);
        var mountMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var mount = new THREE.Mesh(mountGeometry, mountMaterial);
        mount.position.set(25, 50, 15);
        mount.castShadow = true;
        scene.add(mount);
        objects.push(mount);

        // Altitude warning beacon - sphere pulsing indicator
        var beaconGeometry = new THREE.SphereGeometry(2, 8, 8);
        var beaconMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.set(-30, 70, 10);
        beacon.castShadow = true;
        scene.add(beacon);
        objects.push(beacon);

        // Beacon post - cylinder
        var postGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        var postMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(-30, 63, 10);
        post.castShadow = true;
        scene.add(post);
        objects.push(post);

        // Emergency rappel anchors - sphere rock anchors
        var anchorGeometry = new THREE.SphereGeometry(3, 8, 8);
        var anchorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var anchor1 = new THREE.Mesh(anchorGeometry, anchorMaterial);
        anchor1.position.set(20, 25, -25);
        anchor1.castShadow = true;
        scene.add(anchor1);
        objects.push(anchor1);

        var anchor2 = new THREE.Mesh(anchorGeometry, anchorMaterial);
        anchor2.position.set(-20, 28, 25);
        anchor2.castShadow = true;
        scene.add(anchor2);
        objects.push(anchor2);

        // Rappel rope LineSegments between anchors
        var ropeGeometry = new THREE.BufferGeometry();
        var ropePositions = new Float32Array([
            20, 25, -25, 20, 10, -25,
            -20, 28, 25, -20, 12, 25
        ]);
        ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
        var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 1 });
        var ropes = new THREE.LineSegments(ropeGeometry, ropeMaterial);
        scene.add(ropes);
        objects.push(ropes);

        // Fuel cache under snow - box half-buried
        var fuelGeometry = new THREE.BoxGeometry(10, 5, 8);
        var fuelMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var fuel = new THREE.Mesh(fuelGeometry, fuelMaterial);
        fuel.position.set(-25, 5, -20);
        fuel.castShadow = true;
        scene.add(fuel);
        objects.push(fuel);

        // Snow cover over fuel cache
        var fuelSnowGeometry = new THREE.SphereGeometry(9, 16, 8);
        var fuelSnowMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
        var fuelSnow = new THREE.Mesh(fuelSnowGeometry, fuelSnowMaterial);
        fuelSnow.position.set(-25, 12, -20);
        fuelSnow.scale.y = 0.4;
        fuelSnow.castShadow = true;
        scene.add(fuelSnow);
        objects.push(fuelSnow);

        // Extreme weather shelter dome - sphere dome
        var domeGeometry = new THREE.SphereGeometry(12, 32, 16);
        var domeMaterial = new THREE.MeshLambertMaterial({ color: 0x7B68EE });
        var dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.set(28, 18, -28);
        dome.scale.y = 0.6;
        dome.castShadow = true;
        scene.add(dome);
        objects.push(dome);

        // Shelter entrance - box
        var entranceGeometry = new THREE.BoxGeometry(5, 6, 3);
        var entranceMaterial = new THREE.MeshLambertMaterial({ color: 0x5A4A7A });
        var entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
        entrance.position.set(28, 15, -20);
        entrance.castShadow = true;
        scene.add(entrance);
        objects.push(entrance);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry instanceof THREE.SphereGeometry) {
                    if (objects[i].position.x < -25 && objects[i].position.y > 65) {
                        objects[i].scale.x = 1 + 0.1 * Math.sin(Date.now() * 0.003);
                        objects[i].scale.y = objects[i].scale.x;
                        objects[i].scale.z = objects[i].scale.x;
                    }
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
