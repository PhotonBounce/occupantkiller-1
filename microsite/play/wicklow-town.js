window.WicklowTown = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18680;
    var OY = 0;
    var OZ = 0;

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
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildIrishSea();
        buildWicklowTown();
        buildMarketSquare();
        buildChurch();
        buildBlackCastleRuins();
        buildWicklowHarbour();
        buildWicklowMountains();
        buildNationalPark();
        buildWicklowGaol();
        buildBrittasBay();
        buildValeOfAvoca();
        buildThomasMooreStatue();
    }

    function buildGround() {
        // Main ground plane built from large flat boxes
        makeBox(600, 2, 600, 0x3A5F3A, 0, -1, 0);
        // Coastal cliff base
        makeBox(80, 12, 120, 0x7A6A50, 120, 4, -80);
    }

    function buildIrishSea() {
        // Irish Sea to the east — large flat blue expanse
        makeBox(400, 2, 500, 0x006994, 350, -0.5, 0);
        // Wave rows — elongated boxes rising slightly above sea surface
        makeBox(300, 1.5, 4, 0x1A7AAF, 300, 0.8, -60);
        makeBox(280, 1.2, 4, 0x1A7AAF, 310, 0.7, -20);
        makeBox(320, 1.5, 4, 0x1A7AAF, 290, 0.9, 30);
        makeBox(260, 1.2, 4, 0x1A7AAF, 320, 0.6, 80);
        makeBox(300, 1.4, 4, 0x1A7AAF, 305, 0.8, -100);
        // Sea foam strips
        makeBox(200, 0.8, 2, 0xDDEEFF, 250, 0.5, -55);
        makeBox(180, 0.8, 2, 0xDDEEFF, 260, 0.5, 35);
        // Sea horizon box to give depth
        makeBox(500, 40, 8, 0x004F6E, 400, 18, 0);
    }

    function buildWicklowTown() {
        // Georgian/Victorian streetscape — rows of terrace buildings
        // Main street north row
        makeBox(14, 12, 8, 0xCD5C5C, -60, 6, -30);
        makeBox(14, 11, 8, 0xB85050, -44, 5.5, -30);
        makeBox(14, 13, 8, 0xC85858, -28, 6.5, -30);
        makeBox(14, 10, 8, 0xCD5C5C, -12, 5, -30);
        makeBox(14, 12, 8, 0xBF5555, 4, 6, -30);
        makeBox(14, 11, 8, 0xCD5C5C, 20, 5.5, -30);

        // Main street south row (facing north row)
        makeBox(14, 12, 8, 0xC05050, -60, 6, -10);
        makeBox(14, 10, 8, 0xCD5C5C, -44, 5, -10);
        makeBox(14, 14, 8, 0xBB4E4E, -28, 7, -10);
        makeBox(14, 11, 8, 0xCD5C5C, -12, 5.5, -10);
        makeBox(14, 12, 8, 0xC85858, 4, 6, -10);
        makeBox(14, 10, 8, 0xCD5C5C, 20, 5, -10);

        // Side street eastern terrace
        makeBox(8, 10, 14, 0xC05050, 36, 5, -22);
        makeBox(8, 12, 14, 0xCD5C5C, 36, 6, -8);
        makeBox(8, 9, 14, 0xB84E4E, 36, 4.5, 6);

        // Chimney stacks on rooftops
        makeBox(1.5, 4, 1.5, 0x8B3A3A, -60, 14, -30);
        makeBox(1.5, 3, 1.5, 0x8B3A3A, -28, 16, -30);
        makeBox(1.5, 4, 1.5, 0x8B3A3A, 4, 14, -30);
        makeBox(1.5, 3.5, 1.5, 0x8B3A3A, -44, 13, -10);
        makeBox(1.5, 4, 1.5, 0x8B3A3A, -28, 17, -10);

        // Shop/pub ground floor details — darker base strips
        makeBox(14, 3, 1, 0x7A3030, -60, 1.5, -25.5);
        makeBox(14, 3, 1, 0x7A3030, -44, 1.5, -25.5);
        makeBox(14, 3, 1, 0x7A3030, -28, 1.5, -25.5);
        makeBox(14, 3, 1, 0x7A3030, -12, 1.5, -25.5);
        makeBox(14, 3, 1, 0x7A3030, 4, 1.5, -25.5);

        // Cobbled road representation — dark grey flat box
        makeBox(100, 0.5, 18, 0x555555, -20, 0.2, -20);

        // Pavement strips
        makeBox(100, 0.4, 3, 0x888888, -20, 0.2, -28);
        makeBox(100, 0.4, 3, 0x888888, -20, 0.2, -12);
    }

    function buildMarketSquare() {
        // Market square — open paved area with central feature
        makeBox(40, 0.4, 40, 0x999999, -20, 0.2, 20);
        // Market cross / monument
        makeCylinder(0.6, 0.8, 6, 8, 0xAAAAAA, -20, 3, 20);
        makeBox(4, 0.5, 4, 0x999999, -20, 0.25, 20);
        // Market stall canopy frames (flat box approximations)
        makeBox(6, 0.4, 4, 0xCC4400, -30, 4, 12);
        makeBox(6, 0.4, 4, 0x4466CC, -30, 4, 20);
        makeBox(6, 0.4, 4, 0xCC4400, -30, 4, 28);
        // Stall legs
        makeBox(0.3, 4, 0.3, 0x664422, -27.1, 2, 10.1);
        makeBox(0.3, 4, 0.3, 0x664422, -32.9, 2, 10.1);
        makeBox(0.3, 4, 0.3, 0x664422, -27.1, 2, 13.9);
        makeBox(0.3, 4, 0.3, 0x664422, -32.9, 2, 13.9);
    }

    function buildChurch() {
        // Church body — rectangular nave
        makeBox(20, 18, 36, 0xD0D0C0, -80, 9, 30);
        // Church tower base
        makeBox(8, 28, 8, 0xC8C8B8, -80, 14, 12);
        // Church spire (ConeGeometry on top of tower)
        makeCone(4, 22, 8, 0x707060, -80, 35, 12);
        // Transept wings
        makeBox(36, 14, 10, 0xD0D0C0, -80, 7, 30);
        // Arched windows suggestion — thin dark boxes inset
        makeBox(2, 6, 0.5, 0x333333, -74, 12, 12.3);
        makeBox(2, 6, 0.5, 0x333333, -86, 12, 12.3);
        // Church door
        makeBox(3, 5, 0.5, 0x553300, -80, 2.5, 48.3);
        // Graveyard wall
        makeBox(50, 2.5, 1, 0xAAAAAA, -80, 1.25, 60);
        makeBox(1, 2.5, 40, 0xAAAAAA, -55, 1.25, 48);
        makeBox(1, 2.5, 40, 0xAAAAAA, -105, 1.25, 48);
        // Gravestones
        makeBox(1, 2, 0.4, 0x888888, -70, 1, 55);
        makeBox(1, 1.8, 0.4, 0x888888, -75, 0.9, 55);
        makeBox(1, 2.2, 0.4, 0x888888, -85, 1.1, 55);
        makeBox(1, 1.6, 0.4, 0x888888, -90, 0.8, 55);
    }

    function buildBlackCastleRuins() {
        // Sea cliff base under castle
        makeBox(60, 20, 50, 0x606060, 140, 8, -90);
        // Main ruined tower — tall but broken top (irregular heights via separate boxes)
        makeBox(12, 30, 12, 0x808080, 140, 15, -100);
        // Ruined wall stubs — jagged height variety
        makeBox(20, 18, 3, 0x787878, 125, 9, -92);
        makeBox(20, 12, 3, 0x707070, 125, 6, -108);
        makeBox(3, 22, 18, 0x808080, 118, 11, -100);
        makeBox(3, 14, 18, 0x7A7A7A, 160, 7, -100);
        // Ruined wall connecting pieces
        makeBox(14, 8, 3, 0x808080, 147, 4, -92);
        // Crumbled rubble piles at base
        makeBox(8, 3, 6, 0x707070, 132, 1.5, -95);
        makeBox(6, 2, 4, 0x696969, 152, 1, -105);
        makeBox(4, 2.5, 5, 0x787878, 130, 1.25, -108);
        // Sea stacks — CylinderGeometry columns rising from sea
        makeCylinder(3, 4, 18, 7, 0x6A6A6A, 175, 8, -110);
        makeCylinder(2, 3, 14, 6, 0x707070, 185, 6, -90);
        makeCylinder(2.5, 3.5, 20, 7, 0x686868, 168, 9, -125);
        // Window opening in ruined tower — dark inset box
        makeBox(2.5, 3, 0.5, 0x222222, 140, 18, -93.8);
        makeBox(2.5, 3, 0.5, 0x222222, 140, 24, -93.8);
    }

    function buildWicklowHarbour() {
        // Stone pier — long flat box
        makeBox(120, 3, 14, 0x696969, 80, 1.5, -40);
        // Pier wall parapet
        makeBox(120, 2, 2, 0x606060, 80, 3.5, -33);
        // Inner harbour wall
        makeBox(60, 3, 14, 0x696969, 50, 1.5, -60);
        // Lighthouse tower
        makeCylinder(3, 3.5, 24, 12, 0xF0F0F0, 135, 12, -35);
        // Lighthouse lantern room
        makeCylinder(3.8, 3.8, 3, 12, 0xAA2222, 135, 25.5, -35);
        // Lighthouse cone roof
        makeCone(3.5, 6, 12, 0x333333, 135, 30, -35);
        // Fishing boats — elongated boxes representing hulls
        makeBox(10, 3, 4, 0x4444AA, 70, 1, -44);
        makeBox(12, 3, 4, 0x226622, 55, 1, -44);
        makeBox(8, 2.5, 3.5, 0xAA6622, 40, 0.75, -44);
        // Boat masts
        makeCylinder(0.2, 0.2, 14, 4, 0x8B6914, 70, 8, -44);
        makeCylinder(0.2, 0.2, 16, 4, 0x8B6914, 55, 9, -44);
        makeCylinder(0.2, 0.2, 12, 4, 0x8B6914, 40, 7, -44);
        // Harbour warehouse
        makeBox(24, 10, 14, 0x888880, 65, 5, -58);
        makeBox(24, 2, 16, 0x666660, 65, 11, -58);
        // Bollards on pier
        makeCylinder(0.4, 0.5, 2, 6, 0x555555, 100, 2, -38);
        makeCylinder(0.4, 0.5, 2, 6, 0x555555, 110, 2, -38);
        makeCylinder(0.4, 0.5, 2, 6, 0x555555, 120, 2, -38);
    }

    function buildWicklowMountains() {
        // Background mountain mass — large rounded box-stack shapes
        // Main mountain ridge
        makeBox(300, 80, 100, 0x556B2F, -100, 38, -250);
        makeBox(200, 100, 80, 0x4A6028, -50, 48, -280);
        // Lugnaquilla peak — tallest point (925m, tallest in Leinster)
        makeBox(60, 130, 60, 0x4A6028, -60, 63, -310);
        makeSphere(36, 8, 6, 0x506830, -60, 126, -310);
        // Secondary ridges
        makeBox(150, 70, 80, 0x557030, -200, 33, -240);
        makeBox(120, 60, 70, 0x4E6828, 50, 28, -260);
        makeBox(180, 55, 90, 0x506828, -160, 25, -270);
        // Foothills
        makeBox(200, 35, 80, 0x5A7035, -80, 15, -200);
        makeBox(160, 28, 70, 0x556B2F, 0, 12, -190);
        makeBox(140, 30, 80, 0x557232, -170, 13, -195);
        // Mountain snow cap suggestion (pale top)
        makeBox(30, 8, 30, 0xDDDDCC, -60, 130, -310);
        // Dark heather on lower slopes
        makeBox(80, 10, 60, 0x4A3F5C, -100, 5, -190);
        makeBox(60, 8, 50, 0x4A3F5C, -40, 4, -185);
    }

    function buildNationalPark() {
        // Open moorland stretches
        makeBox(200, 1, 120, 0x8B4513, -120, 0.5, -160);
        makeBox(160, 1, 100, 0x7A3E12, -200, 0.5, -140);
        // Heather patches — slightly raised tinted boxes
        makeBox(20, 1.5, 15, 0x6B3FA0, -100, 0.8, -150);
        makeBox(25, 1.5, 18, 0x5E3590, -130, 0.8, -165);
        makeBox(18, 1.5, 12, 0x6B3FA0, -155, 0.8, -145);
        makeBox(22, 1.5, 16, 0x5E3590, -80, 0.8, -175);
        // Mountain loughs — flat blue boxes recessed in moorland
        makeBox(40, 0.5, 25, 0x1E6BA8, -140, 0.3, -158);
        makeBox(30, 0.5, 20, 0x1E6BA8, -90, 0.3, -170);
        // Lough shimmer highlight
        makeBox(36, 0.3, 22, 0x3A90CC, -140, 0.4, -158);
        // Dry stone walls of upland farms
        makeBox(60, 1.5, 1, 0x9A8A7A, -140, 0.7, -135);
        makeBox(1, 1.5, 40, 0x9A8A7A, -110, 0.7, -135);
        makeBox(60, 1.5, 1, 0x9A8A7A, -180, 0.7, -150);
        // Farm building on moorland
        makeBox(12, 5, 8, 0xCCCCBB, -160, 2.5, -135);
        makeBox(13, 1, 9, 0x888877, -160, 6, -135);
    }

    function buildWicklowGaol() {
        // Main prison block — imposing Georgian grey
        makeBox(40, 18, 30, 0x808080, -120, 9, 60);
        // Second cellblock wing
        makeBox(30, 16, 14, 0x787878, -135, 8, 76);
        // Guard towers at corners
        makeBox(6, 22, 6, 0x808080, -100, 11, 45);
        makeBox(6, 22, 6, 0x808080, -140, 11, 45);
        makeBox(6, 22, 6, 0x808080, -100, 11, 75);
        makeBox(6, 22, 6, 0x808080, -140, 11, 75);
        // Guard tower battlements
        makeBox(7, 2, 7, 0x707070, -100, 23, 45);
        makeBox(7, 2, 7, 0x707070, -140, 23, 45);
        makeBox(7, 2, 7, 0x707070, -100, 23, 75);
        makeBox(7, 2, 7, 0x707070, -140, 23, 75);
        // Prison outer wall
        makeBox(50, 6, 1, 0x909090, -120, 3, 42);
        makeBox(50, 6, 1, 0x909090, -120, 3, 80);
        makeBox(1, 6, 38, 0x909090, -95, 3, 61);
        makeBox(1, 6, 38, 0x909090, -145, 3, 61);
        // Main gate
        makeBox(8, 8, 2, 0x707070, -120, 4, 42);
        makeBox(5, 5, 2, 0x222222, -120, 3.5, 41.5);
        // Barred windows — dark inset rectangles
        makeBox(1.5, 2, 0.4, 0x222222, -105, 12, 45.2);
        makeBox(1.5, 2, 0.4, 0x222222, -112, 12, 45.2);
        makeBox(1.5, 2, 0.4, 0x222222, -119, 12, 45.2);
        makeBox(1.5, 2, 0.4, 0x222222, -126, 12, 45.2);
        makeBox(1.5, 2, 0.4, 0x222222, -133, 12, 45.2);
    }

    function buildBrittasBay() {
        // Sandy beach — flat warm-coloured expanse to south
        makeBox(200, 0.8, 60, 0xF5DEB3, 60, 0.3, 100);
        // Sand dune ridges — elongated low boxes
        makeBox(60, 4, 10, 0xEDD9A0, 30, 2, 95);
        makeBox(80, 5, 12, 0xEDD9A0, 80, 2.5, 92);
        makeBox(50, 3.5, 8, 0xEDD9A0, 120, 1.75, 98);
        makeBox(70, 6, 14, 0xE0CC88, 55, 3, 88);
        // Dune grass tufts — thin vertical boxes
        makeBox(0.5, 2, 0.5, 0x888833, 30, 3, 93);
        makeBox(0.5, 2.5, 0.5, 0x8B8B2F, 35, 3.5, 91);
        makeBox(0.5, 1.8, 0.5, 0x888833, 25, 3, 96);
        makeBox(0.5, 2.2, 0.5, 0x8B8B2F, 80, 4, 90);
        makeBox(0.5, 2, 0.5, 0x888833, 120, 3, 95);
        // Shallows — lighter water strip at beach edge
        makeBox(200, 0.5, 20, 0x55AACC, 60, 0.2, 78);
        // Beach carpark access track
        makeBox(80, 0.5, 8, 0xAA9977, 0, 0.3, 104);
    }

    function buildValeOfAvoca() {
        // Wooded valley — green floor
        makeBox(100, 0.8, 50, 0x228B22, -200, 0.3, 80);
        makeBox(80, 0.8, 40, 0x1E7A1E, -240, 0.3, 90);
        // Two river channels meeting — Avonmore and Avonbeg
        makeBox(80, 0.5, 6, 0x006994, -190, 0.4, 75);
        makeBox(60, 0.5, 6, 0x006994, -220, 0.4, 88);
        // Junction confluence pool
        makeBox(12, 0.5, 12, 0x0077AA, -210, 0.4, 80);
        // Valley tree clusters — spheres on cylinders
        makeCylinder(0.5, 0.6, 8, 5, 0x5C3A1E, -195, 4, 78);
        makeSphere(5, 6, 5, 0x1A6B1A, -195, 10, 78);
        makeCylinder(0.5, 0.6, 7, 5, 0x5C3A1E, -205, 3.5, 85);
        makeSphere(4.5, 6, 5, 0x226622, -205, 9, 85);
        makeCylinder(0.5, 0.6, 9, 5, 0x5C3A1E, -215, 4.5, 72);
        makeSphere(5.5, 6, 5, 0x1E7A1E, -215, 12, 72);
        makeCylinder(0.5, 0.6, 7, 5, 0x5C3A1E, -225, 3.5, 92);
        makeSphere(4, 6, 5, 0x228B22, -225, 8.5, 92);
        makeCylinder(0.5, 0.6, 8, 5, 0x5C3A1E, -235, 4, 80);
        makeSphere(5, 6, 5, 0x1A6B1A, -235, 10.5, 80);
        // Valley side slopes
        makeBox(100, 20, 20, 0x2E6B2E, -200, 10, 65);
        makeBox(100, 20, 20, 0x2A6228, -200, 10, 105);
        // Avoca Village suggestion — small cluster of buildings
        makeBox(8, 6, 7, 0xCC9966, -245, 3, 78);
        makeBox(8, 5, 7, 0xBB8855, -255, 2.5, 82);
        makeBox(10, 7, 8, 0xCC9966, -250, 3.5, 70);
    }

    function buildThomasMooreStatue() {
        // Plinth / pedestal
        makeBox(3, 1.5, 3, 0xAAAAAA, -218, 0.75, 80);
        makeBox(2.5, 1, 2.5, 0xB0B0B0, -218, 2, 80);
        // Statue figure — silver-grey approximation using cylinders and boxes
        // Torso
        makeBox(1.2, 2.5, 0.8, 0xC0C0C0, -218, 4.25, 80);
        // Head
        makeSphere(0.55, 6, 5, 0xC0C0C0, -218, 6, 80);
        // Left arm
        makeBox(0.35, 1.8, 0.35, 0xB8B8B8, -218.85, 4.5, 80);
        // Right arm raised (poet gesturing)
        makeBox(0.35, 1.8, 0.35, 0xB8B8B8, -217.15, 5.2, 80);
        // Legs
        makeBox(0.4, 1.5, 0.4, 0xBBBBBB, -218.3, 2.25, 80);
        makeBox(0.4, 1.5, 0.4, 0xBBBBBB, -217.7, 2.25, 80);
        // Informational notice board near statue
        makeBox(2, 1.5, 0.2, 0x8B6914, -215, 1.5, 80);
        makeCylinder(0.1, 0.1, 1.5, 4, 0x6B5010, -215.5, 0.75, 80);
        makeCylinder(0.1, 0.1, 1.5, 4, 0x6B5010, -214.5, 0.75, 80);
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
