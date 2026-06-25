window.ChelmsfordEssex = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var X = 12280;

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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function buildCathedral() {
        var bx = X + 0;
        var bz = -20;
        var flint = 0x8a8070;
        var stone = 0xc8b89a;
        var darkstone = 0x6a6055;
        var roof = 0x556644;

        // Nave
        makebox(22, 7, 10, flint, bx, 3.5, bz);
        // Nave clerestory
        makebox(18, 3, 8, stone, bx, 9, bz);
        // Nave roof
        makebox(20, 2, 11, roof, bx, 11.5, bz);

        // Tower base (12 high)
        makebox(8, 12, 8, darkstone, bx - 13, 6, bz);
        // Tower upper
        makebox(7, 3, 7, stone, bx - 13, 13.5, bz);
        // Tower battlements
        for (var bi = 0; bi < 4; bi++) {
            makebox(1.2, 1.5, 1.2, darkstone, bx - 15.5 + bi * 1.5, 15.5, bz - 3);
            makebox(1.2, 1.5, 1.2, darkstone, bx - 15.5 + bi * 1.5, 15.5, bz + 3);
        }
        // Lantern spire above tower
        makecone(2.5, 8, 8, darkstone, bx - 13, 20, bz);

        // South porch
        makebox(4, 5, 4, stone, bx + 2, 2.5, bz + 7);
        makecone(2, 3, 4, roof, bx + 2, 6.5, bz + 7);

        // Transept north
        makebox(8, 6, 8, flint, bx + 4, 3, bz - 9);
        makebox(7, 2, 7, roof, bx + 4, 7, bz - 9);

        // Transept south
        makebox(8, 6, 8, flint, bx + 4, 3, bz + 9);
        makebox(7, 2, 7, roof, bx + 4, 7, bz + 9);

        // Chancel / east end
        makebox(10, 7, 9, flint, bx + 14, 3.5, bz);
        makebox(9, 2, 10, roof, bx + 14, 8, bz);

        // Churchyard ground slab
        makebox(60, 0.2, 40, 0x7a9060, bx, 0.1, bz);

        // Grave markers
        for (var gi = 0; gi < 8; gi++) {
            makebox(0.4, 1.2, 0.15, 0x999988, bx + 10 + gi * 2, 0.6, bz + 12);
        }
        // Churchyard wall
        makebox(60, 1.5, 0.5, stone, bx, 0.75, bz + 20);
        makebox(60, 1.5, 0.5, stone, bx, 0.75, bz - 20);
    }

    function buildMarconi() {
        var bx = X + 60;
        var bz = 10;
        var brick = 0x9b4422;
        var metal = 0x888888;
        var darkgrey = 0x444444;

        // Heritage museum building (former factory)
        makebox(20, 6, 12, brick, bx, 3, bz);
        // Sawtooth roof (factory style)
        for (var ri = 0; ri < 4; ri++) {
            makebox(4, 0.3, 12, 0x555555, bx - 8 + ri * 5.5, 6.5, bz);
            makecone(2, 2, 3, 0x333333, bx - 8 + ri * 5.5, 7.5, bz);
        }
        // Museum entrance
        makebox(4, 5, 0.4, 0xccaa88, bx, 2.5, bz + 6.2);
        // Plaque wall
        makebox(6, 3, 0.5, brick, bx + 12, 1.5, bz);
        makebox(5, 2, 0.2, 0xd4af37, bx + 12, 1.5, bz + 0.35);

        // Marconi Radio Tower (LineSegments lattice mast)
        var points = [];
        var h = 30;
        var baseW = 3;
        for (var ti = 0; ti <= 20; ti++) {
            var frac = ti / 20;
            var w = baseW * (1 - frac * 0.85);
            var y = frac * h;
            // Square cross-section at each level
            points.push(bx + 30 - w, y, bz - w, bx + 30 + w, y, bz - w);
            points.push(bx + 30 + w, y, bz - w, bx + 30 + w, y, bz + w);
            points.push(bx + 30 + w, y, bz + w, bx + 30 - w, y, bz + w);
            points.push(bx + 30 - w, y, bz + w, bx + 30 - w, y, bz - w);
            // Diagonal braces to next level
            if (ti < 20) {
                var frac2 = (ti + 1) / 20;
                var w2 = baseW * (1 - frac2 * 0.85);
                var y2 = frac2 * h;
                points.push(bx + 30 - w, y, bz - w, bx + 30 + w2, y2, bz - w2);
                points.push(bx + 30 + w, y, bz - w, bx + 30 - w2, y2, bz - w2);
                points.push(bx + 30 - w, y, bz + w, bx + 30 + w2, y2, bz + w2);
                points.push(bx + 30 + w, y, bz + w, bx + 30 - w2, y2, bz + w2);
            }
        }
        // Vertical legs
        points.push(bx + 30 - baseW, 0, bz - baseW, bx + 30, h, bz);
        points.push(bx + 30 + baseW, 0, bz - baseW, bx + 30, h, bz);
        points.push(bx + 30 + baseW, 0, bz + baseW, bx + 30, h, bz);
        points.push(bx + 30 - baseW, 0, bz + baseW, bx + 30, h, bz);

        var verts = new Float32Array(points.length);
        for (var vi = 0; vi < points.length; vi++) {
            verts[vi] = points[vi];
        }
        var lsgeo = new THREE.BufferGeometry();
        lsgeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        var lsmat = new THREE.MeshLambertMaterial({ color: metal });
        var ls = new THREE.LineSegments(lsgeo, lsmat);
        scene.add(ls);
        objects.push(ls);

        // Antenna top disc
        makecyl(0.3, 0.3, 2, 8, darkgrey, bx + 30, h + 1, bz);

        // Ground pad for mast
        makecyl(4, 5, 0.5, 8, 0x888888, bx + 30, 0.25, bz);
    }

    function buildRiverChelmer() {
        var bx = X - 30;
        var bz = 60;
        var waterblue = 0x2266aa;
        var bankgreen = 0x4a7a3a;
        var stone = 0x999988;
        var brick = 0x885533;

        // River channel (elongated box)
        makebox(120, 0.8, 8, waterblue, bx, 0.0, bz);
        // River banks
        makebox(120, 0.5, 3, bankgreen, bx, 0.25, bz - 5.5);
        makebox(120, 0.5, 3, bankgreen, bx, 0.25, bz + 5.5);

        // Victorian canal basin
        makebox(20, 1, 20, waterblue, bx + 10, 0.0, bz + 18);
        makebox(22, 2, 0.8, stone, bx + 10, 1, bz + 7);
        makebox(22, 2, 0.8, stone, bx + 10, 1, bz + 29);
        makebox(0.8, 2, 22, stone, bx - 1, 1, bz + 18);
        makebox(0.8, 2, 22, stone, bx + 21, 1, bz + 18);

        // Towpath / quayside
        makebox(22, 0.4, 4, 0xaa9977, bx + 10, 0.2, bz + 32);
        // Wharf building
        makebox(10, 5, 6, brick, bx + 10, 2.5, bz + 37);
        makebox(10, 1, 7, 0x553322, bx + 10, 5.5, bz + 37);

        // Navigation Lock
        var lockZ = bz + 18;
        var lockX = bx - 20;
        makebox(10, 2.5, 0.8, stone, lockX, 1.25, lockZ - 4);
        makebox(10, 2.5, 0.8, stone, lockX, 1.25, lockZ + 4);
        makebox(0.8, 2.5, 8.6, stone, lockX - 5.1, 1.25, lockZ);
        makebox(0.8, 2.5, 8.6, stone, lockX + 5.1, 1.25, lockZ);
        // Lock water
        makebox(9.4, 0.5, 7.4, waterblue, lockX, 0.25, lockZ);
        // Lock gates (wooden beams)
        makebox(0.3, 2.5, 4, 0x5a3a1a, lockX - 0.3, 1.25, lockZ - 2);
        makebox(0.3, 2.5, 4, 0x5a3a1a, lockX + 0.3, 1.25, lockZ - 2);
        makebox(0.3, 2.5, 4, 0x5a3a1a, lockX - 0.3, 1.25, lockZ + 2);
        makebox(0.3, 2.5, 4, 0x5a3a1a, lockX + 0.3, 1.25, lockZ + 2);

        // River bridge
        makebox(10, 0.8, 1.5, stone, bx + 40, 0.8, bz);
        makebox(0.8, 3, 2, stone, bx + 35, 1.5, bz);
        makebox(0.8, 3, 2, stone, bx + 45, 1.5, bz);
    }

    function buildHylandsHouse() {
        var bx = X - 100;
        var bz = -80;
        var white = 0xf5f0e8;
        var cream = 0xede0c8;
        var parkgreen = 0x3d6b2a;
        var stone = 0xccbbaa;

        // Park landscape
        makebox(100, 0.2, 80, parkgreen, bx, 0.1, bz);

        // Palladian mansion main block
        makebox(24, 9, 14, white, bx, 4.5, bz);
        // Hipped roof
        makebox(23, 2.5, 13, 0xccccbb, bx, 9.75, bz);

        // Iconic portico columns (Ionic)
        for (var ci = 0; ci < 4; ci++) {
            makecyl(0.5, 0.5, 8, 8, cream, bx - 8 + ci * 3.5, 4, bz + 7.5);
            // Column capital
            makebox(1.2, 0.4, 1.2, cream, bx - 8 + ci * 3.5, 8.2, bz + 7.5);
        }
        // Portico entablature
        makebox(13, 1, 1, white, bx - 3.25, 8.5, bz + 7.5);
        // Portico pediment
        makecone(7, 3, 3, white, bx - 3.25, 10.5, bz + 7.5);

        // Portico floor
        makebox(14, 0.4, 3, stone, bx - 3.25, 0.2, bz + 7);

        // Side wings
        makebox(8, 6, 10, white, bx - 16, 3, bz);
        makebox(7.5, 1.5, 9.5, 0xccccbb, bx - 16, 6.75, bz);
        makebox(8, 6, 10, white, bx + 16, 3, bz);
        makebox(7.5, 1.5, 9.5, 0xccccbb, bx + 16, 6.75, bz);

        // Chimney stacks
        makebox(1.5, 3, 1.5, 0x999988, bx - 8, 11, bz - 4);
        makebox(1.5, 3, 1.5, 0x999988, bx + 8, 11, bz - 4);

        // Ice house (dome-roofed outbuilding)
        var ixZ = bz - 25;
        var ixX = bx + 35;
        makecyl(4, 4, 3, 12, stone, ixX, 1.5, ixZ);
        makesphere(4, 10, 8, stone, ixX, 4.5, ixZ);
        // Ice house door
        makebox(1.5, 2.5, 0.3, 0x553322, ixX, 1.25, ixZ + 4.1);

        // Park trees (cones on cylinders)
        var treepositions = [
            [bx - 35, bz - 15], [bx - 38, bz + 10], [bx + 35, bz - 20],
            [bx + 40, bz + 15], [bx - 20, bz - 30], [bx + 20, bz - 32],
            [bx - 42, bz - 25], [bx + 45, bz - 5]
        ];
        for (var ti = 0; ti < treepositions.length; ti++) {
            var tx = treepositions[ti][0];
            var tz = treepositions[ti][1];
            makecyl(0.4, 0.4, 2, 6, 0x5a3a1a, tx, 1, tz);
            makecone(2, 4, 7, 0x2d5a1a, tx, 5, tz);
        }

        // Park perimeter fence posts
        for (var fi = 0; fi < 10; fi++) {
            makebox(0.2, 1.5, 0.2, 0x7a6a5a, bx - 48 + fi * 10, 0.75, bz - 40);
        }
        // Driveway
        makebox(6, 0.3, 30, 0xbbaa99, bx, 0.15, bz + 22);
    }

    function buildTownCentre() {
        var bx = X + 30;
        var bz = -60;
        var modernwhite = 0xddddcc;
        var glass = 0x99bbcc;
        var georgian = 0xccb888;
        var stone = 0xc0a870;
        var brick = 0xaa6644;

        // High Chelmer Shopping Centre (modern mall)
        // Main block
        makebox(40, 8, 20, modernwhite, bx, 4, bz);
        // Flat roof parapet
        makebox(41, 1, 21, 0xbbbbaa, bx, 8.5, bz);
        // Glazed atrium spine
        makebox(38, 9, 4, glass, bx, 4.5, bz);
        // Atrium roof ridge
        makecone(20, 3, 3, glass, bx, 10.5, bz);
        // Mall entrances
        makebox(6, 6, 0.4, glass, bx - 12, 3, bz + 10.2);
        makebox(6, 6, 0.4, glass, bx + 12, 3, bz + 10.2);
        // Service wing
        makebox(10, 5, 15, brick, bx + 22, 2.5, bz - 8);
        makebox(10, 1, 15.5, 0x888888, bx + 22, 5.5, bz - 8);

        // Car park structure (multi-storey)
        makebox(20, 10, 15, 0xcccccc, bx - 30, 5, bz - 5);
        for (var cpi = 0; cpi < 3; cpi++) {
            makebox(20.2, 0.4, 15, 0xbbbbbb, bx - 30, 2 + cpi * 3.5, bz - 5);
        }

        // Shire Hall (Georgian, columns + pediment)
        var shx = bx + 55;
        var shz = bz + 10;
        // Main hall body
        makebox(20, 9, 14, georgian, shx, 4.5, shz);
        // Roof / hipped
        makebox(19, 2, 13, 0x9a8860, shx, 10, shz);
        // Chimney stacks
        makebox(1.2, 3, 1.2, 0x887755, shx - 6, 12, shz);
        makebox(1.2, 3, 1.2, 0x887755, shx + 6, 12, shz);
        // Portico columns
        for (var sci = 0; sci < 4; sci++) {
            makecyl(0.5, 0.5, 7, 8, stone, shx - 6 + sci * 4, 3.5, shz + 7.5);
            makebox(1.1, 0.5, 1.1, stone, shx - 6 + sci * 4, 7.25, shz + 7.5);
        }
        // Entablature
        makebox(15, 1, 1.2, stone, shx, 7.5, shz + 7.5);
        // Pediment
        makecone(8, 4, 3, georgian, shx, 10, shz + 7.5);
        // Steps
        makebox(16, 0.5, 2, stone, shx, 0.25, shz + 10);
        makebox(14, 0.5, 2, stone, shx, 0.75, shz + 9);

        // Town centre ground paving
        makebox(80, 0.2, 50, 0xbbaa99, bx + 15, 0.1, bz + 5);

        // Street furniture — lamp posts
        var lamppos = [
            [bx - 5, bz + 14], [bx + 5, bz + 14], [bx + 20, bz + 14],
            [shx - 10, shz + 14], [shx + 10, shz + 14]
        ];
        for (var li = 0; li < lamppos.length; li++) {
            makecyl(0.1, 0.1, 4, 5, 0x888888, lamppos[li][0], 2, lamppos[li][1]);
            makesphere(0.3, 5, 4, 0xffffcc, lamppos[li][0], 4.3, lamppos[li][1]);
        }
    }

    function build() {
        buildCathedral();
        buildMarconi();
        buildRiverChelmer();
        buildHylandsHouse();
        buildTownCentre();

        // Ground plane for whole module
        makebox(320, 0.2, 280, 0x6a8a5a, X - 10, -0.1, -10);
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
