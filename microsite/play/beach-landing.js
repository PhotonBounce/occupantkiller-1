window.BeachLanding = (function() {
	'use strict';

	// Scene storage
	var scene = null;
	var camera = null;
	var objects = {
		water: null,
		waves: [],
		fires: [],
		wireSwayers: [],
		particles: []
	};

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;
		objects.water = null;
		objects.waves = [];
		objects.fires = [];
		objects.wireSwayers = [];
		objects.particles = [];

		// Create beach sand surface (wide flat sandy color)
		var sandGeometry = new THREE.BoxGeometry(500, 2, 300);
		var sandMaterial = new THREE.MeshLambertMaterial({ color: 0xC2B280 });
		var sand = new THREE.Mesh(sandGeometry, sandMaterial);
		sand.position.set(0, -1, 0);
		sand.receiveShadow = true;
		scene.add(sand);

		// Ocean water (blue extending out)
		var waterGeometry = new THREE.BoxGeometry(600, 15, 400);
		var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x4A90E2, transparent: true, opacity: 0.7 });
		objects.water = new THREE.Mesh(waterGeometry, waterMaterial);
		objects.water.position.set(-100, -8, 100);
		objects.water.receiveShadow = true;
		objects.water.userData.waterBaseY = objects.water.position.y;
		scene.add(objects.water);
		objects.waves.push(objects.water);

		// Landing craft hull (flat-bottomed)
		var hullGeometry = new THREE.BoxGeometry(60, 8, 30);
		var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var hull = new THREE.Mesh(hullGeometry, metalMaterial);
		hull.position.set(-60, 2, 50);
		hull.castShadow = true;
		hull.receiveShadow = true;
		scene.add(hull);

		// Landing craft ramp (lowered)
		var rampGeometry = new THREE.BoxGeometry(50, 1, 25);
		var ramp = new THREE.Mesh(rampGeometry, metalMaterial);
		ramp.position.set(-60, 3, 75);
		ramp.rotation.x = -0.3;
		ramp.castShadow = true;
		scene.add(ramp);

		// Landing craft railings
		var railGeometry = new THREE.BoxGeometry(60, 3, 1);
		var rail1 = new THREE.Mesh(railGeometry, metalMaterial);
		rail1.position.set(-60, 7, 35);
		rail1.castShadow = true;
		scene.add(rail1);
		var rail2 = new THREE.Mesh(railGeometry, metalMaterial);
		rail2.position.set(-60, 7, 65);
		rail2.castShadow = true;
		scene.add(rail2);

		// Czech hedgehogs (crossed iron beams)
		createCzechHedgehog(-20, 1, 30);
		createCzechHedgehog(10, 1, 20);
		createCzechHedgehog(40, 1, 35);

		// Wooden stakes with mines (CylinderGeometry post + SphereGeometry mine)
		createMinedStake(-5, 0, 50);
		createMinedStake(25, 0, 40);
		createMinedStake(50, 0, 30);

		// Barbed wire entanglements (LineSegments wire runs)
		createBarbedWire(0, 2, 10, 80, 2, 10);
		createBarbedWire(-50, 2, 0, 80, 2, 0);
		objects.wireSwayers.push(scene.children[scene.children.length - 1]);
		objects.wireSwayers.push(scene.children[scene.children.length - 2]);

		// Concrete anti-tank dragon teeth (ConeGeometry pointed)
		createDragonTeeth(-30, 2, 15);
		createDragonTeeth(-10, 2, 15);
		createDragonTeeth(10, 2, 15);
		createDragonTeeth(30, 2, 15);

		// Beach bunker (BoxGeometry thick concrete with gun embrasure slot)
		var bunkerGeometry = new THREE.BoxGeometry(50, 15, 40);
		var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var bunker = new THREE.Mesh(bunkerGeometry, concreteMaterial);
		bunker.position.set(80, 5, 20);
		bunker.castShadow = true;
		bunker.receiveShadow = true;
		scene.add(bunker);

		// Bunker gun embrasure (slot)
		var embrasureGeometry = new THREE.BoxGeometry(20, 8, 2);
		var embrasure = new THREE.Mesh(embrasureGeometry, new THREE.MeshLambertMaterial({ color: 0x222222 }));
		embrasure.position.set(80, 8, 38);
		embrasure.castShadow = true;
		scene.add(embrasure);

		// MG42 nest (sandbag emplacement + cylinder barrel)
		createMGNest(100, 1, 50);

		// Bluff cliff face (layered rock)
		var cliffGeometry = new THREE.BoxGeometry(400, 50, 30);
		var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		var cliff = new THREE.Mesh(cliffGeometry, rockMaterial);
		cliff.position.set(0, 25, -150);
		cliff.castShadow = true;
		cliff.receiveShadow = true;
		scene.add(cliff);

		// Stairs cut into cliff (BoxGeometry steps)
		createCliffStairs(50, 2, -145);

		// Destroyed landing craft (tilted burning)
		var destroyedHullGeometry = new THREE.BoxGeometry(60, 6, 28);
		var destroyedHull = new THREE.Mesh(destroyedHullGeometry, metalMaterial);
		destroyedHull.position.set(120, 3, 90);
		destroyedHull.rotation.z = 0.4;
		destroyedHull.castShadow = true;
		scene.add(destroyedHull);

		// Fire on destroyed craft
		createFire(120, 6, 90);
		objects.fires.push(scene.children[scene.children.length - 1]);

		// Fallen soldiers (abstracted boxes)
		createFallenSoldier(-15, 0, 25);
		createFallenSoldier(35, 0, 45);
		createFallenSoldier(60, 0, 15);

		// Shell crater (depression - negative space)
		var craterGeometry = new THREE.SphereGeometry(20, 16, 16);
		var craterMaterial = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
		var crater = new THREE.Mesh(craterGeometry, craterMaterial);
		crater.position.set(-40, -3, 60);
		crater.scale.y = 0.4;
		crater.receiveShadow = true;
		scene.add(crater);

		// Burning jeep (BoxGeometry + fire)
		createBurningJeep(-70, 1, 70);

		// Beach exits (cut through bluff)
		var exitGeometry = new THREE.BoxGeometry(30, 40, 5);
		var exit1 = new THREE.Mesh(exitGeometry, new THREE.MeshLambertMaterial({ color: 0x333333 }));
		exit1.position.set(-80, 20, -145);
		scene.add(exit1);
		var exit2 = new THREE.Mesh(exitGeometry, new THREE.MeshLambertMaterial({ color: 0x333333 }));
		exit2.position.set(80, 20, -145);
		scene.add(exit2);

		// Communication wire (LineSegments runs on ground)
		createCommWire(-100, 1, -50, 100, 1, 80);

		// Artillery observation post on bluff (BoxGeometry concrete)
		var obsPostGeometry = new THREE.BoxGeometry(20, 25, 20);
		var obsPost = new THREE.Mesh(obsPostGeometry, concreteMaterial);
		obsPost.position.set(-150, 40, -140);
		obsPost.castShadow = true;
		scene.add(obsPost);

		// Observation post barrel (cylinder)
		var barrelGeometry = new THREE.CylinderGeometry(2, 2, 15, 8);
		var barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
		barrel.position.set(-150, 55, -140);
		barrel.rotation.x = -0.3;
		barrel.castShadow = true;
		scene.add(barrel);

		// Add lighting for dramatic effect
		var sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
		sunLight.position.set(100, 80, 50);
		sunLight.castShadow = true;
		sunLight.shadow.mapSize.width = 2048;
		sunLight.shadow.mapSize.height = 2048;
		sunLight.shadow.camera.left = -300;
		sunLight.shadow.camera.right = 300;
		sunLight.shadow.camera.top = 300;
		sunLight.shadow.camera.bottom = -300;
		scene.add(sunLight);

		var ambientLight = new THREE.AmbientLight(0xCCCCCC, 0.6);
		scene.add(ambientLight);
	}

	function createCzechHedgehog(x, y, z) {
		var beamMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var beamGeometry = new THREE.BoxGeometry(2, 2, 20);

		// Three perpendicular beams
		var beam1 = new THREE.Mesh(beamGeometry, beamMaterial);
		beam1.position.set(x, y + 3, z);
		beam1.castShadow = true;
		scene.add(beam1);

		var beam2 = new THREE.Mesh(beamGeometry, beamMaterial);
		beam2.position.set(x, y + 3, z);
		beam2.rotation.z = Math.PI / 2;
		beam2.castShadow = true;
		scene.add(beam2);

		var beam3 = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 2), beamMaterial);
		beam3.position.set(x, y + 3, z);
		beam3.rotation.y = Math.PI / 2;
		beam3.castShadow = true;
		scene.add(beam3);
	}

	function createMinedStake(x, y, z) {
		var postGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
		var postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var post = new THREE.Mesh(postGeometry, postMaterial);
		post.position.set(x, y + 7, z);
		post.castShadow = true;
		scene.add(post);

		var mineGeometry = new THREE.SphereGeometry(3, 8, 8);
		var mineMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var mine = new THREE.Mesh(mineGeometry, mineMaterial);
		mine.position.set(x, y + 14, z);
		mine.castShadow = true;
		scene.add(mine);
	}

	function createBarbedWire(x1, y1, z1, x2, y2, z2) {
		var points = [
			new THREE.Vector3(x1, y1, z1),
			new THREE.Vector3(x2, y2, z2)
		];
		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 });
		var line = new THREE.LineSegments(geometry, material);
		scene.add(line);
		return line;
	}

	function createDragonTeeth(x, y, z) {
		var teethGeometry = new THREE.ConeGeometry(3, 10, 6);
		var teethMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var teeth = new THREE.Mesh(teethGeometry, teethMaterial);
		teeth.position.set(x, y + 5, z);
		teeth.castShadow = true;
		scene.add(teeth);
	}

	function createMGNest(x, y, z) {
		// Sandbag emplacement
		var sandbagGeometry = new THREE.BoxGeometry(30, 5, 30);
		var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
		sandbag.position.set(x, y + 2, z);
		sandbag.receiveShadow = true;
		scene.add(sandbag);

		// MG42 barrel (cylinder)
		var barrelGeometry = new THREE.CylinderGeometry(1, 1, 25, 8);
		var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
		barrel.position.set(x, y + 5, z);
		barrel.rotation.x = -0.15;
		barrel.castShadow = true;
		scene.add(barrel);

		// Gun shield (box)
		var shieldGeometry = new THREE.BoxGeometry(8, 10, 2);
		var shield = new THREE.Mesh(shieldGeometry, metalMaterial);
		shield.position.set(x, y + 5, z + 12);
		shield.castShadow = true;
		scene.add(shield);
	}

	function createCliffStairs(x, y, z) {
		var stepMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		for (var i = 0; i < 8; i++) {
			var stepGeometry = new THREE.BoxGeometry(25, 5, 8);
			var step = new THREE.Mesh(stepGeometry, stepMaterial);
			step.position.set(x, y + (i * 6), z + (i * 3));
			step.castShadow = true;
			step.receiveShadow = true;
			scene.add(step);
		}
	}

	function createFire(x, y, z) {
		var fireGeometry = new THREE.SphereGeometry(3, 8, 8);
		var fireMaterial = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
		var fire = new THREE.Mesh(fireGeometry, fireMaterial);
		fire.position.set(x, y, z);
		fire.userData.fireBaseY = y;
		fire.userData.fireTime = Math.random() * Math.PI * 2;
		scene.add(fire);
		return fire;
	}

	function createFallenSoldier(x, y, z) {
		var soldierGeometry = new THREE.BoxGeometry(2, 6, 1.5);
		var soldierMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var soldier = new THREE.Mesh(soldierGeometry, soldierMaterial);
		soldier.position.set(x, y + 3, z);
		soldier.rotation.z = 0.3;
		soldier.castShadow = true;
		scene.add(soldier);
	}

	function createBurningJeep(x, y, z) {
		// Jeep body
		var bodyGeometry = new THREE.BoxGeometry(8, 6, 15);
		var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(x, y + 3, z);
		body.castShadow = true;
		scene.add(body);

		// Jeep wheels
		var wheelGeometry = new THREE.CylinderGeometry(2.5, 2.5, 1, 12);
		var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
		for (var i = 0; i < 4; i++) {
			var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(x + (i % 2 === 0 ? -3 : 3), y + 2, z + (i < 2 ? -5 : 5));
			wheel.castShadow = true;
			scene.add(wheel);
		}

		// Fire on jeep
		createFire(x, y + 4, z);
		objects.fires.push(scene.children[scene.children.length - 1]);
	}

	function createCommWire(x1, y1, z1, x2, y2, z2) {
		var points = [
			new THREE.Vector3(x1, y1, z1),
			new THREE.Vector3(x2, y2, z2)
		];
		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
		var line = new THREE.LineSegments(geometry, material);
		scene.add(line);
	}

	function update(delta) {
		// Ocean waves rolling in (oscillating position)
		if (objects.water) {
			var waveAmount = Math.sin(Date.now() * 0.001) * 1.5;
			objects.water.position.y = objects.water.userData.waterBaseY + waveAmount;
		}

		// Fire flicker (animate fire objects)
		for (var i = 0; i < objects.fires.length; i++) {
			var fire = objects.fires[i];
			fire.userData.fireTime += delta * 3;
			var flicker = Math.sin(fire.userData.fireTime) * 0.5 + 0.5;
			fire.scale.set(0.8 + flicker * 0.4, 0.8 + flicker * 0.4, 0.8 + flicker * 0.4);
			fire.position.y = fire.userData.fireBaseY + Math.sin(fire.userData.fireTime * 0.8) * 0.5;
		}

		// Barbed wire sway
		for (var j = 0; j < objects.wireSwayers.length; j++) {
			var wire = objects.wireSwayers[j];
			if (wire.geometry && wire.geometry.attributes && wire.geometry.attributes.position) {
				var sway = Math.sin(Date.now() * 0.002 + j) * 0.3;
				var positions = wire.geometry.attributes.position.array;
				if (positions.length > 3) {
					positions[1] += sway * 0.05;
					positions[4] += sway * 0.05;
					wire.geometry.attributes.position.needsUpdate = true;
				}
			}
		}

		// Spray particles (surf foam - optional simple scaling)
		for (var k = 0; k < objects.particles.length; k++) {
			var particle = objects.particles[k];
			particle.userData.life -= delta;
			if (particle.userData.life <= 0) {
				scene.remove(particle);
				objects.particles.splice(k, 1);
				k--;
			} else {
				particle.position.y += delta * 0.5;
				particle.scale.set(
					particle.userData.life,
					particle.userData.life,
					particle.userData.life
				);
			}
		}
	}

	function reset() {
		// Clear all objects
		for (var i = scene.children.length - 1; i >= 0; i--) {
			scene.remove(scene.children[i]);
		}

		objects.water = null;
		objects.waves = [];
		objects.fires = [];
		objects.wireSwayers = [];
		objects.particles = [];

		// Reinitialize
		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
