window.SnowdonBase = (function() {
    'use strict';

    var WX = 3340;
    var WZ = 2200;

    function makebox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makesphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makecone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function buildsummit(scene) {
        // 8 stacked box tiers rising 30 units, shrinking as they go up
        var tierwidths = [22, 19, 16, 13, 11, 8, 6, 4];
        var tierheight = 4;
        var ybase = 0;
        var i, w, ypos;

        for (i = 0; i < 8; i++) {
            w = tierwidths[i];
            ypos = ybase + i * tierheight + tierheight * 0.5;
            makebox(scene, w, tierheight, w, 0x5A5A5A,
                WX, ypos, WZ);
        }

        // Snow-cap boxes on top 3 tiers (tiers 5, 6, 7 — index 5,6,7)
        var snowtiers = [5, 6, 7];
        var j, si, sw, sy;
        for (j = 0; j < snowtiers.length; j++) {
            si = snowtiers[j];
            sw = tierwidths[si] + 0.4;
            sy = ybase + si * tierheight + tierheight * 0.5 + 0.3;
            makebox(scene, sw, 0.5, sw, 0xFFFFFF,
                WX, sy, WZ);
        }

        // Summit pinnacle cone
        var pinnaclebase = ybase + 8 * tierheight;
        makecone(scene, 2, 8, 6, 0x5A5A5A,
            WX, pinnaclebase + 4, WZ);
        makebox(scene, 2.5, 0.5, 2.5, 0xFFFFFF,
            WX, pinnaclebase + 0.25, WZ);
    }

    function buildsummitcafe(scene) {
        // Hafod Eryri — modern box building at summit, slightly offset
        var cx = WX + 6;
        var cz = WZ + 4;
        var cybase = 30;

        // Main concrete body
        makebox(scene, 10, 4, 6, 0x8A8A8A, cx, cybase + 2, cz);

        // Roof — flat darker cap
        makebox(scene, 11, 0.5, 7, 0x707070, cx, cybase + 4.25, cz);

        // Entrance canopy
        makebox(scene, 3, 0.3, 2, 0x606060, cx - 5, cybase + 2.5, cz);

        // Windows as dark recessed boxes (slightly inset)
        makebox(scene, 1.5, 1.2, 0.2, 0x222244, cx - 2.5, cybase + 2.8, cz + 3.05);
        makebox(scene, 1.5, 1.2, 0.2, 0x222244, cx,      cybase + 2.8, cz + 3.05);
        makebox(scene, 1.5, 1.2, 0.2, 0x222244, cx + 2.5, cybase + 2.8, cz + 3.05);

        // Observation platform ledge
        makebox(scene, 12, 0.3, 8, 0x7A7A7A, cx, cybase + 4.65, cz);
    }

    function buildrailway(scene) {
        // Narrow-gauge rack railway from Llanberis base to summit
        // Base at WX-60, WZ+80 rising to WX, WZ over ~100 unit run
        var numsegs = 20;
        var i, t, rx, rz, ry, dx, dz;
        var basex = WX - 60;
        var basez = WZ + 80;
        var basey = 0;
        var topy = 30;

        for (i = 0; i < numsegs; i++) {
            t = i / (numsegs - 1);
            rx = basex + t * (WX - basex);
            rz = basez + t * (WZ - basez);
            ry = basey + t * (topy - basey);

            // Rail cylinder segment — small radius
            makecylinder(scene, 0.5, 0.5, 2, 6, 0x555544, rx, ry + 1, rz);

            // Rack bar (centre box between rails)
            dx = (WX - basex) / numsegs;
            dz = (WZ - basez) / numsegs;
            makebox(scene, 0.4, 0.3, Math.sqrt(dx*dx + dz*dz) * 1.1, 0x444433,
                rx + dx * 0.5, ry + 0.2, rz + dz * 0.5);
        }

        // Rail sleepers (cross-ties) every few segments
        var k, st, sx, sz, sy;
        for (k = 0; k < numsegs; k += 2) {
            t = k / (numsegs - 1);
            sx = basex + t * (WX - basex);
            sz = basez + t * (WZ - basez);
            sy = basey + t * (topy - basey);
            makebox(scene, 3, 0.25, 0.5, 0x4A3A2A, sx, sy + 0.1, sz);
        }

        // Small train car at mid-point of route
        t = 0.5;
        rx = basex + t * (WX - basex);
        rz = basez + t * (WZ - basez);
        ry = basey + t * (topy - basey);
        makebox(scene, 4, 2.5, 2, 0xCC3333, rx, ry + 2.25, rz);
        makebox(scene, 4.2, 0.4, 2.2, 0x882222, rx, ry + 3.7, rz);
        // Wheels
        makecylinder(scene, 0.5, 0.5, 0.3, 8, 0x222222, rx - 1.2, ry + 0.5, rz - 1.1);
        makecylinder(scene, 0.5, 0.5, 0.3, 8, 0x222222, rx + 1.2, ry + 0.5, rz - 1.1);
        makecylinder(scene, 0.5, 0.5, 0.3, 8, 0x222222, rx - 1.2, ry + 0.5, rz + 1.1);
        makecylinder(scene, 0.5, 0.5, 0.3, 8, 0x222222, rx + 1.2, ry + 0.5, rz + 1.1);
    }

    function buildglaslyn(scene) {
        // Glaslyn lake — dark turquoise in the cwm below summit
        var lx = WX - 20;
        var lz = WZ + 30;
        var ly = 10;

        // Main lake body (flat box)
        makebox(scene, 30, 1, 20, 0x1A8A7A, lx, ly, lz);

        // Slight depth shimmer — slightly darker inner pool
        makebox(scene, 20, 1.05, 13, 0x147068, lx, ly, lz);

        // Cwm cliffs — tall dark boxes surrounding the lake
        // Left cliff
        makebox(scene, 4, 28, 20, 0x3A3A3A, lx - 18, ly + 14, lz);
        // Right cliff
        makebox(scene, 4, 22, 18, 0x3A3A3A, lx + 18, ly + 11, lz);
        // Back cliff (north face)
        makebox(scene, 30, 30, 4, 0x3A3A3A, lx, ly + 15, lz - 12);
        // Cwm floor rubble
        makebox(scene, 8, 2, 6, 0x4A4A44, lx - 8, ly + 1.5, lz + 8);
        makebox(scene, 5, 1.5, 4, 0x4A4A44, lx + 6, ly + 1.25, lz + 6);

        // Small rocky outcrops at lake edge
        makebox(scene, 2, 2, 2, 0x505050, lx - 14, ly + 1, lz - 6);
        makebox(scene, 1.5, 1.5, 1.5, 0x505050, lx + 12, ly + 0.75, lz + 4);
    }

    function buildpenypasshostel(scene) {
        // Pen-y-Pass mountain hostel — at the col (mountain pass)
        var px = WX - 40;
        var pz = WZ + 50;
        var py = 6;

        // Main stone hostel building
        makebox(scene, 12, 4, 8, 0x9A8A78, px, py + 2, pz);

        // Wing extension
        makebox(scene, 5, 3.5, 5, 0x9A8A78, px + 7, py + 1.75, pz - 1);

        // Roof gable — dark slate
        makebox(scene, 13, 1.5, 9, 0x5A5050, px, py + 4.75, pz);

        // Chimney
        makecylinder(scene, 0.4, 0.4, 3, 6, 0x6A6A6A, px - 3, py + 7, pz - 2);

        // Car park area — flattened box
        makebox(scene, 18, 0.3, 12, 0x444440, px + 10, py + 0.15, pz + 5);

        // Boundary wall
        makebox(scene, 20, 1.5, 0.5, 0x7A6A58, px, py + 0.75, pz + 9);
        makebox(scene, 0.5, 1.5, 12, 0x7A6A58, px - 10, py + 0.75, pz + 3);
        makebox(scene, 0.5, 1.5, 12, 0x7A6A58, px + 10, py + 0.75, pz + 3);

        // Signpost
        makecylinder(scene, 0.1, 0.1, 3, 5, 0x885533, px + 8, py + 1.5, pz + 8);
        makebox(scene, 2, 0.4, 0.2, 0xCCCC55, px + 8, py + 3.3, pz + 8);
    }

    function buildllanberisquarry(scene) {
        // Llanberis slate quarry — largest slate quarry in world
        // Massive terraced steps descending, north of the base
        var qx = WX - 70;
        var qz = WZ + 100;
        var numtiers = 8;
        var tierw = 40;
        var tierd = 10;
        var tierh = 3;
        var i, ty, tz;

        for (i = 0; i < numtiers; i++) {
            ty = -i * tierh - tierh * 0.5;
            tz = qz + i * tierd;
            // Main tier platform
            makebox(scene, tierw, tierh, tierd, 0x4A4A4A, qx, ty, tz);
            // Tier face / cut wall
            makebox(scene, tierw, tierh * 1.5, 1.5, 0x3A3A3A, qx, ty + tierh, tz - tierd * 0.5);
        }

        // Slate waste tips — conical heaps
        makecone(scene, 8, 14, 6, 0x3C3C3C, qx - 15, 7, qz - 10);
        makecone(scene, 6, 10, 6, 0x3C3C3C, qx + 15, 5, qz - 8);
        makecone(scene, 10, 18, 6, 0x323232, qx, 9, qz - 20);

        // Quarry building / incline engine house
        makebox(scene, 8, 6, 6, 0x5A5050, qx - 12, 3, qz - 15);
        makebox(scene, 9, 0.5, 7, 0x444444, qx - 12, 6.25, qz - 15);
        // Chimney stack
        makecylinder(scene, 0.5, 0.6, 8, 6, 0x5A5050, qx - 10, 8, qz - 17);

        // Incline track (narrow boxes going up the slope)
        var m, ix, iy, iz;
        for (m = 0; m < 6; m++) {
            ix = qx - 5 + m * 1;
            iy = -m * 2.5 + 1;
            iz = qz - 10 - m * 8;
            makebox(scene, 0.4, 0.3, 6, 0x555544, ix - 1, iy, iz);
            makebox(scene, 0.4, 0.3, 6, 0x555544, ix + 1, iy, iz);
        }

        // Llanberis village hint — small cluster of boxes at base
        makebox(scene, 6, 3, 5, 0x9A8A78, qx + 25, 1.5, qz + 15);
        makebox(scene, 5, 3, 4, 0x9A8A78, qx + 33, 1.5, qz + 18);
        makebox(scene, 7, 3, 5, 0x9A8A78, qx + 18, 1.5, qz + 22);
    }

    function buildmountainbody(scene) {
        // Large underlying mountain mass — stacked broad boxes to give bulk
        var heights = [40, 30, 20, 12, 6];
        var widths  = [90, 70, 55, 42, 30];
        var i, ypos;

        for (i = 0; i < heights.length; i++) {
            ypos = -2 + i * 5;
            makebox(scene, widths[i], heights[i], widths[i], 0x4A4840,
                WX, ypos, WZ);
        }

        // Eastern ridge spur
        makebox(scene, 60, 14, 18, 0x4A4840, WX + 40, 0, WZ - 10);
        // South ridge spur
        makebox(scene, 18, 10, 50, 0x4A4840, WX + 10, 0, WZ + 40);
    }

    function buildrocksandscree(scene) {
        // Scattered scree and boulders on slopes
        var boulderdata = [
            [WX - 10, 24, WZ + 10, 2.5, 2, 2.5],
            [WX + 8,  22, WZ - 8,  3,   2, 2  ],
            [WX - 15, 18, WZ - 5,  2,   1.5, 2],
            [WX + 12, 16, WZ + 12, 2.5, 2, 2  ],
            [WX - 25, 12, WZ + 20, 3,   2, 3  ],
            [WX + 20, 14, WZ - 15, 2,   1.5, 2],
            [WX - 30, 8,  WZ - 20, 4,   3, 3.5],
            [WX + 30, 10, WZ + 25, 3.5, 2.5, 3]
        ];
        var i, bd;
        for (i = 0; i < boulderdata.length; i++) {
            bd = boulderdata[i];
            makebox(scene, bd[3], bd[4], bd[5], 0x5A5655,
                bd[0], bd[1], bd[2]);
        }
    }

    function build(scene) {
        buildmountainbody(scene);
        buildsummit(scene);
        buildsummitcafe(scene);
        buildrailway(scene);
        buildglaslyn(scene);
        buildpenypasshostel(scene);
        buildllanberisquarry(scene);
        buildrocksandscree(scene);
    }

    return {
        build: build,
        worldX: WX,
        worldZ: WZ
    };

}());
