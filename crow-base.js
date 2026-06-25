window.CrowBase = (function() {
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
        // Watchtower 1 - tall dark column structure
        var tower1Geom = new THREE.CylinderGeometry(4, 5, 25, 8);
        var tower1Mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var tower1 = new THREE.Mesh(tower1Geom, tower1Mat);
        tower1.position.set(-25, 12.5, -20);
        scene.add(tower1);
        objects.push(tower1);

        // Watchtower 2 - offset position
        var tower2Geom = new THREE.CylinderGeometry(3.5, 4.5, 20, 8);
        var tower2Mat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var tower2 = new THREE.Mesh(tower2Geom, tower2Mat);
        tower2.position.set(22, 10, -25);
        scene.add(tower2);
        objects.push(tower2);

        // Rampart wall - long low structure
        var rampartGeom = new THREE.BoxGeometry(50, 3, 3);
        var rampartMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var rampart = new THREE.Mesh(rampartGeom, rampartMat);
        rampart.position.set(0, 1.5, -30);
        scene.add(rampart);
        objects.push(rampart);

        // Crow perch 1 - sphere for body, cone for head
        var body1Geom = new THREE.SphereGeometry(2.5, 6, 6);
        var bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var body1 = new THREE.Mesh(body1Geom, bodyMat);
        body1.position.set(-15, 15, 10);
        body1.scale.set(1, 0.7, 1.2);
        scene.add(body1);
        objects.push(body1);

        // Crow head 1
        var head1Geom = new THREE.ConeGeometry(1.5, 3, 6);
        var headMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var head1 = new THREE.Mesh(head1Geom, headMat);
        head1.position.set(-15, 19, 10);
        head1.rotation.x = -0.3;
        scene.add(head1);
        objects.push(head1);

        // Crow perch 2 - different position
        var body2Geom = new THREE.SphereGeometry(2.2, 6, 6);
        var body2 = new THREE.Mesh(body2Geom, bodyMat);
        body2.position.set(18, 18, -8);
        body2.scale.set(1, 0.65, 1.1);
        scene.add(body2);
        objects.push(body2);

        // Crow head 2
        var head2Geom = new THREE.ConeGeometry(1.3, 2.8, 6);
        var head2 = new THREE.Mesh(head2Geom, headMat);
        head2.position.set(18, 21.5, -8);
        head2.rotation.x = -0.25;
        scene.add(head2);
        objects.push(head2);

        // Raven nest structure - at peak
        var nestGeom = new THREE.CylinderGeometry(6, 8, 2, 16);
        var nestMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var nest = new THREE.Mesh(nestGeom, nestMat);
        nest.position.set(0, 28, 0);
        scene.add(nest);
        objects.push(nest);

        // Bone 1 - thin cylinder
        var bone1Geom = new THREE.CylinderGeometry(0.6, 0.6, 4, 6);
        var boneMat = new THREE.MeshLambertMaterial({ color: 0xd4af37 });
        var bone1 = new THREE.Mesh(bone1Geom, boneMat);
        bone1.position.set(-10, 3, 5);
        bone1.rotation.z = 0.5;
        scene.add(bone1);
        objects.push(bone1);

        // Bone 2 - scattered debris
        var bone2Geom = new THREE.CylinderGeometry(0.5, 0.5, 3.5, 6);
        var bone2 = new THREE.Mesh(bone2Geom, boneMat);
        bone2.position.set(15, 2, 12);
        bone2.rotation.z = -0.7;
        bone2.rotation.x = 0.3;
        scene.add(bone2);
        objects.push(bone2);

        // Bone 3 - more scattered position
        var bone3Geom = new THREE.CylinderGeometry(0.55, 0.55, 3.8, 6);
        var bone3 = new THREE.Mesh(bone3Geom, boneMat);
        bone3.position.set(8, 2.5, -18);
        bone3.rotation.z = 0.9;
        bone3.rotation.x = -0.2;
        scene.add(bone3);
        objects.push(bone3);

        // Dark pillar 1 - support structure
        var pillar1Geom = new THREE.CylinderGeometry(2, 2.5, 18, 6);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x1f1f1f });
        var pillar1 = new THREE.Mesh(pillar1Geom, pillarMat);
        pillar1.position.set(-18, 9, 18);
        scene.add(pillar1);
        objects.push(pillar1);

        // Dark pillar 2
        var pillar2Geom = new THREE.CylinderGeometry(2.2, 2.2, 16, 6);
        var pillar2 = new THREE.Mesh(pillar2Geom, pillarMat);
        pillar2.position.set(20, 8, 20);
        scene.add(pillar2);
        objects.push(pillar2);

        // Tower beacon box - atop tower 1
        var beaconGeom = new THREE.BoxGeometry(3, 3, 3);
        var beaconMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var beacon = new THREE.Mesh(beaconGeom, beaconMat);
        beacon.position.set(-25, 27, -20);
        scene.add(beacon);
        objects.push(beacon);

        // Central dark structure - sphere with thick walls look
        var centralGeom = new THREE.SphereGeometry(8, 8, 8);
        var centralMat = new THREE.MeshLambertMaterial({ color: 0x121212 });
        var central = new THREE.Mesh(centralGeom, centralMat);
        central.position.set(0, 8, 0);
        scene.add(central);
        objects.push(central);

        // Light 1 - ambient dark glow
        var light1 = new THREE.DirectionalLight(0x404040, 0.6);
        light1.position.set(30, 25, 30);
        scene.add(light1);
        lights.push(light1);

        // Light 2 - slight warm accent from moon
        var light2 = new THREE.DirectionalLight(0x2a2a3a, 0.4);
        light2.position.set(-40, 35, -40);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Gentle animation of crow bodies - subtle bobbing
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.geometry instanceof THREE.SphereGeometry) {
                obj.position.y += Math.sin(Date.now() * 0.001 + i) * 0.02;
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
