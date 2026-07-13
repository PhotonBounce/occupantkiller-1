window.YerevanCascade = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 23720;
    var CY = 0;
    var CZ = 0;

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function sph(r, wSegs, hSegs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, wSegs, hSegs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function buildCascade() {
        // Main limestone base platform
        box(160, 4, 80, 0xF0EDE8, -200, 2, 0);

        // Terrace level 1 (widest, lowest)
        box(140, 8, 70, 0xF0EDE8, -200, 6, 0);

        // Terrace level 2
        box(118, 8, 58, 0xECE8E2, -200, 14, 0);

        // Terrace level 3
        box(96, 8, 46, 0xEAE6DF, -200, 22, 0);

        // Terrace level 4
        box(74, 8, 34, 0xE8E4DD, -200, 30, 0);

        // Terrace level 5 (topmost)
        box(52, 8, 22, 0xE6E2DA, -200, 38, 0);

        // Top crown monument platform
        box(36, 6, 16, 0xF0EDE8, -200, 44, 0);

        // Cascade monument crown arch left pillar
        box(4, 20, 4, 0xF0EDE8, -218, 50, 0);

        // Cascade monument crown arch right pillar
        box(4, 20, 4, 0xF0EDE8, -182, 50, 0);

        // Cascade monument crown arch top beam
        box(40, 4, 4, 0xF0EDE8, -200, 61, 0);

        // Central stair column left
        box(6, 48, 6, 0xDCDAD5, -210, 28, 0);

        // Central stair column right
        box(6, 48, 6, 0xDCDAD5, -190, 28, 0);

        // Fountain pool level 1 — outer ring
        cyl(18, 18, 1.5, 12, 0x5B8FA8, -200, 11, 0);

        // Fountain pool level 2
        cyl(14, 14, 1.5, 12, 0x5B8FA8, -200, 19, 0);

        // Fountain pool level 3
        cyl(10, 10, 1.5, 12, 0x5B8FA8, -200, 27, 0);

        // Fountain water jet l1
        cyl(0.4, 0.4, 5, 6, 0xAADDFF, -200, 15, 0);

        // Fountain water jet l2
        cyl(0.4, 0.4, 4, 6, 0xAADDFF, -200, 23, 0);

        // Botero Fat Cat sculpture — sphere body
        sph(4, 10, 8, 0xB8A898, -200, 15, 28);

        // Botero Fat Cat head
        sph(2.2, 8, 6, 0xB8A898, -200, 20, 28);

        // Botero Woman sculpture — body
        sph(3.5, 10, 8, 0xCCBBAA, -200, 13, -26);

        // Botero Woman head
        sph(1.8, 8, 6, 0xCCBBAA, -200, 18, -26);

        // Escalator housing left exterior box
        box(8, 50, 6, 0xE0DDD7, -218, 30, 8);

        // Escalator housing right exterior box
        box(8, 50, 6, 0xE0DDD7, -182, 30, 8);

        // Cascade garden left flank wall
        box(160, 3, 4, 0xD8D5CF, -200, 5, 38);

        // Cascade garden right flank wall
        box(160, 3, 4, 0xD8D5CF, -200, 5, -38);

        // Decorative obelisk top of cascade
        cone(2, 16, 4, 0xE0DDD8, -200, 57, 0);
    }

    function buildRepublicSquare() {
        // Main square paving
        box(200, 1, 180, 0xF5F0E8, 0, 0.5, 0);

        // Central Soviet fountain base outer
        cyl(28, 30, 3, 16, 0xE8E0D0, 0, 2, 0);

        // Central fountain middle tier
        cyl(18, 20, 3, 16, 0xEEE8D8, 0, 5.5, 0);

        // Central fountain top tier
        cyl(9, 10, 3, 16, 0xF2ECE0, 0, 9, 0);

        // Fountain central spire
        cyl(0.8, 1.2, 12, 8, 0xFFFFFF, 0, 15, 0);

        // Fountain water basin outer wall
        cyl(30, 30, 1, 20, 0x6688AA, 0, 1, 0);

        // Government House — main facade block
        box(120, 30, 22, 0xF5F0E8, 0, 16, 75);

        // Government House roof
        box(124, 4, 26, 0xEEE8D8, 0, 32, 75);

        // Government House left wing
        box(30, 22, 18, 0xF5F0E8, -65, 12, 72);

        // Government House right wing
        box(30, 22, 18, 0xF5F0E8, 65, 12, 72);

        // Government House columns — set of 8 front columns
        cyl(1.2, 1.2, 28, 8, 0xF8F4EE, -35, 15, 65);
        cyl(1.2, 1.2, 28, 8, 0xF8F4EE, -25, 15, 65);
        cyl(1.2, 1.2, 28, 8, 0xF8F4EE, -15, 15, 65);
        cyl(1.2, 1.2, 28, 8, 0xF8F4EE, -5, 15, 65);
        cyl(1.2, 1.2, 28, 8, 0xF8F4EE, 5, 15, 65);
        cyl(1.2, 1.2, 28, 8, 0xF8F4EE, 15, 15, 65);
        cyl(1.2, 1.2, 28, 8, 0xF8F4EE, 25, 15, 65);
        cyl(1.2, 1.2, 28, 8, 0xF8F4EE, 35, 15, 65);

        // History Museum building block
        box(80, 26, 20, 0xF0EBE0, 0, 14, -70);

        // History Museum portico columns
        cyl(1.0, 1.0, 24, 8, 0xF8F4EE, -20, 13, -62);
        cyl(1.0, 1.0, 24, 8, 0xF8F4EE, 0, 13, -62);
        cyl(1.0, 1.0, 24, 8, 0xF8F4EE, 20, 13, -62);

        // History Museum dome
        sph(14, 12, 8, 0xF0EBE0, 0, 34, -70);

        // Flagpoles
        cyl(0.3, 0.3, 22, 6, 0xAAAAAA, -80, 12, 0);
        cyl(0.3, 0.3, 22, 6, 0xAAAAAA, 80, 12, 0);

        // Square lamp posts left row
        cyl(0.4, 0.4, 10, 6, 0x888888, -60, 6, 20);
        cyl(0.4, 0.4, 10, 6, 0x888888, -60, 6, -20);
        cyl(0.4, 0.4, 10, 6, 0x888888, 60, 6, 20);
        cyl(0.4, 0.4, 10, 6, 0x888888, 60, 6, -20);
    }

    function buildAraratView() {
        // Greater Ararat main volcanic cone body
        cone(280, 680, 10, 0xDDDDCC, 900, 340, -120);

        // Greater Ararat snow cap
        cone(90, 160, 10, 0xFFFFFF, 900, 660, -120);

        // Lesser Ararat smaller cone
        cone(160, 420, 10, 0xCCCCBB, 1100, 210, 80);

        // Lesser Ararat snow cap
        cone(50, 80, 10, 0xFFFFFF, 1100, 410, 80);

        // Ararat foothills left
        cone(180, 120, 8, 0xBBBBAA, 800, 60, -200);

        // Ararat foothills right
        cone(160, 100, 8, 0xBBBBAA, 1050, 50, 180);

        // Distant mountain range background ridge
        box(600, 80, 30, 0xCCCCBB, 950, 40, -50);
    }

    function buildMotherArmenia() {
        // Pedestal/museum base — massive concrete block
        box(32, 51, 32, 0x888888, 120, 26, 80);

        // Pedestal museum entrance arch
        box(8, 10, 4, 0x777777, 120, 8, 64);

        // Statue figure torso
        box(8, 18, 6, 0x999999, 120, 80, 80);

        // Statue head sphere
        sph(3, 8, 6, 0xAAAAAA, 120, 90, 80);

        // Sword raised — vertical shaft
        box(1.5, 22, 1.5, 0xBBBBBB, 128, 96, 80);

        // Sword blade tip cone
        cone(1.2, 5, 4, 0xCCCCCC, 128, 109, 80);

        // Shield arm
        box(6, 1.5, 8, 0x999999, 116, 82, 80);

        // Pedestal museum side wing left
        box(10, 20, 32, 0x808080, 104, 11, 80);

        // Pedestal museum side wing right
        box(10, 20, 32, 0x808080, 136, 11, 80);
    }

    function buildGarniTemple() {
        // Temple platform/stylobate
        box(28, 3, 20, 0xD4C8A0, -380, 2, -180);

        // Temple cella main block
        box(18, 10, 12, 0xD0C49C, -380, 8, -180);

        // Temple pediment roof
        cone(12, 6, 4, 0xCEC29A, -380, 17, -180);

        // 24 Ionic columns around perimeter — front row
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -394, 7, -172);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -390, 7, -172);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -386, 7, -172);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -382, 7, -172);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -378, 7, -172);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -374, 7, -172);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -370, 7, -172);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -366, 7, -172);

        // Back row
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -394, 7, -188);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -390, 7, -188);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -386, 7, -188);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -382, 7, -188);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -378, 7, -188);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -374, 7, -188);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -370, 7, -188);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -366, 7, -188);

        // Side columns left flank
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -394, 7, -176);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -394, 7, -180);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -394, 7, -184);

        // Side columns right flank
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -366, 7, -176);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -366, 7, -180);
        cyl(0.7, 0.7, 10, 8, 0xDDD0A8, -366, 7, -184);

        // Cliff face beneath temple
        box(60, 40, 20, 0xA09060, -380, -19, -180);
    }

    function buildGeghardMonastery() {
        // Main church block carved into cliff
        box(24, 18, 20, 0xC8B880, -450, 10, 200);

        // Main church conical drum
        cyl(4, 5, 12, 8, 0xC4B47C, -450, 24, 200);

        // Main church pointed conical spire
        cone(4.5, 8, 8, 0xBCAE74, -450, 32, 200);

        // Gavit narthex — attached hall
        box(16, 12, 16, 0xC0AA78, -432, 7, 200);

        // Gavit roof
        box(18, 3, 18, 0xBCA870, -432, 14, 200);

        // Rock-cut cave chapel 1 entrance
        box(6, 8, 4, 0xA89860, -462, 5, 210);

        // Rock-cut cave chapel 2 entrance
        box(6, 8, 4, 0xA89860, -462, 5, 192);

        // Bell tower
        box(5, 14, 5, 0xC8B880, -446, 8, 216);

        // Bell tower conical top
        cone(3.5, 6, 8, 0xBCAE74, -446, 18, 216);

        // Cliff rock face backing
        box(80, 60, 18, 0x887755, -450, 30, 215);

        // Monastery outer wall
        box(50, 6, 3, 0xB8AA70, -440, 4, 183);
    }

    function buildYerevanOpera() {
        // Main oval building base
        box(80, 6, 60, 0xF0EDE8, 180, 4, -50);

        // Main hall oval body
        cyl(28, 30, 22, 16, 0xEEEAE4, 180, 14, -50);

        // Opera roof dome
        sph(30, 14, 8, 0xE8E4DE, 180, 30, -50);

        // Concert hall wing left block
        box(30, 18, 40, 0xF0EDE8, 140, 10, -50);

        // Concert hall wing right block
        box(30, 18, 40, 0xF0EDE8, 220, 10, -50);

        // Front portico columns — row of 6
        cyl(1.4, 1.4, 18, 8, 0xF8F5F0, 162, 10, -22);
        cyl(1.4, 1.4, 18, 8, 0xF8F5F0, 170, 10, -22);
        cyl(1.4, 1.4, 18, 8, 0xF8F5F0, 178, 10, -22);
        cyl(1.4, 1.4, 18, 8, 0xF8F5F0, 186, 10, -22);
        cyl(1.4, 1.4, 18, 8, 0xF8F5F0, 194, 10, -22);
        cyl(1.4, 1.4, 18, 8, 0xF8F5F0, 202, 10, -22);

        // Portico entablature
        box(50, 3, 4, 0xECE8E2, 182, 20, -22);

        // Opera square paving
        box(100, 1, 60, 0xDDD9D0, 180, 0.5, -30);
    }

    function buildVernissageMarket() {
        // Market ground area
        box(120, 1, 80, 0xBB9944, 300, 0.5, 100);

        // Stall row 1 — left side
        box(8, 5, 6, 0xCC8833, 270, 3.5, 90);
        box(8, 5, 6, 0xDD9944, 282, 3.5, 90);
        box(8, 5, 6, 0xBB7722, 294, 3.5, 90);
        box(8, 5, 6, 0xEEAA55, 306, 3.5, 90);
        box(8, 5, 6, 0xCC8833, 318, 3.5, 90);
        box(8, 5, 6, 0xDD9944, 330, 3.5, 90);
        box(8, 5, 6, 0xBB7722, 342, 3.5, 90);

        // Stall row 2 — right side
        box(8, 5, 6, 0xEEAA55, 270, 3.5, 108);
        box(8, 5, 6, 0xCC8833, 282, 3.5, 108);
        box(8, 5, 6, 0xDD9944, 294, 3.5, 108);
        box(8, 5, 6, 0xBB7722, 306, 3.5, 108);
        box(8, 5, 6, 0xEEAA55, 318, 3.5, 108);
        box(8, 5, 6, 0xCC8833, 330, 3.5, 108);

        // Carpet roll displays (cylinders)
        cyl(1.5, 1.5, 8, 8, 0x993322, 275, 5, 100);
        cyl(1.5, 1.5, 8, 8, 0x664411, 285, 5, 100);
        cyl(1.5, 1.5, 8, 8, 0x882233, 295, 5, 100);

        // Chess set display table
        box(4, 1, 4, 0x886633, 310, 4, 100);

        // Canopy poles
        cyl(0.3, 0.3, 7, 6, 0x886633, 266, 4, 86);
        cyl(0.3, 0.3, 7, 6, 0x886633, 278, 4, 86);
        cyl(0.3, 0.3, 7, 6, 0x886633, 290, 4, 86);
        cyl(0.3, 0.3, 7, 6, 0x886633, 302, 4, 86);
    }

    function buildHrazdanGorge() {
        // Left gorge wall
        box(400, 50, 20, 0x2A5A6A, 50, -24, -140);

        // Right gorge wall
        box(400, 50, 20, 0x2A5A6A, 50, -24, 140);

        // Gorge floor river bed
        box(400, 4, 80, 0x1A3A4A, 50, -48, 0);

        // River water surface
        box(396, 1, 70, 0x2A6A8A, 50, -46, 0);

        // Hrazdan gorge bridge left pylon
        box(8, 30, 8, 0x888880, 40, 0, -14);

        // Hrazdan gorge bridge right pylon
        box(8, 30, 8, 0x888880, 40, 0, 14);

        // Bridge deck span
        box(50, 2, 10, 0x999992, 40, 5, 0);

        // Gorge rock outcrops left
        box(20, 15, 12, 0x3A6A7A, 20, -18, -120);
        box(15, 10, 8, 0x2A5A6A, 60, -20, -130);

        // Gorge rock outcrops right
        box(20, 15, 12, 0x3A6A7A, 20, -18, 120);
        box(15, 10, 8, 0x2A5A6A, 60, -20, 130);
    }

    function buildNorthernAvenue() {
        // Boulevard paving main strip
        box(300, 1, 30, 0xD4D0C8, 380, 0.5, 0);

        // Left side mixed-use building block 1
        box(30, 22, 24, 0xD8D4CC, 240, 12, -28);

        // Left building 2
        box(30, 18, 24, 0xDDD9D1, 276, 10, -28);

        // Left building 3
        box(30, 24, 24, 0xD4D0C8, 312, 13, -28);

        // Right side buildings
        box(30, 20, 24, 0xDDD9D1, 240, 11, 28);
        box(30, 16, 24, 0xD8D4CC, 276, 9, 28);
        box(30, 22, 24, 0xD4D0C8, 312, 12, 28);

        // Pedestrian street lamps along avenue
        cyl(0.3, 0.3, 9, 6, 0x777770, 250, 5, 8);
        cyl(0.3, 0.3, 9, 6, 0x777770, 280, 5, 8);
        cyl(0.3, 0.3, 9, 6, 0x777770, 310, 5, 8);
        cyl(0.3, 0.3, 9, 6, 0x777770, 250, 5, -8);
        cyl(0.3, 0.3, 9, 6, 0x777770, 280, 5, -8);
        cyl(0.3, 0.3, 9, 6, 0x777770, 310, 5, -8);

        // Avenue end plaza circle
        cyl(20, 22, 1, 12, 0xCCCAC0, 420, 1, 0);

        // End plaza fountain small
        cyl(6, 7, 3, 12, 0x5A7A9A, 420, 3, 0);
    }

    function buildCityInfrastructure() {
        // City ground plane — large base box
        box(2400, 2, 1000, 0x887766, 200, -1, 0);

        // Ambient city block 1
        box(40, 14, 30, 0xCCB89A, -100, 8, -180);

        // Ambient city block 2
        box(35, 18, 28, 0xC8B496, -60, 10, -170);

        // Ambient street light near cascade
        cyl(0.4, 0.4, 12, 6, 0x888888, -170, 7, 50);
        cyl(0.4, 0.4, 12, 6, 0x888888, -170, 7, -50);

        // Yerevan pink tuff building block
        box(28, 12, 20, 0xE8907A, 80, 7, -200);

        // Another tuff building
        box(22, 16, 18, 0xDD8870, 110, 9, -195);

        // Victory Park hill platform
        box(80, 10, 60, 0x667755, 110, 6, 60);

        // Yerevan TV tower base
        cyl(5, 8, 30, 8, 0xCCCCCC, -140, 16, -200);

        // Yerevan TV tower mast
        cyl(1, 1.5, 40, 6, 0xBBBBBB, -140, 50, -200);
    }

    function build() {
        buildCascade();
        buildRepublicSquare();
        buildAraratView();
        buildMotherArmenia();
        buildGarniTemple();
        buildGeghardMonastery();
        buildYerevanOpera();
        buildVernissageMarket();
        buildHrazdanGorge();
        buildNorthernAvenue();
        buildCityInfrastructure();
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
