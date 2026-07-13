window.WiganPier = (function() {
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

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function build() {
        var ox = 21920;
        var m, g, i;

        // -------------------------------------------------------
        // LEEDS-LIVERPOOL CANAL — wide water channel
        // -------------------------------------------------------
        // Canal water surface (flat box, very thin)
        m = makeMesh(new THREE.BoxGeometry(400, 0.5, 28), 0x4682B4);
        m.position.set(ox, 0.25, 0);
        addMesh(m);

        // Canal bed (deeper box beneath)
        m = makeMesh(new THREE.BoxGeometry(400, 2, 32), 0x2B4F6E);
        m.position.set(ox, -1.5, 0);
        addMesh(m);

        // North towpath
        m = makeMesh(new THREE.BoxGeometry(400, 0.4, 6), 0xB8A880);
        m.position.set(ox, 0.2, -19);
        addMesh(m);

        // South towpath
        m = makeMesh(new THREE.BoxGeometry(400, 0.4, 6), 0xB8A880);
        m.position.set(ox, 0.2, 19);
        addMesh(m);

        // Canal bank north — grass slope
        m = makeMesh(new THREE.BoxGeometry(400, 1, 4), 0x5A7A3A);
        m.position.set(ox, 0.5, -23);
        addMesh(m);

        // Canal bank south — grass slope
        m = makeMesh(new THREE.BoxGeometry(400, 1, 4), 0x5A7A3A);
        m.position.set(ox, 0.5, 23);
        addMesh(m);

        // Lock gate north leaf (west)
        m = makeMesh(new THREE.BoxGeometry(0.5, 3, 12), 0x5C3A1E);
        m.position.set(ox - 60, 1.5, -7);
        addMesh(m);

        // Lock gate south leaf (west)
        m = makeMesh(new THREE.BoxGeometry(0.5, 3, 12), 0x5C3A1E);
        m.position.set(ox - 60, 1.5, 7);
        addMesh(m);

        // Lock gate north leaf (east)
        m = makeMesh(new THREE.BoxGeometry(0.5, 3, 12), 0x5C3A1E);
        m.position.set(ox + 60, 1.5, -7);
        addMesh(m);

        // Lock gate south leaf (east)
        m = makeMesh(new THREE.BoxGeometry(0.5, 3, 12), 0x5C3A1E);
        m.position.set(ox + 60, 1.5, 7);
        addMesh(m);

        // Lock gate balance beam west north
        m = makeMesh(new THREE.BoxGeometry(8, 0.3, 0.3), 0x5C3A1E);
        m.position.set(ox - 64, 3, -7);
        addMesh(m);

        // Lock gate balance beam west south
        m = makeMesh(new THREE.BoxGeometry(8, 0.3, 0.3), 0x5C3A1E);
        m.position.set(ox - 64, 3, 7);
        addMesh(m);

        // Lock walls (stone masonry)
        m = makeMesh(new THREE.BoxGeometry(120, 3, 2), 0x9E8E70);
        m.position.set(ox, 1.5, -14);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(120, 3, 2), 0x9E8E70);
        m.position.set(ox, 1.5, 14);
        addMesh(m);

        // Mooring bollards along towpath
        for (i = 0; i < 8; i++) {
            m = makeMesh(new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8), 0x333333);
            m.position.set(ox - 140 + i * 40, 0.6, -17);
            addMesh(m);
        }

        // -------------------------------------------------------
        // WIGAN PIER — coal loading tippler wharf
        // -------------------------------------------------------
        // Pier base platform (wooden decking)
        m = makeMesh(new THREE.BoxGeometry(30, 1.2, 18), 0x8B4513);
        m.position.set(ox - 20, 0.6, 10);
        addMesh(m);

        // Pier support piles (under water)
        for (i = 0; i < 6; i++) {
            m = makeMesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 8), 0x6B3410);
            m.position.set(ox - 30 + i * 6, -1, 10);
            addMesh(m);
        }

        // Coal tippler frame — A-frame structure
        m = makeMesh(new THREE.BoxGeometry(1, 8, 1), 0x5C4A3A);
        m.position.set(ox - 22, 4.5, 8);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(1, 8, 1), 0x5C4A3A);
        m.position.set(ox - 18, 4.5, 8);
        addMesh(m);

        // Tippler cross beam
        m = makeMesh(new THREE.BoxGeometry(6, 1, 1), 0x5C4A3A);
        m.position.set(ox - 20, 8.5, 8);
        addMesh(m);

        // Tippler cradle/drum
        m = makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 12), 0x4A3A2A);
        m.position.set(ox - 20, 6, 8);
        m.rotation.x = Math.PI / 2;
        addMesh(m);

        // Coal chute
        m = makeMesh(new THREE.BoxGeometry(2, 5, 3), 0x2A2A2A);
        m.position.set(ox - 20, 2, 12);
        addMesh(m);

        // Pier railing north
        m = makeMesh(new THREE.BoxGeometry(30, 1, 0.2), 0x8B4513);
        m.position.set(ox - 20, 1.8, 2);
        addMesh(m);

        // Pier railing posts
        for (i = 0; i < 6; i++) {
            m = makeMesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), 0x8B4513);
            m.position.set(ox - 33 + i * 6.6, 1.5, 2);
            addMesh(m);
        }

        // -------------------------------------------------------
        // TRENCHERFIELD MILL — 6-storey Victorian cotton mill
        // -------------------------------------------------------
        // Main mill block
        m = makeMesh(new THREE.BoxGeometry(60, 24, 30), 0xC8B89A);
        m.position.set(ox + 80, 12, -60);
        addMesh(m);

        // Mill red-brick texture overlay (darker band courses)
        for (i = 0; i < 5; i++) {
            m = makeMesh(new THREE.BoxGeometry(60.2, 0.4, 30.2), 0xA0806A);
            m.position.set(ox + 80, 4 + i * 4, -60);
            addMesh(m);
        }

        // Mill windows — south facade rows
        for (i = 0; i < 6; i++) {
            var j;
            for (j = 0; j < 5; j++) {
                m = makeMesh(new THREE.BoxGeometry(2.5, 3.5, 0.3), 0x5A8AB0);
                m.position.set(ox + 56 + i * 9, 3 + j * 4.2, -44.9);
                addMesh(m);
            }
        }

        // Mill north facade windows
        for (i = 0; i < 6; i++) {
            m = makeMesh(new THREE.BoxGeometry(2.5, 3.5, 0.3), 0x5A8AB0);
            m.position.set(ox + 56 + i * 9, 6, -75.1);
            addMesh(m);
        }

        // Mill engine house annex (houses the triple-expansion steam engine)
        m = makeMesh(new THREE.BoxGeometry(20, 18, 20), 0xC0A890);
        m.position.set(ox + 110, 9, -60);
        addMesh(m);

        // Engine house windows
        m = makeMesh(new THREE.BoxGeometry(4, 5, 0.3), 0x5A8AB0);
        m.position.set(ox + 110, 8, -49.9);
        addMesh(m);

        // Flywheel pit cover dome
        m = makeMesh(new THREE.SphereGeometry(5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xA09080);
        m.position.set(ox + 110, 18, -60);
        addMesh(m);

        // Mill entrance archway — base
        m = makeMesh(new THREE.BoxGeometry(6, 8, 2), 0xB0A080);
        m.position.set(ox + 80, 4, -44);
        addMesh(m);

        // Arch top (semi-circular approximation)
        m = makeMesh(new THREE.CylinderGeometry(3, 3, 2, 8, 1, false, 0, Math.PI), 0xB0A080);
        m.position.set(ox + 80, 8, -44);
        m.rotation.x = Math.PI / 2;
        addMesh(m);

        // -------------------------------------------------------
        // MILL CHIMNEY — tall Victorian stack
        // -------------------------------------------------------
        m = makeMesh(new THREE.CylinderGeometry(2.5, 4, 55, 12), 0x777777);
        m.position.set(ox + 55, 27.5, -80);
        addMesh(m);

        // Chimney cap ring
        m = makeMesh(new THREE.CylinderGeometry(3, 2.5, 1.5, 12), 0x666666);
        m.position.set(ox + 55, 55.75, -80);
        addMesh(m);

        // -------------------------------------------------------
        // THE ORWELL PUB — in old mill building
        // -------------------------------------------------------
        m = makeMesh(new THREE.BoxGeometry(22, 10, 14), 0xDEB887);
        m.position.set(ox - 10, 5, -50);
        addMesh(m);

        // Orwell pub sign board
        m = makeMesh(new THREE.BoxGeometry(6, 2, 0.3), 0x8B6914);
        m.position.set(ox - 10, 8, -43.1);
        addMesh(m);

        // Pub windows
        for (i = 0; i < 3; i++) {
            m = makeMesh(new THREE.BoxGeometry(2.5, 2.8, 0.3), 0x8FD0E8);
            m.position.set(ox - 16 + i * 7, 5, -43.1);
            addMesh(m);
        }

        // Pub roof (pitched)
        m = makeMesh(new THREE.BoxGeometry(22, 2, 14), 0xB87050);
        m.position.set(ox - 10, 10.5, -50);
        addMesh(m);

        // Pub door
        m = makeMesh(new THREE.BoxGeometry(1.8, 3.5, 0.3), 0x6B4010);
        m.position.set(ox - 10, 2, -43.1);
        addMesh(m);

        // -------------------------------------------------------
        // VICTORIAN INDUSTRIAL TERRACES — workers back-to-back
        // -------------------------------------------------------
        // Row 1 — south of canal
        for (i = 0; i < 8; i++) {
            // Terrace house body
            m = makeMesh(new THREE.BoxGeometry(5, 7, 8), 0xC87020);
            m.position.set(ox - 120 + i * 6, 3.5, 55);
            addMesh(m);
            // Roof
            m = makeMesh(new THREE.BoxGeometry(5, 1.5, 8), 0x8A5010);
            m.position.set(ox - 120 + i * 6, 7.5, 55);
            addMesh(m);
        }

        // Row 2 — back-to-back (facing away)
        for (i = 0; i < 8; i++) {
            m = makeMesh(new THREE.BoxGeometry(5, 7, 8), 0xC87020);
            m.position.set(ox - 120 + i * 6, 3.5, 65);
            addMesh(m);
            m = makeMesh(new THREE.BoxGeometry(5, 1.5, 8), 0x8A5010);
            m.position.set(ox - 120 + i * 6, 7.5, 65);
            addMesh(m);
        }

        // Cobblestone street between terraces
        m = makeMesh(new THREE.BoxGeometry(48, 0.3, 6), 0x888070);
        m.position.set(ox - 99, 0.15, 60);
        addMesh(m);

        // -------------------------------------------------------
        // MINE HEADGEAR — steel winding gear
        // -------------------------------------------------------
        // Headgear tower legs
        m = makeMesh(new THREE.BoxGeometry(1, 20, 1), 0x888888);
        m.position.set(ox + 170, 10, 30);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(1, 20, 1), 0x888888);
        m.position.set(ox + 180, 10, 30);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(1, 20, 1), 0x888888);
        m.position.set(ox + 170, 10, 40);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(1, 20, 1), 0x888888);
        m.position.set(ox + 180, 10, 40);
        addMesh(m);

        // Headgear cross bracing
        m = makeMesh(new THREE.BoxGeometry(10, 1, 1), 0x888888);
        m.position.set(ox + 175, 8, 30);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(10, 1, 1), 0x888888);
        m.position.set(ox + 175, 14, 30);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(1, 1, 10), 0x888888);
        m.position.set(ox + 170, 8, 35);
        addMesh(m);

        // Headgear crown beam
        m = makeMesh(new THREE.BoxGeometry(12, 1.5, 12), 0x777777);
        m.position.set(ox + 175, 20.5, 35);
        addMesh(m);

        // Winding wheel
        m = makeMesh(new THREE.CylinderGeometry(4, 4, 1, 16, 1, true), 0x666666);
        m.position.set(ox + 175, 22, 35);
        m.rotation.x = Math.PI / 2;
        addMesh(m);

        // Pithead winding house
        m = makeMesh(new THREE.BoxGeometry(12, 8, 10), 0x999988);
        m.position.set(ox + 175, 4, 55);
        addMesh(m);

        // Winding house roof
        m = makeMesh(new THREE.BoxGeometry(12, 2, 10), 0x888877);
        m.position.set(ox + 175, 9, 55);
        addMesh(m);

        // Shaft collar (top of mine shaft)
        m = makeMesh(new THREE.CylinderGeometry(2.5, 3, 1.5, 12), 0x555555);
        m.position.set(ox + 175, 0.75, 35);
        addMesh(m);

        // -------------------------------------------------------
        // WIGAN TOWN CENTRE — market hall and parish church
        // -------------------------------------------------------
        // Market hall main structure
        m = makeMesh(new THREE.BoxGeometry(35, 10, 25), 0xC8B89A);
        m.position.set(ox - 80, 5, -100);
        addMesh(m);

        // Market hall arched roof ridge
        m = makeMesh(new THREE.BoxGeometry(35, 4, 4), 0xB0A080);
        m.position.set(ox - 80, 12, -100);
        addMesh(m);

        // Market hall colonnade pillars
        for (i = 0; i < 5; i++) {
            m = makeMesh(new THREE.CylinderGeometry(0.5, 0.6, 10, 8), 0xD8C8A8);
            m.position.set(ox - 94 + i * 8, 5, -87.5);
            addMesh(m);
        }

        // Parish Church of All Saints — tower
        m = makeMesh(new THREE.BoxGeometry(10, 28, 10), 0xA89878);
        m.position.set(ox - 130, 14, -100);
        addMesh(m);

        // Church tower battlements
        m = makeMesh(new THREE.BoxGeometry(11, 2, 11), 0xB0A080);
        m.position.set(ox - 130, 29, -100);
        addMesh(m);

        // Church nave
        m = makeMesh(new THREE.BoxGeometry(30, 14, 18), 0xA89878);
        m.position.set(ox - 108, 7, -100);
        addMesh(m);

        // Church nave roof (pitched — apex box)
        m = makeMesh(new THREE.BoxGeometry(30, 4, 4), 0x887060);
        m.position.set(ox - 108, 16, -100);
        addMesh(m);

        // Church stained glass windows (coloured)
        for (i = 0; i < 4; i++) {
            m = makeMesh(new THREE.BoxGeometry(2, 5, 0.3), 0x7050C0);
            m.position.set(ox - 120 + i * 8, 8, -90.9);
            addMesh(m);
        }

        // -------------------------------------------------------
        // MESNES PARK — Victorian park
        // -------------------------------------------------------
        // Park ground
        m = makeMesh(new THREE.BoxGeometry(80, 0.4, 60), 0x4CAF50);
        m.position.set(ox + 30, 0.2, -150);
        addMesh(m);

        // Ornamental flower beds
        m = makeMesh(new THREE.BoxGeometry(12, 0.5, 8), 0xE070A0);
        m.position.set(ox + 20, 0.45, -140);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(12, 0.5, 8), 0xFFD700);
        m.position.set(ox + 40, 0.45, -140);
        addMesh(m);

        // Park bandstand base
        m = makeMesh(new THREE.CylinderGeometry(6, 7, 1, 8), 0xD8C8A8);
        m.position.set(ox + 30, 0.5, -160);
        addMesh(m);

        // Bandstand pillars
        for (i = 0; i < 8; i++) {
            m = makeMesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 8), 0xD8C8A8);
            m.position.set(ox + 30 + Math.sin(i * Math.PI / 4) * 5.5, 3, -160 + Math.cos(i * Math.PI / 4) * 5.5);
            addMesh(m);
        }

        // Bandstand roof (cone)
        m = makeMesh(new THREE.ConeGeometry(7, 3.5, 8), 0x336633);
        m.position.set(ox + 30, 6.75, -160);
        addMesh(m);

        // Park trees (sphere on cylinder)
        for (i = 0; i < 6; i++) {
            m = makeMesh(new THREE.CylinderGeometry(0.3, 0.4, 5, 6), 0x5C3A1E);
            m.position.set(ox - 10 + i * 14, 2.5, -145);
            addMesh(m);
            m = makeMesh(new THREE.SphereGeometry(2.5, 8, 6), 0x2E7D32);
            m.position.set(ox - 10 + i * 14, 7.5, -145);
            addMesh(m);
        }

        // Park path (gravel)
        m = makeMesh(new THREE.BoxGeometry(3, 0.45, 55), 0xC8B870);
        m.position.set(ox + 30, 0.22, -152);
        addMesh(m);

        // Park bench (2x)
        m = makeMesh(new THREE.BoxGeometry(2.5, 0.3, 0.8), 0x8B6914);
        m.position.set(ox + 15, 0.9, -148);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(2.5, 0.3, 0.8), 0x8B6914);
        m.position.set(ox + 45, 0.9, -148);
        addMesh(m);

        // -------------------------------------------------------
        // DW STADIUM (now Brick Community Stadium) — rugby/football
        // -------------------------------------------------------
        // Main west stand
        m = makeMesh(new THREE.BoxGeometry(80, 16, 14), 0xCCCCCC);
        m.position.set(ox + 220, 8, 0);
        addMesh(m);

        // East stand
        m = makeMesh(new THREE.BoxGeometry(80, 14, 14), 0xCCCCCC);
        m.position.set(ox + 220, 7, 80);
        addMesh(m);

        // North end stand
        m = makeMesh(new THREE.BoxGeometry(14, 10, 68), 0xCCCCCC);
        m.position.set(ox + 180, 5, 40);
        addMesh(m);

        // South end stand
        m = makeMesh(new THREE.BoxGeometry(14, 10, 68), 0xCCCCCC);
        m.position.set(ox + 260, 5, 40);
        addMesh(m);

        // Pitch (grass)
        m = makeMesh(new THREE.BoxGeometry(68, 0.4, 44), 0x3A8A3A);
        m.position.set(ox + 220, 0.2, 40);
        addMesh(m);

        // Pitch markings (white lines)
        m = makeMesh(new THREE.BoxGeometry(68, 0.42, 0.5), 0xFFFFFF);
        m.position.set(ox + 220, 0.21, 40);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(0.5, 0.42, 44), 0xFFFFFF);
        m.position.set(ox + 220, 0.21, 40);
        addMesh(m);

        // Stadium floodlight pylons
        m = makeMesh(new THREE.CylinderGeometry(0.4, 0.6, 22, 6), 0xAAAAAA);
        m.position.set(ox + 183, 11, 4);
        addMesh(m);

        m = makeMesh(new THREE.CylinderGeometry(0.4, 0.6, 22, 6), 0xAAAAAA);
        m.position.set(ox + 257, 11, 4);
        addMesh(m);

        m = makeMesh(new THREE.CylinderGeometry(0.4, 0.6, 22, 6), 0xAAAAAA);
        m.position.set(ox + 183, 11, 76);
        addMesh(m);

        m = makeMesh(new THREE.CylinderGeometry(0.4, 0.6, 22, 6), 0xAAAAAA);
        m.position.set(ox + 257, 11, 76);
        addMesh(m);

        // Floodlight heads
        m = makeMesh(new THREE.BoxGeometry(4, 1, 4), 0xFFFF88);
        m.position.set(ox + 183, 22.5, 4);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(4, 1, 4), 0xFFFF88);
        m.position.set(ox + 257, 22.5, 4);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(4, 1, 4), 0xFFFF88);
        m.position.set(ox + 183, 22.5, 76);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(4, 1, 4), 0xFFFF88);
        m.position.set(ox + 257, 22.5, 76);
        addMesh(m);

        // -------------------------------------------------------
        // GROUND PLANE — cobbles and roads
        // -------------------------------------------------------
        // Main road surface
        m = makeMesh(new THREE.BoxGeometry(500, 0.3, 200), 0x555555);
        m.position.set(ox, -0.15, 0);
        addMesh(m);

        // Road centre white line
        m = makeMesh(new THREE.BoxGeometry(500, 0.32, 0.5), 0xEEEEEE);
        m.position.set(ox, -0.04, 35);
        addMesh(m);

        // Canal bridge over towpath — deck
        m = makeMesh(new THREE.BoxGeometry(14, 1, 10), 0x9E8E70);
        m.position.set(ox, 1, 0);
        addMesh(m);

        // Bridge arch (south)
        m = makeMesh(new THREE.CylinderGeometry(5, 5, 14, 8, 1, true, 0, Math.PI), 0x9E8E70);
        m.position.set(ox, -1, 0);
        m.rotation.z = Math.PI / 2;
        addMesh(m);

        // Bridge parapet north
        m = makeMesh(new THREE.BoxGeometry(14, 1.2, 1), 0x9E8E70);
        m.position.set(ox, 2, -5);
        addMesh(m);

        // Bridge parapet south
        m = makeMesh(new THREE.BoxGeometry(14, 1.2, 1), 0x9E8E70);
        m.position.set(ox, 2, 5);
        addMesh(m);

        // Gasometer frame (industrial landmark)
        m = makeMesh(new THREE.CylinderGeometry(10, 10, 18, 12, 1, true), 0x778877);
        m.position.set(ox + 150, 9, -40);
        addMesh(m);

        // Gasometer top ring
        m = makeMesh(new THREE.CylinderGeometry(10.5, 10.5, 1, 12), 0x667766);
        m.position.set(ox + 150, 18.5, -40);
        addMesh(m);

        // Canal narrowboat hull
        m = makeMesh(new THREE.BoxGeometry(18, 1.6, 4), 0x8B2020);
        m.position.set(ox + 20, 0.8, 0);
        addMesh(m);

        // Narrowboat cabin
        m = makeMesh(new THREE.BoxGeometry(10, 2, 3.6), 0xDDCC44);
        m.position.set(ox + 18, 2.5, 0);
        addMesh(m);

        // Narrowboat bow (wedge shape approximation with box)
        m = makeMesh(new THREE.BoxGeometry(2.5, 1.4, 3.5), 0x8B2020);
        m.position.set(ox + 30, 0.7, 0);
        addMesh(m);

        // Warehouse building near pier
        m = makeMesh(new THREE.BoxGeometry(20, 12, 15), 0xB08060);
        m.position.set(ox - 50, 6, -40);
        addMesh(m);

        // Warehouse roof
        m = makeMesh(new THREE.BoxGeometry(20, 2, 15), 0x888060);
        m.position.set(ox - 50, 13, -40);
        addMesh(m);

        // Warehouse loading door
        m = makeMesh(new THREE.BoxGeometry(4, 6, 0.4), 0x6B5040);
        m.position.set(ox - 50, 3, -32.8);
        addMesh(m);

        // Warehouse hoist beam
        m = makeMesh(new THREE.BoxGeometry(0.4, 0.4, 4), 0x555555);
        m.position.set(ox - 50, 11, -30.8);
        addMesh(m);

        // Street lamp posts
        for (i = 0; i < 5; i++) {
            m = makeMesh(new THREE.CylinderGeometry(0.1, 0.15, 5, 6), 0x333333);
            m.position.set(ox - 80 + i * 40, 2.5, 30);
            addMesh(m);
            // Lamp head
            m = makeMesh(new THREE.SphereGeometry(0.4, 6, 4), 0xFFFF99);
            m.position.set(ox - 80 + i * 40, 5.4, 30);
            addMesh(m);
        }

        // Debris/coal heap near pier
        m = makeMesh(new THREE.SphereGeometry(3, 8, 5), 0x1A1A1A);
        m.position.set(ox - 15, 1.5, 22);
        m.scale.y = 0.5;
        addMesh(m);

        m = makeMesh(new THREE.SphereGeometry(2, 8, 5), 0x1A1A1A);
        m.position.set(ox - 10, 1, 25);
        m.scale.y = 0.5;
        addMesh(m);
    }

    function update(delta) {
        // Static environment — no per-frame updates required
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
