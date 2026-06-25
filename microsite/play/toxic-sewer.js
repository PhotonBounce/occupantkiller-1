window.ToxicSewer = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var sewerId = 0;

	var sewerGroup = null;
	var mainChannel = null;
	var sludgeFlow = null;
	var wasteBarrels = null;
	var dumpPipes = null;
	var creatureTrails = null;
	var catwalks = null;
	var gasClouds = null;
	var processingChamber = null;
	var drainGratings = null;
	var warningPanels = null;
	var splashParticles = null;

	var scrollOffset = 0;
	var barrelBobOffset = 0;
	var gasCloudScale = 1;
	var centrifugeRotation = 0;
	var splashLifetimes = [];

	function createMainChannel() {
		var group = new THREE.Group();

		var tunnelLength = 200;
		var tunnelWidth = 40;
		var tunnelHeight = 30;

		var floorMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
		var wallMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a });
		var ceilingMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a });

		var floorGeom = new THREE.BoxGeometry(tunnelWidth, 1, tunnelLength);
		var floor = new THREE.Mesh(floorGeom, floorMat);
		floor.position.y = -tunnelHeight / 2;
		floor.receiveShadow = true;
		group.add(floor);

		var wallGeom = new THREE.BoxGeometry(1, tunnelHeight, tunnelLength);
		var leftWall = new THREE.Mesh(wallGeom, wallMat);
		leftWall.position.x = -tunnelWidth / 2;
		leftWall.receiveShadow = true;
		group.add(leftWall);

		var rightWall = new THREE.Mesh(wallGeom, wallMat);
		rightWall.position.x = tunnelWidth / 2;
		rightWall.receiveShadow = true;
		group.add(rightWall);

		var arcSection = new THREE.CylinderGeometry(tunnelWidth / 2, tunnelWidth / 2, tunnelLength, 8, 16);
		var ceiling = new THREE.Mesh(arcSection, ceilingMat);
		ceiling.position.y = tunnelHeight / 2;
		ceiling.receiveShadow = true;
		group.add(ceiling);

		mainChannel = group;
		return group;
	}

	function createSludgeFlow() {
		var group = new THREE.Group();
		var sludgeMat = new THREE.MeshStandardMaterial({ color: 0x3a8a1a, emissive: 0x2a5a0a });

		var blockSize = 8;
		var numBlocks = 50;
		var flowSpacing = 5;

		for (var i = 0; i < numBlocks; i++) {
			var blockGeom = new THREE.BoxGeometry(30, 2, blockSize);
			var block = new THREE.Mesh(blockGeom, sludgeMat);
			block.position.z = i * flowSpacing - 100;
			block.position.y = -12;
			block.userData.initialZ = block.position.z;
			block.userData.blockIndex = i;
			block.castShadow = true;
			group.add(block);
		}

		sludgeFlow = group;
		return group;
	}

	function createWasteBarrels() {
		var group = new THREE.Group();
		var barrelMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x663300 });

		var numBarrels = 12;
		for (var i = 0; i < numBarrels; i++) {
			var barrelGeom = new THREE.CylinderGeometry(2, 2, 4, 8);
			var barrel = new THREE.Mesh(barrelGeom, barrelMat);
			barrel.position.x = (Math.random() - 0.5) * 25;
			barrel.position.y = -10;
			barrel.position.z = i * 12 - 80;
			barrel.userData.initialX = barrel.position.x;
			barrel.userData.initialY = barrel.position.y;
			barrel.userData.phaseOffset = Math.random() * Math.PI * 2;
			barrel.castShadow = true;
			group.add(barrel);
		}

		wasteBarrels = group;
		return group;
	}

	function createDumpPipes() {
		var group = new THREE.Group();
		var pipeMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
		var wasteMat = new THREE.MeshStandardMaterial({ color: 0x2aff2a, emissive: 0x0a8a0a });

		var numPipes = 8;
		for (var i = 0; i < numPipes; i++) {
			var pipeGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 6);
			var pipe = new THREE.Mesh(pipeGeom, pipeMat);
			pipe.position.x = (i % 2 === 0 ? -15 : 15);
			pipe.position.y = 12;
			pipe.position.z = i * 15 - 60;
			pipe.rotation.z = Math.PI / 4;
			pipe.castShadow = true;
			group.add(pipe);

			var wasteGeom = new THREE.SphereGeometry(0.6, 4, 4);
			var waste = new THREE.Mesh(wasteGeom, wasteMat);
			waste.position.copy(pipe.position);
			waste.position.y -= 5;
			waste.userData.pipeIndex = i;
			waste.userData.fallSpeed = 0;
			waste.castShadow = true;
			group.add(waste);
		}

		dumpPipes = group;
		return group;
	}

	function createCreatureTrails() {
		var group = new THREE.Group();
		var trailMat = new THREE.LineBasicMaterial({ color: 0x8a4a2a, linewidth: 3 });

		var points = [];
		for (var i = 0; i < 15; i++) {
			points.push(new THREE.Vector3((Math.random() - 0.5) * 30, -8, i * 8 - 70));
		}
		var trailGeom = new THREE.BufferGeometry().setFromPoints(points);
		var trail = new THREE.LineSegments(trailGeom, trailMat);
		group.add(trail);

		for (var j = 0; j < 8; j++) {
			var scratchPoints = [];
			for (var k = 0; k < 10; k++) {
				var px = (Math.random() - 0.5) * 35;
				var py = -6 + (Math.random() - 0.5) * 3;
				var pz = j * 20 - 60 + Math.random() * 5;
				scratchPoints.push(new THREE.Vector3(px, py, pz));
			}
			var scratchGeom = new THREE.BufferGeometry().setFromPoints(scratchPoints);
			var scratchLine = new THREE.LineSegments(scratchGeom, trailMat);
			group.add(scratchLine);
		}

		creatureTrails = group;
		return group;
	}

	function createCatwalks() {
		var group = new THREE.Group();
		var walkMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a });
		var railMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 2 });

		var numWalks = 5;
		for (var i = 0; i < numWalks; i++) {
			var walkGeom = new THREE.BoxGeometry(8, 0.5, 20);
			var walk = new THREE.Mesh(walkGeom, walkMat);
			walk.position.x = (i % 2 === 0 ? -12 : 12);
			walk.position.y = 5;
			walk.position.z = i * 20 - 50;
			walk.castShadow = true;
			group.add(walk);

			var railPoints = [];
			railPoints.push(new THREE.Vector3(-4, 6, walk.position.z - 10));
			railPoints.push(new THREE.Vector3(-4, 6, walk.position.z + 10));
			railPoints.push(new THREE.Vector3(4, 6, walk.position.z - 10));
			railPoints.push(new THREE.Vector3(4, 6, walk.position.z + 10));
			var railGeom = new THREE.BufferGeometry().setFromPoints(railPoints);
			var rail = new THREE.LineSegments(railGeom, railMat);
			group.add(rail);
		}

		catwalks = group;
		return group;
	}

	function createGasClouds() {
		var group = new THREE.Group();
		var gasMat = new THREE.MeshStandardMaterial({
			color: 0xaaff22,
			emissive: 0x88dd00,
			transparent: true,
			opacity: 0.4
		});

		var numClouds = 6;
		for (var i = 0; i < numClouds; i++) {
			var cloudGeom = new THREE.SphereGeometry(3 + Math.random() * 2, 4, 4);
			var cloud = new THREE.Mesh(cloudGeom, gasMat);
			cloud.position.x = (Math.random() - 0.5) * 20;
			cloud.position.y = 0 + Math.random() * 8;
			cloud.position.z = i * 18 - 60;
			cloud.userData.initialScale = 1;
			cloud.userData.pulsePhase = Math.random() * Math.PI * 2;
			group.add(cloud);
		}

		gasClouds = group;
		return group;
	}

	function createProcessingChamber() {
		var group = new THREE.Group();
		var chamberMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
		var centMat = new THREE.MeshStandardMaterial({ color: 0x7a7a7a });

		var chamberGeom = new THREE.BoxGeometry(50, 40, 50);
		var chamber = new THREE.Mesh(chamberGeom, chamberMat);
		chamber.position.z = -200;
		chamber.position.y = 0;
		chamber.receiveShadow = true;
		group.add(chamber);

		var centrifugeGeom = new THREE.CylinderGeometry(8, 8, 3, 12);
		var centrifuge = new THREE.Mesh(centrifugeGeom, centMat);
		centrifuge.position.z = -200;
		centrifuge.position.y = -10;
		centrifuge.castShadow = true;
		centrifuge.userData.isCentrifuge = true;
		group.add(centrifuge);

		var armGeom = new THREE.BoxGeometry(2, 12, 2);
		for (var i = 0; i < 3; i++) {
			var arm = new THREE.Mesh(armGeom, centMat);
			arm.position.z = -200;
			arm.position.y = -5;
			arm.userData.parentCentrifuge = true;
			group.add(arm);
		}

		processingChamber = group;
		return group;
	}

	function createDrainGratings() {
		var group = new THREE.Group();
		var gratingMat = new THREE.LineBasicMaterial({ color: 0x5a5a5a, linewidth: 1 });

		var numGratings = 4;
		for (var i = 0; i < numGratings; i++) {
			var gx = i % 2 === 0 ? -12 : 12;
			var gz = i * 30 - 80;

			var points = [];
			for (var x = -3; x <= 3; x++) {
				for (var z = -3; z <= 3; z++) {
					points.push(new THREE.Vector3(gx + x, -14.5, gz + z));
				}
			}

			var gratingGeom = new THREE.BufferGeometry().setFromPoints(points);
			var grating = new THREE.LineSegments(gratingGeom, gratingMat);
			group.add(grating);
		}

		drainGratings = group;
		return group;
	}

	function createWarningPanels() {
		var group = new THREE.Group();
		var panelMat = new THREE.MeshStandardMaterial({ color: 0xffdd00 });
		var stripeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

		var numPanels = 6;
		for (var i = 0; i < numPanels; i++) {
			var panelGeom = new THREE.BoxGeometry(4, 4, 0.2);
			var panel = new THREE.Mesh(panelGeom, panelMat);
			panel.position.x = i % 2 === 0 ? -18 : 18;
			panel.position.y = 8;
			panel.position.z = i * 25 - 75;
			panel.castShadow = true;
			group.add(panel);

			var stripeGeom = new THREE.BoxGeometry(0.5, 4, 0.3);
			var stripe = new THREE.Mesh(stripeGeom, stripeMat);
			stripe.position.copy(panel.position);
			stripe.position.z += 0.2;
			group.add(stripe);
		}

		warningPanels = group;
		return group;
	}

	function createSplashParticles() {
		var group = new THREE.Group();
		var splashMat = new THREE.MeshStandardMaterial({
			color: 0x3aff3a,
			emissive: 0x1a8a1a,
			transparent: true
		});

		var numParticles = 40;
		for (var i = 0; i < numParticles; i++) {
			var particleGeom = new THREE.SphereGeometry(0.3, 3, 3);
			var particle = new THREE.Mesh(particleGeom, splashMat);
			particle.position.x = (Math.random() - 0.5) * 30;
			particle.position.y = -9;
			particle.position.z = (Math.random() - 0.5) * 100;
			particle.userData.active = false;
			particle.userData.lifetime = 0;
			particle.userData.vx = 0;
			particle.userData.vy = 0;
			particle.userData.vz = 0;
			group.add(particle);
		}

		splashParticles = group;
		return group;
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		sewerGroup = new THREE.Group();
		scene.add(sewerGroup);

		sewerGroup.add(createMainChannel());
		sewerGroup.add(createSludgeFlow());
		sewerGroup.add(createWasteBarrels());
		sewerGroup.add(createDumpPipes());
		sewerGroup.add(createCreatureTrails());
		sewerGroup.add(createCatwalks());
		sewerGroup.add(createGasClouds());
		sewerGroup.add(createProcessingChamber());
		sewerGroup.add(createDrainGratings());
		sewerGroup.add(createWarningPanels());
		sewerGroup.add(createSplashParticles());

		scrollOffset = 0;
		barrelBobOffset = 0;
		gasCloudScale = 1;
		centrifugeRotation = 0;
		splashLifetimes = [];

		var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);

		var pointLight = new THREE.PointLight(0x3aff3a, 1, 200);
		pointLight.position.set(0, 10, -100);
		scene.add(pointLight);

		var pointLight2 = new THREE.PointLight(0x2aff2a, 0.8, 150);
		pointLight2.position.set(-20, 5, -150);
		scene.add(pointLight2);
	}

	function update(delta) {
		if (!sewerGroup) return;

		scrollOffset += delta * 15;
		barrelBobOffset += delta * 2;
		gasCloudScale = 1 + Math.sin(gasCloudScale * 3) * 0.1;
		centrifugeRotation += delta * 4;

		if (sludgeFlow) {
			var children = sludgeFlow.children;
			for (var i = 0; i < children.length; i++) {
				var block = children[i];
				if (block.userData.blockIndex !== undefined) {
					var newZ = block.userData.initialZ + scrollOffset;
					block.position.z = newZ;

					if (newZ > 100) {
						scrollOffset = 0;
					}
				}
			}
		}

		if (wasteBarrels) {
			var barrels = wasteBarrels.children;
			for (var j = 0; j < barrels.length; j++) {
				var barrel = barrels[j];
				if (barrel.userData.initialY !== undefined) {
					barrel.position.y = barrel.userData.initialY + Math.sin(barrelBobOffset + barrel.userData.phaseOffset) * 1.5;
					barrel.rotation.z += delta * 0.8;
				}
			}
		}

		if (dumpPipes) {
			var waste = dumpPipes.children;
			for (var k = 0; k < waste.length; k++) {
				var particle = waste[k];
				if (particle.userData.pipeIndex !== undefined) {
					particle.userData.fallSpeed += delta * 12;
					particle.position.y -= particle.userData.fallSpeed * delta;

					if (particle.position.y < -15) {
						particle.position.y = 12;
						particle.userData.fallSpeed = 0;

						if (Math.random() > 0.7) {
							var splash = splashParticles.children[Math.floor(Math.random() * splashParticles.children.length)];
							if (splash && !splash.userData.active) {
								splash.userData.active = true;
								splash.userData.lifetime = 2;
								splash.position.copy(particle.position);
								splash.position.y = -9;
								splash.userData.vx = (Math.random() - 0.5) * 20;
								splash.userData.vy = Math.random() * 15 + 10;
								splash.userData.vz = (Math.random() - 0.5) * 15;
							}
						}
					}
				}
			}
		}

		if (gasClouds) {
			var clouds = gasClouds.children;
			for (var m = 0; m < clouds.length; m++) {
				var cloud = clouds[m];
				var pulse = 1 + Math.sin(cloud.userData.pulsePhase + barrelBobOffset) * 0.3;
				cloud.scale.set(pulse, pulse, pulse);
				cloud.userData.pulsePhase += delta * 1.5;
			}
		}

		if (processingChamber) {
			var chamber = processingChamber.children;
			for (var n = 0; n < chamber.length; n++) {
				var obj = chamber[n];
				if (obj.userData.isCentrifuge) {
					obj.rotation.z = centrifugeRotation;
				} else if (obj.userData.parentCentrifuge) {
					obj.rotation.z = centrifugeRotation;
					var armDist = 7;
					var armAngle = centrifugeRotation + (n * Math.PI * 2 / 3);
					obj.position.x = -200 + Math.cos(armAngle) * armDist;
					obj.position.z = -200 + Math.sin(armAngle) * armDist;
				}
			}
		}

		if (splashParticles) {
			var particles = splashParticles.children;
			for (var p = 0; p < particles.length; p++) {
				var part = particles[p];
				if (part.userData.active) {
					part.userData.lifetime -= delta;
					part.position.x += part.userData.vx * delta;
					part.position.y += part.userData.vy * delta;
					part.position.z += part.userData.vz * delta;
					part.userData.vy -= delta * 20;

					var lifeRatio = part.userData.lifetime / 2;
					part.material.opacity = Math.max(0, lifeRatio);

					if (part.userData.lifetime <= 0) {
						part.userData.active = false;
						part.material.opacity = 0.4;
					}
				}
			}
		}
	}

	function reset() {
		scrollOffset = 0;
		barrelBobOffset = 0;
		gasCloudScale = 1;
		centrifugeRotation = 0;
		splashLifetimes = [];

		if (sludgeFlow) {
			var blocks = sludgeFlow.children;
			for (var i = 0; i < blocks.length; i++) {
				blocks[i].position.z = blocks[i].userData.initialZ;
			}
		}

		if (wasteBarrels) {
			var barrels = wasteBarrels.children;
			for (var j = 0; j < barrels.length; j++) {
				barrels[j].position.x = barrels[j].userData.initialX;
				barrels[j].position.y = barrels[j].userData.initialY;
			}
		}

		if (dumpPipes) {
			var waste = dumpPipes.children;
			for (var k = 0; k < waste.length; k++) {
				var particle = waste[k];
				if (particle.userData.pipeIndex !== undefined) {
					particle.userData.fallSpeed = 0;
				}
			}
		}

		if (splashParticles) {
			var particles = splashParticles.children;
			for (var m = 0; m < particles.length; m++) {
				particles[m].userData.active = false;
				particles[m].material.opacity = 0.4;
			}
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
