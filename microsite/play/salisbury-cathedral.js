window.SalisburyCathedral = (function() {
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

    function addcylinder(rt, rb, h, color, x, y, z, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcone(r, h, color, x, y, z, segs) {
        var geo = new THREE.ConeGeometry(r, h, segs || 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 9920;
        var oz = 0;

        // ---- 1. SALISBURY CATHEDRAL ----

        // Nave box 40x13x15
        addbox(40, 13, 15, 0x998866, ox + 0, 6.5, oz + 0);

        // West front 22x18x1.5
        addbox(22, 18, 1.5, 0x998866, ox - 20, 9, oz + 0);

        // West front niche tier 1
        addbox(18, 3, 0.6, 0x887755, ox - 20, 4, oz + 0.9);
        // West front niche tier 2
        addbox(18, 3, 0.6, 0x887755, ox - 20, 9, oz + 0.9);
        // West front niche tier 3
        addbox(18, 3, 0.6, 0x887755, ox - 20, 14, oz + 0.9);

        // West tower left 4x4x16
        addbox(4, 16, 4, 0x998866, ox - 22, 8, oz - 9);
        // West tower right 4x4x16
        addbox(4, 16, 4, 0x998866, ox - 22, 8, oz + 9);

        // Crossing tower 5x5x20
        addbox(5, 20, 5, 0x998866, ox + 5, 10, oz + 0);

        // Transept north arm 12x10x8
        addbox(12, 10, 8, 0x998866, ox + 5, 5, oz - 14);
        // Transept south arm 12x10x8
        addbox(12, 10, 8, 0x998866, ox + 5, 5, oz + 14);

        // Choir/chancel box 20x11x13
        addbox(20, 11, 13, 0x998866, ox + 20, 5.5, oz + 0);

        // SPIRE — three tapering cylinders soaring upward
        // Base spire section: 2.5r x 40h
        addcylinder(2.5, 2.5, 40, 0x888870, ox + 5, 40, oz + 0, 8);
        // Mid spire section: 2r x 30h
        addcylinder(2.0, 2.0, 30, 0x888870, ox + 5, 75, oz + 0, 8);
        // Top spire section: 1r x 20h
        addcylinder(1.0, 1.0, 20, 0x888870, ox + 5, 100, oz + 0, 8);
        // Spire tip cone
        addcone(1.0, 6, 0x888870, ox + 5, 113, oz + 0, 8);

        // ---- 2. CATHEDRAL CLOSE ----
        // Large grassy precinct 100x0.5x80
        addbox(100, 0.5, 80, 0x447730, ox + 10, 0.25, oz + 0);

        // ---- 3. CHAPTER HOUSE (MAGNA CARTA) ----
        // Octagonal chapter house — 8 wall boxes in ring
        var chx = ox + 35;
        var chz = oz - 20;
        var chRadius = 6;
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var wx = chx + Math.cos(angle) * chRadius;
            var wz = chz + Math.sin(angle) * chRadius;
            var wbox = new THREE.BoxGeometry(5, 8, 0.5);
            var wmat = new THREE.MeshLambertMaterial({ color: 0x998866 });
            var wmesh = new THREE.Mesh(wbox, wmat);
            wmesh.position.set(wx, 4, wz);
            wmesh.rotation.y = angle;
            scene.add(wmesh);
            objects.push(wmesh);
        }
        // Chapter house cone roof
        addcone(8, 5, 0x887744, chx, 11.5, chz, 8);

        // Magna Carta display plinth
        addbox(1.5, 1.0, 1.5, 0x998866, chx, 0.5, chz);
        // Famous document flat box 0.6x0.1x0.4
        addbox(0.6, 0.1, 0.4, 0xEEDDAA, chx, 1.05, chz);

        // ---- 4. RIVER AVON WATER MEADOWS ----
        // Pastoral flat 80x0.5x30
        addbox(80, 0.5, 30, 0x448833, ox - 20, 0.1, oz + 55);
        // River channel 3x0.2x60
        addbox(3, 0.2, 60, 0x336688, ox - 10, 0.2, oz + 55);

        // ---- 5. CATHEDRAL SCHOOL BUILDINGS ----
        // 6 structures 6x6x8 around the close
        addbox(6, 8, 6, 0xBBAA88, ox - 30, 4, oz - 30);
        addbox(6, 8, 6, 0xBBAA88, ox - 30, 4, oz + 30);
        addbox(6, 8, 6, 0xBBAA88, ox + 40, 4, oz - 30);
        addbox(6, 8, 6, 0xBBAA88, ox + 40, 4, oz + 30);
        addbox(6, 8, 6, 0xBBAA88, ox - 30, 4, oz + 0);
        addbox(6, 8, 6, 0xBBAA88, ox + 40, 4, oz + 0);

        // ---- 6. MALMESBURY HOUSE ----
        // Baroque mansion 14x10x10
        addbox(14, 10, 10, 0xEEDDAA, ox - 40, 5, oz - 40);
        // Formal garden hedges (4 box hedges 0.5x0.8x6)
        addbox(0.5, 0.8, 6, 0x336622, ox - 46, 0.4, oz - 37);
        addbox(0.5, 0.8, 6, 0x336622, ox - 34, 0.4, oz - 37);
        addbox(6, 0.8, 0.5, 0x336622, ox - 40, 0.4, oz - 34);
        addbox(6, 0.8, 0.5, 0x336622, ox - 40, 0.4, oz - 43);

        // ---- 7. MARKET SQUARE ----
        // Central city square flat 25x0.3x20
        addbox(25, 0.3, 20, 0x998866, ox - 60, 0.15, oz + 10);
        // Guildhall 14x8x9
        addbox(14, 8, 9, 0xDDCC99, ox - 60, 4, oz + 10);
        // Poultry cross base 0.5x5x0.5
        addbox(0.5, 5, 0.5, 0x998866, ox - 53, 2.5, oz + 10);
        // Poultry cross cone 3r x 3h
        addcone(3, 3, 0x998866, ox - 53, 6.5, oz + 10, 6);

        // ---- 8. HARNHAM MILL ----
        // Historic watermill 12x8x8
        addbox(12, 8, 8, 0x886633, ox - 10, 4, oz + 80);
        // Millwheel CylinderGeometry 4r x 0.5h
        addcylinder(4, 4, 0.5, 0x664422, ox - 4, 4, oz + 84, 12);

        // ---- 9. OLD SARUM ----
        // Norman castle ruin on hill
        // Hilltop cone 18r x 8h
        addcone(18, 8, 0x776640, ox + 80, 4, oz - 80, 8);
        // Square keep box 8x10x6
        addbox(8, 10, 6, 0x888870, ox + 80, 5, oz - 80);
        // Curtain wall fragments
        addbox(20, 3, 1.5, 0x888870, ox + 70, 1.5, oz - 70);
        addbox(1.5, 3, 15, 0x888870, ox + 65, 1.5, oz - 77);
        addbox(12, 3, 1.5, 0x888870, ox + 90, 1.5, oz - 88);

        // ---- 10. FISHERTON ANGER — RAILWAY VIADUCT ----
        // 4 arch sections 6x6x5
        addbox(6, 6, 5, 0x888870, ox - 80, 3, oz + 10);
        addbox(6, 6, 5, 0x888870, ox - 86, 3, oz + 10);
        addbox(6, 6, 5, 0x888870, ox - 92, 3, oz + 10);
        addbox(6, 6, 5, 0x888870, ox - 98, 3, oz + 10);
        // Arch openings (lighter box cutout stand-ins)
        addbox(3, 3, 5.2, 0x445533, ox - 80, 2, oz + 10);
        addbox(3, 3, 5.2, 0x445533, ox - 86, 2, oz + 10);
        addbox(3, 3, 5.2, 0x445533, ox - 92, 2, oz + 10);
        addbox(3, 3, 5.2, 0x445533, ox - 98, 2, oz + 10);
        // Viaduct deck
        addbox(30, 1, 5, 0x777766, ox - 89, 6.5, oz + 10);
        // Engine visible box 8x3x4 on viaduct
        addbox(8, 3, 4, 0x333333, ox - 84, 8.5, oz + 10);
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
