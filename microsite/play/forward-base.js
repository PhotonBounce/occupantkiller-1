window.ForwardBase = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var lights = [];
	var animatedElements = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedElements = [];

		buildlighting();
		buildcentertent();
		buildresupplyarea();
		buildhelipads();
		builddefenses();
		buildmortarposition();
		buildresidences();
		buildsupplydrop();
	}

	function buildlighting() {
		var ambientLight = new THREE.AmbientLight(0xcccccc, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
		sunLight.position.set(100, 150, 100);
		sunLight.castShadow = true;
		sunLight.shadow.mapSize.width = 2048;
		sunLight.shadow.mapSize.height = 2048;
		scene.add(sunLight);
		lights.push(sunLight);

		var spotLight = new THREE.SpotLight(0xffff99, 0.5);
		spotLight.position.set(0, 80, 0);
		spotLight.target.position.set(0, 0, 0);
		scene.add(spotLight);
		lights.push(spotLight);
	}

	function buildcentertent() {
		var tentFrameGeometry = new THREE.CylinderGeometry(40, 40, 30, 6);
		var tentFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
		var tentFrame = new THREE.Mesh(tentFrameGeometry, tentFrameMaterial);
		tentFrame.position.set(0, 15, 0);
		tentFrame.castShadow = true;
		tentFrame.receiveShadow = true;
		scene.add(tentFrame);
		objects.push(tentFrame);

		var roofGeometry = new THREE.ConeGeometry(45, 25, 8);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x556b2f });
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(0, 45, 0);
		roof.castShadow = true;
		roof.receiveShadow = true;
		scene.add(roof);
		objects.push(roof);

		var flagpoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 50, 8);
		var flagpoleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var flagpole = new THREE.Mesh(flagpoleGeometry, flagpoleMaterial);
		flagpole.position.set(45, 25, 0);
		flagpole.castShadow = true;
		scene.add(flagpole);
		objects.push(flagpole);

		var flagGeometry = new THREE.BoxGeometry(20, 12, 0.5);
		var flagMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		var flag = new THREE.Mesh(flagGeometry, flagMaterial);
		flag.position.set(58, 35, 0);
		flag.castShadow = true;
		scene.add(flag);
		objects.push(flag);
		animatedElements.push({ object: flag, type: 'flag', baseRotation: 0, amplitude: 0.4, speed: 3 });

		var tentSupport1Geometry = new THREE.CylinderGeometry(1, 1, 30, 4);
		var tentSupportMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var tentSupport1 = new THREE.Mesh(tentSupport1Geometry, tentSupportMaterial);
		tentSupport1.position.set(30, 15, 30);
		tentSupport1.castShadow = true;
		scene.add(tentSupport1);
		objects.push(tentSupport1);

		var tentSupport2 = new THREE.Mesh(tentSupport1Geometry, tentSupportMaterial);
		tentSupport2.position.set(-30, 15, 30);
		tentSupport2.castShadow = true;
		scene.add(tentSupport2);
		objects.push(tentSupport2);

		var tentSupport3 = new THREE.Mesh(tentSupport1Geometry, tentSupportMaterial);
		tentSupport3.position.set(30, 15, -30);
		tentSupport3.castShadow = true;
		scene.add(tentSupport3);
		objects.push(tentSupport3);

		var tentSupport4 = new THREE.Mesh(tentSupport1Geometry, tentSupportMaterial);
		tentSupport4.position.set(-30, 15, -30);
		tentSupport4.castShadow = true;
		scene.add(tentSupport4);
		objects.push(tentSupport4);
	}

	function buildresupplyarea() {
		var ammunitionBoxGeometry = new THREE.BoxGeometry(15, 10, 12);
		var ammunitionMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });

		var ammoBox1 = new THREE.Mesh(ammunitionBoxGeometry, ammunitionMaterial);
		ammoBox1.position.set(60, 5, -50);
		ammoBox1.castShadow = true;
		ammoBox1.receiveShadow = true;
		scene.add(ammoBox1);
		objects.push(ammoBox1);

		var ammoBox2 = new THREE.Mesh(ammunitionBoxGeometry, ammunitionMaterial);
		ammoBox2.position.set(75, 5, -50);
		ammoBox2.castShadow = true;
		ammoBox2.receiveShadow = true;
		scene.add(ammoBox2);
		objects.push(ammoBox2);

		var ammoBox3 = new THREE.Mesh(ammunitionBoxGeometry, ammunitionMaterial);
		ammoBox3.position.set(90, 5, -50);
		ammoBox3.castShadow = true;
		ammoBox3.receiveShadow = true;
		scene.add(ammoBox3);
		objects.push(ammoBox3);

		var ammoBox4 = new THREE.Mesh(ammunitionBoxGeometry, ammunitionMaterial);
		ammoBox4.position.set(60, 16, -50);
		ammoBox4.castShadow = true;
		ammoBox4.receiveShadow = true;
		scene.add(ammoBox4);
		objects.push(ammoBox4);

		var shelfGeometry = new THREE.BoxGeometry(50, 2, 12);
		var shelfMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var shelf1 = new THREE.Mesh(shelfGeometry, shelfMaterial);
		shelf1.position.set(75, 12, -60);
		shelf1.castShadow = true;
		scene.add(shelf1);
		objects.push(shelf1);

		var shelf2 = new THREE.Mesh(shelfGeometry, shelfMaterial);
		shelf2.position.set(75, 25, -60);
		shelf2.castShadow = true;
		scene.add(shelf2);
		objects.push(shelf2);

		var shelfSupport1Geometry = new THREE.CylinderGeometry(1.5, 1.5, 28, 4);
		var shelfSupportMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var shelfSupport1 = new THREE.Mesh(shelfSupport1Geometry, shelfSupportMaterial);
		shelfSupport1.position.set(50, 13, -60);
		shelfSupport1.castShadow = true;
		scene.add(shelfSupport1);
		objects.push(shelfSupport1);

		var shelfSupport2 = new THREE.Mesh(shelfSupport1Geometry, shelfSupportMaterial);
		shelfSupport2.position.set(100, 13, -60);
		shelfSupport2.castShadow = true;
		scene.add(shelfSupport2);
		objects.push(shelfSupport2);
	}

	function buildhelipads() {
		var helipadMarkingGeometry = new THREE.CylinderGeometry(35, 35, 0.5, 4);
		var helipadMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
		var helipad = new THREE.Mesh(helipadMarkingGeometry, helipadMaterial);
		helipad.position.set(-80, 0.3, 80);
		helipad.receiveShadow = true;
		scene.add(helipad);
		objects.push(helipad);

		var crossBar1Geometry = new THREE.BoxGeometry(60, 1, 3);
		var crossMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		var crossBar1 = new THREE.Mesh(crossBar1Geometry, crossMaterial);
		crossBar1.position.set(-80, 0.5, 80);
		crossBar1.castShadow = true;
		scene.add(crossBar1);
		objects.push(crossBar1);

		var crossBar2 = new THREE.Mesh(crossBar1Geometry, crossMaterial);
		crossBar2.rotation.z = Math.PI / 2;
		crossBar2.position.set(-80, 0.5, 80);
		crossBar2.castShadow = true;
		scene.add(crossBar2);
		objects.push(crossBar2);

		var helicopterBodyGeometry = new THREE.BoxGeometry(15, 8, 30);
		var helicopterMaterial = new THREE.MeshLambertMaterial({ color: 0x006400 });
		var helicopterBody = new THREE.Mesh(helicopterBodyGeometry, helicopterMaterial);
		helicopterBody.position.set(-80, 20, 80);
		helicopterBody.castShadow = true;
		scene.add(helicopterBody);
		objects.push(helicopterBody);

		var cockpitGeometry = new THREE.SphereGeometry(6, 8, 8);
		var cockpitMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
		cockpit.position.set(-80, 28, 60);
		cockpit.scale.set(0.8, 0.6, 1);
		cockpit.castShadow = true;
		scene.add(cockpit);
		objects.push(cockpit);

		var rotorMastGeometry = new THREE.CylinderGeometry(2, 2, 15, 4);
		var rotorMastMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var rotorMast = new THREE.Mesh(rotorMastGeometry, rotorMastMaterial);
		rotorMast.position.set(-80, 30, 70);
		rotorMast.castShadow = true;
		scene.add(rotorMast);
		objects.push(rotorMast);

		var rotorBladeGeometry = new THREE.BoxGeometry(60, 1, 8);
		var rotorBladeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var rotorBlade = new THREE.Mesh(rotorBladeGeometry, rotorBladeMaterial);
		rotorBlade.position.set(-80, 45, 70);
		rotorBlade.castShadow = true;
		scene.add(rotorBlade);
		objects.push(rotorBlade);
		animatedElements.push({ object: rotorBlade, type: 'rotor', speed: 15 });

		var tailBoomGeometry = new THREE.CylinderGeometry(2, 2, 40, 4);
		var tailBoomMaterial = new THREE.MeshLambertMaterial({ color: 0x006400 });
		var tailBoom = new THREE.Mesh(tailBoomGeometry, tailBoomMaterial);
		tailBoom.position.set(-80, 18, 40);
		tailBoom.castShadow = true;
		scene.add(tailBoom);
		objects.push(tailBoom);

		var tailRotorGeometry = new THREE.BoxGeometry(20, 1, 4);
		var tailRotor = new THREE.Mesh(tailRotorGeometry, rotorBladeMaterial);
		tailRotor.position.set(-80, 25, 0);
		tailRotor.castShadow = true;
		scene.add(tailRotor);
		objects.push(tailRotor);
		animatedElements.push({ object: tailRotor, type: 'rotor', speed: 20 });

		var landingSkidGeometry = new THREE.CylinderGeometry(1, 1, 50, 4);
		var skidMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var landingSkid1 = new THREE.Mesh(landingSkidGeometry, skidMaterial);
		landingSkid1.position.set(-60, 12, 80);
		landingSkid1.rotation.z = Math.PI / 6;
		landingSkid1.castShadow = true;
		scene.add(landingSkid1);
		objects.push(landingSkid1);

		var landingSkid2 = new THREE.Mesh(landingSkidGeometry, skidMaterial);
		landingSkid2.position.set(-100, 12, 80);
		landingSkid2.rotation.z = -Math.PI / 6;
		landingSkid2.castShadow = true;
		scene.add(landingSkid2);
		objects.push(landingSkid2);
	}

	function builddefenses() {
		var sandbagGeometry = new THREE.BoxGeometry(8, 5, 6);
		var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xa0a08d });

		var baseX = 0;
		var baseZ = 0;
		var radius = 120;
		var sandbagCount = 16;

		for (var i = 0; i < sandbagCount; i++) {
			var angle = (i / sandbagCount) * Math.PI * 2;
			var x = baseX + Math.cos(angle) * radius;
			var z = baseZ + Math.sin(angle) * radius;

			var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
			sandbag.position.set(x, 2.5, z);
			sandbag.castShadow = true;
			sandbag.receiveShadow = true;
			scene.add(sandbag);
			objects.push(sandbag);

			if (i % 3 === 0) {
				var sandbag2 = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
				sandbag2.position.set(x, 7.5, z);
				sandbag2.castShadow = true;
				sandbag2.receiveShadow = true;
				scene.add(sandbag2);
				objects.push(sandbag2);
			}
		}

		var concertinaWireGeometry = new THREE.CylinderGeometry(5, 5, 2, 6);
		var wireMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

		for (var j = 0; j < 12; j++) {
			var wireAngle = (j / 12) * Math.PI * 2;
			var wireX = Math.cos(wireAngle) * 140;
			var wireZ = Math.sin(wireAngle) * 140;

			var wire = new THREE.Mesh(concertinaWireGeometry, wireMaterial);
			wire.position.set(wireX, 3, wireZ);
			wire.scale.set(1.5, 1.5, 1);
			wire.castShadow = true;
			scene.add(wire);
			objects.push(wire);
		}
	}

	function buildmortarposition() {
		var basePlateGeometry = new THREE.CylinderGeometry(12, 12, 1, 8);
		var basePlateMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var basePlate = new THREE.Mesh(basePlateGeometry, basePlateMaterial);
		basePlate.position.set(120, 0.5, -120);
		basePlate.receiveShadow = true;
		scene.add(basePlate);
		objects.push(basePlate);

		var tripodLeg1Geometry = new THREE.CylinderGeometry(0.8, 0.8, 20, 4);
		var tripodMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var tripodLeg1 = new THREE.Mesh(tripodLeg1Geometry, tripodMaterial);
		tripodLeg1.position.set(110, 10, -110);
		tripodLeg1.rotation.z = Math.PI / 5;
		tripodLeg1.castShadow = true;
		scene.add(tripodLeg1);
		objects.push(tripodLeg1);

		var tripodLeg2 = new THREE.Mesh(tripodLeg1Geometry, tripodMaterial);
		tripodLeg2.position.set(130, 10, -110);
		tripodLeg2.rotation.z = -Math.PI / 5;
		tripodLeg2.castShadow = true;
		scene.add(tripodLeg2);
		objects.push(tripodLeg2);

		var tripodLeg3 = new THREE.Mesh(tripodLeg1Geometry, tripodMaterial);
		tripodLeg3.position.set(120, 10, -130);
		tripodLeg3.rotation.x = Math.PI / 5;
		tripodLeg3.castShadow = true;
		scene.add(tripodLeg3);
		objects.push(tripodLeg3);

		var mortarTubeGeometry = new THREE.CylinderGeometry(3, 3.5, 35, 6);
		var mortarMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var mortarTube = new THREE.Mesh(mortarTubeGeometry, mortarMaterial);
		mortarTube.position.set(120, 15, -120);
		mortarTube.rotation.z = Math.PI / 4;
		mortarTube.castShadow = true;
		scene.add(mortarTube);
		objects.push(mortarTube);
		animatedElements.push({ object: mortarTube, type: 'mortar', baseRotation: Math.PI / 4, speed: 1 });

		var breeechBlockGeometry = new THREE.SphereGeometry(4, 6, 6);
		var breeechMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var breechBlock = new THREE.Mesh(breeechBlockGeometry, breeechMaterial);
		breechBlock.position.set(120, 9, -120);
		breechBlock.castShadow = true;
		scene.add(breechBlock);
		objects.push(breechBlock);

		var ammoRackGeometry = new THREE.BoxGeometry(10, 15, 8);
		var ammoRackMaterial = new THREE.MeshLambertMaterial({ color: 0x2f2f2f });
		var ammoRack = new THREE.Mesh(ammoRackGeometry, ammoRackMaterial);
		ammoRack.position.set(100, 7.5, -120);
		ammoRack.castShadow = true;
		ammoRack.receiveShadow = true;
		scene.add(ammoRack);
		objects.push(ammoRack);
	}

	function buildresidences() {
		var prefabWallGeometry = new THREE.BoxGeometry(30, 20, 2);
		var prefabMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });

		var barrack1WallNorth = new THREE.Mesh(prefabWallGeometry, prefabMaterial);
		barrack1WallNorth.position.set(-80, 10, -120);
		barrack1WallNorth.castShadow = true;
		barrack1WallNorth.receiveShadow = true;
		scene.add(barrack1WallNorth);
		objects.push(barrack1WallNorth);

		var barrack1WallSouth = new THREE.Mesh(prefabWallGeometry, prefabMaterial);
		barrack1WallSouth.position.set(-80, 10, -90);
		barrack1WallSouth.castShadow = true;
		barrack1WallSouth.receiveShadow = true;
		scene.add(barrack1WallSouth);
		objects.push(barrack1WallSouth);

		var barrack1WallEast = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 30), prefabMaterial);
		barrack1WallEast.position.set(-65, 10, -105);
		barrack1WallEast.castShadow = true;
		barrack1WallEast.receiveShadow = true;
		scene.add(barrack1WallEast);
		objects.push(barrack1WallEast);

		var barrack1WallWest = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 30), prefabMaterial);
		barrack1WallWest.position.set(-95, 10, -105);
		barrack1WallWest.castShadow = true;
		barrack1WallWest.receiveShadow = true;
		scene.add(barrack1WallWest);
		objects.push(barrack1WallWest);

		var barrack1RoofGeometry = new THREE.BoxGeometry(32, 2, 32);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var barrack1Roof = new THREE.Mesh(barrack1RoofGeometry, roofMaterial);
		barrack1Roof.position.set(-80, 21, -105);
		barrack1Roof.castShadow = true;
		barrack1Roof.receiveShadow = true;
		scene.add(barrack1Roof);
		objects.push(barrack1Roof);

		var doorGeometry = new THREE.BoxGeometry(8, 12, 1);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
		var door1 = new THREE.Mesh(doorGeometry, doorMaterial);
		door1.position.set(-80, 6, -90.5);
		door1.castShadow = true;
		scene.add(door1);
		objects.push(door1);

		var windowGeometry = new THREE.BoxGeometry(6, 5, 1);
		var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x4da6ff });
		var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
		window1.position.set(-95, 12, -90.5);
		window1.castShadow = true;
		scene.add(window1);
		objects.push(window1);

		var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
		window2.position.set(-65, 12, -90.5);
		window2.castShadow = true;
		scene.add(window2);
		objects.push(window2);

		var geneartorGeometry = new THREE.BoxGeometry(8, 8, 8);
		var generatorMaterial = new THREE.MeshLambertMaterial({ color: 0x4d4d4d });
		var generator = new THREE.Mesh(geneartorGeometry, generatorMaterial);
		generator.position.set(-60, 4, -140);
		generator.castShadow = true;
		generator.receiveShadow = true;
		scene.add(generator);
		objects.push(generator);

		var generatorStackGeometry = new THREE.CylinderGeometry(2, 2, 15, 4);
		var stackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var generatorStack = new THREE.Mesh(generatorStackGeometry, stackMaterial);
		generatorStack.position.set(-60, 15, -140);
		generatorStack.castShadow = true;
		scene.add(generatorStack);
		objects.push(generatorStack);
	}

	function buildsupplydrop() {
		var parachuteGeometry = new THREE.ConeGeometry(25, 5, 8);
		var parachuteMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
		var parachute1 = new THREE.Mesh(parachuteGeometry, parachuteMaterial);
		parachute1.position.set(-120, 45, 50);
		parachute1.castShadow = true;
		scene.add(parachute1);
		objects.push(parachute1);

		var cargoPodGeometry = new THREE.BoxGeometry(12, 20, 12);
		var cargoPodMaterial = new THREE.MeshLambertMaterial({ color: 0x336600 });
		var cargoPod1 = new THREE.Mesh(cargoPodGeometry, cargoPodMaterial);
		cargoPod1.position.set(-120, 15, 50);
		cargoPod1.castShadow = true;
		cargoPod1.receiveShadow = true;
		scene.add(cargoPod1);
		objects.push(cargoPod1);

		var ropeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 30, 3);
		var ropeMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
		var rope1 = new THREE.Mesh(ropeGeometry, ropeMaterial);
		rope1.position.set(-110, 30, 50);
		rope1.castShadow = true;
		scene.add(rope1);
		objects.push(rope1);

		var rope2 = new THREE.Mesh(ropeGeometry, ropeMaterial);
		rope2.position.set(-130, 30, 50);
		rope2.castShadow = true;
		scene.add(rope2);
		objects.push(rope2);

		var parachute2 = new THREE.Mesh(parachuteGeometry, new THREE.MeshLambertMaterial({ color: 0x6b6bff }));
		parachute2.position.set(100, 52, 60);
		parachute2.castShadow = true;
		scene.add(parachute2);
		objects.push(parachute2);

		var cargoPod2 = new THREE.Mesh(cargoPodGeometry, cargoPodMaterial);
		cargoPod2.position.set(100, 20, 60);
		cargoPod2.castShadow = true;
		cargoPod2.receiveShadow = true;
		scene.add(cargoPod2);
		objects.push(cargoPod2);

		var rope3 = new THREE.Mesh(ropeGeometry, ropeMaterial);
		rope3.position.set(90, 35, 60);
		rope3.castShadow = true;
		scene.add(rope3);
		objects.push(rope3);

		var rope4 = new THREE.Mesh(ropeGeometry, ropeMaterial);
		rope4.position.set(110, 35, 60);
		rope4.castShadow = true;
		scene.add(rope4);
		objects.push(rope4);

		var treeGeometry = new THREE.CylinderGeometry(3, 4, 50, 6);
		var treeMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
		var tree1 = new THREE.Mesh(treeGeometry, treeMaterial);
		tree1.position.set(-100, 25, 80);
		tree1.castShadow = true;
		scene.add(tree1);
		objects.push(tree1);

		var foliageGeometry = new THREE.SphereGeometry(20, 6, 6);
		var foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
		var foliage1 = new THREE.Mesh(foliageGeometry, foliageMaterial);
		foliage1.position.set(-100, 60, 80);
		foliage1.castShadow = true;
		scene.add(foliage1);
		objects.push(foliage1);

		var tree2 = new THREE.Mesh(treeGeometry, treeMaterial);
		tree2.position.set(80, 25, 100);
		tree2.castShadow = true;
		scene.add(tree2);
		objects.push(tree2);

		var foliage2 = new THREE.Mesh(foliageGeometry, foliageMaterial);
		foliage2.position.set(80, 60, 100);
		foliage2.castShadow = true;
		scene.add(foliage2);
		objects.push(foliage2);
	}

	function update(delta) {
		for (var i = 0; i < animatedElements.length; i++) {
			var element = animatedElements[i];

			if (element.type === 'rotor') {
				element.object.rotation.y += element.speed * delta;
			} else if (element.type === 'flag') {
				element.object.rotation.z = element.baseRotation + Math.sin(Date.now() * 0.001 * element.speed) * element.amplitude;
			} else if (element.type === 'mortar') {
				element.object.rotation.z = element.baseRotation + Math.sin(Date.now() * 0.0005) * 0.15;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}

		objects = [];
		lights = [];
		animatedElements = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
