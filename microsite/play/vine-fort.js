window.VineFort = (function() {
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
        // Main fortress walls - collapsed stone blocks
        var wall1Geom = new THREE.BoxGeometry(40, 8, 4);
        var wall1Mat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var wall1 = new THREE.Mesh(wall1Geom, wall1Mat);
        wall1.position.set(-10, 4, 15);
        wall1.rotation.z = 0.1;
        scene.add(wall1);
        objects.push(wall1);

        var wall2Geom = new THREE.BoxGeometry(8, 12, 4);
        var wall2Mat = new THREE.MeshLambertMaterial({ color: 0x9B8365 });
        var wall2 = new THREE.Mesh(wall2Geom, wall2Mat);
        wall2.position.set(20, 6, 5);
        scene.add(wall2);
        objects.push(wall2);

        var wall3Geom = new THREE.BoxGeometry(35, 6, 4);
        var wall3Mat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var wall3 = new THREE.Mesh(wall3Geom, wall3Mat);
        wall3.position.set(5, 3, -20);
        wall3.rotation.z = -0.15;
        scene.add(wall3);
        objects.push(wall3);

        // Vine trunks wrapping fortress walls - cylinders
        var vine1Geom = new THREE.CylinderGeometry(1.2, 1.5, 25, 8);
        var vine1Mat = new THREE.MeshLambertMaterial({ color: 0x3D5C3D });
        var vine1 = new THREE.Mesh(vine1Geom, vine1Mat);
        vine1.position.set(-15, 12, 15);
        vine1.rotation.z = 0.3;
        scene.add(vine1);
        objects.push(vine1);

        var vine2Geom = new THREE.CylinderGeometry(0.8, 1.0, 20, 8);
        var vine2Mat = new THREE.MeshLambertMaterial({ color: 0x4A6B4A });
        var vine2 = new THREE.Mesh(vine2Geom, vine2Mat);
        vine2.position.set(10, 10, 8);
        vine2.rotation.z = 0.4;
        scene.add(vine2);
        objects.push(vine2);

        var vine3Geom = new THREE.CylinderGeometry(1.0, 1.3, 18, 8);
        var vine3Mat = new THREE.MeshLambertMaterial({ color: 0x5C7C5C });
        var vine3 = new THREE.Mesh(vine3Geom, vine3Mat);
        vine3.position.set(-5, 8, -18);
        vine3.rotation.z = 0.25;
        scene.add(vine3);
        objects.push(vine3);

        // Collapsed towers - tall boxes and cylinders
        var tower1Geom = new THREE.BoxGeometry(6, 20, 6);
        var tower1Mat = new THREE.MeshLambertMaterial({ color: 0x9A8C7C });
        var tower1 = new THREE.Mesh(tower1Geom, tower1Mat);
        tower1.position.set(-25, 10, -15);
        tower1.rotation.z = 0.3;
        scene.add(tower1);
        objects.push(tower1);

        var tower2Geom = new THREE.CylinderGeometry(3.5, 4, 18, 8);
        var tower2Mat = new THREE.MeshLambertMaterial({ color: 0x8B7D6D });
        var tower2 = new THREE.Mesh(tower2Geom, tower2Mat);
        tower2.position.set(22, 9, -22);
        tower2.rotation.z = 0.4;
        scene.add(tower2);
        objects.push(tower2);

        // Vine-draped archways using LineSegments
        var archGeom = new THREE.BufferGeometry();
        var archVertices = new Float32Array([
            -8, 5, 10,  8, 5, 10,
            -8, 5, 10,  -6, 10, 10,
            8, 5, 10,  6, 10, 10,
            -6, 10, 10,  6, 10, 10,
            -8, 5, 10,  -5, 0, 10,
            8, 5, 10,  5, 0, 10
        ]);
        archGeom.setAttribute('position', new THREE.BufferAttribute(archVertices, 3));
        var archMat = new THREE.LineBasicMaterial({ color: 0x4A7C4A, linewidth: 3 });
        var archLine = new THREE.LineSegments(archGeom, archMat);
        archLine.position.set(0, 0, 0);
        scene.add(archLine);
        objects.push(archLine);

        // Hidden gun positions - cone shapes
        var gun1Geom = new THREE.ConeGeometry(2, 3, 8);
        var gun1Mat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var gun1 = new THREE.Mesh(gun1Geom, gun1Mat);
        gun1.position.set(-20, 8, 5);
        gun1.rotation.x = -0.5;
        scene.add(gun1);
        objects.push(gun1);

        var gun2Geom = new THREE.ConeGeometry(1.8, 2.5, 8);
        var gun2Mat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var gun2 = new THREE.Mesh(gun2Geom, gun2Mat);
        gun2.position.set(15, 10, 12);
        gun2.rotation.x = -0.6;
        scene.add(gun2);
        objects.push(gun2);

        // Tangled undergrowth - sphere clusters
        var scrub1Geom = new THREE.SphereGeometry(2.5, 6, 6);
        var scrub1Mat = new THREE.MeshLambertMaterial({ color: 0x6B8E3C });
        var scrub1 = new THREE.Mesh(scrub1Geom, scrub1Mat);
        scrub1.position.set(-30, 1.5, -10);
        scene.add(scrub1);
        objects.push(scrub1);

        var scrub2Geom = new THREE.SphereGeometry(2.2, 6, 6);
        var scrub2Mat = new THREE.MeshLambertMaterial({ color: 0x7A9D4C });
        var scrub2 = new THREE.Mesh(scrub2Geom, scrub2Mat);
        scrub2.position.set(28, 1.2, 25);
        scene.add(scrub2);
        objects.push(scrub2);

        var scrub3Geom = new THREE.SphereGeometry(2.0, 6, 6);
        var scrub3Mat = new THREE.MeshLambertMaterial({ color: 0x5C7C3C });
        var scrub3 = new THREE.Mesh(scrub3Geom, scrub3Mat);
        scrub3.position.set(-8, 1.0, -28);
        scene.add(scrub3);
        objects.push(scrub3);

        // Overgrown debris - mixed boxes and cylinders
        var debris1Geom = new THREE.BoxGeometry(4, 3, 8);
        var debris1Mat = new THREE.MeshLambertMaterial({ color: 0x7C6C5C });
        var debris1 = new THREE.Mesh(debris1Geom, debris1Mat);
        debris1.position.set(5, 1.5, 20);
        debris1.rotation.z = 0.7;
        scene.add(debris1);
        objects.push(debris1);

        var debris2Geom = new THREE.CylinderGeometry(1.5, 2, 12, 8);
        var debris2Mat = new THREE.MeshLambertMaterial({ color: 0x8C7C6C });
        var debris2 = new THREE.Mesh(debris2Geom, debris2Mat);
        debris2.position.set(-22, 2, 8);
        debris2.rotation.z = 0.5;
        scene.add(debris2);
        objects.push(debris2);

        // Lights for fortress ambiance
        var ambientLight = new THREE.AmbientLight(0xFFEECC, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFDD99, 0.8);
        directionalLight.position.set(15, 20, 10);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Gentle swaying for vines
        for (var i = 1; i < 4; i++) {
            if (objects[i]) {
                objects[i].rotation.z += Math.sin(Date.now() * 0.0003 + i) * 0.0005;
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
