window.MethilDock = (function() {
	'use strict';

	var objects = [];
	var lights = [];

	function createDockBasinWalls(scene) {
		var wallGeometry = new THREE.BoxGeometry(2, 5, 30);
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

		var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
		wall1.position.set(-16, 2.5, 0);
		scene.add(wall1);
		objects.push(wall1);

		var wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
		wall2.position.set(16, 2.5, 0);
		scene.add(wall2);
		objects.push(wall2);

		var wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
		wall3.position.set(0, 2.5, -15);
		wall3.rotation.y = Math.PI / 2;
		scene.add(wall3);
		objects.push(wall3);

		var wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
		wall4.position.set(0, 2.5, 15);
		wall4.rotation.y = Math.PI / 2;
		scene.add(wall4);
		objects.push(wall4);
	}

	function createCoalConveyorStaithe(scene) {
		var staitheGeometry = new THREE.BoxGeometry(30, 10, 4);
		var staitheMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var staithe = new THREE.Mesh(staitheGeometry, staitheMaterial);
		staithe.position.set(0, 5, -18);
		scene.add(staithe);
		objects.push(staithe);

		var armGeometry = new THREE.BoxGeometry(20, 2, 2);
		var armMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var arm = new THREE.Mesh(armGeometry, armMaterial);
		arm.position.set(0, 11, -18);
		arm.userData.rotationSpeed = 0.5;
		scene.add(arm);
		objects.push(arm);
	}

	function createCoalHopperSilos(scene) {
		var siloGeometry = new THREE.CylinderGeometry(3, 3, 10, 16);
		var siloMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

		var positions = [
			[-10, 5, -8],
			[-10, 5, 0],
			[10, 5, -8],
			[10, 5, 0]
		];

		var i;
		for (i = 0; i < positions.length; i = i + 1) {
			var silo = new THREE.Mesh(siloGeometry, siloMaterial);
			silo.position.set(positions[i][0], positions[i][1], positions[i][2]);
			scene.add(silo);
			objects.push(silo);
		}
	}

	function createPowerStation(scene) {
		var stationGeometry = new THREE.BoxGeometry(30, 14, 20);
		var stationMaterial = new THREE.MeshLambertMaterial({ color: 0x667788 });
		var station = new THREE.Mesh(stationGeometry, stationMaterial);
		station.position.set(0, 7, 25);
		scene.add(station);
		objects.push(station);

		var chimneyGeometry = new THREE.CylinderGeometry(2, 2, 25, 16);
		var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		var chimney1 = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
		chimney1.position.set(-8, 25, 25);
		scene.add(chimney1);
		objects.push(chimney1);

		var chimney2 = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
		chimney2.position.set(8, 25, 25);
		scene.add(chimney2);
		objects.push(chimney2);
	}

	function createCargoShip(scene) {
		var hullGeometry = new THREE.BoxGeometry(24, 5, 8);
		var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var hull = new THREE.Mesh(hullGeometry, hullMaterial);
		hull.position.set(0, 4, -8);
		scene.add(hull);
		objects.push(hull);

		var superGeometry = new THREE.BoxGeometry(12, 6, 6);
		var superMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var superstructure = new THREE.Mesh(superGeometry, superMaterial);
		superstructure.position.set(-6, 9, -8);
		scene.add(superstructure);
		objects.push(superstructure);

		var mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
		var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });

		var mast1 = new THREE.Mesh(mastGeometry, mastMaterial);
		mast1.position.set(-10, 12, -8);
		scene.add(mast1);
		objects.push(mast1);

		var mast2 = new THREE.Mesh(mastGeometry, mastMaterial);
		mast2.position.set(-2, 12, -8);
		scene.add(mast2);
		objects.push(mast2);
	}

	function createSecurityFence(scene) {
		var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
		var postMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });

		var postPositions = [
			[-20, 2, -20],
			[-20, 2, 20],
			[20, 2, -20],
			[20, 2, 20],
			[-20, 2, 0],
			[20, 2, 0],
			[0, 2, -20],
			[0, 2, 20]
		];

		var i;
		for (i = 0; i < postPositions.length; i = i + 1) {
			var post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(postPositions[i][0], postPositions[i][1], postPositions[i][2]);
			scene.add(post);
			objects.push(post);
		}

		var wireMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });

		var points1 = [];
		points1.push(new THREE.Vector3(-20, 3, -20));
		points1.push(new THREE.Vector3(20, 3, -20));
		var geometry1 = new THREE.BufferGeometry().setFromPoints(points1);
		var wire1 = new THREE.LineSegments(geometry1, wireMaterial);
		scene.add(wire1);
		objects.push(wire1);

		var points2 = [];
		points2.push(new THREE.Vector3(-20, 3, 20));
		points2.push(new THREE.Vector3(20, 3, 20));
		var geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
		var wire2 = new THREE.LineSegments(geometry2, wireMaterial);
		scene.add(wire2);
		objects.push(wire2);

		var points3 = [];
		points3.push(new THREE.Vector3(-20, 3, -20));
		points3.push(new THREE.Vector3(-20, 3, 20));
		var geometry3 = new THREE.BufferGeometry().setFromPoints(points3);
		var wire3 = new THREE.LineSegments(geometry3, wireMaterial);
		scene.add(wire3);
		objects.push(wire3);

		var points4 = [];
		points4.push(new THREE.Vector3(20, 3, -20));
		points4.push(new THREE.Vector3(20, 3, 20));
		var geometry4 = new THREE.BufferGeometry().setFromPoints(points4);
		var wire4 = new THREE.LineSegments(geometry4, wireMaterial);
		scene.add(wire4);
		objects.push(wire4);
	}

	function createNavalMineStore(scene) {
		var storeGeometry = new THREE.BoxGeometry(8, 4, 6);
		var storeMaterial = new THREE.MeshLambertMaterial({ color: 0x778877 });
		var store = new THREE.Mesh(storeGeometry, storeMaterial);
		store.position.set(-15, 2, 10);
		scene.add(store);
		objects.push(store);
	}

	function createTugBoat(scene) {
		var tugGeometry = new THREE.BoxGeometry(8, 2.5, 3);
		var tugMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
		var tug = new THREE.Mesh(tugGeometry, tugMaterial);
		tug.position.set(5, 2, -12);
		tug.userData.bobSpeed = 0.8;
		tug.userData.bobAmount = 0.5;
		tug.userData.baseY = 2;
		scene.add(tug);
		objects.push(tug);
	}

	function createAmbientLight(scene) {
		var ambient = new THREE.AmbientLight(0x7788AA, 0.5);
		scene.add(ambient);
		lights.push(ambient);
	}

	function createFloodlights(scene) {
		var positions = [
			[-15, 20, -15],
			[15, 20, -15],
			[-15, 20, 15],
			[15, 20, 15]
		];

		var i;
		for (i = 0; i < positions.length; i = i + 1) {
			var light = new THREE.PointLight(0xFFDD00, 1.3, 100);
			light.position.set(positions[i][0], positions[i][1], positions[i][2]);
			scene.add(light);
			lights.push(light);
		}
	}

	function update(delta) {
		var i;
		for (i = 0; i < objects.length; i = i + 1) {
			var obj = objects[i];

			if (obj.userData.rotationSpeed) {
				obj.rotation.z = obj.rotation.z + (obj.userData.rotationSpeed * delta);
			}

			if (obj.userData.bobSpeed && obj.userData.baseY !== undefined) {
				var time = Date.now() * 0.001;
				obj.position.y = obj.userData.baseY + Math.sin(time * obj.userData.bobSpeed) * obj.userData.bobAmount;
			}
		}
	}

	function reset(scene) {
		var i;
		for (i = objects.length - 1; i >= 0; i = i - 1) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (i = lights.length - 1; i >= 0; i = i - 1) {
			scene.remove(lights[i]);
		}
		lights = [];
	}

	function init(scene) {
		createDockBasinWalls(scene);
		createCoalConveyorStaithe(scene);
		createCoalHopperSilos(scene);
		createPowerStation(scene);
		createCargoShip(scene);
		createSecurityFence(scene);
		createNavalMineStore(scene);
		createTugBoat(scene);
		createAmbientLight(scene);
		createFloodlights(scene);
	}

	return {
		init: init,
		update: update,
		reset: reset,
		objects: objects,
		lights: lights
	};
}());
