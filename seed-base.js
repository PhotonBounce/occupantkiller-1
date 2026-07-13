window.SeedBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        var material_concrete = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var material_steel = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var material_accent = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        var material_tower = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var material_fence = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var silo1 = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 25, 16),
            material_concrete
        );
        silo1.position.set(-25, 12.5, -20);
        scene.add(silo1);
        objects.push(silo1);

        var silo2 = new THREE.Mesh(
            new THREE.CylinderGeometry(7, 7, 28, 16),
            material_concrete
        );
        silo2.position.set(0, 14, -18);
        scene.add(silo2);
        objects.push(silo2);

        var silo3 = new THREE.Mesh(
            new THREE.CylinderGeometry(8.5, 8.5, 26, 16),
            material_concrete
        );
        silo3.position.set(22, 13, -22);
        scene.add(silo3);
        objects.push(silo3);

        var processingBldg1 = new THREE.Mesh(
            new THREE.BoxGeometry(18, 10, 15),
            material_steel
        );
        processingBldg1.position.set(-15, 5, 10);
        scene.add(processingBldg1);
        objects.push(processingBldg1);

        var processingBldg2 = new THREE.Mesh(
            new THREE.BoxGeometry(16, 9, 12),
            material_steel
        );
        processingBldg2.position.set(18, 4.5, 8);
        scene.add(processingBldg2);
        objects.push(processingBldg2);

        var conveyorUnit1 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 20),
            material_accent
        );
        conveyorUnit1.position.set(-8, 1.5, 0);
        scene.add(conveyorUnit1);
        objects.push(conveyorUnit1);

        var conveyorUnit2 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 20),
            material_accent
        );
        conveyorUnit2.position.set(8, 1.5, 0);
        scene.add(conveyorUnit2);
        objects.push(conveyorUnit2);

        var controlTower1 = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 20, 12),
            material_tower
        );
        controlTower1.position.set(-28, 10, 15);
        scene.add(controlTower1);
        objects.push(controlTower1);

        var controlTower2 = new THREE.Mesh(
            new THREE.CylinderGeometry(3.5, 3.5, 18, 12),
            material_tower
        );
        controlTower2.position.set(28, 9, 16);
        scene.add(controlTower2);
        objects.push(controlTower2);

        var fencePost1 = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 8, 1.5),
            material_fence
        );
        fencePost1.position.set(-35, 4, -30);
        scene.add(fencePost1);
        objects.push(fencePost1);

        var fencePost2 = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 8, 1.5),
            material_fence
        );
        fencePost2.position.set(35, 4, -30);
        scene.add(fencePost2);
        objects.push(fencePost2);

        var fencePost3 = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 8, 1.5),
            material_fence
        );
        fencePost3.position.set(-35, 4, 25);
        scene.add(fencePost3);
        objects.push(fencePost3);

        var fencePost4 = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 8, 1.5),
            material_fence
        );
        fencePost4.position.set(35, 4, 25);
        scene.add(fencePost4);
        objects.push(fencePost4);

        var coolingUnit1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 6, 8),
            material_accent
        );
        coolingUnit1.position.set(-20, 3, -10);
        scene.add(coolingUnit1);
        objects.push(coolingUnit1);

        var coolingUnit2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 5, 7),
            material_accent
        );
        coolingUnit2.position.set(20, 2.5, -12);
        scene.add(coolingUnit2);
        objects.push(coolingUnit2);

        var storageVault = new THREE.Mesh(
            new THREE.BoxGeometry(12, 8, 14),
            material_concrete
        );
        storageVault.position.set(0, 4, -28);
        scene.add(storageVault);
        objects.push(storageVault);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
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
