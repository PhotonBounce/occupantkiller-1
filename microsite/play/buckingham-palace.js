window.BuckinghamPalace = (function() {
    'use strict';

    var WX = 4720;
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

    function buildpalacefacade(scene) {
        // Main palace facade — long Portland stone block
        makebox(scene, 50, 14, 10, 0xFFF8DC, 0, 7, 0);
        // Central projecting balcony section
        makebox(scene, 12, 14, 2, 0xFFF8DC, 0, 7, -6);
        // Balcony platform
        makebox(scene, 10, 0.8, 2.5, 0xEEE8CC, 0, 9, -7.2);
        // Balcony railing posts
        var bposts = [-4, -2, 0, 2, 4];
        for (var i = 0; i < bposts.length; i++) {
            makebox(scene, 0.2, 1.5, 0.2, 0xCCBB88, bposts[i], 9.75, -7.5);
        }
        // Balcony rail top
        makebox(scene, 10, 0.2, 0.2, 0xCCBB88, 0, 10.5, -7.5);
        // Left flanking wing
        makebox(scene, 14, 12, 8, 0xFFF8DC, -32, 6, 0);
        // Right flanking wing
        makebox(scene, 14, 12, 8, 0xFFF8DC, 32, 6, 0);
        // Roof cornice
        makebox(scene, 52, 1.5, 11, 0xEEE8CC, 0, 14.75, 0);
        // Left wing cornice
        makebox(scene, 15, 1.2, 9, 0xEEE8CC, -32, 12.6, 0);
        // Right wing cornice
        makebox(scene, 15, 1.2, 9, 0xEEE8CC, 32, 12.6, 0);
        // Ground floor window recesses — front facade
        var winpositions = [-20, -14, -8, 8, 14, 20];
        for (var w = 0; w < winpositions.length; w++) {
            makebox(scene, 2, 4, 0.4, 0xCCCCAA, winpositions[w], 6, -5.3);
            makebox(scene, 2, 4, 0.4, 0xCCCCAA, winpositions[w], 10, -5.3);
        }
        // Pilasters on central section
        makebox(scene, 0.8, 14, 0.8, 0xEEE8CC, -5, 7, -5.5);
        makebox(scene, 0.8, 14, 0.8, 0xEEE8CC, 5, 7, -5.5);
        // Central pediment
        makecone(scene, 7, 3, 4, 0xFFF8DC, 0, 16, -5.5);
        // Palace chimneys
        var chimneys = [-22, -10, 10, 22];
        for (var c = 0; c < chimneys.length; c++) {
            makebox(scene, 1.2, 3, 1.2, 0xEEE8CC, chimneys[c], 16.5, 2);
        }
    }

    function buildgatescreens(scene) {
        // Main gate piers (large stone columns)
        makebox(scene, 2, 10, 2, 0xEEE8CC, -13, 5, -15);
        makebox(scene, 2, 10, 2, 0xEEE8CC, 13, 5, -15);
        // Gate pier tops — gold finials
        makebox(scene, 2.5, 1, 2.5, 0xFFD700, -13, 10.5, -15);
        makebox(scene, 2.5, 1, 2.5, 0xFFD700, 13, 10.5, -15);
        makesphere(scene, 0.8, 8, 8, 0xFFD700, -13, 11.5, -15);
        makesphere(scene, 0.8, 8, 8, 0xFFD700, 13, 11.5, -15);
        // Iron railing panels — left side
        var leftposts = [-12, -11, -10, -9, -8, -7, -6, -5];
        for (var l = 0; l < leftposts.length; l++) {
            makebox(scene, 0.25, 7, 0.25, 0x1C1C1C, leftposts[l], 3.5, -15);
            // Gold tops on railings
            makebox(scene, 0.4, 0.5, 0.4, 0xFFD700, leftposts[l], 7.25, -15);
            makecone(scene, 0.2, 0.6, 4, 0xFFD700, leftposts[l], 7.8, -15);
        }
        // Railing horizontal rails left
        makebox(scene, 8, 0.3, 0.2, 0x1C1C1C, -9, 2, -15);
        makebox(scene, 8, 0.3, 0.2, 0x1C1C1C, -9, 5, -15);
        // Iron railing panels — right side
        var rightposts = [5, 6, 7, 8, 9, 10, 11, 12];
        for (var r = 0; r < rightposts.length; r++) {
            makebox(scene, 0.25, 7, 0.25, 0x1C1C1C, rightposts[r], 3.5, -15);
            makebox(scene, 0.4, 0.5, 0.4, 0xFFD700, rightposts[r], 7.25, -15);
            makecone(scene, 0.2, 0.6, 4, 0xFFD700, rightposts[r], 7.8, -15);
        }
        // Railing horizontal rails right
        makebox(scene, 8, 0.3, 0.2, 0x1C1C1C, 9, 2, -15);
        makebox(scene, 8, 0.3, 0.2, 0x1C1C1C, 9, 5, -15);
        // Central gate opening — gate bars
        var centralposts = [-3, -2, -1, 0, 1, 2, 3];
        for (var cp = 0; cp < centralposts.length; cp++) {
            makebox(scene, 0.25, 8, 0.25, 0x1C1C1C, centralposts[cp], 4, -15);
            makecone(scene, 0.25, 0.7, 4, 0xFFD700, centralposts[cp], 8.35, -15);
        }
        // Side railing walls extending to palace wings
        makebox(scene, 16, 6, 0.4, 0x1C1C1C, -22, 3, -15);
        makebox(scene, 16, 6, 0.4, 0x1C1C1C, 22, 3, -15);
        // Perimeter black iron railing across forecourt
        var perimeterx = [-38, -30, -22, 22, 30, 38];
        for (var pe = 0; pe < perimeterx.length; pe++) {
            makebox(scene, 0.3, 5, 0.3, 0x1C1C1C, perimeterx[pe], 2.5, -30);
        }
        makebox(scene, 78, 0.4, 0.3, 0x1C1C1C, 0, 5, -30);
    }

    function buildforecourt(scene) {
        // Large gravel forecourt
        makebox(scene, 60, 0.3, 30, 0xD2B48C, 0, 0.15, -20);
        // Perimeter black iron railing side runs
        makebox(scene, 0.3, 5, 30, 0x1C1C1C, -38, 2.5, -20);
        makebox(scene, 0.3, 5, 30, 0x1C1C1C, 38, 2.5, -20);
        // Corner railing piers
        makebox(scene, 1.5, 6, 1.5, 0x2A2A2A, -38, 3, -30);
        makebox(scene, 1.5, 6, 1.5, 0x2A2A2A, 38, 3, -30);
        makebox(scene, 1.5, 6, 1.5, 0x2A2A2A, -38, 3, -8);
        makebox(scene, 1.5, 6, 1.5, 0x2A2A2A, 38, 3, -8);
    }

    function buildvictoriamemorial(scene) {
        // Stone plinth base
        makebox(scene, 6, 4, 6, 0xEEE8CC, 0, 2, -38);
        // Step tiers
        makebox(scene, 8, 1, 8, 0xEEE8CC, 0, 0.5, -38);
        makebox(scene, 9, 0.5, 9, 0xEEE8CC, 0, 0.25, -38);
        // Drum cylinder
        makecylinder(scene, 4, 4, 3, 16, 0xEEE8CC, 0, 5.5, -38);
        // Upper drum cap
        makebox(scene, 9, 1, 9, 0xEEE8CC, 0, 7.2, -38);
        // Gold sphere top
        makesphere(scene, 1.2, 12, 12, 0xFFD700, 0, 9, -38);
        // Winged victory figure on top — cylinder body
        makecylinder(scene, 0.4, 0.5, 2.5, 8, 0xEEE8CC, 0, 10.25, -38);
        makebox(scene, 0.7, 0.8, 0.6, 0xEEE8CC, 0, 11.65, -38);
        // Allegorical figures on plinth sides
        var figoffsets = [
            [0, -42], [0, -34], [-4, -38], [4, -38]
        ];
        for (var f = 0; f < figoffsets.length; f++) {
            makebox(scene, 1, 3, 0.7, 0xEEE8CC, figoffsets[f][0], 5.5, figoffsets[f][1]);
            makesphere(scene, 0.5, 6, 6, 0xEEE8CC, figoffsets[f][0], 7.5, figoffsets[f][1]);
        }
        // Four seated lion figures
        var lionpos = [
            [-5, -41], [5, -41], [-5, -35], [5, -35]
        ];
        for (var li = 0; li < lionpos.length; li++) {
            makebox(scene, 1.5, 1.2, 2, 0xD4A060, lionpos[li][0], 1.1, lionpos[li][1]);
            makebox(scene, 1, 1, 1, 0xD4A060, lionpos[li][0] + 0.3, 2.1, lionpos[li][1] - 0.8);
        }
    }

    function buildthemall(scene) {
        // The Mall ceremonial road surface — reddish gravel
        makebox(scene, 8, 0.2, 60, 0xD2691E, -60, 0.1, -38);
        // Flanking tree-lined grass verges
        makebox(scene, 6, 0.1, 60, 0x4A7A30, -68, 0.05, -38);
        makebox(scene, 6, 0.1, 60, 0x4A7A30, -52, 0.05, -38);
        // Flagpoles on left side of Mall
        var mallflagL = [-48, -52, -56, -60, -64, -68, -72, -76, -80, -84];
        for (var fl = 0; fl < mallflagL.length; fl++) {
            makecylinder(scene, 0.12, 0.12, 10, 6, 0xAAAAAA, -65, 5, mallflagL[fl]);
            // Union Jack colors — blue, red, white blocks
            makebox(scene, 2.5, 0.5, 0.1, 0x003399, -63.75, 10, mallflagL[fl]);
            makebox(scene, 2.5, 0.5, 0.1, 0xCC0000, -63.75, 9.5, mallflagL[fl]);
            makebox(scene, 2.5, 0.5, 0.1, 0xFFFFFF, -63.75, 9, mallflagL[fl]);
        }
        // Flagpoles on right side of Mall
        var mallflagR = [-48, -52, -56, -60, -64, -68, -72, -76, -80, -84];
        for (var fr = 0; fr < mallflagR.length; fr++) {
            makecylinder(scene, 0.12, 0.12, 10, 6, 0xAAAAAA, -55, 5, mallflagR[fr]);
            makebox(scene, 2.5, 0.5, 0.1, 0x003399, -53.75, 10, mallflagR[fr]);
            makebox(scene, 2.5, 0.5, 0.1, 0xCC0000, -53.75, 9.5, mallflagR[fr]);
            makebox(scene, 2.5, 0.5, 0.1, 0xFFFFFF, -53.75, 9, mallflagR[fr]);
        }
        // Mall central divider line
        makebox(scene, 0.3, 0.25, 60, 0xFFFFCC, -60, 0.12, -38);
    }

    function buildstjamespark(scene) {
        // Main park ground
        makebox(scene, 50, 0.3, 40, 0x228B22, -90, 0.15, -30);
        // Park lake — blue rectangle
        makebox(scene, 30, 0.25, 8, 0x4169E1, -90, 0.5, -28);
        // Lake bank details
        makebox(scene, 32, 0.3, 0.8, 0x8B6914, -90, 0.4, -24.5);
        makebox(scene, 32, 0.3, 0.8, 0x8B6914, -90, 0.4, -31.5);
        // Pelican shapes on bank
        var pelicanpos = [-96, -90, -84];
        for (var p = 0; p < pelicanpos.length; p++) {
            // Pelican body
            makebox(scene, 1, 0.8, 1.5, 0xFFFFFF, pelicanpos[p], 1.1, -23);
            // Pelican neck
            makebox(scene, 0.4, 1, 0.4, 0xFFFFFF, pelicanpos[p], 2, -23.3);
            // Pelican head
            makebox(scene, 0.6, 0.6, 0.6, 0xFFFFFF, pelicanpos[p], 2.8, -23.5);
            // Pelican beak
            makebox(scene, 0.2, 0.2, 0.8, 0xFFA500, pelicanpos[p], 2.75, -24.1);
        }
        // Park trees
        var treepos = [
            [-82, -20], [-88, -18], [-95, -22], [-100, -26],
            [-82, -40], [-88, -42], [-95, -38], [-100, -34],
            [-78, -30], [-104, -30]
        ];
        for (var t = 0; t < treepos.length; t++) {
            makecylinder(scene, 0.3, 0.4, 3, 6, 0x5C3A1E, treepos[t][0], 1.5, treepos[t][1]);
            makecone(scene, 2.5, 5, 8, 0x2D5A1B, treepos[t][0], 5.5, treepos[t][1]);
        }
        // Footpath through park
        makebox(scene, 2, 0.2, 36, 0xDEB887, -90, 0.35, -32);
        makebox(scene, 30, 0.2, 2, 0xDEB887, -90, 0.35, -14);
        // Park benches
        var benchpos = [
            [-84, -18], [-96, -18], [-84, -46], [-96, -46]
        ];
        for (var b = 0; b < benchpos.length; b++) {
            makebox(scene, 2.5, 0.2, 0.8, 0x8B6914, benchpos[b][0], 0.8, benchpos[b][1]);
            makebox(scene, 2.5, 1, 0.15, 0x8B6914, benchpos[b][0], 1, benchpos[b][1] + 0.3);
            makebox(scene, 0.2, 1, 0.8, 0x6B4A14, benchpos[b][0] - 1.1, 0.5, benchpos[b][1]);
            makebox(scene, 0.2, 1, 0.8, 0x6B4A14, benchpos[b][0] + 1.1, 0.5, benchpos[b][1]);
        }
    }

    function buildguards(scene) {
        // Changing of the Guard — box guards with bearskin hats
        // Formation in the forecourt
        var guardpositions = [
            [-10, -18], [-6, -18], [-2, -18], [2, -18], [6, -18], [10, -18],
            [-8, -21], [-4, -21], [0, -21], [4, -21], [8, -21]
        ];
        for (var g = 0; g < guardpositions.length; g++) {
            var gx = guardpositions[g][0];
            var gz = guardpositions[g][1];
            // Boots
            makebox(scene, 0.8, 0.6, 0.8, 0x1C1C1C, gx, 0.3, gz);
            // Trousers
            makebox(scene, 0.9, 1.6, 0.7, 0x1A237E, gx, 1.3, gz);
            // Tunic
            makebox(scene, 1.1, 1.4, 0.8, 0xCC0000, gx, 2.7, gz);
            // Crossbelt
            makebox(scene, 0.15, 1.4, 0.9, 0xFFFFFF, gx, 2.7, gz);
            // Arms at sides
            makebox(scene, 0.35, 1.2, 0.35, 0xCC0000, gx - 0.7, 2.7, gz);
            makebox(scene, 0.35, 1.2, 0.35, 0xCC0000, gx + 0.7, 2.7, gz);
            // Head
            makebox(scene, 0.7, 0.7, 0.7, 0xFFDAB9, gx, 4.15, gz);
            // Bearskin hat — tall black cylinder
            makecylinder(scene, 0.45, 0.45, 2, 8, 0x1C1C1C, gx, 5.5, gz);
            // Hat top plate
            makebox(scene, 0.95, 0.2, 0.95, 0x1C1C1C, gx, 6.6, gz);
            // Rifle
            makebox(scene, 0.12, 2.8, 0.12, 0x5C3A1E, gx + 0.6, 2.5, gz - 0.1);
            // Bayonet
            makebox(scene, 0.06, 0.8, 0.06, 0x888888, gx + 0.6, 4.3, gz - 0.1);
        }
        // Sergeant-at-arms — different color sash
        makebox(scene, 0.9, 1.6, 0.7, 0x1A237E, 0, 1.3, -25);
        makebox(scene, 1.1, 1.4, 0.8, 0xCC0000, 0, 2.7, -25);
        makebox(scene, 0.7, 0.7, 0.7, 0xFFDAB9, 0, 4.15, -25);
        makecylinder(scene, 0.45, 0.45, 2, 8, 0x1C1C1C, 0, 5.5, -25);
        makebox(scene, 0.95, 0.2, 0.95, 0x1C1C1C, 0, 6.6, -25);
        // Sash
        makebox(scene, 0.15, 1.4, 0.9, 0xFFD700, 0, 2.7, -25);
    }

    function buildclarencehouse(scene) {
        // Clarence House — cream royal residence to the east
        makebox(scene, 14, 8, 6, 0xFFF8DC, 55, 4, -5);
        // Roof
        makebox(scene, 15, 1.5, 7, 0xEEE8CC, 55, 8.75, -5);
        // Windows
        makebox(scene, 2, 3, 0.4, 0xCCCCAA, 49, 4, -8.2);
        makebox(scene, 2, 3, 0.4, 0xCCCCAA, 53, 4, -8.2);
        makebox(scene, 2, 3, 0.4, 0xCCCCAA, 57, 4, -8.2);
        makebox(scene, 2, 3, 0.4, 0xCCCCAA, 61, 4, -8.2);
        // Door
        makebox(scene, 2, 4, 0.5, 0x5C3A1E, 55, 2, -8.3);
        // Pillared porch
        makecylinder(scene, 0.3, 0.3, 5, 8, 0xEEE8CC, 53.5, 2.5, -8.5);
        makecylinder(scene, 0.3, 0.3, 5, 8, 0xEEE8CC, 56.5, 2.5, -8.5);
        makebox(scene, 4, 0.5, 1, 0xEEE8CC, 55, 5.25, -8.5);
        // Chimneys
        makebox(scene, 1, 2, 1, 0xEEE8CC, 52, 10.5, -5);
        makebox(scene, 1, 2, 1, 0xEEE8CC, 58, 10.5, -5);
        // Boundary wall
        makebox(scene, 16, 3, 0.4, 0xEEE8CC, 55, 1.5, -13);
        makebox(scene, 0.4, 3, 10, 0xEEE8CC, 47, 1.5, -8);
        makebox(scene, 0.4, 3, 10, 0xEEE8CC, 63, 1.5, -8);
    }

    function buildhorseguards(scene) {
        // Horse Guards building — Whitehall side
        // Main archway building
        makebox(scene, 20, 12, 8, 0xEEE8CC, 40, 6, -60);
        // Central arch opening
        makebox(scene, 6, 8, 9, 0x333333, 40, 4, -60);
        makebox(scene, 5.5, 7, 10, 0x222222, 40, 3.5, -60);
        // Clock tower over arch
        makebox(scene, 5, 8, 5, 0xEEE8CC, 40, 16, -60);
        // Clock face
        makebox(scene, 3, 3, 0.3, 0xFFFFFF, 40, 17, -64.2);
        makebox(scene, 3, 3, 0.3, 0xFFFFFF, 40, 17, -55.8);
        // Clock tower roof
        makecone(scene, 3, 4, 4, 0x778899, 40, 22, -60);
        // Flanking wings
        makebox(scene, 8, 10, 8, 0xEEE8CC, 28, 5, -60);
        makebox(scene, 8, 10, 8, 0xEEE8CC, 52, 5, -60);
        // Corner turrets
        makecylinder(scene, 1.5, 1.5, 12, 8, 0xEEE8CC, 24, 6, -56);
        makecylinder(scene, 1.5, 1.5, 12, 8, 0xEEE8CC, 24, 6, -64);
        makecylinder(scene, 1.5, 1.5, 12, 8, 0xEEE8CC, 56, 6, -56);
        makecylinder(scene, 1.5, 1.5, 12, 8, 0xEEE8CC, 56, 6, -64);
        makecone(scene, 1.8, 3, 6, 0x778899, 24, 13.5, -56);
        makecone(scene, 1.8, 3, 6, 0x778899, 24, 13.5, -64);
        makecone(scene, 1.8, 3, 6, 0x778899, 56, 13.5, -56);
        makecone(scene, 1.8, 3, 6, 0x778899, 56, 13.5, -64);
        // Parade ground in front
        makebox(scene, 30, 0.2, 20, 0xD2B48C, 40, 0.1, -48);
        // Mounted guard figures
        var mountedpos = [35, 45];
        for (var m = 0; m < mountedpos.length; m++) {
            var mx = mountedpos[m];
            // Horse body
            makebox(scene, 3, 2, 1.5, 0x5C3A1E, mx, 2, -52);
            // Horse neck
            makebox(scene, 0.8, 1.5, 0.8, 0x5C3A1E, mx - 1.2, 2.8, -52.3);
            // Horse head
            makebox(scene, 0.7, 0.9, 1, 0x5C3A1E, mx - 1.8, 3.6, -52.3);
            // Horse legs
            makebox(scene, 0.4, 1.6, 0.4, 0x4A2E14, mx - 0.8, 0.8, -52.5);
            makebox(scene, 0.4, 1.6, 0.4, 0x4A2E14, mx + 0.8, 0.8, -52.5);
            makebox(scene, 0.4, 1.6, 0.4, 0x4A2E14, mx - 0.8, 0.8, -51.5);
            makebox(scene, 0.4, 1.6, 0.4, 0x4A2E14, mx + 0.8, 0.8, -51.5);
            // Rider body
            makebox(scene, 1, 1.6, 0.7, 0xCC0000, mx, 4.3, -52);
            // Rider head
            makebox(scene, 0.7, 0.7, 0.7, 0xFFDAB9, mx, 5.35, -52);
            // Rider bearskin
            makecylinder(scene, 0.42, 0.42, 1.8, 8, 0x1C1C1C, mx, 6.5, -52);
        }
    }

    function buildgreenpark(scene) {
        // Green Park — open parkland
        makebox(scene, 30, 0.3, 20, 0x228B22, -30, 0.15, -75);
        // Park trees scattered
        var gtreepos = [
            [-22, -70], [-18, -80], [-30, -72], [-38, -76], [-42, -68],
            [-26, -86], [-34, -90], [-20, -88], [-44, -84], [-16, -74]
        ];
        for (var gt = 0; gt < gtreepos.length; gt++) {
            makecylinder(scene, 0.3, 0.35, 3.5, 6, 0x4A2C0A, gtreepos[gt][0], 1.75, gtreepos[gt][1]);
            makecone(scene, 2.2, 4.5, 8, 0x1A5C0A, gtreepos[gt][0], 5, gtreepos[gt][1]);
        }
        // Deckchairs scattered on grass
        var deckchairpos = [
            [-24, -74], [-26, -78], [-32, -76], [-34, -72], [-28, -80]
        ];
        for (var dc = 0; dc < deckchairpos.length; dc++) {
            // Seat base
            makebox(scene, 1.5, 0.15, 0.7, 0x4444CC, deckchairpos[dc][0], 0.5, deckchairpos[dc][1]);
            // Backrest
            makebox(scene, 1.5, 0.9, 0.1, 0x4444CC, deckchairpos[dc][0], 1.0, deckchairpos[dc][1] + 0.25);
            // Frame legs
            makebox(scene, 0.1, 0.5, 0.7, 0xAA8833, deckchairpos[dc][0] - 0.6, 0.25, deckchairpos[dc][1]);
            makebox(scene, 0.1, 0.5, 0.7, 0xAA8833, deckchairpos[dc][0] + 0.6, 0.25, deckchairpos[dc][1]);
        }
        // Park entrance gate
        makebox(scene, 0.3, 4, 0.3, 0x1C1C1C, -15.5, 2, -75);
        makebox(scene, 0.3, 4, 0.3, 0x1C1C1C, -14.5, 2, -75);
        makebox(scene, 1.5, 0.3, 0.3, 0x1C1C1C, -15, 4, -75);
    }

    function buildconstitutionhill(scene) {
        // Constitution Hill — road along south side of palace gardens
        makebox(scene, 4, 0.25, 55, 0xAA8866, 30, 0.12, -35);
        // Garden wall on north side
        makebox(scene, 0.5, 4, 55, 0xEEE8CC, 27.5, 2, -35);
        // Trees along Constitution Hill
        var chillpos = [-15, -22, -29, -36, -43, -50, -57];
        for (var ch = 0; ch < chillpos.length; ch++) {
            makecylinder(scene, 0.25, 0.3, 3, 6, 0x4A2C0A, 32, 1.5, chillpos[ch]);
            makecone(scene, 1.8, 3.5, 8, 0x1A5C0A, 32, 4, chillpos[ch]);
            makecylinder(scene, 0.25, 0.3, 3, 6, 0x4A2C0A, 28.5, 1.5, chillpos[ch]);
            makecone(scene, 1.8, 3.5, 8, 0x1A5C0A, 28.5, 4, chillpos[ch]);
        }
        // Palace south garden ground
        makebox(scene, 26, 0.2, 55, 0x2E7D32, 14, 0.1, -35);
        // Garden flower beds (decorative boxes)
        makebox(scene, 4, 0.3, 4, 0xCC4488, 10, 0.3, -25);
        makebox(scene, 4, 0.3, 4, 0xFFAA00, 16, 0.3, -25);
        makebox(scene, 4, 0.3, 4, 0xCC4488, 22, 0.3, -30);
        makebox(scene, 4, 0.3, 4, 0xFFAA00, 10, 0.3, -40);
        // Garden fountain
        makecylinder(scene, 3, 3.5, 0.5, 10, 0x9999AA, 16, 0.4, -40);
        makecylinder(scene, 0.3, 0.3, 3, 8, 0x9999AA, 16, 1.75, -40);
        makecylinder(scene, 1.5, 1.5, 0.3, 10, 0x9999AA, 16, 3.15, -40);
    }

    function buildpalaceground(scene) {
        // Ground plane for immediate palace area
        makebox(scene, 120, 0.2, 120, 0x4A7A30, 0, 0, 0);
    }

    function init(scene) {
        buildpalaceground(scene);
        buildpalacefacade(scene);
        buildgatescreens(scene);
        buildforecourt(scene);
        buildvictoriamemorial(scene);
        buildthemall(scene);
        buildstjamespark(scene);
        buildguards(scene);
        buildclarencehouse(scene);
        buildhorseguards(scene);
        buildgreenpark(scene);
        buildconstitutionhill(scene);
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
