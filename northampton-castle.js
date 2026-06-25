window.NorthamptonCastle = (function() {
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var mesh = new THREE.LineSegments(geo, mat);
        return addMesh(mesh);
    }

    function build() {
        var ox = 21880;
        var oz = 0;

        // -----------------------------------------------------------------------
        // GROUND BASE SLAB
        // -----------------------------------------------------------------------
        makeBox(600, 1, 600, 0x7A8B5A, ox, -0.5, oz);

        // -----------------------------------------------------------------------
        // NORTHAMPTON CASTLE — Norman motte and bailey (mostly gone)
        // Located northwest of centre, motte earthwork mound
        // -----------------------------------------------------------------------
        // Motte earthwork mound
        makeCylinder(18, 28, 10, 12, 0x8B7355, ox - 120, 5, oz - 60);
        // Top of motte flattened cap
        makeCylinder(16, 18, 2, 12, 0x7A6845, ox - 120, 11, oz - 60);
        // Keep remnant stub on motte top
        makeBox(12, 8, 12, 0x8B7355, ox - 120, 16, oz - 60);
        // Bailey wall north
        makeBox(70, 6, 2, 0x8B7355, ox - 100, 3, oz - 90);
        // Bailey wall west
        makeBox(2, 6, 60, 0x8B7355, ox - 150, 3, oz - 60);
        // Bailey wall east
        makeBox(2, 6, 60, 0x8B7355, ox - 85, 3, oz - 60);
        // Bailey corner tower NW
        makeCylinder(4, 4, 8, 8, 0x7A6845, ox - 149, 4, oz - 89);
        // Bailey corner tower NE
        makeCylinder(4, 4, 8, 8, 0x7A6845, ox - 86, 4, oz - 89);

        // -----------------------------------------------------------------------
        // CASTLE GATE — the only surviving medieval structure (0x888888)
        // -----------------------------------------------------------------------
        // Left gatehouse tower
        makeBox(8, 16, 8, 0x888888, ox - 90, 8, oz - 30);
        // Right gatehouse tower
        makeBox(8, 16, 8, 0x888888, ox - 76, 8, oz - 30);
        // Gatehouse arch lintel block
        makeBox(14, 4, 4, 0x777777, ox - 83, 17, oz - 30);
        // Gatehouse rear wall
        makeBox(14, 12, 3, 0x888888, ox - 83, 6, oz - 26);
        // Battlements left tower
        makeBox(2, 3, 2, 0x888888, ox - 93, 17, oz - 30);
        makeBox(2, 3, 2, 0x888888, ox - 90, 17, oz - 30);
        makeBox(2, 3, 2, 0x888888, ox - 87, 17, oz - 30);
        // Battlements right tower
        makeBox(2, 3, 2, 0x888888, ox - 73, 17, oz - 30);
        makeBox(2, 3, 2, 0x888888, ox - 76, 17, oz - 30);
        makeBox(2, 3, 2, 0x888888, ox - 79, 17, oz - 30);

        // -----------------------------------------------------------------------
        // A45 DUAL CARRIAGEWAY — cuts through old castle site
        // -----------------------------------------------------------------------
        // Main road surface running E-W
        makeBox(300, 0.5, 14, 0x555555, ox - 90, 0.3, oz - 18);
        // Central reservation
        makeBox(300, 0.8, 2, 0x666655, ox - 90, 0.5, oz - 18);
        // Road markings — dashes (boxes)
        makeBox(8, 0.6, 0.5, 0xFFFFFF, ox - 160, 0.35, oz - 18);
        makeBox(8, 0.6, 0.5, 0xFFFFFF, ox - 130, 0.35, oz - 18);
        makeBox(8, 0.6, 0.5, 0xFFFFFF, ox - 100, 0.35, oz - 18);
        makeBox(8, 0.6, 0.5, 0xFFFFFF, ox - 70, 0.35, oz - 18);
        makeBox(8, 0.6, 0.5, 0xFFFFFF, ox - 40, 0.35, oz - 18);

        // -----------------------------------------------------------------------
        // MARKET SQUARE — one of England's largest historic market squares
        // -----------------------------------------------------------------------
        // Market square cobble surface
        makeBox(120, 0.4, 100, 0xDEB887, ox + 30, 0.25, oz + 40);
        // Victorian Market Hall — grand central building
        makeBox(40, 14, 28, 0xC8A870, ox + 30, 7, oz + 40);
        // Market Hall roof gable end
        makeCone(22, 8, 4, 0xA08050, ox + 30, 18, oz + 40);
        // Market Hall clock tower
        makeBox(8, 22, 8, 0xC8A870, ox + 30, 11, oz + 40);
        // Clock tower top
        makeCone(5, 6, 4, 0x884422, ox + 30, 23, oz + 40);
        // Market square surrounding shops/facades N
        makeBox(110, 10, 6, 0xC8B898, ox + 30, 5, oz - 10);
        // Market square shops S
        makeBox(110, 10, 6, 0xC8B898, ox + 30, 5, oz + 90);
        // Market square shops E
        makeBox(6, 10, 88, 0xC8B898, ox + 90, 5, oz + 40);
        // Market square shops W
        makeBox(6, 10, 88, 0xC8B898, ox - 30, 5, oz + 40);
        // Eleanor Cross monument
        makeCylinder(1, 1, 10, 6, 0xD4C8A0, ox + 60, 5, oz + 40);
        makeCone(1.5, 4, 6, 0xB8A880, ox + 60, 12, oz + 40);

        // -----------------------------------------------------------------------
        // CHURCH OF THE HOLY SEPULCHRE — Crusader round church
        // -----------------------------------------------------------------------
        // Round nave (cylinder)
        makeCylinder(14, 14, 12, 16, 0xD4C8A0, ox - 40, 6, oz + 80);
        // Round church conical roof
        makeCone(15, 8, 16, 0xB8A870, ox - 40, 14, oz + 80);
        // Round church chancel east
        makeBox(10, 10, 14, 0xD4C8A0, ox - 40, 5, oz + 98);
        // Chancel roof
        makeCone(6, 6, 4, 0xB8A870, ox - 40, 13, oz + 98);
        // West porch
        makeBox(8, 8, 6, 0xD4C8A0, ox - 40, 4, oz + 62);
        // Porch gable
        makeCone(5, 5, 4, 0xB8A870, ox - 40, 10, oz + 62);
        // Bell tower stub
        makeBox(5, 18, 5, 0xD4C8A0, ox - 52, 9, oz + 78);
        makeCone(3, 5, 4, 0xB8A870, ox - 52, 20, oz + 78);

        // -----------------------------------------------------------------------
        // ALL SAINTS CHURCH — Wren-influenced baroque with dome
        // -----------------------------------------------------------------------
        // Main church body
        makeBox(28, 14, 22, 0xD4C8A0, ox + 80, 7, oz + 80);
        // Baroque dome base drum
        makeCylinder(8, 8, 6, 16, 0xD4C8A0, ox + 80, 17, oz + 80);
        // Dome itself
        makeSphere(9, 16, 8, 0xC8BC90, ox + 80, 22, oz + 80);
        // Lantern on dome
        makeCylinder(2, 2, 5, 8, 0xD4C8A0, ox + 80, 29, oz + 80);
        makeCone(2, 3, 8, 0xB8A870, ox + 80, 33, oz + 80);
        // Portico columns front
        makeCylinder(1, 1, 12, 8, 0xE0D8B8, ox + 70, 6, oz + 68);
        makeCylinder(1, 1, 12, 8, 0xE0D8B8, ox + 74, 6, oz + 68);
        makeCylinder(1, 1, 12, 8, 0xE0D8B8, ox + 78, 6, oz + 68);
        makeCylinder(1, 1, 12, 8, 0xE0D8B8, ox + 82, 6, oz + 68);
        // Portico pediment
        makeBox(18, 3, 3, 0xD4C8A0, ox + 76, 13, oz + 68);
        makeCone(9, 5, 4, 0xD4C8A0, ox + 76, 16, oz + 68);

        // -----------------------------------------------------------------------
        // RIVER NENE — wide flood plain river
        // -----------------------------------------------------------------------
        // Main river channel
        makeBox(400, 0.3, 22, 0x4682B4, ox - 60, 0.2, oz + 160);
        // Flood plain water - wider shallow
        makeBox(400, 0.2, 40, 0x5090C4, ox - 60, 0.12, oz + 145);
        // River bank north
        makeBox(400, 1.5, 8, 0x6B8C5A, ox - 60, 0.7, oz + 140);
        // River bank south
        makeBox(400, 1.5, 8, 0x6B8C5A, ox - 60, 0.7, oz + 183);

        // -----------------------------------------------------------------------
        // BECKET'S PARK — riverside park
        // -----------------------------------------------------------------------
        // Park lawn
        makeBox(160, 0.3, 50, 0x4CAF50, ox - 60, 0.2, oz + 120);
        // Park path
        makeBox(120, 0.4, 3, 0xD4C8A0, ox - 60, 0.25, oz + 120);
        // Park trees — cylinders for trunks, spheres for canopy
        makeCylinder(0.8, 0.8, 5, 6, 0x5D3A1A, ox - 120, 2.5, oz + 110);
        makeSphere(4, 8, 6, 0x338833, ox - 120, 7, oz + 110);
        makeCylinder(0.8, 0.8, 5, 6, 0x5D3A1A, ox - 100, 2.5, oz + 125);
        makeSphere(4, 8, 6, 0x338833, ox - 100, 7, oz + 125);
        makeCylinder(0.8, 0.8, 5, 6, 0x5D3A1A, ox - 80, 2.5, oz + 115);
        makeSphere(4, 8, 6, 0x338833, ox - 80, 7, oz + 115);
        makeCylinder(0.8, 0.8, 5, 6, 0x5D3A1A, ox - 40, 2.5, oz + 128);
        makeSphere(4, 8, 6, 0x338833, ox - 40, 7, oz + 128);
        // Bandstand
        makeCylinder(8, 8, 3, 8, 0xC0A050, ox - 20, 1.5, oz + 118);
        makeCone(9, 4, 8, 0x884422, ox - 20, 5, oz + 118);

        // -----------------------------------------------------------------------
        // DERNGATE — Charles Rennie Mackintosh house
        // -----------------------------------------------------------------------
        // Main house body
        makeBox(10, 12, 8, 0xC8B89A, ox + 100, 6, oz - 40);
        // Distinctive Mackintosh geometric facade detail
        makeBox(10, 2, 1, 0x3A3028, ox + 100, 13, oz - 44);
        makeBox(2, 10, 1, 0x3A3028, ox + 96, 8, oz - 44);
        makeBox(2, 10, 1, 0x3A3028, ox + 104, 8, oz - 44);
        // Roof
        makeCone(7, 5, 4, 0x5A4830, ox + 100, 15, oz - 40);
        // Ground floor bay window
        makeBox(4, 5, 2, 0xA8C8D8, ox + 100, 3, oz - 45);
        // Neighbouring period terrace
        makeBox(30, 11, 8, 0xC8B89A, ox + 118, 5.5, oz - 40);
        makeCone(16, 4, 4, 0x5A4830, ox + 118, 13, oz - 40);

        // -----------------------------------------------------------------------
        // FRANKLIN'S GARDENS — Saints rugby ground
        // -----------------------------------------------------------------------
        // Pitch surface
        makeBox(100, 0.3, 70, 0x4CAF50, ox + 160, 0.2, oz + 20);
        // Pitch markings
        makeBox(100, 0.35, 0.8, 0xFFFFFF, ox + 160, 0.25, oz + 20);
        makeBox(100, 0.35, 0.8, 0xFFFFFF, ox + 160, 0.25, oz - 3);
        makeBox(100, 0.35, 0.8, 0xFFFFFF, ox + 160, 0.25, oz + 43);
        makeBox(0.8, 0.35, 70, 0xFFFFFF, ox + 110, 0.25, oz + 20);
        makeBox(0.8, 0.35, 70, 0xFFFFFF, ox + 210, 0.25, oz + 20);
        // Main stand — west side
        makeBox(100, 14, 20, 0x2244AA, ox + 160, 7, oz - 15);
        // Roof over west stand
        makeBox(104, 2, 12, 0xCCCCCC, ox + 160, 15, oz - 10);
        // East stand
        makeBox(100, 10, 16, 0x2244AA, ox + 160, 5, oz + 58);
        // North end terrace
        makeBox(20, 8, 70, 0x2244AA, ox + 107, 4, oz + 20);
        // South end terrace
        makeBox(20, 8, 70, 0x2244AA, ox + 213, 4, oz + 20);
        // Goal posts (cylinders + box crossbar)
        makeCylinder(0.3, 0.3, 16, 6, 0xFFCC00, ox + 115, 8, oz + 20);
        makeBox(7, 0.5, 0.5, 0xFFCC00, ox + 115, 16, oz + 20);
        makeCylinder(0.3, 0.3, 10, 6, 0xFFCC00, ox + 111.5, 21, oz + 20);
        makeCylinder(0.3, 0.3, 10, 6, 0xFFCC00, ox + 118.5, 21, oz + 20);
        makeCylinder(0.3, 0.3, 16, 6, 0xFFCC00, ox + 205, 8, oz + 20);
        makeBox(7, 0.5, 0.5, 0xFFCC00, ox + 205, 16, oz + 20);
        makeCylinder(0.3, 0.3, 10, 6, 0xFFCC00, ox + 201.5, 21, oz + 20);
        makeCylinder(0.3, 0.3, 10, 6, 0xFFCC00, ox + 208.5, 21, oz + 20);

        // -----------------------------------------------------------------------
        // BOOT AND SHOE INDUSTRY — Victorian factory buildings
        // -----------------------------------------------------------------------
        // Main factory block 1
        makeBox(40, 14, 20, 0xC87020, ox - 150, 7, oz + 40);
        // Sawtooth roof (north-light roof) for factory
        makeCone(20, 6, 4, 0x884411, ox - 150, 14, oz + 40);
        // Factory chimney stack
        makeCylinder(2, 3, 30, 8, 0xC87020, ox - 165, 15, oz + 40);
        makeCylinder(2.5, 2, 3, 8, 0x333333, ox - 165, 31, oz + 40);
        // Factory block 2
        makeBox(30, 12, 18, 0xC87020, ox - 150, 6, oz + 68);
        makeCone(16, 5, 4, 0x884411, ox - 150, 14, oz + 68);
        // Warehouse loading bay doors (dark boxes)
        makeBox(4, 5, 1, 0x332211, ox - 132, 2.5, oz + 51);
        makeBox(4, 5, 1, 0x332211, ox - 138, 2.5, oz + 51);
        // Small factory outbuilding
        makeBox(14, 8, 12, 0xC87020, ox - 180, 4, oz + 48);
        makeCone(8, 4, 4, 0x884411, ox - 180, 10, oz + 48);

        // -----------------------------------------------------------------------
        // ADDITIONAL NORTHAMPTON TOWN BUILDINGS
        // -----------------------------------------------------------------------
        // Guildhall / civic building
        makeBox(32, 18, 16, 0xD4C4A0, ox + 10, 9, oz - 50);
        makeCone(17, 6, 4, 0xA89870, ox + 10, 21, oz - 50);
        makeCylinder(2, 2, 22, 8, 0xD4C4A0, ox - 6, 11, oz - 50);
        makeCone(2.5, 4, 8, 0xA89870, ox - 6, 23, oz - 50);
        // Abington Street shops
        makeBox(80, 10, 10, 0xC8B898, ox + 50, 5, oz - 60);
        makeBox(80, 8, 10, 0xB8A888, ox + 50, 4, oz - 72);
        // St Giles Church tower
        makeCylinder(4, 4, 20, 8, 0xD4C8A0, ox - 60, 10, oz - 55);
        makeCone(5, 8, 8, 0xB8A870, ox - 60, 22, oz - 55);
        // Victorian terraced housing blocks
        makeBox(60, 9, 10, 0xC89878, ox + 140, 4.5, oz - 60);
        makeBox(60, 9, 10, 0xC89878, ox + 140, 4.5, oz - 74);
        // Modern retail box
        makeBox(50, 8, 30, 0x889988, ox + 0, 4, oz - 80);
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
