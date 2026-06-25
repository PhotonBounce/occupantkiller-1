window.ScarpCamp = (function() {
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
        var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
        var darkGrayMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var brownMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var greenMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c3c });
        var redMaterial = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
        var beigeMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        var blackMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var grayMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

        var chalkCliff = new THREE.Mesh(new THREE.BoxGeometry(40, 50, 15), whiteMaterial);
        chalkCliff.position.set(-20, 25, 0);
        scene.add(chalkCliff);
        objects.push(chalkCliff);

        var caveEntranceFrame = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 2), darkGrayMaterial);
        caveEntranceFrame.position.set(-15, 8, 6);
        scene.add(caveEntranceFrame);
        objects.push(caveEntranceFrame);

        var caveOutlineGeom = new THREE.BufferGeometry();
        var caveOutlinePositions = new Float32Array([
            -15, 13, 6, -15, 3, 6,
            -15, 3, 6, -11, 3, 6,
            -11, 3, 6, -11, 13, 6,
            -11, 13, 6, -15, 13, 6
        ]);
        caveOutlineGeom.setAttribute('position', new THREE.BufferAttribute(caveOutlinePositions, 3));
        var caveOutline = new THREE.LineSegments(caveOutlineGeom, new THREE.LineBasicMaterial({ color: 0x555555 }));
        scene.add(caveOutline);
        objects.push(caveOutline);

        var observationPlatform = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 12), brownMaterial);
        observationPlatform.position.set(-10, 52, -5);
        scene.add(observationPlatform);
        objects.push(observationPlatform);

        var platformSupport = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 25, 16), darkGrayMaterial);
        platformSupport.position.set(-15, 38.5, -8);
        scene.add(platformSupport);
        objects.push(platformSupport);

        var beltPost1 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 20, 12), grayMaterial);
        beltPost1.position.set(-5, 15, 8);
        scene.add(beltPost1);
        objects.push(beltPost1);

        var beltPost2 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 20, 12), grayMaterial);
        beltPost2.position.set(5, 15, 8);
        scene.add(beltPost2);
        objects.push(beltPost2);

        var ropeGeom1 = new THREE.BufferGeometry();
        var ropePos1 = new Float32Array([
            -5, 25, 8, -5, 5, 8,
            5, 25, 8, 5, 5, 8,
            -5, 25, 8, 5, 25, 8
        ]);
        ropeGeom1.setAttribute('position', new THREE.BufferAttribute(ropePos1, 3));
        var rope1 = new THREE.LineSegments(ropeGeom1, new THREE.LineBasicMaterial({ color: 0xaa7744, linewidth: 2 }));
        scene.add(rope1);
        objects.push(rope1);

        var rubbleBox1 = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), beigeMaterial);
        rubbleBox1.position.set(12, 3, 5);
        rubbleBox1.rotation.z = 0.3;
        scene.add(rubbleBox1);
        objects.push(rubbleBox1);

        var rubbleSphere1 = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), beigeMaterial);
        rubbleSphere1.position.set(18, 4, 8);
        scene.add(rubbleSphere1);
        objects.push(rubbleSphere1);

        var rubbleSphere2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), beigeMaterial);
        rubbleSphere2.position.set(14, 2, 12);
        scene.add(rubbleSphere2);
        objects.push(rubbleSphere2);

        var netPole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 15, 10), blackMaterial);
        netPole1.position.set(-25, 42, -10);
        scene.add(netPole1);
        objects.push(netPole1);

        var netPole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 15, 10), blackMaterial);
        netPole2.position.set(-5, 42, -12);
        scene.add(netPole2);
        objects.push(netPole2);

        var netGeom = new THREE.BufferGeometry();
        var netPositions = new Float32Array([
            -25, 49.5, -10, -5, 49.5, -12,
            -25, 40, -10, -5, 40, -12,
            -25, 49.5, -10, -5, 40, -12,
            -25, 40, -10, -5, 49.5, -12,
            -25, 45, -10, -5, 45, -12
        ]);
        netGeom.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));
        var camouflageNet = new THREE.LineSegments(netGeom, new THREE.LineBasicMaterial({ color: 0x5a6b4a }));
        scene.add(camouflageNet);
        objects.push(camouflageNet);

        var spikeBase1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), blackMaterial);
        spikeBase1.position.set(-28, 52, -2);
        scene.add(spikeBase1);
        objects.push(spikeBase1);

        var spike1 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4, 8), redMaterial);
        spike1.position.set(-28, 54.5, -2);
        scene.add(spike1);
        objects.push(spike1);

        var spikeBase2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), blackMaterial);
        spikeBase2.position.set(-10, 52, 2);
        scene.add(spikeBase2);
        objects.push(spikeBase2);

        var spike2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4, 8), redMaterial);
        spike2.position.set(-10, 54.5, 2);
        scene.add(spike2);
        objects.push(spike2);

        var ammoBox = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), greenMaterial);
        ammoBox.position.set(-12, 2, -8);
        scene.add(ammoBox);
        objects.push(ammoBox);

        var supplyBox = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 4), brownMaterial);
        supplyBox.position.set(8, 1.5, -10);
        scene.add(supplyBox);
        objects.push(supplyBox);

        var light1 = new THREE.DirectionalLight(0xffffff, 1.2);
        light1.position.set(30, 40, 30);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xcccccc, 0.6);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                if (i % 5 === 0) {
                    objects[i].rotation.y += 0.01 * delta;
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
