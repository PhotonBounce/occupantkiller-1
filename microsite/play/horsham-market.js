window.HorshamMarket = (function() {
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

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makelines(verts, color, x, y, z) {
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        var mat = new THREE.LineBasicMaterial({ color: color });
        var mesh = new THREE.LineSegments(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function build() {
        buildground();
        buildcarfax();
        buildcauseway();
        buildchristshospital();
        buildstmarys();
        buildhorshampark();
        buildpiriesplace();
    }

    function buildground() {
        var X = 13160;
        // Ground plane for the whole area
        makebox(600, 0.5, 600, 0x8B7355, X, -0.25, 0);
        // Main road surface (A281 / A24 corridor)
        makebox(14, 0.6, 500, 0x555555, X, 0.05, 0);
        makebox(500, 0.6, 14, 0x555555, X, 0.05, 0);
    }

    function buildcarfax() {
        var X = 13160;
        var Z = 0;
        // The Carfax — central market square
        // Paved square
        makebox(80, 0.3, 80, 0xC8B88A, X, 0.15, Z);

        // Bandstand — central Victorian ironwork structure
        // Base platform
        makecylinder(8, 8, 0.8, 12, 0x888888, X, 0.4, Z);
        // Support columns (8 columns around)
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var cx = X + Math.cos(angle) * 6;
            var cz = Z + Math.sin(angle) * 6;
            makecylinder(0.2, 0.2, 4, 8, 0x444444, cx, 2.4, cz);
        }
        // Bandstand roof
        makecone(8, 3, 12, 0x2B5C2B, X, 6, Z);
        // Central pole
        makecylinder(0.15, 0.15, 6, 8, 0x333333, X, 3, Z);

        // Market stalls (rows around the square)
        // North stalls
        for (var s = 0; s < 5; s++) {
            makebox(4, 2.5, 3, 0xCC4422, X - 14 + s * 7, 1.25, Z - 28);
            makebox(4.5, 0.2, 3.5, 0xDD6633, X - 14 + s * 7, 2.6, Z - 28);
        }
        // South stalls
        for (var s = 0; s < 5; s++) {
            makebox(4, 2.5, 3, 0x22AA44, X - 14 + s * 7, 1.25, Z + 28);
            makebox(4.5, 0.2, 3.5, 0x33BB55, X - 14 + s * 7, 2.6, Z + 28);
        }
        // East stalls
        for (var s = 0; s < 3; s++) {
            makebox(3, 2.5, 4, 0x4488CC, X + 28, 1.25, Z - 7 + s * 7);
            makebox(3.5, 0.2, 4.5, 0x5599DD, X + 28, 2.6, Z - 7 + s * 7);
        }

        // Georgian buildings surrounding the square
        // North Georgian terrace
        makebox(80, 12, 10, 0xD4A96A, X, 6, Z - 44);
        makebox(80, 0.5, 10, 0xC8C8C8, X, 12.25, Z - 44);
        // Windows north
        for (var w = 0; w < 8; w++) {
            makebox(2.5, 3.5, 0.3, 0x88AACC, X - 31 + w * 9, 6, Z - 38.8);
            makebox(2.5, 3.5, 0.3, 0x88AACC, X - 31 + w * 9, 9.5, Z - 38.8);
        }

        // South Georgian terrace
        makebox(80, 12, 10, 0xC8A060, X, 6, Z + 44);
        makebox(80, 0.5, 10, 0xC8C8C8, X, 12.25, Z + 44);

        // East Georgian block
        makebox(10, 12, 60, 0xD4A96A, X + 44, 6, Z);
        makebox(10, 0.5, 60, 0xC8C8C8, X + 44, 12.25, Z);

        // Old Town Hall — west side
        makebox(20, 14, 12, 0xB8935A, X - 44, 7, Z);
        // Town hall roof
        makebox(21, 1, 13, 0x888888, X - 44, 14, Z);
        // Town hall columns
        for (var c = 0; c < 4; c++) {
            makecylinder(0.4, 0.4, 10, 8, 0xDDDDDD, X - 38 + c * 4, 5, Z - 5.5);
        }
        // Town hall clock tower
        makebox(6, 8, 6, 0xC8A060, X - 44, 18, Z);
        makecylinder(3.5, 3.5, 0.5, 8, 0x888888, X - 44, 22.25, Z);

        // Lamp posts around Carfax
        for (var lp = 0; lp < 4; lp++) {
            var lpangle = (lp / 4) * Math.PI * 2 + Math.PI / 4;
            var lpx = X + Math.cos(lpangle) * 22;
            var lpz = Z + Math.sin(lpangle) * 22;
            makecylinder(0.15, 0.2, 5, 6, 0x333344, lpx, 2.5, lpz);
            makesphere(0.4, 6, 6, 0xFFFF99, lpx, 5.2, lpz);
        }
    }

    function buildcauseway() {
        var X = 13160;
        var Z = 120;
        // The Causeway — medieval cobbled street running north-south
        // Cobbled road surface
        makebox(10, 0.4, 150, 0x9A8A7A, X - 120, 0.2, Z);
        // Pavement each side
        makebox(3, 0.5, 150, 0xB0A090, X - 126, 0.25, Z);
        makebox(3, 0.5, 150, 0xB0A090, X - 114, 0.25, Z);

        // Timber-framed Wealden buildings — left side
        for (var b = 0; b < 6; b++) {
            var bz = Z - 62 + b * 22;
            // Main structure
            makebox(10, 7, 9, 0xF0E8D0, X - 134, 3.5, bz);
            // Timber frame overlay (dark beams)
            makebox(10, 0.4, 0.3, 0x3B2A1A, X - 134, 1.5, bz - 4.35);
            makebox(10, 0.4, 0.3, 0x3B2A1A, X - 134, 3.5, bz - 4.35);
            makebox(10, 0.4, 0.3, 0x3B2A1A, X - 134, 5.5, bz - 4.35);
            makebox(0.4, 7, 0.3, 0x3B2A1A, X - 129, 3.5, bz - 4.35);
            makebox(0.4, 7, 0.3, 0x3B2A1A, X - 134, 3.5, bz - 4.35);
            makebox(0.4, 7, 0.3, 0x3B2A1A, X - 139, 3.5, bz - 4.35);
            // Pitched roof
            makebox(11, 0.4, 10, 0x8B3A3A, X - 134, 7.2, bz);
        }

        // Horsham Museum — right side, prominent medieval building
        // Main museum building
        makebox(18, 9, 14, 0xE8D8B0, X - 106, 4.5, Z - 30);
        // Museum timber framing
        for (var mf = 0; mf < 4; mf++) {
            makebox(0.4, 9, 0.3, 0x2A1A0A, X - 97 + mf * 6, 4.5, Z - 36.8);
        }
        makebox(18, 0.4, 0.3, 0x2A1A0A, X - 106, 2, Z - 36.8);
        makebox(18, 0.4, 0.3, 0x2A1A0A, X - 106, 5, Z - 36.8);
        makebox(18, 0.4, 0.3, 0x2A1A0A, X - 106, 8, Z - 36.8);
        // Museum roof
        makebox(19, 0.5, 15, 0x7A3030, X - 106, 9.25, Z - 30);
        // Museum sign/entrance
        makebox(4, 3, 0.3, 0x886644, X - 106, 2, Z - 23);
        // Museum gate posts
        makebox(0.6, 4, 0.6, 0x886644, X - 109, 2, Z - 22);
        makebox(0.6, 4, 0.6, 0x886644, X - 103, 2, Z - 22);

        // Right side timber buildings
        for (var rb = 0; rb < 4; rb++) {
            var rbz = Z + 10 + rb * 22;
            makebox(10, 8, 9, 0xF0E8C8, X - 106, 4, rbz);
            makebox(10, 0.4, 0.3, 0x3B2A1A, X - 106, 2, rbz - 4.35);
            makebox(10, 0.4, 0.3, 0x3B2A1A, X - 106, 5, rbz - 4.35);
            makebox(0.4, 8, 0.3, 0x3B2A1A, X - 101, 4, rbz - 4.35);
            makebox(0.4, 8, 0.3, 0x3B2A1A, X - 111, 4, rbz - 4.35);
            makebox(10, 0.4, 10, 0x8B3A3A, X - 106, 8.2, rbz);
        }

        // Ancient trees along Causeway
        for (var t = 0; t < 8; t++) {
            var tz = Z - 70 + t * 20;
            makecylinder(0.5, 0.7, 6, 8, 0x5C3D1E, X - 120, 3, tz);
            makesphere(3.5, 8, 6, 0x2A6A20, X - 120, 8, tz);
        }
    }

    function buildchristshospital() {
        var X = 13160;
        var Z = -280;
        // Christ's Hospital School — Victorian charity school
        // Playing fields
        makebox(200, 0.3, 160, 0x4A8A3A, X + 100, 0.15, Z);

        // Main school building (Tudor-style blue/yellow)
        // Central hall
        makebox(60, 16, 18, 0x4A5A8A, X + 100, 8, Z - 60);
        // Blue roof
        makebox(62, 1, 20, 0x3A4A7A, X + 100, 16.5, Z - 60);
        // Yellow Tudor trim
        makebox(60, 1.5, 18.5, 0xCCAA00, X + 100, 3, Z - 60);
        makebox(60, 1.5, 18.5, 0xCCAA00, X + 100, 8, Z - 60);
        makebox(60, 1.5, 18.5, 0xCCAA00, X + 100, 13, Z - 60);
        // Windows
        for (var cw = 0; cw < 8; cw++) {
            makebox(3, 5, 0.4, 0x88AACC, X + 70 + cw * 8, 6, Z - 51.2);
            makebox(3, 5, 0.4, 0x88AACC, X + 70 + cw * 8, 11, Z - 51.2);
        }
        // East wing
        makebox(18, 14, 60, 0x4A5A8A, X + 139, 7, Z - 30);
        makebox(19, 1, 61, 0x3A4A7A, X + 139, 14.5, Z - 30);
        // West wing
        makebox(18, 14, 60, 0x4A5A8A, X + 61, 7, Z - 30);
        makebox(19, 1, 61, 0x3A4A7A, X + 61, 14.5, Z - 30);

        // Chapel — central Gothic feature
        makebox(16, 20, 26, 0x8890AA, X + 100, 10, Z + 20);
        // Chapel roof/gable
        makebox(17, 1, 27, 0x6680AA, X + 100, 20.5, Z + 20);
        makecone(5, 8, 4, 0x6680AA, X + 100, 25, Z + 20);
        // Chapel windows (pointed arches)
        for (var chw = 0; chw < 4; chw++) {
            makebox(2.5, 7, 0.5, 0x88BBDD, X + 93 + chw * 5, 10, Z + 7.3);
        }
        // Chapel bell tower
        makebox(6, 28, 6, 0x8890AA, X + 100, 14, Z + 8);
        makecone(4.5, 5, 8, 0x4A5A8A, X + 100, 29.5, Z + 8);

        // Quadrangle walls
        makebox(70, 3, 1.5, 0xB0A080, X + 100, 1.5, Z - 5);
        makebox(1.5, 3, 50, 0xB0A080, X + 65, 1.5, Z - 30);
        makebox(1.5, 3, 50, 0xB0A080, X + 135, 1.5, Z - 30);

        // Dormitory blocks
        for (var db = 0; db < 3; db++) {
            makebox(18, 10, 30, 0x5A6A9A, X + 72 + db * 28, 5, Z + 55);
            makebox(19, 1, 31, 0x4A5A8A, X + 72 + db * 28, 10.5, Z + 55);
        }

        // Playing field posts
        makecylinder(0.2, 0.2, 8, 6, 0xFFFFFF, X + 40, 4, Z + 10);
        makecylinder(0.2, 0.2, 8, 6, 0xFFFFFF, X + 40, 4, Z - 10);
        makebox(0.15, 0.15, 7, 0xFFFFFF, X + 40, 8, Z);
        makecylinder(0.2, 0.2, 8, 6, 0xFFFFFF, X + 160, 4, Z + 10);
        makecylinder(0.2, 0.2, 8, 6, 0xFFFFFF, X + 160, 4, Z - 10);
        makebox(0.15, 0.15, 7, 0xFFFFFF, X + 160, 8, Z);
    }

    function buildstmarys() {
        var X = 13160;
        var Z = 180;
        // St Mary's Church — 13th century
        // Nave
        makebox(18, 9, 36, 0xB0A888, X - 60, 4.5, Z);
        // Nave roof
        makebox(19, 0.5, 37, 0x887070, X - 60, 9.25, Z);
        // Chancel
        makebox(12, 8, 20, 0xB0A888, X - 60, 4, Z + 28);
        makebox(13, 0.5, 21, 0x887070, X - 60, 8.25, Z + 28);

        // Tower with broach spire
        makebox(8, 14, 8, 0xA09878, X - 60, 7, Z - 24);
        // Tower roof/battlements
        makebox(8.5, 1, 8.5, 0x909070, X - 60, 14.5, Z - 24);
        // Battlement merlons
        for (var bm = 0; bm < 4; bm++) {
            makebox(1.2, 1.5, 1.2, 0x909070, X - 63.5 + bm * 2.5, 15.75, Z - 27);
            makebox(1.2, 1.5, 1.2, 0x909070, X - 63.5 + bm * 2.5, 15.75, Z - 21);
            makebox(1.2, 1.5, 1.2, 0x909070, X - 64.5, 15.75, Z - 24.5 + bm * 2.5);
            makebox(1.2, 1.5, 1.2, 0x909070, X - 55.5, 15.75, Z - 24.5 + bm * 2.5);
        }
        // Broach spire
        makecone(5.5, 22, 8, 0x8A8A70, X - 60, 26, Z - 24);

        // Church porch
        makebox(5, 5, 4, 0xB0A888, X - 51, 2.5, Z - 8);
        makebox(5.5, 0.5, 4.5, 0x887070, X - 51, 5.25, Z - 8);

        // Church windows (lancets)
        for (var sw = 0; sw < 4; sw++) {
            makebox(2, 4.5, 0.4, 0x99BBCC, X - 51, 5, Z - 17 + sw * 9);
            makebox(2, 4.5, 0.4, 0x99BBCC, X - 69, 5, Z - 17 + sw * 9);
        }

        // Churchyard wall
        makebox(60, 1.5, 0.8, 0x909070, X - 60, 0.75, Z - 46);
        makebox(60, 1.5, 0.8, 0x909070, X - 60, 0.75, Z + 50);
        makebox(0.8, 1.5, 96, 0x909070, X - 90, 0.75, Z + 2);
        makebox(0.8, 1.5, 96, 0x909070, X - 30, 0.75, Z + 2);

        // Ancient yew trees in churchyard
        makecylinder(0.7, 1, 5, 8, 0x3D2B1A, X - 75, 2.5, Z - 38);
        makesphere(4.5, 8, 6, 0x1A4A1A, X - 75, 7.5, Z - 38);
        makecylinder(0.7, 1, 5, 8, 0x3D2B1A, X - 45, 2.5, Z + 40);
        makesphere(4.5, 8, 6, 0x1A4A1A, X - 45, 7.5, Z + 40);
        makecylinder(0.7, 1, 5, 8, 0x3D2B1A, X - 80, 2.5, Z + 20);
        makesphere(4, 8, 6, 0x1A4A1A, X - 80, 7, Z + 20);

        // Gravestones
        for (var gs = 0; gs < 10; gs++) {
            var gsx = X - 85 + Math.floor(gs * 13) % 50;
            var gsz = Z - 35 + Math.floor(gs * 17) % 70;
            makebox(0.3, 1.2, 0.8, 0x888880, gsx, 0.6, gsz);
        }
    }

    function buildhorshampark() {
        var X = 13160;
        var Z = -100;
        // Horsham Park — town park
        // Park grass
        makebox(140, 0.3, 120, 0x4A9A4A, X - 200, 0.15, Z);

        // Ornamental lake
        makebox(40, 0.2, 30, 0x2A6A9A, X - 200, 0.05, Z - 20);

        // Fountain in lake
        makecylinder(4, 5, 0.5, 12, 0x888899, X - 200, 0.35, Z - 20);
        makecylinder(0.4, 0.5, 3, 8, 0x888899, X - 200, 1.85, Z - 20);
        makesphere(1.5, 8, 8, 0x99AABB, X - 200, 3.85, Z - 20);
        // Fountain jets (thin cylinders)
        for (var fj = 0; fj < 6; fj++) {
            var fjangle = (fj / 6) * Math.PI * 2;
            var fjx = X - 200 + Math.cos(fjangle) * 2;
            var fjz = Z - 20 + Math.sin(fjangle) * 2;
            makecylinder(0.08, 0.08, 2, 4, 0xAABBDD, fjx, 2.35, fjz);
        }

        // Ornamental gardens — flower beds
        makebox(12, 0.4, 8, 0xDD6688, X - 175, 0.3, Z + 25);
        makebox(12, 0.4, 8, 0xDDAA00, X - 200, 0.3, Z + 25);
        makebox(12, 0.4, 8, 0x8844CC, X - 225, 0.3, Z + 25);
        makebox(12, 0.4, 8, 0xEE4444, X - 175, 0.3, Z + 38);
        makebox(12, 0.4, 8, 0x44AA44, X - 200, 0.3, Z + 38);
        makebox(12, 0.4, 8, 0xEEAA22, X - 225, 0.3, Z + 38);

        // Park paths
        makebox(3, 0.35, 120, 0xC8B890, X - 185, 0.175, Z);
        makebox(140, 0.35, 3, 0xC8B890, X - 200, 0.175, Z);

        // Victorian pavilion
        makebox(14, 4, 8, 0xEEDDCC, X - 240, 2, Z + 40);
        makebox(16, 0.5, 10, 0x998877, X - 240, 4.25, Z + 40);
        // Pavilion columns
        for (var pc = 0; pc < 4; pc++) {
            makecylinder(0.3, 0.3, 4, 8, 0xDDDDCC, X - 246 + pc * 4, 2, Z + 35.5);
        }
        // Pavilion peaked roof
        makecone(9, 4, 4, 0x998877, X - 240, 6.5, Z + 40);

        // Park trees
        for (var pt = 0; pt < 12; pt++) {
            var ptx = X - 265 + Math.floor(pt * 17) % 130;
            var ptz = Z - 55 + Math.floor(pt * 23) % 110;
            makecylinder(0.5, 0.7, 6, 7, 0x5C3D1E, ptx, 3, ptz);
            makesphere(4, 7, 6, 0x2A7A20, ptx, 8.5, ptz);
        }

        // Sports pitches markings
        makebox(60, 0.32, 0.5, 0xFFFFFF, X - 200, 0.16, Z - 55);
        makebox(60, 0.32, 0.5, 0xFFFFFF, X - 200, 0.16, Z - 85);
        makebox(0.5, 0.32, 30, 0xFFFFFF, X - 170, 0.16, Z - 70);
        makebox(0.5, 0.32, 30, 0xFFFFFF, X - 230, 0.16, Z - 70);

        // Goal posts
        makecylinder(0.2, 0.2, 5, 6, 0xFFFFFF, X - 184, 2.5, Z - 55);
        makecylinder(0.2, 0.2, 5, 6, 0xFFFFFF, X - 216, 2.5, Z - 55);
        makebox(0.15, 0.15, 32, 0xFFFFFF, X - 200, 5, Z - 55);
    }

    function buildpiriesplace() {
        var X = 13160;
        var Z = 60;
        // Piries Place — modern shopping precinct
        // Pedestrian surface
        makebox(80, 0.4, 50, 0xCCBBAA, X + 120, 0.2, Z);

        // Anchor stores
        // Large department store east
        makebox(30, 8, 18, 0xDDDDDD, X + 155, 4, Z);
        makebox(31, 0.5, 19, 0x999999, X + 155, 8.25, Z);
        // Store sign panels
        makebox(20, 2.5, 0.4, 0x2244AA, X + 155, 7, Z - 9.2);
        // Windows
        for (var sw2 = 0; sw2 < 5; sw2++) {
            makebox(3.5, 4.5, 0.3, 0xAABBCC, X + 142 + sw2 * 6, 4.5, Z - 9.2);
        }

        // Smaller shops (units)
        for (var sh = 0; sh < 6; sh++) {
            makebox(10, 6, 12, 0xEEEEEE, X + 95 + sh * 13, 3, Z - 15);
            makebox(10.5, 0.5, 12.5, 0xCCCCCC, X + 95 + sh * 13, 6.25, Z - 15);
            // Shopfronts
            makebox(7, 3.5, 0.3, 0x88AACC, X + 95 + sh * 13, 2.75, Z - 21.2);
        }

        // Shops on south side
        for (var sh2 = 0; sh2 < 5; sh2++) {
            makebox(12, 6, 14, 0xE8E8E8, X + 95 + sh2 * 14, 3, Z + 18);
            makebox(12.5, 0.5, 14.5, 0xCCCCCC, X + 95 + sh2 * 14, 6.25, Z + 18);
            makebox(9, 3.5, 0.3, 0x88AACC, X + 95 + sh2 * 14, 2.75, Z + 25.2);
        }

        // Precinct lamp posts
        for (var plp = 0; plp < 5; plp++) {
            makecylinder(0.15, 0.2, 5, 6, 0x445566, X + 100 + plp * 15, 2.5, Z);
            makesphere(0.4, 6, 6, 0xFFFFCC, X + 100 + plp * 15, 5.2, Z);
        }

        // Car park multi-storey behind precinct
        makebox(40, 15, 25, 0xCCCCBB, X + 120, 7.5, Z - 45);
        // Car park ramps/floors
        makebox(39, 0.4, 24, 0xBBBBAA, X + 120, 5, Z - 45);
        makebox(39, 0.4, 24, 0xBBBBAA, X + 120, 10, Z - 45);
        // Car park openings
        for (var co = 0; co < 5; co++) {
            makebox(4, 4, 0.4, 0x888888, X + 100 + co * 8, 7, Z - 57.7);
        }

        // Planters / seating
        for (var pl = 0; pl < 4; pl++) {
            makebox(2.5, 1, 2.5, 0xAA9977, X + 105 + pl * 16, 0.5, Z);
            makesphere(1.2, 6, 5, 0x339933, X + 105 + pl * 16, 1.8, Z);
        }
        // Benches
        for (var bn = 0; bn < 4; bn++) {
            makebox(4, 0.3, 1, 0x886633, X + 110 + bn * 16, 0.8, Z + 4);
            makebox(0.3, 0.8, 1, 0x886633, X + 108 + bn * 16, 0.4, Z + 4);
            makebox(0.3, 0.8, 1, 0x886633, X + 114 + bn * 16, 0.4, Z + 4);
        }
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
