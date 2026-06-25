window.LakeDistrict = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var cx = 21000;

        // --- GROUND BASE ---
        makebox(8000, 40, 8000, 0x5a7a3a, cx, -20, 0);

        // =============================================
        // SCAFELL PIKE - England's highest mountain
        // Stacked pyramid of grey boxes, rocky summit
        // =============================================
        var spx = cx - 1200;
        var spz = -800;

        // Base foothills
        makebox(900, 80, 900, 0x7a8c6a, spx, 40, spz);
        // Lower mountain body
        makebox(700, 200, 700, 0x8b8b8b, spx, 160, spz);
        // Mid mountain
        makebox(500, 200, 500, 0x909090, spx, 360, spz);
        // Upper mountain
        makebox(320, 180, 320, 0x959595, spx, 550, spz);
        // Near summit
        makebox(180, 150, 180, 0x9a9a9a, spx, 720, spz);
        // Summit block
        makebox(90, 100, 90, 0xa0a0a0, spx, 845, spz);
        // Rocky summit cairn - stacked stones
        makebox(30, 40, 30, 0x888888, spx, 920, spz);
        makebox(20, 30, 20, 0x808080, spx, 960, spz);
        makebox(14, 25, 14, 0x787878, spx, 987, spz);

        // Scree slopes - scattered rocky debris
        makebox(120, 30, 60, 0x8b8b8b, spx + 200, 220, spz + 150);
        makebox(90, 25, 80, 0x7f7f7f, spx - 180, 180, spz + 200);
        makebox(100, 20, 70, 0x878787, spx + 150, 150, spz - 180);
        makebox(80, 18, 90, 0x838383, spx - 220, 160, spz - 160);
        makebox(60, 15, 50, 0x7a7a7a, spx + 280, 120, spz + 100);
        makebox(70, 12, 60, 0x818181, spx - 260, 110, spz - 100);

        // Neighbouring fells - Scafell
        makebox(500, 160, 500, 0x7d8c7d, spx + 400, 80, spz - 200);
        makebox(350, 120, 350, 0x829082, spx + 400, 220, spz - 200);
        makebox(200, 90, 200, 0x879087, spx + 400, 340, spz - 200);

        // Great Gable
        makebox(460, 150, 460, 0x7a8a7a, spx - 500, 75, spz - 400);
        makebox(300, 130, 300, 0x808080, spx - 500, 225, spz - 400);
        makebox(160, 100, 160, 0x858585, spx - 500, 355, spz - 400);

        // =============================================
        // WINDERMERE - England's largest natural lake
        // =============================================
        var wmx = cx + 600;
        var wmz = 400;

        // Main lake body - long narrow stretch
        makebox(200, 8, 1400, 0x006994, wmx, 2, wmz);
        // North section
        makebox(160, 8, 400, 0x006994, wmx - 20, 2, wmz - 900);
        // South section
        makebox(140, 8, 400, 0x006994, wmx + 10, 2, wmz + 900);
        // Lake shimmer highlights
        makebox(180, 4, 1200, 0x0077aa, wmx, 5, wmz);

        // Wooded shores - east
        makecone(30, 80, 6, 0x2d5a1b, wmx + 140, 40, wmz - 300);
        makecone(25, 70, 6, 0x336622, wmx + 150, 35, wmz);
        makecone(28, 75, 6, 0x2a5218, wmx + 145, 38, wmz + 300);
        makecone(22, 65, 6, 0x3a7a28, wmx + 135, 33, wmz + 500);

        // Wooded shores - west
        makecone(32, 85, 6, 0x2d5a1b, wmx - 140, 43, wmz - 200);
        makecone(26, 72, 6, 0x336622, wmx - 148, 36, wmz + 100);
        makecone(24, 68, 6, 0x2f6020, wmx - 142, 34, wmz + 400);

        // Bowness-on-Windermere village on east shore
        makebox(40, 25, 40, 0xf5f0e8, wmx + 170, 12, wmz + 100);
        makebox(35, 22, 35, 0xe8e0d0, wmx + 200, 11, wmz + 80);
        makebox(30, 20, 30, 0xd4c8b8, wmx + 185, 10, wmz + 130);
        // Pier
        makebox(80, 6, 12, 0x8b6914, wmx + 110, 3, wmz + 90);

        // =============================================
        // CONISTON WATER
        // =============================================
        var conx = cx + 200;
        var conz = 1500;

        makebox(130, 8, 900, 0x006994, conx, 2, conz);
        makebox(100, 4, 700, 0x0077aa, conx, 5, conz);

        // Coniston Old Man mountain behind
        makebox(500, 140, 500, 0x7a8080, conx - 400, 70, conz - 200);
        makebox(340, 120, 340, 0x808888, conx - 400, 210, conz - 200);
        makebox(200, 100, 200, 0x848c8c, conx - 400, 330, conz - 200);
        makebox(100, 70, 100, 0x888888, conx - 400, 430, conz - 200);

        // Donald Campbell Bluebird memorial marker
        makebox(8, 30, 8, 0x334488, conx + 80, 15, conz - 100);
        makebox(20, 6, 8, 0x3333cc, conx + 80, 33, conz - 100);

        // Shore trees
        makecone(20, 55, 6, 0x2d5a1b, conx + 80, 28, conz - 400);
        makecone(18, 50, 6, 0x336622, conx - 80, 25, conz - 200);

        // =============================================
        // GRASMERE - small picturesque lake
        // =============================================
        var grx = cx - 200;
        var grz = -200;

        makebox(140, 8, 200, 0x006994, grx, 2, grz);
        makebox(120, 4, 180, 0x0077aa, grx, 5, grz);

        // Grasmere village beside lake
        makebox(35, 22, 35, 0xf5f0e8, grx - 120, 11, grz - 30);
        makebox(28, 18, 28, 0xe8dfc8, grx - 150, 9, grz + 20);
        makebox(32, 20, 32, 0xeee8d8, grx - 110, 10, grz + 50);
        // Village church
        makebox(25, 28, 40, 0xc8c0b0, grx - 140, 14, grz - 80);
        makecone(10, 40, 4, 0x888070, grx - 140, 48, grz - 80);
        // Church tower
        makebox(12, 50, 12, 0xc0b8a8, grx - 128, 25, grz - 80);

        // =============================================
        // DOVE COTTAGE - Wordsworth's home
        // =============================================
        var dcx = cx - 180;
        var dcz = -320;

        // Cottage main body
        makebox(30, 22, 22, 0xf5f0e8, dcx, 11, dcz);
        // Cottage roof
        makebox(34, 10, 26, 0x888070, dcx, 27, dcz);
        // Chimney
        makebox(6, 18, 6, 0xb0a890, dcx + 10, 33, dcz - 6);
        makebox(6, 18, 6, 0xb0a890, dcx - 10, 33, dcz - 6);
        // Garden wall
        makebox(40, 8, 4, 0xc8c0a8, dcx, 4, dcz + 18);
        makebox(4, 8, 30, 0xc8c0a8, dcx + 20, 4, dcz + 4);

        // =============================================
        // WORDSWORTH MUSEUM
        // =============================================
        var wmux = cx - 140;
        var wmuz = -360;

        makebox(60, 28, 40, 0xd3d3d3, wmux, 14, wmuz);
        // Museum roof
        makebox(64, 8, 44, 0xb0b0b0, wmux, 32, wmuz);
        // Entrance portico
        makebox(20, 24, 10, 0xc8c8c8, wmux, 12, wmuz + 25);
        // Pillars
        makecylinder(2, 2, 22, 6, 0xcccccc, wmux - 7, 11, wmuz + 28);
        makecylinder(2, 2, 22, 6, 0xcccccc, wmux + 7, 11, wmuz + 28);

        // =============================================
        // AMBLESIDE - stone market town
        // =============================================
        var ambx = cx + 300;
        var ambz = -50;

        // Town buildings
        makebox(45, 28, 35, 0xc8b89a, ambx, 14, ambz);
        makebox(40, 24, 30, 0xbfaf92, ambx + 55, 12, ambz);
        makebox(38, 22, 32, 0xc4b496, ambx - 55, 11, ambz);
        makebox(50, 30, 38, 0xc8b89a, ambx + 10, 15, ambz + 50);
        makebox(42, 26, 36, 0xbcac8e, ambx - 50, 13, ambz + 50);

        // Bridge House - tiny house on bridge over Stock Ghyll
        makebox(12, 18, 10, 0xc8b89a, ambx + 20, 9, ambz - 80);
        // Bridge arch below it
        makebox(20, 8, 6, 0xa09080, ambx + 20, 4, ambz - 80);
        // Stock Ghyll stream
        makebox(8, 4, 80, 0x4488aa, ambx + 20, 2, ambz - 40);
        // Market cross
        makecylinder(3, 3, 20, 5, 0xb0a888, ambx - 10, 10, ambz - 30);
        makebox(12, 4, 12, 0xa89878, ambx - 10, 22, ambz - 30);

        // St Mary's Church Ambleside
        makebox(28, 32, 50, 0xc0b098, ambx - 90, 16, ambz - 20);
        makebox(10, 55, 10, 0xb8a890, ambx - 80, 28, ambz - 20);

        // =============================================
        // KESWICK - town on Derwentwater
        // =============================================
        var kesx = cx - 800;
        var kesz = -600;

        // Town core
        makebox(50, 28, 40, 0xf5f0e8, kesx, 14, kesz);
        makebox(44, 24, 36, 0xeee8d8, kesx + 60, 12, kesz);
        makebox(40, 22, 34, 0xf0ebe0, kesx - 60, 11, kesz);
        makebox(46, 26, 38, 0xf5f0e8, kesx + 10, 13, kesz + 55);
        makebox(38, 20, 32, 0xeae5d5, kesx - 55, 10, kesz + 55);

        // Moot Hall - historic market hall
        makebox(28, 26, 40, 0xd8d0c0, kesx, 13, kesz - 60);
        // Moot Hall clocktower
        makebox(10, 40, 10, 0xd0c8b8, kesx, 33, kesz - 60);
        makebox(14, 6, 14, 0xc8c0b0, kesx, 56, kesz - 60);

        // Pencil Museum (Keswick is famous for its pencil factory)
        makebox(50, 22, 35, 0xe0d8c8, kesx + 100, 11, kesz + 120);
        // Giant pencil sculpture outside museum
        makecylinder(4, 4, 60, 6, 0xf5e642, kesx + 120, 30, kesz + 150);
        makecone(4, 14, 6, 0x333333, kesx + 120, 67, kesz + 150);

        // =============================================
        // DERWENTWATER - lake with wooded islands
        // =============================================
        var dwx = cx - 820;
        var dwz = -400;

        makebox(280, 8, 380, 0x006994, dwx, 2, dwz);
        makebox(240, 4, 340, 0x0077aa, dwx, 5, dwz);

        // St Herbert's Island
        makebox(60, 12, 60, 0x4a7a3a, dwx - 20, 6, dwz - 40);
        makecone(18, 50, 6, 0x2d5a1b, dwx - 20, 31, dwz - 40);
        makecone(14, 40, 6, 0x336622, dwx + 15, 26, dwz - 20);

        // Lord's Island
        makebox(40, 10, 40, 0x5a7a3a, dwx + 50, 5, dwz + 80);
        makecone(12, 35, 6, 0x2d5a1b, dwx + 50, 22, dwz + 80);

        // Rampsholme Island
        makebox(30, 8, 30, 0x4a6a2a, dwx - 60, 4, dwz + 100);
        makecone(10, 28, 6, 0x336622, dwx - 60, 18, dwz + 100);

        // Wooded western shore of Derwentwater
        makecone(26, 70, 6, 0x2d5a1b, dwx - 170, 35, dwz - 100);
        makecone(22, 60, 6, 0x336622, dwx - 168, 30, dwz + 50);
        makecone(24, 65, 6, 0x2a5218, dwx - 172, 33, dwz + 180);

        // =============================================
        // HARDKNOTT ROMAN FORT
        // =============================================
        var hrx = cx - 1600;
        var hrz = -500;

        // Fort sits on high ground
        makebox(500, 60, 500, 0x6a7060, hrx, 30, hrz);

        // Roman fort walls - perimeter
        makebox(160, 14, 8, 0x8b7355, hrx, 95, hrz - 80);
        makebox(160, 14, 8, 0x8b7355, hrx, 95, hrz + 80);
        makebox(8, 14, 160, 0x8b7355, hrx - 80, 95, hrz);
        makebox(8, 14, 160, 0x8b7355, hrx + 80, 95, hrz);

        // Corner towers
        makebox(16, 20, 16, 0x8b7355, hrx - 80, 100, hrz - 80);
        makebox(16, 20, 16, 0x8b7355, hrx + 80, 100, hrz - 80);
        makebox(16, 20, 16, 0x8b7355, hrx - 80, 100, hrz + 80);
        makebox(16, 20, 16, 0x8b7355, hrx + 80, 100, hrz + 80);

        // Principia (headquarters building) ruins
        makebox(50, 10, 40, 0x7a6445, hrx, 95, hrz - 10);
        makebox(4, 16, 40, 0x8b7355, hrx - 25, 100, hrz - 10);
        makebox(4, 16, 40, 0x8b7355, hrx + 25, 100, hrz - 10);

        // Parade ground
        makebox(100, 4, 120, 0x9a8a70, hrx, 92, hrz + 40);

        // =============================================
        // STONE WALLS - Distinctive Lakeland dry stone walls
        // =============================================

        // Walls running across hillsides near Scafell
        makebox(400, 10, 8, 0xc0c0c0, spx + 200, 55, spz + 300);
        makebox(8, 10, 300, 0xc0c0c0, spx + 400, 55, spz + 150);
        makebox(300, 10, 8, 0xc0c0c0, spx - 100, 50, spz + 400);
        makebox(8, 10, 250, 0xc0c0c0, spx - 300, 50, spz + 280);

        // Walls near Grasmere valley
        makebox(350, 10, 8, 0xc0c0c0, grx + 100, 48, grz + 150);
        makebox(8, 10, 280, 0xc0c0c0, grx + 280, 48, grz + 10);
        makebox(280, 10, 8, 0xc0c0c0, grx - 80, 46, grz - 150);

        // Walls near Ambleside
        makebox(300, 10, 8, 0xc0c0c0, ambx + 200, 45, ambz + 180);
        makebox(8, 10, 220, 0xc0c0c0, ambx + 360, 45, ambz + 70);
        makebox(250, 10, 8, 0xc0c0c0, ambx - 200, 44, ambz - 200);

        // =============================================
        // ADDITIONAL FELLS AND LANDSCAPE
        // =============================================

        // Helvellyn range
        var helx = cx + 100;
        var helz = -900;
        makebox(600, 120, 600, 0x7a8070, helx, 60, helz);
        makebox(400, 140, 400, 0x808878, helx, 220, helz);
        makebox(240, 120, 240, 0x848c80, helx, 380, helz);
        makebox(120, 90, 120, 0x8a9088, helx, 500, helz);
        makebox(60, 60, 60, 0x909090, helx, 590, helz);

        // Striding Edge - iconic ridge (series of thin boxes)
        makebox(180, 20, 20, 0x888888, helx - 160, 490, helz + 160);
        makebox(160, 16, 18, 0x848484, helx - 310, 460, helz + 280);

        // Langdale Pikes
        var lgx = cx - 400;
        var lgz = -600;
        makebox(400, 100, 400, 0x7a8070, lgx, 50, lgz);
        makebox(260, 120, 180, 0x808878, lgx - 60, 200, lgz);
        makebox(140, 100, 120, 0x848c80, lgx - 60, 360, lgz);
        // Pike of Stickle - distinctive cone shape
        makecone(60, 120, 6, 0x888888, lgx + 120, 310, lgz);

        // Ullswater - third largest lake
        var ulx = cx + 800;
        var ulz = -900;
        makebox(120, 8, 700, 0x006994, ulx, 2, ulz);
        makebox(100, 4, 600, 0x0077aa, ulx, 5, ulz);
        // Ullswater steamers jetty
        makebox(60, 6, 12, 0x8b6914, ulx + 70, 3, ulz - 100);

        // Buttermere
        var butx = cx - 1100;
        var butz = -200;
        makebox(90, 8, 280, 0x006994, butx, 2, butz);

        // High Spy ridge
        makebox(350, 80, 180, 0x7a8870, butx - 200, 40, butz - 200);
        makebox(280, 60, 160, 0x808878, butx - 200, 130, butz - 200);

        // Thirlmere reservoir
        var thix = cx + 50;
        var thiz = -700;
        makebox(70, 8, 500, 0x1a6680, thix, 2, thiz);

        // Rydal Water
        var rydx = cx - 60;
        var rydz = -440;
        makebox(80, 8, 160, 0x006994, rydx, 2, rydz);

        // Rydal Mount - Wordsworth's later home
        makebox(40, 24, 32, 0xf0e8d8, rydx - 120, 12, rydz - 80);
        makebox(44, 8, 36, 0x888070, rydx - 120, 28, rydz - 80);

        // =============================================
        // TREES across the landscape
        // =============================================
        makecone(20, 55, 6, 0x2d5a1b, cx - 500, 28, 200);
        makecone(18, 48, 6, 0x336622, cx - 480, 24, 260);
        makecone(22, 60, 6, 0x2a5218, cx - 520, 30, 180);
        makecone(16, 44, 6, 0x3a7228, cx + 400, 22, -400);
        makecone(20, 52, 6, 0x2d5a1b, cx + 420, 26, -350);
        makecone(18, 50, 6, 0x336622, cx + 380, 25, -450);

        // Broadleaf trees (sphere crowns on cylinder trunks)
        makecylinder(4, 4, 30, 5, 0x5c3d1e, cx + 250, 15, 300);
        makesphere(22, 7, 7, 0x3a6e28, cx + 250, 42, 300);
        makecylinder(4, 4, 28, 5, 0x5c3d1e, cx - 300, 14, 100);
        makesphere(20, 7, 7, 0x3d7a2a, cx - 300, 38, 100);
        makecylinder(3, 3, 25, 5, 0x5c3d1e, cx + 100, 13, 600);
        makesphere(18, 7, 7, 0x3a6e28, cx + 100, 35, 600);

        // =============================================
        // FARMSTEADS scattered across valley
        // =============================================

        // Hill Farm near Grasmere
        makebox(28, 16, 22, 0xd4c8b0, grx + 200, 8, grz + 200);
        makebox(16, 14, 12, 0xc8bca4, grx + 230, 7, grz + 190);
        makebox(32, 6, 26, 0x908070, grx + 200, 19, grz + 200);

        // Barn
        makebox(22, 18, 30, 0xc0b498, grx + 260, 9, grz + 220);
        makebox(26, 6, 34, 0x909080, grx + 260, 21, grz + 220);

        // Hill farm near Coniston
        makebox(26, 15, 20, 0xd0c4ac, conx - 200, 8, conz + 300);
        makebox(30, 5, 24, 0x908070, conx - 200, 18, conz + 300);

        // =============================================
        // ROADS - simple flat grey strips
        // =============================================
        // A591 main road
        makebox(16, 3, 1800, 0x888888, cx + 350, 2, 100);
        // Wrynose Pass - mountain road
        makebox(10, 3, 600, 0x808080, spx + 500, 60, spz + 600);
        makebox(10, 3, 400, 0x808080, spx + 300, 120, spz + 400);

        // =============================================
        // WATERFALLS
        // =============================================
        // Stock Ghyll Force near Ambleside
        makebox(8, 80, 8, 0x88ccdd, ambx + 20, 40, ambz - 200);
        makebox(12, 40, 10, 0x99ddee, ambx + 20, 8, ambz - 180);

        // Aira Force near Ullswater
        makebox(10, 60, 10, 0x88ccdd, ulx - 60, 30, ulz + 200);
        makebox(14, 20, 12, 0x99ddee, ulx - 60, 10, ulz + 220);

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
