const WIDTH = 400;
const HEIGHT = 400;

const ROWS = 10;
const COLS = 10;

const PADDING = 2;

const H = (HEIGHT - PADDING) / ROWS - PADDING;
const W = (WIDTH - PADDING) / COLS - PADDING;

const SOCKET = new WebSocket('ws://localhost:8765');

function init(cvs) {
    cvs.height = HEIGHT;
    cvs.width = WIDTH;
}


function toPixels({ i, j }) {
    return {
        x: j * (W + PADDING) + PADDING,
        y: i * (H + PADDING) + PADDING,
    };
}

let user
let others

function draw(ctx) {
    // Draw background
    ctx.fillStyle = '#191919';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw grid
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            let { x, y } = toPixels({ i, j });
            ctx.fillRect(x, y, W, H);
        }
    }

    // Draw other users
    if (others !== undefined) {
        ctx.fillStyle = '#FF0000';
        for (let u of others) {
            let { x, y } = toPixels(u);
            ctx.fillRect(x, y, W, H);
        }
    }

    // Draw user
    if (user !== undefined) {
        ctx.fillStyle = '#00FF00';
        let { x, y } = toPixels(user);
        ctx.fillRect(x, y, W, H);
    }

}

function update(dt) {
    // TODO
}

window.onload = () => {
    let cvs = document.createElement("canvas");
    document.body.appendChild(cvs);
    init(cvs);

    let ctx = cvs.getContext("2d");
    draw(ctx)

    let start = undefined;
    window.requestAnimationFrame(function step(ts) {
        if (start === undefined) start = ts;
        const dt = start - ts;

        update(dt);
        draw(ctx);

        window.requestAnimationFrame(step);
    });
}

SOCKET.addEventListener('message', e => {
    console.log(`Received: ${event.data}`);
    let msg = JSON.parse(event.data);
    user = msg.position;
    others = msg.others;
})


SOCKET.addEventListener('open', e => {
    console.log('socket opened');
    user = others = undefined;
})

SOCKET.addEventListener('close', e => {
    alert('Connection ended');
})

window.addEventListener('keydown', k => {
    let msg = {};
    switch (k.code) {
        case "KeyA": msg.move = 'left'; break;
        case "KeyD": msg.move = 'right'; break;
        case "KeyW": msg.move = 'up'; break;
        case "KeyS": msg.move = 'down'; break;
    }
    console.log(`Sending: ${msg}`)
    SOCKET.send(JSON.stringify(msg));
})
