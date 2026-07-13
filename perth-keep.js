window.PerthKeep = (function() {
    'use strict';

    var WORLD_X = 1870;
    var WORLD_Z = 2200;

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, mat);
    }

    function buildSconePalace(scene) {
        var sandstone = 0xD4A97A;
        var darkStone = 0xB8956A;

        // Main palace body
        var bodyGeo = new THREE.BoxGeometry(30, 12, 16);
        var body = makeMesh(bodyGeo, sandstone);
        body.position.set(WORLD_X - 120, 6, WORLD_Z - 80);
        scene.add(body);

        // Central tower
        var towerGeo = new THREE.BoxGeometry(8, 20, 8);
        var tower = makeMesh(towerGeo, sandstone);
        tower.position.set(WORLD_X - 120, 10, WORLD_Z - 80);
        scene.add(tower);

        // Tower battlements (top of central tower)
        var battGeo = new THREE.BoxGeometry(10, 2, 10);
        var batt = makeMesh(battGeo, darkStone);
        batt.position.set(WORLD_X - 120, 21, WORLD_Z - 80);
        scene.add(batt);

        // Left wing
        var leftWingGeo = new THREE.BoxGeometry(10, 9, 12);
        var leftWing = makeMesh(leftWingGeo, sandstone);
        leftWing.position.set(WORLD_X - 135, 4.5, WORLD_Z - 80);
        scene.add(leftWing);

        // Right wing
        var rightWingGeo = new THREE.BoxGeometry(10, 9, 12);
        var rightWing = makeMesh(rightWingGeo, sandstone);
        rightWing.position.set(WORLD_X - 105, 4.5, WORLD_Z - 80);
        scene.add(rightWing);

        // Left corner turret
        var lTurretGeo = new THREE.CylinderGeometry(1.5, 1.5, 14, 8);
        var lTurret = makeMesh(lTurretGeo, sandstone);
        lTurret.position.set(WORLD_X - 143, 7, WORLD_Z - 86);
        scene.add(lTurret);

        // Right corner turret
        var rTurretGeo = new THREE.CylinderGeometry(1.5, 1.5, 14, 8);
        var rTurret = makeMesh(rTurretGeo, sandstone);
        rTurret.position.set(WORLD_X - 97, 7, WORLD_Z - 86);
        scene.add(rTurret);

        // Left turret cap
        var lCapGeo = new THREE.ConeGeometry(2, 3, 8);
        var lCap = makeMesh(lCapGeo, darkStone);
        lCap.position.set(WORLD_X - 143, 15.5, WORLD_Z - 86);
        scene.add(lCap);

        // Right turret cap
        var rCapGeo = new THREE.ConeGeometry(2, 3, 8);
        var rCap = makeMesh(rCapGeo, darkStone);
        rCap.position.set(WORLD_X - 97, 15.5, WORLD_Z - 86);
        scene.add(rCap);

        // Decorative battlement row along main roof
        var battCount = 6;
        var i;
        for (i = 0; i < battCount; i++) {
            var merlonGeo = new THREE.BoxGeometry(2, 2, 1);
            var merlon = makeMesh(merlonGeo, darkStone);
            merlon.position.set(WORLD_X - 132 + i * 5, 13, WORLD_Z - 72);
            scene.add(merlon);
        }

        // Formal garden maze — box hedges in grid pattern
        var hedgeColor = 0x2D5A1B;
        var gx, gz;
        // Outer hedge border segments (north side)
        for (gx = 0; gx < 5; gx++) {
            var hedgeNGeo = new THREE.BoxGeometry(6, 2, 1);
            var hedgeN = makeMesh(hedgeNGeo, hedgeColor);
            hedgeN.position.set(WORLD_X - 148 + gx * 7, 1, WORLD_Z - 110 + 0);
            scene.add(hedgeN);
        }
        // Outer hedge border segments (south side)
        for (gx = 0; gx < 5; gx++) {
            var hedgeSGeo = new THREE.BoxGeometry(6, 2, 1);
            var hedgeS = makeMesh(hedgeSGeo, hedgeColor);
            hedgeS.position.set(WORLD_X - 148 + gx * 7, 1, WORLD_Z - 60);
            scene.add(hedgeS);
        }
        // Internal cross hedges (east-west)
        for (gz = 0; gz < 3; gz++) {
            var hedgeEWGeo = new THREE.BoxGeometry(30, 2, 1);
            var hedgeEW = makeMesh(hedgeEWGeo, hedgeColor);
            hedgeEW.position.set(WORLD_X - 120, 1, WORLD_Z - 100 + gz * 14);
            scene.add(hedgeEW);
        }
        // Internal cross hedges (north-south)
        for (gx = 0; gx < 3; gx++) {
            var hedgeNSGeo = new THREE.BoxGeometry(1, 2, 28);
            var hedgeNS = makeMesh(hedgeNSGeo, hedgeColor);
            hedgeNS.position.set(WORLD_X - 136 + gx * 14, 1, WORLD_Z - 86);
            scene.add(hedgeNS);
        }
    }

    function buildMootHill(scene) {
        // Artificial coronation mound — tall box hill
        var hillGeo = new THREE.BoxGeometry(24, 14, 24);
        var hill = makeMesh(hillGeo, 0x5C7A3A);
        hill.position.set(WORLD_X - 60, 7, WORLD_Z - 60);
        scene.add(hill);

        // Grassy slopes represented as slightly wider flatter boxes
        var slope1Geo = new THREE.BoxGeometry(30, 6, 30);
        var slope1 = makeMesh(slope1Geo, 0x4E6B30);
        slope1.position.set(WORLD_X - 60, 3, WORLD_Z - 60);
        scene.add(slope1);

        // Stone of Destiny marker (small stone block on top)
        var stoneGeo = new THREE.BoxGeometry(2, 1.5, 3);
        var stone = makeMesh(stoneGeo, 0x7A6A5A);
        stone.position.set(WORLD_X - 60, 15, WORLD_Z - 60);
        scene.add(stone);

        // Flagpole base
        var flagBaseGeo = new THREE.CylinderGeometry(0.3, 0.4, 12, 6);
        var flagBase = makeMesh(flagBaseGeo, 0xAAAAAA);
        flagBase.position.set(WORLD_X - 56, 20, WORLD_Z - 57);
        scene.add(flagBase);

        // Flag (small box)
        var flagGeo = new THREE.BoxGeometry(3, 1.5, 0.1);
        var flag = makeMesh(flagGeo, 0x0033CC);
        flag.position.set(WORLD_X - 54.5, 25.5, WORLD_Z - 57);
        scene.add(flag);
    }

    function buildPerthBridge(scene) {
        var bridgeColor = 0x9A8A78;
        var darkBridge = 0x7A6A58;

        // Main bridge deck — long box 50×3×6
        var deckGeo = new THREE.BoxGeometry(50, 3, 6);
        var deck = makeMesh(deckGeo, bridgeColor);
        deck.position.set(WORLD_X + 40, 5, WORLD_Z + 20);
        scene.add(deck);

        // Bridge parapets (sides)
        var parapet1Geo = new THREE.BoxGeometry(50, 1.5, 0.5);
        var parapet1 = makeMesh(parapet1Geo, darkBridge);
        parapet1.position.set(WORLD_X + 40, 7, WORLD_Z + 17);
        scene.add(parapet1);

        var parapet2Geo = new THREE.BoxGeometry(50, 1.5, 0.5);
        var parapet2 = makeMesh(parapet2Geo, darkBridge);
        parapet2.position.set(WORLD_X + 40, 7, WORLD_Z + 23);
        scene.add(parapet2);

        // 9 arch piers below the bridge deck
        var i;
        for (i = 0; i < 9; i++) {
            var pierGeo = new THREE.BoxGeometry(2.5, 5, 4);
            var pier = makeMesh(pierGeo, darkBridge);
            pier.position.set(WORLD_X + 15 + i * 5.5, 1.5, WORLD_Z + 20);
            scene.add(pier);
        }

        // Arch voussoir caps (decorative top of each pier arch)
        for (i = 0; i < 9; i++) {
            var archCapGeo = new THREE.BoxGeometry(4, 1, 5);
            var archCap = makeMesh(archCapGeo, bridgeColor);
            archCap.position.set(WORLD_X + 15 + i * 5.5, 4.2, WORLD_Z + 20);
            scene.add(archCap);
        }

        // Bank abutments
        var abutLeft = new THREE.BoxGeometry(4, 6, 8);
        var abutLeftMesh = makeMesh(abutLeft, darkBridge);
        abutLeftMesh.position.set(WORLD_X + 14, 3, WORLD_Z + 20);
        scene.add(abutLeftMesh);

        var abutRight = new THREE.BoxGeometry(4, 6, 8);
        var abutRightMesh = makeMesh(abutRight, darkBridge);
        abutRightMesh.position.set(WORLD_X + 65, 3, WORLD_Z + 20);
        scene.add(abutRightMesh);
    }

    function buildFairMaidsHouse(scene) {
        var sandstone = 0xD4A97A;
        var timberColor = 0x5C3A1E;
        var plasterColor = 0xF0E8D0;

        // Main house body box 8×7×6
        var houseGeo = new THREE.BoxGeometry(8, 7, 6);
        var house = makeMesh(houseGeo, sandstone);
        house.position.set(WORLD_X + 10, 3.5, WORLD_Z - 30);
        scene.add(house);

        // Upper storey slightly wider (jettying)
        var upperGeo = new THREE.BoxGeometry(9, 3, 7);
        var upper = makeMesh(upperGeo, plasterColor);
        upper.position.set(WORLD_X + 10, 8.5, WORLD_Z - 30);
        scene.add(upper);

        // Roof
        var roofGeo = new THREE.BoxGeometry(10, 2, 8);
        var roof = makeMesh(roofGeo, timberColor);
        roof.position.set(WORLD_X + 10, 11, WORLD_Z - 30);
        scene.add(roof);

        // Timber framing details — vertical beams on upper storey
        var beamColor = timberColor;
        var bi;
        for (bi = 0; bi < 4; bi++) {
            var beamGeo = new THREE.BoxGeometry(0.3, 3, 0.3);
            var beam = makeMesh(beamGeo, beamColor);
            beam.position.set(WORLD_X + 6.5 + bi * 1.2, 8.5, WORLD_Z - 26.4);
            scene.add(beam);
        }

        // Horizontal timber rail
        var railGeo = new THREE.BoxGeometry(9, 0.3, 0.3);
        var rail = makeMesh(railGeo, beamColor);
        rail.position.set(WORLD_X + 10, 7.5, WORLD_Z - 26.4);
        scene.add(rail);

        // Chimney stack
        var chimneyGeo = new THREE.BoxGeometry(1.5, 4, 1.5);
        var chimney = makeMesh(chimneyGeo, 0x8A6A5A);
        chimney.position.set(WORLD_X + 13, 13, WORLD_Z - 30);
        scene.add(chimney);

        // Small entrance porch
        var porchGeo = new THREE.BoxGeometry(2, 3, 2);
        var porch = makeMesh(porchGeo, sandstone);
        porch.position.set(WORLD_X + 10, 1.5, WORLD_Z - 26.5);
        scene.add(porch);
    }

    function buildPerthPrison(scene) {
        var wallColor = 0x8A8A8A;
        var darkWall = 0x6A6A6A;

        // Perimeter walls — 4 sides (box 4×8×40)
        // North wall
        var northWallGeo = new THREE.BoxGeometry(40, 8, 4);
        var northWall = makeMesh(northWallGeo, wallColor);
        northWall.position.set(WORLD_X + 80, 4, WORLD_Z - 40);
        scene.add(northWall);

        // South wall
        var southWallGeo = new THREE.BoxGeometry(40, 8, 4);
        var southWall = makeMesh(southWallGeo, wallColor);
        southWall.position.set(WORLD_X + 80, 4, WORLD_Z);
        scene.add(southWall);

        // West wall
        var westWallGeo = new THREE.BoxGeometry(4, 8, 40);
        var westWall = makeMesh(westWallGeo, wallColor);
        westWall.position.set(WORLD_X + 60, 4, WORLD_Z - 20);
        scene.add(westWall);

        // East wall
        var eastWallGeo = new THREE.BoxGeometry(4, 8, 40);
        var eastWall = makeMesh(eastWallGeo, wallColor);
        eastWall.position.set(WORLD_X + 100, 4, WORLD_Z - 20);
        scene.add(eastWall);

        // Corner watchtowers — 4 corners
        var corners = [
            [WORLD_X + 60, WORLD_Z - 40],
            [WORLD_X + 100, WORLD_Z - 40],
            [WORLD_X + 60, WORLD_Z],
            [WORLD_X + 100, WORLD_Z]
        ];
        var ci;
        for (ci = 0; ci < corners.length; ci++) {
            var towerGeo = new THREE.CylinderGeometry(3, 3, 12, 8);
            var watchTower = makeMesh(towerGeo, darkWall);
            watchTower.position.set(corners[ci][0], 6, corners[ci][1]);
            scene.add(watchTower);

            var capGeo = new THREE.ConeGeometry(3.5, 3, 8);
            var cap = makeMesh(capGeo, 0x5A5A5A);
            cap.position.set(corners[ci][0], 13.5, corners[ci][1]);
            scene.add(cap);

            // Watchtower battlements ring
            var ringGeo = new THREE.CylinderGeometry(3.3, 3.3, 1.5, 8);
            var ring = makeMesh(ringGeo, darkWall);
            ring.position.set(corners[ci][0], 12.75, corners[ci][1]);
            scene.add(ring);
        }

        // Prison cell block inside compound
        var blockGeo = new THREE.BoxGeometry(22, 10, 18);
        var cellBlock = makeMesh(blockGeo, 0x909090);
        cellBlock.position.set(WORLD_X + 80, 5, WORLD_Z - 20);
        scene.add(cellBlock);

        // Cell block roof
        var blockRoofGeo = new THREE.BoxGeometry(23, 2, 19);
        var blockRoof = makeMesh(blockRoofGeo, darkWall);
        blockRoof.position.set(WORLD_X + 80, 11, WORLD_Z - 20);
        scene.add(blockRoof);

        // Gatehouse above south entrance
        var gateGeo = new THREE.BoxGeometry(8, 10, 5);
        var gate = makeMesh(gateGeo, wallColor);
        gate.position.set(WORLD_X + 80, 5, WORLD_Z);
        scene.add(gate);
    }

    function build(scene) {
        buildSconePalace(scene);
        buildMootHill(scene);
        buildPerthBridge(scene);
        buildFairMaidsHouse(scene);
        buildPerthPrison(scene);
    }

    return {
        build: build
    };
}());
