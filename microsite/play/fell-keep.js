window.FellKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Main fort walls (half-buried in moorland)
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        // North wall
        var northWallGeo = new THREE.BoxGeometry(40, 6, 2);
        var northWall = new THREE.Mesh(northWallGeo, wallMaterial);
        northWall.position.set(0, 2, -20);
        scene.add(northWall);
        objects.push(northWall);

        // South wall
        var southWallGeo = new THREE.BoxGeometry(40, 6, 2);
        var southWall = new THREE.Mesh(southWallGeo, wallMaterial);
        southWall.position.set(0, 2, 20);
        scene.add(southWall);
        objects.push(southWall);

        // East wall
        var eastWallGeo = new THREE.BoxGeometry(2, 6, 40);
        var eastWall = new THREE.Mesh(eastWallGeo, wallMaterial);
        eastWall.position.set(20, 2, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        // West wall
        var westWallGeo = new THREE.BoxGeometry(2, 6, 40);
        var westWall = new THREE.Mesh(westWallGeo, wallMaterial);
        westWall.position.set(-20, 2, 0);
        scene.add(westWall);
        objects.push(westWall);

        // Wind turbine tower 1
        var turbineTowerMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var turbineTowerGeo = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
        var turbineTower1 = new THREE.Mesh(turbineTowerGeo, turbineTowerMaterial);
        turbineTower1.position.set(-15, 12.5, -15);
        scene.add(turbineTower1);
        objects.push(turbineTower1);

        // Wind turbine blade arms 1
        var bladeArmMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var bladeArmGeo = new THREE.BoxGeometry(12, 1, 1);
        var bladeArm1a = new THREE.Mesh(bladeArmGeo, bladeArmMaterial);
        bladeArm1a.position.set(-15, 25, -15);
        bladeArm1a.rotation.z = 0;
        scene.add(bladeArm1a);
        objects.push(bladeArm1a);

        var bladeArm1b = new THREE.Mesh(bladeArmGeo, bladeArmMaterial);
        bladeArm1b.position.set(-15, 25, -15);
        bladeArm1b.rotation.z = Math.PI / 2;
        scene.add(bladeArm1b);
        objects.push(bladeArm1b);

        // Wind turbine tower 2
        var turbineTower2 = new THREE.Mesh(turbineTowerGeo, turbineTowerMaterial);
        turbineTower2.position.set(15, 12.5, -15);
        scene.add(turbineTower2);
        objects.push(turbineTower2);

        // Wind turbine blade arms 2
        var bladeArm2a = new THREE.Mesh(bladeArmGeo, bladeArmMaterial);
        bladeArm2a.position.set(15, 25, -15);
        bladeArm2a.rotation.z = 0.5;
        scene.add(bladeArm2a);
        objects.push(bladeArm2a);

        var bladeArm2b = new THREE.Mesh(bladeArmGeo, bladeArmMaterial);
        bladeArm2b.position.set(15, 25, -15);
        bladeArm2b.rotation.z = Math.PI / 2 + 0.5;
        scene.add(bladeArm2b);
        objects.push(bladeArm2b);

        // Fell runner relay station 1
        var hutMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var hutGeo = new THREE.BoxGeometry(4, 3, 4);
        var hut1 = new THREE.Mesh(hutGeo, hutMaterial);
        hut1.position.set(-12, 1.5, 8);
        scene.add(hut1);
        objects.push(hut1);

        // Fell runner relay station 2
        var hut2 = new THREE.Mesh(hutGeo, hutMaterial);
        hut2.position.set(12, 1.5, 8);
        scene.add(hut2);
        objects.push(hut2);

        // Fell runner relay station 3
        var hut3 = new THREE.Mesh(hutGeo, hutMaterial);
        hut3.position.set(0, 1.5, -28);
        scene.add(hut3);
        objects.push(hut3);

        // Peat fire beacon tower 1
        var beaconTowerMaterial = new THREE.MeshLambertMaterial({ color: 0x4D4D4D });
        var beaconTowerGeo = new THREE.CylinderGeometry(1.2, 1.2, 18, 8);
        var beaconTower1 = new THREE.Mesh(beaconTowerGeo, beaconTowerMaterial);
        beaconTower1.position.set(-25, 9, 0);
        scene.add(beaconTower1);
        objects.push(beaconTower1);

        // Peat fire beacon cone top 1
        var coneTopMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var coneTopGeo = new THREE.ConeGeometry(1.5, 4, 8);
        var coneTop1 = new THREE.Mesh(coneTopGeo, coneTopMaterial);
        coneTop1.position.set(-25, 21, 0);
        scene.add(coneTop1);
        objects.push(coneTop1);

        // Peat fire beacon glow sphere 1
        var glowMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B00 });
        var glowGeo = new THREE.SphereGeometry(0.8, 8, 8);
        var glow1 = new THREE.Mesh(glowGeo, glowMaterial);
        glow1.position.set(-25, 23, 0);
        scene.add(glow1);
        objects.push(glow1);

        // Peat fire beacon tower 2
        var beaconTower2 = new THREE.Mesh(beaconTowerGeo, beaconTowerMaterial);
        beaconTower2.position.set(25, 9, 0);
        scene.add(beaconTower2);
        objects.push(beaconTower2);

        // Peat fire beacon cone top 2
        var coneTop2 = new THREE.Mesh(coneTopGeo, coneTopMaterial);
        coneTop2.position.set(25, 21, 0);
        scene.add(coneTop2);
        objects.push(coneTop2);

        // Peat fire beacon glow sphere 2
        var glow2 = new THREE.Mesh(glowGeo, glowMaterial);
        glow2.position.set(25, 23, 0);
        scene.add(glow2);
        objects.push(glow2);

        // Barbed wire fence perimeter (zigzag LineSegments)
        var wireGeometry = new THREE.BufferGeometry();
        var wirePositions = [
            -30, 2.5, -30,
            -25, 2.5, -28,
            -20, 2.5, -30,
            -15, 2.5, -28,
            -10, 2.5, -30,
            -5, 2.5, -28,
            0, 2.5, -30,
            5, 2.5, -28,
            10, 2.5, -30,
            15, 2.5, -28,
            20, 2.5, -30,
            25, 2.5, -28,
            30, 2.5, -30
        ];
        var wireArray = new Float32Array(wirePositions);
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(wireArray, 3));
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x696969, linewidth: 2 });
        var fenceLine = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(fenceLine);
        objects.push(fenceLine);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate turbine blade arms
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.geometry instanceof THREE.BoxGeometry && obj.material.color.getHex() === 0xFFFFFF) {
                obj.rotation.z += delta * 2;
            }
            if (obj.geometry instanceof THREE.SphereGeometry && obj.material.color.getHex() === 0xFF6B00) {
                obj.scale.x = 1 + Math.sin(Date.now() * 0.003) * 0.2;
                obj.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.2;
                obj.scale.z = 1 + Math.sin(Date.now() * 0.003) * 0.2;
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
