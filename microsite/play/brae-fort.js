window.BraeFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Terraced hillside - stepped box tiers going up
        var tier1 = new THREE.Mesh(
            new THREE.BoxGeometry(120, 8, 120),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        tier1.position.set(0, 4, 0);
        scene.add(tier1);
        objects.push(tier1);

        var tier2 = new THREE.Mesh(
            new THREE.BoxGeometry(90, 8, 90),
            new THREE.MeshLambertMaterial({ color: 0xA0826D })
        );
        tier2.position.set(0, 16, 0);
        scene.add(tier2);
        objects.push(tier2);

        var tier3 = new THREE.Mesh(
            new THREE.BoxGeometry(60, 8, 60),
            new THREE.MeshLambertMaterial({ color: 0x9B7B6F })
        );
        tier3.position.set(0, 28, 0);
        scene.add(tier3);
        objects.push(tier3);

        // Heather-covered earthwork ramparts - brown/purple stacked boxes
        var rampart1 = new THREE.Mesh(
            new THREE.BoxGeometry(100, 12, 15),
            new THREE.MeshLambertMaterial({ color: 0x5D4E37 })
        );
        rampart1.position.set(0, 32, 45);
        scene.add(rampart1);
        objects.push(rampart1);

        var rampart2 = new THREE.Mesh(
            new THREE.BoxGeometry(15, 12, 100),
            new THREE.MeshLambertMaterial({ color: 0x6B4C3E })
        );
        rampart2.position.set(45, 32, 0);
        scene.add(rampart2);
        objects.push(rampart2);

        var rampart3 = new THREE.Mesh(
            new THREE.BoxGeometry(15, 12, 100),
            new THREE.MeshLambertMaterial({ color: 0x5D4E37 })
        );
        rampart3.position.set(-45, 32, 0);
        scene.add(rampart3);
        objects.push(rampart3);

        var rampart4 = new THREE.Mesh(
            new THREE.BoxGeometry(100, 12, 15),
            new THREE.MeshLambertMaterial({ color: 0x6B4C3E })
        );
        rampart4.position.set(0, 32, -45);
        scene.add(rampart4);
        objects.push(rampart4);

        // Highland whisky distillery - pot stills (cylinders)
        var potStill1 = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 10, 20, 12),
            new THREE.MeshLambertMaterial({ color: 0xC0A080 })
        );
        potStill1.position.set(-25, 40, -20);
        scene.add(potStill1);
        objects.push(potStill1);

        var potStill2 = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 10, 20, 12),
            new THREE.MeshLambertMaterial({ color: 0xD4AF85 })
        );
        potStill2.position.set(-5, 40, -20);
        scene.add(potStill2);
        objects.push(potStill2);

        var potStill3 = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 10, 20, 12),
            new THREE.MeshLambertMaterial({ color: 0xC0A080 })
        );
        potStill3.position.set(15, 40, -20);
        scene.add(potStill3);
        objects.push(potStill3);

        // Warehouse for ammo depot - box structures
        var warehouse1 = new THREE.Mesh(
            new THREE.BoxGeometry(50, 25, 40),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        warehouse1.position.set(-20, 37, 25);
        scene.add(warehouse1);
        objects.push(warehouse1);

        var warehouse2 = new THREE.Mesh(
            new THREE.BoxGeometry(50, 25, 40),
            new THREE.MeshLambertMaterial({ color: 0x778899 })
        );
        warehouse2.position.set(25, 37, 25);
        scene.add(warehouse2);
        objects.push(warehouse2);

        // Claymore mine field markers - thin cylinder stakes
        var stake1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        stake1.position.set(-20, 3, 30);
        scene.add(stake1);
        objects.push(stake1);

        var stake2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        stake2.position.set(0, 3, 40);
        scene.add(stake2);
        objects.push(stake2);

        var stake3 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        stake3.position.set(20, 3, 30);
        scene.add(stake3);
        objects.push(stake3);

        // Clan chief's fortified manor house - central keep
        var keep = new THREE.Mesh(
            new THREE.BoxGeometry(40, 35, 40),
            new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        );
        keep.position.set(0, 42, 0);
        scene.add(keep);
        objects.push(keep);

        // Keep roof cone
        var keepRoof = new THREE.Mesh(
            new THREE.ConeGeometry(22, 15, 8),
            new THREE.MeshLambertMaterial({ color: 0x8B0000 })
        );
        keepRoof.position.set(0, 60, 0);
        scene.add(keepRoof);
        objects.push(keepRoof);

        // Corner tower sphere tops
        var towerTop1 = new THREE.Mesh(
            new THREE.SphereGeometry(6, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        towerTop1.position.set(-20, 50, -20);
        scene.add(towerTop1);
        objects.push(towerTop1);

        var towerTop2 = new THREE.Mesh(
            new THREE.SphereGeometry(6, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        towerTop2.position.set(20, 50, -20);
        scene.add(towerTop2);
        objects.push(towerTop2);

        // Lighting
        var mainLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        mainLight.position.set(50, 60, 50);
        mainLight.castShadow = true;
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0x8B7D6B, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        // Gentle rotation of keeps and towers for atmosphere
        if (objects.length > 14) {
            objects[14].rotation.y += delta * 0.1;
            objects[15].rotation.y -= delta * 0.15;
            objects[16].rotation.y += delta * 0.12;
            objects[17].rotation.y -= delta * 0.12;
        }
    }

    function reset() {
        var i = 0;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
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
