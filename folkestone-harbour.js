window.FolkestoneHarbour = (function() {
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

    function makeMesh(geometry, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildHarbour() {
        // Inner harbour basin — blue water plane
        makeMesh(new THREE.BoxGeometry(200, 1, 180), 0x1a6fa8, 10600, 0.5, 200);

        // Harbour arm — long stone jetty
        makeMesh(new THREE.BoxGeometry(14, 6, 220), 0x8a7d6e, 10710, 3, 200);

        // Lighthouse base cylinder
        makeMesh(new THREE.CylinderGeometry(4, 5, 10, 12), 0xddd5c8, 10710, 8, 310);
        // Lighthouse upper cylinder
        makeMesh(new THREE.CylinderGeometry(2.5, 4, 4, 12), 0xffffff, 10710, 15, 310);
        // Lighthouse cone top
        makeMesh(new THREE.ConeGeometry(3, 4, 12), 0xcc2200, 10710, 20, 310);

        // West harbour wall
        makeMesh(new THREE.BoxGeometry(10, 5, 200), 0x8a7d6e, 10510, 2.5, 200);

        // Slipway — angled ramp into water
        makeMesh(new THREE.BoxGeometry(20, 1, 40), 0x9e9585, 10560, 1, 110, -0.12, 0, 0);

        // Fishing boat 1 — hull
        makeMesh(new THREE.BoxGeometry(10, 4, 26), 0x1a3a5c, 10630, 2, 160);
        // Fishing boat 1 — cabin
        makeMesh(new THREE.BoxGeometry(6, 5, 8), 0xffffff, 10630, 7, 155);
        // Fishing boat 1 — mast
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 18, 6), 0xaaaaaa, 10630, 14, 162);

        // Fishing boat 2 — hull
        makeMesh(new THREE.BoxGeometry(9, 4, 24), 0x8b1a1a, 10655, 2, 185);
        // Fishing boat 2 — cabin
        makeMesh(new THREE.BoxGeometry(5, 4, 7), 0xeeeecc, 10655, 7, 181);
        // Fishing boat 2 — mast
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 16, 6), 0x888888, 10655, 13, 188);

        // Fishing boat 3 — hull
        makeMesh(new THREE.BoxGeometry(8, 3.5, 22), 0x2d5a1b, 10680, 2, 170);
        // Fishing boat 3 — cabin
        makeMesh(new THREE.BoxGeometry(5, 4, 6), 0xdddddd, 10680, 6.5, 166);

        // Harbour-side quay buildings
        makeMesh(new THREE.BoxGeometry(30, 12, 14), 0xc8b89a, 10570, 6, 120);
        makeMesh(new THREE.BoxGeometry(22, 10, 14), 0xb0a080, 10545, 5, 120);
        makeMesh(new THREE.BoxGeometry(18, 14, 14), 0xd4c4a0, 10525, 7, 120);
    }

    function buildChannelTunnelTerminal() {
        var ox = 10600;
        var oz = -300;

        // Main terminal building — large flat concrete structure
        makeMesh(new THREE.BoxGeometry(260, 14, 80), 0xb0b8b0, ox, 7, oz);
        // Terminal roof overhang
        makeMesh(new THREE.BoxGeometry(280, 2, 90), 0xa0a8a0, ox, 14.5, oz);

        // Control tower
        makeMesh(new THREE.BoxGeometry(16, 30, 16), 0xc8c8c0, ox + 80, 15, oz - 10);
        makeMesh(new THREE.BoxGeometry(22, 4, 22), 0x9ab0a0, ox + 80, 32, oz - 10);

        // Vehicle loading ramps
        makeMesh(new THREE.BoxGeometry(40, 2, 60), 0x989888, ox - 80, 1, oz - 70, -0.08, 0, 0);
        makeMesh(new THREE.BoxGeometry(40, 2, 60), 0x989888, ox + 40, 1, oz - 70, -0.08, 0, 0);
        makeMesh(new THREE.BoxGeometry(40, 2, 60), 0x989888, ox + 160, 1, oz - 70, -0.08, 0, 0);

        // Shuttle train — locomotive
        makeMesh(new THREE.BoxGeometry(16, 10, 24), 0x3355aa, ox - 100, 5, oz + 50);
        // Shuttle train — carriages
        makeMesh(new THREE.BoxGeometry(14, 8, 30), 0x4466bb, ox - 100, 4, oz + 82);
        makeMesh(new THREE.BoxGeometry(14, 8, 30), 0x4466bb, ox - 100, 4, oz + 114);
        makeMesh(new THREE.BoxGeometry(14, 8, 30), 0x4477cc, ox - 100, 4, oz + 146);
        makeMesh(new THREE.BoxGeometry(14, 8, 30), 0x4477cc, ox - 100, 4, oz + 178);
        makeMesh(new THREE.BoxGeometry(14, 8, 30), 0x4488dd, ox - 100, 4, oz + 210);

        // Train tracks — rails
        makeMesh(new THREE.BoxGeometry(2, 1, 300), 0x555555, ox - 106, 0.5, oz + 130);
        makeMesh(new THREE.BoxGeometry(2, 1, 300), 0x555555, ox - 94, 0.5, oz + 130);

        // Security barriers — toll booths
        makeMesh(new THREE.BoxGeometry(6, 8, 6), 0xeeeedd, ox - 40, 4, oz - 60);
        makeMesh(new THREE.BoxGeometry(6, 8, 6), 0xeeeedd, ox + 20, 4, oz - 60);
        makeMesh(new THREE.BoxGeometry(6, 8, 6), 0xeeeedd, ox + 80, 4, oz - 60);
        makeMesh(new THREE.BoxGeometry(6, 8, 6), 0xeeeedd, ox + 140, 4, oz - 60);

        // Barrier arms
        makeMesh(new THREE.BoxGeometry(30, 1.5, 1.5), 0xff3300, ox - 25, 9, oz - 60);
        makeMesh(new THREE.BoxGeometry(30, 1.5, 1.5), 0xff3300, ox + 35, 9, oz - 60);
        makeMesh(new THREE.BoxGeometry(30, 1.5, 1.5), 0xff3300, ox + 95, 9, oz - 60);

        // Perimeter fence posts
        var i;
        for (i = 0; i < 10; i++) {
            makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 10, 6), 0x888888, ox - 130 + i * 26, 5, oz - 110);
        }
    }

    function buildTheLeas() {
        var ox = 10600;
        var oz = 450;

        // Clifftop promenade — long flat paved walkway
        makeMesh(new THREE.BoxGeometry(400, 2, 18), 0xd0c8b8, ox, 22, oz);

        // Cliff face
        makeMesh(new THREE.BoxGeometry(400, 44, 30), 0x9a8a70, ox, 0, oz + 25);

        // Beach at base of cliff
        makeMesh(new THREE.BoxGeometry(400, 1, 60), 0xe8d8a0, ox, 0, oz + 70);

        // Victorian bandstand — central octagonal platform
        makeMesh(new THREE.CylinderGeometry(12, 12, 2, 8), 0xd4c89a, ox, 24, oz);
        // Bandstand columns (8 sides)
        var j;
        for (j = 0; j < 8; j++) {
            var ang = j * Math.PI / 4;
            var cx = ox + Math.cos(ang) * 10;
            var cz = oz + Math.sin(ang) * 10;
            makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 8), 0xf0e8d0, cx, 28, cz);
        }
        // Bandstand roof — cone
        makeMesh(new THREE.ConeGeometry(13, 6, 8), 0x2244aa, ox, 37, oz);
        // Bandstand finial
        makeMesh(new THREE.SphereGeometry(1, 8, 8), 0xddcc00, ox, 43, oz);

        // Ornate shelter pavilion 1
        makeMesh(new THREE.BoxGeometry(20, 5, 10), 0xe8dcc8, ox - 120, 25, oz - 2);
        makeMesh(new THREE.BoxGeometry(22, 1.5, 12), 0x334488, ox - 120, 28.5, oz - 2);
        // Pavilion columns
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), 0xffffff, ox - 131, 25, oz - 6);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), 0xffffff, ox - 109, 25, oz - 6);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), 0xffffff, ox - 131, 25, oz + 2);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), 0xffffff, ox - 109, 25, oz + 2);

        // Ornate shelter pavilion 2
        makeMesh(new THREE.BoxGeometry(20, 5, 10), 0xe8dcc8, ox + 120, 25, oz - 2);
        makeMesh(new THREE.BoxGeometry(22, 1.5, 12), 0x334488, ox + 120, 28.5, oz - 2);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), 0xffffff, ox + 109, 25, oz - 6);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), 0xffffff, ox + 131, 25, oz - 6);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), 0xffffff, ox + 109, 25, oz + 2);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), 0xffffff, ox + 131, 25, oz + 2);

        // Zigzag cliff path — series of angled segments
        makeMesh(new THREE.BoxGeometry(6, 1, 50), 0xc8b898, ox + 60, 14, oz + 28, -0.44, 0.5, 0);
        makeMesh(new THREE.BoxGeometry(6, 1, 50), 0xc8b898, ox + 30, 7, oz + 35, -0.44, -0.5, 0);
        makeMesh(new THREE.BoxGeometry(6, 1, 50), 0xc8b898, ox + 60, 1, oz + 42, -0.3, 0.5, 0);

        // Promenade lamp posts
        var k;
        for (k = 0; k < 10; k++) {
            makeMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x444444, ox - 180 + k * 40, 27, oz - 7);
            makeMesh(new THREE.SphereGeometry(0.8, 6, 6), 0xffffcc, ox - 180 + k * 40, 32, oz - 7);
        }

        // Promenade railings — posts
        var m;
        for (m = 0; m < 20; m++) {
            makeMesh(new THREE.BoxGeometry(0.5, 4, 0.5), 0x222244, ox - 195 + m * 20, 26, oz + 8);
        }
    }

    function buildCreativeQuarter() {
        var ox = 10600;
        var oz = 80;

        // Narrow street grid — base road surfaces
        makeMesh(new THREE.BoxGeometry(8, 0.5, 200), 0x444444, ox - 60, 0.2, oz);
        makeMesh(new THREE.BoxGeometry(8, 0.5, 200), 0x444444, ox + 60, 0.2, oz);
        makeMesh(new THREE.BoxGeometry(140, 0.5, 8), 0x444444, ox, 0.2, oz - 60);
        makeMesh(new THREE.BoxGeometry(140, 0.5, 8), 0x444444, ox, 0.2, oz + 60);

        // Colorful shopfronts — row A (north side)
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0xd4302a, ox - 40, 5, oz - 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0x2a7ad4, ox - 26, 5, oz - 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0xf0b820, ox - 12, 5, oz - 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0x28b428, ox + 2, 5, oz - 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0x9922cc, ox + 16, 5, oz - 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0xcc6622, ox + 30, 5, oz - 80);

        // Shopfront signage boards
        makeMesh(new THREE.BoxGeometry(11, 2.5, 1), 0xffffff, ox - 40, 10.5, oz - 84.5);
        makeMesh(new THREE.BoxGeometry(11, 2.5, 1), 0xffffff, ox - 26, 10.5, oz - 84.5);
        makeMesh(new THREE.BoxGeometry(11, 2.5, 1), 0xffffff, ox - 12, 10.5, oz - 84.5);
        makeMesh(new THREE.BoxGeometry(11, 2.5, 1), 0xffffff, ox + 2, 10.5, oz - 84.5);
        makeMesh(new THREE.BoxGeometry(11, 2.5, 1), 0xffffff, ox + 16, 10.5, oz - 84.5);
        makeMesh(new THREE.BoxGeometry(11, 2.5, 1), 0xffffff, ox + 30, 10.5, oz - 84.5);

        // Shopfronts row B (south side)
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0xcc2288, ox - 40, 5, oz + 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0x22aacc, ox - 26, 5, oz + 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0x88cc22, ox - 12, 5, oz + 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0xcc8822, ox + 2, 5, oz + 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0x2244cc, ox + 16, 5, oz + 80);
        makeMesh(new THREE.BoxGeometry(12, 10, 8), 0xaa2222, ox + 30, 5, oz + 80);

        // Artists' studios — larger buildings with skylights
        makeMesh(new THREE.BoxGeometry(24, 14, 18), 0xc8c0b0, ox - 80, 7, oz + 20);
        // Studio skylight
        makeMesh(new THREE.BoxGeometry(10, 1, 6), 0x88ccff, ox - 80, 14.5, oz + 20);
        makeMesh(new THREE.BoxGeometry(10, 1, 6), 0x88ccff, ox - 80, 14.5, oz + 10);

        makeMesh(new THREE.BoxGeometry(22, 12, 18), 0xb8b0a0, ox + 80, 6, oz + 20);
        // Studio skylight
        makeMesh(new THREE.BoxGeometry(8, 1, 5), 0x88ccff, ox + 80, 12.5, oz + 20);
        makeMesh(new THREE.BoxGeometry(8, 1, 5), 0x88ccff, ox + 80, 12.5, oz + 12);

        // Gallery windows — large glass panes (lighter box faces)
        makeMesh(new THREE.BoxGeometry(8, 5, 0.5), 0x99ccee, ox - 80, 5, oz + 11.2);
        makeMesh(new THREE.BoxGeometry(8, 5, 0.5), 0x99ccee, ox - 80, 5, oz + 28.8);
        makeMesh(new THREE.BoxGeometry(8, 5, 0.5), 0x99ccee, ox + 80, 5, oz + 11.2);

        // Cobblestone square center feature
        makeMesh(new THREE.CylinderGeometry(3, 3, 2, 8), 0x886644, ox, 1, oz);
        makeMesh(new THREE.SphereGeometry(1.5, 8, 8), 0x664422, ox, 3, oz);
    }

    function buildMartelloTower() {
        var ox = 10600 - 180;
        var oz = 380;

        // Main tower body — squat cylinder radius 3 × height 8
        makeMesh(new THREE.CylinderGeometry(15, 16, 8, 16), 0x9a8a72, ox, 4, oz);

        // Flat roof parapet wall
        makeMesh(new THREE.CylinderGeometry(15.5, 15.5, 2, 16), 0x8a7a62, ox, 9, oz);

        // Gun emplacement — central raised platform on roof
        makeMesh(new THREE.CylinderGeometry(6, 6, 1.5, 12), 0x7a6a52, ox, 11, oz);

        // Cannon barrel
        makeMesh(new THREE.CylinderGeometry(1, 1.4, 10, 8), 0x444444, ox, 12.2, oz, 0, 0, Math.PI / 2);

        // Cannon wheel left
        makeMesh(new THREE.CylinderGeometry(2, 2, 1, 12), 0x663300, ox - 4, 11, oz + 2, Math.PI / 2, 0, 0);
        // Cannon wheel right
        makeMesh(new THREE.CylinderGeometry(2, 2, 1, 12), 0x663300, ox + 4, 11, oz + 2, Math.PI / 2, 0, 0);

        // Cannon port slits (decorative boxes set into wall)
        makeMesh(new THREE.BoxGeometry(3, 1.5, 1), 0x222222, ox + 14, 5, oz);
        makeMesh(new THREE.BoxGeometry(3, 1.5, 1), 0x222222, ox - 14, 5, oz);
        makeMesh(new THREE.BoxGeometry(1, 1.5, 3), 0x222222, ox, 5, oz + 14);
        makeMesh(new THREE.BoxGeometry(1, 1.5, 3), 0x222222, ox, 5, oz - 14);

        // Door arch base
        makeMesh(new THREE.BoxGeometry(3, 5, 1.5), 0x111111, ox + 8, 3.5, oz - 15);
        makeMesh(new THREE.SphereGeometry(1.5, 8, 4), 0x111111, ox + 8, 6.5, oz - 15);

        // Stone steps up to door
        makeMesh(new THREE.BoxGeometry(4, 1, 4), 0x9a8a72, ox + 8, 1, oz - 18);
        makeMesh(new THREE.BoxGeometry(4, 1, 3), 0x9a8a72, ox + 8, 2, oz - 17);
    }

    function buildGroundPlane() {
        // Base ground
        makeMesh(new THREE.BoxGeometry(700, 1, 900), 0x5a7a4a, 10600, -0.5, 100);
        // Sea / Channel water
        makeMesh(new THREE.BoxGeometry(700, 1, 300), 0x1155aa, 10600, 0, 400);
    }

    function build() {
        buildGroundPlane();
        buildHarbour();
        buildChannelTunnelTerminal();
        buildTheLeas();
        buildCreativeQuarter();
        buildMartelloTower();
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
