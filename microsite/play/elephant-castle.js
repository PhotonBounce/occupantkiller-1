window.ElephantCastle = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildStrataSE1() {
        var ox = 11360;
        var oz = -80;

        // Main tower base - slightly wider
        var baseGeo = new THREE.BoxGeometry(22, 8, 22);
        var baseMat = makeMaterial(0x8899aa);
        var base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(ox, 4, oz);
        addMesh(base);

        // Tower body - slender, tapering approximated with stacked boxes
        var floorCount = 43;
        var floorHeight = 3.2;
        var totalHeight = floorCount * floorHeight;

        var bodyGeo = new THREE.BoxGeometry(18, totalHeight * 0.6, 18);
        var bodyMat = makeMaterial(0x99aabc);
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(ox, 8 + totalHeight * 0.3, oz);
        addMesh(body);

        // Upper tower - slightly narrower
        var upperGeo = new THREE.BoxGeometry(15, totalHeight * 0.35, 15);
        var upperMat = makeMaterial(0xaabbcc);
        var upper = new THREE.Mesh(upperGeo, upperMat);
        upper.position.set(ox, 8 + totalHeight * 0.6 + totalHeight * 0.175, oz);
        addMesh(upper);

        // Crown / notched top section
        var crownBase = 8 + totalHeight * 0.6 + totalHeight * 0.35;
        var crownGeo = new THREE.BoxGeometry(16, 12, 16);
        var crownMat = makeMaterial(0xbbccdd);
        var crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(ox, crownBase + 6, oz);
        addMesh(crown);

        // 3 wind turbine housings embedded in crown (CylinderGeometry)
        var turbineY = crownBase + 12;
        var turbinePositions = [
            [ox - 7, oz],
            [ox + 7, oz],
            [ox, oz]
        ];
        for (var t = 0; t < 3; t++) {
            var housingGeo = new THREE.CylinderGeometry(2.5, 2.5, 8, 16);
            var housingMat = makeMaterial(0x334455);
            var housing = new THREE.Mesh(housingGeo, housingMat);
            housing.position.set(turbinePositions[t][0], turbineY + 4, turbinePositions[t][1]);
            housing.rotation.z = Math.PI / 2;
            addMesh(housing);

            // Turbine spinner cap
            var capGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12);
            var capMat = makeMaterial(0x222233);
            var cap = new THREE.Mesh(capGeo, capMat);
            cap.position.set(turbinePositions[t][0], turbineY + 4, turbinePositions[t][1] - 5);
            cap.rotation.x = Math.PI / 2;
            addMesh(cap);
        }

        // Roof cap
        var roofGeo = new THREE.BoxGeometry(14, 4, 14);
        var roofMat = makeMaterial(0x667788);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(ox, crownBase + 12 + 2, oz);
        addMesh(roof);
    }

    function buildShoppingCentre() {
        var ox = 11360;
        var oz = 60;

        // Circular pink shopping mall - approximated with cylinder
        var mallGeo = new THREE.CylinderGeometry(38, 40, 18, 24);
        var mallMat = makeMaterial(0xee7799);
        var mall = new THREE.Mesh(mallGeo, mallMat);
        mall.position.set(ox, 9, oz);
        addMesh(mall);

        // Upper mall level
        var mallUpperGeo = new THREE.CylinderGeometry(32, 38, 8, 24);
        var mallUpperMat = makeMaterial(0xdd6688);
        var mallUpper = new THREE.Mesh(mallUpperGeo, mallUpperMat);
        mallUpper.position.set(ox, 22, oz);
        addMesh(mallUpper);

        // Flat roof
        var roofGeo = new THREE.CylinderGeometry(33, 33, 1.5, 24);
        var roofMat = makeMaterial(0xcc5577);
        var roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(ox, 27, oz);
        addMesh(roofMesh);

        // Pink elephant sculpture on roof
        // Elephant body
        var elephantOx = ox + 10;
        var elephantOz = oz - 5;
        var elephantY = 29;

        var bodyGeo = new THREE.BoxGeometry(6, 5, 9);
        var bodyMat = makeMaterial(0xff88bb);
        var elephantBody = new THREE.Mesh(bodyGeo, bodyMat);
        elephantBody.position.set(elephantOx, elephantY + 2.5, elephantOz);
        addMesh(elephantBody);

        // Elephant head
        var headGeo = new THREE.SphereGeometry(2.5, 12, 12);
        var headMat = makeMaterial(0xff88bb);
        var elephantHead = new THREE.Mesh(headGeo, headMat);
        elephantHead.position.set(elephantOx, elephantY + 6.5, elephantOz - 4.5);
        addMesh(elephantHead);

        // Elephant trunk (cylinder)
        var trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
        var trunkMat = makeMaterial(0xee77aa);
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(elephantOx, elephantY + 4, elephantOz - 7);
        trunk.rotation.x = Math.PI / 4;
        addMesh(trunk);

        // Elephant ears (flat boxes)
        var earGeo = new THREE.BoxGeometry(0.8, 3, 4);
        var earMat = makeMaterial(0xff99cc);
        var earL = new THREE.Mesh(earGeo, earMat);
        earL.position.set(elephantOx - 3, elephantY + 6, elephantOz - 4);
        addMesh(earL);

        var earR = new THREE.Mesh(earGeo, earMat);
        earR.position.set(elephantOx + 3, elephantY + 6, elephantOz - 4);
        addMesh(earR);

        // Elephant legs
        var legGeo = new THREE.CylinderGeometry(0.8, 0.8, 3.5, 8);
        var legMat = makeMaterial(0xee77aa);
        var legPositions = [
            [-2, -2], [-2, 2], [2, -2], [2, 2]
        ];
        for (var l = 0; l < 4; l++) {
            var leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(elephantOx + legPositions[l][0], elephantY - 0.25, elephantOz + legPositions[l][1]);
            addMesh(leg);
        }
    }

    function buildTransportHub() {
        var ox = 11360;
        var oz = 20;

        // Tube station entrance box
        var entranceGeo = new THREE.BoxGeometry(14, 5, 10);
        var entranceMat = makeMaterial(0x222222);
        var entrance = new THREE.Mesh(entranceGeo, entranceMat);
        entrance.position.set(ox - 25, 2.5, oz);
        addMesh(entrance);

        // Tube station sign (red cylinder - roundel)
        var roundelGeo = new THREE.CylinderGeometry(2, 2, 0.5, 16);
        var roundelMat = makeMaterial(0xcc0000);
        var roundel = new THREE.Mesh(roundelGeo, roundelMat);
        roundel.position.set(ox - 25, 6.5, oz - 5.5);
        roundel.rotation.x = Math.PI / 2;
        addMesh(roundel);

        // Bus station canopy - curved approximated with low flat box
        var canopyGeo = new THREE.BoxGeometry(60, 1.5, 20);
        var canopyMat = makeMaterial(0x445566);
        var canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.set(ox + 10, 7, oz + 30);
        addMesh(canopy);

        // Canopy supports
        for (var s = 0; s < 5; s++) {
            var supportGeo = new THREE.CylinderGeometry(0.4, 0.4, 7, 8);
            var supportMat = makeMaterial(0x334455);
            var support = new THREE.Mesh(supportGeo, supportMat);
            support.position.set(ox - 20 + s * 15, 3.5, oz + 30);
            addMesh(support);
        }

        // Pedestrian underpass entrance
        var underpGeo = new THREE.BoxGeometry(8, 4, 3);
        var underpMat = makeMaterial(0x333344);
        var underpass = new THREE.Mesh(underpGeo, underpMat);
        underpass.position.set(ox - 10, 2, oz + 5);
        addMesh(underpass);

        var underpGeo2 = new THREE.BoxGeometry(8, 4, 3);
        var underpass2 = new THREE.Mesh(underpGeo2, underpMat);
        underpass2.position.set(ox + 10, 2, oz + 5);
        addMesh(underpass2);
    }

    function buildRegenerationTowers() {
        var ox = 11360;

        var towers = [
            { x: ox + 70, z: -30, width: 16, depth: 14, floors: 22, color: 0x99aabb },
            { x: ox + 95, z: 10, width: 14, depth: 14, floors: 18, color: 0xaabbcc },
            { x: ox - 70, z: -20, width: 18, depth: 14, floors: 25, color: 0x889aab },
            { x: ox - 95, z: 30, width: 14, depth: 16, floors: 20, color: 0x99aabc }
        ];

        for (var i = 0; i < towers.length; i++) {
            var t = towers[i];
            var floorH = 3.2;
            var height = t.floors * floorH;

            var towerGeo = new THREE.BoxGeometry(t.width, height, t.depth);
            var towerMat = makeMaterial(t.color);
            var towerMesh = new THREE.Mesh(towerGeo, towerMat);
            towerMesh.position.set(t.x, height / 2, t.z);
            addMesh(towerMesh);

            // Flat roof cap
            var roofGeo = new THREE.BoxGeometry(t.width + 1, 1.5, t.depth + 1);
            var roofMat = makeMaterial(0x667788);
            var roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.position.set(t.x, height + 0.75, t.z);
            addMesh(roofMesh);

            // Facade detail strips (horizontal bands)
            for (var f = 0; f < 3; f++) {
                var bandGeo = new THREE.BoxGeometry(t.width + 0.2, 0.5, t.depth + 0.2);
                var bandMat = makeMaterial(0x778899);
                var band = new THREE.Mesh(bandGeo, bandMat);
                band.position.set(t.x, height * (0.25 + f * 0.25), t.z);
                addMesh(band);
            }
        }
    }

    function buildMetropolitanTabernacle() {
        var ox = 11360 - 50;
        var oz = -60;

        // Church main body
        var bodyGeo = new THREE.BoxGeometry(40, 20, 30);
        var bodyMat = makeMaterial(0xddccbb);
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(ox, 10, oz);
        addMesh(body);

        // Classical portico base platform
        var platformGeo = new THREE.BoxGeometry(36, 2, 12);
        var platformMat = makeMaterial(0xeeddcc);
        var platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(ox, 1, oz - 21);
        addMesh(platform);

        // 6 Corinthian columns
        for (var c = 0; c < 6; c++) {
            var colGeo = new THREE.CylinderGeometry(0.9, 1.1, 16, 12);
            var colMat = makeMaterial(0xeeddcc);
            var col = new THREE.Mesh(colGeo, colMat);
            col.position.set(ox - 12.5 + c * 5, 10, oz - 21);
            addMesh(col);

            // Column capital
            var capGeo = new THREE.BoxGeometry(2.5, 1.5, 2.5);
            var capMat = makeMaterial(0xeeddcc);
            var colCap = new THREE.Mesh(capGeo, capMat);
            colCap.position.set(ox - 12.5 + c * 5, 19, oz - 21);
            addMesh(colCap);
        }

        // Entablature / architrave across top of columns
        var entabGeo = new THREE.BoxGeometry(36, 2.5, 3);
        var entabMat = makeMaterial(0xddccbb);
        var entab = new THREE.Mesh(entabGeo, entabMat);
        entab.position.set(ox, 20.75, oz - 21);
        addMesh(entab);

        // Pediment (triangular approximated with cone / box)
        var pedGeo = new THREE.ConeGeometry(18, 6, 4);
        var pedMat = makeMaterial(0xddccbb);
        var pediment = new THREE.Mesh(pedGeo, pedMat);
        pediment.position.set(ox, 25, oz - 21);
        pediment.rotation.y = Math.PI / 4;
        addMesh(pediment);

        // Church roof
        var roofGeo = new THREE.BoxGeometry(40, 2, 30);
        var roofMat = makeMaterial(0xbbaa99);
        var roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(ox, 21, oz);
        addMesh(roofMesh);

        // Dome / small cupola on top
        var cupolaGeo = new THREE.SphereGeometry(5, 12, 8);
        var cupolaMat = makeMaterial(0xbbaa99);
        var cupola = new THREE.Mesh(cupolaGeo, cupolaMat);
        cupola.position.set(ox, 25, oz);
        addMesh(cupola);
    }

    function buildGroundPlane() {
        var ox = 11360;

        // Ground area
        var groundGeo = new THREE.BoxGeometry(300, 0.5, 250);
        var groundMat = makeMaterial(0x556644);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(ox, -0.25, 0);
        addMesh(ground);

        // Road surface
        var roadGeo = new THREE.BoxGeometry(20, 0.4, 250);
        var roadMat = makeMaterial(0x333333);
        var road = new THREE.Mesh(roadGeo, roadMat);
        road.position.set(ox, 0, 0);
        addMesh(road);

        // Cross road
        var crossGeo = new THREE.BoxGeometry(300, 0.4, 20);
        var crossMat = makeMaterial(0x333333);
        var crossRoad = new THREE.Mesh(crossGeo, crossMat);
        crossRoad.position.set(ox, 0, 10);
        addMesh(crossRoad);
    }

    function build() {
        buildGroundPlane();
        buildStrataSE1();
        buildShoppingCentre();
        buildTransportHub();
        buildRegenerationTowers();
        buildMetropolitanTabernacle();
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
