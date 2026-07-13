window.ShawCamp = (function() {
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
        // Tree trunks and canopy
        var treeTrunk1 = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2.5, 20, 8),
            new THREE.MeshLambertMaterial({ color: 0x4a3728 })
        );
        treeTrunk1.position.set(-25, 10, -20);
        scene.add(treeTrunk1);
        objects.push(treeTrunk1);

        var treeCanopy1 = new THREE.Mesh(
            new THREE.SphereGeometry(8, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x2d5016 })
        );
        treeCanopy1.position.set(-25, 24, -20);
        scene.add(treeCanopy1);
        objects.push(treeCanopy1);

        var treeTrunk2 = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2.5, 18, 8),
            new THREE.MeshLambertMaterial({ color: 0x4a3728 })
        );
        treeTrunk2.position.set(5, 9, -15);
        scene.add(treeTrunk2);
        objects.push(treeTrunk2);

        var treeCanopy2 = new THREE.Mesh(
            new THREE.ConeGeometry(9, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x3a6b2e })
        );
        treeCanopy2.position.set(5, 22, -15);
        scene.add(treeCanopy2);
        objects.push(treeCanopy2);

        var treeTrunk3 = new THREE.Mesh(
            new THREE.CylinderGeometry(2.2, 2.8, 22, 8),
            new THREE.MeshLambertMaterial({ color: 0x5a4a38 })
        );
        treeTrunk3.position.set(20, 11, 5);
        scene.add(treeTrunk3);
        objects.push(treeTrunk3);

        var treeCanopy3 = new THREE.Mesh(
            new THREE.SphereGeometry(7.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x2d5016 })
        );
        treeCanopy3.position.set(20, 26, 5);
        scene.add(treeCanopy3);
        objects.push(treeCanopy3);

        // Sniper platform in trees
        var sniperPlatform = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1, 8),
            new THREE.MeshLambertMaterial({ color: 0x5a5a4a })
        );
        sniperPlatform.position.set(-10, 18, 10);
        scene.add(sniperPlatform);
        objects.push(sniperPlatform);

        // Platform support posts
        var platformPost1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1, 15, 6),
            new THREE.MeshLambertMaterial({ color: 0x4a3728 })
        );
        platformPost1.position.set(-14, 10.5, 7);
        scene.add(platformPost1);
        objects.push(platformPost1);

        var platformPost2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1, 15, 6),
            new THREE.MeshLambertMaterial({ color: 0x4a3728 })
        );
        platformPost2.position.set(-6, 10.5, 13);
        scene.add(platformPost2);
        objects.push(platformPost2);

        // Ammo cache buried under roots (boxes)
        var ammoCrate1 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 3, 4),
            new THREE.MeshLambertMaterial({ color: 0x3a3a28 })
        );
        ammoCrate1.position.set(15, 1.5, -25);
        scene.add(ammoCrate1);
        objects.push(ammoCrate1);

        var ammoCrate2 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2.5, 3.5),
            new THREE.MeshLambertMaterial({ color: 0x4a4a38 })
        );
        ammoCrate2.position.set(18, 1.2, -22);
        scene.add(ammoCrate2);
        objects.push(ammoCrate2);

        // Field kitchen firepit
        var firePitBase = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6.5, 0.8, 12),
            new THREE.MeshLambertMaterial({ color: 0x3a3a2a })
        );
        firePitBase.position.set(-20, 0.4, 20);
        scene.add(firePitBase);
        objects.push(firePitBase);

        var fireCone = new THREE.Mesh(
            new THREE.ConeGeometry(4, 6, 12),
            new THREE.MeshLambertMaterial({ color: 0xff6b35 })
        );
        fireCone.position.set(-20, 3, 20);
        scene.add(fireCone);
        objects.push(fireCone);

        var ironPot = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 2.8, 3, 10),
            new THREE.MeshLambertMaterial({ color: 0x2a2a1a })
        );
        ironPot.position.set(-20, 6, 20);
        scene.add(ironPot);
        objects.push(ironPot);

        // Camouflage netting (LineSegments on pole)
        var netGeometry = new THREE.BufferGeometry();
        var netPositions = new Float32Array([
            -30, 8, 0, -30, 8, 8,
            -30, 8, 8, -22, 8, 8,
            -22, 8, 8, -22, 8, 0,
            -22, 8, 0, -30, 8, 0,
            -30, 8, 0, -22, 16, 0,
            -30, 8, 8, -22, 16, 8,
            -22, 8, 8, -22, 16, 8,
            -22, 8, 0, -22, 16, 0
        ]);
        netGeometry.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));
        var netMaterial = new THREE.LineBasicMaterial({ color: 0x5a7a4a, linewidth: 2 });
        var netLines = new THREE.LineSegments(netGeometry, netMaterial);
        scene.add(netLines);
        objects.push(netLines);

        // Additional tree trunk with smaller canopy
        var treeTrunk4 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.8, 2.2, 16, 8),
            new THREE.MeshLambertMaterial({ color: 0x4a3728 })
        );
        treeTrunk4.position.set(-5, 8, 25);
        scene.add(treeTrunk4);
        objects.push(treeTrunk4);

        var treeCanopy4 = new THREE.Mesh(
            new THREE.SphereGeometry(6, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x3a6b2e })
        );
        treeCanopy4.position.set(-5, 20, 25);
        scene.add(treeCanopy4);
        objects.push(treeCanopy4);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation loop placeholder
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
