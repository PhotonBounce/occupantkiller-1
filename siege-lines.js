window.SiegeLines = (function() {
	'use strict';

	var scene = null;
	var camera = null;

	var objects = [];
	var lights = [];
	var animatedObjects = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];

		buildlighting();
		buildgroundterrain();
		builddefendertrench();
		buildattackertrench();
		buildnomans();
		buildartillery();
		buildforwardobservation();
		buildperiscopes();
		buildammosupply();
		buildcommandtunnels();
		buildrruinedhouse();
	}

	function buildlighting() {
		var ambientLight = new THREE.AmbientLight(0x5a5a5a, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xcccccc, 0.8);
		directionalLight.position.set(50, 60, 50);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var spotLight1 = new THREE.SpotLight(0xffaa44, 0.4);
		spotLight1.position.set(-80, 40, 0);
		spotLight1.target.position.set(-50, 0, 0);
		scene.add(spotLight1);
		lights.push(spotLight1);

		var spotLight2 = new THREE.SpotLight(0xffaa44, 0.4);
		spotLight2.position.set(80, 40, 0);
		spotLight2.target.position.set(50, 0, 0);
		scene.add(spotLight2);
		lights.push(spotLight2);
	}

	function buildgroundterrain() {
		var mudMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3f2f });
		var grassMaterial = new THREE.MeshLambertMaterial({ color: 0x3d5a3d });

		var groundGeometry = new THREE.BoxGeometry(300, 2, 300);
		var ground = new THREE.Mesh(groundGeometry, mudMaterial);
		ground.position.y = -1;
		ground.receiveShadow = true;
		scene.add(ground);
		objects.push(ground);

		var grassPatch1 = new THREE.BoxGeometry(80, 2, 60);
		var grass1 = new THREE.Mesh(grassPatch1, grassMaterial);
		grass1.position.set(-100, -1, -80);
		grass1.receiveShadow = true;
		scene.add(grass1);
		objects.push(grass1);

		var grassPatch2 = new THREE.BoxGeometry(80, 2, 60);
		var grass2 = new THREE.Mesh(grassPatch2, grassMaterial);
		grass2.position.set(100, -1, 80);
		grass2.receiveShadow = true;
		scene.add(grass2);
		objects.push(grass2);
	}

	function builddefendertrench() {
		var trenchMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
		var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x6b5d47 });
		var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });

		var maintrench = new THREE.BoxGeometry(120, 8, 12);
		var trench1 = new THREE.Mesh(maintrench, trenchMaterial);
		trench1.position.set(-60, 0, -60);
		trench1.castShadow = true;
		trench1.receiveShadow = true;
		scene.add(trench1);
		objects.push(trench1);

		var branchtrench1 = new THREE.BoxGeometry(20, 8, 60);
		var trench2 = new THREE.Mesh(branchtrench1, trenchMaterial);
		trench2.position.set(-100, 0, -30);
		trench2.castShadow = true;
		trench2.receiveShadow = true;
		scene.add(trench2);
		objects.push(trench2);

		var branchtrench2 = new THREE.BoxGeometry(20, 8, 60);
		var trench3 = new THREE.Mesh(branchtrench2, trenchMaterial);
		trench3.position.set(-20, 0, -30);
		trench3.castShadow = true;
		trench3.receiveShadow = true;
		scene.add(trench3);
		objects.push(trench3);

		for (var i = 0; i < 8; i = i + 1) {
			var sandbag = new THREE.BoxGeometry(4, 3, 4);
			var bag = new THREE.Mesh(sandbag, sandbagMaterial);
			bag.position.set(-70 + i * 15, 4, -55);
			bag.castShadow = true;
			scene.add(bag);
			objects.push(bag);
		}

		for (var j = 0; j < 6; j = j + 1) {
			var sandbag2 = new THREE.BoxGeometry(4, 3, 4);
			var bag2 = new THREE.Mesh(sandbag2, sandbagMaterial);
			bag2.position.set(-95, 4, -50 + j * 12);
			bag2.castShadow = true;
			scene.add(bag2);
			objects.push(bag2);
		}

		var fireStep1 = new THREE.BoxGeometry(100, 2, 4);
		var step1 = new THREE.Mesh(fireStep1, woodMaterial);
		step1.position.set(-60, 2, -52);
		step1.castShadow = true;
		scene.add(step1);
		objects.push(step1);

		var fireStep2 = new THREE.BoxGeometry(15, 2, 40);
		var step2 = new THREE.Mesh(fireStep2, woodMaterial);
		step2.position.set(-100, 2, -30);
		step2.castShadow = true;
		scene.add(step2);
		objects.push(step2);

		var fireStep3 = new THREE.BoxGeometry(15, 2, 40);
		var step3 = new THREE.Mesh(fireStep3, woodMaterial);
		step3.position.set(-20, 2, -30);
		step3.castShadow = true;
		scene.add(step3);
		objects.push(step3);
	}

	function buildattackertrench() {
		var trenchMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
		var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x6b5d47 });
		var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });

		var maintrench = new THREE.BoxGeometry(120, 8, 12);
		var trench1 = new THREE.Mesh(maintrench, trenchMaterial);
		trench1.position.set(60, 0, 60);
		trench1.castShadow = true;
		trench1.receiveShadow = true;
		scene.add(trench1);
		objects.push(trench1);

		var branchtrench1 = new THREE.BoxGeometry(20, 8, 60);
		var trench2 = new THREE.Mesh(branchtrench1, trenchMaterial);
		trench2.position.set(100, 0, 30);
		trench2.castShadow = true;
		trench2.receiveShadow = true;
		scene.add(trench2);
		objects.push(trench2);

		var branchtrench2 = new THREE.BoxGeometry(20, 8, 60);
		var trench3 = new THREE.Mesh(branchtrench2, trenchMaterial);
		trench3.position.set(20, 0, 30);
		trench3.castShadow = true;
		trench3.receiveShadow = true;
		scene.add(trench3);
		objects.push(trench3);

		for (var i = 0; i < 8; i = i + 1) {
			var sandbag = new THREE.BoxGeometry(4, 3, 4);
			var bag = new THREE.Mesh(sandbag, sandbagMaterial);
			bag.position.set(70 - i * 15, 4, 55);
			bag.castShadow = true;
			scene.add(bag);
			objects.push(bag);
		}

		for (var j = 0; j < 6; j = j + 1) {
			var sandbag2 = new THREE.BoxGeometry(4, 3, 4);
			var bag2 = new THREE.Mesh(sandbag2, sandbagMaterial);
			bag2.position.set(95, 4, 50 - j * 12);
			bag2.castShadow = true;
			scene.add(bag2);
			objects.push(bag2);
		}

		var fireStep1 = new THREE.BoxGeometry(100, 2, 4);
		var step1 = new THREE.Mesh(fireStep1, woodMaterial);
		step1.position.set(60, 2, 52);
		step1.castShadow = true;
		scene.add(step1);
		objects.push(step1);

		var fireStep2 = new THREE.BoxGeometry(15, 2, 40);
		var step2 = new THREE.Mesh(fireStep2, woodMaterial);
		step2.position.set(100, 2, 30);
		step2.castShadow = true;
		scene.add(step2);
		objects.push(step2);

		var fireStep3 = new THREE.BoxGeometry(15, 2, 40);
		var step3 = new THREE.Mesh(fireStep3, woodMaterial);
		step3.position.set(20, 2, 30);
		step3.castShadow = true;
		scene.add(step3);
		objects.push(step3);
	}

	function buildnomans() {
		var barbedwire = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var craterMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2520 });

		for (var i = 0; i < 5; i = i + 1) {
			var wire1 = new THREE.CylinderGeometry(0.3, 0.3, 100, 8);
			var w1 = new THREE.Mesh(wire1, barbedwire);
			w1.position.set(-50 + i * 25, 1, 0);
			w1.rotation.z = 1.5708;
			w1.castShadow = true;
			scene.add(w1);
			objects.push(w1);
		}

		for (var j = 0; j < 5; j = j + 1) {
			var wire2 = new THREE.CylinderGeometry(0.3, 0.3, 100, 8);
			var w2 = new THREE.Mesh(wire2, barbedwire);
			w2.position.set(-50 + j * 25, 3, 0);
			w2.rotation.z = 1.5708;
			w2.castShadow = true;
			scene.add(w2);
			objects.push(w2);
		}

		for (var k = 0; k < 4; k = k + 1) {
			var craterGeo = new THREE.SphereGeometry(8, 16, 16);
			var crater = new THREE.Mesh(craterGeo, craterMaterial);
			crater.position.set(-40 + k * 30, -4, 0);
			crater.scale.y = 0.5;
			crater.castShadow = true;
			crater.receiveShadow = true;
			scene.add(crater);
			objects.push(crater);
		}

		for (var m = 0; m < 3; m = m + 1) {
			var debris = new THREE.BoxGeometry(6, 2, 4);
			var deb = new THREE.Mesh(debris, craterMaterial);
			deb.position.set(-45 + m * 50, 0, 8 + m * 3);
			deb.rotation.y = Math.random() * 6.28;
			deb.castShadow = true;
			scene.add(deb);
			objects.push(deb);
		}

		for (var n = 0; n < 3; n = n + 1) {
			var debris2 = new THREE.BoxGeometry(6, 2, 4);
			var deb2 = new THREE.Mesh(debris2, craterMaterial);
			deb2.position.set(-45 + n * 50, 0, -8 - n * 3);
			deb2.rotation.y = Math.random() * 6.28;
			deb2.castShadow = true;
			scene.add(deb2);
			objects.push(deb2);
		}
	}

	function buildartillery() {
		var gunmetalMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });

		for (var i = 0; i < 3; i = i + 1) {
			var barrel = new THREE.CylinderGeometry(1.2, 1.0, 18, 12);
			var gun = new THREE.Mesh(barrel, gunmetalMaterial);
			gun.position.set(-100 + i * 40, 8, -100);
			gun.rotation.z = 0.4;
			gun.castShadow = true;
			scene.add(gun);
			objects.push(gun);

			var breech = new THREE.SphereGeometry(2.5, 16, 16);
			var breach = new THREE.Mesh(breech, gunmetalMaterial);
			breach.position.set(-100 + i * 40, 5, -100);
			breach.castShadow = true;
			scene.add(breach);
			objects.push(breach);

			var animObj = {
				mesh: gun,
				origRotation: 0.4,
				type: 'artillery'
			};
			animatedObjects.push(animObj);

			var carriage = new THREE.BoxGeometry(6, 3, 8);
			var car = new THREE.Mesh(carriage, woodMaterial);
			car.position.set(-100 + i * 40, 2, -100);
			car.castShadow = true;
			scene.add(car);
			objects.push(car);

			for (var j = 0; j < 2; j = j + 1) {
				var wheel = new THREE.CylinderGeometry(2, 2, 1.5, 16);
				var w = new THREE.Mesh(wheel, gunmetalMaterial);
				w.position.set(-100 + i * 40 - 2.5 + j * 5, 1.5, -100 + 3);
				w.rotation.z = 1.5708;
				w.castShadow = true;
				scene.add(w);
				objects.push(w);
			}

			for (var k = 0; k < 2; k = k + 1) {
				var wheel2 = new THREE.CylinderGeometry(2, 2, 1.5, 16);
				var w2 = new THREE.Mesh(wheel2, gunmetalMaterial);
				w2.position.set(-100 + i * 40 - 2.5 + k * 5, 1.5, -100 - 3);
				w2.rotation.z = 1.5708;
				w2.castShadow = true;
				scene.add(w2);
				objects.push(w2);
			}
		}

		for (var i = 0; i < 3; i = i + 1) {
			var ammoStack = new THREE.BoxGeometry(5, 12, 5);
			var ammo = new THREE.Mesh(ammoStack, gunmetalMaterial);
			ammo.position.set(-90 + i * 40, 6, -110);
			ammo.castShadow = true;
			scene.add(ammo);
			objects.push(ammo);
		}
	}

	function buildforwardobservation() {
		var concretemat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var steelmat = new THREE.MeshLambertMaterial({ color: 0x333333 });

		for (var i = 0; i < 2; i = i + 1) {
			var bunker = new THREE.BoxGeometry(10, 6, 12);
			var bunk = new THREE.Mesh(bunker, concretemat);
			bunk.position.set(-70 + i * 140, 0, -35);
			bunk.castShadow = true;
			bunk.receiveShadow = true;
			scene.add(bunk);
			objects.push(bunk);

			var roof = new THREE.BoxGeometry(12, 2, 14);
			var rof = new THREE.Mesh(roof, concretemat);
			rof.position.set(-70 + i * 140, 6, -35);
			rof.castShadow = true;
			scene.add(rof);
			objects.push(rof);

			var slit1 = new THREE.BoxGeometry(3, 2, 1);
			var sl1 = new THREE.Mesh(slit1, steelmat);
			sl1.position.set(-70 + i * 140 - 3, 2, -41);
			sl1.castShadow = true;
			scene.add(sl1);
			objects.push(sl1);

			var slit2 = new THREE.BoxGeometry(3, 2, 1);
			var sl2 = new THREE.Mesh(slit2, steelmat);
			sl2.position.set(-70 + i * 140 + 3, 2, -41);
			sl2.castShadow = true;
			scene.add(sl2);
			objects.push(sl2);
		}
	}

	function buildperiscopes() {
		var steelmat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var glassmat = new THREE.MeshLambertMaterial({ color: 0x555588 });

		for (var i = 0; i < 4; i = i + 1) {
			var tube = new THREE.CylinderGeometry(0.6, 0.6, 8, 12);
			var t = new THREE.Mesh(tube, steelmat);
			t.position.set(-80 + i * 50, 8, -45);
			t.castShadow = true;
			scene.add(t);
			objects.push(t);

			var prism1 = new THREE.BoxGeometry(1.2, 1.2, 1.2);
			var p1 = new THREE.Mesh(prism1, glassmat);
			p1.position.set(-80 + i * 50, 13, -45);
			p1.castShadow = true;
			scene.add(p1);
			objects.push(p1);

			var prism2 = new THREE.SphereGeometry(0.8, 8, 8);
			var p2 = new THREE.Mesh(prism2, glassmat);
			p2.position.set(-80 + i * 50, 2, -45);
			p2.castShadow = true;
			scene.add(p2);
			objects.push(p2);

			var animPeri = {
				mesh: t,
				origRotY: 0,
				type: 'periscope'
			};
			animatedObjects.push(animPeri);
		}
	}

	function buildammosupply() {
		var woodmat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
		var metalmat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

		for (var i = 0; i < 3; i = i + 1) {
			var dugout = new THREE.BoxGeometry(12, 5, 10);
			var dug = new THREE.Mesh(dugout, woodmat);
			dug.position.set(-85 + i * 70, -2, 20);
			dug.castShadow = true;
			dug.receiveShadow = true;
			scene.add(dug);
			objects.push(dug);

			var door = new THREE.BoxGeometry(3, 5, 0.5);
			var dr = new THREE.Mesh(door, metalmat);
			dr.position.set(-85 + i * 70 - 5, 0, 25);
			dr.castShadow = true;
			scene.add(dr);
			objects.push(dr);

			var wagon = new THREE.BoxGeometry(5, 3, 7);
			var wag = new THREE.Mesh(wagon, woodmat);
			wag.position.set(-85 + i * 70 + 8, 2, 20);
			wag.castShadow = true;
			scene.add(wag);
			objects.push(wag);

			for (var j = 0; j < 2; j = j + 1) {
				var wwheel = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
				var ww = new THREE.Mesh(wwheel, metalmat);
				ww.position.set(-85 + i * 70 + 8 - 1.5 + j * 3, 1, 20 + 3);
				ww.rotation.z = 1.5708;
				ww.castShadow = true;
				scene.add(ww);
				objects.push(ww);

				var animWheel = {
					mesh: ww,
					type: 'wheel'
				};
				animatedObjects.push(animWheel);
			}

			for (var k = 0; k < 2; k = k + 1) {
				var wwheel2 = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
				var ww2 = new THREE.Mesh(wwheel2, metalmat);
				ww2.position.set(-85 + i * 70 + 8 - 1.5 + k * 3, 1, 20 - 3);
				ww2.rotation.z = 1.5708;
				ww2.castShadow = true;
				scene.add(ww2);
				objects.push(ww2);

				var animWheel2 = {
					mesh: ww2,
					type: 'wheel'
				};
				animatedObjects.push(animWheel2);
			}

			var crate1 = new THREE.BoxGeometry(3, 2, 3);
			var cr1 = new THREE.Mesh(crate1, woodmat);
			cr1.position.set(-85 + i * 70, 3, 10);
			cr1.castShadow = true;
			scene.add(cr1);
			objects.push(cr1);

			var crate2 = new THREE.BoxGeometry(3, 2, 3);
			var cr2 = new THREE.Mesh(crate2, woodmat);
			cr2.position.set(-85 + i * 70 + 4, 3, 8);
			cr2.castShadow = true;
			scene.add(cr2);
			objects.push(cr2);
		}
	}

	function buildcommandtunnels() {
		var concretemat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var steelmat = new THREE.MeshLambertMaterial({ color: 0x333333 });

		var tunnelLeft = new THREE.BoxGeometry(8, 4, 40);
		var tl = new THREE.Mesh(tunnelLeft, concretemat);
		tl.position.set(-60, -1, 0);
		tl.castShadow = true;
		tl.receiveShadow = true;
		scene.add(tl);
		objects.push(tl);

		var tunnelRight = new THREE.BoxGeometry(8, 4, 40);
		var tr = new THREE.Mesh(tunnelRight, concretemat);
		tr.position.set(60, -1, 0);
		tr.castShadow = true;
		tr.receiveShadow = true;
		scene.add(tr);
		objects.push(tr);

		var centerTunnel = new THREE.BoxGeometry(12, 4, 50);
		var ct = new THREE.Mesh(centerTunnel, concretemat);
		ct.position.set(0, -2, -5);
		ct.castShadow = true;
		ct.receiveShadow = true;
		scene.add(ct);
		objects.push(ct);

		for (var i = 0; i < 8; i = i + 1) {
			var support = new THREE.CylinderGeometry(0.8, 0.8, 3, 12);
			var sup = new THREE.Mesh(support, steelmat);
			sup.position.set(-60 + i * 20, 1, 0);
			sup.castShadow = true;
			scene.add(sup);
			objects.push(sup);
		}

		for (var j = 0; j < 10; j = j + 1) {
			var supportCenter = new THREE.CylinderGeometry(0.8, 0.8, 3, 12);
			var supc = new THREE.Mesh(supportCenter, steelmat);
			supc.position.set(-40 + j * 10, 0.5, -5);
			supc.castShadow = true;
			scene.add(supc);
			objects.push(supc);
		}

		for (var k = 0; k < 3; k = k + 1) {
			var ammoNiche = new THREE.BoxGeometry(4, 3, 4);
			var niche = new THREE.Mesh(ammoNiche, steelmat);
			niche.position.set(-50 + k * 50, 0, -15);
			niche.castShadow = true;
			scene.add(niche);
			objects.push(niche);
		}

		for (var m = 0; m < 3; m = m + 1) {
			var medStation = new THREE.BoxGeometry(6, 2, 5);
			var med = new THREE.Mesh(medStation, steelmat);
			med.position.set(-50 + m * 50, -1, 5);
			med.castShadow = true;
			scene.add(med);
			objects.push(med);
		}
	}

	function buildrruinedhouse() {
		var stonemat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
		var rubblemat = new THREE.MeshLambertMaterial({ color: 0x3a3530 });

		var mainWall1 = new THREE.BoxGeometry(16, 14, 3);
		var w1 = new THREE.Mesh(mainWall1, stonemat);
		w1.position.set(0, 6, 15);
		w1.castShadow = true;
		scene.add(w1);
		objects.push(w1);

		var mainWall2 = new THREE.BoxGeometry(16, 14, 3);
		var w2 = new THREE.Mesh(mainWall2, stonemat);
		w2.position.set(0, 6, -15);
		w2.castShadow = true;
		scene.add(w2);
		objects.push(w2);

		var sideWall1 = new THREE.BoxGeometry(3, 14, 30);
		var w3 = new THREE.Mesh(sideWall1, stonemat);
		w3.position.set(-8, 6, 0);
		w3.castShadow = true;
		scene.add(w3);
		objects.push(w3);

		var sideWall2 = new THREE.BoxGeometry(3, 14, 30);
		var w4 = new THREE.Mesh(sideWall2, stonemat);
		w4.position.set(8, 6, 0);
		w4.castShadow = true;
		scene.add(w4);
		objects.push(w4);

		var roofPart1 = new THREE.ConeGeometry(12, 8, 4);
		var roof1 = new THREE.Mesh(roofPart1, stonemat);
		roof1.position.set(-6, 16, 0);
		roof1.rotation.z = 1.5708;
		roof1.castShadow = true;
		scene.add(roof1);
		objects.push(roof1);

		var roofPart2 = new THREE.ConeGeometry(12, 8, 4);
		var roof2 = new THREE.Mesh(roofPart2, stonemat);
		roof2.position.set(6, 16, 0);
		roof2.rotation.z = -1.5708;
		roof2.castShadow = true;
		scene.add(roof2);
		objects.push(roof2);

		for (var i = 0; i < 4; i = i + 1) {
			var rubble = new THREE.BoxGeometry(4, 3, 5);
			var rub = new THREE.Mesh(rubble, rubblemat);
			rub.position.set(-5 + i * 4, 2, 20 + i);
			rub.rotation.y = Math.random() * 6.28;
			rub.castShadow = true;
			scene.add(rub);
			objects.push(rub);
		}

		for (var j = 0; j < 4; j = j + 1) {
			var rubble2 = new THREE.BoxGeometry(4, 3, 5);
			var rub2 = new THREE.Mesh(rubble2, rubblemat);
			rub2.position.set(-5 + j * 4, 2, -20 - j);
			rub2.rotation.y = Math.random() * 6.28;
			rub2.castShadow = true;
			scene.add(rub2);
			objects.push(rub2);
		}

		var chimney = new THREE.CylinderGeometry(1.5, 1.5, 12, 12);
		var chim = new THREE.Mesh(chimney, stonemat);
		chim.position.set(-5, 10, -8);
		chim.castShadow = true;
		scene.add(chim);
		objects.push(chim);

		var window1 = new THREE.BoxGeometry(3, 3, 1);
		var win1 = new THREE.Mesh(window1, rubblemat);
		win1.position.set(-4, 8, 18);
		win1.castShadow = true;
		scene.add(win1);
		objects.push(win1);

		var window2 = new THREE.BoxGeometry(3, 3, 1);
		var win2 = new THREE.Mesh(window2, rubblemat);
		win2.position.set(4, 8, 18);
		win2.castShadow = true;
		scene.add(win2);
		objects.push(win2);
	}

	function update(delta) {
		for (var i = 0; i < animatedObjects.length; i = i + 1) {
			var obj = animatedObjects[i];

			if (obj.type === 'artillery') {
				var recoilAmount = Math.sin(Date.now() * 0.003) * 0.15;
				obj.mesh.rotation.z = obj.origRotation + recoilAmount;
			}

			if (obj.type === 'periscope') {
				var rotAmount = Math.sin(Date.now() * 0.002) * 0.8;
				obj.mesh.rotation.y = obj.origRotY + rotAmount;
			}

			if (obj.type === 'wheel') {
				obj.mesh.rotation.x = obj.mesh.rotation.x + delta * 3;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i = i + 1) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (var j = 0; j < lights.length; j = j + 1) {
			scene.remove(lights[j]);
		}
		lights = [];

		animatedObjects = [];

		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
});
