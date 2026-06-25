window.StonehengeRing = (function() {
    'use strict';

    var OFFSET_X = 3920;
    var OFFSET_Z = 2200;
    var group = null;
    var scene = null;

    function makeBox(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        return mesh;
    }

    function buildOuterSarsenCircle() {
        var radius = 15;
        var count = 30;
        var w = 2, h = 6, d = 1.5;
        var color = 0x888888;
        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var x = Math.sin(angle) * radius;
            var z = Math.cos(angle) * radius;
            var stone = makeBox(w, h, d, color, x, h / 2, z, 0, angle, 0);
            group.add(stone);
        }
    }

    function buildLintels() {
        var radius = 15;
        var count = 30;
        var w = 2.5, h = 1.5, d = 1.5;
        var color = 0x888888;
        var uprightH = 6;
        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var x = Math.sin(angle) * radius;
            var z = Math.cos(angle) * radius;
            var lintel = makeBox(w, h, d, color, x, uprightH + h / 2, z, 0, angle, 0);
            group.add(lintel);
        }
    }

    function buildInnerTrilithons() {
        var color = 0x808080;
        var uprightW = 3, uprightH = 8, uprightD = 2;
        var lintelW = 3.5, lintelH = 1.5, lintelD = 2;
        var horseshoeRadius = 10;
        var count = 5;
        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            var cx = Math.sin(angle) * horseshoeRadius;
            var cz = Math.cos(angle) * horseshoeRadius;
            var perpAngle = angle + Math.PI / 2;
            var offset = 1.8;
            var lx = Math.sin(perpAngle) * offset;
            var lz = Math.cos(perpAngle) * offset;
            var rx = Math.sin(perpAngle) * (-offset);
            var rz = Math.cos(perpAngle) * (-offset);
            var leftUpright = makeBox(uprightW, uprightH, uprightD, color, cx + lx, uprightH / 2, cz + lz, 0, angle, 0);
            var rightUpright = makeBox(uprightW, uprightH, uprightD, color, cx + rx, uprightH / 2, cz + rz, 0, angle, 0);
            var lintel = makeBox(lintelW, lintelH, lintelD, color, cx, uprightH + lintelH / 2, cz, 0, angle, 0);
            group.add(leftUpright);
            group.add(rightUpright);
            group.add(lintel);
        }
    }

    function buildBluestoneRing() {
        var radius = 8;
        var count = 20;
        var w = 1, h = 4, d = 1;
        var color = 0x778899;
        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var x = Math.sin(angle) * radius;
            var z = Math.cos(angle) * radius;
            var stone = makeBox(w, h, d, color, x, h / 2, z, 0, angle, 0);
            group.add(stone);
        }
    }

    function buildAltarStone() {
        var altar = makeBox(3, 0.5, 1.5, 0x555555, 0, 0.25, 0, 0, 0, 0);
        group.add(altar);
    }

    function buildHeelStone() {
        var heelAngle = Math.PI * 0.25;
        var heelDist = 25;
        var hx = Math.sin(heelAngle) * heelDist;
        var hz = Math.cos(heelAngle) * heelDist;
        var heel = makeBox(2, 5, 2, 0x888888, hx, 2.5, hz, 0, heelAngle, 0);
        group.add(heel);
    }

    function buildAvenue() {
        var color = 0x999988;
        var heelAngle = Math.PI * 0.25;
        var markerW = 0.8, markerH = 0.8, markerD = 0.8;
        var rowOffset = 3;
        var count = 12;
        for (var i = 0; i < count; i++) {
            var dist = 28 + i * 4;
            var cx = Math.sin(heelAngle) * dist;
            var cz = Math.cos(heelAngle) * dist;
            var perpAngle = heelAngle + Math.PI / 2;
            var lx = cx + Math.sin(perpAngle) * rowOffset;
            var lz = cz + Math.cos(perpAngle) * rowOffset;
            var rx = cx - Math.sin(perpAngle) * rowOffset;
            var rz = cz - Math.cos(perpAngle) * rowOffset;
            var leftMarker = makeBox(markerW, markerH, markerD, color, lx, markerH / 2, lz, 0, 0, 0);
            var rightMarker = makeBox(markerW, markerH, markerD, color, rx, markerH / 2, rz, 0, 0, 0);
            group.add(leftMarker);
            group.add(rightMarker);
        }
    }

    function buildEarthworkBank() {
        var radius = 30;
        var segCount = 48;
        var bankW = 2, bankH = 1, bankD = 2;
        var color = 0xFAFAF0;
        for (var i = 0; i < segCount; i++) {
            var angle = (i / segCount) * Math.PI * 2;
            var x = Math.sin(angle) * radius;
            var z = Math.cos(angle) * radius;
            var seg = makeBox(bankW, bankH, bankD, color, x, bankH / 2, z, 0, angle, 0);
            group.add(seg);
        }
    }

    function buildGroundPatches() {
        var color = 0x7CFC00;
        var patchData = [
            [60, 0.2, 8, 50, 0, -30],
            [80, 0.2, 8, -60, 0, 20],
            [50, 0.2, 8, 10, 0, 70],
            [70, 0.2, 8, -40, 0, -60],
            [90, 0.2, 8, 55, 0, 45],
            [40, 0.2, 8, -70, 0, 55],
            [65, 0.2, 8, 30, 0, -75],
            [75, 0.2, 8, -20, 0, 80]
        ];
        for (var i = 0; i < patchData.length; i++) {
            var p = patchData[i];
            var patch = makeBox(p[0], p[1], p[2], color, p[3], p[4] + p[1] / 2, p[5], 0, 0, 0);
            group.add(patch);
        }
    }

    function buildFallenStones() {
        var color = 0x888888;
        var fallenData = [
            [1.5, 5, 1.5, 12, 0.75, 5, 0, 0, Math.PI / 2],
            [1.5, 6, 1.5, -11, 0.75, -8, 0, 0.4, Math.PI / 2],
            [1.5, 5, 1.5, 7, 0.75, -13, 0, 1.1, Math.PI / 2],
            [1.5, 5.5, 1.5, -6, 0.75, 12, 0, 0.8, Math.PI / 2]
        ];
        for (var i = 0; i < fallenData.length; i++) {
            var d = fallenData[i];
            var stone = makeBox(d[0], d[1], d[2], color, d[3], d[4], d[5], d[6], d[7], d[8]);
            group.add(stone);
        }
    }

    function init(sceneRef) {
        scene = sceneRef;
        group = new THREE.Group();

        buildOuterSarsenCircle();
        buildLintels();
        buildInnerTrilithons();
        buildBluestoneRing();
        buildAltarStone();
        buildHeelStone();
        buildAvenue();
        buildEarthworkBank();
        buildGroundPatches();
        buildFallenStones();

        scene.add(group);
    }

    function update(delta) {
    }

    function reset() {
        if (group && scene) {
            scene.remove(group);
        }
        group = null;
        scene = null;
    }

    return { init: init, update: update, reset: reset };
}());
