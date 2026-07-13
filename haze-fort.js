window.HazeFort = (function() {
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
        // Haze generator tower 1 - cylinder stack with sphere cloud top
        var cylinder1 = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 5, 12, 16),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        cylinder1.position.set(-25, 6, -20);
        scene.add(cylinder1);
        objects.push(cylinder1);

        var sphere1 = new THREE.Mesh(
            new THREE.SphereGeometry(6, 16, 12),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        sphere1.position.set(-25, 19, -20);
        scene.add(sphere1);
        objects.push(sphere1);

        // Haze generator tower 2
        var cylinder2 = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 4, 10, 16),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        cylinder2.position.set(15, 5, -25);
        scene.add(cylinder2);
        objects.push(cylinder2);

        var sphere2 = new THREE.Mesh(
            new THREE.SphereGeometry(5, 16, 12),
            new THREE.MeshLambertMaterial({ color: 0x777777 })
        );
        sphere2.position.set(15, 17, -25);
        scene.add(sphere2);
        objects.push(sphere2);

        // Gas mask storage building - box-like structure
        var storageBox = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 6),
            new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
        );
        storageBox.position.set(-15, 3, 10);
        scene.add(storageBox);
        objects.push(storageBox);

        // Decontamination station tower
        var deconTower = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 3, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        deconTower.position.set(20, 4, 15);
        scene.add(deconTower);
        objects.push(deconTower);

        var deconCone = new THREE.Mesh(
            new THREE.ConeGeometry(3, 4, 12),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        deconCone.position.set(20, 10, 15);
        scene.add(deconCone);
        objects.push(deconCone);

        // Hazmat barrier post 1
        var barrierPost1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1.2, 7, 8),
            new THREE.MeshLambertMaterial({ color: 0xffaa00 })
        );
        barrierPost1.position.set(-8, 3.5, -10);
        scene.add(barrierPost1);
        objects.push(barrierPost1);

        // Hazmat barrier post 2
        var barrierPost2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1.2, 7, 8),
            new THREE.MeshLambertMaterial({ color: 0xffaa00 })
        );
        barrierPost2.position.set(8, 3.5, -10);
        scene.add(barrierPost2);
        objects.push(barrierPost2);

        // Warning signal pole 1
        var signalPole1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.6, 10, 8),
            new THREE.MeshLambertMaterial({ color: 0xcc0000 })
        );
        signalPole1.position.set(-30, 5, 20);
        scene.add(signalPole1);
        objects.push(signalPole1);

        var signalSphere1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xff0000 })
        );
        signalSphere1.position.set(-30, 11, 20);
        scene.add(signalSphere1);
        objects.push(signalSphere1);

        // Warning signal pole 2
        var signalPole2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.6, 10, 8),
            new THREE.MeshLambertMaterial({ color: 0xcc0000 })
        );
        signalPole2.position.set(30, 5, 20);
        scene.add(signalPole2);
        objects.push(signalPole2);

        var signalSphere2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xff0000 })
        );
        signalSphere2.position.set(30, 11, 20);
        scene.add(signalSphere2);
        objects.push(signalSphere2);

        // Chemical weapon containment vessel
        var containerBox = new THREE.Mesh(
            new THREE.BoxGeometry(5, 5, 5),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        containerBox.position.set(0, 2.5, -5);
        scene.add(containerBox);
        objects.push(containerBox);

        // Backup haze generator tower 3
        var cylinder3 = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 3.5, 9, 14),
            new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
        );
        cylinder3.position.set(-5, 4.5, 25);
        scene.add(cylinder3);
        objects.push(cylinder3);

        var sphere3 = new THREE.Mesh(
            new THREE.SphereGeometry(4, 12, 10),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        sphere3.position.set(-5, 15, 25);
        scene.add(sphere3);
        objects.push(sphere3);

        // Central monitoring station structure
        var monitorBox = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 8),
            new THREE.MeshLambertMaterial({ color: 0x1f1f1f })
        );
        monitorBox.position.set(0, 2, 0);
        scene.add(monitorBox);
        objects.push(monitorBox);

        // Main ambient light
        var ambientLight = new THREE.AmbientLight(0x555555, 1.0);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light with fog effect
        var dirLight = new THREE.DirectionalLight(0xaaaaaa, 0.6);
        dirLight.position.set(50, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Subtle rotation of haze generator spheres
        if (objects.length > 1) {
            objects[1].rotation.y += 0.001;
            objects[3].rotation.y += 0.0015;
            objects[12].rotation.y += 0.0008;
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
