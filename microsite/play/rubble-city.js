window.RubbleCity = (function() {
	'use strict';

	var scene = null;
	var camera = null;

	var meshes = [];
	var lights = [];
	var animationState = {
		dustTime: 0,
		clockSwing: 0,
		rubbleShift: 0
	};

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		buildMainRubblePiles();
		buildConcreteSlabs();
		buildRebarSticks();
		buildGlassFragments();
		buildClockTower();
		buildSnipersNest();
		buildMetroEntrance();
		buildResistanceHideout();

		addLighting();
	}

	function buildMainRubblePiles() {
		var positions = [
			{ x: -40, y: 0, z: -60, scale: 3.5 },
			{ x: 50, y: 0, z: -80, scale: 4.0 },
			{ x: -60, y: 0, z: 30, scale: 3.2 },
			{ x: 70, y: 0, z: 50, scale: 3.8 },
			{ x: 0, y: 0, z: -30, scale: 2.5 }
		];

		var i = 0;
		while (i < positions.length) {
			var pos = positions[i];
			var geo = new THREE.BoxGeometry(pos.scale * 8, pos.scale * 6, pos.scale * 10);
			var mat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var mesh = new THREE.Mesh(geo, mat);
			mesh.position.set(pos.x, pos.y + pos.scale * 3, pos.z);
			mesh.rotation.z = Math.random() * 0.3;
			mesh.rotation.x = Math.random() * 0.2;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			meshes.push(mesh);
			i = i + 1;
		}
	}

	function buildConcreteSlabs() {
		var j = 0;
		while (j < 25) {
			var sizeX = 8 + Math.random() * 12;
			var sizeZ = 10 + Math.random() * 15;
			var sizeY = 1.5 + Math.random() * 1;
			var geo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
			var mat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
			var mesh = new THREE.Mesh(geo, mat);
			mesh.position.x = -80 + Math.random() * 160;
			mesh.position.y = 0.75 + Math.random() * 3;
			mesh.position.z = -100 + Math.random() * 200;
			mesh.rotation.y = Math.random() * Math.PI * 2;
			mesh.rotation.z = (Math.random() - 0.5) * 0.4;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			meshes.push(mesh);
			j = j + 1;
		}
	}

	function buildRebarSticks() {
		var k = 0;
		while (k < 30) {
			var height = 4 + Math.random() * 8;
			var geo = new THREE.CylinderGeometry(0.3, 0.3, height, 6);
			var mat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
			var mesh = new THREE.Mesh(geo, mat);
			mesh.position.x = -80 + Math.random() * 160;
			mesh.position.y = height / 2;
			mesh.position.z = -100 + Math.random() * 200;
			mesh.rotation.x = (Math.random() - 0.5) * 0.3;
			mesh.rotation.z = (Math.random() - 0.5) * 0.3;
			mesh.castShadow = true;
			scene.add(mesh);
			meshes.push(mesh);
			k = k + 1;
		}
	}

	function buildGlassFragments() {
		var m = 0;
		while (m < 40) {
			var glassSize = 0.4 + Math.random() * 0.6;
			var geo = new THREE.BoxGeometry(glassSize, glassSize, 0.05);
			var mat = new THREE.MeshLambertMaterial({ color: 0xccddee, emissive: 0x4488ff });
			var mesh = new THREE.Mesh(geo, mat);
			mesh.position.x = -70 + Math.random() * 140;
			mesh.position.y = 2 + Math.random() * 15;
			mesh.position.z = -90 + Math.random() * 180;
			mesh.rotation.x = Math.random() * Math.PI;
			mesh.rotation.y = Math.random() * Math.PI;
			mesh.rotation.z = Math.random() * Math.PI;
			mesh.castShadow = true;
			scene.add(mesh);
			meshes.push(mesh);
			m = m + 1;
		}
	}

	function buildClockTower() {
		var towerHeight = 25;
		var baseGeo = new THREE.CylinderGeometry(3, 3.5, towerHeight, 8);
		var mat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
		var towerMesh = new THREE.Mesh(baseGeo, mat);
		towerMesh.position.set(0, towerHeight / 2, 0);
		towerMesh.castShadow = true;
		towerMesh.receiveShadow = true;
		scene.add(towerMesh);
		meshes.push(towerMesh);

		var capGeo = new THREE.ConeGeometry(3.2, 4, 8);
		var capMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var capMesh = new THREE.Mesh(capGeo, capMat);
		capMesh.position.set(0, towerHeight + 2, 0);
		capMesh.castShadow = true;
		scene.add(capMesh);
		meshes.push(capMesh);

		var bellGeo = new THREE.SphereGeometry(1.5, 8, 8);
		var bellMat = new THREE.MeshLambertMaterial({ color: 0x8b7d6b });
		var bellMesh = new THREE.Mesh(bellGeo, bellMat);
		bellMesh.position.set(0, towerHeight - 2, 0);
		bellMesh.scale.y = 1.3;
		bellMesh.castShadow = true;
		bellMesh.userData = { isBell: true };
		scene.add(bellMesh);
		meshes.push(bellMesh);
	}

	function buildSnipersNest() {
		var nestX = 50;
		var nestZ = -80;
		var nestBaseGeo = new THREE.BoxGeometry(8, 3, 8);
		var nestMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var nestMesh = new THREE.Mesh(nestBaseGeo, nestMat);
		nestMesh.position.set(nestX, 20, nestZ);
		nestMesh.castShadow = true;
		nestMesh.receiveShadow = true;
		scene.add(nestMesh);
		meshes.push(nestMesh);

		var n = 0;
		while (n < 6) {
			var wallGeo = new THREE.BoxGeometry(0.8, 2, 4);
			var wallMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
			var wallMesh = new THREE.Mesh(wallGeo, wallMat);
			wallMesh.position.set(nestX - 3 + n * 1.2, 22.5, nestZ - 3);
			wallMesh.castShadow = true;
			scene.add(wallMesh);
			meshes.push(wallMesh);
			n = n + 1;
		}

		var scopeGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
		var scopeMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var scopeMesh = new THREE.Mesh(scopeGeo, scopeMat);
		scopeMesh.position.set(nestX, 23, nestZ);
		scopeMesh.rotation.z = Math.PI / 2;
		scopeMesh.castShadow = true;
		scene.add(scopeMesh);
		meshes.push(scopeMesh);
	}

	function buildMetroEntrance() {
		var metroX = -60;
		var metroZ = 30;
		var entranceGeo = new THREE.BoxGeometry(12, 8, 4);
		var entranceMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var entranceMesh = new THREE.Mesh(entranceGeo, entranceMat);
		entranceMesh.position.set(metroX, 4, metroZ);
		entranceMesh.castShadow = true;
		entranceMesh.receiveShadow = true;
		scene.add(entranceMesh);
		meshes.push(entranceMesh);

		var p = 0;
		while (p < 4) {
			var railGeo = new THREE.CylinderGeometry(0.4, 0.4, 12, 6);
			var railMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
			var railMesh = new THREE.Mesh(railGeo, railMat);
			railMesh.position.set(metroX - 4 + p * 3, 2, metroZ - 8);
			railMesh.rotation.z = Math.PI / 2;
			railMesh.castShadow = true;
			scene.add(railMesh);
			meshes.push(railMesh);
			p = p + 1;
		}
	}

	function buildResistanceHideout() {
		var hideX = 70;
		var hideZ = 50;
		var hideGeo = new THREE.BoxGeometry(10, 6, 10);
		var hideMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var hideMesh = new THREE.Mesh(hideGeo, hideMat);
		hideMesh.position.set(hideX, 3, hideZ);
		hideMesh.castShadow = true;
		hideMesh.receiveShadow = true;
		scene.add(hideMesh);
		meshes.push(hideMesh);

		var q = 0;
		while (q < 3) {
			var doorGeo = new THREE.BoxGeometry(2, 3, 0.5);
			var doorMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
			var doorMesh = new THREE.Mesh(doorGeo, doorMat);
			doorMesh.position.set(hideX - 3 + q * 3, 1.5, hideZ + 5.2);
			doorMesh.castShadow = true;
			scene.add(doorMesh);
			meshes.push(doorMesh);
			q = q + 1;
		}

		var antennaeGeo = new THREE.CylinderGeometry(0.2, 0.2, 6, 5);
		var antennaMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var antennaMesh = new THREE.Mesh(antennaeGeo, antennaMat);
		antennaMesh.position.set(hideX + 4, 8, hideZ);
		antennaMesh.castShadow = true;
		scene.add(antennaMesh);
		meshes.push(antennaMesh);
	}

	function addLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(40, 50, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		directionalLight.shadow.camera.far = 200;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var hemisphereLighting = new THREE.HemisphereLight(0xccccff, 0x886644, 0.4);
		scene.add(hemisphereLighting);
		lights.push(hemisphereLighting);

		var r = 0;
		while (r < 4) {
			var pointLight = new THREE.PointLight(0xff6644, 0.3, 40);
			pointLight.position.set(-70 + r * 50, 8, -80 + r * 40);
			scene.add(pointLight);
			lights.push(pointLight);
			r = r + 1;
		}
	}

	function update(delta) {
		animationState.dustTime = animationState.dustTime + delta;
		animationState.clockSwing = animationState.clockSwing + delta;
		animationState.rubbleShift = animationState.rubbleShift + delta;

		updateDustClouds(delta);
		updateClockBell(delta);
		updateRubbleSettling(delta);
	}

	function updateDustClouds(delta) {
		var dustCycleTime = 3.0;
		var dustPhase = (animationState.dustTime % dustCycleTime) / dustCycleTime;
		var dustIntensity = Math.sin(dustPhase * Math.PI) * 0.3;

		var s = 0;
		while (s < meshes.length) {
			var mesh = meshes[s];
			if (mesh.position.y > 5 && mesh.position.y < 12) {
				if (mesh.userData) {
					if (!mesh.userData.originalY) {
						mesh.userData.originalY = mesh.position.y;
					}
					mesh.position.y = mesh.userData.originalY + dustIntensity * 2;
				}
			}
			s = s + 1;
		}
	}

	function updateClockBell(delta) {
		var swingSpeed = 2.0;
		var swingAmount = Math.sin(animationState.clockSwing * swingSpeed) * 0.3;

		var t = 0;
		while (t < meshes.length) {
			var mesh = meshes[t];
			if (mesh.userData && mesh.userData.isBell) {
				mesh.rotation.z = swingAmount;
			}
			t = t + 1;
		}
	}

	function updateRubbleSettling(delta) {
		var settleFrequency = 2.5;
		var settleAmount = Math.sin(animationState.rubbleShift * settleFrequency * 0.5) * 0.1;

		var u = 0;
		while (u < meshes.length) {
			var mesh = meshes[u];
			var geo = mesh.geometry;
			if (geo instanceof THREE.BoxGeometry) {
				if (mesh.position.y < 5) {
					if (!mesh.userData.baseY) {
						mesh.userData.baseY = mesh.position.y;
					}
					mesh.position.y = mesh.userData.baseY + settleAmount;
				}
			}
			u = u + 1;
		}
	}

	function reset() {
		var v = meshes.length - 1;
		while (v >= 0) {
			var mesh = meshes[v];
			scene.remove(mesh);
			if (mesh.geometry) {
				mesh.geometry.dispose();
			}
			if (mesh.material) {
				mesh.material.dispose();
			}
			v = v - 1;
		}
		meshes = [];

		var w = lights.length - 1;
		while (w >= 0) {
			scene.remove(lights[w]);
			w = w - 1;
		}
		lights = [];

		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
