// Tutorial overlay and instructions for Level 1

function drawTutorialOverlay() {
    console.log('Drawing tutorial overlay...');
    // Semi-transparent background
    push();
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    
    // Tutorial box (responsive)
    fill(22, 101, 52);
    stroke(74, 222, 128);
    strokeWeight(max(2, width * 0.002));

    // Size box relative to canvas
    let boxWidth = min(width * 0.86, 900);
    let boxHeight = min(height * 0.78, 720);
    let boxX = (width - boxWidth) / 2;
    let boxY = (height - boxHeight) / 2;
    rect(boxX, boxY, boxWidth, boxHeight, 10);

    // Title (scaled)
    fill(74, 222, 128);
    textAlign(CENTER, TOP);
    textSize(constrain(boxWidth * 0.05, 20, 48));
    textStyle(BOLD);
    text('🎮 GAME TUTORIAL', width / 2, boxY + boxHeight * 0.04);

    // Instructions (responsive sizes)
    fill(255);
    textSize(constrain(boxWidth * 0.02, 12, 20));
    textStyle(NORMAL);
    textAlign(LEFT, TOP);
    let instructionX = boxX + boxWidth * 0.06;
    let instructionY = boxY + boxHeight * 0.18;
    let lineGap = boxHeight * 0.14;  // Increased from 0.095 to 0.14 for more spacing

    // Max width for wrapped text
    let wrapW = boxWidth - (boxWidth * 0.12);

    text('📍 OBJECTIVE:', instructionX, instructionY);
    text('Collect golden food to grow your snake', instructionX + boxWidth * 0.03, instructionY + (boxHeight * 0.035), wrapW);

    instructionY += lineGap;
    text('🖱️  CONTROLS:', instructionX, instructionY);
    text('Move your snake with your MOUSE', instructionX + boxWidth * 0.03, instructionY + (boxHeight * 0.035), wrapW);

    instructionY += lineGap;
    text('⚠️  AVOID:', instructionX, instructionY);
    text('Obstacles (rocks) & Enemy Snakes = GAME OVER', instructionX + boxWidth * 0.03, instructionY + (boxHeight * 0.035), wrapW);

    instructionY += lineGap;
    text('🎯 TARGET:', instructionX, instructionY);
    let levelData = getCurrentLevelData();
    text('Collect ' + levelData.targetScore + ' food to complete this level!', instructionX + boxWidth * 0.03, instructionY + (boxHeight * 0.035), wrapW);

    // Ready button (responsive)
    let btnWidth = constrain(boxWidth * 0.26, 140, 260);
    let btnHeight = constrain(boxHeight * 0.08, 44, 72);
    let btnX = boxX + (boxWidth - btnWidth) / 2;
    let btnY = boxY + boxHeight - (btnHeight + boxHeight * 0.05);

    // Button background
    fill(74, 222, 128);
    stroke(255);
    strokeWeight(2);
    rect(btnX, btnY, btnWidth, btnHeight, 8);

    // Button text
    fill(0);
    textSize(constrain(btnHeight * 0.45, 16, 28));
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text('GOT IT! ➜', btnX + btnWidth / 2, btnY + btnHeight / 2);
    
    pop();
    
    // Store button coordinates for click detection
    window.tutorialBtnX = btnX;
    window.tutorialBtnY = btnY;
    window.tutorialBtnW = btnWidth;
    window.tutorialBtnH = btnHeight;
}

function mousePressed() {
    if (showTutorialOverlay && window.tutorialBtnX !== undefined) {
        if (mouseX > window.tutorialBtnX && mouseX < window.tutorialBtnX + window.tutorialBtnW &&
            mouseY > window.tutorialBtnY && mouseY < window.tutorialBtnY + window.tutorialBtnH) {
            showTutorialOverlay = false;
            // Start the level timer now that the player dismissed the tutorial
            if (typeof gameStartTime !== 'undefined') {
                gameStartTime = millis();
                timeElapsed = 0;
            }
            return false; // Prevent default behavior
        }
    }
}
