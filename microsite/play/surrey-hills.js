window.SurreyHills = (function() {
    'use strict';

    var objects = [];
    var scene = null;
    var offsetX = 4080;
    var offsetZ = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(offsetX + x, y, offsetZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(offsetX + x, y, offsetZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(offsetX + x, y, offsetZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildBoxHill() {
        // Chalk base layers - wide at bottom, narrowing to summit
        var i;
        var layers = [
            { w: 80, h: 4, d: 60, color: 0xFAFAF0, y: 2,  xo: 0,   zo: 0   },
            { w: 70, h: 4, d: 50, color: 0xFAFAF0, y: 6,  xo: 0,   zo: 0   },
            { w: 58, h: 4, d: 40, color: 0x90EE90, y: 10, xo: 0,   zo: 0   },
            { w: 46, h: 4, d: 30, color: 0x90EE90, y: 14, xo: 0,   zo: 0   },
            { w: 34, h: 4, d: 20, color: 0x90EE90, y: 18, xo: 0,   zo: 0   },
            { w: 22, h: 4, d: 12, color: 0x90EE90, y: 22, xo: 0,   zo: 0   }
        ];
        for (i = 0; i < layers.length; i++) {
            var l = layers[i];
            makeBox(l.w, l.h, l.d, l.color, l.xo, l.y, l.zo);
        }
        // Steep escarpment face - north side chalk cliff blocks
        for (i = 0; i < 5; i++) {
            makeBox(80, 3, 4, 0xFAFAF0, 0, 2 + i * 3, -32 + i * 2);
        }
    }

    function buildBoxHillCafe() {
        // Cafe building at summit
        makeBox(10, 4, 8, 0xD2B48C, 0, 26, 0);
        // Roof
        makeBox(11, 1, 9, 0x8B4513, 0, 30, 0);
        // Panoramic terrace walls
        makeBox(14, 2, 1, 0xD2B48C, 0, 24, -6);
        makeBox(14, 2, 1, 0xD2B48C, 0, 24, 7);
        makeBox(1, 2, 14, 0xD2B48C, -7, 24, 0);
        makeBox(1, 2, 14, 0xD2B48C, 7, 24, 0);
        // Olympic cycling 2012 signage markers at summit
        makeBox(2, 5, 0.5, 0xFFD700, -8, 26, -4);
        makeBox(2, 5, 0.5, 0xFFD700, -8, 26, 4);
        makeBox(2, 1, 3, 0xFF0000, -8, 31, 0);
    }

    function buildLeithHillTower() {
        // Conical hill base
        var i;
        var hillLayers = [
            { r: 22, h: 4, y: 2  },
            { r: 18, h: 4, y: 6  },
            { r: 14, h: 4, y: 10 },
            { r: 10, h: 4, y: 14 },
            { r: 7,  h: 4, y: 18 }
        ];
        for (i = 0; i < hillLayers.length; i++) {
            var hl = hillLayers[i];
            makeCylinder(hl.r, hl.r + 4, hl.h, 8, 0x6B8E23, -150, hl.y, 80);
        }
        // Victorian Gothic tower - 14 blocks tall, 0x808080
        for (i = 0; i < 14; i++) {
            makeBox(6, 3, 6, 0x808080, -150, 22 + i * 3, 80);
        }
        // Tower battlements
        makeBox(2, 2, 2, 0x808080, -153, 22 + 14 * 3, 77);
        makeBox(2, 2, 2, 0x808080, -147, 22 + 14 * 3, 77);
        makeBox(2, 2, 2, 0x808080, -153, 22 + 14 * 3, 83);
        makeBox(2, 2, 2, 0x808080, -147, 22 + 14 * 3, 83);
        // Gothic arched windows (box approximation)
        makeBox(2, 4, 0.5, 0x505050, -150, 28, 77);
        makeBox(2, 4, 0.5, 0x505050, -150, 34, 77);
        makeBox(2, 4, 0.5, 0x505050, -150, 40, 77);
    }

    function buildNorthDownsWay() {
        // Chalk path winding along ridge - row of white-ish boxes
        var i;
        var pathSegments = [
            { x: -20, z: -10 },
            { x: -16, z: -8  },
            { x: -12, z: -6  },
            { x: -8,  z: -5  },
            { x: -4,  z: -5  },
            { x: 0,   z: -5  },
            { x: 4,   z: -5  },
            { x: 8,   z: -6  },
            { x: 12,  z: -8  },
            { x: 16,  z: -10 },
            { x: 20,  z: -13 },
            { x: 24,  z: -16 },
            { x: 28,  z: -18 },
            { x: 32,  z: -20 },
            { x: 36,  z: -20 },
            { x: 40,  z: -19 },
            { x: 44,  z: -17 },
            { x: 48,  z: -15 },
            { x: 52,  z: -13 },
            { x: 56,  z: -12 }
        ];
        for (i = 0; i < pathSegments.length; i++) {
            var ps = pathSegments[i];
            makeBox(5, 0.5, 3, 0xFAFAF0, ps.x, 0.25, ps.z);
        }
    }

    function buildRiverMole() {
        // River Mole winding through valley - 50 long x 3 wide
        var i;
        var riverSegments = [
            { x: -25, z: 20 },
            { x: -23, z: 22 },
            { x: -21, z: 23 },
            { x: -19, z: 23 },
            { x: -17, z: 22 },
            { x: -15, z: 21 },
            { x: -13, z: 20 },
            { x: -11, z: 20 },
            { x: -9,  z: 21 },
            { x: -7,  z: 22 },
            { x: -5,  z: 22 },
            { x: -3,  z: 21 },
            { x: -1,  z: 20 },
            { x: 1,   z: 20 },
            { x: 3,   z: 21 },
            { x: 5,   z: 22 },
            { x: 7,   z: 22 },
            { x: 9,   z: 21 },
            { x: 11,  z: 20 },
            { x: 13,  z: 20 },
            { x: 15,  z: 21 },
            { x: 17,  z: 22 },
            { x: 19,  z: 22 },
            { x: 21,  z: 21 },
            { x: 23,  z: 20 }
        ];
        for (i = 0; i < riverSegments.length; i++) {
            var rs = riverSegments[i];
            makeBox(3, 0.4, 3, 0x4169E1, rs.x, -0.2, rs.z);
        }
    }

    function buildSteppingStones() {
        // 8 stepping stones across river at Box Hill
        var i;
        for (i = 0; i < 8; i++) {
            makeBox(1.5, 0.4, 1.5, 0x808080, -3 + i * 2, 0.2, 21);
        }
    }

    function buildPolesdenLacey() {
        // Edwardian mansion - cream colored, 20x12x6
        makeBox(20, 6, 12, 0xFFF8DC, -200, 3, -50);
        // Roof
        makeBox(21, 1.5, 13, 0xC8A882, -200, 6, -50);
        // Portico columns
        makeBox(1.5, 7, 1.5, 0xFFF8DC, -208, 3.5, -47);
        makeBox(1.5, 7, 1.5, 0xFFF8DC, -208, 3.5, -53);
        makeBox(1.5, 7, 1.5, 0xFFF8DC, -205, 3.5, -47);
        makeBox(1.5, 7, 1.5, 0xFFF8DC, -205, 3.5, -53);
        // Portico pediment
        makeBox(5, 2, 7, 0xFFF8DC, -206.5, 11, -50);
        // Formal garden hedge arrangements (Box hedges)
        var hedgePositions = [
            { x: -190, z: -44 },
            { x: -190, z: -56 },
            { x: -185, z: -44 },
            { x: -185, z: -56 },
            { x: -180, z: -44 },
            { x: -180, z: -50 },
            { x: -180, z: -56 }
        ];
        var i;
        for (i = 0; i < hedgePositions.length; i++) {
            var hp = hedgePositions[i];
            makeBox(4, 1.5, 1, 0x2E8B57, hp.x, 0.75, hp.z);
        }
        // Garden path
        makeBox(0.5, 0.1, 20, 0xD2B48C, -195, 0.05, -50);
        makeBox(16, 0.1, 0.5, 0xD2B48C, -192, 0.05, -60);
    }

    function buildDorking() {
        // Cluster of buildings in valley
        var buildingData = [
            { w: 8,  h: 5,  d: 6,  color: 0xCD853F, x: 80, z: 40 },
            { w: 6,  h: 4,  d: 5,  color: 0xDEB887, x: 90, z: 38 },
            { w: 10, h: 6,  d: 8,  color: 0xBC8F5F, x: 72, z: 43 },
            { w: 7,  h: 5,  d: 6,  color: 0xCD853F, x: 80, z: 52 },
            { w: 5,  h: 4,  d: 5,  color: 0xDEB887, x: 88, z: 50 },
            { w: 9,  h: 5,  d: 7,  color: 0xBC8F5F, x: 70, z: 50 },
            { w: 6,  h: 4,  d: 5,  color: 0xCD853F, x: 96, z: 44 },
            { w: 8,  h: 5,  d: 6,  color: 0xDEB887, x: 62, z: 45 }
        ];
        var i;
        for (i = 0; i < buildingData.length; i++) {
            var bd = buildingData[i];
            makeBox(bd.w, bd.h, bd.d, bd.color, bd.x, bd.h / 2, bd.z);
        }
        // Medieval church - nave
        makeBox(12, 6, 8, 0x8B8B7A, 80, 3, 60);
        // Church tower (Box)
        makeBox(5, 12, 5, 0x8B8B7A, 84, 6, 60);
        // Church tower battlements
        makeBox(2, 2, 2, 0x8B8B7A, 82, 13, 58);
        makeBox(2, 2, 2, 0x8B8B7A, 86, 13, 58);
        makeBox(2, 2, 2, 0x8B8B7A, 82, 13, 62);
        makeBox(2, 2, 2, 0x8B8B7A, 86, 13, 62);
        // ConeGeometry spire on tower
        makeCone(2.5, 8, 4, 0x696969, 84, 18, 60);
        // Church roof
        makeBox(13, 2, 9, 0x696969, 80, 7, 60);
        // Churchyard wall
        makeBox(20, 1.5, 0.5, 0x8B8B7A, 80, 0.75, 65);
        makeBox(20, 1.5, 0.5, 0x8B8B7A, 80, 0.75, 55);
        makeBox(0.5, 1.5, 10, 0x8B8B7A, 70, 0.75, 60);
        makeBox(0.5, 1.5, 10, 0x8B8B7A, 90, 0.75, 60);
    }

    function buildYewTrees() {
        // Ancient yew trees along ridgeline - dark green
        var yewPositions = [
            { x: -10, z: -15 },
            { x: 5,   z: -18 },
            { x: 18,  z: -14 },
            { x: -25, z: -12 },
            { x: 30,  z: -16 },
            { x: -38, z: -10 },
            { x: 42,  z: -18 },
            { x: -50, z: -8  },
            { x: 55,  z: -20 },
            { x: -60, z: -12 },
            { x: 65,  z: -15 },
            { x: -70, z: -9  }
        ];
        var i;
        for (i = 0; i < yewPositions.length; i++) {
            var yp = yewPositions[i];
            // Trunk
            makeCylinder(0.4, 0.6, 3, 6, 0x3B2008, yp.x, 1.5, yp.z);
            // Lower foliage - wide cylinder
            makeCylinder(2.5, 3, 4, 6, 0x1A4A1A, yp.x, 5, yp.z);
            // Upper foliage - narrower cylinder
            makeCylinder(1.5, 2.5, 3, 6, 0x1A4A1A, yp.x, 8.5, yp.z);
            // Tip cone
            makeCone(1.5, 3, 6, 0x1A4A1A, yp.x, 11, yp.z);
        }
    }

    function init(sceneRef) {
        scene = sceneRef;
        buildBoxHill();
        buildBoxHillCafe();
        buildLeithHillTower();
        buildNorthDownsWay();
        buildRiverMole();
        buildSteppingStones();
        buildPolesdenLacey();
        buildDorking();
        buildYewTrees();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (scene) {
                scene.remove(objects[i]);
            }
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
    }

    return { init: init, update: update, reset: reset };
}());
