window.BurrenLandscape = (function() {
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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function cyl(rt, rb, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function sphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function build() {
        var cx = 17680;

        // === LIMESTONE PAVEMENT — 36 irregular flat slabs ===
        // Laid out in a rough grid with jitter, varying y and sizes
        var slabColors = [0xC0C0C0, 0xD3D3D3, 0xBDBDBD, 0xC8C8C8];
        var slabDefs = [
            [5.8, 0.3, 6.2, 0,    0.04,  0   ],
            [4.5, 0.25,5.0, 0,    0.02,  7   ],
            [6.1, 0.28,4.8, 0,    0.06,  13  ],
            [5.2, 0.22,6.5, 0,    0.03,  20  ],
            [4.8, 0.30,5.5, 0,    0.05,  27  ],
            [5.5, 0.26,4.9, 0,    0.04,  34  ],
            [6.3, 0.27,5.3, 1,    0.03,  -7  ],
            [4.9, 0.24,6.0, 1,    0.06,  -14 ],
            [5.7, 0.29,5.1, 1,    0.02,  -21 ],
            [6.0, 0.31,4.7, 1,    0.05,  -28 ],
            [5.1, 0.23,5.8, 1,    0.04,  -35 ],
            [4.6, 0.28,6.3, 2,    0.03,  -42 ],
            [5.8, 0.25,5.4, 2,    0.05,  41  ],
            [6.2, 0.30,4.8, 2,    0.04,  48  ],
            [5.0, 0.22,6.1, 2,    0.06,  -49 ],
            [4.7, 0.27,5.7, 3,    0.03,  55  ],
            [5.9, 0.26,4.5, 3,    0.05,  -56 ],
            [6.4, 0.24,5.2, 3,    0.04,  62  ],
            [5.3, 0.29,6.4, 0,    0.02,  -63 ],
            [4.9, 0.31,5.6, 0,    0.06,  69  ],
            [5.6, 0.23,4.6, 1,    0.05,  -70 ],
            [6.1, 0.28,5.3, 1,    0.03,  76  ],
            [5.2, 0.26,6.2, 2,    0.04,  -77 ],
            [4.8, 0.30,5.9, 2,    0.06,  83  ],
            [5.7, 0.25,4.7, 3,    0.05,  -84 ],
            [6.0, 0.27,5.5, 3,    0.03,  90  ],
            [5.4, 0.22,6.0, 0,    0.04,  -91 ],
            [4.5, 0.29,5.8, 0,    0.06,  97  ],
            [5.9, 0.24,4.9, 1,    0.03,  -98 ],
            [6.3, 0.31,5.1, 1,    0.05,  104 ],
            [5.1, 0.26,6.3, 2,    0.04,  -105],
            [4.7, 0.23,5.6, 2,    0.06,  111 ],
            [5.8, 0.28,4.8, 3,    0.02,  -112],
            [6.2, 0.25,5.4, 3,    0.05,  118 ],
            [5.0, 0.30,6.1, 0,    0.03,  -119],
            [4.6, 0.27,5.7, 1,    0.04,  125 ]
        ];

        for (var si = 0; si < slabDefs.length; si++) {
            var sd = slabDefs[si];
            var sc = slabColors[sd[3]];
            var slabX = cx + (si % 6) * 10 - 25;
            box(sd[0], sd[1], sd[2], sc, slabX, sd[4], sd[5]);
        }

        // === GRYKES — thin dark cracks between slabs ===
        var grykeOffsets = [
            [0,  5.5 ], [0,  12.5], [0,  19.5], [0,  26.5], [0,  33.5],
            [0, -6.5 ], [0, -13.5], [0, -20.5], [0, -27.5], [0, -34.5],
            [10, 5.5 ], [10, 12.5], [10,-6.5 ], [10,-13.5],
            [-10, 5.5], [-10, 12.5],[-10,-6.5 ],[-10,-13.5]
        ];
        for (var gi = 0; gi < grykeOffsets.length; gi++) {
            var gof = grykeOffsets[gi];
            box(60, 0.15, 0.4, 0x333333, cx + gof[0], -0.2, gof[1]);
        }
        // cross-grykes (running east-west)
        box(0.4, 0.15, 140, 0x333333, cx - 5,  -0.2, 0);
        box(0.4, 0.15, 140, 0x333333, cx + 5,  -0.2, 0);
        box(0.4, 0.15, 140, 0x333333, cx + 15, -0.2, 0);
        box(0.4, 0.15, 140, 0x333333, cx - 15, -0.2, 0);

        // === POULNABRONE PORTAL TOMB ===
        // Two upright orthostats
        box(1.0, 4.5, 0.5, 0x808080, cx + 50, 2.25, -5);
        box(1.0, 4.5, 0.5, 0x808080, cx + 50, 2.25,  5);
        // Capstone — wide, flat, slightly tilted via scale
        box(3.5, 0.55, 4.5, 0x909090, cx + 50, 4.8, 0);
        // Two rear orthostats (smaller)
        box(0.8, 3.5, 0.5, 0x808080, cx + 52, 1.75, -3.5);
        box(0.8, 3.5, 0.5, 0x808080, cx + 52, 1.75,  3.5);
        // Ground slabs around dolmen
        box(6.0, 0.25, 12.0, 0xA9A9A9, cx + 51, 0.0, 0);

        // === CAHERCONNELL STONE FORT — ring of dry-stone blocks ===
        // Radius ~18, about 28 blocks per ring, 3 rings high
        var fortCX = cx - 60;
        var fortCZ = 20;
        var fortR = 18;
        var fortSegs = 28;
        for (var fi = 0; fi < fortSegs; fi++) {
            var fangle = (fi / fortSegs) * Math.PI * 2;
            var fx = fortCX + Math.cos(fangle) * fortR;
            var fz = fortCZ + Math.sin(fangle) * fortR;
            // Layer 1
            var fb1 = box(2.2, 0.9, 1.1, 0x696969, fx, 0.45, fz);
            fb1.rotation.y = fangle;
            // Layer 2
            var fb2 = box(2.0, 0.85, 1.1, 0x5A5A5A, fx, 1.35, fz);
            fb2.rotation.y = fangle;
            // Layer 3 (alternating for rampart look)
            if (fi % 2 === 0) {
                var fb3 = box(2.1, 0.8, 1.1, 0x636363, fx, 2.15, fz);
                fb3.rotation.y = fangle;
            }
        }
        // Fort interior ground
        box(34, 0.2, 34, 0x8B8682, fortCX, -0.05, fortCZ);
        // Fort entrance gap — a couple of entrance pillars
        box(0.8, 2.4, 0.9, 0x696969, fortCX + fortR, 1.2, fortCZ - 1.5);
        box(0.8, 2.4, 0.9, 0x696969, fortCX + fortR, 1.2, fortCZ + 1.5);

        // === CAVE ENTRANCE ===
        var caveCX = cx + 20;
        var caveCZ = -50;
        // Hillside backing block
        box(14, 8, 5, 0x9E9E9E, caveCX, 3.5, caveCZ - 2);
        // Dark opening
        box(4.5, 4.0, 4.5, 0x1a1a1a, caveCX, 2.0, caveCZ + 0.5);
        // Lintel block above entrance
        box(6.0, 1.0, 2.0, 0x808080, caveCX, 4.5, caveCZ + 0.5);
        // Side jamb blocks
        box(0.8, 4.0, 2.0, 0x8C8C8C, caveCX - 2.8, 2.0, caveCZ + 0.5);
        box(0.8, 4.0, 2.0, 0x8C8C8C, caveCX + 2.8, 2.0, caveCZ + 0.5);
        // Scattered boulders near entrance
        box(1.8, 1.2, 1.5, 0xA0A0A0, caveCX + 5, 0.6, caveCZ + 2);
        box(1.2, 0.9, 1.1, 0x9A9A9A, caveCX - 5, 0.45, caveCZ + 3);
        box(1.5, 1.1, 1.3, 0xA8A8A8, caveCX + 7, 0.55, caveCZ - 1);

        // === HAWTHORN TREES ===
        // Tree 1
        cyl(0.18, 0.25, 3.5, 6, 0x5C3317, cx - 30, 1.75, -30);
        sphere(2.8, 8, 6, 0x228B22, cx - 30, 4.2, -30);
        // Smaller branches via extra spheres
        sphere(1.4, 6, 5, 0x1E7A1E, cx - 31.5, 3.8, -31);
        sphere(1.2, 6, 5, 0x246B24, cx - 28.5, 3.5, -29);

        // Tree 2
        cyl(0.15, 0.22, 3.0, 6, 0x5C3317, cx + 10, 1.5, -45);
        sphere(2.4, 8, 6, 0x228B22, cx + 10, 4.0, -45);
        sphere(1.1, 6, 5, 0x1E7A1E, cx + 8.5, 3.6, -46.5);

        // Tree 3 — gnarled, leaning (offset canopy)
        cyl(0.12, 0.20, 2.8, 6, 0x5C3317, cx - 10, 1.4, 55);
        sphere(2.2, 8, 6, 0x228B22, cx - 9, 3.7, 55);
        sphere(1.0, 6, 5, 0x206820, cx - 11, 3.2, 56.5);

        // Tree 4
        cyl(0.20, 0.28, 4.0, 6, 0x5C3317, cx + 70, 2.0, 30);
        sphere(3.0, 8, 6, 0x228B22, cx + 70, 5.2, 30);
        sphere(1.5, 6, 5, 0x1E7A1E, cx + 68, 4.5, 31.5);
        sphere(1.3, 6, 5, 0x246B24, cx + 72, 4.6, 28.5);

        // Tree 5 — near abbey
        cyl(0.16, 0.23, 3.2, 6, 0x5C3317, cx - 90, 1.6, -60);
        sphere(2.6, 8, 6, 0x228B22, cx - 90, 4.3, -60);
        sphere(1.2, 6, 5, 0x1E7A1E, cx - 91.5, 3.9, -61.5);

        // === TURLOUGH (SEASONAL LAKE) ===
        var turCX = cx + 35;
        var turCZ = 60;
        // Depression rim
        box(28, 0.6, 24, 0x8B7D6B, turCX, -0.8, turCZ);
        // Water surface
        box(22, 0.2, 18, 0x006994, turCX, -1.0, turCZ);
        // Shallow edge variation
        box(24, 0.15, 5, 0x0077AA, turCX, -0.95, turCZ + 11);
        box(5, 0.15, 20, 0x0077AA, turCX + 12, -0.95, turCZ);
        // Muddy shore
        box(26, 0.3, 3.5, 0x6B5A3E, turCX, -0.7, turCZ - 11);
        box(3.5, 0.3, 22, 0x6B5A3E, turCX - 13, -0.7, turCZ);

        // === CORCOMROE ABBEY RUINS ===
        var abCX = cx - 100;
        var abCZ = -80;
        // Nave north wall (long wall with window gaps)
        box(12, 5, 1.2, 0x808080, abCX - 8,  2.5, abCZ);
        box(12, 5, 1.2, 0x808080, abCX + 8,  2.5, abCZ);
        // Window gap implied by placing two sections
        box(3,  2, 1.2, 0x808080, abCX,      4.0, abCZ);  // lintel above window
        // Nave south wall
        box(10, 5, 1.2, 0x808080, abCX - 8,  2.5, abCZ + 20);
        box(10, 5, 1.2, 0x808080, abCX + 8,  2.5, abCZ + 20);
        box(3,  1.8, 1.2, 0x808080, abCX,    4.1, abCZ + 20);
        // West gable end wall (taller, gabled silhouette)
        box(1.2, 8, 20, 0x808080, abCX - 18, 4.0, abCZ + 10);
        // East chancel wall stub
        box(1.2, 5, 14, 0x777777, abCX + 18, 2.5, abCZ + 10);
        // Chancel arch — two piers and a lintel
        box(1.5, 6, 1.5, 0x808080, abCX + 12, 3.0, abCZ + 5);
        box(1.5, 6, 1.5, 0x808080, abCX + 12, 3.0, abCZ + 15);
        box(6,  1.2, 1.5, 0x909090, abCX + 12, 6.4, abCZ + 10);
        // Remaining pier stubs
        box(1.5, 3.5, 1.5, 0x808080, abCX - 12, 1.75, abCZ + 5);
        box(1.5, 3.5, 1.5, 0x808080, abCX - 12, 1.75, abCZ + 15);
        // Floor rubble / broken stone
        box(3.5, 0.4, 2.5, 0x9A9A9A, abCX - 5,  0.2, abCZ + 7);
        box(2.8, 0.35, 2.0, 0x929292, abCX + 4,  0.2, abCZ + 13);
        box(4.0, 0.3, 1.8, 0xA0A0A0, abCX,       0.15, abCZ + 10);
        // Scattered stone blocks in grassy area around abbey
        box(1.8, 0.7, 1.2, 0x8A8A8A, abCX + 22, 0.35, abCZ + 3);
        box(2.1, 0.6, 0.9, 0x909090, abCX - 22, 0.3, abCZ + 18);
        box(1.5, 0.8, 1.4, 0x888888, abCX + 5,  0.4, abCZ - 5);
        // Abbey enclosure wall fragments
        box(8, 1.8, 0.8, 0x696969, abCX - 5,  0.9, abCZ - 8);
        box(0.8, 1.8, 10, 0x696969, abCX + 25, 0.9, abCZ + 5);

        // === ADDITIONAL LIMESTONE BOULDERS / ERRATICS ===
        box(2.5, 1.8, 2.2, 0xB0B0B0, cx + 30,  0.9, -20);
        box(3.0, 2.1, 2.8, 0xAAAAAA, cx - 25,  1.05, 40);
        box(1.6, 1.2, 1.9, 0xBEBEBE, cx + 40,  0.6, -35);
        box(2.0, 1.5, 2.4, 0xB4B4B4, cx - 40,  0.75, -15);
        box(1.9, 1.3, 1.7, 0xC0C0C0, cx + 60,  0.65, -50);
        box(2.8, 2.0, 3.0, 0xA8A8A8, cx - 55,  1.0, 45);

        // === LOW ROCKY RIDGE (hill outcrop) ===
        box(20, 2.5, 8, 0x9E9E9E, cx + 80, 1.25, -20);
        box(14, 3.8, 6, 0x969696, cx + 82, 2.65, -22);
        box(8,  5.0, 4, 0x909090, cx + 84, 4.25, -24);
        // Ridge cap rocks
        box(4, 1.2, 3, 0xB0B0B0, cx + 80,  3.1, -18);
        box(3, 1.0, 2, 0xACACAC, cx + 86,  2.95, -21);
    }

    function update(delta) { }

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
