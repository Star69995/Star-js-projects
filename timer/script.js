let timerInterval;
let remainingTime = 0;  // Stores the remaining time in seconds
let isRunning = false;  // Tracks if the timer is currently running

// Format seconds into HH:MM:SS format
function formatTime(seconds) {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}

// // Function to play a beep sound using Web Audio API
// function playBeep() {
//     const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//     const oscillator = audioCtx.createOscillator();
//     const gainNode = audioCtx.createGain();

//     oscillator.connect(gainNode);
//     gainNode.connect(audioCtx.destination);

//     oscillator.type = 'sine';
//     oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);  // A4 note (440 Hz)
//     gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);  // Set volume

//     oscillator.start();
//     oscillator.stop(audioCtx.currentTime + 0.5);  // Stop after 0.5 seconds
// }



// Function to play a beep sound from a file
function playBeep() {
    const beepSound = document.getElementById('beepSound');
    beepSound.currentTime = 0; // Reset sound to start
    beepSound.play(); // Play the sound
}



// Start or resume the timer
function startTimer() {
    if (!isRunning && remainingTime > 0) {
        isRunning = true;
        timerInterval = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;  // Decrement remaining time
                document.querySelector('#timer span').textContent = formatTime(remainingTime);  // Update display
            } else {
                timerEnd();  // Stop when it reaches zero
            }
        }, 1000);  // Update every second
    }
}







function timerEnd() {
    stopTimer();  // Stop when it reaches zero
    playBeep();  // Play sound
    alert('ההפסקית הסתיימה!');
    
    // setVid();
    // // Get the video URL
    // let videoUrl = document.getElementById("videoUrl").value;

    // // Set the video URL
    // let videoPlayer = document.getElementById("videoPlayer");
    // videoPlayer.src = videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") + "?autoplay=1";

    // // Add event listener for error
    // videoPlayer.onerror = () => {
    //     window.open(videoUrl, "_blank"); // Open in a new tab if not available
    // };

    // // Play the video
    // videoPlayer.play();
}



// // Set video URL
// document.getElementById("setVideoButton").addEventListener('click', () => {
// setVid();
// });


// function setVid() {
//     let vidUrl = document.getElementById("videoUrl").value;

//     // If it's a YouTube URL, convert it to an embeddable URL
//     if (vidUrl.includes("youtube.com") || vidUrl.includes("youtu.be")) {
//         vidUrl = vidUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/");
//     }

//     // Set the video URL
//     document.getElementById("videoPlayer").src = vidUrl;
// }











// Stop the timer
function stopTimer() {
    clearInterval(timerInterval);  // Clear the interval
    isRunning = false;  // Set running to false
}

// Reset the timer
function resetTimer() {
    stopTimer();
    remainingTime = 0;  // Reset remaining time
    document.querySelector('#timer span').textContent = formatTime(remainingTime);  // Update display
}

// Additional functionality for preset times (20:00, 45:00 buttons)
document.querySelectorAll('.buttons button').forEach((button) => {
    button.addEventListener('click', () => {
        const timeInput = button.textContent;
        const [minutes, seconds] = timeInput.split(':').map(Number);  // Split by colon and parse
        remainingTime = (minutes * 60) + seconds;  // Convert to total seconds
        document.querySelector('#timer span').textContent = formatTime(remainingTime);  // Update display
        if (isRunning) stopTimer();  // Stop if running to avoid double intervals
    });
});

// Handling custom time input with the "זמן אחר" button
document.getElementById('customTimeButton').addEventListener('click', () => {
    const minutesInput = document.getElementById('minutes').value;  // Get minutes input
    const secondsInput = document.getElementById('seconds').value;  // Get seconds input

    const minutes = parseInt(minutesInput) || 0;  // Convert to integer, default to 0
    const seconds = parseInt(secondsInput) || 0;  // Convert to integer, default to 0

    if (minutes >= 0 && seconds >= 0 && seconds < 60) {
        remainingTime = (minutes * 60) + seconds;  // Convert to total seconds
        document.querySelector('#timer span').textContent = formatTime(remainingTime);  // Update display
        if (isRunning) stopTimer();  // Stop if running to avoid double intervals
    } else {
        alert("נא להזין זמן תקין");  // Alert for invalid input
    }
});

// Event listeners for start, stop, and reset buttons
document.getElementById('startButton').addEventListener('click', startTimer);  // Start
document.getElementById('stopButton').addEventListener('click', stopTimer);    // Stop
document.getElementById('resetButton').addEventListener('click', resetTimer);  // Reset

