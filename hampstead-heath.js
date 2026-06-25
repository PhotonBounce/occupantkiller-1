window.HampsteadHeath = (function() {
    'use strict';

    var WX = 5040;
    var WZ = 2200;

    // Animated kite meshes for update()
    var kites = [];
    var kiteAnims = [];

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

    // 1. Parliament Hill — famous viewpoint overlooking London
    function buildparliamenthill(scene) {
        // Broad hill rising to y=18
        makebox(scene, 80, 6, 80, 0x5E8C3E, 0, 3, 0);
        makebox(scene, 60, 6, 60, 0x5E8C3E, 0, 9, 0);
        makebox(scene, 40, 6, 40, 0x5E8C3E, 0, 15, 0);
        // Summit plateau
        makebox(scene, 28, 1, 28, 0x6AAA46, 0, 18.5, 0);
        // Trig point marker
        makecylinder(scene, 0.4, 0.6, 1.2, 8, 0xAAAAAA, 0, 19.1, 0);
        makebox(scene, 1.2, 0.4, 1.2, 0x999999, 0, 19.8, 0);
        // London skyline suggestion — small box skyscrapers in far distance (sky blue tint)
        var skyline = [
            [0, 4, -160, 3, 22, 3],
            [6, 4, -160, 4, 30, 4],
            [12, 4, -162, 3, 26, 3],
            [-6, 4, -161, 3, 18, 3],
            [18, 4, -159, 2, 20, 2],
            [-12, 4, -160, 2, 24, 2],
            [24, 4, -163, 3, 28, 3],
            [-18, 4, -162, 2, 16, 2],
            [30, 4, -161, 2, 22, 2],
            [-24, 4, -163, 3, 20, 3],
            [36, 4, -160, 2, 18, 2],
            [-30, 4, -161, 2, 26, 2]
        ];
        for (var i = 0; i < skyline.length; i++) {
            var s = skyline[i];
            makebox(scene, s[3], s[4], s[5], 0x87CEEB, s[0], s[1] + s[4] / 2, s[2]);
        }
        // Flagpole on summit
        makecylinder(scene, 0.12, 0.12, 8, 6, 0x888888, 2, 22.5, 2);
        makebox(scene, 3, 1.5, 0.1, 0xCC1111, 3.5, 26, 2);
    }

    // 2. Hampstead Heath ponds — 3 swimming ponds with changing huts
    function buildheatponds(scene) {
        // Men's pond (largest)
        makebox(scene, 24, 0.5, 18, 0x4169E1, -90, 0.25, 60);
        // Changing huts men's pond
        makebox(scene, 6, 3, 4, 0xA0522D, -104, 1.5, 60);
        makebox(scene, 6, 0.6, 4.4, 0x8B4513, -104, 3.3, 60);
        // Bench near men's pond
        makebox(scene, 4, 0.3, 1, 0x8B6914, -96, 0.65, 52);
        makebox(scene, 0.2, 0.8, 0.2, 0x6B4F10, -94, 0.4, 51.5);
        makebox(scene, 0.2, 0.8, 0.2, 0x6B4F10, -94, 0.4, 52.5);
        makebox(scene, 0.2, 0.8, 0.2, 0x6B4F10, -98, 0.4, 51.5);
        makebox(scene, 0.2, 0.8, 0.2, 0x6B4F10, -98, 0.4, 52.5);

        // Ladies' pond (medium)
        makebox(scene, 18, 0.5, 14, 0x4169E1, -90, 0.25, 85);
        // Changing huts ladies' pond
        makebox(scene, 5, 3, 3.5, 0x9A7A5A, -104, 1.5, 85);
        makebox(scene, 5, 0.5, 4, 0x8B4513, -104, 3.25, 85);

        // Mixed bathing pond (smallest)
        makebox(scene, 14, 0.5, 10, 0x4169E1, -90, 0.25, 106);
        // Changing huts mixed pond
        makebox(scene, 4, 2.8, 3, 0xA07850, -102, 1.4, 106);
        makebox(scene, 4, 0.4, 3.4, 0x8B4513, -102, 2.8, 106);

        // Wooden jetty suggestion at men's pond
        makebox(scene, 8, 0.3, 2, 0x8B6914, -83, 0.65, 60);
        // Reed edge decorations
        for (var r = 0; r < 5; r++) {
            makecylinder(scene, 0.1, 0.15, 2.5, 5, 0x556B2F, -78 + r * 2, 1.25, 60);
        }
    }

    // 3. Kenwood House — neoclassical mansion
    function buildkenwoodhouse(scene) {
        // Main house body (24×10×8)
        makebox(scene, 24, 10, 8, 0xFFFFFF, 60, 5, -60);
        // Blue-grey wings
        makebox(scene, 8, 8, 7, 0xB0C4D8, 48, 4, -60);
        makebox(scene, 8, 8, 7, 0xB0C4D8, 72, 4, -60);
        // Portico columns (cylinders across front)
        var colx = [-4, -1.5, 1, 3.5];
        for (var c = 0; c < colx.length; c++) {
            makecylinder(scene, 0.4, 0.4, 10, 10, 0xF8F8F8, 60 + colx[c], 5, -64.5);
        }
        // Portico pediment
        makebox(scene, 10, 2, 1, 0xF0F0F0, 60, 11, -64.5);
        makecone(scene, 5, 3, 4, 0xE8E8E8, 60, 13.5, -64.5);
        // Sash windows on front face (dark recesses)
        var winx = [-8, -4, 0, 4, 8];
        for (var w = 0; w < winx.length; w++) {
            makebox(scene, 1.4, 2, 0.3, 0x7BA0C0, 60 + winx[w], 6, -64.2);
            makebox(scene, 1.4, 2, 0.3, 0x7BA0C0, 60 + winx[w], 9, -64.2);
        }
        // Roof balustrade boxes
        var bals = [-11, -7, -3, 1, 5, 9];
        for (var b = 0; b < bals.length; b++) {
            makebox(scene, 1.2, 1.5, 0.6, 0xEEEEEE, 60 + bals[b], 11, -60);
        }
        // Orangery wing (east side)
        makebox(scene, 14, 7, 8, 0xFFFFF0, 85, 3.5, -60);
        makebox(scene, 14, 0.5, 9, 0xEEEEEE, 85, 7.25, -60);
        // Orangery windows (large glass panes)
        var owinx = [-5, -1, 3];
        for (var ow = 0; ow < owinx.length; ow++) {
            makebox(scene, 2.5, 5.5, 0.3, 0xADD8E6, 85 + owinx[ow], 3.75, -64.2);
        }
        // Formal garden hedges
        makebox(scene, 40, 2, 2, 0x2D6A2D, 60, 1, -45);
        makebox(scene, 2, 2, 20, 0x2D6A2D, 40, 1, -55);
        makebox(scene, 2, 2, 20, 0x2D6A2D, 80, 1, -55);
        makebox(scene, 40, 2, 2, 0x2D6A2D, 60, 1, -35);
        // Circular garden feature (cylinder fountain base)
        makecylinder(scene, 3, 3, 0.5, 16, 0x9090A0, 60, 0.25, -50);
        makecylinder(scene, 0.4, 0.4, 3, 8, 0xA0A0B0, 60, 1.5, -50);
        makesphere(scene, 0.8, 8, 8, 0xBBBBCC, 60, 3.2, -50);
        // Lawn
        makebox(scene, 44, 0.2, 24, 0x3CB371, 60, 0.1, -50);
    }

    // 4. Spaniards Inn — 16th century pub on the Heath edge
    function buildspaniardsinn(scene) {
        // Main timber-framed pub body
        makebox(scene, 14, 7, 8, 0xFFF8DC, -60, 3.5, -80);
        // Dark timber frame stripes (horizontal beams)
        makebox(scene, 14, 0.4, 0.3, 0x8B4513, -60, 2, -84.2);
        makebox(scene, 14, 0.4, 0.3, 0x8B4513, -60, 4, -84.2);
        makebox(scene, 14, 0.4, 0.3, 0x8B4513, -60, 6, -84.2);
        // Vertical timber stripes
        var timberx = [-6, -2, 2, 6];
        for (var t = 0; t < timberx.length; t++) {
            makebox(scene, 0.4, 7, 0.3, 0x8B4513, -60 + timberx[t], 3.5, -84.2);
        }
        // Pub roof (dark tile)
        makebox(scene, 15, 1.5, 9, 0x4A3A2A, -60, 7.75, -80);
        makecone(scene, 1, 3, 4, 0x3A2A1A, -60, 9.5, -80);
        // Pub sign hanging bracket
        makebox(scene, 0.2, 2, 0.2, 0x8B4513, -67.5, 5, -84.3);
        makebox(scene, 2.5, 0.15, 0.15, 0x8B4513, -66.25, 5.9, -84.3);
        makebox(scene, 2, 1.2, 0.2, 0x8B1A1A, -66.5, 5.1, -84.4);
        // Pub chimney
        makebox(scene, 1.5, 4, 1.5, 0xA0522D, -57, 9.5, -82);
        makebox(scene, 2, 0.5, 2, 0x8B4513, -57, 11.5, -82);
        // Windows (lead-paned, small)
        var winpositions = [[-4, 3, -84.2], [0, 3, -84.2], [4, 3, -84.2], [-4, 6, -84.2], [0, 6, -84.2]];
        for (var wp = 0; wp < winpositions.length; wp++) {
            makebox(scene, 1.8, 1.8, 0.3, 0xD4C8A0, -60 + winpositions[wp][0], winpositions[wp][1], winpositions[wp][2]);
        }
        // Door
        makebox(scene, 2, 3.5, 0.3, 0x5A3010, -60, 1.75, -84.2);
        // Toll-house box opposite
        makebox(scene, 8, 6, 7, 0xD2B48C, -60, 3, -72);
        makebox(scene, 9, 0.5, 7.5, 0x7A6040, -60, 6.25, -72);
        // Toll-house windows
        makebox(scene, 1.5, 1.5, 0.3, 0x8090A0, -63, 3, -75.5);
        makebox(scene, 1.5, 1.5, 0.3, 0x8090A0, -57, 3, -75.5);
        // Path between pub and toll-house
        makebox(scene, 5, 0.15, 10, 0x9A8A70, -60, 0.08, -77);
    }

    // 5. Heath Extension — northern heath
    function buildhealthextension(scene) {
        // Wide grass ground (50×30)
        makebox(scene, 50, 0.3, 30, 0x228B22, 0, 0.15, -130);
        // Gorse bushes as sphere clusters (yellow-green)
        var gorsepositions = [
            [-18, -120], [-10, -125], [5, -118], [14, -128],
            [-22, -135], [8, -140], [-5, -138], [20, -122],
            [22, -135], [-15, -142]
        ];
        for (var g = 0; g < gorsepositions.length; g++) {
            var gx = gorsepositions[g][0];
            var gz = gorsepositions[g][1];
            makesphere(scene, 1.8, 7, 6, 0x9ACD32, gx, 1.8, gz);
            makesphere(scene, 1.2, 6, 5, 0xADD720, gx + 1.5, 1.2, gz + 1);
            makesphere(scene, 1.0, 6, 5, 0x8FBC22, gx - 1, 1.0, gz - 1);
        }
        // Heath path (narrow box)
        makebox(scene, 2, 0.18, 28, 0xA89878, 6, 0.09, -131);
    }

    // 6. Whitestone Pond — highest point
    function buildwhitestonepond(scene) {
        // Small pond at road junction
        makebox(scene, 12, 0.5, 10, 0x4169E1, 100, 0.25, -30);
        // Raised curb around pond
        makebox(scene, 13, 0.6, 0.5, 0x9A9A9A, 100, 0.55, -25.3);
        makebox(scene, 13, 0.6, 0.5, 0x9A9A9A, 100, 0.55, -34.7);
        makebox(scene, 0.5, 0.6, 10, 0x9A9A9A, 93.8, 0.55, -30);
        makebox(scene, 0.5, 0.6, 10, 0x9A9A9A, 106.2, 0.55, -30);
        // Benches around the pond
        var benchpositions = [
            [100, -22, 0, 5], [100, -38, 0, 5],
            [90, -30, 5, 0],  [110, -30, 5, 0]
        ];
        for (var bn = 0; bn < benchpositions.length; bn++) {
            var bx = benchpositions[bn][0];
            var bz = benchpositions[bn][1];
            var bw = benchpositions[bn][2];
            var bd = benchpositions[bn][3];
            if (bw > 0) {
                makebox(scene, bw, 0.3, 1, 0x8B6914, bx, 0.65, bz);
            } else {
                makebox(scene, 1, 0.3, bd, 0x8B6914, bx, 0.65, bz);
            }
            // Bench legs
            makebox(scene, 0.2, 0.6, 0.2, 0x6B4F10, bx - 1.5, 0.3, bz - 0.3);
            makebox(scene, 0.2, 0.6, 0.2, 0x6B4F10, bx + 1.5, 0.3, bz - 0.3);
        }
        // Road junction paving
        makebox(scene, 22, 0.1, 22, 0x808080, 100, 0.05, -30);
    }

    // 7. Burgh House — Georgian house museum
    function buildburghhouse(scene) {
        // Main house (12×8×6)
        makebox(scene, 12, 8, 6, 0xD2B48C, -110, 4, 20);
        // Sash windows (Georgian style, regular spacing)
        var bwinx = [-4, 0, 4];
        for (var bw = 0; bw < bwinx.length; bw++) {
            makebox(scene, 1.6, 2, 0.3, 0x7090A8, -110 + bwinx[bw], 5.5, 17.2);
            makebox(scene, 1.6, 2, 0.3, 0x7090A8, -110 + bwinx[bw], 3, 17.2);
        }
        // Front door with fanlight
        makebox(scene, 2, 3.5, 0.3, 0x4A2810, -110, 1.75, 17.2);
        makebox(scene, 2.2, 0.8, 0.3, 0x9ABECC, -110, 3.9, 17.2);
        // Steps
        makebox(scene, 3, 0.3, 1, 0xC4A880, -110, 0.15, 16.8);
        makebox(scene, 3, 0.3, 1, 0xBFA078, -110, 0.45, 16.4);
        // Roof hipped (box)
        makebox(scene, 13, 1.5, 7, 0x8B6040, -110, 8.75, 20);
        makebox(scene, 11, 2, 5, 0x7A5530, -110, 9.75, 20);
        // Chimney stacks
        makebox(scene, 1.5, 3, 1.5, 0xC09070, -115, 10, 20);
        makebox(scene, 1.5, 3, 1.5, 0xC09070, -105, 10, 20);
        // Museum sign board
        makebox(scene, 4, 1, 0.2, 0x2A4A2A, -110, 2.5, 16.8);
        // Small garden wall
        makebox(scene, 16, 1.2, 0.5, 0xC4A880, -110, 0.6, 14.5);
    }

    // 8. Vale of Health — hidden hamlet (lower ground)
    function buildvaleofhealth(scene) {
        // Hollow ground (lower level)
        makebox(scene, 50, 0.3, 40, 0x4A7A30, -40, -1.85, 120);
        // Victorian cottages cluster
        var cottages = [
            [-52, 110, 10, 6, 5, 0xE8D8C0],
            [-44, 115, 8,  5, 5, 0xD8C8B0],
            [-36, 108, 9,  6, 5, 0xF0E0D0],
            [-56, 122, 7,  5, 4, 0xE0D0C0],
            [-48, 128, 10, 5, 5, 0xD4C4A4],
            [-34, 125, 8,  6, 5, 0xEADCC8]
        ];
        for (var cv = 0; cv < cottages.length; cv++) {
            var co = cottages[cv];
            // Cottage body
            makebox(scene, co[2], co[3], co[4], co[5], co[0], co[3] / 2 - 2, co[1]);
            // Sloped roof (two boxes forming ridge)
            makebox(scene, co[2] + 0.5, 1.2, co[4] + 0.5, 0x8B4513, co[0], co[3] - 2 + 0.6, co[1]);
            makecone(scene, co[2] * 0.55, 3, 4, 0x7A3A10, co[0], co[3] - 2 + 2.1, co[1]);
            // Windows
            makebox(scene, 1.2, 1.2, 0.3, 0x7090A0, co[0] - 1.5, co[3] / 2 - 1, co[1] - co[4] / 2 - 0.1);
            makebox(scene, 1.2, 1.2, 0.3, 0x7090A0, co[0] + 1.5, co[3] / 2 - 1, co[1] - co[4] / 2 - 0.1);
            // Chimney
            makebox(scene, 0.8, 2.5, 0.8, 0xB08060, co[0] + co[2] / 2 - 1, co[3] - 0.5, co[1]);
        }
        // Village path
        makebox(scene, 2, 0.18, 35, 0xA89060, -44, -1.75, 118);
        // Small pond in vale
        makebox(scene, 6, 0.3, 5, 0x3A6BBE, -32, -1.7, 120);
    }

    // 9. East Heath — large open kite-flying area
    function buildeastheath(scene) {
        // Flat open ground (large)
        makebox(scene, 120, 0.3, 80, 0x90EE90, 100, 0.15, 80);
        // Kites at various heights (animated in update)
        var kitedata = [
            [80, 12, 60, 0xFF3333],
            [95, 16, 70, 0x3399FF],
            [110, 20, 55, 0xFFCC00],
            [120, 14, 90, 0xFF66AA],
            [135, 18, 75, 0x33CC33],
            [150, 22, 65, 0xFF8800]
        ];
        for (var k = 0; k < kitedata.length; k++) {
            var kd = kitedata[k];
            // Kite body (two crossed boxes forming diamond shape)
            var kitebody = makebox(scene, 3, 4, 0.3, kd[3], kd[0], kd[1], kd[2]);
            var kitecross = makebox(scene, 4, 2, 0.3, kd[3], kd[0], kd[1], kd[2]);
            // Kite tail (dangling box)
            var kitetail = makebox(scene, 0.3, 3, 0.3, 0xFFFFFF, kd[0], kd[1] - 3.5, kd[2]);
            kites.push([kitebody, kitecross, kitetail]);
            kiteAnims.push({
                baseX: WX + kd[0],
                baseY: kd[1],
                baseZ: WZ + kd[2],
                phase: k * 1.05
            });
        }
        // Kite string suggestion (thin vertical cylinder anchored to ground)
        for (var ks = 0; ks < kitedata.length; ks++) {
            makecylinder(scene, 0.04, 0.04, kitedata[ks][1], 4, 0xCCCCCC, kitedata[ks][0], kitedata[ks][1] / 2, kitedata[ks][2]);
        }
        // Some trees at edge (cylinders topped with spheres)
        var treepositions = [
            [60, 60], [62, 80], [58, 100], [165, 60],
            [168, 80], [163, 100]
        ];
        for (var tr = 0; tr < treepositions.length; tr++) {
            makecylinder(scene, 0.5, 0.7, 5, 7, 0x5C4033, treepositions[tr][0], 2.5, treepositions[tr][1]);
            makesphere(scene, 3, 8, 8, 0x2A7A2A, treepositions[tr][0], 7, treepositions[tr][1]);
        }
    }

    // 10. Old Bull & Bush — famous pub
    function buildoldbullandbush(scene) {
        // Main Victorian pub building
        makebox(scene, 18, 8, 10, 0x8B3A3A, 150, 4, -60);
        // Bay windows (protruding boxes on front face)
        makebox(scene, 4, 5, 2.5, 0x7A3030, 143, 3.5, -65.3);
        makebox(scene, 4, 5, 2.5, 0x7A3030, 157, 3.5, -65.3);
        // Bay window glass
        makebox(scene, 3.2, 3.5, 0.3, 0x9AC0CC, 143, 3.5, -66.6);
        makebox(scene, 3.2, 3.5, 0.3, 0x9AC0CC, 157, 3.5, -66.6);
        // Main facade windows
        makebox(scene, 2, 2.5, 0.3, 0x9AC0CC, 150, 4.5, -65.2);
        makebox(scene, 2, 2.5, 0.3, 0x9AC0CC, 150, 7.5, -65.2);
        // Pub roof with parapet
        makebox(scene, 19, 1, 11, 0x6A2A2A, 150, 8.5, -60);
        makebox(scene, 20, 1.2, 0.6, 0x8B3A3A, 150, 9, -65.6);
        // Parapet detailing
        var parapetx = [-8, -4, 0, 4, 8];
        for (var pp = 0; pp < parapetx.length; pp++) {
            makebox(scene, 1.5, 1.5, 0.7, 0x7A2A2A, 150 + parapetx[pp], 9.75, -65.6);
        }
        // Pub chimney
        makebox(scene, 1.8, 5, 1.8, 0x8B3A3A, 153, 11.5, -58);
        makebox(scene, 2.2, 0.5, 2.2, 0x6A2A2A, 153, 14, -58);
        // Pub sign (ornate box above door)
        makebox(scene, 6, 2, 0.4, 0x4A1A1A, 150, 9.2, -65.4);
        // Door
        makebox(scene, 2.2, 3.5, 0.3, 0x3A1A08, 150, 1.75, -65.2);
        // Hanging basket decorations (sphere clusters above windows)
        var basketpos = [[-7, 5], [-3.5, 5], [3.5, 5], [7, 5]];
        for (var hb = 0; hb < basketpos.length; hb++) {
            makesphere(scene, 0.6, 6, 6, 0xFF4500, 150 + basketpos[hb][0], basketpos[hb][1], -65.4);
            makesphere(scene, 0.5, 5, 5, 0xFF6633, 150 + basketpos[hb][0] + 0.6, basketpos[hb][1] - 0.5, -65.4);
            makesphere(scene, 0.4, 5, 5, 0x32CD32, 150 + basketpos[hb][0] - 0.5, basketpos[hb][1] + 0.3, -65.4);
        }
        // Beer garden wall
        makebox(scene, 18, 1.5, 0.5, 0x7A3030, 150, 0.75, -52);
        makebox(scene, 0.5, 1.5, 14, 0x7A3030, 141, 0.75, -58.5);
        makebox(scene, 0.5, 1.5, 14, 0x7A3030, 159, 0.75, -58.5);
        // Beer garden tables
        var tablepos = [[145, -57], [150, -57], [155, -57]];
        for (var tbl = 0; tbl < tablepos.length; tbl++) {
            makecylinder(scene, 0.1, 0.1, 0.9, 6, 0x5A3A1A, tablepos[tbl][0], 0.45, tablepos[tbl][1]);
            makebox(scene, 2.5, 0.2, 2.5, 0x7A5A2A, tablepos[tbl][0], 0.95, tablepos[tbl][1]);
        }
        // Pavement
        makebox(scene, 22, 0.1, 4, 0x909090, 150, 0.05, -67);
    }

    // Ground base — general heath floor
    function buildground(scene) {
        makebox(scene, 400, 0.2, 400, 0x5A8C38, 0, -0.1, 0);
    }

    // General trees scattered across heath
    function buildtrees(scene) {
        var treedata = [
            [-20, -20, 0x2A6A2A], [30, -40, 0x246024], [-50, 30, 0x2A7A30],
            [70, -10, 0x226822], [-80, -50, 0x28702A], [40, 50, 0x2C7A2C],
            [-30, 70, 0x267226], [90, 40, 0x247224], [-100, 20, 0x2A6E2A],
            [120, -20, 0x226A22], [-70, 90, 0x267028], [50, -100, 0x2A7228],
            [10, 100, 0x28702A], [-110, 60, 0x266826], [130, 30, 0x2A7030],
            [-90, -80, 0x247228], [80, -80, 0x267228], [-40, -100, 0x2A6E28]
        ];
        for (var t = 0; t < treedata.length; t++) {
            var tx = treedata[t][0];
            var tz = treedata[t][1];
            var tc = treedata[t][2];
            makecylinder(scene, 0.5, 0.8, 6, 7, 0x5C3A20, tx, 3, tz);
            makesphere(scene, 3.5, 8, 8, tc, tx, 8, tz);
        }
    }

    // Paths across the heath
    function buildpaths(scene) {
        // Main spine path Parliament Hill to Kenwood
        makebox(scene, 2.5, 0.12, 80, 0xB4A070, 0, 0.06, -40);
        // Cross path
        makebox(scene, 60, 0.12, 2.5, 0xB4A070, 0, 0.06, 0);
        // Path to ponds
        makebox(scene, 2.5, 0.12, 30, 0xB4A070, -60, 0.06, 60);
        // Path to Spaniards Inn
        makebox(scene, 30, 0.12, 2.5, 0xB4A070, -45, 0.06, -80);
    }

    function init(scene) {
        buildground(scene);
        buildpaths(scene);
        buildtrees(scene);
        buildparliamenthill(scene);
        buildheatponds(scene);
        buildkenwoodhouse(scene);
        buildspaniardsinn(scene);
        buildhealthextension(scene);
        buildwhitestonepond(scene);
        buildburghhouse(scene);
        buildvaleofhealth(scene);
        buildeastheath(scene);
        buildoldbullandbush(scene);
    }

    function update(dt) {
        var t = Date.now() * 0.001;
        for (var k = 0; k < kites.length; k++) {
            var anim = kiteAnims[k];
            var ph = anim.phase;
            // Gentle floating motion — sine wave on x and y axes
            var newX = anim.baseX + Math.sin(t * 0.4 + ph) * 4;
            var newY = anim.baseY + Math.sin(t * 0.6 + ph * 1.3) * 2;
            var newZ = anim.baseZ + Math.cos(t * 0.35 + ph * 0.8) * 3;
            var kiteParts = kites[k];
            // Body
            kiteParts[0].position.set(newX, newY, newZ);
            // Cross piece
            kiteParts[1].position.set(newX, newY, newZ);
            // Tail (hangs below)
            kiteParts[2].position.set(newX, newY - 3.5, newZ);
            // Gentle tilt
            kiteParts[0].rotation.z = Math.sin(t * 0.5 + ph) * 0.15;
            kiteParts[1].rotation.z = Math.sin(t * 0.5 + ph) * 0.15;
        }
    }

    function reset() {
        kites = [];
        kiteAnims = [];
    }

    return {
        init: init,
        update: update,
        reset: reset
    };

}());
