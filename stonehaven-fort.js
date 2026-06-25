window.StonehavenFort = (function() {
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
        build();
    }

    function build() {
        var baseX = 440;
        var baseZ = 430;

        // Cliff platform - large dark gray base
        var cliffGeometry = new THREE.BoxGeometry(60, 8, 50);
        var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
        cliff.position.set(baseX, 45, baseZ);
        scene.add(cliff);
        objects.push(cliff);

        // Dunnottar main fortress block - stone gray
        var mainKeepGeometry = new THREE.BoxGeometry(10, 8, 6);
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var mainKeep = new THREE.Mesh(mainKeepGeometry, stoneMaterial);
        mainKeep.position.set(baseX - 5, 53, baseZ - 8);
        scene.add(mainKeep);
        objects.push(mainKeep);

        // Second fortress tower - reinforcement
        var towerGeometry = new THREE.BoxGeometry(7, 10, 7);
        var tower = new THREE.Mesh(towerGeometry, stoneMaterial);
        tower.position.set(baseX + 8, 54, baseZ - 5);
        scene.add(tower);
        objects.push(tower);

        // Castle gatehouse with central gap
        var gatehouseGeometry = new THREE.BoxGeometry(4, 6, 3);
        var gatehouse = new THREE.Mesh(gatehouseGeometry, stoneMaterial);
        gatehouse.position.set(baseX - 12, 52, baseZ + 2);
        scene.add(gatehouse);
        objects.push(gatehouse);

        // Gatehouse left wing
        var gateLeftGeometry = new THREE.BoxGeometry(2, 5, 2.5);
        var gateLeft = new THREE.Mesh(gateLeftGeometry, stoneMaterial);
        gateLeft.position.set(baseX - 14, 51.5, baseZ + 2);
        scene.add(gateLeft);
        objects.push(gateLeft);

        // Gatehouse right wing
        var gateRightGeometry = new THREE.BoxGeometry(2, 5, 2.5);
        var gateRight = new THREE.Mesh(gateRightGeometry, stoneMaterial);
        gateRight.position.set(baseX - 10, 51.5, baseZ + 2);
        scene.add(gateRight);
        objects.push(gateRight);

        // Sea-side cannon battery - 4 cannon barrels pointing seaward
        var cannonBarrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 12);
        var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var cannon1 = new THREE.Mesh(cannonBarrelGeometry, metalMaterial);
        cannon1.rotation.z = Math.PI / 6;
        cannon1.position.set(baseX + 15, 52, baseZ - 15);
        scene.add(cannon1);
        objects.push(cannon1);

        var cannon2 = new THREE.Mesh(cannonBarrelGeometry, metalMaterial);
        cannon2.rotation.z = Math.PI / 6;
        cannon2.position.set(baseX + 18, 52, baseZ - 15);
        scene.add(cannon2);
        objects.push(cannon2);

        var cannon3 = new THREE.Mesh(cannonBarrelGeometry, metalMaterial);
        cannon3.rotation.z = Math.PI / 6;
        cannon3.position.set(baseX + 15, 52, baseZ - 20);
        scene.add(cannon3);
        objects.push(cannon3);

        var cannon4 = new THREE.Mesh(cannonBarrelGeometry, metalMaterial);
        cannon4.rotation.z = Math.PI / 6;
        cannon4.position.set(baseX + 18, 52, baseZ - 20);
        scene.add(cannon4);
        objects.push(cannon4);

        // Town harbour wall - long stone wall
        var harbourWallGeometry = new THREE.BoxGeometry(16, 3, 1);
        var harbourWall = new THREE.Mesh(harbourWallGeometry, stoneMaterial);
        harbourWall.position.set(baseX + 25, 42, baseZ - 28);
        scene.add(harbourWall);
        objects.push(harbourWall);

        // Harbour defence barrier - chain boom across harbour
        var barrierGeometry = new THREE.BoxGeometry(12, 2, 0.8);
        var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.set(baseX + 20, 43, baseZ - 32);
        scene.add(barrier);
        objects.push(barrier);

        // Clifftop lookout tower - cylindrical
        var lookoutGeometry = new THREE.CylinderGeometry(2.5, 2.5, 7, 16);
        var lookout = new THREE.Mesh(lookoutGeometry, stoneMaterial);
        lookout.position.set(baseX + 28, 54, baseZ + 18);
        scene.add(lookout);
        objects.push(lookout);

        // Lookout tower top - cone roof
        var roofGeometry = new THREE.ConeGeometry(2.7, 2, 16);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x664444 });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(baseX + 28, 61, baseZ + 18);
        scene.add(roof);
        objects.push(roof);

        // Ruined curtain wall - L-shaped partial walls
        var wallSegment1Geometry = new THREE.BoxGeometry(8, 4, 1.2);
        var wallSegment1 = new THREE.Mesh(wallSegment1Geometry, stoneMaterial);
        wallSegment1.position.set(baseX - 8, 50, baseZ + 12);
        scene.add(wallSegment1);
        objects.push(wallSegment1);

        var wallSegment2Geometry = new THREE.BoxGeometry(1.2, 4, 8);
        var wallSegment2 = new THREE.Mesh(wallSegment2Geometry, stoneMaterial);
        wallSegment2.position.set(baseX - 12, 50, baseZ + 8);
        scene.add(wallSegment2);
        objects.push(wallSegment2);

        // Ruined wall decay - broken section
        var ruinGeometry = new THREE.BoxGeometry(5, 3, 1);
        var ruinMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var ruin = new THREE.Mesh(ruinGeometry, ruinMaterial);
        ruin.position.set(baseX - 4, 48, baseZ + 15);
        ruin.rotation.z = 0.2;
        scene.add(ruin);
        objects.push(ruin);

        // Additional defensive fortification - corner bastion
        var bastionGeometry = new THREE.CylinderGeometry(3, 3, 6, 8);
        var bastion = new THREE.Mesh(bastionGeometry, stoneMaterial);
        bastion.position.set(baseX + 20, 51, baseZ + 20);
        scene.add(bastion);
        objects.push(bastion);

        // Scenic rock formations on clifftop
        var rockGeometry = new THREE.SphereGeometry(2, 8, 8);
        var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

        var rock1 = new THREE.Mesh(rockGeometry, rockMaterial);
        rock1.position.set(baseX - 20, 52, baseZ + 10);
        rock1.scale.set(1.5, 1.2, 1.3);
        scene.add(rock1);
        objects.push(rock1);

        var rock2 = new THREE.Mesh(rockGeometry, rockMaterial);
        rock2.position.set(baseX + 30, 50, baseZ - 10);
        rock2.scale.set(1.3, 1, 1.2);
        scene.add(rock2);
        objects.push(rock2);
    }

    function update(delta) {
        // Update logic can be added here if needed
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
