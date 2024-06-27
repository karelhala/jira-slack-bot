
const LIST_PROJECTS = '/rest/api/2/project';
const ISSUE_TYPES = `/rest/api/2/issue/createmeta/{projectIdOrKey}/issuetypes`;
const FIELDS = '/rest/api/2/issue/createmeta/{projectIdOrKey}/issuetypes/{issueTypeId}';
const SUGGESTIONS = '/rest/api/2/jql/autocompletedata/suggestions';
const SEARCH = '/rest/api/2/search'
const ISSUE = '/rest/api/2/issue/';

const nodeFetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

const replacer = (string, replaceWith) => {
  return string.split('{').map((item) => item.split('}')).reduce((acc, curr) => {
    let adder = curr;
    if (curr.length > 1) {
        adder = `${replaceWith[curr[0]] || ''}${curr[1]}`;
    }
    return `${acc}${adder}`;
}, '')
}

function JiraBot(token, baseUrl, proxy) {
  let proxyAgent;
  if (proxy) {
    proxyAgent = new HttpsProxyAgent(proxy);
  }
  const fetcher = (url, urlParams, method = 'GET', data) => nodeFetch(`${baseUrl}${replacer(url, urlParams)}`, {
    "credentials": "include",
    "headers": {
        'Accept': 'application/json',
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    ...proxy && {agent: proxyAgent},
    "method": method,
    ...data ? {body: data} : {}
  }).then(async (data) => {
    if (data.status === 200 || data.status === 201) {
      return await data.json();
    } else {
      console.log(data);
      console.log(data.statusText);
      return {};
    }
  });
  this.token = token;
  this.baseUrl = baseUrl;
  this.fetcher = fetcher;
  this.proxyAgent = proxyAgent;
};

JiraBot.prototype.getProjectByName = async function(project) {
  const allProjects = await this.fetcher(LIST_PROJECTS);
  return (await allProjects).find(({ key }) => key === project);
}

JiraBot.prototype.issueTypesForProject = async function (project){
  const currProject = await this.getProjectByName(project);
  const issueTypes = await this.fetcher(ISSUE_TYPES, {projectIdOrKey: currProject.id});
  return issueTypes;
}

JiraBot.prototype.getAllLabels = async function(value) {
  return await this.fetcher(`${SUGGESTIONS}?fieldName=labels&fieldValue=${value}`);
}

JiraBot.prototype.getAllEpics = async function(value) {
  return await this.fetcher(`${SEARCH}?jql=issueType = Epic AND summary ~ ${value}`);
}

JiraBot.prototype.createIssue = async function (data) {
  const jiraData = {
    fields: {
      project: {
        key: data.project
      },
      summary: data.summary_input,
      description: data.description_input,
      issuetype: {
        id: data.issue_type_select
      },
      labels: data.label_search
    }
  };
  const allFields = await this.fetcher(FIELDS, { projectIdOrKey: data.project, issueTypeId: data.issue_type_select });
  const epicLinkField = allFields.values.find(({ name }) => name.includes('Epic'));
  if (epicLinkField) {
    jiraData.fields[epicLinkField.fieldId] = data.epic_search;
  }
  console.log(JSON.stringify(jiraData));
  try {
    return this.fetcher(ISSUE, {}, 'POST', JSON.stringify(jiraData));
  } catch (e) {
    console.log(e);
  }
}

const formatter = {
  bold: (value) => `*${value}*`,
  italic: (value) => `_${value}_`,
  strike: (value) => `-${value}-`,
  rich_text_quote: (value) => `{quote}${value}{quote}`,
  link: (value, href) => {
    if (!/http[s]:\/\//.test(href))
    {
      return `[${value}|http://${href}]`
    }
    return `[${value}|${href}]`
  },
  code: (value) => `{noformat}\n${value}\n{noformat}`,
}
const formatMapper = (text, style) => {
  return Object.keys(style).reduce((acc, curr) => {
      return formatter[curr]?.(acc) || `${curr}${acc}`;
  }, text)
}

const richTextFormatter = (data, prepend) => {
  return data.elements.map(({type = '', elements, style = '', indent = 0}) => {
    if (type === 'rich_text_list') {
        return richTextFormatter({ elements, type: '', style: '' }, style === 'bullet' ? `${'*'.repeat(indent + 1)} ` : `${'#'.repeat(indent + 1)} `);
    }
    return elements.map((item) => formatMapper(item.type === 'link' ? formatter.link(item.text, item.url) : item.text, {
            ...type === 'rich_text_quote' ? {rich_text_quote: true} : {},
            ...type === 'rich_text_preformatted' ? {code: true} : {},
            ...item.style || {},
            ...prepend ? { [prepend]: true } : {},
        })).join('\n')
}).join('\n')
}

module.exports = {
  JiraBot,
  richTextFormatter,
  LIST_PROJECTS,
};
