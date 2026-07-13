window.ClayRidge = (function() {
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
        buildRidge();
    }

    function buildRidge() {
        var ridgeColor = 0xA0522D;
        var terracottaColor = 0xCD5C5C;
        var darkClayColor = 0x8B4513;
        var brickColor = 0xC85A54;
        var eroded = 0x9A4D3A;

        var mainLight = new THREE.PointLight(0xFFDEAD, 1.5, 200);
        mainLight.position.set(15, 50, 25);
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0x8B7355, 0.8);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var ridgeBase = new THREE.BoxGeometry(70, 8, 45);
        var ridgeMat = new THREE.MeshLambertMaterial({ color: darkClayColor });
        var baseRidge = new THREE.Mesh(ridgeBase, ridgeMat);
        baseRidge.position.set(0, 4, 0);
        baseRidge.castShadow = true;
        baseRidge.receiveShadow = true;
        scene.add(baseRidge);
        objects.push(baseRidge);

        var outcrop1 = new THREE.BoxGeometry(22, 18, 18);
        var outcropMat = new THREE.MeshLambertMaterial({ color: terracottaColor });
        var clay1 = new THREE.Mesh(outcrop1, outcropMat);
        clay1.position.set(-28, 15, -15);
        clay1.rotation.z = 0.15;
        clay1.castShadow = true;
        clay1.receiveShadow = true;
        scene.add(clay1);
        objects.push(clay1);

        var outcrop2 = new THREE.BoxGeometry(20, 16, 16);
        var clay2 = new THREE.Mesh(outcrop2, outcropMat);
        clay2.position.set(26, 14, 12);
        clay2.rotation.z = -0.12;
        clay2.castShadow = true;
        clay2.receiveShadow = true;
        scene.add(clay2);
        objects.push(clay2);

        var gully1 = new THREE.BoxGeometry(15, 12, 8);
        var gullyMat = new THREE.MeshLambertMaterial({ color: eroded });
        var channel1 = new THREE.Mesh(gully1, gullyMat);
        channel1.position.set(-18, 8, 8);
        channel1.castShadow = true;
        channel1.receiveShadow = true;
        scene.add(channel1);
        objects.push(channel1);

        var gully2 = new THREE.BoxGeometry(16, 11, 9);
        var channel2 = new THREE.Mesh(gully2, gullyMat);
        channel2.position.set(12, 7, -14);
        channel2.castShadow = true;
        channel2.receiveShadow = true;
        scene.add(channel2);
        objects.push(channel2);

        var firingPos1 = new THREE.BoxGeometry(14, 6, 10);
        var fireMat = new THREE.MeshLambertMaterial({ color: brickColor });
        var fire1 = new THREE.Mesh(firingPos1, fireMat);
        fire1.position.set(-25, 12, 0);
        fire1.castShadow = true;
        fire1.receiveShadow = true;
        scene.add(fire1);
        objects.push(fire1);

        var firingPos2 = new THREE.BoxGeometry(13, 5, 11);
        var fire2 = new THREE.Mesh(firingPos2, fireMat);
        fire2.position.set(22, 11, -22);
        fire2.castShadow = true;
        fire2.receiveShadow = true;
        scene.add(fire2);
        objects.push(fire2);

        var wallSeg1 = new THREE.BoxGeometry(18, 7, 4);
        var wallMat = new THREE.MeshLambertMaterial({ color: brickColor });
        var wall1 = new THREE.Mesh(wallSeg1, wallMat);
        wall1.position.set(-15, 11, 18);
        wall1.castShadow = true;
        wall1.receiveShadow = true;
        scene.add(wall1);
        objects.push(wall1);

        var wallSeg2 = new THREE.BoxGeometry(16, 6, 4);
        var wall2 = new THREE.Mesh(wallSeg2, wallMat);
        wall2.position.set(18, 10, -16);
        wall2.castShadow = true;
        wall2.receiveShadow = true;
        scene.add(wall2);
        objects.push(wall2);

        var exposure1 = new THREE.BoxGeometry(8, 22, 6);
        var exposeMat = new THREE.MeshLambertMaterial({ color: ridgeColor });
        var face1 = new THREE.Mesh(exposure1, exposeMat);
        face1.position.set(-32, 14, 20);
        face1.rotation.z = 0.25;
        face1.castShadow = true;
        face1.receiveShadow = true;
        scene.add(face1);
        objects.push(face1);

        var exposure2 = new THREE.BoxGeometry(7, 20, 5);
        var face2 = new THREE.Mesh(exposure2, exposeMat);
        face2.position.set(30, 13, -20);
        face2.rotation.z = -0.22;
        face2.castShadow = true;
        face2.receiveShadow = true;
        scene.add(face2);
        objects.push(face2);

        var smallOutcrop1 = new THREE.SphereGeometry(6, 8, 8);
        var smallMat = new THREE.MeshLambertMaterial({ color: terracottaColor });
        var sphere1 = new THREE.Mesh(smallOutcrop1, smallMat);
        sphere1.position.set(-8, 18, -22);
        sphere1.castShadow = true;
        sphere1.receiveShadow = true;
        scene.add(sphere1);
        objects.push(sphere1);

        var smallOutcrop2 = new THREE.SphereGeometry(5, 8, 8);
        var sphere2 = new THREE.Mesh(smallOutcrop2, smallMat);
        sphere2.position.set(15, 16, 24);
        sphere2.castShadow = true;
        sphere2.receiveShadow = true;
        scene.add(sphere2);
        objects.push(sphere2);

        var pillar1 = new THREE.CylinderGeometry(4, 4.5, 12, 8);
        var pillarMat = new THREE.MeshLambertMaterial({ color: darkClayColor });
        var cyl1 = new THREE.Mesh(pillar1, pillarMat);
        cyl1.position.set(-20, 10, -8);
        cyl1.castShadow = true;
        cyl1.receiveShadow = true;
        scene.add(cyl1);
        objects.push(cyl1);

        var pillar2 = new THREE.CylinderGeometry(3.5, 4, 10, 8);
        var cyl2 = new THREE.Mesh(pillar2, pillarMat);
        cyl2.position.set(28, 9, 18);
        cyl2.castShadow = true;
        cyl2.receiveShadow = true;
        scene.add(cyl2);
        objects.push(cyl2);

        var cone1 = new THREE.ConeGeometry(5, 14, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: eroded });
        var peak1 = new THREE.Mesh(cone1, coneMat);
        peak1.position.set(-5, 16, 15);
        peak1.castShadow = true;
        peak1.receiveShadow = true;
        scene.add(peak1);
        objects.push(peak1);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation && i % 7 === 0) {
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
