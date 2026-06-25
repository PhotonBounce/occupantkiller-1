window.NewForestPonies = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 10160;
    var OZ = 0;

    function makemesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addobj(mesh, x, y, z) {
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildoaks() {
        var positions = [
            [-20, -10], [-8, 15], [5, -18], [22, 8], [-15, 25],
            [30, -5], [-28, 0], [12, -30], [-5, 35], [40, 20]
        ];
        var i, px, pz, trunk, canopy;
        for (i = 0; i < positions.length; i++) {
            px = positions[i][0];
            pz = positions[i][1];
            trunk = makemesh(new THREE.CylinderGeometry(0.8, 0.8, 6, 8), 0x5A3A1A);
            addobj(trunk, px, 3, pz);
            canopy = makemesh(new THREE.SphereGeometry(8, 8, 6), 0x447730);
            addobj(canopy, px, 11, pz);
        }
    }

    function buildponies() {
        var poses = [
            [10, -15, 0xDDCC99],
            [-12, 20, 0x8B5A2B],
            [18, 5, 0x5A3010],
            [-3, -22, 0xDDCC99],
            [25, -18, 0x8B5A2B],
            [-18, -8, 0x5A3010]
        ];
        var i, px, pz, col, body, head, neck, leg;
        for (i = 0; i < poses.length; i++) {
            px = poses[i][0];
            pz = poses[i][1];
            col = poses[i][2];
            body = makemesh(new THREE.BoxGeometry(1.3, 0.8, 0.6), col);
            addobj(body, px, 0.7, pz);
            neck = makemesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 6), col);
            addobj(neck, px + 0.6, 1.2, pz);
            head = makemesh(new THREE.SphereGeometry(0.35, 6, 5), col);
            addobj(head, px + 0.85, 1.55, pz);
            leg = makemesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6), col);
            addobj(leg, px + 0.4, 0.25, pz + 0.2);
            leg = makemesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6), col);
            addobj(leg, px + 0.4, 0.25, pz - 0.2);
            leg = makemesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6), col);
            addobj(leg, px - 0.4, 0.25, pz + 0.2);
            leg = makemesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6), col);
            addobj(leg, px - 0.4, 0.25, pz - 0.2);
            var tail = makemesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), col);
            addobj(tail, px - 0.7, 0.9, pz);
        }
    }

    function buildheathland() {
        var heath = makemesh(new THREE.BoxGeometry(60, 0.3, 60), 0x8A5A9A);
        addobj(heath, 0, -0.15, 0);
    }

    function buildlyndhurst() {
        var church = makemesh(new THREE.BoxGeometry(12, 8, 12), 0x888870);
        addobj(church, 55, 4, 10);
        var spire = makemesh(new THREE.CylinderGeometry(2, 2, 16, 8), 0x888870);
        addobj(spire, 55, 16, 10);
        var steeple = makemesh(new THREE.ConeGeometry(1, 6, 8), 0x888870);
        addobj(steeple, 55, 27, 10);
        var green = makemesh(new THREE.BoxGeometry(15, 0.3, 15), 0x558830);
        addobj(green, 65, 0.15, 10);
        var bldgcolors = [0xCC9966, 0xBBAA77, 0xCC9966, 0xBBAA77, 0xCC9966, 0xBBAA77];
        var bldgpos = [
            [50, 25], [60, 25], [70, 25],
            [50, -5], [60, -5], [70, -5]
        ];
        var i, bldg;
        for (i = 0; i < 6; i++) {
            bldg = makemesh(new THREE.BoxGeometry(5, 5, 6), bldgcolors[i]);
            addobj(bldg, bldgpos[i][0], 2.5, bldgpos[i][1]);
        }
    }

    function buildrufusstone() {
        var stone = makemesh(new THREE.BoxGeometry(0.5, 2, 0.5), 0x888870);
        addobj(stone, -35, 1, -35);
        var leg1 = makemesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6), 0x888870);
        addobj(leg1, -34.6, 0.75, -35);
        var leg2 = makemesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6), 0x888870);
        addobj(leg2, -35.4, 0.75, -35.3);
        var leg3 = makemesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6), 0x888870);
        addobj(leg3, -35, 0.75, -34.6);
    }

    function buildcattle() {
        var herds = [
            [38, -25, 0x3A2010],
            [42, -20, 0xEECC88],
            [36, -18, 0x3A2010]
        ];
        var i, px, pz, col, body, head, leg;
        for (i = 0; i < herds.length; i++) {
            px = herds[i][0];
            pz = herds[i][1];
            col = herds[i][2];
            body = makemesh(new THREE.BoxGeometry(2, 1.2, 0.8), col);
            addobj(body, px, 1.0, pz);
            head = makemesh(new THREE.SphereGeometry(0.5, 6, 5), col);
            addobj(head, px + 1.1, 1.6, pz);
            leg = makemesh(new THREE.CylinderGeometry(0.2, 0.2, 1.0, 6), col);
            addobj(leg, px + 0.6, 0.3, pz + 0.3);
            leg = makemesh(new THREE.CylinderGeometry(0.2, 0.2, 1.0, 6), col);
            addobj(leg, px + 0.6, 0.3, pz - 0.3);
            leg = makemesh(new THREE.CylinderGeometry(0.2, 0.2, 1.0, 6), col);
            addobj(leg, px - 0.6, 0.3, pz + 0.3);
            leg = makemesh(new THREE.CylinderGeometry(0.2, 0.2, 1.0, 6), col);
            addobj(leg, px - 0.6, 0.3, pz - 0.3);
        }
    }

    function buildlodge() {
        var lodge = makemesh(new THREE.BoxGeometry(8, 6, 5), 0xCC8855);
        addobj(lodge, -45, 3, 10);
        var roof = makemesh(new THREE.ConeGeometry(5, 2, 4), 0x8B7355);
        addobj(roof, -45, 7, 10);
        var rail, post, j;
        var railpositions = [
            [-38, 0.35, 8, 0, 0, 5],
            [-38, 0.35, 13, 0, 0, 5],
            [-36, 0.35, 10.5, 5, 0, 0],
            [-40, 0.35, 10.5, 5, 0, 0]
        ];
        for (j = 0; j < 4; j++) {
            rail = makemesh(new THREE.BoxGeometry(0.1, 0.7, 5), 0x8B6040);
            addobj(rail, railpositions[j][0], railpositions[j][1], railpositions[j][2]);
        }
        var postpositions = [
            [-38, 0.35, 8], [-38, 0.35, 10.5], [-38, 0.35, 13],
            [-40, 0.35, 8], [-40, 0.35, 13]
        ];
        for (j = 0; j < 5; j++) {
            post = makemesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), 0x8B6040);
            addobj(post, postpositions[j][0], postpositions[j][1], postpositions[j][2]);
        }
    }

    function builddeer() {
        var herd = [
            [15, 30, 0x8B6040],
            [20, 35, 0x8B6040],
            [10, 38, 0x8B6040],
            [18, 42, 0x8B6040]
        ];
        var i, px, pz, col, body, head, leg, ant1, ant2;
        for (i = 0; i < herd.length; i++) {
            px = herd[i][0];
            pz = herd[i][1];
            col = herd[i][2];
            body = makemesh(new THREE.BoxGeometry(1.0, 0.7, 0.5), col);
            addobj(body, px, 0.65, pz);
            head = makemesh(new THREE.SphereGeometry(0.25, 6, 5), col);
            addobj(head, px + 0.55, 1.1, pz);
            leg = makemesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6), col);
            addobj(leg, px + 0.3, 0.2, pz + 0.18);
            leg = makemesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6), col);
            addobj(leg, px + 0.3, 0.2, pz - 0.18);
            leg = makemesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6), col);
            addobj(leg, px - 0.3, 0.2, pz + 0.18);
            leg = makemesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6), col);
            addobj(leg, px - 0.3, 0.2, pz - 0.18);
            ant1 = makemesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), col);
            addobj(ant1, px + 0.45, 1.7, pz + 0.15);
            ant2 = makemesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), col);
            addobj(ant2, px + 0.45, 1.7, pz - 0.15);
        }
    }

    function buildenclosure() {
        var bank1 = makemesh(new THREE.BoxGeometry(0.6, 0.6, 20), 0x6A5A30);
        addobj(bank1, -50, 0.3, -10);
        var bank2 = makemesh(new THREE.BoxGeometry(20, 0.6, 0.6), 0x6A5A30);
        addobj(bank2, -40, 0.3, -20);
        var ditch1 = makemesh(new THREE.BoxGeometry(0.5, 0.2, 20), 0x3A3020);
        addobj(ditch1, -50.8, 0.1, -10);
        var ditch2 = makemesh(new THREE.BoxGeometry(20, 0.2, 0.5), 0x3A3020);
        addobj(ditch2, -40, 0.1, -20.8);
    }

    function buildstream() {
        var stream = makemesh(new THREE.BoxGeometry(1.5, 0.2, 40), 0x44AACC);
        addobj(stream, 0, 0.1, -20);
        var steppositions = [-30, -22, -14, -6, 2];
        var i, step;
        for (i = 0; i < 5; i++) {
            step = makemesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), 0x888870);
            addobj(step, 0, 0.25, steppositions[i]);
        }
    }

    function build() {
        buildheathland();
        buildoaks();
        buildponies();
        buildlyndhurst();
        buildrufusstone();
        buildcattle();
        buildlodge();
        builddeer();
        buildenclosure();
        buildstream();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
