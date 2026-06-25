window.TomintoulFort = (function() {
	'use strict';

	var baseX = 600;
	var baseZ = 670;

	function createBarracks(scene) {
		var stoneColor = 0x888888;
		var barracksMaterial = new THREE.MeshLambertMaterial({ color: stoneColor });

		for (var i = 0; i < 3; i++) {
			var geometry = new THREE.BoxGeometry(8, 3, 4);
			var mesh = new THREE.Mesh(geometry, barracksMaterial);
			mesh.position.set(baseX + (i - 1) * 12, 1.5, baseZ);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
		}
	}

	function createSnowGate(scene) {
		var gateMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
		var capMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

		var gateGeometry = new THREE.BoxGeometry(16, 4, 1);
		var gateMesh = new THREE.Mesh(gateGeometry, gateMaterial);
		gateMesh.position.set(baseX + 40, 2, baseZ - 15);
		gateMesh.castShadow = true;
		gateMesh.receiveShadow = true;
		scene.add(gateMesh);

		for (var i = 0; i < 2; i++) {
			var poleGeometry = new THREE.BoxGeometry(1.5, 6, 1.5);
			var poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
			poleMesh.position.set(baseX + 32 + i * 16, 3, baseZ - 15);
			poleMesh.castShadow = true;
			poleMesh.receiveShadow = true;
			scene.add(poleMesh);

			var capGeometry = new THREE.ConeGeometry(1.5, 1.2, 8);
			var capMesh = new THREE.Mesh(capGeometry, capMaterial);
			capMesh.position.set(baseX + 32 + i * 16, 6.6, baseZ - 15);
			capMesh.castShadow = true;
			capMesh.receiveShadow = true;
			scene.add(capMesh);
		}
	}

	function createWeatherStation(scene) {
		var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });

		var towerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 5, 16);
		var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
		towerMesh.position.set(baseX - 35, 2.5, baseZ + 30);
		towerMesh.castShadow = true;
		towerMesh.receiveShadow = true;
		scene.add(towerMesh);

		var anemometerGeometry = new THREE.SphereGeometry(0.6, 12, 12);
		var anemometerMesh = new THREE.Mesh(anemometerGeometry, sphereMaterial);
		anemometerMesh.position.set(baseX - 35, 5.5, baseZ + 30);
		anemometerMesh.castShadow = true;
		anemometerMesh.receiveShadow = true;
		scene.add(anemometerMesh);
	}

	function createDistillery(scene) {
		var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		var copperMaterial = new THREE.MeshLambertMaterial({ color: 0xB87333 });

		var building1Geometry = new THREE.BoxGeometry(7, 4, 6);
		var building1Mesh = new THREE.Mesh(building1Geometry, stoneMaterial);
		building1Mesh.position.set(baseX - 45, 2, baseZ - 40);
		building1Mesh.castShadow = true;
		building1Mesh.receiveShadow = true;
		scene.add(building1Mesh);

		var building2Geometry = new THREE.BoxGeometry(6, 3.5, 5);
		var building2Mesh = new THREE.Mesh(building2Geometry, stoneMaterial);
		building2Mesh.position.set(baseX - 55, 1.75, baseZ - 35);
		building2Mesh.castShadow = true;
		building2Mesh.receiveShadow = true;
		scene.add(building2Mesh);

		var stillGeometry = new THREE.CylinderGeometry(1.2, 1.2, 4, 12);
		var stillMesh = new THREE.Mesh(stillGeometry, copperMaterial);
		stillMesh.position.set(baseX - 40, 2, baseZ - 38);
		stillMesh.castShadow = true;
		stillMesh.receiveShadow = true;
		scene.add(stillMesh);
	}

	function createSnowBerm(scene) {
		var snowMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });

		var bermGeometry = new THREE.BoxGeometry(40, 2.5, 1.5);
		var bermMesh = new THREE.Mesh(bermGeometry, snowMaterial);
		bermMesh.position.set(baseX + 50, 1.25, baseZ + 45);
		bermMesh.castShadow = true;
		bermMesh.receiveShadow = true;
		scene.add(bermMesh);
	}

	function createLookoutCairn(scene) {
		var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var cairnMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		var platformGeometry = new THREE.BoxGeometry(6, 1, 6);
		var platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
		platformMesh.position.set(baseX - 60, 0.5, baseZ + 50);
		platformMesh.castShadow = true;
		platformMesh.receiveShadow = true;
		scene.add(platformMesh);

		for (var i = 0; i < 4; i++) {
			var stoneGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
			var stoneMesh = new THREE.Mesh(stoneGeometry, cairnMaterial);
			var angle = (i / 4) * Math.PI * 2;
			stoneMesh.position.set(
				baseX - 60 + Math.cos(angle) * 1.5,
				2,
				baseZ + 50 + Math.sin(angle) * 1.5
			);
			stoneMesh.castShadow = true;
			stoneMesh.receiveShadow = true;
			scene.add(stoneMesh);
		}

		var topStoneGeometry = new THREE.BoxGeometry(1, 1, 1);
		var topStoneMesh = new THREE.Mesh(topStoneGeometry, cairnMaterial);
		topStoneMesh.position.set(baseX - 60, 2.5, baseZ + 50);
		topStoneMesh.castShadow = true;
		topStoneMesh.receiveShadow = true;
		scene.add(topStoneMesh);
	}

	function createSnowcatPark(scene) {
		var vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
		var trackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		for (var v = 0; v < 2; v++) {
			var hullGeometry = new THREE.BoxGeometry(3.5, 2, 6);
			var hullMesh = new THREE.Mesh(hullGeometry, vehicleMaterial);
			hullMesh.position.set(baseX + 25 + v * 6, 1, baseZ + 25);
			hullMesh.castShadow = true;
			hullMesh.receiveShadow = true;
			scene.add(hullMesh);

			var trackGeometry = new THREE.BoxGeometry(4, 0.8, 6.5);
			var trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
			trackMesh.position.set(baseX + 25 + v * 6, 0.4, baseZ + 25);
			trackMesh.castShadow = true;
			trackMesh.receiveShadow = true;
			scene.add(trackMesh);
		}
	}

	function createSupplyBunker(scene) {
		var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		var mainGeometry = new THREE.BoxGeometry(10, 3, 8);
		var mainMesh = new THREE.Mesh(mainGeometry, bunkerMaterial);
		mainMesh.position.set(baseX + 70, 1.5, baseZ - 55);
		mainMesh.castShadow = true;
		mainMesh.receiveShadow = true;
		scene.add(mainMesh);

		for (var v = 0; v < 2; v++) {
			var ventGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2.5, 12);
			var ventMesh = new THREE.Mesh(ventGeometry, ventMaterial);
			ventMesh.position.set(baseX + 62 + v * 16, 2.5, baseZ - 55);
			ventMesh.castShadow = true;
			ventMesh.receiveShadow = true;
			scene.add(ventMesh);
		}
	}

	function initialize(scene) {
		createBarracks(scene);
		createSnowGate(scene);
		createWeatherStation(scene);
		createDistillery(scene);
		createSnowBerm(scene);
		createLookoutCairn(scene);
		createSnowcatPark(scene);
		createSupplyBunker(scene);
	}

	return {
		initialize: initialize
	};
}());
