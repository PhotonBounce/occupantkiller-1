window.StAlbansAbbey = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makelines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(geo, mat);
        return addMesh(ls);
    }

    function buildcathedral() {
        var ox = 12400;
        var oz = 0;
        var brick = 0xcc6633;
        var stone = 0xc8b89a;
        var darkstone = 0x9e8c7a;
        var roofgrey = 0x777766;

        // Main nave — longest in England, 50 units long, 12 wide, 14 high
        makebox(50, 14, 12, stone, ox + 0, 7, oz + 0);

        // Nave roof ridge
        makebox(50, 2, 1, roofgrey, ox + 0, 15, oz + 0);

        // Nave clerestory windows suggestion (dark strips)
        makebox(48, 2, 0.3, darkstone, ox + 0, 12, oz + 6.1);
        makebox(48, 2, 0.3, darkstone, ox + 0, 12, oz - 6.1);

        // Crossing tower (Roman brick) — at junction of nave and transepts
        makebox(12, 22, 12, brick, ox + 0, 11, oz + 0);
        // Tower top battlements
        makebox(12, 2, 12, darkstone, ox + 0, 23, oz + 0);
        // Corner turrets on crossing tower
        makecyl(1.2, 1.2, 6, 6, brick, ox + 5, 25, oz + 5);
        makecyl(1.2, 1.2, 6, 6, brick, ox - 5, 25, oz + 5);
        makecyl(1.2, 1.2, 6, 6, brick, ox + 5, 25, oz - 5);
        makecyl(1.2, 1.2, 6, 6, brick, ox - 5, 25, oz - 5);

        // North transept
        makebox(12, 16, 18, stone, ox + 0, 8, oz + 15);
        makebox(12, 1.5, 18, roofgrey, ox + 0, 16.75, oz + 15);

        // South transept
        makebox(12, 16, 18, stone, ox + 0, 8, oz - 15);
        makebox(12, 1.5, 18, roofgrey, ox + 0, 16.75, oz - 15);

        // Choir — east of crossing
        makebox(20, 13, 10, stone, ox + 16, 6.5, oz + 0);
        makebox(20, 1.5, 10, roofgrey, ox + 16, 13.25, oz + 0);

        // Retrochoir
        makebox(10, 11, 10, stone, ox + 29, 5.5, oz + 0);
        makebox(10, 1.5, 10, roofgrey, ox + 29, 11.25, oz + 0);

        // Lady Chapel — easternmost extension
        makebox(14, 9, 8, stone, ox + 40, 4.5, oz + 0);
        makebox(14, 1.5, 8, roofgrey, ox + 40, 9.25, oz + 0);
        // Lady Chapel east window arch suggestion
        makebox(6, 7, 0.5, darkstone, ox + 47.2, 4.5, oz + 0);

        // West front — twin towers
        makebox(4, 20, 5, stone, ox - 27, 10, oz + 8);
        makecone(3, 5, 4, roofgrey, ox - 27, 22.5, oz + 8);
        makebox(4, 20, 5, stone, ox - 27, 10, oz - 8);
        makecone(3, 5, 4, roofgrey, ox - 27, 22.5, oz - 8);
        // West front central portal
        makebox(10, 16, 2, stone, ox - 27, 8, oz + 0);
        makebox(6, 10, 0.5, darkstone, ox - 28.2, 5, oz + 0);

        // Flying buttresses — north side of nave
        makebox(0.8, 6, 5, stone, ox - 20, 9, oz + 9);
        makebox(0.8, 6, 5, stone, ox - 10, 9, oz + 9);
        makebox(0.8, 6, 5, stone, ox + 0, 9, oz + 9);
        makebox(0.8, 6, 5, stone, ox + 10, 9, oz + 9);

        // Flying buttresses — south side of nave
        makebox(0.8, 6, 5, stone, ox - 20, 9, oz - 9);
        makebox(0.8, 6, 5, stone, ox - 10, 9, oz - 9);
        makebox(0.8, 6, 5, stone, ox + 0, 9, oz - 9);
        makebox(0.8, 6, 5, stone, ox + 10, 9, oz - 9);

        // Buttress piers north
        makebox(1.5, 14, 1.5, stone, ox - 20, 7, oz + 7);
        makebox(1.5, 14, 1.5, stone, ox - 10, 7, oz + 7);
        makebox(1.5, 14, 1.5, stone, ox + 0, 7, oz + 7);
        makebox(1.5, 14, 1.5, stone, ox + 10, 7, oz + 7);

        // Buttress piers south
        makebox(1.5, 14, 1.5, stone, ox - 20, 7, oz - 7);
        makebox(1.5, 14, 1.5, stone, ox - 10, 7, oz - 7);
        makebox(1.5, 14, 1.5, stone, ox + 0, 7, oz - 7);
        makebox(1.5, 14, 1.5, stone, ox + 10, 7, oz - 7);

        // Cloisters — south side of nave
        makebox(30, 5, 2, stone, ox - 10, 2.5, oz - 17);
        makebox(2, 5, 12, stone, ox - 26, 2.5, oz - 12);
        makebox(2, 5, 12, stone, ox + 6, 2.5, oz - 12);
    }

    function buildverulamium() {
        var ox = 12400;
        var romanbrick = 0xcc6633;
        var romanwall = 0x9a7a5c;
        var grass = 0x557744;
        var water = 0x3366aa;

        // Verulamium Park ground plane suggestion
        makebox(120, 0.5, 80, grass, ox - 80, 0, 80);

        // Roman town walls outline — low foundation strips
        makebox(80, 1, 1.5, romanwall, ox - 80, 0.5, 50);
        makebox(80, 1, 1.5, romanwall, ox - 80, 0.5, 120);
        makebox(1.5, 1, 70, romanwall, ox - 120, 0.5, 85);
        makebox(1.5, 1, 70, romanwall, ox - 40, 0.5, 85);

        // Roman gateway towers
        makecyl(2, 2, 4, 6, romanbrick, ox - 120, 2, 50);
        makecyl(2, 2, 4, 6, romanbrick, ox - 40, 2, 50);
        makecyl(2, 2, 4, 6, romanbrick, ox - 120, 2, 120);
        makecyl(2, 2, 4, 6, romanbrick, ox - 40, 2, 120);

        // Verulamium Museum building — hypocaust display
        makebox(18, 5, 12, 0xc8c8b0, ox - 90, 2.5, 85);
        makebox(18, 0.5, 12, 0x888877, ox - 90, 5.25, 85);
        // Museum sign board
        makebox(10, 2, 0.3, 0x8b6914, ox - 90, 5.5, 79.2);

        // Hypocaust underfloor heating pillars visible through floor
        makecyl(0.3, 0.3, 1.5, 6, romanbrick, ox - 87, 0.75, 83);
        makecyl(0.3, 0.3, 1.5, 6, romanbrick, ox - 89, 0.75, 83);
        makecyl(0.3, 0.3, 1.5, 6, romanbrick, ox - 91, 0.75, 83);
        makecyl(0.3, 0.3, 1.5, 6, romanbrick, ox - 93, 0.75, 83);
        makecyl(0.3, 0.3, 1.5, 6, romanbrick, ox - 87, 0.75, 85);
        makecyl(0.3, 0.3, 1.5, 6, romanbrick, ox - 89, 0.75, 85);
        makecyl(0.3, 0.3, 1.5, 6, romanbrick, ox - 91, 0.75, 85);
        makecyl(0.3, 0.3, 1.5, 6, romanbrick, ox - 93, 0.75, 85);

        // Roman amphitheatre oval — earth banks
        makecyl(18, 14, 3, 16, 0x7a6040, ox - 65, 1.5, 100);
        // Inner arena floor
        makecyl(12, 10, 0.5, 16, 0xc4a85a, ox - 65, 0.25, 100);

        // Ver river — winding strip through park
        makebox(80, 0.2, 4, water, ox - 80, 0.1, 108);
        makebox(30, 0.2, 4, water, ox - 50, 0.1, 112);
        makebox(20, 0.2, 4, water, ox - 30, 0.1, 115);
    }

    function buildfightingcocks() {
        var ox = 12400;
        var timber = 0x5c3d1e;
        var plaster = 0xf0e8d0;
        var thatch = 0xc8a840;
        var water = 0x3366aa;

        // Fighting Cocks pub — octagonal timber-frame building on river bank
        // Base octagon using cylinder with 8 segments
        makecyl(7, 7, 4, 8, plaster, ox - 30, 2, 118);

        // Timber frame dark bands — decorative beams suggestion
        makecyl(7.1, 7.1, 0.4, 8, timber, ox - 30, 1, 118);
        makecyl(7.1, 7.1, 0.4, 8, timber, ox - 30, 2.5, 118);
        makecyl(7.1, 7.1, 0.4, 8, timber, ox - 30, 3.8, 118);

        // Thatched roof — cone suggestion
        makecone(8, 4, 8, thatch, ox - 30, 6, 118);
        // Roof ridge / finial
        makecyl(0.4, 0.4, 2, 6, timber, ox - 30, 8.5, 118);

        // Chimney
        makecyl(0.6, 0.6, 3, 6, 0x8b6450, ox - 27, 5.5, 115);

        // River bank platform
        makebox(16, 0.5, 16, 0x8b7040, ox - 30, 0, 118);

        // Approach bridge over Ver
        makebox(8, 0.4, 3, timber, ox - 26, 0.2, 115);

        // Pub sign post
        makecyl(0.2, 0.2, 5, 6, timber, ox - 23, 2.5, 116);
        makebox(3, 1.5, 0.2, 0x8b0000, ox - 23, 5.5, 116);
    }

    function buildhighstreet() {
        var ox = 12400;
        var stone = 0xc8b89a;
        var brick = 0x9a5c3a;
        var timber = 0x5c3d1e;
        var cobble = 0x888880;

        // Clock Tower — free-standing 15th century curfew tower, 14 high
        makebox(5, 14, 5, stone, ox - 50, 7, -30);
        // Clock face panel
        makebox(3, 3, 0.3, 0xf0e8d0, ox - 50, 11, -27.7);
        // Clock tower battlements
        makebox(5, 1.5, 5, stone, ox - 50, 14.75, -30);
        makecyl(0.8, 0.8, 2, 4, stone, ox - 52, 14.5, -32);
        makecyl(0.8, 0.8, 2, 4, stone, ox - 48, 14.5, -32);
        makecyl(0.8, 0.8, 2, 4, stone, ox - 52, 14.5, -28);
        makecyl(0.8, 0.8, 2, 4, stone, ox - 48, 14.5, -28);

        // High Street cobbled road
        makebox(60, 0.2, 8, cobble, ox - 50, 0.1, -20);

        // Market place open square
        makebox(25, 0.2, 20, 0xaa9977, ox - 50, 0.1, -42);

        // Medieval street buildings — north side
        makebox(8, 7, 6, brick, ox - 30, 3.5, -16);
        makebox(8, 0.5, 6, timber, ox - 30, 7.25, -16);
        makebox(8, 6, 6, plaster, ox - 40, 3, -16);
        makebox(8, 6, 6, brick, ox - 60, 3, -16);
        makebox(10, 8, 6, stone, ox - 72, 4, -16);

        // Medieval street buildings — south side
        makebox(8, 6, 6, 0xd4c0a0, ox - 35, 3, -24);
        makebox(8, 7, 6, brick, ox - 45, 3.5, -24);
        makebox(8, 6, 6, 0xc8b090, ox - 55, 3, -24);
        makebox(10, 7, 6, stone, ox - 67, 3.5, -24);

        // Market cross / monument
        makecyl(0.4, 0.6, 8, 6, stone, ox - 50, 4, -42);
        makecone(1, 2, 6, stone, ox - 50, 9, -42);

        // Market stalls suggestion
        makebox(5, 2, 3, 0xcc9944, ox - 44, 1, -42);
        makebox(5, 2, 3, 0x44aa66, ox - 56, 1, -42);
        makebox(5, 2, 3, 0xcc4444, ox - 50, 1, -48);

        // St Peter's Church at top of High Street
        makebox(14, 10, 9, stone, ox - 80, 5, -30);
        makecyl(3, 3, 16, 8, stone, ox - 87, 8, -30);
        makecone(2, 4, 8, 0x777766, ox - 87, 18, -30);
    }

    function buildgorhambury() {
        var ox = 12400;
        var stone = 0xc8b89a;
        var brick = 0xaa7755;
        var ruin = 0x9a8060;
        var grass = 0x557744;
        var cream = 0xf5f0e0;

        // Gorhambury parkland ground
        makebox(100, 0.3, 60, grass, ox - 160, 0.15, -80);

        // Elizabethan ruins — old Gorhambury House fragments
        makebox(2, 8, 14, ruin, ox - 180, 4, -70);
        makebox(2, 6, 10, ruin, ox - 180, 3, -85);
        makebox(12, 2, 2, ruin, ox - 174, 6, -70);
        makebox(10, 2, 2, ruin, ox - 174, 4, -85);
        // Ruined window arch
        makebox(6, 7, 0.5, ruin, ox - 170, 3.5, -77);
        // Collapsed wall section
        makebox(8, 3, 2, ruin, ox - 165, 1.5, -82);

        // New Gorhambury House — neo-Palladian mansion
        // Main central block
        makebox(30, 12, 18, cream, ox - 140, 6, -80);
        // Pediment / triangular gable
        makebox(30, 1, 18, 0xe8e0cc, ox - 140, 12.5, -80);
        makebox(20, 4, 0.5, cream, ox - 140, 14, -71.2);
        // Portico columns
        makecyl(0.8, 0.8, 10, 8, cream, ox - 133, 5, -71.5);
        makecyl(0.8, 0.8, 10, 8, cream, ox - 137, 5, -71.5);
        makecyl(0.8, 0.8, 10, 8, cream, ox - 141, 5, -71.5);
        makecyl(0.8, 0.8, 10, 8, cream, ox - 145, 5, -71.5);
        makecyl(0.8, 0.8, 10, 8, cream, ox - 149, 5, -71.5);
        // Portico entablature
        makebox(20, 1.5, 2, cream, ox - 141, 11, -71.5);

        // Flanking wings
        makebox(12, 9, 14, cream, ox - 161, 4.5, -80);
        makebox(12, 9, 14, cream, ox - 119, 4.5, -80);

        // Hipped roofs
        makebox(30, 2, 18, 0x7a7060, ox - 140, 13.5, -80);
        makebox(12, 1.5, 14, 0x7a7060, ox - 161, 10.25, -80);
        makebox(12, 1.5, 14, 0x7a7060, ox - 119, 10.25, -80);

        // Chimney stacks
        makecyl(0.8, 0.8, 4, 6, 0x887766, ox - 130, 16, -76);
        makecyl(0.8, 0.8, 4, 6, 0x887766, ox - 150, 16, -76);
        makecyl(0.8, 0.8, 4, 6, 0x887766, ox - 130, 16, -84);
        makecyl(0.8, 0.8, 4, 6, 0x887766, ox - 150, 16, -84);

        // Parkland trees suggestion — simple spheres on cylinders
        makecyl(0.5, 0.5, 6, 6, 0x4a3020, ox - 100, 3, -65);
        makesphere(4, 7, 6, 0x336622, ox - 100, 9, -65);
        makecyl(0.5, 0.5, 6, 6, 0x4a3020, ox - 200, 3, -65);
        makesphere(4, 7, 6, 0x336622, ox - 200, 9, -65);
        makecyl(0.5, 0.5, 6, 6, 0x4a3020, ox - 110, 3, -100);
        makesphere(4, 7, 6, 0x336622, ox - 110, 9, -100);
        makecyl(0.5, 0.5, 6, 6, 0x4a3020, ox - 170, 3, -100);
        makesphere(4, 7, 6, 0x336622, ox - 170, 9, -100);

        // Park driveway
        makebox(70, 0.2, 6, 0xb0a080, ox - 155, 0.1, -71);
    }

    function buildgroundplane() {
        var ox = 12400;
        // Local ground / terrain
        makebox(300, 0.5, 300, 0x668844, ox - 60, -0.25, 0);
    }

    function build() {
        buildgroundplane();
        buildcathedral();
        buildverulamium();
        buildfightingcocks();
        buildhighstreet();
        buildgorhambury();
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
