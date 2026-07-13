window.CorkButter = (function() {
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

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildButterExchange();
        buildStFinBarresCathedral();
        buildRiverLee();
        buildEnglishMarket();
        buildStPatricksStreet();
        buildCorkOperaHouse();
        buildShandonBells();
        buildUCC();
    }

    function buildGround() {
        // Ground platform — large flat box standing in for a plane
        var geo = new THREE.BoxGeometry(400, 0.5, 200);
        makeMesh(geo, 0x556B2F, 17840, -0.25, 0);
    }

    function buildButterExchange() {
        var ox = 17840;
        var oz = -30;

        // Main rotunda body
        var rotundaGeo = new THREE.CylinderGeometry(10, 10, 8, 16);
        makeMesh(rotundaGeo, 0xF5DEB3, ox, 4, oz);

        // Dome top
        var domeGeo = new THREE.ConeGeometry(10.5, 5, 16);
        makeMesh(domeGeo, 0xD2B48C, ox, 10.5, oz);

        // Dome lantern finial
        var finialGeo = new THREE.CylinderGeometry(0.5, 0.8, 1.5, 8);
        makeMesh(finialGeo, 0xB8860B, ox, 14, oz);

        // Doric columns — ring of 8 around rotunda
        var colAngles = [0, 0.785, 1.571, 2.356, 3.141, 3.927, 4.712, 5.497];
        for (var i = 0; i < colAngles.length; i++) {
            var colX = ox + Math.cos(colAngles[i]) * 11.5;
            var colZ = oz + Math.sin(colAngles[i]) * 11.5;
            var colGeo = new THREE.CylinderGeometry(0.5, 0.6, 8, 8);
            makeMesh(colGeo, 0xFFFAF0, colX, 4, colZ);
            // Column capital
            var capGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);
            makeMesh(capGeo, 0xFFFAF0, colX, 8.2, colZ);
            // Column base
            var baseGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);
            makeMesh(baseGeo, 0xFFFAF0, colX, 0.2, colZ);
        }

        // Entablature ring
        var entabGeo = new THREE.CylinderGeometry(12, 12, 0.8, 16);
        makeMesh(entabGeo, 0xFFFAF0, ox, 8.4, oz);

        // Steps base
        var step1Geo = new THREE.CylinderGeometry(13, 13, 0.5, 16);
        makeMesh(step1Geo, 0xE8E8D0, ox, 0.25, oz);
        var step2Geo = new THREE.CylinderGeometry(11.5, 11.5, 0.5, 16);
        makeMesh(step2Geo, 0xE8E8D0, ox, 0.75, oz);

        // Entrance portico — flat box porch
        var porchGeo = new THREE.BoxGeometry(8, 5, 4);
        makeMesh(porchGeo, 0xF5DEB3, ox, 2.5, oz + 13);
        // Portico columns
        var pc1Geo = new THREE.CylinderGeometry(0.4, 0.5, 5, 8);
        makeMesh(pc1Geo, 0xFFFAF0, ox - 3, 2.5, oz + 15);
        var pc2Geo = new THREE.CylinderGeometry(0.4, 0.5, 5, 8);
        makeMesh(pc2Geo, 0xFFFAF0, ox + 3, 2.5, oz + 15);
        // Portico pediment
        var pedGeo = new THREE.ConeGeometry(4.5, 2, 4);
        makeMesh(pedGeo, 0xF5DEB3, ox, 6.5, oz + 13, 0, 0.785, 0);
    }

    function buildStFinBarresCathedral() {
        var ox = 17840;
        var oz = 60;

        // Main nave
        var naveGeo = new THREE.BoxGeometry(18, 12, 40);
        makeMesh(naveGeo, 0x808080, ox, 6, oz);

        // Nave roof ridge
        var roofGeo = new THREE.BoxGeometry(2, 3, 40);
        makeMesh(roofGeo, 0x696969, ox, 13.5, oz);

        // Transept north
        var transNGeo = new THREE.BoxGeometry(10, 10, 14);
        makeMesh(transNGeo, 0x808080, ox - 14, 5, oz);
        // Transept south
        var transSGeo = new THREE.BoxGeometry(10, 10, 14);
        makeMesh(transSGeo, 0x808080, ox + 14, 5, oz);

        // Chancel (east end)
        var chanGeo = new THREE.BoxGeometry(12, 10, 10);
        makeMesh(chanGeo, 0x808080, ox, 5, oz + 22);

        // Three spires
        var spire1Geo = new THREE.ConeGeometry(2, 20, 4);
        makeMesh(spire1Geo, 0x2F4F4F, ox - 6, 22, oz - 18);
        var spire2Geo = new THREE.ConeGeometry(2, 20, 4);
        makeMesh(spire2Geo, 0x2F4F4F, ox + 6, 22, oz - 18);
        var spire3Geo = new THREE.ConeGeometry(1.5, 16, 4);
        makeMesh(spire3Geo, 0x2F4F4F, ox, 26, oz + 22);

        // Spire bases / crossing tower
        var towerGeo = new THREE.BoxGeometry(8, 6, 8);
        makeMesh(towerGeo, 0x808080, ox, 15, oz + 22);

        // West facade towers
        var wt1Geo = new THREE.BoxGeometry(6, 14, 6);
        makeMesh(wt1Geo, 0x808080, ox - 6, 7, oz - 18);
        var wt2Geo = new THREE.BoxGeometry(6, 14, 6);
        makeMesh(wt2Geo, 0x808080, ox + 6, 7, oz - 18);

        // Rose window (blue glass box)
        var roseGeo = new THREE.BoxGeometry(2, 2, 0.2);
        makeMesh(roseGeo, 0x87CEEB, ox, 11, oz - 20.1);

        // Side aisle north
        var aisleNGeo = new THREE.BoxGeometry(4, 7, 30);
        makeMesh(aisleNGeo, 0x777777, ox - 11, 3.5, oz);
        // Side aisle south
        var aisleSGeo = new THREE.BoxGeometry(4, 7, 30);
        makeMesh(aisleSGeo, 0x777777, ox + 11, 3.5, oz);

        // Buttresses — pairs along nave
        var buttZ = [oz - 10, oz, oz + 10];
        for (var b = 0; b < buttZ.length; b++) {
            var bn1Geo = new THREE.BoxGeometry(1.5, 9, 3);
            makeMesh(bn1Geo, 0x696969, ox - 13.5, 4.5, buttZ[b]);
            var bs1Geo = new THREE.BoxGeometry(1.5, 9, 3);
            makeMesh(bs1Geo, 0x696969, ox + 13.5, 4.5, buttZ[b]);
        }
    }

    function buildRiverLee() {
        var ox = 17840;

        // North channel of River Lee
        var northWaterGeo = new THREE.BoxGeometry(400, 0.6, 20);
        makeMesh(northWaterGeo, 0x006994, ox, 0.3, -80);

        // North quay wall
        var northQuayGeo = new THREE.BoxGeometry(400, 2, 2);
        makeMesh(northQuayGeo, 0x696969, ox, 1, -70);

        // South channel of River Lee
        var southWaterGeo = new THREE.BoxGeometry(400, 0.6, 20);
        makeMesh(southWaterGeo, 0x006994, ox, 0.3, 90);

        // South quay wall
        var southQuayGeo = new THREE.BoxGeometry(400, 2, 2);
        makeMesh(southQuayGeo, 0x696969, ox, 1, 80);

        // River bridge — north
        var bridge1Geo = new THREE.BoxGeometry(20, 1, 20);
        makeMesh(bridge1Geo, 0xA0A0A0, ox, 0.5, -80);
        // Bridge piers north
        var pier1Geo = new THREE.BoxGeometry(2, 4, 2);
        makeMesh(pier1Geo, 0x808080, ox - 6, -2, -80);
        var pier2Geo = new THREE.BoxGeometry(2, 4, 2);
        makeMesh(pier2Geo, 0x808080, ox + 6, -2, -80);

        // River bridge — south
        var bridge2Geo = new THREE.BoxGeometry(20, 1, 20);
        makeMesh(bridge2Geo, 0xA0A0A0, ox + 40, 0.5, 90);
    }

    function buildEnglishMarket() {
        var ox = 17840 + 20;
        var oz = 10;

        // Main hall — brick
        var hallGeo = new THREE.BoxGeometry(30, 8, 14);
        makeMesh(hallGeo, 0xCD5C5C, ox, 4, oz);

        // Glass roof panels (skylight) — row of panels
        var rp1Geo = new THREE.BoxGeometry(8, 0.3, 12);
        makeMesh(rp1Geo, 0x87CEEB, ox - 9, 8.15, oz);
        var rp2Geo = new THREE.BoxGeometry(8, 0.3, 12);
        makeMesh(rp2Geo, 0x87CEEB, ox, 8.15, oz);
        var rp3Geo = new THREE.BoxGeometry(8, 0.3, 12);
        makeMesh(rp3Geo, 0x87CEEB, ox + 9, 8.15, oz);

        // Cast iron columns inside market — row of 6
        var colXs = [ox - 10, ox - 5, ox, ox + 5, ox + 10, ox + 14];
        for (var c = 0; c < colXs.length; c++) {
            var mktColGeo = new THREE.CylinderGeometry(0.25, 0.3, 8, 8);
            makeMesh(mktColGeo, 0x2F2F2F, colXs[c], 4, oz);
        }

        // Entrance arch facade east
        var archFaceGeo = new THREE.BoxGeometry(14, 10, 1);
        makeMesh(archFaceGeo, 0xCD5C5C, ox + 15.5, 5, oz);
        // Arch top
        var archTopGeo = new THREE.CylinderGeometry(3, 3, 1, 8, 1, false, 0, 3.14159);
        makeMesh(archTopGeo, 0xB03030, ox + 15.5, 9.5, oz, 0, 0, 1.5708);

        // Side wings
        var wingNGeo = new THREE.BoxGeometry(10, 6, 6);
        makeMesh(wingNGeo, 0xCD5C5C, ox - 19, 3, oz - 10);
        var wingSGeo = new THREE.BoxGeometry(10, 6, 6);
        makeMesh(wingSGeo, 0xCD5C5C, ox - 19, 3, oz + 10);

        // Chimney stacks
        var chim1Geo = new THREE.BoxGeometry(1, 3, 1);
        makeMesh(chim1Geo, 0xAA4444, ox - 12, 9.5, oz - 5);
        var chim2Geo = new THREE.BoxGeometry(1, 3, 1);
        makeMesh(chim2Geo, 0xAA4444, ox + 12, 9.5, oz + 5);
    }

    function buildStPatricksStreet() {
        var ox = 17840;
        var oz = -5;

        // Curved main street — approximated as 5 angled shopfront blocks
        var shopData = [
            { x: ox - 80, z: oz + 5,  ry: 0.1  },
            { x: ox - 40, z: oz + 2,  ry: 0.05 },
            { x: ox,      z: oz,      ry: 0    },
            { x: ox + 40, z: oz + 2,  ry: -0.05 },
            { x: ox + 80, z: oz + 5,  ry: -0.1 }
        ];

        var shopColors = [0xCD5C5C, 0xB8860B, 0x8B4513, 0xA0522D, 0xCD5C5C];

        for (var s = 0; s < shopData.length; s++) {
            // Georgian shopfront 4-5 stories
            var shopGeo = new THREE.BoxGeometry(35, 16, 10);
            makeMesh(shopGeo, shopColors[s], shopData[s].x, 8, shopData[s].z, 0, shopData[s].ry, 0);
            // Ground floor darker (shopfront windows)
            var groundGeo = new THREE.BoxGeometry(35, 3.5, 0.3);
            makeMesh(groundGeo, 0x4A4A4A, shopData[s].x, 1.75, shopData[s].z - 5.15, 0, shopData[s].ry, 0);
            // Roof parapet
            var parapetGeo = new THREE.BoxGeometry(35, 1, 1);
            makeMesh(parapetGeo, 0xA0522D, shopData[s].x, 16.5, shopData[s].z, 0, shopData[s].ry, 0);
        }

        // Street surface
        var streetGeo = new THREE.BoxGeometry(200, 0.2, 12);
        makeMesh(streetGeo, 0x5A5A5A, ox, 0.1, oz - 8);
        // Pavement north
        var pavNGeo = new THREE.BoxGeometry(200, 0.2, 4);
        makeMesh(pavNGeo, 0x909090, ox, 0.1, oz - 16);
        // Pavement south
        var pavSGeo = new THREE.BoxGeometry(200, 0.2, 4);
        makeMesh(pavSGeo, 0x909090, ox, 0.1, oz);
    }

    function buildCorkOperaHouse() {
        var ox = 17840 - 40;
        var oz = -95;

        // Main concrete theater block
        var mainGeo = new THREE.BoxGeometry(36, 18, 24);
        makeMesh(mainGeo, 0xE0E0E0, ox, 9, oz);

        // Upper fly tower
        var towerGeo = new THREE.BoxGeometry(22, 12, 16);
        makeMesh(towerGeo, 0xD0D0D0, ox, 24, oz + 2);

        // Glass foyer facade
        var foyerGeo = new THREE.BoxGeometry(36, 10, 2);
        makeMesh(foyerGeo, 0x87CEEB, ox, 5, oz + 13);

        // Foyer columns
        var fc1Geo = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
        makeMesh(fc1Geo, 0xC0C0C0, ox - 12, 5, oz + 14);
        var fc2Geo = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
        makeMesh(fc2Geo, 0xC0C0C0, ox - 4, 5, oz + 14);
        var fc3Geo = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
        makeMesh(fc3Geo, 0xC0C0C0, ox + 4, 5, oz + 14);
        var fc4Geo = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
        makeMesh(fc4Geo, 0xC0C0C0, ox + 12, 5, oz + 14);

        // Side wings
        var wing1Geo = new THREE.BoxGeometry(10, 12, 20);
        makeMesh(wing1Geo, 0xD8D8D8, ox - 23, 6, oz);
        var wing2Geo = new THREE.BoxGeometry(10, 12, 20);
        makeMesh(wing2Geo, 0xD8D8D8, ox + 23, 6, oz);

        // Roof detail — flat parapet
        var roofEdgeGeo = new THREE.BoxGeometry(40, 1, 26);
        makeMesh(roofEdgeGeo, 0xBFBFBF, ox, 18.5, oz);

        // Quayside steps down to river
        var steps1Geo = new THREE.BoxGeometry(20, 0.5, 4);
        makeMesh(steps1Geo, 0xA0A0A0, ox, 0.25, oz + 15);
        var steps2Geo = new THREE.BoxGeometry(20, 0.5, 4);
        makeMesh(steps2Geo, 0x909090, ox, 0.25, oz + 19);

        // Sign board
        var signGeo = new THREE.BoxGeometry(18, 2, 0.2);
        makeMesh(signGeo, 0x1A1A2E, ox, 13, oz + 13.1);
    }

    function buildShandonBells() {
        var ox = 17840 + 70;
        var oz = -55;

        // Lower body of tower — limestone half (south/lower)
        var lowerGeo = new THREE.BoxGeometry(8, 10, 8);
        makeMesh(lowerGeo, 0xF5DEB3, ox, 5, oz);

        // Upper body of tower — red sandstone half
        var upperGeo = new THREE.BoxGeometry(8, 10, 8);
        makeMesh(upperGeo, 0xCD5C5C, ox, 15, oz);

        // Belfry stage
        var belfryGeo = new THREE.BoxGeometry(7, 5, 7);
        makeMesh(belfryGeo, 0xCD5C5C, ox, 22.5, oz);

        // Bell openings (dark boxes)
        var bell1Geo = new THREE.BoxGeometry(1.5, 2, 0.2);
        makeMesh(bell1Geo, 0x222222, ox - 2, 23, oz - 3.6);
        var bell2Geo = new THREE.BoxGeometry(1.5, 2, 0.2);
        makeMesh(bell2Geo, 0x222222, ox + 2, 23, oz - 3.6);
        var bell3Geo = new THREE.BoxGeometry(0.2, 2, 1.5);
        makeMesh(bell3Geo, 0x222222, ox + 3.6, 23, oz);

        // Octagonal top stage
        var octGeo = new THREE.CylinderGeometry(3, 3.5, 3, 8);
        makeMesh(octGeo, 0xCD5C5C, ox, 26.5, oz);

        // Ball finial
        var ballGeo = new THREE.SphereGeometry(1, 8, 8);
        makeMesh(ballGeo, 0xFFD700, ox, 29, oz);

        // Gold salmon weathervane — cone pointing up as stylized fish tail
        var vaneGeo = new THREE.ConeGeometry(0.4, 2, 4);
        makeMesh(vaneGeo, 0xFFD700, ox, 31, oz);

        // Nave / church body
        var naveGeo = new THREE.BoxGeometry(14, 7, 22);
        makeMesh(naveGeo, 0xF5DEB3, ox + 5, 3.5, oz + 12);

        // Nave roof
        var naveRoofGeo = new THREE.BoxGeometry(2.5, 3, 22);
        makeMesh(naveRoofGeo, 0x8B7355, ox + 5, 8.5, oz + 12);

        // Nave east gable
        var gableGeo = new THREE.BoxGeometry(14, 3, 1);
        makeMesh(gableGeo, 0xF5DEB3, ox + 5, 8.5, oz + 23);
        var gablePeakGeo = new THREE.ConeGeometry(7.5, 3, 4);
        makeMesh(gablePeakGeo, 0xF5DEB3, ox + 5, 11.5, oz + 23, 0, 0.785, 0);

        // Churchyard wall
        var wall1Geo = new THREE.BoxGeometry(40, 1.5, 0.5);
        makeMesh(wall1Geo, 0x808080, ox - 5, 0.75, oz + 25);
        var wall2Geo = new THREE.BoxGeometry(0.5, 1.5, 30);
        makeMesh(wall2Geo, 0x808080, ox - 25, 0.75, oz + 10);
    }

    function buildUCC() {
        var ox = 17840 - 100;
        var oz = 40;

        // Main quadrangle — west range
        var westGeo = new THREE.BoxGeometry(8, 14, 40);
        makeMesh(westGeo, 0x808080, ox - 20, 7, oz);

        // East range
        var eastGeo = new THREE.BoxGeometry(8, 14, 40);
        makeMesh(eastGeo, 0x808080, ox + 20, 7, oz);

        // North range
        var northGeo = new THREE.BoxGeometry(48, 14, 8);
        makeMesh(northGeo, 0x808080, ox, 7, oz - 20);

        // South range (open cloister)
        var southGeo = new THREE.BoxGeometry(48, 10, 8);
        makeMesh(southGeo, 0x7A7A7A, ox, 5, oz + 20);

        // Central lawn
        var lawnGeo = new THREE.BoxGeometry(30, 0.3, 30);
        makeMesh(lawnGeo, 0x228B22, ox, 0.15, oz);

        // Crenellations on west range parapet
        for (var cr = 0; cr < 5; cr++) {
            var crenGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            makeMesh(crenGeo, 0x696969, ox - 20, 14.75, oz - 16 + cr * 8);
        }
        // Crenellations on east range parapet
        for (var cr2 = 0; cr2 < 5; cr2++) {
            var cren2Geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            makeMesh(cren2Geo, 0x696969, ox + 20, 14.75, oz - 16 + cr2 * 8);
        }

        // Main tower / gatehouse
        var gateGeo = new THREE.BoxGeometry(10, 20, 10);
        makeMesh(gateGeo, 0x808080, ox, 10, oz - 24);

        // Gate tower spires
        var gateSpire1Geo = new THREE.ConeGeometry(2, 10, 4);
        makeMesh(gateSpire1Geo, 0x2F4F4F, ox - 4, 25, oz - 24);
        var gateSpire2Geo = new THREE.ConeGeometry(2, 10, 4);
        makeMesh(gateSpire2Geo, 0x2F4F4F, ox + 4, 25, oz - 24);

        // Library building east of quad
        var libGeo = new THREE.BoxGeometry(20, 10, 14);
        makeMesh(libGeo, 0x909090, ox + 36, 5, oz);

        // Library Gothic windows — dark boxes
        var libW1Geo = new THREE.BoxGeometry(1.5, 4, 0.2);
        makeMesh(libW1Geo, 0x1A1A2E, ox + 36 - 6, 5, oz - 7.1);
        var libW2Geo = new THREE.BoxGeometry(1.5, 4, 0.2);
        makeMesh(libW2Geo, 0x1A1A2E, ox + 36, 5, oz - 7.1);
        var libW3Geo = new THREE.BoxGeometry(1.5, 4, 0.2);
        makeMesh(libW3Geo, 0x1A1A2E, ox + 36 + 6, 5, oz - 7.1);

        // Aula Maxima — ceremonial hall
        var aulaGeo = new THREE.BoxGeometry(16, 12, 12);
        makeMesh(aulaGeo, 0x808080, ox - 36, 6, oz - 10);
        var aulaSpiGeo = new THREE.ConeGeometry(3, 8, 4);
        makeMesh(aulaSpiGeo, 0x2F4F4F, ox - 36, 16, oz - 10);

        // Grounds path
        var path1Geo = new THREE.BoxGeometry(48, 0.2, 3);
        makeMesh(path1Geo, 0xD2B48C, ox, 0.1, oz - 10);
        var path2Geo = new THREE.BoxGeometry(3, 0.2, 30);
        makeMesh(path2Geo, 0xD2B48C, ox, 0.1, oz);
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
