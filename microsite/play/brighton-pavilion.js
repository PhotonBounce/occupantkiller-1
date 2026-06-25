window.BrightonPavilion = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 10360;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildSea() {
        // Main sea plane — flat box
        var seaGeo = new THREE.BoxGeometry(600, 1, 300);
        makeMesh(seaGeo, 0x1a6699, X_OFFSET, -1, 200);

        // Wave rows — thin boxes
        var i;
        for (i = 0; i < 12; i++) {
            var waveGeo = new THREE.BoxGeometry(600, 0.4, 1.2);
            makeMesh(waveGeo, 0x2288bb, X_OFFSET, 0.5, 80 + i * 22);
        }
    }

    function buildPebbleBeach() {
        // Beach strip
        var beachGeo = new THREE.BoxGeometry(600, 0.8, 40);
        makeMesh(beachGeo, 0x9a9080, X_OFFSET, 0, 58);

        // Scatter pebble humps
        var i;
        for (i = 0; i < 30; i++) {
            var px = X_OFFSET - 280 + i * 20;
            var pz = 45 + (i % 4) * 6;
            var pebbleGeo = new THREE.SphereGeometry(0.6 + (i % 3) * 0.3, 4, 3);
            makeMesh(pebbleGeo, 0x888070, px, 1, pz);
        }
    }

    function buildRoyalPavilion() {
        var bx = X_OFFSET + 30;
        var bz = -40;

        // Main cream palace body — central block
        var bodyGeo = new THREE.BoxGeometry(40, 18, 30);
        makeMesh(bodyGeo, 0xfff8e7, bx, 9, bz);

        // Side wings
        var wingGeo = new THREE.BoxGeometry(14, 13, 28);
        makeMesh(wingGeo, 0xfff8e7, bx - 27, 6.5, bz);
        makeMesh(wingGeo, 0xfff8e7, bx + 27, 6.5, bz);

        // Grand central onion dome — large sphere on top
        var centralDomeGeo = new THREE.SphereGeometry(9, 16, 12);
        makeMesh(centralDomeGeo, 0xfff0cc, bx, 27, bz);

        // Dome drum / base cylinder
        var drumGeo = new THREE.CylinderGeometry(6, 7, 4, 16);
        makeMesh(drumGeo, 0xfff8e7, bx, 20, bz);

        // Finial atop central dome
        var finialGeo = new THREE.ConeGeometry(1.2, 4, 8);
        makeMesh(finialGeo, 0xddcc99, bx, 38, bz);

        // 4 smaller domed corner towers
        var towerPositions = [
            [bx - 16, bz - 10],
            [bx + 16, bz - 10],
            [bx - 16, bz + 10],
            [bx + 16, bz + 10]
        ];
        var t;
        for (t = 0; t < towerPositions.length; t++) {
            var tx = towerPositions[t][0];
            var tz = towerPositions[t][1];
            // Tower shaft
            var towerGeo = new THREE.CylinderGeometry(3.5, 3.5, 14, 12);
            makeMesh(towerGeo, 0xfff8e7, tx, 7, tz);
            // Small onion dome
            var smallDomeGeo = new THREE.SphereGeometry(4, 12, 10);
            makeMesh(smallDomeGeo, 0xfff0cc, tx, 18, tz);
            // Tower finial
            var tFinialGeo = new THREE.ConeGeometry(0.7, 3, 8);
            makeMesh(tFinialGeo, 0xddcc99, tx, 24, tz);
        }

        // Ornate minaret spires — 4 tall thin towers
        var minaretPositions = [
            [bx - 22, bz - 6],
            [bx + 22, bz - 6],
            [bx - 22, bz + 6],
            [bx + 22, bz + 6]
        ];
        var m;
        for (m = 0; m < minaretPositions.length; m++) {
            var mx = minaretPositions[m][0];
            var mz = minaretPositions[m][1];
            var minaretGeo = new THREE.CylinderGeometry(1, 1.4, 20, 8);
            makeMesh(minaretGeo, 0xfff8e7, mx, 10, mz);
            var mCapGeo = new THREE.SphereGeometry(1.5, 8, 6);
            makeMesh(mCapGeo, 0xfff0cc, mx, 21, mz);
            var mSpireGeo = new THREE.ConeGeometry(0.5, 5, 8);
            makeMesh(mSpireGeo, 0xddcc99, mx, 25.5, mz);
        }

        // Arched window decorations — shallow boxes protruding from facade
        var w;
        for (w = 0; w < 6; w++) {
            var wGeo = new THREE.BoxGeometry(3.5, 6, 0.8);
            makeMesh(wGeo, 0xeedfbb, bx - 17 + w * 7, 10, bz - 15.4);
        }

        // Grand entrance portico
        var porticoGeo = new THREE.BoxGeometry(14, 10, 5);
        makeMesh(porticoGeo, 0xfff8e7, bx, 5, bz - 17.5);
        // Portico roof dome
        var porticoDomeGeo = new THREE.SphereGeometry(5, 12, 8);
        makeMesh(porticoDomeGeo, 0xfff0cc, bx, 13, bz - 17.5);
        // Entrance columns
        var c;
        for (c = 0; c < 4; c++) {
            var colGeo = new THREE.CylinderGeometry(0.6, 0.7, 10, 8);
            makeMesh(colGeo, 0xfff8e7, bx - 5 + c * 3.5, 5, bz - 20);
        }

        // Palace perimeter wall
        var wallGeo1 = new THREE.BoxGeometry(80, 3, 1.5);
        makeMesh(wallGeo1, 0xf0e8d0, bx, 1.5, bz - 24);
        makeMesh(wallGeo1, 0xf0e8d0, bx, 1.5, bz + 20);
        var wallGeo2 = new THREE.BoxGeometry(1.5, 3, 45);
        makeMesh(wallGeo2, 0xf0e8d0, bx - 40, 1.5, bz - 2);
        makeMesh(wallGeo2, 0xf0e8d0, bx + 40, 1.5, bz - 2);

        // Lawn / garden floor
        var lawnGeo = new THREE.BoxGeometry(78, 0.4, 43);
        makeMesh(lawnGeo, 0x4a8040, bx, 0.2, bz - 2);
    }

    function buildBrightonPier() {
        var px = X_OFFSET - 80;
        var pz = 100;

        // Pier deck — long flat box
        var deckGeo = new THREE.BoxGeometry(12, 1.2, 280);
        makeMesh(deckGeo, 0xcc9944, px, 2, pz);

        // Pier posts — cylinders under the deck
        var post;
        for (post = 0; post < 20; post++) {
            var postLeft = new THREE.CylinderGeometry(0.4, 0.4, 5, 6);
            makeMesh(postLeft, 0x886622, px - 5.5, -0.5, -20 + post * 17);
            var postRight = new THREE.CylinderGeometry(0.4, 0.4, 5, 6);
            makeMesh(postRight, 0x886622, px + 5.5, -0.5, -20 + post * 17);
        }

        // Cross bracing — thin boxes
        var brace;
        for (brace = 0; brace < 10; brace++) {
            var braceGeo = new THREE.BoxGeometry(12, 0.3, 0.5);
            makeMesh(braceGeo, 0x775511, px, 1, 10 + brace * 28);
        }

        // Entrance pavilion building at pier start
        var entryGeo = new THREE.BoxGeometry(14, 8, 10);
        makeMesh(entryGeo, 0xffffff, px, 4, -8);
        var entryRoofGeo = new THREE.CylinderGeometry(8, 8, 2, 8);
        makeMesh(entryRoofGeo, 0xcc2222, px, 9, -8);
        var entryCupGeo = new THREE.SphereGeometry(3, 10, 8);
        makeMesh(entryCupGeo, 0xcc2222, px, 11.5, -8);

        // Mid-pier pavilion
        var midGeo = new THREE.BoxGeometry(18, 10, 14);
        makeMesh(midGeo, 0xfff8f0, px, 5, 140);
        var midRoofGeo = new THREE.CylinderGeometry(10, 11, 3, 10);
        makeMesh(midRoofGeo, 0x993311, px, 11.5, 140);

        // Fairground at the end — large rides
        // Big wheel — two ring segments made of cylinders
        var wheelHubGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
        makeMesh(wheelHubGeo, 0x444444, px, 14, 230);
        var spoke;
        for (spoke = 0; spoke < 8; spoke++) {
            var angle = (spoke / 8) * Math.PI * 2;
            var spokeGeo = new THREE.BoxGeometry(0.4, 14, 0.4);
            var spokeMesh = new THREE.Mesh(spokeGeo, new THREE.MeshLambertMaterial({ color: 0x888888 }));
            spokeMesh.position.set(px, 14, 230);
            spokeMesh.rotation.z = angle;
            scene.add(spokeMesh);
            objects.push(spokeMesh);
        }
        var wheelRimGeo = new THREE.CylinderGeometry(7, 7, 1, 24, 1, true);
        makeMesh(wheelRimGeo, 0xff4422, px, 14, 230);

        // Carousel — cylinder base with cone top
        var carouselBaseGeo = new THREE.CylinderGeometry(5, 5, 2, 16);
        makeMesh(carouselBaseGeo, 0xff8800, px + 16, 3, 220);
        var carouselTopGeo = new THREE.ConeGeometry(6, 4, 16);
        makeMesh(carouselTopGeo, 0xffcc00, px + 16, 7, 220);

        // Helter-skelter tower
        var helterGeo = new THREE.CylinderGeometry(2, 4, 22, 8);
        makeMesh(helterGeo, 0xff2255, px - 14, 11, 215);
        var helterTopGeo = new THREE.ConeGeometry(3, 5, 8);
        makeMesh(helterTopGeo, 0xffff00, px - 14, 24, 215);

        // End pavilion building
        var endBuildGeo = new THREE.BoxGeometry(22, 9, 18);
        makeMesh(endBuildGeo, 0xffffff, px, 4.5, 255);
        var endRoofGeo = new THREE.CylinderGeometry(12, 13, 3, 12);
        makeMesh(endRoofGeo, 0x1155aa, px, 10, 255);
    }

    function buildSeafrontHotels() {
        // Victorian terraced hotels along seafront
        var i;
        for (i = 0; i < 10; i++) {
            var hx = X_OFFSET - 230 + i * 48;
            var hz = -5;

            // Main hotel block
            var hotelGeo = new THREE.BoxGeometry(20, 24, 16);
            makeMesh(hotelGeo, 0xeeeedd - i * 0x050500, hx, 12, hz);

            // Roof parapet
            var parapetGeo = new THREE.BoxGeometry(21, 1.5, 17);
            makeMesh(parapetGeo, 0xddddcc, hx, 24.7, hz);

            // Bay window protrusions
            var bayGeo = new THREE.BoxGeometry(4, 18, 3);
            makeMesh(bayGeo, 0xf5f5e5, hx - 5, 9, hz - 9.5);
            makeMesh(bayGeo, 0xf5f5e5, hx + 5, 9, hz - 9.5);

            // Window rows — 3 floors
            var floor;
            for (floor = 0; floor < 3; floor++) {
                var col;
                for (col = 0; col < 3; col++) {
                    var winGeo = new THREE.BoxGeometry(2.5, 3.5, 0.4);
                    makeMesh(winGeo, 0x99ccee, hx - 6 + col * 6, 5 + floor * 7, hz - 8.2);
                }
            }

            // Ground floor shopfront
            var shopGeo = new THREE.BoxGeometry(18, 4, 0.5);
            makeMesh(shopGeo, 0x886644, hx, 2, hz - 8.25);
        }

        // Promenade walkway
        var promoGeo = new THREE.BoxGeometry(500, 0.5, 12);
        makeMesh(promoGeo, 0xbbbbaa, X_OFFSET, 0.25, 30);

        // Decorative lamp posts along promenade
        var lamp;
        for (lamp = 0; lamp < 18; lamp++) {
            var lampX = X_OFFSET - 210 + lamp * 25;
            var poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 6);
            makeMesh(poleGeo, 0x333344, lampX, 4, 25);
            var lampHeadGeo = new THREE.SphereGeometry(0.7, 8, 6);
            makeMesh(lampHeadGeo, 0xffffcc, lampX, 8.5, 25);
        }
    }

    function buildBandstand() {
        var bx = X_OFFSET + 120;
        var bz = 20;

        // Circular base platform
        var baseGeo = new THREE.CylinderGeometry(9, 9, 0.8, 16);
        makeMesh(baseGeo, 0xccccbb, bx, 0.4, bz);

        // Columns around perimeter
        var col;
        for (col = 0; col < 10; col++) {
            var angle = (col / 10) * Math.PI * 2;
            var cx = bx + Math.cos(angle) * 7;
            var cz = bz + Math.sin(angle) * 7;
            var colGeo = new THREE.CylinderGeometry(0.5, 0.5, 7, 8);
            makeMesh(colGeo, 0xffffff, cx, 3.8, cz);
        }

        // Canopy roof — CylinderGeometry
        var canopyGeo = new THREE.CylinderGeometry(0.5, 10, 4, 16);
        makeMesh(canopyGeo, 0x226644, bx, 10, bz);

        // Central stage area
        var stageGeo = new THREE.CylinderGeometry(5, 5, 0.6, 16);
        makeMesh(stageGeo, 0x998855, bx, 1.1, bz);
    }

    function buildTheLanes() {
        var lx = X_OFFSET + 60;
        var lz = -80;

        // Dense grid of terraced buildings — The Lanes shops
        var row;
        var col;
        for (row = 0; row < 5; row++) {
            for (col = 0; col < 8; col++) {
                var bWidth = 7 + (col % 2);
                var bHeight = 10 + (row % 3) * 3;
                var buildGeo = new THREE.BoxGeometry(bWidth, bHeight, 8);
                var colors = [0xddccbb, 0xccbbaa, 0xeeddcc, 0xbbccdd, 0xccddcc];
                var color = colors[(row * 8 + col) % colors.length];
                makeMesh(buildGeo, color, lx - 40 + col * 10, bHeight / 2, lz - row * 12);

                // Roof detail
                var roofGeo = new THREE.BoxGeometry(bWidth + 0.5, 1, 8.5);
                makeMesh(roofGeo, 0x886655, lx - 40 + col * 10, bHeight + 0.5, lz - row * 12);
            }
        }

        // Narrow lane passages — ground fill between blocks
        var lane;
        for (lane = 0; lane < 4; lane++) {
            var laneGeo = new THREE.BoxGeometry(3, 0.3, 60);
            makeMesh(laneGeo, 0x999988, lx - 35 + lane * 10, 0.15, lz - 24);
        }

        // Jewellery shop sign boards — small flat boxes on facades
        var shop;
        for (shop = 0; shop < 8; shop++) {
            var signGeo = new THREE.BoxGeometry(5, 1.5, 0.3);
            var signColors = [0xffdd00, 0xff8800, 0x88aaff, 0xff44aa];
            makeMesh(signGeo, signColors[shop % signColors.length], lx - 38 + shop * 10, 6, lz + 4.15);
        }
    }

    function buildGroundPlane() {
        // Main ground
        var groundGeo = new THREE.BoxGeometry(600, 0.5, 300);
        makeMesh(groundGeo, 0x667755, X_OFFSET, -0.25, -50);
    }

    function build() {
        buildGroundPlane();
        buildSea();
        buildPebbleBeach();
        buildRoyalPavilion();
        buildBrightonPier();
        buildSeafrontHotels();
        buildBandstand();
        buildTheLanes();
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
