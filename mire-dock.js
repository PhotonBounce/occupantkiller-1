window.MireDock = (function() {
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
        // Dock platform - elevated wooden dock made of box planks on cylinder posts

        // Main dock platform planks (boxes)
        var plankMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });

        var plank1 = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 8), plankMat);
        plank1.position.set(0, 3, -5);
        scene.add(plank1);
        objects.push(plank1);

        var plank2 = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 8), plankMat);
        plank2.position.set(0, 3, 5);
        scene.add(plank2);
        objects.push(plank2);

        var plank3 = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 8), plankMat);
        plank3.position.set(0, 3, 15);
        scene.add(plank3);
        objects.push(plank3);

        // Dock support posts (cylinders)
        var postMat = new THREE.MeshLambertMaterial({ color: 0x654321 });

        var post1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6, 8), postMat);
        post1.position.set(-15, 0, -5);
        scene.add(post1);
        objects.push(post1);

        var post2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6, 8), postMat);
        post2.position.set(15, 0, -5);
        scene.add(post2);
        objects.push(post2);

        var post3 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6, 8), postMat);
        post3.position.set(-15, 0, 15);
        scene.add(post3);
        objects.push(post3);

        var post4 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6, 8), postMat);
        post4.position.set(15, 0, 15);
        scene.add(post4);
        objects.push(post4);

        // Patrol boats (box hulls)
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });

        var boat1 = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 12), boatMat);
        boat1.position.set(-20, 1, -20);
        scene.add(boat1);
        objects.push(boat1);

        var boat2 = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 12), boatMat);
        boat2.position.set(20, 1, -25);
        scene.add(boat2);
        objects.push(boat2);

        // Alligator pit traps (boxes sunken in swamp)
        var pitMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });

        var pit1 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), pitMat);
        pit1.position.set(-25, -1, 8);
        scene.add(pit1);
        objects.push(pit1);

        var pit2 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), pitMat);
        pit2.position.set(28, -1, 5);
        scene.add(pit2);
        objects.push(pit2);

        // Mosquito net perimeter poles (thin cylinders)
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x696969 });

        var pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 10, 6), poleMat);
        pole1.position.set(-30, 0, -30);
        scene.add(pole1);
        objects.push(pole1);

        var pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 10, 6), poleMat);
        pole2.position.set(30, 0, 30);
        scene.add(pole2);
        objects.push(pole2);

        // Net netting using LineSegments
        var netPoints = [
            new THREE.Vector3(-30, 5, -30),
            new THREE.Vector3(-30, 0, -30),
            new THREE.Vector3(30, 5, 30),
            new THREE.Vector3(30, 0, 30),
            new THREE.Vector3(-30, 5, 30),
            new THREE.Vector3(-30, 0, 30),
            new THREE.Vector3(30, 5, -30),
            new THREE.Vector3(30, 0, -30)
        ];
        var netGeom = new THREE.BufferGeometry().setFromPoints(netPoints);
        var netMat = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
        var netLines = new THREE.LineSegments(netGeom, netMat);
        scene.add(netLines);
        objects.push(netLines);

        // Sunken half-submerged tank wreck (cone pointing down)
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });

        var tankHull = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 8, 8), tankMat);
        tankHull.position.set(0, -3, 25);
        scene.add(tankHull);
        objects.push(tankHull);

        var tankTurret = new THREE.Mesh(new THREE.ConeGeometry(2, 3, 8), tankMat);
        tankTurret.position.set(0, 2, 25);
        scene.add(tankTurret);
        objects.push(tankTurret);

        // Watchtower dome (sphere on top of box structure)
        var towerBaseMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var towerBase = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), towerBaseMat);
        towerBase.position.set(-20, 3, 25);
        scene.add(towerBase);
        objects.push(towerBase);

        var domeMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var dome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), domeMat);
        dome.position.set(-20, 9, 25);
        scene.add(dome);
        objects.push(dome);

        // Swamp water barrel (cylinder)
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x4A5568 });
        var barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3, 8), barrelMat);
        barrel.position.set(15, 0.5, 20);
        scene.add(barrel);
        objects.push(barrel);

        // Lighting
        var mainLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        mainLight.position.set(30, 40, 20);
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0x8B7355, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        // Animation updates for moving objects
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i] && objects[i].rotation) {
                    objects[i].rotation.y += delta * 0.05;
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
