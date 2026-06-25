window.BathRoman = (function() {
    'use strict';

    var WORLD_X = 3550;
    var WORLD_Z = 2200;

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, mat);
    }

    function buildRomanBaths(scene) {
        var poolGeo = new THREE.BoxGeometry(14, 1, 8);
        var pool = makeMesh(poolGeo, 0x2A8A5A);
        pool.position.set(WORLD_X + 0, 1.5, WORLD_Z + 0);
        scene.add(pool);

        var wallColor = 0x888878;
        var wallPositions = [
            [0, 3, -5],
            [0, 3, 5],
            [-8, 3, 0],
            [8, 3, 0]
        ];
        var wallSizes = [
            [14, 5, 1],
            [14, 5, 1],
            [1, 5, 8],
            [1, 5, 8]
        ];
        for (var wi = 0; wi < wallPositions.length; wi++) {
            var wgeo = new THREE.BoxGeometry(wallSizes[wi][0], wallSizes[wi][1], wallSizes[wi][2]);
            var wall = makeMesh(wgeo, wallColor);
            wall.position.set(WORLD_X + wallPositions[wi][0], wallPositions[wi][1], WORLD_Z + wallPositions[wi][2]);
            scene.add(wall);
        }

        var colColor = 0x9A9A8A;
        var colPositions = [
            [-6, 0, -4], [-3, 0, -4], [0, 0, -4], [3, 0, -4], [6, 0, -4],
            [-6, 0, 4],  [-3, 0, 4],  [0, 0, 4],  [3, 0, 4],  [6, 0, 4],
            [-7, 0, -2], [-7, 0, 2],
            [7, 0, -2],  [7, 0, 2]
        ];
        for (var ci = 0; ci < colPositions.length; ci++) {
            var cgeo = new THREE.CylinderGeometry(1, 1, 6, 8);
            var col = makeMesh(cgeo, colColor);
            col.position.set(WORLD_X + colPositions[ci][0], 3, WORLD_Z + colPositions[ci][2]);
            scene.add(col);
        }
    }

    function buildBathAbbey(scene) {
        var abbeyColor = 0xD4C080;

        var bodyGeo = new THREE.BoxGeometry(28, 16, 10);
        var body = makeMesh(bodyGeo, abbeyColor);
        body.position.set(WORLD_X + 30, 8, WORLD_Z + 5);
        scene.add(body);

        var towerGeo = new THREE.BoxGeometry(8, 24, 8);
        var tower = makeMesh(towerGeo, abbeyColor);
        tower.position.set(WORLD_X + 30, 12, WORLD_Z + 5);
        scene.add(tower);

        var vaultCapGeo = new THREE.CylinderGeometry(4, 4, 2, 8);
        var vaultCap = makeMesh(vaultCapGeo, abbeyColor);
        vaultCap.position.set(WORLD_X + 30, 25, WORLD_Z + 5);
        scene.add(vaultCap);

        var facadeGeo = new THREE.BoxGeometry(28, 20, 1);
        var facade = makeMesh(facadeGeo, abbeyColor);
        facade.position.set(WORLD_X + 30, 10, WORLD_Z - 0.5);
        scene.add(facade);

        var angelPositions = [
            [-6, 0], [-3, 4], [0, 8], [3, 4], [6, 0],
            [-6, 4], [-3, 8], [3, 8], [6, 4]
        ];
        for (var ai = 0; ai < angelPositions.length; ai++) {
            var bodyCylGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 6);
            var bodyCyl = makeMesh(bodyCylGeo, 0xE0D8B0);
            bodyCyl.position.set(WORLD_X + 30 + angelPositions[ai][0], 4 + angelPositions[ai][1], WORLD_Z - 1);
            scene.add(bodyCyl);

            var headGeo = new THREE.SphereGeometry(0.3, 6, 6);
            var head = makeMesh(headGeo, 0xE0D8B0);
            head.position.set(WORLD_X + 30 + angelPositions[ai][0], 5.2 + angelPositions[ai][1], WORLD_Z - 1);
            scene.add(head);
        }
    }

    function buildRoyalCrescent(scene) {
        var stoneColor = 0xD4C080;
        var houseCount = 30;
        var radius = 60;
        var arcStart = Math.PI * 0.85;
        var arcEnd = Math.PI * 0.15;

        for (var hi = 0; hi < houseCount; hi++) {
            var t = hi / (houseCount - 1);
            var angle = arcStart + t * (arcEnd - arcStart);
            var hx = WORLD_X - 80 + Math.cos(angle) * radius;
            var hz = WORLD_Z - 60 + Math.sin(angle) * radius;

            var houseGeo = new THREE.BoxGeometry(5, 6, 4);
            var house = makeMesh(houseGeo, stoneColor);
            house.position.set(hx, 3, hz);
            scene.add(house);

            var colGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 6);
            var col1 = makeMesh(colGeo, stoneColor);
            col1.position.set(hx - 1, 2.5, hz - 2);
            scene.add(col1);

            var col2geo = new THREE.CylinderGeometry(0.2, 0.2, 5, 6);
            var col2 = makeMesh(col2geo, stoneColor);
            col2.position.set(hx + 1, 2.5, hz - 2);
            scene.add(col2);
        }
    }

    function buildPumpRoom(scene) {
        var stoneColor = 0xD4C080;

        var bodyGeo = new THREE.BoxGeometry(18, 8, 12);
        var body = makeMesh(bodyGeo, stoneColor);
        body.position.set(WORLD_X + 10, 4, WORLD_Z + 20);
        scene.add(body);

        var colPositions = [-6, -2, 2, 6];
        for (var pi = 0; pi < colPositions.length; pi++) {
            var cgeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
            var col = makeMesh(cgeo, stoneColor);
            col.position.set(WORLD_X + 10 + colPositions[pi], 4, WORLD_Z + 14);
            scene.add(col);
        }

        var roofGeo = new THREE.BoxGeometry(20, 1, 14);
        var roof = makeMesh(roofGeo, stoneColor);
        roof.position.set(WORLD_X + 10, 8.5, WORLD_Z + 20);
        scene.add(roof);

        var pedGeo = new THREE.BoxGeometry(20, 2, 2);
        var ped = makeMesh(pedGeo, stoneColor);
        ped.position.set(WORLD_X + 10, 9.5, WORLD_Z + 14);
        scene.add(ped);
    }

    function buildPulteneyBridge(scene) {
        var stoneColor = 0xD4C080;

        var deckGeo = new THREE.BoxGeometry(20, 5, 8);
        var deck = makeMesh(deckGeo, stoneColor);
        deck.position.set(WORLD_X - 20, 2.5, WORLD_Z + 30);
        scene.add(deck);

        var pierPositions = [-6, 0, 6];
        for (var pi = 0; pi < pierPositions.length; pi++) {
            var pgeo = new THREE.BoxGeometry(2, 4, 3);
            var pier = makeMesh(pgeo, 0x888878);
            pier.position.set(WORLD_X - 20 + pierPositions[pi], 0, WORLD_Z + 30);
            scene.add(pier);

            var archGeo = new THREE.CylinderGeometry(1.5, 1.5, 2, 8, 1, false, 0, Math.PI);
            var arch = makeMesh(archGeo, 0x888878);
            arch.rotation.z = Math.PI / 2;
            arch.position.set(WORLD_X - 20 + pierPositions[pi], 2, WORLD_Z + 30);
            scene.add(arch);
        }

        var windowPositions = [-8, -4, 0, 4, 8];
        for (var wvi = 0; wvi < windowPositions.length; wvi++) {
            var winGeo = new THREE.BoxGeometry(1.5, 3, 0.3);
            var win = makeMesh(winGeo, 0xC8B060);
            win.position.set(WORLD_X - 20 + windowPositions[wvi], 3.5, WORLD_Z + 26);
            scene.add(win);

            var winTopGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.3, 6, 1, false, 0, Math.PI);
            var winTop = makeMesh(winTopGeo, 0xC8B060);
            winTop.rotation.x = Math.PI / 2;
            winTop.position.set(WORLD_X - 20 + windowPositions[wvi], 5.1, WORLD_Z + 26);
            scene.add(winTop);
        }
    }

    function buildThermaeSpaBath(scene) {
        var buildingGeo = new THREE.BoxGeometry(12, 14, 10);
        var building = makeMesh(buildingGeo, 0xB0C8C8);
        building.position.set(WORLD_X - 10, 7, WORLD_Z + 50);
        scene.add(building);

        var roofPoolGeo = new THREE.BoxGeometry(12, 1, 8);
        var roofPool = makeMesh(roofPoolGeo, 0x2A8AAA);
        roofPool.position.set(WORLD_X - 10, 14.5, WORLD_Z + 50);
        scene.add(roofPool);

        var steamPositions = [
            [-4, 0], [-2, 0], [0, 0], [2, 0], [4, 0],
            [-3, -2], [-1, -2], [1, -2], [3, -2]
        ];
        for (var si = 0; si < steamPositions.length; si++) {
            var steamGeo = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 6, 6);
            var steam = makeMesh(steamGeo, 0xDDEEEE);
            steam.position.set(
                WORLD_X - 10 + steamPositions[si][0],
                15.5 + (si % 3) * 0.5,
                WORLD_Z + 50 + steamPositions[si][1]
            );
            scene.add(steam);
        }
    }

    function buildGroundPlate(scene) {
        var groundGeo = new THREE.BoxGeometry(300, 0.5, 300);
        var ground = makeMesh(groundGeo, 0xB0A870);
        ground.position.set(WORLD_X, -0.25, WORLD_Z);
        scene.add(ground);
    }

    function build(scene) {
        buildGroundPlate(scene);
        buildRomanBaths(scene);
        buildBathAbbey(scene);
        buildRoyalCrescent(scene);
        buildPumpRoom(scene);
        buildPulteneyBridge(scene);
        buildThermaeSpaBath(scene);
    }

    return {
        build: build,
        worldX: WORLD_X,
        worldZ: WORLD_Z
    };

}());
