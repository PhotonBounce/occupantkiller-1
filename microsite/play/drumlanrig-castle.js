window.DrumlanrigCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 20720;
    var CY = 0;
    var CZ = 0;

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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        addMesh(mesh);
        return mesh;
    }

    function build() {
        buildCastleMainBlock();
        buildCornerTowers();
        buildCentralEntranceTower();
        buildRooftopSilhouette();
        buildHorseshoeForecourtStair();
        buildParapetBalustrade();
        buildChimneyClusters();
        buildFormalGardens();
        buildEstateParkland();
        buildRiverNith();
        buildCastleCourtyard();
        buildStableBlock();
        buildCycleHub();
        buildSanquharArea();
    }

    function buildCastleMainBlock() {
        // Main rectangular body of the castle — pink sandstone
        makeBox(80, 30, 70, 0xCD5C5C, 0, 15, 0);

        // Secondary rear wing
        makeBox(60, 25, 20, 0xC85050, 0, 12, -45);

        // Front facade facing south — slightly projecting face
        makeBox(82, 32, 4, 0xD06060, 0, 16, 35);

        // Upper storey string course band
        makeBox(84, 3, 72, 0xBE5050, 0, 26, 0);

        // Window bays — front facade
        makeBox(8, 10, 3, 0xA04040, -28, 20, 37);
        makeBox(8, 10, 3, 0xA04040, -10, 20, 37);
        makeBox(8, 10, 3, 0xA04040, 10, 20, 37);
        makeBox(8, 10, 3, 0xA04040, 28, 20, 37);

        // Window bays — upper floor front
        makeBox(6, 8, 3, 0xA04040, -28, 30, 37);
        makeBox(6, 8, 3, 0xA04040, -10, 30, 37);
        makeBox(6, 8, 3, 0xA04040, 10, 30, 37);
        makeBox(6, 8, 3, 0xA04040, 28, 30, 37);

        // Window bays — side elevations (east)
        makeBox(3, 8, 8, 0xA04040, 40, 20, 10);
        makeBox(3, 8, 8, 0xA04040, 40, 20, -10);
        makeBox(3, 8, 8, 0xA04040, 40, 20, -28);

        // Window bays — side elevations (west)
        makeBox(3, 8, 8, 0xA04040, -40, 20, 10);
        makeBox(3, 8, 8, 0xA04040, -40, 20, -10);
        makeBox(3, 8, 8, 0xA04040, -40, 20, -28);
    }

    function buildCornerTowers() {
        // Four round corner towers — Scots Baronial style
        // NE tower
        makeCyl(9, 9, 38, 16, 0xC85858, 38, 19, -32);
        // NW tower
        makeCyl(9, 9, 38, 16, 0xC85858, -38, 19, -32);
        // SE tower
        makeCyl(9, 9, 38, 16, 0xC85858, 38, 19, 32);
        // SW tower
        makeCyl(9, 9, 38, 16, 0xC85858, -38, 19, 32);

        // Battlements on top of each tower — corbelled box features
        makeBox(20, 4, 20, 0xBE5050, 38, 39, -32);
        makeBox(20, 4, 20, 0xBE5050, -38, 39, -32);
        makeBox(20, 4, 20, 0xBE5050, 38, 39, 32);
        makeBox(20, 4, 20, 0xBE5050, -38, 39, 32);

        // Cupola domes on corner towers — hemisphere-style sphere tops
        makeSphere(9, 16, 8, 0x8B3A3A, 38, 42, -32);
        makeSphere(9, 16, 8, 0x8B3A3A, -38, 42, -32);
        makeSphere(9, 16, 8, 0x8B3A3A, 38, 42, 32);
        makeSphere(9, 16, 8, 0x8B3A3A, -38, 42, 32);

        // Decorative ball finials atop cupolas
        makeSphere(2, 8, 8, 0x5A2020, 38, 51, -32);
        makeSphere(2, 8, 8, 0x5A2020, -38, 51, -32);
        makeSphere(2, 8, 8, 0x5A2020, 38, 51, 32);
        makeSphere(2, 8, 8, 0x5A2020, -38, 51, 32);
    }

    function buildCentralEntranceTower() {
        // Central projecting entrance tower — taller than main block
        makeBox(20, 44, 16, 0xD06565, 0, 22, 38);

        // Entrance arch base
        makeBox(10, 8, 4, 0x8B3A3A, 0, 4, 46);

        // Entrance tower upper decorative stage
        makeBox(22, 6, 18, 0xC05050, 0, 45, 38);

        // Entrance tower crowning pediment
        makeCone(12, 10, 4, 0xB04848, 0, 52, 38);

        // Flanking pilasters on entrance tower
        makeBox(3, 38, 3, 0xB84848, -9, 22, 45);
        makeBox(3, 38, 3, 0xB84848, 9, 22, 45);

        // Clock / heraldic panel in entrance tower
        makeCyl(4, 4, 2, 16, 0xF0E0A0, 0, 38, 47);

        // Entrance steps landing platform
        makeBox(20, 3, 8, 0xD2B48C, 0, 1, 50);
    }

    function buildRooftopSilhouette() {
        // Multiple turret spires along roof ridge — Scots Baronial skyline
        makeCone(4, 16, 8, 0x7A2E2E, -30, 46, 10);
        makeCone(4, 16, 8, 0x7A2E2E, -20, 46, 10);
        makeCone(4, 16, 8, 0x7A2E2E, 0, 46, 10);
        makeCone(4, 16, 8, 0x7A2E2E, 20, 46, 10);
        makeCone(4, 16, 8, 0x7A2E2E, 30, 46, 10);

        // Rear roof spires
        makeCone(3, 12, 8, 0x7A2E2E, -25, 44, -15);
        makeCone(3, 12, 8, 0x7A2E2E, 0, 44, -15);
        makeCone(3, 12, 8, 0x7A2E2E, 25, 44, -15);

        // Ball finials at spire bases
        makeSphere(1.5, 8, 8, 0x5A2020, -30, 38, 10);
        makeSphere(1.5, 8, 8, 0x5A2020, 30, 38, 10);
        makeSphere(1.5, 8, 8, 0x5A2020, 0, 38, 10);

        // Dormer window boxes projecting from roof slopes
        makeBox(7, 6, 5, 0xC05050, -20, 36, 36);
        makeBox(7, 6, 5, 0xC05050, 0, 36, 36);
        makeBox(7, 6, 5, 0xC05050, 20, 36, 36);

        // Dormer pediment cones
        makeCone(4, 8, 4, 0x9A3838, -20, 42, 36);
        makeCone(4, 8, 4, 0x9A3838, 0, 42, 36);
        makeCone(4, 8, 4, 0x9A3838, 20, 42, 36);
    }

    function buildHorseshoeForecourtStair() {
        // Celebrated horseshoe double staircase descending from entrance
        // Left arm of stair — stepped segments
        makeBox(6, 3, 4, 0xD2B48C, -10, 2, 58);
        makeBox(6, 2, 4, 0xD2B48C, -14, 1, 62);
        makeBox(6, 1, 4, 0xD2B48C, -16, 0, 66);

        // Right arm of stair
        makeBox(6, 3, 4, 0xD2B48C, 10, 2, 58);
        makeBox(6, 2, 4, 0xD2B48C, 14, 1, 62);
        makeBox(6, 1, 4, 0xD2B48C, 16, 0, 66);

        // Balustrade piers on stair arms
        makeCyl(1, 1, 5, 8, 0xBEA880, -10, 5, 58);
        makeCyl(1, 1, 5, 8, 0xBEA880, 10, 5, 58);
        makeCyl(1, 1, 5, 8, 0xBEA880, -14, 4, 62);
        makeCyl(1, 1, 5, 8, 0xBEA880, 14, 4, 62);

        // Stair ball finials
        makeSphere(1.2, 8, 8, 0xA08060, -10, 8, 58);
        makeSphere(1.2, 8, 8, 0xA08060, 10, 8, 58);

        // Forecourt landing at base of stair
        makeBox(36, 1, 18, 0xC8A878, 0, 0, 68);

        // Gatepiers to forecourt
        makeBox(4, 12, 4, 0xBE9A6A, -20, 6, 78);
        makeBox(4, 12, 4, 0xBE9A6A, 20, 6, 78);

        // Cone caps on gatepiers
        makeCone(3, 5, 8, 0x8B6914, -20, 14, 78);
        makeCone(3, 5, 8, 0x8B6914, 20, 14, 78);
    }

    function buildParapetBalustrade() {
        // Roofline parapet balustrade across main block front
        makeBox(80, 4, 3, 0xBE5050, 0, 32, 35);
        // Baluster spacing posts
        makeBox(2, 6, 2, 0xB04848, -35, 32, 35);
        makeBox(2, 6, 2, 0xB04848, -25, 32, 35);
        makeBox(2, 6, 2, 0xB04848, -15, 32, 35);
        makeBox(2, 6, 2, 0xB04848, -5, 32, 35);
        makeBox(2, 6, 2, 0xB04848, 5, 32, 35);
        makeBox(2, 6, 2, 0xB04848, 15, 32, 35);
        makeBox(2, 6, 2, 0xB04848, 25, 32, 35);
        makeBox(2, 6, 2, 0xB04848, 35, 32, 35);

        // Rear parapet
        makeBox(80, 4, 3, 0xBE5050, 0, 32, -35);
    }

    function buildChimneyClusters() {
        // Tall stone chimneys — characteristic Scots feature
        makeCyl(2, 2, 14, 8, 0x9A4040, -25, 45, -5);
        makeCyl(2, 2, 14, 8, 0x9A4040, -22, 45, -5);
        makeCyl(2, 2, 14, 8, 0x9A4040, 22, 45, -5);
        makeCyl(2, 2, 14, 8, 0x9A4040, 25, 45, -5);
        // Chimney caps
        makeCyl(3, 2, 2, 8, 0x7A3030, -25, 52, -5);
        makeCyl(3, 2, 2, 8, 0x7A3030, -22, 52, -5);
        makeCyl(3, 2, 2, 8, 0x7A3030, 22, 52, -5);
        makeCyl(3, 2, 2, 8, 0x7A3030, 25, 52, -5);
        // Additional rear chimneys
        makeCyl(2, 2, 10, 8, 0x9A4040, 0, 42, -45);
        makeCyl(2, 2, 10, 8, 0x9A4040, -10, 42, -45);
        makeCyl(3, 2, 2, 8, 0x7A3030, 0, 47, -45);
        makeCyl(3, 2, 2, 8, 0x7A3030, -10, 47, -45);
    }

    function buildFormalGardens() {
        // Victorian parterre terraces — below the castle to the south
        // Upper terrace
        makeBox(120, 2, 30, 0x4A7C3F, 0, -1, 120);
        // Lower terrace
        makeBox(140, 2, 30, 0x4A7C3F, 0, -3, 160);
        // Third terrace
        makeBox(160, 2, 30, 0x3D6B30, 0, -5, 200);

        // Terrace retaining walls
        makeBox(120, 4, 3, 0xD2B48C, 0, 0, 105);
        makeBox(140, 4, 3, 0xD2B48C, 0, -2, 145);

        // Parterre box hedge borders — small dark boxes
        makeBox(40, 2, 2, 0x2E5924, -30, 0, 115);
        makeBox(40, 2, 2, 0x2E5924, 30, 0, 115);
        makeBox(2, 2, 26, 0x2E5924, -50, 0, 118);
        makeBox(2, 2, 26, 0x2E5924, 50, 0, 118);

        // Formal garden path
        makeBox(6, 1, 80, 0xC8B89A, 0, -1, 150);

        // Yew topiary balls
        makeSphere(4, 8, 8, 0x1E4A1A, -20, 1, 110);
        makeSphere(4, 8, 8, 0x1E4A1A, 20, 1, 110);
        makeSphere(4, 8, 8, 0x1E4A1A, -20, 1, 130);
        makeSphere(4, 8, 8, 0x1E4A1A, 20, 1, 130);

        // Urn on plinth — garden ornament
        makeCyl(3, 2, 5, 8, 0xD2B48C, 0, 2, 100);
        makeSphere(3, 8, 8, 0xC8A878, 0, 7, 100);
    }

    function buildEstateParkland() {
        // Douglas family estate woodlands surrounding the castle
        // Tree clusters — cones for conifers, spheres for broadleaf
        makeCone(10, 25, 8, 0x3D6B30, -90, 12, -60);
        makeCone(10, 25, 8, 0x3D6B30, -110, 12, -30);
        makeCone(10, 25, 8, 0x3D6B30, -100, 12, 10);
        makeCone(8, 20, 8, 0x3D6B30, -130, 10, 50);
        makeCone(10, 25, 8, 0x3D6B30, 90, 12, -60);
        makeCone(10, 25, 8, 0x3D6B30, 110, 12, -30);
        makeCone(10, 25, 8, 0x3D6B30, 100, 12, 10);

        // Broadleaf park trees (spherical crowns)
        makeSphere(8, 8, 8, 0x3D6B30, -70, 10, 80);
        makeSphere(8, 8, 8, 0x3D6B30, 70, 10, 80);
        makeSphere(10, 8, 8, 0x2E5924, -60, 12, -80);
        makeSphere(10, 8, 8, 0x2E5924, 60, 12, -80);

        // Tree trunks for parkland trees
        makeCyl(2, 2, 12, 6, 0x5C3D2E, -70, 6, 80);
        makeCyl(2, 2, 12, 6, 0x5C3D2E, 70, 6, 80);
        makeCyl(2, 2, 14, 6, 0x5C3D2E, -60, 7, -80);
        makeCyl(2, 2, 14, 6, 0x5C3D2E, 60, 7, -80);

        // Woodland estate drive — approach road
        makeBox(8, 1, 100, 0xC8B89A, 0, 0, -120);

        // Estate boundary wall segments
        makeBox(60, 5, 3, 0xA89070, -120, 2, 0);
        makeBox(60, 5, 3, 0xA89070, 120, 2, 0);
    }

    function buildRiverNith() {
        // River Nith valley below the castle in the landscape
        // Main river channel
        makeBox(20, 2, 300, 0x006994, -200, -8, 0);
        // River banks
        makeBox(30, 3, 300, 0x4A6741, -215, -9, 0);
        makeBox(30, 3, 300, 0x4A6741, -185, -9, 0);
        // River valley meadows
        makeBox(80, 2, 300, 0x5C7A50, -260, -12, 0);
        // Small tributary burn
        makeBox(6, 1, 80, 0x007A99, -160, -5, -60);
        // Stone bridge over burn
        makeBox(10, 4, 8, 0xA89070, -160, -3, -40);
        makeCyl(3, 3, 8, 8, 0xA89070, -157, -3, -40);
        makeCyl(3, 3, 8, 8, 0xA89070, -163, -3, -40);
    }

    function buildCastleCourtyard() {
        // Inner courtyard behind the horseshoe entrance
        makeBox(60, 1, 40, 0xC0A882, 0, 0, -10);
        // Courtyard well or fountain
        makeCyl(4, 4, 4, 12, 0xA89070, 0, 2, -10);
        makeSphere(3, 8, 8, 0x006994, 0, 6, -10);
        // Courtyard paving edge
        makeBox(62, 1, 3, 0xB09870, 0, 0, 10);
        makeBox(62, 1, 3, 0xB09870, 0, 0, -30);
        makeBox(3, 1, 40, 0xB09870, 29, 0, -10);
        makeBox(3, 1, 40, 0xB09870, -29, 0, -10);
    }

    function buildStableBlock() {
        // Stable courtyard to east side of castle
        makeBox(50, 12, 30, 0xC8A870, 90, 6, -20);
        // Stable archway
        makeBox(10, 10, 4, 0xBE9860, 90, 5, -5);
        makeCyl(5, 5, 2, 16, 0xAA8A50, 90, 11, -5);
        // Clock tower on stables
        makeCyl(4, 4, 14, 8, 0xC0A060, 90, 12, -20);
        makeCone(4, 8, 8, 0x8B6914, 90, 20, -20);
        // Stable windows
        makeBox(4, 5, 2, 0x8B6914, 80, 8, -8);
        makeBox(4, 5, 2, 0x8B6914, 100, 8, -8);
    }

    function buildCycleHub() {
        // Drumlanrig is famous as a mountain biking centre
        // Cycle hub building
        makeBox(25, 8, 18, 0x8B7355, 60, 4, 80);
        // Bike storage racks — series of thin boxes
        makeBox(1, 5, 12, 0x555555, 50, 3, 80);
        makeBox(1, 5, 12, 0x555555, 52, 3, 80);
        makeBox(1, 5, 12, 0x555555, 54, 3, 80);
        // Cycle trail marker post
        makeCyl(0.5, 0.5, 8, 6, 0xFFAA00, 70, 4, 90);
        makeSphere(1.5, 6, 6, 0xFFAA00, 70, 9, 90);
        // Trail surface
        makeBox(6, 1, 60, 0x8B7355, 80, 0, 110);
    }

    function buildSanquharArea() {
        // Sanquhar Castle ruins — approximately 1km distant (scaled offset)
        var sx = 260;
        var sz = -180;
        // Ruined castle wall fragments
        makeBox(20, 10, 3, 0x9A8070, sx, 5, sz);
        makeBox(3, 14, 20, 0x9A8070, sx + 8, 7, sz + 8);
        makeBox(3, 8, 15, 0x9A8070, sx - 8, 4, sz + 5);
        // Ruined tower stump
        makeCyl(6, 7, 12, 12, 0x8A7060, sx, 6, sz + 15);

        // Sanquhar Tolbooth (world's oldest post office / tolbooth)
        var tx = 280;
        var tz = -220;
        makeBox(14, 14, 10, 0xC8B89A, tx, 7, tz);
        // Tolbooth tower steeple
        makeCyl(3, 3, 10, 8, 0xBEAA90, tx, 18, tz);
        makeCone(3, 10, 8, 0x7A6A50, tx, 28, tz);
        // Tolbooth arched entry
        makeBox(5, 7, 3, 0xAA9A80, tx, 4, tz + 6);
        // Small town buildings near tolbooth
        makeBox(10, 8, 8, 0xD2C8AA, tx + 20, 4, tz);
        makeBox(8, 7, 8, 0xC8BE9A, tx - 20, 4, tz);
        makeBox(12, 9, 10, 0xD0C0A0, tx + 10, 4, tz - 20);
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
