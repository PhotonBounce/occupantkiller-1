window.BristolPort = (function() {
    'use strict';

    var WX = 3520;
    var WZ = 2200;

    function makeBox(w, h, d, color, x, y, z, scene) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z, scene) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z, scene) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function buildCliftonBridge(scene) {
        // Left pylon tower
        makeBox(6, 18, 4, 0xD4A97A, -60, 9, -10, scene);
        // Right pylon tower
        makeBox(6, 18, 4, 0xD4A97A, 60, 9, -10, scene);

        // Bridge deck spanning the gorge
        makeBox(70, 1, 4, 0xC8B88A, 0, 18, -10, scene);

        // Suspension cables as LineSegments
        var cablePositions = [
            // Left main cable: from left pylon top to deck midpoint
            -57, 18, -10,   -30, 10, -10,
            -30, 10, -10,    0,   7, -10,
             0,   7, -10,   30,  10, -10,
            30,  10, -10,   57,  18, -10,
            // Hangers left side
            -45, 18, -10,  -45,  9, -10,
            -30, 13, -10,  -30,  9, -10,
            -15, 10, -10,  -15,  9, -10,
             // Hangers right side
             15, 10, -10,   15,  9, -10,
             30, 13, -10,   30,  9, -10,
             45, 18, -10,   45,  9, -10
        ];
        var cableFloats = [];
        for (var ci = 0; ci < cablePositions.length; ci++) {
            cableFloats.push(cablePositions[ci]);
        }
        var cableGeo = new THREE.BufferGeometry();
        cableGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cableFloats), 3));
        // Offset cable positions by world offset
        var posArr = cableGeo.attributes.position.array;
        for (var pi = 0; pi < posArr.length; pi += 3) {
            posArr[pi]     += WX;
            posArr[pi + 2] += WZ - 10;
        }
        cableGeo.attributes.position.needsUpdate = true;
        var cableMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var cableLines = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cableLines);

        // Pylon arch tops
        makeBox(6, 2, 4, 0xBFA070, -60, 19, -10, scene);
        makeBox(6, 2, 4, 0xBFA070, 60, 19, -10, scene);
    }

    function buildAvonGorge(scene) {
        // Left cliff wall
        makeBox(8, 24, 60, 0x3A3A3A, -68, -2, -10, scene);
        makeBox(6, 20, 60, 0x2A2A2A, -74, -4, -10, scene);
        // Right cliff wall
        makeBox(8, 24, 60, 0x3A3A3A, 68, -2, -10, scene);
        makeBox(6, 20, 60, 0x2A2A2A, 74, -4, -10, scene);
        // River at the bottom of gorge
        makeBox(120, 1, 60, 0x1A6B8A, 0, -20, -10, scene);
        // Gorge floor rocks
        makeBox(20, 3, 40, 0x4A4A4A, -50, -18, -10, scene);
        makeBox(20, 3, 40, 0x4A4A4A, 50, -18, -10, scene);
    }

    function buildSSGreatBritain(scene) {
        // Dry dock walls
        makeBox(52, 8, 16, 0x5A5A5A, 80, 4, 60, scene);

        // Ship hull
        makeBox(50, 6, 14, 0x4A4A5A, 80, 3, 60, scene);

        // Deck superstructure
        makeBox(30, 2, 8, 0x5A5A6A, 80, 7, 60, scene);

        // Fore mast
        makeCylinder(0.4, 0.4, 20, 6, 0x5A4A3A, 93, 18, 60, scene);
        // Main mast
        makeCylinder(0.4, 0.4, 20, 6, 0x5A4A3A, 80, 18, 60, scene);
        // Aft mast
        makeCylinder(0.4, 0.4, 20, 6, 0x5A4A3A, 67, 18, 60, scene);

        // Funnel
        makeCylinder(1.2, 1.5, 8, 8, 0x2A2A2A, 80, 13, 60, scene);
        // Funnel cap
        makeCylinder(1.4, 1.2, 1, 8, 0x1A1A1A, 80, 17.5, 60, scene);

        // Propeller box (stern)
        makeBox(3, 3, 3, 0x6A6A7A, 55, 1, 60, scene);

        // Bow shape
        makeBox(4, 4, 10, 0x4A4A5A, 97, 1, 60, scene);

        // Crow's nest on main mast
        makeCylinder(1.2, 1.2, 1, 6, 0x4A3A2A, 80, 22, 60, scene);

        // Rigging lines (LineSegments)
        var rigPositions = [
            WX + 80, 8, WZ + 60,   WX + 93, 28, WZ + 60,
            WX + 80, 8, WZ + 60,   WX + 67, 28, WZ + 60,
            WX + 93, 28, WZ + 60,  WX + 67, 28, WZ + 60,
            WX + 93, 28, WZ + 60,  WX + 80, 28, WZ + 60
        ];
        var rigFloats = new Float32Array(rigPositions);
        var rigGeo = new THREE.BufferGeometry();
        rigGeo.setAttribute('position', new THREE.BufferAttribute(rigFloats, 3));
        var rigMat = new THREE.LineBasicMaterial({ color: 0x8A7A6A });
        scene.add(new THREE.LineSegments(rigGeo, rigMat));

        // Dry dock entrance gate
        makeBox(4, 6, 2, 0x7A6A5A, 104, 3, 60, scene);
    }

    function buildBristolCathedral(scene) {
        // Main nave body
        makeBox(24, 14, 10, 0x9A8A78, -30, 7, 40, scene);

        // Central tower above crossing
        makeBox(8, 20, 8, 0x9A8A78, -30, 17, 40, scene);

        // Twin west towers
        makeBox(5, 22, 5, 0x8A7A68, -38, 11, 45, scene);
        makeBox(5, 22, 5, 0x8A7A68, -22, 11, 45, scene);

        // Tower pinnacles
        var cone1geo = new THREE.ConeGeometry(2, 6, 4);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x8A7A68 });
        var cone1 = new THREE.Mesh(cone1geo, coneMat);
        cone1.position.set(WX - 30, 30, WZ + 40);
        scene.add(cone1);

        var cone2geo = new THREE.ConeGeometry(1.5, 4, 4);
        var cone2Mat = new THREE.MeshLambertMaterial({ color: 0x8A7A68 });
        var cone2 = new THREE.Mesh(cone2geo, cone2Mat);
        cone2.position.set(WX - 38, 25, WZ + 45);
        scene.add(cone2);

        var cone3geo = new THREE.ConeGeometry(1.5, 4, 4);
        var cone3Mat = new THREE.MeshLambertMaterial({ color: 0x8A7A68 });
        var cone3 = new THREE.Mesh(cone3geo, cone3Mat);
        cone3.position.set(WX - 22, 25, WZ + 45);
        scene.add(cone3);

        // Buttresses
        makeBox(2, 10, 2, 0x9A8A78, -42, 5, 38, scene);
        makeBox(2, 10, 2, 0x9A8A78, -18, 5, 38, scene);
        makeBox(2, 10, 2, 0x9A8A78, -42, 5, 42, scene);
        makeBox(2, 10, 2, 0x9A8A78, -18, 5, 42, scene);
    }

    function buildCabotTower(scene) {
        // Brandon Hill base
        makeBox(12, 4, 12, 0x5A6A4A, -60, 2, 50, scene);

        // Tower shaft
        makeCylinder(2, 2.5, 22, 8, 0xD4A97A, -60, 15, 50, scene);

        // Observation platform
        makeCylinder(3, 3, 1.5, 8, 0xC4996A, -60, 27, 50, scene);

        // Parapet
        makeCylinder(3.2, 3.2, 1, 8, 0xB48960, -60, 28, 50, scene);

        // Lantern top
        makeCylinder(1.2, 1.2, 3, 6, 0xC4B080, -60, 30, 50, scene);

        // Finial
        var finGeo = new THREE.ConeGeometry(0.8, 3, 6);
        var finMat = new THREE.MeshLambertMaterial({ color: 0xC4B080 });
        var fin = new THREE.Mesh(finGeo, finMat);
        fin.position.set(WX - 60, 33, WZ + 50);
        scene.add(fin);

        // Decorative bands
        makeCylinder(2.6, 2.6, 0.5, 8, 0xC4996A, -60, 8, 50, scene);
        makeCylinder(2.3, 2.3, 0.5, 8, 0xC4996A, -60, 16, 50, scene);
        makeCylinder(2.1, 2.1, 0.5, 8, 0xC4996A, -60, 22, 50, scene);
    }

    function buildFloatingHarbour(scene) {
        // Main harbour water basin
        makeBox(100, 1, 50, 0x1A6B8A, 0, 0, 100, scene);
        makeBox(60, 1, 30, 0x1A6B8A, -20, 0, 80, scene);

        // Quayside surface
        makeBox(110, 0.5, 10, 0x8A8A7A, 0, 0.5, 126, scene);
        makeBox(110, 0.5, 10, 0x8A8A7A, 0, 0.5, 74, scene);

        // Tobacco Dock warehouses — converted offices
        makeBox(20, 10, 12, 0x8A6A5A, 20, 5, 130, scene);
        makeBox(20, 10, 12, 0x8A6A5A, 45, 5, 130, scene);
        makeBox(20, 10, 12, 0x8A6A5A, -10, 5, 130, scene);

        // Warehouse roofs
        var roofGeo1 = new THREE.ConeGeometry(12, 4, 4);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x7A5A4A });
        var roof1 = new THREE.Mesh(roofGeo1, roofMat);
        roof1.rotation.y = Math.PI / 4;
        roof1.position.set(WX + 20, 12, WZ + 130);
        scene.add(roof1);

        var roofGeo2 = new THREE.ConeGeometry(12, 4, 4);
        var roof2 = new THREE.Mesh(roofGeo2, roofMat);
        roof2.rotation.y = Math.PI / 4;
        roof2.position.set(WX + 45, 12, WZ + 130);
        scene.add(roof2);

        var roofGeo3 = new THREE.ConeGeometry(12, 4, 4);
        var roof3 = new THREE.Mesh(roofGeo3, roofMat);
        roof3.rotation.y = Math.PI / 4;
        roof3.position.set(WX - 10, 12, WZ + 130);
        scene.add(roof3);

        // Arnolfini arts centre (converted warehouse)
        makeBox(18, 12, 10, 0x7A6A5A, -35, 6, 130, scene);

        // Cranes on quayside
        makeBox(1, 16, 1, 0x6A6A6A, 60, 8, 126, scene);
        makeBox(8, 1, 1, 0x6A6A6A, 64, 15, 126, scene);
        makeBox(1, 16, 1, 0x6A6A6A, 70, 8, 126, scene);
        makeBox(8, 1, 1, 0x6A6A6A, 74, 15, 126, scene);

        // Mooring posts
        makeCylinder(0.3, 0.3, 3, 6, 0x4A4A4A, 10, 1.5, 124, scene);
        makeCylinder(0.3, 0.3, 3, 6, 0x4A4A4A, 25, 1.5, 124, scene);
        makeCylinder(0.3, 0.3, 3, 6, 0x4A4A4A, 40, 1.5, 124, scene);

        // Harbour master building
        makeBox(8, 8, 8, 0x9A8A70, -50, 4, 120, scene);
        var hmRoofGeo = new THREE.ConeGeometry(5, 4, 4);
        var hmRoofMat = new THREE.MeshLambertMaterial({ color: 0x7A6A50 });
        var hmRoof = new THREE.Mesh(hmRoofGeo, hmRoofMat);
        hmRoof.rotation.y = Math.PI / 4;
        hmRoof.position.set(WX - 50, 10, WZ + 120);
        scene.add(hmRoof);

        // Small boats in harbour
        makeBox(8, 1.5, 3, 0x8A5A3A, 5, 1, 100, scene);
        makeBox(8, 1.5, 3, 0x6A4A2A, 15, 1, 105, scene);
        makeBox(10, 2, 4, 0x7A6A5A, -5, 1, 95, scene);
    }

    function buildGroundPlane(scene) {
        // Harbour ground / city ground
        makeBox(300, 1, 300, 0x5A6A50, 0, -1, 50, scene);
        // Road surface
        makeBox(10, 0.2, 200, 0x4A4A4A, -80, 0, 60, scene);
        makeBox(200, 0.2, 10, 0x4A4A4A, 0, 0, 10, scene);
    }

    function buildCityContext(scene) {
        // Corn Exchange
        makeBox(20, 10, 16, 0xC8B88A, -10, 5, 20, scene);
        var cornDomeGeo = new THREE.SphereGeometry(6, 8, 6);
        var cornDomeMat = new THREE.MeshLambertMaterial({ color: 0xB8A87A });
        var cornDome = new THREE.Mesh(cornDomeGeo, cornDomeMat);
        cornDome.position.set(WX - 10, 13, WZ + 20);
        scene.add(cornDome);

        // City terraced houses
        makeBox(12, 8, 8, 0xC8A87A, 30, 4, 20, scene);
        makeBox(12, 9, 8, 0xB8986A, 44, 4.5, 20, scene);
        makeBox(12, 7, 8, 0xC8A87A, 58, 3.5, 20, scene);

        // Park Hill - distant buildings
        makeBox(16, 12, 10, 0xA8A8A8, -80, 6, 30, scene);
        makeBox(14, 15, 10, 0xB8B8B8, -65, 7.5, 25, scene);

        // Georgian terrace
        makeBox(40, 10, 8, 0xD4C4A8, 0, 5, -40, scene);
        makeBox(40, 12, 8, 0xC4B498, -42, 6, -40, scene);
    }

    function init(scene) {
        buildGroundPlane(scene);
        buildAvonGorge(scene);
        buildCliftonBridge(scene);
        buildSSGreatBritain(scene);
        buildBristolCathedral(scene);
        buildCabotTower(scene);
        buildFloatingHarbour(scene);
        buildCityContext(scene);
    }

    return {
        init: init,
        worldX: WX,
        worldZ: WZ
    };
}());
