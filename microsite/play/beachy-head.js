window.BeachyHead = (function () {
    'use strict';

    var OX = 4160;
    var OZ = 2200;
    var objects = [];
    var scene = null;

    function makebox(w, h, d, color, px, py, pz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + px, py, OZ + pz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rtop, rbot, h, segs, color, px, py, pz) {
        var geo = new THREE.CylinderGeometry(rtop, rbot, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + px, py, OZ + pz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, px, py, pz) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + px, py, OZ + pz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildcliff() {
        // Main Beachy Head cliff — sheer white chalk face
        makebox(60, 35, 8, 0xFAFAF0, 0, 17.5, 0);
        // Birling Gap notch — gap in cliff (dark recessed box for the cut)
        makebox(6, 35, 8, 0xD0C8B0, -28, 17.5, 0);
        // Concrete steps at Birling Gap
        makebox(4, 8, 4, 0xC8C8C8, -28, 4, -5);
        makebox(4, 6, 4, 0xC8C8C8, -28, 3, -3);
        makebox(4, 4, 4, 0xC8C8C8, -28, 2, -1);
    }

    function buildsevensisters() {
        // Seven Sisters cliffs stretching west — 7 undulating white chalk humps
        var heights = [18, 22, 16, 20, 14, 19, 17];
        var i;
        for (i = 0; i < 7; i = i + 1) {
            makebox(8, heights[i], 6, 0xFAFAF0, -70 - i * 10, heights[i] / 2, 2);
        }
    }

    function buildchannel() {
        // English Channel — deep blue water box at cliff base
        makebox(300, 4, 120, 0x000080, 0, -2, 60);
        // Shallow surf fringe — lighter blue
        makebox(300, 2, 10, 0x1040A0, 0, 0.5, 10);
    }

    function buildbelltouttlighthouse() {
        // Belle Tout — decommissioned lighthouse on cliff top
        // Base structure
        makebox(4, 10, 4, 0xFFFFFF, 20, 40, -6);
        // Red band around middle
        makebox(4.2, 2, 4.2, 0xCC0000, 20, 44, -6);
        // Lantern room top
        makebox(3, 2, 3, 0x888888, 20, 46.5, -6);
        // Dome approximation (sphere)
        makesphere(1.8, 8, 6, 0x444444, 20, 48, -6);
    }

    function buildbeachyheadlighthouse() {
        // Beachy Head lighthouse — at sea level in the Channel
        // White base section
        makecylinder(2, 2.4, 6, 16, 0xFFFFFF, 8, 3, 40);
        // Red lower band
        makecylinder(2.1, 2.4, 2, 16, 0xCC0000, 8, 7, 40);
        // White middle section
        makecylinder(1.8, 2.1, 4, 16, 0xFFFFFF, 8, 10, 40);
        // Red upper band
        makecylinder(1.6, 1.8, 2, 16, 0xCC0000, 8, 13, 40);
        // White top section
        makecylinder(1.4, 1.6, 4, 16, 0xFFFFFF, 8, 16, 40);
        // Lantern house
        makecylinder(1.6, 1.6, 1.5, 16, 0x333333, 8, 17.5, 40);
        // Gallery rail approximation
        makecylinder(1.8, 1.8, 0.3, 16, 0xAAAAAA, 8, 16.8, 40);
        // Rock base platform in sea
        makebox(10, 2, 10, 0x909090, 8, -1, 40);
    }

    function buildeastbournepier() {
        // Pier deck extending into Channel
        makebox(80, 1, 8, 0xFFFFFF, 60, 1.5, 30);
        // Pier support legs (several boxes beneath)
        var i;
        for (i = 0; i < 8; i = i + 1) {
            makebox(1, 4, 1, 0xCCCCCC, 20 + i * 10, -0.5, 30);
            makebox(1, 4, 1, 0xCCCCCC, 20 + i * 10, -0.5, 38);
        }
        // Bandstand at end of pier
        makebox(12, 4, 12, 0xFFFFFF, 100, 3, 30);
        // Bandstand roof (cone approximation via cylinder)
        makecylinder(0, 7, 4, 8, 0x88AA88, 100, 7, 30);
        // Pier entrance pavilion
        makebox(10, 6, 8, 0xFFFFFF, 22, 4, 30);
    }

    function buildsouthdownsway() {
        // Chalk path along cliff top running east-west
        makebox(120, 0.5, 3, 0xFAFAF0, -10, 35.3, -8);
        // Signpost box
        makebox(0.3, 4, 0.3, 0x8B4513, -10, 37.5, -9);
        makebox(3, 0.4, 0.4, 0x8B4513, -10, 39.5, -9);
    }

    function buildeastbourneseafront() {
        // Row of Victorian hotels along the promenade
        var i;
        var hotelwidths = [12, 10, 14, 10, 12, 11, 13];
        var hotelheights = [14, 12, 16, 12, 14, 13, 15];
        var xpos = 30;
        for (i = 0; i < 7; i = i + 1) {
            // Main hotel body
            makebox(hotelwidths[i], hotelheights[i], 8, 0xFFFFFF, xpos, hotelheights[i] / 2, -20);
            // Facade cornice strip
            makebox(hotelwidths[i] + 0.4, 1, 8.2, 0xEEEEEE, xpos, hotelheights[i] + 0.5, -20);
            // Ground floor darker band
            makebox(hotelwidths[i] + 0.2, 3, 8.1, 0xF0F0E8, xpos, 1.5, -20);
            xpos = xpos + hotelwidths[i] + 2;
        }
        // Promenade walkway
        makebox(140, 0.5, 6, 0xE8E8E0, 80, 0.3, -14);
        // Bandstand on promenade
        makecylinder(6, 6, 0.5, 12, 0xCCCCCC, 70, 0.8, -14);
        makecylinder(0, 7, 3, 12, 0x88AA88, 70, 2.5, -14);
    }

    function buildredoubtfortress() {
        // Redoubt Fortress — circular Napoleonic fort
        // Outer wall (cylinder)
        makecylinder(12, 12, 4, 20, 0x808080, -50, 2, -25);
        // Inner courtyard fill (slightly smaller, lighter)
        makecylinder(10, 10, 3.5, 20, 0x909080, -50, 2, -25);
        // Moat (water) — box approximation around cylinder
        makebox(30, 1, 30, 0x2266AA, -50, -0.5, -25);
        // Moat inner floor visible
        makecylinder(11, 11, 0.5, 20, 0x2266AA, -50, -0.5, -25);
        // Cannon positions (small boxes around perimeter) — 4 cardinal points
        makebox(2, 1.5, 2, 0x555555, -50 + 12, 4.5, -25);
        makebox(2, 1.5, 2, 0x555555, -50 - 12, 4.5, -25);
        makebox(2, 1.5, 2, 0x555555, -50, 4.5, -25 + 12);
        makebox(2, 1.5, 2, 0x555555, -50, 4.5, -25 - 12);
        // Gateway entrance
        makebox(3, 3, 2, 0x404040, -50, 1.5, -25 - 12);
    }

    function buildcliftop() {
        // Cliff top plateau — chalk grassland
        makebox(120, 2, 40, 0x90A860, -10, 34.5, -16);
        // Some chalk outcrops
        makebox(5, 2, 3, 0xFAFAF0, -5, 36.5, -10);
        makebox(3, 1.5, 2, 0xFAFAF0, 10, 36, -12);
        // Coastguard lookout box
        makebox(4, 3, 4, 0xFFFFFF, 5, 37, -18);
        makebox(4.2, 0.5, 4.2, 0xCCCCCC, 5, 38.5, -18);
        // Memorial monument (obelisk approximation)
        makecylinder(0.5, 0.8, 5, 4, 0xE8E8E0, -2, 39.5, -12);
        makecylinder(0, 0.6, 1, 4, 0xE8E8E0, -2, 42, -12);
        // Grass mounds / undulations
        makebox(15, 1, 10, 0x80984A, -20, 35.6, -14);
        makebox(20, 1.5, 8, 0x789040, 15, 35.8, -15);
    }

    function buildseadetail() {
        // Wave break foam line
        makebox(150, 0.3, 2, 0xEEEEFF, 0, 1.2, 16);
        // Chalk reef boulders in surf
        makebox(4, 2, 4, 0xD8D8C8, -5, 1.5, 20);
        makebox(3, 1.5, 3, 0xD8D8C8, 12, 1.2, 22);
        makebox(5, 3, 4, 0xD0D0C0, -15, 2, 18);
        // Cliff talus / fallen chalk at base
        makebox(40, 3, 6, 0xE8E8D8, -5, 1.5, 6);
    }

    function init(sceneref) {
        scene = sceneref;
        objects = [];

        buildchannel();
        buildcliff();
        buildsevensisters();
        buildbelltouttlighthouse();
        buildbeachyheadlighthouse();
        buildeastbournepier();
        buildsouthdownsway();
        buildeastbourneseafront();
        buildredoubtfortress();
        buildcliftop();
        buildseadetail();
    }

    function update(delta) {
        // No per-frame animation required for static environment
        void delta;
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i = i + 1) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
    }

    return { init: init, update: update, reset: reset };

}());
