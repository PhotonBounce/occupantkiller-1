window.IslayFort = (function() {
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
        // Peat-rich Hebridean island box terrain
        var terrainGeom = new THREE.BoxGeometry(80, 2, 80);
        var terrainMat = new THREE.MeshLambertMaterial({color: 0x4a3728});
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Bowmore distillery round church tower (cylinder)
        var bwmrTowerGeom = new THREE.CylinderGeometry(6, 6, 18, 16);
        var bwmrTowerMat = new THREE.MeshLambertMaterial({color: 0x8B4513});
        var bwmrTower = new THREE.Mesh(bwmrTowerGeom, bwmrTowerMat);
        bwmrTower.position.set(-25, 9, -20);
        scene.add(bwmrTower);
        objects.push(bwmrTower);

        // Bowmore OP room on top (box)
        var bwmrOPGeom = new THREE.BoxGeometry(8, 4, 8);
        var bwmrOPMat = new THREE.MeshLambertMaterial({color: 0xA0522D});
        var bwmrOP = new THREE.Mesh(bwmrOPGeom, bwmrOPMat);
        bwmrOP.position.set(-25, 19, -20);
        scene.add(bwmrOP);
        objects.push(bwmrOP);

        // Port Ellen airstrip runway barriers (box)
        var runwayBarrier1Geom = new THREE.BoxGeometry(40, 1, 2);
        var runwayBarrierMat = new THREE.MeshLambertMaterial({color: 0x333333});
        var runwayBarrier1 = new THREE.Mesh(runwayBarrier1Geom, runwayBarrierMat);
        runwayBarrier1.position.set(15, 1, 10);
        scene.add(runwayBarrier1);
        objects.push(runwayBarrier1);

        var runwayBarrier2Geom = new THREE.BoxGeometry(40, 1, 2);
        var runwayBarrier2 = new THREE.Mesh(runwayBarrier2Geom, runwayBarrierMat);
        runwayBarrier2.position.set(15, 1, 16);
        scene.add(runwayBarrier2);
        objects.push(runwayBarrier2);

        // Port Ellen approach lights (cone)
        var approachLight1Geom = new THREE.ConeGeometry(2, 5, 8);
        var approachLightMat = new THREE.MeshLambertMaterial({color: 0xFFD700});
        var approachLight1 = new THREE.Mesh(approachLight1Geom, approachLightMat);
        approachLight1.position.set(20, 3, 5);
        scene.add(approachLight1);
        objects.push(approachLight1);

        var approachLight2Geom = new THREE.ConeGeometry(2, 5, 8);
        var approachLight2 = new THREE.Mesh(approachLight2Geom, approachLightMat);
        approachLight2.position.set(10, 3, 5);
        scene.add(approachLight2);
        objects.push(approachLight2);

        // Port Ellen wire fence (LineSegments)
        var fencePoints = [
            new THREE.Vector3(22, 2, 18),
            new THREE.Vector3(8, 2, 18),
            new THREE.Vector3(8, 6, 18),
            new THREE.Vector3(22, 6, 18),
            new THREE.Vector3(22, 2, 18)
        ];
        var fenceGeom = new THREE.BufferGeometry().setFromPoints(fencePoints);
        var fenceMat = new THREE.LineBasicMaterial({color: 0x444444});
        var fence = new THREE.LineSegments(fenceGeom, fenceMat);
        scene.add(fence);
        objects.push(fence);

        // Lagavulin Bay anti-landing barricade (box concrete blocks)
        var barricade1Geom = new THREE.BoxGeometry(6, 3, 4);
        var barricadeMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var barricade1 = new THREE.Mesh(barricade1Geom, barricadeMat);
        barricade1.position.set(-15, 2, 25);
        scene.add(barricade1);
        objects.push(barricade1);

        var barricade2Geom = new THREE.BoxGeometry(6, 3, 4);
        var barricade2 = new THREE.Mesh(barricade2Geom, barricadeMat);
        barricade2.position.set(-5, 2, 25);
        scene.add(barricade2);
        objects.push(barricade2);

        var barricade3Geom = new THREE.BoxGeometry(6, 3, 4);
        var barricade3 = new THREE.Mesh(barricade3Geom, barricadeMat);
        barricade3.position.set(5, 2, 25);
        scene.add(barricade3);
        objects.push(barricade3);

        // Whisky bonded warehouse ammo store (box long warehouse)
        var warehouseGeom = new THREE.BoxGeometry(24, 6, 10);
        var warehouseMat = new THREE.MeshLambertMaterial({color: 0xCD853F});
        var warehouse = new THREE.Mesh(warehouseGeom, warehouseMat);
        warehouse.position.set(25, 3, -5);
        scene.add(warehouse);
        objects.push(warehouse);

        // Loch Finlaggan castle island platform (box)
        var castlePlatformGeom = new THREE.BoxGeometry(30, 2, 30);
        var castlePlatformMat = new THREE.MeshLambertMaterial({color: 0x708090});
        var castlePlatform = new THREE.Mesh(castlePlatformGeom, castlePlatformMat);
        castlePlatform.position.set(-30, 0, 15);
        scene.add(castlePlatform);
        objects.push(castlePlatform);

        // Loch Finlaggan castle ruins (box walls)
        var castleWall1Geom = new THREE.BoxGeometry(25, 8, 2);
        var castleWallMat = new THREE.MeshLambertMaterial({color: 0x556B7D});
        var castleWall1 = new THREE.Mesh(castleWall1Geom, castleWallMat);
        castleWall1.position.set(-30, 4, 0);
        scene.add(castleWall1);
        objects.push(castleWall1);

        var castleWall2Geom = new THREE.BoxGeometry(2, 8, 25);
        var castleWall2 = new THREE.Mesh(castleWall2Geom, castleWallMat);
        castleWall2.position.set(-18, 4, 15);
        scene.add(castleWall2);
        objects.push(castleWall2);

        // Portnahaven lighthouse cylinder tower
        var lighthouseTowerGeom = new THREE.CylinderGeometry(4, 4, 20, 16);
        var lighthouseTowerMat = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
        var lighthouseTower = new THREE.Mesh(lighthouseTowerGeom, lighthouseTowerMat);
        lighthouseTower.position.set(30, 10, 20);
        scene.add(lighthouseTower);
        objects.push(lighthouseTower);

        // Portnahaven lighthouse cone cap
        var lighthouseCapGeom = new THREE.ConeGeometry(5, 6, 16);
        var lighthouseCapMat = new THREE.MeshLambertMaterial({color: 0xFF4500});
        var lighthouseCap = new THREE.Mesh(lighthouseCapGeom, lighthouseCapMat);
        lighthouseCap.position.set(30, 23, 20);
        scene.add(lighthouseCap);
        objects.push(lighthouseCap);

        // Portnahaven signal hut (box)
        var signalHutGeom = new THREE.BoxGeometry(6, 4, 6);
        var signalHutMat = new THREE.MeshLambertMaterial({color: 0xDC143C});
        var signalHut = new THREE.Mesh(signalHutGeom, signalHutMat);
        signalHut.position.set(30, 2, 28);
        scene.add(signalHut);
        objects.push(signalHut);

        // Peat bog IED belt - sphere charges
        var chargeGeom1 = new THREE.SphereGeometry(2, 12, 12);
        var chargeMat = new THREE.MeshLambertMaterial({color: 0x000000});
        var charge1 = new THREE.Mesh(chargeGeom1, chargeMat);
        charge1.position.set(-25, 1, 5);
        scene.add(charge1);
        objects.push(charge1);

        var chargeGeom2 = new THREE.SphereGeometry(2, 12, 12);
        var charge2 = new THREE.Mesh(chargeGeom2, chargeMat);
        charge2.position.set(-15, 1, 8);
        scene.add(charge2);
        objects.push(charge2);

        var chargeGeom3 = new THREE.SphereGeometry(2, 12, 12);
        var charge3 = new THREE.Mesh(chargeGeom3, chargeMat);
        charge3.position.set(-5, 1, 5);
        scene.add(charge3);
        objects.push(charge3);

        // Peat bog tripwires (LineSegments)
        var tripwirePoints = [
            new THREE.Vector3(-28, 1, 3),
            new THREE.Vector3(-2, 1, 3),
            new THREE.Vector3(-2, 1, 10),
            new THREE.Vector3(-28, 1, 10),
            new THREE.Vector3(-28, 1, 3)
        ];
        var tripwireGeom = new THREE.BufferGeometry().setFromPoints(tripwirePoints);
        var tripwireMat = new THREE.LineBasicMaterial({color: 0x8B4513});
        var tripwire = new THREE.LineSegments(tripwireGeom, tripwireMat);
        scene.add(tripwire);
        objects.push(tripwire);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 30, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation updates if needed
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

    return {init: init, update: update, reset: reset};
}());
