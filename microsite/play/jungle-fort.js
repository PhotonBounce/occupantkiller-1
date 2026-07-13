window.JungleFort = (function() {
	'use strict';

	var objects = [];
	var vines = [];
	var campfire = null;
	var campfireIntensity = 0;
	var campfireDirection = 1;
	var scene = null;

	function buildPalisadeWalls() {
		var geometry = new THREE.BoxGeometry(2, 8, 0.3);
		var material = new THREE.MeshPhongMaterial({ color: 0x654321 });

		var positions = [
			[-15, 0, -15], [15, 0, -15],
			[15, 0, -15], [15, 0, 15],
			[15, 0, 15], [-15, 0, 15],
			[-15, 0, 15], [-15, 0, -15]
		];

		for (var i = 0; i < positions.length; i++) {
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
			scene.add(mesh);
			objects.push(mesh);
		}
	}

	function buildWatchtowers() {
		var cylinderGeometry = new THREE.CylinderGeometry(2.5, 2.5, 12, 8);
		var cylinderMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });

		var towerPositions = [[-12, 0, -12], [12, 0, -12], [12, 0, 12], [-12, 0, 12]];

		for (var i = 0; i < towerPositions.length; i++) {
			var tower = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
			tower.position.set(towerPositions[i][0], towerPositions[i][1], towerPositions[i][2]);
			scene.add(tower);
			objects.push(tower);

			var roofGeometry = new THREE.ConeGeometry(3.5, 3, 8);
			var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x2F4F2F });
			var roof = new THREE.Mesh(roofGeometry, roofMaterial);
			roof.position.set(towerPositions[i][0], 8, towerPositions[i][2]);
			scene.add(roof);
			objects.push(roof);
		}
	}

	function buildRopeBridges() {
		var linePoints = [];

		linePoints.push(new THREE.Vector3(-12, 8, -12));
		linePoints.push(new THREE.Vector3(0, 6, 0));
		linePoints.push(new THREE.Vector3(12, 8, -12));

		linePoints.push(new THREE.Vector3(12, 8, -12));
		linePoints.push(new THREE.Vector3(0, 6, 0));
		linePoints.push(new THREE.Vector3(12, 8, 12));

		linePoints.push(new THREE.Vector3(12, 8, 12));
		linePoints.push(new THREE.Vector3(0, 6, 0));
		linePoints.push(new THREE.Vector3(-12, 8, 12));

		linePoints.push(new THREE.Vector3(-12, 8, 12));
		linePoints.push(new THREE.Vector3(0, 6, 0));
		linePoints.push(new THREE.Vector3(-12, 8, -12));

		var geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
		var material = new THREE.LineBasicMaterial({ color: 0xA0522D, linewidth: 3 });
		var bridges = new THREE.LineSegments(geometry, material);
		scene.add(bridges);
		objects.push(bridges);
	}

	function buildVines() {
		for (var i = 0; i < 20; i++) {
			var vinePoints = [];
			var x = (Math.random() - 0.5) * 40;
			var z = (Math.random() - 0.5) * 40;

			vinePoints.push(new THREE.Vector3(x, 15, z));
			for (var j = 0; j < 8; j++) {
				var offsetX = (Math.random() - 0.5) * 2;
				var offsetZ = (Math.random() - 0.5) * 2;
				vinePoints.push(new THREE.Vector3(x + offsetX, 15 - j * 2, z + offsetZ));
			}

			var geometry = new THREE.BufferGeometry().setFromPoints(vinePoints);
			var material = new THREE.LineBasicMaterial({ color: 0x228B22, linewidth: 2 });
			var vine = new THREE.LineSegments(geometry, material);
			scene.add(vine);
			vines.push(vine);
			objects.push(vine);
		}
	}

	function buildCamouflageSandbags() {
		var geometry = new THREE.BoxGeometry(1.5, 1, 1.5);
		var material = new THREE.MeshPhongMaterial({ color: 0x8B7355, wireframe: false });

		var positions = [
			[-10, 0.5, -8], [-8, 0.5, -8], [-6, 0.5, -8],
			[8, 0.5, -8], [10, 0.5, -8], [6, 0.5, -8],
			[8, 0.5, 8], [10, 0.5, 8], [6, 0.5, 8]
		];

		for (var i = 0; i < positions.length; i++) {
			var sandbag = new THREE.Mesh(geometry, material);
			sandbag.position.set(positions[i][0], positions[i][1], positions[i][2]);
			scene.add(sandbag);
			objects.push(sandbag);
		}
	}

	function buildCampfire() {
		var fireGeometry = new THREE.SphereGeometry(1.5, 8, 8);
		var fireMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4500, emissive: 0xFF6347 });
		campfire = new THREE.Mesh(fireGeometry, fireMaterial);
		campfire.position.set(0, 0.5, 0);
		scene.add(campfire);
		objects.push(campfire);

		var logGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 6);
		var logMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

		var log1 = new THREE.Mesh(logGeometry, logMaterial);
		log1.rotation.z = Math.PI / 4;
		log1.position.set(0, 0.3, 0);
		scene.add(log1);
		objects.push(log1);

		var log2 = new THREE.Mesh(logGeometry, logMaterial);
		log2.rotation.z = -Math.PI / 4;
		log2.position.set(0, 0.3, 0);
		scene.add(log2);
		objects.push(log2);
	}

	function buildSkullTraps() {
		var skullGeometry = new THREE.SphereGeometry(0.8, 8, 8);
		var skullMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFAFA });

		var trapPositions = [[-14, 0.8, 5], [14, 0.8, -6], [5, 0.8, 14], [-6, 0.8, -13]];

		for (var i = 0; i < trapPositions.length; i++) {
			var skull = new THREE.Mesh(skullGeometry, skullMaterial);
			skull.position.set(trapPositions[i][0], trapPositions[i][1], trapPositions[i][2]);
			scene.add(skull);
			objects.push(skull);

			var eyeGeometry = new THREE.SphereGeometry(0.2, 4, 4);
			var eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
			var eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
			eye1.position.set(trapPositions[i][0] - 0.25, trapPositions[i][1] + 0.1, trapPositions[i][2] + 0.6);
			scene.add(eye1);
			objects.push(eye1);

			var eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
			eye2.position.set(trapPositions[i][0] + 0.25, trapPositions[i][1] + 0.1, trapPositions[i][2] + 0.6);
			scene.add(eye2);
			objects.push(eye2);
		}
	}

	function buildGround() {
		var groundGeometry = new THREE.BoxGeometry(50, 0.5, 50);
		var groundMaterial = new THREE.MeshPhongMaterial({ color: 0x2F4F2F });
		var ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.position.y = -0.25;
		scene.add(ground);
		objects.push(ground);
	}

	function init(sceneParam, camera) {
		scene = sceneParam;
		objects = [];
		vines = [];
		campfireIntensity = 0;
		campfireDirection = 1;

		buildGround();
		buildPalisadeWalls();
		buildWatchtowers();
		buildRopeBridges();
		buildVines();
		buildCamouflageSandbags();
		buildCampfire();
		buildSkullTraps();

		scene.fog = new THREE.Fog(0x1a1a1a, 80, 200);
		scene.background = new THREE.Color(0x0d5c0f);

		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
		directionalLight.position.set(20, 30, 20);
		scene.add(directionalLight);
	}

	function update(delta) {
		campfireIntensity += campfireDirection * delta * 2;

		if (campfireIntensity > 1.5) {
			campfireDirection = -1;
		}
		if (campfireIntensity < 0.5) {
			campfireDirection = 1;
		}

		if (campfire) {
			campfire.material.emissiveIntensity = campfireIntensity * 0.8;
			campfire.scale.x = 1 + Math.sin(campfireIntensity * 2) * 0.1;
			campfire.scale.y = 1 + Math.cos(campfireIntensity * 2) * 0.1;
			campfire.scale.z = 1 + Math.sin(campfireIntensity * 3) * 0.1;
		}

		for (var i = 0; i < vines.length; i++) {
			var vine = vines[i];
			vine.rotation.z += Math.sin(Date.now() * 0.001 + i) * 0.001;
			vine.position.x += Math.cos(Date.now() * 0.0005 + i) * 0.001;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];
		vines = [];
		campfire = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
