window.DuneFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var sandParticles = [];
    var palmSway = [];
    var time = 0;

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function buildDuneField() {
        var sandMat = new THREE.MeshLambertMaterial({ color: 0xD4A35A });
        var sphereGeo = new THREE.SphereGeometry(1.5, 8, 8);
        var boxGeo = new THREE.BoxGeometry(6, 2, 6);

        for (var i = -4; i < 4; i++) {
            for (var j = -4; j < 4; j++) {
                var x = i * 8 + (i % 2) * 3;
                var z = j * 8 + (j % 2) * 2;
                var h = Math.sin(x * 0.1) * 1.5 + Math.cos(z * 0.1) * 1.2 + 0.5;

                addMesh(sphereGeo, sandMat, x, h - 1, z);
                addMesh(boxGeo, sandMat, x + 2, h - 2, z + 3);
            }
        }

        for (var k = 0; k < 12; k++) {
            var rx = Math.random() * 45 - 22.5;
            var rz = Math.random() * 45 - 22.5;
            var rh = 1 + Math.random() * 2;
            addMesh(new THREE.BoxGeometry(5, rh, 5), sandMat, rx, rh / 2 - 1, rz);
        }
    }

    function buildBuriedRuins() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xC8924A });
        var cylinderGeo = new THREE.CylinderGeometry(0.6, 0.7, 4, 16);
        var boxGeo = new THREE.BoxGeometry(5, 0.5, 0.5);
        var sphereGeo = new THREE.SphereGeometry(1.2, 12, 12);

        addMesh(cylinderGeo, stoneMat, -8, 0.5, -8);
        addMesh(cylinderGeo, stoneMat, -5, 0.8, -7);
        addMesh(cylinderGeo, stoneMat, -6, 0.3, -10);

        addMesh(boxGeo, stoneMat, -7, 1.2, -9);
        addMesh(boxGeo, stoneMat, -5, 1.0, -9);

        var sphinx = addMesh(sphereGeo, stoneMat, -6.5, 0.2, -8.5);
        sphinx.scale.set(1.2, 0.9, 1);
    }

    function buildFortWalls() {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0xC8924A });
        var wallGeo = new THREE.BoxGeometry(8, 3, 0.8);

        addMesh(wallGeo, wallMat, 5, 1, 10);
        addMesh(new THREE.BoxGeometry(8, 3.5, 0.8), wallMat, 12, 1.2, 8);
        addMesh(new THREE.BoxGeometry(0.8, 2.8, 8), wallMat, 8, 0.9, 12);
        addMesh(new THREE.BoxGeometry(0.8, 3.2, 8), wallMat, 10, 1.1, 15);

        addMesh(new THREE.BoxGeometry(6, 2.5, 0.8), wallMat, 8, 0.8, 5);
        addMesh(new THREE.BoxGeometry(6, 3, 0.8), wallMat, 12, 1, 12);
    }

    function buildOasis() {
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1A5A3A });
        var waterGeo = new THREE.BoxGeometry(4, 0.3, 4);
        addMesh(waterGeo, waterMat, 0, -0.8, 0);

        var rockMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var rx = Math.cos(angle) * 2.8;
            var rz = Math.sin(angle) * 2.8;
            var rsize = 0.6 + Math.random() * 0.4;
            addMesh(new THREE.BoxGeometry(rsize, rsize * 0.6, rsize), rockMat, rx, -0.6, rz);
        }

        var mudMat = new THREE.MeshLambertMaterial({ color: 0x6B5344 });
        for (var j = 0; j < 8; j++) {
            var mx = (Math.random() - 0.5) * 7;
            var mz = (Math.random() - 0.5) * 7;
            addMesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), mudMat, mx, -0.9, mz);
        }
    }

    function buildPalmTrees() {
        var trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        var frondMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });

        var positions = [
            [-3, 0],
            [-1, 2],
            [1.5, -1],
            [3, 1],
            [-2.5, -2.5],
            [2, -2.8],
            [-4, 4],
            [4, -4]
        ];

        for (var p = 0; p < positions.length; p++) {
            var px = positions[p][0];
            var pz = positions[p][1];

            var trunk = addMesh(new THREE.CylinderGeometry(0.3, 0.35, 3, 12), trunkMat, px, 0.5, pz);
            trunk.rotation.z = (Math.random() - 0.5) * 0.15;
            palmSway.push({ mesh: trunk, angle: Math.random() * Math.PI * 2 });

            for (var f = 0; f < 5; f++) {
                var fa = (f / 5) * Math.PI * 2;
                var fx = px + Math.cos(fa) * 0.4;
                var fz = pz + Math.sin(fa) * 0.4;
                var frond = addMesh(new THREE.BoxGeometry(0.3, 0.8, 2), frondMat, fx, 2.2, fz);
                frond.rotation.z = fa + Math.PI / 2;
                palmSway.push({ mesh: frond, angle: fa, baseAngle: frond.rotation.z });
            }
        }
    }

    function buildSandstormEffects() {
        var sandMat = new THREE.MeshLambertMaterial({ color: 0xD4A35A });
        var particleGeo = new THREE.SphereGeometry(0.2, 6, 6);

        for (var i = 0; i < 80; i++) {
            var px = (Math.random() - 0.5) * 60;
            var py = Math.random() * 12 - 2;
            var pz = (Math.random() - 0.5) * 60;

            var particle = addMesh(particleGeo, sandMat, px, py, pz);
            sandParticles.push({
                mesh: particle,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.3) * 0.3,
                baseY: py,
                driftRange: 0.3 + Math.random() * 0.7
            });
        }
    }

    function buildMilitaryPost() {
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0xC8924A });
        var bunker = addMesh(new THREE.BoxGeometry(4, 1.5, 4), bunkerMat, 15, 0.2, -10);

        var antennaMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var antenna = addMesh(new THREE.CylinderGeometry(0.1, 0.1, 3.5, 8), antennaMat, 15.5, 2.5, -10);

        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x9B8B7E });
        addMesh(new THREE.BoxGeometry(2, 0.5, 0.4), sandbagMat, 14, 1, -11.5);
        addMesh(new THREE.BoxGeometry(2, 0.5, 0.4), sandbagMat, 16, 1, -11.5);
        addMesh(new THREE.BoxGeometry(0.4, 0.5, 2), sandbagMat, 13.5, 1, -10);
        addMesh(new THREE.BoxGeometry(0.4, 0.5, 2), sandbagMat, 16.5, 1, -10);
    }

    function buildCaravanWreck() {
        var cartMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var cargoMat = new THREE.MeshLambertMaterial({ color: 0xD4A35A });
        var boneMat = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });

        addMesh(new THREE.BoxGeometry(2, 1, 2.5), cartMat, -15, 0.2, 12).rotation.z = 0.4;
        addMesh(new THREE.BoxGeometry(2, 1, 2.5), cartMat, -12, 0.3, 13).rotation.z = -0.35;
        addMesh(new THREE.BoxGeometry(2, 1, 2.5), cartMat, -13.5, 0.25, 10.5).rotation.z = 0.5;

        for (var c = 0; c < 10; c++) {
            var cx = -15 + Math.random() * 5;
            var cz = 10 + Math.random() * 5;
            addMesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), cargoMat, cx, 0.5, cz);
        }

        var camelBone = addMesh(new THREE.CylinderGeometry(0.25, 0.2, 2, 8), boneMat, -14, 0.5, 11.5);
        camelBone.rotation.z = 0.6;
        addMesh(new THREE.SphereGeometry(0.4, 8, 8), boneMat, -14.5, 0.8, 11);
        addMesh(new THREE.SphereGeometry(0.35, 8, 8), boneMat, -13.5, 0.9, 11.8);
    }

    function setupLighting() {
        var sunLight = new THREE.DirectionalLight(0xFFE5B4, 1.3);
        sunLight.position.set(20, 25, 20);
        sunLight.castShadow = true;
        addLight(sunLight);

        var ambient = new THREE.AmbientLight(0x8B7A40, 0.6);
        addLight(ambient);

        var oasisLight = new THREE.PointLight(0x4A90E2, 0.8, 15);
        oasisLight.position.set(0, 2, 0);
        addLight(oasisLight);

        var fireLight = new THREE.PointLight(0xFF8C00, 0.4, 12);
        fireLight.position.set(15, 1.5, -10);
        addLight(fireLight);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        sandParticles = [];
        palmSway = [];
        time = 0;

        buildDuneField();
        buildBuriedRuins();
        buildFortWalls();
        buildOasis();
        buildPalmTrees();
        buildSandstormEffects();
        buildMilitaryPost();
        buildCaravanWreck();
        setupLighting();
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < sandParticles.length; i++) {
            var sp = sandParticles[i];
            sp.mesh.position.x += sp.vx * 3 * delta;
            sp.mesh.position.y = sp.baseY + Math.sin(time * 1.5 + sp.driftRange) * 0.8;

            if (sp.mesh.position.x > 35) sp.mesh.position.x = -35;
            if (sp.mesh.position.x < -35) sp.mesh.position.x = 35;
        }

        for (var j = 0; j < palmSway.length; j++) {
            var ps = palmSway[j];
            if (ps.baseAngle !== undefined) {
                ps.mesh.rotation.z = ps.baseAngle + Math.sin(time * 1.2 + ps.angle) * 0.03;
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
        sandParticles = [];
        palmSway = [];
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
