window.CairnKeep = (function() {
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
        // Stacked sphere boulders forming ancient summit cairn
        var cairnMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var sphere1 = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 8), cairnMaterial);
        sphere1.position.set(0, 2, 0);
        scene.add(sphere1);
        objects.push(sphere1);

        var sphere2 = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 8), cairnMaterial);
        sphere2.position.set(0, 7, 0);
        scene.add(sphere2);
        objects.push(sphere2);

        var sphere3 = new THREE.Mesh(new THREE.SphereGeometry(2.0, 8, 8), cairnMaterial);
        sphere3.position.set(0, 11, 0);
        scene.add(sphere3);
        objects.push(sphere3);

        // Wind-battered stone walls - irregular box sections
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var wall1 = new THREE.Mesh(new THREE.BoxGeometry(25, 6, 1.5), stoneMaterial);
        wall1.position.set(-15, 3, -20);
        scene.add(wall1);
        objects.push(wall1);

        var wall2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 6, 25), stoneMaterial);
        wall2.position.set(20, 3, 0);
        scene.add(wall2);
        objects.push(wall2);

        var wall3 = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 1.5), stoneMaterial);
        wall3.position.set(5, 2.5, 25);
        scene.add(wall3);
        objects.push(wall3);

        // Sniper hide crevice - narrow box alcove in rock face
        var crackMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var crevice = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 3.5), crackMaterial);
        crevice.position.set(-22, 4, -18);
        scene.add(crevice);
        objects.push(crevice);

        // Supply helicopter LZ - box pad with LineSegments marking
        var padMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var lzPad = new THREE.Mesh(new THREE.BoxGeometry(15, 0.3, 15), padMaterial);
        lzPad.position.set(10, 0.15, -15);
        scene.add(lzPad);
        objects.push(lzPad);

        var linePoints = [
            new THREE.Vector3(2, 0.5, -22),
            new THREE.Vector3(18, 0.5, -22),
            new THREE.Vector3(18, 0.5, -8),
            new THREE.Vector3(2, 0.5, -8)
        ];
        var lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        var lzMarking = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lzMarking);
        objects.push(lzMarking);

        // Mountain rescue cache - box crate with sphere medical kit
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var crate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 2.5), crateMaterial);
        crate.position.set(-25, 1, 10);
        scene.add(crate);
        objects.push(crate);

        var kitMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
        var medKit = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), kitMaterial);
        medKit.position.set(-25, 2.5, 10);
        scene.add(medKit);
        objects.push(medKit);

        // Antenna mast brace cables - tall cylinder plus LineSegments guy wires
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 8), mastMaterial);
        mast.position.set(15, 6, 15);
        scene.add(mast);
        objects.push(mast);

        var cablePoints = [
            new THREE.Vector3(15, 12, 15),
            new THREE.Vector3(25, 4, 15),
            new THREE.Vector3(15, 12, 15),
            new THREE.Vector3(5, 4, 15),
            new THREE.Vector3(15, 12, 15),
            new THREE.Vector3(15, 4, 25)
        ];
        var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableMaterial = new THREE.LineBasicMaterial({ color: 0x8B8B8B });
        var cables = new THREE.LineSegments(cableGeometry, cableMaterial);
        scene.add(cables);
        objects.push(cables);

        // Emergency flare station - cylinder tube plus sphere flare burst
        var tubeColor = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var flareBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 2, 8), tubeColor);
        flareBase.position.set(-10, 1, 20);
        scene.add(flareBase);
        objects.push(flareBase);

        var flareColor = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var flareBurst = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), flareColor);
        flareBurst.position.set(-10, 3.5, 20);
        scene.add(flareBurst);
        objects.push(flareBurst);

        // Exposed ridgeline fighting position - box sandbag wall along ridge
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var sandbags1 = new THREE.Mesh(new THREE.BoxGeometry(30, 1.5, 1), sandbagMaterial);
        sandbags1.position.set(0, 1, -25);
        scene.add(sandbags1);
        objects.push(sandbags1);

        var sandbags2 = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 8), sandbagMaterial);
        sandbags2.position.set(-14, 1.5, -20);
        scene.add(sandbags2);
        objects.push(sandbags2);

        // Rocky outcrops - additional cone geometry for terrain interest
        var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x7F7F7F });
        var rock1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 6), rockMaterial);
        rock1.position.set(22, 1.5, -5);
        scene.add(rock1);
        objects.push(rock1);

        var rock2 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.5, 6), rockMaterial);
        rock2.position.set(-18, 1.25, 5);
        scene.add(rock2);
        objects.push(rock2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.0001 * delta;
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
