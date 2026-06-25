window.WinchelseaRye2 = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function mesh(geo, mat) {
        var m = new THREE.Mesh(geo, mat);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function lines(geo, mat) {
        var l = new THREE.LineSegments(geo, mat);
        scene.add(l);
        objects.push(l);
        return l;
    }

    function lambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        var OX = 6760;
        var OZ = 0;

        // 1. Winchelsea New Gate — medieval stone arch gateway
        // Left pillar
        var gateStone = lambert(0xCCBBAA);
        var pillarLeft = mesh(new THREE.BoxGeometry(3, 8, 3), gateStone);
        pillarLeft.position.set(OX + 0, 4, OZ + 0);

        // Right pillar
        var pillarRight = mesh(new THREE.BoxGeometry(3, 8, 3), gateStone);
        pillarRight.position.set(OX + 13, 4, OZ + 0);

        // Arch lintel
        var lintel = mesh(new THREE.BoxGeometry(10, 2, 2), gateStone);
        lintel.position.set(OX + 6.5, 8.5, OZ + 0);

        // 2. Winchelsea church (St Thomas) — large medieval ruin, 3 partial walls
        var churchMat = lambert(0xBBB8A0);

        var wallNorth = mesh(new THREE.BoxGeometry(25, 8, 1), churchMat);
        wallNorth.position.set(OX + 30, 4, OZ + 20);

        var wallSouth = mesh(new THREE.BoxGeometry(25, 8, 1), churchMat);
        wallSouth.position.set(OX + 30, 4, OZ + 32);

        var wallWest = mesh(new THREE.BoxGeometry(1, 8, 12), churchMat);
        wallWest.position.set(OX + 17.5, 4, OZ + 26);

        // Roofless nave outline via LineSegments
        var naveGeo = new THREE.BoxGeometry(25, 0.2, 12);
        var naveMat = lambert(0xBBB8A0);
        var naveOutline = mesh(naveGeo, naveMat);
        naveOutline.position.set(OX + 30, 0.1, OZ + 26);

        // 3. Winchelsea planned grid streets — 8 parallel street-edge walls
        var streetMat = lambert(0x998866);
        for (var s = 0; s < 8; s++) {
            var streetWall = mesh(new THREE.BoxGeometry(1, 1, 30), streetMat);
            streetWall.position.set(OX + 60 + s * 8, 0.5, OZ + 30);
        }

        // 4. Medieval wine cellar ruins — 3 underground vault entrances
        var vaultMat = lambert(0x333322);
        for (var v = 0; v < 3; v++) {
            var vault = mesh(new THREE.BoxGeometry(2, 0.5, 3), vaultMat);
            vault.position.set(OX + 20 + v * 10, -0.25, OZ + 60);
        }

        // 5. Rye Gun Garden — cannon approximation
        var ironMat = lambert(0x333333);

        // Cannon barrel (horizontal cylinder)
        var barrel = mesh(new THREE.CylinderGeometry(0.6, 0.6, 3, 12), ironMat);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(OX + 120, 3, OZ + 5);

        // Left wheel disc
        var wheelLeft = mesh(new THREE.CylinderGeometry(2, 2, 0.3, 16), ironMat);
        wheelLeft.rotation.z = Math.PI / 2;
        wheelLeft.position.set(OX + 118.5, 2, OZ + 5);

        // Right wheel disc
        var wheelRight = mesh(new THREE.CylinderGeometry(2, 2, 0.3, 16), ironMat);
        wheelRight.rotation.z = Math.PI / 2;
        wheelRight.position.set(OX + 121.5, 2, OZ + 5);

        // 6. Rye's Ypres Tower — round medieval keep
        var towerMat = lambert(0xCC9966);

        var towerBase = mesh(new THREE.CylinderGeometry(5, 5, 10, 16), towerMat);
        towerBase.position.set(OX + 140, 5, OZ + 0);

        var towerCap = mesh(new THREE.ConeGeometry(5, 4, 16), towerMat);
        towerCap.position.set(OX + 140, 12, OZ + 0);

        // 7. Rye church (St Mary's)
        var stMaryMat = lambert(0xCCBBAA);

        // Nave body
        var stMaryNave = mesh(new THREE.BoxGeometry(22, 10, 14), stMaryMat);
        stMaryNave.position.set(OX + 160, 5, OZ + 0);

        // Tower
        var stMaryTower = mesh(new THREE.BoxGeometry(5, 16, 5), stMaryMat);
        stMaryTower.position.set(OX + 171.5, 8, OZ + 0);

        // 4 clock face boxes (white)
        var clockMat = lambert(0xFFFFFF);

        var clockN = mesh(new THREE.BoxGeometry(3, 3, 0.2), clockMat);
        clockN.position.set(OX + 171.5, 13, OZ + -2.6);

        var clockS = mesh(new THREE.BoxGeometry(3, 3, 0.2), clockMat);
        clockS.position.set(OX + 171.5, 13, OZ + 2.6);

        var clockE = mesh(new THREE.BoxGeometry(0.2, 3, 3), clockMat);
        clockE.position.set(OX + 174.1, 13, OZ + 0);

        var clockW = mesh(new THREE.BoxGeometry(0.2, 3, 3), clockMat);
        clockW.position.set(OX + 168.9, 13, OZ + 0);

        // 8. Rye Mermaid Street — 10 overhanging medieval houses
        var timberMat = lambert(0x8B6914);
        for (var h = 0; h < 10; h++) {
            var house = mesh(new THREE.BoxGeometry(5, 8, 8), timberMat);
            house.position.set(OX + 185 + h * 6, 4, OZ + 0);
        }

        // 9. River Rother estuary
        var rotherMat = lambert(0x4477AA);
        var rother = mesh(new THREE.BoxGeometry(60, 0.3, 10), rotherMat);
        rother.position.set(OX + 250, 0, OZ + 40);

        // 10. Camber Sands — flat sandy strip
        var sandMat = lambert(0xF4E0A0);
        var camber = mesh(new THREE.BoxGeometry(60, 0.3, 20), sandMat);
        camber.position.set(OX + 250, 0, OZ + 60);
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
