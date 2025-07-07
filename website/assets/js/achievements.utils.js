//Achievements.utils.js | utilities for achievements management


// Screen Wizard \\

let resizeCount = 0;
let resizeTimeouta = null; // 'a' cuz resizeTimeout is already used in night.js ( idk why )

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeouta);

  resizeTimeouta = setTimeout(() => {
    if (resizeCount === 0) startAchievement('Screen Wizard');
    resizeCount++;

    //log(`Resize count: ${resizeCount}`, 'success'); //only for debug so it doesnt flood the console

    if (resizeCount === 25) {
      addAchievement('Screen Wizard');
    }
  }, 100);
});

// Screen Wizard \\

// Speed Clicker \\

let clickCount = 0;
let clickStartTime = null;
let clickTimer = null;
let speedClickerStarted = false;

window.addEventListener('click', () => {
  const now = Date.now();

  if (!clickStartTime) {
    clickStartTime = now;

    if (!speedClickerStarted) {
      startAchievement('Speed Clicker');
      speedClickerStarted = true;
    }

    clickTimer = setTimeout(() => {
      clickCount = 0;
      clickStartTime = null;
    }, 10000);
  }

  clickCount++;

  if (clickCount >= 50 && (now - clickStartTime <= 10000)) {
    addAchievement('Speed Clicker');

    clearTimeout(clickTimer);
    clickCount = 0;
    clickStartTime = null;
  }
});


// Speed Clicker \\


// Marathon Runner \\

//this has not been tested, obv
let marathonAchievementGiven = false;
const marathonStart = Date.now();
startAchievement('Marathon Runner');

const marathonCheckInterval = setInterval(() => {
    if (marathonAchievementGiven) {
        clearInterval(marathonCheckInterval);
        return;
    }

    const elapsed = Date.now() - marathonStart;
    if (elapsed >= 2 * 60 * 60 * 1000) { // 2 hours in milliseconds
        marathonAchievementGiven = true;
        addAchievement('Marathon Runner');
        clearInterval(marathonCheckInterval);
    }
}, 60 * 1000);

// Marathon Runner \\
