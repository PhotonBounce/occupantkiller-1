window.SpeanCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        // Assault course obstacle wall 1
        var wall1Geo = new THREE.BoxGeometry(4, 2.5, 0.5);
        var wall1Mat = new THREE.MeshLambertMaterial({color: 0x8B4513});
        var wall1 = new THREE.Mesh(wall1Geo, wall1Mat);
        wall1.position.set(-20, 1.25, -15);
        scene.add(wall1);
        objects.push(wall1);

        // Assault course obstacle wall 2
        var wall2Geo = new THREE.BoxGeometry(4, 3, 0.5);
        var wall2Mat = new THREE.MeshLambertMaterial({color: 0x8B4513});
        var wall2 = new THREE.Mesh(wall2Geo, wall2Mat);
        wall2.position.set(15, 1.5, -20);
        scene.add(wall2);
        objects.push(wall2);

        // Assault course pole 1
        var pole1Geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
        var pole1Mat = new THREE.MeshLambertMaterial({color: 0x654321});
        var pole1 = new THREE.Mesh(pole1Geo, pole1Mat);
        pole1.position.set(-10, 2, -10);
        scene.add(pole1);
        objects.push(pole1);

        // Assault course pole 2
        var pole2Geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
        var pole2Mat = new THREE.MeshLambertMaterial({color: 0x654321});
        var pole2 = new THREE.Mesh(pole2Geo, pole2Mat);
        pole2.position.set(5, 2, 5);
        scene.add(pole2);
        objects.push(pole2);

        // River crossing rope bridge - rope segments
        var ropeGeo = new THREE.BufferGeometry();
        var ropePositions = new Float32Array([
            -15, 3, 20,
            15, 3, 20,
            -15, 2.5, 35,
            15, 2.5, 35
        ]);
        ropeGeo.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
        var ropeMat = new THREE.LineBasicMaterial({color: 0xD2691E, linewidth: 3});
        var ropeBridge = new THREE.LineSegments(ropeGeo, ropeMat);
        scene.add(ropeBridge);
        objects.push(ropeBridge);

        // River crossing anchor post left
        var anchorLGeo = new THREE.CylinderGeometry(0.4, 0.4, 3.5, 12);
        var anchorMat = new THREE.MeshLambertMaterial({color: 0x4A4A4A});
        var anchorL = new THREE.Mesh(anchorLGeo, anchorMat);
        anchorL.position.set(-18, 1.75, 27);
        scene.add(anchorL);
        objects.push(anchorL);

        // River crossing anchor post right
        var anchorRGeo = new THREE.CylinderGeometry(0.4, 0.4, 3.5, 12);
        var anchorR = new THREE.Mesh(anchorRGeo, anchorMat);
        anchorR.position.set(18, 1.75, 27);
        scene.add(anchorR);
        objects.push(anchorR);

        // Weapons range target frame
        var frameGeo = new THREE.BoxGeometry(2, 3.5, 0.3);
        var frameMat = new THREE.MeshLambertMaterial({color: 0xA9A9A9});
        var frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(-25, 1.75, 8);
        scene.add(frame);
        objects.push(frame);

        // Weapons range post
        var rangePostGeo = new THREE.CylinderGeometry(0.35, 0.35, 4.5, 12);
        var rangePostMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var rangePost = new THREE.Mesh(rangePostGeo, rangePostMat);
        rangePost.position.set(-25, 2.25, 8);
        scene.add(rangePost);
        objects.push(rangePost);

        // Explosives training bunker
        var bunkerGeo = new THREE.BoxGeometry(6, 2.5, 4);
        var bunkerMat = new THREE.MeshLambertMaterial({color: 0x3A3A3A});
        var bunker = new THREE.Mesh(bunkerGeo, bunkerMat);
        bunker.position.set(25, -0.5, 0);
        scene.add(bunker);
        objects.push(bunker);

        // Explosives training blast wall - cone
        var blastGeo = new THREE.ConeGeometry(2.5, 3, 8);
        var blastMat = new THREE.MeshLambertMaterial({color: 0x2F4F4F});
        var blastWall = new THREE.Mesh(blastGeo, blastMat);
        blastWall.position.set(28, 1.5, 3);
        scene.add(blastWall);
        objects.push(blastWall);

        // Canoe storage - hull shape 1
        var hull1Geo = new THREE.BoxGeometry(1.5, 1.2, 5);
        var hullMat = new THREE.MeshLambertMaterial({color: 0xCD853F});
        var hull1 = new THREE.Mesh(hull1Geo, hullMat);
        hull1.position.set(-30, 0.6, 5);
        scene.add(hull1);
        objects.push(hull1);

        // Canoe storage - paddle 1
        var paddle1Geo = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
        var paddleMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var paddle1 = new THREE.Mesh(paddle1Geo, paddleMat);
        paddle1.position.set(-32, 2.5, 5);
        paddle1.rotation.z = Math.PI / 4;
        scene.add(paddle1);
        objects.push(paddle1);

        // Rope assault tower - main cylinder pole
        var towerPoleGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 12);
        var towerMat = new THREE.MeshLambertMaterial({color: 0x5D4E37});
        var towerPole = new THREE.Mesh(towerPoleGeo, towerMat);
        towerPole.position.set(0, 4, 15);
        scene.add(towerPole);
        objects.push(towerPole);

        // Rope assault tower - platform 1
        var platformGeo = new THREE.BoxGeometry(3, 0.4, 3);
        var platformMat = new THREE.MeshLambertMaterial({color: 0x8B4513});
        var platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(0, 4, 15);
        scene.add(platform);
        objects.push(platform);

        // Underground operations room - box structure
        var opRoomGeo = new THREE.BoxGeometry(5, 3, 4);
        var opRoomMat = new THREE.MeshLambertMaterial({color: 0x2F2F2F});
        var opRoom = new THREE.Mesh(opRoomGeo, opRoomMat);
        opRoom.position.set(-5, -2, -25);
        scene.add(opRoom);
        objects.push(opRoom);

        // Underground operations room - air vent cylinder
        var ventGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.5, 8);
        var ventMat = new THREE.MeshLambertMaterial({color: 0x4A4A4A});
        var vent = new THREE.Mesh(ventGeo, ventMat);
        vent.position.set(-2, -0.5, -25);
        scene.add(vent);
        objects.push(vent);

        // Memorial stone pillar - tall monolith
        var pillarGeo = new THREE.BoxGeometry(1.5, 6, 1.5);
        var pillarMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(20, 3, -5);
        scene.add(pillar);
        objects.push(pillar);

        // Additional training sphere marker
        var markerGeo = new THREE.SphereGeometry(0.5, 12, 12);
        var markerMat = new THREE.MeshLambertMaterial({color: 0xFF6347});
        var marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(10, 0.5, 0);
        scene.add(marker);
        objects.push(marker);

        // Lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
        directionalLight.position.set(30, 25, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation logic can be added here
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
