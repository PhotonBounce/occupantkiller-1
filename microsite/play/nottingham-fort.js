window.NottinghamFort = (function() {
    'use strict';

    var WORLD_X = 2920;
    var WORLD_Z = 2200;

    function createMesh(geometry, color, options) {
        var matOpts = { color: color };
        if (options && options.emissive) matOpts.emissive = options.emissive;
        var mat = new THREE.MeshLambertMaterial(matOpts);
        return new THREE.Mesh(geometry, mat);
    }

    function buildCastleRock(group) {
        var rockGeo = new THREE.BoxGeometry(30, 12, 20);
        var rock = createMesh(rockGeo, 0xD4A97A);
        rock.position.set(WORLD_X, 6, WORLD_Z);
        group.add(rock);

        var mansionGeo = new THREE.BoxGeometry(22, 10, 14);
        var mansion = createMesh(mansionGeo, 0xC49060);
        mansion.position.set(WORLD_X, 17, WORLD_Z);
        group.add(mansion);

        var roofGeo = new THREE.BoxGeometry(22, 2, 14);
        var roof = createMesh(roofGeo, 0x8B6914);
        roof.position.set(WORLD_X, 23, WORLD_Z);
        group.add(roof);

        var parapet1Geo = new THREE.BoxGeometry(24, 1.5, 1);
        var parapet1 = createMesh(parapet1Geo, 0xC49060);
        parapet1.position.set(WORLD_X, 25, WORLD_Z - 7.5);
        group.add(parapet1);

        var parapet2 = createMesh(new THREE.BoxGeometry(24, 1.5, 1), 0xC49060);
        parapet2.position.set(WORLD_X, 25, WORLD_Z + 7.5);
        group.add(parapet2);

        var parapet3 = createMesh(new THREE.BoxGeometry(1, 1.5, 14), 0xC49060);
        parapet3.position.set(WORLD_X - 12, 25, WORLD_Z);
        group.add(parapet3);

        var parapet4 = createMesh(new THREE.BoxGeometry(1, 1.5, 14), 0xC49060);
        parapet4.position.set(WORLD_X + 12, 25, WORLD_Z);
        group.add(parapet4);
    }

    function buildGatehouse(group) {
        var gx = WORLD_X;
        var gz = WORLD_Z + 12;

        var tower1Geo = new THREE.CylinderGeometry(3, 3, 14, 8);
        var tower1 = createMesh(tower1Geo, 0xD4A97A);
        tower1.position.set(gx - 4, 7, gz);
        group.add(tower1);

        var tower2Geo = new THREE.CylinderGeometry(3, 3, 14, 8);
        var tower2 = createMesh(tower2Geo, 0xD4A97A);
        tower2.position.set(gx + 4, 7, gz);
        group.add(tower2);

        var gateBoxGeo = new THREE.BoxGeometry(8, 12, 3);
        var gateBox = createMesh(gateBoxGeo, 0xC49060);
        gateBox.position.set(gx, 6, gz);
        group.add(gateBox);

        var archGeo = new THREE.BoxGeometry(3, 6, 3.5);
        var arch = createMesh(archGeo, 0x1A1A1A);
        arch.position.set(gx, 3, gz);
        group.add(arch);

        var cap1Geo = new THREE.ConeGeometry(3.2, 4, 8);
        var cap1 = createMesh(cap1Geo, 0x8B6914);
        cap1.position.set(gx - 4, 16, gz);
        group.add(cap1);

        var cap2Geo = new THREE.ConeGeometry(3.2, 4, 8);
        var cap2 = createMesh(cap2Geo, 0x8B6914);
        cap2.position.set(gx + 4, 16, gz);
        group.add(cap2);
    }

    function buildRobinHoodStatue(group) {
        var sx = WORLD_X + 2;
        var sz = WORLD_Z + 20;

        var baseGeo = new THREE.BoxGeometry(2, 1, 2);
        var base = createMesh(baseGeo, 0x5A3A1A);
        base.position.set(sx, 0.5, sz);
        group.add(base);

        var bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 2.2, 8);
        var body = createMesh(bodyGeo, 0x7A5A2A);
        body.position.set(sx, 2.1, sz);
        group.add(body);

        var headGeo = new THREE.SphereGeometry(0.45, 8, 8);
        var head = createMesh(headGeo, 0x7A5A2A);
        head.position.set(sx, 3.5, sz);
        group.add(head);

        var hatGeo = new THREE.ConeGeometry(0.5, 0.6, 8);
        var hat = createMesh(hatGeo, 0x3A5A1A);
        hat.position.set(sx, 4.2, sz);
        group.add(hat);

        var bowGeo = new THREE.BoxGeometry(0.1, 2, 0.1);
        var bow = createMesh(bowGeo, 0x7A5A2A);
        bow.position.set(sx + 0.6, 2.5, sz);
        group.add(bow);

        var arrowGeo = new THREE.BoxGeometry(0.08, 0.08, 1.5);
        var arrow = createMesh(arrowGeo, 0x7A5A2A);
        arrow.position.set(sx + 0.6, 2.8, sz - 0.4);
        group.add(arrow);

        var armGeo = new THREE.BoxGeometry(0.8, 0.15, 0.15);
        var arm = createMesh(armGeo, 0x7A5A2A);
        arm.position.set(sx + 0.25, 2.5, sz);
        group.add(arm);
    }

    function buildMajorOak(group) {
        var ox = WORLD_X - 40;
        var oz = WORLD_Z - 30;

        var trunkGeo = new THREE.CylinderGeometry(2.5, 3.5, 8, 10);
        var trunk = createMesh(trunkGeo, 0x4A3520);
        trunk.position.set(ox, 4, oz);
        group.add(trunk);

        var canopyGeo = new THREE.SphereGeometry(7, 10, 10);
        var canopy = createMesh(canopyGeo, 0x2A5A1A);
        canopy.position.set(ox, 13, oz);
        group.add(canopy);

        var canopy2Geo = new THREE.SphereGeometry(5, 8, 8);
        var canopy2 = createMesh(canopy2Geo, 0x1A4A0A);
        canopy2.position.set(ox - 4, 11, oz + 3);
        group.add(canopy2);

        var canopy3Geo = new THREE.SphereGeometry(4.5, 8, 8);
        var canopy3 = createMesh(canopy3Geo, 0x2A5A1A);
        canopy3.position.set(ox + 3, 10, oz - 3);
        group.add(canopy3);

        var hollowGeo = new THREE.BoxGeometry(1.5, 2.5, 1.5);
        var hollow = createMesh(hollowGeo, 0x1A1A1A);
        hollow.position.set(ox, 1.5, oz + 3.4);
        group.add(hollow);

        var poleOffsets = [
            [-5, oz + 4],
            [5, oz - 4],
            [-4, oz - 5],
            [4, oz + 5]
        ];
        for (var pi = 0; pi < poleOffsets.length; pi++) {
            var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
            var pole = createMesh(poleGeo, 0x5A3A10);
            pole.position.set(ox + poleOffsets[pi][0], 2.5, poleOffsets[pi][1]);
            group.add(pole);
        }
    }

    function buildCaveEntrances(group) {
        var caveData = [
            [WORLD_X - 18, 2, WORLD_Z + 5],
            [WORLD_X - 22, 3, WORLD_Z + 2],
            [WORLD_X - 15, 1.5, WORLD_Z + 8],
            [WORLD_X - 25, 4, WORLD_Z - 1],
            [WORLD_X - 20, 2.5, WORLD_Z - 3]
        ];

        for (var ci = 0; ci < caveData.length; ci++) {
            var cw = 2.5 + Math.random() * 1.5;
            var ch = 2 + Math.random() * 1.5;
            var caveGeo = new THREE.BoxGeometry(cw, ch, 1.5);
            var cave = createMesh(caveGeo, 0x1A1A1A);
            cave.position.set(caveData[ci][0], caveData[ci][1], caveData[ci][2]);
            group.add(cave);

            var surround = createMesh(new THREE.BoxGeometry(cw + 1, ch + 1, 0.5), 0xD4A97A);
            surround.position.set(caveData[ci][0], caveData[ci][1], caveData[ci][2] + 0.5);
            group.add(surround);
        }

        var cliffGeo = new THREE.BoxGeometry(20, 14, 3);
        var cliff = createMesh(cliffGeo, 0xD4A97A);
        cliff.position.set(WORLD_X - 20, 6, WORLD_Z + 3);
        group.add(cliff);
    }

    function buildTrentBridge(group) {
        var tx = WORLD_X + 80;
        var tz = WORLD_Z + 60;

        var grandstandGeo = new THREE.BoxGeometry(50, 8, 10);
        var grandstand = createMesh(grandstandGeo, 0xF5F5F5);
        grandstand.position.set(tx, 4, tz);
        group.add(grandstand);

        var roofGeo = new THREE.BoxGeometry(52, 1, 11);
        var grandRoof = createMesh(roofGeo, 0xCCCCCC);
        grandRoof.position.set(tx, 8.5, tz);
        group.add(grandRoof);

        var scoreboardGeo = new THREE.BoxGeometry(8, 10, 1);
        var scoreboard = createMesh(scoreboardGeo, 0x2A2A2A);
        scoreboard.position.set(tx + 32, 5, tz);
        group.add(scoreboardGeo);
        group.add(scoreboard);

        var boardFaceGeo = new THREE.BoxGeometry(6, 7, 0.3);
        var boardFace = createMesh(boardFaceGeo, 0xFFFF00);
        boardFace.position.set(tx + 32, 6, tz - 0.7);
        group.add(boardFace);

        var floodlightPositions = [
            [tx - 30, tz - 20],
            [tx + 30, tz - 20],
            [tx - 30, tz + 20],
            [tx + 30, tz + 20]
        ];

        for (var fi = 0; fi < floodlightPositions.length; fi++) {
            var poleGeo = new THREE.CylinderGeometry(0.3, 0.4, 20, 6);
            var floodPole = createMesh(poleGeo, 0x888888);
            floodPole.position.set(floodlightPositions[fi][0], 10, floodlightPositions[fi][1]);
            group.add(floodPole);

            var lightHeadGeo = new THREE.BoxGeometry(3, 0.5, 2);
            var lightHead = createMesh(lightHeadGeo, 0xFFFFDD);
            lightHead.position.set(floodlightPositions[fi][0], 21, floodlightPositions[fi][1]);
            group.add(lightHead);
        }

        var pitchGeo = new THREE.BoxGeometry(60, 0.2, 40);
        var pitch = createMesh(pitchGeo, 0x3A7A1A);
        pitch.position.set(tx - 10, 0.1, tz - 5);
        group.add(pitch);

        var wicket1Geo = new THREE.BoxGeometry(0.5, 1, 0.5);
        var wicket1 = createMesh(wicket1Geo, 0xF5DEB3);
        wicket1.position.set(tx - 10, 0.5, tz - 5);
        group.add(wicket1);

        var wicket2Geo = new THREE.BoxGeometry(0.5, 1, 0.5);
        var wicket2 = createMesh(wicket2Geo, 0xF5DEB3);
        wicket2.position.set(tx - 10, 0.5, tz + 5);
        group.add(wicket2);

        var secondStandGeo = new THREE.BoxGeometry(50, 6, 8);
        var secondStand = createMesh(secondStandGeo, 0xEEEEEE);
        secondStand.position.set(tx, 3, tz - 25);
        group.add(secondStand);
    }

    function buildLaceMarket(group) {
        var lx = WORLD_X + 30;
        var lz = WORLD_Z - 40;

        for (var li = 0; li < 5; li++) {
            var warehouseGeo = new THREE.BoxGeometry(10, 14, 8);
            var warehouse = createMesh(warehouseGeo, 0xD4A97A);
            warehouse.position.set(lx + li * 13, 7, lz);
            group.add(warehouse);

            var facadeGeo = new THREE.BoxGeometry(10, 2, 0.3);
            var facade = createMesh(facadeGeo, 0xBB8855);
            facade.position.set(lx + li * 13, 14.5, lz - 4.15);
            group.add(facade);

            var corniceGeo = new THREE.BoxGeometry(10.5, 0.5, 0.8);
            var cornice = createMesh(corniceGeo, 0xC49060);
            cornice.position.set(lx + li * 13, 14, lz - 4.1);
            group.add(cornice);

            var archRowY = [3, 6, 9, 12];
            for (var ai = 0; ai < archRowY.length; ai++) {
                var windowGeo = new THREE.BoxGeometry(1.5, 2, 0.2);
                var windowL = createMesh(windowGeo, 0x8AAABB);
                windowL.position.set(lx + li * 13 - 2.5, archRowY[ai], lz - 4.05);
                group.add(windowL);

                var windowR = createMesh(new THREE.BoxGeometry(1.5, 2, 0.2), 0x8AAABB);
                windowR.position.set(lx + li * 13 + 2.5, archRowY[ai], lz - 4.05);
                group.add(windowR);
            }

            var doorGeo = new THREE.BoxGeometry(1.5, 3, 0.3);
            var door = createMesh(doorGeo, 0x5A3A1A);
            door.position.set(lx + li * 13, 1.5, lz - 4.1);
            group.add(door);

            var rooftopGeo = new THREE.BoxGeometry(10, 0.5, 8);
            var rooftop = createMesh(rooftopGeo, 0x9A7A50);
            rooftop.position.set(lx + li * 13, 14.25, lz);
            group.add(rooftop);

            var chimneyGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 6);
            var chimney = createMesh(chimneyGeo, 0xAA8866);
            chimney.position.set(lx + li * 13 + 2, 16, lz);
            group.add(chimney);
        }

        var streetGeo = new THREE.BoxGeometry(70, 0.2, 12);
        var street = createMesh(streetGeo, 0x7A7A7A);
        street.position.set(lx + 26, 0.1, lz + 10);
        group.add(street);
    }

    function buildEdgeLines(group) {
        var mat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });

        var castleEdgeGeo = new THREE.BoxGeometry(30, 12, 20);
        var edges = new THREE.EdgesGeometry(castleEdgeGeo);
        var castleLines = new THREE.LineSegments(edges, mat);
        castleLines.position.set(WORLD_X, 6, WORLD_Z);
        group.add(castleLines);
    }

    function buildGroundBase(group) {
        var groundGeo = new THREE.BoxGeometry(300, 0.5, 300);
        var ground = createMesh(groundGeo, 0x5A7A3A);
        ground.position.set(WORLD_X, -0.25, WORLD_Z);
        group.add(ground);

        var hillGeo = new THREE.BoxGeometry(50, 4, 40);
        var hill = createMesh(hillGeo, 0x6A8A4A);
        hill.position.set(WORLD_X, 2, WORLD_Z);
        group.add(hill);
    }

    function create(scene) {
        var group = new THREE.Group();

        buildGroundBase(group);
        buildCastleRock(group);
        buildGatehouse(group);
        buildRobinHoodStatue(group);
        buildMajorOak(group);
        buildCaveEntrances(group);
        buildTrentBridge(group);
        buildLaceMarket(group);
        buildEdgeLines(group);

        if (scene) {
            scene.add(group);
        }

        return group;
    }

    function getWorldPosition() {
        return { x: WORLD_X, z: WORLD_Z };
    }

    return {
        create: create,
        getWorldPosition: getWorldPosition
    };

}());
