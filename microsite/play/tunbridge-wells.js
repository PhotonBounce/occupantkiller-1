/* ───────────────────────────────────────────────────────────────────────
   TUNBRIDGE WELLS — Royal Tunbridge Wells, The Pantiles, High Rocks.
   World offset: x = +6160, z = 0
   Objects target: 50-65
   ─────────────────────────────────────────────────────────────────────── */
window.TunbridgeWells = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 6160;
    var OZ = 0;

    /* ── helper: add mesh, push to objects[] ── */
    function addmesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    /* ── Ground slab ── */
    /* objects: 1 */
    function buildground() {
        addmesh(new THREE.BoxGeometry(220, 0.4, 200), 0xA89A80, 0, -0.2, 0);
    }

    /* ── 1. The Pantiles colonnade ── */
    /* 10 columns in 1 row + 5 cross-beams + 1 pavement = 16 */
    function buildpantiles() {
        var i;
        /* Single colonnade row — 10 columns */
        for (i = 0; i < 10; i++) {
            addmesh(new THREE.CylinderGeometry(0.6, 0.6, 4, 10), 0xD4C9A8,
                -22 + i * 5, 2, 0);
        }
        /* 5 overhead connecting beams spaced along colonnade */
        for (i = 0; i < 5; i++) {
            addmesh(new THREE.BoxGeometry(46, 0.3, 0.3), 0xC2B696,
                1, 4.15, -3 + i * 1.5);
        }
        /* Flagstone pavement strip */
        addmesh(new THREE.BoxGeometry(50, 0.15, 10), 0xB8AD96, 1, 0.08, 0);
    }
    /* pantiles total: 10 + 5 + 1 = 16 */

    /* ── 2. Chalybeate Spring pump room ── */
    /* Octagonal pavilion: main box + dome + well = 3 */
    function buildpumproom() {
        /* Main octagonal body */
        addmesh(new THREE.BoxGeometry(10, 5, 10), 0xCCBBAA, -50, 2.5, 20);
        /* Domed roof hemisphere */
        addmesh(new THREE.SphereGeometry(5.5, 10, 6), 0xBFAE9A, -50, 6.5, 20);
        /* Spring well pump cylinder */
        addmesh(new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8), 0x886655, -50, 1.25, 20);
    }
    /* pump room total: 3 */

    /* ── 3. Trinity Theatre (former church) ── */
    /* Nave + tower + spire + porch = 4 */
    function buildtrinitytheater() {
        /* Main nave */
        addmesh(new THREE.BoxGeometry(18, 9, 12), 0x885533, 30, 4.5, -30);
        /* Bell tower */
        addmesh(new THREE.BoxGeometry(4, 14, 4), 0x885533, 37, 7, -30);
        /* Pointed tower spire */
        addmesh(new THREE.ConeGeometry(2.8, 5, 4), 0x774422, 37, 16.5, -30);
        /* Entrance porch */
        addmesh(new THREE.BoxGeometry(5, 5, 3), 0x996644, 19, 2.5, -30);
    }
    /* trinity total: 4 */

    /* ── 4. High Rocks sandstone outcrops ── */
    /* 5 formations, 2 boxes each = 10 */
    function buildhighrocks() {
        /* Formation 1 */
        addmesh(new THREE.BoxGeometry(8, 5, 6), 0xCC7744, 60, 2.5, 50);
        addmesh(new THREE.BoxGeometry(5, 3, 4), 0xBB6633, 60.5, 6.5, 50.5);
        /* Formation 2 */
        addmesh(new THREE.BoxGeometry(7, 6, 5), 0xBB6633, 72, 3, 44);
        addmesh(new THREE.BoxGeometry(4.5, 3, 3.5), 0xCC7744, 72.5, 7.5, 44.5);
        /* Formation 3 */
        addmesh(new THREE.BoxGeometry(9, 4, 7), 0xCC7744, 64, 2, 62);
        addmesh(new THREE.BoxGeometry(5.5, 3, 4.5), 0xBB6633, 64.5, 5.5, 62.5);
        /* Formation 4 */
        addmesh(new THREE.BoxGeometry(6, 5, 5), 0xBB6633, 80, 2.5, 55);
        addmesh(new THREE.BoxGeometry(4, 3, 3.5), 0xCC7744, 80.5, 6.5, 55.5);
        /* Formation 5 */
        addmesh(new THREE.BoxGeometry(8, 6, 6), 0xCC7744, 75, 3, 68);
        addmesh(new THREE.BoxGeometry(5, 3.5, 4), 0xBB6633, 74.5, 8, 68.5);
    }
    /* highrocks total: 10 */

    /* ── 5. Railway station ── */
    /* Main building + portico + canopy + platform + 2 chimneys = 6 */
    function buildrailwaystation() {
        /* Grand 1845 main building */
        addmesh(new THREE.BoxGeometry(25, 8, 15), 0xBBAA88, -70, 4, -50);
        /* Entrance portico */
        addmesh(new THREE.BoxGeometry(10, 7, 5), 0xCCBB99, -70, 3.5, -57.5);
        /* Long platform canopy */
        addmesh(new THREE.BoxGeometry(60, 1, 10), 0x888877, -80, 7.5, -40);
        /* Platform surface */
        addmesh(new THREE.BoxGeometry(62, 0.5, 8), 0xCCBBAA, -80, 0.25, -40);
        /* Chimney stacks */
        addmesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0xAA9977, -62, 10, -50);
        addmesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0xAA9977, -65, 10, -50);
    }
    /* railway total: 6 */

    /* ── 6. Civic Centre — modernist block ── */
    /* Main block + upper floor + entrance steps = 3 */
    function buildciviccentre() {
        addmesh(new THREE.BoxGeometry(20, 10, 15), 0x889988, -40, 5, 55);
        addmesh(new THREE.BoxGeometry(16, 4, 12), 0x99AA99, -40, 12, 55);
        addmesh(new THREE.BoxGeometry(8, 0.6, 3), 0x778888, -40, 0.3, 62);
    }
    /* civic total: 3 */

    /* ── 7. The Common — 5 birch trees ── */
    /* trunk + canopy per tree = 10 */
    function buildcommon() {
        var td = [
            [0, 70], [10, 80], [-10, 75], [20, 90], [-15, 85]
        ];
        for (var t = 0; t < td.length; t++) {
            /* Pale bark trunk */
            addmesh(new THREE.CylinderGeometry(0.4, 0.5, 5, 7), 0xDDDDCC, td[t][0], 2.5, td[t][1]);
            /* Canopy sphere */
            addmesh(new THREE.SphereGeometry(3, 8, 6), 0x5A8A2A, td[t][0], 7.5, td[t][1]);
        }
    }
    /* common total: 5 * 2 = 10 */

    /* ── 8. Georgian townhouses on The Mount ── */
    /* 3 terraced houses: body + chimney each = 6 */
    function buildmount() {
        var i;
        for (i = 0; i < 3; i++) {
            /* Stucco house body */
            addmesh(new THREE.BoxGeometry(6, 9, 10), 0xF0EDE0, -10 + i * 7, 4.5, -60);
            /* Chimney */
            addmesh(new THREE.BoxGeometry(1.2, 3, 1.2), 0xCCBBAA, -10 + i * 7, 10.5, -60);
        }
        /* Iron railings — single combined front fence */
        addmesh(new THREE.BoxGeometry(20, 1.2, 0.15), 0x333333, -3, 0.6, -55.2);
    }
    /* mount total: 3+3+1 = 7 */

    /* ── LineSegments boundary outline ── */
    /* objects: 1 */
    function buildoutline() {
        var pts = new Float32Array([
            -110, 0, -80,   110, 0, -80,
             110, 0, -80,   110, 0, 115,
             110, 0, 115,  -110, 0, 115,
            -110, 0, 115,  -110, 0, -80
        ]);
        var geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        var lmat = new THREE.LineBasicMaterial({ color: 0x555544 });
        var lines = new THREE.LineSegments(geom, lmat);
        lines.position.set(OX, 0, OZ);
        scene.add(lines);
        objects.push(lines);
    }

    /* ─────────────────────────────────────────────────────────────────── */
    /* Grand total: 1+16+3+4+10+6+3+10+7+1 = 61  (within 50-65 target)  */
    /* ─────────────────────────────────────────────────────────────────── */

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function build() {
        buildground();
        buildpantiles();
        buildpumproom();
        buildtrinitytheater();
        buildhighrocks();
        buildrailwaystation();
        buildciviccentre();
        buildcommon();
        buildmount();
        buildoutline();
    }

    function update(delta) {
        /* static environment */
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
