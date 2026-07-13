window.PlagueTower = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var particles = [];

	function createGuard(x, y, z) {
		var group = new THREE.Group();

		// Mannequin body - box
		var bodyGeom = new THREE.BoxGeometry(0.4, 1.2, 0.3);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.set(0, 0.4, 0);
		body.castShadow = true;
		group.add(body);

		// Head - sphere
		var headGeom = new THREE.SphereGeometry(0.3, 8, 8);
		var headMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
		var head = new THREE.Mesh(headGeom, headMat);
		head.position.set(0, 1.2, 0);
		head.castShadow = true;
		group.add(head);

		// Beak - cone
		var beakGeom = new THREE.ConeGeometry(0.15, 0.5, 8);
		var beakMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d });
		var beak = new THREE.Mesh(beakGeom, beakMat);
		beak.position.set(0, 1.15, 0.4);
		beak.rotation.z = Math.PI / 2;
		beak.castShadow = true;
		group.add(beak);

		group.position.set(x, y, z);
		return group;
	}

	function createCauldron(x, y, z) {
		var group = new THREE.Group();

		// Cauldron body - cylinder
		var cauldronGeom = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 16);
		var cauldronMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
		var cauldron = new THREE.Mesh(cauldronGeom, cauldronMat);
		cauldron.castShadow = true;
		group.add(cauldron);

		// Bubbling plague serum - sphere inside
		var serumGeom = new THREE.SphereGeometry(0.45, 8, 8);
		var serumMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x002200 });
		var serum = new THREE.Mesh(serumGeom, serumMat);
		serum.position.y = 0.1;
		serum.castShadow = true;
		group.add(serum);

		group.position.set(x, y, z);
		return group;
	}

	function createTower(x, y, z) {
		var group = new THREE.Group();

		// Main tower shaft - tall cylinder
		var shaftGeom = new THREE.CylinderGeometry(2, 2.2, 12, 16);
		var stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
		var shaft = new THREE.Mesh(shaftGeom, stoneMat);
		shaft.position.y = 4;
		shaft.castShadow = true;
		group.add(shaft);

		// Roof - cone
		var roofGeom = new THREE.ConeGeometry(2.2, 3, 16);
		var roofMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d });
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.y = 11;
		roof.castShadow = true;
		group.add(roof);

		// Tower windows - small boxes
		for (var i = 0; i < 4; i++) {
			var windowGeom = new THREE.BoxGeometry(0.4, 0.6, 0.1);
			var windowMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x003300 });
			var window = new THREE.Mesh(windowGeom, windowMat);
			var angle = (i / 4) * Math.PI * 2;
			window.position.set(Math.cos(angle) * 2, 6 + i, Math.sin(angle) * 2);
			window.castShadow = true;
			group.add(window);
		}

		group.position.set(x, y, z);
		return group;
	}

	function createFirePit(x, y, z) {
		var group = new THREE.Group();

		// Fire pit - cylinder
		var pitGeom = new THREE.CylinderGeometry(1.2, 1.5, 0.6, 16);
		var pitMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
		var pit = new THREE.Mesh(pitGeom, pitMat);
		pit.castShadow = true;
		group.add(pit);

		// Flames - cone
		var flameGeom = new THREE.ConeGeometry(0.8, 2, 8);
		var flameMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200 });
		var flame = new THREE.Mesh(flameGeom, flameMat);
		flame.position.y = 1.5;
		flame.castShadow = true;
		group.add(flame);

		group.position.set(x, y, z);
		return group;
	}

	function createCannon(x, y, z) {
		var group = new THREE.Group();

		// Cannon barrel - cylinder
		var barrelGeom = new THREE.CylinderGeometry(0.2, 0.25, 2, 8);
		var barrelMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, metalness: 0.9 });
		var barrel = new THREE.Mesh(barrelGeom, barrelMat);
		barrel.rotation.z = Math.PI / 6;
		barrel.position.y = 0.5;
		barrel.castShadow = true;
		group.add(barrel);

		// Cannon base - box
		var baseGeom = new THREE.BoxGeometry(0.8, 0.4, 0.8);
		var baseMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
		var base = new THREE.Mesh(baseGeom, baseMat);
		base.castShadow = true;
		group.add(base);

		group.position.set(x, y, z);
		return group;
	}

	function createSpecimenShelf(x, y, z) {
		var group = new THREE.Group();

		// Shelf structure - box
		var shelfGeom = new THREE.BoxGeometry(2, 0.2, 0.6);
		var shelfMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
		var shelf = new THREE.Mesh(shelfGeom, shelfMat);
		shelf.castShadow = true;
		group.add(shelf);

		// Specimen bottles - small cylinders
		for (var i = 0; i < 5; i++) {
			var bottleGeom = new THREE.CylinderGeometry(0.1, 0.12, 0.4, 6);
			var bottleColor = [0xff0000, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff][i];
			var bottleMat = new THREE.MeshStandardMaterial({ color: bottleColor, emissive: bottleColor, emissiveIntensity: 0.3 });
			var bottle = new THREE.Mesh(bottleGeom, bottleMat);
			bottle.position.set((i - 2) * 0.4, 0.3, 0);
			bottle.castShadow = true;
			group.add(bottle);
		}

		group.position.set(x, y, z);
		return group;
	}

	function createFloor() {
		var floorGeom = new THREE.BoxGeometry(50, 0.5, 50);
		var floorMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d });
		var floor = new THREE.Mesh(floorGeom, floorMat);
		floor.position.y = -0.25;
		floor.receiveShadow = true;
		scene.add(floor);
		meshes.push(floor);
	}

	function createWalls() {
		var wallMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });

		// Wall 1
		var wall1Geom = new THREE.BoxGeometry(50, 8, 0.5);
		var wall1 = new THREE.Mesh(wall1Geom, wallMat);
		wall1.position.z = -25;
		wall1.castShadow = true;
		scene.add(wall1);
		meshes.push(wall1);

		// Wall 2
		var wall2Geom = new THREE.BoxGeometry(50, 8, 0.5);
		var wall2 = new THREE.Mesh(wall2Geom, wallMat);
		wall2.position.z = 25;
		wall2.castShadow = true;
		scene.add(wall2);
		meshes.push(wall2);

		// Wall 3
		var wall3Geom = new THREE.BoxGeometry(0.5, 8, 50);
		var wall3 = new THREE.Mesh(wall3Geom, wallMat);
		wall3.position.x = -25;
		wall3.castShadow = true;
		scene.add(wall3);
		meshes.push(wall3);

		// Wall 4
		var wall4Geom = new THREE.BoxGeometry(0.5, 8, 50);
		var wall4 = new THREE.Mesh(wall4Geom, wallMat);
		wall4.position.x = 25;
		wall4.castShadow = true;
		scene.add(wall4);
		meshes.push(wall4);
	}

	function createLighting() {
		// Ambient light
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		// Point light from tower
		var pointLight = new THREE.PointLight(0xff3300, 1.5, 30);
		pointLight.position.set(0, 10, 0);
		pointLight.castShadow = true;
		scene.add(pointLight);

		// Directional light
		var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
		dirLight.position.set(10, 15, 10);
		dirLight.castShadow = true;
		scene.add(dirLight);
	}

	function init(inScene, inCamera) {
		scene = inScene;
		camera = inCamera;
		meshes = [];
		particles = [];

		createFloor();
		createWalls();
		createLighting();

		// Central tower
		var tower = createTower(0, 0, 0);
		scene.add(tower);
		meshes.push(tower);

		// Plague doctor guards
		var guard1 = createGuard(-8, 1, -8);
		scene.add(guard1);
		meshes.push(guard1);

		var guard2 = createGuard(8, 1, 8);
		scene.add(guard2);
		meshes.push(guard2);

		// Cauldrons
		var cauldron1 = createCauldron(-12, 1, 0);
		scene.add(cauldron1);
		meshes.push(cauldron1);

		var cauldron2 = createCauldron(12, 1, 0);
		scene.add(cauldron2);
		meshes.push(cauldron2);

		// Fire pits
		var fire1 = createFirePit(-15, 1, -12);
		scene.add(fire1);
		meshes.push(fire1);

		var fire2 = createFirePit(15, 1, 12);
		scene.add(fire2);
		meshes.push(fire2);

		// Plague dispersal cannon on tower roof
		var cannon = createCannon(0, 12, 0);
		scene.add(cannon);
		meshes.push(cannon);

		// Specimen shelves
		var shelf1 = createSpecimenShelf(-18, 2, -18);
		scene.add(shelf1);
		meshes.push(shelf1);

		var shelf2 = createSpecimenShelf(18, 2, 18);
		scene.add(shelf2);
		meshes.push(shelf2);
	}

	function update(delta) {
		// Animate guards
		for (var i = 0; i < meshes.length; i++) {
			var mesh = meshes[i];
			if (mesh.children && mesh.children.length > 0) {
				// Gentle idle animation for guards and cauldrons
				mesh.rotation.y += delta * 0.1;
			}
		}

		// Bubble particles from cauldrons
		if (Math.random() < 0.3) {
			var bubbleGeom = new THREE.SphereGeometry(0.05, 4, 4);
			var bubbleMat = new THREE.MeshStandardMaterial({ color: 0x00aa00, emissive: 0x00ff00 });
			var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
			bubble.position.set(Math.random() * 24 - 12, 2, Math.random() * 4 - 2);
			scene.add(bubble);
			particles.push({ mesh: bubble, life: 2 });
		}

		// Update particles
		for (var j = particles.length - 1; j >= 0; j--) {
			var particle = particles[j];
			particle.life -= delta;
			particle.mesh.position.y += delta * 1.5;
			particle.mesh.scale.x -= delta * 0.5;
			particle.mesh.scale.y -= delta * 0.5;
			particle.mesh.scale.z -= delta * 0.5;
			if (particle.life <= 0) {
				scene.remove(particle.mesh);
				particles.splice(j, 1);
			}
		}
	}

	function reset() {
		for (var i = meshes.length - 1; i >= 0; i--) {
			scene.remove(meshes[i]);
		}
		for (var j = particles.length - 1; j >= 0; j--) {
			scene.remove(particles[j].mesh);
		}
		meshes = [];
		particles = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};

}());
