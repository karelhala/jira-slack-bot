
const LIST_PROJECTS = '/rest/api/2/project';
const ISSUE_TYPES = `/rest/api/2/issue/createmeta/{projectIdOrKey}/issuetypes`;
const FIELDS = '/rest/api/2/issue/createmeta/{projectIdOrKey}/issuetypes/{issueTypeId}';
const SUGGESTIONS = '/rest/api/2/jql/autocompletedata/suggestions';
const SEARCH = '/rest/api/2/search'

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
  const proxyAgent = new HttpsProxyAgent(proxy);
  const fatcher = (url, urlParams) => nodeFetch(`${baseUrl}${replacer(url, urlParams)}`, {
    "credentials": "include",
    "headers": {
        "Authorization": `Bearer ${token}`
    },
    ...proxy && {agent: proxyAgent},
    "method": "GET",
  }).then(async (data) => await data.json());
  this.token = token;
  this.baseUrl = baseUrl;
  this.fatcher = fatcher;
  this.proxyAgent = proxyAgent;
};

JiraBot.prototype.getProjectByName = async function(project) {
  const allProjects = await this.fatcher(LIST_PROJECTS);
  return (await allProjects).find(({ key }) => key === project);
}

JiraBot.prototype.issueTypesForProject = async function (project){
  const currProject = await this.getProjectByName(project);
  const issueTypes = await this.fatcher(ISSUE_TYPES, {projectIdOrKey: currProject.id});
  return issueTypes;
}

JiraBot.prototype.getAllLabels = async function(value) {
  return await this.fatcher(`${SUGGESTIONS}?fieldName=labels&fieldValue=${value}`);
}

JiraBot.prototype.getAllEpics = async function(value) {
  return await this.fatcher(`${SEARCH}?jql=issueType = Epic AND summary ~ ${value}`);
}

module.exports = {
  JiraBot,
  LIST_PROJECTS,
};
