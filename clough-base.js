window.CloughBase = (function() {
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
        var leftCliffMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var rightCliffMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var depotMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var machineMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var leftCliffGeometry = new THREE.BoxGeometry(15, 80, 40);
        var leftCliffMesh = new THREE.Mesh(leftCliffGeometry, leftCliffMaterial);
        leftCliffMesh.position.set(-45, 20, 0);
        leftCliffMesh.rotation.z = 0.15;
        scene.add(leftCliffMesh);
        objects.push(leftCliffMesh);
        var rightCliffGeometry = new THREE.BoxGeometry(15, 80, 40);
        var rightCliffMesh = new THREE.Mesh(rightCliffGeometry, rightCliffMaterial);
        rightCliffMesh.position.set(45, 20, 0);
        rightCliffMesh.rotation.z = -0.15;
        scene.add(rightCliffMesh);
        objects.push(rightCliffMesh);
        var machineNestGeometry = new THREE.BoxGeometry(8, 6, 10);
        var machineNestMesh = new THREE.Mesh(machineNestGeometry, machineMaterial);
        machineNestMesh.position.set(-42, 35, 5);
        machineNestMesh.rotation.z = 0.2;
        scene.add(machineNestMesh);
        objects.push(machineNestMesh);
        var depotMain1Geometry = new THREE.BoxGeometry(12, 8, 15);
        var depotMain1Mesh = new THREE.Mesh(depotMain1Geometry, depotMaterial);
        depotMain1Mesh.position.set(-15, 2, 10);
        scene.add(depotMain1Mesh);
        objects.push(depotMain1Mesh);
        var depotMain2Geometry = new THREE.BoxGeometry(12, 8, 15);
        var depotMain2Mesh = new THREE.Mesh(depotMain2Geometry, depotMaterial);
        depotMain2Mesh.position.set(15, 2, 10);
        scene.add(depotMain2Mesh);
        objects.push(depotMain2Mesh);
        var depotRoof1Geometry = new THREE.BoxGeometry(13, 1, 16);
        var depotRoof1Mesh = new THREE.Mesh(depotRoof1Geometry, roofMaterial);
        depotRoof1Mesh.position.set(-15, 6.5, 10);
        scene.add(depotRoof1Mesh);
        objects.push(depotRoof1Mesh);
        var depotRoof2Geometry = new THREE.BoxGeometry(13, 1, 16);
        var depotRoof2Mesh = new THREE.Mesh(depotRoof2Geometry, roofMaterial);
        depotRoof2Mesh.position.set(15, 6.5, 10);
        scene.add(depotRoof2Mesh);
        objects.push(depotRoof2Mesh);
        var bunker1Geometry = new THREE.CylinderGeometry(4, 4, 6, 6);
        var bunker1Mesh = new THREE.Mesh(bunker1Geometry, bunkerMaterial);
        bunker1Mesh.position.set(-25, 2, -15);
        scene.add(bunker1Mesh);
        objects.push(bunker1Mesh);
        var bunker2Geometry = new THREE.CylinderGeometry(4, 4, 6, 6);
        var bunker2Mesh = new THREE.Mesh(bunker2Geometry, bunkerMaterial);
        bunker2Mesh.position.set(25, 2, -15);
        scene.add(bunker2Mesh);
        objects.push(bunker2Mesh);
        var supportPillar1Geometry = new THREE.CylinderGeometry(2, 2, 20, 8);
        var supportPillar1Mesh = new THREE.Mesh(supportPillar1Geometry, bunkerMaterial);
        supportPillar1Mesh.position.set(-35, 10, 20);
        scene.add(supportPillar1Mesh);
        objects.push(supportPillar1Mesh);
        var supportPillar2Geometry = new THREE.CylinderGeometry(2, 2, 20, 8);
        var supportPillar2Mesh = new THREE.Mesh(supportPillar2Geometry, bunkerMaterial);
        supportPillar2Mesh.position.set(35, 10, 20);
        scene.add(supportPillar2Mesh);
        objects.push(supportPillar2Mesh);
        var coneRocket1Geometry = new THREE.ConeGeometry(1.5, 5, 8);
        var coneRocket1Mesh = new THREE.Mesh(coneRocket1Geometry, new THREE.MeshLambertMaterial({ color: 0xff4444 }));
        coneRocket1Mesh.position.set(-10, 12, -5);
        coneRocket1Mesh.rotation.z = Math.PI * 0.5;
        scene.add(coneRocket1Mesh);
        objects.push(coneRocket1Mesh);
        var coneRocket2Geometry = new THREE.ConeGeometry(1.5, 5, 8);
        var coneRocket2Mesh = new THREE.Mesh(coneRocket2Geometry, new THREE.MeshLambertMaterial({ color: 0xff4444 }));
        coneRocket2Mesh.position.set(10, 12, -5);
        coneRocket2Mesh.rotation.z = Math.PI * 0.5;
        scene.add(coneRocket2Mesh);
        objects.push(coneRocket2Mesh);
        var sphereSensor1Geometry = new THREE.SphereGeometry(2, 8, 8);
        var sphereSensor1Mesh = new THREE.Mesh(sphereSensor1Geometry, new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
        sphereSensor1Mesh.position.set(-40, 50, 0);
        scene.add(sphereSensor1Mesh);
        objects.push(sphereSensor1Mesh);
        var sphereSensor2Geometry = new THREE.SphereGeometry(2, 8, 8);
        var sphereSensor2Mesh = new THREE.Mesh(sphereSensor2Geometry, new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
        sphereSensor2Mesh.position.set(40, 50, 0);
        scene.add(sphereSensor2Mesh);
        objects.push(sphereSensor2Mesh);
        var wireLineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
        var wireGeometry = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            -35, 45, 5,
            -35, 5, 5,
            35, 45, 5,
            35, 5, 5
        ]);
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireLines = new THREE.LineSegments(wireGeometry, wireLineMaterial);
        scene.add(wireLines);
        objects.push(wireLines);
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(20, 40, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }
    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].userData && objects[i].userData.animate) {
                objects[i].rotation.y += delta * 0.5;
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
