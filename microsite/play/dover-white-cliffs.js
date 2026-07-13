window.DoverWhiteCliffs = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 10560;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildCliffs() {
        var chalkColor = 0xF5F5DC;
        var flintColor = 0x8B7355;

        // Main cliff face - large section
        var cliffGeo1 = new THREE.BoxGeometry(200, 40, 12);
        var cliffMat1 = makeMat(chalkColor);
        var cliff1 = new THREE.Mesh(cliffGeo1, cliffMat1);
        cliff1.position.set(X_OFFSET, 20, -60);
        addMesh(cliff1);

        // Second cliff section
        var cliffGeo2 = new THREE.BoxGeometry(160, 35, 10);
        var cliffMat2 = makeMat(chalkColor);
        var cliff2 = new THREE.Mesh(cliffGeo2, cliffMat2);
        cliff2.position.set(X_OFFSET + 20, 17.5, -55);
        addMesh(cliff2);

        // Shakespeare Cliff section - slightly offset
        var cliffGeo3 = new THREE.BoxGeometry(80, 38, 14);
        var cliffMat3 = makeMat(chalkColor);
        var cliff3 = new THREE.Mesh(cliffGeo3, cliffMat3);
        cliff3.position.set(X_OFFSET - 120, 19, -62);
        addMesh(cliff3);

        // Flint band 1 - dark horizontal stripe
        var flint1Geo = new THREE.BoxGeometry(202, 2, 13);
        var flint1Mat = makeMat(flintColor);
        var flint1 = new THREE.Mesh(flint1Geo, flint1Mat);
        flint1.position.set(X_OFFSET, 10, -60);
        addMesh(flint1);

        // Flint band 2
        var flint2Geo = new THREE.BoxGeometry(202, 2, 13);
        var flint2Mat = makeMat(flintColor);
        var flint2 = new THREE.Mesh(flint2Geo, flint2Mat);
        flint2.position.set(X_OFFSET, 22, -60);
        addMesh(flint2);

        // Flint band 3
        var flint3Geo = new THREE.BoxGeometry(202, 1.5, 13);
        var flint3Mat = makeMat(flintColor);
        var flint3 = new THREE.Mesh(flint3Geo, flint3Mat);
        flint3.position.set(X_OFFSET, 32, -60);
        addMesh(flint3);

        // Cliff top grass
        var topGeo = new THREE.BoxGeometry(210, 3, 30);
        var topMat = makeMat(0x4A7C3F);
        var top1 = new THREE.Mesh(topGeo, topMat);
        top1.position.set(X_OFFSET, 41.5, -50);
        addMesh(top1);

        // Cliff base - rocky foreshore
        var baseGeo = new THREE.BoxGeometry(210, 4, 20);
        var baseMat = makeMat(0xA0A0A0);
        var base1 = new THREE.Mesh(baseGeo, baseMat);
        base1.position.set(X_OFFSET, -2, -68);
        addMesh(base1);
    }

    function buildCastle() {
        var stoneColor = 0xC8B89A;
        var darkStoneColor = 0x9E8B72;

        // Keep - main tower
        var keepGeo = new THREE.BoxGeometry(14, 20, 14);
        var keepMat = makeMat(stoneColor);
        var keep = new THREE.Mesh(keepGeo, keepMat);
        keep.position.set(X_OFFSET + 10, 53, -45);
        addMesh(keep);

        // Keep roof / battlements
        var keepRoofGeo = new THREE.BoxGeometry(15, 2, 15);
        var keepRoofMat = makeMat(darkStoneColor);
        var keepRoof = new THREE.Mesh(keepRoofGeo, keepRoofMat);
        keepRoof.position.set(X_OFFSET + 10, 64, -45);
        addMesh(keepRoof);

        // Inner curtain wall - north
        var iWallNGeo = new THREE.BoxGeometry(50, 8, 2);
        var iWallNMat = makeMat(stoneColor);
        var iWallN = new THREE.Mesh(iWallNGeo, iWallNMat);
        iWallN.position.set(X_OFFSET + 10, 47, -28);
        addMesh(iWallN);

        // Inner curtain wall - south
        var iWallSGeo = new THREE.BoxGeometry(50, 8, 2);
        var iWallSMat = makeMat(stoneColor);
        var iWallS = new THREE.Mesh(iWallSGeo, iWallSMat);
        iWallS.position.set(X_OFFSET + 10, 47, -62);
        addMesh(iWallS);

        // Inner curtain wall - east
        var iWallEGeo = new THREE.BoxGeometry(2, 8, 36);
        var iWallEMat = makeMat(stoneColor);
        var iWallE = new THREE.Mesh(iWallEGeo, iWallEMat);
        iWallE.position.set(X_OFFSET + 35, 47, -45);
        addMesh(iWallE);

        // Inner curtain wall - west
        var iWallWGeo = new THREE.BoxGeometry(2, 8, 36);
        var iWallWMat = makeMat(stoneColor);
        var iWallW = new THREE.Mesh(iWallWGeo, iWallWMat);
        iWallW.position.set(X_OFFSET - 15, 47, -45);
        addMesh(iWallW);

        // Inner corner towers
        var cornerPositions = [
            [X_OFFSET + 35, 47, -28],
            [X_OFFSET + 35, 47, -62],
            [X_OFFSET - 15, 47, -28],
            [X_OFFSET - 15, 47, -62]
        ];
        for (var ci = 0; ci < cornerPositions.length; ci++) {
            var ctGeo = new THREE.CylinderGeometry(3, 3, 10, 8);
            var ctMat = makeMat(stoneColor);
            var ct = new THREE.Mesh(ctGeo, ctMat);
            ct.position.set(cornerPositions[ci][0], cornerPositions[ci][1], cornerPositions[ci][2]);
            addMesh(ct);
        }

        // Outer curtain wall - north
        var oWallNGeo = new THREE.BoxGeometry(80, 6, 2);
        var oWallNMat = makeMat(darkStoneColor);
        var oWallN = new THREE.Mesh(oWallNGeo, oWallNMat);
        oWallN.position.set(X_OFFSET + 10, 46, -12);
        addMesh(oWallN);

        // Outer curtain wall - south
        var oWallSGeo = new THREE.BoxGeometry(80, 6, 2);
        var oWallSMat = makeMat(darkStoneColor);
        var oWallS = new THREE.Mesh(oWallSGeo, oWallSMat);
        oWallS.position.set(X_OFFSET + 10, 46, -78);
        addMesh(oWallS);

        // Outer curtain wall - east
        var oWallEGeo = new THREE.BoxGeometry(2, 6, 68);
        var oWallEMat = makeMat(darkStoneColor);
        var oWallE = new THREE.Mesh(oWallEGeo, oWallEMat);
        oWallE.position.set(X_OFFSET + 50, 46, -45);
        addMesh(oWallE);

        // Outer curtain wall - west
        var oWallWGeo = new THREE.BoxGeometry(2, 6, 68);
        var oWallWMat = makeMat(darkStoneColor);
        var oWallW = new THREE.Mesh(oWallWGeo, oWallWMat);
        oWallW.position.set(X_OFFSET - 30, 46, -45);
        addMesh(oWallW);

        // Constable's Tower gatehouse
        var gateGeo = new THREE.BoxGeometry(12, 14, 10);
        var gateMat = makeMat(stoneColor);
        var gate = new THREE.Mesh(gateGeo, gateMat);
        gate.position.set(X_OFFSET + 10, 50, -12);
        addMesh(gate);

        // Gatehouse battlements
        var gateBattleGeo = new THREE.BoxGeometry(13, 2, 11);
        var gateBattleMat = makeMat(darkStoneColor);
        var gateBattle = new THREE.Mesh(gateBattleGeo, gateBattleMat);
        gateBattle.position.set(X_OFFSET + 10, 58, -12);
        addMesh(gateBattle);

        // Pharos Roman lighthouse - round cylinder
        var pharosGeo = new THREE.CylinderGeometry(3.5, 4, 16, 12);
        var pharosMat = makeMat(0xD4C4A0);
        var pharos = new THREE.Mesh(pharosGeo, pharosMat);
        pharos.position.set(X_OFFSET - 5, 51, -40);
        addMesh(pharos);

        // Pharos cap
        var pharosCapGeo = new THREE.ConeGeometry(4, 4, 12);
        var pharosCapMat = makeMat(0xB8A882);
        var pharosCap = new THREE.Mesh(pharosCapGeo, pharosCapMat);
        pharosCap.position.set(X_OFFSET - 5, 61, -40);
        addMesh(pharosCap);

        // Hilltop ground
        var hillGeo = new THREE.BoxGeometry(100, 4, 90);
        var hillMat = makeMat(0x5A8A4A);
        var hill = new THREE.Mesh(hillGeo, hillMat);
        hill.position.set(X_OFFSET + 10, 41, -45);
        addMesh(hill);
    }

    function buildFerryPort() {
        var concreteColor = 0xBDBDBD;
        var darkConcreteColor = 0x909090;

        // Main terminal building
        var termGeo = new THREE.BoxGeometry(60, 12, 25);
        var termMat = makeMat(concreteColor);
        var term = new THREE.Mesh(termGeo, termMat);
        term.position.set(X_OFFSET + 30, 6, 40);
        addMesh(term);

        // Terminal roof
        var termRoofGeo = new THREE.BoxGeometry(62, 2, 27);
        var termRoofMat = makeMat(darkConcreteColor);
        var termRoof = new THREE.Mesh(termRoofGeo, termRoofMat);
        termRoof.position.set(X_OFFSET + 30, 13, 40);
        addMesh(termRoof);

        // Terminal upper level
        var termUprGeo = new THREE.BoxGeometry(50, 6, 18);
        var termUprMat = makeMat(0xD0D0D0);
        var termUpr = new THREE.Mesh(termUprGeo, termUprMat);
        termUpr.position.set(X_OFFSET + 30, 18, 40);
        addMesh(termUpr);

        // Roll-on roll-off ramp
        var rampGeo = new THREE.BoxGeometry(20, 1, 50);
        var rampMat = makeMat(darkConcreteColor);
        var ramp = new THREE.Mesh(rampGeo, rampMat);
        ramp.position.set(X_OFFSET + 60, 0.5, 60);
        ramp.rotation.x = -0.05;
        addMesh(ramp);

        // Marshalling area (parking)
        var marshGeo = new THREE.BoxGeometry(100, 0.5, 80);
        var marshMat = makeMat(0xA0A0A0);
        var marsh = new THREE.Mesh(marshGeo, marshMat);
        marsh.position.set(X_OFFSET - 20, 0.25, 70);
        addMesh(marsh);

        // Dock pier 1
        var pier1Geo = new THREE.BoxGeometry(10, 3, 80);
        var pier1Mat = makeMat(concreteColor);
        var pier1 = new THREE.Mesh(pier1Geo, pier1Mat);
        pier1.position.set(X_OFFSET + 55, 1.5, 80);
        addMesh(pier1);

        // Dock pier 2
        var pier2Geo = new THREE.BoxGeometry(10, 3, 80);
        var pier2Mat = makeMat(concreteColor);
        var pier2 = new THREE.Mesh(pier2Geo, pier2Mat);
        pier2.position.set(X_OFFSET + 80, 1.5, 80);
        addMesh(pier2);

        // Ferry vessel 1 - hull
        var ferry1HullGeo = new THREE.BoxGeometry(30, 6, 10);
        var ferry1HullMat = makeMat(0xFFFFFF);
        var ferry1Hull = new THREE.Mesh(ferry1HullGeo, ferry1HullMat);
        ferry1Hull.position.set(X_OFFSET + 65, 4, 100);
        addMesh(ferry1Hull);

        // Ferry vessel 1 - superstructure
        var ferry1SuperGeo = new THREE.BoxGeometry(26, 5, 8);
        var ferry1SuperMat = makeMat(0xF0F0F0);
        var ferry1Super = new THREE.Mesh(ferry1SuperGeo, ferry1SuperMat);
        ferry1Super.position.set(X_OFFSET + 65, 9.5, 100);
        addMesh(ferry1Super);

        // Ferry vessel 1 - upper deck
        var ferry1UpperGeo = new THREE.BoxGeometry(20, 4, 7);
        var ferry1UpperMat = makeMat(0xE8E8E8);
        var ferry1Upper = new THREE.Mesh(ferry1UpperGeo, ferry1UpperMat);
        ferry1Upper.position.set(X_OFFSET + 65, 14, 100);
        addMesh(ferry1Upper);

        // Ferry vessel 1 - funnel
        var ferry1FunnelGeo = new THREE.CylinderGeometry(1.2, 1.5, 5, 8);
        var ferry1FunnelMat = makeMat(0xCC2200);
        var ferry1Funnel = new THREE.Mesh(ferry1FunnelGeo, ferry1FunnelMat);
        ferry1Funnel.position.set(X_OFFSET + 70, 18.5, 100);
        addMesh(ferry1Funnel);

        // Ferry vessel 2 - hull
        var ferry2HullGeo = new THREE.BoxGeometry(32, 7, 11);
        var ferry2HullMat = makeMat(0xFFFFFF);
        var ferry2Hull = new THREE.Mesh(ferry2HullGeo, ferry2HullMat);
        ferry2Hull.position.set(X_OFFSET + 90, 4.5, 105);
        addMesh(ferry2Hull);

        // Ferry vessel 2 - superstructure
        var ferry2SuperGeo = new THREE.BoxGeometry(28, 6, 9);
        var ferry2SuperMat = makeMat(0xF0F0F0);
        var ferry2Super = new THREE.Mesh(ferry2SuperGeo, ferry2SuperMat);
        ferry2Super.position.set(X_OFFSET + 90, 11, 105);
        addMesh(ferry2Super);

        // Ferry vessel 2 - upper deck
        var ferry2UpperGeo = new THREE.BoxGeometry(22, 4, 8);
        var ferry2UpperMat = makeMat(0xE8E8E8);
        var ferry2Upper = new THREE.Mesh(ferry2UpperGeo, ferry2UpperMat);
        ferry2Upper.position.set(X_OFFSET + 90, 15, 105);
        addMesh(ferry2Upper);

        // Ferry vessel 2 - funnel
        var ferry2FunnelGeo = new THREE.CylinderGeometry(1.5, 1.8, 6, 8);
        var ferry2FunnelMat = makeMat(0xCC2200);
        var ferry2Funnel = new THREE.Mesh(ferry2FunnelGeo, ferry2FunnelMat);
        ferry2Funnel.position.set(X_OFFSET + 95, 20, 105);
        addMesh(ferry2Funnel);
    }

    function buildSea() {
        var seaColor = 0x2E6B8A;
        var waveColor = 0x3D8FAD;

        // Main sea plane - English Channel
        var seaGeo = new THREE.BoxGeometry(400, 1, 300);
        var seaMat = makeMat(seaColor);
        var sea = new THREE.Mesh(seaGeo, seaMat);
        sea.position.set(X_OFFSET + 50, -1, 50);
        addMesh(sea);

        // Wave rows - alternating lighter strips
        var waveOffsets = [20, 40, 60, 80, 100, 120, 140, 160];
        for (var wi = 0; wi < waveOffsets.length; wi++) {
            var waveGeo = new THREE.BoxGeometry(300, 0.6, 3);
            var waveMat = makeMat(waveColor);
            var wave = new THREE.Mesh(waveGeo, waveMat);
            wave.position.set(X_OFFSET + 50, -0.2, waveOffsets[wi]);
            addMesh(wave);
        }

        // Nearshore lighter water (surf zone)
        var surfGeo = new THREE.BoxGeometry(220, 0.8, 20);
        var surfMat = makeMat(0x5AADE0);
        var surf = new THREE.Mesh(surfGeo, surfMat);
        surf.position.set(X_OFFSET + 30, -0.5, -75);
        addMesh(surf);
    }

    function buildTown() {
        var houseColor = 0xD4B896;
        var roofColor = 0x8B4513;
        var brickColor = 0xC87941;

        // Terraced housing rows - row 1
        for (var h1 = 0; h1 < 8; h1++) {
            var house1Geo = new THREE.BoxGeometry(6, 8, 8);
            var house1Mat = makeMat(houseColor);
            var house1 = new THREE.Mesh(house1Geo, house1Mat);
            house1.position.set(X_OFFSET - 80 + h1 * 8, 4, 0);
            addMesh(house1);

            var roof1Geo = new THREE.BoxGeometry(7, 3, 9);
            var roof1Mat = makeMat(roofColor);
            var roof1 = new THREE.Mesh(roof1Geo, roof1Mat);
            roof1.position.set(X_OFFSET - 80 + h1 * 8, 9.5, 0);
            addMesh(roof1);
        }

        // Terraced housing rows - row 2
        for (var h2 = 0; h2 < 8; h2++) {
            var house2Geo = new THREE.BoxGeometry(6, 8, 8);
            var house2Mat = makeMat(0xC8A87A);
            var house2 = new THREE.Mesh(house2Geo, house2Mat);
            house2.position.set(X_OFFSET - 80 + h2 * 8, 4, 15);
            addMesh(house2);

            var roof2Geo = new THREE.BoxGeometry(7, 3, 9);
            var roof2Mat = makeMat(0x7A3B10);
            var roof2 = new THREE.Mesh(roof2Geo, roof2Mat);
            roof2.position.set(X_OFFSET - 80 + h2 * 8, 9.5, 15);
            addMesh(roof2);
        }

        // Terraced housing rows - row 3 (back row)
        for (var h3 = 0; h3 < 10; h3++) {
            var house3Geo = new THREE.BoxGeometry(6, 9, 8);
            var house3Mat = makeMat(brickColor);
            var house3 = new THREE.Mesh(house3Geo, house3Mat);
            house3.position.set(X_OFFSET - 90 + h3 * 8, 4.5, 28);
            addMesh(house3);

            var roof3Geo = new THREE.BoxGeometry(7, 3, 9);
            var roof3Mat = makeMat(0x6B3010);
            var roof3 = new THREE.Mesh(roof3Geo, roof3Mat);
            roof3.position.set(X_OFFSET - 90 + h3 * 8, 10, 28);
            addMesh(roof3);
        }

        // Market Square - open paved area
        var squareGeo = new THREE.BoxGeometry(30, 0.4, 30);
        var squareMat = makeMat(0xC0B898);
        var square = new THREE.Mesh(squareGeo, squareMat);
        square.position.set(X_OFFSET - 30, 0.2, 10);
        addMesh(square);

        // Town Hall - main building
        var townHallGeo = new THREE.BoxGeometry(18, 14, 14);
        var townHallMat = makeMat(0xD6C4A0);
        var townHall = new THREE.Mesh(townHallGeo, townHallMat);
        townHall.position.set(X_OFFSET - 30, 7, -10);
        addMesh(townHall);

        // Town Hall dome
        var domeGeo = new THREE.SphereGeometry(5, 12, 8);
        var domeMat = makeMat(0xB0A080);
        var dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(X_OFFSET - 30, 19, -10);
        addMesh(dome);

        // Town Hall columns left
        var col1Geo = new THREE.CylinderGeometry(0.6, 0.6, 12, 8);
        var col1Mat = makeMat(0xE0D0B0);
        var col1 = new THREE.Mesh(col1Geo, col1Mat);
        col1.position.set(X_OFFSET - 38, 6, -3);
        addMesh(col1);

        // Town Hall columns right
        var col2Geo = new THREE.CylinderGeometry(0.6, 0.6, 12, 8);
        var col2Mat = makeMat(0xE0D0B0);
        var col2 = new THREE.Mesh(col2Geo, col2Mat);
        col2.position.set(X_OFFSET - 22, 6, -3);
        addMesh(col2);

        // Ground / town base
        var groundGeo = new THREE.BoxGeometry(200, 1, 60);
        var groundMat = makeMat(0x8AAA70);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(X_OFFSET - 20, -0.5, 15);
        addMesh(ground);
    }

    function build() {
        buildCliffs();
        buildCastle();
        buildFerryPort();
        buildSea();
        buildTown();
    }

    function update(delta) {
    }

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
