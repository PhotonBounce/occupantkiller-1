window.DuneCamp = (function() {
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
        // Sand dune mound - large cone
        var duneMaterial = new THREE.MeshLambertMaterial({ color: 0xc2a86b });
        var dunGeom = new THREE.ConeGeometry(40, 25, 32);
        var duneMesh = new THREE.Mesh(dunGeom, duneMaterial);
        duneMesh.position.set(0, 12, 0);
        duneMesh.rotation.z = 0.3;
        scene.add(duneMesh);
        objects.push(duneMesh);

        // Half-buried tent 1 - box geometry
        var tentMaterial = new THREE.MeshLambertMaterial({ color: 0xa67c52 });
        var tentGeom1 = new THREE.BoxGeometry(8, 6, 12);
        var tent1 = new THREE.Mesh(tentGeom1, tentMaterial);
        tent1.position.set(-15, 2, -15);
        tent1.rotation.y = 0.4;
        scene.add(tent1);
        objects.push(tent1);

        // Half-buried tent 2 - box geometry
        var tent2 = new THREE.Mesh(tentGeom1, tentMaterial);
        tent2.position.set(15, 2, -20);
        tent2.rotation.y = -0.3;
        scene.add(tent2);
        objects.push(tent2);

        // Sand wedge covering tent 1
        var sandWedge1Geom = new THREE.ConeGeometry(6, 8, 16);
        var sandWedge1 = new THREE.Mesh(sandWedge1Geom, duneMaterial);
        sandWedge1.position.set(-15, 5, -15);
        sandWedge1.rotation.z = 1.2;
        scene.add(sandWedge1);
        objects.push(sandWedge1);

        // Sand wedge covering tent 2
        var sandWedge2 = new THREE.Mesh(sandWedge1Geom, duneMaterial);
        sandWedge2.position.set(15, 5, -20);
        sandWedge2.rotation.z = -1.1;
        scene.add(sandWedge2);
        objects.push(sandWedge2);

        // Desert vehicle - cylindrical body
        var vehicleBodyGeom = new THREE.CylinderGeometry(3, 3.5, 10, 8);
        var vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var vehicleBody = new THREE.Mesh(vehicleBodyGeom, vehicleMaterial);
        vehicleBody.position.set(-25, 3.5, 10);
        vehicleBody.rotation.z = 0.2;
        scene.add(vehicleBody);
        objects.push(vehicleBody);

        // Vehicle wheel 1
        var wheelGeom = new THREE.CylinderGeometry(2, 2, 1.2, 16);
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var wheel1 = new THREE.Mesh(wheelGeom, wheelMaterial);
        wheel1.position.set(-30, 2, 10);
        wheel1.rotation.z = Math.PI / 2;
        scene.add(wheel1);
        objects.push(wheel1);

        // Vehicle wheel 2
        var wheel2 = new THREE.Mesh(wheelGeom, wheelMaterial);
        wheel2.position.set(-20, 2, 10);
        wheel2.rotation.z = Math.PI / 2;
        scene.add(wheel2);
        objects.push(wheel2);

        // Supply crate 1 - sand colored box
        var crateGeom = new THREE.BoxGeometry(4, 4, 4);
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0xd4af8f });
        var crate1 = new THREE.Mesh(crateGeom, crateMaterial);
        crate1.position.set(20, 2, -8);
        scene.add(crate1);
        objects.push(crate1);

        // Supply crate 2
        var crate2 = new THREE.Mesh(crateGeom, crateMaterial);
        crate2.position.set(26, 2, -8);
        scene.add(crate2);
        objects.push(crate2);

        // Supply crate 3 - stacked
        var crate3 = new THREE.Mesh(crateGeom, crateMaterial);
        crate3.position.set(23, 6, -8);
        scene.add(crate3);
        objects.push(crate3);

        // Mirage heat shimmer tower 1 - tall cylinder
        var shimmerGeom = new THREE.CylinderGeometry(1.5, 2, 20, 12);
        var shimmerMaterial = new THREE.MeshLambertMaterial({ color: 0xf4e4c1 });
        var shimmer1 = new THREE.Mesh(shimmerGeom, shimmerMaterial);
        shimmer1.position.set(8, 10, 25);
        shimmer1.rotation.x = 0.1;
        scene.add(shimmer1);
        objects.push(shimmer1);

        // Mirage heat shimmer tower 2
        var shimmer2 = new THREE.Mesh(shimmerGeom, shimmerMaterial);
        shimmer2.position.set(25, 10, 20);
        shimmer2.rotation.x = -0.08;
        scene.add(shimmer2);
        objects.push(shimmer2);

        // Buried artillery position - sphere base
        var artilleryGeom = new THREE.SphereGeometry(5, 16, 12);
        var artilleryMaterial = new THREE.MeshLambertMaterial({ color: 0x9d8b73 });
        var artillery = new THREE.Mesh(artilleryGeom, artilleryMaterial);
        artillery.position.set(-5, 5, -30);
        scene.add(artillery);
        objects.push(artillery);

        // Artillery gun barrel - thin cylinder
        var barrelGeom = new THREE.CylinderGeometry(0.6, 0.7, 15, 8);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
        barrel.position.set(-5, 12, -22);
        barrel.rotation.x = 0.5;
        scene.add(barrel);
        objects.push(barrel);

        // Sandbag reinforcement - small boxes around artillery
        var sandbagGeom = new THREE.BoxGeometry(2, 1.5, 1.5);
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xb8956f });
        var sandbag1 = new THREE.Mesh(sandbagGeom, sandbagMaterial);
        sandbag1.position.set(-10, 2, -30);
        scene.add(sandbag1);
        objects.push(sandbag1);

        // Sandbag 2
        var sandbag2 = new THREE.Mesh(sandbagGeom, sandbagMaterial);
        sandbag2.position.set(0, 2, -30);
        scene.add(sandbag2);
        objects.push(sandbag2);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for sun
        var sunLight = new THREE.DirectionalLight(0xffe4b5, 0.8);
        sunLight.position.set(50, 40, 30);
        sunLight.castShadow = true;
        scene.add(sunLight);
        lights.push(sunLight);
    }

    function update(delta) {
        // Animate mirage shimmer effect - subtle rotation and scale
        if (objects.length > 10) {
            var shimmerIndex = 10;
            if (objects[shimmerIndex]) {
                objects[shimmerIndex].rotation.y += delta * 0.3;
                objects[shimmerIndex].scale.y = 1 + Math.sin(delta) * 0.05;
            }
            if (objects[11]) {
                objects[11].rotation.y -= delta * 0.25;
                objects[11].scale.y = 1 + Math.cos(delta) * 0.05;
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
