window.CuparKeep = (function() {
	'use strict';

	var objects = [];
	var lights = [];
	var marketCrossSphere = null;

	function addObject(mesh) {
		objects.push(mesh);
		return mesh;
	}

	function addLight(light) {
		lights.push(light);
		return light;
	}

	function createCastleMound(scene) {
		var moundColor = 0x5C4030;
		var geometry = new THREE.SphereGeometry(6, 16, 12);
		var material = new THREE.MeshLambertMaterial({ color: moundColor });
		var mound = new THREE.Mesh(geometry, material);
		mound.position.set(0, 3, 0);
		mound.scale.y = 0.6;
		scene.add(mound);
		addObject(mound);
	}

	function createSheriffCourt(scene) {
		var stoneColor = 0xCCBB99;
		var geometry = new THREE.BoxGeometry(12, 10, 8);
		var material = new THREE.MeshLambertMaterial({ color: stoneColor });
		var building = new THREE.Mesh(geometry, material);
		building.position.set(20, 5, 0);
		scene.add(building);
		addObject(building);
	}

	function createCornExchange(scene) {
		var victorianColor = 0x998877;
		var geometry = new THREE.BoxGeometry(18, 12, 8);
		var material = new THREE.MeshLambertMaterial({ color: victorianColor });
		var hall = new THREE.Mesh(geometry, material);
		hall.position.set(-25, 6, 5);
		scene.add(hall);
		addObject(hall);
	}

	function createFordCrossing(scene) {
		var stoneColor = 0x888877;
		var geometry = new THREE.BoxGeometry(14, 0.3, 5);
		var material = new THREE.MeshLambertMaterial({ color: stoneColor });
		var ford = new THREE.Mesh(geometry, material);
		ford.position.set(0, 0.15, -20);
		scene.add(ford);
		addObject(ford);

		var bankL = new THREE.BoxGeometry(15, 2, 1);
		var bankMatL = new THREE.MeshLambertMaterial({ color: 0x6B5C4A });
		var revetL = new THREE.Mesh(bankL, bankMatL);
		revetL.position.set(0, 1, -22.5);
		scene.add(revetL);
		addObject(revetL);

		var bankR = new THREE.BoxGeometry(15, 2, 1);
		var bankMatR = new THREE.MeshLambertMaterial({ color: 0x6B5C4A });
		var revetR = new THREE.Mesh(bankR, bankMatR);
		revetR.position.set(0, 1, -17.5);
		scene.add(revetR);
		addObject(revetR);
	}

	function createTayRailwayViaduct(scene) {
		var pierColor = 0x888877;
		var deckColor = 0x777766;
		var pierGeo = new THREE.BoxGeometry(2, 8, 3);
		var pierMat = new THREE.MeshLambertMaterial({ color: pierColor });

		var pier1 = new THREE.Mesh(pierGeo, pierMat);
		pier1.position.set(-15, 4, 30);
		scene.add(pier1);
		addObject(pier1);

		var pier2 = new THREE.Mesh(pierGeo, pierMat);
		pier2.position.set(0, 4, 30);
		scene.add(pier2);
		addObject(pier2);

		var pier3 = new THREE.Mesh(pierGeo, pierMat);
		pier3.position.set(15, 4, 30);
		scene.add(pier3);
		addObject(pier3);

		var deckGeo = new THREE.BoxGeometry(20, 1, 4);
		var deckMat = new THREE.MeshLambertMaterial({ color: deckColor });

		var deck1 = new THREE.Mesh(deckGeo, deckMat);
		deck1.position.set(-7.5, 8.5, 30);
		scene.add(deck1);
		addObject(deck1);

		var deck2 = new THREE.Mesh(deckGeo, deckMat);
		deck2.position.set(7.5, 8.5, 30);
		scene.add(deck2);
		addObject(deck2);
	}

	function createMarketCross(scene) {
		var stoneColor = 0xBBBBAA;
		var pillarGeo = new THREE.BoxGeometry(1, 6, 1);
		var pillarMat = new THREE.MeshLambertMaterial({ color: stoneColor });
		var pillar = new THREE.Mesh(pillarGeo, pillarMat);
		pillar.position.set(-5, 3, 10);
		scene.add(pillar);
		addObject(pillar);

		var vaneGeo = new THREE.SphereGeometry(0.4, 8, 8);
		var vaneMat = new THREE.MeshLambertMaterial({ color: 0xDD8844 });
		marketCrossSphere = new THREE.Mesh(vaneGeo, vaneMat);
		marketCrossSphere.position.set(-5, 6.5, 10);
		scene.add(marketCrossSphere);
		addObject(marketCrossSphere);
	}

	function createMilitaryBillet(scene) {
		var billetColor = 0x998877;
		var geometry = new THREE.BoxGeometry(16, 12, 6);
		var material = new THREE.MeshLambertMaterial({ color: billetColor });
		var billet = new THREE.Mesh(geometry, material);
		billet.position.set(30, 6, -10);
		scene.add(billet);
		addObject(billet);
	}

	function createSupplyConvoy(scene) {
		var oliveColor = 0x4a5240;
		var baseGeo = new THREE.BoxGeometry(3, 2, 6);
		var mat = new THREE.MeshLambertMaterial({ color: oliveColor });

		var truck1 = new THREE.Mesh(baseGeo, mat);
		truck1.position.set(-30, 1, 0);
		scene.add(truck1);
		addObject(truck1);

		var truck2 = new THREE.Mesh(baseGeo, mat);
		truck2.position.set(-35, 1, 0);
		scene.add(truck2);
		addObject(truck2);

		var truck3 = new THREE.Mesh(baseGeo, mat);
		truck3.position.set(-40, 1, 0);
		scene.add(truck3);
		addObject(truck3);

		var truck4 = new THREE.Mesh(baseGeo, mat);
		truck4.position.set(-30, 1, 8);
		scene.add(truck4);
		addObject(truck4);

		var truck5 = new THREE.Mesh(baseGeo, mat);
		truck5.position.set(-35, 1, 8);
		scene.add(truck5);
		addObject(truck5);
	}

	function createMarketSquareLamps(scene) {
		var lampColor = 0xFFEE88;
		var lampIntensity = 0.8;

		var light1 = new THREE.PointLight(lampColor, lampIntensity, 40);
		light1.position.set(-15, 8, 5);
		scene.add(light1);
		addLight(light1);

		var light2 = new THREE.PointLight(lampColor, lampIntensity, 40);
		light2.position.set(10, 8, 0);
		scene.add(light2);
		addLight(light2);

		var light3 = new THREE.PointLight(lampColor, lampIntensity, 40);
		light3.position.set(-5, 8, -15);
		scene.add(light3);
		addLight(light3);
	}

	function init(scene) {
		createCastleMound(scene);
		createSheriffCourt(scene);
		createCornExchange(scene);
		createFordCrossing(scene);
		createTayRailwayViaduct(scene);
		createMarketCross(scene);
		createMilitaryBillet(scene);
		createSupplyConvoy(scene);
		createMarketSquareLamps(scene);

		var ambientLight = new THREE.AmbientLight(0xFFCC99, 0.7);
		scene.add(ambientLight);
		addLight(ambientLight);
	}

	function update(delta) {
		if (marketCrossSphere) {
			marketCrossSphere.rotation.y += delta * 0.5;
		}
	}

	function reset(scene) {
		var i;
		for (i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
		lights = [];

		marketCrossSphere = null;
	}

	return {
		init: init,
		update: update,
		reset: reset,
		objects: objects,
		lights: lights
	};
}());
