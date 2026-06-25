window.ExeterCathedral = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 9200;
        var oz = 0;

        // 1. EXETER CATHEDRAL — main nave
        makebox(40, 14, 18, 0x998866, ox + 0, 7, oz + 0);

        // West front facade with carved detail
        makebox(20, 18, 1, 0xAA9977, ox - 20, 9, oz + 0);

        // West front window arches (3 tall narrow boxes)
        makebox(4, 10, 0.5, 0x335577, ox - 20, 12, oz - 6);
        makebox(4, 10, 0.5, 0x335577, ox - 20, 12, oz + 0);
        makebox(4, 10, 0.5, 0x335577, ox - 20, 12, oz + 6);

        // Twin Norman towers at transepts (not at ends)
        makebox(6, 22, 6, 0x887755, ox - 8, 11, oz - 12);
        makebox(6, 22, 6, 0x887755, ox - 8, 11, oz + 12);

        // Flying buttresses — 4 diagonal boxes angled from walls
        var butt1 = makebox(0.8, 0.8, 8, 0x776644, ox + 10, 11, oz - 10);
        butt1.rotation.x = 0.4;
        butt1.rotation.z = 0.3;

        var butt2 = makebox(0.8, 0.8, 8, 0x776644, ox + 10, 11, oz + 10);
        butt2.rotation.x = -0.4;
        butt2.rotation.z = 0.3;

        var butt3 = makebox(0.8, 0.8, 8, 0x776644, ox - 10, 11, oz - 10);
        butt3.rotation.x = 0.4;
        butt3.rotation.z = -0.3;

        var butt4 = makebox(0.8, 0.8, 8, 0x776644, ox - 10, 11, oz + 10);
        butt4.rotation.x = -0.4;
        butt4.rotation.z = -0.3;

        // 2. CATHEDRAL CLOSE — grassy precinct
        makebox(60, 0.5, 40, 0x44771A, ox + 0, 0, oz + 0);

        // 3. CHAPTER HOUSE — octagonal attached to south side
        // 8 sides of octagon approximated by boxes
        var chx = ox + 15;
        var chz = oz + 14;
        makebox(3, 6, 0.5, 0x997766, chx + 0, 3, chz + 3);
        makebox(0.5, 6, 3, 0x997766, chx + 3, 3, chz + 0);
        makebox(3, 6, 0.5, 0x997766, chx + 0, 3, chz - 3);
        makebox(0.5, 6, 3, 0x997766, chx - 3, 3, chz + 0);
        makebox(0.5, 6, 2.5, 0x997766, chx + 2.2, 3, chz + 2.2);
        makebox(0.5, 6, 2.5, 0x997766, chx + 2.2, 3, chz - 2.2);
        makebox(0.5, 6, 2.5, 0x997766, chx - 2.2, 3, chz + 2.2);
        makebox(0.5, 6, 2.5, 0x997766, chx - 2.2, 3, chz - 2.2);
        // Chapter house cone roof
        makecone(7, 6, 8, 0x886655, chx, 9, chz);

        // 4. ROMAN CITY WALL — 3 box sections
        makebox(15, 4, 0.8, 0x888866, ox - 40, 2, oz - 30);
        makebox(15, 4, 0.8, 0x888866, ox - 55, 2, oz - 15);
        makebox(0.8, 4, 15, 0x888866, ox - 62, 2, oz - 7);

        // Interval towers on wall
        makebox(4, 6, 3, 0x777755, ox - 33, 3, oz - 30);
        makebox(4, 6, 3, 0x777755, ox - 47, 3, oz - 30);

        // Gate arch gap box (lintel)
        makebox(5, 0.5, 4, 0x888866, ox - 55, 4, oz - 30);

        // 5. GUILDHALL — oldest municipal building
        makebox(14, 8, 10, 0xAA9977, ox - 25, 4, oz + 35);

        // Medieval colonnade — 6 cylinders supporting overhang
        makecylinder(0.5, 0.5, 4, 8, 0x998866, ox - 30, 2, oz + 31);
        makecylinder(0.5, 0.5, 4, 8, 0x998866, ox - 27, 2, oz + 31);
        makecylinder(0.5, 0.5, 4, 8, 0x998866, ox - 24, 2, oz + 31);
        makecylinder(0.5, 0.5, 4, 8, 0x998866, ox - 21, 2, oz + 31);
        makecylinder(0.5, 0.5, 4, 8, 0x998866, ox - 18, 2, oz + 31);
        makecylinder(0.5, 0.5, 4, 8, 0x998866, ox - 15, 2, oz + 31);

        // Guildhall overhang
        makebox(16, 0.5, 3, 0xBBAA88, ox - 23, 4, oz + 31);

        // Ornate facade strip
        makebox(14, 0.3, 0.3, 0xCCBB99, ox - 25, 6, oz + 30);

        // 6. UNDERGROUND PASSAGES — entrance kiosk
        makebox(3, 2, 3, 0x666655, ox - 10, 1, oz + 38);

        // Stair descent boxes
        makebox(2, 0.3, 1, 0x555544, ox - 10, 0.5, oz + 39.5);
        makebox(2, 0.3, 1, 0x555544, ox - 10, 0.2, oz + 40.5);

        // Tunnel visible entrance
        makebox(2, 2, 0.3, 0x444433, ox - 10, 1, oz + 37);

        // 7. CATHEDRAL YARD — surrounding medieval buildings
        // 8 buildings of varying sizes enclosing the close
        makebox(5, 7, 5, 0xBBAA88, ox + 35, 3.5, oz - 15);
        makebox(7, 6, 6, 0xCC9966, ox + 35, 3, oz - 5);
        makebox(8, 9, 6, 0xBBAA88, ox + 35, 4.5, oz + 5);
        makebox(6, 7, 5, 0xCC9966, ox + 35, 3.5, oz + 15);
        makebox(5, 8, 7, 0xBBAA88, ox - 35, 4, oz - 10);
        makebox(7, 6, 5, 0xCC9966, ox - 35, 3, oz + 5);
        makebox(8, 7, 6, 0xBBAA88, ox - 35, 3.5, oz + 15);
        makebox(6, 9, 8, 0xCC9966, ox + 15, 4.5, oz - 22);

        // 8. MOL'S COFFEE HOUSE — Elizabethan merchant's house
        makebox(6, 8, 5, 0x887755, ox + 25, 4, oz + 35);

        // Timber-framed facade strips (horizontal carved bands)
        makebox(6, 0.3, 0.3, 0x665533, ox + 25, 5, oz + 32.5);
        makebox(6, 0.3, 0.3, 0x665533, ox + 25, 6.5, oz + 32.5);
        makebox(6, 0.3, 0.3, 0x665533, ox + 25, 8, oz + 32.5);

        // Vertical timber strips
        makebox(0.3, 8, 0.3, 0x665533, ox + 22, 4, oz + 32.5);
        makebox(0.3, 8, 0.3, 0x665533, ox + 25, 4, oz + 32.5);
        makebox(0.3, 8, 0.3, 0x665533, ox + 28, 4, oz + 32.5);

        // 9. ROUGEMONT CASTLE — Norman gatehouse ruin
        makebox(8, 10, 6, 0x888870, ox - 45, 5, oz + 30);

        // Ruined walls
        makebox(12, 5, 0.5, 0x888870, ox - 50, 2.5, oz + 25);
        makebox(8, 4, 0.5, 0x888870, ox - 40, 2, oz + 25);

        // Gate tower
        makebox(4, 12, 4, 0x777760, ox - 45, 6, oz + 22);

        // 10. EXE RIVERSIDE — River Exe flat
        makebox(60, 0.5, 20, 0x336688, ox - 10, -0.3, oz - 55);

        // Quayside
        makebox(20, 0.3, 4, 0x887766, ox + 0, 0, oz - 46);

        // Historic warehouses x3
        makebox(8, 8, 6, 0x776655, ox - 10, 4, oz - 43);
        makebox(8, 6, 6, 0x887766, ox + 2, 3, oz - 43);
        makebox(8, 7, 6, 0x776655, ox + 14, 3.5, oz - 43);
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
