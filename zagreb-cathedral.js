window.ZagrebCathedral = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 23240;
    var CY = 0;
    var CZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        if (sx !== undefined) mesh.scale.set(sx, sy, sz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function mat(color, emissive) {
        return new THREE.MeshLambertMaterial({ color: color, emissive: emissive || 0x000000 });
    }

    function build() {
        buildGround();
        buildZagrebCathedral();
        buildBanJelacicSquare();
        buildGornjiGrad();
        buildDolacMarket();
        buildMirogojCemetery();
        buildMuseumBrokenRelationships();
        buildNationalTheatre();
        buildTkalcicevaStreet();
        buildMaksimirPark();
        buildBundekLake();
    }

    function buildGround() {
        // Ground base slab for the entire area
        var groundGeo = new THREE.BoxGeometry(2400, 2, 2400);
        var groundMat = mat(0x8B7D6B);
        addMesh(groundGeo, groundMat, CX, CY - 1, CZ);

        // Road network — main boulevard
        var road1Geo = new THREE.BoxGeometry(2400, 0.5, 24);
        addMesh(road1Geo, mat(0x444444), CX, CY + 0.25, CZ);

        var road2Geo = new THREE.BoxGeometry(24, 0.5, 2400);
        addMesh(road2Geo, mat(0x444444), CX, CY + 0.25, CZ);
    }

    // ─── ZAGREB CATHEDRAL ───────────────────────────────────────────────────────
    function buildZagrebCathedral() {
        var ox = CX - 600;
        var oz = CZ - 200;

        // Main nave — long rectangular body
        var naveGeo = new THREE.BoxGeometry(30, 28, 80);
        addMesh(naveGeo, mat(0xD4C8A0), ox, CY + 14, oz);

        // Nave roof — pointed Gothic shape built from two boxes
        var roofGeo = new THREE.BoxGeometry(32, 14, 82);
        addMesh(roofGeo, mat(0xC8BCAA), ox, CY + 35, oz);

        // Choir / apse at back
        var apsisGeo = new THREE.CylinderGeometry(10, 10, 22, 8);
        addMesh(apsisGeo, mat(0xD4C8A0), ox, CY + 11, oz + 50);

        // Apse conical roof
        var apsisRoofGeo = new THREE.ConeGeometry(11, 14, 8);
        addMesh(apsisRoofGeo, mat(0xC0B89A), ox, CY + 29, oz + 50);

        // West facade base block
        var facadeGeo = new THREE.BoxGeometry(36, 32, 8);
        addMesh(facadeGeo, mat(0xDDD4B4), ox, CY + 16, oz - 44);

        // Rose window — decorative disk on facade
        var roseGeo = new THREE.CylinderGeometry(4, 4, 1, 12);
        addMesh(roseGeo, mat(0xFFD700, 0x443300), ox, CY + 22, oz - 48, Math.PI / 2, 0, 0);

        // Left (north) tower base
        var tower1BaseGeo = new THREE.BoxGeometry(10, 60, 10);
        addMesh(tower1BaseGeo, mat(0xD4C8A0), ox - 12, CY + 30, oz - 42);

        // Left tower upper section
        var tower1UpperGeo = new THREE.BoxGeometry(8, 30, 8);
        addMesh(tower1UpperGeo, mat(0xCFC3A5), ox - 12, CY + 75, oz - 42);

        // Left tower spire (108m total)
        var spire1Geo = new THREE.ConeGeometry(4, 18, 6);
        addMesh(spire1Geo, mat(0xB8B0A0), ox - 12, CY + 99, oz - 42);

        // Right (south) tower base
        var tower2BaseGeo = new THREE.BoxGeometry(10, 60, 10);
        addMesh(tower2BaseGeo, mat(0xD4C8A0), ox + 12, CY + 30, oz - 42);

        // Right tower upper section
        var tower2UpperGeo = new THREE.BoxGeometry(8, 30, 8);
        addMesh(tower2UpperGeo, mat(0xCFC3A5), ox + 12, CY + 75, oz - 42);

        // Right tower spire
        var spire2Geo = new THREE.ConeGeometry(4, 18, 6);
        addMesh(spire2Geo, mat(0xB8B0A0), ox + 12, CY + 99, oz - 42);

        // Flying buttresses — left side series
        var butt1Geo = new THREE.BoxGeometry(6, 3, 10);
        addMesh(butt1Geo, mat(0xCCBFA0), ox - 20, CY + 20, oz - 20, 0, 0, 0.4);
        var butt2Geo = new THREE.BoxGeometry(6, 3, 10);
        addMesh(butt2Geo, mat(0xCCBFA0), ox - 20, CY + 20, oz, 0, 0, 0.4);
        var butt3Geo = new THREE.BoxGeometry(6, 3, 10);
        addMesh(butt3Geo, mat(0xCCBFA0), ox - 20, CY + 20, oz + 20, 0, 0, 0.4);

        // Sacristy — golden treasury wing
        var sacristyGeo = new THREE.BoxGeometry(14, 16, 22);
        addMesh(sacristyGeo, mat(0xD4A820), ox + 24, CY + 8, oz + 20);

        // Sacristy dome
        var sacristyDomeGeo = new THREE.SphereGeometry(7, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(sacristyDomeGeo, mat(0xFFD700, 0x554400), ox + 24, CY + 17, oz + 20);

        // Cathedral forecourt paving
        var courtyardGeo = new THREE.BoxGeometry(60, 0.4, 50);
        addMesh(courtyardGeo, mat(0xE0D8C0), ox, CY + 0.2, oz - 68);

        // Stone perimeter wall around cathedral
        var wallNGeo = new THREE.BoxGeometry(80, 4, 2);
        addMesh(wallNGeo, mat(0xC8C0A8), ox, CY + 2, oz - 94);
    }

    // ─── BAN JELAČIĆ SQUARE ─────────────────────────────────────────────────────
    function buildBanJelacicSquare() {
        var ox = CX;
        var oz = CZ;

        // Square paving
        var squarePaveGeo = new THREE.BoxGeometry(160, 0.3, 160);
        addMesh(squarePaveGeo, mat(0xD4C8A0), ox, CY + 0.15, oz);

        // Central equestrian statue — horse body
        var horseBodyGeo = new THREE.BoxGeometry(3, 3, 5);
        addMesh(horseBodyGeo, mat(0x5C4A2A), ox, CY + 7.5, oz);

        // Horse legs
        var legGeo = new THREE.CylinderGeometry(0.4, 0.4, 4, 6);
        addMesh(legGeo, mat(0x5C4A2A), ox - 1, CY + 4, oz - 1);
        addMesh(legGeo.clone(), mat(0x5C4A2A), ox + 1, CY + 4, oz - 1);
        addMesh(legGeo.clone(), mat(0x5C4A2A), ox - 1, CY + 4, oz + 1);
        addMesh(legGeo.clone(), mat(0x5C4A2A), ox + 1, CY + 4, oz + 1);

        // Horse head
        var horseHeadGeo = new THREE.BoxGeometry(1.5, 2, 2);
        addMesh(horseHeadGeo, mat(0x5C4A2A), ox, CY + 10, oz - 3);

        // Rider — Ban Jelačić figure
        var riderGeo = new THREE.CylinderGeometry(0.8, 1, 3.5, 6);
        addMesh(riderGeo, mat(0x3A3A3A), ox, CY + 11.5, oz);

        // Rider head
        var riderHeadGeo = new THREE.SphereGeometry(0.7, 6, 6);
        addMesh(riderHeadGeo, mat(0xC8A070), ox, CY + 13.8, oz);

        // Pedestal base
        var pedestalGeo = new THREE.BoxGeometry(6, 5, 6);
        addMesh(pedestalGeo, mat(0xC0B8A8), ox, CY + 2.5, oz);

        // Tram line rails — east-west
        var tramRail1Geo = new THREE.BoxGeometry(160, 0.2, 1);
        addMesh(tramRail1Geo, mat(0x888888), ox, CY + 0.4, oz - 30);
        var tramRail2Geo = new THREE.BoxGeometry(160, 0.2, 1);
        addMesh(tramRail2Geo, mat(0x888888), ox, CY + 0.4, oz + 30);

        // Tram line rails — north-south
        var tramRail3Geo = new THREE.BoxGeometry(1, 0.2, 160);
        addMesh(tramRail3Geo, mat(0x888888), ox - 30, CY + 0.4, oz);

        // Fountain — basin
        var fountainBasinGeo = new THREE.CylinderGeometry(8, 9, 1.5, 12);
        addMesh(fountainBasinGeo, mat(0xBBB0A0), ox + 50, CY + 0.75, oz - 40);

        // Fountain central column
        var fountainColGeo = new THREE.CylinderGeometry(1, 1.5, 4, 8);
        addMesh(fountainColGeo, mat(0xBBB0A0), ox + 50, CY + 3, oz - 40);

        // Fountain top sphere (water spray representation)
        var fountainTopGeo = new THREE.SphereGeometry(2, 8, 8);
        addMesh(fountainTopGeo, mat(0x8AB4C8, 0x002233), ox + 50, CY + 6.5, oz - 40);

        // Surrounding 19th-century buildings — north block
        var bldgNGeo = new THREE.BoxGeometry(160, 20, 16);
        addMesh(bldgNGeo, mat(0xD4C8A0), ox, CY + 10, oz - 88);

        // North building roof
        var bldgNRoofGeo = new THREE.BoxGeometry(162, 4, 18);
        addMesh(bldgNRoofGeo, mat(0xC0AA80), ox, CY + 22, oz - 88);

        // Surrounding buildings — south block
        var bldgSGeo = new THREE.BoxGeometry(160, 20, 16);
        addMesh(bldgSGeo, mat(0xD4C8A0), ox, CY + 10, oz + 88);

        // Surrounding buildings — east block
        var bldgEGeo = new THREE.BoxGeometry(16, 20, 120);
        addMesh(bldgEGeo, mat(0xD4C8A0), ox + 88, CY + 10, oz);

        // Surrounding buildings — west block
        var bldgWGeo = new THREE.BoxGeometry(16, 20, 120);
        addMesh(bldgWGeo, mat(0xD4C8A0), ox - 88, CY + 10, oz);
    }

    // ─── GORNJI GRAD (UPPER TOWN) ────────────────────────────────────────────────
    function buildGornjiGrad() {
        var ox = CX + 200;
        var oz = CZ - 300;
        var hillY = 30; // elevated hill

        // Hill base — sloped terrain approximated
        var hillGeo = new THREE.BoxGeometry(300, 30, 300);
        addMesh(hillGeo, mat(0xA09070), ox, CY + 15, oz);

        // St Mark's Church — main body
        var stMarkGeo = new THREE.BoxGeometry(20, 18, 28);
        addMesh(stMarkGeo, mat(0xD4C8A0), ox, CY + hillY + 9, oz);

        // St Mark's colourful tiled roof — Croatian coat of arms tiles
        // Represented as coloured box panels on the roof
        var roofBaseGeo = new THREE.BoxGeometry(22, 2, 30);
        addMesh(roofBaseGeo, mat(0xCC2222), ox, CY + hillY + 19, oz); // red tiles

        // White tile sections (chequerboard)
        var tile1Geo = new THREE.BoxGeometry(5, 2.2, 14);
        addMesh(tile1Geo, mat(0xFFFFFF), ox - 3, CY + hillY + 20, oz - 7);
        var tile2Geo = new THREE.BoxGeometry(5, 2.2, 14);
        addMesh(tile2Geo, mat(0xFFFFFF), ox + 3, CY + hillY + 20, oz + 7);

        // Blue tile strip (Zagreb city arms)
        var tile3Geo = new THREE.BoxGeometry(5, 2.2, 28);
        addMesh(tile3Geo, mat(0x224488), ox - 7, CY + hillY + 20, oz);

        // Roof ridge / pitched
        var ridgeGeo = new THREE.BoxGeometry(2, 4, 30);
        addMesh(ridgeGeo, mat(0xA09070), ox, CY + hillY + 22, oz);

        // St Mark's bell tower
        var bellTowerGeo = new THREE.BoxGeometry(7, 30, 7);
        addMesh(bellTowerGeo, mat(0xD4C8A0), ox - 14, CY + hillY + 15, oz - 10);

        // Bell tower spire
        var bellSpireGeo = new THREE.ConeGeometry(4, 10, 6);
        addMesh(bellSpireGeo, mat(0x8C8870), ox - 14, CY + hillY + 35, oz - 10);

        // Lotrščak Tower — cylindrical medieval watchtower
        var lotrscakGeo = new THREE.CylinderGeometry(5, 6, 32, 10);
        addMesh(lotrscakGeo, mat(0xC8BC9A), ox + 60, CY + hillY + 16, oz + 30);

        // Lotrščak battlement top
        var battleGeo = new THREE.BoxGeometry(14, 4, 14);
        addMesh(battleGeo, mat(0xBCAFA0), ox + 60, CY + hillY + 34, oz + 30);

        // Lotrščak conical roof
        var lotrscakRoofGeo = new THREE.ConeGeometry(5.5, 8, 10);
        addMesh(lotrscakRoofGeo, mat(0x4A5A3A), ox + 60, CY + hillY + 40, oz + 30);

        // Cannon on Lotrščak
        var cannonGeo = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
        addMesh(cannonGeo, mat(0x3A3A3A), ox + 60, CY + hillY + 37, oz + 26, 0.3, 0, 0);

        // Stone Gate — arched city gate
        var gateLeftGeo = new THREE.BoxGeometry(4, 14, 6);
        addMesh(gateLeftGeo, mat(0xC0B89A), ox - 40, CY + hillY + 7, oz + 40);

        var gateRightGeo = new THREE.BoxGeometry(4, 14, 6);
        addMesh(gateRightGeo, mat(0xC0B89A), ox - 32, CY + hillY + 7, oz + 40);

        // Gate arch lintel
        var gateArchGeo = new THREE.BoxGeometry(8, 3, 6);
        addMesh(gateArchGeo, mat(0xC0B89A), ox - 36, CY + hillY + 14.5, oz + 40);

        // Stone Gate shrine niche
        var shrineGeo = new THREE.BoxGeometry(3, 4, 2);
        addMesh(shrineGeo, mat(0xFFD700, 0x443300), ox - 36, CY + hillY + 10, oz + 37);

        // Upper Town cobblestone square
        var upperSquareGeo = new THREE.BoxGeometry(200, 0.5, 200);
        addMesh(upperSquareGeo, mat(0xBBAA90), ox, CY + hillY, oz);
    }

    // ─── DOLAC MARKET ────────────────────────────────────────────────────────────
    function buildDolacMarket() {
        var ox = CX - 100;
        var oz = CZ - 100;

        // Market terrace slab (elevated above street)
        var terraceGeo = new THREE.BoxGeometry(80, 3, 60);
        addMesh(terraceGeo, mat(0xD4C8A0), ox, CY + 1.5, oz);

        // Market stalls — rows of red-umbrella covered tables
        var stall1Geo = new THREE.BoxGeometry(5, 1, 3);
        var stall2Geo = new THREE.BoxGeometry(5, 1, 3);
        var stall3Geo = new THREE.BoxGeometry(5, 1, 3);
        var stall4Geo = new THREE.BoxGeometry(5, 1, 3);
        addMesh(stall1Geo, mat(0xBB4422), ox - 25, CY + 4, oz - 15);
        addMesh(stall2Geo, mat(0xBB4422), ox - 15, CY + 4, oz - 15);
        addMesh(stall3Geo, mat(0xBB4422), ox - 5, CY + 4, oz - 15);
        addMesh(stall4Geo, mat(0xBB4422), ox + 5, CY + 4, oz - 15);

        // Second row of stalls
        var stall5Geo = new THREE.BoxGeometry(5, 1, 3);
        var stall6Geo = new THREE.BoxGeometry(5, 1, 3);
        var stall7Geo = new THREE.BoxGeometry(5, 1, 3);
        addMesh(stall5Geo, mat(0xCC4422), ox - 25, CY + 4, oz);
        addMesh(stall6Geo, mat(0xCC4422), ox - 15, CY + 4, oz);
        addMesh(stall7Geo, mat(0xCC4422), ox - 5, CY + 4, oz);

        // Red umbrellas (cones above stalls)
        var umb1Geo = new THREE.ConeGeometry(3, 2, 8);
        var umb2Geo = new THREE.ConeGeometry(3, 2, 8);
        var umb3Geo = new THREE.ConeGeometry(3, 2, 8);
        var umb4Geo = new THREE.ConeGeometry(3, 2, 8);
        addMesh(umb1Geo, mat(0xCC2200), ox - 25, CY + 6.5, oz - 15);
        addMesh(umb2Geo, mat(0xCC2200), ox - 15, CY + 6.5, oz - 15);
        addMesh(umb3Geo, mat(0xCC2200), ox - 5, CY + 6.5, oz - 15);
        addMesh(umb4Geo, mat(0xCC2200), ox + 5, CY + 6.5, oz - 15);

        // Bronze market woman statue
        var womanBodyGeo = new THREE.CylinderGeometry(0.8, 1, 3, 8);
        addMesh(womanBodyGeo, mat(0x5A4A30), ox + 20, CY + 4.5, oz - 5);

        var womanHeadGeo = new THREE.SphereGeometry(0.7, 8, 8);
        addMesh(womanHeadGeo, mat(0x5A4A30), ox + 20, CY + 7.2, oz - 5);

        // Small statue pedestal
        var pedestalGeo = new THREE.BoxGeometry(2, 2, 2);
        addMesh(pedestalGeo, mat(0x888888), ox + 20, CY + 4, oz - 5);
    }

    // ─── MIROGOJ CEMETERY ────────────────────────────────────────────────────────
    function buildMirogojCemetery() {
        var ox = CX + 500;
        var oz = CZ - 400;

        // Main arcaded wall — north side
        var wall1Geo = new THREE.BoxGeometry(200, 10, 4);
        addMesh(wall1Geo, mat(0xC8C8C8), ox, CY + 5, oz - 80);

        // Wall arcade columns
        for (var col = 0; col < 8; col++) {
            var colGeo = new THREE.CylinderGeometry(1, 1, 10, 8);
            addMesh(colGeo, mat(0xD8D8D8), ox - 84 + col * 24, CY + 5, oz - 80);
        }

        // Main entrance arcade with large dome
        var mainDomeGeo = new THREE.SphereGeometry(12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(mainDomeGeo, mat(0xC8C8C8), ox, CY + 16, oz - 80);

        // Smaller domes along arcade
        var dome2Geo = new THREE.SphereGeometry(6, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(dome2Geo, mat(0xC8C8C8), ox - 60, CY + 14, oz - 80);

        var dome3Geo = new THREE.SphereGeometry(6, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(dome3Geo, mat(0xC8C8C8), ox + 60, CY + 14, oz - 80);

        // East arcaded wall
        var wall2Geo = new THREE.BoxGeometry(4, 10, 160);
        addMesh(wall2Geo, mat(0xC8C8C8), ox + 100, CY + 5, oz);

        // West arcaded wall
        var wall3Geo = new THREE.BoxGeometry(4, 10, 160);
        addMesh(wall3Geo, mat(0xC8C8C8), ox - 100, CY + 5, oz);

        // Cemetery interior park — green lawn slab
        var lawnGeo = new THREE.BoxGeometry(196, 0.3, 156);
        addMesh(lawnGeo, mat(0x3A7A3A), ox, CY + 0.15, oz);

        // Park path (gravel)
        var pathGeo = new THREE.BoxGeometry(196, 0.5, 4);
        addMesh(pathGeo, mat(0xD0C8A0), ox, CY + 0.25, oz);

        // Cross path
        var path2Geo = new THREE.BoxGeometry(4, 0.5, 156);
        addMesh(path2Geo, mat(0xD0C8A0), ox, CY + 0.25, oz);

        // Example grave monuments
        var grave1Geo = new THREE.BoxGeometry(2, 3, 1);
        addMesh(grave1Geo, mat(0xB8B8B8), ox - 40, CY + 1.5, oz - 30);
        var grave2Geo = new THREE.BoxGeometry(2, 3, 1);
        addMesh(grave2Geo, mat(0xB8B8B8), ox - 20, CY + 1.5, oz - 30);
        var grave3Geo = new THREE.BoxGeometry(2, 3, 1);
        addMesh(grave3Geo, mat(0xB8B8B8), ox + 20, CY + 1.5, oz - 30);
    }

    // ─── MUSEUM OF BROKEN RELATIONSHIPS ─────────────────────────────────────────
    function buildMuseumBrokenRelationships() {
        var ox = CX + 160;
        var oz = CZ - 80;

        // Baroque palace main block
        var palaceGeo = new THREE.BoxGeometry(50, 16, 36);
        addMesh(palaceGeo, mat(0xDDD0C0), ox, CY + 8, oz);

        // Baroque facade central risalit (slightly protruding)
        var risalitGeo = new THREE.BoxGeometry(16, 18, 4);
        addMesh(risalitGeo, mat(0xDDD0C0), ox, CY + 9, oz - 20);

        // Triangular pediment
        var pedimentGeo = new THREE.BoxGeometry(18, 4, 2);
        addMesh(pedimentGeo, mat(0xCCC0B0), ox, CY + 20, oz - 21);

        // Baroque roof (hipped)
        var roofGeo = new THREE.BoxGeometry(52, 6, 38);
        addMesh(roofGeo, mat(0x7A6A5A), ox, CY + 19, oz);

        // Courtyard cobblestone
        var yardGeo = new THREE.BoxGeometry(50, 0.3, 20);
        addMesh(yardGeo, mat(0xC0B89A), ox, CY + 0.15, oz + 28);

        // Wrought iron fence posts
        var fence1Geo = new THREE.BoxGeometry(50, 3, 1);
        addMesh(fence1Geo, mat(0x222222), ox, CY + 1.5, oz + 38);
    }

    // ─── NATIONAL THEATRE ────────────────────────────────────────────────────────
    function buildNationalTheatre() {
        var ox = CX - 350;
        var oz = CZ + 200;

        // Main neoclassical building
        var theatreGeo = new THREE.BoxGeometry(70, 22, 50);
        addMesh(theatreGeo, mat(0xEEDDAA), ox, CY + 11, oz);

        // Central dome
        var domeGeo = new THREE.SphereGeometry(12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(domeGeo, mat(0xDDD09A), ox, CY + 26, oz);

        // Dome lantern (cylindrical top)
        var lanternGeo = new THREE.CylinderGeometry(3, 3, 5, 8);
        addMesh(lanternGeo, mat(0xDDD09A), ox, CY + 38, oz);

        // Colonnade — front portico columns
        for (var c = 0; c < 6; c++) {
            var colGeo = new THREE.CylinderGeometry(1.2, 1.4, 14, 10);
            addMesh(colGeo, mat(0xEEDDAA), ox - 25 + c * 10, CY + 7, oz - 30);
        }

        // Portico entablature
        var entablGeo = new THREE.BoxGeometry(62, 3, 6);
        addMesh(entablGeo, mat(0xE8D09A), ox, CY + 15.5, oz - 30);

        // Triangular pediment
        var theatrePedGeo = new THREE.BoxGeometry(62, 5, 3);
        addMesh(theatrePedGeo, mat(0xDDCC88), ox, CY + 19, oz - 31);

        // Meštrović Well of Life sculpture — central pool
        var wellBasinGeo = new THREE.CylinderGeometry(7, 8, 1.5, 12);
        addMesh(wellBasinGeo, mat(0xA09080), ox, CY + 0.75, oz - 45);

        // Bronze figures around the well (simplified)
        var fig1Geo = new THREE.CylinderGeometry(0.6, 0.8, 3, 6);
        addMesh(fig1Geo, mat(0x5A4A30), ox - 3, CY + 3, oz - 45);

        var fig2Geo = new THREE.CylinderGeometry(0.6, 0.8, 3, 6);
        addMesh(fig2Geo, mat(0x5A4A30), ox + 3, CY + 3, oz - 45);

        var fig3Geo = new THREE.CylinderGeometry(0.6, 0.8, 3, 6);
        addMesh(fig3Geo, mat(0x5A4A30), ox, CY + 3, oz - 48);

        // Theatre garden
        var gardenGeo = new THREE.BoxGeometry(80, 0.3, 30);
        addMesh(gardenGeo, mat(0x4A7A4A), ox, CY + 0.15, oz - 50);

        // Side wings of theatre
        var wingLGeo = new THREE.BoxGeometry(16, 18, 50);
        addMesh(wingLGeo, mat(0xEEDDAA), ox - 43, CY + 9, oz);

        var wingRGeo = new THREE.BoxGeometry(16, 18, 50);
        addMesh(wingRGeo, mat(0xEEDDAA), ox + 43, CY + 9, oz);
    }

    // ─── TKALČIĆEVA STREET ───────────────────────────────────────────────────────
    function buildTkalcicevaStreet() {
        var ox = CX - 40;
        var oz = CZ + 100;

        // Cobblestone pedestrian street
        var cobblesGeo = new THREE.BoxGeometry(12, 0.4, 200);
        addMesh(cobblesGeo, mat(0xCC8844), ox, CY + 0.2, oz);

        // Left row of Art Nouveau café buildings
        var cafe1Geo = new THREE.BoxGeometry(14, 14, 20);
        addMesh(cafe1Geo, mat(0xDD9966), ox - 13, CY + 7, oz - 60);

        var cafe2Geo = new THREE.BoxGeometry(14, 12, 20);
        addMesh(cafe2Geo, mat(0xEEAA77), ox - 13, CY + 6, oz - 35);

        var cafe3Geo = new THREE.BoxGeometry(14, 14, 20);
        addMesh(cafe3Geo, mat(0xCC8855), ox - 13, CY + 7, oz - 10);

        var cafe4Geo = new THREE.BoxGeometry(14, 12, 20);
        addMesh(cafe4Geo, mat(0xDDAA88), ox - 13, CY + 6, oz + 20);

        // Right row of buildings
        var cafe5Geo = new THREE.BoxGeometry(14, 14, 20);
        addMesh(cafe5Geo, mat(0xEE9966), ox + 13, CY + 7, oz - 60);

        var cafe6Geo = new THREE.BoxGeometry(14, 12, 20);
        addMesh(cafe6Geo, mat(0xDD8844), ox + 13, CY + 6, oz - 35);

        var cafe7Geo = new THREE.BoxGeometry(14, 14, 20);
        addMesh(cafe7Geo, mat(0xCC9977), ox + 13, CY + 7, oz - 10);

        // Café terrace tables (small boxes on street)
        var table1Geo = new THREE.BoxGeometry(2, 1, 2);
        addMesh(table1Geo, mat(0xFFEEDD), ox - 7, CY + 1, oz - 55);
        var table2Geo = new THREE.BoxGeometry(2, 1, 2);
        addMesh(table2Geo, mat(0xFFEEDD), ox - 7, CY + 1, oz - 48);
        var table3Geo = new THREE.BoxGeometry(2, 1, 2);
        addMesh(table3Geo, mat(0xFFEEDD), ox - 7, CY + 1, oz - 40);

        // Street lamp posts
        var lamp1Geo = new THREE.CylinderGeometry(0.15, 0.2, 5, 6);
        addMesh(lamp1Geo, mat(0x444444), ox - 5, CY + 2.5, oz - 70);
        var lamp2Geo = new THREE.CylinderGeometry(0.15, 0.2, 5, 6);
        addMesh(lamp2Geo, mat(0x444444), ox + 5, CY + 2.5, oz - 50);
        var lamp3Geo = new THREE.CylinderGeometry(0.15, 0.2, 5, 6);
        addMesh(lamp3Geo, mat(0x444444), ox - 5, CY + 2.5, oz - 30);

        // Lamp heads
        var lampHead1Geo = new THREE.SphereGeometry(0.5, 6, 6);
        addMesh(lampHead1Geo, mat(0xFFFF99, 0x555500), ox - 5, CY + 5.2, oz - 70);
        var lampHead2Geo = new THREE.SphereGeometry(0.5, 6, 6);
        addMesh(lampHead2Geo, mat(0xFFFF99, 0x555500), ox + 5, CY + 5.2, oz - 50);
    }

    // ─── MAKSIMIR PARK ───────────────────────────────────────────────────────────
    function buildMaksimirPark() {
        var ox = CX + 700;
        var oz = CZ + 200;

        // Park lawn
        var parkLawnGeo = new THREE.BoxGeometry(400, 0.5, 300);
        addMesh(parkLawnGeo, mat(0x4CAF50), ox, CY + 0.25, oz);

        // Main lake — irregular shape approximated with box
        var lakeGeo = new THREE.BoxGeometry(80, 0.3, 60);
        addMesh(lakeGeo, mat(0x2A6A8A), ox - 50, CY + 0.4, oz - 50);

        // Lake surround path
        var lakePath1Geo = new THREE.BoxGeometry(84, 0.4, 4);
        addMesh(lakePath1Geo, mat(0xC0B090), ox - 50, CY + 0.2, oz - 82);
        var lakePath2Geo = new THREE.BoxGeometry(84, 0.4, 4);
        addMesh(lakePath2Geo, mat(0xC0B090), ox - 50, CY + 0.2, oz - 18);
        var lakePath3Geo = new THREE.BoxGeometry(4, 0.4, 64);
        addMesh(lakePath3Geo, mat(0xC0B090), ox - 92, CY + 0.2, oz - 50);
        var lakePath4Geo = new THREE.BoxGeometry(4, 0.4, 64);
        addMesh(lakePath4Geo, mat(0xC0B090), ox - 8, CY + 0.2, oz - 50);

        // English-style landscape feature — pavilion
        var pavilionBaseGeo = new THREE.CylinderGeometry(8, 8, 1, 8);
        addMesh(pavilionBaseGeo, mat(0xEEDDCC), ox + 80, CY + 0.5, oz + 30);

        // Pavilion columns
        for (var pc = 0; pc < 6; pc++) {
            var pColGeo = new THREE.CylinderGeometry(0.5, 0.6, 6, 8);
            addMesh(pColGeo, mat(0xEEDDCC), ox + 80 + Math.sin(pc * Math.PI / 3) * 6, CY + 4, oz + 30 + Math.cos(pc * Math.PI / 3) * 6);
        }

        // Pavilion dome roof
        var pavDomeGeo = new THREE.SphereGeometry(8, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(pavDomeGeo, mat(0xCCBBAA), ox + 80, CY + 8, oz + 30);

        // Zoo enclosures — simple fenced areas
        var enclosure1Geo = new THREE.BoxGeometry(30, 0.3, 30);
        addMesh(enclosure1Geo, mat(0x8ABD6A), ox + 100, CY + 0.15, oz - 60);

        // Enclosure fence
        var encFence1Geo = new THREE.BoxGeometry(30, 3, 1);
        addMesh(encFence1Geo, mat(0x555555), ox + 100, CY + 1.5, oz - 75);
        var encFence2Geo = new THREE.BoxGeometry(1, 3, 30);
        addMesh(encFence2Geo, mat(0x555555), ox + 115, CY + 1.5, oz - 60);

        // Trees (cones as conifers)
        var tree1Geo = new THREE.ConeGeometry(4, 10, 7);
        addMesh(tree1Geo, mat(0x2D7A2D), ox + 30, CY + 5, oz + 60);
        var tree2Geo = new THREE.ConeGeometry(4, 10, 7);
        addMesh(tree2Geo, mat(0x2D7A2D), ox + 60, CY + 5, oz + 80);
        var tree3Geo = new THREE.ConeGeometry(4, 10, 7);
        addMesh(tree3Geo, mat(0x3A8A3A), ox - 80, CY + 5, oz + 60);
        var tree4Geo = new THREE.ConeGeometry(4, 10, 7);
        addMesh(tree4Geo, mat(0x3A8A3A), ox - 60, CY + 5, oz + 90);

        // Tree trunks
        var trunk1Geo = new THREE.CylinderGeometry(1, 1.2, 4, 6);
        addMesh(trunk1Geo, mat(0x6B4A2A), ox + 30, CY + 2, oz + 60);
        var trunk2Geo = new THREE.CylinderGeometry(1, 1.2, 4, 6);
        addMesh(trunk2Geo, mat(0x6B4A2A), ox + 60, CY + 2, oz + 80);
    }

    // ─── BUNDEK LAKE ─────────────────────────────────────────────────────────────
    function buildBundekLake() {
        var ox = CX + 600;
        var oz = CZ + 500;

        // Artificial lake main body
        var lakeMainGeo = new THREE.BoxGeometry(200, 0.4, 120);
        addMesh(lakeMainGeo, mat(0x2A6A8A), ox, CY + 0.2, oz);

        // Lake shore — sandy surround
        var shore1Geo = new THREE.BoxGeometry(208, 0.3, 4);
        addMesh(shore1Geo, mat(0xD4C090), ox, CY + 0.15, oz - 62);
        var shore2Geo = new THREE.BoxGeometry(208, 0.3, 4);
        addMesh(shore2Geo, mat(0xD4C090), ox, CY + 0.15, oz + 62);
        var shore3Geo = new THREE.BoxGeometry(4, 0.3, 128);
        addMesh(shore3Geo, mat(0xD4C090), ox - 102, CY + 0.15, oz);
        var shore4Geo = new THREE.BoxGeometry(4, 0.3, 128);
        addMesh(shore4Geo, mat(0xD4C090), ox + 102, CY + 0.15, oz);

        // Park lawn around lake
        var lakeParkGeo = new THREE.BoxGeometry(300, 0.3, 240);
        addMesh(lakeParkGeo, mat(0x5BAF50), ox, CY + 0.1, oz);

        // Recreational path around lake
        var recPath1Geo = new THREE.BoxGeometry(220, 0.5, 6);
        addMesh(recPath1Geo, mat(0xBBAA80), ox, CY + 0.25, oz - 70);
        var recPath2Geo = new THREE.BoxGeometry(220, 0.5, 6);
        addMesh(recPath2Geo, mat(0xBBAA80), ox, CY + 0.25, oz + 70);

        // Small jetty / pier
        var jettyGeo = new THREE.BoxGeometry(3, 0.5, 30);
        addMesh(jettyGeo, mat(0x8B6A3A), ox - 20, CY + 0.75, oz - 45);

        // Beach volleyball court markers
        var vballCourtGeo = new THREE.BoxGeometry(18, 0.3, 9);
        addMesh(vballCourtGeo, mat(0xD4C090), ox + 60, CY + 0.15, oz - 80);

        // Picnic shelter
        var shelterRoofGeo = new THREE.BoxGeometry(10, 0.5, 8);
        addMesh(shelterRoofGeo, mat(0xAA7744), ox - 80, CY + 4, oz + 85);

        var shelterPole1Geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
        addMesh(shelterPole1Geo, mat(0x8B6A3A), ox - 84, CY + 2, oz + 81);
        var shelterPole2Geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
        addMesh(shelterPole2Geo, mat(0x8B6A3A), ox - 76, CY + 2, oz + 81);
        var shelterPole3Geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
        addMesh(shelterPole3Geo, mat(0x8B6A3A), ox - 84, CY + 2, oz + 89);
        var shelterPole4Geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
        addMesh(shelterPole4Geo, mat(0x8B6A3A), ox - 76, CY + 2, oz + 89);
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
