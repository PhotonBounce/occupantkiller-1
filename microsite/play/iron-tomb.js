window.IronTomb = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var torchFlames = [];
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

    function buildTombExterior() {
        var darkStone = new THREE.MeshLambertMaterial({color: 0x555544});
        var pyramidSteps = [
            {width: 30, depth: 30, height: 2, y: 0},
            {width: 28, depth: 28, height: 2, y: 2},
            {width: 26, depth: 26, height: 2, y: 4},
            {width: 24, depth: 24, height: 2, y: 6},
            {width: 22, depth: 22, height: 2, y: 8},
            {width: 20, depth: 20, height: 2, y: 10},
            {width: 18, depth: 18, height: 2, y: 12},
            {width: 16, depth: 16, height: 2, y: 14}
        ];
        for (var i = 0; i < pyramidSteps.length; i++) {
            var step = pyramidSteps[i];
            var geo = new THREE.BoxGeometry(step.width, step.height, step.depth);
            addMesh(geo, darkStone, 0, step.y, 0);
        }
    }

    function buildIronCladding() {
        var darkMetal = new THREE.MeshLambertMaterial({color: 0x333322});
        var rivetMat = new THREE.MeshLambertMaterial({color: 0x222211});
        var plateGeo = new THREE.BoxGeometry(29, 1, 29);
        addMesh(plateGeo, darkMetal, 0, 2.5, 0);
        addMesh(plateGeo, darkMetal, 0, 5.5, 0);
        addMesh(plateGeo, darkMetal, 0, 8.5, 0);
        addMesh(plateGeo, darkMetal, 0, 11.5, 0);
        var rivetGeo = new THREE.SphereGeometry(0.15, 4, 4);
        for (var ix = -12; ix <= 12; ix += 3) {
            for (var iz = -12; iz <= 12; iz += 3) {
                addMesh(rivetGeo, rivetMat, ix, 3, iz);
                addMesh(rivetGeo, rivetMat, ix, 6, iz);
                addMesh(rivetGeo, rivetMat, ix, 9, iz);
                addMesh(rivetGeo, rivetMat, ix, 12, iz);
            }
        }
    }

    function buildBurialChambers() {
        var stoneMat = new THREE.MeshLambertMaterial({color: 0x664433});
        var goldMat = new THREE.MeshLambertMaterial({color: 0xDAAA20});
        var chamberGeo = new THREE.BoxGeometry(8, 7, 8);
        var chamber1 = addMesh(chamberGeo, stoneMat, -12, 5, 0);
        var chamber2 = addMesh(chamberGeo, stoneMat, 12, 5, 0);
        var chamber3 = addMesh(chamberGeo, stoneMat, 0, 5, -12);
        var sarcGeo = new THREE.BoxGeometry(5, 2, 8);
        addMesh(sarcGeo, goldMat, -12, 5, 0);
        addMesh(sarcGeo, goldMat, 12, 5, 0);
        addMesh(sarcGeo, goldMat, 0, 5, -12);
        var lidGeo = new THREE.SphereGeometry(2.5, 6, 4);
        addMesh(lidGeo, goldMat, -12, 7, 0);
        addMesh(lidGeo, goldMat, 12, 7, 0);
        addMesh(lidGeo, goldMat, 0, 7, -12);
        var panelGeo = new THREE.BoxGeometry(0.5, 2, 2);
        for (var px = -6; px <= 6; px += 4) {
            addMesh(panelGeo, stoneMat, px + -12, 5, -2);
            addMesh(panelGeo, stoneMat, px + 12, 5, -2);
            addMesh(panelGeo, stoneMat, -2, 5, px + -12);
        }
    }

    function buildMilitaryAdditions() {
        var sandbagMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var crateMat = new THREE.MeshLambertMaterial({color: 0x654321});
        var antennaMat = new THREE.MeshLambertMaterial({color: 0x444433});
        var sandbagGeo = new THREE.BoxGeometry(2, 1.5, 1);
        for (var sx = -8; sx <= 8; sx += 2) {
            addMesh(sandbagGeo, sandbagMat, sx, 16, 0);
            addMesh(sandbagGeo, sandbagMat, sx, 16, -8);
        }
        var mgGeo = new THREE.BoxGeometry(2, 1, 1);
        addMesh(mgGeo, sandbagMat, -6, 16.5, -6);
        addMesh(mgGeo, sandbagMat, 6, 16.5, -6);
        var antennaCyl = new THREE.CylinderGeometry(0.2, 0.2, 6, 6);
        addMesh(antennaCyl, antennaMat, 0, 20, 0);
        var crateGeo = new THREE.BoxGeometry(3, 3, 3);
        addMesh(crateGeo, crateMat, -4, 17, 4);
        addMesh(crateGeo, crateMat, 4, 17, 4);
        addMesh(crateGeo, crateMat, 0, 17, 8);
    }

    function buildTrapCorridor() {
        var wallMat = new THREE.MeshLambertMaterial({color: 0x444433});
        var spikeMat = new THREE.MeshLambertMaterial({color: 0x666655});
        var plateMat = new THREE.MeshLambertMaterial({color: 0x777766});
        var wallGeo = new THREE.BoxGeometry(2, 4, 16);
        addMesh(wallGeo, wallMat, -5, 2, 0);
        addMesh(wallGeo, wallMat, 5, 2, 0);
        var floorGeo = new THREE.BoxGeometry(2, 0.5, 16);
        addMesh(floorGeo, wallMat, -5, 0.25, 0);
        addMesh(floorGeo, wallMat, 5, 0.25, 0);
        var spikeGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
        for (var spx = -12; spx <= 12; spx += 2) {
            addMesh(spikeGeo, spikeMat, -3, 0.5, spx);
            addMesh(spikeGeo, spikeMat, 0, 0.5, spx);
            addMesh(spikeGeo, spikeMat, 3, 0.5, spx);
        }
        var pressGeo = new THREE.BoxGeometry(1.5, 0.2, 1.5);
        for (var ppx = -10; ppx <= 10; ppx += 5) {
            addMesh(pressGeo, plateMat, -1.5, 0.1, ppx);
            addMesh(pressGeo, plateMat, 1.5, 0.1, ppx);
        }
    }

    function buildAncientGuards() {
        var guardMat = new THREE.MeshLambertMaterial({color: 0x555555});
        var weaponMat = new THREE.MeshLambertMaterial({color: 0x444444});
        var torsoGeo = new THREE.BoxGeometry(1.5, 2.5, 1);
        var legsGeo = new THREE.BoxGeometry(1, 2, 0.8);
        var headGeo = new THREE.SphereGeometry(0.6, 6, 6);
        var weaponGeo = new THREE.BoxGeometry(0.4, 3, 0.4);
        var guard1Torso = addMesh(torsoGeo, guardMat, -15, 3, -15);
        var guard1Legs = addMesh(legsGeo, guardMat, -15, 1, -15);
        var guard1Head = addMesh(headGeo, guardMat, -15, 6.5, -15);
        var guard1Weapon = addMesh(weaponGeo, weaponMat, -15.5, 4, -15);
        var guard2Torso = addMesh(torsoGeo, guardMat, 15, 3, -15);
        var guard2Legs = addMesh(legsGeo, guardMat, 15, 1, -15);
        var guard2Head = addMesh(headGeo, guardMat, 15, 6.5, -15);
        var guard2Weapon = addMesh(weaponGeo, weaponMat, 15.5, 4, -15);
        var guard3Torso = addMesh(torsoGeo, guardMat, 0, 3, -18);
        var guard3Legs = addMesh(legsGeo, guardMat, 0, 1, -18);
        var guard3Head = addMesh(headGeo, guardMat, 0, 6.5, -18);
        var guard3Weapon = addMesh(weaponGeo, weaponMat, 0.5, 4, -18);
    }

    function buildTreasureVault() {
        var chestMat = new THREE.MeshLambertMaterial({color: 0xFFD700});
        var columnMat = new THREE.MeshLambertMaterial({color: 0x8B8B7A});
        var beamMat = new THREE.MeshLambertMaterial({color: 0x654321});
        var chestGeo = new THREE.BoxGeometry(2, 1.5, 2);
        var chestPositions = [
            [-4, 1, 6], [-4, 3, 6], [-4, 5, 6],
            [0, 1, 6], [0, 3, 6], [0, 5, 6],
            [4, 1, 6], [4, 3, 6], [4, 5, 6]
        ];
        for (var ci = 0; ci < chestPositions.length; ci++) {
            var pos = chestPositions[ci];
            addMesh(chestGeo, chestMat, pos[0], pos[1], pos[2]);
        }
        var colGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        addMesh(colGeo, columnMat, -8, 4, 6);
        addMesh(colGeo, columnMat, 8, 4, 6);
        addMesh(colGeo, columnMat, 0, 4, 2);
        addMesh(colGeo, columnMat, 0, 4, 10);
        var beamGeo = new THREE.BoxGeometry(16, 0.4, 8);
        addMesh(beamGeo, beamMat, 0, 8, 6);
        var ceiling = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -8, 8, 6, 8, 8, 6,
                    -8, 8, 2, 8, 8, 2,
                    -8, 8, 10, 8, 8, 10,
                    -8, 8, 6, 0, 8, 2,
                    8, 8, 6, 0, 8, 10
                ]), 3)
            ),
            new THREE.LineBasicMaterial({color: 0x666633})
        );
        scene.add(ceiling);
        objects.push(ceiling);
    }

    function buildTorchLights() {
        var torchMat = new THREE.MeshLambertMaterial({color: 0x444433});
        var flameMat = new THREE.MeshLambertMaterial({color: 0xFF5500});
        var torchCylGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        var flameGeo = new THREE.SphereGeometry(0.5, 6, 6);
        var torchPositions = [
            [-14, 7, 4], [14, 7, 4], [-14, 7, -4], [14, 7, -4],
            [-4, 7, 14], [4, 7, 14], [-4, 7, -14], [4, 7, -14]
        ];
        for (var ti = 0; ti < torchPositions.length; ti++) {
            var tp = torchPositions[ti];
            var torchCyl = addMesh(torchCylGeo, torchMat, tp[0], tp[1], tp[2]);
            var flame = addMesh(flameGeo, flameMat, tp[0], tp[1] + 1.5, tp[2]);
            torchFlames.push({mesh: flame, phase: ti * 0.785});
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x111108, 0.4);
        addLight(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xFF8833, 0.6);
        directionalLight.position.set(20, 25, 20);
        addLight(directionalLight);
        var torchPositions = [
            [-14, 7, 4], [14, 7, 4], [-14, 7, -4], [14, 7, -4],
            [-4, 7, 14], [4, 7, 14], [-4, 7, -14], [4, 7, -14]
        ];
        for (var tli = 0; tli < torchPositions.length; tli++) {
            var tlp = torchPositions[tli];
            var torchLight = new THREE.PointLight(0xFF8800, 1.2, 12);
            torchLight.position.set(tlp[0], tlp[1] + 1.5, tlp[2]);
            addLight(torchLight);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        torchFlames = [];
        time = 0;
        buildTombExterior();
        buildIronCladding();
        buildBurialChambers();
        buildMilitaryAdditions();
        buildTrapCorridor();
        buildAncientGuards();
        buildTreasureVault();
        buildTorchLights();
        setupLighting();
    }

    function update(delta) {
        time += delta;
        for (var fi = 0; fi < torchFlames.length; fi++) {
            var torch = torchFlames[fi];
            var flameScale = 0.8 + 0.3 * Math.sin(time * 3 + torch.phase);
            torch.mesh.scale.set(flameScale, flameScale, flameScale);
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
        torchFlames = [];
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
