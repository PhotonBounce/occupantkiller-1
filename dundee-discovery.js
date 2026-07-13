window.DundeeDiscovery = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var X = 15080;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(obj) {
        scene.add(obj);
        objects.push(obj);
        return obj;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildRRSDiscovery() {
        var hullGeo = new THREE.BoxGeometry(30, 6, 8);
        var hull = new THREE.Mesh(hullGeo, makeMat(0x5c3a1e));
        hull.position.set(X + 0, 3, -20);
        addObj(hull);

        var bowGeo = new THREE.ConeGeometry(4, 10, 4);
        var bow = new THREE.Mesh(bowGeo, makeMat(0x5c3a1e));
        bow.rotation.z = -Math.PI / 2;
        bow.position.set(X + 20, 3, -20);
        addObj(bow);

        var sternGeo = new THREE.BoxGeometry(4, 6, 8);
        var stern = new THREE.Mesh(sternGeo, makeMat(0x4a2f15));
        stern.position.set(X - 17, 3, -20);
        addObj(stern);

        var deckGeo = new THREE.BoxGeometry(28, 1, 6);
        var deck = new THREE.Mesh(deckGeo, makeMat(0x8b6914));
        deck.position.set(X, 6.5, -20);
        addObj(deck);

        var mastPositions = [X - 10, X + 0, X + 10];
        for (var m = 0; m < 3; m++) {
            var mastGeo = new THREE.CylinderGeometry(0.3, 0.4, 18, 6);
            var mast = new THREE.Mesh(mastGeo, makeMat(0x8b6914));
            mast.position.set(mastPositions[m], 16, -20);
            addObj(mast);

            var yardGeo = new THREE.CylinderGeometry(0.15, 0.15, 10, 4);
            var yard = new THREE.Mesh(yardGeo, makeMat(0x8b6914));
            yard.rotation.z = Math.PI / 2;
            yard.position.set(mastPositions[m], 21, -20);
            addObj(yard);

            var yardLowGeo = new THREE.CylinderGeometry(0.12, 0.12, 8, 4);
            var yardLow = new THREE.Mesh(yardLowGeo, makeMat(0x8b6914));
            yardLow.rotation.z = Math.PI / 2;
            yardLow.position.set(mastPositions[m], 17, -20);
            addObj(yardLow);
        }

        var riggingPoints = [
            X - 10, 25, -20,
            X + 0, 25, -20,
            X - 10, 25, -20,
            X - 14, 7, -20,
            X + 0, 25, -20,
            X - 4, 7, -20,
            X + 0, 25, -20,
            X + 10, 25, -20,
            X + 10, 25, -20,
            X + 14, 7, -20
        ];
        var rigGeo = new THREE.BufferGeometry();
        var rigVerts = new Float32Array(riggingPoints);
        rigGeo.setAttribute('position', new THREE.BufferAttribute(rigVerts, 3));
        var rigMat = new THREE.LineBasicMaterial({ color: 0x4a3000 });
        var rigging = new THREE.LineSegments(rigGeo, rigMat);
        addObj(rigging);

        var wheelGeo = new THREE.BoxGeometry(4, 4, 3);
        var wheelhouse = new THREE.Mesh(wheelGeo, makeMat(0x8b6914));
        wheelhouse.position.set(X - 8, 10, -20);
        addObj(wheelhouse);

        var funnelGeo = new THREE.CylinderGeometry(0.8, 1.0, 6, 8);
        var funnel = new THREE.Mesh(funnelGeo, makeMat(0x1a1a1a));
        funnel.position.set(X - 5, 13, -20);
        addObj(funnel);

        var funnelTopGeo = new THREE.CylinderGeometry(0.9, 0.8, 0.5, 8);
        var funnelTop = new THREE.Mesh(funnelTopGeo, makeMat(0xff2200));
        funnelTop.position.set(X - 5, 16.2, -20);
        addObj(funnelTop);
    }

    function buildVADundee() {
        var baseGeo = new THREE.BoxGeometry(50, 1, 30);
        var base = new THREE.Mesh(baseGeo, makeMat(0xaaaaaa));
        base.position.set(X + 80, 0.5, -5);
        addObj(base);

        var wingLeftGeo = new THREE.BoxGeometry(20, 18, 28);
        var wingLeft = new THREE.Mesh(wingLeftGeo, makeMat(0x2d2d2d));
        wingLeft.position.set(X + 60, 9, -5);
        addObj(wingLeft);

        var cantLeftGeo = new THREE.BoxGeometry(16, 12, 26);
        var cantLeft = new THREE.Mesh(cantLeftGeo, makeMat(0x222222));
        cantLeft.position.set(X + 54, 6, -5);
        addObj(cantLeft);

        var wingRightGeo = new THREE.BoxGeometry(20, 18, 28);
        var wingRight = new THREE.Mesh(wingRightGeo, makeMat(0x2d2d2d));
        wingRight.position.set(X + 100, 9, -5);
        addObj(wingRight);

        var cantRightGeo = new THREE.BoxGeometry(16, 12, 26);
        var cantRight = new THREE.Mesh(cantRightGeo, makeMat(0x222222));
        cantRight.position.set(X + 106, 6, -5);
        addObj(cantRight);

        var bridgeGeo = new THREE.BoxGeometry(20, 6, 28);
        var bridge = new THREE.Mesh(bridgeGeo, makeMat(0x333333));
        bridge.position.set(X + 80, 15, -5);
        addObj(bridge);

        var plazaGeo = new THREE.BoxGeometry(60, 0.3, 20);
        var plaza = new THREE.Mesh(plazaGeo, makeMat(0xcccccc));
        plaza.position.set(X + 80, 0.15, 12);
        addObj(plaza);

        var entranceGeo = new THREE.BoxGeometry(12, 10, 4);
        var entrance = new THREE.Mesh(entranceGeo, makeMat(0x111111));
        entrance.position.set(X + 80, 5, 9);
        addObj(entrance);
    }

    function buildTayRoadBridge() {
        var roadGeo = new THREE.BoxGeometry(420, 1, 10);
        var road = new THREE.Mesh(roadGeo, makeMat(0x808080));
        road.position.set(X + 200, 6, 60);
        addObj(road);

        var numPiers = 14;
        for (var p = 0; p < numPiers; p++) {
            var pierGeo = new THREE.BoxGeometry(3, 14, 6);
            var pier = new THREE.Mesh(pierGeo, makeMat(0x999999));
            pier.position.set(X - 10 + p * 30, 0, 60);
            addObj(pier);

            var capGeo = new THREE.BoxGeometry(8, 1.5, 7);
            var cap = new THREE.Mesh(capGeo, makeMat(0x888888));
            cap.position.set(X - 10 + p * 30, 6.7, 60);
            addObj(cap);
        }

        var barrierLeftGeo = new THREE.BoxGeometry(420, 1, 0.5);
        var barrierLeft = new THREE.Mesh(barrierLeftGeo, makeMat(0xffffff));
        barrierLeft.position.set(X + 200, 7, 55);
        addObj(barrierLeft);

        var barrierRightGeo = new THREE.BoxGeometry(420, 1, 0.5);
        var barrierRight = new THREE.Mesh(barrierRightGeo, makeMat(0xffffff));
        barrierRight.position.set(X + 200, 7, 65);
        addObj(barrierRight);

        var rampGeo = new THREE.BoxGeometry(30, 3, 10);
        var rampWest = new THREE.Mesh(rampGeo, makeMat(0x777777));
        rampWest.position.set(X - 25, 4.5, 60);
        addObj(rampWest);

        var rampEast = new THREE.Mesh(rampGeo, makeMat(0x777777));
        rampEast.position.set(X + 425, 4.5, 60);
        addObj(rampEast);
    }

    function buildDundeeLaw() {
        var hillGeo = new THREE.ConeGeometry(60, 50, 16);
        var hill = new THREE.Mesh(hillGeo, makeMat(0x4a7a3a));
        hill.position.set(X - 150, 25, -150);
        addObj(hill);

        var summitGeo = new THREE.SphereGeometry(8, 8, 6);
        var summit = new THREE.Mesh(summitGeo, makeMat(0x5a8a4a));
        summit.position.set(X - 150, 52, -150);
        addObj(summit);

        var obeliskBaseGeo = new THREE.BoxGeometry(5, 3, 5);
        var obeliskBase = new THREE.Mesh(obeliskBaseGeo, makeMat(0xdddddd));
        obeliskBase.position.set(X - 150, 52.5, -150);
        addObj(obeliskBase);

        var obeliskShaftGeo = new THREE.BoxGeometry(2.5, 14, 2.5);
        var obeliskShaft = new THREE.Mesh(obeliskShaftGeo, makeMat(0xeeeeee));
        obeliskShaft.position.set(X - 150, 61, -150);
        addObj(obeliskShaft);

        var obeliskTopGeo = new THREE.ConeGeometry(1.8, 4, 4);
        var obeliskTop = new THREE.Mesh(obeliskTopGeo, makeMat(0xffffff));
        obeliskTop.position.set(X - 150, 70, -150);
        addObj(obeliskTop);

        var beaconPoleGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 5);
        var beaconPole = new THREE.Mesh(beaconPoleGeo, makeMat(0x333333));
        beaconPole.position.set(X - 145, 72, -148);
        addObj(beaconPole);

        var beaconLightGeo = new THREE.SphereGeometry(1, 6, 5);
        var beaconLight = new THREE.Mesh(beaconLightGeo, makeMat(0xffff00));
        beaconLight.position.set(X - 145, 77, -148);
        addObj(beaconLight);

        var slopeGeo = new THREE.ConeGeometry(30, 20, 12);
        var slope = new THREE.Mesh(slopeGeo, makeMat(0x3d6b2e));
        slope.position.set(X - 110, 10, -130);
        addObj(slope);
    }

    function buildCairdHall() {
        var hallBodyGeo = new THREE.BoxGeometry(45, 20, 30);
        var hallBody = new THREE.Mesh(hallBodyGeo, makeMat(0xe8dcc8));
        hallBody.position.set(X - 60, 10, -80);
        addObj(hallBody);

        var porticoBaseGeo = new THREE.BoxGeometry(30, 2, 8);
        var porticoBase = new THREE.Mesh(porticoBaseGeo, makeMat(0xddd0b0));
        porticoBase.position.set(X - 60, 2, -67);
        addObj(porticoBase);

        var numCols = 8;
        for (var c = 0; c < numCols; c++) {
            var colGeo = new THREE.CylinderGeometry(0.8, 1.0, 14, 8);
            var col = new THREE.Mesh(colGeo, makeMat(0xf5f0e0));
            col.position.set(X - 73.5 + c * 4.5, 10, -66);
            addObj(col);
        }

        var entablatureGeo = new THREE.BoxGeometry(34, 2.5, 3);
        var entablature = new THREE.Mesh(entablatureGeo, makeMat(0xe8dcc8));
        entablature.position.set(X - 60, 18, -66);
        addObj(entablature);

        var pedimentGeo = new THREE.ConeGeometry(17, 5, 3);
        var pediment = new THREE.Mesh(pedimentGeo, makeMat(0xe0d4bc));
        pediment.rotation.y = Math.PI / 6;
        pediment.position.set(X - 60, 22, -66);
        addObj(pediment);

        var drumGeo = new THREE.CylinderGeometry(7, 7, 4, 12);
        var drum = new THREE.Mesh(drumGeo, makeMat(0xe8dcc8));
        drum.position.set(X - 60, 22, -80);
        addObj(drum);

        var domeGeo = new THREE.SphereGeometry(7, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var dome = new THREE.Mesh(domeGeo, makeMat(0xd4c8b0));
        dome.position.set(X - 60, 26, -80);
        addObj(dome);

        var lanternGeo = new THREE.CylinderGeometry(1.5, 2, 4, 8);
        var lantern = new THREE.Mesh(lanternGeo, makeMat(0xccbb99));
        lantern.position.set(X - 60, 34, -80);
        addObj(lantern);

        var squareGeo = new THREE.BoxGeometry(60, 0.2, 40);
        var square = new THREE.Mesh(squareGeo, makeMat(0xccccaa));
        square.position.set(X - 60, 0.1, -55);
        addObj(square);

        var fountainBaseGeo = new THREE.CylinderGeometry(5, 5.5, 1.5, 10);
        var fountainBase = new THREE.Mesh(fountainBaseGeo, makeMat(0xbbbbbb));
        fountainBase.position.set(X - 60, 0.75, -48);
        addObj(fountainBase);

        var fountainTopGeo = new THREE.SphereGeometry(1.5, 8, 6);
        var fountainTop = new THREE.Mesh(fountainTopGeo, makeMat(0x9999ff));
        fountainTop.position.set(X - 60, 3, -48);
        addObj(fountainTop);
    }

    function buildWaterfrontRegen() {
        var gardensGeo = new THREE.BoxGeometry(80, 0.3, 25);
        var gardens = new THREE.Mesh(gardensGeo, makeMat(0x4a8a3a));
        gardens.position.set(X + 30, 0.15, 20);
        addObj(gardens);

        var walkwayGeo = new THREE.BoxGeometry(200, 0.3, 8);
        var walkway = new THREE.Mesh(walkwayGeo, makeMat(0xccbbaa));
        walkway.position.set(X + 80, 0.15, 32);
        addObj(walkway);

        var unicornHullGeo = new THREE.BoxGeometry(22, 5, 7);
        var unicornHull = new THREE.Mesh(unicornHullGeo, makeMat(0x3a2a10));
        unicornHull.position.set(X - 30, 2.5, 10);
        addObj(unicornHull);

        var unicornBowGeo = new THREE.ConeGeometry(3.5, 8, 4);
        var unicornBow = new THREE.Mesh(unicornBowGeo, makeMat(0x3a2a10));
        unicornBow.rotation.z = -Math.PI / 2;
        unicornBow.position.set(X - 19, 2.5, 10);
        addObj(unicornBow);

        var unicornDeckGeo = new THREE.BoxGeometry(20, 0.8, 5);
        var unicornDeck = new THREE.Mesh(unicornDeckGeo, makeMat(0x7a5a20));
        unicornDeck.position.set(X - 30, 5.4, 10);
        addObj(unicornDeck);

        var unicornMastGeo = new THREE.CylinderGeometry(0.25, 0.3, 14, 6);
        var unicornMast = new THREE.Mesh(unicornMastGeo, makeMat(0x7a5a20));
        unicornMast.position.set(X - 28, 13, 10);
        addObj(unicornMast);

        var unicornYardGeo = new THREE.CylinderGeometry(0.12, 0.12, 8, 4);
        var unicornYard = new THREE.Mesh(unicornYardGeo, makeMat(0x7a5a20));
        unicornYard.rotation.z = Math.PI / 2;
        unicornYard.position.set(X - 28, 17, 10);
        addObj(unicornYard);

        var museumQtrGeo = new THREE.BoxGeometry(35, 12, 20);
        var museumQtr = new THREE.Mesh(museumQtrGeo, makeMat(0xbbaa99));
        museumQtr.position.set(X + 150, 6, 0);
        addObj(museumQtr);

        var museumEntranceGeo = new THREE.BoxGeometry(12, 8, 4);
        var museumEntrance = new THREE.Mesh(museumEntranceGeo, makeMat(0x2255aa));
        museumEntrance.position.set(X + 150, 4, 11);
        addObj(museumEntrance);

        var slessorBenchCount = 5;
        for (var b = 0; b < slessorBenchCount; b++) {
            var benchGeo = new THREE.BoxGeometry(3, 0.5, 1);
            var bench = new THREE.Mesh(benchGeo, makeMat(0x887766));
            bench.position.set(X + 10 + b * 12, 0.25, 22);
            addObj(bench);
        }

        var lightCount = 8;
        for (var l = 0; l < lightCount; l++) {
            var lampGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 5);
            var lamp = new THREE.Mesh(lampGeo, makeMat(0x555555));
            lamp.position.set(X + 40 + l * 20, 2.5, 31);
            addObj(lamp);

            var lampHeadGeo = new THREE.SphereGeometry(0.5, 5, 4);
            var lampHead = new THREE.Mesh(lampHeadGeo, makeMat(0xffffcc));
            lampHead.position.set(X + 40 + l * 20, 5.5, 31);
            addObj(lampHead);
        }
    }

    function build() {
        buildRRSDiscovery();
        buildVADundee();
        buildTayRoadBridge();
        buildDundeeLaw();
        buildCairdHall();
        buildWaterfrontRegen();
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
