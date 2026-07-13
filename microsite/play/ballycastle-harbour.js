window.BallycastleHarbour = (function() {
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

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 19600;

        // -------------------------------------------------------
        // NORTH ATLANTIC SEA — large flat-ish ocean surface made
        // from a tall-but-shallow box so we stay within allowed geos
        // -------------------------------------------------------
        // Main sea body (wide box, low profile)
        makeMesh(new THREE.BoxGeometry(4000, 4, 3000), 0x1E6BA8, cx, -2, 400);

        // Second sea layer for depth colour variation
        makeMesh(new THREE.BoxGeometry(3600, 2, 2800), 0x1A5F96, cx, -3, 300);

        // Surf / wave strips along beach
        makeMesh(new THREE.BoxGeometry(600, 2, 18), 0xFFFAF0, cx - 200, 1, -160);
        makeMesh(new THREE.BoxGeometry(600, 2, 14), 0xFFFAF0, cx - 200, 1, -180);

        // -------------------------------------------------------
        // BALLYCASTLE BEACH
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(700, 3, 180), 0xF5DEB3, cx - 180, 0, -100);
        // Wet sand strip
        makeMesh(new THREE.BoxGeometry(700, 2, 30), 0xDEB887, cx - 180, 0, -155);

        // -------------------------------------------------------
        // DISTANT SCOTTISH COAST ON HORIZON
        // -------------------------------------------------------
        // Low ridge silhouette
        makeMesh(new THREE.BoxGeometry(1800, 28, 22), 0xFFFAF0, cx + 200, 12, 1400);
        makeMesh(new THREE.BoxGeometry(900, 18, 18), 0xFFFAF0, cx - 400, 8, 1420);
        makeMesh(new THREE.BoxGeometry(600, 22, 18), 0xFFFAF0, cx + 700, 10, 1410);

        // -------------------------------------------------------
        // FAIR HEAD — Ireland's highest accessible cliff
        // Massive dark basalt headland to the east
        // -------------------------------------------------------
        // Main cliff face (very tall)
        makeMesh(new THREE.BoxGeometry(380, 220, 140), 0x2F2F2F, cx + 900, 108, -40);
        // Cliff cap
        makeMesh(new THREE.BoxGeometry(380, 14, 160), 0x3D3D3D, cx + 900, 221, -40);
        // Cliff side buttress
        makeMesh(new THREE.BoxGeometry(80, 180, 100), 0x262626, cx + 1060, 88, -20);
        // Basalt column suggestion (vertical thin box)
        makeMesh(new THREE.BoxGeometry(18, 200, 18), 0x1F1F1F, cx + 870, 98, -60);
        makeMesh(new THREE.BoxGeometry(14, 190, 14), 0x1F1F1F, cx + 850, 93, -30);
        makeMesh(new THREE.BoxGeometry(16, 195, 16), 0x1F1F1F, cx + 890, 96, -50);
        // Scree slope at cliff base
        makeMesh(new THREE.BoxGeometry(300, 30, 80), 0x404040, cx + 900, 13, -30);

        // -------------------------------------------------------
        // KENBANE CASTLE — ruined castle on white chalk headland
        // -------------------------------------------------------
        // Chalk headland promontory
        makeMesh(new THREE.BoxGeometry(160, 40, 90), 0xF8F8FF, cx - 1000, 18, -20);
        // Castle keep ruin
        makeMesh(new THREE.BoxGeometry(28, 38, 28), 0x808080, cx - 1010, 57, -10);
        // Broken wall section
        makeMesh(new THREE.BoxGeometry(42, 22, 8), 0x808080, cx - 990, 47, -30);
        makeMesh(new THREE.BoxGeometry(8, 14, 30), 0x808080, cx - 1030, 43, -15);
        // Castle tower stump
        makeMesh(new THREE.CylinderGeometry(7, 8, 24, 8), 0x787878, cx - 1015, 69, -25);

        // -------------------------------------------------------
        // TORR HEAD — rocky headland to east with coastguard station
        // -------------------------------------------------------
        // Headland mass
        makeMesh(new THREE.BoxGeometry(220, 80, 120), 0x4A4A4A, cx + 1300, 38, -80);
        // Coastguard station building
        makeMesh(new THREE.BoxGeometry(22, 16, 18), 0xDDDDDD, cx + 1310, 96, -75);
        // Station roof
        makeMesh(new THREE.BoxGeometry(24, 8, 20), 0xCC4444, cx + 1310, 108, -75);
        // Lookout tower
        makeMesh(new THREE.CylinderGeometry(3, 4, 28, 8), 0xBBBBBB, cx + 1320, 110, -68);

        // -------------------------------------------------------
        // HARBOUR BASIN — stone pier arms
        // -------------------------------------------------------
        // West pier arm
        makeMesh(new THREE.BoxGeometry(14, 6, 260), 0x696969, cx - 120, 2, 120);
        // East pier arm
        makeMesh(new THREE.BoxGeometry(14, 6, 260), 0x696969, cx + 120, 2, 120);
        // Pier head west (turned)
        makeMesh(new THREE.BoxGeometry(80, 6, 14), 0x696969, cx - 80, 2, 250);
        // Pier head east
        makeMesh(new THREE.BoxGeometry(80, 6, 14), 0x696969, cx + 80, 2, 250);
        // Harbour basin water
        makeMesh(new THREE.BoxGeometry(220, 2, 240), 0x006994, cx, -1, 130);
        // Stone quayside surface
        makeMesh(new THREE.BoxGeometry(240, 3, 30), 0x777777, cx, 1, -5);

        // Pier bollards (west side)
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 6), 0x555555, cx - 118, 5, 20);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 6), 0x555555, cx - 118, 5, 80);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 6), 0x555555, cx - 118, 5, 140);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 6), 0x555555, cx - 118, 5, 200);
        // Pier bollards (east side)
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 6), 0x555555, cx + 118, 5, 20);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 6), 0x555555, cx + 118, 5, 80);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 6), 0x555555, cx + 118, 5, 140);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 4, 6), 0x555555, cx + 118, 5, 200);

        // -------------------------------------------------------
        // RATHLIN ISLAND FERRY
        // -------------------------------------------------------
        // Ferry hull
        makeMesh(new THREE.BoxGeometry(52, 8, 130), 0x1E6BA8, cx, 3, 160);
        // Ferry cabin / superstructure
        makeMesh(new THREE.BoxGeometry(46, 10, 70), 0xFFFFF0, cx, 12, 155);
        // Bridge deck
        makeMesh(new THREE.BoxGeometry(36, 6, 24), 0xFFFFF0, cx, 22, 148);
        // Funnel / stack
        makeMesh(new THREE.CylinderGeometry(3, 4, 16, 8), 0x222222, cx + 8, 34, 150);
        // Ferry bow ramp suggestion
        makeMesh(new THREE.BoxGeometry(48, 3, 16), 0x888888, cx, 7, 226);
        // Mast
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 26, 6), 0x333333, cx, 36, 148);
        // Life ring holders (small discs = cylinders)
        makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 1.5, 12), 0xFF4500, cx - 24, 10, 140);
        makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 1.5, 12), 0xFF4500, cx + 24, 10, 140);

        // -------------------------------------------------------
        // FISH MARKET BUILDING
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(80, 20, 40), 0xB8B8B8, cx - 80, 9, -30);
        // Fish market roof
        makeMesh(new THREE.BoxGeometry(84, 10, 44), 0x8B4513, cx - 80, 24, -30);
        // Loading bay door (darker recess)
        makeMesh(new THREE.BoxGeometry(14, 12, 3), 0x444444, cx - 80, 5, -50);
        // Fish market sign board
        makeMesh(new THREE.BoxGeometry(30, 6, 2), 0xFFFFCC, cx - 80, 22, -51);

        // -------------------------------------------------------
        // BALLYCASTLE TOWN — Victorian/Georgian market town
        // -------------------------------------------------------
        // Row of terraced houses (west side)
        makeMesh(new THREE.BoxGeometry(180, 26, 22), 0xCD5C5C, cx - 250, 12, -220);
        // Roofline
        makeMesh(new THREE.BoxGeometry(184, 10, 26), 0x8B3A3A, cx - 250, 30, -220);

        // Row of terraced houses (east side)
        makeMesh(new THREE.BoxGeometry(160, 26, 22), 0xC06060, cx + 250, 12, -220);
        makeMesh(new THREE.BoxGeometry(164, 10, 26), 0x8B3A3A, cx + 250, 30, -220);

        // Larger Georgian townhouse
        makeMesh(new THREE.BoxGeometry(30, 34, 18), 0xCC6666, cx - 60, 16, -240);
        makeMesh(new THREE.BoxGeometry(32, 12, 20), 0x994444, cx - 60, 39, -240);

        // Pub / commercial building
        makeMesh(new THREE.BoxGeometry(24, 22, 18), 0xB85050, cx + 60, 10, -240);
        makeMesh(new THREE.BoxGeometry(26, 8, 20), 0x884040, cx + 60, 25, -240);

        // -------------------------------------------------------
        // DIAMOND SQUARE — town centre
        // -------------------------------------------------------
        // Square paving
        makeMesh(new THREE.BoxGeometry(80, 1, 80), 0xAAAAAA, cx, 0, -260);

        // Memorial cross at Diamond
        // Cross upright
        makeMesh(new THREE.BoxGeometry(3, 28, 3), 0xBBBBBB, cx, 14, -260);
        // Cross bar
        makeMesh(new THREE.BoxGeometry(14, 3, 3), 0xBBBBBB, cx, 22, -260);
        // Cross plinth
        makeMesh(new THREE.BoxGeometry(8, 4, 8), 0x999999, cx, 2, -260);

        // -------------------------------------------------------
        // ST PATRICK'S CHURCH
        // -------------------------------------------------------
        // Nave
        makeMesh(new THREE.BoxGeometry(28, 22, 52), 0xD4C5A9, cx - 180, 10, -300);
        // Chancel
        makeMesh(new THREE.BoxGeometry(18, 18, 22), 0xD4C5A9, cx - 180, 8, -360);
        // Tower
        makeMesh(new THREE.BoxGeometry(14, 44, 14), 0xC8BAA0, cx - 168, 22, -288);
        // Steeple
        makeMesh(new THREE.ConeGeometry(8, 22, 4), 0x888888, cx - 168, 66, -288);

        // -------------------------------------------------------
        // ST COLMAN'S CHURCH
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(26, 20, 46), 0xCCBB99, cx + 180, 9, -310);
        makeMesh(new THREE.BoxGeometry(14, 40, 14), 0xBBAA88, cx + 194, 19, -298);
        makeMesh(new THREE.ConeGeometry(8, 20, 4), 0x777777, cx + 194, 60, -298);

        // -------------------------------------------------------
        // OLD LAMMAS FAIR SITE — market stalls
        // -------------------------------------------------------
        // Stall 1 — frame
        makeMesh(new THREE.BoxGeometry(16, 10, 12), 0xFFD700, cx - 30, 4, -340);
        // Stall 1 — awning
        makeMesh(new THREE.BoxGeometry(18, 2, 14), 0xFF6347, cx - 30, 10, -340);
        // Stall 2
        makeMesh(new THREE.BoxGeometry(16, 10, 12), 0xFFD700, cx + 10, 4, -340);
        makeMesh(new THREE.BoxGeometry(18, 2, 14), 0x4169E1, cx + 10, 10, -340);
        // Stall 3 — Yellow Man candy booth
        makeMesh(new THREE.BoxGeometry(14, 10, 10), 0xFFFF00, cx + 50, 4, -340);
        makeMesh(new THREE.BoxGeometry(16, 2, 12), 0xFFAA00, cx + 50, 10, -340);
        // Yellow Man sign board
        makeMesh(new THREE.BoxGeometry(10, 5, 1), 0xFFEE00, cx + 50, 14, -345);
        // Pennies & Yellowman sign
        makeMesh(new THREE.BoxGeometry(10, 5, 1), 0xFFEE88, cx - 30, 14, -345);
        // Stall counter
        makeMesh(new THREE.BoxGeometry(12, 3, 6), 0x8B4513, cx + 50, 7, -336);
        makeMesh(new THREE.BoxGeometry(12, 3, 6), 0x8B4513, cx - 30, 7, -336);

        // -------------------------------------------------------
        // CROSS OF MARCONI — memorial to 1898 radio transmission
        // -------------------------------------------------------
        // Memorial obelisk
        makeMesh(new THREE.BoxGeometry(5, 36, 5), 0xE8E0D0, cx + 300, 18, -80);
        // Obelisk tip
        makeMesh(new THREE.ConeGeometry(3.5, 10, 4), 0xDDD5C5, cx + 300, 42, -80);
        // Plinth base
        makeMesh(new THREE.BoxGeometry(12, 6, 12), 0xCCC4B4, cx + 300, 3, -80);
        // Plaque face
        makeMesh(new THREE.BoxGeometry(4, 6, 1), 0xB8A898, cx + 300, 16, -82);
        // Radio mast suggestion (slender cylinder)
        makeMesh(new THREE.CylinderGeometry(0.6, 0.8, 40, 6), 0x555555, cx + 290, 20, -80);

        // -------------------------------------------------------
        // HARBOUR LIGHTHOUSE / NAVIGATION LIGHT
        // -------------------------------------------------------
        makeMesh(new THREE.CylinderGeometry(3, 4, 22, 8), 0xFFFFFF, cx + 120, 11, 250);
        makeMesh(new THREE.CylinderGeometry(4, 4, 3, 8), 0xAAAAAA, cx + 120, 23, 250);
        // Light housing
        makeMesh(new THREE.SphereGeometry(3, 8, 6), 0xFFFF88, cx + 120, 27, 250);
        // Red navigation light on west pier head
        makeMesh(new THREE.SphereGeometry(2, 6, 6), 0xFF2200, cx - 120, 12, 250);

        // -------------------------------------------------------
        // HARBOUR ROAD / SLIPWAY
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(30, 2, 80), 0x888888, cx, 0, -50);

        // -------------------------------------------------------
        // FISHING BOATS in harbour
        // -------------------------------------------------------
        // Boat 1 — hull
        makeMesh(new THREE.BoxGeometry(18, 5, 36), 0x336699, cx - 60, 2, 100);
        // Boat 1 — cabin
        makeMesh(new THREE.BoxGeometry(14, 6, 14), 0xFFFFEE, cx - 60, 8, 94);
        // Boat 1 — mast
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 20, 6), 0x663300, cx - 60, 18, 94);

        // Boat 2 — hull
        makeMesh(new THREE.BoxGeometry(16, 5, 30), 0x993333, cx + 50, 2, 90);
        // Boat 2 — cabin
        makeMesh(new THREE.BoxGeometry(12, 5, 10), 0xFFFFEE, cx + 50, 8, 85);
        // Boat 2 — mast
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 18, 6), 0x663300, cx + 50, 17, 85);

        // -------------------------------------------------------
        // HARBOUR WALL STEPS & FEATURES
        // -------------------------------------------------------
        // Steps on west quay
        makeMesh(new THREE.BoxGeometry(10, 2, 8), 0x666666, cx - 113, 3, 10);
        makeMesh(new THREE.BoxGeometry(10, 2, 8), 0x666666, cx - 113, 5, 16);

        // Fisherman's store shed
        makeMesh(new THREE.BoxGeometry(20, 12, 16), 0x888888, cx - 140, 5, 20);
        makeMesh(new THREE.BoxGeometry(22, 5, 18), 0x666666, cx - 140, 13, 20);

        // Lobster pot stack (rounded suggestion)
        makeMesh(new THREE.BoxGeometry(8, 6, 8), 0x8B7355, cx - 100, 3, 10);
        makeMesh(new THREE.BoxGeometry(6, 4, 6), 0x7A6345, cx - 100, 8, 10);

        // Anchor monument
        makeMesh(new THREE.CylinderGeometry(1, 1, 14, 6), 0x333333, cx + 150, 7, -10);
        makeMesh(new THREE.BoxGeometry(10, 2, 2), 0x333333, cx + 150, 12, -10);

        // -------------------------------------------------------
        // COASTAL ROAD ALONG WATERFRONT
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(800, 2, 24), 0x777777, cx, 1, -180);

        // -------------------------------------------------------
        // LANDSCAPE GROUND MASS
        // -------------------------------------------------------
        // Base terrain behind town
        makeMesh(new THREE.BoxGeometry(2000, 8, 400), 0x4A7C3F, cx, -4, -400);
        // Rolling hill behind town (east)
        makeMesh(new THREE.BoxGeometry(600, 60, 300), 0x3D6B34, cx + 400, 28, -500);
        // Rolling hill (west)
        makeMesh(new THREE.BoxGeometry(500, 45, 260), 0x3D6B34, cx - 400, 20, -480);
        // Cliff-top grass shelf connecting to Fair Head
        makeMesh(new THREE.BoxGeometry(400, 10, 200), 0x4A7C3F, cx + 700, 5, -200);
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
