// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");
const { config } = require('dotenv');
const https = require('https');
const nodeFetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

config();

const proxyAgent = new HttpsProxyAgent(`http://squid.corp.redhat.com:3128`);

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode:true, // enable to use socket mode
  appToken: process.env.APP_TOKEN
});

// All the room in the world for your code

nodeFetch("https://issues.stage.redhat.com/rest/api/2/project", {
    "credentials": "include",
    "headers": {
        "Authorization": `Bearer ${process.env.JIRA_STAGE_TOKEN}`
    },
    agent: proxyAgent,
    "method": "GET",
}).then(async (data) => {
  console.log(data.status)
  console.log(await data.json());
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  app.message("hey", async ({ command, say }) => {
    try {
      say("Hello Human!");
    } catch (error) {
        console.log("err")
      console.error(error);
    }
  });
  
  app.event('message', async ({ event, client, context }) => {
    console.log('I was called!', event, client, context);
  });
  
  app.event('app_mention', async ({ event, client, context }) => {
    console.log('I was mentioned!', event, client, context);
    const response = await client.views.open({
      interactivity_pointer: inputs.interactivity.interactivity_pointer,
      view: {
        "type": "modal",
        // Note that this ID can be used for dispatching view submissions and view closed events.
        "callback_id": "first-page",
        // This option is required to be notified when this modal is closed by the user
        "notify_on_close": true,
        "title": { "type": "plain_text", "text": "My App" },
        "submit": { "type": "plain_text", "text": "Next" },
        "close": { "type": "plain_text", "text": "Close" },
        "blocks": [
          {
            "type": "input",
            "block_id": "first_text",
            "element": { "type": "plain_text_input", "action_id": "action" },
            "label": { "type": "plain_text", "text": "First" },
          },
        ],
      },
    });
    if (response.error) {
      const error =
        `Failed to open a modal in the demo workflow. Contact the app maintainers with the following information - (error: ${response.error})`;
      return { error };
    }
    return {
      // To continue with this interaction, return false for the completion
      completed: false,
    };
  });
  
  console.log('⚡️ Bolt app is running!');
})();

app.event('app_home_opened', async ({ event, client, context }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({

      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view object that appears in the app home*/
      view: {
        type: 'home',
        callback_id: 'home_view',

        /* body of the view */
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Welcome to your _App's Home tab_* :tada:"
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "This button won't do much for now but you can set up a listener for it using the `actions()` method and passing its unique `action_id`. See an example in the `examples` folder within your Bolt app."
            }
          },
          {
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": "Click me!"
                }
              }
            ]
          }
        ]
      }
    });
  }
  catch (error) {
    console.error(error);
  }
});

app.command('/ticket', async ({ack, body, client}) => {
  // Acknowledge the command request
  await ack();

  try {
  // Call views.open with the built-in client
  const result = await client.views.open({
    // Pass a valid trigger_id within 3 seconds of receiving it
    trigger_id: body.trigger_id,
    // View payload
    view: {
      type: 'modal',
      // View identifier
      callback_id: 'view_1',
      title: {
        type: 'plain_text',
        text: 'Modal title'
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Welcome to a modal with _blocks_'
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Click me!'
            },
            action_id: 'button_abc'
          }
        },
        {
          type: 'input',
          block_id: 'input_c',
          label: {
            type: 'plain_text',
            text: 'What are your hopes and dreams?'
          },
          element: {
            type: 'plain_text_input',
            action_id: 'dreamy_input',
            multiline: true
          }
        }
      ],
      submit: {
        type: 'plain_text',
        text: 'Submit'
      }
    }
  });
  logger.info(result);
}
catch (error) {
  logger.error(error);
}
});

// Listen for a button invocation with action_id `button_abc` (assume it's inside of a modal)
app.action('button_abc', async ({ ack, body, client, logger }) => {
  // Acknowledge the button request
  await ack();
 
  try {
    // Call views.update with the built-in client
    const result = await client.views.update({
      // Pass the view_id
      view_id: body.view.id,
      // Pass the current hash to avoid race conditions
      hash: body.view.hash,
      // View payload with updated blocks
      view: {
        type: 'modal',
        // View identifier
        callback_id: 'view_1',
        title: {
          type: 'plain_text',
          text: 'Updated modal'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'You updated the modal!'
            }
          },
          {
            type: 'image',
            image_url: 'https://media.giphy.com/media/SVZGEcYt7brkFUyU90/giphy.gif',
            alt_text: 'Yay! The modal was updated'
          }
        ]
      }
    });
    logger.info(result);
  }
  catch (error) {
    logger.error(error);
  }
});
