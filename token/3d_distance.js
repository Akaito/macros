// Author: Codesaru

// This self-whispers a chat message with distances from all
// selected tokens to all targeted tokens.
// Distances take elevation differences into account.
// Distances are given in D&D5e PHB, pure Euclidean, and D&D5e DMG style,
// but you don't have to be using that system in Foundry.

// Any move not on a single axis is considered a diagonal move.
// So for PHB and DMG, a move that goes east + north + up counts
// as the same distance as one that goes just east + north.

// Potentially useful notes, etc.
// canvas.scene.data.grid (74)
// canvas.scene.data.gridDistance (5)
// canvas.scene.data.gridUnits ('ft')
// Note: token x/y is in raw distance (divide by grid for spaces).
// Note: token elevation is in game system units (divide by gridDistance for spaces).

function euclideanDistance(selected, target) {
  let lateralDistX =
    Math.abs(target.data.x - selected.data.x)
    / canvas.scene.data.grid // to grid spaces (typically squares)
    * canvas.scene.data.gridDistance; // to distance (typically 'ft')
  let lateralDistY =
    Math.abs(target.data.y - selected.data.y)
    / canvas.scene.data.grid
    * canvas.scene.data.gridDistance;
  //console.log(lateralDistX, lateralDistY);
  let lateralDist = Math.sqrt(Math.pow(lateralDistX,2) + Math.pow(lateralDistY,2));
  //console.log('lateral', lateralDist);
  let verticalDist =
    Math.abs(target.data.elevation - selected.data.elevation); // already in 'ft'
  //console.log('vertical', verticalDist);
  let dist = Math.sqrt(Math.pow(lateralDist,2) + Math.pow(verticalDist,2));
  //console.log('dist', dist);
  return dist;
}

function phbDistance(selected, target) {
  let lateralSpacesX = Math.round(
    Math.abs(target.data.x - selected.data.x)
    / canvas.scene.data.grid // to grid spaces (typically squares)
  );
  let lateralSpacesY = Math.round(
    Math.abs(target.data.y - selected.data.y)
    / canvas.scene.data.grid
  );
  //console.log('PHB | ', lateralSpacesX, lateralSpacesY);
  let verticalSpaces = Math.round(
    Math.abs(target.data.elevation - selected.data.elevation)
    / canvas.scene.data.gridDistance
  );
  //console.log('PHB | verticalSpaces', verticalSpaces);

  let spacesMoved = [lateralSpacesX, lateralSpacesY, verticalSpaces].sort(function(a,b){return a-b});
  //console.log('PHB | spacesMoved', spacesMoved);

  let spaces = spacesMoved[2];
  //console.log('PHB | total spaces', spaces);
  return spaces * canvas.scene.data.gridDistance;
}

function dmgDistance(selected, target) {
  let lateralSpacesX = Math.round(
    Math.abs(target.data.x - selected.data.x)
    / canvas.scene.data.grid // to grid spaces (typically squares)
  );
  let lateralSpacesY = Math.round(
    Math.abs(target.data.y - selected.data.y)
    / canvas.scene.data.grid
  );
  //console.log('DMG | ', lateralSpacesX, lateralSpacesY);
  let verticalSpaces = Math.round(
    Math.abs(target.data.elevation - selected.data.elevation)
    / canvas.scene.data.gridDistance
  );
  //console.log('DMG | verticalSpaces', verticalSpaces);

  let spacesMoved = [lateralSpacesX, lateralSpacesY, verticalSpaces].sort(function(a,b){return a-b});
  //console.log('DMG | spacesMoved', spacesMoved);

  // median of x,y,z spaces moved seems to be the minimum diagonal moves one can make
  let diagonalMoves = spacesMoved[1];
  //console.log('DMG | diagonalMoves', diagonalMoves);
  let extraSpaces = Math.floor(diagonalMoves/2);
  //console.log('DMG | extra spaces', extraSpaces);

  let spaces = spacesMoved[2] + extraSpaces;
  //console.log('DMG | total spaces', spaces);
  return spaces * canvas.scene.data.gridDistance;
}

function getSourceTokens() {
  if (canvas.tokens.controlled.length > 0) {
    return canvas.tokens.controlled;
  }
  // players (not GMs or assistants) have a fallback of their assigned token
  if (game.user.role < 3) {
    return canvas.tokens.ownedTokens;
  }
  ui.notifications.warn('Pythagoras | No tokens selected, and no controlled token fallback for GMs');
  return [];
}

function getTargets() {
  let targets = Array.from(game.user.targets);
  if (targets.length < 1) {
    ui.notifications.warn('Pythagoras | No targets selected');
  }
  return targets;
}

let html = `<p>Distances in PHB / Euclidian / DMG ${canvas.scene.data.gridUnits}.</p>`;
getSourceTokens().forEach(function (selected) {
  //console.log('selectedToken', selected);
  let distances = [];
  getTargets().forEach(function (target) {
    //console.log('target', target);
    console.log('Euclidiean distance', euclideanDistance(selected, target));
    console.log('PHB distance', phbDistance(selected, target));
    console.log('DMG distance', dmgDistance(selected, target));
    distances.push({
      "source": selected,
      "target": target,
      "euclid": euclideanDistance(selected, target),
      "phb": phbDistance(selected, target),
      "dmg": dmgDistance(selected, target)
    });
  });
  console.log('distances', distances);
  distances = distances.sort(function(a,b){a.euclid-b.euclid});
  console.log('distances', distances);
  distances.forEach(function(distObj) {
    html += `<p>${distObj.source.data.name} is ${distObj.phb} / ${Math.floor(distObj.euclid)} / ${distObj.dmg} from ${distObj.target.data.name}</p>`;
  });

  ChatMessage.create({
    content: html,
    whisper: [game.user]
  });
});
