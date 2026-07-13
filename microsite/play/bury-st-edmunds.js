window.BuryStEdmunds = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 21640;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geometry, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(BASE_X + (x || 0), BASE_Y + (y || 0), BASE_Z + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        return makeMesh(geo, color, x, y, z, rx, ry, rz);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
        return makeMesh(geo, color, x, y, z, rx, ry, rz);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws || 8, hs || 6);
        return makeMesh(geo, color, x, y, z);
    }

    function makeCone(r, h, segs, color, x, y, z, ry) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        return makeMesh(geo, color, x, y, z, 0, ry || 0, 0);
    }

    function build() {
        buildGround();
        buildFarmland();
        buildRiverLark();
        buildAbbeyRuins();
        buildAbbeyGardens();
        buildCathedral();
        buildMoysesHall();
        buildAngelHotel();
        buildGreeneKingBrewery();
        buildCornExchange();
        buildTraverseStreets();
    }

    function buildGround() {
        // Large flat ground base using stacked thin boxes (PlaneGeometry forbidden)
        makeBox(800, 1, 800, 0xA0956B, 0, -0.5, 0);
    }

    function buildFarmland() {
        // Suffolk flat arable fields — east of town
        var fieldColor = 0xF4E0A0;
        var furrowColor = 0xD4C08A;
        makeBox(200, 0.4, 80, fieldColor, 220, 0.2, -60);
        makeBox(200, 0.4, 80, furrowColor, 220, 0.3, 40);
        makeBox(200, 0.4, 80, fieldColor, 220, 0.2, 140);
        makeBox(80, 0.4, 200, furrowColor, 340, 0.3, 10);
        makeBox(80, 0.4, 200, fieldColor, 420, 0.2, -30);
        // Hedgerow boxes
        makeBox(200, 3, 2, 0x2D5A1B, 220, 1.5, -100);
        makeBox(2, 3, 200, 0x2D5A1B, 320, 1.5, 10);
        makeBox(80, 3, 2, 0x2D5A1B, 340, 1.5, 110);
    }

    function buildRiverLark() {
        // River Lark — flows south of town, blue channel
        var riverColor = 0x4682B4;
        makeBox(400, 0.6, 10, riverColor, 0, 0.3, 130);
        makeBox(80, 0.6, 10, riverColor, 200, 0.3, 140);
        makeBox(60, 0.6, 10, riverColor, -220, 0.3, 150);
        // River banks
        makeBox(400, 1.5, 3, 0x8B7355, 0, 0.75, 125);
        makeBox(400, 1.5, 3, 0x8B7355, 0, 0.75, 136);
        // Footbridge over river
        makeBox(12, 1, 2, 0x808080, 10, 1.5, 130);
        makeBox(1, 3, 2, 0x606060, 4, 2, 130);
        makeBox(1, 3, 2, 0x606060, 16, 2, 130);
    }

    function buildAbbeyRuins() {
        // Ruins of the great Benedictine Abbey of St Edmund
        var stoneColor = 0xC8B89A;
        var darkStone = 0xA89880;

        // Great Gate Tower (main entrance) — partially standing
        makeBox(14, 28, 12, stoneColor, -80, 14, -20);
        // Gate arch opening — represented as darker inset
        makeBox(5, 10, 14, darkStone, -80, 5, -20);
        // Gate tower upper battlements
        makeBox(15, 2, 2, stoneColor, -80, 29, -26);
        makeBox(15, 2, 2, stoneColor, -80, 29, -14);
        makeBox(2, 2, 12, stoneColor, -87, 29, -20);
        makeBox(2, 2, 12, stoneColor, -73, 29, -20);
        // Merlon blocks on gate tower
        makeBox(3, 3, 2, stoneColor, -85, 32, -26);
        makeBox(3, 3, 2, stoneColor, -79, 32, -26);
        makeBox(3, 3, 2, stoneColor, -73, 32, -26);

        // North transept wall fragment — tall, broken top
        makeBox(3, 22, 30, stoneColor, -50, 11, -10);
        makeBox(3, 14, 18, stoneColor, -40, 7, -5);

        // South nave wall — long ruined wall
        makeBox(60, 8, 3, stoneColor, -30, 4, 10);
        // Broken section — lower
        makeBox(20, 4, 3, stoneColor, 10, 2, 10);

        // Fallen arch — two leaning pillars with partial arch
        makeCyl(1.2, 1.2, 14, 8, stoneColor, -20, 7, -10);
        makeCyl(1.2, 1.2, 14, 8, stoneColor, -10, 7, -10);
        // Arch stone spanning — angled box
        makeBox(12, 2, 2, stoneColor, -15, 15, -10, 0, 0, 0.2);

        // Chancel ruins — east end
        makeBox(3, 18, 24, stoneColor, 20, 9, -5);
        makeBox(20, 5, 3, stoneColor, 30, 2.5, -17);

        // Crypt entrance / low walls
        makeBox(30, 3, 3, stoneColor, 0, 1.5, -25);
        makeBox(3, 3, 20, stoneColor, -15, 1.5, -35);

        // Scattered rubble blocks
        makeBox(3, 2, 2, darkStone, -25, 1, -30);
        makeBox(2, 1.5, 3, darkStone, -18, 0.75, -28);
        makeBox(4, 1, 2, darkStone, 5, 0.5, -32);
        makeBox(2, 2, 2, darkStone, -60, 1, 5);
        makeBox(3, 1.5, 4, darkStone, -45, 0.75, 8);

        // Abbey precinct wall — long boundary wall
        makeBox(160, 6, 3, stoneColor, -20, 3, -50);
        makeBox(3, 6, 60, stoneColor, -100, 3, -20);
        makeBox(3, 4, 40, stoneColor, 60, 2, -30);

        // Charnel house / ossuary fragment
        makeBox(10, 5, 8, darkStone, 40, 2.5, -10);
    }

    function buildAbbeyGardens() {
        // Formal gardens surrounding the abbey ruins
        var grassColor = 0x4CAF50;
        var darkGrass = 0x388E3C;
        var pathColor = 0xC8B89A;

        // Main lawn areas
        makeBox(100, 0.4, 60, grassColor, -20, 0.2, 40);
        makeBox(60, 0.4, 40, grassColor, -80, 0.2, 60);
        makeBox(80, 0.4, 30, darkGrass, 20, 0.2, 55);

        // Formal garden beds
        makeBox(12, 0.5, 6, 0xE91E63, -30, 0.25, 50);
        makeBox(12, 0.5, 6, 0xFF9800, -14, 0.25, 50);
        makeBox(12, 0.5, 6, 0xFFEB3B, 2, 0.25, 50);

        // Garden path — gravel
        makeBox(4, 0.5, 60, pathColor, -20, 0.25, 40);
        makeBox(80, 0.5, 4, pathColor, -20, 0.25, 40);

        // Trees in garden — cylinders for trunks, spheres for canopy
        makeCyl(0.5, 0.5, 6, 8, 0x5D4037, -35, 3, 65);
        makeSphere(4, 8, 6, darkGrass, -35, 8, 65);
        makeCyl(0.5, 0.5, 6, 8, 0x5D4037, -50, 3, 58);
        makeSphere(4, 8, 6, 0x388E3C, -50, 8, 58);
        makeCyl(0.5, 0.5, 7, 8, 0x5D4037, 15, 3.5, 62);
        makeSphere(5, 8, 6, darkGrass, 15, 9.5, 62);
        makeCyl(0.5, 0.5, 5, 8, 0x5D4037, -5, 2.5, 72);
        makeSphere(3.5, 8, 6, 0x2E7D32, -5, 7, 72);

        // Bandstand / rotunda — cylinder base with cone roof
        makeCyl(5, 5, 2, 12, 0xE8E0D0, -60, 1, 55);
        makeCyl(0.3, 0.3, 4, 8, 0x888888, -66, 2.5, 49);
        makeCyl(0.3, 0.3, 4, 8, 0x888888, -60, 2.5, 43);
        makeCyl(0.3, 0.3, 4, 8, 0x888888, -54, 2.5, 49);
        makeCyl(0.3, 0.3, 4, 8, 0x888888, -60, 2.5, 61);
        makeCone(6, 3, 12, 0x8B6914, -60, 4, 55);
    }

    function buildCathedral() {
        // St Edmundsbury Cathedral — Gothic, Millennium Tower completed 2005
        var stoneColor = 0xD4C8A0;
        var darkStone = 0xB4A880;
        var roofColor = 0x607D8B;

        // Nave — long main body
        makeBox(16, 18, 70, stoneColor, 80, 9, -30);
        // Nave clerestory windows — darker inset boxes
        makeBox(18, 4, 68, darkStone, 80, 16, -30);

        // Nave roof (pitched) — two angled boxes
        makeBox(10, 6, 72, roofColor, 80, 22, -30, 0, 0, 0.6);
        makeBox(10, 6, 72, roofColor, 80, 22, -30, 0, 0, -0.6);

        // Millennium Tower (central crossing tower) — tall and dominant
        makeBox(14, 50, 14, stoneColor, 80, 25, -5);
        // Tower stages — decorative banding
        makeBox(15, 1, 15, darkStone, 80, 16, -5);
        makeBox(15, 1, 15, darkStone, 80, 30, -5);
        makeBox(15, 1, 15, darkStone, 80, 44, -5);
        // Tower pinnacles — four corner cones
        makeCone(1, 8, 4, stoneColor, 87, 55, 2, 0.785);
        makeCone(1, 8, 4, stoneColor, 73, 55, 2, 0.785);
        makeCone(1, 8, 4, stoneColor, 87, 55, -12, 0.785);
        makeCone(1, 8, 4, stoneColor, 73, 55, -12, 0.785);
        // Tower battlemented parapet
        makeBox(16, 2, 2, stoneColor, 80, 51, -12);
        makeBox(16, 2, 2, stoneColor, 80, 51, 2);
        makeBox(2, 2, 14, stoneColor, 87, 51, -5);
        makeBox(2, 2, 14, stoneColor, 73, 51, -5);
        // Merlon details on tower
        makeBox(3, 3, 2, stoneColor, 74, 54, -12);
        makeBox(3, 3, 2, stoneColor, 80, 54, -12);
        makeBox(3, 3, 2, stoneColor, 86, 54, -12);

        // North transept
        makeBox(20, 16, 14, stoneColor, 80, 8, -5);
        makeBox(20, 5, 12, roofColor, 80, 18, -5, 0.3, 0, 0);
        // North transept rose window hint — sphere
        makeSphere(2.5, 8, 6, 0xB0C4DE, 91, 12, -5);

        // South transept
        makeBox(20, 16, 14, stoneColor, 80, 8, -55);
        makeBox(20, 5, 12, roofColor, 80, 18, -55, -0.3, 0, 0);

        // Chancel / choir — east end
        makeBox(14, 16, 30, stoneColor, 80, 8, -75);
        makeBox(10, 4, 30, roofColor, 80, 19, -75, 0, 0, 0.4);
        makeBox(10, 4, 30, roofColor, 80, 19, -75, 0, 0, -0.4);
        // Apse — semi-circular east end using cylinders
        makeCyl(7, 7, 14, 12, stoneColor, 80, 7, -91);
        makeCone(7, 6, 12, roofColor, 80, 18, -91);

        // West front — entrance facade
        makeBox(20, 22, 4, stoneColor, 80, 11, 6);
        // West front towers
        makeCyl(3, 3, 26, 8, stoneColor, 73, 13, 6);
        makeCyl(3, 3, 26, 8, stoneColor, 87, 13, 6);
        makeCone(3, 8, 8, darkStone, 73, 30, 6);
        makeCone(3, 8, 8, darkStone, 87, 30, 6);
        // Great west door arch hint
        makeBox(5, 8, 5, darkStone, 80, 4, 4);

        // Flying buttresses — thin angled boxes
        makeBox(1.5, 1.5, 10, darkStone, 89, 10, -20, 0.5, 0, 0);
        makeBox(1.5, 1.5, 10, darkStone, 71, 10, -20, 0.5, 0, 0);
        makeBox(1.5, 1.5, 10, darkStone, 89, 10, -42, 0.5, 0, 0);
        makeBox(1.5, 1.5, 10, darkStone, 71, 10, -42, 0.5, 0, 0);
    }

    function buildMoysesHall() {
        // Moyse's Hall — 12th century Norman building, one of England's oldest houses
        var normanColor = 0xC8A870;
        var roofColor = 0x795548;

        // Main body — two-storey Norman structure
        makeBox(16, 10, 12, normanColor, -110, 5, -80);
        // Upper floor — slightly recessed
        makeBox(14, 6, 10, normanColor, -110, 13, -80);
        // Norman round-arched windows — dark insets
        makeCyl(1, 1, 0.5, 8, 0x5D4037, -104, 8, -86);
        makeCyl(1, 1, 0.5, 8, 0x5D4037, -110, 8, -86);
        makeCyl(1, 1, 0.5, 8, 0x5D4037, -116, 8, -86);
        makeCyl(1, 1, 0.5, 8, 0x5D4037, -104, 14, -86);
        makeCyl(1, 1, 0.5, 8, 0x5D4037, -116, 14, -86);
        // Pitched roof
        makeBox(10, 4, 12, roofColor, -110, 19, -80, 0, 0, 0.5);
        makeBox(10, 4, 12, roofColor, -110, 19, -80, 0, 0, -0.5);
        // Norman corner pilasters
        makeBox(2, 16, 2, 0xA08050, -118, 8, -86);
        makeBox(2, 16, 2, 0xA08050, -102, 8, -86);
        makeBox(2, 16, 2, 0xA08050, -118, 8, -74);
        makeBox(2, 16, 2, 0xA08050, -102, 8, -74);
        // Museum sign board
        makeBox(8, 2, 0.5, 0x8B4513, -110, 5, -87);
        // Steps up to entrance
        makeBox(4, 1, 3, normanColor, -110, 0.5, -87);
        makeBox(3, 0.5, 2, normanColor, -110, 1, -88);
    }

    function buildAngelHotel() {
        // Angel Hotel — Georgian coaching inn where Charles Dickens stayed
        var georgianColor = 0xDEB887;
        var darkBrick = 0xC8A070;
        var roofColor = 0x455A64;

        // Main Georgian facade — three stories
        makeBox(30, 18, 16, georgianColor, -120, 9, -115);
        // Ground floor with coaching arch
        makeBox(6, 7, 18, darkBrick, -120, 3.5, -115);
        // Sash windows — rows of dark rectangles
        makeBox(28, 2, 1, darkBrick, -120, 7, -123);
        makeBox(28, 2, 1, darkBrick, -120, 11, -123);
        makeBox(28, 2, 1, darkBrick, -120, 15, -123);
        // Cornice / parapet
        makeBox(32, 2, 18, 0xF5F0E8, -120, 19, -115);
        // Chimneys
        makeCyl(0.8, 0.8, 4, 6, darkBrick, -108, 22, -112);
        makeCyl(0.8, 0.8, 4, 6, darkBrick, -132, 22, -112);
        makeCyl(0.8, 0.8, 4, 6, darkBrick, -108, 22, -118);
        // Wing extension
        makeBox(14, 14, 12, georgianColor, -140, 7, -115);
        // Courtyard hint
        makeBox(20, 0.5, 14, 0xD2B48C, -120, 0.25, -110);
        // Sign / fanlight over door
        makeSphere(2, 8, 4, 0xFFECB3, -120, 10, -123);
    }

    function buildGreeneKingBrewery() {
        // Greene King Brewery — Victorian maltings, large industrial buildings
        var brickColor = 0xC87020;
        var maltColor = 0xBB7700;
        var roofColor = 0x37474F;

        // Main brewery building — large brick block
        makeBox(40, 20, 30, brickColor, 150, 10, -60);
        // Second block
        makeBox(24, 16, 20, brickColor, 185, 8, -55);
        // Malt kiln #1 — distinctive cone-topped cylinder (cowl)
        makeCyl(6, 8, 24, 12, maltColor, 140, 12, -80);
        makeCone(7, 10, 12, roofColor, 140, 29, -80);
        // Malt kiln #2
        makeCyl(6, 8, 24, 12, maltColor, 155, 12, -80);
        makeCone(7, 10, 12, roofColor, 155, 29, -80);
        // Malt kiln #3 — slightly smaller
        makeCyl(5, 7, 20, 12, maltColor, 170, 10, -80);
        makeCone(6, 8, 12, roofColor, 170, 25, -80);
        // Chimney stack
        makeCyl(2, 3, 36, 8, brickColor, 195, 18, -65);
        makeCyl(2.5, 2.5, 2, 8, roofColor, 195, 37, -65);
        // Warehouse / hop store
        makeBox(30, 12, 18, 0xA0601A, 160, 6, -40);
        // Roof of main building
        makeBox(40, 4, 30, roofColor, 150, 22, -60);
        // Brewery gate / wall
        makeBox(50, 4, 2, brickColor, 160, 2, -47);
        makeBox(4, 8, 2, brickColor, 136, 4, -47);
        makeBox(4, 8, 2, brickColor, 184, 4, -47);
        // Delivery yard — pale surface
        makeBox(50, 0.4, 20, 0xBCAAA4, 160, 0.2, -55);
        // Loading dock / small outbuilding
        makeBox(10, 6, 8, 0xA05010, 200, 3, -50);
    }

    function buildCornExchange() {
        // Corn Exchange — neoclassical domed building in the Traverse
        var neoColor = 0xF5F0E8;
        var columnColor = 0xE8E4D8;

        // Main body — square neoclassical block
        makeBox(22, 10, 18, neoColor, -150, 5, -90);
        // Portico / colonnade front
        makeBox(22, 12, 4, columnColor, -150, 6, -99);
        // Columns — 4 Doric cylinders
        makeCyl(1, 1, 12, 8, columnColor, -144, 6, -100);
        makeCyl(1, 1, 12, 8, columnColor, -148, 6, -100);
        makeCyl(1, 1, 12, 8, columnColor, -152, 6, -100);
        makeCyl(1, 1, 12, 8, columnColor, -156, 6, -100);
        // Pediment (triangular gable)
        makeBox(24, 4, 2, neoColor, -150, 14, -99, 0, 0, 0);
        makeCone(12, 5, 4, neoColor, -150, 17, -99, 0, 1.5708, 0);
        // Drum for dome
        makeCyl(6, 6, 5, 16, neoColor, -150, 17, -90);
        // Dome — sphere segment
        makeSphere(6, 16, 8, neoColor, -150, 22, -90);
        // Dome lantern top
        makeCyl(1.5, 1.5, 3, 8, columnColor, -150, 28, -90);
        makeCone(1.5, 2, 8, 0xB8B0A0, -150, 30.5, -90);
        // Steps across front
        makeBox(24, 1, 4, columnColor, -150, 0.5, -102);
        makeBox(22, 0.5, 3, columnColor, -150, 1, -101);
        // Frieze / entablature band
        makeBox(24, 2, 20, 0xDDD8C8, -150, 11, -90);
    }

    function buildTraverseStreets() {
        // The Traverse and Abbots grid — medieval street pattern, 11th century
        var roadColor = 0x777777;
        var cobbleColor = 0x666666;
        var pavingColor = 0x888888;
        var buildingColor = 0x8B7355;

        // Main Traverse street — running east-west
        makeBox(200, 0.5, 8, roadColor, -50, 0.25, -95);
        // Northgate Street — north-south axis
        makeBox(8, 0.5, 150, cobbleColor, -140, 0.25, -60);
        // Abbeygate Street
        makeBox(8, 0.5, 80, cobbleColor, -100, 0.25, -75);
        // Churchgate Street
        makeBox(8, 0.5, 60, pavingColor, -60, 0.25, -70);
        // Guildhall Street
        makeBox(8, 0.5, 60, roadColor, -30, 0.25, -70);

        // Medieval townhouses along Traverse — varied heights
        makeBox(8, 10, 10, buildingColor, -160, 5, -102);
        makeBox(6, 8, 10, 0x9C8060, -152, 4, -102);
        makeBox(10, 12, 10, buildingColor, -138, 6, -102);
        makeBox(7, 9, 10, 0x7A6540, -128, 4.5, -102);
        makeBox(9, 11, 10, 0xA08868, -118, 5.5, -102);

        // Rooflines — pitched gables
        makeBox(4, 4, 10, 0x5D4037, -160, 12, -102, 0, 0, 0.5);
        makeBox(4, 4, 10, 0x5D4037, -138, 14, -102, 0, 0, 0.5);
        makeBox(4, 4, 10, 0x4E342E, -118, 13, -102, 0, 0, 0.5);

        // Guildhall — civic building
        makeBox(18, 12, 14, 0xB8A880, -170, 6, -75);
        makeBox(18, 3, 14, 0xD8C8A0, -170, 13.5, -75);
        makeCone(8, 6, 4, 0x546E7A, -170, 18, -75, 0.785);

        // Market Cross / butter market feature
        makeCyl(3, 3, 1, 8, pavingColor, -140, 0.5, -95);
        makeCyl(0.5, 0.5, 8, 8, 0xD4C8A0, -140, 4.5, -95);
        makeCone(2, 3, 8, 0xB0A080, -140, 9.5, -95);

        // Theatre Royal hint — Georgian box
        makeBox(22, 14, 16, 0xDEB887, -180, 7, -110);
        makeBox(22, 3, 16, 0xC8A870, -180, 15.5, -110);
        // Theatre portico columns
        makeCyl(0.8, 0.8, 10, 8, 0xF5F0E8, -174, 5, -118);
        makeCyl(0.8, 0.8, 10, 8, 0xF5F0E8, -180, 5, -118);
        makeCyl(0.8, 0.8, 10, 8, 0xF5F0E8, -186, 5, -118);
        // Lamp posts
        makeCyl(0.2, 0.2, 5, 6, 0x444444, -165, 2.5, -99);
        makeSphere(0.6, 6, 4, 0xFFFF99, -165, 5.5, -99);
        makeCyl(0.2, 0.2, 5, 6, 0x444444, -135, 2.5, -99);
        makeSphere(0.6, 6, 4, 0xFFFF99, -135, 5.5, -99);
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
