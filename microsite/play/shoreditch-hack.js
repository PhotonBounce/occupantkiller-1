window.ShoreditchHack = (function() {
    'use strict';

    var OX = 5160;
    var OZ = 2200;
    var objects = [];
    var scene = null;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    // 1. Shoreditch High Street: tech startup strip
    function buildhighstreet() {
        var i;
        // Road surface
        makebox(120, 0.3, 12, 0x333333, 0, 0.15, 0);
        // Row of converted warehouse buildings along the street
        var warehouseX = [-50, -30, -10, 10, 30, 50];
        for (i = 0; i < warehouseX.length; i++) {
            // Dark brick warehouse body
            makebox(14, 10, 10, 0x5C3317, warehouseX[i], 5, -18);
            // Glass facade overlay
            makebox(12, 7, 1, 0x87CEEB, warehouseX[i], 5.5, -13.5);
            // Roof terrace parapet
            makebox(14, 1, 10, 0x4A2810, warehouseX[i], 10.5, -18);
            // Roof terrace flooring
            makebox(12, 0.3, 8, 0x8B7355, warehouseX[i], 11, -18);
            // Roof terrace furniture suggestion (small boxes)
            makebox(2, 1, 2, 0x555555, warehouseX[i] - 3, 11.65, -20);
            makebox(2, 1, 2, 0x555555, warehouseX[i] + 3, 11.65, -16);
        }
        // Pavement strips
        makebox(120, 0.3, 4, 0xAAAAAA, 0, 0.15, -8);
        makebox(120, 0.3, 4, 0xAAAAAA, 0, 0.15, 8);
    }

    // 2. Brick Lane: curry/vintage street
    function buildbricklane() {
        var i;
        // Lane road
        makebox(14, 0.3, 100, 0x333333, 70, 0.15, 0);
        // Pavements
        makebox(4, 0.3, 100, 0xAAAAAA, 63, 0.15, 0);
        makebox(4, 0.3, 100, 0xAAAAAA, 77, 0.15, 0);

        // Victorian terraced shops west side
        var shopZW = [-40, -28, -16, -4, 8, 20, 32];
        var restaurantColors = [0xFF4500, 0xFF6347, 0xFFD700, 0xFF1493, 0x00CED1, 0xFF8C00, 0xADFF2F];
        for (i = 0; i < shopZW.length; i++) {
            // Brick body
            makebox(10, 8, 10, 0xD2B48C, 63, 4, shopZW[i]);
            // Colourful restaurant sign board
            makebox(8, 2, 0.5, restaurantColors[i], 63, 9.5, shopZW[i]);
            // Awning
            makebox(8, 0.3, 3, restaurantColors[i], 63, 7.5, shopZW[i] - 5.5);
        }
        // East side shops
        var shopZE = [-36, -24, -12, 0, 12, 24, 36];
        for (i = 0; i < shopZE.length; i++) {
            makebox(10, 8, 10, 0xD2B48C, 77, 4, shopZE[i]);
            makebox(8, 2, 0.5, restaurantColors[(i + 2) % restaurantColors.length], 77, 9.5, shopZE[i]);
            makebox(8, 0.3, 3, restaurantColors[(i + 2) % restaurantColors.length], 77, 7.5, shopZE[i] + 5.5);
        }
    }

    // 3. Old Truman Brewery: creative hub
    function buildtrewmanbrewery() {
        // Main brewery complex body
        makebox(40, 14, 30, 0x696969, -80, 7, -30);
        // Secondary wing
        makebox(20, 10, 20, 0x696969, -60, 5, -20);
        // Tall chimney
        makecylinder(2, 2, 22, 10, 0x555555, -65, 11, -40);
        makecylinder(2.5, 2.5, 1, 10, 0x444444, -65, 22.5, -40);
        // Market/event space — open box structures
        makebox(30, 5, 20, 0x777777, -82, 2.5, -10);
        // Market roof sections (glass-like)
        makebox(28, 0.4, 18, 0x87CEEB, -82, 5.2, -10);
        // Loading bay overhang
        makebox(15, 0.5, 5, 0x696969, -90, 6, -32);
        // Brick chimney base
        makecylinder(3, 3, 4, 10, 0x696969, -65, 2, -40);
        // Brewery signage boards
        makebox(18, 3, 0.5, 0x333333, -80, 15, -15);
    }

    // 4. Columbia Road Flower Market
    function buildcolumbiaroad() {
        var i;
        // Narrow road
        makebox(10, 0.3, 80, 0x333333, -140, 0.15, 0);
        // Pavements
        makebox(3, 0.3, 80, 0xAAAAAA, -147, 0.15, 0);
        makebox(3, 0.3, 80, 0xAAAAAA, -133, 0.15, 0);

        // Flower stall frames along west side
        var stallZ = [-32, -20, -8, 4, 16, 28];
        var flowerColors = [0xFF69B4, 0xFFFF00, 0x9400D3, 0xFF0000, 0xFF69B4, 0xFFFF00];
        var stemColors = [0x228B22, 0x228B22, 0x228B22, 0x228B22, 0x228B22, 0x228B22];
        for (i = 0; i < stallZ.length; i++) {
            // Stall table
            makebox(6, 0.5, 5, 0x8B4513, -147, 1, stallZ[i]);
            // Stall canopy
            makebox(7, 0.3, 6, flowerColors[i], -147, 3, stallZ[i]);
            // Flower cluster spheres on stall
            makesphere(1.2, 8, 8, flowerColors[i], -148, 2.5, stallZ[i] - 1);
            makesphere(1.0, 8, 8, flowerColors[(i + 1) % flowerColors.length], -146, 2.5, stallZ[i]);
            makesphere(0.9, 8, 8, flowerColors[(i + 2) % flowerColors.length], -147, 2.7, stallZ[i] + 1);
        }
        // East side stalls
        for (i = 0; i < stallZ.length; i++) {
            makebox(6, 0.5, 5, 0x8B4513, -133, 1, stallZ[i]);
            makebox(7, 0.3, 6, flowerColors[(i + 3) % flowerColors.length], -133, 3, stallZ[i]);
            makesphere(1.2, 8, 8, flowerColors[(i + 3) % flowerColors.length], -132, 2.5, stallZ[i] - 1);
            makesphere(1.0, 8, 8, flowerColors[(i + 4) % flowerColors.length], -134, 2.5, stallZ[i]);
            makesphere(0.9, 8, 8, flowerColors[(i + 5) % flowerColors.length], -133, 2.7, stallZ[i] + 1);
        }
        // Decorative flower cones (upside-down = inverted pot shapes)
        for (i = 0; i < 5; i++) {
            makecone(0.4, 1.2, 6, 0x8B4513, -145 + i, 0.6, -35);
        }
    }

    // 5. Hackney Empire theatre
    function buildhackneyempire() {
        // Main theatre building
        makebox(18, 10, 8, 0xD2B48C, 40, 5, 60);
        // Ornate facade layers
        makebox(18, 2, 1, 0xC8A882, 40, 11, 56.5);
        makebox(16, 1.5, 1, 0xBE9870, 40, 13, 56.5);
        // Dome suggestion cylinder on top
        makecylinder(3.5, 4, 3, 12, 0x2E8B57, 40, 14.5, 60);
        makecylinder(2, 3, 2, 12, 0x2E8B57, 40, 17, 60);
        // Side wings
        makebox(5, 7, 8, 0xD2B48C, 29.5, 3.5, 60);
        makebox(5, 7, 8, 0xD2B48C, 50.5, 3.5, 60);
        // Theatre entrance canopy
        makebox(10, 0.5, 3, 0x2E8B57, 40, 4, 56.5);
        // Entrance columns (cylinder)
        makecylinder(0.4, 0.4, 4, 8, 0xEEDDCC, 36, 2, 56.5);
        makecylinder(0.4, 0.4, 4, 8, 0xEEDDCC, 38, 2, 56.5);
        makecylinder(0.4, 0.4, 4, 8, 0xEEDDCC, 42, 2, 56.5);
        makecylinder(0.4, 0.4, 4, 8, 0xEEDDCC, 44, 2, 56.5);
        // Signage
        makebox(16, 2, 0.5, 0x8B0000, 40, 3.5, 55.8);
    }

    // 6. Victoria Park
    function buildvictoriapark() {
        // Park ground
        makebox(40, 0.3, 30, 0x228B22, -30, 0.15, 70);
        // Park paths
        makebox(2, 0.35, 30, 0xD2B48C, -30, 0.18, 70);
        makebox(40, 0.35, 2, 0xD2B48C, -30, 0.18, 70);
        // Lake (blue box recessed slightly)
        makebox(14, 0.3, 10, 0x4169E1, -22, 0.1, 76);
        // Lake border
        makebox(16, 0.4, 12, 0x8B7355, -22, 0.2, 76);
        // Victorian bandstand
        makecylinder(4, 4, 0.5, 12, 0x8B4513, -40, 0.25, 70);
        makecylinder(3, 3, 3, 12, 0xC0C0C0, -40, 2, 70);
        makecone(4.5, 3, 12, 0x2E8B57, -40, 4.5, 70);
        // Bandstand columns
        makecylinder(0.2, 0.2, 3, 8, 0xC0C0C0, -37, 2, 70);
        makecylinder(0.2, 0.2, 3, 8, 0xC0C0C0, -43, 2, 70);
        makecylinder(0.2, 0.2, 3, 8, 0xC0C0C0, -40, 2, 67);
        makecylinder(0.2, 0.2, 3, 8, 0xC0C0C0, -40, 2, 73);
        // Park trees (cylinder trunk + sphere canopy)
        makecylinder(0.3, 0.3, 3, 6, 0x5C3317, -45, 1.5, 60);
        makesphere(2, 8, 8, 0x228B22, -45, 4, 60);
        makecylinder(0.3, 0.3, 3, 6, 0x5C3317, -15, 1.5, 60);
        makesphere(2, 8, 8, 0x228B22, -15, 4, 60);
        makecylinder(0.3, 0.3, 3, 6, 0x5C3317, -50, 1.5, 78);
        makesphere(2.5, 8, 8, 0x2E8B57, -50, 4.5, 78);
        makecylinder(0.3, 0.3, 3, 6, 0x5C3317, -12, 1.5, 78);
        makesphere(2, 8, 8, 0x228B22, -12, 4, 78);
    }

    // 7. Barbican Estate — brutalist towers
    function buildbarbican() {
        var i, j;
        var towerPositions = [
            [-160, -80],
            [-148, -80],
            [-136, -80],
            [-160, -65],
            [-148, -65],
            [-136, -65]
        ];
        for (i = 0; i < towerPositions.length; i++) {
            // Main tower
            makebox(8, 22, 8, 0x808080, towerPositions[i][0], 11, towerPositions[i][1]);
            // Balcony strips
            for (j = 0; j < 5; j++) {
                makebox(9, 0.4, 9, 0x909090, towerPositions[i][0], 4 + j * 4, towerPositions[i][1]);
            }
            // Rooftop water tank suggestion
            makecylinder(1.2, 1.2, 2, 8, 0x707070, towerPositions[i][0], 23.5, towerPositions[i][1]);
        }
        // Barbican walkway podium connecting towers
        makebox(36, 2, 4, 0x777777, -148, 1, -75);
        makebox(4, 4, 20, 0x777777, -160, 2, -72);
        makebox(4, 4, 20, 0x777777, -136, 2, -72);
    }

    // 8. Hoxton Square
    function buildhoxtons() {
        // Central garden green
        makebox(20, 0.3, 20, 0x228B22, 110, 0.15, -20);
        // Garden paths
        makebox(2, 0.35, 20, 0xAAAAAA, 110, 0.18, -20);
        makebox(20, 0.35, 2, 0xAAAAAA, 110, 0.18, -20);
        // Iron railing suggestion (thin boxes)
        makebox(22, 1.5, 0.3, 0x333333, 110, 0.75, -31);
        makebox(22, 1.5, 0.3, 0x333333, 110, 0.75, -9);
        makebox(0.3, 1.5, 22, 0x333333, 99, 0.75, -20);
        makebox(0.3, 1.5, 22, 0x333333, 121, 0.75, -20);
        // Georgian terraces around the square — north row
        var gtX = [90, 102, 118, 130];
        var i;
        for (i = 0; i < gtX.length; i++) {
            makebox(10, 9, 8, 0xD2B48C, gtX[i], 4.5, -40);
            makebox(8, 2, 0.5, 0x222222, gtX[i], 10, -36.5);
        }
        // South row
        for (i = 0; i < gtX.length; i++) {
            makebox(10, 9, 8, 0xD2B48C, gtX[i], 4.5, 0);
            makebox(8, 2, 0.5, 0x222222, gtX[i], 10, 3.5);
        }
        // West terrace
        makebox(8, 9, 14, 0xD2B48C, 88, 4.5, -20);
        // East terrace
        makebox(8, 9, 14, 0xD2B48C, 132, 4.5, -20);
        // Square trees
        makecylinder(0.25, 0.25, 3, 6, 0x5C3317, 105, 1.5, -25);
        makesphere(1.8, 8, 8, 0x228B22, 105, 4, -25);
        makecylinder(0.25, 0.25, 3, 6, 0x5C3317, 115, 1.5, -15);
        makesphere(1.8, 8, 8, 0x228B22, 115, 4, -15);
    }

    // 9. Bethnal Green Museum of Childhood
    function buildbethnalgreen() {
        // Main museum building
        makebox(35, 10, 20, 0xE8E8E8, -170, 5, 40);
        // Classical facade projection
        makebox(20, 12, 3, 0xDDDDDD, -170, 6, 29.5);
        // Roof ridge
        makebox(37, 1, 22, 0xCCCCCC, -170, 10.5, 40);
        // Facade columns (cylinders)
        makecylinder(0.5, 0.5, 10, 8, 0xE0E0E0, -178, 5, 29.5);
        makecylinder(0.5, 0.5, 10, 8, 0xE0E0E0, -172, 5, 29.5);
        makecylinder(0.5, 0.5, 10, 8, 0xE0E0E0, -168, 5, 29.5);
        makecylinder(0.5, 0.5, 10, 8, 0xE0E0E0, -162, 5, 29.5);
        // Pediment triangle (cone flat)
        makecone(11, 4, 3, 0xDDDDDD, -170, 14, 29.5);
        // Exterior sculptures (sphere on plinth)
        makebox(2, 1, 2, 0xCCCCCC, -185, 0.5, 30);
        makesphere(1.2, 8, 8, 0xE8E8E8, -185, 2.2, 30);
        makebox(2, 1, 2, 0xCCCCCC, -155, 0.5, 30);
        makesphere(1.0, 8, 8, 0xE8E8E8, -155, 2.0, 30);
        // Steps
        makebox(14, 0.5, 3, 0xDDDDDD, -170, 0.25, 27);
        makebox(12, 0.5, 3, 0xDDDDDD, -170, 0.75, 25.5);
    }

    // 10. Spitalfields Market
    function buildspitalfields() {
        // Historic market hall base
        makebox(50, 8, 35, 0x8B4513, 0, 4, 40);
        // Iron frame suggestion (dark overlay strips)
        makebox(52, 0.5, 36, 0x444444, 0, 8.3, 40);
        makebox(52, 0.5, 36, 0x444444, 0, 4.3, 40);
        // Glass roof sections (light blue)
        makebox(48, 0.4, 10, 0x87CEEB, 0, 8.2, 32);
        makebox(48, 0.4, 10, 0x87CEEB, 0, 8.2, 40);
        makebox(48, 0.4, 10, 0x87CEEB, 0, 8.2, 48);
        // Ridge beam
        makebox(50, 1, 2, 0x333333, 0, 9, 40);
        // Market entrance arches (box arch suggestion)
        makebox(0.5, 8, 4, 0x7A3B10, -25.5, 4, 40);
        makebox(0.5, 8, 4, 0x7A3B10, 25.5, 4, 40);
        makebox(50, 1, 4, 0x7A3B10, 0, 8.5, 40);
        // Market stalls inside/outside
        var stallX = [-18, -9, 0, 9, 18];
        var awningColors = [0xFF6347, 0x4682B4, 0xFF8C00, 0x228B22, 0xDC143C];
        var i;
        for (i = 0; i < stallX.length; i++) {
            // Stall table
            makebox(5, 1, 4, 0x8B7355, stallX[i], 0.5, 38);
            // Awning
            makebox(6, 0.3, 5, awningColors[i], stallX[i], 3.5, 38);
            // Goods on table (small sphere)
            makesphere(0.6, 6, 6, awningColors[i], stallX[i], 1.5, 38);
            // Second row stalls
            makebox(5, 1, 4, 0x8B7355, stallX[i], 0.5, 44);
            makebox(6, 0.3, 5, awningColors[(i + 2) % awningColors.length], stallX[i], 3.5, 44);
        }
        // Victorian decorative corner turrets
        makecylinder(1.5, 1.5, 9, 8, 0x7A3B10, -25, 4.5, 22);
        makecylinder(1.5, 1.5, 9, 8, 0x7A3B10, 25, 4.5, 22);
        makecylinder(1.5, 1.5, 9, 8, 0x7A3B10, -25, 4.5, 58);
        makecylinder(1.5, 1.5, 9, 8, 0x7A3B10, 25, 4.5, 58);
        makecone(2, 3, 8, 0x444444, -25, 10.5, 22);
        makecone(2, 3, 8, 0x444444, 25, 10.5, 22);
        makecone(2, 3, 8, 0x444444, -25, 10.5, 58);
        makecone(2, 3, 8, 0x444444, 25, 10.5, 58);
    }

    // Ground plane for the whole district (using boxes, not PlaneGeometry)
    function buildground() {
        makebox(500, 0.3, 500, 0x444444, 0, 0, 0);
        // Pavement areas
        makebox(500, 0.31, 60, 0x888888, 0, 0, 0);
    }

    function init(sceneRef) {
        scene = sceneRef;
        buildground();
        buildhighstreet();
        buildbricklane();
        buildtrewmanbrewery();
        buildcolumbiaroad();
        buildhackneyempire();
        buildvictoriapark();
        buildbarbican();
        buildhoxtons();
        buildbethnalgreen();
        buildspitalfields();
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
        scene = null;
    }

    return { init: init, update: update, reset: reset };
}());
