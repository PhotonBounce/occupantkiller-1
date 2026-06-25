window.WorcesterCathedral = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeLineBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(x, y, z);
        scene.add(lines);
        objects.push(lines);
        return lines;
    }

    function build() {
        var OX = 21520;

        // ---------------------------------------------------------------
        // GROUND PLANE (flat box, very thin)
        // ---------------------------------------------------------------
        makeBox(2000, 1, 2000, 0x5C8040, OX, -0.5, 0);

        // ---------------------------------------------------------------
        // RIVER SEVERN — wide blue river to the west of cathedral
        // ---------------------------------------------------------------
        makeBox(200, 1, 1200, 0x4682B4, OX - 280, 0.3, 0);
        // River reflection shimmer strip (slightly lighter)
        makeBox(180, 1, 1200, 0x5A9FD4, OX - 280, 0.5, 0);
        // River banks
        makeBox(20, 3, 1200, 0x8B7355, OX - 185, 1, 0);
        makeBox(20, 3, 1200, 0x8B7355, OX - 375, 1, 0);

        // ---------------------------------------------------------------
        // WORCESTER CATHEDRAL — sandstone, River Severn bank
        // ---------------------------------------------------------------
        var CATH_COLOR = 0xD4A870;
        var CATH_DARK  = 0xB8905A;

        // Main nave (long body)
        makeBox(140, 28, 42, CATH_COLOR, OX, 14, 0);
        // Nave interior darkening (side aisles, slightly narrower + taller walls)
        makeBox(130, 26, 12, CATH_DARK, OX, 13, 16);
        makeBox(130, 26, 12, CATH_DARK, OX, 13, -16);

        // Central tower (tall, square)
        makeBox(28, 72, 28, CATH_COLOR, OX + 10, 36, 0);
        // Tower upper stage
        makeBox(24, 20, 24, CATH_COLOR, OX + 10, 78, 0);
        // Tower battlements — 4 corner turrets
        makeCylinder(3, 3, 14, 8, CATH_COLOR, OX + 10 + 12, 96, 12);
        makeCylinder(3, 3, 14, 8, CATH_COLOR, OX + 10 - 12, 96, 12);
        makeCylinder(3, 3, 14, 8, CATH_COLOR, OX + 10 + 12, 96, -12);
        makeCylinder(3, 3, 14, 8, CATH_COLOR, OX + 10 - 12, 96, -12);
        // Tower pinnacle cap
        makeCone(4, 10, 8, CATH_DARK, OX + 10, 104, 0);

        // West facade (entrance front)
        makeBox(42, 38, 10, CATH_COLOR, OX - 60, 19, 0);
        // West front twin turrets
        makeCylinder(5, 5, 44, 8, CATH_COLOR, OX - 60, 22, 18);
        makeCylinder(5, 5, 44, 8, CATH_COLOR, OX - 60, 22, -18);
        makeCone(5, 14, 8, CATH_DARK, OX - 60, 46, 18);
        makeCone(5, 14, 8, CATH_DARK, OX - 60, 46, -18);

        // East end (Lady Chapel)
        makeBox(36, 24, 36, CATH_COLOR, OX + 82, 12, 0);
        makeCone(9, 18, 8, CATH_DARK, OX + 82, 30, 0);

        // Transept (north)
        makeBox(28, 32, 48, CATH_COLOR, OX + 10, 16, 40);
        // Transept (south)
        makeBox(28, 32, 48, CATH_COLOR, OX + 10, 16, -40);
        // Transept gable cones
        makeCone(7, 16, 4, CATH_DARK, OX + 10, 46, 62);
        makeCone(7, 16, 4, CATH_DARK, OX + 10, 46, -62);

        // Norman crypt indicators (low arched boxes at base)
        makeBox(100, 6, 38, CATH_DARK, OX + 10, 3, 0);

        // Nave buttresses (alternating along length)
        makeBox(5, 22, 8, CATH_DARK, OX - 40, 11, 22);
        makeBox(5, 22, 8, CATH_DARK, OX - 40, 11, -22);
        makeBox(5, 22, 8, CATH_DARK, OX,      11, 22);
        makeBox(5, 22, 8, CATH_DARK, OX,      11, -22);
        makeBox(5, 22, 8, CATH_DARK, OX + 40, 11, 22);
        makeBox(5, 22, 8, CATH_DARK, OX + 40, 11, -22);

        // Cathedral steps / plinth
        makeBox(160, 2, 60, 0xC0A060, OX, 1, 0);
        makeBox(156, 2, 56, 0xC0A060, OX, 3, 0);

        // ---------------------------------------------------------------
        // WORCESTER BRIDGE — Georgian stone, Severn crossing
        // ---------------------------------------------------------------
        var BRIDGE_COLOR = 0xD3D3D3;
        // Bridge deck
        makeBox(200, 4, 18, BRIDGE_COLOR, OX - 280, 5, 80);
        // Bridge piers (5 arches)
        makeBox(10, 10, 18, BRIDGE_COLOR, OX - 240, 3, 80);
        makeBox(10, 10, 18, BRIDGE_COLOR, OX - 270, 3, 80);
        makeBox(10, 10, 18, BRIDGE_COLOR, OX - 300, 3, 80);
        makeBox(10, 10, 18, BRIDGE_COLOR, OX - 330, 3, 80);
        // Bridge parapets
        makeBox(200, 3, 2, BRIDGE_COLOR, OX - 280, 8, 89);
        makeBox(200, 3, 2, BRIDGE_COLOR, OX - 280, 8, 71);

        // ---------------------------------------------------------------
        // ROYAL WORCESTER PORCELAIN FACTORY — Victorian complex
        // ---------------------------------------------------------------
        var FACTORY_COLOR = 0xD3D3D3;
        var BRICK_COLOR   = 0xC0643C;
        // Main factory building
        makeBox(90, 20, 50, BRICK_COLOR, OX + 160, 10, -120);
        // Factory wing
        makeBox(50, 16, 30, BRICK_COLOR, OX + 220, 8, -110);
        // Showroom / museum block
        makeBox(40, 18, 36, FACTORY_COLOR, OX + 140, 9, -90);
        // Ceramic kiln domes (ConeGeometry with wide base)
        makeCone(10, 30, 12, BRICK_COLOR, OX + 170, 25, -130);
        makeCone(10, 30, 12, BRICK_COLOR, OX + 185, 25, -130);
        makeCone(8,  24, 12, BRICK_COLOR, OX + 155, 22, -145);
        makeCone(8,  24, 12, BRICK_COLOR, OX + 200, 22, -145);
        // Kiln base cylinders
        makeCylinder(10, 12, 14, 12, BRICK_COLOR, OX + 170, 7, -130);
        makeCylinder(10, 12, 14, 12, BRICK_COLOR, OX + 185, 7, -130);
        makeCylinder(8,  10, 12, 12, BRICK_COLOR, OX + 155, 6, -145);
        makeCylinder(8,  10, 12, 12, BRICK_COLOR, OX + 200, 6, -145);
        // Factory chimney
        makeCylinder(3, 4, 40, 8, BRICK_COLOR, OX + 230, 20, -130);

        // ---------------------------------------------------------------
        // WORCESTER RACECOURSE — flood meadows, beside river
        // ---------------------------------------------------------------
        var RACE_GREEN = 0x4CAF50;
        // Racecourse oval (approximated with a flat wide box)
        makeBox(300, 1, 180, RACE_GREEN, OX - 280, 0.5, -250);
        // Inner grass
        makeBox(220, 1, 100, 0x5DBF5D, OX - 280, 0.8, -250);
        // Grandstand main structure
        makeBox(80, 14, 20, 0xE8E0D0, OX - 240, 7, -180);
        // Grandstand roof
        makeBox(84, 4, 22, 0x888888, OX - 240, 15, -180);
        // Racecourse rail markers
        makeBox(300, 2, 2, 0xFFFFFF, OX - 280, 1.5, -165);
        makeBox(300, 2, 2, 0xFFFFFF, OX - 280, 1.5, -335);
        // Finishing post
        makeCylinder(1, 1, 12, 6, 0xFFFFFF, OX - 130, 6, -250);

        // ---------------------------------------------------------------
        // WORCESTERSHIRE COUNTY CRICKET GROUND
        // ---------------------------------------------------------------
        var CRICKET_GREEN = 0x6DB33F;
        // Cricket outfield
        makeBox(240, 1, 200, CRICKET_GREEN, OX + 260, 0.5, 0);
        // Cricket square (central pitch area)
        makeBox(40, 1, 20, 0x8BC34A, OX + 260, 0.8, 0);
        // Pavilion main building
        makeBox(50, 12, 22, 0xF5F0E8, OX + 190, 6, -40);
        // Pavilion wings
        makeBox(18, 10, 22, 0xF5F0E8, OX + 166, 5, -40);
        makeBox(18, 10, 22, 0xF5F0E8, OX + 214, 5, -40);
        // Pavilion roof
        makeBox(54, 3, 26, 0x8B7355, OX + 190, 13, -40);
        // Press box / scoreboard
        makeBox(20, 8, 10, 0xD0C8B0, OX + 310, 4, 20);
        // Boundary rope markers (small boxes around perimeter)
        makeBox(3, 2, 3, 0xFFFFFF, OX + 260, 1, -96);
        makeBox(3, 2, 3, 0xFFFFFF, OX + 260, 1,  96);
        makeBox(3, 2, 3, 0xFFFFFF, OX + 148, 1,   0);
        makeBox(3, 2, 3, 0xFFFFFF, OX + 372, 1,   0);
        makeBox(3, 2, 3, 0xFFFFFF, OX + 180, 1, -86);
        makeBox(3, 2, 3, 0xFFFFFF, OX + 340, 1, -86);
        makeBox(3, 2, 3, 0xFFFFFF, OX + 180, 1,  86);
        makeBox(3, 2, 3, 0xFFFFFF, OX + 340, 1,  86);
        // Sight screens
        makeBox(24, 8, 2, 0xFFFFFF, OX + 155, 4, 0);
        makeBox(24, 8, 2, 0xFFFFFF, OX + 365, 4, 0);

        // ---------------------------------------------------------------
        // THE COMMANDERY — Civil War Royalist HQ, medieval timber frame
        // ---------------------------------------------------------------
        var COMMAND_COLOR = 0x8B6914;
        var COMMAND_FRAME = 0x3D2B1F;
        // Main hall
        makeBox(48, 18, 28, COMMAND_COLOR, OX + 60, 9, 130);
        // Timber frame overlay (dark beams)
        makeBox(48, 2,  28, COMMAND_FRAME, OX + 60, 14, 130);
        makeBox(48, 2,  28, COMMAND_FRAME, OX + 60,  8, 130);
        makeBox(2,  18, 28, COMMAND_FRAME, OX + 36, 9, 130);
        makeBox(2,  18, 28, COMMAND_FRAME, OX + 60, 9, 130);
        makeBox(2,  18, 28, COMMAND_FRAME, OX + 84, 9, 130);
        // Great Hall wing
        makeBox(24, 22, 24, COMMAND_COLOR, OX + 30, 11, 150);
        // Gabled roof
        makeBox(50, 6, 30, COMMAND_FRAME, OX + 60, 20, 130);
        makeCone(6, 12, 4, COMMAND_COLOR, OX + 30, 26, 150);
        // Courtyard entrance gate
        makeBox(4, 12, 16, COMMAND_FRAME, OX + 85, 6, 110);
        makeBox(12, 4, 16, COMMAND_FRAME, OX + 85, 13, 110);

        // ---------------------------------------------------------------
        // GUILDHALL — Queen Anne town hall
        // ---------------------------------------------------------------
        var GUILD_COLOR = 0xC8B89A;
        // Main body
        makeBox(42, 22, 24, GUILD_COLOR, OX + 20, 11, 180);
        // Colonnaded ground floor
        makeBox(42, 6, 26, 0xDAD0B8, OX + 20, 3, 180);
        // Columns
        makeCylinder(1, 1, 6, 8, 0xE8E0D0, OX + 3,  3, 192);
        makeCylinder(1, 1, 6, 8, 0xE8E0D0, OX + 13, 3, 192);
        makeCylinder(1, 1, 6, 8, 0xE8E0D0, OX + 23, 3, 192);
        makeCylinder(1, 1, 6, 8, 0xE8E0D0, OX + 33, 3, 192);
        // Pediment / triangular gable
        makeBox(44, 2, 26, GUILD_COLOR, OX + 20, 23, 180);
        makeCone(14, 8, 4, GUILD_COLOR, OX + 20, 28, 180);
        // Clock tower
        makeBox(10, 30, 10, GUILD_COLOR, OX + 20, 26, 180);
        makeCone(4, 10, 4, 0x888888, OX + 20, 42, 180);
        // Clock face (sphere)
        makeSphere(2, 8, 8, 0xF5F5F5, OX + 20, 32, 185);

        // ---------------------------------------------------------------
        // ELGAR'S BIRTHPLACE — small cottage, outside city
        // ---------------------------------------------------------------
        var ELGAR_COLOR = 0xDEB887;
        // Cottage body
        makeBox(18, 10, 14, ELGAR_COLOR, OX - 350, 5, 300);
        // Cottage roof
        makeCone(12, 8, 4, 0x8B4513, OX - 350, 13, 300);
        // Chimney
        makeBox(3, 8, 3, 0xB0856A, OX - 345, 16, 298);
        // Garden fence
        makeBox(22, 2, 1, 0xC8A87A, OX - 350, 1, 309);
        makeBox(22, 2, 1, 0xC8A87A, OX - 350, 1, 291);
        makeBox(1, 2, 18, 0xC8A87A, OX - 339, 1, 300);
        makeBox(1, 2, 18, 0xC8A87A, OX - 361, 1, 300);

        // ---------------------------------------------------------------
        // CITY WALLS REMNANTS — Roman/medieval fragmentary
        // ---------------------------------------------------------------
        var WALL_COLOR = 0x888888;
        // North wall section
        makeBox(80, 8, 5, WALL_COLOR, OX - 50, 4, 230);
        // North wall towers
        makeCylinder(5, 5, 12, 8, WALL_COLOR, OX - 10, 6, 232);
        makeCylinder(5, 5, 12, 8, WALL_COLOR, OX - 90, 6, 228);
        // East wall fragment
        makeBox(5, 6, 60, WALL_COLOR, OX + 130, 3, 200);
        // South wall section
        makeBox(60, 7, 5, WALL_COLOR, OX + 80, 3, -80);
        makeCylinder(4, 4, 10, 8, WALL_COLOR, OX + 110, 5, -80);
        // Crumbled wall rubble (low, irregular boxes)
        makeBox(14, 3, 5, WALL_COLOR, OX - 130, 1.5, 220);
        makeBox(10, 2, 5, WALL_COLOR, OX - 150, 1, 215);

        // ---------------------------------------------------------------
        // CITY HIGH STREET — commercial buildings
        // ---------------------------------------------------------------
        var SHOP_A = 0xE8D8C0;
        var SHOP_B = 0xC8A87A;
        makeBox(16, 16, 12, SHOP_A, OX + 30, 8, 210);
        makeBox(16, 20, 12, SHOP_B, OX + 48, 10, 210);
        makeBox(16, 14, 12, SHOP_A, OX + 66, 7, 210);
        makeBox(16, 18, 12, SHOP_B, OX + 84, 9, 210);
        makeBox(16, 12, 12, SHOP_A, OX + 102, 6, 210);
        // Road surface
        makeBox(120, 1, 14, 0x444444, OX + 66, 0.5, 222);

        // ---------------------------------------------------------------
        // FOREGATE STREET STATION — Victorian railway
        // ---------------------------------------------------------------
        var STATION_COLOR = 0xBFAA88;
        makeBox(60, 14, 20, STATION_COLOR, OX - 80, 7, 260);
        makeBox(60, 4, 24, 0x666666, OX - 80, 15, 260);
        // Platform canopy pillars
        makeCylinder(1, 1, 14, 6, 0x888888, OX - 60, 7, 271);
        makeCylinder(1, 1, 14, 6, 0x888888, OX - 80, 7, 271);
        makeCylinder(1, 1, 14, 6, 0x888888, OX - 100, 7, 271);
        // Station clock tower
        makeBox(8, 24, 8, STATION_COLOR, OX - 50, 12, 260);
        makeCone(4, 8, 4, 0x555555, OX - 50, 25, 260);

        // ---------------------------------------------------------------
        // SHRUB HILL STATION — second Worcester station
        // ---------------------------------------------------------------
        makeBox(50, 12, 18, 0xC4A882, OX + 200, 6, 260);
        makeBox(50, 3, 20, 0x777777, OX + 200, 13, 260);
        makeCylinder(1, 1, 12, 6, 0x888888, OX + 185, 6, 270);
        makeCylinder(1, 1, 12, 6, 0x888888, OX + 215, 6, 270);

        // ---------------------------------------------------------------
        // ST ANDREW'S SPIRE (blackened steeple ruin)
        // ---------------------------------------------------------------
        makeBox(8, 20, 8, 0x555555, OX - 20, 10, 150);
        makeCone(5, 28, 8, 0x444444, OX - 20, 30, 150);

        // ---------------------------------------------------------------
        // TREES / GREENERY around cathedral close
        // ---------------------------------------------------------------
        var TREE_TRUNK = 0x6B4226;
        var TREE_LEAF  = 0x2D5A1B;
        // Cathedral close trees
        makeCylinder(1, 1, 8, 6, TREE_TRUNK, OX - 80, 4, 28);
        makeSphere(5, 7, 7, TREE_LEAF, OX - 80, 11, 28);
        makeCylinder(1, 1, 8, 6, TREE_TRUNK, OX - 80, 4, -28);
        makeSphere(5, 7, 7, TREE_LEAF, OX - 80, 11, -28);
        makeCylinder(1, 1, 10, 6, TREE_TRUNK, OX + 120, 5, 32);
        makeSphere(6, 7, 7, TREE_LEAF, OX + 120, 13, 32);
        makeCylinder(1, 1, 10, 6, TREE_TRUNK, OX + 120, 5, -32);
        makeSphere(6, 7, 7, TREE_LEAF, OX + 120, 13, -32);
        // Elgar's garden trees
        makeCylinder(1, 1, 7, 6, TREE_TRUNK, OX - 340, 3.5, 310);
        makeSphere(4, 7, 7, TREE_LEAF, OX - 340, 9, 310);
        makeCylinder(1, 1, 7, 6, TREE_TRUNK, OX - 360, 3.5, 290);
        makeSphere(4, 7, 7, TREE_LEAF, OX - 360, 9, 290);

        // ---------------------------------------------------------------
        // CATHEDRAL GRAVEYARD markers
        // ---------------------------------------------------------------
        makeBox(2, 4, 1, 0xAAAAAA, OX - 100, 2, 30);
        makeBox(2, 4, 1, 0xAAAAAA, OX - 108, 2, 22);
        makeBox(2, 4, 1, 0xAAAAAA, OX - 95, 2, 10);
        makeBox(2, 4, 1, 0xAAAAAA, OX - 112, 2, 8);
        makeBox(2, 4, 1, 0xAAAAAA, OX - 100, 2, -12);
        makeBox(2, 4, 1, 0xAAAAAA, OX - 108, 2, -28);

        // ---------------------------------------------------------------
        // MEDIEVAL PRIORY REMAINS (south of cathedral)
        // ---------------------------------------------------------------
        makeBox(30, 8, 4, 0xB09060, OX + 40, 4, -70);
        makeBox(4, 8, 30, 0xB09060, OX + 55, 4, -56);
        makeCylinder(4, 4, 14, 8, 0xB09060, OX + 55, 7, -70);

        // ---------------------------------------------------------------
        // WORCESTER SAUCE FACTORY (Lea & Perrins) — industrial block
        // ---------------------------------------------------------------
        makeBox(44, 18, 30, 0xA0522D, OX + 160, 9, 180);
        makeCylinder(4, 5, 30, 8, 0xA0522D, OX + 185, 15, 175);
        makeBox(44, 4, 32, 0x666666, OX + 160, 19, 180);

        // ---------------------------------------------------------------
        // EDGE LINES for cathedral outline (LineSegments accent)
        // ---------------------------------------------------------------
        makeLineBox(140, 28, 42, 0xB89050, OX, 14, 0);
        makeLineBox(28, 72, 28, 0xB89050, OX + 10, 36, 0);
    }

    function update(delta) {
        // static environment — no animation needed
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
