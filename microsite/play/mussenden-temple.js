window.MussendenTemple = (function() {
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

    function build() {
        var ox = 19760;
        var oy = 0;
        var oz = 0;

        // ---- CLIFFTOP GROUND PLATFORM ----
        // Main clifftop ground slab (grassy headland)
        var clifftopGeo = new THREE.BoxGeometry(400, 4, 300);
        var clifftopMesh = new THREE.Mesh(clifftopGeo, makeMat(0x556B2F));
        clifftopMesh.position.set(ox, oy - 2, oz);
        addMesh(clifftopMesh);

        // Eastern clifftop extension
        var clifftopEastGeo = new THREE.BoxGeometry(200, 4, 200);
        var clifftopEastMesh = new THREE.Mesh(clifftopEastGeo, makeMat(0x4A5E28));
        clifftopEastMesh.position.set(ox + 250, oy - 2, oz + 20);
        addMesh(clifftopEastMesh);

        // ---- CLIFF FACE ----
        // Main cliff face dropping to the sea (north face)
        var cliffFaceGeo = new THREE.BoxGeometry(420, 120, 20);
        var cliffFaceMesh = new THREE.Mesh(cliffFaceGeo, makeMat(0x7A6A50));
        cliffFaceMesh.position.set(ox, oy - 62, oz - 160);
        addMesh(cliffFaceMesh);

        // Cliff face secondary section (east)
        var cliffFace2Geo = new THREE.BoxGeometry(20, 120, 160);
        var cliffFace2Mesh = new THREE.Mesh(cliffFace2Geo, makeMat(0x6B5A42));
        cliffFace2Mesh.position.set(ox + 210, oy - 62, oz - 80);
        addMesh(cliffFace2Mesh);

        // Cliff face west section
        var cliffFace3Geo = new THREE.BoxGeometry(20, 120, 160);
        var cliffFace3Mesh = new THREE.Mesh(cliffFace3Geo, makeMat(0x7A6A50));
        cliffFace3Mesh.position.set(ox - 210, oy - 62, oz - 80);
        addMesh(cliffFace3Mesh);

        // Rocky cliff base / talus slope
        var talusGeo = new THREE.BoxGeometry(440, 12, 40);
        var talusMesh = new THREE.Mesh(talusGeo, makeMat(0x5A4A35));
        talusMesh.position.set(ox, oy - 122, oz - 140);
        addMesh(talusMesh);

        // ---- ATLANTIC OCEAN BELOW CLIFF ----
        // Sea floor / ocean surface
        var oceanGeo = new THREE.BoxGeometry(600, 4, 400);
        var oceanMesh = new THREE.Mesh(oceanGeo, makeMat(0x1E6BA8));
        oceanMesh.position.set(ox, oy - 124, oz - 300);
        addMesh(oceanMesh);

        // Ocean depth fill
        var oceanDepthGeo = new THREE.BoxGeometry(600, 60, 400);
        var oceanDepthMesh = new THREE.Mesh(oceanDepthGeo, makeMat(0x155A8A));
        oceanDepthMesh.position.set(ox, oy - 154, oz - 300);
        addMesh(oceanDepthMesh);

        // Surf/wave line near cliff base — lighter foam strip
        var surfGeo = new THREE.BoxGeometry(440, 2, 12);
        var surfMesh = new THREE.Mesh(surfGeo, makeMat(0xB0D8F0));
        surfMesh.position.set(ox, oy - 121, oz - 162);
        addMesh(surfMesh);

        // ---- DOWNHILL BEACH below cliffs ----
        // Main beach strip — sandy, long, below cliffs
        var beachGeo = new THREE.BoxGeometry(600, 4, 80);
        var beachMesh = new THREE.Mesh(beachGeo, makeMat(0xF5DEB3));
        beachMesh.position.set(ox - 80, oy - 124, oz - 200);
        addMesh(beachMesh);

        // Beach further west (Benone Strand)
        var benoneGeo = new THREE.BoxGeometry(500, 4, 90);
        var beoneMesh = new THREE.Mesh(benoneGeo, makeMat(0xF0D8A8));
        beoneMesh.position.set(ox - 350, oy - 124, oz - 195);
        addMesh(beoneMesh);

        // Wet sand closer to water
        var wetSandGeo = new THREE.BoxGeometry(600, 2, 30);
        var wetSandMesh = new THREE.Mesh(wetSandGeo, makeMat(0xD4B896));
        wetSandMesh.position.set(ox - 80, oy - 123, oz - 228);
        addMesh(wetSandMesh);

        // ---- MUSSENDEN TEMPLE ----
        // Temple drum body (main circular cylinder)
        var templeDrumGeo = new THREE.CylinderGeometry(5, 5, 6, 24);
        var templeDrumMesh = new THREE.Mesh(templeDrumGeo, makeMat(0xF5F0E8));
        templeDrumMesh.position.set(ox, oy + 3, oz - 130);
        addMesh(templeDrumMesh);

        // Temple colonnade — 16 columns around outside
        var numCols = 16;
        var colRadius = 6.2;
        for (var c = 0; c < numCols; c++) {
            var angle = (c / numCols) * Math.PI * 2;
            var colX = ox + Math.sin(angle) * colRadius;
            var colZ = oz - 130 + Math.cos(angle) * colRadius;
            var colGeo = new THREE.CylinderGeometry(0.28, 0.32, 6.5, 8);
            var colMesh = new THREE.Mesh(colGeo, makeMat(0xF5F0E8));
            colMesh.position.set(colX, oy + 3.25, colZ);
            addMesh(colMesh);
        }

        // Temple dome (low sphere on top)
        var domeGeo = new THREE.SphereGeometry(4.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var domeMesh = new THREE.Mesh(domeGeo, makeMat(0xEAE5D5));
        domeMesh.position.set(ox, oy + 6.2, oz - 130);
        addMesh(domeMesh);

        // Dome finial / top knob
        var finialGeo = new THREE.SphereGeometry(0.35, 8, 8);
        var finialMesh = new THREE.Mesh(finialGeo, makeMat(0xD4C9A8));
        finialMesh.position.set(ox, oy + 11.1, oz - 130);
        addMesh(finialMesh);

        // Temple frieze / entablature inscription band (box strip around drum)
        var friezeGeo = new THREE.BoxGeometry(11, 0.7, 11);
        var friezeMesh = new THREE.Mesh(friezeGeo, makeMat(0xE8E3D2));
        friezeMesh.position.set(ox, oy + 6.05, oz - 130);
        addMesh(friezeMesh);

        // Temple stylobate / stepped base — lower step
        var base1Geo = new THREE.CylinderGeometry(6.0, 6.2, 0.5, 24);
        var base1Mesh = new THREE.Mesh(base1Geo, makeMat(0xDDD8C5));
        base1Mesh.position.set(ox, oy + 0.25, oz - 130);
        addMesh(base1Mesh);

        // Temple stylobate — upper step
        var base2Geo = new THREE.CylinderGeometry(5.5, 6.0, 0.4, 24);
        var base2Mesh = new THREE.Mesh(base2Geo, makeMat(0xE0DBCa));
        base2Mesh.position.set(ox, oy + 0.7, oz - 130);
        addMesh(base2Mesh);

        // Temple door opening (dark box inset into drum)
        var doorGeo = new THREE.BoxGeometry(1.2, 2.6, 0.4);
        var doorMesh = new THREE.Mesh(doorGeo, makeMat(0x2A1F10));
        doorMesh.position.set(ox, oy + 2.3, oz - 130 + 5.1);
        addMesh(doorMesh);

        // Temple window opening south side
        var winGeo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
        var winMesh = new THREE.Mesh(winGeo, makeMat(0x2A1F10));
        winMesh.position.set(ox, oy + 3.5, oz - 130 - 5.1);
        addMesh(winMesh);

        // ---- CLIFF EDGE GRASS TURF near temple ----
        var cliffGrassGeo = new THREE.BoxGeometry(60, 1, 30);
        var cliffGrassMesh = new THREE.Mesh(cliffGrassGeo, makeMat(0x4A7A2A));
        cliffGrassMesh.position.set(ox, oy + 0.5, oz - 145);
        addMesh(cliffGrassMesh);

        // ---- BISHOP'S GATE (Gothic sandstone archway) ----
        // Left pillar
        var gatePillarLGeo = new THREE.BoxGeometry(1.8, 7, 2);
        var gatePillarLMesh = new THREE.Mesh(gatePillarLGeo, makeMat(0x8B7355));
        gatePillarLMesh.position.set(ox - 40, oy + 3.5, oz - 30);
        addMesh(gatePillarLMesh);

        // Right pillar
        var gatePillarRGeo = new THREE.BoxGeometry(1.8, 7, 2);
        var gatePillarRMesh = new THREE.Mesh(gatePillarRGeo, makeMat(0x8B7355));
        gatePillarRMesh.position.set(ox - 36, oy + 3.5, oz - 30);
        addMesh(gatePillarRMesh);

        // Arch lintel (horizontal cap)
        var gateLintGeo = new THREE.BoxGeometry(5.8, 1.2, 2);
        var gateLintMesh = new THREE.Mesh(gateLintGeo, makeMat(0x7A6448));
        gateLintMesh.position.set(ox - 38, oy + 7.2, oz - 30);
        addMesh(gateLintMesh);

        // Gothic arch apex (small box above lintel for pointed look)
        var gateApexGeo = new THREE.BoxGeometry(1.8, 1.4, 2);
        var gateApexMesh = new THREE.Mesh(gateApexGeo, makeMat(0x8B7355));
        gateApexMesh.position.set(ox - 38, oy + 8.1, oz - 30);
        addMesh(gateApexMesh);

        // Gate hood moulding finial top (cone)
        var gateFinialGeo = new THREE.ConeGeometry(0.5, 1.2, 6);
        var gateFinialMesh = new THREE.Mesh(gateFinialGeo, makeMat(0x8B7355));
        gateFinialMesh.position.set(ox - 38, oy + 9.2, oz - 30);
        addMesh(gateFinialMesh);

        // ---- DOWNHILL DEMESNE PALACE RUINS ----
        // Palace ruin — main long north wall (roofless)
        var palNWallGeo = new THREE.BoxGeometry(60, 9, 2);
        var palNWallMesh = new THREE.Mesh(palNWallGeo, makeMat(0x696969));
        palNWallMesh.position.set(ox + 60, oy + 4.5, oz - 20);
        addMesh(palNWallMesh);

        // Palace ruin — south wall
        var palSWallGeo = new THREE.BoxGeometry(60, 9, 2);
        var palSWallMesh = new THREE.Mesh(palSWallGeo, makeMat(0x696969));
        palSWallMesh.position.set(ox + 60, oy + 4.5, oz + 30);
        addMesh(palSWallMesh);

        // Palace ruin — east end wall
        var palEWallGeo = new THREE.BoxGeometry(2, 9, 50);
        var palEWallMesh = new THREE.Mesh(palEWallGeo, makeMat(0x696969));
        palEWallMesh.position.set(ox + 90, oy + 4.5, oz + 5);
        addMesh(palEWallMesh);

        // Palace ruin — west end wall (partial collapse)
        var palWWallGeo = new THREE.BoxGeometry(2, 6, 30);
        var palWWallMesh = new THREE.Mesh(palWWallGeo, makeMat(0x6A6A6A));
        palWWallMesh.position.set(ox + 30, oy + 3, oz + 5);
        addMesh(palWWallMesh);

        // Palace window opening N wall 1
        var pWin1Geo = new THREE.BoxGeometry(3, 4, 2.2);
        var pWin1Mesh = new THREE.Mesh(pWin1Geo, makeMat(0x1A1A1A));
        pWin1Mesh.position.set(ox + 48, oy + 5, oz - 20);
        addMesh(pWin1Mesh);

        // Palace window opening N wall 2
        var pWin2Geo = new THREE.BoxGeometry(3, 4, 2.2);
        var pWin2Mesh = new THREE.Mesh(pWin2Geo, makeMat(0x1A1A1A));
        pWin2Mesh.position.set(ox + 62, oy + 5, oz - 20);
        addMesh(pWin2Mesh);

        // Palace window opening N wall 3
        var pWin3Geo = new THREE.BoxGeometry(3, 4, 2.2);
        var pWin3Mesh = new THREE.Mesh(pWin3Geo, makeMat(0x1A1A1A));
        pWin3Mesh.position.set(ox + 76, oy + 5, oz - 20);
        addMesh(pWin3Mesh);

        // Palace window opening S wall 1
        var pWin4Geo = new THREE.BoxGeometry(3, 4, 2.2);
        var pWin4Mesh = new THREE.Mesh(pWin4Geo, makeMat(0x1A1A1A));
        pWin4Mesh.position.set(ox + 50, oy + 5, oz + 30);
        addMesh(pWin4Mesh);

        // Ivy patches on palace walls (green box patches)
        var ivy1Geo = new THREE.BoxGeometry(8, 5, 0.5);
        var ivy1Mesh = new THREE.Mesh(ivy1Geo, makeMat(0x228B22));
        ivy1Mesh.position.set(ox + 55, oy + 5, oz - 19.6);
        addMesh(ivy1Mesh);

        var ivy2Geo = new THREE.BoxGeometry(6, 4, 0.5);
        var ivy2Mesh = new THREE.Mesh(ivy2Geo, makeMat(0x1E7A1E));
        ivy2Mesh.position.set(ox + 75, oy + 4, oz + 30.3);
        addMesh(ivy2Mesh);

        var ivy3Geo = new THREE.BoxGeometry(5, 6, 0.5);
        var ivy3Mesh = new THREE.Mesh(ivy3Geo, makeMat(0x228B22));
        ivy3Mesh.position.set(ox + 90.3, oy + 5, oz + 10);
        addMesh(ivy3Mesh);

        // Palace interior rubble/debris pile
        var rubble1Geo = new THREE.BoxGeometry(8, 1.5, 6);
        var rubble1Mesh = new THREE.Mesh(rubble1Geo, makeMat(0x7A7A7A));
        rubble1Mesh.position.set(ox + 60, oy + 0.75, oz + 8);
        addMesh(rubble1Mesh);

        var rubble2Geo = new THREE.BoxGeometry(5, 1.0, 4);
        var rubble2Mesh = new THREE.Mesh(rubble2Geo, makeMat(0x696969));
        rubble2Mesh.position.set(ox + 50, oy + 0.5, oz + 2);
        addMesh(rubble2Mesh);

        // Palace collapsed wall section (lower portion remains)
        var palCollapseGeo = new THREE.BoxGeometry(14, 3.5, 2);
        var palCollapseMesh = new THREE.Mesh(palCollapseGeo, makeMat(0x5A5A5A));
        palCollapseMesh.position.set(ox + 38, oy + 1.75, oz - 20);
        addMesh(palCollapseMesh);

        // ---- PERIMETER DEMESNE WALLS ----
        // Long north perimeter wall segment 1
        var wall1Geo = new THREE.BoxGeometry(120, 3.5, 1.2);
        var wall1Mesh = new THREE.Mesh(wall1Geo, makeMat(0x8B7355));
        wall1Mesh.position.set(ox + 20, oy + 1.75, oz - 90);
        addMesh(wall1Mesh);

        // Wall segment 2 (east side)
        var wall2Geo = new THREE.BoxGeometry(1.2, 3.5, 80);
        var wall2Mesh = new THREE.Mesh(wall2Geo, makeMat(0x8B7355));
        wall2Mesh.position.set(ox + 140, oy + 1.75, oz - 40);
        addMesh(wall2Mesh);

        // Wall segment 3 (south boundary)
        var wall3Geo = new THREE.BoxGeometry(140, 3.5, 1.2);
        var wall3Mesh = new THREE.Mesh(wall3Geo, makeMat(0x7A6448));
        wall3Mesh.position.set(ox + 50, oy + 1.75, oz + 70);
        addMesh(wall3Mesh);

        // Wall segment 4 (west short section)
        var wall4Geo = new THREE.BoxGeometry(1.2, 3.5, 60);
        var wall4Mesh = new THREE.Mesh(wall4Geo, makeMat(0x8B7355));
        wall4Mesh.position.set(ox - 80, oy + 1.75, oz - 10);
        addMesh(wall4Mesh);

        // Wall coping stones (narrow boxes on top of main walls)
        var cope1Geo = new THREE.BoxGeometry(120, 0.4, 1.6);
        var cope1Mesh = new THREE.Mesh(cope1Geo, makeMat(0x9C8565));
        cope1Mesh.position.set(ox + 20, oy + 3.7, oz - 90);
        addMesh(cope1Mesh);

        // ---- LION'S GATE LODGE (small cottage at estate entrance) ----
        // Lodge main body
        var lodgeGeo = new THREE.BoxGeometry(8, 5, 7);
        var lodgeMesh = new THREE.Mesh(lodgeGeo, makeMat(0x8B7355));
        lodgeMesh.position.set(ox - 55, oy + 2.5, oz + 50);
        addMesh(lodgeMesh);

        // Lodge roof
        var lodgeRoofGeo = new THREE.CylinderGeometry(0.1, 6.2, 3, 4);
        var lodgeRoofMesh = new THREE.Mesh(lodgeRoofGeo, makeMat(0x5A3A1A));
        lodgeRoofMesh.position.set(ox - 55, oy + 6.5, oz + 50);
        lodgeRoofMesh.rotation.y = Math.PI / 4;
        addMesh(lodgeRoofMesh);

        // Lodge chimney
        var lodgeChimGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8);
        var lodgeChimMesh = new THREE.Mesh(lodgeChimGeo, makeMat(0x7A6448));
        lodgeChimMesh.position.set(ox - 53, oy + 8.2, oz + 50);
        addMesh(lodgeChimMesh);

        // Lodge door
        var lodgeDoorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.3);
        var lodgeDoorMesh = new THREE.Mesh(lodgeDoorGeo, makeMat(0x3A2A10));
        lodgeDoorMesh.position.set(ox - 55, oy + 1.1, oz + 53.6);
        addMesh(lodgeDoorMesh);

        // Lodge window
        var lodgeWinGeo = new THREE.BoxGeometry(1.0, 0.9, 0.3);
        var lodgeWinMesh = new THREE.Mesh(lodgeWinGeo, makeMat(0x8BB8D4));
        lodgeWinMesh.position.set(ox - 52, oy + 2.5, oz + 53.6);
        addMesh(lodgeWinMesh);

        // Gate pillars at lodge
        var lGatePilL = new THREE.BoxGeometry(1, 4, 1);
        var lGatePilLMesh = new THREE.Mesh(lGatePilL, makeMat(0x8B7355));
        lGatePilLMesh.position.set(ox - 59, oy + 2, oz + 53);
        addMesh(lGatePilLMesh);

        var lGatePilR = new THREE.BoxGeometry(1, 4, 1);
        var lGatePilRMesh = new THREE.Mesh(lGatePilR, makeMat(0x8B7355));
        lGatePilRMesh.position.set(ox - 51, oy + 2, oz + 53);
        addMesh(lGatePilRMesh);

        // Lion finials on gate pillars (small spheres)
        var lionL = new THREE.SphereGeometry(0.5, 6, 6);
        var lionLMesh = new THREE.Mesh(lionL, makeMat(0xC8A850));
        lionLMesh.position.set(ox - 59, oy + 4.6, oz + 53);
        addMesh(lionLMesh);

        var lionR = new THREE.SphereGeometry(0.5, 6, 6);
        var lionRMesh = new THREE.Mesh(lionR, makeMat(0xC8A850));
        lionRMesh.position.set(ox - 51, oy + 4.6, oz + 53);
        addMesh(lionRMesh);

        // ---- SHEEP on headland ----
        // Each sheep: body (sphere) + head (smaller sphere)
        var sheepPositions = [
            [ox - 20, oz + 40],
            [ox - 30, oz + 55],
            [ox + 10, oz + 60],
            [ox + 5, oz + 45],
            [ox - 45, oz + 30],
            [ox + 30, oz + 80],
            [ox - 10, oz + 70]
        ];
        for (var s = 0; s < sheepPositions.length; s++) {
            var sx = sheepPositions[s][0];
            var sz = sheepPositions[s][1];
            // sheep body
            var sheepBodyGeo = new THREE.SphereGeometry(0.9, 8, 6);
            var sheepBodyMesh = new THREE.Mesh(sheepBodyGeo, makeMat(0xFFFFF0));
            sheepBodyMesh.position.set(sx, oy + 0.9, sz);
            addMesh(sheepBodyMesh);
            // sheep head
            var sheepHeadGeo = new THREE.SphereGeometry(0.4, 6, 6);
            var sheepHeadMesh = new THREE.Mesh(sheepHeadGeo, makeMat(0xEEEEDD));
            sheepHeadMesh.position.set(sx + 0.9, oy + 1.3, sz);
            addMesh(sheepHeadMesh);
        }

        // ---- CLIFFSIDE PATH / TRACK ----
        // Narrow path from estate towards temple on cliff edge
        var path1Geo = new THREE.BoxGeometry(4, 0.3, 80);
        var path1Mesh = new THREE.Mesh(path1Geo, makeMat(0xA8926A));
        path1Mesh.position.set(ox + 6, oy + 0.15, oz - 90);
        addMesh(path1Mesh);

        // ---- ESTATE TREES / VEGETATION ----
        // Windswept tree trunks (cylinders) and canopies (spheres) on clifftop
        var treeData = [
            [ox - 70, oz + 10],
            [ox - 75, oz + 22],
            [ox + 120, oz + 20],
            [ox + 110, oz + 35]
        ];
        for (var t = 0; t < treeData.length; t++) {
            var tx = treeData[t][0];
            var tz = treeData[t][1];
            var trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 4.5, 6);
            var trunkMesh = new THREE.Mesh(trunkGeo, makeMat(0x5C3D1E));
            trunkMesh.position.set(tx, oy + 2.25, tz);
            addMesh(trunkMesh);
            var canopyGeo = new THREE.SphereGeometry(2.2, 8, 6);
            var canopyMesh = new THREE.Mesh(canopyGeo, makeMat(0x2D6A1F));
            canopyMesh.position.set(tx + 0.8, oy + 5.5, tz);
            addMesh(canopyMesh);
        }

        // ---- DOWNHILL MAUSOLEUM / FOLLY remnant ----
        // Small square tower ruin on clifftop (estate folly)
        var follyGeo = new THREE.BoxGeometry(4, 8, 4);
        var follyMesh = new THREE.Mesh(follyGeo, makeMat(0x6E6059));
        follyMesh.position.set(ox + 100, oy + 4, oz - 60);
        addMesh(follyMesh);

        // Folly top broken edge
        var follyTopGeo = new THREE.BoxGeometry(4.2, 0.8, 4.2);
        var follyTopMesh = new THREE.Mesh(follyTopGeo, makeMat(0x5A4E45));
        follyTopMesh.position.set(ox + 100, oy + 8.4, oz - 60);
        addMesh(follyTopMesh);

        // ---- GRASS TUFTS / GROUND DETAIL ----
        // Scattered clumps of rough grass
        var grassData = [
            [ox - 100, oz - 80],
            [ox - 60, oz - 60],
            [ox + 30, oz - 50],
            [ox - 15, oz - 40],
            [ox + 70, oz - 70]
        ];
        for (var g = 0; g < grassData.length; g++) {
            var gx = grassData[g][0];
            var gz = grassData[g][1];
            var grassGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
            var grassMesh = new THREE.Mesh(grassGeo, makeMat(0x4A7228));
            grassMesh.position.set(gx, oy + 0.25, gz);
            addMesh(grassMesh);
        }

        // ---- ROCKY OUTCROPS on clifftop ----
        var rockData = [
            [ox - 90, oz - 110, 2.5, 1.2, 2.0],
            [ox - 85, oz - 95, 1.5, 0.8, 1.5],
            [ox + 150, oz - 100, 3.0, 1.5, 2.5],
            [ox + 10, oz - 148, 2.0, 1.0, 1.8]
        ];
        for (var r = 0; r < rockData.length; r++) {
            var rockGeo = new THREE.BoxGeometry(rockData[r][2], rockData[r][3], rockData[r][4]);
            var rockMesh = new THREE.Mesh(rockGeo, makeMat(0x8A8070));
            rockMesh.position.set(rockData[r][0], oy + rockData[r][3] / 2, rockData[r][1]);
            addMesh(rockMesh);
        }

        // ---- ESTATE SERVICE BUILDING (ruined outbuilding) ----
        var outbuildGeo = new THREE.BoxGeometry(14, 4, 9);
        var outbuildMesh = new THREE.Mesh(outbuildGeo, makeMat(0x696969));
        outbuildMesh.position.set(ox + 60, oy + 2, oz - 60);
        addMesh(outbuildMesh);

        // Outbuilding doorway opening
        var outDoorGeo = new THREE.BoxGeometry(2.2, 2.8, 9.2);
        var outDoorMesh = new THREE.Mesh(outDoorGeo, makeMat(0x1A1A1A));
        outDoorMesh.position.set(ox + 55, oy + 1.4, oz - 60);
        addMesh(outDoorMesh);

        // Partial remaining roof on outbuilding
        var outRoofGeo = new THREE.BoxGeometry(6, 0.5, 9.2);
        var outRoofMesh = new THREE.Mesh(outRoofGeo, makeMat(0x5A5050));
        outRoofMesh.position.set(ox + 63, oy + 4.25, oz - 60);
        addMesh(outRoofMesh);

        // ---- FLAGPOLE on clifftop ----
        var poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 10, 6);
        var poleMesh = new THREE.Mesh(poleGeo, makeMat(0xC8C8C8));
        poleMesh.position.set(ox - 5, oy + 5, oz - 120);
        addMesh(poleMesh);

        // Flag on pole (small box)
        var flagGeo = new THREE.BoxGeometry(2.5, 1.4, 0.05);
        var flagMesh = new THREE.Mesh(flagGeo, makeMat(0x003399));
        flagMesh.position.set(ox - 3.75, oy + 9.3, oz - 120);
        addMesh(flagMesh);
    }

    function update(delta) { }

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
