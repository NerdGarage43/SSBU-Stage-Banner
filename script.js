document.addEventListener('DOMContentLoaded', () => {
  const solosBtn = document.getElementById('solos-btn');
  const crewsBtn = document.getElementById('crews-btn');
  const stageSelectDiv = document.getElementById('stage-select');
  const undoBanBtn = document.getElementById('undo-ban-btn');
  const resetBtn = document.getElementById('reset-btn');
  const firstTurnToggle = document.getElementById('toggle-switch');

  let currentMode = 'solos';
  let availableStages = [];
  let bannedStages = [];
  let banHistory = [];
  let currentBanTurn = 0;
  let teamOrder = ['home', 'away'];
  let isFirstTurn = true;
  let isCounterPick = false;

  const stageLists = {
    solos: [
      'Battlefield',
      'Pokemon Stadium 2',
      'Smashville',
      'Town & City',
      'Small Battlefield',
    ],
    crews: [
      'Battlefield',
      'Pokemon Stadium 2',
      'Smashville',
      'Town & City',
      'Kalos Pokemon League',
      'Final Destination',
      'Unova Pokemon League',
      'Hollow Bastion',
      'Small Battlefield',
    ],
    counterpickSolos: [
      'Battlefield',
      'Pokemon Stadium 2',
      'Smashville',
      'Town & City',
      'Small Battlefield',
      'Kalos Pokemon League',
      'Hollow Bastion',
      'Final Destination',
    ],
    counterpickCrews: [
      'Battlefield',
      'Pokemon Stadium 2',
      'Smashville',
      'Town & City',
      'Kalos Pokemon League',
      'Final Destination',
      'Unova Pokemon League',
      'Hollow Bastion',
      'Small Battlefield',
    ]
  };

  const stageImageMap = {
    'Town & City': 'TownAndCity.png',
    'Yoshi\'s Story': 'YoshisStory.png',
    'Yoshi\'s Island': 'YoshisIsland.png',
    'Battlefield': 'Battlefield.png',
    'Pokemon Stadium 2': 'PokemonStadium2.png',
    'Smashville': 'Smashville.png',
    'Small Battlefield': 'SmallBattlefield.png',
    'Kalos Pokemon League': 'KalosPokemonLeague.png',
    'Hollow Bastion': 'HollowBastion.png',
    'Final Destination': 'FinalDestination.png',
    'Unova Pokemon League': 'UnovaPokemonLeague.png',
    'Lylat Cruise': 'LylatCruise.png',
  };

  function initializeStages(mode) {
    availableStages = stageLists[mode];
    stageSelectDiv.innerHTML = '';
    availableStages.forEach((stage) => {
      const stageOption = document.createElement('div');
      stageOption.classList.add('stage-option');
      stageOption.id = stage.replace(/ /g, '-').toLowerCase();
      const imageName = stageImageMap[stage] || `${stage.replace(/ /g, '')}.png`;
      stageOption.innerHTML = `
        <img src="${imageName}" alt="${stage}">
        <div class="stage-name">${stage}</div>
      `;
      stageOption.addEventListener('click', () => {
        banStage(stage);
      });
      stageSelectDiv.appendChild(stageOption);
    });
  }

  function banStage(stageName) {
    if (availableStages.includes(stageName)) {
      const selectedStage = document.getElementById(stageName.replace(/ /g, '-').toLowerCase());
      const team = determineCurrentTeam();

      // Check if we're at the stage selection phase
      const isTimeToChoose = (currentMode === 'solos' && bannedStages.length === 3) ||
                            (currentMode === 'crews' && bannedStages.length === 7) ||
                            (isCounterPick && currentMode === 'solos' && bannedStages.length === 2) ||
                            (isCounterPick && currentMode === 'crews' && bannedStages.length === 3);

      if (isTimeToChoose) {
        // Stage selection logic
        showStageSelection(stageName);
        return;
      }

      if (selectedStage) {
        selectedStage.classList.add('banned');
        selectedStage.removeEventListener('click', () => {});
        bannedStages.push(stageName);
        banHistory.push({ stage: stageName, team: team, action: 'ban' });
        availableStages = availableStages.filter((stage) => stage !== stageName);
        currentBanTurn++;
        updateTurnDisplay();
        
        // Check if it's time to choose a stage and update stage animations
        const newIsTimeToChoose = (currentMode === 'solos' && bannedStages.length === 3) ||
                              (currentMode === 'crews' && bannedStages.length === 7) ||
                              (isCounterPick && currentMode === 'solos' && bannedStages.length === 2) ||
                              (isCounterPick && currentMode === 'crews' && bannedStages.length === 3);
        
        if (newIsTimeToChoose) {
          availableStages.forEach(stage => {
            const stageElement = document.getElementById(stage.replace(/ /g, '-').toLowerCase());
            if (stageElement) {
              stageElement.classList.add('pickable');
            }
          });
        }
      }
    }
  }

  function showStageSelection(stageName) {
    const overlay = document.createElement('div');
    overlay.classList.add('stage-selection-overlay');
    
    const selectionContainer = document.createElement('div');
    selectionContainer.classList.add('stage-selection-container');
    
    const stageImage = document.createElement('img');
    stageImage.src = stageImageMap[stageName];
    stageImage.alt = stageName;
    stageImage.classList.add('selected-stage-image');
    
    const stageTitleDiv = document.createElement('div');
    stageTitleDiv.classList.add('selected-stage-title');
    stageTitleDiv.textContent = stageName;
    
    const continueButton = document.createElement('button');
    continueButton.classList.add('continue-button');
    continueButton.textContent = 'Continue';
    continueButton.addEventListener('click', () => {
      overlay.classList.add('closing');
      setTimeout(() => {
        document.body.removeChild(overlay);
        reset();
      }, 500);
    });
    
    selectionContainer.appendChild(stageImage);
    selectionContainer.appendChild(stageTitleDiv);
    selectionContainer.appendChild(continueButton);
    overlay.appendChild(selectionContainer);
    
    document.body.appendChild(overlay);
  }

  function undoBan() {
    if (banHistory.length > 0) {
      const lastBan = banHistory.pop();
      const stageName = lastBan.stage;

      bannedStages = bannedStages.filter((stage) => stage !== stageName);
      availableStages.push(stageName);

      const stageOption = document.getElementById(stageName.replace(/ /g, '-').toLowerCase());
      if (stageOption) {
        stageOption.classList.remove('banned');
        stageOption.addEventListener('click', () => {
          banStage(stageName);
        });
      }
      currentBanTurn--;
      updateTurnDisplay();
    }
  }

  function reset() {
    const stageOptions = document.querySelectorAll('.stage-option');
    
    // Add resetting animation to all stages
    stageOptions.forEach(stage => {
      stage.classList.add('resetting');
      
      // Remove banned class with animation
      if (stage.classList.contains('banned')) {
        stage.classList.add('unbanning');
        stage.classList.remove('banned');
      }
      
      // Remove pickable class
      stage.classList.remove('pickable');
      
      // Remove animation classes after animation completes
      setTimeout(() => {
        stage.classList.remove('resetting', 'unbanning');
      }, 500);
    });

    bannedStages = [];
    banHistory = [];
    currentBanTurn = 0;
    const mode = isCounterPick ? `counterpick${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}` : currentMode;
    
    initializeStages(mode);
    updateTurnDisplay();
  }

  function determineCurrentTeam() {
    const currentTurn = currentBanTurn;
    let teamIndex;

    if (currentMode === 'solos') {
      if (isCounterPick) {
        return 'away';  // In counterpick, "away" represents the winning player
      }
      if (currentTurn === 0) {
        teamIndex = 0; // Home
      } else if (currentTurn === 1 || currentTurn === 2) {
        teamIndex = 1; // Away
      } else {
        teamIndex = 0; // Home (for stage selection)
      }
    } else if (currentMode === 'crews') {
      if (isCounterPick) {
        if (currentTurn < 3) {
          return 'away'; // Winning team bans
        } else {
          return 'home'; // Losing team picks
        }
      }
      if (currentTurn === 0) {
        teamIndex = 0; // Home team
      } else if (currentTurn === 1 || currentTurn === 2) {
        teamIndex = 1; // Away team
      } else if (currentTurn === 3 || currentTurn === 4) {
        teamIndex = 0; // Home team
      } else if (currentTurn === 5 || currentTurn === 6) {
        teamIndex = 1; // Away team
      } else {
        teamIndex = 0; // Home team (for stage selection)
      }
    }

    return teamOrder[teamIndex % teamOrder.length];
  }

  function updateTurnDisplay() {
    const turnDisplay = document.getElementById('turn-display');
    const currentTeam = determineCurrentTeam();
    
    if (!turnDisplay) return;

    const isTimeToChoose = (currentMode === 'solos' && bannedStages.length === 3) ||
                          (currentMode === 'crews' && bannedStages.length === 7) ||
                          (isCounterPick && currentMode === 'solos' && bannedStages.length === 2) ||
                          (isCounterPick && currentMode === 'crews' && bannedStages.length === 3);

    let remainingBans = '';
    
    if (!isTimeToChoose) {
      if (currentMode === 'solos') {
        if (isCounterPick) {
          const remainingWinnerBans = 2 - bannedStages.length;
          remainingBans = `Remaining Bans: ${remainingWinnerBans}`;
        } else {
          if (currentBanTurn === 0) {
            remainingBans = 'Home Player Bans: 1';
          } else {
            const remainingAwayBans = 2 - (bannedStages.length - 1);
            remainingBans = `Away Player Bans: ${remainingAwayBans}`;
          }
        }
      } else { // crews
        if (isCounterPick) {
          const remainingWinnerBans = 3 - bannedStages.length;
          remainingBans = `Remaining Bans: ${remainingWinnerBans}`;
        } else {
          if (currentBanTurn < 1) {
            remainingBans = 'Home Team Bans: 1';
          } else if (currentBanTurn < 3) {
            const remainingAwayBans = 2 - (bannedStages.length - 1);
            remainingBans = `Away Team Bans: ${remainingAwayBans}`;
          } else if (currentBanTurn < 5) {
            const remainingHomeBans = 2 - (bannedStages.length - 3);
            remainingBans = `Home Team Bans: ${remainingHomeBans}`;
          } else {
            const remainingAwayBans = 2 - (bannedStages.length - 5);
            remainingBans = `Away Team Bans: ${remainingAwayBans}`;
          }
        }
      }
    }

    // Add remaining bans display
    const bansSpan = document.createElement('span');
    bansSpan.classList.add('bans-remaining');
    bansSpan.textContent = remainingBans;

    // Set the main turn display text
    if (isTimeToChoose) {
      if (isCounterPick) {
        turnDisplay.textContent = `Select Your Stage - Losing ${currentMode === 'solos' ? 'Player' : 'Team'}`;
      } else {
        turnDisplay.textContent = `Select Your Stage - Home ${currentMode === 'solos' ? 'Player' : 'Team'}`;
      }
    } else {
      if (isCounterPick) {
        if (currentMode === 'solos') {
          turnDisplay.textContent = "Winning Player's Ban Turn";
        } else {
          if (bannedStages.length < 3) {
            turnDisplay.textContent = "Winning Team's Ban Turn";
          } else {
            turnDisplay.textContent = "Losing Team's Stage Selection";
          }
        }
      } else {
        const teamText = currentMode === 'solos' ? 'Player' : 'Team';
        if (currentTeam === 'home') {
          turnDisplay.textContent = `Home ${teamText}'s Turn`;
        } else {
          turnDisplay.textContent = `Away ${teamText}'s Turn`;
        }
      }
    }

    // Add the remaining bans span if there are bans to show
    if (remainingBans) {
      turnDisplay.appendChild(bansSpan);
    }
  }

  solosBtn.addEventListener('click', () => {
    currentMode = 'solos';
    solosBtn.classList.add('active');
    crewsBtn.classList.remove('active');
    reset();
  });

  crewsBtn.addEventListener('click', () => {
    currentMode = 'crews';
    crewsBtn.classList.add('active');
    solosBtn.classList.remove('active');
    reset();
  });

  undoBanBtn.addEventListener('click', undoBan);
  resetBtn.addEventListener('click', reset);

  firstTurnToggle.addEventListener('click', () => {
    isFirstTurn = !isFirstTurn;
    isCounterPick = !isFirstTurn; 

    const toggleSwitch = document.getElementById('toggle-switch');
    toggleSwitch.classList.toggle('active', isCounterPick);
    toggleSwitch.classList.toggle('first-turn', isFirstTurn);

    const mode = isCounterPick ? `counterpick${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}` : currentMode;
    initializeStages(mode);
    reset();
  });

  const initialMode = isCounterPick ? `counterpick${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}` : currentMode;
  initializeStages(initialMode);

  // Add initial turn display update
  updateTurnDisplay();
});