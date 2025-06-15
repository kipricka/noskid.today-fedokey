//Again.js | Noskid.. in noskid ? maybe in noskid too.

function againAndAgain() {
    const iframe = `<iframe style="width: 100%; height: 100%; border: none;" src="https://light.noskid.today"></iframe>`

    const win = ClassicWindow.createWindow({
        title: `${window.location.hostname}`,
        content: iframe,
        width: 900,
        height: 700,
        x: Math.round((window.innerWidth - 900) / 2),
        y: Math.round((window.innerHeight - 700) / 2),
        theme: 'dark',
        icon: "https://light.noskid.today/favicon.svg",
        statusText: "Why?.."
    });

    log('Noskid window created, but why?', 'success');
}