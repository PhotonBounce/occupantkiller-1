window.TivertonCastle = (function() {
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
        mesh.position.set(9360 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9360 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9360 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildcastle();
        buildgatehouse();
        buildexeriver();
        buildcanal();
        buildbarge();
        buildchurch();
        buildmill();
        buildtown();
        buildschool();
        buildviewpoint();
    }

    function buildcastle() {
        // Main hall range 20x8x12
        addbox(20, 12, 8, 0x888870, 0, 6, 0);

        // L-shaped wing 12x8x10
        addbox(12, 10, 8, 0x888870, -14, 5, -8);

        // Drum tower NW corner cylinder 3r x 14h
        addcylinder(3, 3, 14, 0x888870, -10, 7, -4);

        // Drum tower NE corner
        addcylinder(3, 3, 14, 0x888870, 10, 7, -4);

        // Drum tower SW corner
        addcylinder(3, 3, 14, 0x888870, -10, 7, 4);

        // Drum tower SE corner
        addcylinder(3, 3, 14, 0x888870, 10, 7, 4);

        // Gate tower 8x5x16
        addbox(8, 16, 5, 0x888870, 0, 8, 6);

        // Civil War damage pockmarks (cannonball hits represented as depressed boxes)
        addbox(0.8, 0.5, 0.8, 0x666655, 3, 5, 4);
        addbox(0.8, 0.5, 0.8, 0x666655, -4, 7, 4);
        addbox(0.8, 0.5, 0.8, 0x666655, 6, 9, 4);
        addbox(0.8, 0.5, 0.8, 0x666655, -2, 11, 4);
        addbox(0.8, 0.5, 0.8, 0x666655, 8, 6, 4);

        // Cannonball sphere damage markers
        addsphere(0.8, 0x555544, 3, 5, 3.6);
        addsphere(0.8, 0x555544, -4, 7, 3.6);
        addsphere(0.8, 0x555544, 6, 9, 3.6);
    }

    function buildgatehouse() {
        // Ornate gatehouse box 8x6x12
        addbox(8, 12, 6, 0x888870, 0, 6, 14);

        // Twin round towers flanking gate - left
        addcylinder(2, 2, 10, 0x888870, -5, 5, 14);

        // Twin round towers flanking gate - right
        addcylinder(2, 2, 10, 0x888870, 5, 5, 14);

        // Gate arch lintel
        addbox(4, 1, 0.5, 0x666655, 0, 3, 11);
    }

    function buildexeriver() {
        // Wide river flat box 60x0.5x20
        addbox(60, 0.5, 20, 0x336688, 40, -0.25, 30);

        // River bank
        addbox(62, 0.5, 2, 0x887766, 40, 0, 20);

        // Far river bank
        addbox(62, 0.5, 2, 0x887766, 40, 0, 50);
    }

    function buildcanal() {
        // Grand Western Canal flat 40x0.5x6
        addbox(40, 0.5, 6, 0x4477AA, -40, -0.25, 20);

        // Tow path box 2x0.3x40
        addbox(2, 0.3, 40, 0x887766, -21, 0.15, 20);

        // Canal bank far side
        addbox(2, 0.3, 40, 0x887766, -61, 0.15, 20);
    }

    function buildbarge() {
        // Horse-drawn barge hull 12x1.5x2.5
        addbox(12, 1.5, 2.5, 0x44AA44, -40, 0.75, 20);

        // Cabin box 6x1.8x2
        addbox(6, 1.8, 2, 0x338833, -38, 2.4, 20);

        // Horse body box 1.2x0.8x0.6 on towpath
        addbox(1.2, 0.8, 0.6, 0xBB8844, -48, 0.7, 17);

        // Horse head sphere
        addsphere(0.35, 0xBB8844, -49, 1.2, 17);

        // Horse neck
        addbox(0.3, 0.5, 0.3, 0xBB8844, -48.7, 1.0, 17);

        // Horse legs - 4 cylinders
        addcylinder(0.1, 0.1, 0.6, 0xAA7733, -47.8, 0.3, 16.8);
        addcylinder(0.1, 0.1, 0.6, 0xAA7733, -48.4, 0.3, 16.8);
        addcylinder(0.1, 0.1, 0.6, 0xAA7733, -47.8, 0.3, 17.2);
        addcylinder(0.1, 0.1, 0.6, 0xAA7733, -48.4, 0.3, 17.2);
    }

    function buildchurch() {
        // St Peter's Church main nave 16x10x12
        addbox(16, 12, 10, 0x998866, -20, 6, -20);

        // Church tower 5x5x18
        addbox(5, 18, 5, 0x998866, -12, 9, -20);

        // South porch 4x3x6
        addbox(4, 6, 3, 0x998866, -20, 3, -14.5);

        // Porch carved stone decoration
        addbox(3.5, 0.3, 0.3, 0x887755, -20, 5.5, -13.2);

        // Chancel east end
        addbox(6, 8, 8, 0x887755, -29, 4, -20);

        // Roof ridge cone
        addbox(16, 1, 0.5, 0x776655, -20, 12.5, -20);
    }

    function buildmill() {
        // Textile mill ruin 3-storey roofless 25x10x10
        addbox(25, 10, 10, 0x777055, -60, 5, -10);

        // Mill walls only (roofless - no top surface, just walls visible)
        // Interior void represented by darker inner box
        addbox(23, 9, 8, 0x555033, -60, 5.5, -10);

        // Tall chimney cylinder 1r x 20h
        addcylinder(1, 1, 20, 0x8B4513, -70, 10, -10);

        // Chimney top cap
        addcylinder(1.2, 1.0, 0.5, 0x6B3010, -70, 20.25, -10);

        // Mill broken wall remnant
        addbox(3, 7, 0.5, 0x777055, -49, 3.5, -10);
    }

    function buildtown() {
        // 8 Georgian market buildings around pannier market
        // Pannier market building 18x10x5 open-sided
        addbox(18, 5, 10, 0xBBAA88, 30, 2.5, -15);

        // Market columns - 6 cylinders
        addcylinder(0.3, 0.3, 5, 0xCC9966, 21, 2.5, -15);
        addcylinder(0.3, 0.3, 5, 0xCC9966, 24.6, 2.5, -15);
        addcylinder(0.3, 0.3, 5, 0xCC9966, 28.2, 2.5, -15);
        addcylinder(0.3, 0.3, 5, 0xCC9966, 31.8, 2.5, -15);
        addcylinder(0.3, 0.3, 5, 0xCC9966, 35.4, 2.5, -15);
        addcylinder(0.3, 0.3, 5, 0xCC9966, 39, 2.5, -15);

        // Town building 1
        addbox(5, 7, 5, 0xBBAA88, 20, 3.5, -25);

        // Town building 2
        addbox(5, 7, 5, 0xCC9966, 27, 3.5, -25);

        // Town building 3
        addbox(5, 7, 5, 0xBBAA88, 34, 3.5, -25);

        // Town building 4
        addbox(5, 7, 5, 0xCC9966, 41, 3.5, -25);

        // Town building 5
        addbox(5, 7, 5, 0xBBAA88, 20, 3.5, -5);

        // Town building 6
        addbox(5, 7, 5, 0xCC9966, 27, 3.5, -5);

        // Town building 7
        addbox(5, 7, 5, 0xBBAA88, 34, 3.5, -5);

        // Town building 8
        addbox(5, 7, 5, 0xCC9966, 41, 3.5, -5);
    }

    function buildschool() {
        // Blundell's School main building 20x10x9
        addbox(20, 9, 10, 0xCC9966, -30, 4.5, -40);

        // School chapel 8x6x10
        addbox(8, 10, 6, 0xBB8855, -22, 5, -40);

        // Chapel roof cone/box
        addbox(8, 1, 6, 0xAA7744, -22, 10.5, -40);

        // Playing fields flat 40x0.3x20
        addbox(40, 0.3, 20, 0x558822, -30, 0.15, -55);

        // School entrance gate post left
        addbox(1, 4, 1, 0xCC9966, -41, 2, -45);

        // School entrance gate post right
        addbox(1, 4, 1, 0xCC9966, -19, 2, -45);
    }

    function buildviewpoint() {
        // Exe Valley viewpoint hilltop
        // Ground elevation
        addbox(15, 0.5, 15, 0x889977, 60, 5, -40);

        // Low stone wall 10x0.5x1
        addbox(10, 1, 0.5, 0x888870, 60, 5.75, -33);

        // Bench box left 2x0.3x0.5
        addbox(2, 0.3, 0.5, 0x887766, 56, 5.65, -36);

        // Bench box right 2x0.3x0.5
        addbox(2, 0.3, 0.5, 0x887766, 64, 5.65, -36);

        // Bench supports left
        addbox(0.2, 0.6, 0.5, 0x776655, 55.2, 5.3, -36);
        addbox(0.2, 0.6, 0.5, 0x776655, 56.8, 5.3, -36);

        // Tree 1 trunk cylinder 0.3r x 5h
        addcylinder(0.3, 0.3, 5, 0x553311, 55, 7.75, -42);
        // Tree 1 canopy sphere 3r
        addsphere(3, 0x447733, 55, 11.25, -42);

        // Tree 2 trunk
        addcylinder(0.3, 0.3, 5, 0x553311, 62, 7.75, -44);
        // Tree 2 canopy
        addsphere(3, 0x447733, 62, 11.25, -44);

        // Tree 3 trunk
        addcylinder(0.3, 0.3, 5, 0x553311, 66, 7.75, -40);
        // Tree 3 canopy
        addsphere(3, 0x447733, 66, 11.25, -40);
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
