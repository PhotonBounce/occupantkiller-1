window.AlnwickCastle = (function() {
    'use strict';

    var WX = 2620;
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

    function buildmainkeep(scene) {
        // Main Norman keep — large sandstone box
        makebox(scene, 20, 16, 20, 0xD4A97A, 0, 8, 0);
        // Keep battlements top row
        var bpositions = [
            [-8, -8], [-4, -8], [0, -8], [4, -8], [8, -8],
            [-8,  8], [-4,  8], [0,  8], [4,  8], [8,  8],
            [-8, -4], [-8,  0], [-8,  4],
            [ 8, -4], [ 8,  0], [ 8,  4]
        ];
        for (var i = 0; i < bpositions.length; i++) {
            makebox(scene, 1.5, 2, 1.5, 0xD4A97A, bpositions[i][0], 17, bpositions[i][1]);
        }
        // Keep roof platform
        makebox(scene, 22, 1, 22, 0xC49A6A, 0, 16.5, 0);
        // Arrow slit windows (decorative boxes inset)
        makebox(scene, 0.5, 3, 0.5, 0x5A4A3A, 0, 8, -10.1);
        makebox(scene, 0.5, 3, 0.5, 0x5A4A3A, 5, 8, -10.1);
        makebox(scene, 0.5, 3, 0.5, 0x5A4A3A, -5, 8, -10.1);
    }

    function buildbarbican(scene) {
        // Twin cylinder towers flanking the gatehouse
        makecylinder(scene, 3, 3, 20, 12, 0xC49A6A, -12, 10, -5);
        makecylinder(scene, 3, 3, 20, 12, 0xC49A6A,  12, 10, -5);
        // Cone rooftops on barbican towers
        makecone(scene, 3.2, 5, 12, 0x8A6A5A, -12, 22.5, -5);
        makecone(scene, 3.2, 5, 12, 0x8A6A5A,  12, 22.5, -5);
        // Box gatehouse between towers
        makebox(scene, 12, 16, 8, 0xC49A6A, 0, 8, -5);
        // Gate archway (dark recess)
        makebox(scene, 4, 7, 1, 0x3A2A1A, 0, 3.5, -9);
        // Gatehouse battlements
        var gbat = [[-4, 0], [-2, 0], [0, 0], [2, 0], [4, 0]];
        for (var i = 0; i < gbat.length; i++) {
            makebox(scene, 1.5, 2, 1.5, 0xC49A6A, gbat[i][0], 17, gbat[i][1] - 5);
        }
        // Portcullis (box grid suggestion)
        makebox(scene, 4, 6, 0.3, 0x4A4A4A, 0, 5, -8.9);
    }

    function buildcurtainwalls(scene) {
        // Four curtain walls around the main keep
        makebox(scene, 60, 8, 2, 0xB89A70, 0, 4, -38);
        makebox(scene, 60, 8, 2, 0xB89A70, 0, 4,  38);
        makebox(scene, 2, 8, 76, 0xB89A70, -30, 4, 0);
        makebox(scene, 2, 8, 76, 0xB89A70,  30, 4, 0);
        // Curtain wall merlons north wall
        var merlonsx = [-28, -22, -16, -10, -4, 2, 8, 14, 20, 26];
        for (var i = 0; i < merlonsx.length; i++) {
            makebox(scene, 4, 2.5, 2, 0xB89A70, merlonsx[i], 9.25, -38);
            makebox(scene, 4, 2.5, 2, 0xB89A70, merlonsx[i], 9.25,  38);
        }
        var merlonsz = [-28, -22, -16, -10, -4, 2, 8, 14, 20, 26];
        for (var j = 0; j < merlonsz.length; j++) {
            makebox(scene, 2, 2.5, 4, 0xB89A70, -30, 9.25, merlonsz[j]);
            makebox(scene, 2, 2.5, 4, 0xB89A70,  30, 9.25, merlonsz[j]);
        }
    }

    function buildcornertowers(scene) {
        // Four round corner towers at curtain wall corners
        var corners = [
            [-30, -38], [30, -38], [-30, 38], [30, 38]
        ];
        for (var i = 0; i < corners.length; i++) {
            makecylinder(scene, 4, 4, 14, 12, 0xB89A70, corners[i][0], 7, corners[i][1]);
            makecone(scene, 4.2, 6, 12, 0x8A6A5A, corners[i][0], 17, corners[i][1]);
        }
    }

    function buildwarriorstatues(scene) {
        // 10 stone warrior statues on battlements — Percy Tenantry Column style
        // Alternating parapet positions along north curtain wall
        var statuepositions = [
            [-24, -38], [-18, -38], [-12, -38], [-6, -38], [0, -38],
            [ 6, -38],  [12, -38],  [18, -38], [24, -38], [-24, 38]
        ];
        for (var i = 0; i < statuepositions.length; i++) {
            var sx = statuepositions[i][0];
            var sz = statuepositions[i][1];
            // Plinth
            makebox(scene, 1.2, 1, 1.2, 0x8A8A8A, sx, 8.5, sz);
            // Legs
            makebox(scene, 0.8, 2, 0.5, 0x9A9A9A, sx, 10, sz);
            // Torso
            makebox(scene, 1.1, 1.5, 0.7, 0x9A9A9A, sx, 11.75, sz);
            // Arms spread
            makebox(scene, 2.4, 0.5, 0.5, 0x9A9A9A, sx, 12, sz);
            // Head
            makebox(scene, 0.7, 0.7, 0.7, 0x9A9A9A, sx, 13.1, sz);
            // Helmet crest (cone)
            makecone(scene, 0.4, 0.8, 6, 0x7A7A7A, sx, 13.85, sz);
            // Shield (box in front)
            makebox(scene, 0.8, 1.2, 0.2, 0x7A7A7A, sx, 11.5, sz - 0.5);
            // Spear (tall thin cylinder)
            makecylinder(scene, 0.1, 0.1, 4, 6, 0x6A6A6A, sx + 0.6, 13, sz);
        }
    }

    function buildouterbailey(scene) {
        // Wide outer bailey enclosure walls
        makebox(scene, 80, 5, 2, 0x9A8A78, 0, 2.5, -60);
        makebox(scene, 80, 5, 2, 0x9A8A78, 0, 2.5,  60);
        makebox(scene, 2, 5, 120, 0x9A8A78, -40, 2.5, 0);
        makebox(scene, 2, 5, 120, 0x9A8A78,  40, 2.5, 0);
        // Outer bailey corner towers (smaller)
        var ocorners = [
            [-40, -60], [40, -60], [-40, 60], [40, 60]
        ];
        for (var i = 0; i < ocorners.length; i++) {
            makecylinder(scene, 3, 3, 8, 10, 0x9A8A78, ocorners[i][0], 4, ocorners[i][1]);
        }
        // Outer gatehouse (south side)
        makebox(scene, 8, 6, 4, 0x9A8A78, 0, 3, -60);
        makebox(scene, 3, 5, 1, 0x3A2A1A, 0, 2.5, -61);
    }

    function buildgardencascade(scene) {
        // Alnwick Garden cascade — formal water feature to the east
        // Stepped cascade boxes descending
        makebox(scene, 18, 0.5, 4, 0xB0C8D8, 50, 0.25, -20);
        makebox(scene, 18, 0.5, 4, 0xB0C8D8, 50, 0.75, -16);
        makebox(scene, 18, 0.5, 4, 0xB0C8D8, 50, 1.25, -12);
        makebox(scene, 18, 0.5, 4, 0xB0C8D8, 50, 1.75, -8);
        makebox(scene, 18, 0.5, 4, 0xB0C8D8, 50, 2.25, -4);
        makebox(scene, 18, 0.5, 4, 0xB0C8D8, 50, 2.75,  0);
        makebox(scene, 18, 0.5, 4, 0xB0C8D8, 50, 3.25,  4);
        makebox(scene, 18, 0.5, 4, 0xB0C8D8, 50, 3.75,  8);
        // Cascade side walls
        makebox(scene, 0.5, 4, 36, 0x9A8A78, 41, 2, -6);
        makebox(scene, 0.5, 4, 36, 0x9A8A78, 59, 2, -6);
        // Jet fountain cylinders
        var jetpositions = [
            [44, -18], [47, -18], [50, -18], [53, -18], [56, -18],
            [44,  -2], [47,  -2], [50,  -2], [53,  -2], [56,  -2]
        ];
        for (var i = 0; i < jetpositions.length; i++) {
            makecylinder(scene, 0.15, 0.15, 5, 6, 0xCCE8F8, jetpositions[i][0], 3.5, jetpositions[i][1]);
        }
        // Ornamental hedge maze (box grid)
        var hedgerows = [
            [70, 0, -20, 1, 2, 40],
            [70, 0,  20, 1, 2, 40],
            [90, 0,   0, 40, 2, 1],
            [80, 0, -10, 1, 2, 20],
            [80, 0,  10, 1, 2, 20],
            [85, 0,   0, 10, 2, 1],
            [75, 0,  -5, 1, 2, 10],
            [75, 0,   5, 1, 2, 10]
        ];
        for (var j = 0; j < hedgerows.length; j++) {
            var hr = hedgerows[j];
            makebox(scene, hr[3], hr[4], hr[5], 0x2D5A27, hr[0], hr[4] / 2, hr[2]);
        }
    }

    function buildbrizleetower(scene) {
        // Brizlee Tower — tall Gothic folly on hilltop to the north
        // Elevated base (hilltop suggestion)
        makebox(scene, 8, 3, 8, 0x7A7A6A, -80, 1.5, -80);
        // Main tower shaft
        makebox(scene, 4, 22, 4, 0x9A8A78, -80, 14, -80);
        // Mid-level Gothic detailing bands
        makebox(scene, 5, 1, 5, 0x8A7A68, -80, 8, -80);
        makebox(scene, 5, 1, 5, 0x8A7A68, -80, 16, -80);
        // Upper octagonal section (approximated with slightly wider box)
        makebox(scene, 4.5, 6, 4.5, 0x9A8A78, -80, 28, -80);
        // Decorative buttresses
        makebox(scene, 1, 20, 1, 0x8A7A68, -82.5, 13, -82.5);
        makebox(scene, 1, 20, 1, 0x8A7A68, -77.5, 13, -82.5);
        makebox(scene, 1, 20, 1, 0x8A7A68, -82.5, 13, -77.5);
        makebox(scene, 1, 20, 1, 0x8A7A68, -77.5, 13, -77.5);
        // Gothic pinnacles at top
        makecone(scene, 0.8, 4, 8, 0x8A7A68, -82, 32.5, -82);
        makecone(scene, 0.8, 4, 8, 0x8A7A68, -78, 32.5, -82);
        makecone(scene, 0.8, 4, 8, 0x8A7A68, -82, 32.5, -78);
        makecone(scene, 0.8, 4, 8, 0x8A7A68, -78, 32.5, -78);
        // Tall decorative finial at apex
        makecylinder(scene, 0.3, 0.3, 5, 8, 0x8A7A68, -80, 34.5, -80);
        makecone(scene, 0.6, 2, 8, 0x7A6A58, -80, 38, -80);
        // Column at base (Percy Tenantry Column reference)
        makecylinder(scene, 0.5, 0.6, 6, 10, 0x9A9A8A, -80, 4, -80);
        makebox(scene, 1.5, 0.5, 1.5, 0x9A9A8A, -80, 7.25, -80);
        makecylinder(scene, 0.4, 0.4, 3, 8, 0x9A9A8A, -80, 5, -75);
        makebox(scene, 1, 1, 1, 0x8A8A7A, -80, 6.5, -75);
    }

    function buildbroomsticpitch(scene) {
        // Broomstick flying lesson pitch — open ground west side
        // Ground marker lines (flat boxes)
        makebox(scene, 40, 0.1, 0.3, 0xFFFFFF, -70, 0.05, -30);
        makebox(scene, 40, 0.1, 0.3, 0xFFFFFF, -70, 0.05,  30);
        makebox(scene, 0.3, 0.1, 60, 0xFFFFFF, -90, 0.05,   0);
        makebox(scene, 0.3, 0.1, 60, 0xFFFFFF, -50, 0.05,   0);
        // Centre circle
        makebox(scene, 0.3, 0.1, 10, 0xFFFFFF, -70, 0.05, -5);
        makebox(scene, 0.3, 0.1, 10, 0xFFFFFF, -70, 0.05,  5);
        makebox(scene, 10, 0.1, 0.3, 0xFFFFFF, -65, 0.05,  0);
        makebox(scene, 10, 0.1, 0.3, 0xFFFFFF, -75, 0.05,  0);

        // Quidditch hoop goal posts — three hoops per end, two ends
        var goalends = [-50, -90];
        var hoopoffsets = [-6, 0, 6];
        var hoopheights = [6, 9, 12];
        for (var e = 0; e < goalends.length; e++) {
            for (var h = 0; h < hoopoffsets.length; h++) {
                // Vertical post
                makecylinder(scene, 0.2, 0.2, hoopheights[h], 8, 0xD4A030,
                    goalends[e], hoopheights[h] / 2, hoopoffsets[h]);
                // Hoop ring base cylinder
                makecylinder(scene, 2, 2, 3, 12, 0xD4A030,
                    goalends[e], hoopheights[h] + 1.5, hoopoffsets[h]);
                // Hoop ring hollow inner (slightly smaller dark cylinder to suggest ring)
                makecylinder(scene, 1.6, 1.6, 3.2, 12, 0x2A1A0A,
                    goalends[e], hoopheights[h] + 1.5, hoopoffsets[h]);
                // Top cap boxes on hoop
                makebox(scene, 4.2, 0.4, 0.4, 0xD4A030,
                    goalends[e], hoopheights[h] + 3.2, hoopoffsets[h]);
                makebox(scene, 0.4, 0.4, 4.2, 0xD4A030,
                    goalends[e], hoopheights[h] + 3.2, hoopoffsets[h]);
            }
        }

        // Spectator stands (simple box bleachers)
        makebox(scene, 40, 3, 4, 0x8A7A6A, -70, 1.5, -35);
        makebox(scene, 40, 3, 4, 0x8A7A6A, -70, 1.5,  35);
        makebox(scene, 40, 2, 4, 0x9A8A7A, -70, 4.0, -37);
        makebox(scene, 40, 2, 4, 0x9A8A7A, -70, 4.0,  37);
        makebox(scene, 40, 1, 4, 0xAA9A8A, -70, 5.5, -39);
        makebox(scene, 40, 1, 4, 0xAA9A8A, -70, 5.5,  39);
    }

    function buildgrounddetails(scene) {
        // Castle courtyard ground (flat boxes)
        makebox(scene, 58, 0.2, 74, 0xAA9A80, 0, -0.1, 0);
        // Well in courtyard
        makecylinder(scene, 1, 1, 1.5, 10, 0x8A7A6A, -5, 0.75, 10);
        makebox(scene, 2.5, 0.3, 2.5, 0x7A6A5A, -5, 1.65, 10);
        // Cobblestone path suggestion (alternating boxes)
        for (var i = 0; i < 8; i++) {
            makebox(scene, 1.8, 0.15, 1.8, 0x9A8A78, -1 + (i % 2) * 0.5, 0.08, -32 + i * 4);
        }
        // Flagpole
        makecylinder(scene, 0.15, 0.15, 12, 8, 0x8A8A8A, 10, 6, -15);
        makebox(scene, 3, 1.5, 0.1, 0xAA0000, 11.5, 12.5, -15);
        // Torch brackets on keep walls
        var torchpos = [
            [-10.2, 5, -8], [-10.2, 5, 8], [10.2, 5, -8], [10.2, 5, 8]
        ];
        for (var t = 0; t < torchpos.length; t++) {
            makebox(scene, 0.3, 0.3, 0.8, 0x6A4A2A, torchpos[t][0], torchpos[t][1], torchpos[t][2]);
            makecylinder(scene, 0.2, 0.2, 1, 6, 0x6A4A2A, torchpos[t][0], torchpos[t][1] + 0.65, torchpos[t][2]);
            makesphere(scene, 0.25, 6, 6, 0xFF8800, torchpos[t][0], torchpos[t][1] + 1.3, torchpos[t][2]);
        }
        // Decorative sphere finials on keep corners
        var keepcorners = [[-10, 10], [10, 10], [-10, -10], [10, -10]];
        for (var k = 0; k < keepcorners.length; k++) {
            makesphere(scene, 0.6, 8, 8, 0xD4A97A, keepcorners[k][0], 17, keepcorners[k][1]);
        }
    }

    function buildinnerwalls(scene) {
        // Inner ward dividing wall
        makebox(scene, 22, 7, 1.5, 0xC49A6A, 0, 3.5, 22);
        // Inner ward gate
        makebox(scene, 6, 6, 1.6, 0xB08A5A, 0, 3, 22);
        makebox(scene, 5, 5, 0.2, 0x3A2A1A, 0, 2.5, 22.9);
        // Small chapel box
        makebox(scene, 6, 5, 8, 0xC0A080, -18, 2.5, 18);
        makecone(scene, 1.5, 6, 4, 0x8A6A4A, -18, 8, 18);
        makebox(scene, 0.3, 3, 1.2, 0xC0A080, -18, 8.5, 18);
        makebox(scene, 1.2, 3, 0.3, 0xC0A080, -18, 8.5, 18);
        // Stables (long box with roof)
        makebox(scene, 14, 4, 6, 0xB09070, 20, 2, 18);
        makebox(scene, 15, 1, 7, 0x9A8060, 20, 4.5, 18);
    }

    function init(scene) {
        buildmainkeep(scene);
        buildbarbican(scene);
        buildcurtainwalls(scene);
        buildcornertowers(scene);
        buildwarriorstatues(scene);
        buildouterbailey(scene);
        buildgardencascade(scene);
        buildbrizleetower(scene);
        buildbroomsticpitch(scene);
        buildgrounddetails(scene);
        buildinnerwalls(scene);
    }

    return {
        init: init
    };

}());
