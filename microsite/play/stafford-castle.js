window.StaffordCastle = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 21560;
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
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function build() {
        buildCastleHill();
        buildKeep();
        buildCurtainWalls();
        buildGatehouse();
        buildCornerTowers();
        buildCountryside();
        buildRiverSow();
        buildStaffordTown();
        buildAncientHighHouse();
        buildIzaakWaltonCottage();
        buildShugboroughEstate();
        buildPotteryKilns();
        buildCannockChase();
    }

    function buildCastleHill() {
        // Main motte mound — large earthwork hill
        makeCyl(28, 36, 22, 12, 0x7A6645, 0, 11, 0);
        // Outer motte slope base
        makeCyl(44, 52, 8, 12, 0x7A6645, 0, 4, 0);
        // Bailey earthwork platform — offset to north
        makeBox(80, 6, 60, 0x7A6645, 0, 3, -60);
        // Bailey inner level
        makeBox(70, 2, 50, 0x8B7355, 0, 6, -60);
        // Motte-bailey causeway
        makeBox(10, 4, 20, 0x7A6645, 0, 8, -32);
        // Outer earthwork ditch ring
        makeCyl(56, 58, 4, 16, 0x5C4A2A, 0, 0, 0);
    }

    function buildKeep() {
        // Main keep — ruined rectangular Norman tower
        makeBox(18, 24, 14, 0x8B7355, 0, 34, 0);
        // Keep north wall (still standing taller)
        makeBox(18, 10, 2, 0x7A6645, 0, 46, -6);
        // Keep east wall fragment
        makeBox(2, 14, 14, 0x7A6645, 8, 39, 0);
        // Keep west wall fragment (lower, more ruined)
        makeBox(2, 8, 10, 0x8B7355, -8, 35, 2);
        // Keep interior rubble pile
        makeBox(10, 4, 8, 0x6B5B45, 0, 24, 0);
        // Keep basement floor remains
        makeBox(14, 1, 10, 0x6B5B45, 0, 22, 0);
        // Keep battlements (north)
        makeBox(18, 3, 2, 0x8B7355, 0, 52, -6);
        // Parapet merlons on north wall
        makeBox(3, 3, 2, 0x8B7355, -6, 55, -6);
        makeBox(3, 3, 2, 0x8B7355, 0, 55, -6);
        makeBox(3, 3, 2, 0x8B7355, 6, 55, -6);
        // Keep stair turret
        makeCyl(2.5, 2.5, 16, 8, 0x8B7355, -7, 40, -5);
        // Stair turret cap
        makeCone(3, 5, 8, 0x6B5B45, -7, 49, -5);
    }

    function buildCurtainWalls() {
        // North curtain wall
        makeBox(60, 8, 3, 0x8B7355, 0, 25, -28);
        // South curtain wall (more ruined, shorter)
        makeBox(55, 5, 3, 0x8B7355, 0, 23, 25);
        // East curtain wall
        makeBox(3, 8, 50, 0x8B7355, 28, 25, -3);
        // West curtain wall
        makeBox(3, 6, 45, 0x8B7355, -28, 24, -3);
        // Wall walk crenellations north
        makeBox(6, 2, 2, 0x7A6645, -20, 30, -28);
        makeBox(6, 2, 2, 0x7A6645, -8, 30, -28);
        makeBox(6, 2, 2, 0x7A6645, 8, 30, -28);
        makeBox(6, 2, 2, 0x7A6645, 20, 30, -28);
        // Wall walk crenellations east
        makeBox(2, 2, 6, 0x7A6645, 28, 29, -18);
        makeBox(2, 2, 6, 0x7A6645, 28, 29, -6);
        makeBox(2, 2, 6, 0x7A6645, 28, 29, 6);
    }

    function buildGatehouse() {
        // Gatehouse left tower
        makeBox(8, 14, 8, 0x8B7355, -10, 28, -30);
        // Gatehouse right tower
        makeBox(8, 14, 8, 0x8B7355, 10, 28, -30);
        // Gatehouse arch lintel
        makeBox(8, 3, 3, 0x6B5B45, 0, 29, -30);
        // Gatehouse passage floor
        makeBox(8, 1, 8, 0x7A6645, 0, 22, -30);
        // Gatehouse wall above arch
        makeBox(8, 5, 2, 0x8B7355, 0, 35, -30);
        // Gatehouse battlements
        makeBox(3, 3, 2, 0x8B7355, -4, 38, -30);
        makeBox(3, 3, 2, 0x8B7355, 4, 38, -30);
        // Gatehouse left tower conical cap
        makeCone(5, 6, 8, 0x6B5B45, -10, 36, -30);
        // Gatehouse right tower conical cap
        makeCone(5, 6, 8, 0x6B5B45, 10, 36, -30);
    }

    function buildCornerTowers() {
        // NW corner tower
        makeCyl(5, 5, 16, 10, 0x8B7355, -28, 29, -28);
        makeCone(5.5, 5, 10, 0x6B5B45, -28, 38, -28);
        // NE corner tower
        makeCyl(5, 5, 16, 10, 0x8B7355, 28, 29, -28);
        makeCone(5.5, 5, 10, 0x6B5B45, 28, 38, -28);
        // SE corner tower (more ruined)
        makeCyl(5, 5, 10, 10, 0x8B7355, 28, 26, 22);
        // SW corner tower
        makeCyl(5, 5, 12, 10, 0x8B7355, -28, 27, 22);
        makeCone(5.5, 4, 10, 0x6B5B45, -28, 34, 22);
    }

    function buildCountryside() {
        // Rolling green fields — wide flat boxes offset around castle
        makeBox(200, 2, 120, 0x6B8E23, 120, -1, 0);
        makeBox(200, 2, 120, 0x6B8E23, -120, -1, 0);
        makeBox(400, 2, 100, 0x6B8E23, 0, -1, 120);
        makeBox(400, 2, 100, 0x6B8E23, 0, -1, -130);
        // Hedgerow lines
        makeBox(80, 3, 2, 0x3B5E1A, 80, 1, 40);
        makeBox(2, 3, 60, 0x3B5E1A, 80, 1, 10);
        makeBox(60, 3, 2, 0x3B5E1A, -70, 1, 60);
        makeBox(2, 3, 40, 0x3B5E1A, -40, 1, 80);
        // Scattered trees (spheres for canopy, cylinders for trunks)
        makeSphere(6, 8, 6, 0x3A6B1A, 90, 7, 50);
        makeCyl(1, 1, 8, 6, 0x5C3A1A, 90, 4, 50);
        makeSphere(5, 8, 6, 0x3A6B1A, 110, 6, 70);
        makeCyl(1, 1, 7, 6, 0x5C3A1A, 110, 3, 70);
        makeSphere(7, 8, 6, 0x2E5A14, -100, 8, 45);
        makeCyl(1.2, 1.2, 9, 6, 0x5C3A1A, -100, 4, 45);
        makeSphere(5, 8, 6, 0x3A6B1A, -80, 6, -90);
        makeCyl(1, 1, 7, 6, 0x5C3A1A, -80, 3, -90);
        // Stone field walls (dry-stone style)
        makeBox(50, 2, 1.5, 0x9C9C8A, 60, 1, 30);
        makeBox(1.5, 2, 40, 0x9C9C8A, 110, 1, 50);
    }

    function buildRiverSow() {
        // River Sow — series of box sections winding through valley
        makeBox(200, 1, 12, 0x4682B4, 0, -1.5, 80);
        makeBox(80, 1, 12, 0x4682B4, -100, -1.5, 65);
        makeBox(12, 1, 40, 0x4682B4, -140, -1.5, 45);
        makeBox(80, 1, 12, 0x4682B4, 100, -1.5, 65);
        // River bank / flood plain
        makeBox(210, 1, 20, 0x5A7A3A, 0, -1.2, 80);
        // River stones (small boxes along bank)
        makeBox(4, 1, 3, 0xAAAAAA, 20, -1, 74);
        makeBox(3, 1, 4, 0xAAAAAA, -15, -1, 74);
        makeBox(5, 1, 3, 0xAAAAAA, 40, -1, 75);
        // Small stone bridge over river
        makeBox(14, 3, 4, 0x9C9C8A, 0, 0, 80);
        makeCyl(2, 2, 3, 8, 0x9C9C8A, -5, -1, 80);
        makeCyl(2, 2, 3, 8, 0x9C9C8A, 5, -1, 80);
    }

    function buildStaffordTown() {
        // Stafford town centre buildings — Georgian/Victorian terrace blocks
        makeBox(20, 12, 12, 0xC8B89A, -80, 6, -50);
        makeBox(20, 10, 12, 0xC8B89A, -104, 5, -50);
        makeBox(20, 14, 12, 0xC8B89A, -128, 7, -50);
        makeBox(20, 10, 12, 0xC8B89A, -80, 5, -65);
        makeBox(20, 12, 12, 0xC8B89A, -104, 6, -65);
        // Pitched roofs on town buildings
        makeCone(14, 6, 4, 0x8B7355, -80, 13, -50);
        makeCone(14, 5, 4, 0x8B7355, -104, 11, -50);
        makeCone(14, 7, 4, 0x8B7355, -128, 15, -50);
        // Church / St Mary's tower
        makeBox(8, 22, 8, 0xC8B89A, -115, 11, -80);
        makeCone(5, 10, 4, 0x8B7355, -115, 23, -80);
        // Church nave
        makeBox(18, 10, 30, 0xC8B89A, -115, 5, -68);
        // Market square paving
        makeBox(30, 0.5, 30, 0xB0A090, -95, 0.2, -55);
    }

    function buildAncientHighHouse() {
        // Ancient High House — largest timber-framed building in England
        // Cream/white plaster panels
        makeBox(10, 16, 8, 0xF5F0E8, -88, 8, -52);
        // Dark timber frame beams — vertical
        makeBox(1, 16, 1, 0x2B1A0A, -93, 8, -48);
        makeBox(1, 16, 1, 0x2B1A0A, -93, 8, -56);
        makeBox(1, 16, 1, 0x2B1A0A, -83, 8, -48);
        makeBox(1, 16, 1, 0x2B1A0A, -83, 8, -56);
        // Timber frame horizontals
        makeBox(10, 1, 1, 0x2B1A0A, -88, 2, -48);
        makeBox(10, 1, 1, 0x2B1A0A, -88, 8, -48);
        makeBox(10, 1, 1, 0x2B1A0A, -88, 14, -48);
        // Jettied upper floors (overhangs)
        makeBox(11, 5, 8.5, 0xF5F0E8, -88, 14, -52);
        makeBox(12, 5, 9, 0xF5F0E8, -88, 19, -52);
        // Gabled roof
        makeCone(7, 7, 4, 0x4A3A2A, -88, 25, -52);
        // Chimney stacks
        makeBox(2, 5, 2, 0xAA8866, -85, 28, -52);
        makeBox(2, 5, 2, 0xAA8866, -91, 28, -52);
    }

    function buildIzaakWaltonCottage() {
        // Izaak Walton's Cottage — Shallowford — 17th-century thatched cottage
        makeBox(12, 6, 8, 0xDEB887, 60, 3, -70);
        // Timber frame dark beams
        makeBox(1, 6, 1, 0x3B2010, 54, 3, -66);
        makeBox(1, 6, 1, 0x3B2010, 54, 3, -74);
        makeBox(1, 6, 1, 0x3B2010, 66, 3, -66);
        makeBox(1, 6, 1, 0x3B2010, 66, 3, -74);
        makeBox(12, 1, 1, 0x3B2010, 60, 5, -66);
        // Thatched roof — thick, rounded eaves overhang
        makeBox(14, 5, 10, 0xC8A050, 60, 9, -70);
        makeCone(8, 4, 4, 0xC8A050, 60, 12, -70);
        // Cottage chimney
        makeBox(2, 4, 2, 0xAA7744, 63, 13, -70);
        // Small garden enclosure
        makeBox(20, 1, 1, 0x5C8A1A, 60, 0.5, -80);
        makeBox(1, 1, 14, 0x5C8A1A, 70, 0.5, -73);
        // Garden shrubs
        makeSphere(2, 6, 5, 0x3A7A1A, 65, 2, -76);
        makeSphere(2, 6, 5, 0x3A7A1A, 65, 2, -72);
        // Pond (small box)
        makeBox(6, 0.5, 4, 0x4682B4, 56, 0.3, -79);
    }

    function buildShugboroughEstate() {
        // Shugborough Hall — Georgian mansion on plain to east
        makeBox(40, 12, 22, 0xF5F5DC, 150, 6, -30);
        // Portico / central columns
        makeCyl(1.2, 1.2, 12, 8, 0xEEEECC, 140, 6, -30);
        makeCyl(1.2, 1.2, 12, 8, 0xEEEECC, 143, 6, -30);
        makeCyl(1.2, 1.2, 12, 8, 0xEEEECC, 146, 6, -30);
        // Portico pediment
        makeCone(8, 5, 4, 0xEEEECC, 143, 15, -30);
        // Flanking wings
        makeBox(16, 9, 16, 0xF5F5DC, 126, 4, -30);
        makeBox(16, 9, 16, 0xF5F5DC, 174, 4, -30);
        // Mansion roof
        makeBox(40, 3, 22, 0xDDDDBB, 150, 14, -30);
        // Stable block
        makeBox(22, 8, 16, 0xEEEECC, 150, 4, -55);
        // Estate grounds — formal garden box
        makeBox(60, 0.5, 40, 0x4A7A2A, 150, 0.3, -5);
        // Formal hedges
        makeBox(50, 3, 2, 0x2E5A14, 150, 1.5, -15);
        makeBox(50, 3, 2, 0x2E5A14, 150, 1.5, 5);
    }

    function buildPotteryKilns() {
        // Staffordshire bottle kilns — on eastern horizon (Potteries area)
        // Distinctive bottle-shaped kilns using cylinders and cones
        makeCyl(4, 7, 18, 10, 0xCC7722, 220, 9, 20);
        makeCone(4, 8, 10, 0xAA5500, 220, 22, 20);
        makeCyl(1.5, 1.5, 4, 8, 0xCC7722, 220, 28, 20);

        makeCyl(4, 7, 18, 10, 0xCC7722, 235, 9, 10);
        makeCone(4, 8, 10, 0xAA5500, 235, 22, 10);
        makeCyl(1.5, 1.5, 4, 8, 0xCC7722, 235, 28, 10);

        makeCyl(3.5, 6, 16, 10, 0xBB6611, 228, 8, 30);
        makeCone(3.5, 7, 10, 0x994400, 228, 20, 30);
        makeCyl(1.2, 1.2, 3, 8, 0xBB6611, 228, 25, 30);

        // Pottery factory shed
        makeBox(30, 8, 20, 0xBB9966, 230, 4, 20);
        makeBox(30, 3, 20, 0xAA7744, 230, 9, 20);

        // Smoke haze spheres (dark grey atmosphere)
        makeSphere(10, 6, 5, 0x888888, 228, 30, 20);
        makeSphere(8, 6, 5, 0x777777, 240, 32, 10);
    }

    function buildCannockChase() {
        // Cannock Chase — dense dark pine forest on southern horizon
        // Forest floor
        makeBox(250, 2, 80, 0x3A5A2A, 0, -0.5, 180);
        // Pine trees — cylinders for trunks, cones for canopy
        makeCyl(1, 1.2, 14, 6, 0x4A3010, -60, 7, 185);
        makeCone(5, 14, 7, 0x2D4A1A, -60, 18, 185);
        makeCyl(1, 1.2, 12, 6, 0x4A3010, -40, 6, 190);
        makeCone(4.5, 13, 7, 0x2D4A1A, -40, 16, 190);
        makeCyl(1, 1.2, 16, 6, 0x4A3010, -20, 8, 182);
        makeCone(5, 15, 7, 0x2D4A1A, -20, 20, 182);
        makeCyl(1, 1.2, 13, 6, 0x4A3010, 0, 6, 195);
        makeCone(4.5, 12, 7, 0x2D4A1A, 0, 15, 195);
        makeCyl(1, 1.2, 15, 6, 0x4A3010, 20, 7, 183);
        makeCone(5, 14, 7, 0x2D4A1A, 20, 17, 183);
        makeCyl(1, 1.2, 14, 6, 0x4A3010, 40, 7, 188);
        makeCone(4.5, 13, 7, 0x2D4A1A, 40, 16, 188);
        makeCyl(1, 1.2, 12, 6, 0x4A3010, 60, 6, 192);
        makeCone(4, 12, 7, 0x2D4A1A, 60, 14, 192);
        makeCyl(1, 1.2, 16, 6, 0x4A3010, 80, 8, 184);
        makeCone(5, 15, 7, 0x2D4A1A, 80, 19, 184);
        // Chase heathland
        makeBox(250, 1, 30, 0x556B2F, 0, -0.2, 165);
        // Chase ridge skyline hills
        makeBox(80, 12, 40, 0x4A6028, -80, 6, 200);
        makeBox(80, 16, 40, 0x4A6028, 0, 8, 205);
        makeBox(80, 10, 40, 0x4A6028, 80, 5, 200);
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
