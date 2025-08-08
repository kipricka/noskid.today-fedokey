// Sstv.js | Slow Scan Television :3

function showSstv() {

    try {
        const win = ClassicWindow.createWindow({
            title: 'Oh ?',
            content: 'Try to find the secret certificate ;) Oh yea its Robot 36 Colors btw',
            x: Math.round((window.innerWidth - 600) / 2),
            y: Math.round((window.innerHeight - 450) / 2),
            theme: 'dark',
            resizable: true,
            onClose: function () {
                sstvAudio.pause();
                sstvAudio.currentTime = 0;
                sstvAudio.remove();
            }
        });

        const sstvAudio = document.createElement('audio');
        sstvAudio.src = 'assets/audio/nskdsstv.mp3';
        sstvAudio.loop = true;
        sstvAudio.style.display = 'none';
        win.appendChild(sstvAudio);

        sstvAudio.play();
    } catch (e) {
        log('Error with SSTV: ' + e.message, 'error');
    }
}