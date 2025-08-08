// Sstv.js | Slow Scan Television :3

function showSstv() {
    const win = ClassicWindow.createWindow({
        title: 'Oh ?',
        content: 'Try to find the secret certificate ;)',
        x: Math.round((window.innerWidth - 600) / 2),
        y: Math.round((window.innerHeight - 450) / 2),
        theme: 'dark',
        resizable: true,
        onClose: function () {
            audio.pause();
            audio.currentTime = 0;
            audio.remove();
        }
    });

    const sstvAudio = document.createElement('audio');
    sstvAudio.src = 'assets/audio/nskdsstv.mp3';
    sstvAudio.loop = true;
    sstvAudio.style.display = 'none';
    win.appendChild(sstvAudio);

    sstvAudio.play();
}