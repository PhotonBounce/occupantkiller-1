window.LongCamp = (function() {
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
        // Deep sea-loch terrain
        var lochFloor = new THREE.Mesh(
            new THREE.BoxGeometry(100, 5, 80),
            new THREE.MeshLambertMaterial({ color: 0x1a3a52 })
        );
        lochFloor.position.set(0, -15, 0);
        scene.add(lochFloor);
        objects.push(lochFloor);

        // Submarine base pens (concrete boxes)
        var penColor = 0x666666;
        for (var i = 0; i < 3; i++) {
            var penBox = new THREE.Mesh(
                new THREE.BoxGeometry(12, 8, 20),
                new THREE.MeshLambertMaterial({ color: penColor })
            );
            penBox.position.set(-25 + i * 15, -8, -20);
            scene.add(penBox);
            objects.push(penBox);

            // Submarine hull (cylinder)
            var submarine = new THREE.Mesh(
                new THREE.CylinderGeometry(3, 3, 16, 16),
                new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
            );
            submarine.rotation.z = Math.PI / 2;
            submarine.position.set(-25 + i * 15, -8, -20);
            scene.add(submarine);
            objects.push(submarine);
        }

        // Royal Navy torpedo range hut
        var rangeHut = new THREE.Mesh(
            new THREE.BoxGeometry(18, 6, 12),
            new THREE.MeshLambertMaterial({ color: 0x8b4513 })
        );
        rangeHut.position.set(20, -5, 15);
        scene.add(rangeHut);
        objects.push(rangeHut);

        // Torpedo heads (spheres)
        for (var j = 0; j < 4; j++) {
            var torpedo = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 16, 16),
                new THREE.MeshLambertMaterial({ color: 0xff6b35 })
            );
            torpedo.position.set(15 + j * 3, -4, 20);
            scene.add(torpedo);
            objects.push(torpedo);
        }

        // Torpedo tracking cables (LineSegments)
        var cableGeometry = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            15, -4, 20, 15, 8, 20,
            18, -4, 20, 18, 8, 20,
            21, -4, 20, 21, 8, 20,
            24, -4, 20, 24, 8, 20
        ]);
        cableGeometry.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cables = new THREE.LineSegments(
            cableGeometry,
            new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 })
        );
        scene.add(cables);
        objects.push(cables);

        // Coulport nuclear depot perimeter fence sections (boxes)
        var fenceColor = 0x4a4a4a;
        for (var k = 0; k < 6; k++) {
            var fenceSection = new THREE.Mesh(
                new THREE.BoxGeometry(16, 4, 1),
                new THREE.MeshLambertMaterial({ color: fenceColor })
            );
            fenceSection.position.set(-30 + k * 12, 0, 25);
            scene.add(fenceSection);
            objects.push(fenceSection);
        }

        // Guard towers (cones)
        for (var m = 0; m < 4; m++) {
            var tower = new THREE.Mesh(
                new THREE.ConeGeometry(2.5, 10, 8),
                new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
            );
            tower.position.set(-28 + m * 18, 3, 28);
            scene.add(tower);
            objects.push(tower);
        }

        // Hydrofoil patrol craft (box hull)
        var hydrofoilHull = new THREE.Mesh(
            new THREE.BoxGeometry(8, 3, 14),
            new THREE.MeshLambertMaterial({ color: 0x1e90ff })
        );
        hydrofoilHull.position.set(-10, -2, 5);
        scene.add(hydrofoilHull);
        objects.push(hydrofoilHull);

        // Foil struts (cylinders)
        for (var n = 0; n < 2; n++) {
            var foil = new THREE.Mesh(
                new THREE.CylinderGeometry(0.6, 0.6, 6, 8),
                new THREE.MeshLambertMaterial({ color: 0x4169e1 })
            );
            foil.position.set(-12 + n * 4, -5, 5);
            scene.add(foil);
            objects.push(foil);
        }

        // Anti-aircraft Bofors platform (box mount)
        var boforsMount = new THREE.Mesh(
            new THREE.BoxGeometry(5, 2, 5),
            new THREE.MeshLambertMaterial({ color: 0x6b7280 })
        );
        boforsMount.position.set(0, 0, -15);
        scene.add(boforsMount);
        objects.push(boforsMount);

        // Gun barrel (cylinder)
        var gunBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x373737 })
        );
        gunBarrel.rotation.z = Math.PI / 6;
        gunBarrel.position.set(0, 3, -15);
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        // Ammunition loading crane arm (box)
        var craneArm = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 12),
            new THREE.MeshLambertMaterial({ color: 0xcd853f })
        );
        craneArm.position.set(15, 5, -25);
        scene.add(craneArm);
        objects.push(craneArm);

        // Crane counterweight (cylinder)
        var counterweight = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 4, 12),
            new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        );
        counterweight.position.set(10, 5, -25);
        scene.add(counterweight);
        objects.push(counterweight);

        // Loch narrows anti-ship mine barrier (spheres)
        for (var p = 0; p < 5; p++) {
            var mine = new THREE.Mesh(
                new THREE.SphereGeometry(2, 12, 12),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            mine.position.set(-22 + p * 12, -10, 0);
            scene.add(mine);
            objects.push(mine);
        }

        // Mine mooring chains (LineSegments)
        var chainGeometry = new THREE.BufferGeometry();
        var chainPositions = new Float32Array([
            -22, -10, 0, -22, -25, 0,
            -10, -10, 0, -10, -25, 0,
            2, -10, 0, 2, -25, 0,
            14, -10, 0, 14, -25, 0,
            26, -10, 0, 26, -25, 0
        ]);
        chainGeometry.setAttribute('position', new THREE.BufferAttribute(chainPositions, 3));
        var chains = new THREE.LineSegments(
            chainGeometry,
            new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 })
        );
        scene.add(chains);
        objects.push(chains);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 20, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate elements
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                if (i % 7 === 0) {
                    objects[i].rotation.y += delta * 0.3;
                }
                if (i % 5 === 1) {
                    objects[i].position.y += Math.sin(Date.now() * 0.0005 + i) * delta * 0.5;
                }
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var j = 0; j < lights.length; j++) {
            scene.remove(lights[j]);
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
