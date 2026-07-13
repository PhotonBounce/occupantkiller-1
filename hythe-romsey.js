window.HytheRomsey = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 6680;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function mesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = new THREE.Mesh(geo, mat);
        return m;
    }

    function add(m, x, y, z) {
        m.position.set(OX + x, y, OZ + z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function canal() {
        // Royal Military Canal waterway
        var water = mesh(new THREE.BoxGeometry(80, 0.3, 8), 0x336677);
        add(water, 0, 0.15, -20);

        // North stone bank
        var bankN = mesh(new THREE.BoxGeometry(80, 0.5, 2), 0x888880);
        add(bankN, 0, 0.25, -24.5);

        // South stone bank
        var bankS = mesh(new THREE.BoxGeometry(80, 0.5, 2), 0x888880);
        add(bankS, 0, 0.25, -15.5);
    }

    function castle() {
        // Sandgate Castle - Henry VIII coastal artillery fort
        // Lower battery ring (wider, lower)
        var battery = mesh(new THREE.CylinderGeometry(12, 12, 4, 16), 0xCC9966);
        add(battery, 60, 2, 30);

        // Squat round tower
        var tower = mesh(new THREE.CylinderGeometry(8, 8, 8, 16), 0xCC9966);
        add(tower, 60, 8, 30);
    }

    function church() {
        // St Leonard's Hythe - famous skull ossuary
        // Nave
        var nave = mesh(new THREE.BoxGeometry(20, 9, 12), 0xBBB8A0);
        add(nave, -20, 4.5, 10);

        // Tower
        var tower = mesh(new THREE.BoxGeometry(5, 16, 5), 0xBBB8A0);
        add(tower, -32, 8, 10);

        // Spire
        var spire = mesh(new THREE.ConeGeometry(3, 8, 8), 0xBBB8A0);
        add(spire, -32, 20, 10);
    }

    function marsh() {
        // Romney Marsh - flat marshy ground with reed clumps and drainage dykes
        var clumpPositions = [
            [-50, 5], [-45, 15], [-55, 25], [-35, 20], [-60, 35]
        ];

        for (var c = 0; c < clumpPositions.length; c++) {
            var cx = clumpPositions[c][0];
            var cz = clumpPositions[c][1];
            for (var r = 0; r < 10; r++) {
                var rx = cx + (r % 4) * 1.2 - 2.4;
                var rz = cz + Math.floor(r / 4) * 1.5 - 1.5;
                var reed = mesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 5), 0x556633);
                add(reed, rx, 1.5, rz);
            }
        }

        // Drainage dykes
        var dyke1 = mesh(new THREE.BoxGeometry(40, 0.1, 1), 0x336655);
        add(dyke1, -45, 0.05, 8);

        var dyke2 = mesh(new THREE.BoxGeometry(40, 0.1, 1), 0x336655);
        add(dyke2, -45, 0.05, 18);

        var dyke3 = mesh(new THREE.BoxGeometry(40, 0.1, 1), 0x336655);
        add(dyke3, -45, 0.05, 28);
    }

    function highstreet() {
        // Hythe High Street - 10 Georgian/Victorian shops
        var colors = [0x8B3A2A, 0xF0EDE0, 0x8B3A2A, 0xF0EDE0, 0x8B3A2A,
                      0xF0EDE0, 0x8B3A2A, 0xF0EDE0, 0x8B3A2A, 0xF0EDE0];
        for (var i = 0; i < 10; i++) {
            var shop = mesh(new THREE.BoxGeometry(5, 7, 6), colors[i]);
            add(shop, -20 + i * 6, 3.5, -40);
        }
    }

    function martello() {
        // Martello Tower - Napoleonic cylindrical fort
        var body = mesh(new THREE.CylinderGeometry(7, 7, 5, 16), 0xCC9966);
        add(body, 30, 2.5, 50);

        // Flat roof
        var roof = mesh(new THREE.BoxGeometry(15, 0.5, 15), 0xAA8855);
        add(roof, 30, 5.25, 50);

        // Gun platform
        var platform = mesh(new THREE.BoxGeometry(4, 1, 4), 0x999988);
        add(platform, 30, 6, 50);
    }

    function railway() {
        // Romney Hythe & Dymchurch Railway - world's smallest public railway
        // Locomotive body
        var loco = mesh(new THREE.BoxGeometry(3, 1.5, 1.5), 0x222222);
        add(loco, -10, 1.25, -50);

        // Chimney
        var chimney = mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 8), 0x111111);
        add(chimney, -11, 2.5, -50);

        // Left wheel
        var wheelL = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 10), 0x333333);
        wheelL.rotation.x = Math.PI / 2;
        add(wheelL, -10, 0.5, -50.85);

        // Right wheel
        var wheelR = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 10), 0x333333);
        wheelR.rotation.x = Math.PI / 2;
        add(wheelR, -10, 0.5, -49.15);

        // Left rail
        var railL = mesh(new THREE.BoxGeometry(40, 0.1, 0.2), 0x666666);
        add(railL, 0, 0.05, -50.6);

        // Right rail
        var railR = mesh(new THREE.BoxGeometry(40, 0.1, 0.2), 0x666666);
        add(railR, 0, 0.05, -49.4);
    }

    function seawall() {
        // Sandy beach
        var beach = mesh(new THREE.BoxGeometry(80, 0.3, 15), 0xF4E0A0);
        add(beach, 0, 0.15, 65);

        // Sea
        var sea = mesh(new THREE.BoxGeometry(80, 0.3, 20), 0x4488BB);
        add(sea, 0, 0.15, 80);

        // Concrete seawall
        var wall = mesh(new THREE.BoxGeometry(60, 2, 0.5), 0xCCCCBB);
        add(wall, 0, 1, 57);
    }

    function build() {
        canal();
        castle();
        church();
        marsh();
        highstreet();
        martello();
        railway();
        seawall();
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
