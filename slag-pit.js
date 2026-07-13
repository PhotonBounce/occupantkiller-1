window.SlagPit = (function() {
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
        buildPit();
    }

    function buildPit() {
        var moltenSlagPool1 = new THREE.Mesh(
            new THREE.BoxGeometry(20, 3, 15),
            new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: 0xFF3300 })
        );
        moltenSlagPool1.position.set(-25, 2, -20);
        scene.add(moltenSlagPool1);
        objects.push(moltenSlagPool1);

        var moltenSlagPool2 = new THREE.Mesh(
            new THREE.BoxGeometry(18, 2.5, 12),
            new THREE.MeshLambertMaterial({ color: 0xFFAA00, emissive: 0xFF5500 })
        );
        moltenSlagPool2.position.set(20, 1.5, -15);
        scene.add(moltenSlagPool2);
        objects.push(moltenSlagPool2);

        var coolingMound1 = new THREE.Mesh(
            new THREE.ConeGeometry(15, 12, 16),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        coolingMound1.position.set(-15, 6, 10);
        scene.add(coolingMound1);
        objects.push(coolingMound1);

        var coolingMound2 = new THREE.Mesh(
            new THREE.ConeGeometry(12, 10, 16),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        coolingMound2.position.set(18, 5, 18);
        scene.add(coolingMound2);
        objects.push(coolingMound2);

        var conveyorFrameLeft = new THREE.Mesh(
            new THREE.BoxGeometry(3, 8, 40),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        conveyorFrameLeft.position.set(-28, 4, 0);
        scene.add(conveyorFrameLeft);
        objects.push(conveyorFrameLeft);

        var conveyorFrameRight = new THREE.Mesh(
            new THREE.BoxGeometry(3, 8, 40),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        conveyorFrameRight.position.set(28, 4, 0);
        scene.add(conveyorFrameRight);
        objects.push(conveyorFrameRight);

        var coolingTower1 = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 10, 25, 8),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        coolingTower1.position.set(-30, 12.5, 25);
        scene.add(coolingTower1);
        objects.push(coolingTower1);

        var coolingTower2 = new THREE.Mesh(
            new THREE.CylinderGeometry(7, 9, 22, 8),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        coolingTower2.position.set(30, 11, 28);
        scene.add(coolingTower2);
        objects.push(coolingTower2);

        var wasteChute1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 10, 5),
            new THREE.MeshLambertMaterial({ color: 0x777777 })
        );
        wasteChute1.rotation.z = 0.4;
        wasteChute1.position.set(-20, 8, -25);
        scene.add(wasteChute1);
        objects.push(wasteChute1);

        var wasteChute2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 9, 4),
            new THREE.MeshLambertMaterial({ color: 0x777777 })
        );
        wasteChute2.rotation.z = -0.35;
        wasteChute2.position.set(22, 7, -28);
        scene.add(wasteChute2);
        objects.push(wasteChute2);

        var slagHeap1 = new THREE.Mesh(
            new THREE.SphereGeometry(7, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        slagHeap1.position.set(-5, 3.5, -10);
        scene.add(slagHeap1);
        objects.push(slagHeap1);

        var slagHeap2 = new THREE.Mesh(
            new THREE.SphereGeometry(6, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        slagHeap2.position.set(8, 3, 5);
        scene.add(slagHeap2);
        objects.push(slagHeap2);

        var slagHeap3 = new THREE.Mesh(
            new THREE.SphereGeometry(5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        slagHeap3.position.set(0, 2.5, 15);
        scene.add(slagHeap3);
        objects.push(slagHeap3);

        var processVessel1 = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 6, 14, 8),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        processVessel1.position.set(-10, 7, -5);
        scene.add(processVessel1);
        objects.push(processVessel1);

        var processVessel2 = new THREE.Mesh(
            new THREE.CylinderGeometry(4.5, 5.5, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x999999 })
        );
        processVessel2.position.set(12, 6, 8);
        scene.add(processVessel2);
        objects.push(processVessel2);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0xFF6600, 1.2, 60);
        pointLight.position.set(-25, 10, -20);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.y < 50) {
                objects[i].rotation.y += delta * 0.05;
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
