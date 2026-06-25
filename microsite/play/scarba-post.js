window.ScarbaPost = (function() {
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
        // Terrain - uninhabited island box
        var terrainGeom = new THREE.BoxGeometry(80, 8, 60);
        var terrainMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -10, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Garvellachs monastery ruins - stone walls (boxes)
        var wallGeom1 = new THREE.BoxGeometry(25, 12, 3);
        var wallMat = new THREE.MeshLambertMaterial({color: 0x7A7A7A});
        var wall1 = new THREE.Mesh(wallGeom1, wallMat);
        wall1.position.set(-20, 0, -15);
        scene.add(wall1);
        objects.push(wall1);

        var wallGeom2 = new THREE.BoxGeometry(3, 12, 20);
        var wall2 = new THREE.Mesh(wallGeom2, wallMat);
        wall2.position.set(-32, 0, -5);
        scene.add(wall2);
        objects.push(wall2);

        // Monastery round tower stump (cylinder)
        var towerGeom = new THREE.CylinderGeometry(6, 7, 14, 16);
        var towerMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-15, 0, -20);
        scene.add(tower);
        objects.push(tower);

        // Corryvreckan control station - observation box at cliff edge
        var opBoxGeom = new THREE.BoxGeometry(18, 10, 15);
        var opMat = new THREE.MeshLambertMaterial({color: 0x4A4A4A});
        var opBox = new THREE.Mesh(opBoxGeom, opMat);
        opBox.position.set(25, 2, 20);
        scene.add(opBox);
        objects.push(opBox);

        // Whirlpool acoustic buoys (spheres)
        var buoyGeom = new THREE.SphereGeometry(3, 12, 12);
        var buoyMat = new THREE.MeshLambertMaterial({color: 0xFF6347});
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(35, -2, 28);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(40, -2, 18);
        scene.add(buoy2);
        objects.push(buoy2);

        // Sensor cables (LineSegments)
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            25, 10, 20,
            35, -2, 28,
            25, 10, 20,
            40, -2, 18
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({color: 0x00FF00, linewidth: 2});
        var cables = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Helicopter landing pad - concrete H-pad (box)
        var heliPadGeom = new THREE.BoxGeometry(30, 1, 30);
        var heliMat = new THREE.MeshLambertMaterial({color: 0xA9A9A9});
        var heliPad = new THREE.Mesh(heliPadGeom, heliMat);
        heliPad.position.set(-15, 8, 15);
        scene.add(heliPad);
        objects.push(heliPad);

        // Cone marker lights for helipad
        var markerGeom = new THREE.ConeGeometry(2, 5, 8);
        var markerMat = new THREE.MeshLambertMaterial({color: 0xFFD700});
        var marker1 = new THREE.Mesh(markerGeom, markerMat);
        marker1.position.set(-25, 10, 10);
        scene.add(marker1);
        objects.push(marker1);

        var marker2 = new THREE.Mesh(markerGeom, markerMat);
        marker2.position.set(-5, 10, 10);
        scene.add(marker2);
        objects.push(marker2);

        var marker3 = new THREE.Mesh(markerGeom, markerMat);
        marker3.position.set(-15, 10, 25);
        scene.add(marker3);
        objects.push(marker3);

        // Shepherd's bothie ammo store - stone ruin (box)
        var bothieGeom = new THREE.BoxGeometry(12, 8, 10);
        var bothieMat = new THREE.MeshLambertMaterial({color: 0x8B6F47});
        var bothie = new THREE.Mesh(bothieGeom, bothieMat);
        bothie.position.set(10, -2, -20);
        scene.add(bothie);
        objects.push(bothie);

        // Supply canisters (spheres)
        var canisterGeom = new THREE.SphereGeometry(2.5, 10, 10);
        var canisterMat = new THREE.MeshLambertMaterial({color: 0x228B22});
        var canister1 = new THREE.Mesh(canisterGeom, canisterMat);
        canister1.position.set(5, 0, -22);
        scene.add(canister1);
        objects.push(canister1);

        var canister2 = new THREE.Mesh(canisterGeom, canisterMat);
        canister2.position.set(15, 0, -22);
        scene.add(canister2);
        objects.push(canister2);

        // Hidden submarine recognition site - periscope mock-up (cylinder)
        var periscopeGeom = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        var periscopeMat = new THREE.MeshLambertMaterial({color: 0x2F4F4F});
        var periscope = new THREE.Mesh(periscopeGeom, periscopeMat);
        periscope.position.set(-30, 2, 5);
        scene.add(periscope);
        objects.push(periscope);

        // Signal hut (box)
        var hutGeom = new THREE.BoxGeometry(10, 8, 8);
        var hutMat = new THREE.MeshLambertMaterial({color: 0x8B4513});
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(-35, 0, 8);
        scene.add(hut);
        objects.push(hut);

        // Signal bonfire beacon - platform (box)
        var beaconPlatGeom = new THREE.BoxGeometry(16, 2, 16);
        var beaconMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var beaconPlat = new THREE.Mesh(beaconPlatGeom, beaconMat);
        beaconPlat.position.set(0, 10, -25);
        scene.add(beaconPlat);
        objects.push(beaconPlat);

        // Fire glow spheres on beacon
        var glowGeom = new THREE.SphereGeometry(4, 12, 12);
        var glowMat = new THREE.MeshLambertMaterial({color: 0xFF4500});
        var glow = new THREE.Mesh(glowGeom, glowMat);
        glow.position.set(0, 15, -25);
        scene.add(glow);
        objects.push(glow);

        // Seabird colony camouflage netting - cylinder poles
        var netPoleGeom = new THREE.CylinderGeometry(1, 1, 15, 6);
        var poleMat = new THREE.MeshLambertMaterial({color: 0x36454F});
        var pole1 = new THREE.Mesh(netPoleGeom, poleMat);
        pole1.position.set(20, 0, -10);
        scene.add(pole1);
        objects.push(pole1);

        var pole2 = new THREE.Mesh(netPoleGeom, poleMat);
        pole2.position.set(30, 0, -10);
        scene.add(pole2);
        objects.push(pole2);

        // Netting as LineSegments
        var netGeom = new THREE.BufferGeometry();
        var netPositions = new Float32Array([
            20, 8, -10,
            30, 8, -10,
            20, 8, -10,
            25, 12, -8,
            30, 8, -10,
            25, 12, -8
        ]);
        netGeom.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));
        var netMat = new THREE.LineBasicMaterial({color: 0x708090, linewidth: 1});
        var netting = new THREE.LineSegments(netGeom, netMat);
        scene.add(netting);
        objects.push(netting);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for beacon glow
        var dirLight = new THREE.DirectionalLight(0xFF8C00, 0.8);
        dirLight.position.set(0, 20, -25);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate beacon glow with pulsing effect
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.z === -25 && objects[i].position.y === 15) {
                objects[i].scale.x = 1 + 0.3 * Math.sin(Date.now() * 0.003);
                objects[i].scale.y = 1 + 0.3 * Math.sin(Date.now() * 0.003);
                objects[i].scale.z = 1 + 0.3 * Math.sin(Date.now() * 0.003);
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
