window.TantallonCastle = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 20560;
    var BASE_Y = 0;
    var BASE_Z = 0;

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

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildHeadland();
        buildSea();
        buildCurtainWall();
        buildGatehouse();
        buildDouglasNWTower();
        buildEastSETower();
        buildInnerBuildingRuins();
        buildMerlons();
        buildOutworks();
        buildBassRock();
        buildNorthBerwick();
        buildSeabirds();
        buildWaves();
    }

    function buildHeadland() {
        // Main promontory basalt rock base — large dark volcanic slab
        makeBox(180, 8, 240, 0x5a4a3a, 40, -4, 0);

        // Raised central rock shelf under castle
        makeBox(130, 6, 160, 0x4a3a2a, 30, 3, 0);

        // Sheer cliff faces — north cliff face (basalt)
        makeBox(180, 30, 6, 0x3a2e22, 40, 7, -125);

        // South cliff face
        makeBox(180, 30, 6, 0x3a2e22, 40, 7, 125);

        // East cliff face (seaward end)
        makeBox(6, 30, 240, 0x3a2e22, 135, 7, 0);

        // Rocky outcrops on headland surface
        makeBox(18, 5, 12, 0x6a5a4a, 80, 7, 40);
        makeBox(14, 4, 10, 0x5a4a3a, 90, 7, -30);
        makeBox(22, 6, 14, 0x4e3e2e, 60, 6, 60);
        makeBox(10, 3, 8, 0x6a5a4a, 50, 6, -55);

        // Cliff ledge details — north side
        makeBox(60, 4, 10, 0x4a3a2a, 80, -6, -115);
        // Cliff ledge — south side
        makeBox(60, 4, 10, 0x4a3a2a, 80, -6, 115);
    }

    function buildSea() {
        // North Sea — north side (dark steel blue)
        makeBox(600, 2, 300, 0x005577, 40, -18, -280);

        // South side sea
        makeBox(600, 2, 300, 0x005577, 40, -18, 280);

        // East sea — beyond headland tip
        makeBox(300, 2, 600, 0x005577, 340, -18, 0);

        // West sea — landward side distant water hint
        makeBox(200, 2, 400, 0x004466, -220, -18, 0);

        // Deeper water darker patches
        makeBox(150, 1, 120, 0x003355, 200, -19, -200);
        makeBox(150, 1, 120, 0x003355, 200, -19, 200);
    }

    function buildCurtainWall() {
        // Main curtain wall — east-facing, massive red sandstone
        // Central section of curtain wall (between towers), west face
        // The curtain wall runs roughly north-south
        // Wall section — north half
        makeBox(3.5, 15, 60, 0xCD5C5C, -30, 7.5, -55);
        // Wall section — south half
        makeBox(3.5, 15, 60, 0xCD5C5C, -30, 7.5, 55);

        // Wall walk / parapet top on north section
        makeBox(3.5, 2, 60, 0xB84040, -30, 16, -55);
        // Parapet south section
        makeBox(3.5, 2, 60, 0xB84040, -30, 16, 55);

        // Inner wall face north section (slightly thicker appearance)
        makeBox(1.5, 14, 60, 0xC04848, -28.5, 7, -55);
        // Inner wall face south section
        makeBox(1.5, 14, 60, 0xC04848, -28.5, 7, 55);

        // Curtain wall returns — short sections joining to Douglas tower NW
        makeBox(20, 15, 3.5, 0xCD5C5C, -50, 7.5, -82);
        // Curtain wall return joining to East tower SE
        makeBox(20, 15, 3.5, 0xCD5C5C, -50, 7.5, 82);

        // Wall base batter / plinth
        makeBox(5, 3, 60, 0xA03030, -31, -0.5, -55);
        makeBox(5, 3, 60, 0xA03030, -31, -0.5, 55);
    }

    function buildMerlons() {
        // Crenellations on curtain wall — north section (alternating merlons)
        var merlon_color = 0xB83030;
        var merlon_z_start = -80;
        var i;
        for (i = 0; i < 8; i++) {
            makeBox(4, 3, 2.5, merlon_color, -30, 17.5, merlon_z_start + i * 8);
        }
        // South section merlons
        for (i = 0; i < 8; i++) {
            makeBox(4, 3, 2.5, merlon_color, -30, 17.5, 10 + i * 8);
        }

        // Merlons on gatehouse top
        for (i = 0; i < 6; i++) {
            makeBox(2.5, 3, 3, merlon_color, -22 + i * 5, 22.5, -16);
            makeBox(2.5, 3, 3, merlon_color, -22 + i * 5, 22.5, 16);
        }
        for (i = 0; i < 5; i++) {
            makeBox(3, 3, 2.5, merlon_color, -32, 22.5, -12 + i * 6);
            makeBox(3, 3, 2.5, merlon_color, 8, 22.5, -12 + i * 6);
        }

        // Douglas tower merlons (ring of merlons on top)
        for (i = 0; i < 10; i++) {
            var angle = (i / 10) * Math.PI * 2;
            var mr = 9.5;
            var mx = Math.cos(angle) * mr;
            var mz = Math.sin(angle) * mr;
            makeBox(2.5, 3, 2.5, merlon_color, -70 + mx, 24.5, -90 + mz);
        }

        // East tower merlons (ring)
        for (i = 0; i < 10; i++) {
            var angle2 = (i / 10) * Math.PI * 2;
            var mr2 = 8.5;
            var mx2 = Math.cos(angle2) * mr2;
            var mz2 = Math.sin(angle2) * mr2;
            makeBox(2.5, 3, 2.5, merlon_color, -70 + mx2, 22.5, 90 + mz2);
        }
    }

    function buildGatehouse() {
        // Mid Tower / Gatehouse — central in curtain wall, rectangular with flanking round towers
        // Main gatehouse block
        makeBox(40, 22, 32, 0xC85050, -12, 11, 0);

        // Gatehouse inner courtyard void suggestion — darker recessed face
        makeBox(38, 20, 2, 0x8B3030, -12, 10, -17);

        // Gate passage arch suggested by darker slab
        makeBox(6, 8, 4, 0x5a2a2a, -12, 4, -18);

        // Flanking turrets on gatehouse — north turret
        makeCylinder(4, 4.5, 22, 10, 0xBB4444, -12, 11, -17);
        // South turret
        makeCylinder(4, 4.5, 22, 10, 0xBB4444, -12, 11, 17);

        // Turret cap cones
        makeCone(4.5, 6, 10, 0x8B2020, -12, 25, -17);
        makeCone(4.5, 6, 10, 0x8B2020, -12, 25, 17);

        // Gatehouse wing walls connecting to curtain wall — north wing
        makeBox(3.5, 15, 4, 0xCD5C5C, -31, 7.5, -17);
        // South wing
        makeBox(3.5, 15, 4, 0xCD5C5C, -31, 7.5, 17);

        // Gatehouse upper storey windows — suggested dark slits
        makeBox(1, 3, 6, 0x4a1a1a, -32.5, 14, -5);
        makeBox(1, 3, 6, 0x4a1a1a, -32.5, 14, 5);
        makeBox(1, 3, 6, 0x4a1a1a, -32.5, 8, 0);
    }

    function buildDouglasNWTower() {
        // Douglas Tower — large round NW tower with thick walls
        // Main cylinder body
        makeCylinder(10, 11, 23, 14, 0xC04848, -70, 11.5, -90);

        // Inner wall void (slightly smaller, darker to suggest hollow)
        makeCylinder(7, 8, 22, 14, 0x8B2525, -70, 11.5, -90);

        // Tower base batter (wider base)
        makeCylinder(13, 13, 5, 14, 0xA03030, -70, -0.5, -90);

        // Tower cap / roof suggestion
        makeCylinder(10.5, 10.5, 2, 14, 0x903030, -70, 23.5, -90);

        // Wall walk parapet ring
        makeCylinder(11, 11, 1.5, 14, 0xB03838, -70, 23, -90);

        // Arrow slits — suggestion boxes
        makeBox(1, 3, 4, 0x4a1515, -70, 16, -80);
        makeBox(1, 3, 4, 0x4a1515, -70, 10, -80);
        makeBox(4, 3, 1, 0x4a1515, -60, 16, -90);
        makeBox(4, 3, 1, 0x4a1515, -60, 10, -90);

        // Connecting wall from Douglas tower toward gatehouse
        makeBox(42, 15, 3.5, 0xCD5C5C, -41, 7.5, -84);
    }

    function buildEastSETower() {
        // East Tower — large round SE tower
        makeCylinder(9, 10, 21, 14, 0xC04848, -70, 10.5, 90);

        // Inner void
        makeCylinder(6.5, 7.5, 20, 14, 0x8B2525, -70, 10.5, 90);

        // Tower base batter
        makeCylinder(12, 12, 4, 14, 0xA03030, -70, -0.5, 90);

        // Tower cap
        makeCylinder(9.5, 9.5, 2, 14, 0x903030, -70, 21.5, 90);
        makeCylinder(10, 10, 1.5, 14, 0xB03838, -70, 22, 90);

        // Arrow slits
        makeBox(1, 3, 4, 0x4a1515, -70, 15, 80);
        makeBox(1, 3, 4, 0x4a1515, -70, 9, 80);
        makeBox(4, 3, 1, 0x4a1515, -60, 15, 90);
        makeBox(4, 3, 1, 0x4a1515, -60, 9, 90);

        // Connecting wall from East tower toward gatehouse
        makeBox(42, 15, 3.5, 0xCD5C5C, -41, 7.5, 84);
    }

    function buildInnerBuildingRuins() {
        // Interior ruins within the castle enceinte — roofless walls
        // Hall range along inner north wall
        makeBox(45, 8, 3, 0xB84040, 0, 4, -25);
        makeBox(3, 8, 20, 0xB84040, 22, 4, -35);
        makeBox(3, 8, 20, 0xB84040, -22, 4, -35);

        // Well / cistern — dark cylinder in courtyard
        makeCylinder(2.5, 2.5, 3, 10, 0x5a3a3a, 0, 1.5, -5);
        makeCylinder(2.8, 2.8, 0.5, 10, 0x4a2a2a, 0, 3.2, -5);

        // Domestic range ruins — south side
        makeBox(40, 6, 3, 0xBB4545, 0, 3, 22);
        makeBox(3, 6, 18, 0xBB4545, 20, 3, 31);

        // Rubble piles
        makeBox(8, 2, 6, 0x9a5a4a, 10, 1, 5);
        makeBox(6, 1.5, 4, 0x8a4a3a, -8, 1, 10);
        makeBox(10, 2.5, 7, 0x9a5050, 5, 1.25, -10);

        // Courtyard ground surface — sandy soil
        makeBox(110, 1, 130, 0xc8a87a, 0, 0.5, 0);

        // Outer ward / barmkin to east of gatehouse
        makeBox(60, 3, 3, 0xCD5C5C, 30, 1.5, -45);
        makeBox(60, 3, 3, 0xCD5C5C, 30, 1.5, 45);
        makeBox(3, 3, 90, 0xCD5C5C, 60, 1.5, 0);

        // Stair tower ruin on inner NW
        makeCylinder(3.5, 4, 12, 10, 0xB83838, -20, 6, -30);
    }

    function buildOutworks() {
        // Earthwork ditches and ramparts — landward (west) approach
        // Outer rampart bank
        makeBox(5, 4, 200, 0x7a6a50, -80, 2, 0);

        // Middle ditch (sunken) — suggested by dark lower box
        makeBox(15, 2, 200, 0x4a3e2e, -95, -1, 0);

        // Inner rampart
        makeBox(6, 5, 200, 0x7a6a50, -110, 2.5, 0);

        // Second ditch
        makeBox(14, 2, 200, 0x3e3228, -124, -1, 0);

        // Outermost earthwork
        makeBox(8, 3, 200, 0x6a5a40, -138, 1.5, 0);

        // Causeway / approach road suggestion
        makeBox(6, 0.5, 80, 0x9a8a6a, -90, 0.2, 0);

        // Wooden bridge stump posts
        makeCylinder(0.4, 0.4, 5, 6, 0x5a3a1a, -88, 2.5, -4);
        makeCylinder(0.4, 0.4, 5, 6, 0x5a3a1a, -88, 2.5, 4);
        makeCylinder(0.4, 0.4, 5, 6, 0x5a3a1a, -96, 2.5, -4);
        makeCylinder(0.4, 0.4, 5, 6, 0x5a3a1a, -96, 2.5, 4);
    }

    function buildBassRock() {
        // Bass Rock — white gannet-covered volcanic plug offshore to NE
        // Main rock body — steep sided
        makeCylinder(18, 22, 30, 12, 0xEEEEEE, 200, 3, -180);

        // Guano-whitened upper section
        makeCylinder(16, 18, 15, 12, 0xFFFFFF, 200, 25, -180);

        // Summit cone
        makeCone(14, 18, 12, 0xFFFFFF, 200, 40, -180);

        // Rock base below waterline suggestion
        makeCylinder(24, 24, 10, 12, 0xCCCCCC, 200, -8, -180);

        // Rock cliff face detail — darker streaks
        makeBox(6, 20, 4, 0xCCCCCC, 217, 10, -180);
        makeBox(4, 15, 6, 0xDDDDDD, 200, 12, -163);
    }

    function buildNorthBerwick() {
        // North Berwick visible to the west across the Forth
        // Town buildings row along seafront
        var i;
        for (i = 0; i < 8; i++) {
            makeBox(8, 6 + i % 3 * 2, 7, 0xF5F0E8, -200 + i * 12, 3 + i % 3, -110 - i % 2 * 6);
        }

        // Harbour buildings — a few with red roofs
        for (i = 0; i < 4; i++) {
            makeBox(7, 5, 6, 0xF5F0E8, -190 + i * 10, 2.5, -95);
            makeCone(4.5, 3.5, 4, 0xCD5C5C, -190 + i * 10, 7.5, -95);
        }

        // Harbour walls — stone piers
        makeBox(3, 3, 40, 0xCCBBAA, -170, 1.5, -80);
        makeBox(3, 3, 40, 0xCCBBAA, -155, 1.5, -80);
        makeBox(30, 2, 3, 0xCCBBAA, -162, 2, -60);

        // Church tower / spire visible
        makeBox(7, 20, 7, 0xE8E0D0, -230, 10, -105);
        makeCone(4, 8, 4, 0xB0A090, -230, 24, -105);

        // Town hill behind — Berwick Law suggestion
        makeCone(25, 35, 10, 0x7a8a6a, -260, 17.5, -90);
    }

    function buildSeabirds() {
        // Gannet silhouettes — angled box bodies circling offshore
        // Gannets near Bass Rock
        makeBox(6, 0.5, 1.2, 0xFFFFFF, 170, 35, -160);
        makeBox(6, 0.5, 1.2, 0xFFFFFF, 185, 42, -170);
        makeBox(6, 0.5, 1.2, 0xFFFFFF, 210, 38, -190);
        makeBox(6, 0.5, 1.2, 0xFFFFFF, 225, 45, -175);
        makeBox(6, 0.5, 1.2, 0xFFFFFF, 200, 50, -155);

        // Wing boxes angled (using rotation is not allowed cleanly, so offset pairs)
        makeBox(3, 0.5, 0.8, 0xFFFFFF, 160, 32, -140);
        makeBox(3, 0.5, 0.8, 0xFFFFFF, 190, 28, -200);
        makeBox(3, 0.5, 0.8, 0xFFFFFF, 215, 36, -165);

        // Gannets over headland cliffs
        makeBox(5, 0.5, 1, 0xFFFFFF, 80, 25, -110);
        makeBox(5, 0.5, 1, 0xFFFFFF, 100, 30, -105);
        makeBox(5, 0.5, 1, 0xFFFFFF, 90, 22, 108);
        makeBox(5, 0.5, 1, 0xFFFFFF, 70, 28, 115);

        // Herring gulls near castle walls
        makeBox(3, 0.4, 0.8, 0xFFFFFF, -20, 20, -20);
        makeBox(3, 0.4, 0.8, 0xFFFFFF, 10, 18, 15);
        makeBox(3, 0.4, 0.8, 0xFFFFFF, 0, 22, -30);
    }

    function buildWaves() {
        // White foam strips — crashing waves on cliff bases and sea surface
        // North cliff base waves
        makeBox(160, 1, 4, 0xFFFFFF, 40, -14, -127);
        makeBox(80, 0.8, 3, 0xEEEEEE, 80, -13, -122);
        makeBox(50, 0.7, 2.5, 0xFFFFFF, 60, -12.5, -119);

        // South cliff base waves
        makeBox(160, 1, 4, 0xFFFFFF, 40, -14, 127);
        makeBox(80, 0.8, 3, 0xEEEEEE, 80, -13, 122);
        makeBox(50, 0.7, 2.5, 0xFFFFFF, 60, -12.5, 119);

        // East headland tip waves
        makeBox(4, 1, 200, 0xFFFFFF, 137, -14, 0);
        makeBox(3, 0.8, 100, 0xEEEEEE, 132, -13, -30);
        makeBox(3, 0.8, 100, 0xEEEEEE, 132, -13, 30);

        // Open sea wave lines
        makeBox(200, 0.5, 3, 0xFFFFFF, 100, -17, -160);
        makeBox(200, 0.5, 3, 0xFFFFFF, 100, -17.2, -140);
        makeBox(200, 0.5, 3, 0xFFFFFF, 100, -17, 160);
        makeBox(200, 0.5, 3, 0xFFFFFF, 100, -17.2, 140);

        // Spray puffs near Bass Rock
        makeBox(12, 2, 12, 0xEEEEEE, 175, -12, -200);
        makeBox(10, 1.5, 10, 0xFFFFFF, 225, -12, -160);
    }

    function update(delta) {
        // Wave animation could go here — currently static
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
