window.HerefordKeep = (function() {
    'use strict';

    var WX = 3160;
    var WZ = 2200;

    function makebox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    function makesphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    function makecone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    function makeedges(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(WX + x, y, WZ + z);
        scene.add(lines);
        return lines;
    }

    function buildcathedral(scene) {
        // Main nave body — warm Norman sandstone
        makebox(scene, 36, 12, 16, 0xD4A097, 0, 6, 0);
        // Central tower rising above crossing
        makebox(scene, 8, 24, 8, 0xC89080, 0, 12, 0);
        // Tower pinnacle / parapet level
        makebox(scene, 9, 2, 9, 0xBE8070, 0, 24.5, 0);
        // West front towers (pair)
        makebox(scene, 5, 20, 5, 0xC89080, -17, 10, 0);
        makebox(scene, 5, 20, 5, 0xC89080, 17, 10, 0);
        // West front pinnacle caps
        makecone(scene, 3, 5, 4, 0xA07060, -17, 22, 0);
        makecone(scene, 3, 5, 4, 0xA07060, 17, 22, 0);
        // Central tower spire suggestion
        makecone(scene, 4, 8, 4, 0xA07060, 0, 27, 0);
        // Transepts (north and south arms)
        makebox(scene, 10, 10, 8, 0xD4A097, 0, 5, 14);
        makebox(scene, 10, 10, 8, 0xD4A097, 0, 5, -14);
        // Apse / east end choir
        makebox(scene, 14, 10, 10, 0xD2A090, 20, 5, 0);
        // Buttresses along nave — north side
        makebox(scene, 2, 10, 3, 0xBE8878, -14, 5, 10);
        makebox(scene, 2, 10, 3, 0xBE8878, -6, 5, 10);
        makebox(scene, 2, 10, 3, 0xBE8878, 6, 5, 10);
        makebox(scene, 2, 10, 3, 0xBE8878, 14, 5, 10);
        // Buttresses along nave — south side
        makebox(scene, 2, 10, 3, 0xBE8878, -14, 5, -10);
        makebox(scene, 2, 10, 3, 0xBE8878, -6, 5, -10);
        makebox(scene, 2, 10, 3, 0xBE8878, 6, 5, -10);
        makebox(scene, 2, 10, 3, 0xBE8878, 14, 5, -10);
        // Norman pier blocks visible at nave level (interior piers suggestion)
        makebox(scene, 2, 8, 2, 0xC09080, -10, 4, 4);
        makebox(scene, 2, 8, 2, 0xC09080, -10, 4, -4);
        makebox(scene, 2, 8, 2, 0xC09080, 0, 4, 4);
        makebox(scene, 2, 8, 2, 0xC09080, 0, 4, -4);
        makebox(scene, 2, 8, 2, 0xC09080, 10, 4, 4);
        makebox(scene, 2, 8, 2, 0xC09080, 10, 4, -4);
        // Window outline edges on nave south wall
        makeedges(scene, 3, 4, 0.2, 0x7A5040, -12, 8, -8.1);
        makeedges(scene, 3, 4, 0.2, 0x7A5040, -6, 8, -8.1);
        makeedges(scene, 3, 4, 0.2, 0x7A5040, 0, 8, -8.1);
        makeedges(scene, 3, 4, 0.2, 0x7A5040, 6, 8, -8.1);
        makeedges(scene, 3, 4, 0.2, 0x7A5040, 12, 8, -8.1);
        // Mappa Mundi display room attached on south-east
        makebox(scene, 8, 6, 8, 0xC8A090, 24, 3, -10);
        // Mappa Mundi room roof
        makebox(scene, 8.5, 1, 8.5, 0xB89080, 24, 6.5, -10);
    }

    function buildchainedlibrary(scene) {
        // Chained library building attached north-east of cathedral
        makebox(scene, 8, 4, 6, 0x9A8A78, -22, 2, -10);
        // Library roof (slightly pitched suggestion)
        makebox(scene, 8.5, 1, 6.5, 0x8A7A68, -22, 4.5, -10);
        // Small porch
        makebox(scene, 3, 3, 2, 0x9A8A78, -22, 1.5, -14);
        // Window edges
        makeedges(scene, 2, 2, 0.2, 0x6A5A48, -19, 3, -10);
        makeedges(scene, 2, 2, 0.2, 0x6A5A48, -25, 3, -10);
    }

    function buildherefordbridge(scene) {
        // Main bridge deck
        makebox(scene, 28, 3, 5, 0x9A8A78, -40, 1.5, 50);
        // Six arch piers below deck
        makebox(scene, 2, 3, 5, 0x8A7A68, -50, 0, 50);
        makebox(scene, 2, 3, 5, 0x8A7A68, -44, 0, 50);
        makebox(scene, 2, 3, 5, 0x8A7A68, -38, 0, 50);
        makebox(scene, 2, 3, 5, 0x8A7A68, -32, 0, 50);
        makebox(scene, 2, 3, 5, 0x8A7A68, -26, 0, 50);
        makebox(scene, 2, 3, 5, 0x8A7A68, -20, 0, 50);
        // Bridge parapets
        makebox(scene, 28, 1, 0.5, 0xAA9A88, -40, 3.5, 47.5);
        makebox(scene, 28, 1, 0.5, 0xAA9A88, -40, 3.5, 52.5);
        // Bridge approach ramp hints
        makebox(scene, 4, 1, 5, 0x9A8A78, -55, 0.5, 50);
        makebox(scene, 4, 1, 5, 0x9A8A78, -25, 0.5, 50);
    }

    function buildriverwye(scene) {
        // River Wye — clear green-blue water boxes winding through city
        // Main channel sections
        makebox(scene, 60, 0.5, 12, 0x1A8A4A, -30, 0.25, 50);
        makebox(scene, 30, 0.5, 14, 0x1A8A4A, -60, 0.25, 45);
        makebox(scene, 40, 0.5, 12, 0x1A8A4A, 10, 0.25, 52);
        makebox(scene, 20, 0.5, 14, 0x1A8A4A, 40, 0.25, 48);
        // Upstream bend sections
        makebox(scene, 12, 0.5, 30, 0x1A8A4A, -72, 0.25, 30);
        makebox(scene, 14, 0.5, 20, 0x1A8A4A, 55, 0.25, 35);
        // Shallow bank shading
        makebox(scene, 60, 0.2, 3, 0x2A9A5A, -30, 0.1, 57);
        makebox(scene, 60, 0.2, 3, 0x2A9A5A, -30, 0.1, 43);
    }

    function buildciderfactory(scene) {
        // Bulmer's Cider Mill main factory building
        makebox(scene, 30, 8, 15, 0xD4A97A, 60, 4, -20);
        // Factory roof
        makebox(scene, 31, 1.5, 16, 0xC49060, 60, 8.5, -20);
        // Side warehouse extension
        makebox(scene, 14, 6, 12, 0xCC9F70, 78, 3, -20);
        // Chimney stack
        makecylinder(scene, 1, 1.5, 14, 8, 0x887060, 48, 7, -14);
        // Apple pressing cylinders (vertical press drums)
        makecylinder(scene, 2, 2, 5, 10, 0xB08858, 52, 2.5, -22);
        makecylinder(scene, 2, 2, 5, 10, 0xB08858, 52, 2.5, -17);
        makecylinder(scene, 2, 2, 5, 10, 0xB08858, 57, 2.5, -22);
        makecylinder(scene, 2, 2, 5, 10, 0xB08858, 57, 2.5, -17);
        // Cider storage vats (large cylinders)
        makecylinder(scene, 3, 3, 7, 10, 0xA07848, 68, 3.5, -30);
        makecylinder(scene, 3, 3, 7, 10, 0xA07848, 74, 3.5, -30);
        makecylinder(scene, 3, 3, 7, 10, 0xA07848, 80, 3.5, -30);
        // Loading dock
        makebox(scene, 8, 1, 6, 0xBB9070, 44, 0.5, -20);
        // Factory sign board
        makebox(scene, 10, 2, 0.3, 0xE4C090, 60, 10, -27.9);
    }

    function buildorchard(scene) {
        // Apple orchard rows near cider mill — sphere canopy trees
        var orchardpositions = [
            [42, -40], [48, -40], [54, -40], [60, -40], [66, -40], [72, -40],
            [42, -48], [48, -48], [54, -48], [60, -48], [66, -48], [72, -48],
            [42, -56], [48, -56], [54, -56], [60, -56], [66, -56], [72, -56]
        ];
        var i;
        for (i = 0; i < orchardpositions.length; i++) {
            var ox = orchardpositions[i][0];
            var oz = orchardpositions[i][1];
            // Trunk
            makecylinder(scene, 0.3, 0.4, 3, 6, 0x5A3A1A, ox, 1.5, oz);
            // Canopy
            makesphere(scene, 2.2, 7, 6, 0x3A7A2A, ox, 5, oz);
            // Apple hints — small red spheres
            makesphere(scene, 0.3, 5, 4, 0xCC2200, ox + 1, 4, oz + 1);
            makesphere(scene, 0.3, 5, 4, 0xCC2200, ox - 1, 3.5, oz - 0.5);
        }
    }

    function buildcattle(scene) {
        // Three Hereford cattle in farmyard near orchard
        // Cattle positions
        var cattledata = [
            [30, -42, 0],
            [34, -45, 15],
            [28, -48, -10]
        ];
        var i;
        for (i = 0; i < cattledata.length; i++) {
            var cx = cattledata[i][0];
            var cz = cattledata[i][1];
            var rot = cattledata[i][2];
            // Body — brown
            var body = makebox(scene, 3, 1.5, 1.2, 0x8A4A2A, cx, 1.5, cz);
            body.rotation.y = rot * Math.PI / 180;
            // White patch on back
            var patch = makebox(scene, 1, 0.3, 1.1, 0xF5F5F5, cx + 0.5, 2.2, cz);
            patch.rotation.y = rot * Math.PI / 180;
            // Head
            var head = makebox(scene, 0.8, 0.8, 0.8, 0x8A4A2A, cx + 1.7, 1.9, cz);
            head.rotation.y = rot * Math.PI / 180;
            // White face blaze
            var blaze = makebox(scene, 0.4, 0.5, 0.2, 0xF5F5F5, cx + 2.0, 1.9, cz);
            blaze.rotation.y = rot * Math.PI / 180;
            // Legs (four box legs)
            makebox(scene, 0.25, 1, 0.25, 0x7A3A1A, cx + 0.8, 0.7, cz + 0.4);
            makebox(scene, 0.25, 1, 0.25, 0x7A3A1A, cx + 0.8, 0.7, cz - 0.4);
            makebox(scene, 0.25, 1, 0.25, 0x7A3A1A, cx - 0.8, 0.7, cz + 0.4);
            makebox(scene, 0.25, 1, 0.25, 0x7A3A1A, cx - 0.8, 0.7, cz - 0.4);
            // Horns
            makecone(scene, 0.08, 0.5, 4, 0xF0E0C0, cx + 1.9, 2.4, cz + 0.35);
            makecone(scene, 0.08, 0.5, 4, 0xF0E0C0, cx + 1.9, 2.4, cz - 0.35);
            // Tail
            makecylinder(scene, 0.07, 0.1, 1, 4, 0x6A3A1A, cx - 1.6, 1.8, cz);
        }
    }

    function buildgroundplane(scene) {
        // Ground patch for cathedral close
        makebox(scene, 80, 0.4, 60, 0x3A5A2A, -10, -0.2, 0);
        // Farmyard ground
        makebox(scene, 50, 0.4, 40, 0x8A7A5A, 50, -0.2, -45);
        // Road/path near cathedral
        makebox(scene, 50, 0.3, 4, 0x6A6A6A, -10, 0.15, -22);
    }

    function buildextradetail(scene) {
        // Cathedral close wall
        makebox(scene, 44, 2, 0.8, 0xC0A090, 0, 1, -24);
        makebox(scene, 44, 2, 0.8, 0xC0A090, 0, 1, 24);
        makebox(scene, 0.8, 2, 48, 0xC0A090, -22, 1, 0);
        makebox(scene, 0.8, 2, 48, 0xC0A090, 22, 1, 0);
        // Gate piers
        makebox(scene, 1.5, 3, 1.5, 0xB09080, -4, 1.5, -24);
        makebox(scene, 1.5, 3, 1.5, 0xB09080, 4, 1.5, -24);
        // Cathedral close trees
        makecylinder(scene, 0.3, 0.4, 4, 6, 0x4A3010, -18, 2, 18);
        makesphere(scene, 2.5, 7, 6, 0x2A5A1A, -18, 6, 18);
        makecylinder(scene, 0.3, 0.4, 4, 6, 0x4A3010, 18, 2, 18);
        makesphere(scene, 2.5, 7, 6, 0x2A5A1A, 18, 6, 18);
        makecylinder(scene, 0.3, 0.4, 4, 6, 0x4A3010, -18, 2, -18);
        makesphere(scene, 2.5, 7, 6, 0x2A5A1A, -18, 6, -18);
        // Pub / inn near bridge
        makebox(scene, 10, 5, 8, 0xD4B080, -55, 2.5, 40);
        makebox(scene, 10.5, 1, 8.5, 0xA07040, -55, 5.5, 40);
        makecylinder(scene, 0.15, 0.15, 4, 4, 0x805020, -50, 2, 43);
        // Sign post for pub
        makebox(scene, 2, 0.3, 0.1, 0xD08020, -50, 4.2, 43);
    }

    function init(scene) {
        buildgroundplane(scene);
        buildcathedral(scene);
        buildchainedlibrary(scene);
        buildherefordbridge(scene);
        buildriverwye(scene);
        buildciderfactory(scene);
        buildorchard(scene);
        buildcattle(scene);
        buildextradetail(scene);
    }

    return {
        init: init,
        worldX: WX,
        worldZ: WZ
    };

}());
