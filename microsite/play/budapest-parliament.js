window.BudapestParliament = (function() {
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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSph(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function buildParliament() {
        var cx = 23000;
        var cz = 200;
        var parlColor = 0xF5F0E0;
        var parlDark = 0xD8D0B8;
        var parlAccent = 0xC8B89A;

        // Main central body
        makeBox(268, 36, 70, parlColor, cx, 18, cz);

        // Central dome base
        makeCyl(18, 18, 12, 16, parlDark, cx, 54, cz);
        // Central dome
        makeSph(18, 16, 12, parlColor, cx, 70, cz);
        // Dome lantern
        makeCyl(3, 4, 10, 8, parlDark, cx, 87, cz);
        makeCone(3, 8, 8, parlAccent, cx, 97, cz);

        // Left Gothic spire (north)
        makeBox(18, 60, 18, parlColor, cx - 100, 30, cz);
        makeCone(8, 36, 8, parlDark, cx - 100, 78, cz);

        // Right Gothic spire (south)
        makeBox(18, 60, 18, parlColor, cx + 100, 30, cz);
        makeCone(8, 36, 8, parlDark, cx + 100, 78, cz);

        // North wing
        makeBox(68, 28, 60, parlColor, cx - 168, 14, cz);
        // South wing
        makeBox(68, 28, 60, parlColor, cx + 168, 14, cz);

        // Ornate pinnacles along roofline — north side
        var i;
        for (i = 0; i < 8; i++) {
            makeCone(2.5, 14, 6, parlDark, cx - 110 + i * 28, 50, cz - 35);
            makeCone(2.5, 14, 6, parlDark, cx - 110 + i * 28, 50, cz + 35);
        }

        // Arcaded ground level
        makeBox(268, 8, 74, parlAccent, cx, 4, cz);

        // Grand entrance steps
        makeBox(40, 2, 20, parlDark, cx, 37, cz - 45);
        makeBox(36, 2, 16, parlDark, cx, 39, cz - 44);
        makeBox(32, 2, 12, parlDark, cx, 41, cz - 43);

        // Flanking towers mid-body
        makeBox(14, 42, 14, parlColor, cx - 52, 21, cz);
        makeCone(6, 22, 8, parlDark, cx - 52, 53, cz);
        makeBox(14, 42, 14, parlColor, cx + 52, 21, cz);
        makeCone(6, 22, 8, parlDark, cx + 52, 53, cz);

        // Parliament foundation plinth
        makeBox(280, 4, 82, parlDark, cx, 2, cz);
    }

    function buildBudaCastle() {
        var cx = 22600;
        var cz = -400;
        var castleColor = 0xD4A870;
        var castleDark = 0xB88A50;
        var castleLight = 0xE8C890;

        // Castle Hill base
        makeBox(300, 80, 200, 0x886644, cx, -20, cz);

        // Main palace body
        makeBox(180, 50, 80, castleColor, cx, 80, cz);

        // Central dome of palace
        makeCyl(18, 18, 10, 16, castleDark, cx, 115, cz);
        makeSph(18, 16, 12, castleColor, cx, 128, cz);
        makeCyl(3, 4, 8, 8, castleDark, cx, 143, cz);

        // East wing
        makeBox(60, 44, 72, castleColor, cx + 120, 82, cz);
        // West wing
        makeBox(60, 44, 72, castleColor, cx - 120, 82, cz);

        // Fortified walls around complex
        makeBox(320, 20, 12, castleDark, cx, 68, cz - 110);
        makeBox(320, 20, 12, castleDark, cx, 68, cz + 110);
        makeBox(12, 20, 220, castleDark, cx - 160, 68, cz);
        makeBox(12, 20, 220, castleDark, cx + 160, 68, cz);

        // Corner towers
        makeCyl(10, 10, 30, 12, castleDark, cx - 160, 83, cz - 110);
        makeCone(8, 20, 8, castleLight, cx - 160, 108, cz - 110);
        makeCyl(10, 10, 30, 12, castleDark, cx + 160, 83, cz - 110);
        makeCone(8, 20, 8, castleLight, cx + 160, 108, cz - 110);
        makeCyl(10, 10, 30, 12, castleDark, cx - 160, 83, cz + 110);
        makeCone(8, 20, 8, castleLight, cx - 160, 108, cz + 110);
        makeCyl(10, 10, 30, 12, castleDark, cx + 160, 83, cz + 110);
        makeCone(8, 20, 8, castleLight, cx + 160, 108, cz + 110);

        // Fisherman's Bastion — 7 Neo-Romanesque towers (one per Magyar tribe)
        var fbcx = cx + 50;
        var fbcz = cz - 160;
        var fbColor = 0xF5F0E0;
        var fbDark = 0xD8D0B8;
        var j;
        for (j = 0; j < 7; j++) {
            makeCyl(6, 6, 22, 10, fbColor, fbcx - 60 + j * 20, 90, fbcz);
            makeCone(5, 16, 8, fbDark, fbcx - 60 + j * 20, 112, fbcz);
        }
        // Bastion walkway connecting towers
        makeBox(130, 6, 10, fbColor, fbcx, 84, fbcz);

        // Gate arch
        makeBox(20, 14, 10, castleDark, cx, 82, cz - 110);
        makeBox(20, 4, 10, castleColor, cx, 93, cz - 110);
    }

    function buildChainBridge() {
        var cx = 22800;
        var cz = 0;
        var bridgeColor = 0x888888;
        var bridgeDark = 0x606060;
        var chainColor = 0x707070;
        var lionColor = 0xC8A040;

        // Bridge deck
        makeBox(380, 6, 22, bridgeDark, cx, 3, cz);

        // West approach ramp
        makeBox(80, 4, 20, bridgeDark, cx - 230, 1, cz);

        // East approach ramp
        makeBox(80, 4, 20, bridgeDark, cx + 230, 1, cz);

        // Twin arch towers — west
        makeBox(14, 80, 14, bridgeColor, cx - 90, 43, cz);
        makeBox(30, 10, 16, bridgeColor, cx - 90, 87, cz);
        makeCyl(5, 5, 12, 8, bridgeDark, cx - 90, 97, cz);

        // Twin arch towers — east
        makeBox(14, 80, 14, bridgeColor, cx + 90, 43, cz);
        makeBox(30, 10, 16, bridgeColor, cx + 90, 87, cz);
        makeCyl(5, 5, 12, 8, bridgeDark, cx + 90, 97, cz);

        // Suspension chains (approximated with angled boxes)
        makeBox(4, 60, 4, chainColor, cx - 45, 54, cz - 8);
        makeBox(4, 60, 4, chainColor, cx + 45, 54, cz - 8);
        makeBox(4, 60, 4, chainColor, cx - 45, 54, cz + 8);
        makeBox(4, 60, 4, chainColor, cx + 45, 54, cz + 8);

        // Lion statues — 4 total (2 per end, flanking deck entrance)
        makeSph(5, 8, 8, lionColor, cx - 90, 12, cz - 18);
        makeBox(8, 6, 10, lionColor, cx - 90, 6, cz - 18);
        makeSph(5, 8, 8, lionColor, cx - 90, 12, cz + 18);
        makeBox(8, 6, 10, lionColor, cx - 90, 6, cz + 18);
        makeSph(5, 8, 8, lionColor, cx + 90, 12, cz - 18);
        makeBox(8, 6, 10, lionColor, cx + 90, 6, cz - 18);
        makeSph(5, 8, 8, lionColor, cx + 90, 12, cz + 18);
        makeBox(8, 6, 10, lionColor, cx + 90, 6, cz + 18);
    }

    function buildDanube() {
        var cx = 22800;
        var riverColor = 0x4682B4;
        var riverDark = 0x3A6FA0;

        // Wide river body
        makeBox(500, 2, 300, riverColor, cx, -1, 0);
        // River shimmer strips
        makeBox(480, 1, 20, riverDark, cx, 0, -60);
        makeBox(480, 1, 20, riverDark, cx, 0, 60);
        makeBox(480, 1, 20, riverDark, cx, 0, 0);
    }

    function buildMatthiasChurch() {
        var cx = 22580;
        var cz = -300;
        var churchColor = 0xD4C8A0;
        var churchDark = 0xA89870;
        var tileColor = 0x5A8A3C;
        var tileAlt = 0xE8C840;

        // Main nave
        makeBox(50, 30, 30, churchColor, cx, 15, cz);

        // Diamond-pattern tiled roof (approximated with colored boxes)
        makeBox(52, 8, 32, tileColor, cx, 38, cz);
        makeBox(44, 6, 26, tileAlt, cx, 43, cz);

        // Main 80m tower
        makeBox(14, 80, 14, churchColor, cx - 20, 40, cz - 10);
        makeCyl(6, 6, 10, 8, churchDark, cx - 20, 88, cz - 10);
        makeCone(5, 22, 8, tileColor, cx - 20, 100, cz - 10);

        // Secondary tower
        makeBox(10, 50, 10, churchColor, cx + 20, 25, cz - 10);
        makeCone(4, 16, 8, tileColor, cx + 20, 58, cz - 10);

        // Apse
        makeCyl(12, 12, 26, 10, churchColor, cx + 30, 13, cz + 8);
        makeCone(10, 18, 8, tileColor, cx + 30, 35, cz + 8);
    }

    function buildHeroesSquare() {
        var cx = 23400;
        var cz = -600;
        var monumentColor = 0xF5F5DC;
        var colColor = 0xD4C890;
        var statueColor = 0xC8A830;

        // Millennium column base
        makeBox(20, 8, 20, monumentColor, cx, 4, cz);
        // 36m column
        makeCyl(3, 4, 36, 12, colColor, cx, 26, cz);
        // Archangel Gabriel on top
        makeSph(4, 8, 8, statueColor, cx, 50, cz);
        makeCyl(1, 1, 8, 6, statueColor, cx, 57, cz);

        // Left semicircular colonnade
        makeCyl(4, 4, 16, 8, monumentColor, cx - 40, 8, cz - 10);
        makeCyl(4, 4, 16, 8, monumentColor, cx - 60, 8, cz - 30);
        makeCyl(4, 4, 16, 8, monumentColor, cx - 70, 8, cz - 55);
        makeBox(70, 6, 8, monumentColor, cx - 50, 19, cz - 30);

        // Right semicircular colonnade
        makeCyl(4, 4, 16, 8, monumentColor, cx + 40, 8, cz - 10);
        makeCyl(4, 4, 16, 8, monumentColor, cx + 60, 8, cz - 30);
        makeCyl(4, 4, 16, 8, monumentColor, cx + 70, 8, cz - 55);
        makeBox(70, 6, 8, monumentColor, cx + 50, 19, cz - 30);

        // Square paving
        makeBox(200, 1, 160, 0xE8E4D0, cx, 0, cz);
    }

    function buildGellertHill() {
        var cx = 22500;
        var cz = 500;
        var rockColor = 0x888888;
        var fortColor = 0x706858;
        var statueColor = 0xC0C0C0;

        // Rocky cliff mass
        makeBox(200, 120, 160, rockColor, cx, -20, cz);
        makeBox(160, 30, 130, 0x787878, cx, 80, cz);
        makeBox(100, 20, 90, 0x686868, cx, 100, cz);

        // Citadella fortress walls
        makeBox(120, 12, 10, fortColor, cx, 112, cz - 50);
        makeBox(120, 12, 10, fortColor, cx, 112, cz + 50);
        makeBox(10, 12, 100, fortColor, cx - 60, 112, cz);
        makeBox(10, 12, 100, fortColor, cx + 60, 112, cz);

        // Fortress corner bastions
        makeBox(20, 14, 20, fortColor, cx - 60, 116, cz - 50);
        makeBox(20, 14, 20, fortColor, cx + 60, 116, cz - 50);
        makeBox(20, 14, 20, fortColor, cx - 60, 116, cz + 50);
        makeBox(20, 14, 20, fortColor, cx + 60, 116, cz + 50);

        // Liberty Statue base
        makeBox(16, 10, 16, fortColor, cx, 125, cz);
        // Liberty Statue column
        makeCyl(3, 3, 24, 8, statueColor, cx, 143, cz);
        // Statue figure holding palm
        makeSph(5, 8, 8, statueColor, cx, 162, cz);
        makeBox(2, 12, 2, statueColor, cx - 6, 162, cz);
        makeBox(2, 12, 2, statueColor, cx + 6, 162, cz);
    }

    function buildStStephenBasilica() {
        var cx = 23200;
        var cz = 0;
        var basilicaColor = 0xD4C8A0;
        var basilicaDark = 0xB0A888;
        var domeColor = 0xC0B890;

        // Main nave body
        makeBox(80, 40, 50, basilicaColor, cx, 20, cz);

        // Transept (crossing)
        makeBox(40, 44, 80, basilicaColor, cx, 22, cz);

        // Central dome drum
        makeCyl(20, 20, 16, 16, basilicaDark, cx, 60, cz);
        // Main dome — 96m height
        makeSph(20, 16, 14, domeColor, cx, 80, cz);
        // Dome lantern
        makeCyl(4, 5, 10, 8, basilicaDark, cx, 98, cz);
        makeCone(4, 10, 8, basilicaColor, cx, 108, cz);

        // Twin bell towers (front facade)
        makeBox(16, 64, 16, basilicaColor, cx - 40, 32, cz - 33);
        makeBox(16, 64, 16, basilicaColor, cx + 40, 32, cz - 33);
        // Tower caps
        makeCone(8, 24, 8, basilicaDark, cx - 40, 80, cz - 33);
        makeCone(8, 24, 8, basilicaDark, cx + 40, 80, cz - 33);

        // Front facade with columns
        makeBox(100, 50, 8, basilicaColor, cx, 25, cz - 37);
        makeCyl(3, 3, 30, 8, basilicaDark, cx - 20, 15, cz - 41);
        makeCyl(3, 3, 30, 8, basilicaDark, cx, 15, cz - 41);
        makeCyl(3, 3, 30, 8, basilicaDark, cx + 20, 15, cz - 41);

        // Apse at rear
        makeCyl(18, 18, 36, 12, basilicaColor, cx, 18, cz + 50);
        makeCone(16, 20, 12, basilicaDark, cx, 54, cz + 50);
    }

    function buildGroundAndSkyElements() {
        var cx = 23000;

        // Ground plane (Pest side — east of Danube)
        makeBox(600, 4, 1200, 0x6B8C5A, cx + 200, -2, 0);

        // Ground plane (Buda side — west of Danube)
        makeBox(600, 4, 1200, 0x7A9060, cx - 200, -2, 0);

        // Margaret Island suggestion (in river, north)
        makeBox(60, 3, 180, 0x5A8040, cx, 1, -600);

        // Elizabeth Bridge suggestion
        makeBox(280, 4, 14, 0xA0A0A0, cx + 100, 3, 200);
        makeBox(10, 50, 10, 0x909090, cx + 100 - 80, 27, 200);
        makeBox(10, 50, 10, 0x909090, cx + 100 + 80, 27, 200);

        // Street lamps along bridge approach
        makeCyl(1, 1, 10, 6, 0x505050, cx - 110, 5, -15);
        makeSph(2, 6, 6, 0xFFFF88, cx - 110, 11, -15);
        makeCyl(1, 1, 10, 6, 0x505050, cx + 110, 5, -15);
        makeSph(2, 6, 6, 0xFFFF88, cx + 110, 11, -15);

        // Embankment promenade (Pest side, along Danube)
        makeBox(600, 3, 30, 0xC8C0A8, cx + 50, 1, 0);
    }

    function build() {
        buildDanube();
        buildParliament();
        buildBudaCastle();
        buildChainBridge();
        buildMatthiasChurch();
        buildHeroesSquare();
        buildGellertHill();
        buildStStephenBasilica();
        buildGroundAndSkyElements();
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
