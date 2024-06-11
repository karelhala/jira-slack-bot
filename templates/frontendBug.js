module.exports = (project, issueTypes, channel_name, user_id) => ({
  private_metadata: `{\"project\":\"${project}\", \"channel_name\": \"${channel_name}\", \"user_id\": \"${user_id}\"}`,
  title: {
    type: 'plain_text',
    text: `${project} - issue`
  },
  blocks: [{
    type: 'input',
    dispatch_action: true,
    block_id: 'issue_type_select',
    optional: true,
    label: {
      type: 'plain_text',
      text: 'Issue type'
    },
    element: {
      type: 'static_select',
      placeholder: {
        type: 'plain_text',
        text: 'Select issue type'
      },
      options: issueTypes.map((item) => ({
        text: {
          type: 'plain_text',
          text: `${item.name}`
        },
        value: item.id
      })),
      action_id: 'issue_type_select'
    }
  }, {
    type: 'input',
    block_id: 'summary',
    optional: true,
    label: {
      type: 'plain_text',
      text: 'Summary'
    },
    element: {
      type: 'plain_text_input',
      action_id: 'summary_input',
    }
  },
  {
    type: 'input',
    optional: true,
    block_id: 'description',
    label: {
      type: 'plain_text',
      text: 'description'
    },
    element: {
      type: 'rich_text_input',
      action_id: 'description_input'
    }
  },
  {
    type: "input",
    optional: true,
    block_id: 'label_search',
    element: {
      type: "multi_external_select",
      action_id: "label_search",
      placeholder: {
        type: "plain_text",
        text: "Search labels by name...",
      },
    },
    label: {
      type: "plain_text",
      text: "Label",
    },
  },
  {
    type: "input",
    optional: true,
    block_id: 'epic_search',
    element: {
      type: "external_select",
      action_id: "epic_search",
      placeholder: {
        type: "plain_text",
        text: "Search epics by name...",
      },
    },
    label: {
      type: "plain_text",
      text: "Label",
    },
  }],
  submit: {
    type: 'plain_text',
    text: 'Submit'
  }
})
