window.LondonderryWalls = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 19520;
    var BASE_Y = 0;
    var BASE_Z = 0;

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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildCityWalls();
        buildGates();
        buildBastions();
        buildStColumbs();
        buildGuildhall();
        buildRiverFoyle();
        buildPeaceBridge();
        buildBogsideMurals();
        buildFreeDerryCorner();
        buildCregganHills();
        buildEbringtonBarracks();
        buildCityInterior();
    }

    function buildGround() {
        // Ground plane approximated with a large flat box
        makeBox(1200, 2, 1200, 0x5C7A3E, 0, -1, 0);
        // Road surface inside walls
        makeBox(300, 1, 300, 0x555555, 0, 0, 0);
        // Footpath on top of walls approach
        makeBox(600, 1, 30, 0x888888, 0, 0, 50);
    }

    function buildCityWalls() {
        var wallColor = 0x8B7355;
        var wallH = 8;
        var wallT = 4;

        // North wall segment (top)
        makeBox(320, wallH, wallT, wallColor, 0, wallH / 2, -160);
        // North wall walkway parapet (inner)
        makeBox(320, 2, 1, 0x7A6348, wallH / 2, wallH + 1, -158);
        // North wall merlons
        makeBox(10, 3, 2, wallColor, -120, wallH + 1.5, -162);
        makeBox(10, 3, 2, wallColor, -80, wallH + 1.5, -162);
        makeBox(10, 3, 2, wallColor, -40, wallH + 1.5, -162);
        makeBox(10, 3, 2, wallColor, 0, wallH + 1.5, -162);
        makeBox(10, 3, 2, wallColor, 40, wallH + 1.5, -162);
        makeBox(10, 3, 2, wallColor, 80, wallH + 1.5, -162);
        makeBox(10, 3, 2, wallColor, 120, wallH + 1.5, -162);

        // South wall segment (bottom)
        makeBox(320, wallH, wallT, wallColor, 0, wallH / 2, 160);
        makeBox(10, 3, 2, wallColor, -120, wallH + 1.5, 162);
        makeBox(10, 3, 2, wallColor, -60, wallH + 1.5, 162);
        makeBox(10, 3, 2, wallColor, 0, wallH + 1.5, 162);
        makeBox(10, 3, 2, wallColor, 60, wallH + 1.5, 162);
        makeBox(10, 3, 2, wallColor, 120, wallH + 1.5, 162);

        // West wall segment (river side)
        makeBox(wallT, wallH, 320, wallColor, -160, wallH / 2, 0);
        makeBox(2, 2, 320, 0x7A6348, -158, wallH + 1, 0);
        makeBox(2, 3, 10, wallColor, -162, wallH + 1.5, -100);
        makeBox(2, 3, 10, wallColor, -162, wallH + 1.5, -50);
        makeBox(2, 3, 10, wallColor, -162, wallH + 1.5, 0);
        makeBox(2, 3, 10, wallColor, -162, wallH + 1.5, 50);
        makeBox(2, 3, 10, wallColor, -162, wallH + 1.5, 100);

        // East wall segment
        makeBox(wallT, wallH, 320, wallColor, 160, wallH / 2, 0);
        makeBox(2, 3, 10, wallColor, 162, wallH + 1.5, -100);
        makeBox(2, 3, 10, wallColor, 162, wallH + 1.5, -50);
        makeBox(2, 3, 10, wallColor, 162, wallH + 1.5, 0);
        makeBox(2, 3, 10, wallColor, 162, wallH + 1.5, 50);
        makeBox(2, 3, 10, wallColor, 162, wallH + 1.5, 100);

        // Wall walkway (top surface north)
        makeBox(320, 1, 3, 0x9E8B6F, 0, wallH, -160);
        // Wall walkway (top surface south)
        makeBox(320, 1, 3, 0x9E8B6F, 0, wallH, 160);
        // Wall walkway west
        makeBox(3, 1, 320, 0x9E8B6F, -160, wallH, 0);
        // Wall walkway east
        makeBox(3, 1, 320, 0x9E8B6F, 160, wallH, 0);
    }

    function buildGates() {
        var gateColor = 0x8B7355;
        var archColor = 0x6B5840;

        // Shipquay Gate - north west, main gate to the river/quay
        makeBox(16, 14, 8, gateColor, -130, 7, -160);
        makeBox(5, 6, 9, archColor, -130, 4, -160);
        // Gate arch keystone
        makeBox(6, 2, 2, 0x9E8B6F, -130, 7, -161);
        // Gate towers flanking Shipquay
        makeCylinder(4, 4, 14, 8, gateColor, -138, 7, -160);
        makeCylinder(4, 4, 14, 8, gateColor, -122, 7, -160);

        // Ferryquay Gate - south, main pedestrian gate
        makeBox(18, 14, 8, gateColor, 0, 7, 160);
        makeBox(6, 6, 9, archColor, 0, 4, 160);
        makeBox(7, 2, 2, 0x9E8B6F, 0, 7, 161);
        makeCylinder(4, 4, 14, 8, gateColor, -9, 7, 160);
        makeCylinder(4, 4, 14, 8, gateColor, 9, 7, 160);

        // Butcher Gate - west side
        makeBox(8, 14, 16, gateColor, -160, 7, -60);
        makeBox(9, 6, 5, archColor, -160, 4, -60);
        makeBox(2, 2, 6, 0x9E8B6F, -161, 7, -60);
        makeCylinder(4, 4, 14, 8, gateColor, -160, 7, -69);
        makeCylinder(4, 4, 14, 8, gateColor, -160, 7, -51);

        // Bishop's Gate - south east, ornate gate
        makeBox(8, 16, 18, gateColor, 160, 8, 100);
        makeBox(9, 7, 6, archColor, 160, 4.5, 100);
        makeBox(2, 2, 7, 0x9E8B6F, 161, 8, 100);
        makeCylinder(5, 5, 16, 8, gateColor, 160, 8, 109);
        makeCylinder(5, 5, 16, 8, gateColor, 160, 8, 91);
        // Bishop's Gate decorative pinnacles
        makeCone(1.5, 4, 8, 0x7A6348, 160, 17, 109);
        makeCone(1.5, 4, 8, 0x7A6348, 160, 17, 91);
    }

    function buildBastions() {
        var bastionColor = 0x8B7355;

        // Double Bastion - north east corner
        makeBox(40, 10, 40, bastionColor, 160, 5, -160);
        makeBox(38, 1, 38, 0x9E8B6F, 160, 10, -160);
        // Cannon emplacement
        makeCylinder(3, 3, 12, 8, 0x444444, 165, 11, -165);
        makeCylinder(1.5, 1.5, 16, 8, 0x333333, 170, 11, -170);

        // Royal Bastion - north west corner
        makeBox(36, 10, 36, bastionColor, -160, 5, -160);
        makeBox(34, 1, 34, 0x9E8B6F, -160, 10, -160);
        makeCylinder(3, 3, 12, 8, 0x444444, -155, 11, -155);
        makeCylinder(1.5, 1.5, 16, 8, 0x333333, -150, 11, -150);

        // Coward's Bastion - south east corner
        makeBox(32, 10, 32, bastionColor, 160, 5, 160);
        makeBox(30, 1, 30, 0x9E8B6F, 160, 10, 160);

        // Magazine Bastion - south west corner
        makeBox(34, 10, 34, bastionColor, -160, 5, 160);
        makeBox(32, 1, 32, 0x9E8B6F, -160, 10, 160);
        // Magazine storage building on bastion
        makeBox(10, 6, 10, 0x6B5840, -160, 13, 160);
        makeBox(10, 2, 10, 0x5A4A34, -160, 19, 160);
    }

    function buildStColumbs() {
        var cathColor = 0x808080;
        var darkGrey = 0x606060;

        // Main nave body
        makeBox(30, 22, 80, cathColor, 60, 11, -30);
        // Nave roof ridge
        makeBox(4, 8, 80, darkGrey, 60, 26, -30);
        // Roof slopes (approximated with rotated boxes)
        makeBox(18, 2, 80, 0x707070, 69, 22, -30);
        makeBox(18, 2, 80, 0x707070, 51, 22, -30);

        // Tower / spire
        makeBox(14, 40, 14, cathColor, 60, 20, -75);
        makeCylinder(3, 5, 20, 8, darkGrey, 60, 50, -75);
        makeCone(3, 12, 8, 0x505050, 60, 66, -75);

        // Chapter House - large distinctive room
        makeBox(25, 16, 25, cathColor, 80, 8, -30);
        makeBox(24, 2, 24, darkGrey, 80, 16, -30);
        // Chapter House roof
        makeCone(16, 10, 4, darkGrey, 80, 21, -30);

        // Cannons near Chapter House (famous historical cannons)
        makeCylinder(1, 1.5, 12, 8, 0x2A2A2A, 86, 2, -22);
        makeCylinder(1, 1.5, 12, 8, 0x2A2A2A, 86, 2, -38);

        // Transept (cross arm)
        makeBox(60, 18, 18, cathColor, 60, 9, -50);

        // Porch
        makeBox(10, 12, 10, cathColor, 60, 6, 15);
        makeCone(6, 6, 4, darkGrey, 60, 15, 15);

        // Graveyard wall
        makeBox(80, 3, 2, 0x909090, 60, 1.5, 25);
        makeBox(2, 3, 50, 0x909090, 20, 1.5, 0);

        // Gravestone cluster
        makeBox(2, 3, 1, 0xC0C0C0, 40, 1.5, 20);
        makeBox(2, 3, 1, 0xC0C0C0, 44, 1.5, 20);
        makeBox(2, 3, 1, 0xC0C0C0, 48, 1.5, 20);
        makeBox(2, 4, 1, 0xB0B0B0, 42, 2, 24);
    }

    function buildGuildhall() {
        var ghColor = 0x8B0000;
        var stoneColor = 0xA02020;
        var clockColor = 0xC8C8C8;

        // Main hall body
        makeBox(50, 20, 35, ghColor, -80, 10, -120);

        // Central clock tower (signature feature)
        makeBox(12, 45, 12, ghColor, -80, 22.5, -120);
        // Clock faces (four sides)
        makeBox(12, 8, 2, clockColor, -80, 38, -127);
        makeBox(12, 8, 2, clockColor, -80, 38, -113);
        makeBox(2, 8, 12, clockColor, -87, 38, -120);
        makeBox(2, 8, 12, clockColor, -73, 38, -120);
        // Clock tower belfry
        makeBox(14, 6, 14, 0x6B0000, -80, 47, -120);
        // Spire on clock tower
        makeCone(5, 16, 4, 0x5A0000, -80, 55, -120);

        // Neo-Gothic decorative pinnacles on corners
        makeCone(2, 8, 4, stoneColor, -107, 21, -138);
        makeCone(2, 8, 4, stoneColor, -53, 21, -138);
        makeCone(2, 8, 4, stoneColor, -107, 21, -102);
        makeCone(2, 8, 4, stoneColor, -53, 21, -102);

        // Great hall wing (east)
        makeBox(20, 16, 35, ghColor, -53, 8, -120);
        // Entrance portico
        makeBox(18, 14, 8, ghColor, -80, 7, -140);
        makeCylinder(2, 2, 12, 8, stoneColor, -88, 6, -140);
        makeCylinder(2, 2, 12, 8, stoneColor, -72, 6, -140);

        // Guildhall Square / forecourt
        makeBox(60, 1, 30, 0x666666, -80, 0.5, -150);
    }

    function buildRiverFoyle() {
        var riverColor = 0x006994;
        var bankColor = 0x4A6741;

        // Wide river to the west - several sections to give width
        makeBox(200, 2, 600, riverColor, -260, -0.5, 0);
        // River surface shimmer highlight
        makeBox(180, 1, 580, 0x0077AA, -260, 0.6, 0);

        // East bank of Foyle
        makeBox(20, 4, 600, bankColor, -172, 2, 0);
        // West bank
        makeBox(20, 4, 600, bankColor, -348, 2, 0);

        // River bed stones / shallows at edges
        makeBox(10, 2, 600, 0x5B7A52, -183, 1, 0);
        makeBox(10, 2, 600, 0x5B7A52, -337, 1, 0);
    }

    function buildPeaceBridge() {
        var bridgeColor = 0xC0C0C0;
        var cableColor = 0xA0A0A0;

        // Peace Bridge: elegant S-shape pedestrian bridge over Foyle
        // Approximated as a series of angled BoxGeometry segments

        // Central pylons (two asymmetric cable-stay pylons)
        makeCylinder(2, 2, 30, 8, bridgeColor, -240, 15, 100);
        makeCylinder(2, 2, 26, 8, bridgeColor, -280, 13, 80);

        // Bridge deck segments forming the S-curve
        makeBox(30, 2, 8, bridgeColor, -215, 3, 100);
        makeBox(30, 2, 8, bridgeColor, -245, 3, 95);
        makeBox(30, 2, 8, bridgeColor, -272, 3, 87);
        makeBox(30, 2, 8, bridgeColor, -298, 3, 80);
        makeBox(25, 2, 8, bridgeColor, -322, 3, 76);

        // Bridge handrails north side
        makeBox(150, 1, 1, cableColor, -260, 5, 100);
        // Bridge handrails south side
        makeBox(150, 1, 1, cableColor, -260, 5, 92);

        // Cable stays from pylons
        makeBox(2, 20, 1, cableColor, -235, 14, 100);
        makeBox(2, 18, 1, cableColor, -255, 13, 97);
        makeBox(2, 16, 1, cableColor, -270, 12, 88);
        makeBox(2, 18, 1, cableColor, -290, 13, 83);

        // Bridge approach ramps
        makeBox(20, 2, 8, bridgeColor, -198, 2, 100);
        makeBox(20, 2, 8, bridgeColor, -340, 2, 76);
    }

    function buildBogsideMurals() {
        // Bogside area to the west outside walls

        // Large gable end wall (famous mural building)
        makeBox(2, 18, 22, 0xF5F5F5, -185, 9, 60);
        // Mural colour blocks approximating famous imagery
        makeBox(1, 6, 8, 0xE8E8E8, -184, 10, 60);
        makeBox(1, 8, 10, 0xDDDDDD, -184, 5, 54);
        makeBox(1, 10, 6, 0xF0F0F0, -184, 8, 66);
        // Mural frame accent strips
        makeBox(1, 2, 22, 0xCC0000, -184, 17, 60);
        makeBox(1, 2, 22, 0x228B22, -184, 14, 60);

        // Adjacent terrace houses of Bogside
        makeBox(8, 10, 10, 0xD2B48C, -195, 5, 40);
        makeBox(8, 10, 10, 0xC8AA82, -195, 5, 52);
        makeBox(8, 10, 10, 0xD2B48C, -195, 5, 64);
        makeBox(8, 10, 10, 0xC8AA82, -195, 5, 76);

        // Terrace roofs
        makeBox(8, 2, 10, 0x555555, -195, 11, 40);
        makeBox(8, 2, 10, 0x555555, -195, 11, 52);
        makeBox(8, 2, 10, 0x555555, -195, 11, 64);
        makeBox(8, 2, 10, 0x555555, -195, 11, 76);

        // Pavement / road in Bogside
        makeBox(30, 1, 60, 0x666666, -190, 0.5, 60);
    }

    function buildFreeDerryCorner() {
        // Free Derry Corner: the iconic gable wall "YOU ARE NOW ENTERING FREE DERRY"
        // Located at the junction of Lecky Road and Fahan Street in the Bogside

        // The gable wall itself (white-painted)
        makeBox(2, 14, 20, 0xFFFFF0, -210, 7, 90);
        // Text band in black at top of wall
        makeBox(1.5, 4, 18, 0x111111, -210, 12, 90);
        // White lettering approximation on the black band
        makeBox(1, 1, 14, 0xFFFFF0, -210, 12, 90);

        // The corner house (no longer exists but the gable remains)
        // Side wall stub
        makeBox(10, 14, 2, 0xFFFFF0, -205, 7, 100);

        // Pavement / gathering area at Free Derry Corner
        makeBox(30, 1, 30, 0x777777, -210, 0.5, 90);

        // Small wall plaque support
        makeBox(3, 2, 1, 0xE0E0E0, -211, 2, 88);
    }

    function buildCregganHills() {
        var hillGreen = 0x4A7C59;
        var darkGreen = 0x3A6449;

        // Rising hills to the west behind Bogside - approximated with large spheres and boxes
        makeSphere(80, 12, 8, hillGreen, -420, 40, -60);
        makeSphere(70, 12, 8, darkGreen, -380, 35, 40);
        makeSphere(60, 12, 8, hillGreen, -440, 30, 60);
        makeSphere(55, 10, 8, darkGreen, -460, 25, -20);
        makeSphere(65, 12, 8, 0x5A8C69, -400, 32, -40);

        // Hillside base slopes
        makeBox(100, 30, 200, hillGreen, -430, 15, 0);
        makeBox(80, 20, 150, darkGreen, -390, 10, -50);

        // Creggan housing estate on the hill - distant silhouette blocks
        makeBox(12, 8, 12, 0xC8A882, -400, 42, -30);
        makeBox(12, 8, 12, 0xBB9A78, -415, 38, -10);
        makeBox(12, 8, 12, 0xC8A882, -405, 36, 20);

        // St Mary's Church Creggan (hilltop)
        makeBox(10, 14, 10, 0x888888, -410, 47, -50);
        makeCone(4, 8, 4, 0x666666, -410, 55, -50);
    }

    function buildEbringtonBarracks() {
        var brickColor = 0xA0522D;
        var darkBrick = 0x8B4513;

        // Ebrington Barracks across the river on the east Waterside bank
        // Main barracks block
        makeBox(60, 16, 30, brickColor, -340, 8, -80);
        makeBox(58, 2, 28, 0x8B4513, -340, 16, -80);

        // Officers' mess block
        makeBox(30, 14, 25, darkBrick, -310, 7, -60);
        makeBox(30, 2, 25, 0x7A3B0A, -310, 14, -60);

        // Parade ground (now public square)
        makeBox(80, 1, 60, 0x888877, -340, 0.5, -50);

        // Clock tower at barracks entrance
        makeBox(10, 30, 10, brickColor, -340, 15, -100);
        makeBox(11, 4, 11, darkBrick, -340, 30, -100);
        makeCone(5, 10, 4, 0x6B3A10, -340, 37, -100);

        // Gatehouse
        makeBox(16, 10, 8, brickColor, -340, 5, -110);
        makeBox(6, 6, 9, 0x5A3010, -340, 3, -110);

        // Perimeter wall
        makeBox(80, 4, 2, brickColor, -340, 2, -120);
        makeBox(2, 4, 60, brickColor, -380, 2, -90);
        makeBox(2, 4, 60, brickColor, -300, 2, -90);
    }

    function buildCityInterior() {
        // Interior buildings of the walled city

        // Diamond (central market square area)
        makeBox(40, 1, 40, 0x888888, 0, 0.5, 0);
        // War Memorial column at the Diamond
        makeCylinder(1, 1.5, 18, 8, 0xBBBBBB, 0, 9, 0);
        makeSphere(2, 8, 6, 0xCCCCCC, 0, 19, 0);

        // Typical 17th/18th century townhouse blocks
        makeBox(20, 12, 15, 0xC19A6B, 30, 6, 40);
        makeBox(20, 14, 15, 0xB8935E, 52, 7, 40);
        makeBox(20, 10, 15, 0xC8A870, 74, 5, 40);

        // Roofs for townhouses
        makeBox(20, 3, 15, 0x444444, 30, 13.5, 40);
        makeBox(20, 3, 15, 0x444444, 52, 16.5, 40);
        makeBox(20, 3, 15, 0x444444, 74, 12.5, 40);

        // Row of shops along Shipquay Street
        makeBox(80, 10, 12, 0xD2A679, -20, 5, 80);
        makeBox(80, 2, 12, 0x555544, -20, 11, 80);

        // Derry's oldest pub / Bishop Street area buildings
        makeBox(14, 12, 16, 0xA0856B, -50, 6, 50);
        makeBox(14, 12, 16, 0x9A7D60, -66, 6, 50);
        makeBox(14, 3, 16, 0x333333, -50, 13.5, 50);
        makeBox(14, 3, 16, 0x333333, -66, 13.5, 50);

        // Fountain Estate / inner street
        makeBox(60, 1, 10, 0x777777, 30, 0.5, -60);

        // Small park / open green space inside walls
        makeBox(40, 1, 30, 0x5C8A48, -20, 0.5, -80);
        makeSphere(5, 8, 6, 0x3A7A30, -25, 6, -85);
        makeSphere(4, 8, 6, 0x4A8A40, -10, 5, -80);
        makeSphere(6, 8, 6, 0x3E7034, -30, 7, -75);

        // Street lamp posts
        makeCylinder(0.2, 0.2, 6, 6, 0x1A1A1A, 10, 3, 30);
        makeSphere(0.6, 6, 4, 0xFFFF99, 10, 6.5, 30);
        makeCylinder(0.2, 0.2, 6, 6, 0x1A1A1A, -10, 3, 30);
        makeSphere(0.6, 6, 4, 0xFFFF99, -10, 6.5, 30);
        makeCylinder(0.2, 0.2, 6, 6, 0x1A1A1A, 10, 3, -30);
        makeSphere(0.6, 6, 4, 0xFFFF99, 10, 6.5, -30);
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
