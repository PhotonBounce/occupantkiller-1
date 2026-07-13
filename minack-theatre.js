window.MinackTheatre = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 8360;
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

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildstage() {
        // Central stone stage 20x15x0.5
        makebox(20, 0.5, 15, 0x888880, 0, 0.25, 0);
        // Proscenium left pillar
        makebox(1, 5, 1, 0x888880, -9, 2.75, -7);
        // Proscenium right pillar
        makebox(1, 5, 1, 0x888880, 9, 2.75, -7);
        // Proscenium crossbeam
        makebox(18, 1, 1, 0x888880, 0, 5.5, -7);
    }

    function buildtiers() {
        // 6 concentric step terraces stepping up 1.5m each row
        var i;
        for (i = 0; i < 6; i++) {
            makebox(22, 0.8, 4, 0x777770, 0, 0.9 + i * 1.5, 8 + i * 4);
        }
    }

    function buildcliff() {
        // 3 large irregular cliff boxes behind theatre
        makebox(15, 20, 8, 0x5A5A55, -8, 10, 30);
        makebox(8, 25, 10, 0x5A5A55, 5, 12.5, 38);
        makebox(12, 30, 6, 0x5A5A55, 0, 15, 46);
    }

    function buildbeach() {
        // Porthcurno beach below cliff, turquoise
        makebox(60, 0.5, 30, 0x40E0D0, 0, -5.25, -30);
    }

    function buildlogan() {
        // Logan Rock promontory - cylinder base
        makecylinder(3, 3, 8, 8, 0x888870, 30, 4, -10);
        // Balanced boulder on top
        makesphere(4, 8, 8, 0x888870, 30, 12, -10);
    }

    function buildtower() {
        // Stone control tower at cliff edge
        makebox(5, 8, 5, 0x707060, -15, 4, 20);
        // Slate cone roof
        makecone(3, 3, 6, 0x707060, -15, 8.5, 20);
    }

    function buildpathstones() {
        // 4 path-marker stones descending to beach
        makebox(1, 2, 1, 0xDDDDCC, -20, 1, -5);
        makebox(1, 2, 1, 0xDDDDCC, -22, -0.5, -10);
        makebox(1, 2, 1, 0xDDDDCC, -24, -2, -15);
        makebox(1, 2, 1, 0xDDDDCC, -26, -3.5, -20);
    }

    function buildcafe() {
        // Squat stone cafe building
        makebox(12, 4, 6, 0x8B7355, 20, 2, 5);
        // Wooden sign post left
        makebox(0.3, 3, 0.3, 0x8B7355, 14.5, 1.5, 5);
        // Wooden sign post right
        makebox(0.3, 3, 0.3, 0x8B7355, 14.5, 1.5, 7);
        // Sign board
        makebox(3, 0.8, 0.1, 0x8B7355, 14.5, 3.4, 6);
    }

    function buildwaves() {
        // 5 spray foam boxes at cliff base
        makebox(3, 1, 1.5, 0xEEEEFF, -10, -4.75, -25);
        makebox(3, 1, 1.5, 0xEEEEFF, -5, -4.75, -27);
        makebox(3, 1, 1.5, 0xEEEEFF, 0, -4.75, -26);
        makebox(3, 1, 1.5, 0xEEEEFF, 5, -4.75, -28);
        makebox(3, 1, 1.5, 0xEEEEFF, 10, -4.75, -25);
    }

    function buildplaques() {
        // 3 memorial plaques set into theatre walls
        makebox(1, 0.1, 0.6, 0xC0B090, -5, 1.1, -6.9);
        makebox(1, 0.1, 0.6, 0xC0B090, 0, 1.1, -6.9);
        makebox(1, 0.1, 0.6, 0xC0B090, 5, 1.1, -6.9);
    }

    function buildextras() {
        // Additional cliff ledge details
        makebox(10, 1, 3, 0x6A6A60, -12, 6, 15);
        makebox(8, 1, 3, 0x6A6A60, 10, 7.5, 18);
        // Rocky outcrops on promontory
        makebox(4, 3, 4, 0x888870, 25, 1.5, -5);
        makebox(3, 2, 3, 0x888870, 35, 1, -15);
        // Seawater pool at base
        makebox(8, 0.3, 6, 0x40E0D0, -18, -5.15, -22);
        // Stage steps leading up
        makebox(5, 0.4, 1, 0x888880, 0, 0.7, 7);
        makebox(5, 0.4, 1, 0x888880, 0, 1.1, 7.8);
        makebox(5, 0.4, 1, 0x888880, 0, 1.5, 8.6);
        // Cliff top boulders
        makebox(3, 2, 3, 0x5A5A55, -5, 31, 49);
        makebox(2, 1.5, 2, 0x5A5A55, 3, 31, 52);
        makebox(4, 3, 2, 0x5A5A55, -15, 21, 35);
        // Amphitheatre side walls
        makebox(1, 10, 20, 0x777770, -12, 5, 15);
        makebox(1, 10, 20, 0x777770, 12, 5, 15);
        // Extra terrace detail strips
        makebox(22, 0.2, 0.4, 0x888880, 0, 1.7, 8);
        makebox(22, 0.2, 0.4, 0x888880, 0, 3.2, 12);
        makebox(22, 0.2, 0.4, 0x888880, 0, 4.7, 16);
        // Cafe chimney
        makecylinder(0.4, 0.4, 2, 6, 0x707060, 18, 6, 5);
        // Tower window slits
        makebox(0.1, 1, 0.5, 0x404040, -12.45, 6, 20);
        makebox(0.1, 1, 0.5, 0x404040, -17.55, 6, 20);
        // Logan Rock base support boulders
        makebox(2, 1, 2, 0x888870, 27, -0.5, -8);
        makebox(2, 1, 2, 0x888870, 33, -0.5, -12);
    }

    function build() {
        buildstage();
        buildtiers();
        buildcliff();
        buildbeach();
        buildlogan();
        buildtower();
        buildpathstones();
        buildcafe();
        buildwaves();
        buildplaques();
        buildextras();
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
