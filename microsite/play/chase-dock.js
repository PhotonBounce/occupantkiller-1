window.ChaseDock = (function() {
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
        // Gamekeeper's fortified lodge - box building with cone tower
        var lodgeBody = new THREE.Mesh(
            new THREE.BoxGeometry(20, 15, 18),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        lodgeBody.position.set(-25, 7.5, -20);
        scene.add(lodgeBody);
        objects.push(lodgeBody);

        var lodgeTower = new THREE.Mesh(
            new THREE.ConeGeometry(4, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        lodgeTower.position.set(-25, 15, -20);
        scene.add(lodgeTower);
        objects.push(lodgeTower);

        // Deer trap pit - box pit with angled ramp
        var pitBox = new THREE.Mesh(
            new THREE.BoxGeometry(14, 6, 12),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        pitBox.position.set(15, -3, -15);
        scene.add(pitBox);
        objects.push(pitBox);

        var ramp = new THREE.Mesh(
            new THREE.BoxGeometry(10, 2, 8),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        ramp.position.set(15, 1, -15);
        ramp.rotation.z = 0.3;
        scene.add(ramp);
        objects.push(ramp);

        // Poacher's cache ammo dump boxes - hidden under sphere bushes
        var cacheBox1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 5),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        cacheBox1.position.set(-5, 2, 10);
        scene.add(cacheBox1);
        objects.push(cacheBox1);

        var bush1 = new THREE.Mesh(
            new THREE.SphereGeometry(5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0x228B22 })
        );
        bush1.position.set(-5, 8, 10);
        scene.add(bush1);
        objects.push(bush1);

        var cacheBox2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 3, 6),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        cacheBox2.position.set(8, 1.5, 20);
        scene.add(cacheBox2);
        objects.push(cacheBox2);

        var bush2 = new THREE.Mesh(
            new THREE.SphereGeometry(4.5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0x32CD32 })
        );
        bush2.position.set(8, 7, 20);
        scene.add(bush2);
        objects.push(bush2);

        // Hunting horn signal post - cylinder pole with sphere horn
        var signalPole = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 16, 8),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        signalPole.position.set(22, 8, 5);
        scene.add(signalPole);
        objects.push(signalPole);

        var signalHorn = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        signalHorn.position.set(22, 18, 5);
        scene.add(signalHorn);
        objects.push(signalHorn);

        // Chase boundary marker obelisks - tall thin box pillars at corners
        var obelisk1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 18, 2),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        obelisk1.position.set(-30, 9, -28);
        scene.add(obelisk1);
        objects.push(obelisk1);

        var obelisk2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 18, 2),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        obelisk2.position.set(30, 9, -28);
        scene.add(obelisk2);
        objects.push(obelisk2);

        var obelisk3 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 18, 2),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        obelisk3.position.set(-30, 9, 28);
        scene.add(obelisk3);
        objects.push(obelisk3);

        var obelisk4 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 18, 2),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        obelisk4.position.set(30, 9, 28);
        scene.add(obelisk4);
        objects.push(obelisk4);

        // Central garrison checkpoint - small fortified structure
        var checkpointBase = new THREE.Mesh(
            new THREE.BoxGeometry(12, 3, 12),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        checkpointBase.position.set(0, 1.5, 0);
        scene.add(checkpointBase);
        objects.push(checkpointBase);

        var checkpointTower = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 2.5, 10, 6),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        checkpointTower.position.set(0, 7, 0);
        scene.add(checkpointTower);
        objects.push(checkpointTower);

        // Lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 25, 15);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Gentle rotation for tower structures
        if (objects.length > 1) {
            objects[1].rotation.y += 0.01;
        }
        if (objects.length > 7) {
            objects[7].rotation.z += 0.005;
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
