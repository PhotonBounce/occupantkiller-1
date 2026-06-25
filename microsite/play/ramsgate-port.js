window.RamsgatePort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 6480;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function add(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function make(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, mat);
    }

    function piers() {
        // East pier: BoxGeometry 4x3x60
        var eastPier = make(new THREE.BoxGeometry(4, 3, 60), 0xAA9988);
        eastPier.position.set(OX + 20, 1.5, OZ + 30);
        add(eastPier);

        // West pier: BoxGeometry 4x3x50
        var westPier = make(new THREE.BoxGeometry(4, 3, 50), 0xAA9988);
        westPier.position.set(OX - 20, 1.5, OZ + 25);
        add(westPier);
    }

    function lighthouse() {
        // Tower cylinder
        var tower = make(new THREE.CylinderGeometry(2, 2, 12, 10), 0xFFFFFF);
        tower.position.set(OX + 22, 6, OZ - 5);
        add(tower);

        // Cone cap
        var cap = make(new THREE.ConeGeometry(2.2, 3, 10), 0xFFFFFF);
        cap.position.set(OX + 22, 13.5, OZ - 5);
        add(cap);

        // Red stripe box
        var stripe = make(new THREE.BoxGeometry(4.2, 1.5, 4.2), 0xCC0000);
        stripe.position.set(OX + 22, 7.5, OZ - 5);
        add(stripe);
    }

    function marina() {
        var i;
        var hullColor = 0x3366AA;
        var mastColor = 0xCCCCCC;
        for (i = 0; i < 10; i++) {
            var hx = OX - 10 + (i % 5) * 6;
            var hz = OZ + 60 + Math.floor(i / 5) * 5;

            // Hull
            var hull = make(new THREE.BoxGeometry(8, 1, 2.5), hullColor);
            hull.position.set(hx, 0.5, hz);
            add(hull);

            // Mast
            var mast = make(new THREE.CylinderGeometry(0.2, 0.2, 10, 6), mastColor);
            mast.position.set(hx, 5.5, hz);
            add(mast);
        }
    }

    function grange() {
        // Main body: 18x12x10 brick
        var body = make(new THREE.BoxGeometry(18, 10, 12), 0x8B3A2A);
        body.position.set(OX - 60, 5, OZ - 20);
        add(body);

        // Pointed gable 1 (centre)
        var gable1 = make(new THREE.ConeGeometry(4, 5, 4), 0x8B3A2A);
        gable1.position.set(OX - 60, 12.5, OZ - 20);
        add(gable1);

        // Pointed gable 2 (left)
        var gable2 = make(new THREE.ConeGeometry(2.5, 4, 4), 0x8B3A2A);
        gable2.position.set(OX - 68, 12, OZ - 20);
        add(gable2);

        // Pointed gable 3 (right)
        var gable3 = make(new THREE.ConeGeometry(2.5, 4, 4), 0x8B3A2A);
        gable3.position.set(OX - 52, 12, OZ - 20);
        add(gable3);

        // Chimney 1
        var ch1 = make(new THREE.CylinderGeometry(0.5, 0.5, 4, 6), 0x7A3020);
        ch1.position.set(OX - 64, 14, OZ - 20);
        add(ch1);

        // Chimney 2
        var ch2 = make(new THREE.CylinderGeometry(0.5, 0.5, 4, 6), 0x7A3020);
        ch2.position.set(OX - 60, 14, OZ - 20);
        add(ch2);

        // Chimney 3
        var ch3 = make(new THREE.CylinderGeometry(0.5, 0.5, 4, 6), 0x7A3020);
        ch3.position.set(OX - 56, 14, OZ - 20);
        add(ch3);
    }

    function tunnels() {
        // Dark portal
        var portal = make(new THREE.BoxGeometry(4, 4, 2), 0x222222);
        portal.position.set(OX - 80, 2, OZ + 5);
        add(portal);

        // Brickwork surround (frame top)
        var frameTop = make(new THREE.BoxGeometry(6, 1, 2.2), 0x8B3A2A);
        frameTop.position.set(OX - 80, 4.5, OZ + 5);
        add(frameTop);

        // Brickwork surround (frame left)
        var frameLeft = make(new THREE.BoxGeometry(1, 4, 2.2), 0x8B3A2A);
        frameLeft.position.set(OX - 82.5, 2, OZ + 5);
        add(frameLeft);

        // Brickwork surround (frame right)
        var frameRight = make(new THREE.BoxGeometry(1, 4, 2.2), 0x8B3A2A);
        frameRight.position.set(OX - 77.5, 2, OZ + 5);
        add(frameRight);
    }

    function terminal() {
        // Ferry terminal: 30x15x8
        var building = make(new THREE.BoxGeometry(30, 8, 15), 0x889999);
        building.position.set(OX + 50, 4, OZ + 10);
        add(building);
    }

    function ferry() {
        // Hull: 50x8x10
        var hull = make(new THREE.BoxGeometry(50, 8, 10), 0xF5F5F5);
        hull.position.set(OX + 40, 4, OZ + 55);
        add(hull);

        // Funnel 1
        var funnel1 = make(new THREE.CylinderGeometry(2, 2, 5, 8), 0xCC2200);
        funnel1.position.set(OX + 30, 11.5, OZ + 55);
        add(funnel1);

        // Funnel 2
        var funnel2 = make(new THREE.CylinderGeometry(2, 2, 5, 8), 0xCC2200);
        funnel2.position.set(OX + 46, 11.5, OZ + 55);
        add(funnel2);
    }

    function cliffhouses() {
        var i;
        var stucco = 0xF0EDE0;
        for (i = 0; i < 6; i++) {
            var house = make(new THREE.BoxGeometry(12, 9, 10), stucco);
            house.position.set(OX - 40 + i * 14, 4.5, OZ - 50);
            add(house);

            // Simple roof
            var roof = make(new THREE.BoxGeometry(12, 2, 10), 0xCCBBAA);
            roof.position.set(OX - 40 + i * 14, 10, OZ - 50);
            add(roof);
        }
    }

    function stalls() {
        var i;
        var colors = [0xDD4444, 0x4444DD, 0x44AA44, 0xDDAA00, 0xAA44AA, 0x44AAAA, 0xDD8844, 0x88DD44];
        for (i = 0; i < 8; i++) {
            var stall = make(new THREE.BoxGeometry(3, 2.5, 2), colors[i % colors.length]);
            stall.position.set(OX - 10 + i * 4, 1.25, OZ - 10);
            add(stall);
        }
    }

    function build() {
        piers();
        lighthouse();
        marina();
        grange();
        tunnels();
        terminal();
        ferry();
        cliffhouses();
        stalls();
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
