window.HarborRaid = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];
		time = 0;

		buildlights();
		buildships();
		buildwarehouse();
		buildcrane();
		buildhelicopter();
		buildspeedboats();
		buildfueltanks();
		buildbarriers();
		buildlighthouse();
	}

	function buildlights() {
		var ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.4);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var fireLight1 = new THREE.PointLight(0xff6600, 2.5, 80);
		fireLight1.position.set(40, 20, -30);
		scene.add(fireLight1);
		lights.push(fireLight1);

		var fireLight2 = new THREE.PointLight(0xff3300, 2.0, 60);
		fireLight2.position.set(-35, 25, 45);
		scene.add(fireLight2);
		lights.push(fireLight2);

		var fireLight3 = new THREE.PointLight(0xff8800, 1.8, 70);
		fireLight3.position.set(15, 30, 20);
		scene.add(fireLight3);
		lights.push(fireLight3);

		var lighthouselamp = new THREE.SpotLight(0xffff00, 1.5, 100, Math.PI / 6, 0.8, 2);
		lighthouselamp.position.set(-60, 40, -50);
		lighthouselamp.target.position.set(-60, 0, -50);
		scene.add(lighthouselamp);
		scene.add(lighthouselamp.target);
		lights.push(lighthouselamp);
	}

	function buildships() {
		var shipMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
		var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });

		var ship1 = new THREE.Group();

		var hull1 = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 12), shipMaterial);
		hull1.position.set(0, 4, 0);
		hull1.castShadow = true;
		ship1.add(hull1);

		var cabin1 = new THREE.Mesh(new THREE.BoxGeometry(10, 12, 8), shipMaterial);
		cabin1.position.set(8, 10, 0);
		cabin1.castShadow = true;
		ship1.add(cabin1);

		var smokestack1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 15, 8), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		smokestack1.position.set(5, 15, 0);
		smokestack1.castShadow = true;
		ship1.add(smokestack1);

		var fire1a = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), fireMaterial);
		fire1a.position.set(8, 20, 0);
		fire1a.castShadow = true;
		ship1.add(fire1a);
		animatedObjects.push({ object: fire1a, type: 'firepulse', baseScale: 3, maxScale: 4.5 });

		var fire1b = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), new THREE.MeshLambertMaterial({ color: 0xff3300 }));
		fire1b.position.set(12, 22, 2);
		fire1b.castShadow = true;
		ship1.add(fire1b);
		animatedObjects.push({ object: fire1b, type: 'firepulse', baseScale: 2.5, maxScale: 3.8 });

		ship1.position.set(35, 0, -25);
		scene.add(ship1);
		objects.push(ship1);

		var ship2 = new THREE.Group();

		var hull2 = new THREE.Mesh(new THREE.BoxGeometry(28, 7, 11), shipMaterial);
		hull2.position.set(0, 3.5, 0);
		hull2.castShadow = true;
		ship2.add(hull2);

		var cabin2 = new THREE.Mesh(new THREE.BoxGeometry(9, 10, 7), shipMaterial);
		cabin2.position.set(-7, 9, 0);
		cabin2.castShadow = true;
		ship2.add(cabin2);

		var smokestack2 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 13, 8), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		smokestack2.position.set(-4, 13, 0);
		smokestack2.castShadow = true;
		ship2.add(smokestack2);

		var fire2a = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 8), fireMaterial);
		fire2a.position.set(-8, 18, 1);
		fire2a.castShadow = true;
		ship2.add(fire2a);
		animatedObjects.push({ object: fire2a, type: 'firepulse', baseScale: 2.8, maxScale: 4.2 });

		ship2.position.set(-40, 0, 35);
		ship2.rotation.z = 0.3;
		scene.add(ship2);
		objects.push(ship2);
	}

	function buildwarehouse() {
		var warehouseMaterial = new THREE.MeshLambertMaterial({ color: 0x3d4e60 });
		var brickMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

		var main1 = new THREE.Mesh(new THREE.BoxGeometry(25, 18, 20), warehouseMaterial);
		main1.position.set(-50, 9, 20);
		main1.castShadow = true;
		scene.add(main1);
		objects.push(main1);

		var roof1 = new THREE.Mesh(new THREE.ConeGeometry(18, 8, 4), brickMaterial);
		roof1.position.set(-50, 27, 20);
		roof1.castShadow = true;
		scene.add(roof1);
		objects.push(roof1);

		var fire3 = new THREE.Mesh(new THREE.SphereGeometry(3.2, 8, 8), new THREE.MeshLambertMaterial({ color: 0xff8800 }));
		fire3.position.set(-50, 32, 20);
		fire3.castShadow = true;
		scene.add(fire3);
		animatedObjects.push({ object: fire3, type: 'firepulse', baseScale: 3.2, maxScale: 4.8 });
		objects.push(fire3);

		var main2 = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 18), warehouseMaterial);
		main2.position.set(50, 8, -15);
		main2.castShadow = true;
		main2.rotation.y = 0.2;
		scene.add(main2);
		objects.push(main2);

		var roof2 = new THREE.Mesh(new THREE.ConeGeometry(16, 7, 4), brickMaterial);
		roof2.position.set(50, 24, -15);
		roof2.castShadow = true;
		scene.add(roof2);
		objects.push(roof2);
	}

	function buildcrane() {
		var craneMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		var base = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 2, 8), craneMaterial);
		base.position.set(15, 1, -35);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var tower = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 35, 8), craneMaterial);
		tower.position.set(15, 18, -35);
		tower.castShadow = true;
		scene.add(tower);
		objects.push(tower);

		var craneArm1 = new THREE.Mesh(new THREE.BoxGeometry(40, 1.5, 1.5), craneMaterial);
		craneArm1.position.set(35, 33, -35);
		craneArm1.castShadow = true;
		scene.add(craneArm1);
		objects.push(craneArm1);

		var craneArm2 = new THREE.Mesh(new THREE.BoxGeometry(35, 1.2, 1.2), craneMaterial);
		craneArm2.position.set(32, 30, -35);
		craneArm2.rotation.z = 0.15;
		craneArm2.castShadow = true;
		scene.add(craneArm2);
		objects.push(craneArm2);

		var counterweight = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 3), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
		counterweight.position.set(-8, 31, -35);
		counterweight.castShadow = true;
		scene.add(counterweight);
		objects.push(counterweight);

		var cables = [];
		for (var i = 0; i < 4; i++) {
			var cableGeom = new THREE.BufferGeometry();
			var positions = new Float32Array([
				30 + i * 2, 32, -35,
				30 + i * 2, 8, -35 + i * 1.5
			]);
			cableGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			var cable = new THREE.LineSegments(cableGeom, new THREE.LineBasicMaterial({ color: 0x666666 }));
			scene.add(cable);
			objects.push(cable);
		}
	}

	function buildhelicopter() {
		var heliMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var rolorMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

		var fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, 6, 8), heliMaterial);
		fuselage.position.set(-30, 55, 55);
		fuselage.rotation.z = Math.PI / 2;
		fuselage.castShadow = true;
		scene.add(fuselage);
		objects.push(fuselage);

		var cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), heliMaterial);
		cockpit.position.set(-30, 58, 57);
		cockpit.scale.set(1, 0.8, 1);
		cockpit.castShadow = true;
		scene.add(cockpit);
		objects.push(cockpit);

		var rotorMain = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.3, 6), rolorMaterial);
		rotorMain.position.set(-30, 62, 55);
		rotorMain.castShadow = true;
		scene.add(rotorMain);
		objects.push(rotorMain);
		animatedObjects.push({ object: rotorMain, type: 'rotate', axis: 'y', speed: 0.2 });

		var tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 8, 6), heliMaterial);
		tailBoom.position.set(-32, 54, 52);
		tailBoom.rotation.z = 0.3;
		tailBoom.castShadow = true;
		scene.add(tailBoom);
		objects.push(tailBoom);

		var tailRotor = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.2, 4), rolorMaterial);
		tailRotor.position.set(-40, 56, 50);
		tailRotor.rotation.x = Math.PI / 2.5;
		tailRotor.castShadow = true;
		scene.add(tailRotor);
		objects.push(tailRotor);
		animatedObjects.push({ object: tailRotor, type: 'rotate', axis: 'z', speed: 0.3 });

		for (var i = 0; i < 3; i++) {
			var commando = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.5, 6), new THREE.MeshLambertMaterial({ color: 0x0a0a0a }));
			commando.position.set(-28 + i * 1.5, 48 - i * 1, 53);
			commando.castShadow = true;
			scene.add(commando);
			objects.push(commando);

			var ropeGeom = new THREE.BufferGeometry();
			var ropePos = new Float32Array([
				-28 + i * 1.5, 60, 55,
				-28 + i * 1.5, 48 - i * 1, 53
			]);
			ropeGeom.setAttribute('position', new THREE.BufferAttribute(ropePos, 3));
			var rope = new THREE.LineSegments(ropeGeom, new THREE.LineBasicMaterial({ color: 0x888888 }));
			scene.add(rope);
			objects.push(rope);
		}
	}

	function buildspeedboats() {
		var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var engineMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

		var boat1 = new THREE.Group();
		var hull1 = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 4), boatMaterial);
		hull1.position.set(0, 1, 0);
		hull1.castShadow = true;
		boat1.add(hull1);

		var engine1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2, 6), engineMaterial);
		engine1.position.set(0, 3, 1.5);
		engine1.castShadow = true;
		boat1.add(engine1);

		boat1.position.set(60, 0.5, 40);
		scene.add(boat1);
		objects.push(boat1);
		animatedObjects.push({ object: boat1, type: 'circle', radius: 45, center: [35, 0, 40], speed: 0.015 });

		var boat2 = new THREE.Group();
		var hull2 = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 4), boatMaterial);
		hull2.position.set(0, 1, 0);
		hull2.castShadow = true;
		boat2.add(hull2);

		var engine2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2, 6), engineMaterial);
		engine2.position.set(0, 3, 1.5);
		engine2.castShadow = true;
		boat2.add(engine2);

		boat2.position.set(35, 0.5, 80);
		scene.add(boat2);
		objects.push(boat2);
		animatedObjects.push({ object: boat2, type: 'circle', radius: 40, center: [35, 0, 40], speed: 0.02, offset: Math.PI });

		var boat3 = new THREE.Group();
		var hull3 = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 4), boatMaterial);
		hull3.position.set(0, 1, 0);
		hull3.castShadow = true;
		boat3.add(hull3);

		var engine3 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2, 6), engineMaterial);
		engine3.position.set(0, 3, 1.5);
		engine3.castShadow = true;
		boat3.add(engine3);

		boat3.position.set(10, 0.5, 30);
		scene.add(boat3);
		objects.push(boat3);
		animatedObjects.push({ object: boat3, type: 'circle', radius: 42, center: [35, 0, 40], speed: 0.018, offset: Math.PI / 2 });
	}

	function buildfueltanks() {
		var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });

		var tank1 = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 12, 8), tankMaterial);
		tank1.position.set(30, 6, 50);
		tank1.castShadow = true;
		scene.add(tank1);
		objects.push(tank1);

		var explosion1 = new THREE.Mesh(new THREE.SphereGeometry(4.5, 8, 8), fireMaterial);
		explosion1.position.set(30, 15, 50);
		explosion1.castShadow = true;
		scene.add(explosion1);
		animatedObjects.push({ object: explosion1, type: 'firepulse', baseScale: 4.5, maxScale: 6.5 });
		objects.push(explosion1);

		var tank2 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 11, 8), tankMaterial);
		tank2.position.set(-25, 5.5, 65);
		tank2.castShadow = true;
		scene.add(tank2);
		objects.push(tank2);

		var explosion2 = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshLambertMaterial({ color: 0xff3300 }));
		explosion2.position.set(-25, 14, 65);
		explosion2.castShadow = true;
		scene.add(explosion2);
		animatedObjects.push({ object: explosion2, type: 'firepulse', baseScale: 4, maxScale: 5.8 });
		objects.push(explosion2);

		var tank3 = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 13, 8), tankMaterial);
		tank3.position.set(55, 6.5, 20);
		tank3.castShadow = true;
		scene.add(tank3);
		objects.push(tank3);

		var explosion3 = new THREE.Mesh(new THREE.SphereGeometry(5, 8, 8), fireMaterial);
		explosion3.position.set(55, 16, 20);
		explosion3.castShadow = true;
		scene.add(explosion3);
		animatedObjects.push({ object: explosion3, type: 'firepulse', baseScale: 5, maxScale: 7.2 });
		objects.push(explosion3);
	}

	function buildbarriers() {
		var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var chainMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

		for (var i = 0; i < 8; i++) {
			var post = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 4, 8), barrierMaterial);
			post.position.set(-60 + i * 18, 2, -60);
			post.castShadow = true;
			scene.add(post);
			objects.push(post);

			if (i < 7) {
				var chain1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 17, 6), chainMaterial);
				chain1.position.set(-51 + i * 18, 3, -60);
				chain1.rotation.z = Math.PI / 2;
				chain1.castShadow = true;
				scene.add(chain1);
				objects.push(chain1);

				var chain2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 17, 6), new THREE.MeshLambertMaterial({ color: 0x555555 }));
				chain2.position.set(-51 + i * 18, 1.5, -60);
				chain2.rotation.z = Math.PI / 2;
				chain2.castShadow = true;
				scene.add(chain2);
				objects.push(chain2);
			}
		}
	}

	function buildlighthouse() {
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var topMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var lensMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });

		var base = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 3, 8), baseMaterial);
		base.position.set(-60, 1.5, -50);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var tower = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 45, 8), baseMaterial);
		tower.position.set(-60, 24, -50);
		tower.castShadow = true;
		scene.add(tower);
		objects.push(tower);

		var gallery = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 1.5, 8), topMaterial);
		gallery.position.set(-60, 48, -50);
		gallery.castShadow = true;
		scene.add(gallery);
		objects.push(gallery);

		var lanternBowl = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 2, 8), topMaterial);
		lanternBowl.position.set(-60, 50.5, -50);
		lanternBowl.castShadow = true;
		scene.add(lanternBowl);
		objects.push(lanternBowl);

		var lens = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 8), lensMaterial);
		lens.position.set(-60, 51, -50);
		lens.castShadow = true;
		scene.add(lens);
		objects.push(lens);
		animatedObjects.push({ object: lens, type: 'rotate', axis: 'y', speed: 0.08 });

		var top = new THREE.Mesh(new THREE.ConeGeometry(4, 4, 8), baseMaterial);
		top.position.set(-60, 53, -50);
		top.castShadow = true;
		scene.add(top);
		objects.push(top);
	}

	function buildfloor() {
		var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a1a });
		var floor = new THREE.Mesh(new THREE.BoxGeometry(200, 0.5, 200), floorMaterial);
		floor.position.set(0, -0.25, 0);
		floor.receiveShadow = true;
		scene.add(floor);
		objects.push(floor);
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < animatedObjects.length; i++) {
			var anim = animatedObjects[i];

			if (anim.type === 'firepulse') {
				var pulse = Math.sin(time * 3.5 + i) * 0.5 + 0.5;
				anim.object.scale.set(
					anim.baseScale + (anim.maxScale - anim.baseScale) * pulse,
					anim.baseScale + (anim.maxScale - anim.baseScale) * pulse,
					anim.baseScale + (anim.maxScale - anim.baseScale) * pulse
				);
			}

			if (anim.type === 'rotate') {
				if (anim.axis === 'y') {
					anim.object.rotation.y += anim.speed * delta;
				}
				if (anim.axis === 'z') {
					anim.object.rotation.z += anim.speed * delta;
				}
			}

			if (anim.type === 'circle') {
				var offset = anim.offset || 0;
				var angle = time * anim.speed + offset;
				anim.object.position.x = anim.center[0] + Math.cos(angle) * anim.radius;
				anim.object.position.z = anim.center[2] + Math.sin(angle) * anim.radius;
				anim.object.rotation.y = angle + Math.PI / 2;
			}
		}
	}

	function reset() {
		for (var i = objects.length - 1; i >= 0; i--) {
			scene.remove(objects[i]);
		}
		for (var j = lights.length - 1; j >= 0; j--) {
			scene.remove(lights[j]);
		}
		objects = [];
		lights = [];
		animatedObjects = [];
		scene = null;
		camera = null;
		time = 0;
	}

	buildfloor();

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
