window.TipperaryRock = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var ox = 17920;
        var oy = 0;
        var oz = 0;

        // -------------------------------------------------------
        // LIMESTONE ROCK OUTCROP - stacked BoxGeometry blocks
        // -------------------------------------------------------
        // Base of rock - widest slab
        makeBox(60, 2, 50, 0x808080, ox, oy + 1, oz);
        // Second tier
        makeBox(52, 2.5, 42, 0x808080, ox, oy + 3.25, oz);
        // Third tier
        makeBox(44, 2.5, 35, 0x7A7A7A, ox, oy + 5.5, oz);
        // Fourth tier - narrowing
        makeBox(36, 2, 28, 0x787878, ox, oy + 7.5, oz);
        // Peak plateau
        makeBox(30, 2, 22, 0x757575, ox, oy + 9.5, oz);
        // Craggy rock outcrop sections - irregular blocks
        makeBox(8, 3, 6, 0x808080, ox - 20, oy + 2.5, oz + 18);
        makeBox(6, 2, 5, 0x7A7A7A, ox - 24, oy + 2, oz + 15);
        makeBox(10, 2.5, 7, 0x808080, ox + 18, oy + 3, oz - 16);
        makeBox(7, 3, 5, 0x757575, ox + 22, oy + 2.5, oz - 20);
        makeBox(5, 4, 4, 0x787878, ox - 12, oy + 3.5, oz - 22);
        makeBox(9, 2, 6, 0x808080, ox + 8, oy + 2, oz + 22);
        // Rock face cliffs - vertical slab pieces
        makeBox(4, 6, 50, 0x696969, ox - 28, oy + 4, oz);
        makeBox(4, 5, 40, 0x6E6E6E, ox + 28, oy + 3.5, oz);
        makeBox(60, 5, 4, 0x696969, ox, oy + 3.5, oz + 25);
        makeBox(60, 4, 4, 0x6E6E6E, ox, oy + 3, oz - 25);

        // -------------------------------------------------------
        // ROUND TOWER - tall limestone cylinder with conical cap
        // -------------------------------------------------------
        makeCylinder(1.5, 1.7, 18, 12, 0x808080, ox - 8, oy + 10 + 9, oz - 5);
        // Round tower cap
        makeCone(2.0, 4, 12, 0x757575, ox - 8, oy + 10 + 18 + 2, oz - 5);
        // Round tower doorway (high up) - dark box slot
        makeBox(0.8, 1.5, 0.4, 0x1A1A1A, ox - 8, oy + 10 + 13, oz - 5 - 1.8);
        // Round tower window slits
        makeBox(0.4, 0.8, 0.4, 0x1A1A1A, ox - 8, oy + 10 + 7, oz - 5 - 1.6);
        makeBox(0.4, 0.8, 0.4, 0x1A1A1A, ox - 8 - 1.6, oy + 10 + 10, oz - 5);

        // -------------------------------------------------------
        // CORMAC'S CHAPEL - Romanesque chapel body
        // -------------------------------------------------------
        // Chapel main body
        makeBox(14, 7, 9, 0x8B7355, ox + 4, oy + 10 + 3.5, oz + 2);
        // Chapel roof - saddle ConeGeometry (ridge)
        makeBox(14, 1, 9, 0x7A6348, ox + 4, oy + 10 + 7.5, oz + 2);
        // Saddle roof east gable
        makeCone(5, 4, 4, 0x7A6348, ox + 11, oy + 10 + 9, oz + 2);
        // Saddle roof west gable
        makeCone(5, 4, 4, 0x7A6348, ox - 3, oy + 10 + 9, oz + 2);
        // Roof ridge bar
        makeBox(14, 1, 1.5, 0x6E5A3F, ox + 4, oy + 10 + 11, oz + 2);
        // Twin Romanesque towers flanking entrance (west end)
        makeCylinder(1.2, 1.3, 9, 8, 0x8B7355, ox - 3 - 1.5, oy + 10 + 4.5, oz + 2 - 3.5);
        makeCylinder(1.2, 1.3, 9, 8, 0x8B7355, ox - 3 - 1.5, oy + 10 + 4.5, oz + 2 + 3.5);
        // Tower caps
        makeCone(1.5, 2.5, 8, 0x7A6348, ox - 4.5, oy + 10 + 10, oz - 1.5);
        makeCone(1.5, 2.5, 8, 0x7A6348, ox - 4.5, oy + 10 + 10, oz + 5.5);
        // Blind arcading strips - decorative box strips on chapel walls
        makeBox(0.5, 5, 1.2, 0x9A8265, ox + 4 - 5, oy + 10 + 3, oz + 2 + 4.6);
        makeBox(0.5, 5, 1.2, 0x9A8265, ox + 4 - 1, oy + 10 + 3, oz + 2 + 4.6);
        makeBox(0.5, 5, 1.2, 0x9A8265, ox + 4 + 3, oy + 10 + 3, oz + 2 + 4.6);
        makeBox(0.5, 5, 1.2, 0x9A8265, ox + 4 + 6, oy + 10 + 3, oz + 2 + 4.6);
        makeBox(0.5, 5, 1.2, 0x9A8265, ox + 4 - 5, oy + 10 + 3, oz + 2 - 4.6);
        makeBox(0.5, 5, 1.2, 0x9A8265, ox + 4 + 2, oy + 10 + 3, oz + 2 - 4.6);
        makeBox(0.5, 5, 1.2, 0x9A8265, ox + 4 + 6, oy + 10 + 3, oz + 2 - 4.6);
        // Chapel doorway arch
        makeBox(2.5, 3, 0.5, 0x1A1A1A, ox - 3, oy + 10 + 2, oz + 2);
        // Chapel chancel arch window
        makeBox(1.5, 2, 0.5, 0x1A1A1A, ox + 11, oy + 10 + 4, oz + 2);

        // -------------------------------------------------------
        // CATHEDRAL RUINS - Gothic nave walls
        // -------------------------------------------------------
        // North nave wall - long ruined wall
        makeBox(40, 9, 2, 0x696969, ox - 2, oy + 10 + 4.5, oz - 8);
        // South nave wall
        makeBox(40, 9, 2, 0x696969, ox - 2, oy + 10 + 4.5, oz + 12);
        // West gable wall
        makeBox(2, 11, 22, 0x696969, ox - 22, oy + 10 + 5.5, oz + 2);
        // East gable (partial ruin)
        makeBox(2, 7, 22, 0x696969, ox + 18, oy + 10 + 3.5, oz + 2);
        // Crossing tower remnants - corner piers
        makeCylinder(1.0, 1.1, 8, 6, 0x696969, ox - 22, oy + 10 + 5, oz - 8);
        makeCylinder(1.0, 1.1, 8, 6, 0x696969, ox - 22, oy + 10 + 5, oz + 12);
        makeCylinder(1.0, 1.1, 6, 6, 0x696969, ox + 18, oy + 10 + 4, oz - 8);
        // Gothic pointed window gaps in north wall (dark boxes)
        makeBox(2, 4, 0.6, 0x1A1A1A, ox - 14, oy + 10 + 5, oz - 8);
        makeBox(2, 4, 0.6, 0x1A1A1A, ox - 6, oy + 10 + 5, oz - 8);
        makeBox(2, 4, 0.6, 0x1A1A1A, ox + 2, oy + 10 + 5, oz - 8);
        makeBox(2, 4, 0.6, 0x1A1A1A, ox + 10, oy + 10 + 5, oz - 8);
        // Gothic pointed window gaps in south wall
        makeBox(2, 4, 0.6, 0x1A1A1A, ox - 14, oy + 10 + 5, oz + 12);
        makeBox(2, 4, 0.6, 0x1A1A1A, ox - 2, oy + 10 + 5, oz + 12);
        makeBox(2, 4, 0.6, 0x1A1A1A, ox + 10, oy + 10 + 5, oz + 12);
        // Window tracery tops (pointed cap box)
        makeBox(1.5, 1.5, 0.6, 0x2A2A2A, ox - 14, oy + 10 + 7.5, oz - 8);
        makeBox(1.5, 1.5, 0.6, 0x2A2A2A, ox - 6, oy + 10 + 7.5, oz - 8);
        makeBox(1.5, 1.5, 0.6, 0x2A2A2A, ox + 2, oy + 10 + 7.5, oz - 8);

        // -------------------------------------------------------
        // ARCHBISHOP'S RESIDENCE - barrel-vaulted hall range
        // -------------------------------------------------------
        // Main hall body
        makeBox(20, 8, 10, 0x8B7355, ox - 14, oy + 10 + 4, oz - 20);
        // Barrel vault approximation - cylinder on its side
        makeCylinder(4.5, 4.5, 20, 10, 0x7A6348, ox - 14, oy + 10 + 9.5, oz - 20);
        // Residence windows
        makeBox(1.5, 2, 0.5, 0x1A1A1A, ox - 20, oy + 10 + 5, oz - 20);
        makeBox(1.5, 2, 0.5, 0x1A1A1A, ox - 10, oy + 10 + 5, oz - 20);
        makeBox(1.5, 2, 0.5, 0x1A1A1A, ox - 6, oy + 10 + 5, oz - 20);
        // Residence doorway
        makeBox(2, 3.5, 0.5, 0x1A1A1A, ox - 14, oy + 10 + 2.5, oz - 15);

        // -------------------------------------------------------
        // TOWN OF CASHEL BELOW - Irish Georgian houses and shopfronts
        // -------------------------------------------------------
        // Main Street - row of Georgian houses north side
        makeBox(7, 9, 8, 0xCD5C5C, ox - 50, oy + 4.5, oz - 35);
        makeBox(7, 10, 8, 0xB85252, ox - 42, oy + 5, oz - 35);
        makeBox(7, 8, 8, 0xCD5C5C, ox - 34, oy + 4, oz - 35);
        makeBox(7, 11, 8, 0xC05858, ox - 26, oy + 5.5, oz - 35);
        makeBox(7, 9, 8, 0xCD5C5C, ox - 18, oy + 4.5, oz - 35);
        makeBox(7, 8, 8, 0xB85252, ox - 10, oy + 4, oz - 35);
        // Main Street - row of shopfronts south side
        makeBox(8, 8, 8, 0xC06060, ox - 46, oy + 4, oz - 50);
        makeBox(8, 9, 8, 0xCD5C5C, ox - 37, oy + 4.5, oz - 50);
        makeBox(8, 8, 8, 0xBF5A5A, ox - 28, oy + 4, oz - 50);
        makeBox(8, 10, 8, 0xCD5C5C, ox - 19, oy + 5, oz - 50);
        // Shop rooftops
        makeBox(8, 1, 8, 0x4A3A3A, ox - 46, oy + 8.5, oz - 50);
        makeBox(8, 1, 8, 0x4A3A3A, ox - 37, oy + 9, oz - 50);
        makeBox(8, 1, 8, 0x4A3A3A, ox - 28, oy + 8.5, oz - 50);
        // Georgian house windows (dark boxes)
        makeBox(1.2, 1.8, 0.4, 0x1A2A3A, ox - 50, oy + 6, oz - 31);
        makeBox(1.2, 1.8, 0.4, 0x1A2A3A, ox - 42, oy + 6, oz - 31);
        makeBox(1.2, 1.8, 0.4, 0x1A2A3A, ox - 34, oy + 6, oz - 31);
        // St Patrick's Rock access road - dark strip
        makeBox(60, 0.2, 5, 0x4A4A4A, ox - 20, oy + 0.2, oz - 20);

        // -------------------------------------------------------
        // ST DOMINIC'S ABBEY - ruined medieval friary in town
        // -------------------------------------------------------
        // Abbey nave walls
        makeBox(22, 7, 2, 0x6B6B6B, ox + 60, oy + 4.5, oz - 40);
        makeBox(22, 7, 2, 0x6B6B6B, ox + 60, oy + 4.5, oz - 56);
        makeBox(2, 7, 16, 0x6B6B6B, ox + 49, oy + 4.5, oz - 48);
        makeBox(2, 5, 16, 0x6B6B6B, ox + 71, oy + 3.5, oz - 48);
        // Gothic arch windows in abbey - pointed dark boxes
        makeBox(2, 4, 0.5, 0x1A1A1A, ox + 58, oy + 4.5, oz - 40);
        makeBox(2, 4, 0.5, 0x1A1A1A, ox + 65, oy + 4.5, oz - 40);
        makeBox(2, 4, 0.5, 0x1A1A1A, ox + 58, oy + 4.5, oz - 56);
        makeBox(2, 4, 0.5, 0x1A1A1A, ox + 65, oy + 4.5, oz - 56);
        // Abbey tower stump
        makeCylinder(2.5, 2.8, 10, 8, 0x6B6B6B, ox + 49, oy + 6, oz - 40);
        makeCone(3, 3, 8, 0x5A5A5A, ox + 49, oy + 12.5, oz - 40);

        // -------------------------------------------------------
        // PASTORAL LANDSCAPE - green rolling fields and stone walls
        // -------------------------------------------------------
        // Ground plane approximation - large flat boxes
        makeBox(200, 1, 200, 0x228B22, ox, oy - 0.5, oz + 80);
        makeBox(200, 1, 200, 0x228B22, ox, oy - 0.5, oz - 80);
        makeBox(200, 1, 100, 0x228B22, ox + 100, oy - 0.5, oz);
        makeBox(200, 1, 100, 0x228B22, ox - 100, oy - 0.5, oz);

        // Stone walls dividing fields - low limestone walls
        makeBox(30, 1.2, 0.6, 0x808080, ox + 50, oy + 0.6, oz + 30);
        makeBox(30, 1.2, 0.6, 0x808080, ox + 50, oy + 0.6, oz + 60);
        makeBox(0.6, 1.2, 30, 0x808080, ox + 65, oy + 0.6, oz + 45);
        makeBox(30, 1.2, 0.6, 0x808080, ox - 60, oy + 0.6, oz + 40);
        makeBox(0.6, 1.2, 30, 0x808080, ox - 75, oy + 0.6, oz + 25);
        makeBox(30, 1.2, 0.6, 0x808080, ox + 80, oy + 0.6, oz - 30);
        makeBox(0.6, 1.2, 40, 0x808080, ox + 95, oy + 0.6, oz - 10);
        makeBox(40, 1.2, 0.6, 0x808080, ox - 80, oy + 0.6, oz - 20);

        // -------------------------------------------------------
        // GOLDEN VALE FARMLAND - flat fields with hedgerows
        // -------------------------------------------------------
        // Golden Vale fields - medium green flat boxes
        makeBox(80, 0.8, 60, 0x3CB371, ox + 120, oy - 0.1, oz + 50);
        makeBox(80, 0.8, 60, 0x3CB371, ox + 120, oy - 0.1, oz - 50);
        makeBox(80, 0.8, 60, 0x3CB371, ox - 120, oy - 0.1, oz + 50);
        makeBox(80, 0.8, 60, 0x3CB371, ox - 120, oy - 0.1, oz - 50);
        makeBox(100, 0.8, 80, 0x2E8B57, ox + 180, oy - 0.1, oz);
        makeBox(100, 0.8, 80, 0x2E8B57, ox - 180, oy - 0.1, oz);

        // Hedgerows - dark brown/green box strips
        makeBox(60, 2.5, 2, 0x5C3317, ox + 120, oy + 1.25, oz + 20);
        makeBox(60, 2.5, 2, 0x5C3317, ox + 120, oy + 1.25, oz - 20);
        makeBox(2, 2.5, 60, 0x5C3317, ox + 90, oy + 1.25, oz);
        makeBox(60, 2.5, 2, 0x5C3317, ox - 120, oy + 1.25, oz + 20);
        makeBox(2, 2.5, 60, 0x5C3317, ox - 150, oy + 1.25, oz);
        makeBox(60, 2.5, 2, 0x5C3317, ox + 180, oy + 1.25, oz + 30);
        makeBox(60, 2.5, 2, 0x5C3317, ox + 180, oy + 1.25, oz - 30);
        makeBox(60, 2.5, 2, 0x5C3317, ox - 180, oy + 1.25, oz + 15);
        makeBox(2, 2.5, 60, 0x5C3317, ox + 210, oy + 1.25, oz);

        // -------------------------------------------------------
        // SCATTERED TREES - spheres for canopy, cylinders for trunks
        // -------------------------------------------------------
        makeCylinder(0.3, 0.4, 4, 6, 0x5C3317, ox + 45, oy + 2, oz + 25);
        makeSphere(3, 7, 7, 0x228B22, ox + 45, oy + 6, oz + 25);
        makeCylinder(0.3, 0.4, 4, 6, 0x5C3317, ox - 55, oy + 2, oz + 35);
        makeSphere(3, 7, 7, 0x228B22, ox - 55, oy + 6, oz + 35);
        makeCylinder(0.3, 0.4, 5, 6, 0x5C3317, ox + 100, oy + 2, oz - 40);
        makeSphere(3.5, 7, 7, 0x2E8B22, ox + 100, oy + 6.5, oz - 40);
        makeCylinder(0.3, 0.4, 4, 6, 0x5C3317, ox - 90, oy + 2, oz - 35);
        makeSphere(3, 7, 7, 0x228B22, ox - 90, oy + 6, oz - 35);
        makeCylinder(0.25, 0.35, 3.5, 6, 0x5C3317, ox - 30, oy + 2, oz + 55);
        makeSphere(2.5, 7, 7, 0x228B22, ox - 30, oy + 5.5, oz + 55);

        // -------------------------------------------------------
        // ADDITIONAL ROCK DETAILS - small outcrop boulders
        // -------------------------------------------------------
        makeBox(3, 2, 2.5, 0x909090, ox + 14, oy + 10 + 1, oz + 7);
        makeBox(2, 1.5, 2, 0x888888, ox - 15, oy + 10 + 1, oz - 9);
        makeBox(2.5, 1.8, 2, 0x909090, ox + 12, oy + 10 + 1, oz - 10);
        makeBox(1.5, 1.2, 1.5, 0x888888, ox - 10, oy + 10 + 1, oz + 9);

        // -------------------------------------------------------
        // PATH/CAUSEWAY UP TO ROCK
        // -------------------------------------------------------
        makeBox(5, 0.5, 30, 0x8B8B83, ox + 20, oy + 5, oz + 20);
        makeBox(5, 0.5, 20, 0x8B8B83, ox + 24, oy + 7.5, oz + 35);
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
