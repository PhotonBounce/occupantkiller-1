window.StIvesHarbour = (function() {
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

    function addmesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addmesh(mesh);
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addmesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addmesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addmesh(mesh);
    }

    function harbourwall() {
        var ox = 8320;
        var oz = 0;
        var grey = 0x888880;
        // C-shape: bottom, right side going up, top curving left
        // Bottom section
        makebox(6, 2, 3, grey, ox + 0,  1, oz + 20);
        makebox(6, 2, 3, grey, ox + 6,  1, oz + 20);
        // Right side going north
        makebox(6, 2, 3, grey, ox + 12, 1, oz + 14);
        makebox(6, 2, 3, grey, ox + 14, 1, oz + 8);
        makebox(6, 2, 3, grey, ox + 14, 1, oz + 2);
        // Top curving left
        makebox(6, 2, 3, grey, ox + 10, 1, oz - 4);
        makebox(6, 2, 3, grey, ox + 4,  1, oz - 8);
        makebox(6, 2, 3, grey, ox - 2,  1, oz - 10);
    }

    function harbourbason() {
        // 8 fishing boats: hull + mast
        var boatdata = [
            { x: 8320 + 2,  z: 5,  hullcolor: 0x8B4513 },
            { x: 8320 + 6,  z: 5,  hullcolor: 0x2255AA },
            { x: 8320 + 2,  z: 10, hullcolor: 0x228B22 },
            { x: 8320 + 6,  z: 10, hullcolor: 0x8B4513 },
            { x: 8320 + 2,  z: 15, hullcolor: 0x2255AA },
            { x: 8320 + 6,  z: 15, hullcolor: 0x228B22 },
            { x: 8320 - 4,  z: 5,  hullcolor: 0x8B4513 },
            { x: 8320 - 4,  z: 10, hullcolor: 0x2255AA }
        ];
        for (var i = 0; i < boatdata.length; i++) {
            var b = boatdata[i];
            makebox(4, 1, 2, b.hullcolor, b.x, 0.5, b.z);
            makecylinder(0.2, 0.2, 5, 6, 0x5C3317, b.x, 3, b.z);
        }
    }

    function tategallery() {
        var ox = 8320 - 20;
        var oz = -20;
        // Main building box
        makebox(20, 12, 8, 0xF0F0F0, ox, 6, oz);
        // Curved roof: 3 cylinder sections on top
        makecylinder(4, 4, 4, 12, 0xE8E8E8, ox - 6, 14, oz);
        makecylinder(4, 4, 4, 12, 0xE8E8E8, ox,     14, oz);
        makecylinder(4, 4, 4, 12, 0xE8E8E8, ox + 6, 14, oz);
        // Glass facade panels
        makebox(4, 6, 0.3, 0x88AABB, ox - 6, 7, oz + 4);
        makebox(4, 6, 0.3, 0x88AABB, ox,     7, oz + 4);
        makebox(4, 6, 0.3, 0x88AABB, ox + 6, 7, oz + 4);
    }

    function rotundatower() {
        var ox = 8320 - 30;
        var oz = -24;
        makecylinder(4, 4, 8, 16, 0xF5F5F5, ox, 4, oz);
    }

    function sculpturegarden() {
        var positions = [
            { x: 8320 - 14, z: -10 },
            { x: 8320 - 18, z: -10 },
            { x: 8320 - 16, z: -6  }
        ];
        for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            makecylinder(1, 1, 2, 8, 0xB87333, p.x, 1, p.z);
            makesphere(1.5, 8, 6, 0xB87333, p.x, 3.5, p.z);
        }
    }

    function cottages() {
        var colors = [0xF5DEB3, 0xFFB6C1, 0xADD8E6, 0xF5DEB3, 0xFFB6C1, 0xADD8E6,
                      0xF5DEB3, 0xFFB6C1, 0xADD8E6, 0xF5DEB3, 0xFFB6C1, 0xADD8E6];
        for (var i = 0; i < 12; i++) {
            var col = i % 4;
            var row = Math.floor(i / 4);
            var cx = 8320 - 35 + col * 5;
            var cy = 3 + i * 0.5;
            var cz = -15 + row * 6;
            makebox(4, 6, 4, colors[i], cx, cy, cz);
            makecone(2.5, 2, 4, 0x8B4513, cx, cy + 4, cz);
        }
    }

    function church() {
        var ox = 8320 - 8;
        var oz = -30;
        makebox(6, 14, 6, 0x708090, ox, 7, oz);
        makecone(5, 4, 4, 0x607080, ox, 16, oz);
    }

    function smeatonspier() {
        var ox = 8320 + 18;
        var oz = 10;
        makebox(8, 1.5, 3, 0x888880, ox,      0.75, oz);
        makebox(8, 1.5, 3, 0x888880, ox + 8,  0.75, oz);
        makebox(8, 1.5, 3, 0x888880, ox + 16, 0.75, oz);
    }

    function lifeboatstation() {
        var ox = 8320 + 32;
        var oz = 10;
        makebox(8, 6, 5, 0xCC2200, ox,     3, oz);
        makebox(4, 6, 5, 0xF5F5F5, ox + 6, 3, oz);
        // Boat ramp incline — approximated with angled box
        var ramp = makebox(6, 0.5, 3, 0x888880, ox - 2, 0.25, oz + 4);
        ramp.rotation.x = -0.2;
    }

    function marketstalls() {
        var stalldata = [
            { x: 8320 - 5,  z: -2  },
            { x: 8320 - 5,  z: 2   },
            { x: 8320 - 5,  z: 6   },
            { x: 8320 + 2,  z: -2  },
            { x: 8320 + 2,  z: 2   },
            { x: 8320 + 2,  z: 6   }
        ];
        for (var i = 0; i < stalldata.length; i++) {
            var s = stalldata[i];
            // Frame
            makebox(2, 3, 0.2, 0x8B6914, s.x, 1.5, s.z);
            // Canopy
            makebox(2.5, 0.3, 1.5, 0xDEB887, s.x, 3.2, s.z);
        }
    }

    function build() {
        harbourwall();
        harbourbason();
        tategallery();
        rotundatower();
        sculpturegarden();
        cottages();
        church();
        smeatonspier();
        lifeboatstation();
        marketstalls();
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
