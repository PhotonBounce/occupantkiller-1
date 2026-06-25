window.HertfordCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12360;

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

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
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

    function buildGround() {
        // Base ground plane for Hertford area
        makebox(600, 1, 600, 0x6b8c42, X_OFFSET, -0.5, 0);
    }

    function buildHertfordCastle() {
        var cx = X_OFFSET + 0;
        var cz = -20;

        // Castle motte (earthen mound)
        makecylinder(12, 18, 6, 12, 0x8B7355, cx, 3, cz - 40);

        // Keep on top of motte
        makebox(8, 8, 8, 0x8B4513, cx, 10, cz - 40);

        // Norman gatehouse main structure (red brick with flint suggestion)
        makebox(10, 12, 8, 0xB22222, cx, 6, cz);

        // Gatehouse upper section (narrower)
        makebox(8, 4, 6, 0xA52A2A, cx, 14, cz);

        // Gatehouse battlements row
        makebox(9, 2, 1, 0x8B0000, cx, 17, cz - 2.5);
        makebox(9, 2, 1, 0x8B0000, cx, 17, cz + 2.5);
        makebox(1, 2, 5, 0x8B0000, cx - 4, 17, cz);
        makebox(1, 2, 5, 0x8B0000, cx + 4, 17, cz);

        // Gateway arch (dark interior)
        makebox(3, 6, 9, 0x2a1a0a, cx, 3, cz);

        // Round corner towers of castle grounds
        makecylinder(3, 3, 14, 10, 0xA0522D, cx - 20, 7, cz - 5);
        makecylinder(3, 3, 14, 10, 0xA0522D, cx + 20, 7, cz - 5);
        makecylinder(3, 3, 14, 10, 0xA0522D, cx - 20, 7, cz - 35);
        makecylinder(3, 3, 14, 10, 0xA0522D, cx + 20, 7, cz - 35);

        // Cone roofs on round towers
        makecone(3.5, 5, 10, 0x5a2d0c, cx - 20, 17, cz - 5);
        makecone(3.5, 5, 10, 0x5a2d0c, cx + 20, 17, cz - 5);
        makecone(3.5, 5, 10, 0x5a2d0c, cx - 20, 17, cz - 35);
        makecone(3.5, 5, 10, 0x5a2d0c, cx + 20, 17, cz - 35);

        // Castle curtain walls connecting towers
        makebox(40, 8, 1.5, 0x8B4513, cx, 4, cz - 5);
        makebox(40, 8, 1.5, 0x8B4513, cx, 4, cz - 35);
        makebox(1.5, 8, 30, 0x8B4513, cx - 20, 4, cz - 20);
        makebox(1.5, 8, 30, 0x8B4513, cx + 20, 4, cz - 20);

        // Council office building inside castle grounds (later addition)
        makebox(18, 6, 12, 0xD2B48C, cx, 3, cz - 20);
        makebox(18, 1, 12, 0x8B6914, cx, 6.5, cz - 20);

        // Flint texture suggestion (dark patches on gatehouse)
        makebox(1, 1, 1, 0x2F2F2F, cx - 3, 5, cz - 4);
        makebox(1, 1, 1, 0x2F2F2F, cx + 2, 8, cz - 4);
        makebox(1, 1, 1, 0x2F2F2F, cx - 1, 11, cz - 4);
        makebox(1, 1, 1, 0x2F2F2F, cx + 3, 4, cz - 4);
    }

    function buildRiverLea() {
        var rx = X_OFFSET + 30;
        var rz = 10;

        // Main River Lea channel (blue)
        makebox(200, 0.3, 8, 0x1E90FF, rx, 0.15, rz);

        // River Beane tributary
        makebox(8, 0.3, 80, 0x4169E1, rx - 40, 0.15, rz - 30);

        // River Mimram tributary
        makebox(8, 0.3, 60, 0x6495ED, rx + 50, 0.15, rz - 20);

        // Confluence pool (wider area where rivers meet)
        makebox(30, 0.3, 25, 0x1C86EE, rx, 0.15, rz + 5);

        // Historic mill building beside river
        makebox(12, 10, 16, 0xC8A87D, rx + 15, 5, rz - 10);
        // Mill roof
        makebox(13, 2, 17, 0x5C4033, rx + 15, 11, rz - 10);
        // Mill wheel suggestion
        makecylinder(4, 4, 1.5, 12, 0x4a3728, rx + 9, 3, rz - 10);

        // Stone bridge over River Lea
        makebox(16, 2, 5, 0x808080, rx - 5, 1, rz);
        // Bridge arch pillars
        makebox(2, 3, 5, 0x696969, rx - 10, 1.5, rz);
        makebox(2, 3, 5, 0x696969, rx, 1.5, rz);
        // Bridge parapet walls
        makebox(16, 1, 0.5, 0x808080, rx - 5, 2.5, rz - 2.5);
        makebox(16, 1, 0.5, 0x808080, rx - 5, 2.5, rz + 2.5);

        // Towpath along river
        makebox(200, 0.2, 3, 0xA0896C, rx, 0.1, rz + 7);
    }

    function buildHertfordTownCentre() {
        var tx = X_OFFSET - 30;
        var tz = 20;

        // Market place ground (cobbled suggestion)
        makebox(40, 0.2, 30, 0xB0A090, tx, 0.1, tz);

        // Market house / corn exchange building
        makebox(12, 6, 10, 0xDEB887, tx, 3, tz);
        makebox(14, 1, 12, 0xC8A87D, tx, 6.5, tz);
        // Columns suggestion
        makebox(1, 5, 1, 0xF5F5DC, tx - 5, 2.5, tz - 4);
        makebox(1, 5, 1, 0xF5F5DC, tx - 2, 2.5, tz - 4);
        makebox(1, 5, 1, 0xF5F5DC, tx + 2, 2.5, tz - 4);
        makebox(1, 5, 1, 0xF5F5DC, tx + 5, 2.5, tz - 4);

        // St Andrew's Church tower
        makebox(6, 20, 6, 0x808070, tx + 25, 10, tz - 5);
        // Church nave
        makebox(10, 8, 20, 0x909080, tx + 25, 4, tz + 8);
        // Church roof
        makebox(11, 3, 21, 0x5C5C50, tx + 25, 9.5, tz + 8);
        // Church tower battlements
        makebox(7, 2, 1, 0x707060, tx + 25, 21, tz - 8);
        makebox(7, 2, 1, 0x707060, tx + 25, 21, tz - 2);
        makebox(1, 2, 6, 0x707060, tx + 22, 21, tz - 5);
        makebox(1, 2, 6, 0x707060, tx + 28, 21, tz - 5);
        // Church spire
        makecone(3.5, 10, 8, 0x606050, tx + 25, 27, tz - 5);

        // Timber-framed independent shop buildings (jettied upper floors)
        // Shop row 1
        makebox(8, 7, 6, 0xF5DEB3, tx - 20, 3.5, tz - 10);
        makebox(8, 1, 6, 0x2F1A0A, tx - 20, 7.5, tz - 10);
        // Timber frame stripes
        makebox(0.3, 7, 6.2, 0x2F1A0A, tx - 16.5, 3.5, tz - 10);
        makebox(0.3, 7, 6.2, 0x2F1A0A, tx - 23.5, 3.5, tz - 10);
        makebox(8.2, 0.3, 6.2, 0x2F1A0A, tx - 20, 5, tz - 10);

        // Shop row 2
        makebox(8, 7, 6, 0xFFE4C4, tx - 10, 3.5, tz - 10);
        makebox(8, 1, 6, 0x2F1A0A, tx - 10, 7.5, tz - 10);
        makebox(0.3, 7, 6.2, 0x2F1A0A, tx - 6.5, 3.5, tz - 10);
        makebox(0.3, 7, 6.2, 0x2F1A0A, tx - 13.5, 3.5, tz - 10);

        // Shop row 3
        makebox(8, 7, 6, 0xF5DEB3, tx, 3.5, tz - 10);
        makebox(8, 1, 6, 0x2F1A0A, tx, 7.5, tz - 10);

        // Shop row 4
        makebox(8, 7, 6, 0xFFDEAD, tx + 10, 3.5, tz - 10);
        makebox(8, 1, 6, 0x2F1A0A, tx + 10, 7.5, tz - 10);
        makebox(0.3, 7, 6.2, 0x2F1A0A, tx + 13.5, 3.5, tz - 10);
        makebox(0.3, 7, 6.2, 0x2F1A0A, tx + 6.5, 3.5, tz - 10);

        // Town road
        makebox(80, 0.2, 6, 0x555555, tx, 0.1, tz - 10);
        makebox(6, 0.2, 60, 0x555555, tx + 25, 0.1, tz);
    }

    function buildWareMaltings() {
        var mx = X_OFFSET + 80;
        var mz = 0;

        // Canal towpath (River Lea navigation)
        makebox(120, 0.2, 4, 0xA0896C, mx, 0.1, mz + 8);

        // Canal water
        makebox(120, 0.3, 7, 0x4682B4, mx, 0.15, mz);

        // Malting building 1 — tall narrow Victorian
        makebox(10, 18, 30, 0xB04020, mx - 30, 9, mz - 15);
        makebox(10.5, 1, 30.5, 0x6B2010, mx - 30, 18.5, mz - 15);
        // Ventilation cowls (distinctive pyramidal cowls on roof)
        makecone(1.5, 3, 8, 0x303030, mx - 33, 21, mz - 10);
        makecone(1.5, 3, 8, 0x303030, mx - 30, 21, mz - 10);
        makecone(1.5, 3, 8, 0x303030, mx - 27, 21, mz - 10);
        makecone(1.5, 3, 8, 0x303030, mx - 33, 21, mz - 20);
        makecone(1.5, 3, 8, 0x303030, mx - 30, 21, mz - 20);
        makecone(1.5, 3, 8, 0x303030, mx - 27, 21, mz - 20);
        // Cowl shafts
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 33, 19, mz - 10);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 30, 19, mz - 10);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 27, 19, mz - 10);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 33, 19, mz - 20);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 30, 19, mz - 20);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 27, 19, mz - 20);

        // Malting building 2
        makebox(10, 18, 25, 0xB04020, mx - 10, 9, mz - 12);
        makebox(10.5, 1, 25.5, 0x6B2010, mx - 10, 18.5, mz - 12);
        makecone(1.5, 3, 8, 0x303030, mx - 13, 21, mz - 8);
        makecone(1.5, 3, 8, 0x303030, mx - 10, 21, mz - 8);
        makecone(1.5, 3, 8, 0x303030, mx - 7, 21, mz - 8);
        makecone(1.5, 3, 8, 0x303030, mx - 13, 21, mz - 16);
        makecone(1.5, 3, 8, 0x303030, mx - 10, 21, mz - 16);
        makecone(1.5, 3, 8, 0x303030, mx - 7, 21, mz - 16);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 13, 19, mz - 8);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 10, 19, mz - 8);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 7, 19, mz - 8);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 13, 19, mz - 16);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 10, 19, mz - 16);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx - 7, 19, mz - 16);

        // Malting building 3 — converted arts venue
        makebox(14, 16, 28, 0xC04828, mx + 20, 8, mz - 14);
        makebox(14.5, 1, 28.5, 0x6B2010, mx + 20, 16.5, mz - 14);
        makecone(1.5, 3, 8, 0x303030, mx + 17, 19, mz - 8);
        makecone(1.5, 3, 8, 0x303030, mx + 20, 19, mz - 8);
        makecone(1.5, 3, 8, 0x303030, mx + 23, 19, mz - 8);
        makecone(1.5, 3, 8, 0x303030, mx + 17, 19, mz - 18);
        makecone(1.5, 3, 8, 0x303030, mx + 20, 19, mz - 18);
        makecone(1.5, 3, 8, 0x303030, mx + 23, 19, mz - 18);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx + 17, 17.5, mz - 8);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx + 20, 17.5, mz - 8);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx + 23, 17.5, mz - 8);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx + 17, 17.5, mz - 18);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx + 20, 17.5, mz - 18);
        makecylinder(0.4, 0.4, 3, 6, 0x404040, mx + 23, 17.5, mz - 18);

        // Warehouse / storage building
        makebox(20, 10, 20, 0xA03818, mx + 50, 5, mz - 10);
        makebox(20.5, 1, 20.5, 0x6B2010, mx + 50, 10.5, mz - 10);

        // Canal lock suggestion
        makebox(8, 1, 10, 0x607050, mx + 35, 0, mz);
        makebox(0.5, 3, 10, 0x404030, mx + 31, 1.5, mz);
        makebox(0.5, 3, 10, 0x404030, mx + 39, 1.5, mz);
    }

    function buildBengeo() {
        var bx = X_OFFSET - 20;
        var bz = 60;

        // Bengeo hill residential area
        makebox(80, 0.3, 60, 0x7A9A50, bx, 0.15, bz);

        // Residential houses (varied)
        var houseColors = [0xDEB887, 0xD2B48C, 0xF5DEB3, 0xFFDEAD, 0xE8C99A];
        var i;
        for (i = 0; i < 5; i++) {
            makebox(6, 5, 5, houseColors[i], bx - 30 + (i * 12), 2.5, bz - 20);
            makebox(7, 1.5, 6, 0x8B4513, bx - 30 + (i * 12), 5.75, bz - 20);
        }
        for (i = 0; i < 4; i++) {
            makebox(6, 5, 5, houseColors[i % 5], bx - 24 + (i * 12), 2.5, bz - 8);
            makebox(7, 1.5, 6, 0x6B3410, bx - 24 + (i * 12), 5.75, bz - 8);
        }
        for (i = 0; i < 5; i++) {
            makebox(6, 5, 5, houseColors[(i + 2) % 5], bx - 30 + (i * 12), 2.5, bz + 5);
            makebox(7, 1.5, 6, 0x8B4513, bx - 30 + (i * 12), 5.75, bz + 5);
        }

        // St Leonard's Norman church — 12th century with round apse
        // Nave
        makebox(8, 7, 16, 0x9A9080, bx + 20, 3.5, bz + 15);
        // Round apse (characteristic Norman feature)
        makecylinder(4, 4, 7, 12, 0x9A9080, bx + 20, 3.5, bz + 24);
        // Apse roof (cone)
        makecone(4.5, 4, 12, 0x6A6055, bx + 20, 9, bz + 24);
        // Church nave roof (pitched)
        makebox(9, 3, 17, 0x7A7065, bx + 20, 8.5, bz + 15);
        // West tower (simple Norman)
        makebox(5, 12, 5, 0x888070, bx + 20, 6, bz + 6);
        // Tower battlements
        makebox(6, 2, 1, 0x787060, bx + 20, 13, bz + 3.5);
        makebox(6, 2, 1, 0x787060, bx + 20, 13, bz + 8.5);
        makebox(1, 2, 5, 0x787060, bx + 17, 13, bz + 6);
        makebox(1, 2, 5, 0x787060, bx + 23, 13, bz + 6);
        // Norman doorway (arched suggestion with box)
        makebox(2, 3, 0.5, 0x2A1A0A, bx + 20, 1.5, bz + 3.5);

        // Churchyard wall
        makebox(30, 1.5, 0.5, 0x808070, bx + 20, 0.75, bz + 2);
        makebox(30, 1.5, 0.5, 0x808070, bx + 20, 0.75, bz + 30);
        makebox(0.5, 1.5, 28, 0x808070, bx + 5, 0.75, bz + 16);
        makebox(0.5, 1.5, 28, 0x808070, bx + 35, 0.75, bz + 16);

        // Bengeo road
        makebox(80, 0.2, 5, 0x555555, bx, 0.1, bz - 30);
    }

    function build() {
        buildGround();
        buildHertfordCastle();
        buildRiverLea();
        buildHertfordTownCentre();
        buildWareMaltings();
        buildBengeo();
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
