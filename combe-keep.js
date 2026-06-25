window.CombeKeep = (function() {
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
        // Chalk cliff walls - white box cliffs
        var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f0 });

        // Left cliff wall
        var leftCliffGeom = new THREE.BoxGeometry(10, 40, 5);
        var leftCliff = new THREE.Mesh(leftCliffGeom, cliffMaterial);
        leftCliff.position.set(-25, 20, -15);
        scene.add(leftCliff);
        objects.push(leftCliff);

        // Right cliff wall
        var rightCliffGeom = new THREE.BoxGeometry(10, 40, 5);
        var rightCliff = new THREE.Mesh(rightCliffGeom, cliffMaterial);
        rightCliff.position.set(25, 20, -15);
        scene.add(rightCliff);
        objects.push(rightCliff);

        // Back cliff wall
        var backCliffGeom = new THREE.BoxGeometry(50, 35, 8);
        var backCliff = new THREE.Mesh(backCliffGeom, cliffMaterial);
        backCliff.position.set(0, 17, -30);
        scene.add(backCliff);
        objects.push(backCliff);

        // Downland fort keep tower - central structure
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0xe8e8dc });
        var keepGeom = new THREE.BoxGeometry(15, 25, 15);
        var keep = new THREE.Mesh(keepGeom, keepMaterial);
        keep.position.set(0, 12, 5);
        scene.add(keep);
        objects.push(keep);

        // Keep tower top cylinder
        var towerTopGeom = new THREE.CylinderGeometry(8, 8, 6, 8);
        var towerTopMaterial = new THREE.MeshLambertMaterial({ color: 0xd4d4c8 });
        var towerTop = new THREE.Mesh(towerTopGeom, towerTopMaterial);
        towerTop.position.set(0, 25, 5);
        scene.add(towerTop);
        objects.push(towerTop);

        // Artillery position rampart - cylindrical bastion
        var bastionGeom = new THREE.CylinderGeometry(12, 12, 4, 8);
        var bastionMaterial = new THREE.MeshLambertMaterial({ color: 0xd9d9cc });
        var bastion = new THREE.Mesh(bastionGeom, bastionMaterial);
        bastion.position.set(-15, 8, 15);
        scene.add(bastion);
        objects.push(bastion);

        // Artillery position rampart - right bastion
        var bastion2Geom = new THREE.CylinderGeometry(12, 12, 4, 8);
        var bastion2 = new THREE.Mesh(bastion2Geom, bastionMaterial);
        bastion2.position.set(15, 8, 15);
        scene.add(bastion2);
        objects.push(bastion2);

        // Flint nodule ammunition cache - sphere cluster 1
        var flintMaterial = new THREE.MeshLambertMaterial({ color: 0x444433 });
        var flintSphereGeom = new THREE.SphereGeometry(3, 6, 6);
        var flint1 = new THREE.Mesh(flintSphereGeom, flintMaterial);
        flint1.position.set(-10, 5, 10);
        scene.add(flint1);
        objects.push(flint1);

        // Flint nodule ammunition cache - sphere cluster 2
        var flint2Geom = new THREE.SphereGeometry(2.5, 6, 6);
        var flint2 = new THREE.Mesh(flint2Geom, flintMaterial);
        flint2.position.set(-8, 3, 12);
        scene.add(flint2);
        objects.push(flint2);

        // Flint nodule ammunition cache - sphere cluster 3
        var flint3Geom = new THREE.SphereGeometry(2, 6, 6);
        var flint3 = new THREE.Mesh(flint3Geom, flintMaterial);
        flint3.position.set(-12, 2, 8);
        scene.add(flint3);
        objects.push(flint3);

        // Signal chalk cut figure on hillside - horizontal box marking
        var chalkCutMaterial = new THREE.MeshLambertMaterial({ color: 0xfafaf5 });
        var chalkCut1Geom = new THREE.BoxGeometry(20, 2, 2);
        var chalkCut1 = new THREE.Mesh(chalkCut1Geom, chalkCutMaterial);
        chalkCut1.position.set(20, 8, -20);
        scene.add(chalkCut1);
        objects.push(chalkCut1);

        // Signal chalk cut figure - vertical box marking
        var chalkCut2Geom = new THREE.BoxGeometry(2, 20, 2);
        var chalkCut2 = new THREE.Mesh(chalkCut2Geom, chalkCutMaterial);
        chalkCut2.position.set(20, 8, -18);
        scene.add(chalkCut2);
        objects.push(chalkCut2);

        // Combe valley floor - flat plateau box
        var valleyMaterial = new THREE.MeshLambertMaterial({ color: 0x8b9467 });
        var valleyGeom = new THREE.BoxGeometry(80, 2, 60);
        var valley = new THREE.Mesh(valleyGeom, valleyMaterial);
        valley.position.set(0, -2, 0);
        scene.add(valley);
        objects.push(valley);

        // Combe slope terracing - stepped cone
        var slopeGeom = new THREE.ConeGeometry(40, 20, 8);
        var slopeMaterial = new THREE.MeshLambertMaterial({ color: 0x7a8560 });
        var slope = new THREE.Mesh(slopeGeom, slopeMaterial);
        slope.position.set(0, -12, -25);
        scene.add(slope);
        objects.push(slope);

        // Defensive palisade section - cylindrical post
        var palisadeGeom = new THREE.CylinderGeometry(1.5, 1.5, 12, 6);
        var palisadeMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var palisade = new THREE.Mesh(palisadeGeom, palisadeMaterial);
        palisade.position.set(-30, 6, 0);
        scene.add(palisade);
        objects.push(palisade);

        // Defensive palisade section 2
        var palisade2 = new THREE.Mesh(palisadeGeom, palisadeMaterial);
        palisade2.position.set(30, 6, 0);
        scene.add(palisade2);
        objects.push(palisade2);

        // Watchtower outpost - tall cylinder
        var watchtowerGeom = new THREE.CylinderGeometry(4, 5, 18, 8);
        var watchtowerMaterial = new THREE.MeshLambertMaterial({ color: 0xccc8bc });
        var watchtower = new THREE.Mesh(watchtowerGeom, watchtowerMaterial);
        watchtower.position.set(-20, 9, 20);
        scene.add(watchtower);
        objects.push(watchtower);

        // Watchtower cone cap
        var watchcapGeom = new THREE.ConeGeometry(4, 4, 8);
        var watchcap = new THREE.Mesh(watchcapGeom, watchtowerMaterial);
        watchcap.position.set(-20, 22, 20);
        scene.add(watchcap);
        objects.push(watchcap);

        // Lighting - primary directional light (chalk sunlight)
        var lightColor = 0xffffff;
        var directional = new THREE.DirectionalLight(lightColor, 0.8);
        directional.position.set(20, 30, 20);
        scene.add(directional);
        lights.push(directional);

        // Lighting - secondary ambient light for chalk brightness
        var ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);
        lights.push(ambient);
    }

    function update(delta) {
        // Animation loop - subtle rotations for atmospheric effect
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry.type === 'SphereGeometry') {
                objects[i].rotation.x += delta * 0.1;
                objects[i].rotation.y += delta * 0.15;
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
