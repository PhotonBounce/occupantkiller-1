window.DorchesterRoman = (function() {
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

    function addbox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var OX = 9800;
        var OZ = 0;

        // -------------------------------------------------------
        // 1. MAIDEN CASTLE — hilltop mound + 3 concentric wall rings
        // -------------------------------------------------------
        var MCX = OX + 0;
        var MCZ = OZ - 120;

        // Hilltop mound
        addcone(25, 8, 12, 0x6A7030, MCX, 4, MCZ);

        // 3 concentric oval wall rings, 8 box sections each
        var rings = [
            { rx: 38, rz: 22, h: 3.5 },
            { rx: 50, rz: 32, h: 3.0 },
            { rx: 62, rz: 42, h: 2.5 }
        ];
        for (var ri = 0; ri < rings.length; ri++) {
            var rdat = rings[ri];
            for (var si = 0; si < 8; si++) {
                var ang = (si / 8) * Math.PI * 2;
                var wx = MCX + rdat.rx * Math.cos(ang);
                var wz = MCZ + rdat.rz * Math.sin(ang);
                var seg = addbox(12, rdat.h, 2.5, 0x6A5A30, wx, rdat.h / 2, wz);
                seg.rotation.y = ang;
            }
        }

        // -------------------------------------------------------
        // 2. ROMAN TOWN WALLS — 3 sections + 2 interval towers
        // -------------------------------------------------------
        var TWX = OX + 60;
        var TWZ = OZ + 0;

        // Wall sections
        addbox(15, 5, 0.8, 0x888866, TWX,       2.5, TWZ);
        addbox(15, 5, 0.8, 0x888866, TWX + 18,  2.5, TWZ);
        addbox(15, 5, 0.8, 0x888866, TWX + 36,  2.5, TWZ);

        // Roman tile courses on top of walls
        for (var tc = 0; tc < 3; tc++) {
            addbox(15, 0.2, 0.3, 0xAA4422, TWX + tc * 18, 5.1, TWZ);
            addbox(15, 0.2, 0.3, 0xAA4422, TWX + tc * 18, 5.4, TWZ);
            addbox(15, 0.2, 0.3, 0xAA4422, TWX + tc * 18, 5.7, TWZ);
        }

        // Interval towers
        addbox(4, 7, 4, 0x888866, TWX + 9,  3.5, TWZ - 1);
        addbox(4, 7, 4, 0x888866, TWX + 27, 3.5, TWZ - 1);

        // -------------------------------------------------------
        // 3. ROMAN MOSAIC MUSEUM — Dorset County Museum
        // -------------------------------------------------------
        var MUX = OX + 40;
        var MUZ = OZ + 50;

        addbox(14, 8, 10, 0xBBAA88, MUX, 4, MUZ);

        // Victorian Gothic facade detail — thin vertical box fins
        addbox(0.5, 9, 0.5, 0xAA9977, MUX - 5, 4.5, MUZ - 5);
        addbox(0.5, 9, 0.5, 0xAA9977, MUX,     4.5, MUZ - 5);
        addbox(0.5, 9, 0.5, 0xAA9977, MUX + 5, 4.5, MUZ - 5);

        // Mosaic floor display — flat box
        addbox(6, 0.1, 4, 0xCCAA55, MUX, 0.05, MUZ);

        // Mosaic tesserae — grid of small boxes 3x4
        for (var mr = 0; mr < 3; mr++) {
            for (var mc2 = 0; mc2 < 4; mc2++) {
                var tcol = (mr + mc2) % 2 === 0 ? 0xCC2200 : 0x2244CC;
                addbox(0.4, 0.12, 0.4, tcol,
                    MUX - 2.5 + mr * 2.5,
                    0.11,
                    MUZ - 1.5 + mc2 * 1.0);
            }
        }

        // -------------------------------------------------------
        // 4. THOMAS HARDY COTTAGE
        // -------------------------------------------------------
        var HCX = OX - 60;
        var HCZ = OZ + 80;

        // Cottage body
        addbox(8, 4, 5, 0xCC8866, HCX, 2, HCZ);

        // Thatch roof
        addcone(5, 2, 8, 0x8B7355, HCX, 5, HCZ);

        // Garden wall
        addbox(5, 0.8, 0.4, 0xBB9977, HCX - 5, 0.4, HCZ + 3.5);
        addbox(5, 0.8, 0.4, 0xBB9977, HCX + 3, 0.4, HCZ + 3.5);

        // Chimney
        addbox(1, 3, 1, 0xCC8866, HCX + 3, 5.5, HCZ);

        // -------------------------------------------------------
        // 5. JUDGE JEFFREYS RESTAURANT
        // -------------------------------------------------------
        var JJX = OX + 20;
        var JJZ = OZ + 30;

        // 17th century town house
        addbox(10, 8, 6, 0x887755, JJX, 4, JJZ);

        // Dark history plaque by door
        addbox(0.5, 0.3, 0.1, 0x333322, JJX - 4.9, 2, JJZ - 3.1);

        // Upper overhang (jettied floor)
        addbox(10.6, 0.4, 6.6, 0x776644, JJX, 5.2, JJZ);

        // Window boxes
        addbox(1.5, 1.2, 0.2, 0x554433, JJX - 2, 4, JJZ - 3.1);
        addbox(1.5, 1.2, 0.2, 0x554433, JJX + 2, 4, JJZ - 3.1);

        // -------------------------------------------------------
        // 6. MAUMBURY RINGS — Roman amphitheatre
        // -------------------------------------------------------
        var MAX = OX - 30;
        var MAZ = OZ + 30;

        // Arena floor
        addbox(20, 0.3, 20, 0x6A7030, MAX, 0.15, MAZ);

        // 8 earthwork arc sections forming ring
        for (var ai = 0; ai < 8; ai++) {
            var aang = (ai / 8) * Math.PI * 2;
            var arx = MAX + 16 * Math.cos(aang);
            var arz = MAZ + 16 * Math.sin(aang);
            var aseg = addbox(11, 3.5, 4, 0x6A5A30, arx, 1.75, arz);
            aseg.rotation.y = aang;
        }

        // -------------------------------------------------------
        // 7. DORCHESTER TOWN — Georgian/Victorian buildings
        // -------------------------------------------------------
        var DTX = OX + 0;
        var DTZ = OZ + 0;

        var bcolors = [0xBBAA88, 0xCC9966, 0xBBAA88, 0xCC9966, 0xBBAA88,
                       0xCC9966, 0xBBAA88, 0xCC9966, 0xBBAA88, 0xCC9966];
        var bpositions = [
            [DTX - 30, DTZ + 15],
            [DTX - 18, DTZ + 15],
            [DTX - 6,  DTZ + 15],
            [DTX + 6,  DTZ + 15],
            [DTX + 18, DTZ + 15],
            [DTX - 30, DTZ - 15],
            [DTX - 18, DTZ - 15],
            [DTX - 6,  DTZ - 15],
            [DTX + 6,  DTZ - 15],
            [DTX + 18, DTZ - 15]
        ];
        for (var bi = 0; bi < 10; bi++) {
            addbox(5, 7, 5, bcolors[bi], bpositions[bi][0], 3.5, bpositions[bi][1]);
        }

        // Market place — flat paved area
        addbox(25, 0.2, 12, 0xCCBBAA, DTX - 6, 0.1, DTZ);

        // Corn Exchange — 18×10×8 with 6-column portico
        var CEX = OX + 80;
        var CEZ = OZ + 0;
        addbox(18, 8, 10, 0xDDCCAA, CEX, 4, CEZ);

        // Pediment
        addcone(10, 3, 4, 0xCCBB99, CEX, 9.5, CEZ - 3);

        // 6 columns
        for (var ci = 0; ci < 6; ci++) {
            addcylinder(0.3, 0.3, 6, 8, 0xEEDDBB, CEX - 7.5 + ci * 3, 3, CEZ - 5.5);
        }

        // -------------------------------------------------------
        // 8. ROMAN ROAD — straight tree-lined avenue
        // -------------------------------------------------------
        var RRX = OX - 90;
        var RRZ = OZ + 0;

        // Road surface
        addbox(3, 0.2, 50, 0x998866, RRX, 0.1, RRZ);

        // 6 lime trees either side
        for (var ti = 0; ti < 6; ti++) {
            var tz = RRZ - 20 + ti * 8;
            // Left side
            addcylinder(0.3, 0.3, 6, 6, 0x664422, RRX - 3, 3, tz);
            addsphere(4, 8, 6, 0x558822, RRX - 3, 7.5, tz);
            // Right side
            addcylinder(0.3, 0.3, 6, 6, 0x664422, RRX + 3, 3, tz);
            addsphere(4, 8, 6, 0x558822, RRX + 3, 7.5, tz);
        }

        // -------------------------------------------------------
        // 9. MAX GATE — Thomas Hardy's house
        // -------------------------------------------------------
        var MGX = OX - 80;
        var MGZ = OZ + 40;

        // Main brick mansion
        addbox(12, 10, 8, 0xCC8866, MGX, 5, MGZ);

        // Two gables
        addcone(4, 4, 4, 0xBB7755, MGX - 4, 11, MGZ - 2);
        addcone(4, 4, 4, 0xBB7755, MGX + 4, 11, MGZ - 2);

        // Iron gate posts
        addbox(0.4, 3, 0.4, 0x333333, MGX - 2,  1.5, MGZ + 5.5);
        addbox(0.4, 3, 0.4, 0x333333, MGX + 2,  1.5, MGZ + 5.5);

        // Gate bars (4 horizontal)
        addbox(4, 0.15, 0.1, 0x444444, MGX, 0.6,  MGZ + 5.5);
        addbox(4, 0.15, 0.1, 0x444444, MGX, 1.1,  MGZ + 5.5);
        addbox(4, 0.15, 0.1, 0x444444, MGX, 1.7,  MGZ + 5.5);
        addbox(4, 0.15, 0.1, 0x444444, MGX, 2.3,  MGZ + 5.5);

        // Boundary wall
        addbox(14, 1.2, 0.5, 0xBB9977, MGX, 0.6, MGZ + 6.5);

        // -------------------------------------------------------
        // 10. POUNDBURY — Prince Charles's neoclassical model town
        // -------------------------------------------------------
        var PBX = OX + 110;
        var PBZ = OZ + 40;

        var pbcolors = [0xEEDDBB, 0xDDCC99, 0xEEDDBB, 0xDDCC99];
        var pbpositions = [
            [PBX,       PBZ],
            [PBX + 20,  PBZ],
            [PBX,       PBZ + 20],
            [PBX + 20,  PBZ + 20]
        ];

        for (var pbi = 0; pbi < 4; pbi++) {
            var pbx2 = pbpositions[pbi][0];
            var pbz2 = pbpositions[pbi][1];

            // Neoclassical building
            addbox(8, 8, 6, pbcolors[pbi], pbx2, 4, pbz2);

            // Classical details — 2 columns per building
            addcylinder(0.3, 0.3, 4, 8, 0xFFEECC, pbx2 - 2, 2, pbz2 - 3.1);
            addcylinder(0.3, 0.3, 4, 8, 0xFFEECC, pbx2 + 2, 2, pbz2 - 3.1);

            // Cornice / entablature
            addbox(8.6, 0.4, 0.4, 0xFFEECC, pbx2, 4.2, pbz2 - 3.1);

            // Pediment
            addcone(5, 2, 4, pbcolors[pbi], pbx2, 9.0, pbz2 - 2);
        }
    }

    function update(delta) { }

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
