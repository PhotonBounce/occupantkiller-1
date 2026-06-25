window.FenDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        var darkWater = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
        var rottenWood = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        var paleDock = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var darkGreen = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var mudBrown = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var mossy = new THREE.MeshLambertMaterial({ color: 0x4a5f3d });
        var rustRed = new THREE.MeshLambertMaterial({ color: 0x7a3d2d });
        var grayShack = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        // Dock planks (long boxes spread across the dock)
        var plankGeom1 = new THREE.BoxGeometry(20, 0.8, 3);
        var plank1 = new THREE.Mesh(plankGeom1, rottenWood);
        plank1.position.set(-15, 0, -8);
        plank1.rotation.z = 0.1;
        scene.add(plank1);
        objects.push(plank1);

        var plankGeom2 = new THREE.BoxGeometry(20, 0.8, 3);
        var plank2 = new THREE.Mesh(plankGeom2, paleDock);
        plank2.position.set(-5, 0.5, 0);
        plank2.rotation.z = -0.08;
        scene.add(plank2);
        objects.push(plank2);

        var plankGeom3 = new THREE.BoxGeometry(20, 0.8, 3);
        var plank3 = new THREE.Mesh(plankGeom3, rottenWood);
        plank3.position.set(8, 0, 8);
        plank3.rotation.z = 0.12;
        scene.add(plank3);
        objects.push(plank3);

        // Reed bundles (cylinder clusters)
        var reedGeom1 = new THREE.CylinderGeometry(1.2, 1.5, 8, 8);
        var reed1 = new THREE.Mesh(reedGeom1, darkGreen);
        reed1.position.set(-25, 3, -20);
        scene.add(reed1);
        objects.push(reed1);

        var reedGeom2 = new THREE.CylinderGeometry(0.9, 1.2, 6, 8);
        var reed2 = new THREE.Mesh(reedGeom2, mossy);
        reed2.position.set(-20, 2.5, -28);
        scene.add(reed2);
        objects.push(reed2);

        var reedGeom3 = new THREE.CylinderGeometry(1.0, 1.3, 7, 8);
        var reed3 = new THREE.Mesh(reedGeom3, darkGreen);
        reed3.position.set(20, 3, 25);
        scene.add(reed3);
        objects.push(reed3);

        // Punting boat hulls (flat boxes)
        var boatGeom1 = new THREE.BoxGeometry(5, 1.2, 2.5);
        var boat1 = new THREE.Mesh(boatGeom1, mudBrown);
        boat1.position.set(-10, 0.3, -15);
        boat1.rotation.z = 0.15;
        scene.add(boat1);
        objects.push(boat1);

        var boatGeom2 = new THREE.BoxGeometry(6, 1.1, 2.8);
        var boat2 = new THREE.Mesh(boatGeom2, rustRed);
        boat2.position.set(12, 0.4, 5);
        boat2.rotation.z = -0.2;
        scene.add(boat2);
        objects.push(boat2);

        // Fishing shack walls (boxes)
        var shackGeom1 = new THREE.BoxGeometry(4, 3.5, 4);
        var shack1 = new THREE.Mesh(shackGeom1, grayShack);
        shack1.position.set(-28, 1.75, 15);
        scene.add(shack1);
        objects.push(shack1);

        var shackGeom2 = new THREE.BoxGeometry(3, 2.8, 3);
        var shack2 = new THREE.Mesh(shackGeom2, mudBrown);
        shack2.position.set(25, 1.4, -18);
        scene.add(shack2);
        objects.push(shack2);

        // Wooden posts (cylinders)
        var postGeom1 = new THREE.CylinderGeometry(0.4, 0.5, 5, 6);
        var post1 = new THREE.Mesh(postGeom1, rottenWood);
        post1.position.set(-30, 2.5, -10);
        scene.add(post1);
        objects.push(post1);

        var postGeom2 = new THREE.CylinderGeometry(0.35, 0.45, 4.5, 6);
        var post2 = new THREE.Mesh(postGeom2, paleDock);
        post2.position.set(28, 2.25, 12);
        scene.add(post2);
        objects.push(post2);

        var postGeom3 = new THREE.CylinderGeometry(0.38, 0.48, 4, 6);
        var post3 = new THREE.Mesh(postGeom3, mudBrown);
        post3.position.set(0, 2, 20);
        scene.add(post3);
        objects.push(post3);

        // Buoys (spheres)
        var buoyGeom1 = new THREE.SphereGeometry(0.6, 8, 8);
        var buoy1 = new THREE.Mesh(buoyGeom1, rustRed);
        buoy1.position.set(-18, 1.2, -22);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoyGeom2 = new THREE.SphereGeometry(0.5, 8, 8);
        var buoy2 = new THREE.Mesh(buoyGeom2, rustRed);
        buoy2.position.set(22, 0.8, 18);
        scene.add(buoy2);
        objects.push(buoy2);

        // Lantern cone (top of shack)
        var coneGeom1 = new THREE.ConeGeometry(1.2, 2, 8);
        var cone1 = new THREE.Mesh(coneGeom1, grayShack);
        cone1.position.set(-28, 5.5, 15);
        scene.add(cone1);
        objects.push(cone1);

        // Water body (large sphere for depth)
        var waterGeom = new THREE.SphereGeometry(40, 16, 8);
        var water = new THREE.Mesh(waterGeom, darkWater);
        water.position.set(0, -20, 0);
        water.scale.set(1, 0.3, 1);
        scene.add(water);
        objects.push(water);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xaabbcc, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0xffdd99, 0.8);
        pointLight.position.set(-15, 8, 10);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Subtle bobbing of boats and reeds
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.geometry && obj.geometry.type === 'BoxGeometry') {
                obj.position.y += Math.sin(Date.now() * 0.0005 + i) * 0.001;
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
