# Global Chat App

Global Chat is a real-time public chat application built with React, Redux Toolkit, Tailwind CSS, Express, and Socket.IO. Users enter a username, join a shared global room, exchange messages instantly, see who is online, and get live typing and join/leave updates.

## Project Structure

```text
ChatApp/
  backend/
    server.js
    utils/validateUsername.js
  frontend/
    socket/webSocket.js
    src/
      App.jsx
      Layout.jsx
      pages/
        Login.jsx
        GlobalChat.jsx
      components/
        MoreInfo.jsx
      redux/
        slice.js
        store.js
      utils/validateUsername.js
```

## Tech Stack

**Frontend**

- React 19
- Vite
- React Router
- Redux Toolkit and React Redux
- Socket.IO Client
- Tailwind CSS
- React Hot Toast
- SweetAlert2
- React Icons

**Backend**

- Node.js
- Express
- Socket.IO
- CORS
- dotenv

## Frontend Features

### Username Login

The app starts at `/login` when no username is stored in Redux state. The login page validates the username before joining the chat. It checks that the username is present, follows the allowed pattern, and is not a reserved word such as `admin`, `server`, or `moderator`.

When the user clicks **Enter Chat** or presses `Enter`, the frontend connects to the Socket.IO server and emits `joinRoom` with the username. The server responds with an acknowledgement containing the current online users and a join notification message.

### Global Chat Room

The main `/` route renders the global chat interface. It shows:

- The Global Chat header and active user summary.
- A scrollable message area.
- Current user's messages aligned separately from other users' messages.
- Sender names for messages from other users.
- Message timestamps formatted on the client.
- Server notification messages for join and leave events.
- A text input area and send button.

Messages can be sent by clicking the send button or pressing `Enter`. Pressing `Shift + Enter` keeps the newline behavior available for writing longer messages.

### Real-Time Messaging

The frontend emits `ChatMessage` when a valid message is sent. The backend validates and broadcasts it back as `msg`, so all connected clients receive the same server-approved message object.

The client limits outgoing message text to 500 characters and shows a toast when the user reaches the limit.

### Typing Indicator

The chat screen emits:

- `typing` while the user is actively typing.
- `stopTyping` when the input is cleared or after a short idle delay.

Incoming typing events are displayed as a live typing indicator. Multiple typers are grouped into a compact message when several users are typing at once.

### Connection and Reconnection Handling

The Socket.IO client is configured with:

- `autoConnect: false`
- automatic reconnection enabled
- 5 reconnect attempts
- 1 second reconnect delay

The UI uses toast notifications for server unavailable, disconnected, reconnecting, and reconnected states. When a reconnect succeeds, the client emits `joinRoom` again with the existing username so it can rejoin the global room and refresh the online users list.

If all reconnect attempts fail, SweetAlert2 shows a retry dialog.

### Online Users Sidebar

Clicking the chat header opens the `MoreInfo` sidebar. It includes:

- Logged-in username.
- Online users count.
- Expandable list of active users.
- Theme setting.
- Clear chat action.
- Leave chat action.
- Public-chat privacy notice.
- About links for GitHub and LinkedIn.

### Theme Support

The app stores a boolean theme value in Redux and toggles the `dark` class at the page level. CSS variables in `index.css` define light and dark color tokens for the chat page, messages, inputs, borders, typing indicator, and status colors.

### Local Chat Clearing

The **Clear Chat** action clears messages from the current user's Redux state only. It does not delete messages for other connected users because the backend does not store chat history.

### Leave Chat

The **Leave Chat** action asks for confirmation, emits `leaveChat`, disconnects the socket, resets Redux chat state, and navigates back to `/login`.

## Frontend State Management

Redux Toolkit stores the main chat state:

- `userName`: current logged-in user.
- `users`: other online users.
- `theme`: current theme flag.
- `messages`: local message list.

Important reducers:

- `addUser`: stores the logged-in username.
- `addMessage`: appends a chat or notification message.
- `setUsers`: replaces the online users list while excluding the current user.
- `newUser`: adds a newly joined user if not already present.
- `userLeft`: removes a user from the online users list.
- `clearMessages`: clears local messages.
- `changeTheme`: toggles light/dark theme.
- `reset`: clears chat session state on logout.

## Backend Socket.IO Documentation

The backend is intentionally simple and centered around Socket.IO. Express is used to create an HTTP server, configure CORS, expose a health check, and attach the Socket.IO server.

### Server Setup

`backend/server.js` creates:

- an Express app
- an HTTP server with `createServer(app)`
- a Socket.IO server attached to the HTTP server
- one shared room named `globalChat`
- an in-memory `users` array

The server reads:

- `PORT`: backend port, defaulting to `4600`
- `CLIENT_URL`: allowed frontend origin for CORS
- `NODE_ENV`: environment name, defaulting to `development`

### Room Model

All chat users join the same Socket.IO room:

```js
const ROOM = "globalChat";
```

There are no private rooms, channels, or persisted conversations. The app behaves as one public global room.

### In-Memory User Presence

The backend tracks online usernames in:

```js
let users = [];
```

Usernames are compared case-insensitively when joining, so `Swapnil` and `swapnil` cannot both join at the same time. The original casing is kept for display.

Because this presence list is stored in memory:

- it resets when the backend restarts
- it works for a single server process
- it is not shared across multiple backend instances

### Socket Events

#### `connection`

Fired when a browser establishes a Socket.IO connection.

The server creates per-socket local variables:

- `user`: the username assigned after `joinRoom`
- `hasLeft`: prevents duplicate leave handling

#### `joinRoom`

Client emits:

```js
userSocket.timeout(5000).emit("joinRoom", userName, callback);
```

Server responsibilities:

- validate the username
- reject reserved or invalid usernames
- reject usernames already active in the room
- assign the username to the socket
- join the socket to `globalChat`
- add the username to the in-memory users list
- return an acknowledgement to the joining client
- broadcast `newUser` to everyone else in the room

Success acknowledgement shape:

```js
{
  success: true,
  users: ["User1", "User2"],
  msg: {
    sender: "server",
    type: "notify",
    id: "...",
    ts: 123456789,
    text: "joined the chat",
    user: "User1"
  }
}
```

Failure acknowledgement shape:

```js
{
  success: false,
  message: "Invalid Username"
}
```

or:

```js
{
  success: false,
  message: "Username Unavailable"
}
```

#### `newUser`

Server broadcasts to all users except the joining socket:

```js
socketObj.to(ROOM).emit("newUser", userName, msg);
```

The frontend uses this to add the new user to the online list and show a join notification.

#### `ChatMessage`

Client emits a message object:

```js
{
  sender: userName,
  type: "msg",
  id: "...",
  ts: Date.now(),
  text: "Hello"
}
```

Server validation checks:

- sender matches the username assigned to that socket
- sender exists in the active users list
- text is a non-empty string
- trimmed text is no longer than 500 characters
- type is `msg`
- timestamp and id are present

If valid, the server broadcasts a sanitized message to the whole room:

```js
socketIoServer.to(ROOM).emit("msg", {
  id: "...",
  ts: Date.now(),
  sender: user,
  text: msg.text.trim(),
  type: "msg"
});
```

#### `msg`

Broadcast from the backend to all users in `globalChat` after a valid `ChatMessage`.

The frontend appends this message to Redux and renders it in the chat feed.

#### `typing`

Client emits:

```js
userSocket.emit("typing", userName);
```

Server forwards it to every other user in the room:

```js
socketObj.to(ROOM).emit("typing", userName);
```

#### `stopTyping`

Client emits:

```js
userSocket.emit("stopTyping", userName);
```

Server forwards it to every other user in the room:

```js
socketObj.to(ROOM).emit("stopTyping", userName);
```

#### `leaveChat`

Client emits this when the user intentionally leaves from the sidebar.

The server:

- removes the user from the `users` array
- leaves the Socket.IO room
- broadcasts `userLeft` to remaining users
- prevents duplicate leave events using `hasLeft`

#### `disconnect`

When a socket disconnects unexpectedly or normally, the server runs the same leave logic as `leaveChat`.

#### `userLeft`

Server emits:

```js
socketObj.to(ROOM).emit("userLeft", {
  msg: {
    sender: "server",
    type: "notify",
    id: "...",
    ts: Date.now(),
    text: `${user} Left the chat`
  },
  user
});
```

The frontend removes that user from the online list and displays the leave notification.

## Backend Health Check

The backend exposes:

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": 123456789
}
```

## Environment Variables

### Backend `.env`

```env
PORT=4600
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend `.env`

```env
VITE_SERVER_URL=http://localhost:4600
```

## Running Locally

Install and start the backend:

```bash
cd backend
npm install
npm start
```

Install and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Current Limitations

- Messages are not persisted in a database.
- Online users are stored in memory.
- The backend is designed for a single server instance.
- Clearing chat only clears the current browser's local Redux messages.
- There are no private messages or multiple rooms yet.
- Authentication is username-based only.

## Possible Future Improvements

- Store users in a `Map` or `Set` for faster lookup.
- Persist messages in a database.
- Add private rooms or direct messages.
- Extract Socket.IO event handlers into separate backend modules.
- Show username validation feedback below the input.
- Add an error boundary on the frontend.
- Add rate limiting or spam protection for messages and typing events.
- Deploy behind HTTPS for production.
