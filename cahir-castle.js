window.CahirCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 17960;
    var CY = 0;
    var CZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, mat, x, y, z, rx, ry, rz) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function matLimestone() {
        return new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    }
    function matRock() {
        return new THREE.MeshLambertMaterial({ color: 0x696969 });
    }
    function matWater() {
        return new THREE.MeshLambertMaterial({ color: 0x006994 });
    }
    function matTown() {
        return new THREE.MeshLambertMaterial({ color: 0xCD5C5C });
    }
    function matSlate() {
        return new THREE.MeshLambertMaterial({ color: 0x4A4A5A });
    }
    function matWood() {
        return new THREE.MeshLambertMaterial({ color: 0x8B5E3C });
    }
    function matDark() {
        return new THREE.MeshLambertMaterial({ color: 0x222222 });
    }
    function matThatch() {
        return new THREE.MeshLambertMaterial({ color: 0xC8A96E });
    }
    function matGreen() {
        return new THREE.MeshLambertMaterial({ color: 0x3A6B35 });
    }
    function matWhite() {
        return new THREE.MeshLambertMaterial({ color: 0xF5F0E8 });
    }
    function matIron() {
        return new THREE.MeshLambertMaterial({ color: 0x333333 });
    }

    function build() {
        buildRiver();
        buildIsland();
        buildOuterWard();
        buildInnerWard();
        buildGreatKeep();
        buildCornerTowers();
        buildGatehouse();
        buildDrawbridge();
        buildInnerHallRange();
        buildMerlons();
        buildTown();
        buildSwissCottage();
        buildGroundVegetation();
    }

    function buildRiver() {
        // Main river body — wide expanse of River Suir
        addMesh(new THREE.BoxGeometry(200, 0.5, 120), matWater(), CX, CY - 0.25, CZ);
        // River extension left
        addMesh(new THREE.BoxGeometry(80, 0.5, 80), matWater(), CX - 120, CY - 0.25, CZ);
        // River extension right
        addMesh(new THREE.BoxGeometry(80, 0.5, 80), matWater(), CX + 120, CY - 0.25, CZ);
    }

    function buildIsland() {
        // Main island base — rocky limestone outcrop
        addMesh(new THREE.BoxGeometry(60, 1.5, 50), matRock(), CX, CY - 0.5, CZ);
        // Island irregular edges — extra rock slabs to break up the shape
        addMesh(new THREE.BoxGeometry(10, 1.2, 15), matRock(), CX - 28, CY - 0.6, CZ - 5);
        addMesh(new THREE.BoxGeometry(12, 1.0, 10), matRock(), CX + 29, CY - 0.6, CZ + 4);
        addMesh(new THREE.BoxGeometry(8, 1.0, 12), matRock(), CX + 5, CY - 0.6, CZ - 26);
        addMesh(new THREE.BoxGeometry(14, 1.1, 8), matRock(), CX - 5, CY - 0.6, CZ + 26);
        // Grassy ground on island
        addMesh(new THREE.BoxGeometry(54, 0.3, 44), matGreen(), CX, CY + 0.3, CZ);
    }

    function buildOuterWard() {
        // Outer curtain wall — north side
        addMesh(new THREE.BoxGeometry(54, 8, 1.5), matLimestone(), CX, CY + 4, CZ - 22);
        // Outer curtain wall — south side
        addMesh(new THREE.BoxGeometry(54, 8, 1.5), matLimestone(), CX, CY + 4, CZ + 22);
        // Outer curtain wall — west side (leave gap for gatehouse)
        addMesh(new THREE.BoxGeometry(1.5, 8, 16), matLimestone(), CX - 27, CY + 4, CZ - 14);
        addMesh(new THREE.BoxGeometry(1.5, 8, 16), matLimestone(), CX - 27, CY + 4, CZ + 14);
        // Outer curtain wall — east side
        addMesh(new THREE.BoxGeometry(1.5, 8, 44), matLimestone(), CX + 27, CY + 4, CZ);
    }

    function buildMerlons() {
        // Merlons along north outer wall
        var i;
        for (i = 0; i < 9; i++) {
            addMesh(new THREE.BoxGeometry(2, 2, 1.5), matLimestone(), CX - 24 + i * 6, CY + 9, CZ - 22);
        }
        // Merlons along south outer wall
        for (i = 0; i < 9; i++) {
            addMesh(new THREE.BoxGeometry(2, 2, 1.5), matLimestone(), CX - 24 + i * 6, CY + 9, CZ + 22);
        }
        // Merlons along east outer wall
        for (i = 0; i < 7; i++) {
            addMesh(new THREE.BoxGeometry(1.5, 2, 2), matLimestone(), CX + 27, CY + 9, CZ - 18 + i * 6);
        }
        // Merlons along inner ward north wall
        for (i = 0; i < 6; i++) {
            addMesh(new THREE.BoxGeometry(2, 2, 1.5), matLimestone(), CX - 13 + i * 5, CY + 11, CZ - 12);
        }
        // Merlons along inner ward south wall
        for (i = 0; i < 6; i++) {
            addMesh(new THREE.BoxGeometry(2, 2, 1.5), matLimestone(), CX - 13 + i * 5, CY + 11, CZ + 12);
        }
        // Merlons on keep top — all four sides
        for (i = 0; i < 3; i++) {
            addMesh(new THREE.BoxGeometry(2.5, 2, 1), matLimestone(), CX - 2.5 + i * 2.5, CY + 17, CZ - 4);
            addMesh(new THREE.BoxGeometry(2.5, 2, 1), matLimestone(), CX - 2.5 + i * 2.5, CY + 17, CZ + 4);
            addMesh(new THREE.BoxGeometry(1, 2, 2.5), matLimestone(), CX - 4, CY + 17, CZ - 2.5 + i * 2.5);
            addMesh(new THREE.BoxGeometry(1, 2, 2.5), matLimestone(), CX + 4, CY + 17, CZ - 2.5 + i * 2.5);
        }
    }

    function buildInnerWard() {
        // Inner ward north wall
        addMesh(new THREE.BoxGeometry(32, 10, 1.5), matLimestone(), CX, CY + 5, CZ - 12);
        // Inner ward south wall
        addMesh(new THREE.BoxGeometry(32, 10, 1.5), matLimestone(), CX, CY + 5, CZ + 12);
        // Inner ward west wall (with gateway gap)
        addMesh(new THREE.BoxGeometry(1.5, 10, 8), matLimestone(), CX - 16, CY + 5, CZ - 8);
        addMesh(new THREE.BoxGeometry(1.5, 10, 8), matLimestone(), CX - 16, CY + 5, CZ + 8);
        // Inner ward east wall
        addMesh(new THREE.BoxGeometry(1.5, 10, 24), matLimestone(), CX + 16, CY + 5, CZ);
    }

    function buildGreatKeep() {
        // The great square keep — main body
        addMesh(new THREE.BoxGeometry(8, 16, 8), matLimestone(), CX + 8, CY + 8, CZ);
        // Keep parapet walkway cap
        addMesh(new THREE.BoxGeometry(9.5, 1, 9.5), matLimestone(), CX + 8, CY + 16.5, CZ);
        // Arrow slits — north face (dark inset boxes)
        addMesh(new THREE.BoxGeometry(0.3, 1.5, 0.5), matDark(), CX + 8, CY + 6, CZ - 4.1);
        addMesh(new THREE.BoxGeometry(0.3, 1.5, 0.5), matDark(), CX + 8, CY + 11, CZ - 4.1);
        // Arrow slits — south face
        addMesh(new THREE.BoxGeometry(0.3, 1.5, 0.5), matDark(), CX + 8, CY + 6, CZ + 4.1);
        addMesh(new THREE.BoxGeometry(0.3, 1.5, 0.5), matDark(), CX + 8, CY + 11, CZ + 4.1);
        // Arrow slits — east face
        addMesh(new THREE.BoxGeometry(0.5, 1.5, 0.3), matDark(), CX + 12.1, CY + 6, CZ);
        addMesh(new THREE.BoxGeometry(0.5, 1.5, 0.3), matDark(), CX + 12.1, CY + 11, CZ);
        // Arrow slits — west face
        addMesh(new THREE.BoxGeometry(0.5, 1.5, 0.3), matDark(), CX + 3.9, CY + 6, CZ);
        addMesh(new THREE.BoxGeometry(0.5, 1.5, 0.3), matDark(), CX + 3.9, CY + 11, CZ);
        // Keep doorway arch base
        addMesh(new THREE.BoxGeometry(2, 3, 0.5), matDark(), CX + 3.9, CY + 1.5, CZ - 1);
    }

    function buildCornerTowers() {
        // NW corner tower
        addMesh(new THREE.CylinderGeometry(3, 3.3, 12, 8), matLimestone(), CX - 27, CY + 6, CZ - 22);
        addMesh(new THREE.ConeGeometry(3.4, 5, 8), matSlate(), CX - 27, CY + 14.5, CZ - 22);
        // NE corner tower
        addMesh(new THREE.CylinderGeometry(3, 3.3, 12, 8), matLimestone(), CX + 27, CY + 6, CZ - 22);
        addMesh(new THREE.ConeGeometry(3.4, 5, 8), matSlate(), CX + 27, CY + 14.5, CZ - 22);
        // SW corner tower
        addMesh(new THREE.CylinderGeometry(3, 3.3, 12, 8), matLimestone(), CX - 27, CY + 6, CZ + 22);
        addMesh(new THREE.ConeGeometry(3.4, 5, 8), matSlate(), CX - 27, CY + 14.5, CZ + 22);
        // SE corner tower
        addMesh(new THREE.CylinderGeometry(3, 3.3, 12, 8), matLimestone(), CX + 27, CY + 6, CZ + 22);
        addMesh(new THREE.ConeGeometry(3.4, 5, 8), matSlate(), CX + 27, CY + 14.5, CZ + 22);
        // Mid-wall mural tower — east outer wall
        addMesh(new THREE.CylinderGeometry(2.5, 2.8, 10, 8), matLimestone(), CX + 27, CY + 5, CZ - 8);
        addMesh(new THREE.ConeGeometry(2.8, 4, 8), matSlate(), CX + 27, CY + 12, CZ - 8);
        // Inner ward corner turret — NE
        addMesh(new THREE.CylinderGeometry(2, 2.2, 11, 8), matLimestone(), CX + 16, CY + 5.5, CZ - 12);
        addMesh(new THREE.ConeGeometry(2.2, 3.5, 8), matSlate(), CX + 16, CY + 13.25, CZ - 12);
        // Inner ward corner turret — SE
        addMesh(new THREE.CylinderGeometry(2, 2.2, 11, 8), matLimestone(), CX + 16, CY + 5.5, CZ + 12);
        addMesh(new THREE.ConeGeometry(2.2, 3.5, 8), matSlate(), CX + 16, CY + 13.25, CZ + 12);
    }

    function buildGatehouse() {
        // Twin gatehouse towers — west outer wall gateway
        addMesh(new THREE.BoxGeometry(5, 10, 5), matLimestone(), CX - 27, CY + 5, CZ - 5);
        addMesh(new THREE.BoxGeometry(5, 10, 5), matLimestone(), CX - 27, CY + 5, CZ + 5);
        // Gatehouse arch lintel above gate passage
        addMesh(new THREE.BoxGeometry(5, 2, 4), matLimestone(), CX - 27, CY + 8, CZ);
        // Gate passage dark interior
        addMesh(new THREE.BoxGeometry(3, 6, 4), matDark(), CX - 27, CY + 3, CZ);
        // Portcullis bars — vertical iron bars
        addMesh(new THREE.BoxGeometry(0.25, 6, 0.25), matIron(), CX - 26, CY + 3, CZ - 1);
        addMesh(new THREE.BoxGeometry(0.25, 6, 0.25), matIron(), CX - 26, CY + 3, CZ);
        addMesh(new THREE.BoxGeometry(0.25, 6, 0.25), matIron(), CX - 26, CY + 3, CZ + 1);
        // Portcullis horizontal rail
        addMesh(new THREE.BoxGeometry(3, 0.25, 0.25), matIron(), CX - 26, CY + 5, CZ);
        // Gatehouse cone roofs
        addMesh(new THREE.ConeGeometry(3.2, 4, 4), matSlate(), CX - 27, CY + 12, CZ - 5);
        addMesh(new THREE.ConeGeometry(3.2, 4, 4), matSlate(), CX - 27, CY + 12, CZ + 5);
        // Gatehouse merlons
        addMesh(new THREE.BoxGeometry(1.5, 2, 1.5), matLimestone(), CX - 29, CY + 11, CZ - 7);
        addMesh(new THREE.BoxGeometry(1.5, 2, 1.5), matLimestone(), CX - 25, CY + 11, CZ - 7);
        addMesh(new THREE.BoxGeometry(1.5, 2, 1.5), matLimestone(), CX - 29, CY + 11, CZ + 7);
        addMesh(new THREE.BoxGeometry(1.5, 2, 1.5), matLimestone(), CX - 25, CY + 11, CZ + 7);
    }

    function buildDrawbridge() {
        // Wooden drawbridge planks over the moat — west approach
        addMesh(new THREE.BoxGeometry(8, 0.4, 4), matWood(), CX - 33, CY + 0.4, CZ);
        // Drawbridge side rails
        addMesh(new THREE.BoxGeometry(8, 1, 0.3), matWood(), CX - 33, CY + 0.9, CZ - 2.1);
        addMesh(new THREE.BoxGeometry(8, 1, 0.3), matWood(), CX - 33, CY + 0.9, CZ + 2.1);
        // Plank detail strips across bridge
        addMesh(new THREE.BoxGeometry(0.3, 0.5, 4), matDark(), CX - 30, CY + 0.65, CZ);
        addMesh(new THREE.BoxGeometry(0.3, 0.5, 4), matDark(), CX - 32, CY + 0.65, CZ);
        addMesh(new THREE.BoxGeometry(0.3, 0.5, 4), matDark(), CX - 34, CY + 0.65, CZ);
        addMesh(new THREE.BoxGeometry(0.3, 0.5, 4), matDark(), CX - 36, CY + 0.65, CZ);
        // Bridge approach path on island
        addMesh(new THREE.BoxGeometry(4, 0.3, 4), matRock(), CX - 28.5, CY + 0.3, CZ);
    }

    function buildInnerHallRange() {
        // Ruined great hall — north range, roofless walls
        // North wall of hall
        addMesh(new THREE.BoxGeometry(18, 7, 1), matLimestone(), CX + 4, CY + 3.5, CZ - 8);
        // South wall of hall
        addMesh(new THREE.BoxGeometry(18, 6, 1), matLimestone(), CX + 4, CY + 3, CZ - 3);
        // West wall of hall
        addMesh(new THREE.BoxGeometry(1, 7, 5), matLimestone(), CX - 5, CY + 3.5, CZ - 5.5);
        // East wall of hall (partial — ruined)
        addMesh(new THREE.BoxGeometry(1, 5, 3), matLimestone(), CX + 13, CY + 2.5, CZ - 6.5);
        // Window openings — dark boxes embedded in north wall
        addMesh(new THREE.BoxGeometry(1.5, 2.5, 0.3), matDark(), CX - 1, CY + 4, CZ - 8.2);
        addMesh(new THREE.BoxGeometry(1.5, 2.5, 0.3), matDark(), CX + 4, CY + 4, CZ - 8.2);
        addMesh(new THREE.BoxGeometry(1.5, 2.5, 0.3), matDark(), CX + 9, CY + 4, CZ - 8.2);
        // Fireplace chimney remains on south inner wall
        addMesh(new THREE.BoxGeometry(3, 10, 1.5), matLimestone(), CX, CY + 5, CZ - 3.5);
        // Floor debris — scattered low boxes
        addMesh(new THREE.BoxGeometry(2, 0.5, 1.5), matRock(), CX + 2, CY + 0.25, CZ - 6);
        addMesh(new THREE.BoxGeometry(1.5, 0.4, 2), matRock(), CX + 7, CY + 0.2, CZ - 5);
        // South range — chapel/domestic block against inner south wall
        addMesh(new THREE.BoxGeometry(12, 8, 4), matLimestone(), CX + 4, CY + 4, CZ + 9);
        // Chapel window
        addMesh(new THREE.BoxGeometry(1.2, 2.5, 0.3), matDark(), CX + 4, CY + 5, CZ + 11.2);
        // Chapel lancet arch peak
        addMesh(new THREE.BoxGeometry(1.2, 1, 0.3), matLimestone(), CX + 4, CY + 7, CZ + 11.2);
        // Domestic range east — buttery/pantry block
        addMesh(new THREE.BoxGeometry(6, 6, 8), matLimestone(), CX + 14, CY + 3, CZ + 5);
    }

    function buildTown() {
        // Town of Cahir across the river — south bank
        // Georgian terrace row — ground floor
        addMesh(new THREE.BoxGeometry(30, 8, 8), matTown(), CX - 5, CY + 4, CZ + 65);
        // Second terrace block
        addMesh(new THREE.BoxGeometry(20, 7, 8), matTown(), CX + 25, CY + 3.5, CZ + 62);
        // Third terrace block — west
        addMesh(new THREE.BoxGeometry(16, 9, 8), matTown(), CX - 28, CY + 4.5, CZ + 63);
        // Town roofs — slate grey pitched
        addMesh(new THREE.BoxGeometry(32, 1.5, 10), matSlate(), CX - 5, CY + 8.75, CZ + 65);
        addMesh(new THREE.BoxGeometry(22, 1.5, 10), matSlate(), CX + 25, CY + 8.25, CZ + 62);
        addMesh(new THREE.BoxGeometry(18, 1.5, 10), matSlate(), CX - 28, CY + 10.25, CZ + 63);
        // Church with tower — landmark in town
        addMesh(new THREE.BoxGeometry(10, 10, 16), matWhite(), CX + 15, CY + 5, CZ + 72);
        addMesh(new THREE.BoxGeometry(5, 18, 5), matWhite(), CX + 15, CY + 9, CZ + 64);
        addMesh(new THREE.ConeGeometry(3, 5, 4), matSlate(), CX + 15, CY + 20.5, CZ + 64);
        // Church windows
        addMesh(new THREE.BoxGeometry(1.5, 3, 0.3), matDark(), CX + 15, CY + 6, CZ + 80.2);
        addMesh(new THREE.BoxGeometry(1.5, 3, 0.3), matDark(), CX + 10, CY + 6, CZ + 80.2);
        // Market square — flat ground area
        addMesh(new THREE.BoxGeometry(20, 0.3, 15), matRock(), CX - 5, CY + 0.15, CZ + 50);
        // Town wall fragment — low boundary
        addMesh(new THREE.BoxGeometry(25, 3, 1), matRock(), CX - 5, CY + 1.5, CZ + 45);
    }

    function buildSwissCottage() {
        // Swiss Cottage — ornate thatched cottage ornee, visible behind town to west
        // Main cottage body
        addMesh(new THREE.BoxGeometry(10, 5, 8), matWhite(), CX - 55, CY + 2.5, CZ + 55);
        // Elaborate thatched roof — layered boxes
        addMesh(new THREE.BoxGeometry(12, 1, 10), matThatch(), CX - 55, CY + 5.5, CZ + 55);
        addMesh(new THREE.BoxGeometry(10, 1, 8), matThatch(), CX - 55, CY + 6.5, CZ + 55);
        addMesh(new THREE.BoxGeometry(7, 1, 6), matThatch(), CX - 55, CY + 7.5, CZ + 55);
        addMesh(new THREE.ConeGeometry(2, 3, 4), matThatch(), CX - 55, CY + 9.5, CZ + 55);
        // Rustic timber veranda posts — decorative woodwork
        addMesh(new THREE.BoxGeometry(0.3, 4, 0.3), matWood(), CX - 60, CY + 2, CZ + 51);
        addMesh(new THREE.BoxGeometry(0.3, 4, 0.3), matWood(), CX - 57, CY + 2, CZ + 51);
        addMesh(new THREE.BoxGeometry(0.3, 4, 0.3), matWood(), CX - 53, CY + 2, CZ + 51);
        addMesh(new THREE.BoxGeometry(0.3, 4, 0.3), matWood(), CX - 50, CY + 2, CZ + 51);
        // Veranda beam across top of posts
        addMesh(new THREE.BoxGeometry(11, 0.4, 0.4), matWood(), CX - 55, CY + 4, CZ + 51);
        // Decorative trellis woodwork — horizontal rails
        addMesh(new THREE.BoxGeometry(11, 0.3, 0.3), matWood(), CX - 55, CY + 2.5, CZ + 51);
        addMesh(new THREE.BoxGeometry(11, 0.3, 0.3), matWood(), CX - 55, CY + 1.5, CZ + 51);
        // Chimney stack — ornate tall
        addMesh(new THREE.BoxGeometry(1.2, 5, 1.2), matRock(), CX - 52, CY + 7.5, CZ + 54);
        addMesh(new THREE.BoxGeometry(1.8, 0.6, 1.8), matRock(), CX - 52, CY + 10.3, CZ + 54);
        // Cottage garden — low green box
        addMesh(new THREE.BoxGeometry(12, 0.3, 6), matGreen(), CX - 55, CY + 0.15, CZ + 48);
        // Garden hedge border
        addMesh(new THREE.BoxGeometry(12, 1.5, 0.5), matGreen(), CX - 55, CY + 0.75, CZ + 45);
        addMesh(new THREE.BoxGeometry(0.5, 1.5, 6), matGreen(), CX - 61, CY + 0.75, CZ + 48);
        addMesh(new THREE.BoxGeometry(0.5, 1.5, 6), matGreen(), CX - 49, CY + 0.75, CZ + 48);
    }

    function buildGroundVegetation() {
        // Trees on island — simple sphere on cylinder
        addMesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 5), matWood(), CX - 20, CY + 1.5, CZ - 18);
        addMesh(new THREE.SphereGeometry(2, 6, 5), matGreen(), CX - 20, CY + 4, CZ - 18);
        addMesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 5), matWood(), CX + 20, CY + 1.5, CZ + 18);
        addMesh(new THREE.SphereGeometry(2, 6, 5), matGreen(), CX + 20, CY + 4, CZ + 18);
        // River bank shrubs — north bank
        addMesh(new THREE.SphereGeometry(2.5, 6, 5), matGreen(), CX - 40, CY + 2, CZ - 45);
        addMesh(new THREE.SphereGeometry(2, 6, 5), matGreen(), CX + 20, CY + 2, CZ - 50);
        addMesh(new THREE.SphereGeometry(3, 6, 5), matGreen(), CX + 50, CY + 2, CZ - 48);
        // Grassy bank — north
        addMesh(new THREE.BoxGeometry(120, 0.4, 20), matGreen(), CX, CY + 0.2, CZ - 55);
        // Grassy bank — south (between river and town)
        addMesh(new THREE.BoxGeometry(120, 0.4, 8), matGreen(), CX, CY + 0.2, CZ + 43);
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
