window.KnollPost = (function() {
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
        // Main hillock knoll - large partially buried sphere
        var knollGeom = new THREE.SphereGeometry(25, 32, 24);
        var knollMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var knoll = new THREE.Mesh(knollGeom, knollMat);
        knoll.position.set(0, -10, 0);
        knoll.scale.y = 0.6;
        scene.add(knoll);
        objects.push(knoll);

        // Forward observation bunker - box on summit
        var bunkerGeom = new THREE.BoxGeometry(8, 4, 6);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(0, 12, 0);
        scene.add(bunker);
        objects.push(bunker);

        // Viewport slit 1 - small box on front
        var slitGeom = new THREE.BoxGeometry(4, 1.5, 0.3);
        var slitMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var slit1 = new THREE.Mesh(slitGeom, slitMat);
        slit1.position.set(0, 12, 3.2);
        scene.add(slit1);
        objects.push(slit1);

        // Viewport slit 2 - side view
        var slit2 = new THREE.Mesh(slitGeom, slitMat);
        slit2.position.set(4.2, 12, 0);
        slit2.rotation.y = Math.PI / 2;
        scene.add(slit2);
        objects.push(slit2);

        // Rangefinder telescope cylinder body
        var teleCylGeom = new THREE.CylinderGeometry(0.8, 0.8, 15, 16);
        var teleMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var teleCyl = new THREE.Mesh(teleCylGeom, teleMat);
        teleCyl.position.set(1, 16, -2);
        teleCyl.rotation.z = Math.PI / 6;
        scene.add(teleCyl);
        objects.push(teleCyl);

        // Telescope eyepiece - small sphere
        var eyeGeom = new THREE.SphereGeometry(1.2, 16, 16);
        var eyeMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var eyepiece = new THREE.Mesh(eyeGeom, eyeMat);
        eyepiece.position.set(2.5, 22, -6);
        scene.add(eyepiece);
        objects.push(eyepiece);

        // Telescope tripod legs - three cylinders
        var tripodGeom = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
        var tripodMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var tripod1 = new THREE.Mesh(tripodGeom, tripodMat);
        tripod1.position.set(1, 8, -2);
        tripod1.rotation.z = 0.4;
        scene.add(tripod1);
        objects.push(tripod1);

        var tripod2 = new THREE.Mesh(tripodGeom, tripodMat);
        tripod2.position.set(-1.5, 8, 1);
        tripod2.rotation.z = -0.35;
        tripod2.rotation.x = 0.3;
        scene.add(tripod2);
        objects.push(tripod2);

        var tripod3 = new THREE.Mesh(tripodGeom, tripodMat);
        tripod3.position.set(2, 8, 2);
        tripod3.rotation.z = -0.4;
        tripod3.rotation.x = -0.2;
        scene.add(tripod3);
        objects.push(tripod3);

        // Field radio antenna 1 - tall thin cylinder
        var antGeom = new THREE.CylinderGeometry(0.15, 0.15, 18, 8);
        var antMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var ant1 = new THREE.Mesh(antGeom, antMat);
        ant1.position.set(-8, 8, 5);
        ant1.rotation.z = 0.15;
        scene.add(ant1);
        objects.push(ant1);

        // Radio antenna 2
        var ant2 = new THREE.Mesh(antGeom, antMat);
        ant2.position.set(10, 7, 3);
        ant2.rotation.z = 0.2;
        scene.add(ant2);
        objects.push(ant2);

        // Radio antenna 3
        var ant3 = new THREE.Mesh(antGeom, antMat);
        ant3.position.set(-6, 9, -8);
        ant3.rotation.z = 0.1;
        scene.add(ant3);
        objects.push(ant3);

        // Radio antenna 4
        var ant4 = new THREE.Mesh(antGeom, antMat);
        ant4.position.set(7, 6, -6);
        ant4.rotation.z = 0.25;
        scene.add(ant4);
        objects.push(ant4);

        // Radio antenna base box
        var antBaseGeom = new THREE.BoxGeometry(6, 1, 6);
        var antBaseMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var antBase = new THREE.Mesh(antBaseGeom, antBaseMat);
        antBase.position.set(1, 5.5, 0);
        scene.add(antBase);
        objects.push(antBase);

        // Camouflage net frame - elevated on posts
        // Support posts
        var postGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 10);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var post1 = new THREE.Mesh(postGeom, postMat);
        post1.position.set(-15, 3, -12);
        scene.add(post1);
        objects.push(post1);

        var post2 = new THREE.Mesh(postGeom, postMat);
        post2.position.set(15, 3, -12);
        scene.add(post2);
        objects.push(post2);

        var post3 = new THREE.Mesh(postGeom, postMat);
        post3.position.set(-15, 3, 12);
        scene.add(post3);
        objects.push(post3);

        var post4 = new THREE.Mesh(postGeom, postMat);
        post4.position.set(15, 3, 12);
        scene.add(post4);
        objects.push(post4);

        // Camouflage net grid frame using LineSegments
        var netGeom = new THREE.BufferGeometry();
        var netVertices = [];
        var gridSpacing = 3;
        var gridWidth = 30;
        var gridDepth = 24;
        var netHeight = 7;

        for (var x = -gridWidth; x <= gridWidth; x += gridSpacing) {
            netVertices.push(x, netHeight, -gridDepth);
            netVertices.push(x, netHeight, gridDepth);
        }

        for (var z = -gridDepth; z <= gridDepth; z += gridSpacing) {
            netVertices.push(-gridWidth, netHeight, z);
            netVertices.push(gridWidth, netHeight, z);
        }

        netGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(netVertices), 3));
        var netMat = new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 1 });
        var netFrame = new THREE.LineSegments(netGeom, netMat);
        scene.add(netFrame);
        objects.push(netFrame);

        // Lookout cone - upright cone on bunker roof
        var coneGeom = new THREE.ConeGeometry(1.5, 2.5, 16);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(0, 15, -3);
        scene.add(cone);
        objects.push(cone);

        // Ambient light
        var ambLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambLight);
        lights.push(ambLight);

        // Directional light (sun)
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 40, 20);
        dirLight.target.position.set(0, 0, 0);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Optional animation can be added here
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
