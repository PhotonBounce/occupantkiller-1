window.TauntonCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var X = 13840;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildCastleWallSegment(x, y, z, w, h, d, color) {
        addMesh(new THREE.BoxGeometry(w, h, d), color, x, y, z);
    }

    function buildTauntonCastle() {
        var stoneColor = 0x8b7355;
        var darkStoneColor = 0x6b5a3e;
        var roofColor = 0x4a3728;

        // Great Hall building
        addMesh(new THREE.BoxGeometry(30, 12, 18), stoneColor, X + 0, 6, -20);
        // Great Hall roof
        addMesh(new THREE.BoxGeometry(32, 3, 20), roofColor, X + 0, 13.5, -20);

        // Twin-towered gatehouse - left tower
        addMesh(new THREE.BoxGeometry(8, 18, 8), darkStoneColor, X - 14, 9, 10);
        addMesh(new THREE.CylinderGeometry(4.5, 4.5, 2, 8), darkStoneColor, X - 14, 19, 10);
        addMesh(new THREE.ConeGeometry(5, 5, 8), roofColor, X - 14, 23, 10);

        // Twin-towered gatehouse - right tower
        addMesh(new THREE.BoxGeometry(8, 18, 8), darkStoneColor, X + 14, 9, 10);
        addMesh(new THREE.CylinderGeometry(4.5, 4.5, 2, 8), darkStoneColor, X + 14, 19, 10);
        addMesh(new THREE.ConeGeometry(5, 5, 8), roofColor, X + 14, 23, 10);

        // Gatehouse connecting block
        addMesh(new THREE.BoxGeometry(20, 14, 8), darkStoneColor, X + 0, 7, 10);
        // Gate arch fill
        addMesh(new THREE.BoxGeometry(6, 6, 8), 0x3a3028, X + 0, 3, 10);

        // Curtain wall - north
        buildCastleWallSegment(X + 0, 5, 25, 40, 10, 2, stoneColor);
        // Curtain wall - south
        buildCastleWallSegment(X + 0, 5, -40, 50, 10, 2, stoneColor);
        // Curtain wall - east
        buildCastleWallSegment(X + 25, 5, -7, 2, 10, 65, stoneColor);
        // Curtain wall - west
        buildCastleWallSegment(X - 25, 5, -7, 2, 10, 65, stoneColor);

        // Corner turrets
        addMesh(new THREE.CylinderGeometry(3, 3, 14, 8), darkStoneColor, X + 25, 7, 25);
        addMesh(new THREE.ConeGeometry(3.5, 4, 8), roofColor, X + 25, 16, 25);
        addMesh(new THREE.CylinderGeometry(3, 3, 14, 8), darkStoneColor, X - 25, 7, 25);
        addMesh(new THREE.ConeGeometry(3.5, 4, 8), roofColor, X - 25, 16, 25);
        addMesh(new THREE.CylinderGeometry(3, 3, 14, 8), darkStoneColor, X + 25, 7, -40);
        addMesh(new THREE.ConeGeometry(3.5, 4, 8), roofColor, X + 25, 16, -40);
        addMesh(new THREE.CylinderGeometry(3, 3, 14, 8), darkStoneColor, X - 25, 7, -40);
        addMesh(new THREE.ConeGeometry(3.5, 4, 8), roofColor, X - 25, 16, -40);

        // Castle moat remnants - water channel segments
        addMesh(new THREE.BoxGeometry(60, 1, 5), 0x2a5a7a, X + 0, 0.5, 32);
        addMesh(new THREE.BoxGeometry(5, 1, 80), 0x2a5a7a, X + 32, 0.5, -7);

        // Inner ward ground
        addMesh(new THREE.BoxGeometry(48, 0.5, 62), 0x7a6a4a, X + 0, 0.25, -7);

        // Inner ward - side building
        addMesh(new THREE.BoxGeometry(10, 8, 20), stoneColor, X - 18, 4, -25);
        addMesh(new THREE.BoxGeometry(10, 2, 20), roofColor, X - 18, 9, -25);

        // Somerset County Museum wing (inside castle)
        addMesh(new THREE.BoxGeometry(22, 10, 14), 0x9a8060, X + 8, 5, -28);
        // Museum windows (gold exhibit suggestion)
        addMesh(new THREE.BoxGeometry(3, 3, 0.3), 0xd4af37, X + 2, 5, -21.1);
        addMesh(new THREE.BoxGeometry(3, 3, 0.3), 0xd4af37, X + 10, 5, -21.1);
        addMesh(new THREE.BoxGeometry(3, 3, 0.3), 0xd4af37, X + 18, 5, -21.1);
        // Roman mosaic floor panels visible through low windows
        addMesh(new THREE.BoxGeometry(8, 0.2, 6), 0xc8a870, X + 8, 0.2, -28);
    }

    function buildCricketGround() {
        var brickColor = 0x8b4513;
        var creamColor = 0xfff8dc;
        var greenColor = 0x2d5a1b;
        var whiteColor = 0xffffff;
        var slateColor = 0x4a4a5a;

        // Playing field
        addMesh(new THREE.BoxGeometry(120, 0.3, 110), greenColor, X + 0, 0.15, 160);

        // Cricket pitch markings (light strip)
        addMesh(new THREE.BoxGeometry(3, 0.4, 20), 0xd4c89a, X + 0, 0.4, 160);

        // Crease lines
        addMesh(new THREE.BoxGeometry(4, 0.5, 0.3), whiteColor, X + 0, 0.5, 153);
        addMesh(new THREE.BoxGeometry(4, 0.5, 0.3), whiteColor, X + 0, 0.5, 167);

        // Boundary rope suggestion
        addMesh(new THREE.CylinderGeometry(55, 55, 0.3, 32), 0x1a4a0a, X + 0, 0.35, 160);

        // Victorian pavilion - main body
        addMesh(new THREE.BoxGeometry(36, 10, 12), creamColor, X + 0, 5, 215);
        // Pavilion upper floor
        addMesh(new THREE.BoxGeometry(36, 5, 12), creamColor, X + 0, 12.5, 215);
        // Pavilion roof
        addMesh(new THREE.BoxGeometry(38, 2, 14), slateColor, X + 0, 16, 215);

        // Pavilion left turret
        addMesh(new THREE.CylinderGeometry(4, 4, 18, 8), brickColor, X - 20, 9, 215);
        addMesh(new THREE.ConeGeometry(4.5, 6, 8), slateColor, X - 20, 21, 215);
        // Pavilion right turret
        addMesh(new THREE.CylinderGeometry(4, 4, 18, 8), brickColor, X + 20, 9, 215);
        addMesh(new THREE.ConeGeometry(4.5, 6, 8), slateColor, X + 20, 21, 215);

        // Pavilion veranda posts
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), whiteColor, X - 14, 2, 209);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), whiteColor, X - 7, 2, 209);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), whiteColor, X + 0, 2, 209);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), whiteColor, X + 7, 2, 209);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), whiteColor, X + 14, 2, 209);

        // Main grandstand - west side
        addMesh(new THREE.BoxGeometry(12, 8, 60), brickColor, X - 62, 4, 160);
        addMesh(new THREE.BoxGeometry(12, 1, 60), slateColor, X - 62, 8.5, 160);
        // Grandstand seating tiers
        addMesh(new THREE.BoxGeometry(10, 3, 58), 0x2244aa, X - 61, 2.5, 160);

        // Scoreboard
        addMesh(new THREE.BoxGeometry(14, 12, 2), 0x1a1a1a, X + 55, 6, 130);
        addMesh(new THREE.BoxGeometry(12, 10, 0.5), 0x0a0a0a, X + 55, 6, 131);
        // Score digits suggestion
        addMesh(new THREE.BoxGeometry(3, 4, 0.5), 0xffff00, X + 51, 7, 131.3);
        addMesh(new THREE.BoxGeometry(3, 4, 0.5), 0xffff00, X + 55, 7, 131.3);
        addMesh(new THREE.BoxGeometry(3, 4, 0.5), 0xffff00, X + 59, 7, 131.3);
        // Scoreboard structure
        addMesh(new THREE.BoxGeometry(16, 2, 2), slateColor, X + 55, 13, 130);

        // Terraced seating - north end
        addMesh(new THREE.BoxGeometry(80, 4, 8), 0x5a5a6a, X + 0, 2, 112);
        addMesh(new THREE.BoxGeometry(80, 4, 8), 0x5a5a6a, X + 0, 4, 108);
        addMesh(new THREE.BoxGeometry(80, 4, 8), 0x5a5a6a, X + 0, 6, 104);

        // Terraced seating - east end
        addMesh(new THREE.BoxGeometry(8, 4, 60), 0x5a5a6a, X + 68, 2, 160);
        addMesh(new THREE.BoxGeometry(8, 4, 60), 0x5a5a6a, X + 72, 4, 160);
    }

    function buildStMaryMagdaleneChurch() {
        var stoneColor = 0x9a8a6a;
        var darkStone = 0x7a6a50;
        var roofColor = 0x4a4030;
        var glasColor = 0x8ab4d4;

        // Main nave
        addMesh(new THREE.BoxGeometry(18, 14, 40), stoneColor, X - 100, 7, 40);
        // Nave clerestory
        addMesh(new THREE.BoxGeometry(14, 4, 38), darkStone, X - 100, 16, 40);
        // Nave roof
        addMesh(new THREE.BoxGeometry(20, 4, 42), roofColor, X - 100, 20, 40);

        // North aisle
        addMesh(new THREE.BoxGeometry(8, 10, 38), stoneColor, X - 91, 5, 40);
        addMesh(new THREE.BoxGeometry(8, 2, 38), roofColor, X - 91, 11, 40);
        // South aisle
        addMesh(new THREE.BoxGeometry(8, 10, 38), stoneColor, X - 109, 5, 40);
        addMesh(new THREE.BoxGeometry(8, 2, 38), roofColor, X - 109, 11, 40);

        // Chancel
        addMesh(new THREE.BoxGeometry(14, 12, 18), stoneColor, X - 100, 6, 64);
        addMesh(new THREE.BoxGeometry(16, 3, 20), roofColor, X - 100, 13.5, 64);

        // Perpendicular tower - this is one of the finest Somerset towers
        // Tower base
        addMesh(new THREE.BoxGeometry(14, 10, 14), darkStone, X - 100, 5, 16);
        // Tower mid section
        addMesh(new THREE.BoxGeometry(13, 12, 13), darkStone, X - 100, 16, 16);
        // Tower upper section with decorative panels
        addMesh(new THREE.BoxGeometry(12, 14, 12), stoneColor, X - 100, 29, 16);
        // Tower battlements
        addMesh(new THREE.BoxGeometry(14, 3, 14), darkStone, X - 100, 37.5, 16);

        // Decorative panel strips on tower (Perpendicular style)
        addMesh(new THREE.BoxGeometry(0.5, 12, 1), 0xb8a880, X - 94, 29, 10);
        addMesh(new THREE.BoxGeometry(0.5, 12, 1), 0xb8a880, X - 94, 29, 22);
        addMesh(new THREE.BoxGeometry(0.5, 12, 1), 0xb8a880, X - 106, 29, 10);
        addMesh(new THREE.BoxGeometry(0.5, 12, 1), 0xb8a880, X - 106, 29, 22);

        // Tower corner buttresses
        addMesh(new THREE.BoxGeometry(2, 36, 2), darkStone, X - 93, 18, 9);
        addMesh(new THREE.BoxGeometry(2, 36, 2), darkStone, X - 107, 18, 9);
        addMesh(new THREE.BoxGeometry(2, 36, 2), darkStone, X - 93, 18, 23);
        addMesh(new THREE.BoxGeometry(2, 36, 2), darkStone, X - 107, 18, 23);

        // West front
        addMesh(new THREE.BoxGeometry(18, 14, 1), stoneColor, X - 100, 7, 20);
        // Great west window
        addMesh(new THREE.BoxGeometry(8, 10, 0.5), glasColor, X - 100, 8, 20.3);

        // Clerestory windows
        addMesh(new THREE.BoxGeometry(3, 3, 0.3), glasColor, X - 100, 16, 21.1);
        addMesh(new THREE.BoxGeometry(3, 3, 0.3), glasColor, X - 100, 16, 30);
        addMesh(new THREE.BoxGeometry(3, 3, 0.3), glasColor, X - 100, 16, 39);
        addMesh(new THREE.BoxGeometry(3, 3, 0.3), glasColor, X - 100, 16, 48);

        // Churchyard wall
        addMesh(new THREE.BoxGeometry(50, 2, 1), stoneColor, X - 100, 1, 4);
        addMesh(new THREE.BoxGeometry(1, 2, 80), stoneColor, X - 125, 1, 44);
        addMesh(new THREE.BoxGeometry(1, 2, 80), stoneColor, X - 75, 1, 44);
    }

    function buildVivaryPark() {
        var grassColor = 0x3a7a2a;
        var stoneColor = 0x8a8a7a;
        var waterColor = 0x2a6a9a;
        var ironColor = 0x2a3a2a;

        // Park ground
        addMesh(new THREE.BoxGeometry(100, 0.3, 80), grassColor, X - 180, 0.15, 100);

        // Ornamental fountain base
        addMesh(new THREE.CylinderGeometry(8, 9, 1, 16), stoneColor, X - 180, 0.5, 100);
        // Fountain basin water
        addMesh(new THREE.CylinderGeometry(7, 7, 0.5, 16), waterColor, X - 180, 0.75, 100);
        // Fountain stem
        addMesh(new THREE.CylinderGeometry(0.8, 1, 5, 8), stoneColor, X - 180, 3.5, 100);
        // Fountain upper bowl
        addMesh(new THREE.CylinderGeometry(3, 3, 0.5, 12), stoneColor, X - 180, 6.5, 100);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 0.3, 12), waterColor, X - 180, 6.75, 100);
        // Fountain top
        addMesh(new THREE.SphereGeometry(0.6, 8, 8), stoneColor, X - 180, 7.5, 100);

        // Bandstand
        addMesh(new THREE.CylinderGeometry(7, 7, 0.5, 8), stoneColor, X - 180, 0.5, 130);
        // Bandstand posts
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), ironColor, X - 173, 3, 130);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), ironColor, X - 187, 3, 130);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), ironColor, X - 180, 3, 123);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), ironColor, X - 180, 3, 137);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), ironColor, X - 175, 3, 125);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), ironColor, X - 185, 3, 125);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), ironColor, X - 175, 3, 135);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), ironColor, X - 185, 3, 135);
        // Bandstand roof
        addMesh(new THREE.ConeGeometry(8, 4, 8), ironColor, X - 180, 8, 130);

        // Flower garden beds
        addMesh(new THREE.BoxGeometry(12, 0.4, 6), 0xff6688, X - 165, 0.2, 100);
        addMesh(new THREE.BoxGeometry(12, 0.4, 6), 0xffaa22, X - 165, 0.2, 110);
        addMesh(new THREE.BoxGeometry(12, 0.4, 6), 0xcc44aa, X - 195, 0.2, 100);
        addMesh(new THREE.BoxGeometry(12, 0.4, 6), 0xff2244, X - 195, 0.2, 110);

        // War memorial - stone plinth
        addMesh(new THREE.BoxGeometry(4, 1, 4), stoneColor, X - 165, 0.5, 130);
        addMesh(new THREE.BoxGeometry(3, 1, 3), stoneColor, X - 165, 1.5, 130);
        addMesh(new THREE.BoxGeometry(2, 8, 2), stoneColor, X - 165, 6, 130);
        // Memorial cross
        addMesh(new THREE.BoxGeometry(0.5, 3, 0.5), stoneColor, X - 165, 11.5, 130);
        addMesh(new THREE.BoxGeometry(2, 0.5, 0.5), stoneColor, X - 165, 11.5, 130);

        // Park paths
        addMesh(new THREE.BoxGeometry(3, 0.4, 60), 0xc8b89a, X - 172, 0.2, 105);
        addMesh(new THREE.BoxGeometry(60, 0.4, 3), 0xc8b89a, X - 180, 0.2, 116);

        // Park trees
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 5, 6), 0x4a2a0a, X - 160, 2.5, 80);
        addMesh(new THREE.SphereGeometry(3.5, 8, 6), 0x2a5a1a, X - 160, 8, 80);
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 5, 6), 0x4a2a0a, X - 200, 2.5, 80);
        addMesh(new THREE.SphereGeometry(3.5, 8, 6), 0x2a5a1a, X - 200, 8, 80);
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 5, 6), 0x4a2a0a, X - 160, 2.5, 125);
        addMesh(new THREE.SphereGeometry(3.5, 8, 6), 0x2a5a1a, X - 160, 8, 125);
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 5, 6), 0x4a2a0a, X - 200, 2.5, 125);
        addMesh(new THREE.SphereGeometry(3.5, 8, 6), 0x2a5a1a, X - 200, 8, 125);
    }

    function buildTownCentre() {
        var brickColor = 0x8b4513;
        var concreteColor = 0x9a9a8a;
        var glassColor = 0x7ab4d4;
        var darkBrick = 0x6a3510;

        // East Street ground
        addMesh(new THREE.BoxGeometry(120, 0.3, 14), 0x6a6a6a, X + 80, 0.15, -80);

        // Debenhams building (now closed) - large retail block
        addMesh(new THREE.BoxGeometry(30, 18, 20), concreteColor, X + 60, 9, -90);
        // Debenhams facade panels
        addMesh(new THREE.BoxGeometry(28, 14, 0.5), 0xb0b0a0, X + 60, 8, -80.3);
        // Debenhams windows - ground floor
        addMesh(new THREE.BoxGeometry(6, 4, 0.3), glassColor, X + 48, 3, -80.5);
        addMesh(new THREE.BoxGeometry(6, 4, 0.3), glassColor, X + 56, 3, -80.5);
        addMesh(new THREE.BoxGeometry(6, 4, 0.3), glassColor, X + 64, 3, -80.5);
        addMesh(new THREE.BoxGeometry(6, 4, 0.3), glassColor, X + 72, 3, -80.5);
        // Debenhams windows - upper floor
        addMesh(new THREE.BoxGeometry(6, 4, 0.3), glassColor, X + 48, 9, -80.5);
        addMesh(new THREE.BoxGeometry(6, 4, 0.3), glassColor, X + 56, 9, -80.5);
        addMesh(new THREE.BoxGeometry(6, 4, 0.3), glassColor, X + 64, 9, -80.5);
        addMesh(new THREE.BoxGeometry(6, 4, 0.3), glassColor, X + 72, 9, -80.5);

        // County Hall - civic building
        addMesh(new THREE.BoxGeometry(40, 20, 18), concreteColor, X + 110, 10, -70);
        // County Hall portico
        addMesh(new THREE.BoxGeometry(20, 14, 4), 0xb0b0a0, X + 110, 7, -61);
        // County Hall portico columns
        addMesh(new THREE.CylinderGeometry(0.8, 1, 12, 8), 0xc0c0b0, X + 100, 6, -61);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 12, 8), 0xc0c0b0, X + 106, 6, -61);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 12, 8), 0xc0c0b0, X + 112, 6, -61);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 12, 8), 0xc0c0b0, X + 118, 6, -61);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 12, 8), 0xc0c0b0, X + 124, 6, -61);
        // County Hall pediment
        addMesh(new THREE.BoxGeometry(42, 4, 2), 0xb0b0a0, X + 110, 22, -70);
        // County Hall roof
        addMesh(new THREE.BoxGeometry(44, 3, 20), 0x5a5a5a, X + 110, 25, -70);

        // Riverside shopping centre
        addMesh(new THREE.BoxGeometry(50, 12, 25), 0xb0a898, X + 40, 6, -60);
        addMesh(new THREE.BoxGeometry(50, 2, 25), 0x7a7a7a, X + 40, 13, -60);
        // Riverside glass atrium
        addMesh(new THREE.BoxGeometry(20, 10, 20), glassColor, X + 40, 5, -60);

        // Town centre shops - varied heights
        addMesh(new THREE.BoxGeometry(10, 10, 8), brickColor, X + 30, 5, -85);
        addMesh(new THREE.BoxGeometry(10, 8, 8), darkBrick, X + 20, 4, -85);
        addMesh(new THREE.BoxGeometry(10, 12, 8), brickColor, X + 10, 6, -85);
        addMesh(new THREE.BoxGeometry(10, 9, 8), darkBrick, X + 0, 4.5, -85);
        addMesh(new THREE.BoxGeometry(10, 11, 8), brickColor, X - 10, 5.5, -85);
        addMesh(new THREE.BoxGeometry(10, 7, 8), darkBrick, X - 20, 3.5, -85);

        // Shop windows
        addMesh(new THREE.BoxGeometry(7, 4, 0.3), glassColor, X + 30, 3, -81.2);
        addMesh(new THREE.BoxGeometry(7, 4, 0.3), glassColor, X + 20, 3, -81.2);
        addMesh(new THREE.BoxGeometry(7, 4, 0.3), glassColor, X + 10, 3, -81.2);
        addMesh(new THREE.BoxGeometry(7, 4, 0.3), glassColor, X + 0, 3, -81.2);
        addMesh(new THREE.BoxGeometry(7, 4, 0.3), glassColor, X - 10, 3, -81.2);
        addMesh(new THREE.BoxGeometry(7, 4, 0.3), glassColor, X - 20, 3, -81.2);

        // Pavement
        addMesh(new THREE.BoxGeometry(120, 0.2, 5), 0x9a9a9a, X + 30, 0.1, -82);
    }

    function build() {
        buildTauntonCastle();
        buildCricketGround();
        buildStMaryMagdaleneChurch();
        buildVivaryPark();
        buildTownCentre();
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
