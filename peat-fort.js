window.PeatFort = (function() {
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
        var brownMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var darkBrownMaterial = new THREE.MeshLambertMaterial({ color: 0x2a1810 });
        var lightBrownMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var darkPeatMaterial = new THREE.MeshLambertMaterial({ color: 0x1a0f0a });

        // Main peat brick wall - stacked boxes
        var wallGeom1 = new THREE.BoxGeometry(40, 8, 4);
        var wall1 = new THREE.Mesh(wallGeom1, brownMaterial);
        wall1.position.set(0, 4, -25);
        scene.add(wall1);
        objects.push(wall1);

        // Left fortress wall
        var wallGeom2 = new THREE.BoxGeometry(4, 12, 30);
        var wall2 = new THREE.Mesh(wallGeom2, darkBrownMaterial);
        wall2.position.set(-20, 6, 0);
        scene.add(wall2);
        objects.push(wall2);

        // Right fortress wall
        var wallGeom3 = new THREE.BoxGeometry(4, 12, 30);
        var wall3 = new THREE.Mesh(wallGeom3, darkBrownMaterial);
        wall3.position.set(20, 6, 0);
        scene.add(wall3);
        objects.push(wall3);

        // Peat brick stack 1 - cylindrical tower
        var towerGeom1 = new THREE.CylinderGeometry(6, 7, 15, 8);
        var tower1 = new THREE.Mesh(towerGeom1, brownMaterial);
        tower1.position.set(-15, 7.5, 15);
        scene.add(tower1);
        objects.push(tower1);

        // Peat brick stack 2 - conical pile
        var stackGeom1 = new THREE.ConeGeometry(5, 10, 8);
        var stack1 = new THREE.Mesh(stackGeom1, lightBrownMaterial);
        stack1.position.set(15, 5, 20);
        scene.add(stack1);
        objects.push(stack1);

        // Drainage ditch channel 1 - box geometry
        var ditchGeom1 = new THREE.BoxGeometry(3, 2, 20);
        var ditch1 = new THREE.Mesh(ditchGeom1, darkPeatMaterial);
        ditch1.position.set(-10, 0.5, 5);
        scene.add(ditch1);
        objects.push(ditch1);

        // Drainage ditch channel 2 - box geometry
        var ditchGeom2 = new THREE.BoxGeometry(25, 1.5, 2);
        var ditch2 = new THREE.Mesh(ditchGeom2, darkPeatMaterial);
        ditch2.position.set(0, 0.3, -15);
        scene.add(ditch2);
        objects.push(ditch2);

        // Wooden walkway plank 1
        var walkGeom1 = new THREE.BoxGeometry(30, 1, 3);
        var walk1 = new THREE.Mesh(walkGeom1, woodMaterial);
        walk1.position.set(-5, 2, 8);
        scene.add(walk1);
        objects.push(walk1);

        // Wooden walkway plank 2
        var walkGeom2 = new THREE.BoxGeometry(2, 1, 15);
        var walk2 = new THREE.Mesh(walkGeom2, woodMaterial);
        walk2.position.set(12, 2, -10);
        scene.add(walk2);
        objects.push(walk2);

        // Peat cutting tool handles - cylindrical
        var toolGeom1 = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
        var tool1 = new THREE.Mesh(toolGeom1, woodMaterial);
        tool1.position.set(-25, 4, 10);
        tool1.rotation.z = 0.4;
        scene.add(tool1);
        objects.push(tool1);

        // Peat cutting tool head - sphere
        var toolHeadGeom1 = new THREE.SphereGeometry(1.2, 8, 8);
        var toolHead1 = new THREE.Mesh(toolHeadGeom1, darkBrownMaterial);
        toolHead1.position.set(-25, 8.5, 10);
        scene.add(toolHead1);
        objects.push(toolHead1);

        // Storage mound - conical
        var moundGeom1 = new THREE.ConeGeometry(8, 6, 12);
        var mound1 = new THREE.Mesh(moundGeom1, lightBrownMaterial);
        mound1.position.set(25, 3, -20);
        scene.add(mound1);
        objects.push(mound1);

        // Central fortification tower - cylinder
        var fortTowerGeom = new THREE.CylinderGeometry(5, 6, 18, 10);
        var fortTower = new THREE.Mesh(fortTowerGeom, brownMaterial);
        fortTower.position.set(0, 9, -5);
        scene.add(fortTower);
        objects.push(fortTower);

        // Lookout platform - box
        var platformGeom = new THREE.BoxGeometry(12, 1.5, 12);
        var platform = new THREE.Mesh(platformGeom, woodMaterial);
        platform.position.set(0, 19, -5);
        scene.add(platform);
        objects.push(platform);

        // Peat brick corner pile
        var cornerGeom = new THREE.BoxGeometry(8, 10, 8);
        var corner = new THREE.Mesh(cornerGeom, darkBrownMaterial);
        corner.position.set(-18, 5, -20);
        scene.add(corner);
        objects.push(corner);

        // Bog water sphere pool
        var poolGeom = new THREE.SphereGeometry(6, 16, 16);
        var poolMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        var pool = new THREE.Mesh(poolGeom, poolMaterial);
        pool.position.set(22, 2, 10);
        pool.scale.z = 0.3;
        scene.add(pool);
        objects.push(pool);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0xffcc88, 1.2, 80);
        pointLight.position.set(0, 15, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Animation: gentle sway of structures
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.position.y > 10) {
                obj.rotation.y += delta * 0.1;
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
