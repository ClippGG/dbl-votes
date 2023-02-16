# dbl-votes

This is a Node.js package that allows you to listen for vote events from the Top.gg API and easily store them in a database.

## Installation

To use this package, you first need to install it using npm:
```
npm install dbl-votes
```

## Usage

To use the package, you need to require it and create a new instance of the `TopggClient` class. You can then listen for vote events and debug messages by registering event handlers with the `on` method.

```js
const TopggClient = require("dbl-votes");

const topgg = new TopggClient({
  port: 3000,
  path: "/vote",
  mongo: {
    url: "mongodb://localhost:27017",
    db: "bot",
    collection: "votes"
  },
  debug: true
});

topgg.on("vote", (bot, user) => {
  console.log(`${user} voted for ${bot}`);
});

topgg.on("debug", (msg) => {
  console.log(msg);
});
```

## Configuration

When creating a new `TopggClient` instance, you can pass in a configuration object with the following properties:
* `port` (number, required): The port that the server should listen on.
* `path` (string, required): The path that the top.gg API will send vote events to.
* `auth` (string, optional): The authorization token that the top.gg API will send with vote events. If this is not specified, the server will not require authorization.

* `mongo` (object, optional): Configuration for storing votes in a MongoDB database. The object should have the following properties:
* `url` (string, required): The URL of the MongoDB server.
* `db` (string, required): The name of the database to use.
* `collection` (string, required): The name of the collection to use.

* `supabase` (object, optional): Configuration for storing votes in a Supabase database. The object should have the following properties:
* `url` (string, required): The URL of the Supabase server.
* `key` (string, required): The API key to use.
* `table` (string, required): The name of the table to use.

* `debug` (boolean, optional): Whether to enable debug messages. Defaults to false.

## Events

The `TopggClient` class emits the following events:
* `vote` (bot: string, user: string): Emitted when a vote is received from the Top.gg API. The bot parameter is the ID of the bot that was voted for, and the user parameter is the ID of the user who voted.
* `debug` (msg: string): Emitted when a debug message is generated. The msg parameter is the message that was generated. This event is only emitted if the debug option is enabled.
