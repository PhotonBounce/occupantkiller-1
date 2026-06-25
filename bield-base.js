window.BieldBase = (function() {
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
        var i;

        // L-shaped wind-break bield wall 1 (north side)
        var wall1Geom = new THREE.BoxGeometry(60, 8, 4);
        var wall1Mat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var wall1 = new THREE.Mesh(wall1Geom, wall1Mat);
        wall1.position.set(-5, 4, -35);
        scene.add(wall1);
        objects.push(wall1);

        // L-shaped wind-break bield wall 2 (east side)
        var wall2Geom = new THREE.BoxGeometry(4, 8, 50);
        var wall2Mat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var wall2 = new THREE.Mesh(wall2Geom, wall2Mat);
        wall2.position.set(28, 4, -5);
        scene.add(wall2);
        objects.push(wall2);

        // Central fire pit stone ring (cylinder base)
        var ringGeom = new THREE.CylinderGeometry(12, 12, 2, 16);
        var ringMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.set(5, 2, 5);
        scene.add(ring);
        objects.push(ring);

        // Fire pit ember glow (sphere at center)
        var emberGeom = new THREE.SphereGeometry(3, 8, 8);
        var emberMat = new THREE.MeshLambertMaterial({ color: 0xff6b35, emissive: 0xcc3300 });
        var ember = new THREE.Mesh(emberGeom, emberMat);
        ember.position.set(5, 3, 5);
        scene.add(ember);
        objects.push(ember);

        // Hidden weapons rack frame (box uprights)
        var rackFrame1Geom = new THREE.BoxGeometry(2, 16, 2);
        var rackFrameMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var rackFrame1 = new THREE.Mesh(rackFrame1Geom, rackFrameMat);
        rackFrame1.position.set(-25, 8, -15);
        scene.add(rackFrame1);
        objects.push(rackFrame1);

        var rackFrame2Geom = new THREE.BoxGeometry(2, 16, 2);
        var rackFrame2 = new THREE.Mesh(rackFrame2Geom, rackFrameMat);
        rackFrame2.position.set(-15, 8, -15);
        scene.add(rackFrame2);
        objects.push(rackFrame2);

        // Weapons rack horizontal supports (box crosspieces)
        var rackSupport1Geom = new THREE.BoxGeometry(12, 1, 2);
        var rackSupport1 = new THREE.Mesh(rackSupport1Geom, rackFrameMat);
        rackSupport1.position.set(-20, 6, -15);
        scene.add(rackSupport1);
        objects.push(rackSupport1);

        var rackSupport2Geom = new THREE.BoxGeometry(12, 1, 2);
        var rackSupport2 = new THREE.Mesh(rackSupport2Geom, rackFrameMat);
        rackSupport2.position.set(-20, 10, -15);
        scene.add(rackSupport2);
        objects.push(rackSupport2);

        // Weapons rack LineSegments supports
        var rackLinesGeom = new THREE.BufferGeometry();
        var rackLinesPositions = new Float32Array([
            -25, 8, -15,  -15, 8, -15,
            -25, 12, -15,  -15, 12, -15,
            -25, 6, -15,  -15, 6, -15
        ]);
        rackLinesGeom.setAttribute('position', new THREE.BufferAttribute(rackLinesPositions, 3));
        var rackLinesMat = new THREE.LineBasicMaterial({ color: 0x555555 });
        var rackLines = new THREE.LineSegments(rackLinesGeom, rackLinesMat);
        scene.add(rackLines);
        objects.push(rackLines);

        // Emergency supply drop pod (sphere capsule)
        var podGeom = new THREE.SphereGeometry(5, 8, 8);
        var podMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var pod = new THREE.Mesh(podGeom, podMat);
        pod.position.set(20, 5, 25);
        scene.add(pod);
        objects.push(pod);

        // Parachute cone above pod
        var chuteGeom = new THREE.ConeGeometry(8, 6, 8);
        var chuteMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        var chute = new THREE.Mesh(chuteGeom, chuteMat);
        chute.position.set(20, 14, 25);
        scene.add(chute);
        objects.push(chute);

        // Communication mast (tall cylinder)
        var mastGeom = new THREE.CylinderGeometry(2, 2, 40, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-35, 20, 15);
        scene.add(mast);
        objects.push(mast);

        // Communication crossarms (box horizontal)
        var crossarm1Geom = new THREE.BoxGeometry(12, 1, 1);
        var crossarmMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var crossarm1 = new THREE.Mesh(crossarm1Geom, crossarmMat);
        crossarm1.position.set(-35, 30, 15);
        scene.add(crossarm1);
        objects.push(crossarm1);

        var crossarm2Geom = new THREE.BoxGeometry(1, 1, 12);
        var crossarm2 = new THREE.Mesh(crossarm2Geom, crossarmMat);
        crossarm2.position.set(-35, 28, 15);
        scene.add(crossarm2);
        objects.push(crossarm2);

        // Communication guy wires (LineSegments)
        var guyLinesGeom = new THREE.BufferGeometry();
        var guyLinesPositions = new Float32Array([
            -35, 32, 15,  -45, 15, 15,
            -35, 32, 15,  -25, 15, 15,
            -35, 32, 15,  -35, 15, 5,
            -35, 32, 15,  -35, 15, 25
        ]);
        guyLinesGeom.setAttribute('position', new THREE.BufferAttribute(guyLinesPositions, 3));
        var guyLinesMat = new THREE.LineBasicMaterial({ color: 0x999999 });
        var guyLines = new THREE.LineSegments(guyLinesGeom, guyLinesMat);
        scene.add(guyLines);
        objects.push(guyLines);

        // Frozen water supply tank (cylinder)
        var tankGeom = new THREE.CylinderGeometry(6, 6, 8, 12);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(15, 4, -25);
        scene.add(tank);
        objects.push(tank);

        // Crow's nest lookout platform (box platform)
        var platformGeom = new THREE.BoxGeometry(10, 2, 10);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(-10, 30, 20);
        scene.add(platform);
        objects.push(platform);

        // Lookout pole (tall cylinder support)
        var poleGeom = new THREE.CylinderGeometry(1.5, 1.5, 28, 8);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(-10, 15, 20);
        scene.add(pole);
        objects.push(pole);

        // Lookout railing (LineSegments box outline)
        var railGeom = new THREE.BufferGeometry();
        var railPositions = new Float32Array([
            -15, 31, 15,  -5, 31, 15,
            -5, 31, 15,  -5, 31, 25,
            -5, 31, 25,  -15, 31, 25,
            -15, 31, 25,  -15, 31, 15
        ]);
        railGeom.setAttribute('position', new THREE.BufferAttribute(railPositions, 3));
        var railMat = new THREE.LineBasicMaterial({ color: 0x8b7355 });
        var rail = new THREE.LineSegments(railGeom, railMat);
        scene.add(rail);
        objects.push(rail);

        // Additional bield wall reinforcement (box corner)
        var reinforceGeom = new THREE.BoxGeometry(4, 8, 4);
        var reinforceMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var reinforce = new THREE.Mesh(reinforceGeom, reinforceMat);
        reinforce.position.set(28, 4, -35);
        scene.add(reinforce);
        objects.push(reinforce);

        // Lighting: main fire pit light
        var fireLight = new THREE.PointLight(0xff6b35, 1.5, 50);
        fireLight.position.set(5, 6, 5);
        scene.add(fireLight);
        lights.push(fireLight);

        // Lighting: ambient glow for base
        var ambientLight = new THREE.AmbientLight(0x8b8680, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        var i;
        // Animate fire pit ember glow
        if (objects.length > 3) {
            objects[3].rotation.z += delta * 0.3;
            var scale = 1 + 0.2 * Math.sin(Date.now() * 0.003);
            objects[3].scale.set(scale, scale, scale);
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
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
