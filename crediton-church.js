window.CreditonChurch = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 9560;
    var OZ = 0;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, color, x, y, z, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z, segs) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        // 1. Church of Holy Cross — cruciform church
        // Nave: 30×14×12 (w x h x d)
        makebox(30, 14, 12, 0x998866, 0, 7, 0);
        // Crossing tower: 6×20×6
        makebox(6, 20, 6, 0x998866, 0, 10, 0);
        // North transept: 10×12×10
        makebox(10, 12, 10, 0x998866, 0, 6, -11);
        // South transept: 10×12×10
        makebox(10, 12, 10, 0x998866, 0, 6, 11);
        // Chancel: 12×12×10
        makebox(12, 12, 10, 0x998866, -21, 6, 0);

        // 2. Red sandstone tower — separate tower structure
        // Main tower body
        makebox(6, 22, 6, 0xBB4422, 20, 11, 0);
        // Tower pinnacle cone
        makecone(3, 5, 0x554433, 20, 24.5, 0, 6);
        // 4 corner pinnacles (cylinders)
        makecyl(0.5, 0.5, 3, 0x554433, 17, 24, -3, 6);
        makecyl(0.5, 0.5, 3, 0x554433, 23, 24, -3, 6);
        makecyl(0.5, 0.5, 3, 0x554433, 17, 24, 3, 6);
        makecyl(0.5, 0.5, 3, 0x554433, 23, 24, 3, 6);

        // 3. College of Canons ruins — roofless box shells in churchyard
        makebox(12, 6, 6, 0x888870, -35, 3, -18);
        makebox(8, 5, 6, 0x888870, -35, 2.5, -8);

        // 4. Market town high street — 10 Georgian/Victorian buildings
        // Buildings along the high street
        makebox(5, 6, 5, 0xBBAA88, 30, 3, -20);
        makebox(5, 6, 5, 0xCC9966, 37, 3, -20);
        makebox(5, 6, 5, 0xBBAA88, 44, 3, -20);
        makebox(5, 6, 5, 0xCC9966, 51, 3, -20);
        makebox(5, 6, 5, 0xBBAA88, 58, 3, -20);
        makebox(5, 6, 5, 0xCC9966, 30, 3, -28);
        makebox(5, 6, 5, 0xBBAA88, 37, 3, -28);
        makebox(5, 6, 5, 0xCC9966, 44, 3, -28);
        // Town hall: 14×10×8 with clock tower
        makebox(14, 10, 8, 0xBBAA88, 52, 5, -28);
        // Clock tower on town hall
        makebox(3, 14, 3, 0xBBAA88, 52, 12, -28);

        // 5. Boniface Well — ancient holy well
        // Stone surround
        makebox(2, 0.5, 2, 0x888870, -10, 0.25, -30);
        // Cylindrical well opening
        makecyl(0.8, 0.8, 0.5, 0x666655, -10, 0.5, -30, 10);
        // Cross vertical
        makebox(0.1, 3, 0.1, 0x888870, -10, 2, -30);
        // Cross horizontal bar
        makebox(1.5, 0.1, 0.1, 0x888870, -10, 3, -30);

        // 6. Exe Valley — wide agricultural valley ground
        makebox(100, 0.5, 60, 0x6A8830, 0, -0.25, 0);

        // 7. Old tannery — medieval leather works ruin
        // Main tannery walls
        makebox(15, 6, 8, 0x776655, -50, 3, 20);
        // Beam hole gaps (dark box patches suggesting openings)
        makebox(1, 0.8, 0.2, 0x222211, -46, 4, 16);
        makebox(1, 0.8, 0.2, 0x222211, -50, 4, 16);
        makebox(1, 0.8, 0.2, 0x222211, -54, 4, 16);
        // Tannery chimney
        makecyl(0.6, 0.6, 8, 0x665544, -44, 4, 20, 8);

        // 8. Sandford village pub — thatched village pub
        // Pub body
        makebox(8, 5, 6, 0x886633, 60, 2.5, 20);
        // Low wall
        makebox(0.4, 0.4, 6, 0x776622, 55, 0.2, 20);
        // Thatch roof (cone)
        makecone(5, 2, 0x8B7355, 60, 6.5, 20, 6);

        // 9. Market cross — medieval market cross
        // Stepped plinth base (largest)
        makebox(2, 0.4, 2, 0x888870, 40, 0.2, -35);
        // Stepped plinth middle
        makebox(1.5, 0.3, 1.5, 0x888870, 40, 0.55, -35);
        // Stepped plinth top
        makebox(1, 0.2, 1, 0x888870, 40, 0.8, -35);
        // Column
        makebox(0.4, 5, 0.4, 0x888870, 40, 3.4, -35);

        // 10. Crediton war memorial — column in churchyard
        // Column
        makebox(0.6, 8, 0.6, 0x888880, -25, 4, -25);
        // Sphere finial
        makesphere(0.4, 0x888880, -25, 8.4, -25);

        // Additional detail objects to reach 55-65 total

        // Church buttresses (decorative supports)
        makebox(1.5, 12, 1.5, 0x887755, -12, 6, 6);
        makebox(1.5, 12, 1.5, 0x887755, -6, 6, 6);
        makebox(1.5, 12, 1.5, 0x887755, 0, 6, 6);
        makebox(1.5, 12, 1.5, 0x887755, 6, 6, 6);
        makebox(1.5, 12, 1.5, 0x887755, 12, 6, 6);

        // Churchyard boundary wall
        makebox(50, 1.2, 0.4, 0x888870, -5, 0.6, 35);
        makebox(50, 1.2, 0.4, 0x888870, -5, 0.6, -35);
        makebox(0.4, 1.2, 70, 0x888870, -30, 0.6, 0);

        // Church entrance porch
        makebox(4, 6, 4, 0x998866, 15, 3, 0);

        // Tannery second wall section
        makebox(8, 4, 0.5, 0x776655, -50, 2, 24);

        // Market town additional shop
        makebox(5, 6, 5, 0xCC9966, 58, 3, -28);

        // Sandford pub sign post
        makebox(0.1, 3, 0.1, 0x664422, 56, 1.5, 17);

        // Graveyard grave markers
        makebox(0.2, 1, 0.6, 0x999988, -20, 0.5, -20);
        makebox(0.2, 1, 0.6, 0x999988, -22, 0.5, -22);
        makebox(0.2, 1, 0.6, 0x999988, -18, 0.5, -18);
        makebox(0.2, 1, 0.6, 0x999988, -24, 0.5, -16);
        makebox(0.2, 1, 0.6, 0x999988, -28, 0.5, -20);
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

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    return { init: init, update: update, reset: reset };
}());
