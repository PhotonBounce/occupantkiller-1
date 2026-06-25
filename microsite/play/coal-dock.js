window.CoalDock = (function() {
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
        var darkGray = 0x2a2a2a;
        var lightGray = 0x5a5a5a;
        var darkBrown = 0x3d2817;
        var charcoal = 0x1a1a1a;
        var steelBlue = 0x4a5f7f;

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 50, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);

        // Conveyor Belt Structure - main horizontal frame
        var beltFrame = new THREE.Mesh(
            new THREE.BoxGeometry(50, 2, 8),
            new THREE.MeshLambertMaterial({ color: steelBlue })
        );
        beltFrame.position.set(0, 3, -15);
        scene.add(beltFrame);
        objects.push(beltFrame);

        // Conveyor belt segments - chain of boxes
        for (var i = 0; i < 12; i++) {
            var beltSegment = new THREE.Mesh(
                new THREE.BoxGeometry(3.5, 1, 8),
                new THREE.MeshLambertMaterial({ color: darkGray })
            );
            beltSegment.position.set(-22 + i * 4, 4, -15);
            scene.add(beltSegment);
            objects.push(beltSegment);
        }

        // Conveyor rollers
        for (var i = 0; i < 4; i++) {
            var roller = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 50, 16),
                new THREE.MeshLambertMaterial({ color: darkGray })
            );
            roller.rotation.z = Math.PI / 2;
            roller.position.set(0, 2 + i * 2, -15);
            scene.add(roller);
            objects.push(roller);
        }

        // Coal pile 1 - cluster of spheres
        for (var i = 0; i < 8; i++) {
            var coalSphere = new THREE.Mesh(
                new THREE.SphereGeometry(2.5, 8, 8),
                new THREE.MeshLambertMaterial({ color: charcoal })
            );
            coalSphere.position.set(-20 + Math.random() * 8, 5 + i * 1.5, -5 + Math.random() * 6);
            scene.add(coalSphere);
            objects.push(coalSphere);
        }

        // Coal pile 2 - more boxes and spheres
        for (var i = 0; i < 6; i++) {
            var coalBox = new THREE.Mesh(
                new THREE.BoxGeometry(3, 3, 3),
                new THREE.MeshLambertMaterial({ color: darkBrown })
            );
            coalBox.position.set(15 + Math.random() * 10, 2 + i * 3, 5 + Math.random() * 8);
            scene.add(coalBox);
            objects.push(coalBox);
        }

        // Coal pile 3 - spheres
        for (var i = 0; i < 7; i++) {
            var coalMass = new THREE.Mesh(
                new THREE.SphereGeometry(2, 8, 8),
                new THREE.MeshLambertMaterial({ color: charcoal })
            );
            coalMass.position.set(8 + Math.random() * 12, 3 + i * 1.2, -20 + Math.random() * 10);
            scene.add(coalMass);
            objects.push(coalMass);
        }

        // Loading crane - vertical structure
        var craneBase = new THREE.Mesh(
            new THREE.BoxGeometry(4, 25, 4),
            new THREE.MeshLambertMaterial({ color: lightGray })
        );
        craneBase.position.set(-25, 13, 15);
        scene.add(craneBase);
        objects.push(craneBase);

        // Crane jib - horizontal beam
        var craneJib = new THREE.Mesh(
            new THREE.BoxGeometry(35, 2, 3),
            new THREE.MeshLambertMaterial({ color: steelBlue })
        );
        craneJib.position.set(-7, 26, 15);
        scene.add(craneJib);
        objects.push(craneJib);

        // Crane hook - cone
        var craneHook = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 4, 8),
            new THREE.MeshLambertMaterial({ color: darkGray })
        );
        craneHook.position.set(5, 20, 15);
        scene.add(craneHook);
        objects.push(craneHook);

        // Barge structure - hull
        var bargeHull = new THREE.Mesh(
            new THREE.BoxGeometry(30, 6, 15),
            new THREE.MeshLambertMaterial({ color: lightGray })
        );
        bargeHull.position.set(20, -2, -8);
        scene.add(bargeHull);
        objects.push(bargeHull);

        // Barge interior chamber
        var bargeChamber = new THREE.Mesh(
            new THREE.BoxGeometry(26, 8, 12),
            new THREE.MeshLambertMaterial({ color: darkGray })
        );
        bargeChamber.position.set(20, 4, -8);
        scene.add(bargeChamber);
        objects.push(bargeChamber);

        // Pier pilings - cylinders
        for (var i = 0; i < 3; i++) {
            var piling = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 20, 8),
                new THREE.MeshLambertMaterial({ color: lightGray })
            );
            piling.position.set(10 + i * 12, -8, 0);
            scene.add(piling);
            objects.push(piling);
        }

        // Warehouse structure - background building
        var warehouse = new THREE.Mesh(
            new THREE.BoxGeometry(40, 20, 10),
            new THREE.MeshLambertMaterial({ color: darkGray })
        );
        warehouse.position.set(-15, 10, 25);
        scene.add(warehouse);
        objects.push(warehouse);
    }

    function update(delta) {
        // Rotate conveyor belt segments
        for (var i = 1; i < Math.min(objects.length, 15); i++) {
            if (objects[i] && objects[i].geometry.type === 'BoxGeometry' && Math.abs(objects[i].position.y - 4) < 0.1) {
                objects[i].rotation.z += 0.01 * delta;
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
