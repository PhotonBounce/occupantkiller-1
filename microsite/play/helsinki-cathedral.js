window.HelsinkiCathedral = (function() {
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

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 22920;
        var oz = 0;

        // =============================================
        // GROUND BASE — Senate Square plaza
        // =============================================
        // Main square ground
        makeMesh(new THREE.BoxGeometry(300, 1, 300), 0xD3D3D3, ox, -0.5, oz);

        // Cobblestone extensions
        makeMesh(new THREE.BoxGeometry(600, 0.8, 600), 0xB0B0B0, ox, -0.9, oz);

        // =============================================
        // BALTIC SEA
        // =============================================
        makeMesh(new THREE.BoxGeometry(2000, 1, 1200), 0x1A4A6A, ox, -2, oz + 800);

        // Baltic Sea ice patches (winter)
        makeMesh(new THREE.BoxGeometry(400, 0.5, 300), 0xE8F0FF, ox - 200, -1.5, oz + 900);
        makeMesh(new THREE.BoxGeometry(250, 0.5, 200), 0xE8F0FF, ox + 300, -1.5, oz + 1000);
        makeMesh(new THREE.BoxGeometry(180, 0.5, 150), 0xE8F0FF, ox - 100, -1.5, oz + 1100);

        // =============================================
        // HELSINKI CATHEDRAL — neoclassical white
        // =============================================
        // Wide steps base (bottom)
        makeMesh(new THREE.BoxGeometry(120, 3, 90), 0xEEEEDD, ox, 1.5, oz - 20);
        // Step tier 2
        makeMesh(new THREE.BoxGeometry(110, 2, 80), 0xF0F0E0, ox, 4, oz - 18);
        // Step tier 3
        makeMesh(new THREE.BoxGeometry(100, 2, 72), 0xF2F2E5, ox, 6, oz - 16);

        // Cathedral main body
        makeMesh(new THREE.BoxGeometry(90, 30, 60), 0xF5F5DC, ox, 23, oz - 5);

        // Cathedral portico (front columns base)
        makeMesh(new THREE.BoxGeometry(70, 5, 15), 0xF5F5DC, ox, 10, oz - 38);

        // Corinthian columns — front row (6 columns)
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox - 25, 22, oz - 38);
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox - 15, 22, oz - 38);
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox - 5,  22, oz - 38);
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox + 5,  22, oz - 38);
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox + 15, 22, oz - 38);
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox + 25, 22, oz - 38);

        // Pediment (triangular) above columns
        makeMesh(new THREE.BoxGeometry(70, 2, 10), 0xF5F5DC, ox, 37, oz - 38);
        // Pediment triangle shape using a box rotated
        makeMesh(new THREE.BoxGeometry(70, 12, 2), 0xF5F5DC, ox, 42, oz - 38);

        // Cathedral side columns (right)
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox + 45, 22, oz - 10);
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox + 45, 22, oz + 10);

        // Cathedral side columns (left)
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox - 45, 22, oz - 10);
        makeMesh(new THREE.CylinderGeometry(1.8, 2.2, 28, 8), 0xF5F5DC, ox - 45, 22, oz + 10);

        // Main dome drum
        makeMesh(new THREE.CylinderGeometry(18, 18, 10, 16), 0xF5F5DC, ox, 43, oz);
        // Main dome — green
        makeMesh(new THREE.SphereGeometry(20, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0x4A7C59, ox, 53, oz);
        // Dome lantern
        makeMesh(new THREE.CylinderGeometry(3, 4, 8, 12), 0xF5F5DC, ox, 72, oz);
        makeMesh(new THREE.SphereGeometry(3.5, 10, 8), 0x4A7C59, ox, 79, oz);
        // Cross on main dome
        makeMesh(new THREE.BoxGeometry(0.6, 8, 0.6), 0xCCAA00, ox, 84, oz);
        makeMesh(new THREE.BoxGeometry(5, 0.6, 0.6), 0xCCAA00, ox, 88, oz);

        // Four corner smaller domes
        makeMesh(new THREE.CylinderGeometry(6, 6, 6, 12), 0xF5F5DC, ox - 30, 39, oz - 20);
        makeMesh(new THREE.SphereGeometry(7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x4A7C59, ox - 30, 45, oz - 20);
        makeMesh(new THREE.CylinderGeometry(6, 6, 6, 12), 0xF5F5DC, ox + 30, 39, oz - 20);
        makeMesh(new THREE.SphereGeometry(7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x4A7C59, ox + 30, 45, oz - 20);
        makeMesh(new THREE.CylinderGeometry(6, 6, 6, 12), 0xF5F5DC, ox - 30, 39, oz + 20);
        makeMesh(new THREE.SphereGeometry(7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x4A7C59, ox + 30, 45, oz + 20);
        makeMesh(new THREE.CylinderGeometry(6, 6, 6, 12), 0xF5F5DC, ox + 30, 39, oz + 20);
        makeMesh(new THREE.SphereGeometry(7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x4A7C59, ox - 30, 45, oz + 20);

        // =============================================
        // SENATE SQUARE BUILDINGS
        // =============================================
        // Government Palace (right side of square)
        makeMesh(new THREE.BoxGeometry(100, 20, 40), 0xF0EAD6, ox + 160, 10, oz);
        // Government Palace roof
        makeMesh(new THREE.BoxGeometry(100, 5, 40), 0xE8E0C8, ox + 160, 22, oz);
        // Government Palace columns
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 18, 8), 0xF5F5F0, ox + 125, 12, oz - 5);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 18, 8), 0xF5F5F0, ox + 125, 12, oz + 5);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 18, 8), 0xF5F5F0, ox + 195, 12, oz - 5);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 18, 8), 0xF5F5F0, ox + 195, 12, oz + 5);

        // University of Helsinki (left side of square)
        makeMesh(new THREE.BoxGeometry(100, 20, 40), 0xF0EAD6, ox - 160, 10, oz);
        makeMesh(new THREE.BoxGeometry(100, 5, 40), 0xE8E0C8, ox - 160, 22, oz);
        // University columns
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 18, 8), 0xF5F5F0, ox - 125, 12, oz - 5);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 18, 8), 0xF5F5F0, ox - 125, 12, oz + 5);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 18, 8), 0xF5F5F0, ox - 195, 12, oz - 5);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 18, 8), 0xF5F5F0, ox - 195, 12, oz + 5);

        // Alexander II statue in the center of square
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 12, 8), 0x888877, ox, 6, oz + 30);
        makeMesh(new THREE.BoxGeometry(4, 2, 4), 0x888877, ox, 12, oz + 30);
        makeMesh(new THREE.SphereGeometry(2.5, 8, 8), 0x888877, ox, 16, oz + 30);

        // =============================================
        // USPENSKI CATHEDRAL — Russian Orthodox red brick
        // =============================================
        var ucx = ox + 350;
        var ucz = oz + 350;

        // Harbour peninsula ground
        makeMesh(new THREE.BoxGeometry(120, 3, 120), 0x9B7D5C, ucx, 1, ucz);

        // Main cathedral body
        makeMesh(new THREE.BoxGeometry(60, 25, 45), 0xCC2200, ucx, 14, ucz);
        // Front apse
        makeMesh(new THREE.BoxGeometry(20, 20, 15), 0xCC2200, ucx, 12, ucz - 30);

        // Bell tower
        makeMesh(new THREE.BoxGeometry(15, 35, 15), 0xCC2200, ucx - 30, 19, ucz - 20);

        // Main central onion dome drum
        makeMesh(new THREE.CylinderGeometry(8, 8, 8, 12), 0xCC2200, ucx, 35, ucz);
        // Main central onion dome
        makeMesh(new THREE.SphereGeometry(10, 12, 10), 0x111111, ucx, 47, ucz);
        // Golden cross on main dome
        makeMesh(new THREE.BoxGeometry(0.5, 7, 0.5), 0xCCAA00, ucx, 56, ucz);
        makeMesh(new THREE.BoxGeometry(4, 0.5, 0.5), 0xCCAA00, ucx, 60, ucz);
        makeMesh(new THREE.BoxGeometry(3, 0.5, 0.5), 0xCCAA00, ucx, 58, ucz);

        // Four corner onion domes
        makeMesh(new THREE.SphereGeometry(5, 10, 8), 0x111111, ucx - 22, 36, ucz - 15);
        makeMesh(new THREE.BoxGeometry(0.4, 5, 0.4), 0xCCAA00, ucx - 22, 41, ucz - 15);
        makeMesh(new THREE.SphereGeometry(5, 10, 8), 0x111111, ucx + 22, 36, ucz - 15);
        makeMesh(new THREE.BoxGeometry(0.4, 5, 0.4), 0xCCAA00, ucx + 22, 41, ucz - 15);
        makeMesh(new THREE.SphereGeometry(5, 10, 8), 0x111111, ucx - 22, 36, ucz + 15);
        makeMesh(new THREE.BoxGeometry(0.4, 5, 0.4), 0xCCAA00, ucx - 22, 41, ucz + 15);
        makeMesh(new THREE.SphereGeometry(5, 10, 8), 0x111111, ucx + 22, 36, ucz + 15);
        makeMesh(new THREE.BoxGeometry(0.4, 5, 0.4), 0xCCAA00, ucx + 22, 41, ucz + 15);

        // Bell tower dome
        makeMesh(new THREE.SphereGeometry(5, 10, 8), 0x111111, ucx - 30, 53, ucz - 20);
        makeMesh(new THREE.BoxGeometry(0.4, 5, 0.4), 0xCCAA00, ucx - 30, 58, ucz - 20);

        // =============================================
        // SUOMENLINNA SEA FORTRESS
        // =============================================
        var sfx = ox + 600;
        var sfz = oz + 700;

        // Island base
        makeMesh(new THREE.BoxGeometry(400, 2, 250), 0x6B8C6B, sfx, -1, sfz);

        // Main fortress walls
        makeMesh(new THREE.BoxGeometry(380, 12, 8), 0x888888, sfx, 6, sfz - 120);
        makeMesh(new THREE.BoxGeometry(380, 12, 8), 0x888888, sfx, 6, sfz + 120);
        makeMesh(new THREE.BoxGeometry(8, 12, 250), 0x888888, sfx - 190, 6, sfz);
        makeMesh(new THREE.BoxGeometry(8, 12, 250), 0x888888, sfx + 190, 6, sfz);

        // Bastions (corner towers)
        makeMesh(new THREE.BoxGeometry(30, 18, 30), 0x777777, sfx - 185, 9, sfz - 115);
        makeMesh(new THREE.BoxGeometry(30, 18, 30), 0x777777, sfx + 185, 9, sfz - 115);
        makeMesh(new THREE.BoxGeometry(30, 18, 30), 0x777777, sfx - 185, 9, sfz + 115);
        makeMesh(new THREE.BoxGeometry(30, 18, 30), 0x777777, sfx + 185, 9, sfz + 115);

        // Central fortress building
        makeMesh(new THREE.BoxGeometry(80, 20, 50), 0x888888, sfx, 10, sfz);
        makeMesh(new THREE.BoxGeometry(80, 5, 50), 0x666666, sfx, 22, sfz);

        // Cannon emplacements
        makeMesh(new THREE.CylinderGeometry(1, 1.5, 8, 8), 0x444444, sfx - 60, 14, sfz - 120, 1.5, 0, 0);
        makeMesh(new THREE.CylinderGeometry(1, 1.5, 8, 8), 0x444444, sfx,     14, sfz - 120, 1.5, 0, 0);
        makeMesh(new THREE.CylinderGeometry(1, 1.5, 8, 8), 0x444444, sfx + 60, 14, sfz - 120, 1.5, 0, 0);

        // Fortress church
        makeMesh(new THREE.BoxGeometry(20, 15, 15), 0xF0EAD6, sfx + 60, 8, sfz + 40);
        makeMesh(new THREE.ConeGeometry(10, 12, 8), 0x884422, sfx + 60, 21, sfz + 40);

        // =============================================
        // HELSINKI HARBOUR
        // =============================================
        var hbx = ox + 100;
        var hbz = oz + 420;

        // Harbour pier
        makeMesh(new THREE.BoxGeometry(200, 2, 40), 0x8B7355, hbx, 0, hbz);
        makeMesh(new THREE.BoxGeometry(40, 2, 80), 0x8B7355, hbx + 80, 0, hbz + 60);

        // Market square (Kauppatori) — orange awnings
        makeMesh(new THREE.BoxGeometry(80, 0.5, 60), 0xD3D3D3, ox + 80, 0.3, oz + 320);
        // Market stall awnings
        makeMesh(new THREE.BoxGeometry(15, 0.3, 8), 0xFF6600, ox + 55,  4, oz + 310);
        makeMesh(new THREE.BoxGeometry(15, 0.3, 8), 0xFF6600, ox + 75,  4, oz + 310);
        makeMesh(new THREE.BoxGeometry(15, 0.3, 8), 0xFF6600, ox + 95,  4, oz + 310);
        makeMesh(new THREE.BoxGeometry(15, 0.3, 8), 0xFF6600, ox + 115, 4, oz + 310);
        makeMesh(new THREE.BoxGeometry(15, 0.3, 8), 0xEE5500, ox + 55,  4, oz + 325);
        makeMesh(new THREE.BoxGeometry(15, 0.3, 8), 0xEE5500, ox + 75,  4, oz + 325);
        makeMesh(new THREE.BoxGeometry(15, 0.3, 8), 0xEE5500, ox + 95,  4, oz + 325);
        makeMesh(new THREE.BoxGeometry(15, 0.3, 8), 0xEE5500, ox + 115, 4, oz + 325);

        // Ferry terminal building
        makeMesh(new THREE.BoxGeometry(60, 15, 30), 0xCCCCBB, ox + 50, 8, oz + 400);
        makeMesh(new THREE.BoxGeometry(60, 3, 30), 0xAAAAAA, ox + 50, 16, oz + 400);

        // Ferry to Stockholm (large white ship hull)
        makeMesh(new THREE.BoxGeometry(80, 18, 22), 0xF5F5F5, ox + 180, 8, oz + 470);
        // Ferry superstructure
        makeMesh(new THREE.BoxGeometry(70, 12, 18), 0xF0F0F0, ox + 178, 22, oz + 470);
        // Ferry funnel
        makeMesh(new THREE.CylinderGeometry(3, 4, 10, 8), 0x003399, ox + 190, 33, oz + 470);
        // Ferry to Tallinn (smaller)
        makeMesh(new THREE.BoxGeometry(55, 12, 16), 0xEEEEEE, ox - 100, 6, oz + 490);
        makeMesh(new THREE.CylinderGeometry(2.5, 3, 8, 8), 0xCC0000, ox - 85, 18, oz + 490);

        // =============================================
        // TEMPPELIAUKIO — Rock Church
        // =============================================
        var tcx = ox - 400;
        var tcz = oz - 200;

        // Rock outcrop base
        makeMesh(new THREE.CylinderGeometry(40, 50, 10, 16), 0x888888, tcx, 5, tcz);
        makeMesh(new THREE.CylinderGeometry(35, 40, 6, 16), 0x777777, tcx, 11, tcz);

        // Church interior walls (carved into rock — circular walls)
        makeMesh(new THREE.CylinderGeometry(28, 28, 8, 16), 0x999999, tcx, 9, tcz);

        // Copper dome (circular, visible above rock)
        makeMesh(new THREE.SphereGeometry(26, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x7B9E87, tcx, 14, tcz);
        // Dome skylight ring
        makeMesh(new THREE.CylinderGeometry(26, 26, 2, 16), 0x8B7355, tcx, 14, tcz);

        // =============================================
        // FINLANDIA HALL — Alvar Aalto white marble
        // =============================================
        var fhx = ox - 350;
        var fhz = oz - 100;

        // Main concert hall body
        makeMesh(new THREE.BoxGeometry(100, 22, 50), 0xF5F5DC, fhx, 11, fhz);
        // Asymmetric wing
        makeMesh(new THREE.BoxGeometry(60, 18, 35), 0xF5F5F0, fhx + 60, 9, fhz - 30);
        // White marble cladding texture layers
        makeMesh(new THREE.BoxGeometry(100, 1, 50), 0xEEEEDD, fhx, 22, fhz);
        makeMesh(new THREE.BoxGeometry(100, 1, 50), 0xEEEEDD, fhx, 15, fhz);
        // Entrance canopy
        makeMesh(new THREE.BoxGeometry(30, 1.5, 12), 0xF0F0E8, fhx - 35, 7, fhz - 28);
        // Finlandia Hall columns
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 20, 8), 0xF5F5DC, fhx - 45, 12, fhz - 28);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 20, 8), 0xF5F5DC, fhx - 25, 12, fhz - 28);

        // =============================================
        // FINNISH FOREST ISLANDS — archipelago
        // =============================================
        // Island 1
        makeMesh(new THREE.BoxGeometry(80, 3, 60), 0x3A7D44, ox - 500, 0, oz + 800);
        makeMesh(new THREE.ConeGeometry(6, 18, 6), 0x2A5E32, ox - 490, 12, oz + 790);
        makeMesh(new THREE.ConeGeometry(5, 16, 6), 0x2A5E32, ox - 510, 11, oz + 800);
        makeMesh(new THREE.ConeGeometry(7, 20, 6), 0x2A5E32, ox - 475, 13, oz + 810);
        makeMesh(new THREE.ConeGeometry(5, 15, 6), 0x2D6435, ox - 520, 10, oz + 780);

        // Island 2
        makeMesh(new THREE.BoxGeometry(60, 3, 50), 0x3A7D44, ox + 700, 0, oz + 850);
        makeMesh(new THREE.ConeGeometry(5, 16, 6), 0x2A5E32, ox + 705, 11, oz + 845);
        makeMesh(new THREE.ConeGeometry(6, 18, 6), 0x2A5E32, ox + 720, 12, oz + 855);
        makeMesh(new THREE.ConeGeometry(4, 14, 6), 0x2D6435, ox + 690, 10, oz + 860);

        // Island 3 (small rocky)
        makeMesh(new THREE.BoxGeometry(30, 2, 25), 0x6B6B5C, ox + 200, 0, oz + 1050);
        makeMesh(new THREE.ConeGeometry(3, 10, 6), 0x2A5E32, ox + 205, 7, oz + 1050);

        // =============================================
        // CITY STREETS AND ADDITIONAL BUILDINGS
        // =============================================
        // Esplanade park strip
        makeMesh(new THREE.BoxGeometry(200, 0.5, 40), 0x4A7C59, ox, 0.3, oz + 200);

        // Typical Helsinki apartment buildings (neoclassical style)
        makeMesh(new THREE.BoxGeometry(40, 25, 20), 0xD4C5A9, ox - 220, 13, oz - 120);
        makeMesh(new THREE.BoxGeometry(40, 22, 20), 0xC8B99A, ox - 270, 12, oz - 120);
        makeMesh(new THREE.BoxGeometry(40, 28, 20), 0xDDD0B8, ox + 240, 14, oz - 120);
        makeMesh(new THREE.BoxGeometry(40, 24, 20), 0xCFC0A5, ox + 290, 13, oz - 120);

        // Lutheran church (Johanneksenkirkko)
        makeMesh(new THREE.BoxGeometry(30, 30, 22), 0xC8B99A, ox - 300, 15, oz + 150);
        makeMesh(new THREE.ConeGeometry(8, 20, 4), 0x888877, ox - 300, 35, oz + 150);
        makeMesh(new THREE.BoxGeometry(0.5, 6, 0.5), 0xCCAA00, ox - 300, 51, oz + 150);

        // Stockmann department store (large commercial building)
        makeMesh(new THREE.BoxGeometry(70, 35, 50), 0xC8A882, ox - 180, 18, oz - 250);
        makeMesh(new THREE.BoxGeometry(70, 4, 50), 0xBB9B77, ox - 180, 37, oz - 250);

        // Helsinki Central Railway Station (iconic granite)
        makeMesh(new THREE.BoxGeometry(80, 40, 40), 0x9B8B7B, ox + 200, 20, oz - 300);
        // Clock tower
        makeMesh(new THREE.BoxGeometry(20, 60, 20), 0x9B8B7B, ox + 200, 38, oz - 300);
        makeMesh(new THREE.SphereGeometry(8, 10, 8), 0x776655, ox + 200, 70, oz - 300);
        // Station arch entrance
        makeMesh(new THREE.BoxGeometry(40, 30, 8), 0xAA9B8A, ox + 200, 18, oz - 322);

        // =============================================
        // HARBOUR LIGHTHOUSE
        // =============================================
        makeMesh(new THREE.CylinderGeometry(3, 4, 25, 10), 0xF5F5DC, ox + 300, 13, oz + 500);
        makeMesh(new THREE.ConeGeometry(5, 8, 10), 0xCC2200, ox + 300, 28, oz + 500);
        makeMesh(new THREE.SphereGeometry(3, 8, 8), 0xFFDD00, ox + 300, 32, oz + 500);
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
