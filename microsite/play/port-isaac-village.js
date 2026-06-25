window.PortIsaacVillage = (function() {
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
        var ox = 8640;
        var oz = 0;

        // 1. Harbour basin quay walls — 4 box sections 6x1.5x2.5
        makebox(6, 1.5, 2.5, 0x888870, ox + 0,   0.75, oz + 0);
        makebox(6, 1.5, 2.5, 0x888870, ox + 6,   0.75, oz + 0);
        makebox(6, 1.5, 2.5, 0x888870, ox + 0,   0.75, oz + 12);
        makebox(6, 1.5, 2.5, 0x888870, ox + 6,   0.75, oz + 12);

        // Breakwater arm — 3 sections 5x1.5x2
        makebox(5, 1.5, 2, 0x888870, ox + 13,  0.75, oz + 2);
        makebox(5, 1.5, 2, 0x888870, ox + 13,  0.75, oz + 6);
        makebox(5, 1.5, 2, 0x888870, ox + 13,  0.75, oz + 10);

        // 2. Fishing boats — 4 boats: hull box 3x0.8x1.5 + mast cylinder 0.15r x 4h
        // Boat 1
        makebox(3, 0.8, 1.5, 0x8B4513, ox + 2,  0.4, oz + 3);
        makecylinder(0.15, 0.15, 4, 6, 0x22557A, ox + 2, 2.4, oz + 3);
        // Boat 2
        makebox(3, 0.8, 1.5, 0x22557A, ox + 5,  0.4, oz + 5);
        makecylinder(0.15, 0.15, 4, 6, 0x8B4513, ox + 5, 2.4, oz + 5);
        // Boat 3
        makebox(3, 0.8, 1.5, 0x8B4513, ox + 2,  0.4, oz + 8);
        makecylinder(0.15, 0.15, 4, 6, 0x22557A, ox + 2, 2.4, oz + 8);
        // Boat 4
        makebox(3, 0.8, 1.5, 0x22557A, ox + 5,  0.4, oz + 10);
        makecylinder(0.15, 0.15, 4, 6, 0x8B4513, ox + 5, 2.4, oz + 10);

        // 3. Steep cottage terraces — 20 white-washed cottages, 4 rows of 5
        // Row 0: y=0, Row 1: y=1.5, Row 2: y=3, Row 3: y=4.5
        var cottagePositions = [
            // Row 0 at z=20, ground level 0
            [ox - 8,  2.0, oz + 20],
            [ox - 4,  2.0, oz + 20],
            [ox + 0,  2.0, oz + 20],
            [ox + 4,  2.0, oz + 20],
            [ox + 8,  2.0, oz + 20],
            // Row 1 at z=26, ground level 1.5
            [ox - 8,  3.5, oz + 26],
            [ox - 4,  3.5, oz + 26],
            [ox + 0,  3.5, oz + 26],
            [ox + 4,  3.5, oz + 26],
            [ox + 8,  3.5, oz + 26],
            // Row 2 at z=32, ground level 3
            [ox - 8,  5.0, oz + 32],
            [ox - 4,  5.0, oz + 32],
            [ox + 0,  5.0, oz + 32],
            [ox + 4,  5.0, oz + 32],
            [ox + 8,  5.0, oz + 32],
            // Row 3 at z=38, ground level 4.5
            [ox - 8,  6.5, oz + 38],
            [ox - 4,  6.5, oz + 38],
            [ox + 0,  6.5, oz + 38],
            [ox + 4,  6.5, oz + 38],
            [ox + 8,  6.5, oz + 38]
        ];

        for (var ci = 0; ci < cottagePositions.length; ci++) {
            var cp = cottagePositions[ci];
            // Cottage body 3x4x3.5
            makebox(3, 4, 3.5, 0xF0EEE0, cp[0], cp[1], cp[2]);
            // Window front face
            makebox(0.8, 0.8, 0.1, 0x334455, cp[0], cp[1] + 0.3, cp[2] - 1.76);
        }

        // 4. The Platt — village square at harbour top
        makebox(10, 0.3, 8, 0x998866, ox + 3, 0.15, oz + 16);
        // Central flagpole
        makecylinder(0.1, 0.1, 5, 6, 0xAAAAAA, ox + 3, 2.65, oz + 16);

        // 5. Doc Martin surgery — cliff building 6x5x5
        makebox(6, 5, 5, 0xF5F0DC, ox + 20, 2.5, oz + 30);
        // Wooden sign board 2x0.1x0.5
        makebox(2, 0.1, 0.5, 0x8B6914, ox + 20, 4.0, oz + 27.26);

        // 6. Golden Lion pub — corner pub 7x5x6
        makebox(7, 5, 6, 0xAA8855, ox - 14, 2.5, oz + 22);
        // Outdoor bench boxes
        makebox(2, 0.4, 0.5, 0x7B5E3A, ox - 12, 0.2, oz + 19);
        makebox(2, 0.4, 0.5, 0x7B5E3A, ox - 16, 0.2, oz + 19);
        // Ale barrels cylinders 0.4r x 0.6h
        makecylinder(0.4, 0.4, 0.6, 8, 0x8B6914, ox - 11, 0.3, oz + 21);
        makecylinder(0.4, 0.4, 0.6, 8, 0x8B6914, ox - 11, 0.3, oz + 22.5);

        // 7. Narrow opes (alleys) — 3 pairs of alley walls 0.4x3x8
        // Ope 1
        makebox(0.4, 3, 8, 0xBBAA88, ox - 2, 1.5, oz + 24);
        makebox(0.4, 3, 8, 0xBBAA88, ox - 1, 1.5, oz + 24);
        // Ope 2
        makebox(0.4, 3, 8, 0xBBAA88, ox + 2, 1.5, oz + 30);
        makebox(0.4, 3, 8, 0xBBAA88, ox + 3, 1.5, oz + 30);
        // Ope 3
        makebox(0.4, 3, 8, 0xBBAA88, ox - 6, 1.5, oz + 35);
        makebox(0.4, 3, 8, 0xBBAA88, ox - 5, 1.5, oz + 35);

        // 8. Church of St Peter — hilltop church 8x6x10
        makebox(8, 6, 10, 0x888870, ox + 25, 3.0, oz + 45);
        // Square tower 3x3x12
        makebox(3, 12, 3, 0x888870, ox + 28, 6.0, oz + 45);
        // Cone roof 2r x 3h
        makecone(2, 3, 4, 0x666655, ox + 28, 13.5, oz + 45);

        // 9. Fish smokehouse — low industrial 10x5x4
        makebox(10, 5, 4, 0x776655, ox - 18, 2.5, oz + 10);
        // Chimney cylinder 0.5r x 6h smoke-stained
        makecylinder(0.5, 0.5, 6, 8, 0x555550, ox - 18, 8.0, oz + 10);

        // 10. Cliff path viewpoint — stone wall lookout 6x0.8x1.2 on headland
        makebox(6, 0.8, 1.2, 0x888870, ox + 30, 10.4, oz + 55);
        // Bench boxes x2
        makebox(1.5, 0.4, 0.5, 0x7B5E3A, ox + 28, 10.2, oz + 53);
        makebox(1.5, 0.4, 0.5, 0x7B5E3A, ox + 32, 10.2, oz + 53);
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
