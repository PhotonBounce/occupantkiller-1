window.WarGate = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var lights = [];
  var animatedElements = [];
  var gateBarrier;
  var searchlight;
  var spikeStrip;
  var barrierRotation = 0;
  var searchlightRotation = 0;
  var spikeExtension = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    animatedElements = [];
    barrierRotation = 0;
    searchlightRotation = 0;
    spikeExtension = 0;

    buildlighting();
    buildgatemain();
    buildtowers();
    buildbarriers();
    buildbooths();
    buildsearchlights();
    buildwatchtowers();
    buildbarbed();
    builddetectionpit();
    buildcommandpost();
    buildprison();
    buildroads();
  }

  function buildlighting() {
    var ambientlight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientlight);
    lights.push(ambientlight);

    var directionallight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionallight.position.set(100, 150, 100);
    directionallight.castShadow = true;
    scene.add(directionallight);
    lights.push(directionallight);

    var pointlight1 = new THREE.PointLight(0xffff00, 0.5, 200);
    pointlight1.position.set(0, 80, -50);
    scene.add(pointlight1);
    lights.push(pointlight1);

    var pointlight2 = new THREE.PointLight(0xff6600, 0.4, 180);
    pointlight2.position.set(150, 100, 0);
    scene.add(pointlight2);
    lights.push(pointlight2);
  }

  function buildgatemain() {
    var material = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var leftbasegeom = new THREE.BoxGeometry(15, 40, 15);
    var leftbase = new THREE.Mesh(leftbasegeom, material);
    leftbase.position.set(-40, 20, 0);
    leftbase.castShadow = true;
    scene.add(leftbase);
    objects.push(leftbase);

    var rightbasegeom = new THREE.BoxGeometry(15, 40, 15);
    var rightbase = new THREE.Mesh(rightbasegeom, material);
    rightbase.position.set(40, 20, 0);
    rightbase.castShadow = true;
    scene.add(rightbase);
    objects.push(rightbase);

    var topbargeom = new THREE.BoxGeometry(100, 8, 12);
    var topbar = new THREE.Mesh(topbargeom, material);
    topbar.position.set(0, 44, 0);
    topbar.castShadow = true;
    scene.add(topbar);
    objects.push(topbar);

    var platecovergeom = new THREE.BoxGeometry(80, 6, 10);
    var platecover = new THREE.Mesh(platecovergeom, new THREE.MeshLambertMaterial({ color: 0x333333 }));
    platecover.position.set(0, 50, 0);
    platecover.castShadow = true;
    scene.add(platecover);
    objects.push(platecover);

    gateBarrier = new THREE.Group();
    var barrierarmgeom = new THREE.BoxGeometry(6, 3, 40);
    var barrierarm = new THREE.Mesh(barrierarmgeom, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
    barrierarm.position.set(-35, 22, 0);
    gateBarrier.add(barrierarm);
    gateBarrier.position.set(-35, 25, 0);
    scene.add(gateBarrier);
    objects.push(gateBarrier);
    animatedElements.push(gateBarrier);

    var rightbarriergeom = new THREE.BoxGeometry(6, 3, 40);
    var rightbarrierarm = new THREE.Mesh(rightbarriergeom, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
    rightbarrierarm.position.set(35, 22, 0);
    scene.add(rightbarrierarm);
    objects.push(rightbarrierarm);

    var leftpolesgeom = new THREE.CylinderGeometry(1.5, 1.5, 60, 16);
    var leftpole1 = new THREE.Mesh(leftpolesgeom, new THREE.MeshLambertMaterial({ color: 0x555555 }));
    leftpole1.position.set(-50, 30, 10);
    scene.add(leftpole1);
    objects.push(leftpole1);

    var leftpole2 = new THREE.Mesh(leftpolesgeom, new THREE.MeshLambertMaterial({ color: 0x555555 }));
    leftpole2.position.set(-30, 30, 10);
    scene.add(leftpole2);
    objects.push(leftpole2);

    var rightpole1 = new THREE.Mesh(leftpolesgeom, new THREE.MeshLambertMaterial({ color: 0x555555 }));
    rightpole1.position.set(30, 30, 10);
    scene.add(rightpole1);
    objects.push(rightpole1);

    var rightpole2 = new THREE.Mesh(leftpolesgeom, new THREE.MeshLambertMaterial({ color: 0x555555 }));
    rightpole2.position.set(50, 30, 10);
    scene.add(rightpole2);
    objects.push(rightpole2);

    var roofconegeom = new THREE.ConeGeometry(8, 15, 32);
    var roofcone = new THREE.Mesh(roofconegeom, new THREE.MeshLambertMaterial({ color: 0x222222 }));
    roofcone.position.set(0, 65, 0);
    roofcone.castShadow = true;
    scene.add(roofcone);
    objects.push(roofcone);
  }

  function buildtowers() {
    var material = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var lefttowerbasegeom = new THREE.BoxGeometry(20, 50, 20);
    var lefttowerbase = new THREE.Mesh(lefttowerbasegeom, material);
    lefttowerbase.position.set(-80, 25, 0);
    lefttowerbase.castShadow = true;
    scene.add(lefttowerbase);
    objects.push(lefttowerbase);

    var righttowerbasegeom = new THREE.BoxGeometry(20, 50, 20);
    var righttowerbase = new THREE.Mesh(righttowerbasegeom, material);
    righttowerbase.position.set(80, 25, 0);
    righttowerbase.castShadow = true;
    scene.add(righttowerbase);
    objects.push(righttowerbase);

    var lefttowerplatgeom = new THREE.BoxGeometry(25, 4, 25);
    var lefttowerplat = new THREE.Mesh(lefttowerplatgeom, new THREE.MeshLambertMaterial({ color: 0x555555 }));
    lefttowerplat.position.set(-80, 52, 0);
    lefttowerplat.castShadow = true;
    scene.add(lefttowerplat);
    objects.push(lefttowerplat);

    var righttowerplatgeom = new THREE.BoxGeometry(25, 4, 25);
    var righttowerplat = new THREE.Mesh(righttowerplatgeom, new THREE.MeshLambertMaterial({ color: 0x555555 }));
    righttowerplat.position.set(80, 52, 0);
    righttowerplat.castShadow = true;
    scene.add(righttowerplat);
    objects.push(righttowerplat);

    var lefttowerrailgeom = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
    var lefttowerrail1 = new THREE.Mesh(lefttowerrailgeom, new THREE.MeshLambertMaterial({ color: 0x444444 }));
    lefttowerrail1.position.set(-90, 62, 0);
    scene.add(lefttowerrail1);
    objects.push(lefttowerrail1);

    var lefttowerrail2 = new THREE.Mesh(lefttowerrailgeom, new THREE.MeshLambertMaterial({ color: 0x444444 }));
    lefttowerrail2.position.set(-70, 62, 0);
    scene.add(lefttowerrail2);
    objects.push(lefttowerrail2);

    var lefttowerrail3 = new THREE.Mesh(lefttowerrailgeom, new THREE.MeshLambertMaterial({ color: 0x444444 }));
    lefttowerrail3.position.set(-80, 62, -10);
    scene.add(lefttowerrail3);
    objects.push(lefttowerrail3);

    var righttowerrail1 = new THREE.Mesh(lefttowerrailgeom, new THREE.MeshLambertMaterial({ color: 0x444444 }));
    righttowerrail1.position.set(90, 62, 0);
    scene.add(righttowerrail1);
    objects.push(righttowerrail1);

    var righttowerrail2 = new THREE.Mesh(lefttowerrailgeom, new THREE.MeshLambertMaterial({ color: 0x444444 }));
    righttowerrail2.position.set(70, 62, 0);
    scene.add(righttowerrail2);
    objects.push(righttowerrail2);
  }

  function buildbarriers() {
    var material = new THREE.MeshLambertMaterial({ color: 0xffcc00 });

    var lanecount = 3;
    var lanespacing = 25;
    var startx = -30;

    for (var i = 0; i < lanecount; i++) {
      var lanex = startx + (i * lanespacing);

      var barriergeom = new THREE.BoxGeometry(2, 2, 8);
      var barrierl = new THREE.Mesh(barriergeom, material);
      barrierl.position.set(lanex - 8, 2, -25);
      barrierl.castShadow = true;
      scene.add(barrierl);
      objects.push(barrierl);

      var barrierr = new THREE.Mesh(barriergeom, material);
      barrierr.position.set(lanex + 8, 2, -25);
      barrierr.castShadow = true;
      scene.add(barrierr);
      objects.push(barrierr);

      var barrierb = new THREE.Mesh(barriergeom, material);
      barrierb.position.set(lanex - 8, 2, 25);
      barrierb.castShadow = true;
      scene.add(barrierb);
      objects.push(barrierb);

      var barrierback = new THREE.Mesh(barriergeom, material);
      barrierback.position.set(lanex + 8, 2, 25);
      barrierback.castShadow = true;
      scene.add(barrierback);
      objects.push(barrierback);
    }

    spikeStrip = new THREE.Group();
    var spikegeom = new THREE.ConeGeometry(0.3, 3, 8);
    var spikematerial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    for (var j = 0; j < 15; j++) {
      var spike = new THREE.Mesh(spikegeom, spikematerial);
      spike.position.set(-25, 0.5, -60 + (j * 3));
      spikeStrip.add(spike);
    }
    spikeStrip.position.set(0, 0, 0);
    scene.add(spikeStrip);
    objects.push(spikeStrip);
    animatedElements.push(spikeStrip);
  }

  function buildbooths() {
    var material = new THREE.MeshLambertMaterial({ color: 0x666666 });

    var boothcount = 3;
    var startx = -30;
    var spacing = 25;

    for (var i = 0; i < boothcount; i++) {
      var boothx = startx + (i * spacing);

      var boothgeom = new THREE.BoxGeometry(8, 12, 6);
      var booth = new THREE.Mesh(boothgeom, material);
      booth.position.set(boothx, 8, -40);
      booth.castShadow = true;
      scene.add(booth);
      objects.push(booth);

      var roofgeom = new THREE.BoxGeometry(10, 2, 8);
      var roof = new THREE.Mesh(roofgeom, new THREE.MeshLambertMaterial({ color: 0x555555 }));
      roof.position.set(boothx, 14, -40);
      roof.castShadow = true;
      scene.add(roof);
      objects.push(roof);

      var windowgeom = new THREE.BoxGeometry(3, 4, 0.5);
      var window = new THREE.Mesh(windowgeom, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
      window.position.set(boothx, 10, -43.3);
      scene.add(window);
      objects.push(window);
    }
  }

  function buildsearchlights() {
    var basegeom = new THREE.CylinderGeometry(4, 5, 2, 16);
    var basematerial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var base = new THREE.Mesh(basegeom, basematerial);
    base.position.set(-70, 55, 0);
    base.castShadow = true;
    scene.add(base);
    objects.push(base);

    var polegeom = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
    var polematerial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var pole = new THREE.Mesh(polegeom, polematerial);
    pole.position.set(-70, 66, 0);
    scene.add(pole);
    objects.push(pole);

    searchlight = new THREE.Group();
    var headgeom = new THREE.SphereGeometry(3, 16, 16);
    var headmaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var head = new THREE.Mesh(headgeom, headmaterial);
    searchlight.add(head);
    searchlight.position.set(-70, 75, 0);
    scene.add(searchlight);
    objects.push(searchlight);
    animatedElements.push(searchlight);

    var lensgeom = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16);
    var lensmaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var lens = new THREE.Mesh(lensgeom, lensmaterial);
    lens.position.set(-70, 75, 4);
    scene.add(lens);
    objects.push(lens);
  }

  function buildwatchtowers() {
    var towergeom = new THREE.BoxGeometry(12, 35, 12);
    var towermaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var tower1 = new THREE.Mesh(towergeom, towermaterial);
    tower1.position.set(-120, 20, -80);
    tower1.castShadow = true;
    scene.add(tower1);
    objects.push(tower1);

    var tower2 = new THREE.Mesh(towergeom, towermaterial);
    tower2.position.set(120, 20, -80);
    tower2.castShadow = true;
    scene.add(tower2);
    objects.push(tower2);

    var tower3 = new THREE.Mesh(towergeom, towermaterial);
    tower3.position.set(-120, 20, 80);
    tower3.castShadow = true;
    scene.add(tower3);
    objects.push(tower3);

    var tower4 = new THREE.Mesh(towergeom, towermaterial);
    tower4.position.set(120, 20, 80);
    tower4.castShadow = true;
    scene.add(tower4);
    objects.push(tower4);

    var roofgeom = new THREE.ConeGeometry(8, 10, 16);
    var roofmaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var roof1 = new THREE.Mesh(roofgeom, roofmaterial);
    roof1.position.set(-120, 40, -80);
    roof1.castShadow = true;
    scene.add(roof1);
    objects.push(roof1);

    var roof2 = new THREE.Mesh(roofgeom, roofmaterial);
    roof2.position.set(120, 40, -80);
    roof2.castShadow = true;
    scene.add(roof2);
    objects.push(roof2);

    var roof3 = new THREE.Mesh(roofgeom, roofmaterial);
    roof3.position.set(-120, 40, 80);
    roof3.castShadow = true;
    scene.add(roof3);
    objects.push(roof3);

    var roof4 = new THREE.Mesh(roofgeom, roofmaterial);
    roof4.position.set(120, 40, 80);
    roof4.castShadow = true;
    scene.add(roof4);
    objects.push(roof4);
  }

  function buildbarbed() {
    var wiregeom = new THREE.CylinderGeometry(0.1, 0.1, 200, 4);
    var wirematerial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var wirefence1 = new THREE.Mesh(wiregeom, wirematerial);
    wirefence1.rotation.z = Math.PI / 2;
    wirefence1.position.set(0, 8, -120);
    scene.add(wirefence1);
    objects.push(wirefence1);

    var wirefence2 = new THREE.Mesh(wiregeom, wirematerial);
    wirefence2.rotation.z = Math.PI / 2;
    wirefence2.position.set(0, 8, 120);
    scene.add(wirefence2);
    objects.push(wirefence2);

    var wirefence3 = new THREE.Mesh(wiregeom, wirematerial);
    wirefence3.position.set(-150, 8, 0);
    scene.add(wirefence3);
    objects.push(wirefence3);

    var wirefence4 = new THREE.Mesh(wiregeom, wirematerial);
    wirefence4.position.set(150, 8, 0);
    scene.add(wirefence4);
    objects.push(wirefence4);

    var barbgeom = new THREE.SphereGeometry(0.3, 8, 8);
    var barbmaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

    for (var i = 0; i < 40; i++) {
      var barb = new THREE.Mesh(barbgeom, barbmaterial);
      barb.position.set(-100 + (i * 5), 10, -120);
      scene.add(barb);
      objects.push(barb);
    }

    for (var j = 0; j < 40; j++) {
      var barb2 = new THREE.Mesh(barbgeom, barbmaterial);
      barb2.position.set(-100 + (j * 5), 10, 120);
      scene.add(barb2);
      objects.push(barb2);
    }
  }

  function builddetectionpit() {
    var pitgeom = new THREE.BoxGeometry(30, 8, 20);
    var pitmaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var pit = new THREE.Mesh(pitgeom, pitmaterial);
    pit.position.set(0, -4, -70);
    pit.castShadow = true;
    scene.add(pit);
    objects.push(pit);

    var rampgeom = new THREE.BoxGeometry(30, 2, 15);
    var rampmaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var ramp = new THREE.Mesh(rampgeom, rampmaterial);
    ramp.rotation.z = 0.3;
    ramp.position.set(0, 2, -55);
    ramp.castShadow = true;
    scene.add(ramp);
    objects.push(ramp);

    var lightgeom = new THREE.CylinderGeometry(1, 1, 3, 8);
    var lightmaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });

    for (var i = 0; i < 8; i++) {
      var light = new THREE.Mesh(lightgeom, lightmaterial);
      light.position.set(-12 + (i * 3), 4, -70);
      scene.add(light);
      objects.push(light);
    }
  }

  function buildcommandpost() {
    var trailergeom = new THREE.BoxGeometry(20, 10, 15);
    var trailermaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var trailer = new THREE.Mesh(trailergeom, trailermaterial);
    trailer.position.set(100, 6, -60);
    trailer.castShadow = true;
    scene.add(trailer);
    objects.push(trailer);

    var doorgеom = new THREE.BoxGeometry(3, 8, 0.5);
    var doormaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var door = new THREE.Mesh(doorgеom, doormaterial);
    door.position.set(109, 4, -67.3);
    scene.add(door);
    objects.push(door);

    var antennageom = new THREE.CylinderGeometry(0.3, 0.3, 25, 8);
    var antennamaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var antenna = new THREE.Mesh(antennageom, antennamaterial);
    antenna.position.set(100, 25, -60);
    scene.add(antenna);
    objects.push(antenna);

    var windowgeom = new THREE.BoxGeometry(2, 2, 0.5);
    var windowmaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    for (var i = 0; i < 4; i++) {
      var window = new THREE.Mesh(windowgeom, windowmaterial);
      window.position.set(92 + (i * 3), 8, -67.3);
      scene.add(window);
      objects.push(window);
    }

    var roofgeom = new THREE.BoxGeometry(22, 2, 17);
    var roofmaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var roof = new THREE.Mesh(roofgeom, roofmaterial);
    roof.position.set(100, 11, -60);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);
  }

  function buildprison() {
    var wallgeom = new THREE.BoxGeometry(40, 8, 40);
    var wallmaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var wall1 = new THREE.Mesh(wallgeom, wallmaterial);
    wall1.position.set(-100, 4, 50);
    wall1.castShadow = true;
    scene.add(wall1);
    objects.push(wall1);

    var wall2 = new THREE.Mesh(wallgeom, wallmaterial);
    wall2.position.set(-100, 4, 100);
    wall2.castShadow = true;
    scene.add(wall2);
    objects.push(wall2);

    var wall3 = new THREE.Mesh(wallgeom, wallmaterial);
    wall3.position.set(-50, 4, 75);
    wall3.castShadow = true;
    scene.add(wall3);
    objects.push(wall3);

    var gategeom = new THREE.BoxGeometry(15, 10, 2);
    var gatematerial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var gate = new THREE.Mesh(gategeom, gatematerial);
    gate.position.set(-70, 6, 50);
    gate.castShadow = true;
    scene.add(gate);
    objects.push(gate);

    var guardboothgeom = new THREE.BoxGeometry(6, 8, 6);
    var guardboothmaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var guardbooth = new THREE.Mesh(guardboothgeom, guardboothmaterial);
    guardbooth.position.set(-75, 5, 35);
    guardbooth.castShadow = true;
    scene.add(guardbooth);
    objects.push(guardbooth);

    var spotlightgeom = new THREE.SphereGeometry(1.5, 8, 8);
    var spotlightmaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });

    for (var i = 0; i < 3; i++) {
      var spotlight = new THREE.Mesh(spotlightgeom, spotlightmaterial);
      spotlight.position.set(-100 + (i * 25), 12, 75);
      scene.add(spotlight);
      objects.push(spotlight);
    }
  }

  function buildroads() {
    var roadgeom = new THREE.BoxGeometry(80, 0.5, 180);
    var roadmaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var road = new THREE.Mesh(roadgeom, roadmaterial);
    road.position.set(0, 0, 0);
    scene.add(road);
    objects.push(road);

    var linegeometry = new THREE.BufferGeometry();
    var linepositions = new Float32Array([
      -40, 0.1, -90,
      -40, 0.1, 90,
      40, 0.1, -90,
      40, 0.1, 90
    ]);
    linegeometry.setAttribute('position', new THREE.BufferAttribute(linepositions, 3));
    var linematerial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    var lines = new THREE.LineSegments(linegeometry, linematerial);
    scene.add(lines);
    objects.push(lines);

    var markergeom = new THREE.SphereGeometry(2, 8, 8);
    var markermaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });

    for (var i = 0; i < 10; i++) {
      var marker = new THREE.Mesh(markergeom, markermaterial);
      marker.position.set(-35, 1, -80 + (i * 18));
      scene.add(marker);
      objects.push(marker);
    }
  }

  function update(delta) {
    barrierRotation += delta * 0.5;
    if (barrierRotation > Math.PI / 3) {
      barrierRotation = Math.PI / 3;
    }
    if (gateBarrier) {
      gateBarrier.rotation.z = barrierRotation;
    }

    searchlightRotation += delta * 0.8;
    if (searchlight) {
      searchlight.rotation.y = Math.sin(searchlightRotation) * 0.6;
    }

    spikeExtension = Math.sin(Date.now() * 0.001) * 2;
    if (spikeStrip) {
      spikeStrip.position.y = spikeExtension;
    }
  }

  function reset() {
    if (scene) {
      for (var i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
      }
      for (var j = lights.length - 1; j >= 0; j--) {
        scene.remove(lights[j]);
      }
    }

    objects = [];
    lights = [];
    animatedElements = [];
    gateBarrier = null;
    searchlight = null;
    spikeStrip = null;
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
