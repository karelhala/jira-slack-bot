// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");
const { config } = require('dotenv');
const { JiraBot, richTextFormatter: jiraRichTextFormatter } = require('./jira');
const frontendBug = require('./templates/frontendBug');

config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode:true, // enable to use socket mode
  appToken: process.env.APP_TOKEN
});

// All the room in the world for your code

const jira = new JiraBot(process.env.JIRA_STAGE_TOKEN, 'https://issues.stage.redhat.com', 'http://squid.corp.redhat.com:3128');

// Post a message to a channel your app is in using ID and message text
async function publishMessage({id, text, user, blocks}) {
  try {
    // Call the chat.postMessage method using the built-in WebClient
    const result = await app.client.chat.postEphemeral({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN,
      channel: id,
      text,
      user,
      blocks,
      // You could also use a blocks[] array to send richer content
    });

    // Print result, which includes information about the message (like TS)
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
}

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);
  
  // app.event('message', async ({ event, client, context }) => {
  //   console.log('I was called!', event, client, context);
  // });
  
  // app.event('app_mention', async ({ event, client, context }) => {
  //   console.log('I was mentioned!', event, client, context);
  //   const response = await client.views.open({
  //     interactivity_pointer: inputs.interactivity.interactivity_pointer,
  //     view: {
  //       "type": "modal",
  //       // Note that this ID can be used for dispatching view submissions and view closed events.
  //       "callback_id": "first-page",
  //       // This option is required to be notified when this modal is closed by the user
  //       "notify_on_close": true,
  //       "title": { "type": "plain_text", "text": "My App" },
  //       "submit": { "type": "plain_text", "text": "Next" },
  //       "close": { "type": "plain_text", "text": "Close" },
  //       "blocks": [
  //         {
  //           "type": "input",
  //           "block_id": "first_text",
  //           "element": { "type": "plain_text_input", "action_id": "action" },
  //           "label": { "type": "plain_text", "text": "First" },
  //         },
  //       ],
  //     },
  //   });
  //   if (response.error) {
  //     const error =
  //       `Failed to open a modal in the demo workflow. Contact the app maintainers with the following information - (error: ${response.error})`;
  //     return { error };
  //   }
  //   return {
  //     // To continue with this interaction, return false for the completion
  //     completed: false,
  //   };
  // });
  
  console.log('⚡️ Bolt app is running!');
})();

// app.event('app_home_opened', async ({ event, client, context }) => {
//   try {
//     /* view.publish is the method that your app uses to push a view to the Home tab */
//     const result = await client.views.publish({

//       /* the user that opened your app's app home */
//       user_id: event.user,

//       /* the view object that appears in the app home*/
//       view: {
//         type: 'home',
//         callback_id: 'home_view',

//         /* body of the view */
//         blocks: [
//           {
//             "type": "section",
//             "text": {
//               "type": "mrkdwn",
//               "text": "*Welcome to your _App's Home tab_* :tada:"
//             }
//           },
//           {
//             "type": "divider"
//           },
//           {
//             "type": "section",
//             "text": {
//               "type": "mrkdwn",
//               "text": "This button won't do much for now but you can set up a listener for it using the `actions()` method and passing its unique `action_id`. See an example in the `examples` folder within your Bolt app."
//             }
//           },
//           {
//             "type": "actions",
//             "elements": [
//               {
//                 "type": "button",
//                 "text": {
//                   "type": "plain_text",
//                   "text": "Click me!"
//                 }
//               }
//             ]
//           }
//         ]
//       }
//     });
//   }
//   catch (error) {
//     console.error(error);
//   }
// });

app.command('/ticket', async ({ack, body, client, logger}) => {
  // Acknowledge the command request
  await ack();

  //           /ticket RHCLOUD

  try {
    const project = body.text.split(' ')[0];
    const allIssuTypes = await jira.issueTypesForProject(project);
    // Call views.open with the built-in client
    // const result = await client.views.open({
    //   // Pass a valid trigger_id within 3 seconds of receiving it
    //   trigger_id: body.trigger_id,
    //   // View payload
    //   view: {
    //     type: 'modal',
    //     // View identifier
    //     callback_id: 'view_1',
    //     title: {
    //       type: 'plain_text',
    //       text: 'Modal title'
    //     },
    //     blocks: [
    //       {
    //         type: 'section',
    //         text: {
    //           type: 'mrkdwn',
    //           text: 'Welcome to a modal with _blocks_'
    //         },
    //         accessory: {
    //           type: 'button',
    //           text: {
    //             type: 'plain_text',
    //             text: 'Click me!'
    //           },
    //           action_id: 'button_abc'
    //         }
    //       },
    //       {
    //         type: 'input',
    //         block_id: 'input_c',
    //         label: {
    //           type: 'plain_text',
    //           text: 'What are your hopes and dreams?'
    //         },
    //         element: {
    //           type: 'plain_text_input',
    //           action_id: 'dreamy_input',
    //           multiline: true
    //         }
    //       }
    //     ],
    //     submit: {
    //       type: 'plain_text',
    //       text: 'Submit'
    //     }
    //   }
    // });
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'view_1',
        ...frontendBug(project, allIssuTypes.values, body.channel_name, body.user_id),
      }
    });

    ack({
      response_action: 'errors',
      errors: {
        field: 'error'
      }
    });
    logger.info(result);
  }
  catch (error) {
    logger.error(error.data.response_metadata);
  }
});

app.options({ action_id: 'label_search' }, async ({ ack, body }) => {
  const labels = await jira.getAllLabels(body.value || '');
  await ack({
    options: labels.results.map(({ value }) => ({
      text: {
        type: "plain_text",
        text: value,
      },
      value
    }))
  })
});

app.options({ action_id: 'epic_search' }, async ({ ack, body }) => {
  const epics = await jira.getAllEpics(body.value || '');
  await ack({
    options: epics.issues.map(({ fields: { summary }, id }) => ({
      text: {
        type: "plain_text",
        text: summary,
      },
      value: id
    }))
  })
});

app.view('view_1', async ({ ack, body, view, client, logger }) => {
  ack();

  const privateMetadata = JSON.parse(view.private_metadata);
  const values = Object.values(view.state.values).map((item) => {
    const currKey = Object.keys(item)[0];
    let currValue = item[currKey].value || item[currKey].selected_option?.value || item[currKey].selected_options;
    if (item[currKey].rich_text_value) {
      currValue = jiraRichTextFormatter(item[currKey].rich_text_value)
    }
    return ({
      [currKey]: Array.isArray(currValue) ? currValue.map(({value}) => value) : currValue
    })});
  const ticket = await jira.createIssue([ ...values, ...[privateMetadata] ].reduce((acc, curr) => ({...acc, ...curr}), {}));
  publishMessage({
    id: privateMetadata.channel_name,
    text: `Hey! I've create new JIRA ticket <${ticket.self}|${ticket.key}> for you!`,
    user: privateMetadata.user_id
  })
})
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
