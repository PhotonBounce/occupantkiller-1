window.ArdrishaigDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        // Crinan Canal entrance box terrain
        var terrainGeometry = new THREE.BoxGeometry(40, 2, 50);
        var terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Ardrishaig lock gate left barrier
        var lockGateLeftGeometry = new THREE.BoxGeometry(2, 8, 1);
        var lockGateMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var lockGateLeft = new THREE.Mesh(lockGateLeftGeometry, lockGateMaterial);
        lockGateLeft.position.set(-5, 2, 0);
        scene.add(lockGateLeft);
        objects.push(lockGateLeft);

        // Ardrishaig lock gate right barrier
        var lockGateRightGeometry = new THREE.BoxGeometry(2, 8, 1);
        var lockGateRight = new THREE.Mesh(lockGateRightGeometry, lockGateMaterial);
        lockGateRight.position.set(5, 2, 0);
        scene.add(lockGateRight);
        objects.push(lockGateRight);

        // Lock capstan mechanism left
        var capstanLeftGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
        var capstanMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var capstanLeft = new THREE.Mesh(capstanLeftGeometry, capstanMaterial);
        capstanLeft.position.set(-5, 5, 3);
        scene.add(capstanLeft);
        objects.push(capstanLeft);

        // Lock capstan mechanism right
        var capstanRightGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
        var capstanRight = new THREE.Mesh(capstanRightGeometry, capstanMaterial);
        capstanRight.position.set(5, 5, 3);
        scene.add(capstanRight);
        objects.push(capstanRight);

        // Lock control house
        var controlHouseGeometry = new THREE.BoxGeometry(4, 5, 4);
        var controlHouseMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var controlHouse = new THREE.Mesh(controlHouseGeometry, controlHouseMaterial);
        controlHouse.position.set(0, 3, -8);
        scene.add(controlHouse);
        objects.push(controlHouse);

        // Ferry terminal building
        var terminalGeometry = new THREE.BoxGeometry(8, 6, 10);
        var terminalMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
        terminal.position.set(20, 3, -5);
        scene.add(terminal);
        objects.push(terminal);

        // Ferry hull
        var ferryGeometry = new THREE.BoxGeometry(6, 4, 15);
        var ferryMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var ferry = new THREE.Mesh(ferryGeometry, ferryMaterial);
        ferry.position.set(20, 1, 10);
        scene.add(ferry);
        objects.push(ferry);

        // Mooring bollard left
        var bollardLeftGeometry = new THREE.CylinderGeometry(0.8, 1, 3, 6);
        var bollardMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var bollardLeft = new THREE.Mesh(bollardLeftGeometry, bollardMaterial);
        bollardLeft.position.set(18, 0.5, 12);
        scene.add(bollardLeft);
        objects.push(bollardLeft);

        // Mooring bollard right
        var bollardRightGeometry = new THREE.CylinderGeometry(0.8, 1, 3, 6);
        var bollardRight = new THREE.Mesh(bollardRightGeometry, bollardMaterial);
        bollardRight.position.set(22, 0.5, 12);
        scene.add(bollardRight);
        objects.push(bollardRight);

        // Artillery emplacement concrete box
        var emplacementGeometry = new THREE.BoxGeometry(6, 3, 8);
        var emplacementMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var emplacement = new THREE.Mesh(emplacementGeometry, emplacementMaterial);
        emplacement.position.set(-25, 1, 15);
        scene.add(emplacement);
        objects.push(emplacement);

        // Artillery gun barrel
        var gunBarrelGeometry = new THREE.CylinderGeometry(0.6, 0.5, 12, 8);
        var gunBarrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        var gunBarrel = new THREE.Mesh(gunBarrelGeometry, gunBarrelMaterial);
        gunBarrel.rotation.z = Math.PI / 5;
        gunBarrel.position.set(-25, 4, 18);
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        // Magazine box storage
        var magazineGeometry = new THREE.BoxGeometry(4, 3, 5);
        var magazineMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
        magazine.position.set(-25, 1, 8);
        scene.add(magazine);
        objects.push(magazine);

        // Canal towpath stone wall
        var wallGeometry = new THREE.BoxGeometry(50, 2, 1);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x7F7F7F });
        var wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(0, 1, -15);
        scene.add(wall);
        objects.push(wall);

        // Sniper position box
        var sniperGeometry = new THREE.BoxGeometry(3, 2, 3);
        var sniperMaterial = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var sniper = new THREE.Mesh(sniperGeometry, sniperMaterial);
        sniper.position.set(-20, 2, -18);
        scene.add(sniper);
        objects.push(sniper);

        // Trip wires line segments across towpath
        var wireGeometry = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            -10, 0.5, -15,
            10, 0.5, -15,
            -15, 0.5, -15,
            15, 0.5, -15
        ]);
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        var wires = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wires);
        objects.push(wires);

        // Lighthouse tower
        var lighthouseGeometry = new THREE.CylinderGeometry(2, 2.5, 20, 8);
        var lighthouseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var lighthouse = new THREE.Mesh(lighthouseGeometry, lighthouseMaterial);
        lighthouse.position.set(25, 5, -20);
        scene.add(lighthouse);
        objects.push(lighthouse);

        // Lighthouse keepers cottage
        var cottageGeometry = new THREE.BoxGeometry(4, 4, 5);
        var cottageMaterial = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
        var cottage = new THREE.Mesh(cottageGeometry, cottageMaterial);
        cottage.position.set(32, 2, -20);
        scene.add(cottage);
        objects.push(cottage);

        // Signal cables line segments
        var cableGeometry = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            25, 20, -20,
            32, 15, -20,
            25, 20, -20,
            20, 15, -18
        ]);
        cableGeometry.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMaterial = new THREE.LineBasicMaterial({ color: 0x8B8B00 });
        var cables = new THREE.LineSegments(cableGeometry, cableMaterial);
        scene.add(cables);
        objects.push(cables);

        // Fuel barge hull
        var bargeGeometry = new THREE.BoxGeometry(5, 3, 12);
        var bargeMaterial = new THREE.MeshLambertMaterial({ color: 0xB8860B });
        var barge = new THREE.Mesh(bargeGeometry, bargeMaterial);
        barge.position.set(-18, 0.5, -8);
        scene.add(barge);
        objects.push(barge);

        // Fuel tank left
        var tankLeftGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 6);
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var tankLeft = new THREE.Mesh(tankLeftGeometry, tankMaterial);
        tankLeft.position.set(-19, 2.5, -10);
        scene.add(tankLeft);
        objects.push(tankLeft);

        // Fuel tank right
        var tankRightGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 6);
        var tankRight = new THREE.Mesh(tankRightGeometry, tankMaterial);
        tankRight.position.set(-17, 2.5, -10);
        scene.add(tankRight);
        objects.push(tankRight);

        // Pump station
        var pumpGeometry = new THREE.BoxGeometry(2, 2, 2);
        var pumpMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
        pump.position.set(-18, 1, -5);
        scene.add(pump);
        objects.push(pump);

        // Beach landing concrete obstacles row 1
        var obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
        var obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        for (var i = 0; i < 4; i++) {
            var obstacle1 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            obstacle1.position.set(-30 + (i * 3), 0.5, 25);
            scene.add(obstacle1);
            objects.push(obstacle1);
        }

        // Beach landing concrete obstacles row 2
        for (var i = 0; i < 4; i++) {
            var obstacle2 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            obstacle2.position.set(-30 + (i * 3), 0.5, 28);
            scene.add(obstacle2);
            objects.push(obstacle2);
        }

        // Mines in surf zone
        var mineGeometry = new THREE.SphereGeometry(0.7, 4, 4);
        var mineMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var mine1 = new THREE.Mesh(mineGeometry, mineMaterial);
        mine1.position.set(-10, 0.8, 22);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeometry, mineMaterial);
        mine2.position.set(5, 0.8, 24);
        scene.add(mine2);
        objects.push(mine2);

        var mine3 = new THREE.Mesh(mineGeometry, mineMaterial);
        mine3.position.set(-5, 0.8, 26);
        scene.add(mine3);
        objects.push(mine3);

        // Perimeter wire fence
        var fenceGeometry = new THREE.BufferGeometry();
        var fencePositions = new Float32Array([
            -35, 0.5, 30,
            35, 0.5, 30,
            35, 0.5, 20,
            -35, 0.5, 20
        ]);
        fenceGeometry.setAttribute('position', new THREE.BufferAttribute(fencePositions, 3));
        var fenceMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var fence = new THREE.LineSegments(fenceGeometry, fenceMaterial);
        scene.add(fence);
        objects.push(fence);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Rotate capstan mechanisms
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry.type === 'CylinderGeometry') {
                if (objects[i].position.y > 4 && objects[i].position.y < 6) {
                    objects[i].rotation.y += delta * 0.5;
                }
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        for (var i = 0; i < lights.length; i++) scene.remove(lights[i]);
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
