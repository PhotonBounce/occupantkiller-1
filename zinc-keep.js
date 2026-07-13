window.ZincKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Zinc ore processing tanks (grey cylinders)
        var tankMaterial1 = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var tank1 = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 20, 16), tankMaterial1);
        tank1.position.set(-25, 10, -20);
        scene.add(tank1);
        objects.push(tank1);

        var tankMaterial2 = new THREE.MeshLambertMaterial({ color: 0x778899 });
        var tank2 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 18, 16), tankMaterial2);
        tank2.position.set(-10, 9, -25);
        scene.add(tank2);
        objects.push(tank2);

        var tankMaterial3 = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tank3 = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 22, 16), tankMaterial3);
        tank3.position.set(15, 11, -15);
        scene.add(tank3);
        objects.push(tank3);

        // Electrolytic cell banks (rows of flat boxes)
        var cellMaterial1 = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var cell1 = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 4), cellMaterial1);
        cell1.position.set(-20, 3, 5);
        scene.add(cell1);
        objects.push(cell1);

        var cellMaterial2 = new THREE.MeshLambertMaterial({ color: 0x8f8f8f });
        var cell2 = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 4), cellMaterial2);
        cell2.position.set(-20, 10, 5);
        scene.add(cell2);
        objects.push(cell2);

        var cellMaterial3 = new THREE.MeshLambertMaterial({ color: 0x787878 });
        var cell3 = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 4), cellMaterial3);
        cell3.position.set(-20, 17, 5);
        scene.add(cell3);
        objects.push(cell3);

        // Zinc ingot stacks (stacked boxes)
        var ingotMaterial1 = new THREE.MeshLambertMaterial({ color: 0xa9a9a9 });
        var ingot1 = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), ingotMaterial1);
        ingot1.position.set(5, 4, 20);
        scene.add(ingot1);
        objects.push(ingot1);

        var ingotMaterial2 = new THREE.MeshLambertMaterial({ color: 0xb0b0b0 });
        var ingot2 = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), ingotMaterial2);
        ingot2.position.set(15, 4, 25);
        scene.add(ingot2);
        objects.push(ingot2);

        var ingotMaterial3 = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var ingot3 = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), ingotMaterial3);
        ingot3.position.set(25, 4, 22);
        scene.add(ingot3);
        objects.push(ingot3);

        // Cooling towers (tall cones)
        var towerMaterial1 = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var tower1 = new THREE.Mesh(new THREE.ConeGeometry(6, 25, 12), towerMaterial1);
        tower1.position.set(28, 12.5, -5);
        scene.add(tower1);
        objects.push(tower1);

        var towerMaterial2 = new THREE.MeshLambertMaterial({ color: 0x6f6f6f });
        var tower2 = new THREE.Mesh(new THREE.ConeGeometry(5, 20, 12), towerMaterial2);
        tower2.position.set(30, 10, 10);
        scene.add(tower2);
        objects.push(tower2);

        // Chemical pipe network (LineSegments)
        var pipeGeometry1 = new THREE.BufferGeometry();
        var pipePositions1 = new Float32Array([
            -15, 20, 0,
            -5, 20, 0,
            5, 20, 0,
            15, 20, 0
        ]);
        pipeGeometry1.setAttribute('position', new THREE.BufferAttribute(pipePositions1, 3));
        var pipeMaterial = new THREE.LineBasicMaterial({ color: 0x505050, linewidth: 2 });
        var pipes1 = new THREE.LineSegments(pipeGeometry1, pipeMaterial);
        scene.add(pipes1);
        objects.push(pipes1);

        var pipeGeometry2 = new THREE.BufferGeometry();
        var pipePositions2 = new Float32Array([
            20, 15, -10,
            20, 25, -10,
            20, 15, 10,
            20, 25, 10
        ]);
        pipeGeometry2.setAttribute('position', new THREE.BufferAttribute(pipePositions2, 3));
        var pipes2 = new THREE.LineSegments(pipeGeometry2, pipeMaterial);
        scene.add(pipes2);
        objects.push(pipes2);

        // Industrial spheres (valve accents)
        var valveMaterial1 = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var valve1 = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), valveMaterial1);
        valve1.position.set(0, 20, 0);
        scene.add(valve1);
        objects.push(valve1);

        var valveMaterial2 = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var valve2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), valveMaterial2);
        valve2.position.set(20, 25, 10);
        scene.add(valve2);
        objects.push(valve2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.001;
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
