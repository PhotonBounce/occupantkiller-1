window.ColomboLotus = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 24480;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function makeMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + (x || 0), BASE_Y + (y || 0), BASE_Z + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        if (sx !== undefined) mesh.scale.set(sx, sy !== undefined ? sy : 1, sz !== undefined ? sz : 1);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildLotusTower() {
        // Concrete shaft — tall cylinder
        makeMesh(new THREE.CylinderGeometry(8, 12, 280, 12), 0xB0A898, 0, 140, -300);
        // Upper shaft narrower
        makeMesh(new THREE.CylinderGeometry(6, 8, 80, 12), 0xA8A098, 0, 320, -300);
        // Observation deck — flat wide disc represented as short fat cylinder
        makeMesh(new THREE.CylinderGeometry(22, 22, 8, 16), 0x888880, 0, 365, -300);
        // Observation deck rim
        makeMesh(new THREE.CylinderGeometry(24, 22, 4, 16), 0x777770, 0, 370, -300);
        // Lotus bud base bulge
        makeMesh(new THREE.SphereGeometry(18, 12, 8), 0xFF6633, 0, 385, -300);
        // Lotus petal layer 1 — 8 cone petals radiating outward, offset positions
        makeMesh(new THREE.ConeGeometry(7, 30, 6), 0xFF4422, 0, 400, -300);
        makeMesh(new THREE.ConeGeometry(6, 26, 6), 0xFF6644, 20, 396, -288);
        makeMesh(new THREE.ConeGeometry(6, 26, 6), 0xFF6644, -20, 396, -288);
        makeMesh(new THREE.ConeGeometry(6, 26, 6), 0xFF5533, 20, 396, -312);
        makeMesh(new THREE.ConeGeometry(6, 26, 6), 0xFF5533, -20, 396, -312);
        // Lotus petal layer 2 — wider spread petals
        makeMesh(new THREE.ConeGeometry(8, 22, 6), 0xFF8855, 28, 382, -300);
        makeMesh(new THREE.ConeGeometry(8, 22, 6), 0xFF8855, -28, 382, -300);
        makeMesh(new THREE.ConeGeometry(8, 22, 6), 0xFF7744, 0, 382, -272);
        makeMesh(new THREE.ConeGeometry(8, 22, 6), 0xFF7744, 0, 382, -328);
        // Lotus petal layer 3 — outermost petals opening
        makeMesh(new THREE.ConeGeometry(9, 18, 6), 0xFFAA77, 36, 368, -300);
        makeMesh(new THREE.ConeGeometry(9, 18, 6), 0xFFAA77, -36, 368, -300);
        makeMesh(new THREE.ConeGeometry(9, 18, 6), 0xFF9966, 0, 368, -264);
        makeMesh(new THREE.ConeGeometry(9, 18, 6), 0xFF9966, 0, 368, -336);
        makeMesh(new THREE.ConeGeometry(9, 18, 6), 0xFFBB88, 26, 368, -274);
        makeMesh(new THREE.ConeGeometry(9, 18, 6), 0xFFBB88, -26, 368, -274);
        makeMesh(new THREE.ConeGeometry(9, 18, 6), 0xFFBB88, 26, 368, -326);
        makeMesh(new THREE.ConeGeometry(9, 18, 6), 0xFFBB88, -26, 368, -326);
        // Antenna spire
        makeMesh(new THREE.CylinderGeometry(1, 3, 50, 6), 0xCCCCCC, 0, 435, -300);
        // Base foundation
        makeMesh(new THREE.BoxGeometry(40, 10, 40), 0x888880, 0, 5, -300);
    }

    function buildGangaramayaTemple() {
        // Main temple hall — wide low building
        makeMesh(new THREE.BoxGeometry(60, 20, 40), 0xD4A850, 200, 10, 100);
        // Temple roof — layered stepped pyramidal cones
        makeMesh(new THREE.ConeGeometry(32, 16, 8), 0xBB8830, 200, 26, 100);
        makeMesh(new THREE.ConeGeometry(24, 14, 8), 0xCC9940, 200, 42, 100);
        makeMesh(new THREE.ConeGeometry(16, 12, 8), 0xDDAA50, 200, 56, 100);
        makeMesh(new THREE.CylinderGeometry(2, 4, 10, 6), 0xEEBB60, 200, 67, 100);
        // Spire finial
        makeMesh(new THREE.SphereGeometry(3, 8, 6), 0xFFCC44, 200, 78, 100);
        // Side shrine building
        makeMesh(new THREE.BoxGeometry(25, 15, 20), 0xC89840, 240, 7, 90);
        makeMesh(new THREE.ConeGeometry(14, 12, 8), 0xBB8830, 240, 21, 90);
        makeMesh(new THREE.ConeGeometry(8, 10, 8), 0xCC9940, 240, 33, 90);
        // Buddhist dagoba / stupa dome
        makeMesh(new THREE.SphereGeometry(18, 12, 8), 0xF0F0E8, 160, 18, 80);
        makeMesh(new THREE.CylinderGeometry(20, 22, 8, 12), 0xE8E8E0, 160, 4, 80);
        makeMesh(new THREE.CylinderGeometry(4, 8, 12, 8), 0xF0EEE0, 160, 30, 80);
        makeMesh(new THREE.CylinderGeometry(2, 4, 20, 6), 0xDDDDD8, 160, 46, 80);
        // Tall Buddha statue
        makeMesh(new THREE.CylinderGeometry(4, 6, 35, 8), 0xDAA848, 220, 27, 60);
        makeMesh(new THREE.SphereGeometry(7, 10, 8), 0xDAA848, 220, 48, 60);
        // Buddha head ushnisha
        makeMesh(new THREE.SphereGeometry(3, 8, 6), 0xC89838, 220, 56, 60);
        // Pedestal
        makeMesh(new THREE.BoxGeometry(20, 10, 20), 0xAA8830, 220, 5, 60);
        // Seema Malaka floating structure on Beira Lake — box on water
        makeMesh(new THREE.BoxGeometry(30, 6, 30), 0xD4A850, 280, 2, 50);
        makeMesh(new THREE.ConeGeometry(16, 14, 8), 0xBB8830, 280, 13, 50);
        makeMesh(new THREE.CylinderGeometry(2, 3, 10, 6), 0xCC9940, 280, 24, 50);
        // Pillars at temple entrance
        makeMesh(new THREE.CylinderGeometry(2, 2, 18, 8), 0xD4B860, 178, 9, 82);
        makeMesh(new THREE.CylinderGeometry(2, 2, 18, 8), 0xD4B860, 178, 9, 118);
        makeMesh(new THREE.CylinderGeometry(2, 2, 18, 8), 0xD4B860, 222, 9, 82);
        makeMesh(new THREE.CylinderGeometry(2, 2, 18, 8), 0xD4B860, 222, 9, 118);
    }

    function buildGalleFaceGreen() {
        // Wide flat esplanade ground — use thin BoxGeometry (no PlaneGeometry allowed)
        makeMesh(new THREE.BoxGeometry(300, 2, 120), 0x4CAF50, -100, -1, 300);
        // Paved walkway strip
        makeMesh(new THREE.BoxGeometry(300, 2, 20), 0xCCBB99, -100, 0, 260);
        // Seawall / promenade edge
        makeMesh(new THREE.BoxGeometry(300, 6, 8), 0x888880, -100, 3, 230);
        // Indian Ocean water surface — blue flat box
        makeMesh(new THREE.BoxGeometry(400, 2, 200), 0x1A5A9A, -100, -2, 130);
        // Ocean waves row 1
        makeMesh(new THREE.BoxGeometry(300, 3, 6), 0x4A8AC0, -100, 0, 180);
        makeMesh(new THREE.BoxGeometry(240, 3, 5), 0x5A9AD0, -80, 0, 155);
        makeMesh(new THREE.BoxGeometry(260, 3, 4), 0x6AAAE0, -90, 0, 135);
        // Food stall 1
        makeMesh(new THREE.BoxGeometry(10, 8, 8), 0xEECC88, -180, 4, 285);
        makeMesh(new THREE.BoxGeometry(12, 2, 10), 0xCC4422, -180, 9, 285);
        // Food stall 2
        makeMesh(new THREE.BoxGeometry(10, 8, 8), 0xEEDD99, -140, 4, 285);
        makeMesh(new THREE.BoxGeometry(12, 2, 10), 0x228844, -140, 9, 285);
        // Food stall 3
        makeMesh(new THREE.BoxGeometry(10, 8, 8), 0xFFDDAA, -60, 4, 285);
        makeMesh(new THREE.BoxGeometry(12, 2, 10), 0xBB3311, -60, 9, 285);
        // Kite flying area markers
        makeMesh(new THREE.CylinderGeometry(1, 1, 15, 6), 0xFFFFFF, -30, 7, 320);
        makeMesh(new THREE.ConeGeometry(2, 4, 6), 0xFF2222, -30, 17, 320);
        // Lighthouse / flagpole
        makeMesh(new THREE.CylinderGeometry(3, 5, 30, 8), 0xFFFFFF, -200, 15, 240);
        makeMesh(new THREE.ConeGeometry(5, 8, 8), 0xCC2222, -200, 34, 240);
        // Park benches — boxes
        makeMesh(new THREE.BoxGeometry(8, 2, 3), 0x8B5E3C, -160, 1, 270);
        makeMesh(new THREE.BoxGeometry(8, 2, 3), 0x8B5E3C, -100, 1, 270);
        makeMesh(new THREE.BoxGeometry(8, 2, 3), 0x8B5E3C, -40, 1, 270);
    }

    function buildColomboPalace() {
        // World Trade Center Tower A
        makeMesh(new THREE.BoxGeometry(28, 200, 28), 0xAAAAAA, -80, 100, -80);
        makeMesh(new THREE.BoxGeometry(20, 30, 20), 0x999999, -80, 215, -80);
        makeMesh(new THREE.ConeGeometry(8, 20, 4), 0x888888, -80, 235, -80);
        // World Trade Center Tower B
        makeMesh(new THREE.BoxGeometry(28, 190, 28), 0xAAAAAA, -40, 95, -80);
        makeMesh(new THREE.BoxGeometry(20, 28, 20), 0x999999, -40, 204, -80);
        makeMesh(new THREE.ConeGeometry(8, 18, 4), 0x888888, -40, 223, -80);
        // Bank of Ceylon Tower
        makeMesh(new THREE.BoxGeometry(24, 150, 24), 0x777788, -120, 75, -60);
        makeMesh(new THREE.BoxGeometry(16, 20, 16), 0x666677, -120, 160, -60);
        // Colonial building block 1
        makeMesh(new THREE.BoxGeometry(40, 25, 30), 0xBBB0A0, -160, 12, -90);
        makeMesh(new THREE.BoxGeometry(44, 4, 34), 0xAAA090, -160, 27, -90);
        // Colonial building block 2
        makeMesh(new THREE.BoxGeometry(35, 20, 25), 0xC0B5A5, -200, 10, -90);
        makeMesh(new THREE.BoxGeometry(39, 4, 29), 0xB0A595, -200, 22, -90);
        // Fort clock tower
        makeMesh(new THREE.CylinderGeometry(5, 6, 40, 8), 0xCCBBB0, -170, 20, -120);
        makeMesh(new THREE.SphereGeometry(6, 8, 6), 0xBBAA9F, -170, 41, -120);
    }

    function buildBiraLake() {
        // Lake water body
        makeMesh(new THREE.BoxGeometry(180, 2, 120), 0x2A5A8A, 300, -2, -50);
        // Rowing club building on shore
        makeMesh(new THREE.BoxGeometry(30, 12, 20), 0xC8B898, 320, 6, -110);
        makeMesh(new THREE.BoxGeometry(34, 4, 24), 0xBBAA88, 320, 14, -110);
        // Pedestrian bridge
        makeMesh(new THREE.BoxGeometry(60, 3, 6), 0xBBBBBB, 290, 2, -50);
        // Bridge support pillars
        makeMesh(new THREE.CylinderGeometry(2, 2, 8, 6), 0xAAAAAA, 268, -2, -50);
        makeMesh(new THREE.CylinderGeometry(2, 2, 8, 6), 0xAAAAAA, 312, -2, -50);
        // Rowing boats — elongated boxes
        makeMesh(new THREE.BoxGeometry(16, 2, 4), 0xCC4422, 310, 0, -20);
        makeMesh(new THREE.BoxGeometry(16, 2, 4), 0x2244CC, 295, 0, -30);
    }

    function buildViharamahedeviPark() {
        // Park ground
        makeMesh(new THREE.BoxGeometry(200, 2, 160), 0x4A8A3A, -300, -1, 100);
        // Large golden Buddha statue
        makeMesh(new THREE.CylinderGeometry(5, 8, 40, 10), 0xFFCC00, -300, 20, 120);
        makeMesh(new THREE.SphereGeometry(10, 10, 8), 0xFFCC00, -300, 45, 120);
        makeMesh(new THREE.SphereGeometry(4, 8, 6), 0xFFAA00, -300, 56, 120);
        // Pedestal
        makeMesh(new THREE.BoxGeometry(22, 12, 22), 0xEEEECC, -300, 6, 120);
        // Bandstand — cylindrical pavilion
        makeMesh(new THREE.CylinderGeometry(16, 16, 3, 12), 0xDDCCBB, -260, 1, 80);
        makeMesh(new THREE.ConeGeometry(18, 12, 12), 0xCC8833, -260, 12, 80);
        // Trees represented as sphere on cylinder
        makeMesh(new THREE.CylinderGeometry(1, 2, 12, 6), 0x5A3A1A, -320, 6, 80);
        makeMesh(new THREE.SphereGeometry(8, 8, 6), 0x2A6A1A, -320, 18, 80);
        makeMesh(new THREE.CylinderGeometry(1, 2, 12, 6), 0x5A3A1A, -280, 6, 80);
        makeMesh(new THREE.SphereGeometry(8, 8, 6), 0x3A7A2A, -280, 18, 80);
        makeMesh(new THREE.CylinderGeometry(1, 2, 10, 6), 0x5A3A1A, -330, 6, 150);
        makeMesh(new THREE.SphereGeometry(7, 8, 6), 0x2A6A1A, -330, 16, 150);
        // Fountain — sphere
        makeMesh(new THREE.SphereGeometry(4, 8, 6), 0x88BBDD, -300, 4, 80);
        makeMesh(new THREE.CylinderGeometry(8, 8, 2, 12), 0xCCCCBB, -300, 1, 80);
    }

    function buildOldDutchHospital() {
        // Main restored colonial building
        makeMesh(new THREE.BoxGeometry(80, 16, 40), 0xD4C8B0, -250, 8, -150);
        // Arcaded verandah roof
        makeMesh(new THREE.BoxGeometry(84, 3, 44), 0xC4B8A0, -250, 17, -150);
        // Interior courtyard suggestion
        makeMesh(new THREE.BoxGeometry(40, 1, 20), 0xB8A888, -250, 0, -150);
        // Entrance archway pillars
        makeMesh(new THREE.CylinderGeometry(2, 2, 16, 8), 0xCCBCAA, -230, 8, -130);
        makeMesh(new THREE.CylinderGeometry(2, 2, 16, 8), 0xCCBCAA, -270, 8, -130);
        // Roof ridge
        makeMesh(new THREE.BoxGeometry(82, 4, 6), 0xB8AA90, -250, 20, -150);
    }

    function buildPettahBazaar() {
        // Market district ground level density
        makeMesh(new THREE.BoxGeometry(200, 14, 120), 0xC8A870, -400, 7, -200);
        // Hindu gopuram tower 1
        makeMesh(new THREE.BoxGeometry(14, 50, 14), 0xCC9955, -380, 25, -190);
        makeMesh(new THREE.ConeGeometry(8, 18, 4), 0xBB8844, -380, 59, -190);
        makeMesh(new THREE.BoxGeometry(12, 8, 12), 0xDD9944, -380, 54, -190);
        // Gopuram tiers
        makeMesh(new THREE.BoxGeometry(10, 6, 10), 0xCC8833, -380, 48, -190);
        makeMesh(new THREE.BoxGeometry(8, 6, 8), 0xBB7722, -380, 42, -190);
        // Hindu gopuram tower 2
        makeMesh(new THREE.BoxGeometry(12, 40, 12), 0xCC9955, -440, 20, -210);
        makeMesh(new THREE.ConeGeometry(7, 14, 4), 0xBB8844, -440, 47, -210);
        // Mosque minaret
        makeMesh(new THREE.CylinderGeometry(3, 4, 45, 8), 0xEEEEDD, -420, 22, -220);
        makeMesh(new THREE.SphereGeometry(5, 8, 6), 0xDDCC88, -420, 47, -220);
        makeMesh(new THREE.ConeGeometry(3, 8, 8), 0xCCBB77, -420, 53, -220);
        // Wholesale market sheds
        makeMesh(new THREE.BoxGeometry(50, 10, 30), 0xBB9960, -350, 5, -240);
        makeMesh(new THREE.BoxGeometry(50, 3, 32), 0xAA8850, -350, 12, -240);
        makeMesh(new THREE.BoxGeometry(50, 10, 30), 0xCC9960, -470, 5, -190);
    }

    function buildRacecourse() {
        // Racetrack oval ground — represented with a large flat box
        makeMesh(new THREE.BoxGeometry(220, 2, 160), 0x5A8A3A, 450, -1, 200);
        // Inner turf
        makeMesh(new THREE.BoxGeometry(140, 2, 90), 0x6A9A4A, 450, 0, 200);
        // Colonial grandstand main building
        makeMesh(new THREE.BoxGeometry(120, 20, 25), 0xCCBBAA, 450, 10, 280);
        // Grandstand seating rake
        makeMesh(new THREE.BoxGeometry(118, 10, 20), 0xDDCCBB, 450, 26, 273);
        // Grandstand roof
        makeMesh(new THREE.BoxGeometry(124, 4, 28), 0xBBAA99, 450, 32, 280);
        // Entrance towers at each end
        makeMesh(new THREE.BoxGeometry(16, 28, 20), 0xCCBBAA, 340, 14, 280);
        makeMesh(new THREE.ConeGeometry(10, 10, 4), 0xBBAA99, 340, 33, 280);
        makeMesh(new THREE.BoxGeometry(16, 28, 20), 0xCCBBAA, 560, 14, 280);
        makeMesh(new THREE.ConeGeometry(10, 10, 4), 0xBBAA99, 560, 33, 280);
        // Racetrack rail suggestion
        makeMesh(new THREE.BoxGeometry(220, 2, 4), 0xFFFFFF, 450, 1, 130);
    }

    function buildIndependenceHall() {
        // Main open-sided pavilion — platform
        makeMesh(new THREE.BoxGeometry(70, 8, 50), 0xD4C8A0, 150, 4, -200);
        // Roof — wide low pitched
        makeMesh(new THREE.BoxGeometry(74, 6, 54), 0xC8BC94, 150, 14, -200);
        // Interior elevated stage area
        makeMesh(new THREE.BoxGeometry(40, 4, 30), 0xE0D4B0, 150, 10, -200);
        // Ornamental columns — 6 across front
        makeMesh(new THREE.CylinderGeometry(2, 2, 14, 8), 0xDDD0A8, 120, 7, -178);
        makeMesh(new THREE.CylinderGeometry(2, 2, 14, 8), 0xDDD0A8, 136, 7, -178);
        makeMesh(new THREE.CylinderGeometry(2, 2, 14, 8), 0xDDD0A8, 150, 7, -178);
        makeMesh(new THREE.CylinderGeometry(2, 2, 14, 8), 0xDDD0A8, 164, 7, -178);
        makeMesh(new THREE.CylinderGeometry(2, 2, 14, 8), 0xDDD0A8, 180, 7, -178);
        // Side columns
        makeMesh(new THREE.CylinderGeometry(2, 2, 14, 8), 0xDDD0A8, 120, 7, -222);
        makeMesh(new THREE.CylinderGeometry(2, 2, 14, 8), 0xDDD0A8, 180, 7, -222);
        // Lion emblem pedestal
        makeMesh(new THREE.BoxGeometry(10, 10, 10), 0xD4C09A, 150, 19, -200);
        // Lion body representation
        makeMesh(new THREE.BoxGeometry(6, 8, 12), 0xC8A848, 150, 28, -200);
        makeMesh(new THREE.SphereGeometry(5, 8, 6), 0xC8A848, 150, 38, -200);
        // Approach steps
        makeMesh(new THREE.BoxGeometry(40, 4, 10), 0xCCC0A0, 150, 2, -174);
        makeMesh(new THREE.BoxGeometry(50, 2, 10), 0xBBB090, 150, 0, -164);
        // Flagpoles
        makeMesh(new THREE.CylinderGeometry(1, 1, 25, 6), 0xAAAAAA, 130, 12, -205);
        makeMesh(new THREE.CylinderGeometry(1, 1, 25, 6), 0xAAAAAA, 170, 12, -205);
        // Sri Lanka flag colors as small boxes atop poles
        makeMesh(new THREE.BoxGeometry(8, 5, 1), 0xBB7722, 130, 26, -205);
        makeMesh(new THREE.BoxGeometry(8, 5, 1), 0xBB7722, 170, 26, -205);
    }

    function build() {
        buildLotusTower();
        buildGangaramayaTemple();
        buildGalleFaceGreen();
        buildColomboPalace();
        buildBiraLake();
        buildViharamahedeviPark();
        buildOldDutchHospital();
        buildPettahBazaar();
        buildRacecourse();
        buildIndependenceHall();

        // Ambient sky dome — very large sphere inverted
        makeMesh(new THREE.SphereGeometry(2000, 12, 8), 0x87CEEB, 0, 0, 0);

        // Ground plane base — large thin box
        makeMesh(new THREE.BoxGeometry(2000, 4, 2000), 0x888870, 0, -3, 0);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) {
        // reserved for future animation
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
