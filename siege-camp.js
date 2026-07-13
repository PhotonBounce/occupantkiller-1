window.SiegeCamp = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = {
		fires: [],
		catapults: [],
		torches: []
	};
	var time = 0;

	function init(sceneArg, cameraArg) {
		scene = sceneArg;
		camera = cameraArg;
		objects.fires = [];
		objects.catapults = [];
		objects.torches = [];
		time = 0;

		buildCommandTent();
		buildSupplyWagons();
		buildCatapultBattery();
		buildBarracksTents();
		buildCookingFires();
		buildWeaponRacks();
		buildHorsePosts();
		buildTorchPoles();
		buildTrench();
		buildMedicalTent();
		buildPalisade();
	}

	function buildCommandTent() {
		var frameGeometry = new THREE.BoxGeometry(8, 0.4, 6);
		var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
		var baseFrame = new THREE.Mesh(frameGeometry, frameMaterial);
		baseFrame.position.set(0, 0.2, 0);
		scene.add(baseFrame);

		var wallMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
		var wallGeometry = new THREE.BoxGeometry(8, 4, 0.2);
		var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
		wall1.position.set(0, 2, 3);
		scene.add(wall1);

		var wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
		wall2.position.set(0, 2, -3);
		scene.add(wall2);

		var wall3 = new THREE.BoxGeometry(0.2, 4, 6);
		var wall4 = new THREE.Mesh(wall3, wallMaterial);
		wall4.position.set(4, 2, 0);
		scene.add(wall4);

		var wall5 = new THREE.Mesh(wall3, wallMaterial);
		wall5.position.set(-4, 2, 0);
		scene.add(wall5);

		var roofGeometry = new THREE.ConeGeometry(5.5, 4, 32);
		var roofMaterial = new THREE.MeshStandardMaterial({ color: 0xDC143C });
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(0, 4.2, 0);
		roof.rotation.z = Math.PI / 2;
		scene.add(roof);

		addGuyWires(0, 0, 8, 0.3);
	}

	function addGuyWires(x, y, z, radius) {
		var lineMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
		var positions = [0, 4, 0, 5, 0, 3, 0, 4, 0, -5, 0, 3, 0, 4, 0, 3, 0, 5, 0, 4, 0, 3, 0, -5];
		var geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
		var lines = new THREE.LineSegments(geometry, lineMaterial);
		lines.position.set(x, y, z);
		scene.add(lines);
	}

	function buildSupplyWagons() {
		for (var i = 0; i < 3; i++) {
			var wagonX = -15 + i * 8;
			var cartGeometry = new THREE.BoxGeometry(3, 2, 2);
			var cartMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
			var cart = new THREE.Mesh(cartGeometry, cartMaterial);
			cart.position.set(wagonX, 1, -12);
			scene.add(cart);

			var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
			var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
			var wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel1.position.set(wagonX - 1, 0.8, -11.5);
			wheel1.rotation.z = Math.PI / 2;
			scene.add(wheel1);

			var wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel2.position.set(wagonX - 1, 0.8, -12.5);
			wheel2.rotation.z = Math.PI / 2;
			scene.add(wheel2);

			var wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel3.position.set(wagonX + 1, 0.8, -11.5);
			wheel3.rotation.z = Math.PI / 2;
			scene.add(wheel3);

			var wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel4.position.set(wagonX + 1, 0.8, -12.5);
			wheel4.rotation.z = Math.PI / 2;
			scene.add(wheel4);

			var crateGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
			var crateMaterial = new THREE.MeshStandardMaterial({ color: 0xD2691E });
			for (var j = 0; j < 3; j++) {
				var crate = new THREE.Mesh(crateGeometry, crateMaterial);
				crate.position.set(wagonX - 0.8 + j * 1, 2.6, -12);
				scene.add(crate);
			}
		}
	}

	function buildCatapultBattery() {
		for (var i = 0; i < 4; i++) {
			var catapultX = -12 + i * 8;
			var baseGeometry = new THREE.BoxGeometry(2, 0.4, 2);
			var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(catapultX, 0.2, 8);
			scene.add(base);

			var frameGeometry = new THREE.BoxGeometry(2, 3, 0.3);
			var frameMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
			var frame1 = new THREE.Mesh(frameGeometry, frameMaterial);
			frame1.position.set(catapultX, 1.5, 7.5);
			scene.add(frame1);

			var frame2 = new THREE.Mesh(frameGeometry, frameMaterial);
			frame2.position.set(catapultX, 1.5, 8.5);
			scene.add(frame2);

			var armGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
			var armMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
			var arm = new THREE.Mesh(armGeometry, armMaterial);
			arm.position.set(catapultX, 2, 8);
			scene.add(arm);

			objects.catapults.push(arm);
		}
	}

	function buildBarracksTents() {
		for (var i = 0; i < 5; i++) {
			for (var j = 0; j < 3; j++) {
				var tentX = -20 + i * 8;
				var tentZ = 15 + j * 4;

				var roofGeometry = new THREE.ConeGeometry(2, 2.5, 32);
				var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
				var roof = new THREE.Mesh(roofGeometry, roofMaterial);
				roof.position.set(tentX, 1.25, tentZ);
				roof.rotation.z = Math.PI / 2;
				scene.add(roof);

				var baseGeometry = new THREE.BoxGeometry(3, 0.2, 3);
				var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
				var base = new THREE.Mesh(baseGeometry, baseMaterial);
				base.position.set(tentX, 0.1, tentZ);
				scene.add(base);
			}
		}
	}

	function buildCookingFires() {
		for (var i = 0; i < 3; i++) {
			var fireX = -12 + i * 12;
			var fireZ = -5;

			var pitGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.4, 16);
			var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
			var pit = new THREE.Mesh(pitGeometry, pitMaterial);
			pit.position.set(fireX, 0.2, fireZ);
			scene.add(pit);

			var flameGeometry = new THREE.SphereGeometry(0.6, 8, 8);
			var flameMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6347, emissive: 0xFF4500 });
			var flame = new THREE.Mesh(flameGeometry, flameMaterial);
			flame.position.set(fireX, 1.2, fireZ);
			flame.scale.y = 1.5;
			scene.add(flame);

			objects.fires.push({
				mesh: flame,
				baseScale: flame.scale.clone(),
				position: flame.position.clone()
			});
		}
	}

	function buildWeaponRacks() {
		for (var i = 0; i < 2; i++) {
			var rackX = -8 + i * 16;
			var standGeometry = new THREE.BoxGeometry(2, 3, 0.4);
			var standMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
			var stand = new THREE.Mesh(standGeometry, standMaterial);
			stand.position.set(rackX, 1.5, -20);
			scene.add(stand);

			var lineMaterial = new THREE.LineBasicMaterial({ color: 0xAA8844 });
			var positions = [0, 0.5, 0, 0.5, 2, 0, 0, 1, 0, 0.3, 2.5, 0, 0, 1.5, 0, -0.5, 2, 0];
			var geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
			var lines = new THREE.LineSegments(geometry, lineMaterial);
			lines.position.set(rackX, 1.5, -20);
			scene.add(lines);
		}
	}

	function buildHorsePosts() {
		for (var i = 0; i < 4; i++) {
			var postX = -14 + i * 10;
			var postZ = 25;

			var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
			var postMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
			var post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(postX, 1, postZ);
			scene.add(post);

			var ropeGeometry = new THREE.BufferGeometry();
			var ropePositions = [0, 0, 0, 0.5, -0.5, 0.2, 0, 0, 0, -0.5, -0.5, 0.2];
			ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
			var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513 });
			var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
			rope.position.set(postX, 1.5, postZ);
			scene.add(rope);

			var horseGeometry = new THREE.BoxGeometry(1.2, 1.5, 2);
			var horseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, wireframe: true });
			var horse = new THREE.Mesh(horseGeometry, horseMaterial);
			horse.position.set(postX + 1.5, 1, postZ);
			scene.add(horse);
		}
	}

	function buildTorchPoles() {
		for (var i = 0; i < 6; i++) {
			var angle = (i / 6) * Math.PI * 2;
			var radius = 30;
			var torchX = Math.cos(angle) * radius;
			var torchZ = Math.sin(angle) * radius;

			var poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
			var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
			var pole = new THREE.Mesh(poleGeometry, poleMaterial);
			pole.position.set(torchX, 2, torchZ);
			scene.add(pole);

			var fireGeometry = new THREE.SphereGeometry(0.5, 8, 8);
			var fireMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFF8C00 });
			var fire = new THREE.Mesh(fireGeometry, fireMaterial);
			fire.position.set(torchX, 4, torchZ);
			scene.add(fire);

			objects.torches.push({
				mesh: fire,
				baseScale: fire.scale.clone(),
				position: fire.position.clone()
			});
		}
	}

	function buildTrench() {
		var trenchGeometry = new THREE.BoxGeometry(40, 1, 2);
		var trenchMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F });
		var trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
		trench.position.set(0, -0.5, 32);
		scene.add(trench);

		var stakeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6);
		var stakeMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
		for (var i = 0; i < 12; i++) {
			var stake = new THREE.Mesh(stakeGeometry, stakeMaterial);
			stake.position.set(-18 + i * 3.5, 0.3, 32);
			stake.rotation.z = Math.random() * 0.3 - 0.15;
			scene.add(stake);
		}

		var barierGeometry = new THREE.BoxGeometry(40, 0.3, 0.3);
		var barrierMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
		var barrier = new THREE.Mesh(barierGeometry, barrierMaterial);
		barrier.position.set(0, 1.2, 32);
		scene.add(barrier);
	}

	function buildMedicalTent() {
		var roofGeometry = new THREE.ConeGeometry(2.5, 2.8, 32);
		var roofMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(25, 1.4, 5);
		roof.rotation.z = Math.PI / 2;
		scene.add(roof);

		var baseGeometry = new THREE.BoxGeometry(3.5, 0.2, 3.5);
		var baseMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(25, 0.1, 5);
		scene.add(base);

		var crossGeometry = new THREE.BoxGeometry(0.3, 1, 0.1);
		var crossMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
		var cross1 = new THREE.Mesh(crossGeometry, crossMaterial);
		cross1.position.set(25, 2.2, 5);
		scene.add(cross1);

		var cross2 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 0.1), crossMaterial);
		cross2.position.set(25, 2.2, 5);
		scene.add(cross2);
	}

	function buildPalisade() {
		var palisadeGeometry = new THREE.CylinderGeometry(0.2, 0.25, 3, 6);
		var palisadeMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
		for (var i = 0; i < 20; i++) {
			var palisade = new THREE.Mesh(palisadeGeometry, palisadeMaterial);
			palisade.position.set(-40 + i * 4, 1.5, -35);
			palisade.rotation.z = Math.random() * 0.1 - 0.05;
			scene.add(palisade);
		}

		var ropeGeometry = new THREE.BufferGeometry();
		var ropePositions = [];
		for (var j = 0; j < 20; j++) {
			ropePositions.push(-40 + j * 4, 2.5, -35);
			ropePositions.push(-40 + (j + 1) * 4, 2.5, -35);
		}
		ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
		var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513 });
		var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
		scene.add(rope);
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < objects.fires.length; i++) {
			var fire = objects.fires[i];
			var flicker = 0.9 + 0.2 * Math.sin(time * 8 + i);
			fire.mesh.scale.x = fire.baseScale.x * flicker;
			fire.mesh.scale.y = fire.baseScale.y * flicker * 1.3;
			fire.mesh.scale.z = fire.baseScale.z * flicker;
			fire.mesh.position.y = fire.position.y + Math.sin(time * 6 + i * 0.5) * 0.15;
		}

		for (var j = 0; j < objects.catapults.length; j++) {
			var catapult = objects.catapults[j];
			var sway = Math.sin(time * 2 + j) * 0.15;
			catapult.rotation.z = sway;
		}

		for (var k = 0; k < objects.torches.length; k++) {
			var torch = objects.torches[k];
			var torchFlicker = 0.85 + 0.25 * Math.sin(time * 5 + k * 0.7);
			torch.mesh.scale.x = torch.baseScale.x * torchFlicker;
			torch.mesh.scale.y = torch.baseScale.y * torchFlicker;
			torch.mesh.scale.z = torch.baseScale.z * torchFlicker;
		}
	}

	function reset() {
		time = 0;
		for (var i = 0; i < scene.children.length; i++) {
			var child = scene.children[i];
			if (child.geometry) {
				child.geometry.dispose();
			}
			if (child.material) {
				if (Array.isArray(child.material)) {
					for (var j = 0; j < child.material.length; j++) {
						child.material[j].dispose();
					}
				} else {
					child.material.dispose();
				}
			}
		}
		scene.children.length = 0;
		objects.fires = [];
		objects.catapults = [];
		objects.torches = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
