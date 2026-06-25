window.ChristchurchPriory = (function() {
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

    function addMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildPriory() {
        var ox = 13520;
        var oz = 0;

        // Long nave - 90m, Norman/Gothic
        addMesh(new THREE.BoxGeometry(90, 14, 18), 0xd4c9a8, ox, 7, oz);
        // Nave roof
        addMesh(new THREE.BoxGeometry(92, 2, 20), 0x8a7a6a, ox, 15, oz);

        // Central tower with Norman stonework
        addMesh(new THREE.BoxGeometry(14, 36, 14), 0xc8b896, ox + 10, 18, oz);
        // Tower pinnacles
        addMesh(new THREE.ConeGeometry(1.5, 6, 4), 0xa09070, ox + 3, 39, oz - 3);
        addMesh(new THREE.ConeGeometry(1.5, 6, 4), 0xa09070, ox + 17, 39, oz - 3);
        addMesh(new THREE.ConeGeometry(1.5, 6, 4), 0xa09070, ox + 3, 39, oz + 3);
        addMesh(new THREE.ConeGeometry(1.5, 6, 4), 0xa09070, ox + 17, 39, oz + 3);
        // Tower battlements
        addMesh(new THREE.BoxGeometry(16, 3, 16), 0xb8a882, ox + 10, 37, oz);

        // West front - massive facade
        addMesh(new THREE.BoxGeometry(20, 22, 3), 0xc8b896, ox - 45, 11, oz);
        // West towers
        addMesh(new THREE.BoxGeometry(6, 28, 6), 0xb8a882, ox - 52, 14, oz - 8);
        addMesh(new THREE.BoxGeometry(6, 28, 6), 0xb8a882, ox - 52, 14, oz + 8);
        addMesh(new THREE.ConeGeometry(4, 10, 4), 0x907860, ox - 52, 33, oz - 8);
        addMesh(new THREE.ConeGeometry(4, 10, 4), 0x907860, ox - 52, 33, oz + 8);

        // Lady Chapel - east end
        addMesh(new THREE.BoxGeometry(18, 10, 12), 0xd0c5a0, ox + 54, 5, oz);
        addMesh(new THREE.BoxGeometry(19, 1.5, 14), 0x8a7a6a, ox + 54, 11, oz);

        // North porch
        addMesh(new THREE.BoxGeometry(8, 12, 8), 0xc0b090, ox - 20, 6, oz - 13);
        addMesh(new THREE.CylinderGeometry(0.5, 0.5, 12, 6), 0xa09070, ox - 16, 6, oz - 17);
        addMesh(new THREE.CylinderGeometry(0.5, 0.5, 12, 6), 0xa09070, ox - 24, 6, oz - 17);

        // Chapter house - octagonal
        addMesh(new THREE.CylinderGeometry(8, 8, 10, 8), 0xc8b896, ox + 30, 5, oz - 18);
        addMesh(new THREE.ConeGeometry(9, 6, 8), 0x8a7a6a, ox + 30, 13, oz - 18);

        // Flying buttresses - south side
        var i;
        for (i = 0; i < 6; i++) {
            addMesh(new THREE.BoxGeometry(1.5, 8, 6), 0xb8a882, ox - 30 + i * 12, 11, oz + 12);
        }
        // Flying buttresses - north side
        for (i = 0; i < 6; i++) {
            addMesh(new THREE.BoxGeometry(1.5, 8, 6), 0xb8a882, ox - 30 + i * 12, 11, oz - 12);
        }

        // Transepts
        addMesh(new THREE.BoxGeometry(18, 16, 26), 0xd4c9a8, ox + 10, 8, oz);
        addMesh(new THREE.BoxGeometry(20, 1.5, 28), 0x8a7a6a, ox + 10, 16.75, oz);

        // Nave windows - south clerestory (decorative boxes)
        for (i = 0; i < 5; i++) {
            addMesh(new THREE.BoxGeometry(0.3, 4, 3), 0x7a8fa8, ox - 35 + i * 14, 12, oz + 9);
        }

        // Graveyard wall
        addMesh(new THREE.BoxGeometry(110, 2, 1), 0x9a8a70, ox, 1, oz - 22);
        addMesh(new THREE.BoxGeometry(110, 2, 1), 0x9a8a70, ox, 1, oz + 22);
        addMesh(new THREE.BoxGeometry(1, 2, 44), 0x9a8a70, ox - 55, 1, oz);
        addMesh(new THREE.BoxGeometry(1, 2, 44), 0x9a8a70, ox + 55, 1, oz);

        // Priory close path
        addMesh(new THREE.BoxGeometry(80, 0.2, 4), 0xb0a080, ox, 0.1, oz - 18);

        // Gravestones
        for (i = 0; i < 12; i++) {
            addMesh(new THREE.BoxGeometry(0.4, 1.5, 0.8), 0x888878, ox - 40 + i * 7, 0.75, oz + 16);
            addMesh(new THREE.BoxGeometry(0.4, 1.5, 0.8), 0x888878, ox - 40 + i * 7, 0.75, oz + 18);
        }
    }

    function buildCastle() {
        var ox = 13520 + 200;
        var oz = 120;

        // Motte (mound) - raised earthwork
        addMesh(new THREE.CylinderGeometry(28, 38, 10, 12), 0x6a7a4a, ox, 5, oz);

        // Shell keep - rectangular ruins on motte
        addMesh(new THREE.BoxGeometry(30, 12, 3), 0x9a8870, ox, 17, oz - 13);
        addMesh(new THREE.BoxGeometry(30, 12, 3), 0x9a8870, ox, 17, oz + 13);
        addMesh(new THREE.BoxGeometry(3, 12, 26), 0x9a8870, ox - 13, 17, oz);
        addMesh(new THREE.BoxGeometry(3, 12, 26), 0x9a8870, ox + 13, 17, oz);

        // Corner towers of keep
        addMesh(new THREE.CylinderGeometry(4, 4, 14, 8), 0x8a7860, ox - 12, 17, oz - 12);
        addMesh(new THREE.CylinderGeometry(4, 4, 14, 8), 0x8a7860, ox + 12, 17, oz - 12);
        addMesh(new THREE.CylinderGeometry(4, 4, 14, 8), 0x8a7860, ox - 12, 17, oz + 12);
        addMesh(new THREE.CylinderGeometry(4, 4, 14, 8), 0x8a7860, ox + 12, 17, oz + 12);

        // Ruined walls - broken tops
        addMesh(new THREE.BoxGeometry(10, 6, 2.5), 0x9a8870, ox - 8, 21, oz - 13);
        addMesh(new THREE.BoxGeometry(8, 4, 2.5), 0x9a8870, ox + 6, 19, oz + 13);

        // Constable's house ruins - rare Norman domestic building
        addMesh(new THREE.BoxGeometry(20, 8, 10), 0xa09070, ox + 60, 4, oz - 20);
        addMesh(new THREE.BoxGeometry(20, 0.3, 10), 0x7a6a50, ox + 60, 8.15, oz - 20);
        // Constable's house ruined walls
        addMesh(new THREE.BoxGeometry(0.5, 5, 10), 0xa09070, ox + 50, 2.5, oz - 20);
        addMesh(new THREE.BoxGeometry(0.5, 7, 10), 0xa09070, ox + 70, 3.5, oz - 20);
        addMesh(new THREE.BoxGeometry(20, 0.5, 0.5), 0xa09070, ox + 60, 3, oz - 25);
        // Norman arched window remnant
        addMesh(new THREE.BoxGeometry(3, 4, 0.3), 0x8a7a60, ox + 60, 5, oz - 25);

        // Moat outline - ring of low depression indicators
        addMesh(new THREE.CylinderGeometry(48, 50, 1, 20), 0x5a6a3a, ox, -0.5, oz);

        // Castle grounds wall/outer bailey
        addMesh(new THREE.BoxGeometry(80, 3, 2), 0x8a7860, ox, 1.5, oz - 45);
        addMesh(new THREE.BoxGeometry(80, 3, 2), 0x8a7860, ox, 1.5, oz + 45);
        addMesh(new THREE.BoxGeometry(2, 3, 90), 0x8a7860, ox - 40, 1.5, oz);
        addMesh(new THREE.BoxGeometry(2, 3, 90), 0x8a7860, ox + 40, 1.5, oz);

        // Gateway towers
        addMesh(new THREE.CylinderGeometry(4, 5, 10, 8), 0x9a8870, ox - 40, 5, oz - 6);
        addMesh(new THREE.CylinderGeometry(4, 5, 10, 8), 0x9a8870, ox - 40, 5, oz + 6);
    }

    function buildRiverConfluence() {
        var ox = 13520 - 50;
        var oz = 300;

        // River Avon - wide channel flowing south
        addMesh(new THREE.BoxGeometry(200, 0.2, 30), 0x3a6a9a, ox - 20, -0.3, oz);
        addMesh(new THREE.BoxGeometry(200, 0.2, 30), 0x3a6a9a, ox - 20, -0.35, oz + 10);

        // River Stour - flowing from west
        addMesh(new THREE.BoxGeometry(30, 0.2, 180), 0x3a6a9a, ox - 100, -0.3, oz - 80);
        addMesh(new THREE.BoxGeometry(30, 0.2, 50), 0x4a7aaa, ox - 100, -0.35, oz - 60);

        // Confluence pool - wider water body
        addMesh(new THREE.BoxGeometry(60, 0.2, 60), 0x2a5a8a, ox - 80, -0.4, oz);

        // Town Bridge - medieval stone bridge
        addMesh(new THREE.BoxGeometry(32, 2, 8), 0xb0a080, ox - 20, 1, oz - 2);
        // Bridge piers
        addMesh(new THREE.BoxGeometry(3, 4, 8), 0xa09070, ox - 28, 2, oz - 2);
        addMesh(new THREE.BoxGeometry(3, 4, 8), 0xa09070, ox - 12, 2, oz - 2);
        addMesh(new THREE.BoxGeometry(3, 4, 8), 0xa09070, ox + 4, 2, oz - 2);
        // Bridge parapet
        addMesh(new THREE.BoxGeometry(32, 1, 1), 0x908070, ox - 20, 2.5, oz - 6);
        addMesh(new THREE.BoxGeometry(32, 1, 1), 0x908070, ox - 20, 2.5, oz + 2);

        // Water mill - north bank
        addMesh(new THREE.BoxGeometry(12, 10, 10), 0x9a8060, ox + 20, 5, oz - 20);
        addMesh(new THREE.BoxGeometry(14, 1, 12), 0x8a7050, ox + 20, 10.5, oz - 20);
        addMesh(new THREE.ConeGeometry(7, 5, 4), 0x6a5a40, ox + 20, 13, oz - 20);
        // Mill wheel
        addMesh(new THREE.CylinderGeometry(4, 4, 1.5, 12), 0x6a5040, ox + 14, 4, oz - 20);

        // Water mill - south bank
        addMesh(new THREE.BoxGeometry(10, 8, 8), 0x9a8060, ox + 20, 4, oz + 15);
        addMesh(new THREE.ConeGeometry(6, 4, 4), 0x6a5a40, ox + 20, 10, oz + 15);

        // Quay - stone wharf
        addMesh(new THREE.BoxGeometry(60, 2, 8), 0x888070, ox + 20, 1, oz + 22);
        // Quay walls
        addMesh(new THREE.BoxGeometry(60, 3, 1), 0x787060, ox + 20, 2.5, oz + 26);
        // Mooring posts
        var i;
        for (i = 0; i < 8; i++) {
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), 0x5a4a30, ox - 10 + i * 9, 2.5, oz + 22);
        }

        // Riverside vegetation
        for (i = 0; i < 10; i++) {
            addMesh(new THREE.SphereGeometry(2, 6, 5), 0x3a7a2a, ox - 80 + i * 16, 2, oz - 35);
            addMesh(new THREE.CylinderGeometry(0.3, 0.5, 5, 5), 0x5a4a30, ox - 80 + i * 16, 2.5, oz - 35);
        }

        // Reed beds along bank
        for (i = 0; i < 15; i++) {
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 4), 0x6a8a4a, ox - 90 + i * 10, 1.5, oz + 18);
        }
    }

    function buildHengistburyHead() {
        var ox = 13520 + 800;
        var oz = -400;

        // Chalk headland - main promontory mass
        addMesh(new THREE.BoxGeometry(300, 30, 120), 0xc8c4a0, ox, 15, oz);
        addMesh(new THREE.BoxGeometry(280, 25, 100), 0xd0cca8, ox + 20, 27.5, oz);
        addMesh(new THREE.BoxGeometry(200, 20, 80), 0xd8d4b0, ox + 60, 37.5, oz);
        addMesh(new THREE.BoxGeometry(100, 15, 60), 0xe0dcc0, ox + 110, 47.5, oz);

        // Cliff face - south side dropping to sea
        addMesh(new THREE.BoxGeometry(300, 40, 20), 0xb8b490, ox, 20, oz - 70);

        // Double dykes - Iron Age fortifications
        addMesh(new THREE.BoxGeometry(10, 8, 140), 0x9a9070, ox - 120, 19, oz);
        addMesh(new THREE.BoxGeometry(10, 8, 140), 0x9a9070, ox - 100, 19, oz);
        // Ditch between dykes
        addMesh(new THREE.BoxGeometry(10, 2, 140), 0x7a7060, ox - 110, 15, oz);

        // Western outer dyke
        addMesh(new THREE.BoxGeometry(8, 6, 140), 0x9a9070, ox - 145, 18, oz);
        addMesh(new THREE.BoxGeometry(8, 2, 140), 0x7a7060, ox - 135, 14, oz);

        // Martello tower - Napoleonic coastal defence
        addMesh(new THREE.CylinderGeometry(8, 9, 14, 12), 0xa89878, ox + 140, 40, oz - 40);
        addMesh(new THREE.CylinderGeometry(8.5, 8.5, 1.5, 12), 0x988868, ox + 140, 47.75, oz - 40);
        // Martello tower parapet
        addMesh(new THREE.CylinderGeometry(9, 9, 2, 12), 0x988868, ox + 140, 48.75, oz - 40);
        // Gun platform on top
        addMesh(new THREE.CylinderGeometry(6, 6, 1, 12), 0x887858, ox + 140, 50, oz - 40);

        // Beach below headland
        addMesh(new THREE.BoxGeometry(350, 0.5, 40), 0xe8d8a0, ox, -0.25, oz - 90);
        addMesh(new THREE.BoxGeometry(350, 0.5, 30), 0xf0e0b0, ox, -0.3, oz - 120);

        // Sea approaches
        addMesh(new THREE.BoxGeometry(400, 0.2, 100), 0x2a6a9a, ox, -0.5, oz - 170);

        // Heathland vegetation on top
        var i;
        for (i = 0; i < 20; i++) {
            addMesh(new THREE.SphereGeometry(3, 5, 4), 0x5a7a3a, ox - 80 + i * 20, 41, oz - 20 + (i % 3) * 15);
        }

        // Coastal path markers
        for (i = 0; i < 8; i++) {
            addMesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), 0xe0c060, ox - 100 + i * 35, 39, oz - 5);
        }

        // Iron Age hut circles - archaeological remains (floor plans)
        addMesh(new THREE.CylinderGeometry(5, 5, 0.3, 10), 0x8a8060, ox + 50, 37.15, oz + 20);
        addMesh(new THREE.CylinderGeometry(4, 4, 0.3, 10), 0x8a8060, ox + 70, 37.15, oz + 30);
        addMesh(new THREE.CylinderGeometry(6, 6, 0.3, 10), 0x8a8060, ox + 30, 37.15, oz + 35);
    }

    function buildTown() {
        var ox = 13520 - 100;
        var oz = 60;

        // High Street - main shopping street
        addMesh(new THREE.BoxGeometry(200, 0.2, 12), 0x888880, ox, 0.1, oz);

        // High Street buildings - south side
        var i;
        for (i = 0; i < 10; i++) {
            var h = 6 + (i % 3) * 2;
            addMesh(new THREE.BoxGeometry(16, h, 12), 0xd0b890 - i * 0x010000, ox - 80 + i * 18, h / 2, oz + 14);
            addMesh(new THREE.BoxGeometry(18, 1, 14), 0xa09060, ox - 80 + i * 18, h + 0.5, oz + 14);
        }

        // High Street buildings - north side
        for (i = 0; i < 10; i++) {
            var hn = 5 + (i % 4);
            addMesh(new THREE.BoxGeometry(16, hn, 12), 0xc8a880, ox - 80 + i * 18, hn / 2, oz - 14);
            addMesh(new THREE.BoxGeometry(18, 1, 14), 0xa09060, ox - 80 + i * 18, hn + 0.5, oz - 14);
        }

        // Red House Museum - Georgian mansion
        addMesh(new THREE.BoxGeometry(28, 14, 18), 0xc03020, ox - 160, 7, oz + 30);
        addMesh(new THREE.BoxGeometry(30, 2, 20), 0xa02010, ox - 160, 15, oz + 30);
        // Georgian windows - symmetrical
        for (i = 0; i < 4; i++) {
            addMesh(new THREE.BoxGeometry(2, 3, 0.3), 0x90b0c8, ox - 173 + i * 9, 8, oz + 21);
            addMesh(new THREE.BoxGeometry(2, 3, 0.3), 0x90b0c8, ox - 173 + i * 9, 12, oz + 21);
        }
        // Museum entrance columns
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 8, 8), 0xe0d0c0, ox - 165, 4, oz + 21);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 8, 8), 0xe0d0c0, ox - 155, 4, oz + 21);
        // Museum garden
        addMesh(new THREE.BoxGeometry(40, 0.2, 20), 0x4a7a3a, ox - 160, 0.1, oz + 50);
        addMesh(new THREE.SphereGeometry(4, 6, 5), 0x3a6a2a, ox - 145, 4, oz + 52);
        addMesh(new THREE.SphereGeometry(4, 6, 5), 0x3a6a2a, ox - 175, 4, oz + 52);

        // Town Hall / civic building
        addMesh(new THREE.BoxGeometry(22, 12, 16), 0xd8c8a0, ox + 60, 6, oz - 30);
        addMesh(new THREE.BoxGeometry(24, 2, 18), 0xb8a880, ox + 60, 13, oz - 30);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 8), 0xd0c090, ox + 60, 17, oz - 30);
        addMesh(new THREE.SphereGeometry(2, 8, 6), 0xd8c830, ox + 60, 22, oz - 30);

        // Quay promenade along the river
        addMesh(new THREE.BoxGeometry(150, 0.3, 10), 0x9a9090, ox + 30, 0.15, oz + 80);
        // Promenade railings
        for (i = 0; i < 20; i++) {
            addMesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), 0x808080, ox - 40 + i * 8, 0.6, oz + 85);
        }
        addMesh(new THREE.BoxGeometry(150, 0.15, 0.15), 0x808080, ox + 30, 1.15, oz + 85);

        // Bandstand on quay
        addMesh(new THREE.CylinderGeometry(5, 5, 0.5, 8), 0xe0d0a0, ox + 80, 0.25, oz + 78);
        for (i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), 0xc0b090, ox + 80 + Math.cos(angle) * 4.5, 2.5, oz + 78 + Math.sin(angle) * 4.5);
        }
        addMesh(new THREE.ConeGeometry(6, 3, 8), 0x8a7a5a, ox + 80, 5.5, oz + 78);

        // Street trees
        for (i = 0; i < 12; i++) {
            addMesh(new THREE.SphereGeometry(2.5, 6, 5), 0x3a7a3a, ox - 100 + i * 18, 4.5, oz + 7);
            addMesh(new THREE.CylinderGeometry(0.4, 0.6, 4, 5), 0x5a4a30, ox - 100 + i * 18, 2, oz + 7);
        }

        // Car park / market square
        addMesh(new THREE.BoxGeometry(60, 0.1, 40), 0x787878, ox + 100, 0.05, oz + 10);

        // Market cross
        addMesh(new THREE.CylinderGeometry(3, 4, 1, 8), 0xd0c0a0, ox + 100, 0.5, oz + 10);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 6, 8), 0xc8b890, ox + 100, 3.5, oz + 10);
        addMesh(new THREE.BoxGeometry(4, 1, 4), 0xb8a880, ox + 100, 7, oz + 10);
        addMesh(new THREE.ConeGeometry(1, 3, 4), 0xa09070, ox + 100, 8.5, oz + 10);
    }

    function buildMudefordQuay() {
        var ox = 13520 + 600;
        var oz = 150;

        // Mudeford Spit - narrow sand spit
        addMesh(new THREE.BoxGeometry(600, 0.5, 30), 0xe8d890, ox + 200, 0.25, oz);
        addMesh(new THREE.BoxGeometry(600, 0.5, 20), 0xf0e0a0, ox + 200, 0.3, oz + 25);

        // Beach huts - most expensive in UK - colourful row
        var colors = [
            0xe03020, 0x20a040, 0x2060d0, 0xf0c020, 0xe08020,
            0x9020c0, 0x20c0c0, 0xe02080, 0x40c040, 0x6080e0
        ];
        var i;
        for (i = 0; i < 30; i++) {
            var hc = colors[i % colors.length];
            addMesh(new THREE.BoxGeometry(4, 4, 4), hc, ox + 20 + i * 6, 2, oz + 5);
            addMesh(new THREE.BoxGeometry(4.5, 0.5, 4.5), 0x808080, ox + 20 + i * 6, 4.25, oz + 5);
            addMesh(new THREE.ConeGeometry(3, 2, 4), 0x606060, ox + 20 + i * 6, 5.5, oz + 5);
        }

        // Second row of beach huts
        for (i = 0; i < 20; i++) {
            var hc2 = colors[(i + 3) % colors.length];
            addMesh(new THREE.BoxGeometry(4, 4, 4), hc2, ox + 30 + i * 6, 2, oz + 18);
            addMesh(new THREE.BoxGeometry(4.5, 0.5, 4.5), 0x808080, ox + 30 + i * 6, 4.25, oz + 18);
            addMesh(new THREE.ConeGeometry(3, 2, 4), 0x606060, ox + 30 + i * 6, 5.5, oz + 18);
        }

        // Mudeford Quay main structure
        addMesh(new THREE.BoxGeometry(80, 1.5, 20), 0x787878, ox, 0.75, oz - 20);
        addMesh(new THREE.BoxGeometry(80, 2, 2), 0x686868, ox, 2, oz - 30);

        // Quay buildings - cafe, ferry office
        addMesh(new THREE.BoxGeometry(14, 6, 10), 0xd0c8b0, ox - 25, 3, oz - 18);
        addMesh(new THREE.BoxGeometry(16, 1, 12), 0xa09080, ox - 25, 6.5, oz - 18);
        addMesh(new THREE.BoxGeometry(10, 5, 8), 0xc8c0a8, ox - 5, 2.5, oz - 18);

        // Fishing boats moored at quay
        for (i = 0; i < 5; i++) {
            addMesh(new THREE.BoxGeometry(10, 2, 4), 0xf0f0e0, ox + 10 + i * 14, 1, oz - 26);
            addMesh(new THREE.BoxGeometry(6, 3, 3), 0xe0d8c0, ox + 10 + i * 14, 2.5, oz - 26);
            addMesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 4), 0xa09080, ox + 10 + i * 14, 6, oz - 26);
        }

        // Lobster pots stacked on quay
        for (i = 0; i < 8; i++) {
            addMesh(new THREE.BoxGeometry(1.5, 1, 1.5), 0x8a7a40, ox - 30 + i * 5, 2, oz - 22);
            addMesh(new THREE.BoxGeometry(1.5, 1, 1.5), 0x7a6a30, ox - 30 + i * 5, 3, oz - 22);
            addMesh(new THREE.BoxGeometry(1.5, 1, 1.5), 0x8a7a40, ox - 29 + i * 5, 4, oz - 22);
        }

        // Ferry landing pontoon
        addMesh(new THREE.BoxGeometry(12, 0.8, 5), 0xa09060, ox + 35, 0.4, oz - 30);

        // Run Haven - harbour mouth
        addMesh(new THREE.BoxGeometry(60, 0.2, 60), 0x2a5a8a, ox - 40, -0.5, oz - 50);

        // Harbour navigation marker
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), 0xe03020, ox - 10, 4, oz - 55);
        addMesh(new THREE.ConeGeometry(1, 1.5, 4), 0xe03020, ox - 10, 8.75, oz - 55);

        // Seagulls (simplified - sphere clusters)
        addMesh(new THREE.SphereGeometry(0.4, 4, 3), 0xf0f0f0, ox + 5, 5, oz - 20);
        addMesh(new THREE.SphereGeometry(0.4, 4, 3), 0xf0f0f0, ox + 12, 6, oz - 25);
        addMesh(new THREE.SphereGeometry(0.4, 4, 3), 0xf0f0f0, ox - 5, 4, oz - 18);
    }

    function buildGroundPlane() {
        var ox = 13520;
        addMesh(new THREE.BoxGeometry(2000, 0.5, 1200), 0x6a8a5a, ox, -0.25, 0);
        // Water - harbour and bay
        addMesh(new THREE.BoxGeometry(800, 0.2, 400), 0x2a6a9a, ox + 500, -0.3, -200);
        // Sand banks
        addMesh(new THREE.BoxGeometry(200, 0.3, 60), 0xe8d890, ox + 450, -0.15, 100);
    }

    function build() {
        buildGroundPlane();
        buildPriory();
        buildCastle();
        buildRiverConfluence();
        buildHengistburyHead();
        buildTown();
        buildMudefordQuay();
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
