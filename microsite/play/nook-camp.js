window.NookCamp = (function() {
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
        // Left wall (tall box)
        var leftWallGeo = new THREE.BoxGeometry(5, 40, 2);
        var leftWallMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
        leftWall.position.set(-28, 20, 0);
        scene.add(leftWall);
        objects.push(leftWall);

        // Right wall (tall box)
        var rightWallGeo = new THREE.BoxGeometry(5, 40, 2);
        var rightWallMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
        rightWall.position.set(28, 20, 0);
        scene.add(rightWall);
        objects.push(rightWall);

        // Rooftop sentry platform (box on top of wall)
        var sentryPlatformGeo = new THREE.BoxGeometry(12, 2, 8);
        var sentryPlatformMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var sentryPlatform = new THREE.Mesh(sentryPlatformGeo, sentryPlatformMat);
        sentryPlatform.position.set(0, 40, 5);
        scene.add(sentryPlatform);
        objects.push(sentryPlatform);

        // Sentry railing (box)
        var railingGeo = new THREE.BoxGeometry(12, 1.5, 0.5);
        var railingMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var railing = new THREE.Mesh(railingGeo, railingMat);
        railing.position.set(0, 41.2, 8.5);
        scene.add(railing);
        objects.push(railing);

        // Clothesline support post 1 (cylinder)
        var postGeo1 = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
        var postMat1 = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var post1 = new THREE.Mesh(postGeo1, postMat1);
        post1.position.set(-12, 5, 0);
        scene.add(post1);
        objects.push(post1);

        // Clothesline support post 2 (cylinder)
        var postGeo2 = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
        var postMat2 = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var post2 = new THREE.Mesh(postGeo2, postMat2);
        post2.position.set(12, 5, 0);
        scene.add(post2);
        objects.push(post2);

        // Clothesline horizontal wire (LineSegments)
        var lineGeometry = new THREE.BufferGeometry();
        var linePoints = [
            new THREE.Vector3(-12, 8, -2),
            new THREE.Vector3(12, 8, -2),
            new THREE.Vector3(-12, 8, 2),
            new THREE.Vector3(12, 8, 2)
        ];
        lineGeometry.setFromPoints(linePoints);
        var lineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
        var clothesline = new THREE.LineSegments(lineGeometry, lineMat);
        scene.add(clothesline);
        objects.push(clothesline);

        // Fabric hanging 1 (box)
        var fabric1Geo = new THREE.BoxGeometry(3, 3, 0.2);
        var fabric1Mat = new THREE.MeshLambertMaterial({ color: 0xcc6633 });
        var fabric1 = new THREE.Mesh(fabric1Geo, fabric1Mat);
        fabric1.position.set(-8, 6, -2);
        scene.add(fabric1);
        objects.push(fabric1);

        // Fabric hanging 2 (box)
        var fabric2Geo = new THREE.BoxGeometry(3, 3, 0.2);
        var fabric2Mat = new THREE.MeshLambertMaterial({ color: 0xdd7744 });
        var fabric2 = new THREE.Mesh(fabric2Geo, fabric2Mat);
        fabric2.position.set(0, 6, 2);
        scene.add(fabric2);
        objects.push(fabric2);

        // Fabric hanging 3 (box)
        var fabric3Geo = new THREE.BoxGeometry(3, 3, 0.2);
        var fabric3Mat = new THREE.MeshLambertMaterial({ color: 0xbb5522 });
        var fabric3 = new THREE.Mesh(fabric3Geo, fabric3Mat);
        fabric3.position.set(8, 6, -2);
        scene.add(fabric3);
        objects.push(fabric3);

        // Rain barrel 1 (cylinder)
        var barrel1Geo = new THREE.CylinderGeometry(2, 2.2, 4, 8);
        var barrel1Mat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var barrel1 = new THREE.Mesh(barrel1Geo, barrel1Mat);
        barrel1.position.set(-18, 2, -15);
        scene.add(barrel1);
        objects.push(barrel1);

        // Rain barrel 2 (cylinder)
        var barrel2Geo = new THREE.CylinderGeometry(2, 2.2, 4, 8);
        var barrel2Mat = new THREE.MeshLambertMaterial({ color: 0x3d6b1f });
        var barrel2 = new THREE.Mesh(barrel2Geo, barrel2Mat);
        barrel2.position.set(-12, 2, -20);
        scene.add(barrel2);
        objects.push(barrel2);

        // Rain barrel 3 (cylinder)
        var barrel3Geo = new THREE.CylinderGeometry(2, 2.2, 4, 8);
        var barrel3Mat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var barrel3 = new THREE.Mesh(barrel3Geo, barrel3Mat);
        barrel3.position.set(15, 2, -18);
        scene.add(barrel3);
        objects.push(barrel3);

        // Secret door panel (box)
        var doorPanelGeo = new THREE.BoxGeometry(3, 6, 0.4);
        var doorPanelMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var doorPanel = new THREE.Mesh(doorPanelGeo, doorPanelMat);
        doorPanel.position.set(25, 3, -10);
        scene.add(doorPanel);
        objects.push(doorPanel);

        // Secret door outline (LineSegments)
        var doorLineGeo = new THREE.BufferGeometry();
        var doorPoints = [
            new THREE.Vector3(23.5, 0, -9.8),
            new THREE.Vector3(26.5, 0, -9.8),
            new THREE.Vector3(26.5, 6, -9.8),
            new THREE.Vector3(23.5, 6, -9.8),
            new THREE.Vector3(23.5, 0, -9.8)
        ];
        doorLineGeo.setFromPoints(doorPoints);
        var doorLineMat = new THREE.LineBasicMaterial({ color: 0xff9900 });
        var doorOutline = new THREE.LineSegments(doorLineGeo, doorLineMat);
        scene.add(doorOutline);
        objects.push(doorOutline);

        // Crate storage 1 (box)
        var crate1Geo = new THREE.BoxGeometry(4, 4, 4);
        var crate1Mat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var crate1 = new THREE.Mesh(crate1Geo, crate1Mat);
        crate1.position.set(-20, 2, 10);
        scene.add(crate1);
        objects.push(crate1);

        // Crate storage 2 (box)
        var crate2Geo = new THREE.BoxGeometry(4, 4, 4);
        var crate2Mat = new THREE.MeshLambertMaterial({ color: 0x7a3f0f });
        var crate2 = new THREE.Mesh(crate2Geo, crate2Mat);
        crate2.position.set(-14, 2, 15);
        scene.add(crate2);
        objects.push(crate2);

        // Watch tower cone (cone)
        var towerConeGeo = new THREE.ConeGeometry(1.5, 3, 8);
        var towerConeMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var towerCone = new THREE.Mesh(towerConeGeo, towerConeMat);
        towerCone.position.set(-22, 7, 8);
        scene.add(towerCone);
        objects.push(towerCone);

        // Watch tower post support (cylinder)
        var towerPostGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
        var towerPostMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var towerPost = new THREE.Mesh(towerPostGeo, towerPostMat);
        towerPost.position.set(-22, 3, 8);
        scene.add(towerPost);
        objects.push(towerPost);

        // Central campfire sphere (sphere)
        var fireGeo = new THREE.SphereGeometry(1.5, 8, 8);
        var fireMat = new THREE.MeshLambertMaterial({ color: 0xff5500 });
        var fire = new THREE.Mesh(fireGeo, fireMat);
        fire.position.set(0, 0.8, 0);
        scene.add(fire);
        objects.push(fire);

        // Campfire ring (cylinder)
        var fireRingGeo = new THREE.CylinderGeometry(3, 3, 0.5, 8);
        var fireRingMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var fireRing = new THREE.Mesh(fireRingGeo, fireRingMat);
        fireRing.position.set(0, 0.2, 0);
        scene.add(fireRing);
        objects.push(fireRing);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Point light near campfire
        var pointLight = new THREE.PointLight(0xffaa44, 1, 50);
        pointLight.position.set(0, 3, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Animate campfire by rotating sphere slightly
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry && objects[i].geometry instanceof THREE.SphereGeometry) {
                    objects[i].rotation.y += delta * 0.5;
                }
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
