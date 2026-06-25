window.SheffieldSteel = (function() {
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

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeWireframe(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color, wireframe: false });
        var segs = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: color })
        );
        scene.add(segs);
        objects.push(segs);
        return segs;
    }

    function addBox(w, h, d, x, y, z, color) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = makeMesh(geo, color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function addCylinder(rt, rb, h, segs, x, y, z, color) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function addSphere(r, ws, hs, x, y, z, color) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function addCone(r, h, segs, x, y, z, color) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    // -------------------------------------------------------
    // KELHAM ISLAND — Victorian industrial museum
    // -------------------------------------------------------
    function buildKelhamIsland() {
        var ox = 15560;
        var oz = -200;

        // Engine house — large brick building
        addBox(30, 20, 20, ox, 10, oz, 0x8B4513);
        // Engine house roof
        addBox(32, 4, 22, ox, 22, oz, 0x5C3317);

        // River Don Engine — massive beam engine representation
        // Engine block base
        addBox(8, 12, 5, ox - 6, 16, oz - 2, 0x444444);
        // Beam (horizontal arm)
        addBox(16, 2, 2, ox - 2, 22, oz - 2, 0x333333);
        // Flywheel
        addCylinder(4, 4, 1, 16, ox + 5, 18, oz - 2, 0x555555);
        // Piston cylinder
        addCylinder(1.5, 1.5, 10, 8, ox - 10, 17, oz - 2, 0x666666);

        // Crucible steel furnaces — cone-topped structures
        var furnacePositions = [
            [ox + 15, oz - 5],
            [ox + 20, oz - 5],
            [ox + 25, oz - 5]
        ];
        for (var f = 0; f < furnacePositions.length; f++) {
            var fx = furnacePositions[f][0];
            var fz = furnacePositions[f][1];
            // Furnace body
            addCylinder(3, 4, 8, 8, fx, 4, fz, 0x8B2500);
            // Cone top
            addCone(3, 5, 8, fx, 10.5, fz, 0x7A2200);
        }

        // Water wheel
        addCylinder(6, 6, 2, 12, ox + 35, 6, oz + 5, 0x5C4033);
        // Water wheel axle
        addCylinder(1, 1, 6, 8, ox + 35, 6, oz + 5, 0x3B2A1F);

        // Chimney stacks
        addCylinder(1.5, 2, 30, 8, ox - 15, 15, oz - 8, 0x8B4513);
        addCylinder(1.5, 2, 25, 8, ox - 20, 12.5, oz + 5, 0x8B4513);
        addCylinder(1.2, 1.8, 28, 8, ox + 40, 14, oz - 3, 0x9B5523);

        // Workers' cottages row
        var cottageColors = [0xB8860B, 0xA07830, 0xB8860B, 0xA07830];
        for (var c = 0; c < 4; c++) {
            var cx = ox - 30 + c * 10;
            addBox(8, 7, 8, cx, 3.5, oz + 20, cottageColors[c % 2]);
            addCone(5, 4, 4, cx, 9, oz + 20, 0x5C3317);
        }

        // Forge building
        addBox(20, 10, 15, ox + 55, 5, oz - 5, 0x6B4226);
        addBox(22, 2, 17, ox + 55, 11, oz - 5, 0x4A2E18);
        addCylinder(1.2, 1.8, 20, 8, ox + 60, 10, oz - 10, 0x8B4513);

        // Museum entrance canopy
        addBox(12, 3, 3, ox, 2.5, oz + 11, 0x555555);
        addBox(14, 1, 4, ox, 4, oz + 11, 0x444444);
    }

    // -------------------------------------------------------
    // SHEFFIELD CATHEDRAL — Perpendicular Gothic
    // -------------------------------------------------------
    function buildSheffieldCathedral() {
        var ox = 15560;
        var oz = 200;

        // Main nave
        addBox(40, 18, 20, ox, 9, oz, 0xD2C8AA);
        // Nave clerestory
        addBox(36, 6, 16, ox, 21, oz, 0xC8BE9F);
        // Nave pitched roof
        addBox(38, 4, 18, ox, 26, oz, 0x8B7B6B);

        // Central square tower — Perpendicular Gothic
        addBox(14, 40, 14, ox, 20, oz - 12, 0xD2C8AA);
        // Tower parapet
        addBox(16, 4, 16, ox, 42, oz - 12, 0xC8BE9F);
        // Tower pinnacles at corners
        addCone(1, 6, 4, ox - 7, 48, oz - 19, 0xD2C8AA);
        addCone(1, 6, 4, ox + 7, 48, oz - 19, 0xD2C8AA);
        addCone(1, 6, 4, ox - 7, 48, oz - 5, 0xD2C8AA);
        addCone(1, 6, 4, ox + 7, 48, oz - 5, 0xD2C8AA);

        // Shrewsbury Chapel — side extension
        addBox(18, 14, 16, ox + 28, 7, oz - 5, 0xD2C8AA);
        addBox(20, 2, 18, ox + 28, 15, oz - 5, 0xC8BE9F);
        addCone(2, 5, 4, ox + 28, 19, oz - 5, 0x8B7B6B);

        // Modern extension
        addBox(25, 12, 18, ox - 30, 6, oz + 5, 0xC8C8C8);
        addBox(27, 2, 20, ox - 30, 13, oz + 5, 0xAAAAAA);

        // Chancel / apse
        addBox(16, 16, 12, ox, 8, oz - 26, 0xD2C8AA);
        addCylinder(8, 8, 2, 8, ox, 17, oz - 26, 0xC8BE9F);

        // Buttresses on nave
        for (var b = 0; b < 4; b++) {
            addBox(3, 18, 4, ox - 18 + b * 12, 9, oz + 11, 0xC8BE9F);
            addBox(3, 18, 4, ox - 18 + b * 12, 9, oz - 11, 0xC8BE9F);
        }

        // Peace Gardens in front
        // Ground plaza
        addBox(60, 0.5, 40, ox + 15, 0.25, oz + 35, 0xC8C8A0);
        // Fountain columns
        addCylinder(1, 1, 4, 8, ox + 5, 2, oz + 30, 0xAAAAAA);
        addCylinder(2, 2, 0.5, 12, ox + 5, 4.25, oz + 30, 0x88AACC);
        addCylinder(1, 1, 4, 8, ox + 15, 2, oz + 30, 0xAAAAAA);
        addCylinder(2, 2, 0.5, 12, ox + 15, 4.25, oz + 30, 0x88AACC);
        addCylinder(1, 1, 4, 8, ox + 25, 2, oz + 30, 0xAAAAAA);
        addCylinder(2, 2, 0.5, 12, ox + 25, 4.25, oz + 30, 0x88AACC);
        // Garden flower beds
        addBox(8, 0.8, 6, ox + 10, 0.4, oz + 45, 0x228B22);
        addBox(8, 0.8, 6, ox + 25, 0.4, oz + 45, 0x228B22);
        addBox(8, 0.8, 6, ox + 40, 0.4, oz + 45, 0x228B22);

        // Millennium Gallery (nearby)
        addBox(50, 10, 20, ox + 70, 5, oz + 10, 0xD0D0D0);
        addBox(52, 2, 22, ox + 70, 11, oz + 10, 0xB0B0B0);
        // Gallery glass roof
        addCylinder(11, 11, 2, 12, ox + 70, 12, oz + 10, 0x88AACC);
    }

    // -------------------------------------------------------
    // ABBEYDALE INDUSTRIAL HAMLET — 18th century scythe works
    // -------------------------------------------------------
    function buildAbbeydaleHamlet() {
        var ox = 15560;
        var oz = 500;

        // Main forge building
        addBox(25, 10, 18, ox, 5, oz, 0x8B6914);
        addBox(27, 3, 20, ox, 11.5, oz, 0x6B4F0F);

        // Dam (millpond) — flat water body
        addBox(40, 1, 25, ox - 35, 0.5, oz - 10, 0x336699);

        // Water wheel — large overshot wheel
        addCylinder(8, 8, 3, 16, ox - 18, 8, oz - 5, 0x5C4033);
        // Water wheel frame
        addBox(3, 18, 3, ox - 18, 9, oz - 5, 0x4A3020);

        // Cementation furnaces — bottle-shaped domed kilns
        // Furnace 1
        addCylinder(4, 5, 10, 10, ox + 20, 5, oz - 8, 0x8B6914);
        addSphere(4.5, 10, 8, ox + 20, 11, oz - 8, 0x7A5A10);
        addCylinder(1.5, 3, 6, 8, ox + 20, 16, oz - 8, 0x7A5A10);
        // Furnace 2
        addCylinder(4, 5, 10, 10, ox + 30, 5, oz - 8, 0x8B6914);
        addSphere(4.5, 10, 8, ox + 30, 11, oz - 8, 0x7A5A10);
        addCylinder(1.5, 3, 6, 8, ox + 30, 16, oz - 8, 0x7A5A10);

        // Grinding hull — low elongated building
        addBox(35, 7, 12, ox - 5, 3.5, oz + 20, 0x9B7B2A);
        addBox(37, 2, 14, ox - 5, 8, oz + 20, 0x7A5A1F);

        // Workers' cottages at hamlet
        for (var c = 0; c < 3; c++) {
            addBox(8, 7, 8, ox - 40 + c * 10, 3.5, oz + 15, 0xB8860B);
            addCone(5, 4, 4, ox - 40 + c * 10, 9, oz + 15, 0x5C3317);
        }

        // Countinghouse / office
        addBox(12, 9, 10, ox + 45, 4.5, oz + 5, 0xA07830);
        addCone(7, 4, 4, ox + 45, 11, oz + 5, 0x5C3317);

        // Chimney stacks
        addCylinder(1.2, 1.8, 22, 8, ox + 5, 11, oz - 12, 0x8B6914);
        addCylinder(1.0, 1.5, 18, 8, ox + 25, 9, oz + 2, 0x8B6914);

        // River Porter brook — winding water strip
        addBox(80, 0.5, 5, ox - 20, 0.25, oz - 30, 0x336699);
    }

    // -------------------------------------------------------
    // KELHAM ISLAND DISTRICT — trendy regeneration
    // -------------------------------------------------------
    function buildKelhamDistrict() {
        var ox = 15560;
        var oz = -500;

        // Converted loft apartment blocks
        var loftData = [
            [ox - 20, oz, 18, 25, 15],
            [ox + 10, oz - 10, 22, 20, 18],
            [ox + 40, oz + 5, 16, 22, 12],
            [ox - 45, oz + 10, 20, 18, 14]
        ];
        for (var i = 0; i < loftData.length; i++) {
            var lx = loftData[i][0];
            var lz = loftData[i][1];
            var lh = loftData[i][2];
            var lw = loftData[i][3];
            var ld = loftData[i][4];
            addBox(lw, lh, ld, lx, lh / 2, lz, 0xB0908A);
            // Industrial window bands
            addBox(lw + 0.5, 2, ld + 0.5, lx, lh * 0.3, lz, 0x888880);
            addBox(lw + 0.5, 2, ld + 0.5, lx, lh * 0.65, lz, 0x888880);
        }

        // Craft brewery — industrial shed aesthetic
        addBox(30, 12, 20, ox + 70, 6, oz - 5, 0x777766);
        addBox(32, 3, 22, ox + 70, 13.5, oz - 5, 0x555544);
        // Brewing tanks
        addCylinder(3, 3, 8, 10, ox + 60, 4, oz - 5, 0xAAAAAA);
        addCylinder(3, 3, 8, 10, ox + 65, 4, oz - 5, 0xAAAAAA);
        addCylinder(3, 3, 8, 10, ox + 75, 4, oz - 5, 0xAAAAAA);
        // Brewery chimney
        addCylinder(1, 1.5, 18, 8, ox + 80, 9, oz - 10, 0x666655);

        // Street food market — open canopy structures
        addBox(40, 5, 30, ox - 60, 2.5, oz - 20, 0xCC9900);
        addBox(44, 1, 34, ox - 60, 5.5, oz - 20, 0xBB8800);
        // Market stall posts
        addCylinder(0.5, 0.5, 5, 6, ox - 75, 2.5, oz - 30, 0x888800);
        addCylinder(0.5, 0.5, 5, 6, ox - 45, 2.5, oz - 30, 0x888800);
        addCylinder(0.5, 0.5, 5, 6, ox - 75, 2.5, oz - 10, 0x888800);
        addCylinder(0.5, 0.5, 5, 6, ox - 45, 2.5, oz - 10, 0x888800);

        // Odeon Cinema — Art Deco style
        // Main facade
        addBox(35, 20, 15, ox + 100, 10, oz, 0xF5F0DC);
        // Art Deco stepped crown
        addBox(32, 4, 13, ox + 100, 22, oz, 0xE8E0C8);
        addBox(28, 4, 11, ox + 100, 26, oz, 0xDDD5BB);
        addBox(22, 4, 9, ox + 100, 30, oz, 0xD0C8A8);
        // Vertical fins (Art Deco feature)
        addBox(2, 22, 2, ox + 90, 11, oz - 8, 0xE8DCC8);
        addBox(2, 22, 2, ox + 95, 11, oz - 8, 0xE8DCC8);
        addBox(2, 22, 2, ox + 105, 11, oz - 8, 0xE8DCC8);
        addBox(2, 22, 2, ox + 110, 11, oz - 8, 0xE8DCC8);
        // Cinema entrance canopy
        addBox(30, 3, 8, ox + 100, 5, oz - 11, 0xDDD5BB);

        // Street-level retail / cafe units
        for (var s = 0; s < 5; s++) {
            addBox(8, 5, 6, ox - 100 + s * 10, 2.5, oz - 5, 0xBBAA88);
        }
    }

    // -------------------------------------------------------
    // DON VALLEY — river and industry
    // -------------------------------------------------------
    function buildDonValley() {
        var ox = 15560;
        var oz = -800;

        // River Don — winding water body
        addBox(200, 0.5, 12, ox, 0.25, oz, 0x336699);
        addBox(150, 0.5, 10, ox + 80, 0.25, oz + 30, 0x336699);
        addBox(120, 0.5, 8, ox - 70, 0.25, oz - 40, 0x336699);

        // Meadowhall shopping centre — large dome
        addBox(80, 15, 60, ox + 50, 7.5, oz - 60, 0xDDDDDD);
        // Main dome
        addSphere(35, 16, 12, ox + 50, 22, oz - 60, 0xCCCCCC);
        // Smaller entry domes
        addSphere(12, 12, 10, ox + 20, 13, oz - 40, 0xBBBBBB);
        addSphere(12, 12, 10, ox + 80, 13, oz - 40, 0xBBBBBB);
        addSphere(12, 12, 10, ox + 50, 13, oz - 80, 0xBBBBBB);
        // Meadowhall car parks
        addBox(40, 8, 25, ox + 100, 4, oz - 60, 0xAAAAAA);
        addBox(40, 8, 25, ox, 4, oz - 90, 0xAAAAAA);

        // Sheffield Arena (Utilita Arena)
        addBox(70, 20, 55, ox - 60, 10, oz - 50, 0xC8C8C8);
        // Arena roof — curved box approximation
        addBox(72, 8, 57, ox - 60, 22, oz - 50, 0xAAAAAA);
        addSphere(36, 14, 10, ox - 60, 28, oz - 50, 0xBBBBBB);

        // Football stadium approximation
        addBox(90, 15, 70, ox - 150, 7.5, oz - 30, 0x888888);
        addBox(92, 4, 72, ox - 150, 17, oz - 30, 0x777777);
        // Stadium roof sections
        addBox(88, 5, 10, ox - 150, 20, oz - 65, 0x666666);
        addBox(88, 5, 10, ox - 150, 20, oz + 5, 0x666666);
        addBox(10, 5, 68, ox - 190, 20, oz - 30, 0x666666);
        addBox(10, 5, 68, ox - 110, 20, oz - 30, 0x666666);

        // Industrial estates along Don
        for (var ie = 0; ie < 6; ie++) {
            addBox(20, 8, 15, ox + 120 + ie * 25, 4, oz + 20, 0x777766);
            addBox(22, 2, 17, ox + 120 + ie * 25, 9, oz + 20, 0x555544);
            addCylinder(1, 1.5, 15, 6, ox + 130 + ie * 25, 7.5, oz + 15, 0x888877);
        }

        // Road / rail viaduct
        addBox(200, 5, 8, ox, 12, oz + 60, 0x999999);
        // Viaduct piers
        for (var vp = 0; vp < 10; vp++) {
            addBox(4, 12, 4, ox - 90 + vp * 20, 6, oz + 60, 0x888888);
        }
    }

    // -------------------------------------------------------
    // SHEFFIELD PARKS — green city
    // -------------------------------------------------------
    function buildSheffieldParks() {
        var ox = 15560;
        var oz = 800;

        // Endcliffe Park — Porter Brook
        // Parkland ground
        addBox(80, 0.5, 60, ox - 30, 0.25, oz, 0x228B22);
        // Porter Brook
        addBox(5, 0.5, 60, ox - 30, 0.5, oz, 0x336699);
        // Waterfall / weir
        addBox(6, 3, 3, ox - 30, 1.5, oz - 10, 0x88AACC);
        // Trees — simple cone + cylinder combinations
        var treePositions = [
            [ox - 50, oz - 20],
            [ox - 40, oz + 10],
            [ox - 20, oz - 25],
            [ox, oz + 20],
            [ox + 10, oz - 10],
            [ox - 60, oz + 25],
            [ox + 25, oz + 30],
            [ox - 15, oz + 40]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tx = treePositions[t][0];
            var tz = treePositions[t][1];
            addCylinder(0.5, 0.5, 5, 6, tx, 2.5, tz, 0x5C3A1E);
            addCone(4, 8, 8, tx, 9, tz, 0x228B22);
        }
        // Park bandstand
        addCylinder(6, 6, 1, 10, ox + 20, 0.5, oz - 20, 0xC8C8A0);
        addCylinder(0.5, 0.5, 5, 6, ox + 20, 3, oz - 20, 0x888888);
        addCone(7, 4, 8, ox + 20, 7, oz - 20, 0x4A4A4A);

        // Botanical Gardens — Victorian glasshouse domes
        // Main glasshouse range
        addBox(50, 8, 15, ox + 80, 4, oz + 10, 0xDDEEDD);
        // Large central dome
        addSphere(10, 12, 10, ox + 80, 13, oz + 10, 0xCCEECC);
        // Flanking domes
        addSphere(7, 10, 8, ox + 63, 11, oz + 10, 0xCCEECC);
        addSphere(7, 10, 8, ox + 97, 11, oz + 10, 0xCCEECC);
        // Iron frame columns (simplified)
        for (var gc = 0; gc < 6; gc++) {
            addCylinder(0.4, 0.4, 8, 6, ox + 60 + gc * 8, 4, oz + 4, 0x888888);
            addCylinder(0.4, 0.4, 8, 6, ox + 60 + gc * 8, 4, oz + 16, 0x888888);
        }
        // Garden paths
        addBox(50, 0.3, 3, ox + 80, 0.15, oz + 25, 0xC8C8A0);
        addBox(3, 0.3, 30, ox + 80, 0.15, oz + 10, 0xC8C8A0);
        // Formal gardens
        addBox(15, 0.5, 10, ox + 60, 0.25, oz + 30, 0x32CD32);
        addBox(15, 0.5, 10, ox + 100, 0.25, oz + 30, 0x32CD32);

        // Rivelin Valley woodland
        var rvOz = oz + 100;
        addBox(100, 0.5, 50, ox - 50, 0.25, rvOz, 0x1A6B1A);
        // Rivelin river
        addBox(100, 0.3, 4, ox - 50, 0.3, rvOz + 5, 0x336699);
        // Valley woodland trees
        var rvTrees = [
            [ox - 80, rvOz - 15],
            [ox - 65, rvOz + 20],
            [ox - 50, rvOz - 10],
            [ox - 35, rvOz + 15],
            [ox - 20, rvOz - 5],
            [ox - 10, rvOz + 22],
            [ox - 90, rvOz + 8],
            [ox - 70, rvOz - 18],
            [ox - 55, rvOz + 10],
            [ox - 40, rvOz - 20]
        ];
        for (var rv = 0; rv < rvTrees.length; rv++) {
            var rvx = rvTrees[rv][0];
            var rvz = rvTrees[rv][1];
            addCylinder(0.4, 0.6, 7, 6, rvx, 3.5, rvz, 0x3B2010);
            addCone(5, 10, 8, rvx, 12, rvz, 0x1A5C1A);
        }
    }

    function build() {
        buildKelhamIsland();
        buildSheffieldCathedral();
        buildAbbeydaleHamlet();
        buildKelhamDistrict();
        buildDonValley();
        buildSheffieldParks();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
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
