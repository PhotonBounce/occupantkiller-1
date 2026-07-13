window.RebelCamp = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var flames = [];
    var flags = [];
    var time = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        flames = [];
        flags = [];
        time = 0;
        buildTents();
        buildBarricades();
        buildVehicles();
        buildSupplies();
        buildFires();
        buildPerimeter();
        buildCommand();
        buildSniper();
        buildMedical();
        buildJunkyard();
        setupLighting();
    }

    function addMesh(geometry, material, x, y, z, scale, rotation) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        if (scale) {
            mesh.scale.copy(scale);
        }
        if (rotation) {
            if (rotation.x !== undefined) mesh.rotation.x = rotation.x;
            if (rotation.y !== undefined) mesh.rotation.y = rotation.y;
            if (rotation.z !== undefined) mesh.rotation.z = rotation.z;
        }
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addLight(light, x, y, z) {
        light.position.set(x, y, z);
        scene.add(light);
        lights.push(light);
        return light;
    }

    function buildTents() {
        var tan = 0xd4a574;
        var khaki = 0xc9b89b;
        var darkBrown = 0x5a3e25;
        var material1 = new THREE.MeshLambertMaterial({ color: tan });
        var material2 = new THREE.MeshLambertMaterial({ color: khaki });
        var material3 = new THREE.MeshLambertMaterial({ color: darkBrown });

        var positions = [
            { x: 0, z: 0, size: 3, color: 0 },
            { x: 8, z: 5, size: 2.5, color: 1 },
            { x: -8, z: 3, size: 2.2, color: 0 },
            { x: 12, z: -8, size: 2, color: 1 },
            { x: -10, z: -6, size: 2.3, color: 2 },
            { x: 6, z: -10, size: 2.1, color: 0 },
            { x: -5, z: 8, size: 2.4, color: 1 },
            { x: 15, z: 2, size: 1.9, color: 2 },
            { x: -15, z: -3, size: 2, color: 0 },
            { x: 3, z: 12, size: 2.2, color: 1 },
            { x: -12, z: 10, size: 2.1, color: 2 },
            { x: 18, z: 10, size: 1.8, color: 0 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var mat = pos.color === 0 ? material1 : (pos.color === 1 ? material2 : material3);
            var size = pos.size;
            var h = size * 1.2;

            var baseGeo = new THREE.BoxGeometry(size * 2, h * 0.4, size * 2);
            addMesh(baseGeo, mat, pos.x, h * 0.2, pos.z);

            var roofGeo = new THREE.ConeGeometry(size, h * 0.6, 8);
            var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
            addMesh(roofGeo, roofMat, pos.x, h * 0.5, pos.z);
        }
    }

    function buildBarricades() {
        var metalGray = 0x4a4a4a;
        var rustBrown = 0x7a4400;
        var material1 = new THREE.MeshLambertMaterial({ color: metalGray });
        var material2 = new THREE.MeshLambertMaterial({ color: rustBrown });

        var barricades = [
            { x: -20, z: 5, rx: 0.2, ry: 0.3, rz: 0.1 },
            { x: -18, z: 7, rx: -0.15, ry: 0.1, rz: 0.2 },
            { x: -22, z: 3, rx: 0.1, ry: -0.2, rz: 0.15 },
            { x: 20, z: -15, rx: 0.25, ry: 0.15, rz: -0.1 },
            { x: 22, z: -12, rx: -0.1, ry: 0.35, rz: 0.2 },
            { x: 18, z: -17, rx: 0.2, ry: -0.25, rz: 0.05 },
            { x: -5, z: -20, rx: 0.15, ry: 0.1, rz: 0.3 },
            { x: -3, z: -22, rx: 0.05, ry: 0.3, rz: -0.15 },
            { x: 5, z: 25, rx: 0.2, ry: -0.1, rz: 0.1 },
            { x: -8, z: 26, rx: -0.15, ry: 0.25, rz: 0.2 }
        ];

        for (var i = 0; i < barricades.length; i++) {
            var bar = barricades[i];
            var mat = i % 2 === 0 ? material1 : material2;

            var b1 = new THREE.BoxGeometry(1.5, 1, 3);
            var m1 = addMesh(b1, mat, bar.x, 0.5, bar.z);
            m1.rotation.set(bar.rx, bar.ry, bar.rz);

            var b2 = new THREE.BoxGeometry(1, 1.2, 2.5);
            var m2 = addMesh(b2, mat, bar.x + 1.5, 0.6, bar.z + 1);
            m2.rotation.set(-bar.rx, bar.ry + 0.1, bar.rz);

            var b3 = new THREE.BoxGeometry(0.8, 0.9, 2);
            var m3 = addMesh(b3, mat, bar.x - 1.2, 0.45, bar.z - 0.8);
            m3.rotation.set(bar.rx + 0.1, -bar.ry, bar.rz);
        }
    }

    function buildVehicles() {
        var greenMil = 0x4a6b3d;
        var darkGreen = 0x2d4a1f;
        var material1 = new THREE.MeshLambertMaterial({ color: greenMil });
        var material2 = new THREE.MeshLambertMaterial({ color: darkGreen });

        var vehicles = [
            { x: 25, z: 8, ry: 0.5 },
            { x: 28, z: 10, ry: -0.3 },
            { x: -25, z: 15, ry: 1.2 },
            { x: -28, z: 12, ry: 0.1 }
        ];

        for (var i = 0; i < vehicles.length; i++) {
            var v = vehicles[i];
            var mat = i % 2 === 0 ? material1 : material2;

            var hull = new THREE.BoxGeometry(2.5, 1.5, 5);
            var hMesh = addMesh(hull, mat, v.x, 0.8, v.z);
            hMesh.rotation.y = v.ry;

            var cabin = new THREE.BoxGeometry(1.8, 1.2, 2);
            var cMesh = addMesh(cabin, mat, v.x + 0.5, 1.5, v.z - 1.5);
            cMesh.rotation.y = v.ry;

            var wheel1 = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
            var w1 = addMesh(wheel1, material2, v.x - 0.8, 0.5, v.z - 1.2);
            w1.rotation.z = Math.PI / 2;
            w1.rotation.y = v.ry;

            var wheel2 = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
            var w2 = addMesh(wheel2, material2, v.x + 1.8, 0.5, v.z - 1.2);
            w2.rotation.z = Math.PI / 2;
            w2.rotation.y = v.ry;

            var wheel3 = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
            var w3 = addMesh(wheel3, material2, v.x - 0.8, 0.5, v.z + 1.5);
            w3.rotation.z = Math.PI / 2;
            w3.rotation.y = v.ry;

            var wheel4 = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
            var w4 = addMesh(wheel4, material2, v.x + 1.8, 0.5, v.z + 1.5);
            w4.rotation.z = Math.PI / 2;
            w4.rotation.y = v.ry;
        }
    }

    function buildSupplies() {
        var crateColor = 0x8b7355;
        var crateMat = new THREE.MeshLambertMaterial({ color: crateColor });
        var ammoColor = 0x3a3a3a;
        var ammoMat = new THREE.MeshLambertMaterial({ color: ammoColor });

        var crates = [
            { x: 10, z: 15, stack: 3 },
            { x: 12, z: 16, stack: 2 },
            { x: 8, z: 17, stack: 4 },
            { x: 14, z: 18, stack: 2 },
            { x: -10, z: 20, stack: 3 },
            { x: -12, z: 21, stack: 2 },
            { x: -8, z: 22, stack: 3 }
        ];

        for (var i = 0; i < crates.length; i++) {
            var c = crates[i];
            for (var j = 0; j < c.stack; j++) {
                var crateGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
                addMesh(crateGeo, crateMat, c.x + j * 0.1, 0.5 + j * 1, c.z + j * 0.05);
            }
        }

        var ammoStacks = [
            { x: 11, z: 19 },
            { x: -11, z: 23 },
            { x: 9, z: 14 },
            { x: -9, z: 25 }
        ];

        for (var i = 0; i < ammoStacks.length; i++) {
            var a = ammoStacks[i];
            for (var j = 0; j < 5; j++) {
                var ammoGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
                addMesh(ammoGeo, ammoMat, a.x + j * 0.4, 0.6, a.z);
            }
        }
    }

    function buildFires() {
        var fireColor = 0xff6b1a;
        var pitColor = 0x2a2a2a;
        var pitMat = new THREE.MeshLambertMaterial({ color: pitColor });
        var flameMat = new THREE.MeshLambertMaterial({ color: fireColor });

        var fires = [
            { x: 5, z: -5 },
            { x: -5, z: -8 },
            { x: 15, z: 5 },
            { x: -15, z: 0 }
        ];

        for (var i = 0; i < fires.length; i++) {
            var f = fires[i];

            var pitGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
            addMesh(pitGeo, pitMat, f.x, 0.25, f.z);

            var flameGeo1 = new THREE.SphereGeometry(0.4, 8, 8);
            var flame1 = addMesh(flameGeo1, flameMat, f.x - 0.5, 1.2, f.z - 0.3);
            flames.push(flame1);

            var flameGeo2 = new THREE.SphereGeometry(0.35, 8, 8);
            var flame2 = addMesh(flameGeo2, flameMat, f.x + 0.4, 1.4, f.z + 0.2);
            flames.push(flame2);

            var flameGeo3 = new THREE.SphereGeometry(0.38, 8, 8);
            var flame3 = addMesh(flameGeo3, flameMat, f.x + 0.1, 1.5, f.z - 0.4);
            flames.push(flame3);

            var fireLight = new THREE.PointLight(0xffa500, 1.5, 15);
            addLight(fireLight, f.x, 1.5, f.z);

            var benchGeo = new THREE.BoxGeometry(3, 0.4, 0.8);
            addMesh(benchGeo, new THREE.MeshLambertMaterial({ color: 0x5a4a3a }), f.x - 2, 0.8, f.z);
            var benchGeo2 = new THREE.BoxGeometry(3, 0.4, 0.8);
            addMesh(benchGeo2, new THREE.MeshLambertMaterial({ color: 0x5a4a3a }), f.x + 2, 0.8, f.z);
        }
    }

    function buildPerimeter() {
        var postMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var lineColor = 0xcccccc;

        var posts = [
            { x: 30, z: 20 },
            { x: 30, z: -20 },
            { x: -30, z: 20 },
            { x: -30, z: -20 },
            { x: 0, z: 30 },
            { x: 0, z: -30 }
        ];

        for (var i = 0; i < posts.length; i++) {
            var p = posts[i];
            var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
            addMesh(postGeo, postMat, p.x, 1.5, p.z);
        }

        var lineSegments = [
            { x1: 30, z1: 20, x2: 30, z2: -20 },
            { x1: 30, z1: 20, x2: 0, z2: 30 },
            { x1: 30, z1: -20, x2: 0, z2: -30 },
            { x1: -30, z1: 20, x2: -30, z2: -20 },
            { x1: -30, z1: 20, x2: 0, z2: 30 },
            { x1: -30, z1: -20, x2: 0, z2: -30 },
            { x1: 0, z1: 30, x2: 0, z2: -30 }
        ];

        for (var i = 0; i < lineSegments.length; i++) {
            var seg = lineSegments[i];
            var geometry = new THREE.BufferGeometry();
            var positions = new Float32Array([
                seg.x1, 1.2, seg.z1,
                seg.x2, 1.2, seg.z2
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            var material = new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 });
            var line = new THREE.LineSegments(geometry, material);
            scene.add(line);
            objects.push(line);
        }
    }

    function buildCommand() {
        var commandMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var flagMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });

        var baseGeo = new THREE.BoxGeometry(4, 2, 4);
        addMesh(baseGeo, commandMat, 0, 1, 0);

        var roofGeo = new THREE.ConeGeometry(2.5, 2, 8);
        addMesh(roofGeo, new THREE.MeshLambertMaterial({ color: 0x8b4513 }), 0, 3.5, 0);

        var poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
        addMesh(poleGeo, commandMat, 0, 3.5, 0);

        var flagGeo = new THREE.BoxGeometry(1.2, 0.8, 0.1);
        var flag = addMesh(flagGeo, flagMat, 0.5, 5.5, 0);
        flags.push(flag);
    }

    function buildSniper() {
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var stiltMat = new THREE.MeshLambertMaterial({ color: 0x5a3e25 });

        var stilt1 = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
        addMesh(stilt1, stiltMat, -10, 3, -18);

        var stilt2 = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
        addMesh(stilt2, stiltMat, -7, 3, -18);

        var stilt3 = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
        addMesh(stilt3, stiltMat, -10, 3, -15);

        var stilt4 = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
        addMesh(stilt4, stiltMat, -7, 3, -15);

        var platformGeo = new THREE.BoxGeometry(3.5, 0.4, 3.5);
        addMesh(platformGeo, platformMat, -8.5, 6, -16.5);

        var railingGeo = new THREE.BoxGeometry(3.5, 0.8, 0.2);
        addMesh(railingGeo, stiltMat, -8.5, 6.4, -14.5);

        var railingGeo2 = new THREE.BoxGeometry(0.2, 0.8, 3.5);
        addMesh(railingGeo2, stiltMat, -10.2, 6.4, -16.5);
    }

    function buildMedical() {
        var medColor = 0xb8860b;
        var medMat = new THREE.MeshLambertMaterial({ color: medColor });
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });

        var cratePositions = [
            { x: -15, z: -5 },
            { x: -14, z: -5 },
            { x: -13, z: -5 },
            { x: -15, z: -4 },
            { x: -14, z: -4 },
            { x: -13, z: -4 }
        ];

        for (var i = 0; i < cratePositions.length; i++) {
            var cp = cratePositions[i];
            var medCrateGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
            addMesh(medCrateGeo, medMat, cp.x, 0.45, cp.z);
        }

        var barrels = [
            { x: -16, z: -3 },
            { x: -16, z: -5 },
            { x: -12, z: -3 },
            { x: -12, z: -5 }
        ];

        for (var i = 0; i < barrels.length; i++) {
            var b = barrels[i];
            var barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
            addMesh(barrelGeo, barrelMat, b.x, 0.6, b.z);
        }
    }

    function buildJunkyard() {
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var rustMat = new THREE.MeshLambertMaterial({ color: 0x7a3f1f });

        var tireStacks = [
            { x: 25, z: -25 },
            { x: -25, z: -25 },
            { x: 25, z: 25 },
            { x: -25, z: 25 }
        ];

        for (var i = 0; i < tireStacks.length; i++) {
            var ts = tireStacks[i];
            for (var j = 0; j < 4; j++) {
                var tireGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
                var tireMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
                addMesh(tireGeo, tireMat, ts.x, 0.5 + j * 0.5, ts.z);
            }
        }

        var wallBlocks = [
            { x: 28, z: -28 },
            { x: 28, z: -26 },
            { x: 28, z: -24 },
            { x: -28, z: -28 },
            { x: -28, z: -26 },
            { x: -28, z: -24 },
            { x: 28, z: 28 },
            { x: 28, z: 26 },
            { x: -28, z: 28 },
            { x: -28, z: 26 }
        ];

        for (var i = 0; i < wallBlocks.length; i++) {
            var wb = wallBlocks[i];
            var mat = i % 2 === 0 ? metalMat : rustMat;
            var blockGeo = new THREE.BoxGeometry(1.5, 1.5, 0.8);
            addMesh(blockGeo, mat, wb.x, 0.75, wb.z);
        }

        var scrapPiles = [
            { x: 22, z: -22 },
            { x: -22, z: -22 },
            { x: 22, z: 22 },
            { x: -22, z: 22 }
        ];

        for (var i = 0; i < scrapPiles.length; i++) {
            var sp = scrapPiles[i];
            var scrapGeo = new THREE.BoxGeometry(2, 1.5, 2.5);
            addMesh(scrapGeo, rustMat, sp.x, 0.75, sp.z);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
        scene.add(hemisphereLight);
        lights.push(hemisphereLight);
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < flames.length; i++) {
            var flame = flames[i];
            var flicker = 0.9 + Math.sin(time * 8 + i) * 0.15;
            flame.scale.y = flicker;
            var wobble = Math.sin(time * 6 + i * 0.5) * 0.1;
            flame.position.x += wobble * 0.5;
        }

        for (var i = 0; i < flags.length; i++) {
            var flag = flags[i];
            var wave = Math.sin(time * 3 + i) * 0.3;
            flag.rotation.z = wave;
            flag.position.y = 5.5 + Math.sin(time * 2.5 + i) * 0.2;
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
        flames = [];
        flags = [];
        scene = null;
        camera = null;
        time = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
