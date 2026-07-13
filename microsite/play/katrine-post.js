window.KatrinePost = (function() {
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
        // Loch terrain base (highland box)
        var terrainGeom = new THREE.BoxGeometry(80, 8, 80);
        var terrainMat = new THREE.MeshLambertMaterial({color: 0x2d5016});
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -5, 0);
        scene.add(terrain);
        objects.push(terrain);

        // SS Sir Walter Scott steamship - hull (main box)
        var hullGeom = new THREE.BoxGeometry(20, 6, 12);
        var hullMat = new THREE.MeshLambertMaterial({color: 0x3a3a3a});
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.set(-25, 2, 10);
        scene.add(hull);
        objects.push(hull);

        // Steamship funnel (cylinder)
        var funnelGeom = new THREE.CylinderGeometry(2, 2.2, 8, 16);
        var funnelMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
        var funnel = new THREE.Mesh(funnelGeom, funnelMat);
        funnel.position.set(-25, 8, 10);
        scene.add(funnel);
        objects.push(funnel);

        // Steamship gun deck (box top)
        var gunDeckGeom = new THREE.BoxGeometry(18, 2, 10);
        var gunDeckMat = new THREE.MeshLambertMaterial({color: 0x4a4a4a});
        var gunDeck = new THREE.Mesh(gunDeckGeom, gunDeckMat);
        gunDeck.position.set(-25, 8, 10);
        scene.add(gunDeck);
        objects.push(gunDeck);

        // Rob Roy cave entrance (box arch)
        var caveGeom = new THREE.BoxGeometry(12, 10, 8);
        var caveMat = new THREE.MeshLambertMaterial({color: 0x4a4a5a});
        var cave = new THREE.Mesh(caveGeom, caveMat);
        cave.position.set(20, 2, -15);
        scene.add(cave);
        objects.push(cave);

        // Cave boulders (spheres)
        var boulderGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var boulderMat = new THREE.MeshLambertMaterial({color: 0x6a6a6a});
        var boulder1 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder1.position.set(22, 0.5, -18);
        scene.add(boulder1);
        objects.push(boulder1);

        var boulder2 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder2.position.set(18, 1, -12);
        scene.add(boulder2);
        objects.push(boulder2);

        var boulder3 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder3.position.set(25, 0.8, -20);
        scene.add(boulder3);
        objects.push(boulder3);

        // Cattle drovers road waymark (box post)
        var waymarkGeom = new THREE.BoxGeometry(1.5, 4, 1.5);
        var waymarkMat = new THREE.MeshLambertMaterial({color: 0x8b7355});
        var waymark = new THREE.Mesh(waymarkGeom, waymarkMat);
        waymark.position.set(0, 2, -22);
        scene.add(waymark);
        objects.push(waymark);

        // Sandbag flanks left (box)
        var sandbagLeftGeom = new THREE.BoxGeometry(4, 2, 6);
        var sandbagMat = new THREE.MeshLambertMaterial({color: 0xa0876b});
        var sandbagLeft = new THREE.Mesh(sandbagLeftGeom, sandbagMat);
        sandbagLeft.position.set(-4, 1, -24);
        scene.add(sandbagLeft);
        objects.push(sandbagLeft);

        // Sandbag flanks right (box)
        var sandbagRightGeom = new THREE.BoxGeometry(4, 2, 6);
        var sandbagRight = new THREE.Mesh(sandbagRightGeom, sandbagMat);
        sandbagRight.position.set(4, 1, -24);
        scene.add(sandbagRight);
        objects.push(sandbagRight);

        // Aqueduct water tunnel entrance (cylinder)
        var tunnelGeom = new THREE.CylinderGeometry(3, 3, 6, 16);
        var tunnelMat = new THREE.MeshLambertMaterial({color: 0x5a5a7a});
        var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnel.rotation.z = Math.PI / 2;
        tunnel.position.set(-20, 4, 22);
        scene.add(tunnel);
        objects.push(tunnel);

        // Pump house (box)
        var pumpGeom = new THREE.BoxGeometry(8, 6, 6);
        var pumpMat = new THREE.MeshLambertMaterial({color: 0x6b5b4a});
        var pump = new THREE.Mesh(pumpGeom, pumpMat);
        pump.position.set(-14, 3, 25);
        scene.add(pump);
        objects.push(pump);

        // Victorian toll gate (box)
        var gateGeom = new THREE.BoxGeometry(10, 3, 1);
        var gateMat = new THREE.MeshLambertMaterial({color: 0x8b6f47});
        var gate = new THREE.Mesh(gateGeom, gateMat);
        gate.position.set(28, 2, 0);
        scene.add(gate);
        objects.push(gate);

        // Toll gate pillar (cylinder)
        var pillarGeom = new THREE.CylinderGeometry(1, 1.2, 5, 12);
        var pillarMat = new THREE.MeshLambertMaterial({color: 0x7a7a8a});
        var pillar = new THREE.Mesh(pillarGeom, pillarMat);
        pillar.position.set(33, 2.5, 0);
        scene.add(pillar);
        objects.push(pillar);

        // Heather camouflage netting (LineSegments net)
        var netGeom = new THREE.BufferGeometry();
        var netPositions = [];
        var gridSize = 8;
        var gridSpacing = 3;
        for (var i = 0; i <= gridSize; i++) {
            for (var j = 0; j <= gridSize; j++) {
                netPositions.push(-12 + i * gridSpacing, 5, -8 + j * gridSpacing);
            }
        }
        for (var i = 0; i < gridSize; i++) {
            for (var j = 0; j < gridSize; j++) {
                var idx1 = i * (gridSize + 1) + j;
                var idx2 = i * (gridSize + 1) + (j + 1);
                var idx3 = (i + 1) * (gridSize + 1) + j;
                var idx4 = (i + 1) * (gridSize + 1) + (j + 1);
            }
        }
        for (var i = 0; i < gridSize * (gridSize + 1); i++) {
            netPositions.push(netPositions[i * 3], netPositions[i * 3 + 1], netPositions[i * 3 + 2]);
            netPositions.push(netPositions[(i + 1) * 3], netPositions[(i + 1) * 3 + 1], netPositions[(i + 1) * 3 + 2]);
        }
        netGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(netPositions), 3));
        var netMat = new THREE.LineBasicMaterial({color: 0x5a7a4a, linewidth: 1});
        var net = new THREE.LineSegments(netGeom, netMat);
        net.position.set(0, 0, 0);
        scene.add(net);
        objects.push(net);

        // Underwater depth charges (spheres)
        var chargeGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var chargeMat = new THREE.MeshLambertMaterial({color: 0x3a3a5a});
        var charge1 = new THREE.Mesh(chargeGeom, chargeMat);
        charge1.position.set(-10, -8, 18);
        scene.add(charge1);
        objects.push(charge1);

        var charge2 = new THREE.Mesh(chargeGeom, chargeMat);
        charge2.position.set(-5, -10, 20);
        scene.add(charge2);
        objects.push(charge2);

        // Depth charge storage rack (cylinder)
        var rackGeom = new THREE.CylinderGeometry(2.5, 2.5, 10, 12);
        var rackMat = new THREE.MeshLambertMaterial({color: 0x4a4a6a});
        var rack = new THREE.Mesh(rackGeom, rackMat);
        rack.position.set(-8, -6, 22);
        scene.add(rack);
        objects.push(rack);

        // Watch tower (cone)
        var towerGeom = new THREE.ConeGeometry(2.5, 8, 8);
        var towerMat = new THREE.MeshLambertMaterial({color: 0x7a6a5a});
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(15, 4, 5);
        scene.add(tower);
        objects.push(tower);

        // Ammunition store (box)
        var ammoGeom = new THREE.BoxGeometry(6, 4, 5);
        var ammoMat = new THREE.MeshLambertMaterial({color: 0x5a5a4a});
        var ammo = new THREE.Mesh(ammoGeom, ammoMat);
        ammo.position.set(-5, 2, 8);
        scene.add(ammo);
        objects.push(ammo);

        // Highland hut shelter (box)
        var hutGeom = new THREE.BoxGeometry(5, 3, 4);
        var hutMat = new THREE.MeshLambertMaterial({color: 0x6a5a4a});
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(8, 1.5, -5);
        scene.add(hut);
        objects.push(hut);

        // Reinforced observation post (box)
        var obsGeom = new THREE.BoxGeometry(4, 4, 4);
        var obsMat = new THREE.MeshLambertMaterial({color: 0x4a5a6a});
        var obs = new THREE.Mesh(obsGeom, obsMat);
        obs.position.set(-15, 2, -8);
        scene.add(obs);
        objects.push(obs);

        // Lighting
        var ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate objects here if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i] && objects[i].rotation) {
                objects[i].rotation.x += delta * 0.05;
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
