window.WeymouthHarbour = (function() {
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

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geometry, color) {
        return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: color }));
    }

    function build() {
        buildEsplanade();
        buildGeorgeStatue();
        buildHarbour();
        buildNotheFort();
        buildWeymouthBay();
        buildJubileeClock();
    }

    function buildEsplanade() {
        var x = 13640;
        var i, mesh, geo;

        // Promenade base — long flat slab along seafront
        geo = new THREE.BoxGeometry(400, 1, 20);
        mesh = makeMesh(geo, 0xcccccc);
        mesh.position.set(x, 0.5, -10);
        addObj(mesh);

        // Beach sand strip
        geo = new THREE.BoxGeometry(400, 0.5, 60);
        mesh = makeMesh(geo, 0xf0e68c);
        mesh.position.set(x, 0.25, 40);
        addObj(mesh);

        // Georgian townhouses — rainbow pastel colours along esplanade
        var houseColors = [
            0xffb3ba, 0xffdfba, 0xffffba, 0xbaffc9,
            0xbae1ff, 0xe8baff, 0xffbaee, 0xffd9ba,
            0xc9ffba, 0xbaffee, 0xfff5ba, 0xffbaba,
            0xd4baff, 0xbaffe8, 0xffceba, 0xe0ffba
        ];

        for (i = 0; i < 16; i++) {
            // House body
            geo = new THREE.BoxGeometry(22, 18, 14);
            mesh = makeMesh(geo, houseColors[i]);
            mesh.position.set(x - 180 + i * 24, 9, -17);
            addObj(mesh);

            // House roof
            geo = new THREE.BoxGeometry(22, 4, 14);
            mesh = makeMesh(geo, 0x888888);
            mesh.position.set(x - 180 + i * 24, 20, -17);
            addObj(mesh);

            // Ground floor windows/shopfronts
            geo = new THREE.BoxGeometry(18, 4, 1);
            mesh = makeMesh(geo, 0x334455);
            mesh.position.set(x - 180 + i * 24, 4, -10.5);
            addObj(mesh);

            // Upper windows
            geo = new THREE.BoxGeometry(8, 5, 1);
            mesh = makeMesh(geo, 0x6699aa);
            mesh.position.set(x - 180 + i * 24, 13, -10.5);
            addObj(mesh);
        }

        // Donkeys on beach — sphere shapes
        var donkeyPositions = [
            [x - 60, 30], [x - 30, 45], [x + 10, 38],
            [x + 50, 50], [x + 90, 35], [x + 130, 42]
        ];
        for (i = 0; i < donkeyPositions.length; i++) {
            // Donkey body
            geo = new THREE.SphereGeometry(2.5, 8, 6);
            mesh = makeMesh(geo, 0x8B7355);
            mesh.position.set(donkeyPositions[i][0], 3, donkeyPositions[i][1]);
            addObj(mesh);
            // Donkey head
            geo = new THREE.SphereGeometry(1.5, 8, 6);
            mesh = makeMesh(geo, 0x9B8365);
            mesh.position.set(donkeyPositions[i][0] + 2.5, 4.5, donkeyPositions[i][1]);
            addObj(mesh);
            // Donkey ears
            geo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
            mesh = makeMesh(geo, 0x8B7355);
            mesh.position.set(donkeyPositions[i][0] + 2.3, 6.2, donkeyPositions[i][1] - 0.5);
            addObj(mesh);
            geo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
            mesh = makeMesh(geo, 0x8B7355);
            mesh.position.set(donkeyPositions[i][0] + 2.3, 6.2, donkeyPositions[i][1] + 0.5);
            addObj(mesh);
            // Donkey legs
            geo = new THREE.CylinderGeometry(0.4, 0.4, 2, 6);
            mesh = makeMesh(geo, 0x7A6345);
            mesh.position.set(donkeyPositions[i][0] - 1, 1.2, donkeyPositions[i][1] - 1);
            addObj(mesh);
            geo = new THREE.CylinderGeometry(0.4, 0.4, 2, 6);
            mesh = makeMesh(geo, 0x7A6345);
            mesh.position.set(donkeyPositions[i][0] - 1, 1.2, donkeyPositions[i][1] + 1);
            addObj(mesh);
            geo = new THREE.CylinderGeometry(0.4, 0.4, 2, 6);
            mesh = makeMesh(geo, 0x7A6345);
            mesh.position.set(donkeyPositions[i][0] + 1, 1.2, donkeyPositions[i][1] - 1);
            addObj(mesh);
            geo = new THREE.CylinderGeometry(0.4, 0.4, 2, 6);
            mesh = makeMesh(geo, 0x7A6345);
            mesh.position.set(donkeyPositions[i][0] + 1, 1.2, donkeyPositions[i][1] + 1);
            addObj(mesh);
        }

        // Sand sculptor works — mound shapes
        var sculptPositions = [
            [x + 160, 55], [x + 180, 50], [x - 100, 48]
        ];
        for (i = 0; i < sculptPositions.length; i++) {
            geo = new THREE.SphereGeometry(3, 8, 6);
            mesh = makeMesh(geo, 0xd4c47a);
            mesh.scale.set(2, 0.8, 1.5);
            mesh.position.set(sculptPositions[i][0], 1.5, sculptPositions[i][1]);
            addObj(mesh);
            // Castle turret on top
            geo = new THREE.CylinderGeometry(1, 1.5, 3, 8);
            mesh = makeMesh(geo, 0xc8b86a);
            mesh.position.set(sculptPositions[i][0], 4, sculptPositions[i][1]);
            addObj(mesh);
        }
    }

    function buildGeorgeStatue() {
        var x = 13640 + 20;
        var geo, mesh;

        // Plinth / pedestal
        geo = new THREE.BoxGeometry(6, 8, 6);
        mesh = makeMesh(geo, 0xddddcc);
        mesh.position.set(x, 4, -5);
        addObj(mesh);

        // Plinth top step
        geo = new THREE.BoxGeometry(7, 1, 7);
        mesh = makeMesh(geo, 0xccccbb);
        mesh.position.set(x, 8.5, -5);
        addObj(mesh);

        // Horse body — painted bright red/gold
        geo = new THREE.SphereGeometry(3, 10, 8);
        mesh = makeMesh(geo, 0xcc3300);
        mesh.scale.set(1.8, 1, 1.2);
        mesh.position.set(x, 12, -5);
        addObj(mesh);

        // Horse head
        geo = new THREE.SphereGeometry(1.5, 8, 6);
        mesh = makeMesh(geo, 0xcc3300);
        mesh.position.set(x + 3.5, 14, -5);
        addObj(mesh);

        // Horse neck
        geo = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
        mesh = makeMesh(geo, 0xcc3300);
        mesh.rotation.z = -0.5;
        mesh.position.set(x + 2.5, 13, -5);
        addObj(mesh);

        // Horse legs front
        geo = new THREE.CylinderGeometry(0.5, 0.5, 4, 6);
        mesh = makeMesh(geo, 0xaa2200);
        mesh.position.set(x + 1.5, 9.5, -6);
        addObj(mesh);

        // Raised front leg
        geo = new THREE.CylinderGeometry(0.5, 0.5, 3.5, 6);
        mesh = makeMesh(geo, 0xaa2200);
        mesh.rotation.z = 0.8;
        mesh.position.set(x + 3.5, 10.5, -6);
        addObj(mesh);

        // Horse rear legs
        geo = new THREE.CylinderGeometry(0.5, 0.5, 4, 6);
        mesh = makeMesh(geo, 0xaa2200);
        mesh.position.set(x - 1.5, 9.5, -6);
        addObj(mesh);
        geo = new THREE.CylinderGeometry(0.5, 0.5, 4, 6);
        mesh = makeMesh(geo, 0xaa2200);
        mesh.position.set(x - 1.5, 9.5, -4);
        addObj(mesh);

        // King George III figure body
        geo = new THREE.CylinderGeometry(0.8, 1.0, 4, 8);
        mesh = makeMesh(geo, 0x003366);
        mesh.position.set(x, 15.5, -5);
        addObj(mesh);

        // King George head
        geo = new THREE.SphereGeometry(1, 8, 6);
        mesh = makeMesh(geo, 0xffd5a0);
        mesh.position.set(x, 18, -5);
        addObj(mesh);

        // Crown / hat
        geo = new THREE.CylinderGeometry(0.8, 1.0, 1.5, 8);
        mesh = makeMesh(geo, 0xffcc00);
        mesh.position.set(x, 19.5, -5);
        addObj(mesh);

        // Arm with sceptre
        geo = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
        mesh = makeMesh(geo, 0x003366);
        mesh.rotation.z = -1.0;
        mesh.position.set(x + 2, 16.5, -5);
        addObj(mesh);
        geo = new THREE.CylinderGeometry(0.15, 0.15, 4, 6);
        mesh = makeMesh(geo, 0xffcc00);
        mesh.position.set(x + 3.2, 18, -5);
        addObj(mesh);
    }

    function buildHarbour() {
        var x = 13640 - 50;
        var i, geo, mesh;

        // Harbour walls — stone quayside
        geo = new THREE.BoxGeometry(200, 4, 8);
        mesh = makeMesh(geo, 0x999977);
        mesh.position.set(x - 50, 2, -80);
        addObj(mesh);

        geo = new THREE.BoxGeometry(8, 4, 120);
        mesh = makeMesh(geo, 0x999977);
        mesh.position.set(x - 150, 2, -140);
        addObj(mesh);

        geo = new THREE.BoxGeometry(8, 4, 120);
        mesh = makeMesh(geo, 0x999977);
        mesh.position.set(x + 50, 2, -140);
        addObj(mesh);

        // Harbour water
        geo = new THREE.BoxGeometry(196, 0.5, 110);
        mesh = makeMesh(geo, 0x1a5276);
        mesh.position.set(x - 50, 0.25, -135);
        addObj(mesh);

        // Town Bridge — swing bridge
        geo = new THREE.BoxGeometry(30, 2, 8);
        mesh = makeMesh(geo, 0x667788);
        mesh.position.set(x - 50, 3, -80);
        addObj(mesh);

        // Bridge supports
        geo = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        mesh = makeMesh(geo, 0x556677);
        mesh.position.set(x - 65, 4, -80);
        addObj(mesh);
        geo = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        mesh = makeMesh(geo, 0x556677);
        mesh.position.set(x - 35, 4, -80);
        addObj(mesh);

        // Bridge pivot tower
        geo = new THREE.CylinderGeometry(2, 2, 14, 8);
        mesh = makeMesh(geo, 0x445566);
        mesh.position.set(x - 50, 7, -80);
        addObj(mesh);

        // Trawlers in inner harbour
        var trawlerPositions = [
            [x - 80, -100], [x - 60, -120], [x - 30, -110],
            [x + 10, -130], [x + 30, -105]
        ];
        for (i = 0; i < trawlerPositions.length; i++) {
            // Hull
            geo = new THREE.BoxGeometry(14, 3, 5);
            mesh = makeMesh(geo, 0x336699);
            mesh.position.set(trawlerPositions[i][0], 2.5, trawlerPositions[i][1]);
            addObj(mesh);
            // Cabin
            geo = new THREE.BoxGeometry(6, 4, 4);
            mesh = makeMesh(geo, 0xffffff);
            mesh.position.set(trawlerPositions[i][0] - 2, 5.5, trawlerPositions[i][1]);
            addObj(mesh);
            // Mast
            geo = new THREE.CylinderGeometry(0.2, 0.2, 10, 6);
            mesh = makeMesh(geo, 0xbbbbbb);
            mesh.position.set(trawlerPositions[i][0] + 2, 9, trawlerPositions[i][1]);
            addObj(mesh);
            // Bow
            geo = new THREE.ConeGeometry(2.5, 4, 6);
            mesh = makeMesh(geo, 0x225588);
            mesh.rotation.z = -1.5708;
            mesh.position.set(trawlerPositions[i][0] + 9, 2.5, trawlerPositions[i][1]);
            addObj(mesh);
        }

        // Yachts with masts
        var yachtPositions = [
            [x - 10, -160], [x + 20, -170], [x - 40, -175], [x + 40, -155]
        ];
        for (i = 0; i < yachtPositions.length; i++) {
            geo = new THREE.BoxGeometry(8, 2, 3);
            mesh = makeMesh(geo, 0xffffff);
            mesh.position.set(yachtPositions[i][0], 1.5, yachtPositions[i][1]);
            addObj(mesh);
            // Tall mast
            geo = new THREE.CylinderGeometry(0.15, 0.15, 14, 6);
            mesh = makeMesh(geo, 0xaaaaaa);
            mesh.position.set(yachtPositions[i][0], 9, yachtPositions[i][1]);
            addObj(mesh);
            // Boom
            geo = new THREE.CylinderGeometry(0.1, 0.1, 7, 6);
            mesh = makeMesh(geo, 0xaaaaaa);
            mesh.rotation.z = 1.5708;
            mesh.position.set(yachtPositions[i][0] + 1.5, 3.5, yachtPositions[i][1]);
            addObj(mesh);
        }

        // Condor Ferries terminal building
        geo = new THREE.BoxGeometry(40, 12, 20);
        mesh = makeMesh(geo, 0xddddee);
        mesh.position.set(x + 30, 6, -85);
        addObj(mesh);

        // Terminal roof
        geo = new THREE.BoxGeometry(42, 2, 22);
        mesh = makeMesh(geo, 0x4477aa);
        mesh.position.set(x + 30, 13, -85);
        addObj(mesh);

        // Ferry terminal sign band
        geo = new THREE.BoxGeometry(40, 3, 1);
        mesh = makeMesh(geo, 0xcc0000);
        mesh.position.set(x + 30, 9, -75.5);
        addObj(mesh);

        // Cross-channel ferry (Condor) — large vessel
        geo = new THREE.BoxGeometry(50, 7, 16);
        mesh = makeMesh(geo, 0xffffff);
        mesh.position.set(x - 100, 4, -190);
        addObj(mesh);

        // Ferry superstructure
        geo = new THREE.BoxGeometry(40, 8, 14);
        mesh = makeMesh(geo, 0xeeeeee);
        mesh.position.set(x - 100, 11.5, -190);
        addObj(mesh);

        // Ferry funnel
        geo = new THREE.CylinderGeometry(2, 2.5, 8, 10);
        mesh = makeMesh(geo, 0xcc0000);
        mesh.position.set(x - 95, 20, -190);
        addObj(mesh);

        // Ferry funnel top stripe
        geo = new THREE.CylinderGeometry(2.1, 2.1, 2, 10);
        mesh = makeMesh(geo, 0x000000);
        mesh.position.set(x - 95, 23, -190);
        addObj(mesh);

        // Ferry bow
        geo = new THREE.ConeGeometry(8, 12, 6);
        mesh = makeMesh(geo, 0xffffff);
        mesh.rotation.z = -1.5708;
        mesh.position.set(x - 71, 4, -190);
        addObj(mesh);

        // Ferry mast/radar
        geo = new THREE.CylinderGeometry(0.3, 0.3, 12, 6);
        mesh = makeMesh(geo, 0x888888);
        mesh.position.set(x - 105, 22, -190);
        addObj(mesh);

        // Harbour crane
        geo = new THREE.CylinderGeometry(1, 1.5, 20, 8);
        mesh = makeMesh(geo, 0xffcc00);
        mesh.position.set(x - 148, 10, -82);
        addObj(mesh);

        geo = new THREE.BoxGeometry(25, 1.5, 1.5);
        mesh = makeMesh(geo, 0xffcc00);
        mesh.position.set(x - 135, 21, -82);
        addObj(mesh);

        // Quayside bollards
        for (i = 0; i < 10; i++) {
            geo = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 6);
            mesh = makeMesh(geo, 0x333333);
            mesh.position.set(x - 140 + i * 20, 5, -80);
            addObj(mesh);
        }

        // Fish market shed
        geo = new THREE.BoxGeometry(30, 6, 12);
        mesh = makeMesh(geo, 0xbbaa88);
        mesh.position.set(x - 130, 3, -95);
        addObj(mesh);

        geo = new THREE.BoxGeometry(32, 1, 14);
        mesh = makeMesh(geo, 0x775544);
        mesh.position.set(x - 130, 6.5, -95);
        addObj(mesh);
    }

    function buildNotheFort() {
        var x = 13640 + 120;
        var i, geo, mesh;

        // Headland mound
        geo = new THREE.SphereGeometry(60, 12, 8);
        mesh = makeMesh(geo, 0x557744);
        mesh.scale.set(1, 0.3, 1);
        mesh.position.set(x, 9, -200);
        addObj(mesh);

        // Fort outer wall — semi-circular arrangement represented as arc of boxes
        var wallAngles = [-1.2, -0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9, 1.2];
        for (i = 0; i < wallAngles.length; i++) {
            var ang = wallAngles[i];
            var wallX = x + Math.sin(ang) * 45;
            var wallZ = -200 + Math.cos(ang) * 45;
            geo = new THREE.BoxGeometry(12, 10, 4);
            mesh = makeMesh(geo, 0x887766);
            mesh.rotation.y = ang;
            mesh.position.set(wallX, 14, wallZ);
            addObj(mesh);
        }

        // Fort ramparts / parapet
        for (i = 0; i < wallAngles.length; i++) {
            var a = wallAngles[i];
            var rx = x + Math.sin(a) * 45;
            var rz = -200 + Math.cos(a) * 45;
            geo = new THREE.BoxGeometry(12, 3, 2);
            mesh = makeMesh(geo, 0x998877);
            mesh.rotation.y = a;
            mesh.position.set(rx, 21, rz);
            addObj(mesh);
        }

        // Merlons (battlements)
        for (i = 0; i < wallAngles.length; i++) {
            var ba = wallAngles[i];
            var bx = x + Math.sin(ba) * 46;
            var bz = -200 + Math.cos(ba) * 46;
            geo = new THREE.BoxGeometry(3, 2, 1.5);
            mesh = makeMesh(geo, 0x998877);
            mesh.rotation.y = ba;
            mesh.position.set(bx - Math.sin(ba + 1.5708) * 4, 24, bz - Math.cos(ba + 1.5708) * 4);
            addObj(mesh);
            geo = new THREE.BoxGeometry(3, 2, 1.5);
            mesh = makeMesh(geo, 0x998877);
            mesh.rotation.y = ba;
            mesh.position.set(bx + Math.sin(ba + 1.5708) * 4, 24, bz + Math.cos(ba + 1.5708) * 4);
            addObj(mesh);
        }

        // Gun emplacements — circular pits with cannon
        var gunPositions = [
            [x - 20, -165], [x, -160], [x + 20, -165]
        ];
        for (i = 0; i < gunPositions.length; i++) {
            geo = new THREE.CylinderGeometry(4, 4, 2, 12);
            mesh = makeMesh(geo, 0x665544);
            mesh.position.set(gunPositions[i][0], 14, gunPositions[i][1]);
            addObj(mesh);
            // Cannon barrel
            geo = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
            mesh = makeMesh(geo, 0x222222);
            mesh.rotation.z = 1.5708;
            mesh.position.set(gunPositions[i][0] + 1.5, 16, gunPositions[i][1]);
            addObj(mesh);
            // Cannon wheel
            geo = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 10);
            mesh = makeMesh(geo, 0x553311);
            mesh.rotation.x = 1.5708;
            mesh.position.set(gunPositions[i][0] - 1, 14.5, gunPositions[i][1]);
            addObj(mesh);
        }

        // Tunnel entrance
        geo = new THREE.BoxGeometry(6, 5, 3);
        mesh = makeMesh(geo, 0x333333);
        mesh.position.set(x + 5, 13.5, -160);
        addObj(mesh);

        // Tunnel arch surround
        geo = new THREE.BoxGeometry(8, 7, 2);
        mesh = makeMesh(geo, 0x887766);
        mesh.position.set(x + 5, 14.5, -159);
        addObj(mesh);

        // Fort interior barracks building
        geo = new THREE.BoxGeometry(25, 6, 12);
        mesh = makeMesh(geo, 0x998877);
        mesh.position.set(x, 15, -200);
        addObj(mesh);

        geo = new THREE.BoxGeometry(27, 1, 14);
        mesh = makeMesh(geo, 0x554433);
        mesh.position.set(x, 18.5, -200);
        addObj(mesh);

        // Flag pole
        geo = new THREE.CylinderGeometry(0.2, 0.2, 15, 6);
        mesh = makeMesh(geo, 0xdddddd);
        mesh.position.set(x + 10, 27, -200);
        addObj(mesh);

        // Flag
        geo = new THREE.BoxGeometry(6, 3, 0.1);
        mesh = makeMesh(geo, 0xcc0000);
        mesh.position.set(x + 13.5, 33, -200);
        addObj(mesh);
    }

    function buildWeymouthBay() {
        var x = 13640;
        var i, geo, mesh;

        // Bay water expanse
        geo = new THREE.BoxGeometry(500, 0.3, 300);
        mesh = makeMesh(geo, 0x1a6b8a);
        mesh.position.set(x, 0, -350);
        addObj(mesh);

        // Main harbour breakwater
        geo = new THREE.BoxGeometry(8, 4, 180);
        mesh = makeMesh(geo, 0x888866);
        mesh.position.set(x + 200, 2, -280);
        addObj(mesh);

        // Breakwater head
        geo = new THREE.SphereGeometry(6, 8, 6);
        mesh = makeMesh(geo, 0x888866);
        mesh.scale.set(1.2, 0.5, 1.2);
        mesh.position.set(x + 200, 3, -190);
        addObj(mesh);

        // Breakwater light
        geo = new THREE.CylinderGeometry(0.8, 1, 5, 8);
        mesh = makeMesh(geo, 0xffffff);
        mesh.position.set(x + 200, 7, -190);
        addObj(mesh);

        // Olympic sailing marks (buoys)
        var buoyPositions = [
            [x - 100, -300], [x + 50, -400], [x + 150, -350],
            [x - 50, -450], [x + 80, -480]
        ];
        for (i = 0; i < buoyPositions.length; i++) {
            geo = new THREE.SphereGeometry(2, 8, 6);
            mesh = makeMesh(geo, (i % 2 === 0) ? 0xffcc00 : 0xff4400);
            mesh.position.set(buoyPositions[i][0], 2, buoyPositions[i][1]);
            addObj(mesh);
            // Buoy pole
            geo = new THREE.CylinderGeometry(0.2, 0.2, 4, 6);
            mesh = makeMesh(geo, 0xdddd00);
            mesh.position.set(buoyPositions[i][0], 4, buoyPositions[i][1]);
            addObj(mesh);
        }

        // Portland Bill in distance — distant headland silhouette
        geo = new THREE.BoxGeometry(120, 30, 20);
        mesh = makeMesh(geo, 0x445566);
        mesh.position.set(x - 180, 15, -600);
        addObj(mesh);

        // Portland Bill lighthouse
        geo = new THREE.CylinderGeometry(2, 3, 25, 10);
        mesh = makeMesh(geo, 0xffffff);
        mesh.position.set(x - 150, 43, -600);
        addObj(mesh);

        // Lighthouse red band
        geo = new THREE.CylinderGeometry(2.1, 2.1, 4, 10);
        mesh = makeMesh(geo, 0xcc0000);
        mesh.position.set(x - 150, 50, -600);
        addObj(mesh);

        // Lighthouse lantern room
        geo = new THREE.CylinderGeometry(3, 2.5, 4, 10);
        mesh = makeMesh(geo, 0x888888);
        mesh.position.set(x - 150, 56, -600);
        addObj(mesh);

        // Portland cliff mass
        geo = new THREE.BoxGeometry(200, 60, 40);
        mesh = makeMesh(geo, 0x556677);
        mesh.position.set(x - 200, 30, -600);
        addObj(mesh);

        // Sailing dinghies out in bay
        var sailPositions = [
            [x - 80, -300], [x + 30, -380], [x - 150, -420], [x + 100, -320]
        ];
        for (i = 0; i < sailPositions.length; i++) {
            geo = new THREE.BoxGeometry(5, 1.5, 2);
            mesh = makeMesh(geo, 0xffffff);
            mesh.position.set(sailPositions[i][0], 1, sailPositions[i][1]);
            addObj(mesh);
            // Mast
            geo = new THREE.CylinderGeometry(0.1, 0.1, 10, 6);
            mesh = makeMesh(geo, 0xaaaaaa);
            mesh.position.set(sailPositions[i][0], 6, sailPositions[i][1]);
            addObj(mesh);
            // Sail
            geo = new THREE.BoxGeometry(0.1, 8, 5);
            mesh = makeMesh(geo, (i % 3 === 0) ? 0xff6600 : (i % 3 === 1) ? 0x0066ff : 0x00cc44);
            mesh.position.set(sailPositions[i][0], 7, sailPositions[i][1] + 2.5);
            addObj(mesh);
        }
    }

    function buildJubileeClock() {
        var x = 13640 - 30;
        var z = 0;
        var geo, mesh, i;

        // Octagonal base plinth
        geo = new THREE.CylinderGeometry(3.5, 4, 3, 8);
        mesh = makeMesh(geo, 0xcc9900);
        mesh.position.set(x, 1.5, z);
        addObj(mesh);

        // Second plinth tier
        geo = new THREE.CylinderGeometry(2.8, 3.5, 2.5, 8);
        mesh = makeMesh(geo, 0xddaa00);
        mesh.position.set(x, 4.25, z);
        addObj(mesh);

        // Tower shaft — octagonal
        geo = new THREE.CylinderGeometry(2, 2.2, 10, 8);
        mesh = makeMesh(geo, 0xeecc00);
        mesh.position.set(x, 10.5, z);
        addObj(mesh);

        // Decorative colour bands on tower
        var bandColors = [0xcc0000, 0x0033cc, 0x00aa44, 0xcc6600, 0x990099];
        for (i = 0; i < bandColors.length; i++) {
            geo = new THREE.CylinderGeometry(2.25, 2.25, 1, 8);
            mesh = makeMesh(geo, bandColors[i]);
            mesh.position.set(x, 5.5 + i * 2, z);
            addObj(mesh);
        }

        // Clock housing — octagonal wider section
        geo = new THREE.CylinderGeometry(2.8, 2.5, 4, 8);
        mesh = makeMesh(geo, 0xffdd00);
        mesh.position.set(x, 17.5, z);
        addObj(mesh);

        // Clock face decorative rings — four sides
        var clockFaceOffsets = [
            [0, 2.9], [2.9, 0], [0, -2.9], [-2.9, 0]
        ];
        for (i = 0; i < clockFaceOffsets.length; i++) {
            geo = new THREE.CylinderGeometry(1.8, 1.8, 0.3, 10);
            mesh = makeMesh(geo, 0xffffff);
            mesh.rotation.x = 1.5708;
            mesh.position.set(x + clockFaceOffsets[i][0], 17.5, z + clockFaceOffsets[i][1]);
            addObj(mesh);
            // Clock numerals ring
            geo = new THREE.CylinderGeometry(2.0, 2.0, 0.2, 10);
            mesh = makeMesh(geo, 0x222222);
            mesh.rotation.x = 1.5708;
            mesh.position.set(x + clockFaceOffsets[i][0], 17.5, z + clockFaceOffsets[i][1]);
            addObj(mesh);
        }

        // Spire top section
        geo = new THREE.CylinderGeometry(1.2, 2.0, 4, 8);
        mesh = makeMesh(geo, 0xeecc00);
        mesh.position.set(x, 21.5, z);
        addObj(mesh);

        // Decorative finials around spire base
        for (i = 0; i < 8; i++) {
            var fa = (i / 8) * Math.PI * 2;
            geo = new THREE.SphereGeometry(0.4, 6, 6);
            mesh = makeMesh(geo, 0xcc9900);
            mesh.position.set(x + Math.cos(fa) * 2.5, 20, z + Math.sin(fa) * 2.5);
            addObj(mesh);
        }

        // Top spire point
        geo = new THREE.ConeGeometry(0.8, 4, 8);
        mesh = makeMesh(geo, 0xffdd00);
        mesh.position.set(x, 25.5, z);
        addObj(mesh);

        // Golden crown / orb on top
        geo = new THREE.SphereGeometry(0.6, 8, 6);
        mesh = makeMesh(geo, 0xffaa00);
        mesh.position.set(x, 28, z);
        addObj(mesh);

        // Victorian decorative bracket lamp posts nearby
        var lampPositions = [x - 5, x + 5];
        for (i = 0; i < lampPositions.length; i++) {
            geo = new THREE.CylinderGeometry(0.2, 0.3, 6, 6);
            mesh = makeMesh(geo, 0x333333);
            mesh.position.set(lampPositions[i], 3, z);
            addObj(mesh);
            geo = new THREE.SphereGeometry(0.5, 8, 6);
            mesh = makeMesh(geo, 0xffffcc);
            mesh.position.set(lampPositions[i], 6.5, z);
            addObj(mesh);
        }
    }

    function update(delta) {
        // No frame-by-frame animation required
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
