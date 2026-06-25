window.IslingtonAngel = (function() {
    'use strict';

    var scene = null;
    var objects = [];
    var WX = 5200;
    var WZ = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildAngelTube() {
        // Underground station entrance box
        makeBox(12, 4, 8, 0x1C1C1C, 0, 2, 0);
        // Entrance canopy
        makeBox(14, 0.4, 10, 0x1C1C1C, 0, 4.2, 0);
        // Entrance steps base
        makeBox(8, 1, 3, 0x333333, 0, 0.5, 5);
        // LU roundel ring - CylinderGeometry (the circle)
        makeCylinder(2.2, 2.2, 0.3, 24, 0x003399, 0, 5.5, -3);
        // LU roundel inner circle
        makeCylinder(1.4, 1.4, 0.4, 24, 0xFF0000, 0, 5.5, -3);
        // LU roundel horizontal bar (box cross)
        makeBox(5, 0.9, 0.4, 0xFF0000, 0, 5.5, -3);
        // Station name board
        makeBox(8, 1.2, 0.2, 0x003399, 0, 3.6, -4.1);
        // Ticket hall box
        makeBox(14, 6, 12, 0x2A2A2A, 0, 3, 10);
        // Ventilation shaft
        makeBox(2, 8, 2, 0x1C1C1C, -4, 4, 6);
    }

    function buildUpperStreet() {
        var i;
        // Road surface
        makeBox(60, 0.2, 14, 0x505050, 30, 0.1, 0);
        // Pavement north
        makeBox(60, 0.3, 3, 0x888888, 30, 0.15, -8.5);
        // Pavement south
        makeBox(60, 0.3, 3, 0x888888, 30, 0.15, 8.5);

        // Row of Victorian buildings north side
        for (i = 0; i < 8; i++) {
            makeBox(6.5, 10, 8, 0xD2B48C, 6 + i * 8, 5, -16);
            // First floor window details
            makeBox(1.5, 1.5, 0.3, 0x87CEEB, 4 + i * 8, 7, -20.1);
            makeBox(1.5, 1.5, 0.3, 0x87CEEB, 7 + i * 8, 7, -20.1);
            // Ground floor shopfront
            makeBox(5, 3, 0.3, 0x87CEEB, 6 + i * 8, 2, -20.1);
            // Parapet
            makeBox(6.5, 0.8, 0.5, 0xB8860B, 6 + i * 8, 10.4, -20);
            // Chimney stacks
            makeBox(0.8, 3, 0.8, 0xD2B48C, 4 + i * 8, 13, -16);
            makeBox(0.8, 3, 0.8, 0xD2B48C, 8 + i * 8, 13, -16);
        }

        // Row of Victorian buildings south side
        for (i = 0; i < 8; i++) {
            makeBox(6.5, 10, 8, 0xC8A882, 6 + i * 8, 5, 16);
            makeBox(1.5, 1.5, 0.3, 0x87CEEB, 4 + i * 8, 7, 20.1);
            makeBox(1.5, 1.5, 0.3, 0x87CEEB, 7 + i * 8, 7, 20.1);
            makeBox(5, 3, 0.3, 0x87CEEB, 6 + i * 8, 2, 20.1);
            makeBox(6.5, 0.8, 0.5, 0xB8860B, 6 + i * 8, 10.4, 20);
            makeBox(0.8, 3, 0.8, 0xD2B48C, 4 + i * 8, 13, 16);
            makeBox(0.8, 3, 0.8, 0xD2B48C, 8 + i * 8, 13, 16);
        }

        // Pub signs (hanging box signs)
        makeBox(2, 1, 0.15, 0x8B0000, 14, 6, -20.2);
        makeBox(2, 1, 0.15, 0x006400, 30, 6, -20.2);
        makeBox(2, 1, 0.15, 0x8B4513, 46, 6, -20.2);

        // Cafe awnings (south side)
        makeBox(5.5, 0.3, 2.5, 0xCC2200, 6, 4.2, 12);
        makeBox(5.5, 0.3, 2.5, 0x0044BB, 22, 4.2, 12);
        makeBox(5.5, 0.3, 2.5, 0x228800, 38, 4.2, 12);
        makeBox(5.5, 0.3, 2.5, 0xCC8800, 54, 4.2, 12);

        // Street lamp posts
        for (i = 0; i < 5; i++) {
            makeCylinder(0.15, 0.15, 7, 8, 0x444444, 10 + i * 12, 3.5, -9);
            makeSphere(0.4, 8, 8, 0xFFFFCC, 10 + i * 12, 7.5, -9);
        }
    }

    function buildAlmeidaTheatre() {
        // Main building
        makeBox(10, 6, 8, 0x8B3A3A, 100, 3, -30);
        // Victorian industrial roofline
        makeBox(10, 1, 8.5, 0x7A2929, 100, 6.5, -30);
        // Parapet details
        makeBox(11, 0.6, 0.5, 0x6B1A1A, 100, 7.1, -34);
        // Theatre entrance canopy
        makeBox(6, 0.4, 3, 0x5C1A1A, 100, 3.5, -26);
        // Entrance pillars
        makeCylinder(0.3, 0.3, 3, 8, 0x7A2929, 97, 1.5, -25);
        makeCylinder(0.3, 0.3, 3, 8, 0x7A2929, 103, 1.5, -25);
        // Large front windows (Victorian arched boxes)
        makeBox(2, 3.5, 0.3, 0x87CEEB, 97, 4, -34.1);
        makeBox(2, 3.5, 0.3, 0x87CEEB, 100, 4, -34.1);
        makeBox(2, 3.5, 0.3, 0x87CEEB, 103, 4, -34.1);
        // Signage board
        makeBox(8, 1, 0.2, 0x3A0000, 100, 2.5, -34.2);
        // Chimney
        makeBox(1, 4, 1, 0x8B3A3A, 103, 9, -30);
    }

    function buildBusinessDesignCentre() {
        // Main hall - Victorian Royal Agricultural Hall
        makeBox(35, 8, 20, 0xC8B89A, 70, 4, 60);
        // Raised roof section
        makeBox(25, 4, 14, 0xB8A88A, 70, 10, 60);
        // Glass roof sections
        makeBox(8, 0.4, 13, 0x87CEEB, 65, 12.2, 60);
        makeBox(8, 0.4, 13, 0x87CEEB, 73, 12.2, 60);
        // Iron CylinderGeometry columns along facade
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 52, 4, 50);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 60, 4, 50);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 68, 4, 50);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 76, 4, 50);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 84, 4, 50);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 92, 4, 50);
        // Rear columns
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 52, 4, 70);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 60, 4, 70);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 68, 4, 70);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 76, 4, 70);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 84, 4, 70);
        makeCylinder(0.5, 0.5, 8, 12, 0x4A4A4A, 92, 4, 70);
        // Grand entrance arch box
        makeBox(10, 10, 2, 0xC8B89A, 70, 5, 49);
        makeBox(8, 8, 2.2, 0x87CEEB, 70, 5, 49);
        // Pediment
        makeBox(36, 1.5, 2, 0xB8A88A, 70, 8.8, 49);
        // Ornamental cornice
        makeBox(37, 0.6, 22, 0xA89878, 70, 8.4, 60);
    }

    function buildSadlersWells() {
        // Modern main building
        makeBox(20, 8, 12, 0x808080, -40, 4, -50);
        // Glass facade sections
        makeBox(18, 7, 0.4, 0x87CEEB, -40, 4.5, -44.1);
        makeBox(6, 7, 0.4, 0x87CEEB, -48, 4.5, -48);
        makeBox(6, 7, 0.4, 0x87CEEB, -32, 4.5, -48);
        // Roof
        makeBox(21, 0.6, 13, 0x707070, -40, 8.3, -50);
        // Concrete side walls
        makeBox(0.4, 8, 12, 0x909090, -50.2, 4, -50);
        makeBox(0.4, 8, 12, 0x909090, -29.8, 4, -50);
        // Fly tower (stage tower above theatre)
        makeBox(12, 14, 10, 0x757575, -40, 9, -52);
        // Entrance canopy
        makeBox(14, 0.4, 4, 0x87CEEB, -40, 3.2, -43);
        // Box office / lobby box
        makeBox(8, 3, 4, 0x87CEEB, -40, 1.5, -43);
        // Signage
        makeBox(15, 1.2, 0.3, 0x333333, -40, 7.5, -44.3);
        // Steps
        makeBox(16, 0.5, 3, 0xAAAAAA, -40, 0.25, -42);
        makeBox(14, 0.5, 2, 0xAAAAAA, -40, 0.75, -41);
    }

    function buildCanonburyTower() {
        // Tudor tower base
        makeBox(5, 16, 5, 0xD2B48C, -80, 8, -80);
        // Slightly wider base plinth
        makeBox(6, 2, 6, 0xC2A47C, -80, 1, -80);
        // Battlements - four corner merlons
        makeBox(1.5, 2, 1.5, 0xD2B48C, -82.5, 17, -82.5);
        makeBox(1.5, 2, 1.5, 0xD2B48C, -77.5, 17, -82.5);
        makeBox(1.5, 2, 1.5, 0xD2B48C, -82.5, 17, -77.5);
        makeBox(1.5, 2, 1.5, 0xD2B48C, -77.5, 17, -77.5);
        // Tudor windows (lancet-style box cutouts replaced by window boxes)
        makeBox(0.8, 1.5, 0.2, 0x87CEEB, -82.6, 6, -80);
        makeBox(0.8, 1.5, 0.2, 0x87CEEB, -82.6, 10, -80);
        makeBox(0.8, 1.5, 0.2, 0x87CEEB, -82.6, 14, -80);
        // Attached outbuilding
        makeBox(4, 5, 6, 0xC8A878, -74, 2.5, -80);
        // Garden wall
        makeBox(20, 1.5, 0.4, 0xD2B48C, -80, 0.75, -72);
        makeBox(0.4, 1.5, 16, 0xD2B48C, -70, 0.75, -80);
    }

    function buildHighburyFields() {
        // Main green ground plane
        makeBox(40, 0.3, 25, 0x228B22, -120, 0.15, 20);
        // Darker grass areas
        makeBox(15, 0.31, 10, 0x1A7A1A, -130, 0.16, 15);
        makeBox(15, 0.31, 10, 0x2A9B2A, -110, 0.16, 28);
        // Victorian swimming pond enclosure
        makeBox(10, 0.5, 7, 0x1A5A8A, -120, 0.35, 30);
        // Pond surround
        makeBox(11, 0.8, 0.4, 0x888888, -120, 0.4, 26.8);
        makeBox(11, 0.8, 0.4, 0x888888, -120, 0.4, 33.2);
        makeBox(0.4, 0.8, 8, 0x888888, -124.8, 0.4, 30);
        makeBox(0.4, 0.8, 8, 0x888888, -115.2, 0.4, 30);
        // Changing room building
        makeBox(6, 3, 4, 0xD2B48C, -122, 1.5, 37);
        // Park bandstand
        makeCylinder(4, 4, 0.3, 12, 0x888888, -108, 0.3, 22);
        makeCylinder(0.2, 0.2, 4, 8, 0x666666, -104, 2, 18);
        makeCylinder(0.2, 0.2, 4, 8, 0x666666, -112, 2, 18);
        makeCylinder(0.2, 0.2, 4, 8, 0x666666, -104, 2, 26);
        makeCylinder(0.2, 0.2, 4, 8, 0x666666, -112, 2, 26);
        makeCone(5, 2, 12, 0x444444, -108, 5.3, 22);
        // Park benches (box)
        makeBox(2, 0.3, 0.6, 0x8B4513, -115, 0.65, 20);
        makeBox(2, 0.3, 0.6, 0x8B4513, -125, 0.65, 25);
        // Park perimeter fence (north)
        makeBox(40, 1, 0.3, 0x2A5A2A, -120, 0.65, 7);
        // Park perimeter fence (south partial)
        makeBox(40, 1, 0.3, 0x2A5A2A, -120, 0.65, 33);
        // Trees as spheres on cylinders
        makeCylinder(0.3, 0.4, 4, 8, 0x5C3A1E, -125, 2, 12);
        makeSphere(2.5, 10, 10, 0x1A6B1A, -125, 5.5, 12);
        makeCylinder(0.3, 0.4, 4, 8, 0x5C3A1E, -115, 2, 10);
        makeSphere(2.5, 10, 10, 0x228B22, -115, 5.5, 10);
        makeCylinder(0.3, 0.4, 4, 8, 0x5C3A1E, -118, 2, 28);
        makeSphere(2.2, 10, 10, 0x1E7A1E, -118, 5.5, 28);
    }

    function buildBarnsbury() {
        var i;
        // Georgian garden square ground
        makeBox(18, 0.3, 18, 0x228B22, -50, 0.15, 80);
        // Central garden feature
        makeBox(6, 0.5, 6, 0x1A7A1A, -50, 0.35, 80);
        // Wrought iron railings around square (box segments)
        for (i = 0; i < 9; i++) {
            makeBox(0.15, 1.8, 0.15, 0x111111, -59 + i * 2, 0.9, 71);
        }
        for (i = 0; i < 9; i++) {
            makeBox(0.15, 1.8, 0.15, 0x111111, -59 + i * 2, 0.9, 89);
        }
        for (i = 0; i < 9; i++) {
            makeBox(0.15, 1.8, 0.15, 0x111111, -59, 0.9, 71 + i * 2);
        }
        for (i = 0; i < 9; i++) {
            makeBox(0.15, 1.8, 0.15, 0x111111, -41, 0.9, 71 + i * 2);
        }
        // Railing top rails
        makeBox(18, 0.2, 0.2, 0x111111, -50, 1.8, 71);
        makeBox(18, 0.2, 0.2, 0x111111, -50, 1.8, 89);
        makeBox(0.2, 0.2, 18, 0x111111, -59, 1.8, 80);
        makeBox(0.2, 0.2, 18, 0x111111, -41, 1.8, 80);

        // Georgian terrace north - stucco facades
        makeBox(18, 10, 7, 0xFFF8DC, -50, 5, 70);
        makeBox(18, 10, 7, 0xFFF8DC, -50, 5, 90);
        makeBox(7, 10, 18, 0xFFF8DC, -60, 5, 80);
        makeBox(7, 10, 18, 0xFFF8DC, -40, 5, 80);
        // Georgian windows
        makeBox(1.5, 2, 0.2, 0x87CEEB, -54, 7, 66.4);
        makeBox(1.5, 2, 0.2, 0x87CEEB, -50, 7, 66.4);
        makeBox(1.5, 2, 0.2, 0x87CEEB, -46, 7, 66.4);
        makeBox(1.5, 2, 0.2, 0x87CEEB, -54, 4, 66.4);
        makeBox(1.5, 2, 0.2, 0x87CEEB, -50, 4, 66.4);
        makeBox(1.5, 2, 0.2, 0x87CEEB, -46, 4, 66.4);
        // Front door pilasters
        makeCylinder(0.2, 0.2, 3, 8, 0xEEE8DC, -52, 1.5, 66.5);
        makeCylinder(0.2, 0.2, 3, 8, 0xEEE8DC, -48, 1.5, 66.5);
        // Fanlight over door
        makeSphere(0.6, 8, 8, 0x87CEEB, -50, 3.8, 66.5);
        // Cornice line
        makeBox(19, 0.5, 7.5, 0xF0ECD0, -50, 10.3, 70);
        // Basement area (sunken)
        makeBox(18, 1, 2, 0x888888, -50, 0.5, 64);
    }

    function buildChapelMarket() {
        var i;
        // Market road
        makeBox(50, 0.2, 8, 0x606060, -20, 0.1, 100);
        // Market stalls - alternating coloured awnings
        var awningColors = [0xCC2200, 0x0044BB, 0xCC8800, 0x228800, 0x880088, 0xCC2200, 0x0044BB, 0xCC8800];
        for (i = 0; i < 8; i++) {
            // Stall frame
            makeBox(4.5, 2.5, 3, 0xDDDDDD, -40 + i * 6, 1.25, 105);
            // Awning top
            makeBox(5, 0.3, 3.5, awningColors[i], -40 + i * 6, 2.65, 105);
            // Produce display box
            makeBox(3.5, 0.6, 1.5, 0xFFFF44, -40 + i * 6, 0.8, 103.5);
            // Stall legs
            makeCylinder(0.1, 0.1, 2.5, 6, 0x888888, -42 + i * 6, 1.25, 103.8);
            makeCylinder(0.1, 0.1, 2.5, 6, 0x888888, -38 + i * 6, 1.25, 103.8);
            makeCylinder(0.1, 0.1, 2.5, 6, 0x888888, -42 + i * 6, 1.25, 106.2);
            makeCylinder(0.1, 0.1, 2.5, 6, 0x888888, -38 + i * 6, 1.25, 106.2);
        }
        // Colourful produce crates
        makeBox(1, 0.6, 1, 0xFF4400, -38, 0.8, 103);
        makeBox(1, 0.6, 1, 0xFFAA00, -32, 0.8, 103);
        makeBox(1, 0.6, 1, 0x228800, -26, 0.8, 103);
        makeBox(1, 0.6, 1, 0xFF0066, -20, 0.8, 103);
        makeBox(1, 0.6, 1, 0xFFFF00, -14, 0.8, 103);
        // Surrounding buildings
        makeBox(50, 8, 6, 0xC8A882, -20, 4, 112);
        makeBox(50, 8, 6, 0xD2B48C, -20, 4, 93);
    }

    function buildPentonvilleRoad() {
        var i;
        // Main road surface
        makeBox(80, 0.2, 14, 0x606060, 40, 0.1, -70);
        // Road markings (centre line boxes)
        for (i = 0; i < 8; i++) {
            makeBox(6, 0.21, 0.3, 0xFFFF00, 4 + i * 10, 0.12, -70);
        }
        // Pavements
        makeBox(80, 0.3, 3, 0x888888, 40, 0.15, -77.5);
        makeBox(80, 0.3, 3, 0x888888, 40, 0.15, -62.5);
        // Georgian buildings north side
        for (i = 0; i < 6; i++) {
            makeBox(11, 10, 7, 0xFFF8DC, 6 + i * 13, 5, -84);
            makeBox(1.5, 2, 0.2, 0x87CEEB, 3 + i * 13, 7, -87.6);
            makeBox(1.5, 2, 0.2, 0x87CEEB, 7 + i * 13, 7, -87.6);
            makeBox(1.5, 2, 0.2, 0x87CEEB, 11 + i * 13, 7, -87.6);
            makeBox(0.8, 2.5, 0.2, 0x6B4513, 7 + i * 13, 2, -87.6);
            makeBox(11, 0.6, 0.4, 0xEEE8C0, 6 + i * 13, 10.4, -87.5);
        }
        // Victorian buildings south side
        for (i = 0; i < 6; i++) {
            makeBox(11, 10, 7, 0xD2B48C, 6 + i * 13, 5, -56);
            makeBox(1.5, 2, 0.2, 0x87CEEB, 3 + i * 13, 7, -52.4);
            makeBox(1.5, 2, 0.2, 0x87CEEB, 7 + i * 13, 7, -52.4);
            makeBox(5, 3, 0.2, 0x87CEEB, 6 + i * 13, 2, -52.4);
            makeBox(11, 0.6, 0.4, 0xB8860B, 6 + i * 13, 10.4, -52.5);
        }
        // Street lamps
        for (i = 0; i < 6; i++) {
            makeCylinder(0.15, 0.15, 7, 8, 0x444444, i * 13, 3.5, -78);
            makeSphere(0.4, 8, 8, 0xFFFFCC, i * 13, 7.5, -78);
            makeCylinder(0.15, 0.15, 7, 8, 0x444444, i * 13, 3.5, -62);
            makeSphere(0.4, 8, 8, 0xFFFFCC, i * 13, 7.5, -62);
        }
        // King's Cross direction - road narrows into distance
        makeBox(30, 0.2, 14, 0x505050, 95, 0.1, -70);
        // Junction box - wider
        makeBox(16, 0.2, 20, 0x606060, 80, 0.11, -70);
    }

    function buildGroundPlane() {
        // Base ground for the whole area
        makeBox(400, 0.5, 400, 0x4A6741, 50, -0.3, 20);
    }

    function init(sceneRef) {
        scene = sceneRef;
        objects = [];
        buildGroundPlane();
        buildAngelTube();
        buildUpperStreet();
        buildAlmeidaTheatre();
        buildBusinessDesignCentre();
        buildSadlersWells();
        buildCanonburyTower();
        buildHighburyFields();
        buildBarnsbury();
        buildChapelMarket();
        buildPentonvilleRoad();
    }

    function update(delta) {
        // Static environment — no per-frame updates required
        void delta;
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i].parent) {
                objects[i].parent.remove(objects[i]);
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
