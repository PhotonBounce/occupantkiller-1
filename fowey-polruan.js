window.FoweyPolruan = (function() {
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
        var ox = 8880;
        var oz = 0;

        // 1. Fowey estuary — deep water channel
        makebox(40, 0.5, 60, 0x1A4466, ox + 0, -0.25, oz + 0);

        // 2. Fowey town — cliff-hanging terraces (12 buildings, west side)
        var foweyColors = [0xBBAA88, 0xCC9966];
        var foweyPositions = [
            [-22, -6], [-22, -2], [-22, 2], [-22, 6],
            [-26, -8], [-26, -3], [-26, 2], [-26, 7],
            [-30, -9], [-30, -4], [-30, 1], [-30, 6]
        ];
        for (var i = 0; i < foweyPositions.length; i++) {
            var fc = foweyColors[i % 2];
            var fy = (i < 4) ? 2.5 : (i < 8) ? 5 : 7.5;
            makebox(4, 5, 5, fc, ox + foweyPositions[i][0], fy, oz + foweyPositions[i][1]);
        }

        // 3. Polruan village — smaller cluster on east bank (8 buildings)
        var polruanPositions = [
            [20, -8], [20, -3], [20, 2], [20, 7],
            [24, -6], [24, -1], [24, 4], [24, 9]
        ];
        for (var j = 0; j < polruanPositions.length; j++) {
            var py = (j < 4) ? 2 : 4;
            makebox(3, 4, 4, 0xBBAA77, ox + polruanPositions[j][0], py, oz + polruanPositions[j][1]);
        }

        // 4. Blockhouse Tower — medieval artillery fort
        makecylinder(5, 5, 8, 12, 0x888870, ox - 18, 4, oz - 28);
        // cannon emplacements (3 boxes)
        makebox(1, 0.6, 0.6, 0x555544, ox - 22, 8.3, oz - 26);
        makebox(1, 0.6, 0.6, 0x555544, ox - 22, 8.3, oz - 28);
        makebox(1, 0.6, 0.6, 0x555544, ox - 22, 8.3, oz - 30);

        // 5. St Fimbarrus Church — main body
        makebox(14, 8, 10, 0x888870, ox - 28, 4, oz + 15);
        // corner tower
        makebox(4, 16, 4, 0x888870, ox - 34, 8, oz + 12);
        // spire
        makecone(2, 4, 8, 0x777760, ox - 34, 18, oz + 12);

        // 6. Fowey Hotel — Victorian clifftop hotel (main block)
        makebox(20, 10, 9, 0xEEDDBB, ox - 32, 5, oz - 5);
        // bay windows (6 projecting boxes)
        makebox(2, 3, 0.4, 0xDDCCAA, ox - 25, 5, oz - 1.2);
        makebox(2, 3, 0.4, 0xDDCCAA, ox - 28, 5, oz - 1.2);
        makebox(2, 3, 0.4, 0xDDCCAA, ox - 31, 5, oz - 1.2);
        makebox(2, 3, 0.4, 0xDDCCAA, ox - 34, 5, oz - 1.2);
        makebox(2, 3, 0.4, 0xDDCCAA, ox - 37, 5, oz - 1.2);
        makebox(2, 3, 0.4, 0xDDCCAA, ox - 40, 5, oz - 1.2);

        // 7. Passenger ferry pontoon — floating dock
        makebox(8, 0.5, 3, 0x778899, ox - 10, 0.25, oz + 5);
        // cylinder floats (3)
        makecylinder(0.6, 0.6, 0.8, 8, 0x667788, ox - 7, -0.15, oz + 4);
        makecylinder(0.6, 0.6, 0.8, 8, 0x667788, ox - 10, -0.15, oz + 4);
        makecylinder(0.6, 0.6, 0.8, 8, 0x667788, ox - 13, -0.15, oz + 4);

        // 8. China clay vessel — large cargo ship
        // hull
        makebox(30, 5, 8, 0xDDDDCC, ox + 2, 2.5, oz - 15);
        // superstructure
        makebox(8, 4, 6, 0xCCCCBB, ox + 10, 7, oz - 15);
        // loading crane upright 1
        makebox(0.5, 12, 0.5, 0x999988, ox - 5, 10, oz - 15);
        // loading crane upright 2
        makebox(0.5, 12, 0.5, 0x999988, ox - 2, 10, oz - 15);
        // crane cross arm
        makebox(8, 0.5, 0.5, 0x999988, ox - 3.5, 16, oz - 15);
        // china clay dust patches (white boxes on deck)
        makebox(4, 0.3, 3, 0xEEEEEE, ox - 4, 5.15, oz - 15);
        makebox(3, 0.3, 3, 0xF0F0F0, ox + 0, 5.15, oz - 15);

        // 9. Safe haven bollards — 6 mooring bollards
        makecylinder(0.5, 0.5, 1.5, 8, 0x444444, ox - 8, 0.75, oz + 8);
        makecylinder(0.5, 0.5, 1.5, 8, 0x444444, ox - 5, 0.75, oz + 8);
        makecylinder(0.5, 0.5, 1.5, 8, 0x444444, ox - 2, 0.75, oz + 8);
        makecylinder(0.5, 0.5, 1.5, 8, 0x444444, ox + 1, 0.75, oz + 8);
        makecylinder(0.5, 0.5, 1.5, 8, 0x444444, ox + 4, 0.75, oz + 8);
        makecylinder(0.5, 0.5, 1.5, 8, 0x444444, ox + 7, 0.75, oz + 8);

        // 10. Town Quay — historic quayside
        makebox(20, 0.5, 5, 0x887766, ox - 8, 0.25, oz + 13);
        // warehouse 1
        makebox(8, 7, 6, 0x776655, ox - 15, 3.5, oz + 17);
        // warehouse 2
        makebox(8, 6, 7, 0x887766, ox - 5, 3, oz + 18);

        // Extra estuary detail: estuary mouth markers (small sphere-topped posts)
        makecylinder(0.2, 0.2, 3, 6, 0xCC3333, ox - 16, 1.5, oz - 28);
        makecylinder(0.2, 0.2, 3, 6, 0x33CC33, ox + 16, 1.5, oz - 28);

        // Polruan jetty
        makebox(6, 0.4, 2, 0x887766, ox + 17, 0.2, oz + 2);

        // Estuary marker buoy (cylinder + sphere)
        makecylinder(0.5, 0.5, 1.2, 8, 0xCC2222, ox + 5, 0.6, oz - 20);

        // Additional Fowey buildings on upper terraces
        makebox(4, 5, 5, 0xBBAA88, ox - 34, 10, oz - 1);
        makebox(4, 5, 5, 0xCC9966, ox - 34, 10, oz + 4);

        // Harbour wall — long defensive box
        makebox(2, 3, 60, 0x888877, ox - 15, 1.5, oz + 0);

        // East harbour wall (Polruan side)
        makebox(2, 2.5, 50, 0x888877, ox + 15, 1.25, oz - 5);

        // Estuary bed — sand/mud below waterline
        makebox(38, 0.4, 58, 0x997755, ox + 0, -0.7, oz + 0);

        // Lifeboat station
        makebox(6, 4, 5, 0x334466, ox - 16, 2, oz + 22);

        // Steps down to quay (terraced boxes)
        makebox(3, 0.4, 1.5, 0x998877, ox - 8, 0.7, oz + 10);
        makebox(3, 0.4, 1.5, 0x998877, ox - 8, 1.1, oz + 11.5);
        makebox(3, 0.4, 1.5, 0x998877, ox - 8, 1.5, oz + 13);

        // Polruan headland cliff (large backdrop box)
        makebox(10, 20, 5, 0x886644, ox + 28, 10, oz + 0);

        // Fowey headland cliff
        makebox(8, 18, 5, 0x886644, ox - 38, 9, oz - 15);
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
