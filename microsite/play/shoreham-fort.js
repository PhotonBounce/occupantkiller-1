window.ShorehamFort = (function() {
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

    function add(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function lines(geo, color) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        return new THREE.LineSegments(geo, mat);
    }

    function lambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = new THREE.Mesh(geo, lambert(color));
        mesh.position.set(x, y, z);
        return add(mesh);
    }

    function cylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 16);
        var mesh = new THREE.Mesh(geo, lambert(color));
        mesh.position.set(x, y, z);
        return add(mesh);
    }

    function cone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 16);
        var mesh = new THREE.Mesh(geo, lambert(color));
        mesh.position.set(x, y, z);
        return add(mesh);
    }

    function sphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 12, 8);
        var mesh = new THREE.Mesh(geo, lambert(color));
        mesh.position.set(x, y, z);
        return add(mesh);
    }

    function fort() {
        var ox = 6920;
        var oz = 0;
        var sections = 6;
        var radius = 18;
        for (var i = 0; i < sections; i++) {
            var angle = (-Math.PI / 2) + (Math.PI * i / (sections - 1));
            var wx = ox + Math.cos(angle) * radius;
            var wz = oz + Math.sin(angle) * radius;
            var rot = angle + Math.PI / 2;
            var geo = new THREE.BoxGeometry(2, 1.5, 5);
            var mesh = new THREE.Mesh(geo, lambert(0x6B5A3A));
            mesh.position.set(wx, 0.75, wz);
            mesh.rotation.y = -rot;
            scene.add(mesh);
            objects.push(mesh);
        }
        var emplacementAngles = [-Math.PI / 4, 0, Math.PI / 4];
        for (var j = 0; j < emplacementAngles.length; j++) {
            var ea = emplacementAngles[j];
            var ex = ox + Math.cos(ea) * (radius - 4);
            var ez = oz + Math.sin(ea) * (radius - 4);
            cylinder(3, 3, 0.5, 0x6B5A3A, ex, 0.25, ez);
        }
    }

    function harbour() {
        var ox = 6920;
        var oz = 0;
        box(4, 2, 60, 0x888877, ox + 10, 1, oz - 60);
        box(3, 2, 50, 0x888877, ox - 8, 1, oz - 55);
    }

    function lighthouse() {
        var ox = 6920;
        var oz = 0;
        var lx = ox + 10;
        var lz = oz - 91;
        cylinder(2, 2, 12, 0xFFFFFF, lx, 6, lz);
        cone(2.5, 3, 0x888877, lx, 13.5, lz);
        sphere(0.5, 0xFF0000, lx, 14.5, lz);
    }

    function estuary() {
        var ox = 6920;
        box(60, 0.3, 10, 0x4477AA, ox, 0.15, 20);
    }

    function bridge() {
        var ox = 6920;
        var oz = 0;
        box(2, 0.8, 50, 0x8B6914, ox, 2, oz + 20);
        var posts = [-20, -12, -4, 4, 12, 20];
        for (var i = 0; i < posts.length; i++) {
            cylinder(0.4, 0.4, 5, 0x8B6914, ox, 2.5, oz + posts[i]);
        }
    }

    function airport() {
        var ox = 6920;
        var oz = 0;
        box(25, 12, 6, 0xF8F8F8, ox - 40, 6, oz - 30);
        box(4, 4, 10, 0xF8F8F8, ox - 30, 12, oz - 30);
        cylinder(0.3, 0.3, 4, 0xFF6600, ox - 30, 17, oz - 30);
    }

    function chapel() {
        var ox = 6920;
        var oz = 0;
        box(30, 15, 18, 0xBBB8A0, ox + 60, 9, oz + 60);
        box(8, 8, 22, 0xBBB8A0, ox + 60, 18, oz + 60);
    }

    function runway() {
        var ox = 6920;
        box(60, 0.3, 8, 0x444444, ox - 40, 0.15, oz - 50);
    }

    function houseboats() {
        var ox = 6920;
        var oz = 0;
        var colors = [0xFFB3B3, 0xB3FFB3, 0xB3B3FF, 0xFFFFB3, 0xFFB3FF, 0xB3FFFF];
        for (var i = 0; i < 6; i++) {
            var hx = ox - 20 + i * 14;
            var hz = oz + 25;
            box(12, 1.5, 4, colors[i], hx, 0.75, hz);
            box(8, 2, 2.5, colors[i], hx, 2.25, hz);
        }
    }

    function build() {
        fort();
        harbour();
        lighthouse();
        estuary();
        bridge();
        airport();
        chapel();
        runway();
        houseboats();
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
