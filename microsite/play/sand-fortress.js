window.SandFortress = (function() {
	'use strict';

	var scene = null;
	var meshes = [];
	var particles = [];
	var flags = [];
	var sandGroup = null;

	function init(sceneRef, camera) {
		scene = sceneRef;
		meshes = [];
		particles = [];
		flags = [];

		var groundMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.9 });
		var wallMat = new THREE.MeshStandardMaterial({ color: 0xa0826d, roughness: 0.8 });
		var stoneMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.85 });
		var woodMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });
		var metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });

		var ground = new THREE.Mesh(new THREE.BoxGeometry(200, 2, 200), groundMat);
		ground.position.y = -5;
		ground.castShadow = true;
		ground.receiveShadow = true;
		scene.add(ground);
		meshes.push(ground);

		buildPerimeterWalls(wallMat);
		buildCornerTowers(stoneMat);
		buildCommandPost(wallMat, woodMat, metalMat);
		buildRockFormations(stoneMat);
		buildCamelPens(wallMat);
		buildTunnelEntrances(woodMat);
		buildWindMills(woodMat, metalMat);
		createSandParticles();
		createFlags(metalMat);

		var light = new THREE.DirectionalLight(0xffffff, 1.2);
		light.position.set(60, 80, 40);
		light.castShadow = true;
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;
		light.shadow.camera.left = -150;
		light.shadow.camera.right = 150;
		light.shadow.camera.top = 150;
		light.shadow.camera.bottom = -150;
		scene.add(light);

		var ambientLight = new THREE.AmbientLight(0xffd99b, 0.5);
		scene.add(ambientLight);
	}

	function buildPerimeterWalls(wallMat) {
		var wallHeight = 12;
		var wallThickness = 1.5;
		var fortressSize = 70;

		var northWall = new THREE.Mesh(new THREE.BoxGeometry(fortressSize, wallHeight, wallThickness), wallMat);
		northWall.position.set(0, wallHeight / 2, -fortressSize / 2);
		northWall.castShadow = true;
		northWall.receiveShadow = true;
		scene.add(northWall);
		meshes.push(northWall);

		var southWall = new THREE.Mesh(new THREE.BoxGeometry(fortressSize, wallHeight, wallThickness), wallMat);
		southWall.position.set(0, wallHeight / 2, fortressSize / 2);
		southWall.castShadow = true;
		southWall.receiveShadow = true;
		scene.add(southWall);
		meshes.push(southWall);

		var eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, fortressSize), wallMat);
		eastWall.position.set(fortressSize / 2, wallHeight / 2, 0);
		eastWall.castShadow = true;
		eastWall.receiveShadow = true;
		scene.add(eastWall);
		meshes.push(eastWall);

		var westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, fortressSize), wallMat);
		westWall.position.set(-fortressSize / 2, wallHeight / 2, 0);
		westWall.castShadow = true;
		westWall.receiveShadow = true;
		scene.add(westWall);
		meshes.push(westWall);
	}

	function buildCornerTowers(stoneMat) {
		var corners = [
			{ x: 30, z: -30 },
			{ x: -30, z: -30 },
			{ x: 30, z: 30 },
			{ x: -30, z: 30 }
		];

		corners.forEach(function(corner) {
			var tower = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 18, 16), stoneMat);
			tower.position.set(corner.x, 9, corner.z);
			tower.castShadow = true;
			tower.receiveShadow = true;
			scene.add(tower);
			meshes.push(tower);

			var cap = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2, 16), stoneMat);
			cap.position.set(corner.x, 19, corner.z);
			cap.castShadow = true;
			scene.add(cap);
			meshes.push(cap);
		});
	}

	function buildCommandPost(wallMat, woodMat, metalMat) {
		var mainStructure = new THREE.Mesh(new THREE.BoxGeometry(20, 14, 16), wallMat);
		mainStructure.position.set(0, 7, 0);
		mainStructure.castShadow = true;
		mainStructure.receiveShadow = true;
		scene.add(mainStructure);
		meshes.push(mainStructure);

		var flagpole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 8), metalMat);
		flagpole1.position.set(-5, 18, -3);
		scene.add(flagpole1);
		meshes.push(flagpole1);

		var flagpole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 8), metalMat);
		flagpole2.position.set(5, 18, -3);
		scene.add(flagpole2);
		meshes.push(flagpole2);

		var roofBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 22, 6), woodMat);
		roofBeam.rotation.z = Math.PI / 2;
		roofBeam.position.set(0, 15, 0);
		roofBeam.castShadow = true;
		scene.add(roofBeam);
		meshes.push(roofBeam);
	}

	function buildRockFormations(stoneMat) {
		var formations = [
			{ x: -25, z: -15, size: 8 },
			{ x: 20, z: 25, size: 7 },
			{ x: -40, z: 10, size: 9 },
			{ x: 35, z: -20, size: 6.5 }
		];

		formations.forEach(function(form) {
			var rock1 = new THREE.Mesh(new THREE.SphereGeometry(form.size / 2, 8, 8), stoneMat);
			rock1.position.set(form.x, form.size / 2 - 1, form.z);
			rock1.castShadow = true;
			rock1.receiveShadow = true;
			rock1.scale.y = 0.7;
			scene.add(rock1);
			meshes.push(rock1);

			var rock2 = new THREE.Mesh(new THREE.SphereGeometry(form.size / 3, 7, 7), stoneMat);
			rock2.position.set(form.x + 3, form.size / 3 - 1, form.z + 4);
			rock2.castShadow = true;
			rock2.receiveShadow = true;
			scene.add(rock2);
			meshes.push(rock2);
		});
	}

	function buildCamelPens(wallMat) {
		var penPositions = [
			{ x: -18, z: 20 },
			{ x: 18, z: 20 }
		];

		penPositions.forEach(function(pos) {
			var penWall1 = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.8), wallMat);
			penWall1.position.set(pos.x, 2, pos.z);
			penWall1.castShadow = true;
			scene.add(penWall1);
			meshes.push(penWall1);

			var penWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 10), wallMat);
			penWall2.position.set(pos.x - 5, 2, pos.z + 5);
			penWall2.castShadow = true;
			scene.add(penWall2);
			meshes.push(penWall2);

			var penWall3 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 10), wallMat);
			penWall3.position.set(pos.x + 5, 2, pos.z + 5);
			penWall3.castShadow = true;
			scene.add(penWall3);
			meshes.push(penWall3);
		});
	}

	function buildTunnelEntrances(woodMat) {
		var tunnels = [
			{ x: -15, z: -25 },
			{ x: 15, z: -25 }
		];

		tunnels.forEach(function(tunnel) {
			var trapdoor = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 4), woodMat);
			trapdoor.position.set(tunnel.x, 0.1, tunnel.z);
			trapdoor.castShadow = true;
			scene.add(trapdoor);
			meshes.push(trapdoor);

			var frame1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.5, 0.3), woodMat);
			frame1.position.set(tunnel.x, 1.2, tunnel.z - 2.5);
			scene.add(frame1);
			meshes.push(frame1);

			var frame2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 4), woodMat);
			frame2.position.set(tunnel.x - 2.4, 1.2, tunnel.z);
			scene.add(frame2);
			meshes.push(frame2);
		});
	}

	function buildWindMills(woodMat, metalMat) {
		var mills = [
			{ x: 28, z: -28 },
			{ x: -28, z: 28 }
		];

		mills.forEach(function(mill) {
			var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 20, 8), metalMat);
			pole.position.set(mill.x, 10, mill.z);
			scene.add(pole);
			meshes.push(pole);

			var blade1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 0.2), woodMat);
			blade1.position.set(mill.x, 18, mill.z);
			scene.add(blade1);
			meshes.push(blade1);

			var blade2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 0.2), woodMat);
			blade2.position.set(mill.x, 18, mill.z);
			blade2.rotation.z = Math.PI / 2;
			scene.add(blade2);
			meshes.push(blade2);
		});
	}

	function createSandParticles() {
		sandGroup = new THREE.Group();
		scene.add(sandGroup);

		for (var i = 0; i < 80; i++) {
			var particleMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.95 });
			var particle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), particleMat);
			particle.position.set(
				Math.random() * 100 - 50,
				Math.random() * 30,
				Math.random() * 100 - 50
			);
			particle.castShadow = true;
			particle.userData = {
				vx: (Math.random() - 0.5) * 0.15,
				vy: -0.08 + Math.random() * 0.05,
				vz: (Math.random() - 0.5) * 0.15,
				life: Math.random() * 0.5 + 0.3
			};
			sandGroup.add(particle);
			particles.push(particle);
		}
	}

	function createFlags(metalMat) {
		var flagPositions = [
			{ x: -5, z: -3 },
			{ x: 5, z: -3 }
		];

		flagPositions.forEach(function(pos) {
			var flagGroup = new THREE.Group();
			flagGroup.position.set(pos.x, 16, pos.z);

			var flag = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.1), metalMat);
			flag.userData = {
				baseX: pos.x,
				offset: Math.random() * Math.PI
			};
			flagGroup.add(flag);
			scene.add(flagGroup);
			flags.push(flagGroup);
			meshes.push(flag);
		});
	}

	function update(delta) {
		particles.forEach(function(particle) {
			particle.position.x += particle.userData.vx;
			particle.position.y += particle.userData.vy;
			particle.position.z += particle.userData.vz;

			if (particle.position.y < -10) {
				particle.position.y = 35;
			}
		});

		flags.forEach(function(flagGroup) {
			var flag = flagGroup.children[0];
			var time = Date.now() * 0.001;
			flag.rotation.z = Math.sin(time + flag.userData.offset) * 0.3;
		});
	}

	function reset() {
		meshes.forEach(function(mesh) {
			scene.remove(mesh);
			mesh.geometry.dispose();
			mesh.material.dispose();
		});
		meshes = [];

		if (sandGroup) {
			particles.forEach(function(particle) {
				sandGroup.remove(particle);
				particle.geometry.dispose();
				particle.material.dispose();
			});
			scene.remove(sandGroup);
			particles = [];
			sandGroup = null;
		}

		flags.forEach(function(flagGroup) {
			scene.remove(flagGroup);
			flagGroup.traverse(function(child) {
				if (child.geometry) child.geometry.dispose();
				if (child.material) child.material.dispose();
			});
		});
		flags = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
