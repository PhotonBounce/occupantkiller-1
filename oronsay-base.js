window.OronsayBase = (function() {
	'use strict';

	var objects = [];
	var lights = [];

	var config = {
		ambientColor: 0xCCCCBB,
		ambientIntensity: 0.7,
		prioryColor: 0x998877,
		transeptColor: 0xCCBB99,
		colonnadeCreamColor: 0xDDCCAA,
		causewayColor: 0x666655,
		bunkerColor: 0x778877,
		rockColor: 0x556655,
		hutColor: 0x7A5C32,
		potsColor: 0x8B6914,
		markerOrangeColor: 0xFF8800,
		markerStripeColor: 0xFFFFFF
	};

	function createPrioryWalls(scene) {
		var geometry = new THREE.BoxGeometry(1, 8, 10);
		var material = new THREE.MeshLambertMaterial({ color: config.prioryColor });

		var wall1 = new THREE.Mesh(geometry, material);
		wall1.position.set(-5, 4, 0);
		scene.add(wall1);
		objects.push(wall1);

		var wall2 = new THREE.Mesh(geometry, material);
		wall2.position.set(0, 4, 5);
		scene.add(wall2);
		objects.push(wall2);

		var wall3 = new THREE.Mesh(geometry, material);
		wall3.position.set(5, 4, 0);
		scene.add(wall3);
		objects.push(wall3);
	}

	function createTransept(scene) {
		var geometry = new THREE.BoxGeometry(10, 7, 6);
		var material = new THREE.MeshLambertMaterial({ color: config.transeptColor });
		var transept = new THREE.Mesh(geometry, material);
		transept.position.set(0, 3.5, -8);
		scene.add(transept);
		objects.push(transept);
	}

	function createColonnade(scene) {
		var columnCount = 6;
		var spacing = 3;
		var startX = -7.5;
		var geometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
		var material = new THREE.MeshLambertMaterial({ color: config.colonnadeCreamColor });

		for (var i = 0; i < columnCount; i++) {
			var column = new THREE.Mesh(geometry, material);
			column.position.set(startX + (i * spacing), 2, -12);
			scene.add(column);
			objects.push(column);
		}
	}

	function createCauseway(scene) {
		var geometry = new THREE.BoxGeometry(40, 0.5, 4);
		var material = new THREE.MeshLambertMaterial({ color: config.causewayColor });
		var causeway = new THREE.Mesh(geometry, material);
		causeway.position.set(15, -0.25, 0);
		scene.add(causeway);
		objects.push(causeway);
	}

	function createBunker(scene) {
		var bunkerGeometry = new THREE.BoxGeometry(4, 2, 4);
		var bunkerMaterial = new THREE.MeshLambertMaterial({ color: config.bunkerColor });
		var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
		bunker.position.set(30, 1, 0);
		scene.add(bunker);
		objects.push(bunker);

		var slitGeometry = new THREE.BoxGeometry(1, 1, 2);
		var slitMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var slit = new THREE.Mesh(slitGeometry, slitMaterial);
		slit.position.set(30, 1.5, 1.5);
		scene.add(slit);
		objects.push(slit);
	}

	function createTideMarkers(scene) {
		var poleCount = 5;
		var spacing = 8;
		var startX = 0;

		for (var i = 0; i < poleCount; i++) {
			var x = startX + (i * spacing);

			var poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3, 8);
			var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var pole = new THREE.Mesh(poleGeometry, poleMaterial);
			pole.position.set(x, 1.5, 2);
			scene.add(pole);
			objects.push(pole);

			var stripeHeight = 0.3;
			var stripeCount = 5;
			for (var j = 0; j < stripeCount; j++) {
				var stripeGeometry = new THREE.BoxGeometry(0.2, stripeHeight, 0.2);
				var stripeMaterial = new THREE.MeshLambertMaterial({ color: config.markerOrangeColor });
				var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
				stripe.position.set(x, 0.5 + (j * 0.6), 2);
				scene.add(stripe);
				objects.push(stripe);
			}

			var lightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
			var lightMaterial = new THREE.MeshLambertMaterial({ color: config.markerOrangeColor });
			var lightMarker = new THREE.Mesh(lightGeometry, lightMaterial);
			lightMarker.position.set(x, 3.2, 2);
			lightMarker.userData.isMarkerLight = true;
			lightMarker.userData.markerIndex = i;
			scene.add(lightMarker);
			objects.push(lightMarker);
		}
	}

	function createRockClusters(scene) {
		var clusterPositions = [
			{ x: -20, z: 5 },
			{ x: -15, z: -8 },
			{ x: 8, z: 10 },
			{ x: 35, z: -5 }
		];

		clusterPositions.forEach(function(pos) {
			var rocksPerCluster = 3;
			for (var i = 0; i < rocksPerCluster; i++) {
				var geometry = new THREE.BoxGeometry(
					0.8 + (Math.random() * 0.4),
					0.6 + (Math.random() * 0.3),
					1.2 + (Math.random() * 0.6)
				);
				var material = new THREE.MeshLambertMaterial({ color: config.rockColor });
				var rock = new THREE.Mesh(geometry, material);
				rock.position.set(
					pos.x + (Math.random() * 1.5 - 0.75),
					0.4 + (Math.random() * 0.2),
					pos.z + (Math.random() * 1.5 - 0.75)
				);
				rock.rotation.set(
					Math.random() * Math.PI,
					Math.random() * Math.PI,
					Math.random() * Math.PI
				);
				scene.add(rock);
				objects.push(rock);
			}
		});
	}

	function createFishingHut(scene) {
		var geometry = new THREE.BoxGeometry(6, 4, 5);
		var material = new THREE.MeshLambertMaterial({ color: config.hutColor });
		var hut = new THREE.Mesh(geometry, material);
		hut.position.set(-18, 2, -6);
		scene.add(hut);
		objects.push(hut);
	}

	function createLobsterPots(scene) {
		var potPositions = [
			{ x: -12, z: -10 },
			{ x: -10, z: -10 },
			{ x: -8, z: -10 },
			{ x: -10, z: -8 }
		];

		potPositions.forEach(function(pos) {
			var geometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
			var material = new THREE.MeshLambertMaterial({ color: config.potsColor });
			var pot = new THREE.Mesh(geometry, material);
			pot.position.set(pos.x, 0.4, pos.z);
			scene.add(pot);
			objects.push(pot);
		});
	}

	function createLights(scene) {
		var ambientLight = new THREE.AmbientLight(config.ambientColor, config.ambientIntensity);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var markerLightPositions = [0, 8, 16, 24, 32];
		markerLightPositions.forEach(function(x) {
			var pointLight = new THREE.PointLight(config.markerOrangeColor, 0.6, 10);
			pointLight.position.set(x, 3.5, 2);
			scene.add(pointLight);
			lights.push(pointLight);
		});
	}

	function initialize(scene) {
		createPrioryWalls(scene);
		createTransept(scene);
		createColonnade(scene);
		createCauseway(scene);
		createBunker(scene);
		createTideMarkers(scene);
		createRockClusters(scene);
		createFishingHut(scene);
		createLobsterPots(scene);
		createLights(scene);
	}

	function update(delta) {
		var time = Date.now() * 0.001;
		objects.forEach(function(obj) {
			if (obj.userData.isMarkerLight) {
				var index = obj.userData.markerIndex;
				var pulseFactor = 0.8 + (0.2 * Math.sin(time * 2 + index));
				obj.scale.set(pulseFactor, pulseFactor, pulseFactor);
			}
		});

		lights.forEach(function(light) {
			if (light instanceof THREE.PointLight) {
				var pulseFactor = 0.5 + (0.5 * Math.sin(time * 2));
				light.intensity = 0.6 * pulseFactor;
			}
		});
	}

	function reset(scene) {
		objects.forEach(function(obj) {
			scene.remove(obj);
		});
		objects = [];

		lights.forEach(function(light) {
			scene.remove(light);
		});
		lights = [];
	}

	return {
		initialize: initialize,
		update: update,
		reset: reset,
		objects: objects,
		lights: lights
	};
}());
