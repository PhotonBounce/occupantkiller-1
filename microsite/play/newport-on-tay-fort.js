window.NewportOnTayFort = (function() {
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
        build();
    }

    function build() {
        // Victorian Railway Terminus Building (10×6×4 BoxGeometry, gray stone)
        var terminalGeom = new THREE.BoxGeometry(10, 6, 4);
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var terminalBuilding = new THREE.Mesh(terminalGeom, stoneMaterial);
        terminalBuilding.position.set(180, 3, 50);
        scene.add(terminalBuilding);
        objects.push(terminalBuilding);

        // Road Bridge Approach Ramp - 4 Concrete Pillars (CylinderGeometry)
        var pillarGeom = new THREE.CylinderGeometry(1, 1.2, 8, 8);
        var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });

        var pillar1 = new THREE.Mesh(pillarGeom, concreteMaterial);
        pillar1.position.set(170, 4, 45);
        scene.add(pillar1);
        objects.push(pillar1);

        var pillar2 = new THREE.Mesh(pillarGeom, concreteMaterial);
        pillar2.position.set(190, 4, 45);
        scene.add(pillar2);
        objects.push(pillar2);

        var pillar3 = new THREE.Mesh(pillarGeom, concreteMaterial);
        pillar3.position.set(170, 4, 55);
        scene.add(pillar3);
        objects.push(pillar3);

        var pillar4 = new THREE.Mesh(pillarGeom, concreteMaterial);
        pillar4.position.set(190, 4, 55);
        scene.add(pillar4);
        objects.push(pillar4);

        // Riverside Gun Emplacement (3×3×2 BoxGeometry, sandbag-colored)
        var gunGeom = new THREE.BoxGeometry(3, 3, 2);
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var gunEmplacement = new THREE.Mesh(gunGeom, sandbagMaterial);
        gunEmplacement.position.set(165, 1.5, 60);
        scene.add(gunEmplacement);
        objects.push(gunEmplacement);

        // Guard Tower at Bridge Approach (2×2×8 CylinderGeometry tower)
        var towerGeom = new THREE.CylinderGeometry(1, 1, 8, 6);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var guardTower = new THREE.Mesh(towerGeom, towerMaterial);
        guardTower.position.set(195, 4, 50);
        scene.add(guardTower);
        objects.push(guardTower);

        // Chain Barrier Across Road (LineSegments, red)
        var barrierGeometry = new THREE.BufferGeometry();
        var barrierPoints = new Float32Array([
            175, 3, 47, 185, 3, 47,
            185, 3, 47, 185, 4, 47,
            185, 4, 47, 175, 4, 47,
            175, 4, 47, 175, 3, 47
        ]);
        barrierGeometry.setAttribute('position', new THREE.BufferAttribute(barrierPoints, 3));
        var barrierMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 3 });
        var chainBarrier = new THREE.LineSegments(barrierGeometry, barrierMaterial);
        scene.add(chainBarrier);
        objects.push(chainBarrier);

        // Ammunition Depot (4×3×2 BoxGeometry)
        var ammoGeom = new THREE.BoxGeometry(4, 3, 2);
        var ammoDarkMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var ammoBuildding = new THREE.Mesh(ammoGeom, ammoDarkMaterial);
        ammoBuildding.position.set(160, 1.5, 65);
        scene.add(ammoBuildding);
        objects.push(ammoBuildding);

        // Searchlight Platform (CylinderGeometry platform + SphereGeometry light)
        var platformGeom = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 8);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x6B6B6B });
        var searchlightPlatform = new THREE.Mesh(platformGeom, platformMaterial);
        searchlightPlatform.position.set(200, 6, 55);
        scene.add(searchlightPlatform);
        objects.push(searchlightPlatform);

        var lightGeom = new THREE.SphereGeometry(0.8, 6, 6);
        var lightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        var searchlightBulb = new THREE.Mesh(lightGeom, lightMaterial);
        searchlightBulb.position.set(200, 6.8, 55);
        scene.add(searchlightBulb);
        objects.push(searchlightBulb);

        // Barricade Walls (multiple 2×1×1 BoxGeometry, concrete gray)
        var barricadeGeom = new THREE.BoxGeometry(2, 1, 1);
        var barricadeMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });

        var barricade1 = new THREE.Mesh(barricadeGeom, barricadeMaterial);
        barricade1.position.set(172, 0.5, 40);
        scene.add(barricade1);
        objects.push(barricade1);

        var barricade2 = new THREE.Mesh(barricadeGeom, barricadeMaterial);
        barricade2.position.set(188, 0.5, 40);
        scene.add(barricade2);
        objects.push(barricade2);

        var barricade3 = new THREE.Mesh(barricadeGeom, barricadeMaterial);
        barricade3.position.set(155, 0.5, 58);
        scene.add(barricade3);
        objects.push(barricade3);

        var barricade4 = new THREE.Mesh(barricadeGeom, barricadeMaterial);
        barricade4.position.set(205, 0.5, 58);
        scene.add(barricade4);
        objects.push(barricade4);

        // Ambient lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(200, 20, 40);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Environment update logic
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
