import asyncio
import websockets
import json
import logging

COLS = 10
ROWS = 10
users = {}


async def register(ws):
    i, j = len(users) // 5, len(users) % 5
    users[ws] = {'i': i, 'j': j}
    await notify_users()


async def unregister(ws):
    del users[ws]
    await notify_users()


def users_event(u):
    return json.dumps({
        'position': users[u],
        'others': [
            v for k, v in users.items() if k != u
        ],
    })


async def notify_users():
    if users:  # asyncio.wait doesn't accept an empty list
        await asyncio.wait([
            user.send(users_event(user)) for user in users
        ])


async def handle(ws, path):
    await register(ws)
    try:
        async for msg in ws:
            msg = json.loads(msg)

            if 'move' in msg:
                if ws not in users:
                    await ws.send(json.dumps({
                        'error': 'User was not initialized'
                    }))
                position = users[ws]
                dir = msg['move']
                if dir == 'up':
                    position['i'] -= 1
                elif dir == 'down':
                    position['i'] += 1
                elif dir == 'left':
                    position['j'] -= 1
                elif dir == 'right':
                    position['j'] += 1

                position['i'] %= ROWS
                position['j'] %= COLS
                users[ws] = position
                await notify_users()
            else:
                logging.error("unsupported event: {}", msg)
    finally:
        await unregister(ws)


print('Starting server: ws://localhost:80')
asyncio.get_event_loop().run_until_complete(
    websockets.serve(handle, 'localhost', 80))
asyncio.get_event_loop().run_forever()
