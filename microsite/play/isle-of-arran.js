window.IsleOfArran = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var ox = 20040;
        var oy = 0;
        var oz = 0;

        // =============================================
        // ISLAND GROUND BASE — Firth of Clyde sea
        // =============================================
        // Sea platform (large flat box for Firth of Clyde)
        makebox(2400, 8, 2200, 0x006994, ox, oy - 4, oz);

        // Main island ground — Isle of Arran landmass (roughly oval)
        makebox(900, 18, 700, 0x3d6b30, ox, oy + 5, oz);

        // Northern peninsula extension (Lochranza area)
        makebox(220, 14, 180, 0x3d6b30, ox - 280, oy + 3, oz - 260);

        // Southern tip of island (Pladda direction)
        makebox(200, 12, 160, 0x3d6b30, ox + 20, oy + 3, oz + 340);

        // Central highland spine — elevated ridge
        makebox(500, 30, 200, 0x4a7a3a, ox - 80, oy + 19, oz - 60);

        // Eastern coastal lowland shelf
        makebox(280, 10, 500, 0x4e8040, ox + 300, oy + 3, oz + 50);

        // Western coastal moor (Machrie Moor area)
        makebox(260, 12, 300, 0x5a7a3a, ox - 280, oy + 2, oz + 80);

        // =============================================
        // GOAT FELL — Granite mountain (874m), NE of island
        // =============================================
        // Base of mountain
        makebox(240, 60, 240, 0x6a6a6a, ox - 20, oy + 35, oz - 100);
        // Second tier
        makebox(180, 70, 180, 0x757575, ox - 20, oy + 90, oz - 100);
        // Third tier
        makebox(130, 65, 130, 0x808080, ox - 20, oy + 140, oz - 100);
        // Fourth tier — upper mountain
        makebox(90, 55, 90, 0x8B8B8B, ox - 20, oy + 185, oz - 100);
        // Fifth tier — near summit
        makebox(55, 45, 55, 0x969696, ox - 20, oy + 220, oz - 100);
        // Sixth tier — summit block
        makebox(30, 35, 30, 0x9A9A9A, ox - 20, oy + 252, oz - 100);
        // Rocky summit pinnacle
        makebox(14, 20, 14, 0xA0A0A0, ox - 20, oy + 279, oz - 100);
        // Summit cairn
        makecyl(4, 6, 12, 6, 0xAAAAAA, ox - 20, oy + 295, oz - 100);

        // Ridge running south from Goat Fell — Beinn Nuis direction
        makebox(80, 40, 200, 0x707070, ox - 60, oy + 48, oz - 30);
        // North Goat Fell spur
        makebox(70, 35, 120, 0x6e6e6e, ox + 30, oy + 42, oz - 160);

        // =============================================
        // BRODICK CASTLE — Red sandstone, Victorian, Brodick Bay
        // =============================================
        var bcx = ox + 200, bcz = oz - 120;
        // Main castle body
        makebox(80, 55, 50, 0xCD5C5C, bcx, oy + 27, bcz);
        // Victorian wing addition
        makebox(55, 45, 38, 0xC85050, bcx + 68, oy + 22, bcz - 5);
        // Original medieval tower
        makebox(24, 80, 24, 0xBE4B4B, bcx - 28, oy + 40, bcz - 13);
        // Second corner tower
        makebox(20, 72, 20, 0xBE4B4B, bcx + 28, oy + 36, bcz - 13);
        // Battlements on main keep
        makebox(84, 8, 10, 0xC04C4C, bcx, oy + 57, bcz - 20);
        // Turret atop main tower
        makecyl(8, 8, 18, 8, 0xBE4B4B, bcx - 28, oy + 88, bcz - 13);
        makecone(10, 14, 8, 0x8B3030, bcx - 28, oy + 103, bcz - 13);
        // Victorian wing roof
        makebox(55, 8, 38, 0xA83030, bcx + 68, oy + 49, bcz - 5);
        // Castle gatehouse
        makebox(28, 30, 20, 0xD06060, bcx + 38, oy + 15, bcz + 22);
        // Formal walled garden
        makebox(100, 4, 80, 0x5a8a40, bcx + 30, oy + 2, bcz + 70);
        // Garden wall north
        makebox(100, 10, 3, 0xCD5C5C, bcx + 30, oy + 7, bcz + 30);
        // Garden wall south
        makebox(100, 10, 3, 0xCD5C5C, bcx + 30, oy + 7, bcz + 110);
        // Garden wall east
        makebox(3, 10, 80, 0xCD5C5C, bcx + 80, oy + 7, bcz + 70);
        // Garden wall west
        makebox(3, 10, 80, 0xCD5C5C, bcx - 20, oy + 7, bcz + 70);
        // Woodland surrounding castle
        makecyl(18, 12, 40, 6, 0x2d5a1a, bcx - 60, oy + 20, bcz - 20);
        makecyl(14, 10, 35, 6, 0x2d5a1a, bcx - 70, oy + 17, bcz + 20);

        // =============================================
        // BRODICK HARBOUR — Ferry terminal, CalMac ferry, stone pier
        // =============================================
        var bhx = ox + 340, bhz = oz - 20;
        // Stone pier extending into sea
        makebox(220, 10, 28, 0xD3D3D3, bhx + 50, oy + 1, bhz);
        // Ferry terminal building
        makebox(60, 22, 40, 0xD3D3D3, bhx - 20, oy + 11, bhz);
        // Terminal roof
        makebox(64, 6, 44, 0xBBBBBB, bhx - 20, oy + 25, bhz);
        // Waiting shelter
        makebox(30, 14, 18, 0xCCCCCC, bhx + 30, oy + 7, bhz);
        // CalMac ferry — box hull
        makebox(90, 20, 32, 0xFFFFFF, bhx + 110, oy + 7, bhz);
        // Ferry superstructure upper deck
        makebox(70, 14, 28, 0xEEEEEE, bhx + 110, oy + 21, bhz);
        // Ferry bridge deck
        makebox(30, 10, 28, 0xDDDDDD, bhx + 95, oy + 32, bhz);
        // Ferry funnel — CalMac yellow/red
        makecyl(5, 5, 20, 8, 0xFFD700, bhx + 100, oy + 47, bhz - 6);
        makecyl(5, 5, 20, 8, 0xFF2200, bhx + 100, oy + 47, bhz + 6);
        // Pier lighthouse/beacon
        makecyl(3, 3, 18, 8, 0xFFFFFF, bhx + 160, oy + 9, bhz);
        makecone(4, 6, 8, 0xFF0000, bhx + 160, oy + 21, bhz);
        // Bollards on pier
        makecyl(2, 2, 6, 6, 0x888888, bhx + 30, oy + 11, bhz + 12);
        makecyl(2, 2, 6, 6, 0x888888, bhx + 80, oy + 11, bhz + 12);
        makecyl(2, 2, 6, 6, 0x888888, bhx + 130, oy + 11, bhz + 12);

        // =============================================
        // LOCHRANZA CASTLE — Ruined tower house, loch head
        // =============================================
        var lcx = ox - 320, lcz = oz - 280;
        // Ruined north wall (roofless)
        makebox(50, 38, 5, 0x8B7355, lcx, oy + 19, lcz - 22);
        // Ruined south wall
        makebox(50, 32, 5, 0x8B7355, lcx, oy + 16, lcz + 22);
        // Ruined west wall
        makebox(5, 40, 44, 0x8B7355, lcx - 22, oy + 20, lcz);
        // Ruined east wall with gap (broken)
        makebox(5, 35, 15, 0x8B7355, lcx + 22, oy + 17, lcz - 14);
        makebox(5, 20, 10, 0x8B7355, lcx + 22, oy + 10, lcz + 14);
        // Tower remnant — SW corner
        makebox(16, 55, 16, 0x7a6347, lcx - 17, oy + 27, lcz - 17);
        // Fallen rubble
        makebox(18, 6, 12, 0x7a6347, lcx + 10, oy + 3, lcz + 28);
        makebox(12, 5, 8, 0x8B7355, lcx - 30, oy + 2, lcz + 20);
        // Lochranza loch water
        makebox(160, 4, 120, 0x005a7a, lcx - 10, oy - 1, lcz + 100);

        // =============================================
        // ISLE OF ARRAN DISTILLERY — Lochranza, white buildings
        // =============================================
        var dsx = ox - 290, dsz = oz - 240;
        // Main distillery building
        makebox(55, 28, 38, 0xF5F0E8, dsx, oy + 14, dsz);
        // Still house
        makebox(35, 32, 30, 0xF0EBE0, dsx + 50, oy + 16, dsz);
        // Warehouse
        makebox(60, 18, 35, 0xEEE9E0, dsx - 62, oy + 9, dsz + 10);
        // Pagoda kiln — characteristic distillery feature
        makecyl(12, 12, 30, 8, 0xF5F0E8, dsx + 22, oy + 29, dsz - 5);
        makecone(14, 16, 8, 0x333333, dsx + 22, oy + 51, dsz - 5);
        // Second pagoda kiln
        makecyl(10, 10, 26, 8, 0xF5F0E8, dsx + 22, oy + 27, dsz + 20);
        makecone(12, 14, 8, 0x333333, dsx + 22, oy + 47, dsz + 20);
        // Visitor centre
        makebox(40, 20, 28, 0xF8F4EC, dsx - 20, oy + 10, dsz - 38);

        // =============================================
        // MACHRIE MOOR STANDING STONES — prehistoric stone circle
        // =============================================
        var mmx = ox - 260, mmz = oz + 100;
        var stoneRadius = 55;
        var stoneCount = 9;
        for (var si = 0; si < stoneCount; si++) {
            var angle = (si / stoneCount) * Math.PI * 2;
            var sx = mmx + Math.cos(angle) * stoneRadius;
            var sz = mmz + Math.sin(angle) * stoneRadius;
            var stoneH = 14 + (si % 3) * 5;
            var stoneW = 3 + (si % 2) * 2;
            makecyl(stoneW, stoneW + 1, stoneH, 5, 0xAA9988, sx, oy + stoneH / 2, sz);
        }
        // Central altar stone — larger flat slab
        makebox(12, 5, 8, 0x9A8878, mmx, oy + 2, mmz);
        // Smaller inner ring
        makecyl(2, 2.5, 9, 5, 0xBBAA99, mmx + 18, oy + 4, mmz);
        makecyl(2, 2.5, 9, 5, 0xBBAA99, mmx - 18, oy + 4, mmz);
        makecyl(2, 2.5, 7, 5, 0xBBAA99, mmx, oy + 3, mmz + 18);
        makecyl(2, 2.5, 7, 5, 0xBBAA99, mmx, oy + 3, mmz - 18);
        // Fallen stone
        var fallenGeo = new THREE.CylinderGeometry(2.5, 3, 16, 5);
        var fallenMat = new THREE.MeshLambertMaterial({ color: 0xAA9988 });
        var fallenMesh = new THREE.Mesh(fallenGeo, fallenMat);
        fallenMesh.position.set(mmx + 30, oy + 2, mmz + 40);
        fallenMesh.rotation.z = Math.PI / 2;
        addMesh(fallenMesh);

        // =============================================
        // HOLY ISLAND — separate island in Lamlash Bay
        // =============================================
        var hix = ox + 400, hiz = oz + 100;
        // Holy Island landmass
        makebox(150, 22, 90, 0x5a7a4a, hix, oy + 7, hiz);
        // Mullach Mor hill
        makebox(80, 45, 60, 0x4e6e3e, hix - 10, oy + 28, hiz);
        makebox(50, 30, 40, 0x527240, hix - 10, oy + 58, hiz);
        // Buddhist Centre buildings
        makebox(22, 14, 16, 0xF5F0E8, hix + 40, oy + 18, hiz + 20);
        makebox(16, 12, 14, 0xF0EBE0, hix + 60, oy + 17, hiz + 15);
        // Buddhist prayer flags — thin vertical poles
        makecyl(0.8, 0.8, 22, 4, 0x888888, hix + 35, oy + 22, hiz + 10);
        makecyl(0.8, 0.8, 22, 4, 0x888888, hix + 45, oy + 22, hiz + 10);
        // Lighthouse on Holy Island
        makecyl(5, 6, 28, 8, 0xFFFFFF, hix + 55, oy + 25, hiz - 30);
        makecone(7, 8, 8, 0xFF2200, hix + 55, oy + 43, hiz - 30);
        // Lamlash Bay water between island and village
        makebox(200, 4, 180, 0x005580, hix - 120, oy - 1, hiz);

        // =============================================
        // LAMLASH VILLAGE — east coast village
        // =============================================
        var llx = ox + 260, llz = oz + 100;
        // Row of stone cottages along bay
        makebox(22, 14, 16, 0xF5F0E8, llx, oy + 7, llz - 60);
        makebox(20, 12, 16, 0xCD5C5C, llx + 28, oy + 6, llz - 60);
        makebox(24, 15, 16, 0xF5F0E8, llx + 56, oy + 7, llz - 60);
        makebox(20, 12, 16, 0xF0EBE0, llx + 84, oy + 6, llz - 60);
        makebox(26, 14, 16, 0xCD5C5C, llx - 28, oy + 7, llz - 60);
        // Village church
        makebox(18, 24, 28, 0xD3D3D3, llx + 40, oy + 12, llz - 90);
        makecyl(4, 4, 20, 6, 0xD3D3D3, llx + 40, oy + 34, llz - 90);
        makecone(5, 12, 6, 0x888888, llx + 40, oy + 50, llz - 90);
        // Village hall
        makebox(30, 16, 22, 0xE8E4DC, llx - 10, oy + 8, llz - 90);
        // Shore road edge
        makebox(280, 4, 8, 0x999999, llx, oy + 3, llz - 40);

        // =============================================
        // PLADDA LIGHTHOUSE — southern tip, separate islet
        // =============================================
        var plx = ox + 100, plz = oz + 440;
        // Pladda islet
        makebox(80, 10, 60, 0x6a7a5a, plx, oy + 3, plz);
        // Lighthouse tower
        makecyl(6, 7, 44, 10, 0xFFFFFF, plx, oy + 27, plz);
        // Lighthouse lantern room
        makecyl(8, 8, 8, 10, 0xDDDDDD, plx, oy + 54, plz);
        makecone(9, 10, 10, 0xFF0000, plx, oy + 63, plz);
        // Keeper's cottage
        makebox(20, 10, 16, 0xFFFFFF, plx + 22, oy + 7, plz);
        makebox(20, 4, 16, 0xCCCCCC, plx + 22, oy + 14, plz);
        // Outbuildings
        makebox(12, 8, 10, 0xEEEEEE, plx - 20, oy + 6, plz + 14);

        // =============================================
        // WHITING BAY — east coast village + glen waterfalls
        // =============================================
        var wbx = ox + 280, wbz = oz + 200;
        // Village row of buildings
        makebox(20, 12, 16, 0xF5F0E8, wbx, oy + 6, wbz);
        makebox(18, 14, 16, 0xF5F0E8, wbx + 26, oy + 7, wbz);
        makebox(22, 12, 16, 0xEDE9E1, wbx + 52, oy + 6, wbz);
        makebox(20, 15, 16, 0xCD5C5C, wbx + 78, oy + 7, wbz);
        // Glen behind Whiting Bay — rising terrain
        makebox(60, 28, 80, 0x3a6028, wbx - 40, oy + 16, wbz - 60);
        makebox(40, 45, 60, 0x365824, wbx - 50, oy + 28, wbz - 100);
        // Waterfall — white streaks (box approximation)
        makebox(4, 40, 4, 0xEEFFFF, wbx - 38, oy + 35, wbz - 80);
        makebox(3, 25, 3, 0xDDEEFF, wbx - 34, oy + 22, wbz - 85);
        // Waterfall pool
        makebox(18, 3, 14, 0x005588, wbx - 36, oy + 2, wbz - 70);

        // =============================================
        // RED DEER — hillside silhouettes
        // =============================================
        // Deer near Goat Fell slopes
        var deerPositions = [
            [ox + 50, oz - 80],
            [ox + 80, oz - 110],
            [ox - 40, oz - 50],
            [ox + 10, oz - 130],
            [ox - 80, oz + 20],
            [ox + 60, oz + 40]
        ];
        for (var di = 0; di < deerPositions.length; di++) {
            var dx = deerPositions[di][0];
            var dz = deerPositions[di][1];
            var dely = oy + 14;
            // Body
            makebox(14, 7, 6, 0x8B6050, dx, dely, dz);
            // Head
            makesphere(3.5, 6, 5, 0x8B6050, dx - 9, dely + 3, dz);
            // Neck
            makebox(4, 6, 3, 0x7a5040, dx - 7, dely + 1, dz);
            // Antlers (only on some)
            if (di % 2 === 0) {
                makebox(1.5, 8, 1.5, 0x6B4030, dx - 9, dely + 10, dz - 1.5);
                makebox(1.5, 8, 1.5, 0x6B4030, dx - 9, dely + 10, dz + 1.5);
            }
            // Legs
            makebox(2, 8, 2, 0x7a5040, dx - 4, dely - 7, dz - 1.5);
            makebox(2, 8, 2, 0x7a5040, dx + 4, dely - 7, dz - 1.5);
            makebox(2, 8, 2, 0x7a5040, dx - 4, dely - 7, dz + 1.5);
            makebox(2, 8, 2, 0x7a5040, dx + 4, dely - 7, dz + 1.5);
        }

        // =============================================
        // ADDITIONAL COASTAL DETAIL
        // =============================================
        // Corrie village — northeast coast
        makebox(18, 12, 14, 0xF5F0E8, ox + 290, oy + 7, oz - 180);
        makebox(16, 10, 14, 0xEDE8E0, ox + 316, oy + 6, oz - 180);
        makebox(20, 13, 14, 0xF0EBE3, ox + 260, oy + 7, oz - 200);

        // Blackwaterfoot village — west coast
        makebox(18, 11, 14, 0xF5F0E8, ox - 330, oy + 6, oz + 50);
        makebox(16, 12, 14, 0xEAE5DD, ox - 356, oy + 7, oz + 50);
        makebox(14, 10, 12, 0xF0EBE3, ox - 310, oy + 6, oz + 70);

        // King's Cave cliffs — west coast
        makebox(20, 50, 80, 0x7a7060, ox - 370, oy + 27, oz + 10);
        makebox(15, 40, 40, 0x706860, ox - 388, oy + 22, oz - 20);

        // Goatfell lower slope trees/forest
        makecyl(16, 10, 38, 6, 0x2d5a1a, ox + 80, oy + 19, oz - 70);
        makecyl(14, 10, 34, 6, 0x2d5a1a, ox + 100, oy + 17, oz - 50);
        makecyl(18, 12, 42, 6, 0x264e17, ox + 60, oy + 21, oz - 90);
        makecyl(12, 8, 30, 6, 0x2d5a1a, ox + 120, oy + 15, oz - 100);

        // Glen Rosa — valley between peaks
        makebox(80, 20, 250, 0x3a6028, ox - 10, oy + 12, oz + 20);

        // Southern hills — Brown Head area
        makebox(120, 35, 100, 0x5a7060, ox + 40, oy + 25, oz + 300);
        makebox(80, 25, 70, 0x506860, ox - 20, oy + 20, oz + 350);

        // Road along east coast — A841
        makebox(8, 3, 900, 0x555555, ox + 260, oy + 11, oz + 80);

        // Small farm buildings — various locations
        makebox(16, 9, 12, 0xD8D0C0, ox - 150, oy + 8, oz + 120);
        makebox(20, 8, 14, 0xCCC4B4, ox + 100, oy + 7, oz + 200);
        makebox(18, 8, 12, 0xD0C8B8, ox - 200, oy + 7, oz + 180);
    }

    function update(delta) {
        // Static environment — no per-frame animation needed
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
