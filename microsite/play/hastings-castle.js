window.HastingsCastle = (function() {
    'use strict';

    var WX = 4200;
    var WZ = 2200;

    function makebox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makesphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makecone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    // 1. Hastings Castle — ruined Norman cliff-top castle, L-shaped curtain walls
    function buildhastingscastle(scene) {
        // Cliff base under castle
        makebox(scene, 60, 18, 40, 0xD2B48C, -120, 9, -80);

        // L-shaped curtain walls — west arm
        makebox(scene, 2, 12, 50, 0x888888, -100, 6, -80);
        // L-shaped curtain walls — north arm
        makebox(scene, 40, 12, 2, 0x888888, -120, 6, -55);
        // Corner connection
        makebox(scene, 2, 12, 2, 0x888888, -100, 6, -55);

        // Crenellations on west wall
        var wmerlon = [-60, -65, -70, -75, -80, -85, -90, -95, -100, -105];
        for (var i = 0; i < wmerlon.length; i++) {
            makebox(scene, 2, 3, 2, 0x888888, -100, 13.5, wmerlon[i]);
        }
        // Crenellations on north wall
        var nmerlon = [-102, -107, -112, -117, -122, -127, -132, -137];
        for (var j = 0; j < nmerlon.length; j++) {
            makebox(scene, 2, 3, 2, 0x888888, nmerlon[j], 13.5, -55);
        }

        // Ruined tower stump at corner
        makecylinder(scene, 4, 4.5, 14, 10, 0x888888, -100, 7, -55);
        // Partial wall fragments (ruined appearance)
        makebox(scene, 2, 8, 10, 0x888888, -138, 4, -60);
        makebox(scene, 2, 5, 8, 0x888888, -138, 2.5, -70);

        // Chapel ruin inside walls
        makebox(scene, 10, 7, 14, 0x777777, -115, 3.5, -72);
        // Ruined east wall of chapel (partial)
        makebox(scene, 10, 4, 2, 0x777777, -115, 2, -65);

        // Arrow slit openings (dark insets)
        makebox(scene, 0.4, 2.5, 0.4, 0x222222, -100.2, 7, -75);
        makebox(scene, 0.4, 2.5, 0.4, 0x222222, -100.2, 7, -85);
        makebox(scene, 0.4, 2.5, 0.4, 0x222222, -100.2, 7, -65);
    }

    // 2. East Hill — dramatic cliff headland with funicular railway
    function buildeasthill(scene) {
        // Main cliff face — tall sandstone box
        makebox(scene, 40, 20, 30, 0xD2B48C, 60, 10, -60);
        // Top plateau
        makebox(scene, 40, 2, 30, 0xC4A882, 60, 21, -60);

        // Cliff face texture details (smaller boxes embedded)
        makebox(scene, 38, 3, 1, 0xC8A87C, 60, 5, -45);
        makebox(scene, 38, 2, 1, 0xBEA076, 60, 12, -45);
        makebox(scene, 38, 2, 1, 0xBEA076, 60, 17, -45);

        // Funicular railway track guides (thin boxes on cliff face)
        makebox(scene, 1.5, 22, 1, 0x8B7355, 55, 11, -45);
        makebox(scene, 1.5, 22, 1, 0x8B7355, 65, 11, -45);

        // Funicular car lower position
        makebox(scene, 4, 4, 3, 0xCC0000, 60, 4, -44);
        makebox(scene, 3.8, 0.5, 2.8, 0xAA0000, 60, 6.25, -44);
        // Funicular car windows
        makebox(scene, 1, 1.5, 0.2, 0x87CEEB, 58.5, 4.5, -42.9);
        makebox(scene, 1, 1.5, 0.2, 0x87CEEB, 61.5, 4.5, -42.9);

        // Funicular car upper position
        makebox(scene, 4, 4, 3, 0xDD2222, 60, 16, -44);
        makebox(scene, 3.8, 0.5, 2.8, 0xBB1111, 60, 18.25, -44);
        makebox(scene, 1, 1.5, 0.2, 0x87CEEB, 58.5, 16.5, -42.9);
        makebox(scene, 1, 1.5, 0.2, 0x87CEEB, 61.5, 16.5, -42.9);

        // Upper station building
        makebox(scene, 8, 5, 6, 0xCC8833, 60, 23.5, -55);
        makebox(scene, 8, 1, 7, 0xAA6622, 60, 26.5, -55);

        // Lower station building
        makebox(scene, 8, 4, 5, 0xCC8833, 60, 2, -44);
        makebox(scene, 8, 0.8, 6, 0xAA6622, 60, 4.4, -44);

        // Hillside greenery suggestion (dark green boxes)
        makebox(scene, 35, 3, 25, 0x3A6B35, 60, 23, -72);
        makebox(scene, 20, 2, 15, 0x2D5A2A, 45, 22.5, -65);
    }

    // 3. Rock-a-Nore Road — fishing beach, net huts, boats
    function buildrockanore(scene) {
        // Shingle beach base
        makebox(scene, 120, 1, 30, 0xB8B0A0, 0, 0.5, 60);

        // Fishing boats pulled up on shingle (various sizes)
        var boatdata = [
            [-20, 60, 8, 2, 4],
            [-8,  62, 7, 2, 3.5],
            [5,   60, 9, 2.5, 4.5],
            [18,  63, 6, 1.8, 3],
            [30,  61, 8, 2, 4],
            [42,  60, 10, 2.5, 5]
        ];
        for (var b = 0; b < boatdata.length; b++) {
            var bd = boatdata[b];
            // Hull
            makebox(scene, bd[2], bd[3], bd[4], 0x1A1A1A, bd[0], bd[3] / 2 + 1, bd[1]);
            // Gunwale rim
            makebox(scene, bd[2] + 0.4, 0.4, bd[4] + 0.4, 0x0A0A0A, bd[0], bd[3] + 1.2, bd[1]);
            // Cabin / mast suggestion
            makebox(scene, 1.5, 2, 1.5, 0x2A2A2A, bd[0] - bd[2] * 0.2, bd[3] + 2.2, bd[1]);
        }

        // Tall thin net drying huts — unique black tarred Hastings sheds
        var nethutsX = [-45, -35, -25, -15, -5, 10, 25, 38];
        for (var h = 0; h < nethutsX.length; h++) {
            // Body — very tall thin box
            makebox(scene, 3.5, 15, 4, 0x1C1C1C, nethutsX[h], 7.5, 40);
            // Pointed roof (slight overhang)
            makebox(scene, 4, 1, 4.5, 0x111111, nethutsX[h], 15.5, 40);
            // Door opening (dark recess)
            makebox(scene, 1.5, 3, 0.3, 0x050505, nethutsX[h], 1.5, 38.2);
        }

        // Fishing gear / nets on ground
        makebox(scene, 6, 0.5, 4, 0x4A3A2A, -10, 1.25, 50);
        makebox(scene, 4, 0.5, 6, 0x3A2A1A, 15, 1.25, 52);

        // Capstan winch (cylinder)
        makecylinder(scene, 0.8, 0.8, 1.5, 8, 0x6A5A4A, -3, 0.75, 54);
        makecylinder(scene, 0.3, 0.3, 2, 8, 0x5A4A3A, -3, 2.25, 54);

        // Fish market building
        makebox(scene, 20, 6, 12, 0xC0B090, -50, 3, 48);
        makebox(scene, 21, 1.5, 13, 0xA09070, -50, 6.75, 48);
    }

    // 4. Battle Abbey — William the Conqueror's abbey on 1066 battlefield
    function buildbattleabbey(scene) {
        // Gatehouse — sandstone
        makebox(scene, 18, 18, 10, 0xD2B48C, -160, 9, 40);
        // Gatehouse arch (dark recess)
        makebox(scene, 6, 9, 11, 0x3A2A18, -160, 4.5, 40);
        // Gatehouse crenellations
        var gbat = [-168, -165, -162, -159, -156, -153];
        for (var g = 0; g < gbat.length; g++) {
            makebox(scene, 2.5, 3, 2.5, 0xD2B48C, gbat[g], 19.5, 40);
        }
        // Flanking towers on gatehouse
        makebox(scene, 6, 22, 8, 0xC8AA80, -172, 11, 40);
        makebox(scene, 6, 22, 8, 0xC8AA80, -148, 11, 40);
        makebox(scene, 7, 1.5, 9, 0xB89A70, -172, 22.75, 40);
        makebox(scene, 7, 1.5, 9, 0xB89A70, -148, 22.75, 40);

        // Nave walls (ruined — only side walls remain)
        makebox(scene, 2, 14, 60, 0xD2B48C, -145, 7, 70);
        makebox(scene, 2, 14, 60, 0xD2B48C, -175, 7, 70);
        // Nave end wall (partial ruin)
        makebox(scene, 30, 14, 2, 0xD2B48C, -160, 7, 100);
        // Nave floor
        makebox(scene, 30, 0.5, 60, 0xBBA880, -160, 0.25, 70);

        // Altar marker — stone box at spot where Harold fell (famous marker)
        makebox(scene, 3, 0.6, 3, 0xF5F0E8, -160, 0.3, 72);
        // Altar inscription plaque
        makebox(scene, 2.8, 0.2, 0.4, 0xE8E0D0, -160, 0.9, 70.9);

        // Abbey church tower ruin
        makebox(scene, 8, 20, 8, 0xC8A870, -160, 10, 101);
        makebox(scene, 9, 1, 9, 0xB89858, -160, 20.5, 101);

        // Dorter (dormitory) range ruin
        makebox(scene, 2, 10, 30, 0xC4A46C, -180, 5, 80);
        makebox(scene, 25, 2, 2, 0xC4A46C, -167.5, 10, 65);

        // Grounds walls
        makebox(scene, 60, 3, 2, 0xB89860, -160, 1.5, 45);
        makebox(scene, 2, 3, 80, 0xB89860, -190, 1.5, 80);
        makebox(scene, 2, 3, 80, 0xB89860, -130, 1.5, 80);
    }

    // 5. 1066 Battlefield — rolling terrain, memorial obelisk, info boards
    function buildbattlefield(scene) {
        // Rolling terrain boxes (gentle hills)
        makebox(scene, 80, 2, 60, 0x5A7A40, -80, 1, 130);
        makebox(scene, 60, 3, 50, 0x4E6E38, -60, 1.5, 150);
        makebox(scene, 50, 4, 40, 0x527242, -40, 2, 125);
        makebox(scene, 70, 2, 55, 0x4A6A35, -100, 1, 145);
        makebox(scene, 55, 3, 45, 0x527242, -120, 1.5, 130);

        // Harold's Standard hill mound
        makebox(scene, 12, 4, 12, 0x4A6838, -80, 2, 140);
        makebox(scene, 10, 2, 10, 0x527242, -80, 5, 140);

        // Memorial obelisk (tall white box)
        makebox(scene, 2.5, 18, 2.5, 0xFFFFFF, -80, 9, 140);
        // Obelisk base plinth
        makebox(scene, 5, 2, 5, 0xF0F0F0, -80, 1, 140);
        makebox(scene, 4, 1, 4, 0xF8F8F8, -80, 3, 140);
        // Obelisk pyramidal top
        makecone(scene, 1.5, 4, 4, 0xFFFFFF, -80, 20, 140);

        // Information boards (wooden posts with sign panels)
        var boardpos = [
            [-65, 135], [-70, 150], [-90, 145], [-95, 130], [-75, 155]
        ];
        for (var ib = 0; ib < boardpos.length; ib++) {
            // Post
            makebox(scene, 0.3, 4, 0.3, 0x6B4C2A, boardpos[ib][0], 2, boardpos[ib][1]);
            makebox(scene, 0.3, 4, 0.3, 0x6B4C2A, boardpos[ib][0] + 2, 2, boardpos[ib][1]);
            // Board panel
            makebox(scene, 2.5, 1.8, 0.2, 0xC8A870, boardpos[ib][0] + 1, 4, boardpos[ib][1]);
        }

        // Battle lines suggestion — row of marker stones
        var markers = [-115, -110, -105, -100, -95, -90, -85, -80, -75, -70, -65, -60, -55, -50, -45];
        for (var mk = 0; mk < markers.length; mk++) {
            makebox(scene, 0.6, 0.8, 0.6, 0x9A9090, markers[mk], 2.4, 120);
        }

        // English shield wall position (low box earthwork)
        makebox(scene, 100, 1.5, 3, 0x7A6A50, -80, 3.75, 118);

        // Norman cavalry approach markers (cone pennants)
        makecylinder(scene, 0.1, 0.1, 4, 6, 0x8B7355, -60, 4, 160);
        makecone(scene, 0.4, 1, 4, 0xFF2222, -60, 6.5, 160);
        makecylinder(scene, 0.1, 0.1, 4, 6, 0x8B7355, -80, 4, 165);
        makecone(scene, 0.4, 1, 4, 0xFF2222, -80, 6.5, 165);
        makecylinder(scene, 0.1, 0.1, 4, 6, 0x8B7355, -100, 4, 160);
        makecone(scene, 0.4, 1, 4, 0xFF2222, -100, 6.5, 160);
    }

    // 6. Hastings Pier — rebuilt modern pier with silver deck and pavilion
    function buildpier(scene) {
        // Pier deck (silver/grey)
        makebox(scene, 12, 1, 120, 0xC0C0C0, 100, 1.5, 0);
        // Pier railings (thin boxes each side)
        makebox(scene, 0.3, 1.5, 120, 0xA8A8A8, 94.15, 2.75, 0);
        makebox(scene, 0.3, 1.5, 120, 0xA8A8A8, 105.85, 2.75, 0);

        // Pier support legs
        var pilecols = [-55, -45, -35, -25, -15, -5, 5, 15, 25, 35, 45, 55];
        for (var p = 0; p < pilecols.length; p++) {
            makecylinder(scene, 0.4, 0.4, 4, 6, 0x888888, 97, 0, pilecols[p]);
            makecylinder(scene, 0.4, 0.4, 4, 6, 0x888888, 103, 0, pilecols[p]);
        }

        // Shore approach section (wider boarding area)
        makebox(scene, 16, 1, 10, 0xC0C0C0, 100, 1.5, -65);
        makebox(scene, 18, 3, 1, 0xB0B0B0, 100, 3, -70);

        // Modern pavilion at pier end
        // Pavilion main structure
        makebox(scene, 22, 8, 18, 0xD0D0D0, 100, 5, 60);
        // Pavilion roof
        makebox(scene, 24, 2, 20, 0xC0C0C0, 100, 9.5, 60);
        // Pavilion glass facade panels (blue-ish)
        makebox(scene, 22, 6, 0.5, 0x87CEEB, 100, 4.5, 51);
        makebox(scene, 22, 6, 0.5, 0x87CEEB, 100, 4.5, 69);
        makebox(scene, 0.5, 6, 18, 0x87CEEB, 89.25, 4.5, 60);
        makebox(scene, 0.5, 6, 18, 0x87CEEB, 110.75, 4.5, 60);
        // Pavilion structural columns
        makecylinder(scene, 0.5, 0.5, 8, 8, 0xB8B8B8, 90, 4, 51);
        makecylinder(scene, 0.5, 0.5, 8, 8, 0xB8B8B8, 110, 4, 51);
        makecylinder(scene, 0.5, 0.5, 8, 8, 0xB8B8B8, 90, 4, 69);
        makecylinder(scene, 0.5, 0.5, 8, 8, 0xB8B8B8, 110, 4, 69);
        // Mast / flagpole
        makecylinder(scene, 0.2, 0.2, 14, 6, 0xAAAAAA, 100, 8, 60);
        makebox(scene, 4, 2, 0.2, 0x0044CC, 100, 16, 60);
    }

    // 7. Smugglers Adventure caves — cave entrance in cliff face
    function buildsmugglerscaves(scene) {
        // Cliff face section (part of East Hill lower area)
        makebox(scene, 30, 12, 8, 0xD2B48C, 30, 6, -35);

        // Main cave entrance arch (dark inset box)
        makebox(scene, 6, 7, 9, 0x1A1210, 30, 3.5, -31);
        // Cave entrance surround (rough rocky)
        makebox(scene, 7, 8, 1, 0xC4A87C, 30, 4, -30);
        makebox(scene, 8, 1, 2, 0xBEA070, 30, 8, -31);

        // Signage board above entrance
        makebox(scene, 8, 2, 0.3, 0x8B4513, 30, 9.5, -29.8);
        // Sign text suggestion (lighter strip)
        makebox(scene, 7, 1, 0.2, 0xFFFFCC, 30, 9.5, -29.6);

        // Secondary passage entrance (smaller)
        makebox(scene, 3, 4, 8, 0x1A1210, 38, 2, -33);
        makebox(scene, 3.5, 4.5, 1, 0xC4A87C, 38, 2, -29);

        // Path leading to cave entrance
        makebox(scene, 5, 0.3, 10, 0xB0A890, 30, 0.15, -25);

        // Rock formations outside cave
        makebox(scene, 2, 2, 2, 0xB09878, 24, 1, -29);
        makebox(scene, 3, 1.5, 2, 0xA88868, 36, 0.75, -28);
        makecylinder(scene, 1, 1.5, 2, 6, 0xBAAA88, 27, 1, -30);
        makecylinder(scene, 0.8, 1.2, 1.5, 6, 0xBAAA88, 34, 0.75, -31);
    }

    // 8. Jerwood Gallery — modern art gallery on the Stade (black with glass)
    function buildjerwoodgallery(scene) {
        // Main building body (black, near net huts)
        makebox(scene, 24, 8, 16, 0x1C1C1C, -55, 4, 25);
        // Roof
        makebox(scene, 25, 1, 17, 0x151515, -55, 8.5, 25);

        // Glass facade panels — front (seaward) face
        makebox(scene, 22, 6, 0.4, 0x87CEEB, -55, 4, 17.2);
        // Glass panel dividers (thin dark frames)
        var framex = [-64, -60, -56, -52, -48, -44];
        for (var f = 0; f < framex.length; f++) {
            makebox(scene, 0.3, 6, 0.5, 0x111111, framex[f], 4, 17.3);
        }
        // Upper clerestory strip
        makebox(scene, 22, 1.5, 0.4, 0x9ADAEB, -55, 7.75, 17.2);

        // Side glass panels
        makebox(scene, 0.4, 6, 14, 0x87CEEB, -43, 4, 25);
        makebox(scene, 0.4, 6, 14, 0x87CEEB, -67, 4, 25);

        // Gallery entrance porch
        makebox(scene, 6, 4, 3, 0x1C1C1C, -55, 2, 15.5);
        makebox(scene, 6, 0.4, 3.5, 0x2A2A2A, -55, 4.2, 15.5);

        // Terrace / promenade
        makebox(scene, 26, 0.6, 8, 0x888888, -55, 0.3, 12);
        // Terrace railing
        makebox(scene, 26, 1, 0.2, 0xAAAAAA, -55, 1.3, 8.1);

        // Sculpture outside (abstract — sphere on box plinth)
        makebox(scene, 1.5, 1.2, 1.5, 0xDDDDDD, -45, 0.6, 13);
        makesphere(scene, 1, 10, 10, 0xCCCCCC, -45, 2.2, 13);

        // Information panel
        makebox(scene, 0.3, 3, 2.5, 0x333333, -63, 1.5, 13);
        makebox(scene, 0.2, 2, 2, 0xF0F0F0, -62.9, 1.5, 13);
    }

    // 9. Old Town — medieval street buildings, St Clement's Church
    function buildoldtown(scene) {
        // Medieval street buildings along the High Street
        var oldbuildings = [
            // [x, z, w, h, d, color]
            [-20, -10, 7, 9, 8, 0xC8B090],
            [-12, -8,  6, 7, 7, 0xD4B898],
            [-5,  -10, 8, 10, 9, 0xC0A870],
            [4,   -8,  6, 8, 7, 0xCCB080],
            [11,  -10, 7, 9, 8, 0xC8AA78],
            [19,  -8,  9, 11, 8, 0xD0B888],
            [29,  -10, 6, 8, 7, 0xC4A870],
            [36,  -8,  8, 10, 9, 0xCCAA78],
            [-28, -10, 5, 7, 6, 0xD2B490],
            [-36, -8,  7, 9, 7, 0xC8A870]
        ];
        for (var ob = 0; ob < oldbuildings.length; ob++) {
            var bld = oldbuildings[ob];
            // Main building
            makebox(scene, bld[2], bld[3], bld[4], bld[5], bld[0], bld[3] / 2, bld[1]);
            // Tiled roof (darker, slightly wider)
            makebox(scene, bld[2] + 1, 2.5, bld[4] + 1, 0x8B4513, bld[0], bld[3] + 1.25, bld[1]);
            // Roof ridge
            makebox(scene, bld[2] + 0.5, 0.8, 0.5, 0x7A3A10, bld[0], bld[3] + 2.65, bld[1]);
        }

        // Jetties / overhangs on older buildings (box overhangs)
        makebox(scene, 8, 0.5, 9.5, 0xB89060, -5, 5, -10);
        makebox(scene, 9.5, 0.5, 8.5, 0xAA8050, 19, 6, -8);

        // Shop signs hanging (thin boxes)
        makebox(scene, 1.5, 1, 0.2, 0xCC8822, -12, 7, -4.6);
        makebox(scene, 1.5, 1, 0.2, 0xCC8822, 4, 6.5, -4.6);

        // St Clement's Church — central landmark
        // Nave body
        makebox(scene, 14, 10, 20, 0xC8C0B0, 0, 5, -28);
        // Chancel (narrower east end)
        makebox(scene, 10, 10, 8, 0xC0B8A8, 0, 5, -42);
        // Nave roof
        makebox(scene, 15, 2, 21, 0x8B7060, 0, 11.5, -28);
        // Church tower (square, thick)
        makebox(scene, 7, 18, 7, 0xC0B8A8, -4, 9, -19);
        // Tower battlements
        var tmerlon = [
            [-7, -22], [-5, -22], [-3, -22], [-1, -22], [1, -22], [3, -22],
            [-7, -16], [-1, -16], [1, -16],
            [-6.5, -19], [-6.5, -21]
        ];
        for (var tm = 0; tm < tmerlon.length; tm++) {
            makebox(scene, 1.8, 2.5, 1.8, 0xC0B8A8, tmerlon[tm][0], 19.25, tmerlon[tm][1]);
        }
        // Church spire — ConeGeometry on tower
        makecone(scene, 3.8, 14, 8, 0x707060, -4, 25, -19);

        // Porch
        makebox(scene, 4, 5, 4, 0xC8C0B0, 0, 2.5, -18);
        makebox(scene, 4.5, 0.5, 4.5, 0xB8B0A0, 0, 5.25, -18);
        // Church arched doorway (dark recess)
        makebox(scene, 2, 3.5, 0.5, 0x2A2218, 0, 1.75, -16.2);

        // Churchyard wall and gravestones
        makebox(scene, 30, 1.5, 1, 0xA0A090, 0, 0.75, -14);
        makebox(scene, 1, 1.5, 30, 0xA0A090, 15, 0.75, -28);
        makebox(scene, 1, 1.5, 30, 0xA0A090, -15, 0.75, -28);
        // Gravestones
        var graves = [
            [8, -22], [-8, -22], [12, -26], [-12, -26], [5, -30], [-5, -30],
            [10, -32], [-10, -32], [3, -36], [-3, -36]
        ];
        for (var gv = 0; gv < graves.length; gv++) {
            makebox(scene, 0.4, 1.2, 0.8, 0xB0B0A0, graves[gv][0], 0.6, graves[gv][1]);
        }
    }

    // 10. Pelham Crescent — Regency cream terraced houses overlooking sea
    function buildpelhamcrescent(scene) {
        // Curved terrace of cream Regency houses — approximated with boxes on slight arc
        // Central section (3 units wide)
        makebox(scene, 24, 14, 12, 0xFFF8DC, 0, 7, -100);
        // Left wing (angled slightly)
        makebox(scene, 18, 14, 12, 0xFFF8DC, -20, 7, -98);
        makebox(scene, 18, 14, 12, 0xFFF8DC, -38, 7, -93);
        makebox(scene, 15, 12, 12, 0xFFF8DC, -53, 6, -85);
        // Right wing
        makebox(scene, 18, 14, 12, 0xFFF8DC, 20, 7, -98);
        makebox(scene, 18, 14, 12, 0xFFF8DC, 38, 7, -93);
        makebox(scene, 15, 12, 12, 0xFFF8DC, 53, 6, -85);

        // Roofline details — parapet bands
        makebox(scene, 24, 1.5, 13, 0xF0E8CC, 0, 14.75, -100);
        makebox(scene, 18, 1.5, 13, 0xF0E8CC, -20, 14.75, -98);
        makebox(scene, 18, 1.5, 13, 0xF0E8CC, 20, 14.75, -98);
        makebox(scene, 18, 1.5, 13, 0xF0E8CC, -38, 14.75, -93);
        makebox(scene, 18, 1.5, 13, 0xF0E8CC, 38, 14.75, -93);

        // Window details — rows of dark window boxes on facade
        var winxouter = [-20, -12, -4, 4, 12, 20];
        var winy = [4, 8, 12];
        for (var wr = 0; wr < winy.length; wr++) {
            for (var wc = 0; wc < winxouter.length; wc++) {
                makebox(scene, 1.8, 2.2, 0.3, 0x5A7A9A, winxouter[wc], winy[wr], -93.9);
            }
        }

        // Columns / pilasters on central section
        var pilasters = [-10, -5, 0, 5, 10];
        for (var pl = 0; pl < pilasters.length; pl++) {
            makecylinder(scene, 0.4, 0.4, 12, 8, 0xF0E8CC, pilasters[pl], 6, -94);
        }

        // Balconies (thin box shelves with railings)
        makebox(scene, 24, 0.4, 2, 0xE8E0CC, 0, 7.2, -93.8);
        makebox(scene, 24, 0.4, 2, 0xE8E0CC, 0, 10.2, -93.8);
        // Balcony railings
        makebox(scene, 24, 1, 0.1, 0xC8C0A8, 0, 7.8, -92.85);
        makebox(scene, 24, 1, 0.1, 0xC8C0A8, 0, 10.8, -92.85);

        // Steps down to sea promenade
        makebox(scene, 14, 1, 4, 0xEEE8D0, 0, 0.5, -88);
        makebox(scene, 14, 1, 4, 0xEEE8D0, 0, 1.5, -84);
        makebox(scene, 14, 1, 4, 0xEEE8D0, 0, 2.5, -80);

        // Promenade bench seats
        var benches = [-30, -15, 0, 15, 30];
        for (var bn = 0; bn < benches.length; bn++) {
            makebox(scene, 3, 0.4, 0.8, 0x8B7355, benches[bn], 0.9, -76);
            makebox(scene, 3, 1, 0.3, 0x7A6344, benches[bn], 1.3, -75.7);
            makecylinder(scene, 0.1, 0.1, 1, 6, 0x7A6344, benches[bn] - 1.3, 0.7, -76);
            makecylinder(scene, 0.1, 0.1, 1, 6, 0x7A6344, benches[bn] + 1.3, 0.7, -76);
        }

        // Pelham Place hotel / pub (end of crescent)
        makebox(scene, 10, 12, 10, 0xFFF8DC, -62, 6, -78);
        makebox(scene, 11, 1.5, 11, 0xF0E8CC, -62, 12.75, -78);
        // Sign
        makebox(scene, 6, 1.5, 0.3, 0x8B4513, -62, 8, -73);
    }

    // Ground plane / promenade
    function buildgroundbase(scene) {
        // Main seafront promenade ground
        makebox(scene, 300, 0.6, 60, 0xC8C4B8, 0, 0.3, -68);
        // Beach
        makebox(scene, 300, 0.8, 80, 0xD4C8A8, 0, 0.4, -20);
        // Sea (blue box)
        makebox(scene, 300, 0.5, 60, 0x2255AA, 0, 0.25, -110);
    }

    function init(scene) {
        buildgroundbase(scene);
        buildhastingscastle(scene);
        buildeasthill(scene);
        buildrockanore(scene);
        buildbattleabbey(scene);
        buildbattlefield(scene);
        buildpier(scene);
        buildsmugglerscaves(scene);
        buildjerwoodgallery(scene);
        buildoldtown(scene);
        buildpelhamcrescent(scene);
    }

    function update(dt) {
    }

    function reset() {
    }

    return {
        init: init,
        update: update,
        reset: reset
    };

}());
