window.KnapBase = (function() {
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
        // Trig pillar command post - box base
        var trigGeometry = new THREE.BoxGeometry(2, 4, 2);
        var trigMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var trigPillar = new THREE.Mesh(trigGeometry, trigMaterial);
        trigPillar.position.set(0, 2, 0);
        scene.add(trigPillar);
        objects.push(trigPillar);

        // Command post roof structure - box top
        var roofGeometry = new THREE.BoxGeometry(3, 0.8, 3);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var roofBox = new THREE.Mesh(roofGeometry, roofMaterial);
        roofBox.position.set(0, 4.6, 0);
        scene.add(roofBox);
        objects.push(roofBox);

        // Sandbag defensive ring - stacked boxes in circle
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x9d8e4a });
        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var radius = 8;
            var xPos = Math.cos(angle) * radius;
            var zPos = Math.sin(angle) * radius;

            // Lower sandbag layer
            var sbGeometry1 = new THREE.BoxGeometry(1.5, 0.6, 1.5);
            var sandbag1 = new THREE.Mesh(sbGeometry1, sandbagMaterial);
            sandbag1.position.set(xPos, 0.3, zPos);
            scene.add(sandbag1);
            objects.push(sandbag1);

            // Upper sandbag layer
            var sbGeometry2 = new THREE.BoxGeometry(1.5, 0.6, 1.5);
            var sandbag2 = new THREE.Mesh(sbGeometry2, sandbagMaterial);
            sandbag2.position.set(xPos, 0.9, zPos);
            scene.add(sandbag2);
            objects.push(sandbag2);
        }

        // Artillery observation post - box OP structure
        var opGeometry = new THREE.BoxGeometry(2.5, 3.5, 2.5);
        var opMaterial = new THREE.MeshLambertMaterial({ color: 0x556655 });
        var opBox = new THREE.Mesh(opGeometry, opMaterial);
        opBox.position.set(12, 1.75, -8);
        scene.add(opBox);
        objects.push(opBox);

        // OP slit window left
        var slitGeometry1 = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        var slitMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var slit1 = new THREE.Mesh(slitGeometry1, slitMaterial);
        slit1.position.set(11.15, 3, -8);
        scene.add(slit1);
        objects.push(slit1);

        // OP slit window right
        var slitGeometry2 = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        var slit2 = new THREE.Mesh(slitGeometry2, slitMaterial);
        slit2.position.set(12.85, 3, -8);
        scene.add(slit2);
        objects.push(slit2);

        // Wind turbine base structure
        var turbineBaseGeometry = new THREE.CylinderGeometry(0.8, 1, 2, 16);
        var turbineBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var turbineBase = new THREE.Mesh(turbineBaseGeometry, turbineBaseMaterial);
        turbineBase.position.set(-15, 1, 10);
        scene.add(turbineBase);
        objects.push(turbineBase);

        // Wind turbine tower
        var towerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 12);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(-15, 5, 10);
        scene.add(tower);
        objects.push(tower);

        // Wind turbine hub cone
        var hubGeometry = new THREE.ConeGeometry(0.5, 0.4, 8);
        var hubMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.position.set(-15, 9.5, 10);
        hub.rotation.z = Math.PI / 2;
        scene.add(hub);
        objects.push(hub);

        // Wind turbine blade 1
        var bladeGeometry1 = new THREE.ConeGeometry(0.2, 3, 4);
        var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var blade1 = new THREE.Mesh(bladeGeometry1, bladeMaterial);
        blade1.position.set(-15, 9.5, 10);
        blade1.rotation.z = 0;
        scene.add(blade1);
        objects.push(blade1);

        // Wind turbine blade 2
        var bladeGeometry2 = new THREE.ConeGeometry(0.2, 3, 4);
        var blade2 = new THREE.Mesh(bladeGeometry2, bladeMaterial);
        blade2.position.set(-15, 9.5, 10);
        blade2.rotation.z = Math.PI * 0.667;
        scene.add(blade2);
        objects.push(blade2);

        // Wind turbine blade 3
        var bladeGeometry3 = new THREE.ConeGeometry(0.2, 3, 4);
        var blade3 = new THREE.Mesh(bladeGeometry3, bladeMaterial);
        blade3.position.set(-15, 9.5, 10);
        blade3.rotation.z = Math.PI * 1.334;
        scene.add(blade3);
        objects.push(blade3);

        // Supply helicopter pad - flat box with diagonal
        var padGeometry = new THREE.BoxGeometry(6, 0.3, 6);
        var padMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var heliPad = new THREE.Mesh(padGeometry, padMaterial);
        heliPad.position.set(-12, 0.15, -12);
        scene.add(heliPad);
        objects.push(heliPad);

        // Helicopter pad H marking - left vertical
        var hLine1Points = [
            new THREE.Vector3(-14, 0.3, -12),
            new THREE.Vector3(-14, 0.3, -11)
        ];
        var hLine1Geometry = new THREE.BufferGeometry().setFromPoints(hLine1Points);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        var hLine1 = new THREE.LineSegments(hLine1Geometry, lineMaterial);
        scene.add(hLine1);
        objects.push(hLine1);

        // Helicopter pad H marking - right vertical
        var hLine2Points = [
            new THREE.Vector3(-10, 0.3, -12),
            new THREE.Vector3(-10, 0.3, -11)
        ];
        var hLine2Geometry = new THREE.BufferGeometry().setFromPoints(hLine2Points);
        var hLine2 = new THREE.LineSegments(hLine2Geometry, lineMaterial);
        scene.add(hLine2);
        objects.push(hLine2);

        // Helicopter pad H marking - horizontal bar
        var hLine3Points = [
            new THREE.Vector3(-14, 0.3, -11.5),
            new THREE.Vector3(-10, 0.3, -11.5)
        ];
        var hLine3Geometry = new THREE.BufferGeometry().setFromPoints(hLine3Points);
        var hLine3 = new THREE.LineSegments(hLine3Geometry, lineMaterial);
        scene.add(hLine3);
        objects.push(hLine3);

        // Storm anchor sphere points - distributed around
        var anchorSphereGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        var anchorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var anchorPositions = [
            [8, 0.5, 8],
            [-8, 0.5, 8],
            [8, 0.5, -8],
            [-8, 0.5, -8]
        ];
        for (var j = 0; j < anchorPositions.length; j++) {
            var anchor = new THREE.Mesh(anchorSphereGeometry, anchorMaterial);
            anchor.position.set(anchorPositions[j][0], anchorPositions[j][1], anchorPositions[j][2]);
            scene.add(anchor);
            objects.push(anchor);
        }

        // Storm anchor cables from central post
        var cableLinePoints1 = [
            new THREE.Vector3(0, 4, 0),
            new THREE.Vector3(8, 0.5, 8)
        ];
        var cableLineGeometry1 = new THREE.BufferGeometry().setFromPoints(cableLinePoints1);
        var cableLine1 = new THREE.LineSegments(cableLineGeometry1, lineMaterial);
        scene.add(cableLine1);
        objects.push(cableLine1);

        var cableLinePoints2 = [
            new THREE.Vector3(0, 4, 0),
            new THREE.Vector3(-8, 0.5, 8)
        ];
        var cableLineGeometry2 = new THREE.BufferGeometry().setFromPoints(cableLinePoints2);
        var cableLine2 = new THREE.LineSegments(cableLineGeometry2, lineMaterial);
        scene.add(cableLine2);
        objects.push(cableLine2);

        var cableLinePoints3 = [
            new THREE.Vector3(0, 4, 0),
            new THREE.Vector3(8, 0.5, -8)
        ];
        var cableLineGeometry3 = new THREE.BufferGeometry().setFromPoints(cableLinePoints3);
        var cableLine3 = new THREE.LineSegments(cableLineGeometry3, lineMaterial);
        scene.add(cableLine3);
        objects.push(cableLine3);

        var cableLinePoints4 = [
            new THREE.Vector3(0, 4, 0),
            new THREE.Vector3(-8, 0.5, -8)
        ];
        var cableLineGeometry4 = new THREE.BufferGeometry().setFromPoints(cableLinePoints4);
        var cableLine4 = new THREE.LineSegments(cableLineGeometry4, lineMaterial);
        scene.add(cableLine4);
        objects.push(cableLine4);

        // Beacon fire sphere core - glowing red
        var beaconGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        var beaconMaterial = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff2200 });
        var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.set(0, 5.5, 0);
        scene.add(beacon);
        objects.push(beacon);

        // Beacon fire stone surround cylinder
        var stoneGeometry = new THREE.CylinderGeometry(2, 2.5, 1, 12);
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x704020 });
        var stoneRing = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stoneRing.position.set(0, 5.2, 0);
        scene.add(stoneRing);
        objects.push(stoneRing);

        // Ammunition storage boxes - near OP
        var ammoGeometry = new THREE.BoxGeometry(1.2, 1, 1.2);
        var ammoMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d1f });
        var ammoBox1 = new THREE.Mesh(ammoGeometry, ammoMaterial);
        ammoBox1.position.set(14, 0.5, -10);
        scene.add(ammoBox1);
        objects.push(ammoBox1);

        var ammoBox2 = new THREE.Mesh(ammoGeometry, ammoMaterial);
        ammoBox2.position.set(16, 0.5, -10);
        scene.add(ammoBox2);
        objects.push(ammoBox2);

        // Fuel storage tank - cylinder
        var fuelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2.5, 12);
        var fuelMaterial = new THREE.MeshLambertMaterial({ color: 0x004400 });
        var fuelTank = new THREE.Mesh(fuelGeometry, fuelMaterial);
        fuelTank.position.set(-18, 1.25, -6);
        scene.add(fuelTank);
        objects.push(fuelTank);

        // Lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var beaconLight = new THREE.PointLight(0xff4400, 1, 40);
        beaconLight.position.set(0, 6, 0);
        scene.add(beaconLight);
        lights.push(beaconLight);
    }

    function update(delta) {
        // Animate wind turbine blades
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.x === -15 && objects[i].position.z === 10) {
                if (objects[i].geometry.type === 'ConeGeometry') {
                    objects[i].rotation.z += delta * 2;
                }
            }
        }

        // Animate beacon pulsing
        for (var i = 0; i < lights.length; i++) {
            if (lights[i].type === 'PointLight') {
                lights[i].intensity = 1 + Math.sin(Date.now() * 0.003) * 0.5;
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
