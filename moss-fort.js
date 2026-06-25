window.MossFort = (function() {
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
        var darkEarth = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var peatBlack = new THREE.MeshLambertMaterial({ color: 0x1a1410 });
        var bogCotton = new THREE.MeshLambertMaterial({ color: 0xf5f5f0 });
        var peatWood = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var ironStain = new THREE.MeshLambertMaterial({ color: 0x4a2511 });
        var sphagnumGreen = new THREE.MeshLambertMaterial({ color: 0x4a6741 });
        var peatHaggWall1 = new THREE.Mesh(new THREE.BoxGeometry(12, 18, 6), darkEarth);
        peatHaggWall1.position.set(-25, 9, -20);
        scene.add(peatHaggWall1);
        objects.push(peatHaggWall1);
        var peatHaggWall2 = new THREE.Mesh(new THREE.BoxGeometry(12, 18, 6), darkEarth);
        peatHaggWall2.position.set(25, 9, -20);
        scene.add(peatHaggWall2);
        objects.push(peatHaggWall2);
        var peatHaggWall3 = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 12), peatBlack);
        peatHaggWall3.position.set(0, 9, 25);
        scene.add(peatHaggWall3);
        objects.push(peatHaggWall3);
        var bogCottonTuft1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4), peatWood);
        bogCottonTuft1.position.set(-15, 2, -10);
        scene.add(bogCottonTuft1);
        objects.push(bogCottonTuft1);
        var bogCottonTop1 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), bogCotton);
        bogCottonTop1.position.set(-15, 6.5, -10);
        scene.add(bogCottonTop1);
        objects.push(bogCottonTop1);
        var bogCottonTuft2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4), peatWood);
        bogCottonTuft2.position.set(12, 2, 8);
        scene.add(bogCottonTuft2);
        objects.push(bogCottonTuft2);
        var bogCottonTop2 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), bogCotton);
        bogCottonTop2.position.set(12, 6.5, 8);
        scene.add(bogCottonTop2);
        objects.push(bogCottonTop2);
        var plankWalkway = new THREE.Mesh(new THREE.BoxGeometry(20, 1.5, 5), peatWood);
        plankWalkway.position.set(0, 3.5, 0);
        scene.add(plankWalkway);
        objects.push(plankWalkway);
        var walkwayLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3.5), peatWood);
        walkwayLeg1.position.set(-8, 1.75, 0);
        scene.add(walkwayLeg1);
        objects.push(walkwayLeg1);
        var walkwayLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3.5), peatWood);
        walkwayLeg2.position.set(8, 1.75, 0);
        scene.add(walkwayLeg2);
        objects.push(walkwayLeg2);
        var antiVehicleBeam1 = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 1.2), ironStain);
        antiVehicleBeam1.rotation.z = 0.4;
        antiVehicleBeam1.position.set(-8, 0.8, 15);
        scene.add(antiVehicleBeam1);
        objects.push(antiVehicleBeam1);
        var antiVehicleBeam2 = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 1.2), ironStain);
        antiVehicleBeam2.rotation.z = -0.4;
        antiVehicleBeam2.position.set(8, 0.8, 15);
        scene.add(antiVehicleBeam2);
        objects.push(antiVehicleBeam2);
        var trenchBox1 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 18), peatBlack);
        trenchBox1.position.set(-18, -1.25, 0);
        scene.add(trenchBox1);
        objects.push(trenchBox1);
        var trenchBox2 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 18), peatBlack);
        trenchBox2.position.set(18, -1.25, 0);
        scene.add(trenchBox2);
        objects.push(trenchBox2);
        var bogOakLog1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 8), peatBlack);
        bogOakLog1.rotation.z = 0.5;
        bogOakLog1.position.set(-28, 2, 10);
        scene.add(bogOakLog1);
        objects.push(bogOakLog1);
        var bogOakLog2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 7), peatBlack);
        bogOakLog2.rotation.z = -0.3;
        bogOakLog2.position.set(-30, 3.5, 0);
        scene.add(bogOakLog2);
        objects.push(bogOakLog2);
        var waterPool = new THREE.Mesh(new THREE.SphereGeometry(5.5, 12, 12), ironStain);
        waterPool.scale.y = 0.4;
        waterPool.position.set(22, 0.2, -15);
        scene.add(waterPool);
        objects.push(waterPool);
        var netPoints = [];
        var nx = 0;
        while (nx < 6) {
            var nz = 0;
            while (nz < 6) {
                netPoints.push(new THREE.Vector3(-15 + nx * 6, 8 + Math.sin(nx + nz) * 1.5, -15 + nz * 6));
                nz = nz + 1;
            }
            nx = nx + 1;
        }
        var netGeometry = new THREE.BufferGeometry();
        netGeometry.setFromPoints(netPoints);
        var netMesh = new THREE.LineSegments(netGeometry, new THREE.LineBasicMaterial({ color: 0x5c6941, linewidth: 2 }));
        scene.add(netMesh);
        objects.push(netMesh);
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }
    function update(delta) {
        var i = 0;
        while (i < objects.length) {
            if (objects[i].rotation) {
                objects[i].rotation.y = objects[i].rotation.y + delta * 0.05;
            }
            i = i + 1;
        }
    }
    function reset() {
        var i = 0;
        while (i < objects.length) {
            scene.remove(objects[i]);
            i = i + 1;
        }
        var j = 0;
        while (j < lights.length) {
            scene.remove(lights[j]);
            j = j + 1;
        }
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }
    return { init: init, update: update, reset: reset };
}());
