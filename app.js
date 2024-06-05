// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");
const { config } = require('dotenv');

config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});



// All the room in the world for your code



(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

app.event('message', async ({ event, client, context }) => {
  console.log('I was called!', event, client, context);
});

app.event('app_mention', async ({ event, client, context }) => {
  console.log('I was mentioned!', event, client, context);
});
