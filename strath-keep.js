window.StrathKeep = (function() {
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
        var i;

        // Terrain - wide river valley box floor
        var terrainGeom = new THREE.BoxGeometry(120, 2, 100);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x4a5f3a });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Norman Keep Tower - tall central box
        var keepGeom = new THREE.BoxGeometry(24, 50, 24);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var keep = new THREE.Mesh(keepGeom, keepMat);
        keep.position.set(0, 25, 0);
        scene.add(keep);
        objects.push(keep);

        // Keep crenellations - box top
        var crenel1Geom = new THREE.BoxGeometry(28, 6, 28);
        var crenelMat = new THREE.MeshLambertMaterial({ color: 0xa0826d });
        var crenel = new THREE.Mesh(crenel1Geom, crenelMat);
        crenel.position.set(0, 53, 0);
        scene.add(crenel);
        objects.push(crenel);

        // Inner curtain wall - north section (box wall)
        var wallNGeom = new THREE.BoxGeometry(50, 18, 4);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x9b8b7e });
        var wallN = new THREE.Mesh(wallNGeom, wallMat);
        wallN.position.set(0, 9, -28);
        scene.add(wallN);
        objects.push(wallN);

        // Inner curtain wall - south section
        var wallSGeom = new THREE.BoxGeometry(50, 18, 4);
        var wallS = new THREE.Mesh(wallSGeom, wallMat);
        wallS.position.set(0, 9, 28);
        scene.add(wallS);
        objects.push(wallS);

        // Inner curtain wall - east section
        var wallEGeom = new THREE.BoxGeometry(4, 18, 50);
        var wallE = new THREE.Mesh(wallEGeom, wallMat);
        wallE.position.set(28, 9, 0);
        scene.add(wallE);
        objects.push(wallE);

        // Inner curtain wall - west section
        var wallWGeom = new THREE.BoxGeometry(4, 18, 50);
        var wallW = new THREE.Mesh(wallWGeom, wallMat);
        wallW.position.set(-28, 9, 0);
        scene.add(wallW);
        objects.push(wallW);

        // Corner tower - northeast (cylinder)
        var towerGeom = new THREE.CylinderGeometry(6, 6, 20, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8b7d6b });
        var towerNE = new THREE.Mesh(towerGeom, towerMat);
        towerNE.position.set(28, 10, -28);
        scene.add(towerNE);
        objects.push(towerNE);

        // Corner tower - northwest
        var towerNW = new THREE.Mesh(towerGeom, towerMat);
        towerNW.position.set(-28, 10, -28);
        scene.add(towerNW);
        objects.push(towerNW);

        // Corner tower - southeast
        var towerSE = new THREE.Mesh(towerGeom, towerMat);
        towerSE.position.set(28, 10, 28);
        scene.add(towerSE);
        objects.push(towerSE);

        // Corner tower - southwest
        var towerSW = new THREE.Mesh(towerGeom, towerMat);
        towerSW.position.set(-28, 10, 28);
        scene.add(towerSW);
        objects.push(towerSW);

        // Gatehouse - box structure on north wall
        var gatehouseGeom = new THREE.BoxGeometry(16, 16, 8);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x7a6b5d });
        var gatehouse = new THREE.Mesh(gatehouseGeom, gateMat);
        gatehouse.position.set(0, 8, -32);
        scene.add(gatehouse);
        objects.push(gatehouse);

        // Portcullis - LineSegments iron grate
        var portPoints = [
            new THREE.Vector3(-6, 6, -32),
            new THREE.Vector3(6, 6, -32),
            new THREE.Vector3(6, 0, -32),
            new THREE.Vector3(-6, 0, -32),
            new THREE.Vector3(-6, 6, -32)
        ];
        var portGeom = new THREE.BufferGeometry().setFromPoints(portPoints);
        var portMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        var portcullis = new THREE.LineSegments(portGeom, portMat);
        scene.add(portcullis);
        objects.push(portcullis);

        // Great hall - large box building inside walls
        var hallGeom = new THREE.BoxGeometry(32, 12, 20);
        var hallMat = new THREE.MeshLambertMaterial({ color: 0x9d7e68 });
        var hall = new THREE.Mesh(hallGeom, hallMat);
        hall.position.set(0, 6, 0);
        scene.add(hall);
        objects.push(hall);

        // Great hall roof - cone
        var roofGeom = new THREE.ConeGeometry(18, 14, 8);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x5a3d2a });
        var roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.set(0, 19, 0);
        scene.add(roof);
        objects.push(roof);

        // Well in courtyard - cylinder barrel
        var wellGeom = new THREE.CylinderGeometry(4, 4, 8, 8);
        var wellMat = new THREE.MeshLambertMaterial({ color: 0x6b5a4a });
        var well = new THREE.Mesh(wellGeom, wellMat);
        well.position.set(-15, 4, 0);
        scene.add(well);
        objects.push(well);

        // Well bucket rope - LineSegments
        var ropePoints = [
            new THREE.Vector3(-15, 12, -3),
            new THREE.Vector3(-15, 4, -3),
            new THREE.Vector3(-15, 4, 3),
            new THREE.Vector3(-15, 12, 3)
        ];
        var ropeGeom = new THREE.BufferGeometry().setFromPoints(ropePoints);
        var ropeMat = new THREE.LineBasicMaterial({ color: 0xccaa66, linewidth: 1 });
        var rope = new THREE.LineSegments(ropeGeom, ropeMat);
        scene.add(rope);
        objects.push(rope);

        // Blacksmith forge - box structure
        var forgeGeom = new THREE.BoxGeometry(12, 8, 12);
        var forgeMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var forge = new THREE.Mesh(forgeGeom, forgeMat);
        forge.position.set(15, 4, 0);
        scene.add(forge);
        objects.push(forge);

        // Fire glow sphere above forge
        var fireGeom = new THREE.SphereGeometry(5, 16, 16);
        var fireMat = new THREE.MeshLambertMaterial({ color: 0xff6633 });
        var fire = new THREE.Mesh(fireGeom, fireMat);
        fire.position.set(15, 14, 0);
        scene.add(fire);
        objects.push(fire);

        // Outer moat - north section (box channel)
        var moatNGeom = new THREE.BoxGeometry(60, 3, 6);
        var moatMat = new THREE.MeshLambertMaterial({ color: 0x4a6fa5 });
        var moatN = new THREE.Mesh(moatNGeom, moatMat);
        moatN.position.set(0, 0, -40);
        scene.add(moatN);
        objects.push(moatN);

        // Outer moat - south section
        var moatS = new THREE.Mesh(moatNGeom, moatMat);
        moatS.position.set(0, 0, 40);
        scene.add(moatS);
        objects.push(moatS);

        // Outer moat - east section
        var moatEGeom = new THREE.BoxGeometry(6, 3, 80);
        var moatE = new THREE.Mesh(moatEGeom, moatMat);
        moatE.position.set(40, 0, 0);
        scene.add(moatE);
        objects.push(moatE);

        // Outer moat - west section
        var moatW = new THREE.Mesh(moatEGeom, moatMat);
        moatW.position.set(-40, 0, 0);
        scene.add(moatW);
        objects.push(moatW);

        // Lighting - ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for valley shadows
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    objects[i].rotation.y += 0.0001 * delta;
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
