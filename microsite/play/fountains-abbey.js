window.FountainsAbbey = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var BASE_X = 20880;
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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function cyl(radTop, radBot, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(radTop, radBot, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function sph(r, wSegs, hSegs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, wSegs, hSegs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildHubysTower();
        buildAbbeyNave();
        buildLayBrothersRange();
        buildChapterHouse();
        buildCellarium();
        buildAbbeySacristy();
        buildRiverSkell();
        buildStudleyWaterGarden();
        buildTempleOfPiety();
        buildOctagonalTower();
        buildDeerPark();
        buildGrounds();
    }

    function buildHubysTower() {
        // Main tower body — Huby's Tower, ~50m tall Perpendicular Gothic
        // Base plinth
        box(14, 4, 14, 0xC8C0A8, 0, 2, 0);
        // Lower tower shaft
        box(12, 30, 12, 0xD4C9B0, 0, 19, 0);
        // Upper tower shaft
        box(11, 16, 11, 0xD0C5AC, 0, 42, 0);
        // Machicolation corbel band
        box(13, 2, 13, 0xBEB3A0, 0, 50, 0);
        // Parapet / battlement base
        box(13, 3, 13, 0xC8BCA8, 0, 53, 0);
        // Corner turret NW
        cyl(1.2, 1.4, 8, 8, 0xD4C9B0, -6, 54, -6);
        cone(1.3, 4, 8, 0x887766, -6, 59, -6);
        // Corner turret NE
        cyl(1.2, 1.4, 8, 8, 0xD4C9B0, 6, 54, -6);
        cone(1.3, 4, 8, 0x887766, 6, 59, -6);
        // Corner turret SW
        cyl(1.2, 1.4, 8, 8, 0xD4C9B0, -6, 54, 6);
        cone(1.3, 4, 8, 0x887766, -6, 59, 6);
        // Corner turret SE
        cyl(1.2, 1.4, 8, 8, 0xD4C9B0, 6, 54, 6);
        cone(1.3, 4, 8, 0x887766, 6, 59, 6);
        // Panelled window recesses — north face (decorative boxes inset)
        box(3, 8, 0.5, 0x998877, 0, 28, -6.1);
        box(3, 6, 0.5, 0x998877, 0, 40, -6.1);
        box(2, 4, 0.5, 0x998877, 0, 50, -6.1);
        // South face windows
        box(3, 8, 0.5, 0x998877, 0, 28, 6.1);
        box(3, 6, 0.5, 0x998877, 0, 40, 6.1);
        // Belfry openings (east/west)
        box(0.5, 5, 2.5, 0x887755, -6.1, 44, 0);
        box(0.5, 5, 2.5, 0x887755, 6.1, 44, 0);
    }

    function buildAbbeyNave() {
        // Roofless nave — 12 bays of Cistercian arcade
        // North and South nave walls, ruined (no roof)
        box(90, 14, 2, 0xC8BCA8, -20, 7, -10);
        box(90, 14, 2, 0xC8BCA8, -20, 7, 10);
        // Nave floor / ground level slab
        box(90, 0.5, 20, 0xB0A898, -20, 0.25, 0);
        // 12 bays — arcade pillars north row
        var i;
        for (i = 0; i < 12; i++) {
            cyl(1.0, 1.1, 12, 12, 0xBEB3A0, -60 + i * 8, 6, -7);
        }
        // 12 bays — arcade pillars south row
        for (i = 0; i < 12; i++) {
            cyl(1.0, 1.1, 12, 12, 0xBEB3A0, -60 + i * 8, 6, 7);
        }
        // Arcade arch spandrel blocks between pillars (north arcade)
        for (i = 0; i < 11; i++) {
            box(6, 3, 1.5, 0xC4B8A4, -56 + i * 8, 13, -7);
        }
        // Arcade arch spandrel blocks (south arcade)
        for (i = 0; i < 11; i++) {
            box(6, 3, 1.5, 0xC4B8A4, -56 + i * 8, 13, 7);
        }
        // West end wall (ruin stub)
        box(22, 10, 2, 0xC0B4A0, -65, 5, 0);
        // East end / presbytery wall stump
        box(22, 8, 2, 0xBCB0A0, 30, 4, 0);
        // Crossing tower base — where nave meets transepts
        box(12, 16, 12, 0xCCC0AC, 30, 8, 0);
    }

    function buildLayBrothersRange() {
        // Longest Cistercian range — 100m west of nave
        // Main range walls
        box(100, 12, 2, 0xC0B49C, -120, 6, -18);
        box(100, 12, 2, 0xC0B49C, -120, 6, -30);
        // End walls
        box(2, 12, 14, 0xBCAFA0, -170, 6, -24);
        box(2, 12, 14, 0xBCAFA0, -70, 6, -24);
        // Internal dividing walls (doorways / bays)
        for (i = 0; i < 9; i++) {
            box(1, 12, 12, 0xB8AC9C, -160 + i * 10, 6, -24);
        }
        var i;
        // Floor
        box(100, 0.5, 14, 0xAAA090, -120, 0.25, -24);
        // Undercroft vaulting pillars (ground floor)
        for (i = 0; i < 10; i++) {
            cyl(0.6, 0.7, 5, 8, 0xBEB3A0, -165 + i * 10, 2.5, -24);
        }
        // Upper floor stub walls (roofless)
        box(100, 4, 1, 0xC4B8A4, -120, 14, -18.5);
        box(100, 4, 1, 0xC4B8A4, -120, 14, -29.5);
    }

    function buildChapterHouse() {
        // East of nave, south transept area
        // Walls
        box(20, 10, 2, 0xCCC0AC, 50, 5, -6);
        box(20, 10, 2, 0xCCC0AC, 50, 5, 6);
        box(2, 10, 14, 0xC8BCA8, 40, 5, 0);
        box(2, 10, 14, 0xCCC0AC, 60, 5, 0);
        // Central vaulting column
        cyl(0.9, 1.0, 9, 8, 0xD0C5B0, 50, 4.5, 0);
        // Capital
        cyl(1.5, 0.9, 1, 8, 0xCCC0AC, 50, 9.5, 0);
        // Entrance arch frame
        box(6, 8, 1, 0xBFB4A0, 40, 4, 0);
        // Floor
        box(20, 0.4, 14, 0xB0A898, 50, 0.2, 0);
        // Ornate doorway columns
        cyl(0.3, 0.35, 7, 8, 0xD4C9B0, 40, 3.5, -2);
        cyl(0.3, 0.35, 7, 8, 0xD4C9B0, 40, 3.5, 2);
    }

    function buildCellarium() {
        // Undercroft / cellarium — spectacular vaulted undercroft under refectory
        // Outer walls
        box(50, 8, 2, 0xC4B8A4, -95, 4, 15);
        box(50, 8, 2, 0xC4B8A4, -95, 4, 27);
        box(2, 8, 14, 0xC4B8A4, -120, 4, 21);
        box(2, 8, 14, 0xC4B8A4, -70, 4, 21);
        // Vaulting columns — two rows
        var i;
        for (i = 0; i < 6; i++) {
            cyl(0.5, 0.6, 7, 8, 0xCCC0AC, -115 + i * 9, 3.5, 18);
            cyl(0.5, 0.6, 7, 8, 0xCCC0AC, -115 + i * 9, 3.5, 24);
        }
        // Floor
        box(50, 0.4, 14, 0xB0A898, -95, 0.2, 21);
        // Arch ribs (decorative box approximations)
        for (i = 0; i < 5; i++) {
            box(8, 1, 0.5, 0xBEB3A0, -111 + i * 9, 7.5, 21);
        }
    }

    function buildAbbeySacristy() {
        // Sacristy / transept north arm
        box(14, 14, 2, 0xC8BCA8, 30, 7, -22);
        box(14, 14, 2, 0xC8BCA8, 30, 7, -34);
        box(2, 14, 14, 0xC8BCA8, 23, 7, -28);
        box(2, 14, 14, 0xC8BCA8, 37, 7, -28);
        box(14, 0.4, 14, 0xB0A898, 30, 0.2, -28);
        // South transept
        box(14, 14, 2, 0xC8BCA8, 30, 7, 22);
        box(14, 14, 2, 0xC8BCA8, 30, 7, 34);
        box(2, 14, 14, 0xC8BCA8, 23, 7, 28);
        box(2, 14, 14, 0xC8BCA8, 37, 7, 28);
        box(14, 0.4, 14, 0xB0A898, 30, 0.2, 28);
    }

    function buildRiverSkell() {
        // River Skell flows east-west through the valley floor
        // Segmented river channel sections
        var i;
        for (i = 0; i < 20; i++) {
            box(20, 0.3, 6, 0x006994, -200 + i * 20, 0.15, 50);
        }
        // Widen near abbey
        for (i = 0; i < 8; i++) {
            box(20, 0.3, 10, 0x005A80, -80 + i * 20, 0.15, 50);
        }
        // Millpond / weir widening
        box(30, 0.4, 20, 0x007AA8, 20, 0.2, 55);
        // Riverbanks (low embankments)
        box(280, 1, 3, 0x5A6B3A, -60, 0.5, 44);
        box(280, 1, 3, 0x5A6B3A, -60, 0.5, 62);
    }

    function buildStudleyWaterGarden() {
        // Formal 18th century water garden — south and east of abbey
        // Main formal canal (rectangular)
        box(120, 0.4, 16, 0x006994, 200, 0.2, 100);
        // Canal wall edges
        box(120, 1, 1, 0xD4C9B0, 200, 0.7, 107);
        box(120, 1, 1, 0xD4C9B0, 200, 0.7, 93);
        box(1, 1, 16, 0xD4C9B0, 260, 0.7, 100);
        box(1, 1, 16, 0xD4C9B0, 140, 0.7, 100);
        // Moon Pond — circular water feature
        cyl(18, 18, 0.4, 24, 0x006994, 200, 0.2, 160);
        // Moon pond surround ring
        cyl(20, 20, 0.8, 24, 0xC8BCA8, 200, 0.4, 160);
        cyl(18, 18, 0.8, 24, 0x006994, 200, 0.4, 160);
        // Crescent ponds — east and west of moon pond (approximated with boxes)
        box(30, 0.4, 10, 0x005A80, 155, 0.2, 160);
        box(30, 0.4, 10, 0x005A80, 245, 0.2, 160);
        // Crescent pond surrounds
        box(32, 0.6, 1, 0xC8BCA8, 155, 0.3, 164);
        box(32, 0.6, 1, 0xC8BCA8, 155, 0.3, 156);
        box(32, 0.6, 1, 0xC8BCA8, 245, 0.3, 164);
        box(32, 0.6, 1, 0xC8BCA8, 245, 0.3, 156);
        // Formal grass terraces (parterre lawns)
        box(80, 0.3, 40, 0x4A7A3A, 200, 0.15, 210);
        box(80, 0.3, 40, 0x3D6B30, 200, 0.15, 260);
        // Terrace retaining walls
        box(82, 2, 1, 0xC4B8A4, 200, 1, 190);
        box(82, 2, 1, 0xC4B8A4, 200, 1, 230);
        // Cascade / water staircase
        box(4, 0.5, 20, 0x4488AA, 200, 0.25, 78);
        box(4, 0.5, 20, 0x3399BB, 200, 0.75, 70);
    }

    function buildTempleOfPiety() {
        // Classical Doric temple on water garden terrace
        // Stylobate (stepped base)
        box(18, 1, 12, 0xE0D8C8, 300, 0.5, 160);
        box(16, 1, 10, 0xDDD5C5, 300, 1.5, 160);
        // Temple cella (naos) walls
        box(10, 6, 8, 0xD4C9B0, 300, 5, 160);
        // Doric columns — front row
        cyl(0.6, 0.7, 6, 12, 0xE0D8C8, 290, 5, 156);
        cyl(0.6, 0.7, 6, 12, 0xE0D8C8, 290, 5, 158);
        cyl(0.6, 0.7, 6, 12, 0xE0D8C8, 290, 5, 160);
        cyl(0.6, 0.7, 6, 12, 0xE0D8C8, 290, 5, 162);
        cyl(0.6, 0.7, 6, 12, 0xE0D8C8, 290, 5, 164);
        // Rear columns
        cyl(0.6, 0.7, 6, 12, 0xE0D8C8, 310, 5, 156);
        cyl(0.6, 0.7, 6, 12, 0xE0D8C8, 310, 5, 164);
        // Entablature / frieze
        box(22, 1.5, 12, 0xD8D0C0, 300, 8.75, 160);
        // Pediment / triangular gable (approximated as thin wedge box)
        box(22, 3, 1, 0xD4C9B0, 300, 11, 155);
        cone(8, 4, 4, 0xD0C8B8, 300, 12, 160);
    }

    function buildOctagonalTower() {
        // Gothic folly octagonal tower overlooking abbey from hillside
        // Position on elevated ground north of water garden
        // Tower base plinth
        box(10, 2, 10, 0xC0B49C, 180, 22, -80);
        // Octagonal shaft (approximated with cylinder)
        cyl(4, 4.5, 20, 8, 0xC8B89A, 180, 33, -80);
        // Upper stage
        cyl(3.5, 4, 8, 8, 0xC4B49A, 180, 46, -80);
        // Parapet / battlements
        cyl(4.5, 4.5, 2, 8, 0xBFAF95, 180, 51, -80);
        // Corner finials (small cones)
        cone(0.5, 2, 6, 0xAA9980, 183.5, 53, -80);
        cone(0.5, 2, 6, 0xAA9980, 176.5, 53, -80);
        cone(0.5, 2, 6, 0xAA9980, 180, 53, -83.5);
        cone(0.5, 2, 6, 0xAA9980, 180, 53, -76.5);
        // Window openings (thin box slots)
        box(1.5, 4, 0.3, 0x887755, 180, 38, -84.1);
        box(0.3, 4, 1.5, 0x887755, 184.1, 38, -80);
        box(1.5, 4, 0.3, 0x887755, 180, 38, -75.9);
        box(0.3, 4, 1.5, 0x887755, 175.9, 38, -80);
        // Hillside elevation base
        box(20, 22, 20, 0x4A5A30, 180, 11, -80);
    }

    function buildDeerPark() {
        // Parkland with deer (box body + sphere head)
        var deerPositions = [
            [100, 0, -100],
            [130, 0, -120],
            [80, 0, -90],
            [150, 0, -80],
            [110, 0, -140],
            [90, 0, -60],
            [170, 0, -110],
            [60, 0, -130]
        ];
        var i;
        for (i = 0; i < deerPositions.length; i++) {
            var dx = deerPositions[i][0];
            var dy = deerPositions[i][1];
            var dz = deerPositions[i][2];
            // Body
            box(2.2, 1.2, 0.9, 0xA0805A, dx, dy + 1.5, dz);
            // Head
            sph(0.45, 8, 6, 0x986040, dx + 1.2, dy + 2.3, dz);
            // Legs (4 boxes)
            box(0.25, 1.2, 0.25, 0x8A6845, dx + 0.7, dy + 0.6, dz + 0.25);
            box(0.25, 1.2, 0.25, 0x8A6845, dx + 0.7, dy + 0.6, dz - 0.25);
            box(0.25, 1.2, 0.25, 0x8A6845, dx - 0.7, dy + 0.6, dz + 0.25);
            box(0.25, 1.2, 0.25, 0x8A6845, dx - 0.7, dy + 0.6, dz - 0.25);
        }
        // Parkland ground — green expanse
        box(300, 0.3, 200, 0x3D6B30, 100, 0.15, -100);
        // Ha-ha wall (sunken boundary wall)
        box(200, 1.5, 1, 0xB0A898, 50, 0.75, -10);
    }

    function buildGrounds() {
        // General grounds, paths, and landscaping features
        // Main approach path (gravel)
        box(80, 0.2, 4, 0xC8B89A, -40, 0.1, 0);
        // Valley floor grass
        box(400, 0.3, 120, 0x4A6A34, -80, 0.15, 25);
        // Hillside to north (terrain suggestion)
        box(300, 20, 60, 0x3D5A28, -80, 10, -70);
        // Boundary wall fragments
        box(40, 2, 1, 0xB0A080, -150, 1, -42);
        box(1, 2, 30, 0xB0A080, -130, 1, -57);
        // Ruined gatehouse remnant
        box(8, 10, 2, 0xC4B8A0, -185, 5, 5);
        box(8, 10, 2, 0xC4B8A0, -185, 5, -5);
        box(2, 10, 12, 0xC4B8A0, -189, 5, 0);
        // Warming house ruins
        box(16, 6, 12, 0xC0B4A0, -50, 3, 28);
        // Infirmary range (east)
        box(30, 8, 12, 0xBEB3A0, 80, 4, 28);
        box(0.5, 8, 12, 0xAA9F90, 65, 4, 28);
        box(0.5, 8, 12, 0xAA9F90, 95, 4, 28);
        // Mill building on river
        box(12, 8, 10, 0xC0B098, -200, 4, 50);
        // Visitor path along water garden
        box(200, 0.2, 3, 0xD0C0A8, 160, 0.1, 135);
        // Yew trees / topiary (dark cylinders)
        var i;
        for (i = 0; i < 8; i++) {
            cyl(1.5, 1.8, 5, 8, 0x1A3A1A, 170 + i * 14, 2.5, 190);
            cyl(1.5, 1.8, 5, 8, 0x1A3A1A, 170 + i * 14, 2.5, 132);
        }
        // Obelisk / sundial on terrace
        box(0.8, 8, 0.8, 0xDDD5C5, 200, 4, 195);
        cone(0.6, 2, 4, 0xD0C8B8, 200, 9, 195);
        // Bridge over canal
        box(6, 1.5, 18, 0xC8BCA8, 200, 1.75, 100);
        box(1, 3, 18, 0xC0B4A0, 197, 2, 100);
        box(1, 3, 18, 0xC0B4A0, 203, 2, 100);
        // Cascade pool base
        box(20, 0.3, 20, 0x006994, 200, 0.15, 55);
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
