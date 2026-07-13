window.MargateDreamland = (function() {
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

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildDreamlandRollercoaster() {
        var ox = 10640;
        var oz = -80;
        // Main scaffold posts
        var postPositions = [
            [ox - 20, 0, oz],
            [ox - 10, 0, oz],
            [ox,      0, oz],
            [ox + 10, 0, oz],
            [ox + 20, 0, oz],
            [ox - 20, 0, oz + 8],
            [ox - 10, 0, oz + 8],
            [ox,      0, oz + 8],
            [ox + 10, 0, oz + 8],
            [ox + 20, 0, oz + 8]
        ];
        var postHeights = [14, 20, 24, 18, 12, 14, 20, 24, 18, 12];
        for (var i = 0; i < postPositions.length; i++) {
            var h = postHeights[i];
            var post = makeMesh(new THREE.BoxGeometry(1.2, h, 1.2), 0xA0714F);
            post.position.set(postPositions[i][0], h / 2, postPositions[i][2]);
            addMesh(post);
        }
        // Cross beams front row
        var beamHeights = [6, 12, 18, 22];
        for (var j = 0; j < beamHeights.length; j++) {
            var beam = makeMesh(new THREE.BoxGeometry(42, 0.8, 0.8), 0x8B5E3C);
            beam.position.set(ox, beamHeights[j], oz);
            addMesh(beam);
            var beamBack = makeMesh(new THREE.BoxGeometry(42, 0.8, 0.8), 0x8B5E3C);
            beamBack.position.set(ox, beamHeights[j], oz + 8);
            addMesh(beamBack);
        }
        // Cross beams side connectors
        for (var k = 0; k < 5; k++) {
            var sx = ox - 20 + k * 10;
            var side = makeMesh(new THREE.BoxGeometry(0.8, 0.8, 10), 0x8B5E3C);
            side.position.set(sx, 10, oz + 4);
            addMesh(side);
        }
        // Track ridge beam
        var ridge = makeMesh(new THREE.BoxGeometry(44, 1.2, 1.2), 0xD4A96A);
        ridge.position.set(ox, 24.6, oz + 4);
        addMesh(ridge);
        // Diagonal braces
        for (var d = 0; d < 4; d++) {
            var brace = makeMesh(new THREE.BoxGeometry(0.6, 14, 0.6), 0x7A4F2E);
            brace.position.set(ox - 15 + d * 10, 8, oz + 1);
            brace.rotation.z = 0.4;
            addMesh(brace);
        }
        // Operator booth
        var booth = makeMesh(new THREE.BoxGeometry(4, 4, 4), 0xCC3333);
        booth.position.set(ox + 26, 2, oz + 4);
        addMesh(booth);
        var boothRoof = makeMesh(new THREE.ConeGeometry(3.2, 2, 4), 0x882222);
        boothRoof.position.set(ox + 26, 5, oz + 4);
        addMesh(boothRoof);
    }

    function buildCarousel() {
        var ox = 10640;
        var oz = -50;
        // Base platform
        var base = makeMesh(new THREE.CylinderGeometry(7, 7.5, 1.5, 16), 0xE8C87A);
        base.position.set(ox - 30, 0.75, oz);
        addMesh(base);
        // Main drum
        var drum = makeMesh(new THREE.CylinderGeometry(6, 6, 4, 16), 0xE8D0A0);
        drum.position.set(ox - 30, 3.5, oz);
        addMesh(drum);
        // Decorative upper ring
        var ring = makeMesh(new THREE.CylinderGeometry(6.5, 6.5, 0.5, 16), 0xCC9933);
        ring.position.set(ox - 30, 5.5, oz);
        addMesh(ring);
        // Cone top
        var top = makeMesh(new THREE.ConeGeometry(7, 5, 16), 0xFF3366);
        top.position.set(ox - 30, 9, oz);
        addMesh(top);
        // Spire
        var spire = makeMesh(new THREE.CylinderGeometry(0.2, 0.5, 3, 8), 0xFFCC00);
        spire.position.set(ox - 30, 13, oz);
        addMesh(spire);
        // Horses (simplified box proxies around ring)
        var horseColors = [0xFF6699, 0x66CCFF, 0x99FF66, 0xFFCC33, 0xFF9966, 0xCC66FF];
        for (var h = 0; h < 6; h++) {
            var angle = (h / 6) * Math.PI * 2;
            var hx = ox - 30 + Math.cos(angle) * 5;
            var hz = oz + Math.sin(angle) * 5;
            var horse = makeMesh(new THREE.BoxGeometry(0.8, 1.8, 1.4), horseColors[h % horseColors.length]);
            horse.position.set(hx, 4, hz);
            addMesh(horse);
        }
    }

    function buildBigWheel() {
        var ox = 10640;
        var oz = -60;
        var cx = ox + 35;
        var cz = oz - 10;
        // Support legs A-frame
        var legL = makeMesh(new THREE.BoxGeometry(1.2, 22, 1.2), 0x666688);
        legL.position.set(cx - 6, 11, cz);
        legL.rotation.z = 0.18;
        addMesh(legL);
        var legR = makeMesh(new THREE.BoxGeometry(1.2, 22, 1.2), 0x666688);
        legR.position.set(cx + 6, 11, cz);
        legR.rotation.z = -0.18;
        addMesh(legR);
        var legLB = makeMesh(new THREE.BoxGeometry(1.2, 22, 1.2), 0x666688);
        legLB.position.set(cx - 6, 11, cz + 4);
        legLB.rotation.z = 0.18;
        addMesh(legLB);
        var legRB = makeMesh(new THREE.BoxGeometry(1.2, 22, 1.2), 0x666688);
        legRB.position.set(cx + 6, 11, cz + 4);
        legRB.rotation.z = -0.18;
        addMesh(legRB);
        // Hub axle
        var hub = makeMesh(new THREE.CylinderGeometry(1, 1, 5, 12), 0x444466);
        hub.rotation.x = Math.PI / 2;
        hub.position.set(cx, 20, cz + 2);
        addMesh(hub);
        // Wheel ring (large cylinder as torus proxy)
        var wheelRing = makeMesh(new THREE.CylinderGeometry(12, 12, 0.8, 24), 0xFF4444);
        wheelRing.rotation.x = Math.PI / 2;
        wheelRing.position.set(cx, 20, cz + 2);
        addMesh(wheelRing);
        // Inner ring
        var innerRing = makeMesh(new THREE.CylinderGeometry(9, 9, 0.6, 24), 0xDD2222);
        innerRing.rotation.x = Math.PI / 2;
        innerRing.position.set(cx, 20, cz + 2);
        addMesh(innerRing);
        // Spokes (flat box radials)
        for (var s = 0; s < 8; s++) {
            var sa = (s / 8) * Math.PI * 2;
            var spoke = makeMesh(new THREE.BoxGeometry(0.4, 12, 0.4), 0x888899);
            spoke.position.set(cx, 20, cz + 2);
            spoke.rotation.z = sa;
            addMesh(spoke);
        }
        // Gondolas
        for (var g = 0; g < 8; g++) {
            var ga = (g / 8) * Math.PI * 2;
            var gx = cx + Math.sin(ga) * 11;
            var gy = 20 + Math.cos(ga) * 11;
            var gondola = makeMesh(new THREE.BoxGeometry(1.8, 1.2, 1.2), 0xFFFF33);
            gondola.position.set(gx, gy, cz + 2);
            addMesh(gondola);
        }
    }

    function buildHelterSkelter() {
        var ox = 10640;
        var oz = -45;
        var tx = ox + 10;
        // Tower base
        var towerBase = makeMesh(new THREE.CylinderGeometry(4, 5, 2, 8), 0xCC3333);
        towerBase.position.set(tx, 1, oz);
        addMesh(towerBase);
        // Tower sections (stepping up)
        var sectionColors = [0xCC3333, 0xFFFFFF, 0xCC3333, 0xFFFFFF, 0xCC3333];
        for (var ts = 0; ts < 5; ts++) {
            var r = 3.5 - ts * 0.3;
            var sec = makeMesh(new THREE.CylinderGeometry(r, r + 0.4, 3, 8), sectionColors[ts]);
            sec.position.set(tx, 3 + ts * 3, oz);
            addMesh(sec);
        }
        // Spiral slide (box approximation spiraling around)
        for (var sp = 0; sp < 12; sp++) {
            var sa2 = (sp / 12) * Math.PI * 2 * 2.5;
            var sr = 4.2;
            var sx2 = tx + Math.cos(sa2) * sr;
            var sz2 = oz + Math.sin(sa2) * sr;
            var sy2 = 2 + sp * 1.3;
            var slide = makeMesh(new THREE.BoxGeometry(2, 0.3, 1.2), 0xFFCC00);
            slide.position.set(sx2, sy2, sz2);
            slide.rotation.y = sa2;
            addMesh(slide);
        }
        // Pointed cap
        var cap = makeMesh(new THREE.ConeGeometry(4, 4, 8), 0xCC3333);
        cap.position.set(tx, 19, oz);
        addMesh(cap);
        var finial = makeMesh(new THREE.SphereGeometry(0.6, 8, 8), 0xFFCC00);
        finial.position.set(tx, 22, oz);
        addMesh(finial);
        // Flag
        var flagpole = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 6), 0x888888);
        flagpole.position.set(tx, 24, oz);
        addMesh(flagpole);
    }

    function buildDodgemBuilding() {
        var ox = 10640;
        var oz = -30;
        var dx = ox - 5;
        // Main hall
        var hall = makeMesh(new THREE.BoxGeometry(24, 5, 16), 0x3399CC);
        hall.position.set(dx, 2.5, oz);
        addMesh(hall);
        // Roof overhang
        var roof = makeMesh(new THREE.BoxGeometry(26, 0.6, 18), 0x2277AA);
        roof.position.set(dx, 5.3, oz);
        addMesh(roof);
        // Facade trim strip
        var trim = makeMesh(new THREE.BoxGeometry(24, 1.5, 0.4), 0xFFCC00);
        trim.position.set(dx, 4.5, oz - 8.2);
        addMesh(trim);
        // Signage block
        var sign = makeMesh(new THREE.BoxGeometry(10, 2, 0.3), 0xFF3300);
        sign.position.set(dx, 6.5, oz - 8.2);
        addMesh(sign);
        // Dodgem cars (coloured boxes on floor)
        var carColors = [0xFF0000, 0x0000FF, 0xFF9900, 0x00CC00, 0xFF00FF];
        for (var dc = 0; dc < 5; dc++) {
            var car = makeMesh(new THREE.BoxGeometry(2, 0.8, 1.4), carColors[dc]);
            car.position.set(dx - 8 + dc * 4, 0.4, oz + Math.sin(dc * 1.3) * 3);
            addMesh(car);
        }
        // Entry pillars
        for (var ep = 0; ep < 3; ep++) {
            var epx = dx - 8 + ep * 8;
            var pillar = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), 0xDDDDDD);
            pillar.position.set(epx, 2.5, oz - 8);
            addMesh(pillar);
        }
    }

    function buildTurnerContemporary() {
        var ox = 10640;
        var oz = 20;
        var tx = ox + 60;
        // Main gallery volume
        var main = makeMesh(new THREE.BoxGeometry(28, 10, 18), 0xF5F5F2);
        main.position.set(tx, 5, oz);
        addMesh(main);
        // Angled roof slab (slightly rotated)
        var roofSlab = makeMesh(new THREE.BoxGeometry(30, 1.2, 20), 0xE8E8E6);
        roofSlab.position.set(tx, 10.5, oz);
        roofSlab.rotation.z = 0.07;
        addMesh(roofSlab);
        // Secondary lower volume
        var lowVol = makeMesh(new THREE.BoxGeometry(16, 7, 14), 0xF0F0EE);
        lowVol.position.set(tx + 20, 3.5, oz + 2);
        addMesh(lowVol);
        // Glass wall suggestion (dark tinted slab)
        var glass = makeMesh(new THREE.BoxGeometry(0.3, 9, 16), 0x88BBCC);
        glass.position.set(tx - 14, 4.5, oz);
        addMesh(glass);
        var glassTop = makeMesh(new THREE.BoxGeometry(0.3, 3, 18), 0x77AABB);
        glassTop.position.set(tx - 14, 9.5, oz);
        addMesh(glassTop);
        // Entrance canopy
        var canopy = makeMesh(new THREE.BoxGeometry(8, 0.4, 4), 0xDDDDDA);
        canopy.position.set(tx - 14, 4.5, oz);
        canopy.rotation.x = -0.15;
        addMesh(canopy);
        // Canopy supports
        for (var cs = 0; cs < 2; cs++) {
            var csup = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0xCCCCCC);
            csup.position.set(tx - 14, 2, oz - 4 + cs * 8);
            addMesh(csup);
        }
        // Foundation plinth
        var plinth = makeMesh(new THREE.BoxGeometry(34, 1.5, 24), 0xCCCCCA);
        plinth.position.set(tx + 2, 0.75, oz);
        addMesh(plinth);
        // Exterior sculpture plinth
        var sculpt = makeMesh(new THREE.BoxGeometry(2, 2, 2), 0xE0E0DE);
        sculpt.position.set(tx - 18, 1, oz + 6);
        addMesh(sculpt);
        var sculptObj = makeMesh(new THREE.SphereGeometry(1.2, 8, 8), 0xCCAA88);
        sculptObj.position.set(tx - 18, 3.2, oz + 6);
        addMesh(sculptObj);
    }

    function buildMargateBay() {
        var ox = 10640;
        var oz = 50;
        // Sandy beach plane (wide flat box)
        var beach = makeMesh(new THREE.BoxGeometry(200, 0.4, 40), 0xF5DEB3);
        beach.position.set(ox + 10, 0.2, oz);
        addMesh(beach);
        // Wet sand strip near water
        var wetSand = makeMesh(new THREE.BoxGeometry(200, 0.3, 10), 0xD2B48C);
        wetSand.position.set(ox + 10, 0.15, oz + 16);
        addMesh(wetSand);
        // Sea (blue flat plane)
        var sea = makeMesh(new THREE.BoxGeometry(220, 0.2, 60), 0x2266AA);
        sea.position.set(ox + 10, -0.1, oz + 40);
        addMesh(sea);
        // Beach huts row
        var hutColors = [0xFF3333, 0x33CC33, 0x3399FF, 0xFF9900, 0xCC33CC, 0xFFFF00, 0x00CCCC, 0xFF6699];
        for (var bh = 0; bh < 8; bh++) {
            var hx = ox - 40 + bh * 10;
            var hut = makeMesh(new THREE.BoxGeometry(3.5, 3.5, 3), hutColors[bh % hutColors.length]);
            hut.position.set(hx, 1.75, oz + 5);
            addMesh(hut);
            var hutRoof = makeMesh(new THREE.ConeGeometry(2.8, 2, 4), 0xFFFFFF);
            hutRoof.rotation.y = Math.PI / 4;
            hutRoof.position.set(hx, 4.5, oz + 5);
            addMesh(hutRoof);
        }
        // Chalk reef formations in sea (low irregular boxes)
        var reefPositions = [
            [ox - 30, oz + 55],
            [ox + 10, oz + 62],
            [ox + 50, oz + 58],
            [ox - 10, oz + 70],
            [ox + 30, oz + 68]
        ];
        for (var rf = 0; rf < reefPositions.length; rf++) {
            var rw = 4 + Math.floor(rf * 1.7) % 5;
            var rh = 0.6 + (rf % 3) * 0.4;
            var reef = makeMesh(new THREE.BoxGeometry(rw, rh, rw * 0.7), 0xEEEEDD);
            reef.position.set(reefPositions[rf][0], rh / 2, reefPositions[rf][1]);
            addMesh(reef);
        }
        // Promenade path
        var prom = makeMesh(new THREE.BoxGeometry(200, 0.5, 6), 0xCCBBAA);
        prom.position.set(ox + 10, 0.25, oz - 3);
        addMesh(prom);
        // Promenade railings (posts)
        for (var pr = 0; pr < 20; pr++) {
            var post = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6), 0xAAAAAA);
            post.position.set(ox - 90 + pr * 10, 0.9, oz - 0.5);
            addMesh(post);
        }
        // Railing bar
        var rail = makeMesh(new THREE.BoxGeometry(200, 0.15, 0.15), 0xAAAAAA);
        rail.position.set(ox + 10, 1.5, oz - 0.5);
        addMesh(rail);
    }

    function buildCliftonvilleTerraces() {
        var ox = 10640;
        var oz = -140;
        var rowLength = 16;
        // Long terrace row
        for (var t = 0; t < rowLength; t++) {
            var tx2 = ox - 80 + t * 11;
            // Main house body
            var house = makeMesh(new THREE.BoxGeometry(10, 12, 9), 0xE8D5B0);
            house.position.set(tx2, 6, oz);
            addMesh(house);
            // Bay window protrusion
            var bay = makeMesh(new THREE.BoxGeometry(4, 8, 2), 0xDDC9A0);
            bay.position.set(tx2, 5, oz - 5.5);
            addMesh(bay);
            // Upper bay window
            var upperBay = makeMesh(new THREE.BoxGeometry(4, 4, 2), 0xCCBB99);
            upperBay.position.set(tx2, 10.5, oz - 5.5);
            addMesh(upperBay);
            // Roof
            var roofShape = makeMesh(new THREE.BoxGeometry(10.5, 1.5, 9.5), 0x888877);
            roofShape.position.set(tx2, 12.75, oz);
            addMesh(roofShape);
            // Chimney stacks
            for (var ch = 0; ch < 2; ch++) {
                var chimney = makeMesh(new THREE.BoxGeometry(0.8, 3, 0.8), 0xBBAA99);
                chimney.position.set(tx2 - 3 + ch * 6, 14.5, oz - 2);
                addMesh(chimney);
                var pot = makeMesh(new THREE.CylinderGeometry(0.35, 0.4, 1.2, 6), 0xCCBBAA);
                pot.position.set(tx2 - 3 + ch * 6, 16.1, oz - 2);
                addMesh(pot);
            }
            // Ground floor door step
            var step = makeMesh(new THREE.BoxGeometry(2, 0.5, 1), 0x999988);
            step.position.set(tx2, 0.25, oz - 5);
            addMesh(step);
        }
        // Grand hotel facade at end of terrace
        var hotelX = ox + 100;
        var hotel = makeMesh(new THREE.BoxGeometry(30, 20, 14), 0xF0E6CC);
        hotel.position.set(hotelX, 10, oz);
        addMesh(hotel);
        // Hotel upper floor
        var hotelUpper = makeMesh(new THREE.BoxGeometry(30, 6, 14), 0xEEE2C4);
        hotelUpper.position.set(hotelX, 23, oz);
        addMesh(hotelUpper);
        // Hotel roof balustrade
        var balustrade = makeMesh(new THREE.BoxGeometry(32, 1.5, 1), 0xDDD0B0);
        balustrade.position.set(hotelX, 26.75, oz - 7.5);
        addMesh(balustrade);
        // Hotel columns
        for (var hc = 0; hc < 6; hc++) {
            var col = makeMesh(new THREE.CylinderGeometry(0.5, 0.6, 16, 8), 0xF8F4E8);
            col.position.set(hotelX - 12 + hc * 5, 8, oz - 7);
            addMesh(col);
        }
        // Hotel pediment
        var pediment = makeMesh(new THREE.BoxGeometry(30, 0.8, 1), 0xE8DCC0);
        pediment.position.set(hotelX, 17, oz - 7.5);
        addMesh(pediment);
        // Hotel portico roof (triangular via cone)
        var portico = makeMesh(new THREE.ConeGeometry(15, 4, 4), 0xCCC0A0);
        portico.rotation.y = Math.PI / 4;
        portico.position.set(hotelX, 20, oz - 6);
        addMesh(portico);
        // Hotel entrance steps
        var hotelSteps = makeMesh(new THREE.BoxGeometry(12, 1, 3), 0xCCBBAA);
        hotelSteps.position.set(hotelX, 0.5, oz - 9);
        addMesh(hotelSteps);
    }

    function buildHarbourArm() {
        var ox = 10640;
        var oz = 40;
        var hax = ox - 60;
        // Stone pier — long arm
        var pier = makeMesh(new THREE.BoxGeometry(6, 2.5, 80), 0xB0A898);
        pier.position.set(hax, 1.25, oz + 30);
        addMesh(pier);
        // Pier wall coping
        var coping = makeMesh(new THREE.BoxGeometry(7, 0.5, 82), 0xC8BFAF);
        coping.position.set(hax, 2.75, oz + 30);
        addMesh(coping);
        // Lighthouse at pier end
        var lhBase = makeMesh(new THREE.CylinderGeometry(2, 2.5, 8, 10), 0xEEEEEE);
        lhBase.position.set(hax, 4, oz + 70);
        addMesh(lhBase);
        var lhLantern = makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 2, 10), 0xFFCC00);
        lhLantern.position.set(hax, 9, oz + 70);
        addMesh(lhLantern);
        var lhCap = makeMesh(new THREE.ConeGeometry(2, 2.5, 10), 0xCC3333);
        lhCap.position.set(hax, 11.5, oz + 70);
        addMesh(lhCap);
        // Bollards along pier
        for (var b = 0; b < 10; b++) {
            var bollard = makeMesh(new THREE.CylinderGeometry(0.3, 0.35, 1.2, 6), 0x666666);
            bollard.position.set(hax - 3.5, 2.2, oz + 5 + b * 7);
            addMesh(bollard);
            var bollardR = makeMesh(new THREE.CylinderGeometry(0.3, 0.35, 1.2, 6), 0x666666);
            bollardR.position.set(hax + 3.5, 2.2, oz + 5 + b * 7);
            addMesh(bollardR);
        }
        // Harbour wall (curved suggestion)
        var hwallA = makeMesh(new THREE.BoxGeometry(50, 3, 4), 0xA89880);
        hwallA.position.set(ox - 40, 1.5, oz + 5);
        hwallA.rotation.y = 0.3;
        addMesh(hwallA);
        var hwallB = makeMesh(new THREE.BoxGeometry(40, 3, 4), 0xA89880);
        hwallB.position.set(ox - 85, 1.5, oz + 10);
        hwallB.rotation.y = -0.15;
        addMesh(hwallB);
        // Whelk stalls row on harbour
        var stallColors = [0xCC6633, 0xDD7744, 0xBB5522];
        for (var ws = 0; ws < 3; ws++) {
            var stall = makeMesh(new THREE.BoxGeometry(3, 2.5, 2.5), stallColors[ws % stallColors.length]);
            stall.position.set(hax + 8 + ws * 6, 1.25, oz + 15);
            addMesh(stall);
            var stallCanopy = makeMesh(new THREE.BoxGeometry(4.5, 0.3, 3.5), 0xEE4422);
            stallCanopy.position.set(hax + 8 + ws * 6, 2.75, oz + 15);
            addMesh(stallCanopy);
            var stallLeg = makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 6), 0x888888);
            stallLeg.position.set(hax + 8 + ws * 6, 1.25, oz + 13.8);
            addMesh(stallLeg);
        }
    }

    function buildShellGrotto() {
        var ox = 10640;
        var oz = -10;
        var sgx = ox - 60;
        // Grotto entry building
        var grotto = makeMesh(new THREE.BoxGeometry(10, 6, 10), 0xDDD5C0);
        grotto.position.set(sgx, 3, oz);
        addMesh(grotto);
        // Dome top
        var dome = makeMesh(new THREE.SphereGeometry(6, 12, 8), 0xCCC5AF);
        dome.position.set(sgx, 8, oz);
        addMesh(dome);
        // Dome mosaic suggestion bands (thin cylinders at different heights)
        for (var dm = 0; dm < 3; dm++) {
            var band = makeMesh(new THREE.CylinderGeometry(5.9 - dm * 0.5, 5.9 - dm * 0.5, 0.4, 16), 0xBBAA88);
            band.position.set(sgx, 6.5 + dm * 1.5, oz);
            addMesh(band);
        }
        // Entry arch pilasters
        var archL = makeMesh(new THREE.BoxGeometry(0.8, 6, 0.8), 0xCCBBAA);
        archL.position.set(sgx - 5.4, 3, oz - 5);
        addMesh(archL);
        var archR = makeMesh(new THREE.BoxGeometry(0.8, 6, 0.8), 0xCCBBAA);
        archR.position.set(sgx + 5.4, 3, oz - 5);
        addMesh(archR);
        // Entry lintel
        var lintel = makeMesh(new THREE.BoxGeometry(12, 0.8, 0.8), 0xCCBBAA);
        lintel.position.set(sgx, 6.4, oz - 5);
        addMesh(lintel);
        // Sign board
        var signBoard = makeMesh(new THREE.BoxGeometry(6, 1.5, 0.2), 0x886633);
        signBoard.position.set(sgx, 7.5, oz - 5.5);
        addMesh(signBoard);
        // Garden path approach
        var path = makeMesh(new THREE.BoxGeometry(2, 0.2, 12), 0xD4C9B0);
        path.position.set(sgx, 0.1, oz - 11);
        addMesh(path);
        // Gate posts
        for (var gp = 0; gp < 2; gp++) {
            var gpost = makeMesh(new THREE.BoxGeometry(0.6, 2, 0.6), 0xBBBBAA);
            gpost.position.set(sgx - 2 + gp * 4, 1, oz - 16);
            addMesh(gpost);
            var gball = makeMesh(new THREE.SphereGeometry(0.5, 6, 6), 0xCCCCBB);
            gball.position.set(sgx - 2 + gp * 4, 2.5, oz - 16);
            addMesh(gball);
        }
    }

    function buildOldTownStreet() {
        var ox = 10640;
        var oz = -10;
        var stx = ox + 80;
        // Old town narrow buildings (varied heights)
        var buildingData = [
            { w: 6,  h: 10, d: 7, c: 0xE8C8A0 },
            { w: 5,  h: 14, d: 7, c: 0xD4A878 },
            { w: 7,  h: 9,  d: 7, c: 0xF0D8C0 },
            { w: 4,  h: 12, d: 7, c: 0xDDBB99 },
            { w: 6,  h: 11, d: 7, c: 0xC8A888 },
            { w: 5,  h: 8,  d: 7, c: 0xE0C8A8 },
            { w: 6,  h: 13, d: 7, c: 0xD8B890 }
        ];
        var xOff = 0;
        for (var ot = 0; ot < buildingData.length; ot++) {
            var bd = buildingData[ot];
            var bx = stx + xOff + bd.w / 2;
            var bldg = makeMesh(new THREE.BoxGeometry(bd.w, bd.h, bd.d), bd.c);
            bldg.position.set(bx, bd.h / 2, oz);
            addMesh(bldg);
            // Roof variety
            if (ot % 3 === 0) {
                var pitched = makeMesh(new THREE.ConeGeometry(bd.w * 0.75, 3, 4), 0x887766);
                pitched.rotation.y = Math.PI / 4;
                pitched.position.set(bx, bd.h + 1.5, oz);
                addMesh(pitched);
            } else {
                var flatRoof = makeMesh(new THREE.BoxGeometry(bd.w + 0.5, 0.5, bd.d + 0.5), 0x777766);
                flatRoof.position.set(bx, bd.h + 0.25, oz);
                addMesh(flatRoof);
            }
            // Shop front strip
            var shop = makeMesh(new THREE.BoxGeometry(bd.w, 2.5, 0.3), 0x3366AA);
            shop.position.set(bx, 1.25, oz - bd.d / 2 - 0.15);
            addMesh(shop);
            xOff += bd.w + 0.5;
        }
        // Cobbled lane surface
        var lane = makeMesh(new THREE.BoxGeometry(xOff + 4, 0.3, 10), 0x999088);
        lane.position.set(stx + xOff / 2, 0.15, oz + 2);
        addMesh(lane);
    }

    function build() {
        buildDreamlandRollercoaster();
        buildCarousel();
        buildBigWheel();
        buildHelterSkelter();
        buildDodgemBuilding();
        buildTurnerContemporary();
        buildMargateBay();
        buildCliftonvilleTerraces();
        buildHarbourArm();
        buildShellGrotto();
        buildOldTownStreet();
    }

    function update(delta) { }

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
