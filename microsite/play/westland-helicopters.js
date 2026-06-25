window.WestlandHelicopters = (function() {
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

    function addBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(edges, mat);
        ls.position.set(x, y, z);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function buildWestlandFactory() {
        var bx = 13800;
        var bz = -200;

        // Main factory shed 1
        addBox(300, 25, 150, 0x888899, bx, 12.5, bz);
        // Roof ridge
        addBox(305, 5, 5, 0x777788, bx, 27, bz);

        // Main factory shed 2 (adjacent)
        addBox(280, 22, 130, 0x8a8a9a, bx + 290, 11, bz + 10);
        addBox(285, 4, 4, 0x777788, bx + 290, 24, bz + 10);

        // Assembly hall — larger, taller
        addBox(200, 40, 180, 0x9999aa, bx - 200, 20, bz - 200);
        // Assembly hall skylights
        addBox(180, 3, 8, 0xaaaacc, bx - 200, 41, bz - 200);
        addBox(180, 3, 8, 0xaaaacc, bx - 200, 41, bz - 220);

        // Flight test hangar — very large doors implied
        addBox(160, 35, 140, 0x7a8a9a, bx + 150, 17.5, bz - 250);
        // Hangar doors (darker panels)
        addBox(70, 34, 3, 0x556677, bx + 115, 17, bz - 181);
        addBox(70, 34, 3, 0x556677, bx + 185, 17, bz - 181);

        // Test flight apron — concrete pad
        addBox(350, 0.5, 200, 0xbbbbaa, bx, 0.25, bz + 200);

        // Helicopter silhouette: Lynx — fuselage
        addBox(18, 4, 4, 0x446688, bx - 50, 4, bz + 180);
        // Lynx tail boom
        addBox(12, 2, 2, 0x446688, bx - 68, 3.5, bz + 180);
        // Lynx main rotor mast
        addCylinder(0.3, 0.3, 5, 6, 0x223344, bx - 50, 7.5, bz + 180);
        // Lynx rotor blade 1
        addBox(16, 0.5, 1, 0x334455, bx - 50, 10, bz + 180);
        // Lynx rotor blade 2
        addBox(1, 0.5, 16, 0x334455, bx - 50, 10, bz + 180);
        // Lynx skids
        addBox(14, 0.5, 1, 0x223344, bx - 50, 1.5, bz + 177);
        addBox(14, 0.5, 1, 0x223344, bx - 50, 1.5, bz + 183);

        // Helicopter silhouette: Merlin — larger fuselage
        addBox(22, 5, 5, 0x557799, bx + 20, 4.5, bz + 180);
        // Merlin tail boom
        addBox(14, 2.5, 2.5, 0x557799, bx + 38, 4, bz + 180);
        // Merlin rotor mast
        addCylinder(0.4, 0.4, 6, 6, 0x334466, bx + 20, 8.5, bz + 180);
        // Merlin 3-blade rotor disc approximation
        addBox(20, 0.5, 1.2, 0x445566, bx + 20, 12, bz + 180);
        addBox(10, 0.5, 1.2, 0x445566, bx + 27, 12, bz + 185);
        addBox(10, 0.5, 1.2, 0x445566, bx + 13, 12, bz + 185);
        // Merlin undercarriage
        addBox(16, 0.5, 1, 0x334455, bx + 20, 1.5, bz + 177);
        addBox(16, 0.5, 1, 0x334455, bx + 20, 1.5, bz + 183);

        // Helicopter silhouette: Wildcat
        addBox(14, 4, 3.5, 0x669988, bx + 80, 3.5, bz + 180);
        addBox(10, 1.8, 2, 0x669988, bx + 96, 3, bz + 180);
        addCylinder(0.3, 0.3, 4, 6, 0x445566, bx + 80, 6, bz + 180);
        addBox(14, 0.4, 1, 0x334455, bx + 80, 9, bz + 180);
        addBox(1, 0.4, 14, 0x334455, bx + 80, 9, bz + 180);

        // Company offices
        addBox(80, 30, 50, 0xccccdd, bx - 300, 15, bz + 50);
        // Office windows (decorative dark strips)
        addBox(78, 2, 1, 0x8899aa, bx - 300, 8, bz + 25.5);
        addBox(78, 2, 1, 0x8899aa, bx - 300, 14, bz + 25.5);
        addBox(78, 2, 1, 0x8899aa, bx - 300, 20, bz + 25.5);
        addBox(78, 2, 1, 0x8899aa, bx - 300, 26, bz + 25.5);

        // Company sign / entrance canopy
        addBox(30, 3, 8, 0x334466, bx - 300, 31.5, bz + 26);

        // Security fence posts
        for (var fi = 0; fi < 12; fi++) {
            addCylinder(0.3, 0.3, 4, 4, 0x888888, bx - 400 + fi * 30, 2, bz + 300);
        }
        // Fence rail
        addBox(360, 0.5, 0.5, 0x888888, bx - 220, 3.5, bz + 300);

        // Water tower
        addCylinder(0.5, 0.5, 30, 8, 0x999999, bx + 350, 15, bz - 50);
        addCylinder(5, 4, 8, 10, 0xaaaaaa, bx + 350, 34, bz - 50);

        // Car park
        addBox(200, 0.3, 100, 0x555566, bx - 100, 0.15, bz + 350);
        // Parking lines
        for (var pi = 0; pi < 10; pi++) {
            addBox(1, 0.2, 8, 0xffffff, bx - 190 + pi * 20, 0.4, bz + 350);
        }
    }

    function buildFleetAirArmMuseum() {
        var bx = 13800;
        var bz = 600;

        // Large museum building
        addBox(250, 20, 180, 0xddccbb, bx, 10, bz);
        // Museum roof
        addBox(255, 4, 185, 0xccbbaa, bx, 22, bz);

        // Museum entrance atrium — glazed front
        addBox(80, 25, 20, 0xaabbcc, bx, 12.5, bz - 100);
        // Entrance canopy
        addBox(90, 4, 15, 0x99aabb, bx, 26, bz - 98);

        // Concorde 002 prototype on display — angled nose
        // Main fuselage
        addBox(60, 5, 5, 0xeeeeff, bx + 50, 12, bz - 50);
        // Nose cone (angled drooped nose — use cylinder taper)
        addCylinder(0, 2.5, 15, 8, 0xeeeeff, bx + 20, 12, bz - 50);
        // Delta wing left
        addBox(50, 1, 30, 0xddddee, bx + 40, 11, bz - 65);
        // Delta wing right
        addBox(50, 1, 30, 0xddddee, bx + 40, 11, bz - 35);
        // Tail fin vertical
        addBox(3, 12, 8, 0xeeeeff, bx + 78, 18, bz - 50);
        // Engine nacelles under wings
        addBox(20, 2.5, 4, 0xccccdd, bx + 40, 9, bz - 60);
        addBox(20, 2.5, 4, 0xccccdd, bx + 40, 9, bz - 40);
        // Concorde display stand
        addBox(8, 8, 8, 0x888877, bx + 50, 4, bz - 50);

        // Aircraft carrier flight deck replica on roof
        addBox(220, 3, 80, 0x888877, bx, 24.5, bz + 40);
        // Flight deck markings
        addBox(200, 0.2, 3, 0xffffff, bx, 26.1, bz + 40);
        // Ski jump ramp at end
        addBox(20, 8, 80, 0x777766, bx + 110, 27, bz + 40);
        // Island superstructure on deck
        addBox(15, 20, 30, 0x666655, bx + 90, 37, bz + 20);
        // Mast
        addCylinder(0.4, 0.4, 25, 6, 0x555544, bx + 90, 55, bz + 20);
        // Radar dish approximation
        addBox(8, 1, 8, 0x777766, bx + 90, 68, bz + 20);

        // Aircraft outside museum on hardstanding
        // Sea Harrier
        addBox(14, 4, 4, 0x667788, bx - 80, 4, bz - 120);
        addBox(18, 1.5, 2, 0x667788, bx - 80, 5, bz - 120);
        addCylinder(1.5, 1.5, 10, 8, 0x556677, bx - 80, 4, bz - 120);
        addBox(1, 0.5, 4, 0x445566, bx - 80, 1.5, bz - 117);
        addBox(1, 0.5, 4, 0x445566, bx - 80, 1.5, bz - 123);

        // Swordfish biplane
        addBox(10, 3, 3, 0xaa8833, bx - 120, 3, bz - 120);
        addBox(16, 1, 2, 0xaa8833, bx - 120, 5, bz - 120);
        addBox(16, 1, 2, 0xaa8833, bx - 120, 3, bz - 120);
        // Biplane struts
        addCylinder(0.2, 0.2, 2, 4, 0x887722, bx - 112, 4, bz - 119);
        addCylinder(0.2, 0.2, 2, 4, 0x887722, bx - 128, 4, bz - 119);
        // Radial engine
        addCylinder(1.5, 1.5, 2, 10, 0x444444, bx - 115, 3, bz - 120);

        // Museum cafe building (annex)
        addBox(60, 8, 40, 0xddccbb, bx - 160, 4, bz - 30);

        // Museum sign board
        addBox(40, 6, 1, 0x224488, bx, 10, bz - 92);

        // Flag poles
        addCylinder(0.3, 0.3, 20, 6, 0x888888, bx - 30, 10, bz - 95);
        addBox(6, 3, 0.3, 0xcc0000, bx - 27, 19, bz - 95);
        addCylinder(0.3, 0.3, 20, 6, 0x888888, bx + 30, 10, bz - 95);
        addBox(6, 3, 0.3, 0x002288, bx + 33, 19, bz - 95);
    }

    function buildRNASYeovilton() {
        var bx = 13800;
        var bz = 1300;

        // Control tower — tall, boxy
        addBox(20, 50, 20, 0xccddcc, bx, 25, bz);
        // Glazed cab on top
        addBox(22, 8, 22, 0x88aacc, bx, 54, bz);
        // Roof equipment / aerials
        addCylinder(0.3, 0.3, 10, 6, 0x666666, bx, 63, bz);
        addBox(6, 0.5, 6, 0x777777, bx, 68, bz);
        // Radar antenna
        addBox(8, 1, 2, 0x888888, bx + 2, 70, bz);

        // Control tower base annex
        addBox(40, 15, 30, 0xbbccbb, bx, 7.5, bz + 20);

        // Hangar row — 4 hangars
        addBox(80, 20, 60, 0xaabbaa, bx + 200, 10, bz);
        addBox(80, 20, 60, 0xaabbaa, bx + 300, 10, bz);
        addBox(80, 20, 60, 0xaabbaa, bx + 400, 10, bz);
        addBox(80, 20, 60, 0xaabbaa, bx + 500, 10, bz);
        // Hangar doors
        addBox(35, 19, 2, 0x889988, bx + 160, 9.5, bz - 31);
        addBox(35, 19, 2, 0x889988, bx + 240, 9.5, bz - 31);
        addBox(35, 19, 2, 0x889988, bx + 260, 9.5, bz - 31);
        addBox(35, 19, 2, 0x889988, bx + 340, 9.5, bz - 31);

        // Runway — long concrete strip
        addBox(50, 0.3, 1200, 0x999988, bx + 800, 0.15, bz);
        // Runway centre line
        addBox(2, 0.2, 1200, 0xffffff, bx + 800, 0.35, bz);
        // Runway threshold markings
        addBox(40, 0.2, 4, 0xffffff, bx + 800, 0.35, bz - 600);
        addBox(40, 0.2, 4, 0xffffff, bx + 800, 0.35, bz + 600);

        // Taxiway
        addBox(20, 0.3, 400, 0xaaa999, bx + 700, 0.15, bz + 200);

        // Naval aircraft on hardstanding
        // Sea King helicopter
        addBox(20, 5, 5, 0x336644, bx + 100, 4.5, bz + 80);
        addBox(14, 2.5, 2.5, 0x336644, bx + 118, 4, bz + 80);
        addCylinder(0.5, 0.5, 7, 6, 0x224433, bx + 102, 8.5, bz + 80);
        // 5-blade rotor
        addBox(22, 0.5, 1.5, 0x334455, bx + 102, 12.5, bz + 80);
        addBox(1.5, 0.5, 22, 0x334455, bx + 102, 12.5, bz + 80);
        addBox(15, 0.5, 1.5, 0x334455, bx + 109, 12.5, bz + 88);
        // Tail rotor
        addBox(1, 0.3, 6, 0x334455, bx + 125, 5, bz + 80);
        // Sea King undercarriage
        addBox(16, 0.5, 1, 0x223344, bx + 102, 1.5, bz + 77);
        addBox(16, 0.5, 1, 0x223344, bx + 102, 1.5, bz + 83);

        // Merlin helicopter
        addBox(22, 5, 5, 0x557799, bx + 160, 4.5, bz + 80);
        addBox(14, 2.5, 2.5, 0x557799, bx + 178, 4, bz + 80);
        addCylinder(0.4, 0.4, 6, 6, 0x334466, bx + 162, 8.5, bz + 80);
        addBox(20, 0.5, 1.2, 0x445566, bx + 162, 12, bz + 80);
        addBox(1.2, 0.5, 20, 0x445566, bx + 162, 12, bz + 80);

        // Squadron buildings
        addBox(60, 12, 40, 0xbbccbb, bx + 50, 6, bz - 100);
        addBox(60, 12, 40, 0xbbccbb, bx + 130, 6, bz - 100);

        // Fuel storage tanks
        addCylinder(8, 8, 15, 12, 0x888888, bx - 100, 7.5, bz + 50);
        addCylinder(8, 8, 15, 12, 0x888888, bx - 120, 7.5, bz + 50);

        // Perimeter fence
        addBox(1200, 3, 1, 0x888888, bx + 400, 1.5, bz - 200);
        addBox(1200, 3, 1, 0x888888, bx + 400, 1.5, bz + 200);

        // Gate guardians — aircraft on poles by entrance
        // Phantom jet silhouette
        addBox(18, 3, 3, 0x445566, bx - 60, 8, bz - 60);
        addBox(20, 1, 2, 0x445566, bx - 60, 8.5, bz - 60);
        addCylinder(0.5, 0.5, 6, 6, 0x444444, bx - 60, 5, bz - 60);
        addBox(6, 4, 6, 0x333333, bx - 60, 2, bz - 60);
    }

    function buildHamHill() {
        var bx = 13800;
        var bz = 2400;

        // Hill mound — layered approach
        addCylinder(120, 160, 30, 12, 0x9a8b6a, bx, 15, bz);
        addCylinder(90, 120, 15, 12, 0xa09070, bx, 35, bz);
        addCylinder(60, 90, 10, 12, 0xaa9878, bx, 47, bz);

        // Iron Age ramparts — outer ring
        addBox(280, 6, 8, 0x8a7a5a, bx, 4, bz - 140);
        addBox(280, 6, 8, 0x8a7a5a, bx, 4, bz + 140);
        addBox(8, 6, 280, 0x8a7a5a, bx - 140, 4, bz);
        addBox(8, 6, 280, 0x8a7a5a, bx + 140, 4, bz);

        // Inner rampart
        addBox(200, 5, 6, 0x7a6a4a, bx, 31, bz - 95);
        addBox(200, 5, 6, 0x7a6a4a, bx, 31, bz + 95);
        addBox(6, 5, 200, 0x7a6a4a, bx - 95, 31, bz);
        addBox(6, 5, 200, 0x7a6a4a, bx + 95, 31, bz);

        // Ditch — suggested by dark band
        addBox(270, 0.5, 6, 0x6a5a3a, bx, 1, bz - 118);
        addBox(270, 0.5, 6, 0x6a5a3a, bx, 1, bz + 118);

        // Quarry areas (Ham stone — warm golden limestone)
        addBox(60, 8, 80, 0xcc9944, bx - 200, 4, bz + 100);
        // Quarry face
        addBox(60, 15, 4, 0xbb8833, bx - 200, 7.5, bz + 60);
        // Quarry rubble/spoil
        addBox(30, 4, 20, 0xddaa55, bx - 180, 2, bz + 90);
        addBox(20, 3, 15, 0xddaa55, bx - 215, 1.5, bz + 105);

        // Ham stone boulders
        addSphere(3, 6, 6, 0xcc9944, bx - 195, 3, bz + 95);
        addSphere(2, 6, 6, 0xddaa55, bx - 210, 2, bz + 100);
        addSphere(4, 6, 6, 0xcc9944, bx - 185, 4, bz + 88);

        // Trig point on summit
        addBox(1.5, 4, 1.5, 0xffffff, bx, 54, bz);
        addCone(1, 2, 4, 0xffffff, bx, 57, bz);

        // The Prince of Wales pub / cafe
        addBox(20, 8, 14, 0xcc9966, bx + 80, 37, bz - 20);
        addBox(22, 2, 16, 0x885533, bx + 80, 42, bz - 20);
        // Pub sign
        addBox(4, 5, 0.5, 0x553311, bx + 70, 41, bz - 27);
        // Pub chimney
        addBox(2, 6, 2, 0x996655, bx + 84, 45, bz - 22);

        // Trees on hillfort
        addCylinder(0.5, 0.5, 8, 6, 0x442200, bx + 30, 41, bz + 30);
        addSphere(4, 6, 6, 0x226622, bx + 30, 48, bz + 30);
        addCylinder(0.5, 0.5, 8, 6, 0x442200, bx - 40, 39, bz + 20);
        addSphere(5, 6, 6, 0x228822, bx - 40, 46, bz + 20);
        addCylinder(0.5, 0.5, 8, 6, 0x442200, bx + 50, 40, bz - 50);
        addSphere(4, 6, 6, 0x336633, bx + 50, 47, bz - 50);

        // Viewpoint bench / monument
        addBox(6, 1, 2, 0x887755, bx + 60, 52, bz + 10);
        addBox(1, 3, 2, 0x887755, bx + 57, 50.5, bz + 10);
        addBox(1, 3, 2, 0x887755, bx + 63, 50.5, bz + 10);

        // Country park paths (pale gravel)
        addBox(3, 0.3, 200, 0xddccaa, bx + 20, 0.2, bz - 50);
        addBox(3, 0.3, 150, 0xddccaa, bx - 30, 0.2, bz + 60);
    }

    function buildYeovilTown() {
        var bx = 13800;
        var bz = 3200;

        // Quedam Centre — shopping mall
        addBox(120, 18, 80, 0xddcccc, bx, 9, bz);
        addBox(125, 4, 85, 0xccbbbb, bx, 20, bz);
        // Quedam glass atrium
        addBox(30, 20, 30, 0x99aacc, bx - 30, 10, bz - 55);
        // Quedam entrance
        addBox(20, 10, 8, 0x88aabb, bx, 5, bz - 45);

        // Pen Mill station
        addBox(60, 10, 20, 0xcc9966, bx + 300, 5, bz - 100);
        // Station platforms
        addBox(80, 1, 8, 0xaaaaaa, bx + 300, 0.5, bz - 80);
        addBox(80, 1, 8, 0xaaaaaa, bx + 300, 0.5, bz - 115);
        // Station canopy
        addBox(70, 2, 10, 0x887766, bx + 300, 11, bz - 80);
        // Station waiting room
        addBox(20, 8, 15, 0xcc9966, bx + 320, 4, bz - 100);
        // Signal box
        addBox(8, 10, 8, 0xbb8855, bx + 260, 5, bz - 95);
        addBox(9, 3, 9, 0x99aacc, bx + 260, 11.5, bz - 95);
        // Railway tracks
        addBox(0.5, 0.3, 400, 0x444444, bx + 299, 0.2, bz - 100);
        addBox(0.5, 0.3, 400, 0x444444, bx + 301, 0.2, bz - 100);

        // Garden of Remembrance
        addBox(40, 0.3, 30, 0x336633, bx - 150, 0.15, bz + 100);
        // War memorial
        addBox(3, 15, 3, 0xbbbbbb, bx - 150, 7.5, bz + 100);
        addCone(2, 4, 4, 0xaaaaaa, bx - 150, 17, bz + 100);
        // Memorial wreaths suggested by low cylinders
        addCylinder(3, 3, 0.5, 12, 0xaa2222, bx - 150, 0.5, bz + 100);
        // Flower beds
        addBox(8, 0.5, 5, 0xff6699, bx - 160, 0.5, bz + 95);
        addBox(8, 0.5, 5, 0xff9933, bx - 140, 0.5, bz + 105);
        // Park benches
        addBox(4, 0.8, 1.5, 0x885533, bx - 155, 0.7, bz + 108);
        addBox(4, 0.8, 1.5, 0x885533, bx - 145, 0.7, bz + 92);

        // Market area / High Street
        addBox(200, 0.3, 20, 0xbbbbaa, bx + 50, 0.15, bz + 200);
        // Market stalls
        addBox(10, 5, 8, 0x334499, bx + 10, 2.5, bz + 205);
        addBox(3, 5, 0.5, 0x334499, bx + 5, 2.5, bz + 203);
        addBox(3, 5, 0.5, 0x334499, bx + 15, 2.5, bz + 203);
        addBox(12, 1, 10, 0x5577bb, bx + 10, 5.5, bz + 205);

        addBox(10, 5, 8, 0x993344, bx + 40, 2.5, bz + 205);
        addBox(12, 1, 10, 0xbb5577, bx + 40, 5.5, bz + 205);

        addBox(10, 5, 8, 0x339944, bx + 70, 2.5, bz + 205);
        addBox(12, 1, 10, 0x55bb77, bx + 70, 5.5, bz + 205);

        // Yeovil town centre buildings (generic blocks)
        addBox(30, 20, 25, 0xccbbaa, bx - 50, 10, bz + 150);
        addBox(25, 15, 20, 0xddccbb, bx - 90, 7.5, bz + 160);
        addBox(40, 25, 30, 0xbbaaaa, bx + 80, 12.5, bz + 160);
        // Church / town hall spire
        addBox(15, 30, 15, 0xddddcc, bx + 200, 15, bz + 200);
        addCone(8, 20, 6, 0x887766, bx + 200, 40, bz + 200);
        // Church nave
        addBox(30, 18, 50, 0xddddcc, bx + 200, 9, bz + 220);
    }

    function buildMontacuteHouse() {
        var bx = 13800;
        var bz = 4200;

        // Main E-shaped house — Elizabethan
        // Central block
        addBox(80, 25, 40, 0xddbb88, bx, 12.5, bz);
        // East wing
        addBox(30, 22, 50, 0xddbb88, bx + 55, 11, bz);
        // West wing
        addBox(30, 22, 50, 0xddbb88, bx - 55, 11, bz);
        // East return (E crossbar)
        addBox(20, 18, 20, 0xddbb88, bx + 70, 9, bz - 35);
        addBox(20, 18, 20, 0xddbb88, bx + 70, 9, bz + 35);
        // West return
        addBox(20, 18, 20, 0xddbb88, bx - 70, 9, bz - 35);
        addBox(20, 18, 20, 0xddbb88, bx - 70, 9, bz + 35);

        // Corner towers — octagonal turrets
        addCylinder(5, 5, 30, 8, 0xddbb88, bx + 80, 15, bz - 45);
        addCylinder(5, 5, 30, 8, 0xddbb88, bx + 80, 15, bz + 45);
        addCylinder(5, 5, 30, 8, 0xddbb88, bx - 80, 15, bz - 45);
        addCylinder(5, 5, 30, 8, 0xddbb88, bx - 80, 15, bz + 45);
        // Tower caps / ogee domes
        addCone(5, 8, 8, 0x998866, bx + 80, 31, bz - 45);
        addCone(5, 8, 8, 0x998866, bx + 80, 31, bz + 45);
        addCone(5, 8, 8, 0x998866, bx - 80, 31, bz - 45);
        addCone(5, 8, 8, 0x998866, bx - 80, 31, bz + 45);

        // Long Gallery — top floor
        addBox(82, 5, 12, 0xeeccaa, bx, 27.5, bz);
        // Long Gallery windows (decorative)
        addBox(78, 3, 1, 0x88aacc, bx, 27, bz + 6.5);
        addBox(78, 3, 1, 0x88aacc, bx, 27, bz - 6.5);

        // Parapets / battlements
        addBox(86, 2, 3, 0xddbb88, bx, 26, bz - 21);
        addBox(86, 2, 3, 0xddbb88, bx, 26, bz + 21);
        // Parapet merlons
        for (var mi = 0; mi < 10; mi++) {
            addBox(4, 3, 3, 0xddbb88, bx - 40 + mi * 9, 28, bz - 21);
            addBox(4, 3, 3, 0xddbb88, bx - 40 + mi * 9, 28, bz + 21);
        }

        // Formal garden — east forecourt
        addBox(160, 0.3, 100, 0x446633, bx + 160, 0.15, bz);
        // Garden parterre paths
        addBox(160, 0.2, 3, 0xddccaa, bx + 160, 0.3, bz);
        addBox(3, 0.2, 100, 0xddccaa, bx + 160, 0.3, bz);
        addBox(3, 0.2, 100, 0xddccaa, bx + 120, 0.3, bz);
        addBox(3, 0.2, 100, 0xddccaa, bx + 200, 0.3, bz);
        addBox(80, 0.2, 3, 0xddccaa, bx + 160, 0.3, bz - 40);
        addBox(80, 0.2, 3, 0xddccaa, bx + 160, 0.3, bz + 40);

        // Topiary cones
        addCone(4, 10, 8, 0x225522, bx + 120, 5, bz - 30);
        addCone(4, 10, 8, 0x225522, bx + 120, 5, bz + 30);
        addCone(4, 10, 8, 0x225522, bx + 200, 5, bz - 30);
        addCone(4, 10, 8, 0x225522, bx + 200, 5, bz + 30);
        // Topiary spheres
        addSphere(3, 8, 8, 0x224422, bx + 140, 3, bz - 45);
        addSphere(3, 8, 8, 0x224422, bx + 140, 3, bz + 45);
        addSphere(3, 8, 8, 0x224422, bx + 180, 3, bz - 45);
        addSphere(3, 8, 8, 0x224422, bx + 180, 3, bz + 45);

        // West formal garden (lawn)
        addBox(120, 0.3, 100, 0x558844, bx - 160, 0.15, bz);
        // Garden wall
        addBox(3, 6, 100, 0xddbb88, bx - 225, 3, bz);
        addBox(120, 6, 3, 0xddbb88, bx - 160, 3, bz - 52);
        addBox(120, 6, 3, 0xddbb88, bx - 160, 3, bz + 52);
        // Garden gate pillars
        addBox(3, 8, 3, 0xddbb88, bx - 225, 4, bz - 8);
        addBox(3, 8, 3, 0xddbb88, bx - 225, 4, bz + 8);
        addBox(3, 4, 3, 0x998866, bx - 225, 10, bz - 8);
        addBox(3, 4, 3, 0x998866, bx - 225, 10, bz + 8);

        // Fountain / sundial in east garden
        addCylinder(6, 8, 1.5, 12, 0xbbaa88, bx + 160, 0.75, bz);
        addCylinder(0.5, 0.5, 8, 6, 0xccbb99, bx + 160, 4, bz);
        addSphere(2, 8, 8, 0xbbaa88, bx + 160, 9, bz);

        // Dovecote
        addCylinder(4, 4, 10, 10, 0xddbb88, bx - 10, 5, bz + 120);
        addCone(5, 6, 10, 0x998866, bx - 10, 11, bz + 120);

        // Gatehouse at entrance
        addBox(20, 18, 15, 0xddbb88, bx + 250, 9, bz);
        addBox(8, 8, 15, 0xddbb88, bx + 264, 4, bz);
        addCone(5, 8, 8, 0x998866, bx + 250 - 5, 19, bz);
        addCone(5, 8, 8, 0x998866, bx + 250 + 5, 19, bz);
        // Gate arch
        addBox(10, 6, 3, 0xddbb88, bx + 260, 10, bz);

        // Approach avenue — trees
        for (var ti = 0; ti < 8; ti++) {
            addCylinder(0.6, 0.6, 10, 6, 0x442200, bx + 260 + ti * 20, 5, bz - 15);
            addSphere(5, 6, 6, 0x335533, bx + 260 + ti * 20, 13, bz - 15);
            addCylinder(0.6, 0.6, 10, 6, 0x442200, bx + 260 + ti * 20, 5, bz + 15);
            addSphere(5, 6, 6, 0x335533, bx + 260 + ti * 20, 13, bz + 15);
        }
    }

    function build() {
        buildWestlandFactory();
        buildFleetAirArmMuseum();
        buildRNASYeovilton();
        buildHamHill();
        buildYeovilTown();
        buildMontacuteHouse();
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
