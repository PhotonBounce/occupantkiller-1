window.DunCamp = (function() {
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
        // Ancient circular dun wall - thick box arc sections forming ring
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var wallGeo1 = new THREE.BoxGeometry(3, 4, 15);
        var wall1 = new THREE.Mesh(wallGeo1, wallMaterial);
        wall1.position.set(-20, 2, 0);
        scene.add(wall1);
        objects.push(wall1);

        var wallGeo2 = new THREE.BoxGeometry(3, 4, 15);
        var wall2 = new THREE.Mesh(wallGeo2, wallMaterial);
        wall2.position.set(20, 2, 0);
        scene.add(wall2);
        objects.push(wall2);

        var wallGeo3 = new THREE.BoxGeometry(15, 4, 3);
        var wall3 = new THREE.Mesh(wallGeo3, wallMaterial);
        wall3.position.set(0, 2, 20);
        scene.add(wall3);
        objects.push(wall3);

        var wallGeo4 = new THREE.BoxGeometry(15, 4, 3);
        var wall4 = new THREE.Mesh(wallGeo4, wallMaterial);
        wall4.position.set(0, 2, -20);
        scene.add(wall4);
        objects.push(wall4);

        // Central command roundhouse - cylinder walls
        var houseMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var wallCyl = new THREE.CylinderGeometry(8, 8, 5, 16);
        var roundhouse = new THREE.Mesh(wallCyl, houseMaterial);
        roundhouse.position.set(0, 2.5, 0);
        scene.add(roundhouse);
        objects.push(roundhouse);

        // Cone thatched roof
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var roofCone = new THREE.ConeGeometry(9, 6, 16);
        var roof = new THREE.Mesh(roofCone, roofMaterial);
        roof.position.set(0, 8, 0);
        scene.add(roof);
        objects.push(roof);

        // Iron Age souterrain tunnel entrance - box tunnel portal
        var tunnelMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var tunnelGeo = new THREE.BoxGeometry(4, 3.5, 8);
        var tunnel = new THREE.Mesh(tunnelGeo, tunnelMaterial);
        tunnel.position.set(-25, 1.75, 15);
        scene.add(tunnel);
        objects.push(tunnel);

        // Hidden supply pit - box below ground
        var pitMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var pitGeo = new THREE.BoxGeometry(6, 3, 6);
        var pit = new THREE.Mesh(pitGeo, pitMaterial);
        pit.position.set(15, -1.5, -18);
        scene.add(pit);
        objects.push(pit);

        // Perimeter stake fence - cylinder stakes
        var stakeMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var stakeGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);

        var stake1 = new THREE.Mesh(stakeGeo, stakeMaterial);
        stake1.position.set(-28, 2, -28);
        scene.add(stake1);
        objects.push(stake1);

        var stake2 = new THREE.Mesh(stakeGeo, stakeMaterial);
        stake2.position.set(28, 2, -28);
        scene.add(stake2);
        objects.push(stake2);

        var stake3 = new THREE.Mesh(stakeGeo, stakeMaterial);
        stake3.position.set(28, 2, 28);
        scene.add(stake3);
        objects.push(stake3);

        // LineSegments crossbeam between stakes
        var crossbeamGeo = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -28, 3, -28,
            28, 3, -28,
            28, 3, -28,
            28, 3, 28,
            28, 3, 28,
            -28, 3, 28,
            -28, 3, 28,
            -28, 3, -28
        ]);
        crossbeamGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var crossbeamMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513 });
        var crossbeam = new THREE.LineSegments(crossbeamGeo, crossbeamMaterial);
        scene.add(crossbeam);
        objects.push(crossbeam);

        // Signal hillfire - sphere fire on box platform
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var platformGeo = new THREE.BoxGeometry(3, 0.5, 3);
        var platform = new THREE.Mesh(platformGeo, platformMaterial);
        platform.position.set(-18, 5, -22);
        scene.add(platform);
        objects.push(platform);

        var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var fireGeo = new THREE.SphereGeometry(1.2, 12, 12);
        var fire = new THREE.Mesh(fireGeo, fireMaterial);
        fire.position.set(-18, 6.5, -22);
        scene.add(fire);
        objects.push(fire);

        // Raiding party staging area - box crates
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var crateGeo = new THREE.BoxGeometry(2, 2, 2);

        var crate1 = new THREE.Mesh(crateGeo, crateMaterial);
        crate1.position.set(10, 1, 10);
        scene.add(crate1);
        objects.push(crate1);

        var crate2 = new THREE.Mesh(crateGeo, crateMaterial);
        crate2.position.set(15, 1, 12);
        scene.add(crate2);
        objects.push(crate2);

        // Barrel stacked in staging area
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 12);
        var barrel1 = new THREE.Mesh(barrelGeo, barrelMaterial);
        barrel1.position.set(12, 1, 14);
        scene.add(barrel1);
        objects.push(barrel1);

        var barrel2 = new THREE.Mesh(barrelGeo, barrelMaterial);
        barrel2.position.set(12, 3, 14);
        scene.add(barrel2);
        objects.push(barrel2);

        // Escape route fox path - stepping-box stones down slope
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var stoneGeo = new THREE.BoxGeometry(1.5, 0.4, 1.5);

        var stone1 = new THREE.Mesh(stoneGeo, stoneMaterial);
        stone1.position.set(20, 0, 0);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(stoneGeo, stoneMaterial);
        stone2.position.set(25, -1, 5);
        scene.add(stone2);
        objects.push(stone2);

        var stone3 = new THREE.Mesh(stoneGeo, stoneMaterial);
        stone3.position.set(28, -2, 12);
        scene.add(stone3);
        objects.push(stone3);

        var stone4 = new THREE.Mesh(stoneGeo, stoneMaterial);
        stone4.position.set(30, -3, 20);
        scene.add(stone4);
        objects.push(stone4);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0xFF8C00, 1, 50);
        pointLight.position.set(-18, 8, -22);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Animate fire sphere flickering
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry instanceof THREE.SphereGeometry) {
                objects[i].scale.x = 1 + 0.1 * Math.sin(delta * 3);
                objects[i].scale.y = 1 + 0.1 * Math.sin(delta * 3);
                objects[i].scale.z = 1 + 0.1 * Math.sin(delta * 3);
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
