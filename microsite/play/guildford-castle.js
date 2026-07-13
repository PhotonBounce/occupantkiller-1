window.GuildfordCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef; camera = cameraRef;
        objects = [];
        build();
    }

    function addmesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addmesh(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addmesh(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addmesh(mesh);
        return mesh;
    }

    function build() {
        var ox = 6000;
        var oz = 0;

        // ---- 1. Castle Keep (Norman tower) ----
        // Main tower body: 10x16x10
        makebox(10, 16, 10, 0xAA9977, ox + 0, 8, oz + 0);                   // obj 1

        // 4 corner buttresses: 2x16x2
        makebox(2, 16, 2, 0xAA9977, ox - 6, 8, oz - 6);                     // obj 2
        makebox(2, 16, 2, 0xAA9977, ox + 6, 8, oz - 6);                     // obj 3
        makebox(2, 16, 2, 0xAA9977, ox - 6, 8, oz + 6);                     // obj 4
        makebox(2, 16, 2, 0xAA9977, ox + 6, 8, oz + 6);                     // obj 5

        // 8 merlons (crenellations) around parapet top — alternating around perimeter
        makebox(1, 2, 1, 0xAA9977, ox - 4, 17, oz - 5);                     // obj 6
        makebox(1, 2, 1, 0xAA9977, ox - 2, 17, oz - 5);                     // obj 7
        makebox(1, 2, 1, 0xAA9977, ox + 2, 17, oz - 5);                     // obj 8
        makebox(1, 2, 1, 0xAA9977, ox + 4, 17, oz - 5);                     // obj 9
        makebox(1, 2, 1, 0xAA9977, ox - 4, 17, oz + 5);                     // obj 10
        makebox(1, 2, 1, 0xAA9977, ox + 2, 17, oz + 5);                     // obj 11
        makebox(1, 2, 1, 0xAA9977, ox - 5, 17, oz - 2);                     // obj 12
        makebox(1, 2, 1, 0xAA9977, ox - 5, 17, oz + 2);                     // obj 13

        // ---- 2. Castle mound — 4 stepped boxes decreasing width ----
        makebox(26, 2, 26, 0x6B5A3E, ox + 0, 1, oz + 0);                    // obj 14 — base tier
        makebox(20, 2, 20, 0x7A6A4E, ox + 0, 3, oz + 0);                    // obj 15
        makebox(14, 2, 14, 0x8A7A5E, ox + 0, 5, oz + 0);                    // obj 16
        makebox(10, 2, 10, 0x9A8A6E, ox + 0, 7, oz + 0);                    // obj 17 — top tier under keep

        // ---- 3. High Street Guildhall ----
        // Main Tudor building: 15x10x8
        makebox(15, 10, 8, 0xCC8833, ox + 35, 5, oz - 10);                  // obj 18
        // Protruding clock housing: 4x4x4
        makebox(4, 4, 4, 0xBB7722, ox + 35, 12, oz - 10);                   // obj 19
        // Clock face: CylinderGeometry (flat disc)
        makecylinder(1.5, 1.5, 0.3, 16, 0xF5F5DC, ox + 35, 14.2, oz - 14); // obj 20
        // Cone cap on clock tower
        makecone(2.5, 4, 8, 0x884411, ox + 35, 16.5, oz - 10);              // obj 21

        // ---- 4. Tunsgate Arch ----
        // Left pillar
        makebox(2, 8, 2, 0xCCBB99, ox + 20, 4, oz - 10);                    // obj 22
        // Right pillar
        makebox(2, 8, 2, 0xCCBB99, ox + 34, 4, oz - 10);                    // obj 23
        // Crossbar
        makebox(14, 2, 2, 0xCCBB99, ox + 27, 8.5, oz - 10);                 // obj 24

        // ---- 5. Guildford Cathedral — modernist 1961 brick ----
        // Long nave: 40x15x10
        makebox(40, 15, 10, 0x993322, ox - 60, 7.5, oz - 40);               // obj 25
        // Tower: 12x22x12
        makebox(12, 22, 12, 0x993322, ox - 60, 11, oz - 40);                // obj 26
        // Cone cap on tower
        makecone(5, 8, 8, 0x771111, ox - 60, 25, oz - 40);                  // obj 27

        // ---- 6. River Wey — flat water surface ----
        makebox(70, 0.2, 8, 0x336688, ox + 10, 0.1, oz + 30);               // obj 28

        // ---- 7. Town Mill — old watermill ----
        // Main mill building: 12x10x8
        makebox(12, 10, 8, 0x8B6914, ox + 20, 5, oz + 30);                  // obj 29
        // Millwheel frame: CylinderGeometry r=3, width=1
        makecylinder(3, 3, 1, 12, 0x5A4010, ox + 14, 4, oz + 30);           // obj 30
        // Mill roof
        makebox(13, 1.5, 9, 0x6A5010, ox + 20, 10.7, oz + 30);              // obj 31

        // ---- 8. Victorian terraces on High Street slope ----
        // Row 1 (y base = 0) — 6 houses
        makebox(5, 7, 5, 0x9B3A2A, ox + 45, 3.5, oz - 5);                   // obj 32
        makebox(5, 7, 5, 0x9B3A2A, ox + 51, 3.5, oz - 5);                   // obj 33
        makebox(5, 7, 5, 0x9B3A2A, ox + 57, 3.5, oz - 5);                   // obj 34
        makebox(5, 7, 5, 0x9B3A2A, ox + 63, 3.5, oz - 5);                   // obj 35
        makebox(5, 7, 5, 0x9B3A2A, ox + 69, 3.5, oz - 5);                   // obj 36
        makebox(5, 7, 5, 0x9B3A2A, ox + 75, 3.5, oz - 5);                   // obj 37

        // Row 2 (y base = 2) — 6 houses stepped up
        makebox(5, 7, 5, 0x9B3A2A, ox + 45, 5.5, oz - 13);                  // obj 38
        makebox(5, 7, 5, 0x9B3A2A, ox + 51, 5.5, oz - 13);                  // obj 39
        makebox(5, 7, 5, 0x9B3A2A, ox + 57, 5.5, oz - 13);                  // obj 40
        makebox(5, 7, 5, 0x9B3A2A, ox + 63, 5.5, oz - 13);                  // obj 41
        makebox(5, 7, 5, 0x9B3A2A, ox + 69, 5.5, oz - 13);                  // obj 42
        makebox(5, 7, 5, 0x9B3A2A, ox + 75, 5.5, oz - 13);                  // obj 43

        // Row 3 (y base = 4) — 6 houses stepped up further
        makebox(5, 7, 5, 0x9B3A2A, ox + 45, 7.5, oz - 21);                  // obj 44
        makebox(5, 7, 5, 0x9B3A2A, ox + 51, 7.5, oz - 21);                  // obj 45
        makebox(5, 7, 5, 0x9B3A2A, ox + 57, 7.5, oz - 21);                  // obj 46
        makebox(5, 7, 5, 0x9B3A2A, ox + 63, 7.5, oz - 21);                  // obj 47
        makebox(5, 7, 5, 0x9B3A2A, ox + 69, 7.5, oz - 21);                  // obj 48
        makebox(5, 7, 5, 0x9B3A2A, ox + 75, 7.5, oz - 21);                  // obj 49

        // ---- 9. River boat — narrow canal boat ----
        makebox(14, 3, 2.5, 0x2244AA, ox + 5, 1.6, oz + 28);                // obj 50

        // ---- Extra details to reach 55-65 total ----
        // Castle gateway arch pillars
        makebox(1.5, 5, 1.5, 0xAA9977, ox - 4, 2.5, oz + 5);               // obj 51
        makebox(1.5, 5, 1.5, 0xAA9977, ox + 4, 2.5, oz + 5);               // obj 52

        // Cathedral side aisle
        makebox(10, 9, 8, 0x993322, ox - 75, 4.5, oz - 40);                 // obj 53

        // Guildhall chimney stacks
        makebox(1, 3, 1, 0x884411, ox + 30, 15.5, oz - 10);                 // obj 54
        makebox(1, 3, 1, 0x884411, ox + 40, 15.5, oz - 10);                 // obj 55

        // River bank reinforcement boxes
        makebox(70, 1, 2, 0x7A6A4E, ox + 10, 0.5, oz + 26);                 // obj 56
        makebox(70, 1, 2, 0x7A6A4E, ox + 10, 0.5, oz + 34);                 // obj 57

        // Castle well / courtyard feature
        makecylinder(1.5, 1.5, 2, 8, 0x887766, ox + 6, 8.0, oz + 0);       // obj 58

        // Boat cabin
        makebox(4, 2, 2, 0x1A3388, ox + 2, 3.6, oz + 28);                   // obj 59

        // Cathedral west porch
        makebox(6, 8, 4, 0x993322, ox - 40, 4, oz - 40);                    // obj 60

        // Mill loading bay overhang
        makebox(4, 1, 4, 0x6A5010, ox + 20, 10, oz + 34);                   // obj 61

        // High Street pavement / road strip
        makebox(50, 0.3, 6, 0x888888, ox + 55, 0.15, oz - 9);               // obj 62
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        objects = []; scene = null; camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
