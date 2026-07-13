window.AyrFort = (function() {
    'use strict';

    var WX = 2230;
    var WZ = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeEdges(mesh) {
        var edges = new THREE.EdgesGeometry(mesh.geometry);
        var mat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.copy(mesh.position);
        lines.rotation.copy(mesh.rotation);
        return lines;
    }

    function buildBurnsCottage(scene) {
        // Main cottage body — low cream-rendered walls
        var body = makeBox(10, 4, 6, 0xF5E8D0, -80, 2, -60);
        scene.add(body);
        scene.add(makeEdges(body));

        // Thick straw/thatched roof — layered box slightly larger
        var roof = makeBox(12, 2, 8, 0xD4B483, -80, 5, -60);
        scene.add(roof);
        scene.add(makeEdges(roof));

        // Stone end wall east
        var wallE = makeBox(1.5, 4.5, 6, 0xA89070, -74.5, 2.25, -60);
        scene.add(wallE);

        // Stone end wall west
        var wallW = makeBox(1.5, 4.5, 6, 0xA89070, -85.5, 2.25, -60);
        scene.add(wallW);

        // Chimney stack east
        var chimneyE = makeBox(1.2, 3, 1.2, 0x8A7060, -74, 7.5, -60);
        scene.add(chimneyE);

        // Chimney stack west
        var chimneyW = makeBox(1.2, 3, 1.2, 0x8A7060, -86, 7.5, -60);
        scene.add(chimneyW);

        // Doorway indication — dark recess box
        var door = makeBox(1.4, 2.4, 0.4, 0x3A2C1C, -80, 1.2, -57.2);
        scene.add(door);

        // Small window box east side
        var winE = makeBox(1.0, 0.8, 0.3, 0x3A2C1C, -77, 2.5, -57.2);
        scene.add(winE);

        // Small window box west side
        var winW = makeBox(1.0, 0.8, 0.3, 0x3A2C1C, -83, 2.5, -57.2);
        scene.add(winW);

        // Garden wall low stone perimeter front
        var gardenWall = makeBox(14, 0.8, 0.4, 0x9A8A78, -80, 0.4, -54);
        scene.add(gardenWall);
    }

    function buildAuldBrigOAyr(scene) {
        // Main ancient bridge deck — 13th century pedestrian
        var deck = makeBox(18, 4, 5, 0x9A8A78, 0, 3, 20);
        scene.add(deck);
        scene.add(makeEdges(deck));

        // Stone pier 1
        var pier1 = makeBox(2.5, 5, 5, 0x8A7A68, -5, 1.5, 20);
        scene.add(pier1);
        scene.add(makeEdges(pier1));

        // Stone pier 2
        var pier2 = makeBox(2.5, 5, 5, 0x8A7A68, 5, 1.5, 20);
        scene.add(pier2);
        scene.add(makeEdges(pier2));

        // Parapet / railings wall north
        var parapetN = makeBox(18, 1.2, 0.5, 0xB0A090, 0, 5.6, 17.75);
        scene.add(parapetN);

        // Parapet / railings wall south
        var parapetS = makeBox(18, 1.2, 0.5, 0xB0A090, 0, 5.6, 22.25);
        scene.add(parapetS);

        // Approach ramp east
        var rampE = makeBox(6, 1.5, 5, 0x9A8A78, 12, 1.75, 20);
        scene.add(rampE);

        // Approach ramp west
        var rampW = makeBox(6, 1.5, 5, 0x9A8A78, -12, 1.75, 20);
        scene.add(rampW);

        // New Bridge — rival 19th century road bridge nearby
        var newBridge = makeBox(22, 3, 6, 0xC8C0B0, 0, 2.5, 35);
        scene.add(newBridge);
        scene.add(makeEdges(newBridge));

        // New Bridge parapet north
        var nbParN = makeBox(22, 1, 0.5, 0xD8D0C0, 0, 4.5, 32);
        scene.add(nbParN);

        // New Bridge parapet south
        var nbParS = makeBox(22, 1, 0.5, 0xD8D0C0, 0, 4.5, 38);
        scene.add(nbParS);

        // New Bridge pier central
        var nbPier = makeBox(3, 4, 6, 0xB8B0A0, 0, 1, 35);
        scene.add(nbPier);
    }

    function buildAyrRacecourse(scene) {
        // Main grandstand — long low white building
        var stand = makeBox(60, 8, 12, 0xF5F5F5, 60, 4, -30);
        scene.add(stand);
        scene.add(makeEdges(stand));

        // Viewing balcony upper tier — slightly narrower box set forward
        var balcony = makeBox(58, 1.5, 3, 0xE8E8E0, 60, 8.75, -35.5);
        scene.add(balcony);
        scene.add(makeEdges(balcony));

        // Balcony overhang soffit
        var soffit = makeBox(58, 0.5, 3, 0xD0D0C8, 60, 8.2, -35.5);
        scene.add(soffit);

        // Roof ridge cap
        var ridgeCap = makeBox(60, 1.5, 12, 0xE0E0D8, 60, 9, -30);
        scene.add(ridgeCap);

        // Finishing post cylinder 1
        var post1 = makeCylinder(0.2, 0.2, 6, 8, 0xFFFFFF, 32, 3, -42);
        scene.add(post1);

        // Finishing post cylinder 2
        var post2 = makeCylinder(0.2, 0.2, 6, 8, 0xFFFFFF, 30, 3, -42);
        scene.add(post2);

        // Finishing line cross beam
        var beam = makeBox(2.5, 0.2, 0.2, 0xFFFFFF, 31, 6.1, -42);
        scene.add(beam);

        // Track rail marker post row — several small cylinders
        var i;
        for (i = 0; i < 8; i++) {
            var rp = makeCylinder(0.15, 0.15, 1.2, 6, 0xFFFFFF, 20 + i * 8, 0.6, -44);
            scene.add(rp);
        }

        // Stable block east end
        var stableE = makeBox(14, 5, 10, 0xC8B890, 95, 2.5, -30);
        scene.add(stableE);
        scene.add(makeEdges(stableE));

        // Stable roof
        var stableRoof = makeBox(14, 2, 10, 0x8A7060, 95, 6.5, -30);
        scene.add(stableRoof);

        // Paddock enclosure wall north side
        var paddockN = makeBox(40, 1.2, 0.5, 0xC8C0A8, 60, 0.6, -44);
        scene.add(paddockN);

        // Paddock enclosure wall south side
        var paddockS = makeBox(40, 1.2, 0.5, 0xC8C0A8, 60, 0.6, -16);
        scene.add(paddockS);
    }

    function buildCromwellCitadel(scene) {
        // Star fort bastion earthworks — diagonal corner berms (0x5A7A3A green earth)
        // NE bastion
        var bastionNE = makeBox(8, 3, 8, 0x5A7A3A, -50, 1.5, 60);
        bastionNE.rotation.y = Math.PI / 4;
        bastionNE.position.set(WX + -50, 1.5, WZ + 60);
        scene.add(bastionNE);

        // NW bastion
        var bastionNW = makeBox(8, 3, 8, 0x5A7A3A, -70, 1.5, 60);
        bastionNW.rotation.y = Math.PI / 4;
        bastionNW.position.set(WX + -70, 1.5, WZ + 60);
        scene.add(bastionNW);

        // SE bastion
        var bastionSE = makeBox(8, 3, 8, 0x5A7A3A, -50, 1.5, 40);
        bastionSE.rotation.y = Math.PI / 4;
        bastionSE.position.set(WX + -50, 1.5, WZ + 40);
        scene.add(bastionSE);

        // SW bastion
        var bastionSW = makeBox(8, 3, 8, 0x5A7A3A, -70, 1.5, 40);
        bastionSW.rotation.y = Math.PI / 4;
        bastionSW.position.set(WX + -70, 1.5, WZ + 40);
        scene.add(bastionSW);

        // Curtain wall north earth berm
        var wallN = makeBox(24, 2.5, 4, 0x5A7A3A, -60, 1.25, 62);
        scene.add(wallN);

        // Curtain wall south earth berm
        var wallS = makeBox(24, 2.5, 4, 0x5A7A3A, -60, 1.25, 38);
        scene.add(wallS);

        // Curtain wall east earth berm
        var wallEast = makeBox(4, 2.5, 24, 0x5A7A3A, -48, 1.25, 50);
        scene.add(wallEast);

        // Curtain wall west earth berm
        var wallWest = makeBox(4, 2.5, 24, 0x5A7A3A, -72, 1.25, 50);
        scene.add(wallWest);

        // Ruined wall fragment 1 — stone remnant standing higher
        var ruin1 = makeBox(6, 4, 1.2, 0x8A8070, -55, 2, 62.5);
        scene.add(ruin1);
        scene.add(makeEdges(ruin1));

        // Ruined wall fragment 2
        var ruin2 = makeBox(4, 3, 1.2, 0x8A8070, -65, 1.5, 62.5);
        scene.add(ruin2);
        scene.add(makeEdges(ruin2));

        // Ruined wall fragment 3 — east side partial
        var ruin3 = makeBox(1.2, 5, 5, 0x8A8070, -47.5, 2.5, 55);
        scene.add(ruin3);
        scene.add(makeEdges(ruin3));

        // Interior citadel floor base — sunken remains hint
        var interior = makeBox(20, 0.5, 20, 0x7A8A5A, -60, 0.25, 50);
        scene.add(interior);

        // Gateway entrance — two small stone pillars
        var gatePillarL = makeBox(1.5, 3.5, 1.5, 0x8A8070, -62, 1.75, 62.5);
        scene.add(gatePillarL);
        var gatePillarR = makeBox(1.5, 3.5, 1.5, 0x8A8070, -58, 1.75, 62.5);
        scene.add(gatePillarR);
    }

    function buildAilsaCraig(scene) {
        // Ailsa Craig volcanic plug island — lonely sphere in the distant Firth of Clyde
        var isle = makeSphere(8, 16, 12, 0x9A9A9A, 180, 8, 200);
        scene.add(isle);
        scene.add(makeEdges(isle));

        // Rocky base below the sphere — squat cylinder
        var base = makeCylinder(6, 9, 4, 12, 0x8A8A80, 180, 2, 200);
        scene.add(base);
        scene.add(makeEdges(base));

        // Summit rock peak — small cone to cap the sphere
        var summit = makeCone(2, 4, 8, 0xA0A0A0, 180, 17, 200);
        scene.add(summit);

        // Lighthouse on Ailsa Craig — thin white cylinder
        var lighthouse = makeCylinder(0.5, 0.5, 5, 8, 0xF0F0F0, 182, 20, 198);
        scene.add(lighthouse);

        // Lighthouse lamp house cap
        var lampCap = makeCone(0.8, 1.2, 8, 0xE8C840, 182, 23.1, 198);
        scene.add(lampCap);
    }

    function buildCoastalFeatures(scene) {
        // Sea wall / harbour promenade — long low box along the shore
        var seawall = makeBox(80, 1.5, 3, 0xB0A898, 30, 0.75, 90);
        scene.add(seawall);

        // Harbour pier arm extending seaward
        var pier = makeBox(4, 1.2, 30, 0x9A9080, 70, 0.6, 110);
        scene.add(pier);

        // Pier head bollard cylinders
        var bollard1 = makeCylinder(0.3, 0.3, 1, 6, 0x404040, 69, 1.5, 124);
        scene.add(bollard1);
        var bollard2 = makeCylinder(0.3, 0.3, 1, 6, 0x404040, 71, 1.5, 124);
        scene.add(bollard2);

        // Beach strip — wide low flat box
        var beach = makeBox(100, 0.3, 20, 0xE8D890, 30, 0.15, 105);
        scene.add(beach);

        // Burns monument column — cylindrical pedestal
        var monBase = makeBox(3, 1, 3, 0x9A8A78, -20, 0.5, -80);
        scene.add(monBase);
        var monCol = makeCylinder(0.8, 0.8, 6, 10, 0x9A8A78, -20, 4, -80);
        scene.add(monCol);
        var monCap = makeCone(1.2, 2, 8, 0x8A7A68, -20, 8, -80);
        scene.add(monCap);

        // Town church steeple — box tower with cone steeple
        var towerBase = makeBox(6, 14, 6, 0x9A9080, -30, 7, -90);
        scene.add(towerBase);
        scene.add(makeEdges(towerBase));
        var steeple = makeCone(3.5, 8, 4, 0x8A8070, -30, 18, -90);
        scene.add(steeple);

        // Ayr town hall clock tower block
        var hallTower = makeBox(4, 10, 4, 0xC0B8A8, -10, 5, -95);
        scene.add(hallTower);
        scene.add(makeEdges(hallTower));
        var hallCap = makeBox(5, 1.5, 5, 0xB0A898, -10, 10.75, -95);
        scene.add(hallCap);
    }

    function build(scene) {
        buildBurnsCottage(scene);
        buildAuldBrigOAyr(scene);
        buildAyrRacecourse(scene);
        buildCromwellCitadel(scene);
        buildAilsaCraig(scene);
        buildCoastalFeatures(scene);
    }

    return {
        build: build,
        worldX: WX,
        worldZ: WZ
    };
}());
