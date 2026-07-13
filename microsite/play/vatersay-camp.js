window.VatersayCamp = (function() {
    'use strict';

    var WX = 1660;
    var WZ = 2200;

    function makebox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makesphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function buildcatalina(scene) {
        // Main hull — elongated box partially buried in sand
        makebox(scene, 18, 2, 6, 0x4A4A4A, WX + 0, 0.5, WZ + 0);

        // Broken wing stub left
        makebox(scene, 7, 1, 2, 0x3E3E3E, WX - 11, 1.2, WZ - 1);

        // Broken wing stub right
        makebox(scene, 7, 1, 2, 0x3E3E3E, WX + 11, 1.0, WZ + 1);

        // Nose section — slightly raised cone approximated as narrow box
        makebox(scene, 3, 1.5, 4, 0x4A4A4A, WX - 10, 1.0, WZ + 0);

        // Tail fin — vertical narrow box
        makebox(scene, 1, 4, 0.5, 0x4A4A4A, WX + 8, 2.5, WZ + 0);

        // Cockpit blister
        makebox(scene, 2, 1.5, 2, 0x5A5A5A, WX - 3, 2.0, WZ + 0);

        // Engine nacelle remnant left
        makecylinder(scene, 0.8, 0.8, 3, 8, 0x3A3A3A, WX - 5, 1.5, WZ - 4);

        // Engine nacelle remnant right
        makecylinder(scene, 0.8, 0.8, 3, 8, 0x3A3A3A, WX - 5, 1.5, WZ + 4);

        // Propeller hub sphere left
        makesphere(scene, 0.4, 6, 6, 0x2A2A2A, WX - 5, 2.8, WZ - 4);

        // Propeller hub sphere right
        makesphere(scene, 0.4, 6, 6, 0x2A2A2A, WX - 5, 2.8, WZ + 4);

        // Sand burial mound under hull
        makebox(scene, 20, 1, 8, 0xD4B483, WX + 0, -0.2, WZ + 0);
    }

    function buildcauseway(scene) {
        // Stone causeway 25 units long, box-built construction
        // Main roadbed
        makebox(scene, 25, 1, 5, 0x7A7060, WX + 40, 0.3, WZ + 5);

        // Stone kerb blocks left side
        makebox(scene, 25, 0.8, 0.6, 0x8A8070, WX + 40, 0.9, WZ + 2.5);

        // Stone kerb blocks right side
        makebox(scene, 25, 0.8, 0.6, 0x8A8070, WX + 40, 0.9, WZ + 7.5);

        // Support pillar section west
        makebox(scene, 3, 2.5, 6, 0x6A6055, WX + 29, -0.5, WZ + 5);

        // Support pillar section mid
        makebox(scene, 3, 2.5, 6, 0x6A6055, WX + 40, -0.5, WZ + 5);

        // Support pillar section east
        makebox(scene, 3, 2.5, 6, 0x6A6055, WX + 51, -0.5, WZ + 5);

        // Approach ramp west
        makebox(scene, 4, 0.8, 5, 0x7A7060, WX + 26, 0.1, WZ + 5);

        // Approach ramp east
        makebox(scene, 4, 0.8, 5, 0x7A7060, WX + 54, 0.1, WZ + 5);
    }

    function buildmemorialcairn(scene) {
        // Base slab
        makebox(scene, 4, 0.6, 4, 0x6E6E6E, WX + 18, 0.3, WZ - 15);

        // Lower stone pile
        makebox(scene, 3, 2, 3, 0x8A8A8A, WX + 18, 1.3, WZ - 15);

        // Mid stone pile — slightly narrower
        makebox(scene, 2.2, 2, 2.2, 0x909090, WX + 18, 3.3, WZ - 15);

        // Upper stone pile
        makebox(scene, 1.6, 1.8, 1.6, 0x888888, WX + 18, 5.2, WZ - 15);

        // Top cap
        makebox(scene, 1.2, 1, 1.2, 0x8E8E8E, WX + 18, 6.6, WZ - 15);

        // Plaque slab — vertical on south face
        makebox(scene, 1.8, 1.2, 0.2, 0xB0A898, WX + 18, 2.0, WZ - 16.7);

        // Surrounding stones — scattered low boxes
        makebox(scene, 1.2, 0.5, 0.8, 0x7A7A7A, WX + 16, 0.2, WZ - 16);
        makebox(scene, 0.8, 0.4, 1.0, 0x828282, WX + 20, 0.2, WZ - 14);
        makebox(scene, 1.0, 0.6, 0.7, 0x787878, WX + 17, 0.2, WZ - 13.5);
    }

    function buildbunker(scene) {
        // Main bunker roof slab (recessed underground style, sits low)
        makebox(scene, 8, 3, 8, 0x7A7A7A, WX - 20, -0.5, WZ - 20);

        // Blast door — thick box on south face
        makebox(scene, 3, 2.2, 0.6, 0x5A5A5A, WX - 20, 0.1, WZ - 16.8);

        // Door frame surround
        makebox(scene, 3.6, 2.8, 0.3, 0x6A6A6A, WX - 20, 0.1, WZ - 16.6);

        // Entry tunnel approach — sunken box
        makebox(scene, 2.5, 1, 3, 0x6E6E6E, WX - 20, -0.8, WZ - 14.5);

        // Ventilation stub left
        makecylinder(scene, 0.3, 0.3, 1.5, 6, 0x6A6A6A, WX - 22, 1.7, WZ - 20);

        // Ventilation stub right
        makecylinder(scene, 0.3, 0.3, 1.5, 6, 0x6A6A6A, WX - 18, 1.7, WZ - 20);

        // Rubble scatter box
        makebox(scene, 2.5, 0.8, 1.5, 0x7E7E7E, WX - 24, 0.1, WZ - 18);

        // Supply crate box outside entry
        makebox(scene, 1.2, 1.2, 1.2, 0x8B7355, WX - 19, 0.3, WZ - 13);

        // Second supply crate
        makebox(scene, 1.2, 1.2, 1.2, 0x8B7355, WX - 21, 0.3, WZ - 13);

        // Dirt berm mound over bunker top
        makebox(scene, 10, 1.5, 10, 0x9B8B6B, WX - 20, 1.2, WZ - 20);
    }

    function builddunes(scene) {
        // Sand dune 1 — tall narrow box
        makebox(scene, 3, 5, 8, 0xD4B483, WX + 10, 1.5, WZ + 20);

        // Sand dune 2
        makebox(scene, 4, 4, 6, 0xCCAA70, WX + 15, 1.0, WZ + 28);

        // Sand dune 3 — tallest
        makebox(scene, 2.5, 7, 7, 0xD4B483, WX + 5, 2.5, WZ + 35);

        // Sand dune 4
        makebox(scene, 5, 4.5, 5, 0xD0AF7A, WX - 5, 1.5, WZ + 30);

        // Sand dune 5 — wide shallow
        makebox(scene, 8, 3, 5, 0xD4B483, WX - 12, 0.8, WZ + 22);

        // Dune ridge connector strip
        makebox(scene, 10, 2, 3, 0xCCAA70, WX + 8, 0.5, WZ + 24);

        // Low foreground dune
        makebox(scene, 6, 2.5, 4, 0xD4B483, WX + 20, 0.5, WZ + 18);

        // Beach grass tufts — thin narrow boxes
        makebox(scene, 0.3, 1.5, 0.3, 0x8B9B5A, WX + 11, 3.5, WZ + 22);
        makebox(scene, 0.3, 1.2, 0.3, 0x7A8A4A, WX + 9, 3.0, WZ + 19);
        makebox(scene, 0.3, 1.8, 0.3, 0x8B9B5A, WX + 6, 5.4, WZ + 35);
        makebox(scene, 0.3, 1.4, 0.3, 0x7A8A4A, WX + 4, 5.0, WZ + 37);
    }

    function buildgunposition(scene) {
        // Concrete circular platform base — box approximation
        makebox(scene, 6, 1, 6, 0x9E9E9E, WX - 30, 0.5, WZ + 10);

        // Platform inner ring elevation
        makebox(scene, 5, 0.4, 5, 0xA8A8A8, WX - 30, 1.2, WZ + 10);

        // Gun pedestal centre
        makecylinder(scene, 0.6, 0.8, 1.2, 8, 0x888888, WX - 30, 1.9, WZ + 10);

        // Twin gun barrel left — horizontal cylinder, rotated via matrix omitted,
        // represented as a narrow horizontal box
        makebox(scene, 5, 0.3, 0.3, 0x5A5A5A, WX - 32.5, 2.8, WZ + 9.5);

        // Twin gun barrel right
        makebox(scene, 5, 0.3, 0.3, 0x5A5A5A, WX - 32.5, 2.8, WZ + 10.5);

        // Gun shield — protective box slab
        makebox(scene, 0.3, 1.5, 2, 0x888888, WX - 28.2, 2.2, WZ + 10);

        // Ammo box stack left
        makebox(scene, 1, 1.5, 0.8, 0x6B7055, WX - 32, 1.5, WZ + 8);

        // Ammo box stack right
        makebox(scene, 1, 1.5, 0.8, 0x6B7055, WX - 32, 1.5, WZ + 12);

        // Sandbag wall north
        makebox(scene, 6, 1.2, 0.8, 0xB8A878, WX - 30, 1.5, WZ + 7.2);

        // Sandbag wall south
        makebox(scene, 6, 1.2, 0.8, 0xB8A878, WX - 30, 1.5, WZ + 12.8);

        // Sandbag wall east
        makebox(scene, 0.8, 1.2, 6, 0xB8A878, WX - 26.8, 1.5, WZ + 10);

        // Observation post box
        makebox(scene, 1.5, 1.5, 1.5, 0x9E9E9E, WX - 27, 2.3, WZ + 10);

        // Headland rocky outcrop
        makebox(scene, 10, 2.5, 6, 0x787878, WX - 35, 0.5, WZ + 10);
        makebox(scene, 6, 1.5, 4, 0x707070, WX - 39, 0.3, WZ + 10);
    }

    function buildedgedetails(scene) {
        // Scattered beach boulders
        makebox(scene, 1.8, 1.2, 1.5, 0x8A8A7A, WX + 25, 0.3, WZ - 5);
        makebox(scene, 2.2, 0.9, 1.8, 0x828272, WX + 28, 0.2, WZ - 8);
        makebox(scene, 1.4, 1.4, 1.4, 0x8E8E7E, WX - 8, 0.3, WZ + 8);
        makebox(scene, 1.0, 0.8, 1.2, 0x888878, WX - 14, 0.2, WZ + 15);

        // Driftwood logs — thin long boxes lying flat
        makebox(scene, 5, 0.4, 0.4, 0x8B6914, WX + 30, 0.1, WZ + 0);
        makebox(scene, 4, 0.3, 0.3, 0x7A5A10, WX + 22, 0.1, WZ - 10);

        // Wreckage debris pieces from Catalina
        makebox(scene, 2.5, 0.2, 0.8, 0x3E3E3E, WX + 14, 0.1, WZ - 4);
        makebox(scene, 1.8, 0.2, 1.2, 0x4A4A4A, WX - 14, 0.1, WZ + 3);

        // Marker post cylinders
        makecylinder(scene, 0.15, 0.15, 2.5, 6, 0x5A4A2A, WX + 35, 1.2, WZ + 5);
        makecylinder(scene, 0.15, 0.15, 2.5, 6, 0x5A4A2A, WX + 45, 1.2, WZ + 5);

        // Small hillock
        makebox(scene, 8, 3, 8, 0x8A9A6A, WX - 40, 0.5, WZ - 5);
        makebox(scene, 5, 1.5, 5, 0x909A70, WX - 40, 3.2, WZ - 5);
    }

    function create(scene) {
        buildcatalina(scene);
        buildcauseway(scene);
        buildmemorialcairn(scene);
        buildbunker(scene);
        builddunes(scene);
        buildgunposition(scene);
        buildedgedetails(scene);
    }

    return {
        create: create,
        worldX: WX,
        worldZ: WZ
    };

}());
