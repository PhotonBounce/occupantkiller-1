window.Shipyard = (function() {
	'use strict';

	var scene, camera;
	var environmentObjects = [];
	var sparks = [];
	var weldParticles = [];

	function init(sc, cam) {
		scene = sc;
		camera = cam;
		environmentObjects = [];
		sparks = [];
		weldParticles = [];

		buildDrydockWalls();
		buildShipHull();
		buildGantryCranes();
		buildWeldingSparks();
		buildPropellerShaft();
		buildHarborDock();
		buildAmmunitionCrane();
		buildWarehouse();
		buildTorpedoRacks();
	}

	function buildDrydockWalls() {
		var leftWallGeom = new THREE.BoxGeometry(2, 120, 60);
		var leftWallMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3 });
		var leftWall = new THREE.Mesh(leftWallGeom, leftWallMat);
		leftWall.position.set(-100, 60, 0);
		leftWall.castShadow = true;
		leftWall.receiveShadow = true;
		scene.add(leftWall);
		environmentObjects.push(leftWall);

		var rightWallGeom = new THREE.BoxGeometry(2, 120, 60);
		var rightWallMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3 });
		var rightWall = new THREE.Mesh(rightWallGeom, rightWallMat);
		rightWall.position.set(100, 60, 0);
		rightWall.castShadow = true;
		rightWall.receiveShadow = true;
		scene.add(rightWall);
		environmentObjects.push(rightWall);
	}

	function buildShipHull() {
		var hullGeom = new THREE.BoxGeometry(30, 35, 200);
		var hullMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.4, roughness: 0.6 });
		var hull = new THREE.Mesh(hullGeom, hullMat);
		hull.position.set(0, 18, 0);
		hull.castShadow = true;
		hull.receiveShadow = true;
		scene.add(hull);
		environmentObjects.push(hull);

		var superstructureGeom = new THREE.BoxGeometry(20, 30, 40);
		var superMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.5 });
		var superstructure = new THREE.Mesh(superstructureGeom, superMat);
		superstructure.position.set(0, 75, -60);
		superstructure.castShadow = true;
		superstructure.receiveShadow = true;
		scene.add(superstructure);
		environmentObjects.push(superstructure);

		var bridgeGeom = new THREE.BoxGeometry(18, 20, 25);
		var bridgeMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });
		var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
		bridge.position.set(0, 110, -70);
		bridge.castShadow = true;
		bridge.receiveShadow = true;
		scene.add(bridge);
		environmentObjects.push(bridge);
	}

	function buildGantryCranes() {
		function buildCrane(xPos) {
			var towerGeom = new THREE.BoxGeometry(8, 180, 8);
			var towerMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.2 });
			var tower = new THREE.Mesh(towerGeom, towerMat);
			tower.position.set(xPos, 90, -80);
			tower.castShadow = true;
			tower.receiveShadow = true;
			scene.add(tower);
			environmentObjects.push(tower);

			var beamGeom = new THREE.BoxGeometry(120, 6, 8);
			var beamMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
			var beam = new THREE.Mesh(beamGeom, beamMat);
			beam.position.set(xPos, 175, -80);
			beam.castShadow = true;
			beam.receiveShadow = true;
			scene.add(beam);
			environmentObjects.push(beam);

			var cableGeom = new THREE.BufferGeometry();
			var cablePoints = [
				new THREE.Vector3(xPos - 50, 170, -80),
				new THREE.Vector3(xPos - 50, 30, -80)
			];
			cableGeom.setFromPoints(cablePoints);
			var cableMat = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 2 });
			var cable = new THREE.LineSegments(cableGeom, cableMat);
			scene.add(cable);
			environmentObjects.push(cable);

			var hookGeom = new THREE.BoxGeometry(4, 8, 4);
			var hookMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.9, roughness: 0.1 });
			var hook = new THREE.Mesh(hookGeom, hookMat);
			hook.position.set(xPos - 50, 25, -80);
			hook.castShadow = true;
			hook.receiveShadow = true;
			scene.add(hook);
			environmentObjects.push(hook);
		}

		buildCrane(-80);
		buildCrane(80);
	}

	function buildWeldingSparks() {
		function createSparkCluster(x, y, z) {
			var sparkGeom = new THREE.SphereGeometry(0.3, 8, 8);
			var sparkMat = new THREE.MeshBasicMaterial({ color: 0xffff00, emissive: 0xffaa00 });
			var spark = new THREE.Mesh(sparkGeom, sparkMat);
			spark.position.set(x, y, z);
			spark.velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 8,
				Math.random() * 5 - 2,
				(Math.random() - 0.5) * 8
			);
			spark.lifetime = Math.random() * 0.5 + 0.3;
			spark.age = 0;
			scene.add(spark);
			sparks.push(spark);
		}

		createSparkCluster(10, 50, 40);
		createSparkCluster(-8, 65, -30);
		createSparkCluster(5, 80, -50);
	}

	function buildPropellerShaft() {
		var shaftGeom = new THREE.CylinderGeometry(12, 12, 150, 32);
		var shaftMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.1 });
		var shaft = new THREE.Mesh(shaftGeom, shaftMat);
		shaft.rotation.z = Math.PI / 2;
		shaft.position.set(0, 5, 120);
		shaft.castShadow = true;
		shaft.receiveShadow = true;
		scene.add(shaft);
		environmentObjects.push(shaft);

		var propGeom = new THREE.BoxGeometry(50, 4, 4);
		var propMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.85, roughness: 0.15 });
		var prop = new THREE.Mesh(propGeom, propMat);
		prop.position.set(0, 5, 180);
		prop.castShadow = true;
		prop.receiveShadow = true;
		scene.add(prop);
		environmentObjects.push(prop);
	}

	function buildHarborDock() {
		var dockGeom = new THREE.BoxGeometry(250, 3, 180);
		var dockMat = new THREE.MeshStandardMaterial({ color: 0x664433, metalness: 0.3, roughness: 0.7 });
		var dock = new THREE.Mesh(dockGeom, dockMat);
		dock.position.set(0, 0, 0);
		dock.castShadow = true;
		dock.receiveShadow = true;
		scene.add(dock);
		environmentObjects.push(dock);

		var waterGeom = new THREE.BoxGeometry(300, 40, 250);
		var waterMat = new THREE.MeshStandardMaterial({ color: 0x1a5c7a, metalness: 0.2, roughness: 0.6, transparent: true, opacity: 0.6 });
		var water = new THREE.Mesh(waterGeom, waterMat);
		water.position.set(0, -20, 0);
		water.receiveShadow = true;
		scene.add(water);
		environmentObjects.push(water);
	}

	function buildAmmunitionCrane() {
		var armGeom = new THREE.BoxGeometry(60, 4, 4);
		var armMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
		var arm = new THREE.Mesh(armGeom, armMat);
		arm.position.set(120, 40, -100);
		arm.castShadow = true;
		arm.receiveShadow = true;
		scene.add(arm);
		environmentObjects.push(arm);

		var winchGeom = new THREE.CylinderGeometry(6, 6, 12, 24);
		var winchMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 });
		var winch = new THREE.Mesh(winchGeom, winchMat);
		winch.rotation.z = Math.PI / 2;
		winch.position.set(150, 40, -100);
		winch.castShadow = true;
		winch.receiveShadow = true;
		scene.add(winch);
		environmentObjects.push(winch);
	}

	function buildWarehouse() {
		var warehouseGeom = new THREE.BoxGeometry(80, 50, 100);
		var warehouseMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, metalness: 0.4, roughness: 0.6 });
		var warehouse = new THREE.Mesh(warehouseGeom, warehouseMat);
		warehouse.position.set(-140, 25, 80);
		warehouse.castShadow = true;
		warehouse.receiveShadow = true;
		scene.add(warehouse);
		environmentObjects.push(warehouse);

		var roofGeom = new THREE.ConeGeometry(50, 20, 4);
		var roofMat = new THREE.MeshStandardMaterial({ color: 0x663333, metalness: 0.3, roughness: 0.7 });
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.set(-140, 60, 80);
		roof.castShadow = true;
		roof.receiveShadow = true;
		scene.add(roof);
		environmentObjects.push(roof);
	}

	function buildTorpedoRacks() {
		function createRack(xPos) {
			var rackFrameGeom = new THREE.BoxGeometry(10, 60, 50);
			var rackFrameMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 });
			var rackFrame = new THREE.Mesh(rackFrameGeom, rackFrameMat);
			rackFrame.position.set(xPos, 30, 150);
			rackFrame.castShadow = true;
			rackFrame.receiveShadow = true;
			scene.add(rackFrame);
			environmentObjects.push(rackFrame);

			for (var i = 0; i < 4; i++) {
				var torpedoGeom = new THREE.CylinderGeometry(2, 2, 35, 16);
				var torpedoMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.85, roughness: 0.15 });
				var torpedo = new THREE.Mesh(torpedoGeom, torpedoMat);
				torpedo.rotation.z = Math.PI / 2;
				torpedo.position.set(xPos, 15 + i * 12, 150);
				torpedo.castShadow = true;
				torpedo.receiveShadow = true;
				scene.add(torpedo);
				environmentObjects.push(torpedo);
			}
		}

		createRack(-120);
		createRack(-50);
		createRack(50);
	}

	function update(delta) {
		for (var i = sparks.length - 1; i >= 0; i--) {
			var spark = sparks[i];
			spark.age += delta;

			spark.position.add(spark.velocity.clone().multiplyScalar(delta));
			spark.velocity.y -= 15 * delta;

			var alpha = 1 - (spark.age / spark.lifetime);
			spark.material.opacity = alpha;

			if (spark.age >= spark.lifetime) {
				scene.remove(spark);
				sparks.splice(i, 1);
			}
		}
	}

	function reset() {
		for (var i = environmentObjects.length - 1; i >= 0; i--) {
			scene.remove(environmentObjects[i]);
		}
		for (var j = sparks.length - 1; j >= 0; j--) {
			scene.remove(sparks[j]);
		}
		environmentObjects = [];
		sparks = [];
		weldParticles = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};

}());
