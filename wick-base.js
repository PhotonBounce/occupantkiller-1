window.WickBase = (function() {
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
        // Market hall barracks - long box building with interior stalls
        var hallGeometry = new THREE.BoxGeometry(40, 8, 20);
        var hallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var marketHall = new THREE.Mesh(hallGeometry, hallMaterial);
        marketHall.position.set(-20, 4, 0);
        scene.add(marketHall);
        objects.push(marketHall);

        // Market hall interior stalls (4 box stalls)
        var stallGeometry = new THREE.BoxGeometry(8, 4, 6);
        var stallMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var stall1 = new THREE.Mesh(stallGeometry, stallMaterial);
        stall1.position.set(-28, 2, -6);
        scene.add(stall1);
        objects.push(stall1);

        var stall2 = new THREE.Mesh(stallGeometry, stallMaterial);
        stall2.position.set(-28, 2, 6);
        scene.add(stall2);
        objects.push(stall2);

        var stall3 = new THREE.Mesh(stallGeometry, stallMaterial);
        stall3.position.set(-12, 2, -6);
        scene.add(stall3);
        objects.push(stall3);

        var stall4 = new THREE.Mesh(stallGeometry, stallMaterial);
        stall4.position.set(-12, 2, 6);
        scene.add(stall4);
        objects.push(stall4);

        // Saxon thegn's tower - square box with crenellations
        var towerGeometry = new THREE.BoxGeometry(12, 24, 12);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(20, 12, 0);
        scene.add(tower);
        objects.push(tower);

        // Tower crenellations (4 box sections at top)
        var crenelGeometry = new THREE.BoxGeometry(4, 2, 4);
        var crenelMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var crenel1 = new THREE.Mesh(crenelGeometry, crenelMaterial);
        crenel1.position.set(16, 26, 0);
        scene.add(crenel1);
        objects.push(crenel1);

        var crenel2 = new THREE.Mesh(crenelGeometry, crenelMaterial);
        crenel2.position.set(24, 26, 0);
        scene.add(crenel2);
        objects.push(crenel2);

        var crenel3 = new THREE.Mesh(crenelGeometry, crenelMaterial);
        crenel3.position.set(20, 26, -4);
        scene.add(crenel3);
        objects.push(crenel3);

        var crenel4 = new THREE.Mesh(crenelGeometry, crenelMaterial);
        crenel4.position.set(20, 26, 4);
        scene.add(crenel4);
        objects.push(crenel4);

        // Spear rack - cylinder spears with box display frame
        var rackFrameGeometry = new THREE.BoxGeometry(16, 8, 2);
        var rackFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var rackFrame = new THREE.Mesh(rackFrameGeometry, rackFrameMaterial);
        rackFrame.position.set(0, 4, -20);
        scene.add(rackFrame);
        objects.push(rackFrame);

        // Spear cylinders (3 spears)
        var spearGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
        var spearMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var spear1 = new THREE.Mesh(spearGeometry, spearMaterial);
        spear1.position.set(-4, 6, -20);
        scene.add(spear1);
        objects.push(spear1);

        var spear2 = new THREE.Mesh(spearGeometry, spearMaterial);
        spear2.position.set(0, 6, -20);
        scene.add(spear2);
        objects.push(spear2);

        var spear3 = new THREE.Mesh(spearGeometry, spearMaterial);
        spear3.position.set(4, 6, -20);
        scene.add(spear3);
        objects.push(spear3);

        // Shield wall display - box shields on rack
        var shield1Geometry = new THREE.BoxGeometry(3, 4, 0.5);
        var shieldMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var shield1 = new THREE.Mesh(shield1Geometry, shieldMaterial);
        shield1.position.set(-6, 5, -20);
        scene.add(shield1);
        objects.push(shield1);

        var shield2Geometry = new THREE.BoxGeometry(3, 4, 0.5);
        var shield2Material = new THREE.MeshLambertMaterial({ color: 0x0000FF });
        var shield2 = new THREE.Mesh(shield2Geometry, shield2Material);
        shield2.position.set(6, 5, -20);
        scene.add(shield2);
        objects.push(shield2);

        // Saxon ship repair dock - large box structure
        var dockGeometry = new THREE.BoxGeometry(30, 3, 25);
        var dockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var dock = new THREE.Mesh(dockGeometry, dockMaterial);
        dock.position.set(0, 1.5, 25);
        scene.add(dock);
        objects.push(dock);

        // Dock support pillars (2 cylinders)
        var pillarGeometry = new THREE.CylinderGeometry(2, 2, 8, 8);
        var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar1.position.set(-12, 4, 25);
        scene.add(pillar1);
        objects.push(pillar1);

        var pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar2.position.set(12, 4, 25);
        scene.add(pillar2);
        objects.push(pillar2);

        // Mead hall command post - large box hall with cone pyramid roof
        var meadHallGeometry = new THREE.BoxGeometry(28, 10, 24);
        var meadHallMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var meadHall = new THREE.Mesh(meadHallGeometry, meadHallMaterial);
        meadHall.position.set(-25, 5, 20);
        scene.add(meadHall);
        objects.push(meadHall);

        // Mead hall pyramid roof (cone)
        var roofGeometry = new THREE.ConeGeometry(15, 8, 8);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(-25, 14, 20);
        scene.add(roof);
        objects.push(roof);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation logic can be added here
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
