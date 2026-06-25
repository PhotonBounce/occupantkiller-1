window.StrathPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // Bridge checkpoint control post - wide flat box bridge on cylinder piers
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var bridgeGeom = new THREE.BoxGeometry(40, 2, 8);
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(0, 3, 0);
        scene.add(bridge);
        objects.push(bridge);

        // Bridge piers - two cylinders
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pierGeom = new THREE.CylinderGeometry(3, 3, 6, 8);
        var pier1 = new THREE.Mesh(pierGeom, pierMat);
        pier1.position.set(-15, 0, 0);
        scene.add(pier1);
        objects.push(pier1);

        var pier2 = new THREE.Mesh(pierGeom, pierMat);
        pier2.position.set(15, 0, 0);
        scene.add(pier2);
        objects.push(pier2);

        // Highland stone tower watchtower - box floors with cone battlement cap
        var towerMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var floor1Geom = new THREE.BoxGeometry(8, 1, 8);
        var floor1 = new THREE.Mesh(floor1Geom, towerMat);
        floor1.position.set(-25, 6, -20);
        scene.add(floor1);
        objects.push(floor1);

        var floor2Geom = new THREE.BoxGeometry(8, 1, 8);
        var floor2 = new THREE.Mesh(floor2Geom, towerMat);
        floor2.position.set(-25, 9, -20);
        scene.add(floor2);
        objects.push(floor2);

        var floor3Geom = new THREE.BoxGeometry(8, 1, 8);
        var floor3 = new THREE.Mesh(floor3Geom, towerMat);
        floor3.position.set(-25, 12, -20);
        scene.add(floor3);
        objects.push(floor3);

        var battlMat = new THREE.MeshLambertMaterial({ color: 0x8B8B7A });
        var battlGeom = new THREE.ConeGeometry(5, 3, 8);
        var battlement = new THREE.Mesh(battlGeom, battlMat);
        battlement.position.set(-25, 15, -20);
        scene.add(battlement);
        objects.push(battlement);

        // Rockfall barricade - sphere boulders clustered
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var boulder1Geom = new THREE.SphereGeometry(4, 6, 6);
        var boulder1 = new THREE.Mesh(boulder1Geom, boulderMat);
        boulder1.position.set(20, 4, 15);
        scene.add(boulder1);
        objects.push(boulder1);

        var boulder2Geom = new THREE.SphereGeometry(3.5, 6, 6);
        var boulder2 = new THREE.Mesh(boulder2Geom, boulderMat);
        boulder2.position.set(22, 3, 18);
        scene.add(boulder2);
        objects.push(boulder2);

        var boulder3Geom = new THREE.SphereGeometry(3, 6, 6);
        var boulder3 = new THREE.Mesh(boulder3Geom, boulderMat);
        boulder3.position.set(18, 2.5, 17);
        scene.add(boulder3);
        objects.push(boulder3);

        // Mountain path barrier gate - box gate with LineSegments chain
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var gateGeom = new THREE.BoxGeometry(12, 6, 1);
        var gate = new THREE.Mesh(gateGeom, gateMat);
        gate.position.set(-10, 4, 25);
        scene.add(gate);
        objects.push(gate);

        var chainPoints = [
            new THREE.Vector3(-8, 10, 25),
            new THREE.Vector3(-6, 8, 25),
            new THREE.Vector3(-4, 10, 25),
            new THREE.Vector3(-2, 8, 25),
            new THREE.Vector3(0, 10, 25),
            new THREE.Vector3(2, 8, 25),
            new THREE.Vector3(4, 10, 25),
            new THREE.Vector3(6, 8, 25),
            new THREE.Vector3(8, 10, 25)
        ];
        var chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
        var chainMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var chain = new THREE.LineSegments(chainGeom, chainMat);
        scene.add(chain);
        objects.push(chain);

        // Glen echo signal horn post - cylinder pole with cone horn
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var poleGeom = new THREE.CylinderGeometry(1.5, 1.5, 10, 8);
        var pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(25, 5, -10);
        scene.add(pole);
        objects.push(pole);

        var hornMat = new THREE.MeshLambertMaterial({ color: 0xD4AF37 });
        var hornGeom = new THREE.ConeGeometry(3, 4, 8);
        var horn = new THREE.Mesh(hornGeom, hornMat);
        horn.position.set(25, 12, -10);
        horn.rotation.z = Math.PI / 2;
        scene.add(horn);
        objects.push(horn);

        // Stone cairn ammunition marker - cone stack of boxes
        var cairnMatBox = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var cairn1Geom = new THREE.BoxGeometry(3, 1, 3);
        var cairn1 = new THREE.Mesh(cairn1Geom, cairnMatBox);
        cairn1.position.set(-30, 1, 5);
        scene.add(cairn1);
        objects.push(cairn1);

        var cairn2Geom = new THREE.BoxGeometry(2.5, 1, 2.5);
        var cairn2 = new THREE.Mesh(cairn2Geom, cairnMatBox);
        cairn2.position.set(-30, 2.5, 5);
        scene.add(cairn2);
        objects.push(cairn2);

        var cairn3Geom = new THREE.BoxGeometry(2, 1, 2);
        var cairn3 = new THREE.Mesh(cairn3Geom, cairnMatBox);
        cairn3.position.set(-30, 4, 5);
        scene.add(cairn3);
        objects.push(cairn3);

        var cairnCapGeom = new THREE.ConeGeometry(2, 2, 6);
        var cairnCapMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var cairnCap = new THREE.Mesh(cairnCapGeom, cairnCapMat);
        cairnCap.position.set(-30, 5.5, 5);
        scene.add(cairnCap);
        objects.push(cairnCap);

        // Overwatch sniper ledge - box platform on cliff face boxes
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var cliffBase1Geom = new THREE.BoxGeometry(6, 4, 4);
        var cliffBase1 = new THREE.Mesh(cliffBase1Geom, cliffMat);
        cliffBase1.position.set(5, 2, -28);
        scene.add(cliffBase1);
        objects.push(cliffBase1);

        var cliffBase2Geom = new THREE.BoxGeometry(6, 3, 4);
        var cliffBase2 = new THREE.Mesh(cliffBase2Geom, cliffMat);
        cliffBase2.position.set(5, 6.5, -28);
        scene.add(cliffBase2);
        objects.push(cliffBase2);

        var ledgeMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var ledgeGeom = new THREE.BoxGeometry(10, 1.5, 6);
        var ledge = new THREE.Mesh(ledgeGeom, ledgeMat);
        ledge.position.set(5, 11, -28);
        scene.add(ledge);
        objects.push(ledge);

        // Add lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation updates if needed
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
