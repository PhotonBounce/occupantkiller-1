window.DochartBase = (function() {
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
        // Mountain pass box terrain
        var terrainGeom = new THREE.BoxGeometry(80, 3, 80);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x6b5d4f });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Abandoned railway line - box sleepers
        var sleeperMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        for (var i = 0; i < 8; i++) {
            var sleeperGeom = new THREE.BoxGeometry(4, 0.5, 15);
            var sleeper = new THREE.Mesh(sleeperGeom, sleeperMat);
            sleeper.position.set(-25, 0.5, -20 + i * 6);
            scene.add(sleeper);
            objects.push(sleeper);
        }

        // Railway rails - cylinders
        var railMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var leftRailGeom = new THREE.CylinderGeometry(0.4, 0.4, 50, 16);
        var leftRail = new THREE.Mesh(leftRailGeom, railMat);
        leftRail.rotation.z = Math.PI / 2;
        leftRail.position.set(-28, 1.2, -10);
        scene.add(leftRail);
        objects.push(leftRail);

        var rightRailGeom = new THREE.CylinderGeometry(0.4, 0.4, 50, 16);
        var rightRail = new THREE.Mesh(rightRailGeom, railMat);
        rightRail.rotation.z = Math.PI / 2;
        rightRail.position.set(-22, 1.2, -10);
        scene.add(rightRail);
        objects.push(rightRail);

        // Crianlarich junction command post - box station building
        var stationGeom = new THREE.BoxGeometry(12, 8, 10);
        var stationMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var station = new THREE.Mesh(stationGeom, stationMat);
        station.position.set(15, 4, 10);
        scene.add(station);
        objects.push(station);

        // Water tower - cylinder
        var towerGeom = new THREE.CylinderGeometry(3, 3.5, 14, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(25, 7, 8);
        scene.add(tower);
        objects.push(tower);

        // Mountain artillery battery - box gun emplacements on hillside
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        for (var i = 0; i < 3; i++) {
            var emplaceGeom = new THREE.BoxGeometry(6, 2, 8);
            var emplace = new THREE.Mesh(emplaceGeom, emplaceementMat);
            emplace.position.set(-5 + i * 8, 3, 25);
            scene.add(emplace);
            objects.push(emplace);
        }

        // Gun barrels - cylinders on emplacements
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        for (var i = 0; i < 3; i++) {
            var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 12);
            var barrel = new THREE.Mesh(barrelGeom, barrelMat);
            barrel.rotation.z = Math.PI / 6;
            barrel.position.set(-5 + i * 8, 5, 30);
            scene.add(barrel);
            objects.push(barrel);
        }

        // Rock-fall trap - sphere boulders on ridge
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        for (var i = 0; i < 5; i++) {
            var boulderGeom = new THREE.SphereGeometry(2.5 + i * 0.5, 16, 16);
            var boulder = new THREE.Mesh(boulderGeom, boulderMat);
            boulder.position.set(-30 + i * 12, 2 + i * 1.5, -30 + i * 3);
            scene.add(boulder);
            objects.push(boulder);
        }

        // Highland cattle stampede barrier - box wooden corrals
        var corralMat = new THREE.MeshLambertMaterial({ color: 0xa0522d });
        for (var i = 0; i < 4; i++) {
            var corralGeom = new THREE.BoxGeometry(3, 2.5, 20);
            var corral = new THREE.Mesh(corralGeom, corralMat);
            corral.position.set(25 + i * 6, 1.25, -15);
            scene.add(corral);
            objects.push(corral);
        }

        // Peat bog minefield - sphere mines at ground level
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x2f2f2f });
        for (var i = 0; i < 6; i++) {
            var mineGeom = new THREE.SphereGeometry(0.7, 12, 12);
            var mine = new THREE.Mesh(mineGeom, mineMat);
            mine.position.set(-15 + i * 8, 0.8, 5);
            scene.add(mine);
            objects.push(mine);
        }

        // Peat bog minefield - tripwires as LineSegments
        var wireGeom = new THREE.BufferGeometry();
        var wireVerts = [
            -15, 1.2, 5,   -17, 1.2, 7,
            -7, 1.2, 5,    -5, 1.2, 7,
            1, 1.2, 5,     3, 1.2, 7,
            9, 1.2, 5,     11, 1.2, 7,
            17, 1.2, 5,    19, 1.2, 7,
            25, 1.2, 5,    27, 1.2, 7
        ];
        wireGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wireVerts), 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0x8b0000, linewidth: 2 });
        var tripwires = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(tripwires);
        objects.push(tripwires);

        // Aerial ropeway supply line - cylinder pylons
        var pylonMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var pylon1Geom = new THREE.CylinderGeometry(1.5, 1.8, 16, 16);
        var pylon1 = new THREE.Mesh(pylon1Geom, pylonMat);
        pylon1.position.set(-30, 8, -20);
        scene.add(pylon1);
        objects.push(pylon1);

        var pylon2Geom = new THREE.CylinderGeometry(1.5, 1.8, 16, 16);
        var pylon2 = new THREE.Mesh(pylon2Geom, pylonMat);
        pylon2.position.set(30, 12, 20);
        scene.add(pylon2);
        objects.push(pylon2);

        // Aerial ropeway cable - LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cableVerts = [
            -30, 16, -20,
            0, 14, 0,
            30, 20, 20
        ];
        cableGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cableVerts), 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x696969, linewidth: 3 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Cone structures - command observation posts
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var coneGeom = new THREE.ConeGeometry(2, 6, 16);
        var cone1 = new THREE.Mesh(coneGeom, coneMat);
        cone1.position.set(-20, 3, -5);
        scene.add(cone1);
        objects.push(cone1);

        var cone2 = new THREE.Mesh(coneGeom, coneMat);
        cone2.position.set(20, 3, 15);
        scene.add(cone2);
        objects.push(cone2);

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
        // Animate rotating barrel
        if (objects.length > 10) {
            objects[10].rotation.y += 0.5 * delta;
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
