window.YairCamp = (function() {
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
        // Fish weir V-formation stakes (cylinders)
        var weirMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a2e });

        var stake1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            weirMaterial
        );
        stake1.position.set(-15, 0, 10);
        scene.add(stake1);
        objects.push(stake1);

        var stake2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            weirMaterial
        );
        stake2.position.set(-10, 0, 8);
        scene.add(stake2);
        objects.push(stake2);

        var stake3 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            weirMaterial
        );
        stake3.position.set(-5, 0, 10);
        scene.add(stake3);
        objects.push(stake3);

        var stake4 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            weirMaterial
        );
        stake4.position.set(0, 0, 12);
        scene.add(stake4);
        objects.push(stake4);

        var stake5 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            weirMaterial
        );
        stake5.position.set(5, 0, 10);
        scene.add(stake5);
        objects.push(stake5);

        var stake6 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            weirMaterial
        );
        stake6.position.set(10, 0, 8);
        scene.add(stake6);
        objects.push(stake6);

        var stake7 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            weirMaterial
        );
        stake7.position.set(15, 0, 10);
        scene.add(stake7);
        objects.push(stake7);

        // Command bothy hut (box body)
        var bothyMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var bothyBox = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, 6),
            bothyMaterial
        );
        bothyBox.position.set(-25, 2.5, -15);
        scene.add(bothyBox);
        objects.push(bothyBox);

        // Turf roof (cone)
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var roofCone = new THREE.Mesh(
            new THREE.ConeGeometry(5, 4, 8),
            roofMaterial
        );
        roofCone.position.set(-25, 7, -15);
        scene.add(roofCone);
        objects.push(roofCone);

        // Underwater obstacle net (LineSegments across river)
        var netMaterial = new THREE.LineBasicMaterial({ color: 0x1a5f3f, linewidth: 2 });
        var netGeometry = new THREE.BufferGeometry();
        var netPoints = [
            new THREE.Vector3(-20, -2, 5),
            new THREE.Vector3(20, -2, 5),
            new THREE.Vector3(-20, -5, 5),
            new THREE.Vector3(20, -5, 5),
            new THREE.Vector3(-20, -2, 5),
            new THREE.Vector3(-20, -5, 5),
            new THREE.Vector3(0, -2, 5),
            new THREE.Vector3(0, -5, 5)
        ];
        netGeometry.setFromPoints(netPoints);
        var netLines = new THREE.LineSegments(netGeometry, netMaterial);
        scene.add(netLines);
        objects.push(netLines);

        // Signal eel-trap rattle alarm (sphere ball)
        var trapBallMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var trapBall = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 16),
            trapBallMaterial
        );
        trapBall.position.set(20, 3, -10);
        scene.add(trapBall);
        objects.push(trapBall);

        // Wire trigger for alarm (LineSegments)
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 });
        var wireGeometry = new THREE.BufferGeometry();
        var wirePoints = [
            new THREE.Vector3(20, 3, -10),
            new THREE.Vector3(22, 1, -8),
            new THREE.Vector3(18, 1, -12)
        ];
        wireGeometry.setFromPoints(wirePoints);
        var wireLines = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wireLines);
        objects.push(wireLines);

        // Ammunition coracle boat (sphere hull)
        var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var boatSphere = new THREE.Mesh(
            new THREE.SphereGeometry(3, 12, 12),
            boatMaterial
        );
        boatSphere.scale.set(1, 0.6, 1);
        boatSphere.position.set(-30, 0.5, 15);
        scene.add(boatSphere);
        objects.push(boatSphere);

        // Boat floor platform (box)
        var floorMaterial = new THREE.MeshLambertMaterial({ color: 0xa0826d });
        var boatFloor = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.5, 2.5),
            floorMaterial
        );
        boatFloor.position.set(-30, 0.3, 15);
        scene.add(boatFloor);
        objects.push(boatFloor);

        // Smoking fish house (box body)
        var fishHouseMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var fishHouseBox = new THREE.Mesh(
            new THREE.BoxGeometry(6, 5, 5),
            fishHouseMaterial
        );
        fishHouseBox.position.set(25, 2.5, -20);
        scene.add(fishHouseBox);
        objects.push(fishHouseBox);

        // Chimney (cylinder)
        var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 6, 8),
            chimneyMaterial
        );
        chimney.position.set(28, 5, -20);
        scene.add(chimney);
        objects.push(chimney);

        // Sluice gate tactical barrier (box gate)
        var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var gateBox = new THREE.Mesh(
            new THREE.BoxGeometry(3, 6, 0.5),
            gateMaterial
        );
        gateBox.position.set(0, 3, -25);
        scene.add(gateBox);
        objects.push(gateBox);

        // Gate chains (LineSegments)
        var chainMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
        var chainGeometry = new THREE.BufferGeometry();
        var chainPoints = [
            new THREE.Vector3(-1.5, 6, -25),
            new THREE.Vector3(-1.5, 10, -25),
            new THREE.Vector3(1.5, 6, -25),
            new THREE.Vector3(1.5, 10, -25)
        ];
        chainGeometry.setFromPoints(chainPoints);
        var chainLines = new THREE.LineSegments(chainGeometry, chainMaterial);
        scene.add(chainLines);
        objects.push(chainLines);

        // Riverside sniper nest (box hide half in water)
        var nestMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d2d });
        var nestBox = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 4),
            nestMaterial
        );
        nestBox.position.set(30, 1.5, 5);
        scene.add(nestBox);
        objects.push(nestBox);

        // Additional stone cairn (sphere stacked)
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
        var stone1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            stoneMaterial
        );
        stone1.position.set(-28, 1, 0);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            stoneMaterial
        );
        stone2.position.set(-28, 3, 0);
        scene.add(stone2);
        objects.push(stone2);

        // Additional equipment box
        var equipMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var equipBox = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 2, 2),
            equipMaterial
        );
        equipBox.position.set(15, 1, 20);
        scene.add(equipBox);
        objects.push(equipBox);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate alarm sphere rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry instanceof THREE.SphereGeometry) {
                if (objects[i].position.x > 19 && objects[i].position.x < 21) {
                    objects[i].rotation.x += delta * 0.5;
                    objects[i].rotation.y += delta * 0.3;
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
