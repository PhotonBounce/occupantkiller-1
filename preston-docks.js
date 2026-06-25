window.PrestonDocks = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 22240;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function makeMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.set(rx, ry, rz);
        if (sx !== undefined) mesh.scale.set(sx, sy, sz);
        return mesh;
    }

    function addMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mesh = makeMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildDockBasin();
        buildDockWarehouses();
        buildRiverRibble();
        buildPrestonMarket();
        buildHarrisMuseum();
        buildStWalburgeBChurch();
        buildFlagMarket();
        buildDeepdaleStadium();
        buildRibbleValleyCountryside();
        buildFishergate();
        buildAvenhamPark();
        buildMarinaMoorings();
        buildDocksideInfrastructure();
    }

    function buildGround() {
        // Ground plane built from boxes
        addMesh(new THREE.BoxGeometry(2500, 2, 2500), 0x5A6E3A, BASE_X, BASE_Y - 1, BASE_Z);
        // Dock area ground - concrete apron
        addMesh(new THREE.BoxGeometry(1200, 1, 600), 0x888888, BASE_X - 200, BASE_Y, BASE_Z + 200);
    }

    function buildDockBasin() {
        // Albert Edward Dock - large rectangular basin floor (water surface)
        addMesh(new THREE.BoxGeometry(1000, 2, 300), 0x4682B4, BASE_X - 100, BASE_Y + 1, BASE_Z + 180);
        // Dock walls - north side
        addMesh(new THREE.BoxGeometry(1010, 14, 12), 0x777777, BASE_X - 100, BASE_Y + 7, BASE_Z + 28);
        // Dock walls - south side
        addMesh(new THREE.BoxGeometry(1010, 14, 12), 0x777777, BASE_X - 100, BASE_Y + 7, BASE_Z + 332);
        // Dock walls - east end
        addMesh(new THREE.BoxGeometry(12, 14, 316), 0x777777, BASE_X + 405, BASE_Y + 7, BASE_Z + 180);
        // Dock walls - west end (lock gate area)
        addMesh(new THREE.BoxGeometry(12, 14, 316), 0x666666, BASE_X - 605, BASE_Y + 7, BASE_Z + 180);
        // Lock gate structure
        addMesh(new THREE.BoxGeometry(40, 18, 20), 0x444444, BASE_X - 620, BASE_Y + 9, BASE_Z + 180);
        // Lock gate doors - left
        addMesh(new THREE.BoxGeometry(6, 16, 140), 0x333333, BASE_X - 618, BASE_Y + 8, BASE_Z + 112);
        // Lock gate doors - right
        addMesh(new THREE.BoxGeometry(6, 16, 140), 0x333333, BASE_X - 618, BASE_Y + 8, BASE_Z + 248);
        // Dock gate control tower
        addMesh(new THREE.BoxGeometry(14, 30, 14), 0x888888, BASE_X - 630, BASE_Y + 15, BASE_Z + 180);
        addMesh(new THREE.BoxGeometry(18, 4, 18), 0x666666, BASE_X - 630, BASE_Y + 32, BASE_Z + 180);
        // Marina pontoons
        addMesh(new THREE.BoxGeometry(180, 3, 12), 0xAA8855, BASE_X + 100, BASE_Y + 3, BASE_Z + 80);
        addMesh(new THREE.BoxGeometry(180, 3, 12), 0xAA8855, BASE_X + 100, BASE_Y + 3, BASE_Z + 120);
        addMesh(new THREE.BoxGeometry(180, 3, 12), 0xAA8855, BASE_X + 100, BASE_Y + 3, BASE_Z + 240);
        addMesh(new THREE.BoxGeometry(180, 3, 12), 0xAA8855, BASE_X + 100, BASE_Y + 3, BASE_Z + 280);
        // Pontoon access walkways
        addMesh(new THREE.BoxGeometry(10, 2, 60), 0xBB9966, BASE_X + 10, BASE_Y + 3, BASE_Z + 80);
        addMesh(new THREE.BoxGeometry(10, 2, 60), 0xBB9966, BASE_X + 10, BASE_Y + 3, BASE_Z + 260);
        // Dock cranes - remnants
        addMesh(new THREE.BoxGeometry(6, 40, 6), 0xCC4444, BASE_X + 380, BASE_Y + 20, BASE_Z + 30);
        addMesh(new THREE.BoxGeometry(60, 5, 6), 0xCC4444, BASE_X + 350, BASE_Y + 42, BASE_Z + 30);
        addMesh(new THREE.BoxGeometry(6, 40, 6), 0xCC4444, BASE_X + 250, BASE_Y + 20, BASE_Z + 328);
        addMesh(new THREE.BoxGeometry(60, 5, 6), 0xCC4444, BASE_X + 220, BASE_Y + 42, BASE_Z + 328);
    }

    function buildDockWarehouses() {
        // Victorian dock warehouses along north quay
        // Warehouse 1
        addMesh(new THREE.BoxGeometry(120, 28, 50), 0x8B4513, BASE_X - 300, BASE_Y + 14, BASE_Z - 30);
        addMesh(new THREE.BoxGeometry(124, 6, 54), 0x5C3010, BASE_X - 300, BASE_Y + 31, BASE_Z - 30);
        // Warehouse 2
        addMesh(new THREE.BoxGeometry(120, 28, 50), 0x7A3B10, BASE_X - 150, BASE_Y + 14, BASE_Z - 30);
        addMesh(new THREE.BoxGeometry(124, 6, 54), 0x5C3010, BASE_X - 150, BASE_Y + 31, BASE_Z - 30);
        // Warehouse 3
        addMesh(new THREE.BoxGeometry(120, 28, 50), 0x8B4513, BASE_X, BASE_Y + 14, BASE_Z - 30);
        addMesh(new THREE.BoxGeometry(124, 6, 54), 0x5C3010, BASE_X, BASE_Y + 31, BASE_Z - 30);
        // Warehouse 4 - converted apartments
        addMesh(new THREE.BoxGeometry(120, 36, 50), 0xBB7744, BASE_X + 150, BASE_Y + 18, BASE_Z - 30);
        addMesh(new THREE.BoxGeometry(124, 4, 54), 0x996633, BASE_X + 150, BASE_Y + 38, BASE_Z - 30);
        // South quay warehouse
        addMesh(new THREE.BoxGeometry(200, 24, 45), 0x7A3B10, BASE_X - 50, BASE_Y + 12, BASE_Z + 380);
        addMesh(new THREE.BoxGeometry(204, 5, 49), 0x5C3010, BASE_X - 50, BASE_Y + 26, BASE_Z + 380);
        // Dock office building
        addMesh(new THREE.BoxGeometry(40, 20, 30), 0xC8A878, BASE_X + 380, BASE_Y + 10, BASE_Z - 60);
        addMesh(new THREE.BoxGeometry(44, 3, 34), 0xAA8860, BASE_X + 380, BASE_Y + 22, BASE_Z - 60);
        // Dock office columns
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 16, 8), 0xDDCCAA, BASE_X + 365, BASE_Y + 8, BASE_Z - 48);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 16, 8), 0xDDCCAA, BASE_X + 395, BASE_Y + 8, BASE_Z - 48);
    }

    function buildRiverRibble() {
        // River Ribble - wide tidal river west of dock
        addMesh(new THREE.BoxGeometry(600, 2, 500), 0x4682B4, BASE_X - 900, BASE_Y + 0.5, BASE_Z + 100);
        // River banks
        addMesh(new THREE.BoxGeometry(620, 8, 20), 0x8B7355, BASE_X - 900, BASE_Y + 4, BASE_Z - 152);
        addMesh(new THREE.BoxGeometry(620, 8, 20), 0x8B7355, BASE_X - 900, BASE_Y + 4, BASE_Z + 352);
        // Ribble estuary widening - further west
        addMesh(new THREE.BoxGeometry(400, 2, 800), 0x3A72A0, BASE_X - 1300, BASE_Y + 0.3, BASE_Z + 100);
        // Mudflats along estuary
        addMesh(new THREE.BoxGeometry(400, 1, 100), 0x9B8563, BASE_X - 1100, BASE_Y + 0.2, BASE_Z - 80);
        addMesh(new THREE.BoxGeometry(400, 1, 100), 0x9B8563, BASE_X - 1100, BASE_Y + 0.2, BASE_Z + 280);
        // Ribble footbridge / Penwortham Bridge
        addMesh(new THREE.BoxGeometry(200, 5, 10), 0x888888, BASE_X - 850, BASE_Y + 8, BASE_Z + 100);
        addMesh(new THREE.CylinderGeometry(4, 5, 20, 8), 0x777777, BASE_X - 760, BASE_Y + 10, BASE_Z + 100);
        addMesh(new THREE.CylinderGeometry(4, 5, 20, 8), 0x777777, BASE_X - 940, BASE_Y + 10, BASE_Z + 100);
    }

    function buildPrestonMarket() {
        // Preston Market Hall - large Victorian covered market
        var mktX = BASE_X + 200;
        var mktZ = BASE_Z - 250;
        // Main market hall building
        addMesh(new THREE.BoxGeometry(140, 18, 100), 0xDEB887, mktX, BASE_Y + 9, mktZ);
        // Market hall roof - pitched
        addMesh(new THREE.BoxGeometry(144, 12, 16), 0xC8A878, mktX, BASE_Y + 24, mktZ, 0, 0, 0);
        // Roof ridge
        addMesh(new THREE.BoxGeometry(140, 4, 4), 0xAA8860, mktX, BASE_Y + 30, mktZ);
        // Market entrance portico
        addMesh(new THREE.BoxGeometry(40, 20, 12), 0xD4B896, mktX, BASE_Y + 10, mktZ - 56);
        // Market portico columns
        addMesh(new THREE.CylinderGeometry(2, 2, 16, 8), 0xE8D0A8, mktX - 12, BASE_Y + 8, mktZ - 56);
        addMesh(new THREE.CylinderGeometry(2, 2, 16, 8), 0xE8D0A8, mktX, BASE_Y + 8, mktZ - 56);
        addMesh(new THREE.CylinderGeometry(2, 2, 16, 8), 0xE8D0A8, mktX + 12, BASE_Y + 8, mktZ - 56);
        // Market clock tower
        addMesh(new THREE.BoxGeometry(12, 32, 12), 0xC8A060, mktX + 60, BASE_Y + 16, mktZ - 45);
        addMesh(new THREE.BoxGeometry(14, 4, 14), 0xAA8040, mktX + 60, BASE_Y + 34, mktZ - 45);
        addMesh(new THREE.ConeGeometry(7, 10, 4), 0x886030, mktX + 60, BASE_Y + 41, mktZ - 45);
    }

    function buildHarrisMuseum() {
        // Harris Museum and Art Gallery - Greek Revival
        var harrisX = BASE_X + 180;
        var harrisZ = BASE_Z - 420;
        // Main body
        addMesh(new THREE.BoxGeometry(90, 22, 70), 0xF5F5DC, harrisX, BASE_Y + 11, harrisZ);
        // Upper level / attic
        addMesh(new THREE.BoxGeometry(80, 10, 60), 0xF0F0D0, harrisX, BASE_Y + 27, harrisZ);
        // Dome base
        addMesh(new THREE.CylinderGeometry(16, 18, 8, 12), 0xEEEED8, harrisX, BASE_Y + 36, harrisZ);
        // Dome itself
        addMesh(new THREE.SphereGeometry(16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xF5F5DC, harrisX, BASE_Y + 40, harrisZ);
        // Dome lantern
        addMesh(new THREE.CylinderGeometry(4, 4, 8, 8), 0xEEEED8, harrisX, BASE_Y + 56, harrisZ);
        addMesh(new THREE.ConeGeometry(4, 5, 8), 0xDDDDCC, harrisX, BASE_Y + 63, harrisZ);
        // Portico columns - front (south)
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 20, 10), 0xF5F5DC, harrisX - 30, BASE_Y + 10, harrisZ - 38);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 20, 10), 0xF5F5DC, harrisX - 15, BASE_Y + 10, harrisZ - 38);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 20, 10), 0xF5F5DC, harrisX, BASE_Y + 10, harrisZ - 38);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 20, 10), 0xF5F5DC, harrisX + 15, BASE_Y + 10, harrisZ - 38);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 20, 10), 0xF5F5DC, harrisX + 30, BASE_Y + 10, harrisZ - 38);
        // Portico entablature
        addMesh(new THREE.BoxGeometry(80, 5, 8), 0xEEEED8, harrisX, BASE_Y + 22, harrisZ - 38);
        // Front steps
        addMesh(new THREE.BoxGeometry(70, 3, 8), 0xDDDDCC, harrisX, BASE_Y + 1.5, harrisZ - 44);
        addMesh(new THREE.BoxGeometry(66, 3, 8), 0xCCCCBB, harrisX, BASE_Y + 4.5, harrisZ - 42);
    }

    function buildStWalburgeBChurch() {
        // St Walburge's Church - tallest spire in England outside London at 96m
        var stwX = BASE_X - 80;
        var stwZ = BASE_Z - 350;
        // Nave
        addMesh(new THREE.BoxGeometry(60, 26, 30), 0xD4C8A0, stwX, BASE_Y + 13, stwZ);
        // Chancel / east end
        addMesh(new THREE.BoxGeometry(28, 22, 28), 0xCEC0A0, stwX + 44, BASE_Y + 11, stwZ);
        // Nave roof - pitched
        addMesh(new THREE.BoxGeometry(62, 8, 6), 0xBAAA90, stwX, BASE_Y + 30, stwZ, 0.4, 0, 0);
        // Transepts
        addMesh(new THREE.BoxGeometry(20, 20, 50), 0xD4C8A0, stwX - 10, BASE_Y + 10, stwZ);
        // Main tower base
        addMesh(new THREE.BoxGeometry(18, 38, 18), 0xCEC2A2, stwX - 22, BASE_Y + 19, stwZ - 14);
        // Spire - tall and slim (96m total, scaled)
        addMesh(new THREE.ConeGeometry(7, 120, 4), 0xD8CCAA, stwX - 22, BASE_Y + 98, stwZ - 14);
        // Buttresses
        addMesh(new THREE.BoxGeometry(5, 30, 5), 0xCEC0A0, stwX - 32, BASE_Y + 15, stwZ - 10);
        addMesh(new THREE.BoxGeometry(5, 30, 5), 0xCEC0A0, stwX - 12, BASE_Y + 15, stwZ - 20);
        // West window
        addMesh(new THREE.BoxGeometry(8, 14, 2), 0xAAAA88, stwX - 22, BASE_Y + 22, stwZ - 24);
    }

    function buildFlagMarket() {
        // Flag Market - open town square
        var fmX = BASE_X + 200;
        var fmZ = BASE_Z - 340;
        // Square paving
        addMesh(new THREE.BoxGeometry(120, 1, 100), 0xCCBBAA, fmX, BASE_Y + 0.5, fmZ);
        // Cenotaph war memorial
        addMesh(new THREE.BoxGeometry(8, 22, 8), 0xF0EEE0, fmX, BASE_Y + 11, fmZ);
        addMesh(new THREE.BoxGeometry(10, 3, 10), 0xE8E6D8, fmX, BASE_Y + 23.5, fmZ);
        // Cenotaph top ornament
        addMesh(new THREE.BoxGeometry(6, 6, 6), 0xF0EEE0, fmX, BASE_Y + 28, fmZ);
        // Market cross / flagpole
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 20, 6), 0x888888, fmX - 40, BASE_Y + 10, fmZ - 30);
        // Surrounding civic buildings (Preston Guild Hall area)
        addMesh(new THREE.BoxGeometry(70, 20, 30), 0xCCBB99, fmX + 70, BASE_Y + 10, fmZ - 60);
        addMesh(new THREE.BoxGeometry(74, 4, 34), 0xBBAA88, fmX + 70, BASE_Y + 22, fmZ - 60);
        // Town Hall
        addMesh(new THREE.BoxGeometry(80, 24, 40), 0xDDCCBB, fmX - 80, BASE_Y + 12, fmZ - 70);
        addMesh(new THREE.BoxGeometry(84, 4, 44), 0xCCBBAA, fmX - 80, BASE_Y + 26, fmZ - 70);
        // Town Hall columns
        addMesh(new THREE.CylinderGeometry(2, 2, 18, 8), 0xEEDDCC, fmX - 96, BASE_Y + 9, fmZ - 56);
        addMesh(new THREE.CylinderGeometry(2, 2, 18, 8), 0xEEDDCC, fmX - 64, BASE_Y + 9, fmZ - 56);
    }

    function buildDeepdaleStadium() {
        // Deepdale Stadium - Preston North End FC
        var dpX = BASE_X - 200;
        var dpZ = BASE_Z - 500;
        // Pitch (grass)
        addMesh(new THREE.BoxGeometry(110, 1, 72), 0x3A8B3A, dpX, BASE_Y + 0.5, dpZ);
        // North Stand
        addMesh(new THREE.BoxGeometry(120, 14, 22), 0xCCCCCC, dpX, BASE_Y + 7, dpZ - 48);
        addMesh(new THREE.BoxGeometry(120, 4, 22), 0xBBBBBB, dpX, BASE_Y + 16, dpZ - 48);
        // South Stand
        addMesh(new THREE.BoxGeometry(120, 14, 22), 0xCCCCCC, dpX, BASE_Y + 7, dpZ + 48);
        addMesh(new THREE.BoxGeometry(120, 4, 22), 0xBBBBBB, dpX, BASE_Y + 16, dpZ + 48);
        // East Stand (Bill Shankly Kop)
        addMesh(new THREE.BoxGeometry(22, 18, 80), 0xBBBBBB, dpX + 68, BASE_Y + 9, dpZ);
        addMesh(new THREE.BoxGeometry(22, 5, 80), 0xAAAAAA, dpX + 68, BASE_Y + 20, dpZ);
        // West Stand
        addMesh(new THREE.BoxGeometry(22, 18, 80), 0xCCCCCC, dpX - 68, BASE_Y + 9, dpZ);
        addMesh(new THREE.BoxGeometry(22, 5, 80), 0xBBBBBB, dpX - 68, BASE_Y + 20, dpZ);
        // Stadium roof supports - floodlights
        addMesh(new THREE.CylinderGeometry(1, 1, 30, 6), 0x999999, dpX + 70, BASE_Y + 15, dpZ - 50);
        addMesh(new THREE.CylinderGeometry(1, 1, 30, 6), 0x999999, dpX - 70, BASE_Y + 15, dpZ - 50);
        addMesh(new THREE.CylinderGeometry(1, 1, 30, 6), 0x999999, dpX + 70, BASE_Y + 15, dpZ + 50);
        addMesh(new THREE.CylinderGeometry(1, 1, 30, 6), 0x999999, dpX - 70, BASE_Y + 15, dpZ + 50);
    }

    function buildRibbleValleyCountryside() {
        // Green hills and fields to the east
        // Rolling hills
        addMesh(new THREE.SphereGeometry(160, 8, 6), 0x6DB33F, BASE_X + 700, BASE_Y - 80, BASE_Z - 200);
        addMesh(new THREE.SphereGeometry(120, 8, 6), 0x5CA030, BASE_X + 900, BASE_Y - 60, BASE_Z + 100);
        addMesh(new THREE.SphereGeometry(200, 8, 6), 0x6DB33F, BASE_X + 600, BASE_Y - 120, BASE_Z + 300);
        // Fields - flat green boxes
        addMesh(new THREE.BoxGeometry(200, 1, 150), 0x5CA030, BASE_X + 600, BASE_Y, BASE_Z - 300);
        addMesh(new THREE.BoxGeometry(180, 1, 130), 0x7DC040, BASE_X + 700, BASE_Y, BASE_Z - 100);
        addMesh(new THREE.BoxGeometry(160, 1, 120), 0x6DB33F, BASE_X + 800, BASE_Y, BASE_Z + 200);
        // Hedgerows
        addMesh(new THREE.BoxGeometry(200, 4, 4), 0x3A6E20, BASE_X + 600, BASE_Y + 2, BASE_Z - 230);
        addMesh(new THREE.BoxGeometry(4, 4, 150), 0x3A6E20, BASE_X + 700, BASE_Y + 2, BASE_Z - 160);
        // Farmhouse
        addMesh(new THREE.BoxGeometry(20, 12, 15), 0xDDCCAA, BASE_X + 750, BASE_Y + 6, BASE_Z - 280);
        addMesh(new THREE.BoxGeometry(22, 6, 4), 0x884422, BASE_X + 750, BASE_Y + 18, BASE_Z - 280);
        // Barn
        addMesh(new THREE.BoxGeometry(30, 10, 18), 0xAA8833, BASE_X + 780, BASE_Y + 5, BASE_Z - 260);
    }

    function buildFishergate() {
        // Fishergate - main shopping street
        var fgX = BASE_X + 100;
        var fgZ = BASE_Z - 470;
        // Street surface
        addMesh(new THREE.BoxGeometry(300, 1, 20), 0x555555, fgX, BASE_Y + 0.5, fgZ);
        // Victorian buildings along street - north side
        addMesh(new THREE.BoxGeometry(50, 24, 24), 0x886655, fgX - 100, BASE_Y + 12, fgZ - 26);
        addMesh(new THREE.BoxGeometry(50, 20, 24), 0x997766, fgX - 40, BASE_Y + 10, fgZ - 26);
        addMesh(new THREE.BoxGeometry(50, 22, 24), 0x886655, fgX + 20, BASE_Y + 11, fgZ - 26);
        addMesh(new THREE.BoxGeometry(50, 26, 24), 0x775544, fgX + 80, BASE_Y + 13, fgZ - 26);
        // Victorian buildings - south side
        addMesh(new THREE.BoxGeometry(60, 20, 24), 0x886655, fgX - 90, BASE_Y + 10, fgZ + 26);
        addMesh(new THREE.BoxGeometry(60, 24, 24), 0x997766, fgX - 20, BASE_Y + 12, fgZ + 26);
        addMesh(new THREE.BoxGeometry(60, 22, 24), 0x886655, fgX + 50, BASE_Y + 11, fgZ + 26);
        // Pavements
        addMesh(new THREE.BoxGeometry(300, 1, 6), 0xBBBBBB, fgX, BASE_Y + 0.8, fgZ - 14);
        addMesh(new THREE.BoxGeometry(300, 1, 6), 0xBBBBBB, fgX, BASE_Y + 0.8, fgZ + 14);
        // Post box / street furniture
        addMesh(new THREE.CylinderGeometry(1.2, 1.2, 5, 8), 0xCC2222, fgX - 130, BASE_Y + 2.5, fgZ - 14);
    }

    function buildAvenhamPark() {
        // Avenham Park - Victorian riverside park
        var apX = BASE_X - 300;
        var apZ = BASE_Z + 500;
        // Park grass
        addMesh(new THREE.BoxGeometry(250, 1, 200), 0x4CAF50, apX, BASE_Y + 0.5, apZ);
        // Fountain base
        addMesh(new THREE.CylinderGeometry(10, 12, 3, 12), 0xCCCCCC, apX, BASE_Y + 1.5, apZ);
        // Fountain bowl
        addMesh(new THREE.CylinderGeometry(8, 8, 2, 12), 0xDDDDDD, apX, BASE_Y + 4.5, apZ);
        // Fountain central column
        addMesh(new THREE.CylinderGeometry(1.5, 2, 8, 8), 0xCCCCCC, apX, BASE_Y + 8, apZ);
        // Fountain top spray sphere
        addMesh(new THREE.SphereGeometry(2.5, 8, 8), 0x88CCFF, apX, BASE_Y + 13, apZ);
        // Park pavilion
        addMesh(new THREE.BoxGeometry(28, 10, 18), 0xEEDDAA, apX + 80, BASE_Y + 5, apZ - 60);
        addMesh(new THREE.BoxGeometry(30, 2, 20), 0xDDCC99, apX + 80, BASE_Y + 11, apZ - 60);
        // Pavilion veranda columns
        addMesh(new THREE.CylinderGeometry(1, 1, 9, 6), 0xEEEECC, apX + 68, BASE_Y + 4.5, apZ - 68);
        addMesh(new THREE.CylinderGeometry(1, 1, 9, 6), 0xEEEECC, apX + 92, BASE_Y + 4.5, apZ - 68);
        // Park bandstand
        addMesh(new THREE.CylinderGeometry(10, 10, 1, 10), 0xCCBBAA, apX - 70, BASE_Y + 0.5, apZ - 50);
        addMesh(new THREE.ConeGeometry(12, 8, 10), 0x886644, apX - 70, BASE_Y + 10, apZ - 50);
        // Bandstand central column
        addMesh(new THREE.CylinderGeometry(1, 1.5, 9, 8), 0x888866, apX - 70, BASE_Y + 5, apZ - 50);
        // Park benches (represented as flat boxes)
        addMesh(new THREE.BoxGeometry(6, 1, 2), 0x886633, apX - 20, BASE_Y + 2, apZ - 30);
        addMesh(new THREE.BoxGeometry(6, 1, 2), 0x886633, apX + 20, BASE_Y + 2, apZ - 30);
        addMesh(new THREE.BoxGeometry(6, 1, 2), 0x886633, apX - 20, BASE_Y + 2, apZ + 30);
        // Park wall along river side
        addMesh(new THREE.BoxGeometry(250, 5, 3), 0x888877, apX, BASE_Y + 2.5, apZ + 100);
        // Tree stumps / trunks
        addMesh(new THREE.CylinderGeometry(2, 2.5, 10, 7), 0x5C4A2A, apX - 60, BASE_Y + 5, apZ + 20);
        addMesh(new THREE.SphereGeometry(8, 7, 5), 0x2D7A2D, apX - 60, BASE_Y + 16, apZ + 20);
        addMesh(new THREE.CylinderGeometry(2, 2.5, 10, 7), 0x5C4A2A, apX + 60, BASE_Y + 5, apZ + 20);
        addMesh(new THREE.SphereGeometry(8, 7, 5), 0x2D7A2D, apX + 60, BASE_Y + 16, apZ + 20);
        addMesh(new THREE.CylinderGeometry(2, 2.5, 10, 7), 0x5C4A2A, apX, BASE_Y + 5, apZ + 60);
        addMesh(new THREE.SphereGeometry(8, 7, 5), 0x2D7A2D, apX, BASE_Y + 16, apZ + 60);
    }

    function buildMarinaMoorings() {
        // Moored boats in the marina
        // Boat 1 hull
        addMesh(new THREE.BoxGeometry(18, 4, 6), 0xFFFFFF, BASE_X + 60, BASE_Y + 4, BASE_Z + 82);
        addMesh(new THREE.ConeGeometry(3, 12, 4), 0xEEEEEE, BASE_X + 78, BASE_Y + 10, BASE_Z + 82);
        // Boat 2 hull
        addMesh(new THREE.BoxGeometry(22, 4, 7), 0xCC4422, BASE_X + 100, BASE_Y + 4, BASE_Z + 82);
        // Boat 3 hull
        addMesh(new THREE.BoxGeometry(16, 3, 5), 0x2244CC, BASE_X + 140, BASE_Y + 4, BASE_Z + 82);
        // Boat 4 - sailing yacht with mast
        addMesh(new THREE.BoxGeometry(20, 4, 6), 0xFFFFEE, BASE_X + 80, BASE_Y + 4, BASE_Z + 242);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 28, 6), 0x888855, BASE_X + 80, BASE_Y + 18, BASE_Z + 242);
        // Boat 5
        addMesh(new THREE.BoxGeometry(24, 5, 8), 0x446622, BASE_X + 120, BASE_Y + 5, BASE_Z + 242);
    }

    function buildDocksideInfrastructure() {
        // Dockside bollards
        addMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 8), 0x333333, BASE_X - 550, BASE_Y + 2, BASE_Z + 30);
        addMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 8), 0x333333, BASE_X - 500, BASE_Y + 2, BASE_Z + 30);
        addMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 8), 0x333333, BASE_X - 450, BASE_Y + 2, BASE_Z + 30);
        addMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 8), 0x333333, BASE_X - 400, BASE_Y + 2, BASE_Z + 30);
        addMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 8), 0x333333, BASE_X - 350, BASE_Y + 2, BASE_Z + 328);
        addMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 8), 0x333333, BASE_X - 300, BASE_Y + 2, BASE_Z + 328);
        // Lamp posts along dock road
        addMesh(new THREE.CylinderGeometry(0.5, 0.7, 12, 6), 0x444444, BASE_X - 600, BASE_Y + 6, BASE_Z - 15);
        addMesh(new THREE.SphereGeometry(1.5, 6, 6), 0xFFFFAA, BASE_X - 600, BASE_Y + 13, BASE_Z - 15);
        addMesh(new THREE.CylinderGeometry(0.5, 0.7, 12, 6), 0x444444, BASE_X - 400, BASE_Y + 6, BASE_Z - 15);
        addMesh(new THREE.SphereGeometry(1.5, 6, 6), 0xFFFFAA, BASE_X - 400, BASE_Y + 6, BASE_Z - 15);
        addMesh(new THREE.CylinderGeometry(0.5, 0.7, 12, 6), 0x444444, BASE_X - 200, BASE_Y + 6, BASE_Z - 15);
        addMesh(new THREE.SphereGeometry(1.5, 6, 6), 0xFFFFAA, BASE_X - 200, BASE_Y + 6, BASE_Z - 15);
        // Dock road surface
        addMesh(new THREE.BoxGeometry(1100, 1, 18), 0x555555, BASE_X - 100, BASE_Y + 0.8, BASE_Z - 15);
        // Quayside retaining wall / edge detail
        addMesh(new THREE.BoxGeometry(1010, 3, 5), 0x666666, BASE_X - 100, BASE_Y + 15, BASE_Z + 32);
        // Marina clubhouse / harbourmaster
        addMesh(new THREE.BoxGeometry(24, 14, 18), 0xDDCCBB, BASE_X + 420, BASE_Y + 7, BASE_Z + 180);
        addMesh(new THREE.BoxGeometry(26, 4, 20), 0xCCBBAA, BASE_X + 420, BASE_Y + 16, BASE_Z + 180);
        // Fuel jetty
        addMesh(new THREE.BoxGeometry(8, 2, 80), 0xAA9977, BASE_X + 410, BASE_Y + 2, BASE_Z + 180);
        // Signage / noticeboard post
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 8, 6), 0x664422, BASE_X - 590, BASE_Y + 4, BASE_Z - 60);
        addMesh(new THREE.BoxGeometry(10, 6, 1), 0xFFCC44, BASE_X - 590, BASE_Y + 9, BASE_Z - 60);
        // Riverside walk path
        addMesh(new THREE.BoxGeometry(600, 1, 8), 0xBBBBAA, BASE_X - 850, BASE_Y + 0.8, BASE_Z - 140);
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
